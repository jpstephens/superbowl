import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    const supabase = await createClient();

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentIntentId = session.payment_intent as string;

      // Idempotency check: Skip if payment already processed
      if (paymentIntentId) {
        const { data: existingPayment } = await supabase
          .from('payments')
          .select('id')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .single();

        if (existingPayment) {
          console.log(`Payment ${paymentIntentId} already processed, skipping`);
          return NextResponse.json({ received: true, message: 'Already processed' });
        }
      }

      // Get registration data from metadata
      const registrationData = {
        email: session.metadata?.user_email || session.customer_email,
        name: session.metadata?.user_name || 'User',
        phone: session.metadata?.user_phone || '',
      };

      const amount = session.amount_total ? session.amount_total / 100 : 0;
      const selectedSquareIds = session.metadata?.selected_squares
        ? JSON.parse(session.metadata.selected_squares)
        : [];

      if (!registrationData.email) {
        console.error('No email found in session metadata');
        return NextResponse.json(
          { error: 'Missing email in session' },
          { status: 400 }
        );
      }

      // Auto-register user after payment
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const registerResponse = await fetch(
          `${baseUrl}/api/auth/auto-register`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: registrationData.email,
              name: registrationData.name,
              phone: registrationData.phone,
              selectedSquareIds,
            }),
          }
        );

        const registerData = await registerResponse.json();

        if (!registerResponse.ok) {
          console.error('Auto-register error:', registerData);
          // Continue anyway - payment is complete
        }

        const profileId = registerData.profileId;

        // Create payment record
        if (profileId) {
          const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert({
              user_id: profileId,
              amount: amount,
              method: 'stripe',
              status: 'completed',
              stripe_payment_intent_id: session.payment_intent as string,
            })
            .select()
            .single();

          if (paymentError) {
            console.error('Error creating payment:', paymentError);
          }

          // Update squares are already handled in auto-register
          console.log(`Payment completed and user registered: ${registrationData.email}`);
        }
      } catch (error) {
        console.error('Error in auto-registration:', error);
        // Payment is still valid, just log the error
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

