export type HighLowPhase='betting'|'round-end'|'finished';
export interface HighLowPlayer{id:string;name:string;score:number}
export interface HighLowWager{id:string;answer:boolean;stake:number;allIn:boolean}
export interface HighLowRound{round:number;questionId:string;wagers:HighLowWager[];changes:{id:string;amount:number}[]}
export interface HighLowState{schema:1;phase:HighLowPhase;players:HighLowPlayer[];round:number;rounds:number;questionId:string;deck:string[];wagers:HighLowWager[];history:HighLowRound[];winners:string[];sequence:number}
export type HighLowAction={type:'hl-bet';answer:boolean;stake:number;allIn?:boolean}|{type:'hl-next'};
export interface HighLowQuestion{id:string;category:string;text:string;answer:boolean;explanation:string;source:string}
export interface HighLowView{gameId:'high-low-scoreboard';code:string;revision:number;phase:HighLowPhase|'lobby';round:number;rounds:number;turn?:string;players:{id:string;name:string;score:number;submitted:boolean;answer?:boolean;stake?:number;allIn?:boolean;connected?:boolean;ready?:boolean;avatar?:string|null}[];question?:Pick<HighLowQuestion,'id'|'category'|'text'>;answer?:boolean;explanation?:string;source?:string;submitted:number;winners:string[];canControl?:boolean;history:{round:number;question:Pick<HighLowQuestion,'id'|'category'|'text'|'answer'|'explanation'|'source'>;wagers:HighLowWager[];changes:{id:string;amount:number}[]}[];me?:{id:string;answer?:boolean;stake?:number;allIn?:boolean;canManage?:boolean}}
