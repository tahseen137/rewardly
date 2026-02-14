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
