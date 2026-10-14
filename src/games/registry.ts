import * as camelUp from "./camel-up/engine.js";
import * as dracula from "./dracula-vs-van-helsing/engine.js";
import * as azul from "./azul/engine.js";
import type { AzulState, AzulAction } from "./azul/types.js";
export const games = {
  azul,
  "camel-up": camelUp,
  "dracula-vs-van-helsing": dracula,
} as const;

import { metadata, supportsPlayers } from "../shared/catalog.js";
import type { GameAdapter, Seat } from "./adapter.js";
import type { GameState } from "./camel-up/engine.js";
import type { DuelState } from "./dracula-vs-van-helsing/types.js";
import type { Action } from "../shared/types.js";
import type { DuelAction } from "./dracula-vs-van-helsing/types.js";
function common(id: string) {
  const info = metadata(id)!;
  return {
    metadata: info,
    validateSettings(settings: unknown) {
      if (
        !settings ||
        typeof settings !== "object" ||
        Array.isArray(settings) ||
        Object.keys(settings).length
      )
        throw Error("เกมนี้ยังไม่มีตัวเลือกกติกาเพิ่มเติม");
    },
    validatePlayers(seats: Seat[]) {
      if (
        !supportsPlayers(info, seats.length) ||
        new Set(seats.map((s) => s.id)).size !== seats.length
      )
        throw Error(`จำนวนผู้เล่นไม่ตรงกับ ${info.name}`);
    },
  };
}
export const gameAdapters = {
  azul: {
    ...common("azul"),
    start(seats, random, starter) { this.validatePlayers(seats); return azul.createInitialState(seats, random, starter); },
    apply: (s, id, a, random) => azul.applyAction(s, id, a as AzulAction, random),
    publicView: azul.getDisplayView, privateView: azul.getPlayerView,
    isFinished: azul.isFinished,
    summary: (s) => ({ winners: s.winners, bonus: s.bonus, scores: s.players.map(p => ({ id: p.id, score: p.score })) }),
  } satisfies GameAdapter<AzulState, ReturnType<typeof azul.getPlayerView>>,
  "camel-up": {
    ...common("camel-up"),
    start(seats, random, starter) {
      this.validatePlayers(seats);
      return camelUp.createInitialState(
        seats.map((p) => ({ id: p.id, name: p.name })),
        random,
        starter,
      );
    },
    apply: (s, id, a, random) =>
      camelUp.applyAction(s, id, a as Action, random),
    publicView: camelUp.getDisplayView,
    privateView: camelUp.getPlayerView,
    isFinished: (s) => s.phase === "finished",
    summary: (s) => ({
      winners: s.winners,
      money: s.players.map((p) => ({ id: p.id, money: p.money })),
    }),
  } satisfies GameAdapter<GameState, ReturnType<typeof camelUp.getPlayerView>>,
  "dracula-vs-van-helsing": {
    ...common("dracula-vs-van-helsing"),
    start(seats, random) {
      this.validatePlayers(seats);
      return dracula.createInitialState(seats, random);
    },
    apply: (s, id, a, random) =>
      dracula.applyAction(s, id, a as DuelAction, random),
    publicView: dracula.getDisplayView,
    privateView: dracula.getPlayerView,
    isFinished: dracula.isFinished,
    summary: (s) => ({
      winner: s.winner,
      hp: s.hp,
      vampires: s.vampires,
      round: s.round,
    }),
  } satisfies GameAdapter<DuelState, ReturnType<typeof dracula.getPlayerView>>,
};
