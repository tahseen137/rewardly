-- ============================================================================
-- Additional Canadian Credit Cards
-- Expanding from 57 to 100+ cards
-- ============================================================================

-- ============================================================================
-- AMERICAN EXPRESS - Additional Cards
-- ============================================================================

-- Amex Essential Credit Card
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('amex-essential', 'American Express Essential Credit Card', 'American Express', 'None', 'cashback', 1.0, 0.00, 0.0, 'percent');

-- Amex Business Edge Card
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('amex-business-edge', 'American Express Business Edge Card', 'American Express', 'Membership Rewards', 'points', 2.1, 99.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'gas', 3.0, 'multiplier', '3x points on advertising, shipping, gas' FROM cards WHERE card_key = 'amex-business-edge'
UNION ALL
SELECT id, 'travel', 2.0, 'multiplier', '2x points on travel' FROM cards WHERE card_key = 'amex-business-edge';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 40000, 'points', 5000, 90, true FROM cards WHERE card_key = 'amex-business-edge';

-- Amex Business Platinum
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('amex-business-platinum', 'Business Platinum Card from American Express', 'American Express', 'Membership Rewards', 'points', 2.1, 799.00, 1.25, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 2.0, 'multiplier', '2x points on travel booked through Amex Travel' FROM cards WHERE card_key = 'amex-business-platinum';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 80000, 'points', 10000, 90, true FROM cards WHERE card_key = 'amex-business-platinum';

-- Amex Business Gold Rewards
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('amex-business-gold', 'American Express Business Gold Rewards Card', 'American Express', 'Membership Rewards', 'points', 2.1, 199.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 2.0, 'multiplier', '2x points on travel and transit' FROM cards WHERE card_key = 'amex-business-gold'
UNION ALL
SELECT id, 'gas', 2.0, 'multiplier', '2x points on gas' FROM cards WHERE card_key = 'amex-business-gold';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 50000, 'points', 5000, 90, true FROM cards WHERE card_key = 'amex-business-gold';

-- Amex Aeroplan Business Reserve
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('amex-aeroplan-business-reserve', 'American Express Aeroplan Business Reserve Card', 'American Express', 'Aeroplan', 'airline_miles', 2.0, 599.00, 1.25, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 2.5, 'multiplier', '2.5x points on Air Canada' FROM cards WHERE card_key = 'amex-aeroplan-business-reserve';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 75000, 'airline_miles', 7500, 90, true FROM cards WHERE card_key = 'amex-aeroplan-business-reserve';

-- Marriott Bonvoy Business Amex
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('amex-marriott-bonvoy-business', 'Marriott Bonvoy Business American Express Card', 'American Express', 'Marriott Bonvoy', 'hotel_points', 0.74, 150.00, 2.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 6.0, 'multiplier', '6x points at Marriott hotels' FROM cards WHERE card_key = 'amex-marriott-bonvoy-business'
UNION ALL
SELECT id, 'dining', 4.0, 'multiplier', '4x points at restaurants' FROM cards WHERE card_key = 'amex-marriott-bonvoy-business';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 60000, 'hotel_points', 4000, 90, true FROM cards WHERE card_key = 'amex-marriott-bonvoy-business';

-- ============================================================================
-- TD BANK - Additional Cards
-- ============================================================================

-- TD Aeroplan Visa Platinum
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('td-aeroplan-visa-platinum', 'TD Aeroplan Visa Platinum Card', 'TD', 'Aeroplan', 'airline_miles', 2.0, 89.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 1.5, 'multiplier', '1.5x points on Air Canada' FROM cards WHERE card_key = 'td-aeroplan-visa-platinum';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 15000, 'airline_miles', 1000, 90, true FROM cards WHERE card_key = 'td-aeroplan-visa-platinum';

-- TD Platinum Travel Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('td-platinum-travel', 'TD Platinum Travel Visa Card', 'TD', 'TD Rewards', 'points', 0.5, 0.00, 2.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 4.0, 'multiplier', '4 points per $1 on travel' FROM cards WHERE card_key = 'td-platinum-travel';

-- TD Rewards Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('td-rewards-visa', 'TD Rewards Visa Card', 'TD', 'TD Rewards', 'points', 0.5, 0.00, 1.0, 'multiplier');

-- TD Aeroplan Visa Business
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('td-aeroplan-visa-business', 'TD Aeroplan Visa Business Card', 'TD', 'Aeroplan', 'airline_miles', 2.0, 120.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 1.5, 'multiplier', '1.5x points on Air Canada and office supplies' FROM cards WHERE card_key = 'td-aeroplan-visa-business';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 20000, 'airline_miles', 2000, 90, true FROM cards WHERE card_key = 'td-aeroplan-visa-business';

-- ============================================================================
-- RBC - Additional Cards
-- ============================================================================

-- RBC Avion Visa Platinum
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('rbc-avion-visa-platinum', 'RBC Avion Visa Platinum Card', 'RBC', 'RBC Avion Rewards', 'points', 1.0, 0.00, 1.0, 'multiplier');

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 15000, 'points', 1000, 90, true FROM cards WHERE card_key = 'rbc-avion-visa-platinum';

-- RBC ION+ Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('rbc-ion-plus-visa', 'RBC ION+ Visa Card', 'RBC', 'Cash Back', 'cashback', 1.0, 48.00, 1.0, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'dining', 1.5, 'percent', '1.5% cash back at restaurants' FROM cards WHERE card_key = 'rbc-ion-plus-visa'
UNION ALL
SELECT id, 'gas', 1.5, 'percent', '1.5% cash back on gas and transit' FROM cards WHERE card_key = 'rbc-ion-plus-visa';

-- RBC British Airways Visa Infinite
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('rbc-british-airways-visa', 'RBC British Airways Visa Infinite Card', 'RBC', 'Avios', 'airline_miles', 1.5, 165.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 1.5, 'multiplier', '1.5 Avios per $1 on travel' FROM cards WHERE card_key = 'rbc-british-airways-visa';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 25000, 'airline_miles', 5000, 90, true FROM cards WHERE card_key = 'rbc-british-airways-visa';

-- RBC Rewards+ Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('rbc-rewards-plus-visa', 'RBC Rewards+ Visa Card', 'RBC', 'RBC Rewards', 'points', 0.67, 0.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 2.0, 'multiplier', '2x points at grocery stores' FROM cards WHERE card_key = 'rbc-rewards-plus-visa';

-- RBC Avion Visa Infinite Business
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('rbc-avion-visa-infinite-business', 'RBC Avion Visa Infinite Business Card', 'RBC', 'RBC Avion Rewards', 'points', 1.0, 175.00, 1.0, 'multiplier');

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 35000, 'points', 5000, 90, true FROM cards WHERE card_key = 'rbc-avion-visa-infinite-business';

-- ============================================================================
-- CIBC - Additional Cards
-- ============================================================================

-- CIBC Aventura Visa Infinite Privilege
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('cibc-aventura-visa-privilege', 'CIBC Aventura Visa Infinite Privilege Card', 'CIBC', 'CIBC Aventura', 'points', 1.0, 499.00, 1.5, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 2.5, 'multiplier', '2.5x points on travel' FROM cards WHERE card_key = 'cibc-aventura-visa-privilege';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 50000, 'points', 3000, 90, true FROM cards WHERE card_key = 'cibc-aventura-visa-privilege';

-- CIBC Aventura Gold Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('cibc-aventura-gold', 'CIBC Aventura Gold Visa Card', 'CIBC', 'CIBC Aventura', 'points', 1.0, 79.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 1.5, 'multiplier', '1.5x points on travel' FROM cards WHERE card_key = 'cibc-aventura-gold';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 10000, 'points', 500, 90, true FROM cards WHERE card_key = 'cibc-aventura-gold';

-- CIBC Aeroplan Visa Platinum
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('cibc-aeroplan-visa-platinum', 'CIBC Aeroplan Visa Platinum Card', 'CIBC', 'Aeroplan', 'airline_miles', 2.0, 79.00, 1.0, 'multiplier');

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 10000, 'airline_miles', 500, 90, true FROM cards WHERE card_key = 'cibc-aeroplan-visa-platinum';

-- CIBC Aeroplan Visa Infinite Privilege
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('cibc-aeroplan-visa-privilege', 'CIBC Aeroplan Visa Infinite Privilege Card', 'CIBC', 'Aeroplan', 'airline_miles', 2.0, 599.00, 1.5, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 2.0, 'multiplier', '2x points on Air Canada' FROM cards WHERE card_key = 'cibc-aeroplan-visa-privilege'
UNION ALL
SELECT id, 'groceries', 1.5, 'multiplier', '1.5x points at grocery stores' FROM cards WHERE card_key = 'cibc-aeroplan-visa-privilege';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 80000, 'airline_miles', 6000, 90, true FROM cards WHERE card_key = 'cibc-aeroplan-visa-privilege';

-- CIBC Costco World Elite Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('cibc-costco-world-elite', 'CIBC Costco World Elite Mastercard', 'CIBC', 'Cash Back', 'cashback', 1.0, 0.00, 1.0, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'gas', 4.0, 'percent', '4% cash back at Costco Gas' FROM cards WHERE card_key = 'cibc-costco-world-elite'
UNION ALL
SELECT id, 'dining', 3.0, 'percent', '3% cash back at restaurants' FROM cards WHERE card_key = 'cibc-costco-world-elite'
UNION ALL
SELECT id, 'groceries', 2.0, 'percent', '2% cash back at Costco' FROM cards WHERE card_key = 'cibc-costco-world-elite';

-- CIBC Select Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('cibc-select-visa', 'CIBC Select Visa Card', 'CIBC', 'None', 'cashback', 1.0, 29.00, 0.0, 'percent');

-- CIBC Aventura Visa Business
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('cibc-aventura-business', 'CIBC Aventura Visa Business Card', 'CIBC', 'CIBC Aventura', 'points', 1.0, 149.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 2.0, 'multiplier', '2x points on travel' FROM cards WHERE card_key = 'cibc-aventura-business';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 25000, 'points', 2500, 90, true FROM cards WHERE card_key = 'cibc-aventura-business';

-- ============================================================================
-- SCOTIABANK - Additional Cards
-- ============================================================================

-- Scotiabank Passport Visa Infinite Privilege
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('scotia-passport-privilege', 'Scotiabank Passport Visa Infinite Privilege Card', 'Scotiabank', 'Scotia Rewards', 'points', 1.0, 399.00, 2.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 4.0, 'multiplier', '4x points on travel' FROM cards WHERE card_key = 'scotia-passport-privilege'
UNION ALL
SELECT id, 'dining', 3.0, 'multiplier', '3x points at restaurants' FROM cards WHERE card_key = 'scotia-passport-privilege';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 60000, 'points', 2000, 90, true FROM cards WHERE card_key = 'scotia-passport-privilege';

-- Scotiabank Platinum American Express
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('scotia-platinum-amex', 'Scotiabank Platinum American Express Card', 'Scotiabank', 'Scene+', 'points', 1.0, 399.00, 2.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'dining', 8.0, 'multiplier', '8x Scene+ points at restaurants' FROM cards WHERE card_key = 'scotia-platinum-amex'
UNION ALL
SELECT id, 'groceries', 6.0, 'multiplier', '6x Scene+ points at grocery stores' FROM cards WHERE card_key = 'scotia-platinum-amex'
UNION ALL
SELECT id, 'entertainment', 6.0, 'multiplier', '6x Scene+ points on entertainment' FROM cards WHERE card_key = 'scotia-platinum-amex';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 70000, 'points', 3000, 90, true FROM cards WHERE card_key = 'scotia-platinum-amex';

-- Scotiabank Value Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('scotia-value-visa', 'Scotiabank Value Visa Card', 'Scotiabank', 'None', 'cashback', 1.0, 29.00, 0.0, 'percent');

-- Scotiabank Momentum No-Fee Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('scotia-momentum-no-fee', 'Scotia Momentum No-Fee Visa Card', 'Scotiabank', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 2.0, 'percent', '2% cash back at grocery stores' FROM cards WHERE card_key = 'scotia-momentum-no-fee'
UNION ALL
SELECT id, 'gas', 2.0, 'percent', '2% cash back on gas and recurring bills' FROM cards WHERE card_key = 'scotia-momentum-no-fee';

-- ============================================================================
-- BMO - Additional Cards  
-- ============================================================================

-- BMO AIR MILES Mastercard (No Fee)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('bmo-airmiles', 'BMO AIR MILES Mastercard', 'BMO', 'AIR MILES', 'airline_miles', 10.53, 0.00, 1.0, 'multiplier');

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 500, 'airline_miles', 500, 90, true FROM cards WHERE card_key = 'bmo-airmiles';

-- BMO eclipse Visa Infinite Privilege
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('bmo-eclipse-visa-privilege', 'BMO eclipse Visa Infinite Privilege Card', 'BMO', 'BMO Rewards', 'points', 0.67, 399.00, 2.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'dining', 6.0, 'multiplier', '6x points at restaurants' FROM cards WHERE card_key = 'bmo-eclipse-visa-privilege'
UNION ALL
SELECT id, 'groceries', 6.0, 'multiplier', '6x points at grocery stores' FROM cards WHERE card_key = 'bmo-eclipse-visa-privilege'
UNION ALL
SELECT id, 'travel', 4.0, 'multiplier', '4x points on travel' FROM cards WHERE card_key = 'bmo-eclipse-visa-privilege';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 80000, 'points', 5000, 90, true FROM cards WHERE card_key = 'bmo-eclipse-visa-privilege';

-- BMO Rewards Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('bmo-rewards-mastercard', 'BMO Rewards Mastercard', 'BMO', 'BMO Rewards', 'points', 0.67, 0.00, 1.0, 'multiplier');

-- BMO Preferred Rate Mastercard (Low Interest)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('bmo-preferred-rate', 'BMO Preferred Rate Mastercard', 'BMO', 'None', 'cashback', 1.0, 20.00, 0.0, 'percent');

-- BMO AIR MILES Business Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('bmo-airmiles-business', 'BMO AIR MILES Business Mastercard', 'BMO', 'AIR MILES', 'airline_miles', 10.53, 0.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'other', 2.0, 'multiplier', '2x AIR MILES on business expenses' FROM cards WHERE card_key = 'bmo-airmiles-business';

-- ============================================================================
-- NATIONAL BANK - Additional Cards
-- ============================================================================

-- National Bank Platinum Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('national-bank-platinum', 'National Bank Platinum Mastercard', 'National Bank', 'Cash Back', 'cashback', 1.0, 39.00, 0.5, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 2.0, 'percent', '2% cash back at grocery stores' FROM cards WHERE card_key = 'national-bank-platinum'
UNION ALL
SELECT id, 'gas', 2.0, 'percent', '2% cash back on gas' FROM cards WHERE card_key = 'national-bank-platinum';

-- National Bank No-Fee Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('national-bank-no-fee', 'National Bank No-Fee Mastercard', 'National Bank', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 1.0, 'percent', '1% cash back at grocery stores' FROM cards WHERE card_key = 'national-bank-no-fee';

-- ============================================================================
-- HSBC - Additional Cards
-- ============================================================================

-- HSBC Platinum Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('hsbc-platinum-visa', 'HSBC Platinum Visa Card', 'HSBC', 'None', 'cashback', 1.0, 0.00, 0.0, 'percent');

-- ============================================================================
-- DESJARDINS - Additional Cards
-- ============================================================================

-- Desjardins Odyssey Gold Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('desjardins-odyssey-gold', 'Desjardins Odyssey Gold Visa Card', 'Desjardins', 'Odyssey Points', 'points', 1.0, 70.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 2.0, 'multiplier', '2x points on travel' FROM cards WHERE card_key = 'desjardins-odyssey-gold';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 15000, 'points', 1000, 90, true FROM cards WHERE card_key = 'desjardins-odyssey-gold';

-- Desjardins Odyssey Visa Infinite Privilege
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('desjardins-odyssey-privilege', 'Desjardins Odyssey Visa Infinite Privilege Card', 'Desjardins', 'Odyssey Points', 'points', 1.0, 400.00, 2.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 4.0, 'multiplier', '4x points on travel' FROM cards WHERE card_key = 'desjardins-odyssey-privilege'
UNION ALL
SELECT id, 'dining', 3.0, 'multiplier', '3x points at restaurants' FROM cards WHERE card_key = 'desjardins-odyssey-privilege';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 50000, 'points', 3000, 90, true FROM cards WHERE card_key = 'desjardins-odyssey-privilege';

-- Desjardins Flexi Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('desjardins-flexi-visa', 'Desjardins Flexi Visa Card', 'Desjardins', 'None', 'cashback', 1.0, 0.00, 0.0, 'percent');

-- ============================================================================
-- MBNA - Additional Cards
-- ============================================================================

-- MBNA Rewards Platinum Plus
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('mbna-rewards-platinum-plus', 'MBNA Rewards Platinum Plus Mastercard', 'MBNA', 'MBNA Rewards', 'points', 0.5, 39.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 3.0, 'multiplier', '3 points per $1 on travel' FROM cards WHERE card_key = 'mbna-rewards-platinum-plus';

-- MBNA True Line Gold
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('mbna-true-line-gold', 'MBNA True Line Gold Mastercard', 'MBNA', 'None', 'cashback', 1.0, 39.00, 0.0, 'percent');

-- ============================================================================
-- KOHO & FINTECHS
-- ============================================================================

-- KOHO Premium Prepaid Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('koho-premium', 'KOHO Premium Prepaid Visa Card', 'KOHO', 'Cash Back', 'cashback', 1.0, 84.00, 1.0, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 2.0, 'percent', '2% cash back at grocery stores' FROM cards WHERE card_key = 'koho-premium'
UNION ALL
SELECT id, 'dining', 2.0, 'percent', '2% cash back at restaurants' FROM cards WHERE card_key = 'koho-premium'
UNION ALL
SELECT id, 'travel', 2.0, 'percent', '2% cash back on transportation' FROM cards WHERE card_key = 'koho-premium';

-- KOHO Easy Prepaid Visa (Free)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('koho-easy', 'KOHO Easy Prepaid Visa Card', 'KOHO', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

-- WealthSimple Cash Card
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('wealthsimple-cash', 'Wealthsimple Cash Card', 'Wealthsimple', 'Cash Back', 'cashback', 1.0, 0.00, 1.0, 'percent');

-- ============================================================================
-- COSTCO CARDS (Additional)
-- ============================================================================

-- Capital One Costco Mastercard (US Dollar)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('capital-one-costco', 'Capital One Costco Mastercard', 'Capital One', 'Cash Back', 'cashback', 1.0, 0.00, 1.0, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'gas', 3.0, 'percent', '3% cash back at Costco Gas' FROM cards WHERE card_key = 'capital-one-costco'
UNION ALL
SELECT id, 'dining', 3.0, 'percent', '3% cash back at restaurants' FROM cards WHERE card_key = 'capital-one-costco'
UNION ALL
SELECT id, 'groceries', 2.0, 'percent', '2% cash back at Costco' FROM cards WHERE card_key = 'capital-one-costco';

-- ============================================================================
-- LOW INTEREST CARDS
-- ============================================================================

-- CIBC Low Rate Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('cibc-low-rate-visa', 'CIBC Select Flex Visa Card', 'CIBC', 'None', 'cashback', 1.0, 0.00, 0.0, 'percent');

-- RBC Low Rate Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('rbc-low-rate-visa', 'RBC Low Rate Visa Card', 'RBC', 'None', 'cashback', 1.0, 20.00, 0.0, 'percent');

-- TD Low Rate Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('td-low-rate-visa', 'TD Emerald Visa Card', 'TD', 'None', 'cashback', 1.0, 0.00, 0.0, 'percent');

-- Scotiabank Low Rate Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('scotia-low-rate-visa', 'Scotiabank Low Rate Visa Card', 'Scotiabank', 'None', 'cashback', 1.0, 29.00, 0.0, 'percent');

-- ============================================================================
-- SECURED CARDS (for building credit)
-- ============================================================================

-- Home Trust Secured Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('home-trust-secured', 'Home Trust Secured Visa Card', 'Home Trust', 'None', 'cashback', 1.0, 59.00, 0.0, 'percent');

-- Refresh Financial Secured Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('refresh-secured', 'Refresh Financial Secured Visa Card', 'Refresh Financial', 'None', 'cashback', 1.0, 48.95, 0.0, 'percent');

-- Scotiabank Secured Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('scotia-secured-visa', 'Scotiabank Secured Visa Card', 'Scotiabank', 'None', 'cashback', 1.0, 0.00, 0.0, 'percent');

-- ============================================================================
-- STORE-BRANDED CARDS
-- ============================================================================

-- Amazon.ca Rewards Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('amazon-rewards', 'Amazon.ca Rewards Mastercard', 'MBNA', 'Amazon Rewards', 'points', 0.5, 0.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'online_shopping', 2.5, 'multiplier', '2.5% back at Amazon.ca' FROM cards WHERE card_key = 'amazon-rewards';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 30, 'cashback', 0, 0, true FROM cards WHERE card_key = 'amazon-rewards';

-- Walmart Rewards Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('walmart-rewards', 'Walmart Rewards Mastercard', 'Duo Bank', 'Walmart Rewards', 'cashback', 1.0, 0.00, 1.0, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 3.0, 'percent', '3% Walmart Rewards Dollars at Walmart' FROM cards WHERE card_key = 'walmart-rewards'
UNION ALL
SELECT id, 'online_shopping', 3.0, 'percent', '3% at Walmart.ca' FROM cards WHERE card_key = 'walmart-rewards';

-- Hudson''s Bay Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('hudsons-bay', 'Hudson''s Bay Mastercard', 'Capital One', 'Hudson''s Bay Rewards', 'points', 0.5, 0.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'other', 3.0, 'multiplier', '3x points at Hudson''s Bay stores' FROM cards WHERE card_key = 'hudsons-bay';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Additional Cards Added: ' || COUNT(*) FROM cards WHERE card_key NOT IN (
  'amex-cobalt-card', 'amex-gold-rewards', 'amex-platinum-card', 'amex-green-card',
  'amex-simplycash-preferred', 'amex-simplycash', 'amex-aeroplan-card', 'amex-aeroplan-reserve',
  'amex-marriott-bonvoy', 'td-aeroplan-visa-infinite', 'td-aeroplan-visa-infinite-privilege',
  'td-first-class-travel', 'td-cash-back-visa-infinite', 'td-cash-back-visa'
);

SELECT 'Total Cards in Database: ' || COUNT(*) FROM cards;
