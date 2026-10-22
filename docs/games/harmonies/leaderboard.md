# Harmonies leaderboard

หน้ารายละเอียด `/games/harmonies` มีไอคอนถ้วยวงกลมเปิด popup อันดับผู้เล่น ดูได้ก่อนล็อกอิน แยกเล่นคนเดียวกับแข่งขัน เน้นสามอันดับแรกด้วยเหรียญทอง/เงิน/ทองแดง แสดงรูปโปรไฟล์ ชื่อ คะแนน และวันที่ทำคะแนน (เวลาไทย)

## การจัดอันดับและการเก็บข้อมูล

- รวมผู้เล่นทุกบัญชีทั้งสมาชิกและ Guest ที่มี identity ที่เซิร์ฟเวอร์ยืนยันแล้ว แต่ละคนมีคะแนนดีที่สุดได้หนึ่งรายการต่อโหมด
- เล่นคนเดียวใช้เกมที่มีผู้เล่นหนึ่งคน แข่งขันใช้เกม 2–4 คน บันทึกผู้เล่นทุกคนตามคะแนนรวมจริง ไม่จำกัดเฉพาะผู้ชนะ รวมกระดาน A/B และภาคเสริมที่เปิดในเกม
- เรียงคะแนนมากไปน้อย ถ้าเท่ากันใช้วันที่ทำคะแนนได้ก่อน และ internal identity เพื่อจัดลำดับแบบคงที่ เก็บเพียง 10 รายการต่อโหมดจริงในฐานข้อมูล (สูงสุดรวม 20 แถว) ไม่เก็บประวัติคะแนนที่หลุดสิบอันดับ
- วันที่เป็นวันที่ทำ personal best ไม่ใช่วันที่กลับเข้าห้องหรือแก้โปรไฟล์ อ่านชื่อ/รูปปัจจุบันจาก profile หากมี โดยมี snapshot เป็น fallback การเชื่อม Guest เข้าบัญชีรวมสองอันดับให้เหลือสถิติที่ดีที่สุด
- เริ่มบันทึกเฉพาะการเปลี่ยน `playing → finished` หลังอัปเดต ไม่ประมาณวันที่หรือย้อนหลังจากห้องเก่าที่จบไปแล้ว

## Boundary และ durability

Engine ยังคำนวณคะแนนเองตามกติกาเดิม RoomService อ่าน `state.scores[player.id].total` และผูก identity จากที่นั่งฝั่งเซิร์ฟเวอร์ ไม่มี endpoint ให้ client ส่งคะแนน การบันทึก top ten และสถานะจบเกมอยู่ transaction เดียวกัน ถ้าบันทึกไม่สำเร็จจะ rollback และไม่ส่งสถานะจบเกมที่ยังไม่ commit

`GET /api/games/harmonies/leaderboard` ส่งเฉพาะ rank/name/avatar/score/achievedAt ของแต่ละโหมด พร้อม `Cache-Control: no-store` ไม่มี user ID, email, token, รหัสห้อง หรือการ์ดลับ Popup โหลดข้อมูลใหม่ทุกครั้งที่เปิด รองรับ loading, empty, retry, Escape/focus restoration และโทรศัพท์ 320px

Migration แบบ additive `migrations/003-harmonies-leaderboard.sql` ใช้ได้ทั้ง SQLite และ PostgreSQL ไม่ล้างตารางหรือ room data เดิม ทดสอบกับ SQLite ชั่วคราวและ PostgreSQL container ชั่วคราวแยกจากแอปจริง ไม่ได้เชื่อม production database

## Verification

- `npm test`: 293 tests, 289 passed / 4 optional PostgreSQL cases skipped โดยเคส PostgreSQL ของ leaderboard รันแยกกับฐานข้อมูลทดสอบจริงแล้ว
- `tests/harmonies-leaderboard.test.ts`: top ten/สองโหมด, personal best, ties, profile, account merge, rollback, migration/reopen; ผ่านทั้ง SQLite และ PostgreSQL
- `tests/harmonies-leaderboard-rooms.test.ts`: จบเกมจริง Solo/แข่งขัน, forged score, final host/phone race, receipt retry, จำลอง storage failure, process restart/reconnect และ public payload; PostgreSQL ตรวจ final race ข้ามสอง server instances ด้วย
- `tests/browser/harmonies-leaderboard.spec.ts`: popup อ่าน endpoint จริง, loading/mode race, ครบสิบอันดับ/สามเหรียญ, escaped names, รูป/วันที่, โหลดใหม่, retry, empty, focus และ desktop/390/320px
- หลักฐานเฉพาะเครื่องอยู่ `data/hm-leaderboard-*.log` และ `data/qa-harmonies-leaderboard/`

The in-game toolbar also opens this same top-ten dialog from the trophy button immediately left of the scoring button. Scoring uses a bar-chart icon to distinguish the two actions. Solo and competitive tabs use the existing leaderboard endpoint, including its loading, empty and failure states; opening the dialog never changes game state.
