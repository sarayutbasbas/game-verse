import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {basename,join} from 'node:path';
import sharp from 'sharp';

const root=process.cwd();
const sourceDir=join(root,'assets/source/harmonies/cards-v5');
const publicDir=join(root,'public/art/harmonies/cards-v5');
const tokenDir=join(root,'public/art/harmonies/tokens-v5');
const qaDir=join(root,'data/qa-harmonies-cards-v5');

const backgrounds={
 'animal-01':{animal:'crocodile',composition:'MEDIUM-LARGE playful crocodile bursting diagonally up from turquoise marsh water, bright alert eyes and a mischievous curved grin, forelegs visible, exaggerated swoosh of water; crocodile occupies about 34% of image height and is the obvious hero; lush chartreuse reeds against deep teal water',band:'#91ba42',path:'/Users/basukekung/.codex/generated_images/01a14cd9-3ce4-70d2-8d2c-9a5818b19ce7/exec-6b747c90-4433-43f8-8bab-6fbe8d24bfcc.png'},
 'animal-02':{animal:'stingray',composition:'WIDE underwater composition: a medium stylized stingray banks joyfully through cobalt and turquoise currents, expressive upward eyes and an elegant curling tail, with two tiny distant fish; stingray occupies about 22% of image height; graphic coral fans and sand ribbons emphasize motion',band:'#36a7cb',path:'/Users/basukekung/.codex/generated_images/01a14cd9-3ce4-70d2-8d2c-9a5818b19ce7/exec-21c79dcc-c4c5-4b77-9b8a-42db41489ad8.png'},
 'animal-03':{animal:'hippopotamus',composition:'CLOSE-UP playful hippopotamus emerging chest-high from a plum-and-coral sunset river, wide curious eyes, jaunty tilted ears and friendly open-mouth expression without aggression; hippo occupies about 45% of image height; golden papyrus and lavender hills behind',band:'#6ea5bc',path:'/Users/basukekung/.codex/generated_images/01a14cd9-3ce4-70d2-8d2c-9a5818b19ce7/exec-000c5ee1-16c3-4be4-a3a7-0b368a0d96f1.png'},
 'animal-04':{animal:'otter',composition:'MEDIUM dynamic scene with one main otter sliding belly-first down a small cascade, delighted expression and curved body, plus one much smaller distant otter peeking from water; main otter occupies about 28% of image height; mossy stones, aqua water and orange accents',band:'#26a8b8',path:'/Users/basukekung/.codex/generated_images/01a14cd9-3ce4-70d2-8d2c-9a5818b19ce7/exec-5a886a2a-6ae8-447c-9113-7d95e0f6c156.png'},
 'animal-05':{animal:'frog',composition:'WIDE habitat scene with a small-to-medium bright tree frog mid-leap between two broad leaves, lively oversized eyes and splayed toes; frog occupies about 15% of image height; enormous graphic leaves, bromeliads, violet shadows and lime pond reflections dominate the story',band:'#8bbf42',path:'/Users/basukekung/.codex/generated_images/01a14cd9-3ce4-70d2-8d2c-9a5818b19ce7/exec-1487e696-af48-42eb-8126-4ecbda046fa3.png'},
};
const tokens={
 water:{description:'teal-blue round wooden water token with three pale waves',path:'/Users/basukekung/.codex/generated_images/01a14cd9-3ce4-70d2-8d2c-9a5818b19ce7/exec-de962738-308d-4dea-a562-2631c5dab481.png'},
 rock:{description:'charcoal-gray round wooden rock token with three pale peaks',path:'/Users/basukekung/.codex/generated_images/01a14cd9-3ce4-70d2-8d2c-9a5818b19ce7/exec-71512050-4f6f-4966-9fc5-0ab94106cefc.png'},
 wood:{description:'chestnut-brown round wooden wood token with pale tree rings',path:'/Users/basukekung/.codex/generated_images/01a14cd9-3ce4-70d2-8d2c-9a5818b19ce7/exec-b12cb73f-38db-400d-9196-6bbcc10caacc.png'},
 leaf:{description:'moss-green round wooden leaf token with two pale leaves',path:'/Users/basukekung/.codex/generated_images/01a14cd9-3ce4-70d2-8d2c-9a5818b19ce7/exec-d3d6df5c-47cb-4cca-9e9e-5b2d21fc8664.png'},
 field:{description:'golden-yellow round wooden field token with pale wildflowers',path:'/Users/basukekung/.codex/generated_images/01a14cd9-3ce4-70d2-8d2c-9a5818b19ce7/exec-e5de5808-b26d-4964-afc3-17bb34f977f0.png'},
 building:{description:'coral-red round wooden building token with pale houses',path:'/Users/basukekung/.codex/generated_images/01a14cd9-3ce4-70d2-8d2c-9a5818b19ce7/exec-838cb9cd-dc9b-4ca7-ac18-189493780fc0.png'},
 'neutral-base':{description:'warm ivory hexagonal cardboard base',path:'/Users/basukekung/.codex/generated_images/01a14cd9-3ce4-70d2-8d2c-9a5818b19ce7/exec-bff8bdb3-f8e8-44e6-8d7c-fe260a545236.png'},
 'animal-marker':{description:'translucent amber animal placement cube',path:'/Users/basukekung/.codex/generated_images/01a14cd9-3ce4-70d2-8d2c-9a5818b19ce7/exec-ccd53d6a-9e13-4a9a-b374-659dd1f606e9.png'},
};
const backgroundPrompt=(id,x)=>`ORIGINAL full-bleed vertical board-game card BACKGROUND, ${id} ${x.animal}. ${x.composition}. Follow the attached references for broad cut-paper editorial storybook language only: whimsical stylized wildlife, bold graphic natural shapes, saturated contrasting inks, visible paper/screen-print grain, charming playful storytelling, simplified anatomy that stays instantly recognizable. The main animal has a precise 7px-equivalent IVORY CUTOUT OUTLINE tracing its real silhouette, a fine dark inner contour, and a tiny hard offset paper shadow; this outline must remain visible at thumbnail size. It is NOT a rectangular frame and NOT a glow. 9:16 portrait for 720×1280. FULL BLEED image and color to all four edges with no white or cream card margin and no inner frame. The rightmost 13% is a clean integrated full-height decorative band colored ${x.band}, touching the outer right edge; it remains art background, not UI. Leave the lower 27% visually quiet but fully illustrated for a live coded habitat overlay. Keep the animal clear of the right score rail and mostly clear of the bottom overlay area. Softly rounded outer silhouette is acceptable but corners themselves must contain continuous art. Absolutely no token, cylinder, cube, hex base, habitat diagram, score box, number, word, letter, title, UI, logo or watermark. Avoid photorealism, wildlife-documentary mood, cinematic realism, realistic 3D render, neon glow, duplicated limbs, malformed anatomy, cropped face, or an animal hidden by the score band. Do not copy an exact pose, animal, scenery, motif, or layout from references.`;
const tokenPrompt=x=>`Create a single isolated reusable board-game component asset: ${x.description}. Original premium tactile tabletop art. Orthographic three-quarter view tilted about 32 degrees, visible top and side wall, light from upper left, compact contact shadow, consistent camera and scale. Center on a transparent square canvas. No scene, extra pieces, text, number, UI, border, or watermark.`;
const sha=buffer=>createHash('sha256').update(buffer).digest('hex');
const normalizeBackground=async(raw,band)=>{
 const width=720,height=1280,rail=94,artWidth=width-rail;
 const art=await sharp(raw).resize(width,height,{fit:'fill'}).extract({left:0,top:0,width:artWidth,height}).toBuffer();
 const railSvg=Buffer.from(`<svg width="${rail}" height="${height}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="${band}"/><stop offset="1" stop-color="${band}" stop-opacity=".82"/></linearGradient><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="7"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .11 0"/></filter></defs><rect width="${rail}" height="${height}" fill="url(#g)"/><rect width="${rail}" height="${height}" filter="url(#n)" opacity=".28"/><path d="M0 0v1280" stroke="#f6e78f" stroke-width="3" opacity=".7"/><g transform="translate(16 1178)" fill="none" stroke="#f5f2a8" stroke-width="4" stroke-linecap="round" opacity=".72"><path d="M30 76C29 49 37 27 52 7M31 59C18 52 10 41 8 28M34 48c14-4 24-13 29-25"/><path d="M9 30c9 0 17 6 20 16M52 8c2 10-2 20-12 28"/></g></svg>`);
 return sharp({create:{width,height,channels:3,background:band}}).composite([{input:art,left:0,top:0},{input:railSvg,left:artWidth,top:0}]).png().toBuffer();
};
await Promise.all([sourceDir,publicDir,tokenDir,qaDir].map(d=>mkdir(d,{recursive:true})));
const manifest={version:'cards-v5-batch-1',generatedAt:new Date().toISOString(),generator:'OpenAI ImageGen',backgrounds:[],tokens:[]};
for(const [id,x] of Object.entries(backgrounds)){
 const raw=await readFile(x.path),source=join(sourceDir,`${id}.png`);await writeFile(source,raw);const master=await normalizeBackground(raw,x.band);
 await sharp(master).webp({quality:91}).toFile(join(publicDir,`${id}.webp`));
 await sharp(master).resize(360,640,{fit:'fill'}).webp({quality:89}).toFile(join(publicDir,`${id}-popup.webp`));
 await sharp(master).resize(270,480,{fit:'fill'}).webp({quality:86}).toFile(join(publicDir,`${id}-small.webp`));
 await sharp(master).resize(135,240,{fit:'fill'}).webp({quality:76}).toFile(join(publicDir,`${id}-lite.webp`));
 manifest.backgrounds.push({id,prompt:backgroundPrompt(id,x),sourcePath:`assets/source/harmonies/cards-v5/${id}.png`,outputPath:`public/art/harmonies/cards-v5/${id}.webp`,dimensions:{master:[720,1280],popup:[360,640],small:[270,480],lite:[135,240]},sha256:sha(raw),imageGenOutput:x.path});
}
for(const [id,x] of Object.entries(tokens)){
 const raw=await readFile(x.path),source=join(sourceDir,`token-${id}.png`);await writeFile(source,raw);
 await sharp(raw).trim({background:{r:0,g:0,b:0,alpha:0}}).resize(256,256,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png({compressionLevel:9}).toFile(join(tokenDir,`${id}.png`));
 manifest.tokens.push({id,prompt:tokenPrompt(x),sourcePath:`assets/source/harmonies/cards-v5/token-${id}.png`,outputPath:`public/art/harmonies/tokens-v5/${id}.png`,dimensions:[256,256],sha256:sha(raw),imageGenOutput:x.path});
}
await writeFile(join(sourceDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const cardBuffers=await Promise.all(Object.keys(backgrounds).map(id=>sharp(join(publicDir,`${id}.webp`)).resize(270,480).toBuffer()));
await sharp({create:{width:5*286,height:516,channels:3,background:'#e7d9b8'}}).composite(cardBuffers.map((input,i)=>({input,left:8+i*286,top:18}))).png().toFile(join(qaDir,'background-contact-sheet.png'));
const tokenBuffers=await Promise.all(Object.keys(tokens).map(id=>sharp(join(tokenDir,`${id}.png`)).resize(150,150,{fit:'contain'}).toBuffer()));
await sharp({create:{width:4*176,height:2*176,channels:4,background:{r:238,g:226,b:195,alpha:1}}}).composite(tokenBuffers.map((input,i)=>({input,left:13+(i%4)*176,top:13+Math.floor(i/4)*176}))).png().toFile(join(qaDir,'token-contact-sheet.png'));
console.log(`Built ${manifest.backgrounds.length} cards and ${manifest.tokens.length} shared components.`);
