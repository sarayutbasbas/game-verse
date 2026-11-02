export type Difficulty='easy'|'hard';
export interface Stroke {size:2|5|9;erase:boolean;points:string}
export type Drawing=Stroke[];
export type Phase='prepare'|'drawing'|'freeze'|'guess'|'judge'|'result'|'finished';
export interface Sketch {drawing:Drawing;version:number;frozen:boolean;token?:number}
export interface Attempt {artist:string;text:string;correct:boolean;pass:boolean}
export interface Result {round:number;guesser:string;word:string;artist?:string;points:number;order:string[];attempts:Attempt[]}
export interface CatchState {schema:1;matchId?:string;epoch:string;difficulty:Difficulty;players:{id:string;name:string;score:number}[];pack:string[];starter:number;turn:number;round:number;phase:Phase;ready:string[];sketches:Record<string,Sketch>;claims:string[];order:string[];reveal:number;tries:number;attempts:Attempt[];guess?:string;votes:Record<string,boolean>;history:Result[];winners:string[]}
export type CatchAction=
 |{type:'cs-ready'|'cs-pass'|'cs-next';epoch:string}
 |{type:'cs-save'|'cs-freeze';epoch:string;version:number;drawing:Drawing}
 |{type:'cs-claim';epoch:string;version:number;drawing:Drawing;token:1|2}
 |{type:'cs-guess';epoch:string;text:string}|{type:'cs-vote';epoch:string;correct:boolean};
export interface CatchView {gameId:'catch-sketch';code:string;revision:number;phase:Phase|'lobby';epoch:string;difficulty:Difficulty;round:number;rounds:number;turn:string;ready:string[];players:{id:string;name:string;score:number;token?:number;frozen:boolean;ready?:boolean;connected?:boolean;avatar?:string|null}[];available:(1|2)[];claimed:number;stopAt:number;boards:{artist:string;token:number;drawing:Drawing}[];current?:string;points:number;tries:number;guess?:string;voted:string[];attempts:Attempt[];result?:Result;history:Result[];winners:string[];canControl?:boolean;me?:{id:string;word?:string;sketch?:Sketch;vote?:boolean;legal:CatchAction['type'][];canManage?:boolean}}
