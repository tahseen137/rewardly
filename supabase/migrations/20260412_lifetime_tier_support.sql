-- Migration: Add lifetime tier support to subscriptions table
-- Date: 2026-04-12
-- Description: Adds 'lifetime' to tier/status CHECK constraints and
--              creates an RLS policy for anonymous lifetime spot counting.

-- ============================================================================
-- Step 1: Expand tier CHECK constraint to include 'lifetime'
-- ============================================================================

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_tier_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_tier_check
  CHECK (tier IN ('pro', 'max', 'lifetime'));

-- ============================================================================
-- Step 2: Expand status CHECK constraint to include 'lifetime'
-- ============================================================================

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'incomplete', 'lifetime'));

-- ============================================================================
-- Step 3: Add index on tier for the lifetime count query
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier);

-- ============================================================================
-- Step 4: RLS policy — allow anyone to count lifetime subscriptions
-- (returns only the count, not row data, since the app uses head: true)
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can count lifetime subscriptions" ON subscriptions;
CREATE POLICY "Anyone can count lifetime subscriptions" ON subscriptions
  FOR SELECT
  USING (tier = 'lifetime');
