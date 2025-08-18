# 🚀 Complete Deployment Guide - BookingBot Platform

This guide will walk you through deploying all 3 platforms online:
1. **Main Website** (React frontend)
2. **Telegram Bot** (Node.js backend)  
3. **Telegram Mini App** (React PWA)
4. **Backend API** (Node.js/Express server)

## 📋 Prerequisites

- Node.js 18+ installed
- Git installed
- Domain name (optional but recommended)
- Credit card for cloud services

---

# 🏗️ PHASE 1: Cloud Infrastructure Setup

## Option A: Vercel + Railway (Recommended - Easiest)

### 1.1 Backend API Deployment (Railway)

**Step 1: Prepare Backend**
```bash
cd /Users/salakhitdinovkhidayotullo/Documents/BookingBot/backend
npm install
npm run build
```

**Step 2: Create Railway Account**
1. Go to https://railway.app
2. Sign up with GitHub
3. Connect your GitHub account

**Step 3: Deploy Backend**
1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial backend setup"
git branch -M main
git remote add origin https://github.com/yourusername/bookingbot-backend.git
git push -u origin main
```

2. In Railway dashboard:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your backend repository
   - Railway will auto-detect Node.js

**Step 4: Configure Environment Variables in Railway**
```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database
REDIS_URL=redis://username:password@host:port

# API Configuration
NODE_ENV=production
PORT=8000
JWT_SECRET=your-super-secret-jwt-key-here
API_VERSION=v1

# CORS Configuration
FRONTEND_URL=https://your-website-domain.com
TELEGRAM_MINI_APP_URL=https://your-miniapp-domain.com

# Telegram Bot
TELEGRAM_BOT_TOKEN=8361818056:AAGjHfIBCLHXG5i9AeDKJH3SNcoGB8WrUrU
TELEGRAM_WEBHOOK_URL=https://your-backend-domain.railway.app/webhook/telegram

# Payment (Stripe)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Step 5: Add PostgreSQL Database**
1. In Railway project, click "Add Service"
2. Choose "PostgreSQL"
3. Railway will provide DATABASE_URL automatically

**Step 6: Add Redis Cache**
1. Click "Add Service" again
2. Choose "Redis"
3. Railway will provide REDIS_URL automatically

**Step 7: Deploy & Get URL**
- Railway will provide your backend URL: `https://your-project.railway.app`

---

### 1.2 Main Website Deployment (Vercel)

**Step 1: Prepare Website**
```bash
cd /Users/salakhitdinovkhidayotullo/Documents/BookingBot
npm install
```

**Step 2: Update API URLs**
Edit `src/config/environment.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-project.railway.app/api/v1',
  wsUrl: 'wss://your-project.railway.app',
  telegramBotUrl: 'https://t.me/YourBotUsername',
  miniAppUrl: 'https://your-miniapp.vercel.app'
};
```

**Step 3: Build & Deploy to Vercel**
```bash
npm run build

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Step 4: Configure Environment Variables in Vercel**
1. Go to Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
```env
REACT_APP_API_URL=https://your-project.railway.app/api/v1
REACT_APP_WS_URL=wss://your-project.railway.app
REACT_APP_TELEGRAM_BOT_URL=https://t.me/YourBotUsername
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Step 5: Custom Domain (Optional)**
1. In Vercel project settings
2. Go to Domains
3. Add your domain: `yourdomain.com`

---

### 1.3 Telegram Mini App Deployment (Vercel)

**Step 1: Prepare Mini App**
```bash
cd /Users/salakhitdinovkhidayotullo/Documents/BookingBot/mini-app
npm install
```

**Step 2: Update API Configuration**
Edit `mini-app/src/config/api.ts`:
```typescript
export const API_BASE_URL = 'https://your-project.railway.app/api/v1';
export const WS_URL = 'wss://your-project.railway.app';
```

**Step 3: Build & Deploy**
```bash
npm run build
vercel --prod
```

**Step 4: Configure for Telegram**
1. In Vercel dashboard, get your mini app URL: `https://your-miniapp.vercel.app`
2. Contact @BotFather on Telegram
3. Send `/newapp` or `/editapp` 
4. Set your mini app URL

---

### 1.4 Telegram Bot Deployment (Railway)

**Step 1: Prepare Bot**
```bash
cd /Users/salakhitdinovkhidayotullo/Documents/BookingBot/telegram-bot
npm install
npm run build
```

**Step 2: Deploy to Railway**
1. Create new Railway project for bot
2. Connect GitHub repository
3. Configure environment variables:
```env
BOT_TOKEN=8361818056:AAGjHfIBCLHXG5i9AeDKJH3SNcoGB8WrUrU
API_BASE_URL=https://your-backend.railway.app
WEBHOOK_URL=https://your-bot.railway.app/webhook
NODE_ENV=production
PORT=3001
```

**Step 3: Set Telegram Webhook**
```bash
curl -X POST "https://api.telegram.org/bot8361818056:AAGjHfIBCLHXG5i9AeDKJH3SNcoGB8WrUrU/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-bot.railway.app/webhook"}'
```

---

## Option B: DigitalOcean Droplet (Advanced)

### 2.1 Create Droplet
1. Go to https://digitalocean.com
2. Create account
3. Create Droplet:
   - Ubuntu 22.04 LTS
   - Basic plan ($12/month recommended)
   - Choose datacenter region
   - Add SSH key

### 2.2 Server Setup
```bash
# Connect to droplet
ssh root@your-droplet-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Install Nginx
apt install nginx -y

# Install PostgreSQL
apt install postgresql postgresql-contrib -y

# Install Redis
apt install redis-server -y

# Install SSL certificates
apt install certbot python3-certbot-nginx -y
```

### 2.3 Database Setup
```bash
# Configure PostgreSQL
sudo -u postgres createuser --createdb --pwprompt bookinguser
sudo -u postgres createdb bookingdb --owner=bookinguser

# Configure Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### 2.4 Deploy Applications
```bash
# Create app directory
mkdir -p /var/www/bookingbot
cd /var/www/bookingbot

# Clone your repositories
git clone https://github.com/yourusername/bookingbot-backend.git backend
git clone https://github.com/yourusername/bookingbot-website.git website
git clone https://github.com/yourusername/bookingbot-miniapp.git mini-app
git clone https://github.com/yourusername/bookingbot-telegram.git telegram-bot

# Install and build backend
cd backend
npm install
npm run build
npm run migrate:prod

# Install and build website
cd ../website
npm install
npm run build

# Install and build mini-app
cd ../mini-app
npm install
npm run build

# Install and build telegram bot
cd ../telegram-bot
npm install
npm run build
```

### 2.5 PM2 Configuration
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'booking-backend',
      script: './backend/dist/server.js',
      cwd: '/var/www/bookingbot',
      env: {
        NODE_ENV: 'production',
        PORT: 8000,
        DATABASE_URL: 'postgresql://bookinguser:password@localhost:5432/bookingdb',
        REDIS_URL: 'redis://localhost:6379'
      }
    },
    {
      name: 'telegram-bot',
      script: './telegram-bot/dist/index.js',
      cwd: '/var/www/bookingbot',
      env: {
        NODE_ENV: 'production',
        BOT_TOKEN: '8361818056:AAGjHfIBCLHXG5i9AeDKJH3SNcoGB8WrUrU',
        API_BASE_URL: 'http://localhost:8000',
        PORT: 3001
      }
    }
  ]
};
```

```bash
# Start applications
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 2.6 Nginx Configuration
Create `/etc/nginx/sites-available/bookingbot`:
```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Main Website
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    root /var/www/bookingbot/website/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Mini App
server {
    listen 80;
    server_name miniapp.yourdomain.com;
    
    root /var/www/bookingbot/mini-app/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Telegram Bot Webhook
server {
    listen 80;
    server_name bot.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable sites
ln -s /etc/nginx/sites-available/bookingbot /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Get SSL certificates
certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com -d miniapp.yourdomain.com -d bot.yourdomain.com
```

---

# 🔧 PHASE 2: Configuration & Testing

## 2.1 Domain Configuration (If using custom domain)

### DNS Records Setup
Add these DNS records to your domain provider:

| Type  | Name      | Value                           | TTL |
|-------|-----------|--------------------------------|-----|
| A     | @         | your-server-ip                 | 300 |
| A     | www       | your-server-ip                 | 300 |
| A     | api       | your-server-ip                 | 300 |
| A     | miniapp   | your-server-ip                 | 300 |
| A     | bot       | your-server-ip                 | 300 |
| CNAME | *         | yourdomain.com                 | 300 |

## 2.2 Telegram Bot Configuration

### Update Bot Settings with BotFather
1. Message @BotFather on Telegram
2. Use these commands:

```
/setcommands
@YourBotUsername

start - 🚀 Start using the bot
bookings - 📅 View my bookings
services - 🔍 Browse services
specialists - 👥 Find specialists  
search - 🔍 Search services
profile - 👤 My profile
settings - ⚙️ Bot settings
earnings - 💰 View earnings (specialists)
analytics - 📊 View analytics (specialists)
location - 📍 Share location
help - ❓ Get help
cancel - ❌ Cancel action
```

```
/setdescription  
@YourBotUsername
Professional booking platform bot. Book appointments, find specialists, manage your schedule - all in Telegram! 🚀
```

```
/setabouttext
@YourBotUsername  
BookingBot helps you discover and book professional services directly in Telegram. Find specialists, manage appointments, and grow your business! 

🔸 Book appointments instantly
🔸 Find verified specialists  
🔸 Manage your schedule
🔸 Track earnings & analytics
🔸 Multi-language support

Start with /start command!
```

```
/setmenubutton
@YourBotUsername
https://your-miniapp.vercel.app - 📱 Open Mini App
```

## 2.3 Mini App Registration
1. Message @BotFather
2. Send: `/newapp` or `/editapp` 
3. Choose your bot
4. Provide mini app details:
   - **URL**: `https://your-miniapp.vercel.app`
   - **Name**: BookingBot Mini App
   - **Description**: Professional booking platform
   - **Photo**: Upload app icon (512x512 px)

## 2.4 Test All Platforms

### Test Backend API
```bash
# Health check
curl https://your-backend.railway.app/api/v1/health

# Expected response:
{"success":true,"data":{"status":"healthy","timestamp":"2025-08-18T..."}}
```

### Test Website
1. Visit: `https://your-website.vercel.app`
2. Test user registration/login
3. Test service browsing
4. Test booking creation

### Test Telegram Bot
1. Find your bot: `https://t.me/YourBotUsername`
2. Send `/start`
3. Test all commands
4. Test booking flow

### Test Mini App
1. Open Telegram
2. Go to your bot
3. Use menu button or send a message
4. Should open mini app in Telegram

---

# 🎯 PHASE 3: Production Optimizations

## 3.1 Performance Optimizations

### Backend Optimizations
```javascript
// Add to backend/src/middleware/performance.ts
import compression from 'compression';
import helmet from 'helmet';

app.use(compression());
app.use(helmet());

// Enable Redis caching
app.use('/api/v1/specialists', cache(300)); // 5min cache
```

### Frontend Optimizations
```bash
# Optimize builds
npm run build -- --analyze

# Enable gzip compression in Vercel
echo '{"functions": {"app/build/**": {"maxDuration": 30}}}' > vercel.json
```

## 3.2 Monitoring Setup

### Add Health Checks
```javascript
// backend/src/routes/health.ts
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version
    }
  });
});
```

### Error Monitoring
Consider adding:
- **Sentry** for error tracking
- **LogRocket** for session replay  
- **DataDog** for performance monitoring

## 3.3 Security Hardening

### Rate Limiting
```javascript
// Increase rate limits for production
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes  
  max: 1000, // requests per windowMs
  message: 'Too many requests'
};
```

### CORS Configuration
```javascript
const corsOptions = {
  origin: [
    'https://your-website.vercel.app',
    'https://your-miniapp.vercel.app', 
    'https://web.telegram.org'
  ],
  credentials: true
};
```

---

# 🚀 PHASE 4: Launch Checklist

## 4.1 Pre-Launch Testing
- [ ] All 3 platforms load correctly
- [ ] User registration/login works
- [ ] Service browsing works
- [ ] Booking creation works
- [ ] Payment processing works
- [ ] Telegram bot responds to all commands
- [ ] Mini app opens in Telegram
- [ ] Real-time features work
- [ ] Multi-language switching works
- [ ] Mobile responsive design

## 4.2 Go Live Steps
1. **Update all URLs** in production configs
2. **Test payment flows** with real payment methods
3. **Set up monitoring** and alerting
4. **Create backup procedures** 
5. **Document admin procedures**
6. **Prepare user onboarding** materials

## 4.3 Post-Launch Monitoring
- Monitor server resources and performance
- Track user registrations and bookings
- Monitor error rates and fix issues
- Collect user feedback
- Plan feature updates

---

# 📞 Support & Troubleshooting

## Common Issues

### "API Connection Failed"
- Check backend URL configuration
- Verify environment variables
- Check CORS settings
- Ensure backend is running

### "Telegram Bot Not Responding"  
- Verify bot token is correct
- Check webhook is set properly
- Ensure bot server is running
- Check bot permissions

### "Mini App Won't Load"
- Verify mini app URL with @BotFather
- Check HTTPS certificate
- Test mini app URL directly
- Check Telegram developer tools

### Database Connection Issues
- Verify DATABASE_URL format
- Check database server status  
- Test connection from backend
- Check firewall settings

## Need Help?
- Check server logs: `pm2 logs` (if using PM2)
- Test API endpoints individually
- Use browser developer tools
- Check Telegram bot webhook status: 
  ```bash
  curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
  ```

---

**🎉 Congratulations! Your BookingBot platform is now live with all 3 interfaces!**

**Website**: https://your-website.vercel.app
**Telegram Bot**: https://t.me/YourBotUsername  
**Mini App**: Available through the Telegram bot

Users can now book appointments through any platform they prefer! 🚀