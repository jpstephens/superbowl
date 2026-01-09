# Step-by-Step Setup Guide for Super Bowl Pool Platform

## Part 1: Running the SQL Migration in Supabase

### Step 1: Open Your Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and log in
2. Click on your "Superbowl Pool" project (or create a new one)

### Step 2: Navigate to SQL Editor
1. In the **left sidebar**, look for "SQL Editor" (usually has a database icon 📊)
2. Click on "SQL Editor"
3. You should see a large text area in the middle where you can type SQL

### Step 3: Create a New Query
1. Click the green **"New query"** button (top of the SQL Editor)
2. Or, click in the empty text area

### Step 4: Copy and Paste the SQL
1. Open the file: `supabase/migrations/001_initial_schema.sql`
2. **Select all** the text (⌘+A on Mac, Ctrl+A on Windows)
3. **Copy** it (⌘+C or Ctrl+C)
4. **Paste** it into the Supabase SQL Editor (⌘+V or Ctrl+V)

### Step 5: Run the SQL
1. Look for the green **"Run"** button at the bottom right of the SQL Editor
2. Click **"Run"** button
   - Or press ⌘+Enter (Mac) / Ctrl+Enter (Windows)
3. Wait a few seconds...

### Step 6: Verify It Worked
1. You should see "Success. No rows returned" in the results area at the bottom
2. If you see **any red error messages**, let me know what they say!

### Step 7: Verify Tables Were Created
1. In the **left sidebar**, click **"Table Editor"** (looks like a grid icon)
2. You should see these tables appear:
   - ✅ `admin_users`
   - ✅ `profiles`
   - ✅ `grid_squares`
   - ✅ `payments`
   - ✅ `purchase_activity`
   - ✅ `settings`
   - ✅ `quarterly_winners`

**🎉 Success!** Your database is now set up!

---

## Part 2: Finding Configuration Variables

### A. Supabase Configuration (From Supabase Dashboard)

1. **In your Supabase project**, click the ⚙️ **"Settings"** icon in the left sidebar
2. Click **"API"** in the settings menu
3. You'll see:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
   - **service_role** key (long string - keep this secret!)

4. **Copy these values** - you'll need them for `.env.local`

---

### B. Stripe Configuration (For Credit Card Payments)

1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Log in (or create an account if you don't have one)
3. **For API Keys:**
   - Click **"Developers"** in the left sidebar
   - Click **"API keys"**
   - You'll see:
     - **Publishable key** (starts with `pk_test_...`) → Copy this
     - **Secret key** (starts with `sk_test_...`) → Click "Reveal test key" and copy this
   
4. **For Webhook Secret** (create webhook first):
   - Still in "Developers", click **"Webhooks"**
   - Click **"Add endpoint"**
   - Endpoint URL: `https://your-domain.com/api/webhooks/stripe` (for now, use a test URL)
   - Select events: Choose "checkout.session.completed"
   - Click **"Add endpoint"**
   - Copy the **Signing secret** (starts with `whsec_...`)

---

### C. Twilio Configuration (For SMS Notifications)

1. Go to [https://console.twilio.com](https://console.twilio.com)
2. Log in (or create a free account - comes with $15.50 in free credits!)
3. **Get your credentials:**
   - In the Twilio Console, you'll see your **Account SID** (starts with `AC...`)
   - You'll also see your **Auth Token** (you may need to click to reveal it)
   - Copy both values

4. **Get a phone number:**
   - In the left sidebar, click **"Phone Numbers"** > **"Manage"** > **"Active numbers"**
   - If you don't have a number, click **"Get a new phone number"**
   - Choose a number and click **"Get Started"**
   - Copy the phone number (include the `+1` like: `+15551234567`)

---

## Part 3: Setting Up Your .env.local File

### Step 1: Copy the Template
```bash
cp .env.local.example .env.local
```

Or in your terminal:
```bash
cd /Users/jasonstephens/super-bowl-pool
cp .env.local.example .env.local
```

### Step 2: Open and Edit .env.local
Open the `.env.local` file in your code editor and fill in the values:

```env
# Fill these in with your actual values from the steps above
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key

STRIPE_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+15551234567

NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Step 3: Save the File
Save `.env.local` - this file contains secrets, so **never commit it to git!**

---

## Part 4: Create Your First Admin User

### Step 1: Enable Authentication in Supabase
1. In Supabase, go to **"Authentication"** in the left sidebar
2. Click **"Providers"** tab
3. Enable **"Email"** provider (toggle it on)
4. Click **"Save"**

### Step 2: Create an Admin Account
1. Still in **"Authentication"**, click **"Users"** tab
2. Click **"Add user"** → **"Create new user"**
3. Enter your email and a password
4. Click **"Create user"**
5. Copy your email address!

### Step 3: Add to Admin Table
1. Go back to **"SQL Editor"** in Supabase
2. Click **"New query"**
3. Paste this SQL (replace with YOUR email):

```sql
INSERT INTO admin_users (email, role) 
VALUES ('YOUR_EMAIL@example.com', 'admin');
```

4. Click **"Run"**
5. You should see "Success"

**🎉 Success!** You're now an admin!

---

## Part 5: Run Your Application

### Step 1: Install Dependencies
```bash
cd /Users/jasonstephens/super-bowl-pool
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Open in Browser
Open [http://localhost:3000](http://localhost:3000)

### Step 4: Test Admin Login
1. Go to [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
2. Enter your email and password
3. You should see the admin dashboard!

---

## Troubleshooting

### "Error: Invalid API key" when loading the site
- Check that your `.env.local` file has the correct Supabase keys
- Make sure there are no extra spaces or quotes around the keys

### "Error: Module not found"
- Run `npm install` again
- Make sure you're in the project directory

### SQL Migration Shows Errors
- Make sure you copied ALL the SQL from the file
- Check for any syntax errors in the error message
- Try running just the first few lines to see where the error is

### Stripe Not Working
- Make sure you're using test keys (they start with `test_`)
- Don't use production keys until you deploy to production

### Twilio SMS Not Sending
- Verify your phone number includes the country code (like `+1`)
- Check that your Twilio account is activated (they sometimes need verification)
- Look at your Twilio console for error messages

---

## Need Help?

If you get stuck at any step, let me know:
1. What step you're on
2. What error message you're seeing
3. A screenshot if helpful

I'm here to help! 🚀

