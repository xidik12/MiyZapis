# Backend Security - Protection Against Frontend Attacks

## Overview
This document outlines all security measures implemented to protect the backend from malicious frontend requests, including compromised clients, XSS attacks, CSRF, injection attacks, and abuse.

## Security Layers

### 1. Rate Limiting (DDoS & Abuse Prevention)
**Location:** `backend/src/middleware/security/index.ts`

All API endpoints are protected with intelligent rate limiting:

```typescript
// Rate Limit Configurations
- Authentication: 5 requests/15 minutes per email/IP
- Bookings: 20 requests/hour per user
- Payments: 10 requests/hour per user
- Search/Locations: 60 requests/minute per IP
- Default API: 100 requests/15 minutes per IP
```

**Features:**
- Redis-backed storage (falls back to in-memory)
- IP-based and user-based throttling
- Automatic exponential backoff
- Request ID tracking for monitoring

**Applied to Locations API:**
```typescript
router.use(searchRateLimit); // All location endpoints rate limited
```

---

### 2. Input Sanitization & Validation
**Locations:** `backend/src/middleware/security/index.ts`, `backend/src/utils/sanitization.ts`

**Global Middleware:**
- Automatically sanitizes ALL incoming requests (body, query, params)
- Removes XSS attack vectors
- Strips dangerous patterns

**Validation on Locations API:**
```typescript
// Query length limits
- Search queries: Max 200 characters
- City search: Max 100 characters

// Coordinate validation
- Latitude: -90 to +90
- Longitude: -180 to +180

// Radius limits
- Min: 0 km
- Max: 500 km (prevents excessive queries)

// Result limits
- Max 100 results per request (prevents data scraping)
```

---

### 3. SQL Injection Prevention
**Method:** Prisma ORM + Input Sanitization

**Protection:**
1. **Prisma ORM:** Automatically parameterizes all queries
2. **Backup Sanitization:** `sanitizeDatabaseInput()` removes SQL meta-characters
3. **UUID Validation:** All IDs validated before database queries

**Example:**
```typescript
// Safe - Prisma handles parameterization
await prisma.specialist.findMany({
  where: { city: { contains: sanitizedQuery } }
});
```

---

### 4. XSS (Cross-Site Scripting) Prevention
**Locations:** `backend/src/utils/sanitization.ts`, `backend/src/middleware/security/index.ts`

**Multi-layer Protection:**
1. **Input Sanitization:** Removes `<script>`, `javascript:`, event handlers
2. **Output Encoding:** Sanitizes before sending to frontend
3. **Content Security Policy:** Helmet.js headers restrict script execution

**Patterns Blocked:**
```typescript
- <script> tags
- javascript: protocol
- on* event handlers (onclick, onerror, etc.)
- <iframe>, <object>, <embed> tags
- eval(), expression()
- data:text/html URIs
```

---

### 5. CORS Protection
**Location:** `backend/src/middleware/security/index.ts`

**Configuration:**
- Whitelist of allowed origins only
- Credentials support for authenticated requests
- Pre-flight request handling
- Origin validation on every request

```typescript
corsOrigin: ['https://miyzapis.com', 'https://app.miyzapis.com']
```

**Prevents:**
- Unauthorized cross-origin requests
- CSRF attacks from unknown domains
- Cookie theft

---

### 6. Security Headers (Helmet.js)
**Location:** `backend/src/middleware/security/index.ts`

**Headers Applied:**
```
Content-Security-Policy: Restricts resource loading
Strict-Transport-Security: Forces HTTPS
X-Content-Type-Options: Prevents MIME sniffing
X-Frame-Options: Prevents clickjacking
X-XSS-Protection: Browser XSS filter
Referrer-Policy: Controls referer information
```

---

### 7. File Upload Security
**Location:** `backend/src/utils/fileValidation.ts`, `backend/src/services/fileUpload/enhanced-upload.ts`

**Magic Number Validation:**
- Validates actual file content, not just extension
- Checks file signatures (first bytes)
- Detects files disguised as images

**Protection Against:**
```typescript
// Blocked file types
- Executables (.exe, .bat, .sh, .cmd)
- Scripts (.php, .jsp, .asp, .ps1)
- Path traversal (../)
- Embedded scripts in images
- Decompression bombs
```

**Size Limits:**
- Images: 5MB max
- Documents: 10MB max

---

### 8. Request Validation & Type Safety
**Location:** All route files

**Validation:**
- Type checking on all parameters
- Range validation (coordinates, limits, etc.)
- Required field validation
- Format validation (email, UUID, etc.)

**Example from Locations API:**
```typescript
// Parameter validation
if (!q || typeof q !== 'string') {
  return 400 error
}

// Range validation
if (latitude < -90 || latitude > 90) {
  return 400 error
}

// Limit capping
const safeLimitNum = Math.min(Math.max(1, limitNum), 100);
```

---

### 9. Authentication & Authorization
**Location:** Throughout all protected routes

**JWT-based Authentication:**
- Secure token storage
- Token expiration (1 hour access, 30 days refresh)
- Token rotation on refresh
- Secure HTTP-only cookies

**Authorization Checks:**
- Role-based access control (user, specialist, admin)
- Resource ownership verification
- Permission-based endpoint access

---

### 10. Error Handling & Information Disclosure
**Location:** All route files

**Safe Error Responses:**
- Generic error messages to clients
- Detailed logs server-side only
- No stack traces exposed
- Request ID for tracking

```typescript
// Client sees:
{ error: "Failed to fetch locations", code: "FETCH_ERROR" }

// Server logs:
{ error: full_stack_trace, user: id, ip: address, details: ... }
```

---

### 11. API Key Protection
**Location:** `backend/src/config/index.ts`, `backend/src/routes/locations.ts`

**Google Maps API Key:**
- Stored in environment variables only
- Never exposed to frontend
- Server-side API calls only
- Graceful fallback when unavailable

---

### 12. Database Query Limits
**Protection Against:**
- Expensive queries
- Database overload
- Data scraping

**Limits Applied:**
```typescript
// Locations API
- Cities query: Max 100 results
- Nearby search: Max 100 results, 200 DB records processed
- Search autocomplete: Max 10 results
```

---

### 13. Request Timeouts
**Location:** All Google Maps API calls

**Timeouts:**
- Google Places Autocomplete: 5 seconds
- Geocoding: 5 seconds
- Reverse Geocoding: 5 seconds

**Prevents:**
- Hanging requests
- Resource exhaustion
- DoS via slow requests

---

## Attack Scenarios & Defenses

### Scenario 1: Malicious Frontend Sends Excessive Requests
**Attack:** Compromised frontend sends 1000s of requests/second

**Defense:**
1. ✅ Rate limiting kicks in (60 requests/minute for search)
2. ✅ Returns 429 Too Many Requests
3. ✅ Logs suspicious activity with IP/user
4. ✅ Temporary ban after repeated violations

---

### Scenario 2: XSS Injection via Location Search
**Attack:** `<script>alert('XSS')</script>` in search query

**Defense:**
1. ✅ Input sanitization removes `<script>` tags
2. ✅ Query length limit (200 chars) prevents large payloads
3. ✅ DOMPurify on frontend (double protection)
4. ✅ CSP headers block inline scripts

---

### Scenario 3: SQL Injection via City Filter
**Attack:** `'; DROP TABLE specialists; --` in city parameter

**Defense:**
1. ✅ Prisma ORM parameterizes query automatically
2. ✅ `sanitizeSearchQuery()` removes SQL meta-characters
3. ✅ Input validation rejects malformed input
4. ✅ Database user has limited permissions

---

### Scenario 4: Path Traversal via File Upload
**Attack:** Upload file named `../../etc/passwd`

**Defense:**
1. ✅ Filename sanitization removes `../`
2. ✅ UUIDs used for file storage
3. ✅ Files stored in isolated directory
4. ✅ Magic number validation prevents fake files

---

### Scenario 5: CSRF Attack from Malicious Site
**Attack:** Evil site makes requests to your API

**Defense:**
1. ✅ CORS whitelist blocks unauthorized origins
2. ✅ SameSite cookies prevent cross-site requests
3. ✅ CSRF tokens on state-changing operations
4. ✅ Origin header validation

---

### Scenario 6: Coordinate Abuse (Scraping Specialist Locations)
**Attack:** Loop through all coordinates to scrape specialist data

**Defense:**
1. ✅ Rate limiting (60 requests/minute)
2. ✅ Coordinate range validation
3. ✅ Radius limit (500km max)
4. ✅ Result limit (100 max)
5. ✅ Database query limit (200 records)

---

### Scenario 7: API Key Theft
**Attack:** Attacker tries to access Google Maps API key

**Defense:**
1. ✅ API key stored in environment variables only
2. ✅ Never sent to frontend
3. ✅ All Google Maps calls server-side only
4. ✅ Fallback to database when key unavailable

---

## Security Checklist

### All API Endpoints ✅
- [x] Rate limiting applied
- [x] Input sanitization
- [x] Output sanitization
- [x] Error handling (no info disclosure)
- [x] Request ID tracking
- [x] CORS protection
- [x] Security headers

### Locations API Specific ✅
- [x] Query length limits
- [x] Coordinate range validation
- [x] Radius limits
- [x] Result count limits
- [x] Database query limits
- [x] Search rate limiting
- [x] Type validation
- [x] Timeout protection

### Data Protection ✅
- [x] SQL injection prevention (Prisma)
- [x] XSS prevention (sanitization)
- [x] Path traversal prevention
- [x] File upload validation
- [x] Magic number verification
- [x] No sensitive data exposure

### Infrastructure ✅
- [x] HTTPS enforcement (HSTS)
- [x] Security headers (Helmet)
- [x] CORS whitelist
- [x] JWT authentication
- [x] Session security
- [x] API key protection

---

## Monitoring & Logging

**What's Logged:**
- Rate limit violations
- Failed authentication attempts
- Suspicious input patterns
- Error conditions
- Request IDs for tracing

**What's NOT Logged:**
- Passwords (even hashed)
- API keys
- Sensitive user data
- Full request bodies (only sanitized versions)

---

## Regular Security Maintenance

**Monthly:**
- Review rate limit logs
- Check for unusual patterns
- Update dependency security patches

**Quarterly:**
- Security audit of new endpoints
- Review and update CORS whitelist
- Test XSS/SQL injection vectors

**Annually:**
- Penetration testing
- Security header review
- Update security documentation

---

**Last Updated:** 2024-12-24
**Security Review Date:** 2024-12-24
**Review Status:** ✅ PASS - All protections verified and tested
