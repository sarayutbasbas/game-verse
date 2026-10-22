import {terrainCardPrint as terrainPrint} from './harmonies-token-art.js';
import {ANIMAL} from '../games/harmonies/data.js';
import type {Terrain} from '../games/harmonies/types.js';
export const PAPER_TERRAIN_COLORS:Record<Terrain,string>={water:'#1689ad',rock:'#62696b',wood:'#a35c32',leaf:'#95a62b',field:'#e6b522',building:'#c44d3e'};
export function cardRailTerrain(id:string):Terrain{const p=ANIMAL[id].pattern.find(p=>p.cube);if(!p)throw Error('Card has no cube destination');return p.stack.at(-1)!;}
export const paperArtFolder=(id:string)=>ANIMAL[id].expansion==='pulse'?'pulse-v1':ANIMAL[id].kind?'special-paper-v1':'paper-v6';
export const paperArt=(id:string,large=false,lite=false)=>`/art/harmonies/${paperArtFolder(id)}/${id}${large?'':lite?'-lite':'-small'}.webp`;
export function specialCardBadge(id:string){const c=ANIMAL[id];if(!c.kind)return '';const type=id==='spirit-11'?'dinosaur':c.kind,label=type==='dinosaur'?'ไดโนเสาร์':type==='spirit'?'สัตว์ในตำนาน':'เสียงกระซิบ';return `<span class="hm-category-badge" data-category="${type}" role="img" aria-label="การ์ดพิเศษ · ${label}"><img src="/art/harmonies/category-badges-v1/${type}.webp" alt="" width="160" height="160" decoding="async"></span>`;}
type Scenario={stacks:Terrain[][];points:number;minimum?:number;cubes?:boolean};
export const PAPER_SPIRIT_SCENARIOS:Record<string,Scenario[]>={
 'animal-connected':[{stacks:[],points:2,cubes:true}],
 'field-large':[{stacks:[['field']],points:2},{stacks:[['field'],['field']],points:2},{stacks:[['field'],['field'],['field']],points:10,minimum:3}],
 'field-groups':[{stacks:[['field']],points:5,minimum:1}],
 'tree-tall':[{stacks:[['wood','leaf']],points:4},{stacks:[['wood','wood','leaf']],points:4}],
 'tree-short':[{stacks:[['leaf']],points:3},{stacks:[['wood','leaf']],points:3},{stacks:[['wood','wood','leaf']],points:1}],
 'building-groups':[{stacks:[['rock','building']],points:4,minimum:1}],
 'building-pairs':[{stacks:[['rock','building'],['rock','building']],points:6,minimum:2}],
 'rock-tall':[{stacks:[['rock','rock']],points:4},{stacks:[['rock','rock','rock']],points:4}],
 'rock-short':[{stacks:[['rock']],points:3},{stacks:[['rock','rock']],points:3},{stacks:[['rock','rock','rock']],points:1}],
 'water-groups':[{stacks:[['water'],['water']],points:7,minimum:2}],
 'water-count':[{stacks:[['water']],points:2}],
};
const socket='<path d="M11 2H37L41 7H46V18L48 24L46 30V41H41L37 46H11L7 41H2V30L0 24L2 18V7H7Z" fill="var(--paper-score-fill)" stroke="#fff0c7" stroke-width="1"/>';
function numericRow(value:number|string,index:number,placed:number){const wide=String(value).includes('/'),width=wide?68:48;return `<span class="hm-paper-score-row ${index<placed?'earned':''}" data-score-index="${index}" aria-label="${value} คะแนน"><svg viewBox="0 0 ${width} 48" aria-hidden="true"><g transform="scale(${width/48} 1)">${socket}</g><text x="${width/2}" y="33" text-anchor="middle" class="hm-paper-score-number" style="font-size:32px">${value}</text></svg></span>`;}
const SCENARIO_ROW_HEIGHT=100;
function spiritScenario(id:string){const c=ANIMAL[id],rows=PAPER_SPIRIT_SCENARIOS[c.spiritScoring!];if(!rows)throw Error('Missing Spirit scenario');const h=rows.length*SCENARIO_ROW_HEIGHT+56;
 return `<span class="hm-paper-spirit-panel" style="aspect-ratio:120/${h}" data-scoring-rule="${c.spiritScoring}" role="img" aria-label="${c.description}"><svg viewBox="0 0 120 ${h}" aria-hidden="true"><path class="hm-scenario-frame" d="M60 2C75 2 81 9 96 7L102 18Q104 25 118 25V${h-36}Q104 ${h-36} 104 ${h-24}H88Q76 ${h-24} 72 ${h-12}L60 ${h-3}L48 ${h-12}Q44 ${h-24} 32 ${h-24}H16Q16 ${h-36} 2 ${h-36}V25Q16 25 18 18L24 7C39 9 45 2 60 2Z" fill="var(--paper-score-fill)" stroke="#fff0c7" stroke-width="2"/><path d="M9 31V${h-42}M111 31V${h-42}" fill="none" stroke="#fff0c7" stroke-opacity=".45" stroke-width="1"/><path d="m60 ${h-19} 5 5-5 5-5-5Z" fill="#fff0c7" opacity=".75"/>${rows.map((s,row)=>{const y=6+row*SCENARIO_ROW_HEIGHT,space=30,start=60-(s.stacks.length-1)*space/2;
 const diagram=s.cubes?`<image href="/art/harmonies/tokens-v5/crystal-dinosaur-white.webp" x="20" y="${y+8}" width="36" height="40"/><path d="M55 ${y+31}h10" stroke="#fff0c7" stroke-width="2"/><image href="/art/harmonies/tokens-v5/crystal-animal-gold.webp" x="64" y="${y+8}" width="36" height="40"/>`:s.stacks.map((stack,at)=>stack.map((t,layer)=>`<image href="${terrainPrint(t)}" x="${start+at*space-21}" y="${y+18-layer*8}" width="42" height="36"/>`).join('')).join('');
 return `<g data-scenario-points="${s.points}"><g class="hm-scenario-tokens">${diagram}${s.minimum?`<text x="110" y="${y+12}" text-anchor="end" fill="#fff0c7" font-family="sans-serif" font-size="12">${s.minimum}+</text>`:''}</g><text x="60" y="${y+96}" text-anchor="middle" class="hm-paper-score-number hm-scenario-number" style="font-size:64px">${s.points}</text></g>`;}).join('')}</svg></span>`;
}
export function spiritCardRail(id:string){return ANIMAL[id].kind==='spirit'&&id!=='spirit-11'?'<img class="hm-side-rail hm-paper-rail hm-rainbow-rail" src="/art/harmonies/rails-v6/spirit-rainbow.svg" alt="" aria-hidden="true" decoding="async">':'';}
export function paperCardFace(id:string,placed:number,large:boolean,lite:boolean,habitat:string){const c=ANIMAL[id],terrain=cardRailTerrain(id),theme=id==='spirit-11'?'dinosaur':c.kind??'normal';
 return `${specialCardBadge(id)}<span class="hm-animal-art hm-card-v6" data-card-version="v6" data-card-id="${id}" data-card-theme="${theme}" data-ui-key="art-illustrated-paper-v6-${id}-${large?'large':lite?'lite':'small'}"><img src="${paperArt(id,large,lite)}" alt="" width="${large?900:lite?150:300}" height="${large?1200:lite?200:400}" loading="${large?'eager':'lazy'}" decoding="async"></span>${spiritCardRail(id)||`<img class="hm-side-rail hm-paper-rail" data-rail-terrain="${terrain}" src="/art/harmonies/rails-v6/${terrain}${large?'':'-small'}.png" alt="" aria-hidden="true" decoding="async">`}${habitat}${paperScoreTrack(id,placed,large)}`;
}

export function paperScoreTrack(id:string,placed:number,large:boolean){const c=ANIMAL[id],terrain=cardRailTerrain(id),theme=id==='spirit-11'?'dinosaur':c.kind??'normal',panelHeight=(PAPER_SPIRIT_SCENARIOS[c.spiritScoring??'']?.length??0)*SCENARIO_ROW_HEIGHT+56;return `<span class="hm-card-points hm-paper-points" data-card-theme="${theme}" data-score-steps="${c.points.length}" data-score-terrain="${terrain}" style="--score-steps:${c.points.length};--paper-score-height:${c.points.length*(large?9:12.5)}%;--paper-score-gaps:${Math.max(0,c.points.length-1)*3}px;--paper-small-panel-height:${.75*.30*panelHeight/120*100}%;--paper-large-panel-height:${.75*.27*panelHeight/120*100}%;--paper-score-fill:${theme==='dinosaur'?'#bd501c':PAPER_TERRAIN_COLORS[terrain]}" aria-label="${c.description??'คะแนนสะสมตามจำนวนสัตว์ที่วาง'}">${c.kind==='spirit'?spiritScenario(id):c.points.map((n,i)=>numericRow(c.kind==='whisper'?'2/5':n,i,placed)).join('')}</span>`;}
