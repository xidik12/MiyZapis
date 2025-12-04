import { Request, Response, NextFunction } from 'express';
import { json } from 'express';

/**
 * Middleware to preserve raw body for webhook signature verification
 * This is critical for webhooks like Coinbase Commerce that verify HMAC signatures
 * against the exact bytes sent, not a re-stringified JSON
 *
 * MUST be used INSTEAD of express.json() for webhook routes
 */
export const webhookRawBodyParser = (req: Request, res: Response, next: NextFunction) => {
  // Only apply to webhook routes
  if (req.path.includes('/webhooks/')) {
    let data = '';

    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      data += chunk;
    });

    req.on('end', () => {
      (req as any).rawBody = data;
      // Parse the JSON manually
      try {
        req.body = JSON.parse(data);
      } catch (error) {
        req.body = {};
      }
      next();
    });
  } else {
    // For non-webhook routes, continue to next middleware
    next();
  }
};
