import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  Tooltip
} from '@mui/material';
import {
  Mic,
  MicOff,
  VolumeUp,
  Language,
  Stop
} from '@mui/icons-material';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';

interface VoiceRecognitionProps {
  onVoiceCommand?: (command: string, language: string) => void;
  currentLanguage?: string;
  onLanguageChange?: (language: string) => void;
}

const VoiceRecognition: React.FC<VoiceRecognitionProps> = ({
  onVoiceCommand,
  currentLanguage = 'en',
  onLanguageChange
}) => {
  const [lastCommand, setLastCommand] = useState('');
  
  const { speak, isSpeaking, speakFinancialUpdate } = useTextToSpeech({
    language: currentLanguage
  });
  
  const {
    isListening,
    transcript,
    confidence,
    isSupported,
    startListening,
    stopListening,
    changeLanguage
  } = useVoiceRecognition({
    language: currentLanguage,
    continuous: false,
    onResult: (result) => {
      setLastCommand(result.transcript);
      if (onVoiceCommand) {
        onVoiceCommand(result.transcript, result.language);
      }
      
      // Provide voice feedback
      const confirmationPhrases = {
        en: "Command received",
        si: "අණ ලැබුණි",
        ta: "கட்டளை பெறப்பட்டது"
      };
      
      speak(confirmationPhrases[currentLanguage as keyof typeof confirmationPhrases] || confirmationPhrases.en);
    },
    onError: (error) => {
      console.error('Voice recognition error:', error);
    }
  });

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'si', name: 'සිංහල', flag: '🇱🇰' },
    { code: 'ta', name: 'தமிழ்', flag: '🇱🇰' }
  ];

  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode);
    if (onLanguageChange) {
      onLanguageChange(langCode);
    }
    
    // Announce language change
    const announcements = {
      en: "Language changed to English",
      si: "භාෂාව සිංහලට වෙනස් කර ඇත",
      ta: "மொழி தமிழுக்கு மாற்றப்பட்டது"
    };
    
    speak(announcements[langCode as keyof typeof announcements] || announcements.en, { language: langCode });
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const testVoiceOutput = () => {
    const testPhrases = {
      en: "Voice output is working correctly in English",
      si: "සිංහල භාෂාවෙන් කටහඬ ප්‍රතිදානය නිවැරදිව ක්‍රියා කරයි",
      ta: "தமிழில் குரல் வெளியீடு சரியாக வேலை செய்கிறது"
    };
    
    speak(testPhrases[currentLanguage as keyof typeof testPhrases] || testPhrases.en);
  };

  if (!isSupported) {
    return (
      <Alert severity="warning">
        Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.
      </Alert>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, m: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" component="h2">
          🎤 Voice Control / කටහඬ පාලනය / குரல் கட்டுப்பாடு
        </Typography>
        
        <Box display="flex" gap={1}>
          {languages.map((lang) => (
            <Tooltip key={lang.code} title={`Switch to ${lang.name}`}>
              <Chip
                icon={<Language />}
                label={`${lang.flag} ${lang.name}`}
                variant={currentLanguage === lang.code ? "filled" : "outlined"}
                color={currentLanguage === lang.code ? "primary" : "default"}
                onClick={() => handleLanguageChange(lang.code)}
                clickable
              />
            </Tooltip>
          ))}
        </Box>
      </Box>

      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Tooltip title={isListening ? "Stop listening" : "Start listening"}>
          <IconButton
            onClick={toggleListening}
            color={isListening ? "secondary" : "primary"}
            size="large"
            sx={{
              bgcolor: isListening ? 'error.light' : 'primary.light',
              '&:hover': {
                bgcolor: isListening ? 'error.main' : 'primary.main'
              }
            }}
          >
            {isListening ? <MicOff /> : <Mic />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Test voice output">
          <IconButton onClick={testVoiceOutput} disabled={isSpeaking}>
            <VolumeUp />
          </IconButton>
        </Tooltip>

        {isSpeaking && (
          <Tooltip title="Stop speaking">
            <IconButton onClick={() => window.speechSynthesis.cancel()}>
              <Stop />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {isListening && (
        <Box mb={2}>
          <LinearProgress color="secondary" />
          <Typography variant="body2" color="text.secondary" mt={1}>
            🎙️ Listening... / ඇසීම... / கேட்டுக்கொண்டிருக்கிறது...
          </Typography>
        </Box>
      )}

      {transcript && (
        <Box mb={2}>
          <Typography variant="subtitle2" color="primary">
            Current Input:
          </Typography>
          <Paper variant="outlined" sx={{ p: 1, bgcolor: 'grey.50' }}>
            <Typography variant="body1">{transcript}</Typography>
            {confidence > 0 && (
              <Typography variant="caption" color="text.secondary">
                Confidence: {Math.round(confidence * 100)}%
              </Typography>
            )}
          </Paper>
        </Box>
      )}

      {lastCommand && (
        <Box mb={2}>
          <Typography variant="subtitle2" color="success.main">
            Last Command:
          </Typography>
          <Paper variant="outlined" sx={{ p: 1, bgcolor: 'success.50' }}>
            <Typography variant="body1">{lastCommand}</Typography>
          </Paper>
        </Box>
      )}

      <Box>
        <Typography variant="subtitle2" mb={1}>
          Sample Voice Commands:
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {currentLanguage === 'en' && (
            <>
              <Chip label="Add expense 500 rupees for food" variant="outlined" size="small" />
              <Chip label="Show my budget" variant="outlined" size="small" />
              <Chip label="What's my balance?" variant="outlined" size="small" />
            </>
          )}
          {currentLanguage === 'si' && (
            <>
              <Chip label="ආහාර සඳහා රුපියල් පන්සිය වියදම් එකතු කරන්න" variant="outlined" size="small" />
              <Chip label="මගේ අයවැය පෙන්වන්න" variant="outlined" size="small" />
              <Chip label="මගේ ශේෂය කීයද?" variant="outlined" size="small" />
            </>
          )}
          {currentLanguage === 'ta' && (
            <>
              <Chip label="உணவுக்கு ஐநூறு ரூபாய் செலவு சேர்க்க" variant="outlined" size="small" />
              <Chip label="என் பட்ஜெட் காட்டு" variant="outlined" size="small" />
              <Chip label="என் இருப்பு என்ன?" variant="outlined" size="small" />
            </>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default VoiceRecognition;