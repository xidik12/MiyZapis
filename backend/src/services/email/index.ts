import nodemailer from 'nodemailer';
import { config } from '@/config';
import { logger } from '@/utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailVerificationData {
  firstName: string;
  verificationLink: string;
}

interface PasswordResetData {
  firstName: string;
  resetLink: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      logger.info('Initializing email service...', {
        host: config.email.smtp.host || 'NOT_SET',
        port: config.email.smtp.port,
        user: config.email.smtp.auth.user ? `${config.email.smtp.auth.user.substring(0, 5)}...` : 'NOT_SET',
        pass: config.email.smtp.auth.pass ? '[CONFIGURED]' : 'NOT_SET',
        secure: config.email.smtp.secure
      });

      if (!config.email.smtp.host) {
        logger.warn('Email service disabled - SMTP_HOST not configured');
        return;
      }

      if (!config.email.smtp.auth.user) {
        logger.warn('Email service disabled - SMTP_USER not configured');
        return;
      }

      if (!config.email.smtp.auth.pass) {
        logger.warn('Email service disabled - SMTP_PASS not configured');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure,
        auth: {
          user: config.email.smtp.auth.user,
          pass: config.email.smtp.auth.pass,
        },
        // Add additional options for better reliability
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 5000, // 5 seconds
        socketTimeout: 10000, // 10 seconds
      });

      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      logger.warn('Email service not available - skipping email send');
      return false;
    }

    try {
      const result = await this.transporter.sendMail({
        from: config.email.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      logger.info('Email sent successfully', { 
        to: options.to, 
        subject: options.subject,
        messageId: result.messageId 
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  async sendVerificationEmail(email: string, data: EmailVerificationData): Promise<boolean> {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your Email - MiyZapis</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .button { 
          display: inline-block; 
          background: #007bff; 
          color: white; 
          padding: 12px 30px; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0; 
        }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to MiyZapis!</h1>
        </div>
        <div class="content">
          <h2>Hi ${data.firstName}!</h2>
          <p>Thank you for registering with MiyZapis, your trusted booking platform.</p>
          <p>To complete your registration and verify your email address, please click the button below:</p>
          <p style="text-align: center;">
            <a href="${data.verificationLink}" class="button">Verify Email Address</a>
          </p>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #007bff;">${data.verificationLink}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p>If you didn't create an account with MiyZapis, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2024 MiyZapis. All rights reserved.</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const text = `
    Welcome to MiyZapis!
    
    Hi ${data.firstName}!
    
    Thank you for registering with MiyZapis. To complete your registration, please verify your email address by clicking the link below:
    
    ${data.verificationLink}
    
    This link will expire in 24 hours.
    
    If you didn't create an account with MiyZapis, you can safely ignore this email.
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email - MiyZapis',
      html,
      text,
    });
  }

  async sendPasswordResetEmail(email: string, data: PasswordResetData): Promise<boolean> {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password - MiyZapis</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .button { 
          display: inline-block; 
          background: #dc3545; 
          color: white; 
          padding: 12px 30px; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0; 
        }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hi ${data.firstName}!</h2>
          <p>We received a request to reset your password for your MiyZapis account.</p>
          <p>Click the button below to reset your password:</p>
          <p style="text-align: center;">
            <a href="${data.resetLink}" class="button">Reset Password</a>
          </p>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #dc3545;">${data.resetLink}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
        </div>
        <div class="footer">
          <p>© 2024 MiyZapis. All rights reserved.</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const text = `
    Password Reset Request - MiyZapis
    
    Hi ${data.firstName}!
    
    We received a request to reset your password for your MiyZapis account.
    
    Click the link below to reset your password:
    ${data.resetLink}
    
    This link will expire in 1 hour.
    
    If you didn't request a password reset, you can safely ignore this email.
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password - MiyZapis',
      html,
      text,
    });
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to MiyZapis!</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .feature { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 5px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to MiyZapis!</h1>
        </div>
        <div class="content">
          <h2>Hi ${firstName}!</h2>
          <p>Your email has been verified successfully! Welcome to MiyZapis - your trusted booking platform.</p>
          
          <div class="feature">
            <h3>🔍 Discover Services</h3>
            <p>Browse and book from hundreds of verified specialists in your area.</p>
          </div>
          
          <div class="feature">
            <h3>📱 Multi-Platform Access</h3>
            <p>Access MiyZapis on web, Telegram bot, or our mini app.</p>
          </div>
          
          <div class="feature">
            <h3>💰 Earn Loyalty Points</h3>
            <p>Get rewarded for every booking and refer friends to earn more!</p>
          </div>
          
          <p>Ready to get started? Log in to your account and explore what MiyZapis has to offer!</p>
        </div>
        <div class="footer">
          <p>© 2024 MiyZapis. All rights reserved.</p>
          <p>Need help? Contact our support team anytime.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '🎉 Welcome to MiyZapis!',
      html,
    });
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
export { EmailService };