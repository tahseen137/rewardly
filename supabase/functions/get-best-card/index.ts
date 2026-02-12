/**
 * Get Best Card Edge Function
 * 
 * Returns the best credit card recommendation for a given merchant/category.
 * Used for:
 * - Fallback when client can't process locally
 * - Transaction-triggered recommendations
 * - Analytics and A/B testing
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// Types
// ============================================================================

interface BestCardRequest {
  userId: string;
  merchantName?: string;
  category?: string;
  portfolioCardIds: string[];
  purchaseAmount?: number;
}

interface CardReward {
  cardId: string;
  cardName: string;
  issuer: string;
  rewardProgram: string;
  rewardRate: number;
  isCashback: boolean;
  estimatedValue: number;
}

interface BestCardResponse {
  success: boolean;
  bestCard: CardReward | null;
  alternativeCards: CardReward[];
  category: string;
  merchantName?: string;
  error?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Merchant to category mapping
const MERCHANT_CATEGORY_MAP: Record<string, string> = {
  'costco': 'groceries',
  'loblaws': 'groceries',
  'walmart': 'groceries',
  'metro': 'groceries',
  'sobeys': 'groceries',
  'starbucks': 'dining',
  'tim hortons': 'dining',
  'tims': 'dining',
  'esso': 'gas',
  'shell': 'gas',
  'petro-canada': 'gas',
  'shoppers drug mart': 'drugstores',
  'shoppers': 'drugstores',
  'canadian tire': 'home_improvement',
  'home depot': 'home_improvement',
};

// ============================================================================
// Helper Functions
// ============================================================================

function getMerchantCategory(merchantName: string): string {
  const normalized = merchantName.toLowerCase().trim();
  
  // Direct match
  if (MERCHANT_CATEGORY_MAP[normalized]) {
    return MERCHANT_CATEGORY_MAP[normalized];
  }
  
  // Partial match
  for (const [key, category] of Object.entries(MERCHANT_CATEGORY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return category;
    }
  }
  
  return 'other';
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req: Request) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    const body: BestCardRequest = await req.json();
    const { userId, merchantName, category, portfolioCardIds, purchaseAmount = 50 } = body;

    if (!portfolioCardIds || portfolioCardIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          bestCard: null,
          alternativeCards: [],
          category: category || 'other',
          error: 'No cards in portfolio',
        } as BestCardResponse),
        { headers }
      );
    }

    // Determine category
    const effectiveCategory = category || (merchantName ? getMerchantCategory(merchantName) : 'other');

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch card data for portfolio cards
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select(`
        *,
        category_rewards (
          category,
          multiplier,
          reward_unit
        )
      `)
      .in('card_key', portfolioCardIds)
      .eq('is_active', true);

    if (cardsError) {
      throw new Error(`Failed to fetch cards: ${cardsError.message}`);
    }

    if (!cards || cards.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          bestCard: null,
          alternativeCards: [],
          category: effectiveCategory,
          error: 'No valid cards found',
        } as BestCardResponse),
        { headers }
      );
    }

    // Calculate rewards for each card
    const cardRewards: CardReward[] = cards.map((card) => {
      // Find category-specific reward
      const categoryReward = card.category_rewards?.find(
        (cr: { category: string }) => cr.category === effectiveCategory
      );
      
      const rewardRate = categoryReward?.multiplier || card.base_reward_rate || 1;
      const isCashback = card.reward_currency === 'cashback';
      
      // Calculate estimated value
      const pointsEarned = purchaseAmount * rewardRate;
      const pointValue = isCashback ? 1 : (card.point_valuation || 1) / 100;
      const estimatedValue = isCashback 
        ? pointsEarned / 100 // Convert percentage to dollars
        : pointsEarned * pointValue;

      return {
        cardId: card.card_key,
        cardName: card.name,
        issuer: card.issuer,
        rewardProgram: card.reward_program,
        rewardRate,
        isCashback,
        estimatedValue,
      };
    });

    // Sort by estimated value (highest first)
    cardRewards.sort((a, b) => b.estimatedValue - a.estimatedValue);

    const bestCard = cardRewards[0];
    const alternativeCards = cardRewards.slice(1);

    // Log analytics (optional - can be disabled in production)
    if (userId) {
      await supabase.from('autopilot_analytics').insert({
        user_id: userId,
        event_type: 'recommendation_generated',
        merchant_category: effectiveCategory,
        card_id: bestCard.cardId,
      }).catch(console.error); // Don't fail on analytics error
    }

    return new Response(
      JSON.stringify({
        success: true,
        bestCard,
        alternativeCards,
        category: effectiveCategory,
        merchantName,
      } as BestCardResponse),
      { headers }
    );
  } catch (error) {
    console.error('Error in get-best-card:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        bestCard: null,
        alternativeCards: [],
        category: 'other',
        error: error instanceof Error ? error.message : 'Unknown error',
      } as BestCardResponse),
      { headers, status: 500 }
    );
  }
});
