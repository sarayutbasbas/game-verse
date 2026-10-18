import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, applyAction, decisionKey } from '../src/games/critter-kitchen/engine.js';
import { TOKEN, TOKENS, FOODS, RUMORS, RESTAURATEURS, type Food } from '../src/games/critter-kitchen/data.js';
import { emptyMeal, baseValue, mealQuality, validateMeals, scoreChallenge, scoreFinal, validateMealShape } from '../src/games/critter-kitchen/scoring.js';
import { validateCKState } from '../src/games/critter-kitchen/validation.js';
import { seeded } from './critter-kitchen-fixtures.js';
import type { CKState, Meal, MealItem } from '../src/games/critter-kitchen/types.js';
const ingredient = (food: Food, value: number, n = 0) => TOKENS.filter(t => t.kind === 'ingredient' && t.food === food && t.value === value)[n].id;
const item = (food: Food, value: number, n = 0): MealItem => ({ token: ingredient(food, value, n), as: food });
function fixture(critic = 'mouse') { const s = createInitialState([{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], seeded(444)); s.critic = critic; s.round = 7; s.phase = 'critic'; s.rumors = ['bread-fanatic', 'carrot-fanatic', 'fish-fanatic']; for (const p of s.players) {
    p.storage = [];
    p.critic = emptyMeal();
    p.soup = 0;
    p.bisque = 0;
} return s; }
function own(s: CKState, m: Meal) { const p = s.players[0]; p.critic = m; p.storage = [...new Set([...m.items.flatMap(a => [a.token, ...a.spice ? [a.spice] : []]), ...(m.wine ?? []).map(w => w.token)])]; return p; }
const result = (s: CKState) => scoreFinal(s).a;
function rumor(s: CKState, id: string) { s.rumors = [id, 'bread-fanatic', 'fish-fanatic']; return result(s).rumors.find(r => r.id === id)!.stars; }
test('all12 critics: ingredient transformations, valid extras, spice and specific printed values', () => {
    let s = fixture('mouse'), m = { ...emptyMeal(), items: [item('cheese', 7), item('cheese', 6)] }, p = own(s, m);
    assert.doesNotThrow(() => validateMeals(s, p, [m], true));
    assert.equal(result(s).best[2], 3);
    s = fixture('jerboa');
    m = { ...emptyMeal(), items: [{ ...item('bread', 5), spice: 'r-0-0' }] };
    p = own(s, m);
    p.storage = p.storage.filter(x => x !== 'r-0-0');
    p.known = ['r-0-0', null, null];
    assert.doesNotThrow(() => validateMeals(s, p, [m], true));
    assert.equal(mealQuality(s, p, m), 10);
    s = fixture('saint-bernard');
    m = { ...emptyMeal(), items: [{ ...item('bread', 5), spice: ingredient('wine', 2) }] };
    p = own(s, m);
    assert.doesNotThrow(() => validateMeals(s, p, [m], true));
    assert.equal(mealQuality(s, p, m), 10);
    s = fixture('badger');
    m = { ...emptyMeal(), items: [{ token: ingredient('mushroom', 7), as: 'fish', spice: 's-cheese-0' }] };
    p = own(s, m);
    assert.doesNotThrow(() => validateMeals(s, p, [m], true));
    assert.equal(mealQuality(s, p, m), 14);
    s = fixture('fruit-bat');
    m = { ...emptyMeal(), items: [item('bread', 6)], wine: [{ token: ingredient('wine', 6), course: 'bread' }] };
    p = own(s, m);
    assert.doesNotThrow(() => validateMeals(s, p, [m], true));
    assert.equal(result(s).bonus, 1);
    assert.equal(result(s).courseQuality[0], 12);
    m.wine![0].token = ingredient('wine', 5);
    p.storage.push(ingredient('wine', 5));
    assert.throws(() => validateMeals(s, p, [m], true));
    s = fixture('cow');
    m = { ...emptyMeal(), items: [item('bread', 2), item('bread', 3), item('bread', 4), item('bread', 5), item('cheese', 7)] };
    p = own(s, m);
    assert.doesNotThrow(() => validateMeals(s, p, [m], true));
    m.items.push(item('cheese', 6));
    p.storage.push(ingredient('cheese', 6));
    assert.throws(() => validateMeals(s, p, [m], true));
    s = fixture('capybara');
    s.round = 3;
    s.challenges = ['coastal-fusion', 'savory-stack', 'wine-dine'];
    m = { ...emptyMeal(), items: [item('fish', 7), item('cheese', 6), item('carrot', 5)] };
    p = own(s, m);
    assert.equal(scoreChallenge(s, p, m, 0).bonus, 1);
    s = fixture('rabbit');
    p = s.players[0];
    assert.equal(baseValue(s, p, ingredient('carrot', 3)), 6);
    assert.equal(baseValue(s, p, ingredient('bread', 3)), 3);
    s = fixture('tree-shrew');
    m = { ...emptyMeal(), items: [{ ...item('fish', 5), spice: 's-fish-0' }] };
    p = own(s, m);
    assert.equal(mealQuality(s, p, m), 15);
    s = fixture('poodle');
    m = { ...emptyMeal(), items: [item('fish', 6), { ...item('bread', 5), spice: 's-bread-0' }] };
    own(s, m);
    assert.equal(result(s).bonus, 1);
    s = fixture('kangaroo');
    p = s.players[0];
    assert.equal(baseValue(s, p, ingredient('fish', 6)), 9);
    assert.equal(baseValue(s, p, ingredient('fish', 5)), 5);
    s = fixture('raccoon');
    m = { ...emptyMeal(), items: [item('bread', 7), item('bread', 2), item('bread', 2, 1), item('bread', 2, 2)] };
    p = own(s, m);
    assert.doesNotThrow(() => validateMeals(s, p, [m], true));
    m.items.push(item('bread', 3));
    p.storage.push(ingredient('bread', 3));
    assert.throws(() => validateMeals(s, p, [m], true));
});
test('28 rumors execute their own scoring; 7 fanatics change quality after Best, friendly tie awards stay full', () => {
    const expected: Record<string, number> = { 'varied-servings': 2, shortsighted: 3, 'super-chatty': 2, picky: 5, 'to-go': 3, 'spice-lover': 2, 'odd-tastes': 3, 'simple-palate': 3, tender: 3, 'subtle-flavors': 3, mercurial: 0, 'wine-cellar': 1, 'psychedelic-flavor': 2, 'big-cheese': 0, hibernator: 2, 'big-dipper': 2, 'extremely-pampered': 2, unsophisticated: 8, sommelier: 4, 'varied-leftovers': 3, nocturnal: 5 };
    for (const c of RUMORS) {
        const s = fixture('capybara'), m = { ...emptyMeal(), items: FOODS.map(f => item(f, 5)) }, p = own(s, m);
        p.known = ['r-0-0', 'r-1-0', null];
        p.soup = 5;
        p.storage.push(ingredient('wine', 2), ingredient('bread', 3), 's-bread-0', 's-fish-0');
        if (c.id.endsWith('-fanatic')) {
            s.rumors = [c.id, 'carrot-fanatic', 'meat-fanatic'].filter((id, i, a) => a.indexOf(id) === i);
            const r = result(s), i = FOODS.findIndex(f => c.id === f + '-fanatic');
            assert.equal(r.finalQuality[i], 10, c.id);
            assert.equal(r.best[i], 1, c.id);
        }
        else
            assert.equal(rumor(s, c.id), expected[c.id], c.id);
    }
    const s = fixture('mouse');
    s.players[0].critic = { ...emptyMeal(), items: [item('cheese', 5)] };
    s.players[1].critic = { ...emptyMeal(), items: [item('cheese', 5, 1)] };
    assert.equal(scoreFinal(s).a.best[2], 3);
    assert.equal(scoreFinal(s).b.best[2], 3);
});
test('confirmed empty-course ruling and printed-value Pampered are distinct from critic modified values', () => {
    const s = fixture('rabbit');
    assert.deepEqual(result(s).best, [0, 0, 0, 0, 0, 0, 0]);
    assert.equal(rumor(s, 'odd-tastes'), 0);
    assert.equal(rumor(s, 'nocturnal'), 0);
    const m = { ...emptyMeal(), items: FOODS.map(f => item(f, f === 'carrot' ? 3 : 5)) };
    own(s, m);
    assert.equal(rumor(s, 'extremely-pampered'), 0);
    m.items[1] = item('carrot', 5);
    assert.equal(rumor(s, 'extremely-pampered'), 2);
});
test('all10 restaurateurs: physical component use, challenge thresholds, endgame printed bonus', () => {
    for (const c of RESTAURATEURS) {
        const s = fixture('capybara');
        s.players[0].restaurateur = c.id;
        assert.equal(result(s).bonus, c.bonus, c.id);
    }
    let s = fixture('mouse');
    s.round = 3;
    s.challenges = ['coastal-fusion', 'savory-stack', 'wine-dine'];
    let m = { ...emptyMeal(), items: [item('fish', 7), item('cheese', 7), item('carrot', 7)] }, p = own(s, m);
    p.restaurateur = 'falcon-brown';
    assert.equal(scoreChallenge(s, p, m, 0).bonus, 1);
    m.soup = 1;
    assert.equal(scoreChallenge(s, p, m, 0).bonus, 0);
    p.restaurateur = 'graham-elephant';
    m = { ...emptyMeal(), items: [{ ...item('fish', 7), spice: 's-fish-0' }, item('cheese', 7), item('carrot', 7)] };
    assert.equal(scoreChallenge(s, p, m, 0).bonus, 1);
    p.restaurateur = 'bobcat-flay';
    assert.equal(baseValue(s, p, ingredient('fish', 2), true), 5);
    assert.equal(baseValue(s, p, ingredient('bread', 2), true), 2);
    p.restaurateur = 'goatn-ramsay';
    assert.equal(baseValue(s, p, ingredient('carrot', 2), true), 4);
    s.critic = 'rabbit';
    assert.equal(baseValue(s, p, ingredient('carrot', 2), true), 8);
    s.critic = 'mouse';
    p.restaurateur = 'heron-sanchez';
    m = { ...emptyMeal(), items: [{ ...item('fish', 7), spice: 's-fish-0' }, { ...item('fish', 6), spice: 's-fish-0' }, item('carrot', 3), item('cheese', 3)] };
    p.storage = [...new Set(m.items.flatMap(a => [a.token, ...a.spice ? [a.spice] : []]))];
    assert.doesNotThrow(() => validateMeals(s, p, [m, emptyMeal(), emptyMeal()]));
    const second = { ...emptyMeal(), items: [{ ...item('fish', 5), spice: 's-fish-0' }, { ...item('mushroom', 5) }, item('wine', 5)] };
    p.storage.push(...second.items.map(a => a.token));
    assert.throws(() => validateMeals(s, p, [m, second, emptyMeal()]));
    p.restaurateur = 'julia-wild';
    m = { ...emptyMeal(), items: [{ ...item('fish', 7), spice: 's-cheese-0' }, item('carrot', 3), item('cheese', 3)] };
    p.storage = [...m.items.flatMap(a => [a.token, ...a.spice ? [a.spice] : []])];
    assert.doesNotThrow(() => validateMeals(s, p, [m, emptyMeal(), emptyMeal()]));
});
test('meal validation: Hold drops rightmost requirement, real ingredient mandatory, soup substitution, reuse and forged values rejected', () => {
    const s = fixture('mouse');
    s.round = 3;
    s.challenges = ['coastal-fusion', 'savory-stack', 'wine-dine'];
    const p = s.players[0];
    p.soup = 4;
    p.storage = [ingredient('mushroom', 7)];
    let m = { ...emptyMeal(), items: [item('mushroom', 7)], soup: 1 };
    assert.doesNotThrow(() => validateMeals(s, p, [emptyMeal(), emptyMeal(), m]));
    assert.throws(() => validateMeals(s, p, [m, emptyMeal(), emptyMeal()]));
    assert.throws(() => validateMeals(s, p, [{ ...emptyMeal(), soup: 6 }, emptyMeal(), emptyMeal()]));
    p.storage.push(ingredient('fish', 7), ingredient('cheese', 7), ingredient('carrot', 7));
    m = { ...emptyMeal(), items: [item('fish', 7), item('cheese', 7), item('carrot', 7)] };
    assert.doesNotThrow(() => validateMeals(s, p, [m, emptyMeal(), emptyMeal()]));
    assert.throws(() => validateMeals(s, p, [m, m, emptyMeal()]));
    assert.throws(() => validateMeals(s, p, [{ ...m, quality: 999 } as Meal, emptyMeal(), emptyMeal()]));
});
test('recovery rejects invalid mode-independent state, fake deck/token, bad queue target and forged winner', () => { const s = createInitialState([{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], seeded(12)); assert.ok(validateCKState(s)); for (const change of [(x: CKState) => x.bag.push(x.bag[0]), (x: CKState) => x.config.count = 5, (x: CKState) => x.rumors[0] = 'invented', (x: CKState) => x.tasks.push({ kind: 'pick', visit: 'missing' })]) {
    const x = structuredClone(s);
    change(x);
    assert.equal(validateCKState(x), false);
} });
test('final ranking uses stars then raw quality then hat priority, independent of duplicate names', () => {
    const run = (qA: number, qB: number, bonus: number, priority: string[]) => { let s = fixture('capybara'); s.rumors = ['carrot-fanatic', 'fish-fanatic', 'mushroom-fanatic']; s.priority = priority; s.players[0].stars = bonus; s.players[0].challengeStars = bonus; for (const [i, p] of s.players.entries()) {
        p.name = 'Same';
        p.critic = null;
        p.storage = [ingredient('bread', i ? qB : qA, i && qA === qB ? 1 : 0)];
    } for (const p of s.players) {
        s = applyAction(s, p.id, { type: 'ck-final', epoch: decisionKey(s), meal: { ...emptyMeal(), items: [{ token: p.storage[0], as: 'bread' }] } });
    } return s; };
    let s = run(2, 3, 1, ['a', 'b']);
    assert.equal(s.players[0].score!.total, s.players[1].score!.total);
    assert.deepEqual(s.winners, ['b']);
    assert.match(s.players[1].score!.rankReason, /คุณภาพมื้อสุดท้าย/);
    s = run(3, 3, 0, ['b', 'a']);
    assert.deepEqual(s.winners, ['b']);
    assert.match(s.players[1].score!.rankReason, /ลำดับหมวก/);
    s = run(2, 7, 0, ['a', 'b']);
    assert.deepEqual(s.winners, ['b']);
    assert.equal(s.players[1].score!.rankReason, 'ดาวรวมสูงสุด');
});
test('simultaneous challenge returns consumed tokens only once; used soup/bisque return to supply', () => {
    let s = fixture('capybara');
    s.round = 3;
    s.phase = 'challenge';
    s.challenges = ['coastal-fusion', 'savory-stack', 'wine-dine'];
    const m = { ...emptyMeal(), items: [item('fish', 7)], soup: 1, bisque: 1 };
    const a = s.players[0];
    a.meals = null;
    a.critic = null;
    a.storage = [ingredient('fish', 7)];
    a.soup = 1;
    a.bisque = 1;
    s.players[1].meals = null;
    s.players[1].critic = null;
    const before = s.bag.length, stock = s.bisqueSupply;
    s = applyAction(s, 'a', { type: 'ck-meals', epoch: decisionKey(s), meals: [m, emptyMeal(), emptyMeal()] });
    assert.equal(s.phase, 'challenge');
    assert.equal(s.bag.length, before);
    assert.equal(s.players[0].soup, 1);
    s = applyAction(s, 'b', { type: 'ck-meals', epoch: decisionKey(s), meals: [emptyMeal(), emptyMeal(), emptyMeal()] });
    assert.equal(s.phase, 'challenge-results');
    assert.equal(s.players[0].storage.length, 0);
    assert.equal(s.players[0].soup, 0);
    assert.equal(s.players[0].bisque, 0);
    assert.equal(s.bisqueSupply, stock + 1);
    assert.equal(s.bag.length, before + 1);
});
test('Martha adds two stars only for three successfully served challenges in the same day', () => {
    for (const serveAll of [false, true]) {
        let s = fixture('mouse');
        s.round = 3;
        s.phase = 'challenge';
        s.challenges = ['coastal-fusion', 'savory-stack', 'wine-dine'];
        const p = s.players[0];
        p.restaurateur = 'martha-shrewart';
        p.meals = null;
        s.players[1].meals = null;
        const meals: Meal[] = [{ ...emptyMeal(), items: [item('fish', 7), item('cheese', 7), item('carrot', 7)] }, { ...emptyMeal(), items: [item('meat', 6), item('mushroom', 6), item('cheese', 6)] }, serveAll ? { ...emptyMeal(), items: [item('mushroom', 5), item('wine', 5)] } : emptyMeal()];
        p.storage = meals.flatMap(m => m.items.map(a => a.token));
        const expected = meals.reduce((n, m, i) => n + scoreChallenge(s, p, m, i).stars, 0) + (serveAll ? 2 : 0);
        s = applyAction(s, 'a', { type: 'ck-meals', epoch: decisionKey(s), meals });
        s = applyAction(s, 'b', { type: 'ck-meals', epoch: decisionKey(s), meals: [emptyMeal(), emptyMeal(), emptyMeal()] });
        assert.equal(s.players[0].challengeStars, expected);
    }
});

test('optional wine data must be an array; null/false/zero/empty string never become persisted meal drafts',()=>{for(const wine of [null,false,0,'',{}])assert.equal(validateMealShape({...emptyMeal(),wine}),false);assert.equal(validateMealShape({...emptyMeal(),wine:[]}),true);});
