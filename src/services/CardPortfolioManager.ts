/**
 * CardPortfolioManager - Manages the user's collection of credit cards stored locally
 * Uses AsyncStorage for persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserCard, Result, PortfolioError, success, failure } from '../types';
import { getCardByIdSync } from './CardDataService';
import { canAddCardSync, getCardLimitSync } from './SubscriptionService';

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
      portfolioCache = parsed.map((item: { 
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
