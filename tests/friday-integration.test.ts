import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import WebSocket from 'ws';
import {startServer} from '../src/server/index.js';
import {validateRoomRecord} from '../src/server/room-validation.js';
import {battle,rng} from './friday-fixtures.js';
import {validateFridayState} from '../src/games/friday/validation.js';
class Peer {
 ws!:WebSocket;messages:any[]=[];
 async open(url:string,cookie=''){this.ws=new WebSocket(url.replace('http','ws')+'/ws',{origin:url,headers:{Cookie:cookie}});this.ws.on('message',m=>this.messages.push(JSON.parse(String(m))));await new Promise<void>((r,j)=>{this.ws.once('open',r);this.ws.once('error',j);});return this;}
 async send(message:any,type='ack'){const from=this.messages.length;this.ws.send(JSON.stringify(message));for(let i=0;i<1000;i++){const m=this.messages.slice(from).find(m=>m.type===type&&(type!=='ack'||m.id===message.id));if(m)return m;await new Promise(r=>setTimeout(r,5));}throw Error('Protocol timeout '+type);}
 async sync(){return (await this.send({type:'sync'},'state')).view;}
}
test('Friday solo actual HTTP/WS: one controller, display denial, strict payload, retry/race, private sort and account-bound cold resume',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'friday-')),path=join(dir,'rooms.sqlite');let app=await startServer(0,'127.0.0.1',true,rng(1),{storePath:path}),url='http://localhost:'+(app.server.address() as any).port;const peers:Peer[]=[];
 const identity=async(owner=false)=>{const r=await fetch(url+'/api/auth/sign-in/anonymous',{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:'{}'}),d=await r.json();if(owner)await(await app.auth.$context).internalAdapter.updateUser(d.user.id,{isAnonymous:false});return r.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');};
 const connect=async(cookie='')=>{const p=await new Peer().open(url,cookie);peers.push(p);return p;};
 try{
  const owner=await identity(true),guest=await identity(),other=await identity();let host=await connect(owner),phone=await connect(guest),watcher=await connect();
  const hs=await host.send({type:'create',gameId:'friday'},'session'),code=hs.code,ps=await phone.send({type:'join',code,name:'โรบินสัน'},'session');await watcher.send({type:'watch',code},'state');
  const room=()=>app.rooms.rooms.get(code)!,record=()=>({...room(),sessions:room().sessions.map(s=>({...s,receipts:[...s.receipts]}))}),cmd=(p:Peer,action:any,revision=room().revision,id=randomUUID())=>p.send({type:'command',id,revision,action});
  const outsider=await connect(other);assert.equal((await outsider.send({type:'join',code,name:'เพิ่มคน'},'error')).type,'error');assert.equal(room().players.length,1);
  assert.equal((await cmd(phone,{type:'start'})).ok,false);assert.equal((await cmd(host,{type:'fr-level',level:4,life:99})).ok,false);
  assert.equal((await cmd(host,{type:'fr-level',level:4})).ok,true);assert.equal((await phone.sync()).level,4);assert.equal((await cmd(host,{type:'fr-level',level:1})).ok,true);
  assert.equal((await cmd(phone,{type:'ready',ready:true})).ok,true);assert.equal((await cmd(host,{type:'start'})).ok,true);
  assert.ok(validateFridayState(room().friday));assert.ok(validateRoomRecord(record()));
  const initial=await phone.sync(),choice=initial.me.legal[0],before=JSON.stringify(room().friday);assert.equal((await cmd(host,choice)).ok,false);assert.equal(JSON.stringify(room().friday),before);
  const rev=room().revision,id=randomUUID();assert.equal((await cmd(phone,choice,rev,id)).ok,true);const selected=JSON.stringify(room().friday);assert.equal((await cmd(phone,choice,rev,id)).ok,true);assert.equal(JSON.stringify(room().friday),selected);
  const r=room().revision,race=await Promise.all([cmd(phone,{type:'fr-draw'},r),cmd(phone,{type:'fr-draw'},r)]);assert.equal(race.filter(m=>m.ok).length,1);assert.equal(room().friday!.played.length,1);
  const pub=await watcher.sync();assert.equal(pub.me,undefined);assert.equal(pub.deck,undefined);assert.equal(pub.aging,undefined);assert.ok(!JSON.stringify(pub).includes(ps.token));
  // Internal fixture exercises the same production transition/persistence path for a rare pending effect.
  const fixture=battle(['h19','s4'],'h28');fixture.players=structuredClone(room().friday!.players);fixture.matchId=room().friday!.matchId;room().friday=fixture;
  assert.equal((await cmd(phone,{type:'fr-use',source:1})).ok,true);assert.equal((await cmd(phone,{type:'fr-sort-draw'})).ok,true);assert.equal((await cmd(phone,{type:'fr-sort-draw'})).ok,true);
  const own=await phone.sync(),hidden=await watcher.sync();assert.equal(own.me.peek.length,2);assert.equal(hidden.pending.count,2);assert.equal(hidden.pending.cards,undefined);assert.equal(hidden.me,undefined);assert.ok(validateRoomRecord(record()));
  const saved=JSON.stringify(room().friday),revision=room().revision;await app.close();app=await startServer(0,'127.0.0.1',true,rng(9),{storePath:path});url='http://localhost:'+(app.server.address() as any).port;assert.equal(app.store.quarantined.length,0);
  const wrong=await connect(other);await wrong.send({type:'resume',code,token:ps.token},'error');
  phone=await connect(guest);const resumed=(await phone.send({type:'resume',code,token:ps.token},'state')).view;assert.equal(resumed.revision,revision);assert.deepEqual(resumed.me.peek,own.me.peek);assert.equal(JSON.stringify(room().friday),saved);
  assert.equal((await cmd(phone,{type:'fr-sort-finish',order:[...own.me.peek].reverse()})).ok,true);assert.ok(validateRoomRecord(record()));assert.equal((await cmd(phone,{type:'room-restart'})).ok,false);
  host=await connect(owner);await host.send({type:'resume',code,token:hs.token},'state');assert.equal((await cmd(host,{type:'room-restart'})).ok,true);assert.equal(room().friday!.phase,'choose');assert.equal(room().friday!.level,1);assert.ok(validateRoomRecord(record()));
 }finally{for(const p of peers)p.ws.close();await app.close();await rm(dir,{recursive:true,force:true});}
});
