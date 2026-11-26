import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { propertiesFieldBytes } from '../../estimate/size.js';
import { CBORGenerator, cborUtils, chunkedTagScriptBytes, decodeCbor, encodeCbor, estimateAddedVbytes } from '../cbor.js';

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
  assert.equal(meta.image, undefined);
  assert.equal(decoded.image, undefined);
  assert.ok(bin instanceof Uint8Array);
  assert.ok(estimateAddedVbytes(bin.length) >= Math.ceil(bin.length / 4));
  assert.equal(cborUtils.calculateSize(meta), new TextEncoder().encode(JSON.stringify(meta)).length);
  assert.equal('createAttribute' in cborUtils, false);
  const source = readFileSync(new URL('../cbor.js', import.meta.url), 'utf8');
  assert.equal(source.includes('recursive://'), false);
  assert.equal(source.includes('createAttribute'), false);
  assert.equal(source.includes('display_type'), false);
});

test('a caller-supplied image path is kept', () => {
  const image = `/content/${'ab'.repeat(32)}i0`;
  const meta = new CBORGenerator({ collectionName: 'C', useRecursiveImages: true }).generateMetadata(1, traits, { image });
  assert.equal(meta.image, image);
});

test('Tag 5 vbytes include a 2-byte tag push on every 520-byte chunk', () => {
  for (const n of [0, 1, 75, 76, 255, 256, 520, 521, 1040]) {
    assert.equal(chunkedTagScriptBytes(n), propertiesFieldBytes(n), String(n));
    assert.equal(estimateAddedVbytes(n), Math.ceil(propertiesFieldBytes(n) / 4), String(n));
  }
  // 520-byte chunk: 2-byte tag push + 3-byte OP_PUSHDATA2 header + 520 = 525.
  assert.equal(chunkedTagScriptBytes(520), 525);
  assert.equal(estimateAddedVbytes(520), 132);
  // 521 bytes is two chunks: 525 + 2-byte tag + 1-byte push header + 1 data byte = 529.
  assert.equal(chunkedTagScriptBytes(521), 529);
  assert.equal(estimateAddedVbytes(521), 133);
  assert.equal(estimateAddedVbytes(0), 0);
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
