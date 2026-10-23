-- ============================================================================
-- Migration: 015_pricing_tiers.sql
-- Description: Add pricing tiers (Free/Pro/Max) with Stripe subscriptions
-- Author: Dev Team
-- Date: 2026-02-13
-- ============================================================================

-- ============================================================================
-- Step 1: Update profiles table with tier and admin fields
-- ============================================================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'max'));

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create index for tier lookups
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(tier);

-- ============================================================================
-- Step 2: Create subscriptions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('pro', 'max')),
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'incomplete')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ============================================================================
-- Step 3: Create sage_usage table for tracking AI chat usage
-- ============================================================================

CREATE TABLE IF NOT EXISTS sage_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- '2026-02' format
  chat_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Index for sage_usage lookups
CREATE INDEX IF NOT EXISTS idx_sage_usage_user_month ON sage_usage(user_id, month);

-- ============================================================================
-- Step 4: RLS Policies
-- ============================================================================

-- Enable RLS on subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
DROP POLICY IF EXISTS "Users read own subscription" ON subscriptions;
CREATE POLICY "Users read own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Enable RLS on sage_usage
ALTER TABLE sage_usage ENABLE ROW LEVEL SECURITY;

-- Users can read their own sage usage
DROP POLICY IF EXISTS "Users read own sage usage" ON sage_usage;
CREATE POLICY "Users read own sage usage" ON sage_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own sage usage
DROP POLICY IF EXISTS "Users insert own sage usage" ON sage_usage;
CREATE POLICY "Users insert own sage usage" ON sage_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own sage usage
DROP POLICY IF EXISTS "Users update own sage usage" ON sage_usage;
CREATE POLICY "Users update own sage usage" ON sage_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- Step 5: Function to update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Step 6: Function to sync subscription tier to profile
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_subscription_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- When subscription is active, update profile tier
  IF NEW.status = 'active' OR NEW.status = 'trialing' THEN
    UPDATE profiles SET tier = NEW.tier WHERE user_id = NEW.user_id;
  END IF;
  
  -- When subscription is canceled and period ended, downgrade to free
  IF NEW.status = 'canceled' AND NEW.current_period_end < now() THEN
    UPDATE profiles SET tier = 'free' WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync subscription tier
DROP TRIGGER IF EXISTS sync_subscription_tier_trigger ON subscriptions;
CREATE TRIGGER sync_subscription_tier_trigger
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_tier();

-- ============================================================================
-- Step 7: Service role policies for edge functions
-- ============================================================================

-- Allow service role to manage subscriptions (for webhooks)
DROP POLICY IF EXISTS "Service role manages subscriptions" ON subscriptions;
CREATE POLICY "Service role manages subscriptions" ON subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow service role to manage sage_usage (for tracking)
DROP POLICY IF EXISTS "Service role manages sage usage" ON sage_usage;
CREATE POLICY "Service role manages sage usage" ON sage_usage
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- Done
-- ============================================================================
