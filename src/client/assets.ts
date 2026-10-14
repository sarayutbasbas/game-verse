import type { Camel } from "../shared/types.js";
export const ART = {
  camels: "/art/camels.webp",
  objects: "/art/objects.webp",
  avatars: "/art/avatars.webp",
  table: "/art/table.webp",
  board: "/art/board.svg",
};
export const CAMEL_CELL: Record<Camel, number> = {
  blue: 0,
  green: 1,
  yellow: 2,
  purple: 3,
  red: 4,
  black: 5,
  white: 6,
};
export const SYMBOL: Record<Camel, string> = {
  blue: "◆",
  green: "✦",
  yellow: "☀",
  purple: "☾",
  red: "♥",
  black: "♠",
  white: "✧",
};
export function sprite(
  sheet: "camels" | "objects" | "avatars",
  cell: number,
  extra = "",
) {
  const cols = sheet === "avatars" ? 4 : 3,
    rows = sheet === "camels" ? 3 : 2;
  return `<span aria-hidden="true" class="art-sprite ${sheet} ${extra}" style="--sx:${((cell % cols) / (cols - 1)) * 100}%;--sy:${(Math.floor(cell / cols) / (rows - 1)) * 100}%"></span>`;
}
export async function preloadArt() {
  await Promise.all(
    Object.values(ART).map(
      (src) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => reject(Error(`โหลด artwork ไม่ได้: ${src}`));
          img.src = src;
        }),
    ),
  );
}
