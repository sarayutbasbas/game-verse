import {test} from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startServer} from '../src/server/index.js';
import {gameAdapters} from '../src/games/registry.js';

class Peer {
 messages:any[]=[];ws!:WebSocket;
 async connect(url:string,cookie:string){this.ws=new WebSocket(url.replace('http','ws')+'/ws',{origin:url,headers:{Cookie:cookie}});this.ws.on('message',m=>this.messages.push(JSON.parse(String(m))));await new Promise<void>((r,j)=>{this.ws.once('open',r);this.ws.once('error',j);});return this;}
 async send(message:unknown,type:string){const from=this.messages.length;this.ws.send(JSON.stringify(message));for(let i=0;i<1000;i++){const found=this.messages.slice(from).find(m=>m.type===type);if(found)return found;await new Promise(r=>setTimeout(r,5));}throw Error('Protocol timeout '+type);}
}
test('all online games: atomic ready owner seat, private capabilities, duplicate create, display, cross-device join and persistence',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'creator-player-')),path=join(dir,'rooms.sqlite');let app=await startServer(0,'127.0.0.1',true,()=>.42,{storePath:path}),url=`http://localhost:${(app.server.address() as any).port}`;const peers:Peer[]=[];
 const connect=async(cookie:string)=>{const p=await new Peer().connect(url,cookie);peers.push(p);return p;};
 const identity=async(member=false)=>{const r=await fetch(url+'/api/auth/sign-in/anonymous',{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:'{}'}),data=await r.json();if(member)await(await app.auth.$context).internalAdapter.updateUser(data.user.id,{isAnonymous:false,name:'Creator'});return {id:data.user.id,cookie:r.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ')};};
 try{
  const owner=await identity(true),guest=await identity();let last:any;
  for(const gameId of Object.keys(gameAdapters)){
   const phone=await connect(owner.cookie),session=await phone.send({type:'create',gameId,joinAsPlayer:true,name:'Forged',userId:guest.id},'session'),room=app.rooms.rooms.get(session.code)!;
   assert.equal(session.role,'player',gameId);assert.equal(room.players.length,1);assert.equal(room.players[0].id,session.playerId);assert.equal(room.players[0].userId,owner.id);assert.equal(room.players[0].name,'Creator');assert.equal(room.players[0].ready,true);
   const view=(await phone.send({type:'sync'},'state')).view;assert.equal(view.me.canManage,true);assert.equal(view.me.id,session.playerId);assert.equal(view.sessions,undefined);
   const again=await phone.send({type:'create',gameId,joinAsPlayer:true},'session');assert.equal(again.token,session.token);assert.equal(room.players.length,1);
   const display=await connect(owner.cookie),host=await display.send({type:'watch',code:room.code},'session');assert.equal(host.role,'host');assert.notEqual(host.token,session.token);
   const publicView=(await display.send({type:'sync'},'state')).view;assert.equal(publicView.me,undefined);assert.ok(!JSON.stringify(publicView).includes(session.token));
   const spectator=await connect(guest.cookie);await spectator.send({type:'watch',code:room.code},'state');assert.equal(spectator.messages.some(m=>m.type==='session'),false);
   const otherPhone=await connect(owner.cookie),rejoined=await otherPhone.send({type:'join',code:room.code,name:'Another name'},'session');assert.equal(rejoined.token,session.token);assert.equal(room.players.length,1);assert.equal(room.players[0].ready,true);
   last={code:room.code,token:session.token,playerId:session.playerId};for(const p of [phone,display,spectator,otherPhone])p.ws.close();
  }
  const count=app.rooms.rooms.size,failed=await connect(owner.cookie),save=app.store.saveRooms;
  app.store.saveRooms=()=>{throw Error('simulated create storage failure');};
  try{await failed.send({type:'create',gameId:'harmonies',joinAsPlayer:true},'error');assert.equal(app.rooms.rooms.size,count);assert.equal(failed.messages.some(m=>m.type==='session'),false);}finally{app.store.saveRooms=save;}
  const invalid=await connect(owner.cookie);await invalid.send({type:'create',gameId:'harmonies',joinAsPlayer:'yes'},'error');assert.equal(app.rooms.rooms.size,count);
  const anonymous=await connect(guest.cookie);await anonymous.send({type:'create',gameId:'harmonies',joinAsPlayer:true},'error');assert.equal(app.rooms.rooms.size,count);
  await app.close();app=await startServer(0,'127.0.0.1',true,()=>.42,{storePath:path});url=`http://localhost:${(app.server.address() as any).port}`;
  assert.equal(app.store.quarantined.length,0);const restored=await connect(owner.cookie),v=(await restored.send({type:'resume',code:last.code,token:last.token},'state')).view;assert.equal(v.me.id,last.playerId);assert.equal(v.me.canManage,true);assert.equal(app.rooms.rooms.get(last.code)!.players.length,1);
 }finally{for(const p of peers)p.ws.close();await app.close();await rm(dir,{recursive:true,force:true});}
});
