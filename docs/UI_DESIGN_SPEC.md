# Rewards Optimizer UI Design Specification

## Overview
Single-page calculator interface with a clean, vertical flow for finding the best credit card rewards.

---

## Layout Structure

### 1. Screen Container
- **Background**: Light gray (`#F5F5F5`)
- **Layout**: Vertical scroll view with padding (16px horizontal, 20px vertical)
- **SafeArea**: Respects device safe areas (notch, home indicator)

---

## Component Breakdown (Top to Bottom)

### 2. Header Section
**Position**: Fixed at top

```
┌─────────────────────────────────────┐
│  Find Best Card                     │
│  Calculate rewards for your purchase│
└─────────────────────────────────────┘
```

- **Title**: "Find Best Card"
  - Font: Bold, 28px
  - Color: Dark gray (`#1F2937`)

- **Subtitle**: "Calculate rewards for your purchase"
  - Font: Regular, 14px
  - Color: Medium gray (`#6B7280`)
  - Margin-top: 4px

---

### 3. Store Selector Card
**Spacing**: 24px margin-top from header

```
┌─────────────────────────────────────┐
│ 🏪 Select Store or Merchant         │
│ ┌─────────────────────────────────┐ │
│ │ 🔍 Search stores...             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Popular Stores - Horizontal Scroll]│
│ [Walmart] [Costco] [Amazon]...      │
└─────────────────────────────────────┘
```

**Card Styling**:
- Background: White
- Border-radius: 12px
- Shadow: Subtle (`0px 2px 4px rgba(0,0,0,0.1)`)
- Padding: 16px

**Search Input**:
- Height: 48px
- Background: Light gray (`#F3F4F6`)
- Border: 1px solid `#E5E7EB`
- Border-radius: 8px
- Placeholder: "Search stores..." in gray (`#9CA3AF`)
- Icon: Magnifying glass (left, 16px)
- Padding: 12px 12px 12px 40px

**Popular Stores (Horizontal Chips)**:
- Margin-top: 12px from search
- Chip styling:
  - Background: `#EEF2FF` (light blue)
  - Padding: 8px 16px
  - Border-radius: 20px (pill shape)
  - Font: 14px, medium weight
  - Color: `#4F46E5` (indigo)
  - Margin-right: 8px between chips

---

### 4. Category Picker Card
**Spacing**: 16px margin-top from store selector

```
┌─────────────────────────────────────┐
│ 📂 Category (from store)            │
│ ┌───────┬───────┬───────┬───────┐  │
│ │ 🛒    │ 🍽️    │ ⛽    │ ✈️    │  │
│ │Grocery│Dining │  Gas  │Travel │  │
│ └───────┴───────┴───────┴───────┘  │
│ ┌───────┬───────┬───────┬───────┐  │
│ │ 🛍️    │ 🎬    │ 💊    │ 🔧    │  │
│ │Online │Enter  │Pharma │  Home │  │
│ └───────┴───────┴───────┴───────┘  │
└─────────────────────────────────────┘
```

**Card Styling**: Same as Store Selector

**Label**:
- "Category (from store)" when store selected
- "Select Category" when no store selected
- Font: 14px, medium weight
- Color: `#6B7280`

**Category Grid**:
- Layout: 4 columns, 2 rows
- Gap: 8px between items
- Margin-top: 12px from label

**Category Item** (Unselected):
- Background: White
- Border: 1px solid `#E5E7EB`
- Border-radius: 8px
- Padding: 12px
- Layout: Vertical (icon + label centered)
- Min-height: 72px

**Category Item** (Selected):
- Background: `#4F46E5` (indigo)
- Border: 1px solid `#4F46E5`
- Icon & Text color: White

**Category Icon**:
- Size: 24px
- Margin-bottom: 4px

**Category Label**:
- Font: 12px, medium weight
- Text-align: center

---

### 5. Amount Input Card
**Spacing**: 16px margin-top from category picker

```
┌─────────────────────────────────────┐
│ 💵 Purchase Amount                  │
│ ┌─────────────────────────────────┐ │
│ │ $  ___________                  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Card Styling**: Same as above

**Label**: "Purchase Amount"
- Font: 14px, medium weight
- Color: `#6B7280`
- Margin-bottom: 12px

**Input Field**:
- Height: 56px
- Background: `#F9FAFB`
- Border: 2px solid `#E5E7EB`
- Border-radius: 8px
- Font: 24px, semi-bold
- Color: `#1F2937`
- Placeholder: "$0.00" in light gray
- Dollar sign prefix (non-editable, left side)
- Padding: 12px 16px 12px 48px

**Focus State**:
- Border: 2px solid `#4F46E5`
- Background: White

**Error State** (if invalid):
- Border: 2px solid `#EF4444` (red)
- Error text below: "Please enter a valid amount"
  - Font: 12px
  - Color: `#EF4444`

---

### 6. Results Section
**Spacing**: 24px margin-top from amount input

**Header**:
```
┌─────────────────────────────────────┐
│ Rewards Comparison                  │
│ 3 cards in your portfolio           │
└─────────────────────────────────────┘
```

- Title: "Rewards Comparison"
  - Font: 20px, bold
  - Color: `#1F2937`

- Subtitle: "X cards in your portfolio"
  - Font: 14px, regular
  - Color: `#6B7280`
  - Margin-top: 4px
  - Margin-bottom: 16px

---

### 7. Card Result Item (Best Card - First)
**Spacing**: First card has no top margin, subsequent cards have 12px margin-top

```
┌─────────────────────────────────────┐
│ American Express Cobalt    [BEST]   │
│ American Express Canada              │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Original:    $100.00            │ │
│ │ 💵 Reward:   500 pts = $10.50   │ │
│ │ ═════════════════════════════   │ │
│ │ Effective:   $89.50             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Annual fee: $156 • Base rate       │
└─────────────────────────────────────┘
```

**Card Container**:
- Background: White
- Border: 2px solid `#E5E7EB`
- Border-radius: 12px
- Padding: 16px
- Shadow: `0px 2px 8px rgba(0,0,0,0.08)`

**Best Card Indicator**:
- Border: 2px solid `#10B981` (green) instead of gray
- Glow: `0px 0px 0px 3px rgba(16,185,129,0.1)`

**Header Row**:
- Layout: Horizontal, space-between
- Margin-bottom: 12px

**Card Name**:
- Font: 16px, semi-bold
- Color: `#1F2937`

**"BEST" Badge** (only on top card):
- Background: `#10B981` (green)
- Color: White
- Padding: 4px 8px
- Border-radius: 4px
- Font: 10px, bold
- Letter-spacing: 0.5px

**Issuer Name**:
- Font: 14px, regular
- Color: `#6B7280`
- Margin-top: 2px

**Price Breakdown Box**:
- Background: `#F9FAFB`
- Border-radius: 8px
- Padding: 12px
- Margin-top: 12px

**Price Row** (Original, Reward, Effective):
- Layout: Horizontal, space-between
- Margin-bottom: 6px (except last)

**Label** (left side):
- Font: 14px, regular
- Color: `#6B7280`

**Value** (right side):
- Font: 14px, medium weight
- Color: `#1F2937`

**Reward Row** (middle):
- Icon: 💵 emoji (16px, left of label)
- Reward value color: `#10B981` (green)
- Font: 14px, semi-bold

**Separator** (between Reward and Effective):
- Border-top: 1px solid `#E5E7EB`
- Margin: 6px 0

**Effective Row** (bottom):
- Label font: 15px, bold
- Value font: 18px, bold
- Value color: `#4F46E5` (indigo)

**Footer**:
- Layout: Horizontal, space-between
- Margin-top: 12px
- Padding-top: 8px
- Border-top: 1px solid `#E5E7EB`

**Annual Fee**:
- Font: 12px, regular
- Color: `#9CA3AF`

**Base Rate Note** (if applicable):
- Font: 12px, italic
- Color: `#9CA3AF`

---

### 8. Card Result Item (Regular Cards)
Same styling as Best Card but:
- Border: 2px solid `#E5E7EB` (no green)
- No "BEST" badge
- Shadow: `0px 1px 3px rgba(0,0,0,0.05)` (lighter)

---

### 9. Empty States

#### No Cards in Portfolio
```
┌─────────────────────────────────────┐
│              💳                     │
│                                     │
│      No Cards in Portfolio          │
│  Add cards to your portfolio to     │
│        see rewards                  │
│                                     │
│   [Go to My Cards]                  │
└─────────────────────────────────────┘
```

**Container**:
- Padding: 60px 24px
- Text-align: center

**Icon**:
- Size: 48px
- Margin-bottom: 16px

**Title**:
- Font: 20px, semi-bold
- Color: `#1F2937`
- Margin-bottom: 8px

**Description**:
- Font: 15px, regular
- Color: `#6B7280`
- Max-width: 300px
- Line-height: 1.5

**Action Button** (if shown):
- Background: `#4F46E5`
- Color: White
- Padding: 12px 24px
- Border-radius: 8px
- Font: 14px, medium weight
- Margin-top: 24px

#### Get Started (No input yet)
```
┌─────────────────────────────────────┐
│              🔍                     │
│                                     │
│          Get Started                │
│  Select a store or category and     │
│  enter an amount to see rewards     │
└─────────────────────────────────────┘
```

Same styling as above, no button.

---

## Color Palette

**Primary Colors**:
- Primary: `#4F46E5` (Indigo)
- Success: `#10B981` (Green)
- Error: `#EF4444` (Red)
- Warning: `#F59E0B` (Amber)

**Neutral Colors**:
- Text Primary: `#1F2937`
- Text Secondary: `#6B7280`
- Text Tertiary: `#9CA3AF`
- Border Light: `#E5E7EB`
- Background Primary: `#FFFFFF`
- Background Secondary: `#F9FAFB`
- Background Tertiary: `#F3F4F6`
- Screen Background: `#F5F5F5`

---

## Typography

**Font Family**: System default (San Francisco on iOS, Roboto on Android)

**Scales**:
- H1: 28px, Bold
- H2: 20px, Bold
- H3: 16px, Semi-bold
- Body: 14px-15px, Regular
- Body Small: 12px, Regular
- Caption: 10px, Regular

**Line Heights**: 1.5x font size

---

## Spacing System
- XS: 4px
- SM: 8px
- MD: 12px
- LG: 16px
- XL: 20px
- 2XL: 24px
- 3XL: 32px

---

## Shadows

**Card Shadow** (default):
```css
box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
```

**Card Shadow** (best card):
```css
box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.08);
```

**Input Focus Shadow**:
```css
box-shadow: 0px 0px 0px 3px rgba(79, 70, 229, 0.1);
```

---

## Interaction States

**Buttons/Touchable**:
- Normal: Full opacity
- Pressed: 70% opacity
- Disabled: 40% opacity

**Transitions**: 200ms ease-in-out for all state changes

---

## Responsive Behavior

**Mobile (< 768px)**:
- Full width cards
- Category grid: 4 columns
- 16px screen padding

**Tablet (≥ 768px)**:
- Max width: 600px (centered)
- Category grid: 4 columns (larger items)
- 24px screen padding
