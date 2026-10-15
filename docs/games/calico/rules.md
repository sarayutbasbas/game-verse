# Calico ภาคหลัก (2020) — Solo และ Multiplayer 1–4 คน

แหล่งหลัก: คู่มือ AEG/Flatout Games ©2020, 16 หน้า, [PDF จากผู้จัดพิมพ์](https://www.alderac.com/wp-content/uploads/2025/02/Calico_Rulebook.pdf), ตรวจ 15 ต.ค. 2026. เกมโดย Kevin Russ. อ่านทั้งเล่มและตรวจภาพหน้า4/7/9 เพื่อถอดพิกัด กระดาน และรูปทรง. รวม Solo พื้นฐาน; ไม่รวม family/achievements/scenarios/Kickstarter cats หรือ 2-player lower-variance variant. หน้า8 variant ลด36ชิ้นไม่ได้ใช้ในโหมดมาตรฐานนี้.

## องค์ประกอบ

Patch108: 6สี × 6ลาย × 3สำเนาแต่ละคู่ (18ชิ้นต่อสี). ถุงมีจำนวนจำกัดจริง; printed border ไม่ใช่ชิ้นในถุง. กล่องมี quilt boards4, goal tiles24 (ชุด6ต่อคน), cat scoring tiles5สองด้าน=แมว10ตัว, cat tokens80, buttons52 (8ต่อสี6สี+rainbow4), black-and-white pattern tiles6, button scoring tile1, bag1, score pad1, master quilter1. เมื่อ cat tokenหมดคู่มือให้ใช้ด้านหลังที่คะแนนเท่ากันแทน; เว็บจึงนับรางวัลด้วยข้อมูล ไม่จำกัดตามจำนวน token ของแมวชื่อเดียว.

## Setup (หน้า4–5)

มาตรฐาน: แบ่ง cat scoring tiles ตาม dot1/2/3 แล้วสุ่ม tileหนึ่งต่อกลุ่มและสุ่มด้าน. กลุ่ม1คือ Millie/Callie และ Tibbit/Rumi; กลุ่ม2คือ Coconut/Tecolote และ Cira/Almond; กลุ่ม3คือ Gwenivere/Leo. สับ pattern6และแจกคู่ไม่ซ้ำให้แมว3ตัว. ผู้เล่นสับgoal6ของตน เปิด4 เลือก3และจัดลงสามตำแหน่งบนกระดานตามต้องการ. ตัวเลือกสุ่มหนึ่งครั้งที่server; draftแยกตามเจ้าของและ persist; ยังแก้ได้ก่อนยืนยัน ยืนยันแล้วแก้ไม่ได้. ทุกคนยืนยันจึงเริ่มผลัดตา.

เกมแรก (preset คู่มือ ไม่ใช่ house rule): Millie/Tibbit/Coconut และสุ่ม pattern assignmentsตามเดิม; goals AAA–BBB / ≠ / AA–BB–CC ตามตำแหน่งภาพหน้า4. ไม่ใช่ family variantที่ไม่คิดgoals.

แต่ละคนมีมือ2 เปิดตลาด3. ผู้เริ่มคือผู้ลูบแมวล่าสุด; ผู้สร้างเลือกคนนี้จากรายชื่อก่อนเริ่ม ไม่ใช้ client สุ่ม. ใช้กระดานครบ4ผืน สุ่มแจกหนึ่งผืนต่อคน; กระดาน0/1จากภาพsetupคู่มือและ2/3ตรวจจากภาพองค์ประกอบชัดเจนตามแหล่งด้านล่าง. พิกัดถอดใน data.ts และ normalizeกระดานขวาด้วยการหมุน180องศาให้ goal positionsตรงกัน. ไม่ใช้พิกัดpixelตัดสินเพื่อนบ้าน.

## กระดาน

Flat-top even-q offset 5×5 interior แปลงเป็น axial(q,r). ช่องgoalsใน offsetคือ (1,1),(3,2),(2,3); เหลือ22ช่องวาง. วงprinted border24ชิ้นรวมส่วนที่พิมพ์ไม่เต็ม เป็นข้อมูลcolor/patternแยกจาก108patch; มีผลต่อกลุ่มและgoalsเหมือนpatch แต่ห้ามวางทับ. ใช้ axial directions6ชุดเดียวใน engine/UI. สีblue/cyan/green/yellow/magenta/purple; ลายdots/stripes/flowers/vines/quatrefoil/swirlsเป็นID ไม่อิงภาพ generated.

## ตาและจบเกม (หน้า5/8)

แต่ละตา: วาง1จากมือ2ลงช่องว่างใดก็ได้ (ไม่บังคับติดชิ้นเดิม); รับแมว/ปุ่มที่เข้าเงื่อนไข แล้วเลือก1จากตลาดเติมมือ Multiplayerเติมเฉพาะตำแหน่งที่หยิบ ส่วนSoloใช้ conveyor policy ด้านล่าง. วางและเลือกตลาดเป็นสองphaseเพื่อreconnectกลางตา. ไม่มีundoหลังcommit. คู่มือไม่ระบุข้อยกเว้น step2 ในตาสุดท้าย จึงทำสองstepตามหน้า5ครบทั้ง22ตาของแต่ละคน รวม22×จำนวนผู้เล่น placements/market choices; สุดท้ายมีมือ2ต่อคน ตลาด3. Multiplayer2/3/4เหลือถุง57/33/9 ส่วนSoloเหลือ59และนำออก22ตามลำดับตลาดด้านล่าง. จบเมื่อทุกคนครบ22ช่องและจบขั้นตอนตา.

## ปุ่มและแมว (หน้า7/9)

กลุ่มสีเดียวเชื่อมกันอย่างน้อย3ชิ้นได้ปุ่ม1=3คะแนน. ขยายกลุ่มใหญ่ไม่ให้ปุ่มเพิ่ม. อีกปุ่มต้องเป็นกลุ่มแยกที่ยังไม่ติดกลุ่มเคยรับ. รวมกลุ่มไม่ลบรางวัลที่ได้รับแล้วและไม่สร้างรางวัลใหม่หากส่วนเชื่อมมีmarkerเดิม. มีปุ่มครบ6สีได้rainbow1=3คะแนน. แมวพิจารณาลายเดียวหนึ่งในสองลายที่รับ ไม่ผสมสองลายในกลุ่มเดียว; ขอบพิมพ์ช่วยได้. หนึ่งพื้นที่เชื่อมได้แมว1ตัว ไม่ได้ซ้ำจากขยาย/รูปทรงใหม่ในพื้นที่เดิม.

|แมว|เงื่อนไข|คะแนน|
|---|---|---|
|Millie|กลุ่ม3ขึ้นไป|3|
|Tibbit|กลุ่ม4ขึ้นไป|5|
|Coconut|กลุ่ม5ขึ้นไป|7|
|Cira|กลุ่ม6ขึ้นไป|9|
|Gwenivere|กลุ่ม7ขึ้นไป|11|
|Callie|สามเหลี่ยม3hexตามภาพ|3|
|Rumi|รูป4hexตามภาพ|5|
|Tecolote|เส้นตรง4|7|
|Almond|รูป5hexสองแถวตามภาพ|9|
|Leo|เส้นตรง5|11|

รูปทรงใช้set axialและตรวจ6การหมุน; คู่มือระบุหมุน ไม่ระบุสะท้อน จึงไม่เพิ่ม reflected configurations. รูปที่รองรับมีความสมมาตรที่ตรวจได้ด้วยrotationตามข้อมูล. กลุ่มใหญ่ที่มีรูปที่ต้องการอยู่ข้างในเข้าเงื่อนไข แต่พื้นที่เดิมให้เพียง1รางวัล.

## Goals และคะแนน

ตรวจ6ช่องรอบgoalด้วยสีแยกจากลาย ต้องครบทุกช่อง. กลุ่มซ้ำไม่จำเป็นต้องวางติดกัน. ทำสำเร็จอย่างใดอย่างหนึ่งได้ค่าต่ำ ทำทั้งสองได้เฉพาะค่าสูง ไม่บวกสองค่า. ยังไม่จบเกมแสดงเป็นการประเมิน แยกจากคะแนนtokenที่รับแล้ว.

|Goal|multiset counts|อย่างเดียว|ทั้งสีและลาย|
|---|---|---|---|
|≠|1,1,1,1,1,1|10|15|
|AAA–BBB|3,3|8|13|
|AA–BB–CC|2,2,2|7|11|
|AAAA–BB|4,2|8|14|
|AAA–BB–C|3,2,1|7|11|
|AA–BB–C–D|2,2,1,1|5|8|

รวมgoals+แมว+buttons/rainbow. เสมอดูจำนวนcat tokens แล้วจำนวนbutton tokens (รวมrainbow); ยังเท่ากันชนะร่วม. แสดงbreakdownพร้อมreasonสี/ลายแต่ละgoal.

## ข้อวินิจฉัยที่ผู้ใช้ยืนยัน

คู่มือใช้คำว่า hand และภาพsetupแสดงหงาย แต่ไม่มีข้อความชัดเรื่องpublic/private hand. ผู้ใช้ยืนยันวันที่15ต.ค.2026 ให้ใช้มือเปิดตามภาพsetup ทุกคนรวมจอกลางเห็นมือได้. นี่เป็นข้อวินิจฉัยสำหรับเว็บ ไม่อ้างว่าคู่มือเขียนกติกานี้ชัดเจน. ตัวเลือกgoals/draftยังเป็นข้อมูลเฉพาะเจ้าของจนยืนยัน. ถุงและลำดับสุ่มอนาคตเป็นserver-onlyเสมอ.

## Update: base Solo and 1–4 players (2026-10-15)

This section supersedes the former two-player scope above. Same AEG/Flatout ©2020 base rules, current publisher PDF linked above; re-read p5 turn order, p7 awards, p8 Solo/endgame and pp10–13 optional achievements/scenarios. No separate official errata changing the p8 conveyor found on publisher pages. User video [OtFx0ceevXE](https://www.youtube.com/watch?v=OtFx0ceevXE) could not be opened by the browsing tool; it was not watched or used as rules evidence.

Multiplayer2–4: one shared three-tile market, two tiles per hand, one distinct printed board per player, own six-goal set/choose3 of4 as before, three shared cats/pattern pairs. After placement/awards, take one market patch, refill only that slot, advance modulo actual player count. Everyone completes22 place+draft turns (44/66/88 placements), then normal score and official cat-count/button-count/shared-win tiebreakers. No Solo removal in multiplayer. Unused tiles remain in bag; final bag57/33/9 for2/3/4. Optional lower-variance36-tile removal is still excluded.

Solo1: use standard or beginner setup, two hand tiles, three ordered market slots. We show left-to-right **1 = furthest from bag,3 = nearest bag**. Place one hand patch and grant normal awards. Choose any market slot into hand. From the TWO tiles remaining, discard only the one furthest from bag; move the single survivor to slot1. Draw one tile into slot2, then one into slot3. Exactly2 drawn and1 removed per complete turn, irrespective of chosen slot. If taking1: remove old2, keep old3. Taking2: remove old1, keep old3. Taking3: remove old1, keep old2. Removed tiles are a separate server pile and never return. Market order never sorted by color/pattern. Event records chosen/removed/survivor/refill, not future bag order.

The printed turn says perform steps1+2, and Solo says follow a turn as usual; no final-turn exception is stated. Thus22nd placement is followed by the normal last pick/conveyor/refill, then final score. No additional23rd turn/draw. End:22 placed +2 hand +3 market +22 removed +59 bag =108. A reconnect during draft resumes that exact market; an accepted draft is idempotent under the existing room receipt/revision protocol.

Base Solo scores the usual design goals/cats/buttons; p8 does not define a generic rating ladder or a score that must be beaten. UI records the final score without inventing a win threshold, opponent or named rating. The optional achievement/scenario pages supply separate objectives, not a universal base Solo evaluation; those campaign/achievement systems are not added here.

Boards: preserve existing0/1 (blue and purple normalized from official setup). Add2 yellow and3 green, transcribed from legible [yellow board](https://myautoma.github.io/games/calico/img/boards/yellow.jpg) / [green board](https://myautoma.github.io/games/calico/img/boards/green.jpg), cross-checked with [four empty mats component photograph](https://boardgamesapiens.com/cdn/shop/files/CalicoGamemat.webp?v=1705897232&width=1445) and user's earlier four-board reference. These are visual component references, not replacement rules authorities, and no scans are shipped as app artwork. Images are normalized90° clockwise so goals use the same axial cells. Old board1 normalization remains180° from its printed setup orientation. No invented border colors/patterns, and no assumption that all boards have equal counts of each pattern.

New award records include stable award ID, type, earning axial cells, placement anchor and event sequence. The anchor is the placed patch that completes the group, a legal token location under p5. Group expansion/merge retains previous records and never re-awards an already rewarded connected area. Rainbow has its own optional stable anchor when all six colors are first collected. Rendering/opacity/zoom never participates in scoring.

Compatibility: new rooms use rules `base-2020-one-to-four-v2`, schema2. An explicit store whitelist accepts old `base-2020-two-player-v1`/schema1 two-person states; missing mode means legacy multiplayer, not Solo. Existing boards, goals, hands, bag order, awards and scores stay unchanged. Old cat/button records already have an authoritative `at` placement, so overlays can use that recorded anchor; missing historical group metadata is not fabricated. A legacy rainbow boolean without an anchor stays in the reward summary instead of inventing a board location. New/restarted games get current metadata. No destructive SQL migration or room reset.
