/**
 * Sage Chat Edge Function
 * 
 * Handles AI assistant conversations with context enrichment and tool use.
 * Supports both Anthropic Claude and OpenAI GPT models.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// Types
// ============================================================================

interface ChatRequest {
  message: string;
  userId: string;
  conversationId?: string;
  portfolio?: CardInfo[];
  preferences?: UserPreferences;
  pointBalances?: Record<string, number>;
}

interface ChatResponse {
  reply: string;
  conversationId: string;
  suggestions?: string[];
  cardRecommendation?: CardRecommendation;
  toolsUsed?: string[];
}

interface CardInfo {
  id: string;
  name: string;
  issuer: string;
  rewardProgram: string;
  pointValuation?: number;
  categoryRewards: CategoryReward[];
  baseRewardRate: RewardRate;
}

interface CategoryReward {
  category: string;
  rewardRate: RewardRate;
}

interface RewardRate {
  value: number;
  type: string;
  unit: string;
}

interface UserPreferences {
  rewardType: string;
  newCardSuggestionsEnabled: boolean;
}

interface CardRecommendation {
  cardId: string;
  cardName: string;
  reason: string;
  rewardRate: number;
  estimatedValue?: number;
  category?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const AI_PROVIDER = Deno.env.get('AI_PROVIDER') || 'anthropic'; // 'anthropic' or 'openai'
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Models
const ANTHROPIC_MODEL = 'claude-sonnet-4-5-20241022';
const OPENAI_MODEL = 'gpt-4o-mini';

// ============================================================================
// Tool Definitions
// ============================================================================

const tools = [
  {
    name: 'lookup_card',
    description: 'Search the credit card database by name to get current details, reward rates, annual fees, and benefits.',
    input_schema: {
      type: 'object',
      properties: {
        cardName: {
          type: 'string',
          description: 'The name of the card to look up'
        }
      },
      required: ['cardName']
    }
  },
  {
    name: 'compare_cards',
    description: 'Compare two credit cards for a specific category or overall.',
    input_schema: {
      type: 'object',
      properties: {
        card1: { type: 'string', description: 'First card name' },
        card2: { type: 'string', description: 'Second card name' },
        category: { type: 'string', description: 'Optional spending category' }
      },
      required: ['card1', 'card2']
    }
  },
  {
    name: 'best_card_for',
    description: "Find the best card from user's portfolio for a spending category.",
    input_schema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['groceries', 'dining', 'gas', 'travel', 'online_shopping', 'entertainment', 'drugstores', 'home_improvement', 'other']
        },
        userCardIds: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['category']
    }
  },
  {
    name: 'calculate_redemption',
    description: 'Calculate the value of points for a specific redemption type.',
    input_schema: {
      type: 'object',
      properties: {
        program: { type: 'string', description: 'Rewards program name' },
        points: { type: 'number', description: 'Number of points' },
        redemptionType: {
          type: 'string',
          enum: ['travel_transfer', 'cash_back', 'statement_credit', 'gift_card', 'travel_portal']
        }
      },
      required: ['program', 'points']
    }
  }
];

// ============================================================================
// System Prompt Generator
// ============================================================================

function generateSystemPrompt(portfolio: CardInfo[], preferences: UserPreferences, balances: Record<string, number>): string {
  const cardSummary = portfolio.length > 0
    ? portfolio.map(card => {
        const bonuses = card.categoryRewards
          .map(cr => `${cr.category}: ${cr.rewardRate.value}${cr.rewardRate.unit === 'percent' ? '%' : 'x'}`)
          .join(', ');
        const valuation = card.pointValuation ? ` (~${card.pointValuation}¢/pt)` : '';
        return `• ${card.name} (${card.issuer}) - ${card.rewardProgram}${valuation}\n  Base: ${card.baseRewardRate.value}${card.baseRewardRate.unit === 'percent' ? '%' : 'x'}${bonuses ? `, Bonuses: ${bonuses}` : ''}`;
      }).join('\n')
    : 'User has no cards added yet.';

  const balancesSummary = Object.entries(balances).length > 0
    ? Object.entries(balances).map(([prog, bal]) => `• ${prog}: ${bal.toLocaleString()} pts`).join('\n')
    : 'No balances tracked.';

  return `You are Sage, a friendly and knowledgeable credit card rewards advisor for users in the US and Canada.

## Your Personality
- Knowledgeable friend who's a credit card expert
- Clear explanations without being condescending  
- Enthusiastic about helping save money
- Honest about limitations

## User's Cards
${cardSummary}

## Point Balances
${balancesSummary}

## User Preferences
- Preferred rewards: ${preferences.rewardType}
- New card suggestions: ${preferences.newCardSuggestionsEnabled ? 'Enabled' : 'Disabled'}

## What You Can Help With
1. **Which Card to Use** - Recommend best card for any purchase
2. **Point Valuations** - Explain point worth and maximize value
3. **Card Comparisons** - Compare cards in portfolio or potential new cards
4. **Redemption Strategies** - Best ways to use points
5. **New Card Recommendations** - When enabled, suggest cards for their needs

## Guidelines
✅ Always:
- Give specific numbers and calculations
- Cite point valuations when known
- Consider annual fees
- Explain your reasoning
- Use tools for accurate data

❌ Never:
- Give specific financial advice (not a financial advisor)
- Guarantee approval odds
- Make up rates or values
- Recommend cards purely for commission

## Affiliate Disclosure
When recommending NEW cards (not ones user has), mention: "Just so you know, Rewardly may earn a commission if you apply through our link, but I only recommend cards I think genuinely fit your needs."

Keep responses conversational, use bullet points for clarity, and always offer to help more! 🎯`;
}

// ============================================================================
// Tool Execution
// ============================================================================

async function executeTool(
  toolName: string, 
  toolInput: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>,
  portfolio: CardInfo[]
): Promise<string> {
  try {
    switch (toolName) {
      case 'lookup_card': {
        const { cardName } = toolInput as { cardName: string };
        const { data: cards, error } = await supabase
          .from('cards')
          .select('*, category_rewards(*)')
          .ilike('name', `%${cardName}%`)
          .limit(3);
        
        if (error || !cards?.length) {
          return `Could not find card matching "${cardName}". Try a more specific name.`;
        }
        
        return cards.map(c => 
          `**${c.name}** (${c.issuer})\n` +
          `- Program: ${c.reward_program}\n` +
          `- Annual Fee: $${c.annual_fee}\n` +
          `- Base Rate: ${c.base_reward_rate}${c.base_reward_unit === 'percent' ? '%' : 'x'}\n` +
          `- Point Value: ${c.point_valuation}¢`
        ).join('\n\n');
      }

      case 'compare_cards': {
        const { card1, card2, category } = toolInput as { card1: string; card2: string; category?: string };
        const { data: cards } = await supabase
          .from('cards')
          .select('*, category_rewards(*)')
          .or(`name.ilike.%${card1}%,name.ilike.%${card2}%`)
          .limit(2);
        
        if (!cards || cards.length < 2) {
          return 'Could not find both cards for comparison.';
        }
        
        const [c1, c2] = cards;
        let comparison = `**${c1.name} vs ${c2.name}**\n\n`;
        comparison += `| Feature | ${c1.name} | ${c2.name} |\n`;
        comparison += `|---------|-----------|----------|\n`;
        comparison += `| Annual Fee | $${c1.annual_fee} | $${c2.annual_fee} |\n`;
        comparison += `| Base Rate | ${c1.base_reward_rate}${c1.base_reward_unit === 'percent' ? '%' : 'x'} | ${c2.base_reward_rate}${c2.base_reward_unit === 'percent' ? '%' : 'x'} |\n`;
        comparison += `| Point Value | ${c1.point_valuation}¢ | ${c2.point_valuation}¢ |\n`;
        
        return comparison;
      }

      case 'best_card_for': {
        const { category } = toolInput as { category: string };
        
        if (portfolio.length === 0) {
          return 'User has no cards in their portfolio to compare.';
        }
        
        // Find best card for category from portfolio
        const ranked = portfolio.map(card => {
          const categoryReward = card.categoryRewards.find(
            cr => cr.category.toLowerCase() === category.toLowerCase()
          );
          const rate = categoryReward?.rewardRate.value ?? card.baseRewardRate.value;
          return { card, rate };
        }).sort((a, b) => b.rate - a.rate);
        
        const best = ranked[0];
        const result = `**Best card for ${category}:**\n` +
          `🏆 ${best.card.name} - ${best.rate}${best.card.baseRewardRate.unit === 'percent' ? '%' : 'x'}`;
        
        if (ranked.length > 1) {
          return result + `\n\nOther options:\n` + 
            ranked.slice(1, 3).map((r, i) => 
              `${i + 2}. ${r.card.name} - ${r.rate}${r.card.baseRewardRate.unit === 'percent' ? '%' : 'x'}`
            ).join('\n');
        }
        
        return result;
      }

      case 'calculate_redemption': {
        const { program, points, redemptionType } = toolInput as { 
          program: string; 
          points: number; 
          redemptionType?: string 
        };
        
        // Get program valuations from database
        const { data: programData } = await supabase
          .from('reward_programs')
          .select('*, point_valuations(*)')
          .ilike('program_name', `%${program}%`)
          .single();
        
        if (!programData) {
          return `Could not find valuation data for ${program}.`;
        }
        
        const directValue = (programData.direct_rate_cents || 1) * points / 100;
        const optimalValue = (programData.optimal_rate_cents || 1) * points / 100;
        
        return `**${program} Redemption (${points.toLocaleString()} points)**\n\n` +
          `💵 Cash/Statement Credit: $${directValue.toFixed(2)} (${programData.direct_rate_cents || 1}¢/pt)\n` +
          `✈️ Optimal Transfer: $${optimalValue.toFixed(2)} (${programData.optimal_rate_cents || 1}¢/pt)\n` +
          `📍 Best method: ${programData.optimal_method || 'Transfer to travel partners'}`;
      }

      default:
        return `Unknown tool: ${toolName}`;
    }
  } catch (error) {
    console.error(`Tool execution error (${toolName}):`, error);
    return `Error executing ${toolName}. Please try again.`;
  }
}

// ============================================================================
// AI Provider Integrations
// ============================================================================

async function callAnthropic(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  supabase: ReturnType<typeof createClient>,
  portfolio: CardInfo[]
): Promise<{ reply: string; toolsUsed: string[] }> {
  const toolsUsed: string[] = [];
  
  // Convert messages to Anthropic format
  const anthropicMessages = messages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content
  }));

  let response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: anthropicMessages,
      tools: tools
    })
  });

  let result = await response.json();
  
  // Handle tool use loop
  while (result.stop_reason === 'tool_use') {
    const toolUseBlocks = result.content.filter((b: any) => b.type === 'tool_use');
    const toolResults: Array<{ type: string; tool_use_id: string; content: string }> = [];
    
    for (const toolUse of toolUseBlocks) {
      toolsUsed.push(toolUse.name);
      const toolResult = await executeTool(toolUse.name, toolUse.input, supabase, portfolio);
      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: toolResult
      });
    }
    
    // Continue conversation with tool results
    anthropicMessages.push({ role: 'assistant', content: result.content });
    anthropicMessages.push({ role: 'user', content: toolResults as any });
    
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: anthropicMessages,
        tools: tools
      })
    });
    
    result = await response.json();
  }
  
  // Extract text response
  const textBlock = result.content?.find((b: any) => b.type === 'text');
  return {
    reply: textBlock?.text || 'I apologize, but I was unable to generate a response.',
    toolsUsed
  };
}

async function callOpenAI(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  supabase: ReturnType<typeof createClient>,
  portfolio: CardInfo[]
): Promise<{ reply: string; toolsUsed: string[] }> {
  const toolsUsed: string[] = [];
  
  // Convert tools to OpenAI format
  const openaiTools = tools.map(t => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema
    }
  }));
  
  const openaiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content }))
  ];

  let response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: openaiMessages,
      tools: openaiTools,
      tool_choice: 'auto'
    })
  });

  let result = await response.json();
  let message = result.choices?.[0]?.message;
  
  // Handle tool calls loop
  while (message?.tool_calls?.length > 0) {
    openaiMessages.push(message);
    
    for (const toolCall of message.tool_calls) {
      toolsUsed.push(toolCall.function.name);
      const toolInput = JSON.parse(toolCall.function.arguments);
      const toolResult = await executeTool(toolCall.function.name, toolInput, supabase, portfolio);
      
      openaiMessages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: toolResult
      } as any);
    }
    
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: openaiMessages,
        tools: openaiTools,
        tool_choice: 'auto'
      })
    });
    
    result = await response.json();
    message = result.choices?.[0]?.message;
  }
  
  return {
    reply: message?.content || 'I apologize, but I was unable to generate a response.',
    toolsUsed
  };
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      message, 
      userId, 
      conversationId: existingConversationId,
      portfolio = [],
      preferences = { rewardType: 'points', newCardSuggestionsEnabled: true },
      pointBalances = {}
    }: ChatRequest = await req.json();

    // Validate input
    if (!message?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get or create conversation
    let conversationId = existingConversationId;
    if (!conversationId) {
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({ user_id: userId })
        .select()
        .single();
      
      if (convError) {
        console.error('Failed to create conversation:', convError);
        throw new Error('Failed to create conversation');
      }
      
      conversationId = newConversation.id;
    }

    // Fetch conversation history
    const { data: historyData } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20); // Limit context window

    const conversationHistory = historyData || [];

    // Save user message
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: message
    });

    // Build messages array
    const messages = [
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Generate system prompt with user context
    const systemPrompt = generateSystemPrompt(portfolio, preferences, pointBalances);

    // Call AI provider
    let reply: string;
    let toolsUsed: string[] = [];
    
    if (AI_PROVIDER === 'openai' && OPENAI_API_KEY) {
      const result = await callOpenAI(messages, systemPrompt, supabase, portfolio);
      reply = result.reply;
      toolsUsed = result.toolsUsed;
    } else if (ANTHROPIC_API_KEY) {
      const result = await callAnthropic(messages, systemPrompt, supabase, portfolio);
      reply = result.reply;
      toolsUsed = result.toolsUsed;
    } else {
      throw new Error('No AI provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.');
    }

    // Save assistant response
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: reply,
      metadata: { toolsUsed }
    });

    // Update usage tracking
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('ai_usage').upsert({
      user_id: userId,
      period_start: today,
      message_count: 1,
      tokens_used: 0 // Would need to track from API response
    }, {
      onConflict: 'user_id,period_start'
    });

    // Extract suggestions from response (simple heuristic)
    const suggestions = extractSuggestions(reply, message);

    // Extract card recommendation if present
    const cardRecommendation = extractCardRecommendation(reply, portfolio);

    const response: ChatResponse = {
      reply,
      conversationId,
      suggestions,
      cardRecommendation,
      toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Sage chat error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        reply: "I'm sorry, I encountered an error processing your request. Please try again."
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

function extractSuggestions(reply: string, originalMessage: string): string[] {
  const suggestions: string[] = [];
  const lowerReply = reply.toLowerCase();
  const lowerMessage = originalMessage.toLowerCase();
  
  // Suggest follow-ups based on conversation context
  if (lowerReply.includes('card') && !lowerMessage.includes('compare')) {
    suggestions.push('Compare my cards');
  }
  if (lowerReply.includes('point') || lowerReply.includes('reward')) {
    suggestions.push('How should I redeem my points?');
  }
  if (lowerReply.includes('travel') || lowerReply.includes('trip')) {
    suggestions.push('Help me plan a trip');
  }
  if (!lowerMessage.includes('best card')) {
    suggestions.push('Best card for dining');
  }
  
  return suggestions.slice(0, 3);
}

function extractCardRecommendation(reply: string, portfolio: CardInfo[]): CardRecommendation | undefined {
  // Simple extraction - look for card names mentioned in a recommendation context
  const recommendationPatterns = [
    /(?:use|recommend|best card is|should use)\s+(?:the\s+)?([A-Z][A-Za-z\s]+(?:Card|Preferred|Reserve|Gold|Platinum))/i,
    /🏆\s*([A-Z][A-Za-z\s]+)/
  ];
  
  for (const pattern of recommendationPatterns) {
    const match = reply.match(pattern);
    if (match) {
      const cardName = match[1].trim();
      const card = portfolio.find(c => 
        c.name.toLowerCase().includes(cardName.toLowerCase()) ||
        cardName.toLowerCase().includes(c.name.toLowerCase())
      );
      
      if (card) {
        // Extract rate from reply if mentioned
        const rateMatch = reply.match(new RegExp(`${cardName}[^\\d]*(\\d+(?:\\.\\d+)?)[%x]`, 'i'));
        const rate = rateMatch ? parseFloat(rateMatch[1]) : card.baseRewardRate.value;
        
        return {
          cardId: card.id,
          cardName: card.name,
          reason: `Recommended by Sage`,
          rewardRate: rate
        };
      }
    }
  }
  
  return undefined;
}
