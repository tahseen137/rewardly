/**
 * Sage Chat Stream - Supabase Edge Function
 * 
 * Handles streaming AI chat with Google Gemini Flash.
 * Auth-optional: works for both authenticated and anonymous users.
 * 
 * Performance Target: <400ms TTFB, <2s total response
 * 
 * UPDATED: Now queries Supabase for full card database to provide accurate recommendations
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
  applicationUrl?: string;
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

// Database row types
interface DbCard {
  id: number;
  card_key: string;
  name: string;
  issuer: string;
  reward_program: string;
  base_reward_rate: number;
  base_reward_unit: string;
  reward_currency: string;
  annual_fee: number;
  point_valuation: number | null;
  country: string;
  application_url?: string;
}

interface DbCategoryReward {
  card_id: number;
  category: string;
  multiplier: number;
  reward_unit: string;
}

interface DbSignupBonus {
  card_id: number;
  bonus_amount: number;
  bonus_currency: string;
  spend_requirement: number;
  timeframe_days: number;
}

// Cache for card data (edge function instance lifetime)
let cardDataCache: { cards: DbCard[]; categoryRewards: DbCategoryReward[]; signupBonuses: DbSignupBonus[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// Database Functions - Query Supabase for card data
// ============================================================================

async function fetchCardData(supabase: any, country: "US" | "CA"): Promise<{
  cards: DbCard[];
  categoryRewards: DbCategoryReward[];
  signupBonuses: DbSignupBonus[];
}> {
  // Check cache
  if (cardDataCache && Date.now() - cardDataCache.timestamp < CACHE_TTL_MS) {
    return cardDataCache;
  }

  try {
    // Fetch all cards for the country
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('*')
      .eq('is_active', true)
      .eq('country', country);

    if (cardsError) {
      console.error('[Sage] Cards fetch error:', cardsError);
      return { cards: [], categoryRewards: [], signupBonuses: [] };
    }

    if (!cards || cards.length === 0) {
      return { cards: [], categoryRewards: [], signupBonuses: [] };
    }

    const cardIds = cards.map((c: DbCard) => c.id);

    // Fetch category rewards
    const { data: categoryRewards, error: crError } = await supabase
      .from('category_rewards')
      .select('*')
      .in('card_id', cardIds);

    if (crError) {
      console.error('[Sage] Category rewards fetch error:', crError);
    }

    // Fetch signup bonuses
    const { data: signupBonuses, error: sbError } = await supabase
      .from('signup_bonuses')
      .select('*')
      .eq('is_active', true)
      .in('card_id', cardIds);

    if (sbError) {
      console.error('[Sage] Signup bonuses fetch error:', sbError);
    }

    const result = {
      cards: cards || [],
      categoryRewards: categoryRewards || [],
      signupBonuses: signupBonuses || [],
      timestamp: Date.now(),
    };

    cardDataCache = result;
    return result;
  } catch (err) {
    console.error('[Sage] Database fetch error:', err);
    return { cards: [], categoryRewards: [], signupBonuses: [] };
  }
}

function formatDbCardForPrompt(
  card: DbCard,
  categoryRewards: DbCategoryReward[],
  signupBonus?: DbSignupBonus
): string {
  const cardRewards = categoryRewards.filter(cr => cr.card_id === card.id);
  const baseRate = `${card.base_reward_rate}${card.base_reward_unit === 'percent' ? '%' : 'x'}`;
  
  const bonuses = cardRewards
    .map(cr => `${cr.category}: ${cr.multiplier}${cr.reward_unit === 'percent' ? '%' : 'x'}`)
    .join(", ");
  
  const fee = card.annual_fee > 0 ? `$${card.annual_fee}/yr` : "no fee";
  const valuation = card.point_valuation ? ` (~${card.point_valuation}¢/pt)` : "";
  const signup = signupBonus ? ` | SUB: ${signupBonus.bonus_amount.toLocaleString()} ${signupBonus.bonus_currency} after $${signupBonus.spend_requirement} in ${signupBonus.timeframe_days} days` : "";
  
  return `• ${card.name} (${card.issuer}) - ${fee}${valuation}\n  Base: ${baseRate}${bonuses ? ` | Bonuses: ${bonuses}` : ""}${signup}`;
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

function generateSystemPrompt(
  userContext: UserContext | undefined,
  dbData?: { cards: DbCard[]; categoryRewards: DbCategoryReward[]; signupBonuses: DbSignupBonus[] }
): string {
  const country = userContext?.country || "CA";
  const countryName = country === "CA" ? "Canadian" : "US";
  
  // Build user's card portfolio summary
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

  // Build database card reference (top cards by category)
  let databaseReference = "";
  if (dbData && dbData.cards.length > 0) {
    // Group cards by best category and include top performers
    const categoryBests: Record<string, { card: DbCard; rate: number; category: string }[]> = {};
    
    for (const cr of dbData.categoryRewards) {
      const card = dbData.cards.find(c => c.id === cr.card_id);
      if (!card) continue;
      
      if (!categoryBests[cr.category]) {
        categoryBests[cr.category] = [];
      }
      categoryBests[cr.category].push({ card, rate: cr.multiplier, category: cr.category });
    }
    
    // Sort and take top 3 per category
    const topCardsByCategory = Object.entries(categoryBests)
      .map(([category, cards]) => {
        const top = cards.sort((a, b) => b.rate - a.rate).slice(0, 3);
        return `**${category}**: ${top.map(t => `${t.card.name} (${t.rate}x)`).join(", ")}`;
      })
      .slice(0, 8) // Limit categories to keep prompt manageable
      .join("\n");

    // Cards with best signup bonuses
    const topSignupBonuses = dbData.signupBonuses
      .sort((a, b) => b.bonus_amount - a.bonus_amount)
      .slice(0, 5)
      .map(sb => {
        const card = dbData.cards.find(c => c.id === sb.card_id);
        if (!card) return null;
        return `• ${card.name}: ${sb.bonus_amount.toLocaleString()} ${sb.bonus_currency} (spend $${sb.spend_requirement} in ${sb.timeframe_days} days)`;
      })
      .filter(Boolean)
      .join("\n");

    databaseReference = `
## ${countryName} Card Database Reference (${dbData.cards.length} cards)

### Top Cards by Category
${topCardsByCategory}

### Best Current Sign-up Bonuses
${topSignupBonuses || "No active signup bonuses"}

When recommending NEW cards (not in user's wallet), tell them to tap "Explore Cards" in the app to apply.`;
  }

  return `You are Sage, a friendly ${countryName} credit card rewards expert. Help users maximize their rewards with specific, actionable advice.

## User's Card Portfolio
${cardSummary}

## User's Point Balances
${balancesSummary}
${databaseReference}

## Key ${countryName} Point Valuations
- Aeroplan: 1.8-2.2¢/pt (book flights via Aeroplan)
- Amex MR (CA): 1.5-2.0¢/pt (transfer to Aeroplan/Marriott)
- Scene+: 0.8-1.0¢/pt (movies/groceries)
- PC Optimum: 0.7-1.0¢/pt (Loblaws stores)
- TD Rewards: 0.5-0.8¢/pt (travel via Expedia)
- RBC Avion: 1.2-1.6¢/pt (transfer partners)
- Chase UR: 1.5-2.0¢/pt (transfer to Hyatt/United)
- Amex MR (US): 1.5-2.2¢/pt (transfer to airlines)

## Response Style
- **Be concise**: 2-3 short paragraphs max
- **Show the math**: "5x pts × 2.1¢ = 10.5% return"
- **Be specific**: Name the exact card and bonus
- **Card Comparisons**: Use a clear structured format with categories

## What You Do
- Recommend best card from their portfolio for specific purchases (show calculation)
- Suggest NEW cards from the database if user asks or if significantly better
- Compare cards (from portfolio OR database)
- Explain point values and redemption tips
- Calculate reward returns with real math
- Mention signup bonuses when recommending new cards

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
  const maxChars = maxTokens * 4;
  const minMessages = 4;
  let totalChars = 0;
  const result: Message[] = [];
  
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    const msgChars = msg.content.length;
    
    if (result.length < minMessages || totalChars + msgChars < maxChars) {
      result.unshift(msg);
      totalChars += msgChars;
    } else {
      break;
    }
  }
  
  return result;
}

// ============================================================================
// Convert messages to Gemini format
// ============================================================================

function toGeminiMessages(systemPrompt: string, history: Message[], currentMessage: string) {
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
  
  // Add history
  for (const msg of history) {
    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    });
  }
  
  // Add current message
  contents.push({
    role: "user",
    parts: [{ text: currentMessage }],
  });

  return {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.7,
    },
  };
}

// ============================================================================
// Fallback Responses
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
    // Auth (optional — graceful degradation for anonymous users)
    const authHeader = req.headers.get("Authorization");
    let user = null;
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      authHeader 
        ? { global: { headers: { Authorization: authHeader } } }
        : {}
    );

    if (authHeader) {
      try {
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        if (!userError && authUser) {
          user = authUser;
        }
      } catch (_e) {
        console.log("[Sage] Auth failed, continuing as anonymous");
      }
    }

    // Parse request
    const { message, history, userContext, conversationId } = await req.json();
    
    // Try Google API key first, fall back to Anthropic
    const googleApiKey = Deno.env.get("GOOGLE_API_KEY");
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!message) {
      throw new Error("Missing message");
    }
    
    if (!googleApiKey && !anthropicApiKey) {
      throw new Error("No API key configured");
    }

    // Fetch card data from Supabase for comprehensive recommendations
    const country = userContext?.country || "CA";
    let dbData: { cards: DbCard[]; categoryRewards: DbCategoryReward[]; signupBonuses: DbSignupBonus[] } | undefined;
    
    try {
      dbData = await fetchCardData(supabase, country);
      console.log(`[Sage] Loaded ${dbData.cards.length} cards from database`);
    } catch (dbErr) {
      console.warn('[Sage] Database fetch failed, continuing with user context only:', dbErr);
    }

    // Build system prompt with database context
    const systemPrompt = generateSystemPrompt(userContext, dbData);
    
    // Build messages
    const messages: Message[] = [];
    if (history && Array.isArray(history)) {
      const validHistory = history.filter((msg: any) => 
        (msg.role === "user" || msg.role === "assistant") && msg.content
      );
      const trimmedHistory = trimHistoryForTokens(validHistory, 2000);
      messages.push(...trimmedHistory);
    }

    console.log(`[Sage] TTFB: ${Date.now() - startTime}ms | History: ${messages.length} msgs | Engine: ${googleApiKey ? 'Gemini' : 'Anthropic'}`);

    // ========================================================================
    // Gemini Flash API (preferred)
    // ========================================================================
    if (googleApiKey) {
      const geminiBody = toGeminiMessages(systemPrompt, messages, message);
      // Try gemini-2.0-flash first, fall back to gemini-1.5-flash if unavailable
      const geminiModels = ["gemini-2.0-flash", "gemini-1.5-flash"];
      let response: Response | null = null;
      let lastGeminiErr = "";

      for (const geminiModel of geminiModels) {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?key=${googleApiKey}&alt=sse`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        let candidate: Response;
        try {
          candidate = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(geminiBody),
            signal: controller.signal,
          });
        } catch (err) {
          clearTimeout(timeoutId);
          if (err.name === "AbortError") {
            console.error(`[Sage] Gemini ${geminiModel} timeout`);
            lastGeminiErr = "timeout";
            continue;
          }
          throw err;
        }
        clearTimeout(timeoutId);

        if (candidate.ok) {
          response = candidate;
          console.log(`[Sage] Using Gemini model: ${geminiModel}`);
          break;
        }

        const errText = await candidate.text();
        lastGeminiErr = `${candidate.status}: ${errText.substring(0, 100)}`;
        console.warn(`[Sage] Gemini ${geminiModel} failed (${candidate.status}), trying next model`);
      }

      if (!response) {
        console.error("[Sage] All Gemini models failed:", lastGeminiErr);
        // Return SSE-formatted error so client handles it properly
        const encoder = new TextEncoder();
        const errorStream = new ReadableStream({
          start(ctrl) {
            const fallbackText = getFallbackResponse(userContext);
            ctrl.enqueue(encoder.encode(`event: text\ndata: ${JSON.stringify({ text: fallbackText })}\n\n`));
            ctrl.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({ conversationId: conversationId || `conv_${Date.now()}`, status: "fallback" })}\n\n`));
            ctrl.close();
          }
        });
        return new Response(errorStream, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
        });
      }

      // Stream Gemini SSE response
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          if (!reader) { controller.close(); return; }

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
                    
                    // Gemini response format: candidates[0].content.parts[0].text
                    const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                      const chunk = JSON.stringify({ text });
                      controller.enqueue(encoder.encode(`event: text\ndata: ${chunk}\n\n`));
                    }

                    // Check for finish
                    const finishReason = parsed?.candidates?.[0]?.finishReason;
                    if (finishReason === "STOP" || finishReason === "MAX_TOKENS") {
                      const totalTime = Date.now() - startTime;
                      const doneData = JSON.stringify({ 
                        conversationId: conversationId || `conv_${Date.now()}`,
                        status: "complete",
                        metrics: { totalMs: totalTime, historyLength: messages.length }
                      });
                      controller.enqueue(encoder.encode(`event: done\ndata: ${doneData}\n\n`));
                      console.log(`[Sage] Complete: ${totalTime}ms (Gemini Flash)`);
                    }
                  } catch (_e) {
                    // Ignore parse errors
                  }
                }
              }
            }
            
            // Send done event if not already sent
            const totalTime = Date.now() - startTime;
            const doneData = JSON.stringify({ 
              conversationId: conversationId || `conv_${Date.now()}`,
              status: "complete",
              metrics: { totalMs: totalTime, historyLength: messages.length }
            });
            controller.enqueue(encoder.encode(`event: done\ndata: ${doneData}\n\n`));
          } catch (err) {
            console.error("[Sage] Gemini stream error:", err);
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
    }

    // ========================================================================
    // Anthropic Fallback (if no Google key)
    // ========================================================================
    if (anthropicApiKey) {
      messages.push({ role: "user", content: message });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      let response: Response;
      try {
        response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": anthropicApiKey,
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
        if (err.name === "AbortError") {
          return new Response(JSON.stringify({ text: getFallbackResponse(userContext), fallback: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw err;
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        const err = await response.text();
        console.error("[Sage] Anthropic error:", response.status, err);
        return new Response(JSON.stringify({ 
          text: `Sage is temporarily unavailable. (API ${response.status})`,
          fallback: true
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Stream Anthropic response (same as before)
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          if (!reader) { controller.close(); return; }

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
                  if (line.startsWith("data: ")) { eventData = line.slice(6); break; }
                }

                if (eventData) {
                  try {
                    const parsed = JSON.parse(eventData);
                    if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                      const chunk = JSON.stringify({ text: parsed.delta.text });
                      controller.enqueue(encoder.encode(`event: text\ndata: ${chunk}\n\n`));
                    }
                    if (parsed.type === "message_stop") {
                      const totalTime = Date.now() - startTime;
                      const doneData = JSON.stringify({ 
                        conversationId: conversationId || `conv_${Date.now()}`,
                        status: "complete",
                        metrics: { totalMs: totalTime, historyLength: messages.length - 1 }
                      });
                      controller.enqueue(encoder.encode(`event: done\ndata: ${doneData}\n\n`));
                    }
                  } catch (_e) {}
                }
              }
            }
          } catch (err) {
            console.error("[Sage] Anthropic stream error:", err);
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
    }

    throw new Error("No API key available");

  } catch (error) {
    console.error("[Sage] Handler error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
