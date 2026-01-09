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
  'Success!' as status,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = 'profiles' AND column_name = 'photo_url') as photo_url_added,
  (SELECT COUNT(*) FROM settings WHERE key = 'logo_url') as logo_setting_added;



