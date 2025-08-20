#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

interface ProductionConfig {
  // Database
  databaseUrl: string;
  
  // Redis
  redisUrl: string;
  
  // JWT Secrets
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  
  // API Configuration
  port: number;
  corsOrigins: string[];
  
  // Email Configuration
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  emailFrom: string;
  
  // File Upload
  uploadProvider: 'local' | 's3';
  s3BucketName?: string;
  s3Region?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  
  // Payment Providers
  liqpayPublicKey?: string;
  liqpayPrivateKey?: string;
  monobankToken?: string;
  privatbankMerchantId?: string;
  privatbankMerchantPassword?: string;
  wayforpayMerchantAccount?: string;
  wayforpaySecretKey?: string;
  
  // Telegram Bot
  telegramBotToken?: string;
  telegramWebhookUrl?: string;
  
  // External URLs
  frontendUrl: string;
  apiUrl: string;
  
  // Security
  rateLimitEnabled: boolean;
  rateLimitMax: number;
  
  // Logging
  logLevel: string;
  
  // Monitoring
  sentryDsn?: string;
}

class ProductionSetup {
  private config: Partial<ProductionConfig> = {};

  async run() {
    console.log('🚀 BookingBot API Production Setup\n');
    console.log('This wizard will help you configure your production environment.\n');

    try {
      // Check prerequisites
      await this.checkPrerequisites();
      
      // Gather configuration
      await this.gatherConfiguration();
      
      // Generate secrets
      await this.generateSecrets();
      
      // Create environment file
      await this.createEnvironmentFile();
      
      // Setup database
      await this.setupDatabase();
      
      // Create systemd service (Linux)
      if (process.platform === 'linux') {
        await this.createSystemdService();
      }
      
      // Create nginx configuration
      await this.createNginxConfig();
      
      // Create PM2 ecosystem file
      await this.createPM2Config();
      
      // Security recommendations
      await this.showSecurityRecommendations();
      
      console.log('\n✅ Production setup completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Review the generated configuration files');
      console.log('2. Start the application: npm run start:prod');
      console.log('3. Setup SSL certificate with Let\'s Encrypt');
      console.log('4. Configure monitoring and backups');
      
    } catch (error) {
      console.error('\n❌ Setup failed:', error);
      process.exit(1);
    } finally {
      rl.close();
    }
  }

  private async checkPrerequisites() {
    console.log('📋 Checking prerequisites...');

    const requiredCommands = ['node', 'npm', 'git'];
    const recommendedCommands = ['nginx', 'pm2', 'certbot'];

    for (const cmd of requiredCommands) {
      try {
        execSync(`which ${cmd}`, { stdio: 'ignore' });
        console.log(`✅ ${cmd} is installed`);
      } catch {
        throw new Error(`❌ ${cmd} is not installed. Please install it first.`);
      }
    }

    for (const cmd of recommendedCommands) {
      try {
        execSync(`which ${cmd}`, { stdio: 'ignore' });
        console.log(`✅ ${cmd} is installed`);
      } catch {
        console.log(`⚠️  ${cmd} is not installed (recommended for production)`);
      }
    }
  }

  private async gatherConfiguration() {
    console.log('\n⚙️  Configuration Setup\n');

    // Database
    this.config.databaseUrl = await this.prompt('Database URL (PostgreSQL)', 'postgresql://username:password@localhost:5432/bookingbot_prod');
    
    // Redis
    this.config.redisUrl = await this.prompt('Redis URL', 'redis://localhost:6379');
    
    // API Configuration
    this.config.port = parseInt(await this.prompt('API Port', '3000'));
    const corsOrigins = await this.prompt('CORS Origins (comma-separated)', 'https://miyzapis.com,https://www.miyzapis.com');
    this.config.corsOrigins = corsOrigins.split(',').map(origin => origin.trim());
    
    // URLs
    this.config.frontendUrl = await this.prompt('Frontend URL', 'https://miyzapis.com');
    this.config.apiUrl = await this.prompt('API URL', 'https://api.miyzapis.com');
    
    // Email Configuration
    this.config.smtpHost = await this.prompt('SMTP Host', 'smtp.gmail.com');
    this.config.smtpPort = parseInt(await this.prompt('SMTP Port', '587'));
    this.config.smtpUser = await this.prompt('SMTP Username', 'your-email@gmail.com');
    this.config.smtpPassword = await this.prompt('SMTP Password', '', true);
    this.config.emailFrom = await this.prompt('From Email Address', 'noreply@miyzapis.com');
    
    // File Upload
    const uploadProvider = await this.prompt('Upload Provider (local/s3)', 'local');
    this.config.uploadProvider = uploadProvider as 'local' | 's3';
    
    if (this.config.uploadProvider === 's3') {
      this.config.s3BucketName = await this.prompt('S3 Bucket Name', 'miyzapis-files');
      this.config.s3Region = await this.prompt('S3 Region', 'eu-central-1');
      this.config.awsAccessKeyId = await this.prompt('AWS Access Key ID', '');
      this.config.awsSecretAccessKey = await this.prompt('AWS Secret Access Key', '', true);
    }
    
    // Payment Providers
    console.log('\n💳 Payment Configuration (optional - you can configure later)');
    
    const setupLiqPay = await this.confirm('Setup LiqPay?');
    if (setupLiqPay) {
      this.config.liqpayPublicKey = await this.prompt('LiqPay Public Key', '');
      this.config.liqpayPrivateKey = await this.prompt('LiqPay Private Key', '', true);
    }
    
    const setupMonobank = await this.confirm('Setup Monobank?');
    if (setupMonobank) {
      this.config.monobankToken = await this.prompt('Monobank Token', '', true);
    }
    
    // Telegram Bot
    const setupTelegram = await this.confirm('Setup Telegram Bot?');
    if (setupTelegram) {
      this.config.telegramBotToken = await this.prompt('Telegram Bot Token', '', true);
      this.config.telegramWebhookUrl = await this.prompt('Telegram Webhook URL', `${this.config.apiUrl}/webhook/telegram`);
    }
    
    // Security
    this.config.rateLimitEnabled = await this.confirm('Enable Rate Limiting?', true);
    if (this.config.rateLimitEnabled) {
      this.config.rateLimitMax = parseInt(await this.prompt('Rate Limit (requests per 15 minutes)', '1000'));
    }
    
    // Monitoring
    const setupSentry = await this.confirm('Setup Sentry for error monitoring?');
    if (setupSentry) {
      this.config.sentryDsn = await this.prompt('Sentry DSN', '');
    }
    
    // Logging
    this.config.logLevel = await this.prompt('Log Level (error/warn/info/debug)', 'info');
  }

  private async generateSecrets() {
    console.log('\n🔐 Generating secrets...');
    
    this.config.jwtAccessSecret = this.generateRandomSecret(64);
    this.config.jwtRefreshSecret = this.generateRandomSecret(64);
    
    console.log('✅ JWT secrets generated');
  }

  private generateRandomSecret(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async createEnvironmentFile() {
    console.log('\n📝 Creating environment configuration...');

    const envContent = this.generateEnvContent();
    
    writeFileSync('.env.production', envContent);
    console.log('✅ Created .env.production');
    
    // Create example file
    const exampleContent = this.generateEnvContent(true);
    writeFileSync('.env.production.example', exampleContent);
    console.log('✅ Created .env.production.example');
  }

  private generateEnvContent(isExample = false): string {
    const getValue = (value: any): string => {
      if (isExample) return 'YOUR_VALUE_HERE';
      return value || '';
    };

    return `# BookingBot API Production Configuration
# Generated on ${new Date().toISOString()}

# Environment
NODE_ENV=production
PORT=${this.config.port || 3000}

# Database
DATABASE_URL=${getValue(this.config.databaseUrl)}

# Redis
REDIS_URL=${getValue(this.config.redisUrl)}

# JWT Secrets
JWT_ACCESS_SECRET=${getValue(this.config.jwtAccessSecret)}
JWT_REFRESH_SECRET=${getValue(this.config.jwtRefreshSecret)}

# API Configuration
CORS_ORIGINS=${this.config.corsOrigins?.join(',') || ''}
FRONTEND_URL=${getValue(this.config.frontendUrl)}
API_URL=${getValue(this.config.apiUrl)}

# Email Configuration
SMTP_HOST=${getValue(this.config.smtpHost)}
SMTP_PORT=${this.config.smtpPort || 587}
SMTP_USER=${getValue(this.config.smtpUser)}
SMTP_PASSWORD=${getValue(this.config.smtpPassword)}
EMAIL_FROM=${getValue(this.config.emailFrom)}

# File Upload
UPLOAD_PROVIDER=${this.config.uploadProvider || 'local'}
${this.config.uploadProvider === 's3' ? `
S3_BUCKET_NAME=${getValue(this.config.s3BucketName)}
S3_REGION=${getValue(this.config.s3Region)}
AWS_ACCESS_KEY_ID=${getValue(this.config.awsAccessKeyId)}
AWS_SECRET_ACCESS_KEY=${getValue(this.config.awsSecretAccessKey)}
` : ''}

# Payment Providers
${this.config.liqpayPublicKey ? `
LIQPAY_PUBLIC_KEY=${getValue(this.config.liqpayPublicKey)}
LIQPAY_PRIVATE_KEY=${getValue(this.config.liqpayPrivateKey)}
` : ''}

${this.config.monobankToken ? `
MONOBANK_TOKEN=${getValue(this.config.monobankToken)}
` : ''}

# Telegram Bot
${this.config.telegramBotToken ? `
TELEGRAM_BOT_TOKEN=${getValue(this.config.telegramBotToken)}
TELEGRAM_WEBHOOK_URL=${getValue(this.config.telegramWebhookUrl)}
` : ''}

# Security
RATE_LIMIT_ENABLED=${this.config.rateLimitEnabled || false}
RATE_LIMIT_MAX=${this.config.rateLimitMax || 1000}

# Logging
LOG_LEVEL=${this.config.logLevel || 'info'}

# Monitoring
${this.config.sentryDsn ? `SENTRY_DSN=${getValue(this.config.sentryDsn)}` : ''}
`;
  }

  private async setupDatabase() {
    console.log('\n🗄️  Setting up database...');

    try {
      // Run Prisma migrations
      execSync('npx prisma generate', { stdio: 'inherit' });
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: this.config.databaseUrl }
      });
      
      console.log('✅ Database setup completed');
    } catch (error) {
      console.error('⚠️  Database setup failed. You may need to run migrations manually.');
    }
  }

  private async createSystemdService() {
    console.log('\n🔄 Creating systemd service...');

    const serviceContent = `[Unit]
Description=BookingBot API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=${process.cwd()}
Environment=NODE_ENV=production
EnvironmentFile=${process.cwd()}/.env.production
ExecStart=${process.execPath} ${join(process.cwd(), 'dist/server.js')}
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=bookingbot-api

[Install]
WantedBy=multi-user.target
`;

    writeFileSync('bookingbot-api.service', serviceContent);
    console.log('✅ Created bookingbot-api.service');
    console.log('To install: sudo cp bookingbot-api.service /etc/systemd/system/');
    console.log('To enable: sudo systemctl enable bookingbot-api');
    console.log('To start: sudo systemctl start bookingbot-api');
  }

  private async createNginxConfig() {
    console.log('\n🌐 Creating Nginx configuration...');

    const domain = this.config.apiUrl?.replace('https://', '').replace('http://', '') || 'api.miyzapis.com';

    const nginxContent = `# BookingBot API Nginx Configuration
server {
    listen 80;
    server_name ${domain};
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${domain};

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    location / {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://localhost:${this.config.port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket Support
    location /socket.io/ {
        proxy_pass http://localhost:${this.config.port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health Check
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
}
`;

    writeFileSync(`nginx-${domain}.conf`, nginxContent);
    console.log(`✅ Created nginx-${domain}.conf`);
    console.log('To install: sudo cp nginx-*.conf /etc/nginx/sites-available/');
    console.log('To enable: sudo ln -s /etc/nginx/sites-available/nginx-*.conf /etc/nginx/sites-enabled/');
  }

  private async createPM2Config() {
    console.log('\n⚡ Creating PM2 ecosystem file...');

    const pm2Config = {
      apps: [{
        name: 'bookingbot-api',
        script: 'dist/server.js',
        instances: 'max',
        exec_mode: 'cluster',
        env: {
          NODE_ENV: 'production',
          PORT: this.config.port || 3000
        },
        env_file: '.env.production',
        log_date_format: 'YYYY-MM-DD HH:mm Z',
        error_file: 'logs/err.log',
        out_file: 'logs/out.log',
        log_file: 'logs/combined.log',
        time: true,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        node_args: '--max-old-space-size=2048'
      }]
    };

    writeFileSync('ecosystem.config.js', `module.exports = ${JSON.stringify(pm2Config, null, 2)}`);
    console.log('✅ Created ecosystem.config.js');
    console.log('To start: pm2 start ecosystem.config.js');
    console.log('To monitor: pm2 monit');
  }

  private async showSecurityRecommendations() {
    console.log('\n🔒 Security Recommendations:\n');
    
    console.log('1. 🔥 Firewall Configuration:');
    console.log('   sudo ufw enable');
    console.log('   sudo ufw allow ssh');
    console.log('   sudo ufw allow "Nginx Full"');
    console.log('   sudo ufw deny 3000'); // Don't expose API port directly
    
    console.log('\n2. 🔐 SSL Certificate:');
    console.log('   sudo certbot --nginx -d api.miyzapis.com');
    
    console.log('\n3. 👤 User Permissions:');
    console.log('   - Run the application as www-data user');
    console.log('   - Set proper file permissions (644 for files, 755 for directories)');
    console.log('   - Protect .env files (chmod 600)');
    
    console.log('\n4. 📊 Monitoring:');
    console.log('   - Setup log rotation');
    console.log('   - Monitor application metrics');
    console.log('   - Setup alerts for errors and performance issues');
    
    console.log('\n5. 🗄️  Database Security:');
    console.log('   - Use connection pooling');
    console.log('   - Regular backups');
    console.log('   - Database user with minimal permissions');
    
    console.log('\n6. 🔄 Updates:');
    console.log('   - Keep dependencies updated');
    console.log('   - Regular security patches');
    console.log('   - Automated vulnerability scanning');
  }

  private async prompt(question: string, defaultValue?: string, isPassword = false): Promise<string> {
    return new Promise((resolve) => {
      const displayDefault = defaultValue ? ` (${isPassword ? '*'.repeat(8) : defaultValue})` : '';
      rl.question(`${question}${displayDefault}: `, (answer) => {
        resolve(answer.trim() || defaultValue || '');
      });
    });
  }

  private async confirm(question: string, defaultValue = false): Promise<boolean> {
    return new Promise((resolve) => {
      const defaultText = defaultValue ? 'Y/n' : 'y/N';
      rl.question(`${question} (${defaultText}): `, (answer) => {
        if (!answer) {
          resolve(defaultValue);
        } else {
          resolve(['y', 'yes', '1', 'true'].includes(answer.toLowerCase()));
        }
      });
    });
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  new ProductionSetup().run();
}

export { ProductionSetup };