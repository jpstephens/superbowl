# Quick Configuration Variable Guide

## Where to Find Each Variable

### Supabase Variables 📊

**Where:** Supabase Dashboard → Your Project → ⚙️ Settings → API

| Variable | Where to Find |
|----------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | "Project URL" (example: `https://abc123.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | "anon public" key (long string starts with `eyJhbG...`) |
| `SUPABASE_SERVICE_ROLE_KEY` | "service_role" key (starts with `eyJhbG...` - keep secret!) |

💡 **Tip:** The service_role key is more powerful, only use it on your server side

---

### Stripe Variables 💳

**Where:** [Stripe Dashboard](https://dashboard.stripe.com) → Developers → API keys

| Variable | Where to Find |
|----------|--------------|
| `STRIPE_SECRET_KEY` | Developers → API keys → "Secret key" (starts with `sk_test_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Developers → API keys → "Publishable key" (starts with `pk_test_...`) |

**For Webhook Secret:**
**Where:** Stripe Dashboard → Developers → Webhooks

| Variable | Where to Find |
|----------|--------------|
| `STRIPE_WEBHOOK_SECRET` | Developers → Webhooks → Create endpoint → "Signing secret" (starts with `whsec_...`) |

💡 **Tip:** You need to create a webhook endpoint first. Use your production URL when deployed.

---

### Twilio Variables 📱

**Where:** [Twilio Console](https://console.twilio.com)

| Variable | Where to Find |
|----------|--------------|
| `TWILIO_ACCOUNT_SID` | Dashboard → "Account SID" (starts with `AC...`) |
| `TWILIO_AUTH_TOKEN` | Dashboard → Auth Token (click to reveal) |
| `TWILIO_PHONE_NUMBER` | Phone Numbers → Manage → "Active numbers" (format: `+15551234567`) |

💡 **Tip:** Twilio has a free tier with $15.50 in credits - perfect for testing!

---

## Copy-Paste Ready

Once you have all these values, your `.env.local` should look like this:

```env
# ✅ COPY FROM SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://abc123xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ✅ COPY FROM STRIPE
STRIPE_SECRET_KEY=sk_test_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# ✅ COPY FROM TWILIO
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+15551234567

# ✅ SET THIS
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## Quick Setup Checklist

- [ ] Run SQL migration in Supabase (see STEP_BY_STEP_SETUP.md Part 1)
- [ ] Copy Supabase URL and keys to `.env.local`
- [ ] Create Stripe account and get API keys
- [ ] Create Twilio account and get phone number
- [ ] Create admin user in Supabase
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Test admin login at `/admin/login`
- [ ] Test user flow at `/grid`

---

## Common Questions

**Q: Can I skip Stripe if I only want Venmo?**
A: Yes, but Stripe variables are still required. You can use test keys and users will only see Venmo.

**Q: Can I skip Twilio if I don't want SMS?**
A: No, the app requires these variables. But you can use test credentials and just won't send SMS.

**Q: Do I need to pay for any of these services?**
A: 
- Supabase: Free tier is generous
- Stripe: Test mode is free, real transactions have fees
- Twilio: Free $15.50 credit for testing

**Q: What if I mess up my service role key?**
A: You can regenerate it in Supabase → Settings → API → "Reset" under service_role key

