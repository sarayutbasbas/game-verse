import type { Patch, Hex, GoalId, CatId, Pattern, Color } from "./data.js";
export type CalicoAction =
  | { type: "calico-preset"; preset: "standard" | "first" }
  | { type: "calico-goals"; goals: GoalId[]; confirm: boolean }
  | { type: "calico-place"; tileId: string; hex: Hex }
  | { type: "calico-draft"; index: number };
export interface Award {
  awardId?: string;
  cells?: string[];
  sequence?: number;
  kind: "button" | "cat";
  id: Color | CatId;
  at: string;
  pattern?: Pattern;
}
export interface QuiltPlayer {
  id: string;
  name: string;
  avatar?: string | null;
  connected?: boolean;
  ready?: boolean;
  board: number;
  patches: Record<string, Patch>;
  hand: Patch[];
  goals: GoalId[];
  options: GoalId[];
  draft: GoalId[];
  confirmed: boolean;
  awards: Award[];
  rainbow: boolean;
  rainbowAward?: {
    awardId: string;
    at: string;
    cells: string[];
    sequence: number;
  };
}
export interface CalicoState {
  mode?: "solo" | "multiplayer";
  removed?: Patch[];
  phase: "setup" | "playing" | "finished";
  step: "place" | "draft";
  preset: "standard" | "first";
  players: QuiltPlayer[];
  turn: number;
  bag: Patch[];
  market: Patch[];
  cats: { id: CatId; patterns: Pattern[] }[];
  placements: number;
  winners: string[];
  event?: {
    sequence: number;
    kind: string;
    actor: string;
    at?: string;
    awards?: Award[];
    marketCycle?: {
      taken: Patch;
      removed: Patch[];
      kept: Patch[];
      refilled: Patch[];
    };
  };
  sequence: number;
}
export interface Breakdown {
  cats: { id: CatId; count: number; points: number }[];
  buttons: { id: Color | "rainbow"; count: number; points: number }[];
  goals: {
    id: GoalId;
    color: boolean;
    pattern: boolean;
    complete: boolean;
    points: number;
  }[];
  earned: number;
  total: number;
  catCount: number;
  buttonCount: number;
}
export interface CalicoView {
  gameId: "calico";
  code: string;
  revision: number;
  phase: "lobby" | CalicoState["phase"];
  players: (Omit<QuiltPlayer, "options" | "draft"> & { score?: Breakdown })[];
  turn?: string;
  step?: CalicoState["step"];
  mode?: "solo" | "multiplayer";
  removedCount?: number;
  preset: "standard" | "first";
  cats?: CalicoState["cats"];
  market?: Patch[];
  bagCount?: number;
  placements?: number;
  round?: number;
  winners?: string[];
  event?: CalicoState["event"];
  me?: {
    id: string;
    canManage?: boolean;
    options: GoalId[];
    draft: GoalId[];
    hand?: Patch[];
    legal: CalicoAction[] | { type: "ready"; ready: boolean }[];
  };
}
