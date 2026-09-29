/**
 * SubscriptionService tests - REMOVED
 * Rewardly is now completely free. SubscriptionService is a no-op stub.
 */

describe('SubscriptionService (free)', () => {
  it('always returns free tier', async () => {
    const { getCurrentTier, getCurrentTierSync } = await import('../SubscriptionService');
    expect(getCurrentTierSync()).toBe('free');
    expect(await getCurrentTier()).toBe('free');
  });

  it('allows all cards', async () => {
    const { canAddCardSync, getCardLimitSync } = await import('../SubscriptionService');
    expect(canAddCardSync(999)).toBe(true);
    expect(getCardLimitSync()).toBe(Infinity);
  });

  it('allows Sage AI without limits', async () => {
    const { canUseSage } = await import('../SubscriptionService');
    const result = await canUseSage();
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeNull();
  });
});
