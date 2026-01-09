-- Migration: Fix Number Assignment Logic
-- Numbers should only be assigned AFTER all squares are sold, not at grid creation
-- This migration resets existing grids and updates the schema

-- Reset all grid squares to have NULL scores (will be assigned on launch)
UPDATE grid_squares
SET row_score = NULL, col_score = NULL
WHERE row_score IS NOT NULL OR col_score IS NOT NULL;

-- Update the grid_squares table to allow NULL scores initially
ALTER TABLE grid_squares
ALTER COLUMN row_score DROP NOT NULL,
ALTER COLUMN col_score DROP NOT NULL;

-- Add check constraint to ensure scores are either NULL or 0-9
ALTER TABLE grid_squares
DROP CONSTRAINT IF EXISTS grid_squares_row_score_check,
DROP CONSTRAINT IF EXISTS grid_squares_col_score_check;

ALTER TABLE grid_squares
ADD CONSTRAINT grid_squares_row_score_check 
  CHECK (row_score IS NULL OR (row_score >= 0 AND row_score <= 9));

ALTER TABLE grid_squares
ADD CONSTRAINT grid_squares_col_score_check 
  CHECK (col_score IS NULL OR (col_score >= 0 AND col_score <= 9));

-- Add comment for documentation
COMMENT ON COLUMN grid_squares.row_score IS 'Assigned after all squares are sold. NULL before launch.';
COMMENT ON COLUMN grid_squares.col_score IS 'Assigned after all squares are sold. NULL before launch.';



