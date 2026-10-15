import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import WebSocket from "ws";
import { DatabaseSync } from "node:sqlite";
import { startServer } from "../src/server/index.js";
import { validateCalicoState } from "../src/games/calico/validation.js";
import type { CalicoView } from "../src/games/calico/types.js";
class Peer {
  messages: any[] = [];
  ws!: WebSocket;
  async connect(url: string, cookie = "") {
    this.ws = new WebSocket(url.replace("http", "ws") + "/ws", {
      origin: url,
      headers: { Cookie: cookie },
    });
    this.ws.on("message", (raw) => this.messages.push(JSON.parse(String(raw))));
    await new Promise<void>((r, j) => {
      this.ws.once("open", r);
      this.ws.once("error", j);
    });
    return this;
  }
  async wait(predicate: (m: any) => boolean, from = 0) {
    for (let i = 0; i < 1000; i++) {
      const found = this.messages.slice(from).find(predicate);
      if (found) return found;
      await new Promise((r) => setTimeout(r, 5));
    }
    throw Error("Protocol timeout");
  }
  async send(m: unknown, type: string) {
    const from = this.messages.length;
    this.ws.send(JSON.stringify(m));
    return this.wait((m) => m.type === type, from);
  }
  get view(): CalicoView {
    return this.messages.filter((m) => m.type === "state").at(-1)?.view;
  }
  async command(
    action: unknown,
    revision = this.view.revision,
    id: string = randomUUID(),
  ) {
    const ack = await this.send(
      { type: "command", id, revision, action },
      "ack",
    );
    await this.wait(
      (m) => m.type === "state" && m.view.revision === ack.revision,
    );
    return ack;
  }
}
test("Calico HTTP/auth/WS/SQLite: private setup, finite tiles, retry/stale/turn, restart mid-draft and full game", async () => {
  const dir = await mkdtemp(join(tmpdir(), "calico-rooms-")),
    path = join(dir, "rooms.sqlite");
  let app = await startServer(0, "127.0.0.1", true, () => 0.42, {
      storePath: path,
    }),
    url = `http://localhost:${(app.server.address() as any).port}`;
  const peers: Peer[] = [];
  const make = async (cookie = "") => {
    const p = await new Peer().connect(url, cookie);
    peers.push(p);
    return p;
  };
  const identity = async (member = false) => {
    const r = await fetch(url + "/api/auth/sign-in/anonymous", {
      method: "POST",
      headers: { Origin: url, "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(r.status, 200);
    const data = await r.json();
    if (member)
      await (
        await app.auth.$context
      ).internalAdapter.updateUser(data.user.id, { isAnonymous: false });
    return r.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");
  };
  try {
    const owner = await identity(true),
      guest = await identity(),
      third = await identity();
    let host = await make(owner);
    await host.send({ type: "create", gameId: "calico" }, "session");
    await host.wait((m) => m.type === "state");
    const code = host.view.code;
    let a = await make(owner),
      b = await make(guest),
      viewer = await make();
    const sa = await a.send({ type: "join", code, name: "Owner" }, "session"),
      sb = await b.send({ type: "join", code, name: "Guest" }, "session");
    await viewer.send({ type: "watch", code }, "state");
    const extra = await make(third);
    await a.send({ type: "sync" }, "state");
    await a.command({ type: "ready", ready: true });
    await b.send({ type: "sync" }, "state");
    await b.command({ type: "ready", ready: true });
    await b.send({ type: "sync" }, "state");
    assert.equal((await b.command({ type: "start" })).ok, false);
    await a.send({ type: "sync" }, "state");
    assert.equal(
      (await a.command({ type: "start", startingPlayerId: sa.playerId })).ok,
      true,
    );
    await b.send({ type: "sync" }, "state");
    assert.match(
      (await extra.send({ type: "join", code, name: "Third" }, "error")).error,
      /เริ่มแล้ว/,
    );
    const optionsA = a.view.me!.options,
      optionsB = b.view.me!.options;
    assert.equal(
      (
        await a.command({
          type: "calico-goals",
          goals: optionsA.slice(0, 3),
          confirm: false,
        })
      ).ok,
      true,
    );
    await b.send({ type: "sync" }, "state");
    await viewer.send({ type: "sync" }, "state");
    for (const p of viewer.view.players) {
      assert.equal((p as any).options, undefined);
      assert.equal((p as any).draft, undefined);
    }
    assert.deepEqual(b.view.me!.draft, []);
    const setup = structuredClone(app.rooms.rooms.get(code)!.calico);
    await app.close();
    app = await startServer(0, "127.0.0.1", true, () => 0.1, {
      storePath: path,
    });
    url = `http://localhost:${(app.server.address() as any).port}`;
    assert.deepEqual(app.rooms.rooms.get(code)!.calico, setup);
    assert.equal(app.store.quarantined.length, 0);
    a = await make(owner);
    b = await make(guest);
    host = await make(owner);
    viewer = await make();
    await a.send({ type: "resume", code, token: sa.token }, "state");
    await b.send({ type: "resume", code, token: sb.token }, "state");
    await host.send({ type: "watch", code }, "state");
    await viewer.send({ type: "watch", code }, "state");
    assert.deepEqual(a.view.me!.draft, optionsA.slice(0, 3));
    assert.deepEqual(a.view.me!.options, optionsA);
    await a.command({
      type: "calico-goals",
      goals: optionsA.slice(0, 3),
      confirm: true,
    });
    await b.send({ type: "sync" }, "state");
    await b.command({
      type: "calico-goals",
      goals: optionsB.slice(0, 3),
      confirm: true,
    });
    await a.send({ type: "sync" }, "state");
    const action = a.view.me!.legal.find((a) => a.type === "calico-place")!,
      rev = a.view.revision,
      id = randomUUID();
    await b.send({ type: "sync" }, "state");
    const before = structuredClone(app.rooms.rooms.get(code)!.calico);
    assert.equal((await b.command(action)).ok, false);
    assert.deepEqual(app.rooms.rooms.get(code)!.calico, before);
    assert.equal((await a.command(action, rev, id)).ok, true);
    const placed = structuredClone(app.rooms.rooms.get(code)!.calico);
    assert.equal(placed!.step, "draft");
    assert.equal((await a.command(action, rev, id)).ok, true);
    assert.deepEqual(app.rooms.rooms.get(code)!.calico, placed);
    assert.equal((await a.command(action, rev)).ok, false);
    await app.close();
    app = await startServer(0, "127.0.0.1", true, () => 0.9, {
      storePath: path,
    });
    url = `http://localhost:${(app.server.address() as any).port}`;
    assert.deepEqual(app.rooms.rooms.get(code)!.calico, placed);
    a = await make(owner);
    b = await make(guest);
    host = await make(owner);
    viewer = await make();
    await a.send({ type: "resume", code, token: sa.token }, "state");
    await b.send({ type: "resume", code, token: sb.token }, "state");
    await host.send({ type: "watch", code }, "state");
    await viewer.send({ type: "watch", code }, "state");
    assert.equal(a.view.step, "draft");
    assert.equal(a.view.me!.id, sa.playerId);
    let actions = 1;
    while (
      app.rooms.rooms.get(code)!.calico!.phase !== "finished" &&
      actions < 90
    ) {
      const s = app.rooms.rooms.get(code)!.calico!,
        p = s.players[s.turn].id === sa.playerId ? a : b;
      await p.send({ type: "sync" }, "state");
      const action = p.view.me!.legal[0];
      assert.ok(action);
      assert.equal((await p.command(action)).ok, true);
      assert.ok(validateCalicoState(app.rooms.rooms.get(code)!.calico));
      actions++;
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    assert.equal(actions, 88);
    const final = app.rooms.rooms.get(code)!.calico!;
    assert.equal(final.phase, "finished");
    assert.equal(final.bag.length, 57);
    await viewer.send({ type: "sync" }, "state");
    assert.equal(viewer.view.me, undefined);
    for (const p of viewer.view.players) assert.equal(p.hand.length, 2);
    for (const peer of peers)
      for (const m of peer.messages.filter((m) => m.type === "state")) {
        assert.equal(m.view.bag, undefined);
        assert.equal(JSON.stringify(m.view).includes('"token"'), false);
        for (const p of m.view.players) {
          assert.equal(p.options, undefined);
          assert.equal(p.draft, undefined);
        }
      }
    await a.send({ type: "sync" }, "state");
    assert.equal(
      (await a.command({ type: "restart", startingPlayerId: sa.playerId })).ok,
      true,
    );
    assert.equal(app.rooms.rooms.get(code)!.calico!.phase, "setup");
    assert.equal(app.rooms.rooms.get(code)!.calico!.placements, 0);
    assert.equal(a.view.me!.id, sa.playerId);
    assert.equal(app.store.quarantined.length, 0);
    await app.close();
    const db = new DatabaseSync(path);
    const record = JSON.parse(
      String(
        db.prepare("SELECT state FROM gv_rooms WHERE code=?").get(code)!.state,
      ),
    );
    record.calico.bag.pop();
    db.prepare("UPDATE gv_rooms SET state=? WHERE code=?").run(
      JSON.stringify(record),
      code,
    );
    db.close();
    app = await startServer(0, "127.0.0.1", true, () => 0.5, {
      storePath: path,
    });
    assert.equal(app.rooms.rooms.has(code), false);
    assert.equal(app.store.quarantined.length, 1);
    assert.ok(
      app.store.db.prepare("SELECT 1 FROM gv_rooms WHERE code=?").get(code),
    );
  } finally {
    for (const p of peers) p.ws.terminate();
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});
for (const count of [1, 3, 4])
  test(`Calico ${count} seats actual WS: mode, shared market, duplicate/stale and restart after conveyor`, async () => {
    const dir = await mkdtemp(join(tmpdir(), "calico-count-")),
      path = join(dir, "test.sqlite");
    let app = await startServer(0, "127.0.0.1", true, () => 0.42, {
        storePath: path,
      }),
      url = `http://localhost:${(app.server.address() as any).port}`;
    const peers: Peer[] = [];
    const make = async (cookie = "") => {
      const p = await new Peer().connect(url, cookie);
      peers.push(p);
      return p;
    };
    const identity = async (member = false) => {
      const r = await fetch(url + "/api/auth/sign-in/anonymous", {
        method: "POST",
        headers: { Origin: url, "Content-Type": "application/json" },
        body: "{}",
      });
      const d = await r.json();
      if (member)
        await (
          await app.auth.$context
        ).internalAdapter.updateUser(d.user.id, { isAnonymous: false });
      return r.headers
        .getSetCookie()
        .map((c) => c.split(";")[0])
        .join("; ");
    };
    try {
      const owner = await identity(true);
      let host = await make(owner);
      await host.send({ type: "create", gameId: "calico" }, "session");
      await host.wait((m) => m.type === "state");
      const code = host.view.code;
      await host.command({ type: "calico-preset", preset: "first" });
      const cookies: string[] = [],
        sessions: any[] = [];
      let players: Peer[] = [];
      for (let i = 0; i < count; i++) {
        const cookie = await identity(),
          p = await make(cookie);
        cookies.push(cookie);
        sessions.push(
          await p.send({ type: "join", code, name: "P" + i }, "session"),
        );
        await p.wait((m) => m.type === "state");
        await p.command({ type: "ready", ready: true });
        players.push(p);
      }
      if (count === 4) {
        const extra = await make(await identity());
        assert.match(
          (await extra.send({ type: "join", code, name: "Overflow" }, "error"))
            .error,
          /เต็ม/,
        );
      }
      await host.send({ type: "sync" }, "state");
      assert.equal(
        (
          await host.command({
            type: "start",
            startingPlayerId: sessions[0].playerId,
          })
        ).ok,
        true,
      );
      let moves = 0,
        restarted = false;
      while (
        app.rooms.rooms.get(code)!.calico!.phase !== "finished" &&
        moves < (count === 1 ? 44 : count * 4)
      ) {
        const room = app.rooms.rooms.get(code)!,
          s = room.calico!,
          index = s.turn,
          p = players[index];
        await p.wait(
          (m) => m.type === "state" && m.view.revision === room.revision,
        );
        const action = p.view.me!.legal.find(
          (a) =>
            a.type === (s.step === "place" ? "calico-place" : "calico-draft"),
        )!;
        const id = randomUUID(),
          rev = room.revision;
        assert.equal((await p.command(action, rev, id)).ok, true);
        if (moves === 1) {
          const after = JSON.stringify(app.rooms.rooms.get(code)!.calico);
          assert.equal((await p.command(action, rev, id)).ok, true);
          assert.equal(
            JSON.stringify(app.rooms.rooms.get(code)!.calico),
            after,
          );
          assert.equal((await p.command(action, rev, randomUUID())).ok, false);
        }
        moves++;
        assert.ok(validateCalicoState(app.rooms.rooms.get(code)!.calico));
        if (!restarted && moves === count * 2) {
          const old = structuredClone(app.rooms.rooms.get(code)!.calico);
          await app.close();
          app = await startServer(0, "127.0.0.1", true, () => 0.9, {
            storePath: path,
          });
          url = `http://localhost:${(app.server.address() as any).port}`;
          assert.deepEqual(app.rooms.rooms.get(code)!.calico, old);
          assert.equal(app.store.quarantined.length, 0);
          players = [];
          for (let i = 0; i < count; i++) {
            const next = await make(cookies[i]);
            await next.send(
              { type: "resume", code, token: sessions[i].token },
              "state",
            );
            assert.equal(next.view.me!.id, sessions[i].playerId);
            players.push(next);
          }
          host = await make(owner);
          await host.send({ type: "watch", code }, "state");
          restarted = true;
        }
        await new Promise((r) => setTimeout(r, 320));
      }
      const s = app.rooms.rooms.get(code)!.calico!;
      assert.ok(restarted);
      assert.equal(s.mode, count === 1 ? "solo" : "multiplayer");
      assert.equal(s.removed!.length, count === 1 ? 22 : 0);
      if (count === 1) {
        assert.equal(s.phase, "finished");
        assert.equal(s.bag.length, 59);
        assert.equal(s.placements, 22);
      } else assert.equal(s.placements, count * 2);
    } finally {
      for (const p of peers) p.ws.terminate();
      await app.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
