import { TOKEN, FOODS, CHALLENGE, RESTAURATEUR, type Food } from './data.js';
import type { CKState, Player, Meal, MealItem, MealScore, FinalScore } from './types.js';
export type MealContext = Pick<CKState, 'critic' | 'challenges' | 'round'>;
export type MealPlayer = Pick<Player, 'restaurateur' | 'storage' | 'known' | 'soup' | 'bisque'>;
export const emptyMeal = (): Meal => ({ items: [], soup: 0, bisque: 0 });
export function baseValue(s: MealContext, p: MealPlayer, id: string, challenge = false) { const t = TOKEN[id]; if (t?.kind !== 'ingredient')
    return 0; let v = t.value!; if (challenge && p.restaurateur === 'goatn-ramsay' && v === 2)
    v += 2; if (challenge && p.restaurateur === 'bobcat-flay' && (t.food === 'meat' || t.food === 'fish'))
    v += 3; if (s.critic === 'kangaroo' && t.value === 6)
    v = 9; if (s.critic === 'rabbit' && t.food === 'carrot')
    v *= 2; return v; }
const err = (message = 'ชุดอาหารไม่ถูกต้อง กรุณาตรวจวัตถุดิบ เครื่องเทศ และซุปของคุณ') => { throw Error(message); };
export function validateMealShape(m: any): m is Meal { return !!m && typeof m === 'object' && !Array.isArray(m) && Object.keys(m).every(k => ['items', 'soup', 'bisque', 'wine'].includes(k)) && Array.isArray(m.items) && m.items.length <= 130 && Number.isSafeInteger(m.soup) && m.soup >= 0 && m.soup <= 10000 && Number.isSafeInteger(m.bisque) && m.bisque >= 0 && m.bisque <= 7 && m.items.every((a: any) => a && typeof a === 'object' && !Array.isArray(a) && Object.keys(a).every(k => ['token', 'as', 'spice'].includes(k)) && typeof a.token === 'string' && FOODS.includes(a.as) && (!('spice' in a) || typeof a.spice === 'string')) && (!('wine' in m) || Array.isArray(m.wine) && m.wine.length <= 7 && m.wine.every((a: any) => a && Object.keys(a).sort().join() === ['course', 'token'].join() && typeof a.token === 'string' && FOODS.includes(a.course))); }
export function spiceMatches(s: MealContext, p: MealPlayer, a: MealItem, final: boolean) { if (!a.spice)
    return true; const t = TOKEN[a.spice], ingredient = TOKEN[a.token]; if (!t)
    return false; if (t.kind === 'rumor')
    return final && s.critic === 'jerboa' && p.known.includes(a.spice); if (t.kind === 'ingredient')
    return s.critic === 'saint-bernard' && t.food === 'wine'; return t.kind === 'spice' && (t.food === 'all' || p.restaurateur === 'julia-wild' || s.critic === 'badger' && ingredient.food === 'mushroom' || t.food === ingredient.food); }
export function validateMeals(s: MealContext, p: MealPlayer, meals: Meal[], final = false) {
    if (!Array.isArray(meals) || meals.length !== (final ? 1 : 3) || !meals.every(validateMealShape))
        err();
    const all: string[] = [], spices: Map<string, {
        plate: number;
        food: string;
    }> = new Map();
    let soup = 0, bisque = 0;
    for (const [i, m] of meals.entries()) {
        if (final && (m.soup || m.bisque) || !final && m.wine?.length)
            err();
        let required: readonly Food[] = FOODS;
        if (!final) {
            const c = CHALLENGE[s.challenges[(s.round === 3 ? 0 : 3) + i]];
            required = i === 2 ? c.foods.slice(0, 2) : c.foods;
        }
        const by = FOODS.map(f => m.items.filter(a => a.as === f));
        for (const a of m.items) {
            const t = TOKEN[a.token];
            if (!t || t.kind !== 'ingredient' || !p.storage.includes(a.token) || t.food !== a.as && !(s.critic === 'badger' && t.food === 'mushroom') && !(!final && p.restaurateur === 'wolfgang-duck' && t.food === 'wine') || !required.includes(a.as) || !spiceMatches(s, p, a, final))
                err();
            all.push(a.token);
            if (a.spice) {
                if (!p.storage.includes(a.spice) && !(final && s.critic === 'jerboa' && p.known.includes(a.spice)))
                    err();
                const prev = spices.get(a.spice);
                if (prev && !(p.restaurateur === 'heron-sanchez' && !final && prev.plate === i && prev.food === t.food))
                    err();
                if (!prev) {
                    spices.set(a.spice, { plate: i, food: t.food! });
                    all.push(a.spice);
                }
            }
        }
        if (final) {
            const multi = by.map((v, i) => ({ v, i })).filter(({ v }) => v.length > 1);
            if (s.critic === 'mouse') {
                if (multi.some(({ i }) => FOODS[i] !== 'cheese'))
                    err();
            }
            else if (s.critic === 'cow') {
                if (multi.length > 1 || multi.some(({ v }) => v.length > 4))
                    err();
            }
            else if (s.critic === 'raccoon') {
                if (by.some(v => v.filter(a => TOKEN[a.token].value !== 2).length > 1))
                    err();
            }
            else if (multi.length)
                err();
            if (m.wine?.length) {
                if (s.critic !== 'fruit-bat' || new Set(m.wine.map(a => a.course)).size !== m.wine.length)
                    err('จับคู่ไวน์ได้เฉพาะ Fruit Bat และเพิ่มได้ช่องอาหารละ 1 ชิ้น');
                for (const a of m.wine) {
                    const t = TOKEN[a.token], course = m.items.filter(x => x.as === a.course);
                    if (!p.storage.includes(a.token) || t?.kind !== 'ingredient' || t.food !== 'wine' || !course.length || t.value !== Math.max(...course.map(x => TOKEN[x.token].value!)))
                        err('ไวน์จับคู่ต้องมีเลขพิมพ์ตรงกับวัตถุดิบในช่องอาหาร และเป็นไวน์ที่อยู่ในครัวของคุณ');
                    all.push(a.token);
                }
            }
        }
        else if (m.items.length || m.soup || m.bisque) {
            if (!m.items.length)
                err(`จาน ${i + 1} ต้องมีวัตถุดิบจริงอย่างน้อย 1 ชิ้น หรือเว้นจานว่างเพื่อไม่เสิร์ฟ`);
            if (required.filter(f => !m.items.some(a => a.as === f)).length > m.soup + m.bisque)
                err(`จาน ${i + 1} ยังขาดชนิดวัตถุดิบ เติมชนิดที่ขาดหรือใช้ซุป / บิสก์แทน`);
            if (mealQuality(s, p, m, true) < 6)
                err(`จาน ${i + 1} ต้องมีคุณภาพอย่างน้อย 6 เพื่อเสิร์ฟ`);
        }
        soup += m.soup;
        bisque += m.bisque;
    }
    if (new Set(all).size !== all.length)
        err('วัตถุดิบหรือเครื่องเทศชิ้นเดียวถูกใช้ซ้ำ กรุณาเลือกเพียงจานเดียว');
    if (soup > p.soup || bisque > p.bisque)
        err('ซุปหรือบิสก์ไม่พอสำหรับทุกจาน กรุณาลดจำนวนที่ใช้');
    return [...new Set(all)];
}
export function mealQuality(s: MealContext, p: MealPlayer, m: Meal, challenge = false) { return m.items.reduce((sum, a) => sum + baseValue(s, p, a.token, challenge) * (a.spice ? (s.critic === 'tree-shrew' ? 3 : 2) : 1), 0) + m.soup + m.bisque * 3 + (m.wine ?? []).reduce((n, w) => n + baseValue(s, p, w.token), 0); }
export function scoreChallenge(s: MealContext, p: MealPlayer, m: Meal, index: number): MealScore { const c = CHALLENGE[s.challenges[(s.round === 3 ? 0 : 3) + index]], requirements = index === 2 ? c.foods.slice(0, 2) : [...c.foods]; if (!m.items.length)
    return { quality: 0, stars: 0, requirements: [...requirements], bonus: 0 }; const quality = mealQuality(s, p, m, true); let bonus = s.critic === 'capybara' ? 1 : 0; if (p.restaurateur === 'falcon-brown' && !m.soup && !m.bisque && m.items.length === requirements.length && requirements.every(f => m.items.filter(a => a.as === f).length === 1))
    bonus++; if (p.restaurateur === 'graham-elephant' && quality >= 25)
    bonus++; return { quality, stars: (quality >= 21 ? 4 : quality >= 12 ? 2 : quality >= 6 ? 1 : 0) + bonus, requirements: [...requirements], bonus }; }
export function scoreFinal(s: CKState): Record<string, FinalScore> {
    const data = s.players.map(p => {
        const m = p.critic!, used = new Set([...m.items.flatMap(a => [a.token, ...a.spice ? [a.spice] : []]), ...(m.wine ?? []).map(w => w.token)]), left = p.storage.filter(t => !used.has(t)), by = FOODS.map(f => m.items.filter(a => a.as === f)), values = by.map(a => a.length ? Math.max(...a.map(x => baseValue(s, p, x.token))) : 0), all = [...m.items.map(a => baseValue(s, p, a.token)), ...(m.wine ?? []).map(w => baseValue(s, p, w.token))], courseQuality = by.map((a, i) => a.reduce((n, x) => n + baseValue(s, p, x.token) * (x.spice ? (s.critic === 'tree-shrew' ? 3 : 2) : 1), 0) + (m.wine ?? []).filter(w => w.course === FOODS[i]).reduce((n, w) => n + baseValue(s, p, w.token), 0));
        const metrics: Record<string, number> = { 'varied-servings': new Set(all).size, 'to-go': left.length, 'spice-lover': m.items.filter(a => a.spice).length, 'simple-palate': Math.max(0, ...all.map(v => all.filter(x => x === v).length)), 'subtle-flavors': values[0] ? all.filter(v => v === values[0]).length : 0, 'unsophisticated': by.filter(a => a.length === 1 && !a[0].spice && !(m.wine ?? []).some(w => w.course === a[0].as)).length, 'varied-leftovers': new Set(left.filter(t => TOKEN[t].kind === 'ingredient').map(t => baseValue(s, p, t))).size };
        return { p, m, by, values, all, left, courseQuality, metrics, served: values.filter(v => v > 0), soup: p.soup + 3 * p.bisque };
    });
    const rumors = [...s.rumors, ...s.players.flatMap(p => p.extraRumor ? [p.extraRumor] : [])];
    const max = (id: string) => Math.max(...data.map(d => d.metrics[id]));
    const result: Record<string, FinalScore> = {};
    for (const d of data) {
        const { p, m, by, values, all, left, courseQuality, metrics, served } = d;
        const best = courseQuality.map((q, i) => q > 0 && q === Math.max(...data.map(d => d.courseQuality[i])) ? 1 + (s.critic === 'mouse' && i === 2 ? 2 : 0) : 0);
        let finalQuality = [...courseQuality];
        const scores: {
            id: string;
            stars: number;
        }[] = [];
        for (const id of rumors) {
            let stars = 0;
            const fi = FOODS.findIndex(f => id === `${f}-fanatic`);
            if (fi >= 0) {
                finalQuality[fi] *= 2;
                continue;
            }
            const tied = (key: string, bonus: number) => metrics[key] === max(key) ? bonus : 0;
            switch (id) {
                case 'varied-servings':
                    stars = metrics[id] + tied(id, 1);
                    break;
                case 'shortsighted':
                    stars = Math.max(0, values[1] - 2);
                    break;
                case 'super-chatty':
                    stars = p.known.filter(Boolean).length;
                    break;
                case 'picky':
                    stars = served.length === 7 ? Math.min(...all) : 0;
                    break;
                case 'to-go':
                    stars = Math.floor(left.length / 2) + tied(id, 1);
                    break;
                case 'spice-lover':
                    stars = tied(id, 2);
                    break;
                case 'odd-tastes':
                    stars = served.length && served.every(v => v % 2 === 1) ? 3 : 0;
                    break;
                case 'simple-palate':
                    stars = tied(id, 3);
                    break;
                case 'tender':
                    stars = served.length && served[0] + (served.at(-1) ?? 0) === 10 ? 3 : 0;
                    break;
                case 'subtle-flavors':
                    stars = values[0] ? tied(id, 3) : 0;
                    break;
                case 'mercurial':
                    stars = all.length ? Math.max(...all) - Math.min(...all) : 0;
                    break;
                case 'wine-cellar':
                    stars = left.filter(t => TOKEN[t].kind === 'ingredient' && TOKEN[t].food === 'wine').length;
                    break;
                case 'psychedelic-flavor':
                    stars = courseQuality[5] > 0 && courseQuality[5] === Math.max(...courseQuality) ? 2 : 0;
                    break;
                case 'big-cheese':
                    stars = values[2] > 0 && values[2] >= served.length ? 3 : 0;
                    break;
                case 'hibernator': {
                    const last = values.reduce((last, v, i) => v > 0 ? i : last, -1);
                    stars = last >= 0 && courseQuality[last] === Math.max(...courseQuality) ? 2 : 0;
                    break;
                }
                case 'big-dipper':
                    stars = values[0] > 0 && d.soup >= values[0] ? 2 : 0;
                    break;
                case 'extremely-pampered':
                    stars = by.every(items => items.some(a => TOKEN[a.token].value! >= 5)) ? 2 : 0;
                    break;
                case 'unsophisticated':
                    stars = metrics[id] + tied(id, 1);
                    break;
                case 'sommelier':
                    stars = values[6] ? Number(values[6] === values[3]) * 2 + Number(values[6] === values[4]) * 2 : 0;
                    break;
                case 'varied-leftovers':
                    stars = metrics[id] + tied(id, 1);
                    break;
                case 'nocturnal':
                    stars = served.length && served.every((v, i) => !i || v >= served[i - 1]) ? 5 : 0;
                    break;
                default: throw Error('ข่าวลือไม่มี scoring handler');
            }
            scores.push({ id, stars });
        }
        const quality = finalQuality.reduce((a, b) => a + b, 0), qualityStars = Math.ceil(quality / 7), soup = d.soup === Math.max(...data.map(d => d.soup)) ? 1 : 0, seven = served.length === 7 ? 1 : 0;
        const bonus = (p.restaurateur ? RESTAURATEUR[p.restaurateur].bonus : 0) + (s.critic === 'fruit-bat' ? (m.wine ?? []).length : s.critic === 'poodle' ? all.filter(v => v >= 6).length : 0);
        const total = p.stars + soup + seven + best.reduce((a, b) => a + b, 0) + scores.reduce((a, b) => a + b.stars, 0) + bonus + qualityStars;
        result[p.id] = { challenge: p.challengeStars, chef: p.chefStars, soup, seven, best, rumors: scores, bonus, courseQuality, finalQuality, quality, qualityStars, total, rankReason: '' };
    }
    return result;
}
