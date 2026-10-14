# Azul artwork — 2026-10-14

สร้างภาพจริงด้วย built-in `image_gen` จำนวน 11 ครั้ง (9 ภาพหลัก และแก้ลาย yellow/black อีก 2 ครั้ง). ใช้ reference ของผู้ใช้เพื่อโทน azulejo และวัสดุ ไม่คัดลอกโลโก้ ภาพกล่อง หรือ scan. ภาพไม่ฝังข้อความเกม ชื่อ ตัวเลข และค่าปรับ; แอปพิมพ์ข้อมูลจาก server ด้วย DOM.

## ไฟล์ที่ใช้จริง

| Asset | Runtime | ขนาด |
|---|---|---|
| Blue: ลายสี่แฉกขาว | `public/art/azul/tile-blue.webp` | 256×256 |
| Yellow: ดอกกลมแปดกลีบส้ม | `public/art/azul/tile-yellow.webp` | 256×256 |
| Red: ลายเพชรซ้อน | `public/art/azul/tile-red.webp` | 256×256 |
| Black: เถาลายโค้ง turquoise | `public/art/azul/tile-black.webp` | 256×256 |
| White: ดาว teal แปดแฉก | `public/art/azul/tile-white.webp` | 256×256 |
| กระดาษ/กรอบผู้เล่น | `public/art/azul/board-paper.webp` | 1024×1024 |
| แผ่นรองโรงงาน | `public/art/azul/factory.webp` | 384×384 |
| ผู้เริ่มรอบ | `public/art/azul/first-player.webp` | 192×192 |
| ปก portal | `public/art/covers/azul.webp` | 640×960 |

รวม **561,830 bytes**. Tiles/factory/marker มี alpha จริง ภาพ top-down ไม่มี perspective; CSS ใส่ความหนา เงา ขอบเลือก และ preview. แยก tile ด้วยสี ลาย และ B/Y/R/K/W. ภาพกรอบใช้ border-image ไม่รวมตำแหน่งช่องหรือข้อความ. ปกเว้น cartouche ให้ชื่อเกมที่แสดงด้วยโค้ด. SVG ปกเดิมยังเก็บไว้แต่ catalog ไม่ใช้แล้ว.

PNG ต้นฉบับ `assets/source/azul/`; `generation-sources.json` บันทึกไฟล์จากเครื่องมือ. Yellow/black รุ่นแรกเก็บเป็น `*-v1.png`; runtime ใช้รุ่นแก้ที่แยกลายชัดขึ้น. Metadata runtime อยู่ `public/art/azul/manifest.json`.

## Prompt set ที่ใช้

ทุกชิ้น: original Portuguese azulejo craft, saturated cobalt/teal/ochre/coral palette, glazed ceramic, fine glaze variation, upper-left light, orthographic top-down, no text/numbers/logos/watermarks. ชิ้นซ้อนต้อง transparent exterior; ไม่ generate cast shadow หรือ side faces เพราะ CSS ควบคุมเอง.

- Blue: isolated square cobalt ceramic tile, pale-blue four-point lozenge motif, tiny warm-white glaze highlights, consistent square silhouette.
- Yellow: อ้าง blue เพื่อคงวัสดุ/แสง; yellow glaze, orange rosette. Refinement: replace pointed lozenges with round orange-red eight-petal scalloped pinwheel, cobalt dots, no long diamonds/spears, preserve alpha.
- Red: อ้าง blue, vermilion glaze with low-contrast orange concentric diamond motif.
- Black: อ้าง blue, midnight glaze and turquoise arabesque. Refinement: remove long diamond/spear; four curvilinear C-curls around cream square and corner tendrils, no pointed petals/star, preserve alpha.
- White: อ้าง blue, warm-white glaze with bold teal eight-point star.
- Board: opaque ivory paper square, subtle parchment grain, narrow original cobalt/teal floral border in outer 12%, ochre pinstripe, central 76% blank, no grid or game pieces.
- Factory: isolated transparent circular cardboard disc, plain ivory center, cobalt/teal floral outer 18% rim, thin ochre outline, no tiles/text.
- Marker: isolated ivory square token, engraved blue compass rosette and ochre ring, no numeral (DOM overlays 1).
- Cover: portrait 2:3 mosaic of five tile motifs, blank central ivory cartouche approximately 35%, original ceramic craft, no copied logo or embedded title.

## เตรียมไฟล์และโหลด

`node scripts/prepare-azul-art.mjs` ใช้ sharp ที่มีอยู่แล้ว: trim alpha, resize, WebP quality 86/alpha 100, manifest และ contact sheet `/tmp/azul-art-contact.png`. Runtime ไม่เรียก image generation หรือ external hotlink.

`src/client/azul-assets.ts` เป็น mapping เดียวและ preload critical 8 ภาพเมื่อเข้าหน้าเล่น Azul. ปกโหลดผ่าน portal. ภาพเสียไม่ขวางเกม: สี/ตัวอักษรสำรองพร้อมข้อความให้ reload; ไม่ใช้ fallback เป็นงานหลัก. ผลทดสอบ/screenshot อยู่ `docs/progress.md`.
