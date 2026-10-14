// Shared, code-native standard wall. Engine and renderer use exactly this mapping.
export const TILE_COLORS = ["blue", "yellow", "red", "black", "white"] as const;
export type TileColor = (typeof TILE_COLORS)[number];
export const TILE_NAMES: Record<TileColor, string> = { blue: "น้ำเงิน B", yellow: "เหลือง Y", red: "แดง R", black: "ดำ K", white: "ขาว W" };
export const TILE_SYMBOL: Record<TileColor, string> = { blue: "B", yellow: "Y", red: "R", black: "K", white: "W" };
export const WALL: readonly (readonly TileColor[])[] = [
  ["blue", "yellow", "red", "black", "white"],
  ["white", "blue", "yellow", "red", "black"],
  ["black", "white", "blue", "yellow", "red"],
  ["red", "black", "white", "blue", "yellow"],
  ["yellow", "red", "black", "white", "blue"],
];
export const FLOOR_PENALTIES = [1, 1, 2, 2, 2, 3, 3] as const;
export interface Pattern { color: TileColor | null; count: number }
export interface AzulPlayer {
  id: string; name: string; score: number;
  pattern: Pattern[]; wall: boolean[][]; floor: (TileColor | "first")[];
}
export type AzulAction = { type: "draft"; source: number; color: TileColor; target: number } | { type: "next-round" };
export interface TargetOption {
  target: number; valid: boolean; reason: string; placed: number;
  floor: number; discarded: number; marker: boolean;
}
export interface DraftOffer { source: number; color: TileColor; count: number; targets: TargetOption[] }
export interface AzulSettlement {
  round: number;
  players: { id: string; before: number; placements: { row: number; column: number; color: TileColor; points: number }[]; penalty: number; after: number }[];
}
export interface AzulBonus { id: string; rows: number; columns: number; colors: number; points: number; total: number }
export interface AzulState {
  phase: "playing" | "results" | "finished";
  round: number; players: AzulPlayer[]; turn: string; starter: string;
  firstPlayer?: string; factories: TileColor[][]; center: TileColor[];
  bag: TileColor[]; discard: TileColor[]; settlements: AzulSettlement[];
  bonus?: AzulBonus[]; winners?: string[]; lastAction?: string;
}
export interface AzulView {
  gameId: "azul"; code: string; revision: number;
  phase: "lobby" | "playing" | "results" | "finished";
  players: (AzulPlayer & { avatar?: string | null; ready: boolean; connected: boolean })[];
  round?: number; turn?: string; starter?: string; firstPlayer?: string;
  markerInCenter?: boolean; factories?: TileColor[][]; center?: TileColor[];
  bagCount?: number; discardCount?: number; settlements?: AzulSettlement[];
  bonus?: AzulBonus[]; winners?: string[]; lastAction?: string;
  me?: { id: string; canManage?: boolean; legal: (AzulAction | { type: "ready"; ready: boolean })[]; offers: DraftOffer[] };
}
