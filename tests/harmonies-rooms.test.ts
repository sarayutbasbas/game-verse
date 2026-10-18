import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import WebSocket from "ws";
import { DatabaseSync } from "node:sqlite";
import { startServer } from "../src/server/index.js";
import * as harmoniesRules from "../src/games/harmonies/engine.js";
import { validateHarmoniesState } from "../src/games/harmonies/validation.js";
import type { HarmoniesView } from "../src/games/harmonies/types.js";
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
  get view(): HarmoniesView {
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

for(const count of [2,3,4])test(`Harmonies ${count} seats: authenticated shared room, exact intents, retries, partial turn restart`,async()=>{
 const dir=await mkdtemp(join(tmpdir(),'harmonies-room-')),path=join(dir,'rooms.sqlite');let randomValue=.42;let app=await startServer(0,'127.0.0.1',true,()=>randomValue,{storePath:path});let url=`http://localhost:${(app.server.address() as any).port}`;const peers:Peer[]=[];
 const make=async(cookie='')=>{const p=await new Peer().connect(url,cookie);peers.push(p);return p;};
 const identity=async(member=false)=>{const r=await fetch(url+'/api/auth/sign-in/anonymous',{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:'{}'});assert.equal(r.status,200);const data=await r.json();if(member)await(await app.auth.$context).internalAdapter.updateUser(data.user.id,{isAnonymous:false});return r.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');};
 try{
 const owner=await identity(true);let host=await make(owner);const sh=await host.send({type:'create',gameId:'harmonies'},'session');await host.wait(m=>m.type==='state');const code=sh.code,cookies:string[]=[],tokens:string[]=[],ids:string[]=[];let phones:Peer[]=[];
 for(let i=0;i<count;i++){const cookie=i?await identity():owner;cookies.push(cookie);const p=await make(cookie),session=await p.send({type:'join',code,name:'ผู้พิทักษ์ '+i},'session');phones.push(p);tokens.push(session.token);ids.push(session.playerId);await p.send({type:'sync'},'state');await p.command({type:'ready',ready:true});}
 const viewer=await make();await viewer.send({type:'watch',code},'state');await host.send({type:'sync'},'state');assert.equal((await phones[1].command({type:'start'})).ok,false);assert.equal((await host.command({type:'start',startingPlayerId:ids[0],boardSide:'B'})).ok,true);assert.equal(host.view.side,'B');assert.equal(host.view.groups!.length,5);assert.equal(host.view.me,undefined);
 if(count===2){
  const mode={type:'harmonies-display-mode',mode:'shared-table'};
  const rev=host.view.revision;
  assert.equal((await host.command({type:'harmonies-group',group:0})).ok,false,'read-only host must opt in');
  assert.equal((await phones[1].command(mode)).ok,false,'only manager changes room controls');
  const denied=await viewer.send({type:'command',id:randomUUID(),revision:viewer.view.revision,action:mode},'error');assert.equal(denied.type,'error');
  assert.equal(host.view.revision,rev);
  assert.equal((await host.command(mode)).ok,true);
  assert.equal(host.view.displayControl?.id,ids[0]);assert.equal(host.view.me,undefined);
  await viewer.send({type:'sync'},'state');assert.equal(viewer.view.displayControl,undefined);
  assert.equal((await host.command({type:'harmonies-group',group:0,playerId:ids[1]})).ok,false);
  const before=host.view.revision,receipt=randomUUID(),group={type:'harmonies-group',group:0};
  assert.equal((await host.command(group,before,receipt)).ok,true);
  const saved=structuredClone(app.rooms.rooms.get(code)!.harmonies);
  assert.equal((await host.command(group,before,receipt)).ok,true);assert.deepEqual(app.rooms.rooms.get(code)!.harmonies,saved);
  const place=host.view.displayControl!.legal.find(a=>a.type==='harmonies-place')!;
  await phones[0].send({type:'sync'},'state');
  const sharedRevision=host.view.revision;
  const race=await Promise.all([host.command(place,sharedRevision),phones[0].command(place,sharedRevision)]);
  assert.equal(race.filter(a=>a.ok).length,1,'host and phone race applies once');
 }

 let recovered=false;
 for(let k=0;k<count*6;k++){
  const state=app.rooms.rooms.get(code)!.harmonies!,actor=phones[state.turn];await actor.send({type:'sync'},'state');const legal=actor.view.me!.legal;const action=legal.find(a=>a.type==='harmonies-place')??legal.find(a=>a.type==='harmonies-end')??legal.find(a=>a.type==='harmonies-group')!;
  if(k===0){const other=phones[1];await other.send({type:'sync'},'state');assert.equal((await other.command(action)).ok,false);const rev=actor.view.revision,id=randomUUID();assert.equal((await actor.command(action,rev,id)).ok,true);const saved=structuredClone(app.rooms.rooms.get(code)!.harmonies);assert.equal((await actor.command(action,rev,id)).ok,true);assert.deepEqual(app.rooms.rooms.get(code)!.harmonies,saved);assert.equal((await actor.command(action,rev)).ok,false);assert.equal((await actor.command({...action,playerId:ids[0]})).ok,false);}
  else assert.equal((await actor.command(action)).ok,true);
  const now=app.rooms.rooms.get(code)!.harmonies!;assert.ok(validateHarmoniesState(now));
  if(count===2&&!recovered&&now.hand.length===2){const saved=structuredClone(now);await app.close();randomValue=.98;app=await startServer(0,'127.0.0.1',true,()=>randomValue,{storePath:path});url=`http://localhost:${(app.server.address() as any).port}`;assert.deepEqual(app.rooms.rooms.get(code)!.harmonies,saved);assert.equal(app.store.quarantined.length,0);phones=[];for(let i=0;i<count;i++){const p=await make(cookies[i]);await p.send({type:'resume',code,token:tokens[i]},'state');assert.equal(p.view.me!.id,ids[i]);phones.push(p);}host=await make(owner);await host.send({type:'resume',code,token:sh.token},'state');assert.equal(host.view.displayMode,'shared-table');assert.equal(host.view.displayControl?.id,app.rooms.rooms.get(code)!.harmonies!.players[app.rooms.rooms.get(code)!.harmonies!.turn].id);recovered=true;}
  await new Promise(r=>setTimeout(r,310));
 }
 if(count===2)assert.ok(recovered);
 // Complete valid states through the pure engine, then test authenticated rematch.
 if(count===2){for(const roll of [.1,.9,.2]){
  const room=app.rooms.rooms.get(code)!;let state=room.harmonies!,steps=0;
  while(state.phase==='playing'&&steps++<400){const actor=state.players[state.turn].id,legal=harmoniesRules.getLegalActions(state,actor),action=legal.find(a=>a.type==='harmonies-place')??legal.find(a=>a.type==='harmonies-end')??legal.find(a=>a.type==='harmonies-group')!;state=harmoniesRules.applyAction(state,actor,action,()=>.42);}
  assert.equal(state.phase,'finished');assert.ok(validateHarmoniesState(state));room.harmonies=state;room.revision++;app.store.saveRooms(app.rooms.exportRooms());await host.send({type:'sync'},'state');
  await phones[1].send({type:'sync'},'state');assert.equal((await phones[1].command({type:'restart'})).ok,false);
  randomValue=roll;const revision=host.view.revision,id=randomUUID();assert.equal((await host.command({type:'restart'},revision,id)).ok,true);assert.equal(host.view.side,roll<.5?'A':'B');assert.ok(host.view.players.every(p=>p.board.every(c=>!c.stack.length&&!c.cube)));
  const saved=structuredClone(room.harmonies);randomValue=1-roll;assert.equal((await host.command({type:'restart'},revision,id)).ok,true);assert.deepEqual(room.harmonies,saved,'duplicate restart must not reroll or reshuffle');
 }}

 for(const peer of peers)for(const m of peer.messages.filter(m=>m.type==='state'&&m.view.gameId==='harmonies')){assert.equal(m.view.deck,undefined);assert.equal(m.view.bag,undefined);assert.equal(m.view.sessions,undefined);}
 }finally{for(const p of peers)p.ws.close();await app.close();await rm(dir,{recursive:true,force:true});}
});
