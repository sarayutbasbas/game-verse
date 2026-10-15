import sharp from "sharp";
import fs from "node:fs/promises";
import {
  CARDS,
  WONDERS,
  TOKENS,
} from "../src/games/seven-wonders-duel/data.js";
const source = "assets/source/seven-wonders-duel/",
  out = "public/art/seven-wonders-duel/";
await fs.mkdir(out, { recursive: true });
async function cell(
  file: string,
  col: number,
  row: number,
  cols: number,
  rows: number,
  id: string,
  width = 360,
  height = 250,
) {
  const meta = await sharp(source + file).metadata(),
    left = Math.floor((col * meta.width!) / cols),
    top = Math.floor((row * meta.height!) / rows),
    right = Math.floor(((col + 1) * meta.width!) / cols),
    bottom = Math.floor(((row + 1) * meta.height!) / rows);
  await sharp(source + file)
    .extract({
      left: left + 2,
      top: top + 2,
      width: right - left - 4,
      height: bottom - top - 4,
    })
    .resize(width, height, { fit: "cover" })
    .webp({ quality: 84 })
    .toFile(out + id + ".webp");
}
for (let i = 0; i < WONDERS.length; i++)
  await cell(
    "wonders.png",
    i % 4,
    Math.floor(i / 4),
    4,
    3,
    WONDERS[i].id,
    640,
    440,
  );
const column = {
  brown: 0,
  grey: 1,
  blue: 2,
  green: 3,
  yellow: 4,
  red: 5,
  purple: 6,
};
const indices = {
  brown: 0,
  grey: 0,
  blue: 0,
  green: 0,
  yellow: 0,
  red: 0,
  purple: 0,
};
const manifest: Record<string, unknown> = {};
for (const c of CARDS) {
  let row = indices[c.color]++ % 4;
  if (c.color === "brown")
    row = c.produce?.wood
      ? c.id === "sawmill"
        ? 3
        : 0
      : c.produce?.stone
        ? 1
        : 2;
  if (c.color === "grey") row = c.produce?.glass ? 0 : 1;
  await cell("buildings.png", column[c.color], row, 7, 4, c.id);
  manifest[c.id] = { source: "buildings.png", column: column[c.color], row };
}
await sharp(out + "colossus.webp")
  .resize(640, 960, { fit: "cover", position: "center" })
  .webp({ quality: 88 })
  .toFile("public/art/covers/seven-wonders-duel.webp");
await sharp(out + "piraeus.webp")
  .resize(1400, 280, { fit: "cover" })
  .webp({ quality: 85 })
  .toFile(out + "military.webp");
// Alpha-component bounds inspected in the source atlas. Generated spacing is not
// exactly uniform: regular grid slicing clips the pawn and picks up other pieces.
const spriteBounds=[
 [26,20,263,263],[326,19,266,266],[639,20,268,265],[950,19,269,266],
 [19,306,265,263],[323,306,267,264],[647,308,264,261],[960,306,266,262],
 [19,604,268,269],[335,605,277,270],[675,634,240,231],[1033,582,158,304],
 [40,950,233,240],[340,919,277,290],
];
const spriteNames=[...TOKENS,'coin','pawn','loot-2','loot-5'];
for(let i=0;i<spriteNames.length;i++){
 const [left,top,width,height]=spriteBounds[i];
 await sharp(source+'tokens.png').extract({left:left-4,top:top-4,width:width+8,height:height+8}).resize(i<10?160:120,i<10?160:120,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({quality:88}).toFile(out+spriteNames[i]+'.webp');
}
for (let age = 1; age <= 3; age++) {
  const color = ["#836039", "#235c70", "#694876"][age - 1];
  await fs.writeFile(
    out + `age-${age}-back.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 180"><defs><pattern id="p" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 6 6 0 12 6 6 12Z" fill="none" stroke="#c3a55f" stroke-width=".6"/></pattern></defs><rect width="120" height="180" rx="7" fill="${color}"/><rect x="7" y="7" width="106" height="166" fill="url(#p)" stroke="#d8c185"/><path d="M25 125 60 45 95 125Z" fill="${color}" stroke="#d8c185" stroke-width="3"/><path d="M35 130H85" stroke="#d8c185" stroke-width="3"/></svg>`,
  );
}
await fs.writeFile(
  out + "fallback.svg",
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180"><rect width="240" height="180" fill="#284f4d"/><path d="M35 135H205M50 140V60H190V140M40 60 120 20 200 60Z M80 70V130M110 70V130M140 70V130M170 70V130" fill="none" stroke="#d3b776" stroke-width="7"/></svg>',
);
await fs.writeFile(
  "docs/games/seven-wonders-duel/asset-map.json",
  JSON.stringify(
    {
      buildingIllustrations: manifest,
      wonders: WONDERS.map((w) => w.id),
      progress: [...TOKENS],
      note: "Original imagegen atlases. Buildings within a category share scene art; identity, names, costs and effects are code, not the image.",
    },
    null,
    2,
  ) + "\n",
);
