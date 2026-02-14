/**
 * Utilities barrel export
 */

// Amount validation and formatting
export {
  validateAmount,
  formatCurrency,
  formatCadValue,
} from './amountUtils';
export type { AmountValidationResult } from './amountUtils';

// Reward formatting
export {
  formatRewardEarned,
  formatAnnualFee,
  REWARD_TYPE_LABELS,
  REWARD_TYPE_ICONS,
  getHighestRewardRate,
  getTopCategoryRewards,
  formatRewardRate,
  formatUpToRate,
  formatCategoryName,
  formatBestForCategories,
  formatTopCategoryRates,
} from './rewardFormatUtils';

// Platform utilities - web-safe native module wrappers
export {
  isWeb,
  isIOS,
  isAndroid,
  isNative,
  onNative,
  onWeb,
  select,
  haptic,
  requestLocationPermission,
  getCurrentLocation,
  supportsLayoutAnimations,
  getAnimationDuration,
  supportsPushNotifications,
  requestNotificationPermission,
  features,
  hasFeature,
  platformLog,
  warnWebIncompatible,
} from './platform';
export type { LocationCoords, LocationResult } from './platform';

// Lazy screen loading with error boundaries
export { lazyScreen, withScreenErrorBoundary, LoadingFallback, ScreenErrorFallback } from './lazyScreen';

// Haptics (re-export for backward compatibility, uses platform.ts internally)
export * from './haptics';
