import { TILE_COLORS, type TileColor } from "../games/azul/types.js";
export const AZUL_TILES: Record<TileColor, string> = {
  blue: "/art/azul/tile-blue.webp", yellow: "/art/azul/tile-yellow.webp",
  red: "/art/azul/tile-red.webp", black: "/art/azul/tile-black.webp", white: "/art/azul/tile-white.webp",
};
export const AZUL_ART = { board: "/art/azul/board-paper.webp", factory: "/art/azul/factory.webp", marker: "/art/azul/first-player.webp", cover: "/art/covers/azul.webp" };
export const azulArtState = { ready: false, missing: [] as string[] };
let loading: Promise<void> | undefined;
export function preloadAzulArt() {
  return loading ??= Promise.all([...TILE_COLORS.map(c => AZUL_TILES[c]), AZUL_ART.board, AZUL_ART.factory, AZUL_ART.marker].map(src => new Promise<void>(resolve => {
    const img = new Image(); img.onload = () => resolve(); img.onerror = () => { azulArtState.missing.push(src); resolve(); }; img.src = src;
  }))).then(() => { azulArtState.ready = true; });
}
