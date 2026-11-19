import {card,CARDS,DEFAULT_OPTIONS,FIRST,MONUMENTS,RESOURCES,TYPES} from './data.js';
import {building,getBuilds,has} from './geometry.js';
import {scorePlayer,winners} from './scoring.js';
import type {Resource,TinyAction,TinyOptions,TinyPlayer,TinyState,TinyView} from './types.js';
export {getBuilds} from './geometry.js';
export {scorePlayer} from './scoring.js';
const shuffle=<T>(array:T[],random:()=>number)=>{for(let i=array.length-1;i>0;i--){const n=random();if(!Number.isFinite(n)||n<0||n>=1)throw Error('ค่าสุ่มไม่ถูกต้อง');const j=Math.floor(n*(i+1));[array[i],array[j]]=[array[j],array[i]];}return array;};
const alive=(s:TinyState)=>s.players.filter(p=>p.doneRound===undefined);
const isForeign=(s:TinyState,p:TinyPlayer)=>s.players.length===1||s.options.mode==='town-hall'?s.players.length===1||s.round%3!==0:s.master!==p.id;
const banned=(p:TinyPlayer)=>p.board.flatMap(c=>{const b=building(c);return b?.building==='bank'&&b.marker?[b.marker]:[];});
const normalCards=(s:TinyState,p:TinyPlayer)=>s.cards.filter(id=>id!=='bank'||banned(p).length<5);
function resourceChoices(s:TinyState,p:TinyPlayer):Resource[]{
 if(s.options.mode==='town-hall'&&s.players.length>1&&s.round%3===0)return RESOURCES.filter(r=>!banned(p).includes(r));
 if(!s.resource)return [];
 return isForeign(s,p)&&p.board.some(c=>building(c)?.building==='factory'&&building(c)?.marker===s.resource)?[...RESOURCES]:[s.resource];
}
function begin(s:TinyState,random:()=>number){
 const live=alive(s);if(live.length&&live.every(p=>banned(p).length===5)){for(const p of live){p.doneRound=s.round;p.ready=true;}finish(s);return;}
 delete s.resource;for(const p of alive(s)){p.placed=false;p.ready=false;}
 if(s.players.length===1||s.options.mode==='master'){s.phase='call';s.last=s.players.length===1?'เลือกทรัพยากรจากสำรับ 3 ใบ':'รอผู้เรียกเลือกทรัพยากร';return;}
 s.phase='place';if(s.round%3!==0){
  if(!s.deck.length){s.deck=shuffle(s.discard.splice(0),random);s.discard.push(...s.deck.splice(0,5));}
  s.resource=s.deck.shift()!;s.discard.push(s.resource);s.last=`เปิดทรัพยากรจากสำรับ`;
 }else{
  const live=alive(s);for(const p of live)if((has(p,'fort')||banned(p).length===5)&&live.length>1){p.placed=true;p.ready=true;}
  if(live.every(p=>p.ready)){s.round++;begin(s,random);}
 }
}
function finish(s:TinyState){for(const p of s.players)for(let i=0;i<16;i++){const c=p.board[i];if(c&&'resource'in c)p.board[i]=null;else if(c&&'overlay'in c)delete c.overlay;}s.phase='finished';s.winners=winners(s);s.last='เมืองทุกแห่งสร้างเสร็จแล้ว';}
function advance(s:TinyState,random:()=>number){
 if(!alive(s).length){finish(s);return;}
 if(s.phase!=='place'||!alive(s).every(p=>p.ready&&!p.effects.length))return;
 if(s.options.mode==='master'){
  const current=s.players.findIndex(p=>p.id===s.master),live=alive(s);
  for(let k=1;k<=s.players.length;k++){const p=s.players[(current+k)%s.players.length];if(p.doneRound===undefined&&banned(p).length<5&&(!has(p,'fort')||live.length===1)){s.master=p.id;break;}}
 }
 s.round++;begin(s,random);
}
function constructed(s:TinyState,p:TinyPlayer,id:string,at:number){
 p.board[at]={building:id};p.ready=false;
 if(id==='factory'||id==='bank')p.effects.push({kind:'marker',at});
 if(id==='university')p.effects.push({kind:'free'});
 if(id==='guild')p.effects.push({kind:'guild',remaining:2,changed:[]});
 if(id==='watch')p.effects.push({kind:'watch'});
 if(id==='shrine'){const count=p.board.filter(building).length;p.shrine=count>=6?8:count;}
 // Consume a Watch token immediately, then let its owner choose a destination privately.
 const index=s.players.indexOf(p);for(const ni of new Set([(index+1)%s.players.length,(index+s.players.length-1)%s.players.length])){
  const neighbor=s.players[ni];if(neighbor===p||neighbor.doneRound!==undefined||!neighbor.watch.includes(id))continue;
  neighbor.watch.splice(neighbor.watch.indexOf(id),1);
  if(neighbor.board.some(c=>c===null)){neighbor.effects.push({kind:'free',building:id});neighbor.ready=false;}
 }
 s.last=`${p.name} สร้าง${card(id).name}`;
}
export function createInitialState(seats:{id:string;name:string}[],random:()=>number=Math.random,starter?:string,options:TinyOptions=DEFAULT_OPTIONS):TinyState{
 if(seats.length<1||seats.length>6||new Set(seats.map(p=>p.id)).size!==seats.length||seats.some(p=>!p.id)||starter&&!seats.some(p=>p.id===starter))throw Error('Tiny Towns เล่นได้ 1–6 คน');
 if(!validOptions(options))throw Error('ตัวเลือกไม่ถูกต้อง');
 const solo=seats.length===1,cards=options.randomBuildings?TYPES.filter(t=>t!=='monument').map(type=>shuffle(CARDS.filter(c=>c.type===type&&(!solo||!['inn','bank'].includes(c.id))).map(c=>c.id),random)[0]):[...FIRST];
 const monuments=options.monuments?shuffle(MONUMENTS.filter(c=>!solo||!['fort','watch'].includes(c.id)).map(c=>c.id),random):[];
 const deck=shuffle(RESOURCES.flatMap(r=>[r,r,r]),random),players:TinyPlayer[]=seats.map(p=>({...p,board:Array.from({length:16},()=>null),offer:options.monuments?monuments.splice(0,2):[],placed:false,ready:false,masterTurns:0,cavern:0,effects:[],watch:[]}));
 const s:TinyState={schema:1,players,options:{...options},cards,phase:options.monuments?'monuments':'call',round:1,master:starter??players[0].id,deck,discard:[],offer:solo?deck.splice(0,3):[],last:'เลือกอนุสาวรีย์ลับ 1 จาก 2 ใบ',winners:[]};
 if(!solo&&options.mode==='town-hall')s.discard=deck.splice(0,5);
 if(!options.monuments)begin(s,random);return s;
}
export function validOptions(raw:unknown):raw is TinyOptions{const o=raw as TinyOptions;return !!o&&typeof o==='object'&&Object.keys(o).sort().join(',')==='cavern,mode,monuments,randomBuildings'&&typeof o.monuments==='boolean'&&typeof o.randomBuildings==='boolean'&&typeof o.cavern==='boolean'&&['master','town-hall'].includes(o.mode);}
export function getLegalActions(s:TinyState,id:string):TinyAction[]{
 const p=s.players.find(p=>p.id===id);if(!p||p.doneRound!==undefined||s.phase==='finished')return [];
 if(s.phase==='monuments')return p.monument?[]:p.offer.map(card=>({type:'tiny-monument',card}));
 if(s.phase==='call'){
  if(s.players.length===1)return s.offer.map((resource,slot)=>({type:'tiny-call',resource,slot}));
  return s.master===id?RESOURCES.filter(r=>!banned(p).includes(r)).map(resource=>({type:'tiny-call',resource})):[];
 }
 const effect=p.effects[0],actions:TinyAction[]=[];
 if(effect){
  if(effect.kind==='marker'){const b=building(p.board[effect.at]);return RESOURCES.filter(r=>b?.building!=='bank'||!banned(p).includes(r)).map(resource=>({type:'tiny-marker',resource}));}
  if(effect.kind==='watch')return []; // Three distinct selected types are validated directly by applyAction.
  if(effect.kind==='free'){
   for(const card of effect.building?[effect.building]:normalCards(s,p))for(let at=0;at<16;at++)if(!p.board[at])actions.push({type:'tiny-free',card,at});
   if(!actions.length)actions.push({type:'tiny-skip'});return actions;
  }
  for(let at=0;at<16;at++){const old=building(p.board[at]);if(!old||card(old.building).type==='monument'||effect.changed.includes(at))continue;for(const c of normalCards(s,p))if(card(c).type!==card(old.building).type)actions.push({type:'tiny-replace',card:c,at});}
  actions.push({type:'tiny-skip'});return actions;
 }
 if(!p.placed){
  for(const resource of resourceChoices(s,p)){
   for(let at=0;at<16;at++)if(!p.board[at]||isForeign(s,p)&&has(p,'bondmaker')&&building(p.board[at])?.building==='cottage'&&!building(p.board[at])?.overlay)actions.push({type:'tiny-place',at,resource});
   if(isForeign(s,p))for(let warehouse=0;warehouse<16;warehouse++){
    const b=building(p.board[warehouse]);if(b?.building!=='warehouse')continue;const stored=b.stored??[];
    if(stored.length<3)actions.push({type:'tiny-place',at:warehouse,resource,warehouse});
    for(let swap=0;swap<stored.length;swap++)for(let at=0;at<16;at++)if(!p.board[at])actions.push({type:'tiny-place',at,resource,warehouse,swap});
   }
  }
  if(s.players.length>1&&s.options.mode==='master'&&s.options.cavern&&isForeign(s,p)&&p.cavern<2)actions.push({type:'tiny-cavern'});
  return actions;
 }
 for(const option of getBuilds(s,p))for(const at of option.destinations)actions.push({type:'tiny-build',card:option.card,cells:option.cells,at});
 if(!p.board.some(c=>c===null))actions.push({type:'tiny-finish'});else if(!p.ready)actions.push({type:'tiny-ready'});
 return actions;
}
const equal=(a:unknown,b:unknown):boolean=>{if(a===b)return true;if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;const aa=a as Record<string,unknown>,bb=b as Record<string,unknown>;return Object.keys(aa).length===Object.keys(bb).length&&Object.keys(aa).every(k=>Object.hasOwn(bb,k)&&equal(aa[k],bb[k]));};
export function applyAction(state:TinyState,id:string,action:TinyAction,random:()=>number=Math.random):TinyState{
 const original=state.players.find(p=>p.id===id);if(!original)throw Error('ไม่ใช่ผู้เล่นในเกม');
 const watch=action?.type==='tiny-watch'&&state.phase==='place'&&original.effects[0]?.kind==='watch'&&Object.keys(action).sort().join(',')==='cards,type'&&Array.isArray(action.cards)&&action.cards.length===3&&new Set(action.cards).size===3&&action.cards.every(id=>state.cards.includes(id));
 if(!watch&&!getLegalActions(state,id).some(a=>equal(a,action)))throw Error('ทำรายการนี้ไม่ได้ในตอนนี้ กรุณาตรวจทรัพยากรและช่องเมืองอีกครั้ง');
 const s=structuredClone(state),p=s.players.find(p=>p.id===id)!;
 switch(action.type){
  case 'tiny-monument':p.monument=action.card;p.offer=[];if(s.players.every(p=>p.monument))begin(s,random);break;
  case 'tiny-call':{
   s.resource=action.resource;s.phase='place';if(s.players.length===1){s.deck.push(s.offer.splice(action.slot!,1)[0]);s.offer.splice(action.slot!,0,s.deck.shift()!);}else p.masterTurns++;
   s.last=`${p.name} เรียกทรัพยากร`;break;
  }
  case 'tiny-place':{
   if(action.warehouse!==undefined){const b=building(p.board[action.warehouse])!;b.stored??=[];if(action.swap!==undefined){const old=b.stored[action.swap];b.stored[action.swap]=action.resource;p.board[action.at]={resource:old};}else b.stored.push(action.resource);}
   else {const b=building(p.board[action.at]);if(b)b.overlay=action.resource;else p.board[action.at]={resource:action.resource};}p.placed=true;break;
  }
  case 'tiny-cavern':p.cavern++;p.placed=true;break;
  case 'tiny-build':for(const i of action.cells)if(p.board[i]&&'resource'in p.board[i]!)p.board[i]=null;constructed(s,p,action.card,action.at);break;
  case 'tiny-marker':building(p.board[(p.effects.shift()! as {at:number}).at])!.marker=action.resource;break;
  case 'tiny-free':p.effects.shift();constructed(s,p,action.card,action.at);break;
  case 'tiny-replace':{const e=p.effects[0];if(e.kind!=='guild')throw Error('ไม่มีผลเปลี่ยนอาคาร');e.remaining--;e.changed.push(action.at);if(!e.remaining)p.effects.shift();constructed(s,p,action.card,action.at);break;}
  case 'tiny-watch':p.watch=[...action.cards];p.effects.shift();break;
  case 'tiny-skip':p.effects.shift();break;
  case 'tiny-ready':p.ready=true;break;
  case 'tiny-finish':p.doneRound=s.round;p.ready=true;break;
 }
 advance(s,random);return s;
}
export const isFinished=(s:TinyState)=>s.phase==='finished';
export function getDisplayView(s:TinyState,code='',revision=0):TinyView{
 return {gameId:'tiny-towns',code,revision,matchId:s.matchId,phase:s.phase,turn:s.master,round:s.round,options:{...s.options},cards:[...s.cards],resource:s.resource,offer:s.players.length===1?[...s.offer]:[],last:s.last,winners:[...s.winners],players:s.players.map(p=>({id:p.id,name:p.name,board:structuredClone(p.board),placed:p.placed,ready:p.ready,doneRound:p.doneRound,masterTurns:p.masterTurns,cavern:p.cavern,monument:p.monument&&has(p,p.monument)?p.monument:undefined,watch:[...p.watch],pending:p.effects.length,score:scorePlayer(s,p)}))};
}
export function getPlayerView(s:TinyState,id:string,code='',revision=0):TinyView{
 const view=getDisplayView(s,code,revision),p=s.players.find(p=>p.id===id);if(!p)return view;
 view.me={id,offer:[...p.offer],monument:p.monument,effects:structuredClone(p.effects),legal:getLegalActions(s,id).filter(a=>a.type!=='tiny-build'),builds:s.phase==='place'&&p.placed&&!p.effects.length&&p.doneRound===undefined?getBuilds(s,p):[]};return view;
}
