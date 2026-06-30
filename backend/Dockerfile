# Multi-stage build for production
FROM node:18-alpine AS builder

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
FROM node:18-alpine AS production

# Install dumb-init, OpenSSL (Prisma), and Noto fonts + fontconfig so sharp/librsvg
# can render Cyrillic (and Khmer) text in generated share cards.
RUN apk add --no-cache dumb-init openssl-dev openssl fontconfig font-noto font-noto-extra && fc-cache -f

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

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Start: apply any pending migrations, then run the server. The DB is baselined
# (migrate status = up to date on all envs), so this is a no-op today and only
# applies genuinely NEW migrations on future deploys. A failing migration fails
# the boot by design (fail-fast) rather than running against a half-migrated DB.
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]