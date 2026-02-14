/**
 * StatementStorageService Tests
 * ~15 tests covering storage, retrieval, and filtering
 */

import {
  initializeStatementStorage,
  saveStatement,
  getStatements,
  getStatementById,
  deleteStatement,
  getTransactions,
  updateTransactionCategory,
  getTotalSpend,
  clearAllStatements,
  resetStatementStorageCache,
} from '../StatementStorageService';
import {
  StatementWithTransactions,
  ParsedTransaction,
  SupportedBank,
  SpendingCategory,
} from '../../types';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('../supabase', () => ({
  isSupabaseConfigured: jest.fn(() => false),
  supabase: null,
}));

jest.mock('../AuthService', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve(null)),
}));

describe('StatementStorageService', () => {
  beforeEach(async () => {
    resetStatementStorageCache();
    await clearAllStatements();
  });

  const createMockStatement = (): StatementWithTransactions => ({
    id: 'stmt_123',
    userId: null,
    fileName: 'statement.csv',
    bank: 'td' as SupportedBank,
    uploadDate: new Date('2024-01-20'),
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-01-31'),
    transactionCount: 2,
    totalSpend: 90.73,
    totalCredits: 500,
    transactions: [
      {
        id: 'stmt_123_tx1',
        date: new Date('2024-01-15'),
        description: 'LOBLAWS #1234',
        normalizedMerchant: 'Loblaws',
        amount: 85.23,
        isCredit: false,
        category: SpendingCategory.GROCERIES,
        categoryConfidence: 'high',
        userCorrected: false,
        sourceBank: 'td' as SupportedBank,
      },
      {
        id: 'stmt_123_tx2',
        date: new Date('2024-01-16'),
        description: 'TIM HORTONS',
        normalizedMerchant: 'Tim Hortons',
        amount: 5.50,
        isCredit: false,
        category: SpendingCategory.DINING,
        categoryConfidence: 'high',
        userCorrected: false,
        sourceBank: 'td' as SupportedBank,
      },
    ],
  });

  // ============================================================================
  // Initialization Tests
  // ============================================================================

  describe('initializeStatementStorage', () => {
    it('should initialize without errors', async () => {
      await expect(initializeStatementStorage()).resolves.not.toThrow();
    });

    it('should only initialize once', async () => {
      await initializeStatementStorage();
      await initializeStatementStorage();
      // Should not throw
    });
  });

  // ============================================================================
  // Save Statement Tests
  // ============================================================================

  describe('saveStatement', () => {
    it('should save a statement successfully', async () => {
      const statement = createMockStatement();
      const result = await saveStatement(statement);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe('stmt_123');
      }
    });

    it('should save statement to cache', async () => {
      const statement = createMockStatement();
      await saveStatement(statement);
      
      const statements = await getStatements();
      expect(statements).toHaveLength(1);
      expect(statements[0].id).toBe('stmt_123');
    });

    it('should save transactions to cache', async () => {
      const statement = createMockStatement();
      await saveStatement(statement);
      
      const transactions = await getTransactions();
      expect(transactions).toHaveLength(2);
    });
  });

  // ============================================================================
  // Get Statements Tests
  // ============================================================================

  describe('getStatements', () => {
    it('should return empty array when no statements', async () => {
      const statements = await getStatements();
      expect(statements).toEqual([]);
    });

    it('should return all saved statements', async () => {
      const statement1 = createMockStatement();
      const statement2 = { ...createMockStatement(), id: 'stmt_456' };
      
      await saveStatement(statement1);
      await saveStatement(statement2);
      
      const statements = await getStatements();
      expect(statements).toHaveLength(2);
    });
  });

  describe('getStatementById', () => {
    it('should return null for non-existent statement', async () => {
      const statement = await getStatementById('nonexistent');
      expect(statement).toBeNull();
    });

    it('should return statement with transactions', async () => {
      const mockStatement = createMockStatement();
      await saveStatement(mockStatement);
      
      const statement = await getStatementById('stmt_123');
      expect(statement).not.toBeNull();
      expect(statement?.transactions).toHaveLength(2);
    });
  });

  // ============================================================================
  // Delete Statement Tests
  // ============================================================================

  describe('deleteStatement', () => {
    it('should delete statement and transactions', async () => {
      const statement = createMockStatement();
      await saveStatement(statement);
      
      await deleteStatement('stmt_123');
      
      const statements = await getStatements();
      expect(statements).toHaveLength(0);
      
      const transactions = await getTransactions();
      expect(transactions).toHaveLength(0);
    });

    it('should not throw when deleting non-existent statement', async () => {
      await expect(deleteStatement('nonexistent')).resolves.not.toThrow();
    });
  });

  // ============================================================================
  // Get Transactions Tests
  // ============================================================================

  describe('getTransactions', () => {
    beforeEach(async () => {
      const statement = createMockStatement();
      await saveStatement(statement);
    });

    it('should return all transactions without filter', async () => {
      const transactions = await getTransactions();
      expect(transactions).toHaveLength(2);
    });

    it('should filter by date range', async () => {
      const transactions = await getTransactions({
        dateRange: {
          start: new Date('2024-01-15'),
          end: new Date('2024-01-15'),
        },
      });
      
      expect(transactions).toHaveLength(1);
      expect(transactions[0].description).toBe('LOBLAWS #1234');
    });

    it('should filter by category', async () => {
      const transactions = await getTransactions({
        categories: [SpendingCategory.GROCERIES],
      });
      
      expect(transactions).toHaveLength(1);
      expect(transactions[0].category).toBe(SpendingCategory.GROCERIES);
    });

    it('should filter by search term', async () => {
      const transactions = await getTransactions({
        searchTerm: 'tim',
      });
      
      expect(transactions).toHaveLength(1);
      expect(transactions[0].normalizedMerchant).toBe('Tim Hortons');
    });

    it('should filter by amount range', async () => {
      const transactions = await getTransactions({
        minAmount: 10,
        maxAmount: 100,
      });
      
      expect(transactions).toHaveLength(1);
      expect(transactions[0].amount).toBe(85.23);
    });

    it('should exclude credits', async () => {
      const transactions = await getTransactions({
        excludeCredits: true,
      });
      
      // All test transactions are debits
      expect(transactions).toHaveLength(2);
    });
  });

  // ============================================================================
  // Update Transaction Tests
  // ============================================================================

  describe('updateTransactionCategory', () => {
    beforeEach(async () => {
      const statement = createMockStatement();
      await saveStatement(statement);
    });

    it('should update transaction category', async () => {
      await updateTransactionCategory('stmt_123_tx1', SpendingCategory.DINING);
      
      const transactions = await getTransactions();
      const updated = transactions.find(t => t.id === 'stmt_123_tx1');
      
      expect(updated?.category).toBe(SpendingCategory.DINING);
      expect(updated?.userCorrected).toBe(true);
    });

    it('should not throw for non-existent transaction', async () => {
      await expect(
        updateTransactionCategory('nonexistent', SpendingCategory.GROCERIES)
      ).resolves.not.toThrow();
    });
  });

  // ============================================================================
  // Total Spend Tests
  // ============================================================================

  describe('getTotalSpend', () => {
    beforeEach(async () => {
      const statement = createMockStatement();
      await saveStatement(statement);
    });

    it('should calculate total spend for date range', async () => {
      const total = await getTotalSpend(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
      
      expect(total).toBe(90.73); // 85.23 + 5.50
    });

    it('should return 0 for date range with no transactions', async () => {
      const total = await getTotalSpend(
        new Date('2024-02-01'),
        new Date('2024-02-28')
      );
      
      expect(total).toBe(0);
    });
  });

  // ============================================================================
  // Clear All Tests
  // ============================================================================

  describe('clearAllStatements', () => {
    it('should clear all statements and transactions', async () => {
      const statement = createMockStatement();
      await saveStatement(statement);
      
      await clearAllStatements();
      
      const statements = await getStatements();
      const transactions = await getTransactions();
      
      expect(statements).toHaveLength(0);
      expect(transactions).toHaveLength(0);
    });
  });
});
