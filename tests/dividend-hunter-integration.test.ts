import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {randomUUID} from 'node:crypto';import WebSocket from 'ws';import {startServer} from '../src/server/index.js';
class Peer{messages:any[]=[];ws!:WebSocket;async connect(url:string,cookie:string){this.ws=new WebSocket(url.replace('http','ws')+'/ws',{origin:url,headers:{Cookie:cookie}});this.ws.on('message',m=>this.messages.push(JSON.parse(String(m))));await new Promise<void>((r,j)=>{this.ws.once('open',r);this.ws.once('error',j);});return this;}async send(m:any,type='ack'){const n=this.messages.length;this.ws.send(JSON.stringify(m));for(let i=0;i<800;i++){const x=this.messages.slice(n).find(x=>x.type===type&&(type!=='ack'||x.id===m.id));if(x)return x;await new Promise(r=>setTimeout(r,5));}throw Error('Protocol timeout '+m.type);}}
test('Dividend Hunter: two phones, owner advances, privacy, retry, stale state, reconnect and final winner',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'hunter-start-'));let app=await startServer(0,'127.0.0.1',true,()=>.41,{storePath:join(dir,'rooms.sqlite')}),url='http://localhost:'+(app.server.address() as any).port;const peers:Peer[]=[];
 const identity=async(owner=false)=>{const r=await fetch(url+'/api/auth/sign-in/anonymous',{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:'{}'}),d=await r.json();if(owner)await(await app.auth.$context).internalAdapter.updateUser(d.user.id,{isAnonymous:false});return r.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');};const connect=async(c:string)=>{const p=await new Peer().connect(url,c);peers.push(p);return p;};
 try{const hostCookie=await identity(true),host=await connect(hostCookie),hs=await host.send({type:'create',gameId:'dividend-hunter'},'session'),players=[] as Peer[];for(let i=0;i<2;i++){const c=i===0?hostCookie:await identity(),p=await connect(c),s=await p.send({type:'join',code:hs.code,name:'หุ้น '+i},'session');players.push(p);const room=app.rooms.rooms.get(hs.code)!;const ready=await p.send({type:'command',id:randomUUID(),revision:room.revision,action:{type:'ready',ready:true}});assert.equal(ready.ok,true);assert.ok(s.playerId);}
 const room=app.rooms.rooms.get(hs.code)!,result=await host.send({type:'command',id:randomUUID(),revision:room.revision,action:{type:'start',rounds:2,limit:120}});assert.equal(result.ok,true,JSON.stringify(result));assert.equal(room.hunter?.players.length,2);assert.equal(room.hunter?.rounds,2);assert.equal(room.hunter?.limit,120);
 const cmd=(p:Peer,action:any)=>p.send({type:'command',id:randomUUID(),revision:room.revision,action});
 const actionId=randomUUID(),revision=room.revision;
 const action={type:'command',id:actionId,revision,action:{type:'hunter-bid',amount:10}};
 assert.equal((await players[0].send(action)).ok,true);
 assert.equal((await players[0].send(action)).ok,true,'same command is idempotent');
 const display=(await host.send({type:'sync'},'state')).view;
 assert.ok(display.players.every((p:any)=>p.bid===undefined));assert.equal(display.submitted,1);
 assert.equal((await cmd(players[1],{type:'hunter-bid',amount:10})).ok,true);
 assert.equal(room.hunter?.phase,'round-end');
 assert.equal((await cmd(players[1],{type:'hunter-next'})).ok,false,'ordinary player cannot advance');
 assert.equal((await cmd(players[0],{type:'hunter-next'})).ok,true,'owner advances from player phone');
 assert.equal(room.hunter?.round,2);
 assert.equal(room.hunter?.phase,'playing');
 assert.equal((await players[0].send({type:'command',id:randomUUID(),revision,action:{type:'hunter-bid',amount:120}})).ok,false,'old round command rejected');
 const cookiePeer=await connect(hostCookie);const joined=await cookiePeer.send({type:'join',code:hs.code,name:'หุ้น 0'},'session');
 const resumeToken=joined.token;cookiePeer.ws.close();const resumed=await connect(hostCookie);await resumed.send({type:'resume',code:hs.code,token:resumeToken},'state');
 assert.equal((await cmd(resumed,{type:'hunter-bid',amount:120})).ok,true);
 assert.equal((await cmd(players[1],{type:'hunter-bid',amount:1})).ok,true);
 assert.equal(room.hunter?.phase,'finished');assert.deepEqual(room.hunter?.players.map(p=>p.score),[120,1]);
 assert.equal((await cmd(resumed,{type:'room-restart'})).ok,true);assert.equal(room.hunter?.round,1);assert.equal(room.hunter?.limit,120);


 }finally{for(const p of peers)p.ws.close();await app.close();await rm(dir,{recursive:true,force:true});}
});
