# Rewardly Brand Voice Guide

Canonical reference for all Rewardly surfaces: mobile app (iOS/Android/Web), Chrome extension, landing pages, store listings, social posts, and docs.

If copy contradicts this guide, this guide wins.

---

## Brand personality

If Rewardly were a person, they'd be a knowledgeable friend who happens to know every credit card deal in Canada. They explain things clearly, celebrate your wins without being over-the-top, never talk down to you, and would never pressure you into buying something.

---

## Voice attributes

### 1. Helpful

- **We are:** clear, practical, benefit-driven. We show you what to do and why it matters.
- **We are not:** preachy, lecture-y, or condescending. We don't say "you should have known."
- **This sounds like:** "Your Amex Cobalt earns 5x at this store. That's $4.50 back on this purchase."
- **This does NOT sound like:** "Most Canadians are wasting money by using the wrong credit card."

### 2. Trustworthy

- **We are:** honest, specific, transparent about how we calculate things. We show the math.
- **We are not:** hype-driven, pushy, or vague. We never use fake urgency or unverifiable claims.
- **This sounds like:** "Saves $105.89 in year one vs Max monthly ($12.99/mo x 12 = $155.88)."
- **This does NOT sound like:** "SAVE $$$! LIMITED TIME ONLY! ACT NOW!"

### 3. Community-minded

- **We are:** built for Canadian rewards optimizers. We reference real Canadian stores, banks, and loyalty programs. We feel like something from r/PersonalFinanceCanada, not a generic SaaS.
- **We are not:** corporate, detached, or US-centric.
- **This sounds like:** "Made for the Canadian rewards community."
- **This does NOT sound like:** "Join millions of smart consumers worldwide."

### 4. Calm

- **We are:** measured, confident, understated. We let the product speak through specific numbers, not exclamation marks.
- **We are not:** loud, aggressive, or salesy. One emoji per screen max (in the app). None in formal copy.
- **This sounds like:** "See which card earns the most at any store, instantly."
- **This does NOT sound like:** "NEVER miss rewards again!! Your wallet will THANK YOU!"

---

## Tone spectrum

The voice attributes stay fixed. Tone adapts:

| Context | Dial up | Dial down | Example |
|---------|---------|-----------|---------|
| Home screen / calculator | Helpful | Community | "Find the best card for every purchase" |
| Onboarding | Helpful, calm | Trustworthy | "We'll show you which card to use at every store" |
| Paywall / pricing | Trustworthy | Calm (slightly more energetic) | "See Every Reward You're Missing" |
| Error states | Calm, helpful | Community | "Something went wrong. Please try again." |
| Settings | Calm | Everything else | "Made for the Canadian rewards community" |
| Landing pages | Helpful, community | Calm (slightly bolder for conversion) | "Find the best card for every purchase" |
| Reddit / social | Community, trustworthy | Calm | "I built this to solve my own problem. Honest feedback welcome." |
| Incident / outage | Trustworthy, calm | Community | "We're aware of the issue and working on a fix." |

---

## Core messaging

### Primary tagline

> **Find the best card for every purchase.**

Use this everywhere as the default. It is the canonical tagline.

### Supporting lines (use as needed, never as the primary)

- "Smart recommendations for 410+ Canadian credit cards"
- "See which card earns the most at any store, instantly"
- "Made for the Canadian rewards community"

### Value propositions (in priority order)

1. **Smart recommendations at point of purchase** — we tell you which card to use, when it matters
2. **Built for Canadian cards** — 410+ cards from all major Canadian issuers
3. **Loyalty program stacking** — combine credit card rewards with PC Optimum, Scene+, Triangle, Aeroplan, Air Miles
4. **Privacy first** — all data stored locally, no tracking, no bank credentials required
5. **AI-powered assistance** (Sage) — ask any rewards question and get an instant answer

### Claims we can make

| Claim | Status | Notes |
|-------|--------|-------|
| "410+ Canadian credit cards" | Verified | Update when DB count changes. Currently 410+ in Supabase. |
| "240+ Canadian merchants" | Verify before use | Check current Supabase count. |
| "All data stored locally" | Verified | Architectural fact for extension. App uses optional Supabase sync. |
| "Bilingual (EN/FR)" | Verified | i18n implemented. |

### Claims we must NOT make (without substantiation)

| Claim | Problem | Fix |
|-------|---------|-----|
| "Canada's #1..." | Unsubstantiated superlative. Competition Act risk. | Don't use. |
| "First Canadian-built..." | Unvalidated. Must search Chrome Web Store first. | Validate or don't claim. |
| "$847/year savings" | Assumptions not linked to methodology. | Use "Up to $X/year*" with linked assumptions. |
| "Save $155+/year" | Vague. | Show the actual math inline. |
| Testimonials from "Sarah M." etc. | Appear fabricated. Ad Standards violation. | Remove or replace with verified quotes. |

---

## Terminology

### Product names

| Name | Usage | Notes |
|------|-------|-------|
| **Rewardly** | Always capitalize. No "the" before it. | "Rewardly shows..." not "The Rewardly app shows..." |
| **Sage** | Capitalize. First mention in any surface: "Sage, your AI rewards assistant." After that: "Sage." | Never "Sage AI" or "the Sage AI assistant" or "AI-powered rewards assistant" after first mention. |
| **Smart Wallet** | Two words, both capitalized. | Feature name for location-based notifications. |

### Preferred terms

| Use this | Not this | Notes |
|----------|----------|-------|
| credit card | card (alone, in marketing copy) | "Card" is fine in UI labels where context is clear |
| rewards | cashback, points (unless being specific) | Use the general term; specify type only when showing actual rates |
| sign up (verb) | signup | "signup" only as noun/adjective: "the signup flow" |
| log in (verb) | login | "login" only as noun/adjective: "the login screen" |
| portfolio | wallet, collection | For the user's set of cards in the app |

### Avoid list

| Term | Why | Use instead |
|------|-----|-------------|
| "Never leave money on the table" | Cliche | "See exactly how much more you could earn" |
| "Unlock your full potential" | Generic SaaS | Be specific: "See every reward you're missing" |
| "Smart spenders" | Implies non-users are dumb | "The Canadian rewards community" |
| "Maximize" (as a headline verb) | Overused in fintech | "Find," "See," "Get" — be specific about what happens |
| ALL CAPS in body copy | Reads as shouting | Use bold for emphasis |
| More than 1 emoji per screen (app) | Undercuts credibility for a finance product | One per screen max, none in formal copy |

---

## Visual identity

### Brand color

| Token | Hex | Usage |
|-------|-----|-------|
| **Primary** | `#1DDB82` | Buttons, accents, highlights, brand identity |
| **Primary dark** | `#0fa860` | Gradients, hover states, dark accents |
| **Primary light** | `#4AE99E` | Extension accent text, light highlights |

### Where brand color applies

- Mobile app: already uses `#1DDB82` via `colors.primary.main`
- Chrome extension popup + settings + options: must use `#1DDB82` (NOT `#667eea` purple, NOT `#7C3AED` purple)
- Landing pages: hero gradient, CTA buttons, accent elements
- Extension badge: `#1DDB82`
- Store listing screenshots: green accent, not purple

### Colors that are NOT brand colors

| Hex | What it was | Status |
|-----|-------------|--------|
| `#7C3AED` | Old extension purple | Deprecated. Remove everywhere. |
| `#667eea` / `#764ba2` | New extension purple/indigo gradient | **Must be replaced with green before any public launch.** |

---

## Style rules

### Grammar

| Rule | Choice |
|------|--------|
| Oxford comma | Yes: "groceries, gas, and dining" |
| Headings | Sentence case: "How it works" not "How It Works" |
| Contractions | Use them: "we'll," "you're," "don't" |
| Numbers | Numerals always in UI. Spell out one-nine in long-form copy. |
| Currency | $X.XX CAD for formal; $X.XX in UI (CAD implied by context) |
| Percent | Always use symbol: "5%" not "5 percent" |
| Em dash | Spaced: "your card — instantly" |
| Lists | No periods on fragments. Periods on full sentences. |

### Punctuation

- **Exclamation marks:** Maximum one per screen. Zero in headlines. Never double (!!).
- **Ellipsis:** Avoid. Use em dashes instead.
- **ALL CAPS:** Only for UI section labels (e.g., "BEST CARD TO USE"). Never in marketing copy.
- **Emoji:** Maximum one per screen in the app. Zero in formal copy (store listings, privacy policy). Allowed in Reddit/social posts.

### Formatting (marketing copy)

- Lead with the benefit, not the feature
- One idea per sentence
- Short paragraphs (1-3 sentences max)
- Use specific numbers: "410+ cards" not "hundreds of cards"
- Show, don't claim: "Amex Cobalt earns 5x at Loblaws" beats "amazing rewards"

---

## Channel-specific notes

### Mobile app (iOS/Android/Web)

- Primary tagline in home screen header
- Calm, helpful tone throughout
- Minimal emoji (one per screen max)
- All copy through i18n (`en.json` / `fr.json`) — no hardcoded English strings

### Chrome extension

- Same green brand color as app
- Same primary tagline
- Popup tone: brief, functional, helpful
- Landing page tone: slightly bolder for conversion, but still honest

### Chrome Web Store listing

- Lead with the primary tagline
- Use verified card/merchant counts (check Supabase before submission)
- No superlatives ("best," "first," "#1") without substantiation
- Include privacy messaging prominently

### Reddit / social

- Build-in-public tone: honest, transparent, community-first
- "I built this. Honest feedback welcome." not "Check out our amazing new product!"
- Never fake testimonials or astroturf
- Respect subreddit self-promo rules (read them before posting)

### French (fr.json)

- Localize, don't translate literally
- Have a native French speaker review all copy
- The primary tagline in French: "Trouvez la meilleure carte pour chaque achat"

---

## Legal guardrails

1. **No unsubstantiated superlatives** — don't say "best," "first," "#1," "only" without evidence
2. **Savings claims need math** — always show assumptions, use "up to," link methodology
3. **Testimonials must be real** — attributed, with permission, or clearly marked as examples
4. **Affiliate links need disclosure** — label as "Sponsored" or "Ad" per Competition Act
5. **Privacy claims must match architecture** — if you say "all data stored locally," verify it's true
6. **Comparative claims need facts** — "unlike X" must be verifiable and fair
7. **Financial disclaimers** — "Card details may change. Verify terms before applying." on any recommendation

---

## Quick reference card

Copy-paste these when you need them:

| Surface | Copy |
|---------|------|
| Primary tagline | Find the best card for every purchase |
| App subtitle (EN) | Find the best card for every purchase |
| App subtitle (FR) | Trouvez la meilleure carte pour chaque achat |
| Auth screen subtitle | Find the best card for every purchase |
| Meta description | Canada's credit card rewards optimizer — see which card earns the most at any store, instantly |
| Settings footer (EN) | Made for the Canadian rewards community |
| Settings footer (FR) | Fait pour maximiser chaque achat |
| README headline | Find the best card for every purchase. |
| Sage first mention | Sage, your AI rewards assistant |
| Sage subsequent | Sage |
| Paywall hero | See Every Reward You're Missing |
| Paywall subtitle | Unlimited recommendations, AI assistance, and wallet analysis |
| Extension popup tagline | Find the best card for every purchase |
| Landing page hero | Find the Best Card for Every Purchase |
| Chrome Web Store short | Find the best card for every purchase — smart recommendations for 410+ Canadian credit cards |

---

*Created 2026-04-12. Review and update quarterly, or when adding a new product surface.*
