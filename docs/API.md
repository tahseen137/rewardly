# Rewardly API Documentation
**Version:** 1.0  
**Updated:** 2026-02-27  
**Base URL:** `https://[PROJECT_ID].supabase.co/functions/v1/`

Rewardly's backend is built on Supabase Edge Functions (Deno runtime). All functions are deployed to Supabase's global edge network.

---

## Authentication

All endpoints accept Supabase JWT tokens via the `Authorization` header.

```
Authorization: Bearer <supabase_jwt>
```

For anonymous users (features that work without login), some endpoints accept the Supabase anon key:

```
apikey: <supabase_anon_key>
```

**Getting a JWT:** Authenticate via Supabase Auth (email, Google, Apple) and use the `access_token` from the session object.

---

## Rate Limits

Rate limits are enforced at the Supabase edge level:

| Tier | Requests / minute | Requests / day |
|------|-------------------|----------------|
| Free | 60 | 1,000 |
| Pro | 300 | 10,000 |
| Max | 1,000 | 50,000 |

Exceeded limits return `429 Too Many Requests`. Retry after the `Retry-After` header value (seconds).

---

## CORS

All endpoints support CORS from any origin (`*`). Handle preflight `OPTIONS` requests automatically — the API responds with `200 OK`.

---

## Endpoints

### `POST /get-best-card`

Returns the best credit card recommendation from a user's portfolio for a given merchant or category.

**Use cases:**
- Real-time point-of-sale recommendations
- Transaction-triggered suggestions (CSV import analysis)
- Portfolio gap analysis

**Request:**

```json
{
  "userId": "uuid-of-the-user",
  "merchantName": "Tim Hortons",
  "category": "dining",
  "portfolioCardIds": ["td-cash-back-visa-inf", "amex-cobalt"],
  "purchaseAmount": 25.00
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | Yes | Supabase user UUID. Used for analytics logging. |
| `merchantName` | string | No* | Store name (e.g., "Starbucks", "Costco"). Auto-maps to category. |
| `category` | string | No* | Spending category. Overrides auto-mapping if provided. |
| `portfolioCardIds` | string[] | Yes | Array of card `card_key` identifiers from the user's portfolio. |
| `purchaseAmount` | number | No | Purchase amount in CAD. Defaults to `50.00`. Used to calculate estimated reward value. |

*Either `merchantName` or `category` must be provided.

**Category values:**
`groceries`, `dining`, `gas`, `drugstores`, `home_improvement`, `travel`, `entertainment`, `transit`, `utilities`, `other`

**Merchant auto-mapping (built-in):**

| Merchant | Mapped Category |
|----------|-----------------|
| Costco, Loblaws, Walmart, Metro, Sobeys | `groceries` |
| Starbucks, Tim Hortons | `dining` |
| Esso, Shell, Petro-Canada | `gas` |
| Shoppers Drug Mart | `drugstores` |
| Canadian Tire, Home Depot | `home_improvement` |

**Response (200):**

```json
{
  "success": true,
  "bestCard": {
    "cardId": "amex-cobalt",
    "cardName": "American Express Cobalt",
    "issuer": "American Express",
    "rewardProgram": "Membership Rewards",
    "rewardRate": 5.0,
    "isCashback": false,
    "estimatedValue": 0.63
  },
  "alternativeCards": [
    {
      "cardId": "td-cash-back-visa-inf",
      "cardName": "TD Cash Back Visa Infinite",
      "issuer": "TD",
      "rewardProgram": "cashback",
      "rewardRate": 3.0,
      "isCashback": true,
      "estimatedValue": 0.75
    }
  ],
  "category": "dining",
  "merchantName": "Tim Hortons"
}
```

| Field | Description |
|-------|-------------|
| `bestCard` | Highest-value card from the portfolio for this category. `null` if no cards qualify. |
| `alternativeCards` | Remaining portfolio cards sorted by reward value, descending. |
| `rewardRate` | Multiplier for this category (e.g., `5.0` = 5x points). |
| `estimatedValue` | Estimated dollar value of rewards earned on `purchaseAmount`. |
| `isCashback` | `true` for cashback cards, `false` for points/miles. |

**Error response (400/500):**

```json
{
  "success": false,
  "bestCard": null,
  "alternativeCards": [],
  "category": "other",
  "error": "No cards in portfolio"
}
```

---

### `POST /create-checkout`

Creates a Stripe Checkout session for a Rewardly subscription purchase.

**Authentication required:** Yes (JWT)

**Request:**

```json
{
  "tier": "pro",
  "interval": "year"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `tier` | string | Yes | `"pro"`, `"max"`, `"lifetime"` |
| `interval` | string | Yes | `"month"`, `"year"` (ignored for `lifetime`) |

**Response (200):**

```json
{
  "url": "https://checkout.stripe.com/pay/cs_live_..."
}
```

Redirect the user to `url` to complete payment. On success, Stripe redirects to the configured `success_url` and fires a `checkout.session.completed` webhook.

**Error (400):**

```json
{
  "error": "Invalid tier: enterprise"
}
```

---

### `POST /manage-subscription`

Creates a Stripe Customer Portal session for subscription management (upgrade, downgrade, cancel, update payment method).

**Authentication required:** Yes (JWT)

**Request:** Empty body or `{}`

**Response (200):**

```json
{
  "url": "https://billing.stripe.com/p/session/..."
}
```

Redirect the user to `url`. The portal handles all subscription management — no additional API calls needed. On return, the user is redirected to the configured `return_url`.

**Error (404):**

```json
{
  "error": "No Stripe customer found for this user"
}
```

---

### `POST /sage-chat`

Non-streaming AI assistant endpoint. Processes a single message and returns a complete response.

**Authentication required:** Optional (works for anonymous users)

**Request:**

```json
{
  "message": "Which card is best for travel to Europe?",
  "userId": "uuid-or-anonymous",
  "conversationId": "optional-conversation-id",
  "portfolio": [
    {
      "cardId": "td-aeroplan-visa-inf",
      "cardName": "TD Aeroplan Visa Infinite"
    }
  ],
  "preferences": {
    "preferCashback": false,
    "primaryAirline": "Air Canada"
  },
  "pointBalances": {
    "aeroplan": 45000,
    "membership_rewards": 12000
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | User's question |
| `userId` | string | Yes | User ID or anonymous identifier |
| `conversationId` | string | No | Resume an existing conversation |
| `portfolio` | CardInfo[] | No | User's current card portfolio for context |
| `preferences` | object | No | User preferences for personalized advice |
| `pointBalances` | Record<string, number> | No | Current point balances by program |

**Response (200):**

```json
{
  "reply": "For travel to Europe, your TD Aeroplan Visa Infinite earns 1.5 Aeroplan points per dollar on all purchases, plus 3x on Air Canada flights. With 45,000 Aeroplan points you could redeem for a round trip to Paris...",
  "conversationId": "conv_abc123",
  "suggestions": [
    "What is the Aeroplan points value for Europe redemptions?",
    "Are there better travel cards I should consider?"
  ],
  "cardRecommendation": {
    "cardId": "td-aeroplan-visa-inf",
    "reason": "Best for Air Canada travel and European redemptions"
  },
  "toolsUsed": ["card_lookup", "reward_calculator"]
}
```

---

### `POST /sage-chat-stream`

Streaming version of the AI assistant. Returns a Server-Sent Events stream for real-time response rendering.

**Authentication required:** Optional

**Request:** Same as `/sage-chat`

**Response:** `Content-Type: text/event-stream`

```
data: {"type":"delta","content":"For travel"}
data: {"type":"delta","content":" to Europe"}
data: {"type":"delta","content":", your TD Aeroplan..."}
data: {"type":"done","conversationId":"conv_abc123"}
```

**Client-side usage:**

```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/sage-chat-stream`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ message, userId }),
  }
);

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader!.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
  
  for (const line of lines) {
    const data = JSON.parse(line.slice(6));
    if (data.type === 'delta') {
      setResponse(prev => prev + data.content);
    }
  }
}
```

**Performance targets:**
- Time to first byte: <400ms
- Total response: <2s for typical queries

---

### `POST /stripe-webhook`

Internal endpoint for Stripe webhook event processing. Not called by the client app.

**Authentication:** Stripe webhook signature (`stripe-signature` header)

**Handled events:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activate subscription, update user tier in Supabase |
| `customer.subscription.updated` | Update subscription status and tier |
| `customer.subscription.deleted` | Downgrade user to free tier |
| `invoice.payment_succeeded` | Log successful payment |
| `invoice.payment_failed` | Log failed payment, trigger grace period |

This endpoint is configured in the Stripe dashboard (Dashboard → Webhooks → Add endpoint).

---

## Database Schema (Key Tables)

For direct Supabase queries from the client:

### `cards`
| Column | Type | Description |
|--------|------|-------------|
| `card_key` | text (PK) | Unique identifier (e.g., `"td-cash-back-visa-inf"`) |
| `name` | text | Display name |
| `issuer` | text | Bank name |
| `reward_program` | text | Points program or `"cashback"` |
| `base_reward_rate` | numeric | Default multiplier for uncategorized spend |
| `reward_currency` | text | `"cashback"`, `"points"`, `"miles"` |
| `annual_fee` | numeric | Annual fee in CAD |
| `is_active` | boolean | Whether card is in the active database |

### `category_rewards`
| Column | Type | Description |
|--------|------|-------------|
| `card_key` | text (FK) | References `cards.card_key` |
| `category` | text | Spending category |
| `multiplier` | numeric | Earn rate for this category |
| `reward_unit` | text | Unit description |

### `profiles`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Matches `auth.users.id` |
| `subscription_tier` | text | `"free"`, `"pro"`, `"max"`, `"lifetime"` |
| `stripe_customer_id` | text | Stripe Customer ID |
| `portfolio_card_ids` | text[] | Array of `card_key` values |

---

## Error Reference

| HTTP Status | Meaning |
|-------------|---------|
| `200` | Success |
| `400` | Bad request — check request body format |
| `401` | Unauthorized — invalid or missing JWT |
| `404` | Resource not found |
| `429` | Rate limit exceeded — retry after `Retry-After` seconds |
| `500` | Server error — check Supabase function logs |

All errors include an `error` string in the response body.

---

## Environment Variables

Required for all Edge Functions:

```
SUPABASE_URL=https://[PROJECT_ID].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

For Sage AI functions:
```
ANTHROPIC_API_KEY=sk-ant-...  # sage-chat
GOOGLE_AI_API_KEY=AIza...      # sage-chat-stream (Gemini Flash)
```

---

## Local Development

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Start local Supabase stack
supabase start

# Serve Edge Functions locally
supabase functions serve --env-file .env.local

# Test an endpoint
curl -X POST http://localhost:54321/functions/v1/get-best-card \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "merchantName": "Tim Hortons",
    "portfolioCardIds": ["amex-cobalt", "td-cash-back-visa-inf"]
  }'
```

For Stripe webhook testing:
```bash
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

---

## Deployment

```bash
# Deploy all functions
supabase functions deploy

# Deploy a specific function
supabase functions deploy get-best-card

# Set secrets
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
```

---

*Generated from Rewardly codebase — 2026-02-27*
