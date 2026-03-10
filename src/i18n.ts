import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from './locales/en/common.json';
import siCommon from './locales/si/common.json';
import taCommon from './locales/ta/common.json';

const resources = {
  en: {
    common: enCommon
  },
  si: {
    common: siCommon
  },
  ta: {
    common: taCommon
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    debug: import.meta.env.DEV,

    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'tracksy-language'
    },

    // Namespace configuration
    defaultNS: 'common',
    ns: ['common'],

    interpolation: {
      escapeValue: false // react already safes from xss
    },

    // Sri Lankan specific configurations
    supportedLngs: ['en', 'si', 'ta'],
    
    // Custom functions for Sri Lankan context
    react: {
      useSuspense: false
    }
  });

// Helper functions for Sri Lankan localization
export const getSriLankanGreeting = (language: string): string => {
  const greetings = {
    en: 'Welcome to Tracksy',
    si: 'ට්‍රැක්සි වෙත සාදරයෙන් පිළිගනිමු',
    ta: 'ட்ராக்ஸிக்கு வரவேற்கிறோம்'
  };
  return greetings[language as keyof typeof greetings] || greetings.en;
};

export const formatCurrency = (amount: number, language: string = 'en'): string => {
  const symbols = {
    en: 'Rs. ',
    si: 'රු. ',
    ta: 'ரூ. '
  };
  
  const symbol = symbols[language as keyof typeof symbols] || symbols.en;
  return `${symbol}${amount.toLocaleString()}`;
};

export const getLanguageNativeName = (code: string): string => {
  const names = {
    en: 'English',
    si: 'සිංහල',
    ta: 'தமிழ்'
  };
  return names[code as keyof typeof names] || code;
};

export const isRTL = (language: string): boolean => {
  // Neither Sinhala nor Tamil are RTL, but this function is useful for future expansion
  return false;
};

export const getVoiceLanguageCode = (appLanguage: string): string => {
  const voiceCodes = {
    en: 'en-US',
    si: 'si-LK',
    ta: 'ta-LK'
  };
  return voiceCodes[appLanguage as keyof typeof voiceCodes] || 'en-US';
};

export const getSupportedLanguages = () => {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' }
  ];
};

export default i18n;