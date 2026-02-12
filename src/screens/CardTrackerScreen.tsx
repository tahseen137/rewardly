/**
 * CardTrackerScreen - Track signup bonuses and spending requirements 💳
 * "You need $800 more in 45 days to unlock 50,000 points"
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import {
  CreditCard,
  Clock,
  Target,
  Plus,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Trophy,
  X,
  Calendar,
  DollarSign,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import { Card, SignupBonus } from '../types';
import { getAllCardsSync, getCardByIdSync } from '../services/CardDataService';
import { getCards } from '../services/CardPortfolioManager';

// ============================================================================
// Types
// ============================================================================

interface TrackedCard {
  cardId: string;
  applicationDate: Date;
  currentSpend: number;
  targetSpend: number;
  bonusPoints: number;
  deadlineDays: number;
  isCompleted: boolean;
  completedDate?: Date;
}

interface TrackerState {
  trackedCards: TrackedCard[];
  lastUpdated: Date;
}

const TRACKER_STORAGE_KEY = 'card_tracker_state';

// ============================================================================
// Progress Circle Component
// ============================================================================

interface ProgressCircleProps {
  progress: number; // 0-1
  size: number;
  strokeWidth: number;
  color: string;
}

function ProgressCircle({ progress, size, strokeWidth, color }: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const animatedProgress = useSharedValue(0);
  
  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);
  
  return (
    <View style={{ width: size, height: size }}>
      {/* Background circle */}
      <View
        style={[
          styles.progressCircleBg,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: colors.border.light,
          },
        ]}
      />
      {/* Progress circle (simplified - not animated SVG) */}
      <View
        style={[
          styles.progressCircleFill,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            borderTopColor: progress > 0.25 ? color : 'transparent',
            borderRightColor: progress > 0.5 ? color : 'transparent',
            borderBottomColor: progress > 0.75 ? color : 'transparent',
            borderLeftColor: progress > 0 ? color : 'transparent',
            transform: [{ rotate: '-90deg' }],
          },
        ]}
      />
    </View>
  );
}

// ============================================================================
// Tracked Card Item Component
// ============================================================================

interface TrackedCardItemProps {
  tracked: TrackedCard;
  card: Card | null;
  onUpdateSpend: (cardId: string, amount: number) => void;
  onMarkComplete: (cardId: string) => void;
  onRemove: (cardId: string) => void;
  index: number;
}

function TrackedCardItem({ 
  tracked, 
  card, 
  onUpdateSpend, 
  onMarkComplete, 
  onRemove,
  index 
}: TrackedCardItemProps) {
  const [showEditSpend, setShowEditSpend] = useState(false);
  const [newSpend, setNewSpend] = useState(String(tracked.currentSpend));
  
  if (!card) return null;
  
  const progress = Math.min(tracked.currentSpend / tracked.targetSpend, 1);
  const remaining = Math.max(tracked.targetSpend - tracked.currentSpend, 0);
  
  // Calculate days remaining
  const appDate = new Date(tracked.applicationDate);
  const deadlineDate = new Date(appDate);
  deadlineDate.setDate(deadlineDate.getDate() + tracked.deadlineDays);
  const today = new Date();
  const daysRemaining = Math.max(
    Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
    0
  );
  
  const isUrgent = daysRemaining <= 30 && !tracked.isCompleted;
  const isExpiringSoon = daysRemaining <= 14 && !tracked.isCompleted;
  
  const getStatusColor = () => {
    if (tracked.isCompleted) return colors.primary.main;
    if (isExpiringSoon) return colors.error.main;
    if (isUrgent) return colors.warning.main;
    return colors.accent.main;
  };
  
  const handleSaveSpend = () => {
    const amount = parseFloat(newSpend) || 0;
    onUpdateSpend(tracked.cardId, amount);
    setShowEditSpend(false);
  };
  
  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(400)}>
      <View style={[
        styles.trackedCard,
        tracked.isCompleted && styles.trackedCardCompleted,
        isExpiringSoon && !tracked.isCompleted && styles.trackedCardUrgent,
      ]}>
        {/* Header */}
        <View style={styles.trackedHeader}>
          <View style={styles.trackedInfo}>
            <Text style={styles.trackedCardName} numberOfLines={1}>
              {card.name}
            </Text>
            <Text style={styles.trackedIssuer}>{card.issuer}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(tracked.cardId)}
          >
            <X size={18} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>
        
        {/* Progress Section */}
        <View style={styles.progressSection}>
          {/* Progress Info */}
          <View style={styles.progressInfo}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Spending Progress</Text>
              <Text style={[styles.progressPercent, { color: getStatusColor() }]}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
            
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${progress * 100}%`, backgroundColor: getStatusColor() },
                ]}
              />
            </View>
            
            <View style={styles.spendingRow}>
              <Text style={styles.spendingCurrent}>
                ${tracked.currentSpend.toLocaleString()}
              </Text>
              <Text style={styles.spendingTarget}>
                of ${tracked.targetSpend.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Bonus & Deadline */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Trophy size={16} color={colors.warning.main} />
            <Text style={styles.detailText}>
              {tracked.bonusPoints.toLocaleString()} points
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Clock size={16} color={isExpiringSoon ? colors.error.main : colors.text.tertiary} />
            <Text style={[
              styles.detailText,
              isExpiringSoon && styles.detailTextUrgent,
            ]}>
              {tracked.isCompleted 
                ? 'Completed!' 
                : `${daysRemaining} days left`
              }
            </Text>
          </View>
        </View>
        
        {/* Actions */}
        {!tracked.isCompleted && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.updateSpendButton}
              onPress={() => setShowEditSpend(true)}
            >
              <DollarSign size={16} color={colors.accent.main} />
              <Text style={styles.updateSpendText}>Update Spend</Text>
            </TouchableOpacity>
            
            {progress >= 1 && (
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => onMarkComplete(tracked.cardId)}
              >
                <CheckCircle size={16} color={colors.primary.main} />
                <Text style={styles.completeText}>Mark Complete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* Urgent Warning */}
        {isExpiringSoon && !tracked.isCompleted && (
          <View style={styles.urgentBanner}>
            <AlertTriangle size={14} color={colors.error.main} />
            <Text style={styles.urgentText}>
              Need ${remaining.toLocaleString()} more in {daysRemaining} days!
            </Text>
          </View>
        )}
        
        {/* Edit Spend Modal */}
        <Modal visible={showEditSpend} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Update Spending</Text>
              
              <View style={styles.modalInputContainer}>
                <Text style={styles.modalInputPrefix}>$</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newSpend}
                  onChangeText={setNewSpend}
                  keyboardType="numeric"
                  autoFocus
                />
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowEditSpend(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={handleSaveSpend}
                >
                  <LinearGradient
                    colors={[colors.primary.main, colors.primary.dark]}
                    style={styles.modalSaveGradient}
                  >
                    <Text style={styles.modalSaveText}>Save</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Add Card Modal
// ============================================================================

interface AddCardModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (tracked: TrackedCard) => void;
  availableCards: Card[];
}

function AddCardModal({ visible, onClose, onAdd, availableCards }: AddCardModalProps) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [targetSpend, setTargetSpend] = useState('1000');
  const [bonusPoints, setBonusPoints] = useState('50000');
  const [deadlineDays, setDeadlineDays] = useState('90');
  
  const handleAdd = () => {
    if (!selectedCard) return;
    
    onAdd({
      cardId: selectedCard.id,
      applicationDate: new Date(),
      currentSpend: 0,
      targetSpend: parseFloat(targetSpend) || 1000,
      bonusPoints: parseInt(bonusPoints) || 50000,
      deadlineDays: parseInt(deadlineDays) || 90,
      isCompleted: false,
    });
    
    setSelectedCard(null);
    setTargetSpend('1000');
    setBonusPoints('50000');
    setDeadlineDays('90');
    onClose();
  };
  
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.addModalContainer}>
        <View style={styles.addModalHeader}>
          <Text style={styles.addModalTitle}>Track New Card</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.addModalContent}>
          <Text style={styles.addModalLabel}>Select Card</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.cardPicker}
          >
            {availableCards.map(card => (
              <TouchableOpacity
                key={card.id}
                style={[
                  styles.cardPickerItem,
                  selectedCard?.id === card.id && styles.cardPickerItemSelected,
                ]}
                onPress={() => setSelectedCard(card)}
              >
                <CreditCard 
                  size={20} 
                  color={selectedCard?.id === card.id ? colors.primary.main : colors.text.secondary}
                />
                <Text style={[
                  styles.cardPickerName,
                  selectedCard?.id === card.id && styles.cardPickerNameSelected,
                ]} numberOfLines={2}>
                  {card.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <Text style={styles.addModalLabel}>Spending Requirement ($)</Text>
          <View style={styles.addModalInputRow}>
            <TextInput
              style={styles.addModalInput}
              value={targetSpend}
              onChangeText={setTargetSpend}
              keyboardType="numeric"
              placeholder="1000"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>
          
          <Text style={styles.addModalLabel}>Bonus Points</Text>
          <View style={styles.addModalInputRow}>
            <TextInput
              style={styles.addModalInput}
              value={bonusPoints}
              onChangeText={setBonusPoints}
              keyboardType="numeric"
              placeholder="50000"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>
          
          <Text style={styles.addModalLabel}>Time Limit (Days)</Text>
          <View style={styles.addModalInputRow}>
            <TextInput
              style={styles.addModalInput}
              value={deadlineDays}
              onChangeText={setDeadlineDays}
              keyboardType="numeric"
              placeholder="90"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>
        </ScrollView>
        
        <View style={styles.addModalFooter}>
          <TouchableOpacity
            onPress={handleAdd}
            disabled={!selectedCard}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={selectedCard 
                ? [colors.primary.main, colors.primary.dark]
                : [colors.text.disabled, colors.text.disabled]
              }
              style={styles.addButton}
            >
              <Plus size={20} color={colors.background.primary} />
              <Text style={styles.addButtonText}>Start Tracking</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// Main Screen
// ============================================================================

export default function CardTrackerScreen() {
  const [trackedCards, setTrackedCards] = useState<TrackedCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const allCards = getAllCardsSync();
  
  // Load tracked cards
  useEffect(() => {
    loadTrackerState();
  }, []);
  
  const loadTrackerState = async () => {
    try {
      const saved = await AsyncStorage.getItem(TRACKER_STORAGE_KEY);
      if (saved) {
        const state: TrackerState = JSON.parse(saved);
        setTrackedCards(state.trackedCards.map(tc => ({
          ...tc,
          applicationDate: new Date(tc.applicationDate),
          completedDate: tc.completedDate ? new Date(tc.completedDate) : undefined,
        })));
      }
    } catch (e) {
      console.error('Failed to load tracker state:', e);
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveTrackerState = async (cards: TrackedCard[]) => {
    try {
      const state: TrackerState = {
        trackedCards: cards,
        lastUpdated: new Date(),
      };
      await AsyncStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save tracker state:', e);
    }
  };
  
  const handleAddCard = useCallback((tracked: TrackedCard) => {
    const updated = [...trackedCards, tracked];
    setTrackedCards(updated);
    saveTrackerState(updated);
  }, [trackedCards]);
  
  const handleUpdateSpend = useCallback((cardId: string, amount: number) => {
    const updated = trackedCards.map(tc =>
      tc.cardId === cardId ? { ...tc, currentSpend: amount } : tc
    );
    setTrackedCards(updated);
    saveTrackerState(updated);
  }, [trackedCards]);
  
  const handleMarkComplete = useCallback((cardId: string) => {
    const updated = trackedCards.map(tc =>
      tc.cardId === cardId 
        ? { ...tc, isCompleted: true, completedDate: new Date() } 
        : tc
    );
    setTrackedCards(updated);
    saveTrackerState(updated);
  }, [trackedCards]);
  
  const handleRemove = useCallback((cardId: string) => {
    Alert.alert(
      'Remove Card',
      'Are you sure you want to stop tracking this card?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updated = trackedCards.filter(tc => tc.cardId !== cardId);
            setTrackedCards(updated);
            saveTrackerState(updated);
          },
        },
      ]
    );
  }, [trackedCards]);
  
  // Get cards available to track (not already tracked)
  const availableCards = useMemo(() => {
    const trackedIds = new Set(trackedCards.map(tc => tc.cardId));
    return allCards.filter(c => !trackedIds.has(c.id));
  }, [allCards, trackedCards]);
  
  // Separate active and completed
  const { activeCards, completedCards } = useMemo(() => {
    const active = trackedCards.filter(tc => !tc.isCompleted);
    const completed = trackedCards.filter(tc => tc.isCompleted);
    return { activeCards: active, completedCards: completed };
  }, [trackedCards]);
  
  // Calculate stats
  const stats = useMemo(() => {
    const totalBonuses = trackedCards.reduce((sum, tc) => sum + tc.bonusPoints, 0);
    const earnedBonuses = completedCards.reduce((sum, tc) => sum + tc.bonusPoints, 0);
    const urgentCount = activeCards.filter(tc => {
      const deadline = new Date(tc.applicationDate);
      deadline.setDate(deadline.getDate() + tc.deadlineDays);
      const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 30;
    }).length;
    
    return { totalBonuses, earnedBonuses, urgentCount, activeCount: activeCards.length };
  }, [trackedCards, activeCards, completedCards]);
  
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <Animated.View 
        entering={FadeInDown.duration(400)}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Card Tracker</Text>
        <Text style={styles.headerSubtitle}>
          Track your signup bonuses & spending requirements
        </Text>
      </Animated.View>
      
      {/* Stats */}
      <Animated.View 
        entering={FadeInDown.delay(100).duration(400)}
        style={styles.statsRow}
      >
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.activeCount}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxMiddle]}>
          <Text style={[styles.statValue, { color: colors.warning.main }]}>
            {stats.urgentCount}
          </Text>
          <Text style={styles.statLabel}>Urgent</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: colors.primary.main }]}>
            {(stats.earnedBonuses / 1000).toFixed(0)}K
          </Text>
          <Text style={styles.statLabel}>Earned</Text>
        </View>
      </Animated.View>
      
      {/* Add Card Button */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <TouchableOpacity
          style={styles.addCardButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color={colors.primary.main} />
          <Text style={styles.addCardText}>Track New Card</Text>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Active Cards */}
      {activeCards.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>In Progress</Text>
          {activeCards.map((tracked, index) => (
            <TrackedCardItem
              key={tracked.cardId}
              tracked={tracked}
              card={getCardByIdSync(tracked.cardId)}
              onUpdateSpend={handleUpdateSpend}
              onMarkComplete={handleMarkComplete}
              onRemove={handleRemove}
              index={index}
            />
          ))}
        </View>
      )}
      
      {/* Completed Cards */}
      {completedCards.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completed 🎉</Text>
          {completedCards.map((tracked, index) => (
            <TrackedCardItem
              key={tracked.cardId}
              tracked={tracked}
              card={getCardByIdSync(tracked.cardId)}
              onUpdateSpend={handleUpdateSpend}
              onMarkComplete={handleMarkComplete}
              onRemove={handleRemove}
              index={index + activeCards.length}
            />
          ))}
        </View>
      )}
      
      {/* Empty State */}
      {trackedCards.length === 0 && !isLoading && (
        <Animated.View 
          entering={FadeInUp.delay(300).duration(500)}
          style={styles.emptyState}
        >
          <View style={styles.emptyIcon}>
            <CreditCard size={48} color={colors.text.tertiary} />
          </View>
          <Text style={styles.emptyTitle}>No Cards Tracked</Text>
          <Text style={styles.emptyText}>
            Start tracking your signup bonuses to never miss a deadline!
          </Text>
        </Animated.View>
      )}
      
      {/* Add Modal */}
      <AddCardModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddCard}
        availableCards={availableCards}
      />
      
      {/* Bottom padding */}
      <View style={{ height: 100 }} />
    </ScrollView>
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
  content: {
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  
  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statBoxMiddle: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border.light,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  
  // Add Card Button
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main + '15',
    borderRadius: borderRadius.lg,
    padding: 14,
    marginBottom: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primary.main + '30',
    borderStyle: 'dashed',
  },
  addCardText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary.main,
  },
  
  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  
  // Tracked Card
  trackedCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  trackedCardCompleted: {
    borderColor: colors.primary.main + '30',
    backgroundColor: colors.primary.main + '08',
  },
  trackedCardUrgent: {
    borderColor: colors.error.main + '50',
  },
  trackedHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  trackedInfo: {
    flex: 1,
  },
  trackedCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  trackedIssuer: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  removeButton: {
    padding: 4,
  },
  
  // Progress
  progressSection: {
    marginBottom: 12,
  },
  progressInfo: {},
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border.light,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  spendingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  spendingCurrent: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  spendingTarget: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  
  // Details
  detailsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  detailTextUrgent: {
    color: colors.error.main,
    fontWeight: '600',
  },
  
  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  updateSpendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.main + '15',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  updateSpendText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.accent.main,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main + '15',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  completeText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary.main,
  },
  
  // Urgent Banner
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error.main + '15',
    marginTop: 12,
    padding: 10,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  urgentText: {
    fontSize: 13,
    color: colors.error.main,
    fontWeight: '500',
  },
  
  // Progress Circle
  progressCircleBg: {
    position: 'absolute',
  },
  progressCircleFill: {
    position: 'absolute',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  modalInputPrefix: {
    fontSize: 20,
    color: colors.text.secondary,
    marginRight: 8,
  },
  modalInput: {
    flex: 1,
    height: 56,
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
  },
  modalCancelText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  modalSaveButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  modalSaveGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background.primary,
  },
  
  // Add Modal
  addModalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  addModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  addModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  addModalContent: {
    flex: 1,
    padding: 16,
  },
  addModalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: 8,
    marginTop: 16,
  },
  cardPicker: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  cardPickerItem: {
    width: 120,
    padding: 14,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    marginRight: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardPickerItemSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '08',
  },
  cardPickerName: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
  },
  cardPickerNameSelected: {
    color: colors.primary.main,
    fontWeight: '500',
  },
  addModalInputRow: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  addModalInput: {
    height: 48,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text.primary,
  },
  addModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: borderRadius.lg,
    gap: 8,
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.background.primary,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
