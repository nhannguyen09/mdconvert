#!/bin/bash
# setup-vps.sh — run once on a fresh VPS
# SSH into your VPS, then run: bash setup-vps.sh
# Requirements: Node 20+, PM2, Pandoc, Ghostscript installed

set -e

# ─── Configure these ─────────────────────────────────────────────────────────
APP_DIR="${APP_DIR:-/var/www/mdconvert}"
PM2_NAME="${PM2_NAME:-mdconvert}"
REPO="${REPO:-https://github.com/nhannguyen09/mdconvert.git}"
DOMAIN="${DOMAIN:-your-domain.com}"
# ─────────────────────────────────────────────────────────────────────────────

echo "=== Create app directory ==="
mkdir -p "$APP_DIR"

echo "=== Clone repo ==="
git clone "$REPO" "$APP_DIR" || (cd "$APP_DIR" && git pull)

echo "=== Create required directories ==="
mkdir -p "$APP_DIR/uploads" "$APP_DIR/outputs"

echo "=== Configure Nginx ==="
cp "$APP_DIR/deploy/nginx.conf" "/etc/nginx/sites-available/$DOMAIN"
# Replace placeholder domain in nginx config
sed -i "s/your-domain.com/$DOMAIN/g" "/etc/nginx/sites-available/$DOMAIN"
ln -sf "/etc/nginx/sites-available/$DOMAIN" /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo ""
echo "=== REMAINING STEPS (manual) ==="
echo "1. Copy .env.production to $APP_DIR/.env.production"
echo "2. Get SSL cert: certbot --nginx -d $DOMAIN"
echo "3. Run: cd $APP_DIR && npm ci --omit=dev"
echo "4. Run: npx prisma migrate deploy"
echo "5. Run: npm run build"
echo "6. Run: pm2 start npm --name $PM2_NAME -- start && pm2 save && pm2 startup"
echo "7. Open https://$DOMAIN/setup to create your admin account"
