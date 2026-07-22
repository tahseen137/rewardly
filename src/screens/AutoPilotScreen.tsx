/**
 * SmartWalletScreen - Location-based card recommendations
 * Requires Max subscription (free/pro users see paywall)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { showAlert, showConfirm, showError } from '../utils/crossPlatformAlert';
import {
  MapPin,
  Bell,
  Shield,
  Search,
  Plus,
  Trash2,
  ChevronRight,
  Navigation,
  ShoppingCart,
  Coffee,
  Fuel,
  Home,
  Pill,
  MoreHorizontal,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import Badge from '../components/Badge';
import { SpendingCategory } from '../types';
import {
  canAccessFeatureSync,
  getCurrentTierSync,
  refreshSubscription,
  SubscriptionTier,
} from '../services/SubscriptionService';
import { LockedFeature } from '../components';
import {
  initializeAutoPilot,
  enableAutoPilot,
  disableAutoPilot,
  getGeofences,
  addGeofence,
  removeGeofence,
  toggleGeofence,
  getAutoPilotStatus,
  sendTestNotification,
  SEED_MERCHANTS,
  MerchantGeofence,
  AutoPilotStatus,
  SeedMerchant,
  getBestCardForCategory,
} from '../services/AutoPilotService';

interface MerchantWithBestCard extends SeedMerchant {
  bestCardName?: string;
  bestRewardRate?: number;
}

function CategoryIcon({ category }: { category: SpendingCategory }) {
  const iconProps = { size: 18, color: colors.text.secondary };
  switch (category) {
    case SpendingCategory.GROCERIES:
      return <ShoppingCart {...iconProps} />;
    case SpendingCategory.DINING:
      return <Coffee {...iconProps} />;
    case SpendingCategory.GAS:
      return <Fuel {...iconProps} />;
    case SpendingCategory.HOME_IMPROVEMENT:
      return <Home {...iconProps} />;
    case SpendingCategory.DRUGSTORES:
      return <Pill {...iconProps} />;
    default:
      return <MoreHorizontal {...iconProps} />;
  }
}

function formatCategory(category: SpendingCategory): string {
  const mapping: Record<SpendingCategory, string> = {
    [SpendingCategory.GROCERIES]: 'Groceries',
    [SpendingCategory.DINING]: 'Dining',
    [SpendingCategory.GAS]: 'Gas',
    [SpendingCategory.TRAVEL]: 'Travel',
    [SpendingCategory.ONLINE_SHOPPING]: 'Online Shopping',
    [SpendingCategory.ENTERTAINMENT]: 'Entertainment',
    [SpendingCategory.DRUGSTORES]: 'Drugstores',
    [SpendingCategory.HOME_IMPROVEMENT]: 'Home Improvement',
    [SpendingCategory.OTHER]: 'Other',
  };
  return mapping[category] || category;
}

export default function SmartWalletScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [status, setStatus] = useState<AutoPilotStatus | null>(null);
  const [geofences, setGeofences] = useState<MerchantGeofence[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMerchantPicker, setShowMerchantPicker] = useState(false);
  const [merchantsWithCards, setMerchantsWithCards] = useState<MerchantWithBestCard[]>([]);
  const [hasAccess, setHasAccess] = useState(true);
  const [, setCurrentTier] = useState<SubscriptionTier>('free');

  useFocusEffect(
    useCallback(() => {
      const checkAccess = async () => {
        await refreshSubscription();
        const tier = getCurrentTierSync();
        setCurrentTier(tier);
        setHasAccess(canAccessFeatureSync('smartwallet'));
        const currentStatus = await getAutoPilotStatus();
        setStatus(currentStatus);
      };
      checkAccess();
    }, [])
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await initializeAutoPilot();
      const currentStatus = await getAutoPilotStatus();
      const currentGeofences = getGeofences();
      setStatus(currentStatus);
      setGeofences(currentGeofences);

      const merchantCards = await Promise.all(
        SEED_MERCHANTS.map(async (merchant) => {
          const recommendation = await getBestCardForCategory(merchant.category);
          return {
            ...merchant,
            bestCardName: recommendation?.card.name,
            bestRewardRate: recommendation?.rewardRate,
          };
        })
      );
      setMerchantsWithCards(merchantCards);
    } catch (error) {
      console.error('Failed to load Smart Wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleToggleAutoPilot = async (enabled: boolean) => {
    try {
      if (enabled) {
        const success = await enableAutoPilot();
        if (!success) {
          showAlert(
            'Permission Required',
            'Smart Wallet needs location and notification permissions to work. Please enable them in Settings.'
          );
          return;
        }
      } else {
        await disableAutoPilot();
      }
      const currentStatus = await getAutoPilotStatus();
      setStatus(currentStatus);
    } catch (error) {
      console.error('Failed to toggle Smart Wallet:', error);
    }
  };

  const handleAddMerchant = async (merchant: MerchantWithBestCard) => {
    try {
      const location = merchant.locations[0];
      await addGeofence(merchant.name, merchant.category, location.lat, location.lng);
      setGeofences(getGeofences());
      setShowMerchantPicker(false);
      setSearchQuery('');
      const currentStatus = await getAutoPilotStatus();
      setStatus(currentStatus);
    } catch (error) {
      console.error('Failed to add geofence:', error);
      showError('Failed to add store. Please try again.');
    }
  };

  const handleRemoveGeofence = async (geofenceId: string) => {
    const confirmed = await showConfirm('Remove Store', 'Are you sure you want to stop monitoring this store?');
    if (confirmed) {
      await removeGeofence(geofenceId);
      setGeofences(getGeofences());
      const currentStatus = await getAutoPilotStatus();
      setStatus(currentStatus);
    }
  };

  const handleToggleGeofence = async (geofenceId: string, enabled: boolean) => {
    await toggleGeofence(geofenceId, enabled);
    setGeofences(getGeofences());
  };

  const handleTestNotification = async () => {
    await sendTestNotification();
    showAlert('Test Sent', 'Check your notifications!');
  };

  const filteredMerchants = useMemo(() => {
    if (!searchQuery) return merchantsWithCards;
    const query = searchQuery.toLowerCase();
    return merchantsWithCards.filter((m) => m.name.toLowerCase().includes(query));
  }, [merchantsWithCards, searchQuery]);

  const isMerchantAdded = useCallback(
    (merchantName: string) => geofences.some((g) => g.merchantName === merchantName),
    [geofences]
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  if (!hasAccess) {
    return (
      <View style={styles.container}>
        <LockedFeature
          feature="smartwallet"
          title="Unlock Smart Wallet"
          description="Get automatic card recommendations when you arrive at stores. Smart Wallet uses geofencing to notify you which card to use for maximum rewards."
          icon={<Navigation size={56} color={colors.warning.main} />}
          variant="inline"
          onSubscribe={() => {
            setHasAccess(canAccessFeatureSync('smartwallet'));
            setCurrentTier(getCurrentTierSync());
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary.main}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Navigation size={22} color={colors.primary.main} />
          <Text style={styles.title}>Smart Wallet</Text>
        </View>
        <Text style={styles.subtitle}>Best card at every store near you</Text>

        {/* Enable toggle */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Enable Smart Wallet</Text>
          <Switch
            value={status?.enabled || false}
            onValueChange={handleToggleAutoPilot}
            trackColor={{ false: colors.border.light, true: colors.success.main }}
            thumbColor={colors.background.secondary}
          />
        </View>

        {/* Location banner (shown when enabled) */}
        {status?.enabled && (
          <View style={styles.locationBanner}>
            <View style={styles.locationIconCircle}>
              <MapPin size={16} color={colors.primary.main} />
            </View>
            <Text style={styles.locationText}>Location active · Canada</Text>
            <Badge label="Live" variant="success" size="small" />
          </View>
        )}

        {/* NEARBY STORES section */}
        <Text style={styles.overline}>NEARBY STORES</Text>

        {merchantsWithCards.length > 0 ? (
          merchantsWithCards.map((merchant, index) => (
            <View key={`${merchant.name}-${index}`} style={styles.storeCard}>
              <View style={styles.storeTopRow}>
                <Text style={styles.storeName} numberOfLines={1}>
                  {merchant.name}
                </Text>
                {merchant.bestRewardRate != null && (
                  <Text style={[styles.storeRate]}>{merchant.bestRewardRate}%</Text>
                )}
              </View>
              <Text style={styles.storeMeta}>
                <CategoryIcon category={merchant.category} /> {formatCategory(merchant.category)}
              </Text>
              {merchant.bestCardName ? (
                <Text style={styles.storeTapWith}>
                  Tap with <Text style={styles.storeCardName}>{merchant.bestCardName}</Text>
                </Text>
              ) : null}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MapPin size={32} color={colors.text.secondary} />
            <Text style={styles.emptyStateText}>No stores found</Text>
          </View>
        )}

        {/* Monitored stores (geofences) */}
        {geofences.length > 0 && (
          <>
            <Text style={[styles.overline, { marginTop: 24 }]}>MONITORED STORES</Text>
            {geofences.map((geofence) => (
              <View key={geofence.id} style={styles.geofenceCard}>
                <View style={styles.geofenceContent}>
                  <Text style={styles.geofenceName}>{geofence.merchantName}</Text>
                  <Text style={styles.geofenceCategory}>{formatCategory(geofence.category)}</Text>
                </View>
                <Switch
                  value={geofence.enabled}
                  onValueChange={(enabled) => handleToggleGeofence(geofence.id, enabled)}
                  trackColor={{ false: colors.border.light, true: colors.success.main }}
                  thumbColor={colors.background.secondary}
                />
                <TouchableOpacity
                  onPress={() => handleRemoveGeofence(geofence.id)}
                  style={styles.removeButton}
                >
                  <Trash2 size={16} color={colors.error.main} />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* Add store button */}
        <TouchableOpacity
          style={styles.addStoreButton}
          onPress={() => setShowMerchantPicker(!showMerchantPicker)}
        >
          <Plus size={16} color={colors.primary.main} />
          <Text style={styles.addStoreText}>Add store to monitor</Text>
        </TouchableOpacity>

        {/* Merchant picker */}
        {showMerchantPicker && (
          <View style={styles.merchantPicker}>
            <View style={styles.searchContainer}>
              <Search size={16} color={colors.text.secondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search stores..."
                placeholderTextColor={colors.text.secondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            {filteredMerchants.map((merchant, index) => (
              <TouchableOpacity
                key={`picker-${merchant.name}-${index}`}
                style={[
                  styles.merchantItem,
                  isMerchantAdded(merchant.name) && styles.merchantItemDisabled,
                ]}
                onPress={() => !isMerchantAdded(merchant.name) && handleAddMerchant(merchant)}
                disabled={isMerchantAdded(merchant.name)}
              >
                <Text style={styles.merchantItemName}>{merchant.name}</Text>
                {isMerchantAdded(merchant.name) ? (
                  <Text style={styles.merchantAdded}>Added</Text>
                ) : (
                  <Plus size={16} color={colors.primary.main} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Privacy section */}
        <View style={styles.privacyCard}>
          <View style={styles.privacyRow}>
            <Shield size={16} color={colors.success.main} />
            <Text style={styles.privacyText}>Location processed on-device only</Text>
          </View>
          <View style={styles.privacyRow}>
            <Shield size={16} color={colors.success.main} />
            <Text style={styles.privacyText}>Only stores YOU choose are monitored</Text>
          </View>
          <View style={styles.privacyRow}>
            <Shield size={16} color={colors.success.main} />
            <Text style={styles.privacyText}>Disable anytime in Settings</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.privacyLink}
          onPress={async () => {
            const privacyUrl = 'https://rewardly.ca/privacy-policy';
            try {
              const supported = await Linking.canOpenURL(privacyUrl);
              if (supported) {
                await Linking.openURL(privacyUrl);
                return;
              }
            } catch {
              // fall through
            }
            showAlert(
              'Privacy Details',
              'Smart Wallet uses geofencing to detect when you enter a monitored store. Your exact location is never stored or transmitted. All processing happens on your device.'
            );
          }}
        >
          <Text style={styles.privacyLinkText}>Learn more about privacy</Text>
          <ChevronRight size={14} color={colors.primary.main} />
        </TouchableOpacity>

        {__DEV__ && (
          <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
            <Bell size={16} color={colors.primary.main} />
            <Text style={styles.testButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 20,
  },
  // Toggle row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  // Location banner
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.primary.main,
    padding: 12,
    marginBottom: 20,
  },
  locationIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary.bg10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  // Overline
  overline: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  // Store cards
  storeCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: 16,
    marginBottom: 10,
  },
  storeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  storeRate: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary.main,
    fontVariant: ['tabular-nums'],
  },
  storeMeta: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  storeTapWith: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  storeCardName: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: colors.text.secondary,
  },
  // Geofences
  geofenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  geofenceContent: {
    flex: 1,
  },
  geofenceName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  geofenceCategory: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  removeButton: {
    padding: 6,
  },
  // Add store
  addStoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
    paddingVertical: 12,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderStyle: 'dashed',
  },
  addStoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary.main,
  },
  // Merchant picker
  merchantPicker: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: 12,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text.primary,
  },
  merchantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  merchantItemDisabled: {
    opacity: 0.5,
  },
  merchantItemName: {
    fontSize: 14,
    color: colors.text.primary,
  },
  merchantAdded: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  // Privacy
  privacyCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: 14,
    gap: 10,
    marginTop: 24,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  privacyText: {
    fontSize: 13,
    color: colors.text.primary,
  },
  privacyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  privacyLinkText: {
    fontSize: 13,
    color: colors.primary.main,
  },
  // Test button
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.card,
    marginTop: 12,
    gap: 8,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary.main,
  },
});
