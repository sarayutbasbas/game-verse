# Dracula UI — presentation upgrade

Core engine/generic rooms/projectionsเดิม. หน้าเลือกเกม/เข้าห้อง/ใส่ชื่อ/QR/lobby ใช้ `platform.ts` / neutralplatformtokensร่วมกับCamel. หลังเริ่มจึงเข้าสู่ gothic game theme. ไม่เปลี่ยนบทบาท/abilities/scoring

Reference กระดาน กล่อง และการ์ดที่แนบถูกตรวจแล้ว. Palette midnight/teal/wine/violet/ochre, etched painted gothic figures, city roads and tactile printed cards. ใช้ artworkใหม่ทั้งหมด ไม่มีโลโก้หรือ scanต้นฉบับ. ไทย/ตัวเลข/สัญลักษณ์/ค่ากติกาเป็นDOM

Map fixed5districts, Draculaบน/Helsingล่าง, tokens4คนกลาง, countแวมไพร์อ่านได้โดยไม่พึ่งสี. Publichead round/turn/HP/trump. มือถือcontrolsอยู่ก่อนmap เลือกการ์ด/targets→preview→confirm ไม่บังคับdrag. แต่ละการ์ดมีสี+ชื่อ+glyphและeffecticon, 8illustrationsตามvalues1–8. Hiddenทุกใบใช้backเดียวไม่มีtype/suitmetadata

Persistent board DOM และ WAAPI แยกจาก latest model. Server ส่งการ์ดและผลครบใน revision เดียว แต่ภาพเปิดทีละคู่ตามเขต 1–5: flip 500ms แล้วแสดงผู้ชนะ/ผู้แพ้ เหตุผล และผลต่อ HP/แวมไพร์ 2100ms ก่อนคู่ถัดไป. อ่านผลจาก server เท่านั้น. Ready acknowledgement ของผลรอบเดิมไม่ตัด sequence. Initial/snapshot/reconnect snap; duplicates ignore; gap resync; reduced motion cancel/snap.

การ์ด 2: public draw panel แสดงใบที่เปิดจากกองจั่วต่อทุกจอเมื่ออีกฝ่ายจั่ว. เมื่อวางแทนที่ ไพ่ยังเปิดเผยใน rack และ lastAction ระบุสี/เลข/เขต เฉพาะใบที่เปิดแล้ว. ไพ่ปิดยังไม่เผยข้อมูลเพิ่ม.

จอคอมใหญ่มีแผงคู่ไพ่ข้างเมือง มือถือ/iPad มีแผงคู่ไพ่เหนือเมือง. เขตที่ยังไม่เฉลยซ่อนหน้าการ์ดและผลจากภาพ/assistive technology. ป้ายผู้ชนะเกมแสดงหลัง sequence จบ. ปุ่มพร้อมรอบถัดไป/เล่นอีกครั้งพักเฉพาะ presentation; กด “แสดงผลทั้งหมด” เพื่อข้ามได้. Server ไม่รอ animation. เมื่อชนะก่อนครบ 5 เขต เฉลยเฉพาะเขตที่ server ตัดสินจริง.

ไฟล์: `src/client/dracula.ts`, `dracula.css`, `dracula-motion.ts`, `dracula-assets.ts`; runtimeart `public/art/dracula/` และcovers `public/art/covers/`. Plan/prompt/manifest: `docs/presentation/`, `public/art/presentation-manifest.json`. ผลทดสอบ/screenshotและข้อจำกัดในprogress
