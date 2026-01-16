-- =====================================================
-- Cleanup Test Data
-- Keeps only Jason Stephens' data for squares 13 and 31
-- =====================================================

-- First, identify Jason Stephens' profile ID
-- Square 13 = row 1, col 2 (1*10 + 2 + 1 = 13)
-- Square 31 = row 3, col 0 (3*10 + 0 + 1 = 31)

-- Reset all squares EXCEPT 13 and 31 to available
UPDATE grid_squares
SET
  user_id = NULL,
  status = 'available',
  paid_at = NULL
WHERE NOT (
  (row_number = 1 AND col_number = 2) OR  -- Square 13
  (row_number = 3 AND col_number = 0)     -- Square 31
);

-- Delete all payments NOT belonging to the owner of squares 13/31
DELETE FROM payments
WHERE user_id NOT IN (
  SELECT DISTINCT user_id
  FROM grid_squares
  WHERE user_id IS NOT NULL
  AND (
    (row_number = 1 AND col_number = 2) OR
    (row_number = 3 AND col_number = 0)
  )
);

-- Delete all magic tokens
DELETE FROM magic_tokens;

-- Delete all profiles NOT linked to squares 13/31
DELETE FROM profiles
WHERE id NOT IN (
  SELECT DISTINCT user_id
  FROM grid_squares
  WHERE user_id IS NOT NULL
  AND (
    (row_number = 1 AND col_number = 2) OR
    (row_number = 3 AND col_number = 0)
  )
);

-- Verify what's left
-- SELECT * FROM profiles;
-- SELECT * FROM grid_squares WHERE status = 'paid';
-- SELECT * FROM payments;
