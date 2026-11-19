export type Resource='wood'|'wheat'|'brick'|'glass'|'stone';
export type BuildingType='cottage'|'food'|'gray'|'worship'|'green'|'yellow'|'black'|'monument';
export interface BuildingCard {id:string;name:string;en:string;type:BuildingType;pattern:string[];text:string}
export type Cell=null|{resource:Resource}|{building:string;marker?:Resource;stored?:Resource[];overlay?:Resource};
export interface TinyOptions {randomBuildings:boolean;monuments:boolean;cavern:boolean;mode:'master'|'town-hall'}
export type Effect={kind:'marker';at:number}|{kind:'free';building?:string}|{kind:'guild';remaining:number;changed:number[]}|{kind:'watch'};
export interface TinyPlayer {id:string;name:string;board:Cell[];offer:string[];monument?:string;placed:boolean;ready:boolean;doneRound?:number;masterTurns:number;cavern:number;effects:Effect[];watch:string[];shrine?:number}
export interface TinyState {schema:1;matchId?:string;players:TinyPlayer[];options:TinyOptions;cards:string[];phase:'monuments'|'call'|'place'|'finished';round:number;master:string;resource?:Resource;deck:Resource[];discard:Resource[];offer:Resource[];last:string;winners:string[]}
export type TinyAction=
 |{type:'tiny-monument';card:string}
 |{type:'tiny-call';resource:Resource;slot?:number}
 |{type:'tiny-place';at:number;resource:Resource;warehouse?:number;swap?:number}
 |{type:'tiny-cavern'}
 |{type:'tiny-build';card:string;cells:number[];at:number}
 |{type:'tiny-marker';resource:Resource}
 |{type:'tiny-free';card:string;at:number}
 |{type:'tiny-replace';card:string;at:number}
 |{type:'tiny-watch';cards:string[]}
 |{type:'tiny-skip'}|{type:'tiny-ready'}|{type:'tiny-finish'};
export interface BuildOption {card:string;cells:number[];destinations:number[]}
export interface Score {total:number;empty:number;penalty:number;fed:number[];cottages:number;items:{card:string;count:number;points:number}[]}
export interface TinyView {gameId:'tiny-towns';code:string;revision:number;matchId?:string;phase:TinyState['phase']|'lobby';turn:string;round:number;options:TinyOptions;cards:string[];resource?:Resource;offer:Resource[];last:string;winners:string[];canControl?:boolean;players:{id:string;name:string;board:Cell[];placed:boolean;ready:boolean;doneRound?:number;masterTurns:number;cavern:number;monument?:string;watch:string[];pending:number;score:Score;connected?:boolean;avatar?:string|null}[];me?:{id:string;offer:string[];monument?:string;legal:TinyAction[];builds:BuildOption[];effects:Effect[];canManage?:boolean}}
