/**
 * Shared helpers for Supabase Edge Functions.
 *
 * These are pure functions with no runtime side effects at import time, so
 * they can be imported from both production function entry points and from
 * test files.
 */

/**
 * Fail fast at module load if a required env var is missing.
 * Throws with a clear message listing the missing variable name.
 */
export function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Safely extract an ID from a Stripe field that can be a string, an expanded
 * object with an `id`, or null/undefined. Throws on missing values so callers
 * never silently write `"[object Object]"` or `"null"` into the database.
 */
export function extractId(
  value: string | { id: string } | null | undefined,
  field: string
): string {
  if (value === null || value === undefined) {
    throw new Error(`Stripe field "${field}" is missing`);
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object' && typeof value.id === 'string') {
    return value.id;
  }
  throw new Error(`Stripe field "${field}" has unexpected type`);
}

/**
 * Sanitize a user-derived string before interpolating into a PostgREST
 * filter expression. Strips characters that can alter filter semantics in
 * `.ilike()` / `.or()` calls — wildcards, commas, parentheses, backslashes.
 * Also truncates to an upper bound to prevent pathological inputs.
 */
export function sanitizeFilterInput(value: string, maxLen = 100): string {
  return value
    .slice(0, maxLen)
    .replace(/[%_,()\\*]/g, '')
    .trim();
}

/** UUID v4 validator — returns true for well-formed v1–v5 UUIDs. */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function isUuid(value: unknown): boolean {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

/** Standard CORS headers used by all functions. */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, stripe-signature',
};
