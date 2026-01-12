# iPhone App Development Analysis - BookingBot Platform

## Executive Summary

The BookingBot platform is a comprehensive multi-sided marketplace for booking services. The web platform features a modern React frontend with Redux state management, a Node.js/Express backend with Prisma ORM, and multiple payment integrations. This analysis provides everything needed to build a feature-complete iOS native app.

---

## 1. CORE FEATURES & USER FLOWS

### 1.1 Authentication System

**Flows:**
- Email/Password Registration and Login
- Google OAuth
- Telegram Authentication (for Telegram Mini App users)
- Email Verification
- Password Reset (request → email link → reset)
- Set Initial Password (for OAuth users)
- Token Refresh (JWT-based)

**Key Details:**
- JWT-based authentication with access/refresh tokens
- Token expiration: 1 hour (access), 30 days (refresh)
- Support for multiple auth providers ("google", "telegram", "email")
- Password complexity requirements: Min 8 chars, uppercase, lowercase, number, special char
- Email verification tokens expire after use

**Key Endpoints:**
```
POST   /auth-enhanced/login              (Email login)
POST   /auth-enhanced/register           (Registration)
POST   /auth-enhanced/refresh            (Refresh tokens)
POST   /auth-enhanced/logout             (Logout)
POST   /auth/request-password-reset      (Request password reset)
POST   /auth/reset-password              (Reset password)
POST   /auth-enhanced/verify-email       (Verify email)
POST   /auth-enhanced/telegram           (Telegram auth)
GET    /auth/me                          (Get current user)
```

### 1.2 User Roles & Profiles

**User Types:**
1. **CUSTOMER**
   - Browse and search services
   - Book appointments
   - Make payments
   - Leave reviews
   - Manage favorites
   - Earn and spend loyalty points
   - Use referral codes

2. **SPECIALIST**
   - Create and manage services
   - Set availability/working hours
   - Manage bookings
   - Track earnings
   - View analytics
   - Create employees (for team management)
   - Configure loyalty rewards

3. **ADMIN**
   - Platform oversight
   - User management
   - Analytics and reporting
   - System configuration

**Profile Data:**
```typescript
- email, firstName, lastName
- phoneNumber, avatar
- userType (CUSTOMER/SPECIALIST/BUSINESS/ADMIN)
- loyaltyPoints, totalBookings
- preferences (language, currency, timezone)
- notification preferences (email, push, telegram)
- isEmailVerified, isPhoneVerified
- lastLoginAt, memberSince
- walletBalance, subscriptionStatus
```

**Key Endpoints:**
```
GET    /auth/me                          (Get profile)
PUT    /users/profile                    (Update profile)
POST   /files/upload                     (Upload avatar)
GET    /users/preferences                (Get preferences)
PUT    /users/preferences                (Update preferences)
DELETE /users                            (Delete account)
```

### 1.3 Service Browsing & Search

**Service Data Structure:**
```typescript
- id, name, description, longDescription
- duration (minutes), price, currency
- category, images, tags
- specialistId (business owner)
- isActive, isDeleted
- requirements, deliverables
- serviceLocation, locationNotes
- isGroupSession, maxParticipants, minParticipants
- loyaltyPointsEnabled, loyaltyPointsPrice
- discountEnabled, discountType, discountValue
- discountValidFrom, discountValidUntil
```

**Search & Discovery:**
- Filter by category, location, price range
- Search by specialist name or service name
- Sort by rating, price, distance
- View specialist profile and reviews
- Add services to favorites
- View service details with high-res images

**Key Endpoints:**
```
GET    /services                         (List services with filters)
GET    /services/:id                     (Get service details)
POST   /services/search                  (Advanced search)
GET    /services/categories              (List categories)
GET    /favorites/services               (Get favorite services)
POST   /favorites/services               (Add favorite service)
DELETE /favorites/services/:serviceId    (Remove favorite)
```

### 1.4 Booking Flow

**Booking Status Flow:**
```
PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
         ↓
      CANCELLED/NO_SHOW
```

**Booking Creation Process:**
1. Select service and specialist
2. Choose date and time slot
3. Set notes/requirements
4. Apply loyalty points or rewards (optional)
5. Select payment method
6. Complete payment (deposit)
7. Booking confirmed

**Booking Management:**
- View all bookings (customer & specialist perspectives)
- Reschedule appointments
- Cancel with automatic refund rules
- Add completion notes
- Confirm/reject bookings (specialist)

**Group Sessions:**
- Multiple bookings for the same time slot
- Minimum/maximum participant limits
- Track participant count
- Group session ID for correlation

**Key Endpoints:**
```
POST   /bookings                         (Create booking)
POST   /bookings/with-payment            (Create with immediate payment)
GET    /bookings                         (Get user's bookings)
GET    /bookings/:bookingId              (Get booking details)
PUT    /bookings/:bookingId              (Update booking)
PUT    /bookings/:bookingId/confirm      (Confirm booking)
POST   /bookings/:bookingId/complete     (Complete & pay remainder)
PUT    /bookings/:bookingId/cancel       (Cancel booking)
PUT    /bookings/:bookingId/reject       (Reject booking)
GET    /bookings/group-session/:groupSessionId (Get group info)
```

### 1.5 Payment Integration

**Payment Methods:**
1. **Stripe Cards** (Credit/Debit)
   - Support for Visa, Mastercard, Amex
   - Save cards for future use
   - 3D Secure when required

2. **Crypto Payments** (Coinbase Commerce)
   - Bitcoin, Ethereum, USDC, etc.
   - QR codes for easy scanning
   - Real-time exchange rates
   - Webhook confirmations

3. **PayPal**
   - Direct PayPal integration
   - Buyer protection
   - Recurring payments support

4. **Wallet/Balance**
   - Internal wallet system
   - Automatic refund credits
   - Reuse wallet balance on future bookings

5. **Wayforpay** (Alternative gateway)

**Payment Flow:**
1. Customer initiates booking
2. System calculates total (service price + platform fee)
3. Deposit amount charged first (default 50% or configurable)
4. Remainder charged upon completion
5. Platform fee deducted from specialist earnings

**Platform Economics:**
- Default platform fee: 5% of booking amount
- Specialist receives: Total amount - Platform fee
- Deposit tracking separate from full payment
- Automatic refunds on cancellation

**Key Endpoints:**
```
POST   /payments/intent                  (Create payment intent)
POST   /payments/process                 (Process payment)
POST   /payments/confirm                 (Confirm payment)
POST   /payments/refund                  (Request refund)
GET    /payments/methods                 (Get saved methods)
POST   /crypto-payments/bookings/:bookingId/deposit    (Crypto deposit)
GET    /crypto-payments/bookings/:bookingId/status    (Check status)
POST   /payments/wallet/apply/:bookingId               (Use wallet)
GET    /payments/wallet                  (Get wallet balance)
GET    /payments/wallet/transactions     (Wallet history)
```

### 1.6 Reviews & Ratings

**Review System:**
- 1-5 star ratings
- Text comments (optional)
- Tags/categories ("professional", "punctual", "friendly", etc.)
- Can be public or private
- Verified badge for completed bookings only
- Specialist can respond to reviews

**Review Creation:**
- Only after completed booking
- One review per booking
- Earn loyalty points for reviews
- Bonus points for comments and photos

**Key Endpoints:**
```
GET    /reviews                          (List reviews)
POST   /reviews                          (Create review)
PUT    /reviews/:reviewId                (Update review)
DELETE /reviews/:reviewId                (Delete review)
POST   /reviews/:reviewId/respond        (Specialist response)
```

### 1.7 Notifications

**Notification Types:**
- Booking created/confirmed/completed
- Payment status changes
- Messages received
- Specialist availability changed
- Review posted
- Loyalty points earned
- Referral activated

**Delivery Channels:**
- In-app push
- Email
- SMS (if enabled)
- Telegram (if connected)

**Key Endpoints:**
```
GET    /notifications                    (List notifications)
PUT    /notifications/:notificationId/read (Mark as read)
PUT    /notifications/mark-all-read      (Mark all as read)
GET    /notifications/preferences        (Get preferences)
PUT    /notifications/preferences        (Update preferences)
```

### 1.8 Messaging/Chat System

**Conversation Features:**
- 1:1 messaging between customer and specialist
- Linked to bookings (optional)
- Typing indicators
- Message status (sent, delivered, read)
- File attachments
- Media sharing

**Use Cases:**
- Pre-booking inquiries
- Booking coordination
- Post-completion follow-up
- General communication

**Key Endpoints:**
```
GET    /messages/conversations           (List conversations)
GET    /messages/conversations/:id       (Get conversation)
POST   /messages/conversations           (Create conversation)
POST   /messages/conversations/:id/messages (Send message)
GET    /messages/conversations/:id/messages (Get messages)
```

### 1.9 Referral & Loyalty Programs

**Referral System:**
- Generate referral codes (unique per referrer)
- Share codes via email, SMS, social, direct link
- Track referrals (pending, activated, rewarded)
- Rewards for both referrer and referee
- Multiple referral types:
  - Customer to Customer
  - Specialist to Customer
  - Customer to Specialist

**Loyalty Points:**
- Earned from:
  - Bookings (10 points per $1 spent by default)
  - Reviews (5-20 points depending on type)
  - Referrals (bonus points)
  - Promotions/campaigns
  
- Redeemed for:
  - Discounts on services
  - Free services
  - Specialist rewards
  - Wallet balance
  
- Loyalty Tiers:
  - Bronze (0-499 points)
  - Silver (500-999)
  - Gold (1000-1999)
  - Platinum (2000+)

**Reward System:**
- Specialists create custom rewards
- Points-based redemption
- Limited availability options
- Expiration dates
- Minimum tier requirements

**Key Endpoints:**
```
GET    /loyalty/account                  (Get loyalty profile)
GET    /loyalty/transactions             (Loyalty history)
POST   /loyalty/redeem                   (Redeem points)
GET    /loyalty/rewards                  (Available rewards)
POST   /referral/create                  (Generate referral)
GET    /referral/config                  (Get referral config)
POST   /referral/process                 (Process referral)
GET    /referral/track/:code             (Track referral)
```

### 1.10 Schedule & Availability Management

**Specialist Availability:**
- Weekly working hours (per day)
- Timezone support
- Blocked/unavailable slots
- Vacation/break scheduling
- Recurring availability blocks
- Auto-reschedule on availability changes

**Booking Advance Limits:**
- Min advance booking: typically 1 hour
- Max advance booking: typically 30-90 days
- Custom per service

**Employee Scheduling** (for team specialists):
- Assign services to specific employees
- Per-employee availability
- Shared or exclusive services
- Custom pricing per employee

**Key Endpoints:**
```
GET    /specialists/:id/availability     (Get available slots)
GET    /specialists/:id/slots            (Get time slots)
POST   /specialists/:id/availability     (Set availability)
PUT    /specialists/:id/availability/:id (Update block)
DELETE /specialists/:id/availability/:id (Delete block)
GET    /employees                        (List employees)
POST   /employees                        (Create employee)
PUT    /employees/:id                    (Update employee)
POST   /employees/:id/availability       (Set employee availability)
```

---

## 2. API STRUCTURE & ARCHITECTURE

### 2.1 Authentication Mechanism

**JWT Implementation:**
- Two-token system: access token + refresh token
- Access token: Short-lived (1 hour), includes user ID and role
- Refresh token: Long-lived (30 days), stored in database
- Tokens stored in localStorage (web) → should use Keychain (iOS)
- Bearer token in Authorization header

**Request Structure:**
```
Headers:
  Authorization: Bearer <accessToken>
  Content-Type: application/json
  X-Client-Version: 1.0.0
  X-Platform: ios
```

**Token Refresh Flow:**
```
1. Access token expires (401 response)
2. Client sends refresh token to /auth-enhanced/refresh
3. Server validates refresh token
4. Server issues new access token
5. Client retries original request
6. If refresh token invalid, user logged out
```

### 2.2 API Base URL & Endpoint Structure

**Base URL:**
- Production: `https://huddle-backend-production.up.railway.app/api/v1`
- Should be configurable per environment (staging, production)

**API Versioning:**
- Current: `/api/v1`
- All endpoints prefixed with `/api/v1`

**Response Format (Standardized):**
```json
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Operation successful",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

**Error Format:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  },
  "requestId": "req_123456"
}
```

**HTTP Status Codes:**
- 200: Success
- 201: Created
- 204: No Content
- 400: Bad Request (validation)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 422: Unprocessable Entity
- 429: Rate Limited
- 500: Server Error

### 2.3 Complete API Route Map

#### Authentication Routes
```
POST   /auth-enhanced/login
POST   /auth-enhanced/register
POST   /auth-enhanced/refresh
POST   /auth-enhanced/logout
POST   /auth-enhanced/verify-email
POST   /auth-enhanced/telegram
POST   /auth/request-password-reset
POST   /auth/reset-password
POST   /auth/change-password
POST   /auth/set-initial-password
GET    /auth/me
```

#### User Management
```
GET    /users/profile            → /auth/me (preferred)
PUT    /users/profile
POST   /files/upload
GET    /users/preferences
PUT    /users/preferences
DELETE /users
```

#### Services
```
GET    /services
GET    /services/:id
POST   /services
PUT    /services/:id
DELETE /services/:id
POST   /services/search
GET    /services/categories
```

#### Specialists
```
GET    /specialists
GET    /specialists/:id
POST   /specialists
PUT    /specialists/:id
GET    /specialists/:id/availability
GET    /specialists/:id/slots
POST   /specialists/:id/availability
```

#### Bookings
```
POST   /bookings
POST   /bookings/with-payment
GET    /bookings
GET    /bookings/:bookingId
PUT    /bookings/:bookingId
PUT    /bookings/:bookingId/confirm
POST   /bookings/:bookingId/complete
PUT    /bookings/:bookingId/cancel
PUT    /bookings/:bookingId/reject
GET    /bookings/group-session/:groupSessionId
GET    /bookings/stats
```

#### Payments & Crypto
```
POST   /payments/intent
POST   /payments/process
POST   /payments/confirm
POST   /payments/refund
GET    /payments/methods
POST   /payments/bookings/:bookingId/deposit
GET    /payments/bookings/:bookingId/status
GET    /payments/wallet
GET    /payments/wallet/transactions
POST   /payments/wallet/apply/:bookingId
GET    /crypto-payments/bookings/:bookingId/status
POST   /crypto-payments/bookings/:bookingId/cancel
GET    /payments/plans
GET    /payments/specialists/:specialistId/plan
POST   /payments/specialists/:specialistId/change-plan
```

#### Reviews
```
GET    /reviews
POST   /reviews
PUT    /reviews/:reviewId
DELETE /reviews/:reviewId
POST   /reviews/:reviewId/respond
```

#### Messaging
```
GET    /messages/conversations
GET    /messages/conversations/:id
POST   /messages/conversations
POST   /messages/conversations/:id/messages
GET    /messages/conversations/:id/messages
```

#### Notifications
```
GET    /notifications
PUT    /notifications/:id/read
PUT    /notifications/mark-all-read
GET    /notifications/preferences
PUT    /notifications/preferences
```

#### Favorites
```
GET    /favorites/specialists
POST   /favorites/specialists/:specialistId
DELETE /favorites/specialists/:specialistId
GET    /favorites/services
POST   /favorites/services/:serviceId
DELETE /favorites/services/:serviceId
```

#### Loyalty
```
POST   /loyalty/init
GET    /loyalty/account
GET    /loyalty/transactions
POST   /loyalty/redeem
GET    /loyalty/rewards
GET    /loyalty/config
```

#### Referrals
```
GET    /referral/config
POST   /referral/create
POST   /referral/process
GET    /referral/track/:code
GET    /referral/stats
```

#### Analytics
```
GET    /analytics/specialist
GET    /analytics/platform
GET    /analytics/overview
GET    /analytics/bookings
GET    /analytics/revenue
GET    /analytics/customers
GET    /analytics/performance
GET    /specialists/:id/analytics
GET    /specialists/:id/revenue
```

#### Employees
```
GET    /employees
POST   /employees
PUT    /employees/:id
DELETE /employees/:id
POST   /employees/:id/availability
GET    /employees/:id/availability
```

#### Admin
```
GET    /admin/dashboard
GET    /admin/users
PUT    /admin/users/:id
GET    /admin/bookings
GET    /admin/analytics
```

### 2.4 Real-Time Features (WebSocket)

**Connection Details:**
- WebSocket URL: `wss://huddle-backend-production.up.railway.app`
- Protocol: Socket.IO
- Authentication: Bearer token in connection handshake

**Events:**
```
Client → Server:
  - join_room: Join a conversation/notification room
  - leave_room: Leave a room
  - message: Send a message
  - typing: User typing indicator
  - read: Mark message as read

Server → Client:
  - connect: Connected to server
  - disconnect: Disconnected
  - booking:new: New booking created
  - booking:status_changed: Booking status updated
  - booking:updated: Booking details changed
  - notification:new: New notification
  - payment:status_changed: Payment status updated
  - specialist:availability_changed: Availability modified
  - message: New message in conversation
  - typing: User typing in conversation
```

### 2.5 Rate Limiting & Throttling

**Rate Limits:**
- Default: 100 requests per 15 minutes per user
- Authentication endpoints: Stricter limits
- Search/list endpoints: Standard limits
- File upload: Per-file size limits (5MB)

**Retry Strategy:**
- Exponential backoff for failures
- Don't retry on 401, 403, 400 errors
- Retry on 5xx and network errors
- Max 2-3 retries with delays

### 2.6 Pagination

**Standard Pagination:**
```json
{
  "data": [ /* items */ ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Query Parameters:**
- `page`: Page number (1-indexed)
- `limit`: Items per page (default 20, max 100)
- `sort`: Sort field (e.g., "-createdAt" for descending)

---

## 3. KEY DATA MODELS & TYPES

### 3.1 Core Models

**User**
```typescript
{
  id: string (cuid)
  email: string (unique)
  password: string (hashed)
  firstName: string
  lastName: string
  avatar: string | null (image URL)
  userType: "CUSTOMER" | "SPECIALIST" | "BUSINESS" | "ADMIN"
  
  // Contact
  phoneNumber: string | null
  telegramId: string | null (unique)
  
  // Verification
  isEmailVerified: boolean
  isPhoneVerified: boolean
  isActive: boolean
  
  // Preferences
  language: string (default: "en")
  currency: string (default: "USD")
  timezone: string (default: "UTC")
  
  // Notifications
  emailNotifications: boolean
  pushNotifications: boolean
  telegramNotifications: boolean
  
  // Loyalty & Finance
  loyaltyPoints: int (default: 0)
  walletBalance: float (default: 0.0)
  walletCurrency: string (default: "USD")
  
  // Specialist Subscription
  subscriptionStatus: "PAY_PER_USE" | "MONTHLY_SUBSCRIPTION"
  subscriptionValidUntil: DateTime | null
  
  // Timestamps
  lastLoginAt: DateTime | null
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  specialist: Specialist | null
  bookings_as_customer: Booking[]
  bookings_as_specialist: Booking[]
  reviews: Review[]
  payments: Payment[]
  notifications: Notification[]
  loyaltyTransactions: LoyaltyTransaction[]
  messages_sent: Message[]
  messages_received: Message[]
}
```

**Specialist**
```typescript
{
  id: string (cuid)
  userId: string (foreign key to User)
  
  // Business Info
  businessName: string | null
  bio: string | null
  bioUk: string | null (Ukrainian)
  bioRu: string | null (Russian)
  specialties: string (JSON array)
  experience: int (years)
  languages: string | null (JSON array)
  
  // Location
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  latitude: float | null
  longitude: float | null
  timezone: string (default: "UTC")
  
  // Detailed Contact (after booking)
  preciseAddress: string | null
  businessPhone: string | null
  whatsappNumber: string | null
  locationNotes: string | null
  parkingInfo: string | null
  accessInstructions: string | null
  
  // Verification
  isVerified: boolean (default: false)
  verifiedDate: DateTime | null
  
  // Metrics
  rating: float (0-5)
  reviewCount: int
  completedBookings: int
  responseTime: int (minutes)
  
  // Settings
  autoBooking: boolean (auto-approve bookings)
  workingHours: string (JSON)
  paymentMethods: string | null (JSON)
  
  // Portfolio
  portfolioImages: string | null (JSON array)
  certifications: string | null (JSON array)
  
  // Timestamps
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  user: User
  services: Service[]
  reviews: Review[]
  availabilityBlocks: AvailabilityBlock[]
  employees: Employee[]
}
```

**Service**
```typescript
{
  id: string (cuid)
  specialistId: string (foreign key)
  
  // Basic Info
  name: string
  description: string
  longDescription: string | null
  category: string
  images: string | null (JSON array of URLs)
  tags: string | null (JSON array)
  
  // Pricing
  basePrice: float
  currency: string (default: "USD")
  
  // Loyalty Points Pricing
  loyaltyPointsEnabled: boolean
  loyaltyPointsPrice: int | null
  loyaltyPointsOnly: boolean
  
  // Discounts
  discountEnabled: boolean
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | null
  discountValue: float | null
  discountValidFrom: DateTime | null
  discountValidUntil: DateTime | null
  discountDescription: string | null
  
  // Duration
  duration: int (minutes)
  
  // Location
  serviceLocation: string | null
  locationNotes: string | null
  
  // Details
  requirements: string (JSON array)
  deliverables: string (JSON array)
  
  // Status
  isActive: boolean
  isDeleted: boolean
  deletedAt: DateTime | null
  requiresApproval: boolean
  
  // Booking Limits
  maxAdvanceBooking: int (days)
  minAdvanceBooking: int (hours)
  
  // Group Sessions
  isGroupSession: boolean
  maxParticipants: int | null
  minParticipants: int
  
  // Timestamps
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  specialist: Specialist
  bookings: Booking[]
  favorites: FavoriteService[]
}
```

**Booking**
```typescript
{
  id: string (cuid)
  customerId: string
  specialistId: string
  serviceId: string
  employeeId: string | null (for team bookings)
  
  // Status & Timing
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "REFUNDED"
  scheduledAt: DateTime
  duration: int (minutes)
  
  // Pricing
  totalAmount: float
  depositAmount: float
  remainingAmount: float
  platformFeePercentage: float (default: 5%)
  platformFeeAmount: float
  specialistEarnings: float (after fee)
  loyaltyPointsUsed: int
  paidWithLoyaltyPoints: boolean
  
  // Deposit Tracking
  depositStatus: "PENDING" | "PAID" | "REFUNDED" | "FORFEITED"
  depositPaidAt: DateTime | null
  walletAmountUsed: float
  depositCurrency: string
  
  // Group Sessions
  isGroupBooking: boolean
  groupSessionId: string | null
  participantCount: int
  
  // Notes & Details
  customerNotes: string | null
  specialistNotes: string | null
  preparationNotes: string | null
  completionNotes: string | null
  deliverables: string (JSON array)
  
  // Time Tracking
  confirmedAt: DateTime | null
  startedAt: DateTime | null
  completedAt: DateTime | null
  cancelledAt: DateTime | null
  
  // Cancellation
  cancellationReason: string | null
  cancelledBy: string | null (customerId or specialistId)
  refundAmount: float | null
  
  // Timestamps
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  customer: User
  specialist: User
  service: Service
  employee: Employee | null
  payments: Payment[]
  review: Review | null
  notifications: Notification[]
  walletTransactions: WalletTransaction[]
  cryptoPayments: CryptoPayment[]
}
```

**Payment**
```typescript
{
  id: string (cuid)
  userId: string
  bookingId: string | null
  
  // Payment Details
  status: "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "REFUNDED"
  type: "DEPOSIT" | "FULL_PAYMENT" | "REFUND" | "LOYALTY_REDEMPTION" | "SUBSCRIPTION"
  amount: float
  currency: string
  
  // External Provider
  stripePaymentIntentId: string | null
  stripeChargeId: string | null
  
  // Method
  paymentMethodType: "card" | "crypto" | "wallet" | "paypal" | "telegram_payment" | null
  
  // Metadata
  metadata: string | null (JSON)
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  user: User
  booking: Booking | null
}
```

**PaymentMethod**
```typescript
{
  id: string (cuid)
  userId: string
  
  // Type & Details
  type: "CARD" | "APPLE_PAY" | "GOOGLE_PAY" | "BANK_TRANSFER"
  
  // Card Info
  cardLast4: string | null
  cardBrand: "visa" | "mastercard" | "amex" | null
  cardExpMonth: int | null
  cardExpYear: int | null
  
  // Stripe Info
  stripeCustomerId: string | null
  stripePaymentMethodId: string | null
  
  // Settings
  nickname: string | null
  isDefault: boolean
  isActive: boolean
  
  // Timestamps
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  user: User
}
```

**Review**
```typescript
{
  id: string (cuid)
  bookingId: string (unique - one review per booking)
  customerId: string
  specialistId: string
  
  // Content
  rating: int (1-5)
  comment: string | null
  tags: string (JSON array)
  
  // Metadata
  isPublic: boolean (default: true)
  isVerified: boolean (only true for completed bookings)
  
  // Timestamps
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  booking: Booking
  customer: User
  specialist: Specialist
}
```

**CryptoPayment**
```typescript
{
  id: string (cuid)
  userId: string
  bookingId: string | null
  
  // Coinbase Commerce
  coinbaseChargeId: string (unique)
  coinbaseChargeCode: string | null
  
  // Payment Details
  status: "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "CANCELLED" | "REFUNDED"
  type: "DEPOSIT" | "SUBSCRIPTION"
  amount: float (USD)
  currency: string (default: "USD")
  
  // Crypto Info
  cryptoAmount: float | null
  cryptoCurrency: string | null (BTC, ETH, USDC, etc.)
  exchangeRate: float | null
  
  // Payment URLs
  paymentUrl: string
  qrCodeUrl: string | null
  
  // Status
  confirmedAt: DateTime | null
  expiresAt: DateTime | null
  
  // Metadata
  webhookData: string | null (JSON)
  metadata: string | null (JSON)
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  user: User
  booking: Booking | null
}
```

**WalletTransaction**
```typescript
{
  id: string (cuid)
  userId: string
  bookingId: string | null
  
  // Transaction Details
  type: "CREDIT" | "DEBIT" | "REFUND" | "FORFEITURE_SPLIT"
  amount: float
  currency: string
  balanceBefore: float
  balanceAfter: float
  
  // Context
  reason: "DEPOSIT_REFUND" | "CANCELLATION_CREDIT" | "BOOKING_PAYMENT" | etc.
  description: string | null
  referenceId: string | null
  referenceType: "BOOKING" | "CRYPTO_PAYMENT" | "CANCELLATION" | null
  
  // Status
  status: "PENDING" | "COMPLETED" | "FAILED" (default: "COMPLETED")
  processedAt: DateTime | null
  
  // Timestamps
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  user: User
  booking: Booking | null
}
```

**LoyaltyTransaction**
```typescript
{
  id: string (cuid)
  userId: string
  
  // Transaction Details
  type: "EARNED" | "REDEEMED" | "EXPIRED" | "BONUS"
  points: int
  reason: string
  description: string | null
  
  // Reference & Expiry
  referenceId: string | null (booking, referral, etc.)
  expiresAt: DateTime | null
  
  // Timestamps
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  user: User
}
```

**Conversation**
```typescript
{
  id: string (cuid)
  customerId: string
  specialistId: string
  bookingId: string | null
  
  // Message Tracking
  lastMessageAt: DateTime | null
  lastMessagePreview: string | null
  
  // Status
  isActive: boolean
  
  // Timestamps
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  customer: User
  specialist: User
  booking: Booking | null
  messages: Message[]
}
```

**Message**
```typescript
{
  id: string (cuid)
  conversationId: string
  senderId: string
  recipientId: string
  
  // Content
  content: string
  messageType: "TEXT" | "IMAGE" | "FILE" | "SYSTEM"
  
  // Status
  isRead: boolean
  readAt: DateTime | null
  
  // Attachments
  attachments: string | null (JSON array)
  
  // Timestamps
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  conversation: Conversation
  sender: User
  recipient: User
}
```

**LoyaltyReferral**
```typescript
{
  id: string (cuid)
  referralCode: string (unique)
  referrerId: string
  
  // Details
  referralType: "CUSTOMER_TO_CUSTOMER" | "SPECIALIST_TO_CUSTOMER" | "CUSTOMER_TO_SPECIALIST"
  targetUserType: "CUSTOMER" | "SPECIALIST"
  
  // Tracking
  referredUserId: string | null
  firstBookingId: string | null
  
  // Rewards
  referrerRewardType: string
  referrerRewardPoints: int
  referrerRewardValue: float | null
  referredRewardType: string
  referredRewardValue: float | null
  
  // Status
  status: "PENDING" | "ACTIVATED" | "REWARDED" | "EXPIRED"
  
  // Metadata
  inviteChannel: "EMAIL" | "SMS" | "SOCIAL" | "DIRECT" | "LINK" | null
  customMessage: string | null
  
  // Expiry
  expiresAt: DateTime
  
  // Timestamps
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  referrer: User @relation("ReferrerRelation")
  referred: User @relation("ReferredRelation")
}
```

**LoyaltyReward**
```typescript
{
  id: string (cuid)
  specialistId: string
  
  // Details
  title: string
  description: string
  type: "DISCOUNT_VOUCHER" | "SERVICE_CREDIT" | "FREE_SERVICE" | "PERCENTAGE_OFF"
  
  // Value
  pointsRequired: int
  discountPercent: float | null
  discountAmount: float | null
  serviceIds: string | null (JSON array)
  
  // Availability
  isActive: boolean
  validFrom: DateTime
  validUntil: DateTime | null
  
  // Usage Limits
  maxRedemptions: int | null (null = unlimited)
  currentRedemptions: int
  usageLimit: "UNLIMITED" | "ONCE_PER_USER" | "LIMITED_TOTAL"
  
  // Tier Requirements
  minimumTier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | null
  
  // Timestamps
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  specialist: User
  redemptions: RewardRedemption[]
}
```

**AvailabilityBlock**
```typescript
{
  id: string (cuid)
  specialistId: string
  
  // Time Block
  startDateTime: DateTime
  endDateTime: DateTime
  
  // Type
  isAvailable: boolean (true = available, false = blocked)
  reason: string | null
  
  // Recurring
  isRecurring: boolean
  recurringUntil: DateTime | null
  recurringDays: string | null (JSON array: ["monday", "tuesday"])
  
  // Timestamps
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  specialist: Specialist
}
```

**Employee**
```typescript
{
  id: string (cuid)
  businessId: string (reference to Specialist)
  
  // Details
  firstName: string
  lastName: string
  email: string | null
  phoneNumber: string | null
  avatar: string | null
  
  // Professional Info
  title: string | null
  bio: string | null
  specialties: string | null (JSON)
  experience: int
  
  // Availability
  workingHours: string (JSON)
  isActive: boolean
  
  // Timestamps
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  business: Specialist
  services: EmployeeService[]
  bookings: Booking[]
  availabilityBlocks: EmployeeAvailability[]
}
```

---

## 4. SPECIAL FEATURES & ADVANCED FUNCTIONALITIES

### 4.1 Group Sessions

**Implementation:**
- `isGroupSession: boolean` on Service model
- `isGroupBooking: boolean` on Booking model
- `groupSessionId: string` for grouping bookings
- `participantCount: int` for tracking participants
- `maxParticipants` and `minParticipants` configuration

**Features:**
- Multiple customers can book the same time slot
- Automatic grouping by session ID
- Capacity checking before confirmation
- Minimum participant thresholds
- Group session info retrieval

**Booking Group Sessions:**
1. Service marked as group session
2. Customer books → system generates/finds groupSessionId
3. Check if capacity allows new participant
4. Add booking to group
5. Track total participants
6. Notify all participants when session fills

**Key Endpoints:**
```
GET /bookings/group-session/:groupSessionId    (Get group info)
```

### 4.2 Crypto Payments (Coinbase Commerce)

**Supported Cryptocurrencies:**
- Bitcoin (BTC)
- Ethereum (ETH)
- USDC (USDC)
- Dogecoin (DOGE)
- Litecoin (LTC)

**Features:**
- QR code generation for easy scanning
- Real-time exchange rates
- Webhook confirmations
- Payment expiration (typically 1 hour)
- Automatic order status updates
- Support for both deposits and full payments

**Payment Flow:**
1. Create payment intent via `/crypto-payments/bookings/:bookingId/deposit`
2. Receive `paymentUrl` and `qrCodeUrl`
3. Customer scans QR or uses payment URL
4. Customer sends crypto to address
5. Webhook confirms payment
6. System credits wallet/completes booking

**Key Endpoints:**
```
POST /crypto-payments/bookings/:bookingId/deposit
GET  /crypto-payments/bookings/:bookingId/status
POST /crypto-payments/bookings/:bookingId/cancel
```

**Integration Points:**
- Coinbase Onramp for fiat→crypto conversion
- Webhook signature verification required
- Automatic currency conversion

### 4.3 Wallet System

**Wallet Features:**
- Internal balance tracking per user
- Multiple transaction types (credit, debit, refund)
- Auto-refund credits from cancelled bookings
- Reusable for future bookings
- Multi-currency support

**Transaction Types:**
- CREDIT: Refunds, cancellations, rewards
- DEBIT: Service bookings
- REFUND: Explicit refunds
- FORFEITURE_SPLIT: Partial refunds

**Use Cases:**
1. Booking cancellation → auto-credit to wallet
2. Payment with wallet first → deduct from balance
3. Leftover funds → stored for future use
4. Referral rewards → credited to wallet
5. Loyalty redemptions → wallet credit

**Key Endpoints:**
```
GET  /payments/wallet                (Get balance)
GET  /payments/wallet/transactions   (Transaction history)
POST /payments/wallet/apply/:bookingId (Use wallet for booking)
```

### 4.4 Employee Management (Team Specialists)

**Features:**
- Specialists can add team members
- Assign services to specific employees
- Per-employee pricing override
- Per-employee availability
- Track employee bookings separately

**Data Models:**
- `Employee` table (team members)
- `EmployeeService` (service assignments)
- `EmployeeAvailability` (schedules)
- `EmployeeBooking` (booking assignments)

**Booking with Employees:**
- Book specific employee or business
- System assigns available employee
- Track who provided service
- Separate analytics per employee

**Key Endpoints:**
```
GET    /employees                    (List team)
POST   /employees                    (Add employee)
PUT    /employees/:id                (Update)
DELETE /employees/:id                (Remove)
POST   /employees/:id/availability   (Set schedule)
GET    /employees/:id/availability
```

### 4.5 Schedule Management

**Specialist Availability:**
- Weekly working hours (per day)
- Timezone-aware scheduling
- Blocked slots (vacation, breaks)
- Recurring unavailability
- Booking advance limits (min/max days)

**Features:**
- Automatic time slot calculation
- Conflict detection
- Timezone conversion for customers
- Break time support
- Service-specific availability

**Availability Block Types:**
- Available: Open for bookings
- Blocked: Vacation/unavailable
- Break: Lunch break, etc.

**Recurring Blocks:**
- Set specific days of week
- End date for recurring blocks
- Automatic expansion to future dates

**Key Endpoints:**
```
GET    /specialists/:id/availability      (Get slots)
GET    /specialists/:id/slots
POST   /specialists/:id/availability      (Set availability)
PUT    /specialists/:id/availability/:id  (Update block)
DELETE /specialists/:id/availability/:id  (Delete block)
```

### 4.6 Subscription Plans (for Specialists)

**Plan Types:**
1. **PAY_PER_USE**
   - No upfront fee
   - Transaction fee per booking (e.g., 20₴)
   - Flexible usage

2. **MONTHLY_SUBSCRIPTION**
   - Fixed monthly rate ($10/month typical)
   - Unlimited bookings
   - Automatic renewal

**Billing Management:**
- Current billing cycle tracking
- Plan change management (effective next month)
- Payment failure tracking
- Usage analytics
- Auto-downgrade options

**Cryptocurrency Subscriptions:**
- Coinbase Commerce integration
- Recurring payment support
- Webhook confirmations

**Key Endpoints:**
```
GET    /payments/plans
GET    /payments/specialists/:specialistId/plan
POST   /payments/specialists/:specialistId/change-plan
GET    /payments/specialists/:specialistId/analytics
```

### 4.7 Premium Listings & Advertisements

**Premium Features:**
- Featured listings
- Enhanced visibility
- Badge system
- Sponsored placements

**Advertisement System:**
- Create/manage ads
- Target audience
- Budget management
- Performance tracking

**Key Endpoints:**
```
GET    /advertisements
POST   /advertisements
GET    /premium-listings
POST   /premium-listings
PUT    /premium-listings/:id
```

---

## 5. CURRENT TECH STACK

### 5.1 Frontend Technology

**Framework & Language:**
- React 18.2.0 (UI library)
- TypeScript 5.2.2 (type safety)
- Vite 5.3.4 (bundler)

**State Management:**
- Redux Toolkit 2.0.1 (centralized state)
- Redux Persist 6.0.0 (persist state to localStorage)
- React Redux 9.0.4 (bindings)

**API Communication:**
- Axios 1.6.2 (HTTP client)
- Custom error handling and retry logic
- Request/response interceptors
- Socket.IO client 4.7.4 (real-time)

**UI Components & Styling:**
- Tailwind CSS 3.3.6 (utility-first CSS)
- Lucide React 0.294.0 (icons)
- Heroicons React 2.2.0 (icons)
- Framer Motion 10.16.16 (animations)
- React Toastify 9.1.3 (notifications)
- React Datepicker 4.24.0 (date selection)

**Forms & Validation:**
- React Hook Form 7.48.2 (forms)
- Zod 3.22.4 (schema validation)
- Express Validator (backend)

**Authentication:**
- JWT tokens (custom implementation)
- OAuth (Google)
- Telegram authentication

**Payment Integration:**
- Stripe React 2.4.0 (card payments)
- Custom Coinbase Commerce (crypto)
- PayPal SDK
- Wayforpay gateway

**Internationalization:**
- i18next 23.7.16 (i18n framework)
- i18next Browser Language Detector 7.2.0 (language detection)
- i18next HTTP Backend 2.4.2 (translations)
- React i18next 14.0.0 (React bindings)

**Other Features:**
- Vite PWA Plugin 0.17.4 (Progressive Web App)
- React Router DOM 6.20.1 (routing)
- Query 3.39.3 (server state management)
- Google Maps integration
- Zustand 4.4.7 (lightweight state)

### 5.2 Backend Technology

**Framework & Language:**
- Node.js (JavaScript runtime)
- Express 4.18.2 (web framework)
- TypeScript 5.9.2 (type safety)

**Database & ORM:**
- PostgreSQL (primary database)
- Prisma 5.22.0 (ORM)
- Database migrations supported
- Prisma Studio for DB exploration

**Authentication & Authorization:**
- JWT (jsonwebtoken 9.0.2)
- Bcrypt (bcryptjs 2.4.3) for password hashing
- Iron Session (session management)
- Google OAuth
- Telegram authentication

**API & Middleware:**
- Express Validator 7.0.1 (validation)
- CORS 2.8.5 (cross-origin)
- Helmet 7.1.0 (security headers)
- Compression 1.7.4 (gzip compression)
- Express Rate Limit 7.1.5 (rate limiting)
- Custom middleware for auth, logging, error handling

**Payment Integration:**
- Stripe Node SDK 14.15.0
- PayPal Server SDK 1.1.0
- Coinbase Commerce Node 1.0.4
- Coinbase OnChain Kit 1.0.2
- Custom payment controllers

**Real-Time & Messaging:**
- Socket.IO 4.7.4 (WebSocket library)
- Telegraf 4.16.3 (Telegram bot framework)
- Nodemailer 6.9.8 (email sending)
- Resend 6.0.1 (email service)

**File Storage:**
- AWS S3 SDK 3.882.0 (@aws-sdk/client-s3)
- Sharp 0.33.2 (image processing)
- Multer 1.4.5 (file upload middleware)

**Background Jobs & Scheduling:**
- Bull 4.12.2 (job queue)
- Node Cron 3.0.3 (scheduled tasks)
- Redis (job store with ioredis)

**Data Processing:**
- Joi 17.12.0 (schema validation)
- UUID 9.0.1 (unique IDs)
- CryptoJS 4.2.0 (cryptography)
- QRCode 1.5.4 (QR code generation)
- Date-fns 3.3.1 (date utilities)

**Development Tools:**
- tsx 4.7.0 (TypeScript executor)
- ts-jest 29.1.1 (Jest TypeScript)
- Jest 29.7.0 (testing)
- Husky 8.0.3 (git hooks)
- ESLint 8.56.0 (linting)
- Prettier 3.2.4 (formatting)

**Monitoring & Logging:**
- Winston 3.11.0 (logging)
- Winston Daily Rotate File 4.7.1 (log rotation)
- Custom request logging

**Deployment:**
- Railway compatible
- Docker support
- Environment variable configuration
- Health check endpoints

### 5.3 Development Practices

**Code Organization:**
```
backend/src/
├── controllers/     (Request handlers)
├── services/        (Business logic)
├── routes/          (API endpoints)
├── middleware/      (Auth, validation, error)
├── models/          (Database models)
├── types/           (TypeScript types)
├── utils/           (Helper functions)
├── config/          (Configuration)
├── workers/         (Background jobs)
├── bot/             (Telegram bot)
└── scripts/         (Utilities)

frontend/src/
├── components/      (Reusable UI)
├── pages/           (Page components)
├── services/        (API calls)
├── store/           (Redux slices)
├── hooks/           (Custom hooks)
├── types/           (TypeScript types)
├── utils/           (Helpers)
├── config/          (Configuration)
├── contexts/        (Context API)
└── styles/          (CSS/Tailwind)
```

**Database:**
- Prisma ORM with migrations
- Automatic schema generation
- Type-safe database access
- Seed script for initial data

**Testing:**
- Jest framework
- Unit and E2E tests
- Supertest for API testing
- Test environment configuration

**CI/CD:**
- Git hooks with Husky
- Linting before commits
- Automatic formatting
- Build validation

---

## 6. IMPLEMENTATION ROADMAP FOR IPHONE APP

### Phase 1: Core Features (Months 1-2)

**Authentication & Onboarding**
- Login/Register screens
- Email verification flow
- Password reset
- Google OAuth
- Profile setup
- Keychain integration for secure token storage

**Browse & Search**
- Service listing with filters
- Search functionality
- Specialist profiles
- Favorites management
- Category browsing
- Location-based filtering

**Basic Booking**
- Service details view
- Availability/time slot selection
- Booking confirmation
- Status tracking
- Cancellation

**Payments (Phase 1)**
- Stripe card integration
- Apple Pay integration
- Payment history

### Phase 2: Advanced Features (Months 3-4)

**Messaging & Notifications**
- Real-time chat (WebSocket)
- Typing indicators
- Message history
- Push notifications
- In-app notifications
- Notification preferences

**Reviews & Ratings**
- Create/edit reviews
- View specialist reviews
- Rating system
- Review photos

**Loyalty & Referrals**
- Loyalty points display
- Points earning/redemption
- Tier tracking
- Generate referral codes
- Track referrals
- Reward redemption

**Wallet & Crypto**
- Wallet balance display
- Transaction history
- Crypto payment QR codes
- Wallet application to bookings

### Phase 3: Specialist Features (Months 5-6)

**Specialist Dashboard**
- Bookings management
- Analytics overview
- Rating/reviews
- Earnings tracking

**Service Management**
- Create/edit services
- Upload service images
- Pricing configuration
- Loyalty points setup
- Discount management

**Availability Management**
- Set working hours
- Create availability blocks
- Vacation scheduling
- Timezone settings

**Employee Management** (if applicable)
- Add team members
- Assign services
- Set employee availability

### Phase 4: Polish & Optimization (Month 7)

- Performance optimization
- UI/UX refinement
- Accessibility improvements
- Localization (EN, UK, RU)
- Push notification refinement
- Offline capability for critical features

---

## 7. KEY INTEGRATION POINTS FOR MOBILE

### 7.1 Authentication Flow on iOS

```
1. Check Keychain for valid access token
2. If not found, check for refresh token
3. If refresh token exists, refresh access token
4. If no tokens, show login screen
5. After successful login:
   - Store access token in Keychain
   - Store refresh token in Keychain
   - Store user info in UserDefaults (encrypted)
6. On 401: Auto-refresh token or force re-login
```

### 7.2 Payment Processing on iOS

```
For Stripe:
1. Create payment intent via /payments/intent
2. Initialize Stripe SDK with intent
3. Customer confirms payment
4. Handle success/failure callback
5. Verify booking status

For Crypto:
1. Create deposit intent
2. Receive QR code URL
3. Display QR in camera view
4. Customer scans and pays
5. Poll /crypto-payments/bookings/:id/status
6. Auto-complete when confirmed

For Apple Pay:
1. Create payment intent
2. Initialize Apple Pay
3. Process through Stripe/PayPal
4. Complete booking
```

### 7.3 WebSocket Connection

```
Initialize on app launch:
1. Wait for authentication
2. Connect to wss://huddle-backend-production.up.railway.app
3. Emit auth token
4. Join notification room
5. Subscribe to booking events

Auto-reconnect on disconnect:
- Exponential backoff
- Max 10 retries
- Fallback to polling if needed

Handle events:
- notification:new → show toast/badge
- booking:status_changed → update UI
- message → show chat notification
```

### 7.4 Image Handling on iOS

```
Avatar/Service Images:
1. Use placeholder while loading
2. Cache images locally
3. Resize for different screen sizes
4. Support HEIC format
5. Optimize for bandwidth

Upload Flow:
1. Pick image from library/camera
2. Compress to < 5MB
3. Upload to /files/upload
4. Show progress indicator
5. Save returned URL to profile/service
```

### 7.5 Push Notifications on iOS

```
Setup:
1. Request user permission
2. Get device token
3. Send token to backend

Backend Integration:
1. Store device token with user
2. Send APNs notifications for events
3. Handle notification payload
4. Deep link to relevant screen

Handling:
1. Foreground: Show in-app banner
2. Background: Show alert
3. Tap: Deep link to relevant screen
4. Track notification received
```

---

## 8. PERFORMANCE CONSIDERATIONS

### 8.1 API Optimization

**Request Batching:**
- Combine multiple requests where possible
- Use pagination to limit data

**Caching Strategy:**
- Cache service listings (5 min)
- Cache specialist profiles (10 min)
- Cache user preferences (session)
- Invalidate on updates

**Image Optimization:**
- Resize on upload
- Use WebP format
- Lazy load images
- Implement progressive loading

**Database Optimization:**
- Backend uses indexed queries
- Pagination reduces payload
- Selective field queries

### 8.2 Mobile-Specific Optimizations

**Battery & Data:**
- Minimize WebSocket connections
- Use background refresh efficiently
- Compress API responses
- Implement smart retry logic

**Storage:**
- Clear cache periodically
- Compress local image cache
- Limit offline data storage

**Network:**
- Implement request queuing
- Handle network state changes
- Implement exponential backoff

---

## 9. SECURITY CONSIDERATIONS

### 9.1 Data Protection

**In Transit:**
- HTTPS only (iOS enforces)
- TLS 1.2+ required
- Certificate pinning recommended

**At Rest:**
- Keychain for tokens (iOS secure storage)
- UserDefaults for non-sensitive data
- Database encryption on backend
- Sensitive data hashing

### 9.2 API Security

**JWT Validation:**
- Verify token signature
- Check expiration
- Validate claims

**Rate Limiting:**
- Per-user limits
- Per-endpoint limits
- Exponential backoff on 429

**Input Validation:**
- Validate all inputs
- Sanitize user data
- Prevent injection attacks

**CORS & CSRF:**
- Backend handles CORS
- Token-based CSRF protection

---

## 10. TESTING STRATEGY

### 10.1 Unit Tests

**Backend:**
- Service logic
- Utility functions
- Validation

**Frontend:**
- Components
- Hooks
- Store/actions
- Utilities

### 10.2 Integration Tests

- API endpoints
- Payment flows
- Authentication
- Database operations

### 10.3 E2E Tests

- Booking flow
- Payment processing
- Messaging
- Specialist operations

---

## CONCLUSION

The BookingBot platform is a comprehensive, production-ready booking marketplace with extensive feature coverage including:

- Multi-sided marketplace (customers, specialists)
- Multiple payment methods (cards, crypto, wallet)
- Loyalty and referral programs
- Real-time messaging and notifications
- Group session support
- Team management for specialists
- Comprehensive analytics

Building an iPhone app will require careful implementation of:
1. Secure authentication with token management
2. Efficient API integration with proper error handling
3. Real-time features via WebSocket
4. Payment processing (Stripe, crypto, Apple Pay)
5. Offline capability for critical features
6. Responsive UI optimized for mobile
7. Performance optimization for battery and data

The backend API is well-structured, documented, and ready for mobile consumption. Most features can be integrated directly, with mobile-specific optimizations needed for:
- Image handling and caching
- Network resilience
- Push notifications
- Location services
- Offline functionality

Total estimated development time: 4-6 months for a feature-complete iOS app with native UI/UX optimizations.

