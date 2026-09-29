/**
 * Paywall - Removed. Rewardly is now completely free.
 * This file is kept as a stub so existing imports continue to compile.
 */

import React from 'react';
import type { SubscriptionTier, BillingPeriod } from '../services/SubscriptionService';

interface PaywallProps {
  visible?: boolean;
  onClose?: () => void;
  onSubscribe?: (tier: SubscriptionTier, period: BillingPeriod) => void;
  highlightFeature?: string;
  annualGain?: number;
  defaultTier?: SubscriptionTier;
}

export default function Paywall(_props: PaywallProps): React.ReactElement | null {
  return null;
}
