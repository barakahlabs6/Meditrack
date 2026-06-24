#!/bin/bash
sleep 15
TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/tunnel.log | head -1)
if [ -z "$TUNNEL_URL" ]; then
  sleep 10
  TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/tunnel.log | head -1)
fi
echo "New tunnel URL: $TUNNEL_URL"
cd /home/alexis/portfolio-app
./update-tunnel.sh $TUNNEL_URL
