# Rewardly UI Redesign — Claude Code Instructions

You are implementing a high-fidelity UI redesign for the Rewardly React Native app.
Read `README.md` in this folder first — it has the full spec.

## Quick start

1. The design references are in `screens/*.html` — open them in a browser to see the target UI
2. The full interactive prototype is at `ui_kits/mobile-app/index.html` in the design system project
3. All tokens are already in `rewardly/src/theme/` — use them, don't hardcode
4. All base components exist in `rewardly/src/components/` — compose them, don't rewrite

## Your job

Edit these files in `rewardly/src/screens/`:
- `SettingsScreen.tsx` — account card + section-row pattern (start here, simplest)
- `InsightsHomeScreen.tsx` — Rewards IQ card + missed rewards list
- `AutoPilotScreen.tsx` — Smart Wallet: location banner + nearby stores
- `MyCardsScreen.tsx` — add Rewards IQ card at top
- `HomeScreen.tsx` — minor layout cleanup only
- `SageScreen.tsx` — fix pinned input layout
- `AuthScreen.tsx` — minor tweaks (owl logo, footer)

## Rules

- Use `useTheme()` for all colors/spacing — no hardcoded hex values
- Use `lucide-react-native` for icons — same icons as in the design
- Use existing components: `Button`, `Card`, `Badge`, `Input`, `CardRewardItem`, `GradientText`
- Keep all existing business logic — only change layout and styling
- Follow the brand voice: sentence case, calm tone, show specific numbers
- Run the app after each screen change to verify

## Design system reference

The full design system lives in this project. Key files:
- `tokens/colors.css` — all color tokens with hex values
- `tokens/spacing.css` — spacing scale
- `readme.md` — brand voice, visual foundations, content fundamentals
