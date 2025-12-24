# Security Guidelines

## Overview

This document outlines the security measures implemented in MiyZapis to protect against XSS, SQL injection, file upload attacks, and other security vulnerabilities.

## Security Layers

### 1. Input Sanitization

**Frontend (`frontend/src/utils/sanitization.ts`)**
- DOMPurify-based HTML sanitization
- Type-specific sanitizers (text, HTML, email, URL, etc.)
- Dangerous content detection
- Automatic escaping

**Backend (`backend/src/utils/sanitization.ts`)**
- sanitize-html for server-side HTML cleaning
- Validator.js for email, URL validation
- Recursive object sanitization
- Database input sanitization (backup to Prisma)

### 2. Security Middleware

**Location:** `backend/src/middleware/security/index.ts`

**Features:**
- Helmet.js security headers (CSP, HSTS, XSS Filter)
- Rate limiting (Redis-backed when available)
- CORS protection with whitelist
- Automatic input sanitization on all requests
- Request ID tracking

**Rate Limits:**
- Auth endpoints: 5 requests/15 minutes per email/IP
- Bookings: 20 requests/hour per user
- Payments: 10 requests/hour per user
- Search: 60 requests/minute per IP
- Default: 100 requests/15 minutes per IP

### 3. File Upload Security

**Location:** `backend/src/services/fileUpload/enhanced-upload.ts`

**Protections:**
- Magic number (file signature) validation
- MIME type verification
- File extension whitelisting
- Filename sanitization
- Path traversal prevention
- Embedded script detection
- Size limits per file type
- Decompression bomb protection

**Allowed File Types:**
- Images: JPEG, PNG, WebP (with size limits)
- Documents: PDF, DOCX, XLSX (scanned for malicious content)

### 4. Database Security

**Prisma ORM automatically prevents:**
- SQL injection
- Query manipulation
- Invalid data types

**Additional measures:**
- Input validation before database queries
- UUID validation for IDs
- Date/time sanitization

## Usage Guidelines for Developers

### Frontend Development

#### 1. Using Safe Hooks (Recommended)

```typescript
import { useSafeInput, useSafeForm } from '@/hooks/useSafeInput';

// For single input
function MyComponent() {
  const nameInput = useSafeInput('', { type: 'text', maxLength: 100 });
  const emailInput = useSafeInput('', { type: 'email' });

  return (
    <>
      <input value={nameInput.value} onChange={nameInput.onChange} />
      <input value={emailInput.value} onChange={emailInput.onChange} />
    </>
  );
}

// For forms
function MyForm() {
  const form = useSafeForm(
    { name: '', email: '', bio: '' },
    {
      name: sanitizeText,
      email: sanitizeEmail,
      bio: sanitizeHTML,
    }
  );

  return (
    <form>
      <input value={form.values.name} onChange={form.handleChange('name')} />
      {form.isDangerous('name') && <Warning />}
    </form>
  );
}
```

#### 2. Manual Sanitization

```typescript
import {
  sanitizeText,
  sanitizeHTML,
  sanitizeEmail,
  sanitizeURL,
  sanitizeSearchQuery,
  containsDangerousContent
} from '@/utils/sanitization';

// Sanitize before rendering
const displayName = sanitizeText(userInput);

// Check for dangerous content
if (containsDangerousContent(userInput)) {
  showWarning();
}

// Sanitize HTML (for rich text)
const safeHTML = sanitizeHTML(userInput);
<div dangerouslySetInnerHTML={{ __html: safeHTML }} />
```

#### 3. File Upload

```typescript
import { useSafeFileInput } from '@/hooks/useSafeInput';

function FileUpload() {
  const fileInput = useSafeFileInput({
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png'],
    onError: (error) => toast.error(error),
  });

  return (
    <>
      <input type="file" onChange={fileInput.onChange} />
      {fileInput.error && <Error message={fileInput.error} />}
    </>
  );
}
```

### Backend Development

#### 1. Route Protection

```typescript
import { sanitizeInput, authRateLimit } from '@/middleware/security';

// Apply to routes
router.post('/api/users', sanitizeInput, authRateLimit, createUser);
```

#### 2. Manual Sanitization

```typescript
import {
  sanitizeText,
  sanitizeHTML,
  sanitizeEmail,
  sanitizeObject
} from '@/utils/sanitization';

// Sanitize individual fields
const cleanName = sanitizeText(req.body.name);
const cleanEmail = sanitizeEmail(req.body.email);

// Sanitize entire object
const cleanData = sanitizeObject(req.body, {
  name: sanitizeText,
  email: sanitizeEmail,
  bio: sanitizeHTML,
});
```

#### 3. File Uploads

```typescript
import { enhancedFileUploadService } from '@/services/fileUpload/enhanced-upload';

// Create upload middleware
const upload = enhancedFileUploadService.createUploadMiddleware('avatar', 1);

// Use in route
router.post('/upload', upload.single('file'), async (req, res) => {
  const result = await enhancedFileUploadService.processUpload(
    req.file,
    'avatar',
    req.user.id
  );
  // File is automatically validated using magic numbers
});
```

## Security Checklist

### For Every User Input Field

- [ ] Apply appropriate sanitization (text, HTML, email, etc.)
- [ ] Set maximum length limits
- [ ] Validate format (email, phone, URL, etc.)
- [ ] Check for dangerous content
- [ ] Use safe hooks (`useSafeInput`, `useSafeForm`)

### For Every API Endpoint

- [ ] Apply `sanitizeInput` middleware
- [ ] Add appropriate rate limiting
- [ ] Validate authentication/authorization
- [ ] Sanitize response data before sending
- [ ] Log suspicious activity

### For File Uploads

- [ ] Use `createUploadMiddleware` with file type
- [ ] Set appropriate size limits
- [ ] Validate MIME types
- [ ] Use magic number validation
- [ ] Sanitize filenames
- [ ] Store files outside web root

### For Database Operations

- [ ] Use Prisma ORM (prevents SQL injection)
- [ ] Validate UUIDs with `sanitizeUUID`
- [ ] Sanitize text fields before storage
- [ ] Validate date/time inputs

## Common Vulnerabilities & Prevention

### XSS (Cross-Site Scripting)

**Attack:** `<script>alert('XSS')</script>`

**Prevention:**
- All user input is sanitized on both client and server
- DOMPurify removes dangerous tags and attributes
- Never use `dangerouslySetInnerHTML` without sanitization
- Use `createSafeHTML()` helper when needed

### SQL Injection

**Attack:** `'; DROP TABLE users; --`

**Prevention:**
- Prisma ORM parameterizes all queries
- Backup sanitization with `sanitizeDatabaseInput`
- UUID validation prevents ID manipulation

### Path Traversal

**Attack:** `../../etc/passwd`

**Prevention:**
- Filename sanitization removes `..` patterns
- UUIDs used for file storage
- Files stored in isolated directory

### File Upload Attacks

**Attack:** PHP shell disguised as image

**Prevention:**
- Magic number validation verifies actual file type
- MIME type and extension checking
- Embedded script detection
- File size limits
- Filename sanitization

### CSRF (Cross-Site Request Forgery)

**Prevention:**
- CORS whitelist
- SameSite cookies
- CSRF tokens on state-changing operations

### DDoS / Rate Limit Abuse

**Prevention:**
- Redis-backed rate limiting
- IP-based throttling
- User-based throttling
- Exponential backoff

## Security Headers

Set via Helmet.js:

```
Content-Security-Policy: Restricts resource loading
Strict-Transport-Security: Forces HTTPS
X-Content-Type-Options: Prevents MIME sniffing
X-Frame-Options: Prevents clickjacking
X-XSS-Protection: Enables browser XSS filter
Referrer-Policy: Controls referer information
```

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. Email security concerns to: [security email]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Security Updates

This platform uses:
- DOMPurify (latest)
- sanitize-html (latest)
- validator.js (latest)
- Helmet.js (latest)

Dependencies are regularly updated for security patches.

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Content Security Policy Reference](https://content-security-policy.com/)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)

---

**Last Updated:** 2025-12-23
**Security Review Date:** 2025-12-23
