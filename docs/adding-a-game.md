# Adding a game to GameVerse

1. ตรวจ edition/rules และบันทึก sources ใน `docs/games/<id>/rules.md`. แก้ ambiguity ก่อน engine ที่เกี่ยวข้อง
2. เพิ่ม public metadata ใน `src/shared/catalog.ts`: stable id, name/aliases/cover/alt, counts หรือ exact supportedCounts, duration/category/difficulty (null เมื่อยังไม่ยืนยัน), status, rulesVersion, stateSchemaVersion, UI key. ใส่ duration/category/difficulty เฉพาะเมื่อมีแหล่งยืนยัน สองเกมมีเวลาประมาณ 30 นาทีจาก distributor ทางการและ metadataSource แนบใน registry; difficulty เป็น null เพราะไม่มีระดับที่ยืนยัน
3. สร้าง pure engine ใน `src/games/<id>/` ใช้ injected RNG; validate action/turn ก่อน clone/mutate. ห้าม imports DOM/ws/DB. แยก public projection และ player-private projection
4. หุ้ม engine ด้วย `GameAdapter<State,PrivateView>` ใน server-only `src/games/registry.ts`: settings/count validation, start/apply, public/private, isFinished/summary. สองเกมเดิมใช้ adapter โดยไม่เขียนกติกาใหม่
5. เพิ่ม discriminated RoomView/RoomAction ใน shared types และ registration ฝั่ง client สำหรับ renderer/assets/theme. Server engine registry ห้าม import เข้าฝั่ง client. ขณะนี้ storage room fields `game`/`duel`/`azul` รักษา compatibility; เกมใหม่ต้องเพิ่ม typed room state branch/validation และ projection โดยไม่เปลี่ยนเกมที่ใช้อยู่
6. เพิ่ม restore validation และ schema compatibility policy; migration ต้องทดสอบ saved fixtures/receipts/reconnect ด้วย ห้ามเปิดเกม schema ไม่ตรงแบบเงียบ ๆ
7. ใช้ common login/profile/home/search/join/lobby/session protocol; ออกแบบเฉพาะ gameplay surface. Count/status/create guards มาจาก catalog และ server settings
8. Unit tests ของกติกา + actual HTTP/WS projections/permissions/dedup/stale/reconnect/restart + browser shared display/phones/full game/screenshots/reduced motion. เริ่ม beta/maintenance หากยังไม่ผ่านเกณฑ์เล่นจริง

Home ใช้ shared metadata ไม่ hardcode card รายเกม ไม่มีเกมสมมติ. Renderer และ engines ยังเป็น typed registrations ที่ต้องเขียนโค้ดเพิ่ม ไม่ใช่ระบบ plugin ที่นำไฟล์ไม่เชื่อถือมารัน

Metadata sources: [Camel Up Second Edition, Asmodee USA](https://store.asmodee.com/products/camel-up) ระบุฉบับ2018/3–8คน/เฉลี่ย30นาที; [Dracula vs Van Helsing, Asmodee Italia](https://www.asmodee.it/product/dracula-vs-van-helsing/) ระบุ2คน/30นาที/strategia-tattica. หมวดหมู่เป็นคำอธิบาย UI จากข้อมูลการเล่น ไม่ใช้ complexity rating ที่เดาขึ้นเอง

Azul ภาคหลักเพิ่ม typed state branch `azul` พร้อม validator ตรวจ tile conservation 100 ชิ้นและ 20 ต่อสี. Metadata 2–4 คน/30–45 นาทีจาก Next Move Games (durationMinutes ใช้ค่าบน 45); UI และ engine ใช้ WALL mapping กลางชุดเดียว.
