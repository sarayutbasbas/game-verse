import assert from 'node:assert/strict';
import * as e from '../src/games/sky-team/engine.js';
import {validateSkyState} from '../src/games/sky-team/validation.js';
import type {SkyState,Role} from '../src/games/sky-team/types.js';
const seats=[{id:'a',name:'นก'},{id:'b',name:'ฟ้า'}];
export const initial=()=>e.createInitialState(seats);
export function rollRound(s:SkyState,p:number[],c:number[]){const rolls=[...p,...c];s=e.applyAction(s,'a',{type:'sky-ready',epoch:e.decisionKey(s),ready:true});return e.applyAction(s,'b',{type:'sky-ready',epoch:e.decisionKey(s),ready:true},()=>((rolls.shift()??1)-.5)/6);}
export function place(s:SkyState,role:Role,slot:string,value:number,adjust=0){const d=s.dice[role].find(d=>d.value===value)!;assert.ok(d,`${role} needs ${value} for ${slot}`);return e.applyAction(s,role==='pilot'?'a':'b',{type:'sky-place',die:d.id,slot,adjust});}
// A reproducible cooperative flight, not a strategy supplied to human clients.
export const SCRIPT:[number[],number[],[string,number][]][]=[
 [[2,3,1,2],[2,4,1,3],[['axis-pilot',2],['axis-copilot',2],['gear-0',1],['radio-1',3],['brakes-0',2],['flaps-0',1],['engine-pilot',3],['engine-copilot',4]]],
 [[2,3,3,3],[2,4,2,3],[['axis-copilot',2],['axis-pilot',2],['radio-1',3],['radio-0',3],['flaps-1',2],['gear-1',3],['engine-copilot',4],['engine-pilot',3]]],
 [[2,4,5,3],[2,4,4,4],[['axis-pilot',2],['axis-copilot',2],['gear-2',5],['flaps-2',4],['radio-0',3],['radio-1',4],['engine-pilot',4],['engine-copilot',4]]],
 [[2,4,4,3],[2,4,5,3],[['axis-copilot',2],['axis-pilot',2],['radio-1',3],['radio-0',3],['flaps-3',5],['brakes-1',4],['engine-copilot',4],['engine-pilot',4]]],
 [[2,4,6,3],[2,4,3,3],[['axis-pilot',2],['axis-copilot',2],['brakes-2',6],['radio-1',3],['radio-0',3],['radio-2',3],['engine-pilot',4],['engine-copilot',4]]],
 [[2,4,1,1],[2,4,1,1],[['axis-copilot',2],['axis-pilot',2],['coffee-0',1],['coffee-1',1],['radio-1',1],['radio-0',1],['engine-copilot',4],['engine-pilot',4]]],
 [[2,1,1,1],[2,1,1,1],[['axis-pilot',2],['axis-copilot',2],['coffee-0',1],['coffee-1',1],['radio-0',1],['radio-1',1],['engine-pilot',1],['engine-copilot',1]]],
];
export function completeFlight(){let s=initial();for(const [p,c,actions] of SCRIPT){s=rollRound(s,p,c);for(const [slot,n] of actions){s=place(s,s.players[s.turn].role,slot,n);assert.ok(validateSkyState(s),JSON.stringify({round:s.round,slot}));}if(s.phase==='resolution')s=e.applyAction(s,'a',{type:'sky-next'});}return s;}
