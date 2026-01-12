# Rewardly 🇨🇦

A mobile app that helps Canadians maximize their credit card rewards by recommending the best card to use at any store.

## Features

- **Smart Card Recommendations** - Enter a store name and see which of your cards earns the most rewards
- **Canadian Card Database** - Comprehensive database of Canadian credit cards from TD, RBC, BMO, CIBC, Scotiabank, Amex, and more
- **Multiple Reward Types** - Support for cashback, points, airline miles, and hotel points
- **New Card Suggestions** - Discover cards that could earn you better rewards
- **Bilingual** - English and French support

## Tech Stack

- **Frontend:** React Native with Expo
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **APIs:** Google Places API
- **Local Storage:** AsyncStorage
- **Testing:** Jest, fast-check

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- Supabase account
- Google Cloud account (for Places API)

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npx expo start
```

### Environment Variables

Create a `.env.local` file:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_PLACES_API_KEY=your_google_places_api_key
```

## Project Structure

```
src/
├── data/           # Static data files
├── navigation/     # React Navigation setup
├── screens/        # App screens (Home, MyCards, Settings)
├── services/       # Business logic
│   ├── CardDataService.ts
│   ├── CardPortfolioManager.ts
│   ├── PreferenceManager.ts
│   ├── RecommendationEngine.ts
│   └── StoreDataService.ts
└── types/          # TypeScript types
```

## Documentation

- [Design Document](./docs/design.md) - Architecture and technical design

## Canadian Credit Cards Supported

- **TD:** Aeroplan Visa Infinite, Cash Back Visa Infinite
- **RBC:** Avion Visa Infinite, WestJet World Elite
- **BMO:** Air Miles World Elite, CashBack World Elite
- **CIBC:** Aventura Visa Infinite, Aeroplan Visa Infinite
- **Scotiabank:** Scene+ Visa, Passport Visa Infinite
- **American Express:** Cobalt, Gold, Platinum
- And many more...

## License

MIT
