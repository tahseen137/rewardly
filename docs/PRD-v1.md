# Product Requirements Document (PRD)
## Rewardly NA — Credit Card Rewards Optimization Platform
### Version 1.0 | February 2026

---

## Executive Summary

**Product Name:** Rewardly (North America Edition)  
**Tagline:** "Turn Every Swipe Into Your Next Adventure"  
**Company:** Motu Inc.  

**Vision:** Become the #1 AI-powered credit card rewards optimization platform in North America, combining the best features of SaveSage's human touch with modern AI capabilities and a US/Canada-first product strategy.

**Market Opportunity:** 200M+ credit card holders in the US and Canada leave an estimated $50B+ in unredeemed rewards annually. Our research shows that existing solutions (MaxRewards, CardPointers) focus primarily on "which card to use" but fail to address the full rewards lifecycle — earning, tracking, and redeeming at maximum value.

---

## Table of Contents

1. [Competitive Deep Dive](#1-competitive-deep-dive)
2. [Target Market](#2-target-market)
3. [MVP Feature Spec (v1.0)](#3-mvp-feature-spec-v10)
4. [Monetization Strategy](#4-monetization-strategy)
5. [Differentiation & Brand Strategy](#5-differentiation--brand-strategy)
6. [Risk Assessment & Mitigation](#6-risk-assessment--mitigation)
7. [Success Metrics](#7-success-metrics)
8. [Appendix](#appendix)

---

## 1. Competitive Deep Dive

### 1.1 SaveSage (India) — The Inspiration

| Metric | Data |
|--------|------|
| **Users** | 350,000+ |
| **Rating** | 4.6/5 (App Store) |
| **Notable** | Shark Tank India featured |
| **Founded** | 2023 |

**Key Features:**
- 🤖 **Savvy AI Assistant** — 24/7 chatbot for credit card & loyalty program questions
- 💳 **Card Management** — Add cards, pay bills, track rewards in one place
- ✈️ **Travel Planning** — Plan trips and redeem points for free flights/hotels
- 📊 **Personalized Recommendations** — Analyzes 1L+ data points for card suggestions
- 👨‍💼 **Expert Consultations** — 1-on-1 calls with human rewards experts
- 📧 **Weekly Newsletter** — Curated rewards tips and optimization strategies

**Subscription Tiers:**
- **Pro** — Full app access + weekly newsletter
- **Elite** — Adds unlimited AI chat + human expert consultations
- **Private** — Family plan + dedicated relationship manager

**User Testimonials Analysis:**
> "Saved more in 3 months than in 3 years" — Common theme around dramatic rewards uplift
> "Free flights, free hotels" — Travel redemption is the key emotional hook
> "No more point-paralysis" — Decision fatigue solved by expert guidance

**Why SaveSage Works:**
1. Focuses on **outcome** (free travel) not feature (card tracking)
2. Human expert consultation creates trust
3. AI + Human hybrid model
4. Premium positioning attracts serious optimizers

---

### 1.2 MaxRewards (US) — Market Leader

| Metric | Data |
|--------|------|
| **Users** | 800,000+ |
| **Rating** | 4.8/5 (App Store) |
| **Platform** | iOS, Android |
| **Founded** | 2018 |

**Core Features:**
- ✅ Best Card by Category — Know which card for any merchant type
- ✅ Best Card by Location — GPS-based recommendations
- ✅ Auto-Activation of Offers — Never miss Amex Offers, Chase Offers, etc.
- ✅ Benefits Consolidation — Track credits, perks across all cards
- ✅ Benefits Tracking — Automated monitoring of usage
- ✅ AI Transaction Categorization — Smart spend analytics
- ✅ Recurring Charges Tracker — Find subscriptions
- ✅ Credit Score Monitoring — Aggregated scores from issuers

**Pricing:**
| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Best Card, Insights, Transactions |
| **Gold** | $9+/month (pay-what-you-want, billed $108+/year) | Auto-activation, benefits tracking, bonus trackers |
| **Platinum** | $20+/month (billed $240+/year) | All Gold + business expense categories, receipt management |

**Supported Issuers:** 90% of US credit cards — Amex, Chase, BoA, Citi, Capital One, Discover, Wells Fargo, US Bank

**Strengths:**
- Excellent card-to-location matching
- Auto-activation is a killer feature
- Clean UI and UX
- Strong iOS/Android parity

**Weaknesses (from user reviews):**
- ❌ No redemption optimization — tells you WHICH card, not HOW to use points
- ❌ Sync issues reported — "Sometimes I have to sync it"
- ❌ No travel planning features
- ❌ No human expert option
- ❌ Limited Canadian card support
- ❌ No AI chatbot for questions

---

### 1.3 CardPointers (US/Canada) — Solo Developer Success

| Metric | Data |
|--------|------|
| **Cards Supported** | 5,000+ from 900+ banks |
| **Rating** | 4.7/5 (9K ratings on App Store) |
| **Countries** | US, Canada, and others |
| **Developer** | Emmanuel Crouvisier (solo indie) |

**Core Features:**
- ✅ Best Card Recommendations — Category and location-based
- ✅ Siri Integration — "CardPointers here" for instant recommendations
- ✅ Apple Watch App — Wrist-based card suggestions
- ✅ Safari Extension — Shopping Pointers + auto-add offers
- ✅ AutoPilot — Location-based Live Activities
- ✅ Privacy-First — No bank linking required

**Pricing:**
| Tier | Price |
|------|-------|
| **Free** | Limited features |
| **CardPointers+** | $59.99/year, $6.99/month, or $239.99 lifetime |

**Unique Strengths:**
- Best Apple ecosystem integration
- Canadian card support (rare!)
- No bank credentials required (privacy win)
- Solo dev with passionate community

**Weaknesses:**
- ❌ No AI/chatbot features
- ❌ No redemption planning
- ❌ No expert consultations
- ❌ Limited Android parity
- ❌ Basic transaction insights (compared to MaxRewards)

---

### 1.4 AwardWallet — Points Tracker

| Metric | Data |
|--------|------|
| **Points Tracked** | 229 Billion+ |
| **Focus** | Balance aggregation |
| **Price** | Free (premium available) |

**Core Features:**
- ✅ Tracks credit cards, airlines, hotels, cruises, dining
- ✅ Expiration reminders
- ✅ Travel itinerary organization
- ✅ Account detail quick access

**Position:** AwardWallet is a **tracker**, not an **optimizer**. No recommendations, no AI, no strategy.

---

### 1.5 The Points Guy — Media Affiliate Play

| Metric | Data |
|--------|------|
| **Business Model** | Content + Affiliate |
| **Monthly Visitors** | 10M+ |
| **Revenue** | Estimated $50M+ (affiliate) |

**Features:**
- Point valuations (Chase 2.05¢, Amex 2.0¢, Bilt 2.20¢, etc.)
- Card reviews and comparisons
- CardMatch tool for personalized recommendations
- Newsletter with deals

**Position:** Media company, not product. Validates massive affiliate revenue opportunity.

---

### 1.6 CRED (India) — Premium Club Model

| Metric | Data |
|--------|------|
| **Users** | 25M+ members |
| **Requirement** | Credit score 750+ |
| **Focus** | Bill payment rewards |

**Model:** Exclusive club for high-credit-score individuals. Rewards for paying credit card bills through the app.

**Relevance:** Shows premium/exclusive positioning can work at scale in credit card space.

---

### 1.7 Competitive Gap Analysis

| Feature | SaveSage | MaxRewards | CardPointers | AwardWallet | **Rewardly NA** |
|---------|----------|------------|--------------|-------------|-----------------|
| Best Card by Category | ✅ | ✅ | ✅ | ❌ | ✅ |
| Best Card by Location | ❌ | ✅ | ✅ | ❌ | ✅ |
| Auto-Activation Offers | ❌ | ✅ | ✅ | ❌ | 🔜 v1.5 |
| AI Chatbot | ✅ | ❌ | ❌ | ❌ | ✅ |
| Redemption Planning | ✅ | ❌ | ❌ | ❌ | ✅ |
| Travel Planning | ✅ | ❌ | ❌ | ✅ | ✅ |
| Human Expert Consults | ✅ | ❌ | ❌ | ❌ | ✅ |
| Canadian Card Support | ❌ | Limited | ✅ | ✅ | ✅ |
| US Card Support | ❌ | ✅ | ✅ | ✅ | ✅ |
| Point Valuations | ✅ | ❌ | ❌ | ❌ | ✅ |
| Privacy-First Mode | ❌ | ❌ | ✅ | ❌ | ✅ |
| Benefits Tracking | ❌ | ✅ | ❌ | ❌ | 🔜 v1.5 |

### 1.8 The Gap — Our Opportunity

**Nobody in North America does ALL of these well:**

1. **AI-Powered Conversational Advice** — "Should I get the Chase Sapphire or Amex Gold?" answered in seconds, personalized to your spend

2. **Redemption Optimization** — "You have 100K Amex points. Here are 3 ways to use them ranked by value: Business class to Europe (2.1¢/pt), Hilton transfer (0.6¢/pt), statement credit (1¢/pt)"

3. **Travel Planning with Points** — "I want to go to Paris in June for 5 nights. Here's how to book it for 0 points out of pocket using your existing balances."

4. **Human Expert Fallback** — For complex cases (award routing, status challenges, card strategy), connect to a real expert

5. **True North American Focus** — Both US AND Canada card databases, with local expertise

---

## 2. Target Market

### 2.1 Market Size

| Metric | US | Canada | Total |
|--------|----| -------|-------|
| **Credit Card Holders** | 191M | 31M | 222M |
| **Active Rewards Card Users** | ~120M | ~20M | ~140M |
| **"Rewards Optimizers"** (heavy users) | ~25M | ~4M | ~29M |
| **Avg Unredeemed Rewards/Person** | $175 | $150 | — |
| **Total Unredeemed Rewards** | $33B | $4.6B | ~$38B |

**Serviceable Addressable Market (SAM):** 29M rewards optimizers × $5/month avg willingness to pay = **$1.74B/year**

**Target Year 1:** Capture 50,000 paid subscribers = **$3M ARR**

### 2.2 User Personas

#### Persona 1: **The Casual Cashbacker** (60% of market)
- **Profile:** 35yo professional, 2-3 credit cards, uses cashback cards
- **Pain:** "I know I'm not maximizing my rewards but it's too complicated"
- **Goal:** Simple guidance on which card to use
- **Willingness to Pay:** $0-5/month (freemium target)
- **Feature Needs:** Best card recommendations, occasional tips

#### Persona 2: **The Rewards Optimizer** (30% of market)
- **Profile:** 42yo frequent traveler, 5-8 cards, tracks points manually in spreadsheets
- **Pain:** "I spend hours researching which card to get and how to use my points"
- **Goal:** Maximize every point earned and redeemed
- **Willingness to Pay:** $10-15/month
- **Feature Needs:** AI chatbot, redemption planning, point valuations

#### Persona 3: **The Travel Hacker** (10% of market)
- **Profile:** 38yo points enthusiast, 10+ cards, active on Reddit r/churning
- **Pain:** "I need help with complex award routing and new card strategy"
- **Goal:** Book $50K+ trips for minimal cost
- **Willingness to Pay:** $20-50/month
- **Feature Needs:** Expert consultations, travel planning, award search

### 2.3 Geographic Segmentation

| Region | Priority | Rationale |
|--------|----------|-----------|
| **United States** | P0 | Larger market, more cards, higher ARPU |
| **Canada** | P0 | Existing codebase, underserved, bilingual (EN/FR) |
| **UK/EU** | P2 | Future expansion after NA market capture |

---

## 3. MVP Feature Spec (v1.0)

### 3.1 Feature Priority Matrix

| Feature | Impact | Effort | Priority | Timeline |
|---------|--------|--------|----------|----------|
| Best Card Recommendations | 🔥🔥🔥 | ⚡ Low | P0 | Week 1-2 |
| US Card Database (200+ cards) | 🔥🔥🔥 | 🔨 Med | P0 | Week 2-4 |
| AI Assistant "Sage" | 🔥🔥🔥 | 🔨 Med | P0 | Week 3-5 |
| Card Portfolio Manager | 🔥🔥 | ⚡ Low | P0 | Existing |
| Point Valuations | 🔥🔥 | ⚡ Low | P0 | Week 2-3 |
| Location-Based Recs | 🔥🔥 | 🔨 Med | P1 | Week 5-6 |
| Travel Redemption Planner | 🔥🔥🔥 | 🏋️ High | P1 | Week 6-8 |
| Expert Consultation Booking | 🔥🔥 | 🔨 Med | P2 | Week 8-10 |
| Subscription/Payments | 🔥🔥🔥 | 🔨 Med | P0 | Week 4-5 |
| Benefits Tracking | 🔥 | 🏋️ High | P3 | v1.5 |
| Auto-Offer Activation | 🔥🔥 | 🏋️ High | P3 | v1.5 |

### 3.2 Core Feature Specifications

#### 3.2.1 Best Card Recommendations (P0)

**Description:** User selects a spending category or store, app shows which card in their portfolio earns the most rewards.

**Existing Code to Reuse:**
- `RecommendationEngine.ts` — `rankCardsForCategory()`, `getRewardRateForCategory()`
- `StoreDataService.ts` — Store category mapping
- `google-places/MerchantService.ts` — Merchant lookup and autocomplete
- `CategoryGrid.tsx` — UI component for category selection

**New Development:**
- US card database (200+ cards with category multipliers)
- Enhanced merchant-to-category mapping for US chains
- Real-time "best card" widget for home screen

**User Flow:**
1. User opens app → sees "What are you buying?" prompt
2. User types store name (autocomplete) or selects category
3. App shows top 3 cards ranked by reward rate
4. Tap card to see details (rate, program, current balance)

---

#### 3.2.2 US Card Database (P0)

**Description:** Comprehensive database of US credit cards with reward rates, categories, annual fees, benefits, and signup bonuses.

**Data Structure (extend existing `canadian_cards_extended.json`):**
```typescript
interface CreditCard {
  id: string;                    // e.g., "chase-sapphire-preferred"
  name: string;                  // "Chase Sapphire Preferred"
  issuer: string;                // "Chase"
  country: "US" | "CA";
  rewardProgram: string;         // "Ultimate Rewards"
  annualFee: number;             // 95
  pointValuation: number;        // 2.05 (cents per point)
  baseRewardRate: RewardRate;
  categoryRewards: CategoryReward[];
  benefits: CardBenefit[];
  signupBonus: SignupBonus;
  foreignTransactionFee: number; // 0 for no fee
  creditScoreRequired: "Poor" | "Fair" | "Good" | "Excellent";
  affiliateLink?: string;        // For monetization
  lastUpdated: string;           // ISO date
}
```

**Initial Card Coverage (200+ cards):**
- **Chase:** Sapphire Preferred, Sapphire Reserve, Freedom Unlimited, Freedom Flex, Ink Preferred, Ink Unlimited
- **American Express:** Platinum, Gold, Green, Blue Cash Preferred, Delta cards, Hilton cards
- **Capital One:** Venture X, Venture, SavorOne, Quicksilver
- **Citi:** Premier, Double Cash, Custom Cash, AAdvantage cards
- **Bank of America:** Premium Rewards, Customized Cash
- **Wells Fargo:** Autograph, Active Cash
- **Discover:** it, Miles
- **US Bank:** Altitude Connect, Altitude Go
- **Barclays:** AAdvantage Aviator, JetBlue cards
- **Others:** Bilt, Apple Card, Amazon Prime, Costco Anywhere

**Effort:** 40-60 hours of data entry + validation

---

#### 3.2.3 AI Assistant "Sage" (P0)

**Description:** Conversational AI that answers credit card and rewards questions, provides personalized advice, and helps with strategy.

**LLM Selection:**

| Model | Cost | Quality | Latency | Recommendation |
|-------|------|---------|---------|----------------|
| GPT-4o | $5/$15 per 1M tokens | Excellent | ~1-2s | **Production** |
| GPT-4o-mini | $0.15/$0.60 per 1M tokens | Good | ~0.5s | High-volume |
| Claude Sonnet | $3/$15 per 1M tokens | Excellent | ~1-2s | Alternative |
| Gemini Pro | $1.25/$5 per 1M tokens | Good | ~1s | Budget option |

**Recommendation:** Start with **GPT-4o-mini** for v1.0 (cost-effective), upgrade to GPT-4o for premium tier.

**System Prompt Design:**
```
You are Sage, an expert credit card rewards advisor. You help users in the US and Canada maximize their credit card rewards.

Context about the user:
- Cards in portfolio: {portfolio}
- Reward preferences: {preferences}
- Current point balances: {balances}

Your capabilities:
1. Recommend which card to use for purchases
2. Explain point valuations and transfer partners
3. Help plan travel redemptions
4. Suggest new cards based on spending patterns
5. Answer questions about card benefits

Always:
- Be specific with numbers and valuations
- Cite sources (e.g., "Chase Ultimate Rewards are worth ~2¢ per TPG valuations")
- Disclose when you're recommending a card we have an affiliate relationship with
- Recommend consultation with a human expert for complex cases

Never:
- Give specific financial advice (you're not a licensed advisor)
- Make guarantees about approval odds
- Share user data with third parties
```

**Key Interactions:**
- "Which card should I use at Costco?" → Category-based recommendation
- "Is the Amex Platinum worth it for me?" → Personalized analysis based on spend
- "I have 150K Amex points, how should I use them?" → Redemption ranking
- "Help me book a trip to Tokyo" → Travel planning workflow

**Architecture:**
1. User message → Frontend
2. Frontend → Backend (Node.js/Supabase Edge Function)
3. Backend enriches with user context (portfolio, balances)
4. Backend → LLM API (OpenAI/Anthropic)
5. LLM response → Backend (optional tool use for card lookup)
6. Backend → Frontend → User

**Token Estimation:**
- Average conversation: 1,500 input + 500 output tokens
- Cost per conversation (GPT-4o-mini): ~$0.001
- Daily active users × 3 conversations = 50K × 3 = 150K conversations/day
- Daily LLM cost at scale: ~$150/day = $4,500/month

---

#### 3.2.4 Card Portfolio Manager (P0)

**Description:** Users add their credit cards to track rewards, get recommendations, and manage their wallet.

**Existing Code to Reuse:**
- `CardPortfolioManager.ts` — CRUD operations, AsyncStorage persistence
- `MyCardsScreen.tsx` — Card list UI with add/remove
- `CardDetailModal.tsx` — Card details view
- `CardVisual.tsx` — Card rendering component

**Enhancements Needed:**
- Add US card search/selection (from new database)
- Add point balance tracking (optional, manual entry)
- Add card benefit reminders (travel credits, etc.)
- Sync across devices (Supabase user accounts)

---

#### 3.2.5 Point Valuations (P0)

**Description:** Real-time point/mile valuations for all major programs, similar to The Points Guy.

**Existing Code to Reuse:**
- `point_valuations.csv` — 18 Canadian programs
- `rewards_programs.csv` — Program details
- `docs/all_rewards_data.md` — Comprehensive reference

**New Data Needed (US Programs):**
| Program | Base Value | Optimal Value | Transfer Partners |
|---------|------------|---------------|-------------------|
| Chase Ultimate Rewards | 1.0¢ | 2.05¢ | Hyatt, United, Southwest |
| Amex Membership Rewards | 1.0¢ | 2.0¢ | ANA, Virgin Atlantic, Aeroplan |
| Capital One Miles | 1.0¢ | 1.85¢ | Turkish, Emirates |
| Citi ThankYou | 1.0¢ | 1.9¢ | Turkish, Virgin Atlantic |
| Bilt Rewards | 1.0¢ | 2.2¢ | Hyatt, Turkish, AA |
| United MileagePlus | — | 1.5¢ | N/A |
| Delta SkyMiles | — | 1.25¢ | N/A |
| AA AAdvantage | — | 1.7¢ | N/A |
| Southwest Rapid Rewards | — | 1.3¢ | N/A |
| Hilton Honors | — | 0.5¢ | N/A |
| Marriott Bonvoy | — | 0.7¢ | N/A |
| World of Hyatt | — | 1.7¢ | N/A |

---

#### 3.2.6 Location-Based Recommendations (P1)

**Description:** Use GPS to detect where user is and proactively suggest best card.

**Existing Code to Reuse:**
- `google-places/MerchantService.ts` — `getNearbyMerchants()`, `searchMerchant()`
- `google-places/categoryMapping.ts` — Google type → spending category

**New Development:**
- Background location tracking (iOS/Android)
- Push notification when entering store
- Live Activities / Dynamic Island support (iOS)
- Privacy controls (opt-in, on-device processing)

---

#### 3.2.7 Travel Redemption Planner (P1)

**Description:** Help users plan trips using their points. Show options, compare value, and guide booking.

**Example User Flow:**
1. "I want to fly business class to Tokyo in April"
2. Sage analyzes user's point balances:
   - 150K Amex MR → Transfer to ANA (85K RT)
   - 120K Chase UR → Transfer to United (80K-140K RT)
   - 80K Capital One → Transfer to Turkish (via ANA)
3. Shows options ranked by value:
   - "Transfer 85K Amex → ANA = $8,500 value (10¢/pt)"
   - "Transfer 120K Chase → United = $6,000 value (5¢/pt)"
4. Provides step-by-step booking guidance

**Data Sources Needed:**
- Award chart databases (airline programs)
- Seat availability APIs (or user-guided search)
- Hotel award pricing

**MVP Approach:** Start with curated "redemption guides" for top 20 routes, expand with AI guidance.

---

#### 3.2.8 Expert Consultation Booking (P2)

**Description:** Connect users with human rewards experts for complex strategy sessions.

**Model Options:**
1. **In-House Experts** — Hire 2-3 part-time consultants ($50-75/hour)
2. **Expert Network** — Partner with travel bloggers/experts (revenue share)
3. **Community Experts** — Vet power users as paid consultants

**Pricing:** $50-100 per 30-minute session (included free in Premium tier)

**Implementation:**
- Calendly or Cal.com integration for booking
- Stripe for payments
- Video via Zoom/Google Meet
- Post-session summary sent to user

---

### 3.3 Code Reuse Summary

| Module | Lines of Code | Reusable | Modifications Needed |
|--------|---------------|----------|---------------------|
| `RecommendationEngine.ts` | 250 | 90% | Add US card support |
| `CardPortfolioManager.ts` | 150 | 100% | None |
| `CardDataService.ts` | 200 | 80% | Extend for US database |
| `StoreDataService.ts` | 150 | 70% | Add US store chains |
| `google-places/*` | 400 | 95% | Change region defaults |
| `PreferenceManager.ts` | 100 | 100% | None |
| UI Components | 2000+ | 85% | Theme adjustments |
| Theme System | 300 | 100% | None |
| Navigation | 150 | 100% | Add new screens |
| i18n | 200 | 100% | Add US strings |

**Estimated Reuse:** ~70% of existing codebase directly applicable

---

### 3.4 New Development Required

| Component | Effort | Technology |
|-----------|--------|------------|
| US Card Database | 60 hours | JSON + TypeScript types |
| AI Assistant Backend | 40 hours | Supabase Edge Functions + OpenAI |
| AI Chat UI | 20 hours | React Native |
| Travel Planner UI | 30 hours | React Native |
| Subscription System | 20 hours | RevenueCat + Stripe |
| User Auth | 15 hours | Supabase Auth |
| Point Balance Tracking | 15 hours | React Native + Supabase |
| Benefits Reminders | 20 hours | Push notifications |
| Analytics | 10 hours | PostHog or Mixpanel |

**Total New Development:** ~230 hours

---

### 3.5 Timeline Estimate

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1: Foundation** | Weeks 1-3 | US card database, auth, subscription setup |
| **Phase 2: Core Features** | Weeks 4-6 | AI assistant, enhanced recommendations |
| **Phase 3: Polish** | Weeks 7-8 | Location features, travel planner MVP |
| **Phase 4: Launch Prep** | Weeks 9-10 | Beta testing, app store submission |
| **Phase 5: Launch** | Week 11 | Public launch, marketing push |

**Target Launch:** 11 weeks from project kickoff

---

## 4. Monetization Strategy

### 4.1 Subscription Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Best card recommendations (5/day), basic portfolio, limited AI (10 questions/month) |
| **Plus** | $5.99/month ($59.99/year) | Unlimited recommendations, unlimited AI chat, point valuations, location features |
| **Pro** | $12.99/month ($119.99/year) | All Plus + travel planner, benefits tracking, priority support |
| **Elite** | $29.99/month ($299.99/year) | All Pro + 2 expert consultations/month, family sharing (5 members), concierge service |

**Pricing Rationale:**
- MaxRewards Gold: $9/month → We undercut at $5.99 for Plus
- CardPointers+: $59.99/year → Match at annual pricing
- SaveSage Elite: High-touch service → Our Elite tier

### 4.2 Affiliate Revenue

**Credit Card Affiliate Programs:**

| Issuer | Est. Payout (Card Approval) | Notes |
|--------|----------------------------|-------|
| Chase | $50-200 | Varies by card |
| American Express | $50-175 | Strong for premium cards |
| Capital One | $50-100 | Good volume |
| Citi | $50-150 | Mid-tier payouts |
| Discover | $25-75 | Lower but high approval |
| Barclays | $40-100 | Airline cards strong |

**Average Payout:** ~$100 per approved card

**Affiliate Strategy:**
1. "Cards You Might Like" section based on spending analysis
2. Clear disclosure: "We may earn a commission if you apply"
3. Only recommend cards that genuinely fit user profile
4. Never let affiliate influence core recommendations

**Affiliate Network Options:**
- Commission Junction (CJ)
- Bankrate Affiliate Program
- Direct issuer programs (Chase, Amex)

### 4.3 Revenue Projections

#### Conservative Scenario
| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| Free Users | 100,000 | 300,000 | 600,000 |
| Paid Subscribers | 5,000 | 20,000 | 50,000 |
| ARPU (Monthly) | $8 | $9 | $10 |
| Subscription Revenue | $480K | $2.16M | $6M |
| Affiliate Revenue | $150K | $500K | $1.2M |
| **Total Revenue** | **$630K** | **$2.66M** | **$7.2M** |
| **MRR (Month 12)** | **$52.5K** | **$222K** | **$600K** |

#### Moderate Scenario
| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| Free Users | 200,000 | 600,000 | 1.5M |
| Paid Subscribers | 15,000 | 60,000 | 150,000 |
| ARPU (Monthly) | $9 | $10 | $11 |
| Subscription Revenue | $1.62M | $7.2M | $19.8M |
| Affiliate Revenue | $400K | $1.5M | $4M |
| **Total Revenue** | **$2.02M** | **$8.7M** | **$23.8M** |
| **MRR (Month 12)** | **$168K** | **$725K** | **$1.98M** |

#### Optimistic Scenario
| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| Free Users | 500,000 | 1.5M | 4M |
| Paid Subscribers | 35,000 | 150,000 | 400,000 |
| ARPU (Monthly) | $10 | $11 | $12 |
| Subscription Revenue | $4.2M | $19.8M | $57.6M |
| Affiliate Revenue | $1M | $4M | $12M |
| **Total Revenue** | **$5.2M** | **$23.8M** | **$69.6M** |
| **MRR (Month 12)** | **$433K** | **$1.98M** | **$5.8M** |

**$100K MRR Target:** Achievable in 12-18 months (Moderate scenario Month 8-10)

### 4.4 Unit Economics

| Metric | Value |
|--------|-------|
| **CAC (Customer Acquisition Cost)** | $15-25 |
| **LTV (Lifetime Value)** | $120-180 (24-month avg) |
| **LTV:CAC Ratio** | 5:1 to 8:1 |
| **Payback Period** | 3-4 months |
| **Gross Margin** | 85% (SaaS) |
| **Monthly Churn** | Target <4% |

---

## 5. Differentiation & Brand Strategy

### 5.1 Why Rewardly Wins

| Competitor | Their Weakness | Our Strength |
|------------|----------------|--------------|
| **MaxRewards** | No AI, no redemption help | Sage AI + Travel Planner |
| **CardPointers** | Limited AI, no experts | Full AI + Human fallback |
| **AwardWallet** | Just tracking, no strategy | Active optimization |
| **NerdWallet/TPG** | Content only, no tools | Actionable app |
| **SaveSage** | India only | North America native |

### 5.2 Unique Value Proposition

> **"Rewardly is your AI-powered rewards strategist. While other apps tell you which card to use, we help you earn more, track everything, and turn your points into unforgettable trips."**

### 5.3 The "Shark Tank Moment"

**Pitch:** "Americans leave $33 billion in credit card rewards unredeemed every year. That's $175 per person just sitting there. We built Sage, the first AI that actually helps you use those rewards. In just 3 months, our beta users saved an average of $2,400 on travel — that's a 40x return on our $60 annual subscription."

**Hook:** "Free trips aren't complicated. You just need the right guide."

**Demo:** 
1. Show user portfolio with 200K points across programs
2. Ask Sage: "I want to go to Hawaii for a week"
3. Sage instantly shows 3 options totaling $4,000+ in value
4. "This took our user 30 seconds. Before Rewardly, it would have taken 30 hours."

### 5.4 Brand Positioning

| Element | Direction |
|---------|-----------|
| **Name** | Rewardly — friendly, approachable, clear value prop |
| **Mascot/AI** | Sage — wise, helpful, gender-neutral |
| **Color Palette** | Keep dark blue (#0A0E1F) + bright green (#1DDB82) — premium but modern |
| **Tone** | Smart but not snobby, expert but not elitist |
| **Target Feeling** | "I finally understand this stuff" |

### 5.5 Marketing Channels

| Channel | Strategy | Budget % |
|---------|----------|----------|
| **Content/SEO** | "Best cards for X" guides, point valuations | 30% |
| **Reddit** | r/churning, r/awardtravel, r/creditcards | 10% |
| **YouTube** | Card reviews, travel hacking tutorials | 25% |
| **Paid Social** | Instagram/TikTok for travel aspirational | 20% |
| **Referrals** | Give a month, get a month | 15% |

---

## 6. Risk Assessment & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Competitor Response** | High | Medium | Move fast, build brand loyalty, focus on AI moat |
| **Card Issuers Block Scraping** | Medium | High | No scraping needed — users add cards manually |
| **LLM Costs Spike** | Low | Medium | Multi-provider strategy, caching, fine-tuning |
| **Low Conversion Rate** | Medium | High | A/B test pricing, freemium hooks, value-first onboarding |
| **Affiliate Program Changes** | Medium | Medium | Diversify revenue, don't depend >30% on affiliate |
| **Regulation Changes** | Low | Medium | Stay compliant, no financial advice, clear disclosures |

---

## 7. Success Metrics

### 7.1 North Star Metric

**"Monthly Active Optimizers (MAO)"** — Users who take an optimization action (use recommendation, chat with Sage, or plan a trip) at least once per week.

### 7.2 Key Performance Indicators

| Metric | Week 1 | Month 1 | Month 3 | Month 6 | Month 12 |
|--------|--------|---------|---------|---------|----------|
| **Downloads** | 5K | 20K | 80K | 200K | 500K |
| **Registered Users** | 2K | 10K | 50K | 150K | 400K |
| **WAU** | 1K | 5K | 25K | 75K | 200K |
| **Paid Subscribers** | 100 | 500 | 3K | 8K | 25K |
| **MRR** | $800 | $4K | $27K | $72K | $225K |
| **AI Conversations** | 5K | 30K | 200K | 600K | 2M |
| **NPS** | 40+ | 45+ | 50+ | 55+ | 60+ |

### 7.3 Feature-Specific Metrics

| Feature | Success Metric | Target |
|---------|----------------|--------|
| Best Card Recommendations | Adoption (% users who use weekly) | >60% |
| Sage AI | Conversations per user per month | >4 |
| Travel Planner | Trips planned per month | >10K |
| Expert Consults | Sessions booked per month | >200 |
| Affiliate Cards | Applications per month | >500 |

---

## Appendix

### A. Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React Native + Expo (iOS, Android, Web)                    │
│  ├── UI Components (existing + new)                         │
│  ├── Navigation (React Navigation 7)                        │
│  ├── State Management (React Context + AsyncStorage)        │
│  └── AI Chat Interface                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  Supabase                                                   │
│  ├── PostgreSQL (users, cards, portfolios, chat history)   │
│  ├── Auth (email, Google, Apple)                           │
│  ├── Edge Functions (AI orchestration, affiliate tracking) │
│  ├── Realtime (chat sync, notifications)                   │
│  └── Storage (user avatars, card images)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│  ├── OpenAI (GPT-4o-mini/GPT-4o for AI)                    │
│  ├── Google Places API (merchant lookup)                   │
│  ├── RevenueCat (subscriptions)                            │
│  ├── Stripe (payments, affiliate tracking)                 │
│  ├── PostHog (analytics)                                   │
│  ├── OneSignal (push notifications)                        │
│  └── Calendly (expert booking)                             │
└─────────────────────────────────────────────────────────────┘
```

### B. Database Schema (Additions)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  country TEXT DEFAULT 'US',
  subscription_tier TEXT DEFAULT 'free',
  subscription_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User card portfolio
CREATE TABLE user_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  card_id TEXT NOT NULL, -- references card database
  nickname TEXT,
  point_balance INTEGER DEFAULT 0,
  added_at TIMESTAMP DEFAULT NOW()
);

-- AI chat history
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Expert consultations
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  expert_id UUID,
  scheduled_at TIMESTAMP,
  completed_at TIMESTAMP,
  notes TEXT,
  status TEXT DEFAULT 'scheduled'
);

-- Affiliate tracking
CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  card_id TEXT NOT NULL,
  clicked_at TIMESTAMP DEFAULT NOW(),
  converted BOOLEAN DEFAULT FALSE,
  conversion_amount DECIMAL
);
```

### C. US Card Database Sample

```json
{
  "cards": [
    {
      "id": "chase-sapphire-preferred",
      "name": "Chase Sapphire Preferred® Card",
      "issuer": "Chase",
      "country": "US",
      "rewardProgram": "Ultimate Rewards",
      "annualFee": 95,
      "pointValuation": 2.05,
      "baseRewardRate": { "value": 1, "type": "points", "unit": "multiplier" },
      "categoryRewards": [
        { "category": "travel", "rewardRate": { "value": 5, "type": "points", "unit": "multiplier" }, "restriction": "via Chase Travel" },
        { "category": "travel", "rewardRate": { "value": 2, "type": "points", "unit": "multiplier" } },
        { "category": "dining", "rewardRate": { "value": 3, "type": "points", "unit": "multiplier" } },
        { "category": "streaming", "rewardRate": { "value": 3, "type": "points", "unit": "multiplier" } },
        { "category": "groceries", "rewardRate": { "value": 3, "type": "points", "unit": "multiplier" }, "restriction": "excluding Target & Walmart" }
      ],
      "signupBonus": {
        "amount": 75000,
        "currency": "points",
        "spendRequirement": 4000,
        "timeframeDays": 90
      },
      "benefits": [
        { "name": "$50 Annual Hotel Credit", "value": 50, "category": "travel" },
        { "name": "DashPass Subscription", "value": 120, "category": "dining" },
        { "name": "10% Anniversary Points Bonus", "value": "variable", "category": "rewards" }
      ],
      "transferPartners": ["United", "Southwest", "Hyatt", "Marriott", "IHG", "British Airways", "Air France", "Virgin Atlantic"],
      "affiliateLink": "https://affiliate.chase.com/csp",
      "lastUpdated": "2026-02-01"
    }
  ]
}
```

### D. AI Prompt Templates

**Card Recommendation Prompt:**
```
User portfolio: {cards}
User preferences: {preferences}
Question: Which card should I use at {merchant}?

Analyze the merchant category and provide:
1. Best card from portfolio for this purchase
2. Reward rate and estimated value
3. Any relevant offers or bonuses
4. Alternative options if available
```

**Travel Planning Prompt:**
```
User point balances: {balances}
User home airport: {airport}
Request: {user_request}

Provide 3 options ranked by value:
1. Best value option (highest cents per point)
2. Best availability option (easiest to book)
3. Best experience option (best product/service)

For each option include:
- Points program to use
- Points required
- Estimated cash value
- Step-by-step booking instructions
```

### E. Competitive Feature Matrix (Detailed)

| Feature | SaveSage | MaxRewards | CardPointers | AwardWallet | Rewardly v1.0 | Rewardly v2.0 |
|---------|----------|------------|--------------|-------------|---------------|---------------|
| **EARNING** | | | | | | |
| Best Card by Category | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Best Card by Location | ❌ | ✅ | ✅ | ❌ | 🔜 | ✅ |
| Auto-Activate Offers | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Bonus Category Tracker | ❌ | ✅ | ✅ | ❌ | 🔜 | ✅ |
| | | | | | | |
| **TRACKING** | | | | | | |
| Portfolio Management | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Point Balance Sync | ✅ | ✅ | ❌ | ✅ | 🔜 | ✅ |
| Transaction Categorization | ❌ | ✅ | ❌ | ❌ | ❌ | 🔜 |
| Credit Score Monitoring | ❌ | ✅ | ❌ | ❌ | ❌ | 🔜 |
| Benefits Tracking | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Expiration Alerts | ✅ | ✅ | ❌ | ✅ | 🔜 | ✅ |
| | | | | | | |
| **REDEEMING** | | | | | | |
| Point Valuations | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Redemption Optimizer | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Travel Planner | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Award Search | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| | | | | | | |
| **AI & SUPPORT** | | | | | | |
| AI Chatbot | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Human Expert Consults | ✅ | ❌ | ❌ | ❌ | 🔜 | ✅ |
| | | | | | | |
| **PLATFORM** | | | | | | |
| iOS App | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Android App | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ |
| Web App | ✅ | ❌ | ⚠️ | ✅ | ✅ | ✅ |
| Apple Watch | ❌ | ❌ | ✅ | ❌ | ❌ | 🔜 |
| Siri/Shortcuts | ❌ | ❌ | ✅ | ❌ | ❌ | 🔜 |
| | | | | | | |
| **MARKET** | | | | | | |
| US Cards | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Canada Cards | ❌ | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| India Cards | ✅ | ❌ | ❌ | ⚠️ | ❌ | ❌ |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-11 | Product Research Lead | Initial PRD |

---

**Next Steps:**
1. ✅ PRD Review with CEO
2. ⬜ Technical Architecture Review
3. ⬜ US Card Database Buildout
4. ⬜ AI Prototype Development
5. ⬜ Beta User Recruitment
6. ⬜ Marketing Site Launch

---

*"The best rewards app isn't the one that tracks the most. It's the one that helps you live more."*

— Rewardly Team
