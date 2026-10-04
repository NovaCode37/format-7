# Format7: online typography and print shop

A production e-commerce platform for a commercial printing house (**[формат7.рф](https://формат7.рф)**, Tyumen, Russia). Customers configure print products through live price calculators, preview them in 3D, design layouts in the browser, and place orders with online payment. The project ships with a full operational stack: reverse proxy with automatic TLS, connection-pooled PostgreSQL, Redis, metrics, and automated backups.

> Real commercial product, not a tutorial clone. Built end to end: frontend, backend, infrastructure, SEO, and analytics.

---

## Highlights

- **26 product price calculators.** Matrix-based pricing (format x paper x colors x run size) computed live in the browser, with an admin editor to change every price without a deploy.
- **3D product preview.** Interactive WebGL preview of printed items.
- **In-browser layout designer.** Customers assemble artwork or submit a design brief.
- **Full commerce flow.** Catalog, cart, checkout, order statuses, and **SBP** (Russian instant payments) integration.
- **Accounts.** JWT auth, email verification, password reset, OAuth sign-in, wishlist, saved addresses, web-push notifications.
- **Admin panel.** Manage pricing, products, reviews, and offices.
- **SEO and analytics.** Server-rendered metadata, sitemap/robots, JSON-LD microdata (Organization, WebSite, LocalBusiness, Product, Breadcrumb, FAQ), Open Graph, IDN to punycode normalization, Yandex.Metrika.
- **PWA.** Installable, service worker, offline-friendly shell.
- **Backend.** Rate limiting, idempotency keys, audit log, background scheduler, S3-compatible storage, Sentry, Prometheus metrics.

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Phosphor Icons, PWA |
| **Backend** | FastAPI, SQLAlchemy 2, Pydantic 2, Alembic, JWT (python-jose), Passlib/bcrypt, APScheduler |
| **Data** | PostgreSQL + PgBouncer (pooling), Redis (rate limiting / idempotency) |
| **Infra** | Docker Compose, Caddy (reverse proxy + automatic HTTPS), Prometheus + Grafana, automated backups |
| **Integrations** | SBP payments, OAuth, Web Push (VAPID), S3-compatible storage (boto3), Sentry |
| **Quality** | Ruff, mypy, pytest (+coverage), GitHub Actions CI |

---

## Architecture

```
                         ┌─────────────┐
        Internet ───────>│    Caddy    │  TLS, routing
                         └──────┬──────┘
                  /api/*        │        everything else
              ┌─────────────────┴─────────────────┐
              ▼                                     ▼
       ┌─────────────┐                       ┌─────────────┐
       │   FastAPI   │                       │  Next.js    │
       │   backend   │                       │  frontend   │
       └──────┬──────┘                       └─────────────┘
              │
     ┌────────┼─────────┬───────────────┐
     ▼        ▼         ▼               ▼
 PgBouncer  Redis   S3 storage   Prometheus / Grafana
     │
     ▼
 PostgreSQL
```

The frontend talks to the backend only through `/api/*`, which Caddy proxies internally; both are served from the same public origin.

---

## Getting Started

Requirements: Docker + Docker Compose. A `Makefile` wraps the common commands.

```bash
cp .env.example .env        # fill in secrets (JWT_SECRET_KEY, SMTP, etc.)
make up                     # start postgres, redis, backend, frontend
make migrate                # apply database migrations
make seed                   # seed catalog data
make admin EMAIL=you@example.com PASSWORD=supersecret123
```

- Site: <http://localhost:3000>
- API docs (Swagger): <http://localhost:8000/docs>

Full production stack (adds Caddy, Prometheus, Grafana, backups):

```bash
make prod-up
```

### Useful commands

| Command | Description |
|---------|-------------|
| `make logs` | Tail backend + frontend logs |
| `make test` | Run backend test suite (pytest) |
| `make shell-be` / `make shell-fe` | Shell into a container |
| `make fresh` | Recreate the stack with clean volumes |
| `make down` | Stop the stack (volumes preserved) |

---

## Project Structure

```
.
├── frontend/        # Next.js 14 app (App Router, TypeScript, Tailwind)
├── backend/         # FastAPI app, SQLAlchemy models, Alembic migrations, tests
├── caddy/           # Reverse proxy config (auto-TLS, /api proxy)
├── monitoring/      # Prometheus & Grafana configuration
├── scripts/         # Ops helpers (backup, admin creation, up/down)
├── design-system/   # Design tokens & references
├── docker-compose.yml
└── Makefile
```

---

## Engineering Notes

- **Pricing as data.** Every calculator reads from a single pricing source; the admin can override any value, and changes apply on the next page load, with no redeploy.
- **SEO done properly.** Client-rendered pages get server-side metadata via dedicated layout wrappers; structured data is emitted server-side so crawlers see it; the IDN domain (`формат7.рф`) is normalized to punycode for robots, sitemap and canonical URLs to avoid encoding ambiguity.
- **Resilience & safety.** Idempotency keys on order/payment endpoints, Redis-backed rate limiting, an audit log, and security checks guard the commerce flow.
- **Observability.** Prometheus metrics and Grafana dashboards; Sentry for error tracking.

---

## License

Proprietary. Source published for portfolio and review purposes, not licensed for reuse or redistribution.
