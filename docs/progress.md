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
