import * as E from '../src/games/mansions-of-madness/engine.js';
import {PROFILE,PROFILES,ITEMS} from '../src/games/mansions-of-madness/catalog.js';
import type {MadnessState as S,MadnessAction as A,ScenarioId} from '../src/games/mansions-of-madness/types.js';
export const seeded=(seed=1)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
export function init(n=2,scenario:ScenarioId='rain-house'){return E.createInitialState(Array.from({length:n},(_,i)=>({id:'p'+i,name:'ผู้เล่น '+i})),()=>0,undefined,scenario,scenario==='wandering-doors');}
export function setup(s:S){const available=PROFILES.filter(p=>!p.expansion||s.expansion);for(const [i,h]of s.heroes.entries())s=E.applyAction(s,h.owner,{type:'mm-profile',hero:h.id,profile:available[i].id},()=>0);for(const h of s.heroes)s=E.applyAction(s,h.owner,{type:'mm-ready',hero:h.id,ready:true},()=>0);return s;}
/** Test-only bot reads server state to take a valid full route; real clients never receive this state. */
export function choose(s:S):{id:string;a:A}{
 if(s.phase==='test'){const h=E.hero(s,s.pending!.hero);return{id:h.owner,a:{type:'mm-resolve',hero:h.id,spend:E.canSpend(s,h)?Math.min(h.clues,s.pending!.dice.filter(d=>d==='clue').length):0}};}
 if(s.phase==='puzzle'){const h=E.hero(s,s.puzzle!.hero),n=E.room(s,h.space).nodes.find(n=>n.id===s.puzzle!.node)!;return{id:h.owner,a:s.puzzle!.steps>0?{type:'mm-code',hero:h.id,guess:[...n.solution!],spend:false}:{type:'mm-close',hero:h.id}};}
 if(s.phase==='mythos')return{id:s.players[0].id,a:{type:'mm-mythos'}};
 const h=s.active?E.hero(s,s.active):s.heroes.find(h=>!h.done&&!h.eliminated)!;if(!s.active)return{id:h.owner,a:{type:'mm-begin',hero:h.id}};
 const legal=E.getLegalActions(s,h.owner,h.id),mons=s.monsters.filter(m=>m.space===h.space);if(legal.includes('mm-attack')&&mons.length){const item=h.items.find(i=>ITEMS[i.definition].attack);return{id:h.owner,a:{type:'mm-attack',hero:h.id,monster:mons[0].id,weapon:item?.id??null}};}
 const evidence=s.rooms.find(r=>r.nodes.some(n=>n.reward==='evidence'&&!n.done)),puzzle=s.rooms.find(r=>r.nodes.some(n=>n.kind==='puzzle'&&!n.done)),key=s.rooms.find(r=>r.nodes.some(n=>n.reward==='key'&&!n.done));
 let target=evidence??puzzle??(key&&!s.heroes.some(h=>h.items.some(i=>i.key))?key:undefined)??(!s.evidence.includes('ritual')&&(!s.expansion||h.items.some(i=>i.key))?s.rooms.find(r=>r.art===5):undefined)??E.room(s,'r0');
 if(h.space===target.id){const node=target.nodes.find(n=>!n.done);if(legal.includes('mm-node')&&node){try{E.applyAction(s,h.owner,{type:'mm-node',hero:h.id,node:node.id},()=>0);return{id:h.owner,a:{type:'mm-node',hero:h.id,node:node.id}};}catch{}}
 return{id:h.owner,a:{type:'mm-end',hero:h.id}};}
 const here=E.room(s,h.space),next=E.adjacent(s,h.space).sort((a,b)=>(Math.abs(a.x-target.x)+Math.abs(a.y-target.y))-(Math.abs(b.x-target.x)+Math.abs(b.y-target.y)))[0];
 if(next.revealed&&h.moves>0)return{id:h.owner,a:{type:'mm-step',hero:h.id,to:next.id}};
 if(!next.revealed&&legal.includes('mm-explore')){const direction=next.x>here.x?'east':next.x<here.x?'west':next.y>here.y?'south':'north';return{id:h.owner,a:{type:'mm-explore',hero:h.id,direction}};}
 if(next.revealed&&legal.includes('mm-move'))return{id:h.owner,a:{type:'mm-move',hero:h.id}};
 return{id:h.owner,a:{type:'mm-end',hero:h.id}};
}
