/**
 * Category 4: Visual Regression Tests
 *
 * Captures viewport screenshots of key landing-page sections and the auth
 * screen, then compares them against stored baselines on every subsequent
 * run.  Any layout break, missing element, or style change will fail here.
 *
 * Baselines live next to this file in visual.spec.ts-snapshots/.
 * To regenerate them:  npx playwright test tests/e2e/visual.spec.ts --update-snapshots
 *
 * Notes on the React Native Web rendering model:
 *  - `document.body` has `overflow: hidden`; scrolling happens inside an RN
 *    ScrollView div.  `fullPage: true` would only capture the 1280×720
 *    viewport, so we scroll each section into view before snapshotting.
 *  - Entrance animations (Animated.timing, 600–800 ms) run via the JS thread
 *    and are NOT paused by `prefers-reduced-motion`.  We wait for them to
 *    settle with targeted delays.
 *  - The only dynamic value on the landing page is the copyright year in the
 *    footer.  We mask that locator in every footer snapshot.
 */

import { test, expect, Page } from '@playwright/test';

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = process.env.BASE_URL ?? 'https://rewardly.ca';

// Per-test screenshot options.  Global defaults live in playwright.config.ts.
const SNAP = {
  // Tighter diff for colour-only checks (icons, gradients)
  strict: { maxDiffPixelRatio: 0.01 },
  // Standard for layout checks
  normal: { maxDiffPixelRatio: 0.03 },
  // Looser for sections with many small text elements (anti-aliasing variance)
  loose:  { maxDiffPixelRatio: 0.05 },
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Navigate to BASE_URL, wait for the React SPA to hydrate and the loading
 * splash to disappear, then settle any entrance animations (1 s).
 */
async function goHome(page: Page) {
  // signal reduced-motion preference — catches any CSS-level animations
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !document.getElementById('app-loading'), {
    timeout: 20_000,
  });
  // JS-driven Animated.timing animations: hero ~800 ms, staggered cards ~1 250 ms
  await page.waitForTimeout(1_300);
}

/**
 * Scroll a text string into view inside the React Native ScrollView container
 * (which is the first overflow-auto div in the page).
 */
async function scrollToText(page: Page, text: string, extraWait = 600) {
  const el = page.getByText(text).first();
  await el.waitFor({ state: 'visible', timeout: 10_000 });

  // scrollIntoViewIfNeeded scrolls the nearest scrollable ancestor (the RN ScrollView)
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(extraWait);
}

/** Locator for the copyright year — the only dynamic value on the page. */
const copyrightMask = (page: Page) => page.getByText(/© \d{4}/);

// ─────────────────────────────────────────────────────────────────────────────
// VISUAL TESTS
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Visual regression — Landing page', () => {
  // Each test gets a fresh page; navigation + animation wait done per test.

  test('hero section — above the fold', async ({ page }) => {
    await goHome(page);
    // Hero is the first thing visible; no extra scroll needed.
    await expect(page).toHaveScreenshot('landing-hero.png', SNAP.normal);
  });

  test('nav bar — logo and CTA button', async ({ page }) => {
    await goHome(page);
    // Clip to just the nav bar height (~72 px)
    await expect(page).toHaveScreenshot('landing-nav.png', {
      ...SNAP.strict,
      clip: { x: 0, y: 0, width: 1280, height: 80 },
    });
  });

  test('features section — cards and section label', async ({ page }) => {
    await goHome(page);
    await scrollToText(page, 'FEATURES', 800); // wait for staggered card fade-in
    await expect(page).toHaveScreenshot('landing-features.png', SNAP.loose);
  });

  test('how it works section', async ({ page }) => {
    await goHome(page);
    await scrollToText(page, 'HOW IT WORKS');
    await expect(page).toHaveScreenshot('landing-how-it-works.png', SNAP.normal);
  });

  test('pricing section — tier cards', async ({ page }) => {
    await goHome(page);
    await scrollToText(page, 'PRICING');
    await expect(page).toHaveScreenshot('landing-pricing.png', SNAP.normal);
  });

  test('footer — links and branding', async ({ page }) => {
    await goHome(page);
    await scrollToText(page, 'Privacy Policy');
    await expect(page).toHaveScreenshot('landing-footer.png', {
      ...SNAP.normal,
      mask: [copyrightMask(page)],
    });
  });

  test('full above-the-fold viewport (1280×720)', async ({ page }) => {
    await goHome(page);
    // Straight viewport shot — captures nav + hero together
    await expect(page).toHaveScreenshot('landing-viewport-top.png', SNAP.normal);
  });
});

test.describe('Visual regression — Auth screen', () => {
  async function openAuth(page: Page) {
    await goHome(page);
    await page.getByText('Get Started Free').first().click();
    await page.getByPlaceholder('Email address').waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(400);
  }

  test('sign-in form', async ({ page }) => {
    await openAuth(page);
    await expect(page).toHaveScreenshot('auth-signin.png', SNAP.normal);
  });

  test('sign-up form (confirm password visible)', async ({ page }) => {
    await openAuth(page);
    await page.getByText("Don't have an account? Sign up").click();
    await page.getByPlaceholder('Confirm password').waitFor({ state: 'visible' });
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('auth-signup.png', SNAP.normal);
  });

  test('forgot password form', async ({ page }) => {
    await openAuth(page);
    await page.getByText('Forgot password?').click();
    await page.getByText('Reset Password').waitFor({ state: 'visible' });
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('auth-forgot-password.png', SNAP.normal);
  });
});
