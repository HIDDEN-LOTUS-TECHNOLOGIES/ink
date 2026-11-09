// CBOR decoder for ordinals metadata, inverted from the kit encoder in kit/cbor.js.
// Tags are unwrapped. Maps keep untrusted keys off Object.prototype.

function concatBytes(parts) {
  const len = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(len);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function assignKey(obj, key, value) {
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
    Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
    return;
  }
  obj[key] = value;
}

function keyToString(key) {
  if (typeof key === 'string') return key;
  if (typeof key === 'number' || typeof key === 'boolean' || key == null) return String(key);
  if (key instanceof Uint8Array) return [...key].map((b) => b.toString(16).padStart(2, '0')).join('');
  try {
    return JSON.stringify(key);
  } catch {
    return 'key';
  }
}

function float16(half) {
  const sign = half & 0x8000 ? -1 : 1;
  const exp = (half >> 10) & 0x1f;
  const frac = half & 0x3ff;
  if (exp === 0) return sign * (frac / 1024) * 2 ** -14;
  if (exp === 31) return frac ? Number.NaN : sign * Number.POSITIVE_INFINITY;
  return sign * (1 + frac / 1024) * 2 ** (exp - 15);
}

export function decodeCbor(bytes) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let o = 0;

  function need(n) {
    if (o + n > view.length) throw new Error('CBOR decode ran past the end');
  }

  function u8() {
    need(1);
    return view[o++];
  }

  function readLen(ai) {
    if (ai < 24) return ai;
    if (ai === 24) return u8();
    if (ai === 25) {
      need(2);
      const n = (view[o] << 8) | view[o + 1];
      o += 2;
      return n;
    }
    if (ai === 26) {
      need(4);
      const n = view[o] * 0x1000000 + (view[o + 1] << 16) + (view[o + 2] << 8) + view[o + 3];
      o += 4;
      return n >>> 0;
    }
    if (ai === 27) {
      need(8);
      let n = 0n;
      for (let i = 0; i < 8; i++) n = (n << 8n) + BigInt(view[o++]);
      if (n > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('CBOR integer is too large');
      return Number(n);
    }
    throw new Error('CBOR additional info is reserved');
  }

  function readBytes(n) {
    need(n);
    const out = view.slice(o, o + n);
    o += n;
    return out;
  }

  function atBreak() {
    if (o >= view.length) throw new Error('CBOR decode ran past the end');
    if (view[o] !== 0xff) return false;
    o += 1;
    return true;
  }

  function readIndefinite(major) {
    if (major === 2 || major === 3) {
      const parts = [];
      while (!atBreak()) {
        const chunk = readValue();
        if (major === 2 && !(chunk instanceof Uint8Array)) throw new Error('CBOR byte string chunk is not bytes');
        if (major === 3 && typeof chunk !== 'string') throw new Error('CBOR text chunk is not text');
        parts.push(chunk);
      }
      return major === 2 ? concatBytes(parts) : parts.join('');
    }
    if (major === 4) {
      const arr = [];
      while (!atBreak()) arr.push(readValue());
      return arr;
    }
    if (major === 5) {
      const obj = {};
      while (!atBreak()) {
        const key = keyToString(readValue());
        assignKey(obj, key, readValue());
      }
      return obj;
    }
    throw new Error('CBOR indefinite length is not allowed here');
  }

  function readValue() {
    const b = u8();
    if (b === 0xff) throw new Error('CBOR unexpected break');
    const major = b >> 5;
    const ai = b & 31;
    if (ai === 31) return readIndefinite(major);
    if (major === 0) return readLen(ai);
    if (major === 1) {
      const n = -1 - readLen(ai);
      if (!Number.isSafeInteger(n)) throw new Error('CBOR integer is too large');
      return n;
    }
    if (major === 2) return readBytes(readLen(ai));
    if (major === 3) return new TextDecoder().decode(readBytes(readLen(ai)));
    if (major === 4) {
      const n = readLen(ai);
      const arr = [];
      for (let i = 0; i < n; i++) arr.push(readValue());
      return arr;
    }
    if (major === 5) {
      const n = readLen(ai);
      const obj = {};
      for (let i = 0; i < n; i++) {
        const key = keyToString(readValue());
        assignKey(obj, key, readValue());
      }
      return obj;
    }
    if (major === 6) {
      readLen(ai);
      return readValue();
    }
    if (major === 7) {
      if (ai === 20) return false;
      if (ai === 21) return true;
      if (ai === 22 || ai === 23) return null;
      if (ai === 25) {
        need(2);
        const half = (view[o] << 8) | view[o + 1];
        o += 2;
        return float16(half);
      }
      if (ai === 26) {
        const raw = readBytes(4);
        return new DataView(raw.buffer, raw.byteOffset, 4).getFloat32(0);
      }
      if (ai === 27) {
        const raw = readBytes(8);
        return new DataView(raw.buffer, raw.byteOffset, 8).getFloat64(0);
      }
    }
    throw new Error(`CBOR decode failed at major ${major}`);
  }

  const value = readValue();
  if (o !== view.length) throw new Error('CBOR decode did not consume the buffer');
  return value;
}
