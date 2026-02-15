# Multi-stage build for production
FROM public.ecr.aws/docker/library/node:18.20.4-alpine3.20 AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM public.ecr.aws/docker/library/node:18.20.4-alpine3.20 AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S botuser -u 1001

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=botuser:nodejs /app/dist ./dist

# Set environment
ENV NODE_ENV=production

# Switch to non-root user
USER botuser

# Expose port
EXPOSE 3001

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
