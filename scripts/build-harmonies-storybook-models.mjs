import sharp from 'sharp';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const manifestPath='docs/games/harmonies/storybook-v1-model-jobs.json';
const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
const sourceDir='assets/source/harmonies/storybook-v1',outDir='public/art/harmonies/figurines/storybook-v1';
await mkdir(outDir,{recursive:true});await mkdir('data/qa-harmonies-storybook-v1',{recursive:true});
for(const job of manifest.entries)await access(`${sourceDir}/${job.id}.png`);
for(const job of manifest.entries){
 const source=`${sourceDir}/${job.id}.png`,{data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let left=info.width,top=info.height,right=-1,bottom=-1;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>16){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 if(right<left)throw Error('Empty generated sprite: '+job.id);
 const crop=await sharp(source).extract({left,top,width:right-left+1,height:bottom-top+1}).resize(144,168,{fit:'inside',withoutEnlargement:false}).png().toBuffer();
 const size=await sharp(crop).metadata();
 const output=await sharp({create:{width:160,height:184,channels:4,background:'#0000'}}).composite([{input:crop,left:Math.floor((160-size.width)/2),top:176-size.height}]).webp({quality:94,alphaQuality:100,effort:5}).toBuffer();
 await writeFile(job.output,output);
 const record=JSON.parse(await readFile(`${sourceDir}/${job.id}.json`,'utf8'));
 Object.assign(job,{generatedSource:record.source,source,content:{width:size.width,height:size.height,baseline:176},sha256:createHash('sha256').update(output).digest('hex')});
}
await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
const cols=7,cellW=160,cellH=210,rows=Math.ceil(manifest.entries.length/cols),layers=[];
for(const [i,j]of manifest.entries.entries()){
 const left=i%cols*cellW,top=Math.floor(i/cols)*cellH;
 layers.push({input:await sharp(j.output).png().toBuffer(),left,top});
 const label=`<svg width="160" height="26"><text x="80" y="18" fill="#23473b" font-family="sans-serif" font-size="12" text-anchor="middle">${j.id} ${j.id.startsWith('animal')?'':j.id.startsWith('spirit')?'spirit':'whisper'}</text></svg>`;
 layers.push({input:Buffer.from(label),left,top:top+184});
}
await sharp({create:{width:cols*cellW,height:rows*cellH,channels:4,background:'#f8edd3'}}).composite(layers).png().toFile('data/qa-harmonies-storybook-v1/contact-sheet.png');
await writeFile('data/qa-harmonies-storybook-v1/review.html',`<!doctype html><meta charset="utf-8"><title>Harmonies 2D storybook models</title><style>body{font:16px system-ui;background:#f7ecd3;color:#23473b}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}article{text-align:center;border:1px solid #baad8d;padding:8px;border-radius:12px}img{width:160px;height:184px}h2{font-size:15px}</style><h1>2D storybook models · 53 cards · 160 × 184 · baseline 176</h1><main>${manifest.entries.map(j=>`<article><img src="../../${j.output}" alt="${j.name}"><h2>${j.id} · ${j.name}</h2></article>`).join('')}</main>`);
console.log('Normalized and exported '+manifest.entries.length+' new 2D sprites.');
