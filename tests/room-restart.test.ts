import {test} from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import {randomUUID} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startServer} from '../src/server/index.js';
import {gameAdapters} from '../src/games/registry.js';
import * as ck from '../src/games/critter-kitchen/engine.js';
import * as hm from '../src/games/harmonies/engine.js';
import {validateRoomRecord} from '../src/server/room-validation.js';
import {seeded} from './critter-kitchen-fixtures.js';
class Peer{
 messages:any[]=[];ws!:WebSocket;
 async connect(url:string,cookie:string){this.ws=new WebSocket(url.replace('http','ws')+'/ws',{origin:url,headers:{Cookie:cookie}});this.ws.on('message',m=>this.messages.push(JSON.parse(String(m))));await new Promise<void>((r,j)=>{this.ws.once('open',r);this.ws.once('error',j);});return this;}
 async send(message:unknown,type:string){const from=this.messages.length;this.ws.send(JSON.stringify(message));for(let i=0;i<1000;i++){const found=this.messages.slice(from).find(m=>m.type===type);if(found)return found;await new Promise(r=>setTimeout(r,5));}throw Error('Protocol timeout');}
}
test('all online games: only owner can restart mid-game; fresh setup, strict revision, retry and restored sessions',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'room-restart-')),path=join(dir,'rooms.sqlite');let app=await startServer(0,'127.0.0.1',true,seeded(822),{storePath:path});let url=`http://localhost:${(app.server.address() as any).port}`;const peers:Peer[]=[];
 const identity=async(owner=false)=>{const r=await fetch(url+'/api/auth/sign-in/anonymous',{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:'{}'});const data=await r.json();if(owner)await(await app.auth.$context).internalAdapter.updateUser(data.user.id,{isAnonymous:false});return r.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');};
 const connect=async(cookie:string)=>{const p=await new Peer().connect(url,cookie);peers.push(p);return p;};
 try{
 const cookies=[await identity(true),await identity(),await identity(),await identity()];let last:{code:string;token:string;state:unknown}|undefined;
 for(const id of Object.keys(gameAdapters) as (keyof typeof gameAdapters)[]){
  const host=await connect(cookies[0]),hs=await host.send({type:'create',gameId:id},'session');const phones=[];for(let i=0;i<(id==='sounds-fishy'?4:id==='camel-up'?3:2);i++){const p=await connect(cookies[i]);await p.send({type:'join',code:hs.code,name:'เล่น '+i},'session');phones.push(p);}
  const room=app.rooms.rooms.get(hs.code)!;if(id==='dracula-vs-van-helsing'){room.players[0].character='dracula';room.players[1].character='helsing';}
  const field=({'sounds-fishy':'soundsFishy',perch:'perch',draftosaurus:'draftosaurus','take-time':'takeTime',locus:'locus','critter-kitchen':'ck','sky-team':'sky',harmonies:'harmonies',pixies:'pixies',jaipur:'jaipur','seven-wonders-duel':'wonders',calico:'calico',azul:'azul','camel-up':'game','dracula-vs-van-helsing':'duel'} as const)[id];
  let initial=gameAdapters[id].start(room.players,seeded(44),undefined);
  if(id==='critter-kitchen'){room.ckExpansions={luckyDuck:true,rudy:true};initial=ck.createInitialState(room.players,seeded(44),{restaurateurs:true,tutorial:true,expansions:room.ckExpansions});}
  if(id==='harmonies')initial=hm.createInitialState(room.players,seeded(44),undefined,'B',{natureSpirits:true,whispers:true});
  (room as any)[field]=initial;await host.send({type:'sync'},'state');const before=JSON.stringify(initial),revision=room.revision;
  const command=(p:Peer,action:unknown,rev=revision,actionId=randomUUID())=>p.send({type:'command',id:actionId,revision:rev,action},'ack');
  assert.equal((await command(phones[1],{type:'room-restart'})).ok,false,id);assert.equal(JSON.stringify((room as any)[field]),before);
  assert.equal((await command(host,{type:'room-restart',playerId:room.players[0].id})).ok,false);
  const actionId=randomUUID();assert.equal((await command(host,{type:'room-restart'},revision,actionId)).ok,true,id);assert.equal(room.revision,revision+1);const restarted=JSON.stringify((room as any)[field]);assert.notEqual(restarted,before,id);assert.ok(validateRoomRecord({...room,sessions:room.sessions.map(s=>({...s,receipts:[...s.receipts]}))}),id);
  assert.equal((await command(host,{type:'room-restart'},revision,actionId)).ok,true);assert.equal(JSON.stringify((room as any)[field]),restarted);
  assert.equal((await command(host,{type:'room-restart'},revision)).ok,false);assert.equal(JSON.stringify((room as any)[field]),restarted);
  if(id==='critter-kitchen'){assert.equal(room.ck!.phase,'restaurateurs');assert.ok(room.ck!.players.every(p=>p.offers.length===2&&p.restaurateur===null));assert.ok(room.ck!.excludedRumors!.length);assert.deepEqual(room.ck!.expansions,room.ckExpansions);}
  if(id==='harmonies'){assert.equal(room.harmonies!.side,'B');assert.equal(room.harmonies!.options!.natureSpirits,true);assert.equal(room.harmonies!.options!.whispers,true);}
  const view=(await phones[1].send({type:'sync'},'state')).view;assert.equal(view.revision,room.revision);assert.equal(view.me.canManage,false);assert.equal(view.bag,undefined);
  last={code:hs.code,token:hs.token,state:JSON.parse(restarted)};for(const p of [host,...phones])p.ws.close();
 }
 assert.ok(last);await app.close();app=await startServer(0,'127.0.0.1',true,seeded(822),{storePath:path});url=`http://localhost:${(app.server.address() as any).port}`;assert.equal(app.store.quarantined.length,0);const resumed=await connect(cookies[0]);await resumed.send({type:'resume',code:last.code,token:last.token},'state');const room=app.rooms.rooms.get(last.code)!;assert.deepEqual(room.duel,last.state);
 }finally{for(const p of peers)p.ws.close();await app.close();await rm(dir,{recursive:true,force:true});}
});
