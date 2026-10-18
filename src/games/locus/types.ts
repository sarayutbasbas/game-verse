import type { Ink, Zone, XY, ShapeCard } from './data.js';
import type { DisplayMode } from '../../shared/display-mode.js';
export type { DisplayMode };
export interface Effect {
    id: string;
    kind: 'main' | 'bonus' | 'coin' | 'remaining';
    color: Ink;
    cells: XY[];
    card?: string;
    source?: string;
}
export interface Player {
    id: string;
    name: string;
    sheet: Record<Zone, string[]>;
    coins: number;
    gained: number;
    spent: number;
    effects: Effect[];
    triggered: string[];
    picked: string | null;
    usedRemaining: boolean;
    done: boolean;
    version: number;
}
export interface Score {
    yellow: number;
    purple: number;
    red: number;
    green: number;
    blue: number;
    lowest: number;
    total: number;
    details: {
        yellowRows: number[];
        purpleConnected: number;
        redGroups: number[];
        greenEnds: string[];
        blueRow: number | null;
    };
}
export interface Event {
    kind: 'setup' | 'pick' | 'mark' | 'coin' | 'discard' | 'skip' | 'done' | 'deal' | 'finish' | 'extra';
    actor?: string;
    cells?: {
        zone: Zone;
        x: number;
        y: number;
    }[];
    gained?: number;
    spent?: number;
    effects?: string[];
}
export interface LocusState {
    gameId: 'locus';
    schema: 1;
    rulesVersion: string;
    matchId: string;
    players: Player[];
    deck: string[];
    discard: string[];
    market: {
        slot: number;
        card: string;
        owner: string | null;
    }[];
    first: number;
    draft: number;
    deal: number;
    targetDeals: number;
    extraRounds: number;
    phase: 'playing' | 'finished';
    sequence: number;
    effectSerial: number;
    event: Event;
    winners: string[];
    results?: {
        id: string;
        score: Score;
    }[];
}
type Own = {
    epoch: string;
};
export type LocusAction = Own & ({
    type: 'locus-pick';
    slot: number;
} | {
    type: 'locus-place';
    effect: string;
    zone: Zone;
    x: number;
    y: number;
    rotation: number;
    mirror: boolean;
    wild: boolean;
} | {
    type: 'locus-discard';
    effect: string;
} | {
    type: 'locus-skip';
    effect: string;
} | {
    type: 'locus-coin-blocks';
} | {
    type: 'locus-buy';
} | {
    type: 'locus-done';
});
export interface LegalSummary {
    epoch: string;
    picks: number[];
    coinBlocks: boolean;
    buy: boolean;
    done: boolean;
    effects: Effect[];
}
export interface PublicPlayer {
    id: string;
    name: string;
    avatar?: string | null;
    connected?: boolean;
    ready?: boolean;
    sheet: Record<Zone, string[]>;
    coins: number;
    score: Score;
    effects: Effect[];
    done: boolean;
    picked: string | null;
    version: number;
}
export interface LocusView {
    gameId: 'locus';
    code: string;
    revision: number;
    phase: 'lobby' | 'playing' | 'finished';
    sequence: number;
    matchId: string;
    defaultMode: DisplayMode;
    players: PublicPlayer[];
    market: {
        slot: number;
        card: ShapeCard;
        owner: string | null;
    }[];
    turn: string | null;
    first: string | null;
    deal: number;
    round: number;
    rounds: number;
    turnInRound: number;
    remaining: number;
    discardCount: number;
    winners: string[];
    event: Event;
    me?: {
        id: string;
        canManage?: boolean;
        legal: LegalSummary;
    };
}
