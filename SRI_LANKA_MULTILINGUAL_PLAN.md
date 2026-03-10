# Tracksy Sri Lanka - Multilingual Voice-Enabled Finance App

## 🇱🇰 Project Overview

Transform Tracksy into a comprehensive Sri Lankan personal finance application supporting all three official languages with full voice capabilities.

## 🗣️ Language Support

### Supported Languages
1. **සිංහල (Sinhala)** - Primary script, left-to-right
2. **தமிழ் (Tamil)** - Primary script, left-to-right  
3. **English** - Latin script, left-to-right

### Language Implementation Strategy
- **i18n Framework**: React-i18next for internationalization
- **Font Support**: Unicode fonts for Sinhala and Tamil scripts
- **Voice Support**: Web Speech API with language-specific recognition
- **Cultural Adaptation**: Local number formats, currency, and conventions

## 🎤 Voice Features

### Voice Recognition (Speech-to-Text)
- **Expense Entry**: "Add expense fifty rupees for rice and curry"
- **Budget Setting**: "Set food budget five thousand rupees monthly"
- **Data Queries**: "How much did I spend on transport this month?"
- **Navigation**: "Go to expenses page" / "Show dashboard"

### Text-to-Speech (Voice Output)
- **Balance Announcements**: "Your current balance is twenty-five thousand rupees"
- **Expense Confirmations**: "Added expense of three hundred rupees for fuel"
- **Budget Alerts**: "Warning: You've exceeded your food budget by fifteen percent"
- **Report Summaries**: Voice-read monthly expense reports

### Voice Commands in Local Languages

#### Sinhala Voice Commands
```
"වියදම් එකතු කරන්න" - Add expense
"අයවැය පෙන්වන්න" - Show budget
"මාසික වාර්තාව කියන්න" - Read monthly report
"ආදායම් පිටුවට යන්න" - Go to income page
```

#### Tamil Voice Commands
```
"செலவு சேர்க்க" - Add expense  
"பட்ஜெட் காட்டு" - Show budget
"மாதாந்திர அறிக்கை படி" - Read monthly report
"வருமானம் பக்கத்திற்கு செல்" - Go to income page
```

#### English Voice Commands
```
"Add expense" - Add expense
"Show budget" - Show budget
"Read monthly report" - Read monthly report
"Go to income page" - Go to income page
```

## 💰 Sri Lankan Localization

### Currency & Financial Features
- **Primary Currency**: LKR (Sri Lankan Rupees)
- **Number Format**: 1,00,000.00 (Lankan numbering system)
- **Banking Integration**: Local bank APIs (BOC, Commercial Bank, etc.)
- **Mobile Payment**: Integration with eZ Cash, mCash, KOKO

### Local Categories
```typescript
const sriLankanCategories = {
  food: {
    en: "Food & Dining",
    si: "ආහාර සහ ආපනශාලා",
    ta: "உணவு மற்றும் உணவருந்துதல்"
  },
  transport: {
    en: "Transport",
    si: "ප්‍රවාහන",
    ta: "போக்குவரத்து"
  },
  utilities: {
    en: "Utilities (Electricity/Water)",
    si: "උපයෝගිතා (විදුලි/ජල)",
    ta: "பயன்பாடுகள் (மின்சாரம்/நீர்)"
  },
  education: {
    en: "Education & Tuition",
    si: "අධ්‍යාපනය සහ ජේනේරොයි",
    ta: "கல்வி மற்றும் ட்யூஷன்"
  },
  healthcare: {
    en: "Healthcare & Medicine",
    si: "සෞඛ්‍ය සේවා සහ ඖෂධ",
    ta: "சுகாதாரம் மற்றும் மருந்து"
  },
  religious: {
    en: "Religious & Temple",
    si: "ආගමික සහ දේවාලය",
    ta: "மத மற்றும் கோவில்"
  }
};
```

## 🏗️ Technical Architecture

### Frontend Structure
```
src/
├── i18n/
│   ├── locales/
│   │   ├── en.json
│   │   ├── si.json
│   │   └── ta.json
│   └── index.ts
├── components/
│   ├── voice/
│   │   ├── VoiceRecognition.tsx
│   │   ├── TextToSpeech.tsx
│   │   └── VoiceCommands.tsx
│   ├── language/
│   │   ├── LanguageSwitcher.tsx
│   │   └── CurrencyFormatter.tsx
│   └── sri-lanka/
│       ├── BankingIntegration.tsx
│       ├── MobilePayment.tsx
│       └── LocalCategories.tsx
├── hooks/
│   ├── useVoiceRecognition.ts
│   ├── useTextToSpeech.ts
│   └── useLanguage.ts
└── utils/
    ├── speechUtils.ts
    ├── currencyUtils.ts
    └── languageUtils.ts
```

### Voice Technology Stack
- **Speech Recognition**: Web Speech API with fallback to Google Speech API
- **Text-to-Speech**: Web Speech API with SSML support
- **Language Detection**: Automatic language detection for voice input
- **Offline Support**: Local speech models for basic commands

## 🎯 Implementation Phases

### Phase 1: Multilingual Foundation (Week 1-2)
- [ ] Set up React-i18next framework
- [ ] Create translation files for all three languages
- [ ] Implement language switcher component
- [ ] Add Unicode font support for Sinhala/Tamil
- [ ] Test UI in all languages

### Phase 2: Voice Recognition (Week 3-4)
- [ ] Implement Web Speech API integration
- [ ] Create voice recognition hook
- [ ] Add language-specific speech recognition
- [ ] Build voice command parser
- [ ] Test voice input in all languages

### Phase 3: Text-to-Speech (Week 5-6)
- [ ] Implement TTS functionality
- [ ] Add voice feedback for user actions
- [ ] Create natural language response generator
- [ ] Test voice output quality in all languages
- [ ] Optimize speech timing and clarity

### Phase 4: Sri Lankan Features (Week 7-8)
- [ ] Add LKR currency formatting
- [ ] Implement local banking categories
- [ ] Create Sri Lankan financial templates
- [ ] Add mobile payment integration
- [ ] Test with local user scenarios

### Phase 5: Testing & Optimization (Week 9-10)
- [ ] User testing with native speakers
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Bug fixes and refinements
- [ ] Documentation and training materials

## 📱 User Experience Features

### Accessibility
- **Voice Navigation**: Complete app navigation via voice
- **Screen Reader**: Enhanced screen reader support
- **Large Text**: Scalable text for visually impaired users
- **High Contrast**: Theme options for better visibility

### Cultural Adaptations
- **Calendar Systems**: Gregorian and local calendar support
- **Number Systems**: Lankan lakhs/crores formatting
- **Religious Events**: Budget templates for festivals
- **Regional Variations**: Dialect-aware voice recognition

### Offline Capabilities
- **Local Storage**: Full offline data storage
- **Voice Cache**: Cached voice models for common commands
- **Sync**: Auto-sync when connection restored
- **Export**: PDF reports in selected language

## 🔧 Voice Command Examples

### Expense Tracking
```javascript
// English
"Add expense two hundred rupees for lunch"
"Record transport cost fifty rupees"

// Sinhala  
"දිවා ආහාරය සඳහා රුපියල් දෙසිය වියදම් එකතු කරන්න"
"ප්‍රවාහන වියදම රුපියල් පනහ ලියාපදිංචි කරන්න"

// Tamil
"மதிய உணவுக்கு இருநூறு ரூபாய் செலவு சேர்க்க"
"போக்குவரத்து செலவு ஐம்பது ரூபாய் பதிவு செய்"
```

### Budget Management
```javascript
// English
"Set monthly food budget five thousand rupees"
"Check remaining transport budget"

// Sinhala
"මාසික ආහාර අයවැය රුපියල් පන්දහසක් සකසන්න"
"ඉතිරි ප්‍රවාහන අයවැය පරීක්ෂා කරන්න"

// Tamil  
"மாதாந்திர உணவு பட்ஜெட் ஐயாயிரம் ரூபாய் அமை"
"மீதமுள்ள போக்குவரத்து பட்ஜெட் சரிபார்"
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Modern browser with Web Speech API support
- Microphone access permission
- Internet connection for initial setup

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd tracksy-sri-lanka

# Install dependencies
npm install

# Install additional language packages
npm install react-i18next i18next-browser-languagedetector
npm install @mui/material @emotion/react @emotion/styled

# Start development server
npm run dev
```

### Environment Variables
```env
VITE_GOOGLE_SPEECH_API_KEY=your_api_key
VITE_BANKING_API_URL=sri_lanka_banking_api
VITE_MOBILE_PAYMENT_API=mobile_payment_api
```

## 📊 Success Metrics

### Language Adoption
- [ ] 90%+ accurate voice recognition in all three languages
- [ ] Natural voice output with proper pronunciation
- [ ] Complete UI translation coverage
- [ ] Cultural appropriateness validation

### Voice Features
- [ ] <2 second response time for voice commands
- [ ] 95%+ command recognition accuracy
- [ ] Offline basic functionality
- [ ] Hands-free expense entry

### User Engagement
- [ ] User preference for voice vs manual entry
- [ ] Language switching frequency
- [ ] Voice feature usage statistics
- [ ] User satisfaction ratings

## 🛣️ Future Enhancements

### Advanced Features
- **AI Assistant**: Natural conversation about finances
- **Smart Categorization**: Auto-categorize expenses via voice description
- **Financial Advice**: Voice-delivered personalized financial tips
- **Integration**: Voice banking with local financial institutions

### Regional Expansion
- **Indian Market**: Hindi/Regional language support
- **Southeast Asia**: Thai, Malay, Indonesian languages
- **Global**: Major world languages support

---

**Project Timeline**: 10 weeks  
**Target Market**: Sri Lankan users (Sinhala, Tamil, English speakers)  
**Unique Value**: First fully voice-enabled multilingual finance app for Sri Lanka  
**Technology**: React + TypeScript + Web Speech API + i18next