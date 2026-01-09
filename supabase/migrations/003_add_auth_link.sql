-- Migration: Link profiles to Supabase Auth users
-- This allows users to authenticate and access their accounts

-- Add auth_user_id column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- Add needs_password_reset flag for first-time login
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS needs_password_reset BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Add comment for documentation
COMMENT ON COLUMN profiles.auth_user_id IS 'Links to Supabase Auth users.id';
COMMENT ON COLUMN profiles.needs_password_reset IS 'True if user needs to reset password on first login';



