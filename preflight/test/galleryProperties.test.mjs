import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { MAX_BODY } from '../../estimate/content.js';
import { choosePropertiesBytes, encodeProperties, estimateGallery, ORD_VERSION, PAYLOAD_CEILING } from '../galleryProperties.js';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

// Bytes built by the encode() test in ord 0.29.1 src/properties.rs.
// inscription_id(n) is n repeated as the txid nibble and index n.
// The test's manual minicbor Encoder output is what to_inline_cbor must equal.
const ORD_ENCODE_INLINE = 'a20083a2005820000000000000000000000000000000000000000000000000000000000000000001a10063626172a200582111111111111111111111111111111111111111111111111111111111111111110101a2006362617a01a1636162636378797aa100582122222222222222222222222222222222222222222222222222222222222222220201a20063666f6f01a16568656c6c6ff5';

function inscriptionValue(n) {
  const nib = n.toString(16);
  const tx = new Uint8Array(32).fill(Number.parseInt(nib + nib, 16));
  if (n === 0) return { idBytes: tx, index: 0 };
  const out = new Uint8Array(33);
  out.set(tx);
  out[32] = n;
  return { idBytes: out, index: n };
}

function hex(bytes) {
  return Buffer.from(bytes).toString('hex');
}

test('inline CBOR matches ord 0.29.1 properties.rs encode()', () => {
  const a = inscriptionValue(0);
  const b = inscriptionValue(1);
  const c = inscriptionValue(2);
  const encoded = encodeProperties({
    items: [
      { ...a, title: 'bar', traits: [] },
      { ...b, title: 'baz', traits: [['abc', 'xyz']] },
      { ...c, title: null, traits: [] },
    ],
    title: 'foo',
    traits: [['hello', true]],
  });
  assert.equal(hex(encoded.inline), ORD_ENCODE_INLINE);
  assert.equal(ORD_VERSION, '0.29.1');
});

test('trait scalars use ord CBOR and a reversed txid matches Tag 3 bytes', () => {
  const id = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1fi0';
  const zeros = new Uint8Array(32);
  const cases = [
    [false, 'f4'],
    [true, 'f5'],
    [null, 'f6'],
    [0, '00'],
    [1, '01'],
    [24, '1818'],
    [256, '190100'],
    [-1, '20'],
    [-25, '3818'],
    ['foo', '63666f6f'],
  ];
  for (const [value, tail] of cases) {
    const encoded = encodeProperties({
      items: [{ idBytes: zeros, index: 0, title: null, traits: [['n', value]] }],
    });
    assert.equal(hex(encoded.inline).endsWith(tail), true, String(value));
  }
  const estimate = estimateGallery([{ id, name: 'x', t: {} }], { compress: null });
  assert.equal(hex(estimate.selected.bytes), 'a10081a20058201f1e1d1c1b1a191817161514131211100f0e0d0c0b0a0908070605040302010001a1006178');
  assert.equal(estimate.selected.encoding, 'inline');
});

test('packed encoding wins for many index-zero ids and inline wins for one nonzero index', () => {
  const many = [];
  for (let i = 0; i < 10; i++) {
    const idBytes = new Uint8Array(32);
    idBytes[0] = i;
    many.push({ idBytes, index: 0, title: null, traits: [] });
  }
  const packedCase = encodeProperties({ items: many });
  assert.ok(packedCase.packed.length < packedCase.inline.length);
  const choice = choosePropertiesBytes(packedCase.inline, packedCase.packed, null);
  assert.equal(choice.raw.encoding, 'packed');

  const nonzero = new Uint8Array(33);
  nonzero[32] = 5;
  const one = encodeProperties({ items: [{ idBytes: nonzero, index: 5, title: null, traits: [] }] });
  assert.equal(hex(one.inline), `a10081a1005821${'00'.repeat(32)}05`);
  assert.equal(hex(one.packed), `a20081a10205025820${'00'.repeat(32)}`);
  assert.ok(one.inline.length < one.packed.length);
  assert.equal(choosePropertiesBytes(one.inline, one.packed, null).raw.encoding, 'inline');
});

test('equal lengths keep the inline candidate', () => {
  const choice = choosePropertiesBytes(Uint8Array.of(1, 2), Uint8Array.of(3, 4), null);
  assert.equal(choice.raw.encoding, 'inline');
  assert.equal(choice.chosen.compressed, false);
});

test('compression ratio uses integer division and the 4,000,000 byte cap', () => {
  const raw = new Uint8Array(100);
  const over = choosePropertiesBytes(raw, null, () => new Uint8Array(3));
  assert.equal(over.compressError, 'ratio');
  assert.equal(over.chosen.compressed, false);
  const under = choosePropertiesBytes(raw, null, () => new Uint8Array(4));
  assert.equal(under.compressError, null);
  assert.equal(under.chosen.compressed, true);
  assert.equal(under.chosen.bytes.length, 4);
  let called = false;
  const huge = choosePropertiesBytes(new Uint8Array(4_000_001), null, () => { called = true; return new Uint8Array(10); });
  assert.equal(huge.compressError, 'over-4mb');
  assert.equal(called, false);
});

test('titles and traits change the size, and bad or duplicate ids are reported', () => {
  const id = `${'ab'.repeat(32)}i0`;
  const other = `${'cd'.repeat(32)}i1`;
  const data = [
    { id, name: 'Alpha', t: { Hat: 'cap', Count: 2, Weird: 1.5 } },
    { id, name: 'Alpha', t: { Hat: 'cap' } },
    { id: 'not-an-id', name: 'Beta', t: { Hat: 'cap' } },
    { id: other, name: 'Gamma', t: { Hat: false, Missing: null } },
  ];
  const estimate = estimateGallery(data, { compress: null });
  assert.equal(estimate.ordVersion, ORD_VERSION);
  assert.equal(estimate.limit, PAYLOAD_CEILING);
  assert.equal(estimate.itemCount, 3);
  assert.equal(estimate.leftOut, 1);
  assert.ok(estimate.idIssues.some((row) => /duplicate/i.test(row.message)));
  assert.ok(estimate.idIssues.some((row) => /invalid/i.test(row.message)));
  assert.equal(estimate.traitNotes.length, 1);
  assert.equal(estimate.traitNotes[0].name, 'Weird');
  assert.ok(estimate.titlesDropped.rawBytes < estimate.selected.rawBytes);
  assert.ok(estimate.traitsDropped.rawBytes < estimate.selected.rawBytes);
  assert.ok(estimate.selected.rawBytes < PAYLOAD_CEILING);
});

test('payload ceiling is the shared 399,360 byte cap', () => {
  assert.equal(MAX_BODY, 399_360);
  assert.equal(PAYLOAD_CEILING, MAX_BODY);
  assert.equal(PAYLOAD_CEILING, 390 * 1024);
  const id = `${'ab'.repeat(32)}i0`;
  const estimate = estimateGallery([{ id, name: 'a', t: {} }], { compress: null });
  assert.equal(estimate.limit, 399_360);
  const sources = read('preflight/galleryProperties.js') + read('preflight/preflight.js');
  assert.match(sources, /Payload ceiling/);
  assert.match(read('preflight/preflight.js'), /--no-limit/);
  assert.match(read('preflight/preflight.js'), /400,000 weight units/);
  assert.doesNotMatch(sources, /409,?600/);
  assert.doesNotMatch(sources, /400 KB standard tx limit/);
  assert.doesNotMatch(sources, /STANDARD_TX_BYTES/);
});

test('OPIUM brotli figure stays the labeled conservative sample', () => {
  const data = JSON.parse(read('data/opium.json'));
  const estimate = estimateGallery(data);
  assert.equal(estimate.itemCount, 777);
  assert.equal(estimate.selected.compressedBytes, 39_618);
  assert.equal(estimate.titlesDropped.compressedBytes, 37_037);
  const script = read('preflight/preflight.js');
  const bias = 'can run up to ~15% high (about 12% on the OPIUM sample)';
  assert.equal(script.split(bias).length - 1, 4);
  assert.equal(read('preflight/brotli.js').includes(bias), true);
  assert.doesNotMatch(script + read('preflight/brotli.js'), /about 10% high/);
  assert.match(script, /39,618 bytes against ord's 35,258/);
  assert.match(script, /37,037 against 33,309 with titles dropped/);
});

test('brotli encode.js loads on the first estimate', () => {
  const script = read('preflight/preflight.js');
  const html = read('preflight/index.html');
  const staticImports = [...script.matchAll(/^\s*import\s+[^;]*from\s+['"]([^'"]+)['"]/gm)].map((match) => match[1]);
  assert.deepEqual(staticImports.filter((spec) => /brotli|galleryProperties|encode\.js/.test(spec)), []);
  assert.match(script, /function loadGallery\(\)/);
  const loadGallery = script.slice(script.indexOf('function loadGallery'));
  assert.match(loadGallery, /import\(\s*['"]\.\/galleryProperties\.js['"]\s*\)/);
  assert.doesNotMatch(script.slice(0, script.indexOf('function loadGallery')), /import\(/);
  assert.match(script, /Loading estimator/);
  assert.match(html, /script type="module" src="\.\/preflight\.js"/);
  assert.doesNotMatch(html, /brotli-lib\/encode\.js/);
  assert.match(read('preflight/galleryProperties.js'), /from '\.\/brotli\.js'/);
  assert.match(read('preflight/brotli.js'), /from '\.\/vendor\/brotli-lib\/encode\.js'/);
});

test('a repeated title compresses and trips the 30:1 cap', () => {
  const id = `${'11'.repeat(32)}i0`;
  const estimate = estimateGallery([{ id, name: 'a'.repeat(10000), t: {} }]);
  assert.equal(estimate.selected.compressError, 'ratio');
  assert.equal(estimate.selected.compressedBytes, null);
  assert.ok(estimate.selected.rawBytes > 10000);
  assert.ok(estimate.titlesDropped.rawBytes < estimate.selected.rawBytes);
  assert.equal(estimate.titlesDropped.compressError, null);
});

test('preflight page is unlinked, noindex, and does not fetch or loosen CSP', () => {
  const html = read('preflight/index.html');
  const script = read('preflight/preflight.js');
  const home = read('index.html');
  const missing = read('404.html');
  assert.match(html, /name="robots" content="noindex"/);
  assert.match(html, /Estimate only\. Nothing is signed, broadcast or submitted\./);
  assert.match(html, /ord 0\.29\.1/);
  assert.match(html, /connect-src 'self'/);
  assert.match(html, /class="skip" href="#content"/);
  assert.match(html, /id="content"/);
  assert.doesNotMatch(html, /https:\/\/(?!ink\.hiddenlotus\.tech|hiddenlotus\.tech|x\.com|ordinals\.com)/);
  assert.doesNotMatch(html, /\/lab\/signet\//);
  assert.doesNotMatch(script, /fetch\s*\(/);
  assert.doesNotMatch(home, /\/preflight\//);
  assert.doesNotMatch(missing, /\/preflight\//);
  assert.doesNotMatch(read('CNAME') + home, /open source/i);
});
