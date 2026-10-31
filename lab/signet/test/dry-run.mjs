import assert from 'node:assert/strict';
import * as btc from '@scure/btc-signer';
import { utf8 } from '@scure/base';
import {
  POSTAGE, assertSignetAddress, assertSignetUrl, buildCommit, buildReveal,
  createKey, inspectReveal, preparePlan, recoveryFile, planFromRecovery, sameBytes, textBody,
} from '../src/inscribe.js';

const refused = [
  'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
  'BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4',
  '1BoatSLRHtKNngkdXEeobR76b53LETtpyT',
  '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
];
for (const addr of refused) {
  assert.throws(() => assertSignetAddress(addr), /[Mm]ainnet/, addr);
}
assert.throws(() => assertSignetUrl('https://mempool.space/api/tx'), /signet|mainnet/i);
assert.throws(() => assertSignetUrl('https://blockstream.info/api/tx'), /mempool/);
assert.throws(() => assertSignetUrl('http://mempool.space/signet/api/tx'), /HTTPS/);

const funding = createKey();
assert.ok(funding.address.startsWith('tb1q'), funding.address);
assertSignetAddress(funding.address);

const reveal = createKey();
const body = textBody('INK signet proof');
const plan = preparePlan({
  body,
  contentType: 'text/plain',
  revealPriv: reveal.priv,
  dest: funding.address,
  feeRate: 2,
});
assert.ok(plan.commitAddress.startsWith('tb1p'));
assert.equal(plan.postage, POSTAGE);
assert.ok(plan.commitValue > POSTAGE);
assert.ok(plan.revealFee > 0n);

const utxoValue = 200_000;
const utxos = [{ txid: 'ab'.repeat(32), vout: 1, value: utxoValue }];
const commit = buildCommit({ funding, utxos, plan });
assert.equal(commit.tx.getOutput(0).amount, plan.commitValue);
assert.ok(commit.fee > 0n);
assert.ok(commit.hex.length > 20);
assert.equal(commit.inputSum, BigInt(utxoValue));

const revealTx = buildReveal({
  plan,
  commitTxid: commit.txid,
  commitVout: 0,
  commitValue: plan.commitValue,
});
assert.equal(revealTx.fee, plan.revealFee);
assert.equal(revealTx.inscriptionId, `${revealTx.txid}i0`);
assert.equal(revealTx.tx.getOutput(0).amount, POSTAGE);
const info = inspectReveal(revealTx);
assert.ok(info.control[0] === 0xc0 || info.control[0] === 0xc1);
assert.equal(info.fromScript[0].tags.contentType, 'text/plain');
assert.ok(sameBytes(info.fromScript[0].body, body));
assert.ok(sameBytes(revealTx.parsed[0].body, body));
assert.equal(utf8.encode(revealTx.parsed[0].body), 'INK signet proof');

// Rebuilt from the recovery file, before any commit exists, the reveal matches.
const file = recoveryFile(plan, funding);
assert.equal(file.network, 'signet');
assert.equal(file.commitAddress, plan.commitAddress);
assert.ok(file.keyWif && file.keyHex && file.revealScript);
const restored = planFromRecovery(file);
const again = buildReveal({
  plan: restored.plan,
  commitTxid: commit.txid,
  commitVout: 0,
  commitValue: plan.commitValue,
});
assert.equal(again.hex, revealTx.hex);

// A mainnet-looking API must not be constructed by signetUrl.
assert.throws(() => assertSignetUrl('https://mempool.space/api/address/bc1q/utxo'), /signet|mainnet/i);

console.log(JSON.stringify({
  funding: funding.address,
  commitAddress: plan.commitAddress,
  commitTxid: commit.txid,
  commitVbytes: commit.vbytes,
  commitFee: Number(commit.fee),
  revealTxid: revealTx.txid,
  revealVbytes: revealTx.vbytes,
  revealFee: Number(revealTx.fee),
  postage: Number(POSTAGE),
  inscriptionId: revealTx.inscriptionId,
  control: info.control[0].toString(16),
}, null, 2));
console.log('dry-run ok');
