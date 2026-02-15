/**
 * CardDataService - Provides access to the credit card database
 *
 * This service fetches card data from Supabase with local caching.
 * Falls back to bundled JSON data when offline or Supabase is not configured.
 * Supports both US and Canadian cards with country filtering.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, SpendingCategory, RewardType, CategoryReward, SignupBonus } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import type { CardRow, CategoryRewardRow, SignupBonusRow, CardWithProgramDetails, RedemptionOption } from './supabase';
import { getCountry, Country } from './PreferenceManager';

// ============================================================================
// Constants
// ============================================================================

const CACHE_KEY_PREFIX = 'cards_cache_v2_'; // v2: BMO AIR MILES fix + duplicate cleanup
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

// Cache structure
interface CachedData {
  version: string;
  lastFetched: number;
  cards: Card[];
  country: Country;
}

// In-memory cache for synchronous access
let memoryCache: Card[] | null = null;
let memoryCacheCountry: Country | null = null;

// ============================================================================
// Data Transformation
// ============================================================================

/**
 * Convert Supabase card row to app Card type
 */
function transformCardRow(
  row: CardRow,
  categoryRewards: CategoryRewardRow[],
  signupBonus?: SignupBonusRow
): Card {
  const card: Card = {
    id: row.card_key,
    name: row.name,
    issuer: row.issuer,
    rewardProgram: row.reward_program,
    annualFee: row.annual_fee,
    pointValuation: row.point_valuation,
    baseRewardRate: {
      value: row.base_reward_rate,
      type: mapRewardCurrency(row.reward_currency),
      unit: row.base_reward_unit as 'percent' | 'multiplier',
    },
    categoryRewards: categoryRewards
      .filter((cr) => cr.card_id === row.id)
      .map((cr) => transformCategoryReward(cr)),
    applicationUrl: (row as any).application_url || undefined,
    affiliateUrl: (row as any).affiliate_url || undefined,
  };

  if (signupBonus) {
    card.signupBonus = {
      amount: signupBonus.bonus_amount,
      currency: mapRewardCurrency(signupBonus.bonus_currency),
      spendRequirement: signupBonus.spend_requirement,
      timeframeDays: signupBonus.timeframe_days,
    };
  }

  return card;
}

/**
 * Convert card with program details to app Card type
 * Uses optimal_rate_cents from reward program if available
 */
function transformCardWithProgramDetails(
  row: CardWithProgramDetails,
  categoryRewards: CategoryRewardRow[],
  signupBonus?: SignupBonusRow
): Card {
  // Use optimal rate from program if available, otherwise fall back to card's point_valuation
  // Note: optimal_rate_cents is already in cents (e.g., 2.1 cents per point), no conversion needed
  const pointValuation = row.optimal_rate_cents ?? row.point_valuation;

  const card: Card = {
    id: row.card_key,
    name: row.name,
    issuer: row.issuer,
    rewardProgram: row.reward_program,
    annualFee: row.annual_fee,
    pointValuation: pointValuation,
    baseRewardRate: {
      value: row.base_reward_rate,
      type: mapRewardCurrency(row.reward_currency),
      unit: row.base_reward_unit as 'percent' | 'multiplier',
    },
    categoryRewards: categoryRewards
      .filter((cr) => cr.card_id === row.id)
      .map((cr) => transformCategoryReward(cr)),
    applicationUrl: (row as any).application_url || undefined,
    affiliateUrl: (row as any).affiliate_url || undefined,
    // Add program details if available
    programDetails: row.program_name ? {
      programName: row.program_name,
      programCategory: row.program_category || undefined,
      directRateCents: row.direct_rate_cents || undefined,
      optimalRateCents: row.optimal_rate_cents || undefined,
      optimalMethod: row.optimal_method || undefined,
      redemptionOptions: row.redemption_options || undefined,
    } : undefined,
  };

  if (signupBonus) {
    card.signupBonus = {
      amount: signupBonus.bonus_amount,
      currency: mapRewardCurrency(signupBonus.bonus_currency),
      spendRequirement: signupBonus.spend_requirement,
      timeframeDays: signupBonus.timeframe_days,
    };
  }

  return card;
}

/**
 * Convert Supabase category reward row to app CategoryReward type
 */
function transformCategoryReward(row: CategoryRewardRow): CategoryReward {
  return {
    category: row.category as SpendingCategory,
    rewardRate: {
      value: row.multiplier,
      type: mapRewardUnit(row.reward_unit),
      unit: row.reward_unit as 'percent' | 'multiplier',
    },
  };
}

/**
 * Map reward currency string to RewardType enum
 */
function mapRewardCurrency(currency: string): RewardType {
  switch (currency) {
    case 'cashback':
      return RewardType.CASHBACK;
    case 'points':
      return RewardType.POINTS;
    case 'airline_miles':
      return RewardType.AIRLINE_MILES;
    case 'hotel_points':
      return RewardType.HOTEL_POINTS;
    default:
      return RewardType.POINTS;
  }
}

/**
 * Map reward unit to RewardType (for category rewards)
 */
function mapRewardUnit(unit: string): RewardType {
  return unit === 'percent' ? RewardType.CASHBACK : RewardType.POINTS;
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Get cache key for a specific country
 */
function getCacheKey(country: Country): string {
  return `${CACHE_KEY_PREFIX}${country}`;
}

/**
 * Get cached cards from AsyncStorage for current country
 */
async function getCachedCards(country: Country): Promise<Card[] | null> {
  try {
    const cached = await AsyncStorage.getItem(getCacheKey(country));
    if (!cached) return null;

    const data: CachedData = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid and matches current country
    if (now - data.lastFetched < CACHE_TTL && data.country === country) {
      return data.cards;
    }

    return null; // Cache expired or country mismatch
  } catch {
    return null;
  }
}

/**
 * Save cards to cache for a specific country
 */
async function setCachedCards(cards: Card[], country: Country): Promise<void> {
  try {
    const data: CachedData = {
      version: '2.0',
      lastFetched: Date.now(),
      cards,
      country,
    };
    await AsyncStorage.setItem(getCacheKey(country), JSON.stringify(data));
  } catch {
    // Silently fail - caching is optional
  }
}

/**
 * Clear the card cache for all countries
 */
async function clearCache(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(getCacheKey('US')),
      AsyncStorage.removeItem(getCacheKey('CA')),
    ]);
    memoryCache = null;
    memoryCacheCountry = null;
  } catch {
    // Silently fail
  }
}

/**
 * Get the last sync timestamp
 */
async function getLastSyncTime(): Promise<Date | null> {
  try {
    const country = getCountry();
    const cached = await AsyncStorage.getItem(getCacheKey(country));
    if (!cached) return null;

    const data: CachedData = JSON.parse(cached);
    return new Date(data.lastFetched);
  } catch {
    return null;
  }
}

// ============================================================================
// Data Fetching
// ============================================================================

/**
 * Fetch cards from Supabase with program details
 * Filters by country
 */
async function fetchCardsFromSupabase(country: Country): Promise<Card[]> {
  // Check if Supabase client is available
  if (!supabase) {
    throw new Error('Supabase client not configured');
  }

  // Try to fetch from cards_with_program_details view first
  try {
    const { data: cardsWithPrograms, error: viewError } = await supabase
      .from('cards_with_program_details')
      .select('*')
      .eq('country', country);

    if (!viewError && cardsWithPrograms && cardsWithPrograms.length > 0) {
      // Get card IDs for filtering related data
      const cardIds = cardsWithPrograms.map((c: CardWithProgramDetails) => c.id);

      // Fetch category rewards and signup bonuses separately
      const { data: categoryRewardsRows, error: crError } = await supabase
        .from('category_rewards')
        .select('*')
        .in('card_id', cardIds);

      if (crError) {
        throw new Error(`Failed to fetch category rewards: ${crError.message}`);
      }

      const { data: signupBonusRows, error: sbError } = await supabase
        .from('signup_bonuses')
        .select('*')
        .eq('is_active', true)
        .in('card_id', cardIds);

      if (sbError) {
        throw new Error(`Failed to fetch signup bonuses: ${sbError.message}`);
      }

      const typedCategoryRewards = (categoryRewardsRows || []) as CategoryRewardRow[];
      const typedSignupBonuses = (signupBonusRows || []) as SignupBonusRow[];

      // Transform cards with program details
      const cards: Card[] = (cardsWithPrograms as CardWithProgramDetails[]).map((cardRow) => {
        const cardCategoryRewards = typedCategoryRewards.filter((cr) => cr.card_id === cardRow.id);
        const cardSignupBonus = typedSignupBonuses.find((sb) => sb.card_id === cardRow.id);
        return transformCardWithProgramDetails(cardRow, cardCategoryRewards, cardSignupBonus);
      });

      return cards;
    }
  } catch (error) {
    console.warn('Failed to fetch from cards_with_program_details view, falling back to cards table:', error);
  }

  // Fallback to regular cards table if view doesn't exist
  const { data: cardsRows, error: cardsError } = await supabase
    .from('cards')
    .select('*')
    .eq('is_active', true)
    .eq('country', country);

  if (cardsError) {
    throw new Error(`Failed to fetch cards: ${cardsError.message}`);
  }

  if (!cardsRows || cardsRows.length === 0) {
    return [];
  }

  // Get card IDs for filtering
  const cardIds = cardsRows.map((c: CardRow) => c.id);

  // Fetch all category rewards for these cards
  const { data: categoryRewardsRows, error: crError } = await supabase
    .from('category_rewards')
    .select('*')
    .in('card_id', cardIds);

  if (crError) {
    throw new Error(`Failed to fetch category rewards: ${crError.message}`);
  }

  // Fetch all active signup bonuses for these cards
  const { data: signupBonusRows, error: sbError } = await supabase
    .from('signup_bonuses')
    .select('*')
    .eq('is_active', true)
    .in('card_id', cardIds);

  if (sbError) {
    throw new Error(`Failed to fetch signup bonuses: ${sbError.message}`);
  }

  // Transform and combine data
  const typedCardsRows = cardsRows as CardRow[];
  const typedCategoryRewards = (categoryRewardsRows || []) as CategoryRewardRow[];
  const typedSignupBonuses = (signupBonusRows || []) as SignupBonusRow[];

  const cards: Card[] = typedCardsRows.map((cardRow) => {
    const cardCategoryRewards = typedCategoryRewards.filter((cr) => cr.card_id === cardRow.id);
    const cardSignupBonus = typedSignupBonuses.find((sb) => sb.card_id === cardRow.id);
    return transformCardRow(cardRow, cardCategoryRewards, cardSignupBonus);
  });

  return cards;
}


// ============================================================================
// Public API
// ============================================================================

/**
 * Get all cards from the database for current country
 * Fetches from Supabase with caching
 */
export async function getAllCards(): Promise<Card[]> {
  const country = getCountry();
  
  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    throw new Error('Database connection not configured. Please check your environment settings.');
  }

  // Check if memory cache is valid for current country
  if (memoryCache && memoryCacheCountry === country) {
    return memoryCache;
  }

  // Try to get from storage cache first
  const cached = await getCachedCards(country);
  if (cached && cached.length > 0) {
    memoryCache = cached;
    memoryCacheCountry = country;
    return cached;
  }

  // Fetch from Supabase
  try {
    const cards = await fetchCardsFromSupabase(country);
    if (cards.length > 0) {
      await setCachedCards(cards, country);
      memoryCache = cards;
      memoryCacheCountry = country;
      return cards;
    }
    throw new Error(`No cards found in database for ${country}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to fetch cards from database: ${errorMessage}`);
  }
}

/**
 * Get cards for a specific country (bypasses current preference)
 */
export async function getCardsByCountry(country: Country): Promise<Card[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Database connection not configured. Please check your environment settings.');
  }

  // Try to get from storage cache first
  const cached = await getCachedCards(country);
  if (cached && cached.length > 0) {
    return cached;
  }

  // Fetch from Supabase
  try {
    const cards = await fetchCardsFromSupabase(country);
    if (cards.length > 0) {
      await setCachedCards(cards, country);
      return cards;
    }
    return [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to fetch cards from database: ${errorMessage}`);
  }
}

/**
 * Get a card by its ID synchronously from memory cache
 * Returns null if not in cache - ensure getAllCards() is called first
 */
export function getCardByIdSync(id: string): Card | null {
  if (!memoryCache) {
    return null;
  }
  return memoryCache.find((card) => card.id === id) ?? null;
}

/**
 * Get all cards synchronously from memory cache
 * Returns empty array if not in cache - ensure getAllCards() is called first
 */
export function getAllCardsSync(): Card[] {
  if (!memoryCache) {
    return [];
  }
  return memoryCache;
}

/**
 * Get current country for cached cards
 */
export function getCachedCountry(): Country | null {
  return memoryCacheCountry;
}

/**
 * Get total card count across all countries (US + CA)
 * Used for displaying database statistics in Settings
 */
export async function getTotalCardCount(): Promise<{ total: number; us: number; ca: number }> {
  if (!isSupabaseConfigured()) {
    return { total: 0, us: 0, ca: 0 };
  }

  try {
    const [usCards, caCards] = await Promise.all([
      getCardsByCountry('US'),
      getCardsByCountry('CA'),
    ]);

    return {
      total: usCards.length + caCards.length,
      us: usCards.length,
      ca: caCards.length,
    };
  } catch (error) {
    console.error('Failed to get total card count:', error);
    return { total: 0, us: 0, ca: 0 };
  }
}

/**
 * Get a card by its ID
 */
export async function getCardById(id: string): Promise<Card | null> {
  const cards = await getAllCards();
  return cards.find((card) => card.id === id) ?? null;
}

/**
 * Get cards that have bonus rewards for a specific category
 */
export async function getCardsByCategory(category: SpendingCategory): Promise<Card[]> {
  const cards = await getAllCards();
  return cards.filter((card) =>
    card.categoryRewards.some((reward) => reward.category === category)
  );
}

/**
 * Search cards by name, issuer, or reward program
 * Case-insensitive partial matching
 */
export async function searchCards(query: string): Promise<Card[]> {
  if (!query || query.trim() === '') {
    return getAllCards();
  }

  const normalizedQuery = query.toLowerCase().trim();
  const cards = await getAllCards();

  return cards.filter(
    (card) =>
      card.name.toLowerCase().includes(normalizedQuery) ||
      card.issuer.toLowerCase().includes(normalizedQuery) ||
      card.rewardProgram.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Force refresh cards from Supabase
 * Clears cache and fetches fresh data for current country
 */
export async function refreshCards(): Promise<Card[]> {
  const country = getCountry();
  
  // Clear memory cache
  memoryCache = null;
  memoryCacheCountry = null;
  
  // Clear storage cache for current country
  try {
    await AsyncStorage.removeItem(getCacheKey(country));
  } catch {
    // Continue even if cache clear fails
  }

  if (!isSupabaseConfigured()) {
    throw new Error('Database connection not configured. Please check your environment settings.');
  }

  try {
    const cards = await fetchCardsFromSupabase(country);
    if (cards.length > 0) {
      await setCachedCards(cards, country);
      memoryCache = cards;
      memoryCacheCountry = country;
      return cards;
    }
    throw new Error(`No cards found in database for ${country}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to refresh cards from database: ${errorMessage}`);
  }
}

/**
 * Called when country preference changes - invalidates cache and reloads cards
 */
export async function onCountryChange(): Promise<void> {
  memoryCache = null;
  memoryCacheCountry = null;
  // Reload cards for the new country
  await getAllCards();
}

/**
 * Get the last time cards were synced from Supabase
 */
export { getLastSyncTime };

/**
 * Check if cards are being served from cache
 */
export async function isCacheValid(): Promise<boolean> {
  const country = getCountry();
  const cached = await getCachedCards(country);
  return cached !== null && cached.length > 0;
}

/**
 * Clear the card cache (useful for testing or forcing refresh)
 */
export { clearCache };
