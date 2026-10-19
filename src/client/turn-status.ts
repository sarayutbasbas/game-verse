import type { RoomView } from "../shared/types.js";
/** Text is derived solely from the authorized projection, including non-turn phases. */
export function turnStatus(v: RoomView) {
  if (v.phase === "lobby") return { text: "รอผู้เล่น", own: false };
  if(v.gameId==='take-time'){if(v.phase==='discussion')return {text:'ปรึกษาก่อนเปิดมือ',own:false};if(v.phase==='resolution')return {text:'เปิดผลทีละช่อง',own:false};if(v.phase==='placement'&&!v.turn)return {text:'ใครพร้อม เริ่มได้',own:!!v.me};}
  if (v.phase === "finished") return { text: "จบเกม", own: false };
  if (v.phase === "results") return { text: "สรุปผลรอบ", own: false };
  if (v.phase === "settling" || (v.gameId === "calico" && v.phase === "setup"))
    return { text: "เลือกพร้อมกัน", own: false };
  if(v.gameId==="locus"&&!v.turn)return {text:v.me?.legal.effects.length?"วางรูปทรงและโบนัส":"ใช้เหรียญหรือจบชุด",own:!!v.me&&!v.players.find(p=>p.id===v.me?.id)?.done};
  if(v.gameId==="critter-kitchen"&&!v.turn)return {text:v.phase==="planning"?"วางแผนของคุณ":v.phase==="restaurateurs"?"เลือกเจ้าของร้าน":v.phase==="running"?"เปิดแผนแล้ว":v.phase==="challenge"||v.phase==="critic"?"เตรียมอาหารพร้อมกัน":v.phase==="refrigeration"?"จัดของเข้าตู้เย็น":"สรุป Challenge",own:false};
  if(v.gameId==="sky-team"&&v.phase!=="placement")return {text:v.phase==="planning"?"วางแผนร่วมกัน":v.phase==="reroll"?"เลือกลูกเต๋าทอยใหม่ส่วนตัว":"จบรอบ • ตรวจเที่ยวบิน",own:false};
  const actor =
    v.gameId === "seven-wonders-duel" ? (v.pending?.actor ?? v.turn) : v.turn;
  const own = !!actor && actor === v.me?.id;
  const name = v.players.find((p) => p.id === actor)?.name;
  return { text: own ? "ตาคุณ" : name ? "ตา " + name : "รอผู้เล่น", own };
}
