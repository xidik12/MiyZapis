# Robust, version-independent setup: Debian slim + system Chromium.
FROM node:22-bookworm-slim

# Chromium + the fonts/libs it needs to render real pages headless.
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium \
      fonts-liberation fonts-noto-core fonts-noto-color-emoji \
      ca-certificates dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Puppeteer uses the system Chromium; never download its own.
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    PORT=3000

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY server.js ./

EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
