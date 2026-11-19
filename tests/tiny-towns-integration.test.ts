import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import WebSocket from 'ws';
import {startServer} from '../src/server/index.js';
import {validateRoomRecord} from '../src/server/room-validation.js';
import {getBuilds} from '../src/games/tiny-towns/geometry.js';
import {validateTinyState} from '../src/games/tiny-towns/validation.js';
class Peer {
 ws!:WebSocket;messages:any[]=[];
 async open(url:string,cookie=''){this.ws=new WebSocket(url.replace('http','ws')+'/ws',{origin:url,headers:{Cookie:cookie}});this.ws.on('message',m=>this.messages.push(JSON.parse(String(m))));await new Promise<void>((r,j)=>{this.ws.once('open',r);this.ws.once('error',j);});return this;}
 async send(message:any,type='ack'){const from=this.messages.length;this.ws.send(JSON.stringify(message));for(let i=0;i<1000;i++){const m=this.messages.slice(from).find(m=>m.type===type&&(type!=='ack'||m.id===message.id));if(m)return m;await new Promise(r=>setTimeout(r,5));}throw Error('Protocol timeout '+type);}
 async sync(){return (await this.send({type:'sync'},'state')).view;}
}
const rng=(seed=1)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
test('Tiny Towns HTTP/WS six controllers: secret draft, display denial, retry/race, cap, account-bound resume and durable effects',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'tiny-')),path=join(dir,'rooms.sqlite');let app=await startServer(0,'127.0.0.1',true,rng(1),{storePath:path}),url='http://localhost:'+(app.server.address() as any).port;const peers:Peer[]=[];
 const identity=async(owner=false)=>{const r=await fetch(url+'/api/auth/sign-in/anonymous',{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:'{}'}),d=await r.json();if(owner)await(await app.auth.$context).internalAdapter.updateUser(d.user.id,{isAnonymous:false});return r.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');};
 const connect=async(cookie='')=>{const p=await new Peer().open(url,cookie);peers.push(p);return p;};
 try{
  const owner=await identity(true),cookies=await Promise.all(Array.from({length:6},()=>identity()));let host=await connect(owner),phones=await Promise.all(cookies.map(connect)),watcher=await connect();
  const hs=await host.send({type:'create',gameId:'tiny-towns'},'session'),code=hs.code,sessions:{playerId:string;token:string}[]=[];for(let i=0;i<6;i++)sessions.push(await phones[i].send({type:'join',code,name:'เมือง '+i},'session'));
  await watcher.send({type:'watch',code},'state');const outsider=await connect(await identity());assert.equal((await outsider.send({type:'join',code,name:'เกิน'},'error')).type,'error');
  const room=()=>app.rooms.rooms.get(code)!,record=()=>({...room(),sessions:room().sessions.map(s=>({...s,receipts:[...s.receipts]}))}),cmd=(p:Peer,action:any,revision=room().revision,id=randomUUID())=>p.send({type:'command',id,revision,action});
  assert.equal((await cmd(phones[0],{type:'tiny-options',options:{randomBuildings:true,monuments:true,cavern:false,mode:'master'}})).ok,false);
  for(const phone of phones)assert.equal((await cmd(phone,{type:'ready',ready:true})).ok,true);
  assert.equal((await cmd(host,{type:'start',startingPlayerId:sessions[0].playerId})).ok,true);assert.ok(validateRoomRecord(record()));
  const views=await Promise.all(phones.map(p=>p.sync())),display=await watcher.sync();assert.equal(display.me,undefined);for(let i=0;i<6;i++){assert.equal(views[i].me.offer.length,2);assert.equal(views[i].players.some((p:any)=>p.offer||p.monument),false);assert.notDeepEqual(views[i].me.offer,views[(i+1)%6].me.offer);}
  assert.equal((await watcher.send({type:'command',id:randomUUID(),revision:room().revision,action:{type:'tiny-monument',card:views[0].me.offer[0]}},'error')).type,'error');
  assert.equal((await cmd(phones[0],{type:'tiny-monument',card:views[1].me.offer[0]})).ok,false);
  for(let i=0;i<6;i++)assert.equal((await cmd(phones[i],{type:'tiny-monument',card:views[i].me.offer[0]})).ok,true);
  const revision=room().revision,call={type:'tiny-call',resource:'wood'};assert.equal((await cmd(phones[1],call)).ok,false);
  const id=randomUUID();assert.equal((await cmd(phones[0],call,revision,id)).ok,true);assert.equal((await cmd(phones[0],call,revision,id)).ok,true);assert.equal(room().revision,revision+1);
  const raceRev=room().revision,race=await Promise.all([cmd(phones[0],{type:'tiny-place',resource:'wood',at:0},raceRev),cmd(phones[1],{type:'tiny-place',resource:'wood',at:1},raceRev)]);assert.equal(race.filter(a=>a.ok).length,1);const loser=race[0].ok?1:0;assert.equal((await cmd(phones[loser],{type:'tiny-place',resource:'wood',at:loser})).ok,true);
  assert.equal((await cmd(phones[0],{type:'tiny-place',resource:'wood',at:0,playerId:sessions[1].playerId})).ok,false);
  const controller=room().tiny!.players.find(p=>p.id===sessions[0].playerId)!;controller.board=Array(16).fill(null);controller.board[0]={resource:'wood'};controller.board[4]={resource:'brick'};controller.board[5]={resource:'stone'};controller.board[6]={resource:'stone'};controller.board[7]={resource:'brick'};const factory=getBuilds(room().tiny!,controller).find(b=>b.card==='factory')!;assert.equal((await cmd(phones[0],{type:'tiny-build',card:'factory',cells:factory.cells,at:0})).ok,true);assert.equal((await watcher.sync()).players.find((p:any)=>p.id===sessions[0].playerId).pending,1);
  const own=await phones[0].sync(),saved=JSON.stringify(room().tiny),rev=room().revision;assert.ok(validateTinyState(room().tiny));await app.close();app=await startServer(0,'127.0.0.1',true,rng(9),{storePath:path});url='http://localhost:'+(app.server.address() as any).port;assert.equal(app.store.quarantined.length,0);
  const wrong=await connect(cookies[1]);await wrong.send({type:'resume',code,token:sessions[0].token},'error');
  phones[0]=await connect(cookies[0]);const resumed=(await phones[0].send({type:'resume',code,token:sessions[0].token},'state')).view;assert.equal(resumed.revision,rev);assert.equal(resumed.me.monument,own.me.monument);assert.equal(JSON.stringify(room().tiny),saved);assert.deepEqual(resumed.me.effects,own.me.effects);assert.equal(resumed.me.effects[0].kind,'marker');assert.equal((await cmd(phones[0],{type:'tiny-marker',resource:'glass'})).ok,true);assert.ok(validateRoomRecord(record()));
  assert.equal((await cmd(phones[0],{type:'room-restart'})).ok,false);host=await connect(owner);await host.send({type:'resume',code,token:hs.token},'state');assert.equal((await cmd(host,{type:'room-restart'})).ok,true);assert.equal(room().tiny!.phase,'monuments');assert.ok(validateRoomRecord(record()));
 }finally{for(const p of peers)p.ws.close();await app.close();await rm(dir,{recursive:true,force:true});}
});
