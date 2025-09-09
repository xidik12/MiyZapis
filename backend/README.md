# Booking Platform Backend API

A production-ready Node.js/TypeScript backend API for a comprehensive booking platform supporting web applications, Telegram bots, and Telegram mini apps.

## Features

- 🔐 **Authentication & Authorization**: JWT-based auth with refresh tokens, role-based access control
- 💳 **Payment Processing**: Stripe integration with deposit handling and cancellation policies
- 📅 **Booking System**: Real-time availability, booking workflows, cancellation management
- ⭐ **Review System**: Customer reviews and ratings with specialist responses
- 🎯 **Loyalty Program**: Points system with redemption and tier management
- 📱 **Multi-Platform Support**: Web, Telegram bot, and Telegram mini app integration
- 🔄 **Real-time Features**: WebSocket support for live updates and notifications
- 📊 **Analytics**: Comprehensive reporting and metrics for specialists and platform
- 🚀 **Production Ready**: Docker deployment, monitoring, logging, and health checks

## Technology Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with comprehensive middleware
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for sessions and caching
- **Authentication**: JWT with refresh tokens
- **Payments**: Stripe integration
- **Real-time**: Socket.io
- **File Storage**: AWS S3 compatible storage
- **Validation**: Joi and express-validator
- **Security**: Helmet, rate limiting, input sanitization
- **Logging**: Winston with structured logging
- **Testing**: Jest with integration tests
- **Deployment**: Docker with multi-stage builds

## Quick Start

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 13 or higher
- Redis 6 or higher
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd booking-platform-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   
   ⚠️ **IMPORTANT**: This project uses PostgreSQL for ALL environments (development and production). SQLite is never used.
   
   **Quick Setup (macOS with Homebrew):**
   ```bash
   # Run the automated PostgreSQL setup script
   ../setup-local-postgres.sh
   ```
   
   **Manual Setup:**
   ```bash
   # Install PostgreSQL (if not already installed)
   brew install postgresql@15
   brew services start postgresql@15
   
   # Create development database
   createdb bookingbot_dev
   
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npx prisma db push
   
   # Seed database (optional)
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## Environment Variables

Copy `.env.example` to `.env` and configure the following:

### Required Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/booking_platform_dev"
REDIS_URL="redis://localhost:6379"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"

# Stripe
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_stripe_webhook_secret"

# Telegram
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
TELEGRAM_WEBHOOK_URL="https://your-domain.com/api/v1/telegram/webhook"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password"

# AWS S3
AWS_ACCESS_KEY_ID="your_aws_access_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
AWS_S3_BUCKET="booking-platform-uploads"
```

## API Documentation

### Base URL
- Development: `http://localhost:3000/api/v1`
- Production: `https://api.bookingplatform.com/v1`

### Authentication

All authenticated endpoints require an `Authorization` header:
```
Authorization: Bearer <access_token>
```

### Core Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/telegram` - Telegram authentication
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user

#### Users
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `POST /users/avatar` - Upload avatar

#### Specialists
- `GET /specialists/profile` - Get specialist profile
- `PUT /specialists/profile` - Update specialist profile
- `GET /specialists/services` - Get specialist services
- `POST /specialists/services` - Create new service
- `GET /specialists/availability` - Get availability

#### Bookings
- `POST /bookings` - Create booking
- `GET /bookings` - Get user bookings
- `GET /bookings/:id` - Get booking details
- `POST /bookings/:id/confirm` - Confirm booking
- `POST /bookings/:id/complete` - Complete booking
- `DELETE /bookings/:id` - Cancel booking

#### Payments
- `POST /payments/process-deposit` - Process deposit
- `POST /payments/process-full-payment` - Process full payment
- `POST /payments/refund` - Process refund
- `GET /payments/history` - Payment history

### WebSocket Events

Connect to WebSocket at `ws://localhost:3000` with authentication:

```javascript
const socket = io('ws://localhost:3000', {
  auth: { token: 'your_jwt_token' }
});

// Listen for booking updates
socket.on('booking:status_changed', (data) => {
  console.log('Booking updated:', data);
});
```

## Development

### Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:debug        # Start with debugger

# Building
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run migrate          # Run database migrations
npm run db:generate      # Generate Prisma client
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier
```

### Project Structure

```
src/
├── config/             # Configuration files
├── controllers/        # Route controllers
├── middleware/         # Custom middleware
├── routes/            # API routes
├── services/          # Business logic
├── utils/             # Utility functions
├── types/             # TypeScript types
└── server.ts          # Main server file

prisma/
├── schema.prisma      # Database schema
└── migrations/        # Database migrations

tests/
├── unit/              # Unit tests
├── integration/       # Integration tests
└── setup.ts           # Test setup

docker/
├── Dockerfile         # Production container
└── docker-compose.yml # Development environment
```

## Deployment

### Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Run migrations**
   ```bash
   docker-compose exec api npm run migrate:prod
   ```

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set environment variables**
   ```bash
   export NODE_ENV=production
   # Set other required environment variables
   ```

3. **Run database migrations**
   ```bash
   npm run migrate:prod
   ```

4. **Start the server**
   ```bash
   npm start
   ```

### Health Checks

The API includes health check endpoints:

- `GET /health` - Basic health check
- `GET /api/v1/health` - Detailed health check with database and Redis status

## Security

### Implemented Security Measures

- **Helmet.js**: Security headers
- **Rate Limiting**: Redis-based rate limiting
- **Input Validation**: Request validation and sanitization
- **CORS**: Configurable cross-origin requests
- **JWT**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable rounds
- **SQL Injection Prevention**: Prisma ORM with parameterized queries

### Rate Limits

- Authentication: 5 requests per 15 minutes
- Payments: 3 requests per minute
- Bookings: 10 requests per minute
- Default: 100 requests per hour

## Monitoring and Logging

### Logging

- Structured logging with Winston
- Daily rotating log files
- Different log levels for different environments
- Request logging with correlation IDs

### Metrics

Built-in support for:
- Request metrics
- Database performance
- Redis performance
- Business metrics (bookings, revenue, etc.)

## Testing

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Integration tests only
npm run test:e2e
```

### Test Structure

- **Unit Tests**: Test individual functions and services
- **Integration Tests**: Test API endpoints and database interactions
- **E2E Tests**: Test complete user workflows

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Changelog

### v1.0.0
- Initial release
- Complete authentication system
- Booking management
- Payment processing
- Real-time features
- Multi-platform support# Trigger deployment - Thu Sep  4 13:43:38 +07 2025
