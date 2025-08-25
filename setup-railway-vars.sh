#!/bin/bash

# Script to set up Railway environment variables for BookingBot backend
# This script sets all required environment variables for production deployment

echo "🚀 Setting up Railway environment variables for BookingBot backend..."

# Core Environment Variables
echo "Setting core environment variables..."
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set API_VERSION=v1

# Database (already configured)
echo "Database URL should already be configured by Railway PostgreSQL service"

# JWT Configuration - Generate secure secrets
echo "Setting JWT configuration..."
JWT_SECRET=$(openssl rand -base64 48)
JWT_REFRESH_SECRET=$(openssl rand -base64 48)
SESSION_SECRET=$(openssl rand -base64 48)

railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set JWT_EXPIRES_IN=1h
railway variables set JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"
railway variables set JWT_REFRESH_EXPIRES_IN=30d
railway variables set SESSION_SECRET="$SESSION_SECRET"

# CORS Configuration
echo "Setting CORS configuration..."
railway variables set CORS_ORIGIN="http://localhost:3000,http://localhost:5173,https://miyzapis.com,https://www.miyzapis.com,https://miyzapis-frontend-production.up.railway.app"

# Email Configuration (Gmail SMTP)
echo "Setting email configuration..."
read -p "Enter Gmail SMTP username (your Gmail address): " SMTP_USER
read -s -p "Enter Gmail App Password: " SMTP_PASS
echo
railway variables set SMTP_HOST=smtp.gmail.com
railway variables set SMTP_PORT=587
railway variables set SMTP_SECURE=true
railway variables set SMTP_USER="$SMTP_USER"
railway variables set SMTP_PASS="$SMTP_PASS"
railway variables set EMAIL_FROM="$SMTP_USER"

# Google OAuth Configuration
echo "Setting Google OAuth configuration..."
read -p "Enter Google OAuth Client ID: " GOOGLE_CLIENT_ID
read -p "Enter Google OAuth Client Secret: " GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI="https://miyzapis-backend.up.railway.app/api/v1/auth-enhanced/google/callback"

railway variables set GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID"
railway variables set GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET"
railway variables set GOOGLE_REDIRECT_URI="$GOOGLE_REDIRECT_URI"

# Telegram Configuration
echo "Setting Telegram configuration..."
read -p "Enter Telegram Bot Token (or press Enter to skip): " TELEGRAM_BOT_TOKEN
if [ ! -z "$TELEGRAM_BOT_TOKEN" ]; then
    TELEGRAM_WEBHOOK_URL="https://miyzapis-backend.up.railway.app/api/v1/telegram/webhook"
    TELEGRAM_WEBHOOK_SECRET=$(openssl rand -base64 32)
    
    railway variables set TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN"
    railway variables set TELEGRAM_WEBHOOK_URL="$TELEGRAM_WEBHOOK_URL"
    railway variables set TELEGRAM_WEBHOOK_SECRET="$TELEGRAM_WEBHOOK_SECRET"
fi

# Security Configuration
echo "Setting security configuration..."
railway variables set BCRYPT_ROUNDS=12
railway variables set RATE_LIMIT_WINDOW_MS=900000
railway variables set RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
echo "Setting logging configuration..."
railway variables set LOG_LEVEL=info
railway variables set LOG_FILE_ENABLED=false

# Optional: Stripe Configuration (can be added later)
echo "Stripe configuration skipped - can be added later if needed"

echo "✅ Railway environment variables configured successfully!"
echo "🔄 Backend service will redeploy automatically with new variables"
echo ""
echo "Next steps:"
echo "1. Wait for the deployment to complete"
echo "2. Test the authentication endpoints"
echo "3. Update frontend environment variables to point to production backend"