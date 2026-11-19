export type CrashPhase='playing'|'round-end'|'finished';
export interface CrashPlayer{id:string;name:string;score:number}
export interface CrashBid{id:string;amount:number}
export interface CrashRound{round:number;pot:number;limit:number;crashed:boolean;total:number;bids:CrashBid[];changes:{id:string;amount:number}[]}
export interface CrashState{schema:1;phase:CrashPhase;players:CrashPlayer[];round:number;rounds:number;pot:number;limit:number;history:CrashRound[];bids:CrashBid[];sequence:number;winners:string[]}
export type CrashAction={type:'crash-bid';amount:number}|{type:'crash-next'}|{type:'crash-end'};
export interface CrashView{gameId:'stock-market-crash';code:string;revision:number;phase:CrashPhase|'lobby';round:number;rounds:number;pot:number;limit:number;liveTotal:number;submitted:number;revealLive:boolean;players:{id:string;name:string;score:number;submitted:boolean;bid?:number;connected?:boolean;ready?:boolean;avatar?:string|null}[];history:CrashRound[];winners:string[];turn?:string;canControl?:boolean;me?:{id:string;bid?:number;canManage?:boolean}}
