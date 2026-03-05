# UltimateTab — Docker Setup

## Voraussetzungen
- Docker + Docker Compose installiert

## Starten

```bash
git clone <repo-url>
cd UltimateTab
docker compose up -d --build
```

App läuft dann auf: **http://localhost:3005**

## Gespeicherte Tabs

Tabs werden im Ordner `./saved-tabs/` auf dem **Host** gespeichert (Volume-Mount).  
Sie bleiben auch nach Container-Neustart erhalten.

## Stoppen

```bash
docker compose down
```

## Logs

```bash
docker compose logs -f
```

## Hinweise

- Beim ersten `build` lädt Docker alle Dependencies + Chromium (~500 MB)
- Danach ist `up` schnell (gecachter Build)
- Port lässt sich in `docker-compose.yml` ändern (z.B. `"8080:3005"`)
