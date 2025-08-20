# BookingBot API Complete Reference

## Overview

The BookingBot API is a comprehensive RESTful API that powers the MiyZapis booking platform. It provides endpoints for user management, service booking, payment processing, real-time messaging, and administrative functions.

**Base URL:** `https://api.miyzapis.com/api/v1`  
**Version:** 1.0.0  
**Authentication:** Bearer JWT tokens  
**Content-Type:** `application/json`

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Authentication Flow

1. **Register/Login** → Receive JWT access token + refresh token
2. **Include access token** in all authenticated requests
3. **Refresh token** when access token expires (15 minutes)
4. **Multi-platform support** (web, mobile, Telegram)

## Error Handling

All API responses follow a consistent structure:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    // Optional metadata (pagination, etc.)
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": [
      {
        "field": "fieldName",
        "message": "Field specific error",
        "code": "FIELD_ERROR_CODE"
      }
    ]
  },
  "requestId": "unique-request-id"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `AUTHENTICATION_REQUIRED` | 401 | Valid JWT token required |
| `ACCESS_DENIED` | 403 | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource not found |
| `BOOKING_CONFLICT` | 409 | Time slot conflict |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

## Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "userType": "CUSTOMER",
  "phoneNumber": "+380123456789",
  "language": "uk",
  "currency": "UAH"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "userType": "CUSTOMER"
    },
    "tokens": {
      "accessToken": "jwt-access-token",
      "refreshToken": "jwt-refresh-token",
      "expiresIn": 900
    }
  }
}
```

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "platform": "web"
}
```

### Telegram Authentication
```http
POST /auth/telegram
```

**Request Body:**
```json
{
  "telegramId": "123456789",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "authDate": 1640995200,
  "hash": "telegram-hash"
}
```

### Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

## User Management

### Get Current User Profile
```http
GET /auth/profile
Authorization: Bearer <token>
```

### Update Profile
```http
PUT /auth/profile
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+380123456789",
  "language": "uk",
  "currency": "UAH",
  "timezone": "Europe/Kiev"
}
```

### Change Password
```http
POST /auth/change-password
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

### Forgot Password
```http
POST /auth/forgot-password
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### Reset Password
```http
POST /auth/reset-password
```

**Request Body:**
```json
{
  "token": "reset-token",
  "newPassword": "NewPass123!"
}
```

### Verify Email
```http
POST /auth/verify-email
```

**Request Body:**
```json
{
  "token": "verification-token"
}
```

## Specialist Management

### Create Specialist Profile
```http
POST /specialists/profile
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "businessName": "John's Hair Studio",
  "bio": "Professional hairstylist with 10 years experience",
  "specialties": ["haircut", "styling", "coloring"],
  "address": "123 Main St, Kyiv",
  "city": "Kyiv",
  "state": "Kyiv Oblast",
  "country": "Ukraine",
  "latitude": 50.4501,
  "longitude": 30.5234,
  "workingHours": {
    "monday": { "start": "09:00", "end": "18:00" },
    "tuesday": { "start": "09:00", "end": "18:00" }
  },
  "portfolioImages": ["image1.jpg", "image2.jpg"],
  "certifications": ["cert1.pdf"]
}
```

### Get Specialist Profile
```http
GET /specialists/{specialistId}
```

### Update Specialist Profile
```http
PUT /specialists/profile
Authorization: Bearer <token>
```

### Search Specialists
```http
GET /specialists/search
```

**Query Parameters:**
- `query`: Search term
- `specialties[]`: Specialty filters
- `city`: Location filter
- `minRating`: Minimum rating (1-5)
- `sortBy`: Sort order (rating, reviews, newest, distance)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Example:**
```http
GET /specialists/search?query=haircut&city=Kyiv&minRating=4&sortBy=rating&page=1&limit=10
```

### Get Specialist Analytics
```http
GET /specialists/analytics
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate`: Start date (ISO 8601)
- `endDate`: End date (ISO 8601)

## Service Management

### Create Service
```http
POST /services
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Men's Haircut",
  "description": "Professional men's haircut with styling",
  "category": "haircut",
  "basePrice": 500,
  "currency": "UAH",
  "duration": 60,
  "requirements": ["Bring reference photo"],
  "deliverables": ["Haircut", "Basic styling", "Hair care tips"],
  "images": ["service1.jpg", "service2.jpg"],
  "maxAdvanceBooking": 30,
  "minAdvanceBooking": 2
}
```

### Get Service Details
```http
GET /services/{serviceId}
```

### Update Service
```http
PUT /services/{serviceId}
Authorization: Bearer <token>
```

### Delete Service
```http
DELETE /services/{serviceId}
Authorization: Bearer <token>
```

### Get Specialist Services
```http
GET /services/specialist/services
Authorization: Bearer <token>
```

**Query Parameters:**
- `includeInactive`: Include inactive services (boolean)

### Search Services
```http
GET /services/search
```

**Query Parameters:**
- `query`: Search term
- `category`: Service category
- `minPrice`: Minimum price
- `maxPrice`: Maximum price
- `sortBy`: Sort order (price, rating, newest)
- `page`: Page number
- `limit`: Items per page

### Get Service Categories
```http
GET /services/categories
```

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "haircut",
        "name": "Hair & Beauty",
        "nameUk": "Краса і зачіски",
        "nameRu": "Красота и прически",
        "icon": "✂️",
        "count": 150
      }
    ]
  }
}
```

### Get Popular Services
```http
GET /services/popular
```

**Query Parameters:**
- `limit`: Number of services to return (default: 10)

## Booking Management

### Create Booking
```http
POST /bookings
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "serviceId": "service-uuid",
  "scheduledAt": "2024-03-15T14:00:00.000Z",
  "duration": 60,
  "customerNotes": "Please use organic products",
  "loyaltyPointsUsed": 50,
  "promoCodeId": "promo-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "booking-uuid",
      "customerId": "customer-uuid",
      "specialistId": "specialist-uuid",
      "serviceId": "service-uuid",
      "status": "PENDING",
      "scheduledAt": "2024-03-15T14:00:00.000Z",
      "duration": 60,
      "basePrice": 500,
      "discountAmount": 25,
      "totalAmount": 475,
      "depositAmount": 95,
      "currency": "UAH",
      "customerNotes": "Please use organic products",
      "createdAt": "2024-03-10T10:00:00.000Z"
    }
  }
}
```

### Get Booking Details
```http
GET /bookings/{bookingId}
Authorization: Bearer <token>
```

### Update Booking
```http
PUT /bookings/{bookingId}
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "scheduledAt": "2024-03-16T14:00:00.000Z",
  "customerNotes": "Updated notes",
  "status": "CONFIRMED"
}
```

### Cancel Booking
```http
DELETE /bookings/{bookingId}/cancel
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reason": "Schedule conflict"
}
```

### Get User Bookings
```http
GET /bookings/user/bookings
Authorization: Bearer <token>
```

**Query Parameters:**
- `userType`: customer | specialist
- `status`: Booking status filter
- `page`: Page number
- `limit`: Items per page

### Get Booking Statistics (Specialists)
```http
GET /bookings/specialist/stats
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate`: Start date for statistics
- `endDate`: End date for statistics

## Payment Processing

### Create Payment Intent
```http
POST /payments/intent
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "bookingId": "booking-uuid",
  "amount": 475,
  "currency": "UAH",
  "paymentMethodType": "liqpay"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "payment-uuid",
    "clientSecret": "payment-client-secret",
    "paymentUrl": "https://checkout.liqpay.ua/...",
    "amount": 475,
    "currency": "UAH"
  }
}
```

### Confirm Payment
```http
POST /payments/{paymentIntentId}/confirm
Authorization: Bearer <token>
```

### Get Payment Details
```http
GET /payments/{paymentId}
Authorization: Bearer <token>
```

### Get User Payments
```http
GET /payments/user/payments
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: Payment status
- `type`: Payment type
- `fromDate`: Start date
- `toDate`: End date
- `page`: Page number
- `limit`: Items per page

### Process Refund (Admin)
```http
POST /payments/{paymentId}/refund
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "amount": 475,
  "reason": "Service cancellation"
}
```

### Get Specialist Earnings
```http
GET /payments/specialist/earnings
Authorization: Bearer <token>
```

**Query Parameters:**
- `fromDate`: Start date
- `toDate`: End date

### Get Payment Methods
```http
GET /payments/methods
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentMethods": [
      {
        "id": "liqpay",
        "name": "LiqPay",
        "nameUk": "LiqPay",
        "nameRu": "LiqPay",
        "icon": "💳",
        "currencies": ["UAH", "USD", "EUR"],
        "description": "Pay with Visa, Mastercard, or Privat24"
      }
    ]
  }
}
```

## Messaging System

### Get Conversations
```http
GET /messages/conversations
Authorization: Bearer <token>
```

### Create Conversation
```http
POST /messages/conversations
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "participantId": "user-uuid",
  "bookingId": "booking-uuid",
  "initialMessage": "Hi, I have a question about my booking"
}
```

### Get Conversation Messages
```http
GET /messages/conversations/{conversationId}/messages
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number
- `limit`: Messages per page
- `before`: Message ID to load messages before

### Send Message
```http
POST /messages/conversations/{conversationId}/messages
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "content": "Hello, when should I arrive?",
  "messageType": "TEXT",
  "attachments": ["file1.jpg", "file2.pdf"]
}
```

### Mark Messages as Read
```http
POST /messages/conversations/{conversationId}/read
Authorization: Bearer <token>
```

## Review System

### Create Review
```http
POST /reviews
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "bookingId": "booking-uuid",
  "rating": 5,
  "comment": "Excellent service! Very professional and punctual.",
  "tags": ["professional", "punctual", "friendly"]
}
```

### Get Reviews for Specialist
```http
GET /reviews/specialist/{specialistId}
```

**Query Parameters:**
- `page`: Page number
- `limit`: Reviews per page
- `rating`: Filter by rating

### Get Reviews for Service
```http
GET /reviews/service/{serviceId}
```

### Update Review
```http
PUT /reviews/{reviewId}
Authorization: Bearer <token>
```

### Delete Review
```http
DELETE /reviews/{reviewId}
Authorization: Bearer <token>
```

### Get Review Statistics
```http
GET /reviews/specialist/{specialistId}/stats
```

## File Upload

### Upload File
```http
POST /files/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: File to upload
- `purpose`: avatar | service_image | portfolio | message_attachment | document
- `entityType`: Optional entity type
- `entityId`: Optional entity ID

**Response:**
```json
{
  "success": true,
  "data": {
    "file": {
      "id": "file-uuid",
      "filename": "image.jpg",
      "originalName": "my-photo.jpg",
      "mimeType": "image/jpeg",
      "size": 1024000,
      "url": "https://cdn.miyzapis.com/files/avatar/image.jpg",
      "thumbnails": [
        {
          "size": "150x150",
          "url": "https://cdn.miyzapis.com/files/avatar/thumbnails/image_thumb.jpg"
        }
      ]
    }
  }
}
```

### Get File
```http
GET /files/{fileId}
Authorization: Bearer <token>
```

### Delete File
```http
DELETE /files/{fileId}
Authorization: Bearer <token>
```

### Generate Upload URL (Direct Upload)
```http
POST /files/upload-url
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "filename": "image.jpg",
  "contentType": "image/jpeg",
  "purpose": "avatar"
}
```

## Notification System

### Get User Notifications
```http
GET /notifications
Authorization: Bearer <token>
```

**Query Parameters:**
- `isRead`: Filter by read status
- `type`: Notification type
- `page`: Page number
- `limit`: Items per page

### Mark Notification as Read
```http
POST /notifications/{notificationId}/read
Authorization: Bearer <token>
```

### Mark All Notifications as Read
```http
POST /notifications/read-all
Authorization: Bearer <token>
```

### Update Notification Preferences
```http
PUT /notifications/preferences
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "emailNotifications": true,
  "pushNotifications": true,
  "telegramNotifications": true,
  "notificationTypes": {
    "BOOKING_CONFIRMED": true,
    "BOOKING_CANCELLED": true,
    "NEW_MESSAGE": true,
    "PAYMENT_RECEIVED": true
  }
}
```

### Get Notification Preferences
```http
GET /notifications/preferences
Authorization: Bearer <token>
```

## Admin Endpoints

### Get Dashboard Statistics
```http
GET /admin/dashboard/stats
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `period`: 7d | 30d | 90d | 1y

### Get User Analytics
```http
GET /admin/analytics/users
Authorization: Bearer <admin-token>
```

### Get Booking Analytics
```http
GET /admin/analytics/bookings
Authorization: Bearer <admin-token>
```

### Get Financial Analytics
```http
GET /admin/analytics/financial
Authorization: Bearer <admin-token>
```

### Manage Users
```http
POST /admin/users/manage
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "action": "activate",
  "userIds": ["user1-uuid", "user2-uuid"]
}
```

### Get System Health
```http
GET /admin/system/health
Authorization: Bearer <admin-token>
```

### Get Audit Logs
```http
GET /admin/audit-logs
Authorization: Bearer <admin-token>
```

## WebSocket Events

Connect to: `wss://api.miyzapis.com/socket.io/?token=<jwt-token>`

### Client Events

#### Join Conversation
```json
{
  "event": "join_conversation",
  "data": {
    "conversationId": "conversation-uuid"
  }
}
```

#### Send Message
```json
{
  "event": "send_message",
  "data": {
    "conversationId": "conversation-uuid",
    "content": "Hello!",
    "messageType": "TEXT",
    "attachments": []
  }
}
```

#### Typing Indicators
```json
{
  "event": "typing_start",
  "data": {
    "conversationId": "conversation-uuid"
  }
}
```

```json
{
  "event": "typing_stop",
  "data": {
    "conversationId": "conversation-uuid"
  }
}
```

#### Subscribe to Booking Updates
```json
{
  "event": "subscribe_booking",
  "data": {
    "bookingId": "booking-uuid"
  }
}
```

### Server Events

#### Message Received
```json
{
  "event": "message_received",
  "data": {
    "message": {
      "id": "message-uuid",
      "content": "Hello!",
      "messageType": "TEXT",
      "createdAt": "2024-03-10T10:00:00.000Z",
      "sender": {
        "id": "user-uuid",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  }
}
```

#### Booking Updated
```json
{
  "event": "booking_updated",
  "data": {
    "bookingId": "booking-uuid",
    "status": "CONFIRMED",
    "updatedAt": "2024-03-10T10:00:00.000Z"
  }
}
```

#### User Typing
```json
{
  "event": "user_typing",
  "data": {
    "userId": "user-uuid",
    "conversationId": "conversation-uuid",
    "typing": true
  }
}
```

#### Notification
```json
{
  "event": "notification",
  "data": {
    "id": "notification-uuid",
    "type": "BOOKING_CONFIRMED",
    "title": "Booking Confirmed",
    "message": "Your booking has been confirmed",
    "createdAt": "2024-03-10T10:00:00.000Z"
  }
}
```

## Webhook Endpoints

### LiqPay Webhook
```http
POST /payments/webhook/liqpay
Content-Type: application/x-www-form-urlencoded
```

### Monobank Webhook
```http
POST /payments/webhook/monobank
Content-Type: application/json
```

### Telegram Webhook
```http
POST /webhook/telegram
Content-Type: application/json
```

## Rate Limits

| Endpoint Group | Requests per 15 minutes |
|----------------|--------------------------|
| Authentication | 10 requests |
| General API | 1000 requests |
| File Upload | 50 requests |
| Admin | 500 requests |

## Pagination

All list endpoints support pagination with these query parameters:

- `page`: Page number (starting from 1)
- `limit`: Items per page (max 100)

Response includes pagination metadata:

```json
{
  "success": true,
  "data": {
    "items": []
  },
  "meta": {
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## Internationalization

All text responses support multiple languages via the `Accept-Language` header:

- `en`: English (default)
- `uk`: Ukrainian
- `ru`: Russian

Example:
```http
Accept-Language: uk
```

## Data Types

### User Types
- `CUSTOMER`: Regular users who book services
- `SPECIALIST`: Service providers
- `ADMIN`: Platform administrators

### Booking Statuses
- `PENDING`: Awaiting specialist approval
- `PENDING_PAYMENT`: Requires payment
- `CONFIRMED`: Confirmed and paid
- `IN_PROGRESS`: Service is being performed
- `COMPLETED`: Service completed
- `CANCELLED`: Booking cancelled
- `REFUNDED`: Payment refunded

### Payment Statuses
- `PENDING`: Payment initiated
- `PROCESSING`: Payment being processed
- `SUCCEEDED`: Payment completed successfully
- `FAILED`: Payment failed
- `CANCELLED`: Payment cancelled
- `REFUNDED`: Payment refunded

### Message Types
- `TEXT`: Plain text message
- `IMAGE`: Image attachment
- `FILE`: File attachment
- `SYSTEM`: System-generated message

## Security

### Headers
- `X-Request-ID`: Unique request identifier
- `X-User-Agent`: Client identification
- `X-Real-IP`: Client IP address (for rate limiting)

### Input Validation
- All inputs are validated and sanitized
- SQL injection protection via Prisma ORM
- XSS protection via input sanitization
- CSRF protection via SameSite cookies

### Authentication Security
- JWT tokens with short expiration (15 minutes)
- Refresh token rotation
- Password hashing with bcrypt
- Multi-platform authentication support

## SDKs and Libraries

### JavaScript/TypeScript
```bash
npm install @miyzapis/api-client
```

### Usage Example
```javascript
import { MiyZapisClient } from '@miyzapis/api-client';

const client = new MiyZapisClient({
  apiUrl: 'https://api.miyzapis.com/api/v1',
  accessToken: 'your-jwt-token'
});

// Create a booking
const booking = await client.bookings.create({
  serviceId: 'service-uuid',
  scheduledAt: new Date('2024-03-15T14:00:00.000Z'),
  duration: 60
});
```

## Support

- **Documentation**: https://docs.miyzapis.com
- **API Status**: https://status.miyzapis.com
- **Support Email**: api-support@miyzapis.com
- **Discord**: https://discord.gg/miyzapis

---

*Last updated: March 2024*