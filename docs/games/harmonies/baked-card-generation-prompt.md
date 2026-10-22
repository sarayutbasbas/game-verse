# Prompt — Harmonies baked card artwork (Batch 1)

คุณกำลังปรับระบบการ์ด Harmonies ในโปรเจกต์ GameVerse ที่:

`/Users/basukekung/Projects/games`

ให้ดำเนินงานจริงจนได้ภาพตัวอย่างและเชื่อมต่อในเกม โดยอ่านไฟล์ต่อไปนี้ก่อน:

- `AGENTS.md`
- `README.md`
- `docs/games/harmonies/rules.md`
- `docs/games/harmonies/design.md`
- `docs/games/harmonies/reference-redesign/plan.md`
- `src/games/harmonies/catalog.json`
- `src/games/harmonies/spirits.json`
- `src/games/harmonies/promos.json`
- `src/games/harmonies/whispers.json`
- `src/client/harmonies-presentation.ts`
- `src/client/harmonies-card-palette.json`
- `src/client/harmonies.css`

ใช้ทักษะ `frontend-design`, `board-game-engine` และ `imagegen`

ภาพอ้างอิงหลัก:

`/Users/basukekung/Downloads/Harmonies-Board-Game-Review-Card-Examples.png`

เป้าหมายคือเปลี่ยนระบบการ์ดให้ใช้ **ภาพการ์ดสำเร็จทั้งใบ (baked artwork)** โดยสัตว์ ฉาก ขอบการ์ด แถบด้านขวา Hex base, Terrain token, Crystal Cube, ตัวคูณความสูง และคะแนนถูกวาดรวมอยู่ในภาพเดียว ไม่ประกอบส่วนเหล่านี้ทับกันใน Runtime อีก

ให้ทำเฉพาะ 5 ใบนี้ก่อน:

1. `spirit-11` — ทีเร็กซ์
2. `animal-22` — ค้างคาว
3. `animal-01` — จระเข้
4. `whisper-05` — เห็ดริมน้ำ
5. `spirit-09` — แมลงปอสายน้ำ

## ขนาดและอัตราส่วน

การ์ดทุกใบเป็นแนวตั้ง อัตราส่วน **ความสูง:ความกว้าง = 430:300** หรือเท่ากับการ export แบบ **กว้าง×สูง = 300×430** ห้ามสร้างเป็นการ์ดแนวนอน 430×300

การ์ดแต่ละใบต้องมีภาพสองขนาดเป็นคู่:

### Large สำหรับ Popup

- Master/output แนะนำ: `900×1290 px`
- อัตราส่วนเท่ากับ `300×430`
- ความละเอียดระดับกลางถึงสูงพอประมาณ ไม่ต้องเป็น 4K
- WebP quality เป้าหมายประมาณ 82–88 โดยปรับตามรายละเอียดจริง
- ต้องอ่านสัตว์ Token, Crystal Cube และคะแนนได้ชัดเมื่อเปิด Popup
- ชื่อไฟล์: `<card-id>.webp`

### Small สำหรับตลาดสัตว์และ “สัตว์ของคุณ”

- Output: `300×430 px`
- อัตราส่วนเดียวกับ Large
- ไม่ต้องใช้ความละเอียดสูงมาก เพื่อลดขนาดไฟล์และประหยัดเครือข่าย
- WebP quality เป้าหมายประมาณ 68–76 โดยตรวจไม่ให้ตัวเลขและ `×2`/`×3` แตกจนอ่านไม่ได้
- ชื่อไฟล์: `<card-id>-small.webp`

อย่าย่อ Large ลงเป็น Small ตรง ๆ ให้สร้าง Small composition แยก แต่ต้องเป็นสัตว์ ฉาก สี และการ์ดใบเดียวกัน

## รูปแบบไฟล์

สร้าง path ใหม่โดยไม่ overwrite งานเดิม:

```text
assets/source/harmonies/baked-cards-v1/
public/art/harmonies/baked-cards-v1/
```

ตัวอย่างไฟล์:

```text
spirit-11.webp
spirit-11-small.webp
animal-22.webp
animal-22-small.webp
animal-01.webp
animal-01-small.webp
whisper-05.webp
whisper-05-small.webp
spirit-09.webp
spirit-09-small.webp
```

ภาพ Runtime ต้องเป็นไฟล์ภาพสำเร็จหนึ่งไฟล์ต่อการ์ดต่อขนาด ห้าม Render สิ่งเหล่านี้ทับบนภาพ:

- Habitat diagram
- Hex base
- Terrain token
- Crystal Cube
- ตัวคูณ `×2`/`×3`
- Score track
- Score number
- Side rail
- ชื่อสัตว์ภายในภาพ

อนุญาตให้มี accessible text แบบ `sr-only`, ปุ่มกด และ hit area อยู่ภายนอก visual image ได้

## ทิศทางงานภาพ

อิงอารมณ์จากภาพการ์ด Reference:

- ภาพวาดการ์ตูนแนว storybook
- มี texture แบบกระดาษและงานพิมพ์
- สีสดและมี contrast ชัด
- ไม่สมจริงแบบภาพถ่าย
- ไม่จริงจังแบบสารคดีสัตว์
- สัตว์มีบุคลิกสนุก ขี้เล่น หรือมีท่าทางเล่าเรื่อง
- สัตว์แต่ละใบมีขนาดแตกต่างกันได้
- บางใบเป็น close-up
- บางใบเป็น medium shot
- บางใบเป็นสัตว์ตัวเล็กในฉากขนาดใหญ่
- ทุกใบต้องยังดูเป็นการ์ดจากเกมชุดเดียวกัน

สัตว์หลักทุกตัวต้องมีเส้นขอบรอบ silhouette ตามภาพ Reference:

- ใช้ขอบสีงาช้างหรือครีมอ่อน
- ด้านในมีเส้นเข้มบาง ๆ ได้
- เพิ่มเงา offset เล็กน้อยให้คล้ายชิ้นภาพตัดกระดาษ
- ห้ามใช้ glow ฟุ้ง
- ห้ามทำเป็นกรอบสี่เหลี่ยมรอบสัตว์
- เส้นขอบต้องยังมองเห็นเมื่อย่อเป็น Small card

ภาพต้องเต็มขอบการ์ด:

- ไม่มีขอบสีขาว
- ไม่มีพื้นขาวตามมุม
- มุมมนครบทั้ง 4 มุม
- พื้นที่นอกมุมมนเป็น alpha transparency จริง
- ขวาบนและขวาล่างต้องมนเหมือนด้านซ้าย
- Side rail ต้องถูกตัดตามมุมมนด้วย

## การสร้าง Large และ Small เป็นคู่

สร้างทีละใบตามลำดับที่กำหนด

ขั้นตอนต่อใบ:

1. อ่านข้อมูลจริงจาก Catalog
2. สร้าง Control Layout สำหรับ Large
3. สร้าง Control Layout สำหรับ Small
4. Render Pattern, Token, Crystal Cube, ตัวคูณ และคะแนนลงใน Control Layout
5. ใช้ Control Layout และภาพ Reference เป็น input ให้ ImageGen
6. Generate Large
7. ตรวจ Large เทียบกับ Catalog
8. ใช้ Large และ Small Control Layout เป็น Reference เพื่อ Generate Small
9. ตรวจว่า Large และ Small เป็นการ์ดใบเดียวกัน
10. หากข้อมูลผิดแม้แต่หนึ่งจุด ให้แก้หรือ Generate ใหม่
11. ไปใบถัดไปเมื่อคู่ปัจจุบันผ่านแล้วเท่านั้น

Control Layout เป็นไฟล์ชั่วคราวสำหรับควบคุม ImageGen ไม่ใช่ Runtime asset

## ความถูกต้องของ Habitat

แม้ภาพสุดท้ายจะ Generate รวมทั้งใบ ห้ามให้ ImageGen เดาตำแหน่ง Habitat จากข้อความอย่างเดียว

ใช้ข้อมูลเหล่านี้จาก Catalog:

- `q`
- `r`
- `stack`
- `cube`
- `points`
- `kind`
- `spiritScoring`

ใช้ Projection เดียวกับกระดาน:

```ts
x = q * 49;
y = (r + q / 2) * 56;
```

ห้าม:

- สลับ `q/r`
- Mirror Pattern
- เปลี่ยน Stack Order
- เปลี่ยน Stack Height
- ย้าย Cube Destination
- เพิ่มหรือลด Hex Base
- บีบแกน X หรือ Y
- จัดตำแหน่งด้วยสายตา
- ใช้ `nth-child` กำหนดตำแหน่งเฉพาะใบ
- ปรับฐานทีละอันเพื่อให้ภาพดูสวย

Control Layout ต้องใช้ Uniform Scale ทั้งกลุ่ม

## รูปทรง Hex Base และ Token

อิงขนาดและมิติจากภาพ Reference การ์ด 5 ใบ

Hex Base:

- เป็น Flat-top Hexagon
- ด้านบนและล่างเป็นเส้นแนวนอน
- ปลายแหลมอยู่ซ้ายและขวา
- ฐานติดกันตาม Axial Geometry จริง
- ไม่ห่างและไม่ซ้อนผิดตำแหน่ง
- เป็นสีงาช้างหรือกระดาษแข็งอ่อน

Terrain Token:

- ใช้รูปลักษณ์เดียวกับโทเคนที่วางบนกระดานในเกม
- ตรวจ Asset และ Renderer ปัจจุบันก่อน Generate
- สี ลายบนฝา ความหนา Texture และมุมกล้องต้องตรงกับกระดาน
- ห้ามสร้าง Token Style ใหม่เฉพาะการ์ด
- Token ต้อง Opaque
- ไม่ลด Opacity
- ไม่ใช้ Blend Mode
- Token ต้องเล็กกว่า Hex Base
- ต้องเห็นขอบฐานรอบ Token
- Token กว้างประมาณ 78–82% ของฐาน
- ผนังด้านข้างหนาประมาณ 28–36% ของเส้นผ่านศูนย์กลาง
- Stack สองหรือสามชั้นต้องเห็นชั้นล่างชัดเจน
- สีเดียวกันซ้อนกันต้องมีเส้นแบ่งชั้น
- เงาอยู่ใต้ฐานหรือชิ้นล่างสุดเท่านั้น
- ห้ามมีเงาสีตาม Terrain ซ้อนกันหลายชั้น

สัดส่วนโดยประมาณใน Control Layout:

```text
Hex base width:       66
Hex base height:      56
Token cap diameter:   50–54
Token side depth:     15–19
Crystal Cube width:   23–27
Crystal Cube height:  24–30
```

Hex Base, Token และ Cube ใน Cell เดียวกันต้องใช้ Center เดียวกัน

Cube ต้องวางบนผิวของ Top Token ไม่ลอย ไม่จม และไม่เลื่อนไปทางข้าง

## ตัวคูณความสูงบน Small Card

Small Card ต้องแสดงตัวคูณเมื่อ Stack มีมากกว่าหนึ่งชั้น เพื่อให้ผู้เล่นวางแผนจากจอเล็กได้โดยไม่ต้องเปิด Popup

กติกา:

- `stack.length === 1` ไม่แสดงตัวคูณ
- `stack.length === 2` แสดง `×2`
- `stack.length === 3` แสดง `×3`
- นับเฉพาะ Terrain Token ใน `stack`
- ไม่นับ Crystal Cube เป็นอีกหนึ่งชั้น
- ตัวคูณต้องถูก Bake ลงใน Small Card
- Large Card ไม่จำเป็นต้องแสดงตัวคูณ ถ้าความสูงของชั้นมองเห็นชัดอยู่แล้ว
- ใช้ Font หนา อ่านง่าย และเข้ากับตัวเลขคะแนน
- วางบริเวณขวาล่างของ Stack นั้น
- ขยับออกจากฝา Token เล็กน้อย
- ห้ามบังลายบนฝา Token
- ห้ามบัง Crystal Cube
- ห้ามทับตัวคูณของ Stack ข้างเคียง
- ใช้สีงาช้างหรือสีอ่อน พร้อมเส้นขอบเข้มบาง ๆ
- ห้ามใช้กล่องพื้นหลังขนาดใหญ่
- ขนาดต้องอ่านออกที่ภาพจริง 300×430 โดยไม่เด่นกว่าสัตว์หรือคะแนน
- ตรวจที่ Browser Scale 100% และบนมือถือจริงหรือ Viewport ขนาดใกล้เคียง

ตัวคูณที่ต้องปรากฏใน Batch 1:

| Card | Stack | ตัวคูณบน Small Card |
|---|---|---|
| `spirit-11` | `rock → rock → rock` | `×3` |
| `spirit-11` | `wood → wood → leaf` | `×3` |
| `animal-22` | `wood → wood → leaf` | `×3` |
| `animal-01` | `wood → wood → leaf` | `×3` |
| `whisper-05` | `wood → leaf` | `×2` |
| `spirit-09` | `wood → leaf` จุดแรก | `×2` |
| `spirit-09` | `wood → leaf` จุดที่สอง | `×2` |

ห้ามแสดง `×2` หรือ `×3` บน Token ชั้นเดียว เช่น Water, Rock ชั้นเดียว หรือ Field ชั้นเดียว

## Crystal Cube ทั้ง 4 ประเภท

ออกแบบ Crystal Cube ใหม่ให้เข้ากับภาพการ์ตูนที่สนุกและไม่จริงจัง

Cube ทั้ง 4 แบบต้อง:

- มี Silhouette และขนาดเท่ากัน
- ใช้ Perspective เดียวกัน
- เป็นก้อนคริสตัลทรงลูกบาศก์แบบอ้วนเล็กน้อย
- มี Facet ชัดเจน
- โปร่งใสแบบคริสตัล
- ยังอ่านออกเมื่ออยู่ในการ์ด Small
- ไม่สมจริงแบบอัญมณีถ่ายภาพ
- ไม่ใช้ Neon Glow
- ไม่ใส่รูปสัตว์ไว้ข้างใน
- ไม่ใหญ่เกือบเท่า Terrain Token

### 1. สัตว์ธรรมดา — Gold Crystal

ใช้กับ:

```ts
kind === undefined || kind === 'normal'
```

ลักษณะ:

- คริสตัลสีทองหรืออำพัน
- โปร่งใส
- มี Highlight บน Facet
- ไม่มีประกายดาวลอยรอบ Cube
- ดูอบอุ่นและเป็นมิตร

ชื่อชนิด: `animal-gold`

### 2. เสียงกระซิบ — Purple Crystal

ใช้กับ:

```ts
kind === 'whisper'
```

ลักษณะ:

- คริสตัลสีม่วง
- โทนอเมทิสต์
- โปร่งใส
- มี Facet ชัด
- ไม่มีประกายดาวแบบสัตว์วิเศษ
- มีแสงภายในอ่อน ๆ ได้
- ต้องเข้ากับ Theme กลางคืน ผลึก และคลื่นเสียงของ Crescendo

ชื่อชนิด: `whisper-purple`

### 3. สัตว์วิเศษ — Rainbow Crystal พร้อมประกาย

ใช้กับ:

```ts
kind === 'spirit' && id !== 'spirit-11'
```

ลักษณะ:

- คริสตัลสีรุ้งแบบ Iridescent
- มีสีฟ้า ม่วง ชมพู เขียว และทองสะท้อนอยู่บน Facet
- โปร่งใส
- มีประกายดาวสีขาวเล็ก ๆ 2–3 จุด
- ประกายเป็น Static Artwork
- ไม่ใช้ Animation Loop
- ไม่ใช้ Glow ฟุ้งขนาดใหญ่
- ดูวิเศษแต่ยังอยู่ใน Theme การ์ตูนธรรมชาติ

ชื่อชนิด: `spirit-rainbow`

### 4. ไดโนเสาร์ — White Crystal พร้อมประกาย

ใช้กับ:

```ts
id === 'spirit-11'
```

ต้องตรวจ ID ก่อนตรวจ `kind` เพราะ T-Rex อยู่ในกลุ่ม Spirit แต่ต้องใช้ Cube คนละแบบ

ลักษณะ:

- คริสตัลสีขาวใสหรือ Opal
- มีสีรุ้งอ่อนสะท้อนบนขอบบางจุด
- มี Facet ชัด
- มีประกายดาวสีขาว 2–3 จุด
- ประกายเป็น Static Artwork
- ไม่ใช้ Glow ฟุ้ง
- ต้องมองต่างจาก Rainbow Crystal ของสัตว์วิเศษได้ทันที

ชื่อชนิด: `dinosaur-white`

ใช้ Resolver นี้เป็นหลัก:

```ts
function crystalKind(card) {
  if (card.id === 'spirit-11') return 'dinosaur-white';
  if (card.kind === 'whisper') return 'whisper-purple';
  if (card.kind === 'spirit') return 'spirit-rainbow';
  return 'animal-gold';
}
```

แม้ Cube จะถูก Bake ลงในการ์ด แต่ใช้ Crystal Design เดียวกันกับ Marker ที่แสดงบนกระดาน

อนุญาตให้สร้าง Board Marker Asset สำหรับ Cube ทั้ง 4 ประเภทเพื่อใช้บนกระดานได้ แต่ห้ามนำ Asset ดังกล่าวมาวางทับการ์ดตอน Runtime การ์ดต้องยังเป็นภาพสำเร็จหนึ่งไฟล์

## Bottom Shadow และพื้นที่ Token

ภาพสัตว์ต้องมีพื้นที่ด้านล่างที่รายละเอียดน้อยกว่าส่วนกลาง เพื่อให้ Habitat อ่านง่าย

เพิ่มเงาหรือ Gradient จากด้านล่างขึ้นมา:

- เริ่มเข้มจากขอบล่าง
- ค่อย ๆ จางขึ้น
- ไล่สูงประมาณ 25–35% ของภาพ
- ใช้สีเข้มที่สัมพันธ์กับฉาก
- ห้ามใช้ดำสนิท
- ห้ามเห็นเป็นกล่องหรือแถบแข็ง
- ต้องรู้สึกเป็นเงาจากใบไม้ พื้นดิน น้ำ หรือ Foreground ของฉาก

Hex Base ทุกอันมี Contact Shadow อ่อน ๆ:

- เงาอยู่ใต้ฐาน
- ไม่ใช้เงาตามสี Terrain
- ไม่เพิ่มเงาแยกทุกชั้น
- ไม่ทำให้ Token ดูลอย

## Side Rail ด้านขวา

Side Rail ถูกวาดรวมอยู่ในภาพการ์ด:

- เต็มความสูงของการ์ด
- ชิดขอบขวา
- มี Gradient
- มี Texture แบบงานพิมพ์
- มีลวดลายจาก Terrain สำคัญใน Habitat
- อยู่ใต้คะแนน
- ไม่เป็นแถบสีเรียบ
- มุมขวาบนและขวาล่างมน
- ไม่มีขอบสีขาว

Terrain Motif:

- Water: เส้นคลื่น
- Rock: ชั้นหินหรือยอดเขา
- Wood: วงปีหรือกิ่งไม้
- Leaf: ใบไม้
- Field: ดอกไม้หรือกลีบดอก
- Building: บ้านหรือหลังคา

การ์ดพิเศษใช้ Side Rail ที่ต่างจากการ์ดปกติ:

- Spirit: พลังธรรมชาติและประกายรุ้ง
- Dinosaur: ฟอสซิล รอยเล็บ หิน หรืออำพัน
- Whisper: ผลึก คลื่นเสียง และสีม่วง

## คะแนน

คะแนนต้องถูกวาดรวมอยู่ในภาพสุดท้าย ห้าม Render ตัวเลขหรือ Score Track ทับใน Runtime

ข้อมูลคะแนนต้องมาจาก Catalog เท่านั้น:

- ตัวเลขต้องถูกต้อง
- ลำดับต้องถูกต้อง
- จำนวนช่องต้องถูกต้อง
- คะแนนสูงสุดอยู่ด้านบน
- คะแนนต่ำสุดอยู่ด้านล่าง
- ตัวเลขสองหลักต้องไม่ล้น
- Font ต้องอ่านง่าย
- Large และ Small ใช้ Font เดียวกัน
- ห้ามให้ ImageGen คิดคะแนนขึ้นเอง

ถ้า ImageGen ทำตัวเลขผิด บิด หรืออ่านไม่ออก ต้องแก้หรือ Generate ใหม่ ห้ามยอมรับภาพนั้น

การ์ดปกติ:

- ใช้พื้นสีเรียบตาม Card Palette
- ไม่มีกรอบทองหนา
- ไม่มีกรอบซ้อน
- ตัวเลขอยู่กลางพื้นที่สี
- มี Texture งานพิมพ์เล็กน้อย

การ์ดพิเศษ:

- Nature’s Spirits ใช้ลายพลังธรรมชาติและประกายรุ้ง
- T-Rex ใช้ลายฟอสซิลหรือรอยเล็บ
- Whisper ใช้ลายผลึกและคลื่นเสียง

ตำแหน่ง:

- Large: คะแนนอยู่ด้านขวาบน
- Small: คะแนนอยู่ด้านขวาล่างเหมือนตัวอย่างการ์ดเห็ด
- Small ต้องยังเรียงคะแนนสูงสุดไว้ด้านบนและต่ำสุดไว้ด้านล่าง

## การ์ดที่ต้องสร้าง

### 1. `spirit-11` — ทีเร็กซ์ · จิตวิญญาณดึกดำบรรพ์

Pattern:

```text
(-1,0): rock → rock → rock
( 0,0): field + Dinosaur White Crystal
( 1,0): wood → wood → leaf
```

Special Scoring:

```text
หลังวาง T-Rex ได้ 2 คะแนนต่อสัตว์ปกติ
ที่เชื่อมต่อถึง T-Rex ผ่านช่องที่มีสัตว์ต่อกัน
ไม่นับ T-Rex เอง
```

Visual:

- ป่าดึกดำบรรพ์
- เฟิร์นขนาดใหญ่
- หิน หมอก และแสงอบอุ่น
- T-Rex มีบุคลิกสนุก
- ไม่สมจริงแบบหนัง
- มีขอบสีอ่อนรอบตัว
- Side Rail ลายฟอสซิลหรือรอยเล็บ
- ใช้ White Crystal พร้อมประกาย
- Small แสดง `×3` ที่กองหินและ `×3` ที่กองต้นไม้

### 2. `animal-22` — ค้างคาว

Pattern:

```text
( 0,0): wood → wood → leaf
(-1,1): rock + Gold Crystal
```

คะแนนจากบนลงล่าง:

```text
15
10
6
3
```

Visual:

- ป่าหรือถ้ำกลางคืน
- มีสีสัน
- ค้างคาวมีบุคลิกขี้เล่น
- ไม่สยองขวัญ
- มีขอบสีอ่อนรอบตัว
- ใช้ Gold Crystal
- Small แสดง `×3` ที่กองต้นไม้

### 3. `animal-01` — จระเข้

Pattern:

```text
( 0,0): wood → wood → leaf
(-1,1): water
(-2,2): water + Gold Crystal
```

คะแนนจากบนลงล่าง:

```text
15
9
4
```

Visual:

- แม่น้ำหรือหนองน้ำ
- จระเข้มีบุคลิกสนุก
- ขนาดใหญ่หรือ Medium-large
- ไม่สมจริงแบบภาพถ่าย
- มีขอบสีอ่อนรอบตัว
- ใช้ Gold Crystal
- Small แสดง `×3` ที่กองต้นไม้

### 4. `whisper-05` — เห็ดริมน้ำ

Pattern:

```text
(0,0): wood → leaf + Purple Whisper Crystal
(1,0): water
```

Score Track:

```text
2/5
2/5
```

ความหมาย:

```text
Whisper Cube แต่ละชิ้นได้ 2 คะแนนเมื่ออยู่เดี่ยว
หรือ 5 คะแนนเมื่ออยู่ร่วมช่องกับสัตว์หรือจิตวิญญาณ
มีทั้งหมด 2 ชิ้น
```

Visual:

- เห็ดขนาดใหญ่ริมแม่น้ำกลางคืน
- สีม่วง น้ำเงิน และชมพู
- แสงจันทร์สะท้อนน้ำ
- ลายผลึกและคลื่นเสียง
- ใช้ Purple Crystal
- ห้ามใช้ Gold Crystal
- คะแนน Small อยู่ด้านขวาล่าง
- Small แสดง `×2` ที่กอง `wood → leaf`

### 5. `spirit-09` — แมลงปอสายน้ำ

Pattern:

```text
( 0,0): wood → leaf
(-1,1): water + Rainbow Spirit Crystal
(-2,2): wood → leaf
```

Special Scoring:

```text
กลุ่มน้ำที่มีตั้งแต่ 2 ช่องขึ้นไป
ได้กลุ่มละ 7 คะแนน
```

Visual:

- ป่าริมน้ำ
- น้ำตกหรือสายน้ำ
- แมลงปอเป็นสัตว์วิเศษ
- ปีกโปร่งใส
- มีขอบสีอ่อนรอบตัว
- มีประกายธรรมชาติเล็กน้อย
- Side Rail เป็นลายพลังน้ำและธรรมชาติ
- ใช้ Rainbow Crystal พร้อมประกาย
- ห้ามใช้ Purple Crystal ของ Whisper
- Small แสดง `×2` ที่กอง `wood → leaf` ทั้งสองกอง

## Safe Area

Large:

- Habitat อยู่ช่วงล่าง
- เว้นขอบล่าง 5–7%
- ไม่แตะ Side Rail
- ไม่บังสัตว์หลัก
- คะแนนอยู่ขวาบน
- ไม่มี Token หรือประกายถูก Crop

Small:

- Habitat อยู่ล่างซ้ายหรือล่างกลาง
- คะแนนอยู่ขวาล่าง
- Habitat และคะแนนไม่ทับกัน
- ตัวคูณไม่ทับคะแนน
- เว้นขอบล่าง 4–6%
- Cube มองเห็นชัด
- Token ไม่ชิดขอบ
- มุมมนครบทั้ง 4 มุม
- ไม่มีองค์ประกอบใดถูกตัด

ทุก Source Image ต้องมี Alpha Padding เพียงพอระหว่างขั้นตอน Generate:

- ซ้าย/ขวา 10–14%
- ด้านบน 12–16%
- ด้านล่าง 10–14%

## Runtime Integration

เมื่อใช้ Baked Card:

- ใช้ `<img>` เดียวสำหรับภาพการ์ด
- ไม่ Render `habitatDiagram()` ทับ
- ไม่ Render Terrain Token ทับ
- ไม่ Render Crystal Cube ทับ
- ไม่ Render `×2`/`×3` ทับ
- ไม่ Render Score Track ทับ
- ไม่ Render Side Rail ทับ
- ไม่ใส่ CSS Shadow สี Terrain
- ไม่ใส่ CSS Tint บน Token
- ไม่ใช้ Blend Mode กับภาพ
- ใช้ `object-fit: contain`
- ใช้ภาพ Large เฉพาะ Popup
- ใช้ภาพ Small ในตลาดและสัตว์ของคุณ
- การ์ดอื่นที่ยังไม่ได้ทำใช้ระบบเดิมเป็น Fallback

## การตรวจรับ

สร้าง Contact Sheet ที่แสดง Large และ Small คู่กันสำหรับทั้ง 5 ใบ

ตรวจทุกใบว่า:

- Large และ Small เป็นการ์ดใบเดียวกัน
- อัตราส่วนความสูง:ความกว้างเท่ากับ 430:300
- สัตว์และฉากตรงกัน
- Pattern ตรง Catalog
- จำนวนฐานถูกต้อง
- Stack ถูกต้อง
- Cube อยู่ช่องถูกต้อง
- สี Cube ถูกต้องตามประเภท
- Normal = Gold
- Whisper = Purple
- Spirit = Rainbow พร้อมประกาย
- Dinosaur = White พร้อมประกาย
- Terrain Token เหมือนบนกระดาน
- คะแนนถูกต้อง
- Score Position ถูกต้องตามขนาด
- Small แสดง `×2`/`×3` ครบเฉพาะ Stack ที่มีหลายชั้น
- ตัวคูณอ่านออกที่ 300×430
- ตัวคูณไม่บัง Token, Cube หรือคะแนน
- Side Rail มี Gradient และ Motif
- มุมมนครบ
- ไม่มี Token ถูกตัด
- ไม่มี Cube ถูกตัด
- ไม่มีตัวเลขผิด
- ไม่มีข้อมูลกติกาที่ ImageGen แต่งขึ้นเอง
- ขนาดไฟล์ Small เหมาะกับการโหลดหลายใบพร้อมกัน

สร้างภาพตรวจจริง:

1. Contact Sheet ทั้ง 5 คู่
2. Large Popup ทั้ง 5 ใบ
3. Small Card ทั้ง 5 ใบที่ขนาดจริง 300×430
4. ตลาดสัตว์
5. สัตว์ของคุณ
6. Popup
7. Crystal Cube ทั้ง 4 แบบบนกระดาน
8. Pattern ที่มี Stack 3 ชั้น
9. Small Card ที่คะแนนอยู่ล่างขวา
10. Small Card ที่แสดง `×2` และ `×3`
11. การ์ดที่มุมขวามนครบ

หลังทำเสร็จ:

- รัน Test ที่เกี่ยวข้อง
- รัน `npm run docker:rebuild`
- ตรวจที่ `http://localhost:5555`
- สรุปไฟล์ใหม่และไฟล์ที่แก้
- แสดงภาพตรวจรับ
- หยุดให้ฉันตรวจ
- ห้ามสร้างการ์ดใบอื่นต่อ
- ห้าม Commit
- ห้าม Push
- ห้าม Deploy Vercel
