// Rule data transcribed from AEG/Flatout Games 2020 rulebook, pp.4–9.
export const COLORS = [
  "blue",
  "cyan",
  "green",
  "yellow",
  "magenta",
  "purple",
] as const;
export const PATTERNS = [
  "dots",
  "stripes",
  "flowers",
  "vines",
  "quatrefoil",
  "swirls",
] as const;
export type Color = (typeof COLORS)[number];
export type Pattern = (typeof PATTERNS)[number];
export type Hex = { q: number; r: number };
export type Patch = { id: string; color: Color; pattern: Pattern };
export const key = (h: Hex) => `${h.q},${h.r}`;
export const DIRECTIONS: readonly Hex[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];
export const neighbors = (h: Hex) =>
  DIRECTIONS.map((d) => ({ q: h.q + d.q, r: h.r + d.r }));
// Flat-top even-q offset coordinates. Rendering uses this same axial conversion.
export const fromOffset = (q: number, row: number): Hex => ({
  q,
  r: row - Math.floor((q + 1) / 2),
});
export const toOffset = (h: Hex) => ({
  q: h.q,
  row: h.r + Math.floor((h.q + 1) / 2),
});
export const CELLS = Array.from({ length: 25 }, (_, i) =>
  fromOffset(i % 5, Math.floor(i / 5)),
);
export const GOAL_CELLS = [
  [1, 1],
  [3, 2],
  [2, 3],
].map(([q, row]) => fromOffset(q, row));
export const PATCH_CELLS = CELLS.filter(
  (h) => !GOAL_CELLS.some((g) => key(g) === key(h)),
);
export const GOALS = {
  different: { label: "≠", counts: [1, 1, 1, 1, 1, 1], one: 10, both: 15 },
  triples: { label: "AAA–BBB", counts: [3, 3], one: 8, both: 13 },
  pairs: { label: "AA–BB–CC", counts: [2, 2, 2], one: 7, both: 11 },
  four: { label: "AAAA–BB", counts: [4, 2], one: 8, both: 14 },
  three: { label: "AAA–BB–C", counts: [3, 2, 1], one: 7, both: 11 },
  two: { label: "AA–BB–C–D", counts: [2, 2, 1, 1], one: 5, both: 8 },
} as const;
export type GoalId = keyof typeof GOALS;
const line = (n: number) => Array.from({ length: n }, (_, q) => ({ q, r: 0 }));
export const CATS = {
  millie: { name: "Millie", points: 3, group: 1, size: 3 },
  callie: {
    name: "Callie",
    points: 3,
    group: 1,
    shape: [
      { q: 0, r: 0 },
      { q: 1, r: 0 },
      { q: 0, r: 1 },
    ],
  },
  tibbit: { name: "Tibbit", points: 5, group: 1, size: 4 },
  rumi: {
    name: "Rumi",
    points: 5,
    group: 1,
    shape: [
      { q: 0, r: 0 },
      { q: 1, r: 0 },
      { q: 2, r: 0 },
      { q: 1, r: -1 },
    ],
  },
  coconut: { name: "Coconut", points: 7, group: 2, size: 5 },
  tecolote: { name: "Tecolote", points: 7, group: 2, shape: line(4) },
  cira: { name: "Cira", points: 9, group: 2, size: 6 },
  almond: {
    name: "Almond",
    points: 9,
    group: 2,
    shape: [
      { q: 0, r: 0 },
      { q: 1, r: 0 },
      { q: 2, r: 0 },
      { q: 1, r: -1 },
      { q: 2, r: -1 },
    ],
  },
  gwenivere: { name: "Gwenivere", points: 11, group: 3, size: 7 },
  leo: { name: "Leo", points: 11, group: 3, shape: line(5) },
} satisfies Record<
  string,
  { name: string; points: number; group: number; size?: number; shape?: Hex[] }
>;
export type CatId = keyof typeof CATS;
export const CAT_PAIRS: readonly (readonly CatId[])[] = [
  ["millie", "callie"],
  ["tibbit", "rumi"],
  ["coconut", "tecolote"],
  ["cira", "almond"],
  ["gwenivere", "leo"],
];
export const rotate = (h: Hex): Hex => ({ q: -h.r, r: h.q + h.r });
export function hasShape(cells: Hex[], shape: readonly Hex[]) {
  const occupied = new Set(cells.map(key));
  let rotated = shape.map((h) => ({ ...h }));
  for (let i = 0; i < 6; i++) {
    for (const anchor of cells) {
      const origin = rotated[0];
      if (
        rotated.every((h) =>
          occupied.has(
            key({ q: anchor.q + h.q - origin.q, r: anchor.r + h.r - origin.r }),
          ),
        )
      )
        return true;
    }
    rotated = rotated.map(rotate);
  }
  return false;
}
// Two printed quilt layouts shown in the publisher's 2-player setup illustration.
// Clockwise perimeter: top five, right seven (including corners), bottom five,
// left seven. Printed tiles are not drawn from the 108-tile bag.
const borderA = [
  "yellow:dots",
  "purple:stripes",
  "cyan:vines",
  "blue:quatrefoil",
  "green:flowers",
  "magenta:swirls",
  "yellow:stripes",
  "cyan:swirls",
  "magenta:vines",
  "purple:quatrefoil",
  "yellow:flowers",
  "green:stripes",
  "blue:dots",
  "purple:swirls",
  "yellow:vines",
  "green:quatrefoil",
  "blue:flowers",
  "cyan:stripes",
  "magenta:dots",
  "green:swirls",
  "blue:vines",
  "magenta:flowers",
  "cyan:quatrefoil",
  "purple:dots",
];
const borderB = [
  "blue:swirls",
  "cyan:flowers",
  "magenta:vines",
  "green:stripes",
  "blue:quatrefoil",
  "purple:dots",
  "yellow:swirls",
  "green:flowers",
  "blue:vines",
  "purple:stripes",
  "yellow:quatrefoil",
  "purple:vines",
  "cyan:dots",
  "magenta:swirls",
  "green:vines",
  "blue:stripes",
  "cyan:quatrefoil",
  "yellow:flowers",
  "magenta:dots",
  "purple:flowers",
  "yellow:vines",
  "cyan:stripes",
  "magenta:quatrefoil",
  "green:dots",
];
// Yellow/green boards: visually transcribed from clear component photographs,
// cross-checked against the user's four-board reference; normalized clockwise.
const borderYellow = [
  "blue:quatrefoil",
  "green:flowers",
  "yellow:dots",
  "purple:swirls",
  "magenta:vines",
  "green:quatrefoil",
  "blue:flowers",
  "yellow:stripes",
  "purple:dots",
  "blue:swirls",
  "green:vines",
  "magenta:quatrefoil",
  "cyan:flowers",
  "blue:stripes",
  "green:dots",
  "magenta:swirls",
  "cyan:vines",
  "yellow:quatrefoil",
  "purple:flowers",
  "magenta:stripes",
  "cyan:dots",
  "yellow:swirls",
  "purple:vines",
  "cyan:swirls",
];
const borderGreen = [
  "purple:swirls",
  "yellow:flowers",
  "cyan:stripes",
  "magenta:quatrefoil",
  "purple:dots",
  "blue:vines",
  "yellow:swirls",
  "green:vines",
  "blue:stripes",
  "purple:quatrefoil",
  "yellow:dots",
  "cyan:swirls",
  "magenta:flowers",
  "purple:vines",
  "yellow:stripes",
  "cyan:quatrefoil",
  "magenta:dots",
  "green:swirls",
  "blue:flowers",
  "cyan:vines",
  "magenta:stripes",
  "green:quatrefoil",
  "blue:dots",
  "green:stripes",
];
export const BOARD_NAMES = [
  "ขอบฟ้า",
  "ขอบม่วง",
  "ขอบเหลือง",
  "ขอบเขียว",
] as const;
export const BORDER_CELLS = [
  ...Array.from({ length: 5 }, (_, q) => fromOffset(q, -1)),
  ...Array.from({ length: 7 }, (_, i) => fromOffset(5, i - 1)),
  ...Array.from({ length: 5 }, (_, i) => fromOffset(4 - i, 5)),
  ...Array.from({ length: 7 }, (_, i) => fromOffset(-1, 5 - i)),
];
export function printedBorder(board: number): Record<string, Patch> {
  return Object.fromEntries(
    BORDER_CELLS.map((h, i) => {
      const [color, pattern] = [borderA, borderB, borderYellow, borderGreen][
        board
      ][i].split(":") as [Color, Pattern];
      const cell =
        board !== 1 ? h : fromOffset(4 - toOffset(h).q, 4 - toOffset(h).row);
      return [key(cell), { id: `border-${board}-${i}`, color, pattern }];
    }),
  );
}
