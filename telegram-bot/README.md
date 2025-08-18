# Booking Platform Telegram Bot

A comprehensive Telegram bot for the booking platform that allows users to browse specialists, book appointments, manage bookings, and more through Telegram.

## Features

- 🌍 **Multi-language Support** (English, Ukrainian, Russian)
- 👥 **Browse Specialists** by category and location
- 📅 **Book Appointments** with real-time availability
- 📱 **Manage Bookings** (view, reschedule, cancel)
- 📍 **Location-based Search** for nearby specialists
- 💬 **Interactive Chat Interface** with inline keyboards
- 🔔 **Session Management** with automatic cleanup
- 📊 **Analytics and Logging** for monitoring
- 🛡️ **Rate Limiting** and error handling

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Telegram Bot Token (from @BotFather)
- Running booking platform API backend

## Installation

1. **Clone and navigate to the bot directory:**
   ```bash
   cd telegram-bot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   ```env
   BOT_TOKEN=your_telegram_bot_token_here
   API_BASE_URL=http://localhost:8000
   NODE_ENV=development
   PORT=3001
   LOG_LEVEL=info
   ```

## Getting Bot Token

1. Message @BotFather on Telegram
2. Send `/newbot` command
3. Follow instructions to create your bot
4. Copy the bot token to your `.env` file

## Development

**Start the bot in development mode:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
```

**Start production server:**
```bash
npm start
```

## Bot Commands

- `/start` - Initialize bot and show main menu
- `/help` - Show help and available commands  
- `/bookings` - View your current bookings
- `/profile` - View and edit your profile
- `/settings` - Change language and preferences
- `/location` - Share location to find nearby specialists
- `/cancel` - Cancel current operation

## Bot Flow

### Main Menu
- 🔍 Browse Services
- 📅 My Bookings  
- 👤 My Profile
- ❓ Help & Support

### Booking Process
1. **Category Selection** - Choose service category
2. **Specialist Browse** - View specialists in category
3. **Specialist Profile** - View details, services, reviews
4. **Service Selection** - Choose specific service
5. **Date Selection** - Pick available date
6. **Time Selection** - Choose available time slot
7. **Booking Confirmation** - Review and confirm
8. **Payment** (if required)
9. **Confirmation** - Booking created successfully

### Location Features
- Share location to find nearby specialists
- 5km radius search by default
- Sort by distance and rating

## API Integration

The bot integrates with the booking platform API:

- **User Management** - Create/update Telegram users
- **Specialists** - Browse, search, get details
- **Services** - Get by specialist, categories
- **Bookings** - Create, view, update, cancel
- **Availability** - Real-time slot checking
- **Reviews** - View specialist reviews

## Architecture

```
src/
├── config/           # Configuration management
├── types/            # TypeScript type definitions  
├── locales/          # Multi-language translations
├── services/         # Core services (API, session)
├── handlers/         # Message and callback handlers
├── middleware/       # Bot middleware (auth, logging, etc.)
├── utils/            # Utilities (keyboards, formatters, logger)
└── index.ts          # Main bot entry point
```

## Session Management

- In-memory sessions for development
- 24-hour session expiry
- User language preferences
- Booking flow state management
- Automatic cleanup of expired sessions

## Error Handling

- Comprehensive error logging
- Graceful error recovery
- API connection failure handling
- Rate limiting protection
- User-friendly error messages

## Deployment

### Development
Uses polling to receive updates from Telegram.

### Production 
Uses webhooks for better performance:

1. Set `WEBHOOK_URL` in environment
2. Configure SSL certificate
3. Set webhook with Telegram API
4. Deploy to hosting provider

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

## Monitoring

The bot includes comprehensive logging:
- Request/response tracking
- User interaction analytics  
- Error monitoring
- Performance metrics
- Session statistics

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## License

MIT License - see LICENSE file for details