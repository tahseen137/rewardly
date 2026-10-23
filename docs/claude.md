# Rewardly — Engineering Analysis

A deep-dive audit of the Rewardly codebase covering deployment, bugs, testing, and improvement opportunities. All findings reference current code with file paths and line numbers verified against the tree at the time of writing.

---

## Project overview

Rewardly is a cross-platform credit card rewards optimizer for the Canadian market, shipping as iOS/Android via Expo, web via Vercel, and a Chrome extension for cashback comparison. The app advertises 410+ cards, AI-powered chat (Sage), wallet gap analysis, CSV statement import for 8 Canadian banks, achievements gamification, and a paid subscription tier.

**Stack:**

- React Native `0.81.5` + Expo `54.0.31` + React `19.1.0`
- TypeScript `5.9.2` with `strict: true` (see `tsconfig.json`)
- React Navigation `7.x` (bottom tabs + native stack)
- Supabase (`@supabase/supabase-js 2.90.1`) — Postgres + Edge Functions
- `i18next` / `react-i18next` for EN/FR
- Jest `29.7` + `ts-jest` + `fast-check 4.5` for property-based testing
- ESLint `9.39` + Prettier `3.7`

**Backend surface:** 21 SQL migrations in `supabase/migrations/` (`001_initial_schema.sql` → `021_achievements_and_applications.sql`) and 6 Edge Functions under `supabase/functions/`: `get-best-card`, `sage-chat`, `sage-chat-stream`, `create-checkout`, `manage-subscription`, `stripe-webhook`.

---

## 1. Deployment information

### Web (Vercel, primary)

`vercel.json` wires the Vercel build to `npm run build:web` and publishes `dist/`. Notable config:

- **Build command:** `npm run build:web` → `expo export -p web && cp -r public/api dist/api` (from `package.json:36`). The copy step preserves `public/api/*.json` for the Chrome extension to fetch.
- **Rewrites:** `/admin` → `admin.html`, `/ceo-queue` → `ceo-queue.html`, SPA catch-all `/((?!admin|ceo-queue|api/).*) → /index.html`. The negative lookahead on `api/` is critical so the extension can hit static JSON endpoints.
- **Caching:** Immutable 1-year cache on `/_expo/static/*` and `/assets/*`.
- **Security headers:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block` applied globally.

### Web (Netlify, alternate)

`netlify.toml` mirrors the Vercel config but pins Node 18 and uses a simpler SPA rewrite (`/* → /index.html 200`). No `api/` carve-out, so if Netlify is used, the extension JSON routes will 404 — worth fixing if Netlify ever becomes primary.

### Mobile (EAS)

`eas.json` defines three profiles:

- `development` — internal distribution, iOS simulator, Android APK
- `preview` — internal distribution, real iOS device, Android APK
- `production` — store distribution, iOS real device, Android app-bundle

**Critical — placeholder values in shipped config:**

- `eas.json:38` — `appleId: "your-apple-id@email.com"`
- `eas.json:39` — `ascAppId: "your-app-store-connect-app-id"`
- `app.json:56` — `"eas": { "projectId": "your-project-id" }`
- `app.json:59` — `"owner": "your-expo-username"`

These must be filled in before any EAS build or store submission will succeed.

### Mobile app config (`app.json`)

- Bundle ID / Android package: `com.rewardsoptimizer.app`
- Scheme: `rewards-optimizer`
- Portrait only, new architecture enabled
- iOS location usage descriptions in place for `AutoPilot` geofencing feature
- Android permissions: `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`, `RECEIVE_BOOT_COMPLETED`, `VIBRATE`

### Build / deploy scripts (`package.json`)

| Script                               | What it does                                      |
| ------------------------------------ | ------------------------------------------------- |
| `build:web`                          | `expo export -p web && cp -r public/api dist/api` |
| `build:preview` / `build:production` | `eas build --profile <p> --platform all`          |
| `build:android-apk`                  | Preview APK only                                  |
| `build:ios-simulator`                | Dev client IPA for simulator                      |
| `submit:ios` / `submit:android`      | `eas submit`                                      |
| `deploy:vercel`                      | `predeploy && vercel --prod`                      |
| `deploy:netlify`                     | `predeploy && netlify deploy --prod`              |
| `predeploy`                          | `npm run validate`                                |
| `validate`                           | `lint && typecheck && test:web` — no unit tests!  |
| `test:web`                           | `npx expo export --platform web && echo '✅'`     |

**Gap:** `validate` runs lint + typecheck + web build but does **not** run `npm test`. Predeploy therefore does not execute the unit test suite. CI (see below) does run tests, but a local `deploy:vercel` skips them.

### CI/CD

`.github/workflows/ci.yml` runs on PR and push to `main`/`master`:

```
setup-node@v4 (Node 20) → npm ci → typecheck → lint → test → test:web → validate
```

Note the redundancy: `test:web` runs an Expo web export, then `validate` runs it again (along with lint + typecheck a second time). Worth consolidating.

### Environment variables

`.env.example` documents:

```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY       # explicitly marked safe to expose
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY   # must be restricted by bundle ID
```

Edge Functions additionally require (from reading `create-checkout`, `stripe-webhook`, `sage-chat`):

```
SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_LIFETIME / STRIPE_PRICE_PRO_{MONTHLY,ANNUAL} / STRIPE_PRICE_MAX_{MONTHLY,ANNUAL}
APP_URL
ANTHROPIC_API_KEY or OPENAI_API_KEY
```

None of these are in `.env.example` — operators deploying fresh have no reference doc.

### Database

- Supabase project ref: `zdlozhpmqrtvvhdzbmrv` (visible in `.env.production`)
- 21 migration files in `supabase/migrations/` run via `supabase db push`
- Edge Functions deployed with `supabase functions deploy <name>`
- `manage-subscription` function exists in-repo but is **not yet deployed** — confirmed by the TODO at `src/screens/SettingsScreen.tsx:404` (see Bugs section)

### Related docs (already in repo)

`docs/DEPLOYMENT.md`, `docs/APP_STORE_DEPLOYMENT.md`, `docs/DEPLOYMENT_CHECKLIST.md`, `docs/WEB_DEPLOYMENT.md`, `docs/EDGE_FUNCTIONS_DEPLOYMENT.md`. This analysis does not duplicate them.

---

## 2. Bugs and code issues

Severity ratings: **Critical** = security / data loss / payment integrity; **High** = data corruption or user-blocking; **Medium** = degraded UX / incomplete features.

### Critical

**C1. `.env.production` is committed to git** (`/.env.production`)
Confirmed via `git ls-files` — the file is tracked. It contains `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`, and a `VERCEL_OIDC_TOKEN`. Risk profile:

- The Supabase **anon** key is explicitly "safe to expose" per `.env.example:8` — it's what ships in the client bundle. Not a leak in itself.
- The Google Places API key is a real concern unless restricted by bundle ID / HTTP referrer. No way to tell from the key alone.
- The `VERCEL_OIDC_TOKEN` is a Vercel CLI-generated dev token; the one in the file is scoped to `environment: development` and already expired.
- **Why it still matters:** tracking `.env.production` sets a pattern where somebody will eventually commit a real secret (Stripe key, service role key, Anthropic key) into it. `.gitignore:34` ignores `.env` and `.env*.local` but not `.env.production`.
- **Fix:** `git rm --cached .env.production`, add `.env.production` to `.gitignore`, rotate the Google Places key and restrict it to the production bundle ID / hosts.

**C2. `sage-chat` Edge Function trusts `userId` from the request body without JWT verification** (`supabase/functions/sage-chat/index.ts:522-538`)
The handler validates that `message` and `userId` are non-empty, then immediately initializes Supabase with the service-role key and begins writing to `conversations` / `messages` tables with that body-supplied `userId`. Compare with `create-checkout/index.ts:47-52`, which correctly calls `supabaseAdmin.auth.getUser(token)` to verify the caller.

- **Impact:** any caller can inject messages into another user's Sage conversation history, consume their AI quota, or seed their context with adversarial content. Service-role writes bypass RLS entirely.
- **Fix:** require a `Bearer` JWT, call `supabaseAdmin.auth.getUser(token)`, and use `user.id` — never the body — for all database writes.

**C3. Stripe webhook silently proceeds with empty credentials** (`supabase/functions/stripe-webhook/index.ts:23, 29-30, 50`)

```ts
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', ...);
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);
// ...
event = stripe.webhooks.constructEvent(body, signature, Deno.env.get('STRIPE_WEBHOOK_SECRET') || '');
```

If any of these env vars are missing at deploy, the function does not crash — it runs with empty strings. Signature verification with an empty secret will reject all events (failing closed, which is OK), but subsequent Stripe API calls may return opaque 401s instead of a clean "misconfigured" error.

- **Fix:** at module load, read each required env var into a `const` and `throw new Error('STRIPE_SECRET_KEY is required')` if undefined.

**C4. Chrome extension requests `<all_urls>` host permissions** (`chrome-extension/manifest.json:11-12, 28-32`)
Both `host_permissions` and `content_scripts[0].matches` are `["<all_urls>"]`. This is the broadest possible access, and Chrome Web Store review will flag it. The content script only needs to detect merchant domains listed in bundled data — scope should be narrowed.

- **Fix:** enumerate the ~20 supported merchant domains in `matches`, or switch to `activeTab` + programmatic injection on user click.

### High (data integrity)

**H1. Unchecked `as string` casts on Stripe customer/subscription IDs** (`supabase/functions/stripe-webhook/index.ts:128, 143, 152, 158, 173, 207, 229`)
Every line writes `session.customer as string` or `subscription.customer as string` into the DB. Stripe types these as `string | Stripe.Customer | null`. If the fields are ever populated (`expand: ['customer']`) or null, the cast silently coerces an object to `"[object Object]"` or writes the literal string `"null"` into `stripe_customer_id`. Line 152 does the same with `session.subscription as string` before passing it to `stripe.subscriptions.retrieve()`.

- **Fix:** add a helper `function extractId(v: string | { id: string } | null | undefined): string { if (!v) throw ...; return typeof v === 'string' ? v : v.id; }` and use it everywhere. This also gives TypeScript-accurate null handling.

**H2. Known race condition in country-change flow** (`src/screens/HomeScreen.tsx:177-191`)
There is already a `// BUG FIX: Await loadData to prevent race condition` comment on line 184. The fix is incomplete: `setState` runs synchronously on line 180, then `refreshCards()` and `loadData()` run sequentially. If the user toggles country a second time while the first async chain is in flight, two loaders race against each other and the state machine can park in `isLoading: true` even after both resolve.

- **Fix:** track an `AbortController` per invocation (or increment a `requestId` in state and ignore stale responses), or debounce the subscription.

**H3. `create-checkout` returns `{ url: session.url }` without null-checking** (`supabase/functions/create-checkout/index.ts:156`)
Stripe types `Checkout.Session.url` as `string | null`. The client then navigates to whatever it gets back — potentially `undefined`/`null`.

- **Fix:** `if (!session.url) throw new Error('Stripe did not return a checkout URL');` before the response.

**H4. User input interpolated into PostgREST `ilike` filters** (`supabase/functions/sage-chat/index.ts:230, 251, 310`)

```ts
.ilike('name', `%${cardName}%`)
.or(`name.ilike.%${card1}%,name.ilike.%${card2}%`)
.ilike('program_name', `%${program}%`)
```

`cardName`, `card1`, `card2`, and `program` come from AI tool arguments, which come from model output, which is influenced by user messages. The `.or()` call on line 251 is the riskier one — commas and parentheses in the interpolated values can extend the filter expression.

- **Fix:** reject or sanitize any input containing `%`, `,`, `(`, `)`, `*`, or `\`. Prefer exact matches where possible.

### Medium (feature blockers / documented TODOs)

**M1. Error tracking not wired up** (`App.tsx:178`)

```ts
// TODO: Send to error tracking service
// Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
```

The `AppErrorBoundary` catches fatal React errors but only logs to `console`. Once the app ships to stores, there is no signal when users crash.

**M2. Subscription management UI is dead-coded out** (`src/screens/SettingsScreen.tsx:404-406`)

```
{/* TODO: Re-enable when manage-subscription edge function is deployed to Supabase */}
{false && (subscriptionTier === 'pro' || subscriptionTier === 'max') && ... }
```

Paying users cannot cancel or switch plans from Settings. This is a regulatory exposure (Stripe/app-store rules require cancellation paths) and a churn lever.

**M3. Privacy policy URL does not exist** (`src/screens/AutoPilotScreen.tsx:419-425`)

```ts
// BUG FIX: Show Alert directly since rewardly.app/privacy doesn't exist yet
Alert.alert('Privacy Details', '...');
```

`AutoPilot` is a location-tracking feature. Shipping it without a web-accessible privacy policy will get rejected by App Store review.

**M4. Share link is a static URL** (`src/services/RewardsIQService.ts:563`)

```ts
shareUrl: 'https://rewardly.app', // TODO: Deep link
```

Every shared "Rewards IQ" result points to the homepage — no deep link into the referenced card / category / score.

**M5. OG social-preview images not generated** (`scripts/add-meta-tags.js:11, 121`)
The script writes `og-image.png` references into every HTML file under `public/`, but the image never gets created. Social shares render with no preview.

**M6. `sage-chat` request body is under-validated** (`supabase/functions/sage-chat/index.ts:513-535`)
Validates only `message.trim()` and `userId`. Does not validate `portfolio: CardInfo[]` shape, `preferences` object, numeric sanity on `pointBalances`, or UUID format on `conversationId`. Malformed data gets passed to the AI provider (and then written to the DB).

**M7. Analytics failure swallowed in `get-best-card`** (`supabase/functions/get-best-card/index.ts:200-205`)

```ts
await supabase.from('autopilot_analytics').insert({ ... }).catch(console.error);
```

Silently continues on failure. If the RLS policy for `autopilot_analytics` tightens later, usage data will just stop recording without anybody noticing.

---

## 3. Testing information

### Framework & config

`jest.config.js`:

```js
preset: 'ts-jest',
testEnvironment: 'node',
roots: ['<rootDir>/src'],
testMatch: ['**/__tests__/**/*.test.ts', '**/*.property.test.ts'],
setupFilesAfterEach: '<rootDir>/src/services/__tests__/setup.test.ts',
moduleNameMapper: { '@react-native-async-storage/async-storage' → mock, 'react-native' → mock, 'expo-apple-authentication' → mock }
```

Property-based tests use `fast-check 4.5`. No React-component test renderer, no Detox, no Playwright, no Cypress.

### Scripts

`npm test` (`jest`), `npm run test:watch`, `npm run test:coverage` (writes to `coverage/`, not in CI), and `npm run test:web` which just does an Expo web export.

### File counts (verified)

| Category                                        | Count   |
| ----------------------------------------------- | ------- |
| Source `.ts`/`.tsx` (excluding tests and mocks) | **160** |
| Test files (`*.test.ts`, `*.property.test.ts`)  | **39**  |

Breakdown of the 39 test files:

- `src/services/__tests__/` — 27 service unit tests (AchievementService, AuthService, CardDataService, CardRecommendationEngine, FeeBreakevenService, SignupBonusService, StatementParserService, SubscriptionService, WalletOptimizerService, etc.)
- `src/services/__tests__/property/` — 6 property-based tests (portfolio, ranking, preference, storeCategory, suggestions, RewardsCalculatorService)
- `src/utils/__tests__/property/` — 2 (amountUtils, rewardFormatUtils)
- `src/screens/__tests__/property/` — 1 (HomeScreen)
- `src/components/__tests__/property/` — 1 (RewardsDisplay)
- `src/navigation/__tests__/` — 1 (AppNavigator)
- `src/types/__tests__/` — 1 (types)

### Strengths

- **Recommendation logic is well-covered.** `CardRecommendationEngine.test.ts` plus the property tests (`ranking.property.test.ts`, `portfolio.property.test.ts`) exercise the ranking algorithm across edge cases.
- **Services layer is systematically unit-tested.** Most services in `src/services/` have a corresponding `__tests__/` file.
- **Property-based testing is used where it matters most** — reward calculations, formatting, and ranking — which catches classes of bugs no example-based suite would.

### Gaps

- **Screens are essentially untested.** Only 1 of ~30 screens has any test (a property test for `HomeScreen`). Large screens have zero coverage:
  - `src/screens/LandingPage.tsx` — **1473 LOC**
  - `src/screens/PremiumOnboardingScreen.tsx` — **1434 LOC**
  - `src/screens/CardTrackerScreen.tsx` — **1155 LOC**
- **Edge Functions have zero tests.** `stripe-webhook`, `sage-chat`, `create-checkout`, `get-best-card`, `manage-subscription` — all untested. This is where the money logic lives.
- **No E2E tests.** No Detox, no Playwright, no Cypress. The critical "add card → lookup → recommendation" flow has no automated end-to-end coverage.
- **No coverage gate.** `npm run test:coverage` exists but CI does not upload or enforce thresholds. `collectCoverageFrom` is configured but unused.
- **`npm run validate` does not run unit tests.** `package.json:35` — `validate` is `lint && typecheck && test:web`. Local `deploy:vercel` runs `predeploy → validate`, so a dev can ship without the suite passing.
- **References to BUG #1–#5 appear in test comments** — test code acknowledges known bugs but the underlying issues live in the production code path, not the tests.

### CI

`.github/workflows/ci.yml` does run `npm test` on every PR/push to `main`/`master` (alongside typecheck, lint, web build). So the test suite is gated in CI even though `validate` is not — the main risk is bypassing CI locally, not missing it entirely.

---

## 4. Suggested improvements (prioritized)

### P0 — security and integrity (do this week)

1. **Untrack `.env.production`, rotate the Google Places key, add to `.gitignore`.** Then audit the last year of commits for any other secrets that slipped in (`git log -p -- .env.production`).
2. **Add JWT verification to `sage-chat/index.ts`.** Copy the pattern from `create-checkout/index.ts:47-52`: extract the `Bearer` token, call `supabaseAdmin.auth.getUser(token)`, use `user.id` for all writes. Ignore any `userId` in the body.
3. **Fail fast on missing env vars in Edge Functions.** Replace every `Deno.env.get('X') || ''` in `stripe-webhook`, `sage-chat`, and `create-checkout` with a `requireEnv('X')` helper that throws at module load.
4. **Safe-cast Stripe IDs.** Add an `extractId` helper and use it everywhere `as string` appears in `stripe-webhook/index.ts`.
5. **Sanitize PostgREST filter inputs in `sage-chat`.** At minimum strip `%`, `,`, `(`, `)`, `\` from tool arguments before interpolation — or switch `compare_cards` away from `.or()`.

### P1 — user-facing reliability

6. **Integrate Sentry (or Bugsnag).** Wire `App.tsx:178` and `AppErrorBoundary` to capture real errors. Ship before App Store submission so the first wave of users isn't a black box.
7. **Deploy `manage-subscription` and unhide the Settings UI.** Remove `{false && …}` wrapper at `src/screens/SettingsScreen.tsx:407`. This is a regulatory and churn issue.
8. **Publish a real privacy policy page** at the URL `AutoPilotScreen` points to. Remove the `Alert.alert` workaround (`src/screens/AutoPilotScreen.tsx:419-425`). Required for App Store review of any location feature.
9. **Fix the country-change race condition** (`src/screens/HomeScreen.tsx:177-191`). Use an abort controller or request-ID discrimination so the stuck-loader state becomes impossible.
10. **Fill in EAS/Apple placeholder values** in `eas.json:38-39` and `app.json:56,59` — `"your-project-id"` will not build.
11. **Add the missing env vars to `.env.example`** — Stripe keys, Anthropic/OpenAI keys, APP_URL, service role key. Operators deploying from scratch have no reference.

### P2 — test coverage

12. **Add Detox E2E coverage for the top 5 flows:** onboarding → add card → category lookup → recommendation render → subscription upgrade. Each of these is product-critical and currently has no automated coverage.
13. **Unit test the Edge Functions.** At minimum: `stripe-webhook` signature verification success/failure, `create-checkout` happy path + unauthorized + missing tier, `sage-chat` auth enforcement (after fix C2), `get-best-card` recommendation ranking.
14. **Unit test the four >1000-LOC screens.** Not full render tests — just the business logic that's currently coupled into them (which is much of the problem).
15. **Enforce coverage in CI.** Run `jest --coverage --coverageThreshold='{...}'` and publish HTML output as an artifact so reviewers can inspect.
16. **Make `npm run validate` include `npm test`.** One-line change in `package.json:35`. Right now `predeploy` skips the suite entirely.

### P3 — code health and DX

17. **Install `husky` + `lint-staged`** to run `lint` and `typecheck` on pre-commit. Catches the common CI failures locally and saves a round trip.
18. **Split `src/types/index.ts` (1237 LOC)** into domain-specific modules: `types/cards.ts`, `types/user.ts`, `types/rewards.ts`, `types/subscription.ts`. Easier to review and cuts cross-file recompilation churn.
19. **Refactor the three 1000+ LOC screens** into sub-components. Extract modal, form, and list-row logic. Target <500 LOC per screen file. This also unblocks suggestion #14.
20. **Upgrade `@typescript-eslint/no-explicit-any` from `warn` to `error`** in `.eslintrc.json:20`. `strict: true` in `tsconfig.json` already gives you the strict checks, but the ESLint warning for explicit `any` is worth promoting.
21. **Introduce a structured logger** (tiny helper around `console` that respects `__DEV__`) and replace raw `console.log` / `console.error` in the 30+ files that still use them. Add a `terser` step in the production web/mobile builds to strip `console.*`.
22. **Generate the OG images** flagged in `scripts/add-meta-tags.js:11, 121`. Either statically export a template via Figma/Playwright or do it at build time with `@vercel/og`.
23. **Consolidate CI duplication.** `ci.yml` runs `test:web` and then `validate`, which runs `test:web` again (plus lint and typecheck again). Split into one `validate` job and drop the redundant individual steps, or flatten `validate` into the pipeline.

---

## Appendix — verified file references

Every file path and line number cited above was re-read against the tree at the time of writing. If this document drifts from the code, trust the code; then update this doc or delete it.

Critical files to re-verify before acting on any finding:

- `package.json`, `vercel.json`, `netlify.toml`, `eas.json`, `app.json`, `.github/workflows/ci.yml`
- `.env.example`, `.env.production` (and `.gitignore`)
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/sage-chat/index.ts`
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/get-best-card/index.ts`
- `App.tsx`, `src/screens/HomeScreen.tsx`, `src/screens/SettingsScreen.tsx`, `src/screens/AutoPilotScreen.tsx`
- `src/services/RewardsIQService.ts`, `scripts/add-meta-tags.js`
- `jest.config.js`, `tsconfig.json`, `.eslintrc.json`, `chrome-extension/manifest.json`
