import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeParentTag3, decodeParentTag3Hex, encodeParentTag3, isValidInscriptionId, parentTag3Hex, parseInscriptionId } from '../parentInscription.js';

const id = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1fi0';

test('parses and validates inscription ids', () => {
  assert.deepEqual(parseInscriptionId(id), { txid: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f', index: 0, id });
  assert.equal(parseInscriptionId('nope'), null);
  assert.equal(isValidInscriptionId(id), true);
  assert.equal(isValidInscriptionId('abc'), false);
  assert.equal(isValidInscriptionId(id.toUpperCase()), true);
  assert.equal(parentTag3Hex(id.toUpperCase()), parentTag3Hex(id));
  assert.equal(isValidInscriptionId(`${id.slice(0, -1)}00`), false);
  assert.equal(isValidInscriptionId(`${id.slice(0, -1)}4294967295`), true);
  assert.equal(isValidInscriptionId(`${id.slice(0, -1)}4294967296`), false);
  assert.throws(() => encodeParentTag3(`${id.slice(0, -1)}4294967296`), /Invalid parent inscription ID/);
});

test('Tag 3 rejects an index above 4294967295 and a leading zero', () => {
  const txid = id.slice(0, 64);
  assert.equal(parseInscriptionId(`${txid}i01`), null);
  assert.equal(isValidInscriptionId(`${txid}i01`), false);
  assert.equal(isValidInscriptionId(`${txid}i0`), true);
  assert.equal(parseInscriptionId(`${txid}i4294967295`).index, 4294967295);
  assert.equal(isValidInscriptionId(`${txid}i4294967296`), false);
  assert.throws(() => encodeParentTag3(`${txid}i01`), /Invalid parent inscription ID/);
  assert.throws(() => encodeParentTag3(`${txid}i4294967296`), /Invalid parent inscription ID/);
  const encoded = encodeParentTag3(`${txid}i4294967295`);
  assert.equal(encoded.length, 36);
  assert.equal(decodeParentTag3(encoded), `${txid}i4294967295`);
});

test('encodes Tag 3 and decodes it back', () => {
  const hex = parentTag3Hex(id);
  assert.equal(hex, '1f1e1d1c1b1a191817161514131211100f0e0d0c0b0a09080706050403020100');
  assert.equal(decodeParentTag3Hex(hex), id);
  const withIndex = `${id.slice(0, -1)}2`;
  assert.equal(decodeParentTag3(encodeParentTag3(withIndex)), withIndex);
});
