# GameVerse — เว็บบอร์ดเกมจอกลาง + มือถือ

มี portal ให้เลือก **Camel Up Second Edition (3–8 คน)**, **Dracula vs Van Helsing, Mandoo 2023 (2 คน)** และ **Azul ภาคหลัก ผนังสีมาตรฐาน (2–4 คน)**. Camel Up ใช้ฉบับ 2018 / คู่มือพิมพ์ใหม่ 2024. UI ไทย, QR/รหัสห้อง, มือถือส่วนตัว, server ตัดสินกติกาและสุ่ม, reconnect ด้วย session เดิม. คนสร้างห้องเข้ามาเล่นด้วยมือถืออีกเครื่องได้

## ติดตั้งและรัน

ต้องมี Node.js 24.18+ และ npm. จาก project root:

```sh
npm ci
npm run setup:env
# ใส่ Google credentials ใน .env แล้ว
npm run dev
```

ก่อนสร้างห้องใหม่ ตั้ง Google OAuth ตาม [docs/auth/google-oauth.md](docs/auth/google-oauth.md), รัน `npm run setup:env` เพื่อสร้าง private `.env` จาก `.env.example` แล้วใส่ `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_URL` และ secret ถาวร (setup script สร้างให้โดยไม่พิมพ์ค่าออก log; ถ้ามี development secret ใน DB จะใช้ค่าเดิม). ห้ามส่ง client secret ในแชตหรือใส่ใน client bundle. Development ที่ไม่ได้ตั้ง secret จะเก็บ secret สุ่มถาวรใน private DB; production ต้องตั้งเอง

เปิด `http://localhost:3000` บนคอม เลือก **ล็อกอิน Google** แล้วเลือกเกมและกด **สร้างห้องบนจอกลาง**. ผู้สร้างต้องล็อกอิน; เพื่อนเลือก Guest หรือ Google ได้. ถ้ายังไม่มี credentials ปุ่ม Google จะปิดและมีคำอธิบาย ไม่ใช่ mock login. ไม่มีบริการเสียเงินที่ต้องสมัครสำหรับ SQLite ถ้าจะใช้มือถือจริง:

1. ให้คอมและมือถืออยู่ใน Wi-Fi เดียวกัน
2. ดู LAN IP ของคอม (macOS: `ipconfig getifaddr en0`; เครื่องที่ใช้อินเทอร์เฟซอื่นดูใน Network Settings)
3. เพิ่ม origin ของ LAN เช่น `http://192.168.1.10:3000` ใน `GAMEVERSE_TRUSTED_ORIGINS` และ `GAMEVERSE_JOIN_ORIGIN` ของ `.env` (ใช้ IP จริงจากข้อ 2) แล้ว restart. เจ้าของห้องเปิดคอมผ่าน `http://localhost:3000` เพื่อใช้ Google; QR จะส่งมือถือไป LAN IP ตามที่ตั้งไว้. iPad/จอกลางอีกเครื่องเปิด `http://<LAN-IP>:3000/display/<รหัส>` เพื่อดู public board ได้โดยไม่ล็อกอิน; ผู้สร้างยังเริ่มเกมได้จาก tab เจ้าของห้อง
4. สแกน QR หรือเปิดที่อยู่เดียวกันบนมือถือ กรอกรหัสห้องและชื่อ; ถ้ายังไม่ล็อกอิน แอปจะสร้าง Guest session ปลอดภัยก่อน join. Google บนมือถือใช้ HTTPS domain ที่เข้าถึง server ได้และลงทะเบียน callback แล้ว ไม่ใช้ localhost ของมือถือ/private IP เป็น callback
5. Camel Up: ผู้เล่นอย่างน้อย 3 คน เลือกผู้เริ่มที่จอกลาง. Dracula: ผู้เล่น 2 คน เลือกบทบาท Dracula / Van Helsing คนละตัวจากมือถือ และทั้งคู่กด **พร้อมเล่น**
6. ผู้สร้างห้องกด **เริ่มเกม** บนจอกลาง (Dracula เริ่มก่อนเสมอ)

server ฟังที่ `0.0.0.0:3000`; ตั้ง `PORT=3001 npm run dev` หากต้องการเปลี่ยน port. ต้องอนุญาต firewall ของเครื่องให้เข้าถึง port นี้. QR มีเฉพาะลิงก์ห้องสาธารณะ ไม่มี token

## เล่นและกลับเข้าห้อง

จอกลางแสดงกระดาน เงิน บัตรรอบย่อย ลำดับตา และผล; มือถือเลือกการกระทำและดูการ์ดของตนเอง. เมื่อมีพันธมิตร เกมรอผู้เล่นแต่ละคู่เลือกคัดลอกหนึ่งบัตรหรือไม่คัดลอกตอนจบรอบย่อย

ถ้าหลุด แอปเชื่อมใหม่และ sync อัตโนมัติ. โหลดหน้าลิงก์ `/play/<รหัส>` เดิมบน **browser/เครื่องเดิม** ก็กลับผู้เล่นเดิมได้. Host ใช้ `/display/<รหัส>` และ session แยกจาก player. Room capability เก็บใน localStorage เดิม และบัญชี/Guest session ใช้ HttpOnly cookie ไม่อยู่ใน URL หรือ QR. อย่าล้างข้อมูล Guest ระหว่างเกม. บัญชี Google ที่เป็นสมาชิกกลับจากเครื่องอื่นด้วย cookie ของบัญชีเดิมได้โดยไม่สร้างที่นั่งซ้ำ; shared display เปิด URL เดิมดู public board ได้โดยไม่ล็อกอิน

## ทดสอบ

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

- `npm test`: กติกาทั้งสามเกม, seeded complete games, actual WebSocket integration (พอร์ตสุ่ม), บทบาท/ความพร้อม/ห้องเต็ม/การ์ดลับ/atomic reveal และ retries/reconnect
- `npm run build`: typecheck, client bundle, server JS
- `npm run test:e2e`: build แล้วเปิด production server port 3000; Chromium จอกลาง + มือถือ 3 browser contexts, เล่นจบเกม, หลุดกลับ, ทดสอบคำตอบคำสั่งหายแล้ว retry, payload privacy, animation unit/tile, duplicate/gap/resync, reduced motion และ viewport desktop/iPad/phone. หากมีห้องกำลังเล่นบน 3000 ใช้ `PLAYWRIGHT_PORT=3001 npm run test:e2e` เพื่อรักษาห้องเดิม
- ภาพที่ทดสอบสร้างไว้ใน `test-results/` (ไม่ commit). ดูรายละเอียดผลที่รันจริงใน [docs/progress.md](docs/progress.md)

## รัน production และแนวทาง deploy

```sh
npm run build
npm start
```

`npm start` ใช้ server JS ที่ compile แล้วและ `dist/`; ไม่ต้องมี Vite ระหว่างรัน. `/health` ใช้ตรวจ process. มี Dockerfile สำหรับ single process:

```sh
docker build -t games .
docker run --rm -p 3000:3000 --env-file .env -v gameverse-data:/app/data games
```

Dockerfile ตรวจ build สำเร็จแล้ว; runtime deployment ครั้งนี้ใช้ Vercel ตามรายละเอียดด้านล่าง. เลือก VM/container ที่รองรับ long-lived WebSocket แล้ว reverse proxy HTTPS/WSS พร้อมส่งต่อ Host และ Origin ให้ตรงกัน. ใช้ **หนึ่ง instance**; ห้ามเปิดหลาย replica เพราะ room coordinator อยู่ใน process เดียว. ไม่เหมาะกับ serverless request handlers ที่ตัด WebSocket. สำหรับ Vercel ใช้เส้นทาง Postgres ที่ระบุด้านล่าง; ไม่ใช้ SQLite บน disk ชั่วคราวของ Vercel

## Vercel (production)

เปิด **https://game-verse-psi.vercel.app**. ใช้ Vercel Fluid WebSockets + Neon Free Postgres สำหรับข้อมูลถาวรร่วมกัน; dev ยังคง SQLite. ตั้งค่า secrets, Google Console, migration, deploy และข้อจำกัด free quota ตาม [docs/vercel-deployment.md](docs/vercel-deployment.md). ไม่ใช้ disk ชั่วคราวของ Vercel เก็บห้องหรือบัญชี.

## ขอบเขตและข้อจำกัด

- ห้อง/engine state/revision/receipts เก็บ SQLite และกู้หลัง restart. ต้องรักษา `data/` และ auth secret เดิม; จำกัด 200 ห้อง. Lobby หมดอายุเมื่อไม่มี activity 24 ชั่วโมง, finished 30 วัน, เกมที่ยังเล่นไม่ลบตามเวลา. รายละเอียด [storage/recovery policy](docs/platform-storage.md)
- player หลุดไม่ข้ามตา; ห้องพักไว้จนกลับมา. Owner account ปิดห้องได้และกลับจากอุปกรณ์อื่นได้ ไม่มี kick/โอน host/reset ระหว่างเล่น. Guest upgrade ใช้ verified provider hook; account ที่มีสองที่นั่งชนกันถูกปฏิเสธ ไม่รวมการ์ด/ที่นั่ง
- เก็บ receipt คำสั่งล่าสุด 512 รายการต่อ session. Retry เดิมคืนผลเดิมก่อนตรวจ revision; คำสั่งเก่าที่พ้นหน้าต่างนี้ถูก revision ปฏิเสธ. Accepted transition synchronous/atomic ใน single process
- จำกัด frame 8 KiB, message 40/10 วินาทีต่อ socket, connection/auth 120/นาทีต่อ IP. บน Vercel เชื่อ IP ที่ ingress ของ Vercel เขียนทับเฉพาะเมื่อ runtime ตั้ง `VERCEL=1`; dev/VM ไม่เชื่อ forwarding headers จาก client. VM ที่มี proxy อื่นต้องกำหนดนโยบายเอง
- public projections ไม่มี finish cards, private bets, credentials หรือ future randomness. ตอนจบเปิด final cards ตามกติกา
- ทดสอบ browser จำลองบน Chromium; ยังไม่ยืนยัน iPhone/Safari/iPad จริง, กล้องสแกน QR จริง, เครือข่ายภายนอก หรือ TLS proxy จริง
- ใช้ artwork ที่สร้างใหม่ (อูฐ/พีระมิด/ไพ่/ลูกเต๋า/เหรียญ/ตัวละคร/texture) ไม่ใช้ emoji เป็นหมากหรือภาพกระดานกล่องเป็นพื้นหลัง. ทบทวนสิทธิ์ชื่อเกม/ทรัพย์สินก่อนเผยแพร่สาธารณะ

## โครงสร้าง

- `src/games/camel-up/`: engine อิสระ deterministic เมื่อ inject random
- `src/shared/catalog.ts`: metadata/counts/search/status/version กลาง; `src/games/registry.ts`: server-only adapters ทั้งสามเกม
- `src/games/azul/`: atomic drafting, shared wall mapping, scoring/bonuses, conservation และ restore validation
- `src/games/dracula-vs-van-helsing/`: state machine การ์ด/ความสามารถ/การตัดสินเขต และ public/private projections
- `src/server/`: rooms, roles, credentials, revisions, receipts, transport, rate limits
- `src/shared/`: DTO/type และชื่อสีที่ client ใช้ได้
- `src/client/`: Thai lobby/display/controller, `board.ts` จัดพิกัดและคิว animation, `assets.ts` preload/atlas, retry/reconnect
- `public/art/`: WebP artwork และ SVG board ที่แอปโหลดจริง (รวมประมาณ 1.3 MB)
- `assets/source/`: PNG ต้นฉบับและ gutter/blank-die edits; prompt set ใน `docs/asset-generation.md`
- `tests/`: engine, protocol และ browser
- `docs/`: [กติกา](docs/games/camel-up/rules.md), [แผน](docs/implementation-plan.md), [สถาปัตยกรรม](docs/architecture.md), [สถานะจริง](docs/progress.md)
- `.agents/skills/`: workflow AI ไม่มี runtime import; ที่มาใน `docs/skill-sources.md`

## ภาพและ animation

กระดาน 16 ช่องวนตามเข็มนาฬิกา รอบพีระมิด; ใช้ DOM/CSS + Web Animations API. Engine ส่ง movement trace และ room ส่ง public event ต่อ accepted revision. Client รับ state ทันทีแยกจากคิวแสดงภาพ: พีระมิดปล่อยเต๋า → แสดงผล → ย้ายอูฐทั้ง unit ตาม path จาก server → ป้าย/stack → ไพ่/เหรียญ/คะแนน. ไม่สุ่มหรือคิดคะแนนที่ client

Event ซ้ำไม่เล่นซ้ำ. Gap/event ขาดจะส่ง `sync` เพื่อขอ snapshot; reconnect ยกเลิก animation และวาง state ล่าสุด ไม่ replay ประวัติ. คิวเร่งเมื่อมี backlog, จำกัด 8 รายการก่อน snap/resync เพื่อไม่สะสมไม่สิ้นสุด. เคารพ `prefers-reduced-motion` และโหลด artwork ครบก่อนใช้ action

ตรวจภาพล่าสุดใน `test-results/board-1366x1024.png`, `board-1024x768.png`, `board-768x1024.png`, `mobile.png`, `finished.png` หลังรัน e2e. ที่มาภาพและ prompts: [docs/asset-generation.md](docs/asset-generation.md); แนวทางและข้อจำกัด reference: [docs/visual-design.md](docs/visual-design.md)

งานภาพ Camel Up ยังคงกระดาน 16 ช่องและ artwork เดิม. งาน Dracula ล่าสุดตรวจ reference กระดาน กล่อง และการ์ดที่ผู้ใช้แนบแล้ว; แนวทางภาพใหม่อยู่ใน `docs/presentation/visual-plan.md`. ทั้งสองเกมแยกภาพตกแต่งออกจากกติกาและพิกัดจริง

หากมี server เล่นอยู่และต้องการรัน browser tests แยกโดยไม่ปิดห้องเดิม: `PLAYWRIGHT_PORT=3001 npm run test:e2e`

## เล่นอีกครั้งในห้องเดิม (Camel Up)

หลังจบเกม ผู้สร้างห้องกด **เล่นอีกครั้ง** ที่จอกลางได้ เลือกผู้เริ่มเกมใหม่ก่อนกด. ต้องมีผู้เล่นทุกคนเชื่อมต่ออยู่. มือถือทุกเครื่องเข้าเกมใหม่พร้อมกันโดยใช้รหัสห้อง ชื่อ และ session เดิม; ไม่ต้องสแกน QR หรือเข้าห้องซ้ำ. เงินเริ่ม 3 เหรียญ การ์ดคืนครบ และกระดาน/คะแนนรอบเดิมล้างเพื่อเริ่มการแข่งขันใหม่

ปุ่มนี้ใช้ได้หลัง finished เท่านั้น ผู้เล่น/ผู้ชมไม่มีสิทธิ์เริ่มเกมใหม่ และไม่สามารถ reset เกมที่ยังเล่นอยู่. Revision เพิ่มต่อเนื่องและ receipt คำสั่งยังเก็บข้ามเกมเพื่อป้องกันคำสั่งซ้ำหรือคำสั่งค้างจากเกมเก่า. Restart process แล้วกู้ห้องจาก SQLite ได้เมื่อรักษา data/secret เดิม


## Dracula vs Van Helsing (core gameplay)

หน้าเลือกเกม `/` → `/games/dracula-vs-van-helsing` → สร้างห้อง. ลิงก์จอกลาง/มือถือและ reconnect ใช้ระบบเดิม `/display/<code>` / `/play/<code>`. จอกลางรวม host ไม่ได้รับการ์ดลับ และไม่ใช้ช่องผู้เล่น. รับสองคนเท่านั้น; ผู้เล่นเดิมกลับเข้าได้แม้ห้องเต็ม

มือถือ: จั่ว → เลือกทิ้งใบใหม่หรือเลือกเขตแทนที่ → ยืนยัน → เลือกเป้าหมายความสามารถถ้าจำเป็น. ช่องการ์ดตรงเขต 1–5 ไม่จัดใหม่เอง. ใบเปิดเผยตามกติกาแสดงทุกจอ; ใบปิดส่งเฉพาะเจ้าของ. สีมีชื่อและสัญลักษณ์ร่วมด้วย

เมื่อจบรอบ server เปิดการ์ดทั้งสองฝ่ายและตัดสินเขตใน snapshot เดียว. หน้าผลแสดงเหตุผลแต่ละเขตและหยุดเขตที่เหลือหากเกิดชัยชนะก่อน. หากยังไม่จบ ทั้งคู่กด **พร้อมรอบถัดไป** จึงสับ/แจกใหม่. ขั้นตอนพักดูผลเป็น UX เพิ่มเติม. จบเกม host กด **เล่นอีกครั้ง** โดยใช้ห้อง/บทบาท/ผู้เล่นเดิม

กติกาครบและแหล่งตรวจสอบ: [docs/games/dracula-vs-van-helsing/rules.md](docs/games/dracula-vs-van-helsing/rules.md) อิงคู่มือ Mandoo ©2023 และคู่มือทางการจาก Asmodee Italia; อ่านรีวิว Stronghold ประกอบ. เกมนี้ใช้ artwork ที่สร้างใหม่และ DOM/CSS + Web Animations API; ยังไม่มีเสียง

Browser suite เพิ่มจอกลาง + มือถือ Dracula + มือถือ Helsing: เข้าผ่าน portal, เลือกบทบาท/พร้อม, เล่นจนชนะ, เปรียบเทียบ public state ทุกจอทุก action, ตรวจ payload การ์ดลับ, ACK หายแล้ว retry, หลุด/โหลดใหม่ระหว่างเล่นและผลรอบ, desktop/iPad/phone, เล่นอีกครั้ง. ภาพที่รันสร้างใน `test-results/dracula-*.png`. ยังไม่ได้ทดสอบ Safari หรืออุปกรณ์จริง


## Portal, UI กลาง และภาพ Dracula

- `/`: gallery หน้าปกทั้งสามเกม ไม่มี hero หรือเกมสมมติ คลิกปกเพื่อเลือกเกม
- `/games/camel-up` หรือ `/games/dracula-vs-van-helsing`: สร้างห้องหรือใส่รหัส/ชื่อผ่าน UI กลางเดียวกัน
- `/join`: หน้าเข้าห้องด้วยรหัส วางรหัสและกด Enter ได้ รหัส normalize เป็น uppercase และตัดช่องว่าง
- `/play/<code>` จาก QR: ใส่ชื่อโดยไม่ต้องกรอกรหัสซ้ำ; session เดิมกลับเข้าอัตโนมัติ
- ห้องรอทุกเกมใช้ neutral platform theme. เมื่อเริ่มจึงใช้ theme เฉพาะเกม

Dracula ใช้ปก ตัวละคร การ์ด 8 แบบ แผนที่เมือง หลังการ์ดร่วมหนึ่งแบบ และ markers ที่สร้างใหม่ด้วย built-in image generation. ข้อความไทย เลข สี/สัญลักษณ์ และตำแหน่งเขตแสดงด้วยโค้ด. แผนที่เป็น artwork ตกแต่ง แยกจาก 5 เขต/ช่องการ์ดจริง. ไม่มีภาพอ้างอิงต้นฉบับหรือ screenshot เกมถูกใช้เป็นหน้าปก

Runtime assets 7 ไฟล์ (ประมาณ 1.9 MB): `public/art/covers/` และ `public/art/dracula/`; manifest `public/art/presentation-manifest.json`. PNG originals `assets/source/presentation/`. Prompt set และรายละเอียดการเตรียมไฟล์: [docs/presentation/generated-art.md](docs/presentation/generated-art.md). Optional rebuild formatting: `python3 scripts/prepare-presentation-art.py` ต้องมี Pillow; แอปรันปกติใช้เฉพาะ Node และไฟล์ WebP ที่เตรียมไว้ ไม่ต้องมี Python/Pillow

Portal โหลดปก; artwork เกมโหลดเมื่อเข้าห้องของเกมนั้น จึงไม่ preload Camel ทั้งชุดขณะเล่น Dracula. Dracula รอ assets ที่จำเป็นพร้อมก่อนเปิด controls. ตัวละคร/markers มี alpha จริง

Presentation ใช้ latest authoritative state ทันที. Server ส่งไพ่/ผลสองฝ่ายใน revision เดียว; ภาพเฉลยคู่ไพ่ทีละเขต 1→5 พร้อมผู้ชนะ/ผู้แพ้ เหตุผล และ HP/แวมไพร์ตาม server. ปุ่ม “แสดงผลทั้งหมด” ข้ามได้. Duplicate revision ไม่เล่นซ้ำ; snapshot/reconnect/reduced motion แสดงล่าสุด; gap ขอ sync. Ready acknowledgement ของผลรอบเดิมไม่ตัดการเฉลย. Server ไม่รอ animation เพื่อตัดสินเกม

ภาพหลังรันทดสอบ: `test-results/portal.png`, `portal-mobile.png`, `join-url.png`, `join-error.png`, `common-lobby-*.png`, `dracula-desktop.png`, `dracula-ipad.png`, `dracula-ipad-portrait.png`, `dracula-mobile-count.png`, `dracula-mobile-helsing.png`, `dracula-mobile.png`, `dracula-reveal.png`, `dracula-round.png`, `dracula-finished.png`. Browser suite เพิ่ม common join flow และ duplicate/gap/reconnect mid-reveal/reduced motion. ผลตรวจจริงและข้อจำกัดล่าสุดใน progress

## GameVerse platform

Home มี search ภาษาไทย/อังกฤษ, filter “ตอนนี้มี N คน” ตามจำนวนที่รองรับจริง, active rooms เฉพาะสมาชิก/owner ที่ล็อกอิน และล่าสุดสูงสุด 3 เกมที่เริ่มจริง (ไม่ใช่คลิกปก/create). `/login`, `/profile`, `/admin` ใช้ neutral mobile-first theme; gameplay เก็บ artwork/theme เดิม. Noto Sans Thai 400/700 self-hosted ใน `public/fonts/` พร้อม SIL OFL license

Profile ใช้ชื่อ/avatar ร่วมทุกเกม; รับ upload PNG/JPEG/WebP ไม่เกิน 2 MiB และแปลง 256px WebP ที่ server. ชื่อ/รูปไม่เปลี่ยน playerId/cards/turn. Logout ปิด account realtime session และล้าง player credentials บน browser; ที่นั่งยังอยู่ให้บัญชีเดิมกลับมา

ตั้ง admin ด้วย `GAMEVERSE_BOOTSTRAP_ADMIN_USER_ID` ของ account จริงใน `.env` แล้ว restart; ไม่มี hardcoded email. หน้า `/admin` พัก/เปิดการสร้างห้องและดู diagnostics ได้โดยไม่เห็น private cards/token. Maintenance ไม่หยุดเกมเดิม

คำสั่ง build/test ด้านบนยังใช้ได้. Browser tests ใช้ account fixtures ผ่าน DB/library adapter เฉพาะ test และ Guest cookie จริง **ไม่ถือว่า Google provider E2E ผ่าน**. Google login/callback จริงได้รับการยืนยันจากผู้ใช้ว่ากลับเข้าเกมได้ และตรวจพบ Google account พร้อม session ใน server แล้ว. Headless browser ตรวจได้ถึงหน้า Google sign-in; การ cancel และ Guest upgrade ผ่าน provider จริงยังไม่ได้ทดสอบ. Node tests เพิ่ม HTTP/WS auth/profile/permission/SQLite failure/restart/log-out/version recovery

คู่มือ: [Google Console URLs](docs/auth/google-oauth.md), [storage/rooms/backup/admin](docs/platform-storage.md), [เพิ่มเกมใหม่](docs/adding-a-game.md), [สถานะทดสอบ](docs/progress.md). ไม่ได้ deploy สาธารณะ, ไม่มี cloud billing และยังไม่ทดสอบ Docker/Safari/อุปกรณ์จริง
# game-verse


## Azul ภาคหลัก (2–4 คน)

เปิด `/games/azul` → ล็อกอิน Google และสร้างห้อง. ผู้เล่นใช้ QR/รหัสห้องและ Google/Guest เดิม. Owner สามารถเข้าที่นั่งจากมือถือบัญชีของตนได้; จอกลางไม่กินที่นั่ง. ทุกคนกด **พร้อมเล่น** แล้ว owner เลือกผู้เริ่มหรือ **สุ่มที่ server** และกด **เริ่มเกม**. การเลือก/สุ่มแทนเกณฑ์ผู้ไปโปรตุเกสล่าสุดเป็นขั้นตอน setup สำหรับเว็บ.

มือถือ: แตะโรงงานหรือกลางและสี → เลือกแถว 1–5 หรือพื้น → อ่าน preview จำนวนที่วาง/ล้นพื้น/ทิ้ง → **ยืนยันหยิบกระเบื้อง**. เปลี่ยนหรือยกเลิก preview ได้ก่อนยืนยัน. ปุ่มปลายทางมีเหตุผลเมื่อวางไม่ได้. กระดานทุกคนเป็นข้อมูลเปิดและดูด้วยแท็บผู้เล่นได้; จอกลางเห็นทุกคนพร้อมกัน. ลำดับในถุงไม่ส่งให้ client.

เมื่อกระเบื้องในโรงงานและกลางหมด server ปูผนังบนลงล่างและคิดคะแนนทันทีครั้งเดียว. ช่วงดูผล **ผู้เล่นที่เชื่อมต่อคนใดหรือ owner กดเริ่มรอบถัดไปได้** ไม่ต้องรอคนที่หลุดกดพร้อม. ระหว่าง drafting ถ้าคนที่ถึงตาหลุด ยังรอให้กลับที่นั่งเดิมตามระบบห้องกลาง ไม่มีการเล่นแทนหรือข้ามตา. Restart server กู้ถุง/กระดาน/revision/receipts เดิมจาก SQLite ไม่สุ่มใหม่.

จบหลังคิดผลทุกคนเมื่อมีผนังหนึ่งแถวครบ; แสดงโบนัส +2/+7/+10, คะแนน และผู้ชนะร่วมตาม tie-break. Owner กด **เล่นอีกครั้ง** ในห้องเดิมได้. ใช้เฉพาะกระดานผนังสีมาตรฐาน ไม่มีด้านว่าง/ภาคเสริม. กรณี floor เต็มแล้วรับ marker: ถือข้างกระดานและไม่เพิ่มค่าปรับเกิน 7 ช่อง ตามข้อวินิจฉัยเว็บที่ผู้ใช้ยืนยัน.

กติกา/แหล่ง/ข้อวินิจฉัย: [docs/games/azul/rules.md](docs/games/azul/rules.md). ใช้ artwork เซรามิก 5 ลาย กรอบกระดาน แผ่นโรงงาน marker และปกที่สร้างใหม่เป็น WebP ภายในโปรเจกต์ รวมประมาณ 562 KB. Preview เส้นประแสดงจำนวนจาก server; เลือกแล้วดูคู่แข่งได้โดยไม่เสีย selection และเมื่อ revision เปลี่ยนจะยกเลิกพร้อมแจ้ง. ผลรอบแสดงพิกัดผนัง/คะแนน/ค่าปรับ; ผลเกมแสดงก่อนโบนัสและเหตุผลตัดสิน. Score track เลื่อนช่วงค่าจริง รองรับเกิน 100. รายละเอียดภาพและคำสั่งเตรียมไฟล์: [Azul assets](docs/presentation/azul-assets.md). ไม่มี animation เคลื่อนชิ้นตามเวลา; feedback เล็กน้อยรองรับ reduced motion.

ทดสอบเฉพาะ Azul:

```sh
npx tsx --test tests/azul.test.ts tests/azul-rooms.test.ts
npm run build
PLAYWRIGHT_PORT=3001 npx playwright test tests/browser/azul.spec.ts tests/browser/azul-presentation.spec.ts
```

ใช้พอร์ต 3001 แยกจากห้องที่เปิดเล่นบน 3000. Browser suite ใช้ Chromium และ fixture account เฉพาะ test ไม่ใช่การทดสอบ Google provider ใหม่. ดูผลที่รันจริงใน [docs/progress.md](docs/progress.md).
