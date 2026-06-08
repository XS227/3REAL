# Deployment Guide — 3REAL

**Stack:** Next.js 16 · PM2 · Nginx · PostgreSQL  
**Phase:** 11 — Live on `https://3real.setaei.com` (TLS via Let's Encrypt)

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
*/5 * * * * curl -sf http://localhost:3020/api/health || echo "$(date) 3REAL DOWN" >> /var/log/3real-health.log
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
curl http://localhost:3020/api/health   # should return 200
# If not running, start it:
pm2 start ecosystem.config.js --env production
```

---

## 9. Phase 10.6 — Subdomain Setup (2026-06-08)

### What changed

| Item | Before | After |
|------|--------|-------|
| 3real port | 3010 (conflicted with another Next.js app) | **3020** |
| `ecosystem.config.js` args | `next start -p 3010` | `next start -p 3020` |
| `ecosystem.config.js` PORT env | 3010 | 3020 |
| Nginx vhost | `deploy/nginx-3real.conf` (template only) | `/etc/nginx/sites-available/3real.setaei.com` (live) |
| Public URL | N/A | `http://3real.setaei.com` |

### nginx SNI architecture on this VPS

This server uses an nginx `stream {}` block in `/etc/nginx/nginx.conf` as a TLS SNI router. All HTTPS traffic hits port 443, nginx reads the SNI hostname, and routes to an internal port (8444–8451) where the real HTTP server listens with SSL + `proxy_protocol`.

3real.setaei.com is **HTTP only** (port 80) and is not in the stream map. It will be added when SSL is configured:

```
# To add SSL for 3real.setaei.com in the future:
# 1. Add to stream map in /etc/nginx/nginx.conf:
#       3real.setaei.com   127.0.0.1:8452;
# 2. Add listener to /etc/nginx/sites-available/3real.setaei.com:
#       listen 127.0.0.1:8452 ssl proxy_protocol;
#       real_ip_header proxy_protocol;
#       set_real_ip_from 127.0.0.1;
# 3. Obtain cert: certbot certonly --webroot -d 3real.setaei.com -w /var/www/3real/public
# 4. Add ssl_certificate lines, nginx -t, service nginx reload
```

### Port map (current)

| Port | Service |
|------|---------|
| 80 | nginx HTTP (all sites) |
| 443 | nginx stream SNI router |
| 3020 | 3real Next.js (this app) |
| 4443 | xray |
| 8444 | shahnameh.setaei.com (SSL backend) |
| 8445 | trustai.no (SSL backend) |
| 8447 | setai.no (SSL backend) |
| 8448 | lashinebeauty.com (SSL backend) |
| 8449 | somi.setai.no (SSL backend) |
| 8450 | stapay.setai.no (SSL backend) |
| 8451 | dadashi.no (SSL backend) |

### nginx config conflict resolved (2026-06-08)

On startup, nginx failed because `dadashi.no` had `listen 443 ssl;` from a Certbot-managed block, conflicting with the stream server's `listen 443`. The fix:

- `dadashi.no`: Changed `listen 443 ssl;` → `listen 127.0.0.1:8451 ssl proxy_protocol;` (same pattern as all other sites)
- `nginx.conf` stream map: Added `dadashi.no → 127.0.0.1:8451` and `www.dadashi.no → 127.0.0.1:8451`
- Site behavior and SSL certificates for dadashi.no are unchanged

This was a dormant conflict (pre-existing since Certbot last ran on dadashi.no) that only surfaced when nginx was fully stopped and restarted.

---

## 10. Phase 11 — SSL / HTTPS Setup (2026-06-08)

### What changed

| Item | Before | After |
|------|--------|-------|
| Protocol | HTTP only | **HTTPS + HTTP→HTTPS redirect** |
| TLS certificate | None | Let's Encrypt (expires 2026-09-06) |
| Stream SNI map | No 3real entry | `3real.setaei.com → 127.0.0.1:8452` |
| Nginx vhost listener | `listen 80` only | `listen 127.0.0.1:8452 ssl proxy_protocol` added |
| `NEXT_PUBLIC_APP_URL` | `http://3real.setaei.com` | `https://3real.setaei.com` |
| HSTS | None | `max-age=63072000; includeSubDomains` |

### Certificate details

```
Domain:  3real.setaei.com
Issuer:  Let's Encrypt R2 / R11
Expires: 2026-09-06
Path:    /etc/letsencrypt/live/3real.setaei.com/
```

Auto-renewal is managed by the Certbot systemd timer (`certbot.timer`). On renewal, certbot will replace the cert files in place; PM2 does not need to be restarted, but nginx must reload to pick up the new cert:

```bash
# Post-renewal hook (add to /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh)
#!/bin/bash
service nginx reload
```

### How cert was obtained

Because this VPS uses a stream SNI proxy, certbot cannot modify the nginx HTTPS config automatically. The `certonly` flag was used to get the cert without touching nginx:

```bash
certbot certonly --nginx -d 3real.setaei.com
```

The HTTPS vhost was then wired manually in `/etc/nginx/sites-available/3real.setaei.com` following the same `listen 127.0.0.1:PORT ssl proxy_protocol` pattern used by all other sites.

### Port map (updated)

| Port | Service |
|------|---------|
| 80 | nginx HTTP (all sites, HTTP→HTTPS redirect) |
| 443 | nginx stream SNI router |
| 3020 | 3real Next.js app |
| 4443 | xray |
| 8444 | shahnameh.setaei.com (SSL backend) |
| 8445 | trustai.no (SSL backend) |
| 8447 | setai.no (SSL backend) |
| 8448 | lashinebeauty.com (SSL backend) |
| 8449 | somi.setai.no (SSL backend) |
| 8450 | stapay.setai.no (SSL backend) |
| 8451 | dadashi.no (SSL backend) |
| **8452** | **3real.setaei.com (SSL backend)** |

### Verification

```bash
# HTTPS health check
curl https://3real.setaei.com/api/health
# → {"status":"ok","app":"3real",...}

# HTTP → HTTPS redirect
curl -sI http://3real.setaei.com/ | grep -E 'HTTP|Location'
# → HTTP/1.1 301 Moved Permanently
# → Location: https://3real.setaei.com/

# Check HSTS header
curl -sI https://3real.setaei.com/ | grep Strict
# → Strict-Transport-Security: max-age=63072000; includeSubDomains

# Verify cert
echo | openssl s_client -connect 3real.setaei.com:443 -servername 3real.setaei.com 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```
