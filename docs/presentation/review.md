# UI review

Guidelines fetched 2026-10-14 from https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md. Reviewed new platform, Dracula UI, assets and motion

- `src/client/platform.ts`: native labelled form/button/link; Enter/paste supported; aria-busy/alert and draft retention; no name/code authentication; expired credentials return to common flow
- `src/client/platform.css`: neutral scoped theme, no game background leak, visible focus, 48px controls, cover aspect preserved, Thai and long-name wrapping
- `src/client/dracula.ts`: symbols plus suit names, all rule text in code; dark label contrast corrected; card selection preview/confirm; common back has no hidden metadata
- `src/client/dracula.css`: artwork aspect/cutouts preserved, mobile tap controls, tablet short-height spacing corrected, gallery/neutral styles extracted from game styles
- `src/client/dracula-motion.ts`: reduced-motion, cancelable WAAPI transform/opacity, no infinite decorative motion, duplicate/gap/snapshot policy tested; no timing dependency for game outcome

Screenshots and actual test results are recorded in docs/progress.md. Physical Safari/iPad and camera QR remain unverified
