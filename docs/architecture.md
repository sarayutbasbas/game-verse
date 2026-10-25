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

SQLite-backed 200 ห้อง; commit state/revision/receipts ก่อน ACK/broadcast และ restore หลัง restart. ทุกสถานะใช้ idle TTL 30 วันสำหรับ Harmonies และ 10 ชั่วโมงสำหรับเกมอื่น จาก join/accepted command; automatic resume/watch/sync ไม่ต่ออายุ. ตรวจล้างทั้ง cold restore และระหว่างใช้งาน. Unsupported rules/schema/state quarantine โดยไม่ลบ. หนึ่ง coordinator instance เท่านั้น. Authentication และ lifecycle เพิ่มเติมอยู่ใน docs/platform-storage.md

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

## 7 Wonders Duel base-game integration

`src/games/seven-wonders-duel/` contains the 73-building/12-Wonder/10-Progress catalog, three shared layout graphs, deterministic injected-RNG engine, optimal resource payment calculator and restore validator. Room field `wonders` uses existing account/Guest seats, coordinator, authenticated actor, action receipts/revision, SQLite/Postgres storage and schema/rules versions. No new service or protocol. Public DTO omits decks, setup removals, boxed Wonders/tokens and hidden card identities; buried cards project only a built flag. Great Library options exist only in the acting player's projection. Pending effects remain in durable state and finish before turn advancement. Score breakdown comes from engine.

DOM/CSS/WAAPI presentation uses graph coordinates, public catalog illustration IDs and accepted sequence/revision. Capture old card position before replacing room DOM; animate only committed movement/coin/Progress/reveal/age/results. Duplicate/snapshot/reconnect skip; event/revision gap requests common sync and snaps latest. Animation completion removes presentation clones only, never commits game state. Extra-turn audio follows completed actions/decisions even when actor stays the same; mute remains device-local. Original generated WebP illustrations and SVG Age backs live in public/art/seven-wonders-duel; names/costs/rules symbols stay in code.

## Dracula manual result projection — 2026-10-15

The server stores authoritative result reveal masks and pre-resolution HP/populations. Players may reveal only their own closed result cards, carrying the exact round. Same-round reveal intents commute: an older nonnegative revision is accepted only for this action, after ordinary authenticated ownership/legal-action validation. Duplicate command receipts remain idempotent; future revisions, wrong rounds and all other stale commands are rejected. Public racks, result.cards and event.reveal all use the filtered projection. Final winner is withheld until all ten cards are public; scores progress through the contiguous paired district prefix. Restart and next-round are server-gated on complete masks. SQLite/Postgres persistence includes partial reveal progress. Older saved results without masks remain fully public.

## Pixies base integration — 2026-10-15

Typed pixies branch uses existing registry/catalog, RoomService seats, authenticated sessions, capabilities, receipts/revisions and SQLite/Postgres coordinator. No separate server/protocol. Engine keeps card IDs in deck/market/9-slot up/down pairs; explicit durable selected-card pending precedes exact slot/keep intent. Placement options are server-generated. All public grids exclude buried IDs, even in the owner's projection; no client-only concealment. Only visible catalog faces, covered flags, public score breakdowns and totals are sent. Last picker starts the next batch/round;2-player end check occurs after equal pairs. Restore validation enforces70 unique catalog cards, numbered faceup slots, roster, rounds and stored score shape. Results never re-score on sync/retry. Restart is manager-only, finished-only and revision-guarded. Audio/motion use shared manager and accepted sequence; local preview selection is presentation-only.

## Pixies retained presentation / Dracula exchange memory — 2026-10-15

Pixies main shell and keyed DOM now survive state/ACK/presence/local preview deliveries. Optional persisted marketSlots is a presentation reference array; component conservation counts market/deck/grid only. Public marketLayout resolves available IDs to visible faces and emits null for spent slots. Pending picks remain in their original slot; cancellation restores the same button. Existing rooms without the field remain valid and initialize slots from current availability on their next action. Server scoring and turn rules are unchanged. Manager-capable sessions may continue settled Pixies rounds using the same phase/exact-action legality check; all placement/selection actions still require an authenticated player.

Dracula lastExchange stores a server-only copy of the cards at the time of effect6. getPlayerView selects only the authenticated owner's given/received pair; getDisplayView/event contains no receipt. This records information each owner already knew through ownership, without exposing an opponent's hidden face before the exchange. Copies are isolated, round setup clears the record, storage validates shape/actor/round/serial. Card exposure flags are unchanged.

Pixies selection permits replacing a pending market pick without consuming a turn or removing either face. The normal authenticated actor, exact-action, revision, receipt and projection checks still apply. scoreGarden supplies aggregate scores plus visible contributing slot indices for UI review; scorePlayer delegates to it so display highlights and settlement share one calculation. Persisted state is unchanged by review or animation.

## Harmonies base multiplayer

`harmonies` uses the common registry, metadata, authenticated rooms, ready lobby, memberships, receipts/revisions and durable store. Host selects one shared board side A/B during start; restart defaults to current side. Pure axial23cell engine owns120stable terrain IDs, shuffled bags/decks, five supply groups,32animal definitions, cube identities and score breakdown. Optional card/cube actions can interleave with the three mandatory terrain placements. The public projection contains current hand/boards/cards/cube progress, but never bag/deck order or credentials. Private projection adds only the authenticated seat's exact legal intents and candidate habitats.

Stored state validation checks token/card conservation, legal ordered stacks, per-player terrain counts against completed/pending turns, unique card ownership, cube IDs/progress, incomplete card limits, starter/turn/end-round alignment and final scores/winners. Current turn's remaining hand and cardTaken/picked flags survive restart. CSS3D/HTML geometry only renders and selects intents; no scene position decides a rule or score. Harmonies rooms retain all phases for 30 idle days since the last explicit join or accepted command, including existing stored rooms; other games retain their 10-hour policy. Watch/resume/sync/retries do not refresh this window. The same policy applies during cold restore and distributed coordination.


## Sky Team introductory integration

`sky-team` uses shared registry/catalog, ready lobby, authenticated2seats, public display, receipts/revisions/roomqueue and durable SQLite/Postgres. Pureengine/scenario/validation keep4dice/role serveronly until committed. Public flight whitelist includes only placed dice, traffic, switches, axis/speed, tokens and prior public rounds. Player projection adds only authenticated role's unspent dice, ownrerollstatus and exactlegalintents. Reroll choices are durable and private, bothsubmit once before serverrolls and restores originalturn. No broadcastpreview/chat/ping. Intro YULonly; noadvancedscenario/module shownasplayable. Renderedmotion follows acceptedsequence with snap on reconnect, has no authority.

## Critter Kitchen adapter

`src/games/critter-kitchen` owns catalog, pure queued decisions, meal validation/scoring and durable-state validation. Room state uses `ck`, including private plans/storage/rumors, board configuration, deck order, pending decisions and match epoch. Every mutation uses the shared transaction/receipt/persistence path. Public `CKView` is a whitelist; only the authenticated owner receives `me`. Raccoon's printed-2 ingredients are the explicit public storage exception.

Planning, meal submission, refrigerator confirmation and final meal are independent simultaneous intents. A stale revision can commute only for the same match/round/phase epoch and an unsubmitted authenticated player; duplicate, future, wrong-phase and forged intents still fail. Sequential pickup and manager phase controls retain exact revision checks. Recovery checks token/card conservation, durable queue references, settled challenge results and final ranking. JSON object key order is ignored, as required when a database serializes JSONB.

Room `ckMode` is only the default presentation. Device-local mode switching does not send a game command or change the projection. Lobby setup checkbox drafts survive other players' updates and are sent once with the authorized start action. No timer or animation determines game results.

## Locus adapter and shared presentation modes

Locus adds a pure48card/213cell engine and schema1 `locus` room branch. The common registry, auth, seats, ready lobby, QR, memberships, transaction/receipts and storage remain authoritative. `shared/display-mode.ts` and the device preference helper are reused by Critter Kitchen and Locus, retaining existing CK preference keys. Room default presentation does not alter projections or rules.

Ordered draft picks require the exact revision. Independent personal mark/bonus/coin/done intents may use an older global revision only when the authenticated player's `matchId:deal:ownVersion` epoch remains current. Every accepted own action increments ownVersion; new deals invalidate all prior intents. The engine still validates identity, pending effect ID, resource budget, complete D4 shape and legal cells atomically. Common receipts prevent duplicate payment or bonus acquisition. Future revisions never commute.

Public sheets, resources, live scores and pending shapes are visible like the physical table; deck order, credentials and other players' legal commands are never projected. Stable bonus source IDs and physical-card conservation survive SQLite/Postgres JSON serialization. Final scores/breakdowns/winners are stored once; extra tied round is an explicit manager action on the same sheet. Reconnect snapshots cancel paper/audio replay. Device preview and score review never mutate server state.

### Harmonies authorized shared-display control
Room `harmoniesMode` defaults to `full-mobile` for existing/new rooms. The exact-shape `harmonies-display-mode` command is manager-only, persisted with the room and revisioned through the normal receipt transaction. In `shared-table`, only an authenticated host/manager receives `displayControl` (the current actor's legal actions/habitats); `me` remains absent for that display, preserving the separation of host role and player identity. Public watchers never receive this control projection. Player projections and mobile actions remain available in either mode.

For host game commands in shared mode the server chooses `state.players[state.turn].id`, then invokes the unchanged authoritative engine. Client-supplied actor fields are rejected by exact action validation. Existing revision checks, receipt deduplication and transactions make host/phone races apply once; modes and host authority survive authenticated reconnect. Turning shared mode off removes host action authority and the control projection. No game-state migration, new dependency or altered scoring rule.

## Take Time introductory clock

`takeTime` is a schema1 durable room branch using the common metadata/adapter/authenticated seat/session/revision/receipt/persistence path. It supports2–4 players and official clock1–1 from the user-supplied TH/EN2025 example, not the unprovided chapter sheets/forty-clock campaign. Individual irreversible hand-open actions precede free first-card selection and clockwise turns. Two-player reserve values unlock only after four placements. Independent hand-opening intents may commute only within the exact discussion attempt; engine legality still rejects reopened hands and wrong attempts. Exact revision arbitration settles first-play and reveal races; duplicate command receipts cannot place/reveal twice.

Public projections whitelist opaque deal IDs, suit backs, placement owner/order and already public faces. Private projections add only that authenticated player's opened hand and their own placed-card memory. Undealt cards and locked reserve values never leave the server. Twelve placements enter manual segment-by-segment reveal, then deterministic stored cooperative result checks. Creator-controlled retry redeals all24 cards, increments attempt and applies capped failure bonus/reset after success. Validation checks physical suit/value conservation, deal/reserve counts, cyclic ownership/turn, phase/open state, quota and recomputed final results. Disconnect leaves the same turn intact; restart restores the same hands/reserves/reveal position. UI geometry/audio never resolves a rule.

### Room creator joins automatically

The game-detail GO button sends `create` with `joinAsPlayer: true`. In the same room transaction the server creates a ready player seat using the authenticated owner profile and returns only that player session, routing the browser to `/play/<code>`. A distinct host session remains server-side; opening `/display/<code>` with the owner account obtains it through the existing authenticated watch flow. The two devices do not replace each other. Repeated create and account-based join reuse the existing session/seat. Legacy display-only protocol clients can omit the flag or send false. Local-only Name It has no room. Role selection (Dracula) still requires an explicit choice and readiness.

## Harmonies startup routes and presentation hint
Harmonies links now use `/harmonies/play/<code>` and `/harmonies/display/<code>`; original `/play/<code>` and `/display/<code>` continue working. Game-qualified paths normalize to the existing role/code before credential and pending-action lookup. Only the server snapshot establishes the room's real game/permissions, and corrects any mismatched prefix. Other games keep their existing generated links.
An inline HTML head bootstrap applies the river theme before loading the app for Harmonies paths, or for legacy paths with an existing public theme hint. The hint is presentation metadata only, stored separately from credentials; it cannot create/resume a session. The common SPA/static fallback already serves these paths in Docker and the Vercel configuration; no server-side redirect or state projection changes are needed.

## Lobby player removal

The shared lobby exposes an icon-only cross beside other seats for the owner/authorized host, with an explicit confirmation dialog before sending `room-kick`. The authoritative command accepts only a target player ID, uses the existing revision/receipt protocol, rejects other players, the owner's seat and every started game, and removes the target's seat and reconnect sessions in one durable mutation. Transport notification/closure runs only after the save succeeds; a failed save preserves the live seat. Other players and displays receive the new lobby. Removal releases the seat; it does not ban the account from explicitly joining again.

## Draftosaurus shared-display/private-phone integration

`src/games/draftosaurus` is a pure Summer-side engine for 2–5 players, including the four-round two-player discard variant. Registry/schema1 `draftosaurus` uses existing authenticated room lifecycle, membership, readiness, transactions, command receipts and persistence; no extra database or transport. Engine owns shuffled exact species pools, six-face die, simultaneous locks, leftward hand/die passing, all pen limits, scores and fewest-T-rexes tiebreak.

Unlike public display parks, phone projections omit all other players' zoos and scores, and include only own hand/choice/legal pens. Every hand, bag order and pending choice is absent from display/watch DTOs. Chosen dinosaur and destination reveal atomically only after everyone locks. Per-match/round/pick epochs let independent player placements commute at older revisions within the same decision while rejecting future revisions, stale picks and repeated own selections. Reconnect and persisted restore retain hidden choices, physical piece conservation and private sessions. Authorized displays can roll the active die; only authenticated player seats can draft. Existing manager-only room restart keeps room/session identity.

Presentation uses generated local WebP board/box and six transparent two-frame sprites, a low perspective park, flowing river overlay and a 1100ms six-sided die tumble that displays the server outcome. Motion is device-local, cancelable and disabled by reduced-motion; snapshots never replay a roll. Rules, settings, QR and scoring are accessible dialogs. The source manifest records exact built-in image_gen prompts and export paths.


## Perch first-game integration

The independent perch engine owns 28-bird flock conservation, migration/recruitment, hidden hands, turn/bonus sequencing, tile ranks, creature movement and durable choices. The selected official first-game setup supports 2–5 players and neutral birds, with 8/10/13 verified locations and 3/4/5 creatures; objectives and random content outside that setup remain disabled and disclosed. Fountain support graphs are transcribed from the two printed sides (12/18 slots). Nests, houses and protected stacks apply to all counts and target validation.

The common registry/room lifecycle, authenticated seats, exact revisions, receipts, serial transactions and SQLite/Postgres storage remain authoritative. Public display projection includes only placed flocks, current public creature control, scores and revealed effects; no hands, bag order or future recruitment choices. Phone projections whitelist own hand/flock/reserve/score and legal intents; foreign Fountain cells expose occupancy without color. Publicly visible bonus targets still use legal color/location references. Owner-of-color Fountain/Nest choices, Birdbath return, Scarecrow junction and unfinished effects persist across process restart. Display managers may start/rematch but cannot place birds. No new service or dependency.

Perch DOM nodes survive state/ACK/presence updates through patchHTML. Generated scene/miniature atlases are runtime WebP; code owns tile geometry, hit areas, labels and support lines. Animation only renders accepted outcomes, never chooses or commits a result. Reduced motion and device-local preferences are respected. A device sees its own flock by default; the shared display presents all public birds.
