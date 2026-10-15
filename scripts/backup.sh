#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/zeuhost}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/zeuhost_db_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[+] Starting PostgreSQL database backup for ZeuHost..."

docker exec -t zeuhost-postgres pg_dumpall -c -U "${POSTGRES_USER:-zeuhost}" | gzip > "$BACKUP_FILE"

echo "[+] Backup successfully written to $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Retention: keep last 14 days
find "$BACKUP_DIR" -name "zeuhost_db_*.sql.gz" -mtime +14 -delete
echo "[+] Cleaned up backups older than 14 days."
