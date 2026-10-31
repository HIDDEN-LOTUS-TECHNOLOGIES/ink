import assert from 'node:assert/strict';
import test from 'node:test';
import { csvToItems, generateMetadataCSV, itemsToCsv, parseMetadataCSV } from '../metadataCsv.js';
import { normalizeCollection, sameItems } from '../convert.js';

test('layer CSV parses and generates', () => {
  const csv = 'layer_name,trait_name,inscription_id,rarity\nBackground,Blue Sky,,25\nCharacter,Hero,,50\n';
  const parsed = parseMetadataCSV(csv);
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.totalTraits, 2);
  assert.equal(parsed.layers[0].name, 'Background');
  const again = parseMetadataCSV(generateMetadataCSV(parsed.layers));
  assert.equal(again.rows[1].traitName, 'Hero');
  assert.equal(again.rows[1].rarity, 50);
});

test('collection JSON CSV JSON keeps ink fields', () => {
  const items = normalizeCollection([
    { n: 1, name: 'Piece, "one"', id: `${'a'.repeat(64)}i0`, t: { Hat: 'cap', Note: 'a,b' }, score: 1.25 },
    { n: 2, name: 'Two', id: `${'b'.repeat(64)}i0`, t: { Hat: 'none' }, score: 2 },
  ]);
  const back = csvToItems(itemsToCsv(items));
  assert.equal(sameItems(items, back), true);
});
