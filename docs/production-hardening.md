# Production Hardening Guide — 3REAL

**Phase:** 12 — Private Beta Readiness  
**Date:** 2026-06-08

---

## 1. Security headers

### Next.js application headers (`next.config.ts`)

Applied to every route via the `headers()` export:

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | See below | Restricts resource loading |
| `X-Frame-Options` | `SAMEORIGIN` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer leakage |
| `Permissions-Policy` | camera=(), microphone=(), etc. | Disables unused browser features |

CSP directives (current — private beta level):

```
default-src 'self'
script-src 'self' 'unsafe-inline'      ← Next.js hydration requires this
style-src 'self' 'unsafe-inline'
font-src 'self' data:
img-src 'self' data: blob: https:
connect-src 'self' wss:
media-src 'none'
object-src 'none'
frame-src 'none'
frame-ancestors 'none'
base-uri 'self'
form-action 'self'
upgrade-insecure-requests
```

**TODO post-beta:** Migrate to nonce-based CSP to eliminate `unsafe-inline` on `script-src`. This requires generating a per-request nonce in `proxy.ts` and threading it through the page HTML.

### Nginx headers (`/etc/nginx/sites-available/3real.setaei.com`)

Additional headers set at the nginx layer (defense in depth):

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
```

### Verify headers

```bash
curl -sI https://3real.setaei.com/ | grep -E "Content-Security|X-Frame|X-Content|Referrer|Permissions|Strict"
```

---

## 2. Error handling

Three layers of error handling are in place:

| File | Scope | Behavior |
|------|-------|---------|
| `app/not-found.tsx` | All 404s | Branded 404 with navigation links |
| `app/error.tsx` | Route-level exceptions | Try-again button, logs `error.digest` |
| `app/global-error.tsx` | Root layout crashes | Minimal branded page with refresh |

Error digests are logged to PM2 stdout. Cross-reference `error.digest` values in:

```bash
pm2 logs 3real --lines 500 | grep "app-error\|global-error"
```

---

## 3. Logging

### PM2 log rotation

Install the PM2 log-rotate module:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 20M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
pm2 set pm2-logrotate:rotateInterval '0 3 * * *'
pm2 save
```

Log files:

| File | Contents |
|------|---------|
| `/var/log/pm2/3real-out.log` | Application stdout (JSON structured logs) |
| `/var/log/pm2/3real-error.log` | Application stderr + crash output |

### Structured application logs

`lib/logger.ts` emits JSON lines to stdout. PM2 captures these. Example output:

```json
{"ts":"2026-06-08T12:00:00.000Z","level":"info","msg":"deposit.approved","txId":"abc123","amount":500}
{"ts":"2026-06-08T12:01:00.000Z","level":"error","msg":"ledger entry failed","userId":"xyz","err":"INSUFFICIENT_BALANCE"}
```

Usage in server-side code:

```typescript
import { logger } from "@/lib/logger";
logger.info("deposit.approved", { txId, amount, userId });
logger.error("unexpected DB failure", { err: error.message });
```

### View logs

```bash
# Live tail
pm2 logs 3real

# Last 200 lines
pm2 logs 3real --lines 200

# Error log only
pm2 logs 3real --err

# Search by action
grep "deposit.approved" /var/log/pm2/3real-out.log | tail -20

# Error digest lookup
grep "abc12345" /var/log/pm2/3real-out.log
```

### Admin audit log

A full paginated audit log is available at `/admin/audit-log`. It shows every `ActivityLog` entry with actor, target, IP address, and metadata. Entries are sorted newest-first, 50 per page.

---

## 4. Monitoring

### Health check endpoint

`GET /api/health` returns application and database status:

```bash
curl https://3real.setaei.com/api/health
# {"status":"ok","app":"3real","version":"1.0.0","services":{"database":{"status":"ok","latency_ms":2}}}
```

HTTP 200 = healthy. HTTP 503 = database unreachable.

### Uptime monitoring (free options)

| Service | Setup | Alert on |
|---------|-------|---------|
| [UptimeRobot](https://uptimerobot.com) | Add HTTP(S) monitor for `https://3real.setaei.com/api/health` | Non-200 response |
| [Better Uptime](https://betterstack.com/uptime) | Same | Non-200 + response body check |
| Cron-based | See below | Log alert |

Cron-based self-monitoring:

```bash
# /etc/cron.d/3real-health
*/5 * * * * root curl -sf https://3real.setaei.com/api/health > /dev/null \
  || echo "$(date -Iseconds) 3REAL DOWN" >> /var/log/3real-health.log
```

### Disk space check

```bash
# App + uploads
du -sh /var/www/3real/
du -sh /var/www/3real/storage/uploads/
du -sh /var/www/3real/.next/

# Backups
du -sh /var/backups/3real/

# OS disk
df -h /

# PM2 logs
du -sh /var/log/pm2/
```

Warning thresholds for private beta:
- `/` disk > 80% used → add storage or clean up
- `/var/log/pm2/3real-out.log` > 500 MB without rotation → configure pm2-logrotate

### Memory and CPU check

```bash
# PM2 summary
pm2 status
pm2 monit

# System-level
free -h
top -bn1 | grep "Mem\|Cpu"

# 3real process specifically
ps aux | grep "next"
```

### PM2 process watchdog

If the process crashes more than 10 times (`max_restarts: 10` in `ecosystem.config.js`), PM2 stops restarting it. Check with:

```bash
pm2 status
# If status shows "errored", check logs then:
pm2 reset 3real
pm2 reload 3real --update-env
```

---

## 5. Environment review

See `docs/private-beta-checklist.md` for the full pre-launch checklist.

### Required `.env` values for production

```env
DATABASE_URL="postgresql://threereal:STRONG_PASSWORD@localhost:5432/threereal_db?schema=public"
JWT_SECRET="<64-byte base64: openssl rand -base64 64>"
JWT_EXPIRES_IN="7d"
NEXT_PUBLIC_APP_URL="https://3real.setaei.com"
NODE_ENV="production"
```

### JWT_SECRET entropy check

Minimum 32 characters enforced at runtime. Generate a secure value:

```bash
openssl rand -base64 64
```

The app will throw at startup if `JWT_SECRET` is shorter than 32 characters.

### Database password

The default dev password `threereal_dev_pass` must be changed before opening to beta users:

```bash
psql -U postgres -c "ALTER USER threereal WITH PASSWORD 'NEW_STRONG_PASSWORD';"
# Update DATABASE_URL in /var/www/3real/.env
pm2 reload 3real --update-env
```

### Admin account

The seed creates a `super_admin` with a default password. Change it immediately:

```bash
# Via the forgot-password flow — enter the admin email, follow the reset link
# Or directly via the API:
curl -X POST https://3real.setaei.com/api/auth/forgot-password \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@3real.setaei.com"}'
```

---

## 6. TLS / Certificate renewal

Certificate: `/etc/letsencrypt/live/3real.setaei.com/fullchain.pem`  
Expires: 2026-09-06  
Auto-renewal: managed by `certbot.timer` (runs twice daily)

Post-renewal nginx reload hook:

```bash
cat > /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh << 'EOF'
#!/bin/bash
service nginx reload
EOF
chmod +x /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh
```

Test renewal:

```bash
certbot renew --dry-run
```

Check certificate expiry:

```bash
echo | openssl s_client -connect 3real.setaei.com:443 -servername 3real.setaei.com 2>/dev/null \
  | openssl x509 -noout -dates
```

---

## 7. Rate limiting

Rate limits are in-memory (`lib/rate-limit.ts`) — they reset on process restart. This is acceptable for private beta with low user counts.

**Post-beta:** Migrate to Redis-backed rate limiting (e.g. `rate-limiter-flexible` with `ioredis`) for multi-instance deployments and crash resilience.

Current limits (requests per window):
- `POST /api/auth/login` — 10 per 15 min per IP
- `POST /api/auth/register` — 5 per 15 min per IP
- `POST /api/auth/forgot-password` — 3 per 15 min per IP

---

## 8. Content Security Policy — tightening roadmap

| Phase | Action | Impact |
|-------|--------|--------|
| Beta | `script-src 'self' 'unsafe-inline'` | Blocks XSS from external scripts |
| Post-beta | Nonce-based CSP via proxy.ts | Eliminates inline script risk |
| Post-beta | `script-src 'nonce-{random}'` | No `unsafe-inline` needed |
| Future | Report-only CSP endpoint | Catches violations before enforcement |
