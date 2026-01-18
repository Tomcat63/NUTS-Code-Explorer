# NUTS Explorer 2024 Deutschland

Ein interaktiver Mindmap-Explorer für die hierarchische Gliederung der NUTS-Regionen (NUTS 1, 2 und 3) in Deutschland auf Basis der Version 2024.

## Features
- **Interaktives Mindmap:** Visualisierung der Hierarchien von der Bundesebene bis zum Stadt-/Landkreis.
- **Volltextsuche:** Schnelles Finden von Regionen mit Auto-Fokus (Enter-Taste).
- **Statistiken:** Anzeige von Einwohnerzahlen für alle ~455 NUTS-Codes.
- **Multi-Theming:** 7 verschiedene Design-Modi (Dark, Light, Autumn, etc.).
- **Responsive & Zoombar:** Unterstützung für Mausrad-Zoom (Strg + Scrollen) und Touch.

## Installation & Start (Lokal)

### Voraussetzungen
Stellen Sie sicher, dass Sie [Node.js](https://nodejs.org/) (Version 18 oder höher) installiert haben.

### 1. Projekt klonen
Öffnen Sie Ihr Terminal (oder CMD) und führen Sie aus:
```bash
git clone https://github.com/IHR_BENUTZERNAME/nuts-explorer-2024.git
cd nuts-explorer-2024
```

### 2. Abhängigkeiten installieren
Installieren Sie alle benötigten Pakete:
```bash
npm install
```

### 3. Server starten
Starten Sie den lokalen Entwicklungsserver:
```bash
npm run dev
```

### 4. Browser öffnen
Nachdem der Server gestartet ist, öffnen Sie im Browser die angezeigte Adresse (standardmäßig meist `http://localhost:5173`).

---

## Entwicklung
- `index.tsx`: Hauptlogik und UI-Komponenten.
- `data.ts`: Strukturierte NUTS-Daten (Stand 2024).
- `statistik.ts`: Erweiterte Daten wie Einwohnerzahlen.
