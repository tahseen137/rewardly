# Rewards Optimizer - Deployment Guide

This guide covers three deployment options for the Rewards Optimizer app.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Expo account (for EAS builds): https://expo.dev/signup

## Option 1: Local Development (Expo Go)

The quickest way to test the app on your device.

### Steps

1. **Install dependencies:**
   ```bash
   cd fintech-idea/rewards-optimizer
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Test on your device:**
   - Download "Expo Go" from App Store (iOS) or Play Store (Android)
   - Scan the QR code shown in the terminal
   - The app will load on your device

4. **Test on web:**
   ```bash
   npm run web
   ```
   Opens the app in your browser at http://localhost:8081

### Development Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run android` | Start on Android emulator |
| `npm run ios` | Start on iOS simulator |
| `npm run web` | Start in web browser |

---

## Option 2: Web Deployment (Vercel/Netlify)

Deploy the web version for quick demos and sharing.

### Build for Web

```bash
npm run build:web
```

This creates a `dist` folder with the production web build.

### Deploy to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   
   Or for production:
   ```bash
   vercel --prod
   ```

4. **Alternative: Connect GitHub repo**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Vercel auto-detects the config from `vercel.json`

### Deploy to Netlify

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Deploy:**
   ```bash
   netlify deploy
   ```
   
   For production:
   ```bash
   netlify deploy --prod
   ```

4. **Alternative: Connect GitHub repo**
   - Go to https://app.netlify.com/start
   - Import your GitHub repository
   - Netlify auto-detects the config from `netlify.toml`

### Deploy to GitHub Pages

1. **Install gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add to package.json scripts:**
   ```json
   "deploy:gh-pages": "npm run build:web && gh-pages -d dist"
   ```

3. **Deploy:**
   ```bash
   npm run deploy:gh-pages
   ```

---

## Option 3: Mobile App Stores (EAS Build)

Build native iOS and Android apps for App Store and Play Store.

### Initial Setup

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure your project:**
   
   Update `app.json` with your details:
   ```json
   {
     "expo": {
       "owner": "your-expo-username",
       "extra": {
         "eas": {
           "projectId": "your-project-id"
         }
       }
     }
   }
   ```

4. **Link to EAS:**
   ```bash
   eas init
   ```

### Build Commands

| Command | Description |
|---------|-------------|
| `npm run build:android-apk` | Build Android APK for testing |
| `npm run build:ios-simulator` | Build iOS simulator app |
| `npm run build:preview` | Build both platforms for internal testing |
| `npm run build:production` | Build for App Store/Play Store |

### Build Android APK (Testing)

```bash
npm run build:android-apk
```

- Downloads an APK file you can install on any Android device
- Great for sharing with testers

### Build iOS (Testing)

```bash
npm run build:ios-simulator
```

- Creates a build for iOS Simulator
- For device testing, you need an Apple Developer account

### Production Builds

```bash
npm run build:production
```

This creates:
- **iOS**: IPA file for App Store submission
- **Android**: AAB (App Bundle) for Play Store submission

### Submit to App Stores

**iOS App Store:**
```bash
npm run submit:ios
```

Requirements:
- Apple Developer account ($99/year)
- Update `eas.json` with your Apple ID and App Store Connect App ID

**Google Play Store:**
```bash
npm run submit:android
```

Requirements:
- Google Play Developer account ($25 one-time)
- Service account JSON key file
- Update `eas.json` with the path to your service account key

---

## Configuration Files

| File | Purpose |
|------|---------|
| `app.json` | Expo app configuration |
| `eas.json` | EAS Build profiles |
| `vercel.json` | Vercel deployment config |
| `netlify.toml` | Netlify deployment config |

## Environment Variables

For production, you may want to add environment variables:

1. Create `.env` file (don't commit to git):
   ```
   API_URL=https://your-api.com
   ```

2. Access in code:
   ```typescript
   import Constants from 'expo-constants';
   const apiUrl = Constants.expoConfig?.extra?.apiUrl;
   ```

3. Add to `app.json`:
   ```json
   {
     "expo": {
       "extra": {
         "apiUrl": process.env.API_URL
       }
     }
   }
   ```

## Troubleshooting

### Web build fails
```bash
# Clear cache and rebuild
npx expo export -p web --clear
```

### EAS build fails
```bash
# Check build logs
eas build:list
eas build:view [build-id]
```

### Metro bundler issues
```bash
# Clear Metro cache
npx expo start --clear
```

## Quick Start Summary

```bash
# 1. Local development
npm install
npm start

# 2. Web deployment
npm run build:web
vercel --prod

# 3. Mobile builds
eas login
npm run build:android-apk
```
