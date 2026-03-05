# WebWare

Ein durch WarioWare inspiriertes Browserspiel.

## Spielkonzept

- Der Spieler kann entweder alleine oder mit unbegrenzt vielen Freunden spielen.
- Sobald alle Spieler bereit sind, startet das Spiel nach Ablauf eines 3-Sekunden-Timers.
- Alle Spieler absolvieren nacheinander Stages, die im Schwierigkeitsgrad steigen.
- Die Auswahl der Stage ist zufällig, jedoch für alle Spieler gleich.
- Sobald alle Spieler alle Stages absolviert haben, wird der Spieler mit den meisten Punkten zum Gewinner ernannt.

## Punktesystem

- Die Zeit, die für jede Stage benötigt wird, wird gemessen.
- Der schnellste Spieler einer Stage bekommt einen Punkt.
- Ein Scoreboard zeigt die Spielerpunktzahlen live an.
- Im Singleplayer-Modus wird nur die Zeit festgehalten.

## UI / UX

- Der Fortschritt des Spiels wird in einem Balken an der oberen Bildschirmkante angezeigt.
- Der Fortschrittsbalken zeigt wie bei einem Rennen den Fortschritt jedes Spielers an.
- Die Aufgabenstellung soll gross dargestellt werden, zentral oben unter dem Fortschrittsbalken.
- Audio-Lautstaerke soll einstellbar sein.

## Musik

- Das Spiel enthaelt Musik, welche die Geschwindigkeit des Spiels untermalt.
- Die Musik wird mit jeder Erhoehung des Schwierigkeitsgrades schneller.

## Spielablauf

1. Spieler waehlen einen Namen.
2. Spieler kommen in die Lobby.
3. Ready Check -- das Spiel startet sobald alle bereit sind.
4. Stages werden nacheinander absolviert.
5. Nach dem Spiel haben alle Spieler die Option fuer ein Rematch. Dabei bleibt der Raum erhalten, wird aber in den Lobby-State versetzt.

## Stages

- Jede Stage ist eine React-Komponente.
- Jede Stage muss 5 Schwierigkeitsgrade unterstuetzen.
- Jede Stage muss via Submit-Button (oder Enter-Taste) abgeschickt werden. Ist die Anforderung der Stage nicht erfuellt, gibt es keinen Punkt.
- Die Stages sollen nachtraeglich einfach hinzufuegbar sein.

### Beispiele

- **Captchas** -- werden mit jedem Level schwieriger.
- **Passwort-Formular** -- Einschraenkungen werden immer schwieriger.
- **Daten-Formular** -- bekommt immer mehr Felder je hoeher der Schwierigkeitsgrad.
- **Download-Button** -- den richtigen Button finden, der immer schwieriger zu erkennen ist neben Werbebannern.
- **Online-Shop** -- aus einer Liste den richtigen Artikel kaufen. Die Liste wird immer laenger und unuebersichtlicher.

## Techstack

- **Frontend:** React + Vite
- **Multiplayer:** WebSockets
- **Server-Runtime:** Bun
- **Server-Hosting:** Railway (Docker)
- **Client-Hosting:** GitHub Pages

## Multiplayer

- Raum-IDs werden in der URL wiedergespiegelt.
- Anti-Cheat ist nicht vorgesehen, da die Multiplayer-Runden in privaten Raeumen stattfinden.

---

# Technische Spezifikation

## Projektstruktur

```
web-ware/
├── client/                  # React + Vite Frontend
│   ├── src/
│   │   ├── components/      # Allgemeine UI-Komponenten
│   │   ├── stages/          # Stage-Komponenten (eine Datei pro Stage)
│   │   ├── hooks/           # Custom React Hooks (useWebSocket, useAudio, ...)
│   │   ├── context/         # React Context (GameContext, AudioContext)
│   │   ├── pages/           # Seiten (Home, Lobby, Game, Results)
│   │   ├── types/           # Shared TypeScript Types
│   │   └── App.tsx
│   └── public/
│       └── audio/           # Musikdateien
├── server/                  # Bun WebSocket Server
│   ├── src/
│   │   ├── rooms.ts         # Raum-Verwaltung
│   │   ├── game.ts          # Spiellogik
│   │   ├── types.ts         # Shared Types
│   │   └── index.ts         # Einstiegspunkt
│   └── Dockerfile
└── SPEC.md
```

## Datenmodell

### Player

```ts
type Player = {
  id: string;            // Eindeutige ID (vom Server generiert, UUID)
  name: string;          // Vom Spieler gewaehlter Name
  ready: boolean;        // Ready-Status in der Lobby
  score: number;         // Gesamtpunktzahl
  currentStage: number;  // Index der aktuellen Stage
  finished: boolean;     // Alle Stages abgeschlossen
};
```

### Room

```ts
type Room = {
  id: string;              // Raum-ID (kurzer Code, z.B. "A3F8")
  state: RoomState;
  players: Player[];
  stages: StageConfig[];   // Festgelegte Stage-Reihenfolge fuer diese Runde
  seed: number;            // Zufalls-Seed fuer die gesamte Runde
  createdAt: number;
};

type RoomState = "lobby" | "countdown" | "playing" | "results";
```

### StageConfig

```ts
type StageConfig = {
  type: string;            // Stage-Typ (z.B. "captcha", "password", "download-button")
  difficulty: 1 | 2 | 3 | 4 | 5;
  seed: number;            // Abgeleiteter Seed fuer diese Stage
};
```

### StageResult

```ts
type StageResult = {
  playerId: string;
  stageIndex: number;
  timeMs: number;          // Benoetigte Zeit in Millisekunden
  success: boolean;        // Stage korrekt geloest
};
```

## Game State Machine

```
[lobby] ---(alle ready)---> [countdown] ---(3s)---> [playing] ---(alle fertig)---> [results]
  ^                                                                                   |
  └─────────────────────────────(rematch)─────────────────────────────────────────────┘
```

- **lobby** -- Spieler treten bei, waehlen Namen, setzen Ready-Status.
- **countdown** -- 3-Sekunden-Timer laeuft. Kein Beitritt mehr moeglich.
- **playing** -- Stages werden absolviert. Jeder Spieler spielt in seinem eigenen Tempo.
- **results** -- Scoreboard mit Gewinner. Rematch-Option setzt zurueck auf `lobby`.

## Stage-Interface

Jede Stage-Komponente implementiert folgendes Interface:

```tsx
type StageProps = {
  difficulty: 1 | 2 | 3 | 4 | 5;
  seed: number;
  onSubmit: (success: boolean) => void;
};
```

Neue Stages werden in einer Registry registriert:

```ts
// stages/registry.ts
import { CaptchaStage } from "./CaptchaStage";
import { PasswordStage } from "./PasswordStage";

export const stageRegistry: Record<string, React.FC<StageProps>> = {
  "captcha": CaptchaStage,
  "password": PasswordStage,
  // Neue Stages hier einfach hinzufuegen
};
```

## WebSocket-Protokoll

Kommunikation zwischen Client und Server ueber JSON-Messages.

### Client → Server

| Event              | Payload                          | Beschreibung                        |
| ------------------ | -------------------------------- | ----------------------------------- |
| `join`             | `{ roomId, playerName }`         | Raum beitreten / erstellen          |
| `ready`            | `{ ready: boolean }`             | Ready-Status togglen                |
| `stage-complete`   | `{ stageIndex, timeMs, success }`| Stage abgeschlossen                 |
| `rematch`          | `{}`                             | Rematch anfordern                   |

### Server → Client

| Event              | Payload                          | Beschreibung                        |
| ------------------ | -------------------------------- | ----------------------------------- |
| `room-state`       | `{ room: Room }`                 | Vollstaendiger Raum-State (bei Join)|
| `player-joined`    | `{ player: Player }`             | Neuer Spieler beigetreten           |
| `player-left`      | `{ playerId }`                   | Spieler hat verlassen               |
| `player-ready`     | `{ playerId, ready }`            | Ready-Status geaendert              |
| `countdown`        | `{ seconds }`                    | Countdown-Tick                      |
| `game-start`       | `{ stages: StageConfig[], seed }` | Spiel startet, Seed + Stage-Liste   |
| `player-progress`  | `{ playerId, stageIndex }`       | Fortschritt eines Spielers          |
| `stage-result`     | `{ stageIndex, results: StageResult[] }` | Ergebnis einer Stage       |
| `game-end`         | `{ rankings: Player[] }`         | Spiel vorbei, finale Rangliste      |

## Routing (Client)

| Pfad              | Seite          | Beschreibung                          |
| ----------------- | -------------- | ------------------------------------- |
| `/`               | Home           | Name eingeben, Raum erstellen/beitreten |
| `/:roomId`        | Lobby / Game   | Raum-Ansicht (Lobby oder Spiel je nach State) |

## Schwierigkeitsgrad-Verlauf

Die Stages werden in Runden gespielt. Pro Runde steigt der Schwierigkeitsgrad:

| Runde   | Difficulty | Stages |
| ------- | ---------- | ------ |
| 1       | 1          | 2      |
| 2       | 2          | 2      |
| 3       | 3          | 2      |
| 4       | 4          | 2      |
| 5       | 5          | 2      |

Gesamt: **10 Stages** pro Spiel. Die Anzahl kann spaeter angepasst werden.

## Audio

- Musik wird clientseitig ueber die Web Audio API abgespielt.
- Die Playback-Rate wird proportional zum Schwierigkeitsgrad erhoeht (`1.0` bis `1.4`).
- Lautstaerke wird im `localStorage` persistiert.

## Seeded Randomness

Stages variieren zufallsbasiert (z.B. andere Captcha-Texte, andere Artikellisten, andere Passwort-Regeln). Damit alle Spieler exakt dieselbe Aufgabe sehen, wird der Zufall ueber einen deterministischen Seed gesteuert.

- Der Server generiert beim Spielstart einen **Room-Seed** (`Math.random()` oder Timestamp-basiert).
- Aus dem Room-Seed wird pro Stage ein **Stage-Seed** abgeleitet: `hash(roomSeed + stageIndex)`.
- Der Stage-Seed wird als Prop an die Stage-Komponente uebergeben.
- Stages nutzen eine **seeded PRNG-Funktion** (z.B. `mulberry32`) statt `Math.random()`, um daraus alle Zufallswerte zu generieren.

```ts
// utils/random.ts
function seededRandom(seed: number): () => number {
  // mulberry32 -- deterministische PRNG
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

- Im **Dev-Modus** kann der Seed manuell eingegeben werden, um Varianten reproduzierbar zu testen.

## Dev-Modus (Stage Testing)

Ueber eine spezielle Route kann jede Stage isoliert getestet werden.

### Route

| Pfad                          | Beschreibung                              |
| ----------------------------- | ----------------------------------------- |
| `/dev`                        | Stage-Auswahl mit Difficulty-Slider       |
| `/dev/:stageType/:difficulty` | Einzelne Stage direkt oeffnen             |

### Funktionen

- **Stage-Auswahl** -- Dropdown/Liste aller registrierten Stages aus der Registry.
- **Difficulty-Slider** -- Schwierigkeitsgrad 1-5 frei waehlbar.
- **Live-Reload** -- Stage wird bei Aenderung von Typ oder Difficulty sofort neu gerendert.
- **Submit-Feedback** -- Zeigt nach `onSubmit` an ob `success: true/false` und die gemessene Zeit.
- **Reset-Button** -- Stage zuruecksetzen ohne Seitenwechsel.
- **Kein Server noetig** -- Der Dev-Modus laeuft rein clientseitig ohne WebSocket-Verbindung.

### Zugang

- Nur verfuegbar wenn `import.meta.env.DEV === true` (Vite Development Mode).
- Die Route wird im Production-Build nicht ausgeliefert.
