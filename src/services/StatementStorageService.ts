/**
 * StatementStorageService - Local + Cloud Storage for Statements
 * 
 * Features:
 * - AsyncStorage for local-only users
 * - Optional Supabase sync for authenticated users
 * - Handles statement uploads and parsed transactions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';
import { getCurrentUser } from './AuthService';
import {
  StatementUpload,
  StatementWithTransactions,
  ParsedTransaction,
  SupportedBank,
  TransactionFilter,
  Result,
  success,
  failure,
  StatementParseError,
} from '../types';

// ============================================================================
// Constants
// ============================================================================

const STATEMENTS_KEY = '@rewardly/statements';
const TRANSACTIONS_KEY = '@rewardly/transactions';

// ============================================================================
// In-Memory Cache
// ============================================================================

let statementsCache: StatementUpload[] = [];
let transactionsCache: ParsedTransaction[] = [];
let isInitialized = false;

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize storage service
 */
export async function initializeStatementStorage(): Promise<void> {
  if (isInitialized) return;

  try {
    // Try Supabase first for authenticated users
    if (isSupabaseConfigured()) {
      const user = await getCurrentUser();
      if (user && !user.isAnonymous) {
        await syncFromSupabase();
        isInitialized = true;
        return;
      }
    }

    // Fallback to local storage
    const statementsData = await AsyncStorage.getItem(STATEMENTS_KEY);
    if (statementsData) {
      statementsCache = JSON.parse(statementsData).map((s: any) => ({
        ...s,
        uploadDate: new Date(s.uploadDate),
        periodStart: new Date(s.periodStart),
        periodEnd: new Date(s.periodEnd),
      }));
    }

    const transactionsData = await AsyncStorage.getItem(TRANSACTIONS_KEY);
    if (transactionsData) {
      transactionsCache = JSON.parse(transactionsData).map((t: any) => ({
        ...t,
        date: new Date(t.date),
      }));
    }

    isInitialized = true;
  } catch (error) {
    console.error('[StatementStorageService] Init error:', error);
    isInitialized = true;
  }
}

// ============================================================================
// Statement Operations
// ============================================================================

/**
 * Save a parsed statement with transactions
 */
export async function saveStatement(
  statement: StatementWithTransactions
): Promise<Result<string, StatementParseError>> {
  if (!isInitialized) await initializeStatementStorage();

  try {
    // Get user ID if authenticated
    let userId: string | null = null;
    if (isSupabaseConfigured()) {
      const user = await getCurrentUser();
      userId = user?.id ?? null;
    }

    // Create statement record
    const statementRecord: StatementUpload = {
      id: statement.id,
      userId,
      fileName: statement.fileName,
      bank: statement.bank,
      uploadDate: statement.uploadDate,
      periodStart: statement.periodStart,
      periodEnd: statement.periodEnd,
      transactionCount: statement.transactionCount,
      totalSpend: statement.totalSpend,
      totalCredits: statement.totalCredits,
    };

    // Update cache
    statementsCache.push(statementRecord);
    transactionsCache.push(...statement.transactions);

    // Persist locally
    await persistToStorage();

    // Sync to Supabase if authenticated
    if (userId && isSupabaseConfigured()) {
      await syncToSupabase(statementRecord, statement.transactions);
    }

    return success(statement.id);
  } catch (error) {
    return failure({
      type: 'STORAGE_ERROR',
      message: error instanceof Error ? error.message : 'Storage failed',
    });
  }
}

/**
 * Get all statements
 */
export async function getStatements(): Promise<StatementUpload[]> {
  if (!isInitialized) await initializeStatementStorage();
  return [...statementsCache];
}

/**
 * Get statement by ID
 */
export async function getStatementById(
  statementId: string
): Promise<StatementWithTransactions | null> {
  if (!isInitialized) await initializeStatementStorage();

  const statement = statementsCache.find(s => s.id === statementId);
  if (!statement) return null;

  const transactions = transactionsCache.filter(
    t => t.id.startsWith(statementId)
  );

  return {
    ...statement,
    transactions,
  };
}

/**
 * Delete a statement and its transactions
 */
export async function deleteStatement(
  statementId: string
): Promise<void> {
  if (!isInitialized) await initializeStatementStorage();

  // Remove from cache
  statementsCache = statementsCache.filter(s => s.id !== statementId);
  transactionsCache = transactionsCache.filter(
    t => !t.id.startsWith(statementId)
  );

  // Persist locally
  await persistToStorage();

  // Sync to Supabase if authenticated
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser();
    if (user && supabase) {
      await supabase
        .from('statement_uploads')
        .delete()
        .eq('id', statementId);
    }
  }
}

// ============================================================================
// Transaction Operations
// ============================================================================

/**
 * Get all transactions with optional filtering
 */
export async function getTransactions(
  filter?: TransactionFilter
): Promise<ParsedTransaction[]> {
  if (!isInitialized) await initializeStatementStorage();

  let filtered = [...transactionsCache];

  if (filter) {
    // Date range filter
    if (filter.dateRange) {
      filtered = filtered.filter(
        t =>
          t.date >= filter.dateRange!.start &&
          t.date <= filter.dateRange!.end
      );
    }

    // Category filter
    if (filter.categories && filter.categories.length > 0) {
      filtered = filtered.filter(t =>
        filter.categories!.includes(t.category)
      );
    }

    // Bank filter
    if (filter.banks && filter.banks.length > 0) {
      filtered = filtered.filter(t =>
        filter.banks!.includes(t.sourceBank)
      );
    }

    // Amount range filter
    if (filter.minAmount !== undefined) {
      filtered = filtered.filter(t => t.amount >= filter.minAmount!);
    }
    if (filter.maxAmount !== undefined) {
      filtered = filtered.filter(t => t.amount <= filter.maxAmount!);
    }

    // Search term filter
    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.description.toLowerCase().includes(term) ||
          t.normalizedMerchant.toLowerCase().includes(term)
      );
    }

    // Exclude credits filter
    if (filter.excludeCredits) {
      filtered = filtered.filter(t => !t.isCredit);
    }
  }

  return filtered;
}

/**
 * Update a transaction category (when user corrects categorization)
 */
export async function updateTransactionCategory(
  transactionId: string,
  newCategory: SpendingCategory
): Promise<void> {
  if (!isInitialized) await initializeStatementStorage();

  const tx = transactionsCache.find(t => t.id === transactionId);
  if (!tx) return;

  tx.category = newCategory;
  tx.userCorrected = true;

  await persistToStorage();

  // Sync to Supabase if authenticated
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser();
    if (user && supabase) {
      const updateData: any = {
        category: newCategory,
        user_corrected: true,
      };
      const query = supabase.from('parsed_transactions');
      // @ts-expect-error - Supabase types not configured
      await query.update(updateData).eq('id', transactionId);
    }
  }
}

/**
 * Get total spend for a date range
 */
export async function getTotalSpend(
  startDate: Date,
  endDate: Date
): Promise<number> {
  const transactions = await getTransactions({
    dateRange: { start: startDate, end: endDate },
    excludeCredits: true,
  });

  return transactions.reduce((sum, t) => sum + t.amount, 0);
}

// ============================================================================
// Storage Functions
// ============================================================================

async function persistToStorage(): Promise<void> {
  const statementsJson = JSON.stringify(
    statementsCache.map(s => ({
      ...s,
      uploadDate: s.uploadDate.toISOString(),
      periodStart: s.periodStart.toISOString(),
      periodEnd: s.periodEnd.toISOString(),
    }))
  );

  const transactionsJson = JSON.stringify(
    transactionsCache.map(t => ({
      ...t,
      date: t.date.toISOString(),
    }))
  );

  await AsyncStorage.setItem(STATEMENTS_KEY, statementsJson);
  await AsyncStorage.setItem(TRANSACTIONS_KEY, transactionsJson);
}

async function syncFromSupabase(): Promise<void> {
  if (!supabase) return;

  const user = await getCurrentUser();
  if (!user) return;

  // Fetch statements
  const { data: statements, error: stmtError } = await supabase
    .from('statement_uploads')
    .select('*')
    .eq('user_id', user.id);

  if (stmtError || !statements) return;

  statementsCache = statements.map((s: any) => ({
    id: s.id,
    userId: s.user_id,
    fileName: s.file_name,
    bank: s.bank,
    uploadDate: new Date(s.created_at),
    periodStart: new Date(s.period_start),
    periodEnd: new Date(s.period_end),
    transactionCount: s.transaction_count,
    totalSpend: parseFloat(s.total_spend),
    totalCredits: parseFloat(s.total_credits),
  }));

  // Fetch transactions
  const { data: transactions, error: txError } = await supabase
    .from('parsed_transactions')
    .select('*')
    .eq('user_id', user.id);

  if (txError || !transactions) return;

  transactionsCache = transactions.map((t: any) => ({
    id: t.id,
    date: new Date(t.transaction_date),
    description: t.description,
    normalizedMerchant: t.normalized_merchant,
    amount: parseFloat(t.amount),
    isCredit: t.is_credit,
    category: t.category,
    categoryConfidence: t.category_confidence,
    userCorrected: t.user_corrected,
    sourceBank: t.source_bank,
    cardLast4: t.card_last4,
  }));

  await persistToStorage();
}

async function syncToSupabase(
  statement: StatementUpload,
  transactions: ParsedTransaction[]
): Promise<void> {
  if (!supabase) return;

  const user = await getCurrentUser();
  if (!user) return;

  // Save statement
  await supabase.from('statement_uploads').upsert({
    id: statement.id,
    user_id: user.id,
    file_name: statement.fileName,
    bank: statement.bank,
    period_start: statement.periodStart.toISOString(),
    period_end: statement.periodEnd.toISOString(),
    transaction_count: statement.transactionCount,
    total_spend: statement.totalSpend,
    total_credits: statement.totalCredits,
  } as any);

  // Save transactions
  const txRows = transactions.map(t => ({
    id: t.id,
    user_id: user.id,
    statement_id: statement.id,
    transaction_date: t.date.toISOString(),
    description: t.description,
    normalized_merchant: t.normalizedMerchant,
    amount: t.amount,
    is_credit: t.isCredit,
    category: t.category,
    category_confidence: t.categoryConfidence,
    user_corrected: t.userCorrected,
    source_bank: t.sourceBank,
    card_last4: t.cardLast4,
  }));

  // Insert in batches of 100
  for (let i = 0; i < txRows.length; i += 100) {
    const batch = txRows.slice(i, i + 100);
    await supabase.from('parsed_transactions').upsert(batch as any);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clear all local statement data (for testing)
 */
export async function clearAllStatements(): Promise<void> {
  statementsCache = [];
  transactionsCache = [];
  await AsyncStorage.removeItem(STATEMENTS_KEY);
  await AsyncStorage.removeItem(TRANSACTIONS_KEY);
}

/**
 * Reset cache (for testing)
 */
export function resetStatementStorageCache(): void {
  statementsCache = [];
  transactionsCache = [];
  isInitialized = false;
}

// Re-export SpendingCategory type
import { SpendingCategory } from '../types';
