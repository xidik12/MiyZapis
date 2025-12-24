#!/usr/bin/env node

/**
 * Create a test JWT token for manual testing
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = 'your-super-secret-jwt-key-that-is-at-least-32-characters-long';

// Mock user data (this should match a real user if testing against production)
const testUser = {
  id: crypto.randomUUID(),
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  userType: 'CUSTOMER'
};

const token = jwt.sign(
  {
    userId: testUser.id,
    email: testUser.email,
    userType: testUser.userType
  },
  JWT_SECRET,
  {
    expiresIn: '1h',
    issuer: 'miyzapis-api',
    subject: testUser.id
  }
);

console.log('Test JWT Token:');
console.log(token);
console.log('\nTest User:');
console.log(JSON.stringify(testUser, null, 2));
console.log('\nYou can use this token to test the wallet endpoints manually:');
console.log(`curl -X GET "http://localhost:3002/api/v1/payments/wallet/balance" -H "Authorization: Bearer ${token}"`);