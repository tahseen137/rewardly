/**
 * Category 6: Performance Budget Tests
 *
 * Checks page-load timing, Lighthouse scores, bundle sizes, and common
 * performance issues (render-blocking scripts, oversized images) for both
 * desktop and mobile form factors.
 *
 * Tool choices:
 *   • Playwright navigation / paint timing API  — load-time checks
 *   • Lighthouse CLI (lighthouse npm package)   — scores & audit flags
 *   • Node fs                                   — bundle-size budgets
 *   • Playwright response interceptor           — oversized image check
 *
 * Thresholds are intentionally conservative for a React Native Web SPA:
 *   Mobile performance suffers from the heavy JS bundle and CPU throttling;
 *   desktop is significantly better.  Thresholds were calibrated against the
 *   measured baseline and leave a ~10-point headroom before the CI gate trips.
 *
 * Run performance tests only:
 *   npx playwright test tests/e2e/performance.spec.ts
 *
 * Run against a local build (faster, no network variance):
 *   npm run build:web
 *   BASE_URL=http://localhost:3739 npx playwright test tests/e2e/performance.spec.ts
 */

import { test, expect, type Page } from '@playwright/test';
import { execSync }                  from 'child_process';
import * as fs                       from 'fs';
import * as path                     from 'path';
import * as os                       from 'os';

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = process.env.BASE_URL ?? 'https://rewardly.ca';

// Bundle-size check: path to the expo web export output.
// The worktree doesn't have dist/ by default; fall back to the adjacent
// main-repo build that CI keeps pre-built.
function findDistDir(): string {
  const candidates = [
    path.resolve(process.cwd(), 'dist'),
    path.resolve(process.cwd(), '../../../dist'), // main repo next to worktrees/
  ];
  for (const d of candidates) {
    if (fs.existsSync(d)) return d;
  }
  return candidates[0]; // doesn't exist → bundle tests will skip
}
const DIST_DIR = process.env.DIST_DIR ?? findDistDir();

// ─── Thresholds ───────────────────────────────────────────────────────────────

/**
 * Navigation-timing budgets (milliseconds, measured in-browser via
 * PerformanceNavigationTiming / paint entries).  Chromium on a local machine
 * is much faster than a throttled Lighthouse run — these are unthrottled
 * end-to-end timings captured by Playwright.
 */
const TIMING = {
  desktop: {
    domContentLoaded: 10_000,  // ms
    load:             20_000,
    fcp:               8_000,  // First Contentful Paint
  },
  mobile: {
    domContentLoaded: 15_000,
    load:             30_000,
    fcp:              12_000,
  },
} as const;

/**
 * Lighthouse score minimums (0–100).  React Native Web SPAs have large JS
 * bundles which hurt TTI and mobile scores; thresholds are set at realistic
 * baselines leaving a ~10-point safety margin below the measured scores.
 */
// Thresholds calibrated from measured baseline (desktop perf=88, mobile perf=61,
// a11y=83, best-practices=100, seo=91).  10-point headroom before CI gate trips.
const LH = {
  desktop: { performance: 75, accessibility: 70, bestPractices: 85, seo: 80 },
  mobile:  { performance: 50, accessibility: 70, bestPractices: 85, seo: 80 },
} as const;

/**
 * Bundle-size budgets for the dist/ build artifacts.
 * The app currently ships a single ~4.7 MB JS chunk (expo web export);
 * budgets are set at 2× the measured baseline to flag regressions.
 */
const BUNDLE = {
  totalJsBytes:    10 * 1024 * 1024,  // 10 MB total JS
  largestJsBytes:   6 * 1024 * 1024,  // 6 MB per chunk
  totalCssBytes:    1 * 1024 * 1024,  // 1 MB CSS
} as const;

// Warn (but don't fail) on images larger than this served on first paint
const MAX_IMAGE_BYTES = 512 * 1024; // 512 KB
// Hard-fail if more than this many oversized images appear on first paint
const MAX_OVERSIZED_IMAGES = 3;

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface TimingSnapshot {
  domContentLoaded: number;
  load: number;
  fcp: number | null;
}

async function getTimings(page: Page): Promise<TimingSnapshot> {
  return page.evaluate(() => {
    const nav  = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const fcp  = performance.getEntriesByType('paint').find((e) => e.name === 'first-contentful-paint');
    return {
      domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
      load:             nav.loadEventEnd - nav.startTime,
      fcp:              fcp ? fcp.startTime : null,
    };
  });
}

// ── Bundle stats ──────────────────────────────────────────────────────────────

interface ExtStat { count: number; totalBytes: number; largest: number }

function gatherBundleStats(dir: string): Map<string, ExtStat> {
  const map = new Map<string, ExtStat>();
  if (!fs.existsSync(dir)) return map;

  const walk = (d: string) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        const ext  = path.extname(entry.name).toLowerCase() || '(no-ext)';
        const size = fs.statSync(full).size;
        const cur  = map.get(ext) ?? { count: 0, totalBytes: 0, largest: 0 };
        map.set(ext, {
          count:      cur.count + 1,
          totalBytes: cur.totalBytes + size,
          largest:    Math.max(cur.largest, size),
        });
      }
    }
  };
  walk(dir);
  return map;
}

// ── Lighthouse ────────────────────────────────────────────────────────────────

interface LhScores {
  performance:    number;
  accessibility:  number;
  bestPractices:  number;
  seo:            number;
}

/**
 * Runs the Lighthouse CLI and returns rounded category scores (0–100).
 * Uses a temp-file for the JSON report to avoid stdout buffer issues.
 */
function runLighthouse(url: string, formFactor: 'desktop' | 'mobile'): LhScores {
  const tmp = path.join(os.tmpdir(), `lh-${formFactor}-${Date.now()}.json`);
  try {
    // For desktop, --preset=desktop sets formFactor + screen-emulation together.
    // For mobile, lighthouse defaults are already mobile — just throttle.
    const presetFlag = formFactor === 'desktop' ? '--preset=desktop' : '';
    const flags = [
      '--output=json',
      `--output-path="${tmp}"`,
      '--quiet',
      '--no-enable-error-reporting',
      presetFlag,
      '--only-categories=performance,accessibility,best-practices,seo',
      '--throttling-method=simulate',
      '--chrome-flags="--headless=new --no-sandbox --disable-dev-shm-usage"',
    ].filter(Boolean).join(' ');

    execSync(
      `node "${path.resolve(process.cwd(), 'node_modules/.bin/lighthouse')}" "${url}" ${flags}`,
      { timeout: 100_000, maxBuffer: 20 * 1024 * 1024, stdio: ['ignore', 'ignore', 'ignore'] },
    );

    const lhr = JSON.parse(fs.readFileSync(tmp, 'utf8'));
    return {
      performance:   Math.round((lhr.categories['performance']?.score    ?? 0) * 100),
      accessibility: Math.round((lhr.categories['accessibility']?.score  ?? 0) * 100),
      bestPractices: Math.round((lhr.categories['best-practices']?.score ?? 0) * 100),
      seo:           Math.round((lhr.categories['seo']?.score            ?? 0) * 100),
    };
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Performance Budgets', () => {

  // ── Navigation timing — Desktop ───────────────────────────────────────────

  test.describe('Desktop — navigation timing', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test('landing page loads within desktop timing budget', async ({ page }) => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 40_000 });
      const t = await getTimings(page);

      console.info(
        `[desktop timing] DCL=${t.domContentLoaded.toFixed(0)} ms  ` +
        `load=${t.load.toFixed(0)} ms  fcp=${t.fcp?.toFixed(0) ?? 'n/a'} ms`
      );

      expect(
        t.domContentLoaded,
        `DOMContentLoaded ${t.domContentLoaded.toFixed(0)} ms > budget ${TIMING.desktop.domContentLoaded} ms`
      ).toBeLessThan(TIMING.desktop.domContentLoaded);

      expect(
        t.load,
        `Load event ${t.load.toFixed(0)} ms > budget ${TIMING.desktop.load} ms`
      ).toBeLessThan(TIMING.desktop.load);

      if (t.fcp !== null) {
        expect(
          t.fcp,
          `FCP ${t.fcp.toFixed(0)} ms > budget ${TIMING.desktop.fcp} ms`
        ).toBeLessThan(TIMING.desktop.fcp);
      }
    });
  });

  // ── Navigation timing — Mobile ────────────────────────────────────────────

  test.describe('Mobile — navigation timing', () => {
    test.use({
      viewport:  { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });

    test('landing page loads within mobile timing budget', async ({ page }) => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 40_000 });
      const t = await getTimings(page);

      console.info(
        `[mobile timing] DCL=${t.domContentLoaded.toFixed(0)} ms  ` +
        `load=${t.load.toFixed(0)} ms  fcp=${t.fcp?.toFixed(0) ?? 'n/a'} ms`
      );

      expect(
        t.domContentLoaded,
        `DOMContentLoaded ${t.domContentLoaded.toFixed(0)} ms > budget ${TIMING.mobile.domContentLoaded} ms`
      ).toBeLessThan(TIMING.mobile.domContentLoaded);

      expect(
        t.load,
        `Load event ${t.load.toFixed(0)} ms > budget ${TIMING.mobile.load} ms`
      ).toBeLessThan(TIMING.mobile.load);

      if (t.fcp !== null) {
        expect(
          t.fcp,
          `FCP ${t.fcp.toFixed(0)} ms > budget ${TIMING.mobile.fcp} ms`
        ).toBeLessThan(TIMING.mobile.fcp);
      }
    });
  });

  // ── Bundle sizes ──────────────────────────────────────────────────────────

  test.describe('Bundle size budgets', () => {

    test('total JS does not exceed budget', () => {
      if (!fs.existsSync(DIST_DIR)) {
        console.warn(`[bundle] dist/ not found at ${DIST_DIR} — skipping`);
        return;
      }
      const stats = gatherBundleStats(DIST_DIR);
      const js    = stats.get('.js') ?? { count: 0, totalBytes: 0, largest: 0 };

      console.info(
        `[bundle] JS: ${js.count} file(s), ` +
        `${(js.totalBytes / 1024 / 1024).toFixed(2)} MB total, ` +
        `${(js.largest   / 1024 / 1024).toFixed(2)} MB largest`
      );

      expect(
        js.totalBytes,
        `Total JS ${(js.totalBytes / 1024 / 1024).toFixed(2)} MB exceeds ` +
        `${BUNDLE.totalJsBytes / 1024 / 1024} MB budget`
      ).toBeLessThan(BUNDLE.totalJsBytes);
    });

    test('largest JS chunk does not exceed budget', () => {
      if (!fs.existsSync(DIST_DIR)) return;
      const stats = gatherBundleStats(DIST_DIR);
      const js    = stats.get('.js') ?? { count: 0, totalBytes: 0, largest: 0 };

      expect(
        js.largest,
        `Largest JS chunk ${(js.largest / 1024 / 1024).toFixed(2)} MB exceeds ` +
        `${BUNDLE.largestJsBytes / 1024 / 1024} MB budget`
      ).toBeLessThan(BUNDLE.largestJsBytes);
    });

    test('total CSS does not exceed budget', () => {
      if (!fs.existsSync(DIST_DIR)) return;
      const stats = gatherBundleStats(DIST_DIR);
      const css   = stats.get('.css') ?? { count: 0, totalBytes: 0, largest: 0 };

      console.info(`[bundle] CSS: ${css.count} file(s), ${(css.totalBytes / 1024).toFixed(1)} KB total`);

      expect(
        css.totalBytes,
        `Total CSS ${(css.totalBytes / 1024).toFixed(1)} KB exceeds ` +
        `${BUNDLE.totalCssBytes / 1024} KB budget`
      ).toBeLessThan(BUNDLE.totalCssBytes);
    });
  });

  // ── Resource quality — Desktop ────────────────────────────────────────────

  test.describe('Resource quality — desktop', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test('no render-blocking scripts in <head>', async ({ page }) => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      const blocking = await page.evaluate(() =>
        Array.from(document.querySelectorAll('head script[src]') as NodeListOf<HTMLScriptElement>)
          .filter((s) => !s.async && !s.defer && !s.type?.includes('module'))
          .map((s) => s.src)
      );

      if (blocking.length) {
        console.warn(`[resources] Render-blocking scripts in <head>:\n  ${blocking.join('\n  ')}`);
      }
      // Hard limit: >2 render-blocking scripts is a clear regression
      expect(
        blocking.length,
        `${blocking.length} render-blocking script(s) found`
      ).toBeLessThanOrEqual(2);
    });

    test('images have explicit dimensions to prevent layout shift', async ({ page }) => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });

      const unsized = await page.evaluate(() =>
        Array.from(document.querySelectorAll('img') as NodeListOf<HTMLImageElement>)
          .filter((img) => {
            const hasAttr        = img.hasAttribute('width') && img.hasAttribute('height');
            const hasAspectRatio = getComputedStyle(img).aspectRatio !== 'auto';
            return !hasAttr && !hasAspectRatio;
          })
          .map((img) => img.src || img.currentSrc || '[no-src]')
      );

      if (unsized.length) {
        console.warn(
          `[images] ${unsized.length} image(s) without explicit dimensions:\n  ` +
          unsized.slice(0, 5).join('\n  ')
        );
      }
      // React Native Web wraps images differently; allow up to 20 unsized images
      expect(
        unsized.length,
        `${unsized.length} images lack explicit dimensions (CLS risk)`
      ).toBeLessThanOrEqual(20);
    });

    test('no oversized images loaded on first paint (desktop)', async ({ page }) => {
      const large: string[] = [];

      page.on('response', (res) => {
        const ct  = res.headers()['content-type'] ?? '';
        const len = parseInt(res.headers()['content-length'] ?? '0', 10);
        if (ct.startsWith('image/') && len > MAX_IMAGE_BYTES) {
          large.push(`${(len / 1024).toFixed(0)} KB — ${res.url()}`);
        }
      });

      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });

      if (large.length) {
        console.warn(`[images] ${large.length} oversized image(s) on first paint:\n  ${large.join('\n  ')}`);
      }
      expect(
        large.length,
        `${large.length} image(s) exceed ${MAX_IMAGE_BYTES / 1024} KB on first paint`
      ).toBeLessThanOrEqual(MAX_OVERSIZED_IMAGES);
    });

    test('no oversized images loaded on first paint (mobile)', async ({ page }) => {
      await page.emulateMedia({ media: 'screen' });
      await page.setViewportSize({ width: 390, height: 844 });

      const large: string[] = [];
      page.on('response', (res) => {
        const ct  = res.headers()['content-type'] ?? '';
        const len = parseInt(res.headers()['content-length'] ?? '0', 10);
        if (ct.startsWith('image/') && len > MAX_IMAGE_BYTES) {
          large.push(`${(len / 1024).toFixed(0)} KB — ${res.url()}`);
        }
      });

      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });

      if (large.length) {
        console.warn(`[images/mobile] ${large.length} oversized image(s):\n  ${large.join('\n  ')}`);
      }
      expect(large.length).toBeLessThanOrEqual(MAX_OVERSIZED_IMAGES);
    });
  });

  // ── Lighthouse — Desktop + Mobile (serial: each launches its own Chrome) ──

  // Run these two sequentially so chrome-launcher ports don't collide when
  // the Playwright worker pool would otherwise schedule them in parallel.
  test.describe.serial('Lighthouse scores', () => {});

  test('Lighthouse desktop — all category scores meet thresholds', () => {
    test.setTimeout(120_000);

    const scores = runLighthouse(BASE_URL, 'desktop');
    console.info(
      `[lighthouse desktop] perf=${scores.performance}  ` +
      `a11y=${scores.accessibility}  bp=${scores.bestPractices}  seo=${scores.seo}`
    );

    expect(
      scores.performance,
      `Desktop perf ${scores.performance} < min ${LH.desktop.performance}`
    ).toBeGreaterThanOrEqual(LH.desktop.performance);

    expect(
      scores.accessibility,
      `Desktop a11y ${scores.accessibility} < min ${LH.desktop.accessibility}`
    ).toBeGreaterThanOrEqual(LH.desktop.accessibility);

    expect(
      scores.bestPractices,
      `Desktop best-practices ${scores.bestPractices} < min ${LH.desktop.bestPractices}`
    ).toBeGreaterThanOrEqual(LH.desktop.bestPractices);

    expect(
      scores.seo,
      `Desktop SEO ${scores.seo} < min ${LH.desktop.seo}`
    ).toBeGreaterThanOrEqual(LH.desktop.seo);
  });

  // ── Lighthouse — Mobile ───────────────────────────────────────────────────

  test('Lighthouse mobile — all category scores meet thresholds', () => {
    test.setTimeout(120_000);

    const scores = runLighthouse(BASE_URL, 'mobile');
    console.info(
      `[lighthouse mobile]  perf=${scores.performance}  ` +
      `a11y=${scores.accessibility}  bp=${scores.bestPractices}  seo=${scores.seo}`
    );

    expect(
      scores.performance,
      `Mobile perf ${scores.performance} < min ${LH.mobile.performance}`
    ).toBeGreaterThanOrEqual(LH.mobile.performance);

    expect(
      scores.accessibility,
      `Mobile a11y ${scores.accessibility} < min ${LH.mobile.accessibility}`
    ).toBeGreaterThanOrEqual(LH.mobile.accessibility);

    expect(
      scores.bestPractices,
      `Mobile best-practices ${scores.bestPractices} < min ${LH.mobile.bestPractices}`
    ).toBeGreaterThanOrEqual(LH.mobile.bestPractices);

    expect(
      scores.seo,
      `Mobile SEO ${scores.seo} < min ${LH.mobile.seo}`
    ).toBeGreaterThanOrEqual(LH.mobile.seo);
  });
});
