import sharp from "sharp";
const source = "assets/source/calico/",
  out = "public/art/calico/";
const cats = [
  "millie",
  "tibbit",
  "coconut",
  "cira",
  "gwenivere",
  "callie",
  "rumi",
  "tecolote",
  "almond",
  "leo",
];
const meta = await sharp(source + "cats.png").metadata();
for (let i = 0; i < 10; i++) {
  const x = Math.floor(((i % 5) * meta.width) / 5),
    y = Math.floor((Math.floor(i / 5) * meta.height) / 2),
    right = Math.floor((((i % 5) + 1) * meta.width) / 5),
    bottom = Math.floor(((Math.floor(i / 5) + 1) * meta.height) / 2);
  await sharp(source + "cats.png")
    .extract({ left: x, top: y, width: right - x, height: bottom - y })
    .resize(320, 320, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 88 })
    .toFile(out + cats[i] + ".webp");
}
await sharp(source + "cover.png")
  .resize(560, 760, { fit: "cover" })
  .webp({ quality: 85 })
  .toFile("public/art/covers/calico.webp");
await sharp(source + "cloth.png")
  .resize(512, 512)
  .webp({ quality: 80 })
  .toFile(out + "cloth.webp");
const buttons = await sharp(source + "buttons.png").metadata();
for (let i = 0; i < 7; i++) {
  const left = Math.floor((i * buttons.width) / 7),
    right = Math.floor(((i + 1) * buttons.width) / 7);
  await sharp(source + "buttons.png")
    .extract({ left, top: 0, width: right - left, height: buttons.height })
    .resize(96, 96, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 88 })
    .toFile(
      out +
        ["blue", "cyan", "green", "yellow", "magenta", "purple", "rainbow"][i] +
        "-button.webp",
    );
}
console.log(
  "Prepared 10 cat cutouts, 7 buttons, linen texture and portal cover.",
);
