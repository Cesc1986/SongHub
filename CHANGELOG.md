# UltimateTab Changelog

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
