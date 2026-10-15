import { lateFixture } from "./wonders-fixture.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import WebSocket from "ws";
import { DatabaseSync } from "node:sqlite";
import { startServer } from "../src/server/index.js";
import { validateWondersState } from "../src/games/seven-wonders-duel/validation.js";
import type { WondersView } from "../src/games/seven-wonders-duel/types.js";
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
  get view(): WondersView {
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
test("Duel actual HTTP/auth/WS: 3 Ages, duplicate/stale, hidden cards, SQLite restore and pending choices", async () => {
  const dir = await mkdtemp(join(tmpdir(), "wonders-room-")),
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
    await host.send(
      { type: "create", gameId: "seven-wonders-duel" },
      "session",
    );
    await host.wait((m) => m.type === "state");
    const code = host.view.code;
    let a = await make(owner),
      b = await make(guest),
      viewer = await make();
    const sa = await a.send({ type: "join", code, name: "หนึ่ง" }, "session"),
      sb = await b.send({ type: "join", code, name: "สอง" }, "session");
    await viewer.send({ type: "watch", code }, "state");
    const extra = await make(third);
    assert.match(
      (await extra.send({ type: "join", code, name: "สาม" }, "error")).error,
      /เต็ม/,
    );
    await a.send({ type: "sync" }, "state");
    await a.command({ type: "ready", ready: true });
    await b.send({ type: "sync" }, "state");
    await b.command({ type: "ready", ready: true });
    await viewer.send({ type: "sync" }, "state");
    assert.equal((await b.command({ type: "start" })).ok, false);
    await a.send({ type: "sync" }, "state");
    assert.equal(
      (await a.command({ type: "start", startingPlayerId: sa.playerId })).ok,
      true,
    );
    let steps = 0,
      restarted = false,
      retry = false;
    while (app.rooms.rooms.get(code)!.wonders!.phase !== "finished") {
      const state = app.rooms.rooms.get(code)!.wonders!,
        actor = state.players[state.turn].id === sa.playerId ? a : b;
      await actor.send({ type: "sync" }, "state");
      const legal = actor.view.me!.legal;
      const action =
        legal.find((x) => x.type === "wonders-play" && x.mode === "discard") ??
        legal[0];
      assert.ok(action);
      if (!retry) {
        const rev = actor.view.revision,
          id = randomUUID(),
          other = actor === a ? b : a;
        await other.send({ type: "sync" }, "state");
        assert.equal((await other.command(action)).ok, false);
        assert.equal((await actor.command(action, rev, id)).ok, true);
        const after = structuredClone(app.rooms.rooms.get(code)!.wonders);
        assert.equal((await actor.command(action, rev, id)).ok, true);
        assert.deepEqual(app.rooms.rooms.get(code)!.wonders, after);
        assert.equal((await actor.command(action, rev)).ok, false);
        retry = true;
      } else assert.equal((await actor.command(action)).ok, true);
      assert.ok(validateWondersState(app.rooms.rooms.get(code)!.wonders));
      steps++;
      if (
        !restarted &&
        app.rooms.rooms.get(code)!.wonders?.pending?.kind === "starter"
      ) {
        const saved = structuredClone(app.rooms.rooms.get(code)!.wonders);
        await app.close();
        app = await startServer(0, "127.0.0.1", true, () => 0.89, {
          storePath: path,
        });
        url = `http://localhost:${(app.server.address() as any).port}`;
        assert.deepEqual(app.rooms.rooms.get(code)!.wonders, saved);
        assert.equal(app.store.quarantined.length, 0);
        a = await make(owner);
        b = await make(guest);
        viewer = await make();
        await a.send({ type: "resume", code, token: sa.token }, "state");
        await b.send({ type: "resume", code, token: sb.token }, "state");
        await viewer.send({ type: "watch", code }, "state");
        assert.equal(a.view.me!.id, sa.playerId);
        restarted = true;
      }
      await new Promise((r) => setTimeout(r, 550));
    }
    assert.equal(steps, 70);
    assert.ok(restarted);
    await viewer.send({ type: "sync" }, "state");
    assert.equal(viewer.view.victory, "civilian");
    assert.equal(viewer.view.age, 3);
    assert.equal(viewer.view.layout!.length, 0);
    assert.equal(viewer.view.discard!.length, 60);
    for (const peer of peers)
      for (const m of peer.messages.filter((m) => m.type === "state")) {
        assert.equal(m.view.decks, undefined);
        assert.equal(m.view.boxTokens, undefined);
        assert.equal(m.view.removed, undefined);
        assert.equal(m.view.wonderDeck, undefined);
        for (const n of m.view.layout ?? [])
          if (!n.faceUp) assert.equal(n.card, undefined);
        for (const p of m.view.players)
          for (const w of p.wonders) if (w.card) assert.equal(w.card, "built");
      }
    await a.send({ type: "sync" }, "state");
    assert.equal((await a.command({ type: "restart" })).ok, true);
    assert.equal(app.rooms.rooms.get(code)!.wonders!.sequence, 0);
    assert.equal(app.rooms.rooms.get(code)!.wonders!.discard.length, 0);
    assert.equal(app.rooms.rooms.get(code)!.wonders!.military, 0);
    const room = app.rooms.rooms.get(code)!;
    room.wonders = lateFixture(room.players, "library");
    room.revision++;
    await a.send({ type: "sync" }, "state");
    await b.send({ type: "sync" }, "state");
    await viewer.send({ type: "sync" }, "state");
    assert.equal(viewer.view.pending!.options, undefined);
    assert.equal(b.view.me!.decision, undefined);
    const secret = structuredClone(a.view.me!.decision),
      saved = structuredClone(room.wonders);
    await app.close();
    app = await startServer(0, "127.0.0.1", true, () => 0.13, {
      storePath: path,
    });
    url = `http://localhost:${(app.server.address() as any).port}`;
    assert.deepEqual(app.rooms.rooms.get(code)!.wonders, saved);
    a = await make(owner);
    b = await make(guest);
    viewer = await make();
    await a.send({ type: "resume", code, token: sa.token }, "state");
    await b.send({ type: "resume", code, token: sb.token }, "state");
    await viewer.send({ type: "watch", code }, "state");
    assert.deepEqual(a.view.me!.decision, secret);
    assert.equal(b.view.pending!.options, undefined);
    assert.equal(b.view.me!.decision, undefined);
    const revision = a.view.revision,
      id = randomUUID(),
      action = { type: "wonders-decide", choice: "law" };
    assert.equal((await a.command(action, revision, id)).ok, true);
    assert.equal((await a.command(action, revision, id)).ok, true);
    await viewer.send({ type: "sync" }, "state");
    assert.equal(viewer.view.victory, "science");
    assert.deepEqual(viewer.view.winners, [sa.playerId]);
  } finally {
    for (const p of peers) p.ws.close();
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});
