import assert from 'node:assert/strict';
import test from 'node:test';
import { CBORGenerator, cborUtils, decodeCbor, encodeCbor, estimateAddedVbytes } from '../cbor.js';

const config = {
  collectionName: 'Test Collection',
  collectionDescription: 'Test collection',
  websiteUrl: 'https://inscribe.ink',
  useRecursiveImages: true,
};
const traits = [
  { trait_type: 'Background', value: 'Blue' },
  { trait_type: 'Eyes', value: 'Green' },
];

test('generates and encodes Tag 5 CBOR metadata', () => {
  const gen = new CBORGenerator(config);
  const meta = gen.generateMetadata(1, traits);
  const bin = gen.encodeCBOR(meta);
  const decoded = decodeCbor(bin);
  assert.equal(decoded.name, 'Test Collection #1');
  assert.equal(decoded.attributes.length, traits.length);
  assert.equal(decoded.external_url, 'https://inscribe.ink');
  assert.ok(bin instanceof Uint8Array);
  assert.ok(estimateAddedVbytes(bin.length) >= Math.ceil(bin.length / 4));
  assert.equal(cborUtils.calculateSize(meta), new TextEncoder().encode(JSON.stringify(meta)).length);
});

test('validates metadata and catches missing trait types', () => {
  const gen = new CBORGenerator(config);
  const valid = gen.validateMetadata(gen.generateMetadata(7, traits));
  assert.equal(valid.valid, true);
  const bad = gen.validateMetadata({ name: 'X', attributes: [{ trait_type: '', value: 'nope' }] });
  assert.equal(bad.valid, false);
  assert.match(bad.errors.join(' '), /trait_type/);
});

test('round-trips strings, arrays, maps, and integers', () => {
  const value = { name: 'n', attributes: [{ trait_type: 'Hat', value: 'cap' }], count: 3, ok: true, empty: null };
  assert.deepEqual(decodeCbor(encodeCbor(value)), value);
});
