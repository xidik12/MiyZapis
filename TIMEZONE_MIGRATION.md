# Timezone Migration Guide

## Problem

Availability blocks created before commit `ff16124` have incorrect timezone storage:

- **Bug**: Times were saved with hardcoded `Z` suffix (UTC timezone)
- **Impact**: 8:30 AM local (Cambodia UTC+7) was saved as 8:30 AM UTC
- **Result**: When displayed, shows as 15:30 (3:30 PM) or 16:00 (4:00 PM) local time

## Solution

### Step 1: Deploy Frontend with Fix

The timezone fix has been committed in `ff16124`. Ensure Railway has deployed the latest frontend build with this commit.

**Files Changed:**
- `frontend/src/pages/specialist/Schedule.tsx` - Now uses proper `toISOString()` conversion

### Step 2: Run Database Migration

Run the migration script to fix existing availability blocks in the database.

#### Development/Local

```bash
cd backend
npx tsx src/scripts/fix-availability-timezone.ts
```

#### Production (Railway)

```bash
cd backend
DATABASE_URL="postgresql://postgres:GVGsHSeKoazyvATppTqvabRFqGniRQsH@caboose.proxy.rlwy.net:51538/railway" npx tsx src/scripts/fix-availability-timezone.ts
```

## What the Migration Does

1. Fetches all availability blocks from the database
2. Subtracts 7 hours (Cambodia timezone offset) from each block's start and end times
3. Updates the database with corrected times
4. Provides a summary of changes

### Example

**Before Migration:**
- Database: `2025-10-21T08:30:00.000Z` (8:30 AM UTC)
- Displayed: 15:30 (3:30 PM) local time ❌

**After Migration:**
- Database: `2025-10-21T01:30:00.000Z` (1:30 AM UTC = 8:30 AM UTC+7)
- Displayed: 08:30 (8:30 AM) local time ✅

## Verification

After running the migration:

1. Log into the specialist schedule page
2. Check that times show correctly (e.g., 8:30 AM instead of 16:00)
3. Create a new availability block to verify new blocks also work correctly

## Important Notes

- ⚠️ **Run this migration only ONCE** - Running it multiple times will subtract the offset multiple times
- ✅ **Safe for production** - The script only modifies availability blocks, not bookings
- 🔄 **Future blocks** - New availability blocks created after frontend deployment will automatically use correct timezone
- 📊 **No downtime** - Migration can run while the app is live

## Rollback

If something goes wrong, you can rollback by:

1. Restoring from database backup, OR
2. Running the script with offset in opposite direction (add 7 hours instead of subtract)

To rollback, modify line 18 in `fix-availability-timezone.ts`:

```typescript
// Change from:
const TIMEZONE_OFFSET_HOURS = 7;

// To:
const TIMEZONE_OFFSET_HOURS = -7; // Negative to add hours back
```

## Technical Details

**Timezone**: Cambodia (UTC+7)
**Affected Tables**: `availabilityBlock`
**Affected Fields**: `startDateTime`, `endDateTime`
**Migration Script**: `backend/src/scripts/fix-availability-timezone.ts`
**Fixed in Commit**: `ff16124`
