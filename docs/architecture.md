# สถาปัตยกรรม MVP ที่ใช้งานจริง

## Stack และ boundary

Node.js 24 + TypeScript, HTTP + `ws` ใน process เดียว; Vite build ฝั่ง client เป็น DOM/CSS. `qrcode` สร้าง QR ที่ browser โดยไม่เรียก external API. ใช้ Better Auth สำหรับ Google/Guest และ native Node SQLite สำหรับบัญชี/profile/rooms/receipts; ไม่มี cloud subscription หรือ client state-management framework

`src/games/registry.ts` ลงทะเบียน adapter ของเกม; engine Camel Up ไม่มี browser/network/storage imports. `createInitialState`, `getLegalActions`, `applyAction`, `getDisplayView`, `getPlayerView`, `isFinished` ทำงานได้จาก Node test. State clone หลัง validate ทำให้ invalid transition ไม่ mutation. Random source inject เข้า engine; production ใช้ crypto.randomInt บน server เท่านั้น

## ห้องและ surfaces

- `/`: create/join lobby
- `/display/<code>`: public board; ผู้สร้างมี host credential เพื่อ start; ผู้เปิดลิงก์โดยไม่มี credential ดูได้อย่างเดียว
- `/play/<code>`: phone controller; join name ครั้งแรก; authenticated player projection เมื่อมี token
- host และ player เป็นคนละ session แม้ operator คนเดียวกัน; host เข้าร่วมบนมือถือได้
- lobby → playing → settling (เลือกบัตรพันธมิตร) → playing/finished. Expiration ปิด transport และลบห้อง

## Protocol/authority

WebSocket `/ws`: create/join/watch/resume/command. Server ให้ code สาธารณะและ token สุ่ม 256 bit ผ่าน socket เฉพาะผู้รับ. ไม่ใส่ token ใน join URL/QR. LocalStorage แยก key ตาม room/role; ผู้เล่นกลับด้วย token ไม่ใช้ชื่อเป็น identity. หนึ่ง session ใช้ได้หนึ่ง socket พร้อมกัน; socket เก่าปิด 4001 และไม่ auto reconnect เพื่อป้องกันสองแท็บแย่ง session

Phone `{id,revision,action}` → authenticated role + member → dedup receipt → revision check → engine legal validation → synchronous transition → revision +1 → ack → individual projections. Start ต้องเป็น host และทุก player connected มี 3–8 คน. Engine ใช้ actor ID จาก session ไม่ใช้ payload

Client เก็บ pending command ก่อนส่ง. หลังหลุดหรือ reload รอ snapshot ที่ได้รับอนุญาตแล้ว retry ด้วย ID/revision เดิม. Server เก็บ 512 receipts/session (ทั้ง accept/reject). Duplicate คืน receipt เดิมก่อนตรวจ revision. เมื่อถูก stale rejection client ล้าง pending แล้วให้เลือกใหม่ ไม่ replay เป็นคำสั่งใหม่เอง

Display projection แสดง board, เงิน, leg tickets/pyramids, turn, partnerships, used/remaining dice identities, จำนวน final cards. ไม่มี cards/bets ของผู้เล่น, token, session table หรือ future rolls. Player projection เพิ่มเฉพาะ own cards/bets/legal actions. หลังจบเกมเปิด final results ตามกติกา

## Reliability และ limits

การเชื่อมต่อหลุดไม่ reset หรือข้าม turn. WS heartbeat ทุก 30 วินาที ตรวจหลุดเงียบไม่เกินประมาณ 60 วินาที; client retry ทุก 1.5 วินาที. Bad frame/shape, payload >8 KiB, wrong turn/resources/role, unknown token และ stale revision ถูกปฏิเสธ. Origin ต้องตรง Host; bounded message/auth quotas ระบุใน README

SQLite-backed 200 ห้อง; commit state/revision/receipts ก่อน ACK/broadcast และ restore หลัง restart. ทุกสถานะใช้ idle TTL10h จาก join/accepted command; automatic resume/watch/sync ไม่ต่ออายุ. ตรวจล้างทั้ง cold restore และระหว่างใช้งาน. Unsupported rules/schema/state quarantine โดยไม่ลบ. หนึ่ง coordinator instance เท่านั้น. Authentication และ lifecycle เพิ่มเติมอยู่ใน docs/platform-storage.md

## Deploy direction

Client assets และ compiled Node server รันจาก process เดียว. ใช้ VM/container ที่มี WebSocket และ TLS reverse proxy; มี Dockerfile แต่ยังไม่ได้ทดสอบ Docker runtime. ห้าม deploy เป็น serverless route ที่ไม่รองรับ persistent sockets. ต้องออกแบบ shared room ownership/persistence และ trusted proxy/rate limit policy ก่อน scale หลาย process. ยังไม่ได้ใช้ hosting ที่เสียเงินหรือเผยแพร่

## Authoritative presentation events (visual upgrade)

Engine เติม `lastMovement` ขณะทำ movement เดิม: unit, from/index, ordered path รวม tile step, destinationStack, under/tile. ไม่มีการเปลี่ยน payout/turn/random rules. Room เลือก public event fields ต่อ accepted revision เท่านั้น; final bet event มี actor/side แต่ไม่เปิด color/private cards. รวม actual money deltas กับ legEnded/finished. `pyramidRemaining` เป็น public resource count จาก engine

State delivery ใส่ `snapshot:true` สำหรับ attach/resume/sync และ retry receipt. `/ws` รองรับ `sync` โดยใช้ projection ตาม session ที่ผูกกับ socket. Broadcast connection status ใช้ revision เดิม; client ไม่ animate event ซ้ำ และไม่ย้อน visual/model เมื่อเห็น revision เก่า

Renderer เป็น object ที่เก็บ DOM กระดานไว้ ใช้ coordinate map 16 ช่องชุดเดียวสำหรับ placement/motion, ไม่ rerender ต่อ frame. Model/view ล่าสุดใช้ controls ทันที; visual queue เป็นคนละสถานะ. Missing revision/event ขอ sync; reconnect/cancel/reduced motion snap ล่าสุด. Queue bounds/acceleration ควบคุม lag โดยไม่เปลี่ยน state หรือคิด outcomes ใน client. ไม่มี public test/debug endpoint; browser motion fixture inject ผ่าน internal Node test server เท่านั้น

Production HTTP เพิ่ม static `/art/` พร้อม MIME WebP/SVG; client preload ทั้ง atlas ก่อน action. ไม่มี external asset/CDN request

## Rematch (finished → playing)

Host action `restart` ใช้ได้เฉพาะ finished และผู้เล่นทุกคน connected. เรียก createInitialState จาก engine เดิมด้วย RNG ของ server; เลือก startingPlayerId จากผู้เล่นในห้อง. รักษา room code, player IDs/names, sessions/tokens, sockets, monotonically increasing revision และ receipts ทุก session. ล้างเกม/การเดิมพัน/เงิน/ประวัติรอบเก่า เริ่มใหม่ตาม setup ของฉบับเดิม

Broadcast เป็น authorized snapshot พร้อม event restart (ไม่มี money payout animation); renderer ยกเลิกคิว/FX เก่าแล้ว snap กระดานใหม่. Retry restart ID เดิมคืน receipt ไม่ reset รอบใหม่ซ้ำ. Command ค้างจากเกมก่อนยังถูก dedup/stale validation และ reconnect คืนผู้เล่นเดิมในเกมใหม่. ไม่เพิ่มสิทธิ์ restart ให้ phone/spectator และไม่มี reset ระหว่าง playing/settling

## Multi-game portal และ Dracula core

`/` เลือกเกมและเข้าห้องด้วยรหัส; `/games/<game-id>` สร้างห้องของเกมนั้น. Create รับ gameId ที่ validate กับ registry; ไม่ระบุยัง default Camel Up เพื่อรองรับ client/protocol เดิม. Join code นำเข้าห้องตามเกมจริง ไม่เชื่อชื่อเกมจากมือถือ. เส้นทาง display/play และ credential storage เดิมคงอยู่

Room ใช้ gameId เลือก engine/projector และ maxPlayers. ชื่อ/ID/roles/sockets/receipts/revisions/rate limits/sweep เป็นระบบร่วม. ใช้ Camel state ใน `game` หรือ Dracula state ใน `duel` เฉพาะ engine ที่เลือก; ไม่เอา fields เงิน/อูฐไปผสมใน DTO ของเกมใหม่. `RoomView` discriminated union ด้วย gameId; renderer เลือกจาก discriminator. Camel boardRenderer ไม่รับ Dracula view

Dracula lobby เก็บ character/ready ของแต่ละ player. เลือกบทบาทต้องไม่ซ้ำ, เปลี่ยนบทบาทล้าง readiness ของตน. Host start ได้เมื่อสองบทบาทครบ ทั้งคู่ ready/connected. อัตลักษณ์ผู้เล่นจาก session เท่านั้น ตัวละครเปลี่ยนไม่ได้หลังเริ่ม. Host/public spectator ไม่มีการ์ดลับ

Playing step draw/discard/effect: turn ไม่เปลี่ยนจนทำ effect ครบ; engine validate exact intent/targets ก่อน clone/mutate. ผลจั่วใช้ RNG crypto ผ่าน engine. Private cards/drawn card ส่งเฉพาะเจ้าของ; public rack เป็น null สำหรับใบปิดหรือ Card สำหรับใบที่เปิดจริง. Public deck มี count และ top เฉพาะเมื่อถูกเปิดด้วย effect2 ไม่มีลำดับ deck หรือ card IDs ที่ทำให้เดาใบปิดได้

Round resolution synchronous/atomic: capture cards ทั้งสองฝ่าย/rank/round → compare district1–5 → stop on immediate victory → results/finished. Public event.reveal และ result อยู่ใน state revision เดียว ไม่ส่งการ์ดทีละฝ่าย. ผลไม่ถูกประมวลผลใหม่เมื่อ sync/reconnect/duplicate. Results ใช้ next-round จาก authenticated players สองคนก่อน prepare round ใหม่; acknowledgement ไม่มีผลต่อ scoring. Rematch host-only finished ใช้ tokens/code/IDs/receipts/revision เดิม และ setup ใหม่ ไม่มี display-driven timing

ไม่มี animation/gameplay client rules สำหรับ Dracula. Client แสดง legal actions จาก own projection + pending/offline guard และเลือก intent ก่อนยืนยัน. State เป็น authoritative model ทันที ไม่รอ timer, no debug endpoint

## Presentation scope — cover gallery / common UI / Dracula motion

`src/client/platform.ts` รวม catalog/entry/lobby ของสองเกม. ทุก create/join/QR/name/ready/reconnect UI ใช้ neutral `platform-surface` / `body.platform-theme`. Root gallery มีเพียงเกมที่อยู่จริง; header มี link `/join`. Credentials/key format เดิม. Entry pending lock แยกจาก game command receipts; async errors preserve drafts/focus. Auth-invalid/expired-room error กลับ common flowและล้าง credential ที่ใช้ไม่ได้ตามคำตอบ serverเท่านั้น

CSS scope body/main แยก platform, Camel, Dracula; theme-colorตามsurface. Camel game rendererไม่ถูกแก้. Camel preload lazyตามgameId; Dracula preloadภาพของตนเองก่อนrender/action. Sources PNG → script crop/pad/resize WebP → local public assets. No runtime art API/hotlink. Rules neverอ่านค่าจากภาพ

`DraculaMotion` เก็บ persistent board DOM แยกจาก model ล่าสุด. Snapshot ส่งไพ่และผลครบอย่าง atomic; presentation เปิดคู่ไพ่ทีละเขตตาม server result และอัปเดต HP/แวมไพร์จากค่าที่ส่งมา. เขตที่ยังไม่ถึงคิวซ่อนภาพ/ผลและ aria exposure. Ready acknowledgement ของผลรอบเดิมไม่ตัด sequence. Duplicate ignore; initial/reconnect/snapshot snap; gap resync. Skip/reduced-motion ยกเลิกและแสดงล่าสุด. WAAPI promises มี generation guard ไม่ทับงานใหม่; ไม่มี game-state timer หรือ client scoring.

Engine/RoomService/transport/projection unchanged in presentation upgrade. Browser motion fixture injectจากinternal Node testserviceเท่านั้น ไม่เพิ่มdebug endpoint/app backdoor

## GameVerse account/persistence boundary

Public metadata อยู่ `src/shared/catalog.ts` แยกจาก server-only engine adapters. Better Auth routes `/api/auth/*` และ platform endpoints อยู่ Node HTTP เดิม; WS อ่าน verified cookie session ทุกคำสั่ง. UserId, seatId, ownerId และ display capability แยกกัน. Profile ข้อมูลสาธารณะชื่อ/avatar projection จาก room membership; engine ไม่รับ account ID/email/avatar. Private payload ยังใช้ projector เดิม. RoomService buffers transport sends ขณะ SQLite transaction และคืน memory เมื่อ commit ล้มเหลว. Schema/compatibility/lifecycle และ backup: `docs/platform-storage.md`.


## Azul core / shared-platform integration

`src/games/azul/` ใช้ framework-independent engine, injected RNG, schema/version ที่ registry. Types/WALL/COLORS กลางไม่มี runtime server imports จึงใช้กับ UI ได้. Room field `azul` เป็นอีก typed branch โดยรักษา game/duel records เดิม. ห้อง/Google/Guest/profile/capability/revisions/receipts/SQLite transaction เป็นระบบเดิม ไม่มี auth/server protocol แยก.

หนึ่ง `draft` action มี source/color/target เท่านั้น. Server สร้าง offers/targets/placed/floor/discarded/reasons สำหรับ controller; client preview ไม่ mutation. accepted action หยิบสีทั้งหมด/ย้ายเศษ/วาง/คิดผลจบรอบแบบ atomic. Round results ไม่รอจอกลางและ settlement ไม่เกิดซ้ำจาก retry/sync. `next-round` รับจากผู้เล่นคนใดหรือ owner (รวม shared display) เฉพาะ results จึงไม่ผูกกับ readiness ของคน offline; drafting ยังรอเจ้าของตากลับมา.

Public DTO เปิด player boards ทุกคน, factories/center/counts/history/bonus. ไม่มี bag order/discard contents/RNG/credentials. me เพิ่ม legal offers เฉพาะผู้รับ. Profile labels/avatar overlay จาก room membership เหมือนเกมเดิม. Restore guard ตรวจ roster/phase/score/pattern/wall/marker/tile conservation และ quarantine โดยเก็บ record เดิมหากผิด. Admin/active rooms/sweep/leave แยก phase จาก azul branch ด้วย.

UI CSS/DOM บน shared screen และ phone ใช้สี + letters; ว่างบน wall เป็นช่องจางเส้นประ, วางแล้วเป็นสีทึบ. Controller แตะ source/color → target → preview → confirm, disable pending/out-of-turn, clear draft เมื่อ revision เปลี่ยน. คู่แข่ง read-only ผ่าน tabs. ไม่มี animation หรือ image generation ใน scope นี้.

## Vercel + Neon runtime (2026-10-14)

เพิ่ม optional Postgres adapter/transaction worker และ server entrypoint สำหรับ Vercel; รายละเอียด lock/leases/cross-instance delivery, schema, secrets และข้อจำกัดอยู่ [vercel-deployment.md](vercel-deployment.md). SQLite dev ยังเป็นค่าเริ่มต้น. Vercel Functions รองรับ WebSocket แบบ beta ณ วันที่ตรวจล่าสุด แต่ข้อมูลใน process/disk ไม่ใช่ durable state; production จึงใช้ Neon Free และโหลด state ภายใต้ transaction lock ก่อน mutation ทุกครั้ง. ไม่เปลี่ยนกติกาหรือส่งข้อมูลลับให้จอกลาง.
