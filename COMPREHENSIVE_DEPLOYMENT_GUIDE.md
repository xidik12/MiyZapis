# BookingBot Platform - Comprehensive Deployment Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Infrastructure Setup](#infrastructure-setup)
4. [Database Configuration](#database-configuration)
5. [Backend API Deployment](#backend-api-deployment)
6. [Frontend Website Deployment](#frontend-website-deployment)
7. [Telegram Bot Deployment](#telegram-bot-deployment)
8. [Telegram Mini App Deployment](#telegram-mini-app-deployment)
9. [Environment Configuration](#environment-configuration)
10. [SSL/TLS Configuration](#ssltls-configuration)
11. [Domain Setup](#domain-setup)
12. [Monitoring & Logging](#monitoring--logging)
13. [Backup & Recovery](#backup--recovery)
14. [Scaling & Performance](#scaling--performance)
15. [Security Configuration](#security-configuration)
16. [Troubleshooting](#troubleshooting)
17. [Maintenance](#maintenance)

## Overview

The BookingBot Platform consists of four main components:
- **Backend API**: Node.js/Express API server with PostgreSQL and Redis
- **Frontend Website**: React/Vite web application 
- **Telegram Bot**: Node.js Telegram bot service
- **Telegram Mini App**: React mini application for Telegram

## Prerequisites

### Required Services
- VPS/Cloud Server (minimum 2GB RAM, 2 vCPU, 20GB storage)
- Domain name with DNS management
- SSL certificate (Let's Encrypt recommended)
- PostgreSQL database
- Redis cache
- Telegram Bot Token (from @BotFather)
- Stripe account (for payments)
- Email service (SMTP)

### Required Software
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt-get install docker-compose-plugin

# Install Nginx
sudo apt update
sudo apt install nginx

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx

# Install PM2 for process management
npm install -g pm2
```

## Infrastructure Setup

### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Create application user
sudo adduser bookingbot
sudo usermod -aG sudo bookingbot
sudo usermod -aG docker bookingbot

# Switch to application user
su - bookingbot

# Create application directories
mkdir -p ~/bookingbot/{backend,frontend,telegram-bot,mini-app,logs,backups}
```

### 2. Firewall Configuration
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp  # Backend API
sudo ufw allow 5432/tcp  # PostgreSQL (internal only)
sudo ufw allow 6379/tcp  # Redis (internal only)
```

## Database Configuration

### 1. PostgreSQL Setup
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
```

```sql
-- In PostgreSQL shell
CREATE DATABASE booking_platform;
CREATE USER booking_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE booking_platform TO booking_user;
ALTER USER booking_user CREATEDB;
\q
```

### 2. Redis Setup
```bash
# Install Redis
sudo apt install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: requirepass your_redis_password
# Set: maxmemory 256mb
# Set: maxmemory-policy allkeys-lru

# Start Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### 3. Database Security
```bash
# Configure PostgreSQL security
sudo nano /etc/postgresql/15/main/pg_hba.conf
# Change peer to md5 for local connections

sudo nano /etc/postgresql/15/main/postgresql.conf
# Set: listen_addresses = 'localhost'
# Set: port = 5432

sudo systemctl restart postgresql
```

## Backend API Deployment

### 1. Clone and Setup
```bash
cd ~/bookingbot/backend
git clone https://github.com/yourusername/BookingBot.git .

# Install dependencies
npm install

# Build the application
npm run build
```

### 2. Environment Configuration
```bash
# Create production environment file
nano .env.production
```

```env
# Server Configuration
NODE_ENV=production
PORT=3000
API_URL=https://api.yourdomain.com

# Database
DATABASE_URL=postgresql://booking_user:your_secure_password@localhost:5432/booking_platform

# Redis
REDIS_URL=redis://:your_redis_password@localhost:6379

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
TELEGRAM_WEBHOOK_URL=https://api.yourdomain.com/webhook/telegram

# Email (SMTP)
SMTP_HOST=smtp.your-email-provider.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@yourdomain.com

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,application/pdf

# Security
CORS_ORIGIN=https://yourdomain.com,https://t.me
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
LOG_DIR=./logs
```

### 3. Database Migration
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed initial data (optional)
npm run db:seed
```

### 4. PM2 Process Management
```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'bookingbot-api',
    script: 'dist/server.js',
    cwd: '/home/bookingbot/bookingbot/backend',
    env_file: '.env.production',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    watch: false,
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

```bash
# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Frontend Website Deployment

### 1. Build Setup
```bash
cd ~/bookingbot/frontend

# Install dependencies
npm install

# Create production environment
nano .env.production
```

```env
VITE_API_URL=https://api.yourdomain.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
VITE_TELEGRAM_BOT_USERNAME=your_bot_username
VITE_APP_URL=https://yourdomain.com
```

```bash
# Build for production
npm run build

# Copy built files to web directory
sudo mkdir -p /var/www/bookingbot
sudo cp -r dist/* /var/www/bookingbot/
sudo chown -R www-data:www-data /var/www/bookingbot
```

### 2. Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/bookingbot
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Frontend Application
    location / {
        root /var/www/bookingbot;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API Proxy
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # WebSocket Support
    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API Subdomain
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/bookingbot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Telegram Bot Deployment

### 1. Setup Bot Service
```bash
cd ~/bookingbot/telegram-bot

# Install dependencies
npm install

# Build the bot
npm run build

# Create environment file
nano .env.production
```

```env
NODE_ENV=production
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
API_BASE_URL=https://api.yourdomain.com
WEBHOOK_URL=https://api.yourdomain.com/webhook/telegram
PORT=3001

# Database (same as backend)
DATABASE_URL=postgresql://booking_user:your_secure_password@localhost:5432/booking_platform

# Redis (same as backend)
REDIS_URL=redis://:your_redis_password@localhost:6379

# Logging
LOG_LEVEL=info
LOG_DIR=./logs
```

### 2. PM2 Configuration for Bot
```bash
nano ecosystem.bot.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'bookingbot-telegram',
    script: 'dist/index.js',
    cwd: '/home/bookingbot/bookingbot/telegram-bot',
    env_file: '.env.production',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '500M',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    watch: false,
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

```bash
# Start Telegram bot
pm2 start ecosystem.bot.config.js
pm2 save
```

### 3. Set Telegram Webhook
```bash
# Set webhook URL
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://api.yourdomain.com/webhook/telegram"}'
```

## Telegram Mini App Deployment

### 1. Build Mini App
```bash
cd ~/bookingbot/mini-app

# Install dependencies
npm install

# Create environment file
nano .env.production
```

```env
VITE_API_URL=https://api.yourdomain.com
VITE_TELEGRAM_BOT_USERNAME=your_bot_username
VITE_APP_URL=https://miniapp.yourdomain.com
```

```bash
# Build for production
npm run build

# Deploy to web directory
sudo mkdir -p /var/www/miniapp
sudo cp -r dist/* /var/www/miniapp/
sudo chown -R www-data:www-data /var/www/miniapp
```

### 2. Mini App Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/miniapp
```

```nginx
server {
    listen 443 ssl http2;
    server_name miniapp.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # Telegram Mini App specific headers
    add_header X-Frame-Options "ALLOWALL";
    add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'; frame-ancestors https://web.telegram.org;";
    
    location / {
        root /var/www/miniapp;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

```bash
# Enable mini app site
sudo ln -s /etc/nginx/sites-available/miniapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL/TLS Configuration

### 1. Obtain SSL Certificates
```bash
# Stop nginx temporarily
sudo systemctl stop nginx

# Get certificates for all domains
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com -d miniapp.yourdomain.com

# Start nginx
sudo systemctl start nginx
```

### 2. Auto-renewal Setup
```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Add to crontab
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx
```

## Domain Setup

### 1. DNS Configuration
Configure the following DNS records:

```
Type    Name        Value                   TTL
A       @           your.server.ip.address  300
A       www         your.server.ip.address  300
A       api         your.server.ip.address  300
A       miniapp     your.server.ip.address  300
CNAME   *.yourdomain.com  yourdomain.com     300
```

### 2. Telegram Bot Configuration
```bash
# Set bot commands
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setMyCommands" \
     -H "Content-Type: application/json" \
     -d '{
       "commands": [
         {"command": "start", "description": "Start the bot"},
         {"command": "book", "description": "Book a service"},
         {"command": "mybookings", "description": "View my bookings"},
         {"command": "help", "description": "Get help"}
       ]
     }'

# Set mini app URL
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setChatMenuButton" \
     -H "Content-Type: application/json" \
     -d '{
       "menu_button": {
         "type": "web_app",
         "text": "BookingBot",
         "web_app": {"url": "https://miniapp.yourdomain.com"}
       }
     }'
```

## Monitoring & Logging

### 1. PM2 Monitoring
```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### 2. System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Setup system monitoring
nano ~/monitor.sh
```

```bash
#!/bin/bash
# Basic system monitoring script

echo "=== System Status $(date) ===" >> ~/logs/system.log
echo "CPU Usage:" >> ~/logs/system.log
top -bn1 | grep "Cpu(s)" >> ~/logs/system.log
echo "Memory Usage:" >> ~/logs/system.log
free -h >> ~/logs/system.log
echo "Disk Usage:" >> ~/logs/system.log
df -h >> ~/logs/system.log
echo "=== End ===" >> ~/logs/system.log
```

```bash
chmod +x ~/monitor.sh

# Add to crontab
crontab -e
# Add: */15 * * * * /home/bookingbot/monitor.sh
```

### 3. Application Logs
```bash
# Create log rotation for application logs
sudo nano /etc/logrotate.d/bookingbot
```

```
/home/bookingbot/bookingbot/*/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 bookingbot bookingbot
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Backup & Recovery

### 1. Database Backup
```bash
# Create backup script
nano ~/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/bookingbot/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="booking_platform"
DB_USER="booking_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
PGPASSWORD="your_secure_password" pg_dump -h localhost -U $DB_USER $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Application files backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /home/bookingbot/bookingbot --exclude=node_modules --exclude=dist --exclude=logs

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE" >> $BACKUP_DIR/backup.log
```

```bash
chmod +x ~/backup.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /home/bookingbot/backup.sh
```

### 2. Recovery Procedures
```bash
# Database recovery
nano ~/restore.sh
```

```bash
#!/bin/bash
BACKUP_FILE=$1
DB_NAME="booking_platform"
DB_USER="booking_user"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    exit 1
fi

# Stop applications
pm2 stop all

# Restore database
gunzip -c $BACKUP_FILE | PGPASSWORD="your_secure_password" psql -h localhost -U $DB_USER $DB_NAME

# Start applications
pm2 start all

echo "Database restored from: $BACKUP_FILE"
```

```bash
chmod +x ~/restore.sh
```

## Scaling & Performance

### 1. Database Optimization
```bash
# Connect to PostgreSQL
sudo -u postgres psql booking_platform
```

```sql
-- Create performance indexes
CREATE INDEX CONCURRENTLY idx_bookings_status_scheduled ON bookings(status, scheduled_at);
CREATE INDEX CONCURRENTLY idx_users_active_type ON users(is_active, user_type);
CREATE INDEX CONCURRENTLY idx_specialists_verified_city ON specialists(is_verified, city);
CREATE INDEX CONCURRENTLY idx_services_active_category ON services(is_active, category_id);

-- Update table statistics
ANALYZE;
```

### 2. Redis Configuration
```bash
sudo nano /etc/redis/redis.conf
```

```
# Performance optimizations
maxmemory 512mb
maxmemory-policy allkeys-lru
tcp-keepalive 60
timeout 300

# Persistence
save 900 1
save 300 10
save 60 10000
```

### 3. Nginx Optimization
```bash
sudo nano /etc/nginx/nginx.conf
```

```nginx
user www-data;
worker_processes auto;
worker_connections 1024;

http {
    # Basic optimization
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=login:10m rate=10r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    
    include /etc/nginx/sites-enabled/*;
}
```

## Security Configuration

### 1. Firewall Rules
```bash
# Configure UFW
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow from 127.0.0.1 to any port 3000
sudo ufw allow from 127.0.0.1 to any port 5432
sudo ufw allow from 127.0.0.1 to any port 6379
sudo ufw enable
```

### 2. Fail2Ban Setup
```bash
# Install Fail2Ban
sudo apt install fail2ban

# Configure Fail2Ban
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
```

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Security Headers
Already configured in Nginx, but ensure these headers are present:
- `X-Frame-Options`
- `X-XSS-Protection`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Content-Security-Policy`

## Troubleshooting

### Common Issues and Solutions

#### 1. API Server Not Starting
```bash
# Check logs
pm2 logs bookingbot-api

# Check database connection
npm run db:generate
npx prisma migrate status

# Check environment variables
cat .env.production
```

#### 2. Database Connection Issues
```bash
# Test PostgreSQL connection
PGPASSWORD="your_password" psql -h localhost -U booking_user -d booking_platform -c "SELECT 1;"

# Check PostgreSQL status
sudo systemctl status postgresql
sudo journalctl -u postgresql
```

#### 3. Redis Connection Issues
```bash
# Test Redis connection
redis-cli -a your_redis_password ping

# Check Redis status
sudo systemctl status redis-server
sudo journalctl -u redis-server
```

#### 4. Telegram Bot Issues
```bash
# Check webhook status
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"

# Check bot logs
pm2 logs bookingbot-telegram

# Reset webhook
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook"
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://api.yourdomain.com/webhook/telegram"}'
```

#### 5. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Test SSL configuration
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Renew certificates
sudo certbot renew --force-renewal
```

#### 6. Frontend Not Loading
```bash
# Check Nginx status
sudo systemctl status nginx
sudo nginx -t

# Check file permissions
ls -la /var/www/bookingbot/

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Health Check Endpoints

#### API Health Check
```bash
curl https://api.yourdomain.com/health
```

#### Database Health Check
```bash
curl https://api.yourdomain.com/health/db
```

#### Redis Health Check
```bash
curl https://api.yourdomain.com/health/redis
```

## Maintenance

### Daily Tasks
- Check application logs for errors
- Monitor system resources (CPU, memory, disk)
- Verify backup completion
- Check SSL certificate expiry

### Weekly Tasks
- Review security logs
- Update system packages
- Check database performance
- Review application metrics

### Monthly Tasks
- Update Node.js dependencies (after testing)
- Review and optimize database queries
- Update security configurations
- Performance review and optimization

### Update Procedures

#### 1. Application Updates
```bash
# Create backup before update
~/backup.sh

# Pull latest code
cd ~/bookingbot
git pull origin main

# Update dependencies
npm install

# Run database migrations
npx prisma migrate deploy

# Build application
npm run build

# Restart services
pm2 restart all

# Verify deployment
curl https://api.yourdomain.com/health
```

#### 2. System Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js (if needed)
# Check current version: node -v
# Update using NodeSource repository

# Restart services after system updates
sudo systemctl restart nginx
pm2 restart all
```

### Monitoring Commands

```bash
# Check all services status
pm2 status
sudo systemctl status nginx postgresql redis-server

# Monitor real-time logs
pm2 logs --lines 50

# Check system resources
htop
df -h
free -h

# Check network connections
netstat -tulpn | grep LISTEN

# Check database connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## Support and Documentation

For additional support:
- Check application logs in `~/bookingbot/*/logs/`
- Review PM2 logs with `pm2 logs`
- Monitor system logs with `sudo journalctl -f`
- Check Nginx logs in `/var/log/nginx/`

This deployment guide provides a comprehensive foundation for deploying the BookingBot platform in a production environment. Always test changes in a staging environment before applying to production.