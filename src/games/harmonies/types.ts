export type Terrain='water'|'rock'|'wood'|'leaf'|'field'|'building';
export type Side='A'|'B';
export interface Pattern {q:number;r:number;stack:Terrain[];cube:boolean}
export interface Animal {id:string;name:string;animal:string;points:number[];pattern:Pattern[]}
export interface Cell {stack:string[];cube?:{id:string;card:string}}
export interface AnimalProgress {card:string;placed:number}
export interface Score {trees:number;mountains:number;fields:number;buildings:number;water:number;animals:{card:string;placed:number;points:number}[];landscape:number;animalTotal:number;total:number;cubes:number;riverLength:number;islands:number}
export interface Player {id:string;name:string;board:Cell[];cards:AnimalProgress[]}
export type HarmoniesAction={type:'harmonies-group';group:number}|{type:'harmonies-place';token:string;cell:number}|{type:'harmonies-card';card:string}|{type:'harmonies-cube';card:string;origin:number;rotation:number}|{type:'harmonies-end'};
export interface HarmoniesState {phase:'playing'|'finished';side:Side;players:Player[];starter:number;turn:number;turnCount:number;bag:string[];groups:string[][];deck:string[];market:string[];hand:string[];picked:boolean;cardTaken:boolean;cubeReserve:number;endAt?:number;sequence:number;event:{kind:'setup'|'group'|'place'|'card'|'cube'|'turn'|'finish';actor?:string;cell?:number;card?:string;token?:string};winners:string[];scores?:Record<string,Score>;matchId?:string}
export interface Habitat {card:string;origin:number;rotation:number;cell:number;cells:number[]}
export interface HarmoniesView {gameId:'harmonies';code:string;revision:number;phase:'lobby'|'playing'|'finished';side:Side;displayMode?:'full-mobile'|'shared-table';canConfigureDisplay?:boolean;displayControl?:{id:string;legal:HarmoniesAction[];habitats:Habitat[]};players:{id:string;name:string;avatar?:string|null;connected?:boolean;ready?:boolean;board:Cell[];cards:AnimalProgress[];score:Score}[];turn?:string;turnCount?:number;groups?:string[][];market?:string[];bagCount?:number;deckCount?:number;cubeReserve?:number;hand?:string[];picked?:boolean;cardTaken?:boolean;endAt?:number;sequence?:number;event?:HarmoniesState['event'];winners?:string[];me?:{id:string;canManage?:boolean;legal:HarmoniesAction[];habitats:Habitat[]}}
