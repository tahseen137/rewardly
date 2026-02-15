/**
 * Supabase Database Types
 *
 * These types define the structure of the Supabase database tables.
 * They are used for type-safe queries with the Supabase client.
 */

export interface Database {
  public: {
    Tables: {
      cards: {
        Row: CardRow;
        Insert: CardInsert;
        Update: CardUpdate;
      };
      category_rewards: {
        Row: CategoryRewardRow;
        Insert: CategoryRewardInsert;
        Update: CategoryRewardUpdate;
      };
      signup_bonuses: {
        Row: SignupBonusRow;
        Insert: SignupBonusInsert;
        Update: SignupBonusUpdate;
      };
      spending_categories: {
        Row: SpendingCategoryRow;
        Insert: SpendingCategoryInsert;
        Update: SpendingCategoryUpdate;
      };
      reward_programs: {
        Row: RewardProgramRow;
        Insert: RewardProgramInsert;
        Update: RewardProgramUpdate;
      };
      point_valuations: {
        Row: PointValuationRow;
        Insert: PointValuationInsert;
        Update: PointValuationUpdate;
      };
      user_cards: {
        Row: UserCardRow;
        Insert: UserCardInsert;
        Update: UserCardUpdate;
      };
      user_profiles: {
        Row: UserProfileRow;
        Insert: UserProfileInsert;
        Update: UserProfileUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// ============================================================================
// Cards Table
// ============================================================================

export interface CardRow {
  id: string;
  card_key: string;
  name: string;
  name_fr: string | null;
  issuer: string;
  reward_program: string;
  reward_currency: string;
  point_valuation: number;
  annual_fee: number;
  base_reward_rate: number;
  base_reward_unit: string;
  image_url: string | null;
  apply_url: string | null;
  is_active: boolean;
  reward_program_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CardInsert {
  id?: string;
  card_key: string;
  name: string;
  name_fr?: string | null;
  issuer: string;
  reward_program: string;
  reward_currency: string;
  point_valuation: number;
  annual_fee: number;
  base_reward_rate: number;
  base_reward_unit?: string;
  image_url?: string | null;
  apply_url?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CardUpdate {
  id?: string;
  card_key?: string;
  name?: string;
  name_fr?: string | null;
  issuer?: string;
  reward_program?: string;
  reward_currency?: string;
  point_valuation?: number;
  annual_fee?: number;
  base_reward_rate?: number;
  base_reward_unit?: string;
  image_url?: string | null;
  apply_url?: string | null;
  is_active?: boolean;
  reward_program_id?: string | null;
  updated_at?: string;
}

// ============================================================================
// Category Rewards Table
// ============================================================================

export interface CategoryRewardRow {
  id: string;
  card_id: string;
  category: string;
  multiplier: number;
  reward_unit: string;
  description: string;
  description_fr: string | null;
  has_spend_limit: boolean;
  spend_limit: number | null;
  spend_limit_period: string | null;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryRewardInsert {
  id?: string;
  card_id: string;
  category: string;
  multiplier: number;
  reward_unit?: string;
  description: string;
  description_fr?: string | null;
  has_spend_limit?: boolean;
  spend_limit?: number | null;
  spend_limit_period?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryRewardUpdate {
  id?: string;
  card_id?: string;
  category?: string;
  multiplier?: number;
  reward_unit?: string;
  description?: string;
  description_fr?: string | null;
  has_spend_limit?: boolean;
  spend_limit?: number | null;
  spend_limit_period?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  updated_at?: string;
}

// ============================================================================
// Signup Bonuses Table
// ============================================================================

export interface SignupBonusRow {
  id: string;
  card_id: string;
  bonus_amount: number;
  bonus_currency: string;
  spend_requirement: number;
  timeframe_days: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SignupBonusInsert {
  id?: string;
  card_id: string;
  bonus_amount: number;
  bonus_currency: string;
  spend_requirement: number;
  timeframe_days: number;
  valid_from?: string | null;
  valid_until?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SignupBonusUpdate {
  id?: string;
  card_id?: string;
  bonus_amount?: number;
  bonus_currency?: string;
  spend_requirement?: number;
  timeframe_days?: number;
  valid_from?: string | null;
  valid_until?: string | null;
  is_active?: boolean;
  updated_at?: string;
}

// ============================================================================
// Spending Categories Table
// ============================================================================

export interface SpendingCategoryRow {
  id: string;
  category_key: string;
  name: string;
  name_fr: string | null;
  description: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
}

export interface SpendingCategoryInsert {
  id?: string;
  category_key: string;
  name: string;
  name_fr?: string | null;
  description?: string | null;
  icon?: string | null;
  display_order?: number;
  is_active?: boolean;
}

export interface SpendingCategoryUpdate {
  id?: string;
  category_key?: string;
  name?: string;
  name_fr?: string | null;
  description?: string | null;
  icon?: string | null;
  display_order?: number;
  is_active?: boolean;
}

// ============================================================================
// Joined Types (for queries with relations)
// ============================================================================

/**
 * Card with all related data (category rewards and signup bonus)
 */
export interface CardWithRelations extends CardRow {
  category_rewards: CategoryRewardRow[];
  signup_bonuses: SignupBonusRow[];
}

// ============================================================================
// Reward Programs Table
// ============================================================================

export interface RewardProgramRow {
  id: string;
  program_name: string;
  program_key: string;
  program_category: string;
  program_type: string;
  unit: string;
  direct_rate_cents: number | null;
  optimal_rate_cents: number | null;
  optimal_method: string | null;
  issuer: string | null;
  country: string;
  redemption_methods: string | null;
  created_at: string;
  updated_at: string;
}

export interface RewardProgramInsert {
  id?: string;
  program_name: string;
  program_key: string;
  program_category: string;
  program_type: string;
  unit: string;
  direct_rate_cents?: number | null;
  optimal_rate_cents?: number | null;
  optimal_method?: string | null;
  issuer?: string | null;
  country?: string;
  redemption_methods?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RewardProgramUpdate {
  id?: string;
  program_name?: string;
  program_key?: string;
  program_category?: string;
  program_type?: string;
  unit?: string;
  direct_rate_cents?: number | null;
  optimal_rate_cents?: number | null;
  optimal_method?: string | null;
  issuer?: string | null;
  country?: string;
  redemption_methods?: string | null;
  updated_at?: string;
}

// ============================================================================
// Point Valuations Table
// ============================================================================

export interface PointValuationRow {
  id: string;
  program_id: string;
  redemption_type: string;
  cents_per_point: number;
  minimum_redemption: number | null;
  notes: string | null;
  created_at: string;
}

export interface PointValuationInsert {
  id?: string;
  program_id: string;
  redemption_type: string;
  cents_per_point: number;
  minimum_redemption?: number | null;
  notes?: string | null;
  created_at?: string;
}

export interface PointValuationUpdate {
  id?: string;
  program_id?: string;
  redemption_type?: string;
  cents_per_point?: number;
  minimum_redemption?: number | null;
  notes?: string | null;
}

// ============================================================================
// Extended Types with Program Data
// ============================================================================

/**
 * Redemption option for a reward program
 */
export interface RedemptionOption {
  redemption_type: string;
  cents_per_point: number;
  minimum_redemption: number | null;
  notes: string | null;
}

/**
 * Card with reward program details and redemption options
 */
export interface CardWithProgramDetails extends CardRow {
  program_name: string | null;
  program_category: string | null;
  program_type: string | null;
  unit: string | null;
  direct_rate_cents: number | null;
  optimal_rate_cents: number | null;
  optimal_method: string | null;
  redemption_methods: string | null;
  redemption_options: RedemptionOption[] | null;
  category_rewards?: CategoryRewardRow[];
  signup_bonuses?: SignupBonusRow[];
}

/**
 * Reward program with all its point valuations
 */
export interface RewardProgramWithValuations extends RewardProgramRow {
  point_valuations: PointValuationRow[];
}

// ============================================================================
// User Cards Table (synced portfolio)
// ============================================================================

export interface UserCardRow {
  id: string;
  user_id: string;
  card_key: string;
  nickname: string | null;
  notes: string | null;
  added_at: string;
  updated_at: string;
}

export interface UserCardInsert {
  id?: string;
  user_id: string;
  card_key: string;
  nickname?: string | null;
  notes?: string | null;
  added_at?: string;
  updated_at?: string;
}

export interface UserCardUpdate {
  id?: string;
  user_id?: string;
  card_key?: string;
  nickname?: string | null;
  notes?: string | null;
  added_at?: string;
  updated_at?: string;
}

// ============================================================================
// User Profiles Table
// ============================================================================

export interface UserProfileRow {
  id: string;
  country: string;
  display_name: string | null;
  avatar_url: string | null;
  preferred_language: string;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfileInsert {
  id: string;
  country?: string;
  display_name?: string | null;
  avatar_url?: string | null;
  preferred_language?: string;
  onboarding_complete?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfileUpdate {
  id?: string;
  country?: string;
  display_name?: string | null;
  avatar_url?: string | null;
  preferred_language?: string;
  onboarding_complete?: boolean;
  updated_at?: string;
}
