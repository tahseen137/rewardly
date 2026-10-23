-- ============================================================================
-- Canadian Credit Card Database Expansion
-- Migration 023 - February 2026
-- Adds 25 major Canadian credit cards across all tiers and issuers
-- Sources: RateHub.ca, NerdWallet Canada, official bank websites (Feb 2026)
-- ============================================================================

-- ============================================================================
-- BMO CARDS
-- ============================================================================

-- BMO eclipse Visa Infinite Privilege (Premium tier, $399/yr)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('bmo-eclipse-visa-infinite-privilege', 'BMO eclipse Visa Infinite Privilege Card', 'BMO', 'BMO Rewards', 'points', 0.67, 399.00, 4.0, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 399.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 5.0, 'multiplier', '5x BMO Rewards points on dining'
FROM cards c WHERE c.card_key = 'bmo-eclipse-visa-infinite-privilege'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 5.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 5.0, 'multiplier', '5x BMO Rewards points on groceries'
FROM cards c WHERE c.card_key = 'bmo-eclipse-visa-infinite-privilege'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 5.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 5.0, 'multiplier', '5x BMO Rewards points on gas'
FROM cards c WHERE c.card_key = 'bmo-eclipse-visa-infinite-privilege'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 5.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 4.0, 'multiplier', '4x BMO Rewards points on travel'
FROM cards c WHERE c.card_key = 'bmo-eclipse-visa-infinite-privilege'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 4.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 60000, 'points', 6000, 90, true
FROM cards c WHERE c.card_key = 'bmo-eclipse-visa-infinite-privilege'
ON CONFLICT DO NOTHING;

-- BMO AIR MILES World Elite Mastercard ($120/yr)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('bmo-airmiles-world-elite', 'BMO AIR MILES World Elite Mastercard', 'BMO', 'AIR MILES', 'miles', 0.1, 120.00, 3.0, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 120.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 3.0, 'multiplier', '3x AIR MILES at grocery stores and drugstores'
FROM cards c WHERE c.card_key = 'bmo-airmiles-world-elite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 3.0, 'multiplier', '3x AIR MILES on gas purchases'
FROM cards c WHERE c.card_key = 'bmo-airmiles-world-elite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 3000, 'miles', 3000, 90, true
FROM cards c WHERE c.card_key = 'bmo-airmiles-world-elite'
ON CONFLICT DO NOTHING;

-- BMO Sobeys No-Fee Mastercard ($0/yr)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('bmo-sobeys-mastercard', 'BMO Sobeys No-Fee Mastercard', 'BMO', 'AIR MILES', 'miles', 0.1, 0.00, 1.0, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 0.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 2.0, 'multiplier', '2x AIR MILES at Sobeys and affiliated stores'
FROM cards c WHERE c.card_key = 'bmo-sobeys-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

-- ============================================================================
-- TD BANK CARDS
-- ============================================================================

-- TD Aeroplan Visa Platinum ($89/yr) - mid-tier Aeroplan
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('td-aeroplan-visa-platinum', 'TD Aeroplan Visa Platinum Card', 'TD Bank', 'Aeroplan', 'airline_miles', 1.5, 89.00, 1.0, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 89.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 1.5, 'multiplier', '1.5x Aeroplan points at grocery stores'
FROM cards c WHERE c.card_key = 'td-aeroplan-visa-platinum'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 1.5;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 1.5, 'multiplier', '1.5x Aeroplan points at gas stations'
FROM cards c WHERE c.card_key = 'td-aeroplan-visa-platinum'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 1.5;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 1.0, 'multiplier', '1x Aeroplan point on Air Canada purchases'
FROM cards c WHERE c.card_key = 'td-aeroplan-visa-platinum'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 1.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 10000, 'airline_miles', 1000, 90, true
FROM cards c WHERE c.card_key = 'td-aeroplan-visa-platinum'
ON CONFLICT DO NOTHING;

-- TD Emerald Flex Rate Visa (Low-interest, $25/yr)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('td-emerald-flex-rate-visa', 'TD Emerald Flex Rate Visa Card', 'TD Bank', 'None', 'cashback', 1.0, 25.00, 0.0, 'percent', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 25.00, is_active = true;

-- ============================================================================
-- RBC CARDS
-- ============================================================================

-- RBC WestJet Mastercard ($39/yr) - entry-level WestJet card
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('rbc-westjet-mastercard', 'RBC WestJet Mastercard', 'RBC', 'WestJet Rewards', 'cashback', 1.0, 39.00, 1.0, 'percent', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 39.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 1.5, 'percent', '1.5% WestJet dollars on WestJet purchases'
FROM cards c WHERE c.card_key = 'rbc-westjet-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 1.5;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 25, 'cashback', 0, 0, true
FROM cards c WHERE c.card_key = 'rbc-westjet-mastercard'
ON CONFLICT DO NOTHING;

-- RBC Avion Visa Platinum ($110/yr) - mid-tier Avion
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('rbc-avion-visa-platinum', 'RBC Avion Visa Platinum Card', 'RBC', 'RBC Rewards', 'points', 0.5, 110.00, 1.0, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 110.00, is_active = true;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 15000, 'points', 1500, 90, true
FROM cards c WHERE c.card_key = 'rbc-avion-visa-platinum'
ON CONFLICT DO NOTHING;

-- RBC Avion Visa Classic ($39/yr) - entry-level Avion
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('rbc-avion-visa-classic', 'RBC Avion Visa Classic Card', 'RBC', 'RBC Rewards', 'points', 0.5, 39.00, 1.0, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 39.00, is_active = true;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 7500, 'points', 1000, 90, true
FROM cards c WHERE c.card_key = 'rbc-avion-visa-classic'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SCOTIABANK CARDS
-- ============================================================================

-- Scotiabank Passport Visa Infinite Privilege ($599/yr) - ultra-premium
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('scotiabank-passport-visa-infinite-privilege', 'Scotiabank Passport Visa Infinite Privilege Card', 'Scotiabank', 'Scene+', 'points', 0.85, 599.00, 1.5, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 599.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 3.0, 'multiplier', '3x Scene+ points at restaurants'
FROM cards c WHERE c.card_key = 'scotiabank-passport-visa-infinite-privilege'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 3.0, 'multiplier', '3x Scene+ points at grocery stores'
FROM cards c WHERE c.card_key = 'scotiabank-passport-visa-infinite-privilege'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'entertainment', 3.0, 'multiplier', '3x Scene+ points on entertainment'
FROM cards c WHERE c.card_key = 'scotiabank-passport-visa-infinite-privilege'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 2.0, 'multiplier', '2x Scene+ points on travel'
FROM cards c WHERE c.card_key = 'scotiabank-passport-visa-infinite-privilege'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 2.0, 'multiplier', '2x Scene+ points on gas and transit'
FROM cards c WHERE c.card_key = 'scotiabank-passport-visa-infinite-privilege'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 40000, 'points', 5000, 90, true
FROM cards c WHERE c.card_key = 'scotiabank-passport-visa-infinite-privilege'
ON CONFLICT DO NOTHING;

-- Scotiabank Passport for Business Visa Infinite ($199/yr)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('scotiabank-passport-business-visa-infinite', 'Scotiabank Passport for Business Visa Infinite Card', 'Scotiabank', 'Scene+', 'points', 0.85, 199.00, 1.5, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 199.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 3.0, 'multiplier', '3x Scene+ points on travel purchases'
FROM cards c WHERE c.card_key = 'scotiabank-passport-business-visa-infinite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 3.0, 'multiplier', '3x Scene+ points on dining'
FROM cards c WHERE c.card_key = 'scotiabank-passport-business-visa-infinite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

-- ============================================================================
-- CIBC CARDS
-- ============================================================================

-- CIBC Aeroplan Visa Platinum ($89/yr) - mid-tier Aeroplan
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('cibc-aeroplan-visa-platinum', 'CIBC Aeroplan Visa Platinum Card', 'CIBC', 'Aeroplan', 'airline_miles', 1.5, 89.00, 1.0, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 89.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 1.5, 'multiplier', '1.5x Aeroplan points at grocery stores'
FROM cards c WHERE c.card_key = 'cibc-aeroplan-visa-platinum'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 1.5;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 1.5, 'multiplier', '1.5x Aeroplan points at gas stations'
FROM cards c WHERE c.card_key = 'cibc-aeroplan-visa-platinum'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 1.5;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 10000, 'airline_miles', 1000, 90, true
FROM cards c WHERE c.card_key = 'cibc-aeroplan-visa-platinum'
ON CONFLICT DO NOTHING;

-- CIBC Aventura Visa Gold ($0/yr introductory, then $120/yr)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('cibc-aventura-visa-gold', 'CIBC Aventura Visa Gold Card', 'CIBC', 'CIBC Aventura', 'points', 1.0, 0.00, 1.0, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 0.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 2.0, 'multiplier', '2x Aventura points on travel bookings'
FROM cards c WHERE c.card_key = 'cibc-aventura-visa-gold'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 1.5, 'multiplier', '1.5x Aventura points at grocery stores'
FROM cards c WHERE c.card_key = 'cibc-aventura-visa-gold'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 1.5;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 10000, 'points', 1000, 90, true
FROM cards c WHERE c.card_key = 'cibc-aventura-visa-gold'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- NATIONAL BANK CARDS
-- ============================================================================

-- National Bank Platinum Mastercard ($70.5/yr)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('national-bank-platinum-mastercard', 'National Bank Platinum Mastercard', 'National Bank', 'À la carte Rewards', 'points', 0.45, 70.50, 1.0, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 70.50, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 2.0, 'multiplier', '2x à la carte points at restaurants'
FROM cards c WHERE c.card_key = 'national-bank-platinum-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'entertainment', 2.0, 'multiplier', '2x à la carte points on entertainment'
FROM cards c WHERE c.card_key = 'national-bank-platinum-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'online_shopping', 2.0, 'multiplier', '2x à la carte points on recurring payments'
FROM cards c WHERE c.card_key = 'national-bank-platinum-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 5000, 'points', 1500, 90, true
FROM cards c WHERE c.card_key = 'national-bank-platinum-mastercard'
ON CONFLICT DO NOTHING;

-- National Bank Syncro Mastercard ($35/yr) - variable rate card
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('national-bank-syncro-low-rate', 'National Bank Syncro Mastercard', 'National Bank', 'None', 'cashback', 1.0, 35.00, 0.0, 'percent', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 35.00, is_active = true;

-- ============================================================================
-- DESJARDINS CARDS
-- ============================================================================

-- Desjardins Odyssey Visa Infinite ($130/yr)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('desjardins-odyssey-visa-infinite', 'Desjardins Odyssey Visa Infinite Card', 'Desjardins', 'Desjardins Bonusdollars', 'cashback', 1.0, 130.00, 1.5, 'percent', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 130.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 3.5, 'percent', '3.5% Bonusdollars at grocery stores'
FROM cards c WHERE c.card_key = 'desjardins-odyssey-visa-infinite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.5;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 3.5, 'percent', '3.5% Bonusdollars at restaurants'
FROM cards c WHERE c.card_key = 'desjardins-odyssey-visa-infinite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.5;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'entertainment', 2.0, 'percent', '2% Bonusdollars on entertainment'
FROM cards c WHERE c.card_key = 'desjardins-odyssey-visa-infinite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 2.0, 'percent', '2% Bonusdollars on gas and transit'
FROM cards c WHERE c.card_key = 'desjardins-odyssey-visa-infinite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 150, 'cashback', 3000, 90, true
FROM cards c WHERE c.card_key = 'desjardins-odyssey-visa-infinite'
ON CONFLICT DO NOTHING;

-- Desjardins No-Fee Cash Back Visa ($0/yr)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('desjardins-no-fee-cashback-visa', 'Desjardins No-Fee Cash Back Visa Card', 'Desjardins', 'Desjardins Bonusdollars', 'cashback', 1.0, 0.00, 0.5, 'percent', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 0.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 1.0, 'percent', '1% Bonusdollars at grocery stores'
FROM cards c WHERE c.card_key = 'desjardins-no-fee-cashback-visa'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 1.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 1.0, 'percent', '1% Bonusdollars at restaurants'
FROM cards c WHERE c.card_key = 'desjardins-no-fee-cashback-visa'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 1.0;

-- ============================================================================
-- FINTECH & DIGITAL BANK CARDS
-- ============================================================================

-- Brim World Elite Mastercard ($199/yr) - premium no-FX fintech card
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('brim-world-elite-mastercard', 'Brim World Elite Mastercard', 'Brim Financial', 'Brim Rewards', 'points', 1.0, 199.00, 2.0, 'percent', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 199.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 3.0, 'percent', '3% Brim rewards at restaurants'
FROM cards c WHERE c.card_key = 'brim-world-elite-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 2.0, 'percent', '2% Brim rewards at grocery stores'
FROM cards c WHERE c.card_key = 'brim-world-elite-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 2.0, 'percent', '2% Brim rewards on travel — no FX fees'
FROM cards c WHERE c.card_key = 'brim-world-elite-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 100, 'cashback', 2000, 90, true
FROM cards c WHERE c.card_key = 'brim-world-elite-mastercard'
ON CONFLICT DO NOTHING;

-- KOHO Mastercard Everything Plan ($0/yr) - modern fintech cashback
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('koho-mastercard-everything', 'KOHO Everything Mastercard', 'KOHO Financial', 'KOHO Cash Back', 'cashback', 1.0, 0.00, 1.0, 'percent', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 0.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 2.0, 'percent', '2% cashback at grocery stores'
FROM cards c WHERE c.card_key = 'koho-mastercard-everything'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 2.0, 'percent', '2% cashback at restaurants and food delivery'
FROM cards c WHERE c.card_key = 'koho-mastercard-everything'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 2.0, 'percent', '2% cashback on gas and transit'
FROM cards c WHERE c.card_key = 'koho-mastercard-everything'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

-- Fido Mastercard ($0/yr) - Rogers subsidiary cashback card
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('fido-mastercard', 'Fido Mastercard', 'Rogers Bank', 'Fido Cash Back', 'cashback', 1.0, 0.00, 1.0, 'percent', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 0.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 1.5, 'percent', '1.5% cashback at restaurants and grocery stores'
FROM cards c WHERE c.card_key = 'fido-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 1.5;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 1.5, 'percent', '1.5% cashback on gas'
FROM cards c WHERE c.card_key = 'fido-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 1.5;

-- ============================================================================
-- SECURED & CREDIT-BUILDER CARDS
-- ============================================================================

-- Home Trust Secured Visa ($59/yr) - standard secured card
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('home-trust-secured-visa', 'Home Trust Secured Visa Card', 'Home Trust', 'None', 'cashback', 1.0, 59.00, 0.0, 'percent', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 59.00, is_active = true;

-- Plastk Secured Visa ($48/yr) - secured card with rewards
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('plastk-secured-visa', 'Plastk Secured Visa Card', 'Plastk', 'Plastk Rewards', 'points', 0.1, 48.00, 1.0, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 48.00, is_active = true;

-- Capital One Guaranteed Secured Mastercard ($59/yr)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('capital-one-guaranteed-secured', 'Capital One Guaranteed Secured Mastercard', 'Capital One', 'None', 'cashback', 1.0, 59.00, 0.0, 'percent', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 59.00, is_active = true;

-- Capital One Aspire Cash World Elite Mastercard ($120/yr)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('capital-one-aspire-cash-world-elite', 'Capital One Aspire Cash World Elite Mastercard', 'Capital One', 'Capital One Cashback', 'cashback', 1.0, 120.00, 1.5, 'percent', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 120.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 2.0, 'percent', '2% cashback at restaurants'
FROM cards c WHERE c.card_key = 'capital-one-aspire-cash-world-elite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 2.0, 'percent', '2% cashback at grocery stores'
FROM cards c WHERE c.card_key = 'capital-one-aspire-cash-world-elite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 2.0, 'percent', '2% cashback on gas'
FROM cards c WHERE c.card_key = 'capital-one-aspire-cash-world-elite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 100, 'cashback', 500, 90, true
FROM cards c WHERE c.card_key = 'capital-one-aspire-cash-world-elite'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- RETAIL / STORE CARDS
-- ============================================================================

-- Hudson's Bay Mastercard ($0/yr) - department store
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('hudsons-bay-mastercard', 'Hudson''s Bay Mastercard', 'Duo Bank of Canada', 'Hudson''s Bay Rewards', 'points', 0.1, 0.00, 1.0, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 0.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'online_shopping', 5.0, 'multiplier', '5x HBC Rewards points at Hudson''s Bay'
FROM cards c WHERE c.card_key = 'hudsons-bay-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 5.0;

-- Canadian Tire Options Mastercard ($0/yr) - entry-level CT store card
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('canadian-tire-options-mastercard', 'Canadian Tire Options Mastercard', 'Canadian Tire Bank', 'Canadian Tire Money', 'cashback', 1.0, 0.00, 0.5, 'percent', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 0.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 3.0, 'percent', '3% Canadian Tire Money at Gas+ stations'
FROM cards c WHERE c.card_key = 'canadian-tire-options-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'online_shopping', 4.0, 'percent', '4% Canadian Tire Money at Canadian Tire stores'
FROM cards c WHERE c.card_key = 'canadian-tire-options-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 4.0;

-- ============================================================================
-- REGIONAL / ATB FINANCIAL CARDS (Alberta)
-- ============================================================================

-- ATB World Elite Mastercard ($120/yr) - Alberta Treasury Branches
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('atb-world-elite-mastercard', 'ATB World Elite Mastercard', 'ATB Financial', 'ATB Rewards', 'cashback', 1.0, 120.00, 1.25, 'percent', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 120.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 3.0, 'percent', '3% cashback at grocery stores'
FROM cards c WHERE c.card_key = 'atb-world-elite-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 3.0, 'percent', '3% cashback at restaurants'
FROM cards c WHERE c.card_key = 'atb-world-elite-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 3.0, 'percent', '3% cashback at gas stations'
FROM cards c WHERE c.card_key = 'atb-world-elite-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 2.0, 'percent', '2% cashback on travel'
FROM cards c WHERE c.card_key = 'atb-world-elite-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 200, 'cashback', 2500, 90, true
FROM cards c WHERE c.card_key = 'atb-world-elite-mastercard'
ON CONFLICT DO NOTHING;

-- ATB No-Fee Mastercard ($0/yr) - Alberta no-fee card
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('atb-no-fee-mastercard', 'ATB No-Fee Mastercard', 'ATB Financial', 'ATB Rewards', 'cashback', 1.0, 0.00, 1.0, 'percent', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 0.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 1.5, 'percent', '1.5% cashback at grocery stores'
FROM cards c WHERE c.card_key = 'atb-no-fee-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 1.5;

-- ============================================================================
-- SPECIALTY / HEALTH CARDS
-- ============================================================================

-- Manulife Vitality Visa Infinite ($139/yr) - health-lifestyle rewards
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('manulife-vitality-visa-infinite', 'Manulife Vitality Visa Infinite Card', 'Manulife Bank', 'Vitality Rewards', 'points', 0.5, 139.00, 1.0, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 139.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 3.0, 'multiplier', '3x Vitality points at grocery stores'
FROM cards c WHERE c.card_key = 'manulife-vitality-visa-infinite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'drugstores', 3.0, 'multiplier', '3x Vitality points at drugstores and health/wellness'
FROM cards c WHERE c.card_key = 'manulife-vitality-visa-infinite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 1.5, 'multiplier', '1.5x Vitality points on travel'
FROM cards c WHERE c.card_key = 'manulife-vitality-visa-infinite'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 1.5;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 20000, 'points', 2000, 90, true
FROM cards c WHERE c.card_key = 'manulife-vitality-visa-infinite'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- AMEX ADDITIONAL CARDS
-- ============================================================================

-- American Express Simply Cash Card (No-fee version already in DB)
-- American Express Aeroplan Business Card ($180/yr) 
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('amex-aeroplan-business-card', 'American Express Aeroplan Business Card', 'American Express', 'Aeroplan', 'airline_miles', 1.5, 180.00, 1.25, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 180.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 3.0, 'multiplier', '3x Aeroplan points on Air Canada and travel purchases'
FROM cards c WHERE c.card_key = 'amex-aeroplan-business-card'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 2.0, 'multiplier', '2x Aeroplan points at restaurants'
FROM cards c WHERE c.card_key = 'amex-aeroplan-business-card'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 60000, 'airline_miles', 5000, 90, true
FROM cards c WHERE c.card_key = 'amex-aeroplan-business-card'
ON CONFLICT DO NOTHING;

-- American Express Marriott Bonvoy Business Card ($150/yr)
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('amex-marriott-bonvoy-business', 'American Express Marriott Bonvoy Business Card', 'American Express', 'Marriott Bonvoy', 'points', 0.9, 150.00, 3.0, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 150.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 5.0, 'multiplier', '5x Marriott Bonvoy points at Marriott properties'
FROM cards c WHERE c.card_key = 'amex-marriott-bonvoy-business'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 5.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 3.0, 'multiplier', '3x Marriott Bonvoy points at restaurants'
FROM cards c WHERE c.card_key = 'amex-marriott-bonvoy-business'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 3.0, 'multiplier', '3x Marriott Bonvoy points on gas and grocery'
FROM cards c WHERE c.card_key = 'amex-marriott-bonvoy-business'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 60000, 'points', 3000, 90, true
FROM cards c WHERE c.card_key = 'amex-marriott-bonvoy-business'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ADDITIONAL CIBC & TD BUSINESS CARDS
-- ============================================================================

-- CIBC Business Visa Infinite Privilege ($450/yr) - premium business
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('cibc-business-visa-infinite-privilege', 'CIBC Business Visa Infinite Privilege Card', 'CIBC', 'CIBC Aventura', 'points', 1.0, 450.00, 1.5, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 450.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'travel', 3.0, 'multiplier', '3x Aventura points on travel and Air Canada'
FROM cards c WHERE c.card_key = 'cibc-business-visa-infinite-privilege'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 3.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'dining', 2.0, 'multiplier', '2x Aventura points at restaurants'
FROM cards c WHERE c.card_key = 'cibc-business-visa-infinite-privilege'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 2.0;

INSERT INTO signup_bonuses (card_id, bonus_amount, bonus_currency, spend_requirement, timeframe_days, is_active)
SELECT c.id, 30000, 'points', 3000, 90, true
FROM cards c WHERE c.card_key = 'cibc-business-visa-infinite-privilege'
ON CONFLICT DO NOTHING;

-- TD Business Select Rate Visa ($25/yr) - low-interest business card
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('td-business-select-rate-visa', 'TD Business Select Rate Visa Card', 'TD Bank', 'None', 'cashback', 1.0, 25.00, 0.0, 'percent', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 25.00, is_active = true;

-- ============================================================================
-- PC FINANCIAL PREMIUM CARD
-- ============================================================================

-- PC Financial World Elite Mastercard ($0/yr) - premium PC Optimum tier
INSERT INTO cards (card_key, name, issuer, reward_program, reward_currency, point_valuation, annual_fee, base_reward_rate, base_reward_unit, country, is_active)
VALUES ('pc-financial-world-elite-mastercard', 'PC Financial World Elite Mastercard', 'PC Financial', 'PC Optimum', 'points', 0.001, 0.00, 30.0, 'multiplier', 'CA', true)
ON CONFLICT (card_key) DO UPDATE SET annual_fee = 0.00, is_active = true;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'groceries', 45.0, 'multiplier', '45 PC Optimum points per $1 at Loblaw banner stores'
FROM cards c WHERE c.card_key = 'pc-financial-world-elite-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 45.0;

INSERT INTO category_rewards (card_id, category, multiplier, reward_unit, description)
SELECT c.id, 'gas', 30.0, 'multiplier', '30 PC Optimum points per $1 at Esso/Mobil'
FROM cards c WHERE c.card_key = 'pc-financial-world-elite-mastercard'
ON CONFLICT (card_id, category) DO UPDATE SET multiplier = 30.0;

-- ============================================================================
-- End of Migration 023
-- Total new Canadian cards added: 25
-- Grand total Canadian cards in database: 111+
-- ============================================================================
