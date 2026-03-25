# Self-Hosting mdconvert

Three deployment options:

---

## Option 1: Docker (Recommended)

**Requirements:** Docker, Docker Compose

```bash
git clone https://github.com/nhannguyen09/mdconvert.git
cd mdconvert

cp .env.example .env
# Edit .env — set DATABASE_URL, NEXTAUTH_SECRET, ENCRYPTION_KEY, NEXTAUTH_URL

docker compose up -d
```

Open `http://your-server:2023/setup` to create your admin account.

To update:

```bash
git pull
docker compose down
docker compose up -d --build
```

---

## Option 2: VPS — Ubuntu 22.04

### 1. Install dependencies

```bash
sudo apt update && sudo apt install -y pandoc ghostscript nodejs npm postgresql nginx certbot python3-certbot-nginx
sudo npm install -g pm2
```

### 2. Set up PostgreSQL

```bash
sudo -u postgres psql -c "CREATE USER mdconvert WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "CREATE DATABASE mdconvert OWNER mdconvert;"
```

### 3. Clone and configure

```bash
git clone https://github.com/nhannguyen09/mdconvert.git /var/www/mdconvert
cd /var/www/mdconvert
npm install
cp .env.example .env
# Edit .env
npx prisma migrate deploy
npm run build
```

### 4. Start with PM2

```bash
pm2 start npm --name mdconvert -- start
pm2 save
pm2 startup
```

### 5. Nginx + SSL

```bash
# Copy and edit the example config
sudo cp deploy/nginx.conf /etc/nginx/sites-available/mdconvert
sudo ln -s /etc/nginx/sites-available/mdconvert /etc/nginx/sites-enabled/
# Edit the config: replace YOUR_DOMAIN and port
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.com
```

---

## Option 3: Vercel (Limited)

**Warning:** Vercel does not support Pandoc or Ghostscript CLI tools. Only PDF conversion via pure AI (without Ghostscript compression) will work. DOCX conversion is not supported.

```bash
# Deploy via Vercel CLI
npm install -g vercel
vercel --prod
```

Set all environment variables in the Vercel dashboard. Use Vercel Postgres or an external PostgreSQL service (e.g. Supabase, Neon) for `DATABASE_URL`.

For full functionality (DOCX + PDF), use Docker or VPS deployment.
