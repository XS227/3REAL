# Backup & Restore — 3REAL

---

## Backup strategy

| Data | Script | Frequency | Retention | Destination |
|------|--------|-----------|-----------|-------------|
| PostgreSQL DB | `deploy/backup-db.sh` | Daily 03:00 | 7 days | `/var/backups/3real/db/` |
| Uploaded files | `deploy/backup-uploads.sh` | Daily 04:00 | 14 days | `/var/backups/3real/uploads/` |

---

## 1. Setting up scheduled backups

### Install cron jobs

```bash
crontab -e
```

Add:

```cron
# 3REAL daily DB backup at 03:00
0 3 * * * /var/www/3real/deploy/backup-db.sh >> /var/log/3real-backup.log 2>&1

# 3REAL uploads backup at 04:00
0 4 * * * /var/www/3real/deploy/backup-uploads.sh >> /var/log/3real-backup.log 2>&1
```

### Verify cron is running

```bash
crontab -l
tail -f /var/log/3real-backup.log
```

### Test scripts manually

```bash
bash /var/www/3real/deploy/backup-db.sh
bash /var/www/3real/deploy/backup-uploads.sh

ls -lh /var/backups/3real/db/
ls -lh /var/backups/3real/uploads/
```

---

## 2. Database backup details

### What gets backed up

The `backup-db.sh` script runs `pg_dump` and compresses with gzip:

```
/var/backups/3real/db/threereal_db_20260608_030000.sql.gz
```

Each file contains a full logical dump (schema + data) of `threereal_db`.

### Configuration

| Env var | Default | Description |
|---------|---------|-------------|
| `DB_NAME` | `threereal_db` | Database name |
| `DB_USER` | `threereal` | PostgreSQL user |
| `KEEP_DAYS` | `7` | Days before old backups are pruned |

Override at run time:
```bash
KEEP_DAYS=30 bash /var/www/3real/deploy/backup-db.sh
```

---

## 3. Database restore

### Full restore (replace database)

```bash
# 1. Stop the app
pm2 stop 3real

# 2. Drop and recreate the database
psql -U postgres -c "DROP DATABASE IF EXISTS threereal_db;"
psql -U postgres -c "CREATE DATABASE threereal_db OWNER threereal;"

# 3. Restore from backup
gunzip -c /var/backups/3real/db/threereal_db_TIMESTAMP.sql.gz \
  | psql -U threereal threereal_db

# 4. Start the app
pm2 start 3real
```

### Point-in-time restore (partial — restore a table)

```bash
# Extract SQL from the gzip dump without a full restore
gunzip -c threereal_db_TIMESTAMP.sql.gz | grep -A1000 'COPY public.users'

# Or restore to a separate database for inspection
createdb -U postgres threereal_restore
gunzip -c threereal_db_TIMESTAMP.sql.gz | psql -U threereal threereal_restore
```

### Verify restore integrity

```bash
psql -U threereal threereal_db -c "SELECT COUNT(*) FROM users;"
psql -U threereal threereal_db -c "SELECT COUNT(*) FROM transactions;"
psql -U threereal threereal_db -c "SELECT COUNT(*) FROM ledger_entries;"
```

---

## 4. Uploads restore

```bash
# Stop the app
pm2 stop 3real

# Restore the uploads directory
rm -rf /var/www/3real/storage/uploads
tar -xzf /var/backups/3real/uploads/uploads_TIMESTAMP.tar.gz -C /var/www/3real

# Fix permissions
chown -R www-data:www-data /var/www/3real/storage/uploads 2>/dev/null || true

# Start the app
pm2 start 3real
```

---

## 5. Checking backup health

```bash
# List recent DB backups
ls -lht /var/backups/3real/db/ | head -10

# List recent upload backups
ls -lht /var/backups/3real/uploads/ | head -10

# Check backup log
tail -50 /var/log/3real-backup.log

# Check disk usage
du -sh /var/backups/3real/
df -h /var/backups
```

---

## 6. Remote backup (recommended for production)

The on-server backups protect against application-level errors but not against VPS failure. Copy backups off-server daily:

### Option A — rsync to remote server

```bash
# Add to crontab, runs after backup-db.sh
30 3 * * * rsync -az /var/backups/3real/ user@backup-server:/backups/3real/
```

### Option B — rclone to object storage (S3 / Backblaze B2)

```bash
# Install rclone and configure a remote
rclone copy /var/backups/3real/ remote:3real-backups/$(hostname)/
```

---

## 7. Disaster recovery checklist

In the event of complete VPS loss:

1. Provision new VPS with same OS
2. Install Node.js 20, PostgreSQL 14+, PM2, nginx
3. Create DB: `createuser -P threereal && createdb -O threereal threereal_db`
4. Clone repo: `git clone <repo-url> /var/www/3real`
5. Restore `.env` from secure storage
6. Restore DB from latest backup (§3)
7. Restore uploads from latest backup (§4)
8. Run `bash deploy/deploy.sh` (always rebuilds and verifies the deploy — there is no skip-build path)
9. Restore nginx config + SSL certs from backup or re-issue cert
10. Verify `https://3real.setaei.com/api/health` returns 200
