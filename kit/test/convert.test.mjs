import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isGammaOnChain,
  isGammaOnChainItem,
  itemLabel,
  normalizeCollection,
  toIdList,
  toMagicEden,
  toUnisatInscriptions,
  toUnisatMeta,
} from '../convert.js';

const id = (ch, n = 0) => `${ch.repeat(64)}i${n}`;

test('thumbnail fields survive normalize, the magic eden export, and a json reload', () => {
  const fromTop = normalizeCollection([{
    id: id('a'),
    name: 'Top',
    high_res_img_url: 'https://cdn.example/top.png',
    attributes: [{ trait_type: 'Hat', value: 'cap' }],
  }]);
  assert.equal(fromTop[0].high_res_img_url, 'https://cdn.example/top.png');
  assert.equal(fromTop[0].t.high_res_img_url, undefined);

  const fromMeta = normalizeCollection([{
    id: id('a'),
    meta: {
      name: 'Meta',
      collection_page_img_url: 'https://cdn.example/page.png',
      high_res_img_url: 'https://cdn.example/meta.png',
      attributes: [{ trait_type: 'Hat', value: 'cap' }],
    },
    high_res_img_url: 'https://cdn.example/ignored-top.png',
  }]);
  assert.equal(fromMeta[0].high_res_img_url, 'https://cdn.example/meta.png');
  assert.equal(fromMeta[0].collection_page_img_url, 'https://cdn.example/page.png');

  const me = toMagicEden(fromMeta);
  assert.equal(me[0].meta.high_res_img_url, 'https://cdn.example/meta.png');
  assert.equal(me[0].meta.collection_page_img_url, 'https://cdn.example/page.png');
  assert.equal(me[0].high_res_img_url, undefined);
  const again = normalizeCollection(me);
  assert.equal(again[0].high_res_img_url, 'https://cdn.example/meta.png');
  assert.equal(again[0].collection_page_img_url, 'https://cdn.example/page.png');

  const ink = normalizeCollection([{
    id: id('b'),
    name: 'Ink',
    n: 4,
    t: { Hat: 'cap' },
    collection_page_img_url: 'https://cdn.example/ink.png',
  }]);
  const reloaded = normalizeCollection(JSON.parse(JSON.stringify(ink)));
  assert.equal(reloaded[0].collection_page_img_url, 'https://cdn.example/ink.png');
  assert.equal(reloaded[0].n, 4);
  assert.equal(reloaded[0].t.Hat, 'cap');
});

test('gamma on-chain rows use the file as the display name and have no inscription id', () => {
  const data = [
    { file: '1.png', meta: { name: 'One', attributes: [{ trait_type: 'Hat', value: 'cap' }] } },
    { file: '2.png', meta: { attributes: [{ trait_type: 'Hat', value: 'none' }] } },
  ];
  assert.equal(isGammaOnChain(data), true);
  const items = normalizeCollection(data);
  assert.equal(items[0].file, '1.png');
  assert.equal(items[0].name, 'One');
  assert.equal(items[0].id, '');
  assert.equal(itemLabel(items[0]), '1.png');
  assert.equal(items[0].t.Hat, 'cap');
  assert.equal(itemLabel(items[1]), '2.png');
  assert.equal(items[1].name, '2.png');
  assert.equal(toIdList(items), '');
  assert.deepEqual(toUnisatInscriptions(items), []);

  const withId = { id: id('a'), file: '3.png', meta: { name: 'Three', attributes: [] } };
  assert.equal(isGammaOnChainItem(withId), false);
  assert.equal(isGammaOnChain([withId]), false);
  assert.equal(itemLabel(normalizeCollection([withId])[0]), 'Three');
});

test('unisat meta is an empty stub and id exports skip rows without an inscription id', () => {
  assert.deepEqual(toUnisatMeta(), {
    name: '',
    slug: '',
    icon: '',
    twitter: '',
    discord: '',
    website: '',
  });
  const items = normalizeCollection([
    { id: id('a'), meta: { name: 'One', high_res_img_url: 'https://cdn.example/a.png', attributes: [{ trait_type: 'Hat', value: 'cap' }] } },
    { file: '2.png', meta: { name: 'Two', attributes: [{ trait_type: 'Hat', value: 'cap' }] } },
    { id: 'not-an-id', name: 'Bad', attributes: [{ trait_type: 'Hat', value: 'cap' }] },
    { id: id('b', 1), meta: { name: 'Three', attributes: [{ trait_type: 'Hat', value: 'none' }] } },
  ]);
  const inscriptions = toUnisatInscriptions(items);
  assert.deepEqual(inscriptions.map((row) => row.id), [id('a'), id('b', 1)]);
  assert.equal(inscriptions[0].meta.name, 'One');
  assert.equal(inscriptions[0].meta.high_res_img_url, 'https://cdn.example/a.png');
  assert.deepEqual(inscriptions[0].meta.attributes, [{ trait_type: 'Hat', value: 'cap' }]);
  assert.equal(toIdList(items), `${id('a')}\n${id('b', 1)}\n`);
  assert.equal(toIdList(items).trim().split('\n').length, 2);
});
