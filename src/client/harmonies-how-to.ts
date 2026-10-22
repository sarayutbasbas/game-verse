import {BOARD_NAMES} from '../games/harmonies/boards.js';
import type {Side} from '../games/harmonies/types.js';
import {terrainScene} from './harmonies-scenes.js';
import {habitatDiagram} from './harmonies-presentation.js';
import {ANIMAL,NAMES} from '../games/harmonies/data.js';
import type {HarmoniesOptions,Terrain} from '../games/harmonies/types.js';

const example=(stack:Terrain[],label:string)=>`<figure>${terrainScene(stack)}<figcaption>${label}</figcaption></figure>`;

/** Uses the board's actual token/animal renderers, rather than separate guide artwork. */
export function harmoniesHowTo(side:Side,options?:HarmoniesOptions){
 return `<div class="hm-guide-intro"><h3>สร้างสวนให้สัตว์มาอยู่อาศัย</h3><p>เลือกโทเคน จัดภูมิประเทศให้ตรงถิ่นอาศัยบนการ์ด แล้ววางสัตว์เพื่อเก็บคะแนน ห้องนี้ใช้ด้าน <b>${side} · ${BOARD_NAMES[side]}</b></p></div>
 ${side==='C'?'<section><h3>กระดาน C · วงล้อม</h3><p>26 ช่องรอบช่องว่างกลาง ช่องกลางวางไม่ได้ อาคารที่ติดสีต่างกัน 4 สีได้ 8 คะแนน น้ำคิดแบบแม่น้ำ</p></section>':side==='D'?'<section><h3>กระดาน D · ชลประทาน</h3><p>25 ช่อง มีช่องแห้งแล้ง 18 ช่อง ช่องแห้งแล้งเป็นช่องปกติเมื่อมีน้ำอยู่ติดกัน ต้นไม้บนช่องปกติได้ 2/4/9 คะแนน ทุ่งติดกัน 2 ช่องขึ้นไปได้ 6 คะแนนเมื่อมีช่องปกติอย่างน้อย 1 ช่อง น้ำคิดแบบแม่น้ำ</p></section>':''}
 <section><h3>รู้จักโทเคนทั้ง 6 แบบ</h3><div class="hm-guide-token-gallery">${(['water','rock','wood','leaf','field','building'] as Terrain[]).map(t=>example([t],NAMES[t])).join('')}</div></section>
 <section><h3>หนึ่งตาทำอะไรบ้าง?</h3>
 <h4>รับโทเคน 1 กลุ่ม แล้ววางให้ครบ 3 ชิ้น</h4><div class="hm-guide-examples hm-guide-group">${example(['water'],'น้ำ')}${example(['rock'],'หิน')}${example(['wood'],'ลำต้น')}</div><p>เลือก 1 จาก ${options?.solo?3:5} กลุ่ม รับโทเคนทั้งกลุ่ม แล้ววางลงสวนทีละชิ้น ลำดับการวางเลือกเองได้</p>
 <h4>รับการ์ดสัตว์ได้ไม่เกิน 1 ใบ</h4><p>ถือการ์ดที่ยังไม่สำเร็จได้มากที่สุด 4 ใบ การ์ดที่วางสัตว์ครบแล้วเก็บไว้คิดคะแนนและไม่นับในโควตานี้</p>
 <h4>วางสัตว์ได้หลายครั้ง</h4><p>เมื่อสีและความสูงตรงรูปแบบบนการ์ด เลือกสัตว์ด้านขวา แตะช่องที่มีกรอบ แล้วกด ✓ เพื่อยืนยัน รับการ์ดและวางสัตว์ก่อน ระหว่าง หรือหลังวางโทเคนก็ได้</p>
 <h4>กด End เมื่อทำครบแล้ว</h4><p>วางโทเคนทั้ง 3 ชิ้นให้ครบก่อนกดปุ่ม End เพื่อจบตา ถ้าต้องการวางสัตว์เพิ่มให้ทำก่อนจบตา กองกลางจะเติมเมื่อจบตา</p></section>
 <section><h3>ซ้อนโทเคนอย่างไร?</h3><div class="hm-guide-examples">${example(['wood','wood','leaf'],'ต้นไม้สูง 3')}${example(['rock','rock','rock'],'ภูเขาสูง 3')}${example(['wood','building'],'อาคารสูง 2')}</div><ul>
 <li>ทุกสีวางบนช่องว่างได้ ห้ามสอดไว้ใต้โทเคนเดิม</li><li>หินซ้อนหินได้สูงสุด 3 ชั้น ลำต้นซ้อนได้สูงสุด 2 ชั้น แล้วปิดด้วยพุ่มไม้ได้อีก 1 ชั้น</li><li>พุ่มไม้วางบนพื้นหรือบนลำต้น 1–2 ชั้นได้ เมื่อปิดพุ่มแล้วซ้อนเพิ่มไม่ได้</li><li>อาคารที่สมบูรณ์คือสีแดงบนฐานแดง ลำต้น หรือหิน 1 ชิ้น รวมสูง 2 ชั้น</li><li>น้ำและทุ่งดอกไม้ไม่ซ้อนกัน ช่องที่มีสัตว์หรือเสียงกระซิบแล้วเพิ่มโทเคนไม่ได้</li></ul></section>
 <section><h3>สร้างถิ่นอาศัยเพื่อวางสัตว์</h3><div class="hm-guide-habitat">${habitatDiagram('animal-01',true)}</div><p>ตัวอย่างถิ่นอาศัยของ <b>${ANIMAL['animal-01'].name}</b> ใช้สี จำนวนช่อง และความสูงให้ตรงการ์ด หมุนได้ 6 ทิศ · การ์ด Pulse กลับภาพสะท้อนได้ด้วย</p><p>ช่องที่วางสัตว์ต้องว่างจากสัตว์ตัวอื่น แต่ใช้ภูมิประเทศช่องรอบ ๆ ร่วมกับรูปแบบอื่นได้ เมื่อวางสัตว์แล้ว คะแนนบนการ์ดจะเลื่อนไปช่องถัดไป</p></section>
 ${options?.solo?'<section><h3>Solo · สร้างสวนคนเดียว</h3><p>เลือกจากภูมิประเทศ 3 กลุ่มและการ์ด 3 ใบ เมื่อจบตา โทเคนกลางที่ไม่ได้เลือกทั้ง 6 ชิ้นจะถูกเก็บออก แล้วจั่วใหม่ทั้ง 3 กลุ่ม ถ้าตานี้ไม่ได้รับการ์ด สามารถกดปุ่มเปลี่ยนบนการ์ดกลางเพื่อทิ้งและเปิดใหม่ 1 ใบ เมื่อเปลี่ยนแล้วต้องจบตา</p></section>':''}
 ${options?.natureSpirits?`<section><h3>จิตวิญญาณธรรมชาติ</h3><div class="hm-guide-examples">${terrainScene(['rock','rock','rock'],'spirit-07')}</div><p>ทุกคนเลือก 1 จากการ์ดลับ 2 ใบพร้อมกันก่อนเริ่มตาแรก การ์ดที่เลือกนับรวมขีดจำกัด 4 ใบ สร้างถิ่นอาศัยตามการ์ดแล้ววางจิตวิญญาณเพื่อปลดล็อกโบนัส คิดโบนัสจากสวนตอนจบเกม</p></section>`:''}
 ${options?.promoTrex?`<section><h3>โปรโมไดโนเสาร์ · T-rex</h3><div class="hm-guide-habitat">${habitatDiagram('spirit-11',true)}</div><p>เพิ่ม T-rex ลงกองจิตวิญญาณแล้วสุ่มแจกตามปกติ จึงอาจไม่ได้พบทุกเกม ใช้หินสูง 3 ชั้น–ทุ่งดอกไม้–ต้นไม้สูง 3 ชั้นเรียงตรงกัน หมุนได้ 6 ทิศ วาง T-rex บนทุ่งดอกไม้เพื่อเปิดโบนัส</p></section>`:''}
 ${options?.whispers?`<section><h3>เสียงกระซิบ</h3><div class="hm-guide-examples">${terrainScene(['water'],'whisper-01')}${terrainScene(['field'],'whisper-03')}</div><p>รับแทนการ์ดสัตว์ได้ แต่ยังรับรวมได้ไม่เกิน 1 ใบต่อตา ทำรูปแบบ 2 ช่องตามการ์ด หมุนได้ 6 ทิศ เสียงกระซิบอยู่ร่วมช่องกับสัตว์หรือจิตวิญญาณได้ วางสิ่งใดก่อนก็ได้ แต่เสียงกระซิบอยู่ได้ช่องละ 1 ชิ้น</p></section>`:''}`;
}
