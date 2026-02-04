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

## Design System

### Color Palette (Dark Blue/Green Theme)

The app uses a modern dark theme with bright green (#1DDB82) as the primary color:

```typescript
// Import colors
import { colors } from '../theme/colors';

// Primary Colors
colors.primary.main      // #1DDB82 - Bright green
colors.primary.light     // #4DE89D
colors.primary.dark      // #14B66F
colors.primary.bg10      // rgba(29, 219, 130, 0.1)
colors.primary.bg20      // rgba(29, 219, 130, 0.2)

// Accent Colors (Purple)
colors.accent.main       // #8B5CF6
colors.accent.light      // #A78BFA
colors.accent.dark       // #7C3AED

// Background Colors (Dark Blue)
colors.background.primary    // #0A0E1F - Main background
colors.background.secondary  // #0F1528 - Card background
colors.background.tertiary   // #1D2639 - Secondary elements
colors.background.elevated   // #171D30 - Elevated cards
colors.background.muted      // #17202F - Muted backgrounds

// Text Colors
colors.text.primary      // #F8FAFC - Main text
colors.text.secondary    // #7C8BA1 - Secondary text
colors.text.tertiary     // #64748B - Muted text

// Border Colors
colors.border.light      // #212B3E - Main borders
colors.border.medium     // #2D3B54
colors.border.dark       // #3A4A6B
```

### Typography

```typescript
// Font sizes and weights
h1: 28px, bold (700)      // Page titles
h2: 24px, semibold (600)  // Section headers
body: 15px, normal (400)  // Body text
bodySmall: 13px           // Small body text
caption: 11px             // Labels, captions
```

### Spacing

```typescript
paddingHorizontal: 16px   // Screen padding
paddingVertical: 24px     // Section spacing
sectionSpacing: 16px      // Between sections
borderRadius: 12px (md)   // Cards, inputs
borderRadius: 16px (lg)   // Large cards
```

### Components

#### New Redesigned Components

1. **GradientText** - Gradient text with primary/accent variants
   ```typescript
   import { GradientText } from '../components';
   <GradientText variant="primary">Title</GradientText>
   ```

2. **GlassCard** - Glass morphism card with blur effect
   ```typescript
   import { GlassCard } from '../components';
   <GlassCard><Content /></GlassCard>
   ```

3. **CategoryGrid** - 4-column category selector grid
   ```typescript
   import { CategoryGrid } from '../components';
   <CategoryGrid
     selectedCategory={category}
     onCategorySelect={handleSelect}
   />
   ```

4. **FadeInView** - Animated fade-in wrapper with stagger support
   ```typescript
   import { FadeInView } from '../components';
   <FadeInView delay={0}><Content /></FadeInView>
   ```

#### Icons

Use lucide-react-native for all icons:

```typescript
import { Home, CreditCard, Settings, Plus, Search, Trash2 } from 'lucide-react-native';

<Home size={20} color={colors.primary.main} />
```

Common icon sizes:
- Navigation: 20px
- Buttons: 16-20px
- Headers: 24px

### Animations

```typescript
// Animation timings
fadeIn: 300ms
slideUp: 400ms
stagger: 50ms delay per item

// Spring animations (tab navigation)
spring: {
  damping: 15,
  stiffness: 150
}
```

### Accessibility

- All touch targets ≥ 44x44px
- Color contrast meets WCAG AA standards
- Screen reader support via accessibilityLabel
- Focus indicators on interactive elements

## Code Conventions

- **Components/Services:** PascalCase (e.g., `HomeScreen.tsx`, `CardDataService.ts`)
- **Functions:** camelCase
- **Types/Interfaces:** PascalCase
- **Error handling:** `Result<T, E>` pattern - no thrown exceptions
- **Styling:** React Native StyleSheet with direct color imports from `theme/colors`
- **Icons:** lucide-react-native (consistent 20px sizing)

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
