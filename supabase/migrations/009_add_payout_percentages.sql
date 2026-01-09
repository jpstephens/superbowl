-- Migration: Add Payout Percentage Configuration
-- Allows admin to configure payout percentages instead of fixed dollar amounts
-- Percentages are calculated from total revenue (square_price * 100)

-- Add payout percentage settings (defaults to typical 20/20/20/40 split)
INSERT INTO settings (key, value) VALUES
    ('payout_percent_q1', '20'),
    ('payout_percent_q2', '20'),
    ('payout_percent_q3', '20'),
    ('payout_percent_q4', '40'),
    ('charity_percentage', '0')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Add comment for documentation
COMMENT ON TABLE settings IS 'Application settings including payout percentages and square pricing';

-- Note: Existing prize_q1, prize_q2, etc. settings are kept for backward compatibility
-- but new system will calculate from percentages if they are set



