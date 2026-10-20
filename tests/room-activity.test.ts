import {test} from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startServer} from '../src/server/index.js';
test('room activity is per identity, server timed, durable and never removes membership or changes revision',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'room-activity-')),path=join(dir,'db.sqlite');let app=await startServer(0,'127.0.0.1',true,()=>.43,{storePath:path}),url=`http://localhost:${(app.server.address() as any).port}`;const sockets:WebSocket[]=[];
 const identity=async(member=false)=>{const response=await fetch(url+'/api/auth/sign-in/anonymous',{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:'{}'}),data=await response.json();if(member)await(await app.auth.$context).internalAdapter.updateUser(data.user.id,{isAnonymous:false});return {id:data.user.id as string,cookie:response.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ')};};
 const post=(cookie:string,code:string)=>fetch(url+'/api/rooms/visit',{method:'POST',headers:{Origin:url,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({code,lastVisitedAt:1})});
 try{
 const owner=await identity(true),outsider=await identity();const ws=new WebSocket(url.replace('http','ws')+'/ws',{origin:url,headers:{Cookie:owner.cookie}});sockets.push(ws);await new Promise<void>((r,j)=>{ws.once('open',r);ws.once('error',j);});
 const session=await new Promise<any>(resolve=>{ws.on('message',raw=>{const m=JSON.parse(String(raw));if(m.type==='session')resolve(m);});ws.send(JSON.stringify({type:'create',gameId:'harmonies'}));});
 const room=app.rooms.rooms.get(session.code)!,revision=room.revision;const initial=app.rooms.active(owner.id)[0].lastVisitedAt!;assert.ok(initial>Date.now()-10000);assert.equal(app.rooms.active(outsider.id).length,0);
 assert.equal((await post(outsider.cookie,room.code)).ok,false);assert.equal((await post('',room.code)).status,401);
 const before=Date.now();assert.equal((await post(owner.cookie,room.code)).status,200);const visited=app.rooms.active(owner.id)[0].lastVisitedAt!;assert.ok(visited>=before);assert.equal(room.revision,revision);assert.equal(room.sessions.length,1);assert.equal(app.rooms.active(owner.id)[0].owner,true);
 assert.equal(app.store.recent(owner.id).length,0); // Lobby visits are not a played game.
 const save=app.store.saveRooms;app.store.saveRooms=()=>{throw Error('simulated storage failure');};try{assert.throws(()=>app.rooms.visit(owner.id,room.code),/simulated storage failure/);assert.equal(app.rooms.active(owner.id)[0].lastVisitedAt,visited);}finally{app.store.saveRooms=save;}

 await app.close();app=await startServer(0,'127.0.0.1',true,()=>.43,{storePath:path});url=`http://localhost:${(app.server.address() as any).port}`;assert.ok(app.rooms.active(owner.id)[0].lastVisitedAt!>=visited);assert.equal(app.rooms.rooms.get(room.code)!.revision,revision);assert.equal(app.store.recent(owner.id).length,0);
 }finally{for(const socket of sockets)socket.terminate();await app.close();await rm(dir,{recursive:true,force:true});}
});
