/**
 * Category 2: Feature Smoke Tests
 *
 * Verifies that core sections and screens load and key elements are present.
 * Tests are split into three groups:
 *   1. Landing page  — public, no auth required
 *   2. Auth screen   — public, tests form rendering and input
 *   3. App shell     — requires TEST_EMAIL + TEST_PASSWORD env vars;
 *                      skipped automatically if credentials are absent
 */

import { test, expect, Page } from '@playwright/test';

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = process.env.BASE_URL ?? 'https://rewardly.ca';
const TEST_EMAIL = process.env.TEST_EMAIL ?? '';
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? '';
const HAS_CREDS = TEST_EMAIL !== '' && TEST_PASSWORD !== '';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Navigate to the base URL and wait for the React SPA to render something. */
async function goHome(page: Page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  // Wait for the loading splash to disappear (React has mounted)
  await page.waitForFunction(() => !document.getElementById('app-loading'), {
    timeout: 20_000,
  });
}

/**
 * Log in via the UI and wait for the main tab bar to appear.
 * Calls goHome() first, so the page is always in a clean state.
 */
async function loginViaUI(page: Page) {
  await goHome(page);

  // Landing page → click primary CTA
  await page.getByText('Get Started Free').first().click();
  await page.waitForTimeout(600); // short settle

  // Fill email
  const emailInput = page.getByPlaceholder('Email address');
  await emailInput.waitFor({ state: 'visible', timeout: 10_000 });
  await emailInput.fill(TEST_EMAIL);

  // Fill password
  const passwordInput = page.getByPlaceholder('Password').first();
  await passwordInput.fill(TEST_PASSWORD);

  // Submit
  await page.getByText('Sign In').first().click();

  // Wait until we're inside the app (Home tab or similar becomes visible)
  await page.waitForFunction(
    () => {
      const text = document.body.innerText;
      // Home screen shows reward calculator or "best card" copy
      return (
        text.includes('Rewardly') &&
        !text.includes('Get Started Free') // landing page gone
      );
    },
    { timeout: 20_000 }
  );
}

/** Click a bottom tab by its label text. */
async function clickTab(page: Page, label: string) {
  // Tabs render as pressable elements containing the label text.
  // Try by text match inside the tab bar region.
  const tab = page.getByText(label).last();
  await tab.waitFor({ state: 'visible', timeout: 8_000 });
  await tab.click();
  await page.waitForTimeout(400);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. LANDING PAGE
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await goHome(page);
  });

  test('nav bar renders with logo and Get Started CTA', async ({ page }) => {
    await expect(page.getByText('💳 Rewardly').first()).toBeVisible();
    // Nav CTA (top-right)
    await expect(page.getByText('Get Started').first()).toBeVisible();
  });

  test('hero section renders with key value-prop copy', async ({ page }) => {
    await expect(page.getByText("Canada's #1 Rewards Optimizer")).toBeVisible();
    await expect(page.getByText(/Which Card Earns the Most/i)).toBeVisible();
    await expect(page.getByText('Get Started Free').first()).toBeVisible();
    await expect(page.getByText('Try Demo (no signup)')).toBeVisible();
    await expect(page.getByText(/No credit card required/i)).toBeVisible();
  });

  test('hero stats are present', async ({ page }) => {
    // Use .first() — the stat value appears in multiple container levels
    await expect(page.getByText('$400–800').first()).toBeVisible();
    await expect(page.getByText('more per year').first()).toBeVisible();
    await expect(page.getByText('410+').first()).toBeVisible();
    await expect(page.getByText('Canadian cards').first()).toBeVisible();
  });

  test('features section renders', async ({ page }) => {
    // Section label text appears in multiple ancestor containers; grab first leaf
    await expect(page.getByText('FEATURES', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Maximize Rewards/i).first()).toBeVisible();
  });

  test('pricing section renders with all tiers', async ({ page }) => {
    await expect(page.getByText('PRICING', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Transparent.*Pricing|Simple.*Pricing/i).first()).toBeVisible();
    await expect(page.getByText('Start free. Upgrade when you\'re ready.').first()).toBeVisible();
    // Tier names
    await expect(page.getByText('Free').first()).toBeVisible();
    await expect(page.getByText('Pro').first()).toBeVisible();
  });

  test('footer renders with legal and product links', async ({ page }) => {
    // Logo in footer
    const footerLogo = page.getByText('💳 Rewardly').last();
    await expect(footerLogo).toBeVisible();

    // Column headers
    await expect(page.getByText('Product').first()).toBeVisible();
    await expect(page.getByText('Legal').first()).toBeVisible();
    await expect(page.getByText('Support').first()).toBeVisible();

    // Link items
    await expect(page.getByText('Privacy Policy')).toBeVisible();
    await expect(page.getByText('Terms of Service')).toBeVisible();

    // Copyright line
    await expect(page.getByText(/Rewardly by Motu Inc/i)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. AUTH SCREEN
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Auth screen', () => {
  test.beforeEach(async ({ page }) => {
    await goHome(page);
    await page.getByText('Get Started Free').first().click();
    // Wait for auth screen
    await page.getByPlaceholder('Email address').waitFor({ state: 'visible', timeout: 10_000 });
  });

  test('sign-in form renders with email and password inputs', async ({ page }) => {
    await expect(page.getByPlaceholder('Email address')).toBeVisible();
    await expect(page.getByPlaceholder('Password').first()).toBeVisible();
    await expect(page.getByText('Sign In').first()).toBeVisible();
  });

  test('email and password inputs accept text', async ({ page }) => {
    const email = page.getByPlaceholder('Email address');
    const password = page.getByPlaceholder('Password').first();

    await email.fill('test@example.com');
    await password.fill('hunter2');

    await expect(email).toHaveValue('test@example.com');
    await expect(password).toHaveValue('hunter2');
  });

  test('Google sign-in button is present', async ({ page }) => {
    await expect(page.getByText('Continue with Google')).toBeVisible();
    // Note: Apple Sign-In is only shown on Apple devices/Safari; not tested in Chromium
  });

  test('guest mode button is present', async ({ page }) => {
    await expect(page.getByText('Continue as Guest')).toBeVisible();
  });

  test('can toggle to sign-up mode', async ({ page }) => {
    await page.getByText("Don't have an account? Sign up").click();
    await expect(page.getByPlaceholder('Confirm password')).toBeVisible();
    await expect(page.getByText('Sign Up').first()).toBeVisible();
  });

  test('sign-up confirm-password input accepts text', async ({ page }) => {
    await page.getByText("Don't have an account? Sign up").click();
    const confirm = page.getByPlaceholder('Confirm password');
    await confirm.fill('mypassword');
    await expect(confirm).toHaveValue('mypassword');
  });

  test('can toggle back to sign-in from sign-up', async ({ page }) => {
    await page.getByText("Don't have an account? Sign up").click();
    await page.getByText('Already have an account? Sign in').click();
    // Confirm password should be gone
    await expect(page.getByPlaceholder('Confirm password')).not.toBeVisible();
    await expect(page.getByText('Sign In').first()).toBeVisible();
  });

  test('forgot password link is visible', async ({ page }) => {
    await expect(page.getByText('Forgot password?')).toBeVisible();
  });

  test('forgot password navigates to reset form', async ({ page }) => {
    await page.getByText('Forgot password?').click();
    await expect(page.getByText('Reset Password')).toBeVisible();
    await expect(page.getByText('← Back to Sign In')).toBeVisible();
  });

  test('terms/privacy notice is displayed', async ({ page }) => {
    await expect(page.getByText(/Terms of Service and Privacy Policy/i)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. AUTHENTICATED APP SHELL
// Requires TEST_EMAIL and TEST_PASSWORD env vars. Skipped if absent.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Authenticated app shell', () => {
  test.skip(!HAS_CREDS, 'Skipped: set TEST_EMAIL and TEST_PASSWORD to run authenticated tests');

  let loggedInPage: Page;

  test.beforeEach(async ({ page }) => {
    await loginViaUI(page);
    loggedInPage = page;
  });

  // ── Bottom tab navigation ──────────────────────────────────────────────────

  test('bottom tab bar is visible with all tabs', async ({ page }) => {
    for (const tab of ['Home', 'Insights', 'Sage', 'Wallet', 'My Cards', 'Settings']) {
      await expect(page.getByText(tab).last()).toBeVisible();
    }
  });

  test('Home tab renders rewards calculator', async ({ page }) => {
    await clickTab(page, 'Home');
    // Home screen renders the rewards calculator — should show categories or amount input
    const body = page.locator('body');
    await expect(body).toContainText(/Groceries|Gas|Dining|Best card/i);
  });

  test('Insights tab loads analytics dashboard', async ({ page }) => {
    await clickTab(page, 'Insights');
    await expect(page.locator('body')).toContainText(/Insights|Rewards|Missed|Score/i);
  });

  test('Sage tab loads AI chat screen with chat input', async ({ page }) => {
    await clickTab(page, 'Sage');
    // Sage screen should show a chat input or welcome state
    const body = page.locator('body');
    await expect(body).toContainText(/Sage|chat|Ask|rewards/i);
    // Chat input rendered as <input> or role=textbox
    const chatInput = page.locator('input, [role="textbox"], textarea').last();
    await expect(chatInput).toBeVisible();
  });

  test('Wallet/AutoPilot tab loads', async ({ page }) => {
    await clickTab(page, 'Wallet');
    const body = page.locator('body');
    await expect(body).toContainText(/Smart Wallet|AutoPilot|Wallet|location/i);
  });

  test('My Cards tab loads card portfolio', async ({ page }) => {
    await clickTab(page, 'My Cards');
    const body = page.locator('body');
    await expect(body).toContainText(/Cards|Portfolio|Add card/i);
  });

  test('Settings tab loads profile and preferences', async ({ page }) => {
    await clickTab(page, 'Settings');
    const body = page.locator('body');
    await expect(body).toContainText(/Settings|Account|Sign out|Language|Subscription/i);
  });

  // ── Can navigate between tabs ───────────────────────────────────────────────

  test('can navigate between Home → Sage → Settings tabs', async ({ page }) => {
    await clickTab(page, 'Home');
    await expect(page.locator('body')).toContainText(/Groceries|Gas|Dining|card/i);

    await clickTab(page, 'Sage');
    await expect(page.locator('body')).toContainText(/Sage|Ask|chat/i);

    await clickTab(page, 'Settings');
    await expect(page.locator('body')).toContainText(/Settings|Account|Sign out/i);
  });
});
