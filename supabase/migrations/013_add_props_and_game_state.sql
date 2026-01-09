-- ============================================================================
-- Migration: Add Props and Game State Tables
-- This adds the tables needed for prop bets and live game tracking
-- ============================================================================

-- Prop Categories
CREATE TABLE IF NOT EXISTS prop_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'Sparkles',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prop Bets
CREATE TABLE IF NOT EXISTS prop_bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES prop_categories(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    description TEXT,
    answer_type TEXT NOT NULL CHECK (answer_type IN ('over_under', 'multiple_choice', 'yes_no', 'exact_number')),
    over_under_line NUMERIC(10, 2),
    over_under_unit TEXT,
    options JSONB, -- Array of options for multiple_choice
    point_value INTEGER DEFAULT 1,
    is_tiebreaker BOOLEAN DEFAULT false,
    deadline TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'locked', 'graded')),
    correct_answer TEXT,
    result_value NUMERIC(10, 2),
    result_notes TEXT,
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prop Answers (user submissions)
CREATE TABLE IF NOT EXISTS prop_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    prop_id UUID NOT NULL REFERENCES prop_bets(id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    confidence_points INTEGER,
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, prop_id)
);

-- Game State (single row, updated during game)
CREATE TABLE IF NOT EXISTS game_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    afc_team TEXT NOT NULL DEFAULT 'Kansas City Chiefs',
    nfc_team TEXT NOT NULL DEFAULT 'Philadelphia Eagles',
    afc_score INTEGER DEFAULT 0,
    nfc_score INTEGER DEFAULT 0,
    quarter INTEGER DEFAULT 0 CHECK (quarter >= 0 AND quarter <= 5), -- 0=pre, 1-4=quarters, 5=OT
    time_remaining TEXT DEFAULT '15:00',
    possession TEXT CHECK (possession IN ('afc', 'nfc') OR possession IS NULL),
    down INTEGER CHECK (down IS NULL OR (down >= 1 AND down <= 4)),
    yards_to_go INTEGER,
    yard_line INTEGER,
    is_live BOOLEAN DEFAULT false,
    is_halftime BOOLEAN DEFAULT false,
    is_final BOOLEAN DEFAULT false,
    last_play TEXT,
    game_date DATE DEFAULT '2025-02-09',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Score History (for tracking score changes)
CREATE TABLE IF NOT EXISTS score_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    afc_score INTEGER NOT NULL,
    nfc_score INTEGER NOT NULL,
    quarter INTEGER NOT NULL,
    time_remaining TEXT,
    play_description TEXT,
    scoring_type TEXT CHECK (scoring_type IN ('touchdown', 'field_goal', 'safety', 'two_point', 'extra_point', 'manual')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reactions
CREATE TABLE IF NOT EXISTS reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL CHECK (emoji IN ('🏈', '🎉', '🔥', '😱', '💰', '😭', '👏', '🍀')),
    event_type TEXT CHECK (event_type IN ('score_change', 'quarter_end', 'winner', 'prop_result', 'general')),
    event_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_prop_bets_category ON prop_bets(category_id);
CREATE INDEX IF NOT EXISTS idx_prop_bets_status ON prop_bets(status);
CREATE INDEX IF NOT EXISTS idx_prop_answers_user ON prop_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_prop_answers_prop ON prop_answers(prop_id);
CREATE INDEX IF NOT EXISTS idx_score_history_created ON score_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_created ON reactions(created_at DESC);

-- Create triggers for updated_at
CREATE TRIGGER update_prop_categories_updated_at BEFORE UPDATE ON prop_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prop_bets_updated_at BEFORE UPDATE ON prop_bets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prop_answers_updated_at BEFORE UPDATE ON prop_answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_state_updated_at BEFORE UPDATE ON game_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default game state
INSERT INTO game_state (afc_team, nfc_team, game_date)
VALUES ('Kansas City Chiefs', 'Philadelphia Eagles', '2025-02-09')
ON CONFLICT DO NOTHING;

-- Insert default prop categories
INSERT INTO prop_categories (name, description, icon, display_order) VALUES
('Pre-Game', 'Props that lock before the game starts', 'Flag', 1),
('Halftime', 'Halftime show related props', 'Music', 2),
('Commercials', 'Commercial and ad-related props', 'Tv', 3),
('Game Stats', 'In-game statistics props', 'TrendingUp', 4),
('Scoring', 'Score-related props', 'Target', 5),
('Fun Props', 'Fun and miscellaneous props', 'Sparkles', 6)
ON CONFLICT DO NOTHING;

-- Insert sample prop bets
INSERT INTO prop_bets (category_id, question, description, answer_type, over_under_line, over_under_unit, options, point_value, display_order, status)
SELECT 
    c.id, q.question, q.description, q.answer_type, q.line, q.unit, q.options::jsonb, q.points, q.ord, 'open'
FROM prop_categories c
CROSS JOIN (VALUES
    ('Pre-Game', 'National anthem length', 'How long will the national anthem be?', 'over_under', 2.05, 'minutes', NULL, 1, 1),
    ('Pre-Game', 'Coin toss result', 'What will the coin toss result be?', 'multiple_choice', NULL, NULL, '["Heads", "Tails"]', 1, 2),
    ('Pre-Game', 'Which team wins coin toss?', 'Which team will win the opening coin toss?', 'multiple_choice', NULL, NULL, '["Chiefs", "Eagles"]', 1, 3),
    ('Halftime', 'Guest performer appears', 'Will there be a surprise guest performer?', 'yes_no', NULL, NULL, NULL, 2, 1),
    ('Halftime', 'Songs performed', 'How many songs will be performed?', 'over_under', 6.5, 'songs', NULL, 1, 2),
    ('Halftime', 'Wardrobe malfunction', 'Will there be any wardrobe malfunction?', 'yes_no', NULL, NULL, NULL, 3, 3),
    ('Commercials', 'First commercial brand', 'Which brand will have the first commercial?', 'multiple_choice', NULL, NULL, '["Bud Light", "Doritos", "Toyota", "Pepsi", "Other"]', 2, 1),
    ('Commercials', 'Crypto commercial', 'Will there be a cryptocurrency commercial?', 'yes_no', NULL, NULL, NULL, 1, 2),
    ('Commercials', 'Car commercials', 'How many car commercials will air?', 'over_under', 8.5, 'commercials', NULL, 1, 3),
    ('Game Stats', 'Total points scored', 'What will be the total points scored in the game?', 'over_under', 49.5, 'points', NULL, 1, 1),
    ('Game Stats', 'First scoring play', 'What will the first scoring play be?', 'multiple_choice', NULL, NULL, '["Touchdown", "Field Goal", "Safety"]', 2, 2),
    ('Game Stats', 'Total passing yards', 'Combined passing yards for both QBs', 'over_under', 525.5, 'yards', NULL, 1, 3),
    ('Game Stats', 'Game goes to overtime', 'Will the game go to overtime?', 'yes_no', NULL, NULL, NULL, 3, 4)
) AS q(cat_name, question, description, answer_type, line, unit, options, points, ord)
WHERE c.name = q.cat_name
ON CONFLICT DO NOTHING;

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;
ALTER PUBLICATION supabase_realtime ADD TABLE prop_bets;
ALTER PUBLICATION supabase_realtime ADD TABLE prop_answers;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE reactions;

