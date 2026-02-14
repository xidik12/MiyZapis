# Admin Dashboard API - Bug Report and Test Results

**Date:** 2026-02-05
**API URL:** https://miyzapis-backend-production.up.railway.app
**Tester:** Claude Code
**Test Suite Version:** 1.0

---

## Executive Summary

All admin dashboard API endpoints are **functional** and return HTTP 200 status codes. However, several **data quality issues** and **security vulnerabilities** were identified that need immediate attention.

**Overall Status:** ⚠️ Working with Issues
**Critical Issues:** 2
**High Priority Issues:** 1
**Medium Priority Issues:** 2

---

## Test Results Summary

| Endpoint | Status | Response Time | Issues Found |
|----------|--------|---------------|--------------|
| Dashboard Stats | ✅ 200 OK | 200-350ms | Date serialization |
| User Analytics | ✅ 200 OK | 110-150ms | **Date serialization** |
| Booking Analytics | ✅ 200 OK | 120-140ms | **Date & hour serialization** |
| Financial Analytics | ✅ 200 OK | 130-210ms | Date serialization |
| Referral Analytics | ✅ 200 OK | 140-160ms | None |
| System Health | ✅ 200 OK | 120-145ms | None |
| Audit Logs | ✅ 200 OK | 85-95ms | None |

**Success Rate:** 100% (7/7 endpoints functional)
**Average Response Time:** 166ms (Excellent)

---

## Critical Issues

### 🔴 CRITICAL #1: Date Serialization Failure

**Severity:** Critical
**Endpoints Affected:**
- `/api/v1/admin/analytics/users` (userTrends)
- `/api/v1/admin/analytics/bookings` (bookingTrends)
- `/api/v1/admin/analytics/financial` (revenueTrends)

**Description:**
Date fields from PostgreSQL `date::date` casts are being serialized as empty objects `{}` instead of ISO date strings.

**Example Issue:**
```json
{
  "date": {},  // ❌ Should be "2026-02-04" or "2026-02-04T00:00:00.000Z"
  "userType": "CUSTOMER",
  "count": 4
}
```

**Root Cause:**
PostgreSQL DATE values are being returned as JavaScript Date objects but not properly serialized to JSON. The `serializeBigInt` utility doesn't handle Date objects.

**Impact:**
- Frontend cannot parse dates for charts and graphs
- Time-series analytics are completely broken
- Users cannot see trends over time

**Recommended Fix:**
```typescript
// In admin-dashboard.ts, update serializeBigInt calls to handle dates
export function serializeData(obj: any): any {
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    // Handle BigInt
    if (typeof value === 'bigint') {
      return Number(value);
    }
    // Handle Date objects
    if (value instanceof Date) {
      return value.toISOString();
    }
    // Handle plain date values from Prisma
    if (value && typeof value === 'object' && value.constructor.name === 'Date') {
      return value.toISOString();
    }
    return value;
  }));
}
```

**Files to Update:**
1. `/backend/src/controllers/admin/admin-dashboard.ts` - Lines 342, 458, 574
2. `/backend/src/utils/bigint.ts` - Update serializeBigInt function

---

### 🔴 CRITICAL #2: Hour Field Serialization Error

**Severity:** Critical
**Endpoint Affected:** `/api/v1/admin/analytics/bookings` (hourlyStats)

**Description:**
The `hour` field from `EXTRACT(hour FROM "scheduledAt")` is returned as a complex object structure instead of a simple number.

**Example Issue:**
```json
{
  "hour": {
    "s": 1,
    "e": 0,
    "d": [8]
  },
  "count": 1
}
```

**Expected:**
```json
{
  "hour": 8,
  "count": 1
}
```

**Root Cause:**
PostgreSQL's `EXTRACT(hour ...)` returns a numeric type that Prisma serializes incorrectly.

**Impact:**
- Peak hours chart cannot be rendered
- Business insights about busiest times are unavailable

**Recommended Fix:**
```typescript
// In admin-dashboard.ts, line 431-440
const hourlyStats = await prisma.$queryRaw`
  SELECT
    CAST(EXTRACT(hour FROM "scheduledAt") AS INTEGER) as hour,
    COUNT(*) as count
  FROM bookings
  WHERE "createdAt" >= ${startDate}
    AND status IN ('CONFIRMED', 'COMPLETED')
  GROUP BY EXTRACT(hour FROM "scheduledAt")
  ORDER BY hour ASC
`;
```

Or apply proper serialization:
```typescript
const hourlyStats = (await prisma.$queryRaw`...`).map((stat: any) => ({
  hour: parseInt(stat.hour?.d?.[0] || stat.hour || 0),
  count: parseInt(stat.count)
}));
```

---

## High Priority Issues

### 🟠 HIGH #1: XSS Vulnerability in User Input

**Severity:** High (Security)
**Endpoints Affected:** `/api/v1/admin/dashboard/stats` (topSpecialists)

**Description:**
Unsanitized HTML/JavaScript code is present in user-submitted names, indicating a potential XSS vulnerability.

**Evidence:**
```json
{
  "id": "cmjermwrj0018qk0c89nlt33g",
  "name": "<img src=x alert(document.cookie)> 2",
  "email": "testuser20533bt@gmail.com",
  "businessName": "",
  "rating": 0,
  "reviewCount": 0,
  "servicesCount": 0,
  "isVerified": false
}
```

Multiple test accounts exist with XSS payloads in names:
- `<img src=x alert(document.cookie)> 2`
- `<Test> 2`

**Impact:**
- If rendered in admin dashboard without escaping, could execute malicious JavaScript
- Could steal admin session tokens/cookies
- Violates security best practices

**Recommended Fix:**

1. **Input Validation** - Add validation on user registration:
```typescript
// In validation middleware
const nameRegex = /^[a-zA-Z\s\u0400-\u04FF\u0100-\u017F-]+$/; // Allow letters, spaces, Cyrillic, Latin extended
if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
  throw new ValidationError('Names can only contain letters and spaces');
}
```

2. **Output Encoding** - Ensure frontend escapes HTML:
```typescript
// Frontend should use React's automatic escaping or DOMPurify
import DOMPurify from 'dompurify';
const cleanName = DOMPurify.sanitize(user.name);
```

3. **Database Cleanup** - Remove existing XSS test accounts:
```sql
DELETE FROM users
WHERE email LIKE '%testuser20%bt@gmail.com'
  OR "firstName" LIKE '%<%>%'
  OR "lastName" LIKE '%<%>%';
```

**Files to Update:**
1. `/backend/src/middleware/validation/auth.ts` - Add name validation
2. `/backend/src/controllers/auth.controller.ts` - Sanitize input on registration

---

## Medium Priority Issues

### 🟡 MEDIUM #1: Empty Category Values

**Severity:** Medium
**Endpoint Affected:** `/api/v1/admin/dashboard/stats` (categoryStats)

**Description:**
Some services have empty string categories, which breaks analytics and filtering.

**Example:**
```json
{
  "_count": { "id": 1 },
  "_avg": { "basePrice": 300 },
  "category": ""  // ❌ Empty string
}
```

**Impact:**
- Category-based filtering returns incomplete results
- Analytics charts have empty/unlabeled sections
- Poor user experience

**Recommended Fix:**

1. **Add database constraint:**
```sql
ALTER TABLE services
ADD CONSTRAINT category_not_empty
CHECK (category IS NOT NULL AND category != '');
```

2. **Add validation in service creation:**
```typescript
// In service validation
if (!serviceData.category || serviceData.category.trim() === '') {
  throw new ValidationError('Service category is required');
}
```

3. **Migration to fix existing data:**
```sql
UPDATE services
SET category = 'uncategorized'
WHERE category = '' OR category IS NULL;
```

---

### 🟡 MEDIUM #2: Inconsistent Category Naming

**Severity:** Medium
**Endpoint Affected:** `/api/v1/admin/dashboard/stats` (categoryStats)

**Description:**
Category naming is inconsistent - mix of kebab-case, empty strings, and Cyrillic text.

**Examples:**
- `"hair-styling"` ✅ (kebab-case)
- `"language-lessons"` ✅ (kebab-case)
- `""` ❌ (empty)
- `"Пекарь"` ❌ (Cyrillic, not standardized)

**Impact:**
- Difficult to filter and group services
- Localization issues
- API responses inconsistent

**Recommended Fix:**

1. **Define standard category enum:**
```typescript
export enum ServiceCategory {
  HAIR_STYLING = 'hair-styling',
  BEAUTY_MAKEUP = 'beauty-makeup',
  EDUCATION_TUTORING = 'education-tutoring',
  LANGUAGE_LESSONS = 'language-lessons',
  HOME_SERVICES = 'home-services',
  HEALTH_FITNESS = 'health-fitness',
  BUSINESS_CONSULTING = 'business-consulting',
  TECHNOLOGY = 'technology',
  OTHER = 'other'
}
```

2. **Add category display names with i18n:**
```typescript
const categoryLabels = {
  'hair-styling': { en: 'Hair Styling', uk: 'Перукарство' },
  'education-tutoring': { en: 'Education & Tutoring', uk: 'Освіта та репетиторство' },
  // ...
};
```

---

## Low Priority Observations

### ℹ️ INFO #1: Low Active User Count

**Observation:** Only 1 active user in last 24 hours out of 30 total users (3.3%)

**Possible Explanations:**
- Test/staging environment
- Low user engagement
- lastLoginAt not being updated correctly

**Recommendation:** Monitor this metric and investigate user engagement.

---

### ℹ️ INFO #2: High Pending Booking Rate

**Observation:** 7 out of 10 bookings are in PENDING status (70%)

**Possible Explanations:**
- Manual approval process is slow
- Payment processing delays
- Test bookings not being completed

**Recommendation:** Review booking workflow and add automated confirmation where possible.

---

### ℹ️ INFO #3: Empty Audit Logs

**Observation:** Audit logs endpoint returns empty array

**Status:** This is expected if AuditLog table doesn't exist yet (as noted in code comments)

**Recommendation:** Implement audit logging for admin actions when ready.

---

## Data Quality Report

### Database Statistics (as of 2026-02-05)

| Metric | Value |
|--------|-------|
| Total Users | 30 |
| Active Users (30d) | 10 |
| Total Specialists | 10 |
| Total Services | 7 |
| Total Bookings | 10 |
| Completed Bookings | 3 |
| Pending Bookings | 7 |
| Total Revenue | $360 |
| Conversion Rate | 33.33% |

### Growth Metrics (Last 30 Days)

| Metric | Current | Previous | Growth |
|--------|---------|----------|--------|
| New Users | 10 | 16 | -37.5% ⬇️ |
| New Bookings | 8 | 2 | +300% ⬆️ |
| Revenue | $360 | $0 | +100% ⬆️ |

---

## Authentication & Authorization Testing

### ✅ Tests Passed

1. **Valid admin login** - Successfully authenticated with admin credentials
2. **JWT token generation** - Received valid access token
3. **Token validation** - All endpoints accept valid Bearer token
4. **Admin role check** - Endpoints require admin role
5. **Unauthorized access prevention** - Returns 401 without token
6. **Invalid token rejection** - Returns 401 with invalid token

### Test Credentials Used
- Email: admin@miyzapis.com
- Password: Admin123!@#
- User Type: admin
- Status: Active ✅

---

## Performance Analysis

### Response Time Distribution

```
Endpoint                    Min      Avg      Max
────────────────────────────────────────────────
Dashboard Stats (7d)        156ms    245ms    347ms
Dashboard Stats (30d)       182ms    208ms    261ms
Dashboard Stats (90d)       256ms    256ms    256ms
Dashboard Stats (1y)        156ms    156ms    156ms
User Analytics              100ms    122ms    285ms
Booking Analytics           121ms    130ms    139ms
Financial Analytics         133ms    171ms    209ms
Referral Analytics          143ms    151ms    160ms
System Health               124ms    132ms    143ms
Audit Logs                  87ms     89ms     95ms
────────────────────────────────────────────────
Overall Average                     166ms
```

**Performance Grade:** ⭐⭐⭐⭐⭐ Excellent (all under 1 second)

### System Health Metrics

```
Uptime:         206,524 seconds (≈ 57 hours)
Memory Usage:   57.6 MB / 60.8 MB heap (94.8% utilization)
Platform:       Linux
Node Version:   v18.20.8
Environment:    production
Database:       ✅ Healthy
Redis:          ✅ Healthy
Overall Status: ✅ Healthy
```

---

## Security Findings

### ✅ Security Measures In Place

1. JWT-based authentication
2. Admin role authorization
3. HTTPS encryption (Railway platform)
4. Request ID tracking
5. Token expiration handling

### ⚠️ Security Issues Found

1. **XSS Vulnerability (HIGH)** - Unsanitized user input in names
2. **No rate limiting visible** - Should verify if implemented in middleware
3. **No CSRF tokens** - For write operations (user management, referrals)

### 🔒 Security Recommendations

1. **Immediate:** Clean up XSS test accounts and add input validation
2. **Short-term:** Implement rate limiting on admin endpoints
3. **Medium-term:** Add CSRF protection for state-changing operations
4. **Long-term:** Implement audit logging for all admin actions

---

## Endpoint-Specific Details

### 1. Dashboard Stats
**URL:** `GET /api/v1/admin/dashboard/stats?period={period}`

**Parameters:**
- `period` (optional): `7d`, `30d`, `90d`, `1y` (default: `30d`)

**Response Structure:** ✅ Correct
- `stats.overview` - Overview metrics (users, bookings, revenue)
- `stats.growth` - Growth comparison with previous period
- `stats.recentActivity` - Recent bookings and users
- `stats.analytics` - Category stats and top specialists

**Issues:**
- None for overview and growth
- XSS in topSpecialists names (see HIGH #1)
- Empty categories in categoryStats (see MEDIUM #1)

---

### 2. User Analytics
**URL:** `GET /api/v1/admin/analytics/users?period={period}&userType={type}`

**Parameters:**
- `period` (optional): `7d`, `30d`, `90d`, `1y` (default: `30d`)
- `userType` (optional): `CUSTOMER`, `SPECIALIST`, `ADMIN`

**Response Structure:** ⚠️ Date serialization issue
- `userTrends` - Registration trends over time (dates broken ❌)
- `engagementStats` - Engagement by user type ✅
- `geographicStats` - Distribution by timezone ✅
- `platformStats` - Empty array (expected)

**Issues:**
- **CRITICAL:** Date fields return empty objects `{}`

---

### 3. Booking Analytics
**URL:** `GET /api/v1/admin/analytics/bookings?period={period}`

**Parameters:**
- `period` (optional): `7d`, `30d`, `90d`, `1y` (default: `30d`)

**Response Structure:** ⚠️ Multiple serialization issues
- `statusStats` - Booking counts by status ✅
- `bookingTrends` - Trends over time (dates broken ❌)
- `popularServices` - Top services ✅
- `hourlyStats` - Peak hours (hour field broken ❌)
- `categoryRevenue` - Revenue by category ✅

**Issues:**
- **CRITICAL:** Date fields return empty objects `{}`
- **CRITICAL:** Hour field returns complex object instead of number

---

### 4. Financial Analytics
**URL:** `GET /api/v1/admin/analytics/financial?period={period}`

**Parameters:**
- `period` (optional): `7d`, `30d`, `90d`, `1y` (default: `30d`)

**Response Structure:** ⚠️ Date serialization issue
- `revenueTrends` - Revenue over time (dates broken ❌)
- `paymentMethodStats` - Payment method distribution ✅
- `currencyStats` - Currency distribution ✅
- `topEarningSpecialists` - Top earners ✅
- `refundStats` - Refund analysis ✅

**Issues:**
- **CRITICAL:** Date fields return empty objects `{}`

---

### 5. Referral Analytics
**URL:** `GET /api/v1/admin/analytics/referrals`

**Response Structure:** ✅ Perfect
- `referralAnalytics.overview` - Overall stats
- `referralAnalytics.byType` - Breakdown by referral type
- `referralAnalytics.recentActivity` - Recent activity
- `referralAnalytics.topReferrers` - Top referrers list

**Issues:** None ✅

---

### 6. System Health
**URL:** `GET /api/v1/admin/system/health`

**Response Structure:** ✅ Perfect
- `healthChecks` - Database and Redis status
- `systemMetrics` - Uptime, memory, CPU
- `appMetrics` - User and booking counts
- `overallStatus` - Overall health status

**Issues:** None ✅

---

### 7. Audit Logs
**URL:** `GET /api/v1/admin/audit-logs`

**Response Structure:** ✅ Correct (empty by design)
- `auditLogs` - Array of audit log entries
- `pagination` - Pagination metadata

**Issues:** None (empty is expected) ✅

---

## Action Items

### Immediate (Fix Today)

1. ✅ **Fix date serialization** in analytics endpoints (CRITICAL #1)
2. ✅ **Fix hour serialization** in booking analytics (CRITICAL #2)
3. ⚠️ **Remove XSS test accounts** from database (HIGH #1)
4. ⚠️ **Add input validation** for user names (HIGH #1)

### Short-term (Fix This Week)

5. 📋 **Fix empty categories** in existing services (MEDIUM #1)
6. 📋 **Add category validation** to service creation (MEDIUM #1)
7. 📋 **Standardize category naming** (MEDIUM #2)
8. 📋 **Add rate limiting** to admin endpoints (Security)

### Medium-term (Fix This Month)

9. 📅 **Implement audit logging** functionality
10. 📅 **Add CSRF protection** for write operations
11. 📅 **Review and improve** booking approval workflow
12. 📅 **Add comprehensive** input sanitization across all endpoints

---

## Testing Recommendations

### Automated Testing
1. Add integration tests for all admin endpoints
2. Add test cases for date serialization edge cases
3. Add security tests for XSS and SQL injection
4. Add performance benchmarks

### Manual Testing Checklist
- [ ] Test with large datasets (1000+ users, bookings)
- [ ] Test all period options (7d, 30d, 90d, 1y)
- [ ] Test with empty database
- [ ] Test error handling (database down, Redis down)
- [ ] Test concurrent requests
- [ ] Test with different timezones

---

## Conclusion

The MiyZapis admin dashboard API is **functional and performant**, with excellent response times averaging 166ms. The authentication and authorization mechanisms work correctly, and the system health is good.

However, **three critical issues** require immediate attention:
1. Date serialization failures break time-series analytics
2. Hour field serialization prevents peak hours analysis
3. XSS vulnerability poses security risk

Once these issues are resolved, the admin dashboard will be production-ready. The data quality issues (empty categories, naming inconsistency) are lower priority but should be addressed for better user experience.

**Overall Grade:** B+ (Good with critical fixes needed)

---

## Appendix: Test Artifacts

### Generated Files
1. `admin-api-test-results.json` - Full JSON response data
2. `admin-api-test-results.md` - Detailed test documentation
3. `ADMIN_API_BUG_REPORT.md` - This report
4. `test-all-admin-endpoints.js` - Comprehensive test suite
5. `test-admin-detailed.js` - Detailed response documentation script

### Test Commands
```bash
# Run comprehensive tests
node backend/src/scripts/test-all-admin-endpoints.js

# Run detailed tests with response capture
node backend/src/scripts/test-admin-detailed.js

# Run individual endpoint test
curl -H "Authorization: Bearer $TOKEN" \
  https://miyzapis-backend-production.up.railway.app/api/v1/admin/dashboard/stats
```

---

**Report Generated:** 2026-02-05T10:05:00.000Z
**Test Duration:** ~5 seconds
**Total Endpoints Tested:** 7
**Total Issues Found:** 7 (2 critical, 1 high, 2 medium, 2 info)
