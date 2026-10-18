import type {Card} from './data.js';
export interface Slot {up:string|null;down:string|null}
export interface Score {validated:number;spirals:number;crosses:number;special:number;zoneSize:number;zone:number;total:number}
export interface Player {id:string;name:string;grid:Slot[];scores:Score[]}
export type PixiesAction = {type:'pixies-pick';card:string}|{type:'pixies-place';slot:number;keep:'old'|'new'|'down'}|{type:'pixies-cancel'}|{type:'pixies-next'};
export interface PixiesState {phase:'playing'|'results'|'finished';players:Player[];round:number;turn:number;starter:number;batchStart:number;picks:number;deck:string[];market:string[];marketSlots?:(string|null)[];pending?:{card:string};sequence:number;event:'deal'|'pick'|'place'|'validate'|'round'|'finish';winners:string[];matchId?:string}
export interface Offer {slot:number;keep:'old'|'new'|'down';description:string}
export interface PixiesView {gameId:'pixies';code:string;revision:number;phase:'lobby'|PixiesState['phase'];players:{id:string;name:string;avatar?:string|null;connected?:boolean;ready?:boolean;grid:{up:Card|null;down:boolean}[];scores:Score[];total:number;score:Score;contributors?:Record<'validated'|'spirals'|'crosses'|'special'|'zone',number[]>}[];round?:number;turn?:string;starter?:string;market?:Card[];marketLayout?:(Card|null)[];deckCount?:number;pending?:{card:Card;actor:string};sequence?:number;event?:{kind:PixiesState['event'];revision:number};winners?:string[];me?:{id:string;canManage?:boolean;legal:PixiesAction[];offers:Offer[]}}
