/**
 * AutoPilotScreen - Main AutoPilot management screen
 * 
 * Includes:
 * - AutoPilot toggle
 * - Merchant search and pinning
 * - Active geofences list
 * - Privacy dashboard
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
  Alert,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
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
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { SpendingCategory } from '../types';
import {
  initializeAutoPilot,
  isAutoPilotEnabled,
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

// ============================================================================
// Types
// ============================================================================

interface MerchantWithBestCard extends SeedMerchant {
  bestCardName?: string;
  bestRewardRate?: number;
}

// ============================================================================
// Main Component
// ============================================================================

export default function AutoPilotScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [status, setStatus] = useState<AutoPilotStatus | null>(null);
  const [geofences, setGeofences] = useState<MerchantGeofence[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMerchantPicker, setShowMerchantPicker] = useState(false);
  const [merchantsWithCards, setMerchantsWithCards] = useState<MerchantWithBestCard[]>([]);

  // Load initial data
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
      
      // Load best card info for each seed merchant
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
      console.error('Failed to load AutoPilot data:', error);
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
          Alert.alert(
            'Permission Required',
            'AutoPilot needs location and notification permissions to work. Please enable them in Settings.',
            [{ text: 'OK' }]
          );
          return;
        }
      } else {
        await disableAutoPilot();
      }
      
      const currentStatus = await getAutoPilotStatus();
      setStatus(currentStatus);
    } catch (error) {
      console.error('Failed to toggle AutoPilot:', error);
    }
  };

  const handleAddMerchant = async (merchant: MerchantWithBestCard) => {
    try {
      // Use the first location from the seed data
      const location = merchant.locations[0];
      
      await addGeofence(
        merchant.name,
        merchant.category,
        location.lat,
        location.lng
      );
      
      setGeofences(getGeofences());
      setShowMerchantPicker(false);
      setSearchQuery('');
      
      // Update status
      const currentStatus = await getAutoPilotStatus();
      setStatus(currentStatus);
    } catch (error) {
      console.error('Failed to add geofence:', error);
      Alert.alert('Error', 'Failed to add store. Please try again.');
    }
  };

  const handleRemoveGeofence = async (geofenceId: string) => {
    Alert.alert(
      'Remove Store',
      'Are you sure you want to stop monitoring this store?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeGeofence(geofenceId);
            setGeofences(getGeofences());
            
            const currentStatus = await getAutoPilotStatus();
            setStatus(currentStatus);
          },
        },
      ]
    );
  };

  const handleToggleGeofence = async (geofenceId: string, enabled: boolean) => {
    await toggleGeofence(geofenceId, enabled);
    setGeofences(getGeofences());
  };

  const handleTestNotification = async () => {
    await sendTestNotification();
    Alert.alert('Test Sent', 'Check your notifications!');
  };

  // Filter merchants based on search
  const filteredMerchants = useMemo(() => {
    if (!searchQuery) return merchantsWithCards;
    
    const query = searchQuery.toLowerCase();
    return merchantsWithCards.filter(m => 
      m.name.toLowerCase().includes(query)
    );
  }, [merchantsWithCards, searchQuery]);

  // Check if a merchant is already added
  const isMerchantAdded = useCallback((merchantName: string) => {
    return geofences.some(g => g.merchantName === merchantName);
  }, [geofences]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>AutoPilot</Text>
          <Text style={styles.subtitle}>
            Get alerts with the best card to use at your favorite stores
          </Text>
        </View>

        {/* Main Toggle */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleContent}>
            <View style={styles.toggleIcon}>
              <Navigation size={24} color={colors.primary.main} />
            </View>
            <View style={styles.toggleText}>
              <Text style={styles.toggleTitle}>Enable AutoPilot</Text>
              <Text style={styles.toggleDescription}>
                {status?.enabled
                  ? `Monitoring ${status.activeGeofences} stores`
                  : 'Turn on to get card recommendations'}
              </Text>
            </View>
          </View>
          <Switch
            value={status?.enabled || false}
            onValueChange={handleToggleAutoPilot}
            trackColor={{
              false: colors.border.medium,
              true: colors.primary.light,
            }}
            thumbColor={status?.enabled ? colors.primary.main : '#f4f3f4'}
          />
        </View>

        {/* Add Store Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Monitored Stores</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowMerchantPicker(!showMerchantPicker)}
            >
              <Plus size={20} color={colors.primary.main} />
              <Text style={styles.addButtonText}>Add Store</Text>
            </TouchableOpacity>
          </View>

          {/* Merchant Picker */}
          {showMerchantPicker && (
            <View style={styles.merchantPicker}>
              <View style={styles.searchContainer}>
                <Search size={20} color={colors.text.secondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search stores..."
                  placeholderTextColor={colors.text.secondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <View style={styles.merchantList}>
                {filteredMerchants.map((merchant, index) => (
                  <TouchableOpacity
                    key={`${merchant.name}-${index}`}
                    style={[
                      styles.merchantItem,
                      isMerchantAdded(merchant.name) && styles.merchantItemDisabled,
                    ]}
                    onPress={() => !isMerchantAdded(merchant.name) && handleAddMerchant(merchant)}
                    disabled={isMerchantAdded(merchant.name)}
                  >
                    <View style={styles.merchantIcon}>
                      <CategoryIcon category={merchant.category} />
                    </View>
                    <View style={styles.merchantContent}>
                      <Text style={styles.merchantName}>{merchant.name}</Text>
                      {merchant.bestCardName && (
                        <Text style={styles.merchantBestCard}>
                          {merchant.bestRewardRate}% back with {merchant.bestCardName}
                        </Text>
                      )}
                    </View>
                    {isMerchantAdded(merchant.name) ? (
                      <Text style={styles.merchantAdded}>Added</Text>
                    ) : (
                      <Plus size={20} color={colors.primary.main} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Active Geofences */}
          {geofences.length > 0 ? (
            <View style={styles.geofenceList}>
              {geofences.map(geofence => (
                <GeofenceCard
                  key={geofence.id}
                  geofence={geofence}
                  onToggle={(enabled) => handleToggleGeofence(geofence.id, enabled)}
                  onRemove={() => handleRemoveGeofence(geofence.id)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MapPin size={48} color={colors.text.secondary} />
              <Text style={styles.emptyStateText}>No stores monitored yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Add stores above to get card recommendations when you arrive
              </Text>
            </View>
          )}
        </View>

        {/* Privacy Dashboard */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Privacy</Text>
          </View>

          <View style={styles.privacyCard}>
            <View style={styles.privacyRow}>
              <Shield size={20} color={colors.semantic.success} />
              <Text style={styles.privacyText}>
                Location processed on-device only
              </Text>
            </View>
            <View style={styles.privacyRow}>
              <Shield size={20} color={colors.semantic.success} />
              <Text style={styles.privacyText}>
                Only stores YOU choose are monitored
              </Text>
            </View>
            <View style={styles.privacyRow}>
              <Shield size={20} color={colors.semantic.success} />
              <Text style={styles.privacyText}>
                Disable anytime in Settings
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.privacyLink}
            onPress={() => {
              Alert.alert(
                'Privacy Details',
                'AutoPilot uses geofencing technology to detect when you enter a monitored store. Your exact location is never stored or transmitted. All processing happens on your device.\n\nYou control which stores are monitored. You can disable AutoPilot or remove individual stores at any time.\n\nWe do not sell your data to third parties.',
                [{ text: 'Got it' }]
              );
            }}
          >
            <Text style={styles.privacyLinkText}>Learn more about privacy</Text>
            <ChevronRight size={16} color={colors.primary.main} />
          </TouchableOpacity>
        </View>

        {/* Test Button (for development) */}
        {__DEV__ && (
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestNotification}
          >
            <Bell size={20} color={colors.primary.main} />
            <Text style={styles.testButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

interface GeofenceCardProps {
  geofence: MerchantGeofence;
  onToggle: (enabled: boolean) => void;
  onRemove: () => void;
}

function GeofenceCard({ geofence, onToggle, onRemove }: GeofenceCardProps) {
  return (
    <View style={styles.geofenceCard}>
      <View style={styles.geofenceIcon}>
        <CategoryIcon category={geofence.category} />
      </View>
      <View style={styles.geofenceContent}>
        <Text style={styles.geofenceName}>{geofence.merchantName}</Text>
        <Text style={styles.geofenceCategory}>
          {formatCategory(geofence.category)}
        </Text>
      </View>
      <View style={styles.geofenceActions}>
        <Switch
          value={geofence.enabled}
          onValueChange={onToggle}
          trackColor={{
            false: colors.border.medium,
            true: colors.primary.light,
          }}
          thumbColor={geofence.enabled ? colors.primary.main : '#f4f3f4'}
        />
        <TouchableOpacity
          style={styles.removeButton}
          onPress={onRemove}
        >
          <Trash2 size={18} color={colors.semantic.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CategoryIcon({ category }: { category: SpendingCategory }) {
  const iconProps = { size: 20, color: colors.text.primary };
  
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

// ============================================================================
// Styles
// ============================================================================

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
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.light + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toggleText: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.primary.light + '20',
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
    marginLeft: 6,
  },
  merchantPicker: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 8,
    fontSize: 16,
    color: colors.text.primary,
  },
  merchantList: {
    maxHeight: 300,
  },
  merchantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  merchantItemDisabled: {
    opacity: 0.5,
  },
  merchantIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  merchantContent: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 2,
  },
  merchantBestCard: {
    fontSize: 13,
    color: colors.primary.main,
  },
  merchantAdded: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  geofenceList: {
    gap: 12,
  },
  geofenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: 16,
    borderRadius: 12,
  },
  geofenceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.light + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  geofenceContent: {
    flex: 1,
  },
  geofenceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  geofenceCategory: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  geofenceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  removeButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
  },
  emptyStateText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  privacyCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyText: {
    fontSize: 14,
    color: colors.text.primary,
    marginLeft: 12,
  },
  privacyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  privacyLinkText: {
    fontSize: 14,
    color: colors.primary.main,
    marginRight: 4,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginTop: 16,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.main,
    marginLeft: 8,
  },
});
