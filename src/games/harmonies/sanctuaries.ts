import catalog from './sanctuaries.json' with {type:'json'};
import type {Cell,Player,Sanctuary,Side,Terrain} from './types.js';
import {terrain,ANIMAL} from './data.js';import {boardNeighbors} from './boards.js';
export const SANCTUARIES=catalog as Sanctuary[];
export const SANCTUARY:Record<string,Sanctuary>=Object.fromEntries(SANCTUARIES.map(s=>[s.id,s]));
export const sanctuaryComplete=(p:Player,cell:number)=>p.sanctuaries?.some(s=>s.cell===cell&&s.complete)??false;
export function sanctuaryPrefix(cell:Cell,tile:string,token?:Terrain){const stack=cell.stack.map(terrain),target=SANCTUARY[tile]?.stack;if(!target||stack.length>=target.length||cell.cube||cell.whisper||cell.sanctuaryCubes?.length)return false;return stack.every((t,i)=>t===target[i])&&(token===undefined||token===target[stack.length]);}
export const incompleteSlots=(p:Player)=>p.cards.filter(c=>c.placed<ANIMAL[c.card].points.length).length+(p.sanctuaries?.filter(s=>!s.complete).length??0);
export function sanctuaryScores(p:Player,side:Side){return (p.sanctuaries??[]).map(s=>({tile:s.tile,cell:s.cell,complete:s.complete,points:s.complete&&s.cell!==undefined?3*boardNeighbors(side,s.cell).filter(i=>{const top=p.board[i].stack.at(-1);return top&&SANCTUARY[s.tile].colors.includes(terrain(top));}).length:0}));}
