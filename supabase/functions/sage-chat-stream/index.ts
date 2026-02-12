/**
 * Sage Chat Stream - Supabase Edge Function
 * 
 * Handles streaming AI chat with Anthropic Claude Haiku.
 * Features:
 * - Streaming SSE responses
 * - Conversation history
 * - User context (card portfolio, preferences)
 * - Card comparison tool
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

// ============================================================================
// System Prompt Generation
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

function generateSystemPrompt(userContext?: UserContext): string {
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

  return `You are Sage, a friendly Canadian credit card rewards expert. Help users maximize their rewards with specific, actionable advice.

## User's Card Portfolio
${cardSummary}

## User's Point Balances
${balancesSummary}

## Canadian Point Valuations (use for all calculations)
- Aeroplan: 2.0¢/pt (Air Canada transfers)
- Amex MR: 2.1¢/pt (Aeroplan, Marriott transfers)
- TD Rewards: 0.5¢/pt (travel portal)
- RBC Avion: 2.1¢/pt (travel bookings)
- CIBC Aventura: 1.0¢/pt
- Scene+: 1.0¢/pt
- PC Optimum: 0.1¢/pt

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
// Main Handler
// ============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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

    // Build messages array with history
    const systemPrompt = generateSystemPrompt(userContext);
    const messages: Message[] = [];
    
    // Add conversation history (last 10 messages)
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-10);
      for (const msg of recentHistory) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }
    
    // Add current message
    messages.push({ role: "user", content: message });

    // Call Anthropic API with streaming
    const response = await fetch("https://api.anthropic.com/v1/messages", {
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
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic error:", err);
      throw new Error(`Anthropic API error: ${response.status}`);
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
                    // Send done event with conversation ID
                    const doneData = JSON.stringify({ 
                      conversationId: conversationId || `conv_${Date.now()}`,
                      status: "complete"
                    });
                    controller.enqueue(encoder.encode(`event: done\ndata: ${doneData}\n\n`));
                  }
                } catch (_e) {
                  // Ignore parse errors (ping/keepalive events)
                }
              }
            }
          }
        } catch (err) {
          console.error("Stream error:", err);
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
    console.error("Handler error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
