import assert from 'node:assert/strict';
import test from 'node:test';
import { MAX_BODY, assertBody, buildEnvelope, contentTypeForFile, createKey, textBody } from '../src/inscribe.js';

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

test('MAX_BODY is 390 KB and assertBody enforces it', () => {
  assert.equal(MAX_BODY, 390 * 1024);
  assert.equal(assertBody(new Uint8Array(50 * 1024 + 1)).length, 50 * 1024 + 1);
  assert.equal(assertBody(new Uint8Array(MAX_BODY)).length, MAX_BODY);
  assert.throws(
    () => assertBody(new Uint8Array(MAX_BODY + 1)),
    { message: `Content is ${MAX_BODY + 1} bytes. The limit is ${MAX_BODY} bytes.` },
  );
  assert.throws(() => assertBody(new Uint8Array(0)), /empty/);
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
