# Run Pending Migrations

You need to apply migrations 006 and 007 to your database.

## Quick Steps

### 1. Open Supabase Dashboard
Go to: https://supabase.com/dashboard

### 2. Navigate to SQL Editor
Click "SQL Editor" in the left sidebar

### 3. Run Migration 006 (Add photo_url)
Copy this SQL and paste into SQL Editor, then click "Run":

```sql
-- Migration: Add photo_url to profiles table
-- This allows users to upload a profile photo during registration

-- Add photo_url column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.photo_url IS 'URL to user profile photo (stored in Supabase Storage or external URL)';
```

### 4. Run Migration 007 (Add logo_url setting)
Copy this SQL and paste into SQL Editor, then click "Run":

```sql
-- Migration: Add logo_url setting
-- This allows admins to configure the logo displayed in the header

INSERT INTO settings (key, value)
VALUES ('logo_url', '/logo.png')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

## Verify

After running both migrations, refresh your application page and the grid should load correctly!

## What These Migrations Do

- **Migration 006**: Adds `photo_url` column to store user profile photos
- **Migration 007**: Adds logo URL setting to allow customizable branding

Your grid will now be able to:
- Display user names from the profiles database
- Show profile photos on hover (if uploaded)
- Use the custom logo from settings



