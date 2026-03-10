#!/bin/bash

# MyTracksy Deployment Script
echo "🚀 Starting MyTracksy deployment..."

# Check if Firebase CLI is logged in
if ! firebase projects:list > /dev/null 2>&1; then
    echo "❌ Not logged into Firebase. Please run: firebase login"
    exit 1
fi

# Set the correct project
echo "📋 Setting Firebase project..."
firebase use tracksy-8e30c

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
echo "🌐 Test URLs:"
echo "   https://tracksy-8e30c.web.app/"
echo "   https://tracksy-8e30c.web.app/aquaculture-dashboard.html"
echo "   https://mytracksy.com/aquaculture-dashboard.html"