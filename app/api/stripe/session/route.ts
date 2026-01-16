import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with test mode support
function getStripe() {
  const isTestMode = process.env.STRIPE_TEST_MODE === 'true';
  const secretKey = isTestMode
    ? process.env.STRIPE_SECRET_KEY_TEST!
    : process.env.STRIPE_SECRET_KEY!;
  return new Stripe(secretKey);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Missing session_id' },
      { status: 400 }
    );
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      squareCount: session.metadata?.square_count ? parseInt(session.metadata.square_count) : 0,
      totalAmount: session.amount_total ? session.amount_total / 100 : 0,
      customerName: session.customer_details?.name || '',
      customerEmail: session.customer_details?.email || '',
      paymentStatus: session.payment_status,
    });
  } catch (error: any) {
    console.error('Error fetching Stripe session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
