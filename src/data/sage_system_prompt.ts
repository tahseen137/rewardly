/**
 * Sage System Prompt Generator
 * 
 * Generates context-aware system prompts for the AI assistant based on user data.
 * Includes card expertise, redemption knowledge, and travel planning capabilities.
 */

import { Card, UserCard, UserPreferences, RewardType, SpendingCategory } from '../types';

/**
 * User context for building the system prompt
 */
export interface SageUserContext {
  /** User's card portfolio with full card details */
  cards: Card[];
  /** User's preferences */
  preferences: UserPreferences;
  /** Point balances by program (optional) */
  pointBalances?: Map<string, number>;
  /** User's country */
  country?: 'US' | 'CA';
  /** User's subscription tier */
  subscriptionTier?: 'free' | 'plus' | 'pro' | 'elite';
}

/**
 * Format reward rate for display
 */
function formatRewardRate(value: number, unit: 'percent' | 'multiplier', type: RewardType): string {
  if (type === RewardType.CASHBACK || unit === 'percent') {
    return `${value}% cash back`;
  }
  return `${value}x points`;
}

/**
 * Format a card's category rewards as a readable list
 */
function formatCardRewards(card: Card): string {
  const baseRate = formatRewardRate(
    card.baseRewardRate.value,
    card.baseRewardRate.unit,
    card.baseRewardRate.type
  );
  
  const categoryBonuses = card.categoryRewards
    .map(cr => `${cr.category}: ${formatRewardRate(cr.rewardRate.value, cr.rewardRate.unit, cr.rewardRate.type)}`)
    .join(', ');
  
  return categoryBonuses ? `Base: ${baseRate}; Bonuses: ${categoryBonuses}` : `Base: ${baseRate}`;
}

/**
 * Format point valuation information
 */
function formatValuation(card: Card): string {
  if (!card.pointValuation) return '';
  const method = card.programDetails?.optimalMethod || 'standard redemption';
  return ` (points worth ~${card.pointValuation}¢ each via ${method})`;
}

/**
 * Generate the system prompt for Sage AI assistant
 */
export function generateSageSystemPrompt(context: SageUserContext): string {
  const { cards, preferences, pointBalances, country = 'US', subscriptionTier = 'free' } = context;
  
  // Build card portfolio summary
  const cardSummary = cards.length > 0
    ? cards.map(card => {
        const valuation = formatValuation(card);
        return `• ${card.name} (${card.issuer}) - ${card.rewardProgram}${valuation}\n  Rewards: ${formatCardRewards(card)}`;
      }).join('\n\n')
    : 'User has not added any cards to their portfolio yet.';
  
  // Build point balances summary
  const balancesSummary = pointBalances && pointBalances.size > 0
    ? Array.from(pointBalances.entries())
        .map(([program, balance]) => `• ${program}: ${balance.toLocaleString()} points`)
        .join('\n')
    : 'Point balances not tracked.';
  
  // Format preferences
  const preferredRewardType = preferences.rewardType === RewardType.CASHBACK ? 'cash back' :
    preferences.rewardType === RewardType.AIRLINE_MILES ? 'airline miles' :
    preferences.rewardType === RewardType.HOTEL_POINTS ? 'hotel points' : 'points';

  return `You are Sage, a friendly credit card rewards expert helping users in ${country === 'CA' ? 'Canada' : 'the United States'} maximize their rewards.

## User's Card Portfolio
${cardSummary}

## User's Point Balances
${balancesSummary}

## User's Preferences
- Preferred reward type: ${preferredRewardType}
- New card suggestions: ${preferences.newCardSuggestionsEnabled ? 'enabled' : 'disabled'}

## Canadian Point Valuations (use these for calculations)
- Aeroplan: 2.0¢ per point (transfers to Air Canada)
- Amex Membership Rewards: 2.1¢ per point (transfers to Aeroplan, Marriott, others)
- TD Rewards: 0.5¢ per point (travel portal or statement credit)
- RBC Avion: 2.1¢ per point (travel bookings)
- CIBC Aventura: 1.0¢ per point (travel or cash back)
- Scene+: 1.0¢ per point (movies, travel, groceries)
- PC Optimum: 0.1¢ per point (groceries and gas)

## Your Style
- **Be concise**: Keep responses to 2-3 short paragraphs max
- **Show the math**: When recommending a card, calculate the return (e.g., "5x points × 2.1¢ = 10.5% back")
- **Be specific**: Name the exact card and category bonus
- **Be helpful**: Explain WHY it's the best choice in one sentence

## Response Format
1. **Answer the question directly** (1-2 sentences)
2. **Show the calculation** if it's a card recommendation (e.g., "For dining: Amex Cobalt earns 5x points × 2.1¢ = 10.5% return")
3. **Add one insight** if relevant (e.g., point valuations, redemption tips, or a quick comparison)

## What You Do
- Recommend the best card from their wallet for specific purchases
- Compare cards in their portfolio
- Explain point valuations and redemption strategies
- Calculate reward returns with real math
- Suggest new cards if enabled and genuinely better

## What You Don't Do
- Write long essays (keep it brief!)
- Give financial advice beyond credit card rewards
- Make up reward rates or point values
- Guarantee credit card approvals

**Keep it short, show the math, be their rewards buddy.** 🎯`;
}

/**
 * Generate a shorter context-only prompt for tool calls
 * Used when the full system prompt would exceed token limits
 */
export function generateSageContextPrompt(context: SageUserContext): string {
  const { cards, preferences, country = 'US' } = context;
  
  const cardList = cards.length > 0
    ? cards.map(c => `${c.name} (${c.rewardProgram})`).join(', ')
    : 'No cards added';
  
  return `User context: ${country} resident, prefers ${preferences.rewardType}, cards: ${cardList}`;
}

/**
 * Tool definitions for Claude/OpenAI function calling
 */
export const SAGE_TOOLS = [
  {
    name: 'lookup_card',
    description: 'Search the credit card database by name to get current details, reward rates, annual fees, and benefits. Use this when you need accurate information about a specific card.',
    parameters: {
      type: 'object',
      properties: {
        cardName: {
          type: 'string',
          description: 'The name of the card to look up (e.g., "Chase Sapphire Preferred", "Amex Gold")'
        }
      },
      required: ['cardName']
    }
  },
  {
    name: 'compare_cards',
    description: 'Compare two credit cards to help the user decide which is better for their needs. Can compare overall or for a specific spending category.',
    parameters: {
      type: 'object',
      properties: {
        card1: {
          type: 'string',
          description: 'First card name to compare'
        },
        card2: {
          type: 'string',
          description: 'Second card name to compare'
        },
        category: {
          type: 'string',
          enum: ['groceries', 'dining', 'gas', 'travel', 'online_shopping', 'entertainment', 'drugstores', 'home_improvement', 'other'],
          description: 'Optional specific category to compare for'
        }
      },
      required: ['card1', 'card2']
    }
  },
  {
    name: 'best_card_for',
    description: "Find the best card from the user's portfolio for a specific spending category. Returns ranked recommendations with reward rates.",
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['groceries', 'dining', 'gas', 'travel', 'online_shopping', 'entertainment', 'drugstores', 'home_improvement', 'other'],
          description: 'The spending category to find the best card for'
        },
        userCardIds: {
          type: 'array',
          items: { type: 'string' },
          description: "Array of card IDs from user's portfolio"
        }
      },
      required: ['category', 'userCardIds']
    }
  },
  {
    name: 'calculate_redemption',
    description: 'Calculate the value of points/miles for a specific redemption. Helps users understand the best way to use their rewards.',
    parameters: {
      type: 'object',
      properties: {
        program: {
          type: 'string',
          description: 'The rewards program (e.g., "Chase Ultimate Rewards", "Amex Membership Rewards", "Aeroplan")'
        },
        points: {
          type: 'number',
          description: 'Number of points to redeem'
        },
        redemptionType: {
          type: 'string',
          enum: ['travel_transfer', 'cash_back', 'statement_credit', 'gift_card', 'travel_portal', 'merchandise'],
          description: 'Type of redemption to calculate'
        },
        destination: {
          type: 'string',
          description: 'Optional destination for travel calculations (e.g., "Tokyo", "Paris")'
        }
      },
      required: ['program', 'points']
    }
  }
];

/**
 * Convert tools to Anthropic format
 */
export function getAnthropicTools() {
  return SAGE_TOOLS.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters
  }));
}

/**
 * Convert tools to OpenAI format
 */
export function getOpenAITools() {
  return SAGE_TOOLS.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }));
}

export default generateSageSystemPrompt;
