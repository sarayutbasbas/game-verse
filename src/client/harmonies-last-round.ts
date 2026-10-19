import type { HarmoniesView } from '../games/harmonies/types.js';

/** Public presentation only: the server still decides and commits the final boundary. */
export function lastRoundInfo(v:HarmoniesView) {
    if(v.phase!=='playing'||!v.turn||v.turnCount===undefined)return;
    const active=v.players.find(p=>p.id===v.turn);
    if(!active)return;
    const lowSpace=active.board.filter(c=>!c.stack.length).length<=2;
    if(v.endAt===undefined&&!lowSpace&&(v.bagCount??3)>=(v.options?.solo?9:3))return;
    // Warn before the end button too: ending the last seat's turn can finish immediately.
    const end=v.endAt??Math.ceil((v.turnCount+1)/v.players.length)*v.players.length;
    const count=Math.max(0,end-v.turnCount),start=v.players.indexOf(active);
    const remaining=Array.from({length:count},(_,i)=>v.players[(start+i)%v.players.length]);
    const reason=v.players.some(p=>p.board.filter(c=>!c.stack.length).length<=2)?'มีสวนเหลือช่องว่างไม่เกิน 2 ช่องแล้ว':'ชิ้นไม้ในถุงไม่พอเติมกลุ่มใหม่แล้ว';
    return {end,count,remaining,reason,ownLastTurn:v.me?.id===v.turn};
}
