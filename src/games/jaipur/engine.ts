import {
  CAMEL_TOKEN,
  SEALS,
  CARDS,
  CARD,
  GOODS,
  GOODS_TOKENS,
  BONUS_TOKENS,
  minimum,
  bonusSize,
  type Card,
  type Good,
  type BonusSize,
  type GoodsToken,
  type BonusToken,
} from "./data.js";
import type {
  JaipurState as State,
  JaipurAction as Action,
  Trader,
  RoundResult,
  Score,
  JaipurView,
  ExchangeOffer,
  SellOffer,
} from "./types.js";
type Random = () => number;
const shuffle = <T>(input: readonly T[], random: Random) => {
  const result = [...input];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
export const emptyPlayer = (id: string, name: string): Trader => ({
  id,
  name,
  hand: [],
  herd: [],
  goods: [],
  bonus: [],
  seals: 0,
});
function setup(s: State, random: Random) {
  const camels = CARDS.filter((c) => c.kind === "camel").slice(0, 3);
  s.market = structuredClone(camels);
  s.deck = shuffle(
    CARDS.filter((c) => !camels.some((x) => x.id === c.id)),
    random,
  ).map((c) => ({ ...c }));
  s.discard = [];
  for (const p of s.players) {
    const initial = s.deck.splice(0, 5);
    p.hand = initial.filter((c) => c.kind !== "camel");
    p.herd = initial.filter((c) => c.kind === "camel");
    p.goods = [];
    p.bonus = [];
  }
  s.market.push(...s.deck.splice(0, 2));
  s.goods = Object.fromEntries(
    GOODS.map((g) => [
      g,
      GOODS_TOKENS.filter((t) => t.kind === g).map((t) => ({ ...t })),
    ]),
  ) as State["goods"];
  s.bonus = Object.fromEntries(
    ([3, 4, 5] as const).map((size) => [
      size,
      shuffle(
        BONUS_TOKENS.filter((t) => t.size === size),
        random,
      ).map((t) => ({ ...t })),
    ]),
  ) as State["bonus"];
  s.phase = "playing";
}
export function createInitialState(
  seats: { id: string; name: string }[],
  random: Random,
  startingPlayerId?: string,
): State {
  if (seats.length !== 2 || new Set(seats.map((p) => p.id)).size !== 2)
    throw Error("ต้องมีผู้เล่น 2 คน");
  const turn =
    startingPlayerId === undefined
      ? Math.floor(random() * 2)
      : seats.findIndex((p) => p.id === startingPlayerId);
  if (turn < 0) throw Error("เลือกผู้เริ่มที่อยู่ในห้อง");
  const s: State = {
    phase: "playing",
    players: seats.map((p) => emptyPlayer(p.id, p.name)),
    round: 1,
    turn,
    deck: [],
    market: [],
    discard: [],
    goods: {} as State["goods"],
    bonus: {} as State["bonus"],
    history: [],
    winners: [],
    sequence: 0,
  };
  setup(s, random);
  return s;
}
export function subtotal(p: Trader) {
  return (
    p.goods.reduce((n, t) => n + t.value, 0) +
    p.bonus.reduce((n, t) => n + t.value, 0)
  );
}
export function settleRound(s: State, reason: RoundResult["reason"]) {
  if (s.phase !== "playing") throw Error("รอบนี้สรุปแล้ว");
  const herds = s.players.map((p) => p.herd.length),
    camelWinner =
      herds[0] === herds[1]
        ? undefined
        : s.players[herds[0] > herds[1] ? 0 : 1].id;
  const scores: Score[] = s.players.map((p) => ({
    id: p.id,
    goods: p.goods.reduce((n, t) => n + t.value, 0),
    bonus: p.bonus.reduce((n, t) => n + t.value, 0),
    camel: p.id === camelWinner ? CAMEL_TOKEN.value : 0,
    total: subtotal(p) + (p.id === camelWinner ? CAMEL_TOKEN.value : 0),
    goodsCount: p.goods.length,
    bonusCount: p.bonus.length,
    herd: p.herd.length,
    tokens: {
      goods: structuredClone(p.goods),
      bonus: structuredClone(p.bonus),
    },
  }));
  let winner: string | undefined,
    tieBreak: RoundResult["tieBreak"] = "draw";
  for (const [key, kind] of [
    ["total", "money"],
    ["bonusCount", "bonus"],
    ["goodsCount", "goods"],
  ] as const) {
    if (scores[0][key] !== scores[1][key]) {
      winner = scores[scores[0][key] > scores[1][key] ? 0 : 1].id;
      tieBreak = kind;
      break;
    }
  }
  if (winner) s.players.find((p) => p.id === winner)!.seals++;
  const nextStarter = winner
    ? s.players.find((p) => p.id !== winner)!.id
    : undefined;
  s.history.push({
    round: s.round,
    reason,
    scores,
    ...(winner
      ? { winner, sealId: SEALS[s.history.filter((r) => r.winner).length] }
      : {}),
    ...(camelWinner ? { camelWinner } : {}),
    tieBreak,
    ...(nextStarter ? { nextStarter } : {}),
  });
  const matchWinner = s.players.find((p) => p.seals >= 2);
  s.phase = matchWinner ? "finished" : "results";
  s.winners = matchWinner ? [matchWinner.id] : [];
}
export function sellOffer(
  s: State,
  p: Trader,
  good: Good,
  count: number,
): SellOffer | undefined {
  if (
    !GOODS.includes(good) ||
    !Number.isInteger(count) ||
    count < minimum(good) ||
    count > p.hand.filter((c) => c.kind === good).length
  )
    return;
  const values = s.goods[good].slice(0, count).map((t) => t.value),
    bonus = bonusSize(count);
  return {
    good,
    count,
    values,
    goodsTotal: values.reduce((a, b) => a + b, 0),
    ...(bonus ? { bonus } : {}),
    bonusAvailable: !!bonus && s.bonus[bonus].length > 0,
  };
}
function maskCards(cards: Card[], mask: number) {
  return cards.filter((_, i) => (mask & (1 << i)) !== 0);
}
export function exchangeOffers(s: State, p: Trader): ExchangeOffer[] {
  const offers: ExchangeOffer[] = [];
  for (let take = 1; take < 1 << s.market.length; take++) {
    const incoming = maskCards(s.market, take);
    if (incoming.length < 2 || incoming.some((c) => c.kind === "camel"))
      continue;
    for (let give = 0; give < 1 << p.hand.length; give++) {
      const outgoing = maskCards(p.hand, give),
        camels = incoming.length - outgoing.length;
      if (
        camels < 0 ||
        camels > p.herd.length ||
        p.hand.length - outgoing.length + incoming.length > 7 ||
        outgoing.some((c) => incoming.some((x) => x.kind === c.kind))
      )
        continue;
      offers.push([take, give, camels]);
    }
  }
  return offers;
}
export function getLegalActions(
  s: State,
  id: string,
  includeExchanges = true,
): Action[] {
  const p = s.players.find((p) => p.id === id);
  if (!p || s.phase === "finished") return [];
  if (s.phase === "results")
    return s.history.at(-1)!.nextStarter
      ? [{ type: "jaipur-next" }]
      : s.players.map((p) => ({ type: "jaipur-next", startingPlayerId: p.id }));
  if (s.players[s.turn].id !== id) return [];
  const legal: Action[] = [];
  if (p.hand.length < 7)
    for (const c of s.market)
      if (c.kind !== "camel") legal.push({ type: "jaipur-take", cardId: c.id });
  if (s.market.some((c) => c.kind === "camel"))
    legal.push({ type: "jaipur-camels" });
  for (const good of GOODS)
    for (
      let count = minimum(good);
      count <= p.hand.filter((c) => c.kind === good).length;
      count++
    )
      legal.push({ type: "jaipur-sell", good, count });
  if (includeExchanges)
    for (const [take, give, camels] of exchangeOffers(s, p))
      legal.push({
        type: "jaipur-exchange",
        marketIds: maskCards(s.market, take).map((c) => c.id),
        handIds: maskCards(p.hand, give).map((c) => c.id),
        camels,
      });
  return legal;
}
export function applyAction(
  original: State,
  actor: string,
  action: Action,
  random: Random,
): State {
  if (!action || typeof action !== "object" || Array.isArray(action))
    throw Error("เลือกการกระทำที่ถูกต้อง");
  const index = original.players.findIndex((p) => p.id === actor);
  if (index < 0) throw Error("ไม่ใช่ผู้เล่นในห้อง");
  if (original.phase === "finished") throw Error("จบ match แล้ว");
  const keys = Object.keys(action).sort().join(",");
  const s = structuredClone(original),
    p = s.players[index];
  if (action.type === "jaipur-next")
    return nextRound(original, action, random, actor);
  if (s.phase !== "playing" || index !== s.turn)
    throw Error("ยังไม่ถึงตาของคุณ");
  const event: NonNullable<State["event"]> = {
    sequence: s.sequence + 1,
    actor,
    kind: action.type,
    round: s.round,
  };
  let refill = false;
  if (action.type === "jaipur-take") {
    if (keys !== "cardId,type" || typeof action.cardId !== "string")
      throw Error("เลือกสินค้าหนึ่งใบ");
    const n = s.market.findIndex((c) => c.id === action.cardId);
    if (n < 0 || s.market[n].kind === "camel")
      throw Error("หยิบสินค้า 1 ใบ หรือเลือกอูฐทั้งหมด");
    if (p.hand.length >= 7) throw Error("มือครบ 7 ใบแล้ว เลือกแลกหรือขาย");
    const [card] = s.market.splice(n, 1);
    p.hand.push(card);
    event.take = [card];
    refill = true;
  } else if (action.type === "jaipur-camels") {
    if (keys !== "type") throw Error("หยิบอูฐทั้งหมดเท่านั้น");
    const cards = s.market.filter((c) => c.kind === "camel");
    if (!cards.length) throw Error("ตลาดไม่มีอูฐ");
    s.market = s.market.filter((c) => c.kind !== "camel");
    p.herd.push(...cards);
    event.take = cards;
    refill = true;
  } else if (action.type === "jaipur-exchange") {
    if (
      keys !== "camels,handIds,marketIds,type" ||
      !Array.isArray(action.marketIds) ||
      !Array.isArray(action.handIds) ||
      action.marketIds.length > 5 ||
      action.handIds.length > 7 ||
      action.marketIds.some((x) => typeof x !== "string") ||
      action.handIds.some((x) => typeof x !== "string") ||
      new Set(action.marketIds).size !== action.marketIds.length ||
      new Set(action.handIds).size !== action.handIds.length ||
      !Number.isInteger(action.camels) ||
      action.camels < 0 ||
      action.camels > p.herd.length
    )
      throw Error("เลือกไพ่แลกและจำนวนอูฐให้ถูกต้อง");
    const incoming = s.market.filter((c) => action.marketIds.includes(c.id)),
      outgoing = p.hand.filter((c) => action.handIds.includes(c.id));
    if (
      incoming.length !== action.marketIds.length ||
      outgoing.length !== action.handIds.length ||
      incoming.length < 2 ||
      incoming.some((c) => c.kind === "camel") ||
      incoming.length !== outgoing.length + action.camels
    )
      throw Error("รับสินค้าอย่างน้อย 2 ใบ และคืนจำนวนเท่ากัน");
    if (outgoing.some((c) => incoming.some((x) => x.kind === c.kind)))
      throw Error("รับและคืนสินค้าชนิดเดียวกันไม่ได้");
    if (p.hand.length - outgoing.length + incoming.length > 7)
      throw Error("แลกแล้วมือจะเกิน 7 ใบ");
    const returned = [...outgoing, ...p.herd.splice(0, action.camels)];
    p.hand = p.hand.filter((c) => !action.handIds.includes(c.id));
    p.hand.push(...incoming);
    s.market = s.market.map((c) => {
      const i = action.marketIds.indexOf(c.id);
      return i < 0 ? c : returned[i];
    });
    event.take = incoming;
    event.give = returned;
  } else if (action.type === "jaipur-sell") {
    if (keys !== "count,good,type" || !GOODS.includes(action.good))
      throw Error("ขายสินค้าเพียงชนิดเดียว");
    const offer = sellOffer(s, p, action.good, action.count);
    if (!offer)
      throw Error(
        ["diamond", "gold", "silver"].includes(action.good)
          ? "เพชร ทอง เงิน ต้องขายอย่างน้อย 2 ใบ และต้องมีไพ่ครบ"
          : "เลือกจำนวนไพ่ที่มีในมือ",
      );
    const sold = p.hand
      .filter((c) => c.kind === action.good)
      .slice(0, action.count);
    p.hand = p.hand.filter((c) => !sold.some((x) => x.id === c.id));
    s.discard.push(...sold);
    p.goods.push(...s.goods[action.good].splice(0, action.count));
    if (offer.bonusAvailable) p.bonus.push(s.bonus[offer.bonus!].shift()!);
    event.sold = {
      kind: action.good,
      count: action.count,
      values: offer.values,
      ...(offer.bonusAvailable ? { bonus: offer.bonus } : {}),
    };
  } else throw Error("เลือกหยิบ แลก หรือขาย");
  if (refill) {
    event.refill = s.deck.splice(0, 5 - s.market.length);
    s.market.push(...event.refill);
  }
  if (GOODS.filter((g) => s.goods[g].length === 0).length >= 3)
    settleRound(s, "tokens");
  else if (s.market.length < 5) settleRound(s, "deck");
  if (s.phase === "playing") s.turn = 1 - s.turn;
  else {
    event.roundEnded = true;
    event.finished = s.phase === "finished";
  }
  s.sequence++;
  s.event = event;
  return s;
}
export function getDisplayView(
  s: State,
  code: string,
  revision: number,
): JaipurView {
  return {
    gameId: "jaipur",
    ...(s.matchId ? { matchId: s.matchId } : {}),
    code,
    revision,
    phase: s.phase,
    players: s.players.map((p) => ({
      id: p.id,
      name: p.name,
      handCount: p.hand.length,
      herdCount: p.herd.length,
      goodsCount: p.goods.length,
      bonusCount: p.bonus.length,
      seals: p.seals,
    })),
    ...(s.phase === "playing" ? { turn: s.players[s.turn].id } : {}),
    round: s.round,
    market: structuredClone(s.market),
    deckCount: s.deck.length,
    discardCount: s.discard.length,
    ...(s.discard.at(-1) ? { discardTop: { ...s.discard.at(-1)! } } : {}),
    goods: structuredClone(s.goods),
    bonusCounts: {
      3: s.bonus[3].length,
      4: s.bonus[4].length,
      5: s.bonus[5].length,
    },
    history: structuredClone(s.history),
    ...(s.phase !== "playing"
      ? { result: structuredClone(s.history.at(-1)!) }
      : {}),
    winners: [...s.winners],
    sequence: s.sequence,
    event: s.event ? structuredClone(s.event) : undefined,
  };
}
export function getPlayerView(
  s: State,
  id: string,
): NonNullable<JaipurView["me"]> {
  const p = s.players.find((p) => p.id === id);
  if (!p) throw Error("ไม่ใช่ผู้เล่น");
  const active = s.phase === "playing" && s.players[s.turn].id === id;
  return {
    id,
    hand: structuredClone(p.hand),
    herd: structuredClone(p.herd),
    goods: structuredClone(p.goods),
    bonus: structuredClone(p.bonus),
    subtotal: subtotal(p),
    legal: getLegalActions(s, id, false),
    exchanges: active ? exchangeOffers(s, p) : [],
    sell: active
      ? GOODS.flatMap((g) =>
          Array.from(
            { length: p.hand.filter((c) => c.kind === g).length },
            (_, i) => sellOffer(s, p, g, i + 1),
          ).filter((x): x is SellOffer => !!x),
        )
      : [],
    take: s.market
      .filter((c) => c.kind !== "camel")
      .map((c) => ({
        cardId: c.id,
        allowed: active && p.hand.length < 7,
        ...(!active
          ? { reason: "รอเจ้าของตา" }
          : p.hand.length >= 7
            ? { reason: "มือครบ 7 ใบแล้ว" }
            : {}),
      })),
  };
}
export const isFinished = (s: State) => s.phase === "finished";

export function nextRound(
  original: State,
  action: Extract<Action, { type: "jaipur-next" }>,
  random: Random,
  actor = "host",
): State {
  const s = structuredClone(original),
    keys = Object.keys(action).sort().join(",");
  if (
    !["type", "startingPlayerId,type"].includes(keys) ||
    s.phase !== "results"
  )
    throw Error("เริ่มรอบถัดไปหลังสรุปรอบเท่านั้น");
  const required = s.history.at(-1)!.nextStarter;
  if (
    required &&
    action.startingPlayerId !== undefined &&
    action.startingPlayerId !== required
  )
    throw Error("ผู้แพ้รอบก่อนเริ่มรอบถัดไป");
  const starter = required ?? action.startingPlayerId;
  const next = s.players.findIndex((p) => p.id === starter);
  if (next < 0) throw Error("รอบเสมอ: ตกลงเลือกผู้เริ่มรอบใหม่");
  s.turn = next;
  s.round++;
  setup(s, random);
  s.sequence++;
  s.event = { sequence: s.sequence, actor, kind: action.type, round: s.round };
  return s;
}
