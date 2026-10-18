import {CARD,CARDS,COLORS} from './data.js';
import type {PixiesState as State,PixiesAction as Action,Player,Score,Offer,PixiesView} from './types.js';
export const emptyPlayer=(id:string,name:string):Player=>({id,name,grid:Array.from({length:9},()=>({up:null,down:null})),scores:[]});
function setup(s:State,random:()=>number){
 s.deck=CARDS.map(c=>c.id);for(let i=s.deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[s.deck[i],s.deck[j]]=[s.deck[j],s.deck[i]];}
 for(const p of s.players)p.grid=emptyPlayer(p.id,p.name).grid;
 s.market=[];s.pending=undefined;s.picks=0;s.batchStart=s.starter;s.turn=s.starter;s.phase='playing';s.event='deal';deal(s);
}
function deal(s:State){const n=Math.min(s.players.length===2?4:s.players.length,s.deck.length);if(n<s.players.length)throw Error('สำรับไม่เพียงพอ: ตรวจสถานะเกม');s.market=s.deck.splice(0,n);s.marketSlots=[...s.market];s.picks=0;s.batchStart=s.turn;}
export function createInitialState(seats:{id:string;name:string}[],random:()=>number,starter?:string):State{
 if(seats.length<2||seats.length>5||new Set(seats.map(p=>p.id)).size!==seats.length)throw Error('Pixies ต้องมีผู้เล่น 2–5 คน');
 const first=starter===undefined?Math.floor(random()*seats.length):seats.findIndex(p=>p.id===starter);if(first<0)throw Error('เลือกผู้เริ่มที่อยู่ในห้อง');
 const s:State={phase:'playing',players:seats.map(p=>emptyPlayer(p.id,p.name)),round:1,turn:first,starter:first,batchStart:first,picks:0,deck:[],market:[],sequence:0,event:'deal',winners:[]};setup(s,random);return s;
}
export function placementOffers(s:State,actor:string):Offer[]{
 if(s.phase!=='playing'||s.players[s.turn]?.id!==actor||!s.pending)return [];
 const p=s.players[s.turn],c=CARD[s.pending.card],slot=c.number-1,cell=p.grid[slot];
 if(!cell.up)return [{slot,keep:'new',description:cell.down?'วางหงายทับไพ่คว่ำ • ยืนยันช่องทันที':'วางหงายตรงหมายเลข'}];
 if(!cell.down)return [{slot,keep:'old',description:'เก็บใบเดิมหงาย • คว่ำใบใหม่ไว้ข้างใต้'},{slot,keep:'new',description:'เก็บใบใหม่หงาย • คว่ำใบเดิมไว้ข้างใต้'}];
 return p.grid.flatMap((v,i)=>!v.up&&!v.down?[{slot:i,keep:'down' as const,description:'ช่องหมายเลขนี้ยืนยันแล้ว • วางคว่ำในช่องว่าง'}]:[]);
}
export function getLegalActions(s:State,actor:string):Action[]{
 if(!s.players.some(p=>p.id===actor))return [];
 if(s.phase==='results')return [{type:'pixies-next'}];if(s.phase==='finished'||s.players[s.turn].id!==actor)return [];
 if(s.pending)return [...placementOffers(s,actor).map(o=>({type:'pixies-place' as const,slot:o.slot,keep:o.keep})),{type:'pixies-cancel'},...s.market.filter(card=>card!==s.pending!.card).map(card=>({type:'pixies-pick' as const,card}))];
 return s.market.map(card=>({type:'pixies-pick',card}));
}
export function scoreGarden(p:Player,round:number){
 const contributors:{validated:number[];spirals:number[];crosses:number[];special:number[];zone:number[]}={validated:[],spirals:[],crosses:[],special:[],zone:[]};
 p.grid.forEach((v,i)=>{if(!v.up)return;const c=CARD[v.up];if(v.down)contributors.validated.push(i);if(c.spirals)contributors.spirals.push(i);if(c.crosses)contributors.crosses.push(i);if(c.perColor)contributors.special.push(i);});
 const up=p.grid.flatMap(v=>v.up?[CARD[v.up]]:[]);let validated=0,spirals=0,crosses=0,special=0,zoneSize=0;
 for(const v of p.grid)if(v.up){const c=CARD[v.up];if(v.down)validated+=c.number;spirals+=c.spirals;crosses+=c.crosses;if(c.perColor)special+=up.filter(x=>x.colors.includes(c.perColor!)).length;}
 for(const color of COLORS){const visited=new Set<number>();for(let i=0;i<9;i++){if(visited.has(i)||!p.grid[i].up||!CARD[p.grid[i].up!].colors.includes(color))continue;const todo=[i];visited.add(i);const group:number[]=[];let size=0;while(todo.length){const v=todo.pop()!;size++;group.push(v);const neighbors=[v-3,v+3,...(v%3?[v-1]:[]),...(v%3<2?[v+1]:[])];for(const k of neighbors)if(k>=0&&k<9&&!visited.has(k)&&p.grid[k].up&&CARD[p.grid[k].up!].colors.includes(color)){visited.add(k);todo.push(k);}}if(size>=2&&size>zoneSize){zoneSize=size;contributors.zone=group;}}}
 const zone=zoneSize*(round+1);return {score:{validated,spirals,crosses,special,zoneSize,zone,total:validated+spirals-crosses+special+zone},contributors};
}
export const scorePlayer=(p:Player,round:number):Score=>scoreGarden(p,round).score;
function settle(s:State){for(const p of s.players)p.scores.push(scorePlayer(p,s.round));s.phase=s.round===3?'finished':'results';s.event=s.phase==='finished'?'finish':'round';s.starter=s.turn;if(s.phase==='finished'){const totals=s.players.map(p=>p.scores.reduce((a,b)=>a+b.total,0)),best=Math.max(...totals);s.winners=s.players.filter((_,i)=>totals[i]===best).map(p=>p.id);}}
const same=(a:Action,b:Action)=>Object.keys(a).sort().join(',')===Object.keys(b).sort().join(',')&&Object.entries(a).every(([k,v])=>(b as any)[k]===v);
export function applyAction(state:State,actor:string,action:Action,random:()=>number):State{
 if(!action||!getLegalActions(state,actor).some(a=>same(a,action)))throw Error('การกระทำไม่ตรงกับตาหรือสถานะปัจจุบัน');
 const s=structuredClone(state);s.marketSlots??=[...s.market];s.sequence++;
 if(action.type==='pixies-next'){s.round++;setup(s,random);return s;}
 if(action.type==='pixies-pick'){s.pending={card:action.card};s.event='pick';return s;}
 if(action.type==='pixies-cancel'){s.pending=undefined;s.event='pick';return s;}
 const card=s.pending!.card,p=s.players[s.turn],cell=p.grid[action.slot];s.market=s.market.filter(id=>id!==card);s.marketSlots=s.marketSlots.map(id=>id===card?null:id);
 if(action.keep==='down')cell.down=card;else if(action.keep==='old')cell.down=card;else {if(cell.up)cell.down=cell.up;cell.up=card;}
 s.pending=undefined;s.event=cell.up&&cell.down?'validate':'place';s.picks++;
 const boundary=s.picks%s.players.length===0;
 if(boundary&&(s.players.some(p=>p.grid.every(v=>v.up||v.down))||!s.market.length&&s.deck.length<s.players.length)){settle(s);return s;}
 if(!s.market.length){deal(s);}else s.turn=(s.turn+1)%s.players.length;
 return s;
}
export function getDisplayView(s:State,code:string,revision:number):PixiesView{return {gameId:'pixies',code,revision,phase:s.phase,round:s.round,turn:s.players[s.turn].id,starter:s.players[s.starter].id,market:s.market.map(id=>structuredClone(CARD[id])),marketLayout:(s.marketSlots??s.market).map(id=>id&&s.market.includes(id)?structuredClone(CARD[id]):null),deckCount:s.deck.length,pending:s.pending?{card:structuredClone(CARD[s.pending.card]),actor:s.players[s.turn].id}:undefined,sequence:s.sequence,event:{kind:s.event,revision},winners:[...s.winners],players:s.players.map(p=>({id:p.id,name:p.name,grid:p.grid.map(v=>({up:v.up?structuredClone(CARD[v.up]):null,down:!!v.down})),scores:structuredClone(p.scores),total:p.scores.reduce((a,b)=>a+b.total,0),score:scorePlayer(p,s.round),contributors:scoreGarden(p,s.round).contributors}))};}
export function getPlayerView(s:State,actor:string):NonNullable<PixiesView['me']>{if(!s.players.some(p=>p.id===actor))throw Error('ไม่พบผู้เล่น');return {id:actor,legal:getLegalActions(s,actor),offers:placementOffers(s,actor)};}
export const isFinished=(s:State)=>s.phase==='finished';
