export type Ability='none'|'life1'|'life2'|'draw1'|'draw2'|'destroy'|'double'|'copy'|'lower'|'sort'|'exchange1'|'exchange2'|'bottom'|'lose1'|'lose2'|'highest'|'stop';
export interface Card {id:string;name:string;value:number;ability:Ability;kind:'starting'|'aging'|'knowledge';art:number;hazard?:{name:string;free:number;values:[number,number,number];art:number};difficult?:boolean}
export interface Pirate {id:string;name:string;value:number;free:number;ability:'none'|'cost2'|'half'|'bonus'|'hazards'|'aging';text:string}
export interface Played {uid:number;card:string;free:boolean;used:boolean;destroyed:boolean;doubleBy?:number}
export type Pending={kind:'draw'|'exchange'|'destroy'|'double'|'bottom'|'sort';source:number;remaining:number;cards:string[]};
export type FridayAction={type:'fr-choose';card:string}|{type:'fr-skip-hazard'}|{type:'fr-pirate';card:string}|{type:'fr-draw';paid?:boolean}|{type:'fr-use';source:number;copy?:number[]}|{type:'fr-target';target:number;draw?:boolean}|{type:'fr-effect-draw'}|{type:'fr-sort-draw'}|{type:'fr-sort-finish';order:string[];discard?:string}|{type:'fr-skip-effect'}|{type:'fr-finish'}|{type:'fr-trash';target:number}|{type:'fr-continue'};
export interface FridayState {
 schema:1;matchId?:string;players:{id:string;name:string}[];level:1|2|3|4;phase:'choose'|'fight'|'cleanup'|'pirates'|'finished';step:0|1|2|3;life:number;maxLife:number;sequence:number;round:number;
 deck:string[];discard:string[];aging:string[];hazards:string[];hazardDiscard:string[];offer:string[];destroyed:string[];
 pirates:string[];defeated:string[];current?:{kind:'hazard'|'pirate';id:string;target:number;free:number};played:Played[];pending?:Pending;
 modifiers:{source:number;ability:Ability}[];freeClosed:boolean;budget:number;agingAdded:number;outcome?:'won'|'lost';reason?:string;last:string;
}
export interface Evaluation {power:number;target:number;free:number;cost:number;tax:number;zeroed:number[];counted:number[];doubled:number[]}
export interface FridayView {
 gameId:'friday';code:string;revision:number;turn:string;matchId?:string;phase:FridayState['phase']|'lobby';level:1|2|3|4;step:number;life:number;maxLife:number;round:number;
 players:{id:string;name:string;ready?:boolean;connected?:boolean;avatar?:string|null}[];
 deckCount:number;agingCount:number;hazardCount:number;discard:string[];hazardDiscard:string[];destroyed:string[];offer:string[];pirates:string[];defeated:string[];current?:FridayState['current'];played:Played[];evaluation:Evaluation;budget:number;
 pending?:{kind:Pending['kind'];remaining:number;count:number};last:string;outcome?:'won'|'lost';reason?:string;score?:{cards:number;pirates:number;life:number;hazards:number;total:number};canControl?:boolean;
 me?:{id:string;legal:FridayAction[];peek:string[];canManage?:boolean};
}
