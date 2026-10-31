import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeParentTag3, decodeParentTag3Hex, encodeParentTag3, isValidInscriptionId, parentTag3Hex, parseInscriptionId } from '../parentInscription.js';

const id = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1fi0';

test('parses and validates inscription ids', () => {
  assert.deepEqual(parseInscriptionId(id), { txid: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f', index: 0 });
  assert.equal(parseInscriptionId('nope'), null);
  assert.equal(isValidInscriptionId(id), true);
  assert.equal(isValidInscriptionId('abc'), false);
});

test('encodes Tag 3 and decodes it back', () => {
  const hex = parentTag3Hex(id);
  assert.equal(hex, '1f1e1d1c1b1a191817161514131211100f0e0d0c0b0a09080706050403020100');
  assert.equal(decodeParentTag3Hex(hex), id);
  const withIndex = `${id.slice(0, -1)}2`;
  assert.equal(decodeParentTag3(encodeParentTag3(withIndex)), withIndex);
});
