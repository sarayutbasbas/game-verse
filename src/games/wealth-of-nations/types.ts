export type Good='food'|'energy'|'labor'|'ore'|'capital';
export type Industry=Good|'bank';
export type Stock=Record<Good,number>;
export interface Tile {id:string;kind:Industry;rotation:number}
export interface Cell {id:string;q:number;r:number;owner?:string;tile?:Tile}
export interface Player {id:string;name:string;nation:number;cash:number;notes:number;goods:Stock}
export interface Placement {cell:string;rotation:number}
export interface Transfer {cash:number;notes:number;goods:Stock}
export interface Offer {from:string;to:string;give:Transfer;take:Transfer;promise:string}
export interface Plan {fed:string[];ore:string[]}
export interface Bloc {id:string;owner:string;kind:Industry;tiles:string[];automated:boolean;dots:number}
export interface Score {id:string;industries:number;flags:number;cash:number;notes:number;points:number}
export interface WealthState {schema:1;matchId?:string;phase:'nation'|'setup'|'trade'|'develop'|'produce'|'finished';players:Player[];board:Cell[];first:number;starter:number;turn:number;round:number;sequence:number;passes:number;draft:number;available:string[];tiles:Record<Industry,number>;markets:Stock;supply:Stock;minted:Stock;automation:string[];plans:Record<string,Plan>;final:boolean;offer?:Offer;results:Score[];winners:string[];last:{id:number;text:string;production?:{id:string;cost:Stock;gain:Stock;cash:number}[]}}
export type WealthAction=({type:'wn-nation';nation:number}|{type:'wn-package';package:string;placements:Placement[]}|{type:'wn-buy'|'wn-sell';good:Good}|{type:'wn-pass'|'wn-borrow'|'wn-repay'|'wn-cancel'|'wn-unplan'}|{type:'wn-offer';to:string;give:Transfer;take:Transfer;promise:string}|{type:'wn-answer';accept:boolean}|{type:'wn-claim';cell:string}|{type:'wn-build';cell:string;kind:Industry;rotation:number;force:boolean}|{type:'wn-move';moves:{tile:string;cell:string;rotation:number;force:boolean}[];automation:{bloc:string;tile:string}[]}|{type:'wn-automate';bloc:string}|{type:'wn-produce';plan:Plan})&{epoch:string};
export interface Legal {actions:WealthAction['type'][];packages:string[];claims:string[];builds:{cell:string;kind:Industry;rotation:number;force:boolean;cost:Stock}[];automate:string[];buy:Good[];sell:Good[];loan:number;blocs:Bloc[];nations:number[]}
export interface WealthView {gameId:'wealth-of-nations';code:string;revision:number;phase:WealthState['phase']|'lobby';epoch:string;round:number;first:string;turn:string;passes:number;draft:number;final:boolean;available:string[];board:Cell[];tiles:Record<Industry,number>;markets:Stock;supply:Stock;automation:string[];blocs:Bloc[];prepared:string[];players:{id:string;name:string;nation:number;notes:number;goods:Stock;flags:number;industries:number;cash?:number;ready?:boolean;connected?:boolean;avatar?:string|null}[];offer?:Offer;results:Score[];winners:string[];last:WealthState['last'];canControl?:boolean;me?:{id:string;cash:number;legal:Legal;plan?:Plan;canManage?:boolean}}
