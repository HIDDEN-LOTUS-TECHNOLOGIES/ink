import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildEnvelope, contentTypeForFile as signetContentType, createKey, preparePlan, textBody } from '../../lab/signet/src/inscribe.js';
import { contentFromFile, contentFromText, contentTypeForFile } from '../content.js';
import { feesUrl, loadMarket, mempoolUrl, parseRecommendedFees, parseUsdPrice, pricesUrl } from '../rates.js';
import {
  buildEnvelopeScript,
  COMMIT_VBYTES,
  estimateInscription,
  POSTAGE_DEFAULT,
  totalCost,
} from '../size.js';

// Signet taproot destination, so the lab's reveal probe uses a P2TR output.
const SIGNET_P2TR = 'tb1pearq2jvuq9kzfdmrt59drxzxh0mtmz60wt26kndm6aw39zcdvjuq8xhjpd';

function revealVsize(body, contentType) {
  const reveal = createKey();
  const plan = preparePlan({
    body,
    contentType,
    revealPriv: reveal.priv,
    dest: SIGNET_P2TR,
    feeRate: 1,
  });
  return plan.revealVsize;
}

function sameEnvelopeTail(body, contentType) {
  const reveal = createKey();
  const real = buildEnvelope({ body, contentType, revealPriv: reveal.priv }).leaf.script;
  const built = buildEnvelopeScript(body, contentType);
  assert.equal(built[0], 0x20);
  assert.equal(real[0], 0x20);
  assert.equal(built.length, real.length);
  assert.deepEqual(built.subarray(33), real.subarray(33));
}

test('small text inscription vbytes, hand-checked', () => {
  // "hi" as text/plain;charset=utf-8 (24 bytes).
  // Script = 33 (key push) + 1 CHECKSIG + 1 OP_0 + 1 OP_IF + 4 "ord"
  //   + 2 tag + 25 content type + 1 OP_0 + 3 body + 1 ENDIF = 72.
  // Witness = 1 + 65 + 1 + 72 + 34 = 173. Script is under 253, so its length is one byte.
  // Weight = 378 + 173 = 551. Reveal vbytes = ceil(551 / 4) = 138.
  // Commit vbytes = ceil(10.5 + 57.5 + 43 + 43) = 154.
  const body = new TextEncoder().encode('hi');
  const contentType = 'text/plain;charset=utf-8';
  const measured = estimateInscription({ body, contentType });
  assert.equal(measured.bodyBytes, 2);
  assert.equal(measured.contentType, contentType);
  assert.equal(measured.scriptBytes, 72);
  assert.equal(measured.witnessBytes, 173);
  assert.equal(measured.revealWeight, 551);
  assert.equal(measured.revealVbytes, 138);
  assert.equal(measured.commitVbytes, 154);
  assert.equal(COMMIT_VBYTES, 154);
  assert.equal(measured.totalVbytes, 292);
  assert.equal(measured.postage, 546);
  assert.equal(measured.revealVbytes, revealVsize(body, contentType));
  sameEnvelopeTail(body, contentType);
  assert.deepEqual(body, textBody('hi'));

  const cost = totalCost(measured, 1.1);
  assert.equal(cost.commitFee, 170);
  assert.equal(cost.revealFee, 152);
  assert.equal(cost.fee, 322);
  assert.equal(cost.total, 868);
});

test('100 KB image-sized body vbytes, hand-checked', () => {
  // 102400 body bytes, content type image/png (9 bytes).
  // 196 chunks of 520 and one chunk of 480.
  // Script = 54 fixed (including the image/png push) + 196 * 523 + 483 = 103045.
  // 103045 is past 65535, so the witness length prefix is 5 bytes.
  // Witness = 1 + 65 + 5 + 103045 + 34 = 103150.
  // Weight = 378 + 103150 = 103528. Reveal vbytes = ceil(103528 / 4) = 25882.
  const body = new Uint8Array(100 * 1024);
  const contentType = 'image/png';
  const measured = estimateInscription({ body, contentType });
  assert.equal(measured.bodyBytes, 102400);
  assert.equal(measured.scriptBytes, 103045);
  assert.equal(measured.witnessBytes, 103150);
  assert.equal(measured.revealWeight, 103528);
  assert.equal(measured.revealVbytes, 25882);
  assert.equal(measured.commitVbytes, 154);
  assert.equal(measured.totalVbytes, 26036);
  assert.equal(measured.revealVbytes, revealVsize(body, contentType));
  sameEnvelopeTail(body, contentType);

  const cost = totalCost(measured, 2);
  assert.equal(cost.commitFee, 308);
  assert.equal(cost.revealFee, 51764);
  assert.equal(cost.fee, 52072);
  assert.equal(cost.total, 52618);
});

test('postage changes sats and not virtual size', () => {
  const body = new TextEncoder().encode('hi');
  const low = estimateInscription({ body, contentType: 'text/plain;charset=utf-8', postage: 546 });
  const high = estimateInscription({ body, contentType: 'text/plain;charset=utf-8', postage: 1000 });
  assert.equal(POSTAGE_DEFAULT, 546);
  assert.equal(low.revealVbytes, high.revealVbytes);
  assert.equal(low.totalVbytes, high.totalVbytes);
  assert.equal(totalCost(low, 3).total + 454, totalCost(high, 3).total);
});

test('matches two real mainnet reveal vsizes', () => {
  // mempool.space, 1 P2TR input, 1 P2TR output, 64-byte signature, 33-byte control block.
  // 847e537a98138652ecc7121b87fd13a1c057bcb38812bbf4c885a3e10dc0d2dci0
  // image/png, 5709 body bytes, weight 6277, vsize 1570.
  const png = estimateInscription({ body: new Uint8Array(5709), contentType: 'image/png' });
  assert.equal(png.scriptBytes, 5796);
  assert.equal(png.revealVbytes, 1570);
  // f51c403a011854142c59c7fdcea9dc2f6dd95b997ac1af071ffc1983acadaf98i0
  // text/html;charset=utf-8, 2109 body bytes, weight 2671, vsize 668.
  const html = estimateInscription({
    body: new Uint8Array(2109),
    contentType: 'text/html;charset=utf-8',
  });
  assert.equal(html.scriptBytes, 2190);
  assert.equal(html.revealVbytes, 668);
});

test('content type selection matches the signet lab', () => {
  assert.equal(contentTypeForFile, signetContentType);
  assert.equal(contentTypeForFile('pic.png', ''), 'image/png');
  assert.equal(contentTypeForFile('pic.png', 'image/png'), 'image/png');
  assert.equal(contentTypeForFile('note.html', ''), 'text/html');
  assert.equal(contentTypeForFile('note.txt', ' text/plain;charset=utf-8 '), 'text/plain;charset=utf-8');
  assert.equal(contentTypeForFile('blob.bin', ''), 'application/octet-stream');
  assert.equal(contentTypeForFile('noext', ''), 'application/octet-stream');
  assert.equal(contentTypeForFile('nested/dir/clip.MP4', '  '), 'video/mp4');

  const fromText = contentFromText('Hello');
  assert.equal(fromText.contentType, 'text/plain;charset=utf-8');
  assert.deepEqual(fromText.body, textBody('Hello'));

  const bytes = new Uint8Array([1, 2, 3, 4]);
  const fromFile = contentFromFile({ name: 'art.PNG', type: '', bytes, size: bytes.length });
  assert.equal(fromFile.contentType, 'image/png');
  const typed = contentFromFile({ name: 'art.png', type: 'image/webp', bytes, size: bytes.length });
  assert.equal(typed.contentType, 'image/webp');
});

test('content type push headers match the builder', () => {
  const body = new Uint8Array([7]);
  sameEnvelopeTail(body, 'a'.repeat(75));
  sameEnvelopeTail(body, 'a'.repeat(76));
  sameEnvelopeTail(new Uint8Array(520), 'image/png');
  sameEnvelopeTail(new Uint8Array(521), 'image/png');
  sameEnvelopeTail(new TextEncoder().encode('héllo'), 'text/plain;charset=utf-8');
});

test('refuses an empty body, a body past 390 KB, and a long content type', () => {
  assert.throws(() => contentFromText(''), /Choose a file or type some text/);
  assert.throws(() => estimateInscription({ body: new Uint8Array(0), contentType: 'text/plain' }), /empty/);
  const tooBig = 390 * 1024 + 1;
  assert.throws(
    () => contentFromFile({ name: 'a.bin', type: '', bytes: new Uint8Array(tooBig), size: tooBig }),
    { message: `File is ${tooBig} bytes. The limit is ${tooBig - 1} bytes.` },
  );
  assert.throws(() => estimateInscription({ body: new Uint8Array([1]), contentType: 'a'.repeat(129) }), /too long/);
});

test('market reads stay on the two mempool.space GET paths', () => {
  assert.equal(feesUrl(), 'https://mempool.space/api/v1/fees/recommended');
  assert.equal(pricesUrl(), 'https://mempool.space/api/v1/prices');
  assert.throws(() => mempoolUrl('https://example.com/api/v1/prices'), /Refused/);
  assert.throws(() => mempoolUrl('/signet/api/v1/fees/recommended'), /Refused/);
  assert.throws(() => mempoolUrl('/api/tx/aa'), /Refused/);
});

test('prices are optional and fees still parse when the price body is bad', async () => {
  const fees = { fastestFee: 8, halfHourFee: 5, hourFee: 3, economyFee: 1, minimumFee: 1 };
  assert.deepEqual(parseRecommendedFees(fees), fees);
  assert.equal(parseRecommendedFees({ fastestFee: 1 }), null);
  assert.equal(parseUsdPrice({ USD: 74527 }), 74527);
  assert.equal(parseUsdPrice({ USD: 0 }), null);
  assert.equal(parseUsdPrice(null), null);

  const market = await loadMarket(async (url) => {
    if (url.endsWith('/prices')) throw new Error('down');
    return { ok: true, async text() { return JSON.stringify(fees); } };
  });
  assert.deepEqual(market.fees, fees);
  assert.equal(market.usd, null);

  const silent = await loadMarket(async () => ({ ok: false, async text() { return ''; } }));
  assert.equal(silent.fees, null);
  assert.equal(silent.usd, null);
});

test('the page is indexable, talks only to mempool.space, and does not sign', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const js = readFileSync(new URL('../estimate.js', import.meta.url), 'utf8');
  const size = readFileSync(new URL('../size.js', import.meta.url), 'utf8');
  assert.match(html, /Estimate only\. Nothing is signed or broadcast\./);
  assert.match(html, /connect-src https:\/\/mempool\.space/);
  assert.match(html, /href="\/"/);
  assert.doesNotMatch(html, /noindex/i);
  assert.doesNotMatch(html, /innerHTML/);
  assert.doesNotMatch(js, /innerHTML|from ['"]@scure|from ['"]micro-ordinals|localStorage/);
  assert.doesNotMatch(size, /innerHTML|from ['"]@scure|from ['"]micro-ordinals/);
});
