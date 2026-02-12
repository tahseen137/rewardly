/**
 * AutoPilotSetupScreen - Opt-in flow for AutoPilot feature
 * 
 * Clear, non-creepy permission request with privacy messaging
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { MapPin, Bell, Shield, ChevronRight, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import {
  enableAutoPilot,
  requestLocationPermission,
  requestNotificationPermission,
} from '../services/AutoPilotService';

interface AutoPilotSetupScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function AutoPilotSetupScreen({
  onComplete,
  onSkip,
}: AutoPilotSetupScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'intro' | 'permissions' | 'done'>('intro');
  const [locationGranted, setLocationGranted] = useState(false);
  const [notificationGranted, setNotificationGranted] = useState(false);

  const handleSetup = async () => {
    setIsLoading(true);
    setStep('permissions');
    
    try {
      // Request location permission
      const locGranted = await requestLocationPermission();
      setLocationGranted(locGranted);
      
      // Request notification permission
      const notifGranted = await requestNotificationPermission();
      setNotificationGranted(notifGranted);
      
      // If both granted, enable AutoPilot
      if (locGranted && notifGranted) {
        await enableAutoPilot();
        setStep('done');
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        // Can still proceed, but with limited functionality
        if (locGranted || notifGranted) {
          await enableAutoPilot();
        }
        setStep('done');
        setTimeout(() => {
          onComplete();
        }, 1500);
      }
    } catch (error) {
      console.error('Setup error:', error);
      setStep('done');
      setTimeout(() => {
        onComplete();
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  const renderIntro = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[colors.primary.main, colors.primary.dark]}
            style={styles.iconGradient}
          >
            <MapPin size={48} color="#FFFFFF" />
          </LinearGradient>
        </View>
        
        <Text style={styles.title}>Get alerts before you pay</Text>
        <Text style={styles.subtitle}>
          AutoPilot monitors stores YOU choose and recommends the best card for maximum rewards.
        </Text>
      </View>

      {/* Features */}
      <View style={styles.featuresSection}>
        <FeatureRow
          icon={<MapPin size={24} color={colors.primary.main} />}
          title="Smart Store Detection"
          description="Get notified when you arrive at your pinned stores"
        />
        <FeatureRow
          icon={<Bell size={24} color={colors.primary.main} />}
          title="Instant Recommendations"
          description="Know which card earns the most rewards before checkout"
        />
        <FeatureRow
          icon={<Shield size={24} color={colors.primary.main} />}
          title="Privacy First"
          description="Your location is processed on-device. No tracking."
        />
      </View>

      {/* Privacy Note */}
      <View style={styles.privacyNote}>
        <Shield size={16} color={colors.text.secondary} />
        <Text style={styles.privacyText}>
          AutoPilot only monitors stores you explicitly choose. You can disable it anytime.
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSetup}
          disabled={isLoading}
        >
          <LinearGradient
            colors={[colors.primary.main, colors.primary.dark]}
            style={styles.buttonGradient}
          >
            <Text style={styles.primaryButtonText}>Set Up AutoPilot</Text>
            <ChevronRight size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={onSkip}>
          <Text style={styles.secondaryButtonText}>Maybe Later</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderPermissions = () => (
    <View style={styles.permissionsContainer}>
      <Text style={styles.permissionsTitle}>Setting up AutoPilot...</Text>
      
      <View style={styles.permissionsList}>
        <PermissionRow
          title="Location Access"
          description="To detect when you're at stores"
          granted={locationGranted}
          loading={isLoading && !locationGranted && !notificationGranted}
        />
        <PermissionRow
          title="Notifications"
          description="To alert you with card recommendations"
          granted={notificationGranted}
          loading={isLoading && locationGranted && !notificationGranted}
        />
      </View>
      
      {isLoading && (
        <ActivityIndicator size="large" color={colors.primary.main} style={styles.loader} />
      )}
    </View>
  );

  const renderDone = () => (
    <View style={styles.doneContainer}>
      <View style={styles.doneIconContainer}>
        <Check size={48} color="#FFFFFF" />
      </View>
      <Text style={styles.doneTitle}>AutoPilot is Ready!</Text>
      <Text style={styles.doneSubtitle}>
        {locationGranted && notificationGranted
          ? "You'll get alerts when you arrive at your pinned stores."
          : "You can enable more features in Settings."}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {step === 'intro' && renderIntro()}
      {step === 'permissions' && renderPermissions()}
      {step === 'done' && renderDone()}
    </SafeAreaView>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

interface FeatureRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureRow({ icon, title, description }: FeatureRowProps) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>{icon}</View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

interface PermissionRowProps {
  title: string;
  description: string;
  granted: boolean;
  loading: boolean;
}

function PermissionRow({ title, description, granted, loading }: PermissionRowProps) {
  return (
    <View style={styles.permissionRow}>
      <View style={styles.permissionContent}>
        <Text style={styles.permissionTitle}>{title}</Text>
        <Text style={styles.permissionDescription}>{description}</Text>
      </View>
      <View style={styles.permissionStatus}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary.main} />
        ) : granted ? (
          <View style={styles.permissionGranted}>
            <Check size={16} color="#FFFFFF" />
          </View>
        ) : (
          <View style={styles.permissionPending} />
        )}
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  featuresSection: {
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.light + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
    marginLeft: 12,
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  secondaryButtonText: {
    fontSize: 17,
    color: colors.text.secondary,
  },
  permissionsContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  permissionsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 32,
  },
  permissionsList: {
    gap: 16,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: 16,
    borderRadius: 12,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  permissionStatus: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionGranted: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.semantic.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionPending: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.medium,
  },
  loader: {
    marginTop: 32,
  },
  doneContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  doneIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.semantic.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  doneTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  doneSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
