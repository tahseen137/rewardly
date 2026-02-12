-- Migration: 008_user_profiles.sql
-- Description: Add user profiles and user cards tables for synced portfolio
-- Also adds country support to cards table

-- ============================================================================
-- Add country column to cards table
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cards' AND column_name = 'country'
    ) THEN
        ALTER TABLE cards ADD COLUMN country VARCHAR(2) DEFAULT 'CA';
    END IF;
END $$;

-- Create index for country filtering
CREATE INDEX IF NOT EXISTS idx_cards_country ON cards(country);

-- Update cards_with_program_details view to include country
DROP VIEW IF EXISTS cards_with_program_details;

CREATE VIEW cards_with_program_details AS
SELECT 
    c.id,
    c.card_key,
    c.name,
    c.issuer,
    c.reward_program,
    c.reward_currency,
    c.point_valuation,
    c.annual_fee,
    c.base_reward_rate,
    c.base_reward_unit,
    c.is_active,
    c.country,
    c.created_at,
    c.updated_at,
    rp.program_name,
    rp.program_category,
    rp.direct_rate_cents,
    rp.optimal_rate_cents,
    rp.optimal_method,
    (
        SELECT json_agg(json_build_object(
            'redemption_type', pv.redemption_type,
            'cents_per_point', pv.cents_per_point,
            'minimum_redemption', pv.minimum_redemption,
            'notes', pv.notes
        ))
        FROM point_valuations pv
        WHERE pv.program_id = rp.id
    ) as redemption_options
FROM cards c
LEFT JOIN reward_programs rp ON c.reward_program_id = rp.id
WHERE c.is_active = true;

-- ============================================================================
-- User Profiles Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    country VARCHAR(2) DEFAULT 'US',
    display_name VARCHAR(100),
    avatar_url TEXT,
    preferred_language VARCHAR(2) DEFAULT 'en',
    onboarding_complete BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_country ON user_profiles(country);

-- RLS for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own profile
CREATE POLICY "Users can read own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- User Cards Table (synced portfolio)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_key VARCHAR(100) NOT NULL,
    nickname VARCHAR(100),
    notes TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique card per user
    CONSTRAINT unique_user_card UNIQUE (user_id, card_key)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_cards_user_id ON user_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cards_card_key ON user_cards(card_key);

-- RLS for user_cards
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own cards
CREATE POLICY "Users can read own cards" ON user_cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards" ON user_cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards" ON user_cards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards" ON user_cards
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- User Preferences Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique preference per user
    CONSTRAINT unique_user_preference UNIQUE (user_id, preference_key)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- RLS for user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- Subscriptions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL DEFAULT 'free',
    billing_period VARCHAR(20), -- 'monthly' | 'annual'
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    provider VARCHAR(50), -- 'stripe' | 'revenuecat' | 'apple' | 'google'
    provider_subscription_id VARCHAR(255),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    trial_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_tier CHECK (tier IN ('free', 'plus', 'pro', 'elite')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'canceled', 'past_due', 'trialing'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- RLS for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update subscriptions (done via webhooks)
CREATE POLICY "Service role can manage subscriptions" ON subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- Usage Tracking Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature VARCHAR(100) NOT NULL,
    count INTEGER DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique feature per user per period
    CONSTRAINT unique_usage_period UNIQUE (user_id, feature, period_start)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON usage_tracking(period_start, period_end);

-- RLS for usage_tracking
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage" ON usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON usage_tracking
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- Function to auto-create user profile on signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, display_name, country)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        'US'
    );
    
    -- Create free subscription
    INSERT INTO public.subscriptions (user_id, tier, status)
    VALUES (NEW.id, 'free', 'active');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Function to update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_cards_updated_at ON user_cards;
CREATE TRIGGER update_user_cards_updated_at
    BEFORE UPDATE ON user_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Grant permissions to authenticated users
-- ============================================================================

GRANT SELECT ON cards_with_program_details TO authenticated;
GRANT SELECT ON cards TO authenticated;
GRANT SELECT ON category_rewards TO authenticated;
GRANT SELECT ON signup_bonuses TO authenticated;
GRANT SELECT ON reward_programs TO authenticated;
GRANT SELECT ON point_valuations TO authenticated;

GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_cards TO authenticated;
GRANT ALL ON user_preferences TO authenticated;
GRANT SELECT ON subscriptions TO authenticated;
GRANT ALL ON usage_tracking TO authenticated;
