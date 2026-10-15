export const GOODS = [
  "diamond",
  "gold",
  "silver",
  "cloth",
  "spice",
  "leather",
] as const;
export type Good = (typeof GOODS)[number];
export type Kind = Good | "camel";
export const NAMES: Record<Kind, string> = {
  diamond: "เพชร",
  gold: "ทอง",
  silver: "เงิน",
  cloth: "ผ้า",
  spice: "เครื่องเทศ",
  leather: "หนัง",
  camel: "อูฐ",
};
export const COUNTS: Record<Kind, number> = {
  diamond: 6,
  gold: 6,
  silver: 6,
  cloth: 8,
  spice: 8,
  leather: 10,
  camel: 11,
};
export const VALUES: Record<Good, readonly number[]> = {
  diamond: [7, 7, 5, 5, 5],
  gold: [6, 6, 5, 5, 5],
  silver: [5, 5, 5, 5, 5],
  cloth: [5, 3, 3, 2, 2, 1, 1],
  spice: [5, 3, 3, 2, 2, 1, 1],
  leather: [4, 3, 2, 1, 1, 1, 1, 1, 1],
};
export const BONUS_VALUES = {
  3: [1, 1, 2, 2, 2, 3, 3],
  4: [4, 4, 5, 5, 6, 6],
  5: [8, 8, 9, 10, 10],
} as const;
export type BonusSize = 3 | 4 | 5;
export interface Card {
  id: string;
  kind: Kind;
}
export interface GoodsToken {
  id: string;
  kind: Good;
  value: number;
}
export interface BonusToken {
  id: string;
  size: BonusSize;
  value: number;
}
export const CARDS: readonly Card[] = Object.entries(COUNTS).flatMap(
  ([kind, n]) =>
    Array.from({ length: n }, (_, i) => ({
      id: `${kind}-${i}`,
      kind: kind as Kind,
    })),
);
export const CARD = Object.fromEntries(CARDS.map((c) => [c.id, c])) as Record<
  string,
  Card
>;
export const GOODS_TOKENS: readonly GoodsToken[] = GOODS.flatMap((kind) =>
  VALUES[kind].map((value, i) => ({ id: `goods-${kind}-${i}`, kind, value })),
);
export const BONUS_TOKENS: readonly BonusToken[] = ([3, 4, 5] as const).flatMap(
  (size) =>
    BONUS_VALUES[size].map((value, i) => ({
      id: `bonus-${size}-${i}`,
      size,
      value,
    })),
);
export const minimum = (kind: Good) =>
  ["diamond", "gold", "silver"].includes(kind) ? 2 : 1;
export const bonusSize = (count: number): BonusSize | undefined =>
  count >= 5 ? 5 : count === 4 ? 4 : count === 3 ? 3 : undefined;

export const CAMEL_TOKEN = { id: "camel-token", value: 5 } as const;
export const SEALS = ["seal-1", "seal-2", "seal-3"] as const;
