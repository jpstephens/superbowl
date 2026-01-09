# Your Next Steps - Quick Checklist

## ✅ What's Done
- Supabase credentials: Configured
- Stripe secret key: Configured
- Twilio credentials: Configured
- .env.local file: Created

## ⚠️ What You Need To Complete

### 1. Get Your Stripe Publishable Key

**IMPORTANT:** You provided a "publishable" key, but it's from Supabase (starts with `sb_`), not Stripe!

1. Go to: https://dashboard.stripe.com/apikeys
2. Look for "Standard keys" section
3. Find your **PUBLISHABLE** key (starts with `pk_live_...` or `pk_test_...`)
4. Copy it

**Update .env.local:**
- Open `.env.local` in your editor
- Find: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE`
- Replace `pk_live_YOUR_KEY_HERE` with your actual Stripe publishable key

---

### 2. Set Up Stripe Webhook

**You asked: "what events do i listen for?"**

You need to listen for: **checkout.session.completed**

**Steps:**
1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"+ Add endpoint"** button
3. Fill in:
   - **Endpoint URL:** `http://localhost:3000/api/webhooks/stripe` (for testing)
   - **Description:** Super Bowl Pool Webhook
4. Click **"Add endpoint"**
5. In the "Listen to" section, click **"Select events to listen to"**
6. Search for: `checkout.session.completed`
7. Select it and click **"Add events"**
8. Click **"Add endpoint"**
9. Copy the **Signing secret** (starts with `whsec_...`)

**Update .env.local:**
- Find: `STRIPE_WEBHOOK_SECRET=SET_AFTER_CREATING_WEBHOOK`
- Replace with your actual webhook secret

---

### 3. Get Your Twilio Phone Number

**You need a Twilio phone number to send SMS!**

1. Go to: https://console.twilio.com
2. Click **"Phone Numbers"** in the left sidebar
3. Click **"Manage"** → **"Active numbers"**
4. **If you don't have a number:**
   - Click **"Get a new phone number"** button
   - Click **"Get Started"** or **"Search"**
   - Choose a number (the free tier works!)
   - Click **"Get Started"** again
5. Copy your phone number (includes the `+` sign, like: `+15551234567`)

**Update .env.local:**
- Find: `TWILIO_PHONE_NUMBER=NEED_TO_GET_THIS`
- Replace with your actual phone number

---

### 4. Important Security Notes

⚠️ **You're using LIVE Stripe keys!** 

You provided: `sk_live_...` which means REAL MONEY!

**For testing, you should use TEST keys:**
1. Go to: https://dashboard.stripe.com/test/apikeys
2. Look for "Test mode keys"
3. Use those keys instead (they start with `test_`)

**Or, keep using live keys but:**
- Be very careful
- Test with small amounts only
- Know that you'll receive real payments

---

### 5. Final Steps After Updating .env.local

Once you've updated `.env.local` with:
- ✅ Stripe publishable key
- ✅ Stripe webhook secret
- ✅ Twilio phone number

Then run:

```bash
npm install
npm run dev
```

Open http://localhost:3000 to see your app!

---

## Webhook Events You Should Listen For

For now, you only need:
- **`checkout.session.completed`** - When a user successfully completes payment

That's it! The app will handle the rest.

---

## Quick Testing Checklist

After everything is set up:

- [ ] Visit http://localhost:3000 (homepage loads)
- [ ] Click "Get Started" → selects squares on grid
- [ ] Fill out registration form
- [ ] Choose payment method
- [ ] Test Venmo QR code generation
- [ ] Test Stripe checkout (use test card: 4242 4242 4242 4242)
- [ ] Visit /admin/login and sign in
- [ ] Check admin dashboard shows stats
- [ ] Verify Twilio can send SMS

---

## Where to Update .env.local

The file is located at:
```
/Users/jasonstephens/super-bowl-pool/.env.local
```

Open it in any text editor (VS Code, TextEdit, etc.)

---

## Summary - What You Have vs What You Need

### ✅ You Have:
- Supabase URL and keys ✅
- Stripe SECRET key ✅
- Twilio Account SID and Auth Token ✅

### ❌ You Need:
1. Stripe PUBLISHABLE key (pk_live_... or pk_test_...)
2. Stripe Webhook secret (whsec_...)
3. Twilio phone number (+15551234567 format)

---

## Need Help?

If you get stuck:
1. Check the error message
2. Let me know which step you're on
3. I'll help you troubleshoot!

