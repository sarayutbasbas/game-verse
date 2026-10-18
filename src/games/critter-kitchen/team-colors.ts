export const TEAM_COLORS=['blue','red','green','purple','orange'] as const;
export type TeamColor=typeof TEAM_COLORS[number];
/** Preserve valid existing assignments; fill missing/legacy duplicate colors deterministically. */
export function resolveTeamColors(order:string[],stored:Record<string,TeamColor>={}):Record<string,TeamColor>{
    const result:Record<string,TeamColor>={},used=new Set<TeamColor>();
    for(const id of order){const color=stored[id];if(TEAM_COLORS.includes(color)&&!used.has(color)){result[id]=color;used.add(color);}}
    for(const id of order)if(!result[id]){const color=TEAM_COLORS.find(c=>!used.has(c));if(!color)throw Error('สีผู้เล่นไม่เพียงพอ');result[id]=color;used.add(color);}
    return result;
}
