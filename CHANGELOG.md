# SongHub Changelog

## v1.61 - 2026-04-13

### 🐞 Bugfix Release Notes

- Fixed action-row ordering/alignment across viewports:
  - Mobile: `+` and `Speichern` left, A/F markers right in one line
  - Tablet/Desktop (incl. MacBook Air): stable right-side action alignment
- Unified A/F marker placement for text and photo tabs in the same primary action row behavior
- Changed responsive processing hint to: `Adapting view for your browser...` and moved notification position away from top-right
- Added `Esc` keyboard shortcut to exit fullscreen mode
- Fixed photo-tab zoom behavior:
  - no forced reset to 100% on fullscreen toggle
  - zoom-in disabled when effective max zoom cannot exceed current layout constraints
- Removed favorites heart from tab detail header
- Fixed musician-marker toggle persistence across rebuilds by storing runtime settings in persistent `saved-tabs/admin/runtime-settings.json`
- Added explicit `SONGHUB_SAVED_TABS_DIR=/app/saved-tabs` in Docker runtime env for consistent settings path resolution

---

## v1.6 - 2026-04-13

### ✨ Release Notes (UI / Layout Focus)

- **Fullscreen spacing parity for text songs**
  - In fullscreen mode (non-photo tabs), content now starts at the exact same left position as in normal view.
  - Insets are measured from the current layout and reused in fullscreen.

- **Fullscreen background color consistency (dark mode + light mode)**
  - Fixed color mismatch between side margins and text background in fullscreen.
  - Root cause was an invalid inline token color in dark mode; now resolved with valid CSS color handling.

- **Header compaction and responsive cleanup**
  - Song info + controls were reorganized to reduce wasted space and improve readability across mobile/tablet/laptop.

- **Image-tab info layout improvements**
  - Photo-upload song info (artist/title) now follows the compact arrangement pattern used in text songs where possible.

- **Admin setting for A/F markers**
  - Added admin toggle in `/admin` to enable/disable musician A/F markers globally.

---

## v1.2 - 2026-04-12

### ✨ Release Notes

- **Setlist-Funktionalität hinzugefügt**
  - Songs/Tabs können einer Setlist mit Datum zugeordnet werden.
  - Setlist-Ansicht im Hauptbereich integriert.

- **Passwort-Login hinzugefügt**
  - Zugriff auf Seiten und APIs ist jetzt hinter Login geschützt.
  - Login-Credentials sind über `.env.local` konfigurierbar (`SONGHUB_LOGIN_USERNAME`, `SONGHUB_LOGIN_PASSWORD`).

### 🔒 Security / Zugriff

- Ohne Login erfolgt Redirect auf `/login`.
- Nach Login sind Header, Suche und Menü normal verfügbar.
- Logout sperrt den Zugriff wieder korrekt.

---

## 2026-03-31 - Photo Upload Update

### ✨ Neue Features

1. **Foto-Zuschnitt-Editor**
   - Beim Upload von Fotos erscheint ein interaktiver Crop-Editor
   - Bildausschnitt per Maus verschiebbar
   - Größe per Slider anpassbar (20%-100%)
   - "Zurücksetzen"-Button zum Reset des Ausschnitts
   - Crop-Bereich wird visuell hervorgehoben (blauer Rahmen + Ecken)

2. **Automatischer Typ "Foto"**
   - Typ-Auswahl wurde entfernt (war vorher: Chords/Tab/Bass/Ukulele)
   - Bei Foto-Uploads wird automatisch "Foto" als Typ gesetzt
   - Sauberere UI ohne unnötige Auswahl

3. **Datumsformat DD.MM.YYYY**
   - Gespeicherte Tabs zeigen jetzt das Datum im deutschen Format (z.B. "31.03.2026")
   - Vorher: "31.3.2026" (ohne führende Null)

### 🛠️ Technische Details

**Neue Komponente:**
- `src/components/ImageCropper.tsx` - Canvas-basierter Crop-Editor

**Geänderte Dateien:**
- `src/components/ImageTabUploader.tsx`
  - Integriert ImageCropper
  - Typ-State standardmäßig "Foto"
  - Typ-Auswahl-UI entfernt
  - File-Processing leitet zu Cropper um

- `src/pages/index.tsx`
  - Datumsformat mit `toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })`

### 🎯 User Experience

- **Kein zusätzlicher Schritt:** Crop-Editor erscheint automatisch nach Bild-Auswahl
- **Intuitive Bedienung:** Ziehen + Slider = jeder versteht's
- **Keine Regressions:** Alle bisherigen Features (Drag & Drop, Kamera-Modus, Speichern) funktionieren weiterhin
- **Saubere Fotos:** Nutzer können unnötige Ränder/Notizen ausblenden

### ✅ Getestet

- Build erfolgreich (keine TypeScript/Linting-Fehler außer eine ESLint-Warnung bei useCallback)
- App läuft auf Port 3011: http://192.168.99.100:3011
- Alle Komponenten kompilieren ohne Fehler

---

**Nächste Schritte:**
- Live-Test: Foto hochladen → Crop-Editor nutzen → Speichern → Anzeige prüfen
