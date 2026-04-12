# SongHub Deployment Guide (Docker Compose)

## 1) Configure login credentials

Create a `.env` file in the same folder as `docker-compose.yml`:

```env
SONGHUB_LOGIN_USERNAME=admin
SONGHUB_LOGIN_PASSWORD=passwort
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

## 4) Diagnostics

```bash
docker compose ps
docker compose logs -f songhub
```

`start.sh` prints whether auth username/password are configured (without leaking the password).

## 5) Access

- App: http://localhost:3005
- Login page: http://localhost:3005/login
