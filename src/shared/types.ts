import type {PerchAction,PerchView} from "../games/perch/types.js";
import type {DraftosaurusAction,DraftosaurusView} from "../games/draftosaurus/types.js";
import type {TakeTimeAction,TakeTimeView} from "../games/take-time/types.js";
import type {LocusAction,LocusView} from "../games/locus/types.js";
import type {CKAction,CKView,DisplayMode} from "../games/critter-kitchen/types.js";
import type {SkyAction,SkyView} from "../games/sky-team/types.js";
import type {HarmoniesAction,HarmoniesView} from "../games/harmonies/types.js";
import type {PixiesAction,PixiesView} from "../games/pixies/types.js";
import type { JaipurAction, JaipurView } from "../games/jaipur/types.js";
import type { WondersAction, WondersView } from "../games/seven-wonders-duel/types.js";
import type { CalicoAction, CalicoView } from "../games/calico/types.js";
import type {
  DuelAction,
  LobbyAction,
  DuelView,
} from "../games/dracula-vs-van-helsing/types.js";
import type { AzulAction, AzulView } from "../games/azul/types.js";
export const COLORS = ["blue", "green", "yellow", "purple", "red"] as const;
export type Color = (typeof COLORS)[number];
export type Camel = Color | "black" | "white";
export const NAMES: Record<Camel, string> = {
  blue: "ฟ้า",
  green: "เขียว",
  yellow: "เหลือง",
  purple: "ม่วง",
  red: "แดง",
  black: "ดำ",
  white: "ขาว",
};
export type Action =
  | { type: "roll" }
  | { type: "leg"; color: Color }
  | { type: "final"; color: Color; side: "winner" | "loser" }
  | { type: "tile"; position: number; direction: 1 | -1 }
  | { type: "partner"; playerId: string }
  | { type: "claim"; ticket: number };
export type HostAction = {
  type: "start" | "restart";
  startingPlayerId?: string;
  boardSide?: import("../games/harmonies/types.js").Side;
  harmoniesOptions?:Partial<import("../games/harmonies/types.js").HarmoniesOptions>;
  restaurateurs?:boolean;
  tutorial?:boolean;
};
export interface Ticket {
  color: Color;
  value: number;
}
export interface PublicPlayer {
  avatar?: string | null;
  id: string;
  name: string;
  money: number;
  tickets: Ticket[];
  pyramids: number;
  partner?: string;
  connected: boolean;
}
export interface Tile {
  owner: string;
  direction: 1 | -1;
}
export interface Settlement {
  leg: number;
  ranking: Color[];
  changes: { id: string; amount: number }[];
}
export interface MovementTrace {
  camel: Camel;
  unit: Camel[];
  from: number;
  fromIndex: number;
  path: number[];
  to: number;
  under: boolean;
  destinationStack: Camel[];
  tile?: { position: number; owner: string; direction: 1 | -1 };
}
export interface PublicEvent {
  revision: number;
  actorId: string;
  kind: Action["type"] | HostAction["type"];
  movement?: MovementTrace;
  roll?: { camel: Camel; value: number; die: string };
  color?: Color;
  side?: "winner" | "loser";
  position?: number;
  money: { id: string; amount: number }[];
  legEnded: boolean;
  finished: boolean;
}
export interface View {
  gameId: "camel-up";
  code: string;
  phase: "lobby" | "playing" | "settling" | "finished" | "closed";
  revision: number;
  event?: PublicEvent;
  players: PublicPlayer[];
  turn?: string;
  leg?: number;
  stacks?: Record<number, Camel[]>;
  tiles?: Record<number, Tile>;
  available?: Record<Color, number[]>;
  dice?: string[];
  pyramidRemaining?: number;
  finalCounts?: { winner: number; loser: number };
  lastRoll?: { camel: Camel; value: number; die: string };
  settlements?: Settlement[];
  winners?: string[];
  finalResults?: {
    side: string;
    playerId: string;
    color: Color;
    amount: number;
  }[];
  me?: {
    canManage?: boolean;
    id: string;
    cards: Color[];
    bets: { color: Color; side: string }[];
    legal: Action[];
  };
}
export type GameId = "perch" | "draftosaurus" | "take-time" | "locus" | "name-it" | "camel-up" | "dracula-vs-van-helsing" | "azul" | "calico" | "seven-wonders-duel" | "jaipur" | "pixies" | "harmonies" | "sky-team" | "critter-kitchen";
export type RoomView = (PerchView | DraftosaurusView | TakeTimeView | LocusView | View | DuelView | AzulView | CalicoView | WondersView | JaipurView | PixiesView | HarmoniesView | SkyView | CKView) & {lobbyKickablePlayerIds?:string[]};
export type RoomAction = PerchAction | DraftosaurusAction | {type:"room-kick";playerId:string} | {type:"room-restart"} | TakeTimeAction | {type:"tt-retry"} | {type:"ck-expansions";expansions:Partial<import("../games/critter-kitchen/expansions.js").CKExpansions>} | {type:"harmonies-display-mode";mode:"full-mobile"|"shared-table"} | LocusAction | {type:"locus-extra"} | Action | HostAction | DuelAction | LobbyAction | AzulAction | CalicoAction | WondersAction | JaipurAction | PixiesAction | HarmoniesAction | SkyAction | CKAction;
export type ClientMessage =
  | { type: "create"; gameId?: GameId; displayMode?:DisplayMode; joinAsPlayer?:boolean }
  | { type: "join"; code: string; name: string }
  | { type: "resume"; code: string; token: string }
  | { type: "watch"; code: string }
  | { type: "sync" }
  | {
      type: "command";
      id: string;
      revision: number;
      action: RoomAction;
    };
export type ServerMessage<V = View> =
  | {
      type: "session";
      code: string;
      token: string;
      role: "host" | "player";
      playerId?: string;
    }
  | { type: "state"; view: V; snapshot?: boolean }
  | { type: "ack"; id: string; ok: boolean; error?: string; revision: number }
  | { type: "error"; error: string };
