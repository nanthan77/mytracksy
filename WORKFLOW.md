# 🚀 MyTracksy Development Workflow Guide

## 📋 Overview

This document outlines the complete development, deployment, and troubleshooting workflow for the MyTracksy Personal Finance Intelligence Platform.

## 🏗️ Project Architecture

### **Technology Stack**
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: Firebase Firestore
- **Hosting**: Firebase Hosting
- **CI/CD**: GitHub Actions
- **Version Control**: Git/GitHub

### **Core Features**
- Personal Income Tax Calculator (Sri Lankan 2024/2025)
- Expense Tracking & Management
- Company Dashboard Integration
- Voice Input Capabilities
- Smart Financial Insights
- PDF Report Generation

## 🔄 Development Workflow

### **1. Local Development Setup**

```bash
# Clone repository
git clone https://github.com/nanthan77/mytracksy.git
cd mytracksy

# Install dependencies (if applicable)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set up local development
firebase init hosting
```

### **2. Code Development Process**

#### **File Structure**
```
build/
├── index.html                      # Landing page
├── user-profile.html              # Main dashboard with tax calculator
├── login.html                     # Authentication
├── individual-dashboard.html      # Personal finance dashboard
├── comprehensive-income-tax-calculator.js  # Tax calculation engine
├── behavioral-engagement-system.js # User engagement system
├── tax-management-system.js       # Tax management utilities
├── firebase.json                  # Firebase configuration
├── .github/workflows/firebase-deploy.yml  # CI/CD pipeline
└── firestore/
    ├── firestore.rules            # Database security rules
    └── firestore.indexes.json     # Database indexes
```

#### **Key Development Areas**

**Tax Calculator (`user-profile.html` + `comprehensive-income-tax-calculator.js`)**
- Progressive tax brackets: 6%, 12%, 18%, 24%, 30%, 36%
- Personal relief: LKR 3,000,000
- Real-time calculation on input
- Inline event handlers: `oninput="calculateTaxNow()"`

**Core Function Implementation**
```javascript
// Global function definition
window.calculateTaxNow = function calculateTaxNow() {
    // Tax calculation logic
    // Progressive bracket implementation
    // Real-time UI updates
};
```

### **3. Testing Workflow**

#### **Local Testing**
```bash
# Start local server
python3 -m http.server 8000
# OR
firebase serve --only hosting

# Access locally
http://localhost:8000/user-profile.html
```

#### **Testing Checklist**
- [ ] Tax calculator responds to input
- [ ] Progressive tax brackets calculate correctly
- [ ] Personal relief applied (LKR 3M)
- [ ] Monthly tax calculation works
- [ ] Console shows no JavaScript errors
- [ ] All input fields have event handlers

### **4. Git Workflow**

#### **Branch Strategy**
```bash
# Main development branch
git checkout main

# Feature development
git checkout -b feature/tax-calculator-fixes
git add .
git commit -m "feat: implement real-time tax calculation"
git push origin feature/tax-calculator-fixes

# Merge to main
git checkout main
git merge feature/tax-calculator-fixes
git push origin main
```

#### **Commit Message Format**
```bash
git commit -m "$(cat <<'EOF'
[type]: [description]

- [specific change 1]
- [specific change 2]
- [specific change 3]

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Types**: feat, fix, docs, style, refactor, test, chore

## 🚀 Deployment Process

### **Automatic Deployment**

#### **GitHub Actions Workflow** (`.github/workflows/firebase-deploy.yml`)

```yaml
name: Deploy MyTracksy to Firebase

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:
  FIREBASE_PROJECT_ID: tracksy-8e30c

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - name: 🚀 Checkout code
      uses: actions/checkout@v4
      
    - name: 🔍 Validate Firebase configuration
      run: |
        echo "✅ Validating firebase.json..."
        if [ -f firebase.json ]; then
          echo "firebase.json found"
          cat firebase.json
        else
          echo "❌ firebase.json not found"
          exit 1
        fi
        
    - name: 🚀 Deploy to Firebase using Official Action
      uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: '${{ secrets.GITHUB_TOKEN }}'
        firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
        projectId: '${{ env.FIREBASE_PROJECT_ID }}'
        channelId: live
```

#### **Deployment Triggers**
- **Automatic**: Push to `main` branch
- **Manual**: GitHub Actions web interface
- **Local**: `firebase deploy`

### **Firebase Configuration** (`firebase.json`)

```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**",
      "**/*.sh",
      "**/*.cjs",
      "**/*.md"
    ],
    "rewrites": [
      {
        "source": "/",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.html",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      }
    ]
  }
}
```

**Important**: Avoid wildcard rewrites (`"source": "**"`) that redirect all pages to index.html.

### **Manual Deployment**

```bash
# Login to Firebase
firebase login

# Deploy to production
firebase deploy --project tracksy-8e30c

# Deploy specific targets
firebase deploy --only hosting --project tracksy-8e30c
firebase deploy --only firestore:rules --project tracksy-8e30c
```

## 🔧 Troubleshooting Guide

### **Common Issues & Solutions**

#### **1. Tax Calculator Not Working**

**Symptoms:**
- Input fields don't trigger calculations
- Console errors: "calculateTaxNow is not defined"
- Values show LKR 0 despite input

**Debugging Steps:**
```javascript
// Check function accessibility
console.log(typeof window.calculateTaxNow); // Should be "function"

// Check element existence
console.log(document.getElementById('employmentIncome')); // Should exist

// Check event handlers
document.getElementById('employmentIncome').oninput; // Should exist
```

**Solutions:**
1. **Function Scope Issue**
   ```javascript
   // Ensure global definition
   window.calculateTaxNow = function calculateTaxNow() {
       // Implementation
   };
   ```

2. **Missing Event Handlers**
   ```html
   <!-- Add inline handlers -->
   <input type="number" id="employmentIncome" 
          oninput="calculateTaxNow()" 
          onkeyup="calculateTaxNow()" 
          onchange="calculateTaxNow()">
   ```

3. **JavaScript Errors Blocking Execution**
   - Check browser console for syntax errors
   - Fix undefined function calls
   - Resolve variable naming conflicts

#### **2. Deployment Issues**

**Symptoms:**
- Changes not appearing on live site
- GitHub Actions failing
- Firebase authentication errors

**Debugging Steps:**
```bash
# Check GitHub Actions status
curl -s "https://api.github.com/repos/nanthan77/mytracksy/actions/runs?per_page=5"

# Check Firebase project access
firebase projects:list

# Verify local vs live content
curl -s "https://tracksy-8e30c.web.app/user-profile.html" | grep "calculateTaxNow"
```

**Solutions:**
1. **GitHub Actions Setup**
   - Add `FIREBASE_SERVICE_ACCOUNT` secret
   - Verify repository permissions
   - Check workflow file syntax

2. **Firebase Routing Issues**
   ```json
   // Avoid wildcard redirects
   "rewrites": [
     {
       "source": "/",
       "destination": "/index.html"
     }
   ]
   ```

3. **Caching Issues**
   - Hard refresh (Ctrl+F5)
   - Clear browser cache
   - Check Firebase cache headers

#### **3. JavaScript Errors**

**Common Errors:**
```javascript
// "Identifier 'style' has already been declared"
const behavioralEngagementStyle = document.createElement('style'); // Unique names

// "this.functionName is not a function"
// Add missing method definitions to class

// "Element not found"
// Check element IDs match HTML
```

### **Performance Optimization**

#### **Loading Performance**
```javascript
// Defer non-critical scripts
<script defer src="behavioral-engagement-system.js"></script>

// Optimize critical path
window.calculateTaxNow = function() {
    // Core calculation logic first
};
```

#### **Calculation Performance**
```javascript
// Debounce rapid input changes
let calculationTimeout;
function calculateTaxNow() {
    clearTimeout(calculationTimeout);
    calculationTimeout = setTimeout(() => {
        // Actual calculation
    }, 100); // 100ms delay
}
```

## 📊 Monitoring & Analytics

### **Error Tracking**
```javascript
// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    // Send to analytics if needed
});

// Function-specific error tracking
function calculateTaxNow() {
    try {
        // Calculation logic
    } catch (error) {
        console.error('Tax calculation error:', error);
        // Fallback behavior
    }
}
```

### **Performance Monitoring**
```javascript
// Measure calculation performance
function calculateTaxNow() {
    const startTime = performance.now();
    
    // Calculation logic
    
    const endTime = performance.now();
    console.log(`Calculation took ${endTime - startTime} milliseconds`);
}
```

### **User Analytics**
```javascript
// Track user interactions
function trackTaxCalculation(income, tax) {
    // Analytics tracking
    console.log(`Tax calculated: Income ${income}, Tax ${tax}`);
}
```

## 🔐 Security Considerations

### **Input Validation**
```javascript
function calculateTaxNow() {
    const income = parseFloat(document.getElementById('employmentIncome')?.value) || 0;
    
    // Validate input ranges
    if (income < 0 || income > 999999999) {
        console.warn('Invalid income value:', income);
        return;
    }
    
    // Proceed with calculation
}
```

### **Firebase Security Rules**
```javascript
// firestore/firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Secure user data access
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 📈 Future Enhancements

### **Planned Features**
- [ ] Multi-year tax comparison
- [ ] Advanced deduction calculator
- [ ] Export to tax software formats
- [ ] Mobile-responsive design improvements
- [ ] Offline capability with service workers

### **Technical Improvements**
- [ ] TypeScript migration
- [ ] Unit test coverage
- [ ] E2E testing with Cypress
- [ ] Performance monitoring
- [ ] Progressive Web App features

## 📞 Support & Maintenance

### **Key Files to Monitor**
- `user-profile.html` - Main tax calculator interface
- `comprehensive-income-tax-calculator.js` - Tax calculation engine
- `firebase.json` - Hosting configuration
- `.github/workflows/firebase-deploy.yml` - Deployment pipeline

### **Regular Maintenance Tasks**
- [ ] Update tax brackets annually (April)
- [ ] Monitor Firebase usage and costs
- [ ] Review and update security rules
- [ ] Performance optimization
- [ ] Dependency updates

### **Emergency Procedures**
1. **Rollback Deployment**
   ```bash
   # Revert to previous commit
   git revert HEAD
   git push origin main
   ```

2. **Disable Features**
   ```javascript
   // Temporarily disable problematic features
   // window.calculateTaxNow = function() { console.log('Disabled'); };
   ```

3. **Contact Information**
   - **Repository**: https://github.com/nanthan77/mytracksy
   - **Live Site**: https://tracksy-8e30c.web.app
   - **Firebase Console**: https://console.firebase.google.com/project/tracksy-8e30c

---

## 📋 Quick Reference

### **Essential Commands**
```bash
# Development
firebase serve --only hosting
python3 -m http.server 8000

# Deployment
git add . && git commit -m "feat: update" && git push origin main
firebase deploy --project tracksy-8e30c

# Debugging
curl -s "https://tracksy-8e30c.web.app/user-profile.html"
firebase functions:log --project tracksy-8e30c
```

### **Key URLs**
- **Production**: https://tracksy-8e30c.web.app/user-profile.html
- **Repository**: https://github.com/nanthan77/mytracksy
- **Firebase Console**: https://console.firebase.google.com/project/tracksy-8e30c
- **GitHub Actions**: https://github.com/nanthan77/mytracksy/actions

### **Tax Calculator Test Values**
```
Employment Income: 5,000,000 LKR
Expected Tax: ~460,000 LKR annually
Monthly Tax: ~38,333 LKR
```

---

**Last Updated**: July 7, 2025
**Version**: 2.0
**Status**: ✅ Production Ready