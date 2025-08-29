import { Resend } from 'resend';
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

class ResendEmailService {
  private resend: Resend | null = null;

  constructor() {
    this.initializeResend();
  }

  private initializeResend() {
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      
      logger.info('Initializing Resend email service...', {
        apiKeyConfigured: !!resendApiKey,
        keyPrefix: resendApiKey ? `${resendApiKey.substring(0, 8)}...` : 'NOT_SET'
      });

      if (!resendApiKey) {
        logger.warn('Resend email service disabled - RESEND_API_KEY not configured');
        return;
      }

      this.resend = new Resend(resendApiKey);
      logger.info('✅ Resend email service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize Resend email service:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    logger.info('📧 Starting Resend email send process', {
      to: options.to,
      subject: options.subject,
      resendAvailable: !!this.resend
    });

    if (!this.resend) {
      logger.warn('❌ Resend service not available - API key not configured');
      return false;
    }

    try {
      logger.info('📤 Attempting to send email via Resend');

      const result = await this.resend.emails.send({
        from: 'MiyZapis <onboarding@resend.dev>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (result.error) {
        logger.error('❌ Resend API returned error', {
          error: result.error,
          to: options.to,
          subject: options.subject
        });
        return false;
      }

      logger.info('✅ Email sent successfully via Resend', { 
        to: options.to, 
        subject: options.subject,
        id: result.data?.id
      });
      
      return true;
    } catch (error: any) {
      logger.error('❌ Failed to send email via Resend', {
        to: options.to,
        subject: options.subject,
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack
        }
      });
      return false;
    }
  }

  async sendVerificationEmail(email: string, data: EmailVerificationData): Promise<boolean> {
    logger.info('📧 sendVerificationEmail called (Resend)', {
      email: email,
      firstName: data.firstName,
      verificationLink: data.verificationLink.replace(/token=[^&]+/, 'token=[HIDDEN]')
    });

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your Email - MiyZapis</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 40px 30px; background: #ffffff; }
        .button { 
          display: inline-block; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white !important; 
          padding: 16px 32px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600;
          text-align: center;
          margin: 20px 0; 
        }
        .footer { 
          background: #f8fafc; 
          padding: 20px; 
          text-align: center; 
          font-size: 14px; 
          color: #64748b; 
          border-radius: 0 0 8px 8px;
        }
        .link { color: #667eea; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to MiyZapis!</h1>
        </div>
        <div class="content">
          <h2 style="color: #1e293b; margin-top: 0;">Hi ${data.firstName}!</h2>
          <p style="font-size: 16px; margin-bottom: 24px;">Thank you for registering with MiyZapis, your trusted booking platform.</p>
          <p style="font-size: 16px; margin-bottom: 24px;">To complete your registration and verify your email address, please click the button below:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.verificationLink}" class="button">Verify Email Address</a>
          </div>
          <p style="font-size: 14px; color: #64748b;">If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="font-size: 14px;" class="link">${data.verificationLink}</p>
          <p style="font-size: 14px; color: #dc2626; font-weight: 600; margin-top: 24px;">⏰ This link will expire in 24 hours.</p>
          <p style="font-size: 14px; color: #64748b;">If you didn't create an account with MiyZapis, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p style="margin: 0;">© 2025 MiyZapis. All rights reserved.</p>
          <p style="margin: 8px 0 0 0;">This is an automated email, please do not reply.</p>
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
      subject: '🎉 Verify Your Email - MiyZapis',
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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 40px 30px; background: #ffffff; }
        .button { 
          display: inline-block; 
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
          color: white !important; 
          padding: 16px 32px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600;
          text-align: center;
          margin: 20px 0; 
        }
        .footer { 
          background: #f8fafc; 
          padding: 20px; 
          text-align: center; 
          font-size: 14px; 
          color: #64748b; 
          border-radius: 0 0 8px 8px;
        }
        .link { color: #dc2626; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">🔐 Password Reset Request</h1>
        </div>
        <div class="content">
          <h2 style="color: #1e293b; margin-top: 0;">Hi ${data.firstName}!</h2>
          <p style="font-size: 16px; margin-bottom: 24px;">We received a request to reset your password for your MiyZapis account.</p>
          <p style="font-size: 16px; margin-bottom: 24px;">Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.resetLink}" class="button">Reset Password</a>
          </div>
          <p style="font-size: 14px; color: #64748b;">If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="font-size: 14px;" class="link">${data.resetLink}</p>
          <p style="font-size: 14px; color: #dc2626; font-weight: 600; margin-top: 24px;">⏰ This link will expire in 1 hour.</p>
          <p style="font-size: 14px; color: #64748b;">If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
        </div>
        <div class="footer">
          <p style="margin: 0;">© 2025 MiyZapis. All rights reserved.</p>
          <p style="margin: 8px 0 0 0;">This is an automated email, please do not reply.</p>
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
      subject: '🔐 Reset Your Password - MiyZapis',
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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 40px 30px; background: #ffffff; }
        .feature { margin: 24px 0; padding: 20px; background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0; }
        .footer { 
          background: #f8fafc; 
          padding: 20px; 
          text-align: center; 
          font-size: 14px; 
          color: #64748b; 
          border-radius: 0 0 8px 8px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to MiyZapis!</h1>
        </div>
        <div class="content">
          <h2 style="color: #1e293b; margin-top: 0;">Hi ${firstName}!</h2>
          <p style="font-size: 16px; margin-bottom: 24px;">Your email has been verified successfully! Welcome to MiyZapis - your trusted booking platform.</p>
          
          <div class="feature">
            <h3 style="color: #1e40af; margin: 0 0 12px 0;">🔍 Discover Services</h3>
            <p style="margin: 0; color: #475569;">Browse and book from hundreds of verified specialists in your area.</p>
          </div>
          
          <div class="feature">
            <h3 style="color: #1e40af; margin: 0 0 12px 0;">📱 Multi-Platform Access</h3>
            <p style="margin: 0; color: #475569;">Access MiyZapis on web, Telegram bot, or our mini app.</p>
          </div>
          
          <div class="feature">
            <h3 style="color: #1e40af; margin: 0 0 12px 0;">💰 Earn Loyalty Points</h3>
            <p style="margin: 0; color: #475569;">Get rewarded for every booking and refer friends to earn more!</p>
          </div>
          
          <p style="font-size: 16px; margin: 32px 0 0 0;">Ready to get started? Log in to your account and explore what MiyZapis has to offer!</p>
        </div>
        <div class="footer">
          <p style="margin: 0;">© 2025 MiyZapis. All rights reserved.</p>
          <p style="margin: 8px 0 0 0;">Need help? Contact our support team anytime.</p>
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
}

export const resendEmailService = new ResendEmailService();
export { ResendEmailService };