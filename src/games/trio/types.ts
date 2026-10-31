export interface TrioOptions {mode:'simple'|'spicy';teams:boolean}
export interface TrioPlayer {id:string;name:string;hand:string[];trios:number[];team:number}
export type RevealSource={kind:'table';slot:number}|{kind:'hand';player:string;edge:'low'|'high'};
export interface Revealed {card:string;source:RevealSource}
export interface SwapState {eligible:number[];done:number[];offers:Record<string,string|null>;resume:number}
export interface TrioState {players:TrioPlayer[];phase:'playing'|'review'|'swap'|'finished';turn:number;starter:number;sequence:number;matchId?:string;options:TrioOptions;table:(string|null)[];revealed:Revealed[];outcome?:{kind:'miss'|'trio';rank?:number};swaps?:SwapState;winners:string[];events:{id:number;text:string}[];turnNumber:number}
export type TrioAction={type:'tr-reveal';slot:number}|{type:'tr-ask';player:string;edge:'low'|'high'}|{type:'tr-continue'}|{type:'tr-swap';card:string|null};
export interface TrioView {gameId:'trio';code:string;revision:number;phase:TrioState['phase']|'lobby';turn:string;sequence:number;turnNumber:number;options:TrioOptions;table:{slot:number;rank:number|null;removed:boolean}[];revealed:{rank:number;source:RevealSource}[];outcome?:TrioState['outcome'];players:{id:string;name:string;handCount:number;trios:number[];team:number;swapReady?:boolean;ready?:boolean;avatar?:string|null;connected?:boolean}[];winners:string[];events:TrioState['events'];swapTeams:number[];me?:{id:string;hand:string[];legal:TrioAction[];offer?:string|null;canManage?:boolean};canControl?:boolean}
