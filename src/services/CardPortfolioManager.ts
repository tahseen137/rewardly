/**
 * CardPortfolioManager - Manages the user's collection of credit cards
 * Uses Supabase for authenticated users, AsyncStorage as fallback for guests
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserCard, Result, PortfolioError, success, failure } from '../types';
import { getCardByIdSync } from './CardDataService';
import { canAddCardSync, getCardLimitSync } from './SubscriptionService';
import { supabase, isSupabaseConfigured } from './supabase';
import { getCurrentUser, isGuestUser, onAuthStateChange, type AuthUser } from './AuthService';

const PORTFOLIO_STORAGE_KEY = '@rewards_optimizer/card_portfolio';

/**
 * In-memory cache of the portfolio for synchronous operations
 */
let portfolioCache: UserCard[] | null = null;

/**
 * Track if we've already set up the auth listener
 */
let authListenerInitialized = false;

/**
 * Notes data structure stored in Supabase notes column
 */
interface CardNotesData {
  pointBalance?: number;
  balanceUpdatedAt?: string;
}

/**
 * Parse notes JSON from Supabase
 */
function parseNotesData(notes: string | null): CardNotesData {
  if (!notes) return {};
  try {
    return JSON.parse(notes);
  } catch {
    return {};
  }
}

/**
 * Serialize notes data to JSON for Supabase
 */
function serializeNotesData(data: CardNotesData): string {
  return JSON.stringify(data);
}

/**
 * Check if user is authenticated (not a guest)
 */
async function isUserAuthenticated(): Promise<{ authenticated: boolean; userId: string | null }> {
  const user = await getCurrentUser();
  if (!user || isGuestUser(user)) {
    return { authenticated: false, userId: null };
  }
  return { authenticated: true, userId: user.id };
}

/**
 * Load portfolio from Supabase for authenticated users
 */
async function loadFromSupabase(userId: string): Promise<UserCard[] | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('user_cards')
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: true });

    if (error) {
      console.error('Failed to load portfolio from Supabase:', error);
      return null;
    }

    return data.map((row) => {
      const notesData = parseNotesData(row.notes);
      return {
        cardId: row.card_key,
        addedAt: new Date(row.added_at),
        pointBalance: notesData.pointBalance,
        balanceUpdatedAt: notesData.balanceUpdatedAt ? new Date(notesData.balanceUpdatedAt) : undefined,
        nickname: row.nickname ?? undefined,
      };
    });
  } catch (err) {
    console.error('Error loading from Supabase:', err);
    return null;
  }
}

/**
 * Load portfolio from AsyncStorage (for guests or fallback)
 */
async function loadFromAsyncStorage(): Promise<UserCard[]> {
  try {
    const stored = await AsyncStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((item: { 
        cardId: string; 
        addedAt: string;
        pointBalance?: number;
        balanceUpdatedAt?: string;
        nickname?: string;
      }) => ({
        cardId: item.cardId,
        addedAt: new Date(item.addedAt),
        pointBalance: item.pointBalance,
        balanceUpdatedAt: item.balanceUpdatedAt ? new Date(item.balanceUpdatedAt) : undefined,
        nickname: item.nickname,
      }));
    }
  } catch {
    // Ignore errors
  }
  return [];
}

/**
 * Save a card to Supabase
 */
async function saveCardToSupabase(userId: string, card: UserCard): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    return false;
  }

  try {
    const notesData: CardNotesData = {
      pointBalance: card.pointBalance,
      balanceUpdatedAt: card.balanceUpdatedAt?.toISOString(),
    };

    const { error } = await supabase
      .from('user_cards')
      .upsert({
        user_id: userId,
        card_key: card.cardId,
        nickname: card.nickname ?? null,
        notes: serializeNotesData(notesData),
        added_at: card.addedAt.toISOString(),
      }, {
        onConflict: 'user_id,card_key',
      });

    if (error) {
      console.error('Failed to save card to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error saving to Supabase:', err);
    return false;
  }
}

/**
 * Delete a card from Supabase
 */
async function deleteCardFromSupabase(userId: string, cardId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('user_cards')
      .delete()
      .eq('user_id', userId)
      .eq('card_key', cardId);

    if (error) {
      console.error('Failed to delete card from Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error deleting from Supabase:', err);
    return false;
  }
}

/**
 * Merge local AsyncStorage cards into Supabase on sign-in
 * Cards that already exist in Supabase are skipped
 */
async function mergeLocalCardsToSupabase(userId: string): Promise<void> {
  const localCards = await loadFromAsyncStorage();
  if (localCards.length === 0) {
    return;
  }

  // Load existing cards from Supabase
  const supabaseCards = await loadFromSupabase(userId);
  if (!supabaseCards) {
    return; // Supabase unavailable, skip merge
  }

  const existingCardKeys = new Set(supabaseCards.map(c => c.cardId));

  // Only add cards that don't already exist in Supabase
  for (const localCard of localCards) {
    if (!existingCardKeys.has(localCard.cardId)) {
      await saveCardToSupabase(userId, localCard);
    }
  }

  // Clear local storage after successful merge
  await AsyncStorage.removeItem(PORTFOLIO_STORAGE_KEY);
}

/**
 * Handle auth state changes - merge local cards on sign-in
 */
function setupAuthListener(): void {
  if (authListenerInitialized) {
    return;
  }
  authListenerInitialized = true;

  onAuthStateChange(async (event, user) => {
    if (event === 'SIGNED_IN' && user && !isGuestUser(user)) {
      // User just signed in - merge any local cards and reload from Supabase
      await mergeLocalCardsToSupabase(user.id);
      
      // Reload portfolio from Supabase
      const supabaseCards = await loadFromSupabase(user.id);
      if (supabaseCards !== null) {
        portfolioCache = supabaseCards;
      }
    } else if (event === 'SIGNED_OUT') {
      // User signed out - reset to empty and let next init load from AsyncStorage
      portfolioCache = null;
    }
  });
}

/**
 * Initialize the portfolio manager by loading data from storage
 * Uses Supabase for authenticated users, AsyncStorage for guests
 */
export async function initializePortfolio(): Promise<void> {
  // Set up auth listener for sign-in/sign-out events
  setupAuthListener();

  try {
    const { authenticated, userId } = await isUserAuthenticated();

    if (authenticated && userId) {
      // Try to load from Supabase first
      const supabaseCards = await loadFromSupabase(userId);
      if (supabaseCards !== null) {
        portfolioCache = supabaseCards;
        return;
      }
      // Fall back to AsyncStorage if Supabase fails
    }

    // Load from AsyncStorage for guests or as fallback
    portfolioCache = await loadFromAsyncStorage();
  } catch {
    portfolioCache = [];
  }
}

/**
 * Save the current portfolio to AsyncStorage
 */
async function persistPortfolio(): Promise<void> {
  if (portfolioCache === null) {
    return;
  }
  const serialized = JSON.stringify(
    portfolioCache.map((card) => ({
      cardId: card.cardId,
      addedAt: card.addedAt.toISOString(),
      pointBalance: card.pointBalance,
      balanceUpdatedAt: card.balanceUpdatedAt?.toISOString(),
      nickname: card.nickname,
    }))
  );
  await AsyncStorage.setItem(PORTFOLIO_STORAGE_KEY, serialized);
}

/**
 * Check if a card is already in the portfolio
 */
export function isDuplicate(cardId: string): boolean {
  if (portfolioCache === null) {
    return false;
  }
  return portfolioCache.some((card) => card.cardId === cardId);
}

/**
 * Add a card to the user's portfolio
 * @param cardId - The ID of the card to add (must exist in card database)
 * @returns Result with the added UserCard or a PortfolioError
 */
export async function addCard(cardId: string): Promise<Result<UserCard, PortfolioError>> {
  // Ensure portfolio is initialized
  if (portfolioCache === null) {
    await initializePortfolio();
  }

  // Check if card exists in the database
  const card = getCardByIdSync(cardId);
  if (!card) {
    return failure({ type: 'CARD_NOT_FOUND', cardId });
  }

  // Check for duplicate
  if (isDuplicate(cardId)) {
    return failure({ type: 'DUPLICATE_CARD', cardName: card.name });
  }

  // Check card limit for subscription tier
  const currentCount = portfolioCache!.length;
  if (!canAddCardSync(currentCount)) {
    const limit = getCardLimitSync();
    return failure({ 
      type: 'LIMIT_REACHED', 
      message: `You can only have ${limit} card${limit !== 1 ? 's' : ''} on the Free plan. Upgrade to Pro for unlimited cards.`,
      limit,
    });
  }

  // Add the card
  const userCard: UserCard = {
    cardId,
    addedAt: new Date(),
  };

  portfolioCache!.push(userCard);

  // Sync to appropriate storage
  const { authenticated, userId } = await isUserAuthenticated();
  if (authenticated && userId) {
    // Save to Supabase (async, don't block on it)
    saveCardToSupabase(userId, userCard).catch(err => {
      console.error('Failed to sync card to Supabase:', err);
    });
  }
  
  // Always persist to AsyncStorage as backup
  await persistPortfolio();

  return success(userCard);
}

/**
 * Remove a card from the user's portfolio
 * @param cardId - The ID of the card to remove
 * @returns Result with void or a PortfolioError
 */
export async function removeCard(cardId: string): Promise<Result<void, PortfolioError>> {
  // Ensure portfolio is initialized
  if (portfolioCache === null) {
    await initializePortfolio();
  }

  const index = portfolioCache!.findIndex((card) => card.cardId === cardId);
  if (index === -1) {
    return failure({ type: 'CARD_NOT_FOUND', cardId });
  }

  portfolioCache!.splice(index, 1);

  // Sync to appropriate storage
  const { authenticated, userId } = await isUserAuthenticated();
  if (authenticated && userId) {
    // Delete from Supabase (async, don't block on it)
    deleteCardFromSupabase(userId, cardId).catch(err => {
      console.error('Failed to delete card from Supabase:', err);
    });
  }

  // Always persist to AsyncStorage as backup
  await persistPortfolio();

  return success(undefined);
}

/**
 * Get all cards in the user's portfolio
 * @returns Array of UserCard objects
 */
export function getCards(): UserCard[] {
  if (portfolioCache === null) {
    return [];
  }
  return [...portfolioCache];
}

/**
 * Get a specific card from the portfolio by ID
 * @param cardId - The ID of the card to find
 * @returns The UserCard if found, null otherwise
 */
export function getCardFromPortfolio(cardId: string): UserCard | null {
  if (portfolioCache === null) {
    return null;
  }
  return portfolioCache.find((card) => card.cardId === cardId) ?? null;
}

/**
 * Clear the entire portfolio (useful for testing)
 */
export async function clearPortfolio(): Promise<void> {
  // If authenticated, also clear from Supabase
  const { authenticated, userId } = await isUserAuthenticated();
  if (authenticated && userId && isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('user_cards')
        .delete()
        .eq('user_id', userId);
    } catch (err) {
      console.error('Failed to clear portfolio from Supabase:', err);
    }
  }

  portfolioCache = [];
  await AsyncStorage.removeItem(PORTFOLIO_STORAGE_KEY);
}

/**
 * Reset the in-memory cache (useful for testing)
 */
export function resetCache(): void {
  portfolioCache = null;
}

/**
 * Update the point balance for a card in the portfolio
 * @param cardId - The ID of the card to update
 * @param pointBalance - The new point balance (or undefined to clear)
 * @returns Result with the updated UserCard or a PortfolioError
 */
export async function updatePointBalance(
  cardId: string, 
  pointBalance: number | undefined
): Promise<Result<UserCard, PortfolioError>> {
  if (portfolioCache === null) {
    await initializePortfolio();
  }

  const cardIndex = portfolioCache!.findIndex((card) => card.cardId === cardId);
  if (cardIndex === -1) {
    return failure({ type: 'CARD_NOT_FOUND', cardId });
  }

  portfolioCache![cardIndex] = {
    ...portfolioCache![cardIndex],
    pointBalance,
    balanceUpdatedAt: pointBalance !== undefined ? new Date() : undefined,
  };

  // Sync to Supabase if authenticated
  const { authenticated, userId } = await isUserAuthenticated();
  if (authenticated && userId) {
    saveCardToSupabase(userId, portfolioCache![cardIndex]).catch(err => {
      console.error('Failed to sync point balance to Supabase:', err);
    });
  }

  await persistPortfolio();
  return success(portfolioCache![cardIndex]);
}

/**
 * Update the nickname for a card in the portfolio
 * @param cardId - The ID of the card to update
 * @param nickname - The new nickname (or undefined to clear)
 * @returns Result with the updated UserCard or a PortfolioError
 */
export async function updateCardNickname(
  cardId: string,
  nickname: string | undefined
): Promise<Result<UserCard, PortfolioError>> {
  if (portfolioCache === null) {
    await initializePortfolio();
  }

  const cardIndex = portfolioCache!.findIndex((card) => card.cardId === cardId);
  if (cardIndex === -1) {
    return failure({ type: 'CARD_NOT_FOUND', cardId });
  }

  portfolioCache![cardIndex] = {
    ...portfolioCache![cardIndex],
    nickname: nickname?.trim() || undefined,
  };

  // Sync to Supabase if authenticated
  const { authenticated, userId } = await isUserAuthenticated();
  if (authenticated && userId) {
    saveCardToSupabase(userId, portfolioCache![cardIndex]).catch(err => {
      console.error('Failed to sync nickname to Supabase:', err);
    });
  }

  await persistPortfolio();
  return success(portfolioCache![cardIndex]);
}

/**
 * Get the total portfolio value in dollars
 * @param valuations - Map of program name to cents per point
 * @returns Total value in dollars
 */
export function getPortfolioTotalValue(valuations: Map<string, number>): number {
  if (portfolioCache === null) {
    return 0;
  }

  let total = 0;
  for (const userCard of portfolioCache) {
    if (userCard.pointBalance && userCard.pointBalance > 0) {
      const card = getCardByIdSync(userCard.cardId);
      if (card) {
        // Get valuation from map or use card's default
        const centsPerPoint = valuations.get(card.rewardProgram) 
          ?? card.pointValuation 
          ?? card.programDetails?.optimalRateCents
          ?? 1;
        total += userCard.pointBalance * (centsPerPoint / 100);
      }
    }
  }
  return total;
}

/**
 * Force reload portfolio from storage
 * Useful after auth state changes
 */
export async function reloadPortfolio(): Promise<void> {
  portfolioCache = null;
  await initializePortfolio();
}
