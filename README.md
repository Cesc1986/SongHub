# SongHub

![SongHub](https://img.shields.io/badge/SongHub-Private%20Tab%20Manager-2563eb?style=for-the-badge)
![Version](https://img.shields.io/badge/version-v1.2-16a34a?style=for-the-badge)
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
SONGHUB_LOGIN_USERNAME=admin
SONGHUB_LOGIN_PASSWORD=your_strong_password
```

For Docker Compose:
- Put these values in a `.env` file (same folder as `docker-compose.yml`)
- `docker-compose.yml` passes them into the container at runtime

## Deployment (Docker Compose)

Run SongHub with Docker Compose and expose port `3005`.

```bash
docker compose up -d --build
```

Then open:

- http://localhost:3005

## Release Notes (v1.2)

- Added setlist functionality
- Added password login protection
- Improved access control for protected pages and APIs

## License

Please refer to this repository and the original UltimateTab repository for license details.
