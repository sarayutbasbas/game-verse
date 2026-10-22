# Harmonies rendering performance (2026-10-20)

The reported Android stutter has not been reproduced on a physical Android device. Source inspection and Chromium measurements identify rendering work worth removing; these are not proof of one device-specific root cause.

## Findings

- Animal figures are WebP sprites on CSS 3D terrain, not polygon meshes. Reducing mesh detail would not address this renderer.
- Moving Spirit particles, multiple drop shadows, broad aura pools and many transformed terrain layers create ongoing style/compositing work. Broad board auras also made adjacent pieces look illuminated.
- Small cards previously built their habitat diagrams using nested CSS 3D terrain DOM. Images on those cards were240x347 although cards are often displayed much smaller.
- Phone views built all players' gardens, including hidden ones. DOM generation/patching still visited those hidden boards.

## Changes

The hamburger menu has a per-browser lightweight-effects checkbox. It defaults on for Android or the initial OS reduced-motion preference, and explicit on/off choice persists in localStorage. It does not change room settings or send game actions. The OS reduced-motion preference remains respected even when the checkbox is off.

Lightweight mode stops ambient CSS and programmatic movement, removes broad glow pools and extra sprite filters, and uses small flat SVG habitat diagrams with terrain icons and height labels. Phone views build only the selected garden; switching to a friend's garden still works. Public displays retain their overview. Large popup cards retain full art and detailed habitats, with static special-card borders/light.

Derived assets are built with `node scripts/build-harmonies-lite.mjs` using existing source art:52card backgrounds at120x174 (WebP quality64) plus52small figure thumbnails within64x64. The normal/full-resolution assets are retained. Card backgrounds total1,327,092bytes before and271,556bytes after: about80% less. Raster pixels per card fall from83,280 to20,880; SVG score labels remain sharp.

Normal board animals were reduced from a48px maximum width to40px. Shared animal/Whisper tiles use distinct anchors and smaller29px/24px maximum widths. Spirit light follows the sprite silhouette, its particles use the same dimensions, and the broad board glow pool is removed. Tray figures keep their existing consistent size. Special popup cards have a gold/purple light border; finished summary/replay buttons have static bright halos. Spirit choice labels use a small first line and a separate name line.

## Measurements and limits

Synthetic fixture:23three-level rock cells,4Spirits and8cards; Chromium headless,390x844, DPR2, CPU throttled4x, two-second warmed-up samples. Local ignored artifacts: `data/hm-profile-normal.json` and `data/hm-profile-lite.json`.

| Measurement | Normal | Lightweight |
| --- | ---: | ---: |
| Card DOM elements |563|418|
| Total fixture DOM elements |916|771|
| Running CSS animations |8|0|
| Style recalculation time |35.8ms|13.6ms|
| Main-thread task time during sample |113.1ms|32.1ms|
| Median animation-frame interval |16.7ms|16.7ms|
| Frames over34ms |0|0|

This fixture reduced work, but both modes already met60fps on the development machine. CPU throttling does not emulate an Android GPU, thermal limits, browser implementation or memory pressure. These measurements do not establish an Android FPS improvement or guarantee that every stutter is removed. A real-device performance trace is still needed if symptoms persist; compare normal/lightweight mode and the existing top camera on the same device and room.

The actual three-card Solo view reduced card DOM elements from248 to199. Browser tests cover Android default/opt-out/persistence, image resolution, full-resolution special-card inspection, unchanged room state, friend-garden navigation, paired pieces and glow alignment. Docker5555 uses the same build and separate existing local data/auth storage.
