import type { Card, Good, GoodsToken, BonusToken, BonusSize } from "./data.js";
export type JaipurAction =
  | { type: "jaipur-take"; cardId: string }
  | { type: "jaipur-camels" }
  | {
      type: "jaipur-exchange";
      marketIds: string[];
      handIds: string[];
      camels: number;
    }
  | { type: "jaipur-sell"; good: Good; count: number }
  | { type: "jaipur-next"; startingPlayerId?: string };
export interface Trader {
  id: string;
  name: string;
  hand: Card[];
  herd: Card[];
  goods: GoodsToken[];
  bonus: BonusToken[];
  seals: number;
}
export interface Score {
  id: string;
  goods: number;
  bonus: number;
  camel: number;
  total: number;
  goodsCount: number;
  bonusCount: number;
  herd: number;
  tokens: { goods: GoodsToken[]; bonus: BonusToken[] };
}
export interface RoundResult {
  round: number;
  reason: "tokens" | "deck";
  scores: Score[];
  winner?: string;
  sealId?: string;
  camelWinner?: string;
  tieBreak: "money" | "bonus" | "goods" | "draw";
  nextStarter?: string;
}
export interface JaipurState {
  /** Public presentation identity, assigned by the room server; optional for legacy saves. */
  matchId?: string;
  phase: "playing" | "results" | "finished";
  players: Trader[];
  round: number;
  turn: number;
  deck: Card[];
  market: Card[];
  discard: Card[];
  goods: Record<Good, GoodsToken[]>;
  bonus: Record<BonusSize, BonusToken[]>;
  history: RoundResult[];
  winners: string[];
  sequence: number;
  event?: JaipurEvent;
}
export interface JaipurEvent {
  sequence: number;
  actor: string;
  kind: JaipurAction["type"];
  round: number;
  take?: Card[];
  give?: Card[];
  sold?: { kind: Good; count: number; values: number[]; bonus?: BonusSize };
  refill?: Card[];
  roundEnded?: boolean;
  finished?: boolean;
}
export interface PublicTrader {
  /** Open herd counts explicitly requested for this web presentation. */
  herdCount: number;
  id: string;
  name: string;
  avatar?: string | null;
  connected?: boolean;
  ready?: boolean;
  handCount: number;
  goodsCount: number;
  bonusCount: number;
  seals: number;
}
export interface SellOffer {
  good: Good;
  count: number;
  values: number[];
  goodsTotal: number;
  bonus?: BonusSize;
  bonusAvailable: boolean;
}
export type ExchangeOffer = [
  marketMask: number,
  handMask: number,
  camels: number,
];
export interface JaipurView {
  matchId?: string;
  gameId: "jaipur";
  code: string;
  revision: number;
  phase: "lobby" | JaipurState["phase"];
  players: PublicTrader[];
  turn?: string;
  round?: number;
  market?: Card[];
  deckCount?: number;
  discardCount?: number;
  discardTop?: Card;
  goods?: Record<Good, GoodsToken[]>;
  bonusCounts?: Record<BonusSize, number>;
  history?: RoundResult[];
  result?: RoundResult;
  winners?: string[];
  sequence?: number;
  event?: JaipurEvent;
  me?: {
    id: string;
    canManage?: boolean;
    hand: Card[];
    herd: Card[];
    goods: GoodsToken[];
    bonus: BonusToken[];
    subtotal: number;
    legal: (JaipurAction | { type: "ready"; ready: boolean })[];
    exchanges: ExchangeOffer[];
    sell: SellOffer[];
    take: { cardId: string; allowed: boolean; reason?: string }[];
  };
}
