/**
 * Deno tests for shared edge function helpers.
 *
 * Run with:
 *   deno test supabase/functions/_shared/
 *
 * These tests require no environment setup — the helpers are pure.
 * `requireEnv` needs the `--allow-env` flag:
 *   deno test --allow-env supabase/functions/_shared/
 */

import {
  assertEquals,
  assertThrows,
  assert,
} from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import {
  extractId,
  isUuid,
  requireEnv,
  sanitizeFilterInput,
} from './helpers.ts';

// ---------------------------------------------------------------------------
// extractId
// ---------------------------------------------------------------------------

Deno.test('extractId returns the string as-is', () => {
  assertEquals(extractId('cus_123', 'session.customer'), 'cus_123');
});

Deno.test('extractId returns .id when given an object', () => {
  assertEquals(extractId({ id: 'sub_456' }, 'session.subscription'), 'sub_456');
});

Deno.test('extractId throws on null', () => {
  assertThrows(
    () => extractId(null, 'session.customer'),
    Error,
    'is missing'
  );
});

Deno.test('extractId throws on undefined', () => {
  assertThrows(
    () => extractId(undefined, 'session.customer'),
    Error,
    'is missing'
  );
});

Deno.test('extractId includes the field name in the error', () => {
  try {
    extractId(null, 'invoice.subscription');
    assert(false, 'should have thrown');
  } catch (err) {
    assert(err instanceof Error);
    assert(err.message.includes('invoice.subscription'));
  }
});

// ---------------------------------------------------------------------------
// sanitizeFilterInput
// ---------------------------------------------------------------------------

Deno.test('sanitizeFilterInput passes safe input through unchanged', () => {
  assertEquals(sanitizeFilterInput('Amex Gold'), 'Amex Gold');
});

Deno.test('sanitizeFilterInput strips wildcards', () => {
  assertEquals(sanitizeFilterInput('%Amex%'), 'Amex');
  assertEquals(sanitizeFilterInput('Amex_Gold'), 'AmexGold');
});

Deno.test('sanitizeFilterInput strips commas and parens', () => {
  // These characters can escape an `.or()` filter expression.
  assertEquals(sanitizeFilterInput('Amex,Gold'), 'AmexGold');
  assertEquals(sanitizeFilterInput('Amex(Gold)'), 'AmexGold');
});

Deno.test('sanitizeFilterInput strips backslashes', () => {
  assertEquals(sanitizeFilterInput('Amex\\Gold'), 'AmexGold');
});

Deno.test('sanitizeFilterInput strips asterisks', () => {
  assertEquals(sanitizeFilterInput('Amex*Gold'), 'AmexGold');
});

Deno.test('sanitizeFilterInput truncates to maxLen', () => {
  const long = 'a'.repeat(200);
  assertEquals(sanitizeFilterInput(long).length, 100);
});

Deno.test('sanitizeFilterInput respects custom maxLen', () => {
  assertEquals(sanitizeFilterInput('abcdefgh', 4), 'abcd');
});

Deno.test('sanitizeFilterInput trims whitespace', () => {
  assertEquals(sanitizeFilterInput('  Amex  '), 'Amex');
});

// ---------------------------------------------------------------------------
// isUuid
// ---------------------------------------------------------------------------

Deno.test('isUuid accepts a valid v4 UUID', () => {
  assertEquals(isUuid('550e8400-e29b-41d4-a716-446655440000'), true);
});

Deno.test('isUuid rejects a too-short string', () => {
  assertEquals(isUuid('550e8400-e29b-41d4-a716'), false);
});

Deno.test('isUuid rejects non-hex characters', () => {
  assertEquals(isUuid('zzzzzzzz-e29b-41d4-a716-446655440000'), false);
});

Deno.test('isUuid rejects a non-string', () => {
  assertEquals(isUuid(null), false);
  assertEquals(isUuid(123), false);
  assertEquals(isUuid(undefined), false);
});

Deno.test('isUuid is case-insensitive', () => {
  assertEquals(isUuid('550E8400-E29B-41D4-A716-446655440000'), true);
});

// ---------------------------------------------------------------------------
// requireEnv
// ---------------------------------------------------------------------------

Deno.test('requireEnv returns the value when set', () => {
  Deno.env.set('TEST_REQUIRE_ENV', 'hello');
  try {
    assertEquals(requireEnv('TEST_REQUIRE_ENV'), 'hello');
  } finally {
    Deno.env.delete('TEST_REQUIRE_ENV');
  }
});

Deno.test('requireEnv throws a clear error when missing', () => {
  Deno.env.delete('NONEXISTENT_ENV_VAR');
  assertThrows(
    () => requireEnv('NONEXISTENT_ENV_VAR'),
    Error,
    'NONEXISTENT_ENV_VAR'
  );
});

Deno.test('requireEnv throws when set to empty string', () => {
  Deno.env.set('EMPTY_TEST_ENV', '');
  try {
    assertThrows(() => requireEnv('EMPTY_TEST_ENV'), Error);
  } finally {
    Deno.env.delete('EMPTY_TEST_ENV');
  }
});
