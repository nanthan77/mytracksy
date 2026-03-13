#!/bin/bash

# MyTracksy Deployment Script
# H9: Project ID is read from .firebaserc — never hardcoded here.
echo "🚀 Starting MyTracksy deployment..."

# Check if Firebase CLI is logged in
if ! firebase projects:list > /dev/null 2>&1; then
    echo "❌ Not logged into Firebase. Please run: firebase login"
    exit 1
fi

# Use the project configured in .firebaserc (do NOT hardcode project IDs)
echo "📋 Using Firebase project from .firebaserc..."
firebase use default

# Verify files exist
echo "✅ Verifying files..."
if [ ! -f "public/index.html" ]; then
    echo "❌ public/index.html not found!"
    exit 1
fi

if [ ! -f "public/aquaculture-dashboard.html" ]; then
    echo "❌ public/aquaculture-dashboard.html not found!"
    exit 1
fi

echo "✅ All files verified"

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting

echo "✅ Deployment complete!"
echo ""
echo "🌐 Check your Firebase console for live URLs."
