import express from 'express';
import { prisma } from '@/config/database';
import { redis } from '@/config/redis';

const router = express.Router();

async function pingRedis(): Promise<{ status: 'connected' | 'disabled' | 'error'; latencyMs?: number; error?: string }> {
  if (!redis) return { status: 'disabled' };
  const started = Date.now();
  try {
    const result = await Promise.race([
      redis.ping(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('ping timeout')), 1500)),
    ]);
    if (result !== 'PONG') return { status: 'error', error: 'unexpected ping reply' };
    return { status: 'connected', latencyMs: Date.now() - started };
  } catch (err) {
    return { status: 'error', error: err instanceof Error ? err.message : String(err) };
  }
}

// Health check — DB + Redis. Redis "disabled" is healthy when no URL is set.
router.get('/health', async (_req, res) => {
  const started = Date.now();
  let dbStatus: 'connected' | 'disconnected' = 'disconnected';
  let dbError: string | undefined;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  const redisInfo = await pingRedis();
  const healthy = dbStatus === 'connected' && redisInfo.status !== 'error';

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
    database: dbStatus,
    redis: redisInfo.status,
    redisLatencyMs: redisInfo.latencyMs,
    checkDurationMs: Date.now() - started,
    ...(dbError ? { databaseError: dbError } : {}),
    ...(redisInfo.error ? { redisError: redisInfo.error } : {}),
  });
});

// Deep database check.
router.get('/health/db', async (_req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT version()`;
    res.json({
      status: 'healthy',
      database: 'postgresql',
      timestamp: new Date().toISOString(),
      version: result,
    });
  } catch (error: unknown) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'postgresql',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Redis-only check.
router.get('/health/redis', async (_req, res) => {
  const info = await pingRedis();
  res.status(info.status === 'error' ? 503 : 200).json({
    status: info.status === 'error' ? 'unhealthy' : 'healthy',
    redis: info.status,
    latencyMs: info.latencyMs,
    error: info.error,
    timestamp: new Date().toISOString(),
  });
});

export default router;
