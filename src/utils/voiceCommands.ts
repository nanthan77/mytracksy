// Voice command parser for Sri Lankan languages
export interface VoiceCommand {
  action: string;
  amount?: number;
  category?: string;
  language: string;
  confidence: number;
}

export interface CommandPattern {
  pattern: RegExp;
  action: string;
  extractors: {
    amount?: (match: RegExpMatchArray) => number;
    category?: (match: RegExpMatchArray) => string;
  };
}

// Sri Lankan Rupee amount patterns
const amountPatterns = {
  en: /(?:rs\.?|rupees?)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)|(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:rs\.?|rupees?)/i,
  si: /රුපියල්\s*(\d+(?:,\d{3})*(?:\.\d{2})?)|(\d+(?:,\d{3})*(?:\.\d{2})?)\s*රුපියල්/i,
  ta: /ரூபாய்\s*(\d+(?:,\d{3})*(?:\.\d{2})?)|(\d+(?:,\d{3})*(?:\.\d{2})?)\s*ரூபாய்/i
};

// Command patterns for each language
const commandPatterns = {
  en: [
    {
      pattern: /add\s+expense\s+(?:of\s+)?(?:rs\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:rs\.?|rupees?)?\s+for\s+(.+)/i,
      action: 'add_expense',
      extractors: {
        amount: (match) => parseFloat(match[1].replace(/,/g, '')),
        category: (match) => match[2].trim()
      }
    },
    {
      pattern: /(?:record|add)\s+(.+)\s+(?:expense|cost)\s+(?:of\s+)?(?:rs\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
      action: 'add_expense',
      extractors: {
        amount: (match) => parseFloat(match[2].replace(/,/g, '')),
        category: (match) => match[1].trim()
      }
    },
    {
      pattern: /(?:show|display|open)\s+(?:my\s+)?(?:expenses?|spending)/i,
      action: 'show_expenses',
      extractors: {}
    },
    {
      pattern: /(?:show|display|open)\s+(?:my\s+)?budget/i,
      action: 'show_budget',
      extractors: {}
    },
    {
      pattern: /(?:what'?s|show)\s+my\s+balance/i,
      action: 'show_balance',
      extractors: {}
    },
    {
      pattern: /set\s+(?:monthly\s+)?(.+)\s+budget\s+(?:to\s+)?(?:rs\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
      action: 'set_budget',
      extractors: {
        amount: (match) => parseFloat(match[2].replace(/,/g, '')),
        category: (match) => match[1].trim()
      }
    }
  ],
  si: [
    {
      pattern: /(.+)\s+සඳහා\s+රුපියල්\s+(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:ක\s+)?වියදම්\s+එකතු\s+කරන්න/i,
      action: 'add_expense',
      extractors: {
        amount: (match) => parseFloat(match[2].replace(/,/g, '')),
        category: (match) => match[1].trim()
      }
    },
    {
      pattern: /රුපියල්\s+(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(.+)\s+වියදම්\s+එකතු\s+කරන්න/i,
      action: 'add_expense',
      extractors: {
        amount: (match) => parseFloat(match[1].replace(/,/g, '')),
        category: (match) => match[2].trim()
      }
    },
    {
      pattern: /(?:මගේ\s+)?වියදම්\s+පෙන්වන්න/i,
      action: 'show_expenses',
      extractors: {}
    },
    {
      pattern: /(?:මගේ\s+)?අයවැය\s+පෙන්වන්න/i,
      action: 'show_budget',
      extractors: {}
    },
    {
      pattern: /මගේ\s+ශේෂය\s+(?:කීයද|පෙන්වන්න)/i,
      action: 'show_balance',
      extractors: {}
    },
    {
      pattern: /(?:මාසික\s+)?(.+)\s+අයවැය\s+රුපියල්\s+(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:ක්\s+)?සකසන්න/i,
      action: 'set_budget',
      extractors: {
        amount: (match) => parseFloat(match[2].replace(/,/g, '')),
        category: (match) => match[1].trim()
      }
    }
  ],
  ta: [
    {
      pattern: /(.+)\s*க்காக\s+(\d+(?:,\d{3})*(?:\.\d{2})?)\s*ரூபாய்\s+செலவு\s+சேர்க்க/i,
      action: 'add_expense',
      extractors: {
        amount: (match) => parseFloat(match[2].replace(/,/g, '')),
        category: (match) => match[1].trim()
      }
    },
    {
      pattern: /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*ரூபாய்\s+(.+)\s+செலவு\s+சேர்க்க/i,
      action: 'add_expense',
      extractors: {
        amount: (match) => parseFloat(match[1].replace(/,/g, '')),
        category: (match) => match[2].trim()
      }
    },
    {
      pattern: /(?:என்\s+)?செலவுகளை\s+காட்டு/i,
      action: 'show_expenses',
      extractors: {}
    },
    {
      pattern: /(?:என்\s+)?பட்ஜெட்\s+காட்டு/i,
      action: 'show_budget',
      extractors: {}
    },
    {
      pattern: /என்\s+இருப்பு\s+(?:என்ன|காட்டு)/i,
      action: 'show_balance',
      extractors: {}
    },
    {
      pattern: /(?:மாதாந்திர\s+)?(.+)\s+பட்ஜெட்\s+(\d+(?:,\d{3})*(?:\.\d{2})?)\s*ரூபாய்\s+அமை/i,
      action: 'set_budget',
      extractors: {
        amount: (match) => parseFloat(match[2].replace(/,/g, '')),
        category: (match) => match[1].trim()
      }
    }
  ]
};

// Category mappings for different languages
const categoryMappings = {
  en: {
    'food': ['food', 'dining', 'restaurant', 'grocery', 'meal', 'lunch', 'dinner', 'breakfast'],
    'transport': ['transport', 'travel', 'bus', 'taxi', 'fuel', 'petrol', 'car'],
    'utilities': ['utilities', 'electricity', 'water', 'internet', 'phone', 'mobile'],
    'education': ['education', 'school', 'tuition', 'books', 'course'],
    'healthcare': ['healthcare', 'medicine', 'doctor', 'hospital', 'medical'],
    'entertainment': ['entertainment', 'movie', 'game', 'fun', 'party'],
    'shopping': ['shopping', 'clothes', 'dress', 'shoe', 'bag'],
    'religious': ['temple', 'church', 'mosque', 'religious', 'donation']
  },
  si: {
    'food': ['ආහාර', 'කෑම', 'රස්ටුරන්ට්', 'ගිරොසරි', 'දිවා', 'රාත්‍රී', 'උදේ'],
    'transport': ['ප්‍රවාහන', 'ගමන්', 'බස්', 'ටැක්සි', 'ඉන්ධන', 'පෙට්‍රල්', 'මෝටර්'],
    'utilities': ['උපයෝගිතා', 'විදුලි', 'ජල', 'අන්තර්ජාල', 'දුරකථන'],
    'education': ['අධ්‍යාපන', 'පාසල', 'ගුරු', 'පොත්', 'පාඨමාලා'],
    'healthcare': ['සෞඛ්‍ය', 'ඖෂධ', 'වෛද්‍ය', 'රෝහල', 'වෛද්‍ය'],
    'entertainment': ['විනෝද', 'චිත්‍රපට', 'ක්‍රීඩා', 'සතුට', 'සාද'],
    'shopping': ['සාප්පු', 'ඇඳුම්', 'ගවුම', 'සපත්තු', 'බෑග්'],
    'religious': ['දේවාලය', 'පන්සල', 'කෝවිල්', 'ආගමික', 'දානය']
  },
  ta: {
    'food': ['உணவு', 'சாப்பாடு', 'உணவகம்', 'மளிகை', 'மதியம்', 'இரவு', 'காலை'],
    'transport': ['போக்குவரத்து', 'பயணம்', 'பேருந்து', 'டாக்ஸி', 'எரிபொருள்', 'பெட்ரோல்', 'கார்'],
    'utilities': ['பயன்பாடுகள்', 'மின்சாரம்', 'நீர்', 'இணையம்', 'தொலைபேசி'],
    'education': ['கல்வி', 'பள்ளி', 'ட்யூஷன்', 'புத்தகம்', 'பாடநெறி'],
    'healthcare': ['சுகாதாரம்', 'மருந்து', 'டாக்டர்', 'மருத்துவமனை', 'மருத்துவ'],
    'entertainment': ['பொழுதுபோக்கு', 'திரைப்படம்', 'விளையாட்டு', 'வேடிக்கை', 'விழா'],
    'shopping': ['ஷாப்பிங்', 'உடை', 'ஆடை', 'காலணி', 'பை'],
    'religious': ['கோவில்', 'தேவாலயம்', 'மசூதி', 'மத', 'நன்கொடை']
  }
};

// Detect language from text
export const detectLanguage = (text: string): string => {
  const sinhalaChars = /[\u0D80-\u0DFF]/;
  const tamilChars = /[\u0B80-\u0BFF]/;
  
  if (sinhalaChars.test(text)) return 'si';
  if (tamilChars.test(text)) return 'ta';
  return 'en';
};

// Normalize category name
export const normalizeCategory = (category: string, language: string): string => {
  const lowerCategory = category.toLowerCase();
  const mappings = categoryMappings[language as keyof typeof categoryMappings] || categoryMappings.en;
  
  for (const [standardCategory, variants] of Object.entries(mappings)) {
    if (variants.some(variant => lowerCategory.includes(variant.toLowerCase()))) {
      return standardCategory;
    }
  }
  
  return lowerCategory;
};

// Parse voice command
export const parseVoiceCommand = (transcript: string, detectedLanguage?: string): VoiceCommand | null => {
  const language = detectedLanguage || detectLanguage(transcript);
  const patterns = commandPatterns[language as keyof typeof commandPatterns] || commandPatterns.en;
  
  for (const pattern of patterns) {
    const match = transcript.match(pattern.pattern);
    if (match) {
      const command: VoiceCommand = {
        action: pattern.action,
        language,
        confidence: 0.8 // Base confidence for pattern match
      };
      
      // Extract amount if pattern has amount extractor
      if (pattern.extractors.amount) {
        command.amount = pattern.extractors.amount(match);
      }
      
      // Extract and normalize category if pattern has category extractor
      if (pattern.extractors.category) {
        const rawCategory = pattern.extractors.category(match);
        command.category = normalizeCategory(rawCategory, language);
      }
      
      return command;
    }
  }
  
  return null;
};

// Convert numbers written in words to digits (basic implementation)
export const convertWordsToNumbers = (text: string, language: string): string => {
  const numberWords = {
    en: {
      'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
      'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
      'twenty': '20', 'thirty': '30', 'forty': '40', 'fifty': '50',
      'hundred': '100', 'thousand': '1000'
    },
    si: {
      'එක': '1', 'දෙක': '2', 'තුන': '3', 'හතර': '4', 'පන්': '5',
      'හය': '6', 'හත': '7', 'අට': '8', 'නවය': '9', 'දහය': '10',
      'විස්ස': '20', 'තිස්': '30', 'හතළිස්': '40', 'පනහ': '50',
      'සිය': '100', 'දහස': '1000'
    },
    ta: {
      'ஒன்று': '1', 'இரண்டு': '2', 'மூன்று': '3', 'நான்கு': '4', 'ஐந்து': '5',
      'ஆறு': '6', 'ஏழு': '7', 'எட்டு': '8', 'ஒன்பது': '9', 'பத்து': '10',
      'இருபது': '20', 'முப்பது': '30', 'நாற்பது': '40', 'ஐம்பது': '50',
      'நூறு': '100', 'ஆயிரம்': '1000'
    }
  };
  
  const words = numberWords[language as keyof typeof numberWords] || numberWords.en;
  let result = text;
  
  Object.entries(words).forEach(([word, number]) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, number);
  });
  
  return result;
};

// Generate response for command
export const generateCommandResponse = (command: VoiceCommand): string => {
  const responses = {
    add_expense: {
      en: `Added expense of ${command.amount} rupees for ${command.category}`,
      si: `${command.category} සඳහා රුපියල් ${command.amount} ක වියදමක් එකතු කරන ලදී`,
      ta: `${command.category} க்காக ${command.amount} ரூபாய் செலவு சேர்க்கப்பட்டது`
    },
    show_expenses: {
      en: "Opening expenses page",
      si: "වියදම් පිටුව විවෘත කරමින්",
      ta: "செலவுகள் பக்கத்தை திறக்கிறது"
    },
    show_budget: {
      en: "Opening budget page",
      si: "අයවැය පිටුව විවෘත කරමින්",
      ta: "பட்ஜெட் பக்கத்தை திறக்கிறது"
    },
    show_balance: {
      en: "Showing current balance",
      si: "වර්තමාන ශේෂය පෙන්වමින්",
      ta: "தற்போதைய இருப்பைக் காட்டுகிறது"
    },
    set_budget: {
      en: `Set ${command.category} budget to ${command.amount} rupees`,
      si: `${command.category} අයවැය රුපියල් ${command.amount} ක් ලෙස සකසන ලදී`,
      ta: `${command.category} பட்ஜெட் ${command.amount} ரூபாய் என அமைக்கப்பட்டது`
    }
  };
  
  const actionResponses = responses[command.action as keyof typeof responses];
  if (actionResponses) {
    return actionResponses[command.language as keyof typeof actionResponses] || actionResponses.en;
  }
  
  return "Command processed / අණ සකසන ලදී / கட்டளை செயலாக்கப்பட்டது";
};