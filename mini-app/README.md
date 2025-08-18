# Booking Platform - Telegram Mini App

A comprehensive Telegram Mini App for the booking platform that provides seamless integration with Telegram's native features while delivering a rich web-app experience.

## Features

### Core Functionality
- **Full Booking Platform**: Complete service discovery, booking, and management
- **Telegram Integration**: Native Telegram UI, theme support, and haptic feedback
- **Real-time Synchronization**: Live updates via WebSocket integration
- **Telegram Payments**: Secure payment processing using Telegram's payment system
- **Authentication**: Seamless login using Telegram user data
- **Multi-platform Support**: Optimized for mobile, desktop, and web Telegram clients

### Key Components
- **Service Discovery**: Browse and search for services and specialists
- **Booking Flow**: Complete booking process with calendar integration
- **Payment Processing**: Telegram Payments and Stripe integration
- **Real-time Updates**: Live booking status updates and notifications
- **User Dashboard**: Booking history, favorites, and profile management
- **Theme Adaptation**: Automatic theme switching based on Telegram settings

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for styling with Telegram theme variables
- **Telegram WebApp SDK** for native integration
- **Socket.io** for real-time communication
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Framer Motion** for animations

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Telegram Bot Token
- Access to the booking platform backend API

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd booking-platform/mini-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure the following variables:
   ```env
   VITE_API_URL=http://localhost:3001/api/v1
   VITE_APP_ENV=development
   VITE_DEBUG_MODE=true
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

### Telegram Bot Setup

1. **Create a new bot** with @BotFather
2. **Set bot commands**:
   ```
   start - Start using the booking platform
   book - Make a new booking
   bookings - View your bookings
   help - Get help and support
   ```

3. **Configure Mini App**:
   ```bash
   /setmenubutton
   # Set the mini app URL: https://your-domain.com
   ```

4. **Set webhook** (for production):
   ```bash
   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
   -H "Content-Type: application/json" \
   -d '{"url":"https://your-api-domain.com/api/telegram/webhook"}'
   ```

## Development

### Project Structure
```
src/
├── components/          # Reusable components
│   ├── auth/           # Authentication components
│   ├── booking/        # Booking-related components
│   ├── common/         # Common/shared components
│   ├── layout/         # Layout components
│   ├── telegram/       # Telegram-specific components
│   └── ui/             # UI components
├── hooks/              # Custom React hooks
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   ├── booking/        # Booking pages
│   ├── customer/       # Customer pages
│   └── shared/         # Shared pages
├── services/           # API and service layers
├── styles/             # CSS and styling
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - Run TypeScript checks

### Telegram WebApp Development

1. **Use ngrok** for local development:
   ```bash
   ngrok http 3001
   ```

2. **Set the mini app URL** in @BotFather to your ngrok URL

3. **Test in Telegram**:
   - Open your bot in Telegram
   - Use the menu button or send /start
   - The mini app should open in Telegram's web view

### Theme Integration

The app automatically adapts to Telegram's theme:

```typescript
// Access theme colors
const theme = useTelegramTheme();

// Use Telegram CSS variables
className="bg-tg-bg text-tg-text"

// Apply theme programmatically
theme.setCustomTheme({
  bg_color: '#ffffff',
  text_color: '#000000'
});
```

## Deployment

### GitHub Pages (Simple Deployment)

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Deploy to GitHub Pages**:
   ```bash
   npm run deploy
   ```

### Docker Deployment

1. **Build and run with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

2. **Environment variables** in `.env`:
   ```env
   DOMAIN=yourdomain.com
   POSTGRES_PASSWORD=your_postgres_password
   REDIS_PASSWORD=your_redis_password
   JWT_SECRET=your_jwt_secret
   TELEGRAM_BOT_TOKEN=your_bot_token
   STRIPE_SECRET_KEY=your_stripe_key
   ACME_EMAIL=your@email.com
   ```

### Production Deployment

#### AWS S3 + CloudFront
```bash
# Build
npm run build

# Deploy to S3
aws s3 sync dist/ s3://your-bucket --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

#### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## Configuration

### Telegram WebApp Settings

Configure your bot with @BotFather:

1. **Menu Button**:
   ```
   /setmenubutton
   @your_bot_name
   text: 📅 Book Service
   url: https://your-miniapp-domain.com
   ```

2. **Bot Description**:
   ```
   Professional service booking platform. Book appointments, manage your schedule, and discover local specialists - all within Telegram.
   ```

3. **Bot Commands**:
   ```
   start - 🚀 Start using the booking platform
   book - 📅 Make a new booking
   mybookings - 📋 View your bookings
   search - 🔍 Search for services
   profile - 👤 Manage your profile
   help - ❓ Get help and support
   ```

### Environment Variables

#### Development
```env
NODE_ENV=development
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
VITE_DEBUG_WEBSOCKET=true
VITE_MOCK_TELEGRAM_API=true
```

#### Production
```env
NODE_ENV=production
VITE_API_URL=https://api.yourdomain.com/api
VITE_WS_URL=wss://api.yourdomain.com
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_OFFLINE_MODE=true
```

## API Integration

The mini app communicates with the backend API:

```typescript
// Authentication
const { user, login, logout } = useTelegram();

// WebSocket connection
const { isConnected, subscribe } = useWebSocket();

// Real-time bookings
const { bookings, updateBookingStatus } = useRealTimeBookings();
```

### WebSocket Events

- `booking_updated` - Booking status changes
- `booking_confirmed` - Booking confirmation
- `booking_cancelled` - Booking cancellation
- `payment_completed` - Payment success
- `new_message` - Chat messages
- `specialist_online` - Specialist availability

## Testing

### Manual Testing Checklist

1. **Authentication Flow**
   - [ ] Telegram login works
   - [ ] User data is retrieved correctly
   - [ ] JWT tokens are stored securely

2. **Booking Flow**
   - [ ] Service discovery works
   - [ ] Calendar integration functions
   - [ ] Payment processing completes
   - [ ] Booking confirmation received

3. **Real-time Features**
   - [ ] WebSocket connection establishes
   - [ ] Live updates are received
   - [ ] Notifications appear correctly

4. **Telegram Integration**
   - [ ] Theme adapts to Telegram
   - [ ] Haptic feedback works
   - [ ] Main button functions correctly
   - [ ] Back button navigation works

### Automated Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# E2E tests (if configured)
npm run test:e2e
```

## Performance Optimization

### Bundle Size Optimization
- Code splitting by route
- Dynamic imports for heavy components
- Tree shaking for unused code
- Compression and minification

### Runtime Performance
- React.memo for expensive components
- useCallback and useMemo for optimization
- Virtual scrolling for large lists
- Image lazy loading

### Network Optimization
- Service Worker for caching
- API response caching
- WebSocket connection pooling
- Progressive loading

## Security

### Data Protection
- JWT token secure storage
- API request encryption
- Input validation and sanitization
- XSS and CSRF protection

### Telegram Security
- InitData validation
- Bot token protection
- Payment data encryption
- User data privacy

## Monitoring

### Analytics Integration
```typescript
// Track user events
analytics.track('booking_created', {
  serviceId: booking.serviceId,
  amount: booking.amount
});

// Monitor performance
performance.mark('booking-flow-start');
```

### Error Tracking
```typescript
// Global error handling
window.addEventListener('error', (error) => {
  logger.error('Mini app error:', error);
});
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper TypeScript types
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- 📧 Email: support@yourdomain.com
- 💬 Telegram: @your_support_bot
- 📚 Documentation: https://docs.yourdomain.com
- 🐛 Issues: GitHub Issues

## Changelog

### v1.0.0
- Initial release
- Telegram WebApp integration
- Complete booking flow
- Payment processing
- Real-time synchronization
- Theme adaptation