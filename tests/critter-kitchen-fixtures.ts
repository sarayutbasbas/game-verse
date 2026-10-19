import { TOKEN, FOODS, CHALLENGE, BASE_CHEFS, ZOU } from '../src/games/critter-kitchen/data.js';
import { getLegalActions, decisionKey, chefs, applyAction, createInitialState } from '../src/games/critter-kitchen/engine.js';
import { emptyMeal, mealQuality } from '../src/games/critter-kitchen/scoring.js';
import type { CKState, CKAction, Player, Meal } from '../src/games/critter-kitchen/types.js';
export function seeded(seed: number) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }
export function criticMeal(s: CKState, p: Player): Meal { const pool = [...p.storage], m = emptyMeal(); for (const food of FOODS) {
    const id = pool.filter(id => TOKEN[id].kind === 'ingredient' && TOKEN[id].food === food).sort((a, b) => TOKEN[b].value! - TOKEN[a].value!)[0];
    if (id) {
        m.items.push({ token: id, as: food });
        pool.splice(pool.indexOf(id), 1);
    }
} for (const a of m.items) {
    const spice = pool.find(id => TOKEN[id].kind === 'spice' && (TOKEN[id].food === a.as || TOKEN[id].food === 'all' || p.restaurateur === 'julia-wild'));
    if (spice) {
        a.spice = spice;
        pool.splice(pool.indexOf(spice), 1);
    }
} return m; }
export function challengeMeals(s: CKState, p: Player) {
    let pool = [...p.storage], soup = p.soup, bisque = p.bisque;
    const meals: Meal[] = [];
    for (let i = 0; i < 3; i++) {
        const required = CHALLENGE[s.challenges[(s.round === 3 ? 0 : 3) + i]].foods.slice(0, i === 2 ? 2 : 3), m = emptyMeal(), used: string[] = [];
        for (const food of required) {
            const id = pool.filter(t => TOKEN[t].kind === 'ingredient' && TOKEN[t].food === food).sort((a, b) => TOKEN[b].value! - TOKEN[a].value!)[0];
            if (id) {
                m.items.push({ token: id, as: food });
                pool.splice(pool.indexOf(id), 1);
                used.push(id);
            }
        }
        const missing = required.filter(f => !m.items.some(a => a.as === f)).length;
        let can = m.items.length > 0;
        for (let n = 0; n < missing; n++) {
            if (soup > m.soup)
                m.soup++;
            else if (bisque > m.bisque)
                m.bisque++;
            else
                can = false;
        }
        while (can && mealQuality(s, p, m, true) < 6) {
            if (soup > m.soup)
                m.soup++;
            else if (bisque > m.bisque)
                m.bisque++;
            else
                can = false;
        }
        if (can) {
            soup -= m.soup;
            bisque -= m.bisque;
            meals.push(m);
        }
        else {
            pool.push(...used);
            meals.push(emptyMeal());
        }
    }
    return meals;
}
export function botAction(s: CKState, random: () => number): {
    actor: string;
    action: CKAction;
} {
    if (s.phase === 'restaurateurs') {
        const p = s.players.find(p => p.offers.length)!;
        return { actor: p.id, action: { type: 'ck-restaurateur', card: p.offers[0] } };
    }
    if(s.challengeReveal!==undefined)return {actor:s.players[0].id,action:{type:'ck-continue-planning',round:s.round,challenge:s.challengeReveal}};
    if (s.phase === 'planning') {
        const p = s.players.find(p => !p.plan)!, locs = s.config.locations.map(l => l.id);
        for (let i = locs.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [locs[i], locs[j]] = [locs[j], locs[i]];
        }
        return { actor: p.id, action: { type: 'ck-plan', epoch: decisionKey(s), plan: Object.fromEntries(chefs(p).map((id, i) => [id, locs[i]])) } };
    }
    if (s.phase === 'running')
        return { actor: s.players[0].id, action: { type: 'ck-run' } };
    if (s.phase === 'shopping') {
        const p = s.players.find(p => p.id === s.pending!.actor)!, legal = getLegalActions(s, p.id);
        const action = legal.find(a => a.type === 'ck-pick' && a.item.startsWith('zous:')) ?? legal.filter((a): a is Extract<CKAction, {
            type: 'ck-pick';
        }> => a.type === 'ck-pick').sort((a, b) => (TOKEN[b.item]?.value ?? (b.item === 'bisque' ? 3 : 0)) - (TOKEN[a.item]?.value ?? (a.item === 'bisque' ? 3 : 0)))[0] ?? legal.find(a => a.type === 'ck-consolation' && a.reward === 'soup') ?? legal[0];
        if (!action)
            throw Error('No pending option');
        return { actor: p.id, action };
    }
    if (s.phase === 'challenge') {
        const p = s.players.find(p => !p.meals)!;
        return { actor: p.id, action: { type: 'ck-meals', epoch: decisionKey(s), meals: challengeMeals(s, p) } };
    }
    if (s.phase === 'challenge-results')
        return { actor: s.players[0].id, action: { type: s.resultsRevealed===false?'ck-reveal-results':'ck-next' } };
    if (s.phase === 'refrigeration') {
        const p = s.players.find(p => !p.fridgeReady)!;
        const free = p.storage.filter(t => s.critic === 'raccoon' && TOKEN[t].kind === 'ingredient' && TOKEN[t].value === 2), normal = p.storage.filter(t => !free.includes(t)).sort((a, b) => (TOKEN[b].value ?? 0) - (TOKEN[a].value ?? 0));
        return { actor: p.id, action: { type: 'ck-fridge', epoch: decisionKey(s), keep: [...free, ...normal.slice(0, s.round === 3 ? 5 : 10)] } };
    }
    if (s.phase === 'critic') {
        const p = s.players.find(p => !p.critic)!;
        return { actor: p.id, action: { type: 'ck-final', epoch: decisionKey(s), meal: criticMeal(s, p) } };
    }
    throw Error('Game finished');
}

/** Ability fixtures start after the explicit shared opening briefing. */
export function createPlanningFixture(...args: Parameters<typeof createInitialState>): CKState {
 const state=createInitialState(...args);
 return state.challengeReveal===undefined?state:applyAction(state,state.players[0].id,{type:'ck-continue-planning',round:state.round,challenge:state.challengeReveal});
}
