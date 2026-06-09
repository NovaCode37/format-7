#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [ "${1:-}" = "--wipe" ]; then
    echo "Stopping stack and wiping volumes (database will be lost)..."
    docker compose down -v
else
    echo "Stopping stack (volumes preserved)..."
    docker compose down
fi
echo "Done."
