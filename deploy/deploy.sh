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

log() { echo "$LOG_PREFIX $(date '+%H:%M:%S') $*" >&2; }
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

# ── 5. Stop the app before building ───────────────────────────────────────────
# This box has 957M RAM. Building while the live PM2 process is also running
# caused memory contention severe enough to OOM-kill / SIGABRT the build
# (V8 heap abort during the TS-check phase) and to trigger involuntary PM2
# restarts of the live app mid-build. Stopping it first frees that memory and
# removes the race entirely — a short, controlled downtime instead of random
# crashes on both sides.
WAS_RUNNING=0
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
    WAS_RUNNING=1
    log "Stopping $APP_NAME (PM2) before build to free memory..."
    pm2 stop "$APP_NAME" > /dev/null
    log "App stopped."
else
    log "No existing PM2 process named $APP_NAME — nothing to stop."
fi

# Back up the current build output instead of just deleting it, so a failed
# build can be rolled back to a known-good previous build rather than leaving
# the app with no .next directory to start from at all.
if [ -d .next ]; then
    log "Backing up current build output to .next.bak..."
    rm -rf .next.bak
    mv .next .next.bak
fi

# ── 6. Build Next.js (always — never conditional on .next existing) ─────────
# Forced to webpack, not Turbopack: Turbopack build reliably fails on this box
# with ENOENT on a _buildManifest.js.tmp write (reproduced twice, same step),
# correlated with an NFT-trace warning from app/api/kyc/files/[...path]/route.ts.
# `next build --webpack` builds the same app cleanly with no such failure.
log "Build started (NODE_OPTIONS=--max-old-space-size=1536, webpack)..."
BUILD_OK=1
NODE_OPTIONS="--max-old-space-size=1536" npx next build --webpack || BUILD_OK=0

if [ "$BUILD_OK" -ne 1 ]; then
    log "Build FAILED."

    if [ -d .next.bak ]; then
        log "Restoring previous build output from .next.bak..."
        rm -rf .next
        mv .next.bak .next
    else
        log "WARNING: no previous build backup available — app may fail to start."
    fi

    if [ "$WAS_RUNNING" -eq 1 ]; then
        log "Restarting previous PM2 process so the app is not left down..."
        if pm2 restart "$APP_NAME" --update-env > /dev/null 2>&1; then
            log "App restarted on the previous build."
        else
            log "WARNING: failed to restart $APP_NAME after build failure — app may be down."
        fi
    else
        log "App was not previously running — nothing to restart."
    fi
    pm2 save > /dev/null 2>&1 || true

    fail "Build failed — deployed code NOT updated. Previous version restored where possible."
fi

log "Build succeeded."
rm -rf .next.bak
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
log "Build complete at $BUILD_TIME"

# ── 7. Ensure PM2 log directory exists ───────────────────────────────────────
mkdir -p /var/log/pm2

# ── 8. Start/restart via PM2 (always a real restart, not just reload) ────────
log "Restarting PM2 process with new build..."
if [ "$WAS_RUNNING" -eq 1 ]; then
    pm2 restart "$APP_NAME" --update-env
else
    pm2 start ecosystem.config.js --env production
fi
log "App restarted."

# ── 9. Persist PM2 process list across reboots ───────────────────────────────
pm2 save

# ── 10. Post-deploy verification ──────────────────────────────────────────────
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
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "http://127.0.0.1:$PORT$path" || echo "000")
    log "  $path -> HTTP $code"
    echo "$code"
}

HOME_CODE=$(check_route "/")
STATUS_CODE=$(check_route "/status")
TERMS_CODE=$(check_route "/terms")
PRIVACY_CODE=$(check_route "/privacy")
HEALTH_CODE=$(check_route "/api/health")

FAILED=0
[ "$HOME_CODE" = "200" ]    || { log "  FAIL: / did not return 200 (got $HOME_CODE)"; FAILED=1; }
[ "$STATUS_CODE" = "200" ]  || { log "  FAIL: /status did not return 200 (got $STATUS_CODE) — check it's not redirecting to login"; FAILED=1; }
[ "$TERMS_CODE" = "200" ]   || { log "  FAIL: /terms did not return 200 (got $TERMS_CODE)"; FAILED=1; }
[ "$PRIVACY_CODE" = "200" ] || { log "  FAIL: /privacy did not return 200 (got $PRIVACY_CODE)"; FAILED=1; }
[ "$HEALTH_CODE" = "200" ]  || { log "  FAIL: /api/health did not return 200 (got $HEALTH_CODE)"; FAILED=1; }

if [ "$FAILED" -ne 0 ]; then
    log "Verification FAILED."
    fail "Post-deploy verification failed — see failures above. Do not consider this deploy successful."
fi

log "Verification passed."
log "Done. App is running on port $PORT ($DOMAIN)."
log "Check status: pm2 status"
log "Tail logs:    pm2 logs $APP_NAME"
