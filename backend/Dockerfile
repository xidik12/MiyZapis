# Multi-stage build for production
FROM public.ecr.aws/docker/library/node:18.20.4-alpine3.20 AS builder

# Install OpenSSL for Prisma binary generation
RUN apk add --no-cache openssl-dev openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma client with correct binary targets
ENV PRISMA_CLI_BINARY_TARGETS="linux-musl-openssl-3.0.x"
RUN npx prisma generate

# Build the application
RUN npm run build

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM public.ecr.aws/docker/library/node:18.20.4-alpine3.20 AS production

# Install dumb-init and OpenSSL for Prisma compatibility
RUN apk add --no-cache dumb-init openssl-dev openssl

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/healthcheck.js ./healthcheck.js

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
