import crypto from 'crypto';

interface LinkCode {
  userId: string;
  expiresAt: Date;
}

// In-memory store for Telegram link codes (short-lived, no need for DB)
const linkCodes = new Map<string, LinkCode>();

// Generate a 6-character alphanumeric code
export function generateLinkCode(userId: string): string {
  // Clean up expired codes
  cleanExpired();

  // Remove any existing code for this user
  for (const [code, data] of linkCodes) {
    if (data.userId === userId) {
      linkCodes.delete(code);
    }
  }

  const code = crypto.randomBytes(4).toString('hex'); // 8-char hex
  linkCodes.set(code, {
    userId,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
  });

  return code;
}

// Verify and consume a link code — returns userId if valid, null otherwise
export function consumeLinkCode(code: string): string | null {
  cleanExpired();

  const data = linkCodes.get(code);
  if (!data) return null;

  if (data.expiresAt < new Date()) {
    linkCodes.delete(code);
    return null;
  }

  // Consume (one-time use)
  linkCodes.delete(code);
  return data.userId;
}

function cleanExpired() {
  const now = new Date();
  for (const [code, data] of linkCodes) {
    if (data.expiresAt < now) {
      linkCodes.delete(code);
    }
  }
}
