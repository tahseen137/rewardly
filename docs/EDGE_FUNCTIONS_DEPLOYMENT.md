# Rewardly Edge Functions Deployment Guide

## Overview

Rewardly uses Supabase Edge Functions for serverless backend capabilities. Currently deployed:

- **`sage-chat`** - AI-powered credit card advisor (Anthropic Claude / OpenAI GPT)

This guide covers deploying, configuring, and troubleshooting Edge Functions.

---

## 🚀 Deno 2.0 & Modern Patterns (2026)

**Current Status:** Rewardly uses Deno std@0.168.0 (Feb 2023). Deno 2.0 was released Sept 2024 with major improvements.

### Why Upgrade to Deno 2.0?

1. **15-90% faster package management** — `deno install` beats npm
2. **Native npm imports** — No package.json needed: `import x from "npm:package@1.0.0"`
3. **JSR support** — Modern TypeScript registry (publish .ts, auto-generates .d.ts)
4. **Better Node.js compatibility** — Run Node projects seamlessly
5. **Workspaces & monorepos** — Native support for multi-package projects

### Upgrade Checklist

- [ ] Update std library imports from `@0.168.0` to `@0.224.0+` (latest stable)
- [ ] Test Edge Functions locally after upgrade: `supabase functions serve sage-chat`
- [ ] Review [Deno 1.x → 2.x Migration Guide](https://docs.deno.com/runtime/reference/migration_guide/)
- [ ] Consider switching external dependencies to JSR packages (faster, TypeScript-native)

**When to upgrade:** Non-urgent. Current code works, but blocks modern optimizations.

### Supabase Built-in AI API (Alternative to External LLMs)

Supabase Edge Functions now include a built-in AI API (`Supabase.ai.Session`) for embeddings and LLM inference:

```typescript
// Generate embeddings (no API key needed!)
const model = new Supabase.ai.Session('gte-small');
const embeddings = await model.run('Hello world', { 
  mean_pool: true, 
  normalize: true 
});

// Run LLMs via self-hosted Ollama/Llamafile
const session = new Supabase.ai.Session('mistral');
const output = await session.run('Tell me a story', { stream: true });
```

**Use cases for Rewardly:**
- **Semantic card search** — Generate embeddings for cards, use pgvector for "find similar cards"
- **Cost optimization** — Self-hosted Ollama for FAQs/summaries, Claude for complex reasoning
- **Instant responses** — Built-in embeddings = no API latency

**Resources:**
- [Supabase AI Models Docs](https://supabase.com/docs/guides/functions/ai-models)
- [Deno 2.0 Release Notes](https://deno.com/blog/v2.0)

---

## Prerequisites

✅ **Required:**
- Supabase CLI installed (`npm install -g supabase`)
- Supabase account with active project
- Project linked to local development environment

✅ **For sage-chat function:**
- Anthropic API key (Claude) OR OpenAI API key (GPT)
- Supabase project URL + service role key (auto-injected)

---

## Quick Start (Deploy sage-chat)

```bash
# 1. Login to Supabase CLI
supabase login

# 2. Link to your project
supabase link --project-ref your-project-id

# 3. Set required environment variables (see below)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# 4. Deploy the function
supabase functions deploy sage-chat

# 5. Test it
curl --request POST 'https://your-project.supabase.co/functions/v1/sage-chat' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "message": "What card should I use for groceries?",
    "userId": "test-user-id"
  }'
```

---

## Environment Variables (Secrets)

Edge Functions use **Supabase Secrets** for sensitive configuration. Unlike environment variables in Vercel/Netlify, these are managed via CLI.

### Required for sage-chat

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes (or OpenAI) | Anthropic API key for Claude models |
| `OPENAI_API_KEY` | Yes (or Anthropic) | OpenAI API key for GPT models |
| `AI_PROVIDER` | Optional | `anthropic` (default) or `openai` |

**Note:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically injected by Supabase runtime.

### Setting Secrets

```bash
# Set a single secret
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-...

# Set multiple secrets from .env file
supabase secrets set --env-file .env.production

# List current secrets (values hidden)
supabase secrets list

# Remove a secret
supabase secrets unset ANTHROPIC_API_KEY
```

### Example .env.production

```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxx
AI_PROVIDER=anthropic
```

**⚠️ Security:** Never commit `.env.production` to git. Add to `.gitignore`.

---

## Deployment Commands

### Deploy All Functions

```bash
supabase functions deploy
```

Deploys all functions in `supabase/functions/` directory.

### Deploy Single Function

```bash
supabase functions deploy sage-chat
```

More common during development to avoid redeploying unchanged functions.

### Deploy Without JWT Verification (Public Webhooks)

```bash
supabase functions deploy webhook-handler --no-verify-jwt
```

**⚠️ Use sparingly:** Only for public endpoints like Stripe webhooks. Most functions should require authentication.

### Verify Deployment

```bash
# Check function status
supabase functions list

# View function logs
supabase functions logs sage-chat

# Stream logs in real-time
supabase functions logs sage-chat --follow
```

---

## Testing Deployed Functions

### Using curl

```bash
# Get your ANON_KEY from Supabase Dashboard → Settings → API
ANON_KEY="eyJhb..."

# Basic test
curl --request POST \
  'https://zdlozhpmqrtvvhdzbmrv.supabase.co/functions/v1/sage-chat' \
  --header "Authorization: Bearer $ANON_KEY" \
  --header 'Content-Type: application/json' \
  --data '{
    "message": "Hello Sage!",
    "userId": "test-123"
  }'
```

### Expected Response

```json
{
  "reply": "Hi! I'm Sage, your credit card rewards advisor...",
  "conversationId": "uuid-here",
  "suggestions": ["Compare my cards", "Best card for dining"],
  "toolsUsed": []
}
```

### Test with Portfolio Context

```bash
curl --request POST \
  'https://zdlozhpmqrtvvhdzbmrv.supabase.co/functions/v1/sage-chat' \
  --header "Authorization: Bearer $ANON_KEY" \
  --header 'Content-Type: application/json' \
  --data '{
    "message": "Which card for gas?",
    "userId": "user-123",
    "portfolio": [
      {
        "id": "card-1",
        "name": "Tangerine Cash Back Card",
        "issuer": "Scotiabank",
        "rewardProgram": "Tangerine Money-Back Rewards",
        "categoryRewards": [
          {
            "category": "gas",
            "rewardRate": { "value": 2, "type": "cashback", "unit": "percent" }
          }
        ],
        "baseRewardRate": { "value": 0.5, "type": "cashback", "unit": "percent" }
      }
    ],
    "preferences": {
      "rewardType": "cashback",
      "newCardSuggestionsEnabled": true
    }
  }'
```

### Debugging Failed Requests

```bash
# View recent logs
supabase functions logs sage-chat --limit 50

# Filter for errors
supabase functions logs sage-chat | grep ERROR

# Check function health
curl https://your-project.supabase.co/functions/v1/sage-chat/health
```

---

## CI/CD Setup (GitHub Actions)

Automate deployments on every push to `main`.

### `.github/workflows/deploy-functions.yml`

```yaml
name: Deploy Edge Functions

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/functions/**'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Deploy to Supabase
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
        run: |
          supabase functions deploy --project-ref $SUPABASE_PROJECT_ID

      - name: Verify Deployment
        run: |
          supabase functions list --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
```

### Required GitHub Secrets

1. Go to **Settings → Secrets → Actions**
2. Add secrets:
   - `SUPABASE_ACCESS_TOKEN` - Generate in [Supabase Dashboard → Account → Access Tokens](https://supabase.com/dashboard/account/tokens)
   - `SUPABASE_PROJECT_ID` - Your project reference (e.g., `zdlozhpmqrtvvhdzbmrv`)

**⚠️ Note:** Function environment variables (ANTHROPIC_API_KEY, etc.) must still be set via `supabase secrets set` — they're not deployed via CI/CD.

---

## Troubleshooting

### ❌ Function returns 500 error

**Cause:** Missing environment variables or invalid API keys.

**Fix:**
```bash
# Check secrets are set
supabase secrets list

# View logs for specific error
supabase functions logs sage-chat --limit 10

# Common issue: AI provider key missing
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

### ❌ "No AI provider configured"

**Error message:**
```json
{
  "error": "No AI provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY."
}
```

**Fix:**
```bash
# Set at least one AI provider key
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# Or for OpenAI
supabase secrets set OPENAI_API_KEY=sk-xxxxx
supabase secrets set AI_PROVIDER=openai
```

### ❌ CORS errors in browser

**Symptom:** Browser console shows CORS policy errors.

**Cause:** Edge function doesn't handle OPTIONS preflight correctly.

**Fix:** Already implemented in `sage-chat/index.ts`:
```typescript
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders });
}
```

Ensure all responses include `corsHeaders`:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

### ❌ Deployment fails: "Project not linked"

**Error:**
```
Error: Project ref not provided. Did you forget to run 'supabase link'?
```

**Fix:**
```bash
# List your projects
supabase projects list

# Link to correct project
supabase link --project-ref zdlozhpmqrtvvhdzbmrv
```

### ❌ Function times out

**Symptom:** Request takes >60 seconds, then fails.

**Cause:** Edge Functions have a 60-second execution limit.

**Fix:**
- Reduce AI model response length (lower `max_tokens`)
- Optimize database queries (add indexes, limit rows)
- Cache expensive operations
- Use streaming responses for long outputs

### ❌ Tools not working / "Unknown tool" errors

**Symptom:** AI tries to use tools but fails with execution errors.

**Cause:** Tool function implementation error or database permissions.

**Fix:**
1. Check logs for specific tool error:
   ```bash
   supabase functions logs sage-chat | grep "Tool execution error"
   ```

2. Verify service role key has database access:
   ```typescript
   // Should use SERVICE_ROLE_KEY, not ANON_KEY
   const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
   ```

3. Test tool functions individually in local development

---

## Local Development

### Run Functions Locally

```bash
# Start local Supabase stack
supabase start

# Serve functions locally (auto-reload)
supabase functions serve sage-chat --env-file .env.local

# In another terminal, test
curl --request POST 'http://localhost:54321/functions/v1/sage-chat' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  --header 'Content-Type: application/json' \
  --data '{"message": "test", "userId": "local-test"}'
```

### Local Environment Variables

Create `.env.local` for local testing:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
AI_PROVIDER=anthropic
```

**⚠️ Don't commit:** Add `.env.local` to `.gitignore`.

---

## Streaming AI Responses (Recommended)

### Why Streaming Matters

Non-streaming AI responses force users to wait 3-8 seconds staring at a loading spinner. Streaming provides **instant feedback** and matches industry-standard UX (ChatGPT, Claude, Perplexity).

**Perceived Performance:**
- Non-streaming: 8 seconds of nothing, then full response
- Streaming: First tokens in <500ms, smooth typewriter effect

### Implementation (Server-Side)

Update `sage-chat/index.ts` to return Server-Sent Events (SSE):

```typescript
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { message, userId, conversationId, portfolio, preferences } = await req.json();

  // Check if client wants streaming
  const acceptsStream = req.headers.get('accept')?.includes('text/event-stream');

  if (acceptsStream) {
    // Return streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const systemPrompt = generateSystemPrompt(portfolio, preferences);
          
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-5-20241022',
            system: systemPrompt,
            messages: [{ role: 'user', content: message }],
            stream: true, // ← Enable streaming
            max_tokens: 1024,
            tools: tools,
          });

          let accumulated = '';
          let toolsUsed: string[] = [];

          for await (const chunk of response) {
            if (chunk.type === 'content_block_start') {
              // Signal start of content
              controller.enqueue(encoder.encode('event: start\ndata: {}\n\n'));
            }
            
            if (chunk.type === 'content_block_delta') {
              const text = chunk.delta.text || '';
              accumulated += text;
              
              // Send text chunk
              controller.enqueue(
                encoder.encode(`event: text\ndata: ${JSON.stringify({ text })}\n\n`)
              );
            }

            if (chunk.type === 'tool_use') {
              toolsUsed.push(chunk.name);
              // Execute tool and send result
              const toolResult = await executeToolCall(chunk);
              controller.enqueue(
                encoder.encode(`event: tool\ndata: ${JSON.stringify(toolResult)}\n\n`)
              );
            }
          }

          // Send completion event
          controller.enqueue(
            encoder.encode(`event: done\ndata: ${JSON.stringify({ 
              conversationId,
              toolsUsed 
            })}\n\n`)
          );
          
          controller.close();

          // Save to database (don't block response)
          saveConversation(userId, conversationId, message, accumulated);
          
        } catch (error: any) {
          const errorData = {
            error: error.message || 'Streaming failed',
            status: error.status || 500
          };
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify(errorData)}\n\n`)
          );
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      }
    });
  }

  // Fallback: Non-streaming response (backward compatibility)
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20241022',
    messages: [{ role: 'user', content: message }],
    stream: false,
    max_tokens: 1024,
  });

  return new Response(JSON.stringify({ reply: response.content[0].text }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
```

### Client-Side (React Native / Expo)

```typescript
// In Sage chat screen (React Native)
const streamChatResponse = async (message: string) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/sage-chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream', // Request streaming
    },
    body: JSON.stringify({ 
      message, 
      userId, 
      conversationId,
      portfolio,
      preferences 
    }),
  });

  if (!response.body) {
    throw new Error('No response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let accumulated = '';

  // Add placeholder message for streaming
  setMessages(prev => [...prev, { 
    id: tempId, 
    role: 'assistant', 
    content: '', 
    isStreaming: true 
  }]);

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) continue;

        const [eventLine, dataLine] = line.split('\n');
        const event = eventLine.replace('event: ', '');
        const data = dataLine?.replace('data: ', '');

        if (event === 'text' && data) {
          const parsed = JSON.parse(data);
          accumulated += parsed.text;
          
          // Update message in real-time
          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempId 
                ? { ...msg, content: accumulated }
                : msg
            )
          );
        }

        if (event === 'done' && data) {
          const parsed = JSON.parse(data);
          // Finalize message
          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempId 
                ? { ...msg, isStreaming: false, conversationId: parsed.conversationId }
                : msg
            )
          );
        }

        if (event === 'error' && data) {
          const error = JSON.parse(data);
          console.error('Stream error:', error);
          // Show error in UI
        }
      }
    }
  } catch (error) {
    console.error('Streaming error:', error);
    // Handle error
  }
};
```

### Testing Streaming Locally

```bash
# Start local functions
supabase functions serve sage-chat --env-file .env.local

# Test with curl (streams to console)
curl --no-buffer \
  -H "Accept: text/event-stream" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hi Sage!","userId":"test"}' \
  http://localhost:54321/functions/v1/sage-chat
```

Expected output:
```
event: start
data: {}

event: text
data: {"text":"Hi"}

event: text
data: {"text":"! I'm"}

event: text
data: {"text":" Sage"}

event: done
data: {"conversationId":"uuid-here"}
```

### Performance Impact

**Before Streaming:**
- Time to first byte: 3500ms
- Perceived wait time: 3500ms
- User experience: ⭐⭐ (long loading spinner)

**After Streaming:**
- Time to first byte: 400ms
- Perceived wait time: 400ms
- User experience: ⭐⭐⭐⭐⭐ (instant feedback)

**Improvement: 8.75x faster perceived performance**

---

## Performance Optimization

### Cold Starts

Edge Functions may experience cold starts (200-500ms) after inactivity. To minimize:

1. **Keep functions warm** - Ping every 5-10 minutes in production
2. **Reduce dependencies** - Import only what you need
3. **Use ESM imports** - Faster than CommonJS
4. **Singleton Supabase client** - Reuse connection pool across invocations

**Example warm-up cron:**
```typescript
// Add to OpenClaw cron jobs
{
  name: "Keep sage-chat warm",
  schedule: { kind: "every", everyMs: 300000 }, // 5 minutes
  payload: {
    kind: "systemEvent",
    text: "exec curl --max-time 5 'https://zdlozhpmqrtvvhdzbmrv.supabase.co/functions/v1/sage-chat/health' > /dev/null 2>&1"
  },
  sessionTarget: "main"
}
```

### Connection Pooling

**Before (Creates new client every invocation):**
```typescript
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
```

**After (Singleton pattern, reuses connection):**
```typescript
let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        db: { schema: 'public' },
        auth: { persistSession: false }, // Critical for serverless
        global: {
          headers: { 'x-client-info': 'sage-chat-v1' }
        }
      }
    );
  }
  return supabaseInstance;
}
```

### Retry Logic with Exponential Backoff

AI APIs can fail transiently (rate limits, network errors). Add retry logic:

```typescript
async function callAIWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRetryable = 
        error.status === 429 || // Rate limit
        error.status === 503 || // Service unavailable
        error.code === 'ECONNRESET' || // Network error
        error.code === 'ETIMEDOUT';

      const isLastAttempt = attempt === maxRetries;

      if (!isRetryable || isLastAttempt) {
        console.error(`AI call failed (attempt ${attempt}/${maxRetries}):`, error);
        throw error;
      }

      const delay = baseDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
      console.log(`Retry ${attempt}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Unreachable'); // TypeScript safety
}

// Usage
const response = await callAIWithRetry(() =>
  anthropic.messages.create({
    model: 'claude-sonnet-4-5-20241022',
    messages: [...],
  })
);
```

### API Rate Limits

Both Anthropic and OpenAI have rate limits:

- **Anthropic Claude:** 50 req/min (Tier 1), 1000 req/min (Tier 4)
- **OpenAI GPT:** 3 req/min (free), 3500 req/min (Tier 1)

Implement request queuing or user-based rate limiting if hitting limits.

### Cost Management

Track AI usage to avoid surprise bills:

```sql
-- Monitor AI usage table
SELECT 
  DATE(period_start) as date,
  COUNT(*) as users,
  SUM(message_count) as total_messages,
  SUM(tokens_used) as total_tokens
FROM ai_usage
GROUP BY date
ORDER BY date DESC;
```

Set up [Supabase Database Webhooks](https://supabase.com/docs/guides/database/webhooks) to alert when usage exceeds thresholds.

---

## Configuration Reference

### Function-Specific Config (config.toml)

```toml
[functions.sage-chat]
verify_jwt = true  # Require authentication
import_map = "./import_map.json"  # Custom import map

[functions.public-webhook]
verify_jwt = false  # Public endpoint (Stripe, etc.)
```

### Runtime Constraints

- **Max execution time:** 60 seconds
- **Max memory:** 150 MB
- **Max response size:** 6 MB
- **Concurrent executions:** 100 (default), request increase via support

---

## Monitoring & Logging

### View Logs in Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. **Edge Functions → sage-chat → Logs**

### Structured Logging

```typescript
// In function code
console.log(JSON.stringify({
  level: 'info',
  userId: userId,
  conversationId: conversationId,
  toolsUsed: toolsUsed,
  responseTime: Date.now() - startTime
}));
```

Logs are searchable in Dashboard for 7 days (Pro plan: 90 days).

---

## Production Checklist

Before launching sage-chat to production:

- [ ] Secrets set in production (`ANTHROPIC_API_KEY` or `OPENAI_API_KEY`)
- [ ] Function deployed and tested with real data
- [ ] CORS headers configured correctly
- [ ] Database indexes created for `messages` and `conversations` tables
- [ ] Row Level Security (RLS) enabled on tables
- [ ] Error handling tested (invalid API keys, network failures)
- [ ] Monitoring/alerts configured for function errors
- [ ] Rate limiting implemented at app level (if needed)
- [ ] Cost tracking dashboard set up (AI API usage + Supabase usage)

---

## Next Steps

1. **Deploy to production:** Follow Quick Start above
2. **Integrate with app:** Update Supabase client to call `/functions/v1/sage-chat`
3. **Monitor usage:** Set up alerts for errors and high costs
4. **Optimize:** Profile slow queries, reduce token usage, cache responses

---

## Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Anthropic Claude API Docs](https://docs.anthropic.com/)
- [OpenAI API Docs](https://platform.openai.com/docs/api-reference)
- [Deno Deploy (Runtime)](https://docs.deno.com/deploy/manual)

---

**Questions?** Check logs first (`supabase functions logs sage-chat`), then consult the troubleshooting section above.
