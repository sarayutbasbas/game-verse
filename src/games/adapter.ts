import type { GameMetadata } from "../shared/catalog.js";
import type { RoomAction, RoomView } from "../shared/types.js";
export interface Seat {
  id: string;
  name: string;
  character?: "dracula" | "helsing";
}
export interface GameAdapter<State, PrivateView> {
  metadata: GameMetadata;
  validateSettings(settings: unknown): void;
  validatePlayers(seats: Seat[]): void;
  start(seats: Seat[], random: () => number, startingPlayerId?: string): State;
  apply(
    state: State,
    playerId: string,
    action: RoomAction,
    random: () => number,
  ): State;
  publicView(state: State, code: string, revision: number): RoomView;
  privateView(state: State, playerId: string): PrivateView;
  isFinished(state: State): boolean;
  summary(state: State): unknown;
}
