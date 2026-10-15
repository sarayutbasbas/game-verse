# สถานะงาน — Visual upgrade — 2026-10-14

## ผลลัพธ์ปัจจุบัน

พัฒนาต่อในโปรเจกต์เดิม: กระดาน 2.5D บนโต๊ะไม้ สนาม **16 ช่องวนตามเข็มนาฬิกา** รอบพีระมิด เส้นชัยระหว่าง 16/1, อูฐภาพจริง 7 สี, ป้ายเชียร์/โห่, กองไพ่หน้า/หลัง, บัตรพีระมิด, ลูกเต๋า, เหรียญ, ปาล์ม และ portrait ตัวละคร 8 คน. มือถือมี character card/ชื่อ/เงิน, การ์ดกดเลือก, used/selected state, เหตุผล action ใช้ไม่ได้ และ pending feedback

ยังใช้ Camel Up Second Edition 3–8 คน กติกา/คะแนน/สิทธิ์ห้อง/credentials/reconnect เดิม. ไม่มี 3D engine หรือ animation dependency ใหม่. DOM/CSS + Web Animations API; bitmap สร้างใหม่ด้วย built-in image_gen, SVG board base เขียนเอง. ข้อความไทย/ตัวเลข/rewards/ผลเต๋า render ด้วย code. ตัวละครใช้ระบุตัวเท่านั้น ไม่เพิ่ม abilities

**Reference ยังรอ:** ผู้ใช้กล่าวถึงภาพแนบ แต่ไม่มีภาพที่เข้าถึงได้ในข้อความ ได้ขอแนบอีกครั้งแล้ว. จึงยังไม่อ้างว่า composition ตรงกับ reference หลัก; งานที่ไม่ขึ้นกับภาพทำและตรวจแล้ว

## ไฟล์ที่เปลี่ยน

- `src/client/board.ts`: coordinate map, persistent DOM renderer, queue, motion และ resync/cancellation
- `src/client/assets.ts`: atlas index, symbols และ preload
- `src/client/main.ts`, `style.css`, `index.html`: Thai tabletop/display/controller/card UI, focus/draft preservation, viewport/theme
- `src/games/camel-up/engine.ts`: movement trace ณ transition เดิม และ public pyramidRemaining; ไม่เปลี่ยน movement/scoring decisions
- `src/shared/types.ts`: public event/trace, snapshot และ sync DTO
- `src/server/rooms.ts`: public event ต่อ accepted revision, authorized sync snapshot; final events ไม่เปิดสีการ์ด
- `src/server/index.ts`: static `/art/` MIME และ random injection สำหรับ internal Node tests; ไม่มี public test/debug endpoint
- `public/art/*.webp`, `board.svg`: assets runtime จริง; `assets/source/*.png`: ต้นฉบับ/edits. Runtime ทั้งชุด **1,311,960 bytes (~1.3 MB)**. ตรวจ metadata WebP: camels/objects/avatars มี alpha จริง, table opaque
- `tests/motion.test.ts`, `tests/browser/motion.spec.ts`, browser game test: movement/event/viewport regressions
- README, architecture, visual-design และ asset-generation: วิธีรัน, policy, art prompts/source paths และข้อจำกัด

## Animation และ state

Game state commit ทันทีจาก server. Movement trace ระบุ unit ที่เคลื่อน, from/index, path ทุกช่องรวม tile step, destination stack/under และ owner reward. Client ไม่สุ่ม/เลือกอูฐ/คิด payoff เอง. Pyramid shake ก่อน reveal, unit เดินผ่าน path, boo ลงใต้, cards เคลื่อนเข้า/ออก deck, coin/ยอดเงิน feedback, leg/final transition

Queue keyed by revision/event. Duplicate ไม่เล่นซ้ำและ revision เก่าไม่ย้อนภาพ/model. Missing event/revision ขอ authorized `sync`; reconnect/snapshot/reduced motion ยกเลิกงานเก่าแล้ว snap ล่าสุด ไม่ replay history. เร่ง motion เมื่อ backlog และจำกัด 8 events ก่อน snap/resync. `Animation.finished` ใช้รอ presentation เท่านั้น; ไม่มี setTimeout เพื่อเปลี่ยน game state (setTimeout ที่เหลือเป็น network reconnect เดิม)

## สิ่งที่ทดสอบจริงล่าสุด

### `npm test` — ผ่าน **20/20**

17 tests เดิมผ่านต่อ: stack/movement/tile/crazy selection, leg net/floor 0, final order/shared victory, partnership, invalid transition, เกมเต็ม 30 seeds, actual WS roles/privacy/duplicate/stale/identity reconnect/resource depletion/rate limits/expiration

เพิ่ม 3 tests: trace unit/path/tile/under/reward ที่ authoritative transition, crazy orientation trace, delivery duplicate/snapshot/gap/incomplete-event และ 16 fixed coordinates

### `npm run test:e2e` — ผ่าน **3/3** บน Chromium

Build/typecheck/compiled production server ผ่าน แล้วทดสอบ browser จริง:

1. จอกลาง + phone browser contexts **3 คน**, QR/join UI/code, ลงการ์ดลับ หยิบบัตรเลก วางป้าย เล่นจนจบ. รอบล่าสุด **23 roll actions**, เงิน/ผลทุกจอตรงกัน, ไม่มี page errors. ตรวจ network projection จริงว่าคนอื่นไม่มี cards/bets/token. ตัด phone socket ขณะ offline แล้ว reload กลับ identity/เงิน/ตาเดิม. Drop ack หลัง server รับคำสั่งแล้ว retry ได้บัตรหนึ่งใบ. รอ queue idle และ visual revision ตรง model ก่อน screenshot ผลจบ
2. วง **6 คน** จับคู่ ทอยจบเลก คัดลอกพีระมิด/ไม่คัดลอก รอทั้งคู่จึง settle และคืน partnership ตรงทุกจอ
3. Internal authoritative Node server fixture ผ่าน UI/WebSocket จริง (ไม่ส่ง fake outcome จาก client): green+yellow ขยับพร้อมกันจากช่อง 2 ผ่าน `[3,4,5,4]`, กระทบ boo ที่ 5, ลงใต้ red+purple, owner รับ 1. เทียบทุกตัว/stack index กับ server. ส่ง duplicate frame ไม่เพิ่ม animation count; drop หนึ่ง accepted event แล้ว client ส่ง sync; หลุดจอกลางกลาง motion แล้ว snap ล่าสุด ไม่มี FX ค้าง. Reduced motion ไม่เริ่ม animation และตำแหน่งตรง server

Viewport ตรวจและ screenshot: **1366×1024 desktop, 1024×768 iPad landscape, 768×1024 iPad portrait, 390×844 phone**. ไม่ overflow แนวนอน; board bounds อยู่ใน viewport desktop/iPad. โหลด image/assets สำเร็จ ไม่มี placeholder/emoji ในเส้นทางหลัก. ใช้ internal test fixture เท่านั้น ไม่มี HTTP backdoor ในแอป

ภาพล่าสุดเปิดตรวจจริง: `test-results/display.png`, `mobile.png`, `finished.png`, `board-1366x1024.png`, `board-1024x768.png`, `board-768x1024.png`. แก้ atlas gutter bleed, board สูงเกิน viewport, ค่าไพ่/label overlap, ลำดับกอง และ wood texture seams จากภาพที่พบ

## UI review

อ่าน fresh guidelines จาก https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md แล้วตรวจ client files. ใช้ semantic buttons/forms, labels, aria-pressed, status aria-live, decorative art aria-hidden, visible keyboard focus, safe-area, long-name handling, touch targets, color-independent symbols/labels และ reduced motion. ไม่ disable zoom หรือใช้ motion loops. Layout reads เฉพาะ card flight ก่อนเริ่ม action หนึ่งครั้ง ไม่มี per-frame render/measurement

- `src/client/main.ts` — reviewed; name/code validation, draft/focus และ card selected state คงอยู่หลัง broadcast
- `src/client/board.ts` — reviewed; state แยก presentation, transform/opacity animations, snapshot/cancel/reduced-motion
- `src/client/style.css`, `index.html` — reviewed; readable Thai, responsive ratio, focus, semantic main/skip link, theme metadata

ไม่ได้อ้างว่าได้ตรวจ screen reader หรือ Safari จริง

## ข้อจำกัด/งานที่ยังเหลือ

- **ต้องได้รับ reference image** ก่อนตรวจ/ปรับ arrangement ให้ตรงภาพหลักที่ผู้ใช้ต้องการ
- iPad/phone เป็น viewport จำลอง Chromium: ยังไม่ได้ลอง iPhone/Safari/iPad หรือกล้อง QR บนอุปกรณ์จริง รวมถึง Wi-Fi หลายเครื่องจริง
- ไม่มี benchmark FPS บนอุปกรณ์เก่า. บนจอเล็ก กระดานย่อเป็นภาพรวม; อ่านการ์ด/action จาก panel มือถือ
- rooms ยัง memory-only ตามขอบเขตเดิม: restart ล้างเกม; expire หลังกิจกรรมล่าสุด 12 ชั่วโมง. ไม่มี permanent reconnect ข้ามอุปกรณ์/kick/skip/reset
- ยังไม่ deploy สาธารณะ, ไม่มีบริการเสียเงิน. Dockerfile/TLS proxy/cloud runtime ยังไม่ทดสอบ
- ไม่มีกู้เกมหลัง restart, persistence หรือ multiple instances. เกมที่สอง/บัญชี/จ่ายเงินอยู่นอก scope

วิธีลอง: `npm ci && npm run dev`; เปิดจอกลางด้วย LAN IP แทน localhost หากใช้มือถือจริง. คำสั่ง/คำแนะนำครบใน README. Prompt set และ asset provenance อยู่ใน `docs/asset-generation.md`

## Feedback: รอบย่อยและเดิมพันจบเกม — 2026-10-14

- เปลี่ยน player-facing “เลก” เป็น “รอบย่อย” ทั้งกระดาน มือถือ ประวัติคะแนน และ feedback พร้อมอธิบายจบเมื่อทอยครบ 5 ลูก. History แสดงอันดับและหน่วยเหรียญชัดเจน
- เดิมพันผู้ชนะ/ผู้แพ้ทั้งเกมมีอยู่เดิม แต่ถูกวางต่ำและซ่อนเมื่อยังไม่ถึงตา. ย้ายไว้เหนือบัตรรอบย่อย แสดงตลอด พร้อม disabled/reason ตามตาและการ์ดที่เหลือ. แสดงรางวัล +8/+5/+3/+2/+1 และผิด −1, กองทั้งเกมบนจอกลาง, และชี้ว่าเปิดคิดตอนจบ
- ใช้ภาพ feedback ที่แนบ (ประวัติรอบและ reward ladder ของการ์ด) เพื่อปรับ copy/ลำดับข้อมูล. ภาพนี้ยังไม่ใช่ reference กระดานเต็มสำหรับการจัด composition ทุกส่วน
- เพิ่ม browser test สำหรับ winner/loser ทั้งสองกอง: เลือกไพ่จริงจาก UI, server จ่าย +8/+8 ตอนจบ และยอดสุดท้าย 12/11/4 ตรงทุกจอ. ตรวจ panel ยังมองเห็นเมื่อไม่ถึงตาและปุ่มถูก disabled
- Rules/server scoring ไม่เปลี่ยน. รัน browser tests บนพอร์ต 3001 เพื่อไม่ restart server/ทำห้องเดิมสูญหาย

ผลตรวจ feedback: full browser suite **4/4 ผ่าน** (รอบล่าสุดเล่นครบเกม 17 roll actions), build/typecheck ผ่าน. หลังจัด reward ladder ให้เลขอยู่แนวเดียวกัน รัน targeted winner/loser browser scenario ซ้ำผ่าน. เปิดตรวจ screenshot `test-results/final-betting-mobile.png` จริง; user-facing client ไม่เหลือคำว่า “เลก”. Dev server port 3000 ยังเป็น process เดิม ห้องที่กำลังเล่นไม่ได้ถูก reset

## เล่นอีกครั้งในห้องเดิม — 2026-10-14

เพิ่ม host-only ปุ่ม “เล่นอีกครั้ง” หลังจบ เลือกผู้เริ่มได้. รอทุก player online. ใช้ room code/player IDs/names/authenticated sessions เดิม; server factory เริ่มเงิน 3/cards 5/dice 6/บัตรและกระดานใหม่. ไม่เปลี่ยน rules/payout. เพิ่ม restart event/snapshot ให้ renderer ยกเลิก animation ของเกมก่อน. Revision/receipts ไม่ reset เพื่อกัน paid action/retry ค้างข้ามการแข่งขัน

`npm test` **21/21 ผ่าน**: เพิ่ม actual WS rematch ตรวจ wrong role/phase, offline player, resources reset, selected starter, retry/stale และ old accepted command ไม่แก้เกมใหม่ รวม resume session หลังเริ่มอีกครั้ง

`PLAYWRIGHT_PORT=3001 npm run test:e2e` **4/4 ผ่าน**: จบการแข่งขันบน 3 phone contexts แล้ว host กดเล่นอีกครั้ง ทุกจอชื่อ/รหัสเดิม เงิน 3/การ์ดครบ/visual revision ตรง ไม่มีผลเก่าหรือ animation ค้าง. Retry restart ID ไม่เพิ่ม revision. Phone reload กลับผู้เล่นเดิม แล้วผู้เริ่มที่เลือกเล่น action แรกของเกมใหม่ได้จริง. Build/typecheck ผ่าน. Screenshot `test-results/rematch-display.png`

อัปเดต room handler ใน dev process ที่เปิดอยู่โดยรักษา rooms/session maps เดิมไว้ ไม่ restart process และไม่เขียน credentials ลงไฟล์. ปิด local inspector หลังอัปเดต. Port 3000 ยังเป็น server เดิม ให้ refresh จอกลางเพื่อเห็นปุ่มได้

## Portal + Dracula vs Van Helsing core — 2026-10-14

สถานะ: core gameplay เชื่อมกับระบบจริงและเล่นจบเกมแล้ว. ไม่ทำ generated artwork, animation, sound หรือ effects สำหรับเกมใหม่. Camel Up rules/art/motion ยังใช้ engine/renderer เดิม

### สิ่งที่ทำ

- Portal `/` เลือก Camel Up (3–8) / Dracula vs Van Helsing (2), game-specific create pages และ join ด้วยรหัสร่วมกัน
- ตรวจรีวิว Stronghold จริงผ่าน HTML และคู่มือ Mandoo ©2023 ภาษาอังกฤษ PDF เทียบคู่มือทางการ Asmodee Italia. บันทึก setup/cards/abilities/trump/district order/instant victory/new rounds และ UX ที่เพิ่มใน `docs/games/dracula-vs-van-helsing/rules.md`. ไม่มีข้อกติกาที่ค้างการยืนยัน
- Pure engine `src/games/dracula-vs-van-helsing/engine.ts` พร้อม draw/discard/effect, ความสามารถครบ 1–8, การเปิดเผยติดกับตัวการ์ด, final-turn extra5, restricted8, ตัดสินเขตตามลำดับและหยุดเมื่อชนะ, 5-round survival, acknowledgement แล้วสับทั้ง32ใบใหม่
- Shared RoomService/registry/protocol เลือก engine ด้วย validated gameId. Default create เดิมยังเป็น Camel Up. Max2, character unique, readyทั้งคู่และonlineก่อน hoststart. Hostแยกphone, thirdplayerblocked, tokenresumeแม้ห้องเต็ม, receipts/revision/shared quotas ใช้เดิม
- Duel DTO แยกจาก Camel DTO. ไม่มี deck order/opponent private cards/credentials ใน public frame. เปิดครบสองฝ่ายจาก result/event.reveal snapshot round/revisionเดียว. Engine scoringไม่รอbrowser, results lock actions, acknowledgementsไม่คิดผลซ้ำ
- Thai UI จอกลาง5เขต/HP/trump/round/discard และ phone draw/select/preview/confirm/effect. ปุ่มมีสถานะรอserver/offline, native keyboard/touch, สี+ข้อความ+สัญลักษณ์. Rematch host-only ใช้ห้อง/บทบาท/sessionเดิม
- README/architecture/rules/UI และ tests อัปเดต. ไม่มี runtime dependency/hosting/service เพิ่ม. ใช้ Prettier ผ่าน npm temporary tool เท่านั้น

### ผลที่รันจริง

- `npm test`: **31/31 ผ่าน**. กติกา2เกม, Dracula setup32 distinct, ability1–8/extra5/threshold8, trump/เลขเสมออันดับสี, stop-on-victoryทั้งสองฝ่าย, survivalรอบ5, newround conservation, invalidไม่มีmutation, privateprojection, seeded completegames30เกม
- Actual WebSocket Dracula test: role duplicate/startก่อนready/hostrights/thirdplayer, forbidden forged intent/wrongturn/stale, duplicate drawไม่กินการ์ดเพิ่ม, full-room resumeระหว่างdrawและผลรอบ, public/privatepayload, atomic reveal, repeatedackไม่redeal, next roundทั้งสองพร้อม
- `PLAYWRIGHT_PORT=3001 npm run test:e2e`: **5/5 ผ่าน** (latest 1.6min). จอกลางกับมือถือ3contexts Dracula: portal→create→join→choose/ready→เล่นจบ→rematch. Latest **166 actions, 5 rounds, Draculaชนะ**. ก่อนหน้านั้น full suiteผ่านเช่นกัน **168 actions, 4 rounds, Helsingชนะ**
- ทุก accepted action เปรียบเทียบ publicstateทั้ง3จอ. ตรวจทุก publicframeไม่พบme/deckorder/token; ใบที่ส่งระหว่างplayingต้องrevealed. ACKหายแล้ว retryคืนผลเดิม, offline+socketdisconnect/reloadกลับIDเดิม, reconnectผลรอบไม่redeal/rescore, rematchHP12/IDเดิม
- Camel browser4scenariosยังผ่าน: 3phonesครบเกมล่าสุด32rolls/reconnect/privatebets, 6คนpartnership, authoritative unit/tile/duplicate/gap/sync/reducedmotion, winner+loser payout/rematch
- Screenshot เปิดตรวจจริง: `test-results/portal.png`, `portal-mobile.png`, `dracula-desktop.png`, `dracula-ipad.png` (1024×768), `dracula-ipad-portrait.png` (768×1024), `dracula-mobile.png` (390×844), `dracula-round.png`, `dracula-finished.png`. แก้ contrastรหัสห้องที่รับสีทองจากCamel, spacingportalform และป้ายvisibilityหลังreveal. No horizontal overflow ในphoneและdesktop/tabletที่ตรวจ
- หลังแก้ CSS min-heightของportalครั้งสุดท้าย รัน build/typecheckและactual browsercapture desktop/mobileซ้ำผ่าน (ไม่ได้เปลี่ยนrulesหลัง fullsuite)
- อ่าน fresh web-design-guidelines และตรวจ nativecontrols/labels/skiplink/focus/status/48pxtargets/Thai/สีร่วมสัญลักษณ์

### Server ที่เปิดอยู่ / วิธีลอง

อัปเดต handler ใน local dev process port3000โดยรักษาrooms/attachments/game refs/sessions/sockets/revisionsเดิม. ใส่ gameId=camel-up ให้ห้องเก่าที่ไม่มีfield. ไม่restartprocess ไม่เขียนcredentialsลงไฟล์ ไม่มีdebug endpointในแอป; localinspectorปิดหลังอัปเดต. ตรวจ actual WSบน3000แล้ว: createDracula, two unique roles ready, start, private drawfilteredถูกต้อง. Refreshหน้าแรกเห็นportalได้ทันที

เครื่องใหม่: `npm ci && npm run dev`; เปิด `http://localhost:3000` เลือกเกม. มือถือจริงใช้ LAN IPของคอมบนWi-Fiเดียวกัน; scanQRหรือjoincode, Draculaเลือกคนละบทบาทและพร้อม, hoststartบนจอกลาง. Test commandsและแหล่งกติกาในREADME

### ข้อจำกัดที่ยังเหลือ

- Memory-only: processrestartยังล้างทุกห้อง. ไม่มีdurable storage/multiple instances/sessionย้ายเครื่อง/kick/skip. ผู้เล่นหายรอresume ไม่สวมบทบาทด้วยชื่อ
- ทดสอบChromium desktopและmobile/tablet viewportจำลอง ยังไม่ยืนยันSafari/iPhone/iPadจริง กล้องQRจริง เครือข่ายภายนอกหรือTLSproxyจริง
- Dracula phaseนี้เป็นcore UIไม่มีart/animation/soundตามคำขอ. ไม่มีcampaign/AI/expansion/บัญชี/จ่ายเงิน. Portalใช้textureเดิมของโปรเจกต์ ไม่สร้างภาพใหม่
- ไม่เผยแพร่สาธารณะ/ใช้บริการเสียเงิน. Docker/cloud/สิทธิ์เผยแพร่ยังไม่ผ่านการตรวจรับในงานนี้

## Presentation: covers / common entry / Dracula artwork & motion — 2026-10-14

เสร็จงานภาพตามสเปก: portal เป็นgalleryปกสองเกมจริง ไม่มีhero/promotional panels; entry/QR/name/lobbyร่วมกันผ่านneutralplatformtheme. Game themeเริ่มหลังlobby. Routes/roomIDs/storagekeys/sessionเดิมไม่เปลี่ยน

Assetsจริงจาก built-in image_gen 7calls: coversสองเกม, rolescutout, 8-typeportraitatlas, citymap, commonback, markeratlas(human/vampire/heart/ship). Sources22MBใน `assets/source/presentation/`, optimizedWebPรวม1,900,336bytesใน `public/art/covers/` / `public/art/dracula/`. Realalphaตรวจแล้ว. ทุกไฟล์ถูกใช้จริง; hiddenbackร่วมหนึ่งแบบไม่เผยtype/suit. เลข/ไทย/glyph/effecticons/coordinatesเป็นcode. Promptset/provenance: `docs/presentation/generated-art.md`; manifest: `public/art/presentation-manifest.json`; deterministiccrop/pad/resize script: `scripts/prepare-presentation-art.py` (optionalPillow ไม่ใช่runtime dependency)

ใหม่/แก้หลัก: `platform.ts/css`, `dracula.ts/css`, `dracula-assets.ts`, `dracula-motion.ts`, `main.ts`, `index.html`; testsและREADME/docs. Game engine/RoomService/projectionsไม่ได้แก้ในงานนี้. Camelrendererเดิม. Preloadตามเกมที่ใช้ ไม่โหลดCamelทั้งหมดบนportal/Dracula. PersistentDuelboardแยกจากmodel/controller

Motion: committedstateทันที, exactrevisiondedup, snapshot/reconnect/reducedmotionsnap, missingrevisionresync, latesttransitioncancelก่อนหน้า. ไพ่ทั้งสองฝ่ายเปิดพร้อมกันในDOMและWAAPIstartจากsnapshotเดียว; highlightdistrictresultภายหลัง, turn/card/HP/conversion/winner transientmotion. ไม่มีsetTimeout/Math.randomในDraculapresentation และไม่มีclientrule/scoring

Commonflowมีpendinglock, inlineerror/draft/focusretention, paste+normalize, Enter, QRfixedcode, sessionresume และexpiredcredentialsกลับcommonformตามserverrejection. DefaultHTMLเริ่มneutralthemeป้องกันflashCameltexture, theme-colorsตามsurface. Artwork ratiosแก้atlasโดยcrop/repackไม่stretch; markerpaddedtosquare; suitbandsและyellowcontrastเพิ่ม; sharedshort-heightlayoutลดซ้ำและปรับcard/mapspacing

ผลรันจริงล่าสุด:
- `npm test`: **32/32 ผ่าน**, รวมexistingengine/protocolและDraculamotiondeliverypolicy. Rules/privacy/reconnect/dedupเดิมผ่าน
- `npm run build`: typecheck/client/serverผ่าน ไม่มีmissingassetwarningsหลังartครบ
- `PLAYWRIGHT_PORT=3001 npx playwright test`: **7/7 ผ่าน**, latest1.6min. Dracula **163 gameplay actions,5rounds,Helsingชนะ**, previousvisualrunsมีDraculaชนะด้วย. Camel **26rollsครบเกม**,6-playerpartnership, unit/tile/motion/reducedmotion, finalwinner/loserpayout/rematchผ่าน
- 3browsercontextsต่อเกม: acceptedstatesตรงกัน, privatepayloadfiltered, lostACKretry, refresh/offline/resumeplaying/results, atomicbothhandsreveal. Motionfixtureduplicateไม่animateซ้ำ, gapส่งsync, reconnectระหว่างrevealcancel, reducedmotionไม่เพิ่มanimation
- Commontest: covergallery2จริงโหลดครบ, neutralacrossbothgames, QRcanvasจริง, wrongcode/roomfull/namepreserved, pastedlowercasecode/Enter, repeatedsubmitส่งjoinครั้งเดียว, fixedjoinURLไม่ต้องcodeซ้ำ, resumeไม่joinใหม่, rejectedexpiredcredentialกลับenabledcommonform
- เปิดตรวจscreenshotsจริง portaldesktop/mobile,joinURL/error,commonlobbies,Ddesktop/iPad1024×768/768×1024,สองrolephones,reveal/results/winner. แก้darkmapvisibility, suitbandcontrast, atlasratio และshort-heightspacing. Latestfiles `test-results/*.png` หลังfullsuite
- HTTPตรวจไฟล์runtime7/7ผ่าน200image/webpบนlive3000. Process63056เดิมยังรัน ไม่restart/ไม่resetroomหรือsessions; sourceclientViteและartอัปเดตแล้วให้refreshได้

ข้อจำกัด: Chromium/tabletviewportจำลองเท่านั้น ยังไม่ทดสอบSafari/อุปกรณ์จริง/กล้องQR/TLScloud. Tabletlandscapeมีscrollตามพื้นที่และผลรอบ; ทุกเขต/การ์ดเข้าถึงได้ ไม่มีhorizontaloverflowในviewportsที่ตรวจ. ไม่มีเสียง. ไม่มีpaidservice/publicdeploy. Roommemory-onlyยังเป็นข้อจำกัดเดิม ณจบงานภาพนี้

งานถัดไปที่ผู้ใช้ส่งระหว่างเก็บผล: GameVerse branding, Google+Guest identity/profile, metadataregistry/search/recent, persistence/admin/versioning. เริ่มอ่านสเปกแล้ว; ผลตรวจ32/7ด้านบนเป็นbaselineก่อนเพิ่มบัญชี/persistence ไม่ใช่ผลทดสอบฟีเจอร์เหล่านั้น


## GameVerse: บัญชี แพลตฟอร์ม และ persistence — 2026-10-14

พัฒนาต่อในโปรเจกต์เดิมโดยคง Camel Up Second Edition 3–8 คน และ Dracula vs Van Helsing 2 คน พร้อมกติกาและ artwork เดิม. งาน GameVerse นี้แทนที่สถานะ memory-only ของช่วงก่อนหน้า: ห้องและบัญชีใช้ SQLite บนเครื่องเดียวแล้ว ไม่มีบริการ cloud หรือการเผยแพร่สาธารณะ.

### สิ่งที่ส่งมอบ

- Home/search ไทยและอังกฤษ/filter จำนวนคน, metadata registry และ server-only adapters สำหรับเพิ่มเกมในอนาคต. แสดงห้องเฉพาะ owner/สมาชิก และเกมล่าสุดสูงสุด 3 เกมที่เริ่มจริง.
- Better Auth 1.7.7: Google และ Guest, HttpOnly cookie, ตรวจ session ที่ HTTP/WS และก่อน mutation; logout ยกเลิกสิทธิ์ realtime. ผู้สร้างห้องต้องเป็นบัญชี Google; ผู้เล่นใช้ Guest ได้. จอกลางสาธารณะไม่ใช่ตัวตนผู้เล่น. Owner เริ่มเกม/เล่นอีกครั้งจากมือถือของตนได้.
- โปรไฟล์ไทย ชื่อร่วมทุกเกม และ upload avatar PNG/JPEG/WebP ไม่เกิน 2 MiB; server decode/strip metadata/ย่อเป็น WebP 256px. อัปเดตชื่อและรูปโดยไม่เปลี่ยนที่นั่ง การ์ด ตา หรือ revision เกม.
- Guest linking คงที่นั่งเดิมและปฏิเสธกรณีบัญชีปลายทางมีอีกที่นั่งในห้องเดียวกัน. ห้องก่อนมีบัญชีผูกสมาชิกได้เมื่อ resume ด้วย capability เดิมที่ถูกต้อง. ไม่ใช้ชื่อเป็นหลักฐานตัวตน.
- SQLite transaction บันทึก state/revision/receipts ก่อนส่ง ACK; write failure rollback. Restart กู้ห้องโดยให้สมาชิก reconnect. ตรวจเวอร์ชันและโครงสร้างก่อน restore; ห้องไม่รองรับถูก quarantine และไม่ใช้รหัสซ้ำ. Cleanup ห้อง lobby/finished ตามอายุ; ห้องกำลังเล่นไม่ถูกลบทิ้ง.
- Admin ตาม server bootstrap user ID สำหรับ maintenance และ diagnostics; ไม่เปิด secrets/private cards. Noto Sans Thai self-hosted พร้อม license, GameVerse icon/manifest, neutral UI และธีมเฉพาะเกมเดิม.
- คำสั่ง setup private env, migration, README, คู่มือ Google Console/storage/เพิ่มเกม และ Dockerfile สำหรับ deploy ภายหลัง. ไม่เขียน secrets ลง client/QR/log.

ไฟล์หลัก: `src/shared/catalog.ts`, `src/games/adapter.ts`, `src/games/registry.ts`, `src/server/auth.ts`, `store.ts`, `platform.ts`, `room-validation.ts`, `rooms.ts`, `index.ts`, `src/client/account.ts`, `platform.ts/css`, `main.ts`, `dracula.ts`, shared DTOs, `migrations/001-platform.sql`, fonts/icon/manifest, scripts และ tests.

### ผลทดสอบจริง

- `npm test`: **38/38 ผ่าน** รวม engine เดิม, auth/profile/permissions, session logout, persistence failure/restart/version recovery, legacy seat adoption และ owner controls จากมือถือ.
- `npm run build`: TypeScript/client/server ผ่าน. Build เป็นเพียงหนึ่งใน checks ไม่ใช้แทนการเล่นครบเกม.
- `PLAYWRIGHT_PORT=3001 npx playwright test`: **9/9 ผ่าน**. จอกลาง + ผู้เล่น 3 คนเล่น Camel จบใน **28 rolls**; Dracula จอกลาง + ผู้เล่น 2 คนเล่นจบ **156 actions / 4 rounds / Dracula ชนะ**. ทุกจอเทียบ public state กับ server. ตรวจเดิมพัน/คะแนน/rematch, 6-player partnership, stacked movement/tile effects, secrets projection, retry หลัง ACK หาย, reconnect/refresh, duplicate/gap/reduced-motion.
- GameVerse scenarios ตรวจ search/filter URL, Guest session จริง, profile file chooser/upload/reset/logout, ห้องเฉพาะเจ้าของ, owner phone role/ready/start ขณะจอกลาง iPad เป็น public spectator และอีกผู้เล่นไม่มีสิทธิ์ start. หลังแก้ CSS file input กับระยะปุ่มเริ่มเกม รัน targeted GameVerse **2/2 ผ่าน** และ build ซ้ำผ่าน.
- Test account fixtures ใช้ library adapter/ฐานข้อมูลแยก **ไม่ใช่หลักฐาน Google provider login**. ไม่มี production fake login endpoint.
- Google จริง: ปุ่มในแอปนำ headless browser ไป Google sign-in ได้. ผู้ใช้ล็อกอินใน browser ของตนและยืนยันกลับหน้าเกมสำเร็จ; readonly server verification พบ **1 Google account (ไม่ใช่ anonymous) และ 1 session**. ไม่เปิดเผย email/credentials. ยังไม่ได้ทดสอบ Guest upgrade/cancel ผ่าน provider จริง.
- เปิดตรวจ screenshots desktop/mobile Home/login/profile/lobby, owner phone, ทั้งสองเกมบน desktop/iPad landscape/portrait/phones และหน้าผลจริง. แก้ชื่อบัญชีใน join draft, brand wrapping, native file chooser ที่เคยแสดงภาษาอังกฤษ และระยะปุ่ม. Profile ล่าสุดแสดงปุ่มภาษาไทยและไม่มี native input ซ้ำ. หลักฐานภาพอยู่ `test-results/*.png`.
- Live server port 3000: ย้าย **10 ห้องเดิม** จาก memory ไป SQLite หลังทำ private checkpoint; ตรวจ credentials/roles/player IDs เดิมยังครบ และ revision ไม่ถอย. มีห้องหนึ่งเล่นต่อหลังย้าย จึงไม่ restore checkpoint เก่าทับข้อมูลใหม่. Public watch ไม่มี private player projection; anonymous room list ว่าง. Auth error กลับหน้าไทย.

### เปิดทดสอบและ Google Console

เปิด `http://localhost:3000` ที่เครื่องนี้. Authorized JavaScript origins: `http://localhost:3000`; Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`. OAuth client เป็น Web application. รายละเอียดติดตั้ง/run/test อยู่ README และ `docs/auth/google-oauth.md`.

มือถือ Guest ผ่าน Wi-Fi ใช้ LAN origin ที่ตั้ง `GAMEVERSE_JOIN_ORIGIN` / `GAMEVERSE_TRUSTED_ORIGINS`; Google บนมือถือจริงต้องมี HTTPS domain ที่เข้าถึงได้และลงทะเบียน callback. ไม่ใช้ localhost ของมือถือ.

### ข้อจำกัดที่ยังเหลือ

Chromium จำลอง viewport ไม่ใช่การตรวจ Safari/iPhone/iPad/กล้อง QR/Wi-Fi หลายอุปกรณ์จริง. ยังไม่ตรวจ Google Guest upgrade/cancel/revocation ผ่าน provider จริง, Docker build หรือ HTTPS production. ระบบใช้ coordinator หนึ่ง process และ SQLite local disk; ยังไม่รองรับหลาย replicas และไม่มี automated backup scheduler. ต้องคง secret/DB และสำรองข้อมูลตามคู่มือ. ไม่มี paid service/public deployment ในงานนี้.

## Dracula feedback: ไพ่เปิดจากกองจั่ว / เฉลยทีละเขต — 2026-10-14

แก้ในโปรเจกต์เดิมโดยไม่เปลี่ยนกติกา ผลคะแนน หรือ authoritative resolution. ตรวจคู่มือภาษาอังกฤษที่ดาวน์โหลดไว้ หน้า 6–9: ไพ่ที่เปิดแล้วคงสถานะเมื่อจั่ว/สลับ และตัดสินเขตจากซ้ายไปขวา.

- สาเหตุการ์ด 2: engine/projector ส่ง public `drawn` ที่ revealed ถูกต้อง แต่ renderer แสดงเฉพาะ private drawn ของเจ้าของ. เพิ่ม public draw panel บนจอกลางและมือถือทั้งสองฝ่าย. เมื่อวาง ไพ่คงเปิดใน rack เขตที่เลือก และ server lastAction ระบุสี/เลข/เขตเฉพาะไพ่ที่เปิดแล้ว. ไพ่ที่จั่วปิดยังเป็น private เหมือนเดิม.
- Server ยังส่งผลครบใน revision เดียว. Presentation เฉลยคู่ Dracula/Helsing พร้อมกันเฉพาะเขตปัจจุบัน: flip 500ms แล้วพักอ่านผล 2100ms ก่อนเขตถัดไป. แสดงผู้ชนะ/ผู้แพ้ เหตุผล และ HP/แวมไพร์จาก server result. จอคอมใหญ่มีคู่ไพ่ข้างกระดาน; มือถือ/iPad เหนือกระดาน. ซ่อนผลเขตที่ยังไม่ถึงคิวและป้ายผู้ชนะเกมจนเฉลยจบ. ไม่คิดผลเขตที่ server หยุดเมื่อชนะก่อน.
- ปุ่มพร้อมรอบถัดไป/เล่นอีกครั้งพักระหว่าง presentation; ปุ่ม “แสดงผลทั้งหมด” ข้ามได้. Server ไม่รอ animation. Duplicate ไม่ replay; ready ACK ของผลรอบเดิมไม่ตัด sequence; snapshot/reconnect/gap/reduced-motion snap/resync ตามเดิม. เปลี่ยน reduced motion กลางคิวปล่อย controls และแสดงล่าสุด.
- ไฟล์หลัก: `src/client/dracula.ts`, `dracula-motion.ts`, `dracula.css`, `src/games/dracula-vs-van-helsing/engine.ts` (ข้อความ public action เท่านั้น), tests และ README/UI/architecture docs. ไม่เพิ่ม dependency/assets หรือเปลี่ยน schema/rules version.

ผลทดสอบที่รันจริง:

- `npm test`: **39/39 ผ่าน** เพิ่มข้อ public draw → placement → swap / ordinary draw privacy.
- `npm run build`: typecheck/client/server ผ่าน.
- `PLAYWRIGHT_PORT=3001 npx playwright test`: **9/9 ผ่าน (2.4 นาที)**. Dracula เล่นครบ **162 actions / 4 rounds / Dracula ชนะ**; Camel ครบ **21 rolls**, partnership/final betting/reconnect/rematch เดิมผ่าน.
- Regression จริงบน server + จอกลาง + มือถือ 2 คน: ทิ้งแดง 2 → เปิดม่วง 5 → อีกฝ่ายจั่วและทุกจอเห็น → วางเขต 4 และทุกจอเห็นตำแหน่ง → reload ฝ่ายแรกยังเห็นใบเดิม. Ordinary draw ไม่มี public draw panel.
- เฉลยครบทีละเขตทั้งสามจอ; ไพ่สองฝ่ายในเขตเดียวมี animation start เดียวกัน, เขตถัดไปยังปิด, HP ตรง result ของเขตที่เพิ่งเฉลย, ปุ่มพร้อมพักแล้วเปิดเมื่อจบ. Duplicate event ไม่เพิ่ม sequence; early ready ACK ไม่ตัดคิว; skip/reduced motion กลางคิว/snapshot reload/gap sync ผ่าน.
- Browser test เดิมเคยรอป้ายผู้ชนะไม่เกิน 5 วินาที จึงไม่ตรง UX ที่เฉลยได้ถึง 13 วินาที; ปรับให้รอ presentation idle แล้วตรวจผู้ชนะจริง. Full suite ล่าสุดผ่าน ไม่อ้างผลจาก run ที่ล้มเหลว.
- เปิดตรวจ screenshots จริง `test-results/dracula-public-draw-phone.png`, `dracula-paired-reveal-phone.png`, `dracula-reveal.png` และหน้าผลจบ. ปรับ desktop เป็นสองคอลัมน์ ลดพื้นที่ว่างจาก outcome ที่รอเฉลย. ตรวจตาม web interface guidelines: native buttons/focus, status announcements, aria-hidden สำหรับเขตรอ, interruptible transform/opacity และ reduced motion.
- โหลด live server เวอร์ชันแก้ไขที่ port 3000 หลัง private checkpoint. ตรวจ **10 ห้องกู้ครบ**, revision ไม่ถอย, player IDs/session credentials เดิมครบ และ public watch ทั้ง 10 ห้องไม่มี private `me`; health 200. ไม่ reset/rematch ห้องเดิม.

เปิดตรวจได้ที่ `http://localhost:3000` โดย refresh หน้าที่ค้างเพื่อรับ client ล่าสุด. วิธีทดสอบเฉพาะ Dracula หลัง build: `PLAYWRIGHT_PORT=3001 npx playwright test tests/browser/dracula-motion.spec.ts tests/browser/dracula.spec.ts`. ยังตรวจบน Chromium และ viewport จำลอง; Safari/อุปกรณ์จริงยังไม่ได้ทดสอบ. ไม่มีการ deploy สาธารณะหรือบริการเสียเงิน.

## Azul ภาคหลัก — core gameplay — 2026-10-14

เพิ่มเกมที่สามใน GameVerse และตั้งสถานะ **ready หลังผ่านการทดสอบ**. ขอบเขต 2–4 คน colored wall มาตรฐาน ไม่มีด้านว่าง/ภาคเสริม. ใช้ registry/adapters, Google/Guest, profile, lobby, roles, session capabilities, revisions/receipts, persistence และ reconnect กลางเดิม. ไม่มีระบบห้อง/auth แยก ไม่เพิ่ม dependency, image generation หรือ animation.

### ส่งมอบตามช่วง

1. **Rules/engine:** อ่านคู่มือ Next Move Games ©2018 จริงครบส่วนกติกาและ render หน้า setup ตรวจผนัง. WikiHow เปิดด้วย web fetch ไม่ได้ตอนแรก แต่ curl ดาวน์โหลดและอ่าน HTML ได้ภายหลัง; ลิงก์แปลยังเปิดไม่ได้. บันทึกข้อแตกต่าง/แหล่งใน `docs/games/azul/rules.md`. ผู้ใช้ยืนยัน marker เมื่อ floor เต็มให้ถือข้างกระดาน ไม่เพิ่มค่าปรับเกิน 7 ช่อง; ระบุว่าเป็นข้อวินิจฉัยเว็บ ไม่อ้างเป็น FAQ ทางการ.
2. **Game state:** pure engine + injected server RNG, 100 ชิ้นสีละ 20, โรงงาน 5/7/9, หยิบ/ปลายทาง action เดียว, legal offers/preview/reasons จาก server. Settlement บนลงล่าง/adjacency/floor/bonus/tie-break เกิดครั้งเดียวใน accepted draft สุดท้าย. Refill ใช้ถุงเก่าก่อนสุ่มกองทิ้ง รองรับโรงงานไม่ครบและ empty offer โดยไม่ค้าง drafting.
3. **Room/persistence:** เพิ่ม typed `azul` branch และ public/private DTO. Lobby ทุกคน ready/onlineก่อน owner เริ่ม; เลือกผู้เริ่มหรือสุ่มที่ server แทนเกณฑ์ไปโปรตุเกส. Public boards ทุกคนเปิด ไม่ส่ง bag order/future randomness. Results ให้ผู้เล่นคนใดหรือ owner กดต่อได้แม้คนอื่น offline; ระหว่าง drafting รอเจ้าของตากลับเหมือนเกมเดิม. Rematch คง room/seat/session/revision/receipts. Restore validator ตรวจโครงสร้างและ tile conservation แล้ว quarantine หากผิด โดยไม่ลบ record.
4. **UI/verification:** Thai core UI, CSS squares B/Y/R/K/W, ghost wall cells แยกจากวางแล้ว, counts/pattern/floor/penalties/bonus/history, source→target→preview→confirm/cancel, pending/out-of-turn guards, opponent read-only tabs. จอกลางโชว์ทุกกระดานและ avatar/profile กลาง. ปก SVG ชั่วคราวตามขอบเขต ไม่อ้างเป็น artwork รุ่นสมบูรณ์.

### ไฟล์หลัก

- ใหม่ `src/games/azul/{types,engine,validation}.ts`, `src/client/azul.ts`, `azul.css`, `public/art/covers/azul.svg`, `docs/games/azul/rules.md`, `tests/azul.test.ts`, `azul-rooms.test.ts`, `tests/browser/azul.spec.ts`.
- เชื่อมเดิมใน `src/shared/types.ts`, `catalog.ts`, `src/games/registry.ts`, `src/server/rooms.ts`, `room-validation.ts`, `platform.ts`, `src/client/main.ts`, `platform.ts`. ปรับ gallery tests เป็น 3 เกมและ README/architecture/adding-a-game. ไม่มี destructive DB migration; generic room JSON/schema version รองรับ branch ใหม่ และ version เดิมสองเกมไม่เปลี่ยน.

### ผลทดสอบจริง

- `npm test`: **53/53 ผ่าน**. Azul 14 scenarios รวม pure rules + actual HTTP/auth/WS/SQLite. เล่น seeded games จบ 24 เกม (2/3/4 คน ×8 seeds) พร้อมตรวจ invariant 100 ชิ้น/สีละ20ทุก accepted action. ครอบคลุม source/color/actor/targets ผิด, pattern restrictions, marker/floor overflow, refill/shortage/empty offer, top-down scoring, adjacency, floor zero minimum, bonuses และ tie/shared win.
- HTTP/WS แยก owner/Guest/display: ready/start/owner phone, wrong turn/stale/dedup, retry draft สุดท้ายไม่ settle ซ้ำ, profile labels, restart ระหว่าง drafting และ results โดยถุง/กระดาน/history/revision/receiptsเดิม, owner ไปต่อขณะผู้เล่น offline, corrupt conservation quarantine โดยเก็บ row เดิม. เพิ่มข้อยืนยัน settlement retry แล้วรัน targeted WS ผ่านซ้ำ.
- `npm run build`: typecheck/client/server ผ่าน. Browser full suite `PLAYWRIGHT_PORT=3001 npx playwright test`: **12/12 ผ่าน (3.2 นาที)**. Azul 2 คน **48 drafts / 5 รอบจบเกม**, 3 คน **11 drafts / 1 รอบ**, 4 คน **13 drafts / 1 รอบ**. Regression Dracula **157 actions / 5 rounds จบ**, Camel **31 rolls จบ**, 6-player partnerships, final bets, motion/reconnect/privacy/profile/common portal ผ่าน.
- หลังปรับ layout iPad และเพิ่ม empty-offer guard รัน Azul browser ทั้งสาม scenarios ซ้ำ: **3/3 ผ่าน (40.3 วินาที)**; 2 คนล่าสุด **47 drafts / 5 รอบ**, 3 คน **11 drafts / 1 รอบ**, 4 คน **13 drafts / 1 รอบ**. เช็ก bounding box ว่ากระดานทั้ง 4 คนอยู่ใน viewport 1024×768 ของ fixture และไม่มี horizontal overflow. Full suite ก่อนหน้ากับ targeted ล่าสุดบันทึกแยกตามจริง ไม่ถือว่า build แทนการเล่นครบเกม.
- Browser ใช้ shared display + phone contexts แยก 2–4 คน, owner ร่วมมือถือบัญชีเดิม, ทุกคนดูคู่แข่ง, cancel preview, private turn controls, drop ACK→retry, offline/reload drafting/results, public states ตรงทุก action, finished bonus/rematch. ไม่มี bag order/token ใน public frames. Browser account fixtures ไม่ใช่การทดสอบ Google provider ใหม่.
- เปิดตรวจ screenshots จริง desktop/iPad/mobile/preview/round/finished. พบและแก้ brand แตกบรรทัด, baseline ช่อง wall ไม่ตรง pattern และกระดานล่างล้น iPad. เพิ่ม viewport assertion; run ที่ตรวจพบ overflow ไม่ถือว่าผ่าน. หลักฐานล่าสุด `test-results/azul-4-1024.png`, `azul-2-preview.png`, `azul-finished.png` และ `azul-*.png`; เก็บภาพ regression ของ full suite ด้วย.
- โหลด live server ใหม่ port 3000 หลัง private checkpoint: **11 ห้องเดิมกู้ครบ**, revision ไม่ถอย, ที่นั่ง/session credentialsเดิมยังครบ, public watchทั้ง11ไม่มี `me`, health/ปกSVG200. `/api/platform` มี 3 เกมและ Azul ready. ไม่ reset ห้องเดิม ไม่เผยแพร่สาธารณะ/ใช้บริการเสียเงิน.

### เปิดเล่น / ข้อจำกัด

เปิด `http://localhost:3000/games/azul` หรือ refresh Home → Azul. สร้างห้องด้วยบัญชี Google ให้ผู้เล่นเข้า Google/Guest แล้วทุกคนกดพร้อม. ใช้ QR/รหัสห้องและ reconnect เดิม. คำสั่งติดตั้ง/run/tests และ flow อยู่ README; กติกา/ข้อวินิจฉัยอยู่ rules.md.

UI เป็น core gameplay เท่านั้นตามสเปก. ยังไม่มี artwork/animation รุ่นสมบูรณ์. Browser เล่นครบเกม 2 คน; 3–4 คนตรวจ flow จบหนึ่งรอบ และ pure engine ตรวจครบเกมทุกจำนวน. อุปกรณ์จริง/Safari/กล้อง QR/Wi-Fi หลายเครื่อง/production HTTPS ยังไม่ได้ตรวจในงานนี้. หน้า history/ผลยาวเลื่อนอ่านได้; ชื่อยาวอาจเพิ่มความสูงของกระดาน. ยังใช้ coordinator หนึ่ง process และ SQLite local disk ตามแพลตฟอร์มเดิม.

## Azul — ceramic artwork / tabletop UI — 2026-10-14

ปรับ presentation ในโปรเจกต์เดิมเสร็จและเชื่อม assets จริง. คง DOM/CSS renderer; ไม่แก้ engine, scoring, actions/projections, room protocol, persistence, auth หรือกติกา. ใช้ frontend-design, web-design-guidelines (อ่าน guidelines ที่อ้างอิง), multiplayer-testing, realtime-rooms และ imagegen.

### สิ่งที่เปลี่ยน

- สร้างภาพจริงผ่าน built-in image_gen 11 ครั้ง: tiles 5 ประเภท, board paper/frame, factory disc, first-player marker และปกใหม่; ปรับ yellow/black เพิ่มเพื่อไม่ให้ลายคล้าย blue. PNG source ใน `assets/source/azul/`, runtime WebP 9 ภาพรวม **561,830 bytes**, tiles/factory/marker alpha จริง. ไม่คัดลอกกล่อง/โลโก้ ไม่ฝังข้อความ/ตัวเลขในภาพ. Mapping กลาง/preload 8 critical images และ missing-image fallback. [Assets/prompt set](presentation/azul-assets.md), [direction/tokens](presentation/azul-visual-plan.md).
- แยก reusable `Tile`, `FactoryDisplay`, `PatternLines`, `WallGrid`, `FloorLine`, `ScoreTrack`, `PlayerBoard`, round/final components ใน `src/client/azul-components.ts`; mapping `azul-assets.ts`; renderer `azul.ts`; scoped theme `azul.css`. Catalog ใช้ปก WebP, main เปลี่ยนเฉพาะ Azul theme color.
- จอกลางเห็นโรงงาน 5/7/9 วง ชิ้นจริงครบ กลางจัดกลุ่มพร้อมจำนวน ทุกกระดานพร้อมคะแนน/คนถึงตา. Score track แสดงช่วงค่าจริง 11 ช่อง เช่น 120–130 เมื่อคะแนน121. ผนังว่างลายจาง/เส้นประ แยกจากชิ้นวางแล้ว; floor ค่าปรับครบ. iPad 4 คนใช้ arrangement 2×2 และ compact spacing.
- มือถือแตะ source/color → แถว/พื้น → preview เส้นประ → ยืนยัน. แสดง placed/floor/discarded และ marker จาก server offers. ย่อ supply หลังเลือก, inspect คู่แข่งโดยคง selection, revision ใหม่ยกเลิกพร้อมแจ้ง, pending lock/คำอธิบาย invalid targets. ปุ่มยืนยันอยู่หลัง floor ไม่บังข้อมูล/safe area.
- Local selection/preview/tab ไม่สร้าง public board DOM ใหม่; authoritative revision อัปเดตภาพจริง. ไม่มี state timer หรือ client scoring/randomness. ใช้ feedback เล็กน้อย ไม่เพิ่ม tile-motion queue ที่ไม่จำเป็น; reduced-motion ไม่มี transitions. Reconnect แสดง snapshot ล่าสุดตามระบบเดิม.
- ผลรอบแสดงแถว→พิกัดผนัง/คะแนนแต่ละชิ้น/ก่อนปู/floor/หลังรอบ. ผลท้ายเกมแสดงก่อนโบนัส/แถว/คอลัมน์/สี/bonus/total และเหตุผลตัดสิน/ชนะร่วมตามผล server.

### ผลที่ตรวจจริง

- `npm run build` ผ่าน typecheck, client และ server. `npm test` **53/53 ผ่าน** (9.2 วินาที), รวมกติกาและ actual HTTP/auth/WS/SQLite เดิม.
- `PLAYWRIGHT_PORT=3001 npx playwright test` **13/13 ผ่าน (2.8 นาที)**. ใช้ server/DB ทดสอบแยก ไม่สร้าง fixtures ใน live rooms. Azul จอกลาง + มือถือ 2 คนเล่นครบ **47 drafts / 5 รอบ**, results, bonus, rematch; 3 คน **11 drafts / 1 รอบ**, 4 คน **13 drafts / 1 รอบ**. ทุก action public state ตรงกัน, out-of-turn disabled, lost ACK retry, drafting/results reconnect และเจ้าของร่วมมือถือผ่าน.
- เพิ่ม `azul-presentation.spec.ts`: โหลดภาพ runtime ทุกภาพ HTTP200, server fixture คะแนน121กับแทร็ก120–130, red4 จากกลาง→วาง1/พื้น1/ทิ้ง2 พร้อม marker, invalid row reasons, preview ไม่แก้ state, inspect รักษา selection/board DOM, confirm จริง+duplicate exact command ไม่ขยับ revision/state. Final fixture ให้ engine ตัดสินชนะร่วม40ทั้งคู่ และ UI ก่อนโบนัส38. Rematch/reduced motion/จำลองภาพredเสีย→fallbackเล่นได้, ไม่มี page error/horizontal overflow. Fixtures นี้ทดสอบ presentation edge cases ไม่อ้างว่าเป็นประวัติเล่นธรรมชาติเต็มเกม.
- Regression: Dracula **120 actions / 4 รอบ / Helsing ชนะ**, public reveal/motion/privacy/reconnect เดิมผ่าน; Camel **22 rolls จบ**, 6-player partnerships, final bets, motion/reconnect และ common Home/Login/lobby/profile/QR flows ผ่าน. ไม่ได้ทดสอบ Google provider ใหม่.
- เปิดตรวจ screenshots จริง: `test-results/azul-2-1366.png`, `azul-4-1024.png`, `azul-2-preview.png`, `azul-overflow-preview.png`, `azul-score-121.png`, `azul-2-round.png`, `azul-finished.png`, `azul-tied-final.png`, `azul-art-fallback.png`. พบ iPad overflow แล้วปรับ row sizing/header/spacing; run ล่าสุด assertion กระดาน4คนจบภายใน768pxผ่าน. Run แรกที่ล้มไม่ถือว่าผ่าน.
- เปิด live เวอร์ชันล่าสุด `http://localhost:3000/games/azul` หลัง private SQLite checkpoint. **12 ห้องเดิมกู้ครบ**, revision ไม่ถอย/seatเดิม/session credentialsเดิมยังอยู่, watchทั้ง12ห้องไม่ส่ง private `me`, healthและปกWebP200. ไม่ reset/rematch ห้องผู้ใช้.

### เปิดทดสอบ / ข้อจำกัด

Refresh `http://localhost:3000/games/azul` แล้วสร้าง/เข้าห้องตาม README; หน้าที่ค้างต้อง refresh รับ client ใหม่. `node scripts/prepare-azul-art.mjs` เตรียมภาพจาก PNG ที่บันทึกไว้ ไม่เรียก generation/บริการภายนอก. คำสั่ง Azul browser เฉพาะอยู่ README.

ตรวจบน Chromium จำลอง desktop/iPad landscape/mobile portrait; **ยังไม่ได้ตรวจ Safari/iPad/iPhone จริง**, กล้อง QR หรือ Wi-Fi หลายเครื่องในงานนี้. Browser เล่นครบเกม 2 คน ส่วน3–4คนจบหนึ่งรอบ; pure engine suite เดิมตรวจครบเกมทุกจำนวน. ผล/historyยาวเลื่อนอ่านได้ และชื่อยาวอาจเพิ่มความสูงกระดาน. UI ใช้ motion เบา ไม่มี animation เคลื่อนกระเบื้อง. ไม่มี public deployment/บริการเสียเงิน/เพิ่ม dependencies.

หลัง full suite ปรับเฉพาะตำแหน่งชื่อบนปก Azul ให้กลาง cartouche ที่เว้นไว้ (CSS เจาะเฉพาะลิงก์เกม Azul ไม่เปลี่ยนธีม Home). Build ผ่าน และรัน Home/platform browser ซ้ำ **3/3 ผ่าน (5.3 วินาที)**; ตรวจ `portal.png`/`portal-mobile.png` ใหม่. เก็บ screenshot ของ full suite กลับไว้ร่วมกันโดยไม่ทับภาพล่าสุด.

## Vercel production + Neon Free — 2026-10-14

ผู้ใช้ขอ deploy ให้เล่นเหมือน dev และยืนยัน **ใช้เฉพาะบริการฟรี**. ไม่สร้าง Render/paid plan. ตรวจจริงพบ Git main เดิมมีเพียง README (`20aa708`) จึง deploy READY แต่หน้าแอป404. เชื่อม CLI เข้าทีม/โปรเจกต์เดิม `sarayuths-projects/game-verse`; CLI ใช้ได้แม้ MCP บาง scope อ่านไม่ได้. เพิ่ม source/assets ทั้งโปรเจกต์เข้า Git และ push main สำเร็จ (`831a8da`), Git integration สร้าง production deploymentจากcommitนี้ READY จริง.

### Runtime ที่ส่งมอบ

- Canonical URL **https://game-verse-psi.vercel.app**. Vite assets บน CDN, Node HTTP/WebSocket server เดิมผ่าน `api/gameverse.ts` โดยไม่ listen port เอง. `vercel.json` rewrites API/avatars/health/ws และ SPA deep links, Node24/Fluid/sin1/max300s. Vercel WebSockets เป็น beta; อ่าน docs ปัจจุบันจริง ไม่อ้างข้อจำกัดเก่าที่ว่า Vercel ไม่มี WS.
- Neon Marketplace resource `gameverse` plan **free_v3**, region sin1, built-in Neon Authปิดเพื่อรักษา Better Auth เดิม. ตั้ง production server secrets/Googleผ่าน stdin โดยไม่พิมพ์ค่า. ผู้ใช้เพิ่ม Google origin/callback และ **ยืนยัน login บน URLจริงสำเร็จ**. ไม่ย้าย local DB/บัญชี/ห้อง/secret ไปสาธารณะ.
- Optional Postgres adapter (`src/server/postgres.ts`, store/auth/index/rooms/platform) คง SQLite dev. Worker แยก network I/O เพื่อรักษา synchronous atomic coordinator; transaction advisory lock ครอบ reload/validate/apply/save ก่อน ACK. เก็บ auth/users/profiles/avatars/rooms/revisions/receipts ถาวรใน Postgres. ไม่มี client scoring/randomness หรือแก้ engine.
- Presence connection lease15s + cross-instance refreshประมาณ1s, takeoverข้ามinstance, revocation/roomclose, snapshot/retry/resyncเดิม. ส่งเฉพาะ projection ที่อนุญาต. ไม่รอ animation และไม่ replay state เก่า. เปลี่ยน active connections ระหว่าง deploy กลับผ่าน authenticated resume.
- Trust forwarding IP เฉพาะ managed Vercel runtime (`VERCEL=1`), validateเป็นIP; dev/VMไม่เชื่อclientheaders. ไม่ log IP/cookies/tokens. Worker bound/timeout fail closed. Optimize ไม่เขียนroomJSONเดิมซ้ำ และ clear quarantine diagnostics แต่ละreload.
- Migration checked-in `migrations/002-postgres.sql`, `scripts/migrate-postgres.ts`; test cleanupเลือกเฉพาะ owner IDs ที่fixtureบันทึกไว้ ไม่มี broad delete/name matching. `.env*`, data/backups, test-results, .vercel ถูกignore; staged secret scan **172 files / 0 matches** ก่อน commit. [Deploy/runbook](vercel-deployment.md).

### ทดสอบจริง

- Docker buildของexisting imageผ่าน (ก่อนเพิ่มPostgres runtime); ไม่อ้างว่า Docker production runtimeถูกทดสอบ.
- Final `npm run build` ผ่าน. `npm test`: **54 ผ่าน / 1 skipped / 0 failed**. ข้อskippedคือ opt-in Postgres integrationที่ต้องชี้ฐานทดสอบเอง; ไม่ถือskipเป็นpass.
- Opt-in actual PostgreSQL/HTTP/auth/WS suiteบนDocker Postgres17 isolated: **1/1 ผ่าน (46.6s)**, server instances2ตัว, shared memberships/presence, wrong-turn/stale/duplicate, takeover, Azul **39 drafts / 5รอบจบ**, ทุกpublicviewตรง, anonymous/fixtureaccount/cookie, profileข้ามinstance, กู้finishedจากinstanceใหม่, rematch. รันอีกครั้งหลัง cache/lease/shutdown fixesผ่าน. ไม่ใช้production DBสำหรับrule fixtureนี้.
- **Vercel HTTPSจริง**: `/`, `/games/azul`, `/health`, `/api/platform`200; WSSเชื่อมจริงและตอบroom validation. Browserจอกลาง+มือถือจริงแยกcontexts: Azul2คน **48 drafts / 5รอบจบ**, bonus/rematch, lostACK retry, offline/reload drafting/results, publicprivacy, desktop/iPad/mobileผ่าน **1/1 (45.5s)**.
- **Vercel HTTPSจริง** regression: Dracula2คน **123 actions / 4รอบ / Draculaชนะ**, private draw/reveal/reconnect/rematchผ่าน; Camel3คน **21 rolls จบ** พร้อม reconnectผ่าน (**2 scenariosผ่าน**). พันธมิตร6คน runแรกtestกดมือถืออีกคนก่อนrevisionแรกส่งถึง จึงถูกstale guardปฏิเสธ; ปรับtestรอcommitted revisionทั้งสองเครื่อง แล้ว **1/1ผ่าน (22.6s)**. ไม่เปลี่ยนกติกาหรือผ่อนservervalidationเพื่อให้ผ่าน.
- Browser hosted testsยกระดับเฉพาะ fresh Guest ที่สร้างเองผ่าน PostgreSQL fixture (ไม่มีproduction test endpoint); ไม่อ้างว่าเป็นการทำGoogle OAuthอัตโนมัติ. Google providerบนproductionผู้ใช้ยืนยันด้วยตัวเอง.
- Runtime error log scan productionล่าสุด **0 error records** ในช่วงที่ตรวจ. ไม่มีdrain/monitoringบริการเสียเงินเพิ่ม. Screenshot pathsและหลักฐานexecutionอยู่test-results และ /tmp logsภายในเครื่อง (ไม่commit tokens/traces).

### ข้อจำกัดที่คงอยู่

ใช้เฉพาะfree tiers ไม่อัปเกรด/เปิดpaid overage; quotaหมดอาจหยุดบริการ ไม่รับประกันฟรีไม่จำกัด. Vercel WS beta มีconnection durationสูงสุด300s; reconnectจำเป็น. Coordinatorserializeผ่านglobalDBlockเหมาะกลุ่มเล็ก ไม่อ้างรองรับโหลดจำนวนมาก. ความหน่วงข้ามinstanceประมาณรอบpoll1s. ยังไม่ได้ทดสอบSafari/iPhone/iPadจริง, network WANหลายเครื่อง, load/stress หรือbackup/restoreproduction. Local roomsไม่ย้ายขึ้นproductionและไม่ถูกreset. Googleใช้canonical originเท่านั้น; deploymentaliasesไม่ใช่URLสำหรับเล่น.

ตรวจเพิ่มเติมก่อนส่งมอบ: เติมการ reconnect ของ DB worker เมื่อ managed database ปิด idle connection โดยไม่ reconnect เงียบ ๆ กลาง transaction. เพิ่ม actual `pg_terminate_backend` case ใน isolated Postgres suite แล้ว **1/1ผ่าน (46.7s)**: room/receipt เดิม, profile และ rematch ยังทำงาน. แก้ shutdown ไม่ให้ close handler เรียก DB ที่ปิดแล้ว. Cleanup production fixturesรอบแรก **5ห้อง/23testusers**, คงห้องผู้ใช้ที่ไม่ใช่fixtureไว้. Git production `1f369e3` READY และ functionอยู่sin1จริง; HTTPS/browserตรวจซ้ำบนcanonical URL.


## Custom domain games.basnana.com — 2026-10-14

เพิ่มโดเมนในโปรเจกต์ Vercel เดิมสำเร็จ; DNS ที่ Cloudflare ถูกต้องและ HTTPS `/`, `/health`, `/api/platform`200. Vercel แนะนำ CNAME `games` → `6e168d1d386e77a8.vercel-dns-017.com`, DNS only / Auto; CNAME เดิมไป vercel.app ยังใช้ได้แต่มี optional-change recommendation. ไม่เปลี่ยน nameservers หรือซื้อ domain/บริการใหม่. ผู้ใช้ยืนยันเพิ่ม Google origin/callback ของ `https://games.basnana.com` แล้ว. เปลี่ยน production BETTER_AUTH_URL และ GAMEVERSE_JOIN_ORIGIN ไปโดเมนใหม่ พร้อม trusted origin เดิม; คง secret/DB/rooms/session receipts เดิม. README/runbook/Google docs อัปเดตโดเมนใหม่.

ผลตรวจหลังสลับโดเมน: production `845853b` READY; `/api/platform` ส่ง googleOrigin และ joinOrigin เป็น `https://games.basnana.com` ตรงกัน. เริ่ม Google OAuth สำเร็จและตรวจ `redirect_uri=https://games.basnana.com/api/auth/callback/google` จาก URLจริง (ไม่อ้างว่า agent ทำ Google provider loginจนจบ). Browser สร้างห้องจริงบนโดเมนใหม่, canvasQRและjoin linkใช้โดเมนใหม่ไม่มีtoken/query, WSSใช้งานได้; screenshot `data/custom-domain-lobby.png` (ignored). เล่น Azul ผ่านcustom domainด้วยจอกลาง+มือถือ2คนครบ **47 drafts / 5รอบ**, ผล/bonus/rematch, duplicate retry, offline/reload drafting/results และ public stateตรงกัน **1/1ผ่าน (40.7s)**. ไม่มีการย้าย/ล้าง production user rooms. Guest ที่มีเกมบนโดเมนเก่าควรใช้ลิงก์เดิมจนจบเพราะcookie/storageแยกorigin; Google membersล็อกอินบัญชีเดิมบนโดเมนใหม่ได้.

## เสียงจบตาทุกเกม / ห้องหมดอายุ 10 ชั่วโมง / ไพ่ Dracula บน LG TV — 2026-10-14

ใช้ realtime-rooms, multiplayer-testing และ web-design-guidelines (fetch guidelines ล่าสุด) ตรวจระบบเดิมก่อนแก้. ผู้ใช้ระบุ LG NanoCell 55 นิ้ว webOS ล่าสุด แต่ไม่มีปี/engine version และไม่มี TV จริงเชื่อมให้ทดสอบ.

- เพิ่ม `src/client/turn-sound.ts`: เสียง chime สั้นจาก Web Audio API ใช้ server state ที่ revision ต่อเนื่องและเปลี่ยนตา/ออกจาก playing เท่านั้น ทั้ง Camel Up, Dracula, Azul. ไม่มีการสุ่ม/แก้กติกาจาก client. snapshot/reconnect/duplicate/gap/setup ไม่เล่นเสียงย้อนหลัง; Dracula draw/discard/effect ที่ยังไม่จบตาไม่ส่งเสียง. ปุ่มเปิด/ปิดจำใน localStorage เฉพาะเครื่อง. ต้องมี gesture เพื่อให้ browser อนุญาตเสียง (TV ใช้รีโมตกดปุ่มได้); ไม่อ้างว่าบังคับ autoplay ได้. ล็อกขนาดปุ่มและวาง header มือถือสองแถวเพื่อไม่ให้ข้อความเปลี่ยนตอน pointerdown แล้วดันปุ่ม action ก่อน click.
- เปลี่ยน room expiry ทุก phase เป็น **เกิน 10 ชั่วโมงจาก join ใหม่หรือคำสั่งที่สำเร็จล่าสุด**. watch/resume/sync/heartbeat/poll/duplicate receipt ไม่ต่ออายุ. ลบ durable room record, presence และปิด sockets ด้วย code4004/ข้อความไทย. ตรวจระหว่าง sweep, request และ restore; Postgres อยู่ใน coordinator lock เดิม จึงไม่ฟื้นห้องที่ถูกลบจากอีก instance. ไม่ลบ user/profile/recent history. Runtime scale-to-zero จะล้างเมื่อทำงาน/รับคำขอครั้งถัดไป ไม่รับประกัน background delete ตรงวินาทีที่ครบ 10 ชั่วโมง และไม่เพิ่ม cron/บริการเสียเงิน.
- ไพ่ Dracula ทั้งหน้า/หลังใช้ intrinsic spacer 2:3 พร้อม font/portrait/position fallbacks; กำหนด Vite `build.cssTarget=chrome69` เพื่อไม่ให้ minifier ยุบ longhand fallback กลับเป็น `inset` ที่ engine เก่าไม่รองรับ. ภาพ atlas/ด้านหลังเดิมยังใช้งาน ไม่ส่งไพ่ลับเพิ่ม: จอกลางมีหลังไพ่ 10 ใบ เปิดเฉพาะใบที่ server อนุญาต/ตอนเฉลย. ทดสอบ CSS ที่ตัด aspect-ratio, container-type, inset, cqw ออก และตรวจ screenshot เห็นทั้ง portrait หน้าไพ่และหลังไพ่. นี่เป็น capability simulation บน Chromium ไม่ใช่ LG hardware test.

การตรวจระหว่างพัฒนา: build ผ่าน; `npm test` **57 ผ่าน / 1 skipped / 0 failed** (58 total; skipped คือ opt-in Postgres). Isolated Docker Postgres17 suite **1/1 ผ่าน (46.6s)**: server2ตัว, complete Azul39drafts/5รอบ, race/dedup/takeover/restart/DB idle recovery และลบ active room เกิน10h จากฐานข้อมูลจริง. เพิ่ม pure sound boundaries และ room TTL boundary/cold restore/no-renew tests. Browser รอบแรก 13/14 ผ่าน พบปุ่ม ready ไม่ส่งจาก layout shift ตอนปลดล็อกเสียงครั้งแรก จึงแก้ขนาดปุ่ม; targeted reveal/sound/TV **2/2 ผ่าน** รวม gap, reconnect กลาง reveal, skip/reduced-motion และ mute/reload. ไม่ผ่อน server validation เพื่อให้ test ผ่าน. ผล full regression/deployment สุดท้ายบันทึกต่อด้านล่าง.

Full regression หลังแก้ครบ: `npm run build` ผ่าน; `npm test` **57ผ่าน/1skipped/0failed**; `PLAYWRIGHT_PORT=3001 npx playwright test` **14/14ผ่าน (2.9m)**. เล่น Azul2คน47drafts/5รอบจบ (3และ4คนผ่านรอบจริง), Dracula2คน108actions/5รอบจบ, Camel3คน25rollsจบและวง6คนsettlement; retry/lostACK/stale/privacy/reconnect/rematch, paired reveal/dedup/gap/reduced-motion, mobile/iPad/desktop, turn chime/mute/reload และTV CSS fallbackผ่าน. ตรวจ screenshot `test-results/dracula-tv-css-fallback.png` เห็นภาพหน้าไพ่ที่เปิดเผยพร้อมหลังไพ่ที่เหลือ; ทดสอบทั้งความกว้างและความสูง portrait เพื่อจับกรณีภาพยุบแต่ bboxสูงยังอยู่. ไม่มี TV LG จริง/Safariจริงให้ทดสอบ และไม่ได้ตรวจเสียงจากลำโพงจริง (ตรวจ AudioContext scheduling ที่เกิดขึ้นจริงใน browser).

Hosted verification ของ `b179cd7`: Azul47drafts/5รอบจบผ่าน แต่ Draculaรอบ4/revision111ไม่ขยับและ auth requestถัดมาหมดเวลา. ตรวจ actual API พบ `Database connection unavailable` แม้ health200; runtime error logsไม่มีrecords (exceptionsถูกhandle) แต่ request logsมี500. ไม่ถือ hosted 3เกมว่าผ่าน. พบ bug เดิมของ Postgres bridge: Atomics waitหมด15sแล้ว `failed=true` ถาวร ทำให้ instanceนั้นปฏิเสธทุกDBqueryตลอดชีวิต. เพิ่มการสร้าง worker+reply buffer ใหม่เมื่อ requestถัดไปหลังabandon transaction; ห้ามreconnectกลางtransactionและไม่ replay queryที่ไม่ทราบผล. `ROLLBACK` หลัง workerตายยกเลิก local transaction marker; queryต่อไปจึงเริ่มconnectionใหม่ได้. closeจริงไม่เปิดworkerใหม่. ไม่เปลี่ยนกติกาหรือreceipt semantics.

Isolated Postgres suiteหลังแก้ **2/2ผ่าน (47.0s)** รวม two-instance/fullAzul/expiry เดิม และ actual `pg_sleep` บังคับให้เกิน wait budgetที่ย่อลงในtest: transactionที่มีinsertก่อนtimeoutถูกrollback, ห้ามqueryกลางtransactionที่หาย, หลังrollbackอ่าน/เขียน/commitใหม่ได้, readนอกtransactiontimeoutแล้วrequestถัดไปกู้ได้. ไม่มี query ถูก replay. `npm test` **57ผ่าน/2skipped/0failed** (59total; opt-inPGทั้ง2รันแยกผ่าน). buildผ่านและclient CSS/JS hashเดิม. Hosted test convergence/action budgetปรับ30sให้ครอบคลุม DBtimeout15s+transport reconnect; ยังคงตรวจ revisionตรงกันและgame state/scoreเหมือนเดิม ไม่ใช้แค่health/buildเป็นเกณฑ์ผ่าน.

ผลบน canonical HTTPS หลังแก้ (`7f774a6`, Vercel READY/sin1): Dracula **112 actions / 4รอบ / Helsingชนะ** ผ่าน full game/privacy/reveal/lostACK/reconnect/results/rematch; Camel3คน **29rollsจบ** ผ่าน reconnect. Azul runแรกหลังแก้ DB พบเฉพาะ testเทียบ `connected` ทันทีที่ revisionเท่ากันระหว่างตั้งใจdropACK: presenceไม่เพิ่มgame revisionและข้ามinstanceตามpollได้ จึงปรับทั้ง Azul/Dracula assertions ให้รอ **entire public view converge** (รวมpresence, ไม่ตัดfieldทิ้ง). Azulรันใหม่ **46drafts / 5รอบจบ / 1ผ่าน (42.7s)** รวม bonus/rematch และ offline/reload drafting/results. ทั้ง3game scenariosบนเว็บจริงผ่านหลังแก้; ไม่รวมfailed runsเป็นpass. TypeScriptตรวจหลังปรับtestผ่าน. ไม่มีการสุ่ม/เร่งกติกาในproductionเพื่อให้จบเกม.

ล้าง production fixtures ตาม owner IDs ที่บันทึกไว้เท่านั้น: **6ห้อง / 18testusers**; ไม่เลือกตามชื่อ/ไม่ล้างห้องผู้ใช้จริง. ปิด Docker Postgres isolated ที่สร้างเพื่อทดสอบแล้ว; คง dev server/ฐานข้อมูลเดิม. ไม่มีบริการเสียเงิน/plan/env secret/schema ใหม่. หลักฐานภาพ TV capability simulation เก็บใน ignored `data/qa-feedback/dracula-tv-css-fallback.png`; source/tests/README/status commitครบ. LG NanoCellจริงยังต้องให้ผู้ใช้ reloadหน้าเดิมและตรวจด้วยเครื่องจริง; ไม่อ้างว่า agentทดสอบรีโมต/ลำโพงหรือhardwareนี้แล้ว.

## Dracula controller / compact shared header — 2026-10-14

ปรับตามภาพและรายการผู้ใช้โดยคง renderer DOM/CSS/WAAPI, room/identity, rules, private projections, reconnect และฐานข้อมูลเดิม. ใช้ frontend-design, web-design-guidelines (fetch source ล่าสุด), realtime-rooms และ multiplayer-testing. ไม่เพิ่ม assets/dependencies/ค่าใช้จ่าย.

แนวทางภาพคง Gothic artwork เดิม: navy #101f2a / panel #193039 / ivory #f2e3be / own-faction gold #edce7d / online #65d7a2 / offline #ef6d72; Thai fontเดิมและ Georgiaเฉพาะชื่อเกม. Headerแถวเดียวแบ่ง brandเล็ก / sound / accountขวาบนพร้อมdot-statusใต้รูป; ฝั่งของเรากรอบทอง+ป้ายคุณขนาดเล็กแทนบล็อกใหญ่. ลดchromeเพื่อให้การ์ดเป็นพื้นที่หลัก. ปุ่มเลือกฝั่งและidentityในเกมใช้original role atlasเสมอ แม้มีprofileavatar. ชื่อบัญชีไม่แสดงในheaderแต่มีaria-labelสำหรับprofile link.

รหัสห้องเป็นbuttonมีpaddingและcopy **public /play/<code> URL** ตามjoinOrigin (ไม่มีsession token/secret) พร้อม Clipboard API/fallbackและtoast. Bindครั้งเดียวต่อDOMnodeแม้Azulใช้persistent renderer. Success ACKเฉพาะคำสั่งpendingของตนแสดงtoastแทนnoticeถาวร; duplicate ACKไม่เล่นtoastซ้ำ, คำสั่งใหม่ซ่อนtoastเก่า, errorสำคัญยังมีinlinecopy. Timerใช้เฉพาะdismissข้อความ ไม่แตะgame state. โลโก้ย่อและตัดsubtitle. Statusเป็นdot+ออนไลน์/หลุด ไม่ใช้สีอย่างเดียว.

Dracula: live trump/rankingอยู่เหนือheading actionจากserver view; effect7มีวงกลมสี+symbolsพร้อมaccessible labelsและselected border คงสีเดิมแม้hover. Discard confirmationโผล่fixedด้านล่างกึ่งกลางหลังเลือก พร้อมpreview/disableขณะส่ง, safe-areaและscroll space. Role badgesลดขนาดและบอกฝั่งคุณชัด. Rematchserverเดิมแจกใหม่/คืนHP/แวมไพร์/กองจั่วอยู่แล้ว; เพิ่มexplicit resetของpersistent Dracula rendererเมื่อ finished→playing ยกเลิกanimation/generation/results DOMและlocal presentation countersก่อนวาดsnapshotใหม่ (รักษาห้อง/บทบาท/player IDs/credentials/revision). ไม่เคลียร์/แก้authoritative stateด้วยclient timer.

เพิ่ม browser scenarioจริงจอกลาง+มือถือ2คน: เลือกฝั่งพร้อมภาพเดิม, profileavatarไม่แทนrole, copyURL, compactheader, trump7และสีhover, stickyconfirmหลังscroll, toast, actual final command→finished→restart, assert new private cardsตรงboard, public10backs, HP12/vampires0/discardว่าง/nooldresult, stalefinishedframeignoreและreload. ใช้internal isolated testfixtureเท่านั้น ไม่มีdebug endpoint. ชุดทดสอบรวมจับ Azultablet4boardล้นเล็กน้อยจากheaderใหม่ จึงปรับtablet room-codeแนวนอน/outerspacingโดยคงtile20pxเดิม. ปรับtest success feedbackให้รอtoastที่visibleหลังตั้งใจdropACK ไม่ใช้ข้อความของtoastเก่าที่hidden. ผลสุดท้ายบันทึกต่อด้านล่าง.

ผลตรวจ: build/typecheckผ่าน; `npm test` **57ผ่าน/2skipped/0failed** (opt-in Postgres ไม่รันซ้ำเพราะstorage/engine/serverไม่แก้). Browserรวมรอบหลัก **14ผ่าน/1failed**: failureคือAzul4คน1024×768ล้นแนวตั้งจากheaderใหม่. หลังปรับouterspacing/roomcodeโดยคงtile20px รันเฉพาะAzul4+controller **2/2ผ่าน (13.6s)**. เล่นครบเกมในชุดรวม: Dracula153actions/4รอบHelsingชนะ, Camel27rolls, Azul2คน46drafts/5รอบ; Azul3/4คนผ่านroundflow. หลังเพิ่มauto-scrollไปcontrollerเมื่อserverรับdiscard/rematch รันcontroller+paired reveal **2/2ผ่าน (20.6s)** รวมdedup/gap/reconnect/reduced-motion. Finalbuild+unitผ่าน และcontrollerรันอีกครั้ง **1/1ผ่าน (4.7s)** หลังแก้สีตัวหนังสือselectedrole/hoverสีทรัมป์และdedupcopylistener. ไม่อ้างว่า15/15เป็นsingle full runที่ท้ายสุด.

Screenshotตรวจจริงที่390px: lobbyภาพฝั่งเดิม/กรอบทอง/ข้อความเข้ม, action7สีตรงและborderเลือก, discard-confirmกึ่งกลางล่างขณะscroll, rematchไม่มีoutcomeเก่า. เก็บใน ignored `data/qa-controller/` และสร้างใหม่ได้ตามREADME. Headerโหมดเกมไม่มีชื่อบัญชี/subtitle, profileอยู่ขวาพร้อมdotstatus. Main actionหลังรับdiscard/rematchจะscrollกลับcontrollerเฉพาะมือถือของผู้กระทำ/เกมใหม่ผ่านrequestAnimationFrameและreduced-motion; ไม่เลื่อนตามคู่แข่งหรือdelay state. ยังไม่ได้ตรวจSafari/มือถือหรือLGจริง. ผลdeployบนcanonicalURLบันทึกต่อ.

Canonical Vercel verification `fe05af5` READY: API200. Browser actual HTTPSจอกลาง+มือถือ2contextsเล่น Dracula **124actions / 5รอบ / Helsingชนะ / 1ผ่าน (2.2m)**. ผ่านprivate-draw checks/effects/public-view convergence, lostACK retry, offline/reloadระหว่างเล่น/results และ rematch. เพิ่ม actual Clipboard permission+write/read test: tapcodeได้canonical `/play/<code>` URLจริง ไม่ใช้mockในhostedcase. หลังrestartทั้งสองมือถือ ownhandค่าตรงboardทุกเขต/5backsของคู่แข่ง, public10backs, drawn/result/discardหาย, vampires0, HP12; ไม่มีwinner/reveal/district-result DOMเก่า. Production screenshot `data/qa-controller/production-rematch-phone.png` (ignored). ไม่มีการทดสอบGoogle providerใหม่เพราะauthไม่แก้; ownerfixtureยกระดับfresh Guestเฉพาะtestตามworkflowเดิม. Safari/โทรศัพท์/iPad/LG hardwareและclipboardบนเครื่องเหล่านั้นยังไม่ตรวจจริง.

Cleanupหลังhostedcase: ลบเฉพาะfixture **1ห้อง / 3testusers** ที่owner IDบันทึกไว้ คงห้องผู้ใช้จริง. Final commitเพิ่มเติมมีเฉพาะtestassertions/สถานะ ไม่มีการเปลี่ยนruntimeหลังhostedverification.

## 2026-10-14 — แยกชื่อ/รูปโปรไฟล์และ Docker local port 5555

ตามคำสั่งล่าสุด เปลี่ยน workflow เป็น rebuild Docker หลังแก้โค้ด และรอคำสั่งใหม่ก่อน deploy Vercel/push linked main. บันทึกไว้ใน AGENTS.md; งานครั้งนี้ไม่เรียก deploy และไม่ push Git.

แก้ต้นเหตุ rename ครั้งแรกของบัญชีที่มีรูป Google: INSERT profile เดิมไม่ได้เก็บ avatar จึงบดบัง provider image ด้วย null. การบันทึกชื่อเก็บรูป/source เดิม และแก้เฉพาะ name ใน room membership; upload/reset แก้เฉพาะ avatar จึงไม่ทับชื่อเมื่อสองคำสั่งมาพร้อมกัน. ไม่ย้าย/รีเซ็ตรูปเก่าที่อาจเป็นการตั้งค่าโดยผู้ใช้. หน้าโปรไฟล์แตะรูปเปิด native file picker; ชื่อและ “ยืนยัน” อยู่แถวเดียวกัน ปุ่ม disabled เมื่อไม่มีการแก้ไข/ชื่อว่าง/กำลังส่ง. การเปลี่ยนรูปเก็บ name draft ใน input โดยไม่บันทึกอัตโนมัติ. ตรวจ screenshot มือถือ390px และ iPad1024px ไม่มี overflow.

เพิ่ม compose.yaml, Docker runtime port5555/nonroot/healthcheck, private .env.docker setup, npm scripts docker:rebuild/watch/stop, named SQLite/upload volume และ cookie prefix แยกจาก dev3000. Setup คัดลอกเฉพาะ OAuth credentials ไม่คัดลอก production DB/auth secret; เก็บ secret เดิมในการ rebuild. QR ใช้ LAN origin ที่ setup ตรวจพบ (แก้เมื่อ IP เปลี่ยน). Graceful SIGTERM ปิด connection/DB. พบระหว่างทดสอบว่าค่า GAMEVERSE_DATABASE_URL ว่างถูกเลือกแทน SQLite path ด้วย nullish fallback ทำให้ container crash; เปลี่ยนเป็น nonempty fallback พร้อม regression test. Container ล่าสุด healthy; ไม่แตะ service Docker อื่นหรือ data dev เดิม.

ผลตรวจจริง: npm run build/typecheck ผ่าน; npm test **58ผ่าน/2skipped/0failed** (opt-in Postgres2ชุดไม่ได้รัน งานนี้ทดสอบ Docker SQLite). API/cookie/WebSocket/SQLite suite ตรวจ provider-image fixture ก่อนมี profile row, rename หลัง upload, race name+photo และ room/game state ไม่ถูกเปลี่ยนผิด. Browser port3001: gameverse+profile **3/3ผ่าน (4.7s)** รวม logout/shared identity/owner-phone/public display. Docker actual http://localhost:5555: Dracula+profile **2/2ผ่าน (1.8m)**; จอกลาง+มือถือ2contextsเล่น **141actions/4รอบ/Helsingชนะ**, lost ACK/retry, offline/reload, payload privacy, server state convergence และ rematch. Force recreate container ขณะมี drawn card แล้วกลับ player IDs/private cards/turn/step/racks เดิม ก่อนเล่นต่อจบ. Copy room URL ทดสอบเป็น LAN origin ที่ตั้งจริง ไม่บังคับ localhost. Browser owner ใช้ fresh Guest fixture ยกระดับผ่าน local SQLite เฉพาะ test ไม่มี debug endpoint; ไม่ถือเป็น Google provider login.

ข้อจำกัด: ยังรอผู้ใช้เพิ่ม localhost:5555 origin/callback ใน Google Console และยืนยัน Google login บน port ใหม่นี้; ไม่มี Google session ให้ headless browser จบทดสอบ provider. ทดสอบ Chromium จำลอง ไม่ได้ทดสอบ Safari/โทรศัพท์/iPad/LG hardware หรือ Wi-Fi มือถือจริงในงานครั้งนี้. Docker local ใช้ข้อมูลแยก ไม่ sync ห้อง production. Watcher มีคำสั่งให้เปิด ไม่ได้เปิด watcher ค้างไว้; ตัวแอป Docker รันอยู่และใช้ docker:rebuild ทุกครั้งที่แก้. ผลตรวจรูปคงอยู่หลัง recreate และ final rebuild บันทึกต่อด้านล่าง.

ตรวจเพิ่มหลัง final image: Docker profile suite **1/1ผ่าน (8.2s)** — อัปโหลดรูปผ่าน file chooser, เปลี่ยนชื่อ, force recreate container, reload ด้วย cookie เดิม แล้วชื่อ/รูปและ actual avatar HTTP200 คงอยู่; reset รูปไม่เปลี่ยนชื่อ. ภาพ `test-results/profile-mobile.png` และ `profile-ipad.png` ตรวจ layout จริง. Final rebuild ผ่านและ app healthy ที่5555; ยังไม่ได้ deploy/push. คำสั่งเปิด/rebuild/watch และ Google Console URLs อัปเดตใน README กับ docs/auth/google-oauth.md แล้ว.


## 2026-10-14 — Docker Google credential diagnosis

Copied only Google client ID/secret from private .env to .env.docker, preserving local auth secret, base URL and data volume. Rebuilt Docker successfully. Verified runtime credential equality without logging values. Actual browser Google sign-in from Docker returns Error400 redirect_uri_mismatch for http://localhost:5555/api/auth/callback/google. Production authorization request uses a DIFFERENT OAuth client from dev/Docker and does not show this mismatch. Production keys are Vercel Secrets: env pull returns placeholders, so these were never copied into Docker; removed the temporary pull file. Asked user to add callback to the client matching GOOGLE_CLIENT_ID in .env, or provide production client credentials directly in private .env.docker. Google provider login on Docker remains blocked by Console configuration; do not report it as passed. No production env changes, deployments, Git pushes, engine or room protocol changes.


2026-10-14 follow-up: user confirmed adding the callback to the dev/Docker OAuth client. Re-tested actual Google sign-in from http://localhost:5555/login: authorization request uses http://localhost:5555/api/auth/callback/google; Google sign-in text appears and redirect_uri_mismatch/Error400/401/403 are no longer observed. No credential or runtime change/rebuild required for this external Console update. Account/provider login through the final callback still requires the user's Google session; do not report that final step as tested. No Vercel deployment.


## 2026-10-14 — Docker mapped domain bn-games.basnana.com

User had already exposed the Docker app at https://bn-games.basnana.com. Verified public /health and /api/platform returned the local Docker app, but configured Google origin was localhost:5555 and QR/join origin was the LAN IP. Changed only private .env.docker BETTER_AUTH_URL and GAMEVERSE_JOIN_ORIGIN to https://bn-games.basnana.com; added the HTTPS origin to trusted origins while retaining local origins. Preserved Google credentials, local auth secret and named data volume. Rebuilt Docker healthy; no Vercel deployment/push or tunnel/DNS change.

Actual HTTPS browser smoke: public display plus two independent phone contexts, secure Guest sessions, owner fixture upgraded only freshly-created Guest in local Docker SQLite, ready/start/draw, private drawn card absent from opponent/public projections, reload same player identity. Passed; closed only the fixture room afterward. Public platform returns both googleOrigin/joinOrigin as the mapped domain. Local/public served client JavaScript hashes match (index-XKj8hlYi.js), ruling out the domain pointing at the previous Vercel client build. Screenshot paths data/qa-domain/display.png and phone.png (ignored). Google authorization request now uses https://bn-games.basnana.com/api/auth/callback/google; browser shows Google sign-in text without redirect_uri_mismatch or Error400/401/403 in this check. Final Google account/provider callback still requires human login; not claimed as passed. This was config/transport smoke rather than another complete game; previous Docker complete-game verification remains documented above.

## 2026-10-15 — Calico phase 1: rules and engine (in progress)
Read user attachment, AGENTS, README, architecture/storage and relevant five skills; fetched UI guidelines. Downloaded AEG 2020 official rulebook, extracted all16 pages and inspected setup/scoring diagrams. Added docs/games/calico/rules.md and axial data/initial engine. Scope two players, two publisher-illustrated quilt layouts, all10 base cats, standard/first-game preset. Awaiting user's visibility ruling for hand; do not claim public hand official. Generated original transparent ten-cat atlas; cover/cloth/buttons generation running. Registry/room integration in progress, not yet playable/verified. Existing uncommitted Docker/profile fixes preserved; no Vercel push/deploy.

Calico phase2/3: initial engine tests7/7 then expanded10/10; HTTP/auth/WS/SQLite integration1/1 (28s) passed actual setup draft persistence, server restart between placement/draft, retries/stale/out-of-turn/third-player rejection and complete88actions. Both browser presets passed2/2 (1.3m) after removing empty private draft/options fields from lobby projections. User confirmed open hands; recorded explicit web ruling. Generated/cropped actual10cat cutouts,7buttons,cover,cloth, plus code-native fabric patterns/fallbacks (420KB Calico artwork + cover). Rechecked printed border diagram at higher resolution and corrected first board color/pattern transcription. Current UI review found invisible SVG strokes and inherited wood background; fixed. Expanded cat conditions to be visible without opening details, tile detail zoom, mobile market ordering/scroll and goal-label sizing. Full18-case browser regression running; final Docker verification still pending. No claim of completion yet.


Calico verification update: full npm test 73total /71passed /2skipped /0failed (opt-in Postgres not run; deployment target remains Docker SQLite). Includes128 deterministic standard games with varied markets/hands/goals covering all10cats, incorrect connected shapes, awards using printed edges, tie-break by cats/buttons/shared victory, HTTP/WS privacy/retry/stale/third-player rejection, durable restart during setup and pending draft, corruption quarantine. Browser full regression18 cases:17passed/1failed due old gallery assertion expecting3covers. Updated expected4 and targeted platform scenario passed1/1. Actual previous games completed in regression: Azul2players45drafts5rounds plus3/4player rounds, Dracula and Camel complete-game suites passed; full log in ignored /tmp/calico-regression-browser.log for this session.

Docker actual localhost:5555 Calico two presets:2/2passed (1.7m), each88actions/44placements, standard14/18points, first-game9/11points. Tested open hands, concealed goal drafts/options, player3 rejection, lostACK retry, reload mid-draft with same identity, final server score convergence, restart/rematch clears placements/awards, asset HTTP/image load checks, animation duplicates do not replay, correct actor board selected, and reduced-motion first-game scenario schedules0animations. Last minor renderer correction initializes event-sequence baseline at0 for first placement in a fresh first-game preset; final public-domain smoke follows. Artwork/layout screenshots checked on desktop/iPad/mobile. No real iOS/Safari/LG hardware or new Google provider end-to-end login checked. Current scope uses the two printed quilt layouts illustrated in publisher setup, not all four board-color layouts. No Vercel deploy/push.


Final HTTPS smoke on https://bn-games.basnana.com passed: Portal shows4games/Calico ready, fresh owner fixture +2phones create/join/ready/start first-game preset; hands public; first placement animates exactly once on the actor board; reload during pending market selection restores identity/state without replay; market choice advances turn and all3screens converge on same revision. Took data/qa-calico/domain-desktop.png, domain-ipad.png, domain-phone.png and visually reviewed real UI. Closed only fixture room and deleted3fresh fixture user records, preserving real rooms/accounts. Public /api/platform200 returnsCalico ready and canonical Google/join origins unchanged. Last visual tweak enlarges the short ≠ goal symbol; no scoring/transport changes after verification. Final Docker rebuild passed and container is healthy after the last UI polish.


Calico delivery status: ready on Docker localhost:5555 and https://bn-games.basnana.com/games/calico. Re-ran HTTPS smoke after enlarging the ≠ symbol: passed same three-context flow, first-placement animation and pending-draft reconnect; cleaned scoped fixture room/users. README commands/rules/design/asset mapping updated. Working tree retains earlier user-authorized profile/Docker changes; no reset, push or Vercel deployment. Remaining limits: only two quilt-board layouts from the official setup illustration, explicit user-approved open-hand visibility ruling, no actual Safari/iPad/phone/LG hardware verification, no opt-in Postgres test in this SQLite/Docker task.

## 2026-10-15 — 7 Wonders Duel
A: inspected existing registry, room authority, persistence and DOM/WAAPI rendering; read publisher 2015 base rulebook/helpsheet/FAQ. Added working rules document and visually transcribed 73-building catalog + 3 graph layouts. Wonder costs still under verification. B–F not complete; game not yet registered/playable. Preserve existing four games and Docker data. No Vercel deployment/push authorized.
B: initial engine and cost optimizer implemented. Six deterministic tests passed including 256 full seeded games, exact deck/token/Wonder conservation, graph accessibility, payment/chain and public face-down privacy. Wonder costs now verified against official Asmodee USA all-12 product photo; prior question no longer blocks work. C/D: typed registry, room/projection/restore branches and initial Thai shared/mobile UI written; typecheck passed. More effect/transport/browser coverage and artwork pending.
C/D/E: shared registry/projection/room lifecycle/restart/reconnect wired without new auth/storage services. UI has Wonder draft, three graph layouts, explicit card inspection/action/cost preview/confirmation, public cities, military track, Progress, public discard, secret Great Library decisions, final score breakdown and rematch. Original imagegen atlases generated and integrated:12 Wonder scenes,28 shared building/Guild scenes mapped to73 IDs,10 Progress + coin/pawn/loot; SVG Age backs. Artwork map/design docs added. First browser screenshot review moved mobile action detail directly below graph (previously below both cities), added resource legend and detailed generated markers. Event/revision motion dedup/reconnect/reduced-motion, explicit gap sync, extra-turn sound and asset preload added. No game-state timers.
F ongoing: npm test latest completed run87 pass/2 opt-in Postgres skips. Targeted Chromium5/5 (portal + normal full three-Age game, military/science late-game fixtures and private Great Library refresh); broader22-test regression and stricter restore/private-choice restart checks running. Docker rebuild still pending final checks. No Vercel deployment/push.

### Final verification — 7 Wonders Duel

Implemented A–F and registered `seven-wonders-duel` as ready (base2015-v1/schema1, exactly2). Rules costs/effects verified against publisher rulebook/helpsheet/FAQ and Asmodee USA full12-Wonder photo; no house rules/expansions/promos/AI added. Source atlases and runtime assets exist, not prompts/placeholders. Server owns shuffle/decks/effects/payments/score; projector excludes hidden and setup-out cards, boxed tokens and buried identities. Pending Great Library selection survives real SQLite/server restart unchanged and never appears to opponent/display.

Executed evidence:

| Command / surface | Actual result |
| --- | --- |
| `npm test` | 90 tests:88 passed,0 failed,2 opt-in Postgres tests skipped. Includes15 Duel engine cases (256 seeded complete games; all73 buildings/12 Wonders/10 tokens; costs/flexible production/discounts/chain; every Wonder/Progress/Guild effect;7th Wonder; final ties; corruption guards), actual HTTP/auth/WS complete70-action game, wrong-turn/duplicate/stale commands, SQLite restart at Age selection and private Great Library, retry of final choice, plus other-game/platform suites. |
| `npm run build` / Docker build | Typecheck, Vite and server compile passed; `git diff --check` clean. Build alone is not acceptance evidence. |
| Full `PLAYWRIGHT_PORT=3001 npx playwright test` | 21/22 passed (6.2m). Only failure was old Home test hardcoding4 covers after adding fifth game. Fixed cover-count assertions to use shared catalog; targeted `gameverse.spec.ts` + `platform.spec.ts` then3/3 passed. No claim of a single final22/22 run. Previous four games completed their tested flows: Camel Up21 rolls +6-player settlement; Dracula173 actions/5 rounds; Azul2-player47 drafts/5 rounds and3/4-player round flow; Calico88 actions each preset. Profile/sound/TV fallback/motion tests passed. |
| New Duel browser suite | 4/4 passed. Normal game uses real UI shared display +two independent phone contexts from room creation/Wonder draft to full three-Age civilian result, authoritative costs, lost ACK/retry, pending-choice refresh, third rejected, duplicate event, deliberately dropped state then sync, card-flight animation, public/private payload checks, image integrity, viewport overflow and clean rematch. Other3 tests use controlled late-game fixtures on isolated real HTTP/WS test servers for military/science victory and private Great Library refresh; science case reduced motion. Fixtures are test-only and do not ship an endpoint. |
| `GAMEVERSE_E2E_DOCKER=1 npx playwright test --config playwright.docker.config.ts tests/browser/seven-wonders-duel.spec.ts` | 4/4 passed44.7s. Normal full-game flow runs on actual localhost5555 Docker; three targeted victory/Library fixtures run isolated test servers as above. Owner is a freshly created test Guest upgraded only by test fixture, not Google provider proof. |
| Canonical HTTPS `https://bn-games.basnana.com` | Real Chromium shared display +two phone contexts:5-game portal, fresh fixture owner +Guest join/readiness,8 Wonder choices +60 card plays +2 next-Age choices =70 accepted actions, all3 Ages, refresh during pending starter, scores converged on all screens, civilian result and clean rematch. Closed fixture room and removed only its3 newly created fixture users (guard skips any Google-provider account). Actual Google provider login not retested. |

Visual review: screenshots of all3 Ages on desktop/iPad layout, phone cost/confirm and final results inspected. Mobile detail moved before cities; resource legend/production summary added, touch actions remain explicit preview then confirmation. Final QA found generated token atlas spacing was not uniform: fixed crops with inspected alpha-component bounds (whole coin/pawn/token, no neighbouring fragments), regenerated WebP and rebuilt Docker. Cloudflare serves old unversioned images up to4h; runtime image URLs now carry artwork version2, and HTTPS-served coin bytes were checked equal to new local file. Screenshots/evidence retained in ignored `data/qa-wonders/`; no session tokens in artifacts/log summaries.

Docker `npm run docker:rebuild` completed healthy at5555, preserved `gameverse-local_local-data` and canonical join/auth domain. No Vercel deploy, promotion or git push. Runtime assets total about2.6MB with preload/local fallback; generated original28 building scenes are shared across73 distinct card IDs, while all12 Wonders and10 Progress have distinct illustrations. SVG rules symbols/Thai labels/costs stay in code. All main-path image requests passed; fallback exists for failures and is not used as normal artwork.

Remaining limits: browser verification is Chromium viewport simulation, not physical iPad/iPhone/Safari/LG TV; two Postgres multi-instance opt-in tests were skipped (Docker uses SQLite single instance); no actual Google provider end-to-end retest. Supremacy browser tests are late-game controlled fixtures, not naturally played full setup-to-supremacy games. Artwork reuse within building category is deliberate and documented. No outstanding blocker identified for two-player base-game play on Docker.

## 2026-10-15 — Jaipur
A: inspected existing five-game registry, shared auth/Guest/rooms/persistence and DOM/WAAPI renderer; fetched official Space Cowboys©2019 English rules and publisher component photo.55cards/38goods/18bonus/camel/seals, privacy of opponent herd, actions, end-of-round and match rules documented. User approved rare all-three-tiebreakers-equal ruling: drawn round/no seal/explicit starter selection. Exact bonus multiplicities still being cross-checked. B–F pending; game not yet registered/playable. Preserve Docker volume and do not deploy/push Vercel.
B/C: Jaipur engine +12 deterministic tests passed, including256 full seeded matches; all finite components conserved, exchange mask offers, sales/bonus/minimum, deck-vs-refill ending, camel ties, all tie breakers, user-approved draw ruling and projections. Actual HTTP/auth/WS/SQLite full match test passed42.6s: third player rejected, wrong-turn/duplicate/stale, hidden hand/herd/bonus/public subtotal, restart after earned bonus with identical hand/deck/bonus and clean rematch. Ready for artwork phase after core/privacy gate. D initial controller/shared table next; E inventory/design documented before imagegen.

D/E: implemented original generated artwork and 2D DOM/CSS/WAAPI shared/mobile UI with local take/exchange/sell previews, server-provided offers, grouped selectable hand, private tokens, explicit confirmation, result/next/rematch. First actual browser match passed:96 accepted actions,2 rounds,2 seals; display +2 independent phones +third rejected, earned-bonus reconnect, dropped ACK retry, duplicate event, revision-gap resync, reduced motion and all runtime images. Screenshots inspected at1440px desktop,1024px iPad and390px phones; corrected footer overlap found in screenshots with centered fixed confirmation shown only for a valid own-turn selection. Full unit/integration suite103 tests:101 passed,0 failed,2 opt-in Postgres skipped. Full browser regression and Docker checks in progress.

### Final verification — Jaipur

Implemented Jaipur base game, Space Cowboys ©2019, exactly2 players, first2 round seals. Original finite catalog55 cards/38 goods/18 bonus/1 camel token/3 stable-ID seals. The sole extra web ruling is the explicitly approved all-tiebreakers-equal drawn round: no seal and explicit agreed starter. Official rules and secondary component-value provenance are separate in `docs/games/jaipur/rules.md`.

| Executed verification | Actual result |
| --- | --- |
| `npm run build`, `npx tsc --noEmit`, `git diff --check` | Passed. No new runtime dependencies. |
| `npm test` |103 total:101 passed,0 failed,2 optional Postgres tests skipped. Includes12 Jaipur deterministic cases with256 full seeded matches, finite-component invariants after every accepted action, exact refill end, partial goods payout/bonus, all tie breakers/draw, both camel outcomes, invalid exchanges, private projections and corrupted restore checks. |
| `npx tsx --test tests/jaipur.test.ts tests/jaipur-rooms.test.ts` after seal/lifecycle hardening |13 passed. Actual HTTP/auth/WS/SQLite full match: third rejected, wrong turn, duplicate ID applied once, stale revision rejected, restart after earned bonus restores identical hand/herd/deck/bonus, full match and clean rematch. Shared-screen next-round event uses a lifecycle actor rather than impersonating a player. |
| `PLAYWRIGHT_PORT=3001 npx playwright test` |23 cases executed:22 passed,1 obsolete test assertion failed because it equated Dracula's five districts with the portal game count (now six). Corrected that assertion to five. Other complete-game regressions passed: Camel Up3 players, Dracula5 rounds, Azul2 players, Calico2 variants, Duel3 Ages and military/science/library paths; room/profile/motion/privacy tests passed. |
| Targeted rerun: `PLAYWRIGHT_PORT=3001 npx playwright test tests/browser/gameverse.spec.ts tests/browser/platform.spec.ts tests/browser/jaipur.spec.ts` |4/4 passed, including the corrected owner-on-phone/public-display test and complete Jaipur89 accepted actions/2 rounds. Initial Jaipur browser run96 actions/2 rounds; regression run87 actions/2 rounds. |
| `GAMEVERSE_E2E_DOCKER=1 npx playwright test --config playwright.docker.config.ts tests/browser/jaipur.spec.ts` |Final run passed:83 accepted actions/2 rounds. Display +2 independent phones, third player full-room rejection, take/exchange/sell previews send zero commands before confirmation, sale preview matches server offer, earned-bonus reload retains identity/hand/herd/bonus, lost ACK retries once, duplicate event causes no new motion, omitted revision triggers sync, reduced motion, no opponent face in hand flights, no missing/fallback images, final score equality and complete rematch reset. Earlier successful Docker run96 actions/2 rounds. Fault-injection helper now drops all deliveries at the chosen missing revision so unrelated presence snapshots cannot accidentally fill the intended gap. |
| Actual HTTPS `https://bn-games.basnana.com` using isolated browser identities |Full match130 accepted actions/3 rounds/first2 seals, display +2 phones, rejected third player, exchange/sale previews, ACK loss, duplicate/gap, earned-bonus reconnect, matching results, reduced motion, image checks and rematch reset passed. Closed only fixture room and removed only four fresh fixture users without provider accounts. Six registry games ready and canonical join origin confirmed. |

Screenshots inspected: cover/entry, desktop1440×1000, iPad landscape1024×768, both390×844 phones, exchange selection, sell preview, round results and final match. Final HTTPS evidence kept locally in ignored `data/qa-jaipur/domain-*.png`; reproducible browser suite captures `test-results/jaipur-*.png`. Found and corrected overlapping sticky preview footer; valid own-turn selections now show centered confirmation at screen bottom with reserved content space. Hand grouping toggle preserves individual card selection and keyboard focus. Goods distinguished by illustration, Thai name, color and code symbols. Native buttons/select labels, focus-visible, safe areas, no required drag, reduced motion and dimensions on images checked against fetched Web Interface Guidelines.

Delivery files: `src/games/jaipur/` engine/catalog/types/restore guard; `src/client/jaipur.ts` and `.css`; existing registry/shared protocol/room projection/lobby/main renderer integrations; `tests/jaipur*.test.ts` and `tests/browser/jaipur.spec.ts`; original PNGs in `assets/source/jaipur/`, WebP runtime in `public/art/jaipur/` and portal cover, crop script and asset map; README install/run/test instructions. Runtime artwork approximately1.1MB. All hidden bonuses share one common back; values, categories, Thai names and numbers are code, never generated text. No secret IDs/values select public artwork.

Docker rebuilt healthy on5555, retaining named data volume and the user's auth/domain settings. No Vercel deploy, promotion or git push. Limitations: browser verification uses Chromium viewport emulation, not a physical iPad/LG TV; fresh Google-provider login was not re-tested (fixture owner + actual Guest/session flow used). Optional Postgres integration was not configured/run. No expansion, AI, accounts infrastructure changes or undo after new information is revealed. No required Jaipur implementation work remains.

## 2026-10-15 — Calico 1–4 / Solo / mobile update

A: re-read attachment, existing engine/rooms/renderer/README/rules and five project skills. Downloaded and read publisher2020 rulebook (current AEG2025 hosting), including p8 Solo and pp10–13 achievements/scenarios; attempted user YouTube link but tool could not open video, so no claim of watching it. Official Solo is take1, discard ONE remaining tile furthest from bag, slide survivor away, refill2 in order; user’s assumed discard2/refill3 is not the selected printed rule. No extra solo ranks invented: base Solo records normal score, scenario pass thresholds belong to optional scenarios outside this change. Clear yellow/green board component images cross-checked against user reference; original0/1 layouts preserved.

B/C: expanded finite engine, catalog/filter, readiness/turn cycle and restore validation to1–4. New state mode derives once at start; Solo removed pile + authoritative conveyor event, 22 complete place/draft turns, including final printed step2 (59 tiles left,22 removed). Multiplayer shares one market, no Solo discard, total22×N placements. New stable award IDs/earning cells/sequence and rainbow anchor, existing scores unchanged. Existing two-player rooms accepted under explicit v1 version compatibility without rewriting their state/boards/setup/money; new games v2. Existing12 rule tests and actual2-player WS match passed, plus96 seeded full1–4 matches, everySolo pick index, conservation, legacy state/score and v1 SQLite record compatibility tests. Actual WS1/3/4 seat tests passed mode/readiness/full room/dup/stale/restart at conveyor boundary; Solo completed44 accepted actions. Two real browser2-player complete games88 actions each passed. New browserSolo44 actions/3-person12/4-person16 actions passed with short phone620px, QR room menu, icon sound, public market and reconnect. UI screenshot review found need to fit all4 boards on a shared screen and move confirmation into sticky market instead of covering quilt; improvements in progress with token overlay checks next.

### Final verification — Calico update

Completed1–4 support, official p8 Solo conveyor, compact controller market/confirmation dock, header room info QR/copy menu, icon sound, coordinate reward overlays and explicit backward compatibility. Existing artwork reused; no new runtime dependencies/services or whole-game rewrite.

| Executed check | Observed result |
| --- | --- |
| `npm run build`, `npx tsc --noEmit`, `git diff --check` | Passed. |
| `npm test` |111 tests:109 passed,0 failed,2 optional Postgres tests skipped. Calico includes16 unit cases: original128 seeded two-person games plus96 full1–4 games (24 seeds each), each Solo pick position, exact final-turn refill,108-tile conservation including removed pile, shared multiplayer market/modulo turn order, finite4 printed boards, score/tie/award-merge tests, legacy state score compatibility and v1 SQLite record load/v2 version persistence. Solo end-turn sound separately verified after draft despite unchanged actor; no sound on place/snapshot/duplicate/gap. |
| `npx tsx --test tests/calico-rooms.test.ts` |4 passed: real HTTP/auth/WS/SQLite two-person complete game and1/3/4 seat flows, readiness and fifth-player rejection, idempotent retry/stale rejection, restore mid-placement/draft and after conveyor under different RNG, same identity and market/bag/removed/award state, no repeated refresh/payout. Solo44 accepted actions;3/4 multiplayer12/16 accepted actions cover two full turn cycles. |
| `PLAYWRIGHT_PORT=3001 npx playwright test` |27/27 passed in7.8min. Includes Calico2-person standard and beginner complete games88 actions each, Solo complete44 actions,3/4-person12/16 actions, reward fixture; full Camel Up3 players, Dracula4 rounds, Azul2-person complete, Jaipur3-round match, Duel3 Ages plus military/science/private choice; common Home filters/profile/auth fixture/room controls/reconnect/privacy/motion and audio/TV fallback regressions. |
| `GAMEVERSE_E2E_DOCKER=1 npx playwright test --config playwright.docker.config.ts tests/browser/calico.spec.ts` |6/6 passed in2.5min on actual port5555 Docker. Same complete Solo/two-person games and3/4 seat flows. Short390×620 phone, desktop1600×1000, iPad1024×768; room QR menu, icon sound, local preview/confirm, reconnect/retry, clean rematch, consistent public score and token rendering. |
| Last targeted Docker rerun `--grep 'Calico 4 players\|reward overlays'` |2/2 passed13.8s after final layout/focus updates. Explicitly asserts all four quilts fit simultaneously inside the1024×768 viewport; each can expand/collapse with owner retained. Token fixture earns both cat/button from actual engine transitions, inspects conditions, fades overlays, reloads/resizes without changed award IDs/count/score, and checks no snapshot replay. |

Screenshot review: Solo large quilt, two-person view, four-person desktop row/iPad row, short phone placement with market visible, room menu/QR, final Solo, multiple cat/button overlays and low-opacity mode. Latest screenshots locally in ignored `data/qa-calico-v2/`; repeatable paths `test-results/calico-v2-*.png`. Moved confirmation out of bottom-over-quilt position into sticky market; clip token hitboxes to their already occupied earning hex so empty neighbouring placement targets remain accessible. Preserved keyboard focus for hand/hex/market, expand/collapse and returning from token details. Shared score summaries and all four quilts fit iPad; detailed cat/design rules remain expandable or available below the overview.

Compatibility is non-destructive: store accepts exactly the old Calico v1/version pair in addition to current metadata, validates actual state, and leaves an in-progress old two-person game's mode/setup/boards/bag/scores intact. No pixel-location backfill, re-awarding or live DB reset. Old rainbow with no recorded anchor remains in summary. New/restarted games persist v2 metadata; other games retain their versions. Original108 patch catalog and generated artwork remain in use. Rules/component-photo provenance and the unobtainable video are documented in `docs/games/calico/rules.md`; layout/overlay details in `design.md`; README scope and play/run/test commands updated.

Docker rebuilt with original named volume preserved, localhost5555 and canonical `https://bn-games.basnana.com` health200. Canonical catalog confirms Calico supported counts[1,2,3,4], rules `base-2020-one-to-four-v2`, schema2. No Vercel deploy, promotion or git push. Limitations: Chromium viewport emulation, not physical iPad/LG TV or real mobile browsers; Google provider not re-tested (existing isolated owner fixture + actual Guest/session flow); Postgres opt-in tests not configured. User video could not be opened/watched. No optional campaign/scenarios/achievements, lower-variance/family rules, AI opponent or invented generic Solo score ladder. No required implementation work remains.

Final motion hardening: reward elements now carry their earning hex so a newly awarded token animates at its own anchor, instead of selecting an older token of the same type. Actual Docker two-person beginner game rerun passed88 accepted actions/44 placements (43.1s), with instrumentation asserting every cat/button animation targets a coordinate/type included in the current authoritative event. Final score6/12 matched all screens; reconnect and rematch checks passed. Rebuild after documentation retains the same validated runtime code.

## 2026-10-15 — Jaipur UX และแถบบนร่วมทุกเกม (ล่าสุด)

ปรับตาม attachment `0a87ef57-5523-4c52-8601-7ad154aef2f1`: ใช้ artwork เดิมทั้งหมด ไม่เปลี่ยนกติกา/คะแนน/การจั่ว/ขอบเขตข้อมูลส่วนตัว และไม่เพิ่ม dependency runtime.

### ส่งมอบ

- `src/client/game-header.ts`, `game-header.css`, `turn-status.ts`, `main.ts`, `turn-sound.ts`: แถบบนทั้งหกเกมมีข้อมูลห้อง/รหัสกดคัดลอก/QR, สถานะตาคุณหรือตาผู้เล่นที่ตัดชื่อยาวด้วย ellipsis และ speaker icon44px. Lobby คงคำเชิญเดิม. แสดง simultaneous setup/settlement ตาม phase จริง. Live region อยู่นอก DOM เกม ประกาศครั้งเดียวต่อสถานะ/จบตาที่รับสำเร็จ รวม Solo/extra turns ไม่ประกาศใหม่เพราะ ACK/presence/local preview.
- ลดข้อความเทิร์นซ้ำใน Camel Up, Dracula, Azul, Calico และ Duel โดยเก็บคำแนะนำการกระทำและผลเกมไว้.
- `src/client/jaipur.ts`, `jaipur.css`: goods ทั้งหกแถวเดียวที่320/390px, ค่า/ขั้นต่ำจาก catalog/server, แตะดูค่าที่เหลือ, หมดกองคงช่องสีเทาและไม่มีเหรียญเก่า. โบนัส3/4/5+ และอูฐอยู่ใน bank เดียวก่อนตลาด. เอากองทิ้งออกเฉพาะ UI และขยายการ์ดตลาด ไม่ลบ state/discard logic.
- กองอูฐคู่แข่งเหนือโต๊ะเป็นสัญลักษณ์สามใบคงที่ ไม่มีตัวเลขหรือจำนวนชั้นตามข้อมูลลับ; กองตัวเองใต้ตลาดมีจำนวนจริง/ที่ว่างขนาดคงที่. หน้าแลกใช้ภาพการ์ดอูฐ+badge และปุ่ม44×44pxกลมไม่ยืด/หด.
- มือเรียงตาม GOODS เสมอด้วย stable card IDs. เลือกสินค้า1ใบเป็นหยิบ,2+ใบเป็นแลก,ลดเหลือ1ล้างรายการคืน; อูฐเป็นหยิบทั้งตลาดแยกกัน. ทุกอย่างเป็น preview จนยืนยัน และยังใช้ server offers/validation เดิม.
- `src/client/dom-patch.ts`: patch โต๊ะ/มือ/การ์ด Jaipur ตาม keys เก็บ DOM/โฟกัส/ภาพเดิม ไม่ remount ทั้งหน้าเมื่อเปลี่ยนrevision. เอา scrollIntoView ออก. พบจากการทดสอบจริงว่าข้อความ pending เหนือโต๊ะเพิ่มความสูง34px จึงย้าย feedback รอไปที่ปุ่มยืนยัน ไม่ทำแถบบนเพิ่ม/หายทุกคำสั่ง.
- `src/client/jaipur-results.ts`: native dialog แยกจาก game DOM ใช้ immutable settlement ตามลำดับที่นั่ง สินค้าทีละคน → โบนัสทีละคน → อูฐทีละคน → server totals/tie-break/winner. มีข้าม/reduced-motion/ตกลงเฉพาะจอ/เปิดดูอีกครั้ง. ตารางคะแนนหลักยังอยู่ ต้องกดเริ่มรอบถัดไปหรือเริ่มเกมใหม่เองผ่านสิทธิ์เดิม ไม่มี timer คิดคะแนน/แจกseal/เริ่มรอบ.
- `types.ts`, `engine.ts`, `validation.ts` ของ Jaipur และ `server/rooms.ts`: เพิ่ม optional public match UUID ซึ่ง server สร้างตอน start/restart และเก็บใน state เดิม เพื่อ dedup ผลด้วยห้อง+match+round. ไม่เปลี่ยน RNG ของ engine หรือ rules/schema version; save เดิมไม่มี UUID ยังกู้ได้โดยใช้ immutable settlement เป็น fallback identity. อัปเดตตัวตรวจ optional metadata. Reconnect/reload แสดงยอดสุดท้าย; receipt snapshot ซ้ำไม่เริ่มหรือขัดจังหวะการนับ. เริ่ม match ใหม่ยกเลิก overlay เก่า.

### ตรวจจริง

- `npm test`: **113 tests:111ผ่าน,0ล้มเหลว,2ข้าม** (Postgres optional ไม่ได้ตั้งบริการ). รวมกติกา/WS/SQLite/privacy/retry/reconnect และ shared turn-status/sound สำหรับทั้งหกเกม.
- `npm run build`: typecheck + client/server build ผ่าน.
- `npm run docker:rebuild`: container `gameverse-local-app-1` healthy, ใช้ named volume/SQLite/Google config เดิม ไม่ reset DB. `/health` ผ่านทั้ง `http://localhost:5555` และ `https://bn-games.basnana.com`.
- `GAMEVERSE_E2E_DOCKER=1 npx playwright test --config playwright.docker.config.ts --output=data/qa-jaipur-docker tests/browser/jaipur.spec.ts`: **ผ่าน1/1**, เล่นจริงบนDockerด้วยจอกลาง+มือถือสองidentity **129 accepted actions,3รอบ** จบการแข่งขันและเริ่มเกมใหม่. ตรวจภาพ/ไม่มีartหาย, market auto-mode, circular stepper, stable DOM และ ความต่าง scroll <3px, ข้อมูลลับ/preview, lost ACK, revision gap→sync, eventซ้ำ, reconnectมือเดิม, reconnectระหว่างนับแล้วข้ามยอดสุดท้าย, reduced motion, ปิดเฉพาะจอ/เปิดดูอีกครั้ง, ลำดับนับตามserverและmatch IDเปลี่ยนหลังrestart.
- รอบ regression แรกพบ2รายการ: test Camel ยังหา heading เก่า และ scroll pending34px. แก้ selector ตาม heading ใหม่และแก้สาเหตุ layout shift แล้ว; ไม่มีการผ่อนเกณฑ์ scroll. Dockerยืนยันหลังแก้แล้ว. รอบสุดท้ายผ่าน26/27; กรณีที่เหลือเป็นตัวทดสอบ Camel อ่านการเปลี่ยนตาจากข้อความ “รอบย่อย” ซึ่งหลังย้ายเทิร์นไป header ข้อความรอบย่อยไม่เปลี่ยนทุกตา จึงแก้ให้อ่าน authoritative revision แล้วรันซ้ำผ่าน1/1 (29 roll actions และ reconnect). รวมครบ27สถานการณ์ผ่านหลังแก้ ไม่อ้างว่า full invocation เดียวผ่าน27/27.
- Browser screenshots เก็บที่ `test-results/jaipur-*.png` และสำเนาที่ `data/qa-jaipur-ui/` (ignored). ตรวจ popup มือถือจริงจาก screenshot แล้ว ตารางคะแนน/ปุ่มตกลงอ่านได้ใน390×844px. มี viewport320/390, iPad1024×768 และdesktop1440×1000; เป็น Chromium emulation ไม่ใช่อุปกรณ์จริง.

### ข้อจำกัด

ยังไม่ได้ตรวจบน iPad/Safari หรือ LG TV เครื่องจริง และไม่ได้ทดสอบ Google provider flow ใหม่ในรอบงานนี้ (ใช้ authenticated test identities เท่านั้น). Postgres2กรณีถูกข้ามตามข้างต้น. ไม่ deploy/push Vercel และไม่เพิ่มบริการ/ค่าใช้จ่าย. ข้อวินิจฉัยกติกา Jaipur กรณีเสมอทั้งหมดคงตามที่ผู้ใช้อนุมัติ ไม่เพิ่มกติกาใหม่.


### ผลตรวจรับสุดท้าย

- `PLAYWRIGHT_PORT=3001 npx playwright test`: **26ผ่าน/27**, ข้อที่เหลือเป็น selector/wait ของ Camel ตามรายละเอียดข้างต้น. แก้ test ให้ตรวจ revision ไม่ใช่ข้อความที่ถูกย้ายออก แล้วรัน `PLAYWRIGHT_PORT=3001 npx playwright test tests/browser/game.spec.ts --grep 'จอกลาง' --output=data/qa-camel-regression`: **ผ่าน1/1**, 29 roll actions, ผู้เล่นสามคนและ reconnect. ทั้ง27สถานการณ์เดิมจึงผ่านหลังแก้ครบ โดยไม่จำเป็นต้องรันเกมอื่นซ้ำอีกรอบ.
- Jaipur ใน regression ล่าสุด **145 accepted actions/3รอบ** ผ่านครบ รวมตรวจ console error/request failure และ art responses, ลำดับนับจริงจนจบ `0:goods → 1:goods → 0:bonus → 1:bonus → 0:camel → 1:camel → final`, duplicate ไม่เปลี่ยน dialog node, socket reconnect และ reload กลางนับไปยอดสุดท้าย, ปิดเฉพาะclient/เปิดดูใหม่, พร้อม reset match UUID/history/seals.
- Docker Jaipur **129 actions/3รอบ** ผ่านแยกจาก server3001. ตรวจ capture เพิ่มจากแอป Docker จริงที่320/390px, desktop1440×1000 และiPad1024×768 โดยรอ toast หายก่อนถ่าย; QR/linkชี้ `https://bn-games.basnana.com/play/<code>` ตาม canonical origin. ปิดเฉพาะห้อง fixture ที่สร้างหลัง capture ไม่แตะห้องผู้ใช้.
- Screenshot ที่เปิดดูจริง: `data/qa-jaipur-ui/jaipur-clean-320.png`, `jaipur-clean-390.png`, `jaipur-clean-ipad.png`, `jaipur-phone-result.png`, `jaipur-result-popup.png`. แถบบน/ไพ่/โทเคนอ่านได้ ไม่มี horizontal overflow, ของหมดไม่มีภาพเหรียญเก่า และ profile/เสียงไม่ทับกัน. Browser screenshots เป็นหลักฐานภาพ emulation ไม่อ้างว่าได้จับอุปกรณ์จริง.
- เก็บ logs การรันจริงที่ `data/qa-jaipur-ui/`: unit, full browser, Camel rerun, Docker Jaipur และ clean capture. `git diff --check` ผ่าน. Dockerสุดท้าย running/healthy บน5555; health URLทั้งlocal/canonicalผ่าน. ไม่มีการ push หรือ deploy Vercel.

## 2026-10-15 — Jaipur เปิดจำนวนอูฐและย่อพื้นที่เล่น (คำขอถัดจากงาน UX)

**สถานะ: เสร็จและ rebuild Docker แล้ว**. ใช้ skills frontend-design, board-game-engine, realtime-rooms, multiplayer-testing และตรวจ UI ตาม web-design-guidelines ที่ fetch ใหม่. ไม่สร้าง assets/dependency/service ใหม่.

- Server projector ส่ง `PublicTrader.herdCount` ของทั้งสองคนให้ display/มือถือเสมอ; lobbyเป็น0. นี่เป็น **รูปแบบข้อมูลเปิดที่ผู้ใช้ขอโดยชัดแจ้ง** ต่างจากสิทธิ์รู้จำนวนฝูงคู่แข่งในคู่มือ ไม่อ้างเป็นกติกาทางการ. ยังไม่เปิด hand/herd card IDs ของคู่แข่ง โบนัสส่วนตัว/เงินระหว่างรอบ หรือกองจั่วล่วงหน้า. State, shuffle, exchange validation, scoring, persistence และ rematch policy เดิม ไม่ต้อง migrate/reset ห้อง.
- อูฐซ้อนตามจำนวนจริง สูง36×44px สูงสุด10ภาพ; ถ้ามี11ใบ แสดง `+1` บนใบสุดท้าย. มีเลขรวมทั้งสองฝั่งและช่องว่าง `0 ใบ`. เอาคำว่า “ไม่ใช่ปุ่มหยิบ” ออก. จอกลางก็ใช้จำนวนเดียวกันจาก server.
- เลือกสินค้า2+ใบเปลี่ยนเป็นแลกพร้อม default คืนอูฐ `min(จำนวนที่มี, จำนวนรับ-ไพ่คืนที่เลือก)` เฉพาะ preview. ลด/เพิ่มด้วยปุ่มเดิมและเลือกไพ่คืนแทนได้; ยังต้องผ่าน offers/hand limit/validation ของ server และกดยืนยัน. กลับเป็นหยิบ1ใบล้างรายการคืนเหมือนเดิม.
- ปุ่มยกเลิกเหลือ “ยกเลิก”. มือถือเอากองจั่วออกจาก layout ให้การ์ดตลาด5ใบใช้เต็มแถว. เอาข้อความใต้หน้าการ์ดออกทั้งตลาด/มือ/preview; ขั้นต่ำขายยังอยู่ที่ bank และเหตุผล validation.
- Display แสดง goods6ชนิดในผัง3คอลัมน์2แถว แต่ละช่องแสดงทุกโทเคนที่เหลือพร้อมค่าตามserver ซ้อนในบรรทัดเดียวไม่wrap. มือถือคงbankหกชนิดแถวเดียว. กองหมดไม่มีเหรียญ/ค่าเก่าตามเดิม.
- เฉพาะ Jaipur เอาข้อความเทิร์นใน shared header ออก ใช้กรอบเต็มรอบที่นั่งปัจจุบัน พร้อมaccessible turn announcementเดิม. เกมอื่นคง headerเดิม. Seal/countย้ายขวาล่างในแถวเดียวกับกองไพ่/โทเคนที่ได้รับ. ปรับเลขไพ่ไม่ให้ภาพซ้อนบัง. หยิบ/แลก/ขายเป็นปุ่ม44pxขนาดกระชับด้านขวาของหัวข้อการกระทำ.

ไฟล์หลัก: `src/client/jaipur.ts`, `jaipur.css`, `game-header.ts`, `game-header.css`; `src/games/jaipur/types.ts`, `engine.ts`; lobby projectionใน`src/server/rooms.ts`. อัปเดต unit/rooms/browser privacy assertions ให้จำนวนอูฐเป็นpublic โดยยังห้ามarray/valuesส่วนตัว. README, rules และ designบันทึกข้อแตกต่างและหน้าจอปัจจุบัน.

ผลที่ทดสอบจริงหลังแก้:

- `npm run build` ผ่าน; `npm test` **113รายการ:111ผ่าน,0ล้มเหลว,2ข้าม** (optional Postgres ไม่ได้ตั้งบริการ).
- `PLAYWRIGHT_PORT=3001 npx playwright test tests/browser/jaipur.spec.ts tests/browser/sound-tv.spec.ts`: **3/3ผ่าน**. Jaipurเล่นครบ **147 accepted actions/3รอบ**, reconnect/duplicate/gap/privacy/settlement/rematchเดิม. เพิ่มfixtureอูฐครบ11ใบแบบรักษา55การ์ดและผ่านstate validator: แสดง10ภาพ+1ทุกจอ, bankทุกค่าตรงserver/3×2/แต่ละกองบรรทัดเดียว, มือถือ320/390ไม่มีoverflow/ไม่มีกองจั่ว, autoคืน2อูฐ→ลดเหลือ1แล้วปิดยืนยัน→เพิ่มกลับแล้วแลกจริง เหลือ9และreloadยัง9. Shared sound/TV fallback regression (Camel/Dracula/Azul) ผ่าน.
- `npm run docker:rebuild` ผ่านและ container healthy โดยเก็บ volume/บัญชี/ห้องเดิม. `GAMEVERSE_E2E_DOCKER=1 npx playwright test --config playwright.docker.config.ts --output=data/qa-jaipur-v2-docker tests/browser/jaipur.spec.ts`: **2/2ผ่าน**. กรณีแรกเล่นบนDocker5555จริง **94 accepted actions/2รอบ** จบและเริ่มใหม่; กรณีที่สองเป็น internal isolated fixtureสำหรับ11อูฐตามข้างต้น ไม่ใช่endpointทดสอบในแอป.
- ถ่ายและเปิดดู screenshotจริงหลังแก้เลขจำนวนไพ่: `data/qa-jaipur-v2/jaipur-clean-320.png`, `jaipur-clean-390.png`, `jaipur-clean-ipad.png`, `jaipur-v2-display.png`, `jaipur-v2-390.png`. Clean captureมาจากDocker5555จริง ใช้desktop1440×1000/iPad1024×768/phone320และ390×844 และเช็กลิงก์ชวนเป็นcanonical `https://bn-games.basnana.com/play/<code>`. ปิดเฉพาะห้องfixtureที่สร้างเอง. logsอยู่โฟลเดอร์เดียวกัน (ignored).
- `git diff --check` และ local `/health` ผ่าน. ไม่มีการpush/deploy Vercel.

ข้อจำกัด: ตรวจหน้าจอด้วยChromium emulation ไม่ใช่iPad/LG TVเครื่องจริง; ไม่ได้ทดสอบGoogle providerใหม่เพราะไม่ได้แก้auth. กรณีPostgres2รายการไม่ได้รัน. การเปิดจำนวนอูฐใช้ทั้งห้องเดิมและห้องใหม่ ไม่มีตัวเลือกปิดแยกรายห้องตามคำขอให้เปิดเสมอ.

## 2026-10-15 — Jaipur จัดข้อมูลข้างโต๊ะและแยกผู้ชนะชื่อซ้ำ (ล่าสุด)

ปรับต่อจากคำขอ open-herd โดยคง engine/projection/กติกาเดิมทั้งหมด:

- แสดงภาพอูฐครบตามจำนวนจริง รวม11ใบ ไม่จำกัด10และไม่มี+1. ขนาดการ์ด36×44pxและการซ้อนเดิม.
- ยกเลิก profile/คะแนนสองกล่องเหนือbank. แถบคู่แข่งอยู่เหนือสนาม profile/statsทางซ้ายและอูฐทางขวา; แถบของคุณอยู่ใต้สนาม อูฐทางซ้ายและprofile/statsทางขวา พร้อมavatar38pxใหญ่กว่าคู่แข่ง30pxและกรอบตาปัจจุบันรอบทั้งแถบ. Displayไม่มี“เรา” ใช้ที่นั่ง1เหนือและที่นั่ง2ใต้. Motionยังหาแหล่ง/ปลายทางกองไพ่ด้วยplayer IDได้.
- มุมสนามทุกมุมโค้งเท่ากัน10pxบนจอใหญ่/8pxบนมือถือ แทนส่วนโค้งใหญ่ด้านบน.
- Tokenมือถือ: จำนวนเหลืออยู่บรรทัดแรก ตามด้วยเหรียญ/ชื่อสินค้า และขั้นต่ำขายอยู่ล่างสุด10pxเล็กที่สุด พร้อมแถบสีแบ่งชนิดหนา8px. Displayคงbank3×2และโทเคนทุกชิ้นในบรรทัดเดียว.
- หน้าผลมีกรอบทอง/มงกุฎSVGที่ผู้ชนะ ทั้งportraitในpopupและแถวตารางหลังปิด. กำหนดจากserver player ID ไม่ใช้ชื่อ พร้อมป้ายเลขที่นั่งคงที่และ“คุณ”เพื่อแยกกรณีชื่อซ้ำ. เปิดกรอบportrait/มงกุฎหลังนับจบหรือเมื่อรับfinal snapshot; ไม่เปลี่ยนคะแนน/ตราชนะ/ผลเกม. รอบเสมอไม่มีมงกุฎ.

ไฟล์: `src/client/jaipur.ts`, `jaipur.css`, `jaipur-results.ts`, ใหม่ `jaipur-identity.ts`; อัปเดตREADME/design และ `tests/browser/jaipur.spec.ts`. ใช้frontend-design, realtime-rooms, multiplayer-testingและตรวจตามweb-design-guidelinesที่fetchใหม่. Assetsเดิม+SVGมงกุฎ ไม่มีdependency/serviceใหม่. ไม่แตะaccount/authหรือstore/engine.

ผลตรวจเบื้องต้น: `npm run build` ผ่าน; `npx tsx --test tests/jaipur.test.ts tests/turn-status.test.ts` **14/14ผ่าน**. Browserบนserver3001 **2/2ผ่าน**, เกมจริง94accepted actions/2รอบพร้อมreconnect/rematch และfixture11อูฐ/จัดแถบ/token. Fixtureชื่อ“Bas”เหมือนกันทั้งคู่ใช้engineเล่นถึงfinishedก่อนbroadcastsnapshot แล้วตรวจมงกุฎเฉพาะwinner ID บนจอกลางและมือถือทั้งสอง ตลอดจนตารางหลังปิดpopup; ไม่ใช่mock scoreหรือpublic debug endpoint. เพิ่มassertขนาดavatarownใหญ่กว่าคู่แข่งหลังแก้selectorให้ตรงsharedclassจริง. Dockerrebuildสุดท้ายhealthyโดยเก็บvolumeเดิม; ผลบนDockerสุดท้ายและภาพcleanจะบันทึกต่อด้านล่าง.

ผลตรวจรับสุดท้าย:

- `GAMEVERSE_E2E_DOCKER=1 npx playwright test --config playwright.docker.config.ts --output=data/qa-jaipur-v3-docker tests/browser/jaipur.spec.ts`: **2/2ผ่าน** หลังแก้ขนาดavatar. กรณีแรกจอกลาง+มือถือสองคนบนDocker5555เล่นจริง **92 accepted actions/2รอบ** รวมreconnect, retry, duplicate/gap, settlementและrematch. กรณีที่สองเป็นinternal isolated fixtureสำหรับ11อูฐ/การจัดตำแหน่ง/ขนาดรูป/ชื่อซ้ำตามข้างต้น ไม่เพิ่มendpointทดสอบในแอป.
- ยืนยันอูฐ11ภาพจริงไม่มีoverflowbadge, มุมทั้งสี่เท่ากัน, tokenremainingอยู่เหนือcoin/minimumอยู่ล่างและเล็กกว่า/countbar8px, profileฝ่ายตรงข้ามซ้าย-อูฐขวา/ฝั่งเรากลับด้านและavatarใหญ่กว่า. Popupชื่อBasทั้งสองฝั่งยังให้กรอบ/มงกุฎแก่winner IDเดียวกันทุกclient และตารางหลักคงกรอบกับมงกุฎหลังdismiss.
- เก็บและเปิดดูภาพจริงที่ `data/qa-jaipur-v3/jaipur-clean-390.png`, `jaipur-clean-320.png`, `jaipur-v3-winner-own.png`, `jaipur-v3-winner-display.png` และภาพiPad/desktopในโฟลเดอร์เดียวกัน (ignored); logsunit/browser/Dockerอยู่ข้างกัน. Clean captureมาจากDockerจริง โดยเช็กลิงก์joincanonicalและปิดเฉพาะห้องfixture. เคยชนSQLite lockในfixtureเขียนบัญชีทดสอบเมื่อรันcaptureพร้อมE2E จึงรอE2Eจบแล้วcaptureแบบserialสำเร็จ ไม่แก้storageหรือDBผู้ใช้.
- Dockerสุดท้ายhealthy; local `/health` ผ่าน. `git diff --check` ผ่าน. ไม่มีpush/deployVercel. คงข้อมูลห้อง/auth/volumeเดิม.

ข้อจำกัด: เป็นChromiumพร้อมviewportจำลอง320/390,1024×768และ1440×1000 ไม่ได้จับiPad/LG TVจริง และไม่ได้ทดสอบGoogle providerใหม่ (ไม่ได้แก้auth). ไม่มีการอ้างว่ารันunitทั้ง113ใหม่ในงานUIครั้งนี้; ทดสอบกติกาที่เกี่ยวข้อง14รายการรวม256seededmatchesและbrowserครบเกมตามข้างต้น.

## 2026-10-15 — Jaipur dim ระหว่างรอและจัดโปรไฟล์ให้อ่านชัด (ล่าสุด)

**ส่งมอบ:** `src/client/jaipur.ts`, `jaipur.css` และ regressionใน`tests/browser/jaipur.spec.ts`; อัปเดตREADME/design. ใช้frontend-design, web-design-guidelines(fetchใหม่) และmultiplayer-testing. ไม่มีแก้engine,กติกา,projection,auth,storage,assetหรือdependency.

- มือถือในphaseเล่นที่ `server turn !== me.id` เพิ่มclass `jp-waiting`; ไพ่ทุกใบมีopacity.55และกลับเป็น1เมื่อถึงตาตนเอง. จอกลางไม่dim; ผลเกมไม่ค้างdim. คำแนะนำรอตาและกรอบผู้เล่นยังอยู่ และยังยืนยันคำสั่งได้เฉพาะสิทธิ์/ตาจากserverเหมือนเดิม. Reduced motionใช้กฎเดิมข้ามtransition.
- ออกแบบโปรไฟล์ผู้เล่นรอบโต๊ะใหม่: headerรูป/ชื่อที่ตัดคำยาว/เลขที่นั่ง/คุณ/จุดออนไลน์ ตามด้วยช่องไพ่ สินค้า โบนัส และชนะ ที่แยกกันชัดเจน. ใช้card-back iconเดียว+จำนวน แทนกองไพ่ย่อที่ซ้อนกับabsolute counter. ไม่เพิ่มข้อมูลลับ.
- ช่องข้อมูลใช้normal flowและgrid2/4คอลัมน์ตามความกว้างจริงของprofile มีfallback2คอลัมน์สำหรับbrowserไม่มีcontainer queries. แม้อูฐ11ใบเบียดพื้นที่บนจอ320px ตัวเลขยังอยู่ในช่องและไม่ทับกัน. ฝั่งตนเองยังรูปใหญ่กว่า กรอบตาปัจจุบันและตำแหน่งอูฐซ้าย/ขวาเดิม.
- แก้สาเหตุCSSซ้อนอีกจุด: selectorเดิม `.jp-own-herd b` ไปใส่พื้น/ระยะpaddingของป้ายอูฐให้เลขในprofileทุกตัวด้วย จึงจำกัดให้ตรงcamel badgeเท่านั้น. ย่อcaptionอูฐไม่ทวนชื่อที่อยู่ข้างกัน.

**ตรวจจริง:** `npm run build` ผ่าน. `PLAYWRIGHT_PORT=3001 npx playwright test tests/browser/jaipur.spec.ts` **2/2ผ่าน**, เล่นจริง138accepted actions/3รอบ รวมreconnect/privacy/retry/gap/result/rematch. เพิ่มassertไพ่waiting=.55/own=1/display=1 และสลับdimถูกต้องหลังส่งคำสั่ง/refresh; ตรวจbounding boxesของheader/stat cells/ตัวเลขที่320/390pxไม่ชนกันหรือเลยช่อง รวมfixture11อูฐและชื่อซ้ำ/มงกุฎเดิม.

`npm run docker:rebuild` ผ่านโดยรักษาvolume/ข้อมูลเดิม. `GAMEVERSE_E2E_DOCKER=1 npx playwright test --config playwright.docker.config.ts --output=data/qa-jaipur-v4-docker tests/browser/jaipur.spec.ts` **2/2ผ่าน**: เกมจริงบน5555 **127accepted actions/3รอบ**; อีกกรณีเป็นisolated internal fixtureสำหรับ11อูฐ/layout/winner IDs ไม่ใช่debugendpointในแอป. Dockerhealthyและlocalhealthผ่าน. ไม่push/deployVercel.

ภาพที่ตรวจและlogsเก็บใน `data/qa-jaipur-v4/` (ignored): ภาพตนเอง/รอตา, phone320/390, desktopและiPad รวมfixture11อูฐและผลชื่อซ้ำ. ตรวจด้วยChromium/emulated viewport ไม่ใช่โทรศัพท์/iPad/LGเครื่องจริง. ไม่ได้รันunitทั้งชุดใหม่เพราะไม่มีเปลี่ยนengine; ใช้เกมเต็มผ่านUI/WSและregressionที่เกี่ยวข้องตามข้างต้น. ไม่ได้ทดสอบGoogle providerใหม่เพราะไม่ได้แก้auth.

## Jaipur — fixed profile / herd halves (2026-10-15)

คำขอ: แยกฝูงอูฐกับโปรไฟล์เป็นพื้นที่คงที่50/50 ไม่ให้จำนวนอูฐดันความกว้างโปรไฟล์. ใช้frontend-designและmultiplayer-testing อ่านREADME/design/AGENTSก่อนแก้.

แก้ `src/client/jaipur.css`: ทั้งสองแถบเป็นgridสองคอลัมน์เท่ากัน พร้อมwidth100%และยกเลิกmax-widthของprofile. คู่แข่งprofileซ้าย/อูฐขวา ของตนเองอูฐซ้าย/profileขวาเหมือนเดิม. บนจอ320pxลดระยะซ้อนอูฐเป็น9pxเพื่อให้ครบ11ใบอยู่ในครึ่งของตนเอง; ยังคงการ์ด36×44px. ไม่แก้engine,network,identity,ข้อมูลลับ,คะแนนหรือกติกา. READMEและdesignระบุการแบ่งพื้นที่คงที่แล้ว.

ตรวจจริง: `npm run build` ผ่าน; `PLAYWRIGHT_PORT=3001 npx playwright test tests/browser/jaipur.spec.ts --grep 'compact table'` 1/1ผ่าน เพิ่มassertความกว้างprofileกับherdเท่ากันและกองอูฐไม่ล้นที่320/390px ทั้งฝูง0/11ใบ. ตรวจภาพจริงทั้งสองขนาดแล้ว. `npm run docker:rebuild` ผ่าน รักษาvolumeเดิม containerhealthy. `GAMEVERSE_E2E_DOCKER=1 npx playwright test --config playwright.docker.config.ts --output=data/qa-jaipur-v5-docker tests/browser/jaipur.spec.ts` 2/2ผ่าน: เกมจริงบนDocker5555จอกลาง+2มือถือ เล่นจบ93accepted actions/2รอบ รวมreconnect/privacy/retry/resync/result/rematch; อีกกรณีเป็นisolated internal fixtureสำหรับ11อูฐ/layout/ชื่อซ้ำ ไม่ใช่debugendpointในDocker. Healthทั้งhttp://localhost:5555และhttps://bn-games.basnana.comผ่าน.

ภาพQAเก็บใน `data/qa-jaipur-v5/` (ignored). ตรวจด้วยChromiumและviewportจำลอง ไม่ใช่อุปกรณ์จริง. ไม่รันunitทั้งชุดใหม่เนื่องจากCSS-only ไม่มีเปลี่ยนกติกา. ไม่pushหรือdeployVercel.

## Jaipur — one compact resource panel / single row (2026-10-15)

รวมข้อมูลไพ่ สินค้า โบนัส และจำนวนรอบที่ชนะใต้ชื่อเป็นกล่องเดียว แสดงทั้งสี่ค่าในแถวเดียวทุกขนาดจอ แทนกล่อง2×2เดิม. ใช้เส้นแบ่งบางภายใน ไม่มีกรอบแยกแต่ละค่า. กล่องสูง42px คงพื้นที่โปรไฟล์/อูฐ50/50 ชื่อ/รูป/สถานะและกรอบตาปัจจุบันเดิม. ไม่เปลี่ยนกติกา engine projection หรือnetwork.

ไฟล์: `src/client/jaipur.css`, `tests/browser/jaipur.spec.ts`, README และ `docs/games/jaipur/design.md`. อ่านAGENTS/README/design ใช้frontend-designและmultiplayer-testingจากsessionนี้. Browserfixtureเพิ่มassertว่าทุกช่องอยู่แถวเดียว กล่องสูงไม่เกิน44px รวมตรวจตัวเลขไม่ล้น/ไม่ทับที่320/390px พร้อม11อูฐและกรณี0ใบ.

ตรวจจริง: `npm run build` ผ่าน. `PLAYWRIGHT_PORT=3001 npx playwright test tests/browser/jaipur.spec.ts --grep 'compact table'` 1/1ผ่าน ครอบคลุมlayout/11อูฐ/แลกอูฐเริ่มต้นและแก้จำนวน/reload/winner ID. `npm run docker:rebuild` ผ่านโดยรักษาvolumeเดิม containerhealthy; health5555และbn-games.basnana.comผ่าน. เปิดDockerจริงด้วยจอกลางและ2browserผู้เล่น สร้างห้อง/เข้าร่วม/เริ่มเกม ตรวจภาพ320/390,desktop1440และiPad1024 พร้อมcanonical QRผ่านด้วย `GAMEVERSE_E2E_DOCKER=1 npx tsx data/qa-jaipur-v6-capture.ts`. ภาพและสคริปต์ignoredอยู่ `data/qa-jaipur-v6/`. ตรวจภาพ320/390จริงแล้ว.

ข้อจำกัด: ตรวจด้วยChromium/viewportจำลอง ไม่ใช่อุปกรณ์จริง. รอบนี้เป็นCSS-only จึงไม่รันunitหรือเกมเต็มซ้ำ (เกมเต็มบนDockerล่าสุดผ่านในรอบfixed-halvesก่อนหน้านี้ ไม่อ้างเป็นผลของรอบนี้). ไม่push/deployVercel.

## Dracula — colored suit assets and five-card stands (2026-10-15)

อ่านAGENTS/README/architecture/Dracula UI และใช้frontend-design, web-design-guidelines (fetch source ใหม่), realtime-rooms และmultiplayer-testing. คงengine/กติกา/private projection/storageเดิม.

- สร้างSVG4ไฟล์จริงใน `public/art/dracula/suits/` พร้อมสีแน่นอนและรูปทรงเพชร/อาทิตย์/ดอกจิก/ดาว. ใช้ในหัวไพ่ ลำดับสี กองทิ้ง ไพ่เปิดที่จั่ว และปุ่มเปลี่ยนทรัมป์; preloadพร้อมartเดิม. เป็นvectorที่เขียนด้วยโค้ด ไม่ใช่ภาพrasterจากimage-generation.
- มือถือแสดงคู่แข่ง5ใบเหนือเขต1–5 และของตน5ใบใต้เขต สลับตามบทบาทจริง. ไพ่ปิดยังรับเป็นnullจากserver ไม่เผยเพิ่ม. คงdata-district/data-sideเพื่อให้reveal/swap/resyncเดิมทำงาน.
- เพิ่มแท่นวางต่อเนื่องสีเข้มทั้งสองแถวตามภาพอ้างอิง พร้อมขอบ/หน้าราง/เงา เป็นCSS ไม่มีpointer eventsหรือการคำนวณเกม.
- เมื่อถึงขั้นทิ้ง แตะไพ่บนแท่นของตนเพื่อเลือกแทนที่ แล้วใช้ปุ่มยืนยันstickyเดิม. ตัดรายการไพ่5ใบซ้ำด้านล่างออก เหลือเฉพาะตัวเลือกทิ้งใบที่เพิ่งจั่ว. Nativebuttonsมีselected/focus/disabledและใช้legal actionsเดิม; ยังไม่ส่งคำสั่งจนยืนยัน.
- ไพ่จาง55%เฉพาะมือถือที่กำลังรออีกฝ่ายในphaseเล่น; จอกลาง/ผลรอบชัดตามเดิม รองรับreducedmotion. ACKจั่วสำเร็จเฉพาะDraculaไม่แสดงtoast; errorและactionอื่นยังแสดง.

ไฟล์หลัก `src/client/dracula.ts`, `dracula.css`, `dracula-assets.ts`, `main.ts`, SVGใหม่, browser tests และREADME/Dracula UI docs. ตรวจภาพ320/390ทั้งสองบทบาทที่ `data/qa-dracula-racks/` (ignored).

ตรวจแล้ว: `npm run build` ผ่าน. `npx tsx --test tests/dracula.test.ts tests/dracula-rooms.test.ts tests/dracula-motion.test.ts` **12/12ผ่าน**. Browserก่อนเพิ่มแท่น **3/3ผ่าน** (controller/motion/เกมเต็ม113actions4รอบ). หลังเพิ่มแท่นและเลือกบนแท่น: controller+motion **2/2ผ่าน**; เพิ่มกรณีเลือกจากแท่นแล้วกดยืนยันให้serverแทนที่ไพ่จริง จากนั้นรันcontrollerซ้ำ **1/1ผ่าน**. ตรวจ5ไพ่ต่อแถว/ตำแหน่งคู่แข่งบนตนล่างทั้ง2บทบาทที่320/390px, railsสองแถว, waitingopacity, ไม่มีtoastจั่ว, ปุ่มทรัมป์ใช้SVG, stickyconfirm, reset/reconnect และreveal duplicate/gap/reducedmotion.

`npm run docker:rebuild` ผ่านโดยรักษาvolumeเดิม. Dockerเกมเต็มรอบแท่นก่อนตัดรายการไพ่ซ้ำ **1/1ผ่าน164actions5รอบ** รวมlostACK/recreatecontainer/reconnectและrematch. หลังเปลี่ยนให้เลือกจากแท่นโดยตรง รัน `GAMEVERSE_E2E_DOCKER=1 npx playwright test --config playwright.docker.config.ts --output=data/qa-dracula-racks-docker-final tests/browser/dracula.spec.ts` **1/1ผ่าน101actions4รอบ** จอกลาง+2มือถือ เล่นครบเกม ตรวจprivatepayload/stateตรงกัน, lostACK, recreatecontainer, reconnectไพ่/ผู้เล่นเดิมและrematch. Health5555และbn-games.basnana.comผ่านหลังrebuild. รูปเกมจริงล่าสุดและภาพเลือกจากแท่นอยู่ `data/qa-dracula-racks/`.

ข้อจำกัด: browserตรวจด้วยChromium/viewportจำลอง ยังไม่ได้ทดสอบiPhone/Safari/LGเครื่องจริง. SVGกำหนดสีเองแก้สาเหตุการใช้glyphของระบบ แต่ไม่อ้างว่าได้ตรวจiPhoneจริง. ไม่มีservice/dependencyใหม่ ไม่push/deployVercel.

## Dracula — irregular city / central draw / trump border (2026-10-15 follow-up)

ตามภาพอ้างอิงล่าสุด เอาแถบรางที่บังไพ่ทั้งสองฝั่งออก และเปิดข้อความความสามารถแบบย่อบนไพ่ในแถวทั้ง5ใบ. การเลือกไพ่ยังมีข้อความความสามารถเต็มในpreview/accessible label. คงไพ่คู่แข่งบน/ตนเองล่างและเขต1–5เดิม.

เพิ่ม `public/art/dracula/districts.svg` เป็นvectorที่เขียนด้วยโค้ด: ถนนโค้งเว้าแบ่ง5เขตขนาดไม่เท่ากันรอบช่องกลาง ใช้เหนือcityartเดิม ไม่ใช้ภาพreferenceเป็นพื้นหลัง. ป้ายเขต/คนทั้ง4ในแต่ละเขต/จำนวนแวมไพร์ยังเป็นDOMจากserver วางเป็นกลุ่มกระจายตามพิกัดpresentation. กรอบเมืองทั้งpublic/playerเปลี่ยนสีจากranking[0]ที่serverส่งเท่านั้น.

ปุ่มจั่วอยู่บนกองกลางกระดาน. ไพ่ที่จั่วแสดงบนตำแหน่งเดียวกัน: ใช้me.drawnเฉพาะเจ้าของ หรือpublicdraw/deckTopที่ได้รับอนุญาตเท่านั้น. ไพ่ทั่วไปไม่ปรากฏต่ออีกฝ่ายหรือจอกลาง; ไพ่ที่เปิดด้วยeffect2ยังเปิดตามเดิม. แตะใบกลางเพื่อเลือกทิ้ง หรือเลือกไพ่ตนเองแทนที่ แล้วยืนยันด้วยstickyเดิม ไม่มีไพ่ที่จั่วซ้ำในpanelล่าง. แผงเลือกการกระทำย้ายมาก่อนข้อมูลกองจั่ว/กองทิ้ง. ล้างcontrolDOMเก่าก่อนย้ายcontrolใหม่เข้าmotiontableเพื่อไม่ให้ACK/presence/reconnectมีID/ปุ่มซ้ำ; retainedbuttonsรีเฟรชdisabled/handlersตามpending/legalเดิม. ไม่เปลี่ยนengine/rules/network/projection/storage.

ไฟล์: `src/client/dracula.ts`, `dracula.css`, `dracula-assets.ts`, SVGใหม่, `tests/browser/dracula-controller.spec.ts`, README และDracula UI docs. อ่านAGENTS/README/docs ใช้frontend-design/realtime-rooms/multiplayer-testing และfetchweb-design-guidelinesใหม่. เพิ่มCSSเฉพาะpublicเพื่อแก้ขนาดหมาก/ระยะที่ถูกกฎTVเดิมoverrideจนซ้อนกัน.

ตรวจจริง:

- `npm run build` ผ่าน รวมTypeScriptและproductionassets.
- `npx tsx --test tests/dracula.test.ts tests/dracula-rooms.test.ts tests/dracula-motion.test.ts` **12/12ผ่าน**.
- Browsercontroller+motion หลังงานเมืองและหลังแก้publicspacing **2/2ผ่าน**. ตรวจ320/390ทั้งสองบทบาทว่าไพ่5ใบต่อแถว เขตอยู่ต่างระดับ คน4ตัวต่อเขต ป้าย/คนไม่ชนกองกลาง ไพ่privateไม่ขึ้นที่อีกฝ่าย ความสามารถไม่ถูกซ่อน กรอบตรงกับทรัมป์/เปลี่ยนสีได้ และcontrolsอยู่ก่อนpiles. ตรวจpublic1366×1024,1024×768,768×1024ว่าหมากไม่ทับกัน พร้อมภาพจริง. ครอบคลุมเลือกไพ่กลาง/แทนที่บนบอร์ด ยืนยันกับserver, sticky, rematch, effect2 public/reveal, duplicate/gap/reconnect/reducedmotion.
- `GAMEVERSE_E2E_DOCKER=1 npx playwright test --config playwright.docker.config.ts --output=data/qa-dracula-city-docker tests/browser/dracula.spec.ts` **1/1ผ่าน205actions5รอบ** จอกลาง+2มือถือ เกมจบผลตรงกัน รวมlostACK/recreatecontainer/reconnect/privatepayload/rematch. หลังเกมเต็ม ปรับเฉพาะCSSpublicspacingจากภาพที่พบหมากซ้อน แล้วrebuildและตรวจtargetedbrowser2/2ข้างต้น.
- `npm run docker:rebuild` ล่าสุดผ่าน รักษาvolume/ข้อมูลเดิม. `GAMEVERSE_E2E_DOCKER=1 npx tsx data/qa-dracula-city-capture.ts` เปิดDockerล่าสุดจริงด้วยจอกลาง+2ผู้เล่น สร้าง/เข้า/เริ่มเกม กดจั่วกลางเมือง ตรวจเฉพาะเจ้าของเห็นไพ่ ไม่มีtoastสำเร็จ และreloadยังเห็นไพ่/5ช่องเดิมผ่าน พร้อมภาพdesktop/iPad/phone320/390. Health5555และbn-games.basnana.comผ่าน.

ภาพและสคริปต์QA ignoredใน `data/qa-dracula-city/`. ข้อจำกัด: Chromium/viewportจำลอง ยังไม่ทดสอบSafari/iPhone/iPad/LGเครื่องจริง หรือGoogle providerใหม่. ไม่push/deployVercel ไม่มีค่าใช้จ่าย/dependencyใหม่.

## Dracula — visible exposure state / Thai round font / header readiness (2026-10-15)

คำขอ: ดูออกว่าไพ่เราถูกเปิดกี่ใบและเขตใดแม้กำลังรอตา, แก้ฟอนต์สรุปรอบ, และย้ายพร้อมรอบถัดไปไปขวาของกล่องเปิดการ์ดรอบ.

แก้ `src/client/dracula.ts`, `dracula.css`, `dracula-motion.ts` และbrowsercontroller/motiontests; อัปเดตREADME/Dracula UI. อ่านAGENTS/README/เกี่ยวข้อง ใช้frontend-design, multiplayer-testing, realtime-rooms และfetchweb-design-guidelinesใหม่. ไม่เปลี่ยนengine/rules/projection/storage/dependency.

- Own rack wrapperแสดงกรอบทองและป้าย“เปิดแล้ว”เมื่อservercard.revealed=true ระหว่างplaying. Badgeอยู่คนละชั้นกับduel-cardที่dim จึงไม่จางและไม่บังคำอธิบายความสามารถด้านล่าง. มีจำนวนx/5ใบและเลขเขตเหนือเมือง. ใช้flagsของไพ่จริงจึงตามไพ่ที่สลับ/แทนที่/reconnect และล้างจากstateใหม่เมื่อแจก/เล่นใหม่. ไพ่ลับไม่ถูกเปิดเพิ่ม.
- พบหัวข้อผลรอบมีGeorgia font shorthandต่างจากฟอนต์ไทยหลัก จึงกำหนดNoto Sans Thaiที่bundleอยู่แล้วให้หัวข้อผล/เฉลยและข้อความผลเขต. ไม่เพิ่มหรือดาวน์โหลดฟอนต์ใหม่.
- กล่องสรุปรอบมีหัวข้อ/เหตุผลซ้ายและready/skip/statusขวา. ย้ายfreshcontrolsเข้าheaderทุกrenderรวมACK; headerไม่ถูกซ่อนขณะเฉลย และpairrevealอยู่ถัดจากheader. ปุ่มreadyยังdisabledจนจบpresentationหรือกดข้าม ตามmotionเดิม. Finished/rematchใช้controlsตำแหน่งเดิม.
- ตรวจพบdesktop reveal gridให้cityกับfinishedcontrolsใช้row4เดียวกัน ทำให้ปุ่มข้าม/เล่นใหม่ถูกกระดานทับ แก้ให้controlsกับpilesมีrowแยก. การทดสอบcontrollerเคยค้างที่คลิกskip จึงแก้layoutและรันทดสอบจนผ่าน; testยอมรับเมื่อrevealจบเองก่อนคลิกskipด้วย.

ตรวจจริง: `npm run build` ผ่าน รวมtestsTypeScript. `PLAYWRIGHT_PORT=3001 npx playwright test tests/browser/dracula-controller.spec.ts tests/browser/dracula-motion.spec.ts --timeout=45000` **2/2ผ่าน**. Fixtureเพิ่มserver-revealedไพ่เราเขต1/3ขณะturnคู่แข่ง ตรวจbadge2ใบ/counter2จาก5/เลขเขต/opacitybadge1และcard.55, reloadยังครบ, rematchเหลือ0/5ไม่มีbadge. ตรวจNoto Sans Thaiในcomputedstyleและfontfaceโหลดพร้อม, readyอยู่ขวาcopyและheaderอยู่เหนือreveal ทั้งก่อนและหลังack/เฉลย. รวมfullmove/duplicate/gap/reconnect/reducedmotionเดิม. ตรวจภาพจริงที่ `data/qa-dracula-status/` (ignored).

`npm run docker:rebuild` ล่าสุดผ่านโดยรักษาvolumeเดิม. `GAMEVERSE_E2E_DOCKER=1 npx playwright test --config playwright.docker.config.ts --output=data/qa-dracula-status-docker tests/browser/dracula.spec.ts` **1/1ผ่าน83actions4รอบ** จอกลาง+2มือถือ เล่นจบเกมพร้อมปุ่มพร้อมในheaderทุกช่วงresults รวมlostACK/recreatecontainer/reconnect/privatepayload/rematch. Containerhealthy; health5555และbn-games.basnana.comผ่าน. รอบนี้ไม่รันunitทั้งชุดใหม่เพราะไม่เปลี่ยนengine.

ข้อจำกัด: Chromium/viewportจำลอง ไม่ใช่Safari/iPhone/iPad/LGเครื่องจริง. ไม่ตรวจGoogle providerใหม่ ไม่push/deployVercel.

## Dracula — direct board targeting / stable scroll / distinct draw animation (2026-10-15)

อ่านAGENTS/README/Dracula UI และใช้frontend-design, realtime-rooms, multiplayer-testing และfetchweb-design-guidelinesใหม่. ไม่เปลี่ยนengine/rules/server projections/protocol/storage/assets/dependency.

- แก้ต้นเหตุการเลื่อน/กระตุก: `main.ts` เก็บshell/header/contentของDraculaระหว่างเล่น; `dracula.ts` ใช้patchHTMLและpreservedboard; `dracula-motion.ts` patchchildrenแทนinnerHTMLล้างทั้งtable. Keyedcardbuttonwrappersอยู่ต่อเนื่องทั้งก่อนและหลังเปิดการเลือกเป้าหมาย จึงไม่สร้างภาพใหม่ทั้งกระดาน. รอACKไม่เพิ่มnoticeแถวชั่วคราวเหนือboard. ปิดscrollanchoringเฉพาะthemeนี้ และไม่มีscrollTo/scrollIntoViewในcodegameplay. focusเดิมใช้preventScroll.
- ยกเลิกกล่องเลือกการกระทำระหว่างเล่น. เปิดไพ่เลือกบนไพ่เรา/คู่แข่งตามlegalactionsที่serverเสนอ; สลับของเราเลือกสองใบ; แลกข้ามฝั่งเลือกเขตใดก็ได้แล้วไพ่คู่ยกพร้อมกัน. Selectedbuttonยก10px พร้อมกรอบและaria-pressed. Floatingconfirmแสดงpreviewและdisabledจนเลือกครบตามserveroffer; ไม่ส่งcommandก่อนยืนยัน. เปลี่ยนทรัมป์เลือกวงกลมที่rankingบนboard. ปุ่มขอจบรอบอยู่ใต้เมืองพร้อมเหตุผลถ้ากดยังไม่ได้. Resultsheader/readyและfinished/rematchคงflowเดิม.
- Drawanimation520msตรวจจากcontiguous authoritative step draw→discard และdeckCountลด1 ไม่เทียบเพียงหน้าการ์ด จึงยังเห็นแอนิเมชันแม้การ์ด2เปิดใบบนสุดไว้แล้ว. มีข้อความจั่วแล้ว/ยังไม่ได้จั่วและheld/deckstateจากviewปัจจุบัน. Duplicateไม่เพิ่มdrawanimationซ้ำ snapshot/reconnect/reducedmotionไม่เล่นย้อนหลัง gapยังresync. เปิดไพ่ใหม่ใช้transformflip และเว้นพื้นที่verdictเพื่อลดการเปลี่ยนความสูงทีละคู่.
- กระจายคนทั้ง4ด้วยพิกัดเปอร์เซ็นต์ทั่วพื้นที่แต่ละเขต แทนclusterเล็กกลางเขต ไม่เปลี่ยนจำนวน/การแปลงคน/ลำดับเขต. ไพ่ลับยังส่งเฉพาะเจ้าของ.

ไฟล์หลัก: `src/client/main.ts`, `dracula.ts`, `dracula-motion.ts`, `dracula.css`; browsercontroller/motion/fullgame tests; READMEและDracula UI docs. ใช้dom-patchเดิมโดยไม่เปลี่ยนmoduleกลาง.

ตรวจจริง: `npm run build` ผ่าน. `npx tsx --test tests/dracula.test.ts tests/dracula-rooms.test.ts tests/dracula-motion.test.ts` **12/12ผ่าน**. `PLAYWRIGHT_PORT=3001 npx playwright test tests/browser/dracula-controller.spec.ts tests/browser/dracula-motion.spec.ts --timeout=60000` **2/2ผ่าน**. เพิ่มassertcityและcardDOMเป็นnodeเดิมหลังdraw, scrollYไม่เปลี่ยนเกิน2pxหลังdraw/discard/ยืนยันeffect. Fixtureกดจริงบนboardสำหรับeffect1/3/4/6 ตรวจเลือกย้อนลำดับได้/เลือกเพียง1ของswapยังยืนยันไม่ได้/คู่แลกยกทั้งสองฝ่าย/stickyอยู่ในviewportและserverให้ผลตรงกับintentที่เลือก. Effect2-publicdrawพร้อมduplicateตรวจdrawanimationเพิ่มเพียง1และdrawrevisionตรงserverทุกจอ. รวมreveal/reconnect/gap/reducedmotion/readiness/rematchเดิม. ตรวจภาพ320/390และpublicdesktop/iPadจากtestsแล้ว.

`npm run docker:rebuild` ผ่าน รักษาvolumeเดิม. `GAMEVERSE_E2E_DOCKER=1 npx playwright test --config playwright.docker.config.ts --output=data/qa-dracula-direct-docker tests/browser/dracula.spec.ts` **1/1ผ่าน130actions4รอบ** จอกลาง+2มือถือ เล่นครบเกมด้วยboardtargetsใหม่ รวมlostACK/recreatecontainer/reconnect/privatepayload/ready/rematch. BotUIของeffect4แก้ให้เลือกไพ่สองใบจริงก่อนยืนยัน. Dockerhealthyและhealth5555/bn-games.basnana.comผ่าน.

ภาพQAอยู่ `data/qa-dracula-direct/` (ignored): เปิดเรา/คู่แข่ง, swapสองใบ, exchangeคู่, publicdrawและเกมจริงบนDocker. ข้อจำกัด: Chromium/viewportจำลอง ยังไม่ตรวจSafari/iPhone/iPad/LGเครื่องจริงหรือวัดFPSบนhardwareเหล่านั้น; ไม่อ้างว่าลื่น100%บนทุกเครื่อง. ไม่ตรวจGoogle providerใหม่ ไม่push/deployVercel.

## 2026-10-15 — Dracula: จบรอบไม่เลื่อนจอ / ไพ่ 8 ยังเห็นสี

ลบ state-message callback ที่ยังเรียก scrollIntoView หลัง discard/rematch. บนมือถือย้าย result header พร้อมปุ่มพร้อมรอบถัดไปเป็นแถบลอยล่าง และ paired reveal เป็นแผงลอย ไม่แทรกความสูงเหนือกระดาน; คงความสูงเดิมของ table ระหว่างผลรอบเพื่อไม่ให้ browser บีบ scroll position เมื่อ controls หาย. จบเกมมี controls ลอยล่างเช่นกัน จอกลางยังใช้ layout เดิม. Ready/restart ยังรอ reveal หรือ skip และใช้สิทธิ์/กติกาเดิม.

ไพ่ 8 ที่ยังทิ้งไม่ได้แสดงสี/ภาพเต็ม ไม่ลด saturation/opacity; ไพ่ในมือมีป้าย “ทิ้งไม่ได้” ส่วนใบกลางอธิบายว่ากองทิ้งยังไม่ครบ 6 ใบ. ยัง disabled และ validate ด้วย legal actions ของ server. การ dim ระหว่างรอตาคู่แข่งคงเดิม.

ตรวจ `npm run build` ผ่าน และ browser controller/motion 2/2 ผ่าน: ไพ่ 8 ทั้งกลาง/มือ, scrollY คงเดิมเมื่อจบรอบและจบเกม, ready อยู่ใน viewport, paired reveals, reconnect/gap/reduced motion และ rematch. `npm run docker:rebuild` ผ่าน ใช้ volume เดิม. ภาพ QA อยู่ data/qa-dracula-results/ (ignored). ไม่ deploy Vercel. ยังไม่ได้ทดสอบบน iPhone/LG เครื่องจริง.

Docker browser ตรวจเล่นครบเกมผ่าน 1/1: 117 actions, 4 รอบ จอกลาง+2มือถือ รวม private draws, lost ACK, recreate/reconnect, สรุปรอบ และ rematch. Health ทั้ง localhost:5555 และ https://bn-games.basnana.com ตอบ ok หลังทดสอบ.

## 2026-10-15 — Dracula: default เป้าหมายทุกความสามารถ / modal เฉลยกลางจอ

ยืนยันกับผู้ใช้ว่าเลขที่เปิดคู่แข่งคือไพ่ 3 (ไพ่ 2 ยังเปิดใบบนสุดกองจั่วตามเดิม). ทุก effect ที่ต้องเลือกเป้าหมายใช้ชุด targets แรกจาก legal actions ของ server เป็น default: เปิดเรา/คู่แข่ง, สลับสองใบ, แลกข้ามฝั่งเขตเดียวกัน, เปลี่ยนทรัมป์. Highlight และ sticky preview แสดงฝั่งทันที เปลี่ยนหรือยกเลิกได้และต้องกดยืนยันก่อนส่ง command. ไม่เปลี่ยน engine หรือกติกา.

เฉลยทั้งจอกลาง/มือถือใช้ native modal dialog กลาง viewport พร้อม blur/dim backdrop, background inert และ root overflow lock. Skip/Escape/reduced-motion/reconnect/ออกห้อง cleanup modal คืน overflow และ focus แบบ preventScroll. จบการเฉลยแล้ว dim บอร์ดและแสดง panel พร้อมรอบถัดไปตรงกลาง; จบเกมจริงใช้เล่นอีกครั้ง/รอ host ตามสิทธิ์เดิม. Screenshot modal ใช้ viewport เพราะ full-page capture เปลี่ยน viewport และการจัดวาง dialog.

ตรวจ npm run build ผ่าน; browser controller/motion 2/2 ผ่าน (26s): default effect1/3/4/6/7, เปลี่ยน default ได้, ยืนยันแล้วตรง engine, modal centered, backdrop blur, wheel ไม่เลื่อนด้านหลัง, ปิดแล้ว scrollY คงเดิม/ปลด lock, ready กลางจอ, reconnect/gap/ACK/reduced-motion/rematch. ตรวจภาพ modal/ready/default ที่ data/qa-dracula-modal/ แล้ว. Docker rebuild healthy รักษา volume เดิม; ไม่ deploy Vercel. ยังไม่ได้ทดสอบ iPhone/LG เครื่องจริง.

Docker E2E ผ่าน 1/1: 122 actions, 5 รอบ เล่นครบเกมด้วย default effect confirmations รวมจอกลาง+2มือถือ, private projection, lost ACK, recreate/reconnect และ rematch. Health localhost:5555 และ bn-games.basnana.com ตอบ ok หลังทดสอบ.

## 2026-10-15 — Dracula: ตัวละครใหญ่ / คิวจั่ว / HP กลางบอร์ด / ป้ายฝั่ง

ขยาย inhabitant markers เป็น26pxมือถือ/32pxจอใหญ่. เว้น corridor เขต3 ให้กองจั่วและเพิ่มขั้นต่ำพื้นที่เมืองเป็น300px เพื่อไม่ให้ label/คน/กองกลางทับกันที่320/390. ย้าย HP Dracula จากหัวบอร์ดมาเหนือไพ่จั่ว และใช้ node เดิมใน sequential resource reveal.

เฉพาะ player ที่ถึงตาจั่วและไม่ pending จะมีกองกลางกรอบทองพร้อม animation ไพ่ขยับซ้ำและข้อความตาคุณ; อีกฝั่งบอกว่ารอใครจั่ว. หยุด cue เมื่อจั่วแล้ว/เปลี่ยนตา และ reduced-motion ใช้กรอบ/ข้อความโดยไม่ animation. Caption จั่วการ์ดเพิ่ม Thai line-height/padding เพื่อไม่ตัดสระ. เพิ่มป้ายฝ่ายบนซ้ายเหนือไพ่คู่แข่ง/ล่างขวาใต้ไพ่เรา และกรอบทองครอบแถวไพ่ทั้ง5ของคนที่กำลังเล่น. สีทรัมป์ยังเป็นกรอบเมืองเดิม.

เอา generic toast “ทำรายการแล้ว” ออกทุกเกม โดยไม่เปลี่ยน ACK/retry/pending และยังแสดง errors กับ copy-link feedback. แก้ browser expectation ของ Camel Up ให้ตรงพฤติกรรมใหม่.

ตรวจ npm run build ผ่าน. Browser controller/motion/Camel Up4/4ผ่าน40.7s รวมคิวจั่ว/กรอบสลับฝั่ง/reduced motion/HPอยู่เหนือไพ่,320/390และจอกลางtokenไม่ทับกัน, modal/reconnect/rematch, Camel Upเต็มเกม37rollsและวง6คน. ภาพที่ data/qa-dracula-cues/ ตรวจแล้ว. Docker rebuild healthy รักษา volume เดิม. ไม่ deploy Vercel. ไม่ได้ตรวจ Safari/iPhone/LG เครื่องจริง.

Docker E2Eผ่าน1/1 (1.9min):134actions5รอบ จอกลาง+2มือถือ รวม private draws, ACKหาย, recreate/reconnect และ rematch. Health localhost5555/bn-games.basnana.com ตอบokหลังทดสอบ.

## 2026-10-15 — Dracula: ประชากรตรงเขต / ข้อมูลฝ่ายบนบอร์ด / ผลรอบยึดกองจั่ว

ย้ายประชากรเขต3ลงมาและกลับเข้า path เขต3 จริง (การขยับออกข้างครั้งก่อนทำให้เข้าเขต2/4). ตำแหน่งใหม่42/58%@82% และ39/61%@94%; ป้ายเขต3ที่90%. ปรับ token ใกล้ขอบอีก3จุด. Browserตรวจ centerและcardinalpointsของtokenกับSVGpathของเขตตนด้วยisPointInFillที่320/390px ร่วมกับdeckcollision/overlapเดิม.

ถอดข้อมูลฝ่ายซ้ำเหนือบอร์ด แล้วย้าย originalroleicon/ฝ่าย/ชื่อ/สถานะมาไว้แถวเดียวที่ขอบบนคู่แข่งและขอบล่างเรา. HPอยู่หน้าแถวDraculaตามบทบาท จึงอยู่บนเมื่อเป็นคู่แข่ง/ล่างเมื่อเป็นเรา. จัดactionheaderกลาง และrankingแสดง4สีคั่นลูกศรเท่านั้น.

เปลี่ยนเฉลยเป็นabsolute layerในcity-map ยึดกับกระดาน ไม่ใช่native dialog/fixed viewport. ใช้blurเฉพาะบอร์ดระหว่างเฉลย. หลังเฉลยปุ่มพร้อม/เล่นอีกครั้งกับข้อความรออยู่บนdeckcardกลาง ไม่บังประชากร; winnerbannerยังfixedด้านบนตามผู้ใช้ขอ. รักษาskip/Escape/reducedmotion/gap/reconnect/readinessเดิม.

ตรวจเหตุการณ์ไพ่1กับengineและคู่มือMandoo2023ทางการ Asmodee Italia (downloadPDFและextractด้วยPDFKitหน้า8–9): effectของใบที่ทิ้ง เปิดเองหนึ่งใบ; สถานะเปิดตามตัวไพ่ ไม่ใช่ช่อง; ไพ่เปิดบนกองจากeffect2ยังเปิดเมื่อจั่ว/แทนที่. เพิ่มregression private/public incoming1แทนช่องที่เคยเปิด ตรวจทั้งflag/จำนวนเปิด/projection และหลังเลือกeffectมีเปิดเพิ่มเพียง1. ไม่เปลี่ยนกติกา/engine. เพิ่มข้อความกลาง “เปิดจากกองจั่วแล้ว” ให้เห็นที่มาของสถานะเปิด.

npm run buildผ่าน. Browsercontroller/motion2/2ผ่าน25.8s รวมgeometry/HPตามฝ่าย/ป้ายเดียว/overlayยึดบอร์ด/controlอยู่ในdeck/reveal/resources/reconnect/reducedmotion/rematch. ภาพQA data/qa-dracula-board/ ตรวจแล้ว. Dockerrebuildhealthyรักษาvolumeเดิม ไม่deployVercel. ไม่ได้ตรวจiPhone/LGจริง.

ผลตรวจรุ่นสุดท้าย: unit/rules/WS/motion13/13ผ่าน (รวมcard1regression). Browsercontroller/motion2/2ผ่าน25.7s. พบpresence/nameในrowใหม่ต้องrefreshนอกmotionเมื่อrevisionเกมไม่เปลี่ยน จึงแก้ให้สถานะหลุด/ออนไลน์ไม่ค้างและไม่ตัดreveal. DockerE2E1/1ผ่าน154actions4รอบ (1.9min), จอกลาง+2มือถือ, lostACK/recreate/reconnect/privatepayload/ready/rematch. ใช้locatorสถานะในrowใหม่แทนpanelเดิม. Healthlocalhost5555และbn-games.basnana.comตอบokหลังทดสอบ.

เก็บข้อความcenter-step-statusไม่ให้แสดงคิวจั่วค้างในresults/finished หลังตรวจภาพจบเกม; เป็นการปรับcopyตามphase ไม่เปลี่ยนเกม/transport. Build/browser/Dockerตรวจซ้ำหลังเก็บรายละเอียดนี้.

หลังเก็บcopyสุดท้าย: buildผ่าน, browser2/2ผ่าน28.3s, Dockerrebuildhealthy และhealthทั้งสองURLตอบok. FullDockerเกม154actions4รอบผ่านก่อนการเก็บcopyphaseเพียงอย่างเดียว.
