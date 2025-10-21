# Multi-stage build for production
FROM node:18.20.4-alpine3.20 AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage - serve with Node.js
FROM node:18.20.4-alpine3.20 AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S vite -u 1001

# Set working directory
WORKDIR /app

# Copy built application and necessary files
COPY --from=builder --chown=vite:nodejs /app/dist ./dist
COPY --from=builder --chown=vite:nodejs /app/package*.json ./
COPY --from=builder --chown=vite:nodejs /app/vite.config.ts ./

# Install only production dependencies (for preview server)
RUN npm ci --only=production && npm cache clean --force

# Switch to non-root user
USER vite

# Expose port
EXPOSE 3000

# Start the application using Vite preview
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "preview"]
