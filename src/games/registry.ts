import * as perch from "./perch/engine.js";
import type {PerchState,PerchAction} from "./perch/types.js";
import * as draftosaurus from "./draftosaurus/engine.js";
import type {DraftosaurusState,DraftosaurusAction} from "./draftosaurus/types.js";
import * as takeTime from "./take-time/engine.js";
import type {TakeTimeState,TakeTimeAction} from "./take-time/types.js";
import * as locus from "./locus/engine.js";
import type {LocusState,LocusAction} from "./locus/types.js";
import {scorePlayer as scoreLocus} from "./locus/scoring.js";
import * as nameIt from "./name-it/engine.js";
export const localGames={"name-it":nameIt} as const;
import * as critter from "./critter-kitchen/engine.js";
import type {CKState,CKAction} from "./critter-kitchen/types.js";
import * as sky from "./sky-team/engine.js";
import type {SkyState,SkyAction} from "./sky-team/types.js";
import * as harmonies from "./harmonies/engine.js";
import type {HarmoniesState,HarmoniesAction} from "./harmonies/types.js";
import * as pixies from "./pixies/engine.js";
import type {PixiesState,PixiesAction} from "./pixies/types.js";
import * as jaipur from "./jaipur/engine.js";
import type { JaipurState, JaipurAction } from "./jaipur/types.js";
import * as wonders from "./seven-wonders-duel/engine.js";
import type { WondersState, WondersAction } from "./seven-wonders-duel/types.js";
import * as calico from "./calico/engine.js";
import type { CalicoState, CalicoAction } from "./calico/types.js";
import * as camelUp from "./camel-up/engine.js";
import * as dracula from "./dracula-vs-van-helsing/engine.js";
import * as azul from "./azul/engine.js";
import type { AzulState, AzulAction } from "./azul/types.js";
export const games = {
 perch,
 draftosaurus,
 "take-time":takeTime,
 locus,
 "critter-kitchen":critter,
 "sky-team":sky,
 harmonies,
 pixies,
 jaipur,
  "seven-wonders-duel": wonders,
  calico,
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
 perch:{...common("perch"),start(seats,random,starter){this.validatePlayers(seats);return perch.createInitialState(seats,random,starter);},apply:(s,id,a,random)=>perch.applyAction(s,id,a as PerchAction,random),publicView:perch.getDisplayView,privateView:perch.getPlayerView,isFinished:perch.isFinished,summary:s=>({winners:s.winners,scores:s.players.map(p=>({id:p.id,score:p.score})),final:s.final})} satisfies GameAdapter<PerchState,ReturnType<typeof perch.getPlayerView>>,
 draftosaurus:{...common("draftosaurus"),start(seats,random,starter){this.validatePlayers(seats);return draftosaurus.createInitialState(seats,random,starter);},apply:(s,id,a,random)=>draftosaurus.applyAction(s,id,a as DraftosaurusAction,random),publicView:draftosaurus.getDisplayView,privateView:draftosaurus.getPlayerView,isFinished:draftosaurus.isFinished,summary:s=>({winners:s.winners,scores:s.players.map(p=>({id:p.id,...draftosaurus.scorePlayer(s,p)}))})} satisfies GameAdapter<DraftosaurusState,ReturnType<typeof draftosaurus.getPlayerView>>,
 "take-time":{...common("take-time"),start(seats,random){this.validatePlayers(seats);return takeTime.createInitialState(seats,random);},apply:(s,id,a,random)=>takeTime.applyAction(s,id,a as TakeTimeAction,random),publicView:takeTime.getDisplayView,privateView:takeTime.getPlayerView,isFinished:takeTime.isFinished,summary:s=>({result:s.result,clock:s.clock,attempt:s.attempt})} satisfies GameAdapter<TakeTimeState,ReturnType<typeof takeTime.getPlayerView>>,
 locus:{...common("locus"),start(seats,random,starter){this.validatePlayers(seats);return locus.createInitialState(seats,random,starter);},apply:(s,id,a,random)=>locus.applyAction(s,id,a as LocusAction,random),publicView:locus.getDisplayView,privateView:locus.getPlayerView,isFinished:locus.isFinished,summary:s=>({winners:s.winners,scores:s.players.map(p=>({id:p.id,...scoreLocus(p)}))})} satisfies GameAdapter<LocusState,ReturnType<typeof locus.getPlayerView>>,
 "critter-kitchen":{...common("critter-kitchen"),start(seats,random){this.validatePlayers(seats);return critter.createInitialState(seats,random);},apply:(s,id,a,random)=>critter.applyAction(s,id,a as CKAction,random),publicView:critter.getDisplayView,privateView:critter.getPlayerView,isFinished:critter.isFinished,summary:s=>({winners:s.winners,scores:s.players.map(p=>({id:p.id,score:p.score}))})} satisfies GameAdapter<CKState,ReturnType<typeof critter.getPlayerView>>,
 "sky-team":{...common("sky-team"),start(seats,random){this.validatePlayers(seats);return sky.createInitialState(seats,random);},apply:(s,id,a,random)=>sky.applyAction(s,id,a as SkyAction,random),publicView:sky.getDisplayView,privateView:sky.getPlayerView,isFinished:sky.isFinished,summary:s=>({result:s.result,round:s.round})} satisfies GameAdapter<SkyState,ReturnType<typeof sky.getPlayerView>>,
 harmonies:{...common("harmonies"),start(seats,random,starter){this.validatePlayers(seats);return harmonies.createInitialState(seats,random,starter,"A",{solo:seats.length===1});},apply:(s,id,a,random)=>harmonies.applyAction(s,id,a as HarmoniesAction,random),publicView:harmonies.getDisplayView,privateView:harmonies.getPlayerView,isFinished:harmonies.isFinished,summary:s=>({winners:s.winners,side:s.side,scores:s.scores})} satisfies GameAdapter<HarmoniesState,ReturnType<typeof harmonies.getPlayerView>>,
 pixies:{...common("pixies"),start(seats,random,starter){this.validatePlayers(seats);return pixies.createInitialState(seats,random,starter);},apply:(s,id,a,random)=>pixies.applyAction(s,id,a as PixiesAction,random),publicView:pixies.getDisplayView,privateView:pixies.getPlayerView,isFinished:pixies.isFinished,summary:s=>({winners:s.winners,scores:s.players.map(p=>({id:p.id,rounds:p.scores}))})} satisfies GameAdapter<PixiesState,ReturnType<typeof pixies.getPlayerView>>,
 jaipur:{...common("jaipur"),start(seats,random,starter){this.validatePlayers(seats);return jaipur.createInitialState(seats,random,starter);},apply:(s,id,a,random)=>jaipur.applyAction(s,id,a as JaipurAction,random),publicView:jaipur.getDisplayView,privateView:jaipur.getPlayerView,isFinished:jaipur.isFinished,summary:s=>({winners:s.winners,seals:s.players.map(p=>({id:p.id,seals:p.seals})),rounds:s.history})} satisfies GameAdapter<JaipurState,ReturnType<typeof jaipur.getPlayerView>>,

  "seven-wonders-duel": {
    ...common("seven-wonders-duel"),
    start(seats,random,starter){this.validatePlayers(seats);return wonders.createInitialState(seats,random,starter);},
    apply:(s,id,a,random)=>wonders.applyAction(s,id,a as WondersAction,random),
    publicView:wonders.getDisplayView,privateView:wonders.getPlayerView,isFinished:wonders.isFinished,
    summary:s=>({winners:s.winners,victory:s.victory,scores:s.players.map(p=>wonders.scorePlayer(s,p))}),
  } satisfies GameAdapter<WondersState,ReturnType<typeof wonders.getPlayerView>>,

  calico: {
    ...common("calico"),
    start(seats, random, starter) { this.validatePlayers(seats); return calico.createInitialState(seats, random, starter); },
    apply: (s, id, a, random) => calico.applyAction(s, id, a as CalicoAction, random),
    publicView: calico.getDisplayView, privateView: calico.getPlayerView,
    isFinished: calico.isFinished,
    summary: s => ({winners:s.winners,scores:s.players.map(p=>({id:p.id,...calico.scorePlayer(s,p)}))}),
  } satisfies GameAdapter<CalicoState, ReturnType<typeof calico.getPlayerView>>,
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
