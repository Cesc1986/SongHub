FROM node:20-slim AS builder

WORKDIR /app

# Install Chromium + deps for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libnss3 \
    libxss1 \
    libasound2 \
    xvfb \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Copy package files first for cache efficiency
COPY package.json package-lock.json* yarn.lock* ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source
COPY . .

# Build Next.js
RUN npm run build

# ── Runtime stage ──────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y \
    chromium \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libnss3 \
    libxss1 \
    libasound2 \
    xvfb \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV DISPLAY=:99

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src

# Create saved-tabs directory
RUN mkdir -p /app/saved-tabs

# Expose port
EXPOSE 3005

# Start Xvfb + Next.js
CMD Xvfb :99 -screen 0 1024x768x24 -ac &\
    sleep 1 &&\
    npx next start -p 3005
