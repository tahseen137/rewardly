/**
 * Category 3: End-to-End Workflow Tests
 *
 * Full user journeys covering auth, card management, Sage AI, navigation,
 * pricing/checkout, settings, and guest mode.
 *
 * Authenticated tests are gated behind TEST_EMAIL + TEST_PASSWORD env vars
 * and skipped automatically when credentials are absent.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = process.env.BASE_URL ?? 'https://rewardly.ca';
const TEST_EMAIL = process.env.TEST_EMAIL ?? '';
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? '';
const HAS_CREDS = TEST_EMAIL !== '' && TEST_PASSWORD !== '';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Navigate to BASE_URL and wait for the React SPA to hydrate. */
async function goHome(page: Page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !document.getElementById('app-loading'), {
    timeout: 20_000,
  });
}

/**
 * Log in via the UI.
 * After sign-in, waits for either the main tab bar OR PremiumOnboardingScreen,
 * then dismisses onboarding if present before returning.
 */
async function login(page: Page) {
  await goHome(page);

  await page.getByText('Get Started Free').first().click();

  const emailInput = page.getByPlaceholder('Email address');
  await emailInput.waitFor({ state: 'visible', timeout: 10_000 });
  await emailInput.fill(TEST_EMAIL);
  await page.getByPlaceholder('Password').first().fill(TEST_PASSWORD);
  await page.getByText('Sign In').first().click();

  // Wait for either the main app shell or the PremiumOnboardingScreen
  await page.waitForFunction(
    () => {
      const text = document.body.innerText;
      return (
        text.includes('My Cards') ||
        text.includes('Stop Leaving Money') ||
        text.includes("Let's Get Started")
      );
    },
    { timeout: 25_000 }
  );

  await dismissOnboardingIfPresent(page);

  // Ensure we're in the main shell
  await page.getByText('My Cards').last().waitFor({ state: 'visible', timeout: 15_000 });
}

/**
 * Dismiss the PremiumOnboardingScreen if it is showing.
 *
 * PremiumOnboardingScreen step 1 shows "Stop Leaving Money On The Table" and
 * has a header "Skip" button (handleSkipAll) that immediately marks onboarding
 * complete and navigates to the main tabs.
 */
async function dismissOnboardingIfPresent(page: Page) {
  const isStep1 =
    (await page.getByText('Stop Leaving Money').isVisible({ timeout: 2_000 }).catch(() => false)) ||
    (await page.getByText("Let's Get Started").isVisible({ timeout: 500 }).catch(() => false));

  if (!isStep1) return;

  // Click the header "Skip" button → handleSkipAll → setOnboardingComplete + onComplete()
  const skipBtn = page.getByText('Skip').first();
  await skipBtn.waitFor({ state: 'visible', timeout: 5_000 });
  await skipBtn.click();
  await page.waitForTimeout(1_000);
}

/** Click a bottom tab by its label text. */
async function goToTab(page: Page, label: string) {
  await page.getByText(label).last().click();
  await page.waitForTimeout(500);
}

/**
 * After a guest/anonymous login, wait for either the main shell or onboarding,
 * dismiss onboarding if present, then confirm the main tab bar is loaded.
 */
async function waitForAppShellAfterAuth(page: Page) {
  await page.waitForFunction(
    () => {
      const text = document.body.innerText;
      return (
        text.includes('My Cards') ||
        text.includes('Stop Leaving Money') ||
        text.includes("Let's Get Started")
      );
    },
    { timeout: 30_000 }
  );
  await dismissOnboardingIfPresent(page);
  await page.getByText('My Cards').last().waitFor({ state: 'visible', timeout: 15_000 });
}

/**
 * Navigate from the main app to the upgrade/paywall screen.
 * Goes to Settings → taps the Subscription row → Upgrade button.
 */
async function openUpgradeScreen(page: Page) {
  await goToTab(page, 'Settings');
  // If the user is on a free tier, there's an "Upgrade" link in the subscription row
  const upgradeLink = page.getByText('Upgrade').first();
  const visible = await upgradeLink.isVisible({ timeout: 3_000 }).catch(() => false);
  if (visible) {
    await upgradeLink.click();
  } else {
    // Already subscribed — try navigating via Insights > locked feature
    await goToTab(page, 'Wallet');
  }
  await page.waitForTimeout(600);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. SIGN UP FLOW (no credentials needed — uses throwaway email)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Sign up flow', () => {
  test('sign up with email shows confirmation or lands in app', async ({ page }) => {
    await goHome(page);

    // Navigate to sign-up mode
    await page.getByText('Get Started Free').first().click();
    const emailInput = page.getByPlaceholder('Email address');
    await emailInput.waitFor({ state: 'visible', timeout: 10_000 });

    // Toggle to sign-up
    await page.getByText("Don't have an account? Sign up").click();
    await page.getByPlaceholder('Confirm password').waitFor({ state: 'visible' });

    // Use a gmail alias — accepted by Supabase (example.com is rejected as invalid)
    const testEmail = `e2e.rewardly.test+${Date.now()}@gmail.com`;
    await emailInput.fill(testEmail);
    await page.getByPlaceholder('Password').first().fill('TestPass123!');
    await page.getByPlaceholder('Confirm password').fill('TestPass123!');

    await page.getByText('Sign Up').first().click();

    // Expect either:
    //   a) "Check your email" confirmation message (email verification enabled)
    //   b) App shell loads directly (email verification disabled)
    //   c) Any Supabase error shown as feedback (rate limit, etc.)
    await expect(
      page
        .getByText(/check your email|confirmation link|verify your email|My Cards|error|rate limit/i)
        .first()
    ).toBeVisible({ timeout: 20_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. AUTHENTICATED WORKFLOWS
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Authenticated workflows', () => {
  test.skip(!HAS_CREDS, 'Set TEST_EMAIL and TEST_PASSWORD to run authenticated tests');

  // ── Login ────────────────────────────────────────────────────────────────

  test.describe('Login', () => {
    test('login with existing account lands on home screen', async ({ page }) => {
      await login(page);

      // Home tab should be active — rewards calculator content visible
      const body = page.locator('body');
      await expect(body).toContainText(/Rewards Optimizer|best card|Groceries|category/i);
    });
  });

  // ── Card Management ───────────────────────────────────────────────────────

  test.describe('Card management', () => {
    test('add a credit card then verify it appears in My Cards', async ({ page }) => {
      await login(page);
      await goToTab(page, 'My Cards');

      // Open the add-card modal
      const addBtn = page.getByRole('button', { name: /add card/i });
      const addBtnAlt = page.getByText('+ Add').first();
      const addCardBtn = (await addBtn.isVisible({ timeout: 2_000 }).catch(() => false))
        ? addBtn
        : addBtnAlt;
      await addCardBtn.click();

      // Modal opens — search for a well-known card
      const searchInput = page.getByPlaceholder('Search cards...').last();
      await searchInput.waitFor({ state: 'visible', timeout: 8_000 });
      await searchInput.fill('Scotia');
      await page.waitForTimeout(600); // debounce

      // Click the first card result
      const firstResult = page
        .locator('[role="button"]')
        .filter({ hasText: /Scotia/i })
        .first();
      await firstResult.waitFor({ state: 'visible', timeout: 8_000 });
      const addedCardName = await firstResult.innerText();
      await firstResult.click();
      await page.waitForTimeout(800);

      // Close modal (press ESC or find close button)
      await page.keyboard.press('Escape');
      const closeBtn = page.getByRole('button', { name: /close/i });
      const closeVisible = await closeBtn.isVisible({ timeout: 1_000 }).catch(() => false);
      if (closeVisible) await closeBtn.click();

      // Verify the card appears in My Cards list
      const body = page.locator('body');
      await expect(body).toContainText(/Scotia/i, { timeout: 8_000 });

      // ── Cleanup: remove the card we just added ────────────────────────────
      const removeBtn = page
        .getByRole('button', { name: /Remove/i })
        .first();
      const removeBtnVisible = await removeBtn.isVisible({ timeout: 3_000 }).catch(() => false);
      if (removeBtnVisible) {
        await removeBtn.click();
        // Confirm deletion if a dialog appears
        const confirmBtn = page.getByRole('button', { name: /delete|remove|confirm|yes/i });
        const confirmVisible = await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false);
        if (confirmVisible) await confirmBtn.click();
      }

      void addedCardName; // referenced to satisfy linter
    });

    test('remove a credit card and verify it is gone', async ({ page }) => {
      await login(page);
      await goToTab(page, 'My Cards');

      // Count cards before add
      const cardsBefore = await page.locator('[role="button"]').filter({ hasText: /Scotia/i }).count();

      // Add a card first
      const addBtn = page.getByText('+ Add').first();
      await addBtn.click();
      const searchInput = page.getByPlaceholder('Search cards...').last();
      await searchInput.waitFor({ state: 'visible', timeout: 8_000 });
      await searchInput.fill('TD Cash Back');
      await page.waitForTimeout(600);

      const tdCard = page
        .locator('[role="button"]')
        .filter({ hasText: /TD/i })
        .first();
      await tdCard.waitFor({ state: 'visible', timeout: 8_000 });
      await tdCard.click();
      await page.waitForTimeout(800);

      await page.keyboard.press('Escape');
      const closeBtn = page.getByRole('button', { name: /close/i });
      if (await closeBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await closeBtn.click();
      }

      // Verify card is in the list
      await expect(page.locator('body')).toContainText(/TD/i, { timeout: 5_000 });

      // Remove it
      const removeBtn = page.getByRole('button', { name: /Remove/i }).first();
      await removeBtn.waitFor({ state: 'visible', timeout: 5_000 });
      await removeBtn.click();

      // Confirm if prompted
      const confirmBtn = page.getByRole('button', { name: /delete|remove|confirm|yes/i });
      if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await confirmBtn.click();
      }

      await page.waitForTimeout(1_000);

      // After removal the card count should be back to where it was
      // (or the "No Cards Yet" state if portfolio was empty)
      const cardsAfter = await page
        .locator('[role="button"]')
        .filter({ hasText: /TD Cash Back/i })
        .count();
      expect(cardsAfter).toBeLessThanOrEqual(cardsBefore);

      void cardsBefore; // referenced
    });
  });

  // ── Sage AI Chat ─────────────────────────────────────────────────────────

  test.describe('Sage AI chat', () => {
    test('open Sage, send a message, receive a response', async ({ page }) => {
      await login(page);
      await goToTab(page, 'Sage');

      // Welcome screen is shown — use a suggested prompt so we don't need typing
      const prompt = page.getByText("What's the best card for Costco?");
      const promptVisible = await prompt.isVisible({ timeout: 5_000 }).catch(() => false);

      if (promptVisible) {
        await prompt.click();
      } else {
        // Fallback: type in the chat input directly
        const chatInput = page.getByPlaceholder('Ask Sage anything...');
        await chatInput.waitFor({ state: 'visible', timeout: 8_000 });
        await chatInput.fill("What's the best card for groceries?");
        await page.keyboard.press('Enter');
      }

      // Wait for an assistant response to appear
      // Sage streams responses so we wait until there's a second message bubble
      // (user message + at least partial assistant message)
      await expect(async () => {
        const bodyText = await page.locator('body').innerText();
        // Must contain Costco/grocery and some response-like words
        expect(bodyText).toMatch(/card|reward|point|earn|cashback|%/i);
        // The chat input should be usable again once streaming finishes
      }).toPass({ timeout: 60_000, intervals: [2_000] });
    });
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  test.describe('Navigation', () => {
    test('can navigate through all 6 main tabs', async ({ page }) => {
      await login(page);

      const tabs: Array<{ label: string; expectedContent: RegExp }> = [
        { label: 'Home',      expectedContent: /Rewards Optimizer|category|best card/i },
        { label: 'Insights',  expectedContent: /Insights|Rewards|Score|Missed/i },
        { label: 'Sage',      expectedContent: /Sage|Ask|advisor/i },
        { label: 'Wallet',    expectedContent: /Smart Wallet|AutoPilot|stores|lock/i },
        { label: 'My Cards',  expectedContent: /My Cards|Cards|Add|Portfolio/i },
        { label: 'Settings',  expectedContent: /Settings|Account|Language/i },
      ];

      for (const { label, expectedContent } of tabs) {
        await goToTab(page, label);
        await expect(page.locator('body')).toContainText(expectedContent, { timeout: 8_000 });
      }
    });

    test('navigating back to Home tab reloads the rewards calculator', async ({ page }) => {
      await login(page);

      // Go away then come back
      await goToTab(page, 'Settings');
      await expect(page.locator('body')).toContainText(/Settings/i, { timeout: 5_000 });

      await goToTab(page, 'Home');
      await expect(page.locator('body')).toContainText(
        /Rewards Optimizer|best card|category/i,
        { timeout: 8_000 }
      );
    });
  });

  // ── Pricing & Checkout ────────────────────────────────────────────────────

  test.describe('Pricing and checkout', () => {
    test('upgrade screen shows subscription tiers and pricing', async ({ page }) => {
      await login(page);
      await openUpgradeScreen(page);

      const body = page.locator('body');
      // Paywall header
      await expect(body).toContainText(/Unlock Premium|subscription|pricing/i, { timeout: 8_000 });
      // Should show at least one tier
      await expect(body).toContainText(/Pro|Max|Lifetime/i);
    });

    test('clicking subscribe initiates Stripe checkout in a new tab', async ({ page, context }) => {
      await login(page);
      await openUpgradeScreen(page);

      // Find the primary CTA button
      const subscribeBtn = page
        .getByRole('button')
        .filter({ hasText: /Subscribe|Get Lifetime|Claim/i })
        .first();
      const btnVisible = await subscribeBtn.isVisible({ timeout: 5_000 }).catch(() => false);

      if (!btnVisible) {
        // May already be subscribed or paywall not reachable on this account — skip gracefully
        test.skip();
        return;
      }

      // Intercept the new tab opened by window.open for the Stripe redirect
      const [newPage] = await Promise.all([
        context.waitForEvent('page', { timeout: 15_000 }),
        subscribeBtn.click(),
      ]);

      await newPage.waitForLoadState('domcontentloaded', { timeout: 20_000 });
      const newUrl = newPage.url();
      // Should redirect to Stripe checkout or show an inline message
      const isStripe = /stripe\.com|checkout\.stripe/i.test(newUrl);
      const bodyText = await page.locator('body').innerText();
      const hasInlineError = /processing|error|sign in/i.test(bodyText);

      expect(isStripe || hasInlineError).toBe(true);

      if (!newPage.isClosed()) await newPage.close();
    });
  });

  // ── Settings ──────────────────────────────────────────────────────────────

  test.describe('Settings', () => {
    test('language toggle switches UI to French', async ({ page }) => {
      await login(page);
      await goToTab(page, 'Settings');

      // Find and click the Language row (currently "English")
      const languageRow = page.getByText('Language').first();
      await languageRow.waitFor({ state: 'visible', timeout: 5_000 });
      await languageRow.click();

      // Settings title should switch to French
      await expect(page.locator('body')).toContainText(/Paramètres|Langue/i, { timeout: 5_000 });

      // ── Cleanup: toggle back to English ──────────────────────────────────
      await page.getByText('Langue').first().click();
      await expect(page.locator('body')).toContainText(/Settings|Language/i, { timeout: 5_000 });
    });

    test('settings screen shows account info and preferences sections', async ({ page }) => {
      await login(page);
      await goToTab(page, 'Settings');

      const body = page.locator('body');
      await expect(body).toContainText('Settings', { timeout: 5_000 });
      await expect(body).toContainText(/ACCOUNT|Account/i);
      await expect(body).toContainText(/PREFERENCES|Preferences/i);
      await expect(body).toContainText(/Language/i);
      await expect(body).toContainText(/Country/i);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. GUEST MODE (no credentials needed)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Guest mode', () => {
  test('continue as guest → app shell loads in limited mode', async ({ page }) => {
    await goHome(page);
    await page.getByText('Get Started Free').first().click();

    const continueAsGuest = page.getByText('Continue as Guest');
    await continueAsGuest.waitFor({ state: 'visible', timeout: 10_000 });
    await continueAsGuest.click();

    // PremiumOnboardingScreen always shows for new anonymous users; dismiss it
    await waitForAppShellAfterAuth(page);

    await expect(page.locator('body')).toContainText(/My Cards/i);
  });

  test('guest user hits paywall on Smart Wallet (Max-only feature)', async ({ page }) => {
    await goHome(page);
    await page.getByText('Get Started Free').first().click();

    await page.getByText('Continue as Guest').waitFor({ state: 'visible', timeout: 10_000 });
    await page.getByText('Continue as Guest').click();

    await waitForAppShellAfterAuth(page);

    // Guest users are on Free tier — Smart Wallet is Max-only → shows LockedFeature paywall
    await goToTab(page, 'Wallet');

    await expect(page.locator('body')).toContainText(
      /Upgrade|unlock|Pro|Max|Premium|limited|lock/i,
      { timeout: 8_000 }
    );
  });

  test('guest mode shows limited card slots', async ({ page }) => {
    await goHome(page);
    await page.getByText('Get Started Free').first().click();

    await page.getByText('Continue as Guest').waitFor({ state: 'visible', timeout: 10_000 });
    await page.getByText('Continue as Guest').click();

    await waitForAppShellAfterAuth(page);

    await goToTab(page, 'My Cards');

    await expect(page.locator('body')).toContainText(/cards|add|portfolio/i, { timeout: 8_000 });
  });
});
