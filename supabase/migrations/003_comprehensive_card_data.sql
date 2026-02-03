-- ============================================================================
-- Comprehensive Canadian Credit Card Data
-- Generated: February 2026
-- Source: Official bank websites, RateHub, GreedyRates
-- ============================================================================

-- Clear existing data for fresh insert (keeps schema intact)
TRUNCATE TABLE signup_bonuses CASCADE;
TRUNCATE TABLE category_rewards CASCADE;
TRUNCATE TABLE cards CASCADE;

-- ============================================================================
-- AMERICAN EXPRESS CARDS
-- ============================================================================

-- Amex Cobalt Card
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('amex-cobalt-card', 'American Express Cobalt Card', 'American Express', 'Membership Rewards', 'points', 2.1, 191.88, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'dining', 5.0, 'multiplier', '5x points at restaurants and food delivery' FROM cards WHERE card_key = 'amex-cobalt-card'
UNION ALL
SELECT id, 'groceries', 5.0, 'multiplier', '5x points at grocery stores' FROM cards WHERE card_key = 'amex-cobalt-card'
UNION ALL
SELECT id, 'entertainment', 3.0, 'multiplier', '3x points on streaming subscriptions' FROM cards WHERE card_key = 'amex-cobalt-card'
UNION ALL
SELECT id, 'gas', 2.0, 'multiplier', '2x points on gas, transit, and rideshare' FROM cards WHERE card_key = 'amex-cobalt-card'
UNION ALL
SELECT id, 'travel', 2.0, 'multiplier', '2x points on transit and rideshare' FROM cards WHERE card_key = 'amex-cobalt-card';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 15000, 'points', 9000, 365, true FROM cards WHERE card_key = 'amex-cobalt-card';

-- Amex Gold Rewards Card
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('amex-gold-rewards', 'American Express Gold Rewards Card', 'American Express', 'Membership Rewards', 'points', 2.1, 250.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 2.0, 'multiplier', '2x points on travel' FROM cards WHERE card_key = 'amex-gold-rewards'
UNION ALL
SELECT id, 'gas', 2.0, 'multiplier', '2x points on gas' FROM cards WHERE card_key = 'amex-gold-rewards'
UNION ALL
SELECT id, 'groceries', 2.0, 'multiplier', '2x points at grocery stores' FROM cards WHERE card_key = 'amex-gold-rewards';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 40000, 'points', 3000, 90, true FROM cards WHERE card_key = 'amex-gold-rewards';

-- Amex Platinum Card
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('amex-platinum-card', 'American Express Platinum Card', 'American Express', 'Membership Rewards', 'points', 2.1, 799.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 2.0, 'multiplier', '2x points on travel' FROM cards WHERE card_key = 'amex-platinum-card';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 70000, 'points', 6000, 90, true FROM cards WHERE card_key = 'amex-platinum-card';

-- Amex Green Card
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('amex-green-card', 'American Express Green Card', 'American Express', 'Membership Rewards', 'points', 2.1, 150.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 3.0, 'multiplier', '3x points on travel' FROM cards WHERE card_key = 'amex-green-card'
UNION ALL
SELECT id, 'dining', 3.0, 'multiplier', '3x points at restaurants' FROM cards WHERE card_key = 'amex-green-card';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 45000, 'points', 3000, 90, true FROM cards WHERE card_key = 'amex-green-card';

-- Amex SimplyCash Preferred
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('amex-simplycash-preferred', 'SimplyCash Preferred Card from American Express', 'American Express', 'Cash Back', 'cashback', 1.0, 99.00, 1.25, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'gas', 4.0, 'percent', '4% cash back on gas' FROM cards WHERE card_key = 'amex-simplycash-preferred'
UNION ALL
SELECT id, 'groceries', 4.0, 'percent', '4% cash back at grocery stores' FROM cards WHERE card_key = 'amex-simplycash-preferred'
UNION ALL
SELECT id, 'dining', 4.0, 'percent', '4% cash back at restaurants' FROM cards WHERE card_key = 'amex-simplycash-preferred';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 400, 'cashback', 3000, 90, true FROM cards WHERE card_key = 'amex-simplycash-preferred';

-- Amex SimplyCash (No Fee)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('amex-simplycash', 'SimplyCash Card from American Express', 'American Express', 'Cash Back', 'cashback', 1.0, 0.00, 1.25, 'percent');

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 200, 'cashback', 2000, 90, true FROM cards WHERE card_key = 'amex-simplycash';

-- Amex Aeroplan Card
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('amex-aeroplan-card', 'American Express Aeroplan Card', 'American Express', 'Aeroplan', 'airline_miles', 2.0, 120.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 1.5, 'multiplier', '1.5x points on Air Canada purchases' FROM cards WHERE card_key = 'amex-aeroplan-card';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 25000, 'airline_miles', 3000, 90, true FROM cards WHERE card_key = 'amex-aeroplan-card';

-- Amex Aeroplan Reserve
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('amex-aeroplan-reserve', 'American Express Aeroplan Reserve Card', 'American Express', 'Aeroplan', 'airline_miles', 2.0, 599.00, 1.25, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 3.0, 'multiplier', '3x points on Air Canada and travel' FROM cards WHERE card_key = 'amex-aeroplan-reserve'
UNION ALL
SELECT id, 'dining', 2.0, 'multiplier', '2x points at restaurants' FROM cards WHERE card_key = 'amex-aeroplan-reserve';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 80000, 'airline_miles', 6000, 90, true FROM cards WHERE card_key = 'amex-aeroplan-reserve';

-- Marriott Bonvoy Amex Card
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('amex-marriott-bonvoy', 'Marriott Bonvoy American Express Card', 'American Express', 'Marriott Bonvoy', 'hotel_points', 0.74, 120.00, 2.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 5.0, 'multiplier', '5x points at Marriott hotels' FROM cards WHERE card_key = 'amex-marriott-bonvoy';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 50000, 'hotel_points', 3000, 90, true FROM cards WHERE card_key = 'amex-marriott-bonvoy';

-- ============================================================================
-- TD BANK CARDS
-- ============================================================================

-- TD Aeroplan Visa Infinite
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('td-aeroplan-visa-infinite', 'TD Aeroplan Visa Infinite Card', 'TD', 'Aeroplan', 'airline_miles', 2.0, 139.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 1.5, 'multiplier', '1.5x points on Air Canada and eligible travel' FROM cards WHERE card_key = 'td-aeroplan-visa-infinite'
UNION ALL
SELECT id, 'groceries', 1.5, 'multiplier', '1.5x points at grocery stores' FROM cards WHERE card_key = 'td-aeroplan-visa-infinite'
UNION ALL
SELECT id, 'gas', 1.5, 'multiplier', '1.5x points at gas stations' FROM cards WHERE card_key = 'td-aeroplan-visa-infinite';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 25000, 'airline_miles', 1500, 90, true FROM cards WHERE card_key = 'td-aeroplan-visa-infinite';

-- TD Aeroplan Visa Infinite Privilege
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('td-aeroplan-visa-infinite-privilege', 'TD Aeroplan Visa Infinite Privilege Card', 'TD', 'Aeroplan', 'airline_miles', 2.0, 599.00, 1.25, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 2.0, 'multiplier', '2x points on Air Canada purchases' FROM cards WHERE card_key = 'td-aeroplan-visa-infinite-privilege'
UNION ALL
SELECT id, 'groceries', 1.5, 'multiplier', '1.5x points at grocery stores' FROM cards WHERE card_key = 'td-aeroplan-visa-infinite-privilege'
UNION ALL
SELECT id, 'gas', 1.5, 'multiplier', '1.5x points at gas stations' FROM cards WHERE card_key = 'td-aeroplan-visa-infinite-privilege';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 50000, 'airline_miles', 3000, 90, true FROM cards WHERE card_key = 'td-aeroplan-visa-infinite-privilege';

-- TD First Class Travel Visa Infinite
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('td-first-class-travel', 'TD First Class Travel Visa Infinite Card', 'TD', 'TD Rewards', 'points', 0.5, 120.00, 3.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 6.0, 'multiplier', '6 points per $1 on travel booked through Expedia' FROM cards WHERE card_key = 'td-first-class-travel'
UNION ALL
SELECT id, 'dining', 6.0, 'multiplier', '6 points per $1 at restaurants' FROM cards WHERE card_key = 'td-first-class-travel';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 40000, 'points', 1000, 90, true FROM cards WHERE card_key = 'td-first-class-travel';

-- TD Cash Back Visa Infinite
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('td-cash-back-visa-infinite', 'TD Cash Back Visa Infinite Card', 'TD', 'Cash Back', 'cashback', 1.0, 89.00, 1.0, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 3.0, 'percent', '3% cash back at grocery stores' FROM cards WHERE card_key = 'td-cash-back-visa-infinite'
UNION ALL
SELECT id, 'gas', 3.0, 'percent', '3% cash back at gas stations' FROM cards WHERE card_key = 'td-cash-back-visa-infinite'
UNION ALL
SELECT id, 'online_shopping', 3.0, 'percent', '3% cash back on recurring bill payments' FROM cards WHERE card_key = 'td-cash-back-visa-infinite';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 100, 'cashback', 500, 90, true FROM cards WHERE card_key = 'td-cash-back-visa-infinite';

-- TD Cash Back Visa (No Fee)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('td-cash-back-visa', 'TD Cash Back Visa Card', 'TD', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 1.0, 'percent', '1% cash back at grocery stores' FROM cards WHERE card_key = 'td-cash-back-visa'
UNION ALL
SELECT id, 'gas', 1.0, 'percent', '1% cash back at gas stations' FROM cards WHERE card_key = 'td-cash-back-visa';

-- ============================================================================
-- RBC ROYAL BANK CARDS
-- ============================================================================

-- RBC Avion Visa Infinite
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('rbc-avion-visa-infinite', 'RBC Avion Visa Infinite Card', 'RBC', 'RBC Avion Rewards', 'points', 1.0, 120.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 1.0, 'multiplier', '1 point per $1 on all purchases' FROM cards WHERE card_key = 'rbc-avion-visa-infinite';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 35000, 'points', 5000, 90, true FROM cards WHERE card_key = 'rbc-avion-visa-infinite';

-- RBC Avion Visa Infinite Privilege
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('rbc-avion-visa-infinite-privilege', 'RBC Avion Visa Infinite Privilege Card', 'RBC', 'RBC Avion Rewards', 'points', 1.14, 399.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 1.0, 'multiplier', '1 point per $1 on all purchases' FROM cards WHERE card_key = 'rbc-avion-visa-infinite-privilege';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 55000, 'points', 5000, 90, true FROM cards WHERE card_key = 'rbc-avion-visa-infinite-privilege';

-- RBC Cash Back Preferred World Elite
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('rbc-cash-back-preferred-we', 'RBC Cash Back Preferred World Elite Mastercard', 'RBC', 'Cash Back', 'cashback', 1.0, 99.00, 1.0, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 2.0, 'percent', '2% cash back at grocery stores' FROM cards WHERE card_key = 'rbc-cash-back-preferred-we';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 50, 'cashback', 500, 90, true FROM cards WHERE card_key = 'rbc-cash-back-preferred-we';

-- RBC ION Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('rbc-ion-visa', 'RBC ION Visa Card', 'RBC', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'dining', 1.0, 'percent', '1% cash back at restaurants' FROM cards WHERE card_key = 'rbc-ion-visa'
UNION ALL
SELECT id, 'gas', 1.0, 'percent', '1% cash back on gas' FROM cards WHERE card_key = 'rbc-ion-visa';

-- ============================================================================
-- CIBC CARDS
-- ============================================================================

-- CIBC Aeroplan Visa Infinite
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('cibc-aeroplan-visa-infinite', 'CIBC Aeroplan Visa Infinite Card', 'CIBC', 'Aeroplan', 'airline_miles', 2.0, 139.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 1.5, 'multiplier', '1.5x points on Air Canada' FROM cards WHERE card_key = 'cibc-aeroplan-visa-infinite'
UNION ALL
SELECT id, 'groceries', 1.5, 'multiplier', '1.5x points at grocery stores' FROM cards WHERE card_key = 'cibc-aeroplan-visa-infinite'
UNION ALL
SELECT id, 'gas', 1.5, 'multiplier', '1.5x points at gas stations' FROM cards WHERE card_key = 'cibc-aeroplan-visa-infinite';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 25000, 'airline_miles', 1500, 90, true FROM cards WHERE card_key = 'cibc-aeroplan-visa-infinite';

-- CIBC Aventura Visa Infinite
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('cibc-aventura-visa-infinite', 'CIBC Aventura Visa Infinite Card', 'CIBC', 'CIBC Aventura', 'points', 1.0, 139.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 2.0, 'multiplier', '2x points on travel' FROM cards WHERE card_key = 'cibc-aventura-visa-infinite'
UNION ALL
SELECT id, 'gas', 2.0, 'multiplier', '2x points at gas stations' FROM cards WHERE card_key = 'cibc-aventura-visa-infinite';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 20000, 'points', 1000, 90, true FROM cards WHERE card_key = 'cibc-aventura-visa-infinite';

-- CIBC Dividend Visa Infinite
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('cibc-dividend-visa-infinite', 'CIBC Dividend Visa Infinite Card', 'CIBC', 'Cash Back', 'cashback', 1.0, 99.00, 1.0, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 4.0, 'percent', '4% cash back at grocery stores' FROM cards WHERE card_key = 'cibc-dividend-visa-infinite'
UNION ALL
SELECT id, 'gas', 4.0, 'percent', '4% cash back on gas' FROM cards WHERE card_key = 'cibc-dividend-visa-infinite'
UNION ALL
SELECT id, 'dining', 2.0, 'percent', '2% cash back at Tim Hortons' FROM cards WHERE card_key = 'cibc-dividend-visa-infinite';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 250, 'cashback', 2500, 120, true FROM cards WHERE card_key = 'cibc-dividend-visa-infinite';

-- CIBC Dividend Platinum Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('cibc-dividend-platinum', 'CIBC Dividend Platinum Visa Card', 'CIBC', 'Cash Back', 'cashback', 1.0, 39.00, 0.5, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 2.0, 'percent', '2% cash back at grocery stores' FROM cards WHERE card_key = 'cibc-dividend-platinum'
UNION ALL
SELECT id, 'gas', 2.0, 'percent', '2% cash back on gas' FROM cards WHERE card_key = 'cibc-dividend-platinum';

-- CIBC Costco Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('cibc-costco-mastercard', 'CIBC Costco Mastercard', 'CIBC', 'Cash Back', 'cashback', 1.0, 0.00, 1.0, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'gas', 3.0, 'percent', '3% cash back on gas (first $5,000)' FROM cards WHERE card_key = 'cibc-costco-mastercard'
UNION ALL
SELECT id, 'dining', 3.0, 'percent', '3% cash back at restaurants' FROM cards WHERE card_key = 'cibc-costco-mastercard'
UNION ALL
SELECT id, 'groceries', 2.0, 'percent', '2% cash back at Costco' FROM cards WHERE card_key = 'cibc-costco-mastercard';

-- ============================================================================
-- SCOTIABANK CARDS
-- ============================================================================

-- Scotiabank Passport Visa Infinite
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('scotia-passport-visa-infinite', 'Scotiabank Passport Visa Infinite Card', 'Scotiabank', 'Scotia Rewards', 'points', 1.0, 150.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 3.0, 'multiplier', '3x points on travel including no FX fees' FROM cards WHERE card_key = 'scotia-passport-visa-infinite'
UNION ALL
SELECT id, 'dining', 2.0, 'multiplier', '2x points at restaurants and entertainment' FROM cards WHERE card_key = 'scotia-passport-visa-infinite';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 40000, 'points', 1500, 90, true FROM cards WHERE card_key = 'scotia-passport-visa-infinite';

-- Scotiabank Gold Amex
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('scotia-gold-amex', 'Scotiabank Gold American Express Card', 'Scotiabank', 'Scene+', 'points', 1.0, 120.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'dining', 6.0, 'multiplier', '6x Scene+ points at restaurants' FROM cards WHERE card_key = 'scotia-gold-amex'
UNION ALL
SELECT id, 'groceries', 5.0, 'multiplier', '5x Scene+ points at grocery stores' FROM cards WHERE card_key = 'scotia-gold-amex'
UNION ALL
SELECT id, 'entertainment', 5.0, 'multiplier', '5x Scene+ points on entertainment' FROM cards WHERE card_key = 'scotia-gold-amex'
UNION ALL
SELECT id, 'online_shopping', 3.0, 'multiplier', '3x Scene+ points on recurring bills' FROM cards WHERE card_key = 'scotia-gold-amex';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 45000, 'points', 2000, 90, true FROM cards WHERE card_key = 'scotia-gold-amex';

-- Scotiabank Momentum Visa Infinite
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('scotia-momentum-visa-infinite', 'Scotia Momentum Visa Infinite Card', 'Scotiabank', 'Cash Back', 'cashback', 1.0, 120.00, 1.0, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 4.0, 'percent', '4% cash back at grocery stores' FROM cards WHERE card_key = 'scotia-momentum-visa-infinite'
UNION ALL
SELECT id, 'gas', 4.0, 'percent', '4% cash back on gas and recurring bills' FROM cards WHERE card_key = 'scotia-momentum-visa-infinite'
UNION ALL
SELECT id, 'dining', 2.0, 'percent', '2% cash back on daily transit and drugstores' FROM cards WHERE card_key = 'scotia-momentum-visa-infinite';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 250, 'cashback', 2500, 90, true FROM cards WHERE card_key = 'scotia-momentum-visa-infinite';

-- Scotiabank Scene+ Visa (No Fee)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('scotia-scene-visa', 'Scotiabank Scene+ Visa Card', 'Scotiabank', 'Scene+', 'points', 0.75, 0.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'dining', 5.0, 'multiplier', '5x Scene+ points at restaurants' FROM cards WHERE card_key = 'scotia-scene-visa'
UNION ALL
SELECT id, 'groceries', 3.0, 'multiplier', '3x Scene+ points at Sobeys' FROM cards WHERE card_key = 'scotia-scene-visa';

-- ============================================================================
-- BMO CARDS
-- ============================================================================

-- BMO Air Miles World Elite
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('bmo-airmiles-world-elite', 'BMO AIR MILES World Elite Mastercard', 'BMO', 'AIR MILES', 'airline_miles', 10.53, 120.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 3.0, 'multiplier', '3x AIR MILES at grocery stores' FROM cards WHERE card_key = 'bmo-airmiles-world-elite'
UNION ALL
SELECT id, 'gas', 3.0, 'multiplier', '3x AIR MILES at gas stations' FROM cards WHERE card_key = 'bmo-airmiles-world-elite';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 3000, 'airline_miles', 3000, 90, true FROM cards WHERE card_key = 'bmo-airmiles-world-elite';

-- BMO CashBack World Elite
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('bmo-cashback-world-elite', 'BMO CashBack World Elite Mastercard', 'BMO', 'Cash Back', 'cashback', 1.0, 120.00, 1.0, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 5.0, 'percent', '5% cash back at grocery stores' FROM cards WHERE card_key = 'bmo-cashback-world-elite'
UNION ALL
SELECT id, 'gas', 3.0, 'percent', '3% cash back on transit' FROM cards WHERE card_key = 'bmo-cashback-world-elite';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 100, 'cashback', 1000, 90, true FROM cards WHERE card_key = 'bmo-cashback-world-elite';

-- BMO eclipse Visa Infinite
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('bmo-eclipse-visa-infinite', 'BMO eclipse Visa Infinite Card', 'BMO', 'BMO Rewards', 'points', 0.67, 99.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'dining', 5.0, 'multiplier', '5x points at restaurants' FROM cards WHERE card_key = 'bmo-eclipse-visa-infinite'
UNION ALL
SELECT id, 'groceries', 5.0, 'multiplier', '5x points at grocery stores' FROM cards WHERE card_key = 'bmo-eclipse-visa-infinite'
UNION ALL
SELECT id, 'travel', 3.0, 'multiplier', '3x points on travel' FROM cards WHERE card_key = 'bmo-eclipse-visa-infinite';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 40000, 'points', 3000, 90, true FROM cards WHERE card_key = 'bmo-eclipse-visa-infinite';

-- BMO Cashback (No Fee)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('bmo-cashback', 'BMO CashBack Mastercard', 'BMO', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 3.0, 'percent', '3% cash back at grocery stores' FROM cards WHERE card_key = 'bmo-cashback';

-- ============================================================================
-- TANGERINE CARDS
-- ============================================================================

-- Tangerine Money-Back Credit Card
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('tangerine-money-back', 'Tangerine Money-Back Credit Card', 'Tangerine', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 2.0, 'percent', '2% cash back in 2 categories of your choice' FROM cards WHERE card_key = 'tangerine-money-back'
UNION ALL
SELECT id, 'gas', 2.0, 'percent', '2% cash back in 2 categories of your choice' FROM cards WHERE card_key = 'tangerine-money-back';

-- Tangerine World Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('tangerine-world-mastercard', 'Tangerine World Mastercard', 'Tangerine', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 2.0, 'percent', '2% cash back in 3 categories of your choice' FROM cards WHERE card_key = 'tangerine-world-mastercard'
UNION ALL
SELECT id, 'gas', 2.0, 'percent', '2% cash back in 3 categories of your choice' FROM cards WHERE card_key = 'tangerine-world-mastercard'
UNION ALL
SELECT id, 'dining', 2.0, 'percent', '2% cash back in 3 categories of your choice' FROM cards WHERE card_key = 'tangerine-world-mastercard';

-- ============================================================================
-- ROGERS BANK CARDS
-- ============================================================================

-- Rogers World Elite Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('rogers-world-elite', 'Rogers World Elite Mastercard', 'Rogers Bank', 'Cash Back', 'cashback', 1.0, 0.00, 1.5, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'online_shopping', 3.0, 'percent', '3% cash back on US dollar purchases' FROM cards WHERE card_key = 'rogers-world-elite';

-- Rogers Red World Elite Mastercard (formerly Fido)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('rogers-red-world-elite', 'Rogers Red World Elite Mastercard', 'Rogers Bank', 'Cash Back', 'cashback', 1.0, 0.00, 1.25, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'online_shopping', 4.0, 'percent', '4% cash back at Rogers, Fido, and Chatr' FROM cards WHERE card_key = 'rogers-red-world-elite';

-- ============================================================================
-- NEO FINANCIAL CARDS
-- ============================================================================

-- Neo Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('neo-mastercard', 'Neo Mastercard', 'Neo Financial', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'other', 10.0, 'percent', 'Up to 10% at Neo partner merchants' FROM cards WHERE card_key = 'neo-mastercard';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 100, 'cashback', 500, 90, true FROM cards WHERE card_key = 'neo-mastercard';

-- Neo Secured Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('neo-secured-mastercard', 'Neo Secured Mastercard', 'Neo Financial', 'Cash Back', 'cashback', 1.0, 96.00, 1.0, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'other', 10.0, 'percent', 'Up to 10% at Neo partner merchants' FROM cards WHERE card_key = 'neo-secured-mastercard';

-- ============================================================================
-- PC FINANCIAL CARDS
-- ============================================================================

-- PC Financial World Elite Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('pc-world-elite', 'PC Financial World Elite Mastercard', 'PC Financial', 'PC Optimum', 'points', 0.1, 0.00, 10.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description, has_spend_limit, spend_limit)
SELECT id, 'groceries', 45.0, 'multiplier', '45 PC Optimum points per $1 at Shoppers Drug Mart (first $8,000)', true, 8000 FROM cards WHERE card_key = 'pc-world-elite'
UNION ALL
SELECT id, 'other', 30.0, 'multiplier', '30 PC Optimum points per $1 at Loblaws stores' FROM cards WHERE card_key = 'pc-world-elite';

-- PC Financial Mastercard (No Fee)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('pc-mastercard', 'PC Financial Mastercard', 'PC Financial', 'PC Optimum', 'points', 0.1, 0.00, 10.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 25.0, 'multiplier', '25 PC Optimum points per $1 at Shoppers Drug Mart' FROM cards WHERE card_key = 'pc-mastercard'
UNION ALL
SELECT id, 'other', 25.0, 'multiplier', '25 PC Optimum points per $1 at Loblaws stores' FROM cards WHERE card_key = 'pc-mastercard';

-- ============================================================================
-- SIMPLII FINANCIAL CARDS
-- ============================================================================

-- Simplii Cash Back Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('simplii-cash-back-visa', 'Simplii Cash Back Visa Card', 'Simplii Financial', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'dining', 4.0, 'percent', '4% cash back at restaurants' FROM cards WHERE card_key = 'simplii-cash-back-visa'
UNION ALL
SELECT id, 'groceries', 1.5, 'percent', '1.5% cash back at grocery stores' FROM cards WHERE card_key = 'simplii-cash-back-visa'
UNION ALL
SELECT id, 'gas', 1.5, 'percent', '1.5% cash back on gas' FROM cards WHERE card_key = 'simplii-cash-back-visa';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 125, 'cashback', 1000, 120, true FROM cards WHERE card_key = 'simplii-cash-back-visa';

-- ============================================================================
-- CANADIAN TIRE / TRIANGLE
-- ============================================================================

-- Triangle World Elite Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('triangle-world-elite', 'Triangle World Elite Mastercard', 'Canadian Tire', 'Triangle Rewards', 'points', 0.1, 0.00, 4.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'gas', 7.0, 'multiplier', '7 cents CT Money per litre at Canadian Tire Gas' FROM cards WHERE card_key = 'triangle-world-elite'
UNION ALL
SELECT id, 'other', 5.0, 'multiplier', '5% CT Money at Canadian Tire stores' FROM cards WHERE card_key = 'triangle-world-elite';

-- Triangle Mastercard (No Fee)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('triangle-mastercard', 'Triangle Mastercard', 'Canadian Tire', 'Triangle Rewards', 'points', 0.1, 0.00, 4.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'gas', 5.0, 'multiplier', '5 cents CT Money per litre at Canadian Tire Gas' FROM cards WHERE card_key = 'triangle-mastercard'
UNION ALL
SELECT id, 'other', 4.0, 'multiplier', '4% CT Money at Canadian Tire stores' FROM cards WHERE card_key = 'triangle-mastercard';

-- ============================================================================
-- MBNA CARDS
-- ============================================================================

-- MBNA Rewards World Elite
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('mbna-rewards-world-elite', 'MBNA Rewards World Elite Mastercard', 'MBNA', 'MBNA Rewards', 'points', 0.5, 89.00, 2.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 5.0, 'multiplier', '5 points per $1 on travel' FROM cards WHERE card_key = 'mbna-rewards-world-elite';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 20000, 'points', 1000, 90, true FROM cards WHERE card_key = 'mbna-rewards-world-elite';

-- MBNA True Line Mastercard (Low Interest)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('mbna-true-line', 'MBNA True Line Mastercard', 'MBNA', 'None', 'cashback', 1.0, 0.00, 0.0, 'percent');

-- ============================================================================
-- CAPITAL ONE CARDS
-- ============================================================================

-- Capital One Aspire Cash Platinum
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('capital-one-aspire-cash', 'Capital One Aspire Cash Platinum Mastercard', 'Capital One', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 2.0, 'percent', '2% cash back at grocery stores' FROM cards WHERE card_key = 'capital-one-aspire-cash';

-- Capital One Secured Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('capital-one-secured', 'Capital One Secured Mastercard', 'Capital One', 'None', 'cashback', 1.0, 0.00, 0.0, 'percent');

-- ============================================================================
-- BRIM FINANCIAL CARDS
-- ============================================================================

-- Brim Mastercard (No Fee)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('brim-mastercard', 'Brim Mastercard', 'Brim Financial', 'Brim Rewards', 'points', 0.5, 0.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 2.0, 'multiplier', 'No foreign transaction fees + 2x on travel' FROM cards WHERE card_key = 'brim-mastercard';

-- Brim World Elite
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('brim-world-elite', 'Brim World Elite Mastercard', 'Brim Financial', 'Brim Rewards', 'points', 0.5, 199.00, 2.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 4.0, 'multiplier', 'No FX fees + 4x on travel' FROM cards WHERE card_key = 'brim-world-elite';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 50000, 'points', 3000, 90, true FROM cards WHERE card_key = 'brim-world-elite';

-- ============================================================================
-- DESJARDINS CARDS
-- ============================================================================

-- Desjardins Cash Back World Elite
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('desjardins-cashback-world-elite', 'Desjardins Cash Back World Elite Mastercard', 'Desjardins', 'Cash Back', 'cashback', 1.0, 110.00, 1.0, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 4.0, 'percent', '4% cash back at grocery stores' FROM cards WHERE card_key = 'desjardins-cashback-world-elite'
UNION ALL
SELECT id, 'gas', 4.0, 'percent', '4% cash back on gas' FROM cards WHERE card_key = 'desjardins-cashback-world-elite'
UNION ALL
SELECT id, 'drugstores', 2.0, 'percent', '2% cash back at drugstores' FROM cards WHERE card_key = 'desjardins-cashback-world-elite';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 200, 'cashback', 2000, 90, true FROM cards WHERE card_key = 'desjardins-cashback-world-elite';

-- Desjardins Odyssey World Elite
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('desjardins-odyssey-world-elite', 'Desjardins Odyssey World Elite Mastercard', 'Desjardins', 'Odyssey Points', 'points', 1.0, 150.00, 1.5, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 3.0, 'multiplier', '3x points on travel' FROM cards WHERE card_key = 'desjardins-odyssey-world-elite'
UNION ALL
SELECT id, 'dining', 2.0, 'multiplier', '2x points at restaurants' FROM cards WHERE card_key = 'desjardins-odyssey-world-elite';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 30000, 'points', 1500, 90, true FROM cards WHERE card_key = 'desjardins-odyssey-world-elite';

-- ============================================================================
-- HSBC CARDS
-- ============================================================================

-- HSBC World Elite Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('hsbc-world-elite', 'HSBC World Elite Mastercard', 'HSBC', 'HSBC Rewards', 'points', 0.5, 149.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 3.0, 'multiplier', '3x points on travel' FROM cards WHERE card_key = 'hsbc-world-elite'
UNION ALL
SELECT id, 'dining', 1.5, 'multiplier', '1.5x points at restaurants' FROM cards WHERE card_key = 'hsbc-world-elite';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 50000, 'points', 4000, 90, true FROM cards WHERE card_key = 'hsbc-world-elite';

-- ============================================================================
-- STUDENT CARDS
-- ============================================================================

-- BMO Cashback Mastercard for Students
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('bmo-cashback-student', 'BMO CashBack Mastercard for Students', 'BMO', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 3.0, 'percent', '3% cash back at grocery stores' FROM cards WHERE card_key = 'bmo-cashback-student';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 125, 'cashback', 1000, 90, true FROM cards WHERE card_key = 'bmo-cashback-student';

-- CIBC Dividend Visa Card for Students
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('cibc-dividend-student', 'CIBC Dividend Visa Card for Students', 'CIBC', 'Cash Back', 'cashback', 1.0, 0.00, 0.25, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 1.0, 'percent', '1% cash back at grocery stores' FROM cards WHERE card_key = 'cibc-dividend-student'
UNION ALL
SELECT id, 'gas', 1.0, 'percent', '1% cash back on gas' FROM cards WHERE card_key = 'cibc-dividend-student';

-- ============================================================================
-- NATIONAL BANK CARDS
-- ============================================================================

-- National Bank World Elite Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('national-bank-world-elite', 'National Bank World Elite Mastercard', 'National Bank', 'Cash Back', 'cashback', 1.0, 150.00, 1.0, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 4.0, 'percent', '4% cash back at grocery stores' FROM cards WHERE card_key = 'national-bank-world-elite'
UNION ALL
SELECT id, 'gas', 4.0, 'percent', '4% cash back on gas' FROM cards WHERE card_key = 'national-bank-world-elite'
UNION ALL
SELECT id, 'dining', 2.0, 'percent', '2% cash back at restaurants' FROM cards WHERE card_key = 'national-bank-world-elite';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 200, 'cashback', 2000, 90, true FROM cards WHERE card_key = 'national-bank-world-elite';

-- ============================================================================
-- VERIFY DATA INTEGRITY
-- ============================================================================

-- Count cards inserted
SELECT 'Total Cards Inserted: ' || COUNT(*) FROM cards;
SELECT 'Total Category Rewards: ' || COUNT(*) FROM category_rewards;
SELECT 'Total Signup Bonuses: ' || COUNT(*) FROM signup_bonuses;

-- Summary by issuer
SELECT issuer, COUNT(*) as card_count FROM cards GROUP BY issuer ORDER BY card_count DESC;
