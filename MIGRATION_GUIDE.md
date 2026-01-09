# Database Migration Guide

## Quick Method: Run in Supabase Dashboard (Recommended)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New query** button

### Step 2: Copy Migration SQL
Open the file: `supabase/migrations/003_add_auth_link.sql`

Copy ALL the contents (⌘+A, ⌘+C on Mac or Ctrl+A, Ctrl+C on Windows)

### Step 3: Paste and Run
1. Paste the SQL into the Supabase SQL Editor (⌘+V or Ctrl+V)
2. Click the green **Run** button (or press ⌘+Enter / Ctrl+Enter)
3. You should see "Success. No rows returned"

### Step 4: Verify
1. Go to **Table Editor** in left sidebar
2. Click on **profiles** table
3. You should see two new columns:
   - `auth_user_id` (UUID, nullable)
   - `needs_password_reset` (boolean, default false)

## What This Migration Does

1. **Adds `auth_user_id` column**
   - Links profiles to Supabase Auth users
   - Allows users to log in with email/password or OAuth

2. **Adds `needs_password_reset` flag**
   - Marks users who need to set their password on first login
   - Set to `true` when user is auto-registered after payment

3. **Creates indexes**
   - Speeds up lookups by email and auth_user_id
   - Improves query performance

## Migration SQL (for reference)

```sql
-- Add auth_user_id column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- Add needs_password_reset flag for first-time login
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS needs_password_reset BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
```

## Troubleshooting

**Error: "column already exists"**
- This is fine! The migration uses `IF NOT EXISTS` so it's safe to run multiple times
- Your database is already up to date

**Error: "permission denied"**
- Make sure you're using the SQL Editor (not a restricted view)
- You need admin access to your Supabase project

**Can't see new columns**
- Refresh the Table Editor
- Check that migration ran successfully (should see "Success" message)



