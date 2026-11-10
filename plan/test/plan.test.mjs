import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { MAX_BODY } from '../../estimate/content.js';
import { estimateInscription, feeFor, totalCost } from '../../estimate/size.js';
import { batchCost, planBatch } from '../batch.js';

// Hand-checked cases from estimate/test/estimate.test.mjs.
// "hi" as text/plain;charset=utf-8: script 72, witness 173, reveal 138, commit 154, total 292.
// At 1.1 sat/vB the file costs 868 sats, postage included.
// 102400 image/png bytes: script 103045, witness 103150, reveal 25882, commit 154, total 26036.
// At 2 sat/vB that file costs 52618 sats, postage included.

function hiFile() {
  return {
    name: 'note.txt',
    type: 'text/plain;charset=utf-8',
    bytes: new TextEncoder().encode('hi'),
  };
}

function pngFile() {
  return {
    name: 'pixel.png',
    type: '',
    bytes: new Uint8Array(100 * 1024),
  };
}

test('batch totals equal the sum of the hand-checked per-file estimates', () => {
  const planned = planBatch([hiFile(), pngFile()]);
  assert.equal(planned.rejected.length, 0);
  assert.equal(planned.accepted.length, 2);

  const hi = planned.accepted[0];
  assert.equal(hi.filename, 'note.txt');
  assert.equal(hi.contentType, 'text/plain;charset=utf-8');
  assert.equal(hi.bodyBytes, 2);
  assert.equal(hi.scriptBytes, 72);
  assert.equal(hi.witnessBytes, 173);
  assert.equal(hi.commitVbytes, 154);
  assert.equal(hi.revealVbytes, 138);
  assert.equal(hi.totalVbytes, 292);
  assert.equal(hi.postage, 546);

  const png = planned.accepted[1];
  assert.equal(png.filename, 'pixel.png');
  assert.equal(png.contentType, 'image/png');
  assert.equal(png.bodyBytes, 102400);
  assert.equal(png.scriptBytes, 103045);
  assert.equal(png.witnessBytes, 103150);
  assert.equal(png.commitVbytes, 154);
  assert.equal(png.revealVbytes, 25882);
  assert.equal(png.totalVbytes, 26036);
  assert.equal(png.postage, 546);

  assert.equal(planned.totals.count, 2);
  assert.equal(planned.totals.bodyBytes, 102402);
  assert.equal(planned.totals.totalVbytes, 26328);
  assert.equal(planned.totals.postage, 1092);

  const hiAlone = estimateInscription({ body: hiFile().bytes, contentType: 'text/plain;charset=utf-8' });
  const pngAlone = estimateInscription({ body: pngFile().bytes, contentType: 'image/png' });
  assert.equal(planned.totals.bodyBytes, hiAlone.bodyBytes + pngAlone.bodyBytes);
  assert.equal(planned.totals.scriptBytes, hiAlone.scriptBytes + pngAlone.scriptBytes);
  assert.equal(planned.totals.witnessBytes, hiAlone.witnessBytes + pngAlone.witnessBytes);
  assert.equal(planned.totals.commitVbytes, hiAlone.commitVbytes + pngAlone.commitVbytes);
  assert.equal(planned.totals.revealVbytes, hiAlone.revealVbytes + pngAlone.revealVbytes);
  assert.equal(planned.totals.totalVbytes, hiAlone.totalVbytes + pngAlone.totalVbytes);

  assert.equal(totalCost(hiAlone, 1.1).total, 868);
  assert.equal(totalCost(pngAlone, 2).total, 52618);
  assert.equal(batchCost(planned.accepted, 1.1).total, totalCost(hiAlone, 1.1).total + totalCost(pngAlone, 1.1).total);
  assert.equal(batchCost(planned.accepted, 2).total, totalCost(hiAlone, 2).total + totalCost(pngAlone, 2).total);
  assert.equal(batchCost(planned.accepted, 2).postage, hiAlone.postage + pngAlone.postage);
});

test('a file over MAX_BODY is rejected and siblings still estimate', () => {
  const clean = planBatch([hiFile(), pngFile()]);
  const mixed = planBatch([
    hiFile(),
    { name: 'big.bin', type: '', size: MAX_BODY + 1, bytes: new Uint8Array(1) },
    { name: 'empty.txt', type: 'text/plain', bytes: new Uint8Array(0), size: 0 },
    pngFile(),
  ]);
  assert.equal(mixed.rejected.length, 2);
  assert.equal(mixed.rejected[0].filename, 'big.bin');
  assert.equal(mixed.rejected[0].bytes, MAX_BODY + 1);
  assert.equal(mixed.rejected[0].message, `File is ${MAX_BODY + 1} bytes. The limit is ${MAX_BODY} bytes.`);
  assert.equal(mixed.rejected[1].filename, 'empty.txt');
  assert.match(mixed.rejected[1].message, /empty/);
  assert.deepEqual(mixed.accepted, clean.accepted);
  assert.equal(mixed.totals.count, 2);
  assert.equal(mixed.totals.bodyBytes, clean.totals.bodyBytes);
  assert.equal(mixed.totals.totalVbytes, clean.totals.totalVbytes);
  assert.equal(batchCost(mixed.accepted, 2).total, batchCost(clean.accepted, 2).total);
});

test('fee math uses the same per-file ceil as estimate/size.js', () => {
  const planned = planBatch([hiFile(), pngFile()], { postage: 1000 });
  assert.equal(planned.totals.postage, 2000);
  assert.equal(planned.totals.totalVbytes, 26328);

  for (const rate of [1, 1.1, 2, 3.5]) {
    let commitFee = 0;
    let revealFee = 0;
    let total = 0;
    for (const row of planned.accepted) {
      const cost = totalCost(row, rate);
      assert.equal(cost.commitFee, feeFor(row.commitVbytes, rate));
      assert.equal(cost.revealFee, feeFor(row.revealVbytes, rate));
      assert.equal(cost.total, feeFor(row.commitVbytes, rate) + feeFor(row.revealVbytes, rate) + row.postage);
      commitFee += cost.commitFee;
      revealFee += cost.revealFee;
      total += cost.total;
    }
    const summed = batchCost(planned.accepted, rate);
    assert.equal(summed.commitFee, commitFee);
    assert.equal(summed.revealFee, revealFee);
    assert.equal(summed.total, total);
  }

  // 154 vbytes at 1.1 sat/vB is ceil(169.4) = 170 per commit.
  // ceil((154 + 154) × 1.1) is 339, one sat less than the two per-file fees.
  const commitVbytes = planned.accepted.reduce((sum, row) => sum + row.commitVbytes, 0);
  assert.equal(batchCost(planned.accepted, 1.1).commitFee, 340);
  assert.equal(feeFor(commitVbytes, 1.1), 339);
  assert.notEqual(batchCost(planned.accepted, 1.1).commitFee, feeFor(commitVbytes, 1.1));

  const low = planBatch([hiFile(), pngFile()], { postage: 546 });
  assert.equal(batchCost(planned.accepted, 3).total - batchCost(low.accepted, 3).total, 454 * 2);
  assert.equal(low.totals.totalVbytes, planned.totals.totalVbytes);
});

test('the page is indexable, talks only to mempool.space, and reuses the estimate modules', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const js = readFileSync(new URL('../plan.js', import.meta.url), 'utf8');
  const batch = readFileSync(new URL('../batch.js', import.meta.url), 'utf8');
  const csp = html.match(/Content-Security-Policy" content="([^"]+)"/)[1];

  assert.match(html, /Estimate only\. Nothing is signed or broadcast\./);
  assert.match(html, /<a href="\/">/);
  assert.match(html, /rel="canonical" href="https:\/\/ink\.hiddenlotus\.tech\/plan\/"/);
  assert.match(html, /property="og:url" content="https:\/\/ink\.hiddenlotus\.tech\/plan\/"/);
  assert.match(html, /property="og:image" content="https:\/\/ink\.hiddenlotus\.tech\/og\.png"/);
  assert.match(html, /property="og:title" content="INK batch inscription cost"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /type="file"/);
  assert.match(html, /multiple/);
  assert.match(html, /<script type="module" src="\.\/plan\.js"><\/script>/);
  assert.match(csp, /connect-src https:\/\/mempool\.space(;|$)/);
  assert.doesNotMatch(csp, /ordinals\.com|worker/i);
  assert.doesNotMatch(html, /noindex/i);
  assert.doesNotMatch(html, /innerHTML/);
  assert.match(js, /from '\.\/batch\.js'/);
  assert.match(js, /from '\.\.\/estimate\/content\.js'/);
  assert.match(js, /from '\.\.\/estimate\/rates\.js'/);
  assert.match(js, /from '\.\.\/estimate\/size\.js'/);
  assert.match(batch, /from '\.\.\/estimate\/content\.js'/);
  assert.match(batch, /from '\.\.\/estimate\/size\.js'/);
  assert.match(batch, /contentFromFile/);
  assert.match(batch, /estimateInscription/);
  assert.match(batch, /totalCost/);
  assert.doesNotMatch(js, /innerHTML|from ['"]@scure|from ['"]micro-ordinals|localStorage|new Worker/);
  assert.doesNotMatch(batch, /innerHTML|from ['"]@scure|from ['"]micro-ordinals|localStorage|new Worker|buildEnvelopeScript/);
});
