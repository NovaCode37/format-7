#!/bin/sh
set -eu

STAMP="$(date +%Y%m%d_%H%M%S)"
OUT="/backups/${PGDATABASE}_${STAMP}.sql.gz"

echo "[backup] starting: $OUT"
pg_dump --no-owner --no-privileges "$PGDATABASE" | gzip -9 > "$OUT"
ls -lh "$OUT"

if [ -n "${RCLONE_REMOTE:-}" ] && command -v rclone >/dev/null 2>&1; then
  echo "[backup] uploading to $RCLONE_REMOTE"
  rclone copy "$OUT" "$RCLONE_REMOTE" || echo "[backup] upload failed (continuing)"
fi

RETENTION=${BACKUP_RETENTION_DAYS:-30}
find /backups -name "${PGDATABASE}_*.sql.gz" -type f -mtime +$RETENTION -delete || true

echo "[backup] done"
