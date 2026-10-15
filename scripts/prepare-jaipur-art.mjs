import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
const source = "assets/source/jaipur",
  out = "public/art/jaipur";
await mkdir(out, { recursive: true });
const names = [
  "diamond",
  "gold",
  "silver",
  "cloth",
  "spice",
  "leather",
  "camel",
  "card-back",
];
const { width: w, height: h } = await sharp(`${source}/cards.png`).metadata();
for (const [i, name] of names.entries())
  await sharp(`${source}/cards.png`)
    .extract({
      left: ((i % 4) * w) / 4,
      top: (Math.floor(i / 4) * h) / 2,
      width: w / 4,
      height: h / 2,
    })
    .resize(384, 512)
    .webp({ quality: 83 })
    .toFile(`${out}/${name}.webp`);
// Verified atlas cells have clear separation. Trim alpha margins inside each cell;
// never combine neighbouring objects or bake text/hidden token values into art.
const tokens = [
  "token-diamond",
  "token-gold",
  "token-silver",
  "token-cloth",
  "token-spice",
  "token-leather",
  "token-bonus-back",
  "token-bonus-front",
  "token-camel",
  "seal",
  "coins",
  "incense",
];
const meta = await sharp(`${source}/tokens.png`).metadata();
for (const [i, name] of tokens.entries()) {
  const left = Math.round(((i % 4) * meta.width) / 4),
    top = Math.round((Math.floor(i / 4) * meta.height) / 3),
    right = Math.round((((i % 4) + 1) * meta.width) / 4),
    bottom = Math.round(((Math.floor(i / 4) + 1) * meta.height) / 3);
  const tile = await sharp(`${source}/tokens.png`)
    .extract({ left, top, width: right - left, height: bottom - top })
    .toBuffer();
  await sharp(tile)
    .trim({ threshold: 20 })
    .resize(200, 200, { fit: "contain", background: "#0000" })
    .webp({ quality: 86 })
    .toFile(`${out}/${name}.webp`);
}
await sharp(`${source}/cover.png`)
  .resize(640, 960)
  .webp({ quality: 84 })
  .toFile(`${out}/cover.webp`);
await sharp(`${source}/cover.png`)
  .resize(640, 960)
  .webp({ quality: 84 })
  .toFile("public/art/covers/jaipur.webp");
await sharp(`${out}/card-back.webp`)
  .resize(480, 640)
  .modulate({ brightness: 0.65, saturation: 0.55 })
  .webp({ quality: 75 })
  .toFile(`${out}/table.webp`);
await writeFile(
  `${out}/fallback.svg`,
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 250"><rect x="3" y="3" width="174" height="244" rx="15" fill="#123c4c" stroke="#dcab52" stroke-width="6"/><path d="M20 125Q90 15 160 125Q90 235 20 125ZM38 125Q90 45 142 125Q90 205 38 125" fill="none" stroke="#e7c77a" stroke-width="4"/><path d="m90 80 12 30 32 15-32 15-12 30-12-30-32-15 32-15z" fill="#d49949"/></svg>',
);
await writeFile(
  `${source}/README.md`,
  "Original artwork generated with the built-in imagegen tool for GameVerse, 2026-10-15. References informed palette and tabletop readability; original publisher art/logos are not runtime assets. Source atlases: cards (4 × 2), transparent tokens (4 × 3), portrait cover. Rebuild crops with `node scripts/prepare-jaipur-art.mjs`. Thai labels, token values and bonus categories are rendered by code; hidden bonus values never select a public asset.",
);
