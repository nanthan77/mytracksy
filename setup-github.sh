#!/bin/bash

# MyTracksy GitHub Repository Setup Script
# Run this after creating your GitHub repository

echo "🐙 Setting up GitHub repository for MyTracksy..."

# Check if we're in the right directory
if [ ! -f "firebase.json" ]; then
    echo "❌ Error: Run this script from the build directory"
    exit 1
fi

# Get GitHub username
read -p "Enter your GitHub username: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ Error: GitHub username is required"
    exit 1
fi

echo "🔗 Connecting to GitHub repository..."

# Add remote origin
git remote add origin https://github.com/$GITHUB_USERNAME/mytracksy.git

# Set main branch
git branch -M main

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🎉 Your repository is now live at:"
    echo "   https://github.com/$GITHUB_USERNAME/mytracksy"
    echo ""
    echo "🌐 Your application is live at:"
    echo "   https://tracksy-8e30c.web.app"
    echo ""
    echo "📋 Next steps:"
    echo "1. Set up Firebase CI token for auto-deployment:"
    echo "   firebase login:ci"
    echo "2. Add the token as GitHub secret 'FIREBASE_TOKEN'"
    echo "3. Make changes and push to trigger auto-deployment"
    echo ""
    echo "📖 Full setup guide: ./GITHUB_SETUP.md"
else
    echo "❌ Failed to push to GitHub"
    echo "Please check:"
    echo "1. Repository exists: https://github.com/$GITHUB_USERNAME/mytracksy"
    echo "2. You have write access to the repository"
    echo "3. GitHub username is correct"
fi