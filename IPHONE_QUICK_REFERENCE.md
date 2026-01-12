# iPhone App Development - Quick Reference Guide

## 1. Essential API Endpoints Checklist

### Authentication (Required First)
- [ ] POST `/auth-enhanced/login` - User login
- [ ] POST `/auth-enhanced/register` - User registration  
- [ ] POST `/auth-enhanced/refresh` - Refresh access token
- [ ] POST `/auth-enhanced/verify-email` - Verify email
- [ ] GET `/auth/me` - Get logged-in user profile

### Core Marketplace Features
- [ ] GET `/services` - Browse services with filters
- [ ] GET `/services/:id` - Service details
- [ ] GET `/specialists` - List specialists
- [ ] GET `/specialists/:id` - Specialist profile & reviews

### Booking Management
- [ ] POST `/bookings` - Create booking
- [ ] GET `/bookings` - List user's bookings
- [ ] GET `/bookings/:id` - Booking details
- [ ] PUT `/bookings/:id/cancel` - Cancel booking
- [ ] PUT `/bookings/:id/confirm` - Confirm booking (specialist)

### Payments
- [ ] POST `/payments/intent` - Create payment intent
- [ ] GET `/payments/wallet` - Get wallet balance
- [ ] POST `/payments/wallet/apply/:bookingId` - Use wallet credits
- [ ] POST `/crypto-payments/bookings/:bookingId/deposit` - Crypto payment
- [ ] GET `/crypto-payments/bookings/:bookingId/status` - Check crypto status

### Reviews & Ratings
- [ ] GET `/reviews` - List reviews
- [ ] POST `/reviews` - Create review (after completed booking)

### Messaging
- [ ] GET `/messages/conversations` - List conversations
- [ ] POST `/messages/conversations` - Start new conversation
- [ ] POST `/messages/conversations/:id/messages` - Send message

### Notifications
- [ ] GET `/notifications` - Get notifications
- [ ] PUT `/notifications/:id/read` - Mark as read

### Loyalty & Referrals
- [ ] POST `/loyalty/init` - Initialize loyalty account
- [ ] GET `/loyalty/account` - Get loyalty points & tier
- [ ] GET `/loyalty/transactions` - Transaction history
- [ ] POST `/referral/create` - Generate referral code
- [ ] GET `/referral/config` - Get referral details

---

## 2. Data Model Quick Reference

### Key Objects to Implement

**User**
```swift
struct User {
    let id: String
    let email: String
    let firstName: String
    let lastName: String
    let userType: UserType  // CUSTOMER, SPECIALIST, ADMIN
    let loyaltyPoints: Int
    let walletBalance: Double
    let avatar: URL?
}
```

**Service**
```swift
struct Service {
    let id: String
    let name: String
    let description: String
    let price: Double
    let currency: String
    let duration: Int  // minutes
    let specialistId: String
    let images: [URL]
    let isGroupSession: Bool
    let maxParticipants: Int?
}
```

**Booking**
```swift
struct Booking {
    let id: String
    let serviceId: String
    let specialistId: String
    let customerId: String
    let status: BookingStatus  // PENDING, CONFIRMED, COMPLETED, CANCELLED
    let scheduledAt: Date
    let totalAmount: Double
    let depositAmount: Double
    let depositPaid: Bool
}
```

**Payment**
```swift
struct Payment {
    let id: String
    let bookingId: String?
    let amount: Double
    let currency: String
    let status: PaymentStatus  // PENDING, SUCCEEDED, FAILED
    let paymentMethodType: String  // card, crypto, wallet
}
```

---

## 3. Authentication Flow

### Token Management (Use iOS Keychain)

```swift
// After successful login, store:
let accessToken = response.accessToken  // Expires in 1 hour
let refreshToken = response.refreshToken  // Expires in 30 days

// Store in Keychain
Keychain.save(accessToken, forKey: "access_token")
Keychain.save(refreshToken, forKey: "refresh_token")

// Add to all API requests
header: "Authorization: Bearer \(accessToken)"
```

### Auto Token Refresh

```
If API returns 401:
1. Check if refresh token exists
2. Call POST /auth-enhanced/refresh with refresh token
3. Save new access token
4. Retry original request
5. If refresh fails, logout user
```

---

## 4. Network Layer Setup

### Base Configuration

```
Base URL: https://huddle-backend-production.up.railway.app/api/v1
Timeout: 15 seconds
Content-Type: application/json
Headers: 
  - Authorization: Bearer [token]
  - X-Platform: ios
  - X-Client-Version: 1.0.0
```

### Error Handling

```swift
HTTP Status Codes:
- 200-299: Success
- 400: Validation error - show user message
- 401: Unauthorized - refresh token or logout
- 404: Not found
- 429: Rate limited - implement exponential backoff
- 5xx: Server error - retry with exponential backoff
```

### Retry Strategy

```swift
Max retries: 2-3
Backoff formula: delay = baseDelay * (2 ^ attemptNumber)
Don't retry: 400, 401, 403 errors
Retry: 5xx and network errors
```

---

## 5. Payment Integration Summary

### Stripe Cards

```
1. Collect card details via Stripe SDK
2. POST /payments/intent with bookingId
3. Process payment with Stripe clientSecret
4. Handle success/failure callback
5. Check booking status via GET /bookings/:bookingId
```

### Crypto (Coinbase)

```
1. POST /crypto-payments/bookings/:bookingId/deposit
2. Receive paymentUrl and qrCodeUrl
3. Display QR code to user
4. Poll GET /crypto-payments/bookings/:bookingId/status
5. Complete booking when status = PAID
6. Max poll duration: 1 hour
```

### Apple Pay

```
1. Use Stripe SDK or PayPal SDK
2. Show Apple Pay button
3. Same flow as Stripe cards above
4. Automatically handled by payment processor
```

### Wallet

```
1. GET /payments/wallet to check balance
2. POST /payments/wallet/apply/:bookingId to use credits
3. Automatically applied to deposit
4. Refunds auto-credited back to wallet
```

---

## 6. Real-Time Features (WebSocket/Socket.IO)

### Connection

```swift
let socket = SocketIOManager()
socket.connect(
    url: "wss://huddle-backend-production.up.railway.app",
    token: accessToken
)
```

### Events to Handle

```swift
// Subscribe to:
socket.on("notification:new")      // New notification
socket.on("booking:status_changed") // Booking updated
socket.on("message")                // New message
socket.on("payment:status_changed") // Payment updated

// Emit to:
socket.emit("join_room", ["booking_\(bookingId)"])
socket.emit("typing", ["conversationId": id])
socket.emit("message", ["content": text])
```

---

## 7. Feature Priority for MVP

### Must Have (Phase 1)
1. Authentication (email/password, Google)
2. Browse services & search
3. View specialist profiles
4. Create bookings
5. Stripe card payments
6. View booking status
7. Basic notifications
8. User profile

### Should Have (Phase 2)
1. Messaging/Chat
2. Reviews & ratings
3. Loyalty points display
4. Wallet system
5. Crypto payments
6. Referral codes
7. Favorites

### Nice to Have (Phase 3)
1. Advanced analytics (specialist)
2. Employee management
3. Custom availability blocks
4. Group sessions
5. Offline bookings
6. Notifications configuration

---

## 8. Key Settings & Configuration

### Environment Variables

```
ENVIRONMENT=production
API_BASE_URL=https://huddle-backend-production.up.railway.app/api/v1
STRIPE_PUBLISHABLE_KEY=pk_live_...
GOOGLE_CLIENT_ID=...
LOG_LEVEL=info
```

### App Constants

```swift
let MIN_PASSWORD_LENGTH = 8
let MIN_BOOKING_ADVANCE_HOURS = 1
let MAX_BOOKING_ADVANCE_DAYS = 90
let BOOKING_CANCELLATION_HOURS = 24
let LOYALTY_POINTS_PER_DOLLAR = 10
let PLATFORM_FEE_PERCENT = 5.0
let DEFAULT_DEPOSIT_PERCENT = 50.0
```

---

## 9. Security Checklist

- [ ] Use Keychain for tokens (not UserDefaults)
- [ ] Validate SSL certificates
- [ ] Implement certificate pinning
- [ ] Clear sensitive data on logout
- [ ] Don't log sensitive information
- [ ] Use HTTPS only
- [ ] Validate API responses
- [ ] Implement timeout for all requests
- [ ] Clear cache on app close
- [ ] Handle biometric authentication (optional)

---

## 10. Testing Strategy

### Unit Tests
- Network layer
- Data models  
- Validators
- Utilities

### Integration Tests
- Authentication flow
- Booking creation with payment
- Message sending
- Notification handling

### E2E Tests
- Complete booking journey
- Payment processing
- Message flow
- Specialist dashboard

### Test Data
- Create test specialist accounts
- Use test payment cards (Stripe)
- Use test crypto wallets
- Use staging API for testing

---

## 11. Performance Tips

### Network Optimization
- Cache service listings (5 min TTL)
- Cache specialist profiles (10 min TTL)
- Use pagination (20 items per page)
- Compress large images
- Implement request deduplication

### Storage Optimization
- Clear old messages (keep last 100)
- Clear old notifications (keep last 50)
- Compress image cache
- Delete unused profile images

### UI Optimization
- Lazy load images
- Use placeholder images
- Implement infinite scroll
- Preload next page of data
- Show loading states

---

## 12. Common Implementation Gotchas

1. **Token Expiration**: Remember to handle 401s everywhere
2. **Timezone Handling**: Always use UTC on backend, convert for display
3. **Pagination**: Default limit is 20, max is 100
4. **Image URLs**: All images are S3 URLs, may need CORS handling
5. **Phone Numbers**: Format with country codes if possible
6. **Dates**: API uses ISO 8601 format (2024-01-01T00:00:00Z)
7. **JSON**: API expects snake_case in requests, returns camelCase in responses
8. **Rate Limiting**: 100 requests per 15 minutes per user
9. **Crypto Payments**: Expire after 1 hour, poll for status
10. **Wallet**: Auto-refunds go here, can be used for future bookings

---

## 13. Useful API Response Examples

### Successful Login
```json
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "expiresIn": 3600
  }
}
```

### Service List
```json
{
  "success": true,
  "data": [ /* array of services */ ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Payment Intent
```json
{
  "success": true,
  "data": {
    "id": "pi_1234567890",
    "clientSecret": "pi_1234567890_secret_abcdef",
    "amount": 10000,
    "currency": "usd",
    "status": "requires_payment_method"
  }
}
```

### Crypto Payment
```json
{
  "success": true,
  "data": {
    "id": "crypto_123",
    "paymentUrl": "https://commerce.coinbase.com/checkout/...",
    "qrCodeUrl": "data:image/png;base64,...",
    "expiresAt": "2024-01-01T01:00:00Z"
  }
}
```

---

## 14. Monitoring & Debugging

### Log Important Events

```swift
logger.info("User logged in: \(userId)")
logger.info("Booking created: \(bookingId)")
logger.info("Payment processed: \(paymentId)")
logger.error("Payment failed: \(error)")
logger.warning("Network request retry: attempt \(attempt)")
```

### Debug Settings

```swift
#if DEBUG
    let apiUrl = "http://localhost:3000/api/v1"  // Local backend
    let logLevel = .debug
    let enableNetworkLogging = true
#else
    let apiUrl = "https://huddle-backend-production.up.railway.app/api/v1"
    let logLevel = .info
    let enableNetworkLogging = false
#endif
```

---

## 15. Deployment Checklist

- [ ] Update API base URL to production
- [ ] Update Stripe key to production
- [ ] Remove debug logging
- [ ] Test all payment flows
- [ ] Test all API endpoints
- [ ] Test app on slow network (3G)
- [ ] Test on low battery mode
- [ ] Test on offline mode
- [ ] Test with various system languages
- [ ] Get TestFlight beta testers
- [ ] Prepare App Store listing
- [ ] Get privacy policy ready
- [ ] Test app review guidelines compliance

