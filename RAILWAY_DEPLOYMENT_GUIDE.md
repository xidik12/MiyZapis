# BookingBot Platform - Railway Deployment Guide

## Table of Contents
1. [Overview](#overview)
2. [Railway Account Setup](#railway-account-setup)
3. [Project Structure for Railway](#project-structure-for-railway)
4. [Backend API Deployment](#backend-api-deployment)
5. [Database Setup (PostgreSQL)](#database-setup-postgresql)
6. [Redis Cache Setup](#redis-cache-setup)
7. [Frontend Website Deployment](#frontend-website-deployment)
8. [Telegram Bot Deployment](#telegram-bot-deployment)
9. [Telegram Mini App Deployment](#telegram-mini-app-deployment)
10. [Environment Variables Configuration](#environment-variables-configuration)
11. [Custom Domains](#custom-domains)
12. [Monitoring & Logs](#monitoring--logs)
13. [Scaling & Performance](#scaling--performance)
14. [Cost Management](#cost-management)
15. [Troubleshooting](#troubleshooting)
16. [Management & Maintenance](#management--maintenance)

## Overview

Railway is a modern deployment platform that simplifies the process of deploying applications. Your BookingBot platform consists of:
- **Backend API**: Node.js Express server
- **Frontend Website**: React/Vite application
- **Telegram Bot**: Node.js bot service
- **Telegram Mini App**: React mini application
- **PostgreSQL Database**: Managed database
- **Redis**: Caching service

## Railway Account Setup

### 1. Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (recommended for easier deployments)
3. Verify your email address
4. Complete your profile

### 2. Install Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Verify installation
railway --version
```

### 3. Connect GitHub Repository
1. In Railway dashboard, click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your GitHub account
4. Select your BookingBot repository

## Project Structure for Railway

Railway will deploy each service separately. Create the following configuration files:

### 1. Root Railway Configuration
Create `railway.json` in your project root:

```json
{
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2. Backend Service Configuration
Create `backend/railway.toml`:

```toml
[build]
builder = "nixpacks"
buildCommand = "npm run build"

[deploy]
startCommand = "npm start"
restartPolicyType = "always"
restartPolicyMaxRetries = 10

[variables]
NODE_ENV = "production"
PORT = "3000"
```

### 3. Frontend Service Configuration
Create `railway.toml` in root for frontend:

```toml
[build]
builder = "nixpacks"
buildCommand = "npm run build"

[deploy]
startCommand = "npm run preview"
restartPolicyType = "always"

[variables]
NODE_ENV = "production"
```

### 4. Telegram Bot Configuration
Create `telegram-bot/railway.toml`:

```toml
[build]
builder = "nixpacks"
buildCommand = "npm run build"

[deploy]
startCommand = "npm start"
restartPolicyType = "always"

[variables]
NODE_ENV = "production"
```

## Backend API Deployment

### 1. Prepare Backend for Railway

Update `backend/package.json` scripts:
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "tsx watch src/server.ts",
    "migrate": "prisma migrate deploy",
    "db:generate": "prisma generate",
    "postinstall": "prisma generate"
  }
}
```

### 2. Update Prisma Configuration
Update `backend/prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "linux-musl"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. Create Backend Health Check
Create `backend/src/health.ts`:
```typescript
import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

export default router;
```

### 4. Deploy Backend to Railway

```bash
# Navigate to project root
cd ~/Documents/BookingBot

# Create new Railway project
railway init

# Add backend service
railway add --service backend

# Deploy backend
cd backend
railway up
```

## Database Setup (PostgreSQL)

### 1. Add PostgreSQL Service

In Railway dashboard:
1. Click your project
2. Click "New Service"
3. Select "Database" → "PostgreSQL"
4. Railway will automatically provision the database

### 2. Get Database URL

```bash
# Get database URL from Railway
railway variables

# The DATABASE_URL will be automatically set
# Format: postgresql://username:password@host:port/database
```

### 3. Run Database Migrations

```bash
# Set up database environment
cd backend
railway run npx prisma migrate deploy
railway run npx prisma db seed
```

## Redis Cache Setup

### 1. Add Redis Service

In Railway dashboard:
1. Click "New Service"
2. Select "Database" → "Redis"
3. Railway will provision Redis instance

### 2. Configure Redis Connection

The `REDIS_URL` will be automatically provided by Railway.

## Frontend Website Deployment

### 1. Prepare Frontend Build

Update `package.json` scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --port 3000 --host 0.0.0.0",
    "start": "npm run preview"
  }
}
```

### 2. Update Vite Configuration

Update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@heroicons/react', 'lucide-react']
        }
      }
    }
  },
  preview: {
    port: 3000,
    host: '0.0.0.0'
  },
  server: {
    host: '0.0.0.0',
    port: 3000
  }
})
```

### 3. Deploy Frontend

```bash
# Add frontend service
railway add --service frontend

# Deploy frontend
railway up
```

## Telegram Bot Deployment

### 1. Prepare Telegram Bot

Update `telegram-bot/package.json`:
```json
{
  "scripts": {
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "postinstall": "npm run build"
  }
}
```

### 2. Update Bot Configuration

Update `telegram-bot/src/config/index.ts`:
```typescript
export const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN!,
    webhookUrl: process.env.WEBHOOK_URL,
  },
  api: {
    baseUrl: process.env.API_BASE_URL!,
  },
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
};
```

### 3. Deploy Telegram Bot

```bash
# Add telegram bot service
railway add --service telegram-bot

# Deploy
cd telegram-bot
railway up
```

## Telegram Mini App Deployment

### 1. Prepare Mini App

Update `mini-app/package.json`:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --port 3000 --host 0.0.0.0",
    "start": "npm run preview"
  }
}
```

### 2. Configure Vite for Telegram

Update `mini-app/vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          telegram: ['@telegram-apps/sdk', '@telegram-apps/sdk-react']
        }
      }
    }
  },
  preview: {
    port: 3000,
    host: '0.0.0.0'
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    headers: {
      'X-Frame-Options': 'ALLOWALL',
      'Content-Security-Policy': 'default-src * \'unsafe-inline\' \'unsafe-eval\'; script-src * \'unsafe-inline\' \'unsafe-eval\'; connect-src * \'unsafe-inline\'; img-src * data: blob: \'unsafe-inline\'; frame-src *; style-src * \'unsafe-inline\';'
    }
  }
})
```

### 3. Deploy Mini App

```bash
# Add mini app service
railway add --service mini-app

# Deploy
cd mini-app
railway up
```

## Environment Variables Configuration

### Backend Environment Variables

In Railway dashboard, go to Backend service → Variables:

```env
# Database (Auto-provided by Railway)
DATABASE_URL=postgresql://...

# Redis (Auto-provided by Railway)
REDIS_URL=redis://...

# Server
NODE_ENV=production
PORT=3000

# JWT
JWT_SECRET=your_super_secure_jwt_secret_at_least_32_characters
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_at_least_32_characters
JWT_REFRESH_EXPIRES_IN=30d

# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_WEBHOOK_URL=https://your-backend-service.railway.app/webhook/telegram

# Email
SMTP_HOST=smtp.your-email-provider.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@yourdomain.com

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,application/pdf

# CORS
CORS_ORIGIN=https://your-frontend-service.railway.app,https://your-miniapp-service.railway.app
```

### Frontend Environment Variables

In Railway dashboard, go to Frontend service → Variables:

```env
VITE_API_URL=https://your-backend-service.railway.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
VITE_TELEGRAM_BOT_USERNAME=your_bot_username
VITE_APP_URL=https://your-frontend-service.railway.app
```

### Telegram Bot Environment Variables

```env
NODE_ENV=production
PORT=3000
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
API_BASE_URL=https://your-backend-service.railway.app
WEBHOOK_URL=https://your-backend-service.railway.app/webhook/telegram
```

### Mini App Environment Variables

```env
VITE_API_URL=https://your-backend-service.railway.app
VITE_TELEGRAM_BOT_USERNAME=your_bot_username
VITE_APP_URL=https://your-miniapp-service.railway.app
```

## Custom Domains

### 1. Add Custom Domain

In Railway dashboard:
1. Go to your service (Frontend/Mini App)
2. Click "Settings" → "Domains"
3. Click "Custom Domain"
4. Enter your domain (e.g., `yourdomain.com`)

### 2. Configure DNS

Add these DNS records to your domain provider:

```
Type    Name        Value                               TTL
CNAME   @           your-frontend-service.railway.app   300
CNAME   www         your-frontend-service.railway.app   300
CNAME   api         your-backend-service.railway.app    300
CNAME   miniapp     your-miniapp-service.railway.app    300
```

### 3. SSL Certificate

Railway automatically provides SSL certificates for custom domains.

## Monitoring & Logs

### 1. View Logs

```bash
# View logs for specific service
railway logs --service backend
railway logs --service frontend
railway logs --service telegram-bot
railway logs --service mini-app

# Follow logs in real-time
railway logs --follow --service backend
```

### 2. Railway Dashboard Monitoring

In Railway dashboard, each service provides:
- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time application logs
- **Deployments**: Deployment history and status
- **Usage**: Resource consumption

### 3. Health Checks

Railway automatically monitors your services. Ensure your services respond to health checks:

Backend health endpoint: `GET /health`
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

## Scaling & Performance

### 1. Horizontal Scaling

In Railway dashboard:
1. Go to service → "Settings"
2. Under "Service Settings"
3. Increase "Replicas" (Pro plan required)

### 2. Vertical Scaling

Railway automatically scales resources based on usage. For guaranteed resources:
1. Upgrade to Pro plan
2. Set resource limits in service settings

### 3. Database Scaling

PostgreSQL and Redis automatically scale on Railway. For high-traffic:
1. Upgrade to higher database plans
2. Implement connection pooling in your application

## Cost Management

### 1. Monitor Usage

In Railway dashboard:
1. Go to "Usage" tab
2. Monitor monthly usage across all services
3. Set up usage alerts

### 2. Optimization Tips

- **Use Sleep Mode**: Enable for development services
- **Resource Limits**: Set appropriate CPU/memory limits
- **Efficient Builds**: Optimize Docker builds and dependencies
- **Database Connections**: Use connection pooling

### 3. Pricing Tiers

- **Hobby Plan**: $5/month + usage
- **Pro Plan**: $20/month + usage
- **Team Plan**: $50/month + usage

## Troubleshooting

### Common Issues and Solutions

#### 1. Service Not Starting

```bash
# Check logs
railway logs --service your-service

# Common issues:
# - Missing environment variables
# - Database connection errors
# - Port configuration issues
```

#### 2. Database Connection Issues

```bash
# Test database connection
railway connect --service postgres

# Check DATABASE_URL
railway variables --service backend
```

#### 3. Build Failures

```bash
# Check build logs
railway logs --service your-service

# Common solutions:
# - Update Node.js version in package.json
# - Fix TypeScript errors
# - Ensure all dependencies are listed
```

#### 4. Telegram Bot Not Responding

```bash
# Check bot service logs
railway logs --service telegram-bot

# Verify webhook URL
curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"

# Reset webhook
curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-backend-service.railway.app/webhook/telegram"}'
```

#### 5. Environment Variables Not Loading

```bash
# Check current variables
railway variables --service your-service

# Update variables via CLI
railway variables set KEY=value --service your-service
```

### Debug Commands

```bash
# Connect to service shell
railway shell --service backend

# Run commands in service environment
railway run --service backend npm run migrate

# Check service status
railway status
```

## Management & Maintenance

### Daily Management Tasks

#### 1. Monitor Service Health
```bash
# Check all services status
railway status

# View recent logs
railway logs --tail 100 --service backend
railway logs --tail 100 --service frontend
railway logs --tail 100 --service telegram-bot
```

#### 2. Monitor Resource Usage
- Check Railway dashboard for CPU/Memory usage
- Monitor database connection counts
- Review error rates in logs

### Weekly Maintenance

#### 1. Update Dependencies
```bash
# In each service directory
npm audit
npm update

# Deploy updates
railway up
```

#### 2. Database Maintenance
```bash
# Connect to database
railway connect --service postgres

# Run maintenance queries
ANALYZE;
VACUUM;
```

#### 3. Review Logs for Issues
```bash
# Check for errors in the last week
railway logs --service backend | grep -i error
railway logs --service telegram-bot | grep -i error
```

### Deployment Updates

#### 1. Deploy New Features
```bash
# Commit changes to Git
git add .
git commit -m "feat: new feature"
git push origin main

# Railway auto-deploys from main branch
# Check deployment status
railway status
```

#### 2. Rollback if Needed
```bash
# In Railway dashboard:
# 1. Go to service → "Deployments"
# 2. Click on previous successful deployment
# 3. Click "Rollback"

# Or via CLI (if available)
railway rollback --service your-service
```

#### 3. Database Migrations
```bash
# Run migrations after deployment
railway run --service backend npx prisma migrate deploy

# Check migration status
railway run --service backend npx prisma migrate status
```

### Backup Procedures

#### 1. Database Backup
```bash
# Export database
railway run --service postgres pg_dump $DATABASE_URL > backup.sql

# Or connect and create backup
railway connect --service postgres
# Then run pg_dump commands
```

#### 2. Environment Variables Backup
```bash
# Export all environment variables
railway variables --json > env-backup.json
```

### Performance Monitoring

#### 1. Set Up Alerts
In Railway dashboard:
1. Go to service → "Settings"
2. Set up alerts for:
   - High CPU usage (>80%)
   - High memory usage (>80%)
   - Service downtime
   - Error rate increases

#### 2. Regular Performance Checks
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s "https://your-backend-service.railway.app/health"

# Monitor database performance
railway run --service backend npm run db:analyze
```

### Security Management

#### 1. Rotate Secrets Regularly
- Update JWT secrets monthly
- Rotate API keys quarterly
- Update database passwords annually

#### 2. Review Access Logs
```bash
# Check for suspicious activity
railway logs --service backend | grep -E "(401|403|404|500)"
```

#### 3. Update Security Headers
Ensure your applications have proper security headers configured.

### Cost Optimization

#### 1. Monitor Spending
- Check monthly usage in Railway dashboard
- Set up billing alerts
- Review resource allocation monthly

#### 2. Optimize Resources
- Enable sleep mode for development services
- Right-size service resources
- Optimize database queries to reduce load

---

## Quick Reference Commands

```bash
# Project Management
railway init                          # Initialize new project
railway link                          # Link to existing project
railway status                        # Check all services status

# Service Management
railway up                            # Deploy current directory
railway logs --service <name>         # View service logs
railway shell --service <name>        # Connect to service shell
railway variables --service <name>    # View environment variables

# Database Operations
railway connect --service postgres    # Connect to PostgreSQL
railway run --service backend cmd     # Run command in backend context

# Monitoring
railway logs --follow                 # Follow logs in real-time
railway metrics                       # View usage metrics
```

This Railway deployment guide provides everything you need to deploy, manage, and maintain your BookingBot platform on Railway. The platform's simplicity makes it ideal for rapid deployment and scaling.