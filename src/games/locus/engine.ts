import { CARDS, CARD_BY_ID, SHEET, ZONES, ROUNDS, RULES_VERSION, cellKey, transform, orientations, type Zone, type XY } from './data.js';
import { scorePlayer } from './scoring.js';
import type { LocusState, LocusAction, LocusView, Player, Effect, DisplayMode } from './types.js';
export function shuffle<T>(a: T[], random: () => number) { for (let i = a.length - 1; i > 0; i--) {
    const r = random();
    if (!Number.isFinite(r) || r < 0 || r >= 1)
        throw Error('แหล่งสุ่มไม่ถูกต้อง');
    const j = Math.floor(r * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
} return a; }
export function emptyPlayer(id: string, name: string): Player { return { id, name, sheet: Object.fromEntries(ZONES.map(z => [z, [] as string[]])) as Record<Zone, string[]>, coins: 1, gained: 0, spent: 0, effects: [], triggered: [], picked: null, usedRemaining: false, done: false, version: 0 }; }
export function createInitialState(seats: {
    id: string;
    name: string;
}[], random: () => number = Math.random, starter?: string): LocusState {
    if (!ROUNDS[seats.length] || new Set(seats.map(p => p.id)).size !== seats.length)
        throw Error('Locus ต้องมีผู้เล่น 2–5 คน');
    if (starter && !seats.some(p => p.id === starter))
        throw Error('ไม่พบผู้เริ่มเล่น');
    const s: LocusState = { gameId: 'locus', schema: 1, rulesVersion: RULES_VERSION, matchId: 'fixture', players: seats.map(p => emptyPlayer(p.id, p.name)), deck: shuffle(CARDS.map(c => c.id), random), discard: [], market: [], first: starter ? seats.findIndex(p => p.id === starter) : 0, draft: 0, deal: 1, targetDeals: seats.length * ROUNDS[seats.length], extraRounds: 0, phase: 'playing', sequence: 0, effectSerial: 0, event: { kind: 'setup' }, winners: [] };
    deal(s, random);
    return s;
}
function deal(s: LocusState, random: () => number) { s.market = []; for (let i = 0; i <= s.players.length; i++) {
    if (!s.deck.length) {
        s.deck = shuffle(s.discard.splice(0), random);
    }
    const card = s.deck.pop();
    if (!card)
        throw Error('สำรับไม่ครบ');
    s.market.push({ slot: i + 1, card, owner: null });
} s.draft = 0; for (const p of s.players) {
    p.picked = null;
    p.done = false;
    p.usedRemaining = false;
    p.effects = [];
} }
const own = (s: LocusState, id: string) => { const p = s.players.find(p => p.id === id); if (!p)
    throw Error('ไม่พบผู้เล่น'); return p; };
export const decisionKey = (s: LocusState, id: string) => `${s.matchId}:${s.deal}:${own(s, id).version}`;
export const isFinished = (s: LocusState) => s.phase === 'finished';
export function turn(s: LocusState) { return s.phase === 'playing' && s.draft < s.players.length ? s.players[(s.first + s.draft) % s.players.length].id : null; }
const active = (s: LocusState, p: Player) => s.phase === 'playing' && !p.done && (!!p.picked || turn(s) === p.id);
function effect(s: LocusState, p: Player, kind: Effect['kind'], color: Effect['color'], cells: XY[], card?: string, source?: string) { const e: Effect = { id: `${s.deal}:${++s.effectSerial}:${p.id}`, kind, color, cells: structuredClone(cells), ...card ? { card } : {}, ...source ? { source } : {} }; p.effects.push(e); return e; }
function gain(p: Player, n: number) { p.coins += n; p.gained += n; }
function pay(p: Player, n: number) { if (p.coins < n)
    throw Error('เหรียญไม่พอ'); p.coins -= n; p.spent += n; }
/** Shared preview validation; server runs the same check on the authoritative sheet. */
export function placementError(p: Pick<Player, 'sheet' | 'coins'>, e: Effect, zone: Zone, x: number, y: number, rotation: number, mirror: boolean, wild = false): string {
    if (!ZONES.includes(zone) || !Number.isSafeInteger(x) || !Number.isSafeInteger(y) || ![0, 1, 2, 3].includes(rotation) || typeof mirror !== 'boolean' || typeof wild !== 'boolean')
        return 'ตำแหน่งหรือมุมไม่ถูกต้อง';
    if (e.color !== 'wild' && e.color !== zone && (!wild || p.coins < 1))
        return 'ใช้ 1 เหรียญเพื่อเปลี่ยนสี';
    const cells = transform(e.cells, rotation, mirror).map(([dx, dy]) => cellKey(x + dx, y + dy)), board = new Set(SHEET[zone].cells.map(([x, y]) => cellKey(x, y))), marked = new Set(p.sheet[zone]);
    if (cells.some(c => !board.has(c)))
        return 'รูปทรงต้องอยู่ในพื้นที่ทั้งหมด';
    if (cells.some(c => marked.has(c)))
        return 'ทับช่องที่กากบาทแล้วไม่ได้';
    if (zone !== 'red' && !cells.some(c => SHEET[zone].starts.some(([x, y]) => c === cellKey(x, y)) || (() => { const [x, y] = c.split(',').map(Number); return [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([x, y]) => marked.has(cellKey(x, y))); })()))
        return 'ต้องทับช่องเริ่มต้นหรือติดช่องที่กากบาทแล้ว';
    return '';
}
export function placements(p: Player, e: Effect) { return ZONES.flatMap(zone => orientations(e.cells).flatMap(o => SHEET[zone].cells.flatMap(([x, y]) => !placementError(p, e, zone, x, y, o.rotation, o.mirror, e.color !== 'wild' && e.color !== zone) ? [{ zone, x, y, rotation: o.rotation, mirror: o.mirror, wild: e.color !== 'wild' && e.color !== zone }] : []))); }
export function getPlayerView(s: LocusState, id: string) { const p = own(s, id), can = active(s, p); return { id, legal: { epoch: decisionKey(s, id), picks: turn(s) === id ? s.market.filter(c => !c.owner).map(c => c.slot) : [], coinBlocks: can && p.coins >= 2, buy: can && s.draft === s.players.length && !p.usedRemaining && p.coins >= 3, done: can && s.draft === s.players.length && !!p.picked && !p.effects.length, effects: structuredClone(p.effects) } }; }
export function getLegalActions(s: LocusState, id: string): LocusAction[] { const l = getPlayerView(s, id).legal, epoch = l.epoch, p = own(s, id); if (!active(s, p))
    return []; return [...l.picks.map(slot => ({ type: 'locus-pick' as const, slot, epoch })), ...p.effects.flatMap(e => [...placements(p, e).map(a => ({ type: 'locus-place' as const, effect: e.id, epoch, ...a })), { type: e.kind === 'main' ? 'locus-discard' as const : 'locus-skip' as const, effect: e.id, epoch }]), ...l.coinBlocks ? [{ type: 'locus-coin-blocks' as const, epoch }] : [], ...l.buy ? [{ type: 'locus-buy' as const, epoch }] : [], ...l.done ? [{ type: 'locus-done' as const, epoch }] : []]; }
export function getDisplayView(s: LocusState, code: string, revision: number, defaultMode: DisplayMode = 'shared-table'): LocusView { return { gameId: 'locus', code, revision, phase: s.phase, sequence: s.sequence, matchId: s.matchId, defaultMode, players: s.players.map(p => ({ id: p.id, name: p.name, sheet: structuredClone(p.sheet), coins: p.coins, score: structuredClone(s.results?.find(r => r.id === p.id)?.score ?? scorePlayer(p)), effects: structuredClone(p.effects), done: p.done, picked: p.picked, version: p.version })), market: s.market.map(c => ({ ...c, card: structuredClone(CARD_BY_ID[c.card]) })), turn: turn(s), first: s.players[s.first].id, deal: s.deal, round: Math.ceil(s.deal / s.players.length), rounds: s.targetDeals / s.players.length, turnInRound: (s.deal - 1) % s.players.length + 1, remaining: s.deck.length, discardCount: s.discard.length, winners: [...s.winners], event: structuredClone(s.event) }; }
function finish(s: LocusState) { s.phase = 'finished'; s.results = s.players.map(p => ({ id: p.id, score: scorePlayer(p) })); const max = Math.max(...s.players.map(p => scorePlayer(p).total)); s.winners = s.players.filter(p => scorePlayer(p).total === max).map(p => p.id); s.event = { kind: 'finish' }; }
export function extendTiedRound(state: LocusState, random: () => number = Math.random) { if (state.phase !== 'finished' || state.winners.length < 2)
    throw Error('ต่อรอบได้เมื่อคะแนนเสมอเท่านั้น'); const s = structuredClone(state); s.targetDeals += s.players.length; s.extraRounds++; s.phase = 'playing'; s.winners = []; delete s.results; s.discard.push(...s.market.map(c => c.card)); s.deal++; s.first = (s.first + 1) % s.players.length; deal(s, random); s.event = { kind: 'extra' }; s.sequence++; return s; }
export function applyAction(state: LocusState, id: string, a: LocusAction, random: () => number = Math.random): LocusState {
    if (!a || typeof a !== 'object' || state.phase !== 'playing')
        throw Error('เกมจบแล้วหรือคำสั่งไม่ถูกต้อง');
    const original = own(state, id);
    if (a.epoch !== decisionKey(state, id))
        throw Error('ตัวเลือกนี้หมดอายุแล้ว');
    if (!active(state, original))
        throw Error('ยังไม่ถึงตาของคุณหรือจบตาแล้ว');
    const fields: Record<string, string[]> = { 'locus-pick': ['slot'], 'locus-place': ['effect', 'zone', 'x', 'y', 'rotation', 'mirror', 'wild'], 'locus-discard': ['effect'], 'locus-skip': ['effect'], 'locus-coin-blocks': [], 'locus-buy': [], 'locus-done': [] };
    const f = fields[a.type];
    if (!f || Object.keys(a).sort().join(',') !== ['type', 'epoch', ...f].sort().join(','))
        throw Error('รูปแบบคำสั่งไม่ถูกต้อง');
    const s = structuredClone(state), p = own(s, id), l = getPlayerView(s, id).legal;
    let event: LocusState['event'] = { kind: 'done', actor: id };
    if (a.type === 'locus-pick') {
        if (!l.picks.includes(a.slot) || p.picked)
            throw Error('เลือกการ์ดนี้ไม่ได้');
        const m = s.market.find(c => c.slot === a.slot)!;
        m.owner = id;
        p.picked = m.card;
        s.draft++;
        const c = CARD_BY_ID[m.card];
        if (c.coin)
            gain(p, 1);
        effect(s, p, 'main', c.color, c.cells, c.id);
        event = { kind: 'pick', actor: id, gained: c.coin ? 1 : 0 };
    }
    else if (a.type === 'locus-place') {
        const e = p.effects.find(e => e.id === a.effect);
        if (!e)
            throw Error('ไม่พบรูปทรงที่รอวาง');
        const error = placementError(p, e, a.zone, a.x, a.y, a.rotation, a.mirror, a.wild);
        if (error)
            throw Error(error);
        const cost = e.color !== 'wild' && e.color !== a.zone ? 1 : 0;
        pay(p, cost);
        p.effects = p.effects.filter(x => x.id !== e.id);
        const cells = transform(e.cells, a.rotation, a.mirror).map(([dx, dy]) => ({ zone: a.zone, x: a.x + dx, y: a.y + dy }));
        let gained = 0;
        const effects: string[] = [];
        for (const c of cells) {
            const k = cellKey(c.x, c.y), trigger = `${c.zone}:${k}`;
            p.sheet[c.zone].push(k);
            const b = SHEET[c.zone].bonuses[k];
            if (b && !p.triggered.includes(trigger)) {
                p.triggered.push(trigger);
                if (b.color === 'coin') {
                    gain(p, 1);
                    gained++;
                }
                else
                    effects.push(effect(s, p, 'bonus', b.color, b.size === 2 ? [[0, 0], [1, 0]] : [[0, 0]], undefined, trigger).id);
            }
        }
        event = { kind: 'mark', actor: id, cells, gained, spent: cost, effects };
    }
    else if (a.type === 'locus-discard' || a.type === 'locus-skip') {
        const e = p.effects.find(e => e.id === a.effect);
        if (!e || (e.kind === 'main') !== (a.type === 'locus-discard'))
            throw Error('ทิ้งรูปทรงนี้ไม่ได้');
        p.effects = p.effects.filter(x => x !== e);
        if (e.kind === 'main')
            gain(p, 2);
        event = { kind: e.kind === 'main' ? 'discard' : 'skip', actor: id, gained: e.kind === 'main' ? 2 : 0 };
    }
    else if (a.type === 'locus-coin-blocks') {
        if (!l.coinBlocks)
            throw Error('ต้องมี 2 เหรียญ');
        pay(p, 2);
        effect(s, p, 'coin', 'wild', [[0, 0]]);
        effect(s, p, 'coin', 'wild', [[0, 0]]);
        event = { kind: 'coin', actor: id, spent: 2 };
    }
    else if (a.type === 'locus-buy') {
        if (!l.buy)
            throw Error('รอทุกคนเลือกก่อน และคัดลอกได้ครั้งเดียวต่อชุด');
        pay(p, 3);
        p.usedRemaining = true;
        const c = CARD_BY_ID[s.market.find(c => !c.owner)!.card];
        if (c.coin)
            gain(p, 1);
        effect(s, p, 'remaining', c.color, c.cells, c.id);
        event = { kind: 'coin', actor: id, spent: 3, gained: c.coin ? 1 : 0 };
    }
    else if (a.type === 'locus-done') {
        if (!l.done)
            throw Error('ต้องจัดการรูปทรงให้ครบและรอทุกคนเลือกก่อน');
        p.done = true;
    }
    p.version++;
    s.sequence++;
    s.event = event;
    if (s.players.every(p => p.done)) {
        if (s.deal >= s.targetDeals)
            finish(s);
        else {
            s.discard.push(...s.market.map(c => c.card));
            s.deal++;
            s.first = (s.first + 1) % s.players.length;
            deal(s, random);
            s.event = { kind: 'deal' };
        }
    }
    return s;
}
