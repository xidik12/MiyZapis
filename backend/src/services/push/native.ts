// Native push (Capacitor apps) via Firebase Cloud Messaging. FCM delivers to
// Android directly and to iOS through APNs. Entirely gated on the
// FIREBASE_SERVICE_ACCOUNT env var — a no-op (sent: 0) until that's configured,
// so it ships safely before the Firebase/Apple accounts exist.
import { logger } from '@/utils/logger';
import type { PrismaClient } from '@prisma/client';

let _messaging: any = null;
let _initTried = false;

async function getMessaging(): Promise<any | null> {
  if (_initTried) return _messaging;
  _initTried = true;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    logger.info('Native push disabled (no FIREBASE_SERVICE_ACCOUNT)');
    return null;
  }
  try {
    const admin = await import('firebase-admin');
    const cred = JSON.parse(raw);
    const app = admin.apps.length ? admin.app() : admin.initializeApp({ credential: admin.credential.cert(cred) });
    _messaging = admin.messaging(app);
    logger.info('Native push (FCM) initialized');
  } catch (e) {
    logger.error('FCM init failed', { error: e });
    _messaging = null;
  }
  return _messaging;
}

export async function isNativePushEnabled(): Promise<boolean> {
  return !!(await getMessaging());
}

/** Send a native push to all of a user's registered devices. Returns counts. */
export async function sendNativePushToUser(
  prisma: PrismaClient,
  userId: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {},
): Promise<{ sent: number; failed: number }> {
  const messaging = await getMessaging();
  if (!messaging) return { sent: 0, failed: 0 };

  const devices = await prisma.deviceToken.findMany({ where: { userId }, select: { token: true } });
  if (devices.length === 0) return { sent: 0, failed: 0 };

  // FCM data values must be strings.
  const dataStr: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v != null && typeof v !== 'object') dataStr[k] = String(v);
  }

  try {
    const res = await messaging.sendEachForMulticast({
      tokens: devices.map((d) => d.token),
      notification: { title, body },
      data: dataStr,
    });

    // Prune tokens FCM reports as permanently invalid.
    const stale: string[] = [];
    res.responses.forEach((r: any, i: number) => {
      const code = r?.error?.code || '';
      if (!r.success && /not-registered|invalid-argument|invalid-registration/i.test(code)) {
        stale.push(devices[i].token);
      }
    });
    if (stale.length) await prisma.deviceToken.deleteMany({ where: { token: { in: stale } } });

    return { sent: res.successCount, failed: res.failureCount };
  } catch (e) {
    logger.error('Native push send failed', { userId, error: e });
    return { sent: 0, failed: devices.length };
  }
}
