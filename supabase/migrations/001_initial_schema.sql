-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admin users table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    total_squares INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grid squares table
CREATE TABLE IF NOT EXISTS grid_squares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    row_number INTEGER NOT NULL CHECK (row_number >= 0 AND row_number <= 9),
    col_number INTEGER NOT NULL CHECK (col_number >= 0 AND col_number <= 9),
    row_score INTEGER CHECK (row_score IS NULL OR (row_score >= 0 AND row_score <= 9)),
    col_score INTEGER CHECK (col_score IS NULL OR (col_score >= 0 AND col_score <= 9)),
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'paid', 'confirmed')),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    claimed_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_method TEXT CHECK (payment_method IN ('venmo', 'stripe')),
    payment_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(row_number, col_number)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('venmo', 'stripe')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'confirmed')),
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase activity feed
CREATE TABLE IF NOT EXISTS purchase_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    square_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Application settings
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quarterly winners
CREATE TABLE IF NOT EXISTS quarterly_winners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quarter INTEGER NOT NULL CHECK (quarter IN (1, 2, 3, 4)),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    row_score INTEGER NOT NULL,
    col_score INTEGER NOT NULL,
    prize_amount NUMERIC(10, 2),
    announced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_grid_squares_status ON grid_squares(status);
CREATE INDEX IF NOT EXISTS idx_grid_squares_user_id ON grid_squares(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_purchase_activity_created_at ON purchase_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quarterly_winners_quarter ON quarterly_winners(quarter);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_grid_squares_updated_at BEFORE UPDATE ON grid_squares
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Initialize settings with default values
INSERT INTO settings (key, value) VALUES
    ('square_price', '50.00'),
    ('prize_q1', '250.00'),
    ('prize_q2', '250.00'),
    ('prize_q3', '250.00'),
    ('prize_q4', '250.00'),
    ('venmo_username', ''),
    ('venmo_memo', 'Super Bowl Pool'),
    ('stripe_enabled', 'true'),
    ('venmo_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- Create initial grid WITHOUT numbers (numbers assigned after all squares are sold)
-- row_score and col_score will be NULL until tournament is launched
INSERT INTO grid_squares (row_number, col_number, row_score, col_score)
SELECT 
    row_num,
    col_num,
    NULL,
    NULL
FROM 
    generate_series(0, 9) as row_num,
    generate_series(0, 9) as col_num;

