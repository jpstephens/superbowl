# Custom Domain Setup for Cleaner OAuth URLs

## The Issue
Currently, Google OAuth shows: `zlbelhvixjozmjtchmsj.supabase.co` during sign-in, which looks unprofessional.

## Solutions

### Option 1: Use Custom Domain (Best for Production)

#### Step 1: Get a Custom Domain
- Purchase from: Namecheap, Google Domains, GoDaddy, etc.
- Example: `superbowlpool.com` or `yourdomain.com`

#### Step 2: Configure in Supabase
1. Go to Supabase Dashboard → **Settings** → **Custom Domain**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Supabase will provide DNS records to add

#### Step 3: Update OAuth Redirect URLs
1. In Google Cloud Console, update authorized redirect URI:
   ```
   https://yourdomain.com/auth/v1/callback
   ```
2. In Supabase, the callback URL will automatically update

**Result:** Users see `yourdomain.com` instead of the Supabase subdomain

---

### Option 2: Keep Current Setup (Easier, Still Works)

The Supabase URL (`zlbelhvixjozmjtchmsj.supabase.co`) is:
- ✅ Only visible for 1-2 seconds during OAuth flow
- ✅ Secure and reliable
- ✅ No additional setup needed
- ✅ Works perfectly fine for development/testing

**Users flow:**
1. Click "Sign in with Google" → See Google sign-in
2. Google redirects → Brief Supabase URL (1-2 seconds)
3. Redirected to your app → Clean `localhost:3000/dashboard`

Most users won't even notice the Supabase URL.

---

### Option 3: Use Supabase Custom Domain (Free)

Supabase allows custom domains on paid plans. Check your plan:
- Free tier: Uses default subdomain
- Pro tier: Can add custom domain

---

## Recommendation

**For Development/Testing:** Keep current setup (Option 2)
- It works fine
- Users barely notice it
- No additional cost

**For Production:** Use custom domain (Option 1)
- More professional
- Better branding
- Worth the $10-15/year for domain

---

## Current Status

Your OAuth is configured correctly. The Supabase URL is just part of the authentication flow and redirects users quickly to your app. The dashboard is now created and should work!



