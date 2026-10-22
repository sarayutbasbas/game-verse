import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import sharp from 'sharp';

const root=process.cwd();
const sourceDir=join(root,'assets/source/harmonies/cards-v5');
const cardDir=join(root,'public/art/harmonies/cards-v5');
const tokenDir=join(root,'public/art/harmonies/tokens-v5');
const railDir=join(root,'public/art/harmonies/rails-v5');
const scoreDir=join(root,'public/art/harmonies/scores-v5');
const qaDir=join(root,'data/qa-harmonies-cards-v5');
await Promise.all([sourceDir,cardDir,tokenDir,railDir,scoreDir,qaDir].map(path=>mkdir(path,{recursive:true})));

const newBackgroundSources={
 'animal-22':'/Users/basukekung/.codex/generated_images/01a14cd9-3ce4-70d2-8d2c-9a5818b19ce7/exec-ec4fe882-5c77-4e3f-9fce-15b820b49bae.png',
 'spirit-11':'/Users/basukekung/.codex/generated_images/01a14cd9-3ce4-70d2-8d2c-9a5818b19ce7/exec-57aff259-ab57-4c3a-9529-f5c691c1d439.png',
 'spirit-09':'/Users/basukekung/.codex/generated_images/01a14cd9-3ce4-70d2-8d2c-9a5818b19ce7/exec-4b76d8b8-e118-4c9b-9d08-de1b551ac52e.png',
 'whisper-05':'/Users/basukekung/.codex/generated_images/01a14cd9-3ce4-70d2-8d2c-9a5818b19ce7/exec-ae6418d8-5704-4ffc-9ebf-7d3bc22c8a7a.png',
};
for(const [id,path] of Object.entries(newBackgroundSources))await writeFile(join(sourceDir,`${id}.png`),await readFile(path));

const tokenSources={
 water:'/Users/basukekung/.codex/generated_images/01a14cd9-3ce4-70d2-8d2c-9a5818b19ce7/exec-81dc731d-a83e-42ce-b17d-b6193ce3b68e.png',
 rock:'/Users/basukekung/.codex/generated_images/01a14cd9-3ce4-70d2-8d2c-9a5818b19ce7/exec-7af4e018-dac8-478d-b2c8-74c11a9a2e4f.png',
 wood:'/Users/basukekung/.codex/generated_images/01a14cd9-3ce4-70d2-8d2c-9a5818b19ce7/exec-4983968f-bbd3-4acb-9e78-021acaa1105f.png',
 leaf:'/Users/basukekung/.codex/generated_images/01a14cd9-3ce4-70d2-8d2c-9a5818b19ce7/exec-0e3d0d3e-44e6-4e6e-a345-7bfd5ae85b10.png',
 field:'/Users/basukekung/.codex/generated_images/01a14cd9-3ce4-70d2-8d2c-9a5818b19ce7/exec-6c5ee3d7-c13f-476d-bb8c-3e7f745d36f2.png',
 building:'/Users/basukekung/.codex/generated_images/01a14cd9-3ce4-70d2-8d2c-9a5818b19ce7/exec-cb3c2f8f-643c-4f7e-b58c-024fc7214955.png',
 'neutral-base':'/Users/basukekung/.codex/generated_images/01a14cd9-3ce4-70d2-8d2c-9a5818b19ce7/exec-9824fead-1cae-4ba4-af06-30367c1d4dda.png',
 'animal-marker':'/Users/basukekung/.codex/generated_images/01a14cd9-3ce4-70d2-8d2c-9a5818b19ce7/exec-797f972f-149a-4ecf-b636-f6ca49152322.png',
};
const tokenPrompts={
 water:'thick teal painted-wood cylinder, ivory flowing waves',rock:'thick charcoal painted-wood cylinder, ivory mountain peaks',wood:'thick chestnut painted-wood cylinder, ivory tree rings',leaf:'thick moss painted-wood cylinder, pale leaves',field:'thick marigold painted-wood cylinder, ivory wildflowers',building:'thick coral painted-wood cylinder, ivory houses','neutral-base':'thin ivory hexagonal cardboard tile with one neutral contact shadow','animal-marker':'solid amber-orange painted wooden cube',
};
const sha=buffer=>createHash('sha256').update(buffer).digest('hex');
const processedTokens=[];
for(const [id,path] of Object.entries(tokenSources)){
 const raw=await readFile(path);
 await writeFile(join(sourceDir,`token-${id}-v2.png`),raw);
 const trim=await sharp(raw).trim({background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
 const size=id==='neutral-base'?246:id==='animal-marker'?184:220;
 const terrain=!['neutral-base','animal-marker'].includes(id),height=terrain?190:size;
 await sharp({create:{width:256,height:256,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
  .composite([{input:await sharp(trim).resize(size,height,{fit:terrain?'fill':'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer(),left:Math.round((256-size)/2),top:Math.round((256-height)/2)}])
  .png({compressionLevel:9}).toFile(join(tokenDir,`${id}.png`));
 processedTokens.push({id,prompt:tokenPrompts[id],imageGenOutput:path,sourcePath:`assets/source/harmonies/cards-v5/token-${id}-v2.png`,outputPath:`public/art/harmonies/tokens-v5/${id}.png`,dimensions:[256,256],sha256:sha(raw)});
}

const cards={
 'animal-22':{color:'#7e71bb',dark:'#39335c',motif:'leaf',theme:'normal'},
 'animal-01':{color:'#91ba42',dark:'#4f7f30',motif:'water',legacyCrop:true,theme:'normal'},
 'animal-02':{color:'#36a7cb',dark:'#137391',motif:'water',legacyCrop:true,theme:'normal'},
 'animal-03':{color:'#6ea5bc',dark:'#356e88',motif:'water',legacyCrop:true,theme:'normal'},
 'animal-04':{color:'#26a8b8',dark:'#087985',motif:'water',legacyCrop:true,theme:'normal'},
 'animal-05':{color:'#8bbf42',dark:'#4e842d',motif:'leaf',legacyCrop:true,theme:'normal'},
 'spirit-11':{color:'#d5963e',dark:'#573827',motif:'fossil',theme:'dinosaur'},
 'spirit-09':{color:'#55b8a9',dark:'#174f46',motif:'spirit',theme:'spirit'},
 'whisper-05':{color:'#9a78c4',dark:'#3e315f',motif:'whisper',theme:'whisper'},
};
const motifs={
 water:'<path d="M8 170q19-20 38 0t38 0M5 205q22-19 43 0t41 0M12 240q17-16 34 0t35 0"/>',
 leaf:'<path d="M45 110c-18 8-28 27-23 47 20-1 35-15 38-35-8 8-17 17-28 25M50 137c15 2 27 14 30 29-16 4-31-4-38-18M46 139v107"/>',
 fossil:'<path d="M12 112 76 225M72 98 21 230M18 151l35-10M40 188l34-11"/>',
 spirit:'<path d="M46 102c-21 13-28 37-20 58 24-3 39-20 41-44-11 13-21 24-36 34M47 146v96M11 215q18-14 36 0t36 0"/>',
 whisper:'<path d="m47 102 12 32 32 12-32 12-12 32-12-32-32-12 32-12ZM5 222q20-17 40 0t40 0"/>',
};
for(const [id,meta] of Object.entries(cards)){
 const resized=await sharp(join(sourceDir,`${id}.png`)).resize(720,1280,{fit:'fill'}).png().toBuffer();
 const source=meta.legacyCrop?await sharp(resized).extract({left:0,top:0,width:626,height:1280}).resize(720,1280,{fit:'fill'}).png().toBuffer():resized;
 await sharp(source).webp({quality:91}).toFile(join(cardDir,`${id}.webp`));
 await sharp(source).resize(360,640,{fit:'fill'}).webp({quality:89}).toFile(join(cardDir,`${id}-popup.webp`));
 await sharp(source).resize(270,480,{fit:'fill'}).webp({quality:86}).toFile(join(cardDir,`${id}-small.webp`));
 await sharp(source).resize(135,240,{fit:'fill'}).webp({quality:76}).toFile(join(cardDir,`${id}-lite.webp`));
 const rail=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="94" height="1280" viewBox="0 0 94 1280"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${meta.color}"/><stop offset="1" stop-color="${meta.dark}"/></linearGradient><filter id="p"><feTurbulence baseFrequency=".026" numOctaves="3" seed="17"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .12 0"/></filter></defs><rect width="94" height="1280" rx="0" fill="url(#g)"/><rect width="94" height="1280" filter="url(#p)" opacity=".36"/><g fill="none" stroke="#fff4b4" stroke-width="5" stroke-linecap="round" opacity=".62" transform="translate(0 850) scale(1 1.15)">${motifs[meta.motif]}</g><g fill="none" stroke="#fff6bd" stroke-width="4" opacity=".3" transform="translate(3 90) scale(.92 .78)">${motifs[meta.motif]}</g></svg>`);
 await sharp(rail).png().toFile(join(railDir,`${id}.png`));
 if(meta.theme==='normal'){
  const score=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><path d="M42 20H238V236H42L10 128Z" fill="${meta.dark}"/></svg>`);
  await sharp(score).png().toFile(join(scoreDir,`normal-${id}.png`));
 }
 meta.sideRailColor=meta.color;meta.sideRailGradient=[meta.color,meta.dark];meta.sideRailMotif=meta.motif;meta.sideRailAsset=`public/art/harmonies/rails-v5/${id}.png`;meta.scoreAsset=`public/art/harmonies/scores-v5/${meta.theme==='normal'?`normal-${id}`:`${meta.theme}-example`}.png`;
}

const specialScores={
 spirit:`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><defs><radialGradient id="g"><stop stop-color="#315c42"/><stop offset="1" stop-color="#142d27"/></radialGradient></defs><path d="m128 8 25 17 30-4 13 28 28 13-4 30 17 25-17 25 4 30-28 13-13 28-30-4-25 17-25-17-30 4-13-28-28-13 4-30-17-25 17-25-4-30 28-13 13-28 30 4Z" fill="url(#g)" stroke="#d3b75d" stroke-width="8"/><path d="M73 145c19-48 48-67 88-75-2 40-20 70-67 83 14-18 30-34 49-49" fill="none" stroke="#8fcf8a" stroke-width="8" stroke-linecap="round"/></svg>`,
 dinosaur:`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#6b4c2d"/><stop offset="1" stop-color="#261d18"/></linearGradient></defs><path d="M25 24 224 12l20 45-11 176-51 12L22 231 8 177Z" fill="url(#g)" stroke="#c77e32" stroke-width="8"/><path d="m64 190 116-119M93 207 202 96M54 150l48-13M126 115l47-13" stroke="#e2aa55" stroke-width="9" stroke-linecap="round" opacity=".68"/></svg>`,
 whisper:`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#5d4f91"/><stop offset="1" stop-color="#241f55"/></linearGradient></defs><path d="m128 8 29 25 37-2 10 36 32 19-16 33 16 33-32 19-10 36-37-2-29 25-29-25-37 2-10-36-32-19 16-33-16-33 32-19 10-36 37 2Z" fill="url(#g)" stroke="#bba7ef" stroke-width="7"/><path d="m128 53 20 51 54 15-54 15-20 51-20-51-54-15 54-15Z" fill="#d8ccff" opacity=".72"/></svg>`,
};
for(const [id,svg] of Object.entries(specialScores))await sharp(Buffer.from(svg)).png().toFile(join(scoreDir,`${id}-example.png`));

const terrainIds=['water','rock','wood','leaf','field','building'];
const tokenComposites=await Promise.all(terrainIds.map(async(id,index)=>({input:await sharp(join(tokenDir,`${id}.png`)).resize(210,210).png().toBuffer(),left:10+index*220,top:20})));
await sharp({create:{width:1330,height:250,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(tokenComposites).png().toFile(join(qaDir,'tokens-six-transparent.png'));
const base=await sharp(join(tokenDir,'neutral-base.png')).resize(220,220).png().toBuffer();
const water=await sharp(join(tokenDir,'water.png')).resize(178,178).png().toBuffer();
const stacks=[];
for(let count=1;count<=3;count++){
 const input=[{input:base,left:18,top:40}];
 for(let i=0;i<count;i++)input.push({input:water,left:39,top:48-i*25});
 stacks.push(await sharp({create:{width:256,height:260,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(input).png().toBuffer());
}
await sharp({create:{width:840,height:300,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(stacks.map((input,index)=>({input,left:12+index*280,top:20}))).png().toFile(join(qaDir,'token-stack-1-2-3.png'));
const railBuffers=await Promise.all(Object.keys(cards).map(id=>sharp(join(railDir,`${id}.png`)).resize(94,640).png().toBuffer()));
await sharp({create:{width:4*118,height:Math.ceil(railBuffers.length/4)*656+16,channels:4,background:{r:25,g:43,b:39,alpha:255}}}).composite(railBuffers.map((input,index)=>({input,left:12+(index%4)*118,top:8+Math.floor(index/4)*656}))).png().toFile(join(qaDir,'side-rails-eight.png'));

const boardBackdrop=await sharp(join(root,'public/art/harmonies/board-A.webp')).resize(900,340,{fit:'cover'}).modulate({brightness:.78}).png().toBuffer();
const oldWater=await sharp(join(sourceDir,'token-water.png')).trim({background:{r:0,g:0,b:0,alpha:0}}).resize(190,190,{fit:'contain'}).png().toBuffer();
const newWater=await sharp(join(tokenDir,'water.png')).resize(190,190).png().toBuffer();
const newBase=await sharp(join(tokenDir,'neutral-base.png')).resize(230,230).png().toBuffer();
const compareLabels=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="340"><rect x="0" y="0" width="450" height="48" fill="#173f39dd"/><rect x="450" y="0" width="450" height="48" fill="#173f39dd"/><text x="225" y="33" text-anchor="middle" fill="#fff5d3" font-family="sans-serif" font-size="24" font-weight="700">ก่อนแก้</text><text x="675" y="33" text-anchor="middle" fill="#fff5d3" font-family="sans-serif" font-size="24" font-weight="700">หลังแก้</text><path d="M450 0v340" stroke="#fff3c8" stroke-width="3"/></svg>`);
await sharp(boardBackdrop).composite([{input:oldWater,left:130,top:86},{input:newBase,left:560,top:76},{input:newWater,left:580,top:76},{input:compareLabels,left:0,top:0}]).png().toFile(join(qaDir,'board-token-before-after.png'));

const scoreShape=await sharp(join(scoreDir,'normal-animal-05.png')).resize(72,72).png().toBuffer();
const makeTrack=async(count)=>{
 const values=count===3?[15,9,4]:count===4?[16,10,6,3]:[15,10,6,4,2],height=count*78+20,items=[];
 for(const [index,value] of values.entries()){
  items.push({input:scoreShape,left:4,top:10+index*78});
  items.push({input:Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72"><text x="42" y="48" text-anchor="middle" fill="#fff8dc" font-family="sans-serif" font-size="28" font-weight="900">${value}</text></svg>`),left:4,top:10+index*78});
 }
 return sharp({create:{width:80,height,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(items).png().toBuffer();
};
const tracks=await Promise.all([3,4,5].map(makeTrack));
await sharp({create:{width:360,height:430,channels:4,background:{r:238,g:226,b:194,alpha:255}}}).composite(tracks.map((input,index)=>({input,left:35+index*110,top:10}))).png().toFile(join(qaDir,'score-tracks-3-4-5.png'));
const normalScore=await sharp(join(scoreDir,'normal-animal-01.png')).resize(180,180).png().toBuffer();
const spiritScore=await sharp(join(scoreDir,'spirit-example.png')).resize(180,180).png().toBuffer();
const scoreLabels=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="260"><text x="125" y="238" text-anchor="middle" fill="#244b41" font-family="sans-serif" font-size="20" font-weight="700">Normal</text><text x="375" y="238" text-anchor="middle" fill="#244b41" font-family="sans-serif" font-size="20" font-weight="700">Nature's Spirit</text></svg>`);
await sharp({create:{width:500,height:260,channels:4,background:{r:238,g:226,b:194,alpha:255}}}).composite([{input:normalScore,left:35,top:25},{input:spiritScore,left:285,top:25},{input:scoreLabels,left:0,top:0}]).png().toFile(join(qaDir,'score-normal-vs-spirit.png'));
const specialBuffers=await Promise.all(['spirit','dinosaur','whisper'].map(id=>sharp(join(scoreDir,`${id}-example.png`)).resize(180,180).png().toBuffer()));
await sharp({create:{width:660,height:220,channels:4,background:{r:238,g:226,b:194,alpha:255}}}).composite(specialBuffers.map((input,index)=>({input,left:20+index*220,top:20}))).png().toFile(join(qaDir,'score-special-examples.png'));

let manifest={};
try{manifest=JSON.parse(await readFile(join(sourceDir,'manifest.json'),'utf8'));}catch{}
manifest.version='cards-v5-batch-1-revision-2';
manifest.revisedAt=new Date().toISOString();
const previousBackgrounds=new Map((manifest.backgrounds??[]).map(item=>[item.id,item]));
manifest.backgrounds=await Promise.all(Object.keys(cards).map(async id=>previousBackgrounds.get(id)??({
 id,
 prompt:id==='animal-22'?'Playful ivory-outlined bat in saturated indigo violet moonlit forest, editorial storybook cut-paper, quiet lower 28% and right 13%, full bleed, no UI or tokens':id==='spirit-11'?'playful T-rex prehistoric amber canyon, editorial storybook cut-paper, full bleed, no UI':id==='spirit-09'?'watercourse dragonfly at blue-green dusk, nature-spirit cut-paper storybook, full bleed, no UI':'riverside mushrooms at violet moonlit stream, Crescendo cut-paper storybook, full bleed, no UI',
 sourcePath:`assets/source/harmonies/cards-v5/${id}.png`,
 outputPath:`public/art/harmonies/cards-v5/${id}.webp`,
 dimensions:{master:[720,1280],popup:[360,640],small:[270,480],lite:[135,240]},
 imageGenOutput:newBackgroundSources[id],
 sha256:sha(await readFile(join(sourceDir,`${id}.png`))),
})));
manifest.tokens=processedTokens;
manifest.sideRails=Object.entries(cards).map(([id,meta])=>({id,sideRailColor:meta.sideRailColor,sideRailGradient:meta.sideRailGradient,sideRailMotif:meta.sideRailMotif,sideRailAsset:meta.sideRailAsset,scoreAsset:meta.scoreAsset}));
manifest.specialScoreExamples=Object.keys(specialScores).map(id=>`public/art/harmonies/scores-v5/${id}-example.png`);
await writeFile(join(sourceDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Built revised v5 tokens, independent rails, score backgrounds, and QA component sheets.');
