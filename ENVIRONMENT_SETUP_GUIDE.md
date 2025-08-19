# Environment Variables Setup Guide

This guide will help you configure all the necessary environment variables for the MiyZapis booking platform.

## Backend Environment Variables (.env)

### Required Variables

#### Database Configuration
```bash
# PostgreSQL Database (Required)
DATABASE_URL="postgresql://postgres:password@host:port/database"

# Redis Cache (Recommended for production)
REDIS_URL="redis://default:password@host:port"
```

#### JWT Configuration
```bash
# Generate secure random strings (32+ characters)
JWT_SECRET="your-super-secure-jwt-secret-32chars+"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret-32chars+"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="30d"
```

### Authentication Services

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API and Google Identity Services
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Add your domain to authorized origins and redirect URIs

```bash
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="https://yourdomain.com/auth/google/callback"
```

#### Telegram Bot Setup
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Create a new bot with `/newbot`
3. Get your bot token
4. Set up webhook (optional for production)

```bash
TELEGRAM_BOT_TOKEN="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
TELEGRAM_WEBHOOK_URL="https://yourdomain.com/api/telegram/webhook"
TELEGRAM_WEBHOOK_SECRET="your-webhook-secret"
```

#### Email Service (SMTP)
Choose one of these providers:

**Gmail SMTP:**
```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-gmail@gmail.com"
SMTP_PASS="your-app-password"  # Use App Password, not regular password
EMAIL_FROM="MiyZapis <noreply@miyzapis.com>"
```

**SendGrid SMTP:**
```bash
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="apikey"
SMTP_PASS="SG.your-sendgrid-api-key"
EMAIL_FROM="MiyZapis <noreply@yourdomain.com>"
```

**Mailgun SMTP:**
```bash
SMTP_HOST="smtp.mailgun.org"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="postmaster@yourdomain.mailgun.org"
SMTP_PASS="your-mailgun-password"
EMAIL_FROM="MiyZapis <noreply@yourdomain.com>"
```

### Security & Session
```bash
SESSION_SECRET="your-super-secure-session-secret-32chars+"
BCRYPT_ROUNDS="12"
CORS_ORIGIN="https://yourdomain.com,https://www.yourdomain.com"
```

### Optional Variables

#### Stripe Payment Processing
```bash
STRIPE_SECRET_KEY="sk_live_your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="pk_live_your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
```

#### AWS S3 File Storage
```bash
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET="your-s3-bucket-name"
AWS_S3_URL="https://your-bucket.s3.amazonaws.com"
```

#### Monitoring & Logging
```bash
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
NEW_RELIC_LICENSE_KEY="your-new-relic-license-key"
LOG_LEVEL="info"
LOG_FILE_ENABLED="true"
```

#### Rate Limiting
```bash
RATE_LIMIT_WINDOW_MS="900000"  # 15 minutes
RATE_LIMIT_MAX_REQUESTS="100"
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS="false"
```

#### Development Settings
```bash
NODE_ENV="production"  # or "development"
PORT="3000"
DEBUG="app:*"
SEED_DATABASE="false"
```

## Frontend Environment Variables (.env)

Create a `.env` file in your frontend directory:

```bash
# API Configuration
VITE_API_URL="https://your-backend-api.com"

# Google OAuth
VITE_GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"

# Telegram Bot
VITE_TELEGRAM_BOT_USERNAME="your_bot_username"  # Without @

# Optional: Other services
VITE_STRIPE_PUBLISHABLE_KEY="pk_live_your-stripe-publishable-key"
VITE_SENTRY_DSN="https://your-frontend-sentry-dsn@sentry.io/project-id"
```

## Railway Deployment

### Setting Environment Variables in Railway

1. **Via Railway CLI:**
```bash
# Set individual variables
railway variables set DATABASE_URL="your-database-url"
railway variables set JWT_SECRET="your-jwt-secret"

# Set multiple variables from file
railway variables set --env-file .env
```

2. **Via Railway Dashboard:**
   - Go to your Railway project
   - Click on "Variables" tab
   - Add each environment variable manually

3. **Using Railway Database Services:**
```bash
# PostgreSQL (Railway provides this automatically)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (Railway provides this automatically)
REDIS_URL=${{Redis.REDIS_URL}}
```

## Complete Backend .env Template

```bash
# Environment
NODE_ENV="production"
PORT="3000"

# Database (Replace with your Railway database URLs)
DATABASE_URL="postgresql://postgres:GVGsHSeKoazyvATppTqvabRFqGniRQsH@caboose.proxy.rlwy.net:51538/railway"
REDIS_URL="redis://default:OsMBFqxgAhFAKoBYNZDesdCxqmDdNlPO@redis.railway.internal:6379"

# JWT Secrets (Generate new ones!)
JWT_SECRET="generate-a-secure-32-character-secret-key-here-for-jwt-tokens"
JWT_REFRESH_SECRET="generate-different-32-character-secret-for-refresh-tokens"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="30d"

# Google OAuth (Get from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="https://your-domain.railway.app/auth/google/callback"

# Telegram Bot (Get from @BotFather)
TELEGRAM_BOT_TOKEN="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
TELEGRAM_WEBHOOK_URL="https://your-domain.railway.app/api/telegram/webhook"
TELEGRAM_WEBHOOK_SECRET="your-telegram-webhook-secret"

# Email Service (Choose your preferred provider)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="MiyZapis <noreply@miyzapis.com>"

# Security
SESSION_SECRET="generate-a-secure-32-character-session-secret-here"
BCRYPT_ROUNDS="12"
CORS_ORIGIN="https://your-frontend-domain.com"

# Logging
LOG_LEVEL="info"
LOG_FILE_ENABLED="false"
```

## Setup Steps Summary

1. **Database**: Use Railway PostgreSQL and Redis services
2. **JWT Secrets**: Generate secure random strings (use `openssl rand -base64 32`)
3. **Google OAuth**: Set up in Google Cloud Console
4. **Telegram Bot**: Create bot with @BotFather
5. **Email Service**: Configure SMTP with your preferred provider
6. **Deploy**: Set all variables in Railway and deploy

## Security Best Practices

1. **Never commit .env files to version control**
2. **Use different secrets for development and production**
3. **Regularly rotate JWT secrets and API keys**
4. **Use Railway's built-in secret management**
5. **Enable 2FA on all external service accounts**

## Testing Your Setup

After setting up all variables, test your authentication:

1. **Email verification**: Register a new account
2. **Google OAuth**: Try signing in with Google
3. **Telegram auth**: Test Telegram login widget
4. **Password reset**: Test forgot password flow

## Troubleshooting

### Common Issues:

1. **Database connection fails**: Check DATABASE_URL format
2. **Email not sending**: Verify SMTP credentials and settings
3. **Google OAuth error**: Check redirect URIs and domain settings
4. **Telegram auth fails**: Verify bot token and webhook setup
5. **JWT errors**: Ensure secrets are at least 32 characters

### Debug Mode:
Set `DEBUG="*"` to enable detailed logging for troubleshooting.

## Support

If you encounter issues:
1. Check Railway deployment logs
2. Verify all environment variables are set correctly
3. Test external services (Google, Telegram, SMTP) independently
4. Review API endpoints and network connectivity

This completes the comprehensive authentication system with email verification, Google OAuth, and Telegram authentication!