import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { selectedSquares, registrationData, totalAmount, baseAmount, transactionFee, coverFees } = body;

    if (!selectedSquares || !registrationData || !totalAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build line items - separate squares and optional fee
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Super Bowl Pool Squares',
            description: `${selectedSquares.length} square(s) at $50 each`,
          },
          unit_amount: (baseAmount || totalAmount) * 100, // Stripe uses cents
        },
        quantity: 1,
      },
    ];

    // Add transaction fee as separate line item if user chose to cover it
    if (coverFees && transactionFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Transaction Fee (Thank you!)',
            description: 'Covering Stripe processing fees to support the scholarship fund',
          },
          unit_amount: Math.round(transactionFee * 100), // Stripe uses cents
        },
        quantity: 1,
      });
    }

    // Create the Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment`,
      customer_email: registrationData.email, // Pre-fill email
      metadata: {
        selected_squares: JSON.stringify(selectedSquares.map((sq: any) => sq.id)),
        user_name: registrationData.name,
        user_email: registrationData.email,
        user_phone: registrationData.phone || '',
        base_amount: (baseAmount || totalAmount).toString(),
        transaction_fee: (transactionFee || 0).toString(),
        cover_fees: coverFees ? 'true' : 'false',
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

