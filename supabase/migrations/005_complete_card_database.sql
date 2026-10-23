-- ============================================================================
-- Complete Canadian Credit Card Database
-- Adding remaining cards: Credit Unions, Regional Banks, Store Cards, etc.
-- ============================================================================

-- ============================================================================
-- CREDIT UNION CARDS
-- ============================================================================

-- Meridian Credit Union
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('meridian-visa-infinite', 'Meridian Visa Infinite Cash Back Card', 'Meridian Credit Union', 'Cash Back', 'cashback', 1.0, 99.00, 1.0, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 4.0, 'percent', '4% cash back at grocery stores' FROM cards WHERE card_key = 'meridian-visa-infinite'
UNION ALL
SELECT id, 'gas', 2.0, 'percent', '2% cash back on gas' FROM cards WHERE card_key = 'meridian-visa-infinite';

INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('meridian-visa-platinum', 'Meridian Visa Platinum Card', 'Meridian Credit Union', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

-- Vancity Credit Union (BC)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('vancity-enviro-visa', 'Vancity enviro Visa Card', 'Vancity', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('vancity-visa-infinite', 'Vancity Visa Infinite Card', 'Vancity', 'Cash Back', 'cashback', 1.0, 99.00, 1.0, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 3.0, 'percent', '3% cash back at grocery stores' FROM cards WHERE card_key = 'vancity-visa-infinite';

-- Coast Capital Savings (BC)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('coast-capital-visa', 'Coast Capital Visa Card', 'Coast Capital Savings', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('coast-capital-visa-infinite', 'Coast Capital Visa Infinite Card', 'Coast Capital Savings', 'Cash Back', 'cashback', 1.0, 79.00, 1.0, 'percent');

-- Servus Credit Union (Alberta)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('servus-visa-infinite', 'Servus Visa Infinite Card', 'Servus Credit Union', 'Cash Back', 'cashback', 1.0, 99.00, 1.0, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 4.0, 'percent', '4% cash back at grocery stores' FROM cards WHERE card_key = 'servus-visa-infinite';

INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('servus-visa-platinum', 'Servus Visa Platinum Card', 'Servus Credit Union', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

-- First West Credit Union (BC)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('firstwest-visa-platinum', 'First West Visa Platinum Card', 'First West Credit Union', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

-- Alterna Savings (Ontario)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('alterna-visa', 'Alterna Visa Card', 'Alterna Savings', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

-- DUCA Credit Union (Ontario)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('duca-visa-platinum', 'DUCA Visa Platinum Card', 'DUCA Credit Union', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

-- Conexus Credit Union (Saskatchewan)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('conexus-visa', 'Conexus Visa Card', 'Conexus Credit Union', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

-- Affinity Credit Union (Saskatchewan)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('affinity-visa', 'Affinity Visa Card', 'Affinity Credit Union', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

-- Steinbach Credit Union (Manitoba)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('steinbach-visa', 'Steinbach Visa Card', 'Steinbach Credit Union', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

-- Assiniboine Credit Union (Manitoba)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('assiniboine-visa', 'Assiniboine Visa Card', 'Assiniboine Credit Union', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

-- ============================================================================
-- REGIONAL BANKS
-- ============================================================================

-- ATB Financial (Alberta)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('atb-mastercard', 'ATB Financial Mastercard', 'ATB Financial', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('atb-world-mastercard', 'ATB World Mastercard', 'ATB Financial', 'Cash Back', 'cashback', 1.0, 79.00, 1.0, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 2.0, 'percent', '2% cash back at grocery stores' FROM cards WHERE card_key = 'atb-world-mastercard';

-- Laurentian Bank
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('laurentian-visa', 'Laurentian Bank Visa Card', 'Laurentian Bank', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('laurentian-visa-infinite', 'Laurentian Bank Visa Infinite Card', 'Laurentian Bank', 'Cash Back', 'cashback', 1.0, 99.00, 1.0, 'percent');

-- Manulife Bank
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('manulife-visa', 'Manulife Visa Card', 'Manulife Bank', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

-- EQ Bank
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('eq-bank-card', 'EQ Bank Card', 'EQ Bank', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

-- Peoples Trust (Peoples Group)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('peoples-trust-secured', 'Peoples Trust Secured Visa Card', 'Peoples Trust', 'None', 'cashback', 1.0, 33.00, 0.0, 'percent');

-- ============================================================================
-- ADDITIONAL STORE CARDS
-- ============================================================================

-- Hudson's Bay
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('hudsons-bay-mastercard', 'Hudson''s Bay Mastercard', 'Capital One', 'Hudson''s Bay Rewards', 'points', 0.5, 0.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'other', 7.0, 'multiplier', '7 HBC points per $1 at Hudson''s Bay' FROM cards WHERE card_key = 'hudsons-bay-mastercard';

-- Sears (now The Bay Financial)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('bay-credit-card', 'The Bay Credit Card', 'Capital One', 'Hudson''s Bay Rewards', 'points', 0.5, 0.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'other', 4.0, 'multiplier', '4 HBC points per $1 at The Bay' FROM cards WHERE card_key = 'bay-credit-card';

-- IKEA
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('ikea-projekt-card', 'IKEA Projekt Card', 'Desjardins', 'None', 'cashback', 1.0, 0.00, 0.0, 'percent');

-- Home Depot
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('home-depot-card', 'Home Depot Consumer Credit Card', 'Citi', 'None', 'cashback', 1.0, 0.00, 0.0, 'percent');

-- Canadian Tire Options Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('ct-options-mastercard', 'Canadian Tire Options Mastercard', 'Canadian Tire', 'CT Money', 'points', 0.1, 0.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'gas', 5.0, 'multiplier', '5 cents CT Money per litre at CT Gas' FROM cards WHERE card_key = 'ct-options-mastercard';

-- Sport Chek / Atmosphere Card
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('sportchek-triangle', 'Sport Chek Triangle Mastercard', 'Canadian Tire', 'Triangle Rewards', 'points', 0.1, 0.00, 4.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'other', 5.0, 'multiplier', '5% CT Money at Sport Chek' FROM cards WHERE card_key = 'sportchek-triangle';

-- Mark's / L'Équipeur
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('marks-triangle', 'Mark''s Triangle Mastercard', 'Canadian Tire', 'Triangle Rewards', 'points', 0.1, 0.00, 4.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'other', 5.0, 'multiplier', '5% CT Money at Mark''s' FROM cards WHERE card_key = 'marks-triangle';

-- Metro/Food Basics (Ontario)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('metro-moi', 'Metro moi Rewards Card', 'Metro', 'moi Points', 'points', 0.5, 0.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 3.0, 'multiplier', '3% moi points at Metro' FROM cards WHERE card_key = 'metro-moi';

-- Petro-Canada
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('petrocanada-superpass', 'Petro-Canada SuperPass Visa', 'RBC', 'Petro-Points', 'points', 0.5, 0.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'gas', 3.0, 'multiplier', '3x Petro-Points at Petro-Canada' FROM cards WHERE card_key = 'petrocanada-superpass';

-- Esso
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('esso-cibc', 'CIBC Aventura Esso Card', 'CIBC', 'Esso Extra', 'points', 0.5, 0.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'gas', 3.0, 'multiplier', '3x Esso Extra points at Esso' FROM cards WHERE card_key = 'esso-cibc';

-- Shell
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('shell-airmiles', 'Shell AIR MILES Mastercard', 'BMO', 'AIR MILES', 'airline_miles', 10.53, 0.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'gas', 2.0, 'multiplier', '2x AIR MILES at Shell' FROM cards WHERE card_key = 'shell-airmiles';

-- Best Buy
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('bestbuy-card', 'Best Buy Card', 'Fairstone', 'None', 'cashback', 1.0, 0.00, 0.0, 'percent');

-- Leon's / The Brick
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('leons-card', 'Leon''s Credit Card', 'Fairstone', 'None', 'cashback', 1.0, 0.00, 0.0, 'percent');

-- Staples
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('staples-card', 'Staples Business Advantage Card', 'MBNA', 'Cash Back', 'cashback', 1.0, 0.00, 2.0, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'other', 5.0, 'percent', '5% cash back at Staples' FROM cards WHERE card_key = 'staples-card';

-- ============================================================================
-- AIRLINE PARTNER CARDS
-- ============================================================================

-- WestJet RBC World Elite
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('westjet-rbc-world-elite', 'WestJet RBC World Elite Mastercard', 'RBC', 'WestJet Rewards', 'airline_miles', 1.0, 119.00, 1.5, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 2.0, 'percent', '2% WestJet dollars on WestJet purchases' FROM cards WHERE card_key = 'westjet-rbc-world-elite';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 450, 'cashback', 5000, 90, true FROM cards WHERE card_key = 'westjet-rbc-world-elite';

-- WestJet RBC Mastercard (No Fee)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('westjet-rbc', 'WestJet RBC Mastercard', 'RBC', 'WestJet Rewards', 'airline_miles', 1.0, 0.00, 1.0, 'percent');

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 250, 'cashback', 1000, 90, true FROM cards WHERE card_key = 'westjet-rbc';

-- Porter Airlines
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('bmo-viporter', 'BMO VIPorter Mastercard', 'BMO', 'VIPorter Points', 'airline_miles', 1.0, 0.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 2.0, 'multiplier', '2x VIPorter points on Porter purchases' FROM cards WHERE card_key = 'bmo-viporter';

INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('bmo-viporter-world-elite', 'BMO VIPorter World Elite Mastercard', 'BMO', 'VIPorter Points', 'airline_miles', 1.0, 150.00, 1.5, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 3.0, 'multiplier', '3x VIPorter points on Porter purchases' FROM cards WHERE card_key = 'bmo-viporter-world-elite';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 40000, 'airline_miles', 3000, 90, true FROM cards WHERE card_key = 'bmo-viporter-world-elite';

-- ============================================================================
-- HOTEL CARDS
-- ============================================================================

-- Hilton Honors Amex
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('hilton-honors-amex', 'Hilton Honors American Express Card', 'American Express', 'Hilton Honors', 'hotel_points', 0.48, 0.00, 3.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 7.0, 'multiplier', '7x points at Hilton hotels' FROM cards WHERE card_key = 'hilton-honors-amex'
UNION ALL
SELECT id, 'dining', 5.0, 'multiplier', '5x points at restaurants' FROM cards WHERE card_key = 'hilton-honors-amex'
UNION ALL
SELECT id, 'groceries', 5.0, 'multiplier', '5x points at grocery stores' FROM cards WHERE card_key = 'hilton-honors-amex';

-- IHG Rewards Premier
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('ihg-rewards-premier', 'IHG Rewards Premier Mastercard', 'MBNA', 'IHG One Rewards', 'hotel_points', 0.7, 99.00, 3.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 10.0, 'multiplier', '10x points at IHG hotels' FROM cards WHERE card_key = 'ihg-rewards-premier';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 80000, 'hotel_points', 2000, 90, true FROM cards WHERE card_key = 'ihg-rewards-premier';

-- Choice Privileges
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('choice-privileges', 'Choice Privileges Visa Card', 'Wells Fargo', 'Choice Privileges', 'hotel_points', 0.6, 0.00, 2.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 5.0, 'multiplier', '5x points at Choice Hotels' FROM cards WHERE card_key = 'choice-privileges';

-- Best Western Rewards
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('best-western-rewards', 'Best Western Rewards Mastercard', 'MBNA', 'Best Western Rewards', 'hotel_points', 0.65, 0.00, 2.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 5.0, 'multiplier', '5x points at Best Western' FROM cards WHERE card_key = 'best-western-rewards';

-- ============================================================================
-- ADDITIONAL BUSINESS CARDS
-- ============================================================================

-- RBC Business Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('rbc-business-visa', 'RBC Visa Business Card', 'RBC', 'RBC Rewards', 'points', 0.67, 35.00, 1.0, 'multiplier');

-- TD Business Travel Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('td-business-travel', 'TD Business Travel Visa Card', 'TD', 'TD Rewards', 'points', 0.5, 79.00, 2.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 4.0, 'multiplier', '4 points per $1 on business travel' FROM cards WHERE card_key = 'td-business-travel';

-- Scotiabank Passport Business
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('scotia-passport-business', 'Scotiabank Passport Visa Infinite Business Card', 'Scotiabank', 'Scotia Rewards', 'points', 1.0, 199.00, 1.5, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'travel', 3.0, 'multiplier', '3x points on travel' FROM cards WHERE card_key = 'scotia-passport-business';

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT id, 40000, 'points', 3000, 90, true FROM cards WHERE card_key = 'scotia-passport-business';

-- BMO Business AIR MILES World Elite
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('bmo-airmiles-business-we', 'BMO AIR MILES World Elite Business Mastercard', 'BMO', 'AIR MILES', 'airline_miles', 10.53, 150.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 3.0, 'multiplier', '3x AIR MILES at grocery stores' FROM cards WHERE card_key = 'bmo-airmiles-business-we'
UNION ALL
SELECT id, 'gas', 3.0, 'multiplier', '3x AIR MILES at gas stations' FROM cards WHERE card_key = 'bmo-airmiles-business-we';

-- ============================================================================
-- US DOLLAR CARDS
-- ============================================================================

-- Scotiabank US Dollar Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('scotia-usd-visa', 'Scotiabank U.S. Dollar Visa Card', 'Scotiabank', 'None', 'cashback', 1.0, 35.00, 0.0, 'percent');

-- CIBC US Dollar Aventura
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('cibc-usd-aventura', 'CIBC U.S. Dollar Aventura Gold Visa Card', 'CIBC', 'CIBC Aventura', 'points', 1.0, 79.00, 1.0, 'multiplier');

-- BMO US Dollar Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('bmo-usd-mastercard', 'BMO U.S. Dollar Mastercard', 'BMO', 'None', 'cashback', 1.0, 39.00, 0.0, 'percent');

-- TD US Dollar Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('td-usd-visa', 'TD U.S. Dollar Visa Card', 'TD', 'None', 'cashback', 1.0, 39.00, 0.0, 'percent');

-- RBC US Dollar Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('rbc-usd-visa', 'RBC U.S. Dollar Visa Gold Card', 'RBC', 'None', 'cashback', 1.0, 35.00, 0.0, 'percent');

-- ============================================================================
-- ADDITIONAL LOW INTEREST & SECURED CARDS
-- ============================================================================

-- BMO Low Rate Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('bmo-low-rate', 'BMO Preferred Rate Mastercard', 'BMO', 'None', 'cashback', 1.0, 20.00, 0.0, 'percent');

-- CIBC Low Rate Balance Transfer
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('cibc-balance-transfer', 'CIBC Select Visa Card', 'CIBC', 'None', 'cashback', 1.0, 0.00, 0.0, 'percent');

-- Scotiabank Value Visa (Low Interest)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('scotia-value-visa', 'Scotiabank Value Visa Card', 'Scotiabank', 'None', 'cashback', 1.0, 29.00, 0.0, 'percent');

-- Capital One Guaranteed Secured
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('capital-one-guaranteed', 'Capital One Guaranteed Mastercard', 'Capital One', 'Cash Back', 'cashback', 1.0, 59.00, 1.0, 'percent');

-- Fairstone Secured
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('fairstone-secured', 'Fairstone Secured Visa Card', 'Fairstone', 'None', 'cashback', 1.0, 59.00, 0.0, 'percent');

-- Plastk Secured
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('plastk-secured', 'Plastk Secured Visa Card', 'Plastk', 'Cash Back', 'cashback', 1.0, 0.00, 1.0, 'percent');

-- Thinkermax Secured
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('thinkermax-secured', 'Thinkermax Secured Visa Card', 'Thinkermax', 'None', 'cashback', 1.0, 99.00, 0.0, 'percent');

-- ============================================================================
-- STUDENT CARDS (Additional)
-- ============================================================================

-- TD Rewards Visa Card for Students
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('td-rewards-student', 'TD Rewards Visa Card for Students', 'TD', 'TD Rewards', 'points', 0.5, 0.00, 1.0, 'multiplier');

-- RBC Rewards+ Visa for Students
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('rbc-rewards-student', 'RBC Rewards+ Visa Card for Students', 'RBC', 'RBC Rewards', 'points', 0.67, 0.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 2.0, 'multiplier', '2x points at grocery stores' FROM cards WHERE card_key = 'rbc-rewards-student';

-- Scotiabank Scene+ Visa for Students
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('scotia-scene-student', 'Scotiabank Scene+ Visa Card for Students', 'Scotiabank', 'Scene+', 'points', 0.75, 0.00, 1.0, 'multiplier');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'entertainment', 5.0, 'multiplier', '5x Scene+ points at Cineplex' FROM cards WHERE card_key = 'scotia-scene-student';

-- Tangerine Student Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('tangerine-student', 'Tangerine Money-Back Credit Card', 'Tangerine', 'Cash Back', 'cashback', 1.0, 0.00, 0.5, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'groceries', 2.0, 'percent', '2% cash back in 2 categories of your choice' FROM cards WHERE card_key = 'tangerine-student';

-- ============================================================================
-- PREPAID & RELOADABLE CARDS
-- ============================================================================

-- Stack Prepaid Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('stack-prepaid', 'Stack Prepaid Mastercard', 'Stack', 'Cash Back', 'cashback', 1.0, 0.00, 1.0, 'percent');

-- Wise (TransferWise) Card
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('wise-card', 'Wise Debit Card', 'Wise', 'None', 'cashback', 1.0, 0.00, 0.0, 'percent');

-- Revolut Card
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('revolut-card', 'Revolut Card', 'Revolut', 'Cash Back', 'cashback', 1.0, 0.00, 1.0, 'percent');

-- CIBC Smart Prepaid Visa
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('cibc-smart-prepaid', 'CIBC Smart Prepaid Visa Card', 'CIBC', 'None', 'cashback', 1.0, 0.00, 0.0, 'percent');

-- ============================================================================
-- ADDITIONAL FINTECH CARDS
-- ============================================================================

-- Mogo Visa Platinum Prepaid
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('mogo-prepaid', 'Mogo Visa Platinum Prepaid Card', 'Mogo', 'Cash Back', 'cashback', 1.0, 0.00, 2.0, 'percent');

-- Float Card (Business)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('float-card', 'Float Corporate Card', 'Float Financial', 'Cash Back', 'cashback', 1.0, 0.00, 1.0, 'percent');

-- PayBright (Affirm) - not traditional card but buy now pay later
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('paybright', 'PayBright Virtual Card', 'PayBright', 'None', 'cashback', 1.0, 0.00, 0.0, 'percent');

-- ============================================================================
-- MEMBERSHIP CARDS WITH CREDIT FEATURES
-- ============================================================================

-- CAA Rewards Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('caa-rewards', 'CAA Rewards Mastercard', 'MBNA', 'CAA Dollars', 'cashback', 1.0, 0.00, 1.0, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'gas', 3.0, 'percent', '3% CAA Dollars at CAA partners' FROM cards WHERE card_key = 'caa-rewards';

-- Costco Executive Mastercard
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit)
VALUES ('costco-executive', 'CIBC Costco Executive Mastercard', 'CIBC', 'Cash Back', 'cashback', 1.0, 0.00, 1.0, 'percent');

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT id, 'gas', 4.0, 'percent', '4% cash back at Costco Gas' FROM cards WHERE card_key = 'costco-executive'
UNION ALL
SELECT id, 'dining', 3.0, 'percent', '3% cash back at restaurants' FROM cards WHERE card_key = 'costco-executive'
UNION ALL
SELECT id, 'groceries', 3.0, 'percent', '3% cash back at Costco' FROM cards WHERE card_key = 'costco-executive';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'New Cards Added: ' || COUNT(*) FROM cards WHERE card_key IN (
  'meridian-visa-infinite', 'meridian-visa-platinum', 'vancity-enviro-visa', 'vancity-visa-infinite',
  'coast-capital-visa', 'coast-capital-visa-infinite', 'servus-visa-infinite', 'servus-visa-platinum',
  'firstwest-visa-platinum', 'alterna-visa', 'duca-visa-platinum', 'conexus-visa', 'affinity-visa',
  'steinbach-visa', 'assiniboine-visa', 'atb-mastercard', 'atb-world-mastercard', 'laurentian-visa',
  'laurentian-visa-infinite', 'manulife-visa', 'eq-bank-card', 'peoples-trust-secured'
);

SELECT 'Total Cards in Database: ' || COUNT(*) FROM cards;

SELECT issuer, COUNT(*) as card_count FROM cards GROUP BY issuer ORDER BY card_count DESC LIMIT 20;
