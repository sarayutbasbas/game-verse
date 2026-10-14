import { test } from "node:test";
import assert from "node:assert/strict";
import { WebSocket } from "ws";
import { startServer } from "../src/server/index.js";
import type {
  ServerMessage,
  RoomView,
  RoomAction,
} from "../src/shared/types.js";
import type { DuelView } from "../src/games/dracula-vs-van-helsing/types.js";
class Client {
  ws!: WebSocket;
  messages: ServerMessage<RoomView>[] = [];
  async connect(port: number) {
    this.ws = new WebSocket(`ws://localhost:${port}/ws`, {
      origin: `http://localhost:${port}`,
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
  send(m: unknown) {
    this.ws.send(JSON.stringify(m));
  }
  async wait(fn: (m: ServerMessage<RoomView>) => boolean, after = 0) {
    const end = Date.now() + 5000;
    while (Date.now() < end) {
      const m = this.messages.slice(after).find(fn);
      if (m) return m;
      await new Promise((r) => setTimeout(r, 5));
    }
    throw Error("protocol timeout (no private payload printed)");
  }
  get session() {
    return this.messages.find((m) => m.type === "session") as Extract<
      ServerMessage,
      { type: "session" }
    >;
  }
  get view() {
    return (
      this.messages.filter((m) => m.type === "state").at(-1) as Extract<
        ServerMessage<DuelView>,
        { type: "state" }
      >
    ).view;
  }
  async command(
    id: string,
    action: RoomAction | unknown,
    revision = this.view.revision,
  ) {
    const offset = this.messages.length;
    this.send({ type: "command", id, action, revision });
    const ack = (await this.wait(
      (m) => m.type === "ack" && m.id === id,
      offset,
    )) as Extract<ServerMessage, { type: "ack" }>;
    await this.wait((m) => m.type === "state", offset);
    return ack;
  }
}
test("Dracula real WS: lobby, roles, full-room resume, authorisation, projections, atomic reveal, retries and next-round", async () => {
  const app = await startServer(0, "127.0.0.1", true, () => 0.42, {storePath: ":memory:", legacyHarness:true}),
    port = (app.server.address() as any).port,
    clients: Client[] = [];
  const make = async () => {
    const c = await new Client().connect(port);
    clients.push(c);
    return c;
  };
  try {
    const invalid = await make();
    invalid.send({ type: "create", gameId: "__proto__" });
    await invalid.wait((m) => m.type === "error");
    assert.equal(app.rooms.rooms.size, 0);
    const host = await make();
    host.send({ type: "create", gameId: "dracula-vs-van-helsing" });
    await host.wait((m) => m.type === "state");
    const code = host.session.code;
    let d = await make();
    d.send({ type: "join", code, name: "นักล่า D" });
    await d.wait((m) => m.type === "state");
    const h = await make();
    h.send({ type: "join", code, name: "นักล่า H" });
    await h.wait((m) => m.type === "state");
    await host.wait((m) => m.type === "state" && m.view.players.length === 2);
    const third = await make();
    third.send({ type: "join", code, name: "third" });
    const full = await third.wait((m) => m.type === "error");
    assert(full.type === "error" && full.error.includes("ห้องเต็ม"));
    assert.equal(
      (await host.command("start-before-ready", { type: "start" })).ok,
      false,
    );
    assert.equal(
      (await d.command("ready-before-role", { type: "ready", ready: true })).ok,
      false,
    );
    assert.equal(
      (
        await d.command("choose-dracula", {
          type: "choose-role",
          character: "dracula",
        })
      ).ok,
      true,
    );
    await h.wait(
      (m) => m.type === "state" && m.view.revision === host.view.revision,
    );
    assert.equal(
      (
        await h.command("duplicate-role", {
          type: "choose-role",
          character: "dracula",
        })
      ).ok,
      false,
    );
    assert.equal(
      (
        await h.command("choose-helsing", {
          type: "choose-role",
          character: "helsing",
        })
      ).ok,
      true,
    );
    await d.wait(
      (m) => m.type === "state" && m.view.revision === h.view.revision,
    );
    await d.command("ready-dracula", { type: "ready", ready: true });
    await h.wait(
      (m) => m.type === "state" && m.view.revision === d.view.revision,
    );
    await h.command("ready-helsing", { type: "ready", ready: true });
    await host.wait(
      (m) => m.type === "state" && m.view.players.every((p: any) => p.ready),
    );
    assert.equal(
      (await d.command("player-host-start", { type: "start" })).ok,
      false,
    );
    await host.command("start-dracula", { type: "start" });
    await Promise.all(
      [d, h].map((c) =>
        c.wait((m) => m.type === "state" && m.view.phase === "playing"),
      ),
    );
    assert.equal(host.view.me, undefined);
    assert(host.view.racks!.dracula.every((c) => c === null));
    assert(host.view.racks!.helsing.every((c) => c === null));
    assert(!JSON.stringify(host.view).includes("cards"));
    assert(!JSON.stringify(h.view).includes('deck":'));
    assert(!("cards" in h.view.players[0]));
    assert.equal(
      (await h.command("wrong-turn-duel", { type: "draw" })).ok,
      false,
    );
    const rev = d.view.revision;
    await d.command("first-draw-duel", { type: "draw" });
    await host.wait((m) => m.type === "state" && m.view.revision === rev + 1);
    await h.wait((m) => m.type === "state" && m.view.revision === rev + 1);
    assert(d.view.me!.drawn);
    assert.equal(h.view.me!.drawn, undefined);
    assert.equal(host.view.drawn, undefined);
    const state = structuredClone(app.rooms.rooms.get(code)!.duel);
    assert.equal(
      (await d.command("first-draw-duel", { type: "draw" }, rev)).ok,
      true,
    );
    assert.deepEqual(app.rooms.rooms.get(code)!.duel, state);
    assert.equal(
      (
        await d.command(
          "stale-discard-duel",
          { type: "discard", slot: -1 },
          rev,
        )
      ).ok,
      false,
    );
    assert.equal(
      (
        await d.command("forged-discard-duel", {
          type: "discard",
          slot: -1,
          actorId: h.session.playerId,
        })
      ).ok,
      false,
    );
    const credential = d.session,
      own = structuredClone(d.view.me);
    const closed = new Promise((r) => d.ws.once("close", r));
    d.ws.close();
    await closed;
    d = await make();
    d.send({ type: "resume", code, token: credential.token });
    await d.wait((m) => m.type === "state");
    assert.equal(d.view.me!.id, credential.playerId);
    assert.deepEqual(d.view.me, own);
    assert.equal(d.view.players.length, 2);
    // Actual intents exercise all stages until a round resolves. No display participation required.
    let i = 0;
    while (host.view.phase === "playing" && i < 160) {
      const current = [d, h].find((c) => c.view.me!.id === host.view.turn)!;
      const legal = current.view.me!.legal;
      const a = legal.find((a) => a.type === "end-round") ?? legal[0];
      const target = host.view.revision + 1;
      await new Promise((r) => setTimeout(r, 280));
      assert.equal((await current.command(`duel-action-${i++}`, a)).ok, true);
      await Promise.all(
        [host, d, h].map((c) =>
          c.wait((m) => m.type === "state" && m.view.revision === target),
        ),
      );
    }
    assert.equal(host.view.phase, "results");
    assert.equal(host.view.result!.cards.dracula.length, 5);
    assert.equal(host.view.result!.cards.helsing.length, 5);
    assert.equal(host.view.event!.reveal!.round, host.view.round);
    const result = structuredClone(host.view.result),
      round = host.view.round;
    const old = credential;
    const done = new Promise((r) => d.ws.once("close", r));
    d.ws.close();
    await done;
    d = await make();
    d.send({ type: "resume", code, token: old.token });
    await d.wait((m) => m.type === "state");
    assert.deepEqual(d.view.result, result);
    assert.equal(d.view.round, round);
    const revision = d.view.revision;
    await d.command("round-ready-d", { type: "next-round" });
    await h.wait((m) => m.type === "state" && m.view.revision === revision + 1);
    assert.equal(d.view.round, round);
    await d.command("round-ready-d", { type: "next-round" }, revision);
    assert.equal(d.view.round, round);
    await h.command("round-ready-h", { type: "next-round" });
    await host.wait(
      (m) =>
        m.type === "state" &&
        m.view.gameId === "dracula-vs-van-helsing" &&
        m.view.round === round! + 1,
    );
    assert.equal(host.view.phase, "playing");
    assert.equal(host.view.result, undefined);
    assert(host.view.racks!.helsing.every((c) => c === null));
    for (const c of [host, h]) {
      const payloads = JSON.stringify(
        c.messages.filter((m) => m.type === "state"),
      );
      assert(!payloads.includes(credential.token));
      assert(!payloads.includes('"receipts"'));
      assert(!payloads.includes('"deck":'));
    }
  } finally {
    clients.forEach((c) => c.ws.terminate());
    await app.close();
  }
});
