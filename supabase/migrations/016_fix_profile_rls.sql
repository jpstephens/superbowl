-- =====================================================
-- Fix Profile RLS Policies
--
-- The previous policy used auth.uid() = id, but profile IDs
-- are not the same as auth user IDs. We need to match by email instead.
-- =====================================================

-- Drop the old policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow insert for registration" ON profiles;

-- Users can read their own profile (match by email)
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

-- Users can update their own profile (match by email)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.jwt() ->> 'email' = email);

-- Allow service role to insert profiles (for webhooks)
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Also fix payments RLS - same issue
DROP POLICY IF EXISTS "Users can read own payments" ON payments;

-- Users can read their own payments (via profile email match)
CREATE POLICY "Users can read own payments"
  ON payments FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM profiles WHERE email = auth.jwt() ->> 'email'
    )
  );
