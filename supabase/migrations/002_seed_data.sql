-- ============================================================================
-- Seed Data: Canadian Credit Cards
-- This migration populates the database with initial card data
-- ============================================================================

-- ============================================================================
-- Insert Cards
-- ============================================================================

INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit) VALUES
  ('walmart-rewards-mastercard', 'Walmart Rewards Mastercard', 'Walmart Canada', 'Walmart Rewards', 'cashback', 1.0, 0, 1, 'percent'),
  ('td-aeroplan-visa-infinite', 'TD Aeroplan Visa Infinite', 'TD Canada Trust', 'Aeroplan', 'airline_miles', 1.8, 139, 1, 'multiplier'),
  ('td-cash-back-visa-infinite', 'TD Cash Back Visa Infinite', 'TD Canada Trust', 'Cash Back', 'cashback', 1.0, 139, 1, 'percent'),
  ('cibc-dividend-visa-infinite', 'CIBC Dividend Visa Infinite', 'CIBC', 'Cash Back', 'cashback', 1.0, 120, 1, 'percent'),
  ('scotiabank-gold-amex', 'Scotiabank Gold American Express', 'Scotiabank', 'Scene+', 'points', 1.0, 150, 1, 'multiplier'),
  ('rbc-cash-back-mastercard', 'RBC Cash Back Mastercard', 'RBC', 'Cash Back', 'cashback', 1.0, 0, 0.5, 'percent'),
  ('bmo-cashback-mastercard', 'BMO CashBack Mastercard', 'BMO', 'Cash Back', 'cashback', 1.0, 0, 0.5, 'percent'),
  ('amex-cobalt-canada', 'American Express Cobalt Card', 'American Express Canada', 'Membership Rewards', 'points', 2.0, 156, 1, 'multiplier'),
  ('tangerine-money-back', 'Tangerine Money-Back Credit Card', 'Tangerine', 'Cash Back', 'cashback', 1.0, 0, 0.5, 'percent'),
  ('rogers-world-elite-mastercard', 'Rogers World Elite Mastercard', 'Rogers Bank', 'Cash Back', 'cashback', 1.0, 0, 1.5, 'percent'),
  ('pc-financial-world-elite', 'PC Financial World Elite Mastercard', 'PC Financial', 'PC Optimum', 'points', 1.0, 0, 1, 'multiplier'),
  ('triangle-world-elite', 'Triangle World Elite Mastercard', 'Canadian Tire Bank', 'Triangle Rewards', 'points', 1.0, 0, 1, 'multiplier'),
  ('neo-financial-mastercard', 'Neo Financial Mastercard', 'Neo Financial', 'Cash Back', 'cashback', 1.0, 0, 1, 'percent'),
  ('simplii-cash-back-visa', 'Simplii Financial Cash Back Visa', 'Simplii Financial', 'Cash Back', 'cashback', 1.0, 0, 0.5, 'percent'),
  ('cibc-dividend-visa', 'CIBC Dividend Visa', 'CIBC', 'Cash Back', 'cashback', 1.0, 0, 0.5, 'percent')
ON CONFLICT (card_key) DO UPDATE SET
  name = EXCLUDED.name,
  issuer = EXCLUDED.issuer,
  reward_program = EXCLUDED.reward_program,
  reward_currency = EXCLUDED.reward_currency,
  point_valuation = EXCLUDED.point_valuation,
  annual_fee = EXCLUDED.annual_fee,
  base_reward_rate = EXCLUDED.base_reward_rate,
  base_reward_unit = EXCLUDED.base_reward_unit;

-- ============================================================================
-- Insert Category Rewards
-- ============================================================================

-- Walmart Rewards Mastercard
INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'groceries', 1.25, 'percent', '1.25% cash back at grocery stores', '1,25 % de remise en argent dans les épiceries'
FROM cards WHERE card_key = 'walmart-rewards-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

-- TD Aeroplan Visa Infinite
INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'travel', 1.5, 'multiplier', '1.5x Aeroplan points on travel', '1,5x points Aéroplan sur les voyages'
FROM cards WHERE card_key = 'td-aeroplan-visa-infinite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'gas', 1.5, 'multiplier', '1.5x Aeroplan points at gas stations', '1,5x points Aéroplan aux stations-service'
FROM cards WHERE card_key = 'td-aeroplan-visa-infinite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

-- TD Cash Back Visa Infinite
INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'groceries', 3, 'percent', '3% cash back at grocery stores', '3 % de remise en argent dans les épiceries'
FROM cards WHERE card_key = 'td-cash-back-visa-infinite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'gas', 3, 'percent', '3% cash back at gas stations', '3 % de remise en argent aux stations-service'
FROM cards WHERE card_key = 'td-cash-back-visa-infinite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'dining', 3, 'percent', '3% cash back at restaurants', '3 % de remise en argent dans les restaurants'
FROM cards WHERE card_key = 'td-cash-back-visa-infinite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

-- CIBC Dividend Visa Infinite
INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'groceries', 4, 'percent', '4% cash back at grocery stores', '4 % de remise en argent dans les épiceries'
FROM cards WHERE card_key = 'cibc-dividend-visa-infinite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'gas', 4, 'percent', '4% cash back at gas stations', '4 % de remise en argent aux stations-service'
FROM cards WHERE card_key = 'cibc-dividend-visa-infinite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'dining', 2, 'percent', '2% cash back at restaurants', '2 % de remise en argent dans les restaurants'
FROM cards WHERE card_key = 'cibc-dividend-visa-infinite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

-- Scotiabank Gold American Express
INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'groceries', 5, 'multiplier', '5x Scene+ points at grocery stores', '5x points Scene+ dans les épiceries'
FROM cards WHERE card_key = 'scotiabank-gold-amex'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'dining', 5, 'multiplier', '5x Scene+ points at restaurants', '5x points Scene+ dans les restaurants'
FROM cards WHERE card_key = 'scotiabank-gold-amex'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'entertainment', 3, 'multiplier', '3x Scene+ points on entertainment', '3x points Scene+ sur les divertissements'
FROM cards WHERE card_key = 'scotiabank-gold-amex'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

-- RBC Cash Back Mastercard
INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'groceries', 2, 'percent', '2% cash back at grocery stores', '2 % de remise en argent dans les épiceries'
FROM cards WHERE card_key = 'rbc-cash-back-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

-- BMO CashBack Mastercard
INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'groceries', 3, 'percent', '3% cash back at grocery stores', '3 % de remise en argent dans les épiceries'
FROM cards WHERE card_key = 'bmo-cashback-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

-- American Express Cobalt Card
INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'dining', 5, 'multiplier', '5x points at restaurants', '5x points dans les restaurants'
FROM cards WHERE card_key = 'amex-cobalt-canada'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'groceries', 5, 'multiplier', '5x points at grocery stores', '5x points dans les épiceries'
FROM cards WHERE card_key = 'amex-cobalt-canada'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'travel', 2, 'multiplier', '2x points on travel', '2x points sur les voyages'
FROM cards WHERE card_key = 'amex-cobalt-canada'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'gas', 2, 'multiplier', '2x points at gas stations', '2x points aux stations-service'
FROM cards WHERE card_key = 'amex-cobalt-canada'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

-- Tangerine Money-Back Credit Card
INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'groceries', 2, 'percent', '2% cash back at grocery stores', '2 % de remise en argent dans les épiceries'
FROM cards WHERE card_key = 'tangerine-money-back'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'gas', 2, 'percent', '2% cash back at gas stations', '2 % de remise en argent aux stations-service'
FROM cards WHERE card_key = 'tangerine-money-back'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'dining', 2, 'percent', '2% cash back at restaurants', '2 % de remise en argent dans les restaurants'
FROM cards WHERE card_key = 'tangerine-money-back'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

-- Rogers World Elite Mastercard
INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'online_shopping', 1.5, 'percent', '1.5% cash back on online purchases', '1,5 % de remise en argent sur les achats en ligne'
FROM cards WHERE card_key = 'rogers-world-elite-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

-- PC Financial World Elite Mastercard
INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'groceries', 3, 'multiplier', '3x PC Optimum points at grocery stores', '3x points PC Optimum dans les épiceries'
FROM cards WHERE card_key = 'pc-financial-world-elite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

-- Triangle World Elite Mastercard
INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'gas', 4, 'multiplier', '4x Triangle Rewards at gas stations', '4x récompenses Triangle aux stations-service'
FROM cards WHERE card_key = 'triangle-world-elite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'home_improvement', 4, 'multiplier', '4x Triangle Rewards at home improvement stores', '4x récompenses Triangle dans les magasins de rénovation'
FROM cards WHERE card_key = 'triangle-world-elite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

-- Neo Financial Mastercard
INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'groceries', 5, 'percent', '5% cash back at grocery stores', '5 % de remise en argent dans les épiceries'
FROM cards WHERE card_key = 'neo-financial-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'dining', 5, 'percent', '5% cash back at restaurants', '5 % de remise en argent dans les restaurants'
FROM cards WHERE card_key = 'neo-financial-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

-- Simplii Financial Cash Back Visa
INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'dining', 4, 'percent', '4% cash back at restaurants', '4 % de remise en argent dans les restaurants'
FROM cards WHERE card_key = 'simplii-cash-back-visa'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'groceries', 1.5, 'percent', '1.5% cash back at grocery stores', '1,5 % de remise en argent dans les épiceries'
FROM cards WHERE card_key = 'simplii-cash-back-visa'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'gas', 1.5, 'percent', '1.5% cash back at gas stations', '1,5 % de remise en argent aux stations-service'
FROM cards WHERE card_key = 'simplii-cash-back-visa'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

-- CIBC Dividend Visa
INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'groceries', 2, 'percent', '2% cash back at grocery stores', '2 % de remise en argent dans les épiceries'
FROM cards WHERE card_key = 'cibc-dividend-visa'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, description_fr)
SELECT id, 'gas', 2, 'percent', '2% cash back at gas stations', '2 % de remise en argent aux stations-service'
FROM cards WHERE card_key = 'cibc-dividend-visa'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = EXCLUDED.multiplier, description = EXCLUDED.description;

-- ============================================================================
-- Insert Sample Signup Bonuses
-- ============================================================================

-- TD Aeroplan Visa Infinite
INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 20000, 'airline_miles', 1000, 90, true
FROM cards WHERE card_key = 'td-aeroplan-visa-infinite'
ON CONFLICT DO NOTHING;

-- American Express Cobalt Card
INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 30000, 'points', 3000, 90, true
FROM cards WHERE card_key = 'amex-cobalt-canada'
ON CONFLICT DO NOTHING;

-- Scotiabank Gold American Express
INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 25000, 'points', 1000, 90, true
FROM cards WHERE card_key = 'scotiabank-gold-amex'
ON CONFLICT DO NOTHING;
