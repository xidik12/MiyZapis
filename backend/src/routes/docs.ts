// Lightweight API documentation surface. Returns an OpenAPI 3.1 JSON spec
// describing the public endpoints, plus a tiny Swagger UI HTML wrapper.
// Hand-written for now (auto-generation via zod-to-openapi is the next step).
import { Router, Request, Response } from 'express';

const router = Router();

const SPEC = {
  openapi: '3.1.0',
  info: {
    title: 'MiyZapis Booking Platform API',
    version: '1.0.0',
    description: 'Public REST API for the MiyZapis booking platform.',
    contact: { name: 'MiyZapis', url: 'https://miyzapis.com' },
  },
  servers: [
    { url: 'https://api.miyzapis.com/api/v1', description: 'Production' },
  ],
  tags: [
    { name: 'auth', description: 'Authentication and account verification' },
    { name: 'specialists', description: 'Service providers directory' },
    { name: 'bookings', description: 'Appointment booking' },
    { name: 'health', description: 'Service health checks' },
    { name: 'webhooks', description: 'Inbound webhook receivers' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['health'],
        summary: 'Service health check',
        responses: {
          '200': { description: 'Service is healthy' },
          '503': { description: 'Service degraded' },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['auth'],
        summary: 'Register a new account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName', 'userType'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  phone: { type: 'string' },
                  userType: { type: 'string', enum: ['CUSTOMER', 'SPECIALIST'] },
                  language: { type: 'string', enum: ['en', 'uk', 'ru'] },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Account created — verification email sent' },
          '400': { description: 'Validation failed or email already registered' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['auth'],
        summary: 'Log in with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Tokens issued' },
          '401': { description: 'Invalid credentials' },
          '403': { description: 'Email not verified' },
        },
      },
    },
    '/auth/verify-email': {
      post: {
        tags: ['auth'],
        summary: 'Verify email address with token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token'],
                properties: { token: { type: 'string' } },
              },
            },
          },
        },
        responses: { '200': { description: 'Verified' }, '400': { description: 'Invalid token' } },
      },
    },
    '/auth/resend-verification': {
      post: {
        tags: ['auth'],
        summary: 'Resend verification email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Email queued' },
          '400': { description: 'Validation failed' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
    '/auth/request-password-reset': {
      post: {
        tags: ['auth'],
        summary: 'Request a password reset email',
        responses: { '200': { description: 'Email queued (always 200 to prevent enumeration)' } },
      },
    },
    '/auth/me': {
      get: {
        tags: ['auth'],
        summary: 'Current user profile',
        security: [{ bearer: [] }],
        responses: { '200': { description: 'User profile' }, '401': { description: 'Not authenticated' } },
      },
    },
    '/specialists': {
      get: {
        tags: ['specialists'],
        summary: 'Search specialists',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'location', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'Paged specialist list' } },
      },
    },
    '/specialists/by-slug/{slug}': {
      get: {
        tags: ['specialists'],
        summary: 'Specialist profile by slug',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Specialist profile' }, '404': { description: 'Not found' } },
      },
    },
    '/bookings': {
      get: {
        tags: ['bookings'],
        summary: 'List my bookings',
        security: [{ bearer: [] }],
        responses: { '200': { description: 'Bookings list' }, '401': { description: 'Not authenticated' } },
      },
      post: {
        tags: ['bookings'],
        summary: 'Create a booking',
        security: [{ bearer: [] }],
        responses: { '201': { description: 'Booking created' } },
      },
    },
    '/webhooks/resend': {
      post: {
        tags: ['webhooks'],
        summary: 'Resend delivery event receiver',
        description: 'Verifies Svix signature if RESEND_WEBHOOK_SECRET is configured.',
        responses: { '200': { description: 'Event accepted' }, '401': { description: 'Invalid signature' } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
} as const;

router.get('/openapi.json', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.json(SPEC);
});

router.get('/', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=600');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MiyZapis API — Reference</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
  <link rel="icon" type="image/svg+xml" href="https://miyzapis.com/favicon.svg">
  <style>body{margin:0;background:#f4f7fb}.topbar{display:none}</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: '/api/v1/docs/openapi.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      defaultModelsExpandDepth: 1,
      docExpansion: 'list',
    });
  </script>
</body>
</html>`);
});

export default router;
