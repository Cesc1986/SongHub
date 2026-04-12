# SongHub

![SongHub](https://img.shields.io/badge/SongHub-Private%20Tab%20Manager-2563eb?style=for-the-badge)
![Version](https://img.shields.io/badge/version-v1.4-16a34a?style=for-the-badge)
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
SONGHUB_LOGIN_USERNAME=admin
SONGHUB_LOGIN_PASSWORD=your_user_password

# Admin login (required for /admin page)
SONGHUB_ADMIN_USERNAME=admin
SONGHUB_ADMIN_PASSWORD=besservorsicht!?
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

## Release Notes (v1.4)

- Fullscreen visual polish for mobile and tablet:
  - photo fullscreen is now edge-to-edge and centered
  - single tap exits photo fullscreen
  - double tap used for zoom behavior
- Text/tab fullscreen usability improvements:
  - 5px left padding in fullscreen reading mode
  - autoscroll controls include speed (+/-) when active
  - content starts below overlay controls to avoid text overlap
- Layout spacing refinements:
  - tighter global side spacing across pages
  - header/footer alignment with homepage song cards
- Footer version remains derived from `package.json`

## Admin Center

Admin-only page: `/admin`

Features:
- Access log (who logged in, when, with which IP)
- Change log (song create/delete/rename/save actions)
- Trash management (song/setlist deletes)
  - only admin can permanently delete single/all trash items

## License

Please refer to this repository and the original UltimateTab repository for license details.
