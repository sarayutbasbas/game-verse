import type {Side} from './types.js';
export const BASE_COORDS=Array.from({length:5},(_,q)=>Array.from({length:q%2?4:5},(_,row)=>({q,r:row-Math.floor(q/2)}))).flat();
/** Transcribed from the printed C/D boards, publisher Crescendo rulebook pp8–9.
 * C has 26 playable cells around its central hole; D has 25, seven ordinary.
 * These arrays are board identities, not screen offsets. */
const column=(q:number,from:number,to:number)=>Array.from({length:to-from+1},(_,i)=>({q,r:from+i}));
const C=[...column(0,0,2),...column(1,-1,2),...column(2,-2,1),...column(3,-3,1).filter(p=>p.r!==-1),...column(4,-3,0),...column(5,-3,0),...column(6,-3,-1)];
const D=[...column(0,0,1),...column(1,-1,1),...column(2,-1,1),...column(3,-2,1),...column(4,-2,0),...column(5,-3,0),...column(6,-4,-1),...column(7,-4,-3)];
const D_ORDINARY=new Set(['0,0','0,1','1,-1','1,1','6,-4','7,-4','7,-3']);
export const BOARD_SIDES:Side[]=['A','B','C','D'];
export const BOARD_NAMES:Record<Side,string>={A:'แม่น้ำ',B:'หมู่เกาะ',C:'วงล้อม · เว้นช่องกลาง',D:'ชลประทาน · ฟื้นผืนดิน'};
export const boardCoords=(side:Side='A')=>side==='C'?C:side==='D'?D:BASE_COORDS;
export const boardCellAt=(side:Side,q:number,r:number)=>boardCoords(side).findIndex(c=>c.q===q&&c.r===r);
export const DIRECTIONS=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]] as const;
export const boardNeighbors=(side:Side,index:number)=>{const p=boardCoords(side)[index];return p?DIRECTIONS.map(([q,r])=>boardCellAt(side,p.q+q,p.r+r)).filter(i=>i>=0):[];};
export const isPrintedDry=(side:Side,index:number)=>{const p=boardCoords(side)[index];return side==='D'&&!!p&&!D_ORDINARY.has(`${p.q},${p.r}`);};
