import sharp from 'sharp';
import {readFileSync,mkdirSync,statSync} from 'node:fs';
const catalog=['catalog','spirits','whispers'].flatMap(n=>JSON.parse(readFileSync('src/games/harmonies/'+n+'.json','utf8')));
const whisper=['crystal','statue','flower','coral','mushroom','flower','statue','crystal','mushroom','coral'];let before=0,after=0;
mkdirSync('public/art/harmonies/figurines/thumbs',{recursive:true});
for(const c of catalog){const src='public/art/harmonies/reference/'+c.id+'-small.webp',out='public/art/harmonies/reference/'+c.id+'-lite.webp';await sharp(src).resize({width:120,height:174,fit:'inside'}).webp({quality:64}).toFile(out);before+=statSync(src).size;after+=statSync(out).size;
const sprite=c.kind==='whisper'?'public/art/harmonies/figurines/sculpted-v1/whisper-'+whisper[Number(c.id.slice(-2))-1]+'-glow.webp':'public/art/harmonies/figurines/animated-v5/'+c.id+'.webp';await sharp(sprite).resize({width:64,height:64,fit:'inside'}).webp({quality:70,alphaQuality:90}).toFile('public/art/harmonies/figurines/thumbs/'+c.id+'.webp');}
const result={cards:catalog.length,beforeBytes:before,afterBytes:after,savedPercent:Math.round((1-after/before)*100),normalCardPixels:240*347,lightCardPixels:120*174};console.log(result);
