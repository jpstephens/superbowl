# UX Redesign: Systems-Driven Approach
## By Jonathan H. Rycroft (Principal Product Designer)

## Core Mental Model Analysis

### User Goals (Hierarchy)
1. **Primary**: Claim squares before they're gone (urgency)
2. **Secondary**: Understand what I'm buying (value clarity)
3. **Tertiary**: See who else is playing (social proof)

### Information Architecture Problems
- **Cognitive overload**: 100 squares presented simultaneously
- **No progressive disclosure**: All information at once
- **Weak hierarchy**: Grid, score, winners compete for attention
- **Hidden value**: Cost/value relationship unclear until checkout

### Interaction Model Issues
- **Selection state unclear**: What's selected vs. available vs. claimed?
- **Commitment friction**: Must select before seeing total
- **No preview**: Can't see "what if I select these 5 squares?"
- **Mobile failure**: Grid becomes unusable

---

## Redesign: Systems-Driven Architecture

### Principle 1: Progressive Disclosure
**Don't show everything at once. Reveal information as needed.**

### Principle 2: Clear State Model
**Every square has explicit states: Available → Selected → Claimed → Paid**

### Principle 3: Value-First Design
**Show cost/value relationship immediately, not at checkout**

### Principle 4: Mobile-First Grid
**Grid must work on phone. Desktop gets enhancement, not requirement.**

---

## New Layout Architecture

### Layout Structure (Desktop)
```
┌─────────────────────────────────────────────────────────┐
│ HEADER (minimal, persistent)                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────┐  ┌──────────────┐       │
│  │                          │  │ VALUE PANEL  │       │
│  │   GRID (60% width)       │  │ (20% width)  │       │
│  │   - Progressive load     │  │ - Total cost │       │
│  │   - Filter controls      │  │ - Selection  │       │
│  │   - Quick select tools   │  │ - Checkout   │       │
│  │                          │  │              │       │
│  └──────────────────────────┘  └──────────────┘       │
│                                                         │
│  ┌──────────────────────────────────────────┐       │
│  │ CONTEXT PANEL (full width, collapsible)    │       │
│  │ - Game score                               │       │
│  │ - Quarter winners                          │       │
│  │ - Leaderboard                              │       │
│  └──────────────────────────────────────────┘       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Mobile Layout
```
┌─────────────────────┐
│ HEADER              │
├─────────────────────┤
│ VALUE BAR (sticky)  │ ← Always visible
│ 5 squares • $250    │
│ [Checkout]          │
├─────────────────────┤
│ FILTER BAR          │
│ [All] [Available]  │
├─────────────────────┤
│ GRID (scrollable)   │
│ ← swipe horizontal →│
├─────────────────────┤
│ CONTEXT (tabs)      │
│ [Score] [Winners]   │
└─────────────────────┘
```

---

## Component System Design

### 1. Value Panel (Always Visible)
**Purpose**: Show commitment, enable checkout, reduce abandonment

**States**:
- Empty: "Select squares to begin"
- Has selection: "5 squares selected • $250 [Checkout]"
- Processing: "Processing..."

**Behavior**:
- Sticky on mobile (bottom bar)
- Fixed right panel on desktop
- Updates in real-time as squares selected

### 2. Grid with Progressive Disclosure
**Purpose**: Reduce cognitive load, enable scanning

**Features**:
- **Filter controls**: [All] [Available] [My Squares]
- **Quick select**: "Select 5 random available"
- **Density toggle**: Compact / Comfortable / Spacious
- **Search**: Find by coordinates (e.g., "A3")

**Visual Hierarchy**:
- Available: High contrast green (actionable)
- Selected: Blue with checkmark (committed)
- Claimed: Muted gray (informational)
- Winner: Red with pulse (celebratory)

### 3. Context Panel (Collapsible)
**Purpose**: Secondary information, doesn't compete with primary action

**Sections**:
- Game status (score, quarter, time)
- Quarter winners
- Leaderboard
- Recent activity

**Behavior**:
- Collapsed by default on mobile
- Expandable accordion
- Can be dismissed

---

## Interaction Model

### Selection Flow
1. **Hover**: Preview square details (coordinates, cost)
2. **Click**: Toggle selection (visual feedback: scale + checkmark)
3. **Multi-select**: Shift+click for range, Cmd+click for multiple
4. **Quick actions**: "Select 5 random" button

### State Transitions
```
Available → [click] → Selected → [checkout] → Claimed → [payment] → Paid
```

### Error States
- **Square taken**: "This square was just claimed. Here are similar options..."
- **Payment failed**: "Payment didn't go through. Try again?"
- **Network error**: "Connection lost. Your selections are saved."

---

## Conversion Optimization

### Friction Reduction
1. **Guest checkout**: Allow selection before login (login at checkout)
2. **Save progress**: LocalStorage saves selections
3. **One-click checkout**: Apple Pay / Google Pay
4. **Value clarity**: Show "$50/square" prominently

### Urgency Mechanics
1. **Live counter**: "13 squares left" (updates in real-time)
2. **Recent activity**: "Sarah just claimed 3 squares"
3. **Visual scarcity**: Green available squares stand out

---

## Technical Implementation Notes

### State Management
- **Client state**: Selected squares (localStorage backup)
- **Server state**: Available/claimed squares (real-time updates)
- **Optimistic UI**: Show selection immediately, confirm with server

### Performance
- **Virtual scrolling**: Only render visible squares
- **Lazy load**: Load context panel on demand
- **Debounce**: Batch selection updates

### Accessibility
- **Keyboard navigation**: Arrow keys move selection
- **Screen reader**: "Square A3, available, $50"
- **Focus management**: Clear focus indicators

---

## Design Tokens

### Colors
- **Available**: `#10B981` (emerald-500) - Action green
- **Selected**: `#3B82F6` (blue-500) - Commitment blue  
- **Claimed**: `#9CA3AF` (gray-400) - Muted gray
- **Winner**: `#EF4444` (red-500) - Celebration red

### Typography
- **Grid labels**: `text-xs font-mono` (coordinates)
- **Value display**: `text-2xl font-bold` (cost)
- **Body**: `text-sm` (readable)

### Spacing
- **Grid gap**: `4px` (tight, scannable)
- **Panel padding**: `16px` (comfortable)
- **Touch targets**: `44px minimum` (mobile)

---

## Success Metrics

### Conversion
- Time to first selection: < 10 seconds
- Selection to checkout: < 2 minutes
- Checkout completion: > 80%

### Usability
- Mobile grid interaction: < 3 taps to select
- Error recovery: < 1 tap to fix mistake
- Context discovery: < 5 seconds to find score

---

## Implementation Priority

### Phase 1: Core System
1. Value panel (always visible)
2. Grid with proper states
3. Mobile-first responsive

### Phase 2: Progressive Enhancement
1. Filters and search
2. Quick select tools
3. Context panel

### Phase 3: Polish
1. Animations and transitions
2. Real-time updates
3. Advanced features



