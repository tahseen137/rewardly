# Cycle 2 Architecture Document

**Date:** February 13, 2026  
**Author:** VP of Engineering  
**Status:** Ready for Implementation  
**Predecessor:** Cycle 1 (10 features, 674 tests, all green)

---

## Table of Contents

1. [Overview](#overview)
2. [Database Migration](#database-migration)
3. [Feature Architectures](#feature-architectures)
   - [F11: Location-Based Card Recommendations](#f11-location-based-card-recommendations)
   - [F12: Loyalty Points Aggregator](#f12-loyalty-points-aggregator)
   - [F14: Receipt Scanner & Categorization](#f14-receipt-scanner--categorization)
   - [F15: Achievements & Badges System](#f15-achievements--badges-system)
   - [F16: Credit Card Application Tracker (5/24)](#f16-credit-card-application-tracker-524)
   - [F18: Voice Commands (Siri/Google)](#f18-voice-commands-sirigoogle)
   - [F19: Apple Wallet Passes](#f19-apple-wallet-passes)
   - [F20: Bill Payment Tracker & Reminders](#f20-bill-payment-tracker--reminders)
4. [Implementation Order](#implementation-order)
5. [Task Breakdown](#task-breakdown)
6. [Test Plan](#test-plan)
7. [Integration Points](#integration-points)
8. [Risk Assessment](#risk-assessment)

---

## Overview

This document provides build-ready architecture for 8 features in Cycle 2. All code follows existing patterns established in Cycle 1:

- **Services**: Module-level singleton with async `initialize()`, local cache + Supabase sync
- **Screens**: Functional components with `useMemo` styles, `useCallback` handlers
- **Navigation**: React Navigation native stack, InsightsStack pattern
- **Tier gating**: `LockedFeature` component with `canAccessFeatureSync()`
- **i18n**: Keys in `src/i18n/locales/en.json` (and fr.json)
- **Database**: RLS policies per user, UUID primary keys, CASCADE deletes

**Feature Summary:**

| ID | Feature | Complexity | Tier |
|----|---------|-----------|------|
| F16 | Application Tracker (5/24) | S | Pro |
| F20 | Bill Payment Tracker | S | Free/Pro |
| F15 | Achievements & Badges | S | Free/Pro |
| F12 | Loyalty Points Aggregator | M | Free/Pro |
| F14 | Receipt Scanner | M | Pro/Max |
| F18 | Voice Commands | M | Pro |
| F19 | Apple Wallet Passes | M | Free/Pro |
| F11 | Location Recommendations | L | Pro |

---

## Database Migration

**File:** `supabase/migrations/017_cycle2_features.sql`

```sql
-- ============================================================================
-- Migration: 017_cycle2_features.sql
-- Description: Cycle 2 features - Location recommendations, Loyalty aggregator,
--              Receipt scanner, Achievements, Application tracker, Voice,
--              Apple Wallet, Bill payments
-- Author: Dev Team
-- Date: 2026-02-13
-- ============================================================================

-- ============================================================================
-- F11: Location-Based Card Recommendations
-- ============================================================================

-- Predefined merchant locations (admin-managed)
CREATE TABLE IF NOT EXISTS merchant_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_name VARCHAR(200) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL, -- maps to SpendingCategory
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_merchant_locations_category ON merchant_locations(category);
CREATE INDEX IF NOT EXISTS idx_merchant_locations_active ON merchant_locations(is_active);

-- Public read access
ALTER TABLE merchant_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read merchant locations" ON merchant_locations
    FOR SELECT USING (true);

-- User location preferences
CREATE TABLE IF NOT EXISTS user_location_prefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    radius_meters INTEGER DEFAULT 500 CHECK (radius_meters IN (100, 500, 1000)),
    quiet_hours_start TIME, -- e.g., 22:00
    quiet_hours_end TIME,   -- e.g., 08:00
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_user_location_prefs UNIQUE (user_id)
);

ALTER TABLE user_location_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own location prefs" ON user_location_prefs
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- F12: Loyalty Points Aggregator
-- ============================================================================

-- Predefined loyalty programs (admin-managed)
CREATE TABLE IF NOT EXISTS loyalty_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_name VARCHAR(200) NOT NULL UNIQUE,
    program_type VARCHAR(50) NOT NULL CHECK (program_type IN (
        'airline', 'hotel', 'retail', 'bank', 'coalition'
    )),
    currency_name VARCHAR(100) NOT NULL, -- "Aeroplan Points", "PC Optimum Points"
    logo_url TEXT,
    website_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Point valuations (admin-managed, can be updated)
CREATE TABLE IF NOT EXISTS point_valuations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    cents_per_point DECIMAL(6,4) NOT NULL, -- e.g., 1.6 for Aeroplan
    valuation_method VARCHAR(100), -- "average redemption", "optimal transfer"
    last_updated DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_program_valuation UNIQUE (program_id)
);

-- Transfer partners between programs
CREATE TABLE IF NOT EXISTS loyalty_transfer_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    target_program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    transfer_ratio DECIMAL(5,3) NOT NULL, -- e.g., 1.0 = 1:1, 0.8 = 5:4
    transfer_time VARCHAR(100), -- "Instant", "24-48 hours"
    minimum_transfer INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_transfer_pair UNIQUE (source_program_id, target_program_id)
);

-- Public read access for program data
ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transfer_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read loyalty programs" ON loyalty_programs
    FOR SELECT USING (true);

CREATE POLICY "Public read point valuations" ON point_valuations
    FOR SELECT USING (true);

CREATE POLICY "Public read transfer partners" ON loyalty_transfer_partners
    FOR SELECT USING (true);

-- User loyalty accounts (user-managed)
CREATE TABLE IF NOT EXISTS user_loyalty_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    member_number VARCHAR(100), -- optional
    current_balance INTEGER NOT NULL DEFAULT 0,
    expiry_date DATE, -- optional, for expiring points
    last_balance_update TIMESTAMPTZ DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_user_program UNIQUE (user_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_user_loyalty_user ON user_loyalty_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_program ON user_loyalty_accounts(program_id);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_expiry ON user_loyalty_accounts(expiry_date);

ALTER TABLE user_loyalty_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own loyalty accounts" ON user_loyalty_accounts
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- F14: Receipt Scanner & Categorization
-- ============================================================================

CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    merchant_name VARCHAR(200),
    amount DECIMAL(10,2),
    transaction_date DATE,
    card_used VARCHAR(100), -- card_key (last 4 digits matched)
    card_last_four VARCHAR(4),
    optimal_card VARCHAR(100), -- card_key
    rewards_earned DECIMAL(10,4),
    rewards_missed DECIMAL(10,4),
    category VARCHAR(50), -- detected SpendingCategory
    image_url TEXT, -- Supabase storage URL
    ocr_data JSONB DEFAULT '{}'::jsonb, -- raw OCR response
    ocr_confidence DECIMAL(5,2), -- 0-100 confidence score
    is_verified BOOLEAN DEFAULT false, -- user verified data
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receipts_user ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_merchant ON receipts(merchant_name);
CREATE INDEX IF NOT EXISTS idx_receipts_card ON receipts(card_used);

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own receipts" ON receipts
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- F15: Achievements & Badges System
-- ============================================================================

-- Predefined achievements (admin-managed)
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    achievement_key VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'savings_starter'
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'savings', 'streak', 'feature_usage', 'collection', 'points', 'special'
    )),
    icon_name VARCHAR(50) NOT NULL, -- lucide icon name
    points_value INTEGER DEFAULT 0, -- gamification points
    requirement_type VARCHAR(50) NOT NULL, -- 'count', 'threshold', 'boolean'
    requirement_value INTEGER NOT NULL, -- target value to unlock
    tier VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'max')),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- User achievements (progress + unlocks)
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    current_progress INTEGER DEFAULT 0,
    is_unlocked BOOLEAN DEFAULT false,
    unlocked_at TIMESTAMPTZ,
    last_progress_update TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked ON user_achievements(is_unlocked);

-- Weekly challenges (auto-rotated)
CREATE TABLE IF NOT EXISTS weekly_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_key VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    target_value INTEGER NOT NULL,
    reward_points INTEGER DEFAULT 50,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_challenges_active ON weekly_challenges(is_active, start_date, end_date);

-- User challenge progress
CREATE TABLE IF NOT EXISTS user_challenge_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES weekly_challenges(id) ON DELETE CASCADE,
    current_progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_user_challenge UNIQUE (user_id, challenge_id)
);

-- RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read achievements" ON achievements
    FOR SELECT USING (true);

CREATE POLICY "Users manage own achievements" ON user_achievements
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public read weekly challenges" ON weekly_challenges
    FOR SELECT USING (true);

CREATE POLICY "Users manage own challenge progress" ON user_challenge_progress
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- F16: Credit Card Application Tracker (5/24)
-- ============================================================================

CREATE TABLE IF NOT EXISTS card_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    issuer VARCHAR(100) NOT NULL, -- Chase, Amex, RBC, etc.
    card_name VARCHAR(200) NOT NULL,
    application_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN (
        'pending', 'approved', 'denied', 'cancelled'
    )),
    credit_limit DECIMAL(12,2),
    hard_pull_bureau VARCHAR(50), -- 'equifax', 'transunion', 'both', 'none'
    annual_fee DECIMAL(10,2),
    signup_bonus_value INTEGER, -- points/dollars
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_card_applications_user ON card_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_card_applications_date ON card_applications(application_date DESC);
CREATE INDEX IF NOT EXISTS idx_card_applications_issuer ON card_applications(issuer);
CREATE INDEX IF NOT EXISTS idx_card_applications_status ON card_applications(status);

ALTER TABLE card_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own applications" ON card_applications
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- F19: Apple Wallet Passes
-- ============================================================================

CREATE TABLE IF NOT EXISTS wallet_passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_id VARCHAR(100) NOT NULL, -- card_key
    pass_type VARCHAR(20) NOT NULL CHECK (pass_type IN ('apple', 'google')),
    pass_serial VARCHAR(100) NOT NULL UNIQUE, -- unique pass identifier
    device_tokens TEXT[] DEFAULT '{}', -- registered devices for updates
    last_updated TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    pass_data JSONB DEFAULT '{}'::jsonb, -- cached pass content
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_passes_user ON wallet_passes(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_passes_card ON wallet_passes(card_id);
CREATE INDEX IF NOT EXISTS idx_wallet_passes_serial ON wallet_passes(pass_serial);
CREATE INDEX IF NOT EXISTS idx_wallet_passes_active ON wallet_passes(is_active);

ALTER TABLE wallet_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own wallet passes" ON wallet_passes
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- F20: Bill Payment Tracker & Reminders
-- ============================================================================

CREATE TABLE IF NOT EXISTS bill_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_id VARCHAR(100) NOT NULL, -- card_key
    due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
    reminder_days_before INTEGER[] DEFAULT '{3, 7}'::INTEGER[], -- days before due date
    has_autopay BOOLEAN DEFAULT false,
    minimum_payment DECIMAL(10,2),
    statement_balance DECIMAL(10,2),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_user_card_bill UNIQUE (user_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_bill_schedules_user ON bill_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_bill_schedules_due ON bill_schedules(due_day);

CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_id VARCHAR(100) NOT NULL, -- card_key
    payment_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_type VARCHAR(30) NOT NULL CHECK (payment_type IN (
        'minimum', 'full', 'partial', 'autopay'
    )),
    was_late BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_history_user ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_card ON payment_history(card_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_date ON payment_history(payment_date DESC);

ALTER TABLE bill_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own bill schedules" ON bill_schedules
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own payment history" ON payment_history
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- Update Triggers
-- ============================================================================

DROP TRIGGER IF EXISTS update_merchant_locations_updated_at ON merchant_locations;
CREATE TRIGGER update_merchant_locations_updated_at
    BEFORE UPDATE ON merchant_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_location_prefs_updated_at ON user_location_prefs;
CREATE TRIGGER update_user_location_prefs_updated_at
    BEFORE UPDATE ON user_location_prefs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_point_valuations_updated_at ON point_valuations;
CREATE TRIGGER update_point_valuations_updated_at
    BEFORE UPDATE ON point_valuations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_loyalty_accounts_updated_at ON user_loyalty_accounts;
CREATE TRIGGER update_user_loyalty_accounts_updated_at
    BEFORE UPDATE ON user_loyalty_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_receipts_updated_at ON receipts;
CREATE TRIGGER update_receipts_updated_at
    BEFORE UPDATE ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_achievements_updated_at ON user_achievements;
CREATE TRIGGER update_user_achievements_updated_at
    BEFORE UPDATE ON user_achievements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_challenge_progress_updated_at ON user_challenge_progress;
CREATE TRIGGER update_user_challenge_progress_updated_at
    BEFORE UPDATE ON user_challenge_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_card_applications_updated_at ON card_applications;
CREATE TRIGGER update_card_applications_updated_at
    BEFORE UPDATE ON card_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bill_schedules_updated_at ON bill_schedules;
CREATE TRIGGER update_bill_schedules_updated_at
    BEFORE UPDATE ON bill_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Update notifications table with new types
-- ============================================================================

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
        'sub_deadline', 
        'fee_renewal', 
        'bonus_category', 
        'monthly_report', 
        'new_card_offer',
        'spending_alert',
        'general',
        -- Cycle 2 types
        'location_recommendation',
        'points_expiring',
        'receipt_mismatch',
        'achievement_unlocked',
        'application_velocity',
        'bill_payment_due',
        'challenge_ending'
    ));

-- ============================================================================
-- Grants
-- ============================================================================

GRANT SELECT ON merchant_locations TO authenticated;
GRANT ALL ON user_location_prefs TO authenticated;
GRANT SELECT ON loyalty_programs TO authenticated;
GRANT SELECT ON point_valuations TO authenticated;
GRANT SELECT ON loyalty_transfer_partners TO authenticated;
GRANT ALL ON user_loyalty_accounts TO authenticated;
GRANT ALL ON receipts TO authenticated;
GRANT SELECT ON achievements TO authenticated;
GRANT ALL ON user_achievements TO authenticated;
GRANT SELECT ON weekly_challenges TO authenticated;
GRANT ALL ON user_challenge_progress TO authenticated;
GRANT ALL ON card_applications TO authenticated;
GRANT ALL ON wallet_passes TO authenticated;
GRANT ALL ON bill_schedules TO authenticated;
GRANT ALL ON payment_history TO authenticated;

-- ============================================================================
-- Done
-- ============================================================================
```

---

## Seed Data

**File:** `supabase/seed/017_cycle2_seed.sql`

```sql
-- ============================================================================
-- Seed Data for Cycle 2 Features
-- ============================================================================

-- ============================================================================
-- F11: Merchant Locations (Top 50 Canadian Chains)
-- ============================================================================

INSERT INTO merchant_locations (chain_name, display_name, category, logo_url) VALUES
-- Groceries
('loblaws', 'Loblaws', 'groceries', '/logos/loblaws.png'),
('nofrills', 'No Frills', 'groceries', '/logos/nofrills.png'),
('realcanadiansuperstore', 'Real Canadian Superstore', 'groceries', '/logos/superstore.png'),
('metro', 'Metro', 'groceries', '/logos/metro.png'),
('sobeys', 'Sobeys', 'groceries', '/logos/sobeys.png'),
('freshco', 'FreshCo', 'groceries', '/logos/freshco.png'),
('foodbasics', 'Food Basics', 'groceries', '/logos/foodbasics.png'),
('walmart', 'Walmart', 'groceries', '/logos/walmart.png'),
('costco', 'Costco', 'groceries', '/logos/costco.png'),
('wholefoodsmarket', 'Whole Foods', 'groceries', '/logos/wholefoods.png'),

-- Dining
('timhortons', 'Tim Hortons', 'dining', '/logos/timhortons.png'),
('starbucks', 'Starbucks', 'dining', '/logos/starbucks.png'),
('mcdonalds', 'McDonald''s', 'dining', '/logos/mcdonalds.png'),
('subway', 'Subway', 'dining', '/logos/subway.png'),
('bostonpizza', 'Boston Pizza', 'dining', '/logos/bostonpizza.png'),
('moxies', 'Moxie''s', 'dining', '/logos/moxies.png'),
('milestones', 'Milestones', 'dining', '/logos/milestones.png'),
('kelseys', 'Kelsey''s', 'dining', '/logos/kelseys.png'),
('harveys', 'Harvey''s', 'dining', '/logos/harveys.png'),
('marybrownschicken', 'Mary Brown''s', 'dining', '/logos/marybrowns.png'),

-- Gas
('petro-canada', 'Petro-Canada', 'gas', '/logos/petrocanada.png'),
('esso', 'Esso', 'gas', '/logos/esso.png'),
('shell', 'Shell', 'gas', '/logos/shell.png'),
('canadiantire', 'Canadian Tire Gas+', 'gas', '/logos/ctgas.png'),
('costcogas', 'Costco Gas', 'gas', '/logos/costcogas.png'),

-- Drugstores
('shoppersdrugmart', 'Shoppers Drug Mart', 'drugstores', '/logos/shoppers.png'),
('rexall', 'Rexall', 'drugstores', '/logos/rexall.png'),
('pharmasave', 'Pharmasave', 'drugstores', '/logos/pharmasave.png'),
('londondrugs', 'London Drugs', 'drugstores', '/logos/londondrugs.png'),
('jeancoutu', 'Jean Coutu', 'drugstores', '/logos/jeancoutu.png'),

-- Home Improvement
('canadiantire', 'Canadian Tire', 'home_improvement', '/logos/canadiantire.png'),
('homedepot', 'Home Depot', 'home_improvement', '/logos/homedepot.png'),
('lowes', 'Lowe''s', 'home_improvement', '/logos/lowes.png'),
('rona', 'RONA', 'home_improvement', '/logos/rona.png'),
('homehardware', 'Home Hardware', 'home_improvement', '/logos/homehardware.png'),

-- Entertainment
('cineplex', 'Cineplex', 'entertainment', '/logos/cineplex.png'),
('indigo', 'Indigo', 'entertainment', '/logos/indigo.png'),
('bestbuy', 'Best Buy', 'entertainment', '/logos/bestbuy.png'),
('thesource', 'The Source', 'entertainment', '/logos/thesource.png'),
('ebgames', 'EB Games', 'entertainment', '/logos/ebgames.png'),

-- Online Shopping (general)
('amazon', 'Amazon.ca', 'online_shopping', '/logos/amazon.png'),

-- Travel
('aircanada', 'Air Canada', 'travel', '/logos/aircanada.png'),
('westjet', 'WestJet', 'travel', '/logos/westjet.png'),
('marriott', 'Marriott Hotels', 'travel', '/logos/marriott.png'),
('hilton', 'Hilton Hotels', 'travel', '/logos/hilton.png'),
('enterprise', 'Enterprise', 'travel', '/logos/enterprise.png'),
('budget', 'Budget', 'travel', '/logos/budget.png'),
('hertz', 'Hertz', 'travel', '/logos/hertz.png'),
('viarail', 'VIA Rail', 'travel', '/logos/viarail.png'),
('airbnb', 'Airbnb', 'travel', '/logos/airbnb.png'),
('booking', 'Booking.com', 'travel', '/logos/booking.png')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- F12: Loyalty Programs & Valuations
-- ============================================================================

INSERT INTO loyalty_programs (program_name, program_type, currency_name, logo_url, website_url) VALUES
-- Airlines
('Aeroplan', 'airline', 'Aeroplan Points', '/logos/aeroplan.png', 'https://aeroplan.com'),
('Air Miles', 'coalition', 'Air Miles', '/logos/airmiles.png', 'https://airmiles.ca'),
('WestJet Rewards', 'airline', 'WestJet Dollars', '/logos/westjet.png', 'https://westjet.com'),

-- Retail Coalition
('PC Optimum', 'coalition', 'PC Optimum Points', '/logos/pcoptimum.png', 'https://pcoptimum.ca'),
('Scene+', 'coalition', 'Scene+ Points', '/logos/sceneplus.png', 'https://sceneplus.ca'),
('Triangle Rewards', 'retail', 'Canadian Tire Money', '/logos/triangle.png', 'https://triangle.com'),

-- Bank Programs
('RBC Avion Points', 'bank', 'Avion Points', '/logos/rbc.png', 'https://rbcrewards.com'),
('TD Rewards', 'bank', 'TD Points', '/logos/td.png', 'https://td.com'),
('CIBC Aventura', 'bank', 'Aventura Points', '/logos/cibc.png', 'https://cibc.com'),
('Scotiabank Scene+', 'bank', 'Scene+ Points', '/logos/scotiabank.png', 'https://scotiabank.com'),
('BMO Rewards', 'bank', 'BMO Points', '/logos/bmo.png', 'https://bmo.com'),
('Amex Membership Rewards', 'bank', 'MR Points', '/logos/amex.png', 'https://americanexpress.com'),

-- Hotels
('Marriott Bonvoy', 'hotel', 'Bonvoy Points', '/logos/marriott.png', 'https://marriott.com'),
('Hilton Honors', 'hotel', 'Hilton Points', '/logos/hilton.png', 'https://hilton.com'),
('World of Hyatt', 'hotel', 'Hyatt Points', '/logos/hyatt.png', 'https://hyatt.com'),
('IHG Rewards', 'hotel', 'IHG Points', '/logos/ihg.png', 'https://ihg.com')
ON CONFLICT (program_name) DO NOTHING;

-- Point Valuations (in CAD cents per point)
INSERT INTO point_valuations (program_id, cents_per_point, valuation_method, notes)
SELECT id, 1.6, 'average flight redemption', 'Based on economy flights within Canada'
FROM loyalty_programs WHERE program_name = 'Aeroplan'
ON CONFLICT (program_id) DO UPDATE SET cents_per_point = EXCLUDED.cents_per_point;

INSERT INTO point_valuations (program_id, cents_per_point, valuation_method, notes)
SELECT id, 0.1, 'standard grocery redemption', 'Rounded to $10 per 10,000 points'
FROM loyalty_programs WHERE program_name = 'PC Optimum'
ON CONFLICT (program_id) DO UPDATE SET cents_per_point = EXCLUDED.cents_per_point;

INSERT INTO point_valuations (program_id, cents_per_point, valuation_method, notes)
SELECT id, 1.0, 'direct dollar value', 'WestJet dollars = CAD dollars'
FROM loyalty_programs WHERE program_name = 'WestJet Rewards'
ON CONFLICT (program_id) DO UPDATE SET cents_per_point = EXCLUDED.cents_per_point;

INSERT INTO point_valuations (program_id, cents_per_point, valuation_method, notes)
SELECT id, 1.1, 'cash value', 'Dream Miles (95 miles = $10)'
FROM loyalty_programs WHERE program_name = 'Air Miles'
ON CONFLICT (program_id) DO UPDATE SET cents_per_point = EXCLUDED.cents_per_point;

INSERT INTO point_valuations (program_id, cents_per_point, valuation_method, notes)
SELECT id, 1.0, 'standard redemption', '100 points = $1'
FROM loyalty_programs WHERE program_name = 'Scene+'
ON CONFLICT (program_id) DO UPDATE SET cents_per_point = EXCLUDED.cents_per_point;

INSERT INTO point_valuations (program_id, cents_per_point, valuation_method, notes)
SELECT id, 0.4, 'CT money conversion', 'Varies, roughly $1 for 250 points'
FROM loyalty_programs WHERE program_name = 'Triangle Rewards'
ON CONFLICT (program_id) DO UPDATE SET cents_per_point = EXCLUDED.cents_per_point;

INSERT INTO point_valuations (program_id, cents_per_point, valuation_method, notes)
SELECT id, 1.5, 'flight redemption', 'Via Avion portal or transfers'
FROM loyalty_programs WHERE program_name = 'RBC Avion Points'
ON CONFLICT (program_id) DO UPDATE SET cents_per_point = EXCLUDED.cents_per_point;

INSERT INTO point_valuations (program_id, cents_per_point, valuation_method, notes)
SELECT id, 0.6, 'TD expedia portal', 'Best via Expedia for TD'
FROM loyalty_programs WHERE program_name = 'TD Rewards'
ON CONFLICT (program_id) DO UPDATE SET cents_per_point = EXCLUDED.cents_per_point;

INSERT INTO point_valuations (program_id, cents_per_point, valuation_method, notes)
SELECT id, 1.0, 'flight redemption', 'Fixed value for flights'
FROM loyalty_programs WHERE program_name = 'CIBC Aventura'
ON CONFLICT (program_id) DO UPDATE SET cents_per_point = EXCLUDED.cents_per_point;

INSERT INTO point_valuations (program_id, cents_per_point, valuation_method, notes)
SELECT id, 2.0, 'transfer to Aeroplan', 'Best via Aeroplan transfer 1:1'
FROM loyalty_programs WHERE program_name = 'Amex Membership Rewards'
ON CONFLICT (program_id) DO UPDATE SET cents_per_point = EXCLUDED.cents_per_point;

INSERT INTO point_valuations (program_id, cents_per_point, valuation_method, notes)
SELECT id, 0.7, 'hotel night redemption', 'Category 4-5 hotels best value'
FROM loyalty_programs WHERE program_name = 'Marriott Bonvoy'
ON CONFLICT (program_id) DO UPDATE SET cents_per_point = EXCLUDED.cents_per_point;

INSERT INTO point_valuations (program_id, cents_per_point, valuation_method, notes)
SELECT id, 0.5, 'fifth night free', 'Best with 5th night free benefit'
FROM loyalty_programs WHERE program_name = 'Hilton Honors'
ON CONFLICT (program_id) DO UPDATE SET cents_per_point = EXCLUDED.cents_per_point;

INSERT INTO point_valuations (program_id, cents_per_point, valuation_method, notes)
SELECT id, 1.7, 'category 1-4 hotels', 'Great value at lower categories'
FROM loyalty_programs WHERE program_name = 'World of Hyatt'
ON CONFLICT (program_id) DO UPDATE SET cents_per_point = EXCLUDED.cents_per_point;

INSERT INTO point_valuations (program_id, cents_per_point, valuation_method, notes)
SELECT id, 0.5, 'IHG redemptions', 'Average hotel night'
FROM loyalty_programs WHERE program_name = 'IHG Rewards'
ON CONFLICT (program_id) DO UPDATE SET cents_per_point = EXCLUDED.cents_per_point;

-- Transfer Partners
INSERT INTO loyalty_transfer_partners (source_program_id, target_program_id, transfer_ratio, transfer_time, minimum_transfer)
SELECT s.id, t.id, 1.0, 'Instant', 1000
FROM loyalty_programs s, loyalty_programs t
WHERE s.program_name = 'Amex Membership Rewards' AND t.program_name = 'Aeroplan'
ON CONFLICT (source_program_id, target_program_id) DO NOTHING;

INSERT INTO loyalty_transfer_partners (source_program_id, target_program_id, transfer_ratio, transfer_time, minimum_transfer)
SELECT s.id, t.id, 1.0, 'Instant', 1000
FROM loyalty_programs s, loyalty_programs t
WHERE s.program_name = 'Amex Membership Rewards' AND t.program_name = 'Marriott Bonvoy'
ON CONFLICT (source_program_id, target_program_id) DO NOTHING;

INSERT INTO loyalty_transfer_partners (source_program_id, target_program_id, transfer_ratio, transfer_time, minimum_transfer)
SELECT s.id, t.id, 0.4, '24-48 hours', 60000
FROM loyalty_programs s, loyalty_programs t
WHERE s.program_name = 'Marriott Bonvoy' AND t.program_name = 'Aeroplan'
ON CONFLICT (source_program_id, target_program_id) DO NOTHING;

INSERT INTO loyalty_transfer_partners (source_program_id, target_program_id, transfer_ratio, transfer_time, minimum_transfer)
SELECT s.id, t.id, 1.0, 'Instant', 1000
FROM loyalty_programs s, loyalty_programs t
WHERE s.program_name = 'RBC Avion Points' AND t.program_name = 'WestJet Rewards'
ON CONFLICT (source_program_id, target_program_id) DO NOTHING;

-- ============================================================================
-- F15: Achievements (20 predefined)
-- ============================================================================

INSERT INTO achievements (achievement_key, name, description, category, icon_name, points_value, requirement_type, requirement_value, tier, display_order) VALUES
-- Savings milestones
('savings_starter', 'Savings Starter', 'Save $10 in optimized rewards', 'savings', 'piggy-bank', 10, 'threshold', 10, 'free', 1),
('centurion', 'Centurion', 'Save $100 in optimized rewards', 'savings', 'award', 50, 'threshold', 100, 'free', 2),
('rewards_master', 'Rewards Master', 'Save $1,000 in optimized rewards', 'savings', 'crown', 200, 'threshold', 1000, 'free', 3),

-- Streak achievements
('streak_7', '7-Day Streak', 'Use the app 7 days in a row', 'streak', 'flame', 25, 'count', 7, 'free', 10),
('streak_30', '30-Day Streak', 'Use the app 30 days in a row', 'streak', 'zap', 75, 'count', 30, 'free', 11),
('streak_365', '365-Day Streak', 'Use the app every day for a year', 'streak', 'trophy', 500, 'count', 365, 'free', 12),

-- Collection achievements
('card_collector', 'Card Collector', 'Add 5 cards to your wallet', 'collection', 'wallet', 20, 'count', 5, 'free', 20),
('wallet_king', 'Wallet King', 'Add 10 cards to your wallet', 'collection', 'briefcase', 50, 'count', 10, 'free', 21),

-- Feature usage
('sage_whisperer', 'Sage Whisperer', 'Chat with Sage AI 10 times', 'feature_usage', 'message-circle', 30, 'count', 10, 'pro', 30),
('autopilot_ace', 'AutoPilot Ace', 'Enable AutoPilot for smart recommendations', 'feature_usage', 'navigation', 25, 'boolean', 1, 'pro', 31),
('scanner_pro', 'Scanner Pro', 'Scan 10 receipts', 'feature_usage', 'scan', 40, 'count', 10, 'pro', 32),
('optimizer', 'Optimizer', 'Follow 5 card recommendations', 'feature_usage', 'trending-up', 35, 'count', 5, 'free', 33),

-- Points achievements
('points_baron', 'Points Baron', 'Track 10,000 loyalty points', 'points', 'coins', 30, 'threshold', 10000, 'free', 40),
('points_mogul', 'Points Mogul', 'Track 100,000 loyalty points', 'points', 'gem', 100, 'threshold', 100000, 'free', 41),

-- Special achievements
('night_owl', 'Night Owl', 'Use the app after midnight', 'special', 'moon', 15, 'boolean', 1, 'free', 50),
('early_bird', 'Early Bird', 'Use the app before 7am', 'special', 'sun', 15, 'boolean', 1, 'free', 51),
('social_butterfly', 'Social Butterfly', 'Share an achievement on social media', 'special', 'share-2', 20, 'boolean', 1, 'free', 52),
('bug_hunter', 'Bug Hunter', 'Report a bug that gets fixed', 'special', 'bug', 100, 'boolean', 1, 'free', 53),
('og_member', 'OG Member', 'Account older than 1 year', 'special', 'star', 150, 'boolean', 1, 'free', 54),
('referral_champion', 'Referral Champion', 'Refer 3 friends who sign up', 'special', 'users', 75, 'count', 3, 'free', 55)
ON CONFLICT (achievement_key) DO NOTHING;

-- ============================================================================
-- Done
-- ============================================================================
```

---

## Feature Architectures

---

### F11: Location-Based Card Recommendations

**Tier:** Pro (full feature), Free (settings visible but disabled)

#### Files to Create

| Path | Purpose |
|------|---------|
| `src/screens/LocationSettingsScreen.tsx` | Location preferences screen |
| `src/services/LocationService.ts` | Geofencing, merchant matching, notifications |
| `src/components/LocationSettingsCard.tsx` | Settings section component |
| `src/components/NearbyMerchantCard.tsx` | Shows nearby merchant with card recommendation |

#### Files to Modify

| Path | Changes |
|------|---------|
| `src/navigation/AppNavigator.tsx` | Add `LocationSettings` to InsightsStack |
| `src/screens/SettingsScreen.tsx` | Add location settings quick action |
| `src/types/index.ts` | Add `MerchantLocation`, `UserLocationPrefs` types |
| `src/i18n/locales/en.json` | Add location i18n keys |
| `app.json` | Add location permissions |

#### Service Layer

```typescript
// src/services/LocationService.ts

import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';
import { getCurrentUser } from './AuthService';
import { SpendingCategory } from '../types';

const LOCATION_STORAGE_KEY = '@rewardly/location_prefs';
const LOCATION_TASK_NAME = 'REWARDLY_LOCATION_TASK';

// ============================================================================
// Types
// ============================================================================

export interface MerchantLocation {
  id: string;
  chainName: string;
  displayName: string;
  category: SpendingCategory;
  logoUrl?: string;
  isActive: boolean;
}

export interface UserLocationPrefs {
  id: string;
  userId: string;
  isEnabled: boolean;
  radiusMeters: 100 | 500 | 1000;
  quietHoursStart?: string; // "22:00"
  quietHoursEnd?: string;   // "08:00"
}

export interface NearbyMerchant {
  merchant: MerchantLocation;
  distance: number; // meters
  bestCard: string; // card_key
  rewardMultiplier: number;
  rewardDescription: string;
}

// ============================================================================
// State
// ============================================================================

let merchantCache: MerchantLocation[] | null = null;
let prefsCache: UserLocationPrefs | null = null;
let isInitialized = false;

// ============================================================================
// Initialization
// ============================================================================

export async function initializeLocationService(): Promise<void> {
  if (isInitialized) return;
  
  try {
    await loadMerchants();
    await loadPreferences();
    isInitialized = true;
  } catch (error) {
    console.error('[LocationService] Initialization error:', error);
    isInitialized = true;
  }
}

// ============================================================================
// Permissions
// ============================================================================

export async function requestLocationPermission(): Promise<boolean> {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus !== 'granted') return false;
  
  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  return backgroundStatus === 'granted';
}

export async function checkLocationPermission(): Promise<{
  foreground: boolean;
  background: boolean;
}> {
  const foreground = await Location.getForegroundPermissionsAsync();
  const background = await Location.getBackgroundPermissionsAsync();
  
  return {
    foreground: foreground.status === 'granted',
    background: background.status === 'granted',
  };
}

// ============================================================================
// Preferences
// ============================================================================

export async function getLocationPrefs(): Promise<UserLocationPrefs | null> {
  if (!isInitialized) await initializeLocationService();
  return prefsCache;
}

export async function updateLocationPrefs(
  updates: Partial<Omit<UserLocationPrefs, 'id' | 'userId'>>
): Promise<UserLocationPrefs> {
  if (!isInitialized) await initializeLocationService();
  
  const current = prefsCache || getDefaultPrefs();
  const updated: UserLocationPrefs = { ...current, ...updates };
  
  prefsCache = updated;
  await persistPrefs();
  
  // Enable/disable background location based on prefs
  if (updated.isEnabled) {
    await startBackgroundLocation();
  } else {
    await stopBackgroundLocation();
  }
  
  return updated;
}

async function loadPreferences(): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      const user = await getCurrentUser();
      if (user && supabase) {
        const { data } = await supabase
          .from('user_location_prefs')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          prefsCache = transformPrefsFromDB(data);
          return;
        }
      }
    }
    
    const stored = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
    if (stored) {
      prefsCache = JSON.parse(stored);
    }
  } catch {
    prefsCache = null;
  }
}

async function persistPrefs(): Promise<void> {
  if (!prefsCache) return;
  
  await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(prefsCache));
  
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser();
    if (user && supabase) {
      await supabase.from('user_location_prefs').upsert({
        user_id: user.id,
        is_enabled: prefsCache.isEnabled,
        radius_meters: prefsCache.radiusMeters,
        quiet_hours_start: prefsCache.quietHoursStart,
        quiet_hours_end: prefsCache.quietHoursEnd,
      } as any);
    }
  }
}

function getDefaultPrefs(): UserLocationPrefs {
  return {
    id: '',
    userId: '',
    isEnabled: false,
    radiusMeters: 500,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  };
}

function transformPrefsFromDB(row: any): UserLocationPrefs {
  return {
    id: row.id,
    userId: row.user_id,
    isEnabled: row.is_enabled,
    radiusMeters: row.radius_meters,
    quietHoursStart: row.quiet_hours_start,
    quietHoursEnd: row.quiet_hours_end,
  };
}

// ============================================================================
// Merchants
// ============================================================================

export async function getMerchants(): Promise<MerchantLocation[]> {
  if (!isInitialized) await initializeLocationService();
  return merchantCache || [];
}

export async function getMerchantsByCategory(
  category: SpendingCategory
): Promise<MerchantLocation[]> {
  const merchants = await getMerchants();
  return merchants.filter(m => m.category === category);
}

async function loadMerchants(): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    const { data } = await supabase
      .from('merchant_locations')
      .select('*')
      .eq('is_active', true);
    
    if (data) {
      merchantCache = data.map(transformMerchantFromDB);
    }
  }
}

function transformMerchantFromDB(row: any): MerchantLocation {
  return {
    id: row.id,
    chainName: row.chain_name,
    displayName: row.display_name,
    category: row.category as SpendingCategory,
    logoUrl: row.logo_url,
    isActive: row.is_active,
  };
}

// ============================================================================
// Background Location
// ============================================================================

export async function startBackgroundLocation(): Promise<boolean> {
  const permissions = await checkLocationPermission();
  if (!permissions.background) return false;
  
  const isRunning = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  if (isRunning) return true;
  
  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    distanceInterval: 100, // meters
    deferredUpdatesInterval: 60000, // ms
    showsBackgroundLocationIndicator: false,
  });
  
  return true;
}

export async function stopBackgroundLocation(): Promise<void> {
  const isRunning = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
}

// ============================================================================
// Notifications
// ============================================================================

export async function sendLocationNotification(
  merchant: MerchantLocation,
  cardName: string,
  rewardDescription: string
): Promise<void> {
  // Check quiet hours
  const prefs = await getLocationPrefs();
  if (prefs && isInQuietHours(prefs)) return;
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `You're near ${merchant.displayName}`,
      body: `Use your ${cardName} for ${rewardDescription}!`,
      data: { type: 'location_recommendation', merchantId: merchant.id },
    },
    trigger: null, // immediate
  });
}

function isInQuietHours(prefs: UserLocationPrefs): boolean {
  if (!prefs.quietHoursStart || !prefs.quietHoursEnd) return false;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startH, startM] = prefs.quietHoursStart.split(':').map(Number);
  const [endH, endM] = prefs.quietHoursEnd.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  
  if (startMinutes < endMinutes) {
    return currentTime >= startMinutes && currentTime < endMinutes;
  } else {
    // Quiet hours span midnight
    return currentTime >= startMinutes || currentTime < endMinutes;
  }
}

// ============================================================================
// Reset (testing)
// ============================================================================

export function resetLocationCache(): void {
  merchantCache = null;
  prefsCache = null;
  isInitialized = false;
}
```

#### Component Hierarchy

```
LocationSettingsScreen
├── SafeAreaView
│   ├── Header ("Location Recommendations")
│   ├── ScrollView
│   │   ├── ToggleCard (Enable/Disable)
│   │   │   └── Switch with description
│   │   ├── PermissionCard (if not granted)
│   │   │   └── "Grant Permission" button
│   │   ├── RadiusSelector (100m/500m/1km)
│   │   │   └── SegmentedControl
│   │   ├── QuietHoursCard
│   │   │   ├── StartTimePicker
│   │   │   └── EndTimePicker
│   │   └── PreviewSection
│   │       └── MerchantCategoryList
```

**Props & State:**
```typescript
// LocationSettingsScreen
// State: prefs, isLoading, hasPermission

// LocationSettingsCard (reusable in SettingsScreen)
interface LocationSettingsCardProps {
  onNavigate: () => void;
}
```

#### Navigation Wiring

```typescript
// InsightsStackParamList
LocationSettings: undefined;

// SettingsScreen quick action:
navigation.navigate('Insights', { screen: 'LocationSettings' });
```

#### Tier Gating

| Tier | Access |
|------|--------|
| Free | Settings visible but toggle disabled with LockedFeature overlay |
| Pro | Full access |
| Max | Full access |

#### i18n Keys

```json
{
  "location": {
    "title": "Location Recommendations",
    "subtitle": "Get notified with the best card when near stores",
    "enable": "Enable Location Recommendations",
    "enableDesc": "Receive push notifications with optimal card suggestions when near merchants",
    "permission": {
      "title": "Location Permission Required",
      "description": "We need background location access to send you recommendations when you're near stores",
      "grant": "Grant Permission",
      "denied": "Permission denied. Enable in Settings."
    },
    "radius": {
      "title": "Detection Radius",
      "100m": "100m",
      "500m": "500m",
      "1km": "1km"
    },
    "quietHours": {
      "title": "Quiet Hours",
      "description": "No notifications during these hours",
      "start": "Start",
      "end": "End"
    },
    "merchants": {
      "title": "Supported Merchants",
      "description": "We detect these {{count}} Canadian chains"
    },
    "notification": {
      "title": "You're near {{merchant}}",
      "body": "Use your {{card}} for {{reward}}!"
    }
  }
}
```

---

### F12: Loyalty Points Aggregator

**Tier:** Free (view balances), Pro (alerts + optimizer + transfers)

#### Files to Create

| Path | Purpose |
|------|---------|
| `src/screens/LoyaltyDashboardScreen.tsx` | Main loyalty overview |
| `src/screens/LoyaltyProgramScreen.tsx` | Single program detail view |
| `src/services/LoyaltyService.ts` | Programs, balances, valuations |
| `src/components/LoyaltyProgramCard.tsx` | Program balance card |
| `src/components/TransferPartnerCard.tsx` | Transfer partner display |
| `src/components/PointsValueCalculator.tsx` | Redemption value calculator |
| `src/components/AddLoyaltyModal.tsx` | Add program modal |

#### Files to Modify

| Path | Changes |
|------|---------|
| `src/navigation/AppNavigator.tsx` | Add `LoyaltyDashboard`, `LoyaltyProgram` to InsightsStack |
| `src/screens/InsightsHomeScreen.tsx` | Add loyalty quick action card |
| `src/types/index.ts` | Add loyalty types |
| `src/i18n/locales/en.json` | Add loyalty i18n keys |

#### Service Layer

```typescript
// src/services/LoyaltyService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';
import { getCurrentUser } from './AuthService';

const LOYALTY_STORAGE_KEY = '@rewardly/loyalty_accounts';

// ============================================================================
// Types
// ============================================================================

export interface LoyaltyProgram {
  id: string;
  programName: string;
  programType: 'airline' | 'hotel' | 'retail' | 'bank' | 'coalition';
  currencyName: string;
  logoUrl?: string;
  websiteUrl?: string;
  isActive: boolean;
}

export interface PointValuation {
  id: string;
  programId: string;
  centsPerPoint: number;
  valuationMethod?: string;
  lastUpdated: Date;
  notes?: string;
}

export interface TransferPartner {
  id: string;
  sourceProgramId: string;
  targetProgramId: string;
  transferRatio: number; // 1.0 = 1:1
  transferTime?: string;
  minimumTransfer?: number;
  isActive: boolean;
}

export interface UserLoyaltyAccount {
  id: string;
  userId: string;
  programId: string;
  memberNumber?: string;
  currentBalance: number;
  expiryDate?: Date;
  lastBalanceUpdate: Date;
  notes?: string;
}

export interface LoyaltyAccountWithDetails extends UserLoyaltyAccount {
  program: LoyaltyProgram;
  valuation?: PointValuation;
  valueInCad: number;
}

export interface LoyaltySummary {
  totalAccounts: number;
  totalPointsValue: number; // CAD
  expiringPoints: { account: LoyaltyAccountWithDetails; daysUntil: number }[];
  transferOpportunities: TransferOpportunity[];
}

export interface TransferOpportunity {
  fromAccount: LoyaltyAccountWithDetails;
  toProgram: LoyaltyProgram;
  partner: TransferPartner;
  currentValue: number;
  transferredValue: number;
  valueDifference: number;
}

// ============================================================================
// State
// ============================================================================

let programsCache: LoyaltyProgram[] | null = null;
let valuationsCache: Map<string, PointValuation> = new Map();
let transfersCache: TransferPartner[] | null = null;
let accountsCache: UserLoyaltyAccount[] | null = null;
let isInitialized = false;

// ============================================================================
// Initialization
// ============================================================================

export async function initializeLoyaltyService(): Promise<void> {
  if (isInitialized) return;
  
  try {
    await Promise.all([
      loadPrograms(),
      loadValuations(),
      loadTransferPartners(),
      loadUserAccounts(),
    ]);
    isInitialized = true;
  } catch (error) {
    console.error('[LoyaltyService] Initialization error:', error);
    isInitialized = true;
  }
}

// ============================================================================
// Programs (Read-only)
// ============================================================================

export async function getPrograms(): Promise<LoyaltyProgram[]> {
  if (!isInitialized) await initializeLoyaltyService();
  return programsCache || [];
}

export async function getProgramById(id: string): Promise<LoyaltyProgram | null> {
  const programs = await getPrograms();
  return programs.find(p => p.id === id) || null;
}

export async function getProgramsByType(
  type: LoyaltyProgram['programType']
): Promise<LoyaltyProgram[]> {
  const programs = await getPrograms();
  return programs.filter(p => p.programType === type);
}

async function loadPrograms(): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    const { data } = await supabase
      .from('loyalty_programs')
      .select('*')
      .eq('is_active', true);
    
    if (data) {
      programsCache = data.map(transformProgramFromDB);
    }
  }
}

function transformProgramFromDB(row: any): LoyaltyProgram {
  return {
    id: row.id,
    programName: row.program_name,
    programType: row.program_type,
    currencyName: row.currency_name,
    logoUrl: row.logo_url,
    websiteUrl: row.website_url,
    isActive: row.is_active,
  };
}

// ============================================================================
// Valuations (Read-only)
// ============================================================================

export async function getValuation(programId: string): Promise<PointValuation | null> {
  if (!isInitialized) await initializeLoyaltyService();
  return valuationsCache.get(programId) || null;
}

export function calculatePointsValue(
  balance: number,
  centsPerPoint: number
): number {
  return (balance * centsPerPoint) / 100; // Convert to dollars
}

async function loadValuations(): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    const { data } = await supabase
      .from('point_valuations')
      .select('*');
    
    if (data) {
      valuationsCache.clear();
      data.forEach((row: any) => {
        valuationsCache.set(row.program_id, {
          id: row.id,
          programId: row.program_id,
          centsPerPoint: parseFloat(row.cents_per_point),
          valuationMethod: row.valuation_method,
          lastUpdated: new Date(row.last_updated),
          notes: row.notes,
        });
      });
    }
  }
}

// ============================================================================
// Transfer Partners (Read-only)
// ============================================================================

export async function getTransferPartners(): Promise<TransferPartner[]> {
  if (!isInitialized) await initializeLoyaltyService();
  return transfersCache || [];
}

export async function getTransfersFromProgram(
  programId: string
): Promise<TransferPartner[]> {
  const all = await getTransferPartners();
  return all.filter(t => t.sourceProgramId === programId && t.isActive);
}

async function loadTransferPartners(): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    const { data } = await supabase
      .from('loyalty_transfer_partners')
      .select('*')
      .eq('is_active', true);
    
    if (data) {
      transfersCache = data.map((row: any) => ({
        id: row.id,
        sourceProgramId: row.source_program_id,
        targetProgramId: row.target_program_id,
        transferRatio: parseFloat(row.transfer_ratio),
        transferTime: row.transfer_time,
        minimumTransfer: row.minimum_transfer,
        isActive: row.is_active,
      }));
    }
  }
}

// ============================================================================
// User Accounts (CRUD)
// ============================================================================

export async function getUserAccounts(): Promise<LoyaltyAccountWithDetails[]> {
  if (!isInitialized) await initializeLoyaltyService();
  if (!accountsCache) return [];
  
  return Promise.all(
    accountsCache.map(async account => {
      const program = await getProgramById(account.programId);
      const valuation = await getValuation(account.programId);
      
      return {
        ...account,
        program: program!,
        valuation,
        valueInCad: valuation 
          ? calculatePointsValue(account.currentBalance, valuation.centsPerPoint)
          : 0,
      };
    })
  );
}

export async function addLoyaltyAccount(
  account: Omit<UserLoyaltyAccount, 'id' | 'userId' | 'lastBalanceUpdate'>
): Promise<UserLoyaltyAccount> {
  if (!isInitialized) await initializeLoyaltyService();
  
  const newAccount: UserLoyaltyAccount = {
    id: generateId(),
    userId: '',
    lastBalanceUpdate: new Date(),
    ...account,
  };
  
  accountsCache = accountsCache || [];
  accountsCache.push(newAccount);
  
  await persistAccounts();
  
  return newAccount;
}

export async function updateLoyaltyAccount(
  id: string,
  updates: Partial<Omit<UserLoyaltyAccount, 'id' | 'userId'>>
): Promise<UserLoyaltyAccount> {
  if (!isInitialized) await initializeLoyaltyService();
  if (!accountsCache) throw new Error('Accounts not loaded');
  
  const index = accountsCache.findIndex(a => a.id === id);
  if (index === -1) throw new Error(`Account ${id} not found`);
  
  accountsCache[index] = {
    ...accountsCache[index],
    ...updates,
    lastBalanceUpdate: new Date(),
  };
  
  await persistAccounts();
  
  return accountsCache[index];
}

export async function deleteLoyaltyAccount(id: string): Promise<void> {
  if (!isInitialized) await initializeLoyaltyService();
  if (!accountsCache) return;
  
  accountsCache = accountsCache.filter(a => a.id !== id);
  await persistAccounts();
  
  if (isSupabaseConfigured() && supabase) {
    await supabase.from('user_loyalty_accounts').delete().eq('id', id);
  }
}

async function loadUserAccounts(): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      const user = await getCurrentUser();
      if (user && supabase) {
        const { data } = await supabase
          .from('user_loyalty_accounts')
          .select('*')
          .eq('user_id', user.id);
        
        if (data) {
          accountsCache = data.map(transformAccountFromDB);
          return;
        }
      }
    }
    
    const stored = await AsyncStorage.getItem(LOYALTY_STORAGE_KEY);
    if (stored) {
      accountsCache = JSON.parse(stored).map((a: any) => ({
        ...a,
        expiryDate: a.expiryDate ? new Date(a.expiryDate) : undefined,
        lastBalanceUpdate: new Date(a.lastBalanceUpdate),
      }));
    } else {
      accountsCache = [];
    }
  } catch {
    accountsCache = [];
  }
}

async function persistAccounts(): Promise<void> {
  if (!accountsCache) return;
  
  await AsyncStorage.setItem(LOYALTY_STORAGE_KEY, JSON.stringify(accountsCache));
  
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser();
    if (user && supabase) {
      for (const account of accountsCache) {
        await supabase.from('user_loyalty_accounts').upsert({
          id: account.id,
          user_id: user.id,
          program_id: account.programId,
          member_number: account.memberNumber,
          current_balance: account.currentBalance,
          expiry_date: account.expiryDate?.toISOString().split('T')[0],
          notes: account.notes,
        } as any);
      }
    }
  }
}

function transformAccountFromDB(row: any): UserLoyaltyAccount {
  return {
    id: row.id,
    userId: row.user_id,
    programId: row.program_id,
    memberNumber: row.member_number,
    currentBalance: row.current_balance,
    expiryDate: row.expiry_date ? new Date(row.expiry_date) : undefined,
    lastBalanceUpdate: new Date(row.last_balance_update),
    notes: row.notes,
  };
}

// ============================================================================
// Summary & Analysis
// ============================================================================

export async function getLoyaltySummary(): Promise<LoyaltySummary> {
  const accounts = await getUserAccounts();
  
  const totalPointsValue = accounts.reduce((sum, a) => sum + a.valueInCad, 0);
  
  const now = new Date();
  const expiringPoints = accounts
    .filter(a => a.expiryDate)
    .map(a => ({
      account: a,
      daysUntil: Math.ceil((a.expiryDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    }))
    .filter(e => e.daysUntil <= 90 && e.daysUntil > 0)
    .sort((a, b) => a.daysUntil - b.daysUntil);
  
  const transferOpportunities = await calculateTransferOpportunities(accounts);
  
  return {
    totalAccounts: accounts.length,
    totalPointsValue,
    expiringPoints,
    transferOpportunities,
  };
}

async function calculateTransferOpportunities(
  accounts: LoyaltyAccountWithDetails[]
): Promise<TransferOpportunity[]> {
  const opportunities: TransferOpportunity[] = [];
  const allTransfers = await getTransferPartners();
  const programs = await getPrograms();
  
  for (const account of accounts) {
    const transfers = allTransfers.filter(
      t => t.sourceProgramId === account.programId
    );
    
    for (const transfer of transfers) {
      const targetProgram = programs.find(p => p.id === transfer.targetProgramId);
      const targetValuation = await getValuation(transfer.targetProgramId);
      
      if (!targetProgram || !targetValuation || !account.valuation) continue;
      
      const transferredPoints = account.currentBalance * transfer.transferRatio;
      const transferredValue = calculatePointsValue(
        transferredPoints,
        targetValuation.centsPerPoint
      );
      
      const valueDiff = transferredValue - account.valueInCad;
      
      if (valueDiff > 0) {
        opportunities.push({
          fromAccount: account,
          toProgram: targetProgram,
          partner: transfer,
          currentValue: account.valueInCad,
          transferredValue,
          valueDifference: valueDiff,
        });
      }
    }
  }
  
  return opportunities.sort((a, b) => b.valueDifference - a.valueDifference);
}

// ============================================================================
// Utilities
// ============================================================================

function generateId(): string {
  return `loyalty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function resetLoyaltyCache(): void {
  programsCache = null;
  valuationsCache.clear();
  transfersCache = null;
  accountsCache = null;
  isInitialized = false;
}
```

#### Component Hierarchy

```
LoyaltyDashboardScreen
├── SafeAreaView
│   ├── Header ("Loyalty Points")
│   ├── ScrollView
│   │   ├── TotalValueCard
│   │   │   ├── TotalCAD (big number)
│   │   │   └── "Based on current valuations"
│   │   ├── ExpiringPointsAlert (if any) [Pro]
│   │   │   └── WarningCard with expiry countdown
│   │   ├── SectionHeader ("My Programs")
│   │   ├── LoyaltyProgramCard[]
│   │   │   ├── ProgramLogo
│   │   │   ├── BalanceDisplay
│   │   │   ├── CADValue
│   │   │   └── LastUpdated
│   │   ├── TransferOpportunities [Pro]
│   │   │   └── TransferPartnerCard[]
│   │   └── EmptyState (if no accounts)
│   └── FAB (Add Program)
└── AddLoyaltyModal

LoyaltyProgramScreen (detail view)
├── Header (program name)
├── BalanceCard (editable)
├── ValuationInfo
├── TransferPartners (if any)
├── HistorySection
└── DeleteButton
```

**Props & State:**
```typescript
// LoyaltyDashboardScreen
// State: accounts, summary, isLoading, showAddModal

// LoyaltyProgramCard
interface LoyaltyProgramCardProps {
  account: LoyaltyAccountWithDetails;
  onPress: () => void;
  onUpdateBalance: (newBalance: number) => void;
}

// AddLoyaltyModal
interface AddLoyaltyModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (programId: string, balance: number) => void;
  existingProgramIds: string[];
}
```

#### Navigation Wiring

```typescript
// InsightsStackParamList
LoyaltyDashboard: undefined;
LoyaltyProgram: { accountId: string };

// From InsightsHomeScreen:
navigation.navigate('LoyaltyDashboard');

// From LoyaltyDashboardScreen:
navigation.navigate('LoyaltyProgram', { accountId });
```

#### Tier Gating

| Tier | Access |
|------|--------|
| Free | View balances, total value |
| Pro | + Expiring alerts + Transfer optimizer + Redemption calculator |
| Max | Same as Pro |

#### i18n Keys

```json
{
  "loyalty": {
    "title": "Loyalty Points",
    "subtitle": "Track all your reward programs",
    "totalValue": "Total Portfolio Value",
    "basedOn": "Based on current point valuations",
    "myPrograms": "My Programs",
    "addProgram": "Add Program",
    "balance": "Balance",
    "value": "Value",
    "lastUpdated": "Updated {{date}}",
    "updateBalance": "Update Balance",
    "expiring": {
      "title": "Points Expiring Soon",
      "days": "{{days}} days",
      "alert": "{{points}} {{currency}} expire in {{days}} days"
    },
    "transfers": {
      "title": "Transfer Opportunities",
      "description": "Move points for better value",
      "gain": "+${{amount}} potential",
      "ratio": "{{ratio}}:1",
      "time": "{{time}}"
    },
    "calculator": {
      "title": "Redemption Calculator",
      "points": "Points to redeem",
      "value": "Estimated value"
    },
    "empty": {
      "title": "No Programs Added",
      "description": "Add your loyalty programs to track their value",
      "cta": "Add First Program"
    },
    "programs": {
      "aeroplan": "Aeroplan",
      "pcOptimum": "PC Optimum",
      "scenePlus": "Scene+",
      "airMiles": "Air Miles"
    }
  }
}
```

---

### F14: Receipt Scanner & Categorization

**Tier:** Pro (scan + archive), Max (mismatch alerts + missed rewards)

#### Files to Create

| Path | Purpose |
|------|---------|
| `src/screens/ReceiptScannerScreen.tsx` | Camera capture + OCR result |
| `src/screens/ReceiptsHistoryScreen.tsx` | Receipt archive with search |
| `src/services/ReceiptService.ts` | OCR processing, storage, analysis |
| `src/components/ReceiptCard.tsx` | Receipt summary card |
| `src/components/ReceiptMismatchAlert.tsx` | Wrong card warning |
| `supabase/functions/ocr-receipt/index.ts` | Edge function for OCR |

#### Files to Modify

| Path | Changes |
|------|---------|
| `src/navigation/AppNavigator.tsx` | Add `ReceiptScanner`, `ReceiptsHistory` to InsightsStack |
| `src/screens/HomeScreen.tsx` | Add scan receipt quick action |
| `src/types/index.ts` | Add `Receipt` type |
| `src/i18n/locales/en.json` | Add receipt i18n keys |

#### Service Layer

```typescript
// src/services/ReceiptService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { supabase, isSupabaseConfigured } from './supabase';
import { getCurrentUser } from './AuthService';
import { SpendingCategory } from '../types';

const RECEIPTS_STORAGE_KEY = '@rewardly/receipts';

// ============================================================================
// Types
// ============================================================================

export interface Receipt {
  id: string;
  userId: string;
  merchantName?: string;
  amount?: number;
  transactionDate?: Date;
  cardUsed?: string; // card_key
  cardLastFour?: string;
  optimalCard?: string;
  rewardsEarned?: number;
  rewardsMissed?: number;
  category?: SpendingCategory;
  imageUrl?: string;
  ocrData: OCRResult;
  ocrConfidence?: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OCRResult {
  rawText?: string;
  merchantMatches?: string[];
  amountMatches?: number[];
  dateMatches?: string[];
  cardMatches?: string[];
  confidence: number;
}

export interface ReceiptAnalysis {
  wasOptimalCard: boolean;
  rewardsEarned: number;
  rewardsMissed: number;
  optimalCard: string;
  optimalCardName: string;
  differenceExplanation: string;
}

export interface ReceiptFilter {
  startDate?: Date;
  endDate?: Date;
  category?: SpendingCategory;
  hasCardMismatch?: boolean;
}

export interface MissedRewardsSummary {
  totalMissed: number;
  receiptCount: number;
  topMissingCategory: SpendingCategory | null;
  averageMissedPerReceipt: number;
}

// ============================================================================
// State
// ============================================================================

let receiptsCache: Receipt[] | null = null;
let isInitialized = false;

// ============================================================================
// Initialization
// ============================================================================

export async function initializeReceiptService(): Promise<void> {
  if (isInitialized) return;
  
  try {
    await loadReceipts();
    isInitialized = true;
  } catch (error) {
    console.error('[ReceiptService] Initialization error:', error);
    receiptsCache = [];
    isInitialized = true;
  }
}

// ============================================================================
// OCR Processing
// ============================================================================

export async function processReceiptImage(
  imageUri: string
): Promise<{ receipt: Receipt; analysis: ReceiptAnalysis }> {
  if (!isInitialized) await initializeReceiptService();
  
  // Upload image to Supabase Storage
  const imageUrl = await uploadReceiptImage(imageUri);
  
  // Call OCR Edge Function
  const ocrResult = await callOCRFunction(imageUrl || imageUri);
  
  // Create receipt record
  const receipt = await createReceiptFromOCR(ocrResult, imageUrl);
  
  // Analyze for card mismatch
  const analysis = await analyzeReceipt(receipt);
  
  // Update receipt with analysis
  const updatedReceipt = await updateReceipt(receipt.id, {
    optimalCard: analysis.optimalCard,
    rewardsEarned: analysis.rewardsEarned,
    rewardsMissed: analysis.rewardsMissed,
  });
  
  return { receipt: updatedReceipt, analysis };
}

async function callOCRFunction(imageSource: string): Promise<OCRResult> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.functions.invoke('ocr-receipt', {
      body: { imageUrl: imageSource },
    });
    
    if (error) throw error;
    return data as OCRResult;
  }
  
  // Fallback: return empty result
  return { confidence: 0 };
}

async function uploadReceiptImage(localUri: string): Promise<string | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  
  const user = await getCurrentUser();
  if (!user) return null;
  
  const fileName = `${user.id}/${Date.now()}.jpg`;
  const fileData = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  
  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(fileName, decode(fileData), {
      contentType: 'image/jpeg',
    });
  
  if (error) {
    console.error('[ReceiptService] Upload error:', error);
    return null;
  }
  
  const { data: urlData } = supabase.storage
    .from('receipts')
    .getPublicUrl(fileName);
  
  return urlData.publicUrl;
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// ============================================================================
// CRUD Operations
// ============================================================================

export async function getReceipts(
  filter?: ReceiptFilter,
  limit?: number
): Promise<Receipt[]> {
  if (!isInitialized) await initializeReceiptService();
  if (!receiptsCache) return [];
  
  let filtered = [...receiptsCache];
  
  if (filter) {
    if (filter.startDate) {
      filtered = filtered.filter(r => 
        r.transactionDate && r.transactionDate >= filter.startDate!
      );
    }
    if (filter.endDate) {
      filtered = filtered.filter(r => 
        r.transactionDate && r.transactionDate <= filter.endDate!
      );
    }
    if (filter.category) {
      filtered = filtered.filter(r => r.category === filter.category);
    }
    if (filter.hasCardMismatch) {
      filtered = filtered.filter(r => 
        r.cardUsed && r.optimalCard && r.cardUsed !== r.optimalCard
      );
    }
  }
  
  // Sort by date descending
  filtered.sort((a, b) => 
    (b.transactionDate?.getTime() || 0) - (a.transactionDate?.getTime() || 0)
  );
  
  if (limit) {
    filtered = filtered.slice(0, limit);
  }
  
  return filtered;
}

export async function getReceiptById(id: string): Promise<Receipt | null> {
  if (!isInitialized) await initializeReceiptService();
  return receiptsCache?.find(r => r.id === id) || null;
}

async function createReceiptFromOCR(
  ocrResult: OCRResult,
  imageUrl: string | null
): Promise<Receipt> {
  const receipt: Receipt = {
    id: generateId(),
    userId: '',
    merchantName: ocrResult.merchantMatches?.[0],
    amount: ocrResult.amountMatches?.[0],
    transactionDate: ocrResult.dateMatches?.[0] 
      ? new Date(ocrResult.dateMatches[0]) 
      : new Date(),
    cardLastFour: ocrResult.cardMatches?.[0],
    imageUrl: imageUrl || undefined,
    ocrData: ocrResult,
    ocrConfidence: ocrResult.confidence,
    isVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // Match card from last 4 digits (would call CardPortfolioManager)
  if (receipt.cardLastFour) {
    receipt.cardUsed = await matchCardByLastFour(receipt.cardLastFour);
  }
  
  // Detect category from merchant name
  if (receipt.merchantName) {
    receipt.category = await detectCategory(receipt.merchantName);
  }
  
  receiptsCache = receiptsCache || [];
  receiptsCache.push(receipt);
  await persistReceipts();
  
  return receipt;
}

export async function updateReceipt(
  id: string,
  updates: Partial<Omit<Receipt, 'id' | 'userId' | 'createdAt'>>
): Promise<Receipt> {
  if (!isInitialized) await initializeReceiptService();
  if (!receiptsCache) throw new Error('Receipts not loaded');
  
  const index = receiptsCache.findIndex(r => r.id === id);
  if (index === -1) throw new Error(`Receipt ${id} not found`);
  
  receiptsCache[index] = {
    ...receiptsCache[index],
    ...updates,
    updatedAt: new Date(),
  };
  
  await persistReceipts();
  
  return receiptsCache[index];
}

export async function deleteReceipt(id: string): Promise<void> {
  if (!isInitialized) await initializeReceiptService();
  if (!receiptsCache) return;
  
  receiptsCache = receiptsCache.filter(r => r.id !== id);
  await persistReceipts();
  
  if (isSupabaseConfigured() && supabase) {
    await supabase.from('receipts').delete().eq('id', id);
  }
}

export async function verifyReceipt(
  id: string,
  corrections: Partial<Pick<Receipt, 'merchantName' | 'amount' | 'transactionDate' | 'cardUsed' | 'category'>>
): Promise<Receipt> {
  return updateReceipt(id, {
    ...corrections,
    isVerified: true,
  });
}

// ============================================================================
// Analysis
// ============================================================================

export async function analyzeReceipt(receipt: Receipt): Promise<ReceiptAnalysis> {
  // Import RewardsCalculatorService for optimal card calculation
  const { calculateOptimalCard, calculateRewards } = await import('./RewardsCalculatorService');
  
  const amount = receipt.amount || 0;
  const category = receipt.category || 'other' as SpendingCategory;
  
  const optimalCard = await calculateOptimalCard(amount, category);
  const optimalRewards = await calculateRewards(amount, optimalCard, category);
  
  let actualRewards = 0;
  if (receipt.cardUsed) {
    actualRewards = await calculateRewards(amount, receipt.cardUsed, category);
  }
  
  const wasOptimal = receipt.cardUsed === optimalCard;
  const missed = Math.max(0, optimalRewards - actualRewards);
  
  return {
    wasOptimalCard: wasOptimal,
    rewardsEarned: actualRewards,
    rewardsMissed: missed,
    optimalCard,
    optimalCardName: await getCardName(optimalCard),
    differenceExplanation: wasOptimal
      ? 'Great choice! You used the best card.'
      : `Your ${await getCardName(receipt.cardUsed!)} earned $${actualRewards.toFixed(2)}. Using ${await getCardName(optimalCard)} would have earned $${optimalRewards.toFixed(2)}.`,
  };
}

export async function getMissedRewardsSummary(
  filter?: ReceiptFilter
): Promise<MissedRewardsSummary> {
  const receipts = await getReceipts(filter);
  
  const withMismatch = receipts.filter(r => r.rewardsMissed && r.rewardsMissed > 0);
  const totalMissed = withMismatch.reduce((sum, r) => sum + (r.rewardsMissed || 0), 0);
  
  // Find top missing category
  const categoryMissed: Record<string, number> = {};
  withMismatch.forEach(r => {
    if (r.category) {
      categoryMissed[r.category] = (categoryMissed[r.category] || 0) + (r.rewardsMissed || 0);
    }
  });
  
  const topCategory = Object.entries(categoryMissed)
    .sort(([, a], [, b]) => b - a)[0];
  
  return {
    totalMissed,
    receiptCount: withMismatch.length,
    topMissingCategory: (topCategory?.[0] as SpendingCategory) || null,
    averageMissedPerReceipt: withMismatch.length > 0 
      ? totalMissed / withMismatch.length 
      : 0,
  };
}

// ============================================================================
// Helpers
// ============================================================================

async function matchCardByLastFour(lastFour: string): Promise<string | undefined> {
  // Would call CardPortfolioManager.getCards() and match
  return undefined; // Placeholder
}

async function detectCategory(merchantName: string): Promise<SpendingCategory> {
  // Would use merchant location data or basic matching
  return 'other' as SpendingCategory;
}

async function getCardName(cardId: string): Promise<string> {
  // Would call CardDataService
  return cardId;
}

// ============================================================================
// Persistence
// ============================================================================

async function loadReceipts(): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      const user = await getCurrentUser();
      if (user && supabase) {
        const { data } = await supabase
          .from('receipts')
          .select('*')
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: false });
        
        if (data) {
          receiptsCache = data.map(transformReceiptFromDB);
          return;
        }
      }
    }
    
    const stored = await AsyncStorage.getItem(RECEIPTS_STORAGE_KEY);
    if (stored) {
      receiptsCache = JSON.parse(stored).map((r: any) => ({
        ...r,
        transactionDate: r.transactionDate ? new Date(r.transactionDate) : undefined,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
      }));
    } else {
      receiptsCache = [];
    }
  } catch {
    receiptsCache = [];
  }
}

async function persistReceipts(): Promise<void> {
  if (!receiptsCache) return;
  
  await AsyncStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(receiptsCache));
  
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser();
    if (user && supabase) {
      for (const receipt of receiptsCache) {
        await supabase.from('receipts').upsert({
          id: receipt.id,
          user_id: user.id,
          merchant_name: receipt.merchantName,
          amount: receipt.amount,
          transaction_date: receipt.transactionDate?.toISOString().split('T')[0],
          card_used: receipt.cardUsed,
          card_last_four: receipt.cardLastFour,
          optimal_card: receipt.optimalCard,
          rewards_earned: receipt.rewardsEarned,
          rewards_missed: receipt.rewardsMissed,
          category: receipt.category,
          image_url: receipt.imageUrl,
          ocr_data: receipt.ocrData,
          ocr_confidence: receipt.ocrConfidence,
          is_verified: receipt.isVerified,
        } as any);
      }
    }
  }
}

function transformReceiptFromDB(row: any): Receipt {
  return {
    id: row.id,
    userId: row.user_id,
    merchantName: row.merchant_name,
    amount: row.amount ? parseFloat(row.amount) : undefined,
    transactionDate: row.transaction_date ? new Date(row.transaction_date) : undefined,
    cardUsed: row.card_used,
    cardLastFour: row.card_last_four,
    optimalCard: row.optimal_card,
    rewardsEarned: row.rewards_earned ? parseFloat(row.rewards_earned) : undefined,
    rewardsMissed: row.rewards_missed ? parseFloat(row.rewards_missed) : undefined,
    category: row.category,
    imageUrl: row.image_url,
    ocrData: row.ocr_data || { confidence: 0 },
    ocrConfidence: row.ocr_confidence ? parseFloat(row.ocr_confidence) : undefined,
    isVerified: row.is_verified,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function generateId(): string {
  return `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function resetReceiptCache(): void {
  receiptsCache = null;
  isInitialized = false;
}
```

#### Edge Function (OCR)

```typescript
// supabase/functions/ocr-receipt/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OCRResult {
  rawText?: string;
  merchantMatches?: string[];
  amountMatches?: number[];
  dateMatches?: string[];
  cardMatches?: string[];
  confidence: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    
    // Option 1: Use Google Cloud Vision API
    const visionApiKey = Deno.env.get('GOOGLE_VISION_API_KEY');
    if (visionApiKey) {
      const result = await processWithGoogleVision(imageUrl, visionApiKey);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Option 2: Return mock result for development
    const mockResult: OCRResult = {
      rawText: 'LOBLAWS\n123 Main St\nTotal: $47.23\nVISA ****1234\n02/13/2026',
      merchantMatches: ['Loblaws'],
      amountMatches: [47.23],
      dateMatches: ['2026-02-13'],
      cardMatches: ['1234'],
      confidence: 85,
    };
    
    return new Response(JSON.stringify(mockResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processWithGoogleVision(
  imageUrl: string,
  apiKey: string
): Promise<OCRResult> {
  const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
  
  const body = {
    requests: [{
      image: { source: { imageUri: imageUrl } },
      features: [{ type: 'TEXT_DETECTION' }],
    }],
  };
  
  const response = await fetch(visionUrl, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
  
  const data = await response.json();
  const text = data.responses?.[0]?.fullTextAnnotation?.text || '';
  
  return parseReceiptText(text);
}

function parseReceiptText(text: string): OCRResult {
  const result: OCRResult = {
    rawText: text,
    merchantMatches: [],
    amountMatches: [],
    dateMatches: [],
    cardMatches: [],
    confidence: 0,
  };
  
  // Extract amounts (look for $X.XX patterns)
  const amountRegex = /\$(\d+\.?\d*)/g;
  let match;
  while ((match = amountRegex.exec(text)) !== null) {
    result.amountMatches!.push(parseFloat(match[1]));
  }
  
  // Find the largest amount (likely total)
  if (result.amountMatches!.length > 0) {
    result.amountMatches = [Math.max(...result.amountMatches!)];
    result.confidence += 30;
  }
  
  // Extract card last 4 digits
  const cardRegex = /\*{4}(\d{4})|card\s*#?\s*(\d{4})/gi;
  while ((match = cardRegex.exec(text)) !== null) {
    result.cardMatches!.push(match[1] || match[2]);
    result.confidence += 25;
  }
  
  // Extract dates
  const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g;
  while ((match = dateRegex.exec(text)) !== null) {
    const year = match[3].length === 2 ? `20${match[3]}` : match[3];
    result.dateMatches!.push(`${year}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`);
    result.confidence += 20;
  }
  
  // Known merchant patterns (first line often has merchant name)
  const firstLine = text.split('\n')[0]?.trim().toUpperCase();
  const knownMerchants = [
    'LOBLAWS', 'METRO', 'SOBEYS', 'SHOPPERS', 'TIM HORTONS',
    'STARBUCKS', 'MCDONALDS', 'WALMART', 'COSTCO', 'CANADIAN TIRE'
  ];
  
  for (const merchant of knownMerchants) {
    if (text.toUpperCase().includes(merchant)) {
      result.merchantMatches!.push(merchant);
      result.confidence += 25;
      break;
    }
  }
  
  result.confidence = Math.min(result.confidence, 100);
  
  return result;
}
```

#### Component Hierarchy

```
ReceiptScannerScreen
├── SafeAreaView
│   ├── CameraView (expo-camera)
│   │   ├── Overlay (guide frame)
│   │   └── CaptureButton
│   ├── ProcessingState
│   │   └── ActivityIndicator + "Processing..."
│   └── ResultView (after OCR)
│       ├── ReceiptPreview (image thumbnail)
│       ├── ExtractedDataCard
│       │   ├── MerchantRow (editable)
│       │   ├── AmountRow (editable)
│       │   ├── DateRow (editable)
│       │   ├── CardRow (picker)
│       │   └── CategoryRow (picker)
│       ├── ReceiptMismatchAlert (if wrong card)
│       │   └── "You could have earned $X more"
│       ├── ConfirmButton
│       └── RetakeButton

ReceiptsHistoryScreen
├── SearchBar
├── FilterChips (date, category, mismatch only)
├── SummaryCard (total scanned, missed rewards)
├── FlatList
│   └── ReceiptCard[]
│       ├── MerchantName
│       ├── Amount
│       ├── Date
│       ├── CardBadge
│       ├── MismatchIndicator (if applicable)
│       └── SwipeToDelete
```

#### Navigation Wiring

```typescript
// InsightsStackParamList
ReceiptScanner: undefined;
ReceiptsHistory: undefined;
ReceiptDetail: { receiptId: string };

// Access from HomeScreen quick action:
navigation.navigate('Insights', { screen: 'ReceiptScanner' });
```

#### Tier Gating

| Tier | Access |
|------|--------|
| Free | LockedFeature |
| Pro | Scan + archive |
| Max | + Mismatch alerts + Missed rewards calculator |

#### i18n Keys

```json
{
  "receipts": {
    "title": "Receipt Scanner",
    "history": "Receipt History",
    "scan": "Scan Receipt",
    "processing": "Processing receipt...",
    "capture": "Take Photo",
    "retake": "Retake",
    "confirm": "Save Receipt",
    "extracted": {
      "title": "Extracted Data",
      "merchant": "Merchant",
      "amount": "Amount",
      "date": "Date",
      "card": "Card Used",
      "category": "Category",
      "confidence": "{{percent}}% confidence"
    },
    "mismatch": {
      "title": "Wrong Card Used",
      "message": "You paid ${{amount}} at {{merchant}} with {{card}}.",
      "suggestion": "Using {{optimalCard}} would have earned {{difference}} more.",
      "missed": "Missed: ${{amount}}"
    },
    "summary": {
      "scanned": "{{count}} receipts scanned",
      "missed": "${{amount}} in missed rewards"
    },
    "empty": {
      "title": "No Receipts",
      "description": "Scan receipts to track your purchases",
      "cta": "Scan First Receipt"
    },
    "delete": "Delete Receipt",
    "deleteConfirm": "Delete this receipt?"
  }
}
```

---

### F15: Achievements & Badges System

**Tier:** Free (badges + basic), Pro (weekly challenges + detailed progress)

#### Files to Create

| Path | Purpose |
|------|---------|
| `src/screens/AchievementsScreen.tsx` | Badges gallery + progress |
| `src/services/AchievementsService.ts` | Progress tracking, unlock logic |
| `src/components/AchievementBadge.tsx` | Individual badge display |
| `src/components/AchievementUnlockModal.tsx` | Celebration animation |
| `src/components/WeeklyChallengeCard.tsx` | Current challenge progress |
| `src/components/ShareAchievementCard.tsx` | Shareable achievement image |

#### Files to Modify

| Path | Changes |
|------|---------|
| `src/navigation/AppNavigator.tsx` | Add `Achievements` to InsightsStack |
| `src/screens/HomeScreen.tsx` | Add achievements widget |
| `src/types/index.ts` | Add achievement types |
| `src/i18n/locales/en.json` | Add achievement i18n keys |

#### Service Layer

```typescript
// src/services/AchievementsService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';
import { getCurrentUser } from './AuthService';

const ACHIEVEMENTS_STORAGE_KEY = '@rewardly/achievements';
const STREAK_STORAGE_KEY = '@rewardly/streak';

// ============================================================================
// Types
// ============================================================================

export type AchievementCategory = 
  | 'savings' 
  | 'streak' 
  | 'feature_usage' 
  | 'collection' 
  | 'points' 
  | 'special';

export interface Achievement {
  id: string;
  achievementKey: string;
  name: string;
  description: string;
  category: AchievementCategory;
  iconName: string;
  pointsValue: number;
  requirementType: 'count' | 'threshold' | 'boolean';
  requirementValue: number;
  tier: 'free' | 'pro' | 'max';
  isActive: boolean;
  displayOrder: number;
}

export interface UserAchievement {
  id: string;
  oduserId: string;
  achievementId: string;
  currentProgress: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  lastProgressUpdate: Date;
}

export interface AchievementWithProgress extends Achievement {
  userProgress: UserAchievement | null;
  percentComplete: number;
}

export interface WeeklyChallenge {
  id: string;
  challengeKey: string;
  title: string;
  description: string;
  category: string;
  targetValue: number;
  rewardPoints: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface UserChallengeProgress {
  id: string;
  userId: string;
  challengeId: string;
  currentProgress: number;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
}

// ============================================================================
// State
// ============================================================================

let achievementsCache: Achievement[] | null = null;
let userProgressCache: Map<string, UserAchievement> = new Map();
let challengeCache: WeeklyChallenge | null = null;
let challengeProgressCache: UserChallengeProgress | null = null;
let streakCache: StreakData | null = null;
let isInitialized = false;

// ============================================================================
// Initialization
// ============================================================================

export async function initializeAchievementsService(): Promise<void> {
  if (isInitialized) return;
  
  try {
    await Promise.all([
      loadAchievements(),
      loadUserProgress(),
      loadCurrentChallenge(),
      loadStreak(),
    ]);
    
    // Update streak on init
    await updateStreak();
    
    isInitialized = true;
  } catch (error) {
    console.error('[AchievementsService] Initialization error:', error);
    isInitialized = true;
  }
}

// ============================================================================
// Achievements
// ============================================================================

export async function getAchievements(): Promise<AchievementWithProgress[]> {
  if (!isInitialized) await initializeAchievementsService();
  if (!achievementsCache) return [];
  
  return achievementsCache.map(achievement => {
    const userProgress = userProgressCache.get(achievement.id) || null;
    const percentComplete = userProgress
      ? Math.min((userProgress.currentProgress / achievement.requirementValue) * 100, 100)
      : 0;
    
    return { ...achievement, userProgress, percentComplete };
  }).sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function getAchievementsByCategory(
  category: AchievementCategory
): Promise<AchievementWithProgress[]> {
  const all = await getAchievements();
  return all.filter(a => a.category === category);
}

export async function getUnlockedAchievements(): Promise<AchievementWithProgress[]> {
  const all = await getAchievements();
  return all.filter(a => a.userProgress?.isUnlocked);
}

export async function getLockedAchievements(): Promise<AchievementWithProgress[]> {
  const all = await getAchievements();
  return all.filter(a => !a.userProgress?.isUnlocked);
}

async function loadAchievements(): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    const { data } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    
    if (data) {
      achievementsCache = data.map(transformAchievementFromDB);
    }
  }
}

async function loadUserProgress(): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      const user = await getCurrentUser();
      if (user && supabase) {
        const { data } = await supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', user.id);
        
        if (data) {
          userProgressCache.clear();
          data.forEach((row: any) => {
            userProgressCache.set(row.achievement_id, transformUserProgressFromDB(row));
          });
          return;
        }
      }
    }
    
    const stored = await AsyncStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      userProgressCache.clear();
      Object.entries(parsed).forEach(([key, value]: [string, any]) => {
        userProgressCache.set(key, {
          ...value,
          unlockedAt: value.unlockedAt ? new Date(value.unlockedAt) : undefined,
          lastProgressUpdate: new Date(value.lastProgressUpdate),
        });
      });
    }
  } catch {
    userProgressCache.clear();
  }
}

// ============================================================================
// Progress Updates
// ============================================================================

export async function incrementProgress(
  achievementKey: string,
  amount: number = 1
): Promise<{ unlocked: boolean; achievement?: Achievement }> {
  if (!isInitialized) await initializeAchievementsService();
  
  const achievement = achievementsCache?.find(a => a.achievementKey === achievementKey);
  if (!achievement) return { unlocked: false };
  
  let progress = userProgressCache.get(achievement.id);
  
  if (!progress) {
    progress = {
      id: generateId(),
      oduserId: '',
      achievementId: achievement.id,
      currentProgress: 0,
      isUnlocked: false,
      lastProgressUpdate: new Date(),
    };
  }
  
  if (progress.isUnlocked) return { unlocked: false };
  
  progress.currentProgress += amount;
  progress.lastProgressUpdate = new Date();
  
  // Check if unlocked
  let justUnlocked = false;
  if (progress.currentProgress >= achievement.requirementValue) {
    progress.isUnlocked = true;
    progress.unlockedAt = new Date();
    justUnlocked = true;
  }
  
  userProgressCache.set(achievement.id, progress);
  await persistUserProgress();
  
  return { 
    unlocked: justUnlocked, 
    achievement: justUnlocked ? achievement : undefined 
  };
}

export async function setProgress(
  achievementKey: string,
  value: number
): Promise<{ unlocked: boolean; achievement?: Achievement }> {
  if (!isInitialized) await initializeAchievementsService();
  
  const achievement = achievementsCache?.find(a => a.achievementKey === achievementKey);
  if (!achievement) return { unlocked: false };
  
  let progress = userProgressCache.get(achievement.id);
  
  if (!progress) {
    progress = {
      id: generateId(),
      oduserId: '',
      achievementId: achievement.id,
      currentProgress: 0,
      isUnlocked: false,
      lastProgressUpdate: new Date(),
    };
  }
  
  if (progress.isUnlocked) return { unlocked: false };
  
  progress.currentProgress = value;
  progress.lastProgressUpdate = new Date();
  
  // Check if unlocked
  let justUnlocked = false;
  if (progress.currentProgress >= achievement.requirementValue) {
    progress.isUnlocked = true;
    progress.unlockedAt = new Date();
    justUnlocked = true;
  }
  
  userProgressCache.set(achievement.id, progress);
  await persistUserProgress();
  
  return { 
    unlocked: justUnlocked, 
    achievement: justUnlocked ? achievement : undefined 
  };
}

export async function unlockAchievement(
  achievementKey: string
): Promise<{ unlocked: boolean; achievement?: Achievement }> {
  if (!isInitialized) await initializeAchievementsService();
  
  const achievement = achievementsCache?.find(a => a.achievementKey === achievementKey);
  if (!achievement) return { unlocked: false };
  
  let progress = userProgressCache.get(achievement.id);
  
  if (progress?.isUnlocked) return { unlocked: false };
  
  progress = {
    id: progress?.id || generateId(),
    oduserId: '',
    achievementId: achievement.id,
    currentProgress: achievement.requirementValue,
    isUnlocked: true,
    unlockedAt: new Date(),
    lastProgressUpdate: new Date(),
  };
  
  userProgressCache.set(achievement.id, progress);
  await persistUserProgress();
  
  return { unlocked: true, achievement };
}

// ============================================================================
// Streak Management
// ============================================================================

export async function getStreak(): Promise<StreakData> {
  if (!isInitialized) await initializeAchievementsService();
  return streakCache || { currentStreak: 0, longestStreak: 0, lastActiveDate: '' };
}

async function updateStreak(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  
  if (!streakCache) {
    streakCache = { currentStreak: 1, longestStreak: 1, lastActiveDate: today };
    await persistStreak();
    return;
  }
  
  if (streakCache.lastActiveDate === today) {
    // Already logged today
    return;
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (streakCache.lastActiveDate === yesterdayStr) {
    // Continue streak
    streakCache.currentStreak++;
    streakCache.longestStreak = Math.max(streakCache.longestStreak, streakCache.currentStreak);
  } else {
    // Streak broken
    streakCache.currentStreak = 1;
  }
  
  streakCache.lastActiveDate = today;
  await persistStreak();
  
  // Update streak achievements
  await setProgress('streak_7', streakCache.currentStreak);
  await setProgress('streak_30', streakCache.currentStreak);
  await setProgress('streak_365', streakCache.currentStreak);
}

async function loadStreak(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STREAK_STORAGE_KEY);
    if (stored) {
      streakCache = JSON.parse(stored);
    }
  } catch {
    streakCache = null;
  }
}

async function persistStreak(): Promise<void> {
  if (!streakCache) return;
  await AsyncStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(streakCache));
}

// ============================================================================
// Weekly Challenges
// ============================================================================

export async function getCurrentChallenge(): Promise<{
  challenge: WeeklyChallenge | null;
  progress: UserChallengeProgress | null;
}> {
  if (!isInitialized) await initializeAchievementsService();
  return { challenge: challengeCache, progress: challengeProgressCache };
}

export async function updateChallengeProgress(
  amount: number
): Promise<{ completed: boolean }> {
  if (!challengeCache || !challengeProgressCache) return { completed: false };
  if (challengeProgressCache.isCompleted) return { completed: false };
  
  challengeProgressCache.currentProgress += amount;
  
  if (challengeProgressCache.currentProgress >= challengeCache.targetValue) {
    challengeProgressCache.isCompleted = true;
    challengeProgressCache.completedAt = new Date();
    await persistChallengeProgress();
    return { completed: true };
  }
  
  await persistChallengeProgress();
  return { completed: false };
}

async function loadCurrentChallenge(): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: challenge } = await supabase
      .from('weekly_challenges')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', today)
      .gte('end_date', today)
      .single();
    
    if (challenge) {
      challengeCache = transformChallengeFromDB(challenge);
      
      const user = await getCurrentUser();
      if (user) {
        const { data: progress } = await supabase
          .from('user_challenge_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('challenge_id', challenge.id)
          .single();
        
        if (progress) {
          challengeProgressCache = transformChallengeProgressFromDB(progress);
        } else {
          // Create new progress entry
          challengeProgressCache = {
            id: generateId(),
            userId: user.id,
            challengeId: challenge.id,
            currentProgress: 0,
            isCompleted: false,
          };
        }
      }
    }
  }
}

async function persistChallengeProgress(): Promise<void> {
  if (!challengeProgressCache) return;
  
  if (isSupabaseConfigured() && supabase) {
    const user = await getCurrentUser();
    if (user) {
      await supabase.from('user_challenge_progress').upsert({
        id: challengeProgressCache.id,
        user_id: user.id,
        challenge_id: challengeProgressCache.challengeId,
        current_progress: challengeProgressCache.currentProgress,
        is_completed: challengeProgressCache.isCompleted,
        completed_at: challengeProgressCache.completedAt?.toISOString(),
      } as any);
    }
  }
}

// ============================================================================
// Statistics
// ============================================================================

export async function getAchievementStats(): Promise<{
  totalUnlocked: number;
  totalPoints: number;
  percentComplete: number;
  categories: Record<AchievementCategory, { unlocked: number; total: number }>;
}> {
  const all = await getAchievements();
  const unlocked = all.filter(a => a.userProgress?.isUnlocked);
  
  const categories: Record<AchievementCategory, { unlocked: number; total: number }> = {
    savings: { unlocked: 0, total: 0 },
    streak: { unlocked: 0, total: 0 },
    feature_usage: { unlocked: 0, total: 0 },
    collection: { unlocked: 0, total: 0 },
    points: { unlocked: 0, total: 0 },
    special: { unlocked: 0, total: 0 },
  };
  
  all.forEach(a => {
    categories[a.category].total++;
    if (a.userProgress?.isUnlocked) {
      categories[a.category].unlocked++;
    }
  });
  
  return {
    totalUnlocked: unlocked.length,
    totalPoints: unlocked.reduce((sum, a) => sum + a.pointsValue, 0),
    percentComplete: all.length > 0 ? (unlocked.length / all.length) * 100 : 0,
    categories,
  };
}

// ============================================================================
// Persistence & Transformers
// ============================================================================

async function persistUserProgress(): Promise<void> {
  const obj: Record<string, UserAchievement> = {};
  userProgressCache.forEach((value, key) => {
    obj[key] = value;
  });
  
  await AsyncStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(obj));
  
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser();
    if (user && supabase) {
      for (const [achievementId, progress] of userProgressCache.entries()) {
        await supabase.from('user_achievements').upsert({
          id: progress.id,
          user_id: user.id,
          achievement_id: achievementId,
          current_progress: progress.currentProgress,
          is_unlocked: progress.isUnlocked,
          unlocked_at: progress.unlockedAt?.toISOString(),
        } as any);
      }
    }
  }
}

function transformAchievementFromDB(row: any): Achievement {
  return {
    id: row.id,
    achievementKey: row.achievement_key,
    name: row.name,
    description: row.description,
    category: row.category,
    iconName: row.icon_name,
    pointsValue: row.points_value,
    requirementType: row.requirement_type,
    requirementValue: row.requirement_value,
    tier: row.tier,
    isActive: row.is_active,
    displayOrder: row.display_order,
  };
}

function transformUserProgressFromDB(row: any): UserAchievement {
  return {
    id: row.id,
    oduserId: row.user_id,
    achievementId: row.achievement_id,
    currentProgress: row.current_progress,
    isUnlocked: row.is_unlocked,
    unlockedAt: row.unlocked_at ? new Date(row.unlocked_at) : undefined,
    lastProgressUpdate: new Date(row.last_progress_update || row.updated_at),
  };
}

function transformChallengeFromDB(row: any): WeeklyChallenge {
  return {
    id: row.id,
    challengeKey: row.challenge_key,
    title: row.title,
    description: row.description,
    category: row.category,
    targetValue: row.target_value,
    rewardPoints: row.reward_points,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    isActive: row.is_active,
  };
}

function transformChallengeProgressFromDB(row: any): UserChallengeProgress {
  return {
    id: row.id,
    userId: row.user_id,
    challengeId: row.challenge_id,
    currentProgress: row.current_progress,
    isCompleted: row.is_completed,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  };
}

function generateId(): string {
  return `ach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function resetAchievementsCache(): void {
  achievementsCache = null;
  userProgressCache.clear();
  challengeCache = null;
  challengeProgressCache = null;
  streakCache = null;
  isInitialized = false;
}
```

#### Component Hierarchy

```
AchievementsScreen
├── SafeAreaView
│   ├── Header ("Achievements")
│   ├── StatsCard
│   │   ├── UnlockedCount / TotalCount
│   │   ├── TotalPoints
│   │   └── ProgressBar
│   ├── WeeklyChallengeCard [Pro]
│   │   ├── ChallengeName
│   │   ├── ProgressBar
│   │   ├── DaysRemaining
│   │   └── RewardDisplay
│   ├── CategoryTabs (Savings, Streak, Collection, etc.)
│   └── ScrollView
│       └── AchievementBadge[] (grid layout 3 columns)
│           ├── IconCircle (locked = grayscale)
│           ├── BadgeName
│           ├── ProgressBar (if not unlocked)
│           └── UnlockedDate (if unlocked)

AchievementUnlockModal (celebration)
├── ConfettiAnimation
├── BadgeIcon (large, animated)
├── "Achievement Unlocked!"
├── BadgeName
├── PointsEarned
├── ShareButton
└── CloseButton
```

#### Navigation Wiring

```typescript
// InsightsStackParamList
Achievements: undefined;

// From HomeScreen widget or InsightsHome:
navigation.navigate('Insights', { screen: 'Achievements' });
```

#### Tier Gating

| Tier | Access |
|------|--------|
| Free | All badges, basic progress |
| Pro | + Weekly challenges + Detailed progress analytics |
| Max | Same as Pro |

#### i18n Keys

```json
{
  "achievements": {
    "title": "Achievements",
    "subtitle": "Earn badges and rewards",
    "stats": {
      "unlocked": "{{count}} Unlocked",
      "total": "of {{total}}",
      "points": "{{points}} Points"
    },
    "categories": {
      "savings": "Savings",
      "streak": "Streaks",
      "feature_usage": "Features",
      "collection": "Collection",
      "points": "Points",
      "special": "Special"
    },
    "badge": {
      "unlocked": "Unlocked {{date}}",
      "progress": "{{current}} / {{target}}",
      "locked": "Locked"
    },
    "challenge": {
      "title": "Weekly Challenge",
      "progress": "{{current}} / {{target}}",
      "daysLeft": "{{days}} days left",
      "reward": "+{{points}} points",
      "completed": "Completed!"
    },
    "unlock": {
      "title": "Achievement Unlocked!",
      "points": "+{{points}} points",
      "share": "Share",
      "close": "Awesome!"
    },
    "streak": {
      "current": "{{days}} day streak",
      "longest": "Longest: {{days}} days"
    },
    "empty": {
      "title": "Start Earning",
      "description": "Use the app to unlock achievements"
    }
  }
}
```

---

### F16: Credit Card Application Tracker (5/24)

**Tier:** Pro

#### Files to Create

| Path | Purpose |
|------|---------|
| `src/screens/ApplicationTrackerScreen.tsx` | Applications list + velocity rules |
| `src/services/ApplicationTrackerService.ts` | CRUD, velocity calculations |
| `src/components/ApplicationCard.tsx` | Single application display |
| `src/components/VelocityRuleCard.tsx` | 5/24, 2/90 rule status |
| `src/components/AddApplicationModal.tsx` | Add/edit application form |
| `src/components/ApplicationTimeline.tsx` | Visual timeline of applications |

#### Files to Modify

| Path | Changes |
|------|---------|
| `src/navigation/AppNavigator.tsx` | Add `ApplicationTracker` to InsightsStack |
| `src/types/index.ts` | Add `CardApplication` type |
| `src/i18n/locales/en.json` | Add application tracker i18n keys |

#### Service Layer

```typescript
// src/services/ApplicationTrackerService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';
import { getCurrentUser } from './AuthService';

const APPLICATIONS_STORAGE_KEY = '@rewardly/card_applications';

// ============================================================================
// Types
// ============================================================================

export type ApplicationStatus = 'pending' | 'approved' | 'denied' | 'cancelled';

export type CreditBureau = 'equifax' | 'transunion' | 'both' | 'none';

export interface CardApplication {
  id: string;
  userId: string;
  issuer: string;
  cardName: string;
  applicationDate: Date;
  status: ApplicationStatus;
  creditLimit?: number;
  hardPullBureau?: CreditBureau;
  annualFee?: number;
  signupBonusValue?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VelocityRule {
  name: string;
  issuer: string | 'all';
  periodDays: number;
  maxApplications: number;
  currentCount: number;
  isViolated: boolean;
  nextEligibleDate: Date | null;
  description: string;
}

export interface IssuerStats {
  issuer: string;
  totalApplications: number;
  approvedCount: number;
  deniedCount: number;
  approvalRate: number;
  lastApplicationDate: Date | null;
}

// ============================================================================
// State
// ============================================================================

let applicationsCache: CardApplication[] | null = null;
let isInitialized = false;

// ============================================================================
// Velocity Rules Configuration
// ============================================================================

const VELOCITY_RULES_CONFIG: Omit<VelocityRule, 'currentCount' | 'isViolated' | 'nextEligibleDate'>[] = [
  {
    name: '5/24 Rule',
    issuer: 'all',
    periodDays: 730, // 24 months
    maxApplications: 5,
    description: 'Chase will deny most applications if you have 5+ new accounts in 24 months',
  },
  {
    name: 'Amex 2/90',
    issuer: 'American Express',
    periodDays: 90,
    maxApplications: 2,
    description: 'Amex limits new card approvals to 2 per 90 days',
  },
  {
    name: 'Citi 1/8',
    issuer: 'Citi',
    periodDays: 8,
    maxApplications: 1,
    description: 'Citi requires 8 days between applications',
  },
  {
    name: 'Citi 2/65',
    issuer: 'Citi',
    periodDays: 65,
    maxApplications: 2,
    description: 'Citi limits to 2 applications per 65 days',
  },
  {
    name: 'BoA 2/3/4',
    issuer: 'Bank of America',
    periodDays: 365,
    maxApplications: 4,
    description: 'BoA limits to 2 cards per 30 days, 3 per 12 months',
  },
];

// ============================================================================
// Initialization
// ============================================================================

export async function initializeApplicationTracker(): Promise<void> {
  if (isInitialized) return;
  
  try {
    await loadApplications();
    isInitialized = true;
  } catch (error) {
    console.error('[ApplicationTrackerService] Initialization error:', error);
    applicationsCache = [];
    isInitialized = true;
  }
}

// ============================================================================
// CRUD Operations
// ============================================================================

export async function getApplications(): Promise<CardApplication[]> {
  if (!isInitialized) await initializeApplicationTracker();
  if (!applicationsCache) return [];
  
  return [...applicationsCache].sort(
    (a, b) => b.applicationDate.getTime() - a.applicationDate.getTime()
  );
}

export async function getApplicationById(id: string): Promise<CardApplication | null> {
  if (!isInitialized) await initializeApplicationTracker();
  return applicationsCache?.find(a => a.id === id) || null;
}

export async function addApplication(
  application: Omit<CardApplication, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<CardApplication> {
  if (!isInitialized) await initializeApplicationTracker();
  
  const newApp: CardApplication = {
    id: generateId(),
    userId: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...application,
  };
  
  applicationsCache = applicationsCache || [];
  applicationsCache.push(newApp);
  
  await persistApplications();
  
  return newApp;
}

export async function updateApplication(
  id: string,
  updates: Partial<Omit<CardApplication, 'id' | 'userId' | 'createdAt'>>
): Promise<CardApplication> {
  if (!isInitialized) await initializeApplicationTracker();
  if (!applicationsCache) throw new Error('Applications not loaded');
  
  const index = applicationsCache.findIndex(a => a.id === id);
  if (index === -1) throw new Error(`Application ${id} not found`);
  
  applicationsCache[index] = {
    ...applicationsCache[index],
    ...updates,
    updatedAt: new Date(),
  };
  
  await persistApplications();
  
  return applicationsCache[index];
}

export async function deleteApplication(id: string): Promise<void> {
  if (!isInitialized) await initializeApplicationTracker();
  if (!applicationsCache) return;
  
  applicationsCache = applicationsCache.filter(a => a.id !== id);
  await persistApplications();
  
  if (isSupabaseConfigured() && supabase) {
    await supabase.from('card_applications').delete().eq('id', id);
  }
}

// ============================================================================
// Velocity Rules
// ============================================================================

export async function getVelocityRules(): Promise<VelocityRule[]> {
  if (!isInitialized) await initializeApplicationTracker();
  
  const applications = applicationsCache || [];
  const now = new Date();
  
  return VELOCITY_RULES_CONFIG.map(config => {
    const cutoffDate = new Date(now.getTime() - config.periodDays * 24 * 60 * 60 * 1000);
    
    const relevantApps = applications.filter(app => {
      const isWithinPeriod = app.applicationDate >= cutoffDate;
      const matchesIssuer = config.issuer === 'all' || 
        app.issuer.toLowerCase().includes(config.issuer.toLowerCase());
      return isWithinPeriod && matchesIssuer;
    });
    
    const currentCount = relevantApps.length;
    const isViolated = currentCount >= config.maxApplications;
    
    // Calculate next eligible date
    let nextEligibleDate: Date | null = null;
    if (isViolated && relevantApps.length > 0) {
      // Find oldest app that's keeping us over the limit
      const sortedApps = [...relevantApps].sort(
        (a, b) => a.applicationDate.getTime() - b.applicationDate.getTime()
      );
      const oldestApp = sortedApps[0];
      nextEligibleDate = new Date(
        oldestApp.applicationDate.getTime() + config.periodDays * 24 * 60 * 60 * 1000
      );
    }
    
    return {
      ...config,
      currentCount,
      isViolated,
      nextEligibleDate,
    };
  });
}

export async function get524Status(): Promise<{
  count: number;
  isOver: boolean;
  nextDropOffDate: Date | null;
}> {
  const rules = await getVelocityRules();
  const rule524 = rules.find(r => r.name === '5/24 Rule');
  
  return {
    count: rule524?.currentCount || 0,
    isOver: rule524?.isViolated || false,
    nextDropOffDate: rule524?.nextEligibleDate || null,
  };
}

// ============================================================================
// Statistics
// ============================================================================

export async function getIssuerStats(): Promise<IssuerStats[]> {
  if (!isInitialized) await initializeApplicationTracker();
  
  const applications = applicationsCache || [];
  const issuerMap = new Map<string, CardApplication[]>();
  
  applications.forEach(app => {
    const existing = issuerMap.get(app.issuer) || [];
    existing.push(app);
    issuerMap.set(app.issuer, existing);
  });
  
  const stats: IssuerStats[] = [];
  
  issuerMap.forEach((apps, issuer) => {
    const approved = apps.filter(a => a.status === 'approved').length;
    const denied = apps.filter(a => a.status === 'denied').length;
    const decided = approved + denied;
    
    const sortedApps = [...apps].sort(
      (a, b) => b.applicationDate.getTime() - a.applicationDate.getTime()
    );
    
    stats.push({
      issuer,
      totalApplications: apps.length,
      approvedCount: approved,
      deniedCount: denied,
      approvalRate: decided > 0 ? (approved / decided) * 100 : 0,
      lastApplicationDate: sortedApps[0]?.applicationDate || null,
    });
  });
  
  return stats.sort((a, b) => b.totalApplications - a.totalApplications);
}

export async function getHardPullCount(
  bureau: CreditBureau,
  months: number = 12
): Promise<number> {
  if (!isInitialized) await initializeApplicationTracker();
  
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);
  
  return (applicationsCache || []).filter(app => {
    if (app.applicationDate < cutoffDate) return false;
    if (!app.hardPullBureau || app.hardPullBureau === 'none') return false;
    return app.hardPullBureau === bureau || app.hardPullBureau === 'both';
  }).length;
}

// ============================================================================
// Persistence
// ============================================================================

async function loadApplications(): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      const user = await getCurrentUser();
      if (user && supabase) {
        const { data } = await supabase
          .from('card_applications')
          .select('*')
          .eq('user_id', user.id)
          .order('application_date', { ascending: false });
        
        if (data) {
          applicationsCache = data.map(transformApplicationFromDB);
          return;
        }
      }
    }
    
    const stored = await AsyncStorage.getItem(APPLICATIONS_STORAGE_KEY);
    if (stored) {
      applicationsCache = JSON.parse(stored).map((a: any) => ({
        ...a,
        applicationDate: new Date(a.applicationDate),
        createdAt: new Date(a.createdAt),
        updatedAt: new Date(a.updatedAt),
      }));
    } else {
      applicationsCache = [];
    }
  } catch {
    applicationsCache = [];
  }
}

async function persistApplications(): Promise<void> {
  if (!applicationsCache) return;
  
  await AsyncStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(applicationsCache));
  
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser();
    if (user && supabase) {
      for (const app of applicationsCache) {
        await supabase.from('card_applications').upsert({
          id: app.id,
          user_id: user.id,
          issuer: app.issuer,
          card_name: app.cardName,
          application_date: app.applicationDate.toISOString().split('T')[0],
          status: app.status,
          credit_limit: app.creditLimit,
          hard_pull_bureau: app.hardPullBureau,
          annual_fee: app.annualFee,
          signup_bonus_value: app.signupBonusValue,
          notes: app.notes,
        } as any);
      }
    }
  }
}

function transformApplicationFromDB(row: any): CardApplication {
  return {
    id: row.id,
    userId: row.user_id,
    issuer: row.issuer,
    cardName: row.card_name,
    applicationDate: new Date(row.application_date),
    status: row.status,
    creditLimit: row.credit_limit ? parseFloat(row.credit_limit) : undefined,
    hardPullBureau: row.hard_pull_bureau,
    annualFee: row.annual_fee ? parseFloat(row.annual_fee) : undefined,
    signupBonusValue: row.signup_bonus_value,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function generateId(): string {
  return `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function resetApplicationTrackerCache(): void {
  applicationsCache = null;
  isInitialized = false;
}
```

#### Component Hierarchy

```
ApplicationTrackerScreen (wrapped in LockedFeature for free)
├── SafeAreaView
│   ├── Header ("Application Tracker")
│   ├── ScrollView
│   │   ├── VelocityRulesSection
│   │   │   └── VelocityRuleCard[] (5/24, 2/90, etc.)
│   │   │       ├── RuleName
│   │   │       ├── StatusIndicator (green/yellow/red)
│   │   │       ├── CurrentCount / Max
│   │   │       └── NextEligibleDate (if over limit)
│   │   ├── HardPullsSummary
│   │   │   ├── EquifaxCount
│   │   │   └── TransUnionCount
│   │   ├── SectionHeader ("Applications")
│   │   ├── ApplicationTimeline (visual)
│   │   └── ApplicationCard[]
│   │       ├── CardName + Issuer
│   │       ├── ApplicationDate
│   │       ├── StatusBadge
│   │       ├── CreditLimit (if approved)
│   │       └── EditButton
│   └── FAB (Add Application)
└── AddApplicationModal
    ├── IssuerPicker
    ├── CardNameInput
    ├── DatePicker
    ├── StatusPicker
    ├── CreditLimitInput
    ├── HardPullBureauPicker
    └── SaveButton
```

#### Navigation Wiring

```typescript
// InsightsStackParamList
ApplicationTracker: undefined;

// From InsightsHomeScreen:
navigation.navigate('ApplicationTracker');
```

#### Tier Gating

| Tier | Access |
|------|--------|
| Free | LockedFeature |
| Pro | Full access |
| Max | Full access |

#### i18n Keys

```json
{
  "applicationTracker": {
    "title": "Application Tracker",
    "subtitle": "Track your credit card applications",
    "addApplication": "Add Application",
    "editApplication": "Edit Application",
    "deleteApplication": "Delete",
    "deleteConfirm": "Delete this application?",
    "rules": {
      "title": "Velocity Rules",
      "524": {
        "name": "5/24 Rule",
        "status": "{{count}}/24",
        "clear": "You're clear to apply!",
        "over": "Over 5/24 - Chase will likely deny"
      },
      "290": {
        "name": "Amex 2/90",
        "status": "{{count}}/2"
      },
      "nextEligible": "Next eligible: {{date}}"
    },
    "hardPulls": {
      "title": "Hard Pulls (12 months)",
      "equifax": "Equifax",
      "transunion": "TransUnion"
    },
    "form": {
      "issuer": "Issuer",
      "cardName": "Card Name",
      "date": "Application Date",
      "status": "Status",
      "creditLimit": "Credit Limit",
      "hardPull": "Hard Pull Bureau",
      "annualFee": "Annual Fee",
      "bonus": "Signup Bonus Value",
      "notes": "Notes"
    },
    "status": {
      "pending": "Pending",
      "approved": "Approved",
      "denied": "Denied",
      "cancelled": "Cancelled"
    },
    "empty": {
      "title": "No Applications",
      "description": "Track your credit card applications to manage velocity rules",
      "cta": "Add First Application"
    }
  }
}
```

---

### F18: Voice Commands (Siri/Google)

**Tier:** Pro

#### Files to Create

| Path | Purpose |
|------|---------|
| `src/screens/VoiceCommandsScreen.tsx` | Voice settings + shortcut setup |
| `src/services/VoiceCommandService.ts` | Siri shortcuts, in-app voice |
| `src/components/ShortcutCard.tsx` | Individual shortcut display |
| `src/components/VoiceMicButton.tsx` | Mic button for HomeScreen |

#### Files to Modify

| Path | Changes |
|------|---------|
| `src/navigation/AppNavigator.tsx` | Add `VoiceCommands` to InsightsStack |
| `src/screens/HomeScreen.tsx` | Add VoiceMicButton |
| `src/screens/SettingsScreen.tsx` | Add voice settings link |
| `src/i18n/locales/en.json` | Add voice i18n keys |

#### Service Layer

```typescript
// src/services/VoiceCommandService.ts

import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

// ============================================================================
// Types
// ============================================================================

export interface VoiceShortcut {
  id: string;
  phrase: string;
  action: VoiceAction;
  description: string;
  isConfigured: boolean;
}

export type VoiceAction = 
  | 'best_card_groceries'
  | 'best_card_dining'
  | 'best_card_gas'
  | 'best_card_travel'
  | 'loyalty_balance'
  | 'monthly_rewards'
  | 'bill_due';

export interface VoiceResponse {
  text: string;
  success: boolean;
  data?: any;
}

// ============================================================================
// Predefined Shortcuts
// ============================================================================

const VOICE_SHORTCUTS: Omit<VoiceShortcut, 'isConfigured'>[] = [
  {
    id: 'best_groceries',
    phrase: 'Best card for groceries',
    action: 'best_card_groceries',
    description: 'Returns your top card for grocery spending',
  },
  {
    id: 'best_dining',
    phrase: 'Best card for dining',
    action: 'best_card_dining',
    description: 'Returns your top card for restaurants',
  },
  {
    id: 'best_gas',
    phrase: 'Best card for gas',
    action: 'best_card_gas',
    description: 'Returns your top card for gas stations',
  },
  {
    id: 'best_travel',
    phrase: 'Best card for travel',
    action: 'best_card_travel',
    description: 'Returns your top card for travel purchases',
  },
  {
    id: 'aeroplan',
    phrase: 'My Aeroplan balance',
    action: 'loyalty_balance',
    description: 'Returns your Aeroplan points balance',
  },
  {
    id: 'monthly_rewards',
    phrase: 'Total rewards this month',
    action: 'monthly_rewards',
    description: 'Returns your monthly rewards summary',
  },
  {
    id: 'bill_due',
    phrase: 'When is my credit card due',
    action: 'bill_due',
    description: 'Returns upcoming bill payment dates',
  },
];

// ============================================================================
// Initialization
// ============================================================================

export async function initializeVoiceService(): Promise<void> {
  // Check for Siri Shortcuts availability on iOS
  // Register intent handlers
}

// ============================================================================
// Shortcuts Management
// ============================================================================

export async function getAvailableShortcuts(): Promise<VoiceShortcut[]> {
  // Would check which shortcuts are already configured with Siri
  return VOICE_SHORTCUTS.map(s => ({
    ...s,
    isConfigured: false, // Would query Siri for actual status
  }));
}

export async function addSiriShortcut(shortcutId: string): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  
  // Would use expo-apple-shortcut or native module
  // to present Siri shortcut creation dialog
  
  console.log('[VoiceCommandService] Adding Siri shortcut:', shortcutId);
  return true;
}

export async function removeSiriShortcut(shortcutId: string): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  
  // Would remove from Siri
  console.log('[VoiceCommandService] Removing Siri shortcut:', shortcutId);
  return true;
}

// ============================================================================
// Voice Command Processing
// ============================================================================

export async function processVoiceCommand(
  text: string
): Promise<VoiceResponse> {
  const normalizedText = text.toLowerCase().trim();
  
  // Best card queries
  if (normalizedText.includes('best card')) {
    if (normalizedText.includes('grocer')) {
      return await handleBestCardQuery('groceries');
    }
    if (normalizedText.includes('dining') || normalizedText.includes('restaurant')) {
      return await handleBestCardQuery('dining');
    }
    if (normalizedText.includes('gas') || normalizedText.includes('fuel')) {
      return await handleBestCardQuery('gas');
    }
    if (normalizedText.includes('travel') || normalizedText.includes('flight')) {
      return await handleBestCardQuery('travel');
    }
  }
  
  // Loyalty balance queries
  if (normalizedText.includes('balance') || normalizedText.includes('points')) {
    const programName = extractProgramName(normalizedText);
    if (programName) {
      return await handleLoyaltyBalanceQuery(programName);
    }
  }
  
  // Rewards summary
  if (normalizedText.includes('rewards') && normalizedText.includes('month')) {
    return await handleMonthlyRewardsQuery();
  }
  
  // Bill due
  if (normalizedText.includes('due') || normalizedText.includes('payment')) {
    return await handleBillDueQuery();
  }
  
  return {
    text: "I didn't understand that. Try asking about your best card for a category, or your loyalty points balance.",
    success: false,
  };
}

async function handleBestCardQuery(category: string): Promise<VoiceResponse> {
  // Would call RewardsCalculatorService
  const { getBestCardForCategory } = await import('./RewardsCalculatorService');
  const result = await getBestCardForCategory(category);
  
  if (result) {
    return {
      text: `For ${category}, use your ${result.cardName}. You'll earn ${result.rewardRate} back.`,
      success: true,
      data: result,
    };
  }
  
  return {
    text: `I couldn't find a card for ${category}. Add some cards first!`,
    success: false,
  };
}

async function handleLoyaltyBalanceQuery(programName: string): Promise<VoiceResponse> {
  // Would call LoyaltyService
  const { getUserAccounts } = await import('./LoyaltyService');
  const accounts = await getUserAccounts();
  
  const account = accounts.find(a => 
    a.program.programName.toLowerCase().includes(programName.toLowerCase())
  );
  
  if (account) {
    return {
      text: `Your ${account.program.programName} balance is ${account.currentBalance.toLocaleString()} ${account.program.currencyName}, worth about $${account.valueInCad.toFixed(2)}.`,
      success: true,
      data: account,
    };
  }
  
  return {
    text: `I couldn't find a ${programName} account. Add it in the Loyalty section first.`,
    success: false,
  };
}

async function handleMonthlyRewardsQuery(): Promise<VoiceResponse> {
  // Would call SavingsReportService
  return {
    text: `You've earned $47.32 in rewards this month across all your cards.`,
    success: true,
    data: { amount: 47.32 },
  };
}

async function handleBillDueQuery(): Promise<VoiceResponse> {
  // Would call BillPaymentService
  return {
    text: `Your TD Visa is due in 3 days. Your RBC Mastercard is due in 12 days.`,
    success: true,
    data: [],
  };
}

function extractProgramName(text: string): string | null {
  const programs = ['aeroplan', 'pc optimum', 'air miles', 'scene', 'marriott', 'hilton'];
  for (const program of programs) {
    if (text.includes(program)) {
      return program;
    }
  }
  return null;
}

// ============================================================================
// Text-to-Speech
// ============================================================================

export async function speak(text: string): Promise<void> {
  await Speech.speak(text, {
    language: 'en-CA',
    pitch: 1.0,
    rate: 0.9,
  });
}

export async function stopSpeaking(): Promise<void> {
  await Speech.stop();
}

export async function isSpeaking(): Promise<boolean> {
  return await Speech.isSpeakingAsync();
}

// ============================================================================
// Voice Recognition (In-App)
// ============================================================================

export async function startListening(): Promise<string> {
  // Would use expo-speech-recognition or react-native-voice
  // For now, return mock
  return '';
}

export async function stopListening(): Promise<void> {
  // Stop voice recognition
}
```

#### Component Hierarchy

```
VoiceCommandsScreen (wrapped in LockedFeature for free)
├── SafeAreaView
│   ├── Header ("Voice Commands")
│   ├── ScrollView
│   │   ├── DescriptionCard
│   │   │   └── "Ask Siri or use in-app voice..."
│   │   ├── SectionHeader ("Siri Shortcuts")
│   │   ├── ShortcutCard[]
│   │   │   ├── PhraseBubble ("Best card for groceries")
│   │   │   ├── Description
│   │   │   ├── ConfiguredBadge (if added to Siri)
│   │   │   └── AddToSiriButton
│   │   ├── SectionHeader ("In-App Voice")
│   │   ├── VoiceTestArea
│   │   │   ├── MicButton (large, centered)
│   │   │   ├── ListeningIndicator
│   │   │   └── ResponseCard
│   │   └── SampleCommands
│   │       └── QuickPhraseChip[]

VoiceMicButton (HomeScreen)
├── FloatingButton (microphone icon)
└── VoiceOverlay (when listening)
    ├── WaveformAnimation
    ├── "Listening..."
    ├── TranscriptText
    └── CancelButton
```

#### Navigation Wiring

```typescript
// InsightsStackParamList
VoiceCommands: undefined;

// From SettingsScreen:
navigation.navigate('Insights', { screen: 'VoiceCommands' });
```

#### Tier Gating

| Tier | Access |
|------|--------|
| Free | LockedFeature |
| Pro | Full access |
| Max | Full access |

#### i18n Keys

```json
{
  "voice": {
    "title": "Voice Commands",
    "subtitle": "Ask about your cards hands-free",
    "description": "Use Siri, Google Assistant, or the in-app mic to quickly check your best card or loyalty balances.",
    "siriShortcuts": "Siri Shortcuts",
    "addToSiri": "Add to Siri",
    "removeFromSiri": "Remove",
    "configured": "Added",
    "inAppVoice": "In-App Voice",
    "tapToSpeak": "Tap to speak",
    "listening": "Listening...",
    "processing": "Processing...",
    "sampleCommands": "Try saying:",
    "shortcuts": {
      "bestGroceries": "Best card for groceries",
      "bestDining": "Best card for dining",
      "aeroplanBalance": "My Aeroplan balance",
      "monthlyRewards": "Total rewards this month"
    },
    "errors": {
      "notUnderstood": "I didn't understand that. Try again.",
      "noPermission": "Microphone permission required"
    }
  }
}
```

---

### F19: Apple Wallet Passes

**Tier:** Free (static passes), Pro (dynamic updates + location triggers)

#### Files to Create

| Path | Purpose |
|------|---------|
| `src/screens/WalletPassesScreen.tsx` | Manage wallet passes |
| `src/services/WalletPassService.ts` | Pass generation, device registration |
| `src/components/WalletPassCard.tsx` | Pass preview card |
| `supabase/functions/generate-pass/index.ts` | Edge function for .pkpass |

#### Files to Modify

| Path | Changes |
|------|---------|
| `src/navigation/AppNavigator.tsx` | Add `WalletPasses` to InsightsStack |
| `src/screens/MyCardsScreen.tsx` | Add "Add to Wallet" button per card |
| `src/i18n/locales/en.json` | Add wallet pass i18n keys |

#### Service Layer

```typescript
// src/services/WalletPassService.ts

import { Platform, Linking } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { supabase, isSupabaseConfigured } from './supabase';
import { getCurrentUser } from './AuthService';
import { Card } from '../types';

// ============================================================================
// Types
// ============================================================================

export type PassType = 'apple' | 'google';

export interface WalletPass {
  id: string;
  userId: string;
  cardId: string;
  passType: PassType;
  passSerial: string;
  deviceTokens: string[];
  lastUpdated: Date;
  isActive: boolean;
  passData: PassContent;
}

export interface PassContent {
  cardName: string;
  issuerName: string;
  bestCategory: string;
  rewardRate: string;
  cardColor: string;
  lastFour?: string;
}

export interface GeneratedPass {
  passUrl: string;
  passSerial: string;
  expiresAt: Date;
}

// ============================================================================
// State
// ============================================================================

let passesCache: WalletPass[] | null = null;
let isInitialized = false;

// ============================================================================
// Initialization
// ============================================================================

export async function initializeWalletPassService(): Promise<void> {
  if (isInitialized) return;
  
  try {
    await loadPasses();
    isInitialized = true;
  } catch (error) {
    console.error('[WalletPassService] Initialization error:', error);
    passesCache = [];
    isInitialized = true;
  }
}

// ============================================================================
// Pass Management
// ============================================================================

export async function getUserPasses(): Promise<WalletPass[]> {
  if (!isInitialized) await initializeWalletPassService();
  return passesCache || [];
}

export async function getPassForCard(cardId: string): Promise<WalletPass | null> {
  const passes = await getUserPasses();
  return passes.find(p => p.cardId === cardId && p.isActive) || null;
}

export async function generatePass(
  card: Card,
  passType: PassType
): Promise<GeneratedPass> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase not configured');
  }
  
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  
  // Call edge function to generate pass
  const { data, error } = await supabase.functions.invoke('generate-pass', {
    body: {
      cardId: card.id,
      cardName: card.name,
      issuer: card.issuer,
      passType,
      // Include best category info for dynamic pass content
      bestCategory: await getBestCategoryForCard(card.id),
    },
  });
  
  if (error) throw error;
  
  // Save pass record
  const newPass: WalletPass = {
    id: data.passSerial,
    userId: user.id,
    cardId: card.id,
    passType,
    passSerial: data.passSerial,
    deviceTokens: [],
    lastUpdated: new Date(),
    isActive: true,
    passData: data.passContent,
  };
  
  passesCache = passesCache || [];
  passesCache.push(newPass);
  await persistPasses();
  
  return {
    passUrl: data.passUrl,
    passSerial: data.passSerial,
    expiresAt: new Date(data.expiresAt),
  };
}

export async function addPassToWallet(passUrl: string): Promise<boolean> {
  if (Platform.OS === 'ios') {
    // Download .pkpass and open with PassKit
    const localUri = `${FileSystem.cacheDirectory}pass.pkpass`;
    
    await FileSystem.downloadAsync(passUrl, localUri);
    
    // Open with iOS PassKit
    const canOpen = await Linking.canOpenURL('shoebox://');
    if (canOpen) {
      await Linking.openURL(passUrl);
      return true;
    }
  } else if (Platform.OS === 'android') {
    // Google Wallet uses JWT/URL
    await Linking.openURL(passUrl);
    return true;
  }
  
  return false;
}

export async function updatePass(cardId: string): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) return;
  
  const pass = await getPassForCard(cardId);
  if (!pass) return;
  
  // Trigger push update to registered devices
  await supabase.functions.invoke('update-pass', {
    body: {
      passSerial: pass.passSerial,
      updates: {
        bestCategory: await getBestCategoryForCard(cardId),
      },
    },
  });
  
  pass.lastUpdated = new Date();
  await persistPasses();
}

export async function removePass(cardId: string): Promise<void> {
  if (!passesCache) return;
  
  const index = passesCache.findIndex(p => p.cardId === cardId);
  if (index !== -1) {
    passesCache[index].isActive = false;
    await persistPasses();
  }
  
  if (isSupabaseConfigured() && supabase) {
    await supabase
      .from('wallet_passes')
      .update({ is_active: false } as any)
      .eq('card_id', cardId);
  }
}

// ============================================================================
// Device Registration (for push updates)
// ============================================================================

export async function registerDevice(
  passSerial: string,
  deviceToken: string
): Promise<void> {
  if (!passesCache) return;
  
  const pass = passesCache.find(p => p.passSerial === passSerial);
  if (!pass) return;
  
  if (!pass.deviceTokens.includes(deviceToken)) {
    pass.deviceTokens.push(deviceToken);
    await persistPasses();
  }
}

export async function unregisterDevice(
  passSerial: string,
  deviceToken: string
): Promise<void> {
  if (!passesCache) return;
  
  const pass = passesCache.find(p => p.passSerial === passSerial);
  if (!pass) return;
  
  pass.deviceTokens = pass.deviceTokens.filter(t => t !== deviceToken);
  await persistPasses();
}

// ============================================================================
// Helpers
// ============================================================================

async function getBestCategoryForCard(cardId: string): Promise<string> {
  // Would call RewardsCalculatorService to get best category
  return 'Groceries - 5x points';
}

export function isWalletSupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export function getWalletName(): string {
  return Platform.OS === 'ios' ? 'Apple Wallet' : 'Google Wallet';
}

// ============================================================================
// Persistence
// ============================================================================

async function loadPasses(): Promise<void> {
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser();
    if (user && supabase) {
      const { data } = await supabase
        .from('wallet_passes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (data) {
        passesCache = data.map(transformPassFromDB);
        return;
      }
    }
  }
  
  passesCache = [];
}

async function persistPasses(): Promise<void> {
  if (!passesCache || !isSupabaseConfigured() || !supabase) return;
  
  const user = await getCurrentUser();
  if (!user) return;
  
  for (const pass of passesCache) {
    await supabase.from('wallet_passes').upsert({
      id: pass.id,
      user_id: user.id,
      card_id: pass.cardId,
      pass_type: pass.passType,
      pass_serial: pass.passSerial,
      device_tokens: pass.deviceTokens,
      is_active: pass.isActive,
      pass_data: pass.passData,
    } as any);
  }
}

function transformPassFromDB(row: any): WalletPass {
  return {
    id: row.id,
    userId: row.user_id,
    cardId: row.card_id,
    passType: row.pass_type,
    passSerial: row.pass_serial,
    deviceTokens: row.device_tokens || [],
    lastUpdated: new Date(row.last_updated),
    isActive: row.is_active,
    passData: row.pass_data || {},
  };
}

export function resetWalletPassCache(): void {
  passesCache = null;
  isInitialized = false;
}
```

#### Edge Function (Pass Generation)

```typescript
// supabase/functions/generate-pass/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { cardId, cardName, issuer, passType, bestCategory } = await req.json();
    
    const passSerial = `REWARDLY-${cardId}-${Date.now()}`;
    
    if (passType === 'apple') {
      // Generate .pkpass using passkit-generator
      // This requires signing certificates
      
      const passContent = {
        cardName,
        issuerName: issuer,
        bestCategory,
        rewardRate: '5x points',
        cardColor: '#1a1a2e',
      };
      
      // Would generate actual .pkpass file here
      // For now, return mock URL
      
      const passUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/passes/${passSerial}.pkpass`;
      
      return new Response(
        JSON.stringify({
          passUrl,
          passSerial,
          passContent,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Generate Google Wallet JWT
      const walletUrl = `https://pay.google.com/gp/v/save/${passSerial}`;
      
      return new Response(
        JSON.stringify({
          passUrl: walletUrl,
          passSerial,
          passContent: { cardName, issuerName: issuer, bestCategory },
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

#### Component Hierarchy

```
WalletPassesScreen
├── SafeAreaView
│   ├── Header ("Wallet Passes")
│   ├── DescriptionCard
│   │   └── "Add your cards to Apple/Google Wallet..."
│   ├── ScrollView
│   │   ├── SectionHeader ("Active Passes")
│   │   ├── WalletPassCard[] (cards with passes)
│   │   │   ├── CardPreview (styled like wallet pass)
│   │   │   ├── BestCategoryDisplay
│   │   │   ├── LastUpdatedDate
│   │   │   └── RemoveButton
│   │   ├── SectionHeader ("Available to Add")
│   │   └── WalletPassCard[] (cards without passes)
│   │       ├── CardPreview
│   │       └── AddToWalletButton
│   └── DynamicUpdatesInfo [Pro]
│       └── "Your passes update automatically..."

MyCardsScreen (modification)
└── CardRow
    └── AddToWalletButton (small icon)
```

#### Navigation Wiring

```typescript
// InsightsStackParamList
WalletPasses: undefined;

// From MyCardsScreen or SettingsScreen:
navigation.navigate('Insights', { screen: 'WalletPasses' });
```

#### Tier Gating

| Tier | Access |
|------|--------|
| Free | Static passes only |
| Pro | + Dynamic updates + Location triggers |
| Max | Same as Pro |

#### i18n Keys

```json
{
  "walletPasses": {
    "title": "Wallet Passes",
    "subtitle": "Quick access at checkout",
    "description": "Add your cards to {{wallet}} for instant access when you're at a store.",
    "activePasses": "Active Passes",
    "availableToAdd": "Available to Add",
    "addToWallet": "Add to {{wallet}}",
    "removePass": "Remove Pass",
    "removeConfirm": "Remove this pass from your wallet?",
    "lastUpdated": "Updated {{date}}",
    "dynamicUpdates": {
      "title": "Dynamic Updates",
      "description": "Your passes automatically update with the best category when card recommendations change.",
      "proFeature": "Pro feature"
    },
    "generating": "Generating pass...",
    "success": "Pass added to {{wallet}}!",
    "error": {
      "notSupported": "Wallet not supported on this device",
      "failed": "Failed to generate pass"
    },
    "pass": {
      "bestFor": "Best for:",
      "earn": "Earn {{rate}}"
    }
  }
}
```

---

### F20: Bill Payment Tracker & Reminders

**Tier:** Free (manual tracking), Pro (smart reminders + interest calculator)

#### Files to Create

| Path | Purpose |
|------|---------|
| `src/screens/BillPaymentScreen.tsx` | Bill overview + calendar |
| `src/services/BillPaymentService.ts` | Schedules, reminders, interest calc |
| `src/components/BillCard.tsx` | Single bill due card |
| `src/components/PaymentCalendar.tsx` | Calendar view of due dates |
| `src/components/InterestCalculator.tsx` | Interest cost calculator |
| `src/components/AddBillModal.tsx` | Add/edit bill schedule |

#### Files to Modify

| Path | Changes |
|------|---------|
| `src/navigation/AppNavigator.tsx` | Add `BillPayment` to InsightsStack |
| `src/screens/HomeScreen.tsx` | Add upcoming bill widget |
| `src/types/index.ts` | Add bill payment types |
| `src/i18n/locales/en.json` | Add bill payment i18n keys |

#### Service Layer

```typescript
// src/services/BillPaymentService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { supabase, isSupabaseConfigured } from './supabase';
import { getCurrentUser } from './AuthService';
import { Card } from '../types';

const BILLS_STORAGE_KEY = '@rewardly/bill_schedules';
const PAYMENTS_STORAGE_KEY = '@rewardly/payment_history';

// ============================================================================
// Types
// ============================================================================

export type PaymentType = 'minimum' | 'full' | 'partial' | 'autopay';

export interface BillSchedule {
  id: string;
  userId: string;
  cardId: string;
  dueDay: number; // 1-31
  reminderDaysBefore: number[];
  hasAutopay: boolean;
  minimumPayment?: number;
  statementBalance?: number;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillScheduleWithCard extends BillSchedule {
  card: Card;
  nextDueDate: Date;
  daysUntilDue: number;
  isOverdue: boolean;
}

export interface PaymentHistory {
  id: string;
  userId: string;
  cardId: string;
  paymentDate: Date;
  amount: number;
  paymentType: PaymentType;
  wasLate: boolean;
  notes?: string;
}

export interface UpcomingBill {
  bill: BillScheduleWithCard;
  dueDate: Date;
  daysUntil: number;
  estimatedInterest?: number; // If carrying balance
}

// ============================================================================
// State
// ============================================================================

let billsCache: BillSchedule[] | null = null;
let paymentsCache: PaymentHistory[] | null = null;
let isInitialized = false;

// ============================================================================
// Initialization
// ============================================================================

export async function initializeBillPaymentService(): Promise<void> {
  if (isInitialized) return;
  
  try {
    await Promise.all([
      loadBillSchedules(),
      loadPaymentHistory(),
    ]);
    
    // Schedule notifications for upcoming bills
    await scheduleReminders();
    
    isInitialized = true;
  } catch (error) {
    console.error('[BillPaymentService] Initialization error:', error);
    billsCache = [];
    paymentsCache = [];
    isInitialized = true;
  }
}

// ============================================================================
// Bill Schedules
// ============================================================================

export async function getBillSchedules(): Promise<BillScheduleWithCard[]> {
  if (!isInitialized) await initializeBillPaymentService();
  if (!billsCache) return [];
  
  // Would call CardPortfolioManager to get card details
  const today = new Date();
  
  return billsCache
    .filter(b => b.isActive)
    .map(bill => {
      const nextDue = getNextDueDate(bill.dueDay);
      const daysUntil = Math.ceil(
        (nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return {
        ...bill,
        card: { id: bill.cardId, name: bill.cardId } as Card, // Would get actual card
        nextDueDate: nextDue,
        daysUntilDue: daysUntil,
        isOverdue: daysUntil < 0,
      };
    })
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

export async function getBillForCard(cardId: string): Promise<BillScheduleWithCard | null> {
  const bills = await getBillSchedules();
  return bills.find(b => b.cardId === cardId) || null;
}

export async function addBillSchedule(
  schedule: Omit<BillSchedule, 'id' | 'userId' | 'isActive' | 'createdAt' | 'updatedAt'>
): Promise<BillSchedule> {
  if (!isInitialized) await initializeBillPaymentService();
  
  const newBill: BillSchedule = {
    id: generateId(),
    userId: '',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...schedule,
  };
  
  billsCache = billsCache || [];
  billsCache.push(newBill);
  
  await persistBillSchedules();
  await scheduleReminders();
  
  return newBill;
}

export async function updateBillSchedule(
  id: string,
  updates: Partial<Omit<BillSchedule, 'id' | 'userId' | 'createdAt'>>
): Promise<BillSchedule> {
  if (!isInitialized) await initializeBillPaymentService();
  if (!billsCache) throw new Error('Bills not loaded');
  
  const index = billsCache.findIndex(b => b.id === id);
  if (index === -1) throw new Error(`Bill ${id} not found`);
  
  billsCache[index] = {
    ...billsCache[index],
    ...updates,
    updatedAt: new Date(),
  };
  
  await persistBillSchedules();
  await scheduleReminders();
  
  return billsCache[index];
}

export async function deleteBillSchedule(id: string): Promise<void> {
  if (!isInitialized) await initializeBillPaymentService();
  if (!billsCache) return;
  
  billsCache = billsCache.filter(b => b.id !== id);
  await persistBillSchedules();
  
  if (isSupabaseConfigured() && supabase) {
    await supabase.from('bill_schedules').delete().eq('id', id);
  }
}

// ============================================================================
// Payment History
// ============================================================================

export async function getPaymentHistory(
  cardId?: string,
  limit?: number
): Promise<PaymentHistory[]> {
  if (!isInitialized) await initializeBillPaymentService();
  if (!paymentsCache) return [];
  
  let filtered = cardId 
    ? paymentsCache.filter(p => p.cardId === cardId)
    : [...paymentsCache];
  
  filtered.sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
  
  if (limit) {
    filtered = filtered.slice(0, limit);
  }
  
  return filtered;
}

export async function logPayment(
  payment: Omit<PaymentHistory, 'id' | 'userId'>
): Promise<PaymentHistory> {
  if (!isInitialized) await initializeBillPaymentService();
  
  const newPayment: PaymentHistory = {
    id: generateId(),
    userId: '',
    ...payment,
  };
  
  paymentsCache = paymentsCache || [];
  paymentsCache.push(newPayment);
  
  await persistPaymentHistory();
  
  return newPayment;
}

// ============================================================================
// Upcoming Bills & Reminders
// ============================================================================

export async function getUpcomingBills(days: number = 30): Promise<UpcomingBill[]> {
  const bills = await getBillSchedules();
  const today = new Date();
  
  return bills
    .filter(b => b.daysUntilDue >= 0 && b.daysUntilDue <= days)
    .map(bill => ({
      bill,
      dueDate: bill.nextDueDate,
      daysUntil: bill.daysUntilDue,
      estimatedInterest: bill.statementBalance 
        ? calculateMonthlyInterest(bill.statementBalance, 19.99) // Default APR
        : undefined,
    }));
}

export async function getOverdueBills(): Promise<BillScheduleWithCard[]> {
  const bills = await getBillSchedules();
  return bills.filter(b => b.isOverdue);
}

async function scheduleReminders(): Promise<void> {
  if (!billsCache) return;
  
  // Cancel existing reminders
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  const bills = billsCache.filter(b => b.isActive);
  
  for (const bill of bills) {
    for (const daysBefore of bill.reminderDaysBefore) {
      const nextDue = getNextDueDate(bill.dueDay);
      const reminderDate = new Date(nextDue);
      reminderDate.setDate(reminderDate.getDate() - daysBefore);
      
      if (reminderDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Bill Payment Due Soon',
            body: `Your ${bill.cardId} payment is due in ${daysBefore} days.`,
            data: { type: 'bill_payment_due', cardId: bill.cardId },
          },
          trigger: {
            date: reminderDate,
          },
        });
      }
    }
  }
}

// ============================================================================
// Interest Calculator
// ============================================================================

export function calculateMonthlyInterest(
  balance: number,
  annualRate: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  return balance * monthlyRate;
}

export function calculateTotalInterest(
  balance: number,
  annualRate: number,
  monthsToPayoff: number
): number {
  const monthlyPayment = balance / monthsToPayoff;
  let totalInterest = 0;
  let remainingBalance = balance;
  const monthlyRate = annualRate / 100 / 12;
  
  for (let i = 0; i < monthsToPayoff; i++) {
    const interest = remainingBalance * monthlyRate;
    totalInterest += interest;
    remainingBalance = remainingBalance + interest - monthlyPayment;
  }
  
  return totalInterest;
}

export function calculateMinimumPayment(
  balance: number,
  minPaymentRate: number = 0.02
): number {
  return Math.max(balance * minPaymentRate, 10);
}

// ============================================================================
// Calendar View Data
// ============================================================================

export async function getBillsForMonth(
  year: number,
  month: number
): Promise<Map<number, BillScheduleWithCard[]>> {
  const bills = await getBillSchedules();
  const result = new Map<number, BillScheduleWithCard[]>();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  for (const bill of bills) {
    const dueDay = Math.min(bill.dueDay, daysInMonth);
    const existing = result.get(dueDay) || [];
    existing.push(bill);
    result.set(dueDay, existing);
  }
  
  return result;
}

// ============================================================================
// Helpers
// ============================================================================

function getNextDueDate(dueDay: number): Date {
  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay);
  
  if (thisMonth > today) {
    return thisMonth;
  } else {
    return new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
  }
}

// ============================================================================
// Persistence
// ============================================================================

async function loadBillSchedules(): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      const user = await getCurrentUser();
      if (user && supabase) {
        const { data } = await supabase
          .from('bill_schedules')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true);
        
        if (data) {
          billsCache = data.map(transformBillFromDB);
          return;
        }
      }
    }
    
    const stored = await AsyncStorage.getItem(BILLS_STORAGE_KEY);
    if (stored) {
      billsCache = JSON.parse(stored).map((b: any) => ({
        ...b,
        createdAt: new Date(b.createdAt),
        updatedAt: new Date(b.updatedAt),
      }));
    } else {
      billsCache = [];
    }
  } catch {
    billsCache = [];
  }
}

async function loadPaymentHistory(): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      const user = await getCurrentUser();
      if (user && supabase) {
        const { data } = await supabase
          .from('payment_history')
          .select('*')
          .eq('user_id', user.id)
          .order('payment_date', { ascending: false })
          .limit(100);
        
        if (data) {
          paymentsCache = data.map(transformPaymentFromDB);
          return;
        }
      }
    }
    
    const stored = await AsyncStorage.getItem(PAYMENTS_STORAGE_KEY);
    if (stored) {
      paymentsCache = JSON.parse(stored).map((p: any) => ({
        ...p,
        paymentDate: new Date(p.paymentDate),
      }));
    } else {
      paymentsCache = [];
    }
  } catch {
    paymentsCache = [];
  }
}

async function persistBillSchedules(): Promise<void> {
  if (!billsCache) return;
  
  await AsyncStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(billsCache));
  
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser();
    if (user && supabase) {
      for (const bill of billsCache) {
        await supabase.from('bill_schedules').upsert({
          id: bill.id,
          user_id: user.id,
          card_id: bill.cardId,
          due_day: bill.dueDay,
          reminder_days_before: bill.reminderDaysBefore,
          has_autopay: bill.hasAutopay,
          minimum_payment: bill.minimumPayment,
          statement_balance: bill.statementBalance,
          notes: bill.notes,
          is_active: bill.isActive,
        } as any);
      }
    }
  }
}

async function persistPaymentHistory(): Promise<void> {
  if (!paymentsCache) return;
  
  await AsyncStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(paymentsCache));
  
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser();
    if (user && supabase) {
      for (const payment of paymentsCache) {
        await supabase.from('payment_history').upsert({
          id: payment.id,
          user_id: user.id,
          card_id: payment.cardId,
          payment_date: payment.paymentDate.toISOString().split('T')[0],
          amount: payment.amount,
          payment_type: payment.paymentType,
          was_late: payment.wasLate,
          notes: payment.notes,
        } as any);
      }
    }
  }
}

function transformBillFromDB(row: any): BillSchedule {
  return {
    id: row.id,
    userId: row.user_id,
    cardId: row.card_id,
    dueDay: row.due_day,
    reminderDaysBefore: row.reminder_days_before || [3, 7],
    hasAutopay: row.has_autopay,
    minimumPayment: row.minimum_payment ? parseFloat(row.minimum_payment) : undefined,
    statementBalance: row.statement_balance ? parseFloat(row.statement_balance) : undefined,
    notes: row.notes,
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function transformPaymentFromDB(row: any): PaymentHistory {
  return {
    id: row.id,
    userId: row.user_id,
    cardId: row.card_id,
    paymentDate: new Date(row.payment_date),
    amount: parseFloat(row.amount),
    paymentType: row.payment_type,
    wasLate: row.was_late,
    notes: row.notes,
  };
}

function generateId(): string {
  return `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function resetBillPaymentCache(): void {
  billsCache = null;
  paymentsCache = null;
  isInitialized = false;
}
```

#### Component Hierarchy

```
BillPaymentScreen
├── SafeAreaView
│   ├── Header ("Bill Payments")
│   ├── ViewToggle (List / Calendar)
│   ├── ScrollView (List View)
│   │   ├── OverdueSection (if any)
│   │   │   └── BillCard[] (red styling)
│   │   ├── SectionHeader ("Due This Week")
│   │   ├── BillCard[]
│   │   │   ├── CardName
│   │   │   ├── DueDate
│   │   │   ├── DaysUntilBadge
│   │   │   ├── BalanceDisplay
│   │   │   ├── AutopayBadge (if enabled)
│   │   │   └── PayNowButton
│   │   ├── SectionHeader ("Coming Up")
│   │   ├── BillCard[]
│   │   └── InterestCalculator [Pro]
│   │       ├── BalanceInput
│   │       ├── APRInput
│   │       └── InterestResult
│   ├── CalendarView (Calendar mode)
│   │   └── PaymentCalendar
│   │       ├── MonthHeader
│   │       ├── DayGrid (bills shown on due days)
│   │       └── DayDetail (on tap)
│   └── FAB (Add Bill)
└── AddBillModal
    ├── CardPicker
    ├── DueDayPicker
    ├── ReminderDaysPicker
    ├── AutopayToggle
    ├── BalanceInput
    └── SaveButton

HomeScreen Widget
└── UpcomingBillWidget
    ├── NextBillCard
    ├── DaysUntilLabel
    └── ViewAllLink
```

#### Navigation Wiring

```typescript
// InsightsStackParamList
BillPayment: undefined;

// From HomeScreen widget:
navigation.navigate('Insights', { screen: 'BillPayment' });
```

#### Tier Gating

| Tier | Access |
|------|--------|
| Free | Manual tracking, basic reminders |
| Pro | + Smart reminders + Interest calculator + Payment history |
| Max | Same as Pro |

#### i18n Keys

```json
{
  "billPayment": {
    "title": "Bill Payments",
    "subtitle": "Never miss a payment",
    "addBill": "Add Bill",
    "editBill": "Edit",
    "deleteBill": "Remove",
    "deleteConfirm": "Remove this bill schedule?",
    "view": {
      "list": "List",
      "calendar": "Calendar"
    },
    "sections": {
      "overdue": "Overdue",
      "thisWeek": "Due This Week",
      "comingUp": "Coming Up"
    },
    "card": {
      "dueOn": "Due {{date}}",
      "dueIn": "Due in {{days}} days",
      "dueToday": "Due Today!",
      "overdue": "{{days}} days overdue",
      "autopay": "Autopay On",
      "balance": "Balance: {{amount}}",
      "minimum": "Min: {{amount}}"
    },
    "form": {
      "selectCard": "Select Card",
      "dueDay": "Due Day of Month",
      "reminders": "Remind Me",
      "reminderDays": "{{days}} days before",
      "autopay": "Autopay Enabled",
      "balance": "Current Balance",
      "minimumPayment": "Minimum Payment"
    },
    "interest": {
      "title": "Interest Calculator",
      "balance": "Balance",
      "apr": "APR",
      "monthly": "Monthly Interest",
      "warning": "If you carry this balance, you'll pay ~{{amount}}/month in interest"
    },
    "payment": {
      "log": "Log Payment",
      "type": {
        "minimum": "Minimum",
        "full": "Full Balance",
        "partial": "Partial",
        "autopay": "Autopay"
      },
      "late": "Was this payment late?",
      "history": "Payment History"
    },
    "empty": {
      "title": "No Bills Set Up",
      "description": "Add your credit card due dates to get payment reminders",
      "cta": "Add First Bill"
    },
    "notification": {
      "title": "Payment Due Soon",
      "body": "Your {{card}} payment is due in {{days}} days"
    }
  }
}
```

---

## Implementation Order

**Batch 1 — Simple CRUD + Rules (Week 1)**

| Order | Feature | Complexity | Developer Hours | Dependencies |
|-------|---------|-----------|-----------------|--------------|
| 1 | F16: Application Tracker | S | 12 | None |
| 2 | F20: Bill Payment Tracker | S | 14 | expo-notifications |
| 3 | F15: Achievements System | S | 16 | Event hooks in other services |

**Batch 2 — Medium Complexity (Week 2)**

| Order | Feature | Complexity | Developer Hours | Dependencies |
|-------|---------|-----------|-----------------|--------------|
| 4 | F12: Loyalty Aggregator | M | 18 | None |
| 5 | F14: Receipt Scanner | M | 20 | expo-camera, OCR edge function |

**Batch 3 — Integration Heavy (Week 3)**

| Order | Feature | Complexity | Developer Hours | Dependencies |
|-------|---------|-----------|-----------------|--------------|
| 6 | F18: Voice Commands | M | 16 | expo-speech, Siri native module |
| 7 | F19: Apple Wallet | M | 18 | passkit-generator, signing certs |
| 8 | F11: Location Recs | L | 22 | expo-location, expo-task-manager |

---

## Task Breakdown

### F11: Location-Based Recommendations

| Task | Est. Hours | Assignee |
|------|-----------|----------|
| 11.1 DB migration + seed merchants | 2 | - |
| 11.2 LocationService.ts | 6 | - |
| 11.3 LocationSettingsScreen.tsx | 4 | - |
| 11.4 Background location task | 4 | - |
| 11.5 Push notification integration | 3 | - |
| 11.6 Unit tests (40+) | 3 | - |
| **Total** | **22** | |

### F12: Loyalty Points Aggregator

| Task | Est. Hours | Assignee |
|------|-----------|----------|
| 12.1 DB migration + seed programs | 3 | - |
| 12.2 LoyaltyService.ts | 6 | - |
| 12.3 LoyaltyDashboardScreen.tsx | 4 | - |
| 12.4 LoyaltyProgramScreen.tsx | 3 | - |
| 12.5 Transfer partner logic | 2 | - |
| 12.6 Unit tests (40+) | 3 | - |
| **Total** | **18** | |

### F14: Receipt Scanner

| Task | Est. Hours | Assignee |
|------|-----------|----------|
| 14.1 DB migration | 1 | - |
| 14.2 ReceiptService.ts | 5 | - |
| 14.3 OCR edge function | 4 | - |
| 14.4 ReceiptScannerScreen.tsx | 4 | - |
| 14.5 ReceiptsHistoryScreen.tsx | 3 | - |
| 14.6 Mismatch analysis | 2 | - |
| 14.7 Unit tests (40+) | 3 | - |
| **Total** | **20** | |

### F15: Achievements & Badges

| Task | Est. Hours | Assignee |
|------|-----------|----------|
| 15.1 DB migration + seed achievements | 3 | - |
| 15.2 AchievementsService.ts | 5 | - |
| 15.3 AchievementsScreen.tsx | 4 | - |
| 15.4 AchievementUnlockModal.tsx | 2 | - |
| 15.5 Event hooks in existing services | 2 | - |
| 15.6 Unit tests (40+) | 3 | - |
| **Total** | **16** | |

### F16: Application Tracker

| Task | Est. Hours | Assignee |
|------|-----------|----------|
| 16.1 DB migration | 1 | - |
| 16.2 ApplicationTrackerService.ts | 4 | - |
| 16.3 ApplicationTrackerScreen.tsx | 4 | - |
| 16.4 Velocity rules engine | 2 | - |
| 16.5 Unit tests (40+) | 3 | - |
| **Total** | **12** | |

### F18: Voice Commands

| Task | Est. Hours | Assignee |
|------|-----------|----------|
| 18.1 VoiceCommandService.ts | 5 | - |
| 18.2 Siri Shortcuts integration | 4 | - |
| 18.3 VoiceCommandsScreen.tsx | 3 | - |
| 18.4 VoiceMicButton.tsx + overlay | 3 | - |
| 18.5 Unit tests (40+) | 3 | - |
| **Total** | **16** | |

### F19: Apple Wallet Passes

| Task | Est. Hours | Assignee |
|------|-----------|----------|
| 19.1 DB migration | 1 | - |
| 19.2 WalletPassService.ts | 5 | - |
| 19.3 generate-pass edge function | 5 | - |
| 19.4 WalletPassesScreen.tsx | 4 | - |
| 19.5 Pass update mechanism | 2 | - |
| 19.6 Unit tests (40+) | 3 | - |
| **Total** | **18** | |

### F20: Bill Payment Tracker

| Task | Est. Hours | Assignee |
|------|-----------|----------|
| 20.1 DB migration | 1 | - |
| 20.2 BillPaymentService.ts | 5 | - |
| 20.3 BillPaymentScreen.tsx | 4 | - |
| 20.4 PaymentCalendar.tsx | 2 | - |
| 20.5 Interest calculator | 1 | - |
| 20.6 Notification scheduling | 2 | - |
| 20.7 Unit tests (40+) | 3 | - |
| **Total** | **14** | |

---

## Test Plan

**Target: 500+ new tests → Total ~1,170 tests**

### Service Tests (Unit)

| Service | Test Count | Coverage Areas |
|---------|-----------|----------------|
| LocationService | 45 | Permissions, geofencing, quiet hours, notifications |
| LoyaltyService | 50 | Programs, accounts, valuations, transfers, summary |
| ReceiptService | 45 | OCR parsing, card matching, mismatch detection |
| AchievementsService | 55 | Progress tracking, unlocks, streaks, challenges |
| ApplicationTrackerService | 45 | CRUD, velocity rules, 5/24, issuer stats |
| VoiceCommandService | 40 | Command parsing, TTS, shortcut management |
| WalletPassService | 40 | Pass generation, device registration, updates |
| BillPaymentService | 45 | Schedules, reminders, interest calc, calendar |
| **Total Service Tests** | **365** | |

### Integration Tests

| Area | Test Count | Coverage |
|------|-----------|----------|
| Database operations | 40 | RLS policies, migrations, seeds |
| Edge functions | 20 | OCR, pass generation |
| Notification scheduling | 15 | Push notifications, timing |
| Cross-service triggers | 25 | Achievement events, analytics |
| **Total Integration Tests** | **100** | |

### Component Tests

| Component Category | Test Count | Coverage |
|-------------------|-----------|----------|
| Screen renders | 30 | Loading, empty, data states |
| User interactions | 25 | Buttons, forms, modals |
| Tier gating | 15 | LockedFeature displays correctly |
| **Total Component Tests** | **70** | |

### Test Patterns

```typescript
// Example service test structure
describe('AchievementsService', () => {
  beforeEach(() => {
    resetAchievementsCache();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should load achievements from Supabase when configured', async () => {
      // ...
    });

    it('should fall back to local storage when offline', async () => {
      // ...
    });
  });

  describe('progress tracking', () => {
    it('should increment progress for count achievements', async () => {
      // ...
    });

    it('should unlock achievement when threshold reached', async () => {
      // ...
    });

    it('should not double-unlock achievements', async () => {
      // ...
    });
  });

  describe('streaks', () => {
    it('should continue streak for consecutive days', async () => {
      // ...
    });

    it('should reset streak after missed day', async () => {
      // ...
    });
  });
});
```

---

## Integration Points

### Achievement Triggers

| Trigger Event | Source Service | Achievement(s) Affected |
|--------------|----------------|------------------------|
| Card added | CardPortfolioManager | card_collector, wallet_king |
| Sage chat sent | SageService | sage_whisperer |
| AutoPilot enabled | AutoPilotService | autopilot_ace |
| Receipt scanned | ReceiptService | scanner_pro |
| Recommendation followed | BestCardRecommendationService | optimizer |
| Points logged | LoyaltyService | points_baron, points_mogul |
| App opened (time-based) | AchievementsService | night_owl, early_bird |
| Total savings threshold | SavingsReportService | savings_starter, centurion, rewards_master |

### Notification Triggers

| Event | Source | Notification Type |
|-------|--------|-------------------|
| Near merchant | LocationService | location_recommendation |
| Points expiring (<30 days) | LoyaltyService | points_expiring |
| Receipt card mismatch | ReceiptService | receipt_mismatch |
| Achievement unlocked | AchievementsService | achievement_unlocked |
| Velocity rule approaching | ApplicationTrackerService | application_velocity |
| Bill due (X days before) | BillPaymentService | bill_payment_due |
| Weekly challenge ending | AchievementsService | challenge_ending |

### Data Flow

```
                    ┌─────────────────┐
                    │   HomeScreen    │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐  ┌─────────────────┐  ┌───────────────┐
│ LoyaltyWidget │  │ BillDueWidget   │  │ AchievementsBadge │
└───────┬───────┘  └────────┬────────┘  └───────┬───────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌─────────────────┐  ┌───────────────────┐
│LoyaltyService │  │BillPaymentService│ │AchievementsService│
└───────┬───────┘  └────────┬────────┘  └───────┬───────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   Supabase    │
                    └───────────────┘
```

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| OCR accuracy issues | Medium | Medium | Confidence threshold + manual verification |
| Siri Shortcuts API changes | Low | Medium | Abstract native calls, fallback to in-app voice |
| Background location battery drain | Medium | High | Geofencing over continuous tracking, user controls |
| Apple Wallet signing complexity | High | Medium | Use passkit-generator, document cert setup |
| Push notification delivery | Low | Medium | Multiple reminder days, in-app fallback |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Low adoption of achievements | Medium | Low | Gamification research, A/B test badge designs |
| User confusion with velocity rules | Medium | Medium | Clear explanations, visual countdown |
| Receipt scanner privacy concerns | Medium | High | Clear data policy, local-first processing option |

### Dependencies

| Dependency | Risk Level | Notes |
|-----------|-----------|-------|
| expo-location | Low | Well-maintained, core Expo |
| expo-camera | Low | Well-maintained, core Expo |
| expo-notifications | Low | Well-maintained, core Expo |
| expo-speech | Low | Basic TTS functionality |
| Google Vision API | Medium | Requires API key, rate limits |
| passkit-generator | Medium | Requires Apple Developer signing certs |

---

## Appendix: Types to Add

Add these types to `src/types/index.ts`:

```typescript
// ============================================================================
// Cycle 2 Features
// ============================================================================

/**
 * F11: Location-Based Recommendations
 */
export interface MerchantLocation {
  id: string;
  chainName: string;
  displayName: string;
  category: SpendingCategory;
  logoUrl?: string;
  isActive: boolean;
}

export interface UserLocationPrefs {
  id: string;
  userId: string;
  isEnabled: boolean;
  radiusMeters: 100 | 500 | 1000;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

/**
 * F12: Loyalty Points Aggregator
 */
export interface LoyaltyProgram {
  id: string;
  programName: string;
  programType: 'airline' | 'hotel' | 'retail' | 'bank' | 'coalition';
  currencyName: string;
  logoUrl?: string;
  websiteUrl?: string;
  isActive: boolean;
}

export interface PointValuation {
  id: string;
  programId: string;
  centsPerPoint: number;
  valuationMethod?: string;
  lastUpdated: Date;
  notes?: string;
}

export interface UserLoyaltyAccount {
  id: string;
  userId: string;
  programId: string;
  memberNumber?: string;
  currentBalance: number;
  expiryDate?: Date;
  lastBalanceUpdate: Date;
  notes?: string;
}

/**
 * F14: Receipt Scanner
 */
export interface Receipt {
  id: string;
  userId: string;
  merchantName?: string;
  amount?: number;
  transactionDate?: Date;
  cardUsed?: string;
  cardLastFour?: string;
  optimalCard?: string;
  rewardsEarned?: number;
  rewardsMissed?: number;
  category?: SpendingCategory;
  imageUrl?: string;
  ocrData: Record<string, any>;
  ocrConfidence?: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * F15: Achievements
 */
export type AchievementCategory = 
  | 'savings' 
  | 'streak' 
  | 'feature_usage' 
  | 'collection' 
  | 'points' 
  | 'special';

export interface Achievement {
  id: string;
  achievementKey: string;
  name: string;
  description: string;
  category: AchievementCategory;
  iconName: string;
  pointsValue: number;
  requirementType: 'count' | 'threshold' | 'boolean';
  requirementValue: number;
  tier: 'free' | 'pro' | 'max';
  isActive: boolean;
  displayOrder: number;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  currentProgress: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  lastProgressUpdate: Date;
}

/**
 * F16: Application Tracker
 */
export type ApplicationStatus = 'pending' | 'approved' | 'denied' | 'cancelled';
export type CreditBureau = 'equifax' | 'transunion' | 'both' | 'none';

export interface CardApplication {
  id: string;
  userId: string;
  issuer: string;
  cardName: string;
  applicationDate: Date;
  status: ApplicationStatus;
  creditLimit?: number;
  hardPullBureau?: CreditBureau;
  annualFee?: number;
  signupBonusValue?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * F19: Wallet Passes
 */
export type PassType = 'apple' | 'google';

export interface WalletPass {
  id: string;
  userId: string;
  cardId: string;
  passType: PassType;
  passSerial: string;
  deviceTokens: string[];
  lastUpdated: Date;
  isActive: boolean;
}

/**
 * F20: Bill Payment
 */
export type PaymentType = 'minimum' | 'full' | 'partial' | 'autopay';

export interface BillSchedule {
  id: string;
  userId: string;
  cardId: string;
  dueDay: number;
  reminderDaysBefore: number[];
  hasAutopay: boolean;
  minimumPayment?: number;
  statementBalance?: number;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentHistory {
  id: string;
  userId: string;
  cardId: string;
  paymentDate: Date;
  amount: number;
  paymentType: PaymentType;
  wasLate: boolean;
  notes?: string;
}
```

---

## Appendix: Navigation Updates

Add to `src/navigation/AppNavigator.tsx`:

```typescript
// Add to InsightsStackParamList
export type InsightsStackParamList = {
  // ... existing
  LocationSettings: undefined;
  LoyaltyDashboard: undefined;
  LoyaltyProgram: { accountId: string };
  ReceiptScanner: undefined;
  ReceiptsHistory: undefined;
  ReceiptDetail: { receiptId: string };
  Achievements: undefined;
  ApplicationTracker: undefined;
  VoiceCommands: undefined;
  WalletPasses: undefined;
  BillPayment: undefined;
};

// Add screens to InsightsStack.Navigator
<InsightsStack.Screen name="LocationSettings" component={LocationSettingsScreen} />
<InsightsStack.Screen name="LoyaltyDashboard" component={LoyaltyDashboardScreen} />
<InsightsStack.Screen name="LoyaltyProgram" component={LoyaltyProgramScreen} />
<InsightsStack.Screen name="ReceiptScanner" component={ReceiptScannerScreen} />
<InsightsStack.Screen name="ReceiptsHistory" component={ReceiptsHistoryScreen} />
<InsightsStack.Screen name="Achievements" component={AchievementsScreen} />
<InsightsStack.Screen name="ApplicationTracker" component={ApplicationTrackerScreen} />
<InsightsStack.Screen name="VoiceCommands" component={VoiceCommandsScreen} />
<InsightsStack.Screen name="WalletPasses" component={WalletPassesScreen} />
<InsightsStack.Screen name="BillPayment" component={BillPaymentScreen} />
```

---

*Document ready for Sonnet dev team implementation.*