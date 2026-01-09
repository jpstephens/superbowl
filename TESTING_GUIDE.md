# Testing Guide for Super Bowl Pool Platform

## Quick Start Testing

### 1. Add Test Data

**In Supabase SQL Editor:**
1. Go to https://supabase.com/dashboard
2. Click "SQL Editor" in the left sidebar
3. Open the file: `supabase/test_data.sql`
4. Copy and paste the entire SQL content
5. Click "Run"

This will create:
- 5 test users with different amounts of squares
- Some squares assigned and paid
- Payment records
- Activity feed entries

### 2. Test as a Regular User

**Homepage (http://localhost:3000):**
- [ ] Page loads without errors
- [ ] Grid displays correctly (10x10, numbers 0-9 on axes)
- [ ] Can see test users in leaderboard
- [ ] Can see activity feed
- [ ] Can click squares to select them
- [ ] Clicking selected square again deselects it
- [ ] Selected squares show in sidebar
- [ ] Total price calculates correctly ($50 × number of squares)

**Selecting Squares:**
- [ ] Click 3 squares → sidebar shows "Squares: 3, Total: $150"
- [ ] Click "Continue to Registration"
- [ ] Fill out form with:
  - Name: Test User
  - Email: test@example.com
  - Phone: +15559998888
- [ ] Click "Continue to Payment"

**Payment Page:**
- [ ] Shows total amount
- [ ] Venmo option available
- [ ] Stripe option available
- [ ] Click "Select Venmo" → QR code appears
- [ ] Click "Select Stripe" → Test checkout ready

### 3. Test as Admin

**Admin Login (http://localhost:3000/admin/login):**
- [ ] Can log in with your admin email/password
- [ ] Redirects to dashboard

**Admin Dashboard:**
- [ ] Shows total users count
- [ ] Shows total revenue
- [ ] Shows paid squares count
- [ ] Links to payments, settings, and grid view work

**Admin Payments:**
- [ ] Can see test payment records
- [ ] "Confirm" button works
- [ ] Payment status updates

**Admin Settings:**
- [ ] Can view current settings
- [ ] Change a value (e.g., prize amount)
- [ ] Click "Save Settings"
- [ ] Shows "Settings saved successfully!"
- [ ] Refresh page, changes persist

### 4. Test Edge Cases

**Empty Grid Selection:**
- [ ] Try to continue with 0 squares selected
- [ ] Should show error or disable button

**Multiple Square Selection:**
- [ ] Select 10 squares
- [ ] Total should be $500
- [ ] All show in sidebar

**Grid Status Indicators:**
- [ ] Available squares: white
- [ ] Claimed squares: yellow
- [ ] Paid squares: green
- [ ] Confirmed squares: blue

## Testing Scenarios

### Scenario 1: First-Time User

1. Visit homepage
2. Click 5 squares on the grid
3. Click "Continue to Registration"
4. Fill in details
5. Choose payment method
6. Complete payment (test with Stripe test card: 4242 4242 4242 4242)
7. Land on thank you page
8. Should see their squares if they log in

### Scenario 2: Admin Monitoring

1. Log in to admin panel
2. View dashboard statistics
3. Go to payments page
4. Confirm pending payments
5. Update settings (change prize amounts)
6. View leaderboard
7. Check activity feed updates

### Scenario 3: Multiple Users

1. Create multiple test users (via SQL)
2. Each claims different squares
3. Some pay via Venmo, some via Stripe
4. Admin confirms payments
5. Check leaderboard updates
6. Check activity feed shows all purchases

## Database Testing

### Check Grid Population
```sql
SELECT COUNT(*) as total_squares FROM grid_squares;
-- Should return 100

SELECT 
  COUNT(*) FILTER (WHERE status = 'available') as available,
  COUNT(*) FILTER (WHERE status = 'paid') as paid,
  COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed
FROM grid_squares;
```

### Check Users
```sql
SELECT name, email, phone, total_squares 
FROM profiles 
ORDER BY total_squares DESC;
```

### Check Payments
```sql
SELECT 
  p.email,
  pay.amount,
  pay.method,
  pay.status,
  pay.created_at
FROM payments pay
JOIN profiles p ON pay.user_id = p.id
ORDER BY pay.created_at DESC;
```

### Check Activity Feed
```sql
SELECT * FROM purchase_activity ORDER BY created_at DESC LIMIT 10;
```

## Stripe Test Cards

Use these in test mode:

**Successful Payment:**
- Card: 4242 4242 4242 4242
- Exp: Any future date (12/34)
- CVC: Any 3 digits (123)

**Decline Card:**
- Card: 4000 0000 0000 0002

**Requires Authentication:**
- Card: 4000 0027 6000 3184

## Common Issues

### Issue: Grid shows 9x9 instead of 10x10
**Solution:** Check browser console. Should show "Loaded squares: 100"
If not, re-run the migration SQL.

### Issue: Can't log in to admin
**Solution:** Make sure you added yourself to `admin_users` table

### Issue: Settings won't save
**Solution:** Already fixed - should work now

### Issue: No squares showing
**Solution:** Run the test data SQL again

### Issue: Leaderboard/Activity empty
**Solution:** Normal if no one has bought squares yet. Add test data.

## Cleanup Test Data

To remove all test data and start fresh:

```sql
-- Delete test data
DELETE FROM purchase_activity;
DELETE FROM payments WHERE method = 'stripe'; -- Keep only Venmo test data
UPDATE grid_squares SET 
  status = 'available',
  user_id = NULL,
  claimed_at = NULL,
  paid_at = NULL,
  payment_method = NULL
WHERE status IN ('claimed', 'paid');
DELETE FROM profiles WHERE email LIKE '%example.com';
```

## Production Testing Checklist

Before going live:

- [ ] Test with real Stripe test mode
- [ ] Test Venmo QR code generation
- [ ] Test SMS notifications with real number
- [ ] Test admin workflows
- [ ] Test user registration flow
- [ ] Test payment confirmations
- [ ] Load test with multiple concurrent users
- [ ] Test mobile responsiveness
- [ ] Test browser compatibility (Chrome, Safari, Firefox)
- [ ] Verify all environment variables set
- [ ] Test error handling
- [ ] Test security (SQL injection, XSS prevention)

