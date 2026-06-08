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

cd "$APP_DIR" || fail "Cannot cd to $APP_DIR"

# ── 1. Pull latest code ───────────────────────────────────────────────────────
log "Pulling latest code..."
git pull origin main

# ── 2. Install production dependencies ───────────────────────────────────────
log "Installing dependencies..."
npm install --omit=dev

# ── 3. Run database migrations ───────────────────────────────────────────────
log "Running Prisma migrations..."
npx prisma migrate deploy

# ── 4. Generate Prisma client ─────────────────────────────────────────────────
log "Generating Prisma client..."
npx prisma generate

# ── 5. Build Next.js ──────────────────────────────────────────────────────────
log "Building Next.js application..."
npm run build

# ── 6. Ensure PM2 log directory exists ───────────────────────────────────────
mkdir -p /var/log/pm2

# ── 7. Start or reload via PM2 ───────────────────────────────────────────────
log "Reloading PM2 process..."
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
    # Process already exists — reload with zero downtime (SIGINT + restart)
    pm2 reload "$APP_NAME" --update-env
else
    # First deploy — start fresh
    pm2 start ecosystem.config.js --env production
fi

# ── 8. Persist PM2 process list across reboots ───────────────────────────────
pm2 save

log "Done. App is running on port 3010."
log "Check status: pm2 status"
log "Tail logs:    pm2 logs $APP_NAME"
