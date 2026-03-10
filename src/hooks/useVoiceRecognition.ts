import { useState, useEffect, useCallback } from 'react';

interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  language: string;
}

interface UseVoiceRecognitionProps {
  language?: string;
  continuous?: boolean;
  onResult?: (result: VoiceRecognitionResult) => void;
  onError?: (error: string) => void;
}

export const useVoiceRecognition = ({
  language = 'en-US',
  continuous = false,
  onResult,
  onError
}: UseVoiceRecognitionProps = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  // Sri Lankan language mappings
  const languageMap = {
    'en': 'en-US',
    'si': 'si-LK', // Sinhala
    'ta': 'ta-LK'  // Tamil
  };

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognitionInstance = new SpeechRecognition();
      
      // Configure recognition
      recognitionInstance.continuous = continuous;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = languageMap[language as keyof typeof languageMap] || language;
      
      // Handle results
      recognitionInstance.onresult = (event) => {
        const lastResult = event.results[event.results.length - 1];
        const transcript = lastResult[0].transcript;
        const confidence = lastResult[0].confidence;
        
        setTranscript(transcript);
        setConfidence(confidence);
        
        if (onResult && lastResult.isFinal) {
          onResult({
            transcript,
            confidence,
            language: recognitionInstance.lang
          });
        }
      };
      
      // Handle errors
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        const errorMessages = {
          'no-speech': 'කිසිදු කථනයක් අසුණුවී නැත / எந்த பேச்சும் கேட்கவில்லை / No speech detected',
          'audio-capture': 'මයික්‍රොෆෝනය ප්‍රවේශ විය නොහැක / மைக்ரோஃபோன் அணுக முடியவில்லை / Microphone access denied',
          'not-allowed': 'කථන හඳුනාගැනීමට අවසර නැත / பேச்சு அங்கீகாரத்திற்கு அனுமதி இல்லை / Speech recognition not allowed'
        };
        
        if (onError) {
          onError(errorMessages[event.error as keyof typeof errorMessages] || event.error);
        }
      };
      
      // Handle start/end events
      recognitionInstance.onstart = () => setIsListening(true);
      recognitionInstance.onend = () => setIsListening(false);
      
      setRecognition(recognitionInstance);
    } else {
      console.warn('Speech recognition not supported in this browser');
      setIsSupported(false);
    }
    
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [language, continuous, onResult, onError]);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      setTranscript('');
      setConfidence(0);
      recognition.start();
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
    }
  }, [recognition, isListening]);

  const changeLanguage = useCallback((newLanguage: string) => {
    if (recognition) {
      const wasListening = isListening;
      if (wasListening) {
        recognition.stop();
      }
      
      recognition.lang = languageMap[newLanguage as keyof typeof languageMap] || newLanguage;
      
      if (wasListening) {
        setTimeout(() => recognition.start(), 100);
      }
    }
  }, [recognition, isListening]);

  return {
    isListening,
    transcript,
    confidence,
    isSupported,
    startListening,
    stopListening,
    changeLanguage
  };
};