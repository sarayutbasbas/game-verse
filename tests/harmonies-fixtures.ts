// Internal test fixture only; never exposed through a runtime endpoint.
import {TOKENS,terrain,ANIMAL,CUBE_COUNT} from '../src/games/harmonies/data.js';
import {createInitialState,patternCells} from '../src/games/harmonies/engine.js';
import type {HarmoniesState,Side,Terrain} from '../src/games/harmonies/types.js';
export function denseLandscape(seats:{id:string;name:string}[],side:Side='A'):HarmoniesState{
 const s=createInitialState(seats,()=>.42,seats[0].id,side),pool=[...TOKENS];
 const take=(t:Terrain)=>{const i=pool.findIndex(id=>terrain(id)===t);if(i<0)throw Error('Fixture supply exhausted '+t);return pool.splice(i,1)[0];};
 const set=(cell:number,types:Terrain[])=>{s.players[0].board[cell].stack=types.map(take);};
 const card=ANIMAL['animal-01'],a=patternCells(card.id,11,0),b=patternCells(card.id,11,3);
 card.pattern.forEach((p,i)=>set(a[i],p.stack));card.pattern.forEach((p,i)=>{if(!s.players[0].board[b[i]].stack.length)set(b[i],p.stack);});
 s.players[0].cards=[{card:card.id,placed:1}];s.players[0].board[a[2]].cube={id:'cube-animal-01-0',card:card.id};
 let used=s.players[0].board.reduce((n,c)=>n+c.stack.length,0),index=0;
 const choices:Terrain[][]=[['rock','rock','rock'],['wood','wood','leaf'],['wood','building'],['field']];
 for(let i=0;i<23&&used<30;i++)if(!s.players[0].board[i].stack.length){let types=choices[index++%choices.length];if(used+types.length>30)types=choices.find(c=>used+c.length<=30)!;set(i,types);used+=types.length;}
 for(let i=0;i<20;i++)s.players[1].board[i].stack=(i<5?['wood','wood','leaf'] as Terrain[]:['field'] as Terrain[]).map(take);
 s.hand=(['rock','leaf','building'] as Terrain[]).map(take);s.groups=[[],...Array.from({length:4},()=>pool.splice(0,3))];s.bag=pool;s.picked=true;s.turnCount=20;s.turn=0;s.sequence=100;s.event={kind:'group',actor:seats[0].id};s.market=s.market.filter(id=>id!==card.id);s.deck=s.deck.filter(id=>id!==card.id);while(s.market.length<5)s.market.push(s.deck.shift()!);s.cubeReserve=CUBE_COUNT-card.points.length;return s;
}
