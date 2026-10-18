import type {Role} from './types.js';
// Landing Procedure (EN 06 Jun 2023), pp3–11. Index0 is the cloud/current position.
export const SCENARIOS={ 'yul-intro':{id:'yul-intro',name:'YUL Montréal–Trudeau',altitudeSide:'green-yellow',traffic:[0,0,1,2,1,3,2],rerollAltitudes:[6000,2000],starters:['pilot','copilot','pilot','copilot','pilot','copilot','pilot'] as Role[],modules:[]}} as const;
export interface Control {id:string;name:string;role:Role|'both';values:number[];kind:'axis'|'engine'|'radio'|'gear'|'flaps'|'brakes'|'coffee';index:number;help:string}
const all=[1,2,3,4,5,6];
export const CONTROLS:Control[]=[
 ...(['pilot','copilot'] as Role[]).flatMap(role=>[
 {id:`axis-${role}`,name:'แกนเครื่องบิน',role,values:all,kind:'axis' as const,index:0,help:'จำเป็นทุกรอบ • ลูกที่สองหมุนแกนตามผลต่าง เข้าขีด ±3 แพ้ทันที'},
 {id:`engine-${role}`,name:'เครื่องยนต์',role,values:all,kind:'engine' as const,index:0,help:'จำเป็นทุกรอบ • ลูกที่สองรวมความเร็วและเคลื่อนทันที รอบลงจอดเทียบเบรก ณ ตอนวาง'}]),
 ...(['pilot','copilot','copilot'] as Role[]).map((role,i)=>({id:`radio-${i}`,name:`วิทยุ ${i===0?'Pilot':i}`,role,values:all,kind:'radio' as const,index:i,help:'ค่า 1 คือช่องปัจจุบัน ค่า 2 คือช่องถัดไป นำเครื่องบินออก 1 ลำ หากไม่มีไม่เกิดผล'})),
 ...[[1,2],[3,4],[5,6]].map((values,index)=>({id:`gear-${index}`,name:`ล้อ ${index+1}`,role:'pilot' as const,values,kind:'gear' as const,index,help:'เปิดล้อตามลำดับใดก็ได้ • ครั้งแรกเพิ่มขอบฟ้า +1 • ช่องเปิดแล้ววางซ้ำได้แต่ไม่มีผล'})),
 ...[[1,2],[2,3],[4,5],[5,6]].map((values,index)=>({id:`flaps-${index}`,name:`แฟลป ${index+1}`,role:'copilot' as const,values,kind:'flaps' as const,index,help:'ต้องกางตามลำดับ 1 → 4 • ครั้งแรกเพิ่มขอบส้ม +1 • ช่องที่กางแล้วไม่มีผลเพิ่ม'})),
 ...[2,4,6].map((n,index)=>({id:`brakes-${index}`,name:`เบรก ${n}`,role:'pilot' as const,values:[n],kind:'brakes' as const,index,help:'เปิดตามลำดับ 2 → 4 → 6 • ต้องทำก่อนวางเครื่องยนต์ครบคู่ในรอบลงจอด'})),
 ...[0,1,2].map(index=>({id:`coffee-${index}`,name:`สมาธิ ${index+1}`,role:'both' as const,values:all,kind:'coffee' as const,index,help:'วางค่าใดก็ได้ รับกาแฟ 1 ถ้วย เก็บรวมได้ 3 ถ้วย ใช้ปรับลูกที่กำลังวาง ±1 ต่อถ้วย ค่าไม่วน 1↔6'}))
];
export const CONTROL=Object.fromEntries(CONTROLS.map(c=>[c.id,c]));
export const ROLE_NAME={pilot:'นักบิน Pilot',copilot:'ผู้ช่วยนักบิน Co-pilot'};
