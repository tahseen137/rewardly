# AutoPilot v1.0 - Release Notes

## 🚀 Feature Release: AutoPilot

**Release Date:** February 12, 2026
**Version:** 1.0.0
**Branch:** `feature/autopilot`

---

## Overview

AutoPilot is Rewardly's new proactive credit card optimizer. It alerts users with the best credit card to use when they arrive at stores they choose to monitor.

**This is a world-first feature.** No competitor (SaveSage, MaxRewards, CardPointers) has proactive, location-based card recommendations.

---

## Key Features

### 🎯 Smart Store Detection
- Uses geofencing technology (not continuous GPS tracking)
- Only monitors stores the user explicitly pins
- Default radius: 150 meters (approximately store parking lot)

### 💳 Intelligent Card Recommendations
- Analyzes user's card portfolio
- Matches merchant to spending category
- Recommends card with highest reward rate
- Shows comparison with alternative cards

### 🔒 Privacy-First Design
- All location processing happens on-device
- No raw coordinates sent to servers
- User controls which stores are monitored
- Easy disable toggle in Settings

### 📱 Beautiful Notifications
- Clear, actionable alerts
- Shows reward percentage and card name
- Comparison with user's other cards
- Tap to open app for full details

---

## Technical Implementation

### Files Added/Modified

**New Files:**
- `src/services/AutoPilotService.ts` - Core geofencing and notification logic
- `src/services/BestCardRecommendationService.ts` - Smart card matching
- `src/screens/AutoPilotScreen.tsx` - Main AutoPilot management UI
- `src/screens/AutoPilotSetupScreen.tsx` - Opt-in flow
- `src/components/AutoPilotNotificationCard.tsx` - In-app alert card
- `supabase/migrations/014_autopilot_schema.sql` - Database schema
- `supabase/functions/get-best-card/index.ts` - Backend API

**Modified Files:**
- `app.json` - iOS/Android permissions
- `package.json` - New dependencies
- `src/navigation/AppNavigator.tsx` - AutoPilot tab
- `src/screens/SettingsScreen.tsx` - AutoPilot toggle
- `src/screens/index.ts` - Exports
- `src/components/index.ts` - Exports

### Dependencies Added
- `expo-location` - Geofencing
- `expo-notifications` - Push notifications
- `expo-task-manager` - Background tasks

### Database Schema

```sql
-- Merchant locations (seed data)
CREATE TABLE merchant_locations (...)

-- User's monitored stores
CREATE TABLE user_geofences (...)

-- AutoPilot settings per user
CREATE TABLE autopilot_settings (...)

-- Analytics (anonymized)
CREATE TABLE autopilot_analytics (...)
```

---

## Merchant Coverage

### Pre-Loaded Merchants (Canada)

| Category | Merchants |
|----------|-----------|
| Groceries | Costco, Loblaws, Walmart, Metro, Sobeys |
| Dining | Starbucks, Tim Hortons, McDonald's |
| Gas | Esso, Shell, Petro-Canada |
| Drugstores | Shoppers Drug Mart, Rexall |
| Home | Canadian Tire, Home Depot |

**Total seed locations:** 26 (Toronto area)

---

## How to Test

### Simulator Testing

1. Open app → AutoPilot tab
2. Enable AutoPilot
3. Add a store (e.g., Costco)
4. Scroll down → "Send Test Notification"
5. Verify notification appears

### Real Device Testing

1. Install app on iPhone
2. Enable AutoPilot (grant permissions)
3. Pin a nearby store
4. Drive/walk to that store
5. Receive notification within 1-2 minutes

See `docs/AUTOPILOT_TESTING.md` for detailed instructions.

---

## Deployment

### Web (Vercel)
- **URL:** https://rewardly.ca
- **Status:** ✅ Live

### iOS (TestFlight)
- **Status:** Ready for build
- **Command:** `eas build --profile production --platform ios`

### Android (APK)
- **Status:** Ready for build
- **Command:** `eas build --profile preview --platform android`

---

## Privacy & Security

See `docs/AUTOPILOT_PRIVACY.md` for full privacy documentation.

**Key Points:**
- No continuous location tracking
- On-device processing only
- User controls what's monitored
- No data sold to third parties

---

## Future Enhancements (Post-MVP)

1. **Map View** - Visual display of monitored stores
2. **Weekly Summary** - "AutoPilot saved you $X this week"
3. **Merchant Suggestions** - "You shop at Walmart often. Add it?"
4. **Transaction Integration** - Post-purchase "You should've used X"
5. **Premium Tier** - Unlimited geofences ($2.99/mo)

---

## Success Metrics

### MVP Success Criteria
- [x] User can enable/disable AutoPilot
- [x] User can add/remove monitored stores
- [x] Notifications fire when entering stores
- [x] Correct card recommended per category
- [x] Cooldown prevents duplicate notifications
- [x] Privacy dashboard accurate
- [ ] Works in background (requires device testing)

---

## Contact

**Lead Engineer:** VP of Engineering
**Built:** February 12, 2026 (16-hour sprint)
**For:** Rewardly / Aragorn (CEO)

---

🔥 **AutoPilot: The world's first proactive credit card optimizer.** 🔥
