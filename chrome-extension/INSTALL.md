# Rewardly Chrome Extension — Installation Guide

## Load Unpacked (Development)

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer Mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select this folder: `Projects/rewardly/chrome-extension/`
5. The Rewardly icon will appear in your toolbar

## Features

- **Auto-detection**: Automatically identifies the merchant you're visiting and recommends the best card in your wallet
- **Best rate first**: Cards ranked by effective reward rate (cashback %, or points × valuation)
- **Wallet-aware**: Recommendations come from the cards you've added in the Rewardly app — no generic suggestions
- **Loyalty stacking tips**: Shows PC Optimum, Scene+, Aeroplan, Air Miles stacking opportunities where applicable
- **Upgrade hints**: Flags when a card not in your wallet would earn significantly more at this merchant
- **Notifications**: Opt-in push notifications when you land on a supported merchant site
- **Settings page**: Configure notification preferences and minimum reward-rate threshold

## Supported Merchants

The extension recognises 100+ Canadian merchant websites mapped to spending categories (groceries, gas, dining, travel, streaming, etc.). Card recommendations are drawn from 410+ Canadian credit cards across all major issuers (TD, RBC, BMO, CIBC, Scotiabank, Amex, and more).

## Keeping Card Data Up to Date

`data/cards.json` is the local card database used by the extension. To sync it with the latest data before a release:

```bash
# From the project root — set your Supabase credentials first
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_ANON_KEY=your-anon-key \
node chrome-extension/scripts/sync-cards.js
```

Or set `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` and the script will pick them up automatically.

## Icons Needed

Replace placeholder icons in `icons/` with:
- `icon16.png` (16×16)
- `icon32.png` (32×32)
- `icon48.png` (48×48)
- `icon128.png` (128×128)

Use the Rewardly brand color #1DDB82 (green).
