# App Store & Play Store Deployment Guide

Complete guide for deploying Rewards Optimizer to Apple App Store and Google Play Store.

## Prerequisites

### General Requirements
- Node.js 18+ installed
- Expo account: https://expo.dev/signup
- EAS CLI installed: `npm install -g eas-cli`
- Git repository with your code

### iOS App Store Requirements
- Apple Developer Account ($99/year): https://developer.apple.com
- Mac computer (for certain steps, though EAS Build can build on cloud)
- App Store Connect access

### Google Play Store Requirements
- Google Play Developer Account ($25 one-time): https://play.google.com/console
- Google Cloud Project (free)

---

## Part 1: Initial Project Setup

### Step 1: Update App Configuration

Edit `app.json` with your actual details:

```json
{
  "expo": {
    "name": "Rewardly",
    "slug": "rewardly",
    "version": "1.0.0",
    "owner": "YOUR_EXPO_USERNAME",
    "ios": {
      "bundleIdentifier": "com.yourcompany.rewardly",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.yourcompany.rewardly",
      "versionCode": 1
    },
    "extra": {
      "eas": {
        "projectId": "YOUR_PROJECT_ID"
      }
    }
  }
}
```

### Step 2: Initialize EAS

```bash
cd fintech-idea/rewards-optimizer
eas login
eas init
```

This will:
- Create/link your EAS project
- Generate a project ID
- Update your `app.json` automatically

---

## Part 2: iOS App Store Deployment

### Step 1: Apple Developer Account Setup

1. **Create Apple Developer Account**
   - Go to https://developer.apple.com
   - Enroll in Apple Developer Program ($99/year)
   - Complete verification (can take 24-48 hours)

2. **Create App Store Connect App**
   - Go to https://appstoreconnect.apple.com
   - Click "My Apps" → "+" → "New App"
   - Fill in:
     - Platform: iOS
     - Name: Rewardly
     - Primary Language: English
     - Bundle ID: com.yourcompany.rewardly (must match app.json)
     - SKU: rewardly-001 (unique identifier)
   - Note the App ID (numeric, like 1234567890)

### Step 2: Generate App Store Connect API Key

1. Go to https://appstoreconnect.apple.com/access/api
2. Click "+" to create a new key
3. Name it "EAS Build"
4. Select "Admin" or "App Manager" role
5. Download the .p8 file (save it securely!)
6. Note the:
   - Key ID (e.g., ABC123XYZ)
   - Issuer ID (e.g., 12345678-1234-1234-1234-123456789012)

### Step 3: Configure EAS for iOS

Update `eas.json`:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

### Step 4: Build for iOS

```bash
# Build production iOS app
eas build --platform ios --profile production
```

This will:
- Build your app in the cloud
- Take 10-20 minutes
- Generate an IPA file

### Step 5: Submit to App Store

```bash
# Submit to App Store Connect
eas submit --platform ios --latest
```

Or manually:
1. Download the IPA from EAS dashboard
2. Use Transporter app (Mac) or Application Loader
3. Upload to App Store Connect

### Step 6: Complete App Store Connect Listing

1. Go to https://appstoreconnect.apple.com
2. Select your app
3. Fill in required information:

**App Information:**
- Name: Rewardly
- Subtitle: Maximize Credit Card Rewards
- Category: Finance
- Content Rights: Check if you own rights

**Pricing and Availability:**
- Price: Free
- Availability: All countries or select specific ones

**App Privacy:**
- Add privacy policy URL
- Complete privacy questionnaire
- Declare data collection practices

**Screenshots (Required):**
- 6.5" iPhone: 1290 x 2796 pixels (at least 3 screenshots)
- 5.5" iPhone: 1242 x 2208 pixels (at least 3 screenshots)
- iPad Pro: 2048 x 2732 pixels (optional)

**App Description:**
- Description (max 4000 characters)
- Keywords (max 100 characters)
- Support URL
- Marketing URL (optional)

**Build:**
- Select the build you uploaded
- Add "What's New in This Version" text

### Step 7: Submit for Review

1. Click "Submit for Review"
2. Answer questionnaire about:
   - Export compliance
   - Content rights
   - Advertising identifier
3. Submit

**Review Timeline:**
- Usually 24-48 hours
- Can take up to 7 days
- You'll receive email updates

---

## Part 3: Google Play Store Deployment

### Step 1: Google Play Console Setup

1. **Create Developer Account**
   - Go to https://play.google.com/console
   - Pay $25 one-time registration fee
   - Complete account verification

2. **Create New App**
   - Click "Create app"
   - Fill in:
     - App name: Rewardly
     - Default language: English
     - App or game: App
     - Free or paid: Free
   - Accept declarations
   - Click "Create app"

### Step 2: Set Up Google Service Account

1. **Create Google Cloud Project**
   - Go to https://console.cloud.google.com
   - Create new project: "Rewardly"

2. **Enable Google Play Android Developer API**
   - In Cloud Console, go to "APIs & Services" → "Library"
   - Search "Google Play Android Developer API"
   - Click "Enable"

3. **Create Service Account**
   - Go to "IAM & Admin" → "Service Accounts"
   - Click "Create Service Account"
   - Name: "EAS Build"
   - Click "Create and Continue"
   - Skip optional steps
   - Click "Done"

4. **Create Service Account Key**
   - Click on the service account you created
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Choose JSON format
   - Download the JSON file
   - Save as `google-services.json` in your project root

5. **Grant Play Console Access**
   - Go back to Play Console
   - Go to "Setup" → "API access"
   - Click "Link" next to your service account
   - Grant "Admin" permissions
   - Click "Invite user"

### Step 3: Configure EAS for Android

Update `eas.json`:

```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-services.json",
        "track": "internal"
      }
    }
  }
}
```

**Important:** Add to `.gitignore`:
```
google-services.json
```

### Step 4: Build for Android

```bash
# Build production Android app bundle
eas build --platform android --profile production
```

This will:
- Build AAB (Android App Bundle)
- Take 10-15 minutes
- Generate downloadable file

### Step 5: Submit to Play Store

```bash
# Submit to Play Console
eas submit --platform android --latest
```

Or manually:
1. Download AAB from EAS dashboard
2. Go to Play Console → "Release" → "Production"
3. Click "Create new release"
4. Upload AAB file

### Step 6: Complete Play Store Listing

**Store Presence → Main Store Listing:**

1. **App Details**
   - App name: Rewardly
   - Short description (80 chars): Maximize your credit card rewards
   - Full description (4000 chars): Detailed app description

2. **Graphics**
   - App icon: 512 x 512 PNG
   - Feature graphic: 1024 x 500 PNG
   - Phone screenshots: At least 2 (1080 x 1920 or higher)
   - 7-inch tablet screenshots: Optional
   - 10-inch tablet screenshots: Optional

3. **Categorization**
   - App category: Finance
   - Tags: Add relevant tags

4. **Contact Details**
   - Email address
   - Phone number (optional)
   - Website (optional)

5. **Privacy Policy**
   - Privacy policy URL (required)

**Store Presence → Store Settings:**
- App category: Finance
- Tags: finance, rewards, credit cards

**Policy → App Content:**

1. **Privacy Policy**
   - Add privacy policy URL

2. **App Access**
   - Declare if app requires login

3. **Ads**
   - Declare if app contains ads

4. **Content Rating**
   - Complete questionnaire
   - Usually rated "Everyone"

5. **Target Audience**
   - Select age groups

6. **News Apps**
   - Declare if applicable

7. **COVID-19 Contact Tracing**
   - Declare if applicable

8. **Data Safety**
   - Complete data safety form
   - Declare what data you collect
   - Explain how data is used

**Release → Production:**

1. **Countries/Regions**
   - Select available countries

2. **Create Release**
   - Upload AAB (if not using EAS submit)
   - Add release notes
   - Review and rollout

### Step 7: Submit for Review

1. Click "Send for review"
2. Review can take 1-7 days
3. You'll receive email updates

---

## Part 4: Testing Before Production

### Internal Testing (Recommended First)

**iOS TestFlight:**
```bash
# Build and submit to TestFlight
eas build --platform ios --profile production
eas submit --platform ios --latest
```

1. Go to App Store Connect → TestFlight
2. Add internal testers (up to 100)
3. Share TestFlight link
4. Get feedback before public release

**Android Internal Testing:**
```bash
# Submit to internal track
eas submit --platform android --latest
```

Update `eas.json` for internal testing:
```json
{
  "submit": {
    "production": {
      "android": {
        "track": "internal"
      }
    }
  }
}
```

1. Go to Play Console → "Release" → "Testing" → "Internal testing"
2. Add testers by email
3. Share testing link
4. Promote to production when ready

---

## Part 5: App Updates

### Version Updates

1. **Update version numbers in `app.json`:**
   ```json
   {
     "expo": {
       "version": "1.0.1",
       "ios": {
         "buildNumber": "2"
       },
       "android": {
         "versionCode": 2
       }
     }
   }
   ```

2. **Build new version:**
   ```bash
   eas build --platform all --profile production
   ```

3. **Submit updates:**
   ```bash
   eas submit --platform ios --latest
   eas submit --platform android --latest
   ```

### Over-the-Air (OTA) Updates

For minor updates without app store review:

```bash
# Install expo-updates
npm install expo-updates

# Publish update
eas update --branch production --message "Bug fixes"
```

---

## Part 6: Troubleshooting

### Common iOS Issues

**Build fails with provisioning profile error:**
```bash
# Clear credentials and rebuild
eas credentials
# Select "Remove all credentials"
eas build --platform ios --clear-cache
```

**App rejected for missing privacy descriptions:**
- Add to `app.json`:
```json
{
  "ios": {
    "infoPlist": {
      "NSCameraUsageDescription": "This app uses the camera to...",
      "NSPhotoLibraryUsageDescription": "This app accesses photos to..."
    }
  }
}
```

### Common Android Issues

**Build fails with signing error:**
```bash
# Generate new keystore
eas credentials
# Select "Set up a new Android Keystore"
```

**App rejected for missing permissions:**
- Add to `app.json`:
```json
{
  "android": {
    "permissions": [
      "INTERNET",
      "ACCESS_NETWORK_STATE"
    ]
  }
}
```

---

## Part 7: Costs Summary

| Service | Cost | Frequency |
|---------|------|-----------|
| Apple Developer Program | $99 | Annual |
| Google Play Developer | $25 | One-time |
| Expo EAS Build | Free tier: 30 builds/month | Monthly |
| Expo EAS Submit | Free | - |

**EAS Pricing:**
- Free: 30 builds/month
- Production: $29/month (unlimited builds)
- Enterprise: Custom pricing

---

## Quick Reference Commands

```bash
# Login to EAS
eas login

# Build both platforms
eas build --platform all --profile production

# Build iOS only
eas build --platform ios --profile production

# Build Android only
eas build --platform android --profile production

# Submit iOS
eas submit --platform ios --latest

# Submit Android
eas submit --platform android --latest

# Check build status
eas build:list

# View specific build
eas build:view [build-id]

# Publish OTA update
eas update --branch production --message "Update description"
```

---

## Checklist

### Before First Submission

- [ ] Apple Developer account created and verified
- [ ] Google Play Developer account created and verified
- [ ] App Store Connect app created
- [ ] Play Console app created
- [ ] App icons and screenshots prepared
- [ ] Privacy policy URL ready
- [ ] App description written
- [ ] Service account JSON created (Android)
- [ ] API key created (iOS)
- [ ] `app.json` configured with correct bundle IDs
- [ ] `eas.json` configured
- [ ] `.gitignore` updated for sensitive files
- [ ] Environment variables configured
- [ ] App tested thoroughly

### For Each Update

- [ ] Version numbers incremented
- [ ] Release notes written
- [ ] App tested on both platforms
- [ ] Screenshots updated (if UI changed)
- [ ] Privacy policy updated (if data collection changed)
- [ ] Build successful
- [ ] Submitted for review

---

## Support Resources

- **Expo Documentation:** https://docs.expo.dev
- **EAS Build:** https://docs.expo.dev/build/introduction/
- **EAS Submit:** https://docs.expo.dev/submit/introduction/
- **App Store Connect Help:** https://developer.apple.com/support/app-store-connect/
- **Play Console Help:** https://support.google.com/googleplay/android-developer/

## Next Steps

1. Create developer accounts (Apple & Google)
2. Run `eas init` to set up your project
3. Update `app.json` with your details
4. Create test builds first
5. Complete store listings
6. Submit for review
7. Monitor review status
8. Celebrate your launch! 🎉
