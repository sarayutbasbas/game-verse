export type Role='pilot'|'copilot';
export interface Die {id:string;value:number}
export interface Seat {id:string;name:string;role:Role}
export type SkyAction={type:'sky-ready';epoch:string;ready:boolean}|{type:'sky-place';die:string;slot:string;adjust:number}|{type:'sky-reroll'}|{type:'sky-reroll-dice';epoch:string;dice:string[]}|{type:'sky-next'};
export interface Placement {role:Role;value:number;die:string}
export interface Flight {round:number;axis:number;position:number;speed:number|null;coffee:number;rerolls:number;gear:boolean[];flaps:boolean[];brakes:boolean[];traffic:number[];placements:Record<string,Placement>;brakeAtEngine:number|null}
export interface SkyState extends Flight {scenario:'yul-intro';phase:'planning'|'placement'|'reroll'|'resolution'|'finished';players:Seat[];dice:Record<Role,Die[]>;ready:string[];turn:number;reroll?:{serial:number;returnTurn:number;choices:Partial<Record<Role,string[]>>};sequence:number;event:'setup'|'roll'|'place'|'reroll'|'round'|'finish';result?:{success:boolean;reasons:string[]};history:Flight[];matchId?:string}
export interface SkyView extends Flight {gameId:'sky-team';code:string;revision:number;scenario:'yul-intro';phase:'lobby'|SkyState['phase'];players:(Seat&{avatar?:string|null;connected?:boolean;ready?:boolean})[];turn?:string;sequence:number;event:SkyState['event'];result?:SkyState['result'];history:Flight[];me?:{id:string;role:Role;dice:Die[];legal:SkyAction[];ready:boolean;rerollSubmitted:boolean;canManage?:boolean}}
