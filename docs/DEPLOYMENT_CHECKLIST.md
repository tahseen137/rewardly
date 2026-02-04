# Deployment Checklist

Quick reference checklist for deploying Rewardly to app stores.

## Phase 1: Account Setup (Do Once)

### Apple App Store
- [ ] Create Apple Developer account ($99/year)
  - URL: https://developer.apple.com
  - Wait for verification (24-48 hours)
- [ ] Create app in App Store Connect
  - URL: https://appstoreconnect.apple.com
  - Note your App ID (numeric)
- [ ] Generate App Store Connect API Key
  - Save the .p8 file securely
  - Note Key ID and Issuer ID

### Google Play Store
- [ ] Create Google Play Developer account ($25 one-time)
  - URL: https://play.google.com/console
- [ ] Create app in Play Console
- [ ] Set up Google Cloud Project
  - Enable Google Play Android Developer API
- [ ] Create service account
  - Download JSON key file
  - Save as `google-services.json`
  - Add to `.gitignore`
- [ ] Grant service account access in Play Console

### Expo Setup
- [ ] Create Expo account
  - URL: https://expo.dev/signup
- [ ] Install EAS CLI
  ```bash
  npm install -g eas-cli
  ```
- [ ] Login to EAS
  ```bash
  eas login
  ```

## Phase 2: Project Configuration

- [ ] Update `app.json`:
  ```json
  {
    "expo": {
      "owner": "YOUR_EXPO_USERNAME",
      "ios": {
        "bundleIdentifier": "com.yourcompany.rewardly"
      },
      "android": {
        "package": "com.yourcompany.rewardly"
      }
    }
  }
  ```

- [ ] Initialize EAS project
  ```bash
  cd fintech-idea/rewards-optimizer
  eas init
  ```

- [ ] Update `eas.json` with your credentials:
  ```json
  {
    "submit": {
      "production": {
        "ios": {
          "appleId": "your-email@example.com",
          "ascAppId": "1234567890"
        },
        "android": {
          "serviceAccountKeyPath": "./google-services.json"
        }
      }
    }
  }
  ```

- [ ] Add `google-services.json` to `.gitignore`

## Phase 3: Prepare Assets

### App Icons
- [ ] iOS icon: 1024x1024 PNG (no transparency)
- [ ] Android adaptive icon: 1024x1024 PNG
- [ ] Favicon: 48x48 PNG

### Screenshots
- [ ] iOS 6.5" (1290 x 2796): Minimum 3 screenshots
- [ ] iOS 5.5" (1242 x 2208): Minimum 3 screenshots
- [ ] Android phone (1080 x 1920 or higher): Minimum 2 screenshots
- [ ] Optional: Tablet screenshots

### Marketing Assets
- [ ] Feature graphic (Android): 1024 x 500 PNG
- [ ] App description (4000 chars max)
- [ ] Short description (80 chars max for Android)
- [ ] Keywords (100 chars max for iOS)
- [ ] Privacy policy URL
- [ ] Support URL

## Phase 4: Store Listings

### iOS App Store Connect
- [ ] App name: Rewardly
- [ ] Subtitle: Maximize Credit Card Rewards
- [ ] Category: Finance
- [ ] Price: Free
- [ ] Description
- [ ] Keywords
- [ ] Screenshots uploaded
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Complete privacy questionnaire
- [ ] Complete App Privacy section

### Google Play Console
- [ ] App name: Rewardly
- [ ] Short description
- [ ] Full description
- [ ] App icon uploaded
- [ ] Feature graphic uploaded
- [ ] Screenshots uploaded
- [ ] Category: Finance
- [ ] Privacy policy URL
- [ ] Complete Data Safety form
- [ ] Complete Content Rating questionnaire
- [ ] Select target countries

## Phase 5: Build & Test

### Test Builds First
- [ ] Build for internal testing:
  ```bash
  eas build --platform all --profile preview
  ```

- [ ] Test on iOS (TestFlight):
  ```bash
  eas submit --platform ios --latest
  ```
  - Add internal testers in App Store Connect
  - Test thoroughly

- [ ] Test on Android (Internal Testing):
  ```bash
  eas submit --platform android --latest
  ```
  - Add testers in Play Console
  - Test thoroughly

### Production Builds
- [ ] Increment version numbers in `app.json`
- [ ] Build production apps:
  ```bash
  eas build --platform all --profile production
  ```
- [ ] Wait for builds to complete (10-20 minutes)
- [ ] Download and test builds locally if possible

## Phase 6: Submit for Review

### iOS Submission
- [ ] Submit to App Store:
  ```bash
  eas submit --platform ios --latest
  ```
- [ ] Or manually upload IPA via Transporter
- [ ] Complete App Store Connect listing
- [ ] Add "What's New" text
- [ ] Answer review questionnaire
- [ ] Submit for review
- [ ] Wait for review (24-48 hours typically)

### Android Submission
- [ ] Submit to Play Store:
  ```bash
  eas submit --platform android --latest
  ```
- [ ] Or manually upload AAB in Play Console
- [ ] Complete Play Console listing
- [ ] Add release notes
- [ ] Submit for review
- [ ] Wait for review (1-7 days typically)

## Phase 7: Post-Launch

- [ ] Monitor review status via email
- [ ] Respond to any review questions promptly
- [ ] Once approved, verify app is live in stores
- [ ] Test downloading from actual stores
- [ ] Set up app analytics (optional)
- [ ] Plan for future updates

## Quick Commands Reference

```bash
# Login
eas login

# Initialize project
eas init

# Build both platforms (production)
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

# Publish OTA update (for minor changes)
eas update --branch production --message "Bug fixes"
```

## Estimated Timeline

| Task | Time |
|------|------|
| Account setup | 1-3 days (verification wait) |
| Project configuration | 1-2 hours |
| Asset preparation | 2-4 hours |
| Store listing completion | 2-3 hours |
| Build & test | 1-2 hours |
| iOS review | 1-2 days |
| Android review | 1-7 days |
| **Total** | **3-10 days** |

## Cost Summary

| Item | Cost | Frequency |
|------|------|-----------|
| Apple Developer | $99 | Annual |
| Google Play Developer | $25 | One-time |
| EAS Build (Free tier) | $0 | 30 builds/month |
| EAS Build (Production) | $29 | Monthly (unlimited) |

## Troubleshooting

### Build Fails
```bash
# Clear cache and retry
eas build --platform [ios|android] --clear-cache
```

### Credentials Issues
```bash
# Reset credentials
eas credentials
# Select platform and remove/regenerate
```

### Can't Submit
- Verify `eas.json` has correct credentials
- Check service account has proper permissions (Android)
- Verify API key is valid (iOS)

## Support

- Expo Docs: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction/
- App Store Connect: https://developer.apple.com/support/
- Play Console: https://support.google.com/googleplay/android-developer/

## Notes

- Keep your API keys and service account JSON secure
- Never commit sensitive files to git
- Test thoroughly before production submission
- Reviews can be rejected - be prepared to make changes
- Plan for 1-2 weeks for first submission
- Updates are faster (usually 24-48 hours)

---

**Ready to deploy?** Start with Phase 1 and work through each section systematically.
