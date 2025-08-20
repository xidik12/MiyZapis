#!/bin/bash

# Railway Redis Configuration Script
# This script configures Redis environment variables for your Railway backend service

echo "🔧 Configuring Redis for Railway deployment..."

# Check if Railway CLI is available and logged in
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway. Please run: railway login"
    exit 1
fi

echo "✅ Railway CLI is available and authenticated"

# Instructions for manual configuration
echo ""
echo "🚨 IMPORTANT: You need to configure Redis environment variables manually"
echo ""
echo "📋 Steps to configure Redis in Railway Dashboard:"
echo "1. Go to https://railway.app and open your project"
echo "2. Find your Redis service and click on it"
echo "3. Go to 'Variables' tab and copy the Redis connection details"
echo "4. Go to your Backend service"
echo "5. Click 'Variables' tab"
echo "6. Add these variables:"
echo ""
echo "   REDIS_URL=redis://default:password@redis.railway.internal:6379"
echo "   REDIS_PASSWORD=your-actual-redis-password"
echo ""
echo "🔍 Your Redis URL should look like one of these formats:"
echo "   - redis://default:password@redis.railway.internal:6379"
echo "   - rediss://default:password@redis.railway.internal:6380"
echo "   - redis://username:password@host:port"
echo ""

# Try to set variables if the user provides them
read -p "Do you have your Redis URL? (y/n): " has_redis_url

if [ "$has_redis_url" = "y" ] || [ "$has_redis_url" = "Y" ]; then
    read -p "Enter your Redis URL: " REDIS_URL
    read -p "Enter your Redis password (if separate): " REDIS_PASSWORD
    
    echo "Setting Redis environment variables..."
    
    # Set the variables
    if [ ! -z "$REDIS_URL" ]; then
        railway variables --set "REDIS_URL=$REDIS_URL"
        echo "✅ REDIS_URL set"
    fi
    
    if [ ! -z "$REDIS_PASSWORD" ]; then
        railway variables --set "REDIS_PASSWORD=$REDIS_PASSWORD"
        echo "✅ REDIS_PASSWORD set"
    fi
    
    echo "🎉 Redis configuration completed!"
    echo "🔄 Your backend service will redeploy automatically"
    
else
    echo ""
    echo "⚠️  Please configure Redis variables manually in Railway Dashboard"
    echo "📖 Follow the steps above to get your Redis connection details"
fi

echo ""
echo "🧪 After configuration, you can test Redis connection with:"
echo "   npm run test:redis"
echo ""
echo "📊 Check deployment logs in Railway dashboard to verify Redis connection"
