import { SHEET, cellKey, type Zone } from '../src/games/locus/data.js';
import { getPlayerView, placements, decisionKey } from '../src/games/locus/engine.js';
import type { LocusState, LocusAction } from '../src/games/locus/types.js';
export function seeded(seed: number) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
export function botAction(s: LocusState, id: string): LocusAction | null {
    const p = s.players.find(p => p.id === id)!, l = getPlayerView(s, id).legal, epoch = decisionKey(s, id);
    if (p.effects.length) {
        const e = p.effects[0], all = placements(p, e);
        const value = (a: typeof all[number]) => { const d = SHEET[a.zone]; return (a.wild ? -5 : 0) + d.cells.filter(([x, y]) => x >= a.x && x < a.x + 3 && y >= a.y && y < a.y + 3 && d.bonuses[cellKey(x, y)] && !p.triggered.includes(`${a.zone}:${x},${y}`)).length * 2 + (a.zone === 'blue' ? (22 - a.y) * .02 : 0); };
        all.sort((a, b) => value(b) - value(a));
        return all[0] ? { type: 'locus-place', effect: e.id, epoch, ...all[0] } : { type: e.kind === 'main' ? 'locus-discard' : 'locus-skip', effect: e.id, epoch };
    }
    if (l.picks.length)
        return { type: 'locus-pick', epoch, slot: l.picks[0] };
    if (l.buy)
        return { type: 'locus-buy', epoch };
    if (l.done) {
        if (p.coins >= 2 && placements(p, { id: 'test', kind: 'coin', color: 'wild', cells: [[0, 0]] }).length)
            return { type: 'locus-coin-blocks', epoch };
        return { type: 'locus-done', epoch };
    }
    return null;
}
