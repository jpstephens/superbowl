import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

// Initialize Stripe lazily to avoid build-time errors
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const body = await request.json();
    const { selectedSquares, totalAmount, baseAmount, coversFee, feeAmount, displayName } = body;

    if (!selectedSquares || !totalAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!Array.isArray(selectedSquares) || selectedSquares.length === 0) {
      return NextResponse.json(
        { error: 'No squares selected' },
        { status: 400 }
      );
    }

    // Server-side price validation - fetch authoritative price from database
    const supabase = await createClient();
    const { data: priceSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'square_price')
      .single();

    const serverPrice = priceSetting?.value ? parseFloat(priceSetting.value) : 50;
    const squareCount = selectedSquares.length;
    const calculatedTotal = squareCount * serverPrice;

    // Calculate expected total (base + optional fee)
    const feeDonation = coversFee && feeAmount ? parseFloat(feeAmount) : 0;
    const expectedTotal = calculatedTotal + feeDonation;

    // Verify the amount matches (allow small floating point tolerance)
    if (Math.abs(expectedTotal - totalAmount) > 0.01) {
      console.error(`Payment amount mismatch: expected ${expectedTotal}, got ${totalAmount}`);
      return NextResponse.json(
        { error: 'Invalid payment amount' },
        { status: 400 }
      );
    }

    // Build line items - squares purchase + optional fee donation
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Super Bowl Pool Squares',
            description: `${squareCount} square${squareCount !== 1 ? 's' : ''} for the Michael Williams Memorial Scholarship Super Bowl Pool`,
          },
          unit_amount: Math.round(calculatedTotal * 100), // Stripe uses cents
        },
        quantity: 1,
      },
    ];

    // Add fee donation as separate line item if user opted in
    if (coversFee && feeDonation > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Processing Fee Donation',
            description: 'Optional donation to cover card processing fees - 100% goes to the scholarship fund',
          },
          unit_amount: Math.round(feeDonation * 100),
        },
        quantity: 1,
      });
    }

    // Create the Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      // Collect customer info on Stripe's checkout page
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/`,
      metadata: {
        selected_squares: JSON.stringify(selectedSquares.map((sq: any) => sq.id)),
        square_count: squareCount.toString(),
        base_amount: calculatedTotal.toString(),
        fee_donation: feeDonation.toString(),
        covers_fee: coversFee ? 'true' : 'false',
        display_name: displayName || '',
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Stripe checkout session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
