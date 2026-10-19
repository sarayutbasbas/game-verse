import {finalRevealItems} from './final-reveal.js';
import { expansionOptions, selectedZous, selectedRestaurateurs } from './expansions.js';
import {TEAM_COLORS} from './team-colors.js';
import { TOKENS, TOKEN, BASE_CHEFS, ZOUS, ZOU, CRITICS, CRITIC, CHALLENGES, CHALLENGE, RESTAURATEURS, RESTAURATEUR, RUMORS, RUMOR, SPECIAL_ALLSPICE, boardConfiguration } from './data.js';
import { chefs } from './engine.js';
import { validateMeals, validateMealShape, scoreFinal, scoreChallenge } from './scoring.js';
import type { CKState } from './types.js';
const integer = (v: unknown, min = 0, max = 100000) => Number.isSafeInteger(v) && Number(v) >= min && Number(v) <= max;
const strings = (v: any): v is string[] => Array.isArray(v) && v.every(x => typeof x === 'string');
const sameData=(a:any,b:any):boolean=>{
 if(a===b)return true;
 if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
 if(Array.isArray(a)&&a.length!==b.length)return false;
 const keys=Object.keys(a);return keys.length===Object.keys(b).length&&keys.every(k=>Object.prototype.hasOwnProperty.call(b,k)&&sameData(a[k],b[k]));
};
const sameSet = (a: string[], b: string[]) => a.length === b.length && new Set(a).size === a.length && b.every(x => a.includes(x));
export function validateCKState(s: any): s is CKState {
    try {
        const expansions = expansionOptions(s?.expansions);
        if (!s || !['restaurateurs', 'planning', 'running', 'shopping', 'challenge', 'challenge-results', 'refrigeration', 'critic', 'finished'].includes(s.phase) || !Array.isArray(s.players) || s.players.length < 2 || s.players.length > 5 || new Set(s.players.map((p: any) => p.id)).size !== s.players.length || s.players.some((p: any) => typeof p.id !== 'string' || typeof p.name !== 'string'))
            return false;
        if (!sameData(s.config,boardConfiguration(s.players.length)) || !integer(s.round, 1, 7) || !integer(s.sequence) || !integer(s.revealed, 0, 6) || !strings(s.priority) || !sameSet(s.priority, s.players.map((p: any) => p.id)) || !CRITIC[s.critic] || !strings(s.bag) || !strings(s.discard))
            return false;
        if(s.challengeReveal!==undefined&&(!integer(s.challengeReveal,1,6)||s.phase!=='planning'||s.round<1||s.round>6||s.challengeReveal!==s.revealed||s.players.some((p:any)=>p.plan)))return false;
        if(s.finalRevealStep!==undefined&&(!integer(s.finalRevealStep,0,100)||s.phase!=='finished'))return false;
        if (s.houseRules !== undefined && (!s.houseRules || s.houseRules.emptyCourses !== true))
            return false;
        if (!strings(s.challenges) || s.challenges.length !== 6 || s.challenges.some((id: string) => !CHALLENGE[id]) || !strings(s.rumors) || s.rumors.length !== 3 || s.rumors.some((id: string) => !RUMOR[id]) || !Array.isArray(s.publicRumors) || s.publicRumors.length !== 3 || s.publicRumors.some((x: any) => typeof x !== 'boolean'))
            return false;
        if (!Array.isArray(s.log) || s.log.length > 14 || s.log.some((x: any) => typeof x !== 'string') || !s.event || !['setup', 'plan', 'reveal', 'location', 'pick', 'effect', 'challenge', 'fridge', 'round', 'finish'].includes(s.event.kind))
            return false;
        if (!s.locations || Object.keys(s.locations).length !== s.config.locations.length || s.config.locations.some((l: any) => !strings(s.locations[l.id])))
            return false;
        if (!integer(s.bisqueSupply, 0, 7) || typeof s.bisqueAvailable !== 'boolean' || typeof s.seventhAvailable !== 'boolean' || !Array.isArray(s.visits) || !Array.isArray(s.tasks) || s.tasks.length > 200 || s.location !== null && !s.config.locations.some((l: any) => l.id === s.location))
            return false;
        const actor = (id: unknown) => typeof id === 'string' && s.players.some((p: any) => p.id === id);
        const loc = (id: unknown) => typeof id === 'string' && s.config.locations.some((l: any) => l.id === id);
        const marketItem=(id:unknown)=>typeof id==='string'&&(!!TOKEN[id]||['soup','bisque',SPECIAL_ALLSPICE].includes(id)||id.startsWith('zous:')&&!!ZOU[id.slice(5)]);
        if(s.teamColors!==undefined&&(!s.teamColors||Array.isArray(s.teamColors)||Object.keys(s.teamColors).length!==s.players.length||Object.entries(s.teamColors).some(([id,color])=>!actor(id)||!(TEAM_COLORS as readonly string[]).includes(color as string))))return false;
        if(s.marketStock!==undefined&&(!s.marketStock||Array.isArray(s.marketStock)||Object.entries(s.marketStock).some(([id,items])=>!loc(id)||!Array.isArray(items)||items.length>125||!items.every(marketItem))))return false;
        if(s.pickups!==undefined&&(!Array.isArray(s.pickups)||s.pickups.length>250||s.pickups.some((p:any)=>!p||!actor(p.actor)||!loc(p.loc)||!BASE_CHEFS.some(c=>c.id===p.chef)&&!ZOU[p.chef]||!marketItem(p.item)||!integer(p.sequence,0,s.sequence))))return false;
        const ref = (id: unknown) => typeof id === 'string' && s.visits.some((v: any) => v.id === id);
        for (const task of s.tasks) {
            if (!task || typeof task !== 'object' || Array.isArray(task))
                return false;
            switch (task.kind) {
                case 'location':
                case 'queues':
                case 'clean':
                    if (!loc(task.loc))
                        return false;
                    break;
                case 'pick':
                    if (!ref(task.visit))
                        return false;
                    break;
                case 'finish':
                    if (typeof task.visit !== 'string' || !ref(task.visit.startsWith('consolation:') ? task.visit.slice(12) : task.visit))
                        return false;
                    break;
                case 'bag-gift':
                    if (!actor(task.actor) || task.visit !== undefined && !ref(task.visit))
                        return false;
                    break;
                case 'extra':
                    if (!ref(task.visit) || !loc(task.loc) || typeof task.fallback !== 'boolean')
                        return false;
                    break;
                case 'end-round':
                case 'prepare': break;
                default: return false;
            }
        }
        if (s.phase !== 'shopping' && (s.pending || s.tasks.length))
            return false;
        if (s.pending?.kind === 'pick' && (!loc(s.pending.loc) || typeof s.pending.extra !== 'boolean' || typeof s.pending.fallback !== 'boolean'))
            return false;
        const tokens = [...s.bag, ...s.discard, ...Object.values(s.locations).flat()] as string[], rest: string[] = [], zous = [...s.zousDeck, ...s.usedZous, ...s.academySous ? [s.academySous] : []], rumors = [...s.rumors, ...s.unusedRumors, ...s.excludedRumors];
        let bisque = s.bisqueSupply + Number(s.bisqueAvailable);
        for (const p of s.players) {
            if (!strings(p.storage) || p.storage.some((t: string) => !TOKEN[t] || TOKEN[t].kind === 'rumor') || !integer(p.soup) || !integer(p.bisque, 0, 7) || !integer(p.stars) || !integer(p.challengeStars) || !integer(p.chefStars) || p.stars !== p.challengeStars + p.chefStars || !Array.isArray(p.known) || p.known.length !== 3 || p.known.some((x: any) => x !== null && (typeof x !== 'string' || TOKEN[x]?.kind !== 'rumor')) || !strings(p.offers) || typeof p.fridgeReady !== 'boolean')
                return false;
            if (p.restaurateur !== null && !RESTAURATEUR[p.restaurateur] || p.extraRumor !== null && !RUMOR[p.extraRumor])
                return false;
            if (p.cosmoSous !== undefined) {
                if (!expansions.luckyDuck || typeof p.cosmoSous !== 'string' || !ZOU[p.cosmoSous] || p.cosmoSous === 'cosmo' || p.activeSous !== 'cosmo' && p.nextSous !== 'cosmo') return false;
                zous.push(p.cosmoSous);
            }
            if ((p.activeSous === 'cosmo' || p.nextSous === 'cosmo') && !p.cosmoSous) return false;
            if (!Array.isArray(p.spentRumors) || new Set(p.spentRumors).size !== p.spentRumors.length || p.spentRumors.some((i: any) => !integer(i, 0, 2) || !p.known[i]))
                return false;
            rest.push(...p.offers, ...p.restaurateur ? [p.restaurateur] : []);
            if (p.extraRumor)
                rumors.push(p.extraRumor);
            for (const key of ['activeSous', 'nextSous'])
                if (p[key] !== null) {
                    if (!ZOU[p[key]])
                        return false;
                    zous.push(p[key]);
                }
            if (p.plan !== null && (typeof p.plan !== 'object' || Array.isArray(p.plan) || new Set(Object.values(p.plan)).size !== Object.keys(p.plan).length || Object.values(p.plan).some((l: any) => !s.config.locations.some((v: any) => v.id === l))))
                return false;
            if (['planning', 'running'].includes(s.phase) && p.plan && (Object.keys(p.plan).length !== chefs(p).length || chefs(p).some(c => !(c in p.plan))))
                return false;
            if (p.meals !== null) {
                if (!Array.isArray(p.meals) || p.meals.length !== 3 || !p.meals.every(validateMealShape))
                    return false;
                if (s.phase === 'challenge')
                    validateMeals(s, p, p.meals);
            }
            if (p.critic !== null) {
                if (!validateMealShape(p.critic))
                    return false;
                validateMeals(s, p, [p.critic], true);
            }
            tokens.push(...p.storage, ...p.known.filter(Boolean));
            bisque += p.bisque;
        }
        rest.push(...s.unusedRestaurateurs);
        if (s.pending) {
            if (!s.players.some((p: any) => p.id === s.pending.actor) || !['pick', 'rumor', 'consolation', 'rudy-gift'].includes(s.pending.kind))
                return false;
            if (s.pending.kind === 'rumor') {
                if (TOKEN[s.pending.token]?.kind !== 'rumor' || TOKEN[s.pending.token]?.rumor !== 3)
                    return false;
                tokens.push(s.pending.token);
            }
            else if (!s.visits.some((v: any) => v.id === s.pending.visit && v.actor === s.pending.actor))
                return false;
            if (s.pending.kind === 'rudy-gift' && (!expansions.rudy || TOKEN[s.pending.token]?.kind !== 'ingredient' || TOKEN[s.pending.token]?.food !== 'carrot' || !s.players.find((p: any) => p.id === s.pending.actor).storage.includes(s.pending.token) || !s.visits.some((v: any) => v.id === s.pending.visit && v.chef === 'rudy'))) return false;
        }
        if (bisque !== 7 || tokens.some(id => !TOKEN[id]) || new Set(tokens).size !== tokens.length || !TOKENS.every(t => tokens.includes(t.id)))
            return false;
        const specialCount = tokens.filter(t => t === SPECIAL_ALLSPICE).length + Number(s.seventhAvailable);
        if (s.round === 7 ? specialCount !== 1 : specialCount !== 0)
            return false;
        if (!sameSet(zous, selectedZous(expansions).map(c => c.id)) || !sameSet(rest, selectedRestaurateurs(expansions).map(c => c.id)) || !sameSet(rumors, RUMORS.map(c => c.id)) || !sameSet([s.critic, ...s.unusedCritics], CRITICS.map(c => c.id)) || !sameSet([...s.challenges, ...s.unusedChallenges], CHALLENGES.map(c => c.id)))
            return false;
        for (let i = 0; i < 3; i++) {
            if (s.players.some((p: any) => p.known[i] && TOKEN[p.known[i]].rumor !== 3 && TOKEN[p.known[i]].rumor !== i))
                return false;
            if (s.publicRumors[i] && s.phase !== 'finished' && !s.players.every((p: any) => p.known[i]))
                return false;
        }
        if(s.resultsRevealed!==undefined&&typeof s.resultsRevealed!=='boolean')return false;
        for (const v of s.visits) {
            if (v.breadPicked !== undefined && (v.chef !== 'alex' || typeof v.breadPicked !== 'boolean')) return false;
            if (typeof v.id !== 'string' || !s.players.some((p: any) => p.id === v.actor) || !(BASE_CHEFS.some(c => c.id === v.chef) || ZOU[v.chef]) || !s.config.locations.some((l: any) => l.id === v.loc) || !integer(v.capacity, 1, 3) || !integer(v.limit, 1, 3) || !integer(v.used, 0, v.limit) || !integer(v.gained) || typeof v.done !== 'boolean' || typeof v.started !== 'boolean' || typeof v.newton !== 'boolean')
                return false;
        }
        if(s.phase==='challenge-results'){
          const consumed:string[]=[];
          if(!s.challengeResults||Object.keys(s.challengeResults).length!==s.players.length)return false;
          for(const p of s.players){
            if(!p.meals)return false;
            const references=p.meals.flatMap((m:any)=>m.items.flatMap((a:any)=>[a.token,...a.spice?[a.spice]:[]]));
            const used=validateMeals(s,{...p,storage:[...new Set([...p.storage,...references])],soup:p.soup+p.meals.reduce((n:number,m:any)=>n+m.soup,0),bisque:p.bisque+p.meals.reduce((n:number,m:any)=>n+m.bisque,0)},p.meals);
            if(used.some(t=>!s.bag.includes(t)))return false;consumed.push(...used);
            const expected=p.meals.map((m:any,i:number)=>scoreChallenge(s,p,m,i));if(!sameData(s.challengeResults[p.id],expected))return false;
          }
          if(new Set(consumed).size!==consumed.length)return false;
        }
        if (s.phase === 'running' && !s.players.every((p: any) => p.plan))
            return false;
        if (['challenge', 'challenge-results', 'refrigeration'].includes(s.phase) && ![3, 6].includes(s.round) || ['critic', 'finished'].includes(s.phase) && s.round !== 7)
            return false;
        if (s.phase === 'finished') {
            if (s.players.some((p: any) => !p.critic || !p.score) || !strings(s.winners) || s.winners.length !== 1 || !s.players.some((p: any) => p.id === s.winners[0]))
                return false;
            const scores = scoreFinal(s);
            for (const p of s.players)
                if (p.score.total !== scores[p.id].total || p.score.quality !== scores[p.id].quality)
                    return false;
            const best = [...s.players].sort((a: any, b: any) => scores[b.id].total - scores[a.id].total || scores[b.id].quality - scores[a.id].quality || s.priority.indexOf(a.id) - s.priority.indexOf(b.id))[0];
            if (best.id !== s.winners[0])
                return false;
        }
        // Legacy completed ceremonies included an extra zero-star winner question.
        if(s.finalRevealStep!==undefined&&s.finalRevealStep>finalRevealItems(s).length*2+2)return false;
        return true;
    }
    catch {
        return false;
    }
}
