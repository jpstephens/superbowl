# 🚨 URGENT: Database Migrations Required

Your application is failing because **migrations 006 and 007 have not been run on your database**.

## The Error

```
Failed to load grid: column profiles_1.photo_url does not exist
```

This happens because the `photo_url` column doesn't exist in your `profiles` table yet.

---

## 🔴 STEP 1: Run These Migrations NOW

### Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**

### Copy and Paste This SQL (All at Once):

```sql
-- ========================================
-- MIGRATION 006: Add photo_url column
-- ========================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

COMMENT ON COLUMN profiles.photo_url IS 'URL to user profile photo';

-- ========================================
-- MIGRATION 007: Add logo_url setting
-- ========================================
INSERT INTO settings (key, value)
VALUES ('logo_url', '/logo.png')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ========================================
-- VERIFICATION
-- ========================================
SELECT 
  'Migrations completed!' as status,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = 'profiles' AND column_name = 'photo_url') as photo_url_exists,
  (SELECT COUNT(*) FROM settings WHERE key = 'logo_url') as logo_url_exists;
```

### Click "Run" Button

You should see:
```
status: "Migrations completed!"
photo_url_exists: 1
logo_url_exists: 1
```

---

## ✅ STEP 2: Verify

After running the migration:
1. Refresh your application page
2. The grid should now load correctly
3. Names should appear in claimed squares

---

## 📊 What These Migrations Do

### Migration 006 (photo_url)
- Adds `photo_url` column to `profiles` table
- Allows storing user profile photos
- Required for the grid to display user info on hover

### Migration 007 (logo_url)
- Adds logo URL to `settings` table
- Allows customizing the header logo
- Defaults to `/logo.png`

---

## 🐛 If You Still See Errors

### Check Browser Console
Open browser console (F12) and look for:
- Detailed error messages about which column is missing
- Network errors for API calls

### Verify Migrations Ran
Run this in Supabase SQL Editor:
```sql
-- Check if photo_url column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'photo_url';

-- Check if logo_url setting exists
SELECT * FROM settings WHERE key = 'logo_url';
```

---

## 📞 Need Help?

If migrations fail, check:
1. You're in the correct Supabase project
2. You have admin permissions
3. The `profiles` and `settings` tables exist

Run this diagnostic query:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'settings', 'grid_squares');
```

Should return all 3 table names.



