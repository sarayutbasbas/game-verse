export type Element='sun'|'moon'|'fire'|'air'|'water'|'earth'|'plant'|'animal';
export type Terrain='mountain'|'wetland'|'jungle'|'sands'|'ocean';
export type Piece='explorer'|'town'|'city'|'dahan';
export type SpiritId='lightning'|'river'|'earth'|'shadows'|'green'|'thunder'|'ocean'|'dreams';
export interface Power {id:string;name:string;en:string;kind:'unique'|'minor'|'major';spirit?:SpiritId;cost:number;speed:'fast'|'slow';range:number;source:'presence'|'sacred'|'wetland'|'jungle';target:'land'|'spirit'|'other';restriction:string;elements:Element[];text:string;threshold?:Partial<Record<Element,number>>;art:number}
export interface PresenceTask {range:number;terrain?:Terrain[];dahan?:boolean;inhabited?:boolean;oceanOnly?:boolean;ignoreType?:boolean}
export type GrowthStep={op:'reclaim'|'gain'|'reclaim-one'|'energy'|'card-play'|'ocean-gather'|'ocean-push';n?:number}|({op:'presence'}&PresenceTask);
export interface Spirit {id:SpiritId;name:string;en:string;level:'low'|'moderate'|'high';text:string;energy:(number|Element|'any')[];plays:(number|'reclaim'|'any')[];growth:GrowthStep[][];always?:GrowthStep[];cards:string[];progression?:string[];art:number}
export interface Unit {id:number;kind:Piece;damage:number}
export interface Land {id:string;board:string;number:number;terrain:Terrain;coastal:boolean;neighbors:string[];units:Unit[];blight:number;presence:Record<string,number>;defend:number;skip:{ravage:boolean;build:boolean;explore:boolean};dahanHealth:number;dahanSafe:boolean;ravageSafe:boolean;warning:boolean;vitality:boolean;apparitions:number;vengeance?:{owner:string;adjacent:boolean}[]}
export interface InvaderCard {id:string;stage:1|2|3;terrains:Terrain[];coastal?:boolean}
export interface SpiritOptions {blightCard:boolean;progression:boolean}
export interface Played {card:string;used:boolean;speed?:'fast'|'slow'}
export interface RepeatGrant {id:number;count:number;maxCost:number;pay:boolean;used:string[]}
export interface SpiritPlayer {id:string;name:string;spirit?:SpiritId;board:string;energy:number;top:number;bottom:number;destroyed:number;hand:string[];discard:string[];played:Played[];forgotten:string[];progression:string[];growth?:number;growthLeft:GrowthStep[];income:boolean;ready:boolean;reclaimOne:boolean;bonusPlays:number;bonusRange:number;bonusElements:Element[];anyElements:Element[];fastTokens:number;airUsed:number;innatesUsed:number[];repeats:RepeatGrant[];sharedPresence:string[];constancy:number;drowned:number;offer?:{kind:'minor'|'major';cards:string[];remaining?:string[]};task?:{kind:'presence';spec:PresenceTask;origin:'growth'|'power'}|{kind:'gain';deck?:'minor'|'major';forced?:'minor'|'major'}|{kind:'forget'}|{kind:'reclaim'}|{kind:'element';count:number;chosen:Element[];distinct:boolean;track?:boolean;copyTo?:string}}
export interface Context {owner:string;target:string;spiritTarget?:string;power:string;root:number;repeated:boolean;dreamed:number[];data:Record<string,number|string|string[]>}
export interface Step {op:string;n?:number|string;filter?:string;optional?:boolean;land?:string;player?:string;steps?:Step[];otherwise?:Step[];choices?:{name:string;steps:Step[]}[];test?:string;data?:string;spec?:PresenceTask;elements?:Partial<Record<Element,number>>}
export interface Resolution {context:Context;steps:Step[]}
export interface SpiritState {schema:1;matchId?:string;players:SpiritPlayer[];options:SpiritOptions;phase:'choose'|'setup'|'growth'|'fast'|'invader'|'slow'|'finished';round:number;sequence:number;lands:Land[];minor:string[];major:string[];minorDiscard:string[];majorDiscard:string[];invaders:InvaderCard[];invaderDiscard:InvaderCard[];ravage?:InvaderCard;build?:InvaderCard;explore?:InvaderCard;fearDeck:string[];fearEarned:string[];fearDiscard:string[];revealedFear:string[];fear:number;terror:1|2|3|4;blight:number;blighted:boolean;blightCard?:string;resolution?:Resolution;queued:Resolution[];invaderStep:'blight'|'fear'|'ravage'|'build'|'explore'|'advance';remainingLands:string[];invaderCompleted:string[];fearCurrent?:string;fearChosen:string[];last:string;log:string[];outcome?:'won'|'lost';reason?:string;lossPending?:string;winPending?:boolean}
export type SpiritAction=
 |{type:'si-spirit';spirit:SpiritId}
 |{type:'si-setup';land:string}
 |{type:'si-growth';option:number}
 |{type:'si-growth-step';index:number}
 |{type:'si-presence';land:string;track:'top'|'bottom'|'destroyed'|'board';from?:string}
 |{type:'si-gain';deck:'minor'|'major'}
 |{type:'si-keep';card:string}
 |{type:'si-forget';card:string}
 |{type:'si-reclaim';card:string}
 |{type:'si-element';element:Element}
 |{type:'si-income'}
 |{type:'si-play';card:string}|{type:'si-unplay';card:string}
 |{type:'si-ready'}
 |{type:'si-use';power:string;target:string;level?:number;threshold?:boolean;fast?:'air'|'token'|'innate';shadow?:boolean;repeat?:number}
 |{type:'si-choice';index:number}
 |{type:'si-gift';card:string;player:string}
 |{type:'si-fear';zone:'deck'|'earned';index:number}
 |{type:'si-return-card';card:string}
 |{type:'si-pass-power';power:string}
 |{type:'si-hit';unit:number;amount:number}
 |{type:'si-unit';unit:number}
 |{type:'si-move';unit:number;from:string;to:string;presence?:boolean}
 |{type:'si-land';land:string}
 |{type:'si-destroy-presence';player:string;land:string}
 |{type:'si-follow';follow:boolean}
 |{type:'si-skip'}
 |{type:'si-invader';land?:string}
 |{type:'si-drown';amount:number};
export interface PublicSpirit {id:string;name:string;spirit?:SpiritId;board:string;energy:number;top:number;bottom:number;destroyed:number;handCount:number;discard:string[];played:Played[];ready:boolean;growth?:number;income:boolean;bonusPlays:number;bonusRange:number;elements:Record<Element,number>;drowned:number;connected?:boolean;avatar?:string|null}
export interface SpiritView {gameId:'spirit-island';code:string;revision:number;matchId?:string;turn:string;phase:SpiritState['phase']|'lobby';round:number;options:SpiritOptions;players:PublicSpirit[];lands:Land[];fear:number;fearPool:number;fearDeckCount:number;fearEarnedCount:number;fearCurrent?:string;fearDiscard:string[];revealedFear:{zone:'deck'|'earned';index:number;card:string}[];terror:number;blight:number;blighted:boolean;blightCard?:string;ravage?:InvaderCard;build?:InvaderCard;explore?:InvaderCard;invaderCount:number;invaderDiscard:InvaderCard[];minorCount:number;majorCount:number;minorDiscard:string[];majorDiscard:string[];last:string;log:string[];resolution?:{power:string;owner:string;target:string;step:Step};invaderStep:SpiritState['invaderStep'];outcome?:'won'|'lost';reason?:string;score?:number;canControl?:boolean;me?:{id:string;hand:string[];offer?:SpiritPlayer['offer'];task?:SpiritPlayer['task'];growthLeft:GrowthStep[];progression:string[];legal:SpiritAction[];canManage?:boolean}}
