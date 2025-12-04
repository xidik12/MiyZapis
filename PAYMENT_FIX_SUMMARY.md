# Payment Endpoints Fix Summary

## Problem

The PayPal and WayForPay payment endpoints were returning **500 Internal Server Error** when attempting to create payments with temporary booking IDs in the payment-first flow.

### Affected Endpoints
- `POST /api/v1/payments/paypal/create-order`
- `POST /api/v1/payments/wayforpay/create-invoice`

### Test Data Used by Frontend
- **PayPal**: `{bookingId: 'booking-1759806764967', amount: 100, currency: 'USD', description: 'Haircut - Xidik Dev'}`
- **WayForPay**: `{bookingId: 'booking-1759806764967', amount: 4000, currency: 'UAH', description: 'Haircut - Xidik Dev', customerEmail: '', customerPhone: ''}`

## Root Causes Identified

### 1. Invalid CUID Validation (Both PayPal & WayForPay)

**Location**: `backend/src/controllers/payment.controller.ts` lines 85, 96

**Issue**: The validation schemas used `.cuid()` validator which requires the string to be in CUID format:
```typescript
// BEFORE (Lines 85, 96)
bookingId: z.string().cuid(),  // ✗ Rejects temporary IDs like 'booking-1759806764967'
```

**Problem**: Temporary booking IDs from payment-first flow (e.g., `'booking-1759806764967'`) are NOT valid CUIDs, causing validation to fail with 400 errors that were likely being caught and re-thrown as 500 errors.

**Fix Applied**:
```typescript
// AFTER (Lines 85, 96)
bookingId: z.string().min(1),  // ✓ Accepts any non-empty string for payment-first flow
```

### 2. Email/Phone Validation Rejecting Empty Strings (WayForPay Only)

**Location**: `backend/src/controllers/payment.controller.ts` lines 89-90

**Issue**: The validation schema rejected empty strings for email and phone:
```typescript
// BEFORE
customerEmail: z.string().email().optional(),  // ✗ Rejects empty string ''
customerPhone: z.string().optional(),          // ✗ Rejects empty string ''
```

**Problem**: Frontend sends `customerEmail: ''` and `customerPhone: ''` (empty strings), but `.email().optional()` validates the email format if a value is present (including empty string), causing validation failures.

**Fix Applied**:
```typescript
// AFTER
customerEmail: z.string().email().optional().or(z.literal('')),  // ✓ Allows empty string
customerPhone: z.string().optional().or(z.literal('')),          // ✓ Allows empty string
```

### 3. Missing Payment-First Flow Support (WayForPay Only)

**Location**: `backend/src/controllers/payment.controller.ts` lines 1262-1294

**Issue**: WayForPay controller required booking to exist in database:
```typescript
// BEFORE (Lines 1263-1274)
const booking = await prisma.booking.findUnique({
  where: { id: validatedData.bookingId },
  include: { customer: true, service: true },
});

if (!booking) {
  res.status(404).json({ error: 'Booking not found' });  // ✗ Rejects payment-first flow
  return;
}
```

**Problem**: In payment-first flow, the booking doesn't exist yet (it's created after payment). This caused 404 errors for temporary booking IDs.

**Fix Applied**:
```typescript
// AFTER (Lines 1262-1294)
// For payment-first flow, bookingId might be a temporary identifier
// Try to find booking first, if not found, treat as payment intent
let booking = null;
let description = validatedData.description || 'Booking payment';
let customerEmail = validatedData.customerEmail;
let customerPhone = validatedData.customerPhone;

try {
  booking = await prisma.booking.findUnique({
    where: { id: validatedData.bookingId },
    include: { customer: true, service: true },
  });

  if (booking) {
    // Verify user owns this booking
    if (booking.customerId !== userId) {
      res.status(403).json({ error: 'Forbidden - not your booking' });
      return;
    }
    description = validatedData.description || `Payment for ${booking.service.name}`;
    customerEmail = validatedData.customerEmail || booking.customer.email;
    customerPhone = validatedData.customerPhone || booking.customer.phoneNumber;
  }
} catch (error) {
  // Booking not found, proceed with payment intent flow
  logger.info('[WayForPay] Booking not found, treating as payment intent', {
    bookingId: validatedData.bookingId,
    userId,
  });
}

const invoice = await wayforpayService.createInvoice({
  bookingId: validatedData.bookingId,
  amount: validatedData.amount,
  currency: validatedData.currency,
  description,
  customerEmail: customerEmail || undefined,
  customerPhone: customerPhone || undefined,
  metadata: {
    ...validatedData.metadata,
    userId,
    isPaymentIntent: booking ? 'false' : 'true',  // ✓ Track payment intent vs booking payment
  },
});
```

## Changes Made

### File: `/Users/salakhitdinovkhidayotullo/Documents/BookingBot/backend/src/controllers/payment.controller.ts`

#### Change 1: Fixed Validation Schemas (Lines 84-101)
- Changed `bookingId` validation from `.cuid()` to `.min(1)` in both PayPal and WayForPay schemas
- Updated `customerEmail` to accept empty strings: `.email().optional().or(z.literal(''))`
- Updated `customerPhone` to accept empty strings: `.optional().or(z.literal(''))`

#### Change 2: Added Payment-First Flow Support to WayForPay (Lines 1262-1308)
- Changed from requiring booking to exist to optional booking lookup
- Added try-catch around booking lookup to handle non-existent bookings gracefully
- Use provided customer info or fallback to booking customer info if available
- Added `isPaymentIntent` metadata to track payment-first vs booking-linked payments

## Testing

### Test Script Created
Location: `/Users/salakhitdinovkhidayotullo/Documents/BookingBot/test-payment-endpoints-with-auth.sh`

This script tests both endpoints with temporary booking IDs after deployment.

### How to Test

1. **Deploy Changes to Railway**
   ```bash
   cd /Users/salakhitdinovkhidayotullo/Documents/BookingBot/backend
   git add src/controllers/payment.controller.ts
   git commit -m "fix: support payment-first flow in PayPal and WayForPay endpoints"
   git push
   ```

2. **Get Authentication Token**
   - Use Telegram mini-app to authenticate
   - Or use frontend application to log in
   - Extract JWT token from response

3. **Run Test Script**
   ```bash
   export JWT_TOKEN='your-jwt-token-here'
   ./test-payment-endpoints-with-auth.sh
   ```

### Expected Results

Both endpoints should now:
- ✓ Accept temporary booking IDs like `'booking-1759806764967'`
- ✓ Return 200 OK with payment order/invoice data
- ✓ NOT return 500 Internal Server Error
- ✓ NOT return validation errors about CUID format
- ✓ Support payment-first flow (create payment before booking exists)

## Comparison with Coinbase (Working Implementation)

The Coinbase crypto payment endpoint already supports payment-first flow correctly. The fixes applied to PayPal and WayForPay bring them in line with the Coinbase implementation pattern.

## Additional Notes

- PayPal endpoint already had payment-first flow logic, only validation was broken
- WayForPay endpoint needed both validation fix AND payment-first flow logic
- Both endpoints now track whether payment is for existing booking or payment intent via metadata
- Empty email/phone strings are now properly handled in WayForPay

## Files Modified

1. `/Users/salakhitdinovkhidayotullo/Documents/BookingBot/backend/src/controllers/payment.controller.ts`
   - Lines 85-91: WayForPay schema validation
   - Lines 95-101: PayPal schema validation  
   - Lines 1262-1308: WayForPay payment-first flow support

## Next Steps

1. Deploy changes to Railway production environment
2. Test endpoints with valid authentication token
3. Verify frontend payment flow works end-to-end
4. Monitor logs for any unexpected errors

---

**Fix Date**: 2025-10-07  
**Issue Type**: Bug Fix  
**Severity**: High (Payment flow broken)  
**Status**: Code Fixed - Awaiting Deployment
