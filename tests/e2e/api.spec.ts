/**
 * Category 7: API Health Check Tests
 *
 * Verifies that Supabase Edge Functions respond with the correct status codes
 * and basic response structure for both valid and invalid requests.
 *
 * Deployed functions (as of test authoring — April 2026):
 *   ✅ sage-chat-stream   — SSE streaming AI chat
 *   ✅ create-checkout    — Stripe checkout session (auth required)
 *   ✅ manage-subscription — Stripe portal session (auth required)
 *   ✅ stripe-webhook      — Stripe event handler (signature required)
 *   ❌ get-best-card       — NOT YET DEPLOYED (returns 404; test documents state)
 *   ❌ sage-chat           — NOT YET DEPLOYED (returns 404; test documents state)
 *
 * Auth notes:
 *   • Supabase gateway requires ≥ one auth header (apikey or Authorization)
 *     before a request reaches the edge function.  Requests without any auth
 *     are rejected by the gateway with 401 before the function code runs.
 *   • The anon key is a valid API-gateway token but not a user JWT.
 *     Functions that call auth.getUser() will reject it and return their own
 *     error (create-checkout returns 400; manage-subscription returns 401).
 *
 * Run only these tests:
 *   npx playwright test tests/e2e/api.spec.ts
 */

import { test, expect } from '@playwright/test';

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  'https://zdlozhpmqrtvvhdzbmrv.supabase.co';

const ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbG96aHBtcXJ0dnZoZHpibXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxODYwMTEsImV4cCI6MjA4Mzc2MjAxMX0.o7xqSfwRtvxsPoAe7e0kJzb5TXoFyCzDEQqOWkLNkos';

const BASE = `${SUPABASE_URL}/functions/v1`;

// Standard headers — anon key as both apikey and Bearer token.
// The gateway accepts the anon key; individual functions may still reject
// it if they require a real user JWT.
const ANON_HEADERS = {
  apikey:          ANON_KEY,
  'Content-Type':  'application/json',
  Authorization:   `Bearer ${ANON_KEY}`,
} as const;

// Fake health-check user ID (not a real user in the database)
const TEST_USER_ID = '00000000-0000-0000-0000-health000001';

// ─────────────────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────────────────

test.describe('API Health Checks — Supabase Edge Functions', () => {

  // ── get-best-card (NOT YET DEPLOYED) ─────────────────────────────────────
  //
  //   These tests document the current state: the function has not been
  //   deployed to production yet.  They will begin failing (with "expected
  //   404, got 200") once the function is deployed — at that point remove the
  //   404 assertions and replace them with the real health-check expectations.

  test.describe('get-best-card', () => {

    test('returns 404 — function not yet deployed to production', async ({ request }) => {
      const res = await request.post(`${BASE}/get-best-card`, {
        headers: ANON_HEADERS,
        data: {
          userId:           TEST_USER_ID,
          portfolioCardIds: [],
          category:         'groceries',
        },
      });

      expect(res.status()).toBe(404);
      const json = await res.json();
      // Gateway returns a structured NOT_FOUND error for undeployed functions
      expect(json).toHaveProperty('code', 'NOT_FOUND');
    });

    test('returns 404 for card lookup — function not yet deployed', async ({ request }) => {
      const res = await request.post(`${BASE}/get-best-card`, {
        headers: ANON_HEADERS,
        data: {
          userId:           TEST_USER_ID,
          portfolioCardIds: ['amex-cobalt'],
          category:         'dining',
        },
      });

      expect(res.status()).toBe(404);
    });
  });

  // ── sage-chat (NOT YET DEPLOYED) ─────────────────────────────────────────
  //
  //   Same as above — documents the current NOT_FOUND state.

  test.describe('sage-chat', () => {

    test('returns 404 — function not yet deployed to production', async ({ request }) => {
      const res = await request.post(`${BASE}/sage-chat`, {
        headers: ANON_HEADERS,
        data: { message: 'Hello', userId: TEST_USER_ID },
      });

      expect(res.status()).toBe(404);
      const json = await res.json();
      expect(json).toHaveProperty('code', 'NOT_FOUND');
    });

    test('returns 404 for validation-error path — function not yet deployed', async ({ request }) => {
      const res = await request.post(`${BASE}/sage-chat`, {
        headers: ANON_HEADERS,
        data: { userId: TEST_USER_ID }, // intentionally missing 'message'
      });

      expect(res.status()).toBe(404);
    });
  });

  // ── sage-chat-stream ──────────────────────────────────────────────────────
  //
  //   Deployed.  Uses Server-Sent Events (SSE).
  //   Supabase gateway requires Authorization; the anon key is accepted as a
  //   valid gateway token and the function then returns an SSE stream.

  test.describe('sage-chat-stream', () => {

    test('responds 200 with text/event-stream when anon-key bearer is provided', async () => {
      test.setTimeout(20_000);

      const ac    = new AbortController();
      const timer = setTimeout(() => ac.abort(), 12_000);

      let status:      number | undefined;
      let contentType: string | null = null;
      let firstLine:   string        = '';

      try {
        const res = await fetch(`${BASE}/sage-chat-stream`, {
          method:  'POST',
          headers: { ...ANON_HEADERS, Accept: 'text/event-stream' },
          body:    JSON.stringify({ message: 'hi', history: [] }),
          signal:  ac.signal,
        });

        status      = res.status;
        contentType = res.headers.get('content-type');

        // Read the first SSE chunk to verify the stream is sending valid events
        const reader = res.body?.getReader();
        if (reader) {
          const { value } = await reader.read();
          if (value) firstLine = new TextDecoder().decode(value).split('\n')[0];
          reader.cancel();
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') throw err;
      } finally {
        clearTimeout(timer);
      }

      expect(status).toBe(200);
      expect(contentType).toContain('text/event-stream');

      // First line of SSE must be a valid field prefix
      if (firstLine.length > 0) {
        expect(firstLine).toMatch(/^(event:|data:|id:|retry:|:|\s*$)/);
      }
    });

    test('gateway returns 401 when Authorization header is absent', async ({ request }) => {
      // The Supabase gateway enforces auth before the function is reached.
      // sage-chat-stream does degrade gracefully internally, but the gateway
      // itself rejects headerless requests with 401.
      const res = await request.post(`${BASE}/sage-chat-stream`, {
        headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
        data:    { message: 'ping', history: [] },
      });

      expect(res.status()).toBe(401);
    });
  });

  // ── create-checkout ───────────────────────────────────────────────────────
  //
  //   Deployed.  Requires a real user JWT.
  //   NOTE: this function returns HTTP 400 (not 401) for all auth failures;
  //   the error body describes the specific problem.

  test.describe('create-checkout', () => {

    test('returns 400 "Missing authorization header" when Authorization is absent', async ({ request }) => {
      const res = await request.post(`${BASE}/create-checkout`, {
        headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
        data:    { tier: 'pro', interval: 'month' },
      });

      expect(res.status()).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/missing authorization|unauthorized/i);
    });

    test('returns 400 "Unauthorized" when anon key is used as bearer (not a user JWT)', async ({ request }) => {
      // The anon key is accepted by the gateway but rejected by the function
      // when it calls auth.getUser() — the anon key is not a user session token.
      const res = await request.post(`${BASE}/create-checkout`, {
        headers: ANON_HEADERS,
        data:    { tier: 'pro', interval: 'month' },
      });

      expect(res.status()).toBe(400);
      const json = await res.json();
      expect(json).toHaveProperty('error');
    });

    test('returns 400 with a syntactically invalid Bearer token', async ({ request }) => {
      const res = await request.post(`${BASE}/create-checkout`, {
        headers: {
          apikey:         ANON_KEY,
          'Content-Type': 'application/json',
          Authorization:  'Bearer not.a.real.jwt',
        },
        data: { tier: 'pro', interval: 'month' },
      });

      expect(res.status()).toBe(400);
      const json = await res.json();
      expect(json).toHaveProperty('error');
    });
  });

  // ── manage-subscription ───────────────────────────────────────────────────
  //
  //   Deployed.  Requires a real user JWT.  Returns 401 for all auth failures.

  test.describe('manage-subscription', () => {

    test('returns 401 "Missing authorization header" when Authorization is absent', async ({ request }) => {
      const res = await request.post(`${BASE}/manage-subscription`, {
        headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
        data:    {},
      });

      expect(res.status()).toBe(401);
      const text = await res.text();
      expect(text).toMatch(/missing|unauthorized|auth/i);
    });

    test('returns 401 "Invalid user token" when anon key is used as bearer', async ({ request }) => {
      const res = await request.post(`${BASE}/manage-subscription`, {
        headers: ANON_HEADERS,
        data:    {},
      });

      expect(res.status()).toBe(401);
      const json = await res.json();
      // Function-level rejection message
      expect(JSON.stringify(json)).toMatch(/invalid|unauthorized|token/i);
    });

    test('returns 401 with a syntactically invalid Bearer token', async ({ request }) => {
      const res = await request.post(`${BASE}/manage-subscription`, {
        headers: {
          apikey:         ANON_KEY,
          'Content-Type': 'application/json',
          Authorization:  'Bearer not.a.real.jwt',
        },
        data: {},
      });

      expect(res.status()).toBe(401);
    });
  });

  // ── stripe-webhook ────────────────────────────────────────────────────────
  //
  //   Deployed.  Auth is via Stripe webhook signature, not user JWTs.
  //   Any request missing or with an invalid stripe-signature is rejected 400.

  test.describe('stripe-webhook', () => {

    test('returns 400 "Missing stripe-signature header" when signature is absent', async ({ request }) => {
      const res = await request.post(`${BASE}/stripe-webhook`, {
        headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
        data:    { type: 'health.check' },
      });

      expect(res.status()).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/missing stripe-signature/i);
    });

    test('returns 400 "Invalid signature" with a malformed stripe-signature', async ({ request }) => {
      const res = await request.post(`${BASE}/stripe-webhook`, {
        headers: {
          apikey:             ANON_KEY,
          'Content-Type':     'application/json',
          'stripe-signature': 't=0,v1=invalid_value',
        },
        data: { type: 'health.check' },
      });

      expect(res.status()).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/invalid signature/i);
    });

    test('returns 400 with a plausible but incorrect HMAC signature', async ({ request }) => {
      // Correct header format (t=timestamp,v1=hex64) but wrong HMAC key
      const ts  = Math.floor(Date.now() / 1000);
      const sig = 'a'.repeat(64); // 64-char hex — correct length, wrong value

      const res = await request.post(`${BASE}/stripe-webhook`, {
        headers: {
          apikey:             ANON_KEY,
          'Content-Type':     'application/json',
          'stripe-signature': `t=${ts},v1=${sig}`,
        },
        data: { type: 'health.check' },
      });

      expect(res.status()).toBe(400);
    });
  });
});
