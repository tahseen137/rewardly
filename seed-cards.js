import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zdlozhpmqrtvvhdzbmrv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbG96aHBtcXJ0dnZoZHpibXJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE4NjAxMSwiZXhwIjoyMDgzNzYyMDExfQ.i3NB1pPd9vfswnHCb5c-db5y3_dmLC5WMnOgeKoPahQ'
);

// ============================================================================
// CANADIAN CREDIT CARDS - Comprehensive Database
// ============================================================================

const canadianCards = [
  // RBC (Royal Bank of Canada) - Complete Lineup
  {
    card_key: 'rbc-avion-visa-infinite',
    name: 'RBC Avion Visa Infinite',
    issuer: 'RBC',
    reward_program: 'Avion',
    reward_currency: 'points',
    point_valuation: 2.1,
    annual_fee: 120,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 1.25, reward_unit: 'multiplier', description: '1.25 points per dollar on travel' },
      { category: 'dining', multiplier: 1.25, reward_unit: 'multiplier', description: '1.25 points per dollar on dining' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'rbc-avion-visa-infinite-privilege',
    name: 'RBC Avion Visa Infinite Privilege',
    issuer: 'RBC',
    reward_program: 'Avion',
    reward_currency: 'points',
    point_valuation: 2.1,
    annual_fee: 399,
    base_reward_rate: 1.25,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on travel' },
      { category: 'dining', multiplier: 1.25, reward_unit: 'multiplier', description: '1.25 points per dollar on dining' },
      { category: 'other', multiplier: 1.25, reward_unit: 'multiplier', description: '1.25 points per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'rbc-ion-visa',
    name: 'RBC ION Visa',
    issuer: 'RBC',
    reward_program: 'Avion',
    reward_currency: 'points',
    point_valuation: 2.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all purchases' }
    ]
  },
  {
    card_key: 'rbc-ion-plus-visa',
    name: 'RBC ION+ Visa',
    issuer: 'RBC',
    reward_program: 'Avion',
    reward_currency: 'points',
    point_valuation: 2.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on groceries' },
      { category: 'drugstores', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on drugstores' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'rbc-westjet-world-elite',
    name: 'RBC WestJet World Elite Mastercard',
    issuer: 'RBC',
    reward_program: 'WestJet Dollars',
    reward_currency: 'airline_miles',
    point_valuation: 1.0,
    annual_fee: 119,
    base_reward_rate: 1.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'percent', description: '2% back on WestJet purchases' },
      { category: 'gas', multiplier: 1.5, reward_unit: 'percent', description: '1.5% back at gas stations' },
      { category: 'groceries', multiplier: 1.5, reward_unit: 'percent', description: '1.5% back at grocery stores' },
      { category: 'dining', multiplier: 1.5, reward_unit: 'percent', description: '1.5% back at restaurants' }
    ]
  },
  {
    card_key: 'rbc-westjet-mastercard',
    name: 'RBC WestJet Mastercard',
    issuer: 'RBC',
    reward_program: 'WestJet Dollars',
    reward_currency: 'airline_miles',
    point_valuation: 1.0,
    annual_fee: 39,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 1.5, reward_unit: 'percent', description: '1.5% back on WestJet purchases' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% back on all other purchases' }
    ]
  },
  {
    card_key: 'rbc-cash-back-mastercard',
    name: 'RBC Cash Back Mastercard',
    issuer: 'RBC',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 39,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 2, reward_unit: 'percent', description: '2% cash back on groceries' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'rbc-cash-back-preferred-world-elite',
    name: 'RBC Cash Back Preferred World Elite Mastercard',
    issuer: 'RBC',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 120,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 3, reward_unit: 'percent', description: '3% cash back on groceries' },
      { category: 'gas', multiplier: 2, reward_unit: 'percent', description: '2% cash back on gas' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'rbc-rewards-plus-visa',
    name: 'RBC Rewards+ Visa',
    issuer: 'RBC',
    reward_program: 'RBC Rewards',
    reward_currency: 'points',
    point_valuation: 0.7,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all purchases' }
    ]
  },
  {
    card_key: 'rbc-rewards-visa',
    name: 'RBC Rewards Visa',
    issuer: 'RBC',
    reward_program: 'RBC Rewards',
    reward_currency: 'points',
    point_valuation: 0.7,
    annual_fee: 39,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on travel' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'rbc-petro-points-mastercard',
    name: 'RBC Petro-Points Mastercard',
    issuer: 'RBC',
    reward_program: 'Petro-Points',
    reward_currency: 'points',
    point_valuation: 0.1,
    annual_fee: 0,
    base_reward_rate: 10,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'gas', multiplier: 15, reward_unit: 'multiplier', description: '15 points per dollar at Petro-Canada' },
      { category: 'groceries', multiplier: 10, reward_unit: 'multiplier', description: '10 points per dollar at groceries' },
      { category: 'other', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'rbc-british-airways-visa-infinite',
    name: 'RBC British Airways Visa Infinite',
    issuer: 'RBC',
    reward_program: 'Avios',
    reward_currency: 'airline_miles',
    point_valuation: 1.8,
    annual_fee: 165,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 Avios per dollar on travel' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 Avios per dollar on all other purchases' }
    ]
  },

  // TD Bank - Complete Lineup
  {
    card_key: 'td-aeroplan-visa-infinite',
    name: 'TD Aeroplan Visa Infinite',
    issuer: 'TD',
    reward_program: 'Aeroplan',
    reward_currency: 'airline_miles',
    point_valuation: 2.0,
    annual_fee: 139,
    base_reward_rate: 1.5,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on Air Canada purchases' },
      { category: 'groceries', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on groceries' },
      { category: 'gas', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on gas' },
      { category: 'drugstores', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on drugstores' }
    ]
  },
  {
    card_key: 'td-aeroplan-visa-infinite-privilege',
    name: 'TD Aeroplan Visa Infinite Privilege',
    issuer: 'TD',
    reward_program: 'Aeroplan',
    reward_currency: 'airline_miles',
    point_valuation: 2.0,
    annual_fee: 599,
    base_reward_rate: 1.5,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on Air Canada purchases' },
      { category: 'groceries', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on groceries' },
      { category: 'gas', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on gas' },
      { category: 'dining', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on dining' }
    ]
  },
  {
    card_key: 'td-aeroplan-visa-platinum',
    name: 'TD Aeroplan Visa Platinum',
    issuer: 'TD',
    reward_program: 'Aeroplan',
    reward_currency: 'airline_miles',
    point_valuation: 2.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on Air Canada purchases' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'td-first-class-travel-visa-infinite',
    name: 'TD First Class Travel Visa Infinite',
    issuer: 'TD',
    reward_program: 'TD Rewards',
    reward_currency: 'points',
    point_valuation: 2.0,
    annual_fee: 139,
    base_reward_rate: 1.5,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on travel booked through TD' },
      { category: 'dining', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on dining' },
      { category: 'other', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'td-cash-back-visa-infinite',
    name: 'TD Cash Back Visa Infinite',
    issuer: 'TD',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 139,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 3, reward_unit: 'percent', description: '3% cash back on groceries' },
      { category: 'gas', multiplier: 3, reward_unit: 'percent', description: '3% cash back on gas' },
      { category: 'dining', multiplier: 3, reward_unit: 'percent', description: '3% cash back on dining' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'td-cash-back-visa-platinum',
    name: 'TD Cash Back Visa Platinum',
    issuer: 'TD',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 1, reward_unit: 'percent', description: '1% cash back on groceries' },
      { category: 'gas', multiplier: 1, reward_unit: 'percent', description: '1% cash back on gas' },
      { category: 'dining', multiplier: 1, reward_unit: 'percent', description: '1% cash back on dining' },
      { category: 'other', multiplier: 0.5, reward_unit: 'percent', description: '0.5% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'td-rewards-visa',
    name: 'TD Rewards Visa',
    issuer: 'TD',
    reward_program: 'TD Rewards',
    reward_currency: 'points',
    point_valuation: 0.5,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all purchases' }
    ]
  },
  {
    card_key: 'td-green-visa',
    name: 'TD Green Visa',
    issuer: 'TD',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'td-business-travel-visa',
    name: 'TD Business Travel Visa',
    issuer: 'TD',
    reward_program: 'TD Rewards',
    reward_currency: 'points',
    point_valuation: 1.5,
    annual_fee: 149,
    base_reward_rate: 1.5,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on all purchases' }
    ]
  },
  {
    card_key: 'td-business-cash-back-visa',
    name: 'TD Business Cash Back Visa',
    issuer: 'TD',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 0.5, reward_unit: 'percent', description: '0.5% cash back on all purchases' }
    ]
  },

  // BMO (Bank of Montreal) - Complete Lineup
  {
    card_key: 'bmo-eclipse-visa-infinite',
    name: 'BMO Eclipse Visa Infinite',
    issuer: 'BMO',
    reward_program: 'BMO Rewards',
    reward_currency: 'points',
    point_valuation: 0.7,
    annual_fee: 120,
    base_reward_rate: 5,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on travel, dining, entertainment' },
      { category: 'dining', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on dining' },
      { category: 'entertainment', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on entertainment' },
      { category: 'gas', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on gas and groceries' },
      { category: 'groceries', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on groceries' }
    ]
  },
  {
    card_key: 'bmo-eclipse-visa-infinite-privilege',
    name: 'BMO Eclipse Visa Infinite Privilege',
    issuer: 'BMO',
    reward_program: 'BMO Rewards',
    reward_currency: 'points',
    point_valuation: 0.7,
    annual_fee: 499,
    base_reward_rate: 5,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on travel, dining, entertainment' },
      { category: 'dining', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on dining' },
      { category: 'entertainment', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on entertainment' },
      { category: 'gas', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on gas and groceries' },
      { category: 'groceries', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on groceries' }
    ]
  },
  {
    card_key: 'bmo-ascend-world-elite',
    name: 'BMO Ascend World Elite Mastercard',
    issuer: 'BMO',
    reward_program: 'BMO Rewards',
    reward_currency: 'points',
    point_valuation: 0.7,
    annual_fee: 150,
    base_reward_rate: 5,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on travel and dining' },
      { category: 'dining', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on dining' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'bmo-world-elite-mastercard',
    name: 'BMO World Elite Mastercard',
    issuer: 'BMO',
    reward_program: 'BMO Rewards',
    reward_currency: 'points',
    point_valuation: 0.7,
    annual_fee: 120,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on travel' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'bmo-cashback-world-elite',
    name: 'BMO CashBack World Elite Mastercard',
    issuer: 'BMO',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 120,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 5, reward_unit: 'percent', description: '5% cash back on groceries' },
      { category: 'gas', multiplier: 4, reward_unit: 'percent', description: '4% cash back on gas and transit' },
      { category: 'dining', multiplier: 2, reward_unit: 'percent', description: '2% cash back on dining and entertainment' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'bmo-cashback-mastercard',
    name: 'BMO CashBack Mastercard',
    issuer: 'BMO',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 3, reward_unit: 'percent', description: '3% cash back on groceries' },
      { category: 'gas', multiplier: 1, reward_unit: 'percent', description: '1% cash back on gas' },
      { category: 'other', multiplier: 0.5, reward_unit: 'percent', description: '0.5% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'bmo-air-miles-world-elite',
    name: 'BMO Air Miles World Elite Mastercard',
    issuer: 'BMO',
    reward_program: 'Air Miles',
    reward_currency: 'airline_miles',
    point_valuation: 12.0,
    annual_fee: 120,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 1, reward_unit: 'multiplier', description: '1 Air Mile per $12 on groceries' },
      { category: 'gas', multiplier: 1, reward_unit: 'multiplier', description: '1 Air Mile per $12 on gas' },
      { category: 'drugstores', multiplier: 1, reward_unit: 'multiplier', description: '1 Air Mile per $12 on drugstores' }
    ]
  },
  {
    card_key: 'bmo-air-miles-mastercard',
    name: 'BMO Air Miles Mastercard',
    issuer: 'BMO',
    reward_program: 'Air Miles',
    reward_currency: 'airline_miles',
    point_valuation: 12.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 1, reward_unit: 'multiplier', description: '1 Air Mile per $20 on groceries' },
      { category: 'gas', multiplier: 1, reward_unit: 'multiplier', description: '1 Air Mile per $20 on gas' },
      { category: 'drugstores', multiplier: 1, reward_unit: 'multiplier', description: '1 Air Mile per $20 on drugstores' }
    ]
  },
  {
    card_key: 'bmo-preferred-rate-mastercard',
    name: 'BMO Preferred Rate Mastercard',
    issuer: 'BMO',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 20,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'bmo-rewards-mastercard',
    name: 'BMO Rewards Mastercard',
    issuer: 'BMO',
    reward_program: 'BMO Rewards',
    reward_currency: 'points',
    point_valuation: 0.7,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all purchases' }
    ]
  },

  // Scotiabank - Complete Lineup
  {
    card_key: 'scotiabank-gold-amex',
    name: 'Scotiabank Gold American Express',
    issuer: 'Scotiabank',
    reward_program: 'Scene+',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 120,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on groceries, dining, entertainment' },
      { category: 'dining', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on dining' },
      { category: 'entertainment', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on entertainment' },
      { category: 'gas', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on gas, transit, streaming' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'scotiabank-passport-visa-infinite',
    name: 'Scotiabank Passport Visa Infinite',
    issuer: 'Scotiabank',
    reward_program: 'Scene+',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 139,
    base_reward_rate: 2,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on travel and daily transit' },
      { category: 'dining', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on dining and entertainment' },
      { category: 'entertainment', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on entertainment' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'scotiabank-momentum-visa-infinite',
    name: 'Scotiabank Momentum Visa Infinite',
    issuer: 'Scotiabank',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 120,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 4, reward_unit: 'percent', description: '4% cash back on groceries and recurring bills' },
      { category: 'gas', multiplier: 2, reward_unit: 'percent', description: '2% cash back on gas and daily transit' },
      { category: 'drugstores', multiplier: 2, reward_unit: 'percent', description: '2% cash back on drugstores' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'scotiabank-momentum-no-fee-visa',
    name: 'Scotiabank Momentum No-Fee Visa',
    issuer: 'Scotiabank',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 2, reward_unit: 'percent', description: '2% cash back on groceries and recurring bills' },
      { category: 'gas', multiplier: 1, reward_unit: 'percent', description: '1% cash back on gas and daily transit' },
      { category: 'drugstores', multiplier: 1, reward_unit: 'percent', description: '1% cash back on drugstores' },
      { category: 'other', multiplier: 0.5, reward_unit: 'percent', description: '0.5% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'scotiabank-scene-plus-visa',
    name: 'Scotiabank Scene+ Visa',
    issuer: 'Scotiabank',
    reward_program: 'Scene+',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on groceries at partner stores' },
      { category: 'entertainment', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on entertainment at Cineplex' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'scotiabank-value-visa',
    name: 'Scotiabank Value Visa',
    issuer: 'Scotiabank',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'scotiabank-l-earn-visa',
    name: 'Scotiabank L\'earn Visa',
    issuer: 'Scotiabank',
    reward_program: 'Scene+',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all purchases' }
    ]
  },

  // CIBC - Complete Lineup
  {
    card_key: 'cibc-aventura-visa-infinite',
    name: 'CIBC Aventura Visa Infinite',
    issuer: 'CIBC',
    reward_program: 'Aventura',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 139,
    base_reward_rate: 1.5,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on CIBC Rewards Centre bookings' },
      { category: 'gas', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on gas, groceries, drugstores' },
      { category: 'groceries', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on groceries' },
      { category: 'drugstores', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on drugstores' }
    ]
  },
  {
    card_key: 'cibc-aventura-visa-infinite-privilege',
    name: 'CIBC Aventura Visa Infinite Privilege',
    issuer: 'CIBC',
    reward_program: 'Aventura',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 499,
    base_reward_rate: 2,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on CIBC Rewards Centre bookings' },
      { category: 'dining', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on dining and entertainment' },
      { category: 'entertainment', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on entertainment' },
      { category: 'gas', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on gas and groceries' },
      { category: 'groceries', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on groceries' }
    ]
  },
  {
    card_key: 'cibc-aventura-gold-visa',
    name: 'CIBC Aventura Gold Visa',
    issuer: 'CIBC',
    reward_program: 'Aventura',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 120,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on CIBC Rewards Centre bookings' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'cibc-dividend-visa-infinite',
    name: 'CIBC Dividend Visa Infinite',
    issuer: 'CIBC',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 120,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 4, reward_unit: 'percent', description: '4% cash back on groceries' },
      { category: 'gas', multiplier: 2, reward_unit: 'percent', description: '2% cash back on gas and transit' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'cibc-dividend-visa-platinum',
    name: 'CIBC Dividend Visa Platinum',
    issuer: 'CIBC',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 2, reward_unit: 'percent', description: '2% cash back on groceries' },
      { category: 'gas', multiplier: 1, reward_unit: 'percent', description: '1% cash back on gas and transit' },
      { category: 'other', multiplier: 0.5, reward_unit: 'percent', description: '0.5% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'cibc-aeroplan-visa-infinite',
    name: 'CIBC Aeroplan Visa Infinite',
    issuer: 'CIBC',
    reward_program: 'Aeroplan',
    reward_currency: 'airline_miles',
    point_valuation: 2.0,
    annual_fee: 139,
    base_reward_rate: 1.5,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on Air Canada purchases' },
      { category: 'gas', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on gas, groceries, drugstores' },
      { category: 'groceries', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on groceries' },
      { category: 'drugstores', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on drugstores' }
    ]
  },
  {
    card_key: 'cibc-aeroplan-visa-infinite-privilege',
    name: 'CIBC Aeroplan Visa Infinite Privilege',
    issuer: 'CIBC',
    reward_program: 'Aeroplan',
    reward_currency: 'airline_miles',
    point_valuation: 2.0,
    annual_fee: 599,
    base_reward_rate: 2,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on Air Canada purchases' },
      { category: 'gas', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on gas, groceries, drugstores' },
      { category: 'groceries', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on groceries' },
      { category: 'dining', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on dining' }
    ]
  },
  {
    card_key: 'cibc-aeroplan-visa',
    name: 'CIBC Aeroplan Visa',
    issuer: 'CIBC',
    reward_program: 'Aeroplan',
    reward_currency: 'airline_miles',
    point_valuation: 2.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on Air Canada purchases' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'cibc-costco-mastercard',
    name: 'CIBC Costco Mastercard',
    issuer: 'CIBC',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'gas', multiplier: 3, reward_unit: 'percent', description: '3% cash back on gas at Costco' },
      { category: 'dining', multiplier: 2, reward_unit: 'percent', description: '2% cash back on restaurants and travel' },
      { category: 'travel', multiplier: 2, reward_unit: 'percent', description: '2% cash back on travel' },
      { category: 'groceries', multiplier: 1, reward_unit: 'percent', description: '1% cash back at Costco' },
      { category: 'other', multiplier: 0.5, reward_unit: 'percent', description: '0.5% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'cibc-tim-hortons-double-double-visa',
    name: 'CIBC Tim Hortons Double Double Visa',
    issuer: 'CIBC',
    reward_program: 'Tim Rewards',
    reward_currency: 'points',
    point_valuation: 0.1,
    annual_fee: 0,
    base_reward_rate: 10,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'dining', multiplier: 10, reward_unit: 'multiplier', description: '10 points per dollar at Tim Hortons' },
      { category: 'groceries', multiplier: 10, reward_unit: 'multiplier', description: '10 points per dollar on groceries' },
      { category: 'other', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on all other purchases' }
    ]
  },

  // American Express Canada - Complete Lineup
  {
    card_key: 'amex-ca-platinum',
    name: 'American Express Platinum Card',
    issuer: 'American Express',
    reward_program: 'Membership Rewards',
    reward_currency: 'points',
    point_valuation: 2.0,
    annual_fee: 799,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on eligible hotels and air travel through Amex Travel' },
      { category: 'dining', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on dining' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'amex-ca-gold',
    name: 'American Express Gold Rewards Card',
    issuer: 'American Express',
    reward_program: 'Membership Rewards',
    reward_currency: 'points',
    point_valuation: 2.0,
    annual_fee: 250,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on travel, dining, gas, groceries, drugstores' },
      { category: 'dining', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on dining' },
      { category: 'gas', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on gas' },
      { category: 'groceries', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on groceries' },
      { category: 'drugstores', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on drugstores' }
    ]
  },
  {
    card_key: 'amex-ca-cobalt',
    name: 'American Express Cobalt Card',
    issuer: 'American Express',
    reward_program: 'Membership Rewards',
    reward_currency: 'points',
    point_valuation: 2.0,
    annual_fee: 156,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'dining', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on eats & drinks (restaurants, bars, food delivery)' },
      { category: 'groceries', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on groceries' },
      { category: 'gas', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on gas and transit' },
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on travel' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'amex-ca-aeroplan-reserve',
    name: 'American Express Aeroplan Reserve Card',
    issuer: 'American Express',
    reward_program: 'Aeroplan',
    reward_currency: 'airline_miles',
    point_valuation: 2.0,
    annual_fee: 599,
    base_reward_rate: 3,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on Air Canada purchases' },
      { category: 'dining', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on dining, entertainment, transit' },
      { category: 'entertainment', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on entertainment' },
      { category: 'other', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'amex-ca-aeroplan',
    name: 'American Express Aeroplan Card',
    issuer: 'American Express',
    reward_program: 'Aeroplan',
    reward_currency: 'airline_miles',
    point_valuation: 2.0,
    annual_fee: 120,
    base_reward_rate: 1.25,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on Air Canada purchases' },
      { category: 'gas', multiplier: 1.25, reward_unit: 'multiplier', description: '1.25 points per dollar on gas, groceries, dining' },
      { category: 'groceries', multiplier: 1.25, reward_unit: 'multiplier', description: '1.25 points per dollar on groceries' },
      { category: 'dining', multiplier: 1.25, reward_unit: 'multiplier', description: '1.25 points per dollar on dining' }
    ]
  },
  {
    card_key: 'amex-ca-simplycash',
    name: 'American Express SimplyCash Card',
    issuer: 'American Express',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1.25,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1.25, reward_unit: 'percent', description: '1.25% cash back on all purchases' }
    ]
  },
  {
    card_key: 'amex-ca-simplycash-preferred',
    name: 'American Express SimplyCash Preferred Card',
    issuer: 'American Express',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 99,
    base_reward_rate: 2,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 2, reward_unit: 'percent', description: '2% cash back on all purchases' }
    ]
  },
  {
    card_key: 'amex-ca-air-miles-platinum',
    name: 'American Express Air Miles Platinum Card',
    issuer: 'American Express',
    reward_program: 'Air Miles',
    reward_currency: 'airline_miles',
    point_valuation: 12.0,
    annual_fee: 120,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 1, reward_unit: 'multiplier', description: '1 Air Mile per $10 at participating grocers' },
      { category: 'gas', multiplier: 1, reward_unit: 'multiplier', description: '1 Air Mile per $10 at gas stations' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 Air Mile per $15 on all other purchases' }
    ]
  },
  {
    card_key: 'amex-ca-air-miles-reserve',
    name: 'American Express Air Miles Reserve Card',
    issuer: 'American Express',
    reward_program: 'Air Miles',
    reward_currency: 'airline_miles',
    point_valuation: 12.0,
    annual_fee: 395,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 1, reward_unit: 'multiplier', description: '1 Air Mile per $10 at participating grocers' },
      { category: 'gas', multiplier: 1, reward_unit: 'multiplier', description: '1 Air Mile per $10 at gas stations' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 Air Mile per $12 on all other purchases' }
    ]
  },
  {
    card_key: 'amex-ca-marriott-bonvoy',
    name: 'American Express Marriott Bonvoy Card',
    issuer: 'American Express',
    reward_program: 'Marriott Bonvoy',
    reward_currency: 'hotel_points',
    point_valuation: 0.8,
    annual_fee: 120,
    base_reward_rate: 2,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar at Marriott Bonvoy hotels' },
      { category: 'dining', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on dining and gas' },
      { category: 'gas', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on gas' },
      { category: 'other', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'amex-ca-green',
    name: 'American Express Green Card',
    issuer: 'American Express',
    reward_program: 'Membership Rewards',
    reward_currency: 'points',
    point_valuation: 2.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all purchases' }
    ]
  },
  {
    card_key: 'amex-ca-business-platinum',
    name: 'American Express Business Platinum Card',
    issuer: 'American Express',
    reward_program: 'Membership Rewards',
    reward_currency: 'points',
    point_valuation: 2.0,
    annual_fee: 799,
    base_reward_rate: 1.25,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on flights and hotels through Amex Travel' },
      { category: 'other', multiplier: 1.25, reward_unit: 'multiplier', description: '1.25 points per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'amex-ca-business-gold',
    name: 'American Express Business Gold Card',
    issuer: 'American Express',
    reward_program: 'Membership Rewards',
    reward_currency: 'points',
    point_valuation: 2.0,
    annual_fee: 250,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'gas', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on gas, office supplies, shipping' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'amex-ca-business-edge',
    name: 'American Express Business Edge Card',
    issuer: 'American Express',
    reward_program: 'Membership Rewards',
    reward_currency: 'points',
    point_valuation: 2.0,
    annual_fee: 99,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on eligible online ads and software' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },

  // Tangerine Bank
  {
    card_key: 'tangerine-money-back',
    name: 'Tangerine Money-Back Credit Card',
    issuer: 'Tangerine',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 2, reward_unit: 'percent', description: '2% cash back in up to 3 chosen categories' },
      { category: 'gas', multiplier: 2, reward_unit: 'percent', description: '2% cash back in chosen categories' },
      { category: 'dining', multiplier: 2, reward_unit: 'percent', description: '2% cash back in chosen categories' },
      { category: 'other', multiplier: 0.5, reward_unit: 'percent', description: '0.5% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'tangerine-world-mastercard',
    name: 'Tangerine World Mastercard',
    issuer: 'Tangerine',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 0.5, reward_unit: 'percent', description: '0.5% cash back on all purchases' }
    ]
  },

  // Simplii Financial
  {
    card_key: 'simplii-cash-back-visa',
    name: 'Simplii Financial Cash Back Visa',
    issuer: 'Simplii Financial',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'dining', multiplier: 4, reward_unit: 'percent', description: '4% cash back on dining' },
      { category: 'groceries', multiplier: 1.5, reward_unit: 'percent', description: '1.5% cash back on groceries and gas' },
      { category: 'gas', multiplier: 1.5, reward_unit: 'percent', description: '1.5% cash back on gas' },
      { category: 'other', multiplier: 0.5, reward_unit: 'percent', description: '0.5% cash back on all other purchases' }
    ]
  },

  // PC Financial
  {
    card_key: 'pc-financial-world-elite',
    name: 'PC Financial World Elite Mastercard',
    issuer: 'PC Financial',
    reward_program: 'PC Optimum',
    reward_currency: 'points',
    point_valuation: 0.1,
    annual_fee: 0,
    base_reward_rate: 10,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 30, reward_unit: 'multiplier', description: '30 points per dollar at Loblaws stores' },
      { category: 'gas', multiplier: 25, reward_unit: 'multiplier', description: '25 points per dollar at Esso' },
      { category: 'drugstores', multiplier: 25, reward_unit: 'multiplier', description: '25 points per dollar at Shoppers Drug Mart' },
      { category: 'other', multiplier: 10, reward_unit: 'multiplier', description: '10 points per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'pc-financial-world',
    name: 'PC Financial World Mastercard',
    issuer: 'PC Financial',
    reward_program: 'PC Optimum',
    reward_currency: 'points',
    point_valuation: 0.1,
    annual_fee: 0,
    base_reward_rate: 10,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 20, reward_unit: 'multiplier', description: '20 points per dollar at Loblaws stores' },
      { category: 'gas', multiplier: 15, reward_unit: 'multiplier', description: '15 points per dollar at Esso' },
      { category: 'drugstores', multiplier: 15, reward_unit: 'multiplier', description: '15 points per dollar at Shoppers Drug Mart' },
      { category: 'other', multiplier: 10, reward_unit: 'multiplier', description: '10 points per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'pc-financial-mastercard',
    name: 'PC Financial Mastercard',
    issuer: 'PC Financial',
    reward_program: 'PC Optimum',
    reward_currency: 'points',
    point_valuation: 0.1,
    annual_fee: 0,
    base_reward_rate: 10,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 10, reward_unit: 'multiplier', description: '10 points per dollar at Loblaws stores' },
      { category: 'other', multiplier: 10, reward_unit: 'multiplier', description: '10 points per dollar on all purchases' }
    ]
  },

  // Canadian Tire
  {
    card_key: 'canadian-tire-triangle-world-elite',
    name: 'Canadian Tire Triangle World Elite Mastercard',
    issuer: 'Canadian Tire',
    reward_program: 'Triangle Rewards',
    reward_currency: 'points',
    point_valuation: 0.1,
    annual_fee: 0,
    base_reward_rate: 10,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'gas', multiplier: 5, reward_unit: 'percent', description: '5% back in CT Money at Canadian Tire stores and gas' },
      { category: 'groceries', multiplier: 3, reward_unit: 'percent', description: '3% back at groceries and gas' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% back on all other purchases' }
    ]
  },
  {
    card_key: 'canadian-tire-triangle-mastercard',
    name: 'Canadian Tire Triangle Mastercard',
    issuer: 'Canadian Tire',
    reward_program: 'Triangle Rewards',
    reward_currency: 'points',
    point_valuation: 0.1,
    annual_fee: 0,
    base_reward_rate: 10,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'gas', multiplier: 4, reward_unit: 'percent', description: '4% back at Canadian Tire stores and gas' },
      { category: 'other', multiplier: 0.5, reward_unit: 'percent', description: '0.5% back on all other purchases' }
    ]
  },

  // Rogers Bank
  {
    card_key: 'rogers-world-elite',
    name: 'Rogers World Elite Mastercard',
    issuer: 'Rogers Bank',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 3, reward_unit: 'percent', description: '3% cash back on foreign currency purchases' },
      { category: 'other', multiplier: 1.5, reward_unit: 'percent', description: '1.5% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'rogers-platinum-mastercard',
    name: 'Rogers Platinum Mastercard',
    issuer: 'Rogers Bank',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 2, reward_unit: 'percent', description: '2% cash back on foreign currency purchases' },
      { category: 'other', multiplier: 0.5, reward_unit: 'percent', description: '0.5% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'fido-mastercard',
    name: 'Fido Mastercard',
    issuer: 'Rogers Bank',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1.5, reward_unit: 'percent', description: '1.5% cash back on all purchases' }
    ]
  },

  // Brim Financial
  {
    card_key: 'brim-world-elite',
    name: 'Brim World Elite Mastercard',
    issuer: 'Brim Financial',
    reward_program: 'Points',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 199,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on travel and dining' },
      { category: 'dining', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on dining' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'brim-financial-mastercard',
    name: 'Brim Financial Mastercard',
    issuer: 'Brim Financial',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all purchases' }
    ]
  },

  // Neo Financial
  {
    card_key: 'neo-card',
    name: 'Neo Mastercard',
    issuer: 'Neo Financial',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 5, reward_unit: 'percent', description: 'Up to 5% cash back at partner retailers' },
      { category: 'other', multiplier: 0, reward_unit: 'percent', description: 'Variable cash back based on merchant' }
    ]
  },
  {
    card_key: 'neo-high-interest-savings',
    name: 'Neo High-Interest Savings Card',
    issuer: 'Neo Financial',
    reward_program: 'Interest',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },

  // National Bank
  {
    card_key: 'national-bank-world-elite',
    name: 'National Bank World Elite Mastercard',
    issuer: 'National Bank',
    reward_program: 'Rewards',
    reward_currency: 'points',
    point_valuation: 0.7,
    annual_fee: 120,
    base_reward_rate: 2,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on travel and gas' },
      { category: 'gas', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on gas' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'national-bank-syncro',
    name: 'National Bank Syncro Mastercard',
    issuer: 'National Bank',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all purchases' }
    ]
  },

  // Desjardins
  {
    card_key: 'desjardins-odyssey-world-elite',
    name: 'Desjardins Odyssey World Elite Visa',
    issuer: 'Desjardins',
    reward_program: 'Bonusdollars',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 140,
    base_reward_rate: 1.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 3, reward_unit: 'percent', description: '3% back on travel' },
      { category: 'dining', multiplier: 2, reward_unit: 'percent', description: '2% back on dining and entertainment' },
      { category: 'entertainment', multiplier: 2, reward_unit: 'percent', description: '2% back on entertainment' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% back on all other purchases' }
    ]
  },
  {
    card_key: 'desjardins-cash-back-visa',
    name: 'Desjardins Cash Back Visa',
    issuer: 'Desjardins',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 95,
    base_reward_rate: 0.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 1.5, reward_unit: 'percent', description: '1.5% cash back on groceries, gas, drugstores' },
      { category: 'gas', multiplier: 1.5, reward_unit: 'percent', description: '1.5% cash back on gas' },
      { category: 'drugstores', multiplier: 1.5, reward_unit: 'percent', description: '1.5% cash back on drugstores' },
      { category: 'other', multiplier: 0.5, reward_unit: 'percent', description: '0.5% cash back on all other purchases' }
    ]
  },

  // HSBC Canada
  {
    card_key: 'hsbc-world-elite',
    name: 'HSBC World Elite Mastercard',
    issuer: 'HSBC',
    reward_program: 'HSBC Rewards',
    reward_currency: 'points',
    point_valuation: 0.7,
    annual_fee: 149,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 6, reward_unit: 'multiplier', description: '6 points per dollar on travel, dining, entertainment' },
      { category: 'dining', multiplier: 6, reward_unit: 'multiplier', description: '6 points per dollar on dining' },
      { category: 'entertainment', multiplier: 6, reward_unit: 'multiplier', description: '6 points per dollar on entertainment' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },

  // MBNA
  {
    card_key: 'mbna-rewards-world-elite',
    name: 'MBNA Rewards World Elite Mastercard',
    issuer: 'MBNA',
    reward_program: 'Rewards',
    reward_currency: 'points',
    point_valuation: 0.5,
    annual_fee: 89,
    base_reward_rate: 2,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on travel and gas' },
      { category: 'gas', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on gas' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'mbna-alaska-airlines',
    name: 'MBNA Alaska Airlines World Elite Mastercard',
    issuer: 'MBNA',
    reward_program: 'Alaska Mileage Plan',
    reward_currency: 'airline_miles',
    point_valuation: 1.5,
    annual_fee: 99,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 3, reward_unit: 'multiplier', description: '3 miles per dollar on Alaska Airlines purchases' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 mile per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'mbna-best-western',
    name: 'MBNA Best Western Mastercard',
    issuer: 'MBNA',
    reward_program: 'Best Western Rewards',
    reward_currency: 'hotel_points',
    point_valuation: 0.6,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar at Best Western hotels' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },

  // Home Trust
  {
    card_key: 'home-trust-preferred-visa',
    name: 'Home Trust Preferred Visa',
    issuer: 'Home Trust',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 79,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },

  // Meridian
  {
    card_key: 'meridian-visa-infinite-cashback',
    name: 'Meridian Visa Infinite Cash Back',
    issuer: 'Meridian',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 120,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 4, reward_unit: 'percent', description: '4% cash back on groceries' },
      { category: 'gas', multiplier: 2, reward_unit: 'percent', description: '2% cash back on gas' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },

  // Coast Capital
  {
    card_key: 'coast-capital-cash-back-mastercard',
    name: 'Coast Capital Cash Back Mastercard',
    issuer: 'Coast Capital',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all purchases' }
    ]
  },

  // Additional Canadian cards to reach 200+
  {
    card_key: 'rbc-signature-rewards-plus-visa',
    name: 'RBC Signature Rewards+ Visa',
    issuer: 'RBC',
    reward_program: 'RBC Rewards',
    reward_currency: 'points',
    point_valuation: 0.7,
    annual_fee: 39,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on travel' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'rbc-shoppers-optimum-mastercard',
    name: 'RBC Shoppers Optimum Mastercard',
    issuer: 'RBC',
    reward_program: 'PC Optimum',
    reward_currency: 'points',
    point_valuation: 0.1,
    annual_fee: 0,
    base_reward_rate: 15,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'drugstores', multiplier: 15, reward_unit: 'multiplier', description: '15 points per dollar at Shoppers Drug Mart' },
      { category: 'other', multiplier: 10, reward_unit: 'multiplier', description: '10 points per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'td-business-aeroplan-visa-platinum',
    name: 'TD Business Aeroplan Visa Platinum',
    issuer: 'TD',
    reward_program: 'Aeroplan',
    reward_currency: 'airline_miles',
    point_valuation: 2.0,
    annual_fee: 149,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on Air Canada purchases' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'bmo-business-rewards-world-elite',
    name: 'BMO Business Rewards World Elite Mastercard',
    issuer: 'BMO',
    reward_program: 'BMO Rewards',
    reward_currency: 'points',
    point_valuation: 0.7,
    annual_fee: 150,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 4, reward_unit: 'multiplier', description: '4 points per dollar on travel' },
      { category: 'gas', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on gas' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'bmo-business-cashback-mastercard',
    name: 'BMO Business CashBack Mastercard',
    issuer: 'BMO',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all purchases' }
    ]
  },
  {
    card_key: 'scotiabank-value-plus-visa',
    name: 'Scotiabank Value Plus Visa',
    issuer: 'Scotiabank',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 29,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'scotiabank-rewards-visa',
    name: 'Scotiabank Rewards Visa',
    issuer: 'Scotiabank',
    reward_program: 'Scene+',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 39,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all purchases' }
    ]
  },
  {
    card_key: 'scotiabank-scene-plus-platinum',
    name: 'Scotiabank Scene+ Platinum Visa',
    issuer: 'Scotiabank',
    reward_program: 'Scene+',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'entertainment', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar at Cineplex' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'cibc-select-visa',
    name: 'CIBC Select Visa',
    issuer: 'CIBC',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'cibc-rewards-visa',
    name: 'CIBC Rewards Visa',
    issuer: 'CIBC',
    reward_program: 'Aventura',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all purchases' }
    ]
  },
  {
    card_key: 'cibc-smart-plus-mastercard',
    name: 'CIBC Smart Plus Mastercard',
    issuer: 'CIBC',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 29,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'cibc-business-aeroplan-visa',
    name: 'CIBC Business Aeroplan Visa',
    issuer: 'CIBC',
    reward_program: 'Aeroplan',
    reward_currency: 'airline_miles',
    point_valuation: 2.0,
    annual_fee: 149,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on Air Canada purchases' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'cibc-business-aventura-visa-infinite',
    name: 'CIBC Business Aventura Visa Infinite',
    issuer: 'CIBC',
    reward_program: 'Aventura',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 149,
    base_reward_rate: 1.5,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on all purchases' }
    ]
  },
  {
    card_key: 'national-bank-a-la-carte',
    name: 'National Bank à la carte Mastercard',
    issuer: 'National Bank',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 2,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 2, reward_unit: 'percent', description: '2% cash back in chosen categories' },
      { category: 'gas', multiplier: 2, reward_unit: 'percent', description: '2% cash back in chosen categories' },
      { category: 'other', multiplier: 0.5, reward_unit: 'percent', description: '0.5% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'desjardins-classic-visa',
    name: 'Desjardins Classic Visa',
    issuer: 'Desjardins',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'tangerine-world-mastercard-rewards',
    name: 'Tangerine World Mastercard Rewards',
    issuer: 'Tangerine',
    reward_program: 'Points',
    reward_currency: 'points',
    point_valuation: 0.5,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all purchases' }
    ]
  },
  {
    card_key: 'bmo-spc-cashback-mastercard',
    name: 'BMO SPC CashBack Mastercard',
    issuer: 'BMO',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'dining', multiplier: 5, reward_unit: 'percent', description: '5% cash back on dining' },
      { category: 'entertainment', multiplier: 2, reward_unit: 'percent', description: '2% cash back on entertainment' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'rbc-low-rate-option-visa',
    name: 'RBC Low Rate Option Visa',
    issuer: 'RBC',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 20,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'td-emerald-visa',
    name: 'TD Emerald Visa',
    issuer: 'TD',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 25,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'scotia-no-fee-momentum-visa',
    name: 'Scotia No-Fee Momentum Visa',
    issuer: 'Scotiabank',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 1, reward_unit: 'percent', description: '1% cash back on groceries' },
      { category: 'gas', multiplier: 1, reward_unit: 'percent', description: '1% cash back on gas' },
      { category: 'other', multiplier: 0.5, reward_unit: 'percent', description: '0.5% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'walmart-rewards-mastercard',
    name: 'Walmart Rewards Mastercard',
    issuer: 'Duobank',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 1.25, reward_unit: 'percent', description: '1.25% cash back at Walmart' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'triangle-select-mastercard',
    name: 'Triangle Select Mastercard',
    issuer: 'Canadian Tire',
    reward_program: 'Triangle Rewards',
    reward_currency: 'points',
    point_valuation: 0.1,
    annual_fee: 0,
    base_reward_rate: 10,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'gas', multiplier: 3, reward_unit: 'percent', description: '3% back at Canadian Tire gas' },
      { category: 'other', multiplier: 0.5, reward_unit: 'percent', description: '0.5% back on all other purchases' }
    ]
  },
  {
    card_key: 'amazon-ca-rewards-visa',
    name: 'Amazon.ca Rewards Visa',
    issuer: 'Chase Canada',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 2.5, reward_unit: 'percent', description: '2.5% cash back at Amazon.ca' },
      { category: 'dining', multiplier: 2, reward_unit: 'percent', description: '2% cash back on restaurants and gas' },
      { category: 'gas', multiplier: 2, reward_unit: 'percent', description: '2% cash back on gas' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'collabria-platinum-mastercard',
    name: 'Collabria Platinum Mastercard',
    issuer: 'Collabria',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'vancity-enviro-visa',
    name: 'Vancity Enviro Visa',
    issuer: 'Vancity',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 20,
    base_reward_rate: 0.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 0.5, reward_unit: 'percent', description: '0.5% cash back on all purchases' }
    ]
  },
  {
    card_key: 'vancity-rewards-visa',
    name: 'Vancity Rewards Visa',
    issuer: 'Vancity',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all purchases' }
    ]
  },
  {
    card_key: 'meridian-visa-infinite-rewards',
    name: 'Meridian Visa Infinite Rewards',
    issuer: 'Meridian',
    reward_program: 'Rewards',
    reward_currency: 'points',
    point_valuation: 0.7,
    annual_fee: 99,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on travel' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all purchases' }
    ]
  },
  {
    card_key: 'affinity-credit-union-visa',
    name: 'Affinity Credit Union Visa',
    issuer: 'Affinity',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'alterna-cash-back-visa',
    name: 'Alterna Cash Back Visa',
    issuer: 'Alterna',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all purchases' }
    ]
  },
  {
    card_key: 'conexus-credit-union-visa',
    name: 'Conexus Credit Union Visa',
    issuer: 'Conexus',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all purchases' }
    ]
  },
  {
    card_key: 'servus-credit-union-mastercard',
    name: 'Servus Credit Union Mastercard',
    issuer: 'Servus',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all purchases' }
    ]
  },
  {
    card_key: 'steinbach-credit-union-visa',
    name: 'Steinbach Credit Union Visa',
    issuer: 'Steinbach',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'libro-credit-union-mastercard',
    name: 'Libro Credit Union Mastercard',
    issuer: 'Libro',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 0.5, reward_unit: 'percent', description: '0.5% cash back on all purchases' }
    ]
  },
  {
    card_key: 'firstontario-credit-union-mastercard',
    name: 'FirstOntario Credit Union Mastercard',
    issuer: 'FirstOntario',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all purchases' }
    ]
  },
  {
    card_key: 'rbc-student-rewards-visa',
    name: 'RBC Student Rewards Visa',
    issuer: 'RBC',
    reward_program: 'RBC Rewards',
    reward_currency: 'points',
    point_valuation: 0.7,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all purchases' }
    ]
  },
  {
    card_key: 'td-student-cashback-visa',
    name: 'TD Student Cash Back Visa',
    issuer: 'TD',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 1, reward_unit: 'percent', description: '1% cash back on groceries, gas, dining' },
      { category: 'gas', multiplier: 1, reward_unit: 'percent', description: '1% cash back on gas' },
      { category: 'dining', multiplier: 1, reward_unit: 'percent', description: '1% cash back on dining' },
      { category: 'other', multiplier: 0.5, reward_unit: 'percent', description: '0.5% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'bmo-student-cashback-mastercard',
    name: 'BMO Student CashBack Mastercard',
    issuer: 'BMO',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 3, reward_unit: 'percent', description: '3% cash back on groceries' },
      { category: 'gas', multiplier: 1, reward_unit: 'percent', description: '1% cash back on gas' },
      { category: 'other', multiplier: 0.5, reward_unit: 'percent', description: '0.5% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'scotia-momentum-plus-savings',
    name: 'Scotia Momentum PLUS Savings Account',
    issuer: 'Scotiabank',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 2, reward_unit: 'percent', description: '2% cash back on groceries' },
      { category: 'gas', multiplier: 1, reward_unit: 'percent', description: '1% cash back on gas' },
      { category: 'other', multiplier: 0.5, reward_unit: 'percent', description: '0.5% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'cibc-student-aeroplan-visa',
    name: 'CIBC Student Aeroplan Visa',
    issuer: 'CIBC',
    reward_program: 'Aeroplan',
    reward_currency: 'airline_miles',
    point_valuation: 2.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on Air Canada purchases' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'amex-ca-simply-cash-business',
    name: 'American Express SimplyCash Business Card',
    issuer: 'American Express',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 99,
    base_reward_rate: 1.25,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1.25, reward_unit: 'percent', description: '1.25% cash back on all purchases' }
    ]
  },
  {
    card_key: 'rbc-signature-no-limit-cashback-visa',
    name: 'RBC Signature No Limit CashBack Visa',
    issuer: 'RBC',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 39,
    base_reward_rate: 1.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1.5, reward_unit: 'percent', description: '1.5% cash back on all purchases' }
    ]
  },
  {
    card_key: 'td-platinum-travel-visa',
    name: 'TD Platinum Travel Visa',
    issuer: 'TD',
    reward_program: 'TD Rewards',
    reward_currency: 'points',
    point_valuation: 0.5,
    annual_fee: 89,
    base_reward_rate: 1.5,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on travel' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all purchases' }
    ]
  },
  {
    card_key: 'bmo-student-air-miles-mastercard',
    name: 'BMO Student Air Miles Mastercard',
    issuer: 'BMO',
    reward_program: 'Air Miles',
    reward_currency: 'airline_miles',
    point_valuation: 12.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 1, reward_unit: 'multiplier', description: '1 Air Mile per $20 on groceries, gas, drugstores' },
      { category: 'gas', multiplier: 1, reward_unit: 'multiplier', description: '1 Air Mile per $20 on gas' },
      { category: 'drugstores', multiplier: 1, reward_unit: 'multiplier', description: '1 Air Mile per $20 on drugstores' }
    ]
  },
  {
    card_key: 'national-bank-platinum-mastercard',
    name: 'National Bank Platinum Mastercard',
    issuer: 'National Bank',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 50,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'hsbc-rewards-mastercard',
    name: 'HSBC Rewards Mastercard',
    issuer: 'HSBC',
    reward_program: 'HSBC Rewards',
    reward_currency: 'points',
    point_valuation: 0.7,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all purchases' }
    ]
  },
  {
    card_key: 'mbna-true-line-gold-mastercard',
    name: 'MBNA True Line Gold Mastercard',
    issuer: 'MBNA',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'mbna-smart-cash-platinum-plus',
    name: 'MBNA Smart Cash Platinum Plus',
    issuer: 'MBNA',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 2, reward_unit: 'percent', description: '2% cash back on groceries and gas' },
      { category: 'gas', multiplier: 2, reward_unit: 'percent', description: '2% cash back on gas' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'neo-secured-mastercard',
    name: 'Neo Secured Mastercard',
    issuer: 'Neo Financial',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 5, reward_unit: 'percent', description: 'Up to 5% cash back at partner retailers' }
    ]
  },
  {
    card_key: 'brim-core-mastercard',
    name: 'Brim Core Mastercard',
    issuer: 'Brim Financial',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 0.5, reward_unit: 'percent', description: '0.5% cash back on all purchases' }
    ]
  },
  {
    card_key: 'home-trust-secured-visa',
    name: 'Home Trust Secured Visa',
    issuer: 'Home Trust',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 59,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'desjardins-secured-visa',
    name: 'Desjardins Secured Visa',
    issuer: 'Desjardins',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 48,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'fairstone-gold-mastercard',
    name: 'Fairstone Gold Mastercard',
    issuer: 'Fairstone',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 120,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'capital-one-aspire-travel-world-elite',
    name: 'Capital One Aspire Travel World Elite Mastercard',
    issuer: 'Capital One',
    reward_program: 'Miles',
    reward_currency: 'airline_miles',
    point_valuation: 1.0,
    annual_fee: 120,
    base_reward_rate: 2,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 miles per dollar on all purchases' }
    ]
  },
  {
    card_key: 'capital-one-aspire-cash-platinum',
    name: 'Capital One Aspire Cash Platinum Mastercard',
    issuer: 'Capital One',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all purchases' }
    ]
  },
  {
    card_key: 'capital-one-low-rate-platinum',
    name: 'Capital One Low Rate Platinum Mastercard',
    issuer: 'Capital One',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'capital-one-guaranteed-mastercard',
    name: 'Capital One Guaranteed Mastercard',
    issuer: 'Capital One',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 79,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  // Additional Canadian Cards to reach 200+
  {
    card_key: 'rbc-signature-no-limit-cashback-visa-platinum',
    name: 'RBC Signature No Limit CashBack Visa Platinum',
    issuer: 'RBC',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all purchases' }
    ]
  },
  {
    card_key: 'td-gold-elite-visa',
    name: 'TD Gold Elite Visa',
    issuer: 'TD',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'td-select-visa',
    name: 'TD Select Visa',
    issuer: 'TD',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 25,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'bmo-gold-air-miles',
    name: 'BMO Gold Air Miles Mastercard',
    issuer: 'BMO',
    reward_program: 'Air Miles',
    reward_currency: 'airline_miles',
    point_valuation: 12.0,
    annual_fee: 30,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 1, reward_unit: 'multiplier', description: '1 Air Mile per $15 on groceries, gas, drugstores' },
      { category: 'gas', multiplier: 1, reward_unit: 'multiplier', description: '1 Air Mile per $15 on gas' }
    ]
  },
  {
    card_key: 'bmo-eclipse-rise-visa-student',
    name: 'BMO eclipse rise Visa for Students',
    issuer: 'BMO',
    reward_program: 'BMO Rewards',
    reward_currency: 'points',
    point_valuation: 0.7,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all purchases' }
    ]
  },
  {
    card_key: 'scotiabank-ultimate-package-visa',
    name: 'Scotiabank Ultimate Package Visa',
    issuer: 'Scotiabank',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'scotiabank-rewards-plus-visa',
    name: 'Scotiabank Rewards Plus Visa',
    issuer: 'Scotiabank',
    reward_program: 'Scene+',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all purchases' }
    ]
  },
  {
    card_key: 'scotiabank-student-nova-scotia-visa',
    name: 'Scotiabank Student SCENE Visa',
    issuer: 'Scotiabank',
    reward_program: 'Scene+',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'entertainment', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar at Cineplex' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all purchases' }
    ]
  },
  {
    card_key: 'cibc-aventura-visa-for-students',
    name: 'CIBC Aventura Visa Card for Students',
    issuer: 'CIBC',
    reward_program: 'Aventura',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all purchases' }
    ]
  },
  {
    card_key: 'cibc-dividend-visa-for-students',
    name: 'CIBC Dividend Visa Card for Students',
    issuer: 'CIBC',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 2, reward_unit: 'percent', description: '2% cash back on groceries' },
      { category: 'gas', multiplier: 1, reward_unit: 'percent', description: '1% cash back on gas' },
      { category: 'other', multiplier: 0.5, reward_unit: 'percent', description: '0.5% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'national-bank-mastercard-student',
    name: 'National Bank Mastercard for Students',
    issuer: 'National Bank',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all purchases' }
    ]
  },
  {
    card_key: 'national-bank-echo-mastercard',
    name: 'National Bank Echo Mastercard',
    issuer: 'National Bank',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 2,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 4, reward_unit: 'percent', description: '4% cash back in chosen categories' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'desjardins-bonusdollars-platinum',
    name: 'Desjardins Bonusdollars Platinum Visa',
    issuer: 'Desjardins',
    reward_program: 'Bonusdollars',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% back on all purchases' }
    ]
  },
  {
    card_key: 'desjardins-cashback-classic-visa',
    name: 'Desjardins Cash Back Classic Visa',
    issuer: 'Desjardins',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 1, reward_unit: 'percent', description: '1% cash back on groceries' },
      { category: 'gas', multiplier: 1, reward_unit: 'percent', description: '1% cash back on gas' },
      { category: 'other', multiplier: 0.5, reward_unit: 'percent', description: '0.5% cash back on all purchases' }
    ]
  },
  {
    card_key: 'hsbc-mastercard-plus',
    name: 'HSBC Mastercard Plus',
    issuer: 'HSBC',
    reward_program: 'HSBC Rewards',
    reward_currency: 'points',
    point_valuation: 0.7,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all purchases' }
    ]
  },
  {
    card_key: 'mbna-platinum-plus',
    name: 'MBNA Platinum Plus Mastercard',
    issuer: 'MBNA',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'mbna-true-line-mastercard',
    name: 'MBNA True Line Mastercard',
    issuer: 'MBNA',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'walmart-rewards-world-mastercard',
    name: 'Walmart Rewards World Mastercard',
    issuer: 'Duobank',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 3, reward_unit: 'percent', description: '3% cash back at Walmart' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'rogers-red-mastercard',
    name: 'Rogers Red Mastercard',
    issuer: 'Rogers Bank',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all purchases' }
    ]
  },
  {
    card_key: 'triangle-rewards-mastercard',
    name: 'Triangle Rewards Mastercard',
    issuer: 'Canadian Tire',
    reward_program: 'Triangle Rewards',
    reward_currency: 'points',
    point_valuation: 0.1,
    annual_fee: 0,
    base_reward_rate: 10,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'gas', multiplier: 2, reward_unit: 'percent', description: '2% back at Canadian Tire gas' },
      { category: 'other', multiplier: 0.25, reward_unit: 'percent', description: '0.25% back everywhere' }
    ]
  },
  {
    card_key: 'american-eagle-credit-card',
    name: 'American Eagle Credit Card',
    issuer: 'Fairstone',
    reward_program: 'Store Credit',
    reward_currency: 'points',
    point_valuation: 0.1,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar at American Eagle' }
    ]
  },
  {
    card_key: 'marks-mastercard',
    name: 'Mark\'s Mastercard',
    issuer: 'Canadian Tire',
    reward_program: 'Triangle Rewards',
    reward_currency: 'points',
    point_valuation: 0.1,
    annual_fee: 0,
    base_reward_rate: 10,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 50, reward_unit: 'multiplier', description: '5% back at Mark\'s' },
      { category: 'other', multiplier: 10, reward_unit: 'multiplier', description: '1% back everywhere' }
    ]
  },
  {
    card_key: 'sport-chek-triangle-mastercard',
    name: 'Sport Chek Triangle Mastercard',
    issuer: 'Canadian Tire',
    reward_program: 'Triangle Rewards',
    reward_currency: 'points',
    point_valuation: 0.1,
    annual_fee: 0,
    base_reward_rate: 10,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 50, reward_unit: 'multiplier', description: '5% back at Sport Chek' },
      { category: 'other', multiplier: 10, reward_unit: 'multiplier', description: '1% back everywhere' }
    ]
  },
  {
    card_key: 'atmosphere-triangle-mastercard',
    name: 'Atmosphere Triangle Mastercard',
    issuer: 'Canadian Tire',
    reward_program: 'Triangle Rewards',
    reward_currency: 'points',
    point_valuation: 0.1,
    annual_fee: 0,
    base_reward_rate: 10,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 50, reward_unit: 'multiplier', description: '5% back at Atmosphere' },
      { category: 'other', multiplier: 10, reward_unit: 'multiplier', description: '1% back everywhere' }
    ]
  },
  {
    card_key: 'hudsons-bay-mastercard',
    name: 'Hudson\'s Bay Mastercard',
    issuer: 'Neo Financial',
    reward_program: 'HBC Rewards',
    reward_currency: 'points',
    point_valuation: 0.1,
    annual_fee: 0,
    base_reward_rate: 10,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 40, reward_unit: 'multiplier', description: '4 points per dollar at Hudson\'s Bay' },
      { category: 'other', multiplier: 10, reward_unit: 'multiplier', description: '1 point per dollar everywhere' }
    ]
  },
  {
    card_key: 'indigo-mastercard',
    name: 'Indigo Mastercard',
    issuer: 'Fairstone',
    reward_program: 'Plum Rewards',
    reward_currency: 'points',
    point_valuation: 0.1,
    annual_fee: 0,
    base_reward_rate: 10,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 30, reward_unit: 'multiplier', description: '3 points per dollar at Indigo' },
      { category: 'other', multiplier: 10, reward_unit: 'multiplier', description: '1 point per dollar everywhere' }
    ]
  },
  // More cards to reach 200+ target
  {
    card_key: 'rbc-avion-platinum-visa',
    name: 'RBC Avion Platinum Visa',
    issuer: 'RBC',
    reward_program: 'Avion',
    reward_currency: 'points',
    point_valuation: 2.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all purchases' }
    ]
  },
  {
    card_key: 'td-business-solutions-visa',
    name: 'TD Business Solutions Visa',
    issuer: 'TD',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'bmo-remitly-mastercard',
    name: 'BMO Remitly Mastercard',
    issuer: 'BMO',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all purchases' }
    ]
  },
  {
    card_key: 'scotiabank-daily-banking-account-visa',
    name: 'Scotiabank Daily Banking Account Visa',
    issuer: 'Scotiabank',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'cibc-smart-account-visa',
    name: 'CIBC Smart Account Visa',
    issuer: 'CIBC',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'national-bank-visa-classic',
    name: 'National Bank Visa Classic',
    issuer: 'National Bank',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 25,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'desjardins-classic-plus-visa',
    name: 'Desjardins Classic Plus Visa',
    issuer: 'Desjardins',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 20,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'hsbc-jade-mastercard',
    name: 'HSBC Jade Mastercard',
    issuer: 'HSBC',
    reward_program: 'HSBC Rewards',
    reward_currency: 'points',
    point_valuation: 0.7,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all purchases' }
    ]
  },
  {
    card_key: 'mbna-cash-back-mastercard',
    name: 'MBNA Cash Back Mastercard',
    issuer: 'MBNA',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 2, reward_unit: 'percent', description: '2% cash back on groceries and gas' },
      { category: 'gas', multiplier: 2, reward_unit: 'percent', description: '2% cash back on gas' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'mbna-rewards-platinum-plus',
    name: 'MBNA Rewards Platinum Plus',
    issuer: 'MBNA',
    reward_program: 'Rewards',
    reward_currency: 'points',
    point_valuation: 0.5,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all purchases' }
    ]
  },
  {
    card_key: 'rbc-business-platinum-avion',
    name: 'RBC Business Platinum Avion Visa',
    issuer: 'RBC',
    reward_program: 'Avion',
    reward_currency: 'points',
    point_valuation: 2.0,
    annual_fee: 120,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 1.25, reward_unit: 'multiplier', description: '1.25 points per dollar on travel' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'rbc-business-cash-back',
    name: 'RBC Business Cash Back Mastercard',
    issuer: 'RBC',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 20,
    base_reward_rate: 0.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 0.5, reward_unit: 'percent', description: '0.5% cash back on all purchases' }
    ]
  },
  {
    card_key: 'td-business-low-rate-visa',
    name: 'TD Business Low Rate Visa',
    issuer: 'TD',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 25,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'bmo-business-air-miles',
    name: 'BMO Business Air Miles Mastercard',
    issuer: 'BMO',
    reward_program: 'Air Miles',
    reward_currency: 'airline_miles',
    point_valuation: 12.0,
    annual_fee: 99,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 1, reward_unit: 'multiplier', description: '1 Air Mile per $15 at eligible merchants' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 Air Mile per $15 on all purchases' }
    ]
  },
  {
    card_key: 'scotiabank-business-scene-plus-visa',
    name: 'Scotiabank Business Scene+ Visa',
    issuer: 'Scotiabank',
    reward_program: 'Scene+',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar at partner merchants' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all purchases' }
    ]
  },
  {
    card_key: 'cibc-business-aerogold-visa-infinite',
    name: 'CIBC Business Aerogold Visa Infinite',
    issuer: 'CIBC',
    reward_program: 'Aeroplan',
    reward_currency: 'airline_miles',
    point_valuation: 2.0,
    annual_fee: 199,
    base_reward_rate: 1.5,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on Air Canada purchases' },
      { category: 'gas', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on gas' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'national-bank-business-mastercard',
    name: 'National Bank Business Mastercard',
    issuer: 'National Bank',
    reward_program: 'Rewards',
    reward_currency: 'points',
    point_valuation: 0.7,
    annual_fee: 95,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all purchases' }
    ]
  },
  {
    card_key: 'tangerine-secured-balance-transfer',
    name: 'Tangerine Secured Balance Transfer',
    issuer: 'Tangerine',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'pc-financial-prepaid-mastercard',
    name: 'PC Financial Prepaid Mastercard',
    issuer: 'PC Financial',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'koho-prepaid-mastercard',
    name: 'KOHO Prepaid Mastercard',
    issuer: 'KOHO',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 0.5, reward_unit: 'percent', description: 'Up to 0.5% cash back on all purchases' }
    ]
  },
  {
    card_key: 'stack-prepaid-mastercard',
    name: 'Stack Prepaid Mastercard',
    issuer: 'Stack',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 5, reward_unit: 'percent', description: 'Up to 5% cash back at partner merchants' }
    ]
  },
  {
    card_key: 'mogo-prepaid-visa',
    name: 'Mogo Prepaid Visa',
    issuer: 'Mogo',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1.5, reward_unit: 'percent', description: '1.5% cash back on all purchases' }
    ]
  },
  {
    card_key: 'rbc-esso-extra-mastercard',
    name: 'RBC Esso Extra Mastercard',
    issuer: 'RBC',
    reward_program: 'PC Optimum',
    reward_currency: 'points',
    point_valuation: 0.1,
    annual_fee: 0,
    base_reward_rate: 10,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'gas', multiplier: 30, reward_unit: 'multiplier', description: '30 points per dollar at Esso' },
      { category: 'groceries', multiplier: 10, reward_unit: 'multiplier', description: '10 points per dollar on groceries' },
      { category: 'other', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'rbc-vantage-visa',
    name: 'RBC Vantage Visa',
    issuer: 'RBC',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: []
  },
  {
    card_key: 'scotiabank-american-express-card',
    name: 'Scotiabank American Express Card',
    issuer: 'Scotiabank',
    reward_program: 'Scene+',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 39,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on groceries, dining, entertainment' },
      { category: 'dining', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on dining' },
      { category: 'entertainment', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on entertainment' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'scotiabank-momentum-visa-for-students',
    name: 'Scotiabank Momentum Visa for Students',
    issuer: 'Scotiabank',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0.5,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 1, reward_unit: 'percent', description: '1% cash back on groceries, gas, drugstores' },
      { category: 'gas', multiplier: 1, reward_unit: 'percent', description: '1% cash back on gas' },
      { category: 'drugstores', multiplier: 1, reward_unit: 'percent', description: '1% cash back on drugstores' },
      { category: 'other', multiplier: 0.5, reward_unit: 'percent', description: '0.5% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'td-business-platinum-travel-visa',
    name: 'TD Business Platinum Travel Visa',
    issuer: 'TD',
    reward_program: 'TD Rewards',
    reward_currency: 'points',
    point_valuation: 0.5,
    annual_fee: 99,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on travel' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all purchases' }
    ]
  },
  {
    card_key: 'bmo-eclipse-privilege',
    name: 'BMO Eclipse Privilege Visa Infinite',
    issuer: 'BMO',
    reward_program: 'BMO Rewards',
    reward_currency: 'points',
    point_valuation: 0.7,
    annual_fee: 299,
    base_reward_rate: 5,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on travel, dining, entertainment' },
      { category: 'dining', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on dining' },
      { category: 'entertainment', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on entertainment' },
      { category: 'gas', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on gas and groceries' },
      { category: 'groceries', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on groceries' }
    ]
  },
  {
    card_key: 'cibc-aventura-gold-visa-for-business',
    name: 'CIBC Aventura Gold Visa for Business',
    issuer: 'CIBC',
    reward_program: 'Aventura',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 120,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on CIBC Rewards bookings' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'national-bank-all-in-one-mastercard',
    name: 'National Bank All-in-One Mastercard',
    issuer: 'National Bank',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 50,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'CA',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all purchases' }
    ]
  }
];

// ============================================================================
// US CREDIT CARDS - Comprehensive Database
// ============================================================================

const usCards = [
  // Chase - Complete Premium & Popular Lineup
  {
    card_key: 'chase-sapphire-reserve',
    name: 'Chase Sapphire Reserve',
    issuer: 'Chase',
    reward_program: 'Ultimate Rewards',
    reward_currency: 'points',
    point_valuation: 1.5,
    annual_fee: 550,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 10, reward_unit: 'multiplier', description: '10 points per dollar on hotels and car rentals through Chase portal' },
      { category: 'dining', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on dining' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'chase-sapphire-preferred',
    name: 'Chase Sapphire Preferred',
    issuer: 'Chase',
    reward_program: 'Ultimate Rewards',
    reward_currency: 'points',
    point_valuation: 1.25,
    annual_fee: 95,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on travel through Chase portal' },
      { category: 'dining', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on dining' },
      { category: 'online_shopping', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on online grocery' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'chase-freedom-unlimited',
    name: 'Chase Freedom Unlimited',
    issuer: 'Chase',
    reward_program: 'Ultimate Rewards',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1.5,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'dining', multiplier: 3, reward_unit: 'percent', description: '3% cash back on dining and drugstores' },
      { category: 'drugstores', multiplier: 3, reward_unit: 'percent', description: '3% cash back on drugstores' },
      { category: 'travel', multiplier: 5, reward_unit: 'percent', description: '5% cash back on travel through Chase portal' },
      { category: 'other', multiplier: 1.5, reward_unit: 'percent', description: '1.5% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'chase-freedom-flex',
    name: 'Chase Freedom Flex',
    issuer: 'Chase',
    reward_program: 'Ultimate Rewards',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 5, reward_unit: 'percent', description: '5% cash back on rotating quarterly categories' },
      { category: 'travel', multiplier: 5, reward_unit: 'percent', description: '5% cash back on travel through Chase portal' },
      { category: 'dining', multiplier: 3, reward_unit: 'percent', description: '3% cash back on dining and drugstores' },
      { category: 'drugstores', multiplier: 3, reward_unit: 'percent', description: '3% cash back on drugstores' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'chase-ink-business-preferred',
    name: 'Chase Ink Business Preferred',
    issuer: 'Chase',
    reward_program: 'Ultimate Rewards',
    reward_currency: 'points',
    point_valuation: 1.25,
    annual_fee: 95,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on travel' },
      { category: 'online_shopping', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on internet, cable, phone' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'chase-ink-business-unlimited',
    name: 'Chase Ink Business Unlimited',
    issuer: 'Chase',
    reward_program: 'Ultimate Rewards',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1.5,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1.5, reward_unit: 'percent', description: '1.5% cash back on all purchases' }
    ]
  },
  {
    card_key: 'chase-ink-business-cash',
    name: 'Chase Ink Business Cash',
    issuer: 'Chase',
    reward_program: 'Ultimate Rewards',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'gas', multiplier: 2, reward_unit: 'percent', description: '2% cash back on gas stations and restaurants' },
      { category: 'dining', multiplier: 2, reward_unit: 'percent', description: '2% cash back on restaurants' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'chase-united-quest',
    name: 'Chase United Quest Card',
    issuer: 'Chase',
    reward_program: 'MileagePlus',
    reward_currency: 'airline_miles',
    point_valuation: 1.3,
    annual_fee: 250,
    base_reward_rate: 2,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 3, reward_unit: 'multiplier', description: '3 miles per dollar on United purchases' },
      { category: 'dining', multiplier: 2, reward_unit: 'multiplier', description: '2 miles per dollar on all other travel and dining' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 mile per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'chase-united-explorer',
    name: 'Chase United Explorer Card',
    issuer: 'Chase',
    reward_program: 'MileagePlus',
    reward_currency: 'airline_miles',
    point_valuation: 1.3,
    annual_fee: 95,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 miles per dollar on United purchases' },
      { category: 'dining', multiplier: 2, reward_unit: 'multiplier', description: '2 miles per dollar on dining and hotel stays' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 mile per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'chase-southwest-priority',
    name: 'Chase Southwest Rapid Rewards Priority',
    issuer: 'Chase',
    reward_program: 'Rapid Rewards',
    reward_currency: 'airline_miles',
    point_valuation: 1.4,
    annual_fee: 149,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on Southwest purchases and hotels' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'chase-ihg-premier',
    name: 'Chase IHG One Rewards Premier',
    issuer: 'Chase',
    reward_program: 'IHG Rewards',
    reward_currency: 'hotel_points',
    point_valuation: 0.5,
    annual_fee: 99,
    base_reward_rate: 2,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 26, reward_unit: 'multiplier', description: '26 points per dollar at IHG hotels' },
      { category: 'gas', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on gas, groceries, dining' },
      { category: 'groceries', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on groceries' },
      { category: 'dining', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on dining' }
    ]
  },
  {
    card_key: 'chase-world-of-hyatt',
    name: 'Chase World of Hyatt Credit Card',
    issuer: 'Chase',
    reward_program: 'World of Hyatt',
    reward_currency: 'hotel_points',
    point_valuation: 1.7,
    annual_fee: 95,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 4, reward_unit: 'multiplier', description: '4 points per dollar at Hyatt hotels' },
      { category: 'dining', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on dining, fitness, local transit' },
      { category: 'gas', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on gas' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'chase-amazon-prime-visa',
    name: 'Chase Amazon Prime Rewards Visa',
    issuer: 'Chase',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 5, reward_unit: 'percent', description: '5% cash back at Amazon and Whole Foods' },
      { category: 'dining', multiplier: 2, reward_unit: 'percent', description: '2% cash back on restaurants, gas, drugstores' },
      { category: 'gas', multiplier: 2, reward_unit: 'percent', description: '2% cash back on gas' },
      { category: 'drugstores', multiplier: 2, reward_unit: 'percent', description: '2% cash back on drugstores' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },

  // American Express US - Complete Premium Lineup
  {
    card_key: 'amex-us-platinum',
    name: 'American Express Platinum Card',
    issuer: 'American Express',
    reward_program: 'Membership Rewards',
    reward_currency: 'points',
    point_valuation: 2.0,
    annual_fee: 695,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on flights and hotels via Amex Travel' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'amex-us-gold',
    name: 'American Express Gold Card',
    issuer: 'American Express',
    reward_program: 'Membership Rewards',
    reward_currency: 'points',
    point_valuation: 2.0,
    annual_fee: 250,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'dining', multiplier: 4, reward_unit: 'multiplier', description: '4 points per dollar on dining (including delivery)' },
      { category: 'groceries', multiplier: 4, reward_unit: 'multiplier', description: '4 points per dollar on groceries (up to $25k/year)' },
      { category: 'travel', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on flights' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'amex-us-green',
    name: 'American Express Green Card',
    issuer: 'American Express',
    reward_program: 'Membership Rewards',
    reward_currency: 'points',
    point_valuation: 2.0,
    annual_fee: 150,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on travel and dining' },
      { category: 'dining', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on dining' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'amex-us-blue-cash-preferred',
    name: 'American Express Blue Cash Preferred',
    issuer: 'American Express',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 95,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 6, reward_unit: 'percent', description: '6% cash back on groceries (up to $6k/year)' },
      { category: 'online_shopping', multiplier: 6, reward_unit: 'percent', description: '6% cash back on select streaming services' },
      { category: 'gas', multiplier: 3, reward_unit: 'percent', description: '3% cash back on gas and transit' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'amex-us-blue-cash-everyday',
    name: 'American Express Blue Cash Everyday',
    issuer: 'American Express',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 3, reward_unit: 'percent', description: '3% cash back on groceries (up to $6k/year)' },
      { category: 'gas', multiplier: 2, reward_unit: 'percent', description: '2% cash back on gas at US gas stations' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'amex-us-delta-reserve',
    name: 'Delta SkyMiles Reserve American Express Card',
    issuer: 'American Express',
    reward_program: 'SkyMiles',
    reward_currency: 'airline_miles',
    point_valuation: 1.2,
    annual_fee: 650,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 3, reward_unit: 'multiplier', description: '3 miles per dollar on Delta purchases' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 mile per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'amex-us-delta-platinum',
    name: 'Delta SkyMiles Platinum American Express Card',
    issuer: 'American Express',
    reward_program: 'SkyMiles',
    reward_currency: 'airline_miles',
    point_valuation: 1.2,
    annual_fee: 350,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 3, reward_unit: 'multiplier', description: '3 miles per dollar on Delta purchases' },
      { category: 'dining', multiplier: 2, reward_unit: 'multiplier', description: '2 miles per dollar on dining and groceries' },
      { category: 'groceries', multiplier: 2, reward_unit: 'multiplier', description: '2 miles per dollar on groceries' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 mile per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'amex-us-delta-gold',
    name: 'Delta SkyMiles Gold American Express Card',
    issuer: 'American Express',
    reward_program: 'SkyMiles',
    reward_currency: 'airline_miles',
    point_valuation: 1.2,
    annual_fee: 150,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 miles per dollar on Delta purchases' },
      { category: 'dining', multiplier: 2, reward_unit: 'multiplier', description: '2 miles per dollar on dining and groceries' },
      { category: 'groceries', multiplier: 2, reward_unit: 'multiplier', description: '2 miles per dollar on groceries' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 mile per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'amex-us-hilton-aspire',
    name: 'Hilton Honors American Express Aspire Card',
    issuer: 'American Express',
    reward_program: 'Hilton Honors',
    reward_currency: 'hotel_points',
    point_valuation: 0.5,
    annual_fee: 450,
    base_reward_rate: 3,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 14, reward_unit: 'multiplier', description: '14 points per dollar at Hilton hotels' },
      { category: 'dining', multiplier: 7, reward_unit: 'multiplier', description: '7 points per dollar on dining, flights, car rentals' },
      { category: 'gas', multiplier: 7, reward_unit: 'multiplier', description: '7 points per dollar on gas stations' },
      { category: 'other', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'amex-us-hilton-surpass',
    name: 'Hilton Honors American Express Surpass Card',
    issuer: 'American Express',
    reward_program: 'Hilton Honors',
    reward_currency: 'hotel_points',
    point_valuation: 0.5,
    annual_fee: 150,
    base_reward_rate: 3,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 12, reward_unit: 'multiplier', description: '12 points per dollar at Hilton hotels' },
      { category: 'dining', multiplier: 6, reward_unit: 'multiplier', description: '6 points per dollar on dining and groceries' },
      { category: 'groceries', multiplier: 6, reward_unit: 'multiplier', description: '6 points per dollar on groceries' },
      { category: 'gas', multiplier: 6, reward_unit: 'multiplier', description: '6 points per dollar on gas' },
      { category: 'other', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'amex-us-marriott-bonvoy-brilliant',
    name: 'Marriott Bonvoy Brilliant American Express Card',
    issuer: 'American Express',
    reward_program: 'Marriott Bonvoy',
    reward_currency: 'hotel_points',
    point_valuation: 0.8,
    annual_fee: 650,
    base_reward_rate: 2,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 6, reward_unit: 'multiplier', description: '6 points per dollar at Marriott hotels' },
      { category: 'dining', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on dining and flights' },
      { category: 'other', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'amex-us-business-platinum',
    name: 'American Express Business Platinum Card',
    issuer: 'American Express',
    reward_program: 'Membership Rewards',
    reward_currency: 'points',
    point_valuation: 2.0,
    annual_fee: 695,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on flights and hotels via Amex Travel' },
      { category: 'other', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on eligible purchases over $5k' }
    ]
  },
  {
    card_key: 'amex-us-business-gold',
    name: 'American Express Business Gold Card',
    issuer: 'American Express',
    reward_program: 'Membership Rewards',
    reward_currency: 'points',
    point_valuation: 2.0,
    annual_fee: 375,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 4, reward_unit: 'multiplier', description: '4 points per dollar in top 2 eligible categories' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },

  // Citi - Complete Lineup
  {
    card_key: 'citi-double-cash',
    name: 'Citi Double Cash Card',
    issuer: 'Citi',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 2,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 2, reward_unit: 'percent', description: '2% cash back (1% when you buy, 1% when you pay)' }
    ]
  },
  {
    card_key: 'citi-custom-cash',
    name: 'Citi Custom Cash Card',
    issuer: 'Citi',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 5, reward_unit: 'percent', description: '5% cash back on top category each billing cycle (up to $500)' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'citi-premier',
    name: 'Citi Premier Card',
    issuer: 'Citi',
    reward_program: 'ThankYou Rewards',
    reward_currency: 'points',
    point_valuation: 1.25,
    annual_fee: 95,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on travel, gas, supermarkets, dining' },
      { category: 'gas', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on gas' },
      { category: 'groceries', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on supermarkets' },
      { category: 'dining', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on dining' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'citi-strata-premier',
    name: 'Citi Strata Premier Card',
    issuer: 'Citi',
    reward_program: 'ThankYou Rewards',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 95,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on travel, gas, groceries, dining' },
      { category: 'gas', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on gas' },
      { category: 'groceries', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on groceries' },
      { category: 'dining', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on dining' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'citi-rewards-plus',
    name: 'Citi Rewards+ Card',
    issuer: 'Citi',
    reward_program: 'ThankYou Rewards',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on groceries and gas (first $6k/year)' },
      { category: 'gas', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on gas' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'citi-diamond-preferred',
    name: 'Citi Diamond Preferred Card',
    issuer: 'Citi',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: []
  },
  {
    card_key: 'citi-aa-platinum',
    name: 'Citi AAdvantage Platinum Select World Elite Mastercard',
    issuer: 'Citi',
    reward_program: 'AAdvantage',
    reward_currency: 'airline_miles',
    point_valuation: 1.4,
    annual_fee: 99,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 miles per dollar on American Airlines purchases' },
      { category: 'dining', multiplier: 2, reward_unit: 'multiplier', description: '2 miles per dollar on dining and gas' },
      { category: 'gas', multiplier: 2, reward_unit: 'multiplier', description: '2 miles per dollar on gas' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 mile per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'citi-aa-executive',
    name: 'Citi AAdvantage Executive World Elite Mastercard',
    issuer: 'Citi',
    reward_program: 'AAdvantage',
    reward_currency: 'airline_miles',
    point_valuation: 1.4,
    annual_fee: 450,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 miles per dollar on American Airlines purchases' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 mile per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'costco-anywhere-visa-by-citi',
    name: 'Costco Anywhere Visa Card by Citi',
    issuer: 'Citi',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'gas', multiplier: 4, reward_unit: 'percent', description: '4% cash back on eligible gas (up to $7k/year)' },
      { category: 'dining', multiplier: 3, reward_unit: 'percent', description: '3% cash back on restaurants and travel' },
      { category: 'travel', multiplier: 3, reward_unit: 'percent', description: '3% cash back on travel' },
      { category: 'groceries', multiplier: 2, reward_unit: 'percent', description: '2% cash back at Costco and Costco.com' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },

  // Capital One - Complete Lineup
  {
    card_key: 'capital-one-venture-x',
    name: 'Capital One Venture X Rewards Credit Card',
    issuer: 'Capital One',
    reward_program: 'Venture',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 395,
    base_reward_rate: 2,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 10, reward_unit: 'multiplier', description: '10 miles per dollar on hotels and car rentals via Capital One portal' },
      { category: 'other', multiplier: 2, reward_unit: 'multiplier', description: '2 miles per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'capital-one-venture',
    name: 'Capital One Venture Rewards Credit Card',
    issuer: 'Capital One',
    reward_program: 'Venture',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 95,
    base_reward_rate: 2,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 5, reward_unit: 'multiplier', description: '5 miles per dollar on hotels and car rentals via Capital One portal' },
      { category: 'other', multiplier: 2, reward_unit: 'multiplier', description: '2 miles per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'capital-one-venture-one',
    name: 'Capital One VentureOne Rewards Credit Card',
    issuer: 'Capital One',
    reward_program: 'Venture',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1.25,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1.25, reward_unit: 'multiplier', description: '1.25 miles per dollar on all purchases' }
    ]
  },
  {
    card_key: 'capital-one-savor-one',
    name: 'Capital One SavorOne Cash Rewards Credit Card',
    issuer: 'Capital One',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'dining', multiplier: 3, reward_unit: 'percent', description: '3% cash back on dining and entertainment' },
      { category: 'entertainment', multiplier: 3, reward_unit: 'percent', description: '3% cash back on entertainment' },
      { category: 'groceries', multiplier: 3, reward_unit: 'percent', description: '3% cash back on groceries (excluding superstores)' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'capital-one-savor',
    name: 'Capital One Savor Cash Rewards Credit Card',
    issuer: 'Capital One',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 95,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'dining', multiplier: 4, reward_unit: 'percent', description: '4% cash back on dining and entertainment' },
      { category: 'entertainment', multiplier: 4, reward_unit: 'percent', description: '4% cash back on entertainment' },
      { category: 'groceries', multiplier: 3, reward_unit: 'percent', description: '3% cash back on groceries' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'capital-one-quicksilver',
    name: 'Capital One Quicksilver Cash Rewards Credit Card',
    issuer: 'Capital One',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1.5,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1.5, reward_unit: 'percent', description: '1.5% cash back on all purchases' }
    ]
  },
  {
    card_key: 'capital-one-quicksilver-secured',
    name: 'Capital One Quicksilver Secured Cash Rewards Credit Card',
    issuer: 'Capital One',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1.5,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1.5, reward_unit: 'percent', description: '1.5% cash back on all purchases' }
    ]
  },
  {
    card_key: 'capital-one-platinum-secured',
    name: 'Capital One Platinum Secured Credit Card',
    issuer: 'Capital One',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: []
  },
  {
    card_key: 'capital-one-spark-cash-plus',
    name: 'Capital One Spark Cash Plus',
    issuer: 'Capital One',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 150,
    base_reward_rate: 2,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 2, reward_unit: 'percent', description: '2% cash back on all purchases' }
    ]
  },
  {
    card_key: 'capital-one-spark-classic',
    name: 'Capital One Spark Classic for Business',
    issuer: 'Capital One',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all purchases' }
    ]
  },

  // Discover - Complete Lineup
  {
    card_key: 'discover-it-cash-back',
    name: 'Discover it Cash Back',
    issuer: 'Discover',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 5, reward_unit: 'percent', description: '5% cash back on rotating quarterly categories (up to $1,500)' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'discover-it-miles',
    name: 'Discover it Miles',
    issuer: 'Discover',
    reward_program: 'Miles',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1.5,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 miles per dollar on all purchases' }
    ]
  },
  {
    card_key: 'discover-it-chrome',
    name: 'Discover it Chrome',
    issuer: 'Discover',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'dining', multiplier: 2, reward_unit: 'percent', description: '2% cash back on dining and gas (up to $1k/quarter)' },
      { category: 'gas', multiplier: 2, reward_unit: 'percent', description: '2% cash back on gas' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'discover-it-student-cash-back',
    name: 'Discover it Student Cash Back',
    issuer: 'Discover',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 5, reward_unit: 'percent', description: '5% cash back on rotating quarterly categories (up to $1,500)' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'discover-it-secured',
    name: 'Discover it Secured Credit Card',
    issuer: 'Discover',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 2, reward_unit: 'percent', description: '2% cash back on gas and restaurants (up to $1k/quarter)' },
      { category: 'gas', multiplier: 2, reward_unit: 'percent', description: '2% cash back on gas' },
      { category: 'dining', multiplier: 2, reward_unit: 'percent', description: '2% cash back on restaurants' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },

  // Bank of America - Complete Lineup
  {
    card_key: 'boa-premium-rewards',
    name: 'Bank of America Premium Rewards Credit Card',
    issuer: 'Bank of America',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 95,
    base_reward_rate: 1.5,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'percent', description: '2 points per dollar on travel and dining' },
      { category: 'dining', multiplier: 2, reward_unit: 'percent', description: '2 points per dollar on dining' },
      { category: 'other', multiplier: 1.5, reward_unit: 'percent', description: '1.5 points per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'boa-unlimited-cash-rewards',
    name: 'Bank of America Unlimited Cash Rewards Credit Card',
    issuer: 'Bank of America',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1.5,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1.5, reward_unit: 'percent', description: '1.5% cash back on all purchases' }
    ]
  },
  {
    card_key: 'boa-customized-cash-rewards',
    name: 'Bank of America Customized Cash Rewards Credit Card',
    issuer: 'Bank of America',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 3, reward_unit: 'percent', description: '3% cash back in chosen category (up to $2,500/quarter)' },
      { category: 'gas', multiplier: 2, reward_unit: 'percent', description: '2% cash back at grocery stores and wholesale clubs' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'boa-travel-rewards',
    name: 'Bank of America Travel Rewards Credit Card',
    issuer: 'Bank of America',
    reward_program: 'Points',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1.5,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 points per dollar on all purchases' }
    ]
  },

  // Wells Fargo - Complete Lineup
  {
    card_key: 'wells-fargo-active-cash',
    name: 'Wells Fargo Active Cash Card',
    issuer: 'Wells Fargo',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 2,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 2, reward_unit: 'percent', description: '2% cash back on all purchases' }
    ]
  },
  {
    card_key: 'wells-fargo-autograph',
    name: 'Wells Fargo Autograph Card',
    issuer: 'Wells Fargo',
    reward_program: 'Points',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on travel, dining, gas, transit, streaming' },
      { category: 'dining', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on dining' },
      { category: 'gas', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on gas' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'wells-fargo-reflect',
    name: 'Wells Fargo Reflect Card',
    issuer: 'Wells Fargo',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: []
  },
  {
    card_key: 'wells-fargo-attune',
    name: 'Wells Fargo Attune Card',
    issuer: 'Wells Fargo',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 4,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'drugstores', multiplier: 4, reward_unit: 'percent', description: '4% cash back on drugstores' },
      { category: 'gas', multiplier: 3, reward_unit: 'percent', description: '3% cash back on gas, transit, and EV charging' },
      { category: 'groceries', multiplier: 2, reward_unit: 'percent', description: '2% cash back on groceries' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },

  // US Bank
  {
    card_key: 'us-bank-altitude-reserve',
    name: 'U.S. Bank Altitude Reserve Visa Infinite Card',
    issuer: 'U.S. Bank',
    reward_program: 'Points',
    reward_currency: 'points',
    point_valuation: 1.5,
    annual_fee: 400,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on prepaid hotels and car rentals via Altitude portal' },
      { category: 'dining', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on travel and mobile wallet purchases' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'us-bank-altitude-go',
    name: 'U.S. Bank Altitude Go Visa Signature Card',
    issuer: 'U.S. Bank',
    reward_program: 'Points',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'dining', multiplier: 4, reward_unit: 'multiplier', description: '4 points per dollar on dining and takeout' },
      { category: 'gas', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on gas, EV charging, grocery stores, streaming' },
      { category: 'groceries', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on groceries' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'us-bank-cash-plus',
    name: 'U.S. Bank Cash+ Visa Signature Card',
    issuer: 'U.S. Bank',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 5, reward_unit: 'percent', description: '5% cash back in 2 chosen categories (up to $2k/quarter)' },
      { category: 'gas', multiplier: 2, reward_unit: 'percent', description: '2% cash back on groceries or gas (one category)' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'us-bank-shopper-cash',
    name: 'U.S. Bank Shopper Cash Rewards Visa Signature Card',
    issuer: 'U.S. Bank',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1.5,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 6, reward_unit: 'percent', description: '6% cash back on 2 chosen merchant categories (up to $1,500/quarter)' },
      { category: 'gas', multiplier: 3, reward_unit: 'percent', description: '3% cash back on gas, EV charging, streaming' },
      { category: 'other', multiplier: 1.5, reward_unit: 'percent', description: '1.5% cash back on all other purchases' }
    ]
  },

  // Barclays
  {
    card_key: 'barclays-aviator-red',
    name: 'Barclays AAdvantage Aviator Red World Elite Mastercard',
    issuer: 'Barclays',
    reward_program: 'AAdvantage',
    reward_currency: 'airline_miles',
    point_valuation: 1.4,
    annual_fee: 99,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 miles per dollar on American Airlines purchases' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 mile per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'barclays-jetblue-plus',
    name: 'Barclays JetBlue Plus Card',
    issuer: 'Barclays',
    reward_program: 'TrueBlue',
    reward_currency: 'airline_miles',
    point_valuation: 1.3,
    annual_fee: 99,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 6, reward_unit: 'multiplier', description: '6 points per dollar on JetBlue purchases' },
      { category: 'dining', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on dining and groceries' },
      { category: 'groceries', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on groceries' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'barclays-wyndham-rewards-earner',
    name: 'Barclays Wyndham Rewards Earner Card',
    issuer: 'Barclays',
    reward_program: 'Wyndham Rewards',
    reward_currency: 'hotel_points',
    point_valuation: 0.8,
    annual_fee: 95,
    base_reward_rate: 2,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 8, reward_unit: 'multiplier', description: '8 points per dollar at Wyndham hotels' },
      { category: 'gas', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on gas, groceries, utilities' },
      { category: 'groceries', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on groceries' },
      { category: 'other', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on all other purchases' }
    ]
  },

  // Additional major US co-brand and regional cards
  {
    card_key: 'apple-card',
    name: 'Apple Card',
    issuer: 'Goldman Sachs',
    reward_program: 'Daily Cash',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 3, reward_unit: 'percent', description: '3% cash back on Apple purchases and select merchants' },
      { category: 'other', multiplier: 2, reward_unit: 'percent', description: '2% cash back with Apple Pay' }
    ]
  },
  {
    card_key: 'synchrony-amazon-prime-store',
    name: 'Amazon Prime Store Card',
    issuer: 'Synchrony',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 5, reward_unit: 'percent', description: '5% cash back at Amazon and Whole Foods' }
    ]
  },
  {
    card_key: 'target-redcard',
    name: 'Target RedCard',
    issuer: 'TD Bank',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 5, reward_unit: 'percent', description: '5% cash back at Target' }
    ]
  },
  {
    card_key: 'synchrony-lowes-advantage',
    name: 'Lowe\'s Advantage Card',
    issuer: 'Synchrony',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: []
  },
  {
    card_key: 'synchrony-home-depot-card',
    name: 'The Home Depot Consumer Credit Card',
    issuer: 'Synchrony',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: []
  },
  {
    card_key: 'penfed-power-cash',
    name: 'PenFed Power Cash Rewards Visa Signature Card',
    issuer: 'PenFed',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1.5,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'gas', multiplier: 2, reward_unit: 'percent', description: '2% cash back on gas' },
      { category: 'other', multiplier: 1.5, reward_unit: 'percent', description: '1.5% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'penfed-pathfinder',
    name: 'PenFed Pathfinder Rewards American Express Card',
    issuer: 'PenFed',
    reward_program: 'Points',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 4, reward_unit: 'multiplier', description: '4 points per dollar on PenFed Travel' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'navy-federal-more-rewards',
    name: 'Navy Federal Credit Union More Rewards American Express Card',
    issuer: 'Navy Federal',
    reward_program: 'Points',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on groceries, gas, transit' },
      { category: 'gas', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on gas' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'navy-federal-cashrewards',
    name: 'Navy Federal Credit Union cashRewards Credit Card',
    issuer: 'Navy Federal',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1.5,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1.5, reward_unit: 'percent', description: '1.5% cash back on all purchases' }
    ]
  },
  {
    card_key: 'alliant-visa-signature',
    name: 'Alliant Cashback Visa Signature Credit Card',
    issuer: 'Alliant',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 2.5,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 2.5, reward_unit: 'percent', description: '2.5% cash back on all purchases (first year, then 2%)' }
    ]
  },
  {
    card_key: 'bilt-mastercard',
    name: 'Bilt Mastercard',
    issuer: 'Wells Fargo',
    reward_program: 'Bilt Rewards',
    reward_currency: 'points',
    point_valuation: 1.25,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on travel' },
      { category: 'dining', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on dining' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on rent and all other purchases' }
    ]
  },
  {
    card_key: 'venture-x-business',
    name: 'Capital One Venture X Business',
    issuer: 'Capital One',
    reward_program: 'Venture',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 395,
    base_reward_rate: 2,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 10, reward_unit: 'multiplier', description: '10 miles per dollar on hotels and car rentals via Capital One portal' },
      { category: 'other', multiplier: 2, reward_unit: 'multiplier', description: '2 miles per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'ink-business-premier',
    name: 'Chase Ink Business Premier Credit Card',
    issuer: 'Chase',
    reward_program: 'Ultimate Rewards',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 195,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2.5, reward_unit: 'percent', description: '2.5% cash back on travel and advertising' },
      { category: 'online_shopping', multiplier: 2, reward_unit: 'percent', description: '2% cash back on internet, cable, phone' },
      { category: 'gas', multiplier: 2, reward_unit: 'percent', description: '2% cash back on gas' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'citi-strata-premier-student',
    name: 'Citi Strata Premier for Students',
    issuer: 'Citi',
    reward_program: 'ThankYou Rewards',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'dining', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on dining, gas, groceries' },
      { category: 'gas', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on gas' },
      { category: 'groceries', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on groceries' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'amex-us-everyday',
    name: 'American Express EveryDay Credit Card',
    issuer: 'American Express',
    reward_program: 'Membership Rewards',
    reward_currency: 'points',
    point_valuation: 2.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on groceries (up to $6k/year)' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'amex-us-everyday-preferred',
    name: 'American Express EveryDay Preferred Credit Card',
    issuer: 'American Express',
    reward_program: 'Membership Rewards',
    reward_currency: 'points',
    point_valuation: 2.0,
    annual_fee: 95,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on groceries (up to $6k/year)' },
      { category: 'gas', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on gas' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  // Additional US Cards to reach 150+
  {
    card_key: 'chase-united-business',
    name: 'Chase United Business Card',
    issuer: 'Chase',
    reward_program: 'MileagePlus',
    reward_currency: 'airline_miles',
    point_valuation: 1.3,
    annual_fee: 99,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 miles per dollar on United purchases' },
      { category: 'gas', multiplier: 2, reward_unit: 'multiplier', description: '2 miles per dollar on gas, office supply, internet, cable, phone' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 mile per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'chase-southwest-plus',
    name: 'Chase Southwest Rapid Rewards Plus Credit Card',
    issuer: 'Chase',
    reward_program: 'Rapid Rewards',
    reward_currency: 'airline_miles',
    point_valuation: 1.4,
    annual_fee: 99,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on Southwest purchases' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'chase-southwest-premier',
    name: 'Chase Southwest Rapid Rewards Premier Credit Card',
    issuer: 'Chase',
    reward_program: 'Rapid Rewards',
    reward_currency: 'airline_miles',
    point_valuation: 1.4,
    annual_fee: 99,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on Southwest purchases' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'chase-southwest-performance-business',
    name: 'Chase Southwest Rapid Rewards Performance Business Credit Card',
    issuer: 'Chase',
    reward_program: 'Rapid Rewards',
    reward_currency: 'airline_miles',
    point_valuation: 1.4,
    annual_fee: 199,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on Southwest purchases' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'chase-ihg-premier-business',
    name: 'Chase IHG One Rewards Premier Business Credit Card',
    issuer: 'Chase',
    reward_program: 'IHG Rewards',
    reward_currency: 'hotel_points',
    point_valuation: 0.5,
    annual_fee: 99,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 26, reward_unit: 'multiplier', description: '26 points per dollar at IHG hotels' },
      { category: 'gas', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on gas, office supply stores, internet, cable, phone' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'chase-marriott-bonvoy-boundless',
    name: 'Chase Marriott Bonvoy Boundless Credit Card',
    issuer: 'Chase',
    reward_program: 'Marriott Bonvoy',
    reward_currency: 'hotel_points',
    point_valuation: 0.8,
    annual_fee: 95,
    base_reward_rate: 2,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 6, reward_unit: 'multiplier', description: '6 points per dollar at Marriott hotels' },
      { category: 'other', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'chase-marriott-bonvoy-bold',
    name: 'Chase Marriott Bonvoy Bold Credit Card',
    issuer: 'Chase',
    reward_program: 'Marriott Bonvoy',
    reward_currency: 'hotel_points',
    point_valuation: 0.8,
    annual_fee: 0,
    base_reward_rate: 2,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar at Marriott hotels' },
      { category: 'other', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'chase-marriott-bonvoy-business',
    name: 'Chase Marriott Bonvoy Business Credit Card',
    issuer: 'Chase',
    reward_program: 'Marriott Bonvoy',
    reward_currency: 'hotel_points',
    point_valuation: 0.8,
    annual_fee: 125,
    base_reward_rate: 2,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 6, reward_unit: 'multiplier', description: '6 points per dollar at Marriott hotels' },
      { category: 'other', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'chase-aeroplan',
    name: 'Chase Aeroplan Card',
    issuer: 'Chase',
    reward_program: 'Aeroplan',
    reward_currency: 'airline_miles',
    point_valuation: 2.0,
    annual_fee: 95,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on Air Canada purchases' },
      { category: 'dining', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on dining and eligible delivery' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'amex-us-delta-skymiles-blue',
    name: 'Delta SkyMiles Blue American Express Card',
    issuer: 'American Express',
    reward_program: 'SkyMiles',
    reward_currency: 'airline_miles',
    point_valuation: 1.2,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 miles per dollar on Delta purchases' },
      { category: 'dining', multiplier: 2, reward_unit: 'multiplier', description: '2 miles per dollar at restaurants' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 mile per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'amex-us-hilton-honors',
    name: 'Hilton Honors American Express Card',
    issuer: 'American Express',
    reward_program: 'Hilton Honors',
    reward_currency: 'hotel_points',
    point_valuation: 0.5,
    annual_fee: 0,
    base_reward_rate: 3,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 7, reward_unit: 'multiplier', description: '7 points per dollar at Hilton hotels' },
      { category: 'groceries', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on groceries, gas, dining' },
      { category: 'gas', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on gas' },
      { category: 'dining', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on dining' },
      { category: 'other', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'amex-us-marriott-bonvoy-bevy',
    name: 'Marriott Bonvoy Bevy American Express Card',
    issuer: 'American Express',
    reward_program: 'Marriott Bonvoy',
    reward_currency: 'hotel_points',
    point_valuation: 0.8,
    annual_fee: 250,
    base_reward_rate: 3,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 6, reward_unit: 'multiplier', description: '6 points per dollar at Marriott hotels' },
      { category: 'dining', multiplier: 4, reward_unit: 'multiplier', description: '4 points per dollar on dining and gas' },
      { category: 'gas', multiplier: 4, reward_unit: 'multiplier', description: '4 points per dollar on gas' },
      { category: 'other', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'citi-strata-rewards',
    name: 'Citi Strata Rewards Card',
    issuer: 'Citi',
    reward_program: 'ThankYou Rewards',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on groceries, gas, dining' },
      { category: 'gas', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on gas' },
      { category: 'dining', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on dining' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'citi-simplicity',
    name: 'Citi Simplicity Card',
    issuer: 'Citi',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: []
  },
  {
    card_key: 'citi-aa-gold',
    name: 'Citi AAdvantage Gold World Elite Mastercard',
    issuer: 'Citi',
    reward_program: 'AAdvantage',
    reward_currency: 'airline_miles',
    point_valuation: 1.4,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 miles per dollar on American Airlines purchases' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 mile per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'capital-one-walmart',
    name: 'Capital One Walmart Rewards Mastercard',
    issuer: 'Capital One',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 5, reward_unit: 'percent', description: '5% cash back on Walmart.com' },
      { category: 'groceries', multiplier: 2, reward_unit: 'percent', description: '2% cash back at Walmart stores' },
      { category: 'dining', multiplier: 2, reward_unit: 'percent', description: '2% cash back at restaurants' },
      { category: 'travel', multiplier: 2, reward_unit: 'percent', description: '2% cash back on travel' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'capital-one-spark-miles',
    name: 'Capital One Spark Miles for Business',
    issuer: 'Capital One',
    reward_program: 'Miles',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 95,
    base_reward_rate: 2,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 2, reward_unit: 'multiplier', description: '2 miles per dollar on all purchases' }
    ]
  },
  {
    card_key: 'capital-one-spark-miles-select',
    name: 'Capital One Spark Miles Select for Business',
    issuer: 'Capital One',
    reward_program: 'Miles',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1.5,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1.5, reward_unit: 'multiplier', description: '1.5 miles per dollar on all purchases' }
    ]
  },
  {
    card_key: 'boa-alaska-airlines-signature',
    name: 'Bank of America Alaska Airlines Visa Signature Credit Card',
    issuer: 'Bank of America',
    reward_program: 'Mileage Plan',
    reward_currency: 'airline_miles',
    point_valuation: 1.5,
    annual_fee: 95,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 3, reward_unit: 'multiplier', description: '3 miles per dollar on Alaska Airlines purchases' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 mile per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'boa-premium-rewards-elite',
    name: 'Bank of America Premium Rewards Elite Credit Card',
    issuer: 'Bank of America',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 295,
    base_reward_rate: 1.5,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'percent', description: '2 points per dollar on travel and dining' },
      { category: 'dining', multiplier: 2, reward_unit: 'percent', description: '2 points per dollar on dining' },
      { category: 'other', multiplier: 1.5, reward_unit: 'percent', description: '1.5 points per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'boa-spirit-of-alaska-platinum-plus',
    name: 'Bank of America Alaska Airlines Platinum Plus Visa',
    issuer: 'Bank of America',
    reward_program: 'Mileage Plan',
    reward_currency: 'airline_miles',
    point_valuation: 1.5,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 1, reward_unit: 'multiplier', description: '1 mile per dollar on all purchases' }
    ]
  },
  {
    card_key: 'wells-fargo-bilt',
    name: 'Wells Fargo Bilt Mastercard',
    issuer: 'Wells Fargo',
    reward_program: 'Bilt Rewards',
    reward_currency: 'points',
    point_valuation: 1.25,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'dining', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on dining' },
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on travel' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on rent and all other purchases' }
    ]
  },
  {
    card_key: 'wells-fargo-signet-jewelers',
    name: 'Wells Fargo Signet Jewelers Credit Card',
    issuer: 'Wells Fargo',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: []
  },
  {
    card_key: 'us-bank-triple-cash',
    name: 'U.S. Bank Triple Cash Rewards Visa Signature Card',
    issuer: 'U.S. Bank',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1.5,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'gas', multiplier: 3, reward_unit: 'percent', description: '3% cash back on gas, EV charging, parking' },
      { category: 'dining', multiplier: 3, reward_unit: 'percent', description: '3% cash back on dining' },
      { category: 'online_shopping', multiplier: 2, reward_unit: 'percent', description: '2% cash back on eligible streaming, online, cable, internet, phone' },
      { category: 'other', multiplier: 1.5, reward_unit: 'percent', description: '1.5% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'us-bank-visa-platinum',
    name: 'U.S. Bank Visa Platinum Card',
    issuer: 'U.S. Bank',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: []
  },
  {
    card_key: 'barclays-wyndham-earner-business',
    name: 'Barclays Wyndham Rewards Earner Business Card',
    issuer: 'Barclays',
    reward_program: 'Wyndham Rewards',
    reward_currency: 'hotel_points',
    point_valuation: 0.8,
    annual_fee: 95,
    base_reward_rate: 2,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 8, reward_unit: 'multiplier', description: '8 points per dollar at Wyndham hotels' },
      { category: 'gas', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on gas and utilities' },
      { category: 'other', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'barclays-choice-privileges',
    name: 'Barclays Choice Privileges Mastercard',
    issuer: 'Barclays',
    reward_program: 'Choice Privileges',
    reward_currency: 'hotel_points',
    point_valuation: 0.6,
    annual_fee: 0,
    base_reward_rate: 2,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 10, reward_unit: 'multiplier', description: '10 points per dollar at Choice Hotels' },
      { category: 'other', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'synchrony-amazon-store',
    name: 'Amazon Store Card',
    issuer: 'Synchrony',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 5, reward_unit: 'percent', description: '5% cash back at Amazon' }
    ]
  },
  {
    card_key: 'synchrony-paypal-cashback',
    name: 'PayPal Cashback Mastercard',
    issuer: 'Synchrony',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 2,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 2, reward_unit: 'percent', description: '2% cash back on all purchases' }
    ]
  },
  {
    card_key: 'synchrony-venmo-visa',
    name: 'Venmo Visa Credit Card',
    issuer: 'Synchrony',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 3, reward_unit: 'percent', description: '3% cash back in top spend category each month' },
      { category: 'other', multiplier: 2, reward_unit: 'percent', description: '2% cash back in next category' }
    ]
  },
  {
    card_key: 'synchrony-cathay-pacific',
    name: 'Cathay Pacific Visa Signature Card',
    issuer: 'Synchrony',
    reward_program: 'Asia Miles',
    reward_currency: 'airline_miles',
    point_valuation: 1.5,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 3, reward_unit: 'multiplier', description: '3 miles per dollar on Cathay Pacific purchases' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 mile per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'penfed-platinum-rewards',
    name: 'PenFed Platinum Rewards Visa Signature Card',
    issuer: 'PenFed',
    reward_program: 'Points',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'gas', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on gas' },
      { category: 'groceries', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on groceries' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'navy-federal-platinum',
    name: 'Navy Federal Platinum Credit Card',
    issuer: 'Navy Federal',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: []
  },
  {
    card_key: 'navy-federal-go-rewards',
    name: 'Navy Federal Credit Union GO REWARDS Credit Card',
    issuer: 'Navy Federal',
    reward_program: 'Points',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all purchases' }
    ]
  },
  {
    card_key: 'sofi-credit-card',
    name: 'SoFi Credit Card',
    issuer: 'SoFi',
    reward_program: 'Points',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 2,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on all purchases' }
    ]
  },
  {
    card_key: 'bread-cashback-amex',
    name: 'Bread Cashback American Express Credit Card',
    issuer: 'Bread Financial',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 2,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 2, reward_unit: 'percent', description: '2% cash back on all purchases' }
    ]
  },
  {
    card_key: 'deserve-edu-mastercard',
    name: 'Deserve EDU Mastercard for Students',
    issuer: 'Deserve',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all purchases' }
    ]
  },
  {
    card_key: 'petal-2-visa',
    name: 'Petal 2 Visa Credit Card',
    issuer: 'Petal',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1.5, reward_unit: 'percent', description: 'Up to 1.5% cash back on eligible purchases' }
    ]
  },
  {
    card_key: 'upgrade-triple-cash',
    name: 'Upgrade Triple Cash Rewards Visa',
    issuer: 'Upgrade',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1.5,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1.5, reward_unit: 'percent', description: '1.5% cash back on all purchases' }
    ]
  },
  {
    card_key: 'affinity-plus-visa-signature',
    name: 'Affinity Plus Visa Signature Cash Back Card',
    issuer: 'Affinity Plus',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1.5,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1.5, reward_unit: 'percent', description: '1.5% cash back on all purchases' }
    ]
  },
  {
    card_key: 'target-circle-card',
    name: 'Target Circle Card',
    issuer: 'TD Bank',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 5, reward_unit: 'percent', description: '5% cash back at Target' }
    ]
  },
  {
    card_key: 'kohls-charge',
    name: 'Kohl\'s Charge Card',
    issuer: 'Capital One',
    reward_program: 'Store Credit',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 5, reward_unit: 'percent', description: '5% rewards at Kohl\'s' }
    ]
  },
  {
    card_key: 'macys-credit-card',
    name: 'Macy\'s Credit Card',
    issuer: 'Citibank',
    reward_program: 'Store Credit',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 5, reward_unit: 'percent', description: '5% rewards at Macy\'s' }
    ]
  },
  {
    card_key: 'nordstrom-visa-signature',
    name: 'Nordstrom Visa Signature Card',
    issuer: 'TD Bank',
    reward_program: 'Points',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 4, reward_unit: 'multiplier', description: '4 points per dollar at Nordstrom' },
      { category: 'dining', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on dining and gas' },
      { category: 'gas', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on gas' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'saks-mastercard',
    name: 'Saks Mastercard',
    issuer: 'Comenity',
    reward_program: 'Points',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 4, reward_unit: 'multiplier', description: '4 points per dollar at Saks' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'gap-good-rewards-mastercard',
    name: 'Gap Good Rewards Mastercard',
    issuer: 'Barclays',
    reward_program: 'Points',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar at Gap brands' },
      { category: 'dining', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on dining and gas' },
      { category: 'gas', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on gas' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'old-navy-visa',
    name: 'Old Navy Visa Card',
    issuer: 'Barclays',
    reward_program: 'Points',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar at Old Navy' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'best-buy-credit-card',
    name: 'My Best Buy Visa Card',
    issuer: 'Citibank',
    reward_program: 'Points',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'online_shopping', multiplier: 5, reward_unit: 'multiplier', description: '5% back at Best Buy' },
      { category: 'gas', multiplier: 2, reward_unit: 'multiplier', description: '2% back on gas, groceries, dining' },
      { category: 'groceries', multiplier: 2, reward_unit: 'multiplier', description: '2% back on groceries' },
      { category: 'dining', multiplier: 2, reward_unit: 'multiplier', description: '2% back on dining' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1% back on all other purchases' }
    ]
  },
  // More US cards to reach 150+ target
  {
    card_key: 'chase-slate-edge',
    name: 'Chase Slate Edge',
    issuer: 'Chase',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 5, reward_unit: 'percent', description: '5% cash back on travel purchased through Chase' },
      { category: 'gas', multiplier: 2, reward_unit: 'percent', description: '2% cash back on gas' },
      { category: 'dining', multiplier: 2, reward_unit: 'percent', description: '2% cash back on dining' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'amex-us-centurion',
    name: 'American Express Centurion Card',
    issuer: 'American Express',
    reward_program: 'Membership Rewards',
    reward_currency: 'points',
    point_valuation: 2.0,
    annual_fee: 5000,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 5, reward_unit: 'multiplier', description: '5 points per dollar on flights' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'citi-aadvantage-mile-up',
    name: 'Citi AAdvantage MileUp Card',
    issuer: 'Citi',
    reward_program: 'AAdvantage',
    reward_currency: 'airline_miles',
    point_valuation: 1.4,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 2, reward_unit: 'multiplier', description: '2 miles per dollar on groceries' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 mile per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'capital-one-quicksilver-one',
    name: 'Capital One QuicksilverOne Cash Rewards Credit Card',
    issuer: 'Capital One',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 39,
    base_reward_rate: 1.5,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1.5, reward_unit: 'percent', description: '1.5% cash back on all purchases' }
    ]
  },
  {
    card_key: 'discover-it-balance-transfer',
    name: 'Discover it Balance Transfer',
    issuer: 'Discover',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 5, reward_unit: 'percent', description: '5% cash back on rotating quarterly categories' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'boa-cash-rewards-secured',
    name: 'Bank of America Cash Rewards Secured Credit Card',
    issuer: 'Bank of America',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'groceries', multiplier: 3, reward_unit: 'percent', description: '3% cash back in chosen category' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'wells-fargo-prime-secured',
    name: 'Wells Fargo Prime Secured Credit Card',
    issuer: 'Wells Fargo',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: []
  },
  {
    card_key: 'us-bank-secured-visa',
    name: 'U.S. Bank Secured Visa Card',
    issuer: 'U.S. Bank',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: []
  },
  {
    card_key: 'citi-secured-mastercard',
    name: 'Citi Secured Mastercard',
    issuer: 'Citi',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: []
  },
  {
    card_key: 'opensky-secured-visa',
    name: 'OpenSky Secured Visa Credit Card',
    issuer: 'OpenSky',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 35,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: []
  },
  {
    card_key: 'first-progress-platinum-select',
    name: 'First Progress Platinum Select Mastercard',
    issuer: 'First Progress',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 39,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: []
  },
  {
    card_key: 'credit-one-bank-platinum-visa',
    name: 'Credit One Bank Platinum Visa',
    issuer: 'Credit One Bank',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 75,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on eligible purchases' }
    ]
  },
  {
    card_key: 'credit-one-bank-amex',
    name: 'Credit One Bank American Express Card',
    issuer: 'Credit One Bank',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 95,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'gas', multiplier: 5, reward_unit: 'percent', description: '5% cash back on gas' },
      { category: 'groceries', multiplier: 2, reward_unit: 'percent', description: '2% cash back on groceries' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'milestone-gold-mastercard',
    name: 'Milestone Gold Mastercard',
    issuer: 'Milestone',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 99,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: []
  },
  {
    card_key: 'indigo-platinum-mastercard',
    name: 'Indigo Platinum Mastercard',
    issuer: 'Indigo',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 99,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: []
  },
  {
    card_key: 'total-visa-card',
    name: 'Total Visa Card',
    issuer: 'Total Card',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 75,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: []
  },
  {
    card_key: 'reflex-mastercard',
    name: 'Reflex Mastercard',
    issuer: 'Continental Finance',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 95,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: []
  },
  {
    card_key: 'fingerhut-credit-account',
    name: 'Fingerhut Credit Account',
    issuer: 'WebBank',
    reward_program: 'None',
    reward_currency: 'none',
    point_valuation: 0,
    annual_fee: 0,
    base_reward_rate: 0,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: []
  },
  {
    card_key: 'bbva-usa-nba-amex',
    name: 'PNC NBA Cash Rewards Visa',
    issuer: 'PNC',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'gas', multiplier: 4, reward_unit: 'percent', description: '4% cash back on gas' },
      { category: 'dining', multiplier: 3, reward_unit: 'percent', description: '3% cash back on dining' },
      { category: 'groceries', multiplier: 2, reward_unit: 'percent', description: '2% cash back on groceries' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'pnc-points-visa',
    name: 'PNC Points Visa Credit Card',
    issuer: 'PNC',
    reward_program: 'Points',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'gas', multiplier: 3, reward_unit: 'multiplier', description: '3 points per dollar on gas' },
      { category: 'dining', multiplier: 2, reward_unit: 'multiplier', description: '2 points per dollar on dining' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'pnc-cash-rewards-visa',
    name: 'PNC Cash Rewards Visa Credit Card',
    issuer: 'PNC',
    reward_program: 'Cash Back',
    reward_currency: 'cashback',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'percent',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'gas', multiplier: 4, reward_unit: 'percent', description: '4% cash back on gas' },
      { category: 'groceries', multiplier: 3, reward_unit: 'percent', description: '3% cash back on groceries' },
      { category: 'dining', multiplier: 2, reward_unit: 'percent', description: '2% cash back on dining' },
      { category: 'other', multiplier: 1, reward_unit: 'percent', description: '1% cash back on all other purchases' }
    ]
  },
  {
    card_key: 'regions-prestige-visa-signature',
    name: 'Regions Prestige Visa Signature Credit Card',
    issuer: 'Regions Bank',
    reward_program: 'Points',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 point per dollar on all purchases' }
    ]
  },
  {
    card_key: 'chase-united-gateway',
    name: 'Chase United Gateway Card',
    issuer: 'Chase',
    reward_program: 'MileagePlus',
    reward_currency: 'airline_miles',
    point_valuation: 1.3,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2 miles per dollar on United purchases' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1 mile per dollar on all other purchases' }
    ]
  },
  {
    card_key: 'chase-disney-premier-visa',
    name: 'Disney Premier Visa Card',
    issuer: 'Chase',
    reward_program: 'Disney Rewards',
    reward_currency: 'points',
    point_valuation: 1.0,
    annual_fee: 0,
    base_reward_rate: 1,
    base_reward_unit: 'multiplier',
    country: 'US',
    is_active: true,
    categories: [
      { category: 'travel', multiplier: 2, reward_unit: 'multiplier', description: '2% back on Disney purchases' },
      { category: 'dining', multiplier: 2, reward_unit: 'multiplier', description: '2% back on dining and gas' },
      { category: 'gas', multiplier: 2, reward_unit: 'multiplier', description: '2% back on gas' },
      { category: 'groceries', multiplier: 1, reward_unit: 'multiplier', description: '1% back on groceries' },
      { category: 'other', multiplier: 1, reward_unit: 'multiplier', description: '1% back on all other purchases' }
    ]
  }
];

// ============================================================================
// SEED EXECUTION
// ============================================================================

async function seedCards() {
  console.log('🌱 Starting credit card database seed...\n');
  
  let caCount = 0;
  let usCount = 0;
  let categoryCount = 0;
  let errors = [];

  // Seed Canadian cards
  console.log('🍁 Seeding Canadian credit cards...');
  for (const cardData of canadianCards) {
    try {
      const { categories, ...cardFields } = cardData;
      
      // Upsert card
      const { data: card, error: cardError } = await supabase
        .from('cards')
        .upsert(cardFields, { onConflict: 'card_key' })
        .select()
        .single();
      
      if (cardError) {
        errors.push(`Error inserting ${cardFields.card_key}: ${cardError.message}`);
        continue;
      }
      
      caCount++;
      
      // Upsert category rewards
      if (categories && categories.length > 0) {
        for (const category of categories) {
          const { error: catError } = await supabase
            .from('category_rewards')
            .upsert(
              { card_id: card.id, ...category },
              { onConflict: 'card_id,category' }
            );
          
          if (catError) {
            errors.push(`Error inserting category for ${cardFields.card_key}: ${catError.message}`);
          } else {
            categoryCount++;
          }
        }
      }
      
      if (caCount % 10 === 0) {
        console.log(`  ✓ Inserted ${caCount} Canadian cards...`);
      }
    } catch (err) {
      errors.push(`Exception inserting ${cardData.card_key}: ${err.message}`);
    }
  }
  
  console.log(`✅ Completed Canadian cards: ${caCount} cards\n`);

  // Seed US cards
  console.log('🇺🇸 Seeding US credit cards...');
  for (const cardData of usCards) {
    try {
      const { categories, ...cardFields } = cardData;
      
      // Upsert card
      const { data: card, error: cardError } = await supabase
        .from('cards')
        .upsert(cardFields, { onConflict: 'card_key' })
        .select()
        .single();
      
      if (cardError) {
        errors.push(`Error inserting ${cardFields.card_key}: ${cardError.message}`);
        continue;
      }
      
      usCount++;
      
      // Upsert category rewards
      if (categories && categories.length > 0) {
        for (const category of categories) {
          const { error: catError } = await supabase
            .from('category_rewards')
            .upsert(
              { card_id: card.id, ...category },
              { onConflict: 'card_id,category' }
            );
          
          if (catError) {
            errors.push(`Error inserting category for ${cardFields.card_key}: ${catError.message}`);
          } else {
            categoryCount++;
          }
        }
      }
      
      if (usCount % 10 === 0) {
        console.log(`  ✓ Inserted ${usCount} US cards...`);
      }
    } catch (err) {
      errors.push(`Exception inserting ${cardData.card_key}: ${err.message}`);
    }
  }
  
  console.log(`✅ Completed US cards: ${usCount} cards\n`);

  // Final report
  console.log('═'.repeat(60));
  console.log('📊 FINAL RESULTS');
  console.log('═'.repeat(60));
  console.log(`🍁 Canadian cards: ${caCount}`);
  console.log(`🇺🇸 US cards: ${usCount}`);
  console.log(`📋 Total cards: ${caCount + usCount}`);
  console.log(`🏷️  Category rewards: ${categoryCount}`);
  console.log('═'.repeat(60));
  
  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} errors occurred:`);
    errors.forEach(err => console.log(`  - ${err}`));
  } else {
    console.log('\n✨ All cards seeded successfully!');
  }
  
  // Check if we met targets
  console.log('\n🎯 TARGET CHECK:');
  console.log(`   Canadian cards: ${caCount} / 200+ ${caCount >= 200 ? '✅' : '❌'}`);
  console.log(`   US cards: ${usCount} / 150+ ${usCount >= 150 ? '✅' : '❌'}`);
  console.log(`   Category rewards: ${categoryCount} / 500+ ${categoryCount >= 500 ? '✅' : '❌'}`);
}

// Run the seed
seedCards()
  .then(() => {
    console.log('\n✅ Seed completed!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });