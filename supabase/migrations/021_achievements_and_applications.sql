-- Cycle 5: Achievements & 5/24 Tracker Tables
-- Created: 2026-02-14

-- ============================================================================
-- F15: Achievements & Gamification
-- ============================================================================

-- User achievements table (tracks unlocked achievements)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own achievements"
  ON user_achievements
  FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked_at ON user_achievements(unlocked_at);

-- ============================================================================
-- F16: Credit Card 5/24 Tracker
-- ============================================================================

-- Card applications table
CREATE TABLE IF NOT EXISTS card_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  card_id TEXT NOT NULL,
  card_name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  application_date DATE NOT NULL,
  approval_date DATE,
  status TEXT DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'denied')),
  fall_off_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE card_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own applications"
  ON card_applications
  FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_card_applications_user_id ON card_applications(user_id);
CREATE INDEX idx_card_applications_application_date ON card_applications(application_date);
CREATE INDEX idx_card_applications_fall_off_date ON card_applications(fall_off_date);
CREATE INDEX idx_card_applications_issuer ON card_applications(issuer);
CREATE INDEX idx_card_applications_status ON card_applications(status);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update updated_at timestamp on card_applications
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_card_applications_updated_at
  BEFORE UPDATE ON card_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
