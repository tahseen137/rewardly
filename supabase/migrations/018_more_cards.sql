-- ============================================================================
-- Additional Canadian and US Credit Cards
-- Migration 018 - February 2026
-- Adds missing cards from major issuers
-- ============================================================================

-- ============================================================================
-- CANADIAN CARDS - Additional CIBC Cards
-- ============================================================================

-- CIBC Aventura Gold Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('cibc-aventura-gold', 'CIBC Aventura Gold Visa Card', 'CIBC', 'CIBC Aventura', 'points', 1.0, 79.00, 1.0, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 1.0, annual_fee = 79.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 2.0, 'multiplier', '2x points on travel'
FROM cards c WHERE c.card_key = 'cibc-aventura-gold'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 1.5, 'multiplier', '1.5x points on gas'
FROM cards c WHERE c.card_key = 'cibc-aventura-gold'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 1.5;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 15000, 'points', 1000, 90, true
FROM cards c WHERE c.card_key = 'cibc-aventura-gold'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- CANADIAN CARDS - Additional Scotiabank Cards
-- ============================================================================

-- Scotiabank Scene+ Visa Infinite (Scene+ branded premium card)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('scotia-scene-visa-infinite', 'Scotiabank Scene+ Visa Infinite Card', 'Scotiabank', 'Scene+', 'points', 0.85, 99.00, 1.0, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 0.85, annual_fee = 99.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 6.0, 'multiplier', '6x Scene+ points at restaurants'
FROM cards c WHERE c.card_key = 'scotia-scene-visa-infinite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 6.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 5.0, 'multiplier', '5x Scene+ points at Sobeys, FreshCo, Safeway'
FROM cards c WHERE c.card_key = 'scotia-scene-visa-infinite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 5.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'entertainment', 5.0, 'multiplier', '5x Scene+ points on entertainment'
FROM cards c WHERE c.card_key = 'scotia-scene-visa-infinite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 5.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 35000, 'points', 2000, 90, true
FROM cards c WHERE c.card_key = 'scotia-scene-visa-infinite'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- CANADIAN CARDS - Additional BMO Cards  
-- ============================================================================

-- BMO Ascend World Elite Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('bmo-ascend-world-elite', 'BMO Ascend World Elite Mastercard', 'BMO', 'BMO Rewards', 'points', 0.7, 150.00, 1.0, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 0.7, annual_fee = 150.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 5.0, 'multiplier', '5x points on travel'
FROM cards c WHERE c.card_key = 'bmo-ascend-world-elite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 5.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 3.0, 'multiplier', '3x points on dining'
FROM cards c WHERE c.card_key = 'bmo-ascend-world-elite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 60000, 'points', 5000, 90, true
FROM cards c WHERE c.card_key = 'bmo-ascend-world-elite'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- CANADIAN CARDS - National Bank Cards
-- ============================================================================

-- National Bank Syncro Mastercard (No Fee Cashback)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('national-bank-syncro', 'National Bank Syncro Mastercard', 'National Bank', 'Cash Back', 'cashback', 1.0, 0.00, 1.0, 'percent', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 1.0, annual_fee = 0.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 5.0, 'percent', '5% cash back at grocery stores'
FROM cards c WHERE c.card_key = 'national-bank-syncro'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 5.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 5.0, 'percent', '5% cash back at restaurants'
FROM cards c WHERE c.card_key = 'national-bank-syncro'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 5.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 75, 'cashback', 500, 90, true
FROM cards c WHERE c.card_key = 'national-bank-syncro'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- CANADIAN CARDS - Desjardins Cards
-- ============================================================================

-- Desjardins Odyssey Gold Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('desjardins-odyssey-gold', 'Desjardins Odyssey Gold Visa Card', 'Desjardins', 'Odyssey Points', 'points', 1.0, 99.00, 1.0, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 1.0, annual_fee = 99.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 2.0, 'multiplier', '2x points on travel'
FROM cards c WHERE c.card_key = 'desjardins-odyssey-gold'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 1.5, 'multiplier', '1.5x points on gas'
FROM cards c WHERE c.card_key = 'desjardins-odyssey-gold'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 1.5;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 20000, 'points', 1000, 90, true
FROM cards c WHERE c.card_key = 'desjardins-odyssey-gold'
ON CONFLICT DO NOTHING;

-- Desjardins Cash Back Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('desjardins-cashback-visa', 'Desjardins Cash Back Visa Card', 'Desjardins', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 1.0, annual_fee = 0.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 1.5, 'percent', '1.5% cash back at grocery stores'
FROM cards c WHERE c.card_key = 'desjardins-cashback-visa'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 1.5;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 1.5, 'percent', '1.5% cash back on gas'
FROM cards c WHERE c.card_key = 'desjardins-cashback-visa'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 1.5;

-- ============================================================================
-- CANADIAN CARDS - Rogers/Fido Cards  
-- ============================================================================

-- Rogers Platinum Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('rogers-platinum', 'Rogers Platinum Mastercard', 'Rogers Bank', 'Cash Back', 'cashback', 1.0, 0.00, 1.0, 'percent', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 1.0, annual_fee = 0.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'online_shopping', 2.0, 'percent', '2% cash back on US dollar purchases'
FROM cards c WHERE c.card_key = 'rogers-platinum'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

-- ============================================================================
-- CANADIAN CARDS - MBNA Cards
-- ============================================================================

-- MBNA Rewards Platinum Plus Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('mbna-rewards-platinum-plus', 'MBNA Rewards Platinum Plus Mastercard', 'MBNA', 'MBNA Rewards', 'points', 0.5, 0.00, 2.0, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 0.5, annual_fee = 0.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 4.0, 'multiplier', '4x points on travel'
FROM cards c WHERE c.card_key = 'mbna-rewards-platinum-plus'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 4.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 15000, 'points', 500, 90, true
FROM cards c WHERE c.card_key = 'mbna-rewards-platinum-plus'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- CANADIAN CARDS - PC Financial Cards
-- ============================================================================

-- PC Financial World Mastercard (mid-tier)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('pc-world-mastercard', 'PC Financial World Mastercard', 'PC Financial', 'PC Optimum', 'points', 0.1, 0.00, 10.0, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 0.1, annual_fee = 0.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 35.0, 'multiplier', '35 PC Optimum points per $1 at Shoppers Drug Mart'
FROM cards c WHERE c.card_key = 'pc-world-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 35.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'drugstores', 30.0, 'multiplier', '30 PC Optimum points per $1 at Loblaws stores'
FROM cards c WHERE c.card_key = 'pc-world-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 30.0;

-- PC Money Account (debit card, but acts like credit)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('pc-money-account', 'PC Money Account', 'PC Financial', 'PC Optimum', 'points', 0.1, 0.00, 10.0, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 0.1, annual_fee = 0.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 25.0, 'multiplier', '25 PC Optimum points per $1 at PC stores'
FROM cards c WHERE c.card_key = 'pc-money-account'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 25.0;

-- ============================================================================
-- CANADIAN CARDS - Neo Financial Cards
-- ============================================================================

-- Neo Ultra Money-Back Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('neo-ultra-mastercard', 'Neo Ultra Money-Back Mastercard', 'Neo Financial', 'Cash Back', 'cashback', 1.0, 179.00, 4.0, 'percent', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 1.0, annual_fee = 179.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'other', 15.0, 'percent', 'Up to 15% at Neo partner merchants'
FROM cards c WHERE c.card_key = 'neo-ultra-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 15.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 150, 'cashback', 500, 90, true
FROM cards c WHERE c.card_key = 'neo-ultra-mastercard'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- CANADIAN CARDS - HSBC Cards
-- ============================================================================

-- HSBC +Rewards Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('hsbc-plus-rewards', 'HSBC +Rewards Mastercard', 'HSBC', 'HSBC Rewards', 'points', 0.5, 0.00, 1.0, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 0.5, annual_fee = 0.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 2.0, 'multiplier', '2x points on travel'
FROM cards c WHERE c.card_key = 'hsbc-plus-rewards'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

-- ============================================================================
-- CANADIAN CARDS - Brim Financial Cards
-- ============================================================================

-- Brim Mastercard (No FX)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('brim-no-fx-mastercard', 'Brim Mastercard', 'Brim Financial', 'Brim Rewards', 'points', 0.5, 0.00, 1.0, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 0.5, annual_fee = 0.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 2.0, 'multiplier', 'No FX fees + 2x points on travel purchases'
FROM cards c WHERE c.card_key = 'brim-no-fx-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

-- ============================================================================
-- US CARDS - American Express Additional Cards
-- ============================================================================

-- Amex Delta SkyMiles Gold
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('amex-delta-gold', 'Delta SkyMiles Gold American Express Card', 'American Express', 'Delta SkyMiles', 'airline_miles', 1.2, 150, 1.0, 'multiplier', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 1.2, annual_fee = 150, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 2.0, 'multiplier', '2x miles at restaurants worldwide'
FROM cards c WHERE c.card_key = 'amex-delta-gold'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 2.0, 'multiplier', '2x miles at U.S. supermarkets'
FROM cards c WHERE c.card_key = 'amex-delta-gold'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 2.0, 'multiplier', '2x miles on Delta purchases'
FROM cards c WHERE c.card_key = 'amex-delta-gold'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 50000, 'airline_miles', 3000, 180, true
FROM cards c WHERE c.card_key = 'amex-delta-gold'
ON CONFLICT DO NOTHING;

-- Amex Hilton Honors
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('amex-hilton-honors', 'Hilton Honors American Express Card', 'American Express', 'Hilton Honors', 'hotel_points', 0.5, 0, 3.0, 'multiplier', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 0.5, annual_fee = 0, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 5.0, 'multiplier', '5x points at restaurants'
FROM cards c WHERE c.card_key = 'amex-hilton-honors'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 5.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 5.0, 'multiplier', '5x points at U.S. supermarkets'
FROM cards c WHERE c.card_key = 'amex-hilton-honors'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 5.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 5.0, 'multiplier', '5x points at U.S. gas stations'
FROM cards c WHERE c.card_key = 'amex-hilton-honors'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 5.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 7.0, 'multiplier', '7x points at Hilton hotels'
FROM cards c WHERE c.card_key = 'amex-hilton-honors'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 7.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 80000, 'hotel_points', 2000, 90, true
FROM cards c WHERE c.card_key = 'amex-hilton-honors'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- US CARDS - Citi Additional Cards
-- ============================================================================

-- Citi Costco Anywhere Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('citi-costco-anywhere', 'Costco Anywhere Visa Card by Citi', 'Citi', 'Cash Back', 'cashback', 1.0, 0, 1.0, 'percent', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 1.0, annual_fee = 0, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 4.0, 'percent', '4% cash back on eligible gas (up to $7K/year)'
FROM cards c WHERE c.card_key = 'citi-costco-anywhere'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 4.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 3.0, 'percent', '3% on travel and restaurants'
FROM cards c WHERE c.card_key = 'citi-costco-anywhere'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 3.0, 'percent', '3% on travel and restaurants'
FROM cards c WHERE c.card_key = 'citi-costco-anywhere'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 2.0, 'percent', '2% at Costco and Costco.com'
FROM cards c WHERE c.card_key = 'citi-costco-anywhere'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

-- ============================================================================
-- US CARDS - Bank of America Additional Cards
-- ============================================================================

-- Bank of America Travel Rewards
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('bank-of-america-travel-rewards', 'Bank of America Travel Rewards Credit Card', 'Bank of America', 'Cash Back', 'points', 1.0, 0, 1.5, 'multiplier', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 1.0, annual_fee = 0, is_active = true, country = 'US';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 25000, 'points', 1000, 90, true
FROM cards c WHERE c.card_key = 'bank-of-america-travel-rewards'
ON CONFLICT DO NOTHING;

-- Bank of America Unlimited Cash Rewards
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('bank-of-america-unlimited-cash', 'Bank of America Unlimited Cash Rewards Credit Card', 'Bank of America', 'Cash Back', 'cashback', 1.0, 0, 1.5, 'percent', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 1.0, annual_fee = 0, is_active = true, country = 'US';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 200, 'cashback', 1000, 90, true
FROM cards c WHERE c.card_key = 'bank-of-america-unlimited-cash'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- US CARDS - US Bank Additional Cards
-- ============================================================================

-- US Bank Cash+
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('us-bank-cash-plus', 'U.S. Bank Cash+ Visa Signature Card', 'U.S. Bank', 'Cash Back', 'cashback', 1.0, 0, 1.0, 'percent', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 1.0, annual_fee = 0, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 5.0, 'percent', '5% cash back on first $2K in chosen categories each quarter'
FROM cards c WHERE c.card_key = 'us-bank-cash-plus'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 5.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 2.0, 'percent', '2% cash back on everyday purchases'
FROM cards c WHERE c.card_key = 'us-bank-cash-plus'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 200, 'cashback', 1000, 120, true
FROM cards c WHERE c.card_key = 'us-bank-cash-plus'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- US CARDS - Additional Major Cards
-- ============================================================================

-- Amazon Prime Visa (Chase)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('amazon-prime-visa', 'Amazon Prime Visa', 'Chase', 'Cash Back', 'cashback', 1.0, 0, 1.0, 'percent', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 1.0, annual_fee = 0, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'online_shopping', 5.0, 'percent', '5% back at Amazon.com and Whole Foods (Prime members)'
FROM cards c WHERE c.card_key = 'amazon-prime-visa'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 5.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 2.0, 'percent', '2% at restaurants'
FROM cards c WHERE c.card_key = 'amazon-prime-visa'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 2.0, 'percent', '2% at gas stations'
FROM cards c WHERE c.card_key = 'amazon-prime-visa'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'drugstores', 2.0, 'percent', '2% at drug stores'
FROM cards c WHERE c.card_key = 'amazon-prime-visa'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 200, 'cashback', 0, 0, true
FROM cards c WHERE c.card_key = 'amazon-prime-visa'
ON CONFLICT DO NOTHING;

-- Apple Card (Goldman Sachs)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('apple-card', 'Apple Card', 'Goldman Sachs', 'Cash Back', 'cashback', 1.0, 0, 1.0, 'percent', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 1.0, annual_fee = 0, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'other', 3.0, 'percent', '3% Daily Cash at Apple and select merchants with Apple Pay'
FROM cards c WHERE c.card_key = 'apple-card'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'online_shopping', 2.0, 'percent', '2% Daily Cash with Apple Pay'
FROM cards c WHERE c.card_key = 'apple-card'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

-- Target REDcard Credit Card
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('target-redcard', 'Target REDcard Credit Card', 'Target', 'Cash Back', 'cashback', 1.0, 0, 5.0, 'percent', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 1.0, annual_fee = 0, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'other', 5.0, 'percent', '5% off Target purchases'
FROM cards c WHERE c.card_key = 'target-redcard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 5.0;

-- Costco Anywhere Visa by Citi (duplicate check, ensure in US table)
-- Already added above

-- World of Hyatt Credit Card (Chase)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('chase-world-of-hyatt', 'World of Hyatt Credit Card', 'Chase', 'World of Hyatt', 'hotel_points', 1.7, 95, 1.0, 'multiplier', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 1.7, annual_fee = 95, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 4.0, 'multiplier', '4x points at Hyatt hotels'
FROM cards c WHERE c.card_key = 'chase-world-of-hyatt'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 4.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 2.0, 'multiplier', '2x points at restaurants'
FROM cards c WHERE c.card_key = 'chase-world-of-hyatt'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 2.0, 'multiplier', '2x points on local transit and commuting'
FROM cards c WHERE c.card_key = 'chase-world-of-hyatt'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 60000, 'hotel_points', 6000, 180, true
FROM cards c WHERE c.card_key = 'chase-world-of-hyatt'
ON CONFLICT DO NOTHING;

-- Marriott Bonvoy Boundless (Chase)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('chase-marriott-boundless', 'Marriott Bonvoy Boundless Credit Card', 'Chase', 'Marriott Bonvoy', 'hotel_points', 0.74, 95, 2.0, 'multiplier', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 0.74, annual_fee = 95, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 6.0, 'multiplier', '6x points at Marriott hotels'
FROM cards c WHERE c.card_key = 'chase-marriott-boundless'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 6.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 85000, 'hotel_points', 4000, 90, true
FROM cards c WHERE c.card_key = 'chase-marriott-boundless'
ON CONFLICT DO NOTHING;

-- Southwest Rapid Rewards Plus (Chase)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('chase-southwest-plus', 'Southwest Rapid Rewards Plus Credit Card', 'Chase', 'Southwest Rapid Rewards', 'airline_miles', 1.5, 69, 1.0, 'multiplier', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 1.5, annual_fee = 69, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 2.0, 'multiplier', '2x points on Southwest purchases'
FROM cards c WHERE c.card_key = 'chase-southwest-plus'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 50000, 'airline_miles', 1000, 90, true
FROM cards c WHERE c.card_key = 'chase-southwest-plus'
ON CONFLICT DO NOTHING;

-- United Explorer Card (Chase)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('chase-united-explorer', 'United Explorer Card', 'Chase', 'United MileagePlus', 'airline_miles', 1.3, 95, 1.0, 'multiplier', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 1.3, annual_fee = 95, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 2.0, 'multiplier', '2x miles on United and hotel purchases'
FROM cards c WHERE c.card_key = 'chase-united-explorer'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 2.0, 'multiplier', '2x miles on dining'
FROM cards c WHERE c.card_key = 'chase-united-explorer'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 60000, 'airline_miles', 3000, 90, true
FROM cards c WHERE c.card_key = 'chase-united-explorer'
ON CONFLICT DO NOTHING;

-- Citi Premier Card
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active) VALUES
('citi-premier', 'Citi Premier Card', 'Citi', 'Citi ThankYou', 'points', 1.9, 95, 1.0, 'multiplier', 'US', true)
ON CONFLICT (card_key) DO UPDATE SET point_valuation = 1.9, annual_fee = 95, is_active = true, country = 'US';

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 3.0, 'multiplier', '3x on air travel and hotels'
FROM cards c WHERE c.card_key = 'citi-premier'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 3.0, 'multiplier', '3x on dining'
FROM cards c WHERE c.card_key = 'citi-premier'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 3.0, 'multiplier', '3x at supermarkets'
FROM cards c WHERE c.card_key = 'citi-premier'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 3.0, 'multiplier', '3x at gas stations'
FROM cards c WHERE c.card_key = 'citi-premier'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 60000, 'points', 4000, 90, true
FROM cards c WHERE c.card_key = 'citi-premier'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Verify counts
-- ============================================================================

SELECT 'Total Cards After Migration: ' || COUNT(*) FROM cards;
SELECT 'US Cards: ' || COUNT(*) FROM cards WHERE country = 'US';
SELECT 'Canadian Cards: ' || COUNT(*) FROM cards WHERE country = 'CA';
SELECT 'Total Category Rewards: ' || COUNT(*) FROM category_rewards;
SELECT 'Total Signup Bonuses: ' || COUNT(*) FROM signup_bonuses;
