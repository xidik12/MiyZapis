/**
 * Lightweight Express app for testing.
 *
 * Only mounts the route modules under test (auth, bookings, payments)
 * to avoid pulling in every controller and service in the application.
 */

import express from 'express';

const app = express();

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware (simplified)
app.use((req: any, _res, next) => {
  req.id = req.headers['x-request-id'] || 'test-request-id';
  next();
});

// Only mount the routes under test
import authRoutes from '@/routes/auth';
import bookingRoutes from '@/routes/bookings';
import paymentRoutes from '@/routes/payments';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);

// Error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Internal Server Error',
    },
  });
});

// 404 handler
app.use((_req: any, res: any) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
});

export { app };
