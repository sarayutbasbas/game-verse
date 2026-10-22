import type {Terrain} from '../games/harmonies/types.js';
let style:'illustrated'|'sculpted'='illustrated';
export function setHarmoniesTokenArt(value:'illustrated'|'sculpted'){style=value;}
export const terrainPrint=(terrain:Terrain)=>style==='illustrated'?`/art/harmonies/tokens-soft-v1/${terrain}.svg`:`/art/harmonies/tokens-v5/${terrain}.png?v=geometry-3`;

/** Precolored raster avoids SVG filter rasterization at tiny picker sizes. */
export const terrainPickerPrint=(terrain:Terrain)=>style==='illustrated'?`/art/harmonies/tokens-soft-v1/${terrain}.png`:`/art/harmonies/tokens-v5/${terrain}.png?v=geometry-3`;

/** SVG card diagrams embed precolored pixels directly, avoiding nested filtered-SVG rasterization. */
export const terrainCardPrint=(terrain:Terrain)=>terrainPickerPrint(terrain);
