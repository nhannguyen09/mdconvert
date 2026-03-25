#!/bin/bash
# deploy.sh — deploy mdconvert to your VPS
# Run from local: bash deploy/deploy.sh
# Requires: .env.production exists at project root

set -e

# ─── Configure these for your server ─────────────────────────────────────────
VPS_IP="${VPS_IP:-your-server-ip}"
VPS_PORT="${VPS_PORT:-22}"
VPS_USER="${VPS_USER:-root}"
APP_DIR="${APP_DIR:-/var/www/mdconvert}"
PM2_NAME="${PM2_NAME:-mdconvert}"
APP_URL="${APP_URL:-https://your-domain.com}"
# ─────────────────────────────────────────────────────────────────────────────

echo "=== [1/6] Check .env.production ==="
if [ ! -f ".env.production" ]; then
  echo "❌ Missing .env.production. Create it before deploying."
  exit 1
fi

echo "=== [2/6] Upload .env.production to VPS ==="
scp -P "$VPS_PORT" .env.production "$VPS_USER@$VPS_IP:$APP_DIR/.env.production"

echo "=== [3/6] SSH into VPS and deploy ==="
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_IP" << ENDSSH
set -e
APP_DIR="$APP_DIR"
PM2_NAME="$PM2_NAME"

cd \$APP_DIR

echo "--- Pull latest code ---"
git pull origin main

echo "--- Install dependencies ---"
npm ci --omit=dev

echo "--- Prisma generate + migrate ---"
npx prisma generate
npx prisma migrate deploy

echo "--- Build Next.js ---"
npm run build

echo "--- Create uploads/outputs directories ---"
mkdir -p uploads outputs

echo "--- Restart PM2 ---"
pm2 restart \$PM2_NAME || pm2 start npm --name \$PM2_NAME -- start
pm2 save

echo "--- PM2 status ---"
pm2 status

ENDSSH

echo ""
echo "✅ Deploy complete! $APP_URL"
