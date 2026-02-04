# Quick Start: Deploy to App Stores

Fast track guide to get Rewardly on the App Store and Play Store.

## 🚀 30-Second Overview

1. Create developer accounts (Apple $99/year, Google $25 one-time)
2. Run `eas init` to set up your project
3. Update `app.json` with your bundle IDs
4. Run deployment script or use EAS commands
5. Submit to stores and wait for review

## ⏱️ Time Estimate

- **Account setup**: 1-3 days (waiting for verification)
- **Configuration**: 1-2 hours
- **First build**: 20-30 minutes
- **Store listing**: 2-3 hours
- **Review wait**: 1-7 days
- **Total**: 3-10 days for first deployment

## 📋 Prerequisites

Install these first:

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login
```

## 🎯 Step-by-Step (Fastest Path)

### Step 1: Create Accounts (Do First!)

**Apple Developer** ($99/year)
- Sign up: https://developer.apple.com
- Wait for verification (24-48 hours)

**Google Play Developer** ($25 one-time)
- Sign up: https://play.google.com/console
- Instant access after payment

### Step 2: Initialize Project

```bash
cd fintech-idea/rewards-optimizer

# Initialize EAS (creates project ID)
eas init

# This updates app.json automatically
```

### Step 3: Update Configuration

Edit `app.json` - change these values:

```json
{
  "expo": {
    "owner": "your-expo-username",
    "ios": {
      "bundleIdentifier": "com.yourcompany.rewardly"
    },
    "android": {
      "package": "com.yourcompany.rewardly"
    }
  }
}
```

### Step 4: Build Apps

**Option A: Use Deployment Script (Easiest)**

Windows:
```cmd
cd scripts
deploy.bat
```

Mac/Linux:
```bash
cd scripts
chmod +x deploy.sh
./deploy.sh
```

**Option B: Manual Commands**

```bash
# Build both platforms
eas build --platform all --profile production

# Or build individually
eas build --platform ios --profile production
eas build --platform android --profile production
```

Wait 15-30 minutes for builds to complete.

### Step 5: Create Store Listings

While builds are running, prepare your store listings:

**iOS - App Store Connect**
1. Go to https://appstoreconnect.apple.com
2. Create new app
3. Fill in app information
4. Upload screenshots (1290x2796 for iPhone)
5. Add description and keywords

**Android - Play Console**
1. Go to https://play.google.com/console
2. Create new app
3. Fill in store listing
4. Upload screenshots (1080x1920 minimum)
5. Complete content rating questionnaire

### Step 6: Submit to Stores

**Option A: Use Script**
- Select option 6 (iOS) or 7 (Android) from deployment menu

**Option B: Manual Commands**

```bash
# Submit iOS
eas submit --platform ios --latest

# Submit Android
eas submit --platform android --latest
```

### Step 7: Wait for Review

- **iOS**: Usually 24-48 hours
- **Android**: Usually 1-7 days
- You'll receive email updates

## 🎨 Required Assets

Prepare these before starting:

### App Icons
- iOS: 1024x1024 PNG (no transparency)
- Android: 1024x1024 PNG

### Screenshots
- iPhone 6.5": 1290 x 2796 (minimum 3)
- Android: 1080 x 1920 (minimum 2)

### Marketing
- App description (4000 chars max)
- Short description (80 chars for Android)
- Keywords (100 chars for iOS)
- Privacy policy URL
- Support URL

## 🔑 Important Credentials

You'll need to set up:

### For iOS:
- Apple ID email
- App Store Connect App ID (numeric)
- API Key (.p8 file) - optional but recommended

### For Android:
- Google service account JSON file
- Save as `google-services.json` in project root
- **Never commit this file to git!**

## 📱 Test Before Production

Build test versions first:

```bash
# iOS TestFlight
eas build --platform ios --profile production
eas submit --platform ios --latest
# Add testers in App Store Connect → TestFlight

# Android Internal Testing
eas build --platform android --profile preview
# Upload to Play Console → Internal Testing
```

## 🔄 Future Updates

When you need to update the app:

1. **Update version in `app.json`:**
```json
{
  "version": "1.0.1",
  "ios": { "buildNumber": "2" },
  "android": { "versionCode": 2 }
}
```

2. **Build and submit:**
```bash
eas build --platform all --profile production
eas submit --platform ios --latest
eas submit --platform android --latest
```

## 💰 Costs

| Item | Cost | When |
|------|------|------|
| Apple Developer | $99 | Annual |
| Google Play | $25 | One-time |
| EAS Build (Free) | $0 | 30 builds/month |
| EAS Build (Paid) | $29 | Monthly (unlimited) |

## 🆘 Common Issues

### "Not logged in to EAS"
```bash
eas login
```

### "Project not initialized"
```bash
eas init
```

### "Build failed"
```bash
# Clear cache and retry
eas build --platform [ios|android] --clear-cache
```

### "Can't submit - credentials missing"
- iOS: Update `eas.json` with Apple ID and App ID
- Android: Ensure `google-services.json` exists and path is correct in `eas.json`

## 📚 Detailed Documentation

For more details, see:

- **`APP_STORE_DEPLOYMENT.md`** - Complete step-by-step guide
- **`DEPLOYMENT_CHECKLIST.md`** - Detailed checklist
- **`scripts/README.md`** - Deployment script documentation

## 🎯 Quick Commands Reference

```bash
# Setup
eas login
eas init

# Build
eas build --platform all --profile production
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit
eas submit --platform ios --latest
eas submit --platform android --latest

# Status
eas build:list
eas whoami

# Update (OTA for minor changes)
eas update --branch production --message "Bug fixes"
```

## ✅ Success Checklist

Before submitting, verify:

- [ ] Developer accounts created and verified
- [ ] `app.json` configured with correct bundle IDs
- [ ] `eas.json` configured with credentials
- [ ] App icons prepared (1024x1024)
- [ ] Screenshots prepared
- [ ] Privacy policy URL ready
- [ ] App description written
- [ ] Builds completed successfully
- [ ] Tested on real devices
- [ ] Store listings completed

## 🎉 You're Ready!

Once you've completed these steps:
1. Your apps will be in review
2. You'll receive email notifications
3. Apps typically go live within 1-7 days
4. Celebrate your launch! 🚀

## 💡 Pro Tips

1. **Start with test builds** - Use TestFlight (iOS) and Internal Testing (Android) first
2. **Prepare assets early** - Screenshots and descriptions take time
3. **Read rejection reasons carefully** - Most issues are easy to fix
4. **Plan for 1-2 weeks** - First submission always takes longer
5. **Keep credentials secure** - Never commit API keys or service account files

## 🔗 Useful Links

- Expo Docs: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction/
- App Store Connect: https://appstoreconnect.apple.com
- Play Console: https://play.google.com/console
- Apple Developer: https://developer.apple.com

---

**Need help?** Check the detailed guides or run the deployment script for interactive assistance!
