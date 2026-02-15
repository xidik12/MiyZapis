/**
 * Integration tests for the Authentication flow.
 *
 * Covers:
 *  - POST /api/v1/auth/register  (user registration)
 *  - POST /api/v1/auth/login     (user login)
 *  - POST /api/v1/auth/refresh   (token refresh)
 *  - GET  /api/v1/auth/me        (protected route with/without token)
 *  - POST /api/v1/auth/logout    (logout)
 */

import request from 'supertest';
import bcrypt from 'bcryptjs';
import {
  mockPrisma,
  generateTestToken,
  generateExpiredToken,
  generateTestRefreshToken,
  createTestUser,
  resetAllMocks,
} from './setup';
import { app } from './test-app';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const REGISTER_URL = '/api/v1/auth/register';
const LOGIN_URL = '/api/v1/auth/login';
const REFRESH_URL = '/api/v1/auth/refresh';
const ME_URL = '/api/v1/auth/me';
const LOGOUT_URL = '/api/v1/auth/logout';

const validRegistrationBody = {
  email: 'newuser@example.com',
  password: 'Password1',
  firstName: 'Jane',
  lastName: 'Doe',
  userType: 'CUSTOMER',
};

const validLoginBody = {
  email: 'existing@example.com',
  password: 'Password1',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Auth API', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  // ======================================================================
  // REGISTRATION
  // ======================================================================
  describe('POST /api/v1/auth/register', () => {
    it('should register a new customer successfully', async () => {
      // The /register route in auth.ts is a proxy that calls EnhancedAuthService.register
      // Mock: no existing user
      mockPrisma.user.findFirst.mockResolvedValue(null);

      // Mock: user creation
      const createdUser = createTestUser({
        id: 'new-user-cuid-12345678',
        email: validRegistrationBody.email,
        firstName: validRegistrationBody.firstName,
        lastName: validRegistrationBody.lastName,
        userType: 'CUSTOMER',
        isEmailVerified: false,
      });
      mockPrisma.user.create.mockResolvedValue(createdUser);

      // Mock: verification token creation
      mockPrisma.emailVerificationToken.create.mockResolvedValue({
        id: 'token-id',
        userId: createdUser.id,
        token: 'verification-token',
        type: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() + 86400000),
        isUsed: false,
      });

      const res = await request(app)
        .post(REGISTER_URL)
        .send(validRegistrationBody)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('message');
      expect(res.body.data).toHaveProperty('requiresVerification', true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(validRegistrationBody.email);
    });

    it('should reject registration with missing required fields', async () => {
      const res = await request(app)
        .post(REGISTER_URL)
        .send({ email: 'test@example.com' }) // missing password, firstName, lastName, userType
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject registration when email already exists', async () => {
      // The proxy route catches EMAIL_ALREADY_EXISTS from the service
      mockPrisma.user.findFirst.mockResolvedValue(
        createTestUser({ email: validRegistrationBody.email })
      );

      const res = await request(app)
        .post(REGISTER_URL)
        .send(validRegistrationBody)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject registration when email already exists (via service error)', async () => {
      // The proxy /register route calls EnhancedAuthService.register directly.
      // It catches EMAIL_ALREADY_EXISTS from the service.
      mockPrisma.user.findFirst.mockResolvedValue(
        createTestUser({ email: 'duplicate@example.com' })
      );

      const res = await request(app)
        .post(REGISTER_URL)
        .send({ ...validRegistrationBody, email: 'duplicate@example.com' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should accept valid userType values (CUSTOMER)', async () => {
      // The proxy /register route passes body to EnhancedAuthService.register
      // It does basic field-presence checks but not enum validation
      mockPrisma.user.findFirst.mockResolvedValue(null);
      const createdUser = createTestUser({
        id: 'cust-valid-type-cuid-123',
        email: validRegistrationBody.email,
        userType: 'CUSTOMER',
        isEmailVerified: false,
      });
      mockPrisma.user.create.mockResolvedValue(createdUser);
      mockPrisma.emailVerificationToken.create.mockResolvedValue({
        id: 'vtoken-id',
        userId: createdUser.id,
        token: 'verification-token',
        type: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() + 86400000),
        isUsed: false,
      });

      const res = await request(app)
        .post(REGISTER_URL)
        .send(validRegistrationBody)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.userType).toBe('CUSTOMER');
    });
  });

  // ======================================================================
  // LOGIN
  // ======================================================================
  describe('POST /api/v1/auth/login', () => {
    const existingUser = createTestUser({
      id: 'existing-user-cuid-1234',
      email: 'existing@example.com',
      isEmailVerified: true,
    });

    beforeEach(async () => {
      // Pre-hash the password so bcrypt.compare works
      const hash = await bcrypt.hash('Password1', 10);
      existingUser.password = hash;
    });

    it('should login successfully with valid credentials', async () => {
      // EnhancedAuthService.login uses prisma.user.findUnique with specialist include.
      // Return user WITHOUT specialist profile so multi-role selection is skipped.
      mockPrisma.user.findUnique.mockResolvedValue({
        ...existingUser,
        specialist: null,
      });
      mockPrisma.user.update.mockResolvedValue(existingUser);
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'rt-id',
        userId: existingUser.id,
        token: 'refresh-token',
        expiresAt: new Date(Date.now() + 30 * 86400000),
      });

      const res = await request(app)
        .post(LOGIN_URL)
        .send(validLoginBody)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('tokens');
      expect(res.body.data.tokens).toHaveProperty('accessToken');
      expect(res.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should reject login with wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...existingUser,
        specialist: null,
      });

      const res = await request(app)
        .post(LOGIN_URL)
        .send({ ...validLoginBody, password: 'WrongPassword1' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login with non-existent email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post(LOGIN_URL)
        .send({ email: 'nobody@example.com', password: 'Password1' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login with missing email', async () => {
      const res = await request(app)
        .post(LOGIN_URL)
        .send({ password: 'Password1' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject login with missing password', async () => {
      const res = await request(app)
        .post(LOGIN_URL)
        .send({ email: 'existing@example.com' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject login for deactivated account', async () => {
      const deactivatedUser = createTestUser({
        ...existingUser,
        isActive: false,
      });
      deactivatedUser.password = existingUser.password;
      mockPrisma.user.findUnique.mockResolvedValue({
        ...deactivatedUser,
        specialist: null,
      });

      const res = await request(app)
        .post(LOGIN_URL)
        .send(validLoginBody)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ACCESS_DENIED');
    });
  });

  // ======================================================================
  // TOKEN REFRESH
  // ======================================================================
  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh token successfully with valid refresh token', async () => {
      const user = createTestUser({ id: 'refresh-user-cuid-123' });
      const tokenId = 'refresh-token-id-abc';
      const validRefreshToken = generateTestRefreshToken(user, tokenId);

      // The service uses prisma.refreshToken.findUnique({ where: { token } })
      // and includes the user relation
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: tokenId,
        userId: user.id,
        token: validRefreshToken,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 30 * 86400000),
        user: {
          id: user.id,
          email: user.email,
          userType: user.userType,
          isActive: true,
        },
      });

      const res = await request(app)
        .post(REFRESH_URL)
        .send({ refreshToken: validRefreshToken })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('expiresIn');
    });

    it('should reject refresh with missing token', async () => {
      const res = await request(app)
        .post(REFRESH_URL)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject refresh with invalid token', async () => {
      const res = await request(app)
        .post(REFRESH_URL)
        .send({ refreshToken: 'not-a-valid-jwt' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('REFRESH_TOKEN_INVALID');
    });
  });

  // ======================================================================
  // PROTECTED ROUTE: GET /auth/me
  // ======================================================================
  describe('GET /api/v1/auth/me', () => {
    it('should return current user with valid token', async () => {
      const user = createTestUser({
        id: 'me-user-cuid-1234567890',
        email: 'me@example.com',
      });
      const token = generateTestToken(user);

      // JWT middleware fetches user from DB
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const res = await request(app)
        .get(ME_URL)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user.email).toBe('me@example.com');
    });

    it('should reject with 401 when no token is provided', async () => {
      const res = await request(app)
        .get(ME_URL)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });

    it('should reject with 401 when token is malformed', async () => {
      const res = await request(app)
        .get(ME_URL)
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });

    it('should reject with 401 when token is expired', async () => {
      const user = createTestUser({ id: 'expired-user-cuid-12345' });
      const expiredToken = generateExpiredToken(user);

      // Small delay so expiry takes effect
      await new Promise((r) => setTimeout(r, 50));

      const res = await request(app)
        .get(ME_URL)
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TOKEN_EXPIRED');
    });

    it('should reject with 401 when user not found in database', async () => {
      const token = generateTestToken({
        id: 'nonexistent-user-cuid-1',
        email: 'ghost@example.com',
        userType: 'CUSTOMER',
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get(ME_URL)
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });

    it('should reject with 401 when user account is deactivated', async () => {
      const deactivatedUser = createTestUser({
        id: 'deactivated-user-cuid-1',
        isActive: false,
      });
      const token = generateTestToken(deactivatedUser);

      mockPrisma.user.findUnique.mockResolvedValue(deactivatedUser);

      const res = await request(app)
        .get(ME_URL)
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  // ======================================================================
  // LOGOUT
  // ======================================================================
  describe('POST /api/v1/auth/logout', () => {
    it('should return success immediately', async () => {
      const res = await request(app)
        .post(LOGOUT_URL)
        .send({ refreshToken: 'some-refresh-token' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Logged out successfully');
    });

    it('should succeed even without a refresh token', async () => {
      const res = await request(app)
        .post(LOGOUT_URL)
        .send({})
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
