# Super Bowl Pool Platform - Setup Guide

## Quick Start

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Go to SQL Editor
   - Run the SQL from `supabase/migrations/001_initial_schema.sql`

2. **Configure Environment Variables**
   - Copy `.env.local.example` to `.env.local`
   - Fill in all credentials:
     - Supabase URL and keys (from your Supabase project)
     - Stripe keys (from Stripe dashboard)
     - Twilio credentials (from Twilio account)

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Create Admin User**
   - First, sign up via Supabase Auth in your app
   - Then, go to Supabase SQL Editor and run:
   ```sql
   INSERT INTO admin_users (email, role) 
   VALUES ('your-email@example.com', 'admin');
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

## Environment Variables

### Supabase (Required)
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

Get these from: Your Supabase project > Settings > API

### Stripe (Required for credit card payments)
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret (for webhooks)

Get these from: [Stripe Dashboard](https://dashboard.stripe.com)

### Twilio (Required for SMS notifications)
- `TWILIO_ACCOUNT_SID`: Your Twilio account SID
- `TWILIO_AUTH_TOKEN`: Your Twilio auth token
- `TWILIO_PHONE_NUMBER`: Your Twilio phone number (format: +1234567890)

Get these from: [Twilio Console](https://console.twilio.com)

Twilio has a free tier that includes:
- $15.50 in free credits
- Good for testing and small-scale SMS

### Optional
- `NFL_API_KEY`: For automatic NFL score updates (optional)
- `RESEND_API_KEY`: For email notifications (optional)

## Admin Panel

Access the admin panel:
1. Go to `/admin/login`
2. Sign in with your admin email
3. Manage payments, settings, and view statistics

## Key Features

### For Users
- Select squares on the 10x10 grid
- Register with name, email, phone
- Choose payment method (Venmo or Stripe)
- View their squares at `/my-squares`
- Receive SMS with square numbers 24h before game
- Receive SMS announcements for each quarter winner

### For Admins
- Dashboard with statistics
- Payment management and confirmation
- Settings for pricing, prizes, and Venmo username
- Trigger SMS notifications manually

## SMS Notifications

The platform automatically sends SMS:
1. **Pre-game** (24h before kickoff): Users get their square numbers
2. **After each quarter**: Winner announcement with prize amount

### Triggering SMS Manually

You can trigger SMS from the admin panel or via API:

```bash
# Pre-game SMS
curl -X POST http://localhost:3000/api/sms/send-pre-game

# Quarterly winner SMS
curl -X POST http://localhost:3000/api/sms/send-quarterly \
  -H "Content-Type: application/json" \
  -d '{"quarter": 1, "team1Score": 14, "team2Score": 7, "finalScore": "14-7"}'
```

## Customization

### Update Super Bowl Date
Edit `app/page.tsx`:
```typescript
const superBowlDate = new Date('2025-02-09T18:30:00');
```

### Update Branding Colors
Edit `app/globals.css`:
```css
--primary: oklch(0.3 0.05 250); /* Dark blue */
--accent: oklch(0.9 0.15 85); /* Golden yellow */
```

### Add Logo
1. Place logo in `public/logo.png`
2. Update `app/page.tsx` to use:
```tsx
<Image src="/logo.png" alt="Logo" width={200} height={200} />
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import repository in [Vercel](https://vercel.com)
3. Add all environment variables
4. Deploy!

### Environment Variables in Production

Make sure to set all environment variables in your deployment platform:
- Vercel: Settings > Environment Variables
- Other platforms: Check their docs

### Supabase Production

Make sure to run the database migrations in your production Supabase instance:
- Go to SQL Editor in production
- Run `supabase/migrations/001_initial_schema.sql`

## Testing

### Test User Flow
1. Go to homepage
2. Click "Get Started"
3. Select squares on grid
4. Fill registration form
5. Choose payment method
6. Complete payment (test with Stripe test cards)

### Test Admin Flow
1. Go to `/admin/login`
2. Sign in with admin credentials
3. View dashboard statistics
4. Manage payments (mark as confirmed)
5. Update settings

### Test SMS
- Use Twilio test credentials or free tier
- Admin can trigger test SMS from API endpoints

## Common Issues

### Grid Not Loading
- Check Supabase connection in `.env.local`
- Verify database schema is set up correctly

### Payment Not Working
- Check Stripe keys in `.env.local`
- Verify webhook endpoint is configured in Stripe dashboard

### SMS Not Sending
- Verify Twilio credentials in `.env.local`
- Check phone number format (+1234567890)
- Use Twilio test credentials for development

## Support

For issues or questions:
- Check the README for additional information
- Review Supabase, Stripe, and Twilio documentation
- Contact the development team

## Next Steps

1. Set up production environment
2. Configure domain and SSL
3. Test SMS with real Twilio account
4. Set up Stripe webhooks
5. Customize branding
6. Add logo and images

