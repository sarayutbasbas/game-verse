import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import WebSocket from "ws";
import { DatabaseSync } from "node:sqlite";
import { startServer } from "../src/server/index.js";
import * as skyRules from "../src/games/sky-team/engine.js";
import { validateSkyState } from "../src/games/sky-team/validation.js";
import type { SkyView } from "../src/games/sky-team/types.js";
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
  get view(): SkyView {
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


test('Sky Team authenticated private dice, unauthorized seats/actions, receipts, reroll and durable mid-decision recovery',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'sky-room-')),path=join(dir,'rooms.sqlite');let app=await startServer(0,'127.0.0.1',true,()=>.42,{storePath:path});let url=`http://localhost:${(app.server.address() as any).port}`;const peers:Peer[]=[];
 const make=async(cookie='')=>{const p=await new Peer().connect(url,cookie);peers.push(p);return p;};
 const identity=async(member=false)=>{const r=await fetch(url+'/api/auth/sign-in/anonymous',{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:'{}'});const data=await r.json();if(member)await(await app.auth.$context).internalAdapter.updateUser(data.user.id,{isAnonymous:false});return r.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');};
 try{
 const owner=await identity(true),guest=await identity();let host=await make(owner);const hs=await host.send({type:'create',gameId:'sky-team'},'session');const code=hs.code;let a=await make(owner),b=await make(guest);const sa=await a.send({type:'join',code,name:'Pilot'},'session'),sb=await b.send({type:'join',code,name:'Co-pilot'},'session');await a.send({type:'sync'},'state');await a.command({type:'ready',ready:true});await b.send({type:'sync'},'state');await b.command({type:'ready',ready:true});await host.send({type:'sync'},'state');
 const spectator=await make();await spectator.send({type:'watch',code},'state');const third=await make(await identity());assert.equal((await third.send({type:'join',code,name:'third'},'error')).type,'error');assert.equal((await b.command({type:'start'})).ok,false);assert.equal((await host.command({type:'start'})).ok,true);
 await a.send({type:'sync'},'state');const simultaneousRevision=a.view.revision;assert.equal((await a.command({type:'sky-ready',epoch:skyRules.decisionKey(app.rooms.rooms.get(code)!.sky!),ready:true})).ok,true);await b.send({type:'sync'},'state');assert.equal((await b.command({type:'sky-ready',epoch:skyRules.decisionKey(app.rooms.rooms.get(code)!.sky!),ready:true},simultaneousRevision)).ok,true);await a.send({type:'sync'},'state');await spectator.send({type:'sync'},'state');assert.equal(spectator.view.me,undefined);assert.equal(a.view.me!.dice.length,4);assert.ok(!JSON.stringify(a.view).includes('copilot-1-'));assert.ok(!JSON.stringify(b.view).includes('\"id\":\"pilot-1-'));
 const action=a.view.me!.legal.find(x=>x.type==='sky-place')!;await b.send({type:'sync'},'state');assert.equal((await b.command(action)).ok,false);await host.send({type:'sync'},'state');assert.equal((await host.command(action)).ok,false);
 const rev=a.view.revision,id=randomUUID();assert.equal((await a.command(action,rev,id)).ok,true);const saved=structuredClone(app.rooms.rooms.get(code)!.sky);assert.equal((await a.command(action,rev,id)).ok,true);assert.deepEqual(app.rooms.rooms.get(code)!.sky,saved);assert.equal((await a.command(action,rev)).ok,false);
 await a.send({type:'sync'},'state');assert.equal((await a.command({type:'sky-reroll'})).ok,true);await a.send({type:'sync'},'state');const rerollRevision=a.view.revision;assert.equal((await a.command({type:'sky-reroll-dice',epoch:skyRules.decisionKey(app.rooms.rooms.get(code)!.sky!),dice:[a.view.me!.dice[0].id]})).ok,true);const pending=structuredClone(app.rooms.rooms.get(code)!.sky);assert.ok(validateSkyState(pending));
 await app.close();app=await startServer(0,'127.0.0.1',true,()=>.99,{storePath:path});url=`http://localhost:${(app.server.address() as any).port}`;assert.equal(app.store.quarantined.length,0);assert.deepEqual(app.rooms.rooms.get(code)!.sky,pending);
 a=await make(owner);b=await make(guest);host=await make(owner);await a.send({type:'resume',code,token:sa.token},'state');await b.send({type:'resume',code,token:sb.token},'state');await host.send({type:'resume',code,token:hs.token},'state');assert.equal(a.view.me!.rerollSubmitted,true);assert.equal(b.view.me!.rerollSubmitted,false);assert.equal((await b.command({type:'sky-reroll-dice',epoch:skyRules.decisionKey(app.rooms.rooms.get(code)!.sky!),dice:[]},rerollRevision)).ok,true);assert.equal(app.rooms.rooms.get(code)!.sky!.turn,1);await a.send({type:'sync'},'state');assert.equal(a.view.me!.dice[0].value,6);
 for(const peer of peers)for(const m of peer.messages.filter(x=>x.type==='state'&&x.view.gameId==='sky-team')){assert.equal(m.view.dice,undefined);assert.equal(m.view.reroll,undefined);assert.equal(m.view.sessions,undefined);if(m.view.me)assert.ok(m.view.me.dice.every((d:any)=>d.id.startsWith(m.view.me.role+'-')));}
 }finally{for(const p of peers)p.ws.close();await app.close();await rm(dir,{recursive:true,force:true});}
});
