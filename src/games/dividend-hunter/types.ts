export interface HunterOptions{rounds:number;limit:number}
export interface HunterBid{id:string;amount:number}
export interface HunterRound{round:number;bids:HunterBid[];changes:{id:string;amount:number}[]}
export interface HunterState extends HunterOptions{schema:1;phase:'playing'|'round-end'|'finished';round:number;players:{id:string;name:string;score:number}[];bids:HunterBid[];history:HunterRound[];winners:string[];sequence:number}
export type HunterAction={type:'hunter-bid';amount:number}|{type:'hunter-next'};
export interface HunterView extends HunterOptions{gameId:'dividend-hunter';code:string;revision:number;phase:HunterState['phase']|'lobby';round:number;submitted:number;players:{id:string;name:string;score:number;submitted:boolean;bid?:number;connected?:boolean;ready?:boolean;avatar?:string|null}[];history:HunterRound[];winners:string[];turn?:string;canControl?:boolean;me?:{id:string;bid?:number;canManage?:boolean}}
