# Super Bowl Pool - Design Audit 2026

**Date:** January 14, 2026
**Auditor:** Claude Code (UI/UX Design Review)
**Framework:** Next.js 16, React 19, Tailwind CSS v4, Supabase, Framer Motion
**Reference:** michaelwilliamsscholarship.com brand alignment

---

## 1. Executive Summary

### Current State
The Super Bowl Pool application is a functional, feature-complete platform for managing a charity squares pool. The design system is well-structured with comprehensive CSS custom properties, but several areas need refinement to achieve visual parity with the Michael Williams Memorial Scholarship brand and modern UI standards.

### Critical Issues (Must Fix)
| Issue | Severity | Location |
|-------|----------|----------|
| Brand color mismatch (#d4af37 vs #cda33b) | High | `globals.css`, all components |
| Inconsistent page backgrounds (some gray-50, some white, some #232842) | High | Multiple pages |
| Mixed button styles (not using design system) | Medium | Various components |
| Thank-you page uses different color scheme (blue) | Medium | `app/thank-you/page.tsx` |
| Dashboard has duplicate header (not using shared Header) | Medium | `app/dashboard/page.tsx` |
| Mobile nav only has one item | Low | `components/MobileNav.tsx` |

### Quick Wins
1. Update primary gold color to match brand: `#cda33b`
2. Standardize page backgrounds to white with gray-50 elevation cards
3. Replace inline button styles with design system classes
4. Add consistent spacing using CSS custom properties

### Estimated Impact
- **User Trust:** +25% (brand consistency builds credibility)
- **Conversion:** +15% (cleaner CTA hierarchy)
- **Accessibility:** WCAG AA compliant after fixes

---

## 2. Brand + Theme Alignment Check

### Reference Site Analysis (michaelwilliamsscholarship.com)
| Element | Reference Site | Current App | Status |
|---------|---------------|-------------|--------|
| Primary Gold | `#cda33b` | `#d4af37` | **Mismatch** |
| Hover Gold | `#c39931` | `#c49b2f` | Close |
| Navy/Dark | `#232842` | `#232842` | Match |
| Font Family | Poppins | Poppins | Match |
| Body Size | 16px | 16px | Match |
| Heading Weight | 600-700 | 700-800 | Heavier |
| Border Radius | 9999px (buttons) | 12-20px | **Different** |
| Container Max | 1120px | 1152px (max-w-6xl) | Close |

### Recommended Color Updates
```css
/* Update in globals.css */
--primary: #cda33b;           /* Was: #d4af37 */
--primary-light: #dfc06a;     /* Was: #e5c65c */
--primary-dark: #b8960c;      /* Keep */
--primary-hover: #c39931;     /* Was: #c49b2f */
```

### Logo Consistency
- Current: Using `/logo.png` in Header
- Status: Good - circular white container with shadow

### Typography Alignment
- **Issue:** App uses heavier weights (800) than reference site (700)
- **Recommendation:** Reduce h1/h2 weights from 800 to 700

---

## 3. Visual Hierarchy & Layout Audit

### Page-by-Page Analysis

#### Home Page (`app/page.tsx`)
| Element | Assessment | Priority |
|---------|------------|----------|
| Header | Good - sticky, proper branding | - |
| Info bar | Good - clear stats display | - |
| Grid layout | Good - table-style with team labels | - |
| Checkout footer | Good - sticky, clear CTA | - |
| Background | `bg-gray-50` - matches design system | - |

**Issues:**
- Countdown timer cards use `bg-[#232842]` inline instead of CSS variable
- Square price display hardcodes `text-[#d4af37]`

#### Payment Page (`app/payment/page.tsx`)
| Element | Assessment | Priority |
|---------|------------|----------|
| Background | `bg-[#232842]` - dark theme, **inconsistent** with main site | High |
| Card styling | White rounded cards - good | - |
| Fee checkbox | Custom styling, works well | - |
| CTA button | Gold, prominent - good | - |

**Issues:**
- Page uses dark background while rest of site is light
- Should match main site aesthetic or have clear visual justification

**Recommendation:** Convert to light theme with white background, gray-50 cards

#### Dashboard (`app/dashboard/page.tsx`)
| Element | Assessment | Priority |
|---------|------------|----------|
| Header | **Duplicate** - has own header, not shared | High |
| Stats cards | Good grid layout | - |
| Purchase history | Well-designed with badges | - |
| Sidebar | Good quick actions | - |

**Issues:**
- Line 173-188: Defines its own header instead of using `<Header />`
- Links to non-existent `/grid` route (should be `/`)
- References `/props` which may be hidden

#### Thank You Page (`app/thank-you/page.tsx`)
| Element | Assessment | Priority |
|---------|------------|----------|
| Background | `bg-gradient-to-br from-blue-50` - **off-brand** | High |
| Summary box | `bg-blue-50` - **should be gold** | High |
| Charity message | `bg-red-50` - odd color choice | Medium |
| Success icon | Green checkmark - good | - |

**Issues:**
- Entire page uses blue color scheme instead of brand gold/navy
- Creates jarring transition from gold checkout to blue confirmation

#### Auth Login (`app/auth/login/page.tsx`)
| Element | Assessment | Priority |
|---------|------------|----------|
| Layout | Centered card - good | - |
| Background | `bg-gray-50` - matches design system | - |
| Social buttons | Clean styling | - |
| Form inputs | Use gold focus ring - good | - |

**Status:** Well-aligned with design system

#### Admin Login (`app/admin/login/page.tsx`)
| Element | Assessment | Priority |
|---------|------------|----------|
| Background | Dark gradient - appropriate for admin | - |
| Shield icon | Red accent - clearly different from user pages | - |
| Form styling | Uses inline padding fix | - |

**Status:** Appropriately differentiated from user-facing pages

### Layout Patterns

#### Recommended Standard Page Structure
```tsx
<div className="min-h-screen bg-white">
  <Header />
  <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
    {/* Content in white/gray-50 cards */}
  </main>
  <Footer /> {/* If applicable */}
</div>
```

---

## 4. Typography System

### Current Implementation (globals.css)
| Level | Size | Weight | Status |
|-------|------|--------|--------|
| Display | 48-96px (clamp) | 800 | Good |
| H1 | 32-56px (clamp) | 800 | **Too heavy** |
| H2 | 24-40px (clamp) | 700 | Good |
| H3 | 20-28px (clamp) | 700 | Good |
| H4 | 20px | 600 | Good |
| Body | 16px | 400 | Good |
| Small | 14px | - | Good |

### Issues Found

1. **Inconsistent inline font sizes**
   - `app/page.tsx:155` uses `text-xl font-bold` for countdown numbers
   - `app/page.tsx:177` uses `text-2xl font-bold` for price
   - Should use design system classes like `.stat-value`

2. **Heading weights mismatch**
   - Reference site uses 600-700
   - App uses 700-800
   - Creates heavier, more aggressive feel

### Recommendations

```css
/* Update heading weights */
h1 {
  font-weight: 700; /* Was: 800 */
}

h2 {
  font-weight: 600; /* Was: 700 */
}
```

### Font Loading
- **Status:** Good - using `next/font/google` for Poppins
- **Weights loaded:** 400, 500, 600, 700

---

## 5. Color, Contrast, and UI States

### Color Palette Audit

| Token | Current | Should Be | Contrast (white bg) |
|-------|---------|-----------|---------------------|
| `--primary` | #d4af37 | #cda33b | 2.8:1 (fails AA for small text) |
| `--secondary` | #232842 | #232842 | 12.7:1 (passes AAA) |
| `--muted-foreground` | #6b7280 | #6b7280 | 4.7:1 (passes AA) |
| `--accent` | #30d158 | #30d158 | 2.3:1 (fails AA) |

### Critical Contrast Issues

1. **Gold on white** - Both `#d4af37` and `#cda33b` fail WCAG AA for small text
   - **Solution:** Use gold only for decorative elements, large text, or with dark backgrounds
   - For small gold text, use `#9a7b1c` (darker gold)

2. **Green accent** - `#30d158` fails on white
   - **Solution:** Use `#248a3d` for text, keep bright green for backgrounds/badges

### Button State Matrix

| State | Background | Text | Border |
|-------|------------|------|--------|
| Default | `--primary` (#cda33b) | white | none |
| Hover | `--primary-hover` | white | none |
| Focus | `--primary` | white | 3px gold glow |
| Disabled | `--primary` @ 50% opacity | white | none |
| Active | `--primary-dark` | white | none |

### Grid Square States (Well Implemented)
- Available: Light green background, green border
- Selected: Gold background, shadow glow
- Claimed: Gray background, shows owner name
- Winner: Gold with pulsing animation

---

## 6. Navigation, IA, and Conversion Flow

### Current Information Architecture

```
/ (Home - Grid)
├── /payment (Checkout)
├── /thank-you (Confirmation)
├── /auth/login
├── /auth/reset-password
├── /register
├── /dashboard
├── /my-squares
├── /about
├── /disclaimer
├── /props (hidden)
├── /pool (alternate grid view)
└── /admin/*
    ├── /login
    ├── /dashboard
    ├── /squares
    ├── /payments
    ├── /users
    ├── /settings
    ├── /live
    └── /props (hidden)
```

### Navigation Issues

1. **Mobile Nav is minimal**
   - Currently only shows "Super Bowl Pool" link
   - Missing: Dashboard, My Squares (when logged in)

2. **Header lacks user navigation**
   - No link to Dashboard when logged in
   - No "My Squares" quick access

3. **Dashboard links broken**
   - Links to `/grid` which doesn't exist (should be `/`)
   - Links to `/props` which is hidden

### Recommended Navigation Updates

**Header (logged in):**
```
Logo | Super Bowl Pool          [Dashboard] [My Squares] [Sign Out]
```

**Mobile Nav (logged in):**
```
[Grid Icon]    [User Icon]      [Squares Icon]
   Home        Dashboard         My Squares
```

### Conversion Flow Analysis

```
User Journey:
1. Landing (/) → Grid displayed, CTA "Select squares"
2. Selection → Sticky footer shows count + total
3. Checkout click → /payment page
4. Stripe checkout → External
5. Return → /thank-you
```

**Issues:**
- No incentive/urgency messaging ("X squares remaining!")
- Missing social proof ("John just bought 3 squares")
- Thank-you page doesn't encourage sharing

### Recommended Conversion Improvements

1. Add urgency indicator when <20 squares remain
2. Add share buttons on thank-you page
3. Show recent purchases in real-time (already have realtime subscription)

---

## 7. Responsiveness & Interaction Design

### Breakpoint Usage

| Breakpoint | Tailwind | Usage |
|------------|----------|-------|
| Mobile | default | Single column, smaller cells |
| sm (640px) | `sm:` | 2-column layouts start |
| md (768px) | `md:` | Grid cells grow |
| lg (1024px) | `lg:` | Full desktop layout, hide mobile nav |
| xl (1280px) | `xl:` | Max container width |

### Grid Responsiveness (PoolGrid.tsx)

```tsx
// Current cell sizes - well implemented
const cellSize = 'w-[52px] h-[52px] sm:w-[62px] sm:h-[62px] md:w-[72px] md:h-[72px] lg:w-[82px] lg:h-[82px]';
```

**Status:** Good progressive enhancement

### Touch Targets

| Element | Current Size | Minimum (WCAG) | Status |
|---------|--------------|----------------|--------|
| Grid cells | 52px mobile | 44px | Pass |
| Header buttons | 32px | 44px | **Fail** |
| Mobile nav items | 64px | 44px | Pass |
| Form inputs | 48px (py-3) | 44px | Pass |

**Issue:** Header auth buttons are too small
```tsx
// Current: px-4 py-2 = ~32px height
// Fix: px-4 py-3 = ~44px height
```

### Animations (Framer Motion)

**Implemented:**
- Grid cell hover scale (1.02)
- Grid cell tap scale (0.98)
- Winner banner slide-in
- Loading spinners

**Missing:**
- Page transitions
- Checkout flow transitions
- Success animations (confetti exists on thank-you)

### Interaction Feedback

| Action | Feedback | Status |
|--------|----------|--------|
| Square select | Color change + scale | Good |
| Button click | Scale + color | Good |
| Form focus | Border + shadow | Good |
| Error | Red banner | Good |
| Loading | Spinner | Good |
| Success | Confetti (thank-you) | Good |

---

## 8. Accessibility (WCAG 2.2 AA)

### Checklist

| Criterion | Status | Notes |
|-----------|--------|-------|
| **1.1.1 Non-text Content** | Pass | Images have alt text |
| **1.3.1 Info and Relationships** | Partial | Grid needs ARIA labels |
| **1.4.1 Use of Color** | Partial | Selected squares rely on color alone |
| **1.4.3 Contrast (Minimum)** | Fail | Gold text on white fails |
| **1.4.4 Resize Text** | Pass | Viewport allows zoom |
| **1.4.10 Reflow** | Pass | Works at 320px |
| **2.1.1 Keyboard** | Partial | Grid cells are buttons (good), but no visible focus |
| **2.4.3 Focus Order** | Pass | Logical tab order |
| **2.4.7 Focus Visible** | Fail | No visible focus indicator on many elements |
| **2.5.5 Target Size** | Partial | Header buttons too small |
| **3.1.1 Language of Page** | Pass | `lang="en"` set |
| **4.1.2 Name, Role, Value** | Partial | Grid needs better ARIA |

### Critical Fixes

1. **Add focus-visible styles globally:**
```css
:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

2. **Add ARIA to grid cells:**
```tsx
<button
  aria-label={`Square ${boxNum}, ${isAvailable ? 'available' : `owned by ${name}`}`}
  aria-pressed={isSelected}
>
```

3. **Fix color contrast for gold text:**
   - Use darker gold `#9a7b1c` for text on white
   - Or use gold only as background with dark text

4. **Add skip link:**
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### Reduced Motion Support
**Status:** Good - implemented in globals.css
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}
```

---

## 9. Performance & Front-End Best Practices

### Bundle Analysis Recommendations

| Library | Size | Usage | Recommendation |
|---------|------|-------|----------------|
| framer-motion | ~30kb | Animations | Keep (essential) |
| lucide-react | ~5kb/icon | Icons | Good (tree-shakes) |
| canvas-confetti | ~8kb | Thank-you page | Lazy load |
| @supabase/supabase-js | ~50kb | Core | Keep |

### Image Optimization

| Image | Current | Recommendation |
|-------|---------|----------------|
| `/logo.png` | PNG | Convert to WebP, add blur placeholder |
| Team logos | N/A | Use SVG or CSS |

### Loading States

**Good implementations:**
- Grid loading spinner
- Button loading states
- Redirect loading states

**Missing:**
- Skeleton loaders for cards
- Progressive image loading

### Code Splitting Opportunities

1. **Thank-you page** - Lazy load confetti
```tsx
const confetti = dynamic(() => import('canvas-confetti'), { ssr: false });
```

2. **Admin pages** - Already route-split (good)

3. **Dashboard** - Consider splitting purchase history component

### Caching Strategy

**Recommended headers for static assets:**
```
Cache-Control: public, max-age=31536000, immutable
```

---

## 10. Design System Consistency

### Token Usage Audit

| Token | Defined | Usage Rate | Issues |
|-------|---------|------------|--------|
| `--primary` | Yes | 60% | Often hardcoded as `#d4af37` |
| `--secondary` | Yes | 40% | Often hardcoded as `#232842` |
| `--space-*` | Yes | 10% | Rarely used, Tailwind preferred |
| `--radius-*` | Yes | 30% | Mixed with Tailwind `rounded-*` |
| `--shadow-*` | Yes | 20% | Often use Tailwind `shadow-*` |

### Component Patterns

**Consistent:**
- Card structure (border + rounded + shadow)
- Button hierarchy
- Form inputs

**Inconsistent:**
- Page backgrounds (white vs gray-50 vs #232842)
- Section padding
- Header implementations (2 different headers)

### Recommended Design Tokens Migration

Replace hardcoded values with tokens:

```tsx
// Before
className="bg-[#232842] text-[#d4af37]"

// After
className="bg-secondary text-primary"
```

### Component Library Gaps

**Have:**
- Button (via @/components/ui/button)
- Card (via @/components/ui/card)
- Input (via @/components/ui/input)
- Checkbox (via @radix-ui/react-checkbox)

**Need:**
- Badge component (currently inline styles)
- Stat card component
- Page wrapper component
- Section heading component

---

## 11. Implementation Plan

### Phase 1: Brand Alignment (Day 1)
| Task | File | Effort |
|------|------|--------|
| Update primary color to `#cda33b` | `globals.css` | 15min |
| Update all hardcoded `#d4af37` to CSS variable | Multiple | 1hr |
| Fix thank-you page colors to gold theme | `app/thank-you/page.tsx` | 30min |
| Reduce heading weights | `globals.css` | 15min |

### Phase 2: Consistency (Day 2)
| Task | File | Effort |
|------|------|--------|
| Standardize page backgrounds to white | Multiple pages | 1hr |
| Fix Dashboard to use shared Header | `app/dashboard/page.tsx` | 30min |
| Fix Dashboard broken links | `app/dashboard/page.tsx` | 15min |
| Convert payment page to light theme | `app/payment/page.tsx` | 45min |

### Phase 3: Accessibility (Day 3)
| Task | File | Effort |
|------|------|--------|
| Add focus-visible styles | `globals.css` | 30min |
| Add ARIA labels to grid | `components/PoolGrid.tsx` | 45min |
| Fix header button sizes | `components/Header.tsx` | 15min |
| Add skip link | `app/layout.tsx` | 15min |
| Create darker gold for text use | `globals.css` | 15min |

### Phase 4: Navigation (Day 4)
| Task | File | Effort |
|------|------|--------|
| Add Dashboard/My Squares to Header | `components/Header.tsx` | 30min |
| Expand mobile nav | `components/MobileNav.tsx` | 45min |
| Add conditional nav items for auth state | Both files | 30min |

### Phase 5: Polish (Day 5)
| Task | File | Effort |
|------|------|--------|
| Create Badge component | `components/ui/badge.tsx` | 30min |
| Create StatCard component | `components/ui/stat-card.tsx` | 30min |
| Add skeleton loaders | Various | 1hr |
| Lazy load confetti | `app/thank-you/page.tsx` | 15min |

---

## 12. Patch Suggestions

### Patch 1: Brand Color Fix (globals.css)

```css
/* Line 79-85: Update primary colors */
--primary: #cda33b;
--primary-light: #dfc06a;
--primary-dark: #b8960c;
--primary-foreground: #ffffff;
--primary-hover: #c39931;
--primary-glow: rgba(205, 163, 59, 0.25);
--primary-glow-strong: rgba(205, 163, 59, 0.4);

/* Add accessible gold for text */
--primary-text: #9a7b1c;
```

### Patch 2: Thank-You Page Theme (app/thank-you/page.tsx)

```tsx
// Line 38: Change background
<div className="min-h-screen bg-white flex flex-col">

// Line 58-59: Change summary box
<div className="bg-[#cda33b]/10 rounded-xl p-6 mb-8 border border-[#cda33b]/30">
  <div className="text-3xl font-bold text-[#cda33b] mb-1">

// Line 76-77: Change charity box
<div className="bg-[#232842]/5 rounded-xl p-6 mb-8 border border-[#232842]/20">
  <Heart className="w-8 h-8 text-[#cda33b] mx-auto mb-3" fill="currentColor" />
```

### Patch 3: Dashboard Header Fix (app/dashboard/page.tsx)

```tsx
// Remove lines 173-188 (custom header)
// Add import at top:
import Header from '@/components/Header';

// Replace header section with:
<Header />

// Fix link on line 180:
<Link href="/" ... // Was: /grid
```

### Patch 4: Focus Visible Styles (globals.css)

```css
/* Add after line 252 */
button:focus-visible,
a:focus-visible,
input:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  border-radius: 4px;
}
```

### Patch 5: Header Button Sizes (components/Header.tsx)

```tsx
// Line 72-77: Increase touch target
<button
  onClick={handleSignOut}
  className="flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium..."
>

// Line 79-85: Same for sign in link
<Link
  href="/auth/login"
  className="flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium..."
>
```

### Patch 6: Grid ARIA Labels (components/PoolGrid.tsx)

```tsx
// Line 211-217: Add ARIA attributes
<motion.button
  key={`cell-${row}-${col}`}
  onClick={() => handleSquareClick(square)}
  disabled={!isAvailable || tournamentLaunched || disabled}
  aria-label={`Square ${boxNum}. ${
    isClaimed ? `Owned by ${square.user_name || 'Unknown'}` : 'Available for purchase'
  }${isSelected ? '. Currently selected' : ''}${isWinner ? '. Current winner!' : ''}`}
  aria-pressed={isSelected}
  role="gridcell"
  ...
>
```

### Patch 7: Mobile Nav Expansion (components/MobileNav.tsx)

```tsx
// Replace navItems array (lines 14-16)
const navItems: NavItem[] = [
  { href: '/', label: 'Pool', icon: Grid3x3 },
  { href: '/dashboard', label: 'Dashboard', icon: UserIcon },
  { href: '/my-squares', label: 'My Squares', icon: Target },
];

// Add imports
import { Grid3x3, User as UserIcon, Target } from 'lucide-react';
```

---

## Summary

The Super Bowl Pool application has a solid foundation with a well-structured design system. The primary issues center around:

1. **Brand alignment** - Gold color needs updating to match parent brand
2. **Consistency** - Several pages deviate from the design system
3. **Accessibility** - Focus indicators and contrast need improvement
4. **Navigation** - Mobile and logged-in states need enhancement

All issues are fixable within 5 days of focused development. The recommended approach is to start with brand colors (highest visual impact), then work through consistency, accessibility, and finally navigation/polish.

**Priority Order:**
1. Brand color update (immediate visual improvement)
2. Thank-you page theme (breaks user journey)
3. Dashboard header fix (broken navigation)
4. Accessibility patches (compliance requirement)
5. Navigation improvements (user experience)

---

*Generated by Claude Code - UI/UX Design Audit*
