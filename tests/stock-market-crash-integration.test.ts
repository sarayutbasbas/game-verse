import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {randomUUID} from 'node:crypto';import WebSocket from 'ws';import {startServer} from '../src/server/index.js';
class Peer{messages:any[]=[];ws!:WebSocket;async connect(url:string,cookie:string){this.ws=new WebSocket(url.replace('http','ws')+'/ws',{origin:url,headers:{Cookie:cookie}});this.ws.on('message',m=>this.messages.push(JSON.parse(String(m))));await new Promise<void>((r,j)=>{this.ws.once('open',r);this.ws.once('error',j);});return this;}async send(m:any,type='ack'){const n=this.messages.length;this.ws.send(JSON.stringify(m));for(let i=0;i<800;i++){const x=this.messages.slice(n).find(x=>x.type===type&&(type!=='ack'||x.id===m.id));if(x)return x;await new Promise(r=>setTimeout(r,5));}throw Error('Protocol timeout '+m.type);}}
test('Stock Market Crash starts with two ready players using selected round and pot options',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'crash-start-'));let app=await startServer(0,'127.0.0.1',true,()=>.41,{storePath:join(dir,'rooms.sqlite')}),url='http://localhost:'+(app.server.address() as any).port;const peers:Peer[]=[];
 const identity=async(owner=false)=>{const r=await fetch(url+'/api/auth/sign-in/anonymous',{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:'{}'}),d=await r.json();if(owner)await(await app.auth.$context).internalAdapter.updateUser(d.user.id,{isAnonymous:false});return r.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');};const connect=async(c:string)=>{const p=await new Peer().connect(url,c);peers.push(p);return p;};
 try{const hostCookie=await identity(true),host=await connect(hostCookie),hs=await host.send({type:'create',gameId:'stock-market-crash'},'session'),players=[] as Peer[];for(let i=0;i<2;i++){const c=i===0?hostCookie:await identity(),p=await connect(c),s=await p.send({type:'join',code:hs.code,name:'หุ้น '+i},'session');players.push(p);const room=app.rooms.rooms.get(hs.code)!;const ready=await p.send({type:'command',id:randomUUID(),revision:room.revision,action:{type:'ready',ready:true}});assert.equal(ready.ok,true);assert.ok(s.playerId);}
 const room=app.rooms.rooms.get(hs.code)!,result=await host.send({type:'command',id:randomUUID(),revision:room.revision,action:{type:'start',rounds:4,pot:120,limit:100}});assert.equal(result.ok,true,JSON.stringify(result));assert.equal(room.crash?.players.length,2);assert.equal(room.crash?.rounds,4);assert.equal(room.crash?.pot,120);assert.equal(room.crash?.limit,100);
 const cmd=(p:Peer,action:any)=>p.send({type:'command',id:randomUUID(),revision:room.revision,action});
 for(const p of players)assert.equal((await cmd(p,{type:'crash-bid',amount:10})).ok,true);
 assert.equal(room.crash?.phase,'playing');assert.equal(room.crash?.history.length,0);const closeRevision=room.revision,closes=players.map(()=>({type:'command',id:randomUUID(),revision:closeRevision,action:{type:'crash-end'}}));
 const replies=await Promise.all(players.map((p,i)=>p.send(closes[i])));assert.equal(replies.filter(r=>r.ok).length,1,'one reveal wins the race');const winner=replies.findIndex(r=>r.ok);const scores=JSON.stringify(room.crash!.players);assert.equal((await players[winner].send(closes[winner])).ok,true,'retry returns same receipt');assert.equal(JSON.stringify(room.crash!.players),scores);assert.equal(room.crash!.history.length,1);

 assert.equal(room.crash?.phase,'round-end');
 assert.equal((await cmd(players[1],{type:'crash-next'})).ok,false,'ordinary player cannot advance');
 assert.equal((await cmd(players[0],{type:'crash-next'})).ok,true,'owner advances from player phone');
 assert.equal(room.crash?.round,2);
 assert.equal(room.crash?.phase,'playing');

 }finally{for(const p of peers)p.ws.close();await app.close();await rm(dir,{recursive:true,force:true});}
});
