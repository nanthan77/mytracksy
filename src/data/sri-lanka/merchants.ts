export interface MerchantInfo {
  name: string;
  category: string;
  type: string;
  confidence: number;
  alternativeNames?: string[];
  commonExpenseTypes?: string[];
}

export const SriLankanMerchants: Record<string, MerchantInfo> = {
  // Major Supermarkets
  "KEELLS": {
    name: "Keells Super",
    category: "Groceries",
    type: "Supermarket",
    confidence: 0.95,
    alternativeNames: ["KEELLS SUPER", "KEELLS SUPR", "KEELS"],
    commonExpenseTypes: ["Groceries", "Household Items", "Food"]
  },
  "ARPICO": {
    name: "Arpico",
    category: "Shopping",
    type: "Department Store",
    confidence: 0.90,
    alternativeNames: ["ARPICO SUPER", "ARPICO SUPRCTR"],
    commonExpenseTypes: ["Groceries", "Clothing", "Electronics"]
  },
  "CARGILLS": {
    name: "Cargills",
    category: "Groceries",
    type: "Supermarket",
    confidence: 0.95,
    alternativeNames: ["CARGILLS FOOD CITY", "FOOD CITY"],
    commonExpenseTypes: ["Groceries", "Fresh Food", "Household"]
  },

  // Fuel Stations
  "CEYPETCO": {
    name: "Ceylon Petroleum Corporation",
    category: "Fuel",
    type: "Fuel Station",
    confidence: 0.98,
    alternativeNames: ["CEYPETCO", "CPC", "FUEL SHED"],
    commonExpenseTypes: ["Petrol", "Diesel"]
  },
  "IOC": {
    name: "Indian Oil Corporation",
    category: "Fuel",
    type: "Fuel Station",
    confidence: 0.95,
    alternativeNames: ["INDIAN OIL", "IOCL"],
    commonExpenseTypes: ["Petrol", "Diesel"]
  },
  "LAUGFS": {
    name: "Laugfs Gas",
    category: "Fuel",
    type: "Gas Station",
    confidence: 0.90,
    alternativeNames: ["LAUGFS GAS", "LAUGHS"],
    commonExpenseTypes: ["LP Gas", "Petrol"]
  },

  // Restaurants & Cafes
  "KFC": {
    name: "KFC",
    category: "Food & Dining",
    type: "Fast Food",
    confidence: 0.98,
    alternativeNames: ["KENTUCKY"],
    commonExpenseTypes: ["Fast Food", "Lunch", "Dinner"]
  },
  "MCDONALDS": {
    name: "McDonald's",
    category: "Food & Dining",
    type: "Fast Food",
    confidence: 0.98,
    alternativeNames: ["MCDONALD", "MCD"],
    commonExpenseTypes: ["Fast Food", "Breakfast", "Lunch"]
  },
  "PIZZA HUT": {
    name: "Pizza Hut",
    category: "Food & Dining",
    type: "Restaurant",
    confidence: 0.95,
    alternativeNames: ["PIZZAHUT"],
    commonExpenseTypes: ["Pizza", "Dinner", "Takeaway"]
  },

  // Local Restaurants
  "SHANMUGAS": {
    name: "Shanmugas",
    category: "Food & Dining",
    type: "Restaurant",
    confidence: 0.85,
    alternativeNames: ["SHANMUGA"],
    commonExpenseTypes: ["Indian Food", "Lunch", "Dinner"]
  },
  "CAFE MOCHA": {
    name: "Cafe Mocha",
    category: "Food & Dining",
    type: "Cafe",
    confidence: 0.80,
    alternativeNames: ["MOCHA"],
    commonExpenseTypes: ["Coffee", "Snacks", "Breakfast"]
  },

  // Pharmacies
  "OSUSALA": {
    name: "Osu Sala",
    category: "Healthcare",
    type: "Pharmacy",
    confidence: 0.90,
    alternativeNames: ["OSU SALA"],
    commonExpenseTypes: ["Medicine", "Healthcare"]
  },
  "HEALTHGUARD": {
    name: "HealthGuard",
    category: "Healthcare",
    type: "Pharmacy",
    confidence: 0.85,
    alternativeNames: ["HEALTH GUARD"],
    commonExpenseTypes: ["Medicine", "Health Products"]
  },

  // Transportation
  "UBER": {
    name: "Uber",
    category: "Transport",
    type: "Ride Sharing",
    confidence: 0.98,
    commonExpenseTypes: ["Taxi", "Transportation"]
  },
  "PICKME": {
    name: "PickMe",
    category: "Transport",
    type: "Ride Sharing",
    confidence: 0.95,
    alternativeNames: ["PICK ME"],
    commonExpenseTypes: ["Taxi", "Transportation"]
  },

  // Utility Bills
  "CEB": {
    name: "Ceylon Electricity Board",
    category: "Bills & Utilities",
    type: "Utility Company",
    confidence: 0.98,
    alternativeNames: ["ELECTRICITY", "POWER"],
    commonExpenseTypes: ["Electricity Bill"]
  },
  "WATER BOARD": {
    name: "National Water Supply",
    category: "Bills & Utilities",
    type: "Utility Company",
    confidence: 0.90,
    alternativeNames: ["NWS&DB", "WATER"],
    commonExpenseTypes: ["Water Bill"]
  },

  // Telecommunications
  "DIALOG": {
    name: "Dialog",
    category: "Bills & Utilities",
    type: "Telecom",
    confidence: 0.95,
    commonExpenseTypes: ["Mobile Bill", "Internet Bill"]
  },
  "MOBITEL": {
    name: "Mobitel",
    category: "Bills & Utilities",
    type: "Telecom",
    confidence: 0.95,
    commonExpenseTypes: ["Mobile Bill"]
  },
  "AIRTEL": {
    name: "Airtel",
    category: "Bills & Utilities",
    type: "Telecom",
    confidence: 0.90,
    commonExpenseTypes: ["Mobile Bill"]
  },

  // Banking/ATM
  "ATM": {
    name: "ATM Withdrawal",
    category: "Cash Withdrawal",
    type: "ATM",
    confidence: 0.85,
    commonExpenseTypes: ["Cash Withdrawal"]
  },

  // Religious/Cultural
  "TEMPLE": {
    name: "Temple",
    category: "Religious",
    type: "Religious Institution",
    confidence: 0.80,
    alternativeNames: ["KOVIL", "DEVALE"],
    commonExpenseTypes: ["Donations", "Religious Activities"]
  }
};

export const identifyMerchant = (merchantText: string): MerchantInfo | null => {
  const cleanText = merchantText.toUpperCase().trim();
  
  // Direct match
  if (SriLankanMerchants[cleanText]) {
    return SriLankanMerchants[cleanText];
  }

  // Search through alternative names and partial matches
  for (const [key, merchant] of Object.entries(SriLankanMerchants)) {
    // Check if the key is contained in the text
    if (cleanText.includes(key)) {
      return { ...merchant, confidence: merchant.confidence * 0.9 };
    }

    // Check alternative names
    if (merchant.alternativeNames) {
      for (const altName of merchant.alternativeNames) {
        if (cleanText.includes(altName.toUpperCase()) || altName.toUpperCase().includes(cleanText)) {
          return { ...merchant, confidence: merchant.confidence * 0.8 };
        }
      }
    }
  }

  return null;
};

export const categorizeMerchant = (merchantName: string): string => {
  const merchant = identifyMerchant(merchantName);
  return merchant ? merchant.category : 'Miscellaneous';
};

export const getMerchantsByCategory = (category: string): MerchantInfo[] => {
  return Object.values(SriLankanMerchants).filter(
    merchant => merchant.category === category
  );
};

export const getAllCategories = (): string[] => {
  const categories = new Set(Object.values(SriLankanMerchants).map(m => m.category));
  return Array.from(categories).sort();
};