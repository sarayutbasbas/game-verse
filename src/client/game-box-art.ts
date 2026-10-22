// Version replaced artwork so browsers and proxies cannot reuse the previous flat cover.
export const gameBoxArt = (id: string) => id === 'perch' ? '/art/perch/cover-v2.webp' : id === 'draftosaurus' ? '/art/draftosaurus/cover-v2.webp' : id === 'take-time'
  ? '/art/boxes/take-time-9a765b96596b.png'
  : '/art/boxes/'+id+'.png';
