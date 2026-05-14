// Inbound webhook handlers (Resend delivery events, future: Stripe).
// Express server.ts already captures req.rawBody for any path containing /webhooks/.
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { logger } from '@/utils/logger';
import { prisma } from '@/config/database';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';

const router = Router();

interface ResendEvent {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string | string[];
    from?: string;
    subject?: string;
    bounce?: { type?: string; subType?: string };
    [k: string]: unknown;
  };
}

interface RawBodyRequest extends Request {
  rawBody?: string;
}

// Resend signs webhook payloads with Svix headers when a webhook signing secret
// is configured in the Resend dashboard. We verify if RESEND_WEBHOOK_SECRET is set;
// otherwise we accept and log (acceptable while testing).
function verifyResendSignature(req: RawBodyRequest): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return true; // signing not configured — accept

  const svixId = req.headers['svix-id'] as string | undefined;
  const svixTimestamp = req.headers['svix-timestamp'] as string | undefined;
  const svixSignature = req.headers['svix-signature'] as string | undefined;
  if (!svixId || !svixTimestamp || !svixSignature || !req.rawBody) return false;

  // Svix signs `${svix-id}.${svix-timestamp}.${body}` with HMAC-SHA256 (base64).
  const cleanSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  const keyBytes = Buffer.from(cleanSecret, 'base64');
  const toSign = `${svixId}.${svixTimestamp}.${req.rawBody}`;
  const expected = crypto.createHmac('sha256', keyBytes).update(toSign).digest('base64');

  // Header may contain multiple versioned signatures: "v1,xxx v1,yyy"
  for (const part of svixSignature.split(' ')) {
    const [, sig] = part.split(',');
    if (sig && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return true;
  }
  return false;
}

router.post('/resend', async (req: RawBodyRequest, res: Response) => {
  try {
    if (!verifyResendSignature(req)) {
      logger.warn('Resend webhook signature invalid');
      return res.status(401).json(createErrorResponse('INVALID_SIGNATURE', 'Webhook signature invalid', req.id));
    }

    const event = req.body as ResendEvent;
    const recipient = Array.isArray(event.data?.to) ? event.data?.to[0] : event.data?.to;

    logger.info('Resend webhook event', {
      type: event.type,
      emailId: event.data?.email_id,
      recipient,
      subject: event.data?.subject,
    });

    // Best-effort persistence to EmailLog if the table exists. Schema may
    // not have an `event` field on every deploy — guard with try/catch so a
    // missing column doesn't reject the webhook (Resend would retry forever).
    if (recipient && event.type) {
      try {
        await prisma.$executeRawUnsafe(
          'INSERT INTO "EmailLog" ("recipient", "subject", "status", "messageId", "createdAt") ' +
            'VALUES ($1, $2, $3, $4, NOW())',
          recipient,
          event.data?.subject ?? '',
          event.type.toUpperCase(),
          event.data?.email_id ?? null,
        );
      } catch (err) {
        logger.warn('EmailLog insert skipped', { error: (err as Error).message });
      }
    }

    return res.json(createSuccessResponse({ received: true }));
  } catch (err) {
    logger.error('Resend webhook handler error', { error: (err as Error).message });
    return res.status(500).json(createErrorResponse('WEBHOOK_ERROR', 'Webhook processing failed', req.id));
  }
});

export default router;
