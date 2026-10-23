# Cycle 4 — CTO Specification
## CSV Statement Upload + Spending Insights Dashboard
**Author:** Gandalf (CTO) | **Date:** Feb 13, 2026 | **Status:** Ready for VP Eng

---

## Overview
Layer 1 of the data strategy. Users upload their credit card CSV statements from Canadian banks. We parse, categorize, and analyze their spending to power all recommendation features with REAL data instead of estimates.

**Goal:** "Upload your statement. We'll tell you exactly how much you're leaving on the table."

---

## F24: CSV Statement Parser

### Problem
The Spending Profile estimate quiz (Cycle 3) gives ballpark numbers. But real card recommendations need real transaction data. Every Canadian bank lets you download CSV statements — we parse them automatically.

### Supported Banks (Priority Order)
1. **TD Canada Trust** — largest bank
2. **RBC Royal Bank** — second largest
3. **CIBC** — third largest
4. **Scotiabank** — fourth largest
5. **BMO** — fifth largest
6. **Tangerine** — popular online bank
7. **PC Financial** — popular no-fee
8. **Amex Canada** — premium card issuer

### Bank CSV Formats

#### TD Canada Trust
```csv
MM/DD/YYYY,Description,Debit Amount,Credit Amount,Balance
01/15/2026,LOBLAWS #1234 TORONTO ON,85.23,,1234.56
01/15/2026,PAYMENT - THANK YOU,,500.00,1734.56
```
- Columns: Date, Description, Debit, Credit, Balance
- Date format: MM/DD/YYYY
- Debits and credits in separate columns
- Balance column present

#### RBC Royal Bank
```csv
Account Type,Account Number,Transaction Date,Cheque Number,Description 1,Description 2,CAD$,USD$
Visa,1234567890,01/15/2026,,LOBLAWS #1234,,85.23,
```
- Columns: Account Type, Account Number, Transaction Date, Cheque Number, Description 1, Description 2, CAD$, USD$
- Date format: MM/DD/YYYY
- Two description fields
- Separate CAD/USD columns

#### CIBC
```csv
01/15/2026,LOBLAWS #1234 TORONTO ON,85.23,
01/15/2026,PAYMENT RECEIVED,,500.00
```
- Columns: Date, Description, Debit, Credit
- Date format: MM/DD/YYYY
- No header row (!) — must auto-detect
- Simple 4-column format

#### Scotiabank
```csv
1/15/2026,LOBLAWS #1234 TORONTO ON,-85.23
1/15/2026,PAYMENT RECEIVED,500.00
```
- Columns: Date, Description, Amount
- Date format: M/DD/YYYY (no leading zero)
- Single amount column — negative = debit, positive = credit

#### BMO
```csv
Item #,Card #,Transaction Date,Posting Date,Transaction Amount,Description
1,1234********5678,20260115,20260116,85.23,LOBLAWS #1234 TORONTO ON
```
- Columns: Item #, Card #, Transaction Date, Posting Date, Amount, Description
- Date format: YYYYMMDD
- Card number partially masked

#### Tangerine
```csv
Date,Transaction,Name,Memo,Amount
1/15/2026,DEBIT,LOBLAWS #1234,,−85.23
```
- Columns: Date, Transaction, Name, Memo, Amount
- Date format: M/DD/YYYY
- Uses Unicode minus sign (−) not ASCII hyphen (-)

#### Amex Canada
```csv
01/15/2026,,LOBLAWS #1234 TORONTO ON,85.23,,
```
- Columns: Date, Reference, Description, Amount, (extra columns vary)
- Date format: MM/DD/YYYY
- Multiple extra columns that vary by card type

### User Stories
- **US-24.1:** As a user, I want to upload a CSV file from my bank so my spending is analyzed automatically
- **US-24.2:** As a user, I want the app to auto-detect which bank the CSV is from so I don't have to specify
- **US-24.3:** As a user, I want transactions automatically categorized (groceries, dining, gas, etc.)
- **US-24.4:** As a user, I want to review and correct mis-categorized transactions
- **US-24.5:** As a user, I want my spending profile updated automatically from the parsed data
- **US-24.6:** As a user, I want to upload multiple statements (different cards/months) for a complete picture
- **US-24.7:** As a user, I want my uploaded data stored securely and never shared

### Requirements

#### Auto-Detection Algorithm
1. Check for header row — if present, match column names to known bank patterns
2. If no header (CIBC), check column count and date format
3. Validate date parsing against known formats
4. Confidence score: must be > 80% to auto-detect, else ask user to select bank

#### Transaction Categorization
Use merchant name pattern matching (similar to existing `MERCHANT_CATEGORY_MAP` in BestCardRecommendationService):

```typescript
interface MerchantPattern {
  pattern: RegExp
  category: SpendingCategory
  merchantName: string  // Normalized name
}

// Example patterns
const PATTERNS: MerchantPattern[] = [
  // Groceries
  { pattern: /loblaws|no frills|superstore|rcss/i, category: 'groceries', merchantName: 'Loblaws' },
  { pattern: /metro\s/i, category: 'groceries', merchantName: 'Metro' },
  { pattern: /sobeys|safeway|freshco/i, category: 'groceries', merchantName: 'Sobeys' },
  { pattern: /walmart\s+sup/i, category: 'groceries', merchantName: 'Walmart' },
  { pattern: /costco\s+who/i, category: 'groceries', merchantName: 'Costco' },
  { pattern: /t\s*&\s*t|t\s+and\s+t/i, category: 'groceries', merchantName: 'T&T' },
  { pattern: /food\s+basics/i, category: 'groceries', merchantName: 'Food Basics' },
  { pattern: /farm\s+boy/i, category: 'groceries', merchantName: 'Farm Boy' },
  
  // Dining
  { pattern: /starbucks/i, category: 'dining', merchantName: 'Starbucks' },
  { pattern: /tim\s+horton|tims/i, category: 'dining', merchantName: 'Tim Hortons' },
  { pattern: /mcdonald/i, category: 'dining', merchantName: "McDonald's" },
  { pattern: /skip\s*the\s*dish|skipthedish/i, category: 'dining', merchantName: 'SkipTheDishes' },
  { pattern: /uber\s+eat/i, category: 'dining', merchantName: 'Uber Eats' },
  { pattern: /doordash/i, category: 'dining', merchantName: 'DoorDash' },
  { pattern: /a\s*&\s*w\s/i, category: 'dining', merchantName: 'A&W' },
  { pattern: /subway/i, category: 'dining', merchantName: 'Subway' },
  { pattern: /popeye/i, category: 'dining', merchantName: 'Popeyes' },
  { pattern: /restaurant|resto|bistro|cafe|grill|pizza|sushi|thai|diner/i, category: 'dining', merchantName: 'Restaurant' },
  
  // Gas
  { pattern: /esso|exxon/i, category: 'gas', merchantName: 'Esso' },
  { pattern: /shell/i, category: 'gas', merchantName: 'Shell' },
  { pattern: /petro[\s-]*can/i, category: 'gas', merchantName: 'Petro-Canada' },
  { pattern: /canadian\s+tire\s+gas|ct\s+gas/i, category: 'gas', merchantName: 'Canadian Tire Gas' },
  { pattern: /husky/i, category: 'gas', merchantName: 'Husky' },
  { pattern: /pioneer\s/i, category: 'gas', merchantName: 'Pioneer' },
  { pattern: /ultramar/i, category: 'gas', merchantName: 'Ultramar' },
  
  // Transit
  { pattern: /presto|ttc|metrolinx|go\s+transit|oct\s+transpo|stm\s/i, category: 'transit', merchantName: 'Transit' },
  { pattern: /uber(?!\s+eat)/i, category: 'transit', merchantName: 'Uber' },
  { pattern: /lyft/i, category: 'transit', merchantName: 'Lyft' },
  
  // Online Shopping
  { pattern: /amazon|amzn/i, category: 'online_shopping', merchantName: 'Amazon' },
  { pattern: /apple\.com|itunes/i, category: 'online_shopping', merchantName: 'Apple' },
  { pattern: /google\s*\*/i, category: 'online_shopping', merchantName: 'Google' },
  
  // Drugstores
  { pattern: /shoppers\s+drug|sdm/i, category: 'drugstores', merchantName: 'Shoppers Drug Mart' },
  { pattern: /rexall/i, category: 'drugstores', merchantName: 'Rexall' },
  { pattern: /pharma/i, category: 'drugstores', merchantName: 'Pharmacy' },
  
  // Entertainment
  { pattern: /netflix/i, category: 'entertainment', merchantName: 'Netflix' },
  { pattern: /spotify/i, category: 'entertainment', merchantName: 'Spotify' },
  { pattern: /cineplex/i, category: 'entertainment', merchantName: 'Cineplex' },
  { pattern: /disney/i, category: 'entertainment', merchantName: 'Disney+' },
  
  // Home Improvement
  { pattern: /canadian\s+tire(?!\s+gas)/i, category: 'home_improvement', merchantName: 'Canadian Tire' },
  { pattern: /home\s+depot/i, category: 'home_improvement', merchantName: 'Home Depot' },
  { pattern: /lowe|rona/i, category: 'home_improvement', merchantName: 'Lowes/RONA' },
  { pattern: /home\s+hardware/i, category: 'home_improvement', merchantName: 'Home Hardware' },
  
  // Travel
  { pattern: /air\s+canada|westjet|porter|flair/i, category: 'travel', merchantName: 'Airline' },
  { pattern: /hotel|marriott|hilton|hyatt|airbnb/i, category: 'travel', merchantName: 'Hotel/Lodging' },
  { pattern: /booking\.com|expedia/i, category: 'travel', merchantName: 'Travel Booking' },
];
```

Uncategorized transactions → `SpendingCategory.OTHER` + flag for user review.

#### Data Model
```typescript
interface ParsedTransaction {
  id: string
  date: Date
  description: string           // Raw from CSV
  normalizedMerchant: string    // Cleaned merchant name
  amount: number                // Always positive for purchases
  isCredit: boolean             // true = payment/refund, false = purchase
  category: SpendingCategory
  categoryConfidence: 'high' | 'medium' | 'low'  // Pattern match confidence
  userCorrected: boolean        // true if user manually changed category
  sourceBank: string            // Which bank this came from
  cardLast4?: string            // If available from CSV
}

interface StatementUpload {
  id: string
  userId: string
  fileName: string
  bank: string
  uploadDate: Date
  periodStart: Date
  periodEnd: Date
  transactionCount: number
  totalSpend: number
  transactions: ParsedTransaction[]
}
```

#### Tier Gating
- **Free:** Upload 1 statement/month, see basic category breakdown
- **Pro:** Upload unlimited statements, full insights, historical trends
- **Max:** Everything + multi-card portfolio analysis + "money left on table" report

### UI
- **Upload screen:** File picker (DocumentPicker for mobile, `<input type="file">` for web)
- **Review screen:** Table of parsed transactions with category pills, tap to re-categorize
- **Confirmation:** "We found 47 transactions totaling $2,340. Category breakdown: [chart]"
- **Auto-update:** After confirmation, update SpendingProfile with real averages

---

## F25: Spending Insights Dashboard

### Problem
Raw transaction data is just numbers. Users need actionable insights: "Where am I wasting rewards? What trends should I know about? Am I on track?"

### User Stories
- **US-25.1:** As a user, I want to see my monthly spending breakdown by category
- **US-25.2:** As a user, I want to see how much rewards I'm earning vs how much I could be earning
- **US-25.3:** As a user, I want to see spending trends over time (month-over-month)
- **US-25.4:** As a user, I want to know my top merchants and how often I shop there
- **US-25.5:** As a user, I want an "Optimization Score" that tells me how well I'm using my cards
- **US-25.6:** As a user, I want smart alerts ("You're spending 30% more on dining this month")

### Insights Engine

#### 1. Category Breakdown
```typescript
interface CategoryBreakdown {
  category: SpendingCategory
  totalSpend: number
  transactionCount: number
  percentOfTotal: number
  topMerchants: { name: string; amount: number; count: number }[]
  currentCard: Card | null           // Which card they used (if known)
  optimalCard: Card                  // Which card they SHOULD use
  rewardsEarned: number             // What they got
  rewardsPossible: number           // What they could get
  rewardsGap: number                // Money left on the table
}
```

#### 2. Optimization Score (0-100)
```
Score = (actualRewardsEarned / maxPossibleRewards) × 100

90-100: "Rewards Master 🏆" — you're optimizing like a pro
70-89:  "Good Optimizer 👍" — room for improvement
50-69:  "Average User 📊" — leaving significant money on the table  
0-49:   "Needs Help 🎯" — we can save you serious money
```

#### 3. Trend Analysis
```typescript
interface SpendingTrend {
  category: SpendingCategory
  currentMonth: number
  previousMonth: number
  changePercent: number
  direction: 'up' | 'down' | 'stable'
  alert?: string  // "Dining spend up 30% — consider switching to Amex Cobalt"
}
```

#### 4. Smart Alerts
Generated from trend analysis + card portfolio:
- "Your grocery spend is $580/mo. Switch from TD (1%) to Amex Cobalt (5%) to earn $278 more per year"
- "You've hit 80% of your Scotiabank Momentum grocery cap ($20K/$25K). Plan to switch after March."
- "Your dining spend dropped 40%. Consider downgrading from your premium dining card to save the $120 fee."
- "New: Tim Hortons now counts as dining on Amex Cobalt. You spend $45/mo there — an extra $21.60/yr"

### UI
- **Dashboard screen:** Main insights view with cards/tiles
- **Category donut chart:** Visual breakdown of spending
- **"Money Left on Table" hero metric:** Big number at the top showing total rewards gap
- **Trend arrows:** Per-category month-over-month indicators
- **Alert cards:** Smart suggestions in a scrollable feed
- **Optimization Score:** Prominent gauge/dial widget

### Tier Gating
- **Free:** Basic category breakdown (no card optimization analysis)
- **Pro:** Full insights + optimization score + basic alerts
- **Max:** Trend analysis + smart alerts + historical data + "money left on table" report

---

## Shared Infrastructure

### StatementParserService (NEW)
```typescript
// Core parser
parseCSV(content: string): ParsedTransaction[]
detectBank(content: string): { bank: string; confidence: number }
categorizeTransaction(description: string): { category: SpendingCategory; confidence: string }

// Storage
saveStatement(upload: StatementUpload): Promise<void>
getStatements(userId: string): Promise<StatementUpload[]>
getTransactions(userId: string, dateRange?: DateRange): Promise<ParsedTransaction[]>

// Integration
updateSpendingProfileFromTransactions(transactions: ParsedTransaction[]): SpendingProfile
```

### InsightsService (NEW)
```typescript
// Analysis
getCategoryBreakdown(transactions: ParsedTransaction[]): CategoryBreakdown[]
getOptimizationScore(breakdown: CategoryBreakdown[]): number
getSpendingTrends(current: ParsedTransaction[], previous: ParsedTransaction[]): SpendingTrend[]
generateSmartAlerts(breakdown: CategoryBreakdown[], trends: SpendingTrend[]): SmartAlert[]
getMoneyLeftOnTable(breakdown: CategoryBreakdown[]): number
```

### Supabase Tables
```sql
-- Statements table
CREATE TABLE statement_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  file_name TEXT NOT NULL,
  bank TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  transaction_count INTEGER DEFAULT 0,
  total_spend NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Transactions table (from parsed CSVs)
CREATE TABLE parsed_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  statement_id UUID REFERENCES statement_uploads(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  normalized_merchant TEXT,
  amount NUMERIC NOT NULL,
  is_credit BOOLEAN DEFAULT false,
  category TEXT NOT NULL,
  category_confidence TEXT DEFAULT 'medium',
  user_corrected BOOLEAN DEFAULT false,
  card_last4 TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for query performance
CREATE INDEX idx_transactions_user_date ON parsed_transactions(user_id, transaction_date);
CREATE INDEX idx_transactions_user_category ON parsed_transactions(user_id, category);
CREATE INDEX idx_statements_user ON statement_uploads(user_id);

-- RLS
ALTER TABLE statement_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE parsed_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own statements" ON statement_uploads
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own transactions" ON parsed_transactions
  FOR ALL USING (auth.uid() = user_id);
```

---

## Build Order
1. **StatementParserService** — CSV parsing + bank detection + categorization (pure functions)
2. **Upload Screen** — File picker + review table + confirmation
3. **InsightsService** — Analysis engine (pure functions)
4. **Insights Dashboard Screen** — Charts + alerts + optimization score
5. **Integration** — Wire parsed data into SpendingProfile → feeds Cycle 3 features automatically

---

## Estimated Scope
| Feature | Services | Screens | Tests | Hours |
|---------|----------|---------|-------|-------|
| F24 CSV Parser | StatementParserService | UploadScreen, ReviewScreen | ~60 | 16 |
| F25 Insights | InsightsService | InsightsDashboard | ~45 | 12 |
| Shared | MerchantPatternService | - | ~20 | 4 |
| **Total** | **3 services** | **3 screens** | **~125** | **32** |

---

## Success Metrics
- Upload completion rate > 80% (users who start upload finish it)
- Category accuracy > 85% (auto-categorization without user correction)
- "Money left on table" metric drives subscription conversion
- Users who upload statements → 3x more likely to subscribe (hypothesis)

---

*Ready for VP Eng architecture review.*
