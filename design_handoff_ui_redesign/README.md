# Handoff: Rewardly UI Redesign

## Overview
This package contains design references for Rewardly's React Native / Expo app (`rewardly/`). It covers six core screens: Home (calculator), My Cards, Insights, Smart Wallet, Sage, and Settings. The designs are **high-fidelity HTML prototypes** — the task is to **recreate these designs in the existing React Native codebase** using the app's own theme system, components, and patterns. Do NOT copy HTML directly.

## About the design files
The files in `screens/` are HTML prototypes built using the Rewardly Design System. They are visual and behavioral references only. Implement each screen by editing the corresponding `.tsx` file listed below, using React Native primitives (`View`, `Text`, `TouchableOpacity`, `ScrollView`, etc.) and the existing theme from `src/theme/`.

## Fidelity
**High-fidelity.** Pixel-perfect mockups with final colors, typography, spacing, and interactions. Recreate the UI precisely using the app's existing `src/theme/*.ts` tokens and `src/components/*.tsx` primitives. Do not introduce new third-party libraries; use what is already in `package.json`.

---

## File mapping

| Design file | RN file to edit |
|---|---|
| `screens/HomeScreen.html` | `src/screens/HomeScreen.tsx` |
| `screens/MyCardsScreen.html` | `src/screens/MyCardsScreen.tsx` |
| `screens/InsightsScreen.html` | `src/screens/InsightsHomeScreen.tsx` |
| `screens/SmartWalletScreen.html` | `src/screens/AutoPilotScreen.tsx` |
| `screens/SageScreen.html` | `src/screens/SageScreen.tsx` |
| `screens/SettingsScreen.html` | `src/screens/SettingsScreen.tsx` |
| `screens/AuthScreen.html` | `src/screens/AuthScreen.tsx` |

---

## Design tokens (all in `src/theme/`)

These are already in the codebase. Use them — do not hardcode hex values.

```ts
// colors.ts
colors.primary.main       = '#1DDB82'  // brand green
colors.accent.main        = '#8B5CF6'  // purple (Sage / premium)
colors.background.primary = '#0A0E1F'  // app canvas
colors.background.secondary = '#0F1528' // card background
colors.background.elevated  = '#171D30'
colors.text.primary       = '#F8FAFC'
colors.text.secondary     = '#7C8BA1'
colors.border.light       = '#212B3E'

// spacing.ts
spacing.screenPadding = 16
spacing.cardPadding   = 16
spacing.sectionGap    = 24
spacing.itemGap       = 12

// borders.ts
borderRadius.card   = 12
borderRadius.button = 12
borderRadius.input  = 10
borderRadius.badge  = 10
borderRadius.chip   = 20

// typography.ts — key sizes
fontSize['3xl'] = 28  // h1
fontSize['2xl'] = 24  // h2
fontSize.xl     = 20  // h3
fontSize.lg     = 17  // body large / buttons
fontSize.md     = 15  // body default
fontSize.sm     = 13  // body small
fontSize.xs     = 11  // caption / overline
```

---

## Screen specs

### 1. HomeScreen — Rewards calculator
**File:** `src/screens/HomeScreen.tsx`
**Status:** Exists. Clean up + refine layout.

**Layout (top → bottom, all inside `ScrollView` with `paddingHorizontal: 16`):**

1. **Header** — centered, `marginBottom: 24`
   - Title: "Rewardly" using `GradientText` component (already exists), `fontSize: 24`, `fontWeight: '700'`, `letterSpacing: -0.5`
   - Subtitle: "Find the best card for every purchase" — `fontSize: 13`, `color: colors.text.secondary`, `textAlign: 'center'`

2. **Section label** — "CATEGORY" overline: `fontSize: 11`, `fontWeight: '600'`, `color: colors.text.secondary`, `textTransform: 'uppercase'`, `letterSpacing: 0.5`, `marginBottom: 8`

3. **Category grid** — `CategoryGrid` component (already exists). Tile `minHeight: 60`, 3-column grid, `gap: 6`. Selected tile: `backgroundColor: colors.primary.bg20`, `borderColor: colors.primary.main`, `borderWidth: 1.5`, with green glow shadow (`shadowColor: colors.primary.main, shadowOpacity: 0.2, shadowRadius: 4`).

4. **Section label** — "PURCHASE AMOUNT"

5. **Amount input** — `AmountInput` (already exists). Left icon: `DollarSign` from lucide.

6. **Divider** — `height: 1`, `backgroundColor: colors.border.light`, `marginVertical: 14`

7. **Results overline** — "BEST CARDS FOR THIS PURCHASE"

8. **Results list** — `RewardsDisplay` / `CardRewardItem` list (already exists).

**Key fix:** Category tile selected state must show a `boxShadow`-equivalent (`elevation: 3`, `shadowColor: colors.primary.main`, `shadowOpacity: 0.2`). Already partially implemented — verify it renders.

---

### 2. MyCardsScreen — Portfolio view
**File:** `src/screens/MyCardsScreen.tsx`
**Status:** Exists. Add Rewards IQ card at the top.

**Layout:**

1. **Header row** — `flexDirection: 'row'`, `justifyContent: 'space-between'`, `alignItems: 'center'`
   - Title: "My Cards", `fontSize: 26`, `fontWeight: '700'`, `letterSpacing: -0.5`
   - "Add" button: `Button` variant `primary`, size `small`, leftIcon `<Plus />`

2. **Subtitle:** "Your portfolio · N cards", `fontSize: 13`, `color: colors.text.secondary`

3. **Rewards IQ card** — `backgroundColor: colors.background.secondary`, `borderRadius: 12`, `padding: 16`, `marginBottom: 16`
   - Overline: "REWARDS IQ" (11px caps)
   - Score row: `flexDirection: 'row'`, `alignItems: 'baseline'`, `gap: 6`
     - Number: `fontSize: 32`, `fontWeight: '800'`, `color: colors.primary.main`, mono font
     - Label: `"/ 100 · well optimized"`, `fontSize: 13`, `color: colors.text.secondary`, `whiteSpace: nowrap`
   - Progress bar: `height: 6`, `borderRadius: 99`, background `colors.background.tertiary`, fill `colors.primary.main`, width `88%`

4. **Card list** — existing `CardVisual` components centered, `gap: 14`, size `medium` (280px wide).

---

### 3. InsightsScreen — Rewards performance
**File:** `src/screens/InsightsHomeScreen.tsx`
**Status:** Exists. Redesign with the layout below.

**Layout:**

1. **Title:** "Insights", `fontSize: 26`, `fontWeight: '700'`
2. **Subtitle:** "Your rewards performance this month", `fontSize: 13`, `color: colors.text.secondary`

3. **Rewards IQ card** — elevated card (`backgroundColor: colors.background.secondary`, shadow)
   - Overline: "REWARDS IQ SCORE"
   - Score + badge row: `flexDirection: 'row'`, `alignItems: 'center'`, `justifyContent: 'space-between'`
     - Left: big number `88` (32/800, green, mono) + `/ 100` (13px secondary)
     - Right: `Badge` variant `success` soft, label "Well optimized"
   - Green progress bar (6px height, 88% fill, `borderRadius: 99`)
   - Footer text: "+4 points from last month", `fontSize: 12`, `color: colors.text.tertiary`

4. **Overline:** "MISSED REWARDS THIS MONTH"

5. **Missed reward cards** — for each item: outlined card with `padding: 16`
   - Row: store name (15/600, primary) + amount in red (`fontSize: 16`, `fontWeight: '700'`, `color: colors.error.main`, mono font, prefix "−")
   - Sub-row: "Use [Card name in green] · [rate comparison note]", `fontSize: 12`, `color: colors.text.secondary`

6. **Portfolio optimizer card** — elevated card, row layout: purple circle icon (`sparkles`-like, `#8B5CF6`), title "Portfolio Optimizer" (14/600), description "Adding a dining card could earn you $240 more/yr" (12px secondary), `ChevronRight` icon.

---

### 4. SmartWalletScreen — Location-based card picker
**File:** `src/screens/AutoPilotScreen.tsx`
**Status:** Exists (AutoPilot). Redesign the header and store list.

**Layout:**

1. **Header row:** `flexDirection: 'row'`, `alignItems: 'center'`, `gap: 10`
   - `<Navigation />` Lucide icon, 22px, `colors.primary.main`
   - Title: "Smart Wallet", `fontSize: 26`, `fontWeight: '700'`
2. **Subtitle:** "Best card at every store near you"

3. **Location banner** — outlined card, `borderColor: colors.primary.main`, padding 12
   - Row: `<MapPin />` in green circle (32×32, `colors.primary.bg10`), "Location active · [City, Province]", `Badge` soft success "Live"

4. **Overline:** "NEARBY STORES"

5. **Store rows** — outlined cards, `marginBottom: 10`, `padding: 16`
   - Store name (15/600, primary, one line, truncate) + rate (16/700, colored by reward type, mono)
   - Sub-row: distance · category, `fontSize: 12`, `color: colors.text.tertiary`
   - Third row: "Tap with [Card name in green]", `fontSize: 12`
   - Rate colors: cashback = `colors.primary.main`, points = `colors.warning.main`, miles = `colors.info.main`

---

### 5. SageScreen — AI assistant chat
**File:** `src/screens/SageScreen.tsx`
**Status:** Exists. Clean up layout so input stays pinned at bottom.

**Critical layout fix** — use this structure:
```tsx
<View style={{ flex: 1, backgroundColor: colors.background.primary }}>
  {/* Header — fixed */}
  <View style={{ paddingTop: insets.top + 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border.light, paddingHorizontal: 16 }}>
    {/* Purple sparkles avatar (36×36, colors.accent.bg20) + "Sage" title + "● Online" subtitle */}
  </View>

  {/* Message list — scrollable */}
  <FlatList inverted ... />

  {/* Input — pinned above keyboard */}
  <KeyboardAvoidingView behavior="padding">
    <View style={{ flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: colors.border.light }}>
      <TextInput ... />
      <TouchableOpacity>{/* send icon */}</TouchableOpacity>
    </View>
  </KeyboardAvoidingView>
</View>
```

**Chat bubbles:**
- User: `backgroundColor: colors.primary.main`, `color: colors.primary.contrast`, `alignSelf: 'flex-end'`, `borderBottomRightRadius: 4`
- Sage: `backgroundColor: colors.background.secondary`, `color: colors.text.primary`, `borderWidth: 1`, `borderColor: colors.border.light`, `alignSelf: 'flex-start'`, `borderBottomLeftRadius: 4`
- All bubbles: `padding: '9 13'`, `borderRadius: 16`, `fontSize: 14`, `lineHeight: 1.45×`

---

### 6. SettingsScreen — Account + preferences
**File:** `src/screens/SettingsScreen.tsx`
**Status:** Exists. Redesign with section-row pattern.

**Layout:**

1. **Account card** — elevated, `padding: 16`, `marginBottom: 4`
   - Green avatar circle (48×48, `colors.primary.bg20`, `<User />` icon)
   - Name (16/700), email (13px secondary, truncate)
   - `Badge` variant `secondary` soft "Pro" (or current tier)

2. **Section + rows pattern:**
   - Section overline (11px caps, `colors.text.secondary`, `marginTop: 24, marginBottom: 8`)
   - Each row: `flexDirection: 'row'`, `alignItems: 'center'`, `gap: 12`, `paddingVertical: 13`, `borderBottomWidth: 1`, `borderBottomColor: colors.border.light`
     - Icon in 32×32 rounded-8 container (`colors.background.tertiary`)
     - Label (15/500, primary)
     - Value text (13px, secondary)
     - `<ChevronRight />` icon

3. **Sections and rows:**
   - **ACCOUNT:** My portfolio (value: "N cards") · Notifications (value: On/Off) · Country (value: "Canada 🇨🇦") · Language (value: current locale)
   - **SUBSCRIPTION:** inline card showing current plan, features list, "Upgrade" button
   - **DATA & PRIVACY:** Privacy policy · Export my data · Delete account (danger: red text, no chevron)

4. **Footer** — centered, 12px, `colors.text.tertiary`: "Made for the Canadian rewards community"

---

### 7. AuthScreen — Sign in / Sign up
**File:** `src/screens/AuthScreen.tsx`
**Status:** Exists. Only minor tweaks needed.

**Fixes:**
- Ensure owl logo (`assets/owl-logo.png`) renders at 80×80, centered
- Title "Rewardly" at `fontSize: 28`, `fontWeight: '800'`, `letterSpacing: -0.5`
- Tagline "Find the best card for every purchase." at `fontSize: 14`, `color: colors.text.secondary`
- "Made for the Canadian rewards community" footer with 🇨🇦 flag, `fontSize: 12`, `color: colors.text.tertiary`

---

## Interactions & behavior

| Interaction | Behavior |
|---|---|
| Button press | Spring scale to `0.95` via `Animated.spring` (already in Button.tsx) |
| Category tile tap | Instant color + border switch; `Haptics.impactAsync(Light)` |
| Card tap | Navigate to `CardDetail` modal |
| Sage send | Append to message list; FlatList scrolls to bottom |
| Settings row tap | Navigate to sub-screen or show action sheet |
| Pull-to-refresh | Existing `refreshControl` pattern (HomeScreen already has it) |

## Animations

- Mount: `Animated.parallel([fadeIn 0→1 over 600ms, translateY 20→0])`, `easing: Easing.out(Easing.cubic)`
- Stagger: `50ms` per item in lists
- Tab icon active: spring scale `1.0 → 1.1`, `damping: 15, stiffness: 150`
- Press: spring scale `1.0 → 0.95`, `damping: 15, stiffness: 400`

---

## Assets

| Asset | Location | Usage |
|---|---|---|
| Owl logo | `assets/owl-logo.png` | AuthScreen header, nav lockup |
| Lucide icons | `lucide-react-native` (already installed) | All icons throughout. Key: `Home`, `BarChart3`, `Sparkles`, `Navigation`, `CreditCard`, `Settings`, `ChevronRight`, `Plus`, `TrendingUp`, `DollarSign`, `MapPin`, `Shield`, `Bell`, `User`, `Trash2` |

---

## What NOT to change

- `src/theme/*.ts` — already correct, do not touch
- `src/navigation/AppNavigator.tsx` — tab bar already correct
- `src/components/Button.tsx`, `Card.tsx`, `Badge.tsx`, `Input.tsx` — already implemented correctly
- Any screen not listed above

---

## Implementation order (suggested)

1. `SettingsScreen.tsx` — simplest, pure layout
2. `InsightsHomeScreen.tsx` — new layout on existing data
3. `AutoPilotScreen.tsx` (Smart Wallet) — location UI
4. `MyCardsScreen.tsx` — add IQ card, tweak layout
5. `HomeScreen.tsx` — minor cleanup
6. `SageScreen.tsx` — layout fix for pinned input
7. `AuthScreen.tsx` — minor tweaks only
