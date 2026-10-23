# 🧙‍♂️ Developer Onboarding - Rewardly

Welcome! This guide will get you from zero to contributing in under 30 minutes.

## 📍 What is Rewardly?

**Rewardly** is an AI-powered credit card rewards optimizer for Canada (expanding to US). Think "SaveSage for Canada."

**Core Value Prop:**
- User enters their spending patterns
- Sage AI (powered by Anthropic Claude) recommends the best credit cards
- Real-time optimization based on 80+ cards in our database
- Bilingual (EN/FR), mobile-first, web + native apps

**Current Status (Feb 12, 2026):**
- ✅ MVP deployed to Vercel (web app)
- ✅ 80 cards in database (53 CA + 27 US)
- ✅ Sage AI streaming chat functional
- ⏳ Mobile apps (React Native) not yet deployed
- 🎯 **Primary Goal:** First paying customer (Sprint #1)

---

## 🏗️ Architecture Overview

### Tech Stack

**Frontend:**
- React Native (0.81) + Expo (SDK 54)
- TypeScript
- Expo Router for navigation
- Works on: Web (Vercel), iOS (future), Android (future)

**Backend:**
- Supabase (PostgreSQL + Edge Functions)
- Deno runtime for Edge Functions
- Anthropic Claude API (Haiku model for chat)

**Infrastructure:**
- Vercel for web hosting
- Supabase West US (Oregon) region
- GitHub for version control

**Key Libraries:**
- `@anthropic-ai/sdk` - AI chat
- `@supabase/supabase-js` - Database client
- Expo modules for cross-platform

---

## 🗺️ Project Structure

```
rewardly/
├── src/
│   ├── components/        # React components
│   │   ├── cards/        # Card-related UI
│   │   ├── chat/         # Sage AI chat interface
│   │   └── common/       # Shared components
│   ├── screens/          # Main app screens
│   │   ├── HomeScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── services/         # Business logic
│   │   ├── supabase.ts   # Supabase client
│   │   ├── ai.ts         # AI integration
│   │   └── cards.ts      # Card recommendation engine
│   ├── data/             # Static data & types
│   ├── utils/            # Helper functions
│   └── types/            # TypeScript definitions
│
├── supabase/
│   ├── functions/
│   │   ├── sage-chat/           # Original AI chat (deprecated)
│   │   └── sage-chat-stream/    # NEW: Streaming AI chat ✅
│   └── migrations/              # Database schema & seeds
│       ├── 001_initial_schema.sql
│       ├── 012_ai_conversations.sql
│       └── ...
│
├── docs/                 # Documentation (you are here!)
│   ├── PRD-v1.md        # Product requirements
│   ├── ENGINEERING-ASSESSMENT.md  # Architecture decisions
│   └── DEVELOPER_ONBOARDING.md   # This file
│
├── dist/                 # Web build output (Vercel)
├── assets/               # Images, icons, fonts
└── scripts/              # Deployment automation
```

---

## 🗄️ Database Schema

Rewardly uses **Supabase PostgreSQL** with these core tables:

### `credit_cards` (80 rows)
Primary card data source.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Card name (e.g., "Scotiabank Passport") |
| `issuer` | text | Bank (RBC, TD, Amex, etc.) |
| `country` | text | CA or US |
| `annual_fee` | numeric | Annual cost |
| `welcome_bonus` | jsonb | Signup offer details |
| `earning_rates` | jsonb | Points per category |
| `benefits` | jsonb | Insurance, lounge access, etc. |
| `program_id` | uuid | Links to rewards_programs |

**Key Query:**
```sql
SELECT * FROM credit_cards WHERE country = 'CA' AND annual_fee < 100;
```

### `rewards_programs`
Points currencies (Aeroplan, Avion, Amex MR, etc.)

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Program name |
| `issuer` | text | Bank/airline |
| `point_valuation` | numeric | Cents per point (e.g., 2.0) |
| `transfer_partners` | jsonb | Airlines, hotels, etc. |

### `ai_conversations` (NEW - Feb 12)
Stores Sage AI chat history.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | User identifier |
| `messages` | jsonb | Full conversation history |
| `created_at` | timestamp | Session start |

### `user_profiles` (NEW - Feb 12)
User preferences and spending patterns.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | uuid | Primary key (Supabase Auth) |
| `spending_profile` | jsonb | Category spending amounts |
| `preferred_language` | text | en or fr |
| `card_portfolio` | jsonb | Current cards owned |

---

## 🤖 Sage AI - How It Works

**Sage** is Rewardly's AI advisor powered by Anthropic Claude.

### Architecture (as of Feb 12, 2026)

**Old (Deprecated):**
- `supabase/functions/sage-chat/index.ts`
- Non-streaming, high latency (~2s TTFB)

**New (Active ✅):**
- `supabase/functions/sage-chat-stream/index.ts`
- **Streaming responses** using Server-Sent Events (SSE)
- Anthropic Haiku model (fast, cost-effective)
- TTFB <400ms

### How Streaming Works

1. **Frontend** sends POST to `/sage-chat-stream`
   ```typescript
   fetch('https://zdlozhpmqrtvvhdzbmrv.supabase.co/functions/v1/sage-chat-stream', {
     method: 'POST',
     body: JSON.stringify({ messages, userId })
   })
   ```

2. **Edge Function** receives request:
   ```typescript
   const stream = await anthropic.messages.stream({
     model: 'claude-3-5-haiku-20241022',
     messages,
     stream: true
   })
   ```

3. **Response flows back** as SSE chunks:
   ```
   data: {"type": "content_block_delta", "delta": {"text": "I recommend"}}
   data: {"type": "content_block_delta", "delta": {"text": " the Scotiabank"}}
   ...
   ```

4. **Frontend renders** text as it arrives (typewriter effect)

### Sage's Personality

Sage is configured as a **Canadian credit card expert**:
- Friendly, helpful, not pushy
- Focuses on maximizing rewards for user's spending
- Multilingual (EN/FR)
- Privacy-conscious (doesn't store sensitive data)

**System Prompt:**
> "You are Sage, an AI credit card advisor specializing in Canadian rewards programs..."

(Full prompt in `sage-chat-stream/index.ts`)

---

## 🚀 Local Development Setup

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org))
- npm or yarn
- Git
- Supabase CLI: `npm install -g supabase`
- Expo CLI: `npm install -g expo-cli`

### Initial Setup (5 minutes)

```bash
# 1. Clone the repo
git clone https://github.com/tahseen137/rewardly.git
cd rewardly

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env

# 4. Edit .env with your keys
nano .env  # or use your favorite editor
```

**Required .env variables:**
```env
EXPO_PUBLIC_SUPABASE_URL=https://zdlozhpmqrtvvhdzbmrv.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<get from Supabase dashboard>
EXPO_PUBLIC_ANTHROPIC_API_KEY=<your Anthropic key>
```

### Running Locally

**Web app:**
```bash
npm run web
# Opens http://localhost:8081
```

**iOS simulator (Mac only):**
```bash
npm run ios
```

**Android emulator:**
```bash
npm run android
```

**Run Supabase locally (optional):**
```bash
supabase start
# Runs local Postgres + Edge Functions
```

---

## 🔧 Common Development Tasks

### Adding a New Credit Card

**Option 1: Via Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select project → Table Editor → `credit_cards`
3. Click "Insert row"
4. Fill in card details

**Option 2: Via SQL Migration**
```sql
-- supabase/migrations/014_add_new_card.sql
INSERT INTO credit_cards (name, issuer, country, annual_fee, earning_rates)
VALUES (
  'New Card Name',
  'RBC',
  'CA',
  120.00,
  '{"groceries": 5, "gas": 3, "everything": 1}'::jsonb
);
```

Then run:
```bash
supabase db push
```

### Updating Sage AI Logic

Edit: `supabase/functions/sage-chat-stream/index.ts`

```typescript
// Change the system prompt
const systemPrompt = `You are Sage, a friendly AI...`;

// Adjust model parameters
const stream = await anthropic.messages.stream({
  model: 'claude-3-5-haiku-20241022',  // or sonnet for higher quality
  max_tokens: 1024,                     // increase for longer responses
  temperature: 0.7,                     // 0 = deterministic, 1 = creative
  messages
});
```

Deploy changes:
```bash
supabase functions deploy sage-chat-stream
```

### Testing Locally vs Production

**Local Supabase:**
```bash
supabase start
# Edge Functions run on http://localhost:54321
```

**Production Supabase:**
- All changes pushed to `main` branch auto-deploy
- Or manually: `supabase functions deploy sage-chat-stream --project-ref zdlozhpmqrtvvhdzbmrv`

---

## 📊 Key Metrics & Data

**Current Database Stats (Feb 12, 2026):**
- 53 Canadian cards
- 27 US cards
- 15 rewards programs
- ~1,200 lines of SQL migrations

**Card Issuers:**
- RBC, TD, Scotiabank, BMO, CIBC
- Amex Canada, Capital One, Tangerine
- US: Chase, Amex US, Citi, etc.

**Most Popular Cards (by query volume):**
1. Scotiabank Passport Visa Infinite
2. RBC Avion Visa Infinite
3. TD Aeroplan Visa Infinite

---

## 🎯 Current Sprint Goals (Feb 10-16)

**Sprint #1 Objective:** First paying customer

**This Week's Focus:**
1. ✅ Deploy web MVP to Vercel
2. ✅ Implement Sage AI streaming
3. ⏳ Launch Product Hunt campaign
4. ⏳ Set up payment processing (Stripe)
5. ⏳ Drive initial signups

**Your Mission:**
- Ship features, not perfection
- Web app first, mobile later
- Distribution > building (70% marketing, 30% code)

---

## 📚 Essential Reading

Before making changes, read these (in order):

1. **[PRD-v1.md](PRD-v1.md)** - Product vision & requirements (10 min)
2. **[ENGINEERING-ASSESSMENT.md](ENGINEERING-ASSESSMENT.md)** - Architecture decisions (15 min)
3. **[EDGE_FUNCTIONS_DEPLOYMENT.md](EDGE_FUNCTIONS_DEPLOYMENT.md)** - Supabase deployment guide (10 min)

**Quick reference:**
- Card data structure: `src/types/Card.ts`
- Supabase client: `src/services/supabase.ts`
- Sage AI integration: `supabase/functions/sage-chat-stream/index.ts`

---

## 🐛 Troubleshooting

### "Supabase client error"
- Check `.env` file has correct `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Verify Supabase project is running: https://supabase.com/dashboard

### "Sage AI not responding"
- Check Anthropic API key in Supabase Edge Function secrets:
  ```bash
  supabase secrets list
  ```
- Verify Edge Function is deployed:
  ```bash
  supabase functions list
  ```

### "Cards not loading"
- Check database has seed data:
  ```sql
  SELECT COUNT(*) FROM credit_cards;
  -- Should return 80
  ```
- If empty, run migrations:
  ```bash
  supabase db reset
  ```

### "Web app won't start"
- Clear cache:
  ```bash
  rm -rf node_modules .expo dist
  npm install
  npm run web
  ```

---

## 🤝 Contributing

### Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/add-amex-cards

# 2. Make changes, test locally
npm run web
# verify it works

# 3. Commit with clear message
git add .
git commit -m "Add 5 new Amex cards to database"

# 4. Push to GitHub
git push origin feature/add-amex-cards

# 5. Create Pull Request (or merge directly if you're Aragorn/Gandalf)
```

### Code Standards

- **TypeScript:** Use strict typing, no `any`
- **Formatting:** Prettier (auto-format on save)
- **Linting:** ESLint (`npm run lint`)
- **Comments:** Explain *why*, not *what*

**Good:**
```typescript
// Haiku model chosen for speed (<400ms TTFB) over Sonnet's higher quality
const model = 'claude-3-5-haiku-20241022';
```

**Bad:**
```typescript
// Set model to haiku
const model = 'claude-3-5-haiku-20241022';
```

---

## 🎓 Learning Resources

**Supabase:**
- Docs: https://supabase.com/docs
- Edge Functions: https://supabase.com/docs/guides/functions

**Anthropic Claude:**
- Docs: https://docs.anthropic.com
- Streaming: https://docs.anthropic.com/en/api/messages-streaming

**Expo:**
- Docs: https://docs.expo.dev
- Router: https://expo.github.io/router/docs

**React Native:**
- Official: https://reactnative.dev/docs/getting-started

---

## 🚨 Production Checklist

Before deploying to production:

- [ ] Test Sage AI streaming on real devices
- [ ] Verify all 80 cards load correctly
- [ ] Check bilingual support (EN/FR)
- [ ] Test payment flow (Stripe integration)
- [ ] Confirm analytics tracking (Vercel Analytics)
- [ ] Review privacy policy matches data usage
- [ ] Set up error monitoring (Sentry or similar)
- [ ] Configure rate limiting on Edge Functions
- [ ] Test on slow connections (3G simulation)

---

## 💡 Pro Tips

1. **Use Supabase Studio** (web UI) for quick database queries - faster than writing SQL
2. **Monitor Edge Function logs** in real-time: `supabase functions logs sage-chat-stream --tail`
3. **Test AI responses** locally before deploying - saves API costs
4. **Cache card data** in frontend - no need to query DB on every screen
5. **Use React DevTools** in web browser for component debugging

---

## 🎯 Next Steps

Now that you're onboarded:

1. **Run the app locally** (`npm run web`)
2. **Browse the code** - start with `src/screens/ChatScreen.tsx`
3. **Read PRD-v1.md** to understand product vision
4. **Pick a task** from the current sprint
5. **Ship something** - even if it's small!

**Questions?** Check:
- `docs/` folder for detailed guides
- GitHub Issues for known bugs
- Ask Gandalf (that's me! 🧙‍♂️)

---

**Welcome to the team! Let's ship this. 🚀**

*Last updated: Feb 12, 2026 by Gandalf*
