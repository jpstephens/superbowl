/**
 * Supabase Database Types
 * Auto-generated types for the Super Bowl Pool database schema
 */

// ============================================================================
// Core Types
// ============================================================================

export type GridSquare = {
  id: string;
  row_number: number;
  col_number: number;
  row_score: number | null;
  col_score: number | null;
  status: 'available' | 'claimed' | 'paid' | 'confirmed';
  user_id: string | null;
  user_name?: string | null;
  claimed_at: string | null;
  paid_at: string | null;
  payment_method: 'venmo' | 'stripe' | null;
  payment_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    name: string;
    photo_url: string | null;
  } | null;
};

export type NotificationPreferences = {
  score_changes: boolean;
  quarter_wins: boolean;
  prop_results: boolean;
  chat_mentions: boolean;
  sound_enabled: boolean;
};

export type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  photo_url: string | null;
  total_squares: number;
  is_admin: boolean;
  notification_preferences: NotificationPreferences;
  created_at: string;
};

export type Payment = {
  id: string;
  user_id: string;
  amount: number;
  method: 'venmo' | 'stripe';
  status: 'pending' | 'completed' | 'confirmed';
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
};

export type PurchaseActivity = {
  id: string;
  user_id: string | null;
  user_name: string;
  square_count: number;
  created_at: string;
};

export type QuarterWinner = {
  id: string;
  quarter: 1 | 2 | 3 | 4;
  user_id: string | null;
  row_score: number;
  col_score: number;
  prize_amount: number | null;
  announced_at: string;
  profiles?: {
    name: string;
    photo_url: string | null;
  } | null;
};

export type Setting = {
  key: string;
  value: string;
  updated_at: string;
};

export type AdminUser = {
  id: string;
  email: string;
  role: 'admin' | 'super_admin';
  created_at: string;
};

// ============================================================================
// Prop Bets Types
// ============================================================================

export type PropAnswerType = 'over_under' | 'multiple_choice' | 'yes_no' | 'exact_number';
export type PropStatus = 'draft' | 'open' | 'locked' | 'graded';

export type PropCategory = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PropBet = {
  id: string;
  category_id: string | null;
  question: string;
  description: string | null;
  answer_type: PropAnswerType;
  over_under_line: number | null;
  over_under_unit: string | null;
  options: string[] | null; // JSON array of options for multiple_choice
  point_value: number;
  is_tiebreaker: boolean;
  deadline: string;
  status: PropStatus;
  correct_answer: string | null;
  result_value: number | null;
  result_notes: string | null;
  graded_at: string | null;
  graded_by: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: PropCategory | null;
};

export type PropAnswer = {
  id: string;
  user_id: string;
  prop_id: string;
  answer: string;
  confidence_points: number | null;
  is_correct: boolean | null;
  points_earned: number;
  submitted_at: string;
  updated_at: string;
  // Joined fields
  prop?: PropBet | null;
  profile?: Profile | null;
};

export type PropLeaderboardEntry = {
  user_id: string;
  user_name: string;
  photo_url: string | null;
  total_answers: number;
  correct_answers: number;
  incorrect_answers: number;
  pending_answers: number;
  total_points: number;
  total_confidence_used: number;
  accuracy_percentage: number;
};

// ============================================================================
// Game State Types
// ============================================================================

export type GameState = {
  id: string;
  afc_team: string;
  nfc_team: string;
  afc_score: number;
  nfc_score: number;
  quarter: number; // 0 = pre-game, 1-4 = quarters, 5 = OT
  time_remaining: string;
  possession: 'afc' | 'nfc' | null;
  down: number | null;
  yards_to_go: number | null;
  yard_line: number | null;
  is_live: boolean;
  is_halftime: boolean;
  is_final: boolean;
  last_play: string | null;
  game_date: string;
  updated_at: string;
  updated_by: string | null;
};

export type ScoringType = 'touchdown' | 'field_goal' | 'safety' | 'two_point' | 'extra_point' | 'manual';

export type ScoreHistory = {
  id: string;
  afc_score: number;
  nfc_score: number;
  quarter: number;
  time_remaining: string | null;
  play_description: string | null;
  scoring_type: ScoringType | null;
  created_at: string;
};

// ============================================================================
// Social Features Types
// ============================================================================

export type ChatMessage = {
  id: string;
  user_id: string;
  message: string;
  is_pinned: boolean;
  is_deleted: boolean;
  created_at: string;
  // Joined fields
  profile?: {
    name: string;
    photo_url: string | null;
  } | null;
};

export type ReactionEmoji = '🏈' | '🎉' | '🔥' | '😱' | '💰' | '😭' | '👏' | '🍀';
export type ReactionEventType = 'score_change' | 'quarter_end' | 'winner' | 'prop_result' | 'general';

export type Reaction = {
  id: string;
  user_id: string;
  emoji: ReactionEmoji;
  event_type: ReactionEventType | null;
  event_id: string | null;
  created_at: string;
};

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Helper type for Supabase query results with joins
 */
export type WithProfile<T> = T & {
  profiles: {
    name: string;
    photo_url: string | null;
  } | null;
};

/**
 * Settings keys used in the application
 */
export type SettingsKey =
  | 'square_price'
  | 'prize_q1'
  | 'prize_q2'
  | 'prize_q3'
  | 'prize_q4'
  | 'payout_percent_q1'
  | 'payout_percent_q2'
  | 'payout_percent_q3'
  | 'payout_percent_q4'
  | 'charity_percentage'
  | 'venmo_username'
  | 'venmo_memo'
  | 'stripe_enabled'
  | 'venmo_enabled'
  | 'tournament_launched'
  | 'game_afc_team'
  | 'game_nfc_team'
  | 'game_date'
  | 'auto_score_enabled'
  | 'props_enabled'
  | 'props_scoring_mode'
  | 'props_show_leaderboard'
  | 'chat_enabled'
  | 'reactions_enabled'
  | 'chat_rate_limit_seconds'
  | 'logo_url';

/**
 * Props scoring modes
 */
export type PropsScoringMode = 'simple' | 'confidence' | 'weighted';
