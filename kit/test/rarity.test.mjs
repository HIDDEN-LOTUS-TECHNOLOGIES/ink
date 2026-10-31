import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { rankByScore, tierCounts, tierFor } from '../../assets/rarity.js';

const expected = {
  opium: { top: [218, 271, 490, 169, 574], bottom: [519, 553, 123, 753, 612], supply: 777 },
  fun: { top: [0, 14, 19, 72, 84], bottom: [6, 80, 66, 25, 11], supply: 101 },
  fosterz: { top: [63, 62, 12, 67, 7], bottom: [47, 21, 25, 38, 48], supply: 69 },
  orphanz: { top: [210, 73, 42, 365, 222], bottom: [165, 5, 368, 29, 217], supply: 399 },
};

function ranked(slug) {
  const items = JSON.parse(readFileSync(new URL(`../../data/${slug}.json`, import.meta.url), 'utf8'));
  const ranks = rankByScore(items);
  return items.map((i) => ({ n: i.n, rank: ranks.get(i.id) })).sort((a, b) => a.rank - b.rank);
}

test('kit rarity matches the live collection ranks', () => {
  for (const [slug, want] of Object.entries(expected)) {
    const rows = ranked(slug);
    assert.deepEqual(rows.slice(0, 5).map((r) => r.n), want.top, slug);
    assert.deepEqual(rows.slice(-5).map((r) => r.n), want.bottom, slug);
    assert.equal(rows.length, want.supply);
  }
});

test('OPIUM tier counts follow the percentile cutoffs', () => {
  const rows = ranked('opium');
  const counts = tierCounts(rows.map((r) => r.rank), 777);
  const supply = 777;
  let legendary = 0; let epic = 0; let rare = 0; let uncommon = 0; let common = 0;
  for (let rank = 1; rank <= supply; rank++) {
    const name = tierFor(rank, supply)[0];
    if (name === 'legendary') legendary += 1;
    else if (name === 'epic') epic += 1;
    else if (name === 'rare') rare += 1;
    else if (name === 'uncommon') uncommon += 1;
    else common += 1;
  }
  assert.deepEqual(counts, { legendary, epic, rare, uncommon, common });
  assert.equal(legendary, 7);
  assert.ok(1 / supply <= 0.01);
  assert.ok(8 / supply > 0.01 && 8 / supply <= 0.05);
});
