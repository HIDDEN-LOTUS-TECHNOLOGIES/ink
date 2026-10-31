// Browser CBOR encoder for ordinals Tag 5 metadata.
// Replaces the Node `cbor` package used by packz-framework src/utils/ordinals/cborGenerator.ts.
// HTML script-tag embedding is intentionally not ported.

const textEncoder = new TextEncoder();

function concat(parts) {
  const len = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

function head(major, n) {
  if (n < 24) return Uint8Array.of((major << 5) | n);
  if (n < 0x100) return Uint8Array.of((major << 5) | 24, n);
  if (n < 0x10000) return Uint8Array.of((major << 5) | 25, n >> 8, n & 0xff);
  if (n < 0x100000000) {
    const b = new Uint8Array(5);
    b[0] = (major << 5) | 26;
    new DataView(b.buffer).setUint32(1, n);
    return b;
  }
  const b = new Uint8Array(9);
  b[0] = (major << 5) | 27;
  const hi = Math.floor(n / 0x100000000);
  const lo = n >>> 0;
  const view = new DataView(b.buffer);
  view.setUint32(1, hi);
  view.setUint32(5, lo);
  return b;
}

export function encodeCbor(value) {
  if (value === null || value === undefined) return Uint8Array.of(0xf6);
  if (value === false) return Uint8Array.of(0xf4);
  if (value === true) return Uint8Array.of(0xf5);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('CBOR encoding failed: non-finite number');
    if (Number.isInteger(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER) {
      if (value >= 0) return head(0, value);
      return head(1, -1 - value);
    }
    const b = new Uint8Array(9);
    b[0] = 0xfb;
    new DataView(b.buffer).setFloat64(1, value);
    return b;
  }
  if (typeof value === 'string') return concat([head(3, textEncoder.encode(value).length), textEncoder.encode(value)]);
  if (value instanceof Uint8Array) return concat([head(2, value.length), value]);
  if (Array.isArray(value)) return concat([head(4, value.length), ...value.map(encodeCbor)]);
  if (typeof value === 'object') {
    const keys = Object.keys(value).filter((k) => value[k] !== undefined);
    return concat([head(5, keys.length), ...keys.flatMap((k) => [encodeCbor(k), encodeCbor(value[k])])]);
  }
  throw new Error(`CBOR encoding failed: unsupported value ${typeof value}`);
}

export function decodeCbor(bytes) {
  const view = bytes instanceof DataView ? bytes : new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let o = 0;
  function read(n) {
    const out = new Uint8Array(n);
    for (let i = 0; i < n; i++) out[i] = view.getUint8(o++);
    return out;
  }
  function readLen(ai) {
    if (ai < 24) return ai;
    if (ai === 24) return view.getUint8(o++);
    if (ai === 25) { const n = view.getUint16(o); o += 2; return n; }
    if (ai === 26) { const n = view.getUint32(o); o += 4; return n; }
    throw new Error('CBOR length too large');
  }
  function val() {
    const b = view.getUint8(o++);
    const major = b >> 5;
    const ai = b & 31;
    if (major === 0) return readLen(ai);
    if (major === 1) return -1 - readLen(ai);
    if (major === 2) return read(readLen(ai));
    if (major === 3) return new TextDecoder().decode(read(readLen(ai)));
    if (major === 4) {
      const n = readLen(ai);
      const arr = [];
      for (let i = 0; i < n; i++) arr.push(val());
      return arr;
    }
    if (major === 5) {
      const n = readLen(ai);
      const obj = {};
      for (let i = 0; i < n; i++) {
        const k = val();
        obj[k] = val();
      }
      return obj;
    }
    if (major === 7 && ai === 20) return false;
    if (major === 7 && ai === 21) return true;
    if (major === 7 && ai === 22) return null;
    if (major === 7 && ai === 27) { const n = view.getFloat64(o); o += 8; return n; }
    throw new Error(`CBOR decode failed at major ${major}`);
  }
  const value = val();
  if (o !== bytes.length) throw new Error('CBOR decode did not consume the buffer');
  return value;
}

export function toHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Witness-discount estimate for carrying these metadata bytes as Tag 5. */
export function estimateAddedVbytes(byteLength) {
  let pushes = 0;
  let left = byteLength;
  if (left === 0) pushes = 1;
  while (left > 0) {
    const n = Math.min(520, left);
    pushes += n < 76 ? 1 : n < 256 ? 2 : 3;
    left -= n;
  }
  return Math.ceil((byteLength + pushes + 1) / 4);
}

export class CBORGenerator {
  constructor(config) {
    this.config = config;
  }

  generateMetadata(tokenId, traits, options = {}) {
    const metadata = { name: `${this.config.collectionName} #${tokenId}`, attributes: traits };
    if (options.description || this.config.collectionDescription) metadata.description = options.description || this.config.collectionDescription;
    if (options.image) metadata.image = options.image;
    else if (this.config.useRecursiveImages) metadata.image = 'recursive://collection-layers';
    if (options.animationUrl) metadata.animation_url = options.animationUrl;
    if (this.config.websiteUrl) metadata.external_url = this.config.websiteUrl;
    if (options.backgroundColor) metadata.background_color = options.backgroundColor;
    return metadata;
  }

  encodeCBOR(metadata) {
    try {
      const clean = JSON.parse(JSON.stringify(metadata));
      const bytes = encodeCbor(clean);
      console.info('Generated CBOR metadata', { name: metadata.name, attributes: metadata.attributes.length, size: bytes.length });
      return bytes;
    } catch (error) {
      console.error('Failed to encode CBOR metadata', error);
      throw new Error(`CBOR encoding failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  validateMetadata(metadata) {
    const errors = [];
    if (!metadata.name) errors.push('Missing name field');
    if (!metadata.attributes || !Array.isArray(metadata.attributes)) errors.push('Missing or invalid attributes array');
    else metadata.attributes.forEach((attr, index) => {
      if (!attr.trait_type) errors.push(`Attribute ${index}: missing trait_type`);
      if (attr.value === undefined || attr.value === null) errors.push(`Attribute ${index}: missing value`);
    });
    return { valid: errors.length === 0, errors };
  }
}

export const cborUtils = {
  calculateSize(metadata) {
    return new TextEncoder().encode(JSON.stringify(metadata)).length;
  },
  metadataBytes(metadata) {
    return encodeCbor(JSON.parse(JSON.stringify(metadata)));
  },
  createAttribute(traitType, value, rarity) {
    return { trait_type: traitType, value: String(value), rarity, display_type: typeof value === 'number' ? 'number' : 'string' };
  },
};
