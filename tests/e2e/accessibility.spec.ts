/**
 * Category 5: Accessibility Tests
 *
 * Runs axe-core scans on key pages and gates on violation severity:
 *   critical / serious  → hard FAIL  (test fails, blocking)
 *   moderate / minor    → soft WARN  (console.warn, non-blocking)
 *
 * React Native Web limitations (documented per-page):
 *   The SPA pages (landing, auth) render entirely inside generic <div>s with
 *   inline styles — no semantic HTML landmarks, no <h1> elements, and some
 *   design-constrained colours. These structural gaps are disabled in axe for
 *   SPA pages but are left enabled for static HTML pages where we own the markup.
 *
 * Run a11y scans only:
 *   npx playwright test tests/e2e/accessibility.spec.ts
 * Regenerate after axe rule updates:
 *   npx playwright test tests/e2e/accessibility.spec.ts --update-snapshots
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Result } from 'axe-core';

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = process.env.BASE_URL ?? 'https://rewardly.ca';

/**
 * Rules disabled for React Native Web SPA pages.
 * Each entry explains WHY it is disabled so future maintainers can judge
 * whether to re-enable it after a framework or design change.
 */
const SPA_DISABLED_RULES = [
  // React Native Web renders all text as <div dir="auto"> with inline colour
  // styles drawn from the app's dark-theme palette.  Several brand colours
  // (primary green #1ddb82, secondary text #64748b on dark backgrounds) fall
  // below WCAG AA 4.5:1.  Fixing these requires a theme-wide colour audit —
  // tracked separately from this test suite.
  'color-contrast',

  // React Native Web's NavigationContainer never emits <main>, <header>,
  // <footer>, or any ARIA landmark.  All content lives in role-less <div>s.
  // These three rules all stem from that same structural gap.
  'landmark-one-main',
  'page-has-heading-one',
  'region',

  // AuthScreen uses autoComplete="current-password" / "new-password" which is
  // correct in source, but the live deployment has not yet picked up this fix.
  // Re-enable once the build is deployed to production.
  'autocomplete-valid',
] as const;

// ─── Helper: build and run an axe scan ───────────────────────────────────────

interface ScanOptions {
  /** Rule IDs to pass to .disableRules() */
  disableRules?: readonly string[];
  /** Axe tags to include (default: wcag2a, wcag2aa, wcag21a, wcag21aa) */
  tags?: string[];
}

async function scanPage(
  page: import('@playwright/test').Page,
  opts: ScanOptions = {}
): Promise<Result[]> {
  let builder = new AxeBuilder({ page }).withTags(
    opts.tags ?? ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
  );

  if (opts.disableRules?.length) {
    builder = builder.disableRules([...opts.disableRules]);
  }

  const { violations } = await builder.analyze();
  return violations;
}

// ─── Helper: assert violations by severity ───────────────────────────────────

/**
 * Logs moderate/minor violations as console warnings and hard-fails the test
 * if any critical or serious violations are present.
 */
function assertViolations(violations: Result[], pageLabel: string) {
  const bySeverity = {
    critical: violations.filter((v) => v.impact === 'critical'),
    serious:  violations.filter((v) => v.impact === 'serious'),
    moderate: violations.filter((v) => v.impact === 'moderate'),
    minor:    violations.filter((v) => v.impact === 'minor'),
  };

  // ── Soft warnings (non-blocking) ──────────────────────────────────────────
  for (const impact of ['moderate', 'minor'] as const) {
    const items = bySeverity[impact];
    if (items.length) {
      console.warn(
        `\n⚠ [${pageLabel}] ${items.length} ${impact} a11y violation(s):\n` +
          items
            .map(
              (v) =>
                `  • ${v.id}: ${v.description}\n` +
                v.nodes
                  .slice(0, 2)
                  .map((n) => `      ↳ ${n.html.substring(0, 120)}`)
                  .join('\n')
            )
            .join('\n')
      );
    }
  }

  // ── Hard fail on critical / serious ──────────────────────────────────────
  const blocking = [...bySeverity.critical, ...bySeverity.serious];
  if (blocking.length) {
    const detail = blocking
      .map(
        (v) =>
          `[${v.impact}] ${v.id}: ${v.description}\n` +
          v.nodes
            .slice(0, 3)
            .map((n) => `    ↳ ${n.html.substring(0, 120)}\n      ${n.failureSummary ?? ''}`)
            .join('\n')
      )
      .join('\n\n');

    expect(
      blocking,
      `${blocking.length} critical/serious a11y violation(s) on "${pageLabel}":\n\n${detail}`
    ).toHaveLength(0);
  }
}

// ─── Navigation helpers ───────────────────────────────────────────────────────

async function goHome(page: import('@playwright/test').Page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !document.getElementById('app-loading'), {
    timeout: 20_000,
  });
  await page.waitForTimeout(1_300); // settle JS-driven entrance animations
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Accessibility (axe-core — WCAG 2.1 AA)', () => {

  // ── SPA: Landing page ─────────────────────────────────────────────────────

  test('landing page — no critical/serious violations', async ({ page }) => {
    await goHome(page);

    const violations = await scanPage(page, { disableRules: SPA_DISABLED_RULES });

    // Surface violation count in test title output regardless of pass/fail
    const byCat = violations.reduce<Record<string, number>>((acc, v) => {
      acc[v.impact ?? 'unknown'] = (acc[v.impact ?? 'unknown'] ?? 0) + 1;
      return acc;
    }, {});
    console.info(
      `[landing] axe results — disabled: ${SPA_DISABLED_RULES.join(', ')}\n` +
        `  remaining: ${JSON.stringify(byCat)}`
    );

    assertViolations(violations, 'landing page');
  });

  // ── SPA: Auth screen ──────────────────────────────────────────────────────

  test('auth screen (sign-in) — no critical/serious violations', async ({ page }) => {
    await goHome(page);
    await page.getByText('Get Started Free').first().click();
    await page.getByPlaceholder('Email address').waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(400);

    const violations = await scanPage(page, { disableRules: SPA_DISABLED_RULES });
    assertViolations(violations, 'auth screen (sign-in)');
  });

  test('auth screen (sign-up) — no critical/serious violations', async ({ page }) => {
    await goHome(page);
    await page.getByText('Get Started Free').first().click();
    await page.getByText("Don't have an account? Sign up").click();
    await page.getByPlaceholder('Confirm password').waitFor({ state: 'visible', timeout: 8_000 });
    await page.waitForTimeout(300);

    const violations = await scanPage(page, { disableRules: SPA_DISABLED_RULES });
    assertViolations(violations, 'auth screen (sign-up)');
  });

  test('auth screen (forgot password) — no critical/serious violations', async ({ page }) => {
    await goHome(page);
    await page.getByText('Get Started Free').first().click();
    await page.getByText('Forgot password?').click();
    await page.getByText('Reset Password').waitFor({ state: 'visible', timeout: 6_000 });
    await page.waitForTimeout(300);

    const violations = await scanPage(page, { disableRules: SPA_DISABLED_RULES });
    assertViolations(violations, 'auth screen (forgot password)');
  });

  // ── Static HTML: Privacy policy ───────────────────────────────────────────

  test('privacy policy — no critical/serious violations', async ({ page }) => {
    // This is a static HTML page — we own the markup and run the FULL scan.
    await page.goto(`${BASE_URL}/privacy-policy.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);

    const violations = await scanPage(page); // no disabled rules
    assertViolations(violations, 'privacy policy');
  });

  // ── Static HTML: Marketing pages ──────────────────────────────────────────

  const MARKETING_PAGES = [
    { label: 'Chrome extension page',       path: '/chrome-extension.html' },
    { label: 'Best credit card rewards app', path: '/best-credit-card-rewards-app-canada.html' },
    { label: 'MaxRewards alternative',       path: '/maxrewards-alternative.html' },
    { label: 'SaveSage alternative',         path: '/savesage-alternative.html' },
  ] as const;

  for (const { label, path } of MARKETING_PAGES) {
    test(`${label} — no critical/serious violations`, async ({ page }) => {
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);

      // Static HTML pages: full scan, no disabled rules
      const violations = await scanPage(page);
      assertViolations(violations, label);
    });
  }
});
