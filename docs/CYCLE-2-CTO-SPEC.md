# Cycle 2 — CTO Specification
## Rewardly Feature Sprint | Feb 2026

**Author:** Gandalf (CTO)  
**Date:** February 13, 2026  
**Status:** Ready for VP Eng Architecture  
**Predecessor:** Cycle 1 (10 features, 674 tests, all green)

---

## Scope Decision

From the 10 researched features (F11-F20), I'm selecting **8 for Cycle 2** and deferring 2:

### ✅ Building (8 features)
| ID | Feature | Complexity | Why Now |
|----|---------|-----------|---------|
| F12 | Loyalty Points Aggregator | M | Canadian differentiator, no competitor has this |
| F14 | Receipt Scanner | M | Daily engagement, tangible value |
| F15 | Achievements & Badges | S | Gamification drives retention |
| F16 | 5/24 Application Tracker | S | Simple, high value for power users |
| F18 | Voice Commands (Siri/Google) | M | Invisible daily usage |
| F19 | Apple Wallet Passes | M | Native OS integration |
| F20 | Bill Payment Tracker | S | Universal pain point, easy win |
| F11 | Location-Based Recommendations | L | Simplified v1 — notification-based, not widget |

### ❌ Deferred
| ID | Feature | Why Defer |
|----|---------|-----------|
| F13 | Merchant Offer Auto-Enrollment | Requires bank portal integration/scraping — legal risk, massive infra |
| F17 | AR Store Scanner | Cool but low daily use, ARKit/ARCore complexity, Cycle 3 candidate |

---

## Feature Specifications

### F11: Location-Based Card Recommendations (Simplified V1)
**Goal:** When user is near a store, push notification with best card to use.

**V1 Scope (what we build now):**
- Background geofencing for top 50 Canadian chain merchants (Tim Hortons, Loblaws, Shoppers, Canadian Tire, etc.)
- Push notification: "You're near {store}. Use your {card} for {X}x points!"
- Merchant-to-category mapping (Tim Hortons → Dining, Shoppers → Groceries/Pharmacy)
- Settings: enable/disable, radius preference (100m/500m/1km)
- Uses Expo Location + Expo Notifications

**NOT in V1:** Lock screen widget, real-time map, offer integration

**Tier:** Pro  
**DB:** `merchant_locations` table (chain name, category, logo_url), `user_location_prefs` table

---

### F12: Loyalty Points Aggregator
**Goal:** Track all Canadian loyalty program balances + point valuations in one place.

**Scope:**
- Manual entry of loyalty program memberships (Aeroplan, PC Optimum, Scene+, Air Miles, RBC Avion Points, TD Rewards, Marriott Bonvoy, Hilton Honors)
- Pre-loaded point valuations in CAD (e.g., Aeroplan = ~$0.016/point, PC Optimum = ~$0.001/point)
- Dashboard showing total portfolio value in CAD
- Expiring points alerts (manual entry of expiry dates)
- Redemption value calculator ("Is it better to use 25K Aeroplan for a flight or transfer to hotel?")
- Transfer partner mapping (e.g., Amex MR → Aeroplan, Marriott → Aeroplan)

**NOT in V1:** Automatic balance sync (no APIs available), real-time flight/hotel search

**Tier:** Free (view balances), Pro (alerts + redemption optimizer + transfer suggestions)  
**DB:** `loyalty_programs` (predefined list), `user_loyalty_accounts` (user entries), `point_valuations` (admin-managed), `transfer_partners` (mapping table)

---

### F14: Receipt Scanner & Categorization
**Goal:** Scan receipts to verify correct card was used and track spending.

**Scope:**
- Camera capture using Expo Camera
- OCR processing via Supabase Edge Function (using Tesseract.js or Google Vision API)
- Extract: merchant name, total amount, date, payment method (last 4 digits)
- Match against user's cards — flag if wrong card was used
- "You paid $47.23 at Loblaws with TD Visa. Your PC Financial MC would have earned 3x points (45 pts vs 15 pts). Missed value: $0.48"
- Receipt archive with search
- Monthly "missed rewards" summary

**Tier:** Pro (basic scan + archive), Max (mismatch alerts + missed rewards calculator)  
**DB:** `receipts` table (user_id, merchant, amount, date, card_used, optimal_card, image_url, ocr_data)

---

### F15: Achievements & Badges System
**Goal:** Gamify the app to drive daily engagement and retention.

**Scope:**
- Badge categories: Savings milestones, streak (consecutive days using app), feature usage, card collection, points earned
- 20 predefined badges:
  - "Savings Starter" (save $10 in rewards), "Centurion" (save $100), "Rewards Master" ($1000)
  - "7-Day Streak", "30-Day Streak", "365-Day Streak"
  - "Card Collector" (5 cards), "Wallet King" (10 cards)
  - "Sage Whisperer" (10 Sage chats), "AutoPilot Ace" (enable AutoPilot)
  - "Points Baron" (10K points tracked), "Points Mogul" (100K)
  - "Scanner Pro" (10 receipts scanned), "Optimizer" (follow 5 recommendations)
  - "Night Owl" (use app after midnight), "Early Bird" (use app before 7am)
  - "Social Butterfly" (share an achievement), "Bug Hunter" (report a bug)
  - "OG Member" (account older than 1 year), "Referral Champion" (refer 3 friends)
- Progress tracking with percentage completion
- Achievement unlock animations (confetti/celebration)
- Share to social media (generate shareable image card)
- Weekly challenges: "Earn 2x at restaurants this week" — rotated automatically

**Tier:** Free (badges + basic challenges), Pro (weekly challenges + detailed progress)  
**DB:** `achievements` (definitions), `user_achievements` (progress + unlock date), `weekly_challenges` (auto-rotated)

---

### F16: Credit Card Application Tracker (5/24)
**Goal:** Track credit card applications and velocity limits.

**Scope:**
- Log card applications: date, issuer, card name, status (approved/denied/pending), credit limit
- Chase 5/24 rule: Count applications in last 24 months, show countdown
- Amex 2/90 rule: Track Amex-specific velocity
- Canadian rules: Track per-issuer patterns (BMO, RBC, TD, CIBC, Scotiabank)
- Hard pull tracker with credit bureau (Equifax/TransUnion)
- "Ready to apply" alerts when velocity limits clear
- Application success rate by issuer
- Timeline visualization

**Tier:** Pro  
**DB:** `card_applications` (user_id, issuer, card_name, date, status, credit_limit, hard_pull_bureau)

---

### F18: Voice Commands (Siri/Google Assistant)
**Goal:** Hands-free card recommendations and balance checks.

**Scope:**
- Siri Shortcuts integration via Expo:
  - "Best card for groceries" → returns top card with multiplier
  - "My Aeroplan balance" → returns loyalty balance (from F12)
  - "Total rewards this month" → monthly savings summary
- Pre-configured shortcut suggestions in Settings
- In-app voice command (microphone button on home screen)
- Uses expo-speech for TTS responses within app
- Siri Shortcut donation (suggest shortcuts based on usage patterns)

**Tier:** Pro  
**DB:** No new tables (queries existing data)

---

### F19: Apple Wallet Passes
**Goal:** Add Rewardly cards to Apple Wallet for instant access at checkout.

**Scope:**
- Generate .pkpass files for each credit card in user's wallet
- Pass shows: card name, best category this month, current rewards rate
- Location-triggered pass notifications (when near relevant merchant)
- Supabase Edge Function generates passes using `passkit-generator`
- Update passes when card recommendations change (push updates)
- Google Wallet support (secondary, similar flow)

**Tier:** Free (static passes), Pro (dynamic updates + location triggers)  
**DB:** `wallet_passes` (user_id, card_id, pass_serial, device_token, last_updated)

---

### F20: Bill Payment Tracker & Reminders
**Goal:** Never miss a credit card payment, track all due dates.

**Scope:**
- Add bill due dates for each card (manual entry)
- Payment reminders: push notification X days before due (configurable: 1, 3, 5, 7 days)
- Minimum payment vs full payment tracking
- Autopay status indicator (manual toggle)
- Interest cost calculator: "If you carry $2,000 balance on RBC Visa (19.99% APR), you'll pay $33.32 in interest this month"
- Payment history log
- Calendar view of all upcoming payments
- Late payment impact warning: "Missing this payment could cost you X in interest + affect credit score"

**Tier:** Free (manual tracking), Pro (smart reminders + interest calculator)  
**DB:** `bill_schedules` (user_id, card_id, due_day, reminder_days_before, autopay, min_payment), `payment_history` (user_id, card_id, date, amount, type)

---

## Database Migration

Single migration file: `017_cycle2_features.sql`

All tables follow existing patterns:
- RLS policies per user
- `user_id` references `auth.users(id)` with CASCADE
- Timestamps: `created_at`, `updated_at`
- Soft delete where appropriate

Seed data needed:
- 8 loyalty programs with valuations (F12)
- 50 merchant locations with categories (F11)
- 20 achievement definitions (F15)
- Transfer partner mappings (F12)

---

## Implementation Order

**Batch 1 (Simple — start here):**
1. F16: Application Tracker (S) — pure CRUD + rules engine
2. F20: Bill Payment Tracker (S) — CRUD + notifications
3. F15: Achievements (S) — event-driven badge system

**Batch 2 (Medium):**
4. F12: Loyalty Aggregator (M) — data model + valuation engine
5. F14: Receipt Scanner (M) — camera + OCR edge function

**Batch 3 (Complex):**
6. F18: Voice Commands (M) — Siri/Google integration
7. F19: Apple Wallet (M) — passkit generation
8. F11: Location Recommendations (L) — geofencing + notifications

---

## Integration Points with Existing Features

- **F15 (Achievements)** triggers from: Sage chat count, AutoPilot enable, card add, spending log, receipt scan
- **F12 (Loyalty)** feeds into: Sage AI (point valuation questions), Monthly Savings Report
- **F14 (Receipt Scanner)** feeds into: Spending Log (F4), Insights Dashboard, missed rewards calculation
- **F20 (Bill Tracker)** feeds into: Notifications (F9), Calendar view
- **F11 (Location)** uses: card data, category multipliers from RewardsCalculator

---

## Testing Requirements

- Each feature: minimum 40 unit tests (service layer)
- Integration tests for DB operations
- Edge function tests for OCR (F14) and passkit (F19)
- Target: 500+ new tests → total ~1,170 tests

---

## Success Criteria

- All 8 features functional with tests passing
- Deployed to Vercel + mobile builds
- No regression in existing 674 tests
- Each feature properly tier-gated
- Seed data loaded for loyalty programs, merchants, achievements

---

*Ready for VP Eng architecture review → then Sonnet dev + QA pipeline.*
