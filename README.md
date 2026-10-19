# GameVerse — เว็บบอร์ดเกมจอกลาง + มือถือ

มี portal ให้เลือก **Sky Team (2 คน, YUL introductory)**, **Harmonies ภาคหลัก (2–4 คน, ด้าน A/B)**, **Pixies ภาคหลัก (2–5 คน)**, **Jaipur ภาคหลัก (2 คน)**, **7 Wonders Duel ภาคหลัก (2 คน)**, **Camel Up Second Edition (3–8 คน)**, **Dracula vs Van Helsing, Mandoo 2023 (2 คน)**, **Azul ภาคหลัก ผนังสีมาตรฐาน (2–4 คน)** และ **Calico ภาคหลัก (1–4 คน)**. Camel Up ใช้ฉบับ 2018 / คู่มือพิมพ์ใหม่ 2024. UI ไทย, QR/รหัสห้อง, มือถือส่วนตัว, server ตัดสินกติกาและสุ่ม, reconnect ด้วย session เดิม. คนสร้างห้องเข้ามาเล่นด้วยมือถืออีกเครื่องได้

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

- `npm test`: กติกาทั้งหกเกม, seeded complete games, actual WebSocket integration (พอร์ตสุ่ม), บทบาท/ความพร้อม/ห้องเต็ม/การ์ดลับ/atomic reveal และ retries/reconnect
- `npm run build`: typecheck, client bundle, server JS
- `npm run test:e2e`: build แล้วเปิด production server port 3000; Chromium จอกลาง + มือถือ 3 browser contexts, เล่นจบเกม, หลุดกลับ, ทดสอบคำตอบคำสั่งหายแล้ว retry, payload privacy, animation unit/tile, duplicate/gap/resync, reduced motion และ viewport desktop/iPad/phone. หากมีห้องกำลังเล่นบน 3000 ใช้ `PLAYWRIGHT_PORT=3001 npm run test:e2e` เพื่อรักษาห้องเดิม
- ภาพที่ทดสอบสร้างไว้ใน `test-results/` (ไม่ commit). ดูรายละเอียดผลที่รันจริงใน [docs/progress.md](docs/progress.md)

## รัน production และแนวทาง deploy

```sh
npm run build
npm start
```

`npm start` ใช้ server JS ที่ compile แล้วและ `dist/`; ไม่ต้องมี Vite ระหว่างรัน. `/health` ใช้ตรวจ process.

## Docker บนเครื่องตัวเอง — port 5555

เปิด Docker Desktop แล้วรันจาก project root (ต้องมี Node.js 24.18+ สำหรับ setup script):

```sh
npm run docker:rebuild
```

เปิด **http://localhost:5555**. คำสั่งนี้ build, เริ่ม container และรอ health check. ครั้งแรกสร้าง private `.env.docker` โดยคัดลอกเฉพาะ Google credentials จาก `.env` พร้อมสร้าง auth secret ใหม่; ครั้งถัดไปเก็บค่าเดิม. ถ้ายังไม่มี credentials ให้ใส่ใน `.env.docker` แล้ว rebuild. ห้าม commit หรือส่งไฟล์นี้ในแชต.

เครื่องนี้เชื่อม Docker ผ่าน **https://bn-games.basnana.com** แล้ว และตั้ง `BETTER_AUTH_URL` / `GAMEVERSE_JOIN_ORIGIN` ใน `.env.docker` เป็นโดเมนนี้. ใช้โดเมนนี้สำหรับ Google login และ QR เข้าห้อง; `localhost:5555` ยังเปิดแอปได้ แต่ Google login ใช้ URL หลักที่ตั้งไว้. การแมป DNS/tunnel อย่างเดียวไม่เปลี่ยน URL ภายในแอป. หากเปลี่ยนโดเมน แก้สองค่านี้และเพิ่มโดเมนใน `GAMEVERSE_TRUSTED_ORIGINS` แล้ว rebuild.

สำหรับโดเมน Docker ให้เพิ่มใน OAuth client ตัวเดียวกับ `.env.docker`: origin `https://bn-games.basnana.com` และ redirect `https://bn-games.basnana.com/api/auth/callback/google`. คง localhost ไว้หากจะสลับกลับไปรัน local โดยตรง.

เพิ่มใน Google OAuth client ที่ Client ID ตรงกับ `GOOGLE_CLIENT_ID` ใน `.env.docker` โดยคง URL เก่าไว้ (dev กับเว็บจริงอาจใช้คนละ client):

- Authorized JavaScript origins: `http://localhost:5555`
- Authorized redirect URIs: `http://localhost:5555/api/auth/callback/google`

ล็อกอิน Google บนคอมเพื่อสร้างห้อง. มือถือบน Wi-Fi เดียวกันสแกน QR แล้วเข้าเป็น Guest ได้. Setup เลือก LAN IP ของคอมสำหรับ QR; หาก IP เปลี่ยน แก้ `GAMEVERSE_JOIN_ORIGIN` และ `GAMEVERSE_TRUSTED_ORIGINS` ใน `.env.docker` เป็น `http://<LAN-IP>:5555` แล้ว rebuild. เปิด firewall port 5555 หากมือถือเข้าถึงไม่ได้. Google login ผ่าน LAN IP ของมือถือยังต้องใช้ HTTPS domain ตามข้อจำกัดด้านบน.

```sh
npm run docker:rebuild  # หลังแก้โค้ด: build และอัปเดต container
npm run docker:watch    # หรือเปิด watcher ให้ rebuild เมื่อ src/public/config เปลี่ยน (Compose 2.22+)
npm run docker:stop     # หยุดโดยเก็บข้อมูลไว้
```

ใช้ SQLite ใน named volume `gameverse-local_local-data` และ cookie prefix แยกจาก dev port 3000. ห้อง/บัญชี/รูปที่อัปโหลดอยู่ใน volume; rebuild ไม่ล้างข้อมูล. ห้ามใช้ `docker compose down -v` หากต้องการรักษาห้องและบัญชี. Docker local มีข้อมูลแยกจาก dev และ Vercel ไม่ได้ย้ายหรือ sync ห้องเดิม. รันเพียงหนึ่ง instance สำหรับ SQLite. `SIGTERM` ปิด server/ฐานข้อมูลอย่างเรียบร้อยก่อน recreate.

ตรวจแอป Docker จริงด้วย Chromium (สร้างบัญชีเจ้าของแบบ fixture ใน SQLite เฉพาะ fresh Guest ไม่ใช่การทดสอบ Google provider):

```sh
npx playwright install chromium
GAMEVERSE_E2E_DOCKER=1 npx playwright test --config playwright.docker.config.ts
```

ชุดนี้ตรวจ native file picker/ชื่อ/รูป และเล่น Dracula ด้วยจอกลาง+มือถือสองคนจนจบ รวม recreate container ระหว่างเกมแล้ว reconnect ด้วย session/ไพ่เดิม. ใช้เฉพาะ Docker local ที่ localhost:5555 และจะ restart container หนึ่งครั้ง; ไม่ลบ volume. ผลจริงและข้อจำกัดอยู่ใน [docs/progress.md](docs/progress.md).

ตามความต้องการล่าสุด **ไม่ deploy Vercel หรือ push branch ที่เชื่อม auto-deploy จนกว่าจะสั่งใหม่**. การแก้แต่ละครั้งตรวจและ rebuild Docker local ก่อน.

## Vercel (production)

เปิด **https://games.basnana.com**. ใช้ Vercel Fluid WebSockets + Neon Free Postgres สำหรับข้อมูลถาวรร่วมกัน; dev ยังคง SQLite. ตั้งค่า secrets, Google Console, migration, deploy และข้อจำกัด free quota ตาม [docs/vercel-deployment.md](docs/vercel-deployment.md). ไม่ใช้ disk ชั่วคราวของ Vercel เก็บห้องหรือบัญชี.

## ขอบเขตและข้อจำกัด

- ห้อง/engine state/revision/receipts เก็บ SQLite และกู้หลัง restart. ต้องรักษา `data/` และ auth secret เดิม; จำกัด 200 ห้อง. ทุกสถานะหมดอายุเมื่อไม่มีการเข้าร่วมหรือคำสั่งสำเร็จเกิน 10 ชั่วโมง; watch/resume/sync/heartbeat ไม่ต่ออายุห้อง. รายละเอียด [storage/recovery policy](docs/platform-storage.md)
- player หลุดไม่ข้ามตา; ห้องพักไว้จนกลับมา. Owner account ปิดห้องได้และกลับจากอุปกรณ์อื่นได้ ไม่มี kick/โอน host/reset ระหว่างเล่น. Guest upgrade ใช้ verified provider hook; account ที่มีสองที่นั่งชนกันถูกปฏิเสธ ไม่รวมการ์ด/ที่นั่ง
- เก็บ receipt คำสั่งล่าสุด 512 รายการต่อ session. Retry เดิมคืนผลเดิมก่อนตรวจ revision; คำสั่งเก่าที่พ้นหน้าต่างนี้ถูก revision ปฏิเสธ. Accepted transition synchronous/atomic ใน single process
- จำกัด frame 8 KiB, message 40/10 วินาทีต่อ socket, connection/auth 120/นาทีต่อ IP. บน Vercel เชื่อ IP ที่ ingress ของ Vercel เขียนทับเฉพาะเมื่อ runtime ตั้ง `VERCEL=1`; dev/VM ไม่เชื่อ forwarding headers จาก client. VM ที่มี proxy อื่นต้องกำหนดนโยบายเอง
- public projections ไม่มี finish cards, private bets, credentials หรือ future randomness. ตอนจบเปิด final cards ตามกติกา
- ทดสอบ browser จำลองบน Chromium; ยังไม่ยืนยัน iPhone/Safari/iPad จริง, กล้องสแกน QR จริง, เครือข่ายภายนอก หรือ TLS proxy จริง
- ใช้ artwork ที่สร้างใหม่ (อูฐ/พีระมิด/ไพ่/ลูกเต๋า/เหรียญ/ตัวละคร/texture) ไม่ใช้ emoji เป็นหมากหรือภาพกระดานกล่องเป็นพื้นหลัง. ทบทวนสิทธิ์ชื่อเกม/ทรัพย์สินก่อนเผยแพร่สาธารณะ

## โครงสร้าง

- `src/games/camel-up/`: engine อิสระ deterministic เมื่อ inject random
- `src/shared/catalog.ts`: metadata/counts/search/status/version กลาง; `src/games/registry.ts`: server-only adapters ทั้งหกเกม
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

เมื่อจบรอบ server คำนวณผลตามลำดับเขต 1–5 แต่รอแต่ละคนแตะเปิดไพ่ฝั่งตัวเอง ทุกจอเห็นพร้อมกัน ใบที่ยังไม่เปิดไม่ถูกส่งใน public projection. หน้าผลแสดงเหตุผลแต่ละเขตและหยุดเขตที่เหลือหากเกิดชัยชนะก่อน. หากยังไม่จบ ทั้งคู่กด **พร้อมรอบถัดไป** จึงสับ/แจกใหม่. ขั้นตอนพักดูผลเป็น UX เพิ่มเติม. จบเกม host กด **เล่นอีกครั้ง** โดยใช้ห้อง/บทบาท/ผู้เล่นเดิม

กติกาครบและแหล่งตรวจสอบ: [docs/games/dracula-vs-van-helsing/rules.md](docs/games/dracula-vs-van-helsing/rules.md) อิงคู่มือ Mandoo ©2023 และคู่มือทางการจาก Asmodee Italia; อ่านรีวิว Stronghold ประกอบ. เกมนี้ใช้ artwork ที่สร้างใหม่และ DOM/CSS + Web Animations API และเสียงเอฟเฟกต์/เสียงพื้นหลังที่เปิดปิดแยกกันได้

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

Presentation ใช้ latest authoritative state ทันที. จบรอบขึ้น “จบรอบแล้ว เปิดการ์ดเพื่อดูคะแนน” ผู้เล่นเลือกเปิดเฉพาะไพ่ของตัวเองตามลำดับใดก็ได้ คะแนนแสดงตามคู่เขต 1–5 เมื่อเปิดครบทั้งสองฝั่งจึงพร้อมรอบถัดไป/เล่นใหม่ได้ ไม่มีเฉลยอัตโนมัติ. Reconnect คืนสถานะที่เปิดแล้วโดยไม่แจกไพ่หรือเล่นเสียงซ้ำ. เริ่มเกม/รอบใหม่แจกไพ่จากกลางทีละใบ 1–5; reduced motion แสดงทันที. เมนูลำโพงแยกเอฟเฟกต์กับเสียงพื้นหลัง (ค่าเริ่มต้นพื้นหลังปิด) และจำค่าบนอุปกรณ์.

ภาพหลังรันทดสอบ: `test-results/portal.png`, `portal-mobile.png`, `join-url.png`, `join-error.png`, `common-lobby-*.png`, `dracula-desktop.png`, `dracula-ipad.png`, `dracula-ipad-portrait.png`, `dracula-mobile-count.png`, `dracula-mobile-helsing.png`, `dracula-mobile.png`, `dracula-reveal.png`, `dracula-round.png`, `dracula-finished.png`. Browser suite เพิ่ม common join flow และ duplicate/gap/reconnect mid-reveal/reduced motion. ผลตรวจจริงและข้อจำกัดล่าสุดใน progress

## GameVerse platform

Home มี search ภาษาไทย/อังกฤษ, filter “ตอนนี้มี N คน” ตามจำนวนที่รองรับจริง, active rooms เฉพาะสมาชิก/owner ที่ล็อกอิน และล่าสุดสูงสุด 3 เกมที่เริ่มจริง (ไม่ใช่คลิกปก/create). `/login`, `/profile`, `/admin` ใช้ neutral mobile-first theme; gameplay เก็บ artwork/theme เดิม. Noto Sans Thai 400/700 self-hosted ใน `public/fonts/` พร้อม SIL OFL license

Profile ใช้ชื่อ/avatar ร่วมทุกเกม; รับ upload PNG/JPEG/WebP ไม่เกิน 2 MiB และแปลง 256px WebP ที่ server. ชื่อ/รูปไม่เปลี่ยน playerId/cards/turn. Logout ปิด account realtime session และล้าง player credentials บน browser; ที่นั่งยังอยู่ให้บัญชีเดิมกลับมา

ตั้ง admin ด้วย `GAMEVERSE_BOOTSTRAP_ADMIN_USER_ID` ของ account จริงใน `.env` แล้ว restart; ไม่มี hardcoded email. หน้า `/admin` พัก/เปิดการสร้างห้องและดู diagnostics ได้โดยไม่เห็น private cards/token. Maintenance ไม่หยุดเกมเดิม

คำสั่ง build/test ด้านบนยังใช้ได้. Browser tests ใช้ account fixtures ผ่าน DB/library adapter เฉพาะ test และ Guest cookie จริง **ไม่ถือว่า Google provider E2E ผ่าน**. Google login/callback จริงได้รับการยืนยันจากผู้ใช้ว่ากลับเข้าเกมได้ และตรวจพบ Google account พร้อม session ใน server แล้ว. Headless browser ตรวจได้ถึงหน้า Google sign-in; การ cancel และ Guest upgrade ผ่าน provider จริงยังไม่ได้ทดสอบ. Node tests เพิ่ม HTTP/WS auth/profile/permission/SQLite failure/restart/log-out/version recovery

คู่มือ: [Google Console URLs](docs/auth/google-oauth.md), [storage/rooms/backup/admin](docs/platform-storage.md), [เพิ่มเกมใหม่](docs/adding-a-game.md), [สถานะทดสอบ](docs/progress.md). สถานะ deploy และผลทดสอบล่าสุดดูใน docs/progress.md; Docker local มี flow ทดสอบแยกตามหัวข้อข้างต้น และยังไม่ได้ทดสอบ Safari/อุปกรณ์จริง
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

## เสียงแจ้งจบตาและจอกลาง TV

ทุกเกมมีเสียงสั้นเมื่อ server ยืนยันว่าจบตาหรือจบรอบ. แตะ **เปิดเสียงแจ้งจบตา** หนึ่งครั้งบนจอกลาง/TV เพื่ออนุญาตเสียง แล้วใช้ปุ่ม **เสียงจบตา: เปิด/ปิด** ตั้งค่าเฉพาะเครื่อง (จำเมื่อ reload). การเชื่อมใหม่/snapshot/คำสั่งซ้ำไม่เล่นเสียงย้อนหลัง. Browser อาจระงับเสียงก่อน user gesture; ไม่ใช่เสียงจาก server. ไพ่ Dracula มี intrinsic size และ font/portrait fallbacks สำหรับ browser ที่ไม่มี aspect-ratio/cqw; ไพ่ลับบนจอกลางยังคว่ำตามกติกา.

## Dracula บนมือถือ

ไพ่ของเราที่เปิดเผยต่อคู่แข่งมีกรอบทองและป้าย **เปิดแล้ว** ซึ่งไม่จางตามหน้าไพ่ขณะรอตา พร้อมจำนวนใบและเลขเขตที่เปิดอยู่เหนือเมือง สถานะนี้ยึดข้อมูลไพ่จาก server และคงอยู่หลัง reconnect หน้าสรุปรอบใช้ฟอนต์ไทยหลัก และปุ่ม **พร้อมรอบถัดไป** อยู่ด้านขวาของกล่องเปิดการ์ดรอบ โดยรอเฉลยจบหรือกดแสดงผลทั้งหมดก่อนกดพร้อมได้

หน้าเล่นแสดงไพ่คู่แข่ง 5 ใบเหนือเขตทั้ง 5 และไพ่ของคุณ 5 ใบใต้กระดาน โดยสลับตำแหน่งตามบทบาท เมืองมีเขตเว้าขนาดต่างกันและคนกระจายทั่วแต่ละเขต กดจั่วบนกระดานได้เลย ไพ่ที่จั่วปรากฏตรงกลางเฉพาะเจ้าของ เว้นแต่เปิดเผยตามกติกา มีแอนิเมชันและข้อความ **จั่วแล้ว** แยกจากใบบนสุดที่เปิดด้วยการ์ด 2 จั่วและทิ้งแล้วไม่เลื่อนหน้าอัตโนมัติ

เลือกเป้าหมายโดยแตะไพ่บนกระดานโดยตรง ไม่มีแผงเลือกการกระทำแยก ไพ่ที่เลือกยกขึ้นและมีปุ่มยืนยันลอยด้านล่าง เปิดไพ่เลือกหนึ่งใบ สลับไพ่เราเลือกสองใบ แลกข้ามฝั่งเลือกเขตแล้วไพ่คู่ยกพร้อมกัน เลือกสีทรัมป์จากแถวสีบนกระดาน กรอบเมืองเปลี่ยนตามสีทรัมป์จาก server ไพ่ลับของคู่แข่งยังคว่ำ ไอคอนสีเป็น SVG ไพ่จางเมื่อรอตา และไม่มี toast เมื่อจั่วสำเร็จ (ข้อผิดพลาดยังแจ้งตามปกติ)

รูปบัญชีอยู่ขวาบนพร้อมจุดออนไลน์/หลุด ส่วนฝั่งเกมใช้ภาพ Dracula / Van Helsing เดิมและกรอบทองบอกฝั่งของคุณ. สีทรัมป์ล่าสุดอยู่เหนือปุ่มกระทำ; การ์ด 7 เลือกวงกลมสีและสัญลักษณ์แล้วกดยืนยัน. เลือกการ์ดที่จะทิ้งแล้วใช้ปุ่มยืนยันที่ติดด้านล่างจอ. แตะรหัสห้องเพื่อคัดลอกลิงก์ชวนเพื่อน; ผลคำสั่งแสดงเป็น toast. เล่นอีกครั้งใช้ห้อง/ผู้เล่น/บทบาทเดิม แจกการ์ดใหม่และล้างผลกับภาพเกมเก่า.

ทดสอบ flow และ rematch แบบเจาะจง: `npm run build && PLAYWRIGHT_PORT=3001 npx playwright test tests/browser/dracula-controller.spec.ts` (แยกจาก dev ที่ port3000). รูปหลังรันอยู่ `test-results/dracula-controller-*.png`.


## Calico ภาคหลัก (1–4 คน)

เปิด `/games/calico` หรือเลือก Calico บน Portal. ใช้ Profile/Login/Guest/QR/Lobby และ reconnect กลางเดิม. จอกลางไม่กินที่นั่ง; ผู้เล่น 1–4 คนกดพร้อม (หนึ่งคนเป็น Solo) ผู้สร้างเลือกคนลูบแมวล่าสุดเป็นผู้เริ่มและเลือกการจัดเกม:

- **มาตรฐาน**: server สุ่มแมวตาม dot groups และลายให้แมว; แต่ละคนเลือก/จัด goals 3 จาก 4 ชิ้นบนมือถือ ยืนยันครบทุกคนจึงเริ่ม. Draft เก็บฝั่ง server และกลับมาเลือกต่อได้หลัง refresh.
- **เกมแรก**: แมว Millie/Tibbit/Coconut และเป้าหมายตามภาพ setup ในคู่มือ ไม่ใช่ house rule/family variant.

แต่ละตาแตะผ้าในมือ → แตะช่องว่างเพื่อ preview → ยืนยันวาง → เลือกผ้าจากตลาด → ยืนยันเลือก. ตลาดอยู่ด้านบนและปุ่มยืนยันอยู่ในแถบตลาดบนมือถือ รหัส/QR อยู่ในเมนู “ข้อมูลห้อง” ระหว่างเล่น เสียงใช้ icon ที่ปิดได้ แมวและกระดุมผูกกับช่องที่ได้รับ แตะดูที่มา/ลดความทึบได้. มือเปิดให้ทุกคนรวมจอกลางเห็นตามข้อวินิจฉัยที่ผู้ใช้ยืนยัน (คู่มือไม่ได้ระบุข้อความเรื่อง visibility ชัดเจน). ถุง108ชิ้นมีจำนวนจำกัดจริงและลำดับไม่ส่งให้ client. วางคนละ22ตา แล้วคิด goals/แมว/ปุ่มพร้อม tie-break. รองรับแมวพื้นฐานทั้ง10ตัว กระดาน4ผืน และ Solo ภาคหลัก; ไม่รวม lower-variance/family/scenarios/achievements/expansions/AI.

Solo: หลังหยิบตลาดหนึ่งชิ้น ทิ้งอีก **1 ชิ้นที่ไกลถุงที่สุด** เลื่อนชิ้นที่เหลือไปช่อง1 เติมช่อง2และ3ตามลำดับ รวมจั่ว2ชิ้น/ตา ตามคู่มือหน้า8 ไม่ใช่ทิ้งตลาดที่เหลือทั้งสองชิ้น. เล่นครบ22ตาพร้อมขั้นตอนเลือก/เติมในตาสุดท้าย แล้วสรุปคะแนนปกติ ไม่มี AI หรือเกณฑ์ระดับ Solo ที่เว็บแต่งเพิ่ม. Multiplayer2–4เติมเฉพาะช่องที่หยิบ ไม่มีการทิ้งแบบ Solo. ห้องสองคนเดิมกู้กลับด้วยกติกา/กระดานเดิม ไม่ reset ระหว่างเกม

ภาพปก/แมว10ตัว/ปุ่ม7แบบ/linen texture สร้างด้วย imagegen และเชื่อมแอปจริง; ลายผ้าเชิงกติกาเป็น SVG คงที่พร้อมรหัส1–6/A–F. มี tile detail, market/placement preview และยืนยันก่อนcommit, motionตามserverrevision/eventsequence, reduced-motion และเสียงจบตา/muteเดิม. หลุดหลังวางกลับมาเลือกตลาดต่อได้; เล่นอีกครั้งเก็บห้อง/ผู้เล่นแต่เริ่มผ้าห่มใหม่.

กติกาและข้อวินิจฉัย: [rules.md](docs/games/calico/rules.md). พิกัด/ภาพ/asset mapping: [design.md](docs/games/calico/design.md). ผลทดสอบจริงและข้อจำกัด: [progress.md](docs/progress.md).

```sh
npm test
npm run build
PLAYWRIGHT_PORT=3001 npx playwright test tests/browser/calico.spec.ts
npm run docker:rebuild
GAMEVERSE_E2E_DOCKER=1 npx playwright test --config playwright.docker.config.ts tests/browser/calico.spec.ts
```

Docker ใช้ข้อมูลใน volume เดิมที่ port5555 และโดเมนที่ตั้งใน .env.docker (เครื่องนี้ https://bn-games.basnana.com). คำสั่ง browser สร้างเจ้าของแบบ isolated fixture ไม่ใช่การทดสอบ Google provider และปิดเฉพาะห้องทดสอบเมื่อจบ. ไม่ deploy/push Vercel จนกว่าจะสั่ง.


## 7 Wonders Duel — ภาคหลัก 2015 (2 คน)

เปิด **https://bn-games.basnana.com/games/seven-wonders-duel** หรือ **http://localhost:5555/games/seven-wonders-duel** หลังรัน Docker. เจ้าของล็อกอินสร้างห้อง ผู้เล่นสองคนเข้าด้วย Guest/Google และกดพร้อม จากจอกลางเลือกผู้เริ่มแล้วเริ่มเกม จากมือถือเลือก Wonders คนละสี่ใบ ตามลำดับ 1/2/1 แล้วกลับฝ่ายในชุดที่สอง

แต่ละตาแตะการ์ดจากผังเพื่ออ่านรายละเอียด เลือกสร้างอาคาร / ทิ้งรับเหรียญ / ใช้สร้าง Wonder ตรวจราคาที่ server คำนวณ แล้วกดยืนยัน. ไพ่ที่ยังถูกบังดูรายละเอียดได้เฉพาะใบหงาย แต่หยิบไม่ได้. มือถือเลือก Progress / เป้าทำลาย / กองทิ้ง / ผู้เริ่มยุคเมื่อมีผลนั้น. Great Library เปิดตัวเลือกสามชิ้นเฉพาะผู้เลือก. ชนะได้ทั้งทหาร วิทยาศาสตร์ หรือคะแนนหลังสามยุค. เล่นอีกครั้งล้างเกมโดยเก็บห้อง/ที่นั่ง/เซสชันเดิม

ใช้ catalog อาคาร73ใบ Wonders12ใบ Progress10ชิ้น และผังสามยุคจากคู่มือ ไม่รวมภาคเสริม/promos/AI. ภาพสร้างใหม่ในโปรเจกต์: Wonders แยก12ภาพ, อาคารและ Guilds ใช้28ฉากร่วมตามประเภทพร้อมชื่อ/ราคา/สัญลักษณ์จากโค้ด, Progress10ภาพ พื้นกระดานและชิ้นส่วน. ไม่มีภาพลับระบุที่หน้าไพ่คว่ำหรือใน payload. ขนาดภาพรวมเกมประมาณ2.6MB พร้อม preload/cache และ fallback ในเครื่อง

กติกาและแหล่งอ้างอิง: [rules.md](docs/games/seven-wonders-duel/rules.md). แนวภาพ/asset mapping: [design.md](docs/games/seven-wonders-duel/design.md), [asset-map.json](docs/games/seven-wonders-duel/asset-map.json). ผลตรวจจริง: [progress.md](docs/progress.md)

```sh
npm test
npm run build
PLAYWRIGHT_PORT=3001 npx playwright test tests/browser/seven-wonders-duel.spec.ts
npm run docker:rebuild
GAMEVERSE_E2E_DOCKER=1 npx playwright test --config playwright.docker.config.ts tests/browser/seven-wonders-duel.spec.ts
# Optional: regenerate WebP assets from the three source atlases already in assets/source/
npx tsx scripts/prepare-wonders-art.ts
```

Browser tests ใช้บัญชีเจ้าของแบบ fixture เฉพาะการทดสอบ ไม่ใช่หลักฐานการล็อกอิน Google provider. เส้นทางเล่นปกติเล่นตั้งแต่ setup ครบสามยุค; ชนะทหาร/วิทยาศาสตร์และ Great Library ใช้สถานการณ์ท้ายเกมควบคุมใน test server เพื่อเจาะผลเฉพาะ ไม่ได้เพิ่ม debug endpoint. ทดสอบ Chromium desktop/iPad/mobile จำลอง; ยังไม่ตรวจ Safari, iPad และ LG TV จริง. ไม่ deploy Vercel/push จนกว่าจะสั่งใหม่


## Jaipur — Space Cowboys 2019 ภาคหลัก (2 คน)

เปิด **https://bn-games.basnana.com/games/jaipur** หรือ **http://localhost:5555/games/jaipur**. เจ้าของล็อกอินสร้างห้อง จอกลางไม่กินที่นั่ง ผู้เล่นสองคนเข้าด้วย QR/รหัสห้อง กดพร้อม แล้วเจ้าของเลือกผู้เริ่มและเริ่มเกม. มือถือเลือกสินค้าเพื่อหยิบ หรือเลือก “แลก” เพื่อรับสินค้าอย่างน้อยสองใบและคืนไพ่/อูฐเท่ากัน หรือเลือก “ขาย” แล้วแตะไพ่ชนิดเดียว/ปรับจำนวน ตรวจราคาและกดยืนยัน. ตัวเลือกเป็นส่วนตัวจนยืนยัน ส่งคำสั่งและตัดสินผลที่ server เท่านั้น

มือไม่เกินเจ็ดใบ อูฐอยู่ในฝูงแยก เพชร/ทอง/เงินขายขั้นต่ำสองใบ ขายสาม/สี่/ห้าใบขึ้นไปได้โบนัสหมวดนั้นถ้ายังเหลือ. คู่แข่งและจอกลางไม่เห็นมือ จำนวนอูฐ มูลค่าโบนัส หรือเงินรวมระหว่างรอบ. ตอนจบรอบเปิดคะแนน แจกตราชนะ ผู้แพ้เริ่มรอบถัดไป ชนะสองรอบจบแมตช์. กรณีคะแนน จำนวนโบนัส และจำนวนโทเคนเท่ากันทั้งหมด ใช้ข้อวินิจฉัยที่ผู้ใช้อนุมัติ: รอบเสมอ ไม่แจกตรา และตกลงเลือกผู้เริ่มใหม่. ปุ่มเล่นอีกครั้งล้างตลาด มือ กองจั่ว โทเคน ประวัติ และตรา โดยเก็บห้อง/ที่นั่ง/เซสชันเดิม

กติกา/ฉบับ/จำนวนชิ้นส่วนและแหล่งอ้างอิง: [rules.md](docs/games/jaipur/rules.md). ภาพและ motion: [design.md](docs/games/jaipur/design.md), [asset-map.json](docs/games/jaipur/asset-map.json). ภาพสร้างใหม่สินค้าเจ็ดประเภท หลังไพ่ โทเคน ปกและผ้าปูโต๊ะประมาณ1.1MB; ตัวเลขและข้อความไทย render ด้วยโค้ด. ไม่มี AI/ภาคเสริม/undo หลังเปิดข้อมูลใหม่

```sh
npm install
npm run dev                        # http://localhost:3000
npm test
npm run build
PLAYWRIGHT_PORT=3001 npx playwright test tests/browser/jaipur.spec.ts
npm run docker:rebuild             # http://localhost:5555, preserves volume
GAMEVERSE_E2E_DOCKER=1 npx playwright test --config playwright.docker.config.ts tests/browser/jaipur.spec.ts
node scripts/prepare-jaipur-art.mjs # regenerate WebP crops from saved original artwork
```

Browser tests use isolated fixture accounts, not a live Google provider login. ดูผลทดสอบจริงและข้อจำกัดใน [progress.md](docs/progress.md). ไม่ deploy/push Vercel จนกว่าจะสั่ง


### Jaipur: โต๊ะกระชับและสรุปผลคะแนน

ระหว่างเล่นทุกเกม รหัสห้อง/คัดลอกลิงก์/QR อยู่ในเมนู **ข้อมูลห้อง** ด้านบน พร้อมปุ่มลำโพงปิดเสียงได้. Jaipur ใช้กรอบรอบผู้เล่นปัจจุบันแทนข้อความเทิร์นด้านบน ส่วนเกมอื่นคงสถานะ **ตาคุณ / ตา [ชื่อ]**. ห้องรอยังคงแสดงคำเชิญเดิม.

Jaipur บนมือถือแสดงกองสินค้าทั้งหกในแถวเดียว ส่วน Display แสดงแถวละสามกองและโทเคน/ค่าทั้งกองซ้อนในบรรทัดเดียว แตะดูราคาเพิ่มเติมได้ โบนัสกับรางวัลอูฐอยู่ก่อนตลาด ข้อมูลคู่แข่งอยู่เหนือโต๊ะทางซ้ายคู่กับฝูงอูฐทางขวา ส่วนข้อมูลของคุณอยู่ใต้โต๊ะทางขวาคู่กับอูฐทางซ้ายและมีขนาดใหญ่กว่า เปิดจำนวนอูฐทั้งสองฝ่ายตามรูปแบบเว็บที่ผู้ใช้ขอ (ต่างจากสิทธิ์ดูจำนวนในคู่มือ) กองอูฐเตี้ยลงและซ้อนตามจำนวน แสดงครบทุกใบ รวมสิบเอ็ดใบโดยไม่มี +1. มือเรียงตามสินค้าเสมอ เลือกสินค้า 1 ใบเพื่อหยิบ หรือ 2+ ใบเพื่อแลก แล้วตรวจรับ/คืนก่อนยืนยัน โดยเติมอูฐที่มีให้เป็นค่าเริ่มต้นและยังปรับลด/คืนไพ่แทนได้; แตะอูฐเพื่อเลือกอูฐทั้งหมด. การเลือก/ยืนยันไม่สั่งเลื่อนหน้าจอ. ระหว่างรอตาผู้เล่นอื่น ไพ่บนมือถือจางลงและกลับมาชัดเมื่อถึงตาคุณ; จอกลางไม่จาง. แถบผู้เล่นแบ่งพื้นที่โปรไฟล์กับฝูงอูฐคงที่ 50/50 ทั้งสองฝ่าย จำนวนอูฐไม่เปลี่ยนความกว้างช่อง; บนจอเล็กซ้อนอูฐให้ครบในครึ่งของตนเอง. โปรไฟล์แสดงรูป/ชื่อ/สถานะ ตามด้วยกล่องข้อมูลเดียวที่รวมไพ่ สินค้า โบนัส และรอบที่ชนะในแถวเดียว เพื่อลดความสูงโดยไม่วางตัวเลขทับภาพ.

จบรอบมี popup นับสินค้า → โบนัส → อูฐ → รวม จากผล server ทั้งจอกลางและมือถือ. กด **ข้ามการนับ** หรือ **ตกลง** เฉพาะจอของคุณ คะแนนยังอยู่และเปิดดูอีกครั้งได้. ต้องกด **เริ่มรอบถัดไป** เอง; จบการแข่งขันผู้มีสิทธิ์กด **เริ่มเกมใหม่** ในห้องเดิม. Reconnect ไม่เริ่มนับใหม่และไม่เพิ่มตราชนะซ้ำ.

```sh
npm run build
PLAYWRIGHT_PORT=3001 npx playwright test tests/browser/jaipur.spec.ts
npm run docker:rebuild
GAMEVERSE_E2E_DOCKER=1 npx playwright test --config playwright.docker.config.ts tests/browser/jaipur.spec.ts
```

ผลการทดสอบ/ข้อจำกัดล่าสุดอยู่ใน [docs/progress.md](docs/progress.md). Docker ใช้ port5555 และ volume เดิม; ไม่ deploy Vercel อัตโนมัติ.

## Pixies — ภูตจิ๋วจอมป่วน (Bombyx ภาคหลัก)

เปิด `/games/pixies` ผ่าน Docker ที่ https://bn-games.basnana.com หรือ http://localhost:5555. ใช้ Google/Guest/QR/ห้องรอเดิม รองรับ2–5คน จอกลางไม่กินที่นั่ง. ทุกคนกดพร้อม ผู้สร้างเริ่มแบบสุ่มหรือเลือกผู้เริ่ม. แตะไพ่กลาง → ตรวจวิธีวาง/เลือกเก็บใบหงายหรือช่องคว่ำ → ยืนยัน; ยกเลิกก่อนวางได้. ช่องสวน3×3ใช้เลข1–9ตรงกันทุกจอ มีแท็บคู่แข่งและขยายไพ่/สวน. จบรอบดูคะแนนจากserverและกดรอบต่อไปเอง รวม3รอบ เสมอชนะร่วมกัน. ผู้สร้างเริ่มเกมใหม่เมื่อจบ.

Catalog70ใบและกติกาอยู่ [rules.md](docs/games/pixies/rules.md), ภาพ/สัญลักษณ์/เสียงอยู่ [design.md](docs/games/pixies/design.md), สถานะภาพรายใบอยู่ [asset-manifest.json](docs/games/pixies/asset-manifest.json). ไพ่คว่ำไม่ส่งหน้า/IDให้client; pending/reconnectและคะแนนเก็บถาวรในระบบเดิม. เมนูลำโพงแยกBGM/SFXและระดับเสียง จำค่าเครื่อง ใช้เสียงสังเคราะห์ Web Audio ไม่ใช่ไฟล์เพลง. BGMเริ่มปิดเพื่อไม่ซ้อนหลายเครื่อง เปิดที่จอกลางเป็นหลัก. ผู้เล่นที่ไม่มีรูปในทุกเกมใช้avatarคนเริ่มต้นของระบบแทนอักษรแรกของชื่อ.

Pixies UI ล่าสุด: ไพ่กลางคงช่องเดิม ยกขึ้นเมื่อเลือกและแตะซ้ำยกเลิก. เลขซ้ำเปิด popup เทียบใบเก่า/ใหม่ก่อนยืนยัน. หน้าสรุปมีมงกุฎและปุ่มเดียวเพื่อเริ่มรอบถัดไปหรือเริ่มเกมใหม่ตามสิทธิ์. ใช้ DOM เดิมลดการกระพริบ แจกชุดกลางจากกองจั่ว และแสดงไพ่แนวตั้งเต็มบนมือถือ. Dracula จะแสดงไพ่ของคุณที่จะส่งก่อนยืนยันแลก และเก็บบันทึกส่วนตัวว่าไพ่สี/เลขอะไรถูกส่งและรับ.


Pixies: เลือกเปลี่ยนไพ่กลางได้ทันทีและกด “ตกลง” ที่ช่องวางแต่ละช่องได้เลย; ไพ่4ใบในมือถือแสดง2×2เพื่ออ่านแต้มชัดขึ้น. หน้าสรุปคะแนนแตะดูแอนิเมชันเฉพาะเลขยืนยัน/เกลียว/กากบาท/เกลียวตามสี/กลุ่มสีได้ และผลครบ3รอบค้างจนเริ่มเล่นใหม่. ไพ่ซ้อนแสดงเฉพาะหลังไพ่ที่คว่ำ ไม่เปิดข้อมูลลับ.

Pixies ใช้แถบเลือกใบเดิม/ใบใหม่เหนือกองจั่วแทน popup, สัญลักษณ์อยู่ขวาบนไพ่ และเพลงพื้นหลังเป็นทำนองใสแบบดีดสั้น พร้อมเสียงเลือก/วาง/แจกชุดใหม่/สรุปผลที่ปิดแยกจากเพลงได้.

Harmonies: /games/harmonies • 2–4 คน • กระดาน A/B • มุม 3D • เลือกชิ้นไม้/สัตว์ → ช่อง → ดูตัวอย่าง → ยืนยันในกรอบกระดาน • ไม่รวม Solo/Spirits/ภาคเสริม. กติกา: docs/games/harmonies/rules.md.


## Sky Team — เที่ยวบินฝึกแรก

เลือก Sky Team ที่ `/games/sky-team`, เจ้าของสร้างจอกลาง แล้วมือถือ2เครื่องเข้าห้องและกดพร้อม. คนเข้าคนแรกเป็นPilotสีฟ้า คนที่สองเป็นCo-pilotสีส้ม; ตกลงบทบาทก่อนเข้าห้อง. เจ้าของเริ่มเกม จากนั้นก่อนทุกรอบทั้งคู่พร้อมเพื่อทอยส่วนตัว. แตะลูกเต๋า→ปรับกาแฟถ้าต้องการ→เลือกช่องกรอบสว่าง→ยืนยัน. หลังทอยงดสื่อสารจนจบรอบ ยกเว้นแก้กติกา; จอกลางและคู่เล่นไม่เห็นลูกเต๋าที่ยังไม่วาง. รองรับเฉพาะYUL Montréal–Trudeau/altitudeเขียวเหลือง7รอบ ไม่รวมสนามบินหรือโมดูลเสริม. ดู[กติกาและแหล่งอ้างอิง](docs/games/sky-team/rules.md), [ธีมและassets](docs/games/sky-team/design.md).


### Critter Kitchen

เปิด `/games/critter-kitchen` เพื่อสร้างห้องภาคหลัก 2–5 คน เลือกโหมดโต๊ะกลางหรือเล่นบนมือถือได้ตั้งแต่สร้างห้อง และแต่ละเครื่องปรับโหมดของตนได้ ผู้สร้างเข้าร่วมเล่นด้วยโทรศัพท์ได้เช่นเดิม หลังทุกคนพร้อม ผู้จัดเลือกโมดูลเจ้าของร้านและโหมดเริ่มต้น (Mouse / ข่าวลือพื้นฐาน) ได้ในห้องรอ พร้อมคำอธิบายผลเมื่อเปิด/ปิด ตัวอย่างความสามารถ และคำแนะนำสำหรับเกมแรก

หน้าเกมบอกขั้นตอนปัจจุบัน แตะการ์ดหรือของในครัวเพื่อดูภาพใหญ่ และกดยืนยันใน popup ก่อนส่งแผน หยิบของ เสิร์ฟอาหาร หรือจัดตู้เย็น วัตถุดิบใช้ขอบและเงาตื้นให้ดูมีมิติโดยไม่ใช้ตัวเรนเดอร์ 3D ภาพขนาดเล็กใช้ไฟล์ย่อและโหลดต้นฉบับเฉพาะตอนเปิดดู

เกมมี 7 รอบ วางแผนเชฟลับพร้อมกัน เลือกของตามคิว เตรียม Challenge จบรอบ3/6 จัดตู้เย็น และมื้อผู้วิจารณ์จบรอบ7 ใช้ public/private projections และระบบบันทึกห้องเดิม กติกาภาษาไทย แหล่งอ้างอิง และข้อวินิจฉัยเว็บที่ผู้ใช้ยืนยันอยู่ใน [Critter Kitchen rules](docs/games/critter-kitchen/rules.md). ไม่รวม Solo หรือส่วนขยาย. ตรวจสถานะการทดสอบจริงล่าสุดใน [progress](docs/progress.md).

## Name It! — มหึหมา (ชุดเว็บ 69 ใบ)

เปิด `/games/name-it` เพื่อจัดที่นั่ง 2–6 คนบนเครื่องเดียว ไม่ต้องล็อกอิน สร้างห้อง หรือใช้มือถือแยกคน จัดรายชื่อ/avatar/ลำดับที่นั่ง เลือกคนเปิดก่อน แล้วทบทวนภาพก่อนเริ่ม ทุกคนพูดหรือแตะตามภาพ คนในวงเลือกผู้รับและยืนยันผลทุกใบ ระบบไม่ฟังเสียงหรือยืนยันว่าใครเป็นคนแตะเปิดการ์ด

เกมเก็บสถานะเฉพาะระหว่างเปิดหน้านี้ ไม่บันทึกประวัติหรือเล่นต่อ เมื่อออกหรือรีเฟรชจะเริ่มใหม่ คนที่นั่งแรกเปิดการ์ดก่อนเสมอ กด GO จัดที่นั่ง จากนั้นเลือกทบทวนสุนัขหรือกด GO เริ่มเล่นทันที การ์ดสุนัขธรรมดา/สายจูง กลูต้า และกอลลั่ม +1; แมว −1 เล่นจนตัดสินใบสุดท้ายแล้วสรุปคะแนน

สำรับเว็บ **69 ใบ** ตามสัดส่วนที่ผู้ใช้ยืนยัน: สุนัข12สายพันธุ์×(ธรรมดา3+สายจูง2) รวม60ใบ และแมว3/กลูต้า3/กอลลั่ม3 รวม9ใบ ภาพธรรมดาและสายจูงเป็นสุนัขตัวเดียวกันเพื่อให้จำได้ ชุดเว็บใช้ภาพและรายชื่อที่จัดทำขึ้นเอง แยกจากสำรับกล่องต้นฉบับ ดู [กติกาและข้อวินิจฉัยเว็บ](docs/games/name-it/rules.md) และ [generated asset manifest](docs/games/name-it/asset-manifest.json)

เมื่อเข้าขั้นตัดสินแล้วจะกลับไปแข่งใบเดิมไม่ได้ คนในวงต้องยืนยันก่อนให้คะแนน แตะสูสีหรือเครื่องรับนิ้วไม่ครบให้ตัดสินด้วยคน ทดสอบbrowserไม่ใช่หลักฐานความเป็นธรรมของmulti-touchบนอุปกรณ์จริง เสียงเอฟเฟกต์กับดนตรีปรับแยกกัน ดนตรีเริ่มปิดไว้

## Locus ภาคหลัก

เปิด `/games/locus` เพื่อสร้างห้อง 2–5 คน ใช้แผ่นห้าสี สำรับ48ใบ เหรียญ โบนัสต่อเนื่อง และคะแนนตาม Tucker’s Fun Factory ภาคหลัก ทุกคนเลือกการ์ดแล้วแตะขยายโซน หมุน/สะท้อน แตะช่องซ้ายบนของรูปทรงและยืนยันกากบาทได้ ระบบห้อง/บัญชี/Guest/reconnect เดิม โหมดเริ่มต้นเลือกตอนสร้างห้อง และแต่ละเครื่องสลับเล่นร่วมจอกลางหรือเล่นครบจากมือถือได้โดยเก็บ preview เดิม

หนึ่งรอบต้องเวียนให้ทุกคนเป็นคนเลือกคนแรกครบ ไม่ใช่เปิดการ์ดชุดเดียว จบแล้วดูคะแนน5สีและโซนต่ำสุดนับเพิ่ม เจ้าห้องเริ่มใหม่หรือต่ออีก1รอบเมื่อเสมอตามคู่มือ Tucker EN ได้ ไม่รวม Solo รายละเอียดพิกัด สำรับ แหล่งคู่มือ และการตีความ timing อยู่ใน [กติกา Locus](docs/games/locus/rules.md)

### Harmonies shared display
The landscape display shows the supply, animal market, player boards and owned animals side by side. In the hamburger menu, the room creator can change the display mode from read-only to shared play. The authenticated creator display can then pick, place, claim animals and end the current player's turn; phones keep all their controls. The mode persists with the room. Public display links remain read-only.
