import {createInitialState} from '../src/games/take-time/engine.js';
import type {TakeTimeState,Suit} from '../src/games/take-time/types.js';
export const sequence:[Suit,number,number][]=[['solar',3,0],['lunar',8,1],['solar',1,2],['lunar',10,2],['solar',2,3],['lunar',9,3],['solar',4,4],['solar',5,4],['lunar',11,4],['solar',6,5],['lunar',6,5],['solar',12,5]];
export function successFixture(n=2):TakeTimeState {
 const s=createInitialState(Array.from({length:n},(_,i)=>({id:'p'+i,name:'ผู้เล่น '+i})),()=>.42);
 const used=new Set(sequence.map(([s,v])=>s+v));
 s.players.forEach((p,i)=>{
  const own=sequence.filter((_,k)=>k%n===i).map(([suit,value],k)=>({id:`a1c${i*(12/n)+k}`,suit,value}));
  p.hand=n===2?own.slice(0,4):own;p.reserve=n===2?own.slice(4):[];
 });
 s.unused=(['solar','lunar'] as const).flatMap(suit=>Array.from({length:12},(_,i)=>({suit,value:i+1}))).filter(c=>!used.has(c.suit+c.value)).map((c,i)=>({...c,id:`a1c${i+12}`}));
 return s;
}
