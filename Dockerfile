FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* yarn.lock* ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# ── Runtime stage ──────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y \
    chromium \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libgtk-3-0 \
    libnss3 \
    libxss1 \
    libasound2 \
    xvfb \
    x11-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/* || \
    (apt-get update && apt-get install -y \
    chromium \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libgtk-3-0 \
    libnss3 \
    libxss1 \
    libasound2t64 \
    xvfb \
    x11-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*)

ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV DISPLAY=:99

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY start.sh ./start.sh
RUN chmod +x start.sh

RUN mkdir -p /app/saved-tabs && \
    ln -sf /usr/bin/chromium /usr/bin/chromium-browser && \
    ln -sf /usr/bin/chromium /usr/bin/google-chrome

EXPOSE 3005

CMD ["/bin/bash", "start.sh"]
