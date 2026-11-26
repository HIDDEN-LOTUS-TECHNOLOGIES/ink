import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { assertBody, buildEnvelope, contentTypeForFile, createKey, POSTAGE, preparePlan, textBody } from '../src/inscribe.js';

test('contentTypeForFile prefers a browser type when one is present', () => {
  assert.equal(contentTypeForFile('file.svg', 'image/svg+xml'), 'image/svg+xml');
  assert.equal(contentTypeForFile('note.html', ' application/octet-stream '), 'application/octet-stream');
});

test('contentTypeForFile maps the extension when the browser type is empty', () => {
  const cases = [
    ['note.html', 'text/html'],
    ['page.htm', 'text/html'],
    ['icon.svg', 'image/svg+xml'],
    ['meta.json', 'application/json'],
    ['clip.mp3', 'audio/mpeg'],
    ['clip.mp4', 'video/mp4'],
    ['note.txt', 'text/plain'],
    ['style.css', 'text/css'],
    ['app.js', 'text/javascript'],
    ['pic.png', 'image/png'],
    ['pic.jpg', 'image/jpeg'],
    ['pic.jpeg', 'image/jpeg'],
    ['pic.GIF', 'image/gif'],
    ['pic.webp', 'image/webp'],
    ['doc.pdf', 'application/pdf'],
    ['sound.wav', 'audio/wav'],
    ['sound.ogg', 'audio/ogg'],
    ['clip.webm', 'video/webm'],
  ];
  for (const [name, type] of cases) {
    assert.equal(contentTypeForFile(name, ''), type, name);
    assert.equal(contentTypeForFile(name, undefined), type, name);
  }
  assert.equal(contentTypeForFile('nested/dir/clip.MP4', '  '), 'video/mp4');
});

test('contentTypeForFile falls back when the extension is unknown', () => {
  assert.equal(contentTypeForFile('blob.bin', ''), 'application/octet-stream');
  assert.equal(contentTypeForFile('noext', ''), 'application/octet-stream');
  assert.equal(contentTypeForFile('', ''), 'application/octet-stream');
});

test('assertBody rejects an empty body and the reveal probe rejects an overweight body', () => {
  assert.equal(assertBody(new Uint8Array(50 * 1024 + 1)).length, 50 * 1024 + 1);
  assert.throws(() => assertBody(new Uint8Array(0)), /empty/);
  const reveal = createKey();
  assert.throws(
    () => preparePlan({
      body: new Uint8Array(397_172),
      contentType: 'image/png',
      revealPriv: reveal.priv,
      dest: 'tb1pearq2jvuq9kzfdmrt59drxzxh0mtmz60wt26kndm6aw39zcdvjuq8xhjpd',
      feeRate: 1,
    }),
    /400,000/,
  );
});

test('wallet notes omit the shut-down Magic Eden wallet', () => {
  const doc = readFileSync(new URL('../WALLETS.md', import.meta.url), 'utf8');
  assert.match(doc, /Magic Eden wallet shut down on 1 May 2026/);
  assert.match(doc, /## Leather, OKX, Phantom/);
  assert.doesNotMatch(doc, /### Magic Eden|window\.magicEden|docs-wallet\.magiceden\.io/);
});

test('lab postage defaults to 10,000 sats and 546 is not that default', () => {
  assert.equal(POSTAGE, 10_000n);
  assert.notEqual(POSTAGE, 546n);
});

test('buildEnvelope accepts the widened content types', () => {
  const reveal = createKey();
  const body = textBody('signet');
  for (const contentType of ['text/html', 'text/css', 'image/svg+xml', 'application/json', 'application/pdf', 'audio/mpeg', 'video/mp4']) {
    const env = buildEnvelope({ body, contentType, revealPriv: reveal.priv });
    assert.equal(env.contentType, contentType);
    assert.equal(env.inscription.body.length, body.length);
  }
});
