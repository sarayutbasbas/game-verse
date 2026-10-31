// Version replaced artwork so browsers and proxies cannot reuse the previous flat cover.
export const gameBoxArt = (id: string) => id === 'bomb-busters' ? '/art/bomb-busters/cover.webp' : id === 'courtisans' ? '/art/courtisans/cover.webp' : id === 'trio' ? '/art/trio/cover.webp' : id === 'castle-combo' ? '/art/castle-combo/cover.webp' : id === 'power-hungry-pets' ? '/art/power-hungry-pets/cover.webp' : id === 'love-letter' ? '/art/love-letter/cover.webp' : id === 'sounds-fishy' ? '/art/sounds-fishy/cover.webp' : id === 'perch' ? '/art/perch/cover-v2.webp' : id === 'draftosaurus' ? '/art/draftosaurus/cover-v2.webp' : id === 'take-time'
  ? '/art/boxes/take-time-9a765b96596b.png'
  : '/art/boxes/'+id+'.png';
