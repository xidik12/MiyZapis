import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

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
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
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
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'postgresql',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

export default router;