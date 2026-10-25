import { test } from "node:test";
import assert from "node:assert/strict";
import { RoomService, ROOM_IDLE_MS, HARMONIES_ROOM_IDLE_MS } from "../src/server/rooms.js";
import { PlatformStore } from "../src/server/store.js";
import { randomUUID } from "node:crypto";
class Socket {
  readyState = 1;
  messages: any[] = [];
  closed?: number;
  send(data: string) {
    this.messages.push(JSON.parse(data));
  }
  close(code?: number) {
    this.closed = code;
    this.readyState = 3;
  }
  get view() {
    return this.messages.filter((m) => m.type === "state").at(-1)?.view;
  }
}
const handle = (s: RoomService, w: Socket, m: any) => s.handle(w as any, m);
const command = (s: RoomService, w: Socket, action: any) => {
  handle(s, w, {
    type: "command",
    id: randomUUID(),
    revision: w.view.revision,
    action,
  });
  assert.equal(w.messages.filter((m) => m.type === "ack").at(-1)?.ok, true);
};
test("10-hour expiry: all games, active/lobby rooms, exact boundary, durable deletion and cold restore", () => {
  const store = new PlatformStore(":memory:"),
    rooms = new RoomService(() => 0.42, store);
  try {
    const now = Date.now(),
      hosts: Socket[] = [];
    for (const gameId of ["camel-up", "dracula-vs-van-helsing", "azul"]) {
      const host = new Socket();
      hosts.push(host);
      handle(rooms, host, { type: "create", gameId });
      const code = host.view.code;
      const players = Array.from(
        { length: gameId === "camel-up" ? 3 : 2 },
        (_, i) => {
          const p = new Socket();
          handle(rooms, p, { type: "join", code, name: "Player " + i });
          if (gameId === "dracula-vs-van-helsing")
            command(rooms, p, {
              type: "choose-role",
              character: i === 0 ? "dracula" : "helsing",
            });
          if (gameId !== "camel-up")
            command(rooms, p, { type: "ready", ready: true });
          return p;
        },
      );
      command(rooms, host, { type: "start" });
      assert.equal(host.view.phase, "playing");
    }
    for (const r of rooms.rooms.values()) r.updated = now - ROOM_IDLE_MS;
    rooms.sweep(now);
    assert.equal(rooms.rooms.size, 3, "exactly ten hours is still retained");
    rooms.sweep(now + 1);
    assert.equal(rooms.rooms.size, 0);
    assert.equal(store.loadRooms().length, 0);
    for (const host of hosts) {
      assert.equal(host.closed, 4004);
      assert.match(host.messages.at(-1).error, /10 ชั่วโมง/);
    }
    const host = new Socket();
    handle(rooms, host, { type: "create", gameId: "azul" });
    const r = rooms.rooms.get(host.view.code)!;
    r.updated = Date.now() - ROOM_IDLE_MS - 1000;
    store.saveRooms(rooms.exportRooms());
    const restored = new RoomService(() => 0.42, store);
    assert.equal(restored.rooms.size, 0);
    assert.equal(store.loadRooms().length, 0);
  } finally {
    store.close();
  }
});
test("watch, resume, sync and duplicate receipts do not extend idle age; explicit accepted actions do", () => {
  const rooms = new RoomService(() => 0.42),
    host = new Socket();
  handle(rooms, host, { type: "create", gameId: "azul" });
  const r = rooms.rooms.get(host.view.code)!;
  const old = Date.now() - 9 * 3600000;
  r.updated = old;
  const watcher = new Socket();
  handle(rooms, watcher, { type: "watch", code: r.code });
  handle(rooms, watcher, { type: "sync" });
  assert.equal(r.updated, old);
  const session = host.messages.find((m) => m.type === "session");
  const resumed = new Socket();
  handle(rooms, resumed, {
    type: "resume",
    code: r.code,
    token: session.token,
  });
  assert.equal(r.updated, old);
  const player = new Socket();
  handle(rooms, player, { type: "join", code: r.code, name: "Join" });
  assert(r.updated > old);
  const id = randomUUID();
  handle(rooms, player, {
    type: "command",
    id,
    revision: player.view.revision,
    action: { type: "ready", ready: true },
  });
  const committed = r.updated;
  r.updated = old;
  handle(rooms, player, {
    type: "command",
    id,
    revision: 0,
    action: { type: "ready", ready: true },
  });
  assert.equal(r.updated, old, "retry does not refresh inactivity");
  assert(committed > old);
});

test("Harmonies retains lobby and playing rooms for exactly 30 idle days, then deletes them durably", () => {
  const store = new PlatformStore(":memory:"), rooms = new RoomService(() => 0.42, store);
  try {
    const hosts: Socket[] = [];
    for (const playing of [false, true]) {
      const host = new Socket(); hosts.push(host);
      handle(rooms, host, {type:"create",gameId:"harmonies"});
      if (playing) {
        for (let i=0;i<2;i++) {
          const p=new Socket();handle(rooms,p,{type:"join",code:host.view.code,name:"สวน "+i});
          command(rooms,p,{type:"ready",ready:true});
        }
        command(rooms,host,{type:"start"});
        assert.equal(host.view.phase,"playing");
      }
    }
    const now=Date.now(), thirtyDays=30*24*60*60*1000;
    assert.equal(HARMONIES_ROOM_IDLE_MS,thirtyDays);
    for (const room of rooms.rooms.values()) room.updated=now-ROOM_IDLE_MS-1;
    rooms.sweep(now);assert.equal(rooms.rooms.size,2,"ten hours no longer expires Harmonies");
    for (const room of rooms.rooms.values()) room.updated=now-thirtyDays;
    store.saveRooms(rooms.exportRooms());
    rooms.sweep(now);assert.equal(rooms.rooms.size,2,"the exact 30-day boundary is retained");
    assert.equal(store.loadRooms().length,2);
    rooms.sweep(now+1);assert.equal(rooms.rooms.size,0);assert.equal(store.loadRooms().length,0);
    for(const host of hosts){assert.equal(host.closed,4004);assert.match(host.messages.at(-1).error,/30 วัน/);}
  } finally { store.close(); }
});

test("cold restore retains existing Harmonies rooms for 29 days and still expires other games after 10 hours", () => {
  const store=new PlatformStore(":memory:"),rooms=new RoomService(()=>0.42,store);
  try {
    const codes:string[]=[];
    const scenarios=[["harmonies",29*24*60*60*1000],["harmonies",30*24*60*60*1000+1000],["azul",ROOM_IDLE_MS+1000]] as const;
    for(const [gameId] of scenarios){
      const host=new Socket();handle(rooms,host,{type:"create",gameId});codes.push(host.view.code);
    }
    scenarios.forEach(([,age],i)=>{rooms.rooms.get(codes[i])!.updated=Date.now()-age;});
    store.saveRooms(rooms.exportRooms());
    const kept=JSON.parse(JSON.stringify(rooms.exportRooms().find(r=>r.code===codes[0])!));
    const restored=new RoomService(()=>0.42,store);
    assert.equal(restored.rooms.size,1);assert.equal(store.loadRooms().length,1);
    assert.deepEqual(JSON.parse(JSON.stringify(restored.exportRooms())),[kept]);
    const resumed=new Socket();handle(restored,resumed,{type:"resume",code:kept.code,token:kept.sessions[0].token});
    assert.equal(resumed.view.code,kept.code);assert.equal(restored.rooms.get(kept.code)!.updated,kept.updated);
    assert.equal(resumed.closed,undefined);
  } finally { store.close(); }
});

test("Harmonies watch/resume/sync/retries do not prolong the 30-day window; accepted actions do", () => {
  const rooms=new RoomService(()=>0.42),host=new Socket();handle(rooms,host,{type:"create",gameId:"harmonies"});
  const room=rooms.rooms.get(host.view.code)!,old=Date.now()-29*24*60*60*1000;room.updated=old;
  const viewer=new Socket();handle(rooms,viewer,{type:"watch",code:room.code});handle(rooms,viewer,{type:"sync"});
  const resumed=new Socket();handle(rooms,resumed,{type:"resume",code:room.code,token:host.messages.find(m=>m.type==="session").token});
  assert.equal(room.updated,old);
  const player=new Socket();handle(rooms,player,{type:"join",code:room.code,name:"กลับมาจัดสวน"});assert.ok(room.updated>old);
  const id=randomUUID(),revision=player.view.revision;room.updated=old;
  handle(rooms,player,{type:"command",id,revision,action:{type:"ready",ready:true}});assert.ok(room.updated>old);
  room.updated=old;handle(rooms,player,{type:"command",id,revision,action:{type:"ready",ready:true}});
  assert.equal(room.updated,old,"replaying an accepted receipt does not extend retention");
});
