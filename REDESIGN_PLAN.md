# Super Bowl Pool - Complete Redesign Plan

## Overview
This plan outlines a comprehensive redesign to improve user experience, add authentication, integrate live scores, calculate win probabilities, and add admin tournament launch functionality.

---

## 1. Page Layout & Flow Redesign

### Current Issues
- Homepage is cluttered with too much information
- No clear user journey
- Registration doesn't create auth accounts
- Users can't easily see their dashboard

### New Layout Order

#### **Homepage (`/`)** - Public Landing Page
**Purpose:** Attract and inform visitors

**Layout:**
1. **Hero Section**
   - Logo
   - "Super Bowl 2025 Pool" title
   - Brief tagline
   - Primary CTA: "Get Started" or "View Pool"

2. **Live Score Section** (if game is live)
   - Current game score from API
   - AFC vs NFC teams
   - Quarter/time remaining

3. **Team Breakdown**
   - AFC team card
   - NFC team card
   - Matchup details

4. **How It Works** (3-step process)
   - Select squares
   - Register & Pay
   - Win prizes

5. **Pool Stats** (public view)
   - Squares sold / total
   - Total prize pool
   - Time until game

6. **Recent Activity Feed** (last 5-10 purchases)

7. **Call to Action**
   - "Join the Pool" button → redirects to login/register

**Key Changes:**
- Remove grid from homepage (too cluttered)
- Remove "Your Selection" sidebar (requires login)
- Make it a true landing page
- Grid becomes a separate `/pool` page

---

#### **Pool Grid Page (`/pool`)** - Public Grid View
**Purpose:** Show available squares for selection

**Layout:**
1. Header with login/register buttons
2. Full 10x10 grid
3. Legend (available, claimed, paid)
4. "Select Squares" button (requires login)
5. If logged in: shows user's squares highlighted

**Access:**
- Public: Can view grid
- Logged in: Can select squares

---

#### **Login/Register Page (`/auth/login` and `/auth/register`)**
**Purpose:** User authentication

**Login Page:**
- Email + Password
- "Forgot Password" link
- "Don't have an account? Register" link
- OAuth options (optional): Google, Apple

**Register Page:**
- Name
- Email
- Password
- Confirm Password
- Phone (optional, for SMS)
- Terms acceptance
- "Already have account? Login" link

**After Registration:**
- Auto-login user
- Create profile in `profiles` table
- Link to Supabase Auth user
- Redirect to dashboard

---

#### **User Dashboard (`/dashboard`)** - Protected Route
**Purpose:** User's personal hub

**Layout:**
1. **Welcome Header**
   - User name
   - Quick stats (total squares, total invested)

2. **Live Game Score** (from external API)
   - Real-time score updates
   - Quarter/time
   - Team names

3. **My Squares Section**
   - Grid visualization showing user's squares
   - List of square numbers (row_score - col_score)
   - Payment status for each
   - Copy numbers button

4. **Current Winners** (if game is live)
   - Quarter 1 winner (if completed)
   - Quarter 2 winner (if completed)
   - Quarter 3 winner (if completed)
   - Quarter 4 winner (if completed)
   - Shows: Winner name, square numbers, prize amount

5. **Win Probability Calculator**
   - For each of user's squares
   - Shows probability based on:
     - Current score
     - Time remaining
     - Historical quarter-end score patterns
     - Mathematical probability
   - Visual indicator (progress bar or percentage)

6. **Quick Actions**
   - View full pool grid
   - Buy more squares
   - Share my squares
   - View payment history

7. **Countdown Timer**
   - Time until game (if pre-game)
   - Time remaining (if live)

**Access:**
- Requires authentication
- Redirects to login if not authenticated

---

## 2. Authentication System

### Current State
- Registration page exists but doesn't create auth accounts
- Users are created in `profiles` table but not linked to Supabase Auth
- No login page for regular users

### Implementation Plan

#### **Step 1: Create Auth Pages**
- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/auth/forgot-password` - Password reset (optional)

#### **Step 2: Update Registration Flow**
**Current:** Register → Payment → Create profile
**New:** Select squares → Payment → Auto-register → Send login link

**New Flow:**
1. User clicks "Get Started" on homepage
2. Redirects to `/pool` (public grid view)
3. User selects squares (stored in session)
4. User clicks "Continue" → Goes to payment page
5. User enters name, email, phone on payment page
6. User completes payment (Stripe/Venmo)
7. **After payment success:**
   - Auto-create Supabase Auth account
   - Generate temporary password
   - Create profile linked to auth user
   - Link squares to user
   - Send email with login link and temporary password
   - Password resets on first login
8. User receives email → Clicks link → Sets new password → Logged in → Dashboard

#### **Step 3: Update Database Schema**
- Link `profiles` table to Supabase Auth `auth.users`
- Add `auth_user_id UUID` column to `profiles` table
- Create foreign key relationship

#### **Step 4: Middleware for Protected Routes**
- Create middleware to protect `/dashboard`, `/my-squares`
- Redirect to `/auth/login` if not authenticated
- Store intended destination for redirect after login

---

## 3. Live Score Integration

### API Options
1. **API-Sports.io** (free tier: 100 requests/day)
2. **RapidAPI NFL** (free tier available)
3. **SportsDataIO** (free basic tier)
4. **The Odds API** (free tier limited)

### Implementation Plan

#### **Step 1: Choose API**
**Selected: API-Sports.io** - Free tier provides 100 requests/day, reliable, good documentation
**Alternative: RapidAPI NFL** - Multiple free providers available

#### **Step 2: Create API Route**
- `/api/game-score` - Server-side route
- Fetches score from external API
- Caches for 30-60 seconds to avoid rate limits
- Returns: `{ afcScore, nfcScore, quarter, timeRemaining, isLive }`

#### **Step 3: Update GameScore Component**
- Fetch from `/api/game-score` instead of mock data
- Auto-refresh every 30 seconds when live
- Show loading state
- Handle API errors gracefully

#### **Step 4: Environment Variables**
Add to `.env.local`:
```
NFL_API_KEY=your_api_key_here
NFL_API_URL=https://api.example.com
```

---

## 4. Win Probability Calculator

### Calculation Logic

For each user square with numbers (row_score, col_score):

**Probability = P(Quarter End Score matches square)**

**Factors:**
1. **Current Score**: If game is live, use current score
2. **Time Remaining**: More time = more scoring opportunities
3. **Historical Data**: Average scores per quarter in Super Bowl history
4. **Team Performance**: Offensive/defensive stats (if available)

**Formula (Simplified):**
```
For each quarter:
  - Calculate possible score combinations that match square
  - Weight by time remaining and current pace
  - Sum probabilities for all matching scenarios
```

**Example:**
- User has square: 7-3
- Current score: AFC 14, NFC 10 (4th quarter, 5:00 remaining)
- Need: AFC to end with 7, NFC to end with 3 (last digit)
- Probability = P(AFC ends in 7) × P(NFC ends in 3)
- Based on: Current score, time remaining, scoring pace

### Implementation

#### **Component: `WinProbability.tsx`**
- Takes user's squares
- Takes current game score
- Calculates probability for each square
- Displays as percentage with visual indicator
- Updates in real-time as score changes

#### **API Route: `/api/calculate-probability`**
- Server-side calculation
- Takes square numbers and current score
- Returns probability percentage
- Can be cached for performance

---

## 5. Current Winners Display

### Data Source
- `quarterly_winners` table (already exists)
- Populated when admin announces winners

### Component: `CurrentWinners.tsx`
**Displays:**
- Each completed quarter
- Winner name (from profile)
- Winning square numbers
- Prize amount
- Announcement time

**Layout:**
- Card for each quarter
- Trophy icon for winners
- "Pending" for incomplete quarters
- Updates in real-time

---

## 6. Admin: Launch Tournament Feature

### Purpose
Randomize the row_score and col_score values for all grid squares.
This should only happen once when the tournament is "launched."

### Implementation

#### **Database Changes**
Add to `settings` table:
```sql
INSERT INTO settings (key, value) VALUES
  ('tournament_launched', 'false'),
  ('tournament_launched_at', NULL);
```

#### **Admin Dashboard Button**
- "Launch Tournament" button in admin dashboard
- Only visible if `tournament_launched = false`
- Confirmation dialog before launching
- Once launched, button should be disabled/hidden

#### **API Route: `/api/admin/launch-tournament`**
**Protected:** Admin only

**Logic:**
1. Check if tournament already launched (prevent double-launch)
2. Generate random numbers 0-9 for each row (10 rows)
3. Generate random numbers 0-9 for each column (10 columns)
4. Update all grid_squares:
   ```sql
   UPDATE grid_squares 
   SET 
     row_score = <random_row_value>,
     col_score = <random_col_value>
   WHERE row_number = X AND col_number = Y
   ```
5. Update settings:
   ```sql
   UPDATE settings 
   SET 
     value = 'true',
     updated_at = NOW()
   WHERE key = 'tournament_launched';
   
   UPDATE settings 
   SET 
     value = NOW()::text,
     updated_at = NOW()
   WHERE key = 'tournament_launched_at';
   ```
6. Return success/error

**Important:**
- This should be irreversible
- Add confirmation: "Are you sure? This cannot be undone."
- Log the action for audit trail

#### **UI Component**
- Large, prominent button in admin dashboard
- Warning message about irreversibility
- Success message after launch
- Show launch date if already launched

---

## 7. Database Schema Updates

### Required Changes

#### **1. Link Profiles to Auth Users**
```sql
ALTER TABLE profiles 
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX idx_profiles_auth_user_id ON profiles(auth_user_id);
```

#### **2. Add Tournament Launch Settings**
```sql
INSERT INTO settings (key, value) VALUES
  ('tournament_launched', 'false'),
  ('tournament_launched_at', NULL)
ON CONFLICT (key) DO NOTHING;
```

#### **3. Add API Key Storage (Optional)**
```sql
INSERT INTO settings (key, value) VALUES
  ('nfl_api_key', ''),
  ('nfl_api_provider', '')
ON CONFLICT (key) DO NOTHING;
```

---

## 8. File Structure Changes

### New Files to Create

```
app/
  auth/
    login/
      page.tsx          # User login page
    register/
      page.tsx         # User registration page
    forgot-password/
      page.tsx         # Password reset (optional)
  pool/
    page.tsx           # Public pool grid view
  dashboard/
    page.tsx           # User dashboard (protected)
  api/
    game-score/
      route.ts         # Fetch live score from external API
    calculate-probability/
      route.ts         # Calculate win probability
    admin/
      launch-tournament/
        route.ts       # Launch tournament (admin only)

components/
  WinProbability.tsx   # Win probability calculator
  CurrentWinners.tsx  # Display current quarter winners
  ProtectedRoute.tsx  # Route protection wrapper
  AuthGuard.tsx       # Authentication guard component

lib/
  auth/
    middleware.ts      # Auth middleware
  probability/
    calculator.ts      # Probability calculation logic
  nfl/
    api.ts            # NFL API integration
```

### Files to Modify

```
app/
  page.tsx            # Redesign as landing page
  register/
    page.tsx         # Update to create auth account
  my-squares/
    page.tsx         # Move to dashboard or keep separate

components/
  GameScore.tsx      # Update to use real API
  TeamBreakdown.tsx  # Keep as is

supabase/
  migrations/
    003_add_auth_link.sql  # Link profiles to auth users
```

---

## 9. Implementation Priority

### Phase 1: Core Authentication (Week 1)
1. ✅ Create login/register pages
2. ✅ Update registration to create auth accounts
3. ✅ Link profiles to auth users
4. ✅ Add protected route middleware
5. ✅ Update registration flow

### Phase 2: Dashboard & Layout (Week 1-2)
1. ✅ Redesign homepage as landing page
2. ✅ Create `/pool` page for grid
3. ✅ Create `/dashboard` page
4. ✅ Move user squares to dashboard
5. ✅ Add current winners component

### Phase 3: Live Score Integration (Week 2)
1. ✅ Choose and set up NFL API
2. ✅ Create `/api/game-score` route
3. ✅ Update GameScore component
4. ✅ Add auto-refresh functionality
5. ✅ Error handling

### Phase 4: Win Probability (Week 2-3)
1. ✅ Create probability calculation logic
2. ✅ Build WinProbability component
3. ✅ Integrate into dashboard
4. ✅ Real-time updates

### Phase 5: Admin Launch Tournament (Week 3)
1. ✅ Add launch tournament button
2. ✅ Create API route
3. ✅ Add confirmation dialog
4. ✅ Test thoroughly
5. ✅ Add audit logging

---

## 10. User Flow Diagrams

### New User Journey
```
Homepage → Click "Get Started" → /auth/register
→ Create account → Auto-login → /pool
→ Select squares → /payment → Complete payment
→ Redirect to /dashboard → See squares & stats
```

### Returning User Journey
```
Homepage → Click "Login" → /auth/login
→ Enter credentials → /dashboard
→ View squares, scores, probabilities
```

### Admin Journey
```
/admin/login → Admin Dashboard
→ View stats → Click "Launch Tournament"
→ Confirm → Tournament launched
→ Numbers randomized → Users can see their numbers
```

---

## 11. Technical Considerations

### Security
- All API routes must verify authentication
- Admin routes must verify admin status
- Rate limiting on external API calls
- Input validation on all forms
- SQL injection prevention (use parameterized queries)

### Performance
- Cache API responses (30-60 seconds)
- Use React Query or SWR for data fetching
- Optimize database queries with indexes
- Lazy load components where possible

### Error Handling
- Graceful API failures (show cached data or "unavailable")
- User-friendly error messages
- Logging for debugging
- Fallback UI states

### Testing
- Test authentication flows
- Test probability calculations
- Test tournament launch (one-time operation)
- Test API integration
- Test responsive design

---

## 12. Questions to Resolve

1. **API Choice**: Which NFL API to use? (Cost, reliability, features)
2. **Probability Algorithm**: How sophisticated should it be? (Simple vs. complex)
3. **Tournament Launch Timing**: When should admin launch? (Before sales? After all squares sold?)
4. **User Registration**: Require email verification?
5. **Password Reset**: Implement forgot password flow?
6. **OAuth**: Add Google/Apple sign-in?

---

## 13. Next Steps

1. **Review this plan** and approve approach
2. **Choose NFL API** provider
3. **Create database migration** for auth linking
4. **Start with Phase 1** (Authentication)
5. **Iterate through phases** systematically

---

## Summary

This redesign will:
- ✅ Improve user experience with clear navigation
- ✅ Add proper authentication system
- ✅ Create personalized user dashboard
- ✅ Integrate live game scores
- ✅ Calculate and display win probabilities
- ✅ Add admin tournament launch feature
- ✅ Show current winners in real-time

The result: A professional, feature-rich Super Bowl pool platform that users will love!

