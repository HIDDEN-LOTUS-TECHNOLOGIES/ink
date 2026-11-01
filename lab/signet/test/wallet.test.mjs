import assert from 'node:assert/strict';
import test from 'node:test';
import * as btc from '@scure/btc-signer';
import { DefaultAdaptersInfo } from '@sats-connect/core';
import { hex } from '@scure/base';
import { createKey, preparePlan, buildCommitPsbt, finalizeCommitPsbt, buildReveal, textBody, utxoCreatedByInscription } from '../src/inscribe.js';
import { createWallet, listWallets } from '../wallet.js';

const xverseId = DefaultAdaptersInfo.xverse.id;
const unisatId = DefaultAdaptersInfo.unisat.id;

test('lists default wallets and any extra btc_providers', () => {
  const win = {
    XverseProviders: { BitcoinProvider: { request() {} } },
    btc_providers: [{ id: 'LeatherProvider', name: 'Leather' }],
  };
  const names = listWallets(win).map((w) => `${w.name}:${w.installed}`);
  assert.deepEqual(names, ['Fordefi:false', 'Xverse:true', 'Unisat:false', 'Leather:false']);
});

test('Xverse-style connect keeps payment and ordinals addresses apart', async () => {
  const calls = [];
  const payment = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
  const ordinals = 'tb1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqp3mvzv';
  const wallet = createWallet({
    win: {},
    makeAdapter() {
      return {
        async request(method, params) {
          calls.push({ method, params });
          if (method === 'wallet_connect') {
            return {
              status: 'success',
              result: {
                addresses: [
                  { address: payment, publicKey: `02${'11'.repeat(32)}`, purpose: 'payment' },
                  { address: ordinals, publicKey: '22'.repeat(32), purpose: 'ordinals' },
                ],
                network: { bitcoin: { name: 'Signet' } },
              },
            };
          }
          if (method === 'signPsbt') {
            assert.equal(params.broadcast, false);
            assert.deepEqual(params.signInputs[payment], [0]);
            return { status: 'success', result: { psbt: `${params.psbt}-signed` } };
          }
          return { status: 'success', result: null };
        },
      };
    },
  });
  const session = await wallet.connect(xverseId);
  assert.equal(session.paymentAddress, payment);
  assert.equal(session.ordinalsAddress, ordinals);
  assert.equal(session.paymentPubkey, `02${'11'.repeat(32)}`);
  assert.equal(session.ordinalsPubkey, '22'.repeat(32));
  assert.equal(session.network, 'Signet');
  assert.equal(calls[0].params.network, 'Signet');
  const signed = await wallet.signPsbt('cHNidP8=', [{ index: 0, address: payment, publicKey: '11'.repeat(33) }], { broadcast: false });
  assert.equal(signed, 'cHNidP8=-signed');
  await wallet.disconnect();
  assert.equal(wallet.connected(), null);
});

test('refuses a wallet that is not on signet', async () => {
  const wallet = createWallet({
    win: {},
    makeAdapter() {
      return {
        async request() {
          return {
            status: 'success',
            result: {
              addresses: [{ address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', publicKey: '11'.repeat(33), purpose: 'payment' }],
              network: { bitcoin: { name: 'Mainnet' } },
            },
          };
        },
      };
    },
  });
  await assert.rejects(() => wallet.connect(xverseId), /choose Signet/);
});

test('refuses a mainnet address even if the wallet claims Signet', async () => {
  const wallet = createWallet({
    win: {},
    makeAdapter() {
      return {
        async request() {
          return {
            status: 'success',
            result: {
              addresses: [{ address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', publicKey: '11'.repeat(33), purpose: 'payment' }],
              network: { bitcoin: { name: 'Signet' } },
            },
          };
        },
      };
    },
  });
  await assert.rejects(() => wallet.connect(xverseId), /Mainnet address refused/);
});

test('UniSat signs without broadcast through window.unisat', async () => {
  const calls = [];
  const address = 'tb1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqp3mvzv';
  const win = {
    unisat: {
      async switchChain(chain) {
        calls.push(['switch', chain]);
        return { enum: 'BITCOIN_SIGNET', name: 'Bitcoin Signet', network: 'testnet' };
      },
      async requestAccounts() { return [address]; },
      async getPublicKey() { return `02${'ab'.repeat(32)}`; },
      async signPsbt(hex, options) {
        calls.push(['sign', options.autoFinalized, options.toSignInputs]);
        return `${hex}aa`;
      },
    },
  };
  const wallet = createWallet({
    win,
    makeAdapter() {
      return { async request() { throw new Error('Signing without broadcasting is not supported'); } };
    },
  });
  const session = await wallet.connect(unisatId);
  assert.equal(session.paymentAddress, address);
  assert.equal(session.ordinalsAddress, address);
  assert.equal(session.paymentPubkey, 'ab'.repeat(32));
  const signed = await wallet.signPsbt('cHNidP8=', [{ index: 0, address, publicKey: session.paymentPubkey }], { broadcast: false });
  assert.equal(calls[0][1], 'BITCOIN_SIGNET');
  assert.equal(calls[1][1], false);
  assert.equal(calls[1][2][0].index, 0);
  assert.equal(signed.endsWith('qq==') || signed.length > 4, true);
  await assert.rejects(() => wallet.signPsbt('cHNidP8=', [], { broadcast: true }), /broadcast/);
});

test('dry-run PSBT is signed locally and the reveal still parses', () => {
  const funding = createKey();
  const reveal = createKey();
  const plan = preparePlan({
    body: textBody('psbt signet'),
    contentType: 'text/plain',
    revealPriv: reveal.priv,
    dest: funding.address,
    feeRate: 2,
  });
  const psbt = buildCommitPsbt({
    paymentAddress: funding.address,
    utxos: [{ txid: 'cd'.repeat(32), vout: 0, value: 200000 }],
    plan,
  });
  assert.match(psbt.psbtBase64, /^cHNidP/);
  const tx = btc.Transaction.fromPSBT(Uint8Array.from(atob(psbt.psbtBase64), (c) => c.charCodeAt(0)));
  assert.equal(tx.sign(funding.priv), 1);
  const signed = btoa(String.fromCharCode(...tx.toPSBT()));
  const commit = finalizeCommitPsbt(signed, plan);
  const revealTx = buildReveal({ plan, commitTxid: commit.txid, commitValue: plan.commitValue });
  assert.equal(revealTx.parsed[0].tags.contentType, 'text/plain');
  assert.equal(commit.tx.getOutput(0).amount, plan.commitValue);
  assert.equal(utxoCreatedByInscription(hex.decode(revealTx.hex), 0), true);
  assert.equal(utxoCreatedByInscription(hex.decode(commit.hex), 0), false);
});
