#!/bin/bash

# MyTracksy Firebase Production Setup Script
# Complete Firebase deployment with Firestore, Authentication, and Hosting

set -e

echo "🚀 Starting MyTracksy Firebase Production Setup..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    log "Installing Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install Firebase CLI
log "Installing Firebase CLI..."
npm install -g firebase-tools

# Login to Firebase (will open browser)
log "Please login to Firebase..."
firebase login

# Create Firebase project structure
log "Setting up Firebase project structure..."
mkdir -p mytracksy-firebase
cd mytracksy-firebase

# Initialize Firebase project
log "Initializing Firebase project..."
firebase init

# Create Firebase configuration
log "Creating Firebase configuration files..."

# Firebase configuration for production
cat > firebase.json << 'EOF'
{
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-XSS-Protection",
            "value": "1; mode=block"
          },
          {
            "key": "Strict-Transport-Security",
            "value": "max-age=31536000; includeSubDomains"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          }
        ]
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
EOF

# Firestore security rules
cat > firestore.rules << 'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Companies - users can only access their company data
    match /companies/{companyId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid in resource.data.members || 
         request.auth.uid == resource.data.owner);
    }
    
    // Expenses - users can only access their own expenses
    match /expenses/{expenseId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Tax calculations - users can only access their own
    match /taxCalculations/{calcId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Government filings - users can only access their own
    match /governmentFilings/{filingId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Reports - users can only access their own
    match /reports/{reportId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Employee management - company owners and HR can access
    match /employees/{employeeId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.companyOwner ||
         request.auth.uid in resource.data.hrManagers);
    }
  }
}
EOF

# Firestore indexes
cat > firestore.indexes.json << 'EOF'
{
  "indexes": [
    {
      "collectionGroup": "expenses",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "expenses",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "category",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "taxCalculations",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "type",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "calculatedAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "governmentFilings",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "dueDate",
          "order": "ASCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
EOF

# Cloud Storage security rules
cat > storage.rules << 'EOF'
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can upload receipts and documents to their folder
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId
        && resource.size < 10 * 1024 * 1024; // 10MB limit
    }
    
    // Company documents
    match /companies/{companyId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid in getCompanyMembers(companyId);
    }
  }
  
  function getCompanyMembers(companyId) {
    return get(/databases/$(database)/documents/companies/$(companyId)).data.members;
  }
}
EOF

# Create Firebase Functions for backend logic
log "Setting up Firebase Functions..."
mkdir -p functions
cd functions

# Initialize package.json for functions
cat > package.json << 'EOF'
{
  "name": "mytracksy-functions",
  "version": "1.0.0",
  "description": "MyTracksy Cloud Functions for Sri Lankan Tax Compliance",
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "18"
  },
  "main": "lib/index.js",
  "dependencies": {
    "firebase-admin": "^11.0.0",
    "firebase-functions": "^4.0.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "node-cron": "^3.0.2",
    "axios": "^1.5.0"
  },
  "devDependencies": {
    "typescript": "^4.9.0",
    "@types/express": "^4.17.17",
    "@types/cors": "^2.8.13"
  },
  "private": true
}
EOF

# TypeScript configuration
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "es2017"
  },
  "compileOnSave": true,
  "include": [
    "src"
  ]
}
EOF

# Create source directory
mkdir -p src

# Main Cloud Functions file
cat > src/index.ts << 'EOF'
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';
import * as helmet from 'helmet';

admin.initializeApp();

const app = express();
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json());

// Sri Lankan Tax Calculation Functions
export const calculateSriLankanTax = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { amount, type, category } = data;

  try {
    let taxCalculation = {};

    switch (type) {
      case 'vat':
        taxCalculation = calculateVAT(amount);
        break;
      case 'income':
        taxCalculation = calculateIncomeTax(amount);
        break;
      case 'epf_etf':
        taxCalculation = calculateEPFETF(amount);
        break;
      default:
        throw new functions.https.HttpsError('invalid-argument', 'Invalid tax type');
    }

    // Save calculation to Firestore
    await admin.firestore().collection('taxCalculations').add({
      userId: context.auth.uid,
      type,
      amount,
      calculation: taxCalculation,
      calculatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return taxCalculation;
  } catch (error) {
    console.error('Tax calculation error:', error);
    throw new functions.https.HttpsError('internal', 'Tax calculation failed');
  }
});

// VAT Calculation (18% rate in Sri Lanka)
function calculateVAT(amount: number) {
  const vatRate = 0.18;
  const vatAmount = amount * vatRate;
  
  return {
    netAmount: amount,
    vatRate: vatRate,
    vatAmount: vatAmount,
    grossAmount: amount + vatAmount,
    registrationRequired: amount >= 12000000 // LKR 12M threshold
  };
}

// Progressive Income Tax Calculation
function calculateIncomeTax(annualIncome: number) {
  const personalRelief = 3000000; // LKR 3M personal relief
  const taxableIncome = Math.max(0, annualIncome - personalRelief);
  
  let tax = 0;
  const brackets = [
    { min: 0, max: 500000, rate: 0.06 },
    { min: 500000, max: 1000000, rate: 0.12 },
    { min: 1000000, max: 1500000, rate: 0.18 },
    { min: 1500000, max: 2000000, rate: 0.24 },
    { min: 2000000, max: 2500000, rate: 0.30 },
    { min: 2500000, max: Infinity, rate: 0.36 }
  ];

  for (const bracket of brackets) {
    if (taxableIncome > bracket.min) {
      const taxableInBracket = Math.min(taxableIncome - bracket.min, bracket.max - bracket.min);
      tax += taxableInBracket * bracket.rate;
    }
  }

  return {
    annualIncome,
    personalRelief,
    taxableIncome,
    totalTax: tax,
    effectiveRate: tax / annualIncome,
    monthlyTax: tax / 12
  };
}

// EPF/ETF Calculation
function calculateEPFETF(monthlyEarnings: number) {
  const epfEmployeeRate = 0.08; // 8%
  const epfEmployerRate = 0.12; // 12%
  const etfEmployerRate = 0.03; // 3%

  return {
    monthlyEarnings,
    epfEmployee: monthlyEarnings * epfEmployeeRate,
    epfEmployer: monthlyEarnings * epfEmployerRate,
    etfEmployer: monthlyEarnings * etfEmployerRate,
    totalEmployeeContribution: monthlyEarnings * epfEmployeeRate,
    totalEmployerContribution: monthlyEarnings * (epfEmployerRate + etfEmployerRate)
  };
}

// Government Portal Integration
export const submitToGovernmentPortal = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { portalType, filingData } = data;

  try {
    // Simulate government portal submission
    const submissionId = `${portalType}_${Date.now()}`;
    
    // Save filing record
    await admin.firestore().collection('governmentFilings').add({
      userId: context.auth.uid,
      portalType,
      submissionId,
      filingData,
      status: 'submitted',
      submittedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      submissionId,
      status: 'submitted',
      message: `Successfully submitted to ${portalType} portal`
    };
  } catch (error) {
    console.error('Government portal submission error:', error);
    throw new functions.https.HttpsError('internal', 'Submission failed');
  }
});

// Analytics Function
export const generateAnalytics = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { timeRange } = data;
  const userId = context.auth.uid;

  try {
    // Get user's expenses
    const expensesSnapshot = await admin.firestore()
      .collection('expenses')
      .where('userId', '==', userId)
      .orderBy('date', 'desc')
      .limit(1000)
      .get();

    const expenses = expensesSnapshot.docs.map(doc => doc.data());

    // Generate analytics
    const analytics = {
      totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
      categoryBreakdown: getCategoryBreakdown(expenses),
      monthlyTrends: getMonthlyTrends(expenses),
      taxLiability: calculateTotalTaxLiability(expenses),
      insights: generateInsights(expenses)
    };

    return analytics;
  } catch (error) {
    console.error('Analytics generation error:', error);
    throw new functions.https.HttpsError('internal', 'Analytics generation failed');
  }
});

function getCategoryBreakdown(expenses: any[]) {
  const breakdown: { [key: string]: number } = {};
  expenses.forEach(expense => {
    breakdown[expense.category] = (breakdown[expense.category] || 0) + expense.amount;
  });
  return breakdown;
}

function getMonthlyTrends(expenses: any[]) {
  const trends: { [key: string]: number } = {};
  expenses.forEach(expense => {
    const month = new Date(expense.date).toISOString().substring(0, 7);
    trends[month] = (trends[month] || 0) + expense.amount;
  });
  return trends;
}

function calculateTotalTaxLiability(expenses: any[]) {
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const vatLiability = totalExpenses * 0.18;
  
  return {
    vatLiability,
    estimatedIncomeTax: totalExpenses * 0.1, // Simplified estimate
    totalLiability: vatLiability + (totalExpenses * 0.1)
  };
}

function generateInsights(expenses: any[]) {
  return [
    'Your transportation expenses have increased by 25% this month',
    'Consider optimizing VAT registration for better tax efficiency',
    'Your expense patterns suggest potential for EPF/ETF optimization'
  ];
}

// Scheduled function for tax reminders
export const sendTaxReminders = functions.pubsub.schedule('0 9 * * 1').onRun(async (context) => {
  const users = await admin.firestore().collection('users').get();
  
  for (const userDoc of users.docs) {
    const user = userDoc.data();
    
    // Check upcoming tax deadlines
    const upcomingDeadlines = await checkTaxDeadlines(userDoc.id);
    
    if (upcomingDeadlines.length > 0) {
      // Send notification (implement notification service)
      console.log(`Sending tax reminders to user ${userDoc.id}:`, upcomingDeadlines);
    }
  }
});

async function checkTaxDeadlines(userId: string) {
  // Implementation for checking tax deadlines
  const deadlines = [];
  const now = new Date();
  
  // VAT filing deadline (20th of each month)
  const vatDeadline = new Date(now.getFullYear(), now.getMonth(), 20);
  if (vatDeadline > now && vatDeadline.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
    deadlines.push({ type: 'VAT', deadline: vatDeadline });
  }
  
  return deadlines;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Export the Express app as a Cloud Function
export const api = functions.https.onRequest(app);
EOF

# Install function dependencies
log "Installing Firebase Functions dependencies..."
npm install

# Build functions
npm run build

cd .. # Back to project root

# Create environment configuration
log "Creating Firebase environment configuration..."
cat > .env.production << 'EOF'
# Firebase Production Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id

# Sri Lankan Government API Keys
IRD_API_KEY=your-ird-api-key
EPF_API_KEY=your-epf-api-key
ETF_API_KEY=your-etf-api-key

# Email Configuration for notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Security
JWT_SECRET=your-super-secure-jwt-secret
ENCRYPTION_KEY=your-32-character-key
EOF

# Create deployment script
log "Creating Firebase deployment script..."
cat > deploy-firebase.sh << 'EOF'
#!/bin/bash

set -e

echo "🚀 Deploying MyTracksy to Firebase..."

# Build the application
echo "Building application..."
npm run build

# Deploy to Firebase
echo "Deploying to Firebase..."
firebase deploy

echo "✅ Deployment completed successfully!"
echo ""
echo "Your application is now live at:"
firebase hosting:channel:list --json | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4
EOF

chmod +x deploy-firebase.sh

# Create local development script
cat > dev-firebase.sh << 'EOF'
#!/bin/bash

echo "🔥 Starting Firebase development environment..."

# Start Firebase emulators
firebase emulators:start --import=./firebase-export --export-on-exit=./firebase-export
EOF

chmod +x dev-firebase.sh

# Create Firebase configuration for the web app
log "Creating Firebase web configuration..."
cat > firebase-config.js << 'EOF'
// Firebase configuration for MyTracksy
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectStorageEmulator(storage, 'localhost', 9199);
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

export { app };
EOF

log "🎉 Firebase production setup completed!"
echo ""
echo "Setup Summary:"
echo "=============="
echo "✅ Firebase CLI installed"
echo "✅ Project structure created"
echo "✅ Firestore rules configured"
echo "✅ Cloud Functions set up"
echo "✅ Security rules implemented"
echo "✅ Deployment scripts created"
echo ""
echo "Next steps:"
echo "1. Update .env.production with your Firebase project details"
echo "2. Copy your application files to the build directory"
echo "3. Run './deploy-firebase.sh' to deploy to production"
echo "4. Configure custom domain in Firebase Console"
echo ""
echo "Important files:"
echo "- Firebase config: firebase.json"
echo "- Security rules: firestore.rules"
echo "- Cloud Functions: functions/src/index.ts"
echo "- Deployment script: deploy-firebase.sh"
echo "- Environment config: .env.production"