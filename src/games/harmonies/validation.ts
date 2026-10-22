import {SANCTUARIES,SANCTUARY,incompleteSlots} from './sanctuaries.js';
import {boardCoords,BOARD_SIDES} from './boards.js';
import {ANIMAL,ANIMALS,PULSE,WHISPERS,TOKENS,CUBE_COUNT,terrain} from './data.js';
import {optionsFor,spiritPool} from './expansions.js';
import {placementReason,scorePlayer} from './engine.js';
import type {HarmoniesState} from './types.js';
export function validateHarmoniesState(s:any):s is HarmoniesState{try{
 if(!s)return false;const options=optionsFor(s.options);
 if(!['playing','finished'].includes(s.phase)||!BOARD_SIDES.includes(s.side)||!Array.isArray(s.players)||s.players.length<(options.solo?1:2)||s.players.length>(options.solo?1:4)||new Set(s.players.map((p:any)=>p.id)).size!==s.players.length)return false;
 if(!['turn','starter'].every(k=>Number.isInteger(s[k])&&s[k]>=0&&s[k]<s.players.length)||!Number.isSafeInteger(s.turnCount)||s.turnCount<0||!Number.isSafeInteger(s.sequence)||s.sequence<s.turnCount||typeof s.picked!=='boolean'||typeof s.cardTaken!=='boolean')return false;
 if(s.turn!==(s.starter+s.turnCount-(s.phase==='finished'?1:0))%s.players.length)return false;
 if(!Array.isArray(s.bag)||!Array.isArray(s.hand)||s.hand.length>3||!s.picked&&s.hand.length||!Array.isArray(s.groups)||s.groups.length!==(options.solo?3:5)||s.groups.some((g:any)=>!Array.isArray(g)||![0,3].includes(g.length))||!Array.isArray(s.deck)||!Array.isArray(s.market)||s.market.length>(options.solo?3:5))return false;
 for(let i=0;i<s.players.length;i++){const relative=(i-s.starter+s.players.length)%s.players.length,completed=Math.floor(s.turnCount/s.players.length)+(relative<s.turnCount%s.players.length?1:0),pending=s.phase==='playing'&&i===s.turn&&s.picked?3-s.hand.length:0;if(s.players[i].board?.reduce((n:number,c:any)=>n+(c.stack?.length??0),0)!==completed*3+pending)return false;}
 if(s.soloDiscarded!==undefined&&(typeof s.soloDiscarded!=='boolean'||s.soloDiscarded&&(!options.solo||!s.picked||s.hand.length||s.cardTaken)))return false;
 const discardedTokens=s.discardedTokens??[],discardedCards=s.discardedCards??[];if(!Array.isArray(discardedTokens)||!Array.isArray(discardedCards)||!options.solo&&(discardedTokens.length||discardedCards.length))return false;
 const tokens=[...s.bag,...s.hand,...s.groups.flat(),...discardedTokens],cards=[...s.deck,...s.market,...discardedCards],spirits:string[]=[];let capacity=0;
 for(const p of s.players){if(typeof p.id!=='string'||typeof p.name!=='string'||!Array.isArray(p.board)||p.board.length!==boardCoords(s.side).length||!Array.isArray(p.cards)||incompleteSlots(p)>4)return false;
 const cubes:string[]=[];
 for(const [index,cell]of p.board.entries()){
  if(!Array.isArray(cell.stack)||cell.stack.length>(cell.sanctuary?4:3))return false;
  const built={stack:[] as string[]};
  for(const id of cell.stack){if(!TOKENS.includes(id)||!cell.sanctuary&&placementReason(built,terrain(id)))return false;built.stack.push(id);tokens.push(id);}
  if(cell.sanctuary){const tile=SANCTUARY[cell.sanctuary],owned=p.sanctuaries?.find((t:any)=>t.tile===cell.sanctuary&&t.cell===index);if(!options.sanctuaries||!tile||!owned||!cell.stack.length||cell.cube||cell.whisper||!cell.stack.every((id:string,i:number)=>terrain(id)===tile.stack[i])||owned.complete!==(cell.stack.length===4)||!Array.isArray(cell.sanctuaryCubes))return false;
   for(const cube of cell.sanctuaryCubes){const animal=ANIMAL[cube.card];if(!owned.complete||!animal||animal.kind||typeof cube.id!=='string'||!tile.colors.includes(animal.pattern.find(p=>p.cube)!.stack.at(-1)!))return false;cubes.push(cube.id);}
  }else if(cell.sanctuaryCubes!==undefined)return false;
  for(const key of ['cube','whisper']as const){const cube=cell[key];if(cube){if(!cell.stack.length||typeof cube.id!=='string'||!ANIMAL[cube.card]||(key==='whisper')!==(ANIMAL[cube.card].kind==='whisper'))return false;cubes.push(cube.id);}}
 }
 if(p.sanctuaries!==undefined&&(!options.sanctuaries||!Array.isArray(p.sanctuaries)||p.sanctuaries.some((t:any)=>!SANCTUARY[t.tile]||typeof t.complete!=='boolean'||(t.cell===undefined?t.complete:!Number.isInteger(t.cell)||p.board[t.cell]?.sanctuary!==t.tile))))return false;

 for(const c of p.cards){if(!ANIMAL[c.card]||!Number.isInteger(c.placed)||c.placed<0||c.placed>ANIMAL[c.card].points.length)return false;if(ANIMAL[c.card].kind==='spirit')spirits.push(c.card);else cards.push(c.card);if(!ANIMAL[c.card].kind)capacity+=ANIMAL[c.card].points.length;for(let i=0;i<c.placed;i++){const id=`cube-${c.card}-${i}`;if(cubes.filter(x=>x===id).length!==1)return false;}}
 if(cubes.length!==p.cards.reduce((n:number,c:any)=>n+c.placed,0)||p.board.some((cell:any)=>[cell.cube,cell.whisper,...cell.sanctuaryCubes??[]].some(cube=>cube&&!p.cards.some((c:any)=>c.card===cube.card&&Array.from({length:c.placed},(_,i)=>`cube-${c.card}-${i}`).includes(cube.id)))))return false;
 }
 if(options.natureSpirits){
 const pool=spiritPool(options);
 if(!s.spiritDrafts||Object.keys(s.spiritDrafts).sort().join()!==s.players.map((p:any)=>p.id).sort().join()||!Array.isArray(s.spiritUnused)||s.spiritUnused.length!==pool.length-2*s.players.length||!Array.isArray(s.spiritDiscard))return false;
 for(const p of s.players){const draft=s.spiritDrafts[p.id],owned=p.cards.filter((c:any)=>ANIMAL[c.card]?.kind==='spirit');if(!Array.isArray(draft)||![0,2].includes(draft.length)||owned.length!==(draft.length?0:1))return false;spirits.push(...draft);}
 spirits.push(...s.spiritUnused,...s.spiritDiscard);if(spirits.length!==pool.length||new Set(spirits).size!==pool.length||spirits.some(c=>!pool.some(v=>v.id===c)))return false;
 }else if(spirits.length||s.spiritDrafts!==undefined||s.spiritUnused!==undefined||s.spiritDiscard!==undefined)return false;
 if(options.sanctuaries){if(s.sanctuaryCatalogVersion!==undefined&&![2,3,4].includes(s.sanctuaryCatalogVersion))return false;const legacy=['sanctuary-01','sanctuary-02','sanctuary-04','sanctuary-05'];const expected=s.sanctuaryCatalogVersion===4?SANCTUARIES.map(t=>t.id):s.sanctuaryCatalogVersion===3?SANCTUARIES.filter(t=>t.id!=='sanctuary-10').map(t=>t.id):s.sanctuaryCatalogVersion===2?[...legacy,'sanctuary-06']:legacy;if(!Array.isArray(s.sanctuaryDeck)||!Array.isArray(s.sanctuaryMarket)||s.sanctuaryMarket.length!==2||typeof s.sanctuaryTaken!=='boolean')return false;const tiles=[...s.sanctuaryDeck,...s.sanctuaryMarket.filter(Boolean),...s.players.flatMap((p:any)=>(p.sanctuaries??[]).map((t:any)=>t.tile))];if(tiles.length!==expected.length||new Set(tiles).size!==tiles.length||tiles.some(id=>!expected.includes(id)))return false;}else if(s.sanctuaryCatalogVersion!==undefined||s.sanctuaryDeck!==undefined||s.sanctuaryMarket!==undefined||s.sanctuaryTaken)return false;
 if(options.pulse?s.pulseCatalogVersion!==undefined&&![2,3].includes(s.pulseCatalogVersion):s.pulseCatalogVersion!==undefined)return false;
 const pulse=options.pulse?PULSE.filter(c=>s.pulseCatalogVersion===3||(s.pulseCatalogVersion===2?['pulse-03','pulse-04','pulse-06','pulse-10'].includes(c.id):c.id==='pulse-10')):[];
 const expected=[...ANIMALS,...pulse,...(options.whispers?WHISPERS:[])].map(c=>c.id);
 if(tokens.length!==120||new Set(tokens).size!==120||tokens.some(id=>!TOKENS.includes(id))||cards.length!==expected.length||new Set(cards).size!==expected.length||cards.some(id=>!expected.includes(id))||s.cubeReserve!==CUBE_COUNT+pulse.reduce((n,c)=>n+c.points.length,0)-capacity)return false;
 if(s.endAt!==undefined&&(!Number.isInteger(s.endAt)||s.endAt%s.players.length||s.endAt<s.turnCount||s.endAt>s.turnCount+s.players.length))return false;
 if(s.phase==='finished'){
 if(s.endAt!==s.turnCount||s.hand.length||!s.scores)return false;
 for(const p of s.players)if(JSON.stringify(s.scores[p.id])!==JSON.stringify(scorePlayer(p,s.side)))return false;
 const scores=s.players.map((p:any)=>s.scores[p.id]),best=Math.max(...scores.map((x:any)=>x.total)),cubes=Math.max(...scores.filter((x:any)=>x.total===best).map((x:any)=>x.cubes));const winners=s.players.filter((p:any)=>s.scores[p.id].total===best&&s.scores[p.id].cubes===cubes).map((p:any)=>p.id);if(JSON.stringify(winners)!==JSON.stringify(s.winners))return false;
 }else if(!Array.isArray(s.winners)||s.winners.length||s.scores!==undefined)return false;
 if(!s.event||!['setup','group','place','card','cube','turn','finish','spirit','discard','sanctuary'].includes(s.event.kind))return false;
 return true;
}catch{return false;}}
