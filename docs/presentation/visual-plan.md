# Presentation upgrade — 2026-10-14

รักษา engine/protocol/projections เดิมทั้งสองเกม. Vanilla DOM/CSS + Web Animations API เดิม ไม่มี renderer/dependency ใหม่

## Platform

Neutral platform: porcelain #f0f3f5, ink #243341, steel #60717e, river #347b86, white #ffffff. Thai system Tahoma/Leelawadee/Noto fallback. Portal gallery ปก 2:3 สองเกมจริง ไม่มี hero/promotional panels. `/join` และ `/play/code` ใช้ form/shared lobby ชุดเดียว พร้อม local session links, inline errors, submit lock, pasted-code normalization. Scope platform-theme แยกจาก camel/duel

## Dracula

ตรวจภาพ reference ที่แนบทั้งกระดาน/กล่อง/การ์ดแล้ว: angular illustrated print, teal/night ink, wine red, ochre and violet, paper grain, broad card racks, pale roads across five districts, portrait tokens. ใช้เป็น mood/material/composition reference สร้างภาพใหม่ ไม่คัดลอกภาพ โลโก้ หรือ scan ใบต้นฉบับ

Tokens night #101f2a, teal #1f6565, wine #a43c47, violet #714985, ochre #d7b657, paper #f2e3be. Code title Georgia + Thai fallback, ไม่โหลดฟอนต์ภายนอก. Map horizontal5 districts; graphic artwork background independent of slots. Public top Dracula / bottom Helsing; player controller controlsก่อนmap. All hidden cards one same back, no suit/type leak

## Asset manifest plan

Generated originals stored assets/source/presentation/, optimized outputs public/art/covers/ and public/art/dracula/. No generated text/rules used as data

| Asset | Shape / size target | Use |
|---|---|---|
| Camel cover | 2:3, 640×960 WebP | portal/entry thumbnail |
| Dracula cover | 2:3, 640×960 WebP | portal/entry thumbnail |
| Role portrait atlas | 2×1 isolated cutouts, 1536×1024 source | identity, winner |
| Card illustrations atlas | 4×2 cells, source landscape | 8 numeric types, shared across four suits |
| City map | landscape 1536×1024 | five fixed districts, code boundaries |
| Card back | 2:3 portrait | common back all hidden cards |
| Marker atlas | cutouts human/vampire/heart/ship | 4 humans/district, HP, round |

Numbers, Thai, suit icons, effects, district labels and hitboxes rendered by code. At most8 illustrations because actual engine has values1–8; no new suits/types/abilities

## Motion

Authoritative state displayed immediately. Presentation deliveries dedup by code/revision; snapshot/reconnect/reduced-motion cancel and snap. Missing revision asks sync. Latest revision cancels previous transient animations. Both racks exposed in one synchronous render, simultaneous reveal; only afterwards stagger highlight the server district outcomes. Resource/turn/card animations decorate committed diffs, never delay or mutate game state

## Acceptance

31 existing unit/protocol cases plus new motion policy and common-flow checks; Playwright fullgames both engines, private payloads, duplicate/gap/snapshot/reconnect during reveal, all screen layouts, no lost images. Screenshot inspect and correct before completion. Test ports isolated from live3000; no paid services/deployment

## GameVerse neutral platform extension

Retain porcelain #f0f3f5, ink #243341, steel border #becbd2, teal #347b86 and error #9c2739. Noto Sans Thai self-hosted 400/700 carries Thai/English controls; covers/game titles preserve illustrated identity. Home starts with compact GameVerse header and search/count controls, illustrated two-column shelf, then recent/active rooms only when there is user data. No hero or invented catalog content. Profiles/login/lobby use the same control/focus/touch tokens; game themes remain scoped. Mobile header is two rows (brand/status then navigation) to avoid wrapping the brand. Font license/source in public/fonts/OFL.txt and docs/platform-storage.md
