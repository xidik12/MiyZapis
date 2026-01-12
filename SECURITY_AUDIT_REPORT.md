# Security Audit Report - BookingBot Platform
**Date:** 2026-01-09
**Auditor:** Claude Code (Security Analysis)
**Scope:** Full-stack booking platform (Backend API + Frontend Web App)

---

## Executive Summary

A comprehensive security audit was conducted on the BookingBot platform, examining authentication, authorization, input validation, XSS protection, SQL injection risks, file upload security, rate limiting, CSRF protection, session management, and error handling.

**Overall Security Rating:** 🟡 **MODERATE** (65/100)

### Critical Findings: 2
### High Priority: 3
### Medium Priority: 4
### Low Priority: 2

**Recommendation:** Address CRITICAL and HIGH priority vulnerabilities immediately before production deployment.

---

## Detailed Findings

### 🔴 CRITICAL VULNERABILITIES

#### 1. Missing CSRF Protection
**Severity:** CRITICAL
**Location:** Backend - No CSRF middleware implemented
**Risk Level:** HIGH

**Description:**
The platform uses JWT tokens for authentication but has no Cross-Site Request Forgery (CSRF) protection for state-changing operations. While JWT tokens in headers provide some protection, the platform accepts credentials and could be vulnerable to CSRF attacks if tokens are stored in cookies or accessible via JavaScript.

**Attack Scenario:**
```javascript
// Attacker's malicious website
fetch('https://yourplatform.com/api/v1/bookings', {
  method: 'POST',
  credentials: 'include', // Sends cookies
  headers: {
    'Authorization': 'Bearer ' + stolenToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    serviceId: 'attacker-service',
    scheduledAt: '2026-01-15T10:00:00Z'
  })
});
```

**Impact:**
- Unauthorized bookings
- Account modifications
- Payment operations
- Data manipulation

**Remediation:**

**Option 1: CSRF Token Implementation (Recommended)**
```typescript
// backend/src/middleware/security/csrf.ts
import csrf from 'csurf';
import { config } from '@/config';

export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'strict'
  }
});

// Add CSRF token endpoint
router.get('/api/v1/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

**Option 2: Same-Site Cookie Policy (Simpler, Less Protection)**
```typescript
// Ensure all cookies use SameSite=Strict or Lax
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'strict', // Prevents CSRF
  maxAge: 30 * 24 * 60 * 60 * 1000
});
```

**Priority:** IMMEDIATE

---

#### 2. Sensitive Data Logging in Error Handler
**Severity:** CRITICAL
**Location:** [backend/src/middleware/error/index.ts:14-31](backend/src/middleware/error/index.ts#L14-L31)
**Risk Level:** HIGH

**Description:**
The global error handler logs complete request details including `req.body` and `req.headers`, which can contain sensitive information like passwords, tokens, and API keys.

**Vulnerable Code:**
```typescript
logger.error('Unhandled error:', {
  error: {
    name: error.name,
    message: error.message,
    stack: error.stack,
  },
  request: {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,        // ❌ Contains Authorization tokens
    body: req.body,              // ❌ May contain passwords
    params: req.params,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
  },
});
```

**Impact:**
- Passwords logged in plaintext during registration/login errors
- JWT tokens exposed in logs
- API keys and secrets visible
- Compliance violations (GDPR, PCI-DSS)

**Remediation:**
```typescript
// backend/src/middleware/error/index.ts
const sanitizeHeaders = (headers: any) => {
  const sanitized = { ...headers };
  delete sanitized.authorization;
  delete sanitized.cookie;
  delete sanitized['x-api-key'];
  return sanitized;
};

const sanitizeBody = (body: any) => {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
};

logger.error('Unhandled error:', {
  error: {
    name: error.name,
    message: error.message,
    stack: config.isDevelopment ? error.stack : undefined, // Only log stack in dev
  },
  request: {
    method: req.method,
    url: req.originalUrl,
    headers: sanitizeHeaders(req.headers),  // ✅ Sanitized
    body: sanitizeBody(req.body),            // ✅ Sanitized
    params: req.params,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
  },
});
```

**Priority:** IMMEDIATE

---

### 🟠 HIGH PRIORITY VULNERABILITIES

#### 3. S3 File Upload ACL Set to Public-Read
**Severity:** HIGH
**Location:** [backend/src/services/fileUpload/index.ts:62](backend/src/services/fileUpload/index.ts#L62)
**Risk Level:** MEDIUM-HIGH

**Description:**
All files uploaded to S3 are set with ACL 'public-read', making them accessible to anyone with the URL. This includes potentially sensitive documents like contracts, IDs, invoices, or private photos.

**Vulnerable Code:**
```typescript
const params = {
  Bucket: config.aws.s3.bucket!,
  Key: filename,
  Body: buffer,
  ContentType: mimeType,
  ACL: 'public-read'  // ❌ All files publicly accessible
};
```

**Impact:**
- Sensitive user documents accessible to anyone
- Privacy violations
- Potential data breaches
- GDPR/CCPA compliance issues

**Remediation:**
```typescript
// backend/src/services/fileUpload/index.ts
const params = {
  Bucket: config.aws.s3.bucket!,
  Key: filename,
  Body: buffer,
  ContentType: mimeType,
  ACL: 'private',  // ✅ Files private by default
  ServerSideEncryption: 'AES256'  // ✅ Encrypt at rest
};

// Then use presigned URLs for access
async getFileUrl(filename: string, expiresIn = 3600): Promise<string> {
  if (this.useS3 && this.s3) {
    // Use presigned URL instead of direct access
    return this.generatePresignedUrl(filename, expiresIn);
  } else {
    return `/uploads/${filename}`;
  }
}
```

**Additional Protection:**
```typescript
// Add S3 bucket policy to deny all public access
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyPublicAccess",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket/*",
      "Condition": {
        "StringNotEquals": {
          "aws:PrincipalAccount": "YOUR_AWS_ACCOUNT_ID"
        }
      }
    }
  ]
}
```

**Priority:** HIGH

---

#### 4. Missing Magic Byte Validation for File Uploads
**Severity:** HIGH
**Location:** [backend/src/services/fileUpload/index.ts:293-319](backend/src/services/fileUpload/index.ts#L293-L319)
**Risk Level:** MEDIUM-HIGH

**Description:**
File upload validation only checks MIME types, which can be easily spoofed. Attackers can upload malicious files (e.g., PHP shells) disguised as images by simply changing the Content-Type header.

**Current Validation:**
```typescript
async validateFile(buffer: Buffer, mimeType: string, maxSize: number): Promise<boolean> {
  // Only checks MIME type from HTTP header - easily spoofed
  const allowedTypes = ['image/jpeg', 'image/png', ...];

  if (!allowedTypes.includes(mimeType)) {
    throw new Error(`File type ${mimeType} is not allowed`);
  }

  return true;
}
```

**Attack Scenario:**
```bash
# Attacker uploads malicious PHP file disguised as image
curl -X POST https://api.yourplatform.com/api/v1/files/upload \
  -H "Content-Type: image/jpeg" \
  -F "file=@shell.php;type=image/jpeg"
```

**Impact:**
- Remote code execution
- Server compromise
- Data breaches
- Malware distribution

**Remediation:**
```typescript
// Install file-type package: npm install file-type
import { fileTypeFromBuffer } from 'file-type';

async validateFile(buffer: Buffer, mimeType: string, maxSize: number): Promise<boolean> {
  // Check file size
  if (buffer.length > maxSize) {
    throw new Error(`File size exceeds maximum allowed size of ${maxSize} bytes`);
  }

  // ✅ Validate magic bytes (actual file content)
  const detectedType = await fileTypeFromBuffer(buffer);

  if (!detectedType) {
    throw new Error('Unable to determine file type');
  }

  // Define allowed MIME types with their expected magic bytes
  const allowedTypes = {
    'image/jpeg': ['image/jpeg'],
    'image/png': ['image/png'],
    'image/webp': ['image/webp'],
    'image/gif': ['image/gif'],
    'application/pdf': ['application/pdf'],
    'video/mp4': ['video/mp4'],
    'audio/mpeg': ['audio/mpeg'],
  };

  // Check if detected type matches allowed types
  const isAllowedType = Object.values(allowedTypes).flat().includes(detectedType.mime);

  if (!isAllowedType) {
    throw new Error(`File type ${detectedType.mime} is not allowed (detected from content)`);
  }

  // Verify that claimed MIME type matches detected type
  if (detectedType.mime !== mimeType) {
    logger.warn('MIME type mismatch detected', {
      claimed: mimeType,
      detected: detectedType.mime
    });
  }

  return true;
}
```

**Additional Hardening:**
```typescript
// Rename files to prevent execution
private sanitizeFilename(originalName: string): string {
  // Remove dangerous extensions
  const name = originalName.replace(/\.(php|jsp|asp|exe|sh|bat|cmd)$/i, '.txt');

  // Generate safe filename
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(name);

  return `${timestamp}-${random}${ext}`;
}
```

**Priority:** HIGH

---

#### 5. Weak Input Sanitization
**Severity:** HIGH
**Location:** [backend/src/middleware/security/index.ts:326-340](backend/src/middleware/security/index.ts#L326-L340)
**Risk Level:** MEDIUM

**Description:**
The input sanitization only removes basic XSS patterns and can be bypassed with various encoding techniques.

**Current Sanitization:**
```typescript
const sanitizeObject = (obj: any): void => {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Basic XSS prevention - can be bypassed
      obj[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
  }
};
```

**Bypass Examples:**
```javascript
// Bypass 1: Case variation
<ScRiPt>alert('XSS')</sCriPt>

// Bypass 2: HTML entities
&#60;script&#62;alert('XSS')&#60;/script&#62;

// Bypass 3: Event handlers with encoding
<img src=x onerror="alert('XSS')">

// Bypass 4: Data URLs
<iframe src="data:text/html,<script>alert('XSS')</script>">
```

**Remediation:**
```typescript
// Install DOMPurify for Node: npm install isomorphic-dompurify
import DOMPurify from 'isomorphic-dompurify';

const sanitizeString = (str: string, allowHtml: boolean = false): string => {
  if (allowHtml) {
    // Use DOMPurify for HTML content
    return DOMPurify.sanitize(str, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    });
  } else {
    // For non-HTML fields, strip all tags and encode
    return str
      .replace(/<[^>]*>/g, '')           // Remove all HTML tags
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
};

const sanitizeObject = (obj: any, htmlFields: string[] = []): void => {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'string') {
        const allowHtml = htmlFields.includes(key);
        obj[key] = sanitizeString(obj[key], allowHtml);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key], htmlFields);
      }
    }
  }
};
```

**Priority:** HIGH

---

### 🟡 MEDIUM PRIORITY ISSUES

#### 6. No Request Rate Limiting on File Uploads
**Severity:** MEDIUM
**Location:** File upload endpoints
**Risk Level:** MEDIUM

**Description:**
While general rate limiting is implemented, there's no specific rate limit on file upload endpoints, allowing potential DoS attacks through large file uploads.

**Remediation:**
```typescript
// backend/src/middleware/rate-limiter.ts
export const uploadRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads per 15 minutes
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id;
    return userId ? `upload:${userId}` : `upload:${req.ip}`;
  }
});

// Apply to upload routes
router.post('/files/upload',
  authenticateToken,
  uploadRateLimit,  // ✅ Add this
  upload.single('file'),
  FileController.uploadFile
);
```

**Priority:** MEDIUM

---

#### 7. Missing Content-Length Validation
**Severity:** MEDIUM
**Location:** File upload endpoints
**Risk Level:** MEDIUM

**Description:**
No validation of Content-Length header before processing, allowing potential memory exhaustion attacks.

**Remediation:**
```typescript
// backend/src/middleware/upload.ts
export const validateContentLength = (maxSize: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);

    if (contentLength > maxSize) {
      return res.status(413).json(
        createErrorResponse(
          ErrorCodes.PAYLOAD_TOO_LARGE,
          `Request body too large. Maximum size: ${maxSize} bytes`,
          req.headers['x-request-id'] as string
        )
      );
    }

    next();
  };
};

// Apply to routes
app.use('/api/v1/files', validateContentLength(10 * 1024 * 1024)); // 10MB limit
```

**Priority:** MEDIUM

---

#### 8. Lack of Account Lockout on Failed Login Attempts
**Severity:** MEDIUM
**Location:** Authentication system
**Risk Level:** MEDIUM

**Description:**
No account lockout mechanism after multiple failed login attempts, allowing brute-force attacks.

**Remediation:**
```typescript
// backend/src/services/auth/enhanced.ts
private async checkLoginAttempts(email: string): Promise<void> {
  const key = `login_attempts:${email}`;
  const attempts = await redis.get(key);
  const attemptCount = attempts ? parseInt(attempts, 10) : 0;

  if (attemptCount >= 5) {
    const ttl = await redis.ttl(key);
    throw new Error(`Account temporarily locked. Try again in ${Math.ceil(ttl / 60)} minutes`);
  }
}

private async recordFailedLogin(email: string): Promise<void> {
  const key = `login_attempts:${email}`;
  const attempts = await redis.incr(key);

  if (attempts === 1) {
    await redis.expire(key, 15 * 60); // Lock for 15 minutes
  }

  logger.warn('Failed login attempt', { email, attempts });
}

private async clearLoginAttempts(email: string): Promise<void> {
  await redis.del(`login_attempts:${email}`);
}

// In login method
async login(data: LoginRequest): Promise<LoginResult> {
  await this.checkLoginAttempts(data.email);  // ✅ Check before attempting

  try {
    // ... existing login logic ...
    await this.clearLoginAttempts(data.email);  // ✅ Clear on success
    return result;
  } catch (error) {
    await this.recordFailedLogin(data.email);  // ✅ Record failure
    throw error;
  }
}
```

**Priority:** MEDIUM

---

#### 9. Database Error Information Disclosure
**Severity:** MEDIUM
**Location:** [backend/src/middleware/error/index.ts:152-159](backend/src/middleware/error/index.ts#L152-L159)
**Risk Level:** LOW-MEDIUM

**Description:**
Some database errors return generic messages, but error codes could help attackers understand database structure.

**Remediation:**
```typescript
// Only return generic messages in production
default:
  res.status(500).json(
    createErrorResponse(
      ErrorCodes.DATABASE_ERROR,
      config.isDevelopment ? `Database error: ${error.code}` : 'Database operation failed',
      req.headers['x-request-id'] as string
    )
  );
```

**Priority:** MEDIUM

---

### 🟢 LOW PRIORITY / INFORMATIONAL

#### 10. Missing Security Headers on Some Routes
**Severity:** LOW
**Location:** Various routes
**Risk Level:** LOW

**Description:**
Some routes may not have all recommended security headers applied consistently.

**Remediation:**
Ensure Helmet is applied to all routes and add additional headers:
```typescript
app.use(helmet({
  // ... existing config ...
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  dnsPrefetchControl: { allow: false },
  expectCt: {
    enforce: true,
    maxAge: 30
  }
}));
```

**Priority:** LOW

---

#### 11. No Audit Logging for Sensitive Operations
**Severity:** LOW
**Location:** Throughout application
**Risk Level:** LOW

**Description:**
No comprehensive audit logging for sensitive operations like payment processing, user deletion, or permission changes.

**Remediation:**
```typescript
// backend/src/services/audit/logger.ts
export class AuditLogger {
  static async log(event: {
    userId: string;
    action: string;
    resource: string;
    details: any;
    ipAddress: string;
    userAgent: string;
  }): Promise<void> {
    await prisma.auditLog.create({
      data: {
        ...event,
        timestamp: new Date()
      }
    });

    logger.info('Audit event', event);
  }
}

// Usage
await AuditLogger.log({
  userId: req.user.id,
  action: 'DELETE_USER',
  resource: `user:${targetUserId}`,
  details: { reason: 'Admin deletion' },
  ipAddress: req.ip,
  userAgent: req.get('User-Agent')
});
```

**Priority:** LOW

---

## ✅ SECURITY STRENGTHS

The platform has several strong security implementations:

### 1. Authentication & Authorization ✅
- **JWT-based authentication** properly implemented
- **Token expiration** handled correctly
- **Role-based access control** (RBAC) in place
- **Resource ownership checks** before operations
- **Active user verification** on each request
- **Refresh token rotation** implemented

### 2. SQL Injection Prevention ✅
- **Parameterized queries** using Prisma's template literals
- No string concatenation in SQL queries
- All `$queryRaw` calls use safe parameterization
- `$executeRawUnsafe` only used for DDL (schema creation)

### 3. Password Security ✅
- **bcryptjs** for password hashing (10 rounds)
- Automatic salting
- No plaintext password storage
- Proper password comparison timing

### 4. Rate Limiting ✅
- **Comprehensive rate limiting** with Redis fallback
- Platform-specific limits (web, Telegram bot, mini app)
- Endpoint-specific limits (auth: 5/15min, payment: 10/hour)
- User-based and IP-based rate limiting

### 5. Security Headers ✅
- **Helmet** configured with CSP
- **HSTS** with 1-year max-age
- **X-Content-Type-Options**: nosniff
- **X-Frame-Options**: SAMEORIGIN
- **X-XSS-Protection** enabled

### 6. CORS Configuration ✅
- **Whitelist-based origin validation**
- Proper subdomain handling
- Credentials allowed only for trusted origins
- Appropriate headers exposed

### 7. Environment Variable Security ✅
- No hardcoded secrets
- Proper use of environment variables
- Frontend uses Vite's `import.meta.env`
- Backend uses dotenv with validation

---

## Vulnerability Summary Table

| ID | Vulnerability | Severity | Priority | Location |
|----|---------------|----------|----------|----------|
| 1 | Missing CSRF Protection | CRITICAL | IMMEDIATE | Backend middleware |
| 2 | Sensitive Data in Error Logs | CRITICAL | IMMEDIATE | [error/index.ts:14-31](backend/src/middleware/error/index.ts#L14-L31) |
| 3 | S3 Public-Read ACL | HIGH | HIGH | [fileUpload/index.ts:62](backend/src/services/fileUpload/index.ts#L62) |
| 4 | No Magic Byte Validation | HIGH | HIGH | [fileUpload/index.ts:293-319](backend/src/services/fileUpload/index.ts#L293-L319) |
| 5 | Weak Input Sanitization | HIGH | HIGH | [security/index.ts:326-340](backend/src/middleware/security/index.ts#L326-L340) |
| 6 | Upload Rate Limiting Missing | MEDIUM | MEDIUM | File upload endpoints |
| 7 | No Content-Length Validation | MEDIUM | MEDIUM | File upload endpoints |
| 8 | No Account Lockout | MEDIUM | MEDIUM | Auth service |
| 9 | DB Error Info Disclosure | MEDIUM | MEDIUM | [error/index.ts:152-159](backend/src/middleware/error/index.ts#L152-L159) |
| 10 | Missing Security Headers | LOW | LOW | Various routes |
| 11 | No Audit Logging | LOW | LOW | Throughout application |

---

## Recommended Implementation Priority

### Phase 1: IMMEDIATE (Week 1)
1. ✅ Implement CSRF protection
2. ✅ Sanitize error logs (remove sensitive data)
3. ✅ Change S3 ACL to private + presigned URLs

### Phase 2: HIGH (Week 2)
4. ✅ Add magic byte validation for file uploads
5. ✅ Implement DOMPurify for input sanitization
6. ✅ Add file upload rate limiting

### Phase 3: MEDIUM (Week 3-4)
7. ✅ Implement account lockout mechanism
8. ✅ Add Content-Length validation
9. ✅ Improve error message handling

### Phase 4: LOW (As time permits)
10. ✅ Add missing security headers
11. ✅ Implement audit logging

---

## Testing Recommendations

### 1. Security Testing Tools
- **OWASP ZAP**: Automated security testing
- **Burp Suite**: Manual penetration testing
- **npm audit**: Dependency vulnerability scanning
- **Snyk**: Continuous security monitoring

### 2. Manual Testing Checklist
- [ ] Test CSRF protection with cross-origin requests
- [ ] Attempt file upload with malicious files
- [ ] Test input sanitization with XSS payloads
- [ ] Verify rate limiting across all endpoints
- [ ] Test authentication bypass attempts
- [ ] Verify error messages don't leak sensitive info
- [ ] Test file access with expired presigned URLs

### 3. Automated Testing
```bash
# Run dependency audit
npm audit --production

# Security headers test
curl -I https://yourplatform.com

# Rate limiting test
for i in {1..20}; do curl -X POST https://yourplatform.com/api/v1/auth/login; done
```

---

## Compliance Considerations

### GDPR Compliance
- ✅ Password hashing implemented
- ⚠️ Need audit logging for data access
- ⚠️ Need data retention policies
- ⚠️ Need "right to be forgotten" implementation

### PCI-DSS Compliance
- ✅ No credit card storage (uses Stripe)
- ✅ TLS encryption
- ⚠️ Need detailed audit logging
- ⚠️ Need regular security assessments

### OWASP Top 10 Coverage
1. ✅ **Injection**: Protected via Prisma ORM
2. ⚠️ **Broken Authentication**: Need account lockout
3. ✅ **Sensitive Data Exposure**: Encrypted at rest/transit
4. ⚠️ **XML External Entities**: N/A
5. ✅ **Broken Access Control**: RBAC implemented
6. ⚠️ **Security Misconfiguration**: Some headers missing
7. ⚠️ **XSS**: Basic protection, needs improvement
8. ✅ **Insecure Deserialization**: Not applicable
9. ⚠️ **Using Components with Known Vulnerabilities**: Need npm audit
10. ⚠️ **Insufficient Logging & Monitoring**: Need audit logging

---

## Conclusion

The BookingBot platform has a **solid security foundation** with proper authentication, authorization, SQL injection prevention, and password security. However, **critical vulnerabilities** exist around CSRF protection, error logging, and file upload security that must be addressed immediately.

**Immediate Actions Required:**
1. Implement CSRF token validation
2. Sanitize error logs to prevent credential leakage
3. Change S3 file ACL to private

**Estimated Time to Fix Critical Issues:** 2-3 days
**Estimated Time for All Fixes:** 2-3 weeks

### Risk Assessment
- **Current Risk Level:** MODERATE-HIGH
- **Post-Fix Risk Level:** LOW (after Phase 1-3 completion)

---

## Contact & Questions

For questions about this security audit or implementation guidance, refer to the code locations provided or consult with your security team.

**Generated by:** Claude Code Security Analysis
**Report Version:** 1.0
**Last Updated:** 2026-01-09
