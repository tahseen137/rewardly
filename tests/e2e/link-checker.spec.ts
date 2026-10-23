/**
 * Category 1: Link Checker
 *
 * Crawls rewardly.ca (landing page + all internal pages reachable via HTML links)
 * and verifies every anchor returns 200 or a valid redirect chain ending in 2xx/3xx.
 * External links are checked via HEAD requests (no full page load).
 */

import { test, expect, request } from '@playwright/test';

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL = process.env.BASE_URL ?? 'https://rewardly.ca';

/** Static HTML pages we know exist (served from /public). */
const STATIC_PAGES = [
  '/',
  '/privacy-policy.html',
  '/chrome-extension.html',
  '/best-credit-card-rewards-app-canada.html',
  '/canadian-loyalty-programs-guide-2026.html',
  '/credit-card-calculator-canada.html',
  '/credit-card-referral-bonuses-canada-2026.html',
  '/maximize-credit-card-rewards-canada.html',
  '/maxrewards-alternative.html',
  '/savesage-alternative.html',
];

/** Links we explicitly want to confirm work. */
const CRITICAL_LINKS = [
  { label: 'Privacy policy', path: '/privacy-policy.html' },
];

/** Status codes we consider "valid". 999 = LinkedIn's bot-blocker (expected). */
const ACCEPTABLE_STATUSES = new Set([200, 201, 301, 302, 303, 307, 308, 999]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isInternal(href: string): boolean {
  try {
    const url = new URL(href, BASE_URL);
    return url.hostname === new URL(BASE_URL).hostname;
  } catch {
    return false;
  }
}

function isSkippable(href: string): boolean {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return true;
  }
  // Skip javascript: pseudo-links
  if (href.startsWith('javascript:')) return true;
  return false;
}

/** Resolve a raw href to an absolute URL. Returns null if un-parseable. */
function toAbsolute(href: string, pageUrl: string): string | null {
  try {
    return new URL(href, pageUrl).href;
  } catch {
    return null;
  }
}

// ─── Collect links from a rendered page ──────────────────────────────────────

async function collectLinks(
  page: import('@playwright/test').Page,
  url: string
): Promise<{ internal: string[]; external: string[] }> {
  await page.goto(url, { waitUntil: 'networkidle' });

  const hrefs: string[] = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href]')).map(
      (a) => (a as HTMLAnchorElement).getAttribute('href') ?? ''
    )
  );

  const internal: string[] = [];
  const external: string[] = [];

  for (const href of hrefs) {
    if (isSkippable(href)) continue;
    const abs = toAbsolute(href, url);
    if (!abs) continue;
    if (isInternal(abs)) {
      internal.push(abs);
    } else {
      external.push(abs);
    }
  }

  return { internal: [...new Set(internal)], external: [...new Set(external)] };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Link Checker', () => {
  // ── Critical links ──────────────────────────────────────────────────────────

  test.describe('Critical links', () => {
    for (const { label, path } of CRITICAL_LINKS) {
      test(`${label} (${path}) returns 2xx`, async ({ page }) => {
        const response = await page.goto(`${BASE_URL}${path}`);
        expect(
          response?.status(),
          `Expected ${label} to return 2xx, got ${response?.status()}`
        ).toBeLessThan(400);
      });
    }
  });

  // ── Static pages ────────────────────────────────────────────────────────────

  test.describe('Static pages', () => {
    for (const path of STATIC_PAGES) {
      test(`${path} returns 2xx`, async ({ page }) => {
        const response = await page.goto(`${BASE_URL}${path}`);
        expect(
          response?.status(),
          `${path} returned ${response?.status()}`
        ).toBeLessThan(400);
      });
    }
  });

  // ── Full crawl: landing page ─────────────────────────────────────────────────

  test('Landing page: all anchor links are reachable', async ({ page, context }) => {
    const { internal, external } = await collectLinks(page, BASE_URL);

    const failures: string[] = [];

    // Check internal links by navigating
    for (const url of internal) {
      const res = await page.goto(url, { waitUntil: 'domcontentloaded' });
      const status = res?.status() ?? 0;
      if (status >= 400) {
        failures.push(`[${status}] ${url}`);
      }
    }

    // Check external links via HEAD request (fast, no JS needed)
    const apiCtx = await request.newContext({ ignoreHTTPSErrors: true });
    for (const url of external) {
      try {
        const res = await apiCtx.head(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RewardlyLinkChecker/1.0)' },
          timeout: 15_000,
        });
        if (!ACCEPTABLE_STATUSES.has(res.status()) && res.status() >= 400) {
          // Retry with GET — some servers refuse HEAD
          const get = await apiCtx.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RewardlyLinkChecker/1.0)' },
            timeout: 15_000,
          });
          if (!ACCEPTABLE_STATUSES.has(get.status()) && get.status() >= 400) {
            failures.push(`[${get.status()}] ${url}`);
          }
        }
      } catch (err) {
        failures.push(`[ERR] ${url} — ${(err as Error).message}`);
      }
    }
    await apiCtx.dispose();

    expect(
      failures,
      `Broken links found:\n${failures.join('\n')}`
    ).toHaveLength(0);
  });

  // ── Full crawl: all internal pages ───────────────────────────────────────────

  test('Full site crawl: no broken links across all internal pages', async ({ page }) => {
    const visited = new Set<string>();
    const queue: string[] = [BASE_URL, ...STATIC_PAGES.map((p) => `${BASE_URL}${p}`)];
    const failures: string[] = [];
    const externalLinks = new Set<string>();

    while (queue.length > 0) {
      const url = queue.shift()!;
      // Normalise: strip trailing slash and fragment
      const normalised = url.split('#')[0].replace(/\/$/, '') || BASE_URL;
      if (visited.has(normalised)) continue;
      visited.add(normalised);

      let res: import('@playwright/test').Response | null = null;
      try {
        res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      } catch {
        failures.push(`[TIMEOUT/ERR] ${url}`);
        continue;
      }

      const status = res?.status() ?? 0;
      if (status >= 400) {
        failures.push(`[${status}] ${url}`);
        continue;
      }

      // Collect links from this page
      const hrefs: string[] = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a[href]')).map(
          (a) => (a as HTMLAnchorElement).getAttribute('href') ?? ''
        )
      );

      for (const href of hrefs) {
        if (isSkippable(href)) continue;
        const abs = toAbsolute(href, url);
        if (!abs) continue;
        const norm = abs.split('#')[0].replace(/\/$/, '') || BASE_URL;
        if (isInternal(abs) && !visited.has(norm)) {
          queue.push(abs);
        } else if (!isInternal(abs)) {
          externalLinks.add(abs);
        }
      }
    }

    // Check all external links once
    const apiCtx = await request.newContext({ ignoreHTTPSErrors: true });
    const checkedExternal = new Set<string>();
    for (const url of externalLinks) {
      if (checkedExternal.has(url)) continue;
      checkedExternal.add(url);
      try {
        const res = await apiCtx.head(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RewardlyLinkChecker/1.0)' },
          timeout: 15_000,
        });
        if (!ACCEPTABLE_STATUSES.has(res.status()) && res.status() >= 400) {
          const get = await apiCtx.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RewardlyLinkChecker/1.0)' },
            timeout: 15_000,
          });
          if (!ACCEPTABLE_STATUSES.has(get.status()) && get.status() >= 400) {
            failures.push(`[${get.status()}] ${url}`);
          }
        }
      } catch (err) {
        // Network errors on external links are logged but not failed — DNS issues, etc.
        console.warn(`External link check warning: ${url} — ${(err as Error).message}`);
      }
    }
    await apiCtx.dispose();

    console.log(
      `Crawl complete. Pages visited: ${visited.size}, External links checked: ${checkedExternal.size}`
    );

    expect(
      failures,
      `Broken links:\n${failures.join('\n')}`
    ).toHaveLength(0);
  });
});
