-- ====================================================================
-- Credit Card Database Import
-- Generated: 2026-02-12T16:47:12.587803
-- Total Cards: 203
-- ====================================================================

-- Start transaction
BEGIN;

-- Clear existing data (optional)
-- TRUNCATE TABLE signup_bonuses CASCADE;
-- TRUNCATE TABLE category_rewards CASCADE;
-- TRUNCATE TABLE cards CASCADE;

-- Card 1/203: American Express Cobalt Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'american-express-cobalt-card',
  'American Express Cobalt Card',
  'American Express',
  'Membership Rewards',
  'points',
  2.1,
  155.88,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_1_id

-- Category reward: dining (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-cobalt-card'),
  'dining',
  5.0,
  'multiplier',
  '5.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-cobalt-card'),
  'groceries',
  5.0,
  'multiplier',
  '5.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: entertainment (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-cobalt-card'),
  'entertainment',
  3.0,
  'multiplier',
  '3.0x points on entertainment',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-cobalt-card'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: travel (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-cobalt-card'),
  'travel',
  2.0,
  'multiplier',
  '2.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 15000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-cobalt-card'),
  15000,
  'points',
  9000,
  360,
  true
);


-- Card 2/203: American Express Platinum Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'american-express-platinum-card',
  'American Express Platinum Card',
  'American Express',
  'Membership Rewards',
  'points',
  2.1,
  799.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_2_id

-- Category reward: travel (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-platinum-card'),
  'travel',
  2.0,
  'multiplier',
  '2.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 70000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-platinum-card'),
  70000,
  'points',
  6000,
  90,
  true
);


-- Card 3/203: American Express Gold Rewards Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'american-express-gold-rewards-card',
  'American Express Gold Rewards Card',
  'American Express',
  'Membership Rewards',
  'points',
  2.1,
  250.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_3_id

-- Category reward: travel (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-gold-rewards-card'),
  'travel',
  2.0,
  'multiplier',
  '2.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-gold-rewards-card'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-gold-rewards-card'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 40000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-gold-rewards-card'),
  40000,
  'points',
  3000,
  90,
  true
);


-- Card 4/203: American Express Green Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'american-express-green-card',
  'American Express Green Card',
  'American Express',
  'Membership Rewards',
  'points',
  2.1,
  150.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_4_id

-- Category reward: travel (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-green-card'),
  'travel',
  3.0,
  'multiplier',
  '3.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-green-card'),
  'dining',
  3.0,
  'multiplier',
  '3.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 45000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-green-card'),
  45000,
  'points',
  3000,
  90,
  true
);


-- Card 5/203: SimplyCash Preferred Card from American Express
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'simplycash-preferred-card-from-american-express',
  'SimplyCash Preferred Card from American Express',
  'American Express',
  'Cashback',
  'cashback',
  1.0,
  99.0,
  1.25,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_5_id

-- Category reward: gas (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'simplycash-preferred-card-from-american-express'),
  'gas',
  4.0,
  'multiplier',
  '4.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'simplycash-preferred-card-from-american-express'),
  'groceries',
  4.0,
  'multiplier',
  '4.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'simplycash-preferred-card-from-american-express'),
  'dining',
  4.0,
  'multiplier',
  '4.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 400 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'simplycash-preferred-card-from-american-express'),
  400,
  'cashback',
  3000,
  90,
  true
);


-- Card 6/203: SimplyCash Card from American Express
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'simplycash-card-from-american-express',
  'SimplyCash Card from American Express',
  'American Express',
  'Cashback',
  'cashback',
  1.0,
  0.0,
  1.25,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_6_id

-- Signup bonus: 200 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'simplycash-card-from-american-express'),
  200,
  'cashback',
  2000,
  90,
  true
);


-- Card 7/203: American Express Aeroplan Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'american-express-aeroplan-card',
  'American Express Aeroplan Card',
  'American Express',
  'Aeroplan',
  'airline_miles',
  2.0,
  120.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_7_id

-- Category reward: travel (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-aeroplan-card'),
  'travel',
  1.5,
  'multiplier',
  '1.5x points on travel',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 25000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-aeroplan-card'),
  25000,
  'airline_miles',
  3000,
  90,
  true
);


-- Card 8/203: American Express Aeroplan Reserve Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'american-express-aeroplan-reserve-card',
  'American Express Aeroplan Reserve Card',
  'American Express',
  'Aeroplan',
  'airline_miles',
  2.0,
  599.0,
  1.25,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_8_id

-- Category reward: travel (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-aeroplan-reserve-card'),
  'travel',
  3.0,
  'multiplier',
  '3.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-aeroplan-reserve-card'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 80000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-aeroplan-reserve-card'),
  80000,
  'airline_miles',
  6000,
  90,
  true
);


-- Card 9/203: Marriott Bonvoy American Express Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'marriott-bonvoy-american-express-card',
  'Marriott Bonvoy American Express Card',
  'American Express',
  'Marriott Bonvoy',
  'hotel_points',
  0.74,
  120.0,
  2.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_9_id

-- Category reward: travel (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'marriott-bonvoy-american-express-card'),
  'travel',
  5.0,
  'multiplier',
  '5.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 50000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'marriott-bonvoy-american-express-card'),
  50000,
  'hotel_points',
  3000,
  90,
  true
);


-- Card 10/203: TD Aeroplan Visa Infinite Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'td-aeroplan-visa-infinite-card',
  'TD Aeroplan Visa Infinite Card',
  'TD Bank',
  'Aeroplan',
  'airline_miles',
  2.0,
  139.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_10_id

-- Category reward: travel (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-aeroplan-visa-infinite-card'),
  'travel',
  1.5,
  'multiplier',
  '1.5x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-aeroplan-visa-infinite-card'),
  'groceries',
  1.5,
  'multiplier',
  '1.5x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-aeroplan-visa-infinite-card'),
  'gas',
  1.5,
  'multiplier',
  '1.5x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-aeroplan-visa-infinite-card'),
  'dining',
  1.5,
  'multiplier',
  '1.5x points on dining',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 40000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-aeroplan-visa-infinite-card'),
  40000,
  'airline_miles',
  3000,
  90,
  true
);


-- Card 11/203: TD Aeroplan Visa Infinite Privilege Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'td-aeroplan-visa-infinite-privilege-card',
  'TD Aeroplan Visa Infinite Privilege Card',
  'TD Bank',
  'Aeroplan',
  'airline_miles',
  2.0,
  599.0,
  1.25,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_11_id

-- Category reward: travel (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-aeroplan-visa-infinite-privilege-card'),
  'travel',
  2.0,
  'multiplier',
  '2.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-aeroplan-visa-infinite-privilege-card'),
  'groceries',
  1.5,
  'multiplier',
  '1.5x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-aeroplan-visa-infinite-privilege-card'),
  'gas',
  1.5,
  'multiplier',
  '1.5x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-aeroplan-visa-infinite-privilege-card'),
  'dining',
  1.5,
  'multiplier',
  '1.5x points on dining',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 100000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-aeroplan-visa-infinite-privilege-card'),
  100000,
  'airline_miles',
  10000,
  180,
  true
);


-- Card 12/203: TD First Class Travel Visa Infinite Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'td-first-class-travel-visa-infinite-card',
  'TD First Class Travel Visa Infinite Card',
  'TD Bank',
  'TD Rewards',
  'points',
  0.5,
  139.0,
  1.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_12_id

-- Category reward: travel (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-first-class-travel-visa-infinite-card'),
  'travel',
  3.0,
  'multiplier',
  '3.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-first-class-travel-visa-infinite-card'),
  'groceries',
  1.5,
  'multiplier',
  '1.5x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-first-class-travel-visa-infinite-card'),
  'gas',
  1.5,
  'multiplier',
  '1.5x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-first-class-travel-visa-infinite-card'),
  'dining',
  1.5,
  'multiplier',
  '1.5x points on dining',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 165000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-first-class-travel-visa-infinite-card'),
  165000,
  'points',
  7500,
  180,
  true
);


-- Card 13/203: TD Cash Back Visa Infinite Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'td-cash-back-visa-infinite-card',
  'TD Cash Back Visa Infinite Card',
  'TD Bank',
  'Cashback',
  'cashback',
  1.0,
  139.0,
  0.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_13_id

-- Category reward: groceries (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-cash-back-visa-infinite-card'),
  'groceries',
  3.0,
  'multiplier',
  '3.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-cash-back-visa-infinite-card'),
  'gas',
  3.0,
  'multiplier',
  '3.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: recurring_bills (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-cash-back-visa-infinite-card'),
  'recurring_bills',
  3.0,
  'multiplier',
  '3.0x points on recurring_bills',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 350 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-cash-back-visa-infinite-card'),
  350,
  'cashback',
  3500,
  90,
  true
);


-- Card 14/203: TD Rewards Visa Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'td-rewards-visa-card',
  'TD Rewards Visa Card',
  'TD Bank',
  'TD Rewards',
  'points',
  0.5,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_14_id


-- Card 15/203: RBC Avion Visa Infinite Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'rbc-avion-visa-infinite-card',
  'RBC Avion Visa Infinite Card',
  'RBC',
  'Avion',
  'points',
  2.1,
  139.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_15_id

-- Category reward: travel (1.25x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-avion-visa-infinite-card'),
  'travel',
  1.25,
  'multiplier',
  '1.25x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (1.25x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-avion-visa-infinite-card'),
  'groceries',
  1.25,
  'multiplier',
  '1.25x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (1.25x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-avion-visa-infinite-card'),
  'gas',
  1.25,
  'multiplier',
  '1.25x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (1.25x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-avion-visa-infinite-card'),
  'dining',
  1.25,
  'multiplier',
  '1.25x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: drugstores (1.25x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-avion-visa-infinite-card'),
  'drugstores',
  1.25,
  'multiplier',
  '1.25x points on drugstores',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 35000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-avion-visa-infinite-card'),
  35000,
  'points',
  5000,
  180,
  true
);


-- Card 16/203: RBC Avion Visa Infinite Privilege Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'rbc-avion-visa-infinite-privilege-card',
  'RBC Avion Visa Infinite Privilege Card',
  'RBC',
  'Avion',
  'points',
  2.1,
  399.0,
  1.25,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_16_id

-- Category reward: travel (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-avion-visa-infinite-privilege-card'),
  'travel',
  1.5,
  'multiplier',
  '1.5x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-avion-visa-infinite-privilege-card'),
  'groceries',
  1.5,
  'multiplier',
  '1.5x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-avion-visa-infinite-privilege-card'),
  'gas',
  1.5,
  'multiplier',
  '1.5x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-avion-visa-infinite-privilege-card'),
  'dining',
  1.5,
  'multiplier',
  '1.5x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: drugstores (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-avion-visa-infinite-privilege-card'),
  'drugstores',
  1.5,
  'multiplier',
  '1.5x points on drugstores',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 55000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-avion-visa-infinite-privilege-card'),
  55000,
  'points',
  7000,
  180,
  true
);


-- Card 17/203: RBC WestJet World Elite Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'rbc-westjet-world-elite-mastercard',
  'RBC WestJet World Elite Mastercard',
  'RBC',
  'WestJet Rewards',
  'points',
  1.0,
  119.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_17_id

-- Category reward: westjet (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-westjet-world-elite-mastercard'),
  'westjet',
  2.0,
  'multiplier',
  '2.0x points on westjet',
  false,
  NOW(),
  NOW()
);

-- Category reward: travel (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-westjet-world-elite-mastercard'),
  'travel',
  1.5,
  'multiplier',
  '1.5x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-westjet-world-elite-mastercard'),
  'dining',
  1.5,
  'multiplier',
  '1.5x points on dining',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 450 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-westjet-world-elite-mastercard'),
  450,
  'points',
  5000,
  90,
  true
);


-- Card 18/203: RBC Cash Back Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'rbc-cash-back-mastercard',
  'RBC Cash Back Mastercard',
  'RBC',
  'Cashback',
  'cashback',
  1.0,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_18_id

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-cash-back-mastercard'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);


-- Card 19/203: RBC ION+ Visa
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'rbc-ion+-visa',
  'RBC ION+ Visa',
  'RBC',
  'Avion',
  'points',
  2.1,
  48.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_19_id

-- Category reward: gas (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-ion+-visa'),
  'gas',
  3.0,
  'multiplier',
  '3.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-ion+-visa'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: subscriptions (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-ion+-visa'),
  'subscriptions',
  2.0,
  'multiplier',
  '2.0x points on subscriptions',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 10000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-ion+-visa'),
  10000,
  'points',
  1000,
  90,
  true
);


-- Card 20/203: CIBC Aeroplan Visa Infinite Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'cibc-aeroplan-visa-infinite-card',
  'CIBC Aeroplan Visa Infinite Card',
  'CIBC',
  'Aeroplan',
  'airline_miles',
  2.0,
  139.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_20_id

-- Category reward: travel (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-aeroplan-visa-infinite-card'),
  'travel',
  1.5,
  'multiplier',
  '1.5x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-aeroplan-visa-infinite-card'),
  'groceries',
  1.5,
  'multiplier',
  '1.5x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-aeroplan-visa-infinite-card'),
  'gas',
  1.5,
  'multiplier',
  '1.5x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-aeroplan-visa-infinite-card'),
  'dining',
  1.5,
  'multiplier',
  '1.5x points on dining',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 45000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-aeroplan-visa-infinite-card'),
  45000,
  'airline_miles',
  3000,
  120,
  true
);


-- Card 21/203: CIBC Aeroplan Visa Infinite Privilege Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'cibc-aeroplan-visa-infinite-privilege-card',
  'CIBC Aeroplan Visa Infinite Privilege Card',
  'CIBC',
  'Aeroplan',
  'airline_miles',
  2.0,
  599.0,
  1.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_21_id

-- Category reward: travel (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-aeroplan-visa-infinite-privilege-card'),
  'travel',
  2.0,
  'multiplier',
  '2.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-aeroplan-visa-infinite-privilege-card'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-aeroplan-visa-infinite-privilege-card'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-aeroplan-visa-infinite-privilege-card'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 120000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-aeroplan-visa-infinite-privilege-card'),
  120000,
  'airline_miles',
  12000,
  360,
  true
);


-- Card 22/203: CIBC Aventura Visa Infinite Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'cibc-aventura-visa-infinite-card',
  'CIBC Aventura Visa Infinite Card',
  'CIBC',
  'CIBC Aventura',
  'points',
  1.0,
  139.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_22_id

-- Category reward: travel (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-aventura-visa-infinite-card'),
  'travel',
  1.5,
  'multiplier',
  '1.5x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-aventura-visa-infinite-card'),
  'gas',
  1.5,
  'multiplier',
  '1.5x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-aventura-visa-infinite-card'),
  'groceries',
  1.5,
  'multiplier',
  '1.5x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-aventura-visa-infinite-card'),
  'dining',
  1.5,
  'multiplier',
  '1.5x points on dining',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 35000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-aventura-visa-infinite-card'),
  35000,
  'points',
  3000,
  120,
  true
);


-- Card 23/203: CIBC Aventura Visa Infinite Privilege Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'cibc-aventura-visa-infinite-privilege-card',
  'CIBC Aventura Visa Infinite Privilege Card',
  'CIBC',
  'CIBC Aventura',
  'points',
  1.0,
  499.0,
  1.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_23_id

-- Category reward: travel (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-aventura-visa-infinite-privilege-card'),
  'travel',
  2.0,
  'multiplier',
  '2.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-aventura-visa-infinite-privilege-card'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-aventura-visa-infinite-privilege-card'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-aventura-visa-infinite-privilege-card'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 80000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-aventura-visa-infinite-privilege-card'),
  80000,
  'points',
  10000,
  360,
  true
);


-- Card 24/203: CIBC Dividend Visa Infinite Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'cibc-dividend-visa-infinite-card',
  'CIBC Dividend Visa Infinite Card',
  'CIBC',
  'Cashback',
  'cashback',
  1.0,
  139.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_24_id

-- Category reward: groceries (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-dividend-visa-infinite-card'),
  'groceries',
  4.0,
  'multiplier',
  '4.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-dividend-visa-infinite-card'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-dividend-visa-infinite-card'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 10 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-dividend-visa-infinite-card'),
  10,
  'cashback',
  3000,
  120,
  true
);


-- Card 25/203: CIBC Select Visa Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'cibc-select-visa-card',
  'CIBC Select Visa Card',
  'CIBC',
  'CIBC Aventura',
  'points',
  1.0,
  29.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_25_id


-- Card 26/203: BMO Eclipse Visa Infinite Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'bmo-eclipse-visa-infinite-card',
  'BMO Eclipse Visa Infinite Card',
  'BMO',
  'BMO Rewards',
  'points',
  0.67,
  120.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_26_id

-- Category reward: gas (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bmo-eclipse-visa-infinite-card'),
  'gas',
  5.0,
  'multiplier',
  '5.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bmo-eclipse-visa-infinite-card'),
  'groceries',
  5.0,
  'multiplier',
  '5.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bmo-eclipse-visa-infinite-card'),
  'dining',
  5.0,
  'multiplier',
  '5.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: transit (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bmo-eclipse-visa-infinite-card'),
  'transit',
  5.0,
  'multiplier',
  '5.0x points on transit',
  false,
  NOW(),
  NOW()
);

-- Category reward: recurring_bills (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bmo-eclipse-visa-infinite-card'),
  'recurring_bills',
  2.0,
  'multiplier',
  '2.0x points on recurring_bills',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 50000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bmo-eclipse-visa-infinite-card'),
  50000,
  'points',
  3000,
  90,
  true
);


-- Card 27/203: BMO Ascend World Elite Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'bmo-ascend-world-elite-mastercard',
  'BMO Ascend World Elite Mastercard',
  'BMO',
  'BMO Rewards',
  'points',
  0.67,
  150.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_27_id

-- Category reward: travel (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bmo-ascend-world-elite-mastercard'),
  'travel',
  5.0,
  'multiplier',
  '5.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bmo-ascend-world-elite-mastercard'),
  'dining',
  5.0,
  'multiplier',
  '5.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: entertainment (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bmo-ascend-world-elite-mastercard'),
  'entertainment',
  5.0,
  'multiplier',
  '5.0x points on entertainment',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 60000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bmo-ascend-world-elite-mastercard'),
  60000,
  'points',
  5000,
  90,
  true
);


-- Card 28/203: BMO CashBack World Elite Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'bmo-cashback-world-elite-mastercard',
  'BMO CashBack World Elite Mastercard',
  'BMO',
  'Cashback',
  'cashback',
  1.0,
  120.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_28_id

-- Category reward: groceries (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bmo-cashback-world-elite-mastercard'),
  'groceries',
  5.0,
  'multiplier',
  '5.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bmo-cashback-world-elite-mastercard'),
  'gas',
  5.0,
  'multiplier',
  '5.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bmo-cashback-world-elite-mastercard'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: recurring_bills (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bmo-cashback-world-elite-mastercard'),
  'recurring_bills',
  2.0,
  'multiplier',
  '2.0x points on recurring_bills',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 400 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bmo-cashback-world-elite-mastercard'),
  400,
  'cashback',
  3000,
  90,
  true
);


-- Card 29/203: BMO Rewards Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'bmo-rewards-mastercard',
  'BMO Rewards Mastercard',
  'BMO',
  'BMO Rewards',
  'points',
  0.67,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_29_id


-- Card 30/203: Scotiabank Passport Visa Infinite Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'scotiabank-passport-visa-infinite-card',
  'Scotiabank Passport Visa Infinite Card',
  'Scotiabank',
  'Scene+',
  'points',
  1.0,
  139.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_30_id

-- Category reward: travel (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'scotiabank-passport-visa-infinite-card'),
  'travel',
  5.0,
  'multiplier',
  '5.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'scotiabank-passport-visa-infinite-card'),
  'dining',
  5.0,
  'multiplier',
  '5.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: entertainment (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'scotiabank-passport-visa-infinite-card'),
  'entertainment',
  3.0,
  'multiplier',
  '3.0x points on entertainment',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'scotiabank-passport-visa-infinite-card'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: transit (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'scotiabank-passport-visa-infinite-card'),
  'transit',
  2.0,
  'multiplier',
  '2.0x points on transit',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 60000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'scotiabank-passport-visa-infinite-card'),
  60000,
  'points',
  5000,
  120,
  true
);


-- Card 31/203: Scotiabank Gold American Express Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'scotiabank-gold-american-express-card',
  'Scotiabank Gold American Express Card',
  'Scotiabank',
  'Scene+',
  'points',
  1.0,
  120.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_31_id

-- Category reward: groceries (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'scotiabank-gold-american-express-card'),
  'groceries',
  5.0,
  'multiplier',
  '5.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'scotiabank-gold-american-express-card'),
  'dining',
  5.0,
  'multiplier',
  '5.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: entertainment (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'scotiabank-gold-american-express-card'),
  'entertainment',
  3.0,
  'multiplier',
  '3.0x points on entertainment',
  false,
  NOW(),
  NOW()
);

-- Category reward: recurring_bills (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'scotiabank-gold-american-express-card'),
  'recurring_bills',
  2.0,
  'multiplier',
  '2.0x points on recurring_bills',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 50000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'scotiabank-gold-american-express-card'),
  50000,
  'points',
  1000,
  90,
  true
);


-- Card 32/203: Scotiabank Scene+ Visa Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'scotiabank-scene+-visa-card',
  'Scotiabank Scene+ Visa Card',
  'Scotiabank',
  'Scene+',
  'points',
  1.0,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_32_id

-- Category reward: cineplex (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'scotiabank-scene+-visa-card'),
  'cineplex',
  5.0,
  'multiplier',
  '5.0x points on cineplex',
  false,
  NOW(),
  NOW()
);

-- Category reward: sobeys (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'scotiabank-scene+-visa-card'),
  'sobeys',
  2.0,
  'multiplier',
  '2.0x points on sobeys',
  false,
  NOW(),
  NOW()
);

-- Category reward: empire (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'scotiabank-scene+-visa-card'),
  'empire',
  2.0,
  'multiplier',
  '2.0x points on empire',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 10000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'scotiabank-scene+-visa-card'),
  10000,
  'points',
  1000,
  90,
  true
);


-- Card 33/203: Scotiabank Momentum Visa Infinite Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'scotiabank-momentum-visa-infinite-card',
  'Scotiabank Momentum Visa Infinite Card',
  'Scotiabank',
  'Cashback',
  'cashback',
  1.0,
  120.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_33_id

-- Category reward: groceries (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'scotiabank-momentum-visa-infinite-card'),
  'groceries',
  4.0,
  'multiplier',
  '4.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'scotiabank-momentum-visa-infinite-card'),
  'gas',
  4.0,
  'multiplier',
  '4.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: recurring_bills (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'scotiabank-momentum-visa-infinite-card'),
  'recurring_bills',
  2.0,
  'multiplier',
  '2.0x points on recurring_bills',
  false,
  NOW(),
  NOW()
);

-- Category reward: drugstores (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'scotiabank-momentum-visa-infinite-card'),
  'drugstores',
  2.0,
  'multiplier',
  '2.0x points on drugstores',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 100 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'scotiabank-momentum-visa-infinite-card'),
  100,
  'cashback',
  2000,
  90,
  true
);


-- Card 34/203: Tangerine Money-Back Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'tangerine-money-back-credit-card',
  'Tangerine Money-Back Credit Card',
  'Tangerine Bank',
  'Cashback',
  'cashback',
  1.0,
  0.0,
  0.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_34_id

-- Category reward: selected_categories (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'tangerine-money-back-credit-card'),
  'selected_categories',
  2.0,
  'multiplier',
  '2.0x points on selected_categories',
  false,
  NOW(),
  NOW()
);


-- Card 35/203: Tangerine World Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'tangerine-world-mastercard',
  'Tangerine World Mastercard',
  'Tangerine Bank',
  'Cashback',
  'cashback',
  1.0,
  0.0,
  0.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_35_id

-- Category reward: selected_categories (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'tangerine-world-mastercard'),
  'selected_categories',
  2.0,
  'multiplier',
  '2.0x points on selected_categories',
  false,
  NOW(),
  NOW()
);


-- Card 36/203: Simplii Financial Cash Back Visa Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'simplii-financial-cash-back-visa-card',
  'Simplii Financial Cash Back Visa Card',
  'Simplii Financial',
  'Cashback',
  'cashback',
  1.0,
  0.0,
  0.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_36_id

-- Category reward: restaurants (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'simplii-financial-cash-back-visa-card'),
  'restaurants',
  4.0,
  'multiplier',
  '4.0x points on restaurants',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'simplii-financial-cash-back-visa-card'),
  'gas',
  4.0,
  'multiplier',
  '4.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: drugstores (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'simplii-financial-cash-back-visa-card'),
  'drugstores',
  1.5,
  'multiplier',
  '1.5x points on drugstores',
  false,
  NOW(),
  NOW()
);


-- Card 37/203: PC Financial Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'pc-financial-mastercard',
  'PC Financial Mastercard',
  'PC Financial',
  'PC Optimum',
  'points',
  1.0,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_37_id

-- Category reward: shoppers_drug_mart (25.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'pc-financial-mastercard'),
  'shoppers_drug_mart',
  25.0,
  'multiplier',
  '25.0x points on shoppers_drug_mart',
  false,
  NOW(),
  NOW()
);

-- Category reward: esso (20.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'pc-financial-mastercard'),
  'esso',
  20.0,
  'multiplier',
  '20.0x points on esso',
  false,
  NOW(),
  NOW()
);

-- Category reward: loblaws (10.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'pc-financial-mastercard'),
  'loblaws',
  10.0,
  'multiplier',
  '10.0x points on loblaws',
  false,
  NOW(),
  NOW()
);


-- Card 38/203: PC Financial World Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'pc-financial-world-mastercard',
  'PC Financial World Mastercard',
  'PC Financial',
  'PC Optimum',
  'points',
  1.0,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_38_id

-- Category reward: shoppers_drug_mart (30.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'pc-financial-world-mastercard'),
  'shoppers_drug_mart',
  30.0,
  'multiplier',
  '30.0x points on shoppers_drug_mart',
  false,
  NOW(),
  NOW()
);

-- Category reward: esso (25.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'pc-financial-world-mastercard'),
  'esso',
  25.0,
  'multiplier',
  '25.0x points on esso',
  false,
  NOW(),
  NOW()
);

-- Category reward: loblaws (20.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'pc-financial-world-mastercard'),
  'loblaws',
  20.0,
  'multiplier',
  '20.0x points on loblaws',
  false,
  NOW(),
  NOW()
);


-- Card 39/203: Triangle Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'triangle-mastercard',
  'Triangle Mastercard',
  'Canadian Tire Bank',
  'Canadian Tire Money',
  'points',
  1.0,
  0.0,
  0.4,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_39_id

-- Category reward: canadian_tire (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'triangle-mastercard'),
  'canadian_tire',
  5.0,
  'multiplier',
  '5.0x points on canadian_tire',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'triangle-mastercard'),
  'gas',
  3.0,
  'multiplier',
  '3.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'triangle-mastercard'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);


-- Card 40/203: Triangle World Elite Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'triangle-world-elite-mastercard',
  'Triangle World Elite Mastercard',
  'Canadian Tire Bank',
  'Canadian Tire Money',
  'points',
  1.0,
  120.0,
  0.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_40_id

-- Category reward: canadian_tire (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'triangle-world-elite-mastercard'),
  'canadian_tire',
  5.0,
  'multiplier',
  '5.0x points on canadian_tire',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'triangle-world-elite-mastercard'),
  'gas',
  5.0,
  'multiplier',
  '5.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'triangle-world-elite-mastercard'),
  'groceries',
  3.0,
  'multiplier',
  '3.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: recurring_bills (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'triangle-world-elite-mastercard'),
  'recurring_bills',
  2.0,
  'multiplier',
  '2.0x points on recurring_bills',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 100 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'triangle-world-elite-mastercard'),
  100,
  'points',
  5000,
  180,
  true
);


-- Card 41/203: MBNA Rewards Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'mbna-rewards-mastercard',
  'MBNA Rewards Mastercard',
  'MBNA',
  'MBNA Rewards',
  'points',
  0.5,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_41_id


-- Card 42/203: MBNA True Line Gold Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'mbna-true-line-gold-mastercard',
  'MBNA True Line Gold Mastercard',
  'MBNA',
  'Cashback',
  'cashback',
  1.0,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_42_id


-- Card 43/203: Desjardins Cash Back World Elite Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'desjardins-cash-back-world-elite-mastercard',
  'Desjardins Cash Back World Elite Mastercard',
  'Desjardins',
  'Cashback',
  'cashback',
  1.0,
  120.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_43_id

-- Category reward: groceries (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'desjardins-cash-back-world-elite-mastercard'),
  'groceries',
  4.0,
  'multiplier',
  '4.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'desjardins-cash-back-world-elite-mastercard'),
  'gas',
  4.0,
  'multiplier',
  '4.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'desjardins-cash-back-world-elite-mastercard'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);


-- Card 44/203: Neo World Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'neo-world-mastercard',
  'Neo World Mastercard',
  'Neo Financial',
  'Cashback',
  'cashback',
  1.0,
  0.0,
  0.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_44_id

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'neo-world-mastercard'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'neo-world-mastercard'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: recurring_payments (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'neo-world-mastercard'),
  'recurring_payments',
  2.0,
  'multiplier',
  '2.0x points on recurring_payments',
  false,
  NOW(),
  NOW()
);


-- Card 45/203: Neo Credit Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'neo-credit-mastercard',
  'Neo Credit Mastercard',
  'Neo Financial',
  'Cashback',
  'cashback',
  1.0,
  0.0,
  0.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_45_id


-- Card 46/203: National Bank World Elite Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'national-bank-world-elite-mastercard',
  'National Bank World Elite Mastercard',
  'National Bank',
  'NBC Rewards',
  'points',
  0.5,
  150.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_46_id

-- Category reward: travel (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'national-bank-world-elite-mastercard'),
  'travel',
  2.0,
  'multiplier',
  '2.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'national-bank-world-elite-mastercard'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'national-bank-world-elite-mastercard'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'national-bank-world-elite-mastercard'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 40000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'national-bank-world-elite-mastercard'),
  40000,
  'points',
  3000,
  90,
  true
);


-- Card 47/203: National Bank Syncro Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'national-bank-syncro-mastercard',
  'National Bank Syncro Mastercard',
  'National Bank',
  'NBC Rewards',
  'points',
  0.5,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_47_id


-- Card 48/203: Laurentian Bank Visa Gold
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'laurentian-bank-visa-gold',
  'Laurentian Bank Visa Gold',
  'Laurentian Bank',
  'Cashback',
  'cashback',
  1.0,
  75.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_48_id

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'laurentian-bank-visa-gold'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'laurentian-bank-visa-gold'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);


-- Card 49/203: Rogers World Elite Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'rogers-world-elite-mastercard',
  'Rogers World Elite Mastercard',
  'Rogers Bank',
  'Cashback',
  'cashback',
  1.0,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_49_id

-- Category reward: rogers_services (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rogers-world-elite-mastercard'),
  'rogers_services',
  4.0,
  'multiplier',
  '4.0x points on rogers_services',
  false,
  NOW(),
  NOW()
);

-- Category reward: foreign_currency (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rogers-world-elite-mastercard'),
  'foreign_currency',
  3.0,
  'multiplier',
  '3.0x points on foreign_currency',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rogers-world-elite-mastercard'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rogers-world-elite-mastercard'),
  'groceries',
  1.5,
  'multiplier',
  '1.5x points on groceries',
  false,
  NOW(),
  NOW()
);


-- Card 50/203: Rogers Red World Elite Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'rogers-red-world-elite-mastercard',
  'Rogers Red World Elite Mastercard',
  'Rogers Bank',
  'Cashback',
  'cashback',
  1.0,
  0.0,
  1.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_50_id


-- Card 51/203: HSBC World Elite Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'hsbc-world-elite-mastercard',
  'HSBC World Elite Mastercard',
  'HSBC Canada',
  'HSBC Rewards',
  'points',
  0.6,
  149.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_51_id

-- Category reward: travel (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'hsbc-world-elite-mastercard'),
  'travel',
  3.0,
  'multiplier',
  '3.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'hsbc-world-elite-mastercard'),
  'dining',
  3.0,
  'multiplier',
  '3.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'hsbc-world-elite-mastercard'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'hsbc-world-elite-mastercard'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 30000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'hsbc-world-elite-mastercard'),
  30000,
  'points',
  3000,
  90,
  true
);


-- Card 52/203: Home Trust Preferred Visa
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'home-trust-preferred-visa',
  'Home Trust Preferred Visa',
  'Home Trust',
  'Cashback',
  'cashback',
  1.0,
  79.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_52_id

-- Category reward: gas (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'home-trust-preferred-visa'),
  'gas',
  1.5,
  'multiplier',
  '1.5x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'home-trust-preferred-visa'),
  'groceries',
  1.5,
  'multiplier',
  '1.5x points on groceries',
  false,
  NOW(),
  NOW()
);


-- Card 53/203: CIBC Dividend Platinum Visa Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'cibc-dividend-platinum-visa-card',
  'CIBC Dividend Platinum Visa Card',
  'CIBC',
  'Cashback',
  'cashback',
  1.0,
  29.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_53_id

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-dividend-platinum-visa-card'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-dividend-platinum-visa-card'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);


-- Card 54/203: CIBC Costco Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'cibc-costco-mastercard',
  'CIBC Costco Mastercard',
  'CIBC',
  'Cashback',
  'cashback',
  1.0,
  0.0,
  0.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_54_id

-- Category reward: costco_gas (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-costco-mastercard'),
  'costco_gas',
  3.0,
  'multiplier',
  '3.0x points on costco_gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: restaurants (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-costco-mastercard'),
  'restaurants',
  2.0,
  'multiplier',
  '2.0x points on restaurants',
  false,
  NOW(),
  NOW()
);

-- Category reward: travel (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-costco-mastercard'),
  'travel',
  2.0,
  'multiplier',
  '2.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: costco (1.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-costco-mastercard'),
  'costco',
  1.0,
  'multiplier',
  '1.0x points on costco',
  false,
  NOW(),
  NOW()
);


-- Card 55/203: TD Platinum Travel Visa Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'td-platinum-travel-visa-card',
  'TD Platinum Travel Visa Card',
  'TD Bank',
  'TD Rewards',
  'points',
  0.5,
  89.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_55_id

-- Category reward: travel (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-platinum-travel-visa-card'),
  'travel',
  1.5,
  'multiplier',
  '1.5x points on travel',
  false,
  NOW(),
  NOW()
);


-- Card 56/203: TD Business Travel Visa Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'td-business-travel-visa-card',
  'TD Business Travel Visa Card',
  'TD Bank',
  'TD Rewards',
  'points',
  0.5,
  149.0,
  1.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_56_id

-- Category reward: travel (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-business-travel-visa-card'),
  'travel',
  3.0,
  'multiplier',
  '3.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-business-travel-visa-card'),
  'gas',
  1.5,
  'multiplier',
  '1.5x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-business-travel-visa-card'),
  'dining',
  1.5,
  'multiplier',
  '1.5x points on dining',
  false,
  NOW(),
  NOW()
);


-- Card 57/203: TD Business Cash Back Visa Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'td-business-cash-back-visa-card',
  'TD Business Cash Back Visa Card',
  'TD Bank',
  'Cashback',
  'cashback',
  1.0,
  125.0,
  0.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_57_id

-- Category reward: gas (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-business-cash-back-visa-card'),
  'gas',
  3.0,
  'multiplier',
  '3.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: office_supplies (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-business-cash-back-visa-card'),
  'office_supplies',
  2.0,
  'multiplier',
  '2.0x points on office_supplies',
  false,
  NOW(),
  NOW()
);

-- Category reward: advertising (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-business-cash-back-visa-card'),
  'advertising',
  2.0,
  'multiplier',
  '2.0x points on advertising',
  false,
  NOW(),
  NOW()
);


-- Card 58/203: RBC Cash Back Preferred World Elite Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'rbc-cash-back-preferred-world-elite-mastercard',
  'RBC Cash Back Preferred World Elite Mastercard',
  'RBC',
  'Cashback',
  'cashback',
  1.0,
  120.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_58_id

-- Category reward: groceries (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-cash-back-preferred-world-elite-mastercard'),
  'groceries',
  3.0,
  'multiplier',
  '3.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-cash-back-preferred-world-elite-mastercard'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);


-- Card 59/203: RBC ION Visa
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'rbc-ion-visa',
  'RBC ION Visa',
  'RBC',
  'Cashback',
  'cashback',
  1.0,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_59_id


-- Card 60/203: RBC Rewards+ Visa
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'rbc-rewards+-visa',
  'RBC Rewards+ Visa',
  'RBC',
  'Avion',
  'points',
  2.1,
  39.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_60_id


-- Card 61/203: BMO CashBack Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'bmo-cashback-mastercard',
  'BMO CashBack Mastercard',
  'BMO',
  'Cashback',
  'cashback',
  1.0,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_61_id

-- Category reward: groceries (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bmo-cashback-mastercard'),
  'groceries',
  3.0,
  'multiplier',
  '3.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (0.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bmo-cashback-mastercard'),
  'gas',
  0.5,
  'multiplier',
  '0.5x points on gas',
  false,
  NOW(),
  NOW()
);


-- Card 62/203: BMO Preferred Rate Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'bmo-preferred-rate-mastercard',
  'BMO Preferred Rate Mastercard',
  'BMO',
  'None',
  'points',
  0.0,
  20.0,
  0.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_62_id


-- Card 63/203: BMO AIR MILES Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'bmo-air-miles-mastercard',
  'BMO AIR MILES Mastercard',
  'BMO',
  'AIR MILES',
  'airline_miles',
  1.6,
  120.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_63_id

-- Category reward: groceries (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bmo-air-miles-mastercard'),
  'groceries',
  3.0,
  'multiplier',
  '3.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bmo-air-miles-mastercard'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);


-- Card 64/203: Scotiabank Momentum No-Fee Visa Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'scotiabank-momentum-no-fee-visa-card',
  'Scotiabank Momentum No-Fee Visa Card',
  'Scotiabank',
  'Cashback',
  'cashback',
  1.0,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_64_id

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'scotiabank-momentum-no-fee-visa-card'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'scotiabank-momentum-no-fee-visa-card'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: recurring_bills (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'scotiabank-momentum-no-fee-visa-card'),
  'recurring_bills',
  2.0,
  'multiplier',
  '2.0x points on recurring_bills',
  false,
  NOW(),
  NOW()
);


-- Card 65/203: Scotiabank Value Visa Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'scotiabank-value-visa-card',
  'Scotiabank Value Visa Card',
  'Scotiabank',
  'Scene+',
  'points',
  1.0,
  29.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_65_id


-- Card 66/203: Scotiabank Scene+ Debit Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'scotiabank-scene+-debit-mastercard',
  'Scotiabank Scene+ Debit Mastercard',
  'Scotiabank',
  'Scene+',
  'points',
  1.0,
  0.0,
  0.1,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_66_id

-- Category reward: sobeys (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'scotiabank-scene+-debit-mastercard'),
  'sobeys',
  5.0,
  'multiplier',
  '5.0x points on sobeys',
  false,
  NOW(),
  NOW()
);

-- Category reward: cineplex (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'scotiabank-scene+-debit-mastercard'),
  'cineplex',
  5.0,
  'multiplier',
  '5.0x points on cineplex',
  false,
  NOW(),
  NOW()
);


-- Card 67/203: American Express Business Platinum Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'american-express-business-platinum-card',
  'American Express Business Platinum Card',
  'American Express',
  'Membership Rewards',
  'points',
  2.1,
  499.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_67_id

-- Category reward: travel (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-business-platinum-card'),
  'travel',
  2.0,
  'multiplier',
  '2.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: advertising (1.25x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-business-platinum-card'),
  'advertising',
  1.25,
  'multiplier',
  '1.25x points on advertising',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 75000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-business-platinum-card'),
  75000,
  'points',
  5000,
  90,
  true
);


-- Card 68/203: American Express Business Gold Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'american-express-business-gold-card',
  'American Express Business Gold Card',
  'American Express',
  'Membership Rewards',
  'points',
  2.1,
  199.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_68_id

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-business-gold-card'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: advertising (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-business-gold-card'),
  'advertising',
  2.0,
  'multiplier',
  '2.0x points on advertising',
  false,
  NOW(),
  NOW()
);

-- Category reward: travel (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-business-gold-card'),
  'travel',
  2.0,
  'multiplier',
  '2.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 40000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-business-gold-card'),
  40000,
  'points',
  5000,
  90,
  true
);


-- Card 69/203: American Express AIR MILES Platinum Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'american-express-air-miles-platinum-card',
  'American Express AIR MILES Platinum Card',
  'American Express',
  'AIR MILES',
  'airline_miles',
  1.6,
  65.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_69_id

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-air-miles-platinum-card'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-air-miles-platinum-card'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);


-- Card 70/203: BMO Student CashBack Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'bmo-student-cashback-mastercard',
  'BMO Student CashBack Mastercard',
  'BMO',
  'Cashback',
  'cashback',
  1.0,
  0.0,
  0.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_70_id

-- Category reward: groceries (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bmo-student-cashback-mastercard'),
  'groceries',
  3.0,
  'multiplier',
  '3.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (1.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bmo-student-cashback-mastercard'),
  'dining',
  1.0,
  'multiplier',
  '1.0x points on dining',
  false,
  NOW(),
  NOW()
);


-- Card 71/203: CIBC Student Dividend Visa Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'cibc-student-dividend-visa-card',
  'CIBC Student Dividend Visa Card',
  'CIBC',
  'Cashback',
  'cashback',
  1.0,
  0.0,
  0.25,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_71_id

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-student-dividend-visa-card'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-student-dividend-visa-card'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);


-- Card 72/203: Scotiabank Student Scene+ Visa Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'scotiabank-student-scene+-visa-card',
  'Scotiabank Student Scene+ Visa Card',
  'Scotiabank',
  'Scene+',
  'points',
  1.0,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_72_id

-- Category reward: cineplex (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'scotiabank-student-scene+-visa-card'),
  'cineplex',
  5.0,
  'multiplier',
  '5.0x points on cineplex',
  false,
  NOW(),
  NOW()
);


-- Card 73/203: TD Student Cash Back Visa Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'td-student-cash-back-visa-card',
  'TD Student Cash Back Visa Card',
  'TD Bank',
  'Cashback',
  'cashback',
  1.0,
  0.0,
  0.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_73_id

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-student-cash-back-visa-card'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-student-cash-back-visa-card'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-student-cash-back-visa-card'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: recurring_bills (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'td-student-cash-back-visa-card'),
  'recurring_bills',
  2.0,
  'multiplier',
  '2.0x points on recurring_bills',
  false,
  NOW(),
  NOW()
);


-- Card 74/203: RBC Student Cash Back Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'rbc-student-cash-back-mastercard',
  'RBC Student Cash Back Mastercard',
  'RBC',
  'Cashback',
  'cashback',
  1.0,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_74_id

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-student-cash-back-mastercard'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);


-- Card 75/203: MBNA True Line Platinum Plus Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'mbna-true-line-platinum-plus-mastercard',
  'MBNA True Line Platinum Plus Mastercard',
  'MBNA',
  'None',
  'points',
  0.0,
  0.0,
  0.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_75_id


-- Card 76/203: RBC Cash Back Preferred Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'rbc-cash-back-preferred-mastercard',
  'RBC Cash Back Preferred Mastercard',
  'RBC',
  'Cashback',
  'cashback',
  1.0,
  39.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_76_id

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-cash-back-preferred-mastercard'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);


-- Card 77/203: HSBC Low Rate Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'hsbc-low-rate-mastercard',
  'HSBC Low Rate Mastercard',
  'HSBC Canada',
  'None',
  'points',
  0.0,
  29.0,
  0.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_77_id


-- Card 78/203: National Bank à la carte Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'national-bank-à-la-carte-mastercard',
  'National Bank à la carte Mastercard',
  'National Bank',
  'NBC Rewards',
  'points',
  0.5,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_78_id

-- Category reward: selected_categories (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'national-bank-à-la-carte-mastercard'),
  'selected_categories',
  2.0,
  'multiplier',
  '2.0x points on selected_categories',
  false,
  NOW(),
  NOW()
);


-- Card 79/203: Coast Capital Savings Cash Back Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'coast-capital-savings-cash-back-mastercard',
  'Coast Capital Savings Cash Back Mastercard',
  'Coast Capital Savings',
  'Cashback',
  'cashback',
  1.0,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_79_id

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'coast-capital-savings-cash-back-mastercard'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'coast-capital-savings-cash-back-mastercard'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);


-- Card 80/203: Meridian Cash Back Visa Infinite Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'meridian-cash-back-visa-infinite-card',
  'Meridian Cash Back Visa Infinite Card',
  'Meridian Credit Union',
  'Cashback',
  'cashback',
  1.0,
  110.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_80_id

-- Category reward: gas (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'meridian-cash-back-visa-infinite-card'),
  'gas',
  4.0,
  'multiplier',
  '4.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'meridian-cash-back-visa-infinite-card'),
  'groceries',
  4.0,
  'multiplier',
  '4.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'meridian-cash-back-visa-infinite-card'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);


-- Card 81/203: CIBC Business Aerogold Visa Card for Business
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'cibc-business-aerogold-visa-card-for-business',
  'CIBC Business Aerogold Visa Card for Business',
  'CIBC',
  'Aeroplan',
  'airline_miles',
  2.0,
  149.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_81_id

-- Category reward: travel (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-business-aerogold-visa-card-for-business'),
  'travel',
  1.5,
  'multiplier',
  '1.5x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-business-aerogold-visa-card-for-business'),
  'gas',
  1.5,
  'multiplier',
  '1.5x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: office_supplies (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'cibc-business-aerogold-visa-card-for-business'),
  'office_supplies',
  1.5,
  'multiplier',
  '1.5x points on office_supplies',
  false,
  NOW(),
  NOW()
);


-- Card 82/203: RBC Business Platinum Avion Visa
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'rbc-business-platinum-avion-visa',
  'RBC Business Platinum Avion Visa',
  'RBC',
  'Avion',
  'points',
  2.1,
  120.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_82_id

-- Category reward: travel (1.25x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-business-platinum-avion-visa'),
  'travel',
  1.25,
  'multiplier',
  '1.25x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (1.25x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rbc-business-platinum-avion-visa'),
  'gas',
  1.25,
  'multiplier',
  '1.25x points on gas',
  false,
  NOW(),
  NOW()
);


-- Card 83/203: BMO Business Cashback Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'bmo-business-cashback-mastercard',
  'BMO Business Cashback Mastercard',
  'BMO',
  'Cashback',
  'cashback',
  1.0,
  99.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_83_id

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bmo-business-cashback-mastercard'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: office_supplies (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bmo-business-cashback-mastercard'),
  'office_supplies',
  2.0,
  'multiplier',
  '2.0x points on office_supplies',
  false,
  NOW(),
  NOW()
);

-- Category reward: advertising (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bmo-business-cashback-mastercard'),
  'advertising',
  2.0,
  'multiplier',
  '2.0x points on advertising',
  false,
  NOW(),
  NOW()
);


-- Card 84/203: Scotiabank Business SCENE Visa Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'scotiabank-business-scene-visa-card',
  'Scotiabank Business SCENE Visa Card',
  'Scotiabank',
  'Scene+',
  'points',
  1.0,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_84_id


-- Card 85/203: Amazon.ca Rewards Visa Card (Canadian)
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'amazon.ca-rewards-visa-card-(canadian)',
  'Amazon.ca Rewards Visa Card (Canadian)',
  'Chase Canada',
  'Cashback',
  'cashback',
  1.0,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_85_id

-- Category reward: amazon_ca (2.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'amazon.ca-rewards-visa-card-(canadian)'),
  'amazon_ca',
  2.5,
  'multiplier',
  '2.5x points on amazon_ca',
  false,
  NOW(),
  NOW()
);

-- Category reward: restaurants (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'amazon.ca-rewards-visa-card-(canadian)'),
  'restaurants',
  2.0,
  'multiplier',
  '2.0x points on restaurants',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'amazon.ca-rewards-visa-card-(canadian)'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: drugstores (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'amazon.ca-rewards-visa-card-(canadian)'),
  'drugstores',
  2.0,
  'multiplier',
  '2.0x points on drugstores',
  false,
  NOW(),
  NOW()
);


-- Card 86/203: Walmart Rewards Mastercard (Canadian)
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'walmart-rewards-mastercard-(canadian)',
  'Walmart Rewards Mastercard (Canadian)',
  'Duo Bank of Canada',
  'Walmart Rewards',
  'points',
  1.0,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_86_id

-- Category reward: walmart (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'walmart-rewards-mastercard-(canadian)'),
  'walmart',
  3.0,
  'multiplier',
  '3.0x points on walmart',
  false,
  NOW(),
  NOW()
);

-- Category reward: international (1.25x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'walmart-rewards-mastercard-(canadian)'),
  'international',
  1.25,
  'multiplier',
  '1.25x points on international',
  false,
  NOW(),
  NOW()
);


-- Card 87/203: Chase Sapphire Reserve
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'chase-sapphire-reserve',
  'Chase Sapphire Reserve',
  'Chase',
  'Chase Ultimate Rewards',
  'points',
  2.7675,
  550.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_87_id

-- Category reward: travel (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'chase-sapphire-reserve'),
  'travel',
  3.0,
  'multiplier',
  '3.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'chase-sapphire-reserve'),
  'dining',
  3.0,
  'multiplier',
  '3.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 60000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'chase-sapphire-reserve'),
  60000,
  'points',
  4000,
  90,
  true
);


-- Card 88/203: Chase Sapphire Preferred Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'chase-sapphire-preferred-card',
  'Chase Sapphire Preferred Card',
  'Chase',
  'Chase Ultimate Rewards',
  'points',
  2.7675,
  95.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_88_id

-- Category reward: travel (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'chase-sapphire-preferred-card'),
  'travel',
  2.0,
  'multiplier',
  '2.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'chase-sapphire-preferred-card'),
  'dining',
  3.0,
  'multiplier',
  '3.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: streaming (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'chase-sapphire-preferred-card'),
  'streaming',
  2.0,
  'multiplier',
  '2.0x points on streaming',
  false,
  NOW(),
  NOW()
);

-- Category reward: online_grocery (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'chase-sapphire-preferred-card'),
  'online_grocery',
  2.0,
  'multiplier',
  '2.0x points on online_grocery',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 60000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'chase-sapphire-preferred-card'),
  60000,
  'points',
  4000,
  90,
  true
);


-- Card 89/203: Chase Freedom Unlimited
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'chase-freedom-unlimited',
  'Chase Freedom Unlimited',
  'Chase',
  'Chase Ultimate Rewards',
  'points',
  2.7675,
  0.0,
  1.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_89_id

-- Category reward: travel (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'chase-freedom-unlimited'),
  'travel',
  5.0,
  'multiplier',
  '5.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'chase-freedom-unlimited'),
  'dining',
  3.0,
  'multiplier',
  '3.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: drugstores (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'chase-freedom-unlimited'),
  'drugstores',
  3.0,
  'multiplier',
  '3.0x points on drugstores',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 20000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'chase-freedom-unlimited'),
  20000,
  'points',
  500,
  90,
  true
);


-- Card 90/203: Chase Freedom Flex
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'chase-freedom-flex',
  'Chase Freedom Flex',
  'Chase',
  'Chase Ultimate Rewards',
  'points',
  2.7675,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_90_id

-- Category reward: travel (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'chase-freedom-flex'),
  'travel',
  5.0,
  'multiplier',
  '5.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'chase-freedom-flex'),
  'dining',
  3.0,
  'multiplier',
  '3.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: drugstores (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'chase-freedom-flex'),
  'drugstores',
  3.0,
  'multiplier',
  '3.0x points on drugstores',
  false,
  NOW(),
  NOW()
);

-- Category reward: rotating (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'chase-freedom-flex'),
  'rotating',
  5.0,
  'multiplier',
  '5.0x points on rotating',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 20000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'chase-freedom-flex'),
  20000,
  'points',
  500,
  90,
  true
);


-- Card 91/203: Chase Ink Business Preferred Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'chase-ink-business-preferred-credit-card',
  'Chase Ink Business Preferred Credit Card',
  'Chase',
  'Chase Ultimate Rewards',
  'points',
  2.7675,
  95.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_91_id

-- Category reward: travel (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'chase-ink-business-preferred-credit-card'),
  'travel',
  3.0,
  'multiplier',
  '3.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: shipping (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'chase-ink-business-preferred-credit-card'),
  'shipping',
  3.0,
  'multiplier',
  '3.0x points on shipping',
  false,
  NOW(),
  NOW()
);

-- Category reward: advertising (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'chase-ink-business-preferred-credit-card'),
  'advertising',
  3.0,
  'multiplier',
  '3.0x points on advertising',
  false,
  NOW(),
  NOW()
);

-- Category reward: internet_cable_phone (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'chase-ink-business-preferred-credit-card'),
  'internet_cable_phone',
  3.0,
  'multiplier',
  '3.0x points on internet_cable_phone',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 100000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'chase-ink-business-preferred-credit-card'),
  100000,
  'points',
  8000,
  90,
  true
);


-- Card 92/203: United Explorer Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'united-explorer-card',
  'United Explorer Card',
  'Chase',
  'United MileagePlus',
  'airline_miles',
  2.0250000000000004,
  95.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_92_id

-- Category reward: united (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'united-explorer-card'),
  'united',
  2.0,
  'multiplier',
  '2.0x points on united',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'united-explorer-card'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: hotels (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'united-explorer-card'),
  'hotels',
  2.0,
  'multiplier',
  '2.0x points on hotels',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 60000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'united-explorer-card'),
  60000,
  'airline_miles',
  3000,
  90,
  true
);


-- Card 93/203: World of Hyatt Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'world-of-hyatt-credit-card',
  'World of Hyatt Credit Card',
  'Chase',
  'World of Hyatt',
  'points',
  2.9700000000000006,
  95.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_93_id

-- Category reward: hyatt (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'world-of-hyatt-credit-card'),
  'hyatt',
  4.0,
  'multiplier',
  '4.0x points on hyatt',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'world-of-hyatt-credit-card'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: fitness (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'world-of-hyatt-credit-card'),
  'fitness',
  2.0,
  'multiplier',
  '2.0x points on fitness',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 30000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'world-of-hyatt-credit-card'),
  30000,
  'points',
  3000,
  90,
  true
);


-- Card 94/203: Southwest Rapid Rewards Priority Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'southwest-rapid-rewards-priority-credit-card',
  'Southwest Rapid Rewards Priority Credit Card',
  'Chase',
  'Southwest Rapid Rewards',
  'points',
  2.0250000000000004,
  149.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_94_id

-- Category reward: southwest (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'southwest-rapid-rewards-priority-credit-card'),
  'southwest',
  2.0,
  'multiplier',
  '2.0x points on southwest',
  false,
  NOW(),
  NOW()
);

-- Category reward: hotels (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'southwest-rapid-rewards-priority-credit-card'),
  'hotels',
  2.0,
  'multiplier',
  '2.0x points on hotels',
  false,
  NOW(),
  NOW()
);

-- Category reward: car_rentals (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'southwest-rapid-rewards-priority-credit-card'),
  'car_rentals',
  2.0,
  'multiplier',
  '2.0x points on car_rentals',
  false,
  NOW(),
  NOW()
);

-- Category reward: local_transit (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'southwest-rapid-rewards-priority-credit-card'),
  'local_transit',
  2.0,
  'multiplier',
  '2.0x points on local_transit',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 50000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'southwest-rapid-rewards-priority-credit-card'),
  50000,
  'points',
  1000,
  90,
  true
);


-- Card 95/203: Marriott Bonvoy Boundless Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'marriott-bonvoy-boundless-credit-card',
  'Marriott Bonvoy Boundless Credit Card',
  'Chase',
  'Marriott Bonvoy',
  'hotel_points',
  0.999,
  95.0,
  2.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_95_id

-- Category reward: marriott (6.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'marriott-bonvoy-boundless-credit-card'),
  'marriott',
  6.0,
  'multiplier',
  '6.0x points on marriott',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'marriott-bonvoy-boundless-credit-card'),
  'groceries',
  3.0,
  'multiplier',
  '3.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'marriott-bonvoy-boundless-credit-card'),
  'dining',
  3.0,
  'multiplier',
  '3.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'marriott-bonvoy-boundless-credit-card'),
  'gas',
  3.0,
  'multiplier',
  '3.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 75000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'marriott-bonvoy-boundless-credit-card'),
  75000,
  'hotel_points',
  3000,
  90,
  true
);


-- Card 96/203: The Platinum Card from American Express
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'the-platinum-card-from-american-express',
  'The Platinum Card from American Express',
  'American Express',
  'Amex Membership Rewards (US)',
  'points',
  2.7,
  695.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_96_id

-- Category reward: flights (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'the-platinum-card-from-american-express'),
  'flights',
  5.0,
  'multiplier',
  '5.0x points on flights',
  false,
  NOW(),
  NOW()
);

-- Category reward: hotels (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'the-platinum-card-from-american-express'),
  'hotels',
  5.0,
  'multiplier',
  '5.0x points on hotels',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 80000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'the-platinum-card-from-american-express'),
  80000,
  'points',
  8000,
  180,
  true
);


-- Card 97/203: American Express Gold Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'american-express-gold-card',
  'American Express Gold Card',
  'American Express',
  'Amex Membership Rewards (US)',
  'points',
  2.7,
  250.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_97_id

-- Category reward: dining (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-gold-card'),
  'dining',
  4.0,
  'multiplier',
  '4.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: supermarkets (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-gold-card'),
  'supermarkets',
  4.0,
  'multiplier',
  '4.0x points on supermarkets',
  false,
  NOW(),
  NOW()
);

-- Category reward: flights (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-gold-card'),
  'flights',
  3.0,
  'multiplier',
  '3.0x points on flights',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 60000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-gold-card'),
  60000,
  'points',
  6000,
  180,
  true
);


-- Card 98/203: American Express Green Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'american-express-green-card',
  'American Express Green Card',
  'American Express',
  'Amex Membership Rewards (US)',
  'points',
  2.7,
  150.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_98_id

-- Category reward: travel (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-green-card'),
  'travel',
  3.0,
  'multiplier',
  '3.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-green-card'),
  'dining',
  3.0,
  'multiplier',
  '3.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: transit (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-green-card'),
  'transit',
  3.0,
  'multiplier',
  '3.0x points on transit',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 40000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-green-card'),
  40000,
  'points',
  2000,
  90,
  true
);


-- Card 99/203: Blue Cash Preferred Card from American Express
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'blue-cash-preferred-card-from-american-express',
  'Blue Cash Preferred Card from American Express',
  'American Express',
  'Cashback',
  'cashback',
  1.35,
  95.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_99_id

-- Category reward: supermarkets (6.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'blue-cash-preferred-card-from-american-express'),
  'supermarkets',
  6.0,
  'multiplier',
  '6.0x points on supermarkets',
  false,
  NOW(),
  NOW()
);

-- Category reward: streaming (6.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'blue-cash-preferred-card-from-american-express'),
  'streaming',
  6.0,
  'multiplier',
  '6.0x points on streaming',
  false,
  NOW(),
  NOW()
);

-- Category reward: transit (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'blue-cash-preferred-card-from-american-express'),
  'transit',
  3.0,
  'multiplier',
  '3.0x points on transit',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'blue-cash-preferred-card-from-american-express'),
  'gas',
  3.0,
  'multiplier',
  '3.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 350 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'blue-cash-preferred-card-from-american-express'),
  350,
  'cashback',
  3000,
  180,
  true
);


-- Card 100/203: Blue Cash Everyday Card from American Express
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'blue-cash-everyday-card-from-american-express',
  'Blue Cash Everyday Card from American Express',
  'American Express',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_100_id

-- Category reward: supermarkets (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'blue-cash-everyday-card-from-american-express'),
  'supermarkets',
  3.0,
  'multiplier',
  '3.0x points on supermarkets',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'blue-cash-everyday-card-from-american-express'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: online_retail (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'blue-cash-everyday-card-from-american-express'),
  'online_retail',
  2.0,
  'multiplier',
  '2.0x points on online_retail',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 200 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'blue-cash-everyday-card-from-american-express'),
  200,
  'cashback',
  2000,
  180,
  true
);


-- Card 101/203: Delta SkyMiles Gold American Express Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'delta-skymiles-gold-american-express-card',
  'Delta SkyMiles Gold American Express Card',
  'American Express',
  'Delta SkyMiles',
  'airline_miles',
  1.6875,
  150.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_101_id

-- Category reward: delta (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'delta-skymiles-gold-american-express-card'),
  'delta',
  2.0,
  'multiplier',
  '2.0x points on delta',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'delta-skymiles-gold-american-express-card'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: supermarkets (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'delta-skymiles-gold-american-express-card'),
  'supermarkets',
  2.0,
  'multiplier',
  '2.0x points on supermarkets',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 50000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'delta-skymiles-gold-american-express-card'),
  50000,
  'airline_miles',
  2000,
  90,
  true
);


-- Card 102/203: Hilton Honors American Express Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'hilton-honors-american-express-card',
  'Hilton Honors American Express Card',
  'American Express',
  'Hilton Honors',
  'hotel_points',
  0.648,
  0.0,
  3.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_102_id

-- Category reward: hilton (7.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'hilton-honors-american-express-card'),
  'hilton',
  7.0,
  'multiplier',
  '7.0x points on hilton',
  false,
  NOW(),
  NOW()
);

-- Category reward: supermarkets (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'hilton-honors-american-express-card'),
  'supermarkets',
  5.0,
  'multiplier',
  '5.0x points on supermarkets',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'hilton-honors-american-express-card'),
  'dining',
  5.0,
  'multiplier',
  '5.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'hilton-honors-american-express-card'),
  'gas',
  5.0,
  'multiplier',
  '5.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 80000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'hilton-honors-american-express-card'),
  80000,
  'hotel_points',
  1000,
  90,
  true
);


-- Card 103/203: Marriott Bonvoy Bevy American Express Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'marriott-bonvoy-bevy-american-express-card',
  'Marriott Bonvoy Bevy American Express Card',
  'American Express',
  'Marriott Bonvoy',
  'hotel_points',
  0.999,
  250.0,
  2.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_103_id

-- Category reward: marriott (6.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'marriott-bonvoy-bevy-american-express-card'),
  'marriott',
  6.0,
  'multiplier',
  '6.0x points on marriott',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'marriott-bonvoy-bevy-american-express-card'),
  'dining',
  4.0,
  'multiplier',
  '4.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'marriott-bonvoy-bevy-american-express-card'),
  'gas',
  3.0,
  'multiplier',
  '3.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'marriott-bonvoy-bevy-american-express-card'),
  'groceries',
  3.0,
  'multiplier',
  '3.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 100000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'marriott-bonvoy-bevy-american-express-card'),
  100000,
  'hotel_points',
  6000,
  180,
  true
);


-- Card 104/203: Capital One Venture X Rewards Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'capital-one-venture-x-rewards-credit-card',
  'Capital One Venture X Rewards Credit Card',
  'Capital One',
  'Capital One Miles',
  'airline_miles',
  1.35,
  395.0,
  2.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_104_id

-- Category reward: hotels (10.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-venture-x-rewards-credit-card'),
  'hotels',
  10.0,
  'multiplier',
  '10.0x points on hotels',
  false,
  NOW(),
  NOW()
);

-- Category reward: car_rentals (10.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-venture-x-rewards-credit-card'),
  'car_rentals',
  10.0,
  'multiplier',
  '10.0x points on car_rentals',
  false,
  NOW(),
  NOW()
);

-- Category reward: capital_one_travel (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-venture-x-rewards-credit-card'),
  'capital_one_travel',
  5.0,
  'multiplier',
  '5.0x points on capital_one_travel',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 75000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-venture-x-rewards-credit-card'),
  75000,
  'airline_miles',
  4000,
  90,
  true
);


-- Card 105/203: Capital One Venture Rewards Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'capital-one-venture-rewards-credit-card',
  'Capital One Venture Rewards Credit Card',
  'Capital One',
  'Capital One Miles',
  'airline_miles',
  1.35,
  95.0,
  2.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_105_id

-- Category reward: hotels (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-venture-rewards-credit-card'),
  'hotels',
  5.0,
  'multiplier',
  '5.0x points on hotels',
  false,
  NOW(),
  NOW()
);

-- Category reward: car_rentals (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-venture-rewards-credit-card'),
  'car_rentals',
  5.0,
  'multiplier',
  '5.0x points on car_rentals',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 75000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-venture-rewards-credit-card'),
  75000,
  'airline_miles',
  4000,
  90,
  true
);


-- Card 106/203: Capital One VentureOne Rewards Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'capital-one-ventureone-rewards-credit-card',
  'Capital One VentureOne Rewards Credit Card',
  'Capital One',
  'Capital One Miles',
  'airline_miles',
  1.35,
  0.0,
  1.25,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_106_id

-- Category reward: hotels (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-ventureone-rewards-credit-card'),
  'hotels',
  5.0,
  'multiplier',
  '5.0x points on hotels',
  false,
  NOW(),
  NOW()
);

-- Category reward: car_rentals (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-ventureone-rewards-credit-card'),
  'car_rentals',
  5.0,
  'multiplier',
  '5.0x points on car_rentals',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 20000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-ventureone-rewards-credit-card'),
  20000,
  'airline_miles',
  500,
  90,
  true
);


-- Card 107/203: Capital One Savor Cash Rewards Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'capital-one-savor-cash-rewards-credit-card',
  'Capital One Savor Cash Rewards Credit Card',
  'Capital One',
  'Cashback',
  'cashback',
  1.35,
  95.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_107_id

-- Category reward: dining (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-savor-cash-rewards-credit-card'),
  'dining',
  4.0,
  'multiplier',
  '4.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: entertainment (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-savor-cash-rewards-credit-card'),
  'entertainment',
  4.0,
  'multiplier',
  '4.0x points on entertainment',
  false,
  NOW(),
  NOW()
);

-- Category reward: streaming (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-savor-cash-rewards-credit-card'),
  'streaming',
  4.0,
  'multiplier',
  '4.0x points on streaming',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-savor-cash-rewards-credit-card'),
  'groceries',
  3.0,
  'multiplier',
  '3.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 300 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-savor-cash-rewards-credit-card'),
  300,
  'cashback',
  3000,
  90,
  true
);


-- Card 108/203: Capital One SavorOne Cash Rewards Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'capital-one-savorone-cash-rewards-credit-card',
  'Capital One SavorOne Cash Rewards Credit Card',
  'Capital One',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_108_id

-- Category reward: dining (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-savorone-cash-rewards-credit-card'),
  'dining',
  3.0,
  'multiplier',
  '3.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: entertainment (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-savorone-cash-rewards-credit-card'),
  'entertainment',
  3.0,
  'multiplier',
  '3.0x points on entertainment',
  false,
  NOW(),
  NOW()
);

-- Category reward: streaming (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-savorone-cash-rewards-credit-card'),
  'streaming',
  3.0,
  'multiplier',
  '3.0x points on streaming',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-savorone-cash-rewards-credit-card'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 200 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-savorone-cash-rewards-credit-card'),
  200,
  'cashback',
  500,
  90,
  true
);


-- Card 109/203: Capital One Quicksilver Cash Rewards Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'capital-one-quicksilver-cash-rewards-credit-card',
  'Capital One Quicksilver Cash Rewards Credit Card',
  'Capital One',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  1.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_109_id

-- Signup bonus: 200 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-quicksilver-cash-rewards-credit-card'),
  200,
  'cashback',
  500,
  90,
  true
);


-- Card 110/203: Citi Strata Premier Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'citi-strata-premier-card',
  'Citi Strata Premier Card',
  'Citi',
  'Citi ThankYou Points',
  'points',
  2.16,
  95.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_110_id

-- Category reward: travel (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'citi-strata-premier-card'),
  'travel',
  3.0,
  'multiplier',
  '3.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'citi-strata-premier-card'),
  'gas',
  3.0,
  'multiplier',
  '3.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: supermarkets (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'citi-strata-premier-card'),
  'supermarkets',
  3.0,
  'multiplier',
  '3.0x points on supermarkets',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'citi-strata-premier-card'),
  'dining',
  3.0,
  'multiplier',
  '3.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: ev_charging (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'citi-strata-premier-card'),
  'ev_charging',
  3.0,
  'multiplier',
  '3.0x points on ev_charging',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 70000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'citi-strata-premier-card'),
  70000,
  'points',
  4000,
  90,
  true
);


-- Card 111/203: Citi Prestige Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'citi-prestige-card',
  'Citi Prestige Card',
  'Citi',
  'Citi ThankYou Points',
  'points',
  2.16,
  495.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_111_id

-- Category reward: dining (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'citi-prestige-card'),
  'dining',
  5.0,
  'multiplier',
  '5.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: air_travel (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'citi-prestige-card'),
  'air_travel',
  5.0,
  'multiplier',
  '5.0x points on air_travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: hotels (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'citi-prestige-card'),
  'hotels',
  3.0,
  'multiplier',
  '3.0x points on hotels',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 75000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'citi-prestige-card'),
  75000,
  'points',
  5000,
  90,
  true
);


-- Card 112/203: Citi Double Cash Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'citi-double-cash-card',
  'Citi Double Cash Card',
  'Citi',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  2.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_112_id


-- Card 113/203: Citi Custom Cash Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'citi-custom-cash-card',
  'Citi Custom Cash Card',
  'Citi',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_113_id

-- Category reward: top_category (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'citi-custom-cash-card'),
  'top_category',
  5.0,
  'multiplier',
  '5.0x points on top_category',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 200 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'citi-custom-cash-card'),
  200,
  'cashback',
  1500,
  90,
  true
);


-- Card 114/203: Citi AAdvantage Platinum Select World Elite Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'citi-aadvantage-platinum-select-world-elite-mastercard',
  'Citi AAdvantage Platinum Select World Elite Mastercard',
  'Citi',
  'American Airlines AAdvantage',
  'points',
  2.295,
  99.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_114_id

-- Category reward: american_airlines (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'citi-aadvantage-platinum-select-world-elite-mastercard'),
  'american_airlines',
  2.0,
  'multiplier',
  '2.0x points on american_airlines',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'citi-aadvantage-platinum-select-world-elite-mastercard'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'citi-aadvantage-platinum-select-world-elite-mastercard'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 50000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'citi-aadvantage-platinum-select-world-elite-mastercard'),
  50000,
  'points',
  2500,
  90,
  true
);


-- Card 115/203: Costco Anywhere Visa Card by Citi
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'costco-anywhere-visa-card-by-citi',
  'Costco Anywhere Visa Card by Citi',
  'Citi',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_115_id

-- Category reward: gas (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'costco-anywhere-visa-card-by-citi'),
  'gas',
  4.0,
  'multiplier',
  '4.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: travel (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'costco-anywhere-visa-card-by-citi'),
  'travel',
  3.0,
  'multiplier',
  '3.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'costco-anywhere-visa-card-by-citi'),
  'dining',
  3.0,
  'multiplier',
  '3.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: costco (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'costco-anywhere-visa-card-by-citi'),
  'costco',
  2.0,
  'multiplier',
  '2.0x points on costco',
  false,
  NOW(),
  NOW()
);


-- Card 116/203: Discover it Cash Back
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'discover-it-cash-back',
  'Discover it Cash Back',
  'Discover',
  'Discover Cashback',
  'cashback',
  1.35,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_116_id

-- Category reward: rotating (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'discover-it-cash-back'),
  'rotating',
  5.0,
  'multiplier',
  '5.0x points on rotating',
  false,
  NOW(),
  NOW()
);


-- Card 117/203: Discover it Miles
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'discover-it-miles',
  'Discover it Miles',
  'Discover',
  'Discover Miles',
  'airline_miles',
  1.35,
  0.0,
  1.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_117_id


-- Card 118/203: Discover it Chrome
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'discover-it-chrome',
  'Discover it Chrome',
  'Discover',
  'Discover Cashback',
  'cashback',
  1.35,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_118_id

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'discover-it-chrome'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'discover-it-chrome'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);


-- Card 119/203: Wells Fargo Autograph Journey Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'wells-fargo-autograph-journey-card',
  'Wells Fargo Autograph Journey Card',
  'Wells Fargo',
  'Wells Fargo Rewards',
  'points',
  1.35,
  95.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_119_id

-- Category reward: hotels (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'wells-fargo-autograph-journey-card'),
  'hotels',
  5.0,
  'multiplier',
  '5.0x points on hotels',
  false,
  NOW(),
  NOW()
);

-- Category reward: airlines (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'wells-fargo-autograph-journey-card'),
  'airlines',
  5.0,
  'multiplier',
  '5.0x points on airlines',
  false,
  NOW(),
  NOW()
);

-- Category reward: car_rentals (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'wells-fargo-autograph-journey-card'),
  'car_rentals',
  5.0,
  'multiplier',
  '5.0x points on car_rentals',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'wells-fargo-autograph-journey-card'),
  'dining',
  3.0,
  'multiplier',
  '3.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 60000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'wells-fargo-autograph-journey-card'),
  60000,
  'points',
  4000,
  90,
  true
);


-- Card 120/203: Wells Fargo Autograph Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'wells-fargo-autograph-card',
  'Wells Fargo Autograph Card',
  'Wells Fargo',
  'Wells Fargo Rewards',
  'points',
  1.35,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_120_id

-- Category reward: dining (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'wells-fargo-autograph-card'),
  'dining',
  3.0,
  'multiplier',
  '3.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: travel (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'wells-fargo-autograph-card'),
  'travel',
  3.0,
  'multiplier',
  '3.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'wells-fargo-autograph-card'),
  'gas',
  3.0,
  'multiplier',
  '3.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: transit (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'wells-fargo-autograph-card'),
  'transit',
  3.0,
  'multiplier',
  '3.0x points on transit',
  false,
  NOW(),
  NOW()
);

-- Category reward: streaming (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'wells-fargo-autograph-card'),
  'streaming',
  3.0,
  'multiplier',
  '3.0x points on streaming',
  false,
  NOW(),
  NOW()
);

-- Category reward: phone_plans (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'wells-fargo-autograph-card'),
  'phone_plans',
  3.0,
  'multiplier',
  '3.0x points on phone_plans',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 20000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'wells-fargo-autograph-card'),
  20000,
  'points',
  1000,
  90,
  true
);


-- Card 121/203: Wells Fargo Active Cash Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'wells-fargo-active-cash-card',
  'Wells Fargo Active Cash Card',
  'Wells Fargo',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  2.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_121_id

-- Signup bonus: 200 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'wells-fargo-active-cash-card'),
  200,
  'cashback',
  500,
  90,
  true
);


-- Card 122/203: Bilt Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'bilt-mastercard',
  'Bilt Mastercard',
  'Bilt',
  'Bilt Rewards',
  'points',
  2.9700000000000006,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_122_id

-- Category reward: rent (1.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bilt-mastercard'),
  'rent',
  1.0,
  'multiplier',
  '1.0x points on rent',
  false,
  NOW(),
  NOW()
);

-- Category reward: travel (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bilt-mastercard'),
  'travel',
  2.0,
  'multiplier',
  '2.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bilt-mastercard'),
  'dining',
  3.0,
  'multiplier',
  '3.0x points on dining',
  false,
  NOW(),
  NOW()
);


-- Card 123/203: Amazon Prime Rewards Visa Signature Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'amazon-prime-rewards-visa-signature-card',
  'Amazon Prime Rewards Visa Signature Card',
  'Chase',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_123_id

-- Category reward: amazon (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'amazon-prime-rewards-visa-signature-card'),
  'amazon',
  5.0,
  'multiplier',
  '5.0x points on amazon',
  false,
  NOW(),
  NOW()
);

-- Category reward: whole_foods (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'amazon-prime-rewards-visa-signature-card'),
  'whole_foods',
  5.0,
  'multiplier',
  '5.0x points on whole_foods',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'amazon-prime-rewards-visa-signature-card'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'amazon-prime-rewards-visa-signature-card'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: drugstores (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'amazon-prime-rewards-visa-signature-card'),
  'drugstores',
  2.0,
  'multiplier',
  '2.0x points on drugstores',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 150 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'amazon-prime-rewards-visa-signature-card'),
  150,
  'cashback',
  0,
  90,
  true
);


-- Card 124/203: Target RedCard Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'target-redcard-credit-card',
  'Target RedCard Credit Card',
  'TD Bank',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  0.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_124_id

-- Category reward: target (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'target-redcard-credit-card'),
  'target',
  5.0,
  'multiplier',
  '5.0x points on target',
  false,
  NOW(),
  NOW()
);


-- Card 125/203: Walmart Rewards Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'walmart-rewards-card',
  'Walmart Rewards Card',
  'Capital One',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_125_id

-- Category reward: walmart (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'walmart-rewards-card'),
  'walmart',
  5.0,
  'multiplier',
  '5.0x points on walmart',
  false,
  NOW(),
  NOW()
);

-- Category reward: travel (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'walmart-rewards-card'),
  'travel',
  2.0,
  'multiplier',
  '2.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'walmart-rewards-card'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);


-- Card 126/203: U.S. Bank Altitude Reserve Visa Infinite Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'u.s.-bank-altitude-reserve-visa-infinite-card',
  'U.S. Bank Altitude Reserve Visa Infinite Card',
  'U.S. Bank',
  'U.S. Bank Rewards',
  'points',
  2.0250000000000004,
  400.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_126_id

-- Category reward: mobile_wallet (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'u.s.-bank-altitude-reserve-visa-infinite-card'),
  'mobile_wallet',
  5.0,
  'multiplier',
  '5.0x points on mobile_wallet',
  false,
  NOW(),
  NOW()
);

-- Category reward: travel (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'u.s.-bank-altitude-reserve-visa-infinite-card'),
  'travel',
  3.0,
  'multiplier',
  '3.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'u.s.-bank-altitude-reserve-visa-infinite-card'),
  'dining',
  3.0,
  'multiplier',
  '3.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 50000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'u.s.-bank-altitude-reserve-visa-infinite-card'),
  50000,
  'points',
  4500,
  90,
  true
);


-- Card 127/203: U.S. Bank Altitude Go Visa Signature Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'u.s.-bank-altitude-go-visa-signature-card',
  'U.S. Bank Altitude Go Visa Signature Card',
  'U.S. Bank',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_127_id

-- Category reward: dining (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'u.s.-bank-altitude-go-visa-signature-card'),
  'dining',
  4.0,
  'multiplier',
  '4.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'u.s.-bank-altitude-go-visa-signature-card'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'u.s.-bank-altitude-go-visa-signature-card'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: streaming (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'u.s.-bank-altitude-go-visa-signature-card'),
  'streaming',
  2.0,
  'multiplier',
  '2.0x points on streaming',
  false,
  NOW(),
  NOW()
);


-- Card 128/203: Bank of America Premium Rewards Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'bank-of-america-premium-rewards-credit-card',
  'Bank of America Premium Rewards Credit Card',
  'Bank of America',
  'BofA Rewards',
  'points',
  2.0250000000000004,
  95.0,
  1.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_128_id

-- Category reward: travel (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bank-of-america-premium-rewards-credit-card'),
  'travel',
  2.0,
  'multiplier',
  '2.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bank-of-america-premium-rewards-credit-card'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 60000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bank-of-america-premium-rewards-credit-card'),
  60000,
  'points',
  5000,
  90,
  true
);


-- Card 129/203: Bank of America Travel Rewards Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'bank-of-america-travel-rewards-credit-card',
  'Bank of America Travel Rewards Credit Card',
  'Bank of America',
  'BofA Rewards',
  'points',
  2.0250000000000004,
  0.0,
  1.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_129_id

-- Signup bonus: 25000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bank-of-america-travel-rewards-credit-card'),
  25000,
  'points',
  1000,
  90,
  true
);


-- Card 130/203: Bank of America Customized Cash Rewards Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'bank-of-america-customized-cash-rewards-credit-card',
  'Bank of America Customized Cash Rewards Credit Card',
  'Bank of America',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_130_id

-- Category reward: choice_category (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bank-of-america-customized-cash-rewards-credit-card'),
  'choice_category',
  3.0,
  'multiplier',
  '3.0x points on choice_category',
  false,
  NOW(),
  NOW()
);

-- Category reward: grocery_stores (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bank-of-america-customized-cash-rewards-credit-card'),
  'grocery_stores',
  2.0,
  'multiplier',
  '2.0x points on grocery_stores',
  false,
  NOW(),
  NOW()
);

-- Category reward: wholesale_clubs (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bank-of-america-customized-cash-rewards-credit-card'),
  'wholesale_clubs',
  2.0,
  'multiplier',
  '2.0x points on wholesale_clubs',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 200 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bank-of-america-customized-cash-rewards-credit-card'),
  200,
  'cashback',
  1000,
  90,
  true
);


-- Card 131/203: Bank of America Unlimited Cash Rewards Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'bank-of-america-unlimited-cash-rewards-credit-card',
  'Bank of America Unlimited Cash Rewards Credit Card',
  'Bank of America',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  1.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_131_id

-- Signup bonus: 200 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bank-of-america-unlimited-cash-rewards-credit-card'),
  200,
  'cashback',
  1000,
  90,
  true
);


-- Card 132/203: Barclays Arrival Premier World Elite Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'barclays-arrival-premier-world-elite-mastercard',
  'Barclays Arrival Premier World Elite Mastercard',
  'Barclays',
  'Barclays Miles',
  'airline_miles',
  1.35,
  89.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_132_id

-- Category reward: travel (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'barclays-arrival-premier-world-elite-mastercard'),
  'travel',
  3.0,
  'multiplier',
  '3.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'barclays-arrival-premier-world-elite-mastercard'),
  'dining',
  3.0,
  'multiplier',
  '3.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 75000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'barclays-arrival-premier-world-elite-mastercard'),
  75000,
  'airline_miles',
  5000,
  90,
  true
);


-- Card 133/203: JetBlue Plus Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'jetblue-plus-card',
  'JetBlue Plus Card',
  'Barclays',
  'JetBlue TrueBlue',
  'points',
  1.8225000000000002,
  99.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_133_id

-- Category reward: jetblue (6.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'jetblue-plus-card'),
  'jetblue',
  6.0,
  'multiplier',
  '6.0x points on jetblue',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'jetblue-plus-card'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'jetblue-plus-card'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 60000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'jetblue-plus-card'),
  60000,
  'points',
  1000,
  90,
  true
);


-- Card 134/203: Wyndham Rewards Earner Business Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'wyndham-rewards-earner-business-card',
  'Wyndham Rewards Earner Business Card',
  'Barclays',
  'Wyndham Rewards',
  'points',
  1.4850000000000003,
  95.0,
  2.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_134_id

-- Category reward: wyndham (8.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'wyndham-rewards-earner-business-card'),
  'wyndham',
  8.0,
  'multiplier',
  '8.0x points on wyndham',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'wyndham-rewards-earner-business-card'),
  'gas',
  4.0,
  'multiplier',
  '4.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: utilities (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'wyndham-rewards-earner-business-card'),
  'utilities',
  4.0,
  'multiplier',
  '4.0x points on utilities',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 45000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'wyndham-rewards-earner-business-card'),
  45000,
  'points',
  1000,
  90,
  true
);


-- Card 135/203: Alaska Airlines Visa Signature Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'alaska-airlines-visa-signature-card',
  'Alaska Airlines Visa Signature Card',
  'Bank of America',
  'Alaska Mileage Plan',
  'airline_miles',
  2.43,
  95.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_135_id

-- Category reward: alaska (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'alaska-airlines-visa-signature-card'),
  'alaska',
  3.0,
  'multiplier',
  '3.0x points on alaska',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'alaska-airlines-visa-signature-card'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: local_transit (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'alaska-airlines-visa-signature-card'),
  'local_transit',
  2.0,
  'multiplier',
  '2.0x points on local_transit',
  false,
  NOW(),
  NOW()
);

-- Category reward: cable_streaming (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'alaska-airlines-visa-signature-card'),
  'cable_streaming',
  2.0,
  'multiplier',
  '2.0x points on cable_streaming',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 60000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'alaska-airlines-visa-signature-card'),
  60000,
  'airline_miles',
  2000,
  90,
  true
);


-- Card 136/203: Delta SkyMiles Platinum American Express Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'delta-skymiles-platinum-american-express-card',
  'Delta SkyMiles Platinum American Express Card',
  'American Express',
  'Delta SkyMiles',
  'airline_miles',
  1.6875,
  250.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_136_id

-- Category reward: delta (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'delta-skymiles-platinum-american-express-card'),
  'delta',
  3.0,
  'multiplier',
  '3.0x points on delta',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'delta-skymiles-platinum-american-express-card'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: supermarkets (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'delta-skymiles-platinum-american-express-card'),
  'supermarkets',
  2.0,
  'multiplier',
  '2.0x points on supermarkets',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 60000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'delta-skymiles-platinum-american-express-card'),
  60000,
  'airline_miles',
  3000,
  90,
  true
);


-- Card 137/203: Delta SkyMiles Reserve American Express Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'delta-skymiles-reserve-american-express-card',
  'Delta SkyMiles Reserve American Express Card',
  'American Express',
  'Delta SkyMiles',
  'airline_miles',
  1.6875,
  650.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_137_id

-- Category reward: delta (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'delta-skymiles-reserve-american-express-card'),
  'delta',
  3.0,
  'multiplier',
  '3.0x points on delta',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'delta-skymiles-reserve-american-express-card'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 85000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'delta-skymiles-reserve-american-express-card'),
  85000,
  'airline_miles',
  5000,
  90,
  true
);


-- Card 138/203: United Quest Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'united-quest-card',
  'United Quest Card',
  'Chase',
  'United MileagePlus',
  'airline_miles',
  2.0250000000000004,
  250.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_138_id

-- Category reward: united (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'united-quest-card'),
  'united',
  3.0,
  'multiplier',
  '3.0x points on united',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'united-quest-card'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: hotels (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'united-quest-card'),
  'hotels',
  2.0,
  'multiplier',
  '2.0x points on hotels',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 80000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'united-quest-card'),
  80000,
  'airline_miles',
  5000,
  90,
  true
);


-- Card 139/203: United Club Infinite Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'united-club-infinite-card',
  'United Club Infinite Card',
  'Chase',
  'United MileagePlus',
  'airline_miles',
  2.0250000000000004,
  525.0,
  1.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_139_id

-- Category reward: united (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'united-club-infinite-card'),
  'united',
  4.0,
  'multiplier',
  '4.0x points on united',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'united-club-infinite-card'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: hotels (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'united-club-infinite-card'),
  'hotels',
  2.0,
  'multiplier',
  '2.0x points on hotels',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 100000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'united-club-infinite-card'),
  100000,
  'airline_miles',
  6000,
  90,
  true
);


-- Card 140/203: Citi AAdvantage Executive World Elite Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'citi-aadvantage-executive-world-elite-mastercard',
  'Citi AAdvantage Executive World Elite Mastercard',
  'Citi',
  'American Airlines AAdvantage',
  'points',
  2.295,
  595.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_140_id

-- Category reward: american_airlines (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'citi-aadvantage-executive-world-elite-mastercard'),
  'american_airlines',
  2.0,
  'multiplier',
  '2.0x points on american_airlines',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'citi-aadvantage-executive-world-elite-mastercard'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 50000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'citi-aadvantage-executive-world-elite-mastercard'),
  50000,
  'points',
  5000,
  90,
  true
);


-- Card 141/203: Southwest Rapid Rewards Plus Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'southwest-rapid-rewards-plus-credit-card',
  'Southwest Rapid Rewards Plus Credit Card',
  'Chase',
  'Southwest Rapid Rewards',
  'points',
  2.0250000000000004,
  99.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_141_id

-- Category reward: southwest (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'southwest-rapid-rewards-plus-credit-card'),
  'southwest',
  2.0,
  'multiplier',
  '2.0x points on southwest',
  false,
  NOW(),
  NOW()
);

-- Category reward: hotels (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'southwest-rapid-rewards-plus-credit-card'),
  'hotels',
  2.0,
  'multiplier',
  '2.0x points on hotels',
  false,
  NOW(),
  NOW()
);

-- Category reward: car_rentals (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'southwest-rapid-rewards-plus-credit-card'),
  'car_rentals',
  2.0,
  'multiplier',
  '2.0x points on car_rentals',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 50000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'southwest-rapid-rewards-plus-credit-card'),
  50000,
  'points',
  1000,
  90,
  true
);


-- Card 142/203: Southwest Rapid Rewards Performance Business Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'southwest-rapid-rewards-performance-business-credit-card',
  'Southwest Rapid Rewards Performance Business Credit Card',
  'Chase',
  'Southwest Rapid Rewards',
  'points',
  2.0250000000000004,
  199.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_142_id

-- Category reward: southwest (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'southwest-rapid-rewards-performance-business-credit-card'),
  'southwest',
  3.0,
  'multiplier',
  '3.0x points on southwest',
  false,
  NOW(),
  NOW()
);

-- Category reward: hotels (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'southwest-rapid-rewards-performance-business-credit-card'),
  'hotels',
  2.0,
  'multiplier',
  '2.0x points on hotels',
  false,
  NOW(),
  NOW()
);

-- Category reward: car_rentals (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'southwest-rapid-rewards-performance-business-credit-card'),
  'car_rentals',
  2.0,
  'multiplier',
  '2.0x points on car_rentals',
  false,
  NOW(),
  NOW()
);

-- Category reward: telecom (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'southwest-rapid-rewards-performance-business-credit-card'),
  'telecom',
  2.0,
  'multiplier',
  '2.0x points on telecom',
  false,
  NOW(),
  NOW()
);

-- Category reward: internet_cable (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'southwest-rapid-rewards-performance-business-credit-card'),
  'internet_cable',
  2.0,
  'multiplier',
  '2.0x points on internet_cable',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 80000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'southwest-rapid-rewards-performance-business-credit-card'),
  80000,
  'points',
  5000,
  90,
  true
);


-- Card 143/203: Marriott Bonvoy Bold Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'marriott-bonvoy-bold-credit-card',
  'Marriott Bonvoy Bold Credit Card',
  'Chase',
  'Marriott Bonvoy',
  'hotel_points',
  0.999,
  0.0,
  2.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_143_id

-- Category reward: marriott (14.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'marriott-bonvoy-bold-credit-card'),
  'marriott',
  14.0,
  'multiplier',
  '14.0x points on marriott',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'marriott-bonvoy-bold-credit-card'),
  'gas',
  3.0,
  'multiplier',
  '3.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'marriott-bonvoy-bold-credit-card'),
  'dining',
  3.0,
  'multiplier',
  '3.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'marriott-bonvoy-bold-credit-card'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 30000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'marriott-bonvoy-bold-credit-card'),
  30000,
  'hotel_points',
  1000,
  90,
  true
);


-- Card 144/203: Marriott Bonvoy Business American Express Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'marriott-bonvoy-business-american-express-card',
  'Marriott Bonvoy Business American Express Card',
  'American Express',
  'Marriott Bonvoy',
  'hotel_points',
  0.999,
  125.0,
  2.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_144_id

-- Category reward: marriott (6.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'marriott-bonvoy-business-american-express-card'),
  'marriott',
  6.0,
  'multiplier',
  '6.0x points on marriott',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'marriott-bonvoy-business-american-express-card'),
  'gas',
  4.0,
  'multiplier',
  '4.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: wireless (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'marriott-bonvoy-business-american-express-card'),
  'wireless',
  4.0,
  'multiplier',
  '4.0x points on wireless',
  false,
  NOW(),
  NOW()
);

-- Category reward: office_supplies (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'marriott-bonvoy-business-american-express-card'),
  'office_supplies',
  4.0,
  'multiplier',
  '4.0x points on office_supplies',
  false,
  NOW(),
  NOW()
);

-- Category reward: shipping (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'marriott-bonvoy-business-american-express-card'),
  'shipping',
  4.0,
  'multiplier',
  '4.0x points on shipping',
  false,
  NOW(),
  NOW()
);

-- Category reward: internet (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'marriott-bonvoy-business-american-express-card'),
  'internet',
  4.0,
  'multiplier',
  '4.0x points on internet',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 100000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'marriott-bonvoy-business-american-express-card'),
  100000,
  'hotel_points',
  5000,
  90,
  true
);


-- Card 145/203: Hilton Honors American Express Surpass Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'hilton-honors-american-express-surpass-card',
  'Hilton Honors American Express Surpass Card',
  'American Express',
  'Hilton Honors',
  'hotel_points',
  0.648,
  150.0,
  3.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_145_id

-- Category reward: hilton (12.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'hilton-honors-american-express-surpass-card'),
  'hilton',
  12.0,
  'multiplier',
  '12.0x points on hilton',
  false,
  NOW(),
  NOW()
);

-- Category reward: supermarkets (6.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'hilton-honors-american-express-surpass-card'),
  'supermarkets',
  6.0,
  'multiplier',
  '6.0x points on supermarkets',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (6.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'hilton-honors-american-express-surpass-card'),
  'dining',
  6.0,
  'multiplier',
  '6.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (6.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'hilton-honors-american-express-surpass-card'),
  'gas',
  6.0,
  'multiplier',
  '6.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 130000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'hilton-honors-american-express-surpass-card'),
  130000,
  'hotel_points',
  2000,
  90,
  true
);


-- Card 146/203: Hilton Honors American Express Aspire Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'hilton-honors-american-express-aspire-card',
  'Hilton Honors American Express Aspire Card',
  'American Express',
  'Hilton Honors',
  'hotel_points',
  0.648,
  450.0,
  3.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_146_id

-- Category reward: hilton (14.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'hilton-honors-american-express-aspire-card'),
  'hilton',
  14.0,
  'multiplier',
  '14.0x points on hilton',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (7.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'hilton-honors-american-express-aspire-card'),
  'dining',
  7.0,
  'multiplier',
  '7.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: flights (7.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'hilton-honors-american-express-aspire-card'),
  'flights',
  7.0,
  'multiplier',
  '7.0x points on flights',
  false,
  NOW(),
  NOW()
);

-- Category reward: car_rentals (7.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'hilton-honors-american-express-aspire-card'),
  'car_rentals',
  7.0,
  'multiplier',
  '7.0x points on car_rentals',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 150000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'hilton-honors-american-express-aspire-card'),
  150000,
  'hotel_points',
  4000,
  90,
  true
);


-- Card 147/203: IHG One Rewards Premier Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'ihg-one-rewards-premier-credit-card',
  'IHG One Rewards Premier Credit Card',
  'Chase',
  'IHG One Rewards',
  'points',
  0.945,
  99.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_147_id

-- Category reward: ihg (10.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'ihg-one-rewards-premier-credit-card'),
  'ihg',
  10.0,
  'multiplier',
  '10.0x points on ihg',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'ihg-one-rewards-premier-credit-card'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'ihg-one-rewards-premier-credit-card'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'ihg-one-rewards-premier-credit-card'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 140000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'ihg-one-rewards-premier-credit-card'),
  140000,
  'points',
  3000,
  90,
  true
);


-- Card 148/203: IHG One Rewards Traveler Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'ihg-one-rewards-traveler-credit-card',
  'IHG One Rewards Traveler Credit Card',
  'Chase',
  'IHG One Rewards',
  'points',
  0.945,
  0.0,
  2.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_148_id

-- Category reward: ihg (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'ihg-one-rewards-traveler-credit-card'),
  'ihg',
  5.0,
  'multiplier',
  '5.0x points on ihg',
  false,
  NOW(),
  NOW()
);

-- Category reward: travel (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'ihg-one-rewards-traveler-credit-card'),
  'travel',
  3.0,
  'multiplier',
  '3.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'ihg-one-rewards-traveler-credit-card'),
  'dining',
  3.0,
  'multiplier',
  '3.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 75000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'ihg-one-rewards-traveler-credit-card'),
  75000,
  'points',
  2000,
  90,
  true
);


-- Card 149/203: Ink Business Cash Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'ink-business-cash-credit-card',
  'Ink Business Cash Credit Card',
  'Chase',
  'Chase Ultimate Rewards',
  'points',
  2.7675,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_149_id

-- Category reward: office_supplies (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'ink-business-cash-credit-card'),
  'office_supplies',
  5.0,
  'multiplier',
  '5.0x points on office_supplies',
  false,
  NOW(),
  NOW()
);

-- Category reward: internet_cable_phone (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'ink-business-cash-credit-card'),
  'internet_cable_phone',
  5.0,
  'multiplier',
  '5.0x points on internet_cable_phone',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'ink-business-cash-credit-card'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'ink-business-cash-credit-card'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 75000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'ink-business-cash-credit-card'),
  75000,
  'points',
  6000,
  90,
  true
);


-- Card 150/203: Ink Business Unlimited Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'ink-business-unlimited-credit-card',
  'Ink Business Unlimited Credit Card',
  'Chase',
  'Chase Ultimate Rewards',
  'points',
  2.7675,
  0.0,
  1.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_150_id

-- Signup bonus: 75000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'ink-business-unlimited-credit-card'),
  75000,
  'points',
  6000,
  90,
  true
);


-- Card 151/203: The Business Platinum Card from American Express
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'the-business-platinum-card-from-american-express',
  'The Business Platinum Card from American Express',
  'American Express',
  'Amex Membership Rewards (US)',
  'points',
  2.7,
  695.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_151_id

-- Category reward: flights (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'the-business-platinum-card-from-american-express'),
  'flights',
  5.0,
  'multiplier',
  '5.0x points on flights',
  false,
  NOW(),
  NOW()
);

-- Category reward: prepaid_hotels (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'the-business-platinum-card-from-american-express'),
  'prepaid_hotels',
  5.0,
  'multiplier',
  '5.0x points on prepaid_hotels',
  false,
  NOW(),
  NOW()
);

-- Category reward: purchases_over_5000 (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'the-business-platinum-card-from-american-express'),
  'purchases_over_5000',
  1.5,
  'multiplier',
  '1.5x points on purchases_over_5000',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 150000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'the-business-platinum-card-from-american-express'),
  150000,
  'points',
  15000,
  90,
  true
);


-- Card 152/203: American Express Blue Business Plus Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'american-express-blue-business-plus-credit-card',
  'American Express Blue Business Plus Credit Card',
  'American Express',
  'Amex Membership Rewards (US)',
  'points',
  2.7,
  0.0,
  2.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_152_id


-- Card 153/203: American Express Blue Business Cash Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'american-express-blue-business-cash-card',
  'American Express Blue Business Cash Card',
  'American Express',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  2.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_153_id

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-blue-business-cash-card'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: office_supplies (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-blue-business-cash-card'),
  'office_supplies',
  2.0,
  'multiplier',
  '2.0x points on office_supplies',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-blue-business-cash-card'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 250 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'american-express-blue-business-cash-card'),
  250,
  'cashback',
  3000,
  90,
  true
);


-- Card 154/203: Capital One Spark Cash Plus
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'capital-one-spark-cash-plus',
  'Capital One Spark Cash Plus',
  'Capital One',
  'Cashback',
  'cashback',
  1.35,
  150.0,
  2.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_154_id

-- Signup bonus: 2000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-spark-cash-plus'),
  2000,
  'cashback',
  10000,
  90,
  true
);


-- Card 155/203: Capital One Spark Miles for Business
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'capital-one-spark-miles-for-business',
  'Capital One Spark Miles for Business',
  'Capital One',
  'Capital One Miles',
  'airline_miles',
  1.35,
  95.0,
  2.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_155_id

-- Signup bonus: 50000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-spark-miles-for-business'),
  50000,
  'airline_miles',
  4500,
  90,
  true
);


-- Card 156/203: Apple Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'apple-card',
  'Apple Card',
  'Goldman Sachs',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_156_id

-- Category reward: apple (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'apple-card'),
  'apple',
  3.0,
  'multiplier',
  '3.0x points on apple',
  false,
  NOW(),
  NOW()
);

-- Category reward: apple_wallet (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'apple-card'),
  'apple_wallet',
  2.0,
  'multiplier',
  '2.0x points on apple_wallet',
  false,
  NOW(),
  NOW()
);


-- Card 157/203: Best Buy Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'best-buy-credit-card',
  'Best Buy Credit Card',
  'Citibank',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  2.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_157_id

-- Category reward: best_buy (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'best-buy-credit-card'),
  'best_buy',
  5.0,
  'multiplier',
  '5.0x points on best_buy',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'best-buy-credit-card'),
  'dining',
  3.0,
  'multiplier',
  '3.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'best-buy-credit-card'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);


-- Card 158/203: Home Depot Consumer Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'home-depot-consumer-credit-card',
  'Home Depot Consumer Credit Card',
  'Citibank',
  'None',
  'points',
  0.0,
  0.0,
  0.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_158_id


-- Card 159/203: Lowe's Advantage Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'lowes-advantage-card',
  'Lowe''s Advantage Card',
  'Synchrony Bank',
  'None',
  'points',
  0.0,
  0.0,
  0.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_159_id


-- Card 160/203: PenFed Pathfinder Rewards Visa Signature Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'penfed-pathfinder-rewards-visa-signature-card',
  'PenFed Pathfinder Rewards Visa Signature Card',
  'PenFed',
  'PenFed Points',
  'points',
  1.35,
  95.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_160_id

-- Category reward: travel (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'penfed-pathfinder-rewards-visa-signature-card'),
  'travel',
  4.0,
  'multiplier',
  '4.0x points on travel',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'penfed-pathfinder-rewards-visa-signature-card'),
  'gas',
  3.0,
  'multiplier',
  '3.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: supermarkets (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'penfed-pathfinder-rewards-visa-signature-card'),
  'supermarkets',
  2.0,
  'multiplier',
  '2.0x points on supermarkets',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'penfed-pathfinder-rewards-visa-signature-card'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 50000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'penfed-pathfinder-rewards-visa-signature-card'),
  50000,
  'points',
  2500,
  90,
  true
);


-- Card 161/203: PenFed Power Cash Rewards Visa Signature Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'penfed-power-cash-rewards-visa-signature-card',
  'PenFed Power Cash Rewards Visa Signature Card',
  'PenFed',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  1.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_161_id

-- Category reward: gas (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'penfed-power-cash-rewards-visa-signature-card'),
  'gas',
  3.0,
  'multiplier',
  '3.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 200 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'penfed-power-cash-rewards-visa-signature-card'),
  200,
  'cashback',
  1500,
  90,
  true
);


-- Card 162/203: Navy Federal Credit Union GO REWARDS Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'navy-federal-credit-union-go-rewards-credit-card',
  'Navy Federal Credit Union GO REWARDS Credit Card',
  'Navy Federal Credit Union',
  'GO Rewards',
  'points',
  1.35,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_162_id

-- Category reward: supermarkets (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'navy-federal-credit-union-go-rewards-credit-card'),
  'supermarkets',
  3.0,
  'multiplier',
  '3.0x points on supermarkets',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'navy-federal-credit-union-go-rewards-credit-card'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'navy-federal-credit-union-go-rewards-credit-card'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);


-- Card 163/203: Navy Federal More Rewards American Express Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'navy-federal-more-rewards-american-express-card',
  'Navy Federal More Rewards American Express Card',
  'Navy Federal Credit Union',
  'More Rewards',
  'points',
  1.35,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_163_id

-- Category reward: supermarkets (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'navy-federal-more-rewards-american-express-card'),
  'supermarkets',
  3.0,
  'multiplier',
  '3.0x points on supermarkets',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'navy-federal-more-rewards-american-express-card'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: transit (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'navy-federal-more-rewards-american-express-card'),
  'transit',
  2.0,
  'multiplier',
  '2.0x points on transit',
  false,
  NOW(),
  NOW()
);


-- Card 164/203: USAA Rewards Visa Signature
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'usaa-rewards-visa-signature',
  'USAA Rewards Visa Signature',
  'USAA',
  'USAA Rewards',
  'points',
  1.35,
  0.0,
  1.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_164_id

-- Category reward: gas (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'usaa-rewards-visa-signature'),
  'gas',
  3.0,
  'multiplier',
  '3.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: military_bases (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'usaa-rewards-visa-signature'),
  'military_bases',
  2.0,
  'multiplier',
  '2.0x points on military_bases',
  false,
  NOW(),
  NOW()
);


-- Card 165/203: USAA Cashback Rewards Plus American Express Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'usaa-cashback-rewards-plus-american-express-card',
  'USAA Cashback Rewards Plus American Express Card',
  'USAA',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_165_id

-- Category reward: gas (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'usaa-cashback-rewards-plus-american-express-card'),
  'gas',
  5.0,
  'multiplier',
  '5.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: military_bases (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'usaa-cashback-rewards-plus-american-express-card'),
  'military_bases',
  2.0,
  'multiplier',
  '2.0x points on military_bases',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'usaa-cashback-rewards-plus-american-express-card'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);


-- Card 166/203: Upgrade Cash Rewards Visa
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'upgrade-cash-rewards-visa',
  'Upgrade Cash Rewards Visa',
  'Upgrade',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  1.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_166_id


-- Card 167/203: Capital One Venture X Business
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'capital-one-venture-x-business',
  'Capital One Venture X Business',
  'Capital One',
  'Capital One Miles',
  'airline_miles',
  1.35,
  395.0,
  2.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_167_id

-- Category reward: hotels (10.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-venture-x-business'),
  'hotels',
  10.0,
  'multiplier',
  '10.0x points on hotels',
  false,
  NOW(),
  NOW()
);

-- Category reward: car_rentals (10.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-venture-x-business'),
  'car_rentals',
  10.0,
  'multiplier',
  '10.0x points on car_rentals',
  false,
  NOW(),
  NOW()
);

-- Category reward: flights (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-venture-x-business'),
  'flights',
  5.0,
  'multiplier',
  '5.0x points on flights',
  false,
  NOW(),
  NOW()
);

-- Signup bonus: 150000 points
INSERT INTO signup_bonuses (
  card_id, bonus_amount, bonus_currency,
  spend_requirement, timeframe_days, is_active
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'capital-one-venture-x-business'),
  150000,
  'airline_miles',
  20000,
  90,
  true
);


-- Card 168/203: Alliant Cashback Visa Signature
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'alliant-cashback-visa-signature',
  'Alliant Cashback Visa Signature',
  'Alliant Credit Union',
  'Cashback',
  'cashback',
  1.35,
  99.0,
  2.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_168_id


-- Card 169/203: Affinity Federal Credit Union Cash Rewards Visa Signature
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'affinity-federal-credit-union-cash-rewards-visa-signature',
  'Affinity Federal Credit Union Cash Rewards Visa Signature',
  'Affinity FCU',
  'Cashback',
  'cashback',
  1.35,
  49.0,
  1.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_169_id

-- Category reward: gas (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'affinity-federal-credit-union-cash-rewards-visa-signature'),
  'gas',
  3.0,
  'multiplier',
  '3.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'affinity-federal-credit-union-cash-rewards-visa-signature'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);


-- Card 170/203: Discover it Student Cash Back
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'discover-it-student-cash-back',
  'Discover it Student Cash Back',
  'Discover',
  'Discover Cashback',
  'cashback',
  1.35,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_170_id

-- Category reward: rotating (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'discover-it-student-cash-back'),
  'rotating',
  5.0,
  'multiplier',
  '5.0x points on rotating',
  false,
  NOW(),
  NOW()
);


-- Card 171/203: Discover it Student Chrome
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'discover-it-student-chrome',
  'Discover it Student Chrome',
  'Discover',
  'Discover Cashback',
  'cashback',
  1.35,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_171_id

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'discover-it-student-chrome'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'discover-it-student-chrome'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);


-- Card 172/203: Bank of America Student Cash Rewards Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'bank-of-america-student-cash-rewards-credit-card',
  'Bank of America Student Cash Rewards Credit Card',
  'Bank of America',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_172_id

-- Category reward: choice_category (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bank-of-america-student-cash-rewards-credit-card'),
  'choice_category',
  3.0,
  'multiplier',
  '3.0x points on choice_category',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bank-of-america-student-cash-rewards-credit-card'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);


-- Card 173/203: Capital One Quicksilver Student Cash Rewards Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'capital-one-quicksilver-student-cash-rewards-credit-card',
  'Capital One Quicksilver Student Cash Rewards Credit Card',
  'Capital One',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  1.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_173_id


-- Card 174/203: Chase Freedom Student credit card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'chase-freedom-student-credit-card',
  'Chase Freedom Student credit card',
  'Chase',
  'Chase Ultimate Rewards',
  'points',
  2.7675,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_174_id

-- Category reward: rotating (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'chase-freedom-student-credit-card'),
  'rotating',
  5.0,
  'multiplier',
  '5.0x points on rotating',
  false,
  NOW(),
  NOW()
);

-- Category reward: drugstores (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'chase-freedom-student-credit-card'),
  'drugstores',
  3.0,
  'multiplier',
  '3.0x points on drugstores',
  false,
  NOW(),
  NOW()
);


-- Card 175/203: Journey Student Rewards from Capital One
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'journey-student-rewards-from-capital-one',
  'Journey Student Rewards from Capital One',
  'Capital One',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_175_id


-- Card 176/203: Discover it Secured Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'discover-it-secured-credit-card',
  'Discover it Secured Credit Card',
  'Discover',
  'Discover Cashback',
  'cashback',
  1.35,
  0.0,
  2.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_176_id

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'discover-it-secured-credit-card'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'discover-it-secured-credit-card'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);


-- Card 177/203: Capital One Platinum Secured Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'capital-one-platinum-secured-credit-card',
  'Capital One Platinum Secured Credit Card',
  'Capital One',
  'None',
  'points',
  0.0,
  0.0,
  0.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_177_id


-- Card 178/203: Citi Secured Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'citi-secured-mastercard',
  'Citi Secured Mastercard',
  'Citi',
  'None',
  'points',
  0.0,
  0.0,
  0.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_178_id


-- Card 179/203: Uber Visa Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'uber-visa-card',
  'Uber Visa Card',
  'Barclays',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_179_id

-- Category reward: uber (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'uber-visa-card'),
  'uber',
  5.0,
  'multiplier',
  '5.0x points on uber',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'uber-visa-card'),
  'dining',
  4.0,
  'multiplier',
  '4.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: hotels (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'uber-visa-card'),
  'hotels',
  3.0,
  'multiplier',
  '3.0x points on hotels',
  false,
  NOW(),
  NOW()
);

-- Category reward: airfare (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'uber-visa-card'),
  'airfare',
  3.0,
  'multiplier',
  '3.0x points on airfare',
  false,
  NOW(),
  NOW()
);

-- Category reward: online_shopping (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'uber-visa-card'),
  'online_shopping',
  2.0,
  'multiplier',
  '2.0x points on online_shopping',
  false,
  NOW(),
  NOW()
);


-- Card 180/203: Uber Pro Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'uber-pro-card',
  'Uber Pro Card',
  'Barclays',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  1.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_180_id

-- Category reward: uber (6.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'uber-pro-card'),
  'uber',
  6.0,
  'multiplier',
  '6.0x points on uber',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'uber-pro-card'),
  'gas',
  4.0,
  'multiplier',
  '4.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'uber-pro-card'),
  'dining',
  3.0,
  'multiplier',
  '3.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: phone_plans (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'uber-pro-card'),
  'phone_plans',
  2.0,
  'multiplier',
  '2.0x points on phone_plans',
  false,
  NOW(),
  NOW()
);


-- Card 181/203: Rakuten Visa Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'rakuten-visa-card',
  'Rakuten Visa Card',
  'Synchrony Bank',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_181_id

-- Category reward: rakuten (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rakuten-visa-card'),
  'rakuten',
  3.0,
  'multiplier',
  '3.0x points on rakuten',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rakuten-visa-card'),
  'dining',
  3.0,
  'multiplier',
  '3.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: drugstores (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'rakuten-visa-card'),
  'drugstores',
  2.0,
  'multiplier',
  '2.0x points on drugstores',
  false,
  NOW(),
  NOW()
);


-- Card 182/203: Macy's American Express Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'macys-american-express-card',
  'Macy''s American Express Card',
  'Citibank',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_182_id

-- Category reward: macys (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'macys-american-express-card'),
  'macys',
  5.0,
  'multiplier',
  '5.0x points on macys',
  false,
  NOW(),
  NOW()
);

-- Category reward: restaurants (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'macys-american-express-card'),
  'restaurants',
  2.0,
  'multiplier',
  '2.0x points on restaurants',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'macys-american-express-card'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'macys-american-express-card'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);


-- Card 183/203: Kohl's Charge Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'kohls-charge-card',
  'Kohl''s Charge Card',
  'Capital One',
  'None',
  'points',
  0.0,
  0.0,
  0.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_183_id


-- Card 184/203: Nordstrom Visa Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'nordstrom-visa-card',
  'Nordstrom Visa Card',
  'TD Bank',
  'Nordstrom Rewards',
  'points',
  0.675,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_184_id

-- Category reward: nordstrom (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'nordstrom-visa-card'),
  'nordstrom',
  3.0,
  'multiplier',
  '3.0x points on nordstrom',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'nordstrom-visa-card'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'nordstrom-visa-card'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);


-- Card 185/203: Gap Visa Signature Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'gap-visa-signature-card',
  'Gap Visa Signature Card',
  'Synchrony Bank',
  'None',
  'points',
  0.0,
  0.0,
  0.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_185_id

-- Category reward: gap (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'gap-visa-signature-card'),
  'gap',
  5.0,
  'multiplier',
  '5.0x points on gap',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'gap-visa-signature-card'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'gap-visa-signature-card'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);


-- Card 186/203: Bank of America Business Advantage Cash Rewards Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'bank-of-america-business-advantage-cash-rewards-mastercard',
  'Bank of America Business Advantage Cash Rewards Mastercard',
  'Bank of America',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_186_id

-- Category reward: choice_category (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bank-of-america-business-advantage-cash-rewards-mastercard'),
  'choice_category',
  3.0,
  'multiplier',
  '3.0x points on choice_category',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bank-of-america-business-advantage-cash-rewards-mastercard'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: office_supplies (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bank-of-america-business-advantage-cash-rewards-mastercard'),
  'office_supplies',
  2.0,
  'multiplier',
  '2.0x points on office_supplies',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'bank-of-america-business-advantage-cash-rewards-mastercard'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);


-- Card 187/203: Wells Fargo Business Platinum Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'wells-fargo-business-platinum-credit-card',
  'Wells Fargo Business Platinum Credit Card',
  'Wells Fargo',
  'None',
  'points',
  0.0,
  0.0,
  0.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_187_id


-- Card 188/203: Discover it Business Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'discover-it-business-card',
  'Discover it Business Card',
  'Discover',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  1.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_188_id


-- Card 189/203: U.S. Bank Business Triple Cash Rewards World Elite Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'u.s.-bank-business-triple-cash-rewards-world-elite-mastercard',
  'U.S. Bank Business Triple Cash Rewards World Elite Mastercard',
  'U.S. Bank',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_189_id

-- Category reward: choice_category (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'u.s.-bank-business-triple-cash-rewards-world-elite-mastercard'),
  'choice_category',
  3.0,
  'multiplier',
  '3.0x points on choice_category',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'u.s.-bank-business-triple-cash-rewards-world-elite-mastercard'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: office_supplies (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'u.s.-bank-business-triple-cash-rewards-world-elite-mastercard'),
  'office_supplies',
  2.0,
  'multiplier',
  '2.0x points on office_supplies',
  false,
  NOW(),
  NOW()
);


-- Card 190/203: Brex Card for Startups
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'brex-card-for-startups',
  'Brex Card for Startups',
  'Brex',
  'Brex Points',
  'points',
  1.35,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_190_id

-- Category reward: software (7.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'brex-card-for-startups'),
  'software',
  7.0,
  'multiplier',
  '7.0x points on software',
  false,
  NOW(),
  NOW()
);

-- Category reward: advertising (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'brex-card-for-startups'),
  'advertising',
  4.0,
  'multiplier',
  '4.0x points on advertising',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'brex-card-for-startups'),
  'dining',
  3.0,
  'multiplier',
  '3.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: travel (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'brex-card-for-startups'),
  'travel',
  2.0,
  'multiplier',
  '2.0x points on travel',
  false,
  NOW(),
  NOW()
);


-- Card 191/203: Choice Privileges Visa Signature Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'choice-privileges-visa-signature-card',
  'Choice Privileges Visa Signature Card',
  'Barclays',
  'Choice Privileges',
  'points',
  0.81,
  0.0,
  3.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_191_id

-- Category reward: choice_hotels (10.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'choice-privileges-visa-signature-card'),
  'choice_hotels',
  10.0,
  'multiplier',
  '10.0x points on choice_hotels',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'choice-privileges-visa-signature-card'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'choice-privileges-visa-signature-card'),
  'groceries',
  2.0,
  'multiplier',
  '2.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: utilities (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'choice-privileges-visa-signature-card'),
  'utilities',
  2.0,
  'multiplier',
  '2.0x points on utilities',
  false,
  NOW(),
  NOW()
);


-- Card 192/203: Best Western Rewards Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'best-western-rewards-mastercard',
  'Best Western Rewards Mastercard',
  'Barclays',
  'Best Western Rewards',
  'points',
  0.8775000000000001,
  0.0,
  3.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_192_id

-- Category reward: best_western (10.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'best-western-rewards-mastercard'),
  'best_western',
  10.0,
  'multiplier',
  '10.0x points on best_western',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'best-western-rewards-mastercard'),
  'gas',
  5.0,
  'multiplier',
  '5.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'best-western-rewards-mastercard'),
  'groceries',
  3.0,
  'multiplier',
  '3.0x points on groceries',
  false,
  NOW(),
  NOW()
);


-- Card 193/203: Wyndham Rewards Earner Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'wyndham-rewards-earner-card',
  'Wyndham Rewards Earner Card',
  'Barclays',
  'Wyndham Rewards',
  'points',
  1.4850000000000003,
  95.0,
  2.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_193_id

-- Category reward: wyndham (8.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'wyndham-rewards-earner-card'),
  'wyndham',
  8.0,
  'multiplier',
  '8.0x points on wyndham',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'wyndham-rewards-earner-card'),
  'gas',
  4.0,
  'multiplier',
  '4.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: supermarkets (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'wyndham-rewards-earner-card'),
  'supermarkets',
  4.0,
  'multiplier',
  '4.0x points on supermarkets',
  false,
  NOW(),
  NOW()
);

-- Category reward: utilities (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'wyndham-rewards-earner-card'),
  'utilities',
  4.0,
  'multiplier',
  '4.0x points on utilities',
  false,
  NOW(),
  NOW()
);


-- Card 194/203: Alaska Airlines Visa Business Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'alaska-airlines-visa-business-card',
  'Alaska Airlines Visa Business Card',
  'Bank of America',
  'Alaska Mileage Plan',
  'airline_miles',
  2.43,
  95.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_194_id

-- Category reward: alaska (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'alaska-airlines-visa-business-card'),
  'alaska',
  3.0,
  'multiplier',
  '3.0x points on alaska',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'alaska-airlines-visa-business-card'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: shipping (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'alaska-airlines-visa-business-card'),
  'shipping',
  2.0,
  'multiplier',
  '2.0x points on shipping',
  false,
  NOW(),
  NOW()
);

-- Category reward: advertising (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'alaska-airlines-visa-business-card'),
  'advertising',
  2.0,
  'multiplier',
  '2.0x points on advertising',
  false,
  NOW(),
  NOW()
);


-- Card 195/203: JetBlue Business Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'jetblue-business-card',
  'JetBlue Business Card',
  'Barclays',
  'JetBlue TrueBlue',
  'points',
  1.8225000000000002,
  99.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_195_id

-- Category reward: jetblue (6.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'jetblue-business-card'),
  'jetblue',
  6.0,
  'multiplier',
  '6.0x points on jetblue',
  false,
  NOW(),
  NOW()
);

-- Category reward: office_supplies (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'jetblue-business-card'),
  'office_supplies',
  2.0,
  'multiplier',
  '2.0x points on office_supplies',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'jetblue-business-card'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'jetblue-business-card'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: advertising (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'jetblue-business-card'),
  'advertising',
  2.0,
  'multiplier',
  '2.0x points on advertising',
  false,
  NOW(),
  NOW()
);


-- Card 196/203: Hawaiian Airlines World Elite Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'hawaiian-airlines-world-elite-mastercard',
  'Hawaiian Airlines World Elite Mastercard',
  'Barclays',
  'HawaiianMiles',
  'airline_miles',
  1.62,
  99.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_196_id

-- Category reward: hawaiian (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'hawaiian-airlines-world-elite-mastercard'),
  'hawaiian',
  3.0,
  'multiplier',
  '3.0x points on hawaiian',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'hawaiian-airlines-world-elite-mastercard'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'hawaiian-airlines-world-elite-mastercard'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: supermarkets (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'hawaiian-airlines-world-elite-mastercard'),
  'supermarkets',
  2.0,
  'multiplier',
  '2.0x points on supermarkets',
  false,
  NOW(),
  NOW()
);


-- Card 197/203: Spirit Airlines World Elite Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'spirit-airlines-world-elite-mastercard',
  'Spirit Airlines World Elite Mastercard',
  'Bank of America',
  'Spirit Airlines Miles',
  'airline_miles',
  1.08,
  69.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_197_id

-- Category reward: spirit (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'spirit-airlines-world-elite-mastercard'),
  'spirit',
  5.0,
  'multiplier',
  '5.0x points on spirit',
  false,
  NOW(),
  NOW()
);

-- Category reward: gas (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'spirit-airlines-world-elite-mastercard'),
  'gas',
  2.0,
  'multiplier',
  '2.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (2.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'spirit-airlines-world-elite-mastercard'),
  'dining',
  2.0,
  'multiplier',
  '2.0x points on dining',
  false,
  NOW(),
  NOW()
);


-- Card 198/203: Frontier Airlines World Mastercard
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'frontier-airlines-world-mastercard',
  'Frontier Airlines World Mastercard',
  'Barclays',
  'Frontier Miles',
  'airline_miles',
  0.945,
  99.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_198_id

-- Category reward: frontier (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'frontier-airlines-world-mastercard'),
  'frontier',
  5.0,
  'multiplier',
  '5.0x points on frontier',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'frontier-airlines-world-mastercard'),
  'dining',
  3.0,
  'multiplier',
  '3.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: drugstores (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'frontier-airlines-world-mastercard'),
  'drugstores',
  3.0,
  'multiplier',
  '3.0x points on drugstores',
  false,
  NOW(),
  NOW()
);


-- Card 199/203: Brex 30 Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'brex-30-card',
  'Brex 30 Card',
  'Brex',
  'Brex Points',
  'points',
  1.35,
  0.0,
  3.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_199_id

-- Category reward: rideshare (8.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'brex-30-card'),
  'rideshare',
  8.0,
  'multiplier',
  '8.0x points on rideshare',
  false,
  NOW(),
  NOW()
);

-- Category reward: flights (7.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'brex-30-card'),
  'flights',
  7.0,
  'multiplier',
  '7.0x points on flights',
  false,
  NOW(),
  NOW()
);

-- Category reward: hotels (6.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'brex-30-card'),
  'hotels',
  6.0,
  'multiplier',
  '6.0x points on hotels',
  false,
  NOW(),
  NOW()
);

-- Category reward: dining (4.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'brex-30-card'),
  'dining',
  4.0,
  'multiplier',
  '4.0x points on dining',
  false,
  NOW(),
  NOW()
);

-- Category reward: software (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'brex-30-card'),
  'software',
  3.0,
  'multiplier',
  '3.0x points on software',
  false,
  NOW(),
  NOW()
);


-- Card 200/203: Ramp Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'ramp-card',
  'Ramp Card',
  'Ramp',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  1.5,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_200_id


-- Card 201/203: Connexus Aspire Visa Signature
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'connexus-aspire-visa-signature',
  'Connexus Aspire Visa Signature',
  'Connexus Credit Union',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  2.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_201_id

-- Category reward: gas (5.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'connexus-aspire-visa-signature'),
  'gas',
  5.0,
  'multiplier',
  '5.0x points on gas',
  false,
  NOW(),
  NOW()
);

-- Category reward: groceries (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'connexus-aspire-visa-signature'),
  'groceries',
  3.0,
  'multiplier',
  '3.0x points on groceries',
  false,
  NOW(),
  NOW()
);

-- Category reward: utilities (3.0x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'connexus-aspire-visa-signature'),
  'utilities',
  3.0,
  'multiplier',
  '3.0x points on utilities',
  false,
  NOW(),
  NOW()
);


-- Card 202/203: SoFi Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'sofi-credit-card',
  'SoFi Credit Card',
  'SoFi',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  2.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_202_id


-- Card 203/203: Petal 2 Visa Credit Card
INSERT INTO cards (
  card_key, name, issuer, reward_program, reward_currency,
  point_valuation, annual_fee, base_reward_rate, base_reward_unit,
  is_active, created_at, updated_at
) VALUES (
  'petal-2-visa-credit-card',
  'Petal 2 Visa Credit Card',
  'WebBank',
  'Cashback',
  'cashback',
  1.35,
  0.0,
  1.0,
  'multiplier',
  true,
  NOW(),
  NOW()
) RETURNING id;  -- Store this as card_203_id

-- Category reward: choice_category (1.5x)
INSERT INTO category_rewards (
  card_id, category, multiplier, reward_unit, description,
  has_spend_limit, created_at, updated_at
) VALUES (
  (SELECT id FROM cards WHERE card_key = 'petal-2-visa-credit-card'),
  'choice_category',
  1.5,
  'multiplier',
  '1.5x points on choice_category',
  false,
  NOW(),
  NOW()
);


-- Commit transaction
COMMIT;

-- ====================================================================
-- Import complete: 203 cards
-- ====================================================================