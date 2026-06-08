#!/usr/bin/env bash
# PostgreSQL backup — dumps to /var/backups/3real/db/
# Run via cron: 0 3 * * * /var/www/3real/deploy/backup-db.sh
set -euo pipefail

BACKUP_DIR="/var/backups/3real/db"
DB_NAME="${DB_NAME:-threereal_db}"
DB_USER="${DB_USER:-threereal}"
KEEP_DAYS="${KEEP_DAYS:-7}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date -Iseconds)] Starting backup of $DB_NAME → $FILENAME"

pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$FILENAME"

SIZE=$(du -sh "$FILENAME" | cut -f1)
echo "[$(date -Iseconds)] Backup complete: $FILENAME ($SIZE)"

# Remove backups older than KEEP_DAYS
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime "+${KEEP_DAYS}" -delete
echo "[$(date -Iseconds)] Pruned backups older than ${KEEP_DAYS} days"
