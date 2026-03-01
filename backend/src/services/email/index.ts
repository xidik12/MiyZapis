// Consolidated email service - all functionality lives in the enhanced module
// The enhanced version is the canonical implementation with template support,
// email logging, booking notifications, trial emails, and compatibility methods
// for the original API (sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail)
export { EmailService, EnhancedEmailService, emailService } from './enhanced-email';
