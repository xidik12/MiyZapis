# Booking Platform Backend API Architecture

## Overview
A comprehensive RESTful API architecture designed to serve web applications, Telegram bots, and Telegram mini apps with unified data models and scalable design patterns.

## Technology Stack Recommendations

### Core Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with Helmet for security
- **Database**: PostgreSQL with Redis for caching
- **ORM**: Prisma for type-safe database operations
- **Authentication**: JWT with refresh tokens
- **Real-time**: Socket.io for WebSocket connections 
- **Payment**: Stripe integration
- **File Storage**: AWS S3 or CloudFlare R2

### Infrastructure
- **API Gateway**: NGINX for load balancing
- **Monitoring**: New Relic or DataDog
- **Logging**: Winston with structured logging
- **Rate Limiting**: Redis-based rate limiter
- **Queue System**: Bull Queue with Redis

## Core API Structure

### Base URL Structure
```
Production: https://api.bookingplatform.com/v1
Development: https://dev-api.bookingplatform.com/v1
Staging: https://staging-api.bookingplatform.com/v1
```

### Authentication Endpoints

#### POST /auth/register
Register new user (customer or specialist)
```json
Request:
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "userType": "customer" | "specialist",
  "telegramId": "optional_telegram_id"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "userType": "customer",
      "profileComplete": false,
      "loyaltyPoints": 0
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token",
      "expiresIn": 3600
    }
  }
}
```

#### POST /auth/login
```json
Request:
{
  "email": "user@example.com",
  "password": "securePassword123",
  "platform": "web" | "telegram_bot" | "telegram_mini_app"
}

Response:
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "tokens": { /* token object */ }
  }
}
```

#### POST /auth/telegram
Telegram-specific authentication
```json
Request:
{
  "telegramId": "123456789",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "authDate": 1234567890,
  "hash": "telegram_hash"
}

Response:
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "tokens": { /* token object */ },
    "isNewUser": false
  }
}
```

#### POST /auth/refresh
```json
Request:
{
  "refreshToken": "refresh_token"
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_token",
    "expiresIn": 3600
  }
}
```

### User Management Endpoints

#### GET /users/profile
Get current user profile
```json
Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890",
    "avatar": "https://cdn.example.com/avatar.jpg",
    "userType": "customer",
    "loyaltyPoints": 150,
    "totalBookings": 25,
    "memberSince": "2024-01-15T10:00:00Z",
    "preferences": {
      "language": "en",
      "currency": "USD",
      "notifications": {
        "email": true,
        "push": true,
        "telegram": true
      }
    }
  }
}
```

#### PUT /users/profile
Update user profile
```json
Request:
{
  "firstName": "John",
  "lastName": "Smith",
  "phoneNumber": "+1234567890",
  "preferences": {
    "language": "en",
    "currency": "USD"
  }
}

Response:
{
  "success": true,
  "data": { /* updated user object */ }
}
```

#### POST /users/avatar
Upload user avatar
```json
Request: multipart/form-data
{
  "avatar": File
}

Response:
{
  "success": true,
  "data": {
    "avatarUrl": "https://cdn.example.com/avatar-new.jpg"
  }
}
```

### Specialist Management Endpoints

#### GET /specialists/profile
Get specialist profile (specialist only)
```json
Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "user_uuid",
    "businessName": "John's Consulting",
    "description": "Professional business consultant",
    "specialties": ["business", "marketing", "strategy"],
    "experience": 5,
    "rating": 4.8,
    "totalReviews": 127,
    "totalBookings": 450,
    "isVerified": true,
    "availability": {
      "timezone": "America/New_York",
      "workingHours": {
        "monday": { "start": "09:00", "end": "17:00" },
        "tuesday": { "start": "09:00", "end": "17:00" }
      }
    },
    "pricing": {
      "baseRate": 100,
      "currency": "USD",
      "depositAmount": 2
    },
    "revenue": {
      "thisMonth": 2500,
      "lastMonth": 2200,
      "total": 45000
    }
  }
}
```

#### PUT /specialists/profile
Update specialist profile
```json
Request:
{
  "businessName": "John's Advanced Consulting",
  "description": "Expert business consultant with 5+ years experience",
  "specialties": ["business", "marketing", "strategy", "finance"],
  "baseRate": 120,
  "availability": {
    "timezone": "America/New_York",
    "workingHours": { /* schedule object */ }
  }
}

Response:
{
  "success": true,
  "data": { /* updated specialist profile */ }
}
```

#### GET /specialists/services
Get specialist's services
```json
Response:
{
  "success": true,
  "data": [
    {
      "id": "service_uuid",
      "name": "Business Strategy Consultation",
      "description": "1-hour strategic planning session",
      "duration": 60,
      "price": 150,
      "category": "consultation",
      "isActive": true,
      "requirements": ["Prepare business overview", "Financial statements"],
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### POST /specialists/services
Create new service
```json
Request:
{
  "name": "Marketing Strategy Session",
  "description": "2-hour marketing planning workshop",
  "duration": 120,
  "price": 200,
  "category": "workshop",
  "requirements": ["Current marketing materials", "Target audience data"]
}

Response:
{
  "success": true,
  "data": { /* created service object */ }
}
```

#### PUT /specialists/services/:serviceId
Update service
#### DELETE /specialists/services/:serviceId
Delete service

#### GET /specialists/availability
Get specialist availability
```json
Query Parameters:
- startDate: "2024-03-01"
- endDate: "2024-03-31"
- timezone: "America/New_York"

Response:
{
  "success": true,
  "data": {
    "availableSlots": [
      {
        "date": "2024-03-15",
        "slots": [
          {
            "startTime": "09:00",
            "endTime": "10:00",
            "available": true
          },
          {
            "startTime": "10:00",
            "endTime": "11:00",
            "available": false,
            "reason": "booked"
          }
        ]
      }
    ]
  }
}
```

#### POST /specialists/availability/block
Block time slots
```json
Request:
{
  "startDateTime": "2024-03-15T14:00:00Z",
  "endDateTime": "2024-03-15T16:00:00Z",
  "reason": "personal time",
  "recurring": false
}
```

### Service Discovery & Search Endpoints

#### GET /services/search
Search for services and specialists
```json
Query Parameters:
- query: "business consultation"
- category: "consultation"
- minPrice: 50
- maxPrice: 200
- rating: 4.5
- location: "New York"
- availability: "2024-03-15"
- specialties: "business,marketing"
- sortBy: "rating" | "price" | "reviews"
- page: 1
- limit: 20

Response:
{
  "success": true,
  "data": {
    "services": [
      {
        "id": "service_uuid",
        "name": "Business Strategy Consultation",
        "description": "1-hour strategic planning session",
        "price": 150,
        "duration": 60,
        "category": "consultation",
        "specialist": {
          "id": "specialist_uuid",
          "businessName": "John's Consulting",
          "firstName": "John",
          "lastName": "Doe",
          "avatar": "https://cdn.example.com/avatar.jpg",
          "rating": 4.8,
          "totalReviews": 127,
          "isVerified": true,
          "responseTime": "within 2 hours"
        },
        "nextAvailable": "2024-03-15T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 95,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "categories": ["consultation", "workshop", "coaching"],
      "priceRanges": [
        { "min": 0, "max": 50, "count": 15 },
        { "min": 51, "max": 100, "count": 30 }
      ]
    }
  }
}
```

#### GET /services/categories
Get service categories
```json
Response:
{
  "success": true,
  "data": [
    {
      "id": "consultation",
      "name": "Consultation",
      "description": "One-on-one consultation sessions",
      "icon": "consultation-icon.svg",
      "serviceCount": 245
    }
  ]
}
```

#### GET /services/:serviceId
Get specific service details
```json
Response:
{
  "success": true,
  "data": {
    "id": "service_uuid",
    "name": "Business Strategy Consultation",
    "description": "Comprehensive 1-hour strategic planning session",
    "longDescription": "Detailed service description...",
    "price": 150,
    "duration": 60,
    "category": "consultation",
    "requirements": ["Prepare business overview"],
    "deliverables": ["Strategic roadmap", "Action items"],
    "specialist": { /* full specialist profile */ },
    "reviews": [
      {
        "id": "review_uuid",
        "rating": 5,
        "comment": "Excellent consultation, very helpful!",
        "customerName": "Jane Smith",
        "customerAvatar": "https://cdn.example.com/avatar2.jpg",
        "createdAt": "2024-03-10T15:30:00Z"
      }
    ],
    "availability": { /* next available slots */ }
  }
}
```

### Booking Management Endpoints

#### POST /bookings
Create new booking
```json
Request:
{
  "serviceId": "service_uuid",
  "specialistId": "specialist_uuid",
  "scheduledAt": "2024-03-15T10:00:00Z",
  "duration": 60,
  "notes": "Looking for help with marketing strategy",
  "paymentMethodId": "pm_stripe_id"
}

Response:
{
  "success": true,
  "data": {
    "booking": {
      "id": "booking_uuid",
      "serviceId": "service_uuid",
      "customerId": "customer_uuid",
      "specialistId": "specialist_uuid",
      "status": "pending_payment",
      "scheduledAt": "2024-03-15T10:00:00Z",
      "duration": 60,
      "totalAmount": 150,
      "depositAmount": 2,
      "notes": "Looking for help with marketing strategy",
      "createdAt": "2024-03-14T09:00:00Z"
    },
    "paymentIntent": {
      "clientSecret": "pi_stripe_client_secret",
      "amount": 200, // $2 deposit in cents
      "currency": "usd"
    }
  }
}
```

#### GET /bookings
Get user's bookings
```json
Query Parameters:
- status: "pending" | "confirmed" | "completed" | "cancelled"
- startDate: "2024-03-01"
- endDate: "2024-03-31"
- page: 1
- limit: 20

Response:
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "booking_uuid",
        "service": {
          "id": "service_uuid",
          "name": "Business Strategy Consultation",
          "duration": 60
        },
        "specialist": {
          "id": "specialist_uuid",
          "businessName": "John's Consulting",
          "firstName": "John",
          "lastName": "Doe",
          "avatar": "https://cdn.example.com/avatar.jpg"
        },
        "customer": { /* customer info for specialists */ },
        "status": "confirmed",
        "scheduledAt": "2024-03-15T10:00:00Z",
        "totalAmount": 150,
        "depositPaid": true,
        "canCancel": true,
        "cancellationDeadline": "2024-03-14T10:00:00Z",
        "meetingLink": "https://meet.example.com/booking123",
        "createdAt": "2024-03-14T09:00:00Z"
      }
    ],
    "pagination": { /* pagination object */ }
  }
}
```

#### GET /bookings/:bookingId
Get specific booking details
#### PUT /bookings/:bookingId
Update booking (reschedule, add notes)
#### DELETE /bookings/:bookingId
Cancel booking

#### POST /bookings/:bookingId/confirm
Specialist confirms booking
```json
Request:
{
  "meetingLink": "https://meet.example.com/booking123",
  "preparationNotes": "Please prepare financial statements"
}

Response:
{
  "success": true,
  "data": {
    "booking": { /* updated booking object */ },
    "notificationsSent": ["customer_email", "customer_push", "customer_telegram"]
  }
}
```

#### POST /bookings/:bookingId/complete
Mark booking as completed
```json
Request:
{
  "completionNotes": "Session completed successfully",
  "deliverables": ["Strategic roadmap document", "Action items list"]
}
```

#### POST /bookings/:bookingId/reschedule
Reschedule booking
```json
Request:
{
  "newScheduledAt": "2024-03-16T14:00:00Z",
  "reason": "Customer request"
}
```

### Payment Endpoints

#### POST /payments/process-deposit
Process deposit payment
```json
Request:
{
  "bookingId": "booking_uuid",
  "paymentMethodId": "pm_stripe_id",
  "amount": 200 // cents
}

Response:
{
  "success": true,
  "data": {
    "paymentIntent": {
      "id": "pi_stripe_id",
      "status": "succeeded",
      "amount": 200,
      "currency": "usd"
    },
    "booking": { /* updated booking object */ }
  }
}
```

#### POST /payments/process-full-payment
Process remaining payment after session
```json
Request:
{
  "bookingId": "booking_uuid",
  "paymentMethodId": "pm_stripe_id",
  "loyaltyPointsUsed": 50
}

Response:
{
  "success": true,
  "data": {
    "payment": {
      "id": "payment_uuid",
      "amount": 14800, // $148 in cents (150 - 2 deposit)
      "loyaltyDiscount": 500, // $5 from 50 points
      "finalAmount": 14300,
      "currency": "usd",
      "status": "succeeded"
    },
    "loyaltyPointsEarned": 15,
    "booking": { /* updated booking object */ }
  }
}
```

#### POST /payments/refund
Process refund
```json
Request:
{
  "bookingId": "booking_uuid",
  "refundType": "full" | "partial" | "deposit_only",
  "reason": "Customer cancellation within policy"
}
```

#### GET /payments/history
Get payment history
```json
Response:
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "payment_uuid",
        "bookingId": "booking_uuid",
        "type": "deposit" | "full_payment" | "refund",
        "amount": 200,
        "currency": "usd",
        "status": "succeeded",
        "paymentMethod": "card",
        "createdAt": "2024-03-14T09:00:00Z"
      }
    ]
  }
}
```

### Review & Rating Endpoints

#### POST /reviews
Create review
```json
Request:
{
  "bookingId": "booking_uuid",
  "rating": 5,
  "comment": "Excellent consultation, very helpful!",
  "tags": ["professional", "knowledgeable", "punctual"]
}

Response:
{
  "success": true,
  "data": {
    "review": {
      "id": "review_uuid",
      "bookingId": "booking_uuid",
      "customerId": "customer_uuid",
      "specialistId": "specialist_uuid",
      "rating": 5,
      "comment": "Excellent consultation, very helpful!",
      "tags": ["professional", "knowledgeable", "punctual"],
      "createdAt": "2024-03-15T11:30:00Z"
    },
    "loyaltyPointsEarned": 10
  }
}
```

#### GET /reviews
Get reviews
```json
Query Parameters:
- specialistId: "specialist_uuid"
- customerId: "customer_uuid"
- rating: 5
- page: 1
- limit: 20

Response:
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "review_uuid",
        "rating": 5,
        "comment": "Excellent consultation!",
        "tags": ["professional", "knowledgeable"],
        "customer": {
          "firstName": "Jane",
          "lastName": "S.",
          "avatar": "https://cdn.example.com/avatar.jpg"
        },
        "service": {
          "name": "Business Strategy Consultation"
        },
        "createdAt": "2024-03-15T11:30:00Z"
      }
    ],
    "averageRating": 4.8,
    "totalReviews": 127,
    "ratingDistribution": {
      "5": 89,
      "4": 25,
      "3": 8,
      "2": 3,
      "1": 2
    }
  }
}
```

#### PUT /reviews/:reviewId
Update review
#### DELETE /reviews/:reviewId
Delete review

### Loyalty Program Endpoints

#### GET /loyalty/points
Get loyalty points summary
```json
Response:
{
  "success": true,
  "data": {
    "currentBalance": 150,
    "totalEarned": 450,
    "totalSpent": 300,
    "tier": "silver",
    "nextTierPoints": 350,
    "nextTierBenefits": ["5% discount", "Priority support"],
    "recentActivity": [
      {
        "type": "earned",
        "amount": 15,
        "reason": "Booking completed",
        "bookingId": "booking_uuid",
        "createdAt": "2024-03-15T11:30:00Z"
      }
    ]
  }
}
```

#### POST /loyalty/redeem
Redeem loyalty points
```json
Request:
{
  "points": 50,
  "rewardType": "discount" | "service_credit",
  "bookingId": "booking_uuid" // for discount application
}

Response:
{
  "success": true,
  "data": {
    "redemption": {
      "id": "redemption_uuid",
      "points": 50,
      "value": 500, // $5 in cents
      "type": "discount",
      "appliedTo": "booking_uuid"
    },
    "newBalance": 100
  }
}
```

#### GET /loyalty/history
Get loyalty points history

### Notification Endpoints

#### GET /notifications
Get user notifications
```json
Response:
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notification_uuid",
        "type": "booking_confirmed",
        "title": "Booking Confirmed",
        "message": "Your consultation with John's Consulting is confirmed for March 15, 2024 at 10:00 AM",
        "data": {
          "bookingId": "booking_uuid",
          "actionUrl": "/bookings/booking_uuid"
        },
        "isRead": false,
        "createdAt": "2024-03-14T10:00:00Z"
      }
    ],
    "unreadCount": 3
  }
}
```

#### PUT /notifications/:notificationId/read
Mark notification as read
#### PUT /notifications/mark-all-read
Mark all notifications as read

#### POST /notifications/preferences
Update notification preferences
```json
Request:
{
  "email": {
    "bookingConfirmations": true,
    "reminders": true,
    "promotions": false
  },
  "push": {
    "bookingConfirmations": true,
    "reminders": true,
    "messages": true
  },
  "telegram": {
    "bookingConfirmations": true,
    "reminders": true
  }
}
```

### Analytics & Reporting Endpoints

#### GET /analytics/specialist/dashboard
Specialist analytics dashboard
```json
Response:
{
  "success": true,
  "data": {
    "overview": {
      "totalRevenue": 45000,
      "thisMonthRevenue": 2500,
      "totalBookings": 450,
      "thisMonthBookings": 18,
      "averageRating": 4.8,
      "responseRate": 95
    },
    "revenueChart": [
      { "month": "2024-01", "revenue": 2200 },
      { "month": "2024-02", "revenue": 2400 },
      { "month": "2024-03", "revenue": 2500 }
    ],
    "topServices": [
      {
        "serviceId": "service_uuid",
        "name": "Business Strategy Consultation",
        "bookings": 45,
        "revenue": 6750
      }
    ],
    "customerSatisfaction": {
      "averageRating": 4.8,
      "responseRate": 98,
      "repeatCustomers": 65
    }
  }
}
```

#### GET /analytics/platform/metrics
Platform-wide metrics (admin only)
```json
Response:
{
  "success": true,
  "data": {
    "users": {
      "total": 15000,
      "customers": 12000,
      "specialists": 3000,
      "growth": {
        "thisMonth": 150,
        "lastMonth": 120
      }
    },
    "bookings": {
      "total": 45000,
      "thisMonth": 1200,
      "completionRate": 95,
      "averageValue": 125
    },
    "revenue": {
      "total": 5625000,
      "thisMonth": 150000,
      "commissionEarned": 562500
    }
  }
}
```

### Telegram Bot Webhook Endpoints

#### POST /telegram/webhook
Handle Telegram bot updates
```json
Request:
{
  "update_id": 123456789,
  "message": {
    "message_id": 123,
    "from": {
      "id": 987654321,
      "is_bot": false,
      "first_name": "John",
      "last_name": "Doe",
      "username": "johndoe"
    },
    "chat": {
      "id": 987654321,
      "first_name": "John",
      "last_name": "Doe",
      "username": "johndoe",
      "type": "private"
    },
    "date": 1234567890,
    "text": "/start"
  }
}

Response:
{
  "ok": true
}
```

#### POST /telegram/commands/start
Handle /start command
#### POST /telegram/commands/book
Handle /book command
#### POST /telegram/commands/mybookings
Handle /mybookings command

### WebSocket Events

#### Connection
```javascript
// Client connects to WebSocket
const socket = io('wss://api.bookingplatform.com', {
  auth: {
    token: 'jwt_token'
  }
});
```

#### Real-time Events
```javascript
// Booking status updates
socket.on('booking:status_changed', (data) => {
  // { bookingId, oldStatus, newStatus, updatedAt }
});

// New booking notification (for specialists)
socket.on('booking:new', (data) => {
  // { booking, customer, service }
});

// Payment status updates
socket.on('payment:status_changed', (data) => {
  // { paymentId, bookingId, status, amount }
});

// New message/notification
socket.on('notification:new', (data) => {
  // { notification }
});

// Specialist availability updates
socket.on('availability:updated', (data) => {
  // { specialistId, date, availableSlots }
});
```

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "email",
        "message": "Email is required",
        "code": "REQUIRED"
      }
    ],
    "requestId": "req_uuid",
    "timestamp": "2024-03-14T10:00:00Z"
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable Entity (business logic error)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Error Codes
- `VALIDATION_ERROR` - Request validation failed
- `AUTHENTICATION_REQUIRED` - Valid authentication required
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `DUPLICATE_RESOURCE` - Resource already exists
- `BUSINESS_RULE_VIOLATION` - Business logic constraint violated
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `PAYMENT_FAILED` - Payment processing failed
- `BOOKING_CONFLICT` - Booking time slot conflict
- `CANCELLATION_NOT_ALLOWED` - Booking cannot be cancelled

## Security Measures

### Authentication & Authorization
- JWT tokens with 1-hour expiration
- Refresh tokens with 30-day expiration
- Role-based access control (RBAC)
- Telegram auth validation
- API key authentication for internal services

### Rate Limiting
```javascript
// Per-user rate limits
const userLimits = {
  '/auth/login': '5 per 15 minutes',
  '/bookings': '10 per minute',
  '/payments/*': '3 per minute',
  'default': '100 per hour'
};

// Global rate limits
const globalLimits = {
  '/auth/*': '1000 per hour',
  'default': '10000 per hour'
};
```

### Data Validation
- Request schema validation using Joi
- SQL injection prevention via parameterized queries
- XSS protection with input sanitization
- File upload validation and virus scanning

### Security Headers
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## Database Schema Optimization

### Indexing Strategy
```sql
-- Users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_type ON users(user_type);

-- Specialists table
CREATE INDEX idx_specialists_user_id ON specialists(user_id);
CREATE INDEX idx_specialists_rating ON specialists(rating);
CREATE INDEX idx_specialists_verified ON specialists(is_verified);

-- Services table
CREATE INDEX idx_services_specialist_id ON services(specialist_id);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_price ON services(price);
CREATE INDEX idx_services_active ON services(is_active);

-- Bookings table
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_specialist_id ON bookings(specialist_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_scheduled_at ON bookings(scheduled_at);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);

-- Composite indexes for common queries
CREATE INDEX idx_bookings_specialist_status ON bookings(specialist_id, status);
CREATE INDEX idx_bookings_customer_status ON bookings(customer_id, status);
CREATE INDEX idx_services_category_price ON services(category, price);
```

### Query Optimization Examples
```sql
-- Efficient specialist search with pagination
SELECT s.*, u.first_name, u.last_name, u.avatar,
       AVG(r.rating) as avg_rating,
       COUNT(r.id) as review_count
FROM specialists s
JOIN users u ON s.user_id = u.id
LEFT JOIN reviews r ON s.id = r.specialist_id
WHERE s.is_verified = true
  AND EXISTS (
    SELECT 1 FROM services srv 
    WHERE srv.specialist_id = s.id 
      AND srv.is_active = true
      AND srv.category = $1
      AND srv.price BETWEEN $2 AND $3
  )
GROUP BY s.id, u.first_name, u.last_name, u.avatar
HAVING AVG(r.rating) >= $4
ORDER BY avg_rating DESC, review_count DESC
LIMIT $5 OFFSET $6;

-- Efficient availability check
SELECT COUNT(*) as conflicts
FROM bookings b
WHERE b.specialist_id = $1
  AND b.status IN ('confirmed', 'pending')
  AND b.scheduled_at < $3
  AND (b.scheduled_at + INTERVAL '1 minute' * b.duration) > $2;
```

### Caching Strategy
```javascript
// Redis caching patterns
const cachePatterns = {
  // User profile cache (1 hour)
  userProfile: (userId) => `user:${userId}:profile`,
  
  // Specialist availability cache (15 minutes)
  availability: (specialistId, date) => `availability:${specialistId}:${date}`,
  
  // Service search results cache (5 minutes)
  searchResults: (query, filters) => `search:${hashFilters(query, filters)}`,
  
  // Popular services cache (1 hour)
  popularServices: () => 'services:popular',
  
  // Platform metrics cache (30 minutes)
  platformMetrics: () => 'metrics:platform'
};

// Cache invalidation patterns
const invalidatePatterns = {
  onBookingCreated: [
    'availability:${booking.specialistId}:*',
    'metrics:platform'
  ],
  onServiceUpdated: [
    'search:*',
    'services:popular'
  ],
  onUserUpdated: [
    'user:${userId}:profile'
  ]
};
```

## Integration Guidelines

### Web Frontend Integration
```typescript
// API client configuration
const apiClient = axios.create({
  baseURL: 'https://api.bookingplatform.com/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor for auth token
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      await refreshAuthToken();
      return apiClient.request(error.config);
    }
    throw error;
  }
);
```

### Telegram Bot Integration
```javascript
// Bot webhook handler
app.post('/telegram/webhook', async (req, res) => {
  try {
    const update = req.body;
    
    if (update.message) {
      await handleMessage(update.message);
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    }
    
    res.json({ ok: true });
  } catch (error) {
    logger.error('Telegram webhook error:', error);
    res.status(500).json({ ok: false });
  }
});

// Command handlers
const commands = {
  '/start': async (message) => {
    const user = await authenticateOrCreateUser(message.from);
    await sendWelcomeMessage(message.chat.id, user);
  },
  
  '/book': async (message) => {
    const services = await getPopularServices();
    await sendServiceMenu(message.chat.id, services);
  },
  
  '/mybookings': async (message) => {
    const user = await getUserByTelegramId(message.from.id);
    const bookings = await getUserBookings(user.id);
    await sendBookingsList(message.chat.id, bookings);
  }
};
```

### Telegram Mini App Integration
```javascript
// Mini app initialization
window.Telegram.WebApp.ready();

// User authentication
const initData = window.Telegram.WebApp.initData;
const response = await fetch('/api/v1/auth/telegram', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    initData: initData,
    platform: 'telegram_mini_app'
  })
});

// Handle main button events
window.Telegram.WebApp.MainButton.onClick(() => {
  // Handle booking confirmation, payment, etc.
});

// Handle back button
window.Telegram.WebApp.BackButton.onClick(() => {
  // Navigate back in the mini app
});
```

## Deployment Architecture

### Production Environment
```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    image: booking-platform-api:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://...
      - JWT_SECRET=...
    depends_on:
      - postgres
      - redis
      
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=booking_platform
      - POSTGRES_USER=...
      - POSTGRES_PASSWORD=...
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
      
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
```

### Environment Configuration
```javascript
// config/production.js
module.exports = {
  database: {
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    pool: {
      min: 5,
      max: 20,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 600000
    }
  },
  
  redis: {
    url: process.env.REDIS_URL,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '1h',
    refreshExpiresIn: '30d'
  },
  
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  },
  
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL
  },
  
  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3Bucket: process.env.AWS_S3_BUCKET
  }
};
```

## Monitoring & Logging

### Structured Logging
```javascript
// logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'booking-platform-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Usage examples
logger.info('User authenticated', {
  userId: user.id,
  platform: 'web',
  ip: req.ip
});

logger.error('Payment processing failed', {
  bookingId: booking.id,
  amount: amount,
  error: error.message,
  stack: error.stack
});
```

### Health Check Endpoints
```javascript
// GET /health
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await db.raw('SELECT 1');
    
    // Check Redis connection
    await redis.ping();
    
    // Check external services
    const stripeStatus = await checkStripeStatus();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        redis: 'healthy',
        stripe: stripeStatus ? 'healthy' : 'degraded'
      },
      version: process.env.npm_package_version
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

This comprehensive API architecture provides a solid foundation for building a scalable booking platform that serves web, Telegram bot, and Telegram mini app clients with consistent data models and efficient operations.