# SongHub Deployment Guide (Docker Compose)

## Docker image for Kubernetes

The GitHub Actions workflow `.github/workflows/docker-image.yml` builds the Docker image and publishes it to GitHub Container Registry:

```text
ghcr.io/gravelfreeman/songhub
```

Generated tags:

- `latest` on published builds
- `vX.Y.Z` from `package.json` on branch and manual builds
- the Git tag name when a `v*` Git tag is pushed

Example image to use in Kubernetes:

```yaml
image: ghcr.io/gravelfreeman/songhub:v1.7.0
```

If the GHCR package remains private, configure a Kubernetes `imagePullSecret` with a GitHub token authorized to read packages.

## 1) Configure login credentials

Create a `.env` file in the same folder as `docker-compose.yml`:

```env
SONGHUB_LOGIN_USERNAME=user
SONGHUB_LOGIN_PASSWORD=passwort
SONGHUB_ADMIN_USERNAME=admin
SONGHUB_ADMIN_PASSWORD=admin-passwort
```

> You can copy `.env.example` and adjust the values.

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
