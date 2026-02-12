# AutoPilot Privacy Guide

## What is AutoPilot?

AutoPilot is Rewardly's proactive credit card optimizer. It alerts you with the best credit card to use when you arrive at stores you choose to monitor.

## Privacy-First Design

AutoPilot was built with privacy as a core principle. Here's exactly what we track and why:

### What We Track

| Data | Where Stored | Purpose |
|------|--------------|---------|
| Stores you pin | On your device | To know which locations to monitor |
| Your card portfolio | On your device | To calculate best card recommendations |
| Geofence triggers | On your device | To send notifications when you arrive |

### What We DON'T Track

❌ **No continuous location tracking** — We only check location when you enter a geofence

❌ **No location history** — We don't store where you've been

❌ **No raw coordinates sent to servers** — All location processing happens on your device

❌ **No data sold to third parties** — Ever

## How It Works

### Geofencing (Not GPS Tracking)

AutoPilot uses **geofencing**, not continuous GPS tracking. Here's the difference:

**GPS Tracking (We DON'T do this):**
- Constantly monitors your location
- Stores location history
- High battery usage
- Privacy invasive

**Geofencing (What we DO):**
- Creates invisible boundaries around stores YOU choose
- Only activates when you cross a boundary
- No location history stored
- Low battery impact
- You control which stores are monitored

### On-Device Processing

When you enter a monitored store:

1. Your device detects the geofence entry (on-device)
2. Rewardly looks up your card portfolio (on-device)
3. Calculates the best card for that store category (on-device)
4. Sends you a notification (on-device)

**No data leaves your phone during this process.**

## Your Controls

### Enable/Disable Anytime

You can turn AutoPilot on or off instantly:

1. Open Rewardly
2. Go to AutoPilot tab
3. Toggle the main switch

When disabled, all geofence monitoring stops immediately.

### Manage Individual Stores

You can:
- Add stores you want to monitor
- Remove stores you no longer want to monitor
- Toggle individual stores on/off

### View What's Tracked

The AutoPilot screen shows you exactly:
- Which stores are being monitored
- When each was last triggered (if ever)
- Total number of active geofences

## Permissions Explained

### Location Permission

**Why we need it:** To detect when you enter monitored stores.

**What we request:**
- "When In Use" — For foreground detection
- "Always" — For background geofencing (optional but recommended)

**What happens if you deny:**
- AutoPilot won't work, but all other Rewardly features still function
- You can still get card recommendations manually

### Notification Permission

**Why we need it:** To alert you with card recommendations.

**What we request:** Standard notification permission.

**What happens if you deny:**
- AutoPilot can still run, but you won't receive alerts
- You can check recommendations manually in the app

## Data Retention

| Data | Retention |
|------|-----------|
| Pinned stores | Until you remove them |
| Notification history | 7 days, then auto-deleted |
| Analytics (opt-in only) | Anonymized, 30 days |

## Security

- All data stored on-device is encrypted using iOS/Android secure storage
- No data transmitted to external servers for AutoPilot functionality
- No third-party location SDKs — we use native Expo Location APIs only

## Frequently Asked Questions

### Does AutoPilot drain my battery?

No. Geofencing is extremely battery-efficient. It uses hardware-level detection built into iOS and Android, which is optimized for low power consumption. You might see 1-2% additional battery usage per day.

### Can I use AutoPilot without background location?

Yes, but with limitations. Without background location, AutoPilot only works when the app is open. With background location, you get alerts even when your phone is in your pocket.

### Is my location shared with anyone?

No. Your location never leaves your device. Not with us, not with advertisers, not with anyone.

### Can I see a history of my locations?

No, because we don't store it. We only know if you entered a geofence — we don't track where you went before or after.

### What if I uninstall the app?

All AutoPilot data is deleted from your device. There's nothing on our servers to delete.

## Contact

Questions about privacy? Email us at privacy@rewardly.app

---

*Last updated: February 2026*
*Version: AutoPilot v1.0*
