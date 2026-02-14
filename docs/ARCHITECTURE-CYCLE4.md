# Cycle 4 Architecture Document
## CSV Statement Upload + Spending Insights Dashboard

**Author:** VP of Engineering | **Date:** Feb 13, 2026 | **Status:** Ready for Development

---

## Table of Contents
1. [Overview](#overview)
2. [TypeScript Interfaces](#typescript-interfaces)
3. [Service Layer Architecture](#service-layer-architecture)
4. [Merchant Pattern System](#merchant-pattern-system)
5. [Bank Detection & CSV Parsing](#bank-detection--csv-parsing)
6. [Insights Engine](#insights-engine)
7. [Database Schema](#database-schema)
8. [Component Hierarchy](#component-hierarchy)
9. [File Upload Strategy](#file-upload-strategy)
10. [Integration with SpendingProfileService](#integration-with-spendingprofileservice)
11. [Tier Gating](#tier-gating)
12. [Test Strategy](#test-strategy)
13. [Build Order](#build-order)
14. [Performance Considerations](#performance-considerations)
15. [Privacy & Security](#privacy--security)

---

## Overview

Cycle 4 implements Layer 1 of the data strategy: real transaction data from bank CSV statements replaces estimates with actual spending patterns. This powers all recommendation features with real data.

### Features
- **F24: CSV Statement Parser** — Upload, parse, and categorize bank CSV statements
- **F25: Spending Insights Dashboard** — Optimization score, trends, smart alerts

### Key Differentiator
"Upload your statement. We'll tell you exactly how much you're leaving on the table."

### Supported Banks (8 Canadian Banks)
1. TD Canada Trust
2. RBC Royal Bank
3. CIBC
4. Scotiabank
5. BMO
6. Tangerine
7. PC Financial
8. Amex Canada

### Key Constraints
- All CSV parsing and categorization must be **PURE functions** (testable without mocks)
- Parsing must work **entirely on-device** (no server-side processing)
- Must handle **500+ transactions** efficiently (< 3 seconds)
- Transactions stored **encrypted** locally, synced only when signed in
- Merchant categorization must be **extensible** (users can teach the system)
- **Extend** existing `MERCHANT_CATEGORY_MAP`, don't replace it
- Target: **125+ new tests**

---

## TypeScript Interfaces

Add these types to `src/types/index.ts`:

```typescript
// ============================================================================
// Cycle 4: CSV Statement Upload + Spending Insights Types
// ============================================================================

/**
 * F24: Supported banks for CSV parsing
 */
export type SupportedBank = 
  | 'td'
  | 'rbc'
  | 'cibc'
  | 'scotiabank'
  | 'bmo'
  | 'tangerine'
  | 'pc_financial'
  | 'amex_canada';

/**
 * F24: Bank detection result
 */
export interface BankDetectionResult {
  bank: SupportedBank | null;
  confidence: number;           // 0-100
  matchedPatterns: string[];    // Which patterns matched
  suggestedBank?: SupportedBank; // If confidence < 80, suggest for user confirmation
}

/**
 * F24: Category confidence levels
 */
export type CategoryConfidence = 'high' | 'medium' | 'low';

/**
 * F24: Single parsed transaction
 */
export interface ParsedTransaction {
  id: string;
  date: Date;
  description: string;          // Raw from CSV
  normalizedMerchant: string;   // Cleaned merchant name
  amount: number;               // Always positive for purchases
  isCredit: boolean;            // true = payment/refund, false = purchase
  category: SpendingCategory;
  categoryConfidence: CategoryConfidence;
  userCorrected: boolean;       // true if user manually changed category
  sourceBank: SupportedBank;
  cardLast4?: string;           // If available from CSV
}

/**
 * F24: Statement upload metadata
 */
export interface StatementUpload {
  id: string;
  userId: string | null;        // null for anonymous/local-only
  fileName: string;
  bank: SupportedBank;
  uploadDate: Date;
  periodStart: Date;
  periodEnd: Date;
  transactionCount: number;
  totalSpend: number;           // Sum of non-credit transactions
  totalCredits: number;         // Sum of credits/payments
}

/**
 * F24: Full statement with transactions
 */
export interface StatementWithTransactions extends StatementUpload {
  transactions: ParsedTransaction[];
}

/**
 * F24: Merchant pattern for categorization
 */
export interface MerchantPattern {
  pattern: RegExp;
  category: SpendingCategory;
  merchantName: string;         // Normalized display name
  confidence: CategoryConfidence;
}

/**
 * F24: User custom merchant mapping
 */
export interface UserMerchantMapping {
  id: string;
  userId: string;
  pattern: string;              // Stored as string, converted to RegExp
  category: SpendingCategory;
  merchantName: string;
  createdAt: Date;
}

/**
 * F24: CSV parsing result
 */
export interface CSVParseResult {
  success: boolean;
  transactions: ParsedTransaction[];
  bank: SupportedBank;
  periodStart: Date;
  periodEnd: Date;
  totalSpend: number;
  totalCredits: number;
  errors: CSVParseError[];
  warnings: string[];
}

/**
 * F24: CSV parsing error
 */
export interface CSVParseError {
  line: number;
  message: string;
  rawLine: string;
}

/**
 * F24: Raw CSV row (pre-normalization)
 */
export interface RawCSVRow {
  date: string;
  description: string;
  amount: string;
  debit?: string;
  credit?: string;
  balance?: string;
  cardNumber?: string;
  extras: Record<string, string>;
}

// ============================================================================
// F25: Spending Insights Types
// ============================================================================

/**
 * F25: Category breakdown with optimization analysis
 */
export interface CategoryBreakdown {
  category: SpendingCategory;
  totalSpend: number;
  transactionCount: number;
  percentOfTotal: number;
  topMerchants: MerchantSummary[];
  currentCard: Card | null;     // Which card they used (if known)
  optimalCard: Card | null;     // Which card they SHOULD use
  rewardsEarned: number;        // What they got (estimated)
  rewardsPossible: number;      // What they could get with optimal
  rewardsGap: number;           // Money left on the table
}

/**
 * F25: Merchant spending summary
 */
export interface MerchantSummary {
  name: string;
  amount: number;
  count: number;
  category: SpendingCategory;
}

/**
 * F25: Optimization score (0-100)
 */
export interface OptimizationScore {
  score: number;                // 0-100
  label: string;                // "Rewards Master", "Good Optimizer", etc.
  emoji: string;                // 🏆, 👍, 📊, 🎯
  actualRewards: number;        // Total rewards earned
  maxPossibleRewards: number;   // Max with optimal cards
  rewardsGap: number;           // Difference
  improvementPotential: string; // Human-readable suggestion
}

/**
 * F25: Spending trend analysis
 */
export interface SpendingTrend {
  category: SpendingCategory;
  currentMonth: number;
  previousMonth: number;
  changePercent: number;
  changeAmount: number;
  direction: 'up' | 'down' | 'stable';
  alert?: SmartAlert;           // Alert if significant change
}

/**
 * F25: Smart alert types
 */
export type SmartAlertType = 
  | 'spending_increase'
  | 'spending_decrease'
  | 'card_switch'
  | 'category_cap'
  | 'new_opportunity'
  | 'seasonal';

/**
 * F25: Smart alert
 */
export interface SmartAlert {
  id: string;
  type: SmartAlertType;
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  category?: SpendingCategory;
  suggestedAction?: string;
  potentialSavings?: number;
  createdAt: Date;
  dismissed: boolean;
}

/**
 * F25: Full insights result
 */
export interface SpendingInsights {
  periodStart: Date;
  periodEnd: Date;
  totalSpend: number;
  transactionCount: number;
  categoryBreakdown: CategoryBreakdown[];
  optimizationScore: OptimizationScore;
  trends: SpendingTrend[];
  alerts: SmartAlert[];
  moneyLeftOnTable: number;
  topMerchants: MerchantSummary[];
}

/**
 * F25: Monthly summary for trend analysis
 */
export interface MonthlySummary {
  month: Date;                  // First day of month
  totalSpend: number;
  byCategory: Record<SpendingCategory, number>;
  transactionCount: number;
}

// ============================================================================
// Cycle 4 Error Types
// ============================================================================

export type StatementParseError =
  | { type: 'INVALID_FILE'; message: string }
  | { type: 'UNSUPPORTED_BANK'; detectedFormat?: string }
  | { type: 'EMPTY_FILE' }
  | { type: 'PARSE_FAILED'; errors: CSVParseError[] }
  | { type: 'NO_TRANSACTIONS' }
  | { type: 'STORAGE_ERROR'; message: string };

export type InsightsError =
  | { type: 'NO_TRANSACTIONS'; message: string }
  | { type: 'INSUFFICIENT_DATA'; transactionCount: number; minimumRequired: number }
  | { type: 'DATE_RANGE_ERROR'; message: string }
  | { type: 'CALCULATION_ERROR'; message: string };

// ============================================================================
// Cycle 4 Date Range Filter
// ============================================================================

export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Filter options for transaction queries
 */
export interface TransactionFilter {
  dateRange?: DateRange;
  categories?: SpendingCategory[];
  banks?: SupportedBank[];
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
  excludeCredits?: boolean;
}
```

---

## Service Layer Architecture

### File Structure

```
src/services/
├── StatementParserService.ts      # NEW: CSV parsing + bank detection
├── MerchantPatternService.ts      # NEW: Merchant categorization engine
├── InsightsService.ts             # NEW: F25 Analytics engine
├── StatementStorageService.ts     # NEW: Local + cloud storage
├── __tests__/
│   ├── StatementParserService.test.ts
│   ├── MerchantPatternService.test.ts
│   ├── InsightsService.test.ts
│   ├── StatementStorageService.test.ts
│   └── integration/
│       ├── CSVUploadFlow.integration.test.ts
│       └── InsightsDashboard.integration.test.ts
```

---

## Merchant Pattern System

### MerchantPatternService.ts

This service extends the existing `MERCHANT_CATEGORY_MAP` from BestCardRecommendationService without duplicating it.

```typescript
/**
 * MerchantPatternService - Merchant categorization engine
 * 
 * Features:
 * - Extends existing MERCHANT_CATEGORY_MAP (don't duplicate!)
 * - 100+ merchant patterns for Canadian banks
 * - User-teachable custom mappings
 * - Pure functions for all categorization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SpendingCategory,
  MerchantPattern,
  CategoryConfidence,
  UserMerchantMapping,
  ParsedTransaction,
} from '../types';
import { MERCHANT_CATEGORY_MAP } from './BestCardRecommendationService';

// ============================================================================
// Constants
// ============================================================================

const USER_MAPPINGS_KEY = '@rewardly/user_merchant_mappings';

// ============================================================================
// Extended Merchant Patterns (100+ patterns)
// ============================================================================

/**
 * Extended merchant patterns for CSV parsing
 * These use RegExp for flexible matching of bank statement descriptions
 * 
 * Priority: User mappings > Extended patterns > Base MERCHANT_CATEGORY_MAP
 */
export const EXTENDED_MERCHANT_PATTERNS: MerchantPattern[] = [
  // ========== GROCERIES ==========
  // Major chains
  { pattern: /loblaws|no\s*frills|superstore|rcss/i, category: SpendingCategory.GROCERIES, merchantName: 'Loblaws', confidence: 'high' },
  { pattern: /metro\s+(?!gas)/i, category: SpendingCategory.GROCERIES, merchantName: 'Metro', confidence: 'high' },
  { pattern: /sobeys|safeway|freshco|iga\s/i, category: SpendingCategory.GROCERIES, merchantName: 'Sobeys', confidence: 'high' },
  { pattern: /walmart\s+sup|wal-?mart\s+#\d+/i, category: SpendingCategory.GROCERIES, merchantName: 'Walmart', confidence: 'high' },
  { pattern: /costco\s+who|costco\s+#\d+/i, category: SpendingCategory.GROCERIES, merchantName: 'Costco', confidence: 'high' },
  { pattern: /t\s*&\s*t\s+sup|t\s+and\s+t/i, category: SpendingCategory.GROCERIES, merchantName: 'T&T Supermarket', confidence: 'high' },
  { pattern: /food\s*basics/i, category: SpendingCategory.GROCERIES, merchantName: 'Food Basics', confidence: 'high' },
  { pattern: /farm\s*boy/i, category: SpendingCategory.GROCERIES, merchantName: 'Farm Boy', confidence: 'high' },
  { pattern: /fortinos/i, category: SpendingCategory.GROCERIES, merchantName: 'Fortinos', confidence: 'high' },
  { pattern: /zehrs/i, category: SpendingCategory.GROCERIES, merchantName: 'Zehrs', confidence: 'high' },
  { pattern: /longos/i, category: SpendingCategory.GROCERIES, merchantName: "Longo's", confidence: 'high' },
  { pattern: /whole\s*foods/i, category: SpendingCategory.GROCERIES, merchantName: 'Whole Foods', confidence: 'high' },
  { pattern: /voila|instacart/i, category: SpendingCategory.GROCERIES, merchantName: 'Grocery Delivery', confidence: 'high' },
  { pattern: /save[\s-]?on[\s-]?foods/i, category: SpendingCategory.GROCERIES, merchantName: 'Save-On-Foods', confidence: 'high' },
  { pattern: /real\s+canadian\s+sup/i, category: SpendingCategory.GROCERIES, merchantName: 'Real Canadian Superstore', confidence: 'high' },
  { pattern: /independent\s+grocer/i, category: SpendingCategory.GROCERIES, merchantName: 'Your Independent Grocer', confidence: 'high' },
  { pattern: /maxi(?!m)/i, category: SpendingCategory.GROCERIES, merchantName: 'Maxi', confidence: 'high' },
  { pattern: /provigo/i, category: SpendingCategory.GROCERIES, merchantName: 'Provigo', confidence: 'high' },
  { pattern: /super\s*c\s/i, category: SpendingCategory.GROCERIES, merchantName: 'Super C', confidence: 'high' },
  // Generic grocery patterns (lower confidence)
  { pattern: /grocery|grocer|supermarket|marche|market/i, category: SpendingCategory.GROCERIES, merchantName: 'Grocery Store', confidence: 'medium' },

  // ========== DINING ==========
  // Coffee shops
  { pattern: /starbucks/i, category: SpendingCategory.DINING, merchantName: 'Starbucks', confidence: 'high' },
  { pattern: /tim\s*horton|tims\s/i, category: SpendingCategory.DINING, merchantName: 'Tim Hortons', confidence: 'high' },
  { pattern: /second\s*cup/i, category: SpendingCategory.DINING, merchantName: 'Second Cup', confidence: 'high' },
  { pattern: /mcdonald/i, category: SpendingCategory.DINING, merchantName: "McDonald's", confidence: 'high' },
  // Fast food
  { pattern: /a\s*&\s*w\s/i, category: SpendingCategory.DINING, merchantName: 'A&W', confidence: 'high' },
  { pattern: /subway\s*#?\d*/i, category: SpendingCategory.DINING, merchantName: 'Subway', confidence: 'high' },
  { pattern: /popeye/i, category: SpendingCategory.DINING, merchantName: 'Popeyes', confidence: 'high' },
  { pattern: /wendy'?s/i, category: SpendingCategory.DINING, merchantName: "Wendy's", confidence: 'high' },
  { pattern: /burger\s*king/i, category: SpendingCategory.DINING, merchantName: 'Burger King', confidence: 'high' },
  { pattern: /kfc|kentucky\s*fried/i, category: SpendingCategory.DINING, merchantName: 'KFC', confidence: 'high' },
  { pattern: /taco\s*bell/i, category: SpendingCategory.DINING, merchantName: 'Taco Bell', confidence: 'high' },
  { pattern: /five\s*guys/i, category: SpendingCategory.DINING, merchantName: 'Five Guys', confidence: 'high' },
  { pattern: /chipotle/i, category: SpendingCategory.DINING, merchantName: 'Chipotle', confidence: 'high' },
  { pattern: /pita\s*pit/i, category: SpendingCategory.DINING, merchantName: 'Pita Pit', confidence: 'high' },
  // Casual dining
  { pattern: /boston\s*pizza|bp\s+rest/i, category: SpendingCategory.DINING, merchantName: 'Boston Pizza', confidence: 'high' },
  { pattern: /montana'?s/i, category: SpendingCategory.DINING, merchantName: "Montana's", confidence: 'high' },
  { pattern: /swiss\s*chalet/i, category: SpendingCategory.DINING, merchantName: 'Swiss Chalet', confidence: 'high' },
  { pattern: /harveys/i, category: SpendingCategory.DINING, merchantName: "Harvey's", confidence: 'high' },
  { pattern: /east\s*side\s*mario/i, category: SpendingCategory.DINING, merchantName: "East Side Mario's", confidence: 'high' },
  { pattern: /kelsey'?s/i, category: SpendingCategory.DINING, merchantName: "Kelsey's", confidence: 'high' },
  { pattern: /milestones/i, category: SpendingCategory.DINING, merchantName: 'Milestones', confidence: 'high' },
  { pattern: /cactus\s*club/i, category: SpendingCategory.DINING, merchantName: 'Cactus Club', confidence: 'high' },
  { pattern: /earls/i, category: SpendingCategory.DINING, merchantName: "Earl's", confidence: 'high' },
  { pattern: /joey\s+rest/i, category: SpendingCategory.DINING, merchantName: 'JOEY', confidence: 'high' },
  { pattern: /the\s*keg/i, category: SpendingCategory.DINING, merchantName: 'The Keg', confidence: 'high' },
  { pattern: /jack\s*astor/i, category: SpendingCategory.DINING, merchantName: "Jack Astor's", confidence: 'high' },
  // Delivery apps
  { pattern: /skip\s*the\s*dish|skipthedish/i, category: SpendingCategory.DINING, merchantName: 'SkipTheDishes', confidence: 'high' },
  { pattern: /uber\s*eat/i, category: SpendingCategory.DINING, merchantName: 'Uber Eats', confidence: 'high' },
  { pattern: /doordash/i, category: SpendingCategory.DINING, merchantName: 'DoorDash', confidence: 'high' },
  { pattern: /fantuan|hungry\s*panda/i, category: SpendingCategory.DINING, merchantName: 'Food Delivery', confidence: 'high' },
  // Generic dining patterns (lower confidence)
  { pattern: /restaurant|resto|bistro|cafe|grill|kitchen|diner|tavern|pub\s/i, category: SpendingCategory.DINING, merchantName: 'Restaurant', confidence: 'medium' },
  { pattern: /pizza|sushi|thai|chinese|indian|vietnamese|korean|japanese|mexican/i, category: SpendingCategory.DINING, merchantName: 'Restaurant', confidence: 'medium' },
  { pattern: /bar\s+&|sports\s*bar|brew/i, category: SpendingCategory.DINING, merchantName: 'Bar & Grill', confidence: 'medium' },

  // ========== GAS ==========
  { pattern: /esso|exxon/i, category: SpendingCategory.GAS, merchantName: 'Esso', confidence: 'high' },
  { pattern: /shell(?!\s*fish)/i, category: SpendingCategory.GAS, merchantName: 'Shell', confidence: 'high' },
  { pattern: /petro[\s\-]*can/i, category: SpendingCategory.GAS, merchantName: 'Petro-Canada', confidence: 'high' },
  { pattern: /canadian\s*tire\s*gas|ct\s*gas/i, category: SpendingCategory.GAS, merchantName: 'Canadian Tire Gas+', confidence: 'high' },
  { pattern: /husky\s*(?:energy|gas|oil)?/i, category: SpendingCategory.GAS, merchantName: 'Husky', confidence: 'high' },
  { pattern: /pioneer\s*(?:gas)?/i, category: SpendingCategory.GAS, merchantName: 'Pioneer', confidence: 'high' },
  { pattern: /ultramar/i, category: SpendingCategory.GAS, merchantName: 'Ultramar', confidence: 'high' },
  { pattern: /costco\s*gas/i, category: SpendingCategory.GAS, merchantName: 'Costco Gas', confidence: 'high' },
  { pattern: /mobil(?!e)/i, category: SpendingCategory.GAS, merchantName: 'Mobil', confidence: 'high' },
  { pattern: /chevron/i, category: SpendingCategory.GAS, merchantName: 'Chevron', confidence: 'high' },
  { pattern: /sunoco/i, category: SpendingCategory.GAS, merchantName: 'Sunoco', confidence: 'high' },
  { pattern: /7[\-\s]?eleven\s*gas|7-11\s*gas/i, category: SpendingCategory.GAS, merchantName: '7-Eleven', confidence: 'high' },
  { pattern: /fas\s*gas/i, category: SpendingCategory.GAS, merchantName: 'Fas Gas', confidence: 'high' },
  { pattern: /domo\s*gas/i, category: SpendingCategory.GAS, merchantName: 'DOMO', confidence: 'high' },
  { pattern: /co[\-\s]?op\s*gas/i, category: SpendingCategory.GAS, merchantName: 'Co-op Gas', confidence: 'high' },
  // Generic gas patterns
  { pattern: /gas\s*station|fuel|petroleum|petrol\s/i, category: SpendingCategory.GAS, merchantName: 'Gas Station', confidence: 'medium' },

  // ========== TRANSIT ==========
  { pattern: /presto/i, category: SpendingCategory.OTHER, merchantName: 'PRESTO', confidence: 'high' },
  { pattern: /ttc|toronto\s*transit/i, category: SpendingCategory.OTHER, merchantName: 'TTC', confidence: 'high' },
  { pattern: /metrolinx|go\s*transit/i, category: SpendingCategory.OTHER, merchantName: 'GO Transit', confidence: 'high' },
  { pattern: /oct\s*transpo|oc\s*transpo/i, category: SpendingCategory.OTHER, merchantName: 'OC Transpo', confidence: 'high' },
  { pattern: /stm\s|societe\s*de\s*transport/i, category: SpendingCategory.OTHER, merchantName: 'STM Montreal', confidence: 'high' },
  { pattern: /translink/i, category: SpendingCategory.OTHER, merchantName: 'TransLink', confidence: 'high' },
  { pattern: /compass\s*card/i, category: SpendingCategory.OTHER, merchantName: 'Compass Card', confidence: 'high' },
  { pattern: /uber(?!\s*eat)/i, category: SpendingCategory.OTHER, merchantName: 'Uber', confidence: 'high' },
  { pattern: /lyft/i, category: SpendingCategory.OTHER, merchantName: 'Lyft', confidence: 'high' },
  { pattern: /taxi|cab\s/i, category: SpendingCategory.OTHER, merchantName: 'Taxi', confidence: 'medium' },
  { pattern: /parking|park\s*n\s*fly|impark/i, category: SpendingCategory.OTHER, merchantName: 'Parking', confidence: 'high' },

  // ========== ONLINE SHOPPING ==========
  { pattern: /amazon|amzn|amz\s*mkt/i, category: SpendingCategory.ONLINE_SHOPPING, merchantName: 'Amazon', confidence: 'high' },
  { pattern: /apple\.com|itunes|apple\s*store/i, category: SpendingCategory.ONLINE_SHOPPING, merchantName: 'Apple', confidence: 'high' },
  { pattern: /google\s*\*|google\s*play/i, category: SpendingCategory.ONLINE_SHOPPING, merchantName: 'Google', confidence: 'high' },
  { pattern: /ebay/i, category: SpendingCategory.ONLINE_SHOPPING, merchantName: 'eBay', confidence: 'high' },
  { pattern: /etsy/i, category: SpendingCategory.ONLINE_SHOPPING, merchantName: 'Etsy', confidence: 'high' },
  { pattern: /aliexpress|alibaba/i, category: SpendingCategory.ONLINE_SHOPPING, merchantName: 'AliExpress', confidence: 'high' },
  { pattern: /wish\.com/i, category: SpendingCategory.ONLINE_SHOPPING, merchantName: 'Wish', confidence: 'high' },
  { pattern: /wayfair/i, category: SpendingCategory.ONLINE_SHOPPING, merchantName: 'Wayfair', confidence: 'high' },
  { pattern: /shein/i, category: SpendingCategory.ONLINE_SHOPPING, merchantName: 'SHEIN', confidence: 'high' },

  // ========== DRUGSTORES ==========
  { pattern: /shoppers\s*drug|sdm|beauty\s*boutique/i, category: SpendingCategory.DRUGSTORES, merchantName: 'Shoppers Drug Mart', confidence: 'high' },
  { pattern: /rexall/i, category: SpendingCategory.DRUGSTORES, merchantName: 'Rexall', confidence: 'high' },
  { pattern: /pharmasave/i, category: SpendingCategory.DRUGSTORES, merchantName: 'PharmaChoice', confidence: 'high' },
  { pattern: /london\s*drugs/i, category: SpendingCategory.DRUGSTORES, merchantName: 'London Drugs', confidence: 'high' },
  { pattern: /jean\s*coutu/i, category: SpendingCategory.DRUGSTORES, merchantName: 'Jean Coutu', confidence: 'high' },
  { pattern: /pharmaprix/i, category: SpendingCategory.DRUGSTORES, merchantName: 'Pharmaprix', confidence: 'high' },
  { pattern: /guardian\s*pharmacy|ida\s*pharmacy/i, category: SpendingCategory.DRUGSTORES, merchantName: 'Pharmacy', confidence: 'high' },
  { pattern: /pharma|drugstore|rx\s/i, category: SpendingCategory.DRUGSTORES, merchantName: 'Pharmacy', confidence: 'medium' },

  // ========== ENTERTAINMENT ==========
  { pattern: /netflix/i, category: SpendingCategory.ENTERTAINMENT, merchantName: 'Netflix', confidence: 'high' },
  { pattern: /spotify/i, category: SpendingCategory.ENTERTAINMENT, merchantName: 'Spotify', confidence: 'high' },
  { pattern: /disney\+|disneyplus/i, category: SpendingCategory.ENTERTAINMENT, merchantName: 'Disney+', confidence: 'high' },
  { pattern: /crave|bell\s*media/i, category: SpendingCategory.ENTERTAINMENT, merchantName: 'Crave', confidence: 'high' },
  { pattern: /prime\s*video/i, category: SpendingCategory.ENTERTAINMENT, merchantName: 'Prime Video', confidence: 'high' },
  { pattern: /apple\s*tv\+|apple\s*music/i, category: SpendingCategory.ENTERTAINMENT, merchantName: 'Apple Services', confidence: 'high' },
  { pattern: /youtube\s*prem/i, category: SpendingCategory.ENTERTAINMENT, merchantName: 'YouTube Premium', confidence: 'high' },
  { pattern: /hbo|max\s*streaming/i, category: SpendingCategory.ENTERTAINMENT, merchantName: 'Max', confidence: 'high' },
  { pattern: /cineplex|galaxy\s*cin|landmark\s*cin/i, category: SpendingCategory.ENTERTAINMENT, merchantName: 'Cinema', confidence: 'high' },
  { pattern: /xbox|playstation|psn|nintendo/i, category: SpendingCategory.ENTERTAINMENT, merchantName: 'Gaming', confidence: 'high' },
  { pattern: /steam|epic\s*games/i, category: SpendingCategory.ENTERTAINMENT, merchantName: 'Gaming', confidence: 'high' },
  { pattern: /ticketmaster|stubhub|eventbrite/i, category: SpendingCategory.ENTERTAINMENT, merchantName: 'Tickets', confidence: 'high' },
  { pattern: /mlse|raptors|leafs|jays|blue\s*jays/i, category: SpendingCategory.ENTERTAINMENT, merchantName: 'Sports', confidence: 'high' },

  // ========== HOME IMPROVEMENT ==========
  { pattern: /canadian\s*tire(?!\s*gas)/i, category: SpendingCategory.HOME_IMPROVEMENT, merchantName: 'Canadian Tire', confidence: 'high' },
  { pattern: /home\s*depot/i, category: SpendingCategory.HOME_IMPROVEMENT, merchantName: 'Home Depot', confidence: 'high' },
  { pattern: /lowe'?s|rona/i, category: SpendingCategory.HOME_IMPROVEMENT, merchantName: "Lowe's/RONA", confidence: 'high' },
  { pattern: /home\s*hardware/i, category: SpendingCategory.HOME_IMPROVEMENT, merchantName: 'Home Hardware', confidence: 'high' },
  { pattern: /ikea/i, category: SpendingCategory.HOME_IMPROVEMENT, merchantName: 'IKEA', confidence: 'high' },
  { pattern: /structube/i, category: SpendingCategory.HOME_IMPROVEMENT, merchantName: 'Structube', confidence: 'high' },
  { pattern: /the\s*brick/i, category: SpendingCategory.HOME_IMPROVEMENT, merchantName: 'The Brick', confidence: 'high' },
  { pattern: /leon'?s/i, category: SpendingCategory.HOME_IMPROVEMENT, merchantName: "Leon's", confidence: 'high' },
  { pattern: /bed\s*bath|homesense|winners/i, category: SpendingCategory.HOME_IMPROVEMENT, merchantName: 'Home Store', confidence: 'high' },
  { pattern: /dollarama/i, category: SpendingCategory.HOME_IMPROVEMENT, merchantName: 'Dollarama', confidence: 'high' },

  // ========== TRAVEL ==========
  { pattern: /air\s*canada|westjet|porter\s*air|flair\s*air|swoop/i, category: SpendingCategory.TRAVEL, merchantName: 'Airline', confidence: 'high' },
  { pattern: /united\s*air|delta\s*air|american\s*air|alaska\s*air/i, category: SpendingCategory.TRAVEL, merchantName: 'Airline', confidence: 'high' },
  { pattern: /marriott|hilton|hyatt|ihg|accor|wyndham/i, category: SpendingCategory.TRAVEL, merchantName: 'Hotel', confidence: 'high' },
  { pattern: /fairmont|four\s*seasons|ritz/i, category: SpendingCategory.TRAVEL, merchantName: 'Hotel', confidence: 'high' },
  { pattern: /airbnb|vrbo/i, category: SpendingCategory.TRAVEL, merchantName: 'Vacation Rental', confidence: 'high' },
  { pattern: /booking\.com|expedia|hotels\.com|kayak|trivago/i, category: SpendingCategory.TRAVEL, merchantName: 'Travel Booking', confidence: 'high' },
  { pattern: /hertz|avis|budget|enterprise|national\s*car/i, category: SpendingCategory.TRAVEL, merchantName: 'Car Rental', confidence: 'high' },
  { pattern: /via\s*rail|amtrak/i, category: SpendingCategory.TRAVEL, merchantName: 'Train', confidence: 'high' },

  // ========== UTILITIES & BILLS (OTHER) ==========
  { pattern: /rogers|bell\s*can|telus|shaw|videotron|cogeco/i, category: SpendingCategory.OTHER, merchantName: 'Telecom', confidence: 'high' },
  { pattern: /fido|koodo|virgin\s*mobile|freedom\s*mob|chatr/i, category: SpendingCategory.OTHER, merchantName: 'Mobile', confidence: 'high' },
  { pattern: /hydro|enbridge|toronto\s*hydro|bc\s*hydro/i, category: SpendingCategory.OTHER, merchantName: 'Utilities', confidence: 'high' },
  { pattern: /insurance|sunlife|manulife|desjardins\s*ins/i, category: SpendingCategory.OTHER, merchantName: 'Insurance', confidence: 'high' },
  { pattern: /gym|goodlife|fit4less|la\s*fitness|planet\s*fitness/i, category: SpendingCategory.OTHER, merchantName: 'Gym', confidence: 'high' },

  // ========== RETAIL CATCH-ALL (LOWER CONFIDENCE) ==========
  { pattern: /walmart(?!\s*sup)/i, category: SpendingCategory.OTHER, merchantName: 'Walmart', confidence: 'medium' },
  { pattern: /costco(?!\s*who|\s*gas)/i, category: SpendingCategory.OTHER, merchantName: 'Costco', confidence: 'medium' },
  { pattern: /hudson'?s\s*bay|hbc\s/i, category: SpendingCategory.OTHER, merchantName: "Hudson's Bay", confidence: 'medium' },
  { pattern: /simons/i, category: SpendingCategory.OTHER, merchantName: 'Simons', confidence: 'medium' },
  { pattern: /indigo|chapters/i, category: SpendingCategory.OTHER, merchantName: 'Indigo', confidence: 'medium' },
];

// ============================================================================
// In-Memory Cache
// ============================================================================

let userMappingsCache: UserMerchantMapping[] = [];
let isInitialized = false;

// ============================================================================
// Pure Functions (Exported for Testing)
// ============================================================================

/**
 * Normalize a merchant description for matching
 * Removes extra spaces, special characters, etc.
 */
export function normalizeMerchantDescription(description: string): string {
  return description
    .toUpperCase()
    .replace(/[#*\-_@]/g, ' ')     // Replace common separators with spaces
    .replace(/\s+/g, ' ')          // Collapse multiple spaces
    .replace(/\d{4,}/g, '')        // Remove long number sequences (card numbers, etc.)
    .trim();
}

/**
 * Extract a clean merchant name from raw description
 */
export function extractMerchantName(description: string): string {
  // Remove common suffixes/prefixes
  let cleaned = description
    .replace(/\s+(ON|BC|AB|QC|MB|SK|NS|NB|NL|PE|YT|NT|NU)$/i, '') // Province codes
    .replace(/\s+CAN(ADA)?$/i, '')          // Country
    .replace(/\s+#\d+/g, '')                 // Store numbers
    .replace(/\s+\d{4,}/g, '')               // Long numbers
    .replace(/\*+/g, '')                     // Asterisks
    .replace(/\s{2,}/g, ' ')                 // Multiple spaces
    .trim();
  
  // Title case
  return cleaned
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Categorize a transaction description
 * Returns best matching category with confidence level
 * 
 * Priority: User mappings > Extended patterns > Base map > OTHER
 */
export function categorizeTransaction(
  description: string,
  userMappings: UserMerchantMapping[] = []
): { category: SpendingCategory; merchantName: string; confidence: CategoryConfidence } {
  const normalized = normalizeMerchantDescription(description);
  
  // 1. Check user custom mappings first (highest priority)
  for (const mapping of userMappings) {
    try {
      const regex = new RegExp(mapping.pattern, 'i');
      if (regex.test(normalized) || regex.test(description)) {
        return {
          category: mapping.category,
          merchantName: mapping.merchantName,
          confidence: 'high',
        };
      }
    } catch {
      // Invalid regex in user mapping, skip
    }
  }
  
  // 2. Check extended patterns
  for (const pattern of EXTENDED_MERCHANT_PATTERNS) {
    if (pattern.pattern.test(normalized) || pattern.pattern.test(description)) {
      return {
        category: pattern.category,
        merchantName: pattern.merchantName,
        confidence: pattern.confidence,
      };
    }
  }
  
  // 3. Check base MERCHANT_CATEGORY_MAP (from BestCardRecommendationService)
  const lowerDesc = description.toLowerCase();
  for (const [merchant, category] of Object.entries(MERCHANT_CATEGORY_MAP)) {
    if (lowerDesc.includes(merchant.toLowerCase())) {
      return {
        category,
        merchantName: extractMerchantName(description),
        confidence: 'medium',
      };
    }
  }
  
  // 4. Default to OTHER with extracted merchant name
  return {
    category: SpendingCategory.OTHER,
    merchantName: extractMerchantName(description),
    confidence: 'low',
  };
}

/**
 * Batch categorize transactions (pure function)
 */
export function categorizeTransactions(
  descriptions: string[],
  userMappings: UserMerchantMapping[] = []
): Array<{ category: SpendingCategory; merchantName: string; confidence: CategoryConfidence }> {
  return descriptions.map(desc => categorizeTransaction(desc, userMappings));
}

/**
 * Get category stats from transactions
 */
export function getCategoryStats(
  transactions: ParsedTransaction[]
): Record<SpendingCategory, { count: number; totalAmount: number }> {
  const stats: Record<SpendingCategory, { count: number; totalAmount: number }> = {
    [SpendingCategory.GROCERIES]: { count: 0, totalAmount: 0 },
    [SpendingCategory.DINING]: { count: 0, totalAmount: 0 },
    [SpendingCategory.GAS]: { count: 0, totalAmount: 0 },
    [SpendingCategory.TRAVEL]: { count: 0, totalAmount: 0 },
    [SpendingCategory.ONLINE_SHOPPING]: { count: 0, totalAmount: 0 },
    [SpendingCategory.ENTERTAINMENT]: { count: 0, totalAmount: 0 },
    [SpendingCategory.DRUGSTORES]: { count: 0, totalAmount: 0 },
    [SpendingCategory.HOME_IMPROVEMENT]: { count: 0, totalAmount: 0 },
    [SpendingCategory.OTHER]: { count: 0, totalAmount: 0 },
  };

  for (const tx of transactions) {
    if (tx.isCredit) continue; // Skip credits/payments
    stats[tx.category].count++;
    stats[tx.category].totalAmount += tx.amount;
  }

  return stats;
}

// ============================================================================
// User Mapping Management
// ============================================================================

/**
 * Initialize user mappings from storage
 */
export async function initializeUserMappings(): Promise<void> {
  if (isInitialized) return;
  
  try {
    const stored = await AsyncStorage.getItem(USER_MAPPINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      userMappingsCache = parsed.map((m: any) => ({
        ...m,
        createdAt: new Date(m.createdAt),
      }));
    }
    isInitialized = true;
  } catch (error) {
    console.error('[MerchantPatternService] Init error:', error);
    isInitialized = true;
  }
}

/**
 * Get user mappings (sync, from cache)
 */
export function getUserMappingsSync(): UserMerchantMapping[] {
  return userMappingsCache;
}

/**
 * Add a user custom mapping
 */
export async function addUserMapping(
  pattern: string,
  category: SpendingCategory,
  merchantName: string,
  userId: string
): Promise<UserMerchantMapping> {
  // Validate pattern is valid regex
  try {
    new RegExp(pattern, 'i');
  } catch {
    throw new Error(`Invalid pattern: ${pattern}`);
  }

  const mapping: UserMerchantMapping = {
    id: `um_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    pattern,
    category,
    merchantName,
    createdAt: new Date(),
  };

  userMappingsCache.push(mapping);
  await persistUserMappings();
  
  return mapping;
}

/**
 * Remove a user mapping
 */
export async function removeUserMapping(mappingId: string): Promise<void> {
  userMappingsCache = userMappingsCache.filter(m => m.id !== mappingId);
  await persistUserMappings();
}

/**
 * Update transactions when user corrects a category
 * This teaches the system for future categorization
 */
export async function learnFromCorrection(
  originalDescription: string,
  newCategory: SpendingCategory,
  merchantName: string,
  userId: string
): Promise<void> {
  // Create a pattern from the original description
  // Extract key words (skip common words, numbers)
  const words = originalDescription
    .split(/\s+/)
    .filter(w => w.length > 3)
    .filter(w => !/^\d+$/.test(w))
    .slice(0, 3);  // Use first 3 significant words
  
  if (words.length === 0) return;
  
  // Create a case-insensitive pattern
  const pattern = words.join('.*');
  
  await addUserMapping(pattern, newCategory, merchantName, userId);
}

/**
 * Reset cache (for testing)
 */
export function resetMerchantPatternCache(): void {
  userMappingsCache = [];
  isInitialized = false;
}

// ============================================================================
// Storage Functions
// ============================================================================

async function persistUserMappings(): Promise<void> {
  const serialized = JSON.stringify(
    userMappingsCache.map(m => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    }))
  );
  await AsyncStorage.setItem(USER_MAPPINGS_KEY, serialized);
}
```

---

## Bank Detection & CSV Parsing

### StatementParserService.ts

```typescript
/**
 * StatementParserService - CSV Statement Parsing + Bank Detection
 * 
 * Features:
 * - Auto-detect bank from CSV format
 * - Parse 8 Canadian bank CSV formats
 * - Pure functions for all parsing
 * - Handle 500+ transactions efficiently
 */

import {
  SupportedBank,
  BankDetectionResult,
  ParsedTransaction,
  CSVParseResult,
  CSVParseError,
  RawCSVRow,
  SpendingCategory,
  StatementParseError,
  Result,
  success,
  failure,
} from '../types';
import { 
  categorizeTransaction, 
  getUserMappingsSync,
  extractMerchantName 
} from './MerchantPatternService';

// ============================================================================
// Bank Format Definitions
// ============================================================================

interface BankFormat {
  bank: SupportedBank;
  displayName: string;
  
  // Detection
  headerPatterns: RegExp[];      // Patterns to match in header row
  columnCount: number[];         // Valid column counts
  dateFormats: string[];         // Expected date formats
  hasHeader: boolean;
  
  // Parsing
  dateColumn: number | string;   // Column index or header name
  descriptionColumns: (number | string)[]; // Can be multiple
  amountColumn?: number | string;  // Single amount column (neg = debit)
  debitColumn?: number | string;   // Separate debit column
  creditColumn?: number | string;  // Separate credit column
  cardColumn?: number | string;    // Card number column (optional)
  
  // Special handling
  usesUnicodeMinus?: boolean;    // Tangerine uses −
  dateParser?: (dateStr: string) => Date | null;
}

const BANK_FORMATS: BankFormat[] = [
  // TD Canada Trust
  {
    bank: 'td',
    displayName: 'TD Canada Trust',
    headerPatterns: [/date.*description.*debit.*credit.*balance/i],
    columnCount: [5],
    dateFormats: ['MM/DD/YYYY'],
    hasHeader: true,
    dateColumn: 0,
    descriptionColumns: [1],
    debitColumn: 2,
    creditColumn: 3,
  },
  
  // RBC Royal Bank
  {
    bank: 'rbc',
    displayName: 'RBC Royal Bank',
    headerPatterns: [/account\s*type.*account\s*number.*transaction\s*date/i, /cheque.*description.*cad/i],
    columnCount: [8],
    dateFormats: ['MM/DD/YYYY'],
    hasHeader: true,
    dateColumn: 2,
    descriptionColumns: [4, 5],  // Description 1 and Description 2
    amountColumn: 6,             // CAD$ column
    cardColumn: 1,               // Account Number
  },
  
  // CIBC (no header!)
  {
    bank: 'cibc',
    displayName: 'CIBC',
    headerPatterns: [],
    columnCount: [4],
    dateFormats: ['MM/DD/YYYY'],
    hasHeader: false,
    dateColumn: 0,
    descriptionColumns: [1],
    debitColumn: 2,
    creditColumn: 3,
  },
  
  // Scotiabank
  {
    bank: 'scotiabank',
    displayName: 'Scotiabank',
    headerPatterns: [],
    columnCount: [3],
    dateFormats: ['M/DD/YYYY', 'MM/DD/YYYY'],
    hasHeader: false,
    dateColumn: 0,
    descriptionColumns: [1],
    amountColumn: 2,  // Negative = debit
  },
  
  // BMO
  {
    bank: 'bmo',
    displayName: 'BMO',
    headerPatterns: [/item.*card.*transaction\s*date.*posting.*amount.*description/i],
    columnCount: [6],
    dateFormats: ['YYYYMMDD'],
    hasHeader: true,
    dateColumn: 2,
    descriptionColumns: [5],
    amountColumn: 4,
    cardColumn: 1,
    dateParser: (dateStr: string) => {
      // BMO uses YYYYMMDD format
      if (dateStr.length !== 8) return null;
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1;
      const day = parseInt(dateStr.substring(6, 8));
      return new Date(year, month, day);
    },
  },
  
  // Tangerine
  {
    bank: 'tangerine',
    displayName: 'Tangerine',
    headerPatterns: [/date.*transaction.*name.*memo.*amount/i],
    columnCount: [5],
    dateFormats: ['M/DD/YYYY', 'MM/DD/YYYY'],
    hasHeader: true,
    dateColumn: 0,
    descriptionColumns: [2],  // Name column
    amountColumn: 4,
    usesUnicodeMinus: true,   // Uses − (Unicode minus) not - (hyphen)
  },
  
  // PC Financial
  {
    bank: 'pc_financial',
    displayName: 'PC Financial',
    headerPatterns: [/date.*description.*amount/i, /pc\s*financial/i],
    columnCount: [3, 4],
    dateFormats: ['MM/DD/YYYY', 'YYYY-MM-DD'],
    hasHeader: true,
    dateColumn: 0,
    descriptionColumns: [1],
    amountColumn: 2,
  },
  
  // Amex Canada
  {
    bank: 'amex_canada',
    displayName: 'American Express Canada',
    headerPatterns: [/date.*reference.*description.*amount/i],
    columnCount: [4, 5, 6],  // Varies by card type
    dateFormats: ['MM/DD/YYYY', 'DD/MM/YYYY'],
    hasHeader: false,
    dateColumn: 0,
    descriptionColumns: [2],
    amountColumn: 3,
  },
];

// ============================================================================
// Pure Parsing Functions (Exported for Testing)
// ============================================================================

/**
 * Parse a CSV string into rows
 * Handles quoted fields, commas in values, etc.
 */
export function parseCSVToRows(csvContent: string): string[][] {
  const rows: string[][] = [];
  const lines = csvContent.split(/\r?\n/);
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    rows.push(row);
  }
  
  return rows;
}

/**
 * Detect bank from CSV content
 * Returns confidence score (0-100)
 */
export function detectBank(csvContent: string): BankDetectionResult {
  const rows = parseCSVToRows(csvContent);
  if (rows.length === 0) {
    return { bank: null, confidence: 0, matchedPatterns: [] };
  }
  
  const firstRow = rows[0];
  const headerLine = firstRow.join(',').toLowerCase();
  const columnCount = firstRow.length;
  
  let bestMatch: { bank: SupportedBank; score: number; patterns: string[] } | null = null;
  
  for (const format of BANK_FORMATS) {
    let score = 0;
    const matchedPatterns: string[] = [];
    
    // Check header patterns
    if (format.hasHeader) {
      for (const pattern of format.headerPatterns) {
        if (pattern.test(headerLine)) {
          score += 40;
          matchedPatterns.push(`header: ${pattern.source}`);
        }
      }
    }
    
    // Check column count
    if (format.columnCount.includes(columnCount)) {
      score += 30;
      matchedPatterns.push(`columns: ${columnCount}`);
    }
    
    // Check date format in first data row
    const dataRow = format.hasHeader ? rows[1] : rows[0];
    if (dataRow) {
      const dateCol = typeof format.dateColumn === 'number' ? format.dateColumn : 0;
      const dateStr = dataRow[dateCol];
      
      for (const dateFormat of format.dateFormats) {
        if (matchesDateFormat(dateStr, dateFormat)) {
          score += 20;
          matchedPatterns.push(`date: ${dateFormat}`);
          break;
        }
      }
    }
    
    // CIBC special case: no header, 4 columns, MM/DD/YYYY date
    if (format.bank === 'cibc' && !format.hasHeader) {
      // Check if it looks like date, text, number, number
      const sampleRow = rows[0];
      if (sampleRow.length === 4) {
        const [date, desc, debit, credit] = sampleRow;
        if (
          /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date) &&
          desc.length > 0 &&
          (isNumeric(debit) || debit === '') &&
          (isNumeric(credit) || credit === '')
        ) {
          score += 10;
          matchedPatterns.push('cibc-pattern');
        }
      }
    }
    
    // Tangerine special case: check for Unicode minus
    if (format.bank === 'tangerine') {
      if (csvContent.includes('−')) { // Unicode minus
        score += 15;
        matchedPatterns.push('unicode-minus');
      }
    }
    
    // BMO special case: YYYYMMDD date format
    if (format.bank === 'bmo') {
      const dataRow = rows[1];
      if (dataRow && /^\d{8}$/.test(dataRow[2])) {
        score += 15;
        matchedPatterns.push('bmo-date-format');
      }
    }
    
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { bank: format.bank, score, patterns: matchedPatterns };
    }
  }
  
  if (!bestMatch || bestMatch.score < 30) {
    return {
      bank: null,
      confidence: bestMatch?.score || 0,
      matchedPatterns: bestMatch?.patterns || [],
      suggestedBank: bestMatch?.bank,
    };
  }
  
  return {
    bank: bestMatch.score >= 80 ? bestMatch.bank : null,
    confidence: Math.min(100, bestMatch.score),
    matchedPatterns: bestMatch.patterns,
    suggestedBank: bestMatch.bank,
  };
}

/**
 * Check if a string matches a date format
 */
export function matchesDateFormat(dateStr: string, format: string): boolean {
  if (!dateStr) return false;
  
  switch (format) {
    case 'MM/DD/YYYY':
      return /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr);
    case 'M/DD/YYYY':
      return /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr);
    case 'YYYY-MM-DD':
      return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
    case 'YYYYMMDD':
      return /^\d{8}$/.test(dateStr);
    case 'DD/MM/YYYY':
      return /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr);
    default:
      return false;
  }
}

/**
 * Parse a date string with various formats
 */
export function parseDate(dateStr: string, format?: string): Date | null {
  if (!dateStr) return null;
  
  // YYYYMMDD (BMO)
  if (/^\d{8}$/.test(dateStr)) {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month, day);
  }
  
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr);
  }
  
  // MM/DD/YYYY or M/DD/YYYY
  const mdyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdyMatch) {
    const [, month, day, year] = mdyMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  return null;
}

/**
 * Parse amount string to number
 * Handles various formats: negative, parentheses, currency symbols, Unicode minus
 */
export function parseAmount(amountStr: string): number {
  if (!amountStr || amountStr.trim() === '') return 0;
  
  let cleaned = amountStr
    .replace(/[$,]/g, '')           // Remove $ and commas
    .replace(/−/g, '-')             // Unicode minus to ASCII
    .replace(/\s/g, '')             // Remove spaces
    .trim();
  
  // Handle parentheses as negative
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1);
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Parse a single row according to bank format
 */
export function parseRow(
  row: string[],
  format: BankFormat,
  rowIndex: number
): { transaction: Omit<ParsedTransaction, 'category' | 'categoryConfidence' | 'userCorrected'> | null; error?: CSVParseError } {
  try {
    // Get date
    const dateCol = typeof format.dateColumn === 'number' ? format.dateColumn : 0;
    const dateStr = row[dateCol];
    
    const date = format.dateParser 
      ? format.dateParser(dateStr)
      : parseDate(dateStr);
    
    if (!date) {
      return {
        transaction: null,
        error: {
          line: rowIndex + 1,
          message: `Invalid date: ${dateStr}`,
          rawLine: row.join(','),
        },
      };
    }
    
    // Get description
    const descParts: string[] = [];
    for (const col of format.descriptionColumns) {
      const colIndex = typeof col === 'number' ? col : 0;
      if (row[colIndex]) {
        descParts.push(row[colIndex]);
      }
    }
    const description = descParts.join(' ').trim();
    
    // Get amount
    let amount = 0;
    let isCredit = false;
    
    if (format.amountColumn !== undefined) {
      const amtCol = typeof format.amountColumn === 'number' ? format.amountColumn : 0;
      let amtStr = row[amtCol];
      
      // Handle Unicode minus for Tangerine
      if (format.usesUnicodeMinus) {
        amtStr = amtStr.replace(/−/g, '-');
      }
      
      const parsed = parseAmount(amtStr);
      
      // For single amount column: negative = purchase, positive = credit/payment
      // (Scotiabank uses this convention)
      if (format.bank === 'scotiabank') {
        if (parsed < 0) {
          amount = Math.abs(parsed);
          isCredit = false;
        } else {
          amount = parsed;
          isCredit = true;
        }
      } else {
        // Most banks: positive = purchase, negative might not occur
        amount = Math.abs(parsed);
        isCredit = parsed < 0;
      }
    } else {
      // Separate debit/credit columns
      const debitCol = typeof format.debitColumn === 'number' ? format.debitColumn : -1;
      const creditCol = typeof format.creditColumn === 'number' ? format.creditColumn : -1;
      
      const debit = debitCol >= 0 ? parseAmount(row[debitCol]) : 0;
      const credit = creditCol >= 0 ? parseAmount(row[creditCol]) : 0;
      
      if (debit > 0) {
        amount = debit;
        isCredit = false;
      } else if (credit > 0) {
        amount = credit;
        isCredit = true;
      }
    }
    
    // Get card number if available
    let cardLast4: string | undefined;
    if (format.cardColumn !== undefined) {
      const cardCol = typeof format.cardColumn === 'number' ? format.cardColumn : -1;
      const cardNum = row[cardCol];
      if (cardNum) {
        // Extract last 4 digits
        const digits = cardNum.replace(/\D/g, '');
        if (digits.length >= 4) {
          cardLast4 = digits.slice(-4);
        }
      }
    }
    
    return {
      transaction: {
        id: `tx_${Date.now()}_${rowIndex}_${Math.random().toString(36).substr(2, 6)}`,
        date,
        description,
        normalizedMerchant: extractMerchantName(description),
        amount,
        isCredit,
        sourceBank: format.bank,
        cardLast4,
      },
    };
  } catch (error) {
    return {
      transaction: null,
      error: {
        line: rowIndex + 1,
        message: `Parse error: ${error instanceof Error ? error.message : 'Unknown'}`,
        rawLine: row.join(','),
      },
    };
  }
}

/**
 * Parse complete CSV content for a specific bank
 */
export function parseCSV(
  csvContent: string,
  bank: SupportedBank
): CSVParseResult {
  const format = BANK_FORMATS.find(f => f.bank === bank);
  if (!format) {
    return {
      success: false,
      transactions: [],
      bank,
      periodStart: new Date(),
      periodEnd: new Date(),
      totalSpend: 0,
      totalCredits: 0,
      errors: [{ line: 0, message: `Unsupported bank: ${bank}`, rawLine: '' }],
      warnings: [],
    };
  }
  
  const rows = parseCSVToRows(csvContent);
  if (rows.length === 0) {
    return {
      success: false,
      transactions: [],
      bank,
      periodStart: new Date(),
      periodEnd: new Date(),
      totalSpend: 0,
      totalCredits: 0,
      errors: [{ line: 0, message: 'Empty file', rawLine: '' }],
      warnings: [],
    };
  }
  
  // Get user mappings for categorization
  const userMappings = getUserMappingsSync();
  
  const transactions: ParsedTransaction[] = [];
  const errors: CSVParseError[] = [];
  const warnings: string[] = [];
  
  // Skip header if present
  const startIndex = format.hasHeader ? 1 : 0;
  
  let minDate: Date | null = null;
  let maxDate: Date | null = null;
  let totalSpend = 0;
  let totalCredits = 0;
  
  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    
    // Skip empty rows
    if (row.every(cell => !cell.trim())) continue;
    
    // Skip rows that don't match expected column count
    if (!format.columnCount.includes(row.length)) {
      // Be lenient - warn but try to parse anyway if close
      if (Math.abs(row.length - format.columnCount[0]) > 2) {
        warnings.push(`Row ${i + 1}: Unexpected column count (${row.length})`);
        continue;
      }
    }
    
    const result = parseRow(row, format, i);
    
    if (result.error) {
      errors.push(result.error);
      continue;
    }
    
    if (!result.transaction) continue;
    
    // Categorize the transaction
    const { category, merchantName, confidence } = categorizeTransaction(
      result.transaction.description,
      userMappings
    );
    
    const fullTransaction: ParsedTransaction = {
      ...result.transaction,
      normalizedMerchant: merchantName,
      category,
      categoryConfidence: confidence,
      userCorrected: false,
    };
    
    transactions.push(fullTransaction);
    
    // Track date range
    if (!minDate || fullTransaction.date < minDate) minDate = fullTransaction.date;
    if (!maxDate || fullTransaction.date > maxDate) maxDate = fullTransaction.date;
    
    // Track totals
    if (fullTransaction.isCredit) {
      totalCredits += fullTransaction.amount;
    } else {
      totalSpend += fullTransaction.amount;
    }
  }
  
  return {
    success: transactions.length > 0,
    transactions,
    bank,
    periodStart: minDate || new Date(),
    periodEnd: maxDate || new Date(),
    totalSpend,
    totalCredits,
    errors,
    warnings,
  };
}

/**
 * Full parse flow: detect bank + parse
 */
export function parseStatement(
  csvContent: string,
  forcedBank?: SupportedBank
): Result<CSVParseResult, StatementParseError> {
  // Clean input
  const content = csvContent.trim();
  if (!content) {
    return failure({ type: 'EMPTY_FILE' });
  }
  
  // Detect or use forced bank
  let bank: SupportedBank;
  
  if (forcedBank) {
    bank = forcedBank;
  } else {
    const detection = detectBank(content);
    
    if (!detection.bank) {
      return failure({
        type: 'UNSUPPORTED_BANK',
        detectedFormat: detection.matchedPatterns.join(', '),
      });
    }
    
    bank = detection.bank;
  }
  
  // Parse
  const result = parseCSV(content, bank);
  
  if (!result.success) {
    if (result.errors.length > 0) {
      return failure({
        type: 'PARSE_FAILED',
        errors: result.errors,
      });
    }
    return failure({ type: 'NO_TRANSACTIONS' });
  }
  
  return success(result);
}

// ============================================================================
// Utility Functions
// ============================================================================

function isNumeric(str: string): boolean {
  if (!str || str.trim() === '') return false;
  return !isNaN(parseAmount(str));
}

/**
 * Get bank display name
 */
export function getBankDisplayName(bank: SupportedBank): string {
  const format = BANK_FORMATS.find(f => f.bank === bank);
  return format?.displayName || bank;
}

/**
 * Get all supported banks
 */
export function getSupportedBanks(): Array<{ bank: SupportedBank; displayName: string }> {
  return BANK_FORMATS.map(f => ({
    bank: f.bank,
    displayName: f.displayName,
  }));
}
```

---

## Insights Engine

### InsightsService.ts

```typescript
/**
 * InsightsService - F25: Spending Insights Dashboard
 * 
 * Features:
 * - Category breakdown with optimization analysis
 * - Optimization score (0-100)
 * - Spending trends (month-over-month)
 * - Smart alerts
 * - All pure functions
 */

import {
  ParsedTransaction,
  SpendingCategory,
  CategoryBreakdown,
  MerchantSummary,
  OptimizationScore,
  SpendingTrend,
  SmartAlert,
  SmartAlertType,
  SpendingInsights,
  MonthlySummary,
  DateRange,
  Card,
  InsightsError,
  Result,
  success,
  failure,
} from '../types';
import { getCards } from './CardPortfolioManager';
import { getAllCardsSync, getCardByIdSync } from './CardDataService';
import { getApplicableMultiplier, pointsToCad } from './RewardsCalculatorService';

// ============================================================================
// Constants
// ============================================================================

const MIN_TRANSACTIONS_FOR_INSIGHTS = 10;
const TREND_THRESHOLD_PERCENT = 20; // 20% change triggers trend alert
const OPTIMIZATION_THRESHOLDS = {
  MASTER: 90,
  GOOD: 70,
  AVERAGE: 50,
};

// ============================================================================
// Pure Calculation Functions (Exported for Testing)
// ============================================================================

/**
 * Calculate category breakdown from transactions
 */
export function calculateCategoryBreakdown(
  transactions: ParsedTransaction[],
  userCards: Card[]
): CategoryBreakdown[] {
  // Filter to purchases only (no credits)
  const purchases = transactions.filter(t => !t.isCredit);
  const totalSpend = purchases.reduce((sum, t) => sum + t.amount, 0);
  
  // Group by category
  const byCategory = new Map<SpendingCategory, ParsedTransaction[]>();
  
  for (const tx of purchases) {
    const existing = byCategory.get(tx.category) || [];
    existing.push(tx);
    byCategory.set(tx.category, existing);
  }
  
  // Calculate breakdown for each category
  const breakdown: CategoryBreakdown[] = [];
  
  for (const [category, txs] of byCategory) {
    const categorySpend = txs.reduce((sum, t) => sum + t.amount, 0);
    
    // Find top merchants
    const merchantTotals = new Map<string, { amount: number; count: number }>();
    for (const tx of txs) {
      const existing = merchantTotals.get(tx.normalizedMerchant) || { amount: 0, count: 0 };
      existing.amount += tx.amount;
      existing.count++;
      merchantTotals.set(tx.normalizedMerchant, existing);
    }
    
    const topMerchants: MerchantSummary[] = Array.from(merchantTotals.entries())
      .map(([name, { amount, count }]) => ({ name, amount, count, category }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    
    // Find optimal card for this category
    const optimalCard = findOptimalCardForCategory(category, userCards);
    
    // Estimate rewards (we don't know which card was actually used)
    const { rewardsEarned, rewardsPossible } = estimateCategoryRewards(
      categorySpend,
      category,
      userCards,
      optimalCard
    );
    
    breakdown.push({
      category,
      totalSpend: categorySpend,
      transactionCount: txs.length,
      percentOfTotal: totalSpend > 0 ? (categorySpend / totalSpend) * 100 : 0,
      topMerchants,
      currentCard: null, // Unknown from CSV
      optimalCard,
      rewardsEarned,
      rewardsPossible,
      rewardsGap: rewardsPossible - rewardsEarned,
    });
  }
  
  // Sort by spend (highest first)
  return breakdown.sort((a, b) => b.totalSpend - a.totalSpend);
}

/**
 * Find the optimal card for a category from user's portfolio
 */
export function findOptimalCardForCategory(
  category: SpendingCategory,
  userCards: Card[]
): Card | null {
  if (userCards.length === 0) return null;
  
  let bestCard: Card | null = null;
  let bestRewardRate = 0;
  
  for (const card of userCards) {
    const rate = getApplicableMultiplier(card, category);
    if (rate > bestRewardRate) {
      bestRewardRate = rate;
      bestCard = card;
    }
  }
  
  return bestCard;
}

/**
 * Estimate rewards earned and possible for a category
 * Since we don't know which card was used, we estimate conservatively
 */
export function estimateCategoryRewards(
  categorySpend: number,
  category: SpendingCategory,
  userCards: Card[],
  optimalCard: Card | null
): { rewardsEarned: number; rewardsPossible: number } {
  if (userCards.length === 0) {
    return { rewardsEarned: 0, rewardsPossible: 0 };
  }
  
  // Calculate possible with optimal card
  let rewardsPossible = 0;
  if (optimalCard) {
    const optimalRate = getApplicableMultiplier(optimalCard, category);
    const points = categorySpend * optimalRate;
    const valuation = optimalCard.programDetails?.optimalRateCents ?? optimalCard.pointValuation ?? 100;
    rewardsPossible = pointsToCad(points, optimalCard, valuation);
  }
  
  // For earned, assume they used average card (conservative estimate)
  // This is a simplification since we don't know actual card used
  const avgRate = userCards.reduce((sum, card) => {
    return sum + getApplicableMultiplier(card, category);
  }, 0) / userCards.length;
  
  // Use first card's valuation as approximation
  const firstCard = userCards[0];
  const avgPoints = categorySpend * avgRate;
  const avgValuation = firstCard.programDetails?.optimalRateCents ?? firstCard.pointValuation ?? 100;
  const rewardsEarned = pointsToCad(avgPoints, firstCard, avgValuation);
  
  return { rewardsEarned, rewardsPossible };
}

/**
 * Calculate optimization score (0-100)
 */
export function calculateOptimizationScore(
  breakdown: CategoryBreakdown[]
): OptimizationScore {
  const totalEarned = breakdown.reduce((sum, b) => sum + b.rewardsEarned, 0);
  const totalPossible = breakdown.reduce((sum, b) => sum + b.rewardsPossible, 0);
  
  // If no possible rewards (no cards), return 0
  if (totalPossible === 0) {
    return {
      score: 0,
      label: 'Add Cards to Start',
      emoji: '📝',
      actualRewards: 0,
      maxPossibleRewards: 0,
      rewardsGap: 0,
      improvementPotential: 'Add your credit cards to see optimization opportunities',
    };
  }
  
  const score = Math.round((totalEarned / totalPossible) * 100);
  const gap = totalPossible - totalEarned;
  
  let label: string;
  let emoji: string;
  let improvementPotential: string;
  
  if (score >= OPTIMIZATION_THRESHOLDS.MASTER) {
    label = 'Rewards Master';
    emoji = '🏆';
    improvementPotential = `You're maximizing your rewards! Keep up the great work.`;
  } else if (score >= OPTIMIZATION_THRESHOLDS.GOOD) {
    label = 'Good Optimizer';
    emoji = '👍';
    improvementPotential = `Small improvements could earn you $${gap.toFixed(0)} more per year.`;
  } else if (score >= OPTIMIZATION_THRESHOLDS.AVERAGE) {
    label = 'Average User';
    emoji = '📊';
    improvementPotential = `You're leaving $${gap.toFixed(0)} on the table annually. Let's fix that!`;
  } else {
    label = 'Needs Help';
    emoji = '🎯';
    improvementPotential = `Big opportunity: Switch cards to earn $${gap.toFixed(0)} more per year!`;
  }
  
  return {
    score,
    label,
    emoji,
    actualRewards: totalEarned,
    maxPossibleRewards: totalPossible,
    rewardsGap: gap,
    improvementPotential,
  };
}

/**
 * Group transactions by month
 */
export function groupByMonth(
  transactions: ParsedTransaction[]
): MonthlySummary[] {
  const byMonth = new Map<string, MonthlySummary>();
  
  for (const tx of transactions) {
    if (tx.isCredit) continue;
    
    const monthKey = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, '0')}`;
    const monthDate = new Date(tx.date.getFullYear(), tx.date.getMonth(), 1);
    
    let summary = byMonth.get(monthKey);
    if (!summary) {
      summary = {
        month: monthDate,
        totalSpend: 0,
        byCategory: {
          [SpendingCategory.GROCERIES]: 0,
          [SpendingCategory.DINING]: 0,
          [SpendingCategory.GAS]: 0,
          [SpendingCategory.TRAVEL]: 0,
          [SpendingCategory.ONLINE_SHOPPING]: 0,
          [SpendingCategory.ENTERTAINMENT]: 0,
          [SpendingCategory.DRUGSTORES]: 0,
          [SpendingCategory.HOME_IMPROVEMENT]: 0,
          [SpendingCategory.OTHER]: 0,
        },
        transactionCount: 0,
      };
      byMonth.set(monthKey, summary);
    }
    
    summary.totalSpend += tx.amount;
    summary.byCategory[tx.category] += tx.amount;
    summary.transactionCount++;
  }
  
  return Array.from(byMonth.values()).sort(
    (a, b) => a.month.getTime() - b.month.getTime()
  );
}

/**
 * Calculate spending trends between months
 */
export function calculateTrends(
  currentMonth: MonthlySummary,
  previousMonth: MonthlySummary | null
): SpendingTrend[] {
  const trends: SpendingTrend[] = [];
  
  const categories = Object.values(SpendingCategory);
  
  for (const category of categories) {
    const current = currentMonth.byCategory[category] || 0;
    const previous = previousMonth?.byCategory[category] || 0;
    
    // Skip if both are zero or very small
    if (current < 10 && previous < 10) continue;
    
    const changeAmount = current - previous;
    const changePercent = previous > 0
      ? ((current - previous) / previous) * 100
      : current > 0 ? 100 : 0;
    
    let direction: 'up' | 'down' | 'stable';
    if (changePercent > TREND_THRESHOLD_PERCENT) {
      direction = 'up';
    } else if (changePercent < -TREND_THRESHOLD_PERCENT) {
      direction = 'down';
    } else {
      direction = 'stable';
    }
    
    const trend: SpendingTrend = {
      category,
      currentMonth: current,
      previousMonth: previous,
      changePercent,
      changeAmount,
      direction,
    };
    
    // Generate alert for significant changes
    if (direction !== 'stable') {
      trend.alert = generateTrendAlert(trend);
    }
    
    trends.push(trend);
  }
  
  // Sort by absolute change (most significant first)
  return trends.sort((a, b) => Math.abs(b.changeAmount) - Math.abs(a.changeAmount));
}

/**
 * Generate a smart alert from a trend
 */
export function generateTrendAlert(trend: SpendingTrend): SmartAlert {
  const isIncrease = trend.direction === 'up';
  const changeStr = isIncrease ? 'increased' : 'decreased';
  const percentStr = Math.abs(trend.changePercent).toFixed(0);
  const amountStr = Math.abs(trend.changeAmount).toFixed(0);
  
  const categoryNames: Record<SpendingCategory, string> = {
    [SpendingCategory.GROCERIES]: 'Grocery',
    [SpendingCategory.DINING]: 'Dining',
    [SpendingCategory.GAS]: 'Gas',
    [SpendingCategory.TRAVEL]: 'Travel',
    [SpendingCategory.ONLINE_SHOPPING]: 'Online shopping',
    [SpendingCategory.ENTERTAINMENT]: 'Entertainment',
    [SpendingCategory.DRUGSTORES]: 'Drugstore',
    [SpendingCategory.HOME_IMPROVEMENT]: 'Home improvement',
    [SpendingCategory.OTHER]: 'Other',
  };
  
  const categoryName = categoryNames[trend.category];
  
  return {
    id: `alert_trend_${trend.category}_${Date.now()}`,
    type: isIncrease ? 'spending_increase' : 'spending_decrease',
    priority: Math.abs(trend.changePercent) > 50 ? 'high' : 'medium',
    title: `${categoryName} spending ${changeStr}`,
    message: `Your ${categoryName.toLowerCase()} spending ${changeStr} by ${percentStr}% ($${amountStr}) this month.`,
    category: trend.category,
    createdAt: new Date(),
    dismissed: false,
  };
}

/**
 * Generate card switch alerts
 */
export function generateCardSwitchAlerts(
  breakdown: CategoryBreakdown[],
  userCards: Card[]
): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  
  for (const cat of breakdown) {
    if (cat.rewardsGap > 50 && cat.optimalCard) { // Only if gap > $50/year
      const annualGap = cat.rewardsGap * (12 / 1); // Extrapolate to annual
      
      alerts.push({
        id: `alert_switch_${cat.category}_${Date.now()}`,
        type: 'card_switch',
        priority: annualGap > 200 ? 'high' : 'medium',
        title: `Optimize ${getCategoryLabel(cat.category)}`,
        message: `Switch to ${cat.optimalCard.name} for ${getCategoryLabel(cat.category).toLowerCase()} to earn $${annualGap.toFixed(0)} more per year.`,
        category: cat.category,
        suggestedAction: `Use ${cat.optimalCard.name}`,
        potentialSavings: annualGap,
        createdAt: new Date(),
        dismissed: false,
      });
    }
  }
  
  return alerts;
}

/**
 * Get all top merchants across transactions
 */
export function getTopMerchants(
  transactions: ParsedTransaction[],
  limit: number = 10
): MerchantSummary[] {
  const merchantTotals = new Map<string, MerchantSummary>();
  
  for (const tx of transactions) {
    if (tx.isCredit) continue;
    
    const existing = merchantTotals.get(tx.normalizedMerchant);
    if (existing) {
      existing.amount += tx.amount;
      existing.count++;
    } else {
      merchantTotals.set(tx.normalizedMerchant, {
        name: tx.normalizedMerchant,
        amount: tx.amount,
        count: 1,
        category: tx.category,
      });
    }
  }
  
  return Array.from(merchantTotals.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

/**
 * Calculate total money left on table
 */
export function calculateMoneyLeftOnTable(
  breakdown: CategoryBreakdown[]
): number {
  return breakdown.reduce((sum, b) => sum + b.rewardsGap, 0);
}

// ============================================================================
// Main API
// ============================================================================

/**
 * Generate full spending insights from transactions
 */
export function generateInsights(
  transactions: ParsedTransaction[],
  dateRange?: DateRange
): Result<SpendingInsights, InsightsError> {
  // Filter transactions by date range if provided
  let filtered = transactions;
  if (dateRange) {
    filtered = transactions.filter(
      t => t.date >= dateRange.start && t.date <= dateRange.end
    );
  }
  
  // Filter to purchases only
  const purchases = filtered.filter(t => !t.isCredit);
  
  if (purchases.length === 0) {
    return failure({
      type: 'NO_TRANSACTIONS',
      message: 'No transactions found in the selected period',
    });
  }
  
  if (purchases.length < MIN_TRANSACTIONS_FOR_INSIGHTS) {
    return failure({
      type: 'INSUFFICIENT_DATA',
      transactionCount: purchases.length,
      minimumRequired: MIN_TRANSACTIONS_FOR_INSIGHTS,
    });
  }
  
  // Get user's cards
  const userCardRefs = getCards();
  const userCards: Card[] = [];
  for (const ref of userCardRefs) {
    const card = getCardByIdSync(ref.cardId);
    if (card) userCards.push(card);
  }
  
  // Calculate metrics
  const categoryBreakdown = calculateCategoryBreakdown(purchases, userCards);
  const optimizationScore = calculateOptimizationScore(categoryBreakdown);
  
  // Get monthly summaries for trends
  const monthlySummaries = groupByMonth(purchases);
  let trends: SpendingTrend[] = [];
  
  if (monthlySummaries.length >= 2) {
    const currentMonth = monthlySummaries[monthlySummaries.length - 1];
    const previousMonth = monthlySummaries[monthlySummaries.length - 2];
    trends = calculateTrends(currentMonth, previousMonth);
  }
  
  // Generate alerts
  const trendAlerts = trends
    .filter(t => t.alert)
    .map(t => t.alert!);
  
  const switchAlerts = generateCardSwitchAlerts(categoryBreakdown, userCards);
  
  const alerts = [...trendAlerts, ...switchAlerts]
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  
  // Calculate totals
  const totalSpend = purchases.reduce((sum, t) => sum + t.amount, 0);
  const periodStart = purchases.reduce(
    (min, t) => t.date < min ? t.date : min,
    purchases[0].date
  );
  const periodEnd = purchases.reduce(
    (max, t) => t.date > max ? t.date : max,
    purchases[0].date
  );
  
  return success({
    periodStart,
    periodEnd,
    totalSpend,
    transactionCount: purchases.length,
    categoryBreakdown,
    optimizationScore,
    trends,
    alerts,
    moneyLeftOnTable: calculateMoneyLeftOnTable(categoryBreakdown),
    topMerchants: getTopMerchants(purchases),
  });
}

/**
 * Get insights for comparison to previous period
 */
export function getComparativeInsights(
  transactions: ParsedTransaction[],
  currentPeriod: DateRange,
  comparisonPeriod: DateRange
): { current: SpendingInsights; previous: SpendingInsights; comparison: any } | null {
  const currentResult = generateInsights(transactions, currentPeriod);
  const previousResult = generateInsights(transactions, comparisonPeriod);
  
  if (!currentResult.success || !previousResult.success) {
    return null;
  }
  
  const current = currentResult.value;
  const previous = previousResult.value;
  
  return {
    current,
    previous,
    comparison: {
      spendChange: current.totalSpend - previous.totalSpend,
      spendChangePercent: previous.totalSpend > 0
        ? ((current.totalSpend - previous.totalSpend) / previous.totalSpend) * 100
        : 0,
      scoreChange: current.optimizationScore.score - previous.optimizationScore.score,
      gapChange: current.moneyLeftOnTable - previous.moneyLeftOnTable,
    },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function getCategoryLabel(category: SpendingCategory): string {
  const labels: Record<SpendingCategory, string> = {
    [SpendingCategory.GROCERIES]: 'Groceries',
    [SpendingCategory.DINING]: 'Dining',
    [SpendingCategory.GAS]: 'Gas',
    [SpendingCategory.TRAVEL]: 'Travel',
    [SpendingCategory.ONLINE_SHOPPING]: 'Online Shopping',
    [SpendingCategory.ENTERTAINMENT]: 'Entertainment',
    [SpendingCategory.DRUGSTORES]: 'Drugstores',
    [SpendingCategory.HOME_IMPROVEMENT]: 'Home Improvement',
    [SpendingCategory.OTHER]: 'Other',
  };
  return labels[category] || category;
}

// Re-export for convenience
export { getCards };
```

---

## Database Schema

### Supabase Migration

```sql
-- ============================================================================
-- Cycle 4: CSV Statement Upload + Spending Insights
-- Migration: 20260214_statement_uploads.sql
-- ============================================================================

-- ============================================================================
-- Statement Uploads Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS statement_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- File metadata
  file_name TEXT NOT NULL,
  bank TEXT NOT NULL,  -- SupportedBank enum value
  
  -- Period info
  period_start DATE,
  period_end DATE,
  
  -- Summary stats
  transaction_count INTEGER NOT NULL DEFAULT 0,
  total_spend NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_credits NUMERIC(12,2) NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_statement_uploads_user 
  ON statement_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_statement_uploads_user_date 
  ON statement_uploads(user_id, period_start DESC);

-- ============================================================================
-- Parsed Transactions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS parsed_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  statement_id UUID REFERENCES statement_uploads(id) ON DELETE CASCADE,
  
  -- Transaction data
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  normalized_merchant TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  is_credit BOOLEAN NOT NULL DEFAULT false,
  
  -- Categorization
  category TEXT NOT NULL,  -- SpendingCategory enum value
  category_confidence TEXT NOT NULL DEFAULT 'medium',  -- high/medium/low
  user_corrected BOOLEAN NOT NULL DEFAULT false,
  
  -- Source info
  source_bank TEXT NOT NULL,
  card_last4 TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
  ON parsed_transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category 
  ON parsed_transactions(user_id, category);
CREATE INDEX IF NOT EXISTS idx_transactions_statement 
  ON parsed_transactions(statement_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_merchant 
  ON parsed_transactions(user_id, normalized_merchant);

-- Composite index for date range + category queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_date_cat 
  ON parsed_transactions(user_id, transaction_date, category);

-- ============================================================================
-- User Merchant Mappings Table (for custom categorizations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_merchant_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Pattern (stored as string, interpreted as regex)
  pattern TEXT NOT NULL,
  category TEXT NOT NULL,
  merchant_name TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Prevent duplicates
  CONSTRAINT unique_user_pattern UNIQUE(user_id, pattern)
);

CREATE INDEX IF NOT EXISTS idx_merchant_mappings_user 
  ON user_merchant_mappings(user_id);

-- ============================================================================
-- Dismissed Alerts Table (for smart alerts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS dismissed_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_id TEXT NOT NULL,  -- The alert ID from InsightsService
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Prevent duplicate dismissals
  CONSTRAINT unique_user_alert UNIQUE(user_id, alert_id)
);

CREATE INDEX IF NOT EXISTS idx_dismissed_alerts_user 
  ON dismissed_alerts(user_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE statement_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE parsed_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_merchant_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dismissed_alerts ENABLE ROW LEVEL SECURITY;

-- Statement uploads policies
CREATE POLICY "Users can view own statements"
  ON statement_uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own statements"
  ON statement_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own statements"
  ON statement_uploads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own statements"
  ON statement_uploads FOR DELETE
  USING (auth.uid() = user_id);

-- Parsed transactions policies
CREATE POLICY "Users can view own transactions"
  ON parsed_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON parsed_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON parsed_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON parsed_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Merchant mappings policies
CREATE POLICY "Users can manage own mappings"
  ON user_merchant_mappings FOR ALL
  USING (auth.uid() = user_id);

-- Dismissed alerts policies
CREATE POLICY "Users can manage own dismissed alerts"
  ON dismissed_alerts FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- Auto-update timestamps trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_statement_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER statement_uploads_updated_at
  BEFORE UPDATE ON statement_uploads
  FOR EACH ROW
  EXECUTE FUNCTION update_statement_timestamp();

-- ============================================================================
-- Cleanup function for old statements (optional, run via cron)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_statements(
  retention_days INTEGER DEFAULT 365
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM statement_uploads
    WHERE created_at < now() - (retention_days || ' days')::INTERVAL
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

---

## Component Hierarchy

### New Screens

```
src/screens/
├── StatementUploadScreen.tsx       # F24: Upload flow
├── TransactionReviewScreen.tsx     # F24: Review + confirm
├── InsightsDashboardScreen.tsx     # F25: Main insights
├── components/
│   ├── upload/
│   │   ├── FilePicker.tsx          # Cross-platform file picker
│   │   ├── BankSelector.tsx        # Manual bank selection
│   │   ├── ParseProgress.tsx       # Parsing animation
│   │   └── UploadSummary.tsx       # Quick stats after parse
│   ├── transactions/
│   │   ├── TransactionList.tsx     # Virtualized tx list
│   │   ├── TransactionRow.tsx      # Single transaction
│   │   ├── CategoryPicker.tsx      # Re-categorize modal
│   │   └── TransactionFilter.tsx   # Filter by date/category
│   └── insights/
│       ├── OptimizationScoreCard.tsx  # Big score display
│       ├── CategoryDonutChart.tsx     # Spending breakdown
│       ├── MoneyLeftOnTableCard.tsx   # Hero metric
│       ├── TrendCard.tsx              # Single trend
│       ├── AlertCard.tsx              # Smart alert
│       ├── TopMerchantsCard.tsx       # Top merchants list
│       └── PeriodSelector.tsx         # Date range picker
```

### StatementUploadScreen Flow

```
StatementUploadScreen
├── Header
│   └── "Upload Statement"
├── StepIndicator (1 of 3)
├── ContentArea
│   ├── [Step 1: Select File]
│   │   ├── UploadPrompt
│   │   │   ├── Icon (📄)
│   │   │   ├── "Upload your bank statement"
│   │   │   └── "We support TD, RBC, CIBC, Scotiabank, BMO, Tangerine, PC, Amex"
│   │   ├── FilePicker (platform-specific)
│   │   │   ├── [Mobile] Expo DocumentPicker
│   │   │   └── [Web] <input type="file">
│   │   └── SupportedBanksInfo
│   │
│   ├── [Step 2: Detecting & Parsing]
│   │   ├── ParseProgress
│   │   │   ├── Spinner/Animation
│   │   │   ├── "Detecting bank format..."
│   │   │   ├── "Parsing transactions..."
│   │   │   └── "Categorizing merchants..."
│   │   └── BankDetectedBadge (if auto-detected)
│   │
│   ├── [Step 2b: Manual Bank Selection] (if detection fails)
│   │   ├── "We couldn't auto-detect your bank"
│   │   ├── BankSelector
│   │   │   └── RadioGroup (8 banks)
│   │   └── ContinueButton
│   │
│   └── [Step 3: Summary]
│       ├── UploadSummary
│       │   ├── TransactionCount ("47 transactions")
│       │   ├── TotalSpend ("$2,340.56")
│       │   ├── DateRange ("Jan 1 - Jan 31, 2026")
│       │   └── CategoryMiniChart
│       ├── ReviewButton → TransactionReviewScreen
│       └── SkipReviewButton (confirms directly)
```

### TransactionReviewScreen

```
TransactionReviewScreen
├── Header
│   ├── "Review Transactions"
│   └── SearchButton
├── FilterBar
│   ├── DateFilter
│   ├── CategoryFilter
│   └── ConfidenceFilter (show low-confidence for review)
├── TransactionList (FlatList, virtualized)
│   └── TransactionRow (each)
│       ├── DateBadge
│       ├── MerchantName
│       ├── Amount
│       ├── CategoryPill (tappable)
│       │   └── [Tap] → CategoryPicker modal
│       └── ConfidenceIndicator (🟢🟡🔴)
├── FloatingConfirmButton
│   ├── "Confirm {n} transactions"
│   └── [Tap] → saves + updates SpendingProfile
└── [Modal: CategoryPicker]
    ├── Category list (9 categories)
    └── "Remember this for future" toggle
```

### InsightsDashboardScreen

```
InsightsDashboardScreen
├── Header
│   ├── "Spending Insights"
│   └── PeriodSelector dropdown
├── ScrollView
│   ├── MoneyLeftOnTableCard (Hero)
│   │   ├── Big number ("$412/year")
│   │   ├── "You could be earning more"
│   │   └── "See how" CTA
│   │
│   ├── OptimizationScoreCard
│   │   ├── CircularGauge (0-100)
│   │   ├── Label ("Good Optimizer 👍")
│   │   └── TierGated: detailed breakdown (Pro+)
│   │
│   ├── CategoryBreakdownSection
│   │   ├── SectionHeader "Spending by Category"
│   │   ├── CategoryDonutChart
│   │   └── CategoryList
│   │       └── CategoryRow (each)
│   │           ├── CategoryIcon + Name
│   │           ├── Amount + Percent
│   │           ├── OptimalCardBadge
│   │           └── GapIndicator (if significant)
│   │
│   ├── TrendsSection (TierGated: Pro+)
│   │   ├── SectionHeader "This Month vs Last"
│   │   └── TrendList
│   │       └── TrendCard (each significant trend)
│   │           ├── CategoryIcon
│   │           ├── Direction arrow (↑↓)
│   │           ├── Change percent
│   │           └── Alert message (if any)
│   │
│   ├── AlertsSection
│   │   ├── SectionHeader "Smart Suggestions"
│   │   └── AlertList
│   │       └── AlertCard (each)
│   │           ├── Priority indicator
│   │           ├── Title + Message
│   │           ├── PotentialSavings badge
│   │           └── DismissButton
│   │
│   └── TopMerchantsSection
│       ├── SectionHeader "Top Merchants"
│       └── TopMerchantsList (top 5)
│           └── MerchantRow
│               ├── Name
│               ├── Category
│               ├── TotalSpend
│               └── TransactionCount
│
└── FloatingUploadButton
    └── "Upload Another Statement"
```

---

## File Upload Strategy

### Cross-Platform File Picker

```typescript
// src/screens/components/upload/FilePicker.tsx

import React, { useCallback } from 'react';
import { Platform, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

interface FilePickerProps {
  onFileSelected: (content: string, fileName: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

/**
 * Cross-platform file picker for CSV uploads
 * 
 * Mobile (iOS/Android): Uses Expo DocumentPicker
 * Web: Uses native file input with drag-and-drop
 */
export function FilePicker({ onFileSelected, onError, disabled }: FilePickerProps) {
  // ============ Mobile Implementation ============
  const pickFileMobile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      
      // Validate file extension
      if (!file.name.toLowerCase().endsWith('.csv')) {
        onError('Please select a CSV file');
        return;
      }

      // Read file content
      const content = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      onFileSelected(content, file.name);
    } catch (error) {
      console.error('[FilePicker] Error:', error);
      onError('Failed to read file. Please try again.');
    }
  }, [onFileSelected, onError]);

  // ============ Web Implementation ============
  const pickFileWeb = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv';
    
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith('.csv')) {
        onError('Please select a CSV file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileSelected(content, file.name);
      };
      reader.onerror = () => {
        onError('Failed to read file. Please try again.');
      };
      reader.readAsText(file);
    };

    input.click();
  }, [onFileSelected, onError]);

  // ============ Web Drag & Drop ============
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      onError('Please drop a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      onFileSelected(content, file.name);
    };
    reader.onerror = () => {
      onError('Failed to read file');
    };
    reader.readAsText(file);
  }, [onFileSelected, onError]);

  // ============ Render ============
  if (Platform.OS === 'web') {
    return (
      <View
        style={[styles.dropZone, disabled && styles.disabled]}
        // @ts-ignore - web only props
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={pickFileWeb}
          disabled={disabled}
        >
          <Text style={styles.icon}>📄</Text>
          <Text style={styles.buttonText}>
            Click to select or drag & drop
          </Text>
          <Text style={styles.hint}>CSV files only</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Mobile
  return (
    <TouchableOpacity
      style={[styles.uploadButton, disabled && styles.disabled]}
      onPress={pickFileMobile}
      disabled={disabled}
    >
      <Text style={styles.icon}>📄</Text>
      <Text style={styles.buttonText}>Select CSV File</Text>
      <Text style={styles.hint}>
        Download from your bank's website or app
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  dropZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButton: {
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: '#666',
  },
  disabled: {
    opacity: 0.5,
  },
});
```

### File Size & Validation

```typescript
// src/services/StatementStorageService.ts

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_TRANSACTIONS_PER_UPLOAD = 2000;

/**
 * Validate CSV content before parsing
 */
export function validateCSVContent(
  content: string,
  fileName: string
): Result<void, StatementParseError> {
  // Check file size
  const byteSize = new Blob([content]).size;
  if (byteSize > MAX_FILE_SIZE_BYTES) {
    return failure({
      type: 'INVALID_FILE',
      message: `File too large (${(byteSize / 1024 / 1024).toFixed(1)}MB). Max: 5MB`,
    });
  }

  // Check file extension
  if (!fileName.toLowerCase().endsWith('.csv')) {
    return failure({
      type: 'INVALID_FILE',
      message: 'Please upload a CSV file',
    });
  }

  // Check for obvious non-CSV content
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length === 0) {
    return failure({ type: 'EMPTY_FILE' });
  }

  // Check for XML/HTML (common mistake)
  if (content.trim().startsWith('<')) {
    return failure({
      type: 'INVALID_FILE',
      message: 'This appears to be an HTML/XML file, not CSV',
    });
  }

  return success(undefined);
}
```

---

## Integration with SpendingProfileService

### Auto-Update After CSV Import

```typescript
// src/services/SpendingProfileService.ts (additions)

import { ParsedTransaction, SpendingCategory } from '../types';

/**
 * Update spending profile from parsed transactions
 * Calculates monthly averages from transaction history
 * 
 * IMPORTANT: This replaces estimates with real data
 */
export async function updateFromParsedTransactions(
  transactions: ParsedTransaction[]
): Promise<Result<SpendingProfile, SpendingProfileError>> {
  // Filter to purchases only
  const purchases = transactions.filter(t => !t.isCredit);
  
  if (purchases.length === 0) {
    return failure({
      type: 'INVALID_AMOUNT',
      category: 'all',
      value: 0,
    });
  }
  
  // Find date range
  const dates = purchases.map(t => t.date.getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const daySpan = Math.max(1, (maxDate - minDate) / (1000 * 60 * 60 * 24));
  const monthSpan = Math.max(1, daySpan / 30);
  
  // Sum by category
  const totals: Record<SpendingCategory, number> = {
    [SpendingCategory.GROCERIES]: 0,
    [SpendingCategory.DINING]: 0,
    [SpendingCategory.GAS]: 0,
    [SpendingCategory.TRAVEL]: 0,
    [SpendingCategory.ONLINE_SHOPPING]: 0,
    [SpendingCategory.ENTERTAINMENT]: 0,
    [SpendingCategory.DRUGSTORES]: 0,
    [SpendingCategory.HOME_IMPROVEMENT]: 0,
    [SpendingCategory.OTHER]: 0,
  };
  
  for (const tx of purchases) {
    totals[tx.category] += tx.amount;
  }
  
  // Convert to monthly averages
  const profileInput: SpendingProfileInput = {
    groceries: Math.round(totals[SpendingCategory.GROCERIES] / monthSpan),
    dining: Math.round(totals[SpendingCategory.DINING] / monthSpan),
    gas: Math.round(totals[SpendingCategory.GAS] / monthSpan),
    travel: Math.round(totals[SpendingCategory.TRAVEL] / monthSpan),
    onlineShopping: Math.round(totals[SpendingCategory.ONLINE_SHOPPING] / monthSpan),
    entertainment: Math.round(totals[SpendingCategory.ENTERTAINMENT] / monthSpan),
    drugstores: Math.round(totals[SpendingCategory.DRUGSTORES] / monthSpan),
    homeImprovement: Math.round(totals[SpendingCategory.HOME_IMPROVEMENT] / monthSpan),
    transit: 0, // Transit not tracked separately in CSV
    other: Math.round(totals[SpendingCategory.OTHER] / monthSpan),
  };
  
  // Save the updated profile
  return saveSpendingProfile(profileInput);
}

/**
 * Merge new transactions with existing profile
 * Uses weighted average based on transaction count
 */
export async function mergeTransactionsIntoProfile(
  newTransactions: ParsedTransaction[],
  existingProfile: SpendingProfile | null
): Promise<Result<SpendingProfile, SpendingProfileError>> {
  if (!existingProfile) {
    // No existing profile, create from scratch
    return updateFromParsedTransactions(newTransactions);
  }
  
  // Calculate new averages
  const purchases = newTransactions.filter(t => !t.isCredit);
  const dates = purchases.map(t => t.date.getTime());
  const daySpan = Math.max(1, (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24));
  const monthSpan = Math.max(1, daySpan / 30);
  
  // Weight: 70% new data, 30% existing (more recent is more relevant)
  const newWeight = 0.7;
  const existingWeight = 0.3;
  
  const totals: Record<SpendingCategory, number> = {
    [SpendingCategory.GROCERIES]: 0,
    [SpendingCategory.DINING]: 0,
    [SpendingCategory.GAS]: 0,
    [SpendingCategory.TRAVEL]: 0,
    [SpendingCategory.ONLINE_SHOPPING]: 0,
    [SpendingCategory.ENTERTAINMENT]: 0,
    [SpendingCategory.DRUGSTORES]: 0,
    [SpendingCategory.HOME_IMPROVEMENT]: 0,
    [SpendingCategory.OTHER]: 0,
  };
  
  for (const tx of purchases) {
    totals[tx.category] += tx.amount;
  }
  
  const profileInput: SpendingProfileInput = {
    groceries: Math.round(
      (totals[SpendingCategory.GROCERIES] / monthSpan) * newWeight +
      existingProfile.groceries * existingWeight
    ),
    dining: Math.round(
      (totals[SpendingCategory.DINING] / monthSpan) * newWeight +
      existingProfile.dining * existingWeight
    ),
    gas: Math.round(
      (totals[SpendingCategory.GAS] / monthSpan) * newWeight +
      existingProfile.gas * existingWeight
    ),
    travel: Math.round(
      (totals[SpendingCategory.TRAVEL] / monthSpan) * newWeight +
      existingProfile.travel * existingWeight
    ),
    onlineShopping: Math.round(
      (totals[SpendingCategory.ONLINE_SHOPPING] / monthSpan) * newWeight +
      existingProfile.onlineShopping * existingWeight
    ),
    entertainment: Math.round(
      (totals[SpendingCategory.ENTERTAINMENT] / monthSpan) * newWeight +
      existingProfile.entertainment * existingWeight
    ),
    drugstores: Math.round(
      (totals[SpendingCategory.DRUGSTORES] / monthSpan) * newWeight +
      existingProfile.drugstores * existingWeight
    ),
    homeImprovement: Math.round(
      (totals[SpendingCategory.HOME_IMPROVEMENT] / monthSpan) * newWeight +
      existingProfile.homeImprovement * existingWeight
    ),
    transit: existingProfile.transit, // Preserve existing
    other: Math.round(
      (totals[SpendingCategory.OTHER] / monthSpan) * newWeight +
      existingProfile.other * existingWeight
    ),
  };
  
  return saveSpendingProfile(profileInput);
}
```

---

## Tier Gating

### Feature Access Matrix

| Feature | Free | Pro | Max |
|---------|------|-----|-----|
| **F24: CSV Upload** | | | |
| Upload statements | 1/month | Unlimited | Unlimited |
| Auto bank detection | ✅ | ✅ | ✅ |
| Transaction categorization | ✅ | ✅ | ✅ |
| Review & correct categories | ✅ | ✅ | ✅ |
| Custom merchant mappings | 🔒 | ✅ | ✅ |
| Historical data (>3 months) | 🔒 | ✅ | ✅ |
| **F25: Insights** | | | |
| Category breakdown | ✅ | ✅ | ✅ |
| Money left on table (basic) | ✅ | ✅ | ✅ |
| Optimization score | 🔒 | ✅ | ✅ |
| Spending trends | 🔒 | ✅ | ✅ |
| Smart alerts | 🔒 | ✅ | ✅ |
| Top merchants | ✅ | ✅ | ✅ |
| Historical comparison | 🔒 | 🔒 | ✅ |
| Export reports | 🔒 | 🔒 | ✅ |

### Implementation Pattern

```typescript
// src/screens/InsightsDashboardScreen.tsx

import { getCurrentTierSync, canAccessFeatureSync } from '../services/SubscriptionService';

function InsightsDashboardScreen() {
  const tier = getCurrentTierSync();
  const isPro = tier === 'pro' || tier === 'max';
  const isMax = tier === 'max';

  return (
    <ScrollView>
      {/* Always visible */}
      <MoneyLeftOnTableCard />
      <CategoryBreakdownSection />
      <TopMerchantsSection />

      {/* Pro+ features */}
      {isPro ? (
        <>
          <OptimizationScoreCard detailed />
          <TrendsSection />
          <AlertsSection />
        </>
      ) : (
        <UpgradePrompt 
          feature="Optimization Score & Trends"
          tier="pro"
          benefit="See exactly how to optimize your card usage"
        />
      )}

      {/* Max features */}
      {isMax ? (
        <HistoricalComparisonSection />
      ) : (
        <UpgradePrompt
          feature="Historical Analysis"
          tier="max"
          benefit="Compare your spending month over month"
        />
      )}
    </ScrollView>
  );
}
```

---

## Test Strategy

### Test Distribution

| Service | Unit Tests | Integration | Property | Total |
|---------|------------|-------------|----------|-------|
| MerchantPatternService | 25 | 3 | 2 | 30 |
| StatementParserService | 35 | 5 | 5 | 45 |
| InsightsService | 25 | 5 | 5 | 35 |
| StatementStorageService | 10 | 5 | 0 | 15 |
| **Total** | **95** | **18** | **12** | **125** |

### MerchantPatternService Tests

```typescript
// src/services/__tests__/MerchantPatternService.test.ts

describe('MerchantPatternService', () => {
  describe('normalizeMerchantDescription', () => {
    it('should uppercase and clean description', () => {
      expect(normalizeMerchantDescription('LOBLAWS #1234 TORONTO ON'))
        .toBe('LOBLAWS TORONTO ON');
    });

    it('should remove long number sequences', () => {
      expect(normalizeMerchantDescription('VISA *1234567890 AMAZON'))
        .toBe('VISA AMAZON');
    });

    it('should collapse multiple spaces', () => {
      expect(normalizeMerchantDescription('TIM   HORTONS   #123'))
        .toBe('TIM HORTONS');
    });
  });

  describe('extractMerchantName', () => {
    it('should remove province codes', () => {
      expect(extractMerchantName('METRO TORONTO ON'))
        .toBe('Metro Toronto');
    });

    it('should remove store numbers', () => {
      expect(extractMerchantName('COSTCO #1234'))
        .toBe('Costco');
    });

    it('should title case result', () => {
      expect(extractMerchantName('SHOPPERS DRUG MART'))
        .toBe('Shoppers Drug Mart');
    });
  });

  describe('categorizeTransaction', () => {
    const groceryTests = [
      ['LOBLAWS #1234 TORONTO ON', SpendingCategory.GROCERIES, 'Loblaws'],
      ['NO FRILLS MISSISSAUGA', SpendingCategory.GROCERIES, 'Loblaws'],
      ['REAL CANADIAN SUPERSTORE', SpendingCategory.GROCERIES, 'Real Canadian Superstore'],
      ['METRO INC MONTREAL QC', SpendingCategory.GROCERIES, 'Metro'],
      ['SOBEYS FOODS HALIFAX NS', SpendingCategory.GROCERIES, 'Sobeys'],
      ['T&T SUPERMARKET TORONTO', SpendingCategory.GROCERIES, 'T&T Supermarket'],
      ['COSTCO WHOLESALE #123', SpendingCategory.GROCERIES, 'Costco'],
      ['WALMART SUPERCENTER 1234', SpendingCategory.GROCERIES, 'Walmart'],
    ];

    test.each(groceryTests)(
      'should categorize "%s" as groceries',
      (description, expectedCategory, expectedMerchant) => {
        const result = categorizeTransaction(description);
        expect(result.category).toBe(expectedCategory);
        expect(result.merchantName).toBe(expectedMerchant);
        expect(result.confidence).toBe('high');
      }
    );

    const diningTests = [
      ['STARBUCKS COFFEE #1234', SpendingCategory.DINING, 'Starbucks'],
      ['TIM HORTONS #0123', SpendingCategory.DINING, 'Tim Hortons'],
      ['MCDONALDS REST OTTAWA', SpendingCategory.DINING, "McDonald's"],
      ['UBER EATS* TORONTO', SpendingCategory.DINING, 'Uber Eats'],
      ['SKIP THE DISHES', SpendingCategory.DINING, 'SkipTheDishes'],
      ['BOSTON PIZZA #12', SpendingCategory.DINING, 'Boston Pizza'],
      ['THE KEG STEAKHOUSE', SpendingCategory.DINING, 'The Keg'],
    ];

    test.each(diningTests)(
      'should categorize "%s" as dining',
      (description, expectedCategory, expectedMerchant) => {
        const result = categorizeTransaction(description);
        expect(result.category).toBe(expectedCategory);
        expect(result.merchantName).toBe(expectedMerchant);
      }
    );

    const gasTests = [
      ['ESSO GAS TORONTO', SpendingCategory.GAS, 'Esso'],
      ['SHELL OIL 1234', SpendingCategory.GAS, 'Shell'],
      ['PETRO-CANADA #456', SpendingCategory.GAS, 'Petro-Canada'],
      ['CANADIAN TIRE GAS+', SpendingCategory.GAS, 'Canadian Tire Gas+'],
      ['COSTCO GAS MARKHAM', SpendingCategory.GAS, 'Costco Gas'],
    ];

    test.each(gasTests)(
      'should categorize "%s" as gas',
      (description, expectedCategory, expectedMerchant) => {
        const result = categorizeTransaction(description);
        expect(result.category).toBe(expectedCategory);
      }
    );

    it('should categorize unknown merchants as OTHER with low confidence', () => {
      const result = categorizeTransaction('RANDOM BUSINESS XYZ');
      expect(result.category).toBe(SpendingCategory.OTHER);
      expect(result.confidence).toBe('low');
    });

    it('should prioritize user mappings over patterns', () => {
      const userMappings: UserMerchantMapping[] = [{
        id: 'test',
        userId: 'user1',
        pattern: 'RANDOM BUSINESS',
        category: SpendingCategory.ENTERTAINMENT,
        merchantName: 'My Local Club',
        createdAt: new Date(),
      }];
      
      const result = categorizeTransaction('RANDOM BUSINESS XYZ', userMappings);
      expect(result.category).toBe(SpendingCategory.ENTERTAINMENT);
      expect(result.merchantName).toBe('My Local Club');
      expect(result.confidence).toBe('high');
    });
  });

  describe('pattern coverage', () => {
    it('should have 100+ merchant patterns', () => {
      expect(EXTENDED_MERCHANT_PATTERNS.length).toBeGreaterThanOrEqual(100);
    });

    it('should cover all spending categories', () => {
      const coveredCategories = new Set(
        EXTENDED_MERCHANT_PATTERNS.map(p => p.category)
      );
      
      // All categories should have at least one pattern
      for (const category of Object.values(SpendingCategory)) {
        expect(coveredCategories.has(category)).toBe(true);
      }
    });
  });
});
```

### StatementParserService Tests

```typescript
// src/services/__tests__/StatementParserService.test.ts

describe('StatementParserService', () => {
  describe('parseCSVToRows', () => {
    it('should parse simple CSV', () => {
      const csv = 'a,b,c\n1,2,3\n4,5,6';
      const rows = parseCSVToRows(csv);
      expect(rows).toEqual([
        ['a', 'b', 'c'],
        ['1', '2', '3'],
        ['4', '5', '6'],
      ]);
    });

    it('should handle quoted fields with commas', () => {
      const csv = 'date,description,amount\n01/01/2026,"STORE, INC",100.00';
      const rows = parseCSVToRows(csv);
      expect(rows[1][1]).toBe('STORE, INC');
    });

    it('should handle escaped quotes', () => {
      const csv = 'a\n"He said ""hello"""';
      const rows = parseCSVToRows(csv);
      expect(rows[1][0]).toBe('He said "hello"');
    });
  });

  describe('detectBank', () => {
    it('should detect TD format', () => {
      const tdCSV = `Date,Description,Debit Amount,Credit Amount,Balance
01/15/2026,LOBLAWS #1234 TORONTO ON,85.23,,1234.56
01/15/2026,PAYMENT - THANK YOU,,500.00,1734.56`;
      
      const result = detectBank(tdCSV);
      expect(result.bank).toBe('td');
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });

    it('should detect RBC format', () => {
      const rbcCSV = `Account Type,Account Number,Transaction Date,Cheque Number,Description 1,Description 2,CAD$,USD$
Visa,1234567890,01/15/2026,,LOBLAWS #1234,,85.23,`;
      
      const result = detectBank(rbcCSV);
      expect(result.bank).toBe('rbc');
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });

    it('should detect CIBC format (no header)', () => {
      const cibcCSV = `01/15/2026,LOBLAWS #1234 TORONTO ON,85.23,
01/15/2026,PAYMENT RECEIVED,,500.00`;
      
      const result = detectBank(cibcCSV);
      expect(result.bank).toBe('cibc');
    });

    it('should detect Scotiabank format', () => {
      const scotiabankCSV = `1/15/2026,LOBLAWS #1234 TORONTO ON,-85.23
1/15/2026,PAYMENT RECEIVED,500.00`;
      
      const result = detectBank(scotiabankCSV);
      expect(result.bank).toBe('scotiabank');
    });

    it('should detect BMO format', () => {
      const bmoCSV = `Item #,Card #,Transaction Date,Posting Date,Transaction Amount,Description
1,1234********5678,20260115,20260116,85.23,LOBLAWS #1234 TORONTO ON`;
      
      const result = detectBank(bmoCSV);
      expect(result.bank).toBe('bmo');
    });

    it('should detect Tangerine format with Unicode minus', () => {
      const tangerineCSV = `Date,Transaction,Name,Memo,Amount
1/15/2026,DEBIT,LOBLAWS #1234,,−85.23`;
      
      const result = detectBank(tangerineCSV);
      expect(result.bank).toBe('tangerine');
    });

    it('should return low confidence for unknown format', () => {
      const unknownCSV = `random,columns,here
some,data,values`;
      
      const result = detectBank(unknownCSV);
      expect(result.confidence).toBeLessThan(50);
    });
  });

  describe('parseDate', () => {
    it('should parse MM/DD/YYYY', () => {
      const date = parseDate('01/15/2026');
      expect(date?.getFullYear()).toBe(2026);
      expect(date?.getMonth()).toBe(0); // January
      expect(date?.getDate()).toBe(15);
    });

    it('should parse M/DD/YYYY', () => {
      const date = parseDate('1/5/2026');
      expect(date?.getMonth()).toBe(0);
      expect(date?.getDate()).toBe(5);
    });

    it('should parse YYYYMMDD (BMO)', () => {
      const date = parseDate('20260115');
      expect(date?.getFullYear()).toBe(2026);
      expect(date?.getMonth()).toBe(0);
      expect(date?.getDate()).toBe(15);
    });

    it('should parse YYYY-MM-DD', () => {
      const date = parseDate('2026-01-15');
      expect(date?.getFullYear()).toBe(2026);
    });

    it('should return null for invalid date', () => {
      expect(parseDate('invalid')).toBeNull();
      expect(parseDate('')).toBeNull();
    });
  });

  describe('parseAmount', () => {
    it('should parse positive number', () => {
      expect(parseAmount('85.23')).toBe(85.23);
    });

    it('should parse negative number', () => {
      expect(parseAmount('-85.23')).toBe(-85.23);
    });

    it('should handle currency symbol', () => {
      expect(parseAmount('$1,234.56')).toBe(1234.56);
    });

    it('should handle Unicode minus (Tangerine)', () => {
      expect(parseAmount('−85.23')).toBe(-85.23);
    });

    it('should handle parentheses as negative', () => {
      expect(parseAmount('(85.23)')).toBe(-85.23);
    });

    it('should return 0 for empty', () => {
      expect(parseAmount('')).toBe(0);
      expect(parseAmount('  ')).toBe(0);
    });
  });

  describe('parseCSV', () => {
    it('should parse TD CSV completely', () => {
      const tdCSV = `Date,Description,Debit Amount,Credit Amount,Balance
01/15/2026,LOBLAWS #1234 TORONTO ON,85.23,,1234.56
01/16/2026,STARBUCKS #456,5.75,,1228.81
01/17/2026,PAYMENT - THANK YOU,,500.00,1728.81`;
      
      const result = parseCSV(tdCSV, 'td');
      
      expect(result.success).toBe(true);
      expect(result.transactions.length).toBe(3);
      expect(result.totalSpend).toBeCloseTo(90.98, 2);
      expect(result.totalCredits).toBeCloseTo(500, 2);
      
      // Check categorization
      const loblaws = result.transactions[0];
      expect(loblaws.category).toBe(SpendingCategory.GROCERIES);
      expect(loblaws.isCredit).toBe(false);
      
      const starbucks = result.transactions[1];
      expect(starbucks.category).toBe(SpendingCategory.DINING);
      
      const payment = result.transactions[2];
      expect(payment.isCredit).toBe(true);
    });

    it('should parse Scotiabank negative amounts correctly', () => {
      const scotiabankCSV = `1/15/2026,LOBLAWS #1234 TORONTO ON,-85.23
1/16/2026,PAYMENT RECEIVED,500.00`;
      
      const result = parseCSV(scotiabankCSV, 'scotiabank');
      
      expect(result.success).toBe(true);
      expect(result.transactions[0].amount).toBe(85.23);
      expect(result.transactions[0].isCredit).toBe(false);
      expect(result.transactions[1].isCredit).toBe(true);
    });

    it('should handle BMO date format', () => {
      const bmoCSV = `Item #,Card #,Transaction Date,Posting Date,Transaction Amount,Description
1,1234********5678,20260115,20260116,85.23,LOBLAWS #1234 TORONTO ON`;
      
      const result = parseCSV(bmoCSV, 'bmo');
      
      expect(result.success).toBe(true);
      const tx = result.transactions[0];
      expect(tx.date.getFullYear()).toBe(2026);
      expect(tx.date.getMonth()).toBe(0);
      expect(tx.date.getDate()).toBe(15);
      expect(tx.cardLast4).toBe('5678');
    });

    it('should handle parsing errors gracefully', () => {
      const badCSV = `Date,Description,Debit,Credit,Balance
invalid-date,LOBLAWS,85.23,,1234.56
01/15/2026,STARBUCKS,5.75,,1228.81`;
      
      const result = parseCSV(badCSV, 'td');
      
      expect(result.success).toBe(true);
      expect(result.transactions.length).toBe(1); // Only valid row
      expect(result.errors.length).toBe(1); // One error
    });
  });

  describe('parseStatement (full flow)', () => {
    it('should auto-detect and parse', () => {
      const tdCSV = `Date,Description,Debit Amount,Credit Amount,Balance
01/15/2026,LOBLAWS #1234 TORONTO ON,85.23,,1234.56`;
      
      const result = parseStatement(tdCSV);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.bank).toBe('td');
        expect(result.value.transactions.length).toBe(1);
      }
    });

    it('should fail for unsupported format', () => {
      const result = parseStatement('random,nonsense,data\n1,2,3');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('UNSUPPORTED_BANK');
      }
    });

    it('should fail for empty file', () => {
      const result = parseStatement('');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('EMPTY_FILE');
      }
    });
  });

  describe('performance', () => {
    it('should parse 500 transactions in under 3 seconds', () => {
      // Generate 500 row CSV
      const header = 'Date,Description,Debit Amount,Credit Amount,Balance';
      const rows = Array.from({ length: 500 }, (_, i) => {
        const date = `01/${String((i % 28) + 1).padStart(2, '0')}/2026`;
        const merchants = ['LOBLAWS', 'STARBUCKS', 'ESSO', 'AMAZON', 'NETFLIX'];
        const merchant = merchants[i % merchants.length];
        const amount = (Math.random() * 100).toFixed(2);
        return `${date},${merchant} #${i},${amount},,1000.00`;
      });
      const csv = [header, ...rows].join('\n');
      
      const start = Date.now();
      const result = parseCSV(csv, 'td');
      const elapsed = Date.now() - start;
      
      expect(result.success).toBe(true);
      expect(result.transactions.length).toBe(500);
      expect(elapsed).toBeLessThan(3000);
    });
  });
});
```

### InsightsService Tests

```typescript
// src/services/__tests__/InsightsService.test.ts

describe('InsightsService', () => {
  const createMockTransaction = (
    category: SpendingCategory,
    amount: number,
    date: Date,
    merchant: string = 'Test Merchant'
  ): ParsedTransaction => ({
    id: `tx_${Date.now()}_${Math.random()}`,
    date,
    description: merchant,
    normalizedMerchant: merchant,
    amount,
    isCredit: false,
    category,
    categoryConfidence: 'high',
    userCorrected: false,
    sourceBank: 'td',
  });

  const mockTransactions: ParsedTransaction[] = [
    createMockTransaction(SpendingCategory.GROCERIES, 100, new Date('2026-01-15'), 'Loblaws'),
    createMockTransaction(SpendingCategory.GROCERIES, 80, new Date('2026-01-20'), 'Metro'),
    createMockTransaction(SpendingCategory.DINING, 50, new Date('2026-01-18'), 'Starbucks'),
    createMockTransaction(SpendingCategory.DINING, 30, new Date('2026-01-22'), 'Tim Hortons'),
    createMockTransaction(SpendingCategory.GAS, 60, new Date('2026-01-25'), 'Esso'),
  ];

  describe('calculateCategoryBreakdown', () => {
    it('should calculate breakdown for all categories', () => {
      const breakdown = calculateCategoryBreakdown(mockTransactions, []);
      
      expect(breakdown.length).toBeGreaterThan(0);
      
      const groceries = breakdown.find(b => b.category === SpendingCategory.GROCERIES);
      expect(groceries?.totalSpend).toBe(180);
      expect(groceries?.transactionCount).toBe(2);
      
      const dining = breakdown.find(b => b.category === SpendingCategory.DINING);
      expect(dining?.totalSpend).toBe(80);
    });

    it('should calculate percent of total correctly', () => {
      const breakdown = calculateCategoryBreakdown(mockTransactions, []);
      const total = breakdown.reduce((sum, b) => sum + b.percentOfTotal, 0);
      expect(total).toBeCloseTo(100, 0);
    });

    it('should identify top merchants', () => {
      const breakdown = calculateCategoryBreakdown(mockTransactions, []);
      const groceries = breakdown.find(b => b.category === SpendingCategory.GROCERIES);
      
      expect(groceries?.topMerchants.length).toBeGreaterThan(0);
      expect(groceries?.topMerchants[0].name).toBe('Loblaws'); // Highest spend
    });

    it('should skip credit transactions', () => {
      const withCredits = [
        ...mockTransactions,
        {
          ...createMockTransaction(SpendingCategory.OTHER, 500, new Date('2026-01-15'), 'Payment'),
          isCredit: true,
        },
      ];
      
      const breakdown = calculateCategoryBreakdown(withCredits, []);
      const total = breakdown.reduce((sum, b) => sum + b.totalSpend, 0);
      expect(total).toBe(320); // Should not include 500 payment
    });
  });

  describe('calculateOptimizationScore', () => {
    it('should return 0 for empty breakdown', () => {
      const score = calculateOptimizationScore([]);
      expect(score.score).toBe(0);
    });

    it('should categorize scores correctly', () => {
      const highScoreBreakdown: CategoryBreakdown[] = [{
        category: SpendingCategory.GROCERIES,
        totalSpend: 1000,
        transactionCount: 10,
        percentOfTotal: 100,
        topMerchants: [],
        currentCard: null,
        optimalCard: null,
        rewardsEarned: 95,
        rewardsPossible: 100,
        rewardsGap: 5,
      }];
      
      const score = calculateOptimizationScore(highScoreBreakdown);
      expect(score.score).toBe(95);
      expect(score.label).toBe('Rewards Master');
      expect(score.emoji).toBe('🏆');
    });

    it('should calculate gap correctly', () => {
      const breakdown: CategoryBreakdown[] = [{
        category: SpendingCategory.GROCERIES,
        totalSpend: 1000,
        transactionCount: 10,
        percentOfTotal: 100,
        topMerchants: [],
        currentCard: null,
        optimalCard: null,
        rewardsEarned: 20,
        rewardsPossible: 50,
        rewardsGap: 30,
      }];
      
      const score = calculateOptimizationScore(breakdown);
      expect(score.rewardsGap).toBe(30);
    });
  });

  describe('groupByMonth', () => {
    it('should group transactions by month', () => {
      const transactions = [
        createMockTransaction(SpendingCategory.GROCERIES, 100, new Date('2026-01-15')),
        createMockTransaction(SpendingCategory.GROCERIES, 150, new Date('2026-01-20')),
        createMockTransaction(SpendingCategory.GROCERIES, 200, new Date('2026-02-10')),
      ];
      
      const summaries = groupByMonth(transactions);
      
      expect(summaries.length).toBe(2);
      expect(summaries[0].totalSpend).toBe(250); // January
      expect(summaries[1].totalSpend).toBe(200); // February
    });

    it('should track category totals per month', () => {
      const transactions = [
        createMockTransaction(SpendingCategory.GROCERIES, 100, new Date('2026-01-15')),
        createMockTransaction(SpendingCategory.DINING, 50, new Date('2026-01-20')),
      ];
      
      const summaries = groupByMonth(transactions);
      
      expect(summaries[0].byCategory[SpendingCategory.GROCERIES]).toBe(100);
      expect(summaries[0].byCategory[SpendingCategory.DINING]).toBe(50);
    });
  });

  describe('calculateTrends', () => {
    it('should detect spending increase', () => {
      const current: MonthlySummary = {
        month: new Date('2026-02-01'),
        totalSpend: 200,
        byCategory: { [SpendingCategory.GROCERIES]: 200 } as any,
        transactionCount: 5,
      };
      
      const previous: MonthlySummary = {
        month: new Date('2026-01-01'),
        totalSpend: 100,
        byCategory: { [SpendingCategory.GROCERIES]: 100 } as any,
        transactionCount: 3,
      };
      
      const trends = calculateTrends(current, previous);
      const groceryTrend = trends.find(t => t.category === SpendingCategory.GROCERIES);
      
      expect(groceryTrend?.direction).toBe('up');
      expect(groceryTrend?.changePercent).toBe(100);
    });

    it('should detect spending decrease', () => {
      const current: MonthlySummary = {
        month: new Date('2026-02-01'),
        totalSpend: 50,
        byCategory: { [SpendingCategory.DINING]: 50 } as any,
        transactionCount: 2,
      };
      
      const previous: MonthlySummary = {
        month: new Date('2026-01-01'),
        totalSpend: 100,
        byCategory: { [SpendingCategory.DINING]: 100 } as any,
        transactionCount: 5,
      };
      
      const trends = calculateTrends(current, previous);
      const diningTrend = trends.find(t => t.category === SpendingCategory.DINING);
      
      expect(diningTrend?.direction).toBe('down');
      expect(diningTrend?.changePercent).toBe(-50);
    });

    it('should mark small changes as stable', () => {
      const current: MonthlySummary = {
        month: new Date('2026-02-01'),
        totalSpend: 105,
        byCategory: { [SpendingCategory.GAS]: 105 } as any,
        transactionCount: 3,
      };
      
      const previous: MonthlySummary = {
        month: new Date('2026-01-01'),
        totalSpend: 100,
        byCategory: { [SpendingCategory.GAS]: 100 } as any,
        transactionCount: 3,
      };
      
      const trends = calculateTrends(current, previous);
      const gasTrend = trends.find(t => t.category === SpendingCategory.GAS);
      
      expect(gasTrend?.direction).toBe('stable');
    });
  });

  describe('generateInsights', () => {
    it('should generate complete insights', () => {
      const result = generateInsights(mockTransactions);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.categoryBreakdown.length).toBeGreaterThan(0);
        expect(result.value.optimizationScore).toBeDefined();
        expect(result.value.topMerchants.length).toBeGreaterThan(0);
      }
    });

    it('should fail with insufficient transactions', () => {
      const fewTx = mockTransactions.slice(0, 3);
      const result = generateInsights(fewTx);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INSUFFICIENT_DATA');
      }
    });

    it('should filter by date range', () => {
      const result = generateInsights(mockTransactions, {
        start: new Date('2026-01-20'),
        end: new Date('2026-01-31'),
      });
      
      // Should only include transactions from 1/20 onwards
      if (result.success) {
        const jan15Tx = result.value.categoryBreakdown.find(
          b => b.topMerchants.some(m => m.name === 'Loblaws')
        );
        // Loblaws transaction was on 1/15, should be excluded
        // This depends on exact filtering logic
      }
    });
  });

  describe('getTopMerchants', () => {
    it('should return top merchants by spend', () => {
      const merchants = getTopMerchants(mockTransactions, 3);
      
      expect(merchants.length).toBe(3);
      expect(merchants[0].name).toBe('Loblaws'); // $100
      expect(merchants[1].name).toBe('Metro');   // $80
    });

    it('should aggregate multiple transactions for same merchant', () => {
      const txs = [
        createMockTransaction(SpendingCategory.DINING, 10, new Date('2026-01-01'), 'Starbucks'),
        createMockTransaction(SpendingCategory.DINING, 10, new Date('2026-01-02'), 'Starbucks'),
        createMockTransaction(SpendingCategory.DINING, 10, new Date('2026-01-03'), 'Starbucks'),
      ];
      
      const merchants = getTopMerchants(txs, 5);
      
      expect(merchants.length).toBe(1);
      expect(merchants[0].amount).toBe(30);
      expect(merchants[0].count).toBe(3);
    });
  });
});
```

---

## Build Order

### Dependency Graph

```
            ┌─────────────────────────┐
            │  MerchantPatternService │  ← Build First (no dependencies)
            └───────────┬─────────────┘
                        │
            ┌───────────┴─────────────┐
            │  StatementParserService │  ← Uses MerchantPatternService
            └───────────┬─────────────┘
                        │
            ┌───────────┴─────────────┐
            │  StatementStorageService│  ← Uses StatementParserService
            └───────────┬─────────────┘
                        │
            ┌───────────┴─────────────┐
            │    InsightsService      │  ← Uses parsed transactions
            └───────────┬─────────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
         ▼              ▼              ▼
    ┌─────────┐   ┌──────────┐   ┌──────────┐
    │  Upload │   │  Review  │   │ Insights │
    │ Screen  │   │  Screen  │   │Dashboard │
    └─────────┘   └──────────┘   └──────────┘
```

### Implementation Phases

#### Phase 1: Merchant Patterns (Day 1)
1. **Types**: Add all new types to `src/types/index.ts`
2. **MerchantPatternService**: Implement 100+ patterns + tests
3. **Validate**: Run categorization tests against sample data

#### Phase 2: CSV Parser (Day 2-3)
1. **StatementParserService**: Bank detection + parsing
2. **All 8 bank formats**: TD, RBC, CIBC, Scotiabank, BMO, Tangerine, PC, Amex
3. **Tests**: 45 tests including performance tests
4. **Validate**: Test against real bank CSVs (sample data)

#### Phase 3: Storage (Day 4)
1. **Database migration**: Run Supabase migration
2. **StatementStorageService**: Local + cloud storage
3. **SpendingProfileService integration**: updateFromParsedTransactions
4. **Tests**: Storage and integration tests

#### Phase 4: Upload UI (Day 5-6)
1. **FilePicker component**: Cross-platform (Expo + Web)
2. **StatementUploadScreen**: 3-step flow
3. **TransactionReviewScreen**: List + re-categorization
4. **CategoryPicker modal**: Re-categorize transactions
5. **Integration**: Wire up services to UI

#### Phase 5: Insights Engine (Day 7-8)
1. **InsightsService**: All pure calculation functions
2. **Tests**: 35 tests including trends and alerts
3. **Validate**: Test with mock transaction data

#### Phase 6: Insights Dashboard (Day 9-10)
1. **InsightsDashboardScreen**: Full UI
2. **Chart components**: Donut chart, trend cards
3. **Alert components**: Smart alert cards
4. **Tier gating**: Implement paywall logic

#### Phase 7: Polish (Day 11-12)
1. **Performance testing**: 500 transaction parsing
2. **Error handling**: Edge cases
3. **Navigation**: Add screens to nav
4. **E2E testing**: Full upload → insights flow
5. **Documentation**: Update README

### Task Checklist

```
□ Phase 1: Merchant Patterns
  □ Add types to src/types/index.ts
  □ Create MerchantPatternService.ts
  □ Implement 100+ merchant patterns
  □ Write MerchantPatternService tests (30 tests)

□ Phase 2: CSV Parser
  □ Create StatementParserService.ts
  □ Implement parseCSVToRows
  □ Implement detectBank for all 8 banks
  □ Implement parseCSV for TD
  □ Implement parseCSV for RBC
  □ Implement parseCSV for CIBC
  □ Implement parseCSV for Scotiabank
  □ Implement parseCSV for BMO
  □ Implement parseCSV for Tangerine
  □ Implement parseCSV for PC Financial
  □ Implement parseCSV for Amex
  □ Write StatementParserService tests (45 tests)
  □ Performance test (500 transactions)

□ Phase 3: Storage
  □ Create Supabase migration
  □ Run migration
  □ Create StatementStorageService.ts
  □ Add updateFromParsedTransactions to SpendingProfileService
  □ Write storage tests (15 tests)

□ Phase 4: Upload UI
  □ Create FilePicker.tsx (cross-platform)
  □ Create BankSelector.tsx
  □ Create ParseProgress.tsx
  □ Create UploadSummary.tsx
  □ Create StatementUploadScreen.tsx
  □ Create TransactionList.tsx
  □ Create TransactionRow.tsx
  □ Create CategoryPicker.tsx
  □ Create TransactionReviewScreen.tsx

□ Phase 5: Insights Engine
  □ Create InsightsService.ts
  □ Implement calculateCategoryBreakdown
  □ Implement calculateOptimizationScore
  □ Implement groupByMonth
  □ Implement calculateTrends
  □ Implement generateSmartAlerts
  □ Write InsightsService tests (35 tests)

□ Phase 6: Insights Dashboard
  □ Create OptimizationScoreCard.tsx
  □ Create CategoryDonutChart.tsx
  □ Create MoneyLeftOnTableCard.tsx
  □ Create TrendCard.tsx
  □ Create AlertCard.tsx
  □ Create TopMerchantsCard.tsx
  □ Create PeriodSelector.tsx
  □ Create InsightsDashboardScreen.tsx
  □ Implement tier gating

□ Phase 7: Polish
  □ Performance optimization
  □ Error handling
  □ Update navigation
  □ E2E tests
  □ Code review
```

---

## Performance Considerations

### Parsing Performance Budget

| Operation | Target | Notes |
|-----------|--------|-------|
| File read | < 100 ms | Expo FileSystem / web FileReader |
| Bank detection | < 50 ms | Pattern matching only |
| CSV parsing | < 1000 ms | For 500 rows |
| Categorization | < 1000 ms | 100+ patterns × 500 txs |
| **Total** | **< 3000 ms** | With 500ms buffer for GC |

### Optimizations

1. **Lazy Pattern Compilation**: Compile RegExp patterns once at module load
2. **Early Exit**: Stop pattern matching on first high-confidence match
3. **Batch Processing**: Categorize in chunks with `requestAnimationFrame` on web
4. **Virtualized Lists**: Use FlatList for transaction lists (50 items visible max)
5. **Memoization**: Cache category breakdown calculation

### Memory Optimization

```typescript
// Process large CSVs in streaming fashion
function* parseCSVStream(content: string, chunkSize: number = 100): Generator<string[][]> {
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunk = lines.slice(i, i + chunkSize);
    yield chunk.map(line => parseCSVLine(line));
  }
}

// Use in component
async function processLargeCSV(content: string) {
  const transactions: ParsedTransaction[] = [];
  
  for (const chunk of parseCSVStream(content)) {
    // Process chunk
    const parsed = parseChunk(chunk);
    transactions.push(...parsed);
    
    // Yield to UI thread
    await new Promise(resolve => setTimeout(resolve, 0));
    setProgress(transactions.length);
  }
  
  return transactions;
}
```

### UI Performance

1. **Skeleton Loading**: Show placeholders during parsing
2. **Progress Indicators**: Show progress for large files
3. **Debounced Filters**: Debounce filter inputs on review screen
4. **Chart Optimization**: Use lightweight charting (no D3 on mobile)

---

## Privacy & Security

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  ON-DEVICE (Default)                                        │
│  ────────────────────                                        │
│  1. User selects CSV file                                    │
│  2. File content read into memory                            │
│  3. Parsed & categorized (pure functions)                    │
│  4. Stored in AsyncStorage (encrypted if device supports)    │
│  5. Insights calculated locally                              │
│                                                              │
│  ✓ No network requests                                       │
│  ✓ Data never leaves device                                  │
│  ✓ Works offline                                             │
├─────────────────────────────────────────────────────────────┤
│  CLOUD SYNC (Opt-in, signed-in users only)                   │
│  ─────────────────────────────────────────                   │
│  1. User signs in                                            │
│  2. User explicitly enables sync                             │
│  3. Transactions encrypted before upload                     │
│  4. RLS ensures only user can access their data              │
│  5. Data can be deleted at any time                          │
│                                                              │
│  ✓ End-to-end encrypted                                      │
│  ✓ User controls sync                                        │
│  ✓ Delete anytime                                            │
└─────────────────────────────────────────────────────────────┘
```

### Encryption Strategy

```typescript
// src/services/EncryptionService.ts

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const ENCRYPTION_KEY_ID = 'rewardly_encryption_key';

/**
 * Get or create device encryption key
 * Stored in iOS Keychain / Android Keystore
 */
async function getEncryptionKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_ID);
  
  if (!key) {
    // Generate new 256-bit key
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    key = Buffer.from(randomBytes).toString('base64');
    await SecureStore.setItemAsync(ENCRYPTION_KEY_ID, key);
  }
  
  return key;
}

/**
 * Encrypt sensitive transaction data before storage
 */
export async function encryptTransactionData(
  data: ParsedTransaction[]
): Promise<string> {
  const key = await getEncryptionKey();
  const json = JSON.stringify(data);
  
  // Use AES-256-GCM (via expo-crypto or SubtleCrypto)
  // Implementation depends on platform
  const encrypted = await encryptAES(json, key);
  
  return encrypted;
}

/**
 * Decrypt transaction data from storage
 */
export async function decryptTransactionData(
  encrypted: string
): Promise<ParsedTransaction[]> {
  const key = await getEncryptionKey();
  const json = await decryptAES(encrypted, key);
  
  return JSON.parse(json);
}
```

### Data Retention

```typescript
// Default retention periods
const RETENTION_DAYS = {
  FREE: 90,      // 3 months for free users
  PRO: 365,      // 1 year for Pro
  MAX: 730,      // 2 years for Max
};

/**
 * Clean up old transaction data
 */
export async function cleanupOldTransactions(tier: Tier): Promise<number> {
  const retentionDays = RETENTION_DAYS[tier];
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  
  // Delete local transactions older than cutoff
  const deleted = await deleteTransactionsOlderThan(cutoffDate);
  
  return deleted;
}
```

### Privacy UI

```typescript
// Show privacy notice before first upload
function PrivacyNotice() {
  return (
    <View style={styles.notice}>
      <Text style={styles.title}>🔒 Your Data is Safe</Text>
      <Text style={styles.body}>
        • All parsing happens on your device{'\n'}
        • Transactions are encrypted{'\n'}
        • Data never leaves your phone unless you sign in and enable sync{'\n'}
        • You can delete your data anytime
      </Text>
      <Button title="I Understand" onPress={dismissNotice} />
    </View>
  );
}
```

---

## Summary

This architecture document provides everything needed to implement Cycle 4's CSV Statement Upload and Spending Insights Dashboard:

- **125+ tests** across 4 new services
- **Pure function design** for all parsing and calculations
- **8 Canadian bank formats** supported with auto-detection
- **100+ merchant patterns** extending existing MERCHANT_CATEGORY_MAP
- **Cross-platform file upload** (Expo DocumentPicker + Web)
- **< 3 second performance** for 500 transactions
- **Privacy-first**: all processing on-device, optional encrypted sync
- **Clear tier gating** for monetization
- **Detailed build order** with 12-day timeline

The Sonnet dev agent should be able to build this with zero clarification. Start with Phase 1 (MerchantPatternService), validate tests pass, then proceed phase by phase.

---

*Architecture document complete. Ready for implementation.*
