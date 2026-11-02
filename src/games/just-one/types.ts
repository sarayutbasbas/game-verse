export type Phase='choose'|'writing'|'review'|'guess'|'judge'|'result'|'finished';
export interface Result {index:number;number:number;outcome:'correct'|'wrong'|'pass'|'cancelled';guess?:string;spent:number;lostPoint:boolean}
export interface JustOneState {schema:1;matchId?:string;prompt?:number;replaced?:string[];players:{id:string;name:string}[];pack:string[];cursor:number;starter:number;turn:number;round:number;phase:Phase;number?:number;clues:Record<string,string[]>;manual:string[];approved:string[];votes:Record<string,boolean>;guess?:string;history:Result[]}
export type JustOneAction=
 |{type:'jo-number';number:number;round:number}|{type:'jo-clues';clues:string[];round:number}
 |{type:'jo-cancel';key:string;cancelled:boolean;round:number}|{type:'jo-review';round:number}
 |{type:'jo-guess';text:string;round:number}|{type:'jo-pass';round:number}
 |{type:'jo-vote';correct:boolean;round:number}|{type:'jo-next';round:number}|{type:'jo-repick';round:number}|{type:'jo-replace';round:number};
export interface Clue {key:string;owner:string;text:string;cancelled:boolean;automatic:boolean}
export interface JustOneView {gameId:'just-one';matchId?:string;prompt?:number;replacementCount?:number;code:string;revision:number;phase:Phase|'lobby';round:number;turn:string;number?:number;score:number;remaining:number;clueCount:number;players:{id:string;name:string;submitted:boolean;approved:boolean;voted:boolean;ready?:boolean;connected?:boolean;avatar?:string|null}[];hints:string[];guess?:string;result?:{word:string;outcome:Result['outcome'];lostPoint:boolean;spent:number};history:{word:string;outcome:Result['outcome'];guess?:string;lostPoint:boolean}[];canControl?:boolean;me?:{id:string;word?:string;ownClues:string[];review?:Clue[];vote?:boolean;legal:JustOneAction['type'][];canManage?:boolean}}
