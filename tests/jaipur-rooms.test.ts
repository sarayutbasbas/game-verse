import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import WebSocket from "ws";
import { DatabaseSync } from "node:sqlite";
import { startServer } from "../src/server/index.js";
import { validateJaipurState } from "../src/games/jaipur/validation.js";
import type { JaipurView } from "../src/games/jaipur/types.js";
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
  get view(): JaipurView {
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
test("Jaipur HTTP/auth/WS/SQLite: full match, open herd counts and hidden hand/herd identities/bonus, wrong turn, duplicate/stale and durable recovery", async () => {
  const dir = await mkdtemp(join(tmpdir(), "jaipur-room-")),
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
    const sh = await host.send({ type: "create", gameId: "jaipur" }, "session");
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
    assert.equal((await b.command({ type: "start" })).ok, false);
    await a.send({ type: "sync" }, "state");
    assert.equal(
      (await a.command({ type: "start", startingPlayerId: sa.playerId })).ok,
      true,
    );
    let moves = 0,
      restarted = false,
      retried = false,
      bonusSeen = false;
    while (
      app.rooms.rooms.get(code)!.jaipur!.phase !== "finished" &&
      moves < 400
    ) {
      const state = app.rooms.rooms.get(code)!.jaipur!,
        actor =
          state.phase === "results"
            ? a
            : state.players[state.turn].id === sa.playerId
              ? a
              : b;
      await actor.send({ type: "sync" }, "state");
      const me = actor.view.me!;
      let action: any;
      if (state.phase === "results")
        action = {
          type: "jaipur-next",
          ...(actor.view.result!.nextStarter
            ? {}
            : { startingPlayerId: sa.playerId }),
        };
      else {
        const sales = me.legal
          .filter(
            (x): x is Extract<typeof x, { type: "jaipur-sell" }> =>
              x.type === "jaipur-sell",
          )
          .sort((x, y) => y.count - x.count);
        const take = me.legal
          .filter((x) => x.type === "jaipur-take")
          .sort((x, y) => {
            const gx = actor.view.market!.find(
                (c) => c.id === (x as any).cardId,
              )!.kind,
              gy = actor.view.market!.find(
                (c) => c.id === (y as any).cardId,
              )!.kind;
            return (
              me.hand.filter((c) => c.kind === gy).length -
              me.hand.filter((c) => c.kind === gx).length
            );
          });
        action =
          (sales[0]?.count >= 3 || me.hand.length >= 6
            ? sales[0]
            : undefined) ??
          take[0] ??
          me.legal.find((x) => x.type === "jaipur-camels") ??
          sales[0];
      }
      assert.ok(action);
      if (!retried && state.phase === "playing") {
        const other = actor === a ? b : a;
        await other.send({ type: "sync" }, "state");
        assert.equal((await other.command(action)).ok, false);
        const rev = actor.view.revision,
          id = randomUUID();
        assert.equal((await actor.command(action, rev, id)).ok, true);
        const saved = structuredClone(app.rooms.rooms.get(code)!.jaipur);
        assert.equal((await actor.command(action, rev, id)).ok, true);
        assert.deepEqual(app.rooms.rooms.get(code)!.jaipur, saved);
        assert.equal((await actor.command(action, rev)).ok, false);
        retried = true;
      } else assert.equal((await actor.command(action)).ok, true);
      assert.ok(validateJaipurState(app.rooms.rooms.get(code)!.jaipur));
      moves++;
      if (
        !restarted &&
        app.rooms.rooms.get(code)!.jaipur!.players.some((p) => p.bonus.length)
      ) {
        const saved = structuredClone(app.rooms.rooms.get(code)!.jaipur);
        bonusSeen = true;
        await app.close();
        app = await startServer(0, "127.0.0.1", true, () => 0.98, {
          storePath: path,
        });
        url = `http://localhost:${(app.server.address() as any).port}`;
        assert.deepEqual(app.rooms.rooms.get(code)!.jaipur, saved);
        assert.equal(app.store.quarantined.length, 0);
        a = await make(owner);
        b = await make(guest);
        host = await make(owner);
        viewer = await make();
        await a.send({ type: "resume", code, token: sa.token }, "state");
        await b.send({ type: "resume", code, token: sb.token }, "state");
        await host.send({ type: "resume", code, token: sh.token }, "state");
        await viewer.send({ type: "watch", code }, "state");
        assert.equal(a.view.me!.id, sa.playerId);
        assert.deepEqual(a.view.me!.hand, saved!.players[0].hand);
        assert.deepEqual(b.view.me!.bonus, saved!.players[1].bonus);
        restarted = true;
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    assert.ok(restarted && bonusSeen);
    await viewer.send({ type: "sync" }, "state");
    const final = viewer.view;
    assert.equal(final.phase, "finished");
    assert.ok(final.history!.length >= 2);
    assert.equal(
      final.players.find((p) => p.id === final.winners![0])!.seals,
      2,
    );
    assert.equal(final.me, undefined);
    for (const peer of peers)
      for (const m of peer.messages.filter((m) => m.type === "state")) {
        const v = m.view;
        assert.equal(v.deck, undefined);
        assert.equal(v.bonus, undefined);
        assert.equal(v.exchanges, undefined);
        assert.equal(v.subtotal, undefined);
        for (const p of v.players) {
          assert.ok(Number.isInteger(p.herdCount) && p.herdCount >= 0 && p.herdCount <= 11);
          for (const key of [
            "hand",
            "herd",
            "goods",
            "bonus",
            "subtotal",
            "total",
            "score",
          ])
            assert.equal(p[key], undefined);
        }
        if (v.phase === "playing") assert.equal(v.result, undefined);
        if (v.event?.sold) assert.equal(v.event.sold.bonusValue, undefined);
      }
    await a.send({ type: "sync" }, "state");
    assert.equal((await a.command({ type: "restart" })).ok, true);
    const fresh = app.rooms.rooms.get(code)!.jaipur!;
    assert.equal(fresh.sequence, 0);
    assert.equal(fresh.round, 1);
    assert.equal(fresh.history.length, 0);
    assert.deepEqual(
      fresh.players.map((p) => p.seals),
      [0, 0],
    );
    assert.equal(fresh.deck.length, 40);
  } finally {
    for (const p of peers) p.ws.close();
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});
