import { existsSync } from "node:fs";
import { PlatformStore } from "./store.js";
import { createAuth } from "./auth.js";
import { platformHandler, principalFor } from "./platform.js";
import http from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { pathToFileURL } from "node:url";
import { WebSocketServer } from "ws";
import { RoomService } from "./rooms.js";
import { clientAddress } from "./client-address.js";
export async function startServer(
  port = Number(process.env.PORT ?? 3000),
  host = "0.0.0.0",
  production = process.env.NODE_ENV === "production" ||
    process.argv[1]?.endsWith(".js") === true,
  random?: () => number,
  options: {
    storePath?: string;
    legacyHarness?: boolean;
    baseURL?: string;
    listen?: boolean;
  } = {},
) {
  const store = new PlatformStore(options.storePath);
  const rooms = new RoomService(random, store, !options.legacyHarness);
  let authRuntime: Awaited<ReturnType<typeof createAuth>>;
  let handlePlatform: ReturnType<typeof platformHandler> | undefined;
  let closing = false;
  const vite = production
    ? undefined
    : await (
        await import("vite")
      ).createServer({ server: { middlewareMode: true }, appType: "spa" });
  const server = http.createServer(async (req, res) => {
    if (!handlePlatform) {
      res.statusCode = 503;
      res.end("Starting GameVerse");
      return;
    }
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    if (req.url === "/health") {
      res.setHeader("Content-Type", "application/json");
      res.end('{"ok":true}');
      return;
    }
    if (await handlePlatform(req, res)) return;
    if (vite) {
      vite.middlewares(req, res);
      return;
    }
    try {
      const path = new URL(req.url ?? "/", "http://localhost").pathname;
      const relative =
        path.startsWith("/assets/") ||
        path.startsWith("/art/") ||
        path.startsWith("/fonts/") ||
        path === "/manifest.webmanifest" ||
        path === "/icon.svg"
          ? path.slice(1)
          : "index.html";
      const data = await readFile(resolve("dist", relative));
      res.setHeader(
        "Content-Type",
        (
          {
            ".html": "text/html; charset=utf-8",
            ".js": "text/javascript",
            ".css": "text/css",
            ".svg": "image/svg+xml",
            ".png": "image/png",
            ".webp": "image/webp",
            ".woff2": "font/woff2",
            ".ttf": "font/ttf",
            ".webmanifest": "application/manifest+json",
          } as Record<string, string>
        )[extname(relative)] ?? "application/octet-stream",
      );
      res.end(data);
    } catch {
      res.statusCode = 404;
      res.end("Not found");
    }
  });
  const wss = new WebSocketServer({ noServer: true, maxPayload: 8192 });
  // Bounded IP quotas also apply across reconnects. No addresses or credentials are logged.
  const quotas = new Map<string, { time: number; count: number }>();
  server.on("upgrade", (req, socket, head) => {
    const ip = clientAddress(req),
      now = Date.now();
    let q = quotas.get(ip);
    if (!q || now - q.time > 60000) {
      q = { time: now, count: 0 };
      quotas.set(ip, q);
    }
    let originOK = false;
    try {
      const origin = new URL(req.headers.origin ?? "");
      originOK = origin.host === req.headers.host;
    } catch {}
    if (req.url !== "/ws" || !originOK || ++q.count > 120) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) =>
      wss.emit("connection", ws, req),
    );
  });
  wss.on("connection", (ws, req) => {
    let window = Date.now(),
      count = 0,
      alive = true;
    ws.on("pong", () => (alive = true));
    const heartbeat = setInterval(() => {
      if (!alive) {
        ws.terminate();
        return;
      }
      alive = false;
      ws.ping();
    }, 30000);
    let chain = Promise.resolve();
    ws.on("message", (data) => {
      chain = chain
        .then(async () => {
          const now = Date.now();
          if (now - window > 10000) {
            window = now;
            count = 0;
          }
          if (++count > 40) {
            ws.close(1008, "rate limit");
            return;
          }
          const ip = clientAddress(req);
          let q = quotas.get(ip);
          if (!q || now - q.time > 60000) {
            q = { time: now, count: 0 };
            quotas.set(ip, q);
          }
          try {
            const raw = JSON.parse(data.toString());
            if (
              ["create", "join", "resume", "watch"].includes(raw?.type) &&
              ++q.count > 120
            ) {
              ws.close(1008, "rate limit");
              return;
            }
            const principal = await principalFor(
              authRuntime.auth,
              req.headers,
              store,
            );
            if (ws.readyState !== 1) return;
            // Recheck revocation synchronously between async verification and commit.
            if (principal && !authRuntime.sessionAlive(principal)) {
              rooms.revokeSession(principal.sessionId);
              ws.close(4003, "signed out");
              return;
            }
            rooms.handle(ws, raw, principal);
          } catch {
            ws.send(
              JSON.stringify({
                type: "error",
                error: "อ่านคำสั่งไม่ได้ กรุณาโหลดหน้าใหม่",
              }),
            );
          }
        })
        .catch(() => {
          if (ws.readyState === 1) ws.close(1011, "request failed");
        });
    });
    ws.on("close", () => {
      clearInterval(heartbeat);
      if (!closing) try { rooms.disconnect(ws); } catch { /* Presence lease expires if storage is temporarily down. */ }
    });
    ws.on("error", () => ws.terminate());
  });
  const cleanup = setInterval(() => {
    try { rooms.sweep(); } catch { /* Retry on next interval; do not discard persisted rooms. */ }
    const now = Date.now();
    for (const [ip, q] of quotas) if (now - q.time > 60000) quotas.delete(ip);
  }, 60000);
  cleanup.unref();
  const delivery = store.distributed ? setInterval(() => {
    if (!wss.clients.size) return;
    try { rooms.poll(); } catch { for (const ws of wss.clients) ws.close(1011,"storage unavailable; reconnect"); }
  }, 1000) : undefined;
  delivery?.unref();
  if (options.listen !== false) await new Promise<void>((r) => server.listen(port, host, r));
  const actualPort = (server.address() as import("node:net").AddressInfo | null)?.port ?? port;
  const baseURL =
    options.baseURL ??
    (options.legacyHarness
      ? `http://127.0.0.1:${actualPort}`
      : (process.env.BETTER_AUTH_URL ?? `http://localhost:${actualPort}`));
  try {
    authRuntime = await createAuth(
      store,
      (oldId, newId, profile) => rooms.linkGuest(oldId, newId, profile),
      baseURL,
    );
    handlePlatform = platformHandler(authRuntime.auth, store, rooms, baseURL);
  } catch (e) {
    clearInterval(cleanup);
    clearInterval(delivery);
    await vite?.close();
    server.close();
    store.close();
    throw e;
  }
  return {
    server,
    wss,
    rooms,
    store,
    auth: authRuntime.auth,
    close: async () => {
      closing = true;
      clearInterval(cleanup);
      clearInterval(delivery);
      for (const ws of wss.clients) ws.terminate();
      await vite?.close();
      await new Promise<void>((r) => server.close(() => r()));
      authRuntime.close();
      store.close();
    },
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (existsSync(".env")) process.loadEnvFile(".env");
  const app = await startServer();
  console.log(`GameVerse listening on port ${(app.server.address() as any).port}`);
  for (const signal of ["SIGINT", "SIGTERM"] as const) process.once(signal, () => {
    void app.close().then(() => process.exit(0), () => process.exit(1));
  });
}
