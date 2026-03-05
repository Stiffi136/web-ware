import { handleMessage, handleClose } from "./game.ts";
import type { WSData } from "./types.ts";

const PORT = Number(process.env["PORT"] ?? 3001);

Bun.serve({
  port: PORT,
  fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname === "/ws") {
      const data: WSData = { playerId: "", roomId: "" };
      const ok = server.upgrade(req, { data });
      return ok ? undefined : new Response("Upgrade failed", { status: 400 });
    }
    return new Response("WebWare Server", { status: 200 });
  },
  websocket: {
    open(_ws) {
      // Wait for join message
    },
    message(ws, raw) {
      handleMessage(ws, String(raw));
    },
    close(ws) {
      handleClose(ws);
    },
  },
});

console.log(`WebWare server running on port ${String(PORT)}`);
