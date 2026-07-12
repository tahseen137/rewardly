/**
 * CardPortfolioManager - Manages the user's collection of credit cards stored locally
 * Uses AsyncStorage for persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserCard, Result, PortfolioError, success, failure } from '../types';
import { getCardByIdSync } from './CardDataService';

const PORTFOLIO_STORAGE_KEY = '@rewards_optimizer/card_portfolio';

/**
 * In-memory cache of the portfolio for synchronous operations
 */
let portfolioCache: UserCard[] | null = null;

/**
 * Initialize the portfolio manager by loading data from storage
 */
export async function initializePortfolio(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      portfolioCache = parsed.map((item: { cardId: string; addedAt: string }) => ({
        cardId: item.cardId,
        addedAt: new Date(item.addedAt),
      }));
    } else {
      portfolioCache = [];
    }
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

  // Add the card
  const userCard: UserCard = {
    cardId,
    addedAt: new Date(),
  };

  portfolioCache!.push(userCard);
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
  portfolioCache = [];
  await AsyncStorage.removeItem(PORTFOLIO_STORAGE_KEY);
}

/**
 * Reset the in-memory cache (useful for testing)
 */
export function resetCache(): void {
  portfolioCache = null;
}
