import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { ANIMALS } from '../src/games/harmonies/data.js';
test('Harmonies reference inventory: all32 animals and five decoration assets are original distinct optimized runtime files', () => { const m = JSON.parse(readFileSync('docs/games/harmonies/reference-redesign/asset-manifest.json', 'utf8')); assert.equal(m.assets.length, 37); for (const c of ANIMALS)
    assert.ok(m.assets.some((a: any) => a.id === c.id && a.animal === c.animal)); const hashes = new Set<string>(); for (const a of m.assets) {
    assert.equal(a.status, 'generated');
    const b = readFileSync('public' + a.file);
    assert.equal(b.subarray(0, 4).toString(), 'RIFF');
    assert.equal(b.subarray(8, 12).toString(), 'WEBP');
    assert.equal(createHash('sha256').update(b).digest('hex'), a.sha256);
    assert.ok(!hashes.has(a.sha256));
    hashes.add(a.sha256);
    assert.ok(a.width <= 1400);
} });

// Keep the compact rails inexpensive even on screens with high pixel density.
test('Harmonies all32 thumbnails are 240px WebP files smaller than their detail images', async () => {
    const { default: sharp } = await import('sharp');
    for (const card of ANIMALS) {
        const small = readFileSync(`public/art/harmonies/reference/${card.id}-small.webp`);
        const large = readFileSync(`public/art/harmonies/reference/${card.id}.webp`);
        assert.equal((await sharp(small).metadata()).width, 240);
        assert.ok(small.length < large.length * .3, card.id);
    }
});
