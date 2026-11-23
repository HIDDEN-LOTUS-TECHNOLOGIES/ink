// Ord envelope and virtual-size math for the public cost page.
// The leaf script matches micro-ordinals 0.4.0 (the signet lab builder):
// <32-byte x-only key> OP_CHECKSIG OP_FALSE OP_IF "ord" <1> <content type> OP_FALSE <body> OP_ENDIF
// Body pushes are split at 520 bytes. This module does not create a key, sign, or broadcast.
// The 32 key bytes are a placeholder; only their length affects the size.

import { assertBody } from '../lab/signet/src/contentType.js';

// ord 0.29.1 src/lib.rs TARGET_POSTAGE. Dust is not one number.
// Bitcoin Core src/policy/policy.cpp GetDustThreshold, default dust relay fee 3 sat/vB:
// a P2PKH output is 182 bytes at that rate (546 sats), a P2WPKH output is 98 bytes (294),
// and a P2TR output is 43 + 67 = 110 bytes (330). Inscriptions live on taproot outputs.
export const POSTAGE_DEFAULT = 10_000;
export const TAPROOT_DUST = 330;
export const P2WPKH_DUST = 294;
export const P2PKH_DUST = 546;
export const CHUNK = 520;
export const SIG_BYTES = 64;
export const CONTROL_BYTES = 33;

// bitcoin::policy::MAX_STANDARD_TX_WEIGHT. ord refuses a heavier reveal unless --no-limit.
// docs/src/guides/wallet.md: "390,000 weight units should be safe."
export const MAX_STANDARD_TX_WEIGHT = 400_000;
export const SAFE_TX_WEIGHT = 390_000;

// <32-byte key> push plus OP_CHECKSIG. One per reveal, shared by every envelope in a batch.
export const TAPSCRIPT_PREFIX = 34;
export const P2TR_OUTPUT_WEIGHT = 172;

// Weight of a 1-input 1-output reveal before the witness stack:
// version 16 + locktime 16 + input count 4 + output count 4
// + outpoint and sequence 160 + empty scriptSig 4
// + one P2TR output 172 + segwit marker and flag 2.
export const REVEAL_BASE_WEIGHT = 378;

// One P2TR key-path input and two P2TR outputs (commit and change).
// Non-witness 137 bytes * 4 = 548, plus marker/flag 2 and a 66-byte key-path witness = 616.
// vbytes = ceil(616 / 4) = 154.
// The same figure is 10.5 + 57.5 + 43 + 43.
export const COMMIT_VBYTES = 154;

const ORD = new Uint8Array([0x6f, 0x72, 0x64]);
const TAG_CONTENT_TYPE = new Uint8Array([0x01]);
const PLACEHOLDER_KEY = new Uint8Array(32);
const textEncoder = new TextEncoder();

export function normalizeContentType(contentType) {
  const type = String(contentType || 'application/octet-stream');
  if (type.length > 128) throw new Error('Content type is too long.');
  return type;
}

function pushHeader(length) {
  if (length < 76) return 1;
  if (length <= 255) return 2;
  if (length <= 65535) return 3;
  return 5;
}

function writePush(out, offset, bytes) {
  const length = bytes.length;
  if (length < 76) {
    out[offset++] = length;
  } else if (length <= 255) {
    out[offset++] = 0x4c;
    out[offset++] = length;
  } else if (length <= 65535) {
    out[offset++] = 0x4d;
    out[offset++] = length & 0xff;
    out[offset++] = (length >> 8) & 0xff;
  } else {
    out[offset++] = 0x4e;
    out[offset++] = length & 0xff;
    out[offset++] = (length >> 8) & 0xff;
    out[offset++] = (length >> 16) & 0xff;
    out[offset++] = (length >>> 24) & 0xff;
  }
  out.set(bytes, offset);
  return offset + length;
}

export function buildEnvelopeScript(body, contentType) {
  const type = normalizeContentType(contentType);
  const typeBytes = textEncoder.encode(type);
  const chunks = [];
  for (let i = 0; i < body.length; i += CHUNK) chunks.push(body.subarray(i, i + CHUNK));
  let size = 1 + PLACEHOLDER_KEY.length + 1 + 1 + 1;
  size += pushHeader(ORD.length) + ORD.length;
  size += pushHeader(TAG_CONTENT_TYPE.length) + TAG_CONTENT_TYPE.length;
  size += pushHeader(typeBytes.length) + typeBytes.length;
  size += 1;
  for (const chunk of chunks) size += pushHeader(chunk.length) + chunk.length;
  size += 1;

  const out = new Uint8Array(size);
  let offset = 0;
  offset = writePush(out, offset, PLACEHOLDER_KEY);
  out[offset++] = 0xac;
  out[offset++] = 0x00;
  out[offset++] = 0x63;
  offset = writePush(out, offset, ORD);
  offset = writePush(out, offset, TAG_CONTENT_TYPE);
  offset = writePush(out, offset, typeBytes);
  out[offset++] = 0x00;
  for (const chunk of chunks) offset = writePush(out, offset, chunk);
  out[offset++] = 0x68;
  if (offset !== size) throw new Error('Envelope script size mismatch.');
  return out;
}

export function compactSize(n) {
  if (n <= 252) return 1;
  if (n <= 0xffff) return 3;
  if (n <= 0xffffffff) return 5;
  return 9;
}

export function witnessBytes(scriptLength) {
  return compactSize(3)
    + compactSize(SIG_BYTES) + SIG_BYTES
    + compactSize(scriptLength) + scriptLength
    + compactSize(CONTROL_BYTES) + CONTROL_BYTES;
}

// Non-witness weight of one reveal input and `outputs` P2TR outputs, plus the segwit marker.
export function revealBaseWeight(outputs = 1) {
  const count = outputs < 1 ? 1 : outputs;
  return 16 + 16
    + compactSize(1) * 4
    + compactSize(count) * 4
    + 160 + 4
    + count * P2TR_OUTPUT_WEIGHT
    + 2;
}

export function revealWeightFor(scriptLength, outputs = 1) {
  return revealBaseWeight(outputs) + witnessBytes(scriptLength);
}

export function weightClass(weight) {
  if (weight > MAX_STANDARD_TX_WEIGHT) return 'over';
  if (weight > SAFE_TX_WEIGHT) return 'warn';
  return 'ok';
}

// Tag 17 is a 1-byte push (2 script bytes) plus the data push, repeated every 520 bytes.
// ord 0.29.1 src/inscriptions/tag.rs Tag::append for Properties.
export function propertiesFieldBytes(byteLength) {
  let total = 0;
  for (let offset = 0; offset < byteLength; offset += CHUNK) {
    const chunk = Math.min(CHUNK, byteLength - offset);
    total += 2 + pushHeader(chunk) + chunk;
  }
  return total;
}

// Key, CHECKSIG, OP_FALSE OP_IF "ord" … OP_ENDIF, with no content type and no body.
const PROPERTIES_FRAME = TAPSCRIPT_PREFIX + 1 + 1 + pushHeader(3) + 3 + 1;

export function propertiesReveal(byteLength) {
  const scriptBytes = PROPERTIES_FRAME + propertiesFieldBytes(byteLength);
  const revealWeight = revealWeightFor(scriptBytes, 1);
  return {
    scriptBytes,
    witnessBytes: witnessBytes(scriptBytes),
    revealWeight,
    revealVbytes: Math.ceil(revealWeight / 4),
    weightClass: weightClass(revealWeight),
  };
}

export function batchScriptLength(envelopeLengths) {
  return TAPSCRIPT_PREFIX + envelopeLengths.reduce((sum, n) => sum + n, 0);
}

export function measureBatch(rows) {
  const count = rows.length;
  const scriptBytes = batchScriptLength(rows.map((row) => row.envelopeBytes));
  const revealWeight = count ? revealWeightFor(scriptBytes, count) : 0;
  return {
    count,
    bodyBytes: rows.reduce((sum, row) => sum + row.bodyBytes, 0),
    scriptBytes,
    witnessBytes: count ? witnessBytes(scriptBytes) : 0,
    revealWeight,
    revealVbytes: count ? Math.ceil(revealWeight / 4) : 0,
    commitVbytes: count ? COMMIT_VBYTES : 0,
    postage: rows.reduce((sum, row) => sum + row.postage, 0),
    weightClass: count ? weightClass(revealWeight) : 'ok',
  };
}

export function parsePostage(value) {
  const raw = typeof value === 'number' ? String(value) : String(value ?? '').trim();
  if (!/^(0|[1-9]\d*)$/.test(raw)) throw new Error('Postage must be a whole number of sats from 0 to 100000000.');
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n > 100_000_000) {
    throw new Error('Postage must be a whole number of sats from 0 to 100000000.');
  }
  return n;
}

export function parseFeeRate(value) {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').trim());
  if (!Number.isFinite(n) || n <= 0 || n > 1000) throw new Error('Fee rate must be between 0 and 1000 sat/vB.');
  return n;
}

export function feeFor(vbytes, rate) {
  return Math.ceil(vbytes * rate);
}

export function estimateInscription({ body, contentType, postage = POSTAGE_DEFAULT }) {
  const checked = assertBody(body);
  const type = normalizeContentType(contentType);
  const script = buildEnvelopeScript(checked, type);
  const witness = witnessBytes(script.length);
  const revealWeight = revealWeightFor(script.length, 1);
  const revealVbytes = Math.ceil(revealWeight / 4);
  const postageSats = parsePostage(postage);
  return {
    contentType: type,
    bodyBytes: checked.length,
    scriptBytes: script.length,
    envelopeBytes: script.length - TAPSCRIPT_PREFIX,
    witnessBytes: witness,
    revealBaseWeight: REVEAL_BASE_WEIGHT,
    revealWeight,
    revealVbytes,
    commitVbytes: COMMIT_VBYTES,
    totalVbytes: COMMIT_VBYTES + revealVbytes,
    postage: postageSats,
    weightClass: weightClass(revealWeight),
  };
}

export function totalCost(measured, rate) {
  const commitFee = feeFor(measured.commitVbytes, rate);
  const revealFee = feeFor(measured.revealVbytes, rate);
  const fee = commitFee + revealFee;
  return {
    commitFee,
    revealFee,
    fee,
    postage: measured.postage,
    total: fee + measured.postage,
  };
}

export function satsToUsd(sats, usdPerBtc) {
  if (typeof usdPerBtc !== 'number' || !Number.isFinite(usdPerBtc) || usdPerBtc <= 0) return null;
  return (sats / 1e8) * usdPerBtc;
}
