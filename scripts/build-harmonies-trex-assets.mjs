import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
const [cardSource,modelSource]=process.argv.slice(2);
if(!cardSource||!modelSource)throw Error('Usage: node scripts/build-harmonies-trex-assets.mjs card.png transparent-model.png');
await mkdir('public/art/harmonies/reference',{recursive:true});await mkdir('public/art/harmonies/figurines/animated-v5',{recursive:true});
for(const [suffix,width,height]of [['',720,1040],['-small',240,347],['-lite',120,173]]){
 await sharp(cardSource).resize(width,height,{fit:'cover',position:'centre'}).webp({quality:suffix==='-lite'?70:85}).toFile(`public/art/harmonies/reference/spirit-11${suffix}.webp`);
}
const meta=await sharp(modelSource).metadata();if(!meta.hasAlpha)throw Error('T-rex model must retain real transparency');
await sharp(modelSource).trim({threshold:8}).resize(148,172,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).extend({top:6,bottom:6,left:6,right:6,background:{r:0,g:0,b:0,alpha:0}}).webp({quality:90,alphaQuality:100}).toFile('public/art/harmonies/figurines/animated-v5/spirit-11.webp');
console.log('Built T-rex card (full/small/lite) and transparent 160×184 figurine.');
