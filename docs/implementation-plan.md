# แผน MVP และ stack

Node.js 24 + TypeScript; ws สำหรับ WebSocket; Vite + DOM/CSS สำหรับหน้าจอ; qrcode สร้าง QR ในเครื่อง ไม่มีบริการภายนอกหรือบัญชีผู้ใช้ Engine ไม่มี transport dependency และลงทะเบียนผ่าน game registry เพื่อเพิ่มเกมภายหลัง

1. ห้อง: สร้าง/เข้าห้อง, host แยกจาก player, credential ผ่าน WebSocket เท่านั้น, session resume, revision และ action ID. ตรวจ integration protocol
2. กติกา: Second Edition 2018 / rulebook reprint 2024; engine deterministic, server randomness. ทดสอบ stack, crazy camel, tile, payout, finish และ invalid transitions
3. UI: จอกลาง public projection, มือถือ own projection, QR/code, ไทย, responsive, legal actions, private finish cards, pending retry และ connection status
4. Acceptance: browser contexts จอกลาง + ผู้เล่นอย่างน้อย 2 คน, เล่นจนจบ, reconnect, payload privacy, duplicate/stale/wrong turn, build/typecheck แล้วบันทึกผลจริง

ยังไม่ deploy สาธารณะ ไม่มีค่าใช้บริการ MVP single process/memory rooms; restart ล้างห้อง; ไม่รองรับ horizontal scaling

## ทิศทางภาพ
สี deep lagoon #143f50, paper white #f8faf9, track sand #e7bd69, racing plum #753e72, ink #182a32 และ signal blue #166783. ฟอนต์ Tahoma/Leelawadee UI/Noto Sans Thai/system fallback เพื่อรองรับภาษาไทยโดยไม่เรียก CDN

หน้าจอกลางใช้ลู่วิ่งเป็นภาพหลัก: 16 ช่องเรียงคดไปมาพร้อม stack ที่อ่านล่าง→บนและชื่อสี ไม่อาศัยสีอย่างเดียว; ข้างกระดานเป็นรายชื่อ เงิน และตาปัจจุบัน. มือถือใช้ปุ่มใหญ่ในคอลัมน์เดียว จัด action ตามจังหวะเล่น. เลือกกระดานเป็นจุดเด่นและใช้พื้นหลังเงียบ ไม่มี motion ตกแต่ง
