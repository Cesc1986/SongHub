#!/bin/bash
set -e

echo "[start.sh] Cleaning up stale Xvfb lock files..."
rm -f /tmp/.X99-lock /tmp/.X11-unix/X99 2>/dev/null || true

echo "[start.sh] Starting Xvfb..."
Xvfb :99 -screen 0 1280x1024x24 -ac +extension GLX +render -noreset &
XVFB_PID=$!

# Wait until Xvfb is actually ready
for i in $(seq 1 20); do
    if xdpyinfo -display :99 >/dev/null 2>&1; then
        echo "[start.sh] Xvfb ready after ${i}s"
        break
    fi
    sleep 1
done

export DISPLAY=:99
echo "[start.sh] DISPLAY=$DISPLAY"

echo "[start.sh] Starting Next.js on port 3005..."
exec npx next start -p 3005
