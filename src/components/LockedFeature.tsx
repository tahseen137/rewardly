/**
 * LockedFeature - Removed. Rewardly is now completely free.
 * All features are available to all users. This stub just renders children.
 */

import React from 'react';
import type { SubscriptionTier } from '../services/SubscriptionService';
import type { Feature } from '../services/SubscriptionService';

interface LockedFeatureProps {
  feature: Feature;
  title: string;
  description: string;
  icon?: React.ReactNode;
  variant?: 'overlay' | 'inline' | 'card';
  onSubscribe?: (tier: SubscriptionTier) => void;
  children?: React.ReactNode;
}

export default function LockedFeature({ children }: LockedFeatureProps): React.ReactElement | null {
  return <>{children}</> as React.ReactElement;
}
