# Quick Setup Guide

## 1. Add API Key to Environment

Add this line to your `.env.local` file:

```env
API_SPORTS_KEY=f6dec14485b0ab9509622422bb160baa
```

The API route will use this key automatically. The API is already configured in the code.

## 2. Run Database Migration

### Easy Method (Recommended):
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New query**
5. Open file: `supabase/migrations/003_add_auth_link.sql`
6. Copy ALL the SQL (⌘+A, ⌘+C)
7. Paste into SQL Editor (⌘+V)
8. Click **Run** button (green button or ⌘+Enter)
9. Should see "Success. No rows returned"

**That's it!** The migration is complete.

See `MIGRATION_GUIDE.md` for detailed instructions.

## 3. Set Up Google OAuth

Follow the step-by-step guide in `GOOGLE_OAUTH_SETUP.md`

**Quick Summary:**
1. Go to https://console.cloud.google.com/
2. Create project → Enable Google+ API
3. Create OAuth credentials (Web application)
4. Add callback URL: `https://zlbelhvixjozmjtchmsj.supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret
6. Add to Supabase: Authentication > Providers > Google

## 4. Test Everything

1. **Test API:**
   ```bash
   curl http://localhost:3000/api/game-score
   ```
   Should return game score data

2. **Test Login:**
   - Go to http://localhost:3000/auth/login
   - Try Google sign-in
   - Should redirect to Google and back

3. **Test Payment Flow:**
   - Select squares → Payment → Complete payment
   - User should be auto-registered
   - Check email for login link

## Files Created

- ✅ `GOOGLE_OAUTH_SETUP.md` - Complete Google OAuth guide
- ✅ `MIGRATION_GUIDE.md` - Database migration instructions
- ✅ API key configured in code (can override with env var)

## Next Steps

After completing the above:
1. ✅ Database migration - DONE (just run the SQL)
2. ✅ Google OAuth - Follow guide
3. ✅ API key - Already in code
4. ⏭️ Create user dashboard
5. ⏭️ Add admin tournament launch
6. ⏭️ Redesign homepage



