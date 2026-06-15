#!/usr/bin/env bash
# Uploads backup — archives storage/uploads/ to /var/backups/3real/uploads/
# Run via cron: 0 4 * * * /var/www/3real/deploy/backup-uploads.sh
set -euo pipefail

UPLOAD_DIR="${UPLOAD_DIR:-/var/uploads/3real}"
BACKUP_DIR="/var/backups/3real/uploads"
KEEP_DAYS="${KEEP_DAYS:-14}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="${BACKUP_DIR}/uploads_${TIMESTAMP}.tar.gz"
SOURCE="$UPLOAD_DIR"

mkdir -p "$BACKUP_DIR"

if [ ! -d "$SOURCE" ]; then
  echo "[$(date -Iseconds)] Source directory $SOURCE not found, skipping"
  exit 0
fi

echo "[$(date -Iseconds)] Archiving $SOURCE → $FILENAME"

tar -czf "$FILENAME" -C "$(dirname "$SOURCE")" "$(basename "$SOURCE")"

SIZE=$(du -sh "$FILENAME" | cut -f1)
echo "[$(date -Iseconds)] Archive complete: $FILENAME ($SIZE)"

# Remove archives older than KEEP_DAYS
find "$BACKUP_DIR" -name "uploads_*.tar.gz" -mtime "+${KEEP_DAYS}" -delete
echo "[$(date -Iseconds)] Pruned archives older than ${KEEP_DAYS} days"
