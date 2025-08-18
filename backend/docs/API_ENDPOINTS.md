# МійЗапис/МояЗапись API Documentation

## Base URL
- Development: `http://localhost:3000/api/v1`
- Production: `https://your-domain.com/api/v1`

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## API Endpoints

### Authentication Endpoints

#### POST /auth/register
Register a new user (customer or specialist)
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "Іван",
  "lastName": "Петренко",
  "userType": "CUSTOMER", // or "SPECIALIST"
  "phoneNumber": "+380123456789",
  "language": "uk" // uk, ru, en
}
```

#### POST /auth/login
Login user
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST /auth/refresh
Refresh JWT token
```json
{
  "refreshToken": "refresh_token_here"
}
```

#### POST /auth/forgot-password
Request password reset
```json
{
  "email": "user@example.com"
}
```

#### POST /auth/reset-password
Reset password with token
```json
{
  "token": "reset_token",
  "newPassword": "newpassword123"
}
```

#### POST /auth/verify-email
Verify email address
```json
{
  "token": "verification_token"
}
```

#### POST /auth/telegram
Authenticate via Telegram
```json
{
  "telegramId": "123456789",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "photoUrl": "https://...",
  "authDate": 1234567890,
  "hash": "telegram_hash"
}
```

### User Management

#### GET /users/profile
Get current user profile

#### PUT /users/profile
Update user profile
```json
{
  "firstName": "Іван",
  "lastName": "Петренко",
  "phoneNumber": "+380123456789",
  "language": "uk",
  "timezone": "Europe/Kiev"
}
```

#### POST /users/upload-avatar
Upload user avatar (multipart/form-data)

#### PUT /users/settings
Update user preferences
```json
{
  "emailNotifications": true,
  "pushNotifications": true,
  "telegramNotifications": true,
  "currency": "UAH"
}
```

### Specialist Management

#### POST /specialists/profile
Create specialist profile
```json
{
  "businessName": "Студія краси Анна",
  "bio": "Професійний майстер з 5-річним досвідом",
  "specialties": ["hair", "makeup", "nails"],
  "address": "вул. Хрещатик, 1",
  "city": "Київ",
  "country": "України",
  "workingHours": {
    "monday": {"start": "09:00", "end": "18:00"},
    "tuesday": {"start": "09:00", "end": "18:00"}
  }
}
```

#### GET /specialists/profile/:id
Get specialist profile

#### PUT /specialists/profile
Update specialist profile

#### POST /specialists/upload-portfolio
Upload portfolio images

#### GET /specialists
Search specialists
- Query params: `category`, `city`, `rating`, `page`, `limit`

#### GET /specialists/:id/reviews
Get specialist reviews

#### GET /specialists/:id/availability
Get specialist availability

#### POST /specialists/availability
Set availability blocks
```json
{
  "blocks": [
    {
      "startDateTime": "2024-01-15T09:00:00Z",
      "endDateTime": "2024-01-15T18:00:00Z",
      "isAvailable": true,
      "isRecurring": true,
      "recurringDays": ["monday", "tuesday"]
    }
  ]
}
```

### Service Management

#### GET /services
Get services with filters
- Query params: `category`, `specialist`, `minPrice`, `maxPrice`, `duration`, `page`, `limit`

#### GET /services/:id
Get service details

#### POST /services
Create new service (specialists only)
```json
{
  "name": "Стрижка жіноча",
  "description": "Професійна жіноча стрижка",
  "categoryId": "category_id",
  "basePrice": 500,
  "currency": "UAH",
  "duration": 60,
  "requirements": ["clean hair"],
  "deliverables": ["styled hair"],
  "images": ["image_url_1", "image_url_2"]
}
```

#### PUT /services/:id
Update service

#### DELETE /services/:id
Delete service

#### POST /services/upload-images
Upload service images

### Category Management

#### GET /categories
Get service categories (with translations)

#### GET /categories/:id
Get category details

#### GET /categories/:id/services
Get services in category

### Booking Management

#### POST /bookings
Create new booking
```json
{
  "serviceId": "service_id",
  "specialistId": "specialist_id",
  "scheduledAt": "2024-01-15T14:00:00Z",
  "customerNotes": "Додаткові побажання",
  "promoCodeId": "promo_code_id"
}
```

#### GET /bookings
Get user bookings
- Query params: `status`, `fromDate`, `toDate`, `page`, `limit`

#### GET /bookings/:id
Get booking details

#### PUT /bookings/:id/status
Update booking status
```json
{
  "status": "CONFIRMED",
  "specialistNotes": "Підтверджую запис"
}
```

#### POST /bookings/:id/cancel
Cancel booking
```json
{
  "reason": "Emergency cancellation"
}
```

#### PUT /bookings/:id/reschedule
Reschedule booking
```json
{
  "newDateTime": "2024-01-16T14:00:00Z",
  "reason": "Client request"
}
```

### Payment Management

#### POST /payments/create-intent
Create payment intent
```json
{
  "bookingId": "booking_id",
  "amount": 500,
  "currency": "UAH",
  "paymentMethodType": "card"
}
```

#### POST /payments/confirm
Confirm payment
```json
{
  "paymentIntentId": "pi_123",
  "paymentMethodId": "pm_123"
}
```

#### POST /payments/webhook/stripe
Stripe webhook endpoint

#### GET /payments/:id
Get payment details

#### POST /payments/refund
Request refund
```json
{
  "paymentId": "payment_id",
  "amount": 500,
  "reason": "Service not provided"
}
```

### Review Management

#### POST /reviews
Create review
```json
{
  "bookingId": "booking_id",
  "rating": 5,
  "comment": "Чудовий сервіс!",
  "tags": ["professional", "punctual", "friendly"]
}
```

#### GET /reviews
Get reviews
- Query params: `specialistId`, `customerId`, `rating`, `page`, `limit`

#### GET /reviews/:id
Get review details

#### PUT /reviews/:id
Update review

#### DELETE /reviews/:id
Delete review

#### POST /reviews/:id/report
Report inappropriate review

### Messaging System

#### GET /conversations
Get user conversations

#### GET /conversations/:id
Get conversation details with messages

#### POST /conversations
Start new conversation
```json
{
  "participantId": "user_id",
  "bookingId": "booking_id", // optional
  "initialMessage": "Привіт! У мене є запитання щодо послуги."
}
```

#### POST /conversations/:id/messages
Send message
```json
{
  "content": "Повідомлення",
  "messageType": "TEXT",
  "attachments": ["file_url"]
}
```

#### PUT /conversations/:id/mark-read
Mark conversation as read

#### POST /conversations/:id/archive
Archive conversation

### File Management

#### POST /files/upload
Upload file (multipart/form-data)
- Query params: `purpose` (avatar, service_image, message_attachment, etc.)

#### GET /files/:id
Get file details

#### DELETE /files/:id
Delete file

### Notification Management

#### GET /notifications
Get user notifications
- Query params: `type`, `isRead`, `page`, `limit`

#### PUT /notifications/:id/read
Mark notification as read

#### PUT /notifications/mark-all-read
Mark all notifications as read

#### PUT /notifications/preferences
Update notification preferences
```json
{
  "emailNotifications": true,
  "pushNotifications": true,
  "telegramNotifications": false,
  "notificationTypes": {
    "booking_created": true,
    "booking_confirmed": true,
    "payment_received": true
  }
}
```

### Analytics (Specialists Only)

#### GET /analytics/dashboard
Get dashboard analytics

#### GET /analytics/bookings
Get booking analytics
- Query params: `fromDate`, `toDate`, `groupBy` (day, week, month)

#### GET /analytics/revenue
Get revenue analytics

#### GET /analytics/reviews
Get review analytics

#### GET /analytics/response-time
Get response time analytics

### Loyalty Program

#### GET /loyalty/balance
Get loyalty points balance

#### GET /loyalty/transactions
Get loyalty transactions history

#### POST /loyalty/redeem
Redeem loyalty points
```json
{
  "points": 100,
  "bookingId": "booking_id"
}
```

### Promo Codes

#### POST /promo-codes/validate
Validate promo code
```json
{
  "code": "SAVE20",
  "bookingAmount": 500
}
```

#### GET /promo-codes/my
Get user's available promo codes

### Reports

#### POST /reports
Report user/service/review
```json
{
  "entityType": "USER",
  "entityId": "user_id",
  "reason": "inappropriate_content",
  "description": "Опис проблеми"
}
```

### FAQ

#### GET /faq
Get frequently asked questions
- Query params: `category`, `language`

### Admin Endpoints (Admin only)

#### GET /admin/users
Get all users with filters

#### PUT /admin/users/:id/status
Update user status

#### GET /admin/bookings
Get all bookings with filters

#### GET /admin/payments
Get all payments with filters

#### GET /admin/reports
Get all reports

#### PUT /admin/reports/:id/resolve
Resolve report

#### GET /admin/analytics
Get platform analytics

## WebSocket Events

### Connection
```javascript
const socket = io('ws://localhost:3000', {
  auth: {
    token: 'jwt_token_here'
  }
});
```

### Events

#### Join Room
```javascript
socket.emit('join_conversation', { conversationId: 'conversation_id' });
```

#### Send Message
```javascript
socket.emit('send_message', {
  conversationId: 'conversation_id',
  content: 'Message content',
  messageType: 'TEXT'
});
```

#### Message Received
```javascript
socket.on('message_received', (data) => {
  // Handle new message
});
```

#### Typing Indicators
```javascript
socket.emit('typing_start', { conversationId: 'conversation_id' });
socket.emit('typing_stop', { conversationId: 'conversation_id' });

socket.on('user_typing', (data) => {
  // Show typing indicator
});
```

#### Booking Updates
```javascript
socket.on('booking_updated', (data) => {
  // Handle booking status change
});
```

#### Notification Events
```javascript
socket.on('notification', (data) => {
  // Handle real-time notification
});
```

## Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456"
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Request validation failed
- `AUTHENTICATION_ERROR` - Invalid or missing authentication
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

## Rate Limiting

- Authentication endpoints: 5 requests per minute
- File upload endpoints: 10 requests per minute
- Search endpoints: 100 requests per minute
- Default: 1000 requests per hour per IP

## Pagination

Paginated endpoints return:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Internationalization

All endpoints support Ukrainian, Russian, and English:
- Send `Accept-Language: uk` header
- Text content is returned in requested language
- Error messages are localized