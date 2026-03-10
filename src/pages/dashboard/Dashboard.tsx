import React, { useState } from 'react';
import { Container, Box, Button, Typography, Paper } from '@mui/material';
import FinancialInsightsDashboard from '../../components/insights/FinancialInsightsDashboard';

const Dashboard: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = currentLanguage === 'si' ? 'si-LK' : currentLanguage === 'ta' ? 'ta-LK' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('Listening...');
      };

      recognition.onresult = (event) => {
        const result = event.results[0][0].transcript;
        setTranscript(result);
        console.log('Voice input:', result);
        
        // Simple voice feedback
        const utterance = new SpeechSynthesisUtterance('Command received');
        utterance.lang = recognition.lang;
        window.speechSynthesis.speak(utterance);
      };

      recognition.onerror = () => {
        setTranscript('Error occurred');
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert('Speech recognition not supported in this browser');
    }
  };

  const changeLanguage = (lang: string) => {
    setCurrentLanguage(lang);
    const announcements = {
      en: 'Language changed to English',
      si: 'භාෂාව සිංහලට වෙනස් කරන ලදී',
      ta: 'மொழி தமிழுக்கு மாற்றப்பட்டது'
    };
    
    const utterance = new SpeechSynthesisUtterance(announcements[lang as keyof typeof announcements]);
    utterance.lang = lang === 'si' ? 'si-LK' : lang === 'ta' ? 'ta-LK' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Simple Voice Control */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            🎤 Voice Control / කටහඬ පාලනය / குரல் கட்டுப்பாடு
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Button 
              variant={currentLanguage === 'en' ? 'contained' : 'outlined'}
              onClick={() => changeLanguage('en')}
              sx={{ mr: 1 }}
            >
              🇺🇸 English
            </Button>
            <Button 
              variant={currentLanguage === 'si' ? 'contained' : 'outlined'}
              onClick={() => changeLanguage('si')}
              sx={{ mr: 1 }}
            >
              🇱🇰 සිංහල
            </Button>
            <Button 
              variant={currentLanguage === 'ta' ? 'contained' : 'outlined'}
              onClick={() => changeLanguage('ta')}
            >
              🇱🇰 தமிழ்
            </Button>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              color={isListening ? 'secondary' : 'primary'}
              onClick={startVoiceRecognition}
              disabled={isListening}
              size="large"
            >
              {isListening ? '🎙️ Listening...' : '🎤 Start Voice Input'}
            </Button>
          </Box>

          {transcript && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="body1">{transcript}</Typography>
            </Paper>
          )}

          <Typography variant="caption" display="block" sx={{ mt: 2 }}>
            Try saying: "Add expense 500 rupees for food" | "ආහාර සඳහා රුපියල් පන්සිය" | "உணவுக்கு ஐநூறு ரூபாய்"
          </Typography>
        </Paper>

        <FinancialInsightsDashboard />
      </Box>
    </Container>
  );
};

export default Dashboard;