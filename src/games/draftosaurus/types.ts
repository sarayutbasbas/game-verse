export const SPECIES = ['trex','triceratops','diplodocus','stegosaurus','parasaurolophus','spinosaurus'] as const;
export type Species = typeof SPECIES[number];
export const PENS = ['forest','king','trio','meadow','love','solitary','river'] as const;
export type Pen = typeof PENS[number];
export const FACES = ['woodlands','grasslands','left','right','empty','no-trex'] as const;
export type Face = typeof FACES[number];
export type Zoo = Record<Pen,string[]>;
export interface Choice {dinosaur:string;pen:Pen;discard?:string}
export interface Player {id:string;name:string;zoo:Zoo;hand:string[];choice?:Choice}
export interface Score {pens:Record<Pen,number>;trex:number;trexCount:number;total:number}
export interface DraftosaurusState {phase:'rolling'|'drafting'|'finished';players:Player[];bag:string[];discarded:string[];round:number;pick:number;roller:number;die?:Face;rollSerial:number;sequence:number;matchId?:string;winners:string[];lastReveal?:{id:string;dinosaur:string;pen:Pen}[]}
export type DraftosaurusAction = {type:'draftosaurus-roll'} | ({type:'draftosaurus-place';epoch:string}&Choice);
export interface PrivateView {id:string;hand:string[];zoo:Zoo;choice?:Choice;epoch:string;canRoll:boolean;legal:{dinosaur:string;pens:Pen[]}[];canManage?:boolean}
export interface DraftosaurusView {gameId:'draftosaurus';code:string;revision:number;phase:'lobby'|DraftosaurusState['phase'];turn?:string;round:number;pick:number;rounds:number;picksPerRound:number;roller?:string;die?:Face;rollSerial:number;sequence:number;players:{id:string;name:string;ready?:boolean;connected?:boolean;avatar?:string|null;zoo?:Zoo;score?:Score;chosen:boolean}[];me?:PrivateView;canRollDisplay?:boolean;winners:string[];lastReveal?:DraftosaurusState['lastReveal']}
