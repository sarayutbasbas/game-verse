// One-time, local memory-room checkpoint. Never writes state or credentials to stdout.
// Freeze mutations, export private backup, import and validate before stopping old server.
// Run only against the known local game-server PID; SIGUSR1 inspector binds loopback.
import {mkdirSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {WebSocket} from 'ws';
import {PlatformStore} from '../build/server/store.js';
import {metadata} from '../build/shared/catalog.js';
const pid=Number(process.argv[2]);if(!Number.isSafeInteger(pid)||pid<2)throw Error('Supply local game-server PID');
const dir=resolve('data/checkpoints');mkdirSync(dir,{recursive:true,mode:0o700});
const backup=resolve(dir,`legacy-${Date.now()}.json`);
process.kill(pid,'SIGUSR1');
let info;
for(let n=0;n<40;n++){try{info=(await (await fetch('http://127.0.0.1:9229/json/list')).json())[0];break;}catch{await new Promise(r=>setTimeout(r,50));}}
if(!info)throw Error('Local inspector unavailable');
const ws=new WebSocket(info.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});
let nextId=0;const pending=new Map();ws.on('message',raw=>{const m=JSON.parse(String(raw));const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error('Inspector operation failed')):p.resolve(m.result);}});
const call=(method,params)=>new Promise((resolve,reject)=>{const id=++nextId;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
let objects;
try{
 const proto=await call('Runtime.evaluate',{expression:'Object.prototype',objectGroup:'gv-checkpoint'});
 objects=await call('Runtime.queryObjects',{prototypeObjectId:proto.result.objectId,objectGroup:'gv-checkpoint'});
 const frozen=await call('Runtime.callFunctionOn',{objectId:objects.objects.objectId,functionDeclaration:`function(file){
  const services=this.filter(o=>{try{const d=Object.getOwnPropertyDescriptors(o);return d.rooms?.value instanceof Map&&d.attached?.value instanceof Map&&typeof Object.getPrototypeOf(o)?.handle==='function';}catch{return false;}});
  if(services.length!==1)return {ok:false};const service=services[0];
  if(service.__checkpointHandle)return {ok:false};
  const fs=process.getBuiltinModule('fs');
  const records=[...service.rooms.values()].map(r=>({...r,legacy:true,sockets:undefined,sessions:r.sessions.map(s=>({...s,receipts:[...s.receipts]}))}));
  fs.writeFileSync(file,JSON.stringify(records),{mode:0o600,flag:'wx'});
  service.__checkpointHandle=service.handle;
  service.handle=function(ws){if(ws.readyState===1)ws.send(JSON.stringify({type:'error',error:'กำลังอัปเดตระบบ กรุณารอเชื่อมต่อใหม่'}));};
  return {ok:true,rooms:records.length};
 }`,arguments:[{value:backup}],returnByValue:true});
 if(!frozen.result.value?.ok)throw Error('Expected exactly one unfrozen RoomService');
 const records=JSON.parse(readFileSync(backup,'utf8')).map(r=>{const g=metadata(r.gameId??'camel-up');if(!g)throw Error('Unsupported live game');return {...r,gameId:g.id,rulesVersion:g.rulesVersion,schemaVersion:g.stateSchemaVersion,legacy:true};});
 const store=new PlatformStore();store.transaction(()=>store.saveRooms(records));
 const restored=store.loadRooms();if(store.quarantined.length||restored.length!==records.length)throw Error('Recovery validation failed; old process retained');
 store.close();
 console.log(JSON.stringify({checkpointed:true,rooms:records.length,validated:true,backup:'data/checkpoints/'+backup.split('/').pop(),frozen:true}));
}catch(e){
 if(objects)await call('Runtime.callFunctionOn',{objectId:objects.objects.objectId,functionDeclaration:`function(){for(const o of this){try{if(o.__checkpointHandle){o.handle=o.__checkpointHandle;delete o.__checkpointHandle;}}catch{}}}`,returnByValue:true}).catch(()=>{});
 throw e;
}finally{
 await call('Runtime.releaseObjectGroup',{objectGroup:'gv-checkpoint'}).catch(()=>{});
 await call('Runtime.evaluate',{expression:"setTimeout(()=>process.getBuiltinModule('inspector').close(),100)",returnByValue:true}).catch(()=>{});ws.close();
}
