/**
 * StatementUploadScreen - F24: CSV Statement Upload
 * 
 * Features:
 * - File picker (DocumentPicker for mobile, input for web)
 * - Auto bank detection
 * - Parse progress indicator
 * - Transaction review table with category pills
 * - Re-categorization
 * - Confirmation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Upload, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../theme/colors';
import { TransactionReviewList } from '../components/TransactionReviewList';
import { parseStatement } from '../services/StatementParserService';
import { saveStatement } from '../services/StatementStorageService';
import { updateFromParsedTransactions } from '../services/SpendingProfileService';
import { CSVParseResult, SupportedBank, ParsedTransaction } from '../types';

type UploadState = 'idle' | 'parsing' | 'review' | 'saving' | 'success' | 'error';

export default function StatementUploadScreen() {
  const navigation = useNavigation();
  const [state, setState] = useState<UploadState>('idle');
  const [fileName, setFileName] = useState<string>('');
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // ============================================================================
  // File Upload Handler
  // ============================================================================

  const handleFileUpload = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web: use input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (file) {
            const text = await file.text();
            parseCSVContent(text, file.name);
          }
        };
        input.click();
      } else {
        // Mobile: use DocumentPicker
        const result = await DocumentPicker.getDocumentAsync({
          type: 'text/csv',
          copyToCacheDirectory: true,
        });

        if (result.type === 'success') {
          const response = await fetch(result.uri);
          const text = await response.text();
          parseCSVContent(text, result.name);
        }
      }
    } catch (error) {
      setState('error');
      setErrorMessage('Failed to read file');
    }
  };

  // ============================================================================
  // CSV Parsing
  // ============================================================================

  const parseCSVContent = async (content: string, name: string) => {
    setState('parsing');
    setFileName(name);

    try {
      const result = parseStatement(content);

      if (!result.success) {
        setState('error');
        switch (result.error.type) {
          case 'EMPTY_FILE':
            setErrorMessage('The file is empty');
            break;
          case 'UNSUPPORTED_BANK':
            setErrorMessage('Could not detect bank format. Please select your bank manually.');
            break;
          case 'PARSE_FAILED':
            setErrorMessage(`Failed to parse CSV: ${result.error.errors.length} errors`);
            break;
          case 'NO_TRANSACTIONS':
            setErrorMessage('No transactions found in the file');
            break;
          default:
            setErrorMessage('Failed to parse statement');
        }
        return;
      }

      setParseResult(result.value);
      setState('review');
    } catch (error) {
      setState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // ============================================================================
  // Category Update Handler
  // ============================================================================

  const handleCategoryUpdate = (transactionId: string, newCategory: SpendingCategory) => {
    if (!parseResult) return;

    const updatedTransactions = parseResult.transactions.map(tx =>
      tx.id === transactionId
        ? { ...tx, category: newCategory, userCorrected: true }
        : tx
    );

    setParseResult({
      ...parseResult,
      transactions: updatedTransactions,
    });
  };

  // ============================================================================
  // Confirmation & Save
  // ============================================================================

  const handleConfirm = async () => {
    if (!parseResult) return;

    setState('saving');

    try {
      const statement = {
        id: `stmt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: null,
        fileName,
        bank: parseResult.bank,
        uploadDate: new Date(),
        periodStart: parseResult.periodStart,
        periodEnd: parseResult.periodEnd,
        transactionCount: parseResult.transactions.length,
        totalSpend: parseResult.totalSpend,
        totalCredits: parseResult.totalCredits,
        transactions: parseResult.transactions,
      };

      const saveResult = await saveStatement(statement);

      if (!saveResult.success) {
        setState('error');
        setErrorMessage('Failed to save statement');
        return;
      }

      // CYCLE 4 INTEGRATION: Auto-update spending profile from parsed transactions
      await updateFromParsedTransactions(parseResult.transactions.map(t => ({
        amount: t.amount,
        category: t.category,
        transactionDate: t.date,
        isCredit: t.isCredit,
      })));

      setState('success');
      
      // Navigate back after 2 seconds
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error) {
      setState('error');
      setErrorMessage('Failed to save statement');
    }
  };

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const renderIdle = () => (
    <View style={styles.centerContainer}>
      <View style={styles.uploadBox}>
        <Upload size={48} color={colors.primary.main} />
        <Text style={styles.uploadTitle}>Upload Credit Card Statement</Text>
        <Text style={styles.uploadSubtitle}>
          Supported: TD, RBC, CIBC, Scotiabank, BMO, Tangerine, PC Financial, Amex
        </Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleFileUpload}
          activeOpacity={0.8}
        >
          <Text style={styles.uploadButtonText}>Choose CSV File</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderParsing = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={colors.primary.main} />
      <Text style={styles.statusText}>Parsing {fileName}...</Text>
    </View>
  );

  const renderReview = () => {
    if (!parseResult) return null;

    return (
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.reviewContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Statement Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Bank:</Text>
            <Text style={styles.summaryValue}>{parseResult.bank.toUpperCase()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Period:</Text>
            <Text style={styles.summaryValue}>
              {parseResult.periodStart.toLocaleDateString()} - {parseResult.periodEnd.toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Transactions:</Text>
            <Text style={styles.summaryValue}>{parseResult.transactions.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Spend:</Text>
            <Text style={styles.summaryValue}>${parseResult.totalSpend.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.reviewTitle}>Review Transactions</Text>
        <Text style={styles.reviewSubtitle}>
          Check categories and tap to change if needed
        </Text>

        <TransactionReviewList
          transactions={parseResult.transactions}
          onCategoryUpdate={handleCategoryUpdate}
        />

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
          activeOpacity={0.8}
        >
          <CheckCircle size={20} color="#fff" />
          <Text style={styles.confirmButtonText}>Confirm & Save</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderSaving = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={colors.primary.main} />
      <Text style={styles.statusText}>Saving statement...</Text>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.centerContainer}>
      <CheckCircle size={64} color={colors.success.main} />
      <Text style={styles.successTitle}>Statement Uploaded!</Text>
      <Text style={styles.successSubtitle}>
        {parseResult?.transactions.length} transactions saved
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.centerContainer}>
      <AlertCircle size={64} color={colors.error.main} />
      <Text style={styles.errorTitle}>Upload Failed</Text>
      <Text style={styles.errorMessage}>{errorMessage}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => setState('idle')}
        activeOpacity={0.8}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Statement</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      {state === 'idle' && renderIdle()}
      {state === 'parsing' && renderParsing()}
      {state === 'review' && renderReview()}
      {state === 'saving' && renderSaving()}
      {state === 'success' && renderSuccess()}
      {state === 'error' && renderError()}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  uploadBox: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border.light,
    borderStyle: 'dashed',
    backgroundColor: colors.background.secondary,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  uploadButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  statusText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  reviewContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  reviewSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success.main,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

// Re-export SpendingCategory
import { SpendingCategory } from '../types';
