import {card,CARDS,RESOURCES,TYPES} from './data.js';
import {validOptions} from './engine.js';
import {building,has} from './geometry.js';
import type {TinyState} from './types.js';
export function validateTinyState(raw:unknown):raw is TinyState{
 try{
  const s=raw as TinyState,int=(n:unknown,min=0,max=100000)=>Number.isSafeInteger(n)&&Number(n)>=min&&Number(n)<=max;
  if(!s||s.schema!==1||!validOptions(s.options)||!Array.isArray(s.players)||s.players.length<1||s.players.length>6||!int(s.round,1)||!['monuments','call','place','finished'].includes(s.phase)||typeof s.last!=='string'||s.matchId!==undefined&&typeof s.matchId!=='string')return false;
  if(new Set(s.players.map(p=>p.id)).size!==s.players.length||!s.players.some(p=>p.id===s.master)||!Array.isArray(s.cards)||s.cards.length!==7||new Set(s.cards.map(id=>card(id).type)).size!==7||s.cards.some(id=>card(id).type==='monument')||!s.cards.includes('cottage'))return false;
  if(!s.options.randomBuildings&&s.cards.join(',')!=='cottage,farm,well,chapel,tavern,theater,factory')return false;
  if(s.resource!==undefined&&!RESOURCES.includes(s.resource)||!Array.isArray(s.winners)||s.winners.some(id=>!s.players.some(p=>p.id===id)))return false;
  const resources=[...s.deck,...s.discard,...s.offer];if(resources.length!==15||RESOURCES.some(r=>resources.filter(q=>q===r).length!==3)||resources.some(r=>!RESOURCES.includes(r))||s.offer.length!==(s.players.length===1?3:0))return false;
  const secrets:string[]=[];
  for(const p of s.players){
   if(typeof p.id!=='string'||!p.id||typeof p.name!=='string'||!Array.isArray(p.board)||p.board.length!==16||typeof p.placed!=='boolean'||typeof p.ready!=='boolean'||!int(p.masterTurns)||!int(p.cavern,0,2)||!s.options.cavern&&p.cavern||p.doneRound!==undefined&&!int(p.doneRound,1,s.round)||p.shrine!==undefined&&![1,2,3,4,5,8].includes(p.shrine))return false;
   if(!Array.isArray(p.offer)||p.offer.length!==0&&p.offer.length!==2||p.offer.some(id=>card(id).type!=='monument')||p.monument&&card(p.monument).type!=='monument'||p.monument&&p.offer.length||!s.options.monuments&&(p.offer.length||p.monument))return false;
   secrets.push(...p.offer,...(p.monument?[p.monument]:[]));
   if(!Array.isArray(p.effects)||p.effects.length>20||!Array.isArray(p.watch)||p.watch.length>3||new Set(p.watch).size!==p.watch.length||p.watch.some(id=>!s.cards.includes(id))||p.watch.length&&!has(p,'watch'))return false;
   const markers:string[]=[];let monuments=0;
   for(const c of p.board){if(c===null)continue;if(!c||typeof c!=='object')return false;
    if('resource'in c){if(Object.keys(c).join(',')!=='resource'||!RESOURCES.includes(c.resource))return false;continue;}
    if(!('building'in c)||!CARDS.some(q=>q.id===c.building)||!s.cards.includes(c.building)&&c.building!==p.monument)return false;
    const b=building(c)!;if(card(b.building).type==='monument')monuments++;
    if(b.marker!==undefined&&(!['factory','bank'].includes(b.building)||!RESOURCES.includes(b.marker)))return false;
    if(b.building==='bank'&&b.marker)markers.push(b.marker);
    if(b.stored!==undefined&&(b.building!=='warehouse'||!Array.isArray(b.stored)||b.stored.length>3||b.stored.some(r=>!RESOURCES.includes(r))))return false;
    if(b.overlay!==undefined&&(b.building!=='cottage'||!has(p,'bondmaker')||!RESOURCES.includes(b.overlay)))return false;
   }
   if(monuments>1||new Set(markers).size!==markers.length)return false;
   for(const e of p.effects){
    if(e.kind==='marker'){if(!int(e.at,0,15)||!['bank','factory'].includes(building(p.board[e.at])?.building??'')||building(p.board[e.at])?.marker)return false;}
    else if(e.kind==='free'){if(e.building!==undefined&&!s.cards.includes(e.building))return false;}
    else if(e.kind==='guild'){if(!int(e.remaining,1,2)||!Array.isArray(e.changed)||e.changed.length!==2-e.remaining||e.changed.some(i=>!int(i,0,15)))return false;}
    else if(e.kind==='watch'){if(!has(p,'watch'))return false;}else return false;
   }
   if(p.doneRound!==undefined&&((s.phase!=='finished'&&p.board.some(c=>c===null)&&markers.length!==5)||p.effects.length))return false;
   if(s.phase==='monuments'&&(p.board.some(Boolean)||p.effects.length||p.placed||p.ready))return false;
   if(s.phase!=='monuments'&&s.options.monuments&&!p.monument)return false;
   if(s.players.length===1&&(p.monument&&['fort','watch'].includes(p.monument)||s.cards.some(id=>['inn','bank'].includes(id))))return false;
  }
  if(new Set(secrets).size!==secrets.length||s.phase==='finished'&&(s.players.some(p=>p.doneRound===undefined)||!s.winners.length)||s.phase!=='finished'&&s.winners.length)return false;
  return true;
 }catch{return false;}
}
