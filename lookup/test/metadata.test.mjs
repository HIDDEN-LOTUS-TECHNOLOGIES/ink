import assert from 'node:assert/strict';
import test from 'node:test';
import { encodeCbor } from '../../kit/cbor.js';
import { decodeCbor } from '../cbor.js';
import { decodeMetadataHex, traitsFromValue } from '../metadata.js';

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

test('round-trips values the kit encoder writes', () => {
  const value = {
    name: 'N',
    attributes: [{ trait_type: 'Hat', value: 'cap' }],
    count: 3,
    n: -5,
    f: 1.5,
    ok: false,
    empty: null,
    bytes: new Uint8Array([1, 2]),
  };
  assert.deepEqual(decodeCbor(encodeCbor(value)), value);
});

test('unwraps tags, joins indefinite text, and keeps map keys off the prototype', () => {
  assert.equal(decodeCbor(hexToBytes('d9d9f763616263')), 'abc');
  assert.equal(decodeCbor(hexToBytes('7f63616263ff')), 'abc');
  assert.deepEqual(decodeCbor(hexToBytes('9f01ff')), [1]);
  assert.equal(decodeCbor(hexToBytes('f93c00')), 1);
  const tagged = decodeCbor(hexToBytes('a1695f5f70726f746f5f5f6178'));
  assert.equal(Object.getOwnPropertyDescriptor(tagged, '__proto__').value, 'x');
  assert.equal(Object.prototype.polluted, undefined);
  assert.throws(() => decodeCbor(hexToBytes('f6f6')), /consume/);
  assert.throws(() => decodeCbor(hexToBytes('63')), /past the end/);
  assert.throws(() => decodeCbor(new Uint8Array()), /past the end/);
});

test('decodes metadata hex into attribute traits', () => {
  const meta = {
    name: 'Puppet',
    description: 'A puppet',
    image: 'recursive://collection-layers',
    attributes: [
      { trait_type: 'Hat', value: 'cap' },
      { trait_type: 'Count', value: 2 },
      { trait_type: '', value: 'skip' },
    ],
  };
  const decoded = traitsFromValue(decodeMetadataHex(Buffer.from(encodeCbor(meta)).toString('hex')));
  assert.equal(decoded.name, 'Puppet');
  assert.equal(decoded.description, 'A puppet');
  assert.deepEqual(decoded.traits, [
    { trait: 'Hat', value: 'cap' },
    { trait: 'Count', value: '2' },
  ]);
  assert.equal(decodeMetadataHex(''), null);
  assert.equal(decodeMetadataHex('0x'), null);
  assert.throws(() => decodeMetadataHex('abc'), /hex/);
  assert.throws(() => decodeMetadataHex('zz'), /hex/);
});

test('reads a flat trait map when there is no attributes array', () => {
  const decoded = traitsFromValue({ name: 'N', Hat: 'cap', attributes: { Eyes: 'green' } });
  assert.equal(decoded.name, 'N');
  assert.deepEqual(decoded.traits, [{ trait: 'Eyes', value: 'green' }]);
  assert.deepEqual(traitsFromValue({ name: 'N', Hat: 'cap' }).traits, [{ trait: 'Hat', value: 'cap' }]);
});

// Hex CBOR from the ordinals recursive-endpoint docs for the FUN! parent.
const FUN_METADATA_HEX = 'ac6c50484f544f475241504845526a5041524b4552204441596643414d4552416c43414e4f4e20454f532d31566446494c4d6f4b4f44414b20454b54415220313030644c454e53781a5a4549535320504c414e415220542a2038354d4d20462f312e346d5348555454455220535045454465312f31323568415045525455524563462f38664d4f44454c5318646650484f544f531903e8684c4f434154494f4e774c4f5320414e47454c45532c2043414c49464f524e49416443524557a36a415353495354414e4345826e41524941532042555244454c4c49684e4153204e495858664d414b45555087754544454e2053594d4f4e45204c415454414e5a494f6a4d494d49204d455945526e53414d414e544841204c455052456f4c4953455454452053414e54414e416e4a45535349434120564552474f4e63504f4e724d415941204e414b415241205352554f4348644841495283694a414b4920494348556c4a4f43454c594e2056454741724a4546464552534f4e2054414e475241444966504154524f4e6e434153455920524f4441524d4f52674c4943454e534563434330';

test('decodes the documented FUN! parent metadata into traits', () => {
  const traits = Object.fromEntries(traitsFromValue(decodeMetadataHex(FUN_METADATA_HEX)).traits.map((row) => [row.trait, row.value]));
  assert.equal(traits.PHOTOGRAPHER, 'PARKER DAY');
  assert.equal(traits.CAMERA, 'CANON EOS-1V');
  assert.equal(traits.FILM, 'KODAK EKTAR 100');
  assert.equal(traits.LENS, 'ZEISS PLANAR T* 85MM F/1.4');
  assert.equal(traits['SHUTTER SPEED'], '1/125');
  assert.equal(traits.APERTURE, 'F/8');
  assert.equal(traits.MODELS, '100');
  assert.equal(traits.PHOTOS, '1000');
  assert.equal(traits.LOCATION, 'LOS ANGELES, CALIFORNIA');
  assert.match(traits.CREW, /ARIAS BURDELL/);
  assert.match(traits.CREW, /EDEN/);
});
