// Gallery properties size estimate against ord 0.29.1
// (https://github.com/ordinals/ord/releases/tag/0.29.1).
// CBOR layout: src/properties.rs (Properties::to_inline_cbor / to_packed_cbor)
// and docs/src/inscriptions/properties.md.
// Candidate choice, the 4,000,000 byte cap, and the 30:1 ratio cap:
// src/inscriptions/inscription.rs (Inscription::encode_properties and
// compress_properties). Tag 17 is the properties field (src/inscriptions/tag.rs).
// Inscription id bytes match InscriptionId::value, which is the same layout as
// kit/parentInscription.js encodeParentTag3 (reversed txid, minimal little-endian index).

import { normalizeCollection } from '../kit/convert.js';
import { MetadataValidator } from '../kit/metadataValidator.js';
import { encodeParentTag3, isValidInscriptionId, parseInscriptionId } from '../kit/parentInscription.js';
import { BROTLI_ESTIMATE, estimateBrotliSize } from './brotli.js';

export const ORD_VERSION = '0.29.1';
// 400 KB properties payload. This is not Bitcoin Core's 400_000 weight-unit
// standardness cap, and it does not include the reveal transaction around the bytes.
export const STANDARD_TX_BYTES = 400 * 1024;
export const MAX_DECOMPRESSED_PROPERTIES = 4_000_000;
export const MAX_COMPRESSION_RATIO = 30;
const MAX_U32 = 0xffffffff;

const textEncoder = new TextEncoder();

function concat(parts) {
  const len = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(len);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function encodeUint(n) {
  if (n < 24) return Uint8Array.of(n);
  if (n < 0x100) return Uint8Array.of(24, n);
  if (n < 0x10000) return Uint8Array.of(25, n >> 8, n & 0xff);
  if (n < 0x100000000) {
    const b = new Uint8Array(5);
    b[0] = 26;
    new DataView(b.buffer).setUint32(1, n);
    return b;
  }
  const b = new Uint8Array(9);
  b[0] = 27;
  const hi = Math.floor(n / 0x100000000);
  const lo = n >>> 0;
  const view = new DataView(b.buffer);
  view.setUint32(1, hi);
  view.setUint32(5, lo);
  return b;
}

function encodeSigned(n) {
  if (n >= 0) return encodeUint(n);
  const arg = encodeUint(-1 - n);
  const out = new Uint8Array(arg);
  out[0] |= 0x20;
  return out;
}

function head(major, len) {
  const info = encodeUint(len);
  const out = new Uint8Array(info);
  out[0] |= major << 5;
  return out;
}

function encodeBytes(bytes) {
  return concat([head(2, bytes.length), bytes]);
}

function encodeText(value) {
  const bytes = textEncoder.encode(value);
  return concat([head(3, bytes.length), bytes]);
}

function encodeArray(parts) {
  return concat([head(4, parts.length), ...parts]);
}

function encodeMap(pairs) {
  return concat([head(5, pairs.length), ...pairs.flat()]);
}

function encodeTrait(value) {
  if (value === null) return Uint8Array.of(0xf6);
  if (value === false) return Uint8Array.of(0xf4);
  if (value === true) return Uint8Array.of(0xf5);
  if (typeof value === 'number') return encodeSigned(value);
  return encodeText(value);
}

function asTrait(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value;
  return undefined;
}

function encodeAttributes(title, traits) {
  const fields = [];
  if (title != null) fields.push([encodeUint(0), encodeText(title)]);
  if (traits.length) {
    fields.push([encodeUint(1), encodeMap(traits.map(([name, value]) => [encodeText(name), encodeTrait(value)]))]);
  }
  if (!fields.length) return null;
  return encodeMap(fields);
}

function encodeInlineItem(item) {
  const fields = [[encodeUint(0), encodeBytes(item.idBytes)]];
  const attributes = encodeAttributes(item.title, item.traits);
  if (attributes) fields.push([encodeUint(1), attributes]);
  return encodeMap(fields);
}

function encodePackedItem(item) {
  const fields = [];
  const attributes = encodeAttributes(item.title, item.traits);
  if (attributes) fields.push([encodeUint(1), attributes]);
  if (item.index > 0) fields.push([encodeUint(2), encodeUint(item.index)]);
  return encodeMap(fields);
}

function encodeDocument(items, title, traits, packed) {
  const fields = [];
  if (items.length) {
    const encoded = items.map(packed ? encodePackedItem : encodeInlineItem);
    fields.push([encodeUint(0), encodeArray(encoded)]);
  }
  const attributes = encodeAttributes(title, traits);
  if (attributes) fields.push([encodeUint(1), attributes]);
  if (packed) {
    const txids = concat(items.map((item) => item.idBytes.subarray(0, 32)));
    fields.push([encodeUint(2), encodeBytes(txids)]);
  }
  if (!fields.length) return null;
  return encodeMap(fields);
}

export function encodeProperties({ items, title = null, traits = [] }) {
  return {
    inline: encodeDocument(items, title, traits, false),
    packed: items.length ? encodeDocument(items, title, traits, true) : encodeDocument(items, title, traits, false),
  };
}

function tryCompress(raw, compress) {
  if (raw.length > MAX_DECOMPRESSED_PROPERTIES) return { error: 'over-4mb' };
  const compressed = compress(raw);
  if (!compressed || compressed.length >= raw.length) return { bytes: null };
  if (Math.floor(raw.length / compressed.length) > MAX_COMPRESSION_RATIO) return { error: 'ratio' };
  return { bytes: compressed };
}

// Same order as Inscription::encode_properties: inline, packed, then the
// compressed forms. min_by_key keeps the earlier candidate when lengths tie.
// A ratio or size failure aborts the compress path the way `?` does in ord,
// and the uncompressed choice is what ord keeps when --compress is off.
export function choosePropertiesBytes(inline, packed, compress) {
  const rawCandidates = [];
  if (inline) rawCandidates.push({ bytes: inline, encoding: 'inline', compressed: false });
  if (packed) rawCandidates.push({ bytes: packed, encoding: 'packed', compressed: false });
  if (!rawCandidates.length) return { raw: null, chosen: null, compressError: null };
  const raw = rawCandidates.reduce((best, item) => (item.bytes.length < best.bytes.length ? item : best));
  let compressError = null;
  const compressedCandidates = [];
  if (typeof compress === 'function') {
    for (const candidate of rawCandidates) {
      const result = tryCompress(candidate.bytes, compress);
      if (result.error) {
        compressError = result.error;
        break;
      }
      if (result.bytes) {
        compressedCandidates.push({ bytes: result.bytes, encoding: candidate.encoding, compressed: true });
      }
    }
  }
  const pool = compressError ? rawCandidates : rawCandidates.concat(compressedCandidates);
  const chosen = pool.reduce((best, item) => (item.bytes.length < best.bytes.length ? item : best));
  return { raw, chosen, compressError };
}

function quietIdBytes(id) {
  const info = console.info;
  console.info = () => {};
  try {
    return encodeParentTag3(id);
  } finally {
    console.info = info;
  }
}

function galleryItem(item, dropTitles, dropTraits, traitNotes) {
  if (!isValidInscriptionId(item?.id)) return null;
  const parsed = parseInscriptionId(item.id);
  if (!parsed || !Number.isSafeInteger(parsed.index) || parsed.index < 0 || parsed.index > MAX_U32) return null;
  const traits = [];
  if (!dropTraits) {
    for (const [name, value] of Object.entries(item.t || {})) {
      const trait = asTrait(value);
      if (trait === undefined) {
        traitNotes.push({ name: String(name), n: item.n });
        continue;
      }
      traits.push([String(name), trait]);
    }
  }
  const title = !dropTitles && typeof item.name === 'string' && item.name !== '' ? item.name : null;
  return { idBytes: quietIdBytes(item.id), index: parsed.index, title, traits };
}

function sizeOf(items, compress) {
  if (!items.length) {
    return { rawBytes: 0, encoding: null, compressedBytes: null, compressError: null, bytes: null, brotliLimited: false };
  }
  const encoded = encodeProperties({ items });
  const choice = choosePropertiesBytes(encoded.inline, encoded.packed, compress);
  const compressedBytes = !choice.compressError && choice.chosen.compressed ? choice.chosen.bytes.length : null;
  return {
    rawBytes: choice.raw.bytes.length,
    encoding: choice.raw.encoding,
    compressedBytes,
    compressError: choice.compressError,
    bytes: choice.raw.bytes,
    brotliLimited: choice.raw.bytes.length < 64,
  };
}

export function estimateGallery(data, options = {}) {
  const dropTitles = Boolean(options.dropTitles);
  const dropTraits = Boolean(options.dropTraits);
  const compress = options.compress === undefined ? estimateBrotliSize : options.compress;
  const validation = MetadataValidator.validateJSONMetadata(data);
  let normalized = [];
  let normalizeError = null;
  try {
    normalized = normalizeCollection(data);
  } catch (err) {
    normalizeError = err instanceof Error ? err.message : 'Collection file must be a JSON array.';
  }
  const traitNotes = [];
  const selectedItems = [];
  let leftOut = 0;
  for (const item of normalized) {
    const gallery = galleryItem(item, dropTitles, dropTraits, traitNotes);
    if (!gallery) leftOut += 1;
    else selectedItems.push(gallery);
  }
  const titlesDropped = [];
  const traitsDropped = [];
  for (const item of normalized) {
    const withoutTitles = galleryItem(item, true, false, []);
    const withoutTraits = galleryItem(item, false, true, []);
    if (withoutTitles) titlesDropped.push(withoutTitles);
    if (withoutTraits) traitsDropped.push(withoutTraits);
  }
  const idIssues = [
    ...validation.errors.filter((row) => row.field === 'id'),
    ...validation.warnings.filter((row) => row.field === 'id'),
  ];
  return {
    ordVersion: ORD_VERSION,
    brotli: BROTLI_ESTIMATE,
    limit: STANDARD_TX_BYTES,
    ok: !normalizeError && Array.isArray(data),
    normalizeError,
    itemCount: selectedItems.length,
    leftOut,
    idIssues,
    traitNotes,
    selected: sizeOf(selectedItems, compress),
    titlesDropped: sizeOf(titlesDropped, compress),
    traitsDropped: sizeOf(traitsDropped, compress),
  };
}
