# Supabase Database Setup

This directory contains the database schema and seed data for the Rewards Optimizer backend.

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project (recommended region: `ca-central-1` for Canadian users)

## Setup Instructions

### 1. Run Migrations

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the migrations in order:
   - First: `migrations/001_initial_schema.sql`
   - Then: `migrations/002_seed_data.sql`

### 2. Configure Environment Variables

1. Go to **Settings** > **API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (safe to use in client apps)

3. Update your `.env` file in the app root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Verify Setup

After running the migrations, you should see:
- 4 tables: `cards`, `category_rewards`, `signup_bonuses`, `spending_categories`
- 15 cards with their category rewards
- 3 signup bonuses
- 9 spending categories

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `cards` | Credit card information (name, issuer, reward program, fees) |
| `category_rewards` | Bonus reward rates for specific spending categories |
| `signup_bonuses` | Welcome offers for new cardholders |
| `spending_categories` | Reference table for spending categories |

### Row Level Security (RLS)

All tables have RLS enabled with read-only access for anonymous users:
- Cards, category rewards, and signup bonuses are publicly readable
- Only active records are returned
- Write operations require authentication (for admin use)

### Views

- `cards_with_rewards`: Joins cards with their category rewards and signup bonuses

## API Endpoints

The Supabase client automatically generates REST and GraphQL APIs:

```typescript
// Get all cards
const { data } = await supabase.from('cards').select('*');

// Get cards with rewards
const { data } = await supabase
  .from('cards')
  .select(`
    *,
    category_rewards (*),
    signup_bonuses (*)
  `);

// Search cards by issuer
const { data } = await supabase
  .from('cards')
  .select('*')
  .eq('issuer', 'TD Canada Trust');
```

## Updating Card Data

Card data is managed separately from the mobile app. To update cards:

1. Modify the seed data SQL or use the Supabase dashboard
2. The mobile app will fetch updated data on next refresh
3. Local cache expires after 24 hours

## Troubleshooting

### "Permission denied" errors
- Ensure RLS policies are created correctly
- Check that you're using the `anon` key, not the `service_role` key

### Cards not showing
- Verify `is_active = true` for the cards
- Check the SQL Editor for any migration errors

### Cache issues
- Clear AsyncStorage in the app
- Force refresh using `CardDataService.refreshCards()`
