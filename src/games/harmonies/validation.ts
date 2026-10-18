import {ANIMAL,ANIMALS,TOKENS,CUBE_COUNT,terrain} from './data.js';
import {placementReason,scorePlayer} from './engine.js';
import type {HarmoniesState} from './types.js';
export function validateHarmoniesState(s:any):s is HarmoniesState{try{
 if(!s||!['playing','finished'].includes(s.phase)||!['A','B'].includes(s.side)||!Array.isArray(s.players)||s.players.length<2||s.players.length>4||new Set(s.players.map((p:any)=>p.id)).size!==s.players.length)return false;
 if(!['turn','starter'].every(k=>Number.isInteger(s[k])&&s[k]>=0&&s[k]<s.players.length)||!Number.isSafeInteger(s.turnCount)||s.turnCount<0||!Number.isSafeInteger(s.sequence)||s.sequence<s.turnCount||typeof s.picked!=='boolean'||typeof s.cardTaken!=='boolean')return false;
 if(s.turn!==(s.starter+s.turnCount-(s.phase==='finished'?1:0))%s.players.length)return false;
 if(!Array.isArray(s.bag)||!Array.isArray(s.hand)||s.hand.length>3||!s.picked&&s.hand.length||!Array.isArray(s.groups)||s.groups.length!==5||s.groups.some((g:any)=>!Array.isArray(g)||![0,3].includes(g.length))||!Array.isArray(s.deck)||!Array.isArray(s.market)||s.market.length>5)return false;
 for(let i=0;i<s.players.length;i++){const relative=(i-s.starter+s.players.length)%s.players.length,completed=Math.floor(s.turnCount/s.players.length)+(relative<s.turnCount%s.players.length?1:0),pending=s.phase==='playing'&&i===s.turn&&s.picked?3-s.hand.length:0;if(s.players[i].board?.reduce((n:number,c:any)=>n+(c.stack?.length??0),0)!==completed*3+pending)return false;}
 const tokens=[...s.bag,...s.hand,...s.groups.flat()],cards=[...s.deck,...s.market];let capacity=0;
 for(const p of s.players){if(typeof p.id!=='string'||typeof p.name!=='string'||!Array.isArray(p.board)||p.board.length!==23||!Array.isArray(p.cards)||p.cards.filter((c:any)=>c.placed<ANIMAL[c.card]?.points.length).length>4)return false;
 const cubes:string[]=[];
 for(const cell of p.board){if(!Array.isArray(cell.stack)||cell.stack.length>3)return false;const built={stack:[] as string[]};for(const id of cell.stack){if(!TOKENS.includes(id)||placementReason(built,terrain(id)))return false;built.stack.push(id);tokens.push(id);}if(cell.cube){if(!cell.stack.length||typeof cell.cube.id!=='string'||!ANIMAL[cell.cube.card])return false;cubes.push(cell.cube.id);}}
 for(const c of p.cards){if(!ANIMAL[c.card]||!Number.isInteger(c.placed)||c.placed<0||c.placed>ANIMAL[c.card].points.length)return false;cards.push(c.card);capacity+=ANIMAL[c.card].points.length;for(let i=0;i<c.placed;i++){const id=`cube-${c.card}-${i}`;if(cubes.filter(x=>x===id).length!==1)return false;}}
 if(cubes.length!==p.cards.reduce((n:number,c:any)=>n+c.placed,0)||p.board.some((cell:any)=>cell.cube&&!p.cards.some((c:any)=>c.card===cell.cube.card&&Array.from({length:c.placed},(_,i)=>`cube-${c.card}-${i}`).includes(cell.cube.id))))return false;
 }
 if(tokens.length!==120||new Set(tokens).size!==120||tokens.some(id=>!TOKENS.includes(id))||cards.length!==32||new Set(cards).size!==32||cards.some(id=>!ANIMAL[id])||s.cubeReserve!==CUBE_COUNT-capacity)return false;
 if(s.endAt!==undefined&&(!Number.isInteger(s.endAt)||s.endAt%s.players.length||s.endAt<s.turnCount||s.endAt>s.turnCount+s.players.length))return false;
 if(s.phase==='finished'){
 if(s.endAt!==s.turnCount||s.hand.length||!s.scores)return false;
 for(const p of s.players)if(JSON.stringify(s.scores[p.id])!==JSON.stringify(scorePlayer(p,s.side)))return false;
 const scores=s.players.map((p:any)=>s.scores[p.id]),best=Math.max(...scores.map((x:any)=>x.total)),cubes=Math.max(...scores.filter((x:any)=>x.total===best).map((x:any)=>x.cubes));const winners=s.players.filter((p:any)=>s.scores[p.id].total===best&&s.scores[p.id].cubes===cubes).map((p:any)=>p.id);if(JSON.stringify(winners)!==JSON.stringify(s.winners))return false;
 }else if(!Array.isArray(s.winners)||s.winners.length||s.scores!==undefined)return false;
 if(!s.event||!['setup','group','place','card','cube','turn','finish'].includes(s.event.kind))return false;
 return true;
}catch{return false;}}
