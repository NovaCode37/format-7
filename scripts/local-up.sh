#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

FRESH=0
NO_SEED=0
for arg in "$@"; do
    case "$arg" in
        --fresh)   FRESH=1 ;;
        --no-seed) NO_SEED=1 ;;
        -h|--help)
            echo "Usage: $0 [--fresh] [--no-seed]"
            echo "  --fresh    wipe volumes before starting"
            echo "  --no-seed  skip initial data seed"
            exit 0
            ;;
    esac
done

cyan()   { printf "\033[36m%s\033[0m\n" "$*"; }
green()  { printf "\033[32m%s\033[0m\n" "$*"; }
yellow() { printf "\033[33m%s\033[0m\n" "$*"; }
red()    { printf "\033[31m%s\033[0m\n" "$*"; }

command -v docker >/dev/null 2>&1 || { red "Docker not found. https://docs.docker.com/engine/install/"; exit 1; }
docker info >/dev/null 2>&1 || { red "Docker daemon is not running."; exit 1; }

cyan "=> Checking .env"
if [ ! -f ".env" ]; then
    cp .env.example .env
    SECRET="$(python3 -c 'import secrets;print(secrets.token_urlsafe(48))' 2>/dev/null || openssl rand -base64 48 | tr -d '\n')"
    sed -i.bak "s|^JWT_SECRET_KEY=.*|JWT_SECRET_KEY=${SECRET}|" .env && rm -f .env.bak
    grep -q '^APP_ENV=' .env || echo "APP_ENV=development" >> .env
    grep -q '^ENABLE_DEV_PAYMENT=' .env || echo "ENABLE_DEV_PAYMENT=1" >> .env
    green "   ok  .env created (JWT auto-generated)"
    yellow "   !!  Add ADMIN_EMAILS=you@example.com to .env if you want admin notifications"
else
    green "   ok  .env already exists"
fi

if [ "$FRESH" = "1" ]; then
    cyan "=> Wiping volumes"
    docker compose down -v >/dev/null 2>&1 || true
    green "   ok  volumes wiped"
fi

cyan "=> Starting core services"
docker compose up -d --build postgres redis backend frontend

cyan "=> Waiting for backend healthcheck"
ok=0
for i in $(seq 1 60); do
    if curl -fs http://localhost:8000/health >/dev/null 2>&1; then ok=1; break; fi
    sleep 1
done
[ "$ok" = "1" ] && green "   ok  backend healthy" || yellow "   !!  backend not responding (check: docker compose logs backend)"

cyan "=> Migrations"
docker compose exec -T backend alembic upgrade head || yellow "   !!  alembic failed (auto_migrate fallback active)"

if [ "$NO_SEED" = "0" ]; then
    cyan "=> Seeding"
    docker compose exec -T backend python seed.py 2>&1 || yellow "   !!  seed skipped (probably already seeded)"
fi

echo
echo "================================================================"
echo " Format7 is up:"
green "   Site     http://localhost:3000"
green "   API      http://localhost:8000"
green "   Swagger  http://localhost:8000/docs"
green "   Health   http://localhost:8000/health"
echo
echo " Useful commands:"
echo "   logs:    docker compose logs -f backend frontend"
echo "   stop:    ./scripts/local-down.sh"
echo "   admin:   ./scripts/create-admin.sh you@x.com 'pass1234567'"
echo "   reset:   ./scripts/local-up.sh --fresh"
echo "================================================================"
