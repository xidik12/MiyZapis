# New API Endpoints - Testing Documentation

This document provides comprehensive testing instructions for all newly implemented API endpoints. All endpoints require authentication unless specified otherwise.

## Table of Contents
1. [Review System APIs](#review-system-apis)
2. [Loyalty Program APIs](#loyalty-program-apis) 
3. [Specialist Availability APIs](#specialist-availability-apis)
4. [Enhanced Notification APIs](#enhanced-notification-apis)
5. [Enhanced Analytics APIs](#enhanced-analytics-apis)
6. [Authentication Setup](#authentication-setup)
7. [Error Handling](#error-handling)

## Authentication Setup

All API requests (except public endpoints) require authentication via JWT token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

To get a JWT token, first authenticate:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your_password"
  }'
```

## Review System APIs

### 1. Create Review
**POST** `/api/reviews/enhanced`

```bash
curl -X POST http://localhost:5000/api/reviews/enhanced \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "booking_id_here",
    "rating": 5,
    "comment": "Excellent service!",
    "tags": ["professional", "punctual", "quality"]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "review": {
      "id": "review_id",
      "rating": 5,
      "comment": "Excellent service!",
      "tags": ["professional", "punctual", "quality"],
      "isVerified": true,
      "createdAt": "2025-08-21T..."
    }
  }
}
```

### 2. Get Reviews with Filters
**GET** `/api/reviews/enhanced?specialistId=<id>&rating=5&page=1&limit=10`

```bash
curl -X GET "http://localhost:5000/api/reviews/enhanced?specialistId=specialist_id&rating=5&page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

### 3. Update Review
**PUT** `/api/reviews/enhanced/<review_id>`

```bash
curl -X PUT http://localhost:5000/api/reviews/enhanced/review_id \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 4,
    "comment": "Updated review comment"
  }'
```

### 4. Delete Review
**DELETE** `/api/reviews/enhanced/<review_id>`

```bash
curl -X DELETE http://localhost:5000/api/reviews/enhanced/review_id \
  -H "Authorization: Bearer <token>"
```

### 5. Add Specialist Response
**POST** `/api/reviews/<review_id>/response`

```bash
curl -X POST http://localhost:5000/api/reviews/review_id/response \
  -H "Authorization: Bearer <specialist_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "response": "Thank you for your feedback! We appreciate your business."
  }'
```

### 6. Get Specialist Review Statistics
**GET** `/api/reviews/specialist/<specialist_id>/stats`

```bash
curl -X GET http://localhost:5000/api/reviews/specialist/specialist_id/stats
```

## Loyalty Program APIs

### 1. Get Loyalty Balance
**GET** `/api/loyalty/balance`

```bash
curl -X GET http://localhost:5000/api/loyalty/balance \
  -H "Authorization: Bearer <token>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "balance": {
      "balance": 1250,
      "totalEarned": 2500,
      "totalRedeemed": 1250,
      "recentTransactions": [...],
      "user": {
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  }
}
```

### 2. Get Loyalty Transaction History
**GET** `/api/loyalty/transactions?page=1&limit=20&type=EARNED`

```bash
curl -X GET "http://localhost:5000/api/loyalty/transactions?page=1&limit=20&type=EARNED" \
  -H "Authorization: Bearer <token>"
```

### 3. Redeem Loyalty Points
**POST** `/api/loyalty/redeem`

```bash
curl -X POST http://localhost:5000/api/loyalty/redeem \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "points": 100,
    "reason": "Discount on booking",
    "description": "Applied 100 points discount",
    "referenceId": "booking_id"
  }'
```

### 4. Award Points (Admin Only)
**POST** `/api/loyalty/award`

```bash
curl -X POST http://localhost:5000/api/loyalty/award \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_id",
    "points": 500,
    "reason": "Bonus points",
    "description": "Welcome bonus",
    "type": "BONUS"
  }'
```

### 5. Get Loyalty Tiers (Public)
**GET** `/api/loyalty/tiers`

```bash
curl -X GET http://localhost:5000/api/loyalty/tiers
```

### 6. Get User's Current Tier
**GET** `/api/loyalty/tier`

```bash
curl -X GET http://localhost:5000/api/loyalty/tier \
  -H "Authorization: Bearer <token>"
```

## Specialist Availability APIs

### 1. Get Specialist Availability
**GET** `/api/availability/specialists/<specialist_id>/availability?startDate=2025-08-21&endDate=2025-08-28`

```bash
curl -X GET "http://localhost:5000/api/availability/specialists/specialist_id/availability?startDate=2025-08-21&endDate=2025-08-28"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "availability": {
      "specialist": {
        "id": "specialist_id",
        "businessName": "Business Name",
        "name": "John Specialist",
        "timezone": "UTC",
        "rating": 4.8,
        "reviewCount": 25
      },
      "workingHours": {
        "monday": {"start": "09:00", "end": "17:00"},
        "tuesday": {"start": "09:00", "end": "17:00"}
      },
      "calendar": [
        {
          "date": "2025-08-21T00:00:00.000Z",
          "dayOfWeek": "thursday",
          "isWorkingDay": true,
          "timeSlots": [...],
          "hasAvailableSlots": true,
          "totalBookings": 2
        }
      ],
      "summary": {
        "totalDays": 7,
        "availableDays": 5,
        "totalBookings": 8
      }
    }
  }
}
```

### 2. Create Availability Block (Specialist Only)
**POST** `/api/availability/specialists/availability/blocks`

```bash
curl -X POST http://localhost:5000/api/availability/specialists/availability/blocks \
  -H "Authorization: Bearer <specialist_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "startDateTime": "2025-08-25T10:00:00.000Z",
    "endDateTime": "2025-08-25T12:00:00.000Z",
    "isAvailable": false,
    "reason": "Personal appointment",
    "isRecurring": false
  }'
```

### 3. Update Availability Block
**PUT** `/api/availability/specialists/availability/blocks/<block_id>`

```bash
curl -X PUT http://localhost:5000/api/availability/specialists/availability/blocks/block_id \
  -H "Authorization: Bearer <specialist_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "isAvailable": true,
    "reason": "Available again"
  }'
```

### 4. Delete Availability Block
**DELETE** `/api/availability/specialists/availability/blocks/<block_id>`

```bash
curl -X DELETE http://localhost:5000/api/availability/specialists/availability/blocks/block_id \
  -H "Authorization: Bearer <specialist_token>"
```

### 5. Check Time Slot Availability
**POST** `/api/availability/specialists/<specialist_id>/availability/check`

```bash
curl -X POST http://localhost:5000/api/availability/specialists/specialist_id/availability/check \
  -H "Content-Type: application/json" \
  -d '{
    "startDateTime": "2025-08-25T14:00:00.000Z",
    "endDateTime": "2025-08-25T15:00:00.000Z"
  }'
```

## Enhanced Notification APIs

### 1. Get User Notifications
**GET** `/api/notifications?page=1&limit=20&type=BOOKING_CONFIRMED&isRead=false`

```bash
curl -X GET "http://localhost:5000/api/notifications?page=1&limit=20&type=BOOKING_CONFIRMED&isRead=false" \
  -H "Authorization: Bearer <token>"
```

### 2. Mark Notification as Read
**PUT** `/api/notifications/<notification_id>/read`

```bash
curl -X PUT http://localhost:5000/api/notifications/notification_id/read \
  -H "Authorization: Bearer <token>"
```

### 3. Mark All Notifications as Read
**PUT** `/api/notifications/read-all`

```bash
curl -X PUT http://localhost:5000/api/notifications/read-all \
  -H "Authorization: Bearer <token>"
```

### 4. Get Unread Count
**GET** `/api/notifications/unread-count`

```bash
curl -X GET http://localhost:5000/api/notifications/unread-count \
  -H "Authorization: Bearer <token>"
```

### 5. Update Notification Settings
**PUT** `/api/notifications/settings`

```bash
curl -X PUT http://localhost:5000/api/notifications/settings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "emailNotifications": true,
    "pushNotifications": true,
    "telegramNotifications": false,
    "notificationTypes": {
      "BOOKING_CONFIRMED": true,
      "PAYMENT_RECEIVED": true,
      "REVIEW_RECEIVED": false
    }
  }'
```

### 6. Get Notification Settings
**GET** `/api/notifications/settings`

```bash
curl -X GET http://localhost:5000/api/notifications/settings \
  -H "Authorization: Bearer <token>"
```

### 7. Send Test Notification
**POST** `/api/notifications/test`

```bash
curl -X POST http://localhost:5000/api/notifications/test \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TEST",
    "title": "Test Notification",
    "message": "This is a test notification"
  }'
```

### 8. Send Bulk Notification (Admin Only)
**POST** `/api/notifications/bulk`

```bash
curl -X POST http://localhost:5000/api/notifications/bulk \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "SYSTEM_ANNOUNCEMENT",
    "title": "System Maintenance",
    "message": "Scheduled maintenance tonight from 2-4 AM",
    "sendToAll": true,
    "data": {
      "priority": "HIGH",
      "category": "maintenance"
    }
  }'
```

## Enhanced Analytics APIs

### 1. Get Specialist Analytics
**GET** `/api/analytics-enhanced/specialist/<specialist_id>?startDate=2025-07-01&endDate=2025-08-21`

```bash
curl -X GET "http://localhost:5000/api/analytics-enhanced/specialist/specialist_id?startDate=2025-07-01&endDate=2025-08-21" \
  -H "Authorization: Bearer <token>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "analytics": {
      "totalBookings": 45,
      "completedBookings": 38,
      "cancelledBookings": 3,
      "totalRevenue": 4750.00,
      "averageRating": 4.7,
      "responseTimeAvg": 15,
      "conversionRate": 84.4,
      "repeatCustomerRate": 32.5,
      "popularServices": [...],
      "recentReviews": [...],
      "monthlyTrends": [...]
    }
  }
}
```

### 2. Get Current User's Specialist Analytics
**GET** `/api/analytics-enhanced/my-specialist?startDate=2025-07-01&endDate=2025-08-21`

```bash
curl -X GET "http://localhost:5000/api/analytics-enhanced/my-specialist?startDate=2025-07-01&endDate=2025-08-21" \
  -H "Authorization: Bearer <specialist_token>"
```

### 3. Get Platform Analytics (Admin Only)
**GET** `/api/analytics-enhanced/platform?startDate=2025-07-01&endDate=2025-08-21`

```bash
curl -X GET "http://localhost:5000/api/analytics-enhanced/platform?startDate=2025-07-01&endDate=2025-08-21" \
  -H "Authorization: Bearer <admin_token>"
```

### 4. Get Analytics Summary
**GET** `/api/analytics-enhanced/summary`

```bash
curl -X GET http://localhost:5000/api/analytics-enhanced/summary \
  -H "Authorization: Bearer <token>"
```

### 5. Get Booking Analytics with Filters
**GET** `/api/analytics-enhanced/bookings?status=COMPLETED&groupBy=week&startDate=2025-07-01`

```bash
curl -X GET "http://localhost:5000/api/analytics-enhanced/bookings?status=COMPLETED&groupBy=week&startDate=2025-07-01" \
  -H "Authorization: Bearer <token>"
```

## Error Handling

All APIs follow consistent error response format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": [
      {
        "field": "fieldName",
        "message": "Specific field error",
        "code": "INVALID_VALUE"
      }
    ],
    "requestId": "unique_request_id",
    "timestamp": "2025-08-21T10:30:00Z"
  }
}
```

### Common Error Codes:
- `AUTHENTICATION_REQUIRED` (401)
- `ACCESS_DENIED` (403)
- `RESOURCE_NOT_FOUND` (404)
- `VALIDATION_ERROR` (400)
- `BUSINESS_RULE_VIOLATION` (400)
- `INSUFFICIENT_BALANCE` (400)
- `INTERNAL_SERVER_ERROR` (500)

## Testing Workflow

### 1. Setup Test Environment
```bash
# Install dependencies
npm install

# Setup test database
npm run db:reset

# Start development server
npm run dev
```

### 2. Create Test Users
```bash
# Create admin user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!",
    "firstName": "Admin",
    "lastName": "User",
    "userType": "ADMIN"
  }'

# Create specialist user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "specialist@test.com",
    "password": "Specialist123!",
    "firstName": "Test",
    "lastName": "Specialist",
    "userType": "SPECIALIST"
  }'

# Create customer user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "password": "Customer123!",
    "firstName": "Test",
    "lastName": "Customer",
    "userType": "CUSTOMER"
  }'
```

### 3. Test API Endpoints
Follow the examples above for each API endpoint, using the appropriate user tokens based on required permissions.

### 4. Verify Data Integrity
- Check database entries after each operation
- Verify business rules are enforced
- Test edge cases and error scenarios
- Validate response formats match documentation

## Performance Testing

For load testing, use tools like:
- Apache Bench (ab)
- Artillery
- k6

Example load test:
```bash
# Test get notifications endpoint
ab -n 1000 -c 10 -H "Authorization: Bearer <token>" \
   http://localhost:5000/api/notifications
```

## Integration Testing

Test complete user workflows:
1. User registration and login
2. Specialist profile setup
3. Service creation
4. Booking creation and completion
5. Review creation
6. Loyalty points earning and redemption
7. Notification delivery
8. Analytics generation

Each workflow should be tested across all three platforms: web, Telegram bot, and Telegram mini app.