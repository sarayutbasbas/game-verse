/** Shared versioned artwork: generated stones and supplied character references. */
const generatedStones=new Set(['t-mind','t-soul','t-space','t-power','t-reality','t-time']);
export const loveLetterCardArt=(id:string)=>`/art/love-letter/${id.startsWith('b-')?'':generatedStones.has(id)?'generated-v2/':'reference-v2/'}${id}.webp`;
