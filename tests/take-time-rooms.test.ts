import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import WebSocket from "ws";
import { DatabaseSync } from "node:sqlite";
import { startServer } from "../src/server/index.js";

import { validateTakeTimeState } from "../src/games/take-time/validation.js";
import type { TakeTimeView } from "../src/games/take-time/types.js";
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
  get view(): TakeTimeView {
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


test('Take Time actual WebSocket privacy, receipts, first-play race, authenticated recovery and full settlement',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'tt-room-')),path=join(dir,'rooms.sqlite');let app=await startServer(0,'127.0.0.1',true,()=>.42,{storePath:path});let url=`http://localhost:${(app.server.address() as any).port}`;const peers:Peer[]=[];
 const make=async(cookie='')=>{const p=await new Peer().connect(url,cookie);peers.push(p);return p;};
 const identity=async(member=false)=>{const r=await fetch(url+'/api/auth/sign-in/anonymous',{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:'{}'});const data=await r.json();if(member)await(await app.auth.$context).internalAdapter.updateUser(data.user.id,{isAnonymous:false});return r.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');};
 try{
 const owner=await identity(true),guest=await identity();let host=await make(owner);const hs=await host.send({type:'create',gameId:'take-time'},'session'),code=hs.code;let a=await make(owner),b=await make(guest);const sa=await a.send({type:'join',code,name:'เวลา'},'session'),sb=await b.send({type:'join',code,name:'เวลา'},'session');
 await a.send({type:'sync'},'state');await a.command({type:'ready',ready:true});await b.send({type:'sync'},'state');await b.command({type:'ready',ready:true});await host.send({type:'sync'},'state');
 assert.equal((await b.command({type:'start'})).ok,false);assert.equal((await host.command({type:'start'})).ok,true);
 const watch=await make();await watch.send({type:'watch',code},'state');assert.equal(watch.view.me,undefined);assert.ok(watch.view.players.every(p=>p.cards.every(c=>c.value===undefined)));
 await a.send({type:'sync'},'state');assert.ok(a.view.me!.hand.every(c=>c.value===undefined));const openingRevision=a.view.revision;assert.equal((await a.command({type:'tt-open',attempt:1})).ok,true);assert.ok(a.view.me!.hand.every(c=>c.value!==undefined));await b.send({type:'sync'},'state');assert.ok(b.view.me!.hand.every(c=>c.value===undefined));assert.equal((await b.command({type:'tt-open',attempt:0},openingRevision)).ok,false);assert.equal((await b.command({type:'tt-open',attempt:1},openingRevision)).ok,true);
 await a.send({type:'sync'},'state');const rev=a.view.revision,id=randomUUID(),action={type:'tt-place',card:a.view.me!.hand[0].id,segment:0,faceup:false};
 assert.equal((await a.command({...action,playerId:sb.playerId})).ok,false);await host.send({type:'sync'},'state');assert.equal((await host.command(action)).ok,false);
 assert.equal((await a.command(action,rev,id)).ok,true);const saved=structuredClone(app.rooms.rooms.get(code)!.takeTime);assert.equal((await a.command(action,rev,id)).ok,true);assert.deepEqual(app.rooms.rooms.get(code)!.takeTime,saved);
 await b.send({type:'sync'},'state');assert.equal((await b.command({type:'tt-place',card:b.view.me!.hand[0].id,segment:0,faceup:false},rev)).ok,false);
 await watch.send({type:'sync'},'state');assert.equal(watch.view.placed[0].card.value,undefined);assert.equal(a.view.me!.placed[0].value!==undefined,true);
 const pending=structuredClone(app.rooms.rooms.get(code)!.takeTime);assert.ok(validateTakeTimeState(pending));await app.close();
 app=await startServer(0,'127.0.0.1',true,()=>.99,{storePath:path});url=`http://localhost:${(app.server.address() as any).port}`;assert.equal(app.store.quarantined.length,0);assert.deepEqual(app.rooms.rooms.get(code)!.takeTime,pending);
 a=await make(owner);b=await make(guest);host=await make(owner);await a.send({type:'resume',code,token:sa.token},'state');await b.send({type:'resume',code,token:sb.token},'state');await host.send({type:'resume',code,token:hs.token},'state');assert.equal(a.view.me!.id,sa.playerId);assert.equal(b.view.me!.id,sb.playerId);assert.equal(host.view.me,undefined);
 const stolen=await make(await identity());assert.equal((await stolen.send({type:'resume',code,token:sa.token},'error')).type,'error');
 for(let i=1;i<12;i++){const p=i%2?b:a;await p.send({type:'sync'},'state');assert.equal((await p.command({type:'tt-place',card:p.view.me!.hand[0].id,segment:0,faceup:false})).ok,true);assert.ok(validateTakeTimeState(app.rooms.rooms.get(code)!.takeTime));}
 await host.send({type:'sync'},'state');assert.equal(host.view.phase,'resolution');assert.equal(host.view.result,undefined);assert.ok(host.view.placed.every(p=>p.card.value===undefined));
 for(let i=0;i<6;i++)assert.equal((await host.command({type:'tt-reveal'})).ok,true);
 assert.equal(host.view.phase,'finished');assert.equal((await host.send({type:'sync'},'state')).view.result?.success,false);assert.equal((await b.command({type:'tt-retry'})).ok,false);assert.equal((await host.command({type:'tt-retry'})).ok,true);assert.equal(host.view.phase,'discussion');assert.equal(host.view.bonus,1);assert.ok(validateTakeTimeState(app.rooms.rooms.get(code)!.takeTime));
 for(const p of peers)for(const m of p.messages.filter(m=>m.type==='state')){const v=m.view;assert.equal(v.unused,undefined);assert.equal(v.matchId,undefined);assert.equal(v.sessions,undefined);assert.ok(v.players.every((p:any)=>[...p.cards,...p.reserve].every((c:any)=>c.value===undefined)));for(const item of v.placed)if(!item.faceup&&item.segment>=v.revealed)assert.equal(item.card.value,undefined);}
 }finally{for(const p of peers)p.ws.close();await app.close();await rm(dir,{recursive:true,force:true});}
});
