import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { WebSocket } from "ws";
import sharp from "sharp";
import { startServer } from "../src/server/index.js";
import {
  GAME_CATALOG,
  filterGames,
  supportsPlayers,
} from "../src/shared/catalog.js";
import { safeReturn } from "../src/server/platform.js";
import { PlatformStore } from "../src/server/store.js";

test("catalog: Thai/English aliases + exact player count, discontinuous counts, no engine import", () => {
  assert.deepEqual(
    filterGames(GAME_CATALOG, "  อูฐ  ", 4).map((g) => g.id),
    ["camel-up"],
  );
  assert.equal(filterGames(GAME_CATALOG, "DRACULA", 4).length, 0);
  assert.equal(filterGames(GAME_CATALOG, "  van helsing ", 2).length, 1);
  assert.equal(
    supportsPlayers({ ...GAME_CATALOG[0], supportedCounts: [3, 5, 8] }, 4),
    false,
  );
  assert.equal(
    supportsPlayers({ ...GAME_CATALOG[0], supportedCounts: [3, 5, 8] }, 5),
    true,
  );
});
test("OAuth return paths disallow external, protocol-relative, encoded redirect and unknown path", () => {
  for (const s of [
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/%2f%2fevil.example",
    "/api/auth/callback/google",
    "/play/ABC234?next=https://evil.example",
  ])
    assert.equal(safeReturn(s), "/");
  assert.equal(safeReturn("/play/ABC234"), "/play/ABC234");
});
class Peer {
  ws!: WebSocket;
  messages: any[] = [];
  async connect(url: string, cookie = "") {
    this.ws = new WebSocket(url.replace("http", "ws") + "/ws", {
      origin: url,
      headers: cookie ? { Cookie: cookie } : {},
    });
    this.ws.on("message", (raw) =>
      this.messages.push(JSON.parse(raw.toString())),
    );
    await new Promise<void>((r, j) => {
      this.ws.once("open", r);
      this.ws.once("error", j);
    });
    return this;
  }
  async send(value: any, type: string) {
    const from = this.messages.length;
    this.ws.send(JSON.stringify(value));
    return this.wait((m) => m.type === type, from);
  }
  async wait(predicate: (m: any) => boolean, from = 0) {
    for (let i = 0; i < 1000; i++) {
      const m = this.messages.slice(from).find(predicate);
      if (m) return m;
      await new Promise((r) => setTimeout(r, 5));
    }
    throw Error("Expected protocol response not received");
  }
  get view() {
    return this.messages.filter((m) => m.type === "state").at(-1)?.view;
  }
  async command(action: any, revision = this.view.revision, id = randomUUID()) {
    return this.send({ type: "command", id, revision, action }, "ack");
  }
}
test("real HTTP/cookies/WS/SQLite: account owners, Guests, privacy, profile, linking, maintenance, rollback, restart and logout", async () => {
  const dir = await mkdtemp(join(tmpdir(), "gameverse-test-")),
    path = join(dir, "platform.sqlite");
  let app = await startServer(0, "127.0.0.1", true, () => 0.42, {
    storePath: path,
  });
  let url = `http://localhost:${(app.server.address() as any).port}`;
  const peers: Peer[] = [];
  const make = async (cookie = "") => {
    const p = await new Peer().connect(url, cookie);
    peers.push(p);
    return p;
  };
  const request = async (
    route: string,
    method = "GET",
    cookie = "",
    data?: unknown,
  ) =>
    fetch(url + route, {
      method,
      headers: {
        Origin: url,
        ...(cookie ? { Cookie: cookie } : {}),
        ...(data ? { "Content-Type": "application/json" } : {}),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  const identity = async (account = false) => {
    const res = await request("/api/auth/sign-in/anonymous", "POST", "", {});
    assert.equal(res.status, 200);
    const v = await res.json(),
      cookie = res.headers
        .getSetCookie()
        .map((c) => c.split(";")[0])
        .join("; ");
    if (account)
      await (
        await app.auth.$context
      ).internalAdapter.updateUser(v.user.id, { isAnonymous: false });
    return { id: v.user.id, cookie }; // Fixtures do not simulate the Google provider.
  };
  try {
    const visitor = await make();
    assert.match(
      (await visitor.send({ type: "create", gameId: "camel-up" }, "error"))
        .error,
      /Google/,
    );
    const owner = await identity(true),
      g1 = await identity(),
      g2 = await identity(),
      g3 = await identity(),
      other = await identity(true);
    const guestPeer = await make(g1.cookie);
    assert.match(
      (await guestPeer.send({ type: "create" }, "error")).error,
      /Google/,
    );
    const host = await make(owner.cookie),
      h = await host.send({ type: "create", gameId: "camel-up" }, "session");
    await host.wait((m) => m.type === "state");
    const publicBefore = await (await request("/api/platform")).json();
    assert.deepEqual(publicBefore.rooms, []);
    assert.deepEqual(
      (await (await request("/api/platform", "GET", other.cookie)).json())
        .rooms,
      [],
    );
    const sessions: any[] = [];
    for (const [identity, name] of [
      [g1, "หนึ่ง"],
      [g2, "สอง"],
      [g3, "สาม"],
    ] as const) {
      const p = identity === g1 ? guestPeer : await make(identity.cookie);
      const s = await p.send({ type: "join", code: h.code, name }, "session");
      sessions.push({ peer: p, session: s, identity });
      await p.wait((m) => m.type === "state");
    }
    const viewer = await make();
    await viewer.send({ type: "watch", code: h.code }, "state");
    assert.equal(viewer.view.me, undefined);
    assert.equal(JSON.stringify(viewer.view).includes(g1.id), false);
    assert.equal(JSON.stringify(viewer.view).includes("token"), false);
    const extra = await make(g1.cookie);
    const same = await extra.send(
      { type: "join", code: h.code, name: "ชื่อซ้ำ" },
      "session",
    );
    assert.equal(same.playerId, sessions[0].session.playerId);
    assert.equal(app.rooms.rooms.get(h.code)!.players.length, 3);
    sessions[0].peer = extra;
    await host.send({ type: "sync" }, "state");
    assert.equal(
      (await host.command({ type: "start", startingPlayerId: same.playerId }))
        .ok,
      true,
    );
    assert.equal(
      (await (await request("/api/platform", "GET", g1.cookie)).json())
        .recent[0].gameId,
      "camel-up",
    );
    assert.equal(
      (await (await request("/api/platform", "GET", g1.cookie)).json()).recent
        .length,
      1,
    );
    await viewer.send({ type: "sync" }, "state");
    assert.equal(viewer.view.me, undefined);
    const invalid = await request("/api/profile", "PATCH", g1.cookie, {
      name: "ยึดบัญชี",
      userId: owner.id,
      role: "admin",
    });
    assert.equal(invalid.status, 400);
    assert.equal(
      (await request("/api/profile", "PATCH", g1.cookie, { name: "ชื่อใหม่" }))
        .status,
      200,
    );
    await extra.send({ type: "sync" }, "state");
    assert.equal(
      extra.view.players.find((p: any) => p.id === same.playerId).name,
      "ชื่อใหม่",
    );
    const image = await sharp({
      create: { width: 16, height: 16, channels: 3, background: "#347b86" },
    })
      .png()
      .toBuffer();
    const upload = await fetch(url + "/api/profile/avatar", {
      method: "PUT",
      headers: { Origin: url, Cookie: g1.cookie, "Content-Type": "image/png" },
      body: new Uint8Array(image),
    });
    assert.equal(upload.status, 200);
    const profile = await (
      await request("/api/platform", "GET", g1.cookie)
    ).json();
    assert.match(profile.profile.avatar, /^\/avatars\/[\w-]+\.webp$/);
    assert.equal((await fetch(url + profile.profile.avatar)).status, 200);
    assert.equal(
      (
        await fetch(url + "/api/profile/avatar", {
          method: "PUT",
          headers: {
            Origin: url,
            Cookie: g1.cookie,
            "Content-Type": "image/svg+xml",
          },
          body: "<svg/>",
        })
      ).status,
      400,
    );
    assert.equal(
      (await request("/api/profile/avatar", "DELETE", g1.cookie)).status,
      200,
    );
    assert.equal(
      (await (await request("/api/platform", "GET", g1.cookie)).json()).profile
        .avatar,
      null,
    );
    assert.equal((await request("/api/admin", "GET", g1.cookie)).status, 403);
    app.store.db
      .prepare("INSERT INTO gv_roles VALUES(?,'admin')")
      .run(owner.id);
    assert.equal(
      (
        await request("/api/admin/games", "PATCH", owner.cookie, {
          gameId: "camel-up",
          status: "maintenance",
        })
      ).status,
      200,
    );
    const owner2 = await make(owner.cookie);
    assert.match(
      (await owner2.send({ type: "create", gameId: "camel-up" }, "error"))
        .error,
      /พัก/,
    );
    const before = structuredClone(app.rooms.rooms.get(h.code)!.game);
    const revision = app.rooms.rooms.get(h.code)!.revision;
    const original = app.store.saveRooms.bind(app.store);
    app.store.saveRooms = () => {
      throw Error("fixture disk failure");
    };
    assert.match(
      (
        await extra.send(
          {
            type: "command",
            id: randomUUID(),
            revision,
            action: { type: "roll" },
          },
          "error",
        )
      ).error,
      /บันทึก/,
    );
    assert.deepEqual(app.rooms.rooms.get(h.code)!.game, before);
    assert.equal(app.rooms.rooms.get(h.code)!.revision, revision);
    app.store.saveRooms = original;
    const id = randomUUID(),
      accepted = await extra.command({ type: "roll" }, revision, id);
    assert.equal(accepted.ok, true);
    app.rooms.sweep(Date.now() + 9 * 3600000);
    assert.ok(app.rooms.rooms.has(h.code), "rooms remain available within the 10-hour idle window");
    // Verified callback link transfer is tested directly; OAuth provider is not faked.
    app.rooms.linkGuest(g1.id, other.id);
    assert.equal(
      app.rooms.rooms.get(h.code)!.players.find((p) => p.id === same.playerId)!
        .userId,
      other.id,
    );
    assert.equal(app.rooms.rooms.get(h.code)!.players.length, 3);
    assert.equal(app.store.recent(other.id).length, 1);
    const conflict = await identity(true),
      peerConflict = await make(conflict.cookie),
      second = await peerConflict.send(
        { type: "create", gameId: "dracula-vs-van-helsing" },
        "session",
      );
    const a = await make(g2.cookie),
      b = await make(other.cookie);
    await a.send({ type: "join", code: second.code, name: "Guest" }, "session");
    await b.send(
      { type: "join", code: second.code, name: "Account" },
      "session",
    );
    assert.throws(() => app.rooms.linkGuest(g2.id, other.id), /ที่นั่ง/);
    assert.equal(app.rooms.rooms.get(second.code)!.players.length, 2);
    for (const p of peers) p.ws.terminate();
    await app.close();
    app = await startServer(0, "127.0.0.1", true, () => 0.99, {
      storePath: path,
    });
    url = `http://localhost:${(app.server.address() as any).port}`;
    const recovered = app.rooms.rooms.get(h.code)!;
    assert.equal(recovered.revision, accepted.revision);
    assert.deepEqual(
      recovered.game,
      app.store.loadRooms().find((r) => r.code === h.code).game,
    );
    const restored = await make(other.cookie);
    await restored.send(
      { type: "resume", code: h.code, token: same.token },
      "state",
    );
    assert.equal(restored.view.me.id, same.playerId);
    const repeated = await restored.command({ type: "roll" }, revision, id);
    assert.equal(repeated.ok, true);
    assert.equal(repeated.revision, accepted.revision);
    assert.equal(app.rooms.rooms.get(h.code)!.revision, accepted.revision);
    const attacker = await make(g1.cookie);
    assert.match(
      (
        await attacker.send(
          { type: "resume", code: h.code, token: same.token },
          "error",
        )
      ).error,
      /セ|เซสชัน/,
    );
    const closed = new Promise<number>((r) =>
      restored.ws.once("close", (code) => r(code)),
    );
    assert.equal(
      (await request("/api/auth/sign-out", "POST", other.cookie, {})).status,
      200,
    );
    assert.equal(await closed, 4003);
    const stale = await make(other.cookie);
    assert.match(
      (
        await stale.send(
          { type: "resume", code: h.code, token: same.token },
          "error",
        )
      ).error,
      /เซสชัน/,
    );
    const unsafe = await request("/api/auth/sign-in/social", "POST", "", {
      provider: "google",
      callbackURL: "https://evil.example",
    });
    assert.equal(unsafe.status, 400);
  } finally {
    for (const p of peers) p.ws.terminate();
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("room version mismatch is quarantined without deleting persisted state", () => {
  const store = new PlatformStore(":memory:");
  const g = GAME_CATALOG[0];
  store.db
    .prepare("INSERT INTO gv_rooms VALUES(?,?,?,?,?,?,?)")
    .run("ABC234", g.id, "future-edition", 99, 0, Date.now(), "{}");
  assert.deepEqual(store.loadRooms(), []);
  assert.equal(store.quarantined.length, 1);
  assert.equal(
    store.db.prepare("SELECT COUNT(*) AS n FROM gv_rooms").get()!.n,
    1,
  );
  store.close();
});

test("legacy capability adoption preserves a playing seat/cards/revision and enforces account ownership after migration", async () => {
  const dir = await mkdtemp(join(tmpdir(), "gameverse-legacy-")),
    path = join(dir, "rooms.sqlite");
  let app = await startServer(0, "127.0.0.1", true, () => 0.42, {
    storePath: path,
    legacyHarness: true,
  });
  let url = `http://127.0.0.1:${(app.server.address() as any).port}`;
  const peers: Peer[] = [];
  const make = async (cookie = "") => {
    const p = await new Peer().connect(url, cookie);
    peers.push(p);
    return p;
  };
  try {
    const host = await make(),
      h = await host.send(
        { type: "create", gameId: "dracula-vs-van-helsing" },
        "session",
      );
    await host.wait((m) => m.type === "state");
    const seats: any[] = [];
    for (const [i, character] of ["dracula", "helsing"].entries()) {
      const p = await make(),
        s = await p.send(
          { type: "join", code: h.code, name: "เดิม " + i },
          "session",
        );
      await p.wait((m) => m.type === "state");
      assert.equal(
        (await p.command({ type: "choose-role", character })).ok,
        true,
      );
      assert.equal((await p.command({ type: "ready", ready: true })).ok, true);
      seats.push({ p, s });
    }
    await host.send({ type: "sync" }, "state");
    assert.equal((await host.command({ type: "start" })).ok, true);
    const original = JSON.parse(
        JSON.stringify(app.rooms.rooms.get(h.code)!.duel),
      ),
      revision = app.rooms.rooms.get(h.code)!.revision;
    for (const p of peers) p.ws.terminate();
    await app.close();
    app = await startServer(0, "127.0.0.1", true, () => 0.99, {
      storePath: path,
    });
    url = `http://localhost:${(app.server.address() as any).port}`;
    const res = await fetch(url + "/api/auth/sign-in/anonymous", {
      method: "POST",
      headers: { Origin: url, "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(res.status, 200);
    const cookie = res.headers
        .getSetCookie()
        .map((c) => c.split(";")[0])
        .join("; "),
      user = (await res.json()).user;
    const restored = await make(cookie);
    await restored.send(
      { type: "resume", code: h.code, token: seats[0].s.token },
      "state",
    );
    assert.equal(restored.view.me.id, seats[0].s.playerId);
    assert.deepEqual(restored.view.me.cards, original!.players[0].cards);
    assert.equal(restored.view.revision, revision);
    assert.equal(app.rooms.rooms.get(h.code)!.players[0].userId, user.id);
    assert.deepEqual(app.rooms.rooms.get(h.code)!.duel, original);
    assert.equal(
      app.store
        .loadRooms()[0]
        .sessions.find((s: any) => s.playerId === seats[0].s.playerId).userId,
      user.id,
    );
    const unauthorized = await make();
    assert.match(
      (
        await unauthorized.send(
          { type: "resume", code: h.code, token: seats[0].s.token },
          "error",
        )
      ).error,
      /เซสชัน/,
    );
    const conflict = await make(cookie);
    assert.match(
      (
        await conflict.send(
          { type: "resume", code: h.code, token: seats[1].s.token },
          "error",
        )
      ).error,
      /อีกที่นั่ง/,
    );
    assert.equal(app.rooms.rooms.get(h.code)!.players.length, 2);
  } finally {
    for (const p of peers) p.ws.terminate();
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("owner phone can start while shared display stays public; another player cannot gain host permission", async () => {
  const dir = await mkdtemp(join(tmpdir(), "gameverse-owner-")),
    path = join(dir, "rooms.sqlite");
  const app = await startServer(0, "127.0.0.1", true, () => 0.42, {
      storePath: path,
    }),
    url = `http://localhost:${(app.server.address() as any).port}`,
    peers: Peer[] = [];
  const make = async (cookie = "") => {
    const p = await new Peer().connect(url, cookie);
    peers.push(p);
    return p;
  };
  const identity = async (account = false) => {
    const r = await fetch(url + "/api/auth/sign-in/anonymous", {
      method: "POST",
      headers: { Origin: url, "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(r.status, 200);
    const v = await r.json();
    if (account)
      await (
        await app.auth.$context
      ).internalAdapter.updateUser(v.user.id, { isAnonymous: false });
    return r.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");
  };
  try {
    const owner = await identity(true),
      guestCookie = await identity(),
      host = await make(owner),
      h = await host.send(
        { type: "create", gameId: "dracula-vs-van-helsing" },
        "session",
      );
    const board = await make();
    await board.send({ type: "watch", code: h.code }, "state");
    assert.equal(board.view.me, undefined);
    const phone = await make(owner),
      guest = await make(guestCookie);
    for (const [p, character] of [
      [phone, "dracula"],
      [guest, "helsing"],
    ] as const) {
      await p.send({ type: "join", code: h.code, name: character }, "session");
      await p.wait((m) => m.type === "state");
      assert.equal(
        (await p.command({ type: "choose-role", character })).ok,
        true,
      );
      assert.equal((await p.command({ type: "ready", ready: true })).ok, true);
    }
    await phone.send({ type: "sync" }, "state");
    await guest.send({ type: "sync" }, "state");
    assert.equal(phone.view.me.canManage, true);
    assert.equal(guest.view.me.canManage, false);
    assert.equal((await guest.command({ type: "start" })).ok, false);
    await phone.send({ type: "sync" }, "state");
    assert.equal((await phone.command({ type: "start" })).ok, true);
    await board.send({ type: "sync" }, "state");
    assert.equal(board.view.phase, "playing");
    assert.equal(board.view.me, undefined);
    assert.ok(phone.view.me.cards.length === 5);
  } finally {
    peers.forEach((p) => p.ws.terminate());
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});
