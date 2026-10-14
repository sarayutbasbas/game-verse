import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {startServer} from '../src/server/index.js';
import WebSocket from 'ws';
import {Pool} from 'pg';
const database=process.env.GAMEVERSE_TEST_POSTGRES;
class Peer {
  ws!:WebSocket; messages:any[]=[];
  get view(){return this.messages.filter(m=>m.type==='state').at(-1)?.view;}
  async open(url:string,cookie='') {this.ws=new WebSocket(url.replace('http','ws')+'/ws',{origin:url,headers:{Cookie:cookie}});this.ws.on('message',r=>this.messages.push(JSON.parse(String(r))));await new Promise<void>((r,j)=>{this.ws.once('open',r);this.ws.once('error',j)});return this;}
  async wait(fn:(m:any)=>boolean,from=0){for(let i=0;i<2000;i++){const m=this.messages.slice(from).find(fn);if(m)return m;await new Promise(r=>setTimeout(r,5));}throw Error('Cross-instance delivery timeout');}
  async send(message:any,type='state'){const from=this.messages.length;this.ws.send(JSON.stringify(message));return this.wait(m=>m.type===type,from);}
  async command(action:any,revision=this.view.revision,id=randomUUID()){const ack=await this.send({type:'command',action,revision,id},'ack');await this.wait(m=>m.type==='state'&&m.view.revision===ack.revision);return ack;}
}
test('Postgres two instances: shared rooms/presence, atomic race, dedup, full Azul, takeover, profile and restart', {skip:!database,timeout:180000},async()=>{
  const apps=[await startServer(0,'127.0.0.1',true,()=>.42,{storePath:database}),await startServer(0,'127.0.0.1',true,()=>.42,{storePath:database})];
  const urls=apps.map(a=>'http://localhost:'+(a.server.address() as any).port),peers:Peer[]=[];
  const make=async(n:number,cookie='')=>{const p=await new Peer().open(urls[n],cookie);peers.push(p);return p;};
  const identity=async(account=false)=>{const r=await fetch(urls[0]+'/api/auth/sign-in/anonymous',{method:'POST',headers:{Origin:urls[0],'Content-Type':'application/json'},body:'{}'});assert.equal(r.status,200);const {user}=await r.json();if(account)await(await apps[0].auth.$context).internalAdapter.updateUser(user.id,{isAnonymous:false});return r.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');};
  try {
    console.log('Instances ready');const owner=await identity(true),guest=await identity();console.log('Identities ready');
    const host=await make(0,owner);await host.send({type:'create',gameId:'azul'},'session');await host.wait(m=>m.type==='state');const code=host.view.code;console.log('Room created');
    let a=await make(1,owner),b=await make(0,guest);const sa=await a.send({type:'join',code,name:'Owner'},'session');await a.wait(m=>m.type==='state');await b.send({type:'join',code,name:'Guest'},'session');await b.wait(m=>m.type==='state');
    const display=await make(1);await display.send({type:'watch',code});
    await a.wait(m=>m.type==='state'&&m.view.players.length===2);assert(a.view.players.every((p:any)=>p.connected));console.log('Cross-instance joins ready');
    assert((await a.command({type:'ready',ready:true})).ok);await b.wait(m=>m.type==='state'&&m.view.revision===a.view.revision);
    assert((await b.command({type:'ready',ready:true})).ok);await a.wait(m=>m.type==='state'&&m.view.revision===b.view.revision);
    assert((await a.command({type:'start',startingPlayerId:sa.playerId})).ok);await b.wait(m=>m.type==='state'&&m.view.phase==='playing');
    console.log('Game started');assert.equal((await b.command({type:'draft',source:0,color:'blue',target:0})).ok,false);
    const legal=a.view.me.legal[0],revision=a.view.revision,id=randomUUID();
    assert((await a.command(legal,revision,id)).ok);assert((await a.command(legal,revision,id)).ok);assert.equal((await a.command(legal,revision)).ok,false);
    await b.wait(m=>m.type==='state'&&m.view.revision===revision+1);
    // A new transport on the other instance takes over exactly the same seat.
    console.log('Dedup verified');const replacement=await make(0,owner);await replacement.send({type:'resume',code,token:sa.token});await new Promise<void>(r=>a.ws.readyState===3?r():a.ws.once('close',()=>r()));a=replacement;console.log('Takeover complete');assert.equal(a.view.me.id,sa.playerId);
    let moves=1;
    while(a.view.phase!=='finished'&&moves<200){
      const v=a.view;
      if(v.phase==='results'){assert((await a.command({type:'next-round'})).ok);}
      else {const p=v.turn===sa.playerId?a:b;await p.wait(m=>m.type==='state'&&m.view.revision===v.revision);const legal=p.view.me.legal.filter((x:any)=>x.type==='draft');const act=legal.find((x:any)=>x.target===0)??legal.find((x:any)=>x.target>=0)??legal[0];assert((await p.command(act)).ok);moves++;}
      const rev=Math.max(a.view.revision,b.view.revision);await a.wait(m=>m.type==='state'&&m.view.revision===rev);await b.wait(m=>m.type==='state'&&m.view.revision===rev);await display.wait(m=>m.type==='state'&&m.view.revision===rev);
      const {me,...pa}=a.view,{me:other,...pb}=b.view;assert.deepEqual(pa,pb);assert.deepEqual(pa,display.view);
    }
    assert.equal(a.view.phase,'finished');assert.equal(a.view.bonus.length,2);assert.equal(display.view.me,undefined);
    // An idle backend connection can be closed by a managed database. The next
    // transaction must reconnect without losing the committed room/receipts.
    const backend=apps[0].store.db.prepare('SELECT pg_backend_pid() AS pid').get()!;
    const killer=new Pool({connectionString:database,max:1});
    await killer.query('SELECT pg_terminate_backend($1)',[backend.pid]);await killer.end();
    const result=a.view;const fourth=await startServer(0,'127.0.0.1',true,()=>.2,{storePath:database});apps.push(fourth);assert.equal(fourth.rooms.rooms.get(code)?.azul?.phase,'finished');await fourth.close();apps.pop();
    const profile=await fetch(urls[0]+'/api/profile',{method:'PATCH',headers:{Cookie:owner,Origin:urls[0],'Content-Type':'application/json'},body:JSON.stringify({name:'ชื่อใหม่'})});assert.equal(profile.status,200);await display.wait(m=>m.type==='state'&&m.view.players[0].name==='ชื่อใหม่');
    assert((await host.command({type:'restart'},result.revision)).ok);
    console.log('Postgres distributed Azul complete:',moves,'drafts, round',result.round);
    // Test resources are isolated in the explicitly supplied test database.
    const aged=JSON.parse(String(apps[0].store.db.prepare('SELECT state FROM gv_rooms WHERE code=?').get(code)!.state));
    aged.updated=Date.now()-10*3600000-1000;
    apps[0].store.db.prepare('UPDATE gv_rooms SET updated_at=?,state=? WHERE code=?').run(aged.updated,JSON.stringify(aged),code);
    apps[1].rooms.poll();
    assert.equal(apps[1].rooms.rooms.has(code),false);assert.equal(apps[0].store.db.prepare('SELECT 1 FROM gv_rooms WHERE code=?').get(code),undefined);
    console.log('Postgres idle expiry deletes an active room durably across instances');
  } finally {for(const p of peers)p.ws.terminate();for(const app of apps)await app.close();}
});


test('Postgres worker timeout abandons transaction and recovers the next request without replay', {skip:!database,timeout:30000},async()=>{
  const {PostgresDatabase}=await import('../src/server/postgres.js');
  const db=new PostgresDatabase(database!);
  try {
    db.exec('CREATE TABLE IF NOT EXISTS gv_timeout_probe (id text PRIMARY KEY)');
    db.exec('BEGIN');
    const id=randomUUID();db.prepare('INSERT INTO gv_timeout_probe VALUES(?)').run(id);
    // Exercise the actual Atomics timeout / worker termination with a shorter
    // wait budget after connecting; pg_sleep is only used in this isolated DB.
    (db as any).waitTimeoutMs=50;
    assert.throws(()=>db.exec('SELECT pg_sleep(0.25)'),/timed out/);
    (db as any).waitTimeoutMs=15000;
    assert.throws(()=>db.exec('SELECT 1'),/rollback required/);
    db.exec('ROLLBACK');
    assert.equal(db.prepare('SELECT id FROM gv_timeout_probe WHERE id=?').get(id),undefined);
    db.exec('BEGIN');db.prepare('INSERT INTO gv_timeout_probe VALUES(?)').run(id);db.exec('COMMIT');
    assert.equal(db.prepare('SELECT id FROM gv_timeout_probe WHERE id=?').get(id)?.id,id);
    db.prepare('DELETE FROM gv_timeout_probe WHERE id=?').run(id);
    // A read outside a transaction can also time out without poisoning the process.
    (db as any).waitTimeoutMs=50;
    assert.throws(()=>db.exec('SELECT pg_sleep(0.25)'),/timed out/);
    (db as any).waitTimeoutMs=15000;
    assert.equal(db.prepare('SELECT 1 AS n').get()?.n,1);
  } finally {db.close();}
});
