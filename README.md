# BookingBot Platform

A comprehensive booking platform with frontend, backend, mini-app, and telegram bot components.

## Project Structure

```
BookingBot/
├── frontend/          # React frontend application
├── backend/           # Node.js backend API
├── mini-app/         # Telegram Mini App
├── telegram-bot/     # Telegram Bot
└── README.md         # This file
```

## Deployment

### Frontend Deployment (Railway)
Deploy the `frontend/` directory:
- Build command: `npm run build` 
- Start command: `npm start`
- Root directory: `frontend/`

### Backend Deployment (Railway)  
Deploy the `backend/` directory:
- Build command: `npm run build`
- Start command: `npm start`
- Root directory: `backend/`

### Mini App Deployment
Deploy the `mini-app/` directory:
- Build command: `npm run build`
- Start command: `npm start`
- Root directory: `mini-app/`

## Development

Each component has its own package.json and can be developed independently:

```bash
# Frontend development
cd frontend && npm install && npm run dev

# Backend development  
cd backend && npm install && npm run dev

# Mini App development
cd mini-app && npm install && npm run dev

# Telegram Bot development
cd telegram-bot && npm install && npm run dev
```

## Features

- 🎨 Modern React frontend with TypeScript
- 🚀 Express.js backend with TypeScript  
- 📱 Telegram Mini App integration
- 🤖 Telegram Bot for notifications
- 🔐 JWT authentication
- 💳 Stripe payment integration
- 🗄️ PostgreSQL database with Prisma ORM
- 📊 Real-time analytics and reporting
- 🌐 Multi-language support (EN, UK, RU)
- 📱 PWA support
- 🎯 Responsive design optimized for mobile