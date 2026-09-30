#!/usr/bin/env node
/**
 * sync-cards.js — Sync Canadian credit card data from Supabase into data/cards.json
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_ANON_KEY=your-anon-key \
 *   node scripts/sync-cards.js
 *
 * Or set EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY and the
 * script will fall back to those automatically (mirrors the main app's .env).
 *
 * Output: chrome-extension/data/cards.json
 *
 * Shape of cards.json (must not change — popup.js and background.js depend on it):
 * {
 *   "cards": [
 *     {
 *       "id": "amex-cobalt-card",
 *       "name": "American Express Cobalt Card",
 *       "issuer": "American Express",
 *       "rewardProgram": "Membership Rewards",
 *       "annualFee": 191.88,
 *       "pointValuation": 2.1,
 *       "country": "CA",
 *       "foreignTransactionFee": false,
 *       "applicationUrl": "https://...",
 *       "lastVerified": "2025-01-01",
 *       "baseRewardRate": { "value": 1, "type": "points", "unit": "multiplier" },
 *       "categoryRewards": [
 *         { "category": "dining", "rewardRate": { "value": 5, "type": "points", "unit": "multiplier" } }
 *       ],
 *       "signupBonus": { "value": 15000, "type": "points", "minSpend": 3000, "minSpendPeriodDays": 90 }
 *     }
 *   ]
 * }
 */

const fs = require("fs");
const path = require("path");

// Resolve env vars — support both plain and EXPO_PUBLIC_ prefixes
const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL;

const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Fallback: try to read from the root .env or .env.local
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const dotenvPath = path.resolve(__dirname, "../../.env.local");
  const dotenvFallback = path.resolve(__dirname, "../../.env");
  const envFile = fs.existsSync(dotenvPath) ? dotenvPath : fs.existsSync(dotenvFallback) ? dotenvFallback : null;
  if (envFile) {
    const lines = fs.readFileSync(envFile, "utf8").split("\n");
    for (const line of lines) {
      const [k, ...vParts] = line.split("=");
      const v = vParts.join("=").trim();
      if (!process.env.SUPABASE_URL && (k === "SUPABASE_URL" || k === "EXPO_PUBLIC_SUPABASE_URL")) {
        process.env.SUPABASE_URL = v;
      }
      if (!process.env.SUPABASE_ANON_KEY && (k === "SUPABASE_ANON_KEY" || k === "EXPO_PUBLIC_SUPABASE_ANON_KEY")) {
        process.env.SUPABASE_ANON_KEY = v;
      }
    }
  }
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

if (!url || !key || url.includes("your-project")) {
  console.error(
    "Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set.\n" +
    "Copy .env.example to .env.local in the project root and fill in your values,\n" +
    "or export the variables before running this script:\n\n" +
    "  SUPABASE_URL=https://xxx.supabase.co \\\n" +
    "  SUPABASE_ANON_KEY=your-anon-key \\\n" +
    "  node scripts/sync-cards.js"
  );
  process.exit(1);
}

const OUTPUT_PATH = path.resolve(__dirname, "../data/cards.json");
const PAGE_SIZE = 500; // Supabase default max is 1000; 500 is safe

async function fetchAllCards() {
  let allCards = [];
  let from = 0;

  while (true) {
    const res = await fetch(
      `${url}/rest/v1/cards?country=eq.CA&select=*&order=name.asc&limit=${PAGE_SIZE}&offset=${from}`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Supabase error ${res.status}: ${body}`);
    }

    const batch = await res.json();
    if (!batch.length) break;

    allCards = allCards.concat(batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allCards;
}

/**
 * Map a Supabase card row to the shape expected by background.js / popup.js.
 * Adjust the field mappings below if your DB schema differs.
 */
function mapCard(row) {
  return {
    id: row.id,
    name: row.name,
    issuer: row.issuer,
    rewardProgram: row.reward_program || row.rewardProgram || null,
    annualFee: row.annual_fee ?? row.annualFee ?? 0,
    pointValuation: row.point_valuation ?? row.pointValuation ?? 1,
    country: row.country || "CA",
    foreignTransactionFee: row.foreign_transaction_fee ?? row.foreignTransactionFee ?? false,
    applicationUrl: row.application_url || row.applicationUrl || null,
    lastVerified: row.last_verified || row.lastVerified || null,
    baseRewardRate: row.base_reward_rate || row.baseRewardRate || { value: 1, type: "points", unit: "multiplier" },
    categoryRewards: row.category_rewards || row.categoryRewards || [],
    signupBonus: row.signup_bonus || row.signupBonus || null,
  };
}

async function main() {
  console.log(`Fetching cards from ${url} …`);

  const rows = await fetchAllCards();
  console.log(`Fetched ${rows.length} cards from Supabase.`);

  if (!rows.length) {
    console.warn("Warning: no cards returned — cards.json will not be updated.");
    process.exit(0);
  }

  const cards = rows.map(mapCard);
  const output = { cards };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n");
  console.log(`Wrote ${cards.length} cards to ${OUTPUT_PATH}`);
}

main().catch(err => {
  console.error("sync-cards failed:", err.message);
  process.exit(1);
});
