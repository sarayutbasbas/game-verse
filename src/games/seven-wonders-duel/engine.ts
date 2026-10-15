import {
  CARDS,
  CARD,
  WONDERS,
  TOKENS,
  RESOURCES,
  LAYOUTS,
  type Card,
  type Wonder,
  type Token,
  type Effect,
  type Resource,
} from "./data.js";
import type {
  WondersState as State,
  WondersAction as Action,
  Citizen,
  Quote,
  WondersView,
  Decision,
  ReturnTypeScore,
} from "./types.js";
type Random = () => number;
function shuffle<T>(a: readonly T[], random: Random): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
export const emptyPlayer = (id: string, name: string): Citizen => ({
  id,
  name,
  coins: 7,
  buildings: [],
  wonders: [],
  tokens: [],
});
export const effects = (p: Citizen): Effect[] => [
  ...p.buildings.map((id) => CARD[id]),
  ...p.wonders
    .filter((w) => w.card)
    .map((w) => WONDERS.find((x) => x.id === w.id)!),
];
export const science = (p: Citizen) => [
  ...p.buildings.map((id) => CARD[id].science).filter(Boolean),
  ...(p.tokens.includes("law") ? ["law"] : []),
];
const count = (p: Citizen, kind: string) =>
  kind === "wonder"
    ? p.wonders.filter((w) => w.card).length
    : kind === "treasury"
      ? Math.floor(p.coins / 3)
      : p.buildings.filter((id) =>
          kind === "materials"
            ? ["brown", "grey"].includes(CARD[id].color)
            : CARD[id].color === kind,
        ).length;
const guildValue = (s: State, kind: string) =>
  Math.max(...s.players.map((p) => count(p, kind))) *
  (kind === "wonder" ? 2 : 1);
export function createInitialState(
  seats: { id: string; name: string }[],
  random: Random,
  startingPlayerId?: string,
): State {
  if (seats.length !== 2 || new Set(seats.map((p) => p.id)).size !== 2)
    throw Error("ต้องมีผู้เล่น 2 คน");
  const starter =
    startingPlayerId === undefined
      ? Math.floor(random() * 2)
      : seats.findIndex((p) => p.id === startingPlayerId);
  if (starter < 0) throw Error("เลือกผู้เริ่มในห้อง");
  const decks = {} as State["decks"];
  const removed: string[] = [];
  for (const age of [1, 2, 3] as const) {
    const d = shuffle(
      CARDS.filter((c) => c.age === age && c.color !== "purple").map(
        (c) => c.id,
      ),
      random,
    );
    removed.push(...d.splice(0, 3));
    decks[age] = d;
  }
  const guilds = shuffle(
    CARDS.filter((c) => c.color === "purple").map((c) => c.id),
    random,
  );
  decks[3].push(...guilds.splice(0, 3));
  removed.push(...guilds);
  decks[3] = shuffle(decks[3], random);
  const progress = shuffle(TOKENS, random),
    wonderDeck = shuffle(
      WONDERS.map((w) => w.id),
      random,
    ),
    wonderPool = wonderDeck.splice(0, 4);
  return {
    phase: "setup",
    players: seats.map((p) => emptyPlayer(p.id, p.name)),
    turn: starter,
    starter,
    age: 1,
    decks,
    removed,
    layout: [],
    discard: [],
    progress: progress.splice(0, 5),
    boxTokens: progress,
    wonderDeck,
    wonderPool,
    draftStep: 0,
    military: 0,
    militaryUsed: [],
    extra: false,
    winners: [],
    sequence: 0,
  };
}
function deal(s: State) {
  s.layout = LAYOUTS[s.age].map((slot, i) => ({
    slot: slot.id,
    card: s.decks[s.age][i],
    faceUp: slot.faceUp,
  }));
  s.decks[s.age] = [];
}
export function accessible(s: State, slot: number) {
  const x = s.layout.find((x) => x.slot === slot);
  return (
    !!x &&
    !LAYOUTS[s.age][slot].coveredBy.some((id) =>
      s.layout.some((x) => x.slot === id),
    )
  );
}
export function quote(
  s: State,
  p: Citizen,
  target: Card | Wonder,
  free = false,
): Quote {
  const card = "color" in target ? target : undefined;
  const chain = !!(
    card?.chainFrom &&
    p.buildings.some((id) => CARD[id].chain === card.chainFrom)
  );
  const prices = {} as Record<Resource, number>,
    own: Partial<Record<Resource, number>> = {},
    missing: Partial<Record<Resource, number>> = {};
  const enemy = s.players.find((x) => x.id !== p.id)!;
  for (const r of RESOURCES) {
    own[r] = effects(p).reduce((n, e) => n + (e.produce?.[r] ?? 0), 0);
    prices[r] = effects(p).some((e) => e.discount?.includes(r))
      ? 1
      : 2 +
        enemy.buildings
          .filter((id) => ["brown", "grey"].includes(CARD[id].color))
          .reduce((n, id) => n + (CARD[id].produce?.[r] ?? 0), 0);
    missing[r] = Math.max(0, (target.cost[r] ?? 0) - (own[r] ?? 0));
  }
  const rebate =
    (!card && p.tokens.includes("architecture")) ||
    (card?.color === "blue" && p.tokens.includes("masonry"))
      ? 2
      : 0;
  const choices = effects(p).flatMap((e) => (e.flexible ? [e.flexible] : []));
  const flexibleCount = choices.length;
  for (let i = 0; i < rebate; i++) choices.push([...RESOURCES]);
  let best = Infinity,
    bestMissing = { ...missing },
    bestProduction = { ...own };
  function choose(
    i: number,
    m: Partial<Record<Resource, number>>,
    production: Partial<Record<Resource, number>>,
  ) {
    if (i === choices.length) {
      const total = RESOURCES.reduce((n, r) => n + (m[r] ?? 0) * prices[r], 0);
      if (total < best) {
        best = total;
        bestMissing = { ...m };
        bestProduction = { ...production };
      }
      return;
    }
    choose(i + 1, m, production);
    for (const r of choices[i])
      if (m[r])
        choose(
          i + 1,
          { ...m, [r]: m[r]! - 1 },
          i < flexibleCount
            ? { ...production, [r]: (production[r] ?? 0) + 1 }
            : production,
        );
  }
  choose(0, missing, own);
  const printed = free || chain ? 0 : (card?.coinCost ?? 0);
  const trade = free || chain ? 0 : best;
  const reason =
    card && p.buildings.includes(card.id)
      ? "สร้างอาคารชื่อนี้แล้ว"
      : !card &&
          p.wonders.some((w) => w.id === target.id && (w.card || w.removed))
        ? "Wonder นี้สร้างไม่ได้"
        : p.coins < printed + trade
          ? "เหรียญไม่พอ"
          : undefined;
  return {
    total: printed + trade,
    printed,
    trade,
    chain,
    rebate,
    produced: bestProduction,
    missing: free || chain ? {} : bestMissing,
    prices,
    affordable: !reason,
    ...(reason ? { reason } : {}),
  };
}
function finish(s: State, actor: Citizen, kind: "science" | "military") {
  s.phase = "finished";
  s.winners = [actor.id];
  s.victory = kind;
  delete s.pending;
}
function supremacy(s: State, p: Citizen) {
  if (Math.abs(s.military) >= 9) {
    finish(s, s.players[s.military > 0 ? 0 : 1], "military");
    return true;
  }
  if (new Set(science(p)).size >= 6) {
    finish(s, p, "science");
    return true;
  }
  return false;
}
function token(s: State, p: Citizen, id: Token) {
  p.tokens.push(id);
  if (id === "agriculture" || id === "urbanism") p.coins += 6;
  supremacy(s, p);
}
function setDecision(
  s: State,
  p: Citizen,
  kind: Decision["kind"],
  options: string[],
) {
  if (options.length) s.pending = { kind, actor: p.id, options };
}
function applyEffects(
  s: State,
  p: Citizen,
  e: Effect,
  random: Random,
  isRed = false,
) {
  const other = s.players.find((x) => x.id !== p.id)!;
  p.coins += e.coins ?? 0;
  if (e.income) p.coins += count(p, e.income.kind) * e.income.rate;
  if (e.guild && !["wonder", "treasury"].includes(e.guild))
    p.coins += guildValue(s, e.guild);
  if (e.shields) {
    const direction = s.players[0].id === p.id ? 1 : -1,
      n = e.shields + (isRed && p.tokens.includes("strategy") ? 1 : 0);
    for (let i = 0; i < n; i++) {
      s.military += direction;
      for (const threshold of [3, 6]) {
        const zone = Math.sign(s.military) * threshold;
        if (
          Math.abs(s.military) >= threshold &&
          Math.sign(s.military) === direction &&
          !s.militaryUsed.includes(zone)
        ) {
          other.coins = Math.max(0, other.coins - (threshold === 3 ? 2 : 5));
          s.militaryUsed.push(zone);
        }
      }
      if (supremacy(s, p)) return;
    }
  }
  if (supremacy(s, p)) return;
  if (e.science && science(p).filter((x) => x === e.science).length === 2)
    setDecision(s, p, "progress", [...s.progress]);
  if (e.extra) s.extra = true;
  if (e.decision === "destroy-brown" || e.decision === "destroy-grey")
    setDecision(
      s,
      p,
      e.decision,
      other.buildings.filter(
        (id) =>
          CARD[id].color ===
          (e.decision === "destroy-brown" ? "brown" : "grey"),
      ),
    );
  if (e.decision === "discard")
    setDecision(
      s,
      p,
      "discard",
      s.discard.filter((id) => !p.buildings.includes(id)),
    );
  if (e.decision === "library")
    setDecision(s, p, "library", shuffle(s.boxTokens, random).slice(0, 3));
}
function completeTurn(s: State) {
  if (s.phase === "finished" || s.pending) return;
  if (!s.layout.length) {
    if (s.age === 3) {
      s.phase = "finished";
      s.victory = "civilian";
      const scores = s.players.map((p) => scorePlayer(s, p));
      const max = Math.max(...scores.map((x) => x.total));
      const tied = scores.filter((x) => x.total === max);
      const blue = Math.max(...tied.map((x) => x.blue));
      s.winners = tied.filter((x) => x.blue === blue).map((x) => x.id);
      return;
    }
    const chooser = s.military === 0 ? s.turn : s.military > 0 ? 1 : 0;
    s.age = (s.age + 1) as 2 | 3;
    deal(s);
    s.extra = false;
    s.pending = {
      kind: "starter",
      actor: s.players[chooser].id,
      options: s.players.map((p) => p.id),
    };
    s.turn = chooser;
    return;
  }
  s.turn = s.extra ? s.turn : 1 - s.turn;
  s.extra = false;
}
function pay(s: State, p: Citizen, q: Quote) {
  if (!q.affordable) throw Error(q.reason ?? "สร้างไม่ได้");
  p.coins -= q.total;
  const other = s.players.find((x) => x.id !== p.id)!;
  if (other.tokens.includes("economy")) other.coins += q.trade;
  if (q.chain && p.tokens.includes("urbanism")) p.coins += 4;
}
export function applyAction(
  original: State,
  actor: string,
  action: Action,
  random: Random,
): State {
  if (!action || typeof action !== "object" || Array.isArray(action))
    throw Error("คำสั่งไม่ถูกต้อง");
  if (original.phase === "finished") throw Error("เกมจบแล้ว");
  if (original.players[original.turn]?.id !== actor)
    throw Error("ยังไม่ถึงตาของคุณ");
  const s = structuredClone(original),
    p = s.players[s.turn];
  const keys = Object.keys(action).sort().join(",");
  let eventCard: string | undefined, eventSlot: number | undefined;
  if (s.phase === "setup") {
    if (
      action.type !== "wonders-pick" ||
      keys !== "type,wonder" ||
      !s.wonderPool.includes(action.wonder)
    )
      throw Error("เลือก Wonder ที่เปิดอยู่");
    p.wonders.push({ id: action.wonder });
    s.wonderPool.splice(s.wonderPool.indexOf(action.wonder), 1);
    s.draftStep++;
    if (s.draftStep === 4) s.wonderPool = s.wonderDeck.splice(0, 4);
    if (s.draftStep === 8) {
      s.phase = "playing";
      s.turn = s.starter;
      deal(s);
    } else {
      s.turn = [
        s.starter,
        1 - s.starter,
        1 - s.starter,
        s.starter,
        1 - s.starter,
        s.starter,
        s.starter,
        1 - s.starter,
      ][s.draftStep];
    }
  } else if (s.pending) {
    if (
      action.type !== "wonders-decide" ||
      keys !== "choice,type" ||
      !s.pending.options.includes(action.choice) ||
      s.pending.actor !== actor
    )
      throw Error("เลือกตัวเลือกที่ server เสนอ");
    const decision = s.pending;
    delete s.pending;
    if (decision.kind === "starter") {
      s.turn = s.players.findIndex((p) => p.id === action.choice);
    } else {
      if (decision.kind === "progress" || decision.kind === "library") {
        const collection =
          decision.kind === "progress" ? s.progress : s.boxTokens;
        collection.splice(collection.indexOf(action.choice as Token), 1);
        token(s, p, action.choice as Token);
      } else if (decision.kind === "discard") {
        s.discard.splice(s.discard.indexOf(action.choice), 1);
        p.buildings.push(action.choice);
        eventCard = action.choice;
        applyEffects(
          s,
          p,
          CARD[action.choice],
          random,
          CARD[action.choice].color === "red",
        );
      } else {
        const other = s.players[1 - s.turn];
        other.buildings.splice(other.buildings.indexOf(action.choice), 1);
        s.discard.push(action.choice);
      }
      completeTurn(s);
    }
  } else {
    if (
      action.type !== "wonders-play" ||
      !["mode,slot,type", "mode,slot,type,wonder"].includes(keys) ||
      !Number.isInteger(action.slot) ||
      !accessible(s, action.slot) ||
      !["build", "discard", "wonder"].includes(action.mode) ||
      (action.mode !== "wonder" && action.wonder !== undefined)
    )
      throw Error("เลือกการ์ดที่ไม่ถูกบังและการกระทำที่ถูกต้อง");
    const node = s.layout.find((x) => x.slot === action.slot)!;
    if (!node.faceUp) throw Error("การ์ดยังไม่เปิด");
    const card = CARD[node.card];
    eventCard = card.id;
    eventSlot = action.slot;
    if (action.mode === "build") {
      const q = quote(s, p, card);
      pay(s, p, q);
      p.buildings.push(card.id);
      applyEffects(s, p, card, random, card.color === "red");
    }
    if (action.mode === "discard") {
      s.discard.push(card.id);
      p.coins += 2 + count(p, "yellow");
    }
    if (action.mode === "wonder") {
      const w = p.wonders.find((w) => w.id === action.wonder),
        data = WONDERS.find((w) => w.id === action.wonder);
      if (
        !w ||
        !data ||
        w.card ||
        w.removed ||
        s.players.reduce((n, p) => n + count(p, "wonder"), 0) >= 7
      )
        throw Error("เลือก Wonder ที่ยังสร้างได้");
      pay(s, p, quote(s, p, data));
      w.card = card.id;
      if (data.id === "appian-way")
        s.players[1 - s.turn].coins = Math.max(
          0,
          s.players[1 - s.turn].coins - 3,
        );
      s.extra = !!data.extra || p.tokens.includes("theology");
      applyEffects(s, p, data, random);
      if (s.players.reduce((n, p) => n + count(p, "wonder"), 0) === 7)
        for (const x of s.players)
          for (const y of x.wonders) if (!y.card) y.removed = true;
    }
    s.layout.splice(s.layout.indexOf(node), 1);
    completeTurn(s);
  }
  const revealed: number[] = [];
  if (s.phase !== "setup")
    for (const node of s.layout)
      if (!node.faceUp && accessible(s, node.slot)) {
        node.faceUp = true;
        revealed.push(node.slot);
      }
  // Never expose identities of sacrificed age cards or secret choices in public events.
  s.sequence++;
  s.event = {
    sequence: s.sequence,
    actor,
    kind: action.type === "wonders-play" ? action.mode : action.type,
    ...(action.type === "wonders-play" && action.mode === "wonder"
      ? {}
      : eventCard
        ? { card: eventCard }
        : {}),
    ...(eventSlot !== undefined ? { slot: eventSlot } : {}),
    revealed,
    age: s.age,
  };
  return s;
}
export function scorePlayer(s: State, p: Citizen): ReturnTypeScore {
  const buildings = p.buildings.reduce(
      (n, id) => n + (CARD[id].points ?? 0),
      0,
    ),
    blue = p.buildings
      .filter((id) => CARD[id].color === "blue")
      .reduce((n, id) => n + (CARD[id].points ?? 0), 0);
  const wonders = p.wonders
    .filter((w) => w.card)
    .reduce((n, w) => n + (WONDERS.find((x) => x.id === w.id)?.points ?? 0), 0);
  const progress =
    (p.tokens.includes("agriculture") ? 4 : 0) +
    (p.tokens.includes("philosophy") ? 7 : 0) +
    (p.tokens.includes("mathematics") ? 3 * p.tokens.length : 0);
  const guilds = p.buildings.reduce(
      (n, id) => n + (CARD[id].guild ? guildValue(s, CARD[id].guild!) : 0),
      0,
    ),
    treasury = Math.floor(p.coins / 3);
  const advantage = (s.players[0].id === p.id ? 1 : -1) * s.military;
  const military =
    advantage >= 6 ? 10 : advantage >= 3 ? 5 : advantage > 0 ? 2 : 0;
  return {
    id: p.id,
    buildings,
    blue,
    wonders,
    progress,
    military,
    treasury,
    guilds,
    total: buildings + wonders + progress + military + treasury + guilds,
  };
}
export function getLegalActions(s: State, id: string): Action[] {
  if (s.phase === "finished" || s.players[s.turn]?.id !== id) return [];
  if (s.phase === "setup")
    return s.wonderPool.map((wonder) => ({ type: "wonders-pick", wonder }));
  if (s.pending)
    return s.pending.options.map((choice) => ({
      type: "wonders-decide",
      choice,
    }));
  const p = s.players[s.turn],
    actions: Action[] = [];
  for (const node of s.layout)
    if (accessible(s, node.slot)) {
      actions.push({ type: "wonders-play", slot: node.slot, mode: "discard" });
      if (quote(s, p, CARD[node.card]).affordable)
        actions.push({ type: "wonders-play", slot: node.slot, mode: "build" });
      for (const w of p.wonders)
        if (
          !w.card &&
          !w.removed &&
          quote(
            s,
            p,
            WONDERS.find((x) => x.id === w.id)!,
          ).affordable
        )
          actions.push({
            type: "wonders-play",
            slot: node.slot,
            mode: "wonder",
            wonder: w.id,
          });
    }
  return actions;
}
export function getDisplayView(
  s: State,
  code: string,
  revision: number,
): WondersView {
  return {
    gameId: "seven-wonders-duel",
    code,
    revision,
    phase: s.phase,
    players: s.players.map((p) => ({
      id: p.id,
      name: p.name,
      coins: p.coins,
      production: {
        fixed: Object.fromEntries(
          RESOURCES.map((r) => [
            r,
            effects(p).reduce((n, e) => n + (e.produce?.[r] ?? 0), 0),
          ]),
        ),
        flexible: effects(p).flatMap((e) => (e.flexible ? [e.flexible] : [])),
        discounts: [...new Set(effects(p).flatMap((e) => e.discount ?? []))],
      },
      buildings: [...p.buildings],
      tokens: [...p.tokens],
      wonders: p.wonders.map(({ id, card, removed }) => ({
        id,
        ...(card ? { card: "built" } : {}),
        ...(removed ? { removed } : {}),
      })),
    })),
    age: s.age,
    turn: s.players[s.turn].id,
    layout: s.layout.map((n) => ({
      slot: n.slot,
      faceUp: n.faceUp,
      accessible: accessible(s, n.slot),
      ...(n.faceUp ? { card: n.card } : {}),
    })),
    wonderPool: [...s.wonderPool],
    progress: [...s.progress],
    military: s.military,
    militaryUsed: [...s.militaryUsed],
    discard: [...s.discard],
    ...(s.pending
      ? {
          pending: {
            kind: s.pending.kind,
            actor: s.pending.actor,
            ...(s.pending.kind === "library"
              ? {}
              : { options: [...s.pending.options] }),
          },
        }
      : {}),
    winners: [...s.winners],
    victory: s.victory,
    scores: s.players.map((p) => scorePlayer(s, p)),
    sequence: s.sequence,
    event: s.event,
  };
}
export function getPlayerView(
  s: State,
  id: string,
): NonNullable<WondersView["me"]> {
  const p = s.players.find((p) => p.id === id);
  if (!p) throw Error("ไม่ใช่ผู้เล่น");
  return {
    id,
    legal: getLegalActions(s, id),
    offers:
      s.phase === "playing" && !s.pending && s.players[s.turn].id === id
        ? s.layout
            .filter((n) => accessible(s, n.slot))
            .map((n) => ({
              slot: n.slot,
              build: quote(s, p, CARD[n.card]),
              discard: 2 + count(p, "yellow"),
              wonders: p.wonders
                .filter((w) => !w.card && !w.removed)
                .map((w) => ({
                  id: w.id,
                  quote: quote(
                    s,
                    p,
                    WONDERS.find((x) => x.id === w.id)!,
                  ),
                })),
            }))
        : [],
    ...(s.pending?.actor === id
      ? { decision: structuredClone(s.pending) }
      : {}),
  };
}
export const isFinished = (s: State) => s.phase === "finished";
