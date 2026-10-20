export type HarmoniesLeaderboardMode='solo'|'competitive';
export interface HarmoniesLeaderboardEntry {
 rank:number;
 name:string;
 avatar:string|null;
 score:number;
 achievedAt:number;
}
export type HarmoniesLeaderboards=Record<HarmoniesLeaderboardMode,HarmoniesLeaderboardEntry[]>;
