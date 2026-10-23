# Rewards Optimizer - UI Overview

## App Structure

### Pages (Bottom Tab Navigation)
1. **Home** - Rewards calculator
2. **My Cards** - Manage card portfolio
3. **Settings** - App preferences

---

## Home Screen - Rewards Calculator

### User Workflow
1. **Select Store** (optional)
   - Search or pick from popular stores
   - Auto-fills category based on store

2. **Select Category**
   - 8 categories in grid: Groceries, Dining, Gas, Travel, Online Shopping, Entertainment, Pharmacy, Home Improvement
   - Can override auto-filled category from store

3. **Enter Amount**
   - Dollar input field
   - Real-time validation

4. **View Results** (auto-calculates)
   - Sorted list of cards by best value
   - Each card shows:
     - Original price
     - Reward earned (cashback $ or points with $ value)
     - Effective price (original - reward)
     - Annual fee
   - Top card highlighted as "BEST"

### States
- **Empty**: No cards in portfolio → "Add cards" message
- **Initial**: No input → "Get started" prompt
- **Results**: Shows ranked card list

---

## My Cards Screen

### Features
- List of cards in user's portfolio
- Search/filter cards
- Add new cards (search database)
- Remove cards
- View card details (reward rates, annual fee, program info)

### Workflow
1. Browse portfolio or search for new cards
2. Tap card to view details
3. Add/remove cards from portfolio

---

## Settings Screen

### Features
- **New Card Suggestions**: Toggle on/off
- **Language**: English/French
- **Database Sync**: Manual refresh from Supabase
- **About**: App version, links

---

## Key Features

### Database-Driven
- All card data from Supabase (no local fallback)
- Point valuations from reward_programs table
- Real-time conversion rates

### Calculation Logic
- **Cashback cards**: Direct percentage (no conversion)
- **Points/Miles**: Converted to CAD using optimal_rate_cents
- **Effective price**: Original - reward value
- Cards without valuation data are excluded

### Design Principles
- Single-page flow (no mode switching)
- Auto-calculation on input
- Clear price breakdown
- Mobile-first, touch-optimized
