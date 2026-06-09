.PHONY: help up down stop fresh logs admin migrate seed shell-be shell-fe test prod-up prod-down ps clean

help:
	@echo "Format7 — common dev commands"
	@echo ""
	@echo "  make up         — start core stack (postgres, redis, backend, frontend)"
	@echo "  make fresh      — same as 'up' but wipe volumes first"
	@echo "  make down       — stop stack (volumes preserved)"
	@echo "  make stop       — alias for 'down'"
	@echo "  make clean      — stop + wipe ALL volumes"
	@echo "  make logs       — tail backend + frontend logs"
	@echo "  make ps         — list running containers"
	@echo "  make migrate    — run alembic upgrade head"
	@echo "  make seed       — run seed.py"
	@echo "  make admin EMAIL=you@x.com PASSWORD=pass123456789"
	@echo "  make shell-be   — bash shell in backend container"
	@echo "  make shell-fe   — bash shell in frontend container"
	@echo "  make test       — run pytest in backend"
	@echo "  make prod-up    — start FULL stack (incl. caddy, prometheus, grafana, backup)"
	@echo "  make prod-down  — stop full stack"

up:
	@docker compose up -d --build postgres redis backend frontend
	@echo "Waiting for backend..." && sleep 4
	@curl -fs http://localhost:8000/health > /dev/null && echo "  ✓ backend ok" || echo "  ! backend not yet ready, check 'make logs'"
	@echo ""
	@echo "  Site:    http://localhost:3000"
	@echo "  API:     http://localhost:8000/docs"

fresh:
	docker compose down -v
	@$(MAKE) up

down stop:
	docker compose down

clean:
	docker compose down -v

logs:
	docker compose logs -f backend frontend

ps:
	docker compose ps

migrate:
	docker compose exec backend alembic upgrade head

seed:
	docker compose exec backend python seed.py

admin:
ifndef EMAIL
	@echo "EMAIL is required: make admin EMAIL=you@x.com PASSWORD=secret123456789"; exit 1
endif
ifndef PASSWORD
	@echo "PASSWORD is required: make admin EMAIL=you@x.com PASSWORD=secret123456789"; exit 1
endif
	@bash scripts/create-admin.sh "$(EMAIL)" "$(PASSWORD)"

shell-be:
	docker compose exec backend bash

shell-fe:
	docker compose exec frontend sh

test:
	docker compose exec backend pytest -v

prod-up:
	docker compose up -d --build

prod-down:
	docker compose down
