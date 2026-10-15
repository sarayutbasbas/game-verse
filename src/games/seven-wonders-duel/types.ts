import type { Resource, Token } from "./data.js";
export type WondersAction =
  | { type: "wonders-pick"; wonder: string }
  | {
      type: "wonders-play";
      slot: number;
      mode: "build" | "discard" | "wonder";
      wonder?: string;
    }
  | { type: "wonders-decide"; choice: string };
export interface Citizen {
  id: string;
  name: string;
  coins: number;
  buildings: string[];
  wonders: { id: string; card?: string; removed?: boolean }[];
  tokens: Token[];
  avatar?: string | null;
  connected?: boolean;
  ready?: boolean;
}
export interface Decision {
  kind:
    | "progress"
    | "library"
    | "discard"
    | "destroy-brown"
    | "destroy-grey"
    | "starter";
  actor: string;
  options: string[];
}
export interface WondersState {
  phase: "setup" | "playing" | "finished";
  players: Citizen[];
  turn: number;
  starter: number;
  age: 1 | 2 | 3;
  decks: Record<1 | 2 | 3, string[]>;
  removed: string[];
  layout: { slot: number; card: string; faceUp: boolean }[];
  discard: string[];
  progress: Token[];
  boxTokens: Token[];
  wonderDeck: string[];
  wonderPool: string[];
  draftStep: number;
  military: number;
  militaryUsed: number[];
  pending?: Decision;
  extra: boolean;
  winners: string[];
  victory?: "military" | "science" | "civilian";
  sequence: number;
  event?: {
    sequence: number;
    actor: string;
    kind: string;
    card?: string;
    slot?: number;
    revealed: number[];
    age: number;
  };
}
export interface Quote {
  total: number;
  printed: number;
  trade: number;
  chain: boolean;
  rebate: number;
  produced: Partial<Record<Resource, number>>;
  missing: Partial<Record<Resource, number>>;
  prices: Record<Resource, number>;
  affordable: boolean;
  reason?: string;
}
export interface Offer {
  slot: number;
  build: Quote;
  discard: number;
  wonders: { id: string; quote: Quote }[];
}
export interface WondersView {
  gameId: "seven-wonders-duel";
  code: string;
  revision: number;
  phase: "lobby" | WondersState["phase"];
  players: (Citizen & {
    production?: {
      fixed: Partial<Record<Resource, number>>;
      flexible: Resource[][];
      discounts: Resource[];
    };
  })[];
  age?: 1 | 2 | 3;
  turn?: string;
  layout?: {
    slot: number;
    card?: string;
    faceUp: boolean;
    accessible: boolean;
  }[];
  wonderPool?: string[];
  progress?: Token[];
  military?: number;
  militaryUsed?: number[];
  discard?: string[];
  pending?: Omit<Decision, "options"> & { options?: string[] };
  winners?: string[];
  victory?: WondersState["victory"];
  scores?: ReturnTypeScore[];
  sequence?: number;
  event?: WondersState["event"];
  me?: {
    id: string;
    canManage?: boolean;
    legal: (WondersAction | { type: "ready"; ready: boolean })[];
    offers: Offer[];
    decision?: Decision;
  };
}
export interface ReturnTypeScore {
  id: string;
  buildings: number;
  blue: number;
  wonders: number;
  progress: number;
  military: number;
  treasury: number;
  guilds: number;
  total: number;
}
