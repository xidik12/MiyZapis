# 🚀 MiyZapis - Multi-Platform Booking System

A comprehensive multi-platform booking system with **Website**, **Telegram Bot**, and **Telegram Mini App** - all connected to a unified backend API.

## 🌟 Features

### 🎯 **Multi-Platform Access**
- **🌐 Web Application**: Full-featured React website
- **🤖 Telegram Bot**: Interactive bot with commands and inline keyboards  
- **📱 Mini App**: Native-like experience inside Telegram

### ⚡ **Core Functionality**
- 👤 **User Management**: Registration, authentication, profiles
- 🔍 **Service Discovery**: Browse categories, search specialists
- 📅 **Booking System**: Create, manage, modify appointments
- 💬 **Real-time Messaging**: Chat between customers and specialists
- 💰 **Payment Processing**: Secure payments with Stripe
- ⭐ **Reviews & Ratings**: Customer feedback system
- 📊 **Analytics Dashboard**: Business insights for specialists
- 🌍 **Multi-language**: English, Ukrainian, Russian support
- 🎨 **Dark/Light Themes**: User preference themes

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │  Telegram Bot   │    │   Mini App      │
│     (React)     │    │   (Node.js)     │    │    (React)      │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │              ┌───────┴───────┐              │
          │              │   WebSocket   │              │
          │              │  (Real-time)  │              │
          └──────────────┼───────────────┼──────────────┘
                         │               │
                    ┌────┴───────────────┴────┐
                    │    Backend API          │
                    │   (Node.js/Express)     │
                    │                         │
                    │  ┌─────────┐ ┌────────┐ │
                    │  │ Prisma  │ │ Redis  │ │
                    │  │   ORM   │ │ Cache  │ │
                    │  └─────────┘ └────────┘ │
                    └─────────┬───────────────┘
                              │
                    ┌─────────┴───────────┐
                    │   PostgreSQL        │
                    │    Database         │
                    └─────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis server
- Telegram Bot Token

### 1. Clone Repository
```bash
git clone https://github.com/xidik12/MiyZapis.git
cd MiyZapis
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file
npm run migrate
npm run seed
npm run dev
```

### 3. Setup Website
```bash
cd ../
npm install
npm run dev
```

### 4. Setup Telegram Bot
```bash
cd telegram-bot
npm install
cp .env.example .env
# Add your BOT_TOKEN
npm run dev
```

### 5. Setup Mini App
```bash
cd ../mini-app
npm install
npm run dev
```

## 🌐 Deployment

### Option 1: Railway + Vercel (Recommended)
- **Backend & Bot**: Deploy to Railway
- **Website & Mini App**: Deploy to Vercel
- **Total Time**: ~30 minutes
- **Cost**: $0-15/month

### Option 2: DigitalOcean Droplet
- **All services**: Single VPS deployment
- **Total Time**: ~2 hours  
- **Cost**: $12+/month

📖 **Full deployment instructions**: See `DEPLOYMENT_GUIDE.md`

## 📱 Platform Features

### Web Application
- ✅ Responsive design for all devices
- ✅ Progressive Web App (PWA) capabilities
- ✅ Advanced search and filtering
- ✅ Real-time notifications
- ✅ Payment processing with Stripe
- ✅ Admin dashboard for specialists

### Telegram Bot Commands
```
/start - 🚀 Initialize bot
/bookings - 📅 View bookings  
/services - 🔍 Browse services
/specialists - 👥 Find specialists
/search - 🔍 Text search
/profile - 👤 User profile
/settings - ⚙️ Bot settings
/earnings - 💰 Earnings (specialists)
/analytics - 📊 Analytics (specialists)
/help - ❓ Get help
```

### Mini App Features
- ✅ Native Telegram integration
- ✅ WebApp APIs usage
- ✅ Haptic feedback
- ✅ Theme integration
- ✅ Payment integration
- ✅ Offline support

## 🛠️ Tech Stack

### Frontend
- **React 18** + TypeScript
- **Tailwind CSS** for styling
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Axios** for API calls
- **React Hook Form** for forms
- **Framer Motion** for animations

### Backend
- **Node.js** + **Express.js**
- **TypeScript** for type safety
- **Prisma ORM** for database operations
- **PostgreSQL** for data storage
- **Redis** for caching and sessions
- **Socket.io** for real-time features
- **JWT** for authentication
- **Stripe** for payments

### Telegram Integration
- **Telegraf** framework for bot
- **Telegram WebApp APIs** for mini app
- **Multi-language** support
- **Inline keyboards** and rich interactions

### DevOps & Deployment
- **Railway** for hosting (backend/bot)
- **Vercel** for hosting (frontend)
- **GitHub Actions** for CI/CD
- **Docker** support included
- **PM2** for process management

## 📊 Database Schema

### Core Entities
- **Users**: Customer and specialist accounts
- **Services**: Service offerings with pricing
- **Bookings**: Appointment scheduling
- **Reviews**: Rating and feedback system
- **Messages**: Real-time chat system
- **Payments**: Transaction records
- **Analytics**: Business metrics

## 🔐 Security Features

- 🔒 **JWT Authentication** with refresh tokens
- 🛡️ **Rate limiting** to prevent abuse
- 🔐 **Input validation** and sanitization
- 🚫 **CORS protection** for API access
- 🔑 **Environment-based** configuration
- 📝 **Audit logging** for sensitive operations

## 📈 Performance Optimizations

- ⚡ **Redis caching** for frequently accessed data
- 🗂️ **Database indexing** for fast queries
- 📦 **Code splitting** for faster load times
- 🖼️ **Image optimization** with Sharp
- 📊 **Connection pooling** for database
- 🔄 **Background job processing** with Bull

## 🌍 Internationalization

- **3 Languages**: English, Ukrainian, Russian
- **Dynamic switching** without page reload
- **Telegram bot** multi-language support
- **Date/time localization**
- **Currency formatting**

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests  
npm test

# E2E tests
npm run test:e2e
```

## 📄 API Documentation

- **OpenAPI/Swagger** documentation available
- **Postman collection** included
- **Authentication** examples provided
- **Error handling** documented

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 **Documentation**: Check `DEPLOYMENT_GUIDE.md`
- 🐛 **Issues**: GitHub Issues tab
- 💬 **Discussions**: GitHub Discussions
- 📧 **Email**: support@bookingbot.com

## 🎯 Roadmap

- [ ] **Mobile Apps** (React Native)
- [ ] **Video Calling** integration
- [ ] **Advanced Analytics** with charts
- [ ] **Multi-tenant** support
- [ ] **API rate limiting** per user
- [ ] **Advanced notifications** system
- [ ] **Webhook integrations**

---

**⭐ Star this repository if you found it helpful!**

**🚀 Built with ❤️ for the modern booking industry**