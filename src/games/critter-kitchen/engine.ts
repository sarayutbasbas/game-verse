import {resolveTeamColors,TEAM_COLORS} from './team-colors.js';
import { TOKENS, TOKEN, FOODS, BASE_CHEFS, ZOUS, ZOU, CRITICS, CRITIC, CHALLENGES, RESTAURATEURS, RESTAURATEUR, RUMORS, RUMOR, SPECIAL_ALLSPICE, boardConfiguration, type LocationId } from './data.js';
import { validateMeals, scoreChallenge, scoreFinal, baseValue } from './scoring.js';
import type { CKState, CKAction, CKView, Player, Plan, Visit, Task, Meal, DisplayMode } from './types.js';
export const decisionKey = (s: CKState) => `${s.matchId ?? 'fixture'}:${s.round}:${s.phase}`;
function shuffle<T>(a: T[], r: () => number) { for (let i = a.length - 1; i > 0; i--) {
    const value = r();
    if (!Number.isFinite(value) || value < 0 || value >= 1)
        throw Error('แหล่งสุ่มไม่ถูกต้อง');
    const j = Math.floor(value * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
} return a; }
export const chefs = (p: Player) => [...BASE_CHEFS.map(c => c.id), ...p.activeSous ? [p.activeSous] : []];
const own = (s: CKState, id: string) => { const p = s.players.find(p => p.id === id); if (!p)
    throw Error('ไม่พบผู้เล่นในเกม'); return p; };
const visit = (s: CKState, id: string) => { const v = s.visits.find(v => v.id === id); if (!v)
    throw Error('ไม่พบเชฟ'); return v; };
const trace = (s: CKState, text: string) => { s.log.push(text); s.log = s.log.slice(-14); };
export function emptyPlayer(id: string, name: string): Player { return { id, name, storage: [], soup: 1, bisque: 0, known: [null, null, null], spentRumors: [], stars: 0, challengeStars: 0, chefStars: 0, activeSous: null, nextSous: null, restaurateur: null, offers: [], extraRumor: null, plan: null, meals: null, critic: null, fridgeReady: false }; }
export function createInitialState(seats: {
    id: string;
    name: string;
}[], random: () => number = Math.random, options: {
    restaurateurs?: boolean;
    tutorial?: boolean;
} = {}): CKState {
    const config = boardConfiguration(seats.length);
    if (new Set(seats.map(p => p.id)).size !== seats.length)
        throw Error('ที่นั่งผู้เล่นซ้ำ');
    const rumors = shuffle(RUMORS.filter(c => !options.tutorial || !c.advanced).map(c => c.id), random), challenges = shuffle(CHALLENGES.map(c => c.id), random), critics = shuffle(CRITICS.map(c => c.id), random), rest = shuffle(RESTAURATEURS.map(c => c.id), random);
    const critic = options.tutorial ? 'mouse' : critics.pop()!;
    const s: CKState = { houseRules: { emptyCourses: true }, phase: options.restaurateurs ? 'restaurateurs' : 'planning', players: seats.map(p => emptyPlayer(p.id, p.name)), config, round: 1, priority: shuffle(seats.map(p => p.id), random), bag: shuffle(TOKENS.map(t => t.id), random), discard: [], locations: Object.fromEntries(config.locations.map(l => [l.id, []])), challenges: challenges.splice(0, 6), revealed: 0, critic, rumors: rumors.splice(0, 3), unusedRumors: [...rumors], excludedRumors: RUMORS.filter(c => options.tutorial && c.advanced).map(c => c.id), publicRumors: [false, false, false], zousDeck: shuffle(ZOUS.map(c => c.id), random), academySous: null, usedZous: [], unusedChallenges: challenges, unusedCritics: critics.filter(c => c !== critic), unusedRestaurateurs: rest, bisqueAvailable: false, bisqueSupply: 7, seventhAvailable: false, visits: [], tasks: [], location: null, pending: null, firstPick: null, tieLeader: null, ming: false, sequence: 0, event: { kind: 'setup' }, log: [], winners: [] };
    if (options.restaurateurs)
        for (const p of s.players)
            p.offers = s.unusedRestaurateurs.splice(0, 2);
    else
        startRound(s);
    const colors=shuffle([...TEAM_COLORS],random);
    s.teamColors=Object.fromEntries(s.players.map((player,index)=>[player.id,colors[index]]));
    return s;
}
function draw(s: CKState): string | undefined { while (s.bag.length) {
    const id = s.bag.pop()!, t = TOKEN[id];
    if (t.kind === 'rumor' && t.rumor !== 3 && s.publicRumors[t.rumor!]) {
        s.discard.push(id);
        continue;
    }
    return id;
} return undefined; }
function startRound(s: CKState) {
    s.phase = 'planning';
    s.location = null;
    s.pending = null;
    s.visits = [];
    s.tasks = [];
    s.firstPick = null;
    s.tieLeader = null;
    s.ming = false;
    for (const p of s.players) {
        p.plan = null;
        p.meals = null;
        p.critic = null;
        p.fridgeReady = false;
    }
    if (s.round < 7)
        s.revealed++;
    if (!s.bisqueAvailable && s.bisqueSupply) {
        s.bisqueAvailable = true;
        s.bisqueSupply--;
    }
    for (const l of s.config.locations)
        if (!['soup', 'midnight'].includes(l.id))
            for (let i = 0; i < l.slots; i++) {
                const t = draw(s);
                if (t)
                    s.locations[l.id].push(t);
            }
    if (s.round === 7) {
        s.academySous = null;
        s.seventhAvailable = true;
    }
    else
        s.academySous = s.zousDeck.pop() ?? null;
    s.event = { kind: 'round' };
    trace(s, `รอบ ${s.round} • วางแผนลับพร้อมกัน`);
}
function moveBack(s: CKState, id: string) { if (s.ming)
    return; s.priority = s.priority.filter(p => p !== id); s.priority.push(id); }
function moveFront(s: CKState, id: string) { if (s.ming)
    return; s.priority = s.priority.filter(p => p !== id); s.priority.unshift(id); }
function rank(s: CKState, a: Visit, b: Visit) { return a.capacity - b.capacity || s.priority.indexOf(a.actor) - s.priority.indexOf(b.actor); }
function eligible(s: CKState, p: Player, id: string) { const t = TOKEN[id]; return !!t && (t.kind !== 'rumor' || (t.rumor === 3 ? p.known.some(x => !x) : !p.known[t.rumor!])); }
export function pickChoices(s: CKState, p: Player, loc: LocationId) { const choices = s.locations[loc].filter(t => eligible(s, p, t)); if (loc === 'soup') {
    choices.push('soup');
    if (s.bisqueAvailable)
        choices.push('bisque');
} if (loc === 'academy') {
    if (s.academySous)
        choices.push(`zous:${s.academySous}`);
    if (s.seventhAvailable)
        choices.push(SPECIAL_ALLSPICE);
} return choices; }
function collect(s: CKState, p: Player, token: string, v?: Visit) {
    const t = TOKEN[token];
    if (!t)
        throw Error('ไม่พบโทเคน');
    if (v)
        v.gained++;
    if (t.kind === 'rumor') {
        if (t.rumor === 3) {
            s.pending = { kind: 'rumor', actor: p.id, token, visit: v?.id };
            return;
        }
        p.known[t.rumor!] = token;
        if (s.players.every(p => p.known[t.rumor!]))
            s.publicRumors[t.rumor!] = true;
    }
    else
        p.storage.push(token);
}
function bagGift(s: CKState, p: Player, random: () => number, v?: Visit) { const rejected: string[] = []; let token: string | undefined; while ((token = draw(s))) {
    if (eligible(s, p, token))
        break;
    rejected.push(token);
    token = undefined;
} if (rejected.length) {
    s.bag.push(...rejected);
    shuffle(s.bag, random);
} if (token)
    collect(s, p, token, v); }
function beforePick(s: CKState, v: Visit) { if (v.started)
    return; v.started = true; if (v.chef === 'geoffrey') {
    const t = draw(s);
    if (t)
        s.locations[v.loc].push(t);
} }
function after(s: CKState, v: Visit) {
    const p = own(s, v.actor);
    v.done = true;
    if (v.chef === 'newton' && v.newton) {
        p.soup += 3;
        v.gained += 3;
    }
    if (v.chef === 'lily') {
        if (s.bisqueAvailable) {
            s.bisqueAvailable = false;
            p.bisque++;
        }
        else
            p.soup++;
        v.gained++;
    }
    if (v.chef === 'carol' && s.priority.at(-1) === p.id) {
        p.stars++;
        p.chefStars++;
    }
    if (v.chef === 'ginger')
        s.tasks.unshift({ kind: 'bag-gift', actor: p.id, visit: v.id });
    if (v.chef === 'penny')
        s.tasks.unshift({ kind: 'extra', visit: v.id, loc: 'soup', fallback: false });
    if (v.chef === 'mandy')
        s.tasks.unshift({ kind: 'extra', visit: v.id, loc: v.loc, fallback: true });
    // Consolation happens once all of this chef's collection effects have completed.
    s.tasks.splice(v.chef === 'ginger' || v.chef === 'penny' || v.chef === 'mandy' ? 1 : 0, 0, { kind: 'finish', visit: `consolation:${v.id}` });
}
function endRound(s: CKState) {
    for (const p of s.players) {
        if (p.activeSous)
            s.usedZous.push(p.activeSous);
        p.activeSous = null;
    }
    // End-of-round restaurateur effects precede preparing meals in the End of Round step.
    for (const p of s.players)
        if (p.restaurateur === 'marcus-roostersson') {
            const pos = s.priority.indexOf(p.id);
            if (pos === 0)
                s.tasks.push({ kind: 'bag-gift', actor: p.id });
            else
                [s.priority[pos - 1], s.priority[pos]] = [s.priority[pos], s.priority[pos - 1]];
        }
    s.tasks.push({ kind: 'prepare' });
}
function prepare(s: CKState) {
    if (s.round === 3 || s.round === 6) {
        s.phase = 'challenge';
        trace(s, 'เตรียม Challenge ทั้ง 3 จานพร้อมกัน');
    }
    else if (s.round === 7) {
        s.phase = 'critic';
        trace(s, 'เตรียมมื้อ 7 คอร์สให้ผู้วิจารณ์');
    }
    else {
        s.round++;
        for (const p of s.players) {
            p.activeSous = p.nextSous;
            p.nextSous = null;
        }
        startRound(s);
    }
}
function settle(s: CKState, random: () => number) {
    let guard = 0;
    while (!s.pending && s.tasks.length) {
        if (++guard > 1000)
            throw Error('คิวการประมวลผลไม่ถูกต้อง');
        const task = s.tasks.shift()!;
        switch (task.kind) {
            case 'location': {
                s.location = task.loc;
                s.firstPick = null;
                s.tieLeader = null;
                s.ming = s.visits.some(v => v.loc === task.loc && v.chef === 'ming');
                if (task.loc === 'midnight')
                    for (let i = 0; i < s.config.locations.find(l => l.id === 'midnight')!.slots; i++) {
                        const t = draw(s);
                        if (t)
                            s.locations.midnight.push(t);
                    }
                const at = s.visits.filter(v => v.loc === task.loc).sort((a, b) => rank(s, a, b));
                for (const v of at) {
                    if (v.chef === 'chrissy' && at.length === 1)
                        v.limit = 3;
                    if (v.chef === 'snooze')
                        for (let n = 0; n < 2; n++) {
                            const t = draw(s);
                            if (t)
                                s.locations[task.loc].push(t);
                        }
                    if (v.chef === 'dash')
                        moveFront(s, v.actor);
                }
                const otto = at.find(v => v.chef === 'otto');
                if (otto && at.filter(v => v.capacity === 2).length >= 2) {
                    const gifts = at.filter(v => v.capacity === 2).map(v => ({ kind: 'bag-gift' as const, actor: v.actor, visit: v.id }));
                    s.tasks.unshift(...gifts);
                }
                s.event = { kind: 'location', location: task.loc };
                break;
            }
            case 'queues': {
                const at = s.visits.filter(v => v.loc === task.loc), groups: number[] = [0, 1, 2, 3];
                const picks: Task[] = [];
                for (const n of groups) {
                    const group = at.filter(v => (v.chef === 'ming' ? 0 : v.capacity) === n).sort((a, b) => rank(s, a, b));
                    if (!group.length)
                        continue;
                    const max = Math.max(...group.map(v => v.limit));
                    for (let i = 0; i < max; i++)
                        for (const v of group)
                            if (i < v.limit)
                                picks.push({ kind: 'pick', visit: v.id });
                }
                s.tasks.unshift(...picks);
                break;
            }
            case 'pick': {
                const v = visit(s, task.visit);
                if (v.done)
                    break;
                beforePick(s, v);
                const p = own(s, v.actor), choices = pickChoices(s, p, v.loc);
                if (!choices.length) {
                    after(s, v);
                    break;
                }
                s.pending = { kind: 'pick', actor: p.id, visit: v.id, loc: v.loc, extra: false, fallback: false };
                break;
            }
            case 'bag-gift':
                bagGift(s, own(s, task.actor), random, task.visit ? s.visits.find(v => v.id === task.visit) : undefined);
                break;
            case 'extra': {
                const v = visit(s, task.visit), p = own(s, v.actor);
                if (pickChoices(s, p, task.loc).length)
                    s.pending = { kind: 'pick', actor: p.id, visit: v.id, loc: task.loc, extra: true, fallback: task.fallback };
                else if (task.fallback)
                    s.tasks.unshift({ kind: 'bag-gift', actor: p.id, visit: v.id });
                break;
            }
            case 'finish': {
                if (task.visit.startsWith('consolation:')) {
                    const v = visit(s, task.visit.slice(12));
                    if (!v.gained)
                        s.pending = { kind: 'consolation', actor: v.actor, visit: v.id };
                }
                else
                    after(s, visit(s, task.visit));
                break;
            }
            case 'clean': {
                const leftovers = s.locations[task.loc].splice(0);
                for (const token of leftovers) {
                    if (TOKEN[token].kind === 'rumor')
                        s.discard.push(token);
                    else
                        s.locations[task.loc === 'academy' ? 'soup' : 'academy'].push(token);
                }
                if (task.loc === 'academy' && s.seventhAvailable) {
                    s.locations.soup.push(SPECIAL_ALLSPICE);
                    s.seventhAvailable = false;
                }
                if (task.loc === 'academy' && s.academySous) {
                    s.usedZous.push(s.academySous);
                    s.academySous = null;
                }
                break;
            }
            case 'end-round':
                endRound(s);
                break;
            case 'prepare':
                prepare(s);
                break;
        }
    }
}
function run(s: CKState, random: () => number) {
    s.phase = 'shopping';
    s.teamColors??=resolveTeamColors(s.priority);
    s.pickups=[];
    s.marketStock=Object.fromEntries(s.config.locations.map(loc=>[loc.id,[...s.locations[loc.id],...loc.id==='soup'?['soup',...s.bisqueAvailable?['bisque']:[]]:[],...loc.id==='academy'?[...s.academySous?['zous:'+s.academySous]:[],...s.seventhAvailable?[SPECIAL_ALLSPICE]:[]]:[]]]));
    s.visits = [];
    for (const p of s.players)
        for (const chef of chefs(p)) {
            const c = BASE_CHEFS.find(c => c.id === chef) ?? ZOU[chef], capacity = c.capacity;
            s.visits.push({ id: `${p.id}:${chef}`, actor: p.id, chef, loc: p.plan![chef], capacity, limit: capacity, used: 0, gained: 0, done: false, started: false, newton: false });
        }
    s.tasks = s.config.locations.flatMap(l => [{ kind: 'location' as const, loc: l.id }, { kind: 'queues' as const, loc: l.id }, { kind: 'clean' as const, loc: l.id }]);
    s.tasks.push({ kind: 'end-round' });
    settle(s, random);
}
function tieOnPick(s: CKState, v: Visit) { if (s.firstPick)
    return; const group = s.visits.filter(x => x.loc === v.loc && (x.chef === 'ming' ? 0 : x.capacity) === (v.chef === 'ming' ? 0 : v.capacity)).sort((a, b) => rank(s, a, b)); s.firstPick = v.id; if (group.length > 1 && group[0].id === v.id)
    moveBack(s, v.actor); }
function take(s: CKState, item: string, random: () => number) {
    const d = s.pending!;
    if (d.kind !== 'pick')
        throw Error('ยังไม่ถึงขั้นเลือกของ');
    const p = own(s, d.actor), v = visit(s, d.visit);
    if (!pickChoices(s, p, d.loc).includes(item))
        throw Error('เลือกของที่ยังมีและคุณรับได้');
    s.pending = null;
    if (!d.extra) {
        tieOnPick(s, v);
        v.used++;
    }
    if (item === 'soup') {
        p.soup++;
        v.gained++;
    }
    else if (item === 'bisque') {
        s.bisqueAvailable = false;
        p.bisque++;
        v.gained++;
    }
    else if (item.startsWith('zous:')) {
        p.nextSous = s.academySous;
        s.academySous = null;
        v.gained++;
    }
    else if (item === SPECIAL_ALLSPICE) {
        s.seventhAvailable = false;
        const i = s.locations[d.loc].indexOf(item);
        if (i >= 0)
            s.locations[d.loc].splice(i, 1);
        p.storage.push(item);
        v.gained++;
    }
    else {
        if (v.chef === 'newton' && TOKEN[item].kind === 'ingredient') {
            const min = Math.min(...s.locations[d.loc].filter(t => TOKEN[t].kind === 'ingredient').map(t => baseValue(s, p, t)));
            v.newton = baseValue(s, p, item) === min;
        }
        s.locations[d.loc].splice(s.locations[d.loc].indexOf(item), 1);
        collect(s, p, item, v);
    }
    if (!d.extra && v.used >= v.limit) {
        if (s.pending)
            s.tasks.unshift({ kind: 'finish', visit: v.id });
        else
            after(s, v);
    }
    (s.pickups??=[]).push({actor:p.id,chef:v.chef,loc:d.loc,item,sequence:s.sequence});
    s.event = { kind: 'pick', actor: p.id, location: d.loc };
    trace(s, `${p.name} • ${v.chef} รับของที่ ${d.loc}`);
    settle(s, random);
}
function validatePlan(s: CKState, p: Player, plan: any): plan is Plan { const ids = chefs(p), keys = plan && typeof plan === 'object' && !Array.isArray(plan) ? Object.keys(plan) : []; return keys.length === ids.length && ids.every(id => keys.includes(id)) && new Set(Object.values(plan)).size === ids.length && Object.values(plan).every(loc => s.config.locations.some(l => l.id === loc)); }
export function getLegalActions(s: CKState, id: string): CKAction[] {
    const p = s.players.find(p => p.id === id);
    if (!p)return [];
    if(s.phase==='finished')return s.resultsRevealed===false?[{type:'ck-reveal-results'}]:[];
    if (s.phase === 'restaurateurs')
        return p.offers.map(card => ({ type: 'ck-restaurateur', card }));
    if (s.phase === 'planning')
        return p.plan ? [{ type: 'ck-uncommit', epoch: decisionKey(s) }] : [];
    if (s.phase === 'running')
        return [{ type: 'ck-run' }];
    if (s.phase === 'challenge-results')
        return s.resultsRevealed===false?[{type:'ck-reveal-results'}]:[{ type: 'ck-next' }];
    if (s.pending?.actor === id) {
        const d = s.pending;
        if (d.kind === 'pick') {
            const v = visit(s, d.visit);
            return [...pickChoices(s, p, d.loc).map(item => ({ type: 'ck-pick' as const, item })), ...!d.extra && !v.gained ? [{ type: 'ck-leave' as const }] : []];
        }
        if (d.kind === 'consolation')
            return [...(['soup', 'skip'] as const).map(reward => ({ type: 'ck-consolation' as const, reward })), ...p.restaurateur === 'anthony-boardain' ? [{ type: 'ck-consolation' as const, reward: 'bag' as const }] : []];
        if (d.kind === 'rumor')
            return p.known.flatMap((x, index) => x ? [] : [{ type: 'ck-rumor' as const, index }]);
    }
    return [];
}
function assertIntent(a: any, keys: string[]) { if (!a || typeof a !== 'object' || Array.isArray(a) || Object.keys(a).sort().join() !== keys.sort().join())
    throw Error('รูปแบบคำสั่งไม่ถูกต้อง'); }
export function applyAction(state: CKState, id: string, action: CKAction, random: () => number = Math.random): CKState {
    const player = own(state, id);
    if (state.phase === 'finished' && action?.type!=='ck-reveal-results')
        throw Error('เกมจบแล้ว');
    const complex = ['ck-plan', 'ck-meals', 'ck-fridge', 'ck-final'].includes(action?.type);
    if (!complex && !getLegalActions(state, id).some(a => Object.keys(a).sort().join() === Object.keys(action).sort().join() && Object.entries(a).every(([k, v]) => JSON.stringify((action as any)[k]) === JSON.stringify(v))))
        throw Error('ยังทำรายการนี้ไม่ได้ กรุณาเลือกใหม่จากข้อมูลล่าสุด');
    if (complex) {
        assertIntent(action, action.type === 'ck-plan' ? ['type', 'epoch', 'plan'] : action.type === 'ck-meals' ? ['type', 'epoch', 'meals'] : action.type === 'ck-fridge' ? ['type', 'epoch', 'keep'] : ['type', 'epoch', 'meal']);
        if (!('epoch' in action) || action.epoch !== decisionKey(state))
            throw Error('รอบหรือขั้นตอนเปลี่ยนแล้ว กรุณาเลือกใหม่');
        if (action.type === 'ck-plan' && (state.phase !== 'planning' || player.plan || !validatePlan(state, player, action.plan)))
            throw Error('จัดเชฟทุกตัวไปคนละสถานที่ก่อนยืนยัน');
        if (action.type === 'ck-meals') {
            if (state.phase !== 'challenge' || player.meals)
                throw Error('ยังไม่ถึงขั้นเตรียม Challenge');
            validateMeals(state, player, action.meals);
        }
        if (action.type === 'ck-final') {
            if (state.phase !== 'critic' || player.critic)
                throw Error('ยังไม่ถึงขั้นเตรียมมื้อสุดท้าย');
            validateMeals(state, player, [action.meal], true);
        }
        if (action.type === 'ck-fridge') {
            if (state.phase !== 'refrigeration' || player.fridgeReady || !Array.isArray(action.keep) || action.keep.some(t => !player.storage.includes(t)) || new Set(action.keep).size !== action.keep.length || action.keep.filter(t => !(state.critic === 'raccoon' && TOKEN[t].kind === 'ingredient' && TOKEN[t].value === 2)).length > (state.round === 3 ? 5 : 10))
                throw Error('เลือกเก็บของไม่เกินความจุตู้เย็น');
        }
    }
    const s = structuredClone(state), p = own(s, id);
    s.teamColors=resolveTeamColors(s.players.map(p=>p.id),s.teamColors);
    s.sequence++;
    switch (action.type) {
        case 'ck-restaurateur':
            p.restaurateur = action.card;
            s.unusedRestaurateurs.push(...p.offers.filter(c => c !== action.card));
            p.offers = [];
            if (action.card === 'jamie-owliver')
                p.extraRumor = s.unusedRumors.pop() ?? null;
            if (s.players.every(p => p.restaurateur))
                startRound(s);
            break;
        case 'ck-plan':
            p.plan = structuredClone(action.plan);
            s.event = { kind: 'plan', actor: id };
            if (s.players.every(p => p.plan)) {
                s.phase = 'running';
                s.event = { kind: 'reveal' };
                trace(s, 'ทุกคนเปิดแผนพร้อมกัน • พร้อมเริ่มช้อป');
            }
            break;
        case 'ck-uncommit':
            p.plan = null;
            s.event = { kind: 'plan', actor: id };
            break;
        case 'ck-run':
            run(s, random);
            break;
        case 'ck-pick':
            take(s, action.item, random);
            break;
        case 'ck-leave': {
            const d = s.pending!;
            if (d.kind !== 'pick')
                throw Error('ไม่พบเชฟที่เลือก');
            s.pending = null;
            after(s, visit(s, d.visit));
            settle(s, random);
            break;
        }
        case 'ck-consolation': {
            const d = s.pending!;
            if (d.kind !== 'consolation')
                throw Error('ไม่พบเชฟ');
            s.pending = null;
            if (action.reward === 'soup') {
                p.soup++;
                visit(s, d.visit).gained++;
            }
            if (action.reward === 'bag')
                bagGift(s, p, random, visit(s, d.visit));
            settle(s, random);
            break;
        }
        case 'ck-rumor': {
            const d = s.pending!;
            if (d.kind !== 'rumor')
                throw Error('ไม่พบข่าวลือ');
            p.known[action.index] = d.token;
            s.pending = null;
            if (s.players.every(p => p.known[action.index]))
                s.publicRumors[action.index] = true;
            settle(s, random);
            break;
        }
        case 'ck-meals':
            p.meals = structuredClone(action.meals);
            if (s.players.every(p => p.meals)) {
                const results: NonNullable<CKState['challengeResults']> = {};
                for (const player of s.players) {
                    const used = validateMeals(s, player, player.meals!), scores = player.meals!.map((m, i) => scoreChallenge(s, player, m, i));
                    const bonus = player.restaurateur === 'martha-shrewart' && scores.every(x => x.stars > 0) ? 2 : 0;
                    player.stars += scores.reduce((n, x) => n + x.stars, 0) + bonus;
                    player.challengeStars += scores.reduce((n, x) => n + x.stars, 0) + bonus;
                    player.storage = player.storage.filter(t => !used.includes(t));
                    s.bag.push(...used);
                    for (const m of player.meals!) {
                        player.soup -= m.soup;
                        player.bisque -= m.bisque;
                        s.bisqueSupply += m.bisque;
                    }
                    results[player.id] = scores;
                }
                shuffle(s.bag, random);
                s.challengeResults = results;
                s.phase = 'challenge-results';
                s.resultsRevealed=false;
                s.event = { kind: 'challenge' };
                trace(s, `เปิด Challenge พร้อมกัน • จบวันที่ ${s.round === 3 ? 1 : 2}`);
            }
            break;
        case 'ck-reveal-results':
            s.resultsRevealed=true;
            s.event={kind:'effect',actor:id};
            break;
        case 'ck-next':
            s.phase = 'refrigeration';
            for (const player of s.players) {
                player.meals = null;
                player.fridgeReady = player.storage.filter(t => !(s.critic === 'raccoon' && TOKEN[t].kind === 'ingredient' && TOKEN[t].value === 2)).length <= (s.round === 3 ? 5 : 10);
            }
            if (s.players.every(p => p.fridgeReady)) {
                s.round++;
                for (const p of s.players) {
                    p.activeSous = p.nextSous;
                    p.nextSous = null;
                }
                startRound(s);
            }
            break;
        case 'ck-fridge': {
            const discarded = p.storage.filter(t => !action.keep.includes(t));
            s.bag.push(...discarded);
            shuffle(s.bag, random);
            p.storage = [...action.keep];
            p.fridgeReady = true;
            s.event = { kind: 'fridge', actor: id };
            if (s.players.every(p => p.fridgeReady)) {
                s.round++;
                for (const p of s.players) {
                    p.activeSous = p.nextSous;
                    p.nextSous = null;
                }
                startRound(s);
            }
            break;
        }
        case 'ck-final':
            p.critic = structuredClone(action.meal);
            if (s.players.every(p => p.critic)) {
                const scores = scoreFinal(s);
                for (const p of s.players) {
                    p.score = scores[p.id];
                    p.spentRumors = p.known.flatMap((t, i) => t && p.critic!.items.some(a => a.spice === t) ? [i] : []);
                }
                const sorted = [...s.players].sort((a, b) => scores[b.id].total - scores[a.id].total || scores[b.id].quality - scores[a.id].quality || s.priority.indexOf(a.id) - s.priority.indexOf(b.id));
                s.winners = [sorted[0].id];
                const winner = sorted[0], second = sorted[1], reason = winner.score!.total !== second.score!.total ? 'ดาวรวมสูงสุด' : winner.score!.quality !== second.score!.quality ? 'ดาวรวมเท่ากัน ตัดสินด้วยคุณภาพมื้อสุดท้าย' : 'ดาวและคุณภาพเท่ากัน ตัดสินด้วยลำดับหมวก';
                for (const p of s.players)
                    p.score!.rankReason = p.id === winner.id ? reason : 'เรียงตามดาว คุณภาพมื้อสุดท้าย และลำดับหมวก';
                s.publicRumors.fill(true);
                s.phase = 'finished';
                s.resultsRevealed=false;
                s.event = { kind: 'finish' };
                trace(s, 'เปิดมื้อสุดท้ายพร้อมกัน • รวมดาวและตัดสินผู้ชนะ');
            }
            break;
    }
    return s;
}
export const isFinished = (s: CKState) => s.phase === 'finished';
export function getDisplayView(s: CKState, code: string, revision: number, displayMode: DisplayMode = 'shared-table'): CKView {
    const showPlans = !['restaurateurs', 'planning'].includes(s.phase), showMeals = s.phase === 'challenge-results', finished = s.phase === 'finished';
    return { resultsRevealed:s.resultsRevealed, gameId: 'critter-kitchen', code, revision, teamColors:resolveTeamColors(s.players.map(p=>p.id),s.teamColors), marketStock:structuredClone(s.marketStock??{}), pickups:structuredClone(s.pickups??[]), phase: s.phase, config: structuredClone(s.config), displayMode, players: s.players.map(p => ({ id: p.id, name: p.name, committed: !!(s.phase === 'planning' ? p.plan : s.phase === 'challenge' ? p.meals : s.phase === 'critic' ? p.critic : s.phase === 'restaurateurs' ? p.restaurateur : false), known: p.known.map(Boolean), publicStorage: s.critic === 'raccoon' ? p.storage.filter(t => TOKEN[t].kind === 'ingredient' && TOKEN[t].value === 2) : [], stars: p.stars, activeSous: p.activeSous, nextSous: p.nextSous, restaurateur: p.restaurateur, plan: showPlans ? structuredClone(p.plan) : null, ...showMeals ? { meals: structuredClone(p.meals!) } : {}, ...finished ? { critic: structuredClone(p.critic!), score: structuredClone(p.score) } : {}, fridgeReady: p.fridgeReady })), round: s.round, priority: [...s.priority], locations: structuredClone(s.locations), challenges: s.challenges.map((id, i) => ({ id: i < s.revealed ? id : null, held: i === 2 || i === 5 })), critic: s.critic, rumors: s.rumors.map((id, i) => s.publicRumors[i] || finished ? id : null), ...finished ? { extraRumors: s.players.flatMap(p => p.extraRumor ? [p.extraRumor] : []) } : {}, academySous: s.academySous, bisqueAvailable: s.bisqueAvailable, seventhAvailable: s.seventhAvailable, visits: s.visits.map(({ newton, ...v }) => ({ ...v })), location: s.location, turn: s.pending?.actor, decision: s.pending ? { kind: s.pending.kind, actor: s.pending.actor, ...s.pending.visit ? { chef: s.visits.find(v => v.id === s.pending!.visit)?.chef } : {}, ...s.pending.kind === 'pick' ? { loc: s.pending.loc } : {} } : undefined, sequence: s.sequence, event: { ...s.event }, log: [...s.log], winners: [...s.winners], ...showMeals ? { challengeResults: structuredClone(s.challengeResults) } : {} };
}
export function getPlayerView(s: CKState, id: string): NonNullable<CKView['me']> { const p = own(s, id), d = s.pending; return { id, storage: [...p.storage], soup: p.soup, bisque: p.bisque, known: p.known.map((x, i) => x ? s.rumors[i] : null), rumorTokens: [...p.known], spentRumors: [...p.spentRumors], extraRumor: p.extraRumor, offers: [...p.offers], plan: structuredClone(p.plan), meals: structuredClone(p.meals), critic: structuredClone(p.critic), chefIds: chefs(p), choices: d?.actor === id && d.kind === 'pick' ? pickChoices(s, p, d.loc) : [], rewards: d?.actor === id && d.kind === 'consolation' ? p.restaurateur === 'anthony-boardain' ? ['soup', 'bag', 'skip'] : ['soup', 'skip'] : [], rumorChoices: d?.actor === id && d.kind === 'rumor' ? p.known.flatMap((x, i) => x ? [] : [i]) : [], epoch: decisionKey(s), legal: getLegalActions(s, id) }; }
