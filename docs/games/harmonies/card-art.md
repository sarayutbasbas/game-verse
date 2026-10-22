# ชุดภาพการ์ด Harmonies

ห้องใหม่เลือก **2D · ภาพลายเส้น** เป็นค่าเริ่มต้น เจ้าของห้องเลือก **3D · ภาพมีมิติ** เพื่อใช้ภาพชุดเดิมได้ก่อนเริ่มเกม ตัวเลือก `cardArt` เก็บกับสถานะห้องและเผยแพร่ให้ทุกหน้าจอ เมื่อรีเฟรชหรือเริ่มแมตช์ใหม่ในห้องเดิมจะใช้ตัวเลือกเดิม สถานะเก่าที่ไม่มีฟิลด์นี้แสดงชุด 2D โดยไม่ต้องย้ายข้อมูล

การปรับชุดใหม่ล่าสุดทำเป็น Batch เพื่อให้ตรวจภาพก่อนขยายต่อ ปัจจุบัน `animal-01` ถึง `animal-05`, `spirit-11` ไดโนเสาร์, `spirit-09` แมลงปอสายน้ำ และ `whisper-05` เห็ดริมน้ำ ใช้ `public/art/harmonies/cards-v5/` รวม 8 ใบ: ภาพ cut-paper full bleed ขนาด master 720×1280, popup 360×640, small 270×480 และ lite 135×240 ส่วนการ์ดที่เหลือย้อนใช้ `public/art/harmonies/illustrated-v1/` โดยอัตโนมัติ จึงไม่มีการ์ดหายระหว่างรอตรวจ Batch ถัดไป รายละเอียดโครงสร้างอยู่ใน [cards-v5-batch-1.md](cards-v5-batch-1.md)

ภาพพื้นหลัง v5 มีเฉพาะสัตว์และฉาก ส่วนแถบขวาเป็น asset แยกกว้าง 94 px หรือ 13.0556% เท่ากันทุกใบ คะแนนยังเป็นข้อความจาก catalog ภายในกรอบ SVG และ habitat ประกอบด้วย DOM จาก axial `q/r`, stack ล่างขึ้นบน และตำแหน่ง `cube` จริง โทเคน master ชุดเดียวใน `tokens-v5/` ใช้กับกระดาน การ์ดเล็ก และ popup การ์ดเล็กแสดง `×2/×3`; popup แสดงชั้นจริงโดยไม่แสดงป้ายคูณ Prompt, source, output, dimensions และ SHA-256 เก็บใน `assets/source/harmonies/cards-v5/manifest.json`

ชุด `public/art/harmonies/illustrated-v1/` มีภาพ fallback ครบ 53 ใบ: สัตว์ 32, จิตวิญญาณ 11 (รวม T-rex), Crescendo 10 พร้อมหลังการ์ด โลโก้ ปุ่มวงกลม และพื้นหลัง ทุกภาพสร้างด้วย built-in `image_gen`; prompt และ source ของแต่ละงานเก็บใน `illustrated-v1-art-jobs.json`

สัตว์ธรรมดาใช้สีธรรมชาติและขอบขาว จิตวิญญาณมีลายเรขาคณิตทอง ส่วน Crescendo ใช้ม่วง/เงิน ทั้งหมดเป็นภาพประกอบใหม่ ไม่ใช่การสแกนหรือคัดลอกองค์ประกอบต้นฉบับ แผนผังโทเคน คะแนน โมเดลสัตว์ในรายละเอียด/บนกระดานและเงื่อนไขการวางไม่เปลี่ยน

ภาพชุดเดิมใน `reference/` และโมเดลใน `figurines/` เก็บไว้ครบ ไม่ถูกเขียนทับ การลดเอฟเฟกต์ยังเลือกโหลด thumbnail lite ของชุดภาพที่เลือกได้

ตรวจด้วย unit tests ว่า Batch 1 มี `data-q`, `data-r`, `data-stack-height`, cube destination และคะแนนตรง catalog ทุกใบ พร้อม browser test ที่ตรวจตลาดสัตว์, สัตว์ของคุณ, popup, มือถือ 390 px และ tablet 1024 px ชุด v5 รอบตรวจนี้มี 8 ใบและยังไม่ขยายไปยังการ์ดใบอื่นจนกว่าจะผ่านการตรวจภาพ

## Special 2D model colors and parallel board — 2026-10-21

The 21 special 2D figurines now use separately generated `figurines/magic-paper-v1` assets: ten rainbow Spirits, ten amethyst-purple Whispers, and one radiant gold T-rex. Ordinary animals retain `storybook-v1`; all original 3D files/mappings and the first 2D family remain intact. Every new export keeps the same 160×184 transparent canvas, 144×168 fit and baseline176. Source PNGs and per-job provenance are in `assets/source/harmonies/magic-paper-v1`; prompts and output hashes are in `magic-paper-v1-model-jobs.json`. Rebuild with `node scripts/build-harmonies-magic-models.mjs`. Review sheet: `data/qa-harmonies-magic-paper-v1/contact-sheet.png`.

Small paper twinkles accompany special 2D board/shelf figures and their large-card diagrams. They stay attached to the same model footprint; a shared Whisper’s twinkles scale with the half-size Whisper. Reduced effects and reduced-motion preferences keep the accents static. Sculpted models retain their existing effects.

Board viewports use orthographic CSS projection (`perspective:none`) in both cameras and both art modes. A rectangular mat lies below the existing 23 axial hexes; rules, neighbors and placement coordinates are unchanged. The fitter includes this mat while preserving cap anchors, equal layer thickness, stacking offsets and upright model billboards. Near/far terrain and equal-sized animal figures now have identical rendered dimensions.

Finished board animals stay fully opaque. A centered message above each garden reads “จบเกมแล้ว” and “ได้เวลาชมสวนของทุกคน”. The finished-board fitter reserves room below the message for the mat and figure heads; result and restart controls remain accessible.

Verified: build/typecheck, 14 focused unit cases and 12 browser cases. Tests compare equal near/far tile, token and model dimensions; preserve stack grounding and shared-Whisper scale; inspect every small/large card; exercise mouse/touch confirmation, T-rex twinkles/reduced motion, completed-board opacity/message placement, final results and restart. Local Docker rebuilt and healthy at `http://localhost:5555`. Live checks cover both modes across six responsive sizes, exact hashes for all 21 new sprites and 53 original 3D mappings, special models in scoring/popup, animated/static twinkles, and the rectangular orthographic mat. No data volume or existing auth store was replaced.

## Softer 2D tokens and vertical special scoring — 2026-10-21

2D now embeds each original `tokens-v5` PNG unchanged inside a self-contained `tokens-soft-v1/*.svg`. A color filter uses the corresponding card rail RGB directly, without added ivory lightening, while retaining the source luminance texture, symbols, shadows and cylinder detail. All six outputs have exactly the same alpha pixels, 256×224 dimensions and anchors as the 3D sources. The shared resolver applies them to board, preview, supply, hand, card habitats, Sanctuaries and guides. The original 3D URL/files remain unchanged; previous paper textures are retained. Rebuild with `node scripts/build-harmonies-soft-tokens.mjs`; source hashes and color targets are in `soft-token-colors.json`.

Spirit and T-rex scoring scenarios place the token/cube example above a centered 64-unit number. The 100-unit row height and 30% small-card / 27% popup widths keep the track near the upper right without covering the bottom habitat. Values, scenarios and ordinary/Whisper scoring are unchanged. This shared score renderer is used in both view modes.

## ORIGINAL และตัวเลือกส่วนตัว — 2026-10-22

ตั้งค่าในเกมมีปุ่มขนาดเท่ากัน 3 ปุ่ม **2D / 3D / ORIGINAL** ปุ่มที่เลือกเป็นสี active สลับได้ต่อเนื่องโดย popup ไม่ปิดและไม่เปลี่ยนสถานะห้อง ค่าในเครื่องมีลำดับก่อนค่าเริ่มต้นของห้อง

ORIGINAL ใช้ภาพทั้งใบจาก PDF/ภาพที่ผู้ใช้ส่งมา 43 ใบ ได้แก่สัตว์ธรรมดา 32 สัตว์วิเศษ 10 และทีเร็กซ์ 1 ใช้ PNG ไฟล์เดียวต่อใบทั้งการ์ดเล็กและใหญ่ ไม่สร้างภาพ โทเคน แถบคะแนน หรือเงาฟุ้งทับภาพนี้ แหล่งภาพและขนาดจริงอยู่ใน [manifest](original-art-manifest.json) สคริปต์ `scripts/extract-harmonies-original.py` ต้องใช้ Python ที่มี PyMuPDF และไฟล์ต้นทางชื่อเดิมใน Downloads

เสียงกระซิบ วิหาร และเสือ Pulse ที่ไม่มีภาพต้นฉบับในชุดนี้ใช้ภาพ 2D ตามเดิม ความละเอียดต้นทางส่วนใหญ่เป็นภาพการ์ดในภาพรวมราว 231×400px สัตว์วิเศษ 322×555px จึงมีขีดจำกัดเมื่อขยาย ไม่ได้อ้างว่าการแปลงไฟล์เพิ่มรายละเอียดที่ต้นฉบับไม่มี การ์ดฮิปโปและจิ้งจอกใช้ภาพเดี่ยวความละเอียดสูงกว่า ส่วนทีเร็กซ์ใช้ภาพถ่ายที่ส่งมา

## ORIGINAL ชุดวาดใหม่ครบ 43 ใบ — 2026-10-22

ORIGINAL เปลี่ยนมาใช้ฉากที่สร้างใหม่ด้วย built-in image_gen ทีละใบ รวม 43 ใบ โดยอิงสัตว์ ท่าทาง ฉาก องค์ประกอบ และสีจากภาพอ้างอิงเดิม แล้วประกอบกรอบสี คะแนน ฐานหกเหลี่ยม โทเคนลายอิงต้นฉบับ และลูกบาศก์จากข้อมูล catalog เพื่อไม่พึ่งตัวเลขหรือรูปแบบเกมที่ AI วาด ภาพสุดท้ายเป็น lossless WebP 900×1550 ไฟล์เดียวต่อใบสำหรับทุกขนาด ดู [ชุด prompt และแหล่งภาพ](original-redrawn-v1-jobs.json) ภาพอ้างอิงจาก PDF และชุด 2D/3D เดิมยังเก็บไว้

ภาพสัตว์ทั่วไปใช้สีแถบขวาตามตำแหน่งวาง cube และแสดงคะแนนมากไปน้อยแบบต้นฉบับ สัตว์วิเศษและทีเร็กซ์ใช้เงื่อนไขคะแนนจาก catalog เดิม ไม่ได้เปลี่ยนกติกาหรือค่าสกอร์ เสียงกระซิบ วิหาร และเสือ Pulse ยังใช้ภาพ 2D ตามเดิม

บนกระดานและในช่องเลือก ORIGINAL ใช้ cube สีทองสำหรับสัตว์ทั่วไป สีขาวสำหรับสัตว์วิเศษ/ทีเร็กซ์ และสีม่วงสำหรับเสียงกระซิบ ภาพ preview และภาพหลังยืนยันใช้ตัวเดียวกัน ฐาน cube ยึดฝาบนของโทเคนทั้งมุมบน/เอียง และใช้การแบ่งซ้ายขวา/ลำดับหน้าหลังเดิมเมื่ออยู่คู่กับเสียงกระซิบ สถิติยังใช้โมเดลสัตว์ตามเดิม โหมด 2D/3D ไม่เปลี่ยน

การประกอบใหม่จาก source ที่สร้างไว้แล้ว:

```sh
node scripts/build-harmonies-original-tokens.mjs
npx tsx scripts/build-harmonies-original-redrawn.ts
node scripts/activate-harmonies-original-redrawn.mjs
```

การ activate ตรวจครบ 43 ใบก่อนเปลี่ยนแผนที่ภาพ จึงไม่สลับไปใช้ชุดครึ่งสำเร็จ สคริปต์ดึงภาพจาก PDF เดิมเขียน `harmonies-original-reference-art.json` เพื่อเก็บภาพอ้างอิง โดยไม่ทับชุดวาดใหม่ที่กำลังใช้อยู่

## Sharp 2D token images inside cards — 2026-10-22

Card habitats, Spirit scoring scenarios and Sanctuary stacks now embed the existing precolored `tokens-soft-v1/*.png` directly through `terrainCardPrint`. Those lossless pixels match the color-filtered SVG at its native 256×224 resolution, including alpha, motifs and cylinder geometry. This avoids nesting a live color-filtered SVG inside another SVG diagram, so browser filtering does not soften small or enlarged card tokens. Board rendering, palette, positions, stack spacing, 3D token URLs and baked ORIGINAL images are unchanged.
