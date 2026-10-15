# Calico presentation and asset mapping

ธีมโต๊ะเย็บผ้า กระดานควิลต์1–4ผืนตามจำนวนผู้เล่น จอกลางไม่แย่งที่นั่ง. สีพื้น linen #e6e5db, ink #293d45, binding #365b6e, raspberry focus/preview #b33968, cream stitches #fff4e2. ใช้ Noto Sans Thai/Tahoma เดิมสำหรับภาษาไทย และ Georgia สำหรับชื่อเกม/รายละเอียดตัวอักษรเป้าหมาย.

สีเชิงกติกาแยกจากtokensธีม: blue #294d83, cyan #248d9b, green #6c8a4d, yellow #e3af38, magenta #b74672, purple #775c91. SVG masks6ลายคงที่จากstable IDsใน data.ts; ตัวช่วย1–6/A–Fและชื่อไทย ไม่ใช้ผล generate ตัดสินสีหรือลาย. Cat assignmentsแสดงswatchesสีเทาเพื่อสื่อว่าไม่พิจารณาสี. Goals/ตัวเลข/คะแนนrenderด้วยโค้ดทั้งหมด.

## Artwork generated 15 ต.ค.2026

ใช้ built-in imagegen สร้าง original gouache artwork ไม่คัดลอกภาพแมว/โลโก้/องค์ประกอบภาพต้นฉบับ. ภาพที่ผู้ใช้แนบเป็นreference mood/โครงกระดาน ไม่ได้ใช้เป็นพื้นหลังเกม. Sourceเก็บใน ignored assets/source/calico/; runtime assets เป็น WebP ในpublic/art/calico/ และpublic/art/covers/calico.webp. scripts/prepare-calico-art.mjs ทำcrop atlasแบบตำแหน่งคงที่/resize/convert โดยรักษาalpha ไม่พิมพ์ข้อความบนภาพ.

- cats.png atlas5×2: แถวบน Millie,Tibbit,Coconut,Cira,Gwenivere; แถวล่าง Callie,Rumi,Tecolote,Almond,Leo. แต่ละIDเป็นcutoutโปร่งใส320×320ในruntime.
- cover.png: แมวลายส้มนอนบนควิลต์; runtimecalico.webp560×760 ใช้จริงในPortal/Lobby.
- cloth.png: linen texture512×512 ใช้เป็นพื้นผ้าห่ม/โต๊ะและtextureบางบนpatch.
- buttons.png: atlas7ช่อง blue,cyan,green,yellow,magenta,purple,rainbow; runtime96×96alpha.
- cat-fallback.svg/button-fallback.svg: วาดด้วยโค้ดใหม่ ใช้เมื่อimageโหลดไม่ได้เท่านั้น ไม่ใช่placeholderในเส้นทางหลัก.

## Layout / interaction

Desktop/iPadแสดงตลาดด้านบนและปรับจำนวนคอลัมน์ตามจำนวนคน/พื้นที่ พร้อมปุ่มขยายรายกระดาน. มือถือเรียงตลาดแบบsticky → มือ/สถานะเลือก → กระดานตน → เงื่อนไขแมว → กระดานคนอื่นตามพื้นที่ ไม่บังคับลาก. ปุ่มยืนยันอยู่ในแถบตลาดเพื่อไม่ทับช่องวาง. การเลือกมือ/ช่อง/ตลาดเป็นlocal previewจนยืนยัน; revisionใหม่ล้างpreviewเก่า. Tile detailขยายดูได้. Server draftgoalsแสดงตำแหน่งบนboardของเจ้าของโดยไม่commit/เปิดdraftคนอื่น.

Motionอ่านrevision+eventsequenceจากserver: patchpop, marketselection/refill, เฉพาะtokenที่เพิ่งรับ, finalresultfade. ช่องและtokenอ้างactor+axialhex ไม่เดาพิกัดจากpixel. Duplicateไม่เล่นซ้ำ, fullsnapshot/reconnect/gapวาดล่าสุดทันทีไม่เล่นประวัติ, reduced-motionไม่เรียกanimation. ไม่มีtimerรอanimationเพื่อเปลี่ยนgame state. เสียงจบตา/muteใช้ตัวกลางเดิม; placementยังไม่จบตาจนเลือกตลาดสำเร็จ.

## 1–4 player / Solo / reward overlay update

Keep original cloth, cat and transparent button artwork; no new image generation or assets needed. The main play header is compact, room code/copy/QR/join link live in the top “ข้อมูลห้อง” disclosure, with persistent device sound exposed as a44px SVG-only button (Thai accessible name, aria-pressed, same AudioContext gesture gating and mute storage). Lobby code/QR remain unchanged.

The market precedes controller hand/selection and quilts. It is sticky for controllers; confirmation is reparented into this same dock after local selection, not overlaid on a playable quilt. At620px-tall phones it remains under210px with all three55px-ish patches and44px confirmation actions. Quilt focus scroll margins reserve space for the dock; no nested scroll. Ordered Solo slots1→3 run farthest→nearest bag. Public1 shows a larger centered quilt;3–4 use one row on desktop/iPad landscape where width permits,2×2 on narrower displays. Each board keeps its owner name/progress and explicit expand/collapse control. Phone keeps its own board first, cat rule details below.

Reward images live in an independent overlay layer. Each award anchors to server-recorded axial `at` (the tile completing the earning group), with separate slots for cat/button/rainbow. Every overlay hitbox is clipped to its already occupied hex, preventing interception of an adjacent empty placement target. Stable IDs/earning cells/sequence are authoritative records, not re-derived when resizing/merging/rendering. Click exposes rule condition and earning-group size, with legacy group metadata omitted when absent. Opacity toggle reduces images to18% for fabric reading. Existing legacy cat/button `at` records remain valid; a legacy rainbow boolean without an anchor stays in the token summary. No backfill awards or score recomputation.

UI review used freshly fetched Web Interface Guidelines. Native buttons/disclosures, Thai labels, keyboard focus restoration for hand/market/placement/expand/token dialog, safe-area spacing, image dimensions, reduced-motion and snapshot/dedup guards retained. Screenshots/actual device limitations and executed results are in docs/progress.md.
