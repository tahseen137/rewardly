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

## Deployment

Ready to deploy to the App Store and Play Store? We've got you covered!

### 📚 Deployment Guides

- **[Start Here: Quick Start Guide](QUICK_START_DEPLOYMENT.md)** - Fast-track deployment guide
- **[Complete Guide](APP_STORE_DEPLOYMENT.md)** - Detailed step-by-step instructions
- **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Track your progress
- **[Pre-Submission Checklist](PRE_SUBMISSION_CHECKLIST.md)** - Final verification before submitting
- **[Guide Index](DEPLOYMENT_GUIDE_INDEX.md)** - Overview of all deployment documentation

### 🚀 Quick Deploy

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Initialize project
eas init

# Build for both platforms
eas build --platform all --profile production

# Submit to stores
eas submit --platform ios --latest
eas submit --platform android --latest
```

Or use the automated deployment script:

**Windows:**
```cmd
cd scripts
deploy.bat
```

**Mac/Linux:**
```bash
cd scripts
chmod +x deploy.sh
./deploy.sh
```

### 📱 Requirements

- Apple Developer Account ($99/year)
- Google Play Developer Account ($25 one-time)
- Expo account (free)

See [QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md) for complete requirements and timeline.

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
