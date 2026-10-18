import { cylinder, animalFigure } from './harmonies-presentation.js';
import { NAMES } from '../games/harmonies/data.js';
import type { Terrain } from '../games/harmonies/types.js';

/** The board's same caps and baked figurines, composed once into a small static scene. */
export function terrainScene(stack: Terrain[], animal?: string) {
    return `<span class="hm-mini-scene" role="img" aria-label="${stack.map(t=>NAMES[t]).join(' / ')}${animal?' และสัตว์':''}"><span class="hm-mini-plane"><span class="hm-mini-tile"></span>${stack.map((t,i)=>cylinder(t,i,false,undefined,true,i>0&&t===stack[i-1])).join('')}</span>${animal?`<span class="hm-mini-animal">${animalFigure(animal,0,false,true)}</span>`:''}</span>`;
}
