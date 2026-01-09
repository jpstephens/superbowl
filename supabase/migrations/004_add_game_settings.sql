-- Migration: Add game configuration settings
-- Allows admin to set game date, game ID, and toggle mock data

-- Add game configuration settings
INSERT INTO settings (key, value) VALUES
    ('game_date', '2025-02-09T18:30:00-05:00'),
    ('game_id', ''),
    ('use_mock_data', 'true')
ON CONFLICT (key) DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE settings IS 'Application settings including game configuration, pricing, and payment options';



