-- Migration: Add tournament_launched setting
-- Tracks whether the tournament has been launched (numbers randomized)

-- Add tournament_launched setting (defaults to false)
INSERT INTO settings (key, value) VALUES
    ('tournament_launched', 'false')
ON CONFLICT (key) DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE settings IS 'Application settings including tournament launch status, game configuration, pricing, and payment options';



