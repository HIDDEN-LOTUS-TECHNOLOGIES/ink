import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidInscriptionId, parseInscriptionId } from '../inscriptionId.js';

const id = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1fi0';
const txid = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';

test('parses a canonical inscription id', () => {
  assert.deepEqual(parseInscriptionId(id), { txid, index: 0, id });
  assert.equal(isValidInscriptionId(id), true);
  assert.equal(parseInscriptionId(`  ${id.toUpperCase()}  `).id, id);
  assert.equal(parseInscriptionId(`"${id}"`).id, id);
  assert.equal(parseInscriptionId(`${txid}i00`).id, id);
  assert.equal(parseInscriptionId(`${txid}i12`).index, 12);
});

test('accepts an ordinals.com url and nothing else', () => {
  assert.equal(parseInscriptionId(`https://ordinals.com/inscription/${id}`).id, id);
  assert.equal(parseInscriptionId(`https://ordinals.com/content/${id.toUpperCase()}`).id, id);
  assert.equal(parseInscriptionId(`https://www.ordinals.com/r/inscription/${id}?sat=1`).id, id);
  assert.equal(parseInscriptionId(`ordinals.com/inscription/${id}`).id, id);
  assert.equal(parseInscriptionId(`https://ordinals.com/r/metadata/${txid}i2/extra`).id, `${txid}i2`);
  assert.equal(parseInscriptionId(`https://example.com/inscription/${id}`), null);
  assert.equal(parseInscriptionId(`https://ordinals.com.evil/inscription/${id}`), null);
  assert.equal(parseInscriptionId(`https://evilordinals.com/inscription/${id}`), null);
  assert.equal(parseInscriptionId(`javascript:https://ordinals.com/inscription/${id}`), null);
});

test('rejects ids that are not txid i index', () => {
  for (const bad of ['', 'nope', txid, `${txid}i`, `${id}extra`, `${txid}i-1`, 'i0', `${'g'.repeat(64)}i0`, `${txid}i${0x100000000}`]) {
    assert.equal(parseInscriptionId(bad), null, bad);
    assert.equal(isValidInscriptionId(bad), false);
  }
});
