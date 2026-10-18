import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import WebSocket from "ws";
import { DatabaseSync } from "node:sqlite";
import { startServer } from "../src/server/index.js";
import { validatePixiesState } from "../src/games/pixies/validation.js";
import type { PixiesView } from "../src/games/pixies/types.js";
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
  get view(): PixiesView {
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
for(const count of [2,3,4,5])test(`Pixies ${count} seats HTTP/auth/WS: setup, privacy, legal flow${count===2?', complete match, retries and SQLite pending recovery':''}`,async()=>{
 const dir=await mkdtemp(join(tmpdir(),'pixies-room-')),path=join(dir,'rooms.sqlite');let app=await startServer(0,'127.0.0.1',true,()=>.42,{storePath:path});let url=`http://localhost:${(app.server.address() as any).port}`;const peers:Peer[]=[];
 const make=async(cookie='')=>{const p=await new Peer().connect(url,cookie);peers.push(p);return p;};
 const identity=async(member=false)=>{const r=await fetch(url+'/api/auth/sign-in/anonymous',{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:'{}'});assert.equal(r.status,200);const data=await r.json();if(member)await(await app.auth.$context).internalAdapter.updateUser(data.user.id,{isAnonymous:false});return r.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');};
 try{
 const owner=await identity(true);let host=await make(owner);const sh=await host.send({type:'create',gameId:'pixies'},'session');await host.wait(m=>m.type==='state');const code=sh.code;const cookies:string[]=[],tokens:string[]=[],ids:string[]=[];let phones:Peer[]=[];
 for(let i=0;i<count;i++){const cookie=i?await identity():owner;cookies.push(cookie);const p=await make(cookie),session=await p.send({type:'join',code,name:'ภูต '+i},'session');phones.push(p);tokens.push(session.token);ids.push(session.playerId);await p.send({type:'sync'},'state');await p.command({type:'ready',ready:true});}
 let viewer=await make();await viewer.send({type:'watch',code},'state');await host.send({type:'sync'},'state');assert.equal((await phones[1].command({type:'start'})).ok,false);assert.equal((await host.command({type:'start',startingPlayerId:ids[0]})).ok,true);assert.equal(host.view.market!.length,count===2?4:count);assert.equal(host.view.me,undefined);
 let moves=0,recovered=false,retried=false;
 while(app.rooms.rooms.get(code)!.pixies!.phase!=='finished'&&moves<(count===2?400:8)){
  const state=app.rooms.rooms.get(code)!.pixies!,actor=phones[state.phase==='results'?0:state.turn];await actor.send({type:'sync'},'state');const action=actor.view.me!.legal.find(a=>a.type!=='pixies-cancel')!;assert.ok(action);
  if(!retried){const other=phones[1];await other.send({type:'sync'},'state');assert.equal((await other.command(action)).ok,false);const rev=actor.view.revision,id=randomUUID();assert.equal((await actor.command(action,rev,id)).ok,true);const saved=structuredClone(app.rooms.rooms.get(code)!.pixies);assert.equal((await actor.command(action,rev,id)).ok,true);assert.deepEqual(app.rooms.rooms.get(code)!.pixies,saved);assert.equal((await actor.command(action,rev)).ok,false);retried=true;}
  else assert.equal((await actor.command(action)).ok,true);
  const now=app.rooms.rooms.get(code)!.pixies!;assert.ok(validatePixiesState(now));moves++;
  if(count===2&&!recovered&&now.pending){const saved=structuredClone(now);await app.close();app=await startServer(0,'127.0.0.1',true,()=>.98,{storePath:path});url=`http://localhost:${(app.server.address() as any).port}`;assert.deepEqual(app.rooms.rooms.get(code)!.pixies,saved);assert.equal(app.store.quarantined.length,0);phones=[];for(let i=0;i<count;i++){const p=await make(cookies[i]);await p.send({type:'resume',code,token:tokens[i]},'state');assert.equal(p.view.me!.id,ids[i]);phones.push(p);}host=await make(owner);await host.send({type:'resume',code,token:sh.token},'state');viewer=await make();await viewer.send({type:'watch',code},'state');recovered=true;}
  await new Promise(r=>setTimeout(r,310));
 }
 for(const peer of peers)for(const m of peer.messages.filter(m=>m.type==='state'&&m.view.phase!=='lobby')){assert.equal(m.view.deck,undefined);for(const p of m.view.players)for(const cell of p.grid)assert.equal(typeof cell.down,'boolean');}
 if(count===2){assert.ok(recovered);const final=app.rooms.rooms.get(code)!.pixies!;assert.equal(final.phase,'finished');assert.ok(final.players.every(p=>p.scores.length===3));await host.send({type:'sync'},'state');const rev=host.view.revision;assert.equal((await host.command({type:'restart'},rev)).ok,true);const fresh=structuredClone(app.rooms.rooms.get(code)!.pixies);assert.equal((await host.command({type:'restart'},rev)).ok,false);assert.deepEqual(app.rooms.rooms.get(code)!.pixies,fresh);assert.equal(fresh?.round,1);assert.ok(fresh?.players.every(p=>p.scores.length===0&&p.grid.every(v=>!v.up&&!v.down)));}
 }finally{for(const p of peers)p.ws.close();await app.close();await rm(dir,{recursive:true,force:true});}
});
