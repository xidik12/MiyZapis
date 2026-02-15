# Dockerfile for Telegram Mini App
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build arguments for Vite (baked into static bundle)
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_APP_ENV=production
ARG VITE_DEBUG_MODE=false
ARG VITE_GOOGLE_CLIENT_ID

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_APP_ENV=$VITE_APP_ENV
ENV VITE_DEBUG_MODE=$VITE_DEBUG_MODE
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build

# Production stage — nginx serving static files
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx-template.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Default PORT (Railway overrides this)
ENV PORT=80

ENTRYPOINT ["/docker-entrypoint.sh"]
