-- ============================================================================
-- Cycle 4: CSV Statement Upload Tables
-- Migration 020: statement_uploads, parsed_transactions, user_merchant_mappings
-- ============================================================================

-- Statement uploads table
CREATE TABLE IF NOT EXISTS statement_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  bank TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  transaction_count INTEGER DEFAULT 0,
  total_spend NUMERIC(10, 2) DEFAULT 0,
  total_credits NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Parsed transactions table
CREATE TABLE IF NOT EXISTS parsed_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  statement_id UUID REFERENCES statement_uploads(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  normalized_merchant TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  is_credit BOOLEAN DEFAULT false,
  category TEXT NOT NULL,
  category_confidence TEXT DEFAULT 'medium',
  user_corrected BOOLEAN DEFAULT false,
  source_bank TEXT,
  card_last4 TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User merchant mappings table (for custom categorization)
CREATE TABLE IF NOT EXISTS user_merchant_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pattern TEXT NOT NULL,
  category TEXT NOT NULL,
  merchant_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_statements_user_date 
  ON statement_uploads(user_id, period_start DESC, period_end DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
  ON parsed_transactions(user_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_category 
  ON parsed_transactions(user_id, category);

CREATE INDEX IF NOT EXISTS idx_transactions_statement 
  ON parsed_transactions(statement_id);

CREATE INDEX IF NOT EXISTS idx_merchant_mappings_user 
  ON user_merchant_mappings(user_id);

-- Row Level Security (RLS)
ALTER TABLE statement_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE parsed_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_merchant_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for statement_uploads
CREATE POLICY "Users can view own statements" 
  ON statement_uploads FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own statements" 
  ON statement_uploads FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own statements" 
  ON statement_uploads FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own statements" 
  ON statement_uploads FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for parsed_transactions
CREATE POLICY "Users can view own transactions" 
  ON parsed_transactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" 
  ON parsed_transactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" 
  ON parsed_transactions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" 
  ON parsed_transactions FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for user_merchant_mappings
CREATE POLICY "Users can view own mappings" 
  ON user_merchant_mappings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mappings" 
  ON user_merchant_mappings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mappings" 
  ON user_merchant_mappings FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mappings" 
  ON user_merchant_mappings FOR DELETE 
  USING (auth.uid() = user_id);

-- Updated_at trigger for statement_uploads
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_statement_uploads_updated_at 
  BEFORE UPDATE ON statement_uploads 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
