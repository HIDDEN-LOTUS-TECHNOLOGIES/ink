// Signet-only inscription builder. No network calls. No mainnet.
import * as btc from '@scure/btc-signer';
import { pubECDSA, pubSchnorr, randomPrivateKeyBytes } from '@scure/btc-signer/utils.js';
import * as ordinals from 'micro-ordinals';
import { hex, utf8 } from '@scure/base';

export const NETWORK_NAME = 'signet';
export const NET = btc.TEST_NETWORK;
export const SIGNET_API_ORIGIN = 'https://mempool.space';
export const POSTAGE = 546n;
export const MAX_BODY = 50 * 1024;
export const FAUCETS = [
  'https://signetfaucet.com/',
  'https://alt.signetfaucet.com/',
];

const MAINNET_ADDR = /^(bc1|[13])/i;
const SIGNET_ADDR = /^(tb1|[mn2])/i;

export function assertSignetAddress(address) {
  const addr = String(address || '').trim();
  if (!addr) throw new Error('Enter a signet destination address.');
  if (MAINNET_ADDR.test(addr)) throw new Error('Mainnet address refused. This page is signet only.');
  if (!SIGNET_ADDR.test(addr)) throw new Error('Not a signet address. Use a tb1, m, n, or 2 address.');
  // Bech32 mixed case is invalid. Require one case so a copied address cannot be corrupted.
  if (addr !== addr.toLowerCase() && addr !== addr.toUpperCase()) {
    throw new Error('Signet address must be all lowercase or all uppercase.');
  }
  btc.Address(NET).decode(addr);
  let mainnetDecoded = false;
  try {
    btc.Address(btc.NETWORK).decode(addr);
    mainnetDecoded = true;
  } catch {
    mainnetDecoded = false;
  }
  if (mainnetDecoded) throw new Error('Mainnet address refused. This page is signet only.');
  return addr.toLowerCase();
}

export function assertSignetUrl(url) {
  const u = new URL(url);
  if (u.protocol !== 'https:') throw new Error('Refused non-HTTPS endpoint.');
  if (u.hostname !== 'mempool.space') throw new Error('Refused endpoint. Only mempool.space signet is allowed.');
  if (!u.pathname.startsWith('/signet/')) throw new Error('Refused non-signet endpoint.');
  if (u.pathname.includes('mainnet') || u.pathname === '/api' || u.pathname.startsWith('/api/')) {
    throw new Error('Refused mainnet endpoint.');
  }
  return u.toString();
}

export function signetUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return assertSignetUrl(`${SIGNET_API_ORIGIN}${p.startsWith('/signet/') ? p : `/signet${p}`}`);
}

export function createKey() {
  const priv = randomPrivateKeyBytes();
  return describeKey(priv);
}

export function keyFromHex(keyHex) {
  const priv = hex.decode(String(keyHex || '').trim());
  if (priv.length !== 32) throw new Error('Key must be 32 bytes.');
  return describeKey(priv);
}

function describeKey(priv) {
  const pub = pubECDSA(priv);
  const pay = btc.p2wpkh(pub, NET);
  return {
    priv,
    hex: hex.encode(priv),
    wif: btc.WIF(NET).encode(priv),
    address: pay.address,
    script: pay.script,
    payment: pay,
  };
}

export function assertBody(body) {
  if (!(body instanceof Uint8Array)) throw new Error('Content must be bytes.');
  if (!body.length) throw new Error('Content is empty.');
  if (body.length > MAX_BODY) throw new Error(`Content is ${body.length} bytes. The limit is ${MAX_BODY} bytes.`);
  return body;
}

export function assertFeeRate(rate) {
  const n = Number(rate);
  if (!Number.isFinite(n) || n <= 0 || n > 1000) throw new Error('Fee rate must be between 0 and 1000 sat/vB.');
  return n;
}

function feeFor(vsize, rate) {
  return BigInt(Math.ceil(vsize * rate));
}

function customScripts() {
  return [ordinals.OutOrdinalReveal];
}

export function buildEnvelope({ body, contentType, revealPriv }) {
  assertBody(body);
  const type = String(contentType || 'application/octet-stream');
  if (type.length > 128) throw new Error('Content type is too long.');
  const inscription = { tags: { contentType: type }, body };
  const leaf = ordinals.p2tr_ord_reveal(pubSchnorr(revealPriv), [inscription]);
  const payment = btc.p2tr(undefined, leaf, NET, true, customScripts());
  assertSignetAddress(payment.address);
  return { inscription, leaf, payment, contentType: type };
}

function buildRevealTx({ payment, revealPriv, commitTxid, commitVout, commitValue, dest, postage }) {
  const tx = new btc.Transaction({ customScripts: customScripts() });
  tx.addInput({
    ...payment,
    txid: commitTxid,
    index: commitVout,
    witnessUtxo: { script: payment.script, amount: commitValue },
  });
  tx.addOutputAddress(dest, postage, NET);
  const signed = tx.sign(revealPriv, undefined, new Uint8Array(32));
  if (!signed) throw new Error('Reveal did not sign.');
  tx.finalize();
  return tx;
}

export function preparePlan({ body, contentType, revealPriv, dest, feeRate }) {
  const destination = assertSignetAddress(dest);
  const rate = assertFeeRate(feeRate);
  const env = buildEnvelope({ body, contentType, revealPriv });
  const probe = buildRevealTx({
    payment: env.payment,
    revealPriv,
    commitTxid: '00'.repeat(32),
    commitVout: 0,
    commitValue: 100_000n,
    dest: destination,
    postage: POSTAGE,
  });
  const revealFee = feeFor(probe.vsize, rate);
  const commitValue = POSTAGE + revealFee;
  return {
    network: NETWORK_NAME,
    destination,
    feeRate: rate,
    contentType: env.contentType,
    body,
    revealPriv,
    payment: env.payment,
    revealScript: env.leaf.script,
    commitAddress: env.payment.address,
    revealVsize: probe.vsize,
    revealFee,
    postage: POSTAGE,
    commitValue,
  };
}

function makeCommitTx({ funding, picked, commitAddress, commitValue, change }) {
  const tx = new btc.Transaction();
  for (const u of picked) {
    tx.addInput({
      txid: u.txid,
      index: u.vout,
      witnessUtxo: { script: funding.script, amount: BigInt(u.value) },
    });
  }
  tx.addOutputAddress(commitAddress, commitValue, NET);
  if (change >= 546n) tx.addOutputAddress(funding.address, change, NET);
  const signed = tx.sign(funding.priv);
  if (!signed) throw new Error('Commit did not sign. The UTXO is not spendable by this signet key.');
  tx.finalize();
  return tx;
}

export function buildCommit({ funding, utxos, plan }) {
  assertSignetAddress(plan.commitAddress);
  const clean = (utxos || [])
    .map((u) => ({ txid: String(u.txid), vout: Number(u.vout), value: BigInt(u.value) }))
    .filter((u) => u.txid && Number.isInteger(u.vout) && u.value > 0n)
    .sort((a, b) => (a.value > b.value ? -1 : 1));
  if (!clean.length) throw new Error('No signet UTXOs on the funding address yet.');
  let sum = 0n;
  const picked = [];
  for (const u of clean) {
    picked.push(u);
    sum += u.value;
    if (sum < plan.commitValue) continue;
    const bare = makeCommitTx({ funding, picked, commitAddress: plan.commitAddress, commitValue: plan.commitValue, change: 0n });
    const bareFee = feeFor(bare.vsize, plan.feeRate);
    const bareChange = sum - plan.commitValue - bareFee;
    if (bareChange < 0n) continue;
    if (bareChange < 546n) {
      return finishCommit(bare, plan, sum, 0n);
    }
    const withChange = makeCommitTx({
      funding, picked, commitAddress: plan.commitAddress, commitValue: plan.commitValue, change: bareChange,
    });
    const fee = feeFor(withChange.vsize, plan.feeRate);
    const change = sum - plan.commitValue - fee;
    if (change >= 546n) {
      const exact = change === bareChange
        ? withChange
        : makeCommitTx({ funding, picked, commitAddress: plan.commitAddress, commitValue: plan.commitValue, change });
      return finishCommit(exact, plan, sum, change);
    }
    return finishCommit(bare, plan, sum, 0n);
  }
  throw new Error(`Not enough signet coins. Found ${sum} sats. The commit output needs ${plan.commitValue} sats plus the commit fee.`);
}

function finishCommit(tx, plan, inputSum, change) {
  const raw = tx.extract();
  const out = tx.getOutput(0);
  if (out.amount !== plan.commitValue) throw new Error('Commit output amount mismatch.');
  return {
    tx,
    hex: hex.encode(raw),
    txid: tx.id,
    vbytes: tx.vsize,
    bytes: raw.length,
    fee: inputSum - plan.commitValue - change,
    change,
    inputSum,
  };
}

export function buildReveal({ plan, commitTxid, commitVout = 0, commitValue }) {
  if (commitValue <= plan.postage) throw new Error('Commit output cannot cover the 546 sat postage.');
  const tx = buildRevealTx({
    payment: plan.payment,
    revealPriv: plan.revealPriv,
    commitTxid,
    commitVout,
    commitValue,
    dest: plan.destination,
    postage: plan.postage,
  });
  const raw = tx.extract();
  const witness = tx.getInput(0).finalScriptWitness;
  const parsed = ordinals.parseWitness(witness);
  if (!parsed || !parsed.length) throw new Error('Reveal witness has no inscription.');
  return {
    tx,
    hex: hex.encode(raw),
    txid: tx.id,
    vbytes: tx.vsize,
    bytes: raw.length,
    fee: commitValue - plan.postage,
    witness,
    parsed,
    inscriptionId: `${tx.id}i0`,
  };
}

export function inspectReveal(reveal) {
  const witness = reveal.witness;
  if (!witness || witness.length < 3) throw new Error('Reveal witness is missing the script path.');
  const control = witness[witness.length - 1];
  const script = witness[witness.length - 2];
  if (control[0] !== 0xc0 && control[0] !== 0xc1) throw new Error('Control block is not a taproot script-path spend.');
  const fromScript = ordinals.parseInscriptions(btc.Script.decode(script), true);
  if (!fromScript || !fromScript.length) throw new Error('Envelope did not parse.');
  return { control, script, fromScript };
}

export function recoveryFile(plan, funding) {
  return {
    network: NETWORK_NAME,
    keyWif: btc.WIF(NET).encode(plan.revealPriv),
    keyHex: hex.encode(plan.revealPriv),
    fundingKeyWif: funding.wif,
    fundingKeyHex: funding.hex,
    revealScript: hex.encode(plan.revealScript),
    commitAddress: plan.commitAddress,
    destination: plan.destination,
    contentType: plan.contentType,
    bodyHex: hex.encode(plan.body),
    feeRate: plan.feeRate,
    postage: Number(plan.postage),
    commitValue: Number(plan.commitValue),
  };
}

export function planFromRecovery(file) {
  if (!file || file.network !== NETWORK_NAME) throw new Error('Recovery file is not for signet.');
  const reveal = keyFromHex(file.keyHex);
  if (reveal.wif !== file.keyWif) throw new Error('Recovery WIF does not match the hex key.');
  const body = hex.decode(file.bodyHex || '');
  assertBody(body);
  const plan = preparePlan({
    body,
    contentType: file.contentType,
    revealPriv: reveal.priv,
    dest: file.destination,
    feeRate: file.feeRate,
  });
  if (plan.commitAddress !== file.commitAddress) throw new Error('Commit address does not match this key and content.');
  if (hex.encode(plan.revealScript) !== String(file.revealScript || '').toLowerCase()) {
    throw new Error('Reveal script does not match this key and content.');
  }
  return { plan, reveal };
}

export function textBody(text) {
  return utf8.decode(String(text ?? ''));
}

export function sameBytes(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
