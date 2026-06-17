#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# 3REAL deployment script
# Usage: bash deploy/deploy.sh
# Run from: /var/www/3real  (or any directory — script cd's there)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="/var/www/3real"
APP_NAME="3real"
LOG_PREFIX="[deploy]"

log() { echo "$LOG_PREFIX $(date '+%H:%M:%S') $*"; }
fail() { echo "$LOG_PREFIX ERROR: $*" >&2; exit 1; }

PORT="3020"
DOMAIN="https://3real.no"

cd "$APP_DIR" || fail "Cannot cd to $APP_DIR"

# This script ALWAYS rebuilds. There is no skip-build path — every deploy
# pulls, installs, migrates, and runs `npm run build` unconditionally, and
# then verifies the result actually went live. If you need a fast path that
# skips steps, that is a different script; do not add a silent skip here —
# a stale build serving login redirects on public routes is how that bug
# happened before.
log "FORCE_BUILD: always-build mode, no skip path exists in this script."

BEFORE_COMMIT=$(git rev-parse HEAD)

# ── 1. Pull latest code ───────────────────────────────────────────────────────
log "Pulling latest code..."
git pull origin main

AFTER_COMMIT=$(git rev-parse HEAD)
log "Commit: $BEFORE_COMMIT -> $AFTER_COMMIT"

# ── 2. Install dependencies ───────────────────────────────────────────────────
# Full install, including devDependencies: `next build` itself needs
# tailwindcss/@tailwindcss/postcss/typescript, and `prisma generate`/`migrate`
# need the prisma CLI. `--omit=dev` here silently pruned those right before
# the steps that needed them, breaking the build.
log "Installing dependencies..."
npm install

# ── 3. Run database migrations ───────────────────────────────────────────────
log "Running Prisma migrations..."
npx prisma migrate deploy

# ── 4. Generate Prisma client ─────────────────────────────────────────────────
log "Generating Prisma client..."
npx prisma generate

# ── 5. Build Next.js (always — never conditional on .next existing) ──────────
log "Removing any existing build output..."
rm -rf .next
log "Building Next.js application..."
npm run build
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
log "Build complete at $BUILD_TIME"

# ── 6. Ensure PM2 log directory exists ───────────────────────────────────────
mkdir -p /var/log/pm2

# ── 7. Restart via PM2 (always a real restart, not just reload) ──────────────
log "Restarting PM2 process..."
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
    pm2 restart "$APP_NAME" --update-env
else
    pm2 start ecosystem.config.js --env production
fi

# ── 8. Persist PM2 process list across reboots ───────────────────────────────
pm2 save

# ── 9. Post-deploy verification ───────────────────────────────────────────────
log "Running post-deploy verification..."

DEPLOYED_COMMIT=$(git rev-parse --short HEAD)
log "  Deployed commit:    $DEPLOYED_COMMIT"

NEXT_MTIME=$(stat -c "%y" .next 2>/dev/null || echo "MISSING")
log "  .next build mtime:  $NEXT_MTIME"

PM2_UPTIME=$(pm2 jlist | node -e "
  const procs = JSON.parse(require('fs').readFileSync(0, 'utf8'));
  const p = procs.find(p => p.name === '$APP_NAME');
  console.log(p ? new Date(p.pm2_env.pm_uptime).toISOString() : 'NOT FOUND');
")
log "  PM2 process since:  $PM2_UPTIME"

log "  Waiting for server to accept connections..."
for i in $(seq 1 15); do
    if curl -s -o /dev/null --max-time 2 "http://127.0.0.1:$PORT/api/health"; then
        break
    fi
    sleep 1
done

check_route() {
    local path="$1"
    local expect_pattern="$2"
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "http://127.0.0.1:$PORT$path" || echo "000")
    log "  $path -> HTTP $code"
    echo "$code"
}

STATUS_CODE=$(check_route "/status" "")
TERMS_CODE=$(check_route "/terms" "")
PRIVACY_CODE=$(check_route "/privacy" "")

FAILED=0
if [ "$STATUS_CODE" = "307" ] || [ "$STATUS_CODE" = "302" ]; then
    log "  WARNING: /status returned a redirect ($STATUS_CODE) — check it's not redirecting to login."
fi
[ "$TERMS_CODE" = "200" ] || { log "  FAIL: /terms did not return 200 (got $TERMS_CODE)"; FAILED=1; }
[ "$PRIVACY_CODE" = "200" ] || { log "  FAIL: /privacy did not return 200 (got $PRIVACY_CODE)"; FAILED=1; }

if [ "$FAILED" -ne 0 ]; then
    fail "Post-deploy verification failed — see warnings/failures above. Do not consider this deploy successful."
fi

log "Done. App is running on port $PORT ($DOMAIN)."
log "Check status: pm2 status"
log "Tail logs:    pm2 logs $APP_NAME"
