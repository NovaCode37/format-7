#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

EMAIL="${1:-}"
PASSWORD="${2:-}"
NAME="${3:-Admin}"

if [ -z "$EMAIL" ]; then
    echo "Usage: $0 <email> [password] [name]"
    exit 1
fi

if [ -z "$PASSWORD" ]; then
    read -s -p "Password for $EMAIL: " PASSWORD
    echo
fi

if [ ${#PASSWORD} -lt 12 ]; then
    echo "Password too short (min 12 chars)"; exit 1
fi

if ! docker compose ps --services --filter "status=running" | grep -q backend; then
    echo "Backend is not running. Start it first: ./scripts/local-up.sh"
    exit 1
fi

EMAIL_LC="$(echo "$EMAIL" | tr '[:upper:]' '[:lower:]')"
NAME_ESC="${NAME//\'/\'\'}"

docker compose exec -T backend python - <<PY
from database import SessionLocal
from models import User
from auth import hash_password
db = SessionLocal()
try:
    u = db.query(User).filter(User.email == '${EMAIL_LC}').first()
    if u:
        u.hashed_password = hash_password('${PASSWORD}')
        u.email_verified = True
        u.is_active = True
        db.commit()
        print('updated existing user', u.id)
    else:
        u = User(email='${EMAIL_LC}', name='${NAME_ESC}',
                hashed_password=hash_password('${PASSWORD}'),
                is_active=True, email_verified=True)
        db.add(u); db.commit(); db.refresh(u)
        print('created user', u.id)
finally:
    db.close()
PY

echo
echo "Now grant admin role:"
echo "  Add to .env:  ADMIN_EMAILS=${EMAIL_LC}"
echo "  Then:         docker compose restart backend"
