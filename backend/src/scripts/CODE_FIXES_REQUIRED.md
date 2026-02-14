# Code Fixes Required - Admin Dashboard API

This document shows **exactly** what code changes are needed to fix the critical bugs.

---

## File 1: Create New Utility File

**Location:** `/backend/src/utils/serialize.ts`

**Status:** ✅ Already created - file ready at this location

**What it does:**
- Serializes Date objects to ISO strings
- Serializes BigInt to numbers
- Handles PostgreSQL numeric types
- Provides XSS detection and sanitization

**Action:** No action needed - file is ready to use

---

## File 2: Update Admin Dashboard Controller

**Location:** `/backend/src/controllers/admin/admin-dashboard.ts`

### Change #1: Add Import Statement

**Line 6** - Add this import after the existing imports:

```typescript
import { serializeQueryResult } from '@/utils/serialize';
```

Full imports section should look like:
```typescript
import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest } from '@/types';
import { serializeBigInt } from '@/utils/bigint';
import { serializeQueryResult } from '@/utils/serialize';  // ✅ ADD THIS LINE
```

---

### Change #2: Fix User Analytics (Line 342)

**Find** (around line 342):
```typescript
res.json(createSuccessResponse({
  userTrends: serializeBigInt(userTrends),
  engagementStats: serializeBigInt(engagementStats),
  geographicStats: serializeBigInt(geographicStats),
  platformStats
}));
```

**Replace with:**
```typescript
res.json(createSuccessResponse({
  userTrends: serializeQueryResult(userTrends),  // ✅ CHANGED
  engagementStats: serializeBigInt(engagementStats),
  geographicStats: serializeBigInt(geographicStats),
  platformStats
}));
```

---

### Change #3: Fix Booking Analytics (Lines 431-463)

**Find** (around line 431):
```typescript
// Peak hours analysis
const hourlyStats = await prisma.$queryRaw`
  SELECT
    EXTRACT(hour FROM "scheduledAt") as hour,
    COUNT(*) as count
  FROM bookings
  WHERE "createdAt" >= ${startDate}
    AND status IN ('CONFIRMED', 'COMPLETED')
  GROUP BY EXTRACT(hour FROM "scheduledAt")
  ORDER BY hour ASC
`;
```

**Replace with:**
```typescript
// Peak hours analysis
const hourlyStats = await prisma.$queryRaw`
  SELECT
    CAST(EXTRACT(hour FROM "scheduledAt") AS INTEGER) as hour,  // ✅ ADD CAST
    COUNT(*) as count
  FROM bookings
  WHERE "createdAt" >= ${startDate}
    AND status IN ('CONFIRMED', 'COMPLETED')
  GROUP BY EXTRACT(hour FROM "scheduledAt")
  ORDER BY hour ASC
`;
```

**Find** (around line 457):
```typescript
res.json(createSuccessResponse({
  statusStats: serializeBigInt(statusStats),
  bookingTrends: serializeBigInt(bookingTrends),
  popularServices: serializeBigInt(popularServicesWithDetails),
  hourlyStats: serializeBigInt(hourlyStats),
  categoryRevenue: serializeBigInt(categoryRevenue)
}));
```

**Replace with:**
```typescript
res.json(createSuccessResponse({
  statusStats: serializeBigInt(statusStats),
  bookingTrends: serializeQueryResult(bookingTrends),  // ✅ CHANGED
  popularServices: serializeBigInt(popularServicesWithDetails),
  hourlyStats: serializeQueryResult(hourlyStats),  // ✅ CHANGED
  categoryRevenue: serializeQueryResult(categoryRevenue)  // ✅ CHANGED
}));
```

---

### Change #4: Fix Financial Analytics (Line 574)

**Find** (around line 573):
```typescript
res.json(createSuccessResponse({
  revenueTrends: serializeBigInt(revenueTrends),
  paymentMethodStats: serializeBigInt(paymentMethodStats),
  currencyStats: serializeBigInt(currencyStats),
  topEarningSpecialists: serializeBigInt(topEarningSpecialists),
  refundStats: serializeBigInt({
    ...refundStats,
    refundRate: Math.round(refundRate * 100) / 100
  })
}));
```

**Replace with:**
```typescript
res.json(createSuccessResponse({
  revenueTrends: serializeQueryResult(revenueTrends),  // ✅ CHANGED
  paymentMethodStats: serializeBigInt(paymentMethodStats),
  currencyStats: serializeBigInt(currencyStats),
  topEarningSpecialists: serializeQueryResult(topEarningSpecialists),  // ✅ CHANGED
  refundStats: serializeBigInt({
    ...refundStats,
    refundRate: Math.round(refundRate * 100) / 100
  })
}));
```

---

## Summary of Changes

**Total files to modify:** 1 file (`admin-dashboard.ts`)
**Total lines to change:** ~10 lines
**Time required:** 5 minutes

### Changes breakdown:
1. Add 1 import statement (line 6)
2. Update getUserAnalytics (line 342) - 1 function call
3. Update getBookingAnalytics (lines 431 & 458) - 1 SQL query + 3 function calls
4. Update getFinancialAnalytics (line 574) - 2 function calls

---

## Testing After Changes

### Step 1: Rebuild TypeScript
```bash
cd backend
npm run build
```

### Step 2: Restart server
```bash
npm run dev
# or if on Railway, it will auto-deploy
```

### Step 3: Run tests
```bash
node src/scripts/test-all-admin-endpoints.js
```

### Step 4: Verify fixes
Check that these now work:
- ✅ User Analytics - dates should be ISO strings like "2026-02-04T00:00:00.000Z"
- ✅ Booking Analytics - dates should be ISO strings, hour should be numbers like 8
- ✅ Financial Analytics - dates should be ISO strings

---

## Before & After Examples

### User Analytics - userTrends

**Before (BROKEN):**
```json
{
  "date": {},  // ❌
  "userType": "CUSTOMER",
  "count": 4
}
```

**After (FIXED):**
```json
{
  "date": "2026-01-24T00:00:00.000Z",  // ✅
  "userType": "CUSTOMER",
  "count": 4
}
```

---

### Booking Analytics - hourlyStats

**Before (BROKEN):**
```json
{
  "hour": {
    "s": 1,
    "e": 0,
    "d": [8]
  },  // ❌
  "count": 1
}
```

**After (FIXED):**
```json
{
  "hour": 8,  // ✅
  "count": 1
}
```

---

## Alternative: Quick Patch

If you want to test the fix quickly without modifying the file, you can create a wrapper:

**Create:** `/backend/src/utils/bigint.ts` (if it doesn't exist)

```typescript
import { serializeQueryResult as serialize } from './serialize';

export function serializeBigInt(obj: any): any {
  return serialize(obj);
}
```

This way you don't need to change the controller at all - just add the serialize.ts file and update bigint.ts to use it.

---

## Rollback Plan

If something goes wrong, here's how to rollback:

1. **Revert the import:**
   ```typescript
   // Remove this line:
   import { serializeQueryResult } from '@/utils/serialize';
   ```

2. **Revert function calls:**
   Change all `serializeQueryResult()` back to `serializeBigInt()`

3. **Revert SQL query:**
   Remove `CAST(... AS INTEGER)` from the hour query

4. **Rebuild:**
   ```bash
   npm run build
   ```

---

## Need Help?

### Common Issues

**Q: Import error "Cannot find module @/utils/serialize"**
A: Make sure the file exists at `/backend/src/utils/serialize.ts`

**Q: TypeScript compilation error**
A: Run `npm run build` and check for syntax errors

**Q: Tests still failing after fix**
A: Make sure you rebuilt the TypeScript and restarted the server

**Q: Dates still showing as empty objects**
A: Check that you're using `serializeQueryResult()` not `serializeBigInt()` for the queries with dates

### Verification Commands

```bash
# Check if serialize.ts exists
ls -la backend/src/utils/serialize.ts

# Check TypeScript compilation
cd backend && npm run build

# Run quick test
node src/scripts/test-all-admin-endpoints.js

# Test single endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://miyzapis-backend-production.up.railway.app/api/v1/admin/analytics/users?period=7d | jq .
```

---

## Additional Fixes (Optional)

### Fix XSS in Database

Run this SQL to clean up test accounts:

```bash
psql $DATABASE_URL -f backend/src/scripts/fix-admin-analytics.sql
```

### Add Input Validation

Add to `/backend/src/middleware/validation/auth.ts`:

```typescript
import { sanitizeName, containsXSS } from '@/utils/serialize';

export function validateUserRegistration(req: Request, res: Response, next: NextFunction) {
  const { firstName, lastName, email } = req.body;

  // Check for XSS
  if (containsXSS(firstName) || containsXSS(lastName)) {
    return res.status(400).json({
      error: 'Names cannot contain HTML or scripts'
    });
  }

  // Sanitize names
  req.body.firstName = sanitizeName(firstName);
  req.body.lastName = sanitizeName(lastName);

  next();
}
```

---

**Last Updated:** 2026-02-05
**Estimated Fix Time:** 10 minutes
**Risk Level:** Low (only affects serialization, no business logic changes)
**Backward Compatible:** Yes (response format improves but doesn't break existing consumers)
