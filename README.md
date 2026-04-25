# SongHub

![SongHub](https://img.shields.io/badge/SongHub-Private%20Tab%20Manager-2563eb?style=for-the-badge)
![Version](https://img.shields.io/badge/version-v1.7-16a34a?style=for-the-badge)
![Stack](https://img.shields.io/badge/stack-Next.js%20%2B%20ChakraUI-111827?style=for-the-badge)

SongHub is a private song/tab workspace for musicians: search, save, organize, and prepare setlists in one place.

> **Based on UltimateTab**
> SongHub is built on top of UltimateTab and extended with additional functionality.
> Original project: https://github.com/mikemikk/UltimateTab

## Highlights

- Search and browse guitar tabs/songs
- Save songs locally for fast access
- Upload your own song sheets via photo/image
- Build date-based setlists for gigs and rehearsals
- Chord diagrams, transposition, autoscroll, and font-size controls
- Password-protected access

## Security Configuration

Configure login credentials via environment variables:

```env
# Shared app login
SONGHUB_LOGIN_USERNAME=user
SONGHUB_LOGIN_PASSWORD=passwort

# Admin login (required for /admin page)
SONGHUB_ADMIN_USERNAME=admin
SONGHUB_ADMIN_PASSWORD=admin-passwort
```

For Docker Compose:
- Copy `.env.example` to `.env`
- Adjust username/password in `.env`
- `docker-compose.yml` passes these variables into the container at runtime

## Deployment (Docker Compose)

Run SongHub with Docker Compose and expose port `3005`.

**First deploy / after code updates:**

```bash
docker compose up -d --build
```

**Only username/password changed (`.env`):** no rebuild needed

```bash
docker compose up -d --force-recreate
```

Detailed deployment steps: see [`DEPLOY.md`](./DEPLOY.md)

Then open:

- http://localhost:3005

## Healthcheck & Diagnostics

- Health endpoint: `http://localhost:3005/api/health`
- Container health status: `docker compose ps`
- Live logs (startup diagnostics incl. auth config presence):

```bash
docker compose logs -f songhub
```

## Release Notes (v1.7)

Focus: admin optimizations + UI stability.

- Admin access logging optimized to session-level (`session_start`) instead of noisy page-by-page entries
- Change log now focuses on real song lifecycle events (create/delete), reducing save/rename noise
- Setlist reordering hardened for mobile UX: drag works only via explicit handle to avoid accidental reorders while scrolling
- Admin log presentation refined for better readability on small screens
- Added a stricter release verification flow before declaring done (service active + `/login` and `/api/health` checks)
- Footer version remains derived from `package.json`

## Admin Center

Admin-only page: `/admin`

Features:
- Access log (who logged in, when, with which IP)
- Change log (song create/delete/rename/save actions)
- Trash management:
  - deleted songs are moved to trash
  - only deleted full setlist days are stored in trash (not single entry removals)
  - admin can restore songs/setlist-days from trash
  - admin can permanently delete single/all trash items

## License

Please refer to this repository and the original UltimateTab repository for license details.
