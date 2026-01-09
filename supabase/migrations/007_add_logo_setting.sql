-- Migration: Add logo_url setting
-- This allows admins to configure the logo URL in the database

-- Add logo_url setting with default value
INSERT INTO settings (key, value) VALUES
    ('logo_url', '/logo.png')
ON CONFLICT (key) DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE settings IS 'Application settings including logo_url for the header logo';

