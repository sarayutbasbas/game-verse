export const ZONES = ['yellow', 'purple', 'red', 'green', 'blue'] as const;
export type Zone = typeof ZONES[number];
export type Ink = Zone | 'wild';
export type XY = readonly [
    number,
    number
];
export const LABEL: Record<Ink, string> = { yellow: 'เหลือง', purple: 'ม่วง', red: 'แดง', green: 'เขียว', blue: 'ฟ้า', wild: 'รุ้ง' };
export const INK: Record<Ink, string> = { yellow: '#e7bc16', purple: '#9459a3', red: '#e96062', green: '#79ac3b', blue: '#279bd0', wild: '#35465a' };
export const RULES_VERSION = 'tucker-base-2024-en-v1';
export const ROUNDS: Record<number, number> = { 2: 8, 3: 5, 4: 4, 5: 3 };
export const cellKey = (x: number, y: number) => `${x},${y}`;
const grid = (w: number, h: number): XY[] => Array.from({ length: w * h }, (_, i) => [i % w, Math.floor(i / w)]);
const rows = (rs: number[][]): XY[] => rs.flatMap((xs, y) => xs.map(x => [x, y] as XY));
export interface Bonus {
    color: Ink | 'coin';
    size: 1 | 2;
}
export interface SheetZone {
    width: number;
    height: number;
    cells: XY[];
    starts: XY[];
    bonuses: Record<string, Bonus>;
    groups?: {
        cells: XY[];
        score: number;
    }[];
    ends?: XY[];
    rowScores?: number[];
    tiers?: [
        number,
        number
    ][];
}
const bonuses = (r: [
    number,
    number,
    Ink | 'coin'
][]): Record<string, Bonus> => Object.fromEntries(r.map(([x, y, color]) => [cellKey(x, y), { color, size: color === 'coin' || color === 'wild' ? 1 : 2 }]));
const redGroups = [
    { cells: rows([[0, 1, 2], [0, 1], [1, 2]]), score: 12 },
    { cells: rows([[4, 5], [4, 5], [4, 5, 6]]), score: 12 },
    { cells: rows([[], [], [], [], [2], [0, 1, 2], [1, 2], [1, 2]]), score: 14 },
    { cells: rows([[], [], [], [], [4, 6], [4, 5, 6], [4, 5, 6], [4]]), score: 16 },
];
/** Logical coordinates transcribed from the publisher's full-size sheet, not image hit testing. */
export const SHEET: Record<Zone, SheetZone> = {
    yellow: { width: 6, height: 6, cells: grid(6, 6), starts: grid(6, 1).map(([x]) => [x, 5]), rowScores: [12, 12, 12, 10, 10, 8], bonuses: bonuses([[2, 0, 'purple'], [5, 0, 'coin'], [0, 1, 'wild'], [4, 2, 'blue'], [1, 3, 'green'], [5, 4, 'red'], [3, 5, 'coin']]) },
    purple: { width: 7, height: 7, cells: grid(7, 7), starts: [[0, 0], [6, 0], [3, 1], [1, 3], [5, 3], [3, 5], [0, 6], [6, 6]], bonuses: bonuses([[5, 0, 'coin'], [1, 1, 'yellow'], [6, 2, 'red'], [3, 3, 'blue'], [5, 4, 'wild'], [0, 5, 'green'], [3, 6, 'coin']]) },
    red: { width: 7, height: 8, cells: redGroups.flatMap(g => g.cells), starts: [], groups: redGroups, bonuses: bonuses([[0, 1, 'yellow'], [4, 0, 'coin'], [6, 2, 'wild'], [0, 5, 'purple'], [2, 7, 'coin'], [4, 4, 'blue'], [6, 6, 'green']]) },
    green: { width: 7, height: 9, cells: rows([[3, 4], [0, 1, 4, 6], [1, 4, 5, 6], [0, 1, 2, 3, 4], [0, 3], [0, 3, 4, 5], [2, 3, 5, 6], [0, 1, 2, 6], [2, 3]]), starts: [[3, 4]], ends: [[3, 0], [0, 1], [6, 1], [0, 5], [0, 7], [3, 8], [6, 7]], bonuses: bonuses([[1, 2, 'red'], [6, 2, 'yellow'], [4, 3, 'coin'], [0, 4, 'wild'], [5, 5, 'purple'], [3, 6, 'coin'], [1, 7, 'blue']]) },
    blue: { width: 3, height: 22, cells: grid(3, 22), starts: [[0, 21], [1, 21], [2, 21]], tiers: [[17, 8], [13, 16], [9, 24], [6, 32], [3, 40], [0, 50]], bonuses: bonuses([[0, 1, 'red'], [2, 4, 'purple'], [1, 7, 'wild'], [0, 10, 'coin'], [2, 12, 'green'], [0, 15, 'yellow'], [1, 19, 'coin']]) },
};
export interface ShapeCard {
    id: string;
    color: Ink;
    cells: XY[];
    coin: boolean;
    row: number;
}
/** Reference card: eight rows × six inks. Rainbow shapes differ from the five other colors. */
const normalShapes: XY[][] = [
    [[0, 0], [1, 0], [0, 1], [0, 2], [1, 2]],
    [[1, 0], [1, 1], [0, 2], [1, 2], [2, 2]],
    [[1, 0], [2, 0], [1, 1], [0, 2], [1, 2]],
    [[2, 0], [1, 1], [2, 1], [0, 2], [1, 2]],
    [[1, 0], [1, 1], [2, 1], [0, 2], [1, 2]],
    [[2, 0], [2, 1], [0, 2], [1, 2], [2, 2]],
    [[0, 0], [0, 1], [0, 2]], [[1, 0], [0, 1], [1, 1]],
];
const rainbowShapes: XY[][] = [
    [[0, 0], [0, 1], [1, 1], [0, 2]], [[0, 0], [0, 1], [1, 1], [0, 2]],
    [[0, 0], [0, 1], [0, 2], [1, 2]], [[0, 0], [0, 1], [0, 2], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [0, 2]], [[1, 0], [0, 1], [1, 1], [0, 2]],
    [[0, 0], [0, 1]], [[0, 0], [0, 1]],
];
export const CARDS: ShapeCard[] = Array.from({ length: 8 }, (_, row) => ([...ZONES, 'wild'] as Ink[]).map((color, i) => ({ id: `lc-${row + 1}-${i + 1}`, color, cells: (color === 'wild' ? rainbowShapes : normalShapes)[row], coin: row >= 6, row }))).flat();
export const CARD_BY_ID = Object.fromEntries(CARDS.map(c => [c.id, c])) as Record<string, ShapeCard>;
export function transform(cells: readonly XY[], rotation: number, mirror: boolean): XY[] { const a = cells.map(([x, y]) => { let px = mirror ? -x : x, py = y; for (let i = 0; i < rotation; i++)
    [px, py] = [-py, px]; return [px, py] as XY; }); const minX = Math.min(...a.map(p => p[0])), minY = Math.min(...a.map(p => p[1])); return a.map(([x, y]) => [x - minX, y - minY] as XY).sort((a, b) => a[1] - b[1] || a[0] - b[0]); }
export function orientations(cells: readonly XY[]) { const seen = new Set<string>(); return [false, true].flatMap(mirror => [0, 1, 2, 3].flatMap(rotation => { const shape = transform(cells, rotation, mirror), key = JSON.stringify(shape); if (seen.has(key))
    return []; seen.add(key); return [{ rotation, mirror, cells: shape }]; })); }
