import { test } from "node:test";
import assert from "node:assert/strict";
import { WebSocket } from "ws";
import { startServer } from "../src/server/index.js";
import type {
  ClientMessage,
  ServerMessage,
  View,
} from "../src/shared/types.js";
class Client {
  messages: ServerMessage[] = [];
  ws!: WebSocket;
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
  send(m: ClientMessage | any) {
    this.ws.send(JSON.stringify(m));
  }
  async wait(
    predicate: (m: ServerMessage) => boolean,
    after = 0,
  ): Promise<ServerMessage> {
    const end = Date.now() + 5000;
    while (Date.now() < end) {
      const match = this.messages.slice(after).find(predicate);
      if (match) return match;
      await new Promise((r) => setTimeout(r, 5));
    }
    throw Error(
      "protocol timeout: " +
        JSON.stringify({
          ready: this.ws.readyState,
          recent: this.messages
            .slice(-5)
            .map((m) =>
              m.type === "state"
                ? { type: m.type, revision: m.view.revision, turn: m.view.turn }
                : m.type === "session"
                  ? { type: m.type }
                  : m,
            ),
        }),
    );
  }
  get view() {
    return (
      this.messages.filter((m) => m.type === "state").at(-1) as Extract<
        ServerMessage,
        { type: "state" }
      >
    ).view;
  }
  get session() {
    return this.messages.find((m) => m.type === "session") as Extract<
      ServerMessage,
      { type: "session" }
    >;
  }
  async command(id: string, action: unknown, revision = this.view.revision) {
    const offset = this.messages.length;
    this.send({ type: "command", id, action, revision });
    return (await this.wait(
      (m) => m.type === "ack" && m.id === id,
      offset,
    )) as Extract<ServerMessage, { type: "ack" }>;
  }
}
test("actual WebSocket: roles, privacy, duplicate/stale races, errors, reconnect and full game", async () => {
  const app = await startServer(0, "127.0.0.1", true, undefined, {storePath: ":memory:", legacyHarness:true});
  const port = (app.server.address() as any).port;
  const clients: Client[] = [];
  const make = async () => {
    const c = await new Client().connect(port);
    clients.push(c);
    return c;
  };
  try {
    const host = await make();
    host.send({ type: "create" });
    await host.wait((m) => m.type === "state");
    const code = host.session.code;
    const players: Client[] = [];
    for (let i = 0; i < 3; i++) {
      const c = await make();
      c.send({ type: "join", code, name: `ทดสอบ ${i}` });
      await c.wait((m) => m.type === "state");
      players.push(c);
    }
    await host.wait((m) => m.type === "state" && m.view.players.length === 3);
    assert.equal(
      (await players[0].command("unauth-host", { type: "start" })).ok,
      false,
    );
    assert.equal(
      (
        await host.command("start-game", {
          type: "start",
          startingPlayerId: players[0].session.playerId,
        })
      ).ok,
      true,
    );
    await players[0].wait(
      (m) => m.type === "state" && m.view.phase === "playing",
    );
    const before = players[1].view.revision;
    assert.equal(
      (await players[1].command("wrong-turn", { type: "roll" })).ok,
      false,
    );
    assert.equal(players[1].view.revision, before);
    assert.equal((await host.command("host-roll", { type: "roll" })).ok, false);
    assert.equal(
      (
        await players[0].command("impersonate", {
          type: "roll",
          playerId: players[1].session.playerId,
        })
      ).ok,
      false,
    );
    const rev = players[0].view.revision;
    players[0].send({
      type: "command",
      id: "secret-bet",
      revision: rev,
      action: { type: "final", color: "blue", side: "winner" },
    });
    players[0].send({
      type: "command",
      id: "racing-stale",
      revision: rev,
      action: { type: "roll" },
    });
    await players[0].wait((m) => m.type === "ack" && m.id === "secret-bet");
    const stale = (await players[0].wait(
      (m) => m.type === "ack" && m.id === "racing-stale",
    )) as any;
    assert.equal(stale.ok, false);
    const repeat = await players[0].command(
      "secret-bet",
      { type: "final", color: "blue", side: "winner" },
      rev,
    );
    assert.equal(repeat.ok, true);
    assert.equal(repeat.revision, rev + 1);
    await host.wait((m) => m.type === "state" && m.view.revision === rev + 1);
    await players[1].wait(
      (m) => m.type === "state" && m.view.revision === rev + 1,
    );
    assert.equal(host.view.me, undefined);
    assert.deepEqual(players[1].view.me?.bets, []);
    assert.equal(players[0].view.me?.bets.length, 1);
    assert(!JSON.stringify(host.view).includes("cards"));
    assert(
      !JSON.stringify(host.messages.filter((m) => m.type === "state")).includes(
        players[0].session.token,
      ),
    );
    for (const c of players) {
      const otherIds = c.view.players
        .filter((p) => p.id !== c.session.playerId)
        .map((p) => p.id);
      assert(!JSON.stringify(c.view).includes("receipts"));
      assert(!JSON.stringify(c.view).includes("token"));
      assert(c.view.me?.id && !otherIds.includes(c.view.me.id));
    }
    const old = players[1],
      credential = old.session,
      ownBefore = old.view.me,
      playerId = credential.playerId;
    old.ws.close();
    await new Promise<void>((r) => old.ws.once("close", r));
    const rejoined = await make();
    rejoined.send({ type: "resume", code, token: credential.token });
    await rejoined.wait((m) => m.type === "state");
    assert.equal(rejoined.view.me?.id, playerId);
    assert.deepEqual(rejoined.view.me, ownBefore);
    assert.equal(rejoined.view.players.length, 3);
    players[1] = rejoined;
    const attacker = await make();
    attacker.send({ type: "resume", code, token: "0".repeat(64) });
    await attacker.wait((m) => m.type === "error");
    attacker.send({ type: "watch", code });
    await attacker.wait((m) => m.type === "state");
    const attackOffset = attacker.messages.length;
    attacker.send({
      type: "command",
      id: "attacker-start",
      revision: attacker.view.revision,
      action: { type: "start" },
    });
    await attacker.wait((m) => m.type === "error", attackOffset);
    // Repeated join on the same transport cannot create another player.
    const joinOffset = players[0].messages.length;
    players[0].send({ type: "join", code, name: "อีกชื่อ" });
    await players[0].wait((m) => m.type === "state", joinOffset);
    assert.equal(players[0].view.players.length, 3);
    assert.equal(players[0].view.revision, rev + 1);
    // Exhaust tickets without rolling so server can reject resource-depleted actions.
    for (let i = 0; i < 4; i++) {
      const current = players.find((c) => c.view.me?.id === host.view.turn)!;
      assert.equal(
        (await current.command(`take-red-${i}`, { type: "leg", color: "red" }))
          .ok,
        true,
      );
      await host.wait(
        (m) => m.type === "state" && m.view.revision === rev + 2 + i,
      );
    }
    const current = players.find((c) => c.view.me?.id === host.view.turn)!;
    assert.equal(
      (await current.command("exhausted-red", { type: "leg", color: "red" }))
        .ok,
      false,
    );
    let moves = 0;
    while (host.view.phase !== "finished" && moves < 700) {
      const c = players.find((c) => c.view.me?.id === host.view.turn)!;
      const expected = host.view.revision + 1;
      /* Respect the production per-socket command quota in this fast bot. */ await new Promise(
        (r) => setTimeout(r, 300),
      );
      const ack = await c.command(`roll-action-${moves++}`, { type: "roll" });
      assert.equal(ack.ok, true);
      await Promise.all(
        [host, ...players, attacker].map((c) =>
          c.wait((m) => m.type === "state" && m.view.revision === expected),
        ),
      );
      for (const p of players)
        assert.equal(p.view.revision, host.view.revision);
    }
    assert.equal(host.view.phase, "finished");
    assert(host.view.winners?.length);
    assert(host.view.finalResults?.some((b) => b.color === "blue"));
    const publicPart = (v: View) => {
      const { me, ...rest } = v;
      return rest;
    };
    for (const p of players) assert.deepEqual(publicPart(p.view), host.view);
    // Same accepted ID resolves after reconnect without paying twice.
    const money = players[0].view.players[0].money;
    const revision = host.view.revision;
    assert.equal(
      (await players[0].command("secret-bet", { type: "roll" }, 0)).ok,
      true,
    );
    assert.equal(host.view.revision, revision);
    assert.equal(players[0].view.players[0].money, money);
    app.rooms.sweep(Date.now() + 31 * 24 * 3600000);
    assert.equal(app.rooms.rooms.size, 0);
  } finally {
    clients.forEach((c) => c.ws.terminate());
    await app.close();
  }
});
test("WebSocket rejects foreign origins and malformed/oversized payloads", async () => {
  const app = await startServer(0, "127.0.0.1", true, undefined, {storePath: ":memory:", legacyHarness:true});
  const port = (app.server.address() as any).port;
  try {
    const foreign = new WebSocket(`ws://localhost:${port}/ws`, {
      origin: "https://evil.example",
    });
    await new Promise<void>((r) => foreign.once("error", () => r()));
    const client = await new Client().connect(port);
    client.ws.send("{");
    await client.wait((m) => m.type === "error");
    client.ws.send("x".repeat(9000));
    await new Promise<void>((r) => client.ws.once("close", () => r()));
    const limited = await new Client().connect(port);
    const closed = new Promise<number>((r) =>
      limited.ws.once("close", (code) => r(code)),
    );
    for (let i = 0; i < 41; i++) limited.ws.send("{}");
    assert.equal(await closed, 1008);
  } finally {
    await app.close();
  }
});

test("rematch keeps room/sessions and receipts, resets resources, rejects wrong role/phase/stale/offline", async () => {
  const app = await startServer(0, "127.0.0.1", true, () => 0, {storePath: ":memory:", legacyHarness:true});
  const port = (app.server.address() as any).port;
  const clients: Client[] = [];
  const make = async () => {
    const c = await new Client().connect(port);
    clients.push(c);
    return c;
  };
  try {
    const host = await make();
    host.send({ type: "create" });
    await host.wait((m) => m.type === "state");
    const code = host.session.code;
    assert.equal(
      (await host.command("no-game-restart", { type: "restart" })).ok,
      false,
    );
    const players: Client[] = [];
    for (let i = 0; i < 3; i++) {
      const p = await make();
      p.send({ type: "join", code, name: `รีแมตช์ ${i}` });
      await p.wait((m) => m.type === "state");
      players.push(p);
    }
    await host.wait((m) => m.type === "state" && m.view.players.length === 3);
    await host.command("rematch-start", { type: "start" });
    await Promise.all(
      players.map((p) =>
        p.wait((m) => m.type === "state" && m.view.phase === "playing"),
      ),
    );
    const ids = players.map((p) => p.session.playerId);
    const token = players[1].session.token;
    assert.equal(
      (await host.command("during-game-restart", { type: "restart" })).ok,
      false,
    );
    assert.equal(
      (await players[0].command("player-restart", { type: "restart" })).ok,
      false,
    );
    const oldRevision = host.view.revision;
    await players[0].command("previous-match-bet", {
      type: "final",
      color: "blue",
      side: "winner",
    });
    await host.wait(
      (m) => m.type === "state" && m.view.revision === oldRevision + 1,
    );
    let count = 0;
    while (host.view.phase !== "finished" && count < 100) {
      const p = players.find((p) => p.view.me!.id === host.view.turn)!;
      const revision = host.view.revision + 1;
      await p.command(`rematch-roll-${count++}`, { type: "roll" });
      await Promise.all(
        [host, ...players].map((p) =>
          p.wait((m) => m.type === "state" && m.view.revision === revision),
        ),
      );
    }
    assert.equal(host.view.phase, "finished");
    const disconnected = players[1];
    const closed = new Promise<void>((r) =>
      disconnected.ws.once("close", () => r()),
    );
    disconnected.ws.close();
    await closed;
    await host.wait((m) => m.type === "state" && m.view.players[1]?.connected === false);
    assert.equal(
      (await host.command("offline-restart", { type: "restart" })).ok,
      false,
    );
    const resumed = await make();
    resumed.send({ type: "resume", code, token });
    await resumed.wait((m) => m.type === "state");
    players[1] = resumed;
    await host.wait(
      (m) => m.type === "state" && m.view.players.every((p) => p.connected),
    );
    const revision = host.view.revision;
    assert.equal(
      (
        await host.command("restart-once", {
          type: "restart",
          startingPlayerId: ids[2],
        })
      ).ok,
      true,
    );
    await Promise.all(
      [host, ...players].map((p) =>
        p.wait((m) => m.type === "state" && m.view.revision === revision + 1),
      ),
    );
    const state = structuredClone(app.rooms.rooms.get(code)!.game);
    assert.equal(host.view.code, code);
    assert.equal(host.view.turn, ids[2]);
    assert.equal(host.view.leg, 1);
    assert.deepEqual(
      host.view.players.map((p) => p.id),
      ids,
    );
    assert(
      host.view.players.every(
        (p) =>
          p.money === 3 &&
          p.tickets.length === 0 &&
          p.pyramids === 0 &&
          !p.partner,
      ),
    );
    assert.deepEqual(host.view.finalCounts, { winner: 0, loser: 0 });
    assert.deepEqual(host.view.settlements, []);
    assert.equal(host.view.finalResults, undefined);
    assert.equal(host.view.lastRoll, undefined);
    for (const p of players) {
      assert.equal(p.view.me!.cards.length, 5);
      assert.deepEqual(p.view.me!.bets, []);
    }
    assert.equal(
      (await host.command("restart-once", { type: "restart" }, revision)).ok,
      true,
    );
    assert.deepEqual(app.rooms.rooms.get(code)!.game, state);
    assert.equal(host.view.revision, revision + 1);
    assert.equal(
      (await host.command("stale-restart", { type: "restart" }, revision)).ok,
      false,
    );
    // An old accepted game command retains its receipt instead of mutating the new match.
    assert.equal(
      (
        await players[0].command(
          "previous-match-bet",
          { type: "final", color: "blue", side: "winner" },
          oldRevision,
        )
      ).ok,
      true,
    );
    assert.deepEqual(app.rooms.rooms.get(code)!.game, state);
    const newOffset = players[1].messages.length;
    players[1].send({ type: "resume", code, token });
    await players[1].wait((m) => m.type === "state", newOffset);
    assert.equal(players[1].view.me!.id, ids[1]);
    assert.equal(players[1].view.players.length, 3);
  } finally {
    clients.forEach((p) => p.ws.terminate());
    await app.close();
  }
});

test('lobby removal is host-only, durable, deduplicated and revokes only the removed seat',async()=>{
 const app=await startServer(0,'127.0.0.1',true,()=>.42,{storePath:':memory:',legacyHarness:true}),port=(app.server.address() as any).port,clients:Client[]=[];
 const make=async()=>{const c=await new Client().connect(port);clients.push(c);return c;};
 try{
  const host=await make();host.send({type:'create'});await host.wait(m=>m.type==='state');const code=host.session.code;
  const players:Client[]=[];for(let i=0;i<4;i++){const p=await make();p.send({type:'join',code,name:'เพื่อน '+i});await p.wait(m=>m.type==='state');players.push(p);}
  const display=await make();display.send({type:'watch',code});await display.wait(m=>m.type==='state'&&m.view.players.length===4);
  await host.wait(m=>m.type==='state'&&m.view.players.length===4);
  const victim=players[0],id=victim.session.playerId!,token=victim.session.token;
  assert.equal((await players[1].command('kick-denied-01',{type:'room-kick',playerId:id},host.view.revision)).ok,false);
  assert.equal((await host.command('kick-stale-001',{type:'room-kick',playerId:id},0)).ok,false);
  assert.equal((await host.command('kick-invalid01',{type:'room-kick',playerId:id,extra:true})).ok,false);
  // A failed durable write must not disconnect or revoke a live participant.
  const save=app.store.saveRooms.bind(app.store),offset=host.messages.length;
  app.store.saveRooms=()=>{throw Error('test storage failure');};
  host.send({type:'command',id:'kick-rollback1',revision:host.view.revision,action:{type:'room-kick',playerId:id}});
  await host.wait(m=>m.type==='error'&&m.error.includes('บันทึกไม่สำเร็จ'),offset);app.store.saveRooms=save;
  assert.equal(victim.ws.readyState,WebSocket.OPEN);assert.equal(app.rooms.rooms.get(code)!.players.length,4);
  const first=await host.command('kick-accepted1',{type:'room-kick',playerId:id});assert.equal(first.ok,true);
  await display.wait(m=>m.type==='state'&&m.view.players.length===3);
  await victim.wait(m=>m.type==='error'&&m.error.includes('เจ้าของห้อง'));
  assert.equal((await host.command('kick-accepted1',{type:'room-kick',playerId:id},0)).revision,first.revision);
  assert.equal(app.rooms.rooms.get(code)!.players.length,3);
  assert.equal(app.store.loadRooms().find(r=>r.code===code)!.sessions.some((s:any)=>s.token===token),false);
  const removed=await make();removed.send({type:'resume',code,token});await removed.wait(m=>m.type==='error');
  const survivor=players[1],session=survivor.session;survivor.ws.close();const resumed=await make();resumed.send({type:'resume',code,token:session.token});await resumed.wait(m=>m.type==='state');assert.equal(resumed.view.me?.id,session.playerId);
  await host.command('kick-start-001',{type:'start'});await host.wait(m=>m.type==='state'&&m.view.phase!=='lobby');
  assert.equal((await host.command('kick-playing01',{type:'room-kick',playerId:session.playerId})).ok,false);
  assert.equal(app.rooms.rooms.get(code)!.players.length,3);
 }finally{clients.forEach(c=>c.ws.close());await app.close();}
});
