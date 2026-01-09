# Stripe Integration Setup Guide

## Overview

I've implemented the complete Stripe checkout flow for your Super Bowl Pool application. Users can now pay with credit cards, and payments are automatically processed and confirmed.

## What Was Implemented

1. **API Route**: `/app/api/stripe/create-checkout-session/route.ts`
   - Creates a Stripe checkout session
   - Stores user information in the database
   - Passes square selection data to Stripe

2. **Payment Page Updates**: `/app/payment/page.tsx`
   - Integrated with Stripe checkout API
   - Redirects users to Stripe's secure payment page

3. **Webhook Handler**: `/app/api/webhooks/stripe/route.ts`
   - Handles successful payment events
   - Automatically updates squares to "claimed" status
   - Creates payment records in the database

4. **Thank You Page**: `/app/thank-you/page.tsx`
   - Detects Stripe payments
   - Shows payment confirmation message

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Application URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Setup Instructions

### 1. Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Sign up or log in
3. Go to **Developers** → **API keys**
4. Copy your **Publishable key** and **Secret key**
5. Use the **test mode** keys for development (they start with `pk_test_` and `sk_test_`)

### 2. Set Up Stripe Webhook

For the webhook to work (to automatically confirm payments), you need to set up a webhook endpoint:

#### For Local Development (using Stripe CLI):

1. Install Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. Copy the webhook signing secret (starts with `whsec_`) and add it to `.env.local`

#### For Production:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select event: `checkout.session.completed`
5. Copy the **Signing secret** and add it to your production environment variables

### 3. Create `.env.local` File

Create a `.env.local` file in your project root with all required variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### 4. Restart Your Development Server

After adding the environment variables, restart your Next.js server:

```bash
npm run dev
```

## Testing the Integration

### Using Stripe Test Cards

Stripe provides test card numbers for development:

**Successful Payment:**
- Card Number: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

**Declined Payment:**
- Card Number: `4000 0000 0000 0002`

**Requires Authentication (3D Secure):**
- Card Number: `4000 0027 6000 3184`

### Test Flow

1. Go to your app: `http://localhost:3000`
2. Select squares on the grid
3. Fill in registration information
4. Select **Credit Card Payment**
5. Click **Proceed to Stripe Checkout**
6. You'll be redirected to Stripe's checkout page
7. Enter test card information (e.g., `4242 4242 4242 4242`)
8. Complete the payment
9. You'll be redirected to the Thank You page
10. Check your database - the squares should be marked as "claimed"

## How It Works

### User Flow

1. User selects squares and fills registration form
2. User chooses "Credit Card Payment"
3. Frontend calls `/api/stripe/create-checkout-session`
4. Backend creates a user record and Stripe checkout session
5. User is redirected to Stripe's secure checkout page
6. User enters card information on Stripe's page
7. Payment is processed by Stripe
8. Stripe redirects user back to your `/thank-you` page
9. Stripe sends webhook event to `/api/webhooks/stripe`
10. Webhook handler updates squares to "claimed" status

### Data Flow

```
Payment Page → API Route → Stripe Checkout
                              ↓
                         User Pays
                              ↓
                    Stripe Webhook → Database Update
                              ↓
                      Squares Confirmed
```

## Production Deployment

When deploying to production (e.g., Vercel):

1. **Add Environment Variables** in your deployment platform:
   - Use **production** Stripe keys (start with `pk_live_` and `sk_live_`)
   - Set `NEXT_PUBLIC_APP_URL` to your production domain
   - Add all other required environment variables

2. **Configure Stripe Webhook**:
   - Add your production webhook URL in Stripe Dashboard
   - Use the production webhook secret

3. **Test in Production**:
   - Use Stripe test mode first
   - Then switch to live mode when ready for real payments

## Security Notes

- ✅ Payment processing happens on Stripe's secure servers
- ✅ Card information never touches your server
- ✅ Webhook events are verified using signature validation
- ✅ Environment variables are not exposed to the client
- ✅ All sensitive operations use server-side code

## Troubleshooting

### Payment succeeds but squares don't update

- Check that webhook is configured correctly
- Verify `STRIPE_WEBHOOK_SECRET` is set
- Check webhook logs in Stripe Dashboard
- Look at server logs for webhook errors

### "Failed to create checkout session" error

- Verify `STRIPE_SECRET_KEY` is set correctly
- Check that Supabase connection is working
- Look at server logs for detailed error messages

### Redirect issues after payment

- Verify `NEXT_PUBLIC_APP_URL` is set correctly
- Check that the success URL in the checkout session matches your domain

## Need Help?

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)

## Summary

Your Stripe integration is now complete! Users can:
- Pay securely with credit cards
- Have their payments processed immediately
- Get instant confirmation of their squares

The integration handles everything automatically, including:
- User record creation
- Payment processing
- Square confirmation
- Error handling

