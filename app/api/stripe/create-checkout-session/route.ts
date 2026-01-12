import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { selectedSquares, totalAmount, baseAmount } = body;

    if (!selectedSquares || !totalAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const squareCount = selectedSquares.length;
    const pricePerSquare = Math.round((baseAmount || totalAmount) / squareCount);

    // Create the Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Super Bowl Pool Squares',
              description: `${squareCount} square${squareCount !== 1 ? 's' : ''} for the Michael Williams Memorial Scholarship Super Bowl Pool`,
            },
            unit_amount: Math.round((baseAmount || totalAmount) * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
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
        base_amount: (baseAmount || totalAmount).toString(),
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
