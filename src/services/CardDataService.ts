/**
 * CardDataService - Provides access to the credit card database
 *
 * This service fetches card data from Supabase with local caching.
 * Falls back to bundled JSON data when offline or Supabase is not configured.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, SpendingCategory, RewardType, CategoryReward, SignupBonus } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import type { CardRow, CategoryRewardRow, SignupBonusRow } from './supabase';
import cardsData from '../data/cards.json';

// ============================================================================
// Constants
// ============================================================================

const CACHE_KEY = 'canadian_cards_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Type assertion for the JSON data structure
interface CardsDataFile {
  cards: Card[];
}

// Cache structure
interface CachedData {
  version: string;
  lastFetched: number;
  cards: Card[];
}

// In-memory cache for synchronous access
let memoryCache: Card[] | null = null;

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
    baseRewardRate: {
      value: row.base_reward_rate,
      type: mapRewardCurrency(row.reward_currency),
      unit: row.base_reward_unit as 'percent' | 'multiplier',
    },
    categoryRewards: categoryRewards
      .filter((cr) => cr.card_id === row.id)
      .map((cr) => transformCategoryReward(cr)),
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
 * Get cached cards from AsyncStorage
 */
async function getCachedCards(): Promise<Card[] | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedData = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid
    if (now - data.lastFetched < CACHE_TTL) {
      return data.cards;
    }

    return null; // Cache expired
  } catch {
    return null;
  }
}

/**
 * Save cards to cache
 */
async function setCachedCards(cards: Card[]): Promise<void> {
  try {
    const data: CachedData = {
      version: '1.0',
      lastFetched: Date.now(),
      cards,
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Silently fail - caching is optional
  }
}

/**
 * Clear the card cache
 */
async function clearCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch {
    // Silently fail
  }
}

/**
 * Get the last sync timestamp
 */
async function getLastSyncTime(): Promise<Date | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
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
 * Fetch cards from Supabase
 */
async function fetchCardsFromSupabase(): Promise<Card[]> {
  // Check if Supabase client is available
  if (!supabase) {
    throw new Error('Supabase client not configured');
  }

  // Fetch all cards
  const { data: cardsRows, error: cardsError } = await supabase
    .from('cards')
    .select('*')
    .eq('is_active', true);

  if (cardsError) {
    throw new Error(`Failed to fetch cards: ${cardsError.message}`);
  }

  if (!cardsRows || cardsRows.length === 0) {
    return [];
  }

  // Fetch all category rewards
  const { data: categoryRewardsRows, error: crError } = await supabase
    .from('category_rewards')
    .select('*');

  if (crError) {
    throw new Error(`Failed to fetch category rewards: ${crError.message}`);
  }

  // Fetch all active signup bonuses
  const { data: signupBonusRows, error: sbError } = await supabase
    .from('signup_bonuses')
    .select('*')
    .eq('is_active', true);

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

/**
 * Get bundled cards from local JSON file
 */
function getBundledCards(): Card[] {
  return (cardsData as CardsDataFile).cards;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get all cards from the database
 * Fetches from Supabase with caching
 */
export async function getAllCards(): Promise<Card[]> {
  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    throw new Error('Database connection not configured. Please check your environment settings.');
  }

  // Try to get from cache first
  const cached = await getCachedCards();
  if (cached && cached.length > 0) {
    memoryCache = cached; // Update memory cache
    return cached;
  }

  // Fetch from Supabase
  try {
    const cards = await fetchCardsFromSupabase();
    if (cards.length > 0) {
      await setCachedCards(cards);
      memoryCache = cards; // Update memory cache
      return cards;
    }
    throw new Error('No cards found in database');
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
 * Clears cache and fetches fresh data
 */
export async function refreshCards(): Promise<Card[]> {
  await clearCache();

  if (!isSupabaseConfigured()) {
    throw new Error('Database connection not configured. Please check your environment settings.');
  }

  try {
    const cards = await fetchCardsFromSupabase();
    if (cards.length > 0) {
      await setCachedCards(cards);
      return cards;
    }
    throw new Error('No cards found in database');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to refresh cards from database: ${errorMessage}`);
  }
}

/**
 * Get the last time cards were synced from Supabase
 */
export { getLastSyncTime };

/**
 * Check if cards are being served from cache
 */
export async function isCacheValid(): Promise<boolean> {
  const cached = await getCachedCards();
  return cached !== null && cached.length > 0;
}

/**
 * Clear the card cache (useful for testing or forcing refresh)
 */
export { clearCache };
