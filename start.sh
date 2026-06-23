#!/bin/bash

echo "Starting MediTrack..."

cd "$(dirname "$0")"

# 1. Kill any existing processes
pkill -f tsx 2>/dev/null
pkill -f cloudflared 2>/dev/null
sleep 1

# 2. Start API
nohup npm run dev --prefix apps/api < /dev/null > apps/api/server.log 2>&1 &
echo "Waiting for API..."
sleep 4
echo "API status: $(curl -s http://localhost:4000/health)"

# 3. Start tunnel and capture URL
cloudflared tunnel --url http://localhost:4000 > /tmp/tunnel.log 2>&1 &
echo "Waiting for tunnel..."
sleep 8

TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/tunnel.log | head -1)

if [ -z "$TUNNEL_URL" ]; then
  echo "Tunnel URL not found, waiting longer..."
  sleep 10
  TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/tunnel.log | head -1)
fi

echo "Tunnel URL: $TUNNEL_URL"

# 4. Update everything and push
./update-tunnel.sh $TUNNEL_URL

echo ""
echo "MediTrack is live!"
echo "Local:   http://localhost:3000"
echo "API:     http://localhost:4000"
echo "Tunnel:  $TUNNEL_URL"
echo "Live:    https://meditrackks.netlify.app"
