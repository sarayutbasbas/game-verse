import { SUIT_NAME, type Suit } from "../games/dracula-vs-van-helsing/types.js";
export const DUEL_ART = {
  map: "/art/dracula/city.webp",
  districts: "/art/dracula/districts.svg",
  red: "/art/dracula/suits/red.svg",
  yellow: "/art/dracula/suits/yellow.svg",
  green: "/art/dracula/suits/green.svg",
  purple: "/art/dracula/suits/purple.svg",
  roles: "/art/dracula/roles.webp",
  cards: "/art/dracula/card-portraits.webp",
  back: "/art/dracula/card-back.webp",
  markers: "/art/dracula/markers.webp",
};
export function portrait(value: number) {
  const i = value - 1;
  return `<span class="duel-portrait" aria-hidden="true" style="--portrait-x:${((i % 4) / 3) * 100}%;--portrait-y:${Math.floor(i / 4) * 100}%"></span>`;
}
export function rolePortrait(role: "dracula" | "helsing") {
  return `<span class="role-portrait role-${role}" aria-hidden="true"></span>`;
}
export function marker(kind: "human" | "vampire" | "heart" | "ship") {
  return `<span class="duel-marker marker-${kind}" aria-hidden="true"></span>`;
}
export async function preloadDuelArt() {
  await Promise.all(
    Object.values(DUEL_ART).map(
      (src) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () =>
            reject(Error("โหลดภาพเกมไม่ครบ กรุณาลองโหลดหน้าใหม่"));
          img.src = src;
        }),
    ),
  );
}
export function effectIcon(value: number) {
  const paths: Record<number, string> = {
    1: '<path d="M3 12s4-6 9-6 9 6 9 6-4 6-9 6-9-6-9-6Z"/><circle cx="12" cy="12" r="2.5"/>',
    2: '<path d="M5 5h14v14H5zM3 3h14M7 21h14M8 11s2-3 4-3 4 3 4 3-2 3-4 3-4-3-4-3Z"/>',
    3: '<path d="M3 12s4-6 9-6 9 6 9 6-4 6-9 6-9-6-9-6Z"/><path d="m9 12 3-3 3 3-3 3Z"/>',
    4: '<path d="M3 7h17m-4-4 4 4-4 4M21 17H4m4-4-4 4 4 4"/>',
    5: '<path d="M5 8a8 8 0 1 1-1 8M3 3v6h6"/>',
    6: '<path d="M3 3h6v7H3zM15 14h6v7h-6zM12 6h8l-3-3M12 18H4l3 3M20 6v5M4 18v-5"/>',
    7: '<path d="m12 3 3 6 6 1-4 5 1 6-6-3-6 3 1-6-4-5 6-1Z"/>',
    8: '<path d="M3 18h18l-4 4H7zM12 3v15M13 4l7 11h-7M10 6 4 15h6"/>',
  };
  return `<svg class="effect-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[value]}</svg>`;
}

/** Painted vector symbols bypass platform emoji/text glyph substitution. */
export function suitIcon(suit: Suit) {
  return `<img class="duel-suit-icon" src="${DUEL_ART[suit]}" width="24" height="24" alt="" aria-hidden="true">`;
}
export function suitLabel(suit: Suit) {
  return `${suitIcon(suit)}<span class="suit-word">${SUIT_NAME[suit].split(" ")[0]}</span>`;
}
