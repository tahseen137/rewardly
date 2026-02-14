-- Cycle 3: Spending Profiles Table
-- Stores user spending profiles for F21 (Wallet Optimizer), F22 (Signup Bonus ROI), F23 (Fee Breakeven)

CREATE TABLE spending_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  groceries NUMERIC DEFAULT 0 CHECK (groceries >= 0),
  dining NUMERIC DEFAULT 0 CHECK (dining >= 0),
  gas NUMERIC DEFAULT 0 CHECK (gas >= 0),
  travel NUMERIC DEFAULT 0 CHECK (travel >= 0),
  online_shopping NUMERIC DEFAULT 0 CHECK (online_shopping >= 0),
  entertainment NUMERIC DEFAULT 0 CHECK (entertainment >= 0),
  drugstores NUMERIC DEFAULT 0 CHECK (drugstores >= 0),
  home_improvement NUMERIC DEFAULT 0 CHECK (home_improvement >= 0),
  transit NUMERIC DEFAULT 0 CHECK (transit >= 0),
  other NUMERIC DEFAULT 0 CHECK (other >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Index for fast user lookup
CREATE INDEX idx_spending_profiles_user_id ON spending_profiles(user_id);

-- Enable RLS
ALTER TABLE spending_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own spending profile"
  ON spending_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spending profile"
  ON spending_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spending profile"
  ON spending_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spending profile"
  ON spending_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at
CREATE TRIGGER set_spending_profiles_updated_at
  BEFORE UPDATE ON spending_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
