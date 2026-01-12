-- =====================================================
-- Row Level Security (RLS) Policies
-- Secures database tables at the row level
-- =====================================================

-- Enable RLS on all user-facing tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE grid_squares ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prop_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE prop_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Helper function to check if user is admin
-- =====================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = auth.jwt() ->> 'email'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (is_admin());

-- Allow insert for new user registration
CREATE POLICY "Allow insert for registration"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- GRID_SQUARES TABLE POLICIES
-- =====================================================
-- Everyone can read grid squares (public display)
CREATE POLICY "Public can read squares"
  ON grid_squares FOR SELECT
  USING (true);

-- Only admins can insert/update/delete squares
CREATE POLICY "Admins can manage squares"
  ON grid_squares FOR ALL
  USING (is_admin());

-- Service role bypass for webhooks
CREATE POLICY "Service role full access to squares"
  ON grid_squares FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- PAYMENTS TABLE POLICIES
-- =====================================================
-- Users can read their own payments
CREATE POLICY "Users can read own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all payments
CREATE POLICY "Admins can read all payments"
  ON payments FOR SELECT
  USING (is_admin());

-- Admins can update payments (confirm, etc.)
CREATE POLICY "Admins can update payments"
  ON payments FOR UPDATE
  USING (is_admin());

-- Service role can insert payments (from webhooks)
CREATE POLICY "Service role can insert payments"
  ON payments FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- ADMIN_USERS TABLE POLICIES
-- =====================================================
-- Only admins can read admin_users
CREATE POLICY "Admins can read admin_users"
  ON admin_users FOR SELECT
  USING (is_admin());

-- Only super admins can modify admin_users
CREATE POLICY "Super admins can manage admin_users"
  ON admin_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = auth.jwt() ->> 'email'
      AND role = 'super_admin'
    )
  );

-- =====================================================
-- PROP_BETS TABLE POLICIES
-- =====================================================
-- Everyone can read open/locked/graded props
CREATE POLICY "Public can read active props"
  ON prop_bets FOR SELECT
  USING (status IN ('open', 'locked', 'graded'));

-- Admins can manage all props
CREATE POLICY "Admins can manage props"
  ON prop_bets FOR ALL
  USING (is_admin());

-- =====================================================
-- PROP_ANSWERS TABLE POLICIES
-- =====================================================
-- Users can read their own answers
CREATE POLICY "Users can read own answers"
  ON prop_answers FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert/update their own answers
CREATE POLICY "Users can manage own answers"
  ON prop_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own answers"
  ON prop_answers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own answers"
  ON prop_answers FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can read all answers
CREATE POLICY "Admins can read all answers"
  ON prop_answers FOR SELECT
  USING (is_admin());

-- =====================================================
-- GAME_STATE TABLE POLICIES
-- =====================================================
-- Everyone can read game state (public display)
CREATE POLICY "Public can read game state"
  ON game_state FOR SELECT
  USING (true);

-- Only admins can update game state
CREATE POLICY "Admins can update game state"
  ON game_state FOR UPDATE
  USING (is_admin());

-- =====================================================
-- SETTINGS TABLE POLICIES
-- =====================================================
-- Everyone can read settings (needed for frontend)
CREATE POLICY "Public can read settings"
  ON settings FOR SELECT
  USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can manage settings"
  ON settings FOR ALL
  USING (is_admin());

-- =====================================================
-- Add index for admin lookups
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
