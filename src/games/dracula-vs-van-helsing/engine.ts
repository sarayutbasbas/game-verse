import {
  SUITS,
  ROLES,
  ROLE_NAME,
  EFFECTS,
  SUIT_NAME,
  type Card,
  type DuelState,
  type DuelPlayer,
  type DuelAction,
  type DuelView,
  type Character,
  type Suit,
} from "./types.js";
export const allCards = (): Card[] =>
  SUITS.flatMap((suit) =>
    Array.from({ length: 8 }, (_, i) => ({
      suit,
      value: i + 1,
      revealed: false,
    })),
  );
function shuffle<T>(items: T[], random: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const r = random();
    if (r < 0 || r >= 1 || !Number.isFinite(r))
      throw Error("Invalid random source");
    const j = Math.floor(r * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function deal(s: DuelState, random: () => number) {
  s.deck = shuffle(allCards(), random);
  s.discard = [];
  s.drawn = undefined;
  s.effect = undefined;
  s.ending = undefined;
  for (const p of s.players) p.cards = s.deck.splice(0, 5);
  s.turn = s.players.find((p) => p.character === "dracula")!.id;
  s.step = "draw";
  s.phase = "playing";
  s.acknowledged = [];
  s.lastEvent = "deal";
  s.lastExchange = undefined;
  s.reveals = undefined;
  s.revealStart = undefined;
}
export function createInitialState(
  players: { id: string; name: string; character?: Character }[],
  random: () => number,
): DuelState {
  if (
    players.length !== 2 ||
    ROLES.some((r) => !players.some((p) => p.character === r)) ||
    new Set(players.map((p) => p.id)).size !== 2
  )
    throw Error("ต้องมี Dracula และ Van Helsing คนละหนึ่งคน");
  const s: DuelState = {
    phase: "playing",
    step: "draw",
    players: players.map((p) => ({ ...p, character: p.character!, cards: [] })),
    turn: "",
    round: 1,
    hp: 12,
    vampires: [0, 0, 0, 0, 0],
    ranking: shuffle([...SUITS], random),
    deck: [],
    discard: [],
    acknowledged: [],
  };
  deal(s, random);
  return s;
}
export function compareCards(
  a: Card,
  b: Card,
  ranking: Suit[],
): { winner: Character; reason: string } {
  if (a.suit === b.suit && a.value === b.value)
    throw Error("การ์ดซ้ำผิด invariant: สำรับมีสีและเลขละใบ");
  const at = a.suit === ranking[0],
    bt = b.suit === ranking[0];
  if (at !== bt)
    return { winner: at ? "dracula" : "helsing", reason: "สีทรัมป์ชนะสีอื่น" };
  if (a.value !== b.value)
    return {
      winner: a.value > b.value ? "dracula" : "helsing",
      reason: at ? "ทรัมป์ทั้งคู่ เลขสูงกว่าชนะ" : "เลขสูงกว่าชนะ",
    };
  return {
    winner:
      ranking.indexOf(a.suit) < ranking.indexOf(b.suit) ? "dracula" : "helsing",
    reason: "เลขเท่ากัน สีอันดับสูงกว่าชนะ",
  };
}
export function revealsComplete(s: DuelState) {
  return !s.reveals || ROLES.every(role=>s.reveals![role].every(Boolean));
}
function resolve(s: DuelState, cause: string) {
  s.revealStart={hp:s.hp,vampires:[...s.vampires]};
  s.reveals=Object.fromEntries(s.players.map(p=>[p.character,p.cards.map(c=>c.revealed)])) as Record<Character,boolean[]>;
  const cards = Object.fromEntries(
    s.players.map((p) => [
      p.character,
      p.cards.map((c) => ({ ...c, revealed: true })),
    ]),
  ) as Record<Character, Card[]>;
  s.result = {
    round: s.round,
    cards,
    ranking: [...s.ranking],
    districts: [],
    cause,
  };
  s.drawn = undefined;
  s.effect = undefined;
  for (let i = 0; i < 5; i++) {
    const result = compareCards(cards.dracula[i], cards.helsing[i], s.ranking);
    if (result.winner === "dracula") s.vampires[i]++;
    else s.hp--;
    s.result.districts.push({
      district: i,
      ...result,
      hp: s.hp,
      vampires: s.vampires[i],
    });
    if (s.hp === 0) {
      s.winner = "helsing";
      s.reason = "Dracula เสียพลังชีวิตครบ 12";
      break;
    }
    if (s.vampires[i] === 4) {
      s.winner = "dracula";
      s.reason = `ชาวเมืองเขต ${i + 1} กลายเป็นแวมไพร์ครบ 4 คน`;
      break;
    }
  }
  if (!s.winner && s.round === 5) {
    s.winner = "dracula";
    s.reason = "Dracula รอดจนจบรอบที่ 5";
  }
  s.phase = s.winner ? "finished" : "results";
  s.acknowledged = [];
}
function finishTurn(s: DuelState, actor: string, extra = false) {
  if (!s.deck.length) {
    resolve(s, "กองจั่วหมด");
    return;
  }
  if (s.ending && s.ending !== actor && !extra) {
    resolve(s, "คู่แข่งเล่นตาสุดท้ายครบแล้ว");
    return;
  }
  s.step = "draw";
  s.effect = undefined;
  if (!extra) s.turn = s.players.find((p) => p.id !== actor)!.id;
}
function effectChoices(s: DuelState, actor: string): DuelAction[] {
  const own = s.players.find((p) => p.id === actor)!,
    other = s.players.find((p) => p.id !== actor)!;
  switch (s.effect) {
    case 1:
    case 3:
      return (s.effect === 1 ? own : other).cards.flatMap((c, i) =>
        c.revealed ? [] : [{ type: "effect", targets: [i] }],
      );
    case 4:
      return own.cards.flatMap((_, i) =>
        own.cards.flatMap((_, j) =>
          j > i ? [{ type: "effect" as const, targets: [i, j] }] : [],
        ),
      );
    case 6:
      return own.cards.map((_, i) => ({ type: "effect", targets: [i] }));
    case 7:
      return [1, 2, 3].map((i) => ({ type: "effect", targets: [i] }));
    default:
      return [];
  }
}
export function getLegalActions(s: DuelState, actor: string): DuelAction[] {
  const player=s.players.find(p=>p.id===actor);
  if (!player) return [];
  if(s.phase!=="playing" && !revealsComplete(s))
    return s.reveals![player.character].flatMap((open,slot)=>open?[]:[{type:"reveal-result" as const,slot,round:s.round}]);
  if(s.phase==="finished") return [];
  if (s.phase === "results")
    return s.acknowledged.includes(actor) ? [] : [{ type: "next-round" }];
  if (s.turn !== actor) return [];
  if (s.step === "effect") return effectChoices(s, actor);
  if (s.step === "draw")
    return [
      { type: "draw" },
      ...(!s.ending && s.discard.length >= 6
        ? [{ type: "end-round" as const }]
        : []),
    ];
  const p = s.players.find((p) => p.id === actor)!;
  return [-1, 0, 1, 2, 3, 4]
    .filter(
      (i) =>
        (i === -1 ? s.drawn! : p.cards[i]).value !== 8 || s.discard.length >= 6,
    )
    .map((slot) => ({ type: "discard", slot }));
}
export function applyAction(
  state: DuelState,
  actor: string,
  action: DuelAction,
  random: () => number,
): DuelState {
  // Exact intent schema, including all targets: reject forged fields/ownership.
  if (!getLegalActions(state, actor).some((a) => sameIntent(a, action)))
    throw Error("ทำรายการไม่ได้: ตรวจตา ขั้นตอน และเป้าหมายที่เลือก");
  const s = structuredClone(state),
    p = s.players.find((p) => p.id === actor)!,
    other = s.players.find((p) => p.id !== actor)!;
  s.actionSerial=(s.actionSerial??0)+1;
  s.lastEvent=action.type==="discard" ? (action.slot>=0 ? "replace" : "discard") : action.type==="effect" ? ([4,6,7].includes(s.effect!)?"swap":"reveal") : action.type;
  if(action.type === "reveal-result") {
    s.reveals![p.character][action.slot]=true;
    s.lastAction=`${ROLE_NAME[p.character]} เปิดไพ่เขต ${action.slot+1}`;
    return s;
  }
  if (action.type === "next-round") {
    s.acknowledged.push(actor);
    if (s.acknowledged.length === 2) {
      s.round++;
      deal(s, random);
      s.result = undefined;
      s.lastAction = "เริ่มรอบใหม่ Dracula เล่นก่อน";
    }
    return s;
  }
  if (action.type === "end-round") {
    s.ending = actor;
    s.turn = other.id;
    s.lastAction = `${ROLE_NAME[p.character]} ขอจบรอบ คู่แข่งเล่นตาสุดท้าย`;
    return s;
  }
  if (action.type === "draw") {
    s.drawn = s.deck.shift()!;
    s.step = "discard";
    s.lastAction = `${ROLE_NAME[p.character]} จั่วการ์ด${s.drawn.revealed ? `ที่เปิดเผยแล้ว: ${SUIT_NAME[s.drawn.suit]} ${s.drawn.value}` : ""}`;
    return s;
  }
  if (action.type === "discard") {
    const revealedPlacement = action.slot !== -1 && s.drawn?.revealed
      ? ` • วางไพ่เปิดเผย ${SUIT_NAME[s.drawn.suit]} ${s.drawn.value} ที่เขต ${action.slot + 1}`
      : "";
    const c = action.slot === -1 ? s.drawn! : p.cards[action.slot];
    if (action.slot !== -1) p.cards[action.slot] = s.drawn!;
    s.discard.push({ ...c, revealed: true });
    s.drawn = undefined;
    s.effect = c.value;
    s.lastAction = `${ROLE_NAME[p.character]} ทิ้งการ์ด ${c.value}: ${EFFECTS[c.value]}${revealedPlacement}`;
    if (c.value === 8) {
      resolve(s, "ทิ้งการ์ด 8 จบรอบทันที");
      return s;
    }
    if (c.value === 2) {
      if (s.deck[0]) s.deck[0].revealed = true;
      finishTurn(s, actor);
      return s;
    }
    if (c.value === 5) {
      finishTurn(s, actor, true);
      return s;
    }
    s.step = "effect";
    if (!effectChoices(s, actor).length) finishTurn(s, actor);
    return s;
  }
  const [a, b] = action.targets;
  switch (s.effect) {
    case 1:
      p.cards[a].revealed = true;
      break;
    case 3:
      other.cards[a].revealed = true;
      break;
    case 4:
      [p.cards[a], p.cards[b]] = [p.cards[b], p.cards[a]];
      break;
    case 6:
      s.lastExchange={round:s.round,serial:s.actionSerial!,actor,slot:a,cards:{[p.character]:{...p.cards[a]},[other.character]:{...other.cards[a]}} as Record<Character,Card>};
      [p.cards[a], other.cards[a]] = [other.cards[a], p.cards[a]];
      break;
    case 7:
      [s.ranking[0], s.ranking[a]] = [s.ranking[a], s.ranking[0]];
      break;
  }
  finishTurn(s, actor);
  return s;
}
function sameIntent(a: DuelAction, b: unknown): boolean {
  if (!b || typeof b !== "object" || Array.isArray(b)) return false;
  const o = b as Record<string, unknown>,
    keys = Object.keys(a);
  return (
    Object.keys(o).length === keys.length &&
    keys.every(
      (k) =>
        JSON.stringify(o[k]) ===
        JSON.stringify((a as unknown as Record<string, unknown>)[k]),
    )
  );
}
export function getDisplayView(
  s: DuelState,
  code: string,
  revision: number,
): DuelView {
  const exposed = s.phase !== "playing";
  const pending=exposed && !revealsComplete(s);
  const open=(role:Character,i:number)=>exposed ? (s.reveals?.[role][i] ?? true) : !!s.players.find(p=>p.character===role)!.cards[i].revealed;
  let hp=s.hp, vampires=[...s.vampires];
  let result: DuelView["result"];
  if(s.result) {
    let prefix=0;
    while(prefix<5 && ROLES.every(role=>open(role,prefix)))prefix++;
    const districts=s.result.districts.filter(r=>r.district<prefix);
    if(s.revealStart) {
      hp=s.revealStart.hp; vampires=[...s.revealStart.vampires];
      for(const r of districts){hp=r.hp;vampires[r.district]=r.vampires;}
    }
    result={...structuredClone(s.result),districts,cards:Object.fromEntries(ROLES.map(role=>[role,s.result!.cards[role].map((c,i)=>open(role,i)?{...c}:null)])) as NonNullable<DuelView["result"]>["cards"]};
  }
  return {
    gameId: "dracula-vs-van-helsing",
    code,
    revision,
    phase: pending ? "results" : s.phase,
    step: s.step,
    players: s.players.map((p) => ({
      id: p.id,
      name: p.name,
      character: p.character,
      connected: false,
      ready: true,
    })),
    turn: s.turn,
    round: s.round,
    hp,
    vampires,
    ranking: [...s.ranking],
    racks: Object.fromEntries(
      s.players.map((p) => [
        p.character,
        p.cards.map((c,i) =>
          open(p.character,i) ? { ...c, revealed: true } : null,
        ),
      ]),
    ) as DuelView["racks"],
    deckCount: s.deck.length,
    deckTop: s.deck[0]?.revealed ? { ...s.deck[0] } : undefined,
    discard: s.discard.map((c) => ({ ...c })),
    drawn: s.drawn?.revealed ? { ...s.drawn } : undefined,
    effect: s.step === "effect" ? s.effect : undefined,
    ending: s.ending,
    result,
    revealPending: pending,
    revealedCount: exposed ? ROLES.flatMap(role=>s.players.find(p=>p.character===role)!.cards.map((_,i)=>open(role,i))).filter(Boolean).length : undefined,
    acknowledged: [...s.acknowledged],
    winner: pending ? undefined : s.winner,
    reason: pending ? undefined : s.reason,
    lastAction: s.lastAction,
  };
}
export function getPlayerView(
  s: DuelState,
  actor: string,
): NonNullable<DuelView["me"]> {
  const p = s.players.find((p) => p.id === actor);
  if (!p) throw Error("ไม่พบผู้เล่น");
  return {
    id: actor,
    cards: p.cards.map((c,i) => ({
      ...c,
      revealed: s.phase === "playing" ? c.revealed : (s.reveals?.[p.character][i] ?? true),
    })),
    drawn: s.turn === actor && s.drawn ? { ...s.drawn } : undefined,
    exchange:s.lastExchange?{round:s.lastExchange.round,serial:s.lastExchange.serial,initiated:s.lastExchange.actor===actor,slot:s.lastExchange.slot,gave:{...s.lastExchange.cards[p.character]},received:{...s.lastExchange.cards[p.character==="dracula"?"helsing":"dracula"]}}:undefined,
    legal: getLegalActions(s, actor),
  };
}
export function isFinished(s: DuelState) {
  return s.phase === "finished" && revealsComplete(s);
}
