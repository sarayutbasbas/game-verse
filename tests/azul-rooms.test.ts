import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import WebSocket from "ws";
import { DatabaseSync } from "node:sqlite";
import { startServer } from "../src/server/index.js";
import { validateAzulState } from "../src/games/azul/validation.js";
import type { AzulView } from "../src/games/azul/types.js";
class Peer {
  messages:any[]=[]; ws!:WebSocket;
  async connect(url:string,cookie="") {
    this.ws=new WebSocket(url.replace("http","ws")+"/ws",{origin:url,headers:{Cookie:cookie}});
    this.ws.on("message",raw=>this.messages.push(JSON.parse(String(raw))));
    await new Promise<void>((r,j)=>{this.ws.once("open",r);this.ws.once("error",j);});return this;
  }
  async wait(predicate:(m:any)=>boolean,from=0) {
    for(let i=0;i<1000;i++){const found=this.messages.slice(from).find(predicate);if(found)return found;await new Promise(r=>setTimeout(r,5));}throw Error("Protocol timeout");
  }
  async send(m:unknown,type:string){const from=this.messages.length;this.ws.send(JSON.stringify(m));return this.wait(m=>m.type===type,from);}
  get view():AzulView {return this.messages.filter(m=>m.type==="state").at(-1)?.view;}
  async command(action:unknown,revision=this.view.revision,id:string=randomUUID()){
    const ack=await this.send({type:"command",id,revision,action},"ack");await this.wait(m=>m.type==="state" && m.view.revision===ack.revision);return ack;
  }
}
test("Azul actual HTTP/auth/WS: atomic draft, retries/stale/turn, profiles, restart drafting/results and owner continuation",async()=>{
  const dir=await mkdtemp(join(tmpdir(),"azul-rooms-")), path=join(dir,"rooms.sqlite");
  let app=await startServer(0,"127.0.0.1",true,()=>.42,{storePath:path});
  let url=`http://localhost:${(app.server.address() as any).port}`;
  const peers:Peer[]=[];
  const make=async(cookie="")=>{const p=await new Peer().connect(url,cookie);peers.push(p);return p;};
  const identity=async(account=false)=>{
    const res=await fetch(url+"/api/auth/sign-in/anonymous",{method:"POST",headers:{Origin:url,"Content-Type":"application/json"},body:"{}"});
    assert.equal(res.status,200);const data=await res.json();
    if(account)await(await app.auth.$context).internalAdapter.updateUser(data.user.id,{isAnonymous:false});
    return {id:data.user.id,cookie:res.headers.getSetCookie().map(c=>c.split(";")[0]).join("; ")};
  };
  try {
    const owner=await identity(true), guest=await identity();
    let host=await make(owner.cookie);await host.send({type:"create",gameId:"azul"},"session");await host.wait(m=>m.type==="state");
    const code=host.view.code;
    let a=await make(owner.cookie), b=await make(guest.cookie), display=await make();
    const sessionA=await a.send({type:"join",code,name:"Owner"},"session"), sessionB=await b.send({type:"join",code,name:"Guest"},"session");
    await display.send({type:"watch",code},"state");
    await a.wait(m=>m.type==="state" && m.view.players.length===2);
    assert.equal((await host.command({type:"start"})).ok,false);
    await a.command({type:"ready",ready:true});await b.wait(m=>m.type==="state" && m.view.revision===a.view.revision);
    await b.command({type:"ready",ready:true});await a.wait(m=>m.type==="state" && m.view.revision===b.view.revision);
    assert.equal((await b.command({type:"start"})).ok,false);
    assert.equal((await a.command({type:"start",startingPlayerId:sessionA.playerId})).ok,true);
    await b.wait(m=>m.type==="state" && m.view.phase==="playing");await display.wait(m=>m.type==="state" && m.view.phase==="playing");
    assert.equal(display.view.me,undefined);assert.equal((display.view as any).bag,undefined);assert.equal(b.view.players[0].wall.length,5);
    const before=structuredClone(app.rooms.rooms.get(code)!.azul!);
    assert.equal((await b.command(a.view.me!.legal[0])).ok,false);assert.deepEqual(app.rooms.rooms.get(code)!.azul,before);
    const action=a.view.me!.legal.find(x=>x.type==="draft" && x.target===0)!, rev=a.view.revision, id=randomUUID();
    assert.equal((await a.command(action,rev,id)).ok,true);
    const committed=JSON.parse(JSON.stringify(app.rooms.rooms.get(code)!.azul!));
    assert.equal((await a.command(action,rev,id)).ok,true);assert.deepEqual(JSON.parse(JSON.stringify(app.rooms.rooms.get(code)!.azul)),committed);
    assert.equal((await a.command(action,rev)).ok,false);assert.deepEqual(JSON.parse(JSON.stringify(app.rooms.rooms.get(code)!.azul)),committed);
    await app.close();app=await startServer(0,"127.0.0.1",true,()=>.99,{storePath:path});url=`http://localhost:${(app.server.address() as any).port}`;
    assert.deepEqual(JSON.parse(JSON.stringify(app.rooms.rooms.get(code)!.azul)),committed);assert(validateAzulState(committed));
    a=await make(owner.cookie);b=await make(guest.cookie);host=await make(owner.cookie);
    await a.send({type:"resume",code,token:sessionA.token},"state");await b.send({type:"resume",code,token:sessionB.token},"state");await host.send({type:"watch",code},"state");
    assert.equal(a.view.me!.id,sessionA.playerId);assert.equal((await a.command(action,rev,id)).ok,true);assert.deepEqual(JSON.parse(JSON.stringify(app.rooms.rooms.get(code)!.azul)),committed);
    let moves=0;
    let lastDraft: { peer: Peer; action: unknown; revision: number; id: string } | undefined;
    while(app.rooms.rooms.get(code)!.azul!.phase==="playing" && moves++<50) {
      const s=app.rooms.rooms.get(code)!.azul!, p=s.turn===sessionA.playerId?a:b;
      await p.wait(m=>m.type==="state" && m.view.revision===app.rooms.rooms.get(code)!.revision);
      const legal=p.view.me!.legal.filter(x=>x.type==="draft");
      const next=legal.find(x=>x.type==="draft" && x.target===0) ?? legal.find(x=>x.type==="draft" && x.target>=0) ?? legal[0];
      lastDraft={peer:p,action:next,revision:p.view.revision,id:randomUUID()};
      assert.equal((await p.command(next,lastDraft.revision,lastDraft.id)).ok,true);assert(validateAzulState(app.rooms.rooms.get(code)!.azul));
    }
    const result=structuredClone(app.rooms.rooms.get(code)!.azul!);assert.equal(result.phase,"results");assert.equal(result.settlements.length,1);
    assert(lastDraft);assert.equal((await lastDraft.peer.command(lastDraft.action,lastDraft.revision,lastDraft.id)).ok,true);
    assert.deepEqual(app.rooms.rooms.get(code)!.azul,result); // Settlement is not applied twice.
    await app.close();app=await startServer(0,"127.0.0.1",true,()=>.1,{storePath:path});url=`http://localhost:${(app.server.address() as any).port}`;
    assert.deepEqual(app.rooms.rooms.get(code)!.azul,result);
    // Both players are offline; the separate authenticated owner display can continue.
    host=await make(owner.cookie);await host.send({type:"watch",code},"state");
    assert.equal((await host.command({type:"next-round"})).ok,true);
    const s=app.rooms.rooms.get(code)!.azul!;assert.equal(s.round,2);assert.equal(s.turn,result.starter);assert.equal(s.settlements.length,1);assert(validateAzulState(s));
    a=await make(owner.cookie);await a.send({type:"resume",code,token:sessionA.token},"state");assert.equal(a.view.me!.id,sessionA.playerId);
    const profile=await fetch(url+"/api/profile",{method:"PATCH",headers:{Cookie:owner.cookie,Origin:url,"Content-Type":"application/json"},body:JSON.stringify({name:"เจ้าของ Azul"})});
    assert.equal(profile.status,200);await a.wait(m=>m.type==="state" && m.view.players.some((p:any)=>p.name==="เจ้าของ Azul"));
    assert.equal(a.view.players[0].name,"เจ้าของ Azul");
    for(const p of peers)for(const m of p.messages.filter(m=>m.type==="state")){assert(!("bag" in m.view));assert(!("discard" in m.view));assert(!JSON.stringify(m.view).includes('"token"'));}
    assert.equal(app.store.quarantined.length,0);
    await app.close();
    const db=new DatabaseSync(path);
    const record=JSON.parse(String(db.prepare("SELECT state FROM gv_rooms WHERE code=?").get(code)!.state));
    record.azul.bag.pop(); // Broken tile conservation must not become a playable recovered room.
    db.prepare("UPDATE gv_rooms SET state=? WHERE code=?").run(JSON.stringify(record),code);db.close();
    app=await startServer(0,"127.0.0.1",true,()=>.5,{storePath:path});
    assert.equal(app.rooms.rooms.has(code),false);assert.equal(app.store.quarantined.length,1);
    assert(app.store.db.prepare("SELECT 1 FROM gv_rooms WHERE code=?").get(code));
  } finally {for(const p of peers)p.ws.terminate();await app.close();await rm(dir,{recursive:true,force:true});}
});
