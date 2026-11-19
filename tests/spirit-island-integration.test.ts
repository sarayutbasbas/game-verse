import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import WebSocket from 'ws';
import {startServer} from '../src/server/index.js';
import {validateRoomRecord} from '../src/server/room-validation.js';

import {validateSpiritState} from '../src/games/spirit-island/validation.js';
class Peer {
 ws!:WebSocket;messages:any[]=[];
 async open(url:string,cookie=''){this.ws=new WebSocket(url.replace('http','ws')+'/ws',{origin:url,headers:{Cookie:cookie}});this.ws.on('message',m=>this.messages.push(JSON.parse(String(m))));await new Promise<void>((r,j)=>{this.ws.once('open',r);this.ws.once('error',j);});return this;}
 async send(message:any,type='ack'){const from=this.messages.length;this.ws.send(JSON.stringify(message));for(let i=0;i<1000;i++){const m=this.messages.slice(from).find(m=>m.type===type&&(type!=='ack'||m.id===message.id));if(m)return m;await new Promise(r=>setTimeout(r,5));}throw Error('Protocol timeout '+type);}
 async sync(){return (await this.send({type:'sync'},'state')).view;}
}
const rng=(seed=1)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
test('Spirit Island four actual WS controllers: private hand/offer, read-only display, receipts, stale race, persisted gain/reconnect and rematch',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'spirit-')),path=join(dir,'rooms.sqlite');let app=await startServer(0,'127.0.0.1',true,rng(1),{storePath:path}),url='http://localhost:'+(app.server.address() as any).port;const peers:Peer[]=[];
 const identity=async(owner=false)=>{const r=await fetch(url+'/api/auth/sign-in/anonymous',{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:'{}'}),d=await r.json();if(owner)await(await app.auth.$context).internalAdapter.updateUser(d.user.id,{isAnonymous:false});return r.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');};
 const connect=async(cookie='')=>{const p=await new Peer().open(url,cookie);peers.push(p);return p;};
 try{const owner=await identity(true),cookies=await Promise.all(Array.from({length:4},()=>identity()));let host=await connect(owner),phones=await Promise.all(cookies.map(connect)),watcher=await connect();const hs=await host.send({type:'create',gameId:'spirit-island'},'session'),code=hs.code,sessions:{playerId:string;token:string}[]=[];for(let i=0;i<4;i++)sessions.push(await phones[i].send({type:'join',code,name:'ภูติ '+i},'session'));await watcher.send({type:'watch',code},'state');const outsider=await connect(await identity());await outsider.send({type:'join',code,name:'เกิน'},'error');
 const room=()=>app.rooms.rooms.get(code)!,record=()=>({...room(),sessions:room().sessions.map(s=>({...s,receipts:[...s.receipts]}))}),cmd=(p:Peer,action:any,revision=room().revision,id=randomUUID())=>p.send({type:'command',id,revision,action});
 assert.equal((await cmd(phones[0],{type:'si-options',options:{progression:false,blightCard:true}})).ok,false);assert.equal((await cmd(host,{type:'si-options',options:{progression:false,blightCard:true}})).ok,true);for(const phone of phones)assert.equal((await cmd(phone,{type:'ready',ready:true})).ok,true);assert.equal((await cmd(host,{type:'start'})).ok,true);assert.ok(validateRoomRecord(record()));
 const rev=room().revision,id=randomUUID(),choose={type:'si-spirit',spirit:'river'};assert.equal((await cmd(phones[0],choose,rev,id)).ok,true);assert.equal((await cmd(phones[0],choose,rev,id)).ok,true);assert.equal(room().revision,rev+1);
 const raceRev=room().revision,race=await Promise.all([cmd(phones[1],{type:'si-spirit',spirit:'lightning'},raceRev),cmd(phones[2],{type:'si-spirit',spirit:'earth'},raceRev)]);assert.equal(race.filter(x=>x.ok).length,1);const loser=race[0].ok?2:1;assert.equal((await cmd(phones[loser],{type:'si-spirit',spirit:loser===2?'earth':'lightning'})).ok,true);assert.equal((await cmd(phones[3],{type:'si-spirit',spirit:'shadows'})).ok,true);
 const views=await Promise.all(phones.map(p=>p.sync())),display=await watcher.sync();assert.equal(display.me,undefined);for(let i=0;i<4;i++){assert.equal(views[i].me.hand.length,4);assert.equal(views[i].players.some((p:any)=>p.hand||p.progression||p.offer),false);assert.notDeepEqual(views[i].me.hand,views[(i+1)%4].me.hand);}
 assert.equal((await watcher.send({type:'command',id:randomUUID(),revision:room().revision,action:{type:'si-growth',option:2}},'error')).type,'error');assert.equal((await cmd(host,{type:'si-growth',option:2})).ok,false);assert.equal((await cmd(phones[0],{type:'si-growth',option:2,playerId:sessions[1].playerId})).ok,false);
 assert.equal((await cmd(phones[0],{type:'si-growth',option:2})).ok,true);assert.equal((await cmd(phones[0],{type:'si-growth-step',index:0})).ok,true);assert.equal((await cmd(phones[0],{type:'si-gain',deck:'minor'})).ok,true);const own=await phones[0].sync();assert.equal(own.me.offer.cards.length,4);assert.equal((await phones[1].sync()).me.offer,undefined);assert.equal((await watcher.sync()).me,undefined);assert.ok(validateSpiritState(room().spiritIsland));assert.ok(validateRoomRecord(record()));const saved=JSON.stringify(room().spiritIsland),revision=room().revision;
 await app.close();app=await startServer(0,'127.0.0.1',true,rng(99),{storePath:path});url='http://localhost:'+(app.server.address() as any).port;assert.equal(app.store.quarantined.length,0);const wrong=await connect(cookies[1]);await wrong.send({type:'resume',code,token:sessions[0].token},'error');phones[0]=await connect(cookies[0]);const resumed=(await phones[0].send({type:'resume',code,token:sessions[0].token},'state')).view;assert.equal(resumed.revision,revision);assert.deepEqual(resumed.me.offer,own.me.offer);assert.equal(JSON.stringify(room().spiritIsland),saved);assert.equal((await cmd(phones[0],{type:'si-keep',card:own.me.offer.cards[0]})).ok,true);assert.ok(validateRoomRecord(record()));assert.equal((await cmd(phones[0],{type:'room-restart'})).ok,false);host=await connect(owner);await host.send({type:'resume',code,token:hs.token},'state');assert.equal((await cmd(host,{type:'room-restart'})).ok,true);assert.equal(room().spiritIsland!.phase,'choose');assert.ok(validateRoomRecord(record()));
 }finally{for(const p of peers)p.ws.close();await app.close();await rm(dir,{recursive:true,force:true});}
});
