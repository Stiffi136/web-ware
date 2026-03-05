# WebWare

WebWare is a fast-paced multiplayer browser game with chaotic “internet task” mini-games.

![WebWare Banner](client/public/img/banner.png)

## Play Online

Live game: [https://stiffi136.github.io/web-ware/](https://stiffi136.github.io/web-ware/)

## How To Play

1. Open the game link.
2. Enter your player name.
3. Create a room or join an existing room with a room code.
4. In the lobby, click **Ready Up**.
5. When all players are ready, a 3-second countdown starts.
6. Complete each stage as fast and as accurately as possible.
7. After all stages are done, check the results and start a rematch if you want.

## Scoring

- Each stage is scored after all players submit.
- The fastest **correct** player for that stage gets **1 point**.
- If nobody is correct, no point is awarded.
- Final ranking is based on total points.

## Local Development

### Requirements

- [Bun](https://bun.sh/)

### Run

```bash
cd server && bun install
cd ../client && bun install
cd .. && bun run dev
```

This starts:

- server on `http://localhost:3001`
- client dev server (Vite) on its default local port

## Tech Stack

- **Client**: React + TypeScript + Vite
- **Server**: Bun WebSocket server
