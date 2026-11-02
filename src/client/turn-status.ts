import type { RoomView } from "../shared/types.js";
/** Text is derived solely from the authorized projection, including non-turn phases. */
export function turnStatus(v: RoomView) {
  if(v.gameId==='mansions-of-madness'&&v.phase!=='lobby')return {text:v.phase==='setup'?'เลือกนักสืบ':v.phase==='finished'?'จบคดี':v.phase==='test'?'ทดสอบทักษะ':v.phase==='puzzle'?'ไขรหัส':v.phase==='mythos'?'ช่วงมิธอส':'ช่วงนักสืบ',own:!!v.me?.heroes.some(h=>h.legal.length)};
  if(v.gameId==='catch-sketch')return {text:v.phase==='lobby'?'รอผู้เล่น':v.phase==='prepare'?'เตรียมกระดาน':v.phase==='drawing'?'วาดพร้อมกัน':v.phase==='freeze'?'หยุดวาด · เก็บกระดาน':v.phase==='guess'?'ทายจากภาพ':v.phase==='judge'?'ยืนยันคำตอบ':v.phase==='finished'?'จบเกม':'เฉลยและคะแนน',own:!!v.me?.legal.length};
  if(v.gameId==='flip-7')return {text:v.phase==='lobby'?'รอผู้เล่น':v.phase==='target'?'เลือกผู้รับไพ่พิเศษ':v.phase==='round-end'?'รวมคะแนนรอบ':v.phase==='finished'?'จบเกม':'เปิดต่อหรือหยุดเก็บแต้ม',own:!!v.me?.legal.length};
  if (v.phase === "lobby") return { text: "รอผู้เล่น", own: false };
  if(v.gameId==='muffin-time')return {text:v.phase==='finished'?'จบเกม':v.phase==='reaction'?'รอการ์ดสวน':v.phase==='end'?'ตรวจมัฟฟินไทม์':v.phase==='duel'?'เป่ายิ้งฉุบ':v.phase==='start'?'วางกับดักก่อนเล่น':'จั่วหรือเล่นแอ็กชัน',own:!!v.me?.legal.length};
  if(v.gameId==='just-one')return {text:v.phase==='finished'?'จบเกม':v.phase==='writing'?'เขียนคำใบ้':v.phase==='review'?'ตรวจคำใบ้':v.phase==='judge'?'ยืนยันคำตอบ':v.phase==='guess'?'ทายคำ':v.phase==='choose'?'เลือกเลขคำศัพท์':'เฉลยรอบนี้',own:!!v.me?.legal.length};
  if(v.gameId==='bomb-busters')return {text:v.phase==='finished'?'จบภารกิจ':v.phase==='hint'?'เลือกป้ายข้อมูลเริ่มเกม':v.phase==='answer'?'ตอบเครื่องตรวจจับ':v.phase==='own'?'เลือกสายของผู้ทาย':v.phase==='trade'?'แลกสายคว่ำ':v.turn===v.me?.id?'ตาคุณ · เลือกสาย':'ตา '+(v.players.find(p=>p.id===v.turn)?.name??'ผู้เล่น'),own:!!v.me&&(v.turn===v.me.id||v.me.legal.actions.length>0)};
  if(v.gameId==='courtisans')return {text:v.phase==='finished'?'จบเกม':v.phase==='assassin'?'เลือกเป้าหมายนักฆ่า':v.turn===v.me?.id?'ตาคุณ · วางไพ่':'ตา '+(v.players.find(p=>p.id===v.turn)?.name??'ผู้เล่น'),own:v.turn===v.me?.id};
  if(v.gameId==='trio')return {text:v.phase==='finished'?'จบเกม':v.phase==='swap'?'เลือกแลกไพ่กับคู่ทีม':v.phase==='review'?'ดูผลเปิดไพ่':v.turn===v.me?.id?'เปิดไพ่ทีละใบ':'ตา '+(v.players.find(p=>p.id===v.turn)?.name??'ผู้เล่น'),own:v.phase==='swap'?!!v.me?.legal.length:v.turn===v.me?.id};
  if(v.gameId==='castle-combo')return {text:v.phase==='finished'?'จบเกม':v.phase==='purses'?'จัดเหรียญลงถุงเงิน':v.active===v.me?.id?(v.phase==='effect'?'เลือกความสามารถ':'เลือกการ์ดและวาง'):'ตา '+(v.players.find(p=>p.id===v.active)?.name??'ผู้เล่น'),own:v.phase==='purses'?!!v.me&&!v.players.find(p=>p.id===v.me!.id)?.ready:v.active===v.me?.id};
  if(v.gameId==='power-hungry-pets')return {text:v.phase==='finished'?'จบเกม':v.phase==='round-end'?'สรุปรอบ':v.active===v.me?.id?(v.phase==='draw'?'จั่วไพ่':v.phase==='effect'?'ใช้ความสามารถ':'เลือกเล่นไพ่'):'ตา '+(v.players.find(p=>p.id===v.active)?.name??'ผู้เล่น'),own:v.active===v.me?.id};
  if(v.gameId==='love-letter')return {text:v.phase==='finished'?'จบเกม':v.phase==='round-end'?'สรุปรอบ':v.active===v.me?.id?'ตาคุณ · '+(v.phase==='draw'?'จั่วไพ่':v.phase==='effect'?'ใช้ความสามารถ':'เลือกการกระทำ'):'รอ '+(v.players.find(p=>p.id===v.active)?.name??'ผู้เล่น'),own:v.active===v.me?.id};
  if(v.gameId==='take-time'){if(v.phase==='discussion')return {text:'ปรึกษาก่อนเปิดมือ',own:false};if(v.phase==='resolution')return {text:'เปิดผลทีละช่อง',own:false};if(v.phase==='placement'&&!v.turn)return {text:'ใครพร้อม เริ่มได้',own:!!v.me};}
  if(v.gameId==='sounds-fishy')return {text:v.phase==='finished'?'จบเกม':v.phase==='round-end'?'คะแนนรอบนี้':v.phase==='thinking'?'คิดคำตอบ • ผู้ทายยังไม่เห็นเฉลย':v.turn===v.me?.id?'จับปลาแดง หรือหยุดรับคะแนน':'ฟังผู้ทายจับโกหก',own:v.turn===v.me?.id};
  if(v.gameId==='draftosaurus'){if(v.phase==='drafting')return {text:v.me?.choice?'เลือกแล้ว รอทุกคน':'เลือกไดโนเสาร์พร้อมกัน',own:!!v.me&&!v.me.choice};if(v.phase==='rolling')return {text:v.me?.canRoll?'ตาคุณทอยเต๋า':'รอ '+v.players.find(p=>p.id===v.roller)?.name+' ทอยเต๋า',own:!!v.me?.canRoll};}
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
