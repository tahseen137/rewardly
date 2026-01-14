-- ============================================================================
-- Rewards Optimizer Database Schema
-- Canadian Credit Card Database
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Spending Categories Table
-- Reference table for all spending categories
-- ============================================================================

CREATE TABLE IF NOT EXISTS spending_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_key VARCHAR(50) UNIQUE NOT NULL,    -- "groceries", "dining", etc.
  name VARCHAR(100) NOT NULL,                  -- "Groceries"
  name_fr VARCHAR(100),                        -- "Épicerie"
  description VARCHAR(500),
  icon VARCHAR(50),                            -- Icon name for UI
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Insert default spending categories
INSERT INTO spending_categories (category_key, name, name_fr, icon, display_order) VALUES
  ('groceries', 'Groceries', 'Épicerie', 'cart', 1),
  ('dining', 'Dining', 'Restaurants', 'utensils', 2),
  ('gas', 'Gas', 'Essence', 'fuel', 3),
  ('travel', 'Travel', 'Voyage', 'plane', 4),
  ('online_shopping', 'Online Shopping', 'Achats en ligne', 'globe', 5),
  ('entertainment', 'Entertainment', 'Divertissement', 'film', 6),
  ('drugstores', 'Drugstores', 'Pharmacies', 'pill', 7),
  ('home_improvement', 'Home Improvement', 'Rénovation', 'home', 8),
  ('other', 'Other', 'Autre', 'ellipsis', 99)
ON CONFLICT (category_key) DO NOTHING;

-- ============================================================================
-- Cards Table
-- Main table for credit card information
-- ============================================================================

CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_key VARCHAR(100) UNIQUE NOT NULL,       -- e.g., "td-aeroplan-visa-infinite"
  name VARCHAR(200) NOT NULL,                  -- "TD Aeroplan Visa Infinite"
  name_fr VARCHAR(200),                        -- French name if different
  issuer VARCHAR(100) NOT NULL,                -- "TD", "RBC", etc.
  reward_program VARCHAR(100) NOT NULL,        -- "Aeroplan", "Scene+", etc.
  reward_currency VARCHAR(50) NOT NULL,        -- "airline_miles", "points", "cashback"
  point_valuation DECIMAL(6,3) NOT NULL,       -- Value per point in CAD cents
  annual_fee DECIMAL(8,2) NOT NULL,            -- Annual fee in CAD
  base_reward_rate DECIMAL(6,3) NOT NULL,      -- Base multiplier (e.g., 1.0)
  base_reward_unit VARCHAR(20) DEFAULT 'percent', -- "percent" or "multiplier"
  image_url VARCHAR(500),                      -- Card image URL
  apply_url VARCHAR(500),                      -- Application link
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_cards_issuer ON cards(issuer);
CREATE INDEX IF NOT EXISTS idx_cards_reward_program ON cards(reward_program);
CREATE INDEX IF NOT EXISTS idx_cards_active ON cards(is_active);
CREATE INDEX IF NOT EXISTS idx_cards_card_key ON cards(card_key);

-- ============================================================================
-- Category Rewards Table
-- Bonus reward rates for specific spending categories
-- ============================================================================

CREATE TABLE IF NOT EXISTS category_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,               -- "groceries", "dining", "gas", etc.
  multiplier DECIMAL(6,3) NOT NULL,            -- e.g., 5.0 for 5x or 5%
  reward_unit VARCHAR(20) DEFAULT 'percent',   -- "percent" or "multiplier"
  description VARCHAR(500) NOT NULL,           -- "5x at grocery stores"
  description_fr VARCHAR(500),                 -- French description
  has_spend_limit BOOLEAN DEFAULT false,
  spend_limit DECIMAL(10,2),                   -- Annual limit in CAD
  spend_limit_period VARCHAR(20),              -- "annual", "quarterly", "monthly"
  valid_from DATE,
  valid_until DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique category per card
  CONSTRAINT unique_card_category UNIQUE (card_id, category)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_category_rewards_card ON category_rewards(card_id);
CREATE INDEX IF NOT EXISTS idx_category_rewards_category ON category_rewards(category);

-- ============================================================================
-- Signup Bonuses Table
-- Welcome offers for new cardholders
-- ============================================================================

CREATE TABLE IF NOT EXISTS signup_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  bonus_amount INTEGER NOT NULL,               -- Points/miles amount
  bonus_currency VARCHAR(50) NOT NULL,         -- "points", "airline_miles", etc.
  spend_requirement DECIMAL(10,2) NOT NULL,    -- Required spend in CAD
  timeframe_days INTEGER NOT NULL,             -- Days to complete spend
  valid_from DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_signup_bonuses_card ON signup_bonuses(card_id);
CREATE INDEX IF NOT EXISTS idx_signup_bonuses_active ON signup_bonuses(is_active);

-- ============================================================================
-- Updated At Trigger
-- Automatically update the updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to cards table
DROP TRIGGER IF EXISTS update_cards_updated_at ON cards;
CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to category_rewards table
DROP TRIGGER IF EXISTS update_category_rewards_updated_at ON category_rewards;
CREATE TRIGGER update_category_rewards_updated_at
  BEFORE UPDATE ON category_rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to signup_bonuses table
DROP TRIGGER IF EXISTS update_signup_bonuses_updated_at ON signup_bonuses;
CREATE TRIGGER update_signup_bonuses_updated_at
  BEFORE UPDATE ON signup_bonuses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Row Level Security (RLS)
-- Enable read-only access for anonymous users
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE signup_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_categories ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access to all tables (card data is public)
CREATE POLICY "Allow anonymous read access to cards"
  ON cards FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Allow anonymous read access to category_rewards"
  ON category_rewards FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous read access to signup_bonuses"
  ON signup_bonuses FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Allow anonymous read access to spending_categories"
  ON spending_categories FOR SELECT
  TO anon
  USING (is_active = true);

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- View: Cards with all related data
CREATE OR REPLACE VIEW cards_with_rewards AS
SELECT 
  c.*,
  COALESCE(
    json_agg(
      json_build_object(
        'category', cr.category,
        'multiplier', cr.multiplier,
        'reward_unit', cr.reward_unit,
        'description', cr.description,
        'description_fr', cr.description_fr,
        'has_spend_limit', cr.has_spend_limit,
        'spend_limit', cr.spend_limit
      )
    ) FILTER (WHERE cr.id IS NOT NULL),
    '[]'
  ) as category_rewards,
  (
    SELECT json_build_object(
      'bonus_amount', sb.bonus_amount,
      'bonus_currency', sb.bonus_currency,
      'spend_requirement', sb.spend_requirement,
      'timeframe_days', sb.timeframe_days,
      'valid_until', sb.valid_until
    )
    FROM signup_bonuses sb
    WHERE sb.card_id = c.id AND sb.is_active = true
    LIMIT 1
  ) as signup_bonus
FROM cards c
LEFT JOIN category_rewards cr ON c.id = cr.card_id
WHERE c.is_active = true
GROUP BY c.id;

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE cards IS 'Canadian credit cards with reward information';
COMMENT ON TABLE category_rewards IS 'Bonus reward rates for specific spending categories';
COMMENT ON TABLE signup_bonuses IS 'Welcome offers for new cardholders';
COMMENT ON TABLE spending_categories IS 'Reference table for spending categories';

COMMENT ON COLUMN cards.card_key IS 'Unique identifier in kebab-case format';
COMMENT ON COLUMN cards.reward_currency IS 'Type of reward: cashback, points, airline_miles, hotel_points';
COMMENT ON COLUMN cards.point_valuation IS 'Value per point in CAD cents';
COMMENT ON COLUMN cards.base_reward_rate IS 'Base reward rate for all purchases';

COMMENT ON COLUMN category_rewards.multiplier IS 'Reward multiplier for this category (e.g., 5.0 for 5x)';
COMMENT ON COLUMN category_rewards.spend_limit IS 'Maximum annual spend that earns bonus rate';

COMMENT ON COLUMN signup_bonuses.timeframe_days IS 'Number of days to meet spend requirement';
