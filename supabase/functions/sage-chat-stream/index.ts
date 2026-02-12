/**
 * Sage Chat Stream - Supabase Edge Function (OPTIMIZED v2)
 * 
 * Handles streaming AI chat with Anthropic Claude Haiku.
 * 
 * Optimizations Applied:
 * - Dynamic point valuations from database (not hardcoded)
 * - US + CA reward program support
 * - Smarter history trimming (token-aware)
 * - Graceful error recovery with fallback responses
 * - Cached reward program data (24h TTL)
 * 
 * Performance Target: <400ms TTFB, <2s total response
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// Types
// ============================================================================

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CardContext {
  id?: string;
  name: string;
  issuer: string;
  rewardProgram?: string;
  baseRewardRate?: { value: number; unit: string; type: string };
  categoryRewards?: Array<{
    category: string;
    rewardRate: { value: number; unit: string; type: string };
  }>;
  annualFee?: number;
  pointValuation?: number;
  welcomeBonus?: { value: number; description?: string };
}

interface UserContext {
  cards?: CardContext[];
  preferences?: {
    rewardType?: string;
    newCardSuggestionsEnabled?: boolean;
  };
  pointBalances?: Record<string, number>;
  country?: "US" | "CA";
  subscriptionTier?: string;
}

interface RewardProgram {
  program_name: string;
  direct_rate_cents: number;
  optimal_rate_cents: number;
  optimal_method: string;
}

// ============================================================================
// Reward Program Cache (24h TTL)
// ============================================================================

let rewardProgramCache: { ca: RewardProgram[]; us: RewardProgram[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function getRewardPrograms(country: "US" | "CA", supabase: any): Promise<RewardProgram[]> {
  // Check cache
  const now = Date.now();
  if (rewardProgramCache && (now - rewardProgramCache.timestamp < CACHE_TTL_MS)) {
    return country === "CA" ? rewardProgramCache.ca : rewardProgramCache.us;
  }

  // Fetch from database
  const { data: caPrograms } = await supabase
    .from("reward_programs")
    .select("program_name, direct_rate_cents, optimal_rate_cents, optimal_method")
    .eq("program_category", "Credit Card Points")
    .or("program_category.eq.Credit Card Cash Back,program_category.eq.Travel Points")
    .order("optimal_rate_cents", { ascending: false })
    .limit(20);

  const ca = caPrograms || [];
  
  // For US, we'll use same programs for now (will expand database later)
  // TODO: Add US-specific programs (Chase UR, Amex MR US, etc.) to database
  const us = ca; // Placeholder until US programs added

  rewardProgramCache = { ca, us, timestamp: now };
  return country === "CA" ? ca : us;
}

// ============================================================================
// System Prompt Generation (OPTIMIZED)
// ============================================================================

function formatCardRewards(card: CardContext): string {
  const baseRate = card.baseRewardRate 
    ? `${card.baseRewardRate.value}${card.baseRewardRate.unit === 'percent' ? '%' : 'x'}`
    : "varies";
  
  const bonuses = card.categoryRewards?.map(cr => 
    `${cr.category}: ${cr.rewardRate.value}${cr.rewardRate.unit === 'percent' ? '%' : 'x'}`
  ).join(", ") || "";
  
  return bonuses ? `Base: ${baseRate}; ${bonuses}` : `Base: ${baseRate}`;
}

async function generateSystemPrompt(userContext: UserContext | undefined, supabase: any): Promise<string> {
  const country = userContext?.country || "CA";
  
  // Build card portfolio summary
  let cardSummary = "User has not added any cards yet.";
  if (userContext?.cards && userContext.cards.length > 0) {
    cardSummary = userContext.cards.map(card => {
      const valuation = card.pointValuation ? ` (~${card.pointValuation}¢/pt)` : "";
      const fee = card.annualFee ? ` ($${card.annualFee}/yr)` : " (no fee)";
      return `• ${card.name} (${card.issuer})${fee}${valuation}\n  Rewards: ${formatCardRewards(card)}`;
    }).join("\n\n");
  }
  
  // Point balances
  let balancesSummary = "Not tracked.";
  if (userContext?.pointBalances && Object.keys(userContext.pointBalances).length > 0) {
    balancesSummary = Object.entries(userContext.pointBalances)
      .map(([program, balance]) => `• ${program}: ${balance.toLocaleString()} pts`)
      .join("\n");
  }

  // Fetch point valuations from database
  const programs = await getRewardPrograms(country, supabase);
  const valuationsList = programs
    .map(p => `- ${p.program_name}: ${p.optimal_rate_cents}¢/pt (${p.optimal_method})`)
    .join("\n");

  const countryName = country === "CA" ? "Canadian" : "US";

  return `You are Sage, a friendly ${countryName} credit card rewards expert. Help users maximize their rewards with specific, actionable advice.

## User's Card Portfolio
${cardSummary}

## User's Point Balances
${balancesSummary}

## ${countryName} Point Valuations (use for all calculations)
${valuationsList}

## Response Style
- **Be concise**: 2-3 short paragraphs max
- **Show the math**: "5x pts × 2.1¢ = 10.5% return"
- **Be specific**: Name the exact card and bonus
- **Card Comparisons**: When comparing cards, use a clear structured format:
  
  **[Card 1] vs [Card 2]**
  
  | Category | Card 1 | Card 2 |
  |----------|--------|--------|
  | Annual Fee | $X | $Y |
  | Groceries | 5x | 4x |
  | Dining | 3x | 4x |
  | ... | ... | ... |
  
  **Verdict**: Which is better and why (1-2 sentences)

## What You Do
- Recommend best card for specific purchases (show calculation)
- Compare cards from their portfolio (structured table)
- Explain point values and redemption tips
- Calculate reward returns with real math

## What You Don't Do
- Write essays (keep it brief!)
- Give financial/investment advice
- Make up reward rates
- Guarantee approvals

Be their rewards buddy. Brief, helpful, math-driven. 🎯`;
}

// ============================================================================
// Message History Optimization
// ============================================================================

function trimHistoryForTokens(history: Message[], maxTokens: number = 2000): Message[] {
  // Rough estimate: 1 token ≈ 4 characters
  const maxChars = maxTokens * 4;
  
  // Always include at least last 2 exchanges (4 messages)
  const minMessages = 4;
  let totalChars = 0;
  const result: Message[] = [];
  
  // Reverse iterate to get most recent first
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    const msgChars = msg.content.length;
    
    if (result.length < minMessages || totalChars + msgChars < maxChars) {
      result.unshift(msg); // Add to front
      totalChars += msgChars;
    } else {
      break;
    }
  }
  
  return result;
}

// ============================================================================
// Fallback Responses (Graceful Degradation)
// ============================================================================

function getFallbackResponse(userContext?: UserContext): string {
  if (!userContext?.cards || userContext.cards.length === 0) {
    return "I'm having trouble connecting right now, but here's a quick tip: Add your cards to your portfolio so I can give you personalized recommendations! 💳";
  }
  
  const cardNames = userContext.cards.map(c => c.name).join(", ");
  return `I'm experiencing a temporary issue, but based on your cards (${cardNames}), I recommend checking which one has the best bonus for your purchase category. I'll be back to full capacity shortly! 🔄`;
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request
    const { message, history, userContext, conversationId } = await req.json();
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!message || !apiKey) {
      throw new Error("Missing message or API key");
    }

    // Build messages array with optimized history
    const systemPrompt = await generateSystemPrompt(userContext, supabase);
    const messages: Message[] = [];
    
    // Add conversation history (token-aware trimming)
    if (history && Array.isArray(history)) {
      const validHistory = history.filter((msg: any) => 
        (msg.role === "user" || msg.role === "assistant") && msg.content
      );
      const trimmedHistory = trimHistoryForTokens(validHistory, 2000);
      messages.push(...trimmedHistory);
    }
    
    // Add current message
    messages.push({ role: "user", content: message });

    console.log(`[Sage] TTFB: ${Date.now() - startTime}ms | History: ${messages.length - 1} msgs`);

    // Call Anthropic API with streaming + timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    let response: Response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 1024,
          system: systemPrompt,
          messages,
          stream: true,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      
      // Graceful fallback on timeout/error
      if (err.name === "AbortError") {
        console.error("[Sage] Anthropic timeout");
        const fallback = getFallbackResponse(userContext);
        return new Response(JSON.stringify({ text: fallback, fallback: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw err;
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      const err = await response.text();
      console.error("[Sage] Anthropic error:", err);
      
      // Fallback on API error
      const fallback = getFallbackResponse(userContext);
      return new Response(JSON.stringify({ text: fallback, fallback: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream response back to client
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split("\n\n");
            buffer = events.pop() || "";

            for (const eventBlock of events) {
              const lines = eventBlock.split("\n");
              let eventData = "";

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  eventData = line.slice(6);
                  break;
                }
              }

              if (eventData) {
                try {
                  const parsed = JSON.parse(eventData);
                  
                  if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                    // Send text chunk
                    const chunk = JSON.stringify({ text: parsed.delta.text });
                    controller.enqueue(encoder.encode(`event: text\ndata: ${chunk}\n\n`));
                  }
                  
                  if (parsed.type === "message_stop") {
                    // Send done event with conversation ID + performance metrics
                    const totalTime = Date.now() - startTime;
                    const doneData = JSON.stringify({ 
                      conversationId: conversationId || `conv_${Date.now()}`,
                      status: "complete",
                      metrics: {
                        totalMs: totalTime,
                        historyLength: messages.length - 1
                      }
                    });
                    controller.enqueue(encoder.encode(`event: done\ndata: ${doneData}\n\n`));
                    console.log(`[Sage] Complete: ${totalTime}ms`);
                  }
                } catch (_e) {
                  // Ignore parse errors (ping/keepalive events)
                }
              }
            }
          }
        } catch (err) {
          console.error("[Sage] Stream error:", err);
          const errorData = JSON.stringify({ error: "Stream interrupted" });
          controller.enqueue(encoder.encode(`event: error\ndata: ${errorData}\n\n`));
        } finally {
          controller.close();
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("[Sage] Handler error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
