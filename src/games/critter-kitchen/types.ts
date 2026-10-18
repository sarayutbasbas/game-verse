import type {TeamColor} from './team-colors.js';
import type { Food, LocationId } from './data.js';
import type {DisplayMode} from '../../shared/display-mode.js';
export type {DisplayMode};
export type Phase = 'restaurateurs' | 'planning' | 'running' | 'shopping' | 'challenge' | 'challenge-results' | 'refrigeration' | 'critic' | 'finished';
export interface MealItem {
    token: string;
    as: Food;
    spice?: string;
}
export interface Meal {
    items: MealItem[];
    soup: number;
    bisque: number;
    wine?: {
        token: string;
        course: Food;
    }[];
}
export interface MealScore {
    quality: number;
    stars: number;
    requirements: Food[];
    bonus: number;
}
export interface FinalScore {
    challenge: number;
    chef: number;
    soup: number;
    seven: number;
    best: number[];
    rumors: {
        id: string;
        stars: number;
    }[];
    bonus: number;
    courseQuality: number[];
    finalQuality: number[];
    quality: number;
    qualityStars: number;
    total: number;
    rankReason: string;
}
export interface Player {
    id: string;
    name: string;
    storage: string[];
    soup: number;
    bisque: number;
    known: (string | null)[];
    spentRumors: number[];
    stars: number;
    challengeStars: number;
    chefStars: number;
    activeSous: string | null;
    nextSous: string | null;
    restaurateur: string | null;
    offers: string[];
    extraRumor: string | null;
    plan: Plan | null;
    meals: Meal[] | null;
    critic: Meal | null;
    fridgeReady: boolean;
    score?: FinalScore;
}
export type Plan = Record<string, LocationId>;
export interface Visit {
    id: string;
    actor: string;
    chef: string;
    loc: LocationId;
    capacity: number;
    limit: number;
    used: number;
    gained: number;
    done: boolean;
    started: boolean;
    newton: boolean;
}
export type Task = {
    kind: 'location';
    loc: LocationId;
} | {
    kind: 'queues';
    loc: LocationId;
} | {
    kind: 'pick';
    visit: string;
} | {
    kind: 'finish';
    visit: string;
} | {
    kind: 'clean';
    loc: LocationId;
} | {
    kind: 'bag-gift';
    actor: string;
    visit?: string;
} | {
    kind: 'extra';
    visit: string;
    loc: LocationId;
    fallback: boolean;
} | {
    kind: 'end-round';
} | {
    kind: 'prepare';
};
export type Pending = {
    kind: 'pick';
    actor: string;
    visit: string;
    loc: LocationId;
    extra: boolean;
    fallback: boolean;
} | {
    kind: 'rumor';
    actor: string;
    token: string;
    visit?: string;
} | {
    kind: 'consolation';
    actor: string;
    visit: string;
};
export interface Pickup { actor:string; chef:string; loc:LocationId; item:string; sequence:number; }
export interface CKState {
    teamColors?:Record<string,TeamColor>;
    marketStock?:Record<string,string[]>;
    pickups?:Pickup[];
    phase: Phase;
    players: Player[];
    config: ReturnType<typeof import('./data.js').boardConfiguration>;
    round: number;
    priority: string[];
    bag: string[];
    discard: string[];
    locations: Record<string, string[]>;
    challenges: string[];
    revealed: number;
    critic: string;
    rumors: string[];
    unusedRumors: string[];
    excludedRumors: string[];
    publicRumors: boolean[];
    zousDeck: string[];
    academySous: string | null;
    usedZous: string[];
    unusedChallenges: string[];
    unusedCritics: string[];
    unusedRestaurateurs: string[];
    bisqueAvailable: boolean;
    bisqueSupply: number;
    seventhAvailable: boolean;
    visits: Visit[];
    tasks: Task[];
    location: LocationId | null;
    pending: Pending | null;
    firstPick: string | null;
    tieLeader: string | null;
    ming: boolean;
    sequence: number;
    event: {
        kind: 'setup' | 'plan' | 'reveal' | 'location' | 'pick' | 'effect' | 'challenge' | 'fridge' | 'round' | 'finish';
        actor?: string;
        location?: LocationId;
    };
    log: string[];
    resultsRevealed?: boolean;
    challengeResults?: Record<string, MealScore[]>;
    winners: string[];
    matchId?: string;
    houseRules?: {
        emptyCourses: boolean;
    };
}
export type CKAction = {
    type: 'ck-restaurateur';
    card: string;
} | {
    type: 'ck-plan';
    epoch: string;
    plan: Plan;
} | {
    type: 'ck-uncommit';
    epoch: string;
} | {
    type: 'ck-run';
} | {
    type: 'ck-pick';
    item: string;
} | {
    type: 'ck-leave';
} | {
    type: 'ck-rumor';
    index: number;
} | {
    type: 'ck-consolation';
    reward: 'soup' | 'bag' | 'skip';
} | {
    type: 'ck-meals';
    epoch: string;
    meals: Meal[];
} | {
    type: 'ck-fridge';
    epoch: string;
    keep: string[];
} | {
    type: 'ck-final';
    epoch: string;
    meal: Meal;
} | {
    type: 'ck-reveal-results';
} | {
    type: 'ck-next';
};
export interface CKView {
    teamColors?:Record<string,TeamColor>;
    marketStock?:Record<string,string[]>;
    pickups?:Pickup[];
    gameId: 'critter-kitchen';
    code: string;
    revision: number;
    phase: 'lobby' | Phase;
    config: CKState['config'];
    displayMode: DisplayMode;
    players: {
        id: string;
        name: string;
        avatar?: string | null;
        connected?: boolean;
        ready?: boolean;
        committed: boolean;
        known: boolean[];
        publicStorage: string[];
        stars: number;
        activeSous: string | null;
        nextSous: string | null;
        restaurateur: string | null;
        plan: Plan | null;
        meals?: Meal[];
        critic?: Meal;
        score?: FinalScore;
        fridgeReady: boolean;
    }[];
    round: number;
    priority: string[];
    locations: Record<string, string[]>;
    challenges: {
        id: string | null;
        held: boolean;
    }[];
    critic: string;
    rumors: (string | null)[];
    extraRumors?: string[];
    academySous: string | null;
    bisqueAvailable: boolean;
    seventhAvailable: boolean;
    visits: Omit<Visit, 'newton'>[];
    location: LocationId | null;
    turn?: string;
    decision?: {
        kind: Pending['kind'];
        actor: string;
        chef?: string;
        loc?: LocationId;
    };
    sequence: number;
    event: CKState['event'];
    log: string[];
    winners: string[];
    resultsRevealed?: boolean;
    challengeResults?: Record<string, MealScore[]>;
    me?: {
        id: string;
        canManage?: boolean;
        storage: string[];
        soup: number;
        bisque: number;
        known: (string | null)[];
        rumorTokens: (string | null)[];
        spentRumors: number[];
        extraRumor: string | null;
        offers: string[];
        plan: Plan | null;
        meals: Meal[] | null;
        critic: Meal | null;
        chefIds: string[];
        choices: string[];
        rewards: ('soup' | 'bag' | 'skip')[];
        rumorChoices: number[];
        epoch: string;
        legal: CKAction[];
    };
}
