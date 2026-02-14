/**
 * StatementParserService - CSV Statement Parsing + Bank Detection
 * 
 * Features:
 * - Auto-detect bank from CSV format
 * - Parse 8 Canadian bank CSV formats
 * - Pure functions for all parsing
 * - Handle 500+ transactions efficiently
 */

import {
  SupportedBank,
  BankDetectionResult,
  ParsedTransaction,
  CSVParseResult,
  CSVParseError,
  RawCSVRow,
  SpendingCategory,
  StatementParseError,
  Result,
  success,
  failure,
} from '../types';
import { 
  categorizeTransaction, 
  getUserMappingsSync,
  extractMerchantName 
} from './MerchantPatternService';

// ============================================================================
// Bank Format Definitions
// ============================================================================

interface BankFormat {
  bank: SupportedBank;
  displayName: string;
  
  // Detection
  headerPatterns: RegExp[];      // Patterns to match in header row
  columnCount: number[];         // Valid column counts
  dateFormats: string[];         // Expected date formats
  hasHeader: boolean;
  
  // Parsing
  dateColumn: number | string;   // Column index or header name
  descriptionColumns: (number | string)[]; // Can be multiple
  amountColumn?: number | string;  // Single amount column (neg = debit)
  debitColumn?: number | string;   // Separate debit column
  creditColumn?: number | string;  // Separate credit column
  cardColumn?: number | string;    // Card number column (optional)
  
  // Special handling
  usesUnicodeMinus?: boolean;    // Tangerine uses −
  dateParser?: (dateStr: string) => Date | null;
}

const BANK_FORMATS: BankFormat[] = [
  // TD Canada Trust
  {
    bank: 'td',
    displayName: 'TD Canada Trust',
    headerPatterns: [/date.*description.*debit.*credit.*balance/i],
    columnCount: [5],
    dateFormats: ['MM/DD/YYYY'],
    hasHeader: true,
    dateColumn: 0,
    descriptionColumns: [1],
    debitColumn: 2,
    creditColumn: 3,
  },
  
  // RBC Royal Bank
  {
    bank: 'rbc',
    displayName: 'RBC Royal Bank',
    headerPatterns: [/account\s*type.*account\s*number.*transaction\s*date/i, /cheque.*description.*cad/i],
    columnCount: [8],
    dateFormats: ['MM/DD/YYYY'],
    hasHeader: true,
    dateColumn: 2,
    descriptionColumns: [4, 5],  // Description 1 and Description 2
    amountColumn: 6,             // CAD$ column
    cardColumn: 1,               // Account Number
  },
  
  // CIBC (no header!)
  {
    bank: 'cibc',
    displayName: 'CIBC',
    headerPatterns: [],
    columnCount: [4],
    dateFormats: ['MM/DD/YYYY'],
    hasHeader: false,
    dateColumn: 0,
    descriptionColumns: [1],
    debitColumn: 2,
    creditColumn: 3,
  },
  
  // Scotiabank
  {
    bank: 'scotiabank',
    displayName: 'Scotiabank',
    headerPatterns: [],
    columnCount: [3],
    dateFormats: ['M/DD/YYYY', 'MM/DD/YYYY'],
    hasHeader: false,
    dateColumn: 0,
    descriptionColumns: [1],
    amountColumn: 2,  // Negative = debit
  },
  
  // BMO
  {
    bank: 'bmo',
    displayName: 'BMO',
    headerPatterns: [/item.*card.*transaction\s*date.*posting.*amount.*description/i],
    columnCount: [6],
    dateFormats: ['YYYYMMDD'],
    hasHeader: true,
    dateColumn: 2,
    descriptionColumns: [5],
    amountColumn: 4,
    cardColumn: 1,
    dateParser: (dateStr: string) => {
      // BMO uses YYYYMMDD format
      if (dateStr.length !== 8) return null;
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1;
      const day = parseInt(dateStr.substring(6, 8));
      return new Date(year, month, day);
    },
  },
  
  // Tangerine
  {
    bank: 'tangerine',
    displayName: 'Tangerine',
    headerPatterns: [/date.*transaction.*name.*memo.*amount/i],
    columnCount: [5],
    dateFormats: ['M/DD/YYYY', 'MM/DD/YYYY'],
    hasHeader: true,
    dateColumn: 0,
    descriptionColumns: [2],  // Name column
    amountColumn: 4,
    usesUnicodeMinus: true,   // Uses − (Unicode minus) not - (hyphen)
  },
  
  // PC Financial
  {
    bank: 'pc_financial',
    displayName: 'PC Financial',
    headerPatterns: [/date.*description.*amount/i, /pc\s*financial/i],
    columnCount: [3, 4],
    dateFormats: ['MM/DD/YYYY', 'YYYY-MM-DD'],
    hasHeader: true,
    dateColumn: 0,
    descriptionColumns: [1],
    amountColumn: 2,
  },
  
  // Amex Canada
  {
    bank: 'amex_canada',
    displayName: 'American Express Canada',
    headerPatterns: [/date.*reference.*description.*amount/i],
    columnCount: [4, 5, 6],  // Varies by card type
    dateFormats: ['MM/DD/YYYY', 'DD/MM/YYYY'],
    hasHeader: false,
    dateColumn: 0,
    descriptionColumns: [2],
    amountColumn: 3,
  },
];

// ============================================================================
// Pure Parsing Functions (Exported for Testing)
// ============================================================================

/**
 * Parse a CSV string into rows
 * Handles quoted fields, commas in values, etc.
 */
export function parseCSVToRows(csvContent: string): string[][] {
  const rows: string[][] = [];
  const lines = csvContent.split(/\r?\n/);
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    rows.push(row);
  }
  
  return rows;
}

/**
 * Detect bank from CSV content
 * Returns confidence score (0-100)
 */
export function detectBank(csvContent: string): BankDetectionResult {
  const rows = parseCSVToRows(csvContent);
  if (rows.length === 0) {
    return { bank: null, confidence: 0, matchedPatterns: [] };
  }
  
  const firstRow = rows[0];
  const headerLine = firstRow.join(',').toLowerCase();
  const columnCount = firstRow.length;
  
  let bestMatch: { bank: SupportedBank; score: number; patterns: string[] } | null = null;
  
  for (const format of BANK_FORMATS) {
    let score = 0;
    const matchedPatterns: string[] = [];
    
    // Check header patterns
    if (format.hasHeader) {
      for (const pattern of format.headerPatterns) {
        if (pattern.test(headerLine)) {
          score += 40;
          matchedPatterns.push(`header: ${pattern.source}`);
        }
      }
    }
    
    // Check column count
    if (format.columnCount.includes(columnCount)) {
      score += 30;
      matchedPatterns.push(`columns: ${columnCount}`);
    }
    
    // Check date format in first data row
    const dataRow = format.hasHeader ? rows[1] : rows[0];
    if (dataRow) {
      const dateCol = typeof format.dateColumn === 'number' ? format.dateColumn : 0;
      const dateStr = dataRow[dateCol];
      
      for (const dateFormat of format.dateFormats) {
        if (matchesDateFormat(dateStr, dateFormat)) {
          score += 20;
          matchedPatterns.push(`date: ${dateFormat}`);
          break;
        }
      }
    }
    
    // CIBC special case: no header, 4 columns, MM/DD/YYYY date
    if (format.bank === 'cibc' && !format.hasHeader) {
      // Check if it looks like date, text, number, number
      const sampleRow = rows[0];
      if (sampleRow.length === 4) {
        const [date, desc, debit, credit] = sampleRow;
        if (
          /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date) &&
          desc.length > 0 &&
          (isNumeric(debit) || debit === '') &&
          (isNumeric(credit) || credit === '')
        ) {
          score += 10;
          matchedPatterns.push('cibc-pattern');
        }
      }
    }
    
    // Tangerine special case: check for Unicode minus
    if (format.bank === 'tangerine') {
      if (csvContent.includes('−')) { // Unicode minus
        score += 15;
        matchedPatterns.push('unicode-minus');
      }
    }
    
    // BMO special case: YYYYMMDD date format
    if (format.bank === 'bmo') {
      const dataRow = rows[1];
      if (dataRow && /^\d{8}$/.test(dataRow[2])) {
        score += 15;
        matchedPatterns.push('bmo-date-format');
      }
    }
    
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { bank: format.bank, score, patterns: matchedPatterns };
    }
  }
  
  if (!bestMatch || bestMatch.score < 30) {
    return {
      bank: null,
      confidence: bestMatch?.score || 0,
      matchedPatterns: bestMatch?.patterns || [],
      suggestedBank: bestMatch?.bank,
    };
  }
  
  return {
    bank: bestMatch.score >= 80 ? bestMatch.bank : null,
    confidence: Math.min(100, bestMatch.score),
    matchedPatterns: bestMatch.patterns,
    suggestedBank: bestMatch.bank,
  };
}

/**
 * Check if a string matches a date format
 */
export function matchesDateFormat(dateStr: string, format: string): boolean {
  if (!dateStr) return false;
  
  switch (format) {
    case 'MM/DD/YYYY':
      return /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr);
    case 'M/DD/YYYY':
      return /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr);
    case 'YYYY-MM-DD':
      return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
    case 'YYYYMMDD':
      return /^\d{8}$/.test(dateStr);
    case 'DD/MM/YYYY':
      return /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr);
    default:
      return false;
  }
}

/**
 * Parse a date string with various formats
 */
export function parseDate(dateStr: string, format?: string): Date | null {
  if (!dateStr) return null;
  
  // YYYYMMDD (BMO)
  if (/^\d{8}$/.test(dateStr)) {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month, day);
  }
  
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr);
  }
  
  // MM/DD/YYYY or M/DD/YYYY
  const mdyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdyMatch) {
    const [, month, day, year] = mdyMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  return null;
}

/**
 * Parse amount string to number
 * Handles various formats: negative, parentheses, currency symbols, Unicode minus
 */
export function parseAmount(amountStr: string): number {
  if (!amountStr || amountStr.trim() === '') return 0;
  
  let cleaned = amountStr
    .replace(/[$,]/g, '')           // Remove $ and commas
    .replace(/−/g, '-')             // Unicode minus to ASCII
    .replace(/\s/g, '')             // Remove spaces
    .trim();
  
  // Handle parentheses as negative
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1);
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Parse a single row according to bank format
 */
export function parseRow(
  row: string[],
  format: BankFormat,
  rowIndex: number
): { transaction: Omit<ParsedTransaction, 'category' | 'categoryConfidence' | 'userCorrected'> | null; error?: CSVParseError } {
  try {
    // Get date
    const dateCol = typeof format.dateColumn === 'number' ? format.dateColumn : 0;
    const dateStr = row[dateCol];
    
    const date = format.dateParser 
      ? format.dateParser(dateStr)
      : parseDate(dateStr);
    
    if (!date || isNaN(date.getTime())) {
      return {
        transaction: null,
        error: {
          line: rowIndex + 1,
          message: `Invalid date: ${dateStr}`,
          rawLine: row.join(','),
        },
      };
    }
    
    // Get description
    const descParts: string[] = [];
    for (const col of format.descriptionColumns) {
      const colIndex = typeof col === 'number' ? col : 0;
      if (row[colIndex]) {
        descParts.push(row[colIndex]);
      }
    }
    const description = descParts.join(' ').trim();
    
    // Get amount
    let amount = 0;
    let isCredit = false;
    
    if (format.amountColumn !== undefined) {
      const amtCol = typeof format.amountColumn === 'number' ? format.amountColumn : 0;
      let amtStr = row[amtCol] || '';
      
      // Handle Unicode minus for Tangerine
      if (format.usesUnicodeMinus) {
        amtStr = amtStr.replace(/−/g, '-');
      }
      
      const parsed = parseAmount(amtStr);
      
      // For single amount column: negative = purchase, positive = credit/payment
      // (Scotiabank and Tangerine use this convention)
      if (format.bank === 'scotiabank' || format.bank === 'tangerine') {
        if (parsed < 0) {
          amount = Math.abs(parsed);
          isCredit = false;
        } else {
          amount = parsed;
          isCredit = true;
        }
      } else {
        // Most banks: positive = purchase, negative might not occur
        amount = Math.abs(parsed);
        isCredit = parsed < 0;
      }
    } else {
      // Separate debit/credit columns
      const debitCol = typeof format.debitColumn === 'number' ? format.debitColumn : -1;
      const creditCol = typeof format.creditColumn === 'number' ? format.creditColumn : -1;
      
      const debit = debitCol >= 0 ? parseAmount(row[debitCol] || '') : 0;
      const credit = creditCol >= 0 ? parseAmount(row[creditCol] || '') : 0;
      
      if (debit > 0) {
        amount = debit;
        isCredit = false;
      } else if (credit > 0) {
        amount = credit;
        isCredit = true;
      }
    }
    
    // Get card number if available
    let cardLast4: string | undefined;
    if (format.cardColumn !== undefined) {
      const cardCol = typeof format.cardColumn === 'number' ? format.cardColumn : -1;
      const cardNum = cardCol >= 0 ? row[cardCol] : '';
      if (cardNum) {
        // Extract last 4 digits
        const digits = cardNum.replace(/\D/g, '');
        if (digits.length >= 4) {
          cardLast4 = digits.slice(-4);
        }
      }
    }
    
    return {
      transaction: {
        id: `tx_${Date.now()}_${rowIndex}_${Math.random().toString(36).substr(2, 6)}`,
        date,
        description,
        normalizedMerchant: extractMerchantName(description),
        amount,
        isCredit,
        sourceBank: format.bank,
        cardLast4,
      },
    };
  } catch (error) {
    return {
      transaction: null,
      error: {
        line: rowIndex + 1,
        message: `Parse error: ${error instanceof Error ? error.message : 'Unknown'}`,
        rawLine: row.join(','),
      },
    };
  }
}

/**
 * Parse complete CSV content for a specific bank
 */
export function parseCSV(
  csvContent: string,
  bank: SupportedBank
): CSVParseResult {
  const format = BANK_FORMATS.find(f => f.bank === bank);
  if (!format) {
    return {
      success: false,
      transactions: [],
      bank,
      periodStart: new Date(),
      periodEnd: new Date(),
      totalSpend: 0,
      totalCredits: 0,
      errors: [{ line: 0, message: `Unsupported bank: ${bank}`, rawLine: '' }],
      warnings: [],
    };
  }
  
  const rows = parseCSVToRows(csvContent);
  if (rows.length === 0) {
    return {
      success: false,
      transactions: [],
      bank,
      periodStart: new Date(),
      periodEnd: new Date(),
      totalSpend: 0,
      totalCredits: 0,
      errors: [{ line: 0, message: 'Empty file', rawLine: '' }],
      warnings: [],
    };
  }
  
  // Get user mappings for categorization
  const userMappings = getUserMappingsSync();
  
  const transactions: ParsedTransaction[] = [];
  const errors: CSVParseError[] = [];
  const warnings: string[] = [];
  
  // Skip header if present
  const startIndex = format.hasHeader ? 1 : 0;
  
  let minDate: Date | null = null;
  let maxDate: Date | null = null;
  let totalSpend = 0;
  let totalCredits = 0;
  
  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    
    // Skip empty rows
    if (row.every(cell => !cell.trim())) continue;
    
    // Skip rows that don't match expected column count
    if (!format.columnCount.includes(row.length)) {
      // Be lenient - warn but try to parse anyway if close
      if (Math.abs(row.length - format.columnCount[0]) > 2) {
        warnings.push(`Row ${i + 1}: Unexpected column count (${row.length})`);
        continue;
      }
    }
    
    const result = parseRow(row, format, i);
    
    if (result.error) {
      errors.push(result.error);
      continue;
    }
    
    if (!result.transaction) continue;
    
    // Categorize the transaction
    const { category, merchantName, confidence } = categorizeTransaction(
      result.transaction.description,
      userMappings
    );
    
    const fullTransaction: ParsedTransaction = {
      ...result.transaction,
      normalizedMerchant: merchantName,
      category,
      categoryConfidence: confidence,
      userCorrected: false,
    };
    
    transactions.push(fullTransaction);
    
    // Track date range
    if (!minDate || fullTransaction.date < minDate) minDate = fullTransaction.date;
    if (!maxDate || fullTransaction.date > maxDate) maxDate = fullTransaction.date;
    
    // Track totals
    if (fullTransaction.isCredit) {
      totalCredits += fullTransaction.amount;
    } else {
      totalSpend += fullTransaction.amount;
    }
  }
  
  return {
    success: transactions.length > 0,
    transactions,
    bank,
    periodStart: minDate || new Date(),
    periodEnd: maxDate || new Date(),
    totalSpend,
    totalCredits,
    errors,
    warnings,
  };
}

/**
 * Full parse flow: detect bank + parse
 */
export function parseStatement(
  csvContent: string,
  forcedBank?: SupportedBank
): Result<CSVParseResult, StatementParseError> {
  // Clean input
  const content = csvContent.trim();
  if (!content) {
    return failure({ type: 'EMPTY_FILE' });
  }
  
  // Detect or use forced bank
  let bank: SupportedBank;
  
  if (forcedBank) {
    bank = forcedBank;
  } else {
    const detection = detectBank(content);
    
    if (!detection.bank) {
      return failure({
        type: 'UNSUPPORTED_BANK',
        detectedFormat: detection.matchedPatterns.join(', '),
      });
    }
    
    bank = detection.bank;
  }
  
  // Parse
  const result = parseCSV(content, bank);
  
  if (!result.success) {
    if (result.errors.length > 0) {
      return failure({
        type: 'PARSE_FAILED',
        errors: result.errors,
      });
    }
    return failure({ type: 'NO_TRANSACTIONS' });
  }
  
  return success(result);
}

// ============================================================================
// Utility Functions
// ============================================================================

function isNumeric(str: string): boolean {
  if (!str || str.trim() === '') return false;
  return !isNaN(parseAmount(str));
}

/**
 * Get bank display name
 */
export function getBankDisplayName(bank: SupportedBank): string {
  const format = BANK_FORMATS.find(f => f.bank === bank);
  return format?.displayName || bank;
}

/**
 * Get all supported banks
 */
export function getSupportedBanks(): Array<{ bank: SupportedBank; displayName: string }> {
  return BANK_FORMATS.map(f => ({
    bank: f.bank,
    displayName: f.displayName,
  }));
}
