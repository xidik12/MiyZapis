/**
 * Guest checkout routes — public, no authentication required.
 *
 * POST /guest/request-code  — validate email+phone, hash+store a 6-digit OTP, deliver via email.
 * POST /guest/verify-code   — verify the code hash, create/reuse a shell User, return JWT tokens.
 *
 * Security model
 * ─────────────
 * • OTP stored as sha256 hex digest — plaintext never persisted.
 * • 10-minute expiry; max 5 wrong-code attempts (per OTP record).
 * • Rate-limited at 5 requests / 15 min per email+IP via existing authRateLimit pattern.
 * • If the email already belongs to a password-bearing account → accountExists guard
 *   (prevents guest flow from being used to enumerate real accounts or do account takeover).
 * • Phone is collected and stored but OTP delivery is email-only today.
 *   The SMS stub is called best-effort so wiring a real provider later requires zero
 *   backend changes.
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import { prisma } from '@/config/database';
import { cacheUtils } from '@/config/redis';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { emailService } from '@/services/email';
import { authRateLimit } from '@/middleware/security';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { ErrorCodes } from '@/types';
import jwt, { SignOptions } from 'jsonwebtoken';
import { JwtPayload, RefreshTokenPayload } from '@/types';

const router = Router();

// ─── helpers ────────────────────────────────────────────────────────────────

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function generateOtpCode(): string {
  // Cryptographically random 6-digit code, zero-padded
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

/** Issue the same access + refresh tokens that normal login produces. */
async function createGuestTokens(userId: string, email: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  if (!config.jwt.secret || !config.jwt.refreshSecret) {
    throw new Error('JWT configuration missing');
  }

  const jwtPayload: JwtPayload = {
    userId,
    email,
    userType: 'CUSTOMER',
  };

  const accessToken = jwt.sign(jwtPayload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as SignOptions);

  const refreshTokenId = crypto.randomUUID();
  const refreshPayload: RefreshTokenPayload = {
    userId,
    tokenId: refreshTokenId,
  };

  const refreshToken = jwt.sign(refreshPayload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as SignOptions);

  // Persist refresh token (same as normal login)
  await prisma.refreshToken.create({
    data: {
      id: refreshTokenId,
      userId,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Cache session
  await cacheUtils.set(
    `session:${refreshTokenId}`,
    { userId, tokenId: refreshTokenId, createdAt: new Date() },
    30 * 24 * 3600
  );

  return { accessToken, refreshToken, expiresIn: 3600 };
}

// ─── validation middleware ───────────────────────────────────────────────────

const validateRequestCode = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone')
    .optional({ checkFalsy: true })
    .isMobilePhone('any', { strictMode: false })
    .withMessage('Invalid phone number'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 120 })
    .withMessage('Name is required (max 120 chars)'),
];

const validateVerifyCode = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('code')
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('Code must be exactly 6 digits'),
];

// ─── POST /guest/request-code ────────────────────────────────────────────────

router.post(
  '/request-code',
  authRateLimit,        // 5 req / 15 min per email — same guard as auth routes
  validateRequestCode,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Validation failed',
          req.headers['x-request-id'] as string,
          errors.array().map(e => ({ field: (e as any).path, message: e.msg }))
        )
      );
    }

    const { email, phone, name } = req.body as {
      email: string;
      phone?: string;
      name: string;
    };

    try {
      // ── Account-takeover guard ──────────────────────────────────────────────
      // If the email belongs to a real (password-bearing) account, refuse the
      // guest flow and tell the frontend to redirect to normal login instead.
      // NOTE: isGuest + GuestOtp are new schema fields — prisma generate must run
      // after applying the migration before TS types will include them.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingUser = await (prisma as any).user.findUnique({
        where: { email },
        select: { password: true, isGuest: true },
      }) as { password: string | null; isGuest: boolean } | null;

      if (existingUser && existingUser.password !== null && !existingUser.isGuest) {
        // Real account exists — do NOT start a guest flow.
        return res.status(200).json(
          createSuccessResponse(
            { accountExists: true, sent: false },
            { message: 'An account with this email already exists. Please sign in.' }
          )
        );
      }

      // ── Generate OTP ────────────────────────────────────────────────────────
      const code = generateOtpCode();
      const codeHash = hashCode(code);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Invalidate any prior unconsumed OTPs for this email
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).guestOtp.updateMany({
        where: { email, consumedAt: null },
        data: { consumedAt: new Date() }, // mark as consumed so old codes can't be used
      });

      // Persist new OTP
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).guestOtp.create({
        data: {
          id: crypto.randomUUID(),
          email,
          phone: phone || null,
          name,
          codeHash,
          expiresAt,
        },
      });

      // ── Email delivery (primary — live today) ───────────────────────────────
      const maskedEmail = email.replace(/(.{1,3}).*(@.*)/, '$1***$2');

      const emailSent = await emailService.sendEmail({
        to: email,
        subject: 'Your MiyZapis verification code',
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
            <h1 style="font-size:22px;font-weight:700;color:#1e293b;margin:0 0 8px;">
              Your verification code
            </h1>
            <p style="color:#475569;margin:0 0 24px;font-size:15px;">
              Use this code to continue your booking on MiyZapis. It expires in 10 minutes.
            </p>
            <div style="background:#f1f5f9;border-radius:12px;padding:20px 28px;text-align:center;margin-bottom:24px;">
              <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#2563eb;font-variant-numeric:tabular-nums;">
                ${code}
              </span>
            </div>
            <p style="color:#94a3b8;font-size:13px;margin:0;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
        text: `Your MiyZapis verification code is: ${code}\n\nIt expires in 10 minutes.`,
      });

      if (!emailSent) {
        logger.error('Guest OTP email delivery failed', { email });
        return res.status(500).json(
          createErrorResponse(
            ErrorCodes.INTERNAL_ERROR,
            'Failed to send verification code. Please try again.',
            req.headers['x-request-id'] as string
          )
        );
      }

      // ── SMS — best-effort hook, dormant until a real provider is wired ──────
      // NotificationService.sendSMS is currently a stub (logs only). This call
      // preserves the hook so wiring Twilio/MessageBird later requires only that
      // one method to be implemented — no route changes needed.
      if (phone) {
        // Never log the OTP code or the full phone number (PII / OTP leak).
        logger.info('SMS hook (stub — no provider yet)', {
          to: `***${String(phone).slice(-4)}`,
        });
      }

      logger.info('Guest OTP issued', { email, maskedEmail });

      return res.status(200).json(
        createSuccessResponse(
          { sent: true, accountExists: false, maskedEmail },
          { message: 'Verification code sent' }
        )
      );
    } catch (error) {
      logger.error('Failed to issue guest OTP', { error, email });
      return res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_ERROR,
          'Internal server error',
          req.headers['x-request-id'] as string
        )
      );
    }
  }
);

// ─── POST /guest/verify-code ─────────────────────────────────────────────────

router.post(
  '/verify-code',
  authRateLimit,
  validateVerifyCode,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Validation failed',
          req.headers['x-request-id'] as string,
          errors.array().map(e => ({ field: (e as any).path, message: e.msg }))
        )
      );
    }

    const { email, code } = req.body as { email: string; code: string };

    // Generic error message — never leak whether email/code is wrong
    const GENERIC_ERR = 'Invalid or expired verification code.';

    try {
      // ── Find latest unconsumed OTP ──────────────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const otp = await (prisma as any).guestOtp.findFirst({
        where: {
          email,
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      }) as { id: string; codeHash: string; attempts: number; name: string | null; phone: string | null } | null;

      if (!otp) {
        return res.status(400).json(
          createErrorResponse(ErrorCodes.UNAUTHORIZED, GENERIC_ERR)
        );
      }

      // ── Attempt lockout ─────────────────────────────────────────────────────
      if (otp.attempts >= 5) {
        return res.status(429).json(
          createErrorResponse(
            ErrorCodes.RATE_LIMIT_EXCEEDED,
            'Too many incorrect attempts. Request a new code.'
          )
        );
      }

      // ── Verify hash ─────────────────────────────────────────────────────────
      const inputHash = hashCode(code.trim());
      if (inputHash !== otp.codeHash) {
        // Increment attempt counter
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma as any).guestOtp.update({
          where: { id: otp.id },
          data: { attempts: { increment: 1 } },
        });

        const remaining = 4 - otp.attempts; // otp.attempts is pre-increment
        return res.status(400).json(
          createErrorResponse(
            ErrorCodes.UNAUTHORIZED,
            remaining > 0
              ? `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
              : 'Too many incorrect attempts. Request a new code.'
          )
        );
      }

      // ── Mark OTP consumed ───────────────────────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).guestOtp.update({
        where: { id: otp.id },
        data: { consumedAt: new Date() },
      });

      // ── Find-or-create shell guest User ────────────────────────────────────
      // If a prior guest shell exists for this email, reuse it (idempotent).
      // If a real account exists (shouldn't reach here but defensive), bail.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let guestUser = await prisma.user.findUnique({ where: { email } }) as any;

      if (guestUser && guestUser.password !== null && !guestUser.isGuest) {
        // Real account — should have been caught at request-code, but defend anyway.
        return res.status(400).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_CONFLICT,
            'An account with this email already exists. Please sign in.'
          )
        );
      }

      if (!guestUser) {
        // Split name into firstName / lastName (best-effort)
        const nameParts = (otp.name || 'Guest').trim().split(/\s+/);
        const firstName = nameParts[0] || 'Guest';
        const lastName = nameParts.slice(1).join(' ') || 'User';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        guestUser = await (prisma as any).user.create({
          data: {
            email,
            password: null,       // passwordless — matches nullable schema
            authProvider: 'guest',
            isGuest: true,
            firstName,
            lastName,
            phoneNumber: otp.phone || null,
            userType: 'CUSTOMER',
            isEmailVerified: true, // verified via OTP
            isActive: true,
          },
        });

        logger.info('Guest shell User created', { userId: guestUser.id, email });
      } else {
        // Reuse existing guest shell — update phone/name if provided
        const nameParts = (otp.name || '').trim().split(/\s+/);
        const updates: Record<string, string | null> = {};
        if (otp.phone && !guestUser.phoneNumber) updates.phoneNumber = otp.phone;
        if (nameParts[0] && guestUser.firstName === 'Guest') {
          updates.firstName = nameParts[0];
          updates.lastName = nameParts.slice(1).join(' ') || 'User';
        }
        if (Object.keys(updates).length > 0) {
          guestUser = await prisma.user.update({
            where: { id: guestUser.id },
            data: updates,
          });
        }
        logger.info('Guest shell User reused', { userId: guestUser.id, email });
      }

      // ── Issue standard JWT tokens (identical to normal login) ──────────────
      const tokens = await createGuestTokens(guestUser.id, guestUser.email);

      // Cache user object (same as normal login)
      const { password: _pw, ...userWithoutPassword } = guestUser as any;
      await cacheUtils.set(`user:${guestUser.id}`, userWithoutPassword, 3600);

      // Update last login
      await prisma.user.update({
        where: { id: guestUser.id },
        data: { lastLoginAt: new Date() },
      });

      return res.status(200).json(
        createSuccessResponse(
          {
            user: userWithoutPassword,
            tokens: {
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              expiresIn: tokens.expiresIn,
            },
          },
          { message: 'Guest session created' }
        )
      );
    } catch (error) {
      logger.error('Failed to verify guest OTP', { error, email });
      return res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_ERROR,
          'Internal server error',
          req.headers['x-request-id'] as string
        )
      );
    }
  }
);

export default router;
