-- ============================================================================
-- Affiliate Clicks Table - Track card application link clicks
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id TEXT NOT NULL,
  card_name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  url_opened TEXT NOT NULL,
  source_screen TEXT NOT NULL DEFAULT 'unknown',
  user_tier TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_card_id ON public.affiliate_clicks(card_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_user_id ON public.affiliate_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_created_at ON public.affiliate_clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_source_screen ON public.affiliate_clicks(source_screen);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Users can insert their own clicks (or anonymous clicks with null user_id)
CREATE POLICY "Anyone can insert affiliate clicks"
  ON public.affiliate_clicks
  FOR INSERT
  WITH CHECK (true);

-- Users can only read their own clicks
CREATE POLICY "Users can read own clicks"
  ON public.affiliate_clicks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admin/service role can read all clicks
CREATE POLICY "Service role can read all clicks"
  ON public.affiliate_clicks
  FOR SELECT
  USING (auth.role() = 'service_role');

-- ============================================================================
-- Add applicationUrl and affiliateUrl to cards table (if not exists)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'application_url') THEN
    ALTER TABLE public.cards ADD COLUMN application_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'affiliate_url') THEN
    ALTER TABLE public.cards ADD COLUMN affiliate_url TEXT;
  END IF;
END $$;

-- ============================================================================
-- Analytics View - Top cards by clicks
-- ============================================================================

CREATE OR REPLACE VIEW public.affiliate_click_analytics AS
SELECT
  card_id,
  card_name,
  issuer,
  COUNT(*) as total_clicks,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) FILTER (WHERE user_tier = 'free') as free_clicks,
  COUNT(*) FILTER (WHERE user_tier = 'pro') as pro_clicks,
  COUNT(*) FILTER (WHERE user_tier = 'max') as max_clicks,
  MAX(created_at) as last_clicked_at
FROM public.affiliate_clicks
GROUP BY card_id, card_name, issuer
ORDER BY total_clicks DESC;
