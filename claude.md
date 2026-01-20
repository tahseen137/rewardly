# Rewardly (Rewards Optimizer)

A React Native mobile app for the Canadian market that helps users maximize credit card rewards through intelligent recommendations.

## Quick Reference

```bash
npm install          # Install dependencies
npm start            # Start Expo dev server
npm run android      # Run on Android
npm run ios          # Run on iOS
npm run web          # Run in browser
npm test             # Run tests
npm run lint         # ESLint check
npm run format       # Prettier format
```

## Development Workflow

Follow this workflow for every feature or task:

### 1. Setup Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### 2. Develop

- Make your changes following the code conventions below
- Write tests for new functionality
- Keep commits atomic and well-described

### 3. Pre-Push Checks

Before pushing, run these checks:

```bash
# Type checking
npx tsc --noEmit

# Linting and formatting
npm run lint
npm run format

# Run all tests
npm test

# Security: Check for vulnerable dependencies
npm audit

# Security: Review for common issues
# - No hardcoded secrets/API keys
# - No sensitive data in logs
# - Input validation on user data
# - No SQL injection (use parameterized queries)
# - No XSS vulnerabilities (sanitize rendered content)

# Performance: Review for common issues
# - No unnecessary re-renders (check useCallback/useMemo usage)
# - No memory leaks (cleanup in useEffect)
# - Efficient list rendering (use FlatList with keyExtractor)
# - Avoid synchronous storage operations in render
```

### 4. Push Feature Branch

```bash
git add .
git commit -m "feat: description of your changes"
git push origin feature/your-feature-name
```

Then create a Pull Request to merge into `main`.

## Tech Stack

- **Framework:** React Native 0.81 with Expo 54
- **Language:** TypeScript 5.9 (strict mode)
- **Navigation:** React Navigation v7 (bottom tabs)
- **Database:** Supabase (PostgreSQL) with AsyncStorage fallback
- **i18n:** i18next (English/French)
- **Testing:** Jest + ts-jest + fast-check (property-based)
- **APIs:** Google Places API (optional)

## Project Structure

```
src/
├── components/       # Reusable UI components (ErrorBoundary)
├── data/            # Bundled JSON data (cards, stores, products, prices)
├── i18n/            # Internationalization (en.json, fr.json)
├── navigation/      # AppNavigator with bottom tabs
├── screens/         # HomeScreen, MyCardsScreen, ProductSearchScreen, SettingsScreen
├── services/        # Business logic layer
│   ├── google-places/   # Google Places API integration
│   ├── supabase/        # Database client and queries
│   └── __tests__/       # Service tests
└── types/           # TypeScript type definitions
```

## Key Services

| Service | Purpose |
|---------|---------|
| `RecommendationEngine.ts` | Core logic for ranking cards by rewards |
| `CardDataService.ts` | Fetches cards from Supabase or bundled JSON |
| `CardPortfolioManager.ts` | Manages user's selected cards (AsyncStorage) |
| `StoreDataService.ts` | Store search and category mapping |
| `PriceComparisonService.ts` | Calculates effective prices (price - rewards) |
| `PreferenceManager.ts` | User settings persistence |

## Architecture Decisions

- **Offline-first:** Core features work without internet; card data bundled in app
- **Manual card entry:** Users select from database (no Plaid integration)
- **Local computation:** Recommendations calculated on-device for privacy/speed
- **Hybrid storage:** AsyncStorage for user data, Supabase for card database

## Code Conventions

- **Components/Services:** PascalCase (e.g., `HomeScreen.tsx`, `CardDataService.ts`)
- **Functions:** camelCase
- **Types/Interfaces:** PascalCase
- **Error handling:** `Result<T, E>` pattern - no thrown exceptions
- **Styling:** React Native StyleSheet (no external CSS-in-JS)

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_api_key
```

## Testing

- Unit tests in `src/services/__tests__/`
- Property-based tests in `src/services/__tests__/property/`
- AsyncStorage is mocked in tests
- Run `npm run test:coverage` for coverage report

## Building & Deployment

```bash
# Mobile builds (requires EAS account)
npm run build:preview         # Preview builds
npm run build:production      # Production builds
npm run build:android-apk     # Android APK only

# App store submission
npm run submit:ios            # Apple App Store
npm run submit:android        # Google Play Store

# Web deployment
npm run build:web             # Build for web
npm run deploy:vercel         # Deploy to Vercel
npm run deploy:netlify        # Deploy to Netlify
```

## App Identifiers

- **iOS Bundle ID:** `com.rewardsoptimizer.app`
- **Android Package:** `com.rewardsoptimizer.app`
- **App Name:** Rewardly
