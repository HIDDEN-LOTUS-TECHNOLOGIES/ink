// Ord envelope and virtual-size math for the public cost page.
// The leaf script matches micro-ordinals 0.4.0 (the signet lab builder):
// <32-byte x-only key> OP_CHECKSIG OP_FALSE OP_IF "ord" <1> <content type> OP_FALSE <body> OP_ENDIF
// Body pushes are split at 520 bytes. This module does not create a key, sign, or broadcast.
// The 32 key bytes are a placeholder; only their length affects the size.

import { assertBody } from '../lab/signet/src/contentType.js';

export const POSTAGE_DEFAULT = 546;
export const CHUNK = 520;
export const SIG_BYTES = 64;
export const CONTROL_BYTES = 33;

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
  const revealWeight = REVEAL_BASE_WEIGHT + witness;
  const revealVbytes = Math.ceil(revealWeight / 4);
  const postageSats = parsePostage(postage);
  return {
    contentType: type,
    bodyBytes: checked.length,
    scriptBytes: script.length,
    witnessBytes: witness,
    revealBaseWeight: REVEAL_BASE_WEIGHT,
    revealWeight,
    revealVbytes,
    commitVbytes: COMMIT_VBYTES,
    totalVbytes: COMMIT_VBYTES + revealVbytes,
    postage: postageSats,
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
