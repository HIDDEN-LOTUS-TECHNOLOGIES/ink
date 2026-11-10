import assert from 'node:assert/strict';
import test from 'node:test';
import { csvToItems, generateMetadataCSV, itemsToCsv, itemsToMagicEden, parseMetadataCSV } from '../metadataCsv.js';
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

test('thumbnail urls survive the csv round trip and stay off the trait map', () => {
  const items = normalizeCollection([
    {
      id: `${'a'.repeat(64)}i0`,
      meta: {
        name: 'One',
        high_res_img_url: 'https://cdn.example/hi.png',
        collection_page_img_url: 'https://cdn.example/page.png',
        attributes: [{ trait_type: 'Hat', value: 'cap' }],
      },
    },
    {
      id: `${'b'.repeat(64)}i0`,
      name: 'Two',
      n: 2,
      high_res_img_url: 'https://cdn.example/two.png',
      attributes: [{ trait_type: 'Hat', value: 'none' }],
    },
  ]);
  const back = csvToItems(itemsToCsv(items));
  assert.equal(sameItems(items, back), true);
  assert.equal(back[0].high_res_img_url, 'https://cdn.example/hi.png');
  assert.equal(back[0].collection_page_img_url, 'https://cdn.example/page.png');
  assert.equal(back[0].t.high_res_img_url, undefined);
  assert.equal(back[0].t.collection_page_img_url, undefined);
  assert.equal(back[1].high_res_img_url, 'https://cdn.example/two.png');
  const me = itemsToMagicEden(items);
  assert.equal(me[0].meta.high_res_img_url, 'https://cdn.example/hi.png');
  assert.equal(me[0].meta.collection_page_img_url, 'https://cdn.example/page.png');
  assert.equal(me[1].meta.high_res_img_url, 'https://cdn.example/two.png');
});
