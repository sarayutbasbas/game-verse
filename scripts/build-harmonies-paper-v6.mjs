import sharp from 'sharp';
import {mkdir,readdir,readFile,writeFile,stat} from 'node:fs/promises';
const source='assets/source/harmonies/paper-v6',out='public/art/harmonies/paper-v6',rail='public/art/harmonies/rails-v6';
await Promise.all([source,out,rail].map(d=>mkdir(d,{recursive:true})));
const colors={water:'#1689ad',rock:'#62696b',wood:'#a35c32',leaf:'#95a62b',field:'#e6b522',building:'#c44d3e'};
const motifs={water:'<path d="M12 44Q34 22 56 44T104 44M12 64Q34 42 56 64T104 64M12 84Q34 62 56 84T104 84" fill="none" stroke="currentColor" stroke-width="5"/>',rock:'<path d="M12 75 30 43 48 61 66 24 105 79 73 74 59 84 37 76Z"/>',wood:'<g fill="none" stroke="currentColor" stroke-width="3"><ellipse cx="58" cy="58" rx="43" ry="32"/><ellipse cx="58" cy="58" rx="32" ry="23"/><ellipse cx="58" cy="58" rx="21" ry="15"/><ellipse cx="58" cy="58" rx="10" ry="7"/></g>',leaf:'<ellipse cx="55" cy="58" rx="13" ry="20" transform="rotate(-36 55 58)"/><ellipse cx="31" cy="39" rx="6" ry="10" transform="rotate(-40 31 39)"/><ellipse cx="28" cy="65" rx="5" ry="9" transform="rotate(-55 28 65)"/><ellipse cx="79" cy="37" rx="6" ry="11" transform="rotate(30 79 37)"/><ellipse cx="86" cy="65" rx="5" ry="9" transform="rotate(50 86 65)"/>',field:'<g transform="translate(59 57)"><circle r="5"/><ellipse cy="-15" rx="8" ry="11"/><ellipse cy="-15" rx="8" ry="11" transform="rotate(72)"/><ellipse cy="-15" rx="8" ry="11" transform="rotate(144)"/><ellipse cy="-15" rx="8" ry="11" transform="rotate(216)"/><ellipse cy="-15" rx="8" ry="11" transform="rotate(288)"/></g><g transform="translate(22 26) scale(.4)"><circle r="10"/><path d="M-8-7-8-23 8-23 8-7 23-7 23 8 8 8 8 23-8 23-8 8-23 8-23-7Z"/></g>',building:'<path d="m18 53 23-20 23 20V83H18Zm52-9 18-16 18 16V70H70Z"/>'};
for(const [terrain,color]of Object.entries(colors)){
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="1200"><defs><linearGradient id="g"><stop stop-color="#fff7c9" stop-opacity=".36"/><stop offset=".12" stop-color="${color}"/><stop offset="1" stop-color="${color}"/></linearGradient><filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".45" numOctaves="2" seed="7"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".075"/></feComponentTransfer><feBlend in="SourceGraphic" mode="soft-light"/></filter><clipPath id="clip"><path d="M0 0H94Q120 0 120 26V1174Q120 1200 94 1200H0Z"/></clipPath></defs><g clip-path="url(#clip)"><rect width="120" height="1200" fill="${color}"/><rect width="120" height="1200" fill="url(#g)" filter="url(#paper)"/><path d="M8 0V1200" stroke="#fff6d0" stroke-opacity=".35" stroke-width="7"/><g transform="translate(0 1010)" color="#fff4c7" fill="currentColor" opacity=".8">${motifs[terrain]}</g></g></svg>`;
 await sharp(Buffer.from(svg)).png().toFile(`${rail}/${terrain}.png`);
 const smallSvg=svg.replace(/<g transform="translate\(0 1010\)"[\s\S]*?<\/g><\/g><\/svg>$/, '</g></svg>');
 await sharp(Buffer.from(smallSvg)).png().toFile(`${rail}/${terrain}-small.png`);
}
const jobs=[];
for(const file of (await readdir(source)).filter(f=>/^(animal|spirit|whisper)-\d+\.png$/.test(f))){const id=file.slice(0,-4);
 for(const [suffix,w,h,quality]of [['',900,1200,85],['-small',300,400,76],['-lite',150,200,68]]){
  const output=`${out}/${id}${suffix}.webp`;
  await sharp(`${source}/${file}`).resize(w,h,{fit:'cover',position:'centre'}).webp({quality}).toFile(output);
  jobs.push({id,file:output,width:w,height:h,bytes:(await stat(output)).size});
 }
}
await writeFile(`${source}/exports.json`,JSON.stringify({style:'textured flat vector storybook / screen print',art_only:true,aspect_ratio:'3:4',rail_families:colors,exports:jobs},null,2));
console.log(`Exported ${jobs.length/3} backgrounds with small/lite variants and six separate rails.`);
