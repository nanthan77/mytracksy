import { SriLankanBanks, BankConfig, detectBank } from '../../data/sri-lanka/banks';
import { identifyMerchant, categorizeMerchant } from '../../data/sri-lanka/merchants';
import { merchantRecognitionService, MerchantRecognitionResult } from '../../services/merchantRecognitionService';

export interface SMSTransaction {
  id: string;
  bankCode: string;
  bankName: string;
  amount: number;
  merchant: string;
  category: string;
  subCategory?: string;
  date: Date;
  transactionType: 'debit' | 'credit' | 'unknown';
  balance?: number;
  confidence: number;
  rawSMS: string;
  merchantRecognition?: MerchantRecognitionResult;
  extractedData: {
    amountText?: string;
    merchantText?: string;
    dateText?: string;
    balanceText?: string;
  };
}

export interface SMSParsingResult {
  success: boolean;
  transaction?: SMSTransaction;
  error?: string;
  confidence: number;
}

export class SMSParser {
  private static instance: SMSParser;

  public static getInstance(): SMSParser {
    if (!SMSParser.instance) {
      SMSParser.instance = new SMSParser();
    }
    return SMSParser.instance;
  }

  /**
   * Main parsing function that processes SMS text and extracts transaction data
   */
  public parseSMS(smsText: string, timestamp?: Date): SMSParsingResult {
    try {
      // Clean up the SMS text
      const cleanedSMS = this.cleanSMSText(smsText);
      
      // Detect which bank sent this SMS
      const bankCode = detectBank(cleanedSMS);
      if (!bankCode) {
        return {
          success: false,
          error: 'Bank not recognized',
          confidence: 0
        };
      }

      const bankConfig = SriLankanBanks[bankCode];
      
      // Extract transaction data using bank-specific patterns
      const extractedData = this.extractTransactionData(cleanedSMS, bankConfig);
      
      // Calculate confidence score
      const confidence = this.calculateConfidence(extractedData, cleanedSMS);
      
      if (confidence < 0.3) {
        return {
          success: false,
          error: 'Low confidence in transaction extraction',
          confidence
        };
      }

      // Enhanced merchant recognition
      const merchantRecognition = merchantRecognitionService.recognizeMerchant(
        extractedData.merchant || 'Unknown Merchant',
        extractedData.amount,
        extractedData.date || timestamp
      );

      // Create transaction object
      const transaction: SMSTransaction = {
        id: this.generateTransactionId(),
        bankCode,
        bankName: bankConfig.name,
        amount: extractedData.amount || 0,
        merchant: merchantRecognition.merchantName,
        category: merchantRecognition.category,
        subCategory: merchantRecognition.suggestedSubCategory,
        date: extractedData.date || timestamp || new Date(),
        transactionType: this.determineTransactionType(cleanedSMS),
        balance: extractedData.balance,
        confidence: Math.min(confidence, merchantRecognition.confidence),
        rawSMS: smsText,
        merchantRecognition,
        extractedData: {
          amountText: extractedData.amountText,
          merchantText: extractedData.merchantText,
          dateText: extractedData.dateText,
          balanceText: extractedData.balanceText
        }
      };

      // Learn from this transaction for future recognition
      merchantRecognitionService.learnFromUser(
        extractedData.merchant || 'Unknown Merchant',
        merchantRecognition.category,
        extractedData.amount || 0,
        merchantRecognition.confidence > 0.8
      );

      return {
        success: true,
        transaction,
        confidence
      };

    } catch (error) {
      console.error('SMS parsing error:', error);
      return {
        success: false,
        error: `Parsing failed: ${error}`,
        confidence: 0
      };
    }
  }

  /**
   * Extract transaction data using bank-specific patterns
   */
  private extractTransactionData(smsText: string, bankConfig: BankConfig) {
    const result: any = {};

    // Extract amount
    const amountResult = this.extractAmount(smsText, bankConfig);
    result.amount = amountResult.amount;
    result.amountText = amountResult.text;

    // Extract merchant
    const merchantResult = this.extractMerchant(smsText, bankConfig);
    result.merchant = merchantResult.merchant;
    result.merchantText = merchantResult.text;

    // Extract date
    const dateResult = this.extractDate(smsText, bankConfig);
    result.date = dateResult.date;
    result.dateText = dateResult.text;

    // Extract balance
    const balanceResult = this.extractBalance(smsText, bankConfig);
    result.balance = balanceResult.balance;
    result.balanceText = balanceResult.text;

    return result;
  }

  /**
   * Extract amount from SMS using bank-specific patterns
   */
  private extractAmount(smsText: string, bankConfig: BankConfig): { amount: number; text?: string } {
    // Try bank-specific amount patterns first
    if (bankConfig.amountPattern) {
      const match = smsText.match(bankConfig.amountPattern);
      if (match) {
        const amount = this.parseAmount(match[1]);
        return { amount, text: match[0] };
      }
    }

    // Try general patterns from bank config
    for (const pattern of bankConfig.patterns) {
      const match = smsText.match(pattern);
      if (match) {
        const amount = this.parseAmount(match[1]);
        return { amount, text: match[0] };
      }
    }

    // Fallback to general amount patterns
    const generalPatterns = [
      /(?:Rs\.?|LKR|rupees)\s*([0-9,]+\.?\d*)/i,
      /([0-9,]+\.?\d*)\s*(?:Rs\.?|LKR|rupees)/i,
      /amount[:\s]*(?:Rs\.?|LKR)?\s*([0-9,]+\.?\d*)/i
    ];

    for (const pattern of generalPatterns) {
      const match = smsText.match(pattern);
      if (match) {
        const amount = this.parseAmount(match[1]);
        return { amount, text: match[0] };
      }
    }

    return { amount: 0 };
  }

  /**
   * Extract merchant from SMS
   */
  private extractMerchant(smsText: string, bankConfig: BankConfig): { merchant: string; text?: string } {
    // Try bank-specific merchant pattern
    if (bankConfig.merchantPattern) {
      const match = smsText.match(bankConfig.merchantPattern);
      if (match && match[1]) {
        const merchant = this.cleanMerchantName(match[1]);
        return { merchant, text: match[0] };
      }
    }

    // Try general merchant patterns
    const generalPatterns = [
      /(?:at|from|to)\s+([A-Z\s]{3,30})\s+(?:on|dated|ref)/i,
      /merchant[:\s]*([A-Z\s]{3,20})/i,
      /(?:spent|paid)\s+(?:at|to)\s+([A-Z\s]{3,20})/i
    ];

    for (const pattern of generalPatterns) {
      const match = smsText.match(pattern);
      if (match && match[1]) {
        const merchant = this.cleanMerchantName(match[1]);
        return { merchant, text: match[0] };
      }
    }

    // Try to extract any capitalized words that might be merchant names
    const capitalizedWords = smsText.match(/[A-Z][A-Z\s]{2,15}/g);
    if (capitalizedWords && capitalizedWords.length > 0) {
      // Filter out bank names and common words
      const filteredWords = capitalizedWords.filter(word => 
        !this.isCommonBankingTerm(word) && 
        word.length > 3 && 
        word.length < 20
      );
      
      if (filteredWords.length > 0) {
        return { merchant: this.cleanMerchantName(filteredWords[0]) };
      }
    }

    return { merchant: 'Unknown Merchant' };
  }

  /**
   * Extract date from SMS
   */
  private extractDate(smsText: string, bankConfig: BankConfig): { date: Date | null; text?: string } {
    // Try bank-specific date pattern
    if (bankConfig.datePattern) {
      const match = smsText.match(bankConfig.datePattern);
      if (match) {
        const date = this.parseDate(match[1]);
        return { date, text: match[0] };
      }
    }

    // Try general date patterns
    const datePatterns = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
      /(\d{1,2}\s+\w{3}\s+\d{2,4})/,
      /on\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /dated\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
    ];

    for (const pattern of datePatterns) {
      const match = smsText.match(pattern);
      if (match) {
        const date = this.parseDate(match[1]);
        return { date, text: match[0] };
      }
    }

    return { date: null };
  }

  /**
   * Extract balance from SMS
   */
  private extractBalance(smsText: string, bankConfig: BankConfig): { balance: number | null; text?: string } {
    // Try bank-specific balance pattern
    if (bankConfig.balancePattern) {
      const match = smsText.match(bankConfig.balancePattern);
      if (match) {
        const balance = this.parseAmount(match[1]);
        return { balance, text: match[0] };
      }
    }

    // Try general balance patterns
    const balancePatterns = [
      /(?:balance|bal|available)[:\s]*(?:Rs\.?|LKR)?\s*([0-9,]+\.?\d*)/i,
      /(?:bal|balance)[:\s]*([0-9,]+\.?\d*)/i
    ];

    for (const pattern of balancePatterns) {
      const match = smsText.match(pattern);
      if (match) {
        const balance = this.parseAmount(match[1]);
        return { balance, text: match[0] };
      }
    }

    return { balance: null };
  }

  /**
   * Parse amount string to number
   */
  private parseAmount(amountStr: string): number {
    // Remove commas and convert to number
    const cleaned = amountStr.replace(/,/g, '').trim();
    const amount = parseFloat(cleaned);
    return isNaN(amount) ? 0 : amount;
  }

  /**
   * Parse date string to Date object
   */
  private parseDate(dateStr: string): Date | null {
    try {
      // Handle different date formats
      const cleaned = dateStr.trim();
      
      // DD/MM/YYYY or DD-MM-YYYY
      if (/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(cleaned)) {
        const parts = cleaned.split(/[\/\-]/);
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const year = parseInt(parts[2], 10);
        
        // Handle 2-digit years
        const fullYear = year < 100 ? 2000 + year : year;
        
        return new Date(fullYear, month, day);
      }

      // Try to parse as a general date
      const parsed = new Date(cleaned);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch {
      return null;
    }
  }

  /**
   * Clean and normalize merchant name
   */
  private cleanMerchantName(merchant: string): string {
    return merchant
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .toUpperCase();
  }

  /**
   * Check if a word is a common banking term
   */
  private isCommonBankingTerm(word: string): boolean {
    const commonTerms = [
      'BANK', 'TRANSACTION', 'DEBIT', 'CREDIT', 'CARD', 'ACCOUNT',
      'BALANCE', 'PAYMENT', 'TRANSFER', 'ATM', 'POS', 'ONLINE'
    ];
    return commonTerms.some(term => word.toUpperCase().includes(term));
  }

  /**
   * Categorize transaction based on merchant
   */
  private categorizeTransaction(merchant: string): string {
    if (!merchant || merchant === 'Unknown Merchant') {
      return 'Miscellaneous';
    }

    // Use merchant recognition system
    const merchantInfo = identifyMerchant(merchant);
    if (merchantInfo) {
      return merchantInfo.category;
    }

    // Fallback categorization
    return categorizeMerchant(merchant);
  }

  /**
   * Determine transaction type (debit/credit)
   */
  private determineTransactionType(smsText: string): 'debit' | 'credit' | 'unknown' {
    const debitKeywords = ['spent', 'paid', 'debit', 'debited', 'purchase', 'withdrawn'];
    const creditKeywords = ['credit', 'credited', 'deposit', 'deposited', 'received'];
    
    const lowerText = smsText.toLowerCase();
    
    if (debitKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'debit';
    }
    
    if (creditKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'credit';
    }
    
    return 'unknown';
  }

  /**
   * Calculate confidence score for extraction
   */
  private calculateConfidence(extractedData: any, smsText: string): number {
    let confidence = 0;
    
    // Amount extraction confidence (40% weight)
    if (extractedData.amount && extractedData.amount > 0) {
      confidence += 0.4;
    }
    
    // Merchant extraction confidence (30% weight)
    if (extractedData.merchant && extractedData.merchant !== 'Unknown Merchant') {
      confidence += 0.3;
      
      // Bonus for recognized merchants
      const merchantInfo = identifyMerchant(extractedData.merchant);
      if (merchantInfo && merchantInfo.confidence > 0.8) {
        confidence += 0.1;
      }
    }
    
    // Date extraction confidence (15% weight)
    if (extractedData.date) {
      confidence += 0.15;
    }
    
    // Balance extraction confidence (10% weight)
    if (extractedData.balance) {
      confidence += 0.1;
    }
    
    // SMS structure confidence (5% weight)
    if (this.looksLikeBankingSMS(smsText)) {
      confidence += 0.05;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Check if SMS looks like a banking SMS
   */
  private looksLikeBankingSMS(smsText: string): boolean {
    const bankingKeywords = [
      'transaction', 'debit', 'credit', 'balance', 'account',
      'payment', 'transfer', 'spent', 'paid', 'rs', 'lkr', 'rupees'
    ];
    
    const lowerText = smsText.toLowerCase();
    const matchCount = bankingKeywords.filter(keyword => 
      lowerText.includes(keyword)
    ).length;
    
    return matchCount >= 2;
  }

  /**
   * Clean SMS text for processing
   */
  private cleanSMSText(smsText: string): string {
    return smsText
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(): string {
    return `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Parse multiple SMS messages in batch
   */
  public parseBatchSMS(smsMessages: Array<{ text: string; timestamp?: Date }>): SMSParsingResult[] {
    return smsMessages.map(sms => this.parseSMS(sms.text, sms.timestamp));
  }

  /**
   * Test SMS parser with sample data
   */
  public testWithSampleSMS(): SMSParsingResult[] {
    const sampleSMS = [
      "BOC: Rs.1,250.00 spent at KEELLS SUPER on 06/07/2024. Bal: Rs.45,750.00",
      "COMBANK: LKR 800 spent at UBER on 06/07/2024. Available Bal: LKR 12,500",
      "SAMPATH: Rs 2,500 spent at CAFE MOCHA on 06/07/2024",
      "HNB: LKR 15,000 spent at ARPICO SUPER on 05/07/2024. Bal: LKR 25,000"
    ];

    return sampleSMS.map(sms => this.parseSMS(sms));
  }
}

export const smsParser = SMSParser.getInstance();