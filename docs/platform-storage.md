# GameVerse storage / recovery / access policy

## Runtime

Node 24.18+ native SQLite + Better Auth 1.7.7. หนึ่ง Node instance ต่อฐานข้อมูลเท่านั้น ไม่ใช้ serverless handlers. `GAMEVERSE_DB_PATH` default `data/gameverse.sqlite`; `GAMEVERSE_UPLOAD_DIR` default `data/avatars`. Directory private 0700, DB/avatars/checkpoint 0600. `data/` และ `.env` ไม่ commit หรือ COPY เข้า image

- Better Auth เก็บ user/account/session/verification ในฐานเดียวกัน รวม session Guest (`isAnonymous`) และ Google provider ID; ไม่มีการตั้ง identity จากชื่อ/email
- Platform migrations ใน `migrations/001-platform.sql`; auth schema สร้าง/เพิ่มด้วย `getMigrations(options)` ของ library ก่อนเปิดใช้งาน มี unsafe-migration guard. ไม่ drop ข้อมูลเดิม
- Profiles, admin roles, recent starts, game status และ guest links เป็นตาราง platform. สมาชิกห้อง/ที่นั่งอยู่ใน private room record โดย playerId ไม่เปลี่ยนเมื่อ account เปลี่ยน
- Room JSON เก็บ code/gameId/rulesVersion/schemaVersion/revision/players/engine state/event/sessions/512 receipts. Sockets ไม่ persist. DB มี private cards และ credentials จึงห้ามเปิดให้ browser อ่านหรือใส่ใน web root

RoomService บัฟเฟอร์ messages ขณะทำ transition; transaction บันทึก state/revision/receipt/recent ก่อนส่ง ACK/state. บันทึกล้มเหลวจะ rollback database และ restore memory แล้วส่ง error/snapshot โดยไม่ส่ง successful ACK. RNG ยังคง crypto ที่ server. Disconnect เปลี่ยนเฉพาะ transport; restore ทุกที่นั่งเป็น disconnected จน authenticated resume

## Identities and surfaces

- ห้องใหม่ต้อง Google/nonGuest account สร้าง; ค่า userId จาก verified cookie เท่านั้น
- ผู้ร่วมเล่น Google หรือ Guest. Guest cookie เป็น HttpOnly/SameSite Lax อายุ 30 วัน พร้อม capability reconnect ใน storage เดิม `games:player:<CODE>`; resume ของห้องใหม่ต้อง cookie identity ตรงกับสมาชิก ไม่รับชื่อแทน identity
- ห้องก่อนมีบัญชีเก็บ credential เดิมและ playerId เดิมไว้. เมื่อผู้ถือ credential เดิม resume ด้วยบัญชี/Guest ที่ verified จะผูกที่นั่งกับ userId โดยไม่แจกการ์ดหรือ reset; หากบัญชีนั้นมีอีกที่นั่งอยู่แล้วปฏิเสธการผูก. ก่อนผูกยังกลับด้วย capability เดิมได้เพื่อรักษา compatibility
- Owner, player seat และ shared display เป็นคนละสิทธิ์. Owner เข้าห้องบนมือถือของตนได้และไม่กินที่นั่งตอน create. Owner เปิด `/display/<CODE>` บน browser ที่ล็อกอินเพื่อรับ display capability ได้ ส่วนอุปกรณ์กลางอื่นเปิด URL เดียวกันเพื่อดู public board โดยไม่ต้อง login
- Owner account ที่เป็น player เริ่ม/เล่นอีกครั้งจากมือถือได้โดยตรวจ userId ที่ server; สิทธิ์ของตนส่งเฉพาะใน me ไม่อยู่ใน public projection. Display capability มีสิทธิ์เริ่ม/เล่นอีกครั้งและแสดง public state แต่ไม่มี private cards. URL/QR ไม่มี capability. Logout ตัด account transports; public display ที่เปิดใหม่ด้วย capability เดิมยังใช้ได้ตามบทบาทอุปกรณ์กลาง
- ทุก player command/resume ตรวจ cookie session กับ Better Auth. Logout revoke socket ด้วย sessionId ทันที; broadcast ไม่ส่ง private projection ให้ identity ที่ไม่ตรงหรือหมดอายุ
- Account สมาชิกเดิม join ด้วย cookie บนเครื่องใหม่จะได้ playerId เดิม แม้เกมเริ่ม/ห้องเต็ม. Guest ไม่สามารถย้ายเครื่องโดยใช้ชื่อเดิม; logout Guest ที่ยังไม่เชื่อมบัญชีทำให้กลับที่นั่งเดิมไม่ได้ UI แจ้งก่อนยืนยัน
- Profile update ห้ามส่ง userId/role/image URL จาก client; raw upload ตรวจ type, decode, limit 2 MiB/16M pixels, แปลง 256×256 WebP และ strip metadata. Upload เดิมลบเมื่อเปลี่ยน/reset. รูป Google ยอมรับเฉพาะ HTTPS googleusercontent hosts ที่กำหนดไว้ มี no-referrer

## Guest upgrade

หลัง Better Auth ยืนยัน provider จะเรียก anonymous plugin hook เพื่อ transfer userId ของสมาชิกและ session โดยไม่แก้ seatId/cards/turn/revision. Recent history รวมโดยใช้เวลาที่ใหม่ที่สุด. ใช้โปรไฟล์บัญชีที่ล็อกอินหลังเชื่อม

ถ้าบัญชีปลายทางมีอีกที่นั่งในห้องเดียวกันจะ **ปฏิเสธการ transfer ทั้งชุด** ไม่รวมสองที่นั่ง. Callback hook คืน Guest cookie ด้วย library helper และแจ้ง conflict; Guest user ไม่ถูกลบอัตโนมัติ. ให้แก้ conflict ด้วยการออกจากห้องรอก่อนเชื่อม; ถ้าเกมเริ่มให้เล่นจนจบก่อน. การคืน cookie ผ่าน Google callback จริงยังต้องตรวจด้วย credentials/provider จริง การทดสอบที่มีตรวจ transfer/conflict และ cookie/session ของ Guest ไม่ถือเป็น provider E2E

## Lifecycle

- ทุกสถานะ (lobby/playing/settling/results/finished) ไม่มีการเข้าร่วมจริงหรือคำสั่งที่สำเร็จ **เกิน 30 วันสำหรับ Harmonies หรือ 10 ชั่วโมงสำหรับเกมอื่น**: ลบ room record/presence และปิด sockets; recent game history ยังอยู่
- การ watch/resume/sync/heartbeat และ retry ID เดิมไม่ต่ออายุ จึงไม่เก็บห้องตลอดไปจาก TV ค้างหรือ Vercel reconnect. ไม่มีการข้ามตาผู้เล่นที่หลุด
- ตรวจล้างเมื่อเปิด server/รับรายการ/refresh shared state และทุกนาทีที่ process ทำงาน; Vercel ที่ scale to zero จะล้างเมื่อมี request ถัดไป ไม่รับประกัน cron ลบตรงวินาทีที่ครบเวลา
- ผู้เล่นออกถาวรได้เฉพาะ lobby; เมื่อเล่นแล้วการออกจากหน้าหรือ logout เก็บที่นั่งเดิม
- Owner ปิดห้องได้ผ่าน authenticated API; UI lobby มีการยืนยันก่อนปิด. Host หลุดไม่เปลี่ยน owner อัตโนมัติ; owner account กลับจากอุปกรณ์อื่นได้. ไม่มีการโอน host ในรุ่นนี้
- Start/rematch ต้องเงื่อนไขผู้เล่นของเกมครบและ connected; Dracula ต้องสองบทบาทพร้อม. Maintenance บล็อกห้องใหม่อย่างเดียว ไม่หยุด game/rematch ในห้องเดิม

## Versions / backup

Restore ตรวจ metadata rulesVersion + schemaVersion และ structural invariants (IDs/sessions/cards/camels/resources). เวอร์ชันไม่ตรงหรือ state เสียจะ quarantine **โดยไม่ลบ DB row**. Admin เห็น reason ไม่มีการ์ด/token. Engine ใหม่ต้องประกาศเวอร์ชันและตรวจ migration ในสำเนาข้อมูลก่อนใช้งาน ห้ามแก้หมายเลขให้ผ่านอย่างเดียว

รักษา auth secret เดิมเพื่อให้ cookie ยังใช้ได้; `npm run setup:env` นำ development secret เดิมจาก DB ลง private .env โดยไม่แสดงค่า ก่อนเปลี่ยนวิธีตั้งค่า ห้ามสุ่ม secret ใหม่แล้วคาดว่า cookies เก่ายังใช้ได้

ก่อน upgrade ให้หยุดรับคำสั่ง/close server อย่างเรียบร้อย แล้วสำรอง DB พร้อม uploads และ secret. ขณะ server รันให้ใช้ SQLite backup API (`db.backup`/เครื่องมือ SQLite `.backup`) หรือ checkpoint WAL แล้ว copy หลังหยุด; อย่า copy เฉพาะ main file โดยละเลย WAL ที่ยังเขียนอยู่. ยังไม่ตั้ง automatic backups, retention quota หรือ distributed room ownership

โปรเซสเดิมแบบ memory-only มีเครื่องมือ one-time `node scripts/checkpoint-live.mjs <PID>` หลัง build: เปิด inspector บน loopback ชั่วคราว, เขียน backup private, freeze mutation, import SQLite และ validate. หากล้มเหลวคืน handler เดิม. หลัง checkpoint สำเร็จต้องสลับโปรเซสทันทีหรือ unfreeze ก่อนใช้ต่อ ไม่ใช่คำสั่งสำรองทั่วไปสำหรับ production. ข้อมูล backup มี secrets ห้ามแชร์/commit

## Administrator

หลัง Google login อ่าน internal userId ของตนจาก `/api/platform` บน browser ที่ล็อกอิน ตั้ง `GAMEVERSE_BOOTSTRAP_ADMIN_USER_ID` ใน server .env แล้ว restart. Bootstrap ให้สิทธิ์เฉพาะ user ที่มีอยู่และไม่เป็น Guest. `/admin` และ `/api/admin*` ตรวจสิทธิ์ server-side; profile API ไม่มี field role. Admin toggle ready/maintenance และดู diagnostics สาธารณะเท่าที่จำเป็น ไม่มีการ์ดหรือ credentials

## Thai font

Noto Sans Thai 400/700 regular TTF (ประมาณ 45 KB ต่อไฟล์) ดาวน์โหลดจาก Google Fonts CSS/API แล้วเก็บที่ public/fonts; ไม่มี font network request ใน runtime. SIL Open Font License 1.1 ของ Noto Project Authors แนบที่ public/fonts/OFL.txt. CSS font-display:swap และ fallback Tahoma/Leelawadee UI. [Official font license](https://raw.githubusercontent.com/google/fonts/main/ofl/notosansthai/OFL.txt), [font request used](https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;700&display=swap)

## Local Google owner + LAN phones

เมื่อยังไม่มี HTTPS domain ใช้ Google บนคอมที่ `BETTER_AUTH_URL=http://localhost:3000`. ตั้ง `GAMEVERSE_JOIN_ORIGIN=http://<LAN-IP>:3000` และ originเดียวกันใน `GAMEVERSE_TRUSTED_ORIGINS` เพื่อให้ QR/ลิงก์ชวนจาก owner localhost ไปถึง Guest phones จริง. Public display บน LAN ดูได้โดยไม่ล็อกอิน ผู้สร้างเริ่มจาก tab ที่ถือ display capability. ไม่ใส่ LAN HTTP IP ใน Google Console; Google บน phone ต้อง HTTPS domain ที่กำหนดไว้ ที่ originอื่น UI ปิด Google เพื่อป้องกัน callback ไป localhost ของมือถือ
