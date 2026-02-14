-- ============================================================================
-- Migration: 016_cycle1_features.sql
-- Description: Cycle 1 features - SUB tracker, spending log, recurring charges,
--              annual fees, notifications, benefits, savings reports
-- Author: Dev Team
-- Date: 2026-02-13
-- ============================================================================

-- ============================================================================
-- F1: Card Benefits - Add benefits JSON to cards table
-- ============================================================================

ALTER TABLE cards 
ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN cards.benefits IS 'Array of benefit objects: [{name, description, category, value}]';

-- Benefit categories: travel, purchase, insurance, lifestyle
-- Example: [{"name": "Travel Insurance", "description": "Up to $500K coverage", "category": "travel", "value": "$500,000"}]

-- ============================================================================
-- F2: SUB (Sign-Up Bonus) Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS sub_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_id VARCHAR(100) NOT NULL, -- card_key reference
    target_amount DECIMAL(10,2) NOT NULL,
    current_amount DECIMAL(10,2) DEFAULT 0,
    start_date DATE NOT NULL,
    deadline_date DATE NOT NULL,
    bonus_description TEXT,
    bonus_amount INTEGER, -- points/dollars value
    bonus_currency VARCHAR(20), -- 'points', 'cashback', etc.
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_tracking_user ON sub_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_tracking_status ON sub_tracking(status);
CREATE INDEX IF NOT EXISTS idx_sub_tracking_deadline ON sub_tracking(deadline_date);

-- RLS
ALTER TABLE sub_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own SUB tracking" ON sub_tracking
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- F4: Spending Log
-- ============================================================================

CREATE TABLE IF NOT EXISTS spending_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    store_name VARCHAR(200),
    card_used VARCHAR(100) NOT NULL, -- card_key
    optimal_card VARCHAR(100), -- card_key of best card
    rewards_earned DECIMAL(10,4), -- actual rewards earned
    rewards_missed DECIMAL(10,4), -- rewards left on table
    transaction_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_spending_log_user ON spending_log(user_id);
CREATE INDEX IF NOT EXISTS idx_spending_log_date ON spending_log(transaction_date);
CREATE INDEX IF NOT EXISTS idx_spending_log_category ON spending_log(category);
CREATE INDEX IF NOT EXISTS idx_spending_log_card ON spending_log(card_used);

-- RLS
ALTER TABLE spending_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own spending log" ON spending_log
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- F5: Recurring Charges
-- ============================================================================

CREATE TABLE IF NOT EXISTS recurring_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    billing_day INTEGER CHECK (billing_day >= 1 AND billing_day <= 31),
    current_card VARCHAR(100), -- card_key
    optimal_card VARCHAR(100), -- card_key recommended
    current_rewards DECIMAL(10,4), -- rewards with current card
    optimal_rewards DECIMAL(10,4), -- rewards with optimal card
    monthly_savings DECIMAL(10,4), -- difference
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recurring_charges_user ON recurring_charges(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_charges_active ON recurring_charges(is_active);

-- RLS
ALTER TABLE recurring_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own recurring charges" ON recurring_charges
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- F6: User Card Tracking (for annual fees, open dates)
-- ============================================================================

-- Add columns to existing user_cards table
ALTER TABLE user_cards 
ADD COLUMN IF NOT EXISTS card_open_date DATE,
ADD COLUMN IF NOT EXISTS annual_fee_renewal_month INTEGER CHECK (annual_fee_renewal_month >= 1 AND annual_fee_renewal_month <= 12),
ADD COLUMN IF NOT EXISTS last_fee_alert_sent DATE;

-- ============================================================================
-- F9: Notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'sub_deadline', 
        'fee_renewal', 
        'bonus_category', 
        'monthly_report', 
        'new_card_offer',
        'spending_alert',
        'general'
    )),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    action_url TEXT, -- deep link or screen name
    action_data JSONB, -- additional data for navigation
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notifications" ON notifications
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- F10: Monthly Savings Reports
-- ============================================================================

CREATE TABLE IF NOT EXISTS savings_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_month DATE NOT NULL, -- first day of month
    total_spend DECIMAL(12,2) DEFAULT 0,
    total_rewards_earned DECIMAL(10,4) DEFAULT 0,
    total_rewards_missed DECIMAL(10,4) DEFAULT 0,
    best_card VARCHAR(100), -- card_key
    best_card_earnings DECIMAL(10,4),
    worst_card VARCHAR(100), -- card_key
    worst_card_earnings DECIMAL(10,4),
    category_breakdown JSONB DEFAULT '[]'::jsonb, -- [{category, spend, earned, missed}]
    optimization_score INTEGER, -- 0-100
    generated_at TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT unique_user_month UNIQUE (user_id, report_month)
);

CREATE INDEX IF NOT EXISTS idx_savings_reports_user ON savings_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_reports_month ON savings_reports(report_month);

-- RLS
ALTER TABLE savings_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own reports" ON savings_reports
    FOR SELECT USING (auth.uid() = user_id);

-- Service role generates reports
CREATE POLICY "Service role manages reports" ON savings_reports
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- F7: Transfer Partners (for Redemption Guide)
-- ============================================================================

CREATE TABLE IF NOT EXISTS transfer_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES reward_programs(id) ON DELETE CASCADE,
    partner_name VARCHAR(200) NOT NULL,
    partner_type VARCHAR(50) CHECK (partner_type IN ('airline', 'hotel')),
    transfer_ratio DECIMAL(5,2) NOT NULL, -- e.g., 1.0 = 1:1, 0.5 = 2:1
    transfer_time VARCHAR(100), -- "Instant", "1-2 days"
    sweet_spots TEXT[], -- Array of notable redemptions
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transfer_partners_program ON transfer_partners(program_id);

-- Public read access for transfer partners
ALTER TABLE transfer_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read transfer partners" ON transfer_partners
    FOR SELECT USING (true);

-- ============================================================================
-- Update Triggers
-- ============================================================================

DROP TRIGGER IF EXISTS update_sub_tracking_updated_at ON sub_tracking;
CREATE TRIGGER update_sub_tracking_updated_at
    BEFORE UPDATE ON sub_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_spending_log_updated_at ON spending_log;
CREATE TRIGGER update_spending_log_updated_at
    BEFORE UPDATE ON spending_log
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recurring_charges_updated_at ON recurring_charges;
CREATE TRIGGER update_recurring_charges_updated_at
    BEFORE UPDATE ON recurring_charges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Feature Flags in Profile (for tier-gated features)
-- ============================================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- Grants
-- ============================================================================

GRANT ALL ON sub_tracking TO authenticated;
GRANT ALL ON spending_log TO authenticated;
GRANT ALL ON recurring_charges TO authenticated;
GRANT ALL ON notifications TO authenticated;
GRANT SELECT ON savings_reports TO authenticated;
GRANT SELECT ON transfer_partners TO authenticated;

-- ============================================================================
-- Done
-- ============================================================================
