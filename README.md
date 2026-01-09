# Super Bowl Pool Platform

A premium Super Bowl pool platform for the Michael Williams Memorial Scholarship featuring a 10x10 grid selection system, dual payment processing (Venmo QR codes and Stripe), automated SMS notifications, real-time activity feeds, and comprehensive admin management.

## Features

- **Interactive 10x10 Grid**: Randomized numbers with real-time availability
- **Dual Payment Options**: Venmo QR codes and Stripe checkout
- **SMS Notifications**: Automated SMS before the game and after each quarter
- **Admin Panel**: Manage payments, users, and settings
- **Real-Time Activity Feed**: Live updates of recent purchases
- **Leaderboard**: Top purchasers displayed prominently
- **Countdown Timer**: Animated countdown to Super Bowl kickoff
- **Mobile Responsive**: Beautiful UI/UX optimized for all devices

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Payments**: Stripe for credit cards, Venmo QR codes
- **SMS**: Twilio
- **UI Components**: shadcn/ui

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd super-bowl-pool
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration from `supabase/migrations/001_initial_schema.sql`
3. Get your project URL and anon key from Settings > API

### 4. Set Up Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `STRIPE_SECRET_KEY`: Stripe secret key (get from Stripe dashboard)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key
- `TWILIO_ACCOUNT_SID`: Twilio account SID
- `TWILIO_AUTH_TOKEN`: Twilio auth token
- `TWILIO_PHONE_NUMBER`: Twilio phone number (format: +1234567890)

### 5. Create First Admin User

1. Sign up via Supabase Auth in the app
2. Go to Supabase SQL Editor and run:

```sql
INSERT INTO admin_users (email, role) VALUES ('your-email@example.com', 'admin');
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Admin Access

- Admin login: `/admin/login`
- Admin dashboard: `/admin/dashboard`
- Payment management: `/admin/payments`
- Settings: `/admin/settings`

## Default Settings

- Price per square: $50
- Prizes per quarter: $250 each
- Venmo username: Configure in admin settings
- Total squares: 100

## SMS Notifications

The platform sends SMS notifications:
1. **24 hours before game**: Users receive their square numbers
2. **After each quarter**: Winner announcement with prize amount

Configure Twilio credentials in environment variables and use the admin panel to manually trigger notifications if needed.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set all environment variables in your hosting platform.

## Configuration

### Updating Super Bowl Date

Edit `app/page.tsx` and update the `superBowlDate` variable:

```typescript
const superBowlDate = new Date('2025-02-09T18:30:00');
```

### Customizing Branding

Update colors in `app/globals.css` to match your brand:

```css
--primary: oklch(0.3 0.05 250); /* Your primary color */
--accent: oklch(0.9 0.15 85); /* Your accent color */
```

### Logo

Replace the logo placeholder in `app/page.tsx` with your logo:

```tsx
<Image src="/your-logo.png" alt="Logo" width={200} height={200} />
```

## Support

For issues or questions, please contact the development team.

## License

Proprietary - Michael Williams Memorial Scholarship Fund
