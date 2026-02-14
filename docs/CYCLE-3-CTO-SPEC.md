# Cycle 3 — CTO Specification
## Smart Recommendations Engine
**Author:** Gandalf (CTO) | **Date:** Feb 13, 2026 | **Status:** Ready for VP Eng

---

## Overview
Three tightly integrated features that answer every question a Canadian has before getting a credit card. Together they form the "Smart Recommendations Engine" — the core value proposition that justifies paying for Rewardly.

**Goal:** Make Rewardly the app where you go BEFORE applying for any card.

---

## F21: Wallet Optimizer (Portfolio Builder)

### Problem
Users don't know which *combination* of cards maximizes their total rewards. Existing tools tell you "this card is good for groceries" but nobody answers "what 2-3 cards should I carry to cover ALL my spending optimally?"

### User Stories
- **US-21.1:** As a user, I want to input my monthly spending by category so the app can analyze my spending pattern
- **US-21.2:** As a user, I want to see the optimal 2-3 card combination for my spending so I can maximize total rewards
- **US-21.3:** As a user, I want to see how much I'd earn per year with the recommended wallet vs my current cards
- **US-21.4:** As a user, I want to adjust constraints (max annual fees, preferred banks, card count limit) so recommendations fit my needs
- **US-21.5:** As a user, I want to see a category-by-category breakdown showing which card covers which spending
- **US-21.6:** As a user, I want to save/share my optimized wallet result

### Requirements

#### Input
```
SpendingProfile {
  groceries: number       // Monthly $
  dining: number
  gas: number
  travel: number
  onlineShopping: number
  entertainment: number
  drugstores: number
  homeImprovement: number
  transit: number
  other: number
}

Constraints {
  maxTotalAnnualFees: number    // e.g., $300/yr max across all cards
  maxCards: number              // e.g., 2 or 3
  preferredBanks?: string[]    // e.g., ["TD", "RBC"]
  excludedCards?: string[]     // Cards user doesn't want
  country: 'CA' | 'US'
  preferredRewardType?: 'cashback' | 'points' | 'any'
}
```

#### Algorithm
1. Load all cards for user's country from DB
2. Generate all valid combinations of 2 and 3 cards (respecting constraints)
3. For each combo, calculate total annual rewards:
   - For each spending category, assign to the card with the highest reward rate
   - Convert points to CAD using `pointValuation`
   - Subtract total annual fees
   - Apply spending caps where applicable
4. Rank combinations by **net annual value** (rewards minus fees)
5. Return top 3 combinations with breakdown

#### Output
```
WalletResult {
  rank: number
  cards: Card[]
  totalAnnualRewards: number      // Before fees
  totalAnnualFees: number
  netAnnualValue: number          // Rewards - Fees
  categoryAssignment: {
    category: SpendingCategory
    bestCard: Card
    rewardRate: number
    annualRewards: number
  }[]
  vsCurrentWallet?: {             // If user has cards
    currentNetValue: number
    improvement: number           // $ more per year
    improvementPercent: number
  }
}
```

#### Performance
- Combination generation must complete in < 2 seconds
- With 354 cards, C(354,3) = ~7.4M combos — **need pruning**
- Pruning strategy: Pre-filter to top 15-20 cards per category, then combine
- Final candidate set should be < 5,000 combos

#### Tier Gating
- **Free:** Can run optimizer, sees top result with card names blurred after first card
- **Pro:** Full results, up to 3 combos
- **Max:** Full results, unlimited combos, affiliate links

### UI
- New screen: `WalletOptimizerScreen`
- Step 1: Spending input form (sliders or $ inputs per category)
- Step 2: Constraints (optional — collapsible "Advanced" section)
- Step 3: Results with animated reveal
- Each result card shows: card images, net value, category breakdown chart
- "Compare to My Wallet" button if user has cards

---

## F22: Signup Bonus ROI Calculator

### Problem
Signup bonuses are the biggest single reward event (~$300-$1000), but users don't know if they can realistically hit the minimum spend requirement or if the card is worth it after the bonus.

### User Stories
- **US-22.1:** As a user, I want to see the signup bonus value in dollars for any card so I know what I could earn
- **US-22.2:** As a user, I want to know if I can hit the minimum spend based on my spending so I can decide before applying
- **US-22.3:** As a user, I want to see a month-by-month timeline showing when I'll hit the minimum spend
- **US-22.4:** As a user, I want to see the total first-year value (signup bonus + ongoing rewards - annual fee) so I can compare cards
- **US-22.5:** As a user, I want to be warned if hitting the minimum spend requires unusual spending (overspending my normal pattern)

### Requirements

#### Input
Uses same `SpendingProfile` from F21 (shared input, calculate once)
Plus card-specific signup bonus data already in DB:
```
SignupBonus {
  amount: number           // Points/cashback amount
  minimumSpend: number     // $ required
  timeframeDays: number    // Days to hit min spend (usually 90)
  bonusType: RewardType
}
```

#### Calculations
1. **Monthly qualifying spend** = sum of all spending categories (everything counts toward min spend)
2. **Months to hit minimum** = ceil(minimumSpend / monthlyQualifyingSpend)
3. **Can hit?** = monthsToHit <= (timeframeDays / 30)
4. **Bonus value in CAD** = pointsToCad(amount, card, pointValuation)
5. **First year value** = bonusValue + (annualOngoingRewards) - annualFee
6. **Ongoing annual value** = annualOngoingRewards - annualFee (year 2+)
7. **Overspend warning** = if monthlyQualifyingSpend < (minimumSpend / (timeframeDays / 30)), flag it

#### Output
```
SignupBonusROI {
  card: Card
  bonusValueCAD: number
  minimumSpend: number
  timeframeDays: number
  monthlySpendNeeded: number       // To hit minimum on time
  userMonthlySpend: number         // From spending profile
  canHitMinimum: boolean
  monthsToHit: number
  timeline: {
    month: number
    cumulativeSpend: number
    hitTarget: boolean
  }[]
  firstYearValue: number           // Bonus + rewards - fee
  ongoingAnnualValue: number       // Year 2+ rewards - fee
  verdict: 'excellent' | 'good' | 'marginal' | 'not_worth_it'
  verdictReason: string
}
```

#### Verdict Logic
- **Excellent:** Can hit bonus easily (< 70% of timeframe), first year value > $500, ongoing value > $100
- **Good:** Can hit bonus (< 100% of timeframe), first year value > $200, ongoing value > $0
- **Marginal:** Can barely hit bonus, or first year value < $200, or ongoing value negative but bonus compensates
- **Not Worth It:** Can't hit minimum spend, or ongoing value deeply negative and bonus doesn't compensate

#### Tier Gating
- **Free:** See verdict + first year value for any card
- **Pro:** Full timeline + detailed breakdown
- **Max:** Side-by-side comparison of multiple signup bonuses

### UI
- Integrated into Card Detail screen as a new section "Signup Bonus Analysis"
- Also accessible from F21 Wallet Optimizer results ("See signup bonus details")
- Timeline visualization: progress bar or mini chart
- Traffic light verdict: 🟢 Excellent / 🟡 Good / 🟠 Marginal / 🔴 Not Worth It
- "Compare Signup Bonuses" button → compare up to 3 cards' signup offers

---

## F23: Annual Fee Breakeven Calculator

### Problem
Canadians are fee-averse. The #1 reason people avoid premium cards is "I don't want to pay an annual fee." But many premium cards pay for themselves 3x over with the right spending. Users need proof.

### User Stories
- **US-23.1:** As a user, I want to see the breakeven spending amount for any card with an annual fee so I know if it's worth it
- **US-23.2:** As a user, I want to compare a fee card vs the best no-fee alternative so I can see the real cost of NOT paying the fee
- **US-23.3:** As a user, I want to see my net gain/loss based on my actual spending so I have a clear answer
- **US-23.4:** As a user, I want to see breakeven by category (how much grocery/dining/gas spending justifies the fee)

### Requirements

#### Calculations
1. **Annual rewards earned** = Σ (category_spend × 12 × reward_rate × point_value)
2. **Net value** = annual_rewards - annual_fee
3. **Breakeven monthly spend** = annual_fee / (effective_reward_rate × 12)
   - Where effective_reward_rate = weighted average across user's spending categories
4. **vs No-Fee Alternative:**
   - Find best no-fee card for same spending profile
   - Fee card advantage = fee_card_rewards - no_fee_card_rewards - annual_fee
   - If positive: "The fee pays for itself and then some"
   - If negative: "The no-fee card is actually better for your spending"

#### Output
```
FeeBreakevenResult {
  card: Card
  annualFee: number
  annualRewardsEarned: number
  netValue: number                    // Rewards - Fee
  breakEvenMonthlySpend: number       // Total spend needed to justify fee
  userMonthlySpend: number
  exceedsBreakeven: boolean
  surplusOverBreakeven: number        // How much above breakeven (or deficit)
  
  categoryBreakdown: {
    category: SpendingCategory
    monthlySpend: number
    annualRewards: number
    percentOfFeeRecovered: number     // This category alone covers X% of fee
  }[]
  
  noFeeComparison?: {
    bestNoFeeCard: Card
    noFeeAnnualRewards: number
    feeCardAdvantage: number          // Can be negative
    verdict: string
  }
  
  verdict: 'easily_worth_it' | 'worth_it' | 'borderline' | 'not_worth_it'
  verdictReason: string
}
```

#### Verdict Logic
- **Easily Worth It:** Net value > 2× annual fee (rewards are 3x the fee)
- **Worth It:** Net value > 0 (rewards exceed fee)
- **Borderline:** Net value between -$20 and $0 (close, consider perks)
- **Not Worth It:** Net value < -$20 (fee not justified by rewards)

#### Tier Gating
- **Free:** See verdict + net value for any card
- **Pro:** Full category breakdown + no-fee comparison
- **Max:** Batch analysis of all fee cards in one view

### UI
- Integrated into Card Detail screen as "Fee Analysis" section (below or alongside F22)
- Visual: Donut chart showing fee recovered by category
- Comparison table: Fee card vs best no-fee alternative
- Clear verdict with $ amount: "✅ Worth it — you'd earn $220 more than the fee"

---

## Shared Infrastructure

### SpendingProfileService (NEW)
Central service that manages the user's spending profile, used by all 3 features:

```typescript
interface SpendingProfile {
  id: string
  userId: string
  groceries: number
  dining: number
  gas: number
  travel: number
  onlineShopping: number
  entertainment: number
  drugstores: number
  homeImprovement: number
  transit: number
  other: number
  updatedAt: Date
}

// Methods:
getSpendingProfile(): SpendingProfile
saveSpendingProfile(profile: SpendingProfile): void
getFromSpendingLog(): SpendingProfile  // Auto-calculate from SpendingLog data
```

- If user has SpendingLog data (F4), auto-populate from that
- If no data, show input form (used by F21, shared with F22/F23)
- Store locally (AsyncStorage) + optionally sync to Supabase for signed-in users

### Supabase Table
```sql
CREATE TABLE spending_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  groceries NUMERIC DEFAULT 0,
  dining NUMERIC DEFAULT 0,
  gas NUMERIC DEFAULT 0,
  travel NUMERIC DEFAULT 0,
  online_shopping NUMERIC DEFAULT 0,
  entertainment NUMERIC DEFAULT 0,
  drugstores NUMERIC DEFAULT 0,
  home_improvement NUMERIC DEFAULT 0,
  transit NUMERIC DEFAULT 0,
  other NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);
```

### Integration Points
- F21 results link to F22 (signup bonus) and F23 (fee breakeven) for each recommended card
- F22 and F23 appear on Card Detail screen
- All three share SpendingProfile input
- Sage AI can reference all three calculations in chat responses

---

## Estimated Scope
| Feature | Services | Screens | Tests | Hours |
|---------|----------|---------|-------|-------|
| F21 Wallet Optimizer | WalletOptimizerService | WalletOptimizerScreen | ~40 | 16 |
| F22 Signup ROI | SignupBonusService | Card Detail section | ~25 | 8 |
| F23 Fee Breakeven | FeeBreakevenService | Card Detail section | ~25 | 8 |
| Shared | SpendingProfileService | SpendingProfileForm | ~15 | 4 |
| **Total** | **4 new services** | **2 new screens + 2 sections** | **~105** | **36** |

---

## Build Order
1. **SpendingProfileService** — shared dependency, build first
2. **F23 Fee Breakeven** — simplest calculation, fastest to ship, immediate value
3. **F22 Signup ROI** — medium complexity, high impact
4. **F21 Wallet Optimizer** — most complex (combinatorial), biggest wow factor, ship last

---

## Success Metrics
- Users who run Wallet Optimizer → track conversion to card application
- Signup ROI: % of users who view bonus analysis before adding a card
- Fee Breakeven: reduction in "is this card worth the fee?" Sage questions (users self-serve)
- **North Star:** Paying users cite "it told me exactly which cards to get" as reason for subscribing

---

*Ready for VP Eng architecture review.*
