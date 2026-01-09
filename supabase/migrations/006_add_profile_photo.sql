-- Migration: Add photo_url to profiles table
-- This allows users to upload a profile photo during registration

-- Add photo_url column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.photo_url IS 'URL to user profile photo (stored in Supabase Storage or external URL)';



