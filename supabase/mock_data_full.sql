-- Comprehensive Mock Data for Super Bowl Pool
-- Run this in Supabase SQL Editor to populate full mock data
-- Based on 2024 Super Bowl (Chiefs vs 49ers)

-- Clear existing test data (optional - comment out if you want to keep existing data)
-- DELETE FROM quarterly_winners;
-- DELETE FROM purchase_activity;
-- DELETE FROM payments;
-- DELETE FROM grid_squares WHERE user_id IS NOT NULL;
-- DELETE FROM profiles WHERE email LIKE '%@example.com';

-- 1. Create comprehensive test users
INSERT INTO profiles (name, email, phone, total_squares)
VALUES
  ('Michael Johnson', 'michael.johnson@example.com', '+15551234567', 8),
  ('Sarah Williams', 'sarah.williams@example.com', '+15559876543', 12),
  ('David Martinez', 'david.martinez@example.com', '+15551112222', 5),
  ('Emily Chen', 'emily.chen@example.com', '+15553334444', 15),
  ('James Anderson', 'james.anderson@example.com', '+15555556666', 6),
  ('Jessica Taylor', 'jessica.taylor@example.com', '+15557778888', 9),
  ('Robert Brown', 'robert.brown@example.com', '+15559990000', 4),
  ('Amanda Davis', 'amanda.davis@example.com', '+15551112233', 11),
  ('Christopher Lee', 'chris.lee@example.com', '+15554445566', 7),
  ('Lauren Garcia', 'lauren.garcia@example.com', '+15556667788', 10),
  ('Daniel Wilson', 'daniel.wilson@example.com', '+15558889900', 3),
  ('Nicole Moore', 'nicole.moore@example.com', '+15550001122', 13)
ON CONFLICT (email) DO UPDATE SET
  total_squares = EXCLUDED.total_squares,
  name = EXCLUDED.name;

-- 2. Assign squares to users with various statuses
-- Michael Johnson - 8 squares (paid)
WITH michael_id AS (SELECT id FROM profiles WHERE email = 'michael.johnson@example.com')
UPDATE grid_squares
SET 
  status = 'paid',
  user_id = (SELECT id FROM michael_id),
  claimed_at = NOW() - INTERVAL '2 days',
  paid_at = NOW() - INTERVAL '2 days',
  payment_method = 'stripe'
WHERE id IN (
  SELECT id FROM grid_squares
  WHERE row_number IN (0, 1, 2) AND col_number IN (0, 1, 2)
  LIMIT 8
);

-- Sarah Williams - 12 squares (confirmed)
WITH sarah_id AS (SELECT id FROM profiles WHERE email = 'sarah.williams@example.com')
UPDATE grid_squares
SET 
  status = 'confirmed',
  user_id = (SELECT id FROM sarah_id),
  claimed_at = NOW() - INTERVAL '5 days',
  paid_at = NOW() - INTERVAL '5 days',
  payment_method = 'stripe'
WHERE id IN (
  SELECT id FROM grid_squares
  WHERE row_number IN (3, 4, 5) AND col_number IN (3, 4, 5, 6)
  LIMIT 12
);

-- David Martinez - 5 squares (paid)
WITH david_id AS (SELECT id FROM profiles WHERE email = 'david.martinez@example.com')
UPDATE grid_squares
SET 
  status = 'paid',
  user_id = (SELECT id FROM david_id),
  claimed_at = NOW() - INTERVAL '1 day',
  paid_at = NOW() - INTERVAL '1 day',
  payment_method = 'stripe'
WHERE id IN (
  SELECT id FROM grid_squares
  WHERE row_number IN (6, 7) AND col_number IN (0, 1, 2)
  LIMIT 5
);

-- Emily Chen - 15 squares (confirmed)
WITH emily_id AS (SELECT id FROM profiles WHERE email = 'emily.chen@example.com')
UPDATE grid_squares
SET 
  status = 'confirmed',
  user_id = (SELECT id FROM emily_id),
  claimed_at = NOW() - INTERVAL '7 days',
  paid_at = NOW() - INTERVAL '7 days',
  payment_method = 'stripe'
WHERE id IN (
  SELECT id FROM grid_squares
  WHERE row_number IN (8, 9) AND col_number IN (0, 1, 2, 3, 4, 5, 6, 7)
  LIMIT 15
);

-- James Anderson - 6 squares (paid)
WITH james_id AS (SELECT id FROM profiles WHERE email = 'james.anderson@example.com')
UPDATE grid_squares
SET 
  status = 'paid',
  user_id = (SELECT id FROM james_id),
  claimed_at = NOW() - INTERVAL '3 days',
  paid_at = NOW() - INTERVAL '3 days',
  payment_method = 'stripe'
WHERE id IN (
  SELECT id FROM grid_squares
  WHERE row_number IN (0, 1) AND col_number IN (7, 8, 9)
  LIMIT 6
);

-- Jessica Taylor - 9 squares (confirmed)
WITH jessica_id AS (SELECT id FROM profiles WHERE email = 'jessica.taylor@example.com')
UPDATE grid_squares
SET 
  status = 'confirmed',
  user_id = (SELECT id FROM jessica_id),
  claimed_at = NOW() - INTERVAL '4 days',
  paid_at = NOW() - INTERVAL '4 days',
  payment_method = 'stripe'
WHERE id IN (
  SELECT id FROM grid_squares
  WHERE row_number IN (2, 3) AND col_number IN (7, 8, 9)
  LIMIT 9
);

-- Robert Brown - 4 squares (paid)
WITH robert_id AS (SELECT id FROM profiles WHERE email = 'robert.brown@example.com')
UPDATE grid_squares
SET 
  status = 'paid',
  user_id = (SELECT id FROM robert_id),
  claimed_at = NOW() - INTERVAL '6 hours',
  paid_at = NOW() - INTERVAL '6 hours',
  payment_method = 'stripe'
WHERE id IN (
  SELECT id FROM grid_squares
  WHERE row_number IN (4, 5) AND col_number IN (7, 8)
  LIMIT 4
);

-- Amanda Davis - 11 squares (confirmed)
WITH amanda_id AS (SELECT id FROM profiles WHERE email = 'amanda.davis@example.com')
UPDATE grid_squares
SET 
  status = 'confirmed',
  user_id = (SELECT id FROM amanda_id),
  claimed_at = NOW() - INTERVAL '6 days',
  paid_at = NOW() - INTERVAL '6 days',
  payment_method = 'stripe'
WHERE id IN (
  SELECT id FROM grid_squares
  WHERE row_number IN (6, 7) AND col_number IN (3, 4, 5, 6, 7, 8)
  LIMIT 11
);

-- Christopher Lee - 7 squares (paid)
WITH chris_id AS (SELECT id FROM profiles WHERE email = 'chris.lee@example.com')
UPDATE grid_squares
SET 
  status = 'paid',
  user_id = (SELECT id FROM chris_id),
  claimed_at = NOW() - INTERVAL '12 hours',
  paid_at = NOW() - INTERVAL '12 hours',
  payment_method = 'stripe'
WHERE id IN (
  SELECT id FROM grid_squares
  WHERE row_number IN (8, 9) AND col_number IN (8, 9)
  LIMIT 7
);

-- Lauren Garcia - 10 squares (confirmed)
WITH lauren_id AS (SELECT id FROM profiles WHERE email = 'lauren.garcia@example.com')
UPDATE grid_squares
SET 
  status = 'confirmed',
  user_id = (SELECT id FROM lauren_id),
  claimed_at = NOW() - INTERVAL '8 days',
  paid_at = NOW() - INTERVAL '8 days',
  payment_method = 'stripe'
WHERE id IN (
  SELECT id FROM grid_squares
  WHERE row_number IN (0, 1, 2) AND col_number IN (3, 4, 5, 6)
  LIMIT 10
);

-- Daniel Wilson - 3 squares (paid)
WITH daniel_id AS (SELECT id FROM profiles WHERE email = 'daniel.wilson@example.com')
UPDATE grid_squares
SET 
  status = 'paid',
  user_id = (SELECT id FROM daniel_id),
  claimed_at = NOW() - INTERVAL '2 hours',
  paid_at = NOW() - INTERVAL '2 hours',
  payment_method = 'stripe'
WHERE id IN (
  SELECT id FROM grid_squares
  WHERE row_number IN (3, 4) AND col_number IN (0, 1)
  LIMIT 3
);

-- Nicole Moore - 13 squares (confirmed)
WITH nicole_id AS (SELECT id FROM profiles WHERE email = 'nicole.moore@example.com')
UPDATE grid_squares
SET 
  status = 'confirmed',
  user_id = (SELECT id FROM nicole_id),
  claimed_at = NOW() - INTERVAL '9 days',
  paid_at = NOW() - INTERVAL '9 days',
  payment_method = 'stripe'
WHERE id IN (
  SELECT id FROM grid_squares
  WHERE row_number IN (5, 6, 7) AND col_number IN (9)
  LIMIT 13
);

-- 3. Create payment records for all users
INSERT INTO payments (user_id, amount, method, status, created_at)
SELECT 
  p.id,
  p.total_squares * 50.00 as amount,
  'stripe' as method,
  CASE 
    WHEN p.total_squares >= 10 THEN 'confirmed'
    ELSE 'completed'
  END as status,
  NOW() - (random() * INTERVAL '10 days')
FROM profiles p
WHERE p.email LIKE '%@example.com'
ON CONFLICT DO NOTHING;

-- 4. Create purchase activity feed with realistic timestamps
INSERT INTO purchase_activity (user_id, user_name, square_count, created_at)
SELECT 
  p.id,
  p.name,
  p.total_squares,
  NOW() - (random() * INTERVAL '10 days') - INTERVAL '1 hour' * (row_number() OVER ())
FROM profiles p
WHERE p.email LIKE '%@example.com'
ORDER BY random()
ON CONFLICT DO NOTHING;

-- 5. Create some quarterly winners (Q1 and Q2 completed)
-- Q1 Winner: Sarah Williams with square 7-3
WITH sarah_id AS (SELECT id FROM profiles WHERE email = 'sarah.williams@example.com')
INSERT INTO quarterly_winners (quarter, user_id, row_score, col_score, prize_amount, announced_at)
SELECT 
  1 as quarter,
  (SELECT id FROM sarah_id),
  7 as row_score,
  3 as col_score,
  250.00 as prize_amount,
  NOW() - INTERVAL '2 hours'
WHERE EXISTS (SELECT 1 FROM sarah_id);

-- Q2 Winner: Emily Chen with square 4-9
WITH emily_id AS (SELECT id FROM profiles WHERE email = 'emily.chen@example.com')
INSERT INTO quarterly_winners (quarter, user_id, row_score, col_score, prize_amount, announced_at)
SELECT 
  2 as quarter,
  (SELECT id FROM emily_id),
  4 as row_score,
  9 as col_score,
  250.00 as prize_amount,
  NOW() - INTERVAL '1 hour'
WHERE EXISTS (SELECT 1 FROM emily_id);

-- 6. Update total_squares count for all profiles
UPDATE profiles
SET total_squares = (
  SELECT COUNT(*) 
  FROM grid_squares 
  WHERE grid_squares.user_id = profiles.id
)
WHERE email LIKE '%@example.com';

-- 7. Verification query
SELECT 
  'Mock Data Summary' as info,
  (SELECT COUNT(*) FROM profiles WHERE email LIKE '%@example.com') as total_users,
  (SELECT COUNT(*) FROM grid_squares WHERE status IN ('paid', 'confirmed')) as sold_squares,
  (SELECT COUNT(*) FROM payments) as total_payments,
  (SELECT COUNT(*) FROM purchase_activity) as activity_entries,
  (SELECT COUNT(*) FROM quarterly_winners) as winners;



