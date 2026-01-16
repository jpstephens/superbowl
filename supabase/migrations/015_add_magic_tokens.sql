-- Magic link tokens for passwordless authentication
CREATE TABLE IF NOT EXISTS magic_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_magic_tokens_token ON magic_tokens(token);
CREATE INDEX IF NOT EXISTS idx_magic_tokens_profile_id ON magic_tokens(profile_id);

-- Add has_password column to profiles to track if user has set a password
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_password BOOLEAN DEFAULT false;

-- Clean up expired tokens periodically (tokens older than 7 days)
-- This can be run via a cron job or Supabase edge function
CREATE OR REPLACE FUNCTION cleanup_expired_magic_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM magic_tokens
    WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;
