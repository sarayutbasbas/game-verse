import { CARDS, CARD_BY_ID, SHEET, ZONES, RULES_VERSION, ROUNDS, cellKey } from './data.js';
import { scorePlayer } from './scoring.js';
import type { LocusState } from './types.js';
const equal = (a: any, b: any): boolean => a === b || !!a && !!b && typeof a === 'object' && typeof b === 'object' && Array.isArray(a) === Array.isArray(b) && Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(k => Object.prototype.hasOwnProperty.call(b, k) && equal(a[k], b[k]));
const nat = (v: unknown) => Number.isSafeInteger(v) && Number(v) >= 0;
export function validateLocusState(s: any): s is LocusState {
    try {
        if (!s || s.gameId !== 'locus' || s.schema !== 1 || s.rulesVersion !== RULES_VERSION || typeof s.matchId !== 'string' || !['playing', 'finished'].includes(s.phase) || !Array.isArray(s.players) || !ROUNDS[s.players.length] || new Set(s.players.map((p: any) => p.id)).size !== s.players.length)
            return false;
        const n = s.players.length;
        if (!nat(s.first) || s.first >= n || !nat(s.draft) || s.draft > n || !nat(s.extraRounds) || s.targetDeals !== n * (ROUNDS[n] + s.extraRounds) || !nat(s.deal) || s.deal < 1 || s.deal > s.targetDeals || !nat(s.sequence) || !nat(s.effectSerial))
            return false;
        if (!Array.isArray(s.deck) || !Array.isArray(s.discard) || !Array.isArray(s.market) || s.market.length !== n + 1)
            return false;
        const all = [...s.deck, ...s.discard, ...s.market.map((c: any) => c.card)];
        if (all.length !== CARDS.length || new Set(all).size !== CARDS.length || all.some(id => typeof id !== 'string' || !CARDS.some(c => c.id === id)))
            return false;
        const ids = s.players.map((p: any) => p.id);
        if (s.market.some((m: any, i: number) => m.slot !== i + 1 || m.owner !== null && !ids.includes(m.owner)) || s.market.filter((m: any) => m.owner).length !== s.draft || new Set(s.market.filter((m: any) => m.owner).map((m: any) => m.owner)).size !== s.draft)
            return false;
        const effectIds = new Set<string>();
        for (const p of s.players) {
            if (typeof p.id !== 'string' || typeof p.name !== 'string' || ![p.coins, p.gained, p.spent, p.version].every(nat) || p.coins !== 1 + p.gained - p.spent || typeof p.done !== 'boolean' || typeof p.usedRemaining !== 'boolean' || !Array.isArray(p.effects) || !Array.isArray(p.triggered) || new Set(p.triggered).size !== p.triggered.length)
                return false;
            const m = s.market.find((m: any) => m.owner === p.id);
            if (p.picked !== (m?.card ?? null) || p.done && (!p.picked || p.effects.length || s.draft !== n))
                return false;
            const triggered: string[] = [];
            for (const z of ZONES) {
                const a = p.sheet?.[z], board = new Set(SHEET[z].cells.map(([x, y]) => cellKey(x, y)));
                if (!Array.isArray(a) || new Set(a).size !== a.length || a.some((c: any) => typeof c !== 'string' || !board.has(c)))
                    return false;
                for (const c of a)
                    if (SHEET[z].bonuses[c])
                        triggered.push(`${z}:${c}`);
            }
            if (p.triggered.length !== triggered.length || triggered.some(x => !p.triggered.includes(x)))
                return false;
            const bonusSources = new Set<string>();
            for (const e of p.effects) {
                const parts = typeof e.id === 'string' ? e.id.split(':') : [];
                if (parts.length !== 3 || Number(parts[0]) !== s.deal || !nat(Number(parts[1])) || Number(parts[1]) < 1 || Number(parts[1]) > s.effectSerial || parts[2] !== p.id)
                    return false;
                if (typeof e.id !== 'string' || effectIds.has(e.id) || !['main', 'bonus', 'coin', 'remaining'].includes(e.kind) || ![...ZONES, 'wild'].includes(e.color) || !Array.isArray(e.cells) || !e.cells.length || e.cells.length > 5)
                    return false;
                effectIds.add(e.id);
                if (e.kind === 'main' || e.kind === 'remaining') {
                    const c = CARD_BY_ID[e.card];
                    if (!c || JSON.stringify(e.cells) !== JSON.stringify(c.cells) || e.color !== c.color || e.kind === 'main' && e.card !== p.picked || e.kind === 'remaining' && !p.usedRemaining)
                        return false;
                }
                else if (e.kind === 'coin') {
                    if (e.color !== 'wild' || JSON.stringify(e.cells) !== '[[0,0]]' || e.card !== undefined)
                        return false;
                }
                else {
                    if (typeof e.source !== 'string' || !p.triggered.includes(e.source) || bonusSources.has(e.source))
                        return false;
                    bonusSources.add(e.source);
                    const [z, key] = e.source.split(':') as [
                        typeof ZONES[number],
                        string
                    ], b = SHEET[z]?.bonuses[key];
                    if (!b || b.color === 'coin' || b.color !== e.color || JSON.stringify(e.cells) !== JSON.stringify(b.size === 2 ? [[0, 0], [1, 0]] : [[0, 0]]))
                        return false;
                }
            }
        }
        if (!Array.isArray(s.winners) || s.winners.some((id: any) => !ids.includes(id)) || new Set(s.winners).size !== s.winners.length)
            return false;
        if (s.phase === 'playing' && (s.results !== undefined || s.winners.length || s.players.every((p: any) => p.done)))
            return false;
        if (s.phase === 'finished') {
            if (!equal(s.results, s.players.map((p: any) => ({ id: p.id, score: scorePlayer(p) }))))
                return false;
            const scores = s.players.map((p: any) => scorePlayer(p).total), best = Math.max(...scores), expected = s.players.filter((_: any, i: number) => scores[i] === best).map((p: any) => p.id);
            if (s.deal !== s.targetDeals || s.players.some((p: any) => !p.done) || expected.length !== s.winners.length || expected.some((id: string) => !s.winners.includes(id)))
                return false;
        }
        if (!s.event || !['setup', 'pick', 'mark', 'coin', 'discard', 'skip', 'done', 'deal', 'finish', 'extra'].includes(s.event.kind) || s.event.actor !== undefined && !ids.includes(s.event.actor))
            return false;
        if (s.event.cells !== undefined && (!Array.isArray(s.event.cells) || s.event.cells.some((c: any) => !ZONES.includes(c.zone) || !SHEET[c.zone as typeof ZONES[number]].cells.some(([x, y]) => x === c.x && y === c.y))))
            return false;
        return true;
    }
    catch {
        return false;
    }
}
