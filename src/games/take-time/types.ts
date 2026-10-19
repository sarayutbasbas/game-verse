export type Suit='solar'|'lunar';
export interface Card {id:string;suit:Suit;value:number}
export interface Player {id:string;name:string;opened:boolean;hand:Card[];reserve:Card[]}
export interface Placement {card:Card;owner:string;segment:number;faceup:boolean}
export interface Result {success:boolean;sums:number[];checks:{label:string;ok:boolean}[]}
export interface TakeTimeState {
 schema:1;matchId:string;clock:'1-1';attempt:number;bonus:number;
 phase:'discussion'|'placement'|'resolution'|'finished';players:Player[];
 unused:Card[];placed:Placement[];turn?:string;revealed:number;result?:Result;
}
export type TakeTimeAction={type:'tt-open';attempt:number}|{type:'tt-place';card:string;segment:number;faceup:boolean}|{type:'tt-reveal'};
export interface VisibleCard {id:string;suit:Suit;value?:number}
export interface TakeTimeView {
 gameId:'take-time';code:string;revision:number;phase:TakeTimeState['phase']|'lobby';
 clock:'1-1';attempt:number;bonus:number;faceupRemaining:number;revealed:number;turn?:string;
 players:{id:string;name:string;opened:boolean;cards:VisibleCard[];reserve:VisibleCard[];ready?:boolean;connected?:boolean;avatar?:string|null}[];
 placed:{card:VisibleCard;owner:string;segment:number;faceup:boolean}[];result?:Result;
 me?:{id:string;hand:VisibleCard[];placed:VisibleCard[];canManage?:boolean;legal:TakeTimeAction[]};
}
