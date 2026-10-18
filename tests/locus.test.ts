import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CARDS, SHEET, ZONES, transform, orientations, cellKey } from '../src/games/locus/data.js';
import { createInitialState, emptyPlayer, applyAction, getDisplayView, getPlayerView, decisionKey, placementError, extendTiedRound, placements } from '../src/games/locus/engine.js';
import { scorePlayer } from '../src/games/locus/scoring.js';
import { validateLocusState } from '../src/games/locus/validation.js';
import { seeded, botAction } from './locus-fixtures.js';
import type { Effect, LocusAction } from '../src/games/locus/types.js';
const setup = (n = 2) => createInitialState(Array.from({ length: n }, (_, i) => ({ id: 'p' + i, name: 'ชื่อซ้ำ' })), seeded(42));
const one: Effect = { id: 'one', kind: 'coin', color: 'wild', cells: [[0, 0]] };
test('Locus exact reference catalog, sheet sites, D4 transformations and full-sheet scoring', () => {
    assert.equal(CARDS.length, 48);
    assert.equal(new Set(CARDS.map(c => c.id)).size, 48);
    assert.equal(CARDS.filter(c => c.coin).length, 12);
    assert.equal(CARDS.reduce((n, c) => n + c.cells.length, 0), 208);
    for (const color of [...ZONES, 'wild'])
        assert.equal(CARDS.filter(c => c.color === color).length, 8);
    assert.deepEqual(CARDS.filter(c => c.color === 'wild').map(c => c.cells.length), [4, 4, 4, 4, 4, 4, 2, 2]);
    assert.equal(ZONES.reduce((n, z) => n + SHEET[z].cells.length, 0), 213);
    assert.equal(ZONES.reduce((n, z) => n + Object.keys(SHEET[z].bonuses).length, 0), 35);
    for (const z of ZONES) {
        const keys = SHEET[z].cells.map(([x, y]) => cellKey(x, y));
        assert.equal(new Set(keys).size, keys.length);
        for (const c of [...SHEET[z].starts, ...SHEET[z].ends ?? []])
            assert.ok(keys.includes(cellKey(...c)));
        for (const k of Object.keys(SHEET[z].bonuses))
            assert.ok(keys.includes(k));
    }
    for (const c of CARDS) {
        assert.deepEqual(transform(c.cells, 4, false), transform(c.cells, 0, false));
        for (const o of orientations(c.cells)) {
            assert.equal(new Set(o.cells.map(p => p.join(','))).size, c.cells.length);
            assert.equal(Math.min(...o.cells.map(p => p[0])), 0);
        }
    }
    const p = emptyPlayer('p', 'x');
    for (const z of ZONES)
        p.sheet[z] = SHEET[z].cells.map(([x, y]) => cellKey(x, y));
    const r = scorePlayer(p);
    assert.deepEqual([r.yellow, r.purple, r.red, r.green, r.blue, r.lowest, r.total], [64, 48, 54, 56, 50, 48, 320]);
});
test('Locus scoring uses completed rows/groups, most connected bold squares, center paths and highest blue tier only', () => {
    const p = emptyPlayer('p', 'x');
    p.sheet.yellow = ['0,0', '1,0', '2,0', '3,0', '4,0'];
    assert.equal(scorePlayer(p).yellow, 0);
    p.sheet.yellow.push('5,0');
    assert.equal(scorePlayer(p).yellow, 12);
    p.sheet.purple = ['0,0'];
    assert.equal(scorePlayer(p).purple, 0);
    p.sheet.purple = ['0,0', '1,0', '2,0', '3,0', '3,1', '6,6'];
    assert.equal(scorePlayer(p).purple, 12);
    p.sheet.red = SHEET.red.groups![2].cells.map(([x, y]) => cellKey(x, y));
    assert.equal(scorePlayer(p).red, 14);
    p.sheet.green = ['3,0'];
    assert.equal(scorePlayer(p).green, 0);
    p.sheet.green = ['3,4', '3,3', '4,3', '4,2', '4,1', '4,0', '3,0'];
    assert.equal(scorePlayer(p).green, 8);
    p.sheet.blue = ['0,21', '1,17', '2,9'];
    assert.equal(scorePlayer(p).blue, 24);
    p.sheet.blue.push('0,3');
    assert.equal(scorePlayer(p).blue, 40);
});
test('Locus placements validate adjacency, bold starts, full shape, mirror, red holes, color and atomic coin payment', () => {
    const p = emptyPlayer('p', 'x');
    assert.ok(placementError(p, one, 'yellow', 0, 0, 0, false));
    assert.equal(placementError(p, one, 'yellow', 0, 5, 0, false), '');
    assert.equal(placementError(p, one, 'red', 4, 4, 0, false), '');
    assert.ok(placementError(p, one, 'red', 5, 4, 0, false));
    p.sheet.yellow = ['0,5'];
    assert.equal(placementError(p, one, 'yellow', 0, 4, 0, false), '');
    assert.ok(placementError(p, one, 'yellow', 0, 5, 0, false));
    assert.ok(placementError(p, { ...one, cells: [[0, 0], [1, 0]] }, 'yellow', 5, 5, 0, false));
    const e = { ...one, color: 'red' as const };
    assert.ok(placementError(p, e, 'yellow', 1, 5, 0, false));
    assert.equal(placementError(p, e, 'yellow', 1, 5, 0, false, true), '');
    p.coins = 0;
    assert.ok(placementError(p, e, 'yellow', 1, 5, 0, false, true));
});
test('Locus server rejects unknown fields, actor, stale epoch, wrong turn and never mutates rejected state', () => {
    const s = setup(), before = JSON.stringify(s), a = { type: 'locus-pick', slot: 1, epoch: decisionKey(s, 'p0') } as LocusAction;
    assert.throws(() => applyAction(s, 'p1', { ...a, epoch: decisionKey(s, 'p1') }));
    assert.throws(() => applyAction(s, 'fake', a));
    assert.throws(() => applyAction(s, 'p0', { ...a, score: 999 } as any));
    assert.throws(() => applyAction(s, 'p0', { ...a, epoch: 'old' }));
    assert.equal(JSON.stringify(s), before);
    const next = applyAction(s, 'p0', a);
    assert.throws(() => applyAction(next, 'p0', a));
    assert.ok(validateLocusState(next));
});
test('Locus bonuses chain once, colored double cannot split, single wild may recolor and coin ledger stays balanced', () => {
    let s = setup();
    const p = s.players[0];
    s = applyAction(s, p.id, { type: 'locus-pick', slot: 1, epoch: decisionKey(s, p.id) });
    const q = s.players[0];
    q.effects = [{ ...one, id: 'fixture' }];
    q.sheet.yellow = ['3,5'];
    q.triggered = ['yellow:3,5'];
    q.gained = 1;
    q.coins = 2;
    s = applyAction(s, q.id, { type: 'locus-place', effect: 'fixture', zone: 'yellow', x: 4, y: 5, rotation: 0, mirror: false, wild: false, epoch: decisionKey(s, q.id) });
    s.players[0].effects = [{ ...one, id: 'next' }];
    s = applyAction(s, q.id, { type: 'locus-place', effect: 'next', zone: 'yellow', x: 5, y: 5, rotation: 0, mirror: false, wild: false, epoch: decisionKey(s, q.id) });
    s.players[0].effects = [{ ...one, id: 'red-bonus' }];
    s = applyAction(s, q.id, { type: 'locus-place', effect: 'red-bonus', zone: 'yellow', x: 5, y: 4, rotation: 0, mirror: false, wild: false, epoch: decisionKey(s, q.id) });
    const bonus = s.players[0].effects[0];
    assert.equal(bonus.color, 'red');
    assert.equal(bonus.cells.length, 2);
    assert.throws(() => applyAction(s, q.id, { type: 'locus-place', effect: bonus.id, zone: 'red', x: 5, y: 4, rotation: 0, mirror: false, wild: false, epoch: decisionKey(s, q.id) }));
    const legal = placements(s.players[0], bonus).find(x => x.zone === 'red')!;
    s = applyAction(s, q.id, { type: 'locus-place', effect: bonus.id, ...legal, epoch: decisionKey(s, q.id) });
    assert.ok(s.players[0].sheet.red.length >= 2);
    assert.equal(new Set(s.players[0].triggered).size, s.players[0].triggered.length);
});
test('Locus remaining card: after all picks only, grants coin, once each player, card remains public', () => {
    let s = setup();
    const coin = CARDS.find(c => c.coin)!.id;
    const at = s.deck.indexOf(coin);
    [s.deck[at], s.market[2].card] = [s.market[2].card, s.deck[at]];
    for (const p of s.players) {
        p.coins = 5;
        p.gained = 4;
    }
    assert.throws(() => applyAction(s, 'p0', { type: 'locus-buy', epoch: decisionKey(s, 'p0') }));
    for (const id of ['p0', 'p1']) {
        s = applyAction(s, id, { type: 'locus-pick', slot: id === 'p0' ? 1 : 2, epoch: decisionKey(s, id) });
        const e = s.players.find(p => p.id === id)!.effects[0];
        s = applyAction(s, id, { type: 'locus-discard', effect: e.id, epoch: decisionKey(s, id) });
    }
    const cards = JSON.stringify(s.market);
    for (const id of ['p0', 'p1']) {
        const before = s.players.find(p => p.id === id)!.coins;
        s = applyAction(s, id, { type: 'locus-buy', epoch: decisionKey(s, id) });
        assert.equal(s.players.find(p => p.id === id)!.coins, before - 2);
        assert.throws(() => applyAction(s, id, { type: 'locus-buy', epoch: decisionKey(s, id) }));
    }
    assert.equal(JSON.stringify(s.market), cards);
    assert.ok(validateLocusState(s));
});
for (const n of [2, 3, 4, 5])
    test(`Locus complete ${n}-player game: all deals, bonus queues, purchases, reshuffle and final conservation`, () => {
        let s = setup(n), steps = 0, reshuffled = false, previous = s.deck.length;
        const random = seeded(734 + n);
        const seenFirst = new Set<string>();
        while (s.phase !== 'finished' && steps++ < 2500) {
            assert.ok(validateLocusState(s), `invalid at ${steps}`);
            seenFirst.add(s.players[s.first].id);
            let acted = false;
            for (const p of s.players) {
                const a = botAction(s, p.id);
                if (a) {
                    s = applyAction(s, p.id, a, random);
                    acted = true;
                    break;
                }
            }
            assert.ok(acted, 'deadlock');
            if (s.deck.length > previous)
                reshuffled = true;
            previous = s.deck.length;
        }
        assert.ok(steps < 2500);
        assert.equal(s.phase, 'finished');
        assert.equal(s.deal, n * ({ 2: 8, 3: 5, 4: 4, 5: 3 }[n]!));
        assert.equal(seenFirst.size, n);
        assert.ok(s.players.every(p => Object.values(p.sheet).flat().length > 20));
        assert.ok(s.winners.length);
        assert.ok(validateLocusState(s));
        if (n > 2)
            assert.ok(reshuffled);
        const view = getDisplayView(s, 'ABC234', 1);
        assert.ok(!('deck' in view));
        assert.ok(!('me' in view));
        assert.deepEqual(view.players.map(p => p.score), s.players.map(scorePlayer));
    });
test('Locus corruption quarantine catches card/coin/sheet/effect forgery and shared tie can continue a full round', () => {
    const s = setup();
    for (const mutate of [(s: any) => s.deck.push(s.deck[0]), (s: any) => s.players[0].coins++, (s: any) => s.players[0].sheet.red.push('99,99'), (s: any) => s.players[0].effects.push({ ...one, id: 'bad', kind: 'main', card: 'fake' })]) {
        const bad = structuredClone(s);
        mutate(bad);
        assert.equal(validateLocusState(bad), false);
    }
    let t = setup();
    while (t.phase !== 'finished') {
        for (const p of t.players) {
            const l = getPlayerView(t, p.id).legal;
            const a = l.picks.length ? { type: 'locus-pick', slot: l.picks[0], epoch: l.epoch } : l.effects.length ? { type: 'locus-discard', effect: l.effects[0].id, epoch: l.epoch } : l.done ? { type: 'locus-done', epoch: l.epoch } : null;
            if (a) {
                t = applyAction(t, p.id, a as LocusAction);
                break;
            }
        }
    }
    assert.equal(t.winners.length, 2);
    let extra = extendTiedRound(t, seeded(1));
    assert.equal(extra.targetDeals, 18);
    assert.equal(extra.deal, 17);
    assert.equal(extra.phase, 'playing');
    assert.ok(validateLocusState(extra));
    assert.deepEqual(extra.players.map(p => p.sheet), t.players.map(p => p.sheet));
    let steps=0;while(extra.phase!=='finished'&&steps++<500){const next=extra.players.map(p=>({id:p.id,action:botAction(extra,p.id)})).find(x=>x.action);assert.ok(next);extra=applyAction(extra,next.id,next.action!,seeded(2));assert.ok(validateLocusState(extra));}
    assert.equal(extra.phase,'finished');assert.equal(extra.deal,18);assert.ok(extra.results?.length===2);
});
test('Locus four-link combo: wild → yellow double → recolored purple → red double → green; pending IDs survive serialization', () => {
    let s = setup();
    s = applyAction(s, 'p0', { type: 'locus-pick', slot: 1, epoch: decisionKey(s, 'p0') });
    s = applyAction(s, 'p0', { type: 'locus-discard', effect: s.players[0].effects[0].id, epoch: decisionKey(s, 'p0') });
    s = applyAction(s, 'p0', { type: 'locus-coin-blocks', epoch: decisionKey(s, 'p0') });
    s.players[0].sheet.yellow = ['0,2', '0,3', '0,4', '0,5'];
    s.players[0].sheet.purple = ['6,0'];
    const put = (id: string, zone: any, x: number, y: number, rotation = 0, wild = false) => { s = applyAction(s, 'p0', { type: 'locus-place', effect: id, zone, x, y, rotation, mirror: false, wild, epoch: decisionKey(s, 'p0') }); assert.ok(validateLocusState(s)); s = JSON.parse(JSON.stringify(s)); };
    put(s.players[0].effects[0].id, 'yellow', 0, 1);
    let e = s.players[0].effects.find(e => e.kind === 'bonus')!;
    assert.equal(e.color, 'wild');
    put(e.id, 'red', 0, 1);
    e = s.players[0].effects.find(e => e.color === 'yellow')!;
    put(e.id, 'purple', 6, 1, 1, true);
    assert.equal(s.players[0].coins, 0);
    e = s.players[0].effects.find(e => e.color === 'red')!;
    put(e.id, 'red', 5, 6);
    e = s.players[0].effects.find(e => e.color === 'green')!;
    put(e.id, 'green', 3, 3, 1);
    assert.deepEqual(s.players[0].triggered, ['yellow:0,1', 'red:0,1', 'purple:6,2', 'red:6,6']);
    assert.equal(s.players[0].effects.length, 1);
    assert.equal(s.players[0].effects[0].kind, 'coin');
});
test('Locus unusable bonuses may be declined without coins; finish remains gated on all effects and every player', () => {
    let s = setup();
    for (const id of ['p0', 'p1']) {
        s = applyAction(s, id, { type: 'locus-pick', slot: id === 'p0' ? 1 : 2, epoch: decisionKey(s, id) });
        const e = s.players.find(p => p.id === id)!.effects[0];
        assert.throws(() => applyAction(s, id, { type: 'locus-done', epoch: decisionKey(s, id) }));
        s = applyAction(s, id, { type: 'locus-discard', effect: e.id, epoch: decisionKey(s, id) });
    }
    s = applyAction(s, 'p0', { type: 'locus-coin-blocks', epoch: decisionKey(s, 'p0') });
    const before = s.players[0].coins;
    assert.throws(() => applyAction(s, 'p0', { type: 'locus-done', epoch: decisionKey(s, 'p0') }));
    for (const e of [...s.players[0].effects])
        s = applyAction(s, 'p0', { type: 'locus-skip', effect: e.id, epoch: decisionKey(s, 'p0') });
    assert.equal(s.players[0].coins, before);
    s = applyAction(s, 'p0', { type: 'locus-done', epoch: decisionKey(s, 'p0') });
    assert.equal(s.deal, 1);
    s = applyAction(s, 'p1', { type: 'locus-done', epoch: decisionKey(s, 'p1') });
    assert.equal(s.deal, 2);
    assert.equal(s.players[s.first].id, 'p1');
    assert.equal(s.players[0].coins, before);
});
