import { betterAuth, type BetterAuthOptions } from "better-auth";
import { anonymous } from "better-auth/plugins/anonymous";
import { getMigrations } from "better-auth/db/migration";
import { DatabaseSync } from "node:sqlite";
import { setSessionCookie } from "better-auth/cookies";
import { APIError } from "better-auth/api";
import { randomBytes, randomUUID } from "node:crypto";
import type { PlatformStore } from "./store.js";
import { postgresPool } from "./postgres.js";
export interface Principal {
  id: string;
  guest: boolean;
  name: string;
  avatar: string | null;
  sessionId: string;
  expiresAt: number;
}
export async function createAuth(
  store: PlatformStore,
  link: (
    oldId: string,
    newId: string,
    profile?: { name: string; avatar: string | null },
  ) => void,
  baseURL: string,
) {
  const secret =
    process.env.BETTER_AUTH_SECRET ||
    (() => {
      if (process.env.NODE_ENV === "production")
        throw Error(
          "Set BETTER_AUTH_SECRET in server .env before production start",
        );
      store.db.exec(
        "CREATE TABLE IF NOT EXISTS gv_local_secret (id INTEGER PRIMARY KEY CHECK(id=1), secret TEXT NOT NULL)",
      );
      const old = store.db
        .prepare("SELECT secret FROM gv_local_secret WHERE id=1")
        .get();
      if (old) return String(old.secret);
      const value = randomBytes(48).toString("base64");
      store.db.prepare("INSERT INTO gv_local_secret VALUES(1,?)").run(value);
      return value;
    })();
  const authDb = store.distributed ? undefined : new DatabaseSync(store.path);
  authDb?.exec(
    "PRAGMA journal_mode=WAL;PRAGMA foreign_keys=ON;PRAGMA busy_timeout=5000;",
  );
  const options = {
    appName: "GameVerse",
    baseURL,
    secret,
    database: store.distributed ? postgresPool(store.path) : authDb!,
    logger: {
      level: "error",
      log: () =>
        console.error(
          JSON.stringify({ event: "auth_error", correlationId: randomUUID() }),
        ),
    },
    trustedOrigins: [
      baseURL,
      ...(process.env.GAMEVERSE_TRUSTED_ORIGINS ?? "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    ],
    socialProviders:
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            },
          }
        : {},
    account: { accountLinking: { enabled: false } },
    session: {
      cookieCache: { enabled: false },
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    plugins: [
      anonymous({
        disableDeleteAnonymousUser: true,
        generateName: () => "ผู้เล่น Guest",
        onLinkAccount: async ({ anonymousUser, newUser, ctx }) => {
          try {
            const p = store.profile(newUser.user);
            link(anonymousUser.user.id, newUser.user.id, {
              name:
                String(p.name)
                  .replace(/[\p{C}]/gu, "")
                  .slice(0, 24) || "ผู้เล่น",
              avatar: p.avatar as string | null,
            });
          } catch {
            await setSessionCookie(ctx, anonymousUser);
            throw APIError.from("CONFLICT", {
              code: "GUEST_SEAT_CONFLICT",
              message:
                "บัญชีนี้มีที่นั่งในห้องเดียวกันแล้ว เซสชัน Guest เดิมยังใช้ได้ กรุณาออกจากห้องรอก่อนเชื่อมบัญชี",
            });
          }
        },
      }),
    ],
    advanced: {
      ipAddress: { ipAddressHeaders: ["x-gameverse-ip"] },
      defaultCookieAttributes: {
        sameSite: "lax",
        httpOnly: true,
        secure: baseURL.startsWith("https:"),
      },
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 180,
      customRules: {
        "/sign-in/anonymous": { window: 60, max: 40 },
        "/sign-in/social": { window: 60, max: 20 },
      },
    },
  } satisfies BetterAuthOptions;
  if (!store.distributed || process.env.GAMEVERSE_MIGRATE === "1")
    await (await getMigrations(options)).runMigrations();
  const auth = betterAuth(options);
  await auth.$context;
  const adminId = process.env.GAMEVERSE_BOOTSTRAP_ADMIN_USER_ID;
  if (
    adminId &&
    store.db
      .prepare("SELECT 1 FROM user WHERE id=? AND isAnonymous=0")
      .get(adminId)
  )
    store.db
      .prepare("INSERT OR IGNORE INTO gv_roles VALUES(?,'admin')")
      .run(adminId);
  return {
    auth,
    sessionAlive: (p: Principal) =>
      p.expiresAt > Date.now() &&
      !!(store.distributed ? store.db : authDb!)
        .prepare("SELECT 1 FROM session WHERE id=? AND userId=?")
        .get(p.sessionId, p.id),
    close: () => { if (authDb) authDb.close(); else void (options.database as ReturnType<typeof postgresPool>).end(); },
  };
}
