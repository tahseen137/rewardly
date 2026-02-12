-- ============================================================================
-- US Credit Cards Migration
-- Adds country support and US credit card data
-- ============================================================================

-- Add country column to cards table
ALTER TABLE cards ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'CA';

-- Create index for country queries
CREATE INDEX IF NOT EXISTS idx_cards_country ON cards(country);

-- Update existing Canadian cards to explicitly have country = 'CA'
UPDATE cards SET country = 'CA' WHERE country IS NULL OR country = '';

-- ============================================================================
-- US Credit Card Programs (Reward Programs)
-- ============================================================================

-- Insert US reward programs first (for reference)
INSERT INTO spending_categories (category_key, name, name_fr, icon, display_order) VALUES
  ('transit', 'Transit', 'Transport en commun', 'train', 9),
  ('streaming', 'Streaming', 'Diffusion en continu', 'tv', 10),
  ('rent', 'Rent', 'Loyer', 'building', 11)
ON CONFLICT (category_key) DO NOTHING;

-- ============================================================================
-- Chase Cards
-- ============================================================================

-- Chase Sapphire Preferred
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('chase-sapphire-preferred', 'Chase Sapphire Preferred Card', 'Chase', 'Chase Ultimate Rewards', 'points', 2.05, 95, 1.0, 'multiplier', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 2.05, annual_fee = 95, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 5.0, 'multiplier', '5x on travel purchased through Chase Travel'
FROM cards c WHERE c.card_key = 'chase-sapphire-preferred'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 5.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 3.0, 'multiplier', '3x on dining at restaurants'
FROM cards c WHERE c.card_key = 'chase-sapphire-preferred'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'online_shopping', 3.0, 'multiplier', '3x on online groceries'
FROM cards c WHERE c.card_key = 'chase-sapphire-preferred'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 75000, 'points', 5000, 90, true
FROM cards c WHERE c.card_key = 'chase-sapphire-preferred'
ON CONFLICT DO NOTHING;

-- Chase Sapphire Reserve
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('chase-sapphire-reserve', 'Chase Sapphire Reserve', 'Chase', 'Chase Ultimate Rewards', 'points', 2.05, 795, 1.0, 'multiplier', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 2.05, annual_fee = 795, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 8.0, 'multiplier', '8x on travel through Chase Travel including The Edit'
FROM cards c WHERE c.card_key = 'chase-sapphire-reserve'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 8.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 3.0, 'multiplier', '3x on dining worldwide'
FROM cards c WHERE c.card_key = 'chase-sapphire-reserve'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 125000, 'points', 6000, 90, true
FROM cards c WHERE c.card_key = 'chase-sapphire-reserve'
ON CONFLICT DO NOTHING;

-- Chase Freedom Unlimited
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('chase-freedom-unlimited', 'Chase Freedom Unlimited', 'Chase', 'Chase Ultimate Rewards', 'cashback', 2.05, 0, 1.5, 'percent', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 2.05, annual_fee = 0, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 5.0, 'percent', '5% on travel through Chase Travel'
FROM cards c WHERE c.card_key = 'chase-freedom-unlimited'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 5.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 3.0, 'percent', '3% on dining at restaurants'
FROM cards c WHERE c.card_key = 'chase-freedom-unlimited'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'drugstores', 3.0, 'percent', '3% at drugstores'
FROM cards c WHERE c.card_key = 'chase-freedom-unlimited'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 200, 'cashback', 500, 90, true
FROM cards c WHERE c.card_key = 'chase-freedom-unlimited'
ON CONFLICT DO NOTHING;

-- Chase Freedom Flex
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('chase-freedom-flex', 'Chase Freedom Flex', 'Chase', 'Chase Ultimate Rewards', 'cashback', 2.05, 0, 1.0, 'percent', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 2.05, annual_fee = 0, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 5.0, 'percent', '5% on travel through Chase Travel'
FROM cards c WHERE c.card_key = 'chase-freedom-flex'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 5.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 3.0, 'percent', '3% on dining at restaurants'
FROM cards c WHERE c.card_key = 'chase-freedom-flex'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'drugstores', 3.0, 'percent', '3% at drugstores'
FROM cards c WHERE c.card_key = 'chase-freedom-flex'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 200, 'cashback', 500, 90, true
FROM cards c WHERE c.card_key = 'chase-freedom-flex'
ON CONFLICT DO NOTHING;

-- Chase Ink Business Preferred
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('chase-ink-business-preferred', 'Ink Business Preferred Credit Card', 'Chase', 'Chase Ultimate Rewards', 'points', 2.05, 95, 1.0, 'multiplier', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 2.05, annual_fee = 95, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 3.0, 'multiplier', '3x on travel, shipping, internet, cable, phone (first $150K/year)'
FROM cards c WHERE c.card_key = 'chase-ink-business-preferred'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 100000, 'points', 8000, 90, true
FROM cards c WHERE c.card_key = 'chase-ink-business-preferred'
ON CONFLICT DO NOTHING;

-- Chase Ink Business Unlimited
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('chase-ink-business-unlimited', 'Ink Business Unlimited Credit Card', 'Chase', 'Chase Ultimate Rewards', 'cashback', 2.05, 0, 1.5, 'percent', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 2.05, annual_fee = 0, is_active = true, country = 'US';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 900, 'cashback', 6000, 90, true
FROM cards c WHERE c.card_key = 'chase-ink-business-unlimited'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- American Express Cards
-- ============================================================================

-- Amex Gold Card
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('amex-gold-card', 'American Express Gold Card', 'American Express', 'Membership Rewards', 'points', 2.0, 325, 1.0, 'multiplier', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 2.0, annual_fee = 325, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 4.0, 'multiplier', '4x at restaurants worldwide'
FROM cards c WHERE c.card_key = 'amex-gold-card'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 4.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 4.0, 'multiplier', '4x at U.S. supermarkets (up to $25K/year)'
FROM cards c WHERE c.card_key = 'amex-gold-card'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 4.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 3.0, 'multiplier', '3x on flights booked directly with airlines'
FROM cards c WHERE c.card_key = 'amex-gold-card'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 60000, 'points', 6000, 180, true
FROM cards c WHERE c.card_key = 'amex-gold-card'
ON CONFLICT DO NOTHING;

-- Amex Platinum Card
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('amex-platinum-card', 'American Express Platinum Card', 'American Express', 'Membership Rewards', 'points', 2.0, 895, 1.0, 'multiplier', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 2.0, annual_fee = 895, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 5.0, 'multiplier', '5x on flights and prepaid hotels through amextravel.com'
FROM cards c WHERE c.card_key = 'amex-platinum-card'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 5.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 175000, 'points', 12000, 180, true
FROM cards c WHERE c.card_key = 'amex-platinum-card'
ON CONFLICT DO NOTHING;

-- Amex Blue Cash Preferred
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('amex-blue-cash-preferred', 'Blue Cash Preferred Card from American Express', 'American Express', 'Cash Back', 'cashback', 1.0, 95, 1.0, 'percent', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 1.0, annual_fee = 95, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 6.0, 'percent', '6% at U.S. supermarkets (up to $6K/year)'
FROM cards c WHERE c.card_key = 'amex-blue-cash-preferred'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 6.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'entertainment', 6.0, 'percent', '6% on select U.S. streaming subscriptions'
FROM cards c WHERE c.card_key = 'amex-blue-cash-preferred'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 6.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 3.0, 'percent', '3% at U.S. gas stations'
FROM cards c WHERE c.card_key = 'amex-blue-cash-preferred'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 250, 'cashback', 3000, 180, true
FROM cards c WHERE c.card_key = 'amex-blue-cash-preferred'
ON CONFLICT DO NOTHING;

-- Amex Blue Cash Everyday
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('amex-blue-cash-everyday', 'Blue Cash Everyday Card from American Express', 'American Express', 'Cash Back', 'cashback', 1.0, 0, 1.0, 'percent', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 1.0, annual_fee = 0, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 3.0, 'percent', '3% at U.S. supermarkets (up to $6K/year)'
FROM cards c WHERE c.card_key = 'amex-blue-cash-everyday'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 3.0, 'percent', '3% at U.S. gas stations'
FROM cards c WHERE c.card_key = 'amex-blue-cash-everyday'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'online_shopping', 3.0, 'percent', '3% at U.S. online retail purchases'
FROM cards c WHERE c.card_key = 'amex-blue-cash-everyday'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 250, 'cashback', 3000, 180, true
FROM cards c WHERE c.card_key = 'amex-blue-cash-everyday'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Capital One Cards
-- ============================================================================

-- Capital One Venture X
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('capital-one-venture-x', 'Capital One Venture X Rewards Credit Card', 'Capital One', 'Capital One Miles', 'points', 1.85, 395, 2.0, 'multiplier', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 1.85, annual_fee = 395, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 10.0, 'multiplier', '10x on hotels and rental cars through Capital One Travel'
FROM cards c WHERE c.card_key = 'capital-one-venture-x'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 10.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 75000, 'points', 4000, 90, true
FROM cards c WHERE c.card_key = 'capital-one-venture-x'
ON CONFLICT DO NOTHING;

-- Capital One Venture
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('capital-one-venture', 'Capital One Venture Rewards Credit Card', 'Capital One', 'Capital One Miles', 'points', 1.85, 95, 2.0, 'multiplier', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 1.85, annual_fee = 95, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 5.0, 'multiplier', '5x on hotels, vacation rentals, rental cars through Capital One Travel'
FROM cards c WHERE c.card_key = 'capital-one-venture'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 5.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 75000, 'points', 4000, 90, true
FROM cards c WHERE c.card_key = 'capital-one-venture'
ON CONFLICT DO NOTHING;

-- Capital One SavorOne
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('capital-one-savor-one', 'Capital One SavorOne Cash Rewards Credit Card', 'Capital One', 'Cash Back', 'cashback', 1.0, 0, 1.0, 'percent', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 1.0, annual_fee = 0, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 3.0, 'percent', '3% on dining'
FROM cards c WHERE c.card_key = 'capital-one-savor-one'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'entertainment', 3.0, 'percent', '3% on entertainment'
FROM cards c WHERE c.card_key = 'capital-one-savor-one'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 3.0, 'percent', '3% at grocery stores (excluding superstores)'
FROM cards c WHERE c.card_key = 'capital-one-savor-one'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 200, 'cashback', 500, 90, true
FROM cards c WHERE c.card_key = 'capital-one-savor-one'
ON CONFLICT DO NOTHING;

-- Capital One Quicksilver
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('capital-one-quicksilver', 'Capital One Quicksilver Cash Rewards Credit Card', 'Capital One', 'Cash Back', 'cashback', 1.0, 0, 1.5, 'percent', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 1.0, annual_fee = 0, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 5.0, 'percent', '5% on hotels, vacation rentals, rental cars through Capital One Travel'
FROM cards c WHERE c.card_key = 'capital-one-quicksilver'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 5.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 200, 'cashback', 500, 90, true
FROM cards c WHERE c.card_key = 'capital-one-quicksilver'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Citi Cards
-- ============================================================================

-- Citi Double Cash
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('citi-double-cash', 'Citi Double Cash Card', 'Citi', 'Cash Back', 'cashback', 1.0, 0, 2.0, 'percent', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 1.0, annual_fee = 0, is_active = true, country = 'US';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 200, 'cashback', 1500, 180, true
FROM cards c WHERE c.card_key = 'citi-double-cash'
ON CONFLICT DO NOTHING;

-- Citi Custom Cash
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('citi-custom-cash', 'Citi Custom Cash Card', 'Citi', 'Citi ThankYou', 'cashback', 1.9, 0, 1.0, 'percent', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 1.9, annual_fee = 0, is_active = true, country = 'US';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 200, 'cashback', 1500, 180, true
FROM cards c WHERE c.card_key = 'citi-custom-cash'
ON CONFLICT DO NOTHING;

-- Citi Strata Premier
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('citi-strata-premier', 'Citi Strata Premier Card', 'Citi', 'Citi ThankYou', 'points', 1.9, 95, 1.0, 'multiplier', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 1.9, annual_fee = 95, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 3.0, 'multiplier', '3x on flights, hotels, and travel'
FROM cards c WHERE c.card_key = 'citi-strata-premier'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 3.0, 'multiplier', '3x on dining'
FROM cards c WHERE c.card_key = 'citi-strata-premier'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 3.0, 'multiplier', '3x at supermarkets'
FROM cards c WHERE c.card_key = 'citi-strata-premier'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 3.0, 'multiplier', '3x at gas stations and EV charging'
FROM cards c WHERE c.card_key = 'citi-strata-premier'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 75000, 'points', 4000, 90, true
FROM cards c WHERE c.card_key = 'citi-strata-premier'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Discover Cards
-- ============================================================================

-- Discover it Cash Back
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('discover-it-cash-back', 'Discover it Cash Back', 'Discover', 'Cash Back', 'cashback', 1.0, 0, 1.0, 'percent', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 1.0, annual_fee = 0, is_active = true, country = 'US';

-- Discover it Miles
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('discover-it-miles', 'Discover it Miles', 'Discover', 'Cash Back', 'cashback', 1.0, 0, 1.5, 'percent', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 1.0, annual_fee = 0, is_active = true, country = 'US';

-- ============================================================================
-- Bank of America Cards
-- ============================================================================

-- Bank of America Premium Rewards
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('bank-of-america-premium-rewards', 'Bank of America Premium Rewards Credit Card', 'Bank of America', 'Cash Back', 'points', 1.0, 95, 1.5, 'multiplier', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 1.0, annual_fee = 95, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 2.0, 'multiplier', '2x on travel and dining'
FROM cards c WHERE c.card_key = 'bank-of-america-premium-rewards'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 2.0, 'multiplier', '2x on travel and dining'
FROM cards c WHERE c.card_key = 'bank-of-america-premium-rewards'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 60000, 'points', 4000, 90, true
FROM cards c WHERE c.card_key = 'bank-of-america-premium-rewards'
ON CONFLICT DO NOTHING;

-- Bank of America Customized Cash
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('bank-of-america-customized-cash', 'Bank of America Customized Cash Rewards Credit Card', 'Bank of America', 'Cash Back', 'cashback', 1.0, 0, 1.0, 'percent', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 1.0, annual_fee = 0, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 2.0, 'percent', '2% at grocery stores and wholesale clubs'
FROM cards c WHERE c.card_key = 'bank-of-america-customized-cash'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 200, 'cashback', 1000, 90, true
FROM cards c WHERE c.card_key = 'bank-of-america-customized-cash'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Wells Fargo Cards
-- ============================================================================

-- Wells Fargo Active Cash
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('wells-fargo-active-cash', 'Wells Fargo Active Cash Card', 'Wells Fargo', 'Cash Back', 'cashback', 1.0, 0, 2.0, 'percent', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 1.0, annual_fee = 0, is_active = true, country = 'US';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 200, 'cashback', 500, 90, true
FROM cards c WHERE c.card_key = 'wells-fargo-active-cash'
ON CONFLICT DO NOTHING;

-- Wells Fargo Autograph
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('wells-fargo-autograph', 'Wells Fargo Autograph Card', 'Wells Fargo', 'Wells Fargo Rewards', 'points', 1.65, 0, 1.0, 'multiplier', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 1.65, annual_fee = 0, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 3.0, 'multiplier', '3x on dining'
FROM cards c WHERE c.card_key = 'wells-fargo-autograph'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 3.0, 'multiplier', '3x on travel'
FROM cards c WHERE c.card_key = 'wells-fargo-autograph'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 3.0, 'multiplier', '3x at gas stations'
FROM cards c WHERE c.card_key = 'wells-fargo-autograph'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 20000, 'points', 1000, 90, true
FROM cards c WHERE c.card_key = 'wells-fargo-autograph'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- U.S. Bank Cards
-- ============================================================================

-- U.S. Bank Altitude Connect
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('us-bank-altitude-connect', 'U.S. Bank Altitude Connect Visa Signature Card', 'U.S. Bank', 'Cash Back', 'points', 1.0, 95, 1.0, 'multiplier', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 1.0, annual_fee = 95, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 5.0, 'multiplier', '5x on prepaid hotels and car rentals through Altitude Rewards Center'
FROM cards c WHERE c.card_key = 'us-bank-altitude-connect'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 5.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 4.0, 'multiplier', '4x at gas stations and EV charging'
FROM cards c WHERE c.card_key = 'us-bank-altitude-connect'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 4.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 2.0, 'multiplier', '2x on dining'
FROM cards c WHERE c.card_key = 'us-bank-altitude-connect'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 2.0, 'multiplier', '2x at grocery stores'
FROM cards c WHERE c.card_key = 'us-bank-altitude-connect'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 30000, 'points', 2000, 120, true
FROM cards c WHERE c.card_key = 'us-bank-altitude-connect'
ON CONFLICT DO NOTHING;

-- U.S. Bank Altitude Reserve
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('us-bank-altitude-reserve', 'U.S. Bank Altitude Reserve Visa Infinite Card', 'U.S. Bank', 'Cash Back', 'points', 1.5, 400, 1.0, 'multiplier', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 1.5, annual_fee = 400, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 5.0, 'multiplier', '5x on prepaid hotels and car rentals through Altitude Rewards Center'
FROM cards c WHERE c.card_key = 'us-bank-altitude-reserve'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 5.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 3.0, 'multiplier', '3x on dining and travel'
FROM cards c WHERE c.card_key = 'us-bank-altitude-reserve'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 50000, 'points', 4500, 90, true
FROM cards c WHERE c.card_key = 'us-bank-altitude-reserve'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Barclays Cards
-- ============================================================================

-- Barclays AAdvantage Aviator Red
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('barclays-aadvantage-aviator-red', 'AAdvantage Aviator Red World Elite Mastercard', 'Barclays', 'American Airlines AAdvantage', 'airline_miles', 1.7, 99, 1.0, 'multiplier', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 1.7, annual_fee = 99, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 2.0, 'multiplier', '2x on American Airlines purchases'
FROM cards c WHERE c.card_key = 'barclays-aadvantage-aviator-red'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 60000, 'airline_miles', 1, 90, true
FROM cards c WHERE c.card_key = 'barclays-aadvantage-aviator-red'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Bilt Cards
-- ============================================================================

-- Bilt Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('bilt-mastercard', 'Bilt Mastercard', 'Bilt', 'Bilt Rewards', 'points', 2.2, 0, 1.0, 'multiplier', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET
  point_valuation = 2.2, annual_fee = 0, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 3.0, 'multiplier', '3x on dining'
FROM cards c WHERE c.card_key = 'bilt-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 2.0, 'multiplier', '2x on travel'
FROM cards c WHERE c.card_key = 'bilt-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON COLUMN cards.country IS 'Two-letter country code: US or CA';
