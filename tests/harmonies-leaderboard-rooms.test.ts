import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import WebSocket from 'ws';
import {startServer} from '../src/server/index.js';
import * as rules from '../src/games/harmonies/engine.js';
import type {HarmoniesAction,HarmoniesView} from '../src/games/harmonies/types.js';
const postgres=process.env.GAMEVERSE_TEST_HARMONIES_POSTGRES;
class Peer{
 messages:any[]=[];ws!:WebSocket;times:number[]=[];token='';cookie='';
 get view():HarmoniesView{return this.messages.filter(m=>m.type==='state').at(-1)?.view;}
 async open(url:string,cookie:string){this.cookie=cookie;this.ws=new WebSocket(url.replace('http','ws')+'/ws',{origin:url,headers:{Cookie:cookie}});this.ws.on('message',raw=>{const m=JSON.parse(String(raw));this.messages.push(m);if(m.type==='session')this.token=m.token;});await new Promise<void>((r,j)=>{this.ws.once('open',r);this.ws.once('error',j);});return this;}
 async wait(predicate:(m:any)=>boolean,from=0){for(let i=0;i<2400;i++){const m=this.messages.slice(from).find(predicate);if(m)return m;await new Promise(r=>setTimeout(r,5));}throw Error('Protocol timeout');}
 async send(message:any,type:string){this.times=this.times.filter(t=>Date.now()-t<10000);if(this.times.length>=34)await new Promise(r=>setTimeout(r,10010-(Date.now()-this.times[0])));this.times.push(Date.now());const from=this.messages.length;this.ws.send(JSON.stringify(message));return this.wait(m=>m.type===type,from);}
 async command(action:unknown,id=randomUUID(),revision=this.view.revision){const from=this.messages.length;const ack=await this.send({type:'command',action,id,revision},'ack');await this.wait(m=>m.type==='state'&&m.view.revision===ack.revision,from);return ack;}
}
for(const backend of ['sqlite','postgres'])test(`Harmonies ranking ${backend}: real solo/competitive complete games, rejected forged score, final race/retry, atomic rollback and restore`,{skip:backend==='postgres'&&!postgres,timeout:180000},async()=>{
 const dir=await mkdtemp(join(tmpdir(),'harmonies-rank-rooms-')),path=backend==='postgres'?postgres!:join(dir,'db.sqlite');let app=await startServer(0,'127.0.0.1',true,()=>.42,{storePath:path}),url=`http://localhost:${(app.server.address() as any).port}`;let second:Awaited<ReturnType<typeof startServer>>|undefined;const peers:Peer[]=[];
 const peer=async(cookie:string,origin=url)=>{const p=await new Peer().open(origin,cookie);peers.push(p);return p;};
 const identity=async(member=false)=>{const r=await fetch(url+'/api/auth/sign-in/anonymous',{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:'{}'}),{user}=await r.json();if(member)await(await app.auth.$context).internalAdapter.updateUser(user.id,{isAnonymous:false});return r.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');};
 let last:{code:string;token:string;cookie:string}|undefined;
 try{
 const owner=await identity(true),guest=await identity();
 for(const count of [1,2]){
  let host=await peer(owner);const created=await host.send({type:'create',gameId:'harmonies'},'session'),code=created.code;await host.wait(m=>m.type==='state');const players:Peer[]=[];
  for(let i=0;i<count;i++){const p=await peer(i?guest:owner);await p.send({type:'join',code,name:'ผู้พิทักษ์ '+i},'session');await p.wait(m=>m.type==='state');await p.command({type:'ready',ready:true});players.push(p);}
  await host.send({type:'sync'},'state');assert.equal((await host.command({type:'start',harmoniesOptions:{solo:count===1,natureSpirits:false,whispers:false}})).ok,true);assert.equal((await host.command({type:'harmonies-display-mode',mode:'shared-table'})).ok,true);
  const mode=count===1?'solo':'competitive';assert.equal(app.store.harmoniesLeaderboards()[mode].length,0);let moves=0;
  while(app.rooms.rooms.get(code)!.harmonies!.phase==='playing'){
   assert.ok(moves++<400);const state=app.rooms.rooms.get(code)!.harmonies!,actor=state.players[state.turn].id,p=players.find(p=>p.view.me?.id===actor)!;const legal=rules.getLegalActions(state,actor);
   const action=(legal.find(a=>a.type==='harmonies-place')??legal.find(a=>a.type==='harmonies-group')??legal.find(a=>a.type==='harmonies-end')) as HarmoniesAction;assert.ok(action);
   const final=rules.applyAction(state,actor,action,()=>.42).phase==='finished';await p.wait(m=>m.type==='state'&&m.view.revision===app.rooms.rooms.get(code)!.revision);
   if(!final){assert.equal((await p.command(action)).ok,true);continue;}
   const revision=app.rooms.rooms.get(code)!.revision;assert.equal((await p.command({...action,score:999999},randomUUID(),revision)).ok,false);assert.equal(app.store.harmoniesLeaderboards()[mode].length,0);
   if(backend==='sqlite'){
    const record=app.store.recordHarmoniesScores;app.store.recordHarmoniesScores=()=>{throw Error('simulated rank storage failure');};
    try{const error=await p.send({type:'command',action,id:randomUUID(),revision},'error');assert.match(error.error,/บันทึกไม่สำเร็จ/);assert.equal(app.rooms.rooms.get(code)!.harmonies!.phase,'playing');assert.equal(app.rooms.rooms.get(code)!.revision,revision);assert.equal(app.store.harmoniesLeaderboards()[mode].length,0);}finally{app.store.recordHarmoniesScores=record;}
   }
   if(backend==='postgres'){
    second??=await startServer(0,'127.0.0.1',true,()=>.42,{storePath:path});const origin=`http://localhost:${(second.server.address() as any).port}`,replacement=await peer(owner,origin);await replacement.send({type:'resume',code,token:host.token},'state');replacement.token=host.token;host=replacement;
   }else await host.send({type:'sync'},'state');
   const ids=[randomUUID(),randomUUID()],race=await Promise.all([p.command(action,ids[0],revision),host.command(action,ids[1],revision)]);assert.equal(race.filter(a=>a.ok).length,1);
   const winner=race[0].ok?p:host,receipt=race[0].ok?ids[0]:ids[1];const before=app.store.harmoniesLeaderboards();assert.equal((await winner.command(action,receipt,revision)).ok,true);assert.deepEqual(app.store.harmoniesLeaderboards(),before);
   assert.equal((await winner.command(action,randomUUID(),revision)).ok,false);
   if(backend==='postgres')app.rooms.active('force-refresh');
   const finished=app.rooms.rooms.get(code)!.harmonies!;assert.equal(finished.phase,'finished');assert.equal(before[mode].length,count);assert.deepEqual(before[mode].map(r=>r.score).sort((a,b)=>a-b),finished.players.map(p=>rules.scorePlayer(p,finished.side).total).sort((a,b)=>a-b));
   last={code,token:players[0].token,cookie:owner};break;
  }
 }
 const response=await fetch(url+'/api/games/harmonies/leaderboard');assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');const board=await response.json();assert.equal(board.solo.length,1);assert.equal(board.competitive.length,2);
 for(const entry of [...board.solo,...board.competitive])assert.deepEqual(Object.keys(entry).sort(),['achievedAt','avatar','name','rank','score']);assert.ok(!JSON.stringify(board).includes(last!.token));
 const forged=await fetch(url+'/api/games/harmonies/leaderboard',{method:'POST',headers:{'Content-Type':'application/json',Origin:url},body:JSON.stringify({score:999999})});assert.ok(!forged.ok);assert.deepEqual(app.store.harmoniesLeaderboards(),board);
 await second?.close();second=undefined;await app.close();app=await startServer(0,'127.0.0.1',true,()=>.42,{storePath:path});url=`http://localhost:${(app.server.address() as any).port}`;assert.deepEqual(app.store.harmoniesLeaderboards(),board);
 const returning=await peer(last!.cookie);await returning.send({type:'resume',code:last!.code,token:last!.token},'state');assert.equal(returning.view.phase,'finished');assert.ok(returning.view.me);assert.deepEqual(app.store.harmoniesLeaderboards(),board);
 }finally{for(const p of peers)p.ws.terminate();await second?.close();await app.close();await rm(dir,{recursive:true,force:true});}
});
