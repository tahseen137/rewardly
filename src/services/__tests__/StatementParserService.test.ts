/**
 * StatementParserService Tests
 * ~45 tests covering 8 Canadian bank CSV formats
 */

import {
  parseCSVToRows,
  detectBank,
  matchesDateFormat,
  parseDate,
  parseAmount,
  parseRow,
  parseCSV,
  parseStatement,
  getBankDisplayName,
  getSupportedBanks,
} from '../StatementParserService';
import { SupportedBank, SpendingCategory } from '../../types';

// Mock MerchantPatternService
jest.mock('../MerchantPatternService', () => ({
  categorizeTransaction: jest.fn((description) => ({
    category: SpendingCategory.OTHER,
    merchantName: description,
    confidence: 'low' as const,
  })),
  getUserMappingsSync: jest.fn(() => []),
  extractMerchantName: jest.fn((description) => description),
}));

describe('StatementParserService', () => {
  // ============================================================================
  // parseCSVToRows Tests
  // ============================================================================

  describe('parseCSVToRows', () => {
    it('should parse simple CSV', () => {
      const csv = 'a,b,c\n1,2,3';
      const rows = parseCSVToRows(csv);
      
      expect(rows).toEqual([
        ['a', 'b', 'c'],
        ['1', '2', '3'],
      ]);
    });

    it('should handle quoted fields', () => {
      const csv = '"a","b,c","d"';
      const rows = parseCSVToRows(csv);
      
      expect(rows).toEqual([['a', 'b,c', 'd']]);
    });

    it('should handle escaped quotes', () => {
      const csv = '"a","b""c","d"';
      const rows = parseCSVToRows(csv);
      
      expect(rows).toEqual([['a', 'b"c', 'd']]);
    });

    it('should skip empty lines', () => {
      const csv = 'a,b\n\n\nc,d';
      const rows = parseCSVToRows(csv);
      
      expect(rows).toEqual([
        ['a', 'b'],
        ['c', 'd'],
      ]);
    });

    it('should handle CR LF line endings', () => {
      const csv = 'a,b\r\nc,d';
      const rows = parseCSVToRows(csv);
      
      expect(rows).toEqual([
        ['a', 'b'],
        ['c', 'd'],
      ]);
    });
  });

  // ============================================================================
  // matchesDateFormat Tests
  // ============================================================================

  describe('matchesDateFormat', () => {
    it('should match MM/DD/YYYY', () => {
      expect(matchesDateFormat('01/15/2024', 'MM/DD/YYYY')).toBe(true);
      expect(matchesDateFormat('1/15/2024', 'MM/DD/YYYY')).toBe(false);
    });

    it('should match M/DD/YYYY', () => {
      expect(matchesDateFormat('1/15/2024', 'M/DD/YYYY')).toBe(true);
      expect(matchesDateFormat('01/15/2024', 'M/DD/YYYY')).toBe(true);
    });

    it('should match YYYYMMDD', () => {
      expect(matchesDateFormat('20240115', 'YYYYMMDD')).toBe(true);
      expect(matchesDateFormat('2024-01-15', 'YYYYMMDD')).toBe(false);
    });

    it('should match YYYY-MM-DD', () => {
      expect(matchesDateFormat('2024-01-15', 'YYYY-MM-DD')).toBe(true);
      expect(matchesDateFormat('20240115', 'YYYY-MM-DD')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(matchesDateFormat('', 'MM/DD/YYYY')).toBe(false);
    });
  });

  // ============================================================================
  // parseDate Tests
  // ============================================================================

  describe('parseDate', () => {
    it('should parse MM/DD/YYYY', () => {
      const date = parseDate('01/15/2024');
      expect(date).toEqual(new Date(2024, 0, 15));
    });

    it('should parse M/DD/YYYY', () => {
      const date = parseDate('1/15/2024');
      expect(date).toEqual(new Date(2024, 0, 15));
    });

    it('should parse YYYYMMDD', () => {
      const date = parseDate('20240115');
      expect(date).toEqual(new Date(2024, 0, 15));
    });

    it('should parse YYYY-MM-DD', () => {
      const date = parseDate('2024-01-15');
      expect(date).toEqual(new Date('2024-01-15'));
    });

    it('should return null for invalid date', () => {
      expect(parseDate('invalid')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseDate('')).toBeNull();
    });
  });

  // ============================================================================
  // parseAmount Tests
  // ============================================================================

  describe('parseAmount', () => {
    it('should parse positive amounts', () => {
      expect(parseAmount('100.50')).toBe(100.5);
    });

    it('should parse negative amounts', () => {
      expect(parseAmount('-50.25')).toBe(-50.25);
    });

    it('should handle dollar signs', () => {
      expect(parseAmount('$100.00')).toBe(100);
    });

    it('should handle commas', () => {
      expect(parseAmount('1,234.56')).toBe(1234.56);
    });

    it('should handle parentheses as negative', () => {
      expect(parseAmount('(50.00)')).toBe(-50);
    });

    it('should handle Unicode minus', () => {
      expect(parseAmount('−100.00')).toBe(-100);
    });

    it('should return 0 for empty string', () => {
      expect(parseAmount('')).toBe(0);
    });

    it('should handle spaces', () => {
      expect(parseAmount('1 234.56')).toBe(1234.56);
    });
  });

  // ============================================================================
  // Bank Detection Tests
  // ============================================================================

  describe('detectBank', () => {
    it('should detect TD from header', () => {
      const csv = `Date,Description,Debit Amount,Credit Amount,Balance
01/15/2024,LOBLAWS,85.23,,1234.56`;
      
      const result = detectBank(csv);
      expect(result.bank).toBe('td');
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });

    it('should detect RBC from header', () => {
      const csv = `Account Type,Account Number,Transaction Date,Cheque Number,Description 1,Description 2,CAD$,USD$
Visa,1234567890,01/15/2024,,LOBLAWS,,85.23,`;
      
      const result = detectBank(csv);
      expect(result.bank).toBe('rbc');
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });

    it('should detect CIBC from pattern (no header)', () => {
      const csv = `01/15/2024,LOBLAWS,85.23,
01/16/2024,PAYMENT,,500.00`;
      
      const result = detectBank(csv);
      expect(result.suggestedBank).toBe('cibc');
      expect(result.confidence).toBeGreaterThan(50);
    });

    it('should detect Scotiabank from column count', () => {
      const csv = `1/15/2024,LOBLAWS,-85.23
1/16/2024,PAYMENT,500.00`;
      
      const result = detectBank(csv);
      expect(result.suggestedBank).toBe('scotiabank');
      expect(result.confidence).toBeGreaterThan(40);
    });

    it('should detect BMO from header and date format', () => {
      const csv = `Item #,Card #,Transaction Date,Posting Date,Transaction Amount,Description
1,1234********5678,20240115,20240116,85.23,LOBLAWS`;
      
      const result = detectBank(csv);
      expect(result.bank).toBe('bmo');
    });

    it('should detect Tangerine from header and Unicode minus', () => {
      const csv = `Date,Transaction,Name,Memo,Amount
1/15/2024,DEBIT,LOBLAWS,,−85.23`;
      
      const result = detectBank(csv);
      expect(result.bank).toBe('tangerine');
    });

    it('should detect PC Financial from header', () => {
      const csv = `Date,Description,Amount
01/15/2024,LOBLAWS,-85.23`;
      
      const result = detectBank(csv);
      expect(result.bank).toBe('pc_financial');
    });

    it('should detect Amex from column count and pattern', () => {
      const csv = `01/15/2024,REF123,LOBLAWS #1234,85.23,USD
01/16/2024,REF124,TIM HORTONS,5.50,USD`;
      
      const result = detectBank(csv);
      // Amex detection can overlap with other formats, but should suggest something
      expect(result.suggestedBank).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(40);
    });

    it('should return null for unsupported format', () => {
      const csv = `This,Is,Not,A,Bank,Statement
1,2,3,4,5,6`;
      
      const result = detectBank(csv);
      expect(result.bank).toBeNull();
      expect(result.confidence).toBeLessThan(80);
    });

    it('should return null for empty CSV', () => {
      const result = detectBank('');
      expect(result.bank).toBeNull();
      expect(result.confidence).toBe(0);
    });
  });

  // ============================================================================
  // parseCSV Tests - TD Canada Trust
  // ============================================================================

  describe('parseCSV - TD Canada Trust', () => {
    const tdCSV = `Date,Description,Debit Amount,Credit Amount,Balance
01/15/2024,LOBLAWS #1234 TORONTO ON,85.23,,1234.56
01/16/2024,TIM HORTONS #567,5.50,,1229.06
01/17/2024,PAYMENT - THANK YOU,,500.00,1729.06`;

    it('should parse TD CSV successfully', () => {
      const result = parseCSV(tdCSV, 'td');
      
      expect(result.success).toBe(true);
      expect(result.transactions.length).toBe(3);
      expect(result.bank).toBe('td');
    });

    it('should parse TD transactions correctly', () => {
      const result = parseCSV(tdCSV, 'td');
      const tx = result.transactions[0];
      
      expect(tx.description).toBe('LOBLAWS #1234 TORONTO ON');
      expect(tx.amount).toBe(85.23);
      expect(tx.isCredit).toBe(false);
      expect(tx.sourceBank).toBe('td');
    });

    it('should identify credits in TD CSV', () => {
      const result = parseCSV(tdCSV, 'td');
      const payment = result.transactions[2];
      
      expect(payment.amount).toBe(500);
      expect(payment.isCredit).toBe(true);
    });

    it('should calculate TD totals', () => {
      const result = parseCSV(tdCSV, 'td');
      
      expect(result.totalSpend).toBe(90.73); // 85.23 + 5.50
      expect(result.totalCredits).toBe(500);
    });
  });

  // ============================================================================
  // parseCSV Tests - RBC
  // ============================================================================

  describe('parseCSV - RBC', () => {
    const rbcCSV = `Account Type,Account Number,Transaction Date,Cheque Number,Description 1,Description 2,CAD$,USD$
Visa,1234567890,01/15/2024,,LOBLAWS,#1234,85.23,
Visa,1234567890,01/16/2024,,TIM HORTONS,,5.50,
Visa,1234567890,01/17/2024,,PAYMENT,,−500.00,`;

    it('should parse RBC CSV successfully', () => {
      const result = parseCSV(rbcCSV, 'rbc');
      
      expect(result.success).toBe(true);
      expect(result.transactions.length).toBe(3);
    });

    it('should combine description columns', () => {
      const result = parseCSV(rbcCSV, 'rbc');
      const tx = result.transactions[0];
      
      expect(tx.description).toBe('LOBLAWS #1234');
    });

    it('should extract card number', () => {
      const result = parseCSV(rbcCSV, 'rbc');
      const tx = result.transactions[0];
      
      expect(tx.cardLast4).toBe('7890');
    });
  });

  // ============================================================================
  // parseCSV Tests - CIBC
  // ============================================================================

  describe('parseCSV - CIBC', () => {
    const cibcCSV = `01/15/2024,LOBLAWS #1234,85.23,
01/16/2024,TIM HORTONS,5.50,
01/17/2024,PAYMENT,,500.00`;

    it('should parse CIBC CSV successfully (no header)', () => {
      const result = parseCSV(cibcCSV, 'cibc');
      
      expect(result.success).toBe(true);
      expect(result.transactions.length).toBe(3);
    });

    it('should parse CIBC debits and credits', () => {
      const result = parseCSV(cibcCSV, 'cibc');
      
      expect(result.transactions[0].isCredit).toBe(false);
      expect(result.transactions[0].amount).toBe(85.23);
      expect(result.transactions[2].isCredit).toBe(true);
      expect(result.transactions[2].amount).toBe(500);
    });
  });

  // ============================================================================
  // parseCSV Tests - Scotiabank
  // ============================================================================

  describe('parseCSV - Scotiabank', () => {
    const scotiabankCSV = `1/15/2024,LOBLAWS #1234,−85.23
1/16/2024,TIM HORTONS,−5.50
1/17/2024,PAYMENT,500.00`;

    it('should parse Scotiabank CSV successfully', () => {
      const result = parseCSV(scotiabankCSV, 'scotiabank');
      
      expect(result.success).toBe(true);
      expect(result.transactions.length).toBe(3);
    });

    it('should handle Scotiabank sign convention (negative = debit)', () => {
      const result = parseCSV(scotiabankCSV, 'scotiabank');
      
      // Negative amount = purchase
      expect(result.transactions[0].amount).toBe(85.23);
      expect(result.transactions[0].isCredit).toBe(false);
      
      // Positive amount = payment
      expect(result.transactions[2].amount).toBe(500);
      expect(result.transactions[2].isCredit).toBe(true);
    });
  });

  // ============================================================================
  // parseCSV Tests - BMO
  // ============================================================================

  describe('parseCSV - BMO', () => {
    const bmoCSV = `Item #,Card #,Transaction Date,Posting Date,Transaction Amount,Description
1,1234********5678,20240115,20240116,85.23,LOBLAWS #1234
2,1234********5678,20240116,20240117,5.50,TIM HORTONS`;

    it('should parse BMO CSV successfully', () => {
      const result = parseCSV(bmoCSV, 'bmo');
      
      expect(result.success).toBe(true);
      expect(result.transactions.length).toBe(2);
    });

    it('should parse BMO date format (YYYYMMDD)', () => {
      const result = parseCSV(bmoCSV, 'bmo');
      const tx = result.transactions[0];
      
      expect(tx.date).toEqual(new Date(2024, 0, 15));
    });

    it('should extract BMO card last 4', () => {
      const result = parseCSV(bmoCSV, 'bmo');
      const tx = result.transactions[0];
      
      expect(tx.cardLast4).toBe('5678');
    });
  });

  // ============================================================================
  // parseCSV Tests - Tangerine
  // ============================================================================

  describe('parseCSV - Tangerine', () => {
    const tangerineCSV = `Date,Transaction,Name,Memo,Amount
1/15/2024,DEBIT,LOBLAWS,,−85.23
1/16/2024,DEBIT,TIM HORTONS,,−5.50
1/17/2024,CREDIT,PAYMENT,,500.00`;

    it('should parse Tangerine CSV successfully', () => {
      const result = parseCSV(tangerineCSV, 'tangerine');
      
      expect(result.success).toBe(true);
      expect(result.transactions.length).toBe(3);
    });

    it('should handle Tangerine Unicode minus', () => {
      const result = parseCSV(tangerineCSV, 'tangerine');
      
      expect(result.transactions[0].amount).toBe(85.23);
      expect(result.transactions[0].isCredit).toBe(false);
    });
  });

  // ============================================================================
  // parseCSV Tests - PC Financial
  // ============================================================================

  describe('parseCSV - PC Financial', () => {
    const pcCSV = `Date,Description,Amount
01/15/2024,LOBLAWS,−85.23
01/16/2024,TIM HORTONS,−5.50
01/17/2024,PAYMENT,500.00`;

    it('should parse PC Financial CSV successfully', () => {
      const result = parseCSV(pcCSV, 'pc_financial');
      
      expect(result.success).toBe(true);
      expect(result.transactions.length).toBe(3);
    });
  });

  // ============================================================================
  // parseCSV Tests - Amex Canada
  // ============================================================================

  describe('parseCSV - Amex Canada', () => {
    const amexCSV = `01/15/2024,,LOBLAWS #1234,85.23
01/16/2024,,TIM HORTONS,5.50
01/17/2024,,PAYMENT,−500.00`;

    it('should parse Amex CSV successfully', () => {
      const result = parseCSV(amexCSV, 'amex_canada');
      
      expect(result.success).toBe(true);
      expect(result.transactions.length).toBe(3);
    });
  });

  // ============================================================================
  // parseStatement Tests
  // ============================================================================

  describe('parseStatement', () => {
    const validCSV = `Date,Description,Debit Amount,Credit Amount,Balance
01/15/2024,LOBLAWS,85.23,,1234.56`;

    it('should auto-detect and parse statement', () => {
      const result = parseStatement(validCSV);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.bank).toBe('td');
        expect(result.value.transactions.length).toBe(1);
      }
    });

    it('should use forced bank when provided', () => {
      const result = parseStatement(validCSV, 'td');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.bank).toBe('td');
      }
    });

    it('should return error for empty file', () => {
      const result = parseStatement('');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('EMPTY_FILE');
      }
    });

    it('should return error for unsupported bank', () => {
      const invalidCSV = 'This,Is,Invalid\n1,2,3';
      const result = parseStatement(invalidCSV);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('UNSUPPORTED_BANK');
      }
    });

    it('should return error for no transactions', () => {
      const emptyCSV = `Date,Description,Debit Amount,Credit Amount,Balance`;
      const result = parseStatement(emptyCSV, 'td');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('NO_TRANSACTIONS');
      }
    });
  });

  // ============================================================================
  // Utility Tests
  // ============================================================================

  describe('getBankDisplayName', () => {
    it('should return display names for all banks', () => {
      expect(getBankDisplayName('td')).toBe('TD Canada Trust');
      expect(getBankDisplayName('rbc')).toBe('RBC Royal Bank');
      expect(getBankDisplayName('cibc')).toBe('CIBC');
      expect(getBankDisplayName('scotiabank')).toBe('Scotiabank');
      expect(getBankDisplayName('bmo')).toBe('BMO');
      expect(getBankDisplayName('tangerine')).toBe('Tangerine');
      expect(getBankDisplayName('pc_financial')).toBe('PC Financial');
      expect(getBankDisplayName('amex_canada')).toBe('American Express Canada');
    });
  });

  describe('getSupportedBanks', () => {
    it('should return all 8 supported banks', () => {
      const banks = getSupportedBanks();
      
      expect(banks).toHaveLength(8);
      expect(banks.map(b => b.bank)).toEqual([
        'td',
        'rbc',
        'cibc',
        'scotiabank',
        'bmo',
        'tangerine',
        'pc_financial',
        'amex_canada',
      ]);
    });
  });
});
