import sharp from 'sharp';
import { mkdir, readdir } from 'node:fs/promises';
const folder = 'public/art/critter-kitchen';
await mkdir(`${folder}/thumbs`, {recursive:true});
for (const file of await readdir(folder)) {
    if (!file.endsWith('.webp') || /^(board-|table\.)/.test(file)) continue;
    const width = /^(ingredient-|resource-)/.test(file) ? 128 : 240;
    await sharp(`${folder}/${file}`).resize({width, withoutEnlargement:true}).webp({quality:74, effort:5}).toFile(`${folder}/thumbs/${file}`);
}
