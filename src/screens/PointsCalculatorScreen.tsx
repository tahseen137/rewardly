/**
 * PointsCalculatorScreen - Shows point valuations and calculates point values
 * 
 * Key Features:
 * - Browse all rewards programs (CA & US)
 * - Search/filter programs
 * - Interactive points → dollars calculator
 * - Show best redemption options per program
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Calculator, ChevronRight, X, TrendingUp, DollarSign, Plane, Building, CreditCard } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors } from '../theme/colors';
import { GradientText } from '../components/GradientText';

// Import rewards programs data
import caRewardsPrograms from '../data/ca_rewards_programs.json';
import usRewardsPrograms from '../data/us_rewards_programs.json';

// ============================================================================
// Types
// ============================================================================

interface RedemptionOption {
  redemption_type?: string;
  type?: string;
  cents_per_point?: number;
  value?: number;
  minimum_redemption?: number | null;
  notes?: string | null;
}

interface TransferPartner {
  name: string;
  ratio: string;
  type: string;
}

interface RewardsProgram {
  id: string;
  name: string;
  category: string;
  pointValuation: number;
  country?: string;
  description?: string;
  redemptionOptions?: RedemptionOption[];
  transferPartners?: (string | TransferPartner)[];
  optimalRedemption?: string;
  optimalRateCents?: number;
}

// ============================================================================
// Helpers
// ============================================================================

function getCategoryIcon(category: string) {
  if (category.includes('Airline')) return Plane;
  if (category.includes('Hotel')) return Building;
  return CreditCard;
}

function getCategoryColor(category: string) {
  if (category.includes('Airline')) return colors.accent.purple;
  if (category.includes('Hotel')) return colors.secondary.blue;
  return colors.primary.main;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

// ============================================================================
// Components
// ============================================================================

interface ProgramCardProps {
  program: RewardsProgram;
  onPress: () => void;
  index: number;
}

function ProgramCard({ program, onPress, index }: ProgramCardProps) {
  const IconComponent = getCategoryIcon(program.category);
  const categoryColor = getCategoryColor(program.category);

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <TouchableOpacity
        style={styles.programCard}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.programCardLeft}>
          <View style={[styles.programIcon, { backgroundColor: categoryColor + '20' }]}>
            <IconComponent size={20} color={categoryColor} />
          </View>
          <View style={styles.programInfo}>
            <Text style={styles.programName} numberOfLines={1}>{program.name}</Text>
            <Text style={styles.programCategory}>{program.category}</Text>
          </View>
        </View>
        <View style={styles.programCardRight}>
          <View style={styles.valuationBadge}>
            <Text style={styles.valuationText}>{program.pointValuation.toFixed(2)}¢</Text>
          </View>
          <ChevronRight size={18} color={colors.text.tertiary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

interface CalculatorModalProps {
  visible: boolean;
  program: RewardsProgram | null;
  onClose: () => void;
}

function CalculatorModal({ visible, program, onClose }: CalculatorModalProps) {
  const [points, setPoints] = useState('');
  const [selectedRedemption, setSelectedRedemption] = useState<RedemptionOption | null>(null);

  // Reset state when program changes
  useEffect(() => {
    setPoints('');
    setSelectedRedemption(null);
  }, [program]);

  const calculatedValue = useMemo(() => {
    if (!program || !points) return 0;
    const pointsNum = parseInt(points.replace(/,/g, ''), 10);
    if (isNaN(pointsNum)) return 0;
    
    const centsPerPoint = selectedRedemption 
      ? (selectedRedemption.cents_per_point ?? selectedRedemption.value ?? program.pointValuation)
      : program.pointValuation;
    
    return pointsNum * (centsPerPoint / 100);
  }, [points, program, selectedRedemption]);

  if (!program) return null;

  const redemptionOptions = program.redemptionOptions || [];
  const transferPartners = program.transferPartners || [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderLeft}>
            <Text style={styles.modalTitle}>{program.name}</Text>
            <Text style={styles.modalSubtitle}>{program.category}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Base Valuation */}
          <View style={styles.valuationHeader}>
            <View style={styles.valuationCircle}>
              <Text style={styles.valuationLarge}>{program.pointValuation.toFixed(2)}</Text>
              <Text style={styles.valuationUnit}>¢/pt</Text>
            </View>
            <Text style={styles.valuationLabel}>Base Valuation</Text>
            {program.optimalRateCents && program.optimalRateCents > program.pointValuation && (
              <View style={styles.optimalBadge}>
                <TrendingUp size={14} color={colors.primary.main} />
                <Text style={styles.optimalText}>
                  Up to {program.optimalRateCents.toFixed(2)}¢ optimal
                </Text>
              </View>
            )}
          </View>

          {/* Calculator */}
          <View style={styles.calculatorSection}>
            <Text style={styles.sectionTitle}>Points Calculator</Text>
            <View style={styles.calculatorInputRow}>
              <View style={styles.calculatorInput}>
                <Calculator size={18} color={colors.text.tertiary} style={styles.calcIcon} />
                <TextInput
                  style={styles.pointsInput}
                  placeholder="Enter points"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="numeric"
                  value={points}
                  onChangeText={(text) => {
                    // Allow only numbers and format with commas
                    const cleaned = text.replace(/[^0-9]/g, '');
                    if (cleaned) {
                      setPoints(parseInt(cleaned, 10).toLocaleString());
                    } else {
                      setPoints('');
                    }
                  }}
                />
              </View>
              <View style={styles.equalsSign}>
                <Text style={styles.equalsText}>=</Text>
              </View>
              <View style={styles.resultBox}>
                <DollarSign size={18} color={colors.primary.main} />
                <Text style={styles.resultValue}>
                  {formatCurrency(calculatedValue)}
                </Text>
              </View>
            </View>
            {selectedRedemption && (
              <Text style={styles.redemptionNote}>
                Using: {selectedRedemption.redemption_type || selectedRedemption.type}
              </Text>
            )}
          </View>

          {/* Redemption Options */}
          {redemptionOptions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Redemption Options</Text>
              {redemptionOptions.map((option, idx) => {
                const optionValue = option.cents_per_point ?? option.value ?? 0;
                const optionType = option.redemption_type || option.type || 'Unknown';
                const isSelected = selectedRedemption === option;
                
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.redemptionOption, isSelected && styles.redemptionOptionSelected]}
                    onPress={() => setSelectedRedemption(isSelected ? null : option)}
                  >
                    <View style={styles.redemptionLeft}>
                      <Text style={[styles.redemptionType, isSelected && styles.redemptionTypeSelected]}>
                        {optionType}
                      </Text>
                      {option.notes && (
                        <Text style={styles.redemptionNotes} numberOfLines={2}>
                          {option.notes}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.redemptionValue, isSelected && styles.redemptionValueSelected]}>
                      <Text style={[styles.redemptionValueText, isSelected && styles.redemptionValueTextSelected]}>
                        {optionValue.toFixed(2)}¢
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Transfer Partners */}
          {transferPartners.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Transfer Partners</Text>
              <View style={styles.partnersGrid}>
                {transferPartners.slice(0, 10).map((partner, idx) => {
                  const partnerName = typeof partner === 'string' ? partner : partner.name;
                  const partnerType = typeof partner === 'string' ? 'airline' : partner.type;
                  const PartnerIcon = partnerType === 'hotel' ? Building : Plane;
                  
                  return (
                    <View key={idx} style={styles.partnerChip}>
                      <PartnerIcon size={12} color={colors.text.secondary} />
                      <Text style={styles.partnerName} numberOfLines={1}>
                        {partnerName}
                      </Text>
                    </View>
                  );
                })}
                {transferPartners.length > 10 && (
                  <View style={styles.partnerChip}>
                    <Text style={styles.partnerName}>
                      +{transferPartners.length - 10} more
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Optimal Strategy */}
          {program.optimalRedemption && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Best Strategy</Text>
              <View style={styles.strategyBox}>
                <TrendingUp size={18} color={colors.primary.main} />
                <Text style={styles.strategyText}>{program.optimalRedemption}</Text>
              </View>
            </View>
          )}

          {/* Description */}
          {program.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.descriptionText}>{program.description}</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ============================================================================
// Main Screen
// ============================================================================

export default function PointsCalculatorScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<'all' | 'CA' | 'US'>('all');
  const [selectedProgram, setSelectedProgram] = useState<RewardsProgram | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Combine CA and US programs
  const allPrograms = useMemo(() => {
    const caPrograms = (caRewardsPrograms.programs || []).map(p => ({
      ...p,
      country: 'CA',
    }));
    const usPrograms = (usRewardsPrograms.programs || []).map(p => ({
      ...p,
      country: p.country || 'US',
    }));
    return [...usPrograms, ...caPrograms] as RewardsProgram[];
  }, []);

  // Filter programs based on search and country
  const filteredPrograms = useMemo(() => {
    return allPrograms.filter(program => {
      const matchesSearch = searchQuery === '' || 
        program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        program.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCountry = selectedCountry === 'all' || program.country === selectedCountry;
      
      return matchesSearch && matchesCountry;
    }).sort((a, b) => b.pointValuation - a.pointValuation);
  }, [allPrograms, searchQuery, selectedCountry]);

  const handleProgramPress = useCallback((program: RewardsProgram) => {
    setSelectedProgram(program);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <GradientText style={styles.headerTitle} variant="primary">
            Points Valuator
          </GradientText>
          <Text style={styles.headerSubtitle}>
            Know what your points are worth
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={18} color={colors.text.tertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search programs..."
              placeholderTextColor={colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={18} color={colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Country Filter */}
        <View style={styles.filterRow}>
          {(['all', 'US', 'CA'] as const).map((country) => (
            <TouchableOpacity
              key={country}
              style={[
                styles.filterChip,
                selectedCountry === country && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCountry(country)}
            >
              <Text style={[
                styles.filterChipText,
                selectedCountry === country && styles.filterChipTextActive,
              ]}>
                {country === 'all' ? 'All' : country === 'US' ? '🇺🇸 US' : '🇨🇦 CA'}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.programCount}>
            <Text style={styles.programCountText}>
              {filteredPrograms.length} programs
            </Text>
          </View>
        </View>

        {/* Programs List */}
        <FlatList
          data={filteredPrograms}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ProgramCard
              program={item}
              onPress={() => handleProgramPress(item)}
              index={index}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Calculator size={48} color={colors.text.tertiary} />
              <Text style={styles.emptyText}>No programs found</Text>
            </View>
          }
        />

        {/* Calculator Modal */}
        <CalculatorModal
          visible={modalVisible}
          program={selectedProgram}
          onClose={handleCloseModal}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background.tertiary,
  },
  filterChipActive: {
    backgroundColor: colors.primary.main + '20',
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  filterChipText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.primary.main,
  },
  programCount: {
    marginLeft: 'auto',
  },
  programCountText: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  programCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  programCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  programIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  programCategory: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  programCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  valuationBadge: {
    backgroundColor: colors.primary.main + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  valuationText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary.main,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.tertiary,
    marginTop: 12,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalHeaderLeft: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  valuationHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  valuationCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary.main + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primary.main,
  },
  valuationLarge: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary.main,
  },
  valuationUnit: {
    fontSize: 12,
    color: colors.primary.main,
    marginTop: -4,
  },
  valuationLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
  },
  optimalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    gap: 6,
  },
  optimalText: {
    fontSize: 13,
    color: colors.primary.main,
    fontWeight: '600',
  },
  calculatorSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  calculatorInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calculatorInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
  },
  calcIcon: {
    marginRight: 8,
  },
  pointsInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  equalsSign: {
    width: 24,
    alignItems: 'center',
  },
  equalsText: {
    fontSize: 20,
    color: colors.text.tertiary,
  },
  resultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main + '20',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    minWidth: 100,
    gap: 4,
  },
  resultValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary.main,
  },
  redemptionNote: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  redemptionOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  redemptionOptionSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '10',
  },
  redemptionLeft: {
    flex: 1,
    marginRight: 12,
  },
  redemptionType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  redemptionTypeSelected: {
    color: colors.primary.main,
  },
  redemptionNotes: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  redemptionValue: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  redemptionValueSelected: {
    backgroundColor: colors.primary.main,
  },
  redemptionValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  redemptionValueTextSelected: {
    color: colors.background.primary,
  },
  partnersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  partnerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  partnerName: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  strategyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary.main + '15',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  strategyText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
