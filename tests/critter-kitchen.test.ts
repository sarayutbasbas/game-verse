import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as e from '../src/games/critter-kitchen/engine.js';
import { TOKEN, TOKENS, FOODS, ZOUS, CRITICS, CHALLENGES, RUMORS, RESTAURATEURS, boardConfiguration } from '../src/games/critter-kitchen/data.js';
import { validateCKState } from '../src/games/critter-kitchen/validation.js';
import { validateMeals, emptyMeal, scoreFinal, mealQuality, scoreChallenge } from '../src/games/critter-kitchen/scoring.js';
import { seeded, botAction, criticMeal } from './critter-kitchen-fixtures.js';
import type { CKState, Meal } from '../src/games/critter-kitchen/types.js';
const seats = (n: number) => Array.from({ length: n }, (_, i) => ({ id: 'p' + i, name: 'เชฟ ' + i }));
test('component catalog has119 bag tokens and exact base card counts', () => { assert.equal(TOKENS.length, 119); for (const food of FOODS)
    assert.deepEqual(TOKENS.filter(t => t.kind === 'ingredient' && t.food === food).map(t => t.value), [2, 2, 2, 3, 3, 3, 4, 4, 5, 5, 6, 6, 7]); assert.deepEqual([ZOUS.length, CRITICS.length, CHALLENGES.length, RUMORS.length, RESTAURATEURS.length], [12, 12, 7, 28, 10]); });
for (const n of [2, 3, 4, 5])
    test(`setup${n}: real locations/sides/restock/priority; seeded full game conserves resources through all7 rounds`, () => { const r = seeded(n + 77); let s = e.createInitialState(seats(n), r, { restaurateurs: true }); assert.ok(validateCKState(s)); assert.equal(s.config.locations.length, n + 3); assert.equal(s.config.specialSide, n === 2 ? '2' : 'standard'); let steps = 0; while (s.phase !== 'finished' && steps++ < 1600) {
        const { actor, action } = botAction(s, r);
        s = e.applyAction(s, actor, action, r);
        assert.ok(validateCKState(s), JSON.stringify({ steps, round: s.round, phase: s.phase, pending: s.pending, action }));
    } assert.equal(s.phase, 'finished'); assert.equal(s.round, 7); assert.equal(s.winners.length, 1); assert.ok(s.players.every(p => p.score && p.score.total >= p.stars)); });
test('commitment is private until final submission, all reveal atomically and locked plans cannot change', () => { let s = e.createInitialState(seats(3), seeded(7)); const plan = { mouse: 'soup', lizard: 'garden', boar: 'academy' } as const; s = e.applyAction(s, 'p0', { type: 'ck-plan', epoch: e.decisionKey(s), plan }); assert.equal(e.getDisplayView(s, 'X', 0).players[0].plan, null); assert.deepEqual(e.getPlayerView(s, 'p0').plan, plan); assert.equal(e.getPlayerView(s, 'p1').plan, null); assert.equal((e.getDisplayView(s, 'X', 0) as any).bag, undefined); assert.equal((e.getDisplayView(s, 'X', 0) as any).unusedRumors, undefined); const saved = structuredClone(s); assert.throws(() => e.applyAction(s, 'p0', { type: 'ck-plan', epoch: e.decisionKey(s), plan })); assert.deepEqual(s, saved); for (const id of ['p1', 'p2'])
    s = e.applyAction(s, id, { type: 'ck-plan', epoch: e.decisionKey(s), plan }); assert.equal(s.phase, 'running'); assert.ok(e.getDisplayView(s, 'X', 1).players.every(p => !!p.plan)); assert.throws(() => e.applyAction(s, 'p0', { type: 'ck-uncommit', epoch: e.decisionKey(s) })); });
test('wrong/duplicate destinations, forged token/identity, bad epoch leave state untouched', () => { const s = e.createInitialState(seats(2), seeded(3)), before = structuredClone(s); for (const action of [{ type: 'ck-plan', epoch: e.decisionKey(s), plan: { mouse: 'soup', lizard: 'soup', boar: 'academy' } }, { type: 'ck-plan', epoch: 'old', plan: { mouse: 'soup', lizard: 'garden', boar: 'academy' } }, { type: 'ck-pick', item: s.bag[0] }, { type: 'ck-plan', epoch: e.decisionKey(s), plan: { mouse: 'soup', lizard: 'garden', boar: 'academy' }, playerId: 'p1' }])
    assert.throws(() => e.applyAction(s, 'p0', action as any)); assert.deepEqual(s, before); });
function activeFixture(chef: string, other?: string) {
    let s = e.createInitialState(seats(2), seeded(11));
    const p = s.players[0];
    if (s.academySous === chef)
        s.academySous = s.zousDeck.pop()!;
    else
        s.zousDeck.splice(s.zousDeck.indexOf(chef), 1);
    p.activeSous = chef;
    for (const t of s.locations.garden.splice(0))
        s.bag.push(t);
    const target = ['i-bread-0', 'i-carrot-8', 'i-cheese-12'];
    for (const t of target) {
        for (const loc of Object.keys(s.locations)) {
            const i = s.locations[loc].indexOf(t);
            if (i >= 0)
                s.locations[loc].splice(i, 1);
        }
        const i = s.bag.indexOf(t);
        if (i >= 0)
            s.bag.splice(i, 1);
        s.locations.garden.push(t);
    }
    const top = s.bag.filter(t => TOKEN[t].kind === 'ingredient').slice(0, 6);
    s.bag = s.bag.filter(t => !top.includes(t)).concat(top);
    s.priority = ['p1', 'p0'];
    const plan0 = { mouse: 'desert', lizard: 'midnight', boar: 'academy', [chef]: 'garden' };
    const plan1 = other ? { mouse: other === 'mouse' ? 'garden' : 'desert', lizard: other === 'lizard' ? 'garden' : 'midnight', boar: other === 'boar' ? 'garden' : 'academy' } : { mouse: 'desert', lizard: 'midnight', boar: 'academy' };
    s = e.applyAction(s, 'p0', { type: 'ck-plan', epoch: e.decisionKey(s), plan: plan0 as any });
    s = e.applyAction(s, 'p1', { type: 'ck-plan', epoch: e.decisionKey(s), plan: plan1 as any });
    s = e.applyAction(s, 'p0', { type: 'ck-run' });
    return s;
}
function finishChef(s: CKState, chef: string) { let guard = 0; const target = s.visits.find(v => v.chef === chef)!; while (!s.visits.find(v => v.chef === chef)!.done || s.pending?.actor === 'p0' && s.pending.kind === 'pick' && s.pending.extra) {
    if (guard++ > 20)
        throw Error('Fixture loop');
    const d = s.pending!;
    const a = e.getLegalActions(s, d.actor).find(a => a.type === 'ck-pick') ?? e.getLegalActions(s, d.actor)[0];
    s = e.applyAction(s, d.actor, a, seeded(9));
} return s; }
test('Chrissy alone gains carrying limit3 while still in queue1; Snooze and Geoffrey stock exact extras', () => { for (const [chef, size, limit] of [['chrissy', 3, 3], ['snooze', 5, 3], ['geoffrey', 4, 3]] as const) {
    const s = activeFixture(chef);
    assert.equal(s.locations.garden.length, size);
    assert.equal(s.visits.find(v => v.chef === chef)!.limit, limit);
    assert.ok(validateCKState(s));
} });
test('Ming precedes tied mice without changing hats; Dash moves front before a tied queue', () => { let s = activeFixture('ming', 'mouse'); assert.equal(s.pending?.actor, 'p0'); const before = [...s.priority]; s = e.applyAction(s, 'p0', { type: 'ck-pick', item: s.locations.garden[0] }); assert.deepEqual(s.priority, before); s = activeFixture('dash', 'boar'); assert.equal(s.priority[0], 'p0'); assert.equal(s.pending?.actor, 'p0'); });
test('Newton lowest item earns3soup, Lily takes remote bisque and Carol earns star at back', () => { let s = activeFixture('newton'); s = e.applyAction(s, 'p0', { type: 'ck-pick', item: 'i-bread-0' }); assert.equal(s.players[0].soup, 4); s = finishChef(activeFixture('lily'), 'lily'); assert.equal(s.players[0].bisque, 1); s = finishChef(activeFixture('carol'), 'carol'); assert.equal(s.players[0].chefStars, 1); });
test('Otto rewards all capacity2 chefs before shopping; Ginger and Mandy collect an extra bag item', () => { let s = activeFixture('otto', 'lizard'); assert.equal(s.players[0].storage.length, 1); assert.equal(s.players[1].storage.length, 1); for (const chef of ['ginger', 'mandy']) {
    s = finishChef(activeFixture(chef), chef);
    assert.equal(s.players[0].storage.length, chef === 'ginger' ? 3 : 4);
    assert.ok(validateCKState(s));
} });
test('Penny opens a persistent additional selection at Soup Truck from another location', () => { let s = activeFixture('penny'); s = e.applyAction(s, 'p0', { type: 'ck-pick', item: s.locations.garden[0] }); s = e.applyAction(s, 'p0', { type: 'ck-pick', item: s.locations.garden[0] }); assert.deepEqual(s.pending, { kind: 'pick', actor: 'p0', visit: 'p0:penny', loc: 'soup', extra: true, fallback: false }); assert.equal(e.getDisplayView(s, 'X', 1).decision?.chef, 'penny'); const saved = structuredClone(s); s = e.applyAction(s, 'p0', { type: 'ck-pick', item: 'soup' }); assert.equal(s.players[0].soup, 2); assert.ok(validateCKState(saved)); assert.ok(validateCKState(s)); });
test('known rumors never prevent receiving ingredients and unknown rumor is not exposed in public projection', () => { let s = activeFixture('ginger'); for (let i = 0; i < 3; i++) {
    const t = `r-${i}-0`, j = s.bag.indexOf(t);
    if (j >= 0)
        s.bag.splice(j, 1);
    else
        for (const loc of Object.keys(s.locations)) {
            const k = s.locations[loc].indexOf(t);
            if (k >= 0)
                s.locations[loc].splice(k, 1);
        }
    s.players[0].known[i] = t;
} assert.ok(e.pickChoices(s, s.players[0], 'garden').includes('i-bread-0')); assert.ok(e.getDisplayView(s, 'X', 0).rumors.every(x => x === null)); assert.equal(e.getPlayerView(s, 'p0').known.filter(Boolean).length, 3); assert.equal(e.getPlayerView(s, 'p1').known.filter(Boolean).length, 0); });
test('equal capacities alternate one pick each in established hat order; only first tied pick moves hat', () => {
    let s = e.createInitialState(seats(2), seeded(72));
    s.priority = ['p0', 'p1'];
    for (const p of s.players)
        s = e.applyAction(s, p.id, { type: 'ck-plan', epoch: e.decisionKey(s), plan: { mouse: 'soup', lizard: 'garden', boar: 'academy' } });
    s = e.applyAction(s, 'p0', { type: 'ck-run' });
    for (let n = 0; n < 2; n++) {
        const d = s.pending!;
        s = e.applyAction(s, d.actor, { type: 'ck-pick', item: 'soup' });
    }
    assert.equal(s.location, 'garden');
    const first = s.pending!.actor;
    const initial = [...s.priority];
    s = e.applyAction(s, first, { type: 'ck-pick', item: e.getPlayerView(s, first).choices[0] });
    assert.equal(s.priority.at(-1), first);
    const second = s.pending!.actor;
    assert.notEqual(second, first);
    const after = [...s.priority];
    s = e.applyAction(s, second, { type: 'ck-pick', item: e.getPlayerView(s, second).choices[0] });
    assert.deepEqual(s.priority, after);
    assert.equal(s.pending!.actor, first);
    assert.equal(initial[0], first);
});
function endEffectFixture(rest: string, priority = ['p1', 'p0']) { const s = e.createInitialState(seats(2), seeded(19)); s.players[0].restaurateur = rest; s.unusedRestaurateurs.splice(s.unusedRestaurateurs.indexOf(rest), 1); s.phase = 'shopping'; s.priority = priority; s.location = 'academy'; s.visits = [{ id: 'p1:mouse', actor: 'p1', chef: 'mouse', loc: 'academy', capacity: 1, limit: 1, used: 0, gained: 0, done: true, started: true, newton: false }]; s.pending = { kind: 'consolation', actor: 'p1', visit: 'p1:mouse' }; s.tasks = [{ kind: 'end-round' }]; if (s.academySous) {
    s.usedZous.push(s.academySous);
    s.academySous = null;
} const gift = s.bag.find(t => TOKEN[t].kind === 'ingredient')!; s.bag = s.bag.filter(t => t !== gift); s.bag.push(gift); return { s, gift }; }
test('Marcus end-round moves exactly one hat step, or grants one bag item at front, before next round', () => { for (const priority of [['p1', 'p0'], ['p0', 'p1']]) {
    const { s, gift } = endEffectFixture('marcus-roostersson', priority);
    assert.ok(validateCKState(s));
    const next = e.applyAction(s, 'p1', { type: 'ck-consolation', reward: 'skip' });
    assert.equal(next.round, 2);
    assert.equal(next.priority[0], 'p0');
    assert.equal(next.players[0].storage.includes(gift), priority[0] === 'p0');
    assert.ok(validateCKState(next));
} });
test('Anthony can replace empty-handed consolation with one bag item without also taking soup', () => { const { s, gift } = endEffectFixture('anthony-boardain'); s.pending = { kind: 'consolation', actor: 'p0', visit: 'p0:mouse' }; s.visits[0].id = 'p0:mouse'; s.visits[0].actor = 'p0'; const next = e.applyAction(s, 'p0', { type: 'ck-consolation', reward: 'bag' }); assert.equal(next.players[0].soup, 1); assert.ok(next.players[0].storage.includes(gift)); assert.ok(validateCKState(next)); });
test('Jamie gets one private additional rumor immediately; it becomes public only at final scoring', () => { let s: CKState | undefined; for (let seed = 0; seed < 100; seed++) {
    const candidate = e.createInitialState(seats(2), seeded(seed), { restaurateurs: true });
    if (candidate.players[0].offers.includes('jamie-owliver')) {
        s = candidate;
        break;
    }
} assert.ok(s); const n = s.unusedRumors.length; s = e.applyAction(s, 'p0', { type: 'ck-restaurateur', card: 'jamie-owliver' }); assert.ok(s.players[0].extraRumor); assert.equal(s.unusedRumors.length, n - 1); assert.equal(e.getPlayerView(s, 'p1').extraRumor, null); assert.equal(e.getDisplayView(s, 'X', 1).extraRumors, undefined); assert.equal(e.getPlayerView(s, 'p0').extraRumor, s.players[0].extraRumor); assert.ok(validateCKState(s)); });

test('recovery accepts JSON object key reordering like JSONB, but rejects changed challenge results',()=>{
 const reorder=(v:any):any=>Array.isArray(v)?v.map(reorder):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).reverse().map(([k,x])=>[k,reorder(x)])):v;
 const r=seeded(909);let s=e.createInitialState(seats(3),r,{restaurateurs:true});assert.ok(validateCKState(reorder(s)));let guard=0;while(s.phase!=='challenge-results'&&guard++<1000){const next=botAction(s,r);s=e.applyAction(s,next.actor,next.action,r);}assert.equal(s.phase,'challenge-results');assert.ok(validateCKState(reorder(s)));const changed=reorder(s);changed.challengeResults.p0[0].quality++;assert.equal(validateCKState(changed),false);
});

test('market pickup stamps persist publicly with fixed team colors without exposing private inventories',()=>{
 const r=seeded(805);let s=e.createInitialState(seats(2),r);const colors=structuredClone(s.teamColors);
 assert.deepEqual(Object.values(colors!).sort(),['blue','red']);
 for(const p of s.players)s=e.applyAction(s,p.id,{type:'ck-plan',epoch:e.decisionKey(s),plan:{mouse:'garden',lizard:'soup',boar:'academy'}},r);
 s=e.applyAction(s,'p0',{type:'ck-run'},r);
 assert.equal(s.pending?.kind,'pick');const pending=s.pending!;const actor=pending.actor;
 const action=e.getLegalActions(s,actor).find(a=>a.type==='ck-pick')!;
 assert.equal(action.type,'ck-pick');if(action.type!=='ck-pick')throw Error('fixture');
 const chef=s.visits.find(v=>v.id===('visit'in pending?pending.visit:''))!.chef;
 const stock=structuredClone(s.marketStock);s=e.applyAction(s,actor,action,r);
 assert.equal(s.pickups!.length,1);assert.equal(s.pickups![0].item,action.item);assert.equal(s.pickups![0].chef,chef);assert.equal(s.pickups![0].actor,actor);
 assert.deepEqual(s.marketStock,stock);assert.deepEqual(s.teamColors,colors);
 assert.ok(validateCKState(s));const badColor=structuredClone(s);(badColor.teamColors as any)[actor]='forged';assert.equal(validateCKState(badColor),false);const badStamp=structuredClone(s);badStamp.pickups![0].actor='intruder';assert.equal(validateCKState(badStamp),false);
 const view=e.getDisplayView(JSON.parse(JSON.stringify(s)),'X',5);
 assert.deepEqual(view.pickups,s.pickups);assert.deepEqual(view.teamColors,colors);assert.equal((view as any).bag,undefined);
 assert.ok(view.players.every(p=>!(p as any).storage));
 view.pickups![0].item='tampered';assert.equal(s.pickups![0].item,action.item);
 const before=structuredClone(s);assert.throws(()=>e.applyAction(s,actor,{type:'ck-pick',item:'forged'},r));assert.deepEqual(s,before);
});

test('team colors remain unique for2–5 seats and recover legacy duplicate colors consistently',()=>{
 for(const count of [2,3,4,5]){
  const random=seeded(1800+count),state=e.createInitialState(seats(count),random);
  const assigned=structuredClone(state.teamColors);assert.equal(new Set(Object.values(assigned!)).size,count);
  assert.ok(validateCKState(JSON.parse(JSON.stringify(state))));
  assert.deepEqual(e.getDisplayView(state,'COLORS',1).teamColors,assigned);
  const legacy=structuredClone(state);legacy.teamColors=Object.fromEntries(legacy.players.map((p,i)=>[p.id,i%2?'red':'blue']));
  assert.ok(validateCKState(legacy));const before=structuredClone(legacy);
  const colors=e.getDisplayView(legacy,'OLD',1).teamColors!;assert.equal(new Set(Object.values(colors)).size,count);assert.deepEqual(legacy,before);
  const next=e.applyAction(legacy,'p0',{type:'ck-plan',epoch:e.decisionKey(legacy),plan:{mouse:'garden',lizard:'soup',boar:'academy'}},random);
  assert.deepEqual(next.teamColors,colors);assert.ok(validateCKState(next));
  const invalid=structuredClone(next);(invalid.teamColors as any).p0='yellow';assert.equal(validateCKState(invalid),false);
 }
});

test('serving reveal is shared, authenticated, replay-safe and cannot skip into refrigeration',()=>{
 const random=seeded(944);let state=e.createInitialState(seats(2),random);let guard=0;while(state.phase!=='challenge-results'&&guard++<1000){const next=botAction(state,random);state=e.applyAction(state,next.actor,next.action,random);}
 assert.equal(state.resultsRevealed,false);const before=structuredClone(state);assert.throws(()=>e.applyAction(state,'p0',{type:'ck-next'}));assert.throws(()=>e.applyAction(state,'outsider',{type:'ck-reveal-results'}));assert.deepEqual(state,before);
 state=e.applyAction(state,'p1',{type:'ck-reveal-results'});assert.equal(state.resultsRevealed,true);assert.equal(e.getDisplayView(state,'ROOM',0).resultsRevealed,true);assert.equal(e.getPlayerView(state,'p0').id,'p0');assert.deepEqual(state.challengeResults,before.challengeResults);assert.throws(()=>e.applyAction(state,'p0',{type:'ck-reveal-results'}));assert.ok(validateCKState(state));
 while(state.phase!=='finished'&&guard++<1800){const next=botAction(state,random);state=e.applyAction(state,next.actor,next.action,random);}
 assert.equal(state.resultsRevealed,false);const scores=state.players.map(p=>p.score);state=e.applyAction(state,'p0',{type:'ck-reveal-results'});assert.deepEqual(state.players.map(p=>p.score),scores);assert.equal(state.phase,'finished');assert.ok(validateCKState(state));assert.throws(()=>e.applyAction(state,'p1',{type:'ck-reveal-results'}));
});
