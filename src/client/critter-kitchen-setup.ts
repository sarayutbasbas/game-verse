import { CRITICS, RESTAURATEURS, RUMORS } from '../games/critter-kitchen/data.js';

export function critterKitchenSetup() {
    const basic = RUMORS.filter(r => !r.advanced).length;
    const html = `<section class="ck-setup" aria-labelledby="ck-setup-title">
      <h3 id="ck-setup-title">เลือกรูปแบบการประลองครัว</h3>
      <p>ทั้งสองตัวเลือกเปิดร่วมกันได้ ทุกแบบยังเล่น 2–5 คน รวม 7 รอบ วางแผนเชฟลับ ออกตลาด และเสิร์ฟอาหารเหมือนเดิม</p>
      <article class="ck-setup-option"><label for="ck-restaurateurs"><input type="checkbox" id="ck-restaurateurs" name="restaurateurs"><span>เพิ่มความสามารถเจ้าของร้าน<small>Restaurateurs · โมดูลเสริมในกล่องภาคหลัก</small></span></label>
      <p>ทำให้ร้านของแต่ละคนมีจุดเด่นต่างกัน เหมาะเมื่อเริ่มคุ้นกับการเลือกของและปรุงอาหารแล้ว</p>
      <dl><div><dt>เมื่อเปิด</dt><dd>ก่อนรอบแรก ทุกคนได้รับเจ้าของร้าน 2 ใบจากชุด ${RESTAURATEURS.length} ใบ แล้วเลือกเก็บ 1 ใบ ความสามารถใช้ตามเงื่อนไขบนการ์ดตลอดเกม และมีดาวโบนัสประจำตัวเมื่อจบเกม</dd></div><div><dt>เมื่อปิด</dt><dd>เริ่มวางแผนรอบแรกได้เลย ทุกคนใช้กติกาครัวเดียวกัน ไม่มีความสามารถหรือดาวโบนัสเจ้าของร้าน</dd></div></dl>
      <details><summary>ตัวอย่างความสามารถที่เพิ่มเข้ามา</summary><ul><li>Bobcat Flay: เนื้อและปลาใน Challenge เพิ่มคุณภาพชิ้นละ 3 ก่อนเครื่องเทศ</li><li>Julia Wild: ใช้เครื่องเทศทุกชนิดแทนเครื่องเทศอเนกประสงค์ได้</li><li>Marcus Roostersson: จบแต่ละรอบขยับหมวกขึ้น 1 ขั้น ถ้าอยู่หน้าสุดแล้วรับของสุ่มแทน</li></ul><p>แต่ละใบให้ความสามารถต่างกัน อ่านรายละเอียดและกดยืนยันเลือกเจ้าของร้านได้ก่อนเริ่มรอบแรก</p></details></article>
      <article class="ck-setup-option"><label for="ck-tutorial"><input type="checkbox" id="ck-tutorial" name="tutorial"><span>โหมดเกมแรก<small>The Mouse และข่าวลือพื้นฐาน</small></span></label>
      <p>เหมาะกับวงที่เพิ่งเล่นครั้งแรก ลดจำนวนเงื่อนไขที่ต้องเรียนรู้ โดยยังเล่นครบทั้งเกม</p>
      <dl><div><dt>เมื่อเปิด</dt><dd>ใช้ผู้วิจารณ์ The Mouse แน่นอน: มื้อสุดท้ายเสิร์ฟชีสได้หลายชิ้น และผู้ชนะ Best of Cheese ได้เพิ่ม 2 ดาว สุ่มข่าวลือ 3 ใบจากชุดพื้นฐาน ${basic} ใบ ตัดข่าวลือขั้นสูง ${RUMORS.length - basic} ใบออก</dd></div><div><dt>เมื่อปิด</dt><dd>สุ่มผู้วิจารณ์ 1 ใบจาก ${CRITICS.length} ใบ แต่ละตัวเปลี่ยนเงื่อนไขการปรุงหรือคะแนน และสุ่มข่าวลือ 3 ใบจากทั้ง ${RUMORS.length} ใบ รวมเงื่อนไขขั้นสูง</dd></div></dl>
      <p class="ck-setup-tip">ถ้าอยากเริ่มแบบเรียนรู้ง่าย: เปิดโหมดเกมแรก และปิดความสามารถเจ้าของร้าน ถ้าคุ้นแล้วค่อยเปิดเจ้าของร้านหรือใช้การสุ่มเต็มชุด</p></article>
      <p class="ck-setup-scope">ทั้งสองตัวเลือกนี้อยู่ในภาคหลัก ไม่ใช่ส่วนขยาย À La Cart เกมนี้ยังไม่รวม Solo หรือผู้เล่น 6–7 คน</p>
    </section>`;
    const intro=html.match(/<p>[\s\S]*?<\/p>/)![0];
    const scope=html.match(/<p class="ck-setup-scope">[\s\S]*?<\/p>/)![0];
    return html.replace(intro,'').replace(scope,'')
      .replaceAll('</label>','</label><details class="ck-option-details"><summary>รายละเอียด</summary>')
      .replaceAll('</article>','</details></article>')
      .replace('</section>',`<details class="ck-setup-overview"><summary>กติกาที่ใช้ร่วมกัน</summary>${intro}${scope}</details></section>`);
}
