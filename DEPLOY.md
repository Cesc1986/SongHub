# SongHub Deployment Guide (Docker Compose)

## 1) Configure login credentials

Create a `.env` file in the same folder as `docker-compose.yml`:

```env
SONGHUB_LOGIN_USERNAME=
SONGHUB_LOGIN_PASSWORD=
SONGHUB_ADMIN_USERNAME=
SONGHUB_ADMIN_PASSWORD=
SONGHUB_SESSION_SECRET=
```

> Copy `.env.example` for a fresh install only. Use `openssl rand -hex 32` to generate a private session key. Keep it stable across restarts and never commit it.

Upgrading from v1.8: back up the existing `/app/saved-tabs` mount, including hidden files. Keep the same mount, Compose project and reverse proxy. Set credentials explicitly (there are no fallback passwords); if these are already private, keep the same values. If you use a custom Compose file, pass `SONGHUB_SESSION_SECRET` into the container. Users must sign in again. No data migration or change of container UID is required for stock Compose.

## 2) Start / update SongHub

First deploy or after code changes:

```bash
docker compose up -d --build
```

If only username/password changed, a rebuild is **not** required:

```bash
docker compose up -d --force-recreate
```

Alternative (equivalent) flow:

```bash
docker compose down
docker compose up -d
```

## 3) Verify health

```bash
curl http://localhost:3005/api/health
```

Expected:
- `status: "ok"`
- `authConfigured: true`
- `performance.tabApi` and `performance.puppeteer` stats present

## 4) Diagnostics

```bash
docker compose ps
docker compose logs -f songhub
```

`start.sh` prints whether auth username/password are configured (without leaking the password).

Optional performance variables (in `.env`):

```env
SONGHUB_TAB_CACHE_TTL_MS=900000
SONGHUB_TAB_CACHE_MAX_ITEMS=200
SONGHUB_TAB_SCRAPE_CONCURRENCY=2
SONGHUB_PUPPETEER_PAGE_CONCURRENCY=4
```

## 5) Access

- App: http://localhost:3005
- Login page: http://localhost:3005/login
- Admin page (admin account only): http://localhost:3005/admin
