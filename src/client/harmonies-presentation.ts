import originalArt from './harmonies-original-art.json' with {type:'json'};
import {terrainCardPrint,terrainPickerPrint,terrainPrint,setHarmoniesTokenArt} from './harmonies-token-art.js';
export {terrainPrint} from './harmonies-token-art.js';
import {paperCardFace,paperArt,specialCardBadge,paperScoreTrack,spiritCardRail} from './harmonies-paper.js';
import {HEX,hexPoint,hexPolygon,habitatGeometry,axialNeighbors} from './harmonies-hex-layout.js';
import cardPalette from './harmonies-card-palette.json' with {type:'json'};
import {harmoniesLowEffects} from './harmonies-effects.js';
import { ANIMAL, NAMES } from '../games/harmonies/data.js';
import type { Terrain } from '../games/harmonies/types.js';
export const TERRAIN_PAINT: Record<Terrain, string> = { water: '#008eb9', rock: '#7c817d', wood: '#995023', leaf: '#458b21', field: '#edba13', building: '#ce503d' };
const PALETTE = TERRAIN_PAINT;
/** The same flat-top axial projection is used by the interactive board and card miniatures. */
export function habitatLayout(id: string) { const card = ANIMAL[id]; if (!card)
    throw Error('Unknown animal card'); const cells = card.pattern.map(p => ({ ...p, ...hexPoint(p.q,p.r), displayStack: p.stack[0] === 'building' && (card.kind!=='whisper'||p.stack.length===2) ? ['rock', 'building'] as Terrain[] : [...p.stack] })); return { cells, minX: Math.min(...cells.map(p => p.x)) - 34, maxX: Math.max(...cells.map(p => p.x)) + 34, minY: Math.min(...cells.map(p => p.y - p.displayStack.length * 8)) - 43, maxY: Math.max(...cells.map(p => p.y)) + 34 }; }
export type HarmoniesCardArt = 'illustrated'|'sculpted'|'original';
let cardArt:HarmoniesCardArt='illustrated';
const V5_BATCH_1=new Set(['animal-01','animal-02','animal-03','animal-04','animal-05','spirit-11','spirit-09','whisper-05','animal-22']);
const isV5Card=(id:string)=>cardArt!=='sculpted'&&V5_BATCH_1.has(id);
export function setHarmoniesCardArt(style:HarmoniesCardArt='illustrated'){cardArt=style;setHarmoniesTokenArt(style==='sculpted'?'sculpted':'illustrated');}
export const animalArt = (id: string) => cardArt==='original'&&id in originalArt?originalArt[id as keyof typeof originalArt].asset:cardArt!=='sculpted'||ANIMAL[id].expansion==='pulse'?paperArt(id,true):`/art/harmonies/reference/${id}.webp`;
export const spiritModelArt = (id: string) => `/art/harmonies/figurines/animated-v5/${id}.webp`;
const spiritGlow = ['#ffc95d','#d8a5ff','#72eeae','#91b6ff','#c49aff','#ffad8e','#b9e8ff','#ffc2ad','#8ff2f1','#a1e8a9','#ffd784'];
const whisperModels=['crystal','statue','flower','coral','mushroom','flower','statue','crystal','mushroom','coral'];
export function animalModelArt(id:string){
 const animal=ANIMAL[id];if(!animal)throw Error('Unknown animal card');
 if(animal.expansion==='pulse')return `/art/harmonies/figurines/pulse-${cardArt!=='sculpted'?'paper':'sculpted'}-v1/${id}.webp`;
 if(cardArt!=='sculpted')return `/art/harmonies/figurines/${animal.kind?'magic-paper-v1':'storybook-v1'}/${id}.webp`;
 return animal.kind==='spirit'?spiritModelArt(id):animal.kind==='whisper'?`/art/harmonies/figurines/sculpted-v1/whisper-${whisperModels[Number(id.slice(-2))-1]}-glow.webp`:`/art/harmonies/figurines/animated-v5/${id}.webp`;
}
/** Small card diagrams use crystals; large habitats, tray and board use the animal figure. */
export function crystalForCard(card:{id:string;kind?:string}){if(card.id==='spirit-11')return 'dinosaur-white';if(card.kind==='whisper')return 'whisper-purple';if(card.kind==='spirit')return 'spirit-rainbow';return 'animal-gold';}
export const crystalArt=(id:string)=>`/art/harmonies/baked-cards-v1/crystal-${crystalForCard(ANIMAL[id])}.webp`;
export function animalFigure(card: string, height = 0, preview = false, tray = false) {
 const animal=ANIMAL[card],kind=animal.kind??'normal',magic=cardArt!=='sculpted'&&animal.kind?(card==='spirit-11'?'gold':animal.kind==='spirit'?'rainbow':'purple'):undefined;
 return `<span class="hm-animal-sprite hm-${kind}-model ${tray?'hm-animal-sprite-tray':preview?'hm-cube-preview is-preview':'hm-cube'}" data-cube-card="${card}" data-animal="${animal.animal}" data-model-kind="${kind}" style="--height:${height};--stack-shift:${Math.max(0,height-1)*-2}px;--spirit-glow:${animal.kind==='spirit'?spiritGlow[Number(card.slice(-2))-1]:'#a8f8ed'}" aria-hidden="true"><img src="${animalModelArt(card)}" width="160" height="184" alt="" decoding="async" draggable="false">${magic?`<span class="hm-model-twinkles" data-magic-tone="${magic}" aria-hidden="true"><i></i><i></i><i></i></span>`:''}</span>`;
}
/** Original view uses game cubes on the board and in its placement tray. */
export function boardAnimalFigure(card:string,height=0,preview=false,tray=false){
 if(cardArt!=='original')return animalFigure(card,height,preview,tray);
 const animal=ANIMAL[card],kind=animal.kind??'normal',color=animal.kind==='whisper'?'whisper':animal.kind==='spirit'?'spirit':'animal';
 return `<span class="hm-animal-sprite hm-${kind}-model hm-crystal-marker hm-original-cube ${tray?'hm-animal-sprite-tray':preview?'hm-cube-preview is-preview':'hm-cube'}" data-cube-card="${card}" data-animal="${animal.animal}" data-model-kind="${kind}" style="--height:${height};--stack-shift:${Math.max(0,height-1)*-2}px" aria-hidden="true"><img src="/art/harmonies/original-cubes/${color}.svg" width="64" height="70" alt="" decoding="sync" draggable="false"></span>`;
}
export const terrainIcon = (t: Terrain) => `<img class="hm-token-print hm-painted-token" src="${terrainPickerPrint(t)}" alt="" aria-hidden="true" decoding="sync" draggable="false">`;
export function cylinder(t: Terrain, level: number, ghost = false, paint = PALETTE[t], icon = true, seam = false) { return `<span class="hm-token ${ghost ? 'ghost' : ''} ${seam ? 'has-same-stack' : ''}" data-terrain="${t}" style="--paint:${paint};--level:${level}">${icon?`<img class="hm-token-art" src="${terrainPickerPrint(t)}" alt="" aria-hidden="true" decoding="sync" draggable="false">`:''}</span>`; }
/** Preserve catalog axial coordinates through one shared flat-top projection. */
export function illustratedHabitat(id:string,large:boolean,debug=false){
 const card=ANIMAL[id],layout=habitatGeometry(habitatLayout(id).cells),{cells,minX,minY,width,height}=layout;
 const sceneX=minX+width/2-96,sceneY=minY+height-192;
 const debugMarkup=debug?`<g class="hm-geometry-debug" font-size="8" font-family="sans-serif" fill="#ff3873"><rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="none" stroke="#00e6f0"/>${cells.flatMap((c,i)=>cells.slice(i+1).filter(d=>axialNeighbors(c,d)).map(d=>`<path d="M${c.x} ${c.y}L${d.x} ${d.y}" stroke="#ff3873" stroke-width="1"/>`)).join('')}${cells.map(c=>`<rect x="${c.x-33}" y="${c.y-28}" width="66" height="56" fill="none" stroke="#ff3873" stroke-dasharray="2 2"/><circle cx="${c.x}" cy="${c.y}" r="2"/><text x="${c.x-25}" y="${c.y+26}">${c.q},${c.r}${c.cube?' CUBE':''}</text>`).join('')}</g>`:'';
 return `<span class="hm-diagram hm-habitat-scene hm-habitat-v5 hm-printed-habitat" data-pattern-card="${id}" role="img" aria-label="รูปแบบถิ่นอาศัย ${card.name}"><svg viewBox="${sceneX} ${sceneY} 192 192" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${cells.map(c=>{
 const capY=c.y-12-(c.displayStack.length-1)*HEX.layerHeight;
 return `<g class="hm-pattern-stack" data-q="${c.q}" data-r="${c.r}" data-stack-height="${c.displayStack.length}" data-cube-cell="${c.cube?'true':'false'}" data-center-x="${c.x}" data-center-y="${c.y}"><g class="hm-joined-hex" transform="translate(${c.x} ${c.y}) scale(.965)"><polygon points="${hexPolygon}" transform="translate(0 5)" fill="#1d3024" opacity=".18"/><polygon points="${hexPolygon}" transform="translate(0 ${HEX.sideDepth})" fill="#bba477"/><polygon points="${hexPolygon}" fill="#f5e9c9" stroke="#c5b18a" stroke-width=".7"/></g>${c.displayStack.map((t,i)=>`<image class="hm-habitat-token-image" data-terrain="${t}" data-layer="${i}" data-center-x="${c.x}" href="${terrainCardPrint(t)}" x="${c.x-HEX.tokenWidth/.72/2}" y="${c.y-30-HEX.tokenHeight/.72*.14-i*HEX.layerHeight}" width="${HEX.tokenWidth/.72}" height="${HEX.tokenHeight/.72}"/>`).join('')}${c.cube&&large?`<image class="hm-habitat-model" data-model-card="${id}" href="${animalModelArt(id)}" x="${c.x-24}" y="${capY-55.2*.955}" width="48" height="55.2"/>${cardArt!=='sculpted'&&card.kind?`<g class="hm-paper-model-stars" aria-hidden="true" transform="translate(${c.x-24} ${capY-55.2*.955})"><path d="M7 13l1.3 3.7L12 18l-3.7 1.3L7 23l-1.3-3.7L2 18l3.7-1.3Z"/><path d="M39 2l1 3L43 6l-3 1-1 3-1-3-3-1 3-1Z"/><path d="M40 35l1 2.5 2.5 1-2.5 1L40 42l-1-2.5-2.5-1 2.5-1Z"/></g>`:''}`:c.cube?`<image class="hm-habitat-crystal" data-crystal="${crystalForCard(card)}" data-center-x="${c.x}" href="${crystalArt(id)}" x="${c.x-HEX.cubeWidth/.72/2}" y="${capY-HEX.cubeHeight/.72*.86}" width="${HEX.cubeWidth/.72}" height="${HEX.cubeHeight/.72}"/>`:''}</g>`;}).join('')}${!large?cells.filter(c=>c.displayStack.length>1).map(c=>`<g class="hm-pattern-count" transform="translate(${c.x+24} ${c.y+26})"><rect x="-22" y="-17" width="44" height="32" rx="5" fill="#142a25" stroke="#fff0c7" stroke-width="1"/><text class="hm-pattern-height" x="0" y="8" text-anchor="middle" fill="#fff8dc" font-size="32" font-weight="900">×${c.displayStack.length}</text></g>`).join(''):''}${debugMarkup}</svg></span>`;
}
/** Both art modes use the board's axial projection; no independent CSS 3D bases. */
export function habitatDiagram(id: string, figurine = false, _lightweight = false) {
 return illustratedHabitat(id,figurine);
}
export function cardFace(id: string, placed = 0, large = false, lightweight = harmoniesLowEffects(), showName = true) {
 if(cardArt==='original'&&id in originalArt){const art=originalArt[id as keyof typeof originalArt];return `<span class="hm-animal-art hm-original-art" data-original-card="${id}"><img src="${art.asset}" alt="" width="${art.width}" height="${art.height}" loading="${large?'eager':'lazy'}" decoding="async"></span>`;}
 if(cardArt!=='sculpted'||ANIMAL[id].expansion==='pulse')return paperCardFace(id,placed,large,!large&&lightweight,illustratedHabitat(id,large));return legacyCardFace(id,placed,large,lightweight,showName);
}
function legacyCardFace(id:string,placed:number,large:boolean,lightweight:boolean,showName:boolean){ const c = ANIMAL[id], v5=isV5Card(id),lite=!large&&lightweight, base=animalArt(id),image = large&&v5?base.replace('.webp','-popup.webp'):large?base:base.replace('.webp', lite?'-lite.webp':'-small.webp'),theme=c.animal==='trex'?'dinosaur':c.kind==='spirit'?'spirit':c.kind==='whisper'?'whisper':'normal'; return `${specialCardBadge(id)}<span class="hm-animal-art ${v5?'hm-card-v5':''}" data-card-version="${v5?'v5':'v4'}" data-ui-key="art-${cardArt}-${v5?'cards-v5':'habitat-v4'}-${id}-${lite?'lite':'full'}" data-preserve-content><img src="${image}" data-fallback="/art/harmonies/animals/${id}.webp" alt="" width="${large ? v5?360:720 : cardArt!=='sculpted'?270:240}" height="${cardArt!=='sculpted'?(large?v5?640:1280:480):(large?1040:347)}" loading="${large ? 'eager' : 'lazy'}" decoding="async" onerror="if(this.dataset.fallback){this.srcset='';this.src=this.dataset.fallback;delete this.dataset.fallback}else this.hidden=true"></span>${spiritCardRail(id)}${showName&&large?`<b class="hm-expansion-card-name">${c.name}</b>`:''}${v5?habitatDiagram(id,large,lite):cardArt!=='sculpted'?`<span class="sr-only hm-baked-habitat" data-pattern-card="${id}">${c.pattern.map(p=>p.stack.map(t=>NAMES[t]).join(' / ')+(p.cube?' · วางสัตว์':'')).join(' • ')}</span>`:habitatDiagram(id, large, lite)}${paperScoreTrack(id,placed,large)}`; }
