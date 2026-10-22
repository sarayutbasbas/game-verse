import {ANIMAL,NAMES} from '../games/harmonies/data.js';

/** Shared by board inspection and the library; printed points are cumulative. */
export function cardDetails(id:string){
 const card=ANIMAL[id];
 const placement=card.kind!=='spirit'&&card.kind!=='whisper'&&card.description?card.description:'หมุนได้ 6 ทิศ • ความสูงต้องตรง • อาคารใช้ฐานแดง/ลำต้น/หินได้';
 const scoring=card.kind==='spirit'
  ? `<p>วางจิตวิญญาณตามรูปแบบบนการ์ดก่อน จึงเปิดใช้โบนัสนี้ตอนจบเกม</p><p>${card.description}</p>`
  : card.kind==='whisper'
   ? `<p>${card.description}</p><p>คิดแยกทีละคิวบ์ แล้วรวมคะแนนของทั้งสองชิ้น ไม่ใช้คะแนนสะสมแบบการ์ดสัตว์</p>`
   : `<p>สร้างถิ่นอาศัยตรงรูปแบบ แล้ววางสัตว์ได้ครั้งละ 1 ตัวบนช่องที่กำหนด ตอนจบเกมดูจำนวนสัตว์ที่วางสำเร็จในใบนี้</p><dl class="hm-card-point-steps">${card.points.map((points,i)=>`<div><dt>${i+1} ตัว</dt><dd>${points} คะแนน</dd></div>`).join('')}</dl><p>ใช้คะแนนรวมของขั้นล่าสุดเพียงขั้นเดียว ไม่บวกคะแนนแต่ละขั้นเข้าด้วยกัน ถ้ายังวางสัตว์ไม่ได้เลย ใบนี้ได้ 0 คะแนน</p>`;
 return `<section class="hm-card-scoring"><h3>วิธีได้คะแนน</h3>${scoring}${id==='spirit-11'?'<p class="hm-promo-scoring-example"><strong>ตัวอย่างคะแนน:</strong> สัตว์ที่เชื่อมต่อถึงทีเร็กซ์ 6 ตัว × 2 = โบนัส 12 คะแนน เพิ่มจากคะแนนปกติ ไม่ใช่คูณคะแนนรวมทั้งกระดาน</p>':''}</section><section class="hm-card-habitat"><h3>รูปแบบถิ่นอาศัย</h3><p>${placement}</p><dl class="hm-detail-requirements" style="--requirement-columns:${card.pattern.length}">${card.pattern.map((p,i)=>`<div><dt>ช่องที่ ${i+1}</dt><dd>${p.stack[0]==='building'&&((card.kind!=='whisper'&&card.expansion!=='pulse')||p.stack.length===2)?'<span>อาคาร 2 ชั้น</span><span>ฐาน: แดง / ลำต้น / หิน</span>':p.stack.map(t=>`<span>${NAMES[t]}${t==='building'?' 1 ชั้น':''}</span>`).join('')}${p.cube?`<em>${card.kind==='whisper'?'วางเสียงกระซิบ':card.kind==='spirit'?'วางจิตวิญญาณ':'วางสัตว์'}</em>`:''}</dd></div>`).join('')}</dl></section>`;
}
