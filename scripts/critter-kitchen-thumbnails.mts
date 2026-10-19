import sharp from 'sharp';
import { mkdir, readdir } from 'node:fs/promises';
const folder = 'public/art/critter-kitchen';
for (const subfolder of ['', 'portrait/']) {
  await mkdir(`${folder}/thumbs/${subfolder}`, {recursive:true});
  for (const file of await readdir(`${folder}/${subfolder}`)) {
    if (!file.endsWith('.webp') || /^(board-|table\.)/.test(file)) continue;
    const width = /^(ingredient-|resource-)/.test(file) ? 128 : 240;
    await sharp(`${folder}/${subfolder}${file}`).resize({width, withoutEnlargement:true}).webp({quality:74, effort:5}).toFile(`${folder}/thumbs/${subfolder}${file}`);
  }
}
