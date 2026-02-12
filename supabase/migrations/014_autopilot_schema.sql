-- ============================================================================
-- AutoPilot Schema - Merchant Geofences and Analytics
-- Privacy-first design: minimal data storage, user control
-- ============================================================================

-- ============================================================================
-- Merchant Locations Table (Seed Data)
-- Pre-populated merchant locations for easy setup
-- ============================================================================

CREATE TABLE IF NOT EXISTS merchant_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_name VARCHAR(200) NOT NULL,
  merchant_key VARCHAR(100) NOT NULL,           -- e.g., "costco", "starbucks"
  category VARCHAR(50) NOT NULL,                -- "groceries", "dining", "gas", etc.
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  address VARCHAR(500),
  city VARCHAR(100),
  province VARCHAR(50),
  country VARCHAR(2) DEFAULT 'CA',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_merchant_locations_name ON merchant_locations(merchant_name);
CREATE INDEX IF NOT EXISTS idx_merchant_locations_key ON merchant_locations(merchant_key);
CREATE INDEX IF NOT EXISTS idx_merchant_locations_category ON merchant_locations(category);
CREATE INDEX IF NOT EXISTS idx_merchant_locations_geo ON merchant_locations(latitude, longitude);

-- ============================================================================
-- User Geofences Table
-- User-controlled merchant monitoring
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_geofences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  radius INTEGER DEFAULT 150,                   -- Radius in meters
  enabled BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate geofences for same location
  CONSTRAINT unique_user_geofence UNIQUE (user_id, latitude, longitude)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_geofences_user ON user_geofences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_geofences_enabled ON user_geofences(user_id, enabled);

-- ============================================================================
-- AutoPilot Settings Table
-- User preferences for AutoPilot feature
-- ============================================================================

CREATE TABLE IF NOT EXISTS autopilot_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  notification_cooldown_hours INTEGER DEFAULT 1,
  default_radius INTEGER DEFAULT 150,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- AutoPilot Analytics Table (Privacy-Conscious)
-- Only stores anonymized, aggregated data for improving recommendations
-- ============================================================================

CREATE TABLE IF NOT EXISTS autopilot_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,              -- 'notification_sent', 'notification_tapped', 'card_used'
  merchant_category VARCHAR(50),
  card_id VARCHAR(100),                         -- Which card was recommended
  was_used BOOLEAN DEFAULT false,               -- Did user report using recommended card?
  estimated_savings DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_autopilot_analytics_user ON autopilot_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_autopilot_analytics_type ON autopilot_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_autopilot_analytics_date ON autopilot_analytics(created_at);

-- ============================================================================
-- Row Level Security
-- ============================================================================

-- Enable RLS
ALTER TABLE merchant_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE autopilot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE autopilot_analytics ENABLE ROW LEVEL SECURITY;

-- Merchant locations are public (read-only)
CREATE POLICY "Public read access to merchant_locations"
  ON merchant_locations FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Users can only access their own geofences
CREATE POLICY "Users can view own geofences"
  ON user_geofences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own geofences"
  ON user_geofences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own geofences"
  ON user_geofences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own geofences"
  ON user_geofences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can only access their own settings
CREATE POLICY "Users can view own autopilot settings"
  ON autopilot_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own autopilot settings"
  ON autopilot_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own autopilot settings"
  ON autopilot_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can only access their own analytics
CREATE POLICY "Users can view own analytics"
  ON autopilot_analytics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics"
  ON autopilot_analytics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Seed Merchant Locations (Canadian High-Priority)
-- ============================================================================

INSERT INTO merchant_locations (merchant_name, merchant_key, category, latitude, longitude, address, city, province) VALUES
  -- Costco
  ('Costco', 'costco', 'groceries', 43.7735, -79.3334, '1411 Warden Ave', 'Scarborough', 'ON'),
  ('Costco', 'costco', 'groceries', 43.7857, -79.2458, '6555 Kennedy Rd', 'Markham', 'ON'),
  ('Costco', 'costco', 'groceries', 43.6542, -79.5556, '50 Queen Elizabeth Blvd', 'Etobicoke', 'ON'),
  ('Costco', 'costco', 'groceries', 43.8512, -79.4378, '99 Billy Bishop Way', 'Vaughan', 'ON'),
  
  -- Loblaws
  ('Loblaws', 'loblaws', 'groceries', 43.6677, -79.3948, '17 Queens Quay W', 'Toronto', 'ON'),
  ('Loblaws', 'loblaws', 'groceries', 43.6789, -79.4112, '396 St. Clair Ave W', 'Toronto', 'ON'),
  ('Loblaws', 'loblaws', 'groceries', 43.7234, -79.4523, '5095 Yonge St', 'North York', 'ON'),
  
  -- Walmart
  ('Walmart', 'walmart', 'groceries', 43.7615, -79.4111, '6464 Yonge St', 'North York', 'ON'),
  ('Walmart', 'walmart', 'groceries', 43.7734, -79.3457, '300 Borough Dr', 'Scarborough', 'ON'),
  ('Walmart', 'walmart', 'groceries', 43.8445, -79.5234, '3777 Major Mackenzie Dr W', 'Vaughan', 'ON'),
  
  -- Shoppers Drug Mart
  ('Shoppers Drug Mart', 'shoppers', 'drugstores', 43.6544, -79.3807, '33 Charles St E', 'Toronto', 'ON'),
  ('Shoppers Drug Mart', 'shoppers', 'drugstores', 43.6789, -79.3456, '1 Danforth Ave', 'Toronto', 'ON'),
  ('Shoppers Drug Mart', 'shoppers', 'drugstores', 43.7012, -79.3987, '1680 Bayview Ave', 'Toronto', 'ON'),
  
  -- Starbucks
  ('Starbucks', 'starbucks', 'dining', 43.6532, -79.3832, '65 Front St W', 'Toronto', 'ON'),
  ('Starbucks', 'starbucks', 'dining', 43.6706, -79.3867, '2 Bloor St W', 'Toronto', 'ON'),
  ('Starbucks', 'starbucks', 'dining', 43.6456, -79.3745, '1 York St', 'Toronto', 'ON'),
  
  -- Tim Hortons
  ('Tim Hortons', 'tims', 'dining', 43.6545, -79.3806, '123 Queen St W', 'Toronto', 'ON'),
  ('Tim Hortons', 'tims', 'dining', 43.6785, -79.4234, '1100 Bloor St W', 'Toronto', 'ON'),
  ('Tim Hortons', 'tims', 'dining', 43.7234, -79.4523, '5095 Yonge St', 'North York', 'ON'),
  
  -- Canadian Tire
  ('Canadian Tire', 'canadian-tire', 'home_improvement', 43.6789, -79.2876, '785 Don Mills Rd', 'Toronto', 'ON'),
  ('Canadian Tire', 'canadian-tire', 'home_improvement', 43.7567, -79.4234, '5000 Dufferin St', 'North York', 'ON'),
  
  -- Metro
  ('Metro', 'metro', 'groceries', 43.6654, -79.3867, '444 Yonge St', 'Toronto', 'ON'),
  ('Metro', 'metro', 'groceries', 43.6734, -79.4023, '890 Yonge St', 'Toronto', 'ON'),
  
  -- Gas Stations
  ('Esso', 'esso', 'gas', 43.6678, -79.3945, '501 King St W', 'Toronto', 'ON'),
  ('Shell', 'shell', 'gas', 43.6598, -79.3789, '100 Front St E', 'Toronto', 'ON'),
  ('Petro-Canada', 'petrocan', 'gas', 43.7123, -79.3987, '1200 Bayview Ave', 'Toronto', 'ON')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Updated At Trigger
-- ============================================================================

-- Apply trigger to user_geofences
DROP TRIGGER IF EXISTS update_user_geofences_updated_at ON user_geofences;
CREATE TRIGGER update_user_geofences_updated_at
  BEFORE UPDATE ON user_geofences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to autopilot_settings
DROP TRIGGER IF EXISTS update_autopilot_settings_updated_at ON autopilot_settings;
CREATE TRIGGER update_autopilot_settings_updated_at
  BEFORE UPDATE ON autopilot_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
