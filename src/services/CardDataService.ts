/**
 * CardDataService - Provides access to the bundled credit card database
 */

import { Card, SpendingCategory } from '../types';
import cardsData from '../data/cards.json';

/**
 * Get all cards from the database
 */
export function getAllCards(): Card[] {
  return cardsData.cards as Card[];
}

/**
 * Get a card by its ID
 */
export function getCardById(id: string): Card | null {
  const cards = getAllCards();
  return cards.find((card) => card.id === id) ?? null;
}

/**
 * Get cards that have bonus rewards for a specific category
 */
export function getCardsByCategory(category: SpendingCategory): Card[] {
  const cards = getAllCards();
  return cards.filter((card) =>
    card.categoryRewards.some((reward) => reward.category === category)
  );
}

/**
 * Search cards by name, issuer, or reward program
 * Case-insensitive partial matching
 */
export function searchCards(query: string): Card[] {
  if (!query || query.trim() === '') {
    return getAllCards();
  }

  const normalizedQuery = query.toLowerCase().trim();
  const cards = getAllCards();

  return cards.filter(
    (card) =>
      card.name.toLowerCase().includes(normalizedQuery) ||
      card.issuer.toLowerCase().includes(normalizedQuery) ||
      card.rewardProgram.toLowerCase().includes(normalizedQuery)
  );
}
