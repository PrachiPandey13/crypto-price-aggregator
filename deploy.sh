#!/bin/bash

# Railway Deployment Script
# This script helps deploy the Real-Time Data Aggregation Service to Railway

echo "🚂 Railway Deployment Script"
echo "=============================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed."
    echo "Please install it with: npm install -g @railway/cli"
    exit 1
fi

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway."
    echo "Please run: railway login"
    exit 1
fi

echo "✅ Railway CLI is installed and logged in"

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build completed successfully"

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

if [ $? -eq 0 ]; then
    echo "✅ Deployment completed successfully!"
    echo "🌐 Your app should be available at the URL shown above"
    echo ""
    echo "📋 Next steps:"
    echo "1. Add Redis service in Railway dashboard"
    echo "2. Set REDIS_URL environment variable"
    echo "3. Test your endpoints"
    echo "4. Configure custom domain (optional)"
else
    echo "❌ Deployment failed. Please check the logs above."
    exit 1
fi 