# Cycle 1 — Feature Batch
**Date:** Feb 13, 2026 | **Author:** Gandalf (CTO)
**Status:** In Development

## Competitive Context
**MaxRewards** (800K users, $9+/mo): Benefits consolidation, auto-offer activation, transaction categorization, credit scores, recurring charge tracker, spending trends.
**CardPointers** (5K+ cards): Multi-country, clean UI, SUB tracking, offer alerts.
**Gap:** Rewardly has AI (Sage) + AutoPilot — competitors don't. But we're missing core table-stakes features.

---

## 10 Features (Priority Order)

### F1: Card Benefits Dashboard
**What:** Display all card benefits (travel insurance, purchase protection, lounge access, extended warranty, rental insurance, price protection, cell phone protection) per card.
**Why:** MaxRewards charges premium for this. High perceived value, pure data — no API needed.
**Tier:** Pro+
**Screen:** New `CardBenefitsScreen.tsx` accessible from card detail view
**Data:** Add `benefits` field to card data model (JSON array of benefit objects: `{name, description, category, value}`)

### F2: Sign-Up Bonus (SUB) Tracker
**What:** Track spending progress toward sign-up bonus requirements. Progress bar showing "Spent $2,450 / $4,000 in 78/90 days — $1,550 left!"
**Why:** #1 requested feature in credit card communities. Direct revenue driver (users sign up for cards to track).
**Tier:** Free (hook feature — gets them to add cards)
**Screen:** New `SUBTrackerScreen.tsx` + widget on HomeScreen
**Data:** New `sub_tracking` table: `{user_id, card_id, target_amount, current_amount, start_date, deadline_date, bonus_description}`

### F3: Card Comparison Tool
**What:** Select 2-3 cards, see side-by-side comparison of: rewards by category, annual fee, sign-up bonus, key benefits, overall score.
**Why:** Helps users decide which card to apply for. Drives engagement + card discovery.
**Tier:** Free (2 cards), Pro+ (3 cards)
**Screen:** New `CardCompareScreen.tsx`
**Data:** Uses existing card data

### F4: Spending Log
**What:** Manual purchase logging. Input: amount, category, store, card used. Shows: rewards earned for this transaction, what the optimal card would have been, missed rewards.
**Why:** Foundation for analytics, card recommendations, and "missed rewards" feature. Also validates the optimizer.
**Tier:** Free (last 10), Pro+ (unlimited history)
**Screen:** New `SpendingLogScreen.tsx` + quick-add FAB on HomeScreen
**Data:** New `spending_log` table: `{user_id, amount, category, store, card_used, optimal_card, rewards_earned, rewards_missed, date}`

### F5: Recurring Subscriptions Optimizer
**What:** Input recurring charges (Netflix $15.99, Spotify $11.99, etc.). App shows which card to put each on for max rewards. Total monthly optimization amount.
**Why:** Set-it-and-forget-it value. Users optimize once, save every month. Strong retention driver.
**Tier:** Pro+
**Screen:** New `RecurringScreen.tsx`
**Data:** New `recurring_charges` table: `{user_id, name, amount, category, current_card, optimal_card, monthly_savings}`

### F6: Annual Fee Tracker
**What:** Dashboard showing all cards with annual fees, next renewal date, rewards earned vs fee paid. "Is this card worth keeping?" score. Alerts 30 days before renewal.
**Why:** Users forget fees and overpay. This builds trust and retention.
**Tier:** Pro+
**Screen:** New section in MyCards or standalone `AnnualFeeScreen.tsx`
**Data:** Add `annual_fee`, `fee_renewal_month` to card data. User tracking: `{user_id, card_id, card_open_date}`

### F7: Reward Redemption Guide
**What:** For each rewards program, show redemption options: transfer partners (with ratios), portal bookings, statement credits, gift cards. Show cents-per-point for each method.
**Why:** Points are worthless if redeemed poorly. This is the "after the purchase" value prop.
**Tier:** Max (premium content)
**Screen:** New `RedemptionGuideScreen.tsx` accessible from card detail
**Data:** Uses existing `redemption_options` from DB + enhance with transfer partner data

### F8: Card Recommendation Engine
**What:** Based on user's added cards and spending patterns, recommend new cards they should apply for. "Based on your grocery spending of $800/mo, the Amex Cobalt would earn you 5x = 4,000 pts/mo."
**Why:** This is the monetization play — affiliate links to card applications.
**Tier:** Pro+ (basic), Max (detailed with affiliate links)
**Screen:** New `CardRecommendationsScreen.tsx`
**Data:** Uses spending log + card DB to calculate opportunity gaps

### F9: Notifications Center
**What:** In-app notification hub. Notification types: bonus category activation reminder, annual fee approaching, SUB deadline alert, new card offer, monthly savings report ready.
**Why:** Drives daily app opens. Push notification foundation for mobile.
**Tier:** Free (basic), Pro+ (all types)
**Screen:** New `NotificationsScreen.tsx` + bell icon in header
**Data:** New `notifications` table: `{user_id, type, title, message, read, created_at, action_url}`

### F10: Monthly Savings Report
**What:** Auto-generated monthly report showing: total rewards earned, rewards missed, best performing card, worst performing card, category breakdown. Shareable as an image card.
**Why:** Viral growth mechanic (share on social) + proves ROI to user. Retention driver.
**Tier:** Pro+
**Screen:** New `SavingsReportScreen.tsx`
**Data:** Aggregates from spending log

---

## User Stories & Acceptance Criteria

### F1: Card Benefits Dashboard

**US-F1-1:** As a Pro user, I want to see all benefits of my cards in one place, so I know what protections I have.
- AC1: Each card detail view has a "Benefits" tab/section
- AC2: Benefits grouped by category (Travel, Purchase, Insurance, Lifestyle)
- AC3: Each benefit shows: name, description, coverage amount/details
- AC4: Free users see first 2 benefits + locked overlay for rest

### F2: SUB Tracker

**US-F2-1:** As a user, I want to track my progress toward sign-up bonuses, so I don't miss the deadline.
- AC1: SUB Tracker accessible from Home screen widget + dedicated screen
- AC2: Shows progress bar with amount spent / target amount
- AC3: Shows days remaining until deadline
- AC4: Can add/edit/delete SUB tracking entries
- AC5: Alert when within 7 days of deadline and under target

**US-F2-2:** As a user, I want to log spending toward a SUB, so I can track my progress.
- AC1: Quick-add button on SUB tracker
- AC2: Input amount + date
- AC3: Running total updates immediately

### F3: Card Comparison

**US-F3-1:** As a user, I want to compare cards side-by-side, so I can choose the best card.
- AC1: Can select 2 cards (Free) or 3 cards (Pro+) to compare
- AC2: Comparison shows: rewards by category, annual fee, SUB, benefits count, overall score
- AC3: Differences highlighted (green for winner, red for loser per category)
- AC4: Accessible from My Cards screen

### F4: Spending Log

**US-F4-1:** As a user, I want to log my purchases, so I can see my rewards earned.
- AC1: FAB button on HomeScreen to quick-add purchase
- AC2: Input: amount, category (auto-detect from store), store name, card used
- AC3: Shows: rewards earned on used card, what optimal card would have earned, difference
- AC4: Free: last 10 entries; Pro+: unlimited
- AC5: Purchase history screen with filters (by card, category, date range)

### F5: Recurring Subscriptions

**US-F5-1:** As a Pro user, I want to optimize my recurring charges, so I earn max rewards on autopay.
- AC1: Add subscription: name, amount, billing date, current card
- AC2: App shows optimal card for each subscription
- AC3: Total monthly optimization displayed ("Switch 3 subscriptions to save $4.20/mo in rewards")
- AC4: Common subscriptions pre-populated (Netflix, Spotify, etc.)

### F6: Annual Fee Tracker

**US-F6-1:** As a Pro user, I want to see if my card fees are worth the rewards, so I can cancel unused cards.
- AC1: Fee overview in My Cards showing all cards with fees
- AC2: For each card: annual fee, rewards earned (estimated), net value
- AC3: "Worth keeping?" badge (green/yellow/red)
- AC4: Days until next renewal
- AC5: In-app alert 30 days before fee renewal

### F7: Redemption Guide

**US-F7-1:** As a Max user, I want to see the best way to redeem my points, so I maximize their value.
- AC1: Each rewards program has a redemption guide accessible from card detail
- AC2: Shows redemption options: transfer partners, portal, statement credit, gift cards
- AC3: Cents-per-point calculation for each option
- AC4: Transfer partners show: airline/hotel name, transfer ratio, sweet spots

### F8: Card Recommendations

**US-F8-1:** As a Pro user, I want personalized card recommendations, so I know what to apply for next.
- AC1: Recommendation screen shows top 3-5 cards to apply for
- AC2: Each recommendation shows: why (based on spending), estimated annual rewards, sign-up bonus
- AC3: Recommendations update when spending log changes
- AC4: "Apply" button links to card application

### F9: Notifications Center

**US-F9-1:** As a user, I want a notification center, so I don't miss important card events.
- AC1: Bell icon in header with unread count badge
- AC2: Notification types: SUB deadline, fee renewal, bonus category, monthly report
- AC3: Tap notification navigates to relevant screen
- AC4: Mark as read / mark all as read
- AC5: Free: SUB + fee alerts only; Pro+: all types

### F10: Monthly Savings Report

**US-F10-1:** As a Pro user, I want a monthly report of my rewards, so I can see the value of optimizing.
- AC1: Auto-generated on 1st of each month
- AC2: Shows: total rewards earned, total rewards missed, top card, worst card
- AC3: Category breakdown chart
- AC4: "Share" button generates image card for social media
- AC5: Historical reports accessible (last 6 months)

---

## Implementation Order
Build in this order (dependencies):
1. **F1 Card Benefits** — pure data, no dependencies
2. **F2 SUB Tracker** — new table, standalone feature
3. **F3 Card Comparison** — uses existing data
4. **F4 Spending Log** — new table, foundation for F5/F8/F10
5. **F9 Notifications Center** — infrastructure for F6 alerts
6. **F5 Recurring Subscriptions** — depends on card data
7. **F6 Annual Fee Tracker** — uses notifications for alerts
8. **F7 Redemption Guide** — uses existing DB data
9. **F8 Card Recommendations** — depends on spending log (F4)
10. **F10 Monthly Savings Report** — depends on spending log (F4)

---
*Cycle 1 of continuous development loop. Next cycle starts after deploy.*
