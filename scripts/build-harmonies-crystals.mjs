import sharp from 'sharp';
import {copyFile,writeFile} from 'node:fs/promises';
const jobs=[['gold','exec-a256349d-4d95-4d90-aea8-cc6c004fe60c.png'],['white','exec-8e0aa2ac-db83-4344-bcb5-8808f7761381.png']];
for(const [color,file] of jobs){const source=`assets/source/harmonies/cards-v5/crystal-${color}.png`;await copyFile(`/Users/basukekung/.codex/generated_images/01a14cd9-3ce4-70d2-8d2c-9a5818b19ce7/${file}`,source);await sharp(source).resize(256,256,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toFile(`public/art/harmonies/tokens-v5/crystal-${color}.png`);}
await writeFile('assets/source/harmonies/cards-v5/crystals.json',JSON.stringify({tool:'image_gen',jobs,prompt:'Transparent beveled crystal cube, isometric, gold for animals and clear white with corner glints for spirits, no text or pedestal.'},null,2));
