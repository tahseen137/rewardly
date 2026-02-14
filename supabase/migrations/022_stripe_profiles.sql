-- ============================================================================
-- Migration: 022_stripe_profiles.sql
-- Description: Create profiles table for Stripe subscription management
-- The edge functions (create-checkout, stripe-webhook, manage-subscription)
-- reference a 'profiles' table with user_id, tier, stripe_customer_id, is_admin
-- ============================================================================

-- Step 1: Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'max')),
  is_admin BOOLEAN DEFAULT false,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(tier);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);

-- Step 2: Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own profile (limited fields)
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can do anything (for webhooks)
DROP POLICY IF EXISTS "Service role manages profiles" ON profiles;
CREATE POLICY "Service role manages profiles" ON profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Step 3: Create subscriptions table (the one the edge functions expect)
-- Drop and recreate if the old one has incompatible schema
DO $$
BEGIN
  -- Check if subscriptions table has stripe_subscription_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'stripe_subscription_id'
  ) THEN
    -- Drop old subscriptions table and recreate
    DROP TABLE IF EXISTS subscriptions CASCADE;
    
    CREATE TABLE subscriptions (
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

    CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

    ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users read own subscription" ON subscriptions
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Service role manages subscriptions" ON subscriptions
      FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

-- Step 4: Create sage_usage table
CREATE TABLE IF NOT EXISTS sage_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  chat_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_sage_usage_user_month ON sage_usage(user_id, month);

ALTER TABLE sage_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own sage usage" ON sage_usage;
CREATE POLICY "Users read own sage usage" ON sage_usage
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own sage usage" ON sage_usage;
CREATE POLICY "Users insert own sage usage" ON sage_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own sage usage" ON sage_usage;
CREATE POLICY "Users update own sage usage" ON sage_usage
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages sage usage" ON sage_usage;
CREATE POLICY "Service role manages sage usage" ON sage_usage
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Step 5: Updated at trigger for profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Sync subscription tier to profile
CREATE OR REPLACE FUNCTION sync_subscription_tier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' OR NEW.status = 'trialing' THEN
    UPDATE profiles SET tier = NEW.tier WHERE user_id = NEW.user_id;
  END IF;
  
  IF NEW.status = 'canceled' AND NEW.current_period_end < now() THEN
    UPDATE profiles SET tier = 'free' WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_subscription_tier_trigger ON subscriptions;
CREATE TRIGGER sync_subscription_tier_trigger
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_tier();

-- Step 7: Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, tier, is_admin)
  VALUES (NEW.id, 'free', false)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- Step 8: Create profiles for existing users who don't have one
INSERT INTO profiles (user_id, tier, is_admin)
SELECT id, 'free', false
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM profiles)
ON CONFLICT (user_id) DO NOTHING;

-- Step 9: Grant permissions
GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON sage_usage TO authenticated;
