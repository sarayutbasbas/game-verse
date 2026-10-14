# Azul presentation direction — 2026-10-14

Reference ทั้งสองภาพที่ผู้ใช้แนบ: กล่องมี mosaic สีสด/กรอบน้ำเงินและลายโปรตุเกส; ภาพกระดานเพิ่มเติมแสดง pattern/wall/floor, ผิวกระเบื้องเคลือบ และ score track. ใช้เป็นภาษาภาพ ไม่เอากล่องเป็นพื้นหลังหรือคัดลอกโลโก้/scan.

Renderer เดิม DOM/CSS. ไม่แก้ engine, server actions/projections หรือ state schema. กระดานและทุกตัวเลขยังอ่าน server state. ใช้ frontend-design/imagegen/web-design-guidelines/multiplayer-testing; กติกาเดิมและ marker-full ruling คงเดิม.

Tokens: ivory #fff9e8, cobalt #124d78, teal #0e8893, ochre #e6ae3b, coral #c83b2f, charcoal #142c37. Noto Sans Thai เดิมสำหรับ UI, Georgia สำหรับชื่อ Azul ที่พิมพ์ด้วยโค้ด. Tiles top-down; material/ornaments เป็นภาพ, thickness/shadow/selection เป็น CSS. ตัวอักษร B/Y/R/K/W เป็นตัวช่วยขนาดเล็ก ไม่ทับลายกลาง.

Assets ที่สร้างและเชื่อมใช้งานจริงผ่าน built-in image_gen: five ceramic tile faces (blue lozenge/yellow rosette/red diamond/black turquoise arabesque/white teal star), ivory board paper + decorative frame, circular factory backing, first-player marker และ portrait cover ไม่มีโลโก้/ตัวเลข. Sources `assets/source/azul/`; runtime WebP `public/art/azul/` และ `public/art/covers/azul.webp`. ไฟล์ไม่มีข้อความเกมฝังใน artwork.

Shared display: supply ด้านซ้าย กระดานทุกคนทางขวา; 2/3/4 players arrangement ตามพื้นที่. โรงงานแสดงชิ้นจริงครบไม่ซ้อน พร้อม count แยกสี; กลาง grouped counts. PlayerBoard มี ScoreTrack เป็นหน้าต่างค่าจริง 11 ช่อง ไม่ใช้ modulo เพื่อลวงคะแนนเกินช่วง, PatternLines, WallGrid ghost/filled, FloorLine penalties และ current-turn label.

Phone: เริ่มเลือก source/color; หลังเลือกย่อ supply และคง selectionเมื่อดูคู่แข่ง. เลือกปลายทางจากแถว/พื้นบนกระดานตัวเอง; overlay preview เส้นประ แยกจากชิ้น committed และมาจาก server offers. ปุ่มยืนยันอยู่ใน flow ไม่ปิดบัง floor/safe area. Local interaction อัปเดตเฉพาะ controls/preview/selection ไม่ rebuild public table ทุกครั้ง. Accepted revision เท่านั้นเปลี่ยนภาพ state; reconnect snap latest; ไม่มี tile-move animation ซับซ้อน.

Results: wall row/column/points และ floor/after จาก settlements. Final before-bonus จาก latest settlement.after, bonus counts/points/total และ winners จาก server. UI อธิบาย tie จาก published total/rows แต่ไม่คำนวณคะแนนหรือเลือก winner ใหม่.

ส่งมอบ artwork และ provenance: [azul-assets.md](azul-assets.md). ผลตรวจรับและข้อจำกัด: [../progress.md](../progress.md).
