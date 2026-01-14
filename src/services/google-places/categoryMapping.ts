/**
 * Category Mapping - Maps Google Places types to SpendingCategory
 */

import { SpendingCategory } from '../../types';

/**
 * Map Google Places types to SpendingCategory
 */
export const googleTypeToCategory: Record<string, SpendingCategory> = {
  // Groceries
  grocery_or_supermarket: SpendingCategory.GROCERIES,
  supermarket: SpendingCategory.GROCERIES,
  food: SpendingCategory.GROCERIES,

  // Dining
  restaurant: SpendingCategory.DINING,
  cafe: SpendingCategory.DINING,
  bar: SpendingCategory.DINING,
  bakery: SpendingCategory.DINING,
  meal_delivery: SpendingCategory.DINING,
  meal_takeaway: SpendingCategory.DINING,
  night_club: SpendingCategory.DINING,

  // Gas
  gas_station: SpendingCategory.GAS,

  // Drugstores
  pharmacy: SpendingCategory.DRUGSTORES,
  drugstore: SpendingCategory.DRUGSTORES,
  health: SpendingCategory.DRUGSTORES,

  // Travel
  airport: SpendingCategory.TRAVEL,
  lodging: SpendingCategory.TRAVEL,
  travel_agency: SpendingCategory.TRAVEL,
  car_rental: SpendingCategory.TRAVEL,
  train_station: SpendingCategory.TRAVEL,
  bus_station: SpendingCategory.TRAVEL,

  // Entertainment
  movie_theater: SpendingCategory.ENTERTAINMENT,
  amusement_park: SpendingCategory.ENTERTAINMENT,
  stadium: SpendingCategory.ENTERTAINMENT,
  bowling_alley: SpendingCategory.ENTERTAINMENT,
  casino: SpendingCategory.ENTERTAINMENT,
  museum: SpendingCategory.ENTERTAINMENT,
  art_gallery: SpendingCategory.ENTERTAINMENT,
  zoo: SpendingCategory.ENTERTAINMENT,
  aquarium: SpendingCategory.ENTERTAINMENT,

  // Home Improvement
  hardware_store: SpendingCategory.HOME_IMPROVEMENT,
  home_goods_store: SpendingCategory.HOME_IMPROVEMENT,
  furniture_store: SpendingCategory.HOME_IMPROVEMENT,
  electrician: SpendingCategory.HOME_IMPROVEMENT,
  plumber: SpendingCategory.HOME_IMPROVEMENT,

  // Online Shopping (rarely returned by Places API, but included for completeness)
  electronics_store: SpendingCategory.ONLINE_SHOPPING,

  // Default/Other
  store: SpendingCategory.OTHER,
  shopping_mall: SpendingCategory.OTHER,
  department_store: SpendingCategory.OTHER,
  clothing_store: SpendingCategory.OTHER,
  shoe_store: SpendingCategory.OTHER,
  jewelry_store: SpendingCategory.OTHER,
  book_store: SpendingCategory.OTHER,
  convenience_store: SpendingCategory.OTHER,
  liquor_store: SpendingCategory.OTHER,
  pet_store: SpendingCategory.OTHER,
  florist: SpendingCategory.OTHER,
  beauty_salon: SpendingCategory.OTHER,
  hair_care: SpendingCategory.OTHER,
  spa: SpendingCategory.OTHER,
  gym: SpendingCategory.OTHER,
  laundry: SpendingCategory.OTHER,
  car_wash: SpendingCategory.OTHER,
  car_dealer: SpendingCategory.OTHER,
  car_repair: SpendingCategory.OTHER,
  bank: SpendingCategory.OTHER,
  atm: SpendingCategory.OTHER,
  post_office: SpendingCategory.OTHER,
};

/**
 * Canadian-specific store overrides
 * These take precedence over Google Places types
 */
export const canadianStoreOverrides: Record<string, SpendingCategory> = {
  // Dining
  "Tim Hortons": SpendingCategory.DINING,
  "Tim Horton's": SpendingCategory.DINING,
  "Tims": SpendingCategory.DINING,
  "Second Cup": SpendingCategory.DINING,
  "Starbucks": SpendingCategory.DINING,
  "McDonald's": SpendingCategory.DINING,
  "A&W": SpendingCategory.DINING,
  "Harvey's": SpendingCategory.DINING,
  "Swiss Chalet": SpendingCategory.DINING,
  "Boston Pizza": SpendingCategory.DINING,
  "The Keg": SpendingCategory.DINING,
  "Earls": SpendingCategory.DINING,
  "Cactus Club": SpendingCategory.DINING,
  "Joey": SpendingCategory.DINING,
  "Moxies": SpendingCategory.DINING,

  // Home Improvement
  "Canadian Tire": SpendingCategory.HOME_IMPROVEMENT,
  "Home Depot": SpendingCategory.HOME_IMPROVEMENT,
  "Home Hardware": SpendingCategory.HOME_IMPROVEMENT,
  "Rona": SpendingCategory.HOME_IMPROVEMENT,
  "Lowe's": SpendingCategory.HOME_IMPROVEMENT,
  "IKEA": SpendingCategory.HOME_IMPROVEMENT,

  // Drugstores
  "Shoppers Drug Mart": SpendingCategory.DRUGSTORES,
  "Pharmaprix": SpendingCategory.DRUGSTORES, // Quebec name for Shoppers
  "Rexall": SpendingCategory.DRUGSTORES,
  "Jean Coutu": SpendingCategory.DRUGSTORES,
  "London Drugs": SpendingCategory.DRUGSTORES,

  // Gas
  "Petro-Canada": SpendingCategory.GAS,
  "Esso": SpendingCategory.GAS,
  "Shell": SpendingCategory.GAS,
  "Husky": SpendingCategory.GAS,
  "Pioneer": SpendingCategory.GAS,
  "Ultramar": SpendingCategory.GAS,
  "Co-op Gas": SpendingCategory.GAS,
  "Costco Gas": SpendingCategory.GAS,

  // Entertainment
  "Cineplex": SpendingCategory.ENTERTAINMENT,
  "Landmark Cinemas": SpendingCategory.ENTERTAINMENT,
  "Scotiabank Theatre": SpendingCategory.ENTERTAINMENT,

  // Groceries
  "Loblaws": SpendingCategory.GROCERIES,
  "No Frills": SpendingCategory.GROCERIES,
  "Real Canadian Superstore": SpendingCategory.GROCERIES,
  "Superstore": SpendingCategory.GROCERIES,
  "Metro": SpendingCategory.GROCERIES,
  "Sobeys": SpendingCategory.GROCERIES,
  "Safeway": SpendingCategory.GROCERIES,
  "FreshCo": SpendingCategory.GROCERIES,
  "Food Basics": SpendingCategory.GROCERIES,
  "Fortinos": SpendingCategory.GROCERIES,
  "Zehrs": SpendingCategory.GROCERIES,
  "Valu-mart": SpendingCategory.GROCERIES,
  "Your Independent Grocer": SpendingCategory.GROCERIES,
  "IGA": SpendingCategory.GROCERIES,
  "Provigo": SpendingCategory.GROCERIES,
  "Maxi": SpendingCategory.GROCERIES,
  "Save-On-Foods": SpendingCategory.GROCERIES,
  "Thrifty Foods": SpendingCategory.GROCERIES,
  "Whole Foods": SpendingCategory.GROCERIES,
  "Farm Boy": SpendingCategory.GROCERIES,
  "T&T Supermarket": SpendingCategory.GROCERIES,
  "Costco": SpendingCategory.GROCERIES,
  "Walmart": SpendingCategory.GROCERIES,

  // Liquor (categorized as OTHER)
  "LCBO": SpendingCategory.OTHER,
  "SAQ": SpendingCategory.OTHER, // Quebec
  "BC Liquor Store": SpendingCategory.OTHER,
  "Alberta Gaming and Liquor": SpendingCategory.OTHER,

  // Other retail
  "Winners": SpendingCategory.OTHER,
  "HomeSense": SpendingCategory.OTHER,
  "Marshalls": SpendingCategory.OTHER,
  "Hudson's Bay": SpendingCategory.OTHER,
  "The Bay": SpendingCategory.OTHER,
  "Simons": SpendingCategory.OTHER,
  "Sport Chek": SpendingCategory.OTHER,
  "Atmosphere": SpendingCategory.OTHER,
  "MEC": SpendingCategory.OTHER,
  "Best Buy": SpendingCategory.ONLINE_SHOPPING,
  "Staples": SpendingCategory.OTHER,
  "Indigo": SpendingCategory.OTHER,
  "Chapters": SpendingCategory.OTHER,
  "Dollarama": SpendingCategory.OTHER,
};

/**
 * Get SpendingCategory from Google Places types
 * Checks Canadian overrides first, then maps Google types
 */
export function getCategoryFromGoogleTypes(
  name: string,
  types: string[]
): SpendingCategory {
  // Check Canadian store overrides first (case-insensitive partial match)
  const normalizedName = name.toLowerCase();
  for (const [storeName, category] of Object.entries(canadianStoreOverrides)) {
    if (normalizedName.includes(storeName.toLowerCase())) {
      return category;
    }
  }

  // Map Google types to category (first match wins, in order of specificity)
  const priorityOrder: SpendingCategory[] = [
    SpendingCategory.GROCERIES,
    SpendingCategory.DINING,
    SpendingCategory.GAS,
    SpendingCategory.DRUGSTORES,
    SpendingCategory.TRAVEL,
    SpendingCategory.ENTERTAINMENT,
    SpendingCategory.HOME_IMPROVEMENT,
    SpendingCategory.ONLINE_SHOPPING,
    SpendingCategory.OTHER,
  ];

  for (const priorityCategory of priorityOrder) {
    for (const type of types) {
      const mappedCategory = googleTypeToCategory[type];
      if (mappedCategory === priorityCategory) {
        return mappedCategory;
      }
    }
  }

  // Default to OTHER if no match
  return SpendingCategory.OTHER;
}
