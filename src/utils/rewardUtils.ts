/**
 * rewardUtils - Display utilities for converting points to dollar values.
 *
 * Canadian credit cards typically value points at 1 cent each (1 cpp),
 * but premium travel cards can be higher. Use the card's `pointValuation`
 * field (stored in CAD cents per point) when available; otherwise fall back
 * to the 1 cpp baseline.
 */

/**
 * Convert a raw points amount to a formatted dollar string.
 *
 * @param points - Raw points earned (e.g. 420)
 * @param cpp    - Cents per point. Defaults to 1 (i.e. $0.01/point).
 *                 Pass `card.pointValuation` when the card has a specific valuation.
 * @returns      Dollar string, e.g. "$4.20"
 *
 * @example
 * formatRewardValue(420)       // "$4.20"
 * formatRewardValue(420, 2)    // "$8.40"  (2 cpp card like Amex MR at peak value)
 * formatRewardValue(10000, 1.5) // "$150.00"
 */
export function formatRewardValue(points: number, cpp: number = 1): string {
  const dollars = (points * cpp) / 100;
  return `$${dollars.toFixed(2)}`;
}
