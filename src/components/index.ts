/**
 * Components barrel export
 */

// Error handling
export { ErrorBoundary } from './ErrorBoundary';
export { AppErrorBoundary } from './AppErrorBoundary';
export { ErrorBanner, OfflineBanner } from './ErrorBanner';
export { EmptyState, NoResultsState, ErrorState, OfflineState } from './EmptyState';

// Core UI components
export { Button } from './Button';
export type { ButtonVariant, ButtonSize } from './Button';

export { Card, CardHeader, CardContent, CardFooter } from './Card';
export type { CardVariant } from './Card';

export { Input } from './Input';
export { SearchInput } from './SearchInput';

export { Modal, ModalHeader } from './Modal';

export { SectionHeader, SectionDivider, ListSectionHeader } from './SectionHeader';

export { Badge, RankBadge } from './Badge';
export type { BadgeVariant, BadgeSize } from './Badge';

export { Icon, IconButton, CircleIcon } from './Icon';
export type { IconName } from './Icon';

// Loading states
export { LoadingSpinner, LoadingOverlay, InlineLoader, PulsingDots } from './LoadingSpinner';
export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonListItem,
  SkeletonSearchResult,
} from './SkeletonLoader';

// Phase 2 Components - UI Redesign
export { CardDetailModal } from './CardDetailModal';
export { RewardBadge } from './RewardBadge';
export { CardVisual } from './CardVisual';
export { BottomSheet } from './BottomSheet';
export { Toast } from './Toast';

// Rewards Calculator Components
export { AmountInput } from './AmountInput';
export { CardRewardItem } from './CardRewardItem';
export { RewardsDisplay } from './RewardsDisplay';
export { StoreSelector } from './StoreSelector';
export { RedemptionOptionsModal } from './RedemptionOptionsModal';

// Redesigned Components
export { GradientText } from './GradientText';
export { GlassCard } from './GlassCard';
export { CategoryGrid } from './CategoryGrid';
export type { CategoryType } from './CategoryGrid';
export { FadeInView } from './FadeInView';

// Chat Components (Sage AI Assistant)
export { ChatBubble, ChatInput, QuickActions, CardRecommendationCard } from './chat';
export type { ChatBubbleProps, ChatInputProps, QuickActionsProps, QuickAction, CardRecommendationCardProps } from './chat';

// Subscription Components
export { default as Paywall } from './Paywall';

// AutoPilot Components
export { default as AutoPilotNotificationCard } from './AutoPilotNotificationCard';

// Tier 1 - Mega Build Widgets
export { default as RewardsIQWidget } from './RewardsIQWidget';
export { default as MissedRewardsWidget } from './MissedRewardsWidget';

// Tier 2 - Social Sharing
export { default as SocialShareCard } from './SocialShareCard';

// Tier 3 - Polish & Animations
export { default as AnimatedNumber, AnimatedCurrency, AnimatedPoints, AnimatedPercent } from './AnimatedNumber';
export { default as ConfettiAnimation } from './ConfettiAnimation';
