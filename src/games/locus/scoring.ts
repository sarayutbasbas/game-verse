import { SHEET, ZONES, cellKey, type Zone } from './data.js';
import type { Player, Score } from './types.js';
export function components(cells: Set<string>) { const todo = new Set(cells), groups: Set<string>[] = []; while (todo.size) {
    const start = todo.values().next().value!;
    todo.delete(start);
    const found = new Set([start]), queue = [start];
    for (let i = 0; i < queue.length; i++) {
        const [x, y] = queue[i].split(',').map(Number);
        for (const key of [cellKey(x - 1, y), cellKey(x + 1, y), cellKey(x, y - 1), cellKey(x, y + 1)])
            if (todo.delete(key)) {
                found.add(key);
                queue.push(key);
            }
    }
    groups.push(found);
} return groups; }
export function scoreYellow(marked: Set<string>) { const rows = SHEET.yellow.rowScores!.flatMap((_, y) => SHEET.yellow.cells.filter(c => c[1] === y).every(([x, y]) => marked.has(cellKey(x, y))) ? [y] : []); return { score: rows.reduce((n, y) => n + SHEET.yellow.rowScores![y], 0), rows }; }
export function scorePurple(marked: Set<string>) { const bold = new Set(SHEET.purple.starts.map(([x, y]) => cellKey(x, y))), connected = Math.max(0, ...components(marked).map(g => [...g].filter(c => bold.has(c)).length)); return { score: connected >= 2 ? connected * 6 : 0, connected }; }
export function scoreRed(marked: Set<string>) { const groups = SHEET.red.groups!.flatMap((g, i) => g.cells.every(([x, y]) => marked.has(cellKey(x, y))) ? [i] : []); return { score: groups.reduce((n, i) => n + SHEET.red.groups![i].score, 0), groups }; }
export function scoreGreen(marked: Set<string>) { const network = components(marked).find(c => c.has('3,4')) ?? new Set<string>(), ends = SHEET.green.ends!.map(([x, y]) => cellKey(x, y)).filter(c => network.has(c)); return { score: ends.length * 8, ends }; }
export function scoreBlue(marked: Set<string>) { const row = marked.size ? Math.min(...[...marked].map(c => Number(c.split(',')[1]))) : null; return { score: row === null ? 0 : Math.max(0, ...SHEET.blue.tiers!.filter(([y]) => row <= y).map(([, score]) => score)), row }; }
export function scorePlayer(p: Pick<Player, 'sheet'>): Score {
    const sets = Object.fromEntries(ZONES.map(z => [z, new Set(p.sheet[z])])) as Record<Zone, Set<string>>;
    const y = scoreYellow(sets.yellow), ppl = scorePurple(sets.purple), r = scoreRed(sets.red), g = scoreGreen(sets.green), b = scoreBlue(sets.blue);
    const lowest = Math.min(y.score, ppl.score, r.score, g.score, b.score);
    return { yellow: y.score, purple: ppl.score, red: r.score, green: g.score, blue: b.score, lowest, total: y.score + ppl.score + r.score + g.score + b.score + lowest, details: { yellowRows: y.rows, purpleConnected: ppl.connected, redGroups: r.groups, greenEnds: g.ends, blueRow: b.row } };
}
