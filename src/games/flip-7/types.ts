export type Status='active'|'stayed'|'frozen'|'bust'|'flip7';
export interface Player {id:string;name:string;score:number;cards:string[];status:Status}
export interface Choice {card:string;actor:string}
export type Task={kind:'draw';player:string;block?:number}|{kind:'end-three';block:number}|{kind:'choose';card:string;actor:string}|{kind:'next';after:number};
export interface Block {id:number;player:string;failed:boolean;deferred:Choice[]}
export interface Score {id:string;cards:string[];status:Status;base:number;multiplier:number;bonus:number;flip7:number;points:number;total:number}
export interface Round {round:number;dealer:string;reason:'all-out'|'flip7';scores:Score[]}
export interface FlipState {schema:1;matchId?:string;phase:'play'|'target'|'round-end'|'finished';players:Player[];deck:string[];discard:string[];dealer:number;firstDealer:number;turn:number;round:number;sequence:number;serial:number;tasks:Task[];blocks:Block[];pending?:Choice;history:Round[];winners:string[];events:{id:number;text:string}[]}
export type FlipAction={type:'f7-hit'|'f7-stay'|'f7-next';epoch:string}|{type:'f7-target';epoch:string;target:string};
export interface FlipView {gameId:'flip-7';code:string;revision:number;phase:FlipState['phase']|'lobby';epoch:string;round:number;dealer:string;turn:string;sequence:number;deckCount:number;discardCount:number;players:{id:string;name:string;score:number;cards:{key:string;face:string}[];status:Status;roundScore:number;numbers:number;ready?:boolean;connected?:boolean;avatar?:string|null}[];pending?:{actor:string;face:string;targets:string[]};forced?:{player:string;remaining:number};history:Round[];winners:string[];events:{id:number;text:string}[];canControl?:boolean;me?:{id:string;legal:FlipAction['type'][];canManage?:boolean}}
