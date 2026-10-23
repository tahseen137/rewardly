# Rewardly Cycle 2 Features
## Product Research & Roadmap

**Research Date:** February 13, 2026  
**Competitors Analyzed:** MaxRewards, CardPointers, SaveSage, CRED, Kudos  
**Market Focus:** Canada (CA) with US support  
**Methodology:** Competitive analysis, app store reviews, feature gap identification

---

## Executive Summary

Cycle 2 focuses on **daily engagement drivers** and **premium tier justification**. Based on competitor analysis, the features below prioritize:
- Location-aware experiences (daily touchpoints)
- Canadian loyalty program integration (market differentiation)
- Automation that saves mental energy (stickiness)
- Social/gamification elements (retention)
- Premium features that justify $5.99/mo (Pro) and $12.99/mo (Max) tiers

---

## Feature Roadmap (F11-F20)

### F11: Location-Based Card Recommendations (AutoPilot)
**Description:** Real-time geofence-based card suggestions displayed on lock screen/widget when user approaches a store. Surfaces best card for that merchant + active offers without opening the app. Inspired by CardPointers' AutoPilot feature.

**Tier:** Pro  
**Competitor Reference:** CardPointers (AutoPilot), MaxRewards (Best Card by Location)  
**Priority:** P0 (flagship engagement driver)  
**Complexity:** L (requires background location, geofencing, merchant database)  
**Canadian Market Value:** ⭐⭐⭐⭐⭐ (Works with Canadian chains: Loblaws, Shoppers Drug Mart, Tim Hortons, etc.)

**Why it drives retention:** Users check the widget/lock screen 20+ times daily. Becomes habitual before every purchase.

---

### F12: Loyalty Points Aggregator
**Description:** Integrate and track balances for Canadian loyalty programs (Aeroplan, Scene+, PC Optimum, RBC Avion, TD Rewards, Marriott Bonvoy, etc.) in one dashboard. Show point valuations in CAD and suggest optimal redemption strategies. Display expiring points with alerts.

**Tier:** Free (view-only), Pro (alerts + redemption optimizer), Max (transfer partner suggestions)  
**Competitor Reference:** None (gap in market — most apps ignore loyalty programs)  
**Priority:** P0 (Canadian market differentiator)  
**Complexity:** M (requires API integrations or web scraping + manual input fallback)  
**Canadian Market Value:** ⭐⭐⭐⭐⭐ (Aeroplan, PC Optimum, Scene+ are household names)

**Why it drives retention:** 73% of Canadians belong to at least one loyalty program. Consolidating these creates daily check-in behavior.

---

### F13: Merchant Offer Auto-Enrollment
**Description:** Automatically add and activate all available card offers from Amex, Chase, BMO, CIBC, RBC, TD, Scotiabank without requiring manual login. Show map of nearby merchants with active offers. Track offer usage to the dollar.

**Tier:** Max  
**Competitor Reference:** MaxRewards (Auto-Activation), CardPointers (Auto-Add Offers)  
**Priority:** P0 (premium tier anchor)  
**Complexity:** L (requires bank portal integration, offer scraping, legal compliance)  
**Canadian Market Value:** ⭐⭐⭐⭐ (Canadian banks offer fewer digital offers than US, but BMO/RBC/Amex have programs)

**Why it drives retention:** Users save $200-500/year passively. High perceived value justifies Max tier pricing.

---

### F14: Smart Receipt Scanner & Categorization
**Description:** Scan receipts to auto-categorize purchases, verify bonus category earnings, and flag mismatches (e.g., "You paid with Visa but your Amex offers 5x at this store"). Build a searchable receipt archive with OCR. Suggest better card choices retroactively.

**Tier:** Pro (basic scanning), Max (mismatch alerts + retroactive suggestions)  
**Competitor Reference:** MaxRewards Platinum (receipt management), CRED (hidden fees detection)  
**Priority:** P1  
**Complexity:** M (OCR, merchant database matching, ML for categorization)  
**Canadian Market Value:** ⭐⭐⭐⭐ (Universal pain point — works equally well in Canada)

**Why it drives retention:** Turns Rewardly into financial record-keeper. Users open app after every purchase to scan.

---

### F15: Social Rewards Leaderboard & Achievements
**Description:** Opt-in gamified leaderboard showing who earned the most points/cashback this month among friends or community. Unlock badges for milestones (e.g., "Aeroplan Master: 100K points earned"). Share achievements to social media. Weekly challenges (e.g., "Earn 5x bonus at gas stations this week").

**Tier:** Free (view leaderboard), Pro (weekly challenges + custom goals)  
**Competitor Reference:** CRED (gamification/exclusivity), Kudos (Boosts with partner brands)  
**Priority:** P2  
**Complexity:** S (leaderboard logic, badge system, social sharing integration)  
**Canadian Market Value:** ⭐⭐⭐ (Nice-to-have but not critical for Canadian market)

**Why it drives retention:** Social proof + FOMO drives daily check-ins. Younger demographics (Gen Z/Millennial) respond well to gamification.

---

### F16: Credit Card 5/24 & Application Tracker
**Description:** Track credit card application dates to monitor Chase 5/24 rule, Amex 2/90 rule, and other issuer velocity limits. Get alerts when eligible to apply for new cards. Log hard pulls, approval/denial status, and credit limit changes. Canada-specific: Track BMO/CIBC/TD approval patterns.

**Tier:** Pro  
**Competitor Reference:** CardPointers (5/24 tracker)  
**Priority:** P1  
**Complexity:** S (simple date tracking + rules engine)  
**Canadian Market Value:** ⭐⭐⭐⭐ (Canadian churners need this — fewer cards than US but still valuable)

**Why it drives retention:** Appeals to power users who churn cards. They check monthly to plan next application.

---

### F17: Augmented Reality Store Scanner
**Description:** Point phone camera at a store sign and see AR overlay showing: best card to use, active offers, potential cashback, and loyalty points earning rate. Works offline after initial merchant database download.

**Tier:** Max  
**Competitor Reference:** CardPointers (AR feature)  
**Priority:** P2  
**Complexity:** M (ARKit/ARCore integration, merchant logo recognition)  
**Canadian Market Value:** ⭐⭐⭐ (Cool factor but not essential — works in Canada same as US)

**Why it drives retention:** High wow factor for demos. Low daily usage but increases app stickiness through novelty.

---

### F18: Siri/Google Assistant Voice Commands
**Description:** "Hey Siri, which card should I use at Loblaws?" "Hey Google, what's my Aeroplan balance?" Voice-activated card recommendations, balance checks, and payment reminders. Integration with iOS Shortcuts and Google Assistant routines.

**Tier:** Pro  
**Competitor Reference:** CardPointers (Siri integration)  
**Priority:** P1  
**Complexity:** M (voice intent handling, natural language processing)  
**Canadian Market Value:** ⭐⭐⭐⭐ (Canadians use voice assistants at similar rates to US)

**Why it drives retention:** Voice commands create "invisible" daily usage. Users don't need to open app to get value.

---

### F19: Apple Wallet Card Passes (Dynamic)
**Description:** Add digital passes to Apple Wallet that auto-update with current best card recommendation based on location. Passes show QR code for loyalty programs (PC Optimum, Scene+) + reminder which credit card to pair with it. Lock screen notifications when near relevant merchant.

**Tier:** Free (static passes), Pro (dynamic location-based updates)  
**Competitor Reference:** CardPointers (Apple Wallet integration)  
**Priority:** P1  
**Complexity:** M (Apple Wallet API, geofencing, pass updates)  
**Canadian Market Value:** ⭐⭐⭐⭐⭐ (iPhone penetration is 60%+ in Canada — very high)

**Why it drives retention:** Integrates into native OS workflow. Users see Rewardly branding every time they access Apple Wallet.

---

### F20: Bill Payment Integration & Reminders
**Description:** Track all credit card bills in one dashboard. Set up payment reminders with custom lead times (e.g., "Remind me 3 days before TD Aeroplan Visa due date"). Show autopay status for each card. Canada-specific: Support for EFT/Interac payments to Canadian banks.

**Tier:** Free (manual tracking), Pro (smart reminders + autopay detection)  
**Competitor Reference:** MaxRewards (Bills tracking), CRED (payment reminders)  
**Priority:** P1  
**Complexity:** S (aggregation from existing bank connections, reminder scheduling)  
**Canadian Market Value:** ⭐⭐⭐⭐ (Universal pain point — Canadians manage 2-3 credit cards on average)

**Why it drives retention:** Users open app monthly for bill tracking. Reduces late fees (tangible value).

---

## Tier Assignment Strategy

### Free Tier
- F12 (view-only loyalty balances)
- F15 (view leaderboard)
- F19 (static Apple Wallet passes)
- F20 (manual bill tracking)

### Pro Tier ($5.99/mo) — "Daily Engagement"
- F11 (AutoPilot location recommendations)
- F12 (full loyalty optimizer)
- F14 (receipt scanner basic)
- F16 (5/24 tracker)
- F18 (voice commands)
- F19 (dynamic Wallet passes)
- F20 (smart bill reminders)

### Max Tier ($12.99/mo) — "Automation & Power Users"
- F13 (auto-enroll merchant offers) — **flagship feature**
- F14 (advanced receipt insights)
- F17 (AR scanner)

---

## Implementation Sequence

**Phase 1 (P0 features — ship first):**
1. F11 (AutoPilot) — biggest engagement driver
2. F12 (Loyalty aggregator) — Canadian differentiator
3. F13 (Offer auto-enrollment) — Max tier anchor

**Phase 2 (P1 features — ship next quarter):**
4. F16 (5/24 tracker)
5. F18 (Voice commands)
6. F19 (Apple Wallet passes)
7. F20 (Bill reminders)
8. F14 (Receipt scanner)

**Phase 3 (P2 features — evaluate post-launch):**
9. F15 (Leaderboard)
10. F17 (AR scanner)

---

## Canadian Market Specifics

**Critical Canadian integrations:**
- **Loyalty Programs:** Aeroplan, PC Optimum, Scene+, RBC Avion, TD Rewards, Air Miles, Marriott Bonvoy Canada, Hilton Honors Canada
- **Banks:** RBC, TD, BMO, Scotiabank, CIBC, Tangerine, Simplii, Desjardins (Quebec)
- **Merchants:** Loblaws/Shoppers Drug Mart (PC Optimum), Cineplex (Scene+), Tim Hortons, Canadian Tire, Metro, Sobeys
- **Payment Rails:** Interac e-Transfer for bill payments, Interac Debit

**Regulatory Considerations:**
- PIPEDA compliance for data privacy
- French language support (Quebec — 23% of population)
- PST/GST/HST handling in transaction categorization

---

## Competitive Gaps Rewardly Will Fill

| Feature | MaxRewards | CardPointers | CRED | Kudos | Rewardly Cycle 2 |
|---------|------------|--------------|------|-------|------------------|
| Canadian loyalty programs | ❌ | ❌ | ❌ | ❌ | ✅ F12 |
| Location-based AutoPilot | ✅ | ✅ | ❌ | ❌ | ✅ F11 |
| Auto-enroll offers | ✅ | ✅ | ❌ | ❌ | ✅ F13 |
| Receipt scanning | ✅ (Platinum) | ❌ | ❌ | ❌ | ✅ F14 |
| Voice assistant | ❌ | ✅ | ❌ | ❌ | ✅ F18 |
| Apple Wallet passes | ❌ | ✅ | ❌ | ❌ | ✅ F19 |
| 5/24 tracking | ❌ | ✅ | ❌ | ❌ | ✅ F16 |
| Gamification | ❌ | ❌ | ✅ | ✅ | ✅ F15 |
| AR scanning | ❌ | ✅ | ❌ | ❌ | ✅ F17 |
| Bill payment tracking | ✅ | ❌ | ✅ | ❌ | ✅ F20 |

---

## Success Metrics

**Free → Pro conversion targets:**
- F11 (AutoPilot): 35% of users who enable location services upgrade to Pro within 30 days
- F12 (Loyalty): 25% of users who link 2+ loyalty programs upgrade to Pro

**Pro → Max conversion targets:**
- F13 (Offer auto-enrollment): 40% of Pro users upgrade to Max after seeing "$347 saved via auto-enrolled offers" messaging

**Daily Active Users (DAU) lift:**
- F11 (AutoPilot): +60% DAU (lock screen widget checks)
- F19 (Apple Wallet): +40% DAU (wallet interactions)

**Retention (D30):**
- Target: 70% retention by end of Cycle 2 (vs. 55% baseline)

---

## Next Steps

1. **Technical feasibility assessment** for F11, F12, F13 (P0 features)
2. **Canadian loyalty program API research** (Aeroplan, PC Optimum, Scene+)
3. **Legal review** for merchant offer auto-enrollment (F13)
4. **Design mockups** for AutoPilot lock screen widget (F11)
5. **Pricing model validation** with beta users ($5.99 Pro vs. $12.99 Max)

---

**Document Owner:** Product Research Team  
**Last Updated:** February 13, 2026  
**Next Review:** Post-Cycle 2 feature launch (Q3 2026)
