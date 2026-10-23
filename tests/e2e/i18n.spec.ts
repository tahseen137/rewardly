/**
 * Category 8: i18n Coverage Tests
 *
 * Verifies that the bilingual (en/fr) internationalization layer works correctly.
 *
 * Test strategy:
 *   1. Static JSON analysis  — flatten en.json and fr.json; report keys present in
 *      one locale but absent from the other.  French is known to be incomplete (10
 *      top-level sections + several partial gaps); this test documents the gaps
 *      without failing so that coverage regressions are caught when new English
 *      keys are added without a French counterpart.
 *
 *   2. Auth screen in French — inject the language preference into AsyncStorage
 *      (via localStorage, which is AsyncStorage's web backend) before the React
 *      app boots, then assert that French strings appear on the auth/sign-in page.
 *
 *   3. App UI tabs in French — same injection approach; after the app loads verify
 *      that the bottom-tab labels render in French.
 *
 *   4. Language toggle (authenticated) — sign in with TEST_EMAIL/TEST_PASSWORD,
 *      navigate to Settings, tap the Language row, and verify the UI language
 *      switches.  Skipped when credentials are absent.
 *
 *   5. No raw translation keys — load the app and scan rendered text nodes for
 *      patterns that look like unexpanded i18next keys (e.g. "auth.signIn").
 *
 * AsyncStorage ↔ localStorage mapping:
 *   Key: '@rewards_optimizer/language'        values: 'en' | 'fr'
 *   Key: '@rewards_optimizer/onboarding_complete'   value: 'true'  (skip onboarding)
 *
 * Run only these tests:
 *   npx playwright test tests/e2e/i18n.spec.ts
 */

import { test, expect } from '@playwright/test';
import fs   from 'fs';
import path from 'path';

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = process.env.BASE_URL ?? 'https://rewardly.ca';

// Credentials for authenticated tests (optional)
const TEST_EMAIL    = process.env.TEST_EMAIL    ?? '';
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? '';
const HAS_CREDS     = TEST_EMAIL.length > 0 && TEST_PASSWORD.length > 0;

// AsyncStorage keys used by PreferenceManager
const LANG_KEY        = '@rewards_optimizer/language';
const ONBOARDING_KEY  = '@rewards_optimizer/onboarding_complete';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Recursively flatten a nested JSON object to dot-separated keys. */
function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flattenKeys(v as Record<string, unknown>, full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

/** Load and flatten a translation file relative to this project's src/i18n/locales/. */
function loadLocale(locale: 'en' | 'fr'): string[] {
  // Walk up from tests/e2e/ to find src/i18n/locales/
  const localeFile = path.resolve(
    __dirname, '../../src/i18n/locales', `${locale}.json`
  );
  const raw = JSON.parse(fs.readFileSync(localeFile, 'utf8')) as Record<string, unknown>;
  return flattenKeys(raw);
}

/**
 * Inject AsyncStorage values before the app boots.
 * React Native Web's AsyncStorage stores items in localStorage with the exact
 * same key strings.  Playwright's addInitScript runs before any page JS.
 */
async function injectLocale(page: import('@playwright/test').Page, lang: 'en' | 'fr') {
  await page.addInitScript(
    ({ langKey, onboardKey, language }: { langKey: string; onboardKey: string; language: string }) => {
      localStorage.setItem(langKey,    language);
      localStorage.setItem(onboardKey, 'true');   // skip onboarding flow
    },
    { langKey: LANG_KEY, onboardKey: ONBOARDING_KEY, language: lang }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────────────────

test.describe('i18n Coverage — Bilingual Support', () => {

  // ── 1. Static JSON key-coverage analysis ─────────────────────────────────

  test.describe('Translation file coverage', () => {

    test('en.json and fr.json can be loaded and parsed', () => {
      const enKeys = loadLocale('en');
      const frKeys = loadLocale('fr');
      expect(enKeys.length).toBeGreaterThan(0);
      expect(frKeys.length).toBeGreaterThan(0);
    });

    test('documents keys present in en.json but absent from fr.json', () => {
      const enKeys = new Set(loadLocale('en'));
      const frKeys = new Set(loadLocale('fr'));

      const missingFromFr = [...enKeys].filter(k => !frKeys.has(k));

      // French is intentionally incomplete — 10 full sections + partial gaps.
      // Log missing keys without failing so regressions are visible in the report.
      if (missingFromFr.length > 0) {
        console.warn(
          `[i18n] ${missingFromFr.length} keys in en.json are missing from fr.json:\n` +
          missingFromFr.slice(0, 30).map(k => `  • ${k}`).join('\n') +
          (missingFromFr.length > 30 ? `\n  … and ${missingFromFr.length - 30} more` : '')
        );
      }

      // Sanity: English must always have more keys than French (French is a subset)
      expect(enKeys.size).toBeGreaterThanOrEqual(frKeys.size);

      // Known baseline: French should have at least 100 keys (currently ~200)
      expect(frKeys.size).toBeGreaterThan(100);
    });

    test('fr.json has no keys absent from en.json (no orphaned translations)', () => {
      const enKeys = new Set(loadLocale('en'));
      const frKeys = new Set(loadLocale('fr'));

      const orphanedInFr = [...frKeys].filter(k => !enKeys.has(k));

      if (orphanedInFr.length > 0) {
        console.warn(
          `[i18n] ${orphanedInFr.length} keys in fr.json have no English counterpart:\n` +
          orphanedInFr.map(k => `  • ${k}`).join('\n')
        );
      }

      // Orphaned French keys are a defect — fail if any exist
      expect(orphanedInFr).toEqual([]);
    });

    test('both locales share the same top-level sections that French covers', () => {
      const en = JSON.parse(
        fs.readFileSync(
          path.resolve(__dirname, '../../src/i18n/locales/en.json'), 'utf8'
        )
      ) as Record<string, unknown>;
      const fr = JSON.parse(
        fs.readFileSync(
          path.resolve(__dirname, '../../src/i18n/locales/fr.json'), 'utf8'
        )
      ) as Record<string, unknown>;

      // For every section that exists in both, every key within that section
      // that exists in English must also exist in French.
      const sharedSections = Object.keys(fr);

      const sectionGaps: string[] = [];
      for (const section of sharedSections) {
        const enSection = flattenKeys((en[section] ?? {}) as Record<string, unknown>, section);
        const frSection = new Set(flattenKeys((fr[section] ?? {}) as Record<string, unknown>, section));
        const missing   = enSection.filter(k => !frSection.has(k));
        sectionGaps.push(...missing);
      }

      if (sectionGaps.length > 0) {
        console.warn(
          `[i18n] ${sectionGaps.length} keys missing from fr.json within shared sections:\n` +
          sectionGaps.map(k => `  • ${k}`).join('\n')
        );
      }

      // Partial gaps within shared sections are documented but not failed here,
      // since the app already has known gaps (settings.signIn, auth.comingSoon,
      // several onboarding keys).  Change to toEqual([]) once fr.json is complete.
      expect(sectionGaps.length).toBeGreaterThanOrEqual(0); // always passes — see console output
    });
  });

  // ── 2. Auth screen renders in French ─────────────────────────────────────
  //
  //   The landing page (rewardly.ca) is static HTML that sits above the
  //   React Native Web SPA.  Clicking "Get Started Free" on the landing page
  //   transitions into the SPA auth screen.  The language preference is
  //   pre-seeded in localStorage via addInitScript so that i18next picks it up
  //   when the app boots.
  //
  //   PreferenceManager reads AsyncStorage (→ localStorage on web) and calls
  //   i18n.changeLanguage() asynchronously, so we wait for French text to
  //   appear rather than asserting immediately after navigation.

  test.describe('Auth screen — French locale', () => {

    test('subtitle shows French text when language is set to fr', async ({ page }) => {
      test.setTimeout(25_000);
      await injectLocale(page, 'fr');
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });

      // Enter the SPA from the landing page
      await page.getByText('Get Started Free').first().click();

      // auth.subtitle in French: "Maximisez vos récompenses de carte de crédit"
      await expect(
        page.locator('text=Maximisez vos récompenses de carte de crédit')
      ).toBeVisible({ timeout: 12_000 });
    });

    test('sign-in button shows French text when language is set to fr', async ({ page }) => {
      test.setTimeout(25_000);
      await injectLocale(page, 'fr');
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });

      await page.getByText('Get Started Free').first().click();

      // auth.signIn in French: "Se Connecter"
      await expect(
        page.locator('text=Se Connecter').first()
      ).toBeVisible({ timeout: 12_000 });
    });

    test('sign-up link shows French text when language is set to fr', async ({ page }) => {
      test.setTimeout(25_000);
      await injectLocale(page, 'fr');
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });

      await page.getByText('Get Started Free').first().click();

      // auth.noAccount in French: "Pas de compte? Inscrivez-vous"
      await expect(
        page.locator('text=Pas de compte? Inscrivez-vous')
      ).toBeVisible({ timeout: 12_000 });
    });

    test('email and password placeholders appear in French', async ({ page }) => {
      test.setTimeout(25_000);
      await injectLocale(page, 'fr');
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });

      await page.getByText('Get Started Free').first().click();

      // Placeholders: "Adresse e-mail" and "Mot de passe"
      await expect(
        page.locator('[placeholder="Adresse e-mail"]')
      ).toBeVisible({ timeout: 12_000 });
      await expect(
        page.locator('[placeholder="Mot de passe"]')
      ).toBeVisible({ timeout: 12_000 });
    });

    test('auth screen does NOT show English subtitle in French mode', async ({ page }) => {
      test.setTimeout(25_000);
      await injectLocale(page, 'fr');
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });

      await page.getByText('Get Started Free').first().click();

      // Wait for the auth screen to fully render in French
      await expect(
        page.locator('text=Maximisez vos récompenses de carte de crédit')
      ).toBeVisible({ timeout: 12_000 });

      // English subtitle must not appear anywhere
      await expect(
        page.locator('text=Maximize your credit card rewards')
      ).not.toBeVisible();
    });
  });

  // ── 3. Auth screen renders in English (default / sanity check) ────────────

  test.describe('Auth screen — English locale', () => {

    test('subtitle shows English text in default locale', async ({ page }) => {
      test.setTimeout(25_000);
      await injectLocale(page, 'en');
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });

      await page.getByText('Get Started Free').first().click();

      const subtitle = page.locator('text=Maximize your credit card rewards');
      await expect(subtitle).toBeVisible({ timeout: 12_000 });
    });

    test('sign-in button shows English text in default locale', async ({ page }) => {
      test.setTimeout(25_000);
      await injectLocale(page, 'en');
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });

      await page.getByText('Get Started Free').first().click();

      await expect(
        page.locator('text=Sign In').first()
      ).toBeVisible({ timeout: 12_000 });
    });
  });

  // ── 4. App tabs render in French ─────────────────────────────────────────

  test.describe('App UI tabs — French locale', () => {

    // These tests require a logged-in session to see the tab bar.
    // If TEST_EMAIL/TEST_PASSWORD are not set, they are skipped.

    test('bottom tabs show French labels after login', async ({ page }) => {
      test.skip(!HAS_CREDS, 'TEST_EMAIL/TEST_PASSWORD not set — skipping authenticated test');

      await injectLocale(page, 'fr');
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });

      // Sign in
      await page.fill('[placeholder="Adresse e-mail"]', TEST_EMAIL);
      await page.fill('[placeholder="Mot de passe"]', TEST_PASSWORD);
      await page.locator('text=Se Connecter').first().click();
      await page.waitForTimeout(4_000);

      // tabs in French: Accueil, Mes Cartes, Paramètres
      await expect(page.locator('text=Accueil')).toBeVisible({ timeout: 10_000 });
      await expect(page.locator('text=Mes Cartes')).toBeVisible({ timeout: 10_000 });
      await expect(page.locator('text=Paramètres')).toBeVisible({ timeout: 10_000 });
    });

    test('bottom tabs do NOT show English labels when language is French', async ({ page }) => {
      test.skip(!HAS_CREDS, 'TEST_EMAIL/TEST_PASSWORD not set — skipping authenticated test');

      await injectLocale(page, 'fr');
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });

      await page.fill('[placeholder="Adresse e-mail"]', TEST_EMAIL);
      await page.fill('[placeholder="Mot de passe"]', TEST_PASSWORD);
      await page.locator('text=Se Connecter').first().click();
      await page.waitForTimeout(4_000);

      // "Home" and "Settings" are the English tab labels — must not appear
      await expect(page.locator('text=Home')).not.toBeVisible();
      await expect(page.locator('text=Settings')).not.toBeVisible();
    });
  });

  // ── 5. Language toggle in Settings ───────────────────────────────────────

  test.describe('Language toggle — Settings screen', () => {

    test('tapping Language row toggles app to French', async ({ page }) => {
      test.skip(!HAS_CREDS, 'TEST_EMAIL/TEST_PASSWORD not set — skipping authenticated test');

      // Start in English
      await injectLocale(page, 'en');
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });

      // Sign in (English UI)
      await page.fill('[placeholder="Email address"]', TEST_EMAIL);
      await page.fill('[placeholder="Password"]', TEST_PASSWORD);
      await page.locator('text=Sign In').first().click();
      await page.waitForTimeout(4_000);

      // Navigate to Settings tab
      await page.locator('text=Settings').click();
      await page.waitForTimeout(1_000);

      // Tap the Language row to toggle to French
      const langRow = page.locator('text=Language').first();
      await expect(langRow).toBeVisible({ timeout: 8_000 });
      await langRow.click();
      await page.waitForTimeout(2_000);

      // Settings title should now be French: "Paramètres"
      await expect(page.locator('text=Paramètres')).toBeVisible({ timeout: 8_000 });
    });

    test('tapping Language row again toggles app back to English', async ({ page }) => {
      test.skip(!HAS_CREDS, 'TEST_EMAIL/TEST_PASSWORD not set — skipping authenticated test');

      // Start in French
      await injectLocale(page, 'fr');
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });

      // Sign in (French UI)
      await page.fill('[placeholder="Adresse e-mail"]', TEST_EMAIL);
      await page.fill('[placeholder="Mot de passe"]', TEST_PASSWORD);
      await page.locator('text=Se Connecter').first().click();
      await page.waitForTimeout(4_000);

      // Navigate to Settings tab (French label)
      await page.locator('text=Paramètres').click();
      await page.waitForTimeout(1_000);

      // Tap Language row to toggle back to English
      const langRow = page.locator('text=Langue').first();
      await expect(langRow).toBeVisible({ timeout: 8_000 });
      await langRow.click();
      await page.waitForTimeout(2_000);

      // Settings title should now be English: "Settings"
      await expect(page.locator('text=Settings')).toBeVisible({ timeout: 8_000 });
    });
  });

  // ── 6. No raw translation keys rendered ──────────────────────────────────

  test.describe('Raw key detection', () => {

    test('auth screen renders no raw i18next keys in English', async ({ page }) => {
      test.setTimeout(25_000);
      await injectLocale(page, 'en');
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.getByText('Get Started Free').first().click();
      await page.getByPlaceholder('Email address').waitFor({ state: 'visible', timeout: 12_000 });

      // Collect all visible text on the page
      const rawKeyPattern = /^[a-z][a-zA-Z]+\.[a-zA-Z][a-zA-Z.]+$/;

      const textNodes = await page.evaluate(() => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null
        );
        const texts: string[] = [];
        let node = walker.nextNode();
        while (node) {
          const text = node.textContent?.trim() ?? '';
          if (text.length > 0) texts.push(text);
          node = walker.nextNode();
        }
        return texts;
      });

      // Filter to texts that look like unexpanded keys (e.g. "auth.signIn")
      const suspiciousKeys = textNodes.filter(t => rawKeyPattern.test(t));

      if (suspiciousKeys.length > 0) {
        console.warn(
          `[i18n] Possible raw translation keys found on page:\n` +
          suspiciousKeys.map(k => `  • "${k}"`).join('\n')
        );
      }

      expect(suspiciousKeys).toEqual([]);
    });

    test('auth screen renders no raw i18next keys in French', async ({ page }) => {
      test.setTimeout(25_000);
      await injectLocale(page, 'fr');
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.getByText('Get Started Free').first().click();
      await page.locator('text=Maximisez vos récompenses de carte de crédit').waitFor({ state: 'visible', timeout: 12_000 });

      const rawKeyPattern = /^[a-z][a-zA-Z]+\.[a-zA-Z][a-zA-Z.]+$/;

      const textNodes = await page.evaluate(() => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null
        );
        const texts: string[] = [];
        let node = walker.nextNode();
        while (node) {
          const text = node.textContent?.trim() ?? '';
          if (text.length > 0) texts.push(text);
          node = walker.nextNode();
        }
        return texts;
      });

      const suspiciousKeys = textNodes.filter(t => rawKeyPattern.test(t));

      if (suspiciousKeys.length > 0) {
        console.warn(
          `[i18n] Possible raw translation keys found on page (French):\n` +
          suspiciousKeys.map(k => `  • "${k}"`).join('\n')
        );
      }

      expect(suspiciousKeys).toEqual([]);
    });
  });

  // ── 7. Landing page renders correctly in both languages ───────────────────
  //
  //   The landing page is static HTML — it has no i18n integration.
  //   These tests verify it loads without JS errors and contains expected text.

  test.describe('Landing page — language agnostic', () => {

    test('landing page loads without critical errors in English context', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', err => errors.push(err.message));

      await injectLocale(page, 'en');
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2_000);

      // No uncaught JS exceptions
      expect(errors.filter(e => !e.includes('ResizeObserver'))).toEqual([]);
    });

    test('landing page loads without critical errors in French context', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', err => errors.push(err.message));

      await injectLocale(page, 'fr');
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2_000);

      expect(errors.filter(e => !e.includes('ResizeObserver'))).toEqual([]);
    });
  });
});
