import express from 'express';
import { prisma } from '@/config/database';

const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version,
      database: 'connected'
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: err.message,
      database: 'disconnected'
    });
  }
});

// Database health check
router.get('/health/db', async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT version()`;
    res.json({
      status: 'healthy',
      database: 'postgresql',
      timestamp: new Date().toISOString(),
      version: result
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    res.status(503).json({
      status: 'unhealthy',
      database: 'postgresql',
      timestamp: new Date().toISOString(),
      error: err.message
    });
  }
});

export default router;