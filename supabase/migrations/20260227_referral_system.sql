-- ============================================================
-- Rewardly Referral System - Phase 1: Database Schema
-- ============================================================
-- Phase 1 covers: referral_codes, referral_signups, referral_clicks tables,
-- helper function (increment_referral_usage), and RLS policies.

-- Enable uuid-ossp if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Table: referral_codes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  code          VARCHAR(12) UNIQUE NOT NULL,  -- e.g. 'REWARD-ABC123'
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year'),
  is_active     BOOLEAN     DEFAULT TRUE,
  usage_count   INTEGER     DEFAULT 0,
  max_uses      INTEGER     DEFAULT NULL  -- NULL = unlimited
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON public.referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);

COMMENT ON TABLE public.referral_codes IS
  'Each user has at most one active referral code. Format: REWARD-XXXXXX';

-- ============================================================
-- Table: referral_signups
-- ============================================================
CREATE TABLE IF NOT EXISTS public.referral_signups (
  id                 UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_code_id   UUID        REFERENCES public.referral_codes(id),
  referrer_user_id   UUID        REFERENCES auth.users(id),
  referee_user_id    UUID        REFERENCES auth.users(id),
  referrer_reward    VARCHAR(255),  -- e.g. '1 month Pro', 'Advocate badge'
  referee_reward     VARCHAR(255),  -- e.g. 'Welcome bonus'
  signed_up_at       TIMESTAMPTZ DEFAULT NOW(),
  reward_claimed_at  TIMESTAMPTZ,
  status             VARCHAR(20)  DEFAULT 'pending'
    CHECK (status IN ('pending', 'claimed', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_referral_signups_referrer ON public.referral_signups(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_signups_referee  ON public.referral_signups(referee_user_id);

COMMENT ON TABLE public.referral_signups IS
  'Records each successful referral conversion and associated rewards.';

-- ============================================================
-- Table: referral_clicks  (optional analytics)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.referral_clicks (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_code_id  UUID        REFERENCES public.referral_codes(id),
  clicked_at        TIMESTAMPTZ DEFAULT NOW(),
  ip_address        INET,
  user_agent        TEXT,
  converted         BOOLEAN     DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_referral_clicks_code ON public.referral_clicks(referral_code_id);

COMMENT ON TABLE public.referral_clicks IS
  'Tracks every click on a referral link for analytics and fraud detection.';

-- ============================================================
-- RPC: increment_referral_usage
-- Atomically bumps usage_count and optionally deactivates at max_uses
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_referral_usage(code_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.referral_codes
  SET usage_count = usage_count + 1,
      is_active = CASE
        WHEN max_uses IS NOT NULL AND usage_count + 1 >= max_uses THEN FALSE
        ELSE is_active
      END
  WHERE id = code_id;
END;
$$;

COMMENT ON FUNCTION public.increment_referral_usage IS
  'Atomically increments usage_count and auto-deactivates code when max_uses is reached.';

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- referral_codes -----------------------------------------------
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- Users can only read their own codes
CREATE POLICY "Users can view own referral codes"
  ON public.referral_codes FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own codes (one per user enforced in service layer)
CREATE POLICY "Users can create own referral codes"
  ON public.referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow reading any active referral code (needed to validate incoming ref= links)
CREATE POLICY "Anyone can read active referral codes"
  ON public.referral_codes FOR SELECT
  USING (is_active = TRUE);

-- referral_signups ---------------------------------------------
ALTER TABLE public.referral_signups ENABLE ROW LEVEL SECURITY;

-- Users can see referrals they were part of (as referrer OR referee)
CREATE POLICY "Users can view own referral signups"
  ON public.referral_signups FOR SELECT
  USING (
    auth.uid() = referrer_user_id OR
    auth.uid() = referee_user_id
  );

-- Service role can insert (used by edge function on signup)
CREATE POLICY "Service role can insert referral signups"
  ON public.referral_signups FOR INSERT
  WITH CHECK (TRUE);

-- referral_clicks ----------------------------------------------
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a click (anonymous tracking)
CREATE POLICY "Anyone can insert referral clicks"
  ON public.referral_clicks FOR INSERT
  WITH CHECK (TRUE);

-- Users can read clicks for their own codes
CREATE POLICY "Users can view clicks on own codes"
  ON public.referral_clicks FOR SELECT
  USING (
    referral_code_id IN (
      SELECT id FROM public.referral_codes WHERE user_id = auth.uid()
    )
  );
