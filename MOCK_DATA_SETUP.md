# Mock Data Setup Guide

## Quick Setup

To populate your database with comprehensive mock data:

1. Go to Supabase Dashboard → SQL Editor
2. Open file: `supabase/mock_data_full.sql`
3. Copy ALL the SQL
4. Paste into SQL Editor
5. Click **Run**

## What Gets Created

### Users (12 total)
- 12 different users with varying square counts (3-15 squares each)
- Total: ~103 squares sold
- Mix of paid and confirmed statuses

### Grid Squares
- ~103 squares assigned to users
- Various statuses: paid, confirmed
- Distributed across the grid
- Realistic purchase timestamps

### Payments
- Payment records for all users
- Mix of confirmed and completed statuses
- Realistic amounts based on square counts

### Purchase Activity
- 12 activity feed entries
- Staggered timestamps (last 10 days)
- Shows recent purchases

### Quarterly Winners
- Q1 Winner: Sarah Williams (7-3)
- Q2 Winner: Emily Chen (4-9)
- Q3 & Q4: Pending

## After Running

You'll see:
- ✅ Grid with many squares sold (green = paid/confirmed)
- ✅ Leaderboard with 12 players
- ✅ Activity feed with recent purchases
- ✅ Quarter winners showing Q1 & Q2 completed
- ✅ Realistic data distribution

## Reset Mock Data

To clear and re-run:
```sql
DELETE FROM quarterly_winners;
DELETE FROM purchase_activity;
DELETE FROM payments;
UPDATE grid_squares SET user_id = NULL, status = 'available', claimed_at = NULL, paid_at = NULL, payment_method = NULL;
DELETE FROM profiles WHERE email LIKE '%@example.com';
```

Then run `mock_data_full.sql` again.



