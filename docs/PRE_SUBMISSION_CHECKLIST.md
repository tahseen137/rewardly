# Pre-Submission Checklist

Print this checklist and check off items as you complete them.

## 📱 App Information

- [ ] App Name: **Rewardly**
- [ ] Bundle ID (iOS): `com.yourcompany.rewardly`
- [ ] Package Name (Android): `com.yourcompany.rewardly`
- [ ] Version: `1.0.0`
- [ ] Build Number (iOS): `1`
- [ ] Version Code (Android): `1`

## 👤 Account Setup

### Apple Developer Account
- [ ] Account created at https://developer.apple.com
- [ ] $99 annual fee paid
- [ ] Account verified (24-48 hours)
- [ ] Apple ID email: ___________________________
- [ ] Team ID: ___________________________

### Google Play Developer Account
- [ ] Account created at https://play.google.com/console
- [ ] $25 one-time fee paid
- [ ] Account verified
- [ ] Developer email: ___________________________

### Expo Account
- [ ] Account created at https://expo.dev
- [ ] Username: ___________________________
- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] Logged in: `eas login`

## 🔧 Project Configuration

### app.json
- [ ] `owner` set to your Expo username
- [ ] `ios.bundleIdentifier` configured
- [ ] `android.package` configured
- [ ] `version` set correctly
- [ ] `ios.buildNumber` set to "1"
- [ ] `android.versionCode` set to 1
- [ ] `extra.eas.projectId` populated (after `eas init`)

### eas.json
- [ ] iOS credentials configured
  - [ ] `appleId` email set
  - [ ] `ascAppId` set (from App Store Connect)
- [ ] Android credentials configured
  - [ ] `serviceAccountKeyPath` points to JSON file
  - [ ] `google-services.json` file exists
  - [ ] `google-services.json` added to `.gitignore`

### Environment
- [ ] `.env` file configured (if needed)
- [ ] `.env` added to `.gitignore`
- [ ] All API keys secured
- [ ] Supabase credentials configured

## 🎨 Assets Prepared

### App Icons
- [ ] iOS icon: 1024x1024 PNG (no transparency)
  - File: `assets/icon.png`
- [ ] Android adaptive icon: 1024x1024 PNG
  - File: `assets/adaptive-icon.png`
- [ ] Favicon: 48x48 PNG
  - File: `assets/favicon.png`

### Screenshots - iOS
- [ ] iPhone 6.5" (1290 x 2796): Minimum 3 screenshots
  - [ ] Screenshot 1: ___________________________
  - [ ] Screenshot 2: ___________________________
  - [ ] Screenshot 3: ___________________________
- [ ] iPhone 5.5" (1242 x 2208): Minimum 3 screenshots
  - [ ] Screenshot 1: ___________________________
  - [ ] Screenshot 2: ___________________________
  - [ ] Screenshot 3: ___________________________

### Screenshots - Android
- [ ] Phone (1080 x 1920 or higher): Minimum 2 screenshots
  - [ ] Screenshot 1: ___________________________
  - [ ] Screenshot 2: ___________________________
- [ ] Feature graphic: 1024 x 500 PNG
  - [ ] File: ___________________________

## 📝 Marketing Content

### App Description
- [ ] Short description written (80 chars for Android)
  - Text: ___________________________
- [ ] Full description written (4000 chars max)
  - [ ] Saved in: ___________________________
- [ ] Keywords prepared (100 chars for iOS)
  - Keywords: ___________________________

### URLs
- [ ] Privacy policy URL: ___________________________
- [ ] Support URL: ___________________________
- [ ] Marketing URL (optional): ___________________________

### Release Notes
- [ ] "What's New" text written
  - Text: ___________________________

## 🏪 Store Setup

### iOS - App Store Connect
- [ ] App created in App Store Connect
- [ ] App Store Connect App ID noted: ___________________________
- [ ] App Information completed
  - [ ] Name
  - [ ] Subtitle
  - [ ] Category: Finance
  - [ ] Content Rights
- [ ] Pricing and Availability set
  - [ ] Price: Free
  - [ ] Countries selected
- [ ] App Privacy completed
  - [ ] Privacy policy URL added
  - [ ] Privacy questionnaire completed
  - [ ] Data collection declared
- [ ] Screenshots uploaded
- [ ] Description added
- [ ] Keywords added
- [ ] Support URL added

### Android - Play Console
- [ ] App created in Play Console
- [ ] Store Listing completed
  - [ ] App name
  - [ ] Short description
  - [ ] Full description
  - [ ] App icon uploaded
  - [ ] Feature graphic uploaded
  - [ ] Screenshots uploaded
  - [ ] Category: Finance
- [ ] Store Settings configured
  - [ ] App category
  - [ ] Tags added
- [ ] App Content completed
  - [ ] Privacy policy URL
  - [ ] App access declared
  - [ ] Ads declaration
  - [ ] Content rating completed
  - [ ] Target audience selected
  - [ ] Data safety form completed
- [ ] Countries/regions selected

## 🔐 Credentials & Keys

### iOS
- [ ] App Store Connect API Key created
  - [ ] Key ID: ___________________________
  - [ ] Issuer ID: ___________________________
  - [ ] .p8 file downloaded and secured
  - [ ] .p8 file NOT committed to git

### Android
- [ ] Google Cloud Project created
- [ ] Google Play Android Developer API enabled
- [ ] Service account created
- [ ] Service account key downloaded (JSON)
- [ ] Service account granted Play Console access
- [ ] `google-services.json` saved in project root
- [ ] `google-services.json` added to `.gitignore`

## 🧪 Testing

### Local Testing
- [ ] App runs on iOS simulator
- [ ] App runs on Android emulator
- [ ] App runs on web browser
- [ ] All features tested
- [ ] No console errors
- [ ] No crashes

### Device Testing
- [ ] Tested on real iOS device
- [ ] Tested on real Android device
- [ ] Tested on different screen sizes
- [ ] Tested offline functionality
- [ ] Tested with real data

### Build Testing
- [ ] Preview build created and tested
  - [ ] iOS: `eas build --platform ios --profile preview`
  - [ ] Android: `eas build --platform android --profile preview`
- [ ] TestFlight build tested (iOS)
- [ ] Internal testing build tested (Android)

## 🚀 Build & Submit

### Production Builds
- [ ] Version numbers updated in `app.json`
- [ ] Production build started
  - [ ] iOS: `eas build --platform ios --profile production`
  - [ ] Android: `eas build --platform android --profile production`
- [ ] Builds completed successfully
- [ ] Build IDs noted:
  - iOS: ___________________________
  - Android: ___________________________

### Submission
- [ ] iOS submitted to App Store
  - [ ] Command: `eas submit --platform ios --latest`
  - [ ] Or manually via Transporter
  - [ ] Submission confirmed
- [ ] Android submitted to Play Store
  - [ ] Command: `eas submit --platform android --latest`
  - [ ] Or manually via Play Console
  - [ ] Submission confirmed

### Store Listing Final Check
- [ ] iOS listing reviewed and complete
- [ ] Android listing reviewed and complete
- [ ] All required fields filled
- [ ] All assets uploaded
- [ ] Privacy information complete

### Submit for Review
- [ ] iOS submitted for review
  - [ ] Export compliance answered
  - [ ] Content rights confirmed
  - [ ] Advertising identifier answered
  - [ ] Submission date: ___________________________
- [ ] Android submitted for review
  - [ ] All policies accepted
  - [ ] Submission date: ___________________________

## 📧 Post-Submission

- [ ] Confirmation emails received
  - [ ] iOS confirmation
  - [ ] Android confirmation
- [ ] Review status monitoring set up
- [ ] Team notified of submission
- [ ] Calendar reminder set for follow-up

## 📊 Review Timeline

| Platform | Submitted | Status | Live Date |
|----------|-----------|--------|-----------|
| iOS | _________ | ______ | _________ |
| Android | _________ | ______ | _________ |

## 🎯 Success Criteria

- [ ] Both apps submitted
- [ ] No build errors
- [ ] All store requirements met
- [ ] Testing completed
- [ ] Team informed
- [ ] Documentation updated

## 📞 Emergency Contacts

- Apple Developer Support: https://developer.apple.com/support/
- Google Play Support: https://support.google.com/googleplay/android-developer/
- Expo Support: https://expo.dev/support

## 📝 Notes

Use this space for any additional notes or issues encountered:

_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________

## ✅ Final Sign-Off

- [ ] All items above completed
- [ ] Ready for app store review
- [ ] Submitted by: ___________________________
- [ ] Date: ___________________________
- [ ] Signature: ___________________________

---

**Good luck with your submission! 🚀**

Keep this checklist for future updates - you'll need to go through similar steps for each version.
