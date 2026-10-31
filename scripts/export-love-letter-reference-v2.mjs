// Deterministic extraction of the user-supplied card-sheet portraits.
// Artwork is NOT AI-generated. Typography/ranks/effects are rendered by the client.
import fs from 'node:fs/promises';
import sharp from 'sharp';
const hero=process.argv[2]??'/Users/basukekung/Downloads/pic6956826.webp';
const thanos=process.argv[3]??'/Users/basukekung/Downloads/pic6956831.webp';
const output='public/art/love-letter/reference-v2/';
const entries=[
 ['h-starlord','hero',182,30,124,154],['h-gamora','hero',375,30,119,155],['h-hulk','hero',564,30,123,155],['h-scarletwitch','hero',742,30,126,155],['h-doctorstrange','hero',945,30,118,155],
 ['h-thor','hero',76,308,119,154],['h-vision','hero',263,308,126,154],['h-spiderman','hero',458,308,124,154],['h-falcon','hero',654,308,123,154],['h-ironman','hero',850,289,123,176],['h-nebula','hero',1022,350,148,113],
 ['h-antman-wasp','hero',153,593,122,153],['h-captainamerica','hero',345,593,123,155],['h-captainmarvel','hero',539,593,124,155],['h-blackwidow','hero',735,593,120,155],['h-blackpanther','hero',925,593,128,155],
 ['t-mind','thanos',187,31,116,130],['t-soul','thanos',385,31,115,130],['t-space','thanos',578,31,120,130],['t-power','thanos',785,31,111,130],
 ['t-proxima','thanos',75,312,120,169],['t-blackdwarf','thanos',277,312,123,169],['t-thanos','thanos',482,300,118,180],['t-corvus','thanos',678,312,124,169],['t-ebonymaw','thanos',875,312,127,169],
 ['t-outrider','thanos',155,607,134,169],['t-reality','thanos',365,607,137,140],['t-time','thanos',580,607,132,140],
];
await fs.mkdir(output,{recursive:true});
for(const [id,side,left,top,width,height]of entries){
 const input=side==='hero'?hero:thanos;
 await sharp(input).extract({left,top,width,height}).resize(700,1000,{fit:'cover',position:side==='hero'?(id==='h-falcon'?'northeast':'northwest'):'north',kernel:'lanczos3'}).webp({quality:92}).toFile(output+id+'.webp');
}
const manifest={method:'User-authorized deterministic portrait extraction and HTML Thai lettering; not newly generated artwork',sources:[{role:'hero card sheet',path:hero},{role:'Thanos card sheet',path:thanos}],output,portraits:entries.map(([id,side,left,top,width,height])=>({id,source:side,crop:{left,top,width,height},file:output+id+'.webp'}))};
await fs.writeFile('docs/games/love-letter/reference-v2.json',JSON.stringify(manifest,null,2)+'\n');
console.log('Exported '+entries.length+' unique portraits; Outrider duplicates share the same illustration.');
