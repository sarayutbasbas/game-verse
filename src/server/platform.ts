import type { IncomingMessage, ServerResponse } from "node:http";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import type { createAuth, Principal } from "./auth.js";
import type { RoomService } from "./rooms.js";
import type { PlatformStore } from "./store.js";
type Auth = Awaited<ReturnType<typeof createAuth>>["auth"];
export const safeReturn = (input: unknown) =>
  typeof input === "string" &&
  /^\/(?:$|(?:games|play|display)\/[a-zA-Z0-9-]+\/?$|(?:join|profile|login)\/?$)/.test(
    input,
  )
    ? input
    : "/";
export async function principalFor(
  auth: Auth,
  headers: IncomingMessage["headers"],
  store: PlatformStore,
): Promise<Principal | undefined> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(headers),
  });
  if (!session) return;
  const profile = store.profile(session.user);
  return {
    id: session.user.id,
    guest: profile.guest,
    name: String(profile.name),
    avatar: profile.avatar as string | null,
    sessionId: session.session.id,
    expiresAt: new Date(session.session.expiresAt).getTime(),
  };
}
async function body(req: IncomingMessage, max = 16384): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > max) throw Error("ไฟล์หรือคำสั่งใหญ่เกินกำหนด");
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
export function platformHandler(
  auth: Auth,
  store: PlatformStore,
  rooms: RoomService,
  baseURL: string,
) {
  const nodeAuth = toNodeHandler(auth),
    uploadDir = resolve(process.env.GAMEVERSE_UPLOAD_DIR ?? "./data/avatars");
  let joinOrigin: string | undefined;
  if (process.env.GAMEVERSE_JOIN_ORIGIN) {
    const candidate = new URL(process.env.GAMEVERSE_JOIN_ORIGIN);
    if (
      !["http:", "https:"].includes(candidate.protocol) ||
      candidate.pathname !== "/" ||
      candidate.search ||
      candidate.hash ||
      candidate.username ||
      candidate.password
    )
      throw Error("GAMEVERSE_JOIN_ORIGIN must be an HTTP(S) origin");
    joinOrigin = candidate.origin;
  }
  const quotas = new Map<string, { at: number; n: number }>();
  const json = (res: ServerResponse, status: number, value: unknown) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(value));
  };
  const invalid = (res: ServerResponse, message: string, status = 400) =>
    json(res, status, { error: message });
  return async (
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<boolean> => {
    const path = new URL(req.url ?? "/", baseURL).pathname;
    if (!path.startsWith("/api/") && !path.startsWith("/avatars/"))
      return false;
    try {
      if (path.startsWith("/avatars/")) {
        if (!/^\/avatars\/[a-f0-9-]{36}\.webp$/.test(path)) {
          invalid(res, "ไม่พบรูป", 404);
          return true;
        }
        res.setHeader("Content-Type", "image/webp");
        res.setHeader("Cache-Control", "public,max-age=31536000,immutable");
        if (store.distributed) {
          const row = store.db.prepare("SELECT data FROM gv_avatars WHERE name=?").get(path.slice(9));
          if (!row) { res.statusCode=404; res.end(); }
          else res.end(Buffer.from(String(row.data),"base64"));
        } else res.end(await readFile(resolve(uploadDir, path.slice(9))));
        return true;
      }
      const ip = req.socket.remoteAddress ?? "unknown",
        now = Date.now();
      req.headers["x-gameverse-ip"] = ip; // Never trust caller-supplied forwarding headers.
      if (quotas.size > 4096)
        for (const [k, v] of quotas) if (now - v.at > 60000) quotas.delete(k);
      let q = quotas.get(ip);
      if (!q || now - q.at > 60000) {
        q = { at: now, n: 0 };
        quotas.set(ip, q);
      }
      if (++q.n > 180) {
        invalid(res, "ทำรายการถี่เกินไป รอสักครู่", 429);
        return true;
      }
      if (path === "/api/auth/error") {
        res.statusCode = 303;
        res.setHeader("Location", "/login?error=auth");
        res.end();
        return true;
      }
      if (path.startsWith("/api/auth/")) {
        if (
          !/^\/api\/auth\/(get-session|sign-in\/anonymous|sign-in\/social|callback\/google|sign-out|error)$/.test(
            path,
          )
        ) {
          invalid(res, "ไม่รองรับการทำรายการนี้", 404);
          return true;
        }
        const signedOut =
          path === "/api/auth/sign-out"
            ? await principalFor(auth, req.headers, store)
            : undefined;
        if (req.method === "POST") {
          const raw = await body(req);
          const data = JSON.parse(raw.toString() || "{}");
          for (const k of [
            "callbackURL",
            "newUserCallbackURL",
            "errorCallbackURL",
          ])
            if (data[k] !== undefined && data[k] !== safeReturn(data[k]))
              throw Error("ลิงก์กลับต้องเป็นหน้าใน GameVerse");
          const result = await auth.handler(
            new Request(
              new URL(
                req.url ?? "/",
                `${new URL(baseURL).protocol}//${req.headers.host}`,
              ),
              {
                method: "POST",
                headers: fromNodeHeaders(req.headers),
                body: raw.toString(),
              },
            ),
          );
          res.statusCode = result.status;
          result.headers.forEach((value, key) => {
            if (key !== "set-cookie") res.setHeader(key, value);
          });
          const cookies = result.headers.getSetCookie();
          if (cookies.length) res.setHeader("Set-Cookie", cookies);
          if (signedOut && result.ok) rooms.revokeSession(signedOut.sessionId);
          res.end(Buffer.from(await result.arrayBuffer()));
        } else await nodeAuth(req, res);
        return true;
      }
      const p = await principalFor(auth, req.headers, store);
      if (path === "/api/platform" && req.method === "GET") {
        json(res, 200, {
          games: store.catalog(),
          joinOrigin,
          googleOrigin: new URL(baseURL).origin,
          googleEnabled: !!(
            process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
          ),
          profile: p
            ? store.profile(
                (await auth.api.getSession({
                  headers: fromNodeHeaders(req.headers),
                }))!.user,
              )
            : null,
          recent: p ? store.recent(p.id) : [],
          rooms: p ? rooms.active(p.id) : [],
        });
        return true;
      }
      if (!p) {
        invalid(res, "กรุณาล็อกอินหรือเลือก Guest ก่อน", 401);
        return true;
      }
      if (req.method !== "GET") {
        let same = false;
        try {
          same = new URL(req.headers.origin ?? "").host === req.headers.host;
        } catch {}
        if (!same) {
          invalid(res, "ต้นทางคำสั่งไม่ถูกต้อง", 403);
          return true;
        }
      }
      if (path === "/api/profile" && req.method === "PATCH") {
        const data = JSON.parse((await body(req)).toString());
        if (
          Object.keys(data).some((k) => k !== "name") ||
          typeof data.name !== "string" ||
          !data.name.trim() ||
          data.name.trim().length > 24 ||
          /[\p{C}]/u.test(data.name)
        )
          throw Error("ใช้ชื่อ 1–24 ตัวอักษร ไม่มีอักขระควบคุม");
        rooms.updateProfile(p.id, data.name.trim(), p.avatar, () =>
          store.db
            .prepare(
              "INSERT INTO gv_profiles(user_id,name) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET name=excluded.name",
            )
            .run(p.id, data.name.trim()),
        );
        json(res, 200, { ok: true });
        return true;
      }
      if (
        path === "/api/profile/avatar" &&
        (req.method === "PUT" || req.method === "DELETE")
      ) {
        let url: string | null = null,
          source = "default";
        if (req.method === "PUT") {
          if (
            !["image/png", "image/jpeg", "image/webp"].includes(
              String(req.headers["content-type"]),
            )
          )
            throw Error("ใช้รูป PNG, JPEG หรือ WebP");
          const raw = await body(req, 2 * 1024 * 1024);
          const image = sharp(raw, {
            limitInputPixels: 16_000_000,
            animated: false,
          });
          const meta = await image.metadata();
          if (
            !["png", "jpeg", "webp"].includes(meta.format ?? "") ||
            (meta.pages ?? 1) > 1
          )
            throw Error("ใช้รูปภาพนิ่ง PNG, JPEG หรือ WebP");
          const bytes = await image
            .rotate()
            .resize(256, 256, { fit: "cover" })
            .webp({ quality: 82 })
            .toBuffer();
          const file = randomUUID() + ".webp";
          if (store.distributed) store.db.prepare("INSERT INTO gv_avatars VALUES(?,?)").run(file,bytes.toString("base64"));
          else {
            await mkdir(uploadDir, { recursive: true, mode: 0o700 });
            await writeFile(resolve(uploadDir, file), bytes, { mode: 0o600 });
          }
          url = "/avatars/" + file;
          source = "upload";
        }
        const current = store.db
          .prepare("SELECT name,avatar FROM gv_profiles WHERE user_id=?")
          .get(p.id);
        const old = current ? current.avatar : p.avatar;
        const currentName = current ? String(current.name) : p.name;
        try {
          rooms.updateProfile(p.id, currentName, url, () =>
            store.db
              .prepare(
                "INSERT INTO gv_profiles VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET avatar=excluded.avatar,avatar_source=excluded.avatar_source",
              )
              .run(p.id, currentName, url, source),
          );
        } catch (e) {
          if (url && store.distributed) store.db.prepare("DELETE FROM gv_avatars WHERE name=?").run(url.slice(9));
          else if (url)
            await unlink(resolve(uploadDir, url.slice(9))).catch(() => {});
          throw e;
        }
        if (typeof old === "string" && old.startsWith("/avatars/")) {
          if (store.distributed) store.db.prepare("DELETE FROM gv_avatars WHERE name=?").run(old.slice(9));
          else await unlink(resolve(uploadDir, old.slice(9))).catch(() => {});
        }
        json(res, 200, { ok: true });
        return true;
      }
      if (path === "/api/rooms/leave" && req.method === "POST") {
        const data = JSON.parse((await body(req)).toString());
        if (
          typeof data.code !== "string" ||
          !/^[A-Z2-9]{6}$/.test(data.code) ||
          typeof data.close !== "boolean"
        )
          throw Error("คำสั่งไม่ถูกต้อง");
        rooms.leave(p.id, data.code, data.close);
        json(res, 200, { ok: true });
        return true;
      }
      if (path.startsWith("/api/admin")) {
        if (p.guest || !store.admin(p.id)) {
          invalid(res, "ไม่มีสิทธิ์ผู้ดูแล", 403);
          return true;
        }
        if (path === "/api/admin" && req.method === "GET") {
          json(res, 200, {
            games: store.catalog(),
            rooms: [...rooms.rooms.values()].map((r) => ({
              code: r.code,
              gameId: r.gameId,
              rulesVersion: r.rulesVersion,
              schemaVersion: r.schemaVersion,
              revision: r.revision,
              phase: r.game?.phase ?? r.duel?.phase ?? r.azul?.phase ?? "lobby",
              players: r.players.length,
              connected: r.sockets.size,
              updatedAt: r.updated,
            })),
            quarantined: store.quarantined,
          });
          return true;
        }
        if (path === "/api/admin/games" && req.method === "PATCH") {
          const data = JSON.parse((await body(req)).toString());
          if (
            !store.catalog().some((g) => g.id === data.gameId) ||
            !["ready", "maintenance"].includes(data.status)
          )
            throw Error("เลือกเกมและสถานะที่รองรับ");
          store.db
            .prepare(
              "INSERT INTO gv_game_settings VALUES(?,?) ON CONFLICT(game_id) DO UPDATE SET status=excluded.status",
            )
            .run(data.gameId, data.status);
          json(res, 200, { ok: true });
          return true;
        }
      }
      invalid(res, "ไม่พบรายการ", 404);
    } catch (e) {
      invalid(
        res,
        (e as Error).message.includes("SQL")
          ? "ทำรายการไม่สำเร็จ"
          : (e as Error).message,
      );
    }
    return true;
  };
}
