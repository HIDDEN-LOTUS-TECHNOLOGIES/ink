// Ported from packz-framework src/lib/ordinals/parentInscription.ts (8e01e71).
// Tag 3 encode/decode and inscription id checks only. The server createParentInscription
// call is not ported.

const ID_RE = /^([a-fA-F0-9]{64})i(\d+)$/;

export function parseInscriptionId(inscriptionId) {
  const match = String(inscriptionId || '').match(ID_RE);
  if (!match) {
    console.error('Invalid inscription ID format', inscriptionId);
    return null;
  }
  return { txid: match[1].toLowerCase(), index: Number(match[2]) };
}

export function isValidInscriptionId(id) {
  return ID_RE.test(String(id || ''));
}

function encodeIndexLittleEndian(index) {
  if (index === 0) return new Uint8Array(0);
  const buffer = new Uint8Array(4);
  new DataView(buffer.buffer).setUint32(0, index, true);
  let last = 3;
  while (last > 0 && buffer[last] === 0) last -= 1;
  return buffer.slice(0, last + 1);
}

export function encodeParentTag3(inscriptionId) {
  const parsed = parseInscriptionId(inscriptionId);
  if (!parsed) throw new Error(`Invalid parent inscription ID: ${inscriptionId}`);
  const txid = new Uint8Array(32);
  for (let i = 0; i < 32; i++) txid[i] = Number.parseInt(parsed.txid.slice(i * 2, i * 2 + 2), 16);
  txid.reverse();
  const index = encodeIndexLittleEndian(parsed.index);
  const out = new Uint8Array(txid.length + index.length);
  out.set(txid, 0);
  out.set(index, txid.length);
  console.info('Encoded parent inscription for Tag 3', { index: parsed.index, tag3Length: out.length });
  return out;
}

export function decodeParentTag3(tag3) {
  const bytes = tag3 instanceof Uint8Array ? tag3 : Uint8Array.from(tag3);
  if (bytes.length < 32) throw new Error('Invalid Tag 3 buffer: too short');
  if (bytes.length > 36) throw new Error('Invalid Tag 3 buffer: index too large');
  const txidBytes = bytes.slice(0, 32);
  txidBytes.reverse();
  const txid = [...txidBytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  const indexBytes = bytes.slice(32);
  const padded = new Uint8Array(4);
  padded.set(indexBytes);
  const index = new DataView(padded.buffer).getUint32(0, true);
  return `${txid}i${index}`;
}

export function parentTag3Hex(inscriptionId) {
  return [...encodeParentTag3(inscriptionId)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function decodeParentTag3Hex(hex) {
  const clean = String(hex || '').trim().replace(/^0x/, '');
  if (!/^[0-9a-fA-F]*$/.test(clean) || clean.length % 2) throw new Error('Tag 3 hex is not even-length hexadecimal.');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return decodeParentTag3(bytes);
}
