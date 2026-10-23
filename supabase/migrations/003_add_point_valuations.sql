-- ============================================================================
-- Point Valuations Migration
-- Adds reward programs and their redemption valuations
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- DROP EXISTING TABLES (if they exist from failed migrations)
-- ============================================================================

DROP TABLE IF EXISTS point_valuations CASCADE;
DROP TABLE IF EXISTS reward_programs CASCADE;

-- ============================================================================
-- REWARD PROGRAMS TABLE
-- Master list of all reward programs (Aeroplan, Scene+, etc.)
-- ============================================================================

CREATE TABLE reward_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_name VARCHAR(200) UNIQUE NOT NULL,
    program_key VARCHAR(100) UNIQUE NOT NULL,
    program_category VARCHAR(50) NOT NULL,  -- 'Airline Miles', 'Credit Card Points', 'Hotel Points', 'Cashback'
    program_type VARCHAR(50) NOT NULL,  -- 'airline', 'credit_card', 'hotel', 'cashback'
    unit VARCHAR(50) NOT NULL,  -- 'per point', 'per mile', 'percent'
    direct_rate_cents DECIMAL(6,3),  -- Direct/baseline redemption value in cents
    optimal_rate_cents DECIMAL(6,3),  -- Best possible redemption value in cents
    optimal_method VARCHAR(200),  -- Description of how to achieve optimal rate
    issuer VARCHAR(100),
    country VARCHAR(50) DEFAULT 'Canada',
    redemption_methods TEXT,  -- Comma-separated list of redemption options
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_programs_category ON reward_programs(program_category);
CREATE INDEX idx_programs_key ON reward_programs(program_key);

COMMENT ON TABLE reward_programs IS 'Master list of reward programs (Aeroplan, Scene+, etc.)';
COMMENT ON COLUMN reward_programs.program_category IS 'Airline Miles, Credit Card Points, Hotel Points, or Cashback';
COMMENT ON COLUMN reward_programs.program_type IS 'airline, credit_card, hotel, or cashback';
COMMENT ON COLUMN reward_programs.unit IS 'per point, per mile, or percent';
COMMENT ON COLUMN reward_programs.direct_rate_cents IS 'Direct/baseline redemption value in CAD cents';
COMMENT ON COLUMN reward_programs.optimal_rate_cents IS 'Best possible redemption value in CAD cents';
COMMENT ON COLUMN reward_programs.optimal_method IS 'Description of how to achieve optimal rate';

-- ============================================================================
-- POINT VALUATIONS TABLE
-- Redemption-specific valuations for each program
-- ============================================================================

CREATE TABLE point_valuations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES reward_programs(id) ON DELETE CASCADE,
    redemption_type VARCHAR(100) NOT NULL,
    cents_per_point DECIMAL(6,3) NOT NULL,
    minimum_redemption INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_valuations_program ON point_valuations(program_id);
CREATE INDEX idx_valuations_type ON point_valuations(redemption_type);

COMMENT ON TABLE point_valuations IS 'Redemption-specific valuations for reward programs';
COMMENT ON COLUMN point_valuations.redemption_type IS 'travel, statement, merchandise, transfer, flight, upgrade, etc.';
COMMENT ON COLUMN point_valuations.cents_per_point IS 'Value in CAD cents per point/mile';

-- ============================================================================
-- INSERT REWARD PROGRAMS
-- ============================================================================

INSERT INTO reward_programs (program_name, program_key, program_category, program_type, unit, direct_rate_cents, optimal_rate_cents, optimal_method, issuer, country, redemption_methods) VALUES
    ('Air Miles - Cash Miles', 'air-miles-cash', 'Airline Miles', 'airline', 'per mile', 10.53, 16.07, 'Flight redemptions', 'Air Miles', 'Canada', 'Cash Miles (direct), Dream Miles (flights), Merchandise'),
    ('Air Miles - Dream Miles', 'air-miles-dream', 'Airline Miles', 'airline', 'per mile', 9.0, 16.07, 'Flight redemptions', 'Air Miles', 'Canada', 'Flights, Hotels, Car rentals, Merchandise'),
    ('Aeroplan', 'aeroplan', 'Airline Miles', 'airline', 'per point', 1.0, 2.0, 'Points + Cash bookings', 'Air Canada', 'Canada', 'Points-only flights, Points + Cash (hybrid), Hotels, Car rentals, Statement credits'),
    ('WestJet Rewards', 'westjet-rewards', 'Airline Miles', 'airline', 'per point', 1.0, 1.0, 'Flight redemptions only', 'WestJet', 'Canada', 'Flight redemptions, Taxes and fees, Gift cards, Merchandise'),
    ('Capital One Miles', 'capital-one-miles', 'Airline Miles', 'airline', 'per mile', 0.75, 2.0, 'Transfer partners', 'Capital One', 'Canada (US Card)', 'Statement credit/cash, Travel portal, Transfer partners, Amazon/PayPal'),
    ('American Express Membership Rewards', 'amex-mr', 'Credit Card Points', 'credit_card', 'per point', 1.0, 2.1, 'Transfer to Aeroplan', 'American Express', 'Canada', 'Statement Credit, Transfer to Aeroplan, Amazon, PayPal, Gift cards'),
    ('RBC Avion Rewards', 'rbc-avion', 'Credit Card Points', 'credit_card', 'per point', 1.0, 1.14, 'Elite tier flight redemptions', 'Royal Bank of Canada (RBC)', 'Canada', 'Flight redemptions, Hotels, Car rentals, Statement credit (Premium tier)'),
    ('CIBC Aventura Points', 'cibc-aventura', 'Credit Card Points', 'credit_card', 'per point', 0.62, 1.0, 'Travel redemptions', 'Canadian Imperial Bank of Commerce (CIBC)', 'Canada', 'Travel purchases, Financial products, Gift cards, Merchandise, Statement credits'),
    ('Scotiabank Scene+ Points', 'scene-plus', 'Credit Card Points', 'credit_card', 'per point', 0.67, 1.0, 'Travel redemptions', 'Scotiabank', 'Canada', 'Travel, Entertainment/Movies, Statement credit, Merchandise'),
    ('BMO Rewards Points', 'bmo-rewards', 'Credit Card Points', 'credit_card', 'per point', 0.67, 0.67, 'Fixed value across all categories', 'Bank of Montreal (BMO)', 'Canada', 'Travel, Investment deposits, Gift cards, Statement credit, Merchandise'),
    ('TD Rewards Points', 'td-rewards', 'Credit Card Points', 'credit_card', 'per point', 0.25, 0.5, 'Expedia Travel Portal', 'Toronto-Dominion Bank (TD)', 'Canada', 'Expedia travel portal, Statement credit, Gift cards, Merchandise'),
    ('Tangerine Money-Back Rewards', 'tangerine-money-back', 'Cashback', 'cashback', 'percent', 2.0, 2.5, 'Direct cashback deposit', 'Tangerine', 'Canada', 'Direct deposit to account, Guaranteed 2% in 2 categories, 3% with savings'),
    ('Accor Live Limitless (ALL)', 'accor-all', 'Hotel Points', 'hotel', 'per point', 2.7, 2.7, 'Fixed value redemption', 'Accor Hotels', 'Canada', 'Hotel stays (fixed value), Airline partner transfers (30+ airlines)'),
    ('World of Hyatt', 'world-of-hyatt', 'Hotel Points', 'hotel', 'per point', 2.2, 2.2, 'Dynamic pricing', 'Hyatt Hotels', 'Canada', 'Hotel stays, Suite upgrades, Experiences'),
    ('Marriott Bonvoy', 'marriott-bonvoy', 'Hotel Points', 'hotel', 'per point', 0.74, 2.2, 'Cash + Points on premium properties', 'Marriott International', 'Canada', 'Hotel stays (dynamic), Cash + Points, Experience packages, Airline transfers'),
    ('IHG One Rewards', 'ihg-one-rewards', 'Hotel Points', 'hotel', 'per point', 0.7, 0.7, 'Variable by property', 'InterContinental Hotels Group (IHG)', 'Canada', 'Hotel stays (variable), Points & Cash, Experiences, Shopping'),
    ('Best Western Rewards', 'best-western-rewards', 'Hotel Points', 'hotel', 'per point', 0.5, 0.8, 'Elite status bonuses (up to 30%)', 'Best Western Hotels & Resorts', 'Canada', 'Hotel stays, Elite Bonus (Platinum), Elite Bonus (Diamond), Gift Cards'),
    ('Hilton Honors', 'hilton-honors', 'Hotel Points', 'hotel', 'per point', 0.48, 0.48, 'Dynamic pricing', 'Hilton Hotels & Resorts', 'Canada', 'Hotel stays (dynamic), Experiences, Merchandise')
ON CONFLICT (program_key) DO NOTHING;

-- ============================================================================
-- INSERT POINT VALUATIONS
-- ============================================================================

-- Air Miles - Cash Miles (3 valuations)
INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Cash Miles', 10.53, 95, 'Direct cash conversion: 95 miles = $10 CAD'
FROM reward_programs WHERE program_key = 'air-miles-cash';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Dream Miles - Flights', 16.07, NULL, 'Average redemption value on flight bookings'
FROM reward_programs WHERE program_key = 'air-miles-cash';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Dream Miles - Merchandise', 9.0, NULL, 'Merchandise and shopping redemptions'
FROM reward_programs WHERE program_key = 'air-miles-cash';

-- Air Miles - Dream Miles (3 valuations)
INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Flights', 16.07, NULL, 'Flight redemptions average value'
FROM reward_programs WHERE program_key = 'air-miles-dream';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Hotels', 12.0, NULL, 'Hotel stay redemptions'
FROM reward_programs WHERE program_key = 'air-miles-dream';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Merchandise', 9.0, NULL, 'Merchandise redemptions'
FROM reward_programs WHERE program_key = 'air-miles-dream';

-- Accor Live Limitless (2 valuations)
INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Hotel Stays (Fixed)', 2.7, 2000, 'Fixed value: 2000 points = €40 CAD (~$59 CAD)'
FROM reward_programs WHERE program_key = 'accor-all';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Airline Transfer', 2.7, NULL, 'Transfer to 30+ airline partners at 1:1 ratio'
FROM reward_programs WHERE program_key = 'accor-all';

-- World of Hyatt (2 valuations)
INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Hotel Stays', 2.2, NULL, 'Dynamic pricing - varies by property and season'
FROM reward_programs WHERE program_key = 'world-of-hyatt';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Suite Upgrades', 2.2, NULL, 'Suite upgrade redemptions'
FROM reward_programs WHERE program_key = 'world-of-hyatt';

-- American Express Membership Rewards (4 valuations)
INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Statement Credit', 1.0, 1000, '1000 points = $10 statement credit'
FROM reward_programs WHERE program_key = 'amex-mr';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Transfer to Aeroplan', 2.1, NULL, '1:1 transfer to Aeroplan valued at ~2.1 cents'
FROM reward_programs WHERE program_key = 'amex-mr';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Amazon', 0.7, 1000, '1000 points = $7 Amazon credit'
FROM reward_programs WHERE program_key = 'amex-mr';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'PayPal', 0.7, 1000, '1000 points = $7 PayPal credit'
FROM reward_programs WHERE program_key = 'amex-mr';

-- RBC Avion Rewards (4 valuations)
INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Statement Credit (Premium)', 1.0, 100, '100 points = $1 CAD'
FROM reward_programs WHERE program_key = 'rbc-avion';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Statement Credit (Elite)', 1.0, NULL, '1 point = 1 cent CAD'
FROM reward_programs WHERE program_key = 'rbc-avion';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Flight Redemptions', 1.14, NULL, 'Average value on flight bookings'
FROM reward_programs WHERE program_key = 'rbc-avion';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Hotels', 1.0, NULL, 'Hotel booking redemptions'
FROM reward_programs WHERE program_key = 'rbc-avion';

-- Aeroplan (4 valuations)
INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Statement Credit', 1.0, NULL, 'Direct cash conversion to statement'
FROM reward_programs WHERE program_key = 'aeroplan';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Points Only Flights', 1.0, NULL, 'Flight redemption baseline value'
FROM reward_programs WHERE program_key = 'aeroplan';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Points + Cash (80% Points)', 2.0, NULL, 'Hybrid booking at 80% points tier'
FROM reward_programs WHERE program_key = 'aeroplan';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Points + Cash (60% Points)', 2.0, NULL, 'Hybrid booking at 60% points tier'
FROM reward_programs WHERE program_key = 'aeroplan';

-- CIBC Aventura Points (4 valuations)
INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Travel Purchases', 1.0, NULL, 'Travel redemptions at 1 cent per point'
FROM reward_programs WHERE program_key = 'cibc-aventura';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Financial Products', 0.83, NULL, 'Financial product redemptions'
FROM reward_programs WHERE program_key = 'cibc-aventura';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Gift Cards', 0.71, NULL, 'Gift card redemptions'
FROM reward_programs WHERE program_key = 'cibc-aventura';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Statement Credit', 0.62, NULL, 'Direct statement credit conversion'
FROM reward_programs WHERE program_key = 'cibc-aventura';

-- WestJet Rewards (3 valuations)
INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Flight Redemptions', 1.0, 2500, 'Minimum 2500 points = $25 off'
FROM reward_programs WHERE program_key = 'westjet-rewards';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Taxes and Fees', 0.91, NULL, 'Offset against booking taxes/fees'
FROM reward_programs WHERE program_key = 'westjet-rewards';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Gift Cards', 0.5, NULL, 'Gift card redemption value'
FROM reward_programs WHERE program_key = 'westjet-rewards';

-- Scotiabank Scene+ Points (3 valuations)
INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Travel', 1.0, NULL, 'Travel bookings redemption'
FROM reward_programs WHERE program_key = 'scene-plus';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Entertainment/Movies', 0.75, NULL, 'Entertainment redemptions'
FROM reward_programs WHERE program_key = 'scene-plus';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Statement Credit', 0.67, NULL, 'Direct statement credit'
FROM reward_programs WHERE program_key = 'scene-plus';

-- BMO Rewards Points (4 valuations)
INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Travel', 0.67, 150, '150 points = $1 on travel'
FROM reward_programs WHERE program_key = 'bmo-rewards';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Investment Deposits', 0.67, 150, '150 points = $1 investment deposit'
FROM reward_programs WHERE program_key = 'bmo-rewards';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Gift Cards', 0.5, 180, '180-220 points = $1 gift card'
FROM reward_programs WHERE program_key = 'bmo-rewards';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Statement Credit', 0.67, NULL, 'Fixed statement credit rate'
FROM reward_programs WHERE program_key = 'bmo-rewards';

-- Capital One Miles (4 valuations)
INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Statement Credit', 0.75, NULL, 'Cash back as statement credit (0.5-1 cent range)'
FROM reward_programs WHERE program_key = 'capital-one-miles';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Travel Portal', 1.0, NULL, 'Capital One travel portal redemption'
FROM reward_programs WHERE program_key = 'capital-one-miles';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Transfer Partners', 2.0, NULL, 'Transfer to airline partners (up to 2 cents)'
FROM reward_programs WHERE program_key = 'capital-one-miles';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Amazon', 0.8, NULL, 'Amazon redemption value'
FROM reward_programs WHERE program_key = 'capital-one-miles';

-- Marriott Bonvoy (3 valuations)
INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Hotel Stays (Dynamic)', 0.74, NULL, 'Average dynamic pricing across properties'
FROM reward_programs WHERE program_key = 'marriott-bonvoy';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Cash + Points (Standard)', 2.2, NULL, 'Hybrid booking implicit rate'
FROM reward_programs WHERE program_key = 'marriott-bonvoy';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Cash + Points (Premium)', 2.2, NULL, 'Cash + Points on luxury properties'
FROM reward_programs WHERE program_key = 'marriott-bonvoy';

-- IHG One Rewards (2 valuations)
INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Hotel Stays', 0.7, 5000, 'Minimum 5000 points for entry-level properties'
FROM reward_programs WHERE program_key = 'ihg-one-rewards';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Points & Cash', 0.7, NULL, 'Hybrid booking combining points and cash'
FROM reward_programs WHERE program_key = 'ihg-one-rewards';

-- Best Western Rewards (4 valuations)
INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Hotel Stays', 0.65, NULL, 'Average redemption (0.5-0.8 range)'
FROM reward_programs WHERE program_key = 'best-western-rewards';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Elite Bonus (Platinum)', 0.75, NULL, 'With Platinum elite status (+15% bonus)'
FROM reward_programs WHERE program_key = 'best-western-rewards';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Elite Bonus (Diamond)', 0.85, NULL, 'With Diamond elite status (+30% bonus)'
FROM reward_programs WHERE program_key = 'best-western-rewards';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Gift Cards', 0.5, NULL, 'Gift card redemption (16000 points = $50)'
FROM reward_programs WHERE program_key = 'best-western-rewards';

-- Hilton Honors (2 valuations)
INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Hotel Stays (Dynamic)', 0.48, NULL, 'Dynamic pricing average (0.0063-0.0104 range)'
FROM reward_programs WHERE program_key = 'hilton-honors';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Experiences', 0.48, NULL, 'Experience redemptions'
FROM reward_programs WHERE program_key = 'hilton-honors';

-- TD Rewards Points (3 valuations)
INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Expedia Travel Portal', 0.5, 200, '200-250 points = $1 travel'
FROM reward_programs WHERE program_key = 'td-rewards';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Statement Credit', 0.25, 400, '400 points = $1 statement credit'
FROM reward_programs WHERE program_key = 'td-rewards';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Gift Cards', 0.25, NULL, '0.25 cents per point on gift cards'
FROM reward_programs WHERE program_key = 'td-rewards';

-- Tangerine Money-Back Rewards (2 valuations)
INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Direct Deposit (2%)', 2.0, NULL, 'Automatic 2% cashback in 2 categories'
FROM reward_programs WHERE program_key = 'tangerine-money-back';

INSERT INTO point_valuations (program_id, redemption_type, cents_per_point, minimum_redemption, notes)
SELECT id, 'Direct Deposit (3%)', 2.5, NULL, '3% with linked savings account'
FROM reward_programs WHERE program_key = 'tangerine-money-back';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE reward_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_valuations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access to reward_programs"
  ON reward_programs FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous read access to point_valuations"
  ON point_valuations FOR SELECT
  TO anon
  USING (true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify total count (should be 18 programs)
-- SELECT COUNT(*) as total_programs FROM reward_programs;

-- Verify total count (should be 62 valuations)
-- SELECT COUNT(*) as total_valuations FROM point_valuations;

-- View all valuations with program names
-- SELECT 
--   rp.program_name,
--   rp.category,
--   pv.redemption_type,
--   pv.cents_per_point,
--   pv.minimum_redemption,
--   pv.notes
-- FROM point_valuations pv
-- LEFT JOIN reward_programs rp ON pv.program_id = rp.id
-- ORDER BY rp.program_name, pv.cents_per_point DESC;
