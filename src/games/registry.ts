import * as flip7 from './flip-7/engine.js';
import type {FlipState,FlipAction} from './flip-7/types.js';
import * as catchSketch from './catch-sketch/engine.js';
import type {CatchState,CatchAction} from './catch-sketch/types.js';
import * as muffin from './muffin-time/engine.js';
import type {MuffinState,MuffinAction} from './muffin-time/types.js';
import * as madness from './mansions-of-madness/engine.js';
import type {MadnessState,MadnessAction} from './mansions-of-madness/types.js';
import * as justOne from './just-one/engine.js';
import type {JustOneState,JustOneAction} from './just-one/types.js';
import * as bombBusters from "./bomb-busters/engine.js";
import type {BombState,BombAction} from "./bomb-busters/types.js";
import * as courtisans from "./courtisans/engine.js";
import type {CourtState,CourtAction} from "./courtisans/types.js";
import * as trio from "./trio/engine.js";
import type {TrioState,TrioAction} from "./trio/types.js";
import * as castle from "./castle-combo/engine.js";
import type {CastleState,CastleAction} from "./castle-combo/types.js";
import * as powerPets from "./power-hungry-pets/engine.js";
import type {PowerPetsState,PowerPetsAction} from "./power-hungry-pets/types.js";
import * as loveLetter from "./love-letter/engine.js";
import type {LoveLetterState,LoveLetterAction} from "./love-letter/types.js";
import * as soundsFishy from "./sounds-fishy/engine.js";
import type {SoundsFishyState,SoundsFishyAction} from "./sounds-fishy/types.js";
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
 "flip-7":flip7,
 "catch-sketch":catchSketch,
 "muffin-time":muffin,
 "mansions-of-madness":madness,
 "just-one":justOne,
 "bomb-busters":bombBusters,
 courtisans,
 trio,
 "castle-combo":castle,
 "power-hungry-pets":powerPets,
 "love-letter":loveLetter,
 "sounds-fishy":soundsFishy,
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
 "flip-7":{...common("flip-7"),start(seats,random,starter){this.validatePlayers(seats);return flip7.createInitialState(seats,random,starter);},apply:(s,id,a,random)=>flip7.applyAction(s,id,a as FlipAction,random),publicView:flip7.getDisplayView,privateView:flip7.getPlayerView,isFinished:flip7.isFinished,summary:s=>({winners:s.winners,scores:s.players.map(p=>({id:p.id,score:p.score})),rounds:s.history.length})} satisfies GameAdapter<FlipState,ReturnType<typeof flip7.getPlayerView>>,
 "catch-sketch":{...common("catch-sketch"),start(seats,random,starter){this.validatePlayers(seats);return catchSketch.createInitialState(seats,random,starter);},apply:(s,id,a,random)=>catchSketch.applyAction(s,id,a as CatchAction,random),publicView:catchSketch.getDisplayView,privateView:catchSketch.getPlayerView,isFinished:catchSketch.isFinished,summary:s=>({winners:s.winners,scores:s.players.map(p=>({id:p.id,score:p.score})),rounds:s.history.length})} satisfies GameAdapter<CatchState,ReturnType<typeof catchSketch.getPlayerView>>,
 "muffin-time":{...common("muffin-time"),start(seats,random,starter){this.validatePlayers(seats);return muffin.createInitialState(seats,random,starter);},apply:(s,id,a,random)=>muffin.applyAction(s,id,a as MuffinAction,random),publicView:muffin.getDisplayView,privateView:muffin.getPlayerView,isFinished:muffin.isFinished,summary:s=>({winners:s.winners,turns:s.turnNumber})} satisfies GameAdapter<MuffinState,ReturnType<typeof muffin.getPlayerView>>,
 "mansions-of-madness":{...common("mansions-of-madness"),start(seats,random,starter){this.validatePlayers(seats);return madness.createInitialState(seats,random,starter);},apply:(s,id,a,random)=>madness.applyAction(s,id,a as MadnessAction,random),publicView:madness.getDisplayView,privateView:madness.getPlayerView,isFinished:madness.isFinished,summary:s=>({scenario:s.scenario,result:s.result,winners:s.winners,round:s.round})} satisfies GameAdapter<MadnessState,ReturnType<typeof madness.getPlayerView>>,
 "bomb-busters":{...common("bomb-busters"),start(seats,random,starter){this.validatePlayers(seats);return bombBusters.createInitialState(seats,random,starter);},apply:(s,id,a)=>bombBusters.applyAction(s,id,a as BombAction),publicView:bombBusters.getDisplayView,privateView:bombBusters.getPlayerView,isFinished:bombBusters.isFinished,summary:s=>({result:s.result,mission:s.mission,attempt:s.attempt,dial:s.dial})} satisfies GameAdapter<BombState,ReturnType<typeof bombBusters.getPlayerView>>,
 courtisans:{...common("courtisans"),start(seats,random,starter){this.validatePlayers(seats);return courtisans.createInitialState(seats,random,starter);},apply:(s,id,a)=>courtisans.applyAction(s,id,a as CourtAction),publicView:courtisans.getDisplayView,privateView:courtisans.getPlayerView,isFinished:courtisans.isFinished,summary:s=>({winners:s.winners,scores:s.scores})} satisfies GameAdapter<CourtState,ReturnType<typeof courtisans.getPlayerView>>,
 "just-one":{...common("just-one"),start(seats,random,starter){this.validatePlayers(seats);return justOne.createInitialState(seats,random,starter);},apply:(s,id,a,random)=>justOne.applyAction(s,id,a as JustOneAction,random),publicView:justOne.getDisplayView,privateView:justOne.getPlayerView,isFinished:justOne.isFinished,summary:s=>({score:justOne.score(s),rounds:s.history.length})} satisfies GameAdapter<JustOneState,ReturnType<typeof justOne.getPlayerView>>,
 trio:{...common("trio"),start(seats,random,starter){this.validatePlayers(seats);return trio.createInitialState(seats,random,starter);},apply:(s,id,a)=>trio.applyAction(s,id,a as TrioAction),publicView:trio.getDisplayView,privateView:trio.getPlayerView,isFinished:trio.isFinished,summary:s=>({winners:s.winners,options:s.options,trios:s.players.map(p=>({id:p.id,trios:p.trios,team:p.team}))})} satisfies GameAdapter<TrioState,ReturnType<typeof trio.getPlayerView>>,
 "castle-combo":{...common("castle-combo"),start(seats,random,starter){this.validatePlayers(seats);return castle.createInitialState(seats,random,starter);},apply:(s,id,a,random)=>castle.applyAction(s,id,a as CastleAction,random),publicView:castle.getDisplayView,privateView:castle.getPlayerView,isFinished:castle.isFinished,summary:s=>({winners:s.winners,scores:s.scores})} satisfies GameAdapter<CastleState,ReturnType<typeof castle.getPlayerView>>,
 "power-hungry-pets":{...common("power-hungry-pets"),start(seats,random,starter){this.validatePlayers(seats);return powerPets.createInitialState(seats,random,starter);},apply:(s,id,a,random)=>powerPets.applyAction(s,id,a as PowerPetsAction,random),publicView:powerPets.getDisplayView,privateView:powerPets.getPlayerView,isFinished:powerPets.isFinished,summary:s=>({winners:s.winners,scores:s.players.map(p=>({id:p.id,score:p.score})),rounds:s.history.map(h=>({round:h.round,winners:h.winners,reason:h.reason}))})} satisfies GameAdapter<PowerPetsState,ReturnType<typeof powerPets.getPlayerView>>,
 "love-letter":{...common("love-letter"),start(seats,random,starter){this.validatePlayers(seats);return loveLetter.createInitialState(seats,random,starter);},apply:(s,id,a,random)=>loveLetter.applyAction(s,id,a as LoveLetterAction,random),publicView:loveLetter.getDisplayView,privateView:loveLetter.getPlayerView,isFinished:loveLetter.isFinished,summary:s=>({mode:s.mode,winners:s.winners,life:s.life,scores:s.players.map(p=>({id:p.id,score:p.favor}))})} satisfies GameAdapter<LoveLetterState,ReturnType<typeof loveLetter.getPlayerView>>,
 "sounds-fishy":{...common("sounds-fishy"),start(seats,random,starter){this.validatePlayers(seats);return soundsFishy.createInitialState(seats,random,starter);},apply:(s,id,a,random)=>soundsFishy.applyAction(s,id,a as SoundsFishyAction,random),publicView:soundsFishy.getDisplayView,privateView:soundsFishy.getPlayerView,isFinished:soundsFishy.isFinished,summary:s=>({winners:s.winners,scores:s.players.map(p=>({id:p.id,score:p.score}))})} satisfies GameAdapter<SoundsFishyState,ReturnType<typeof soundsFishy.getPlayerView>>,
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
