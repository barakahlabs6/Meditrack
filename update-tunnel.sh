#!/bin/bash

NEW_URL=$1

if [ -z "$NEW_URL" ]; then
  echo "Usage: ./update-tunnel.sh https://your-new-url.trycloudflare.com"
  exit 1
fi

echo "Updating tunnel URL to: $NEW_URL"

# 1. Update netlify.toml
cat > netlify.toml << EOF
[build]
  base = "apps/desktop"
  command = "npm run build"
  publish = "out"

[build.environment]
  NEXT_PUBLIC_API_URL = "$NEW_URL"
EOF

# 2. Update API .env
cat > apps/api/.env << EOF
PORT=4000
JWT_SECRET=change-this-to-a-long-random-string-later
ALLOWED_ORIGINS=http://localhost:3000,https://meditrackks.netlify.app,$NEW_URL
EOF

# 3. Restart API
pkill -f tsx 2>/dev/null
sleep 1
nohup npm run dev --prefix apps/api < /dev/null > apps/api/server.log 2>&1 &
sleep 3
echo "API status: $(curl -s http://localhost:4000/health)"

# 4. Commit and push
git add netlify.toml apps/api/.env
git commit -m "update tunnel URL to $NEW_URL"
git push origin main

echo "Done! Netlify will redeploy automatically."
