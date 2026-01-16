import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';
import { sendEmailSafe, sendToAdmins } from '@/lib/email/send';
import { purchaseConfirmationEmail } from '@/lib/email/templates/purchase-confirmation';
import { adminPurchaseAlertEmail } from '@/lib/email/templates/admin-purchase-alert';
import { adminMilestoneEmail } from '@/lib/email/templates/admin-milestone';

// Initialize Stripe lazily to avoid build-time errors
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;
  const stripe = getStripe();

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    const supabase = createAdminClient();

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

      // Get registration data from Stripe's customer_details (collected at checkout)
      // Use display_name from metadata if provided, otherwise fall back to billing name
      const billingName = session.customer_details?.name || 'User';
      const displayName = session.metadata?.display_name?.trim();

      const registrationData = {
        email: session.customer_details?.email || session.customer_email || session.metadata?.user_email,
        name: displayName || billingName, // Prefer custom display name
        phone: session.customer_details?.phone || session.metadata?.user_phone || '',
      };

      const amount = session.amount_total ? session.amount_total / 100 : 0;
      const selectedSquareIds = session.metadata?.selected_squares
        ? JSON.parse(session.metadata.selected_squares)
        : [];

      // Extract fee donation data from metadata
      const baseAmount = session.metadata?.base_amount
        ? parseFloat(session.metadata.base_amount)
        : amount;
      const feeDonation = session.metadata?.fee_donation
        ? parseFloat(session.metadata.fee_donation)
        : 0;
      const coversFee = session.metadata?.covers_fee === 'true';

      if (!registrationData.email) {
        console.error('No email found in session metadata');
        return NextResponse.json(
          { error: 'Missing email in session' },
          { status: 400 }
        );
      }

      // Register user directly (no HTTP call to avoid rate limiting/timeout issues)
      let profileId: string | null = null;

      try {
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', registrationData.email)
          .single();

        if (existingProfile) {
          profileId = existingProfile.id;
          console.log(`Found existing profile for ${registrationData.email}: ${profileId}`);
        } else {
          // Create new profile
          const { data: newProfile, error: profileError } = await supabase
            .from('profiles')
            .insert({
              email: registrationData.email,
              name: registrationData.name,
              phone: registrationData.phone,
            })
            .select()
            .single();

          if (profileError) {
            console.error('Error creating profile:', profileError);
          } else {
            profileId = newProfile.id;
            console.log(`Created new profile for ${registrationData.email}: ${profileId}`);
          }
        }

        // Update squares to link to user
        if (profileId && selectedSquareIds.length > 0) {
          const { error: squaresError } = await supabase
            .from('grid_squares')
            .update({
              user_id: profileId,
              status: 'paid',
              paid_at: new Date().toISOString(),
            })
            .in('id', selectedSquareIds);

          if (squaresError) {
            console.error('Error updating squares:', squaresError);
          } else {
            console.log(`Updated ${selectedSquareIds.length} squares for ${registrationData.email}`);
          }
        }

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

          // Log success with fee info
          console.log(`Payment completed: ${registrationData.email}, base: $${baseAmount}, fee donation: $${feeDonation}`);

          // Get square coordinates for confirmation email
          const { data: purchasedSquares } = await supabase
            .from('grid_squares')
            .select('row_number, col_number')
            .in('id', selectedSquareIds);

          const squareCoords = purchasedSquares?.map(sq => ({
            row: sq.row_number,
            col: sq.col_number,
          })) || [];

          const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://superbowl.michaelwilliamsscholarship.com';

          // Send purchase confirmation email to user
          if (registrationData.email) {
            const confirmationHtml = purchaseConfirmationEmail({
              name: registrationData.name,
              squareCount: selectedSquareIds.length,
              totalAmount: amount,
              squares: squareCoords,
              baseUrl: siteUrl,
            });

            await sendEmailSafe({
              to: registrationData.email,
              subject: '🏈 Thanks for joining the Super Bowl Pool!',
              html: confirmationHtml,
            });
          }

          // Get current pool stats for admin email
          const { count: soldCount } = await supabase
            .from('grid_squares')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'paid');

          const { data: revenueData } = await supabase
            .from('payments')
            .select('amount')
            .eq('status', 'completed');

          const totalRevenue = revenueData?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

          // Send admin purchase alert
          const adminAlertHtml = adminPurchaseAlertEmail({
            buyerName: registrationData.name,
            buyerEmail: registrationData.email,
            squareCount: selectedSquareIds.length,
            amount,
            poolStats: {
              soldCount: soldCount || 0,
              totalRevenue,
            },
            adminUrl: `${siteUrl}/admin/dashboard`,
          });

          await sendToAdmins(
            `💰 New Purchase: ${registrationData.name} bought ${selectedSquareIds.length} square${selectedSquareIds.length > 1 ? 's' : ''}`,
            adminAlertHtml
          );

          // Check for milestones
          const milestones = [25, 50, 75, 100] as const;
          const currentPercent = Math.floor(((soldCount || 0) / 100) * 100);
          const previousPercent = Math.floor((((soldCount || 0) - selectedSquareIds.length) / 100) * 100);

          for (const milestone of milestones) {
            if (currentPercent >= milestone && previousPercent < milestone) {
              // Load square price for milestone email
              const { data: priceSettings } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'square_price')
                .single();

              const squarePrice = parseInt(priceSettings?.value || '50');

              const milestoneHtml = adminMilestoneEmail({
                milestone,
                poolStats: {
                  soldCount: soldCount || 0,
                  totalRevenue,
                  squarePrice,
                },
                adminUrl: `${siteUrl}/admin/dashboard`,
              });

              await sendToAdmins(
                `🎯 Pool Milestone: ${milestone}% Sold!`,
                milestoneHtml
              );
              break; // Only send one milestone notification
            }
          }
        }
      } catch (error) {
        console.error('Error in auto-registration:', error);
        // Payment is still valid, just log the error
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      {
        error: 'Webhook handler failed',
        message: error?.message || 'Unknown error',
        type: error?.type || error?.name || 'Error',
      },
      { status: 400 }
    );
  }
}

