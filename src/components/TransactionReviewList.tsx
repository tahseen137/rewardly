/**
 * TransactionReviewList - Scrollable transaction list with category editing
 * 
 * Features:
 * - Display all parsed transactions
 * - Color-coded category pills
 * - Tap to change category
 * - Confidence indicators
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  FlatList,
} from 'react-native';
import { Edit2 } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { ParsedTransaction, SpendingCategory } from '../types';

interface TransactionReviewListProps {
  transactions: ParsedTransaction[];
  onCategoryUpdate: (transactionId: string, newCategory: SpendingCategory) => void;
}

const CATEGORY_LABELS: Record<SpendingCategory, string> = {
  [SpendingCategory.GROCERIES]: 'Groceries',
  [SpendingCategory.DINING]: 'Dining',
  [SpendingCategory.GAS]: 'Gas',
  [SpendingCategory.TRAVEL]: 'Travel',
  [SpendingCategory.ONLINE_SHOPPING]: 'Online',
  [SpendingCategory.ENTERTAINMENT]: 'Entertainment',
  [SpendingCategory.DRUGSTORES]: 'Pharmacy',
  [SpendingCategory.HOME_IMPROVEMENT]: 'Home',
  [SpendingCategory.OTHER]: 'Other',
};

const CATEGORY_COLORS: Record<SpendingCategory, string> = {
  [SpendingCategory.GROCERIES]: '#10b981',
  [SpendingCategory.DINING]: '#f59e0b',
  [SpendingCategory.GAS]: '#ef4444',
  [SpendingCategory.TRAVEL]: '#3b82f6',
  [SpendingCategory.ONLINE_SHOPPING]: '#8b5cf6',
  [SpendingCategory.ENTERTAINMENT]: '#ec4899',
  [SpendingCategory.DRUGSTORES]: '#06b6d4',
  [SpendingCategory.HOME_IMPROVEMENT]: '#f97316',
  [SpendingCategory.OTHER]: '#6b7280',
};

export function TransactionReviewList({ transactions, onCategoryUpdate }: TransactionReviewListProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<ParsedTransaction | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleCategoryPress = (transaction: ParsedTransaction) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);
  };

  const handleCategorySelect = (category: SpendingCategory) => {
    if (selectedTransaction) {
      onCategoryUpdate(selectedTransaction.id, category);
    }
    setModalVisible(false);
    setSelectedTransaction(null);
  };

  const renderTransaction = ({ item }: { item: ParsedTransaction }) => {
    const categoryColor = CATEGORY_COLORS[item.category];
    const categoryLabel = CATEGORY_LABELS[item.category];
    const confidenceEmoji = 
      item.categoryConfidence === 'high' ? '✓' :
      item.categoryConfidence === 'medium' ? '~' : '?';

    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <Text style={styles.merchantName}>{item.normalizedMerchant}</Text>
          <Text style={[styles.amount, item.isCredit && styles.creditAmount]}>
            {item.isCredit ? '+' : ''}${item.amount.toFixed(2)}
          </Text>
        </View>
        
        <Text style={styles.description} numberOfLines={1}>
          {item.description}
        </Text>
        
        <View style={styles.transactionFooter}>
          <Text style={styles.date}>
            {item.date.toLocaleDateString()}
          </Text>
          
          <TouchableOpacity
            style={[styles.categoryPill, { backgroundColor: categoryColor + '20' }]}
            onPress={() => handleCategoryPress(item)}
            activeOpacity={0.7}
          >
            <Text style={[styles.categoryText, { color: categoryColor }]}>
              {confidenceEmoji} {categoryLabel}
            </Text>
            <Edit2 size={14} color={categoryColor} />
          </TouchableOpacity>
        </View>
        
        {item.userCorrected && (
          <View style={styles.correctedBadge}>
            <Text style={styles.correctedText}>User corrected</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Category Picker Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Category</Text>
            
            <ScrollView style={styles.categoryList}>
              {Object.values(SpendingCategory).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryOption,
                    selectedTransaction?.category === category && styles.categoryOptionSelected,
                  ]}
                  onPress={() => handleCategorySelect(category)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.categoryDot,
                      { backgroundColor: CATEGORY_COLORS[category] },
                    ]}
                  />
                  <Text style={styles.categoryOptionText}>
                    {CATEGORY_LABELS[category]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    gap: 12,
  },
  transactionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  creditAmount: {
    color: colors.success.main,
  },
  description: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginBottom: 12,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  correctedBadge: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  correctedText: {
    fontSize: 12,
    color: colors.primary.main,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 32,
    paddingHorizontal: 24,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border.light,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  categoryList: {
    flex: 1,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryOptionSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.bg20,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
});
