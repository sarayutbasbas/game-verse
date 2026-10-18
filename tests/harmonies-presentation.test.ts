import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ANIMALS } from '../src/games/harmonies/data.js';
import { habitatLayout, amberCube, animalArt, cylinder } from '../src/client/harmonies-presentation.js';
test('Harmonies all32 card scenes preserve axial neighbors, real stack heights, cube cell and species mapping', () => {
    for (const card of ANIMALS) {
        const l = habitatLayout(card.id);
        assert.equal(l.cells.length, card.pattern.length);
        assert.equal(l.cells.filter(c => c.cube).length, 1);
        assert.ok(l.maxX > l.minX && l.maxY > l.minY);
        for (let i = 0; i < card.pattern.length; i++) {
            const p = card.pattern[i], c = l.cells[i];
            assert.equal(c.q, p.q);
            assert.equal(c.r, p.r);
            assert.equal(c.cube, p.cube);
            assert.deepEqual(c.stack, p.stack);
            assert.equal(c.displayStack.length, p.stack[0] === 'building' ? 2 : p.stack.length);
            assert.equal(c.x, p.q * 49);
            assert.equal(c.y, (p.r + p.q / 2) * 56);
            assert.ok(c.x > l.minX && c.x < l.maxX);
        }
        for (const cell of card.pattern) for (const terrain of cell.stack) {
            const token = cylinder(terrain, 0);
            assert.ok(token.includes('hm-cap'));
            assert.ok(!token.includes('hm-wall'));
        }
        assert.equal(animalArt(card.id), `/art/harmonies/reference/${card.id}.webp`);
        for (const height of [1, 2, 3]) {
            const model = amberCube(card.id, height);
            assert.equal((model.match(/<i>/g) ?? []).length, 6);
            assert.ok(model.includes(`--height:${height}`));
            assert.ok(model.includes(`data-cube-card="${card.id}"`));
        }
    }
});
