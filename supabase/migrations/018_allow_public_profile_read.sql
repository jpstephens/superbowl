-- =====================================================
-- Allow Public Read Access to Profiles
--
-- The grid needs to display names publicly, so anonymous
-- users need to be able to read profile names.
-- =====================================================

-- Add policy for public/anonymous read access to profiles
CREATE POLICY "Public can read profiles for grid display"
  ON profiles FOR SELECT
  USING (true);
