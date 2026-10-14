# Visual upgrade — 2026-10-14

Renderer เดิม DOM/CSS, ไม่มี animation library. ใช้ต่อเป็น 2.5D + Web Animations API (transform/opacity). ไม่เพิ่ม 3D engine หรือ dependency runtime

## Tokens และ composition

Walnut #34251f, sand #e8c784, ink #183f4a, parchment #fff4d7, indigo cloth #253955, copper #b45c44. Tahoma/Leelawadee UI/system Thai; ตัวเลข tabular. จอกลางเป็นโต๊ะไม้ มีกระดาน 16 ช่องวนตามเข็มรอบพีระมิด; แถบผู้เล่นและเงินข้างกระดานบน desktop/iPad landscape และใต้กระดานเมื่อจอ portrait. มือถือเป็นแผงผู้เล่นของตนเองและการ์ดกดเลือก พร้อมกระดานย่อแบบสัดส่วนคงที่

Reference: ผู้ใช้ระบุภาพแนบ แต่ไม่มีภาพเข้าถึงได้ในข้อความเริ่มงาน ได้ขอแนบใหม่แล้ว. โครงสร้างชั่วคราวอิง 16 ช่องของฉบับที่ใช้; ต้องเทียบภาพเมื่อได้รับก่อนยืนยันว่าตรง reference

## Asset manifest

`public/art/camels.webp`: atlas 3×3 — 7 racing/crazy camel pieces, palm, pyramid (โปร่งใส)
`public/art/objects.webp`: atlas 3×2 — coins, die, cheering/booing spectator tiles, leg card, finish-card back (โปร่งใส)
`public/art/avatars.webp`: atlas 4×2 — 8 character portraits สำหรับระบุตัว ไม่เพิ่ม powers (โปร่งใส)
`public/art/table.webp`: walnut texture
`public/art/board.svg`: authored vector board/sand ornaments; ไม่มีพิกัดเกมหรือข้อความ baked into texture

Thai labels, numbers, dice values, card rewards, position badges และสี/สัญลักษณ์บนตัวหมาก render ด้วย code. โหลด atlas ทั้งหมดก่อนเปิด game; ระบุ asset failure จริงหากโหลดไม่สำเร็จ

## Authoritative motion

Engine บันทึก movement trace ขณะทำ transition เดิม (ไม่เปลี่ยน rules). Room ใส่ public event ของ accepted revision เท่านั้น: actor, action category, camel unit/path/landing/tile, money deltas และ phase change. Final bet event ไม่เปิด color หรือ private cards

Client model รับ state ทันทีแยกจาก renderer. Animation queue ใช้ revision/event, skip duplicate, snapshot/reconnect ยกเลิก motion แล้ว snap ล่าสุด. Gap/event missing ส่ง sync request ขอ authorized snapshot; ไม่มี reconstruct rules บน client. Movement ใช้พิกัดสนามชุดเดียวกับการวางจริง และ DOM transforms ไม่ render ทั้งกระดานทุก frame. Reduced motion ข้าม motion และรักษาสถานะสุดท้ายทันที

คิวภาพเร่งตาม backlog และ snap/resync เมื่อเกิน 8 events. ใช้ `Animation.finished` รอภาพ ไม่ใช้ setTimeout เพื่อเปลี่ยน game state. Native Web Animations API อ้างอิง MDN: https://developer.mozilla.org/en-US/docs/Web/API/Element/animate
