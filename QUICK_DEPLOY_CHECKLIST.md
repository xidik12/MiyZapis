# ⚡ Quick Deploy Checklist - BookingBot Platform

## 🎯 **Option 1: Railway + Vercel (Recommended - 30 minutes)**

### ✅ **Step 1: Backend (Railway) - 10 minutes**
```bash
# 1. Create Railway account: https://railway.app
# 2. Connect GitHub
# 3. Push backend code to GitHub
cd backend
git init && git add . && git commit -m "Backend ready"
git remote add origin https://github.com/YOURUSERNAME/bookingbot-backend.git
git push -u origin main

# 4. In Railway: New Project → Deploy from GitHub → Select backend repo
# 5. Add PostgreSQL service 
# 6. Add Redis service
# 7. Set environment variables (see DEPLOYMENT_GUIDE.md)
```
**Result**: Backend API running at `https://YOUR-PROJECT.railway.app`

### ✅ **Step 2: Main Website (Vercel) - 5 minutes**  
```bash
# 1. Update API URL in src/config/environment.ts
# 2. Deploy to Vercel
npm i -g vercel
vercel --prod

# 3. Add environment variables in Vercel dashboard
```
**Result**: Website running at `https://YOUR-SITE.vercel.app`

### ✅ **Step 3: Mini App (Vercel) - 5 minutes**
```bash
cd mini-app
# 1. Update API URL in src/config/api.ts  
# 2. Deploy
vercel --prod

# 3. Register with @BotFather: /newapp → Set URL
```
**Result**: Mini app at `https://YOUR-MINIAPP.vercel.app`

### ✅ **Step 4: Telegram Bot (Railway) - 10 minutes**
```bash
cd telegram-bot
# 1. Create new Railway project for bot
# 2. Set environment variables including BOT_TOKEN
# 3. Set webhook:
curl -X POST "https://api.telegram.org/bot8361818056:AAGjHfIBCLHXG5i9AeDKJH3SNcoGB8WrUrU/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR-BOT.railway.app/webhook"}'
```
**Result**: Bot running at `https://t.me/YourBotUsername`

---

## 🎯 **Option 2: DigitalOcean Droplet (Advanced - 2 hours)**

### ✅ **Server Setup - 30 minutes**
```bash
# 1. Create $12/month droplet (Ubuntu 22.04)
# 2. SSH into server
ssh root@YOUR-DROPLET-IP

# 3. Install dependencies
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs nginx postgresql postgresql-contrib redis-server
npm install -g pm2

# 4. Setup databases
sudo -u postgres createuser --createdb --pwprompt bookinguser
sudo -u postgres createdb bookingdb --owner=bookinguser
```

### ✅ **Deploy Applications - 45 minutes**
```bash
# 1. Clone and build all applications
mkdir -p /var/www/bookingbot && cd /var/www/bookingbot
git clone [your-repos]
# Build each app (see full guide)

# 2. Configure PM2
pm2 start ecosystem.config.js
pm2 save && pm2 startup

# 3. Configure Nginx (see full guide)
```

### ✅ **Domain & SSL - 45 minutes**
```bash  
# 1. Point domain to server IP
# 2. Configure Nginx virtual hosts
# 3. Get SSL certificates
certbot --nginx -d yourdomain.com -d api.yourdomain.com -d miniapp.yourdomain.com -d bot.yourdomain.com
```

---

## 🔧 **Essential Environment Variables**

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-super-secret-key
TELEGRAM_BOT_TOKEN=8361818056:AAGjHfIBCLHXG5i9AeDKJH3SNcoGB8WrUrU
FRONTEND_URL=https://your-website.vercel.app
TELEGRAM_MINI_APP_URL=https://your-miniapp.vercel.app
NODE_ENV=production
```

### Website (.env)
```env
REACT_APP_API_URL=https://your-backend.railway.app/api/v1
REACT_APP_TELEGRAM_BOT_URL=https://t.me/YourBotUsername
```

### Mini App (.env)
```env
REACT_APP_API_URL=https://your-backend.railway.app/api/v1
```

### Telegram Bot (.env)
```env
BOT_TOKEN=8361818056:AAGjHfIBCLHXG5i9AeDKJH3SNcoGB8WrUrU
API_BASE_URL=https://your-backend.railway.app
WEBHOOK_URL=https://your-bot.railway.app/webhook
```

---

## ✅ **Final Testing Checklist**

### Test All Platforms (5 minutes)
- [ ] **Backend**: `curl https://your-backend.railway.app/api/v1/health`
- [ ] **Website**: Open website, test login/registration
- [ ] **Bot**: Message bot `/start`, test commands
- [ ] **Mini App**: Open through bot menu button

### Configure Telegram Bot (5 minutes)
```bash
# Set commands with @BotFather
/setcommands
start - 🚀 Start using the bot  
bookings - 📅 View my bookings
services - 🔍 Browse services
help - ❓ Get help

# Set mini app button
/setmenubutton
https://your-miniapp.vercel.app - 📱 Open Mini App
```

---

## 🚨 **Common Issues & Quick Fixes**

| Issue | Solution |
|-------|----------|
| API connection failed | Check CORS settings, verify API URL |
| Bot not responding | Verify webhook URL and token |  
| Mini app won't load | Check HTTPS, register with @BotFather |
| Database connection error | Verify DATABASE_URL format |
| CORS errors | Add frontend URLs to backend CORS config |

---

## 🎉 **You're Live!**

**✅ Website**: https://your-website.vercel.app
**✅ Telegram Bot**: https://t.me/YourBotUsername  
**✅ Mini App**: Available through bot menu

**Total Time**: 30 minutes (Railway) or 2 hours (DigitalOcean)
**Monthly Cost**: $0-15 (Railway) or $12+ (DigitalOcean)

**🚀 Your multi-platform booking system is now live and ready for users!**