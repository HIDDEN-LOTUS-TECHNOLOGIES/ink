import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { estimateInscription, feeFor, MAX_STANDARD_TX_WEIGHT, measureBatch, revealBaseWeight, totalCost } from '../../estimate/size.js';
import { batchCost, planBatch, planNarrative, postageOutputLabel } from '../batch.js';

// "hi" as text/plain;charset=utf-8 and a 100 KB image/png share one commit and one reveal.
// Combined reveal script is the tapscript prefix once plus both envelopes.
// At 1.1 sat/vB that batch is one commit fee, one reveal fee, and 20,000 sats of postage.

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

test('one commit and one reveal carry both files', () => {
  const planned = planBatch([hiFile(), pngFile()]);
  assert.equal(planned.rejected.length, 0);
  assert.equal(planned.accepted.length, 2);
  assert.equal(planned.batches.length, 1);

  const hi = planned.accepted[0];
  assert.equal(hi.filename, 'note.txt');
  assert.equal(hi.contentType, 'text/plain;charset=utf-8');
  assert.equal(hi.bodyBytes, 2);
  assert.equal(hi.scriptBytes, 72);
  assert.equal(hi.postage, 10_000);

  const png = planned.accepted[1];
  assert.equal(png.filename, 'pixel.png');
  assert.equal(png.contentType, 'image/png');
  assert.equal(png.bodyBytes, 102400);
  assert.equal(png.scriptBytes, 103045);

  const batch = planned.batches[0];
  assert.equal(batch.count, 2);
  assert.equal(batch.commitVbytes, 154);
  assert.equal(batch.scriptBytes, 34 + hi.envelopeBytes + png.envelopeBytes);
  assert.equal(batch.revealWeight, 103_738);
  assert.equal(batch.revealVbytes, 25_935);
  assert.equal(batch.postage, 20_000);
  assert.equal(planned.combined.revealWeight, batch.revealWeight);
  assert.equal(planned.totals.commitVbytes, 154);
  assert.equal(planned.totals.revealVbytes, 25_935);
  assert.equal(planned.totals.totalVbytes, 26_089);
  assert.equal(planned.totals.postage, 20_000);

  const hiAlone = estimateInscription({ body: hiFile().bytes, contentType: 'text/plain;charset=utf-8' });
  const pngAlone = estimateInscription({ body: pngFile().bytes, contentType: 'image/png' });
  assert.equal(batchCost(planned.batches, 1.1).commitFee, feeFor(154, 1.1));
  assert.notEqual(
    batchCost(planned.batches, 1.1).total,
    totalCost(hiAlone, 1.1).total + totalCost(pngAlone, 1.1).total,
  );
  assert.equal(batchCost(planned.batches, 1.1).total, 48_699);
});

test('a file over 400,000 bytes is rejected and siblings still share one reveal', () => {
  const clean = planBatch([hiFile(), pngFile()]);
  const tooBig = MAX_STANDARD_TX_WEIGHT + 1;
  const mixed = planBatch([
    hiFile(),
    { name: 'big.bin', type: '', size: tooBig, bytes: new Uint8Array(1) },
    { name: 'empty.txt', type: 'text/plain', bytes: new Uint8Array(0), size: 0 },
    pngFile(),
  ]);
  assert.equal(mixed.rejected.length, 2);
  assert.equal(mixed.rejected[0].filename, 'big.bin');
  assert.equal(mixed.rejected[0].bytes, tooBig);
  assert.match(mixed.rejected[0].message, /400,000/);
  assert.match(mixed.rejected[0].message, /--no-limit/);
  assert.equal(mixed.rejected[1].filename, 'empty.txt');
  assert.match(mixed.rejected[1].message, /empty/);
  assert.equal(mixed.accepted.length, 2);
  assert.equal(mixed.batches.length, 1);
  assert.equal(mixed.totals.revealWeight, clean.totals.revealWeight);
  assert.equal(batchCost(mixed.batches, 2).total, batchCost(clean.batches, 2).total);
});

test('a batch over 400,000 weight units is split, and the fee is one ceil per reveal', () => {
  const heavy = {
    name: 'heavy.bin',
    type: 'application/octet-stream',
    bytes: new Uint8Array(300_000),
  };
  const planned = planBatch([heavy, { ...heavy, name: 'heavy-2.bin' }], { postage: 1000 });
  assert.equal(planned.rejected.length, 0);
  assert.equal(planned.combined.weightClass, 'over');
  assert.equal(planned.batches.length, 2);
  assert.equal(planned.batches[0].files[0].filename, 'heavy.bin');
  assert.equal(planned.batches[1].files[0].filename, 'heavy-2.bin');
  assert.ok(planned.batches.every((batch) => batch.revealWeight <= MAX_STANDARD_TX_WEIGHT));
  assert.equal(planned.totals.postage, 2000);
  assert.equal(planned.totals.commitVbytes, 154 * 2);

  for (const rate of [1, 1.1, 2, 3.5]) {
    let commitFee = 0;
    let revealFee = 0;
    let total = 0;
    for (const batch of planned.batches) {
      const cost = totalCost(batch, rate);
      assert.equal(cost.commitFee, feeFor(batch.commitVbytes, rate));
      assert.equal(cost.revealFee, feeFor(batch.revealVbytes, rate));
      commitFee += cost.commitFee;
      revealFee += cost.revealFee;
      total += cost.total;
    }
    const summed = batchCost(planned.batches, rate);
    assert.equal(summed.commitFee, commitFee);
    assert.equal(summed.revealFee, revealFee);
    assert.equal(summed.total, total);
  }

  const low = planBatch([hiFile(), pngFile()], { postage: 546 });
  const high = planBatch([hiFile(), pngFile()], { postage: 1000 });
  assert.equal(batchCost(high.batches, 3).total - batchCost(low.batches, 3).total, 454 * 2);
  assert.equal(low.totals.revealVbytes, high.totals.revealVbytes);
});

test('postage defaults to 10,000 and 546 is a custom amount', () => {
  assert.equal(planBatch([hiFile()]).accepted[0].postage, 10_000);
  const custom = planBatch([hiFile()], { postage: 546 });
  assert.equal(custom.accepted[0].postage, 546);
  assert.notEqual(custom.accepted[0].postage, 10_000);
});

test('a split suggestion names each batch you would run separately', () => {
  const heavy = {
    name: 'heavy.bin',
    type: 'application/octet-stream',
    bytes: new Uint8Array(300_000),
  };
  const planned = planBatch([heavy, { ...heavy, name: 'heavy-2.bin' }]);
  const text = planNarrative(planned);
  assert.match(text, /INK suggests splitting it into 2 batches you run separately/);
  assert.match(text, /Batch 1 is one commit of 154 vbytes and one reveal/);
  assert.match(text, /heavy\.bin/);
  assert.match(text, /Batch 2 is one commit of 154 vbytes and one reveal/);
  assert.match(text, /heavy-2\.bin/);
  assert.match(text, /1 postage output/);
  assert.doesNotMatch(text, /postage outputs/);
});

test('postage outputs are pluralized and a multi-file reveal adds an output', () => {
  assert.equal(postageOutputLabel(1), 'postage output');
  assert.equal(postageOutputLabel(2), 'postage outputs');
  assert.equal(revealBaseWeight(2) - revealBaseWeight(1), 172);
  const hi = estimateInscription({ body: hiFile().bytes, contentType: 'text/plain;charset=utf-8' });
  const png = estimateInscription({ body: pngFile().bytes, contentType: 'image/png' });
  const one = measureBatch([hi]);
  const two = measureBatch([hi, png]);
  assert.equal(one.revealWeight, hi.revealWeight);
  assert.equal(two.revealWeight, 103_738);
  assert.ok(two.revealWeight > one.revealWeight + 172);
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
