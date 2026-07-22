/**
 * SpendingProfileWizardScreen
 *
 * Gamified step-by-step wizard for setting up a spending profile.
 * One category per step with a visual budget bar, quick-pick presets,
 * and ± fine-tune controls. Saves via SpendingProfileService on completion.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  LayoutChangeEvent,
  GestureResponderEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import { SpendingProfileInput } from '../types';
import {
  saveSpendingProfile,
  getDefaultSpendingProfile,
  getFromSpendingLog,
} from '../services/SpendingProfileService';

// ─── Category config ────────────────────────────────────────────────────────

interface CategoryConfig {
  key: keyof SpendingProfileInput;
  label: string;
  icon: string;
  description: string;
  presets: number[];   // quick-pick amounts
  maxBar: number;      // $ amount that fills the bar 100%
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'groceries',
    label: 'Groceries',
    icon: '🛒',
    description: 'Supermarkets, food stores',
    presets: [200, 400, 600, 800],
    maxBar: 1500,
  },
  {
    key: 'dining',
    label: 'Dining & Restaurants',
    icon: '🍽️',
    description: 'Restaurants, takeout, coffee',
    presets: [50, 100, 200, 400],
    maxBar: 800,
  },
  {
    key: 'gas',
    label: 'Gas & Fuel',
    icon: '⛽',
    description: 'Gas stations, fuel',
    presets: [50, 100, 150, 250],
    maxBar: 500,
  },
  {
    key: 'travel',
    label: 'Travel',
    icon: '✈️',
    description: 'Flights, hotels, car rentals',
    presets: [0, 100, 300, 600],
    maxBar: 1200,
  },
  {
    key: 'onlineShopping',
    label: 'Online Shopping',
    icon: '📦',
    description: 'Amazon, e-commerce',
    presets: [50, 100, 200, 400],
    maxBar: 800,
  },
  {
    key: 'entertainment',
    label: 'Entertainment',
    icon: '🎬',
    description: 'Streaming, events, activities',
    presets: [0, 50, 100, 200],
    maxBar: 500,
  },
  {
    key: 'drugstores',
    label: 'Drugstores & Pharmacy',
    icon: '💊',
    description: 'Shoppers, Rexall, pharmacies',
    presets: [0, 25, 75, 150],
    maxBar: 400,
  },
  {
    key: 'homeImprovement',
    label: 'Home Improvement',
    icon: '🔨',
    description: 'Home Depot, Rona, hardware',
    presets: [0, 50, 150, 300],
    maxBar: 600,
  },
  {
    key: 'transit',
    label: 'Public Transit',
    icon: '🚇',
    description: 'TTC, Presto, transit passes',
    presets: [0, 50, 100, 160],
    maxBar: 300,
  },
  {
    key: 'other',
    label: 'Other Spending',
    icon: '🛍️',
    description: 'Everything else',
    presets: [50, 100, 200, 400],
    maxBar: 800,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function SpendingProfileWizardScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState(0); // 0..CATEGORIES.length-1, then "done"
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<SpendingProfileInput>(getDefaultSpendingProfile());

  // Animation refs
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const doneAnim = useRef(new Animated.Value(0)).current;

  // Bar tap tracking
  const barWidth = useRef(0);

  const currentCat = CATEGORIES[step];
  const currentValue = currentCat ? values[currentCat.key] : 0;
  const totalMonthly = Object.values(values).reduce((s, v) => s + v, 0);

  // Animate progress bar
  const animateProgress = useCallback(
    (nextStep: number) => {
      Animated.timing(progressAnim, {
        toValue: nextStep / CATEGORIES.length,
        duration: 350,
        useNativeDriver: false,
      }).start();
    },
    [progressAnim]
  );

  // Slide transition between steps
  const animateSlide = useCallback(
    (direction: 1 | -1, cb: () => void) => {
      slideAnim.setValue(0);
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: direction * -30,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: direction * 40,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(cb);
    },
    [slideAnim]
  );

  const handleNext = () => {
    if (step < CATEGORIES.length - 1) {
      animateSlide(1, () => {
        const next = step + 1;
        setStep(next);
        animateProgress(next);
      });
    } else {
      // Last step — save
      handleSave();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      animateSlide(-1, () => {
        const prev = step - 1;
        setStep(prev);
        animateProgress(prev);
      });
    } else {
      navigation.goBack();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSpendingProfile(values);
      setDone(true);
      Animated.spring(doneAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }).start();
    } finally {
      setSaving(false);
    }
  };

  const setValue = (key: keyof SpendingProfileInput, val: number) => {
    setValues((prev) => ({ ...prev, [key]: Math.max(0, Math.round(val)) }));
  };

  const handleBarTap = (e: GestureResponderEvent) => {
    if (barWidth.current === 0) return;
    const x = e.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, x / barWidth.current));
    const newVal = Math.round((ratio * currentCat.maxBar) / 25) * 25; // snap to $25
    setValue(currentCat.key, newVal);
  };

  const handleBarLayout = (e: LayoutChangeEvent) => {
    barWidth.current = e.nativeEvent.layout.width;
  };

  const handleAutoFill = async () => {
    const fromLog = await getFromSpendingLog();
    if (fromLog) setValues(fromLog);
  };

  // ── Done screen ────────────────────────────────────────────────────────────
  if (done) {
    return (
      <View style={styles.doneContainer}>
        <Animated.View
          style={[
            styles.doneCard,
            {
              opacity: doneAnim,
              transform: [
                {
                  scale: doneAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.85, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.doneStar}>🎉</Text>
          <Text style={styles.doneTitle}>Profile Saved!</Text>
          <Text style={styles.doneSubtitle}>
            Your Rewards IQ score, boost tips, and card recommendations are now personalized.
          </Text>

          <View style={styles.doneSummary}>
            {CATEGORIES.map((cat) => (
              <View key={cat.key} style={styles.doneSummaryRow}>
                <Text style={styles.doneSummaryIcon}>{cat.icon}</Text>
                <Text style={styles.doneSummaryLabel}>{cat.label}</Text>
                <Text style={styles.doneSummaryValue}>${values[cat.key]}/mo</Text>
              </View>
            ))}
            <View style={[styles.doneSummaryRow, styles.doneSummaryTotal]}>
              <Text style={styles.doneTotalLabel}>Total Monthly</Text>
              <Text style={styles.doneTotalValue}>${totalMonthly.toLocaleString()}/mo</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneButtonText}>View My Insights →</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ── Wizard step ─────────────────────────────────────────────────────────────
  const barFill = Math.min(1, currentValue / currentCat.maxBar);
  const isLast = step === CATEGORIES.length - 1;

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <ChevronLeft size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Spending Profile</Text>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSave}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* ── Progress bar ── */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.stepCounter}>
        Step {step + 1} of {CATEGORIES.length}
      </Text>

      {/* ── Category card ── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[styles.card, { transform: [{ translateX: slideAnim }] }]}
        >
          <Text style={styles.catIcon}>{currentCat.icon}</Text>
          <Text style={styles.catLabel}>{currentCat.label}</Text>
          <Text style={styles.catDesc}>{currentCat.description}</Text>

          {/* Amount display */}
          <View style={styles.amountRow}>
            <TouchableOpacity
              style={styles.nudgeBtn}
              onPress={() => setValue(currentCat.key, currentValue - 25)}
            >
              <Text style={styles.nudgeText}>−</Text>
            </TouchableOpacity>
            <View style={styles.amountDisplay}>
              <Text style={styles.amountCurrency}>$</Text>
              <Text style={styles.amountValue}>{currentValue.toLocaleString()}</Text>
              <Text style={styles.amountUnit}>/mo</Text>
            </View>
            <TouchableOpacity
              style={styles.nudgeBtn}
              onPress={() => setValue(currentCat.key, currentValue + 25)}
            >
              <Text style={styles.nudgeText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Tap-bar slider */}
          <View style={styles.barContainer}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleBarTap}
              onLayout={handleBarLayout}
              style={styles.barTrack}
            >
              <View style={[styles.barFill, { width: `${barFill * 100}%` }]} />
              <View style={[styles.barThumb, { left: `${barFill * 100}%` }]} />
            </TouchableOpacity>
            <View style={styles.barLabels}>
              <Text style={styles.barLabel}>$0</Text>
              <Text style={styles.barLabel}>${(currentCat.maxBar / 2).toLocaleString()}</Text>
              <Text style={styles.barLabel}>${currentCat.maxBar.toLocaleString()}+</Text>
            </View>
          </View>

          {/* Quick-pick presets */}
          <Text style={styles.presetsTitle}>Quick pick</Text>
          <View style={styles.presets}>
            {currentCat.presets.map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.preset,
                  currentValue === preset && styles.presetActive,
                ]}
                onPress={() => setValue(currentCat.key, preset)}
              >
                <Text
                  style={[
                    styles.presetText,
                    currentValue === preset && styles.presetTextActive,
                  ]}
                >
                  ${preset}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Monthly running total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Monthly total so far</Text>
          <Text style={styles.totalValue}>${totalMonthly.toLocaleString()}/mo</Text>
        </View>

        {/* Auto-fill hint (first step only) */}
        {step === 0 && (
          <TouchableOpacity style={styles.autoFillBtn} onPress={handleAutoFill}>
            <Text style={styles.autoFillText}>📊 Auto-fill from Spending Log</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ── Next button ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, saving && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={saving}
        >
          {isLast ? (
            saving ? (
              <Text style={styles.nextBtnText}>Saving…</Text>
            ) : (
              <>
                <Check size={18} color="#fff" />
                <Text style={styles.nextBtnText}>Save Profile</Text>
              </>
            )
          ) : (
            <>
              <Text style={styles.nextBtnText}>Next</Text>
              <ChevronRight size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 12,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
  },
  skipBtn: {
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    color: colors.text.secondary,
  },

  // Progress
  progressTrack: {
    height: 4,
    backgroundColor: colors.background.tertiary,
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: 2,
  },
  stepCounter: {
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Category card
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 24,
    marginTop: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  catIcon: {
    fontSize: 52,
    marginBottom: 8,
  },
  catLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  catDesc: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 24,
  },

  // Amount
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 24,
  },
  nudgeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  nudgeText: {
    fontSize: 22,
    color: colors.text.primary,
    fontWeight: '400',
    lineHeight: 26,
  },
  amountDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    minWidth: 130,
    justifyContent: 'center',
  },
  amountCurrency: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary.main,
  },
  amountValue: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.primary.main,
    letterSpacing: -1,
  },
  amountUnit: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '500',
    marginLeft: 2,
  },

  // Bar slider
  barContainer: {
    width: '100%',
    marginBottom: 24,
  },
  barTrack: {
    height: 28,
    backgroundColor: colors.background.tertiary,
    borderRadius: 14,
    overflow: 'visible',
    position: 'relative',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary.main,
    borderRadius: 14,
    opacity: 0.85,
  },
  barThumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary.main,
    borderWidth: 3,
    borderColor: '#fff',
    marginLeft: -14,
    top: -1,
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  barLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
  },

  // Presets
  presetsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  presets: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  preset: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: borderRadius.full ?? 24,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  presetActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  presetText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  presetTextActive: {
    color: '#fff',
  },

  // Running total
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 4,
  },
  totalLabel: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },

  // Auto-fill
  autoFillBtn: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  autoFillText: {
    fontSize: 13,
    color: colors.primary.main,
    fontWeight: '500',
  },

  // Footer / Next
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    paddingVertical: 16,
  },
  nextBtnDisabled: {
    opacity: 0.6,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // Done screen
  doneContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  doneCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 28,
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  doneStar: {
    fontSize: 56,
    marginBottom: 12,
  },
  doneTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 8,
  },
  doneSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  doneSummary: {
    width: '100%',
    gap: 6,
    marginBottom: 24,
  },
  doneSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  doneSummaryIcon: {
    fontSize: 16,
    width: 24,
  },
  doneSummaryLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
  },
  doneSummaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  doneSummaryTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: 10,
    marginTop: 6,
  },
  doneTotalLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  doneTotalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary.main,
  },
  doneButton: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
