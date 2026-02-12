# AutoPilot Testing Guide

## Overview

This guide explains how to test the AutoPilot feature on a real device.

## Prerequisites

1. **iPhone with Rewardly installed** (iOS 13+)
2. **Location Services enabled**
3. **Notification permission granted**
4. **At least 1 card in your Rewardly portfolio**

## Quick Test (Simulator - Notifications Only)

### 1. Test Notification System

1. Open the app
2. Go to **AutoPilot** tab
3. Scroll to bottom
4. Tap **"Send Test Notification"** (dev mode only)
5. You should receive a notification with card recommendation

### 2. Verify Permission Flow

1. Fresh install the app (or clear data)
2. Go to AutoPilot tab
3. Enable AutoPilot
4. Verify location permission prompt appears
5. Verify notification permission prompt appears
6. Verify status shows "Monitoring X stores"

## Real-World Test (Physical Device)

### Setup

1. **Add cards to your portfolio:**
   - Go to "My Cards" tab
   - Add at least 2 cards with different category rewards
   - Example: Amex Gold (5% groceries) + basic Visa (1% everything)

2. **Enable AutoPilot:**
   - Go to AutoPilot tab
   - Toggle ON
   - Grant both location and notification permissions
   - Choose "Always Allow" for location (recommended)

3. **Add test stores:**
   - In AutoPilot tab, tap "Add Store"
   - Add **Costco** (or nearest grocery store)
   - Add **Starbucks** (or nearest coffee shop)

### Test Scenarios

#### Scenario 1: Grocery Store Visit

**Location:** Costco (or any Loblaws, Walmart, Metro)

**Steps:**
1. Ensure AutoPilot is enabled with Costco pinned
2. Drive/walk to Costco
3. When you enter the parking lot (within ~150m of store coordinates)
4. You should receive notification:
   ```
   🎯 Best Card for Costco
   Use [Your Best Grocery Card] for X% back (vs Y% on [Other Card])
   ```

**Expected Result:**
- Notification appears within 1-2 minutes of entering geofence
- Correct card is recommended based on your portfolio
- Tapping notification opens app

#### Scenario 2: Coffee Shop Visit

**Location:** Starbucks (or Tim Hortons)

**Steps:**
1. Ensure AutoPilot is enabled with Starbucks pinned
2. Walk to Starbucks
3. When you enter (~150m radius)
4. You should receive notification for dining category

**Expected Result:**
- Notification recommends best dining/coffee card
- If you have a dining rewards card, it should be recommended

#### Scenario 3: No Notification (Cooldown)

**Steps:**
1. Visit the same store twice within 1 hour
2. First visit: Should get notification
3. Second visit: Should NOT get notification (cooldown active)

**Expected Result:**
- Cooldown prevents notification spam
- After 1 hour, notifications resume

### Troubleshooting

#### Notification not appearing?

1. **Check permissions:**
   - iOS Settings > Rewardly > Location: "Always"
   - iOS Settings > Rewardly > Notifications: Enabled

2. **Check AutoPilot is enabled:**
   - AutoPilot tab shows toggle ON
   - Status shows "Monitoring X stores"

3. **Verify store is pinned:**
   - Store appears in "Monitored Stores" list
   - Store toggle is ON

4. **Check distance:**
   - Default geofence radius is 150m
   - You need to be within ~150m of the store coordinates
   - Parking lots usually work; being across the street might not

#### Wrong card recommended?

1. **Check your portfolio:**
   - The recommended card is the best one YOU own
   - If you don't have a high-reward card for that category, it picks your best fallback

2. **Category matching:**
   - Costco = Groceries category
   - Starbucks = Dining category
   - Gas stations = Gas category

#### Battery concerns?

- AutoPilot uses iOS/Android native geofencing
- Typical impact: 1-2% extra battery per day
- Much more efficient than GPS tracking

## Test Locations (Toronto Area)

Pre-loaded merchant coordinates for testing:

| Merchant | Category | Address |
|----------|----------|---------|
| Costco Scarborough | Groceries | 1411 Warden Ave |
| Costco Markham | Groceries | 6555 Kennedy Rd |
| Loblaws Queens Quay | Groceries | 17 Queens Quay W |
| Walmart North York | Groceries | 6464 Yonge St |
| Starbucks Union Station | Dining | 65 Front St W |
| Tim Hortons Downtown | Dining | 123 Queen St W |
| Shoppers Drug Mart | Drugstore | 33 Charles St E |

## Reporting Issues

If AutoPilot doesn't work as expected:

1. Note the exact location (address or coordinates)
2. Screenshot your AutoPilot settings
3. Note the time and date
4. Check if notification appeared late (sometimes 2-3 min delay)
5. Report to dev team with details

## Success Criteria

✅ AutoPilot is considered working if:

1. User can enable/disable AutoPilot
2. User can add/remove monitored stores
3. Notifications fire when entering monitored stores
4. Correct card is recommended for each category
5. Cooldown prevents duplicate notifications
6. Privacy dashboard shows accurate info
7. Feature works in background (app closed)
