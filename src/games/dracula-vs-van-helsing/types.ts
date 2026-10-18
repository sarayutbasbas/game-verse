export const SUITS = ["red", "yellow", "green", "purple"] as const;
export type Suit = (typeof SUITS)[number];
export const ROLES = ["dracula", "helsing"] as const;
export type Character = (typeof ROLES)[number];
export const ROLE_NAME: Record<Character, string> = {
  dracula: "Dracula",
  helsing: "Van Helsing",
};
export const SUIT_NAME: Record<Suit, string> = {
  red: "แดง ◆",
  yellow: "เหลือง ☀",
  green: "เขียว ♣",
  purple: "ม่วง ✦",
};
export const EFFECTS: Record<number, string> = {
  1: "เปิดการ์ดของคุณ 1 ใบ",
  2: "เปิดการ์ดบนสุดของกองจั่ว",
  3: "เปิดการ์ดคู่แข่ง 1 ใบ",
  4: "สลับการ์ดของคุณ 2 ใบ",
  5: "เล่นอีกตา",
  6: "แลกการ์ดกับคู่แข่งในเขตเดียวกัน",
  7: "สลับสีทรัมป์กับสีอื่น",
  8: "จบรอบทันที (กองทิ้งต้องมี 6 ใบก่อนทิ้ง)",
};
export interface Card {
  suit: Suit;
  value: number;
  revealed: boolean;
}
export type DuelAction =
  | { type: "draw" }
  | { type: "end-round" }
  | { type: "discard"; slot: number } // -1 = drawn card, otherwise rack slot 0–4
  | { type: "effect"; targets: number[] } // districts, or ranking index for effect 7
  | { type: "reveal-result"; slot: number; round: number }
  | { type: "next-round" };
export type LobbyAction =
  | { type: "choose-role"; character: Character }
  | { type: "ready"; ready: boolean };
export interface DuelPlayer {
  id: string;
  name: string;
  avatar?: string | null;
  character: Character;
  cards: Card[];
}
export interface DistrictResult {
  district: number;
  winner: Character;
  reason: string;
  hp: number;
  vampires: number;
}
export interface RoundResult {
  round: number;
  cards: Record<Character, Card[]>;
  ranking: Suit[];
  districts: DistrictResult[];
  cause: string;
}
export interface DuelState {
  phase: "playing" | "results" | "finished";
  step: "draw" | "discard" | "effect";
  players: DuelPlayer[];
  turn: string;
  round: number;
  hp: number;
  vampires: number[];
  ranking: Suit[];
  deck: Card[];
  discard: Card[];
  drawn?: Card;
  effect?: number;
  ending?: string;
  result?: RoundResult;
  reveals?: Record<Character, boolean[]>;
  revealStart?: { hp: number; vampires: number[] };
  acknowledged: string[];
  winner?: Character;
  reason?: string;
  actionSerial?: number;
  lastEvent?: string;
  lastExchange?: {round:number;serial:number;actor:string;slot:number;cards:Record<Character,Card>};
  lastAction?: string;
}
export interface DuelView {
  gameId: "dracula-vs-van-helsing";
  code: string;
  revision: number;
  phase: "lobby" | "playing" | "results" | "finished";
  step?: DuelState["step"];
  players: {
    id: string;
    name: string;
    avatar?: string | null;
    character?: Character;
    ready: boolean;
    connected: boolean;
  }[];
  turn?: string;
  round?: number;
  hp?: number;
  vampires?: number[];
  ranking?: Suit[];
  racks?: Record<Character, (Card | null)[]>;
  deckCount?: number;
  deckTop?: Card;
  discard?: Card[];
  drawn?: Card;
  effect?: number;
  ending?: string;
  result?: Omit<RoundResult, "cards"> & { cards: Record<Character, (Card | null)[]> };
  revealPending?: boolean;
  revealedCount?: number;
  acknowledged?: string[];
  winner?: Character;
  reason?: string;
  lastAction?: string;
  event?: {
    revision: number;
    round: number;
    kind: string;
    serial?: number;
    reveal?: DuelView["result"];
  };
  me?: {
    canManage?: boolean;
    id: string;
    cards: Card[];
    drawn?: Card;
    exchange?: {round:number;serial:number;initiated:boolean;slot:number;gave:Card;received:Card};
    legal: (DuelAction | LobbyAction)[];
  };
}
