import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import { EnhancedAuthService } from '@/services/auth/enhanced';
import { createErrorResponse } from '@/utils/response';
import { config } from '@/config';
import { logger } from '@/utils/logger';

const router = express.Router();

// Initialize Google OAuth client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Google OAuth callback handler
router.get('/google', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      logger.error('Google OAuth callback: Missing authorization code');
      const frontendUrl = process.env.FRONTEND_URL || 'https://miyzapis.com';
      return res.redirect(`${frontendUrl}/auth/error?error=missing_code`);
    }

    logger.info('Processing Google OAuth callback with code');

    // Exchange authorization code for tokens
    const { tokens } = await googleClient.getToken(code as string);
    googleClient.setCredentials(tokens);

    // Verify the ID token and get user info
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      logger.error('Google OAuth callback: Invalid token payload');
      const frontendUrl = process.env.FRONTEND_URL || 'https://miyzapis.com';
      return res.redirect(`${frontendUrl}/auth/error?error=invalid_token`);
    }

    logger.info(`Google OAuth callback: Processing user ${payload.email}`);

    // Authenticate with Google data
    const googleData = {
      id: payload.sub,
      email: payload.email!,
      verified_email: payload.email_verified || false,
      name: payload.name!,
      given_name: payload.given_name!,
      family_name: payload.family_name || '',
      picture: payload.picture || '',
    };

    const requestedUserType =
      typeof state === 'string' && (state === 'customer' || state === 'specialist')
        ? state
        : undefined;
    const result = await EnhancedAuthService.authenticateWithGoogle(googleData, requestedUserType);

    logger.info(`Google OAuth callback: Authentication successful for ${payload.email}`);

    const frontendUrl = process.env.FRONTEND_URL || 'https://miyzapis.com';

    // Check if user type selection is required
    if ('requiresUserTypeSelection' in result) {
      // Store the google data in session/temporary storage for user type selection
      const redirectUrl = `${frontendUrl}/auth/select-user-type?email=${encodeURIComponent(payload.email)}`;
      res.redirect(redirectUrl);
      return;
    }

    // Redirect to frontend with tokens
    const redirectUrl = `${frontendUrl}/auth/callback?token=${result.tokens.accessToken}&refreshToken=${result.tokens.refreshToken}`;
    
    res.redirect(redirectUrl);
  } catch (error: any) {
    logger.error('Google OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'https://miyzapis.com';
    res.redirect(`${frontendUrl}/auth/error?error=oauth_failed`);
  }
});

export default router;
