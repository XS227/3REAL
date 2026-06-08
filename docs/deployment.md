# Deployment Guide — 3REAL

**Stack:** Next.js 16 · PM2 · Nginx · PostgreSQL  
**Phase:** 10.5 — VPS deployment, no domain required for first run

---

## Prerequisites

On the VPS:
- Node.js 20+ (`node --version`)
- npm 10+ (`npm --version`)
- PM2 installed globally (`npm install -g pm2`)
- Nginx installed (`nginx -v`)
- PostgreSQL 14+ running with a database and user created
- Git repository cloned to `/var/www/3real`

---

## 1. First-Time Setup

### 1.1 Clone and configure environment

```bash
cd /var/www
git clone <repo-url> 3real
cd 3real
cp .env.example .env    # if .env.example exists; otherwise create .env manually
```

Edit `.env` with production values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/threereal_db?schema=public"
JWT_SECRET="<output of: openssl rand -base64 64>"
JWT_EXPIRES_IN="7d"
NEXT_PUBLIC_APP_URL="http://<YOUR_SERVER_IP>"
NODE_ENV="production"
```

**Never commit `.env` to git.**

### 1.2 Create PM2 log directory

```bash
mkdir -p /var/log/pm2
```

### 1.3 Run the first deploy

```bash
bash deploy/deploy.sh
```

This will:
1. Pull latest code
2. Install production dependencies (`--omit=dev`)
3. Run Prisma migrations (`prisma migrate deploy`)
4. Generate Prisma client
5. Build the Next.js app (`npm run build`)
6. Start the app via PM2 on port `3010`
7. Save the PM2 process list

### 1.4 Enable PM2 startup on reboot

```bash
pm2 startup
# Run the command it outputs (e.g. sudo env PATH=... pm2 startup ...)
pm2 save
```

---

## 2. Running on IP (No Domain)

After the first deploy the app is listening on `localhost:3010`. To reach it from the browser, install the Nginx config:

```bash
cp deploy/nginx-3real.conf /etc/nginx/sites-available/3real
ln -sf /etc/nginx/sites-available/3real /etc/nginx/sites-enabled/3real

# Remove the default site if it occupies port 80
rm -f /etc/nginx/sites-enabled/default

nginx -t              # verify config is valid
systemctl reload nginx
```

The app will now be reachable at `http://<YOUR_SERVER_IP>/`.

> **Note:** `deploy/nginx-3real.conf` uses `server_name _` (catch-all). This means any HTTP request hitting port 80 on this VPS is forwarded to the Next.js app. If you need to host multiple sites later, replace `_` with the explicit hostname before adding other server blocks.

---

## 3. Subsequent Deploys

Once set up, every future deploy is a single command:

```bash
cd /var/www/3real
npm run deploy
```

Or directly:

```bash
bash deploy/deploy.sh
```

PM2 uses `pm2 reload` (not restart) — there is **no downtime**. The old process continues serving until the new one is ready.

---

## 4. Adding a Domain

When DNS is pointing `3real.no` → your server IP:

### 4.1 Update Nginx server_name

Edit `/etc/nginx/sites-available/3real`:

```nginx
# Change this line:
server_name _;

# To:
server_name 3real.no www.3real.no;
```

### 4.2 Update NEXT_PUBLIC_APP_URL

In `/var/www/3real/.env`:

```env
NEXT_PUBLIC_APP_URL="https://3real.no"
```

### 4.3 Issue TLS certificate with Certbot

```bash
apt install certbot python3-certbot-nginx   # if not installed
certbot --nginx -d 3real.no -d www.3real.no
```

Certbot will:
- Verify DNS ownership
- Issue a Let's Encrypt certificate
- Modify the Nginx config to add HTTPS and an HTTP→HTTPS redirect
- Auto-renew via a cron job

### 4.4 Reload and redeploy

```bash
nginx -t && systemctl reload nginx
bash deploy/deploy.sh      # rebuilds with new NEXT_PUBLIC_APP_URL
```

---

## 5. Health Check Endpoint

The app exposes `GET /api/health` which pings the database and returns:

```json
{
  "status": "ok",
  "app": "3real",
  "version": "1.0.0",
  "timestamp": "2026-06-08T12:00:00.000Z",
  "services": {
    "database": { "status": "ok", "latency_ms": 2 }
  }
}
```

HTTP 200 = healthy. HTTP 503 = database unreachable.

### Test it

```bash
# Via curl on the VPS
curl http://localhost:3010/api/health

# Via Nginx (from outside the VPS)
curl http://<YOUR_SERVER_IP>/api/health

# Expect:
# {"status":"ok","app":"3real","version":"1.0.0", ...}
```

### Automated monitoring (optional)

```bash
# Simple cron-based check every 5 minutes — alerts to a file
*/5 * * * * curl -sf http://localhost:3010/api/health || echo "$(date) 3REAL DOWN" >> /var/log/3real-health.log
```

---

## 6. PM2 Commands

```bash
# Process status
pm2 status

# Real-time logs (all output)
pm2 logs 3real

# Last 200 lines
pm2 logs 3real --lines 200

# Error log only
pm2 logs 3real --err

# Restart the process (hard restart, brief downtime)
pm2 restart 3real

# Reload with zero downtime
pm2 reload 3real

# Stop the process
pm2 stop 3real

# Remove from PM2 list
pm2 delete 3real

# Show CPU/memory usage
pm2 monit
```

Log files are at:
- Stdout: `/var/log/pm2/3real-out.log`
- Stderr: `/var/log/pm2/3real-error.log`

---

## 7. Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Random 64-byte base64 string (`openssl rand -base64 64`) |
| `JWT_EXPIRES_IN` | No | Token expiry (default: `7d`) |
| `NEXT_PUBLIC_APP_URL` | Yes | Full public URL (affects email verification links) |
| `NODE_ENV` | Yes | Must be `production` in prod |

---

## 8. Troubleshooting

**Port 3010 already in use:**
```bash
lsof -i :3010
pm2 delete 3real
pm2 start ecosystem.config.js --env production
```

**Build fails (out of memory on small VPS):**
```bash
# Add swap if not present
fallocate -l 2G /swapfile && chmod 600 /swapfile
mkswap /swapfile && swapon /swapfile
# Then retry the build
npm run build
```

**Migrations fail:**
```bash
# Check DB connectivity
psql "$DATABASE_URL" -c "SELECT version();"
# Run migrations manually
npx prisma migrate deploy
```

**Next.js can't connect to DB at runtime:**
```bash
# Confirm .env is present and DATABASE_URL is correct
cat /var/www/3real/.env
# PM2 must be started with --env production to pick up env_production block
pm2 restart 3real --update-env
```

**Nginx 502 Bad Gateway:**
```bash
# Check if Next.js is actually running
pm2 status
curl http://localhost:3010/api/health   # should return 200
# If not running, start it:
pm2 start ecosystem.config.js --env production
```
