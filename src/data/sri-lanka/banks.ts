export interface BankConfig {
  name: string;
  shortName: string;
  patterns: RegExp[];
  merchantPattern?: RegExp;
  datePattern?: RegExp;
  amountPattern?: RegExp;
  balancePattern?: RegExp;
  smsFormats: string[];
}

export const SriLankanBanks: Record<string, BankConfig> = {
  BOC: {
    name: "Bank of Ceylon",
    shortName: "BOC",
    patterns: [
      /BOC.*?Rs\.?\s*([0-9,]+\.?\d*)/i,
      /BOC.*?LKR\s*([0-9,]+\.?\d*)/i,
      /Bank of Ceylon.*?Rs\.?\s*([0-9,]+\.?\d*)/i
    ],
    merchantPattern: /(?:at|from)\s+(.+?)\s+(?:on|dated|ref)/i,
    datePattern: /(?:on|dated)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    amountPattern: /(?:Rs\.?|LKR)\s*([0-9,]+\.?\d*)/i,
    balancePattern: /(?:balance|bal)[\s:]*(?:Rs\.?|LKR)\s*([0-9,]+\.?\d*)/i,
    smsFormats: [
      "BOC: Rs.{amount} spent at {merchant} on {date}. Bal: Rs.{balance}",
      "Bank of Ceylon - Transaction Alert: Rs.{amount} debited from account"
    ]
  },

  COMMERCIAL: {
    name: "Commercial Bank",
    shortName: "COMBANK",
    patterns: [
      /COMBANK.*?LKR\s*([0-9,]+\.?\d*)/i,
      /Commercial.*?Rs\s*([0-9,]+\.?\d*)/i,
      /ComBank.*?LKR\s*([0-9,]+\.?\d*)/i
    ],
    merchantPattern: /(?:at|from)\s+(.+?)\s+(?:on|dated)/i,
    datePattern: /(?:on|dated)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    smsFormats: [
      "COMBANK: LKR {amount} spent at {merchant}. Available Bal: LKR {balance}",
      "Commercial Bank Alert: Your card ending 1234 used for LKR {amount}"
    ]
  },

  SAMPATH: {
    name: "Sampath Bank",
    shortName: "SAMPATH",
    patterns: [
      /SAMPATH.*?Rs\s*([0-9,]+\.?\d*)/i,
      /Sampath.*?LKR\s*([0-9,]+\.?\d*)/i
    ],
    merchantPattern: /(?:at|from)\s+(.+?)\s+(?:on|dated)/i,
    datePattern: /(?:on|dated)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    smsFormats: [
      "SAMPATH: Rs {amount} spent at {merchant} on {date}",
      "Sampath Bank: Transaction of Rs.{amount} at {merchant}"
    ]
  },

  HNB: {
    name: "Hatton National Bank",
    shortName: "HNB",
    patterns: [
      /HNB.*?LKR\s*([0-9,]+\.?\d*)/i,
      /Hatton.*?Rs\s*([0-9,]+\.?\d*)/i
    ],
    merchantPattern: /(?:at|from)\s+(.+?)\s+(?:on|dated)/i,
    datePattern: /(?:on|dated)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    smsFormats: [
      "HNB: LKR {amount} spent at {merchant}. Bal: LKR {balance}",
      "HNB Alert: Card transaction LKR {amount} at {merchant}"
    ]
  },

  SEYLAN: {
    name: "Seylan Bank",
    shortName: "SEYLAN",
    patterns: [
      /SEYLAN.*?Rs\s*([0-9,]+\.?\d*)/i,
      /Seylan.*?LKR\s*([0-9,]+\.?\d*)/i
    ],
    merchantPattern: /(?:at|from)\s+(.+?)\s+(?:on|dated)/i,
    datePattern: /(?:on|dated)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    smsFormats: [
      "SEYLAN: Rs {amount} spent at {merchant}",
      "Seylan Bank: Your account debited Rs.{amount}"
    ]
  },

  NATIONS_TRUST: {
    name: "Nations Trust Bank",
    shortName: "NTB",
    patterns: [
      /NTB.*?Rs\s*([0-9,]+\.?\d*)/i,
      /Nations.*?LKR\s*([0-9,]+\.?\d*)/i
    ],
    merchantPattern: /(?:at|from)\s+(.+?)\s+(?:on|dated)/i,
    datePattern: /(?:on|dated)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    smsFormats: [
      "NTB: Transaction of Rs.{amount} at {merchant}",
      "Nations Trust Bank: Rs.{amount} spent"
    ]
  }
};

export const detectBank = (smsText: string): string | null => {
  for (const [bankCode, config] of Object.entries(SriLankanBanks)) {
    if (config.patterns.some(pattern => pattern.test(smsText))) {
      return bankCode;
    }
  }
  return null;
};

export const getSupportedBanks = (): string[] => {
  return Object.keys(SriLankanBanks);
};

export const getBankByName = (name: string): BankConfig | null => {
  const bank = Object.values(SriLankanBanks).find(
    config => config.name.toLowerCase().includes(name.toLowerCase()) ||
              config.shortName.toLowerCase() === name.toLowerCase()
  );
  return bank || null;
};