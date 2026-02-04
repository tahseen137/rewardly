# Database Setup Guide

This guide explains how to set up and populate the Supabase database with Canadian credit card data.

## Prerequisites

- A Supabase account and project
- Supabase CLI installed (`npm install -g supabase`)
- Access to the Supabase SQL Editor

## Database Schema

The app uses three main tables:

1. **cards** - Credit card information (name, issuer, annual fee, reward rates)
2. **category_rewards** - Bonus rewards for specific spending categories
3. **signup_bonuses** - Welcome offers for new cardholders
4. **spending_categories** - Reference table for spending category types

## Setup Steps

### Option 1: Using Supabase Dashboard (Recommended)

1. Log into your Supabase project dashboard
2. Go to **SQL Editor** 
3. Run the migrations in order:
   - First: `supabase/migrations/001_initial_schema.sql` (creates tables)
   - Then: `supabase/migrations/003_comprehensive_card_data.sql` (populates data)

### Option 2: Using Supabase CLI

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

## Data Summary

The database includes **57 Canadian credit cards** from:

| Issuer | Cards |
|--------|-------|
| American Express | 9 |
| TD | 5 |
| RBC | 4 |
| CIBC | 5 |
| Scotiabank | 4 |
| BMO | 5 |
| Tangerine | 2 |
| Rogers Bank | 2 |
| Neo Financial | 2 |
| PC Financial | 2 |
| Simplii Financial | 1 |
| Canadian Tire | 2 |
| MBNA | 2 |
| Capital One | 2 |
| Brim Financial | 2 |
| Desjardins | 2 |
| HSBC | 1 |
| National Bank | 1 |
| + Student Cards | 2 |

## Data Sources

Card data was researched from:
- Official bank websites (americanexpress.com/ca, td.com, rbc.com, etc.)
- RateHub.ca
- GreedyRates.ca
- Official card Terms & Conditions

## Updating Data

To update card data:

1. Modify `supabase/migrations/003_comprehensive_card_data.sql`
2. Run the updated migration (it will truncate and repopulate)
3. Also update `src/data/canadian_cards_extended.json` for consistency

## Environment Variables

Make sure these are set in your `.env.local`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## Verifying Data

After running migrations, verify the data:

```sql
-- Count cards by issuer
SELECT issuer, COUNT(*) as count 
FROM cards 
GROUP BY issuer 
ORDER BY count DESC;

-- Check category rewards
SELECT c.name, COUNT(cr.id) as categories
FROM cards c
LEFT JOIN category_rewards cr ON c.id = cr.card_id
GROUP BY c.name
ORDER BY categories DESC;

-- Verify signup bonuses
SELECT c.name, sb.bonus_amount, sb.bonus_currency
FROM cards c
JOIN signup_bonuses sb ON c.id = sb.card_id
WHERE sb.is_active = true;
```

## Troubleshooting

### "Supabase client not configured" error
- Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correctly set
- Verify your Supabase project is running

### No cards appearing in app
- Run `SELECT COUNT(*) FROM cards;` to verify data exists
- Check RLS policies allow anonymous read access
- Try `npx expo start --clear` to clear cache

### Category rewards not matching
- The category names must match: `groceries`, `dining`, `gas`, `travel`, `online_shopping`, `entertainment`, `drugstores`, `home_improvement`, `other`

## Data Freshness

Credit card rewards change frequently. This data was last verified **February 2026**. For the most accurate rates, always check the official card issuer website.
