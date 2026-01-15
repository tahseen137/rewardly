# Deployment Scripts

Automated deployment scripts for Rewardly app.

## Available Scripts

### deploy.bat (Windows)
Interactive deployment script for Windows users.

**Usage:**
```cmd
cd fintech-idea\rewards-optimizer\scripts
deploy.bat
```

### deploy.sh (Mac/Linux)
Interactive deployment script for Mac and Linux users.

**Usage:**
```bash
cd fintech-idea/rewards-optimizer/scripts
chmod +x deploy.sh
./deploy.sh
```

## Features

Both scripts provide:
- ✓ Prerequisites checking (Node.js, npm, EAS CLI)
- ✓ EAS login verification
- ✓ Interactive menu for common tasks
- ✓ Build for iOS/Android/Both
- ✓ Submit to App Store/Play Store
- ✓ Check build status
- ✓ Full deployment workflow

## Menu Options

1. **Build iOS (Production)** - Build production iOS app
2. **Build Android (Production)** - Build production Android app
3. **Build Both Platforms (Production)** - Build both platforms
4. **Build iOS (Preview/Testing)** - Build iOS for testing
5. **Build Android (Preview/Testing)** - Build Android for testing
6. **Submit iOS to App Store** - Submit latest iOS build
7. **Submit Android to Play Store** - Submit latest Android build
8. **Submit Both Platforms** - Submit both platforms
9. **Check Build Status** - View build queue and status
10. **Run All** - Complete build and submit workflow

## Prerequisites

Before running these scripts, ensure:

1. **Node.js and npm** are installed
2. **EAS CLI** is installed:
   ```bash
   npm install -g eas-cli
   ```
3. **Logged in to EAS**:
   ```bash
   eas login
   ```
4. **Project is initialized**:
   ```bash
   eas init
   ```

## First Time Setup

1. Complete the account setup in `DEPLOYMENT_CHECKLIST.md`
2. Configure `app.json` with your bundle IDs
3. Configure `eas.json` with your credentials
4. Run the deployment script
5. Follow the interactive prompts

## Manual Commands

If you prefer manual commands over the script:

```bash
# Build commands
eas build --platform ios --profile production
eas build --platform android --profile production
eas build --platform all --profile production

# Submit commands
eas submit --platform ios --latest
eas submit --platform android --latest

# Status commands
eas build:list
eas build:view [build-id]
```

## Troubleshooting

### Script won't run (Mac/Linux)
```bash
chmod +x deploy.sh
```

### EAS CLI not found
```bash
npm install -g eas-cli
```

### Not logged in
```bash
eas login
```

### Build fails
```bash
eas build --platform [ios|android] --clear-cache
```

## Support

For detailed deployment instructions, see:
- `APP_STORE_DEPLOYMENT.md` - Complete deployment guide
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist
- `DEPLOYMENT.md` - Original deployment documentation
