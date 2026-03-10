import { useState, useCallback, useEffect } from 'react';

interface TextToSpeechOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export const useTextToSpeech = (options: TextToSpeechOptions = {}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Sri Lankan language voice mappings
  const languageVoiceMap = {
    'en': 'en-US',
    'si': 'si-LK',
    'ta': 'ta-LK'
  };

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      };
      
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = useCallback((text: string, customOptions?: TextToSpeechOptions) => {
    if (!isSupported || !text.trim()) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const finalOptions = { ...options, ...customOptions };

    // Set language
    const targetLang = languageVoiceMap[finalOptions.language as keyof typeof languageVoiceMap] || finalOptions.language || 'en-US';
    utterance.lang = targetLang;

    // Find appropriate voice for language
    const voice = voices.find(v => v.lang.startsWith(targetLang.split('-')[0])) || voices[0];
    if (voice) {
      utterance.voice = voice;
    }

    // Set speech parameters
    utterance.rate = finalOptions.rate || 0.9;
    utterance.pitch = finalOptions.pitch || 1;
    utterance.volume = finalOptions.volume || 0.8;

    // Event handlers
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isSupported, voices, options]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  const pause = useCallback(() => {
    if (isSupported && isSpeaking) {
      window.speechSynthesis.pause();
    }
  }, [isSupported, isSpeaking]);

  const resume = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.resume();
    }
  }, [isSupported]);

  // Predefined Sri Lankan finance phrases
  const speakFinancialUpdate = useCallback((type: string, amount: number, category: string, language: string = 'en') => {
    const phrases = {
      'expense_added': {
        en: `Added expense of ${amount} rupees for ${category}`,
        si: `${category} සඳහා රුපියල් ${amount} ක වියදමක් එකතු කරන ලදී`,
        ta: `${category} க்காக ${amount} ரூபாய் செலவு சேர்க்கப்பட்டது`
      },
      'budget_warning': {
        en: `Warning: You have exceeded your ${category} budget`,
        si: `අවවාදය: ඔබ ඔබගේ ${category} අයවැය ඉක්මවා ගොස් ඇත`,
        ta: `எச்சரிக்கை: நீங்கள் உங்கள் ${category} பட்ஜெட்டை மீறிவிட்டீர்கள்`
      },
      'balance_update': {
        en: `Your current balance is ${amount} rupees`,
        si: `ඔබගේ වර්තමාන ශේෂය රුපියල් ${amount} කි`,
        ta: `உங்கள் தற்போதைய இருப்பு ${amount} ரூபாய்`
      }
    };

    const phrase = phrases[type as keyof typeof phrases]?.[language as keyof typeof phrases['expense_added']];
    if (phrase) {
      speak(phrase, { language });
    }
  }, [speak]);

  return {
    speak,
    stop,
    pause,
    resume,
    speakFinancialUpdate,
    isSpeaking,
    isSupported,
    voices
  };
};