# SongHub

SongHub is a modern web app for searching, saving, and organizing guitar songs/tabs, including setlist planning and secure private access.

> **Credits / Base Project**
> SongHub is based on **UltimateTab** and extends it with additional functionality and UX improvements.
> Original project: https://github.com/mikemikk/UltimateTab

## Features

- Search and browse guitar tabs/songs (Ultimate Guitar based)
- Save tabs locally for quick reuse
- Upload your own song sheets via image/photo
- Build date-based **setlists** for gigs, rehearsals, or meetings
- Chord diagrams and chord transposition
- Autoscroll and font-size controls for live play sessions
- Password-protected access (credentials via environment variables)

## Security

SongHub supports a simple login gate for private usage.

Configure credentials in your environment file:

- `SONGHUB_LOGIN_USERNAME`
- `SONGHUB_LOGIN_PASSWORD`

Example (`.env.local`):

```env
SONGHUB_LOGIN_USERNAME=admin
SONGHUB_LOGIN_PASSWORD=your_strong_password
```

## Tech Stack

- Next.js
- React
- Chakra UI
- React Query
- Puppeteer-based scraping utilities

## Local Development

```bash
npm install
npm run dev
```

Then open: `http://localhost:3000`

## Production (Docker)

Use `docker-compose` and expose port `3005` (or your preferred port).

## License

Please refer to the original UltimateTab project and this repository's license files for licensing details.
