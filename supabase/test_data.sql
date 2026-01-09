-- Test Data for Super Bowl Pool Platform
-- Run this in Supabase SQL Editor to populate test data

-- 1. Create some test users
INSERT INTO profiles (name, email, phone, total_squares)
VALUES
  ('John Doe', 'john@example.com', '+15551234567', 5),
  ('Jane Smith', 'jane@example.com', '+15559876543', 3),
  ('Bob Johnson', 'bob@example.com', '+15551112222', 7),
  ('Alice Williams', 'alice@example.com', '+15553334444', 2),
  ('Charlie Brown', 'charlie@example.com', '+15555556666', 1)
ON CONFLICT (email) DO NOTHING;

-- 2. Claim some squares as "paid" for John Doe
WITH john_id AS (SELECT id FROM profiles WHERE email = 'john@example.com')
UPDATE grid_squares
SET 
  status = 'paid',
  user_id = (SELECT id FROM john_id),
  claimed_at = NOW(),
  paid_at = NOW(),
  payment_method = 'stripe'
WHERE id IN (
  SELECT id FROM grid_squares
  WHERE row_number IN (0, 1, 2) AND col_number IN (0, 1)
  LIMIT 5
);

-- 3. Claim some squares as "confirmed" for Jane Smith
WITH jane_id AS (SELECT id FROM profiles WHERE email = 'jane@example.com')
UPDATE grid_squares
SET 
  status = 'confirmed',
  user_id = (SELECT id FROM jane_id),
  claimed_at = NOW(),
  paid_at = NOW(),
  payment_method = 'venmo'
WHERE id IN (
  SELECT id FROM grid_squares
  WHERE row_number IN (5, 6) AND col_number IN (3, 4)
  LIMIT 6
);

-- 4. Create some payment records
WITH profiles_data AS (
  SELECT id, email FROM profiles WHERE email IN ('john@example.com', 'jane@example.com', 'bob@example.com')
)
INSERT INTO payments (user_id, amount, method, status)
SELECT 
  id,
  CASE email
    WHEN 'john@example.com' THEN 250.00  -- 5 squares × $50
    WHEN 'jane@example.com' THEN 150.00   -- 3 squares × $50
    WHEN 'bob@example.com' THEN 350.00    -- 7 squares × $50
  END as amount,
  'stripe' as method,
  'confirmed' as status
FROM profiles_data;

-- 5. Create purchase activity feed
INSERT INTO purchase_activity (user_id, user_name, square_count)
SELECT 
  id,
  name,
  total_squares
FROM profiles
WHERE total_squares > 0
ORDER BY created_at DESC
LIMIT 5;

-- 6. Verify the data
SELECT 'Test Data Created Successfully!' as status;

-- Check what was created:
SELECT 'Profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'Paid Squares', COUNT(*) FROM grid_squares WHERE status IN ('paid', 'confirmed')
UNION ALL
SELECT 'Payments', COUNT(*) FROM payments
UNION ALL
SELECT 'Activity Feed', COUNT(*) FROM purchase_activity;

