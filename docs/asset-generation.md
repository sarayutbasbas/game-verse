# Artwork ที่สร้างและใช้งานจริง

สร้างด้วย built-in `image_gen` (ไม่ใช้ CLI/API key) วันที่ 2026-10-14. ภาพอ้างอิงจากผู้ใช้ยังไม่ได้แนบให้เข้าถึงได้ จึงยังไม่อ้างว่า layout ตรง reference. Artwork เป็นภาพใหม่ทั้งหมด ไม่ใช้ภาพกล่องเกมมาเป็นพื้นหลัง

## ไฟล์และ atlas

- `assets/source/camels.png`: original 3×3 atlas; `camels-padded.png`: final gutter edit. Runtime `public/art/camels.webp`
- `assets/source/objects.png`: original 3×2 atlas; `objects-padded.png`, `objects-final.png`: gutter/blank die edits. Runtime `public/art/objects.webp`
- `assets/source/avatars.png`: 4×2 portrait atlas. Runtime `public/art/avatars.webp`
- `assets/source/table.png`: walnut texture. Runtime `public/art/table.webp`
- `public/art/board.svg`: authored vector board base (sand grain, cloth mosaic, carved wood edge); track cells/pieces อยู่ใน renderer ต่างหาก

อูฐ atlas row-major: blue, green, yellow, purple, red, black, white, palm, pyramid. Props: coins, blank-faced die, cheer tile, boo tile, card front, finish-card back. ตัวละคร 8 portraits ใช้ระบุตัวเท่านั้น ไม่มี abilities

`src/client/assets.ts` เก็บ atlas indices และ preload. ค่าสีและสัญลักษณ์แยกอูฐด้วย code. พื้นหลังโปร่งใสของ camels/objects/avatars มี alpha channel จริง. แปลง format ด้วย transient sharp-cli (ไม่ได้เพิ่ม dependency runtime) เป็น WebP quality 86; table quality 80. คงต้นฉบับ PNG ไว้เพื่อแก้ artwork ต่อ. ไม่มีข้อความไทยหรือ reward ฝังใน bitmap; รูปลูกเต๋าลบ pips แล้วให้ code render ผลจริง 1–3

## Prompt set ที่ใช้

### Camels generation

Production game sprite atlas PNG, actual transparent background. Exactly 3 by 3 uniform square grid cells centered with generous empty gutters. Row-major: blue camel, green camel, yellow camel, purple camel, red camel, black camel, white camel, palm tree, pyramid. All seven camels same full-body side profile facing RIGHT, unmistakable single-hump dromedary carved wooden meeple with long curved neck, ears, four legs, tail, geometric saddle, stable flat base. Original refined hand-painted gouache board-game art, deep navy outlines, golden highlights and tactile grain. Each piece fills 75% of cell, isolated. Palm with lush fronds; golden stone pyramid three-quarter overhead. No text, digits, letters, logos, watermark, board or checkerboard. Real alpha transparency. Intended for CSS sprite atlas rendering.

### Objects generation

Production game prop atlas PNG with actual transparent background. Exactly 3 columns by 2 rows uniform square grid, centered objects occupying 75% each cell, generous gutters. Row-major: golden Egyptian coin stack, ivory carved die with engraved dark pips, teal cheering spectator tile with sun emblem, magenta booing spectator tile with crescent emblem, front of camel betting card with ornate golden tent border and broad blank areas for code-rendered title and reward, indigo geometric mosaic finish-card back with pyramid emblem. Refined hand-painted gouache wooden board-game art, navy outlines, golden highlights, tactile material. No text, digits, letters, watermark, logo or checkerboard. Complete isolated objects.

### Avatars generation

Production character portrait atlas PNG, actual transparent background. Exactly 4 columns by 2 rows uniform grid. Eight different friendly fictional adult desert merchants and explorers, diverse ages genders skin tones. Waist-up portraits with expressive faces and distinct geometric robes, scarves and hairstyles in oval carved-wood frames. Same refined hand-painted gouache, fine navy outlines, golden highlights, tactile board-game art. Golden sand, deep indigo, teal and wine accents. Distinct recognizable silhouettes. Uniform size, transparent gutters, no overlapping cells, no letters text digits powers icons logos watermark or checkerboard.

### Table generation

Square overhead dark walnut tabletop painted texture, full bleed, low contrast warm chocolate wood, subtle refined tactile gouache grain, soft even lighting. Background for a digital board game, no objects, no board, no borders, no text, no logo, no harsh highlights.

### Gutter edits (camels และ objects)

Edit this existing [camels/objects] sprite atlas. Preserve each original painted object, colors, identities, exact order and [3 by 3 / 3 by 2] grid. Reduce each individual object uniformly to 65 percent of its current size within its own cell, then precisely center inside that cell. Every cell must have a generous fully transparent gutter on all four edges, no object or shadow crossing a cell boundary. Remove ALL backdrop or hazy colored background between objects. Genuine alpha transparency. Keep original original hand-painted style and details. Do not add or remove objects. No new text. Output same atlas aspect ratio.

### Blank die edit

Edit ONLY the die in the top-middle grid cell of this atlas. Remove all engraved pips and replace them with clean blank ivory wooden faces, preserving the die shape, perspective, shadows and original painted texture. This game uses face values 1 to 3 rendered by code; there must be no baked-in pips or values. Preserve all other five objects, exact order, 3 columns by 2 rows grid and generous padding. Remove any hazy tinted backdrop in the gutters, keeping genuine alpha transparency between all six objects. No text, numbers, watermarks. Output same aspect ratio.
