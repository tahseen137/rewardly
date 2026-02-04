# Rewardly 🇨🇦

**Maximize your credit card rewards with smart, real-time recommendations.**

Rewardly helps Canadians earn more rewards by instantly showing which card to use at any store. Built with React Native and Expo for iOS, Android, and Web.

---

## 🌟 Features

- **🎯 Smart Recommendations** - Enter any store and instantly see which card earns the most rewards
- **💳 Canadian Card Database** - Comprehensive coverage of major Canadian credit cards (TD, RBC, BMO, CIBC, Scotiabank, Amex, and more)
- **🏆 Multi-Currency Rewards** - Track cashback, points, airline miles, and hotel points
- **✨ Card Discovery** - Get suggestions for better cards based on your spending patterns
- **🌐 Bilingual** - Full support for English and French
- **🔒 Privacy-First** - All data stored locally on your device

---

## 🛠 Tech Stack

- **Frontend:** React Native 0.81 with Expo 54
- **Language:** TypeScript
- **Backend:** Supabase (PostgreSQL)
- **APIs:** Google Places API for store lookup
- **Navigation:** React Navigation 7
- **State:** AsyncStorage for local persistence
- **Testing:** Jest + fast-check for property-based testing
- **Internationalization:** i18next

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- Supabase account (optional for cloud features)
- Google Cloud account (optional for Places API)

### Installation

```bash
# Clone the repository
git clone https://github.com/tahseen137/rewardly.git
cd rewardly

# Install dependencies
npm install

# Start the development server
npx expo start
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_PLACES_API_KEY=your_google_places_api_key
```

### Run on Device/Emulator

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

---

## 📁 Project Structure

```
rewardly/
├── src/
│   ├── components/      # Reusable UI components
│   ├── data/            # Static card and store data
│   ├── i18n/            # Internationalization (EN/FR)
│   ├── navigation/      # React Navigation setup
│   ├── screens/         # App screens (Home, MyCards, Settings)
│   ├── services/        # Business logic
│   │   ├── CardDataService.ts
│   │   ├── CardPortfolioManager.ts
│   │   ├── PreferenceManager.ts
│   │   ├── RecommendationEngine.ts
│   │   └── StoreDataService.ts
│   └── types/           # TypeScript type definitions
├── assets/              # Images, icons, splash screens
├── docs/                # Project documentation
└── scripts/             # Deployment and build scripts
```

---

## 📸 Screenshots

_Coming soon! Screenshots of the app in action._

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

---

## 📱 Deployment

Ready to deploy? Check out our comprehensive deployment guides:

- **[Quick Start Deployment](docs/QUICK_START_DEPLOYMENT.md)** - Fast-track guide
- **[App Store Deployment](docs/APP_STORE_DEPLOYMENT.md)** - Complete iOS/Android guide
- **[Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md)** - Track your progress

### Quick Deploy Commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for production
npm run build:production

# Submit to stores
npm run submit:ios
npm run submit:android
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💳 Supported Canadian Credit Cards

**Major Banks:**
- TD (Aeroplan Visa Infinite, Cash Back Visa Infinite)
- RBC (Avion Visa Infinite, WestJet World Elite)
- BMO (Air Miles World Elite, CashBack World Elite)
- CIBC (Aventura Visa Infinite, Aeroplan Visa Infinite)
- Scotiabank (Scene+ Visa, Passport Visa Infinite)

**Premium Cards:**
- American Express (Cobalt, Gold, Platinum)
- And many more...

Full card database available in `src/data/`

---

## 🙏 Acknowledgments

Built with ❤️ for the Canadian credit card rewards community.

---

**Questions or feedback?** Open an issue or reach out via GitHub!
