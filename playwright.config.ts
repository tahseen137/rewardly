import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: process.env.BASE_URL ?? 'https://rewardly.ca',
    trace: 'on-first-retry',
    // Give SPA time to render
    actionTimeout: 15_000,
    screenshot: 'only-on-failure',
  },

  expect: {
    // Visual regression defaults — lenient enough for anti-aliasing + sub-pixel
    // differences across platforms while still catching real layout breaks.
    toHaveScreenshot: {
      // Up to 3% of pixels may differ (covers font-hinting, GPU rasterization)
      maxDiffPixelRatio: 0.03,
      // Per-pixel colour tolerance (0–1); 0.15 covers minor gamma differences
      threshold: 0.15,
      animations: 'disabled',
    },
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
});
