/* Signet only. Bundled micro-ordinals@0.4.0, @scure/btc-signer@2.2.0 (paulmillr), and @sats-connect/core@0.19.0. */
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod2) => function __require() {
  try {
    return mod2 || (0, cb[__getOwnPropNames(cb)[0]])((mod2 = { exports: {} }).exports, mod2), mod2.exports;
  } catch (e) {
    throw mod2 = 0, e;
  }
};
var __export = (target, all3) => {
  for (var name in all3)
    __defProp(target, name, { get: all3[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod2, isNodeMode, target) => (target = mod2 != null ? __create(__getProtoOf(mod2)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod2 || !mod2.__esModule ? __defProp(target, "default", { value: mod2, enumerable: true }) : target,
  mod2
));

// node_modules/bech32/dist/index.js
var require_dist = __commonJS({
  "node_modules/bech32/dist/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.bech32m = exports.bech32 = void 0;
    var ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
    var ALPHABET_MAP = {};
    for (let z = 0; z < ALPHABET.length; z++) {
      const x = ALPHABET.charAt(z);
      ALPHABET_MAP[x] = z;
    }
    function polymodStep(pre) {
      const b = pre >> 25;
      return (pre & 33554431) << 5 ^ -(b >> 0 & 1) & 996825010 ^ -(b >> 1 & 1) & 642813549 ^ -(b >> 2 & 1) & 513874426 ^ -(b >> 3 & 1) & 1027748829 ^ -(b >> 4 & 1) & 705979059;
    }
    function prefixChk(prefix2) {
      let chk = 1;
      for (let i = 0; i < prefix2.length; ++i) {
        const c = prefix2.charCodeAt(i);
        if (c < 33 || c > 126)
          return "Invalid prefix (" + prefix2 + ")";
        chk = polymodStep(chk) ^ c >> 5;
      }
      chk = polymodStep(chk);
      for (let i = 0; i < prefix2.length; ++i) {
        const v = prefix2.charCodeAt(i);
        chk = polymodStep(chk) ^ v & 31;
      }
      return chk;
    }
    function convert(data, inBits, outBits, pad) {
      let value = 0;
      let bits2 = 0;
      const maxV = (1 << outBits) - 1;
      const result = [];
      for (let i = 0; i < data.length; ++i) {
        value = value << inBits | data[i];
        bits2 += inBits;
        while (bits2 >= outBits) {
          bits2 -= outBits;
          result.push(value >> bits2 & maxV);
        }
      }
      if (pad) {
        if (bits2 > 0) {
          result.push(value << outBits - bits2 & maxV);
        }
      } else {
        if (bits2 >= inBits)
          return "Excess padding";
        if (value << outBits - bits2 & maxV)
          return "Non-zero padding";
      }
      return result;
    }
    function toWords(bytes) {
      return convert(bytes, 8, 5, true);
    }
    function fromWordsUnsafe(words) {
      const res = convert(words, 5, 8, false);
      if (Array.isArray(res))
        return res;
    }
    function fromWords(words) {
      const res = convert(words, 5, 8, false);
      if (Array.isArray(res))
        return res;
      throw new Error(res);
    }
    function getLibraryFromEncoding(encoding) {
      let ENCODING_CONST;
      if (encoding === "bech32") {
        ENCODING_CONST = 1;
      } else {
        ENCODING_CONST = 734539939;
      }
      function encode3(prefix2, words, LIMIT) {
        LIMIT = LIMIT || 90;
        if (prefix2.length + 7 + words.length > LIMIT)
          throw new TypeError("Exceeds length limit");
        prefix2 = prefix2.toLowerCase();
        let chk = prefixChk(prefix2);
        if (typeof chk === "string")
          throw new Error(chk);
        let result = prefix2 + "1";
        for (let i = 0; i < words.length; ++i) {
          const x = words[i];
          if (x >> 5 !== 0)
            throw new Error("Non 5-bit word");
          chk = polymodStep(chk) ^ x;
          result += ALPHABET.charAt(x);
        }
        for (let i = 0; i < 6; ++i) {
          chk = polymodStep(chk);
        }
        chk ^= ENCODING_CONST;
        for (let i = 0; i < 6; ++i) {
          const v = chk >> (5 - i) * 5 & 31;
          result += ALPHABET.charAt(v);
        }
        return result;
      }
      function __decode(str, LIMIT) {
        LIMIT = LIMIT || 90;
        if (str.length < 8)
          return str + " too short";
        if (str.length > LIMIT)
          return "Exceeds length limit";
        const lowered = str.toLowerCase();
        const uppered = str.toUpperCase();
        if (str !== lowered && str !== uppered)
          return "Mixed-case string " + str;
        str = lowered;
        const split = str.lastIndexOf("1");
        if (split === -1)
          return "No separator character for " + str;
        if (split === 0)
          return "Missing prefix for " + str;
        const prefix2 = str.slice(0, split);
        const wordChars = str.slice(split + 1);
        if (wordChars.length < 6)
          return "Data too short";
        let chk = prefixChk(prefix2);
        if (typeof chk === "string")
          return chk;
        const words = [];
        for (let i = 0; i < wordChars.length; ++i) {
          const c = wordChars.charAt(i);
          const v = ALPHABET_MAP[c];
          if (v === void 0)
            return "Unknown character " + c;
          chk = polymodStep(chk) ^ v;
          if (i + 6 >= wordChars.length)
            continue;
          words.push(v);
        }
        if (chk !== ENCODING_CONST)
          return "Invalid checksum for " + str;
        return { prefix: prefix2, words };
      }
      function decodeUnsafe(str, LIMIT) {
        const res = __decode(str, LIMIT);
        if (typeof res === "object")
          return res;
      }
      function decode(str, LIMIT) {
        const res = __decode(str, LIMIT);
        if (typeof res === "object")
          return res;
        throw new Error(res);
      }
      return {
        decodeUnsafe,
        decode,
        encode: encode3,
        toWords,
        fromWordsUnsafe,
        fromWords
      };
    }
    exports.bech32 = getLibraryFromEncoding("bech32");
    exports.bech32m = getLibraryFromEncoding("bech32m");
  }
});

// node_modules/base64-js/index.js
var require_base64_js = __commonJS({
  "node_modules/base64-js/index.js"(exports) {
    "use strict";
    exports.byteLength = byteLength;
    exports.toByteArray = toByteArray;
    exports.fromByteArray = fromByteArray;
    var lookup = [];
    var revLookup = [];
    var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
    var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for (i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i];
      revLookup[code.charCodeAt(i)] = i;
    }
    var i;
    var len;
    revLookup["-".charCodeAt(0)] = 62;
    revLookup["_".charCodeAt(0)] = 63;
    function getLens(b64) {
      var len2 = b64.length;
      if (len2 % 4 > 0) {
        throw new Error("Invalid string. Length must be a multiple of 4");
      }
      var validLen = b64.indexOf("=");
      if (validLen === -1) validLen = len2;
      var placeHoldersLen = validLen === len2 ? 0 : 4 - validLen % 4;
      return [validLen, placeHoldersLen];
    }
    function byteLength(b64) {
      var lens = getLens(b64);
      var validLen = lens[0];
      var placeHoldersLen = lens[1];
      return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
    }
    function _byteLength(b64, validLen, placeHoldersLen) {
      return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
    }
    function toByteArray(b64) {
      var tmp;
      var lens = getLens(b64);
      var validLen = lens[0];
      var placeHoldersLen = lens[1];
      var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
      var curByte = 0;
      var len2 = placeHoldersLen > 0 ? validLen - 4 : validLen;
      var i2;
      for (i2 = 0; i2 < len2; i2 += 4) {
        tmp = revLookup[b64.charCodeAt(i2)] << 18 | revLookup[b64.charCodeAt(i2 + 1)] << 12 | revLookup[b64.charCodeAt(i2 + 2)] << 6 | revLookup[b64.charCodeAt(i2 + 3)];
        arr[curByte++] = tmp >> 16 & 255;
        arr[curByte++] = tmp >> 8 & 255;
        arr[curByte++] = tmp & 255;
      }
      if (placeHoldersLen === 2) {
        tmp = revLookup[b64.charCodeAt(i2)] << 2 | revLookup[b64.charCodeAt(i2 + 1)] >> 4;
        arr[curByte++] = tmp & 255;
      }
      if (placeHoldersLen === 1) {
        tmp = revLookup[b64.charCodeAt(i2)] << 10 | revLookup[b64.charCodeAt(i2 + 1)] << 4 | revLookup[b64.charCodeAt(i2 + 2)] >> 2;
        arr[curByte++] = tmp >> 8 & 255;
        arr[curByte++] = tmp & 255;
      }
      return arr;
    }
    function tripletToBase64(num2) {
      return lookup[num2 >> 18 & 63] + lookup[num2 >> 12 & 63] + lookup[num2 >> 6 & 63] + lookup[num2 & 63];
    }
    function encodeChunk(uint8, start, end) {
      var tmp;
      var output = [];
      for (var i2 = start; i2 < end; i2 += 3) {
        tmp = (uint8[i2] << 16 & 16711680) + (uint8[i2 + 1] << 8 & 65280) + (uint8[i2 + 2] & 255);
        output.push(tripletToBase64(tmp));
      }
      return output.join("");
    }
    function fromByteArray(uint8) {
      var tmp;
      var len2 = uint8.length;
      var extraBytes = len2 % 3;
      var parts = [];
      var maxChunkLength = 16383;
      for (var i2 = 0, len22 = len2 - extraBytes; i2 < len22; i2 += maxChunkLength) {
        parts.push(encodeChunk(uint8, i2, i2 + maxChunkLength > len22 ? len22 : i2 + maxChunkLength));
      }
      if (extraBytes === 1) {
        tmp = uint8[len2 - 1];
        parts.push(
          lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "=="
        );
      } else if (extraBytes === 2) {
        tmp = (uint8[len2 - 2] << 8) + uint8[len2 - 1];
        parts.push(
          lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "="
        );
      }
      return parts.join("");
    }
  }
});

// node_modules/ieee754/index.js
var require_ieee754 = __commonJS({
  "node_modules/ieee754/index.js"(exports) {
    exports.read = function(buffer, offset, isLE, mLen, nBytes) {
      var e, m;
      var eLen = nBytes * 8 - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var nBits = -7;
      var i = isLE ? nBytes - 1 : 0;
      var d = isLE ? -1 : 1;
      var s = buffer[offset + i];
      i += d;
      e = s & (1 << -nBits) - 1;
      s >>= -nBits;
      nBits += eLen;
      for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {
      }
      m = e & (1 << -nBits) - 1;
      e >>= -nBits;
      nBits += mLen;
      for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {
      }
      if (e === 0) {
        e = 1 - eBias;
      } else if (e === eMax) {
        return m ? NaN : (s ? -1 : 1) * Infinity;
      } else {
        m = m + Math.pow(2, mLen);
        e = e - eBias;
      }
      return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
    };
    exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
      var e, m, c;
      var eLen = nBytes * 8 - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
      var i = isLE ? 0 : nBytes - 1;
      var d = isLE ? 1 : -1;
      var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
      value = Math.abs(value);
      if (isNaN(value) || value === Infinity) {
        m = isNaN(value) ? 1 : 0;
        e = eMax;
      } else {
        e = Math.floor(Math.log(value) / Math.LN2);
        if (value * (c = Math.pow(2, -e)) < 1) {
          e--;
          c *= 2;
        }
        if (e + eBias >= 1) {
          value += rt / c;
        } else {
          value += rt * Math.pow(2, 1 - eBias);
        }
        if (value * c >= 2) {
          e++;
          c /= 2;
        }
        if (e + eBias >= eMax) {
          m = 0;
          e = eMax;
        } else if (e + eBias >= 1) {
          m = (value * c - 1) * Math.pow(2, mLen);
          e = e + eBias;
        } else {
          m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
          e = 0;
        }
      }
      for (; mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8) {
      }
      e = e << mLen | m;
      eLen += mLen;
      for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8) {
      }
      buffer[offset + i - d] |= s * 128;
    };
  }
});

// node_modules/buffer/index.js
var require_buffer = __commonJS({
  "node_modules/buffer/index.js"(exports) {
    "use strict";
    var base64 = require_base64_js();
    var ieee754 = require_ieee754();
    var customInspectSymbol = typeof Symbol === "function" && typeof Symbol["for"] === "function" ? Symbol["for"]("nodejs.util.inspect.custom") : null;
    exports.Buffer = Buffer3;
    exports.SlowBuffer = SlowBuffer;
    exports.INSPECT_MAX_BYTES = 50;
    var K_MAX_LENGTH = 2147483647;
    exports.kMaxLength = K_MAX_LENGTH;
    Buffer3.TYPED_ARRAY_SUPPORT = typedArraySupport();
    if (!Buffer3.TYPED_ARRAY_SUPPORT && typeof console !== "undefined" && typeof console.error === "function") {
      console.error(
        "This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."
      );
    }
    function typedArraySupport() {
      try {
        const arr = new Uint8Array(1);
        const proto = { foo: function() {
          return 42;
        } };
        Object.setPrototypeOf(proto, Uint8Array.prototype);
        Object.setPrototypeOf(arr, proto);
        return arr.foo() === 42;
      } catch (e) {
        return false;
      }
    }
    Object.defineProperty(Buffer3.prototype, "parent", {
      enumerable: true,
      get: function() {
        if (!Buffer3.isBuffer(this)) return void 0;
        return this.buffer;
      }
    });
    Object.defineProperty(Buffer3.prototype, "offset", {
      enumerable: true,
      get: function() {
        if (!Buffer3.isBuffer(this)) return void 0;
        return this.byteOffset;
      }
    });
    function createBuffer(length2) {
      if (length2 > K_MAX_LENGTH) {
        throw new RangeError('The value "' + length2 + '" is invalid for option "size"');
      }
      const buf = new Uint8Array(length2);
      Object.setPrototypeOf(buf, Buffer3.prototype);
      return buf;
    }
    function Buffer3(arg, encodingOrOffset, length2) {
      if (typeof arg === "number") {
        if (typeof encodingOrOffset === "string") {
          throw new TypeError(
            'The "string" argument must be of type string. Received type number'
          );
        }
        return allocUnsafe(arg);
      }
      return from(arg, encodingOrOffset, length2);
    }
    Buffer3.poolSize = 8192;
    function from(value, encodingOrOffset, length2) {
      if (typeof value === "string") {
        return fromString(value, encodingOrOffset);
      }
      if (ArrayBuffer.isView(value)) {
        return fromArrayView(value);
      }
      if (value == null) {
        throw new TypeError(
          "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value
        );
      }
      if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer)) {
        return fromArrayBuffer(value, encodingOrOffset, length2);
      }
      if (typeof SharedArrayBuffer !== "undefined" && (isInstance(value, SharedArrayBuffer) || value && isInstance(value.buffer, SharedArrayBuffer))) {
        return fromArrayBuffer(value, encodingOrOffset, length2);
      }
      if (typeof value === "number") {
        throw new TypeError(
          'The "value" argument must not be of type number. Received type number'
        );
      }
      const valueOf = value.valueOf && value.valueOf();
      if (valueOf != null && valueOf !== value) {
        return Buffer3.from(valueOf, encodingOrOffset, length2);
      }
      const b = fromObject(value);
      if (b) return b;
      if (typeof Symbol !== "undefined" && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === "function") {
        return Buffer3.from(value[Symbol.toPrimitive]("string"), encodingOrOffset, length2);
      }
      throw new TypeError(
        "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value
      );
    }
    Buffer3.from = function(value, encodingOrOffset, length2) {
      return from(value, encodingOrOffset, length2);
    };
    Object.setPrototypeOf(Buffer3.prototype, Uint8Array.prototype);
    Object.setPrototypeOf(Buffer3, Uint8Array);
    function assertSize(size) {
      if (typeof size !== "number") {
        throw new TypeError('"size" argument must be of type number');
      } else if (size < 0) {
        throw new RangeError('The value "' + size + '" is invalid for option "size"');
      }
    }
    function alloc(size, fill, encoding) {
      assertSize(size);
      if (size <= 0) {
        return createBuffer(size);
      }
      if (fill !== void 0) {
        return typeof encoding === "string" ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
      }
      return createBuffer(size);
    }
    Buffer3.alloc = function(size, fill, encoding) {
      return alloc(size, fill, encoding);
    };
    function allocUnsafe(size) {
      assertSize(size);
      return createBuffer(size < 0 ? 0 : checked(size) | 0);
    }
    Buffer3.allocUnsafe = function(size) {
      return allocUnsafe(size);
    };
    Buffer3.allocUnsafeSlow = function(size) {
      return allocUnsafe(size);
    };
    function fromString(string3, encoding) {
      if (typeof encoding !== "string" || encoding === "") {
        encoding = "utf8";
      }
      if (!Buffer3.isEncoding(encoding)) {
        throw new TypeError("Unknown encoding: " + encoding);
      }
      const length2 = byteLength(string3, encoding) | 0;
      let buf = createBuffer(length2);
      const actual = buf.write(string3, encoding);
      if (actual !== length2) {
        buf = buf.slice(0, actual);
      }
      return buf;
    }
    function fromArrayLike(array3) {
      const length2 = array3.length < 0 ? 0 : checked(array3.length) | 0;
      const buf = createBuffer(length2);
      for (let i = 0; i < length2; i += 1) {
        buf[i] = array3[i] & 255;
      }
      return buf;
    }
    function fromArrayView(arrayView) {
      if (isInstance(arrayView, Uint8Array)) {
        const copy = new Uint8Array(arrayView);
        return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength);
      }
      return fromArrayLike(arrayView);
    }
    function fromArrayBuffer(array3, byteOffset, length2) {
      if (byteOffset < 0 || array3.byteLength < byteOffset) {
        throw new RangeError('"offset" is outside of buffer bounds');
      }
      if (array3.byteLength < byteOffset + (length2 || 0)) {
        throw new RangeError('"length" is outside of buffer bounds');
      }
      let buf;
      if (byteOffset === void 0 && length2 === void 0) {
        buf = new Uint8Array(array3);
      } else if (length2 === void 0) {
        buf = new Uint8Array(array3, byteOffset);
      } else {
        buf = new Uint8Array(array3, byteOffset, length2);
      }
      Object.setPrototypeOf(buf, Buffer3.prototype);
      return buf;
    }
    function fromObject(obj) {
      if (Buffer3.isBuffer(obj)) {
        const len = checked(obj.length) | 0;
        const buf = createBuffer(len);
        if (buf.length === 0) {
          return buf;
        }
        obj.copy(buf, 0, 0, len);
        return buf;
      }
      if (obj.length !== void 0) {
        if (typeof obj.length !== "number" || numberIsNaN(obj.length)) {
          return createBuffer(0);
        }
        return fromArrayLike(obj);
      }
      if (obj.type === "Buffer" && Array.isArray(obj.data)) {
        return fromArrayLike(obj.data);
      }
    }
    function checked(length2) {
      if (length2 >= K_MAX_LENGTH) {
        throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + K_MAX_LENGTH.toString(16) + " bytes");
      }
      return length2 | 0;
    }
    function SlowBuffer(length2) {
      if (+length2 != length2) {
        length2 = 0;
      }
      return Buffer3.alloc(+length2);
    }
    Buffer3.isBuffer = function isBuffer2(b) {
      return b != null && b._isBuffer === true && b !== Buffer3.prototype;
    };
    Buffer3.compare = function compare(a, b) {
      if (isInstance(a, Uint8Array)) a = Buffer3.from(a, a.offset, a.byteLength);
      if (isInstance(b, Uint8Array)) b = Buffer3.from(b, b.offset, b.byteLength);
      if (!Buffer3.isBuffer(a) || !Buffer3.isBuffer(b)) {
        throw new TypeError(
          'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
        );
      }
      if (a === b) return 0;
      let x = a.length;
      let y = b.length;
      for (let i = 0, len = Math.min(x, y); i < len; ++i) {
        if (a[i] !== b[i]) {
          x = a[i];
          y = b[i];
          break;
        }
      }
      if (x < y) return -1;
      if (y < x) return 1;
      return 0;
    };
    Buffer3.isEncoding = function isEncoding(encoding) {
      switch (String(encoding).toLowerCase()) {
        case "hex":
        case "utf8":
        case "utf-8":
        case "ascii":
        case "latin1":
        case "binary":
        case "base64":
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return true;
        default:
          return false;
      }
    };
    Buffer3.concat = function concat(list, length2) {
      if (!Array.isArray(list)) {
        throw new TypeError('"list" argument must be an Array of Buffers');
      }
      if (list.length === 0) {
        return Buffer3.alloc(0);
      }
      let i;
      if (length2 === void 0) {
        length2 = 0;
        for (i = 0; i < list.length; ++i) {
          length2 += list[i].length;
        }
      }
      const buffer = Buffer3.allocUnsafe(length2);
      let pos = 0;
      for (i = 0; i < list.length; ++i) {
        let buf = list[i];
        if (isInstance(buf, Uint8Array)) {
          if (pos + buf.length > buffer.length) {
            if (!Buffer3.isBuffer(buf)) buf = Buffer3.from(buf);
            buf.copy(buffer, pos);
          } else {
            Uint8Array.prototype.set.call(
              buffer,
              buf,
              pos
            );
          }
        } else if (!Buffer3.isBuffer(buf)) {
          throw new TypeError('"list" argument must be an Array of Buffers');
        } else {
          buf.copy(buffer, pos);
        }
        pos += buf.length;
      }
      return buffer;
    };
    function byteLength(string3, encoding) {
      if (Buffer3.isBuffer(string3)) {
        return string3.length;
      }
      if (ArrayBuffer.isView(string3) || isInstance(string3, ArrayBuffer)) {
        return string3.byteLength;
      }
      if (typeof string3 !== "string") {
        throw new TypeError(
          'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof string3
        );
      }
      const len = string3.length;
      const mustMatch = arguments.length > 2 && arguments[2] === true;
      if (!mustMatch && len === 0) return 0;
      let loweredCase = false;
      for (; ; ) {
        switch (encoding) {
          case "ascii":
          case "latin1":
          case "binary":
            return len;
          case "utf8":
          case "utf-8":
            return utf8ToBytes(string3).length;
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return len * 2;
          case "hex":
            return len >>> 1;
          case "base64":
            return base64ToBytes2(string3).length;
          default:
            if (loweredCase) {
              return mustMatch ? -1 : utf8ToBytes(string3).length;
            }
            encoding = ("" + encoding).toLowerCase();
            loweredCase = true;
        }
      }
    }
    Buffer3.byteLength = byteLength;
    function slowToString(encoding, start, end) {
      let loweredCase = false;
      if (start === void 0 || start < 0) {
        start = 0;
      }
      if (start > this.length) {
        return "";
      }
      if (end === void 0 || end > this.length) {
        end = this.length;
      }
      if (end <= 0) {
        return "";
      }
      end >>>= 0;
      start >>>= 0;
      if (end <= start) {
        return "";
      }
      if (!encoding) encoding = "utf8";
      while (true) {
        switch (encoding) {
          case "hex":
            return hexSlice(this, start, end);
          case "utf8":
          case "utf-8":
            return utf8Slice(this, start, end);
          case "ascii":
            return asciiSlice(this, start, end);
          case "latin1":
          case "binary":
            return latin1Slice(this, start, end);
          case "base64":
            return base64Slice(this, start, end);
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return utf16leSlice(this, start, end);
          default:
            if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
            encoding = (encoding + "").toLowerCase();
            loweredCase = true;
        }
      }
    }
    Buffer3.prototype._isBuffer = true;
    function swap(b, n, m) {
      const i = b[n];
      b[n] = b[m];
      b[m] = i;
    }
    Buffer3.prototype.swap16 = function swap16() {
      const len = this.length;
      if (len % 2 !== 0) {
        throw new RangeError("Buffer size must be a multiple of 16-bits");
      }
      for (let i = 0; i < len; i += 2) {
        swap(this, i, i + 1);
      }
      return this;
    };
    Buffer3.prototype.swap32 = function swap322() {
      const len = this.length;
      if (len % 4 !== 0) {
        throw new RangeError("Buffer size must be a multiple of 32-bits");
      }
      for (let i = 0; i < len; i += 4) {
        swap(this, i, i + 3);
        swap(this, i + 1, i + 2);
      }
      return this;
    };
    Buffer3.prototype.swap64 = function swap64() {
      const len = this.length;
      if (len % 8 !== 0) {
        throw new RangeError("Buffer size must be a multiple of 64-bits");
      }
      for (let i = 0; i < len; i += 8) {
        swap(this, i, i + 7);
        swap(this, i + 1, i + 6);
        swap(this, i + 2, i + 5);
        swap(this, i + 3, i + 4);
      }
      return this;
    };
    Buffer3.prototype.toString = function toString3() {
      const length2 = this.length;
      if (length2 === 0) return "";
      if (arguments.length === 0) return utf8Slice(this, 0, length2);
      return slowToString.apply(this, arguments);
    };
    Buffer3.prototype.toLocaleString = Buffer3.prototype.toString;
    Buffer3.prototype.equals = function equals(b) {
      if (!Buffer3.isBuffer(b)) throw new TypeError("Argument must be a Buffer");
      if (this === b) return true;
      return Buffer3.compare(this, b) === 0;
    };
    Buffer3.prototype.inspect = function inspect() {
      let str = "";
      const max = exports.INSPECT_MAX_BYTES;
      str = this.toString("hex", 0, max).replace(/(.{2})/g, "$1 ").trim();
      if (this.length > max) str += " ... ";
      return "<Buffer " + str + ">";
    };
    if (customInspectSymbol) {
      Buffer3.prototype[customInspectSymbol] = Buffer3.prototype.inspect;
    }
    Buffer3.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
      if (isInstance(target, Uint8Array)) {
        target = Buffer3.from(target, target.offset, target.byteLength);
      }
      if (!Buffer3.isBuffer(target)) {
        throw new TypeError(
          'The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof target
        );
      }
      if (start === void 0) {
        start = 0;
      }
      if (end === void 0) {
        end = target ? target.length : 0;
      }
      if (thisStart === void 0) {
        thisStart = 0;
      }
      if (thisEnd === void 0) {
        thisEnd = this.length;
      }
      if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
        throw new RangeError("out of range index");
      }
      if (thisStart >= thisEnd && start >= end) {
        return 0;
      }
      if (thisStart >= thisEnd) {
        return -1;
      }
      if (start >= end) {
        return 1;
      }
      start >>>= 0;
      end >>>= 0;
      thisStart >>>= 0;
      thisEnd >>>= 0;
      if (this === target) return 0;
      let x = thisEnd - thisStart;
      let y = end - start;
      const len = Math.min(x, y);
      const thisCopy = this.slice(thisStart, thisEnd);
      const targetCopy = target.slice(start, end);
      for (let i = 0; i < len; ++i) {
        if (thisCopy[i] !== targetCopy[i]) {
          x = thisCopy[i];
          y = targetCopy[i];
          break;
        }
      }
      if (x < y) return -1;
      if (y < x) return 1;
      return 0;
    };
    function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
      if (buffer.length === 0) return -1;
      if (typeof byteOffset === "string") {
        encoding = byteOffset;
        byteOffset = 0;
      } else if (byteOffset > 2147483647) {
        byteOffset = 2147483647;
      } else if (byteOffset < -2147483648) {
        byteOffset = -2147483648;
      }
      byteOffset = +byteOffset;
      if (numberIsNaN(byteOffset)) {
        byteOffset = dir ? 0 : buffer.length - 1;
      }
      if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
      if (byteOffset >= buffer.length) {
        if (dir) return -1;
        else byteOffset = buffer.length - 1;
      } else if (byteOffset < 0) {
        if (dir) byteOffset = 0;
        else return -1;
      }
      if (typeof val === "string") {
        val = Buffer3.from(val, encoding);
      }
      if (Buffer3.isBuffer(val)) {
        if (val.length === 0) {
          return -1;
        }
        return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
      } else if (typeof val === "number") {
        val = val & 255;
        if (typeof Uint8Array.prototype.indexOf === "function") {
          if (dir) {
            return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
          } else {
            return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
          }
        }
        return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
      }
      throw new TypeError("val must be string, number or Buffer");
    }
    function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
      let indexSize = 1;
      let arrLength = arr.length;
      let valLength = val.length;
      if (encoding !== void 0) {
        encoding = String(encoding).toLowerCase();
        if (encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
          if (arr.length < 2 || val.length < 2) {
            return -1;
          }
          indexSize = 2;
          arrLength /= 2;
          valLength /= 2;
          byteOffset /= 2;
        }
      }
      function read(buf, i2) {
        if (indexSize === 1) {
          return buf[i2];
        } else {
          return buf.readUInt16BE(i2 * indexSize);
        }
      }
      let i;
      if (dir) {
        let foundIndex = -1;
        for (i = byteOffset; i < arrLength; i++) {
          if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
            if (foundIndex === -1) foundIndex = i;
            if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
          } else {
            if (foundIndex !== -1) i -= i - foundIndex;
            foundIndex = -1;
          }
        }
      } else {
        if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
        for (i = byteOffset; i >= 0; i--) {
          let found = true;
          for (let j = 0; j < valLength; j++) {
            if (read(arr, i + j) !== read(val, j)) {
              found = false;
              break;
            }
          }
          if (found) return i;
        }
      }
      return -1;
    }
    Buffer3.prototype.includes = function includes(val, byteOffset, encoding) {
      return this.indexOf(val, byteOffset, encoding) !== -1;
    };
    Buffer3.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
    };
    Buffer3.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
    };
    function hexWrite(buf, string3, offset, length2) {
      offset = Number(offset) || 0;
      const remaining = buf.length - offset;
      if (!length2) {
        length2 = remaining;
      } else {
        length2 = Number(length2);
        if (length2 > remaining) {
          length2 = remaining;
        }
      }
      const strLen = string3.length;
      if (length2 > strLen / 2) {
        length2 = strLen / 2;
      }
      let i;
      for (i = 0; i < length2; ++i) {
        const parsed = parseInt(string3.substr(i * 2, 2), 16);
        if (numberIsNaN(parsed)) return i;
        buf[offset + i] = parsed;
      }
      return i;
    }
    function utf8Write(buf, string3, offset, length2) {
      return blitBuffer(utf8ToBytes(string3, buf.length - offset), buf, offset, length2);
    }
    function asciiWrite(buf, string3, offset, length2) {
      return blitBuffer(asciiToBytes2(string3), buf, offset, length2);
    }
    function base64Write(buf, string3, offset, length2) {
      return blitBuffer(base64ToBytes2(string3), buf, offset, length2);
    }
    function ucs2Write(buf, string3, offset, length2) {
      return blitBuffer(utf16leToBytes(string3, buf.length - offset), buf, offset, length2);
    }
    Buffer3.prototype.write = function write(string3, offset, length2, encoding) {
      if (offset === void 0) {
        encoding = "utf8";
        length2 = this.length;
        offset = 0;
      } else if (length2 === void 0 && typeof offset === "string") {
        encoding = offset;
        length2 = this.length;
        offset = 0;
      } else if (isFinite(offset)) {
        offset = offset >>> 0;
        if (isFinite(length2)) {
          length2 = length2 >>> 0;
          if (encoding === void 0) encoding = "utf8";
        } else {
          encoding = length2;
          length2 = void 0;
        }
      } else {
        throw new Error(
          "Buffer.write(string, encoding, offset[, length]) is no longer supported"
        );
      }
      const remaining = this.length - offset;
      if (length2 === void 0 || length2 > remaining) length2 = remaining;
      if (string3.length > 0 && (length2 < 0 || offset < 0) || offset > this.length) {
        throw new RangeError("Attempt to write outside buffer bounds");
      }
      if (!encoding) encoding = "utf8";
      let loweredCase = false;
      for (; ; ) {
        switch (encoding) {
          case "hex":
            return hexWrite(this, string3, offset, length2);
          case "utf8":
          case "utf-8":
            return utf8Write(this, string3, offset, length2);
          case "ascii":
          case "latin1":
          case "binary":
            return asciiWrite(this, string3, offset, length2);
          case "base64":
            return base64Write(this, string3, offset, length2);
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return ucs2Write(this, string3, offset, length2);
          default:
            if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
            encoding = ("" + encoding).toLowerCase();
            loweredCase = true;
        }
      }
    };
    Buffer3.prototype.toJSON = function toJSON() {
      return {
        type: "Buffer",
        data: Array.prototype.slice.call(this._arr || this, 0)
      };
    };
    function base64Slice(buf, start, end) {
      if (start === 0 && end === buf.length) {
        return base64.fromByteArray(buf);
      } else {
        return base64.fromByteArray(buf.slice(start, end));
      }
    }
    function utf8Slice(buf, start, end) {
      end = Math.min(buf.length, end);
      const res = [];
      let i = start;
      while (i < end) {
        const firstByte = buf[i];
        let codePoint = null;
        let bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
        if (i + bytesPerSequence <= end) {
          let secondByte, thirdByte, fourthByte, tempCodePoint;
          switch (bytesPerSequence) {
            case 1:
              if (firstByte < 128) {
                codePoint = firstByte;
              }
              break;
            case 2:
              secondByte = buf[i + 1];
              if ((secondByte & 192) === 128) {
                tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
                if (tempCodePoint > 127) {
                  codePoint = tempCodePoint;
                }
              }
              break;
            case 3:
              secondByte = buf[i + 1];
              thirdByte = buf[i + 2];
              if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
                tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
                if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
                  codePoint = tempCodePoint;
                }
              }
              break;
            case 4:
              secondByte = buf[i + 1];
              thirdByte = buf[i + 2];
              fourthByte = buf[i + 3];
              if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
                tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
                if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
                  codePoint = tempCodePoint;
                }
              }
          }
        }
        if (codePoint === null) {
          codePoint = 65533;
          bytesPerSequence = 1;
        } else if (codePoint > 65535) {
          codePoint -= 65536;
          res.push(codePoint >>> 10 & 1023 | 55296);
          codePoint = 56320 | codePoint & 1023;
        }
        res.push(codePoint);
        i += bytesPerSequence;
      }
      return decodeCodePointsArray(res);
    }
    var MAX_ARGUMENTS_LENGTH = 4096;
    function decodeCodePointsArray(codePoints) {
      const len = codePoints.length;
      if (len <= MAX_ARGUMENTS_LENGTH) {
        return String.fromCharCode.apply(String, codePoints);
      }
      let res = "";
      let i = 0;
      while (i < len) {
        res += String.fromCharCode.apply(
          String,
          codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
        );
      }
      return res;
    }
    function asciiSlice(buf, start, end) {
      let ret = "";
      end = Math.min(buf.length, end);
      for (let i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i] & 127);
      }
      return ret;
    }
    function latin1Slice(buf, start, end) {
      let ret = "";
      end = Math.min(buf.length, end);
      for (let i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i]);
      }
      return ret;
    }
    function hexSlice(buf, start, end) {
      const len = buf.length;
      if (!start || start < 0) start = 0;
      if (!end || end < 0 || end > len) end = len;
      let out = "";
      for (let i = start; i < end; ++i) {
        out += hexSliceLookupTable[buf[i]];
      }
      return out;
    }
    function utf16leSlice(buf, start, end) {
      const bytes = buf.slice(start, end);
      let res = "";
      for (let i = 0; i < bytes.length - 1; i += 2) {
        res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
      }
      return res;
    }
    Buffer3.prototype.slice = function slice(start, end) {
      const len = this.length;
      start = ~~start;
      end = end === void 0 ? len : ~~end;
      if (start < 0) {
        start += len;
        if (start < 0) start = 0;
      } else if (start > len) {
        start = len;
      }
      if (end < 0) {
        end += len;
        if (end < 0) end = 0;
      } else if (end > len) {
        end = len;
      }
      if (end < start) end = start;
      const newBuf = this.subarray(start, end);
      Object.setPrototypeOf(newBuf, Buffer3.prototype);
      return newBuf;
    };
    function checkOffset(offset, ext, length2) {
      if (offset % 1 !== 0 || offset < 0) throw new RangeError("offset is not uint");
      if (offset + ext > length2) throw new RangeError("Trying to access beyond buffer length");
    }
    Buffer3.prototype.readUintLE = Buffer3.prototype.readUIntLE = function readUIntLE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) checkOffset(offset, byteLength2, this.length);
      let val = this[offset];
      let mul = 1;
      let i = 0;
      while (++i < byteLength2 && (mul *= 256)) {
        val += this[offset + i] * mul;
      }
      return val;
    };
    Buffer3.prototype.readUintBE = Buffer3.prototype.readUIntBE = function readUIntBE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) {
        checkOffset(offset, byteLength2, this.length);
      }
      let val = this[offset + --byteLength2];
      let mul = 1;
      while (byteLength2 > 0 && (mul *= 256)) {
        val += this[offset + --byteLength2] * mul;
      }
      return val;
    };
    Buffer3.prototype.readUint8 = Buffer3.prototype.readUInt8 = function readUInt8(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 1, this.length);
      return this[offset];
    };
    Buffer3.prototype.readUint16LE = Buffer3.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      return this[offset] | this[offset + 1] << 8;
    };
    Buffer3.prototype.readUint16BE = Buffer3.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      return this[offset] << 8 | this[offset + 1];
    };
    Buffer3.prototype.readUint32LE = Buffer3.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
    };
    Buffer3.prototype.readUint32BE = Buffer3.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
    };
    Buffer3.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first = this[offset];
      const last = this[offset + 7];
      if (first === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const lo = first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24;
      const hi = this[++offset] + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + last * 2 ** 24;
      return BigInt(lo) + (BigInt(hi) << BigInt(32));
    });
    Buffer3.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first = this[offset];
      const last = this[offset + 7];
      if (first === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const hi = first * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
      const lo = this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last;
      return (BigInt(hi) << BigInt(32)) + BigInt(lo);
    });
    Buffer3.prototype.readIntLE = function readIntLE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) checkOffset(offset, byteLength2, this.length);
      let val = this[offset];
      let mul = 1;
      let i = 0;
      while (++i < byteLength2 && (mul *= 256)) {
        val += this[offset + i] * mul;
      }
      mul *= 128;
      if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
      return val;
    };
    Buffer3.prototype.readIntBE = function readIntBE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) checkOffset(offset, byteLength2, this.length);
      let i = byteLength2;
      let mul = 1;
      let val = this[offset + --i];
      while (i > 0 && (mul *= 256)) {
        val += this[offset + --i] * mul;
      }
      mul *= 128;
      if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
      return val;
    };
    Buffer3.prototype.readInt8 = function readInt8(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 1, this.length);
      if (!(this[offset] & 128)) return this[offset];
      return (255 - this[offset] + 1) * -1;
    };
    Buffer3.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      const val = this[offset] | this[offset + 1] << 8;
      return val & 32768 ? val | 4294901760 : val;
    };
    Buffer3.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      const val = this[offset + 1] | this[offset] << 8;
      return val & 32768 ? val | 4294901760 : val;
    };
    Buffer3.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
    };
    Buffer3.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
    };
    Buffer3.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first = this[offset];
      const last = this[offset + 7];
      if (first === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const val = this[offset + 4] + this[offset + 5] * 2 ** 8 + this[offset + 6] * 2 ** 16 + (last << 24);
      return (BigInt(val) << BigInt(32)) + BigInt(first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24);
    });
    Buffer3.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first = this[offset];
      const last = this[offset + 7];
      if (first === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const val = (first << 24) + // Overflow
      this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
      return (BigInt(val) << BigInt(32)) + BigInt(this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last);
    });
    Buffer3.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return ieee754.read(this, offset, true, 23, 4);
    };
    Buffer3.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return ieee754.read(this, offset, false, 23, 4);
    };
    Buffer3.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 8, this.length);
      return ieee754.read(this, offset, true, 52, 8);
    };
    Buffer3.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 8, this.length);
      return ieee754.read(this, offset, false, 52, 8);
    };
    function checkInt(buf, value, offset, ext, max, min) {
      if (!Buffer3.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
      if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
      if (offset + ext > buf.length) throw new RangeError("Index out of range");
    }
    Buffer3.prototype.writeUintLE = Buffer3.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) {
        const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
        checkInt(this, value, offset, byteLength2, maxBytes, 0);
      }
      let mul = 1;
      let i = 0;
      this[offset] = value & 255;
      while (++i < byteLength2 && (mul *= 256)) {
        this[offset + i] = value / mul & 255;
      }
      return offset + byteLength2;
    };
    Buffer3.prototype.writeUintBE = Buffer3.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) {
        const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
        checkInt(this, value, offset, byteLength2, maxBytes, 0);
      }
      let i = byteLength2 - 1;
      let mul = 1;
      this[offset + i] = value & 255;
      while (--i >= 0 && (mul *= 256)) {
        this[offset + i] = value / mul & 255;
      }
      return offset + byteLength2;
    };
    Buffer3.prototype.writeUint8 = Buffer3.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 1, 255, 0);
      this[offset] = value & 255;
      return offset + 1;
    };
    Buffer3.prototype.writeUint16LE = Buffer3.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
      return offset + 2;
    };
    Buffer3.prototype.writeUint16BE = Buffer3.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
      this[offset] = value >>> 8;
      this[offset + 1] = value & 255;
      return offset + 2;
    };
    Buffer3.prototype.writeUint32LE = Buffer3.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
      this[offset + 3] = value >>> 24;
      this[offset + 2] = value >>> 16;
      this[offset + 1] = value >>> 8;
      this[offset] = value & 255;
      return offset + 4;
    };
    Buffer3.prototype.writeUint32BE = Buffer3.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 255;
      return offset + 4;
    };
    function wrtBigUInt64LE(buf, value, offset, min, max) {
      checkIntBI(value, min, max, buf, offset, 7);
      let lo = Number(value & BigInt(4294967295));
      buf[offset++] = lo;
      lo = lo >> 8;
      buf[offset++] = lo;
      lo = lo >> 8;
      buf[offset++] = lo;
      lo = lo >> 8;
      buf[offset++] = lo;
      let hi = Number(value >> BigInt(32) & BigInt(4294967295));
      buf[offset++] = hi;
      hi = hi >> 8;
      buf[offset++] = hi;
      hi = hi >> 8;
      buf[offset++] = hi;
      hi = hi >> 8;
      buf[offset++] = hi;
      return offset;
    }
    function wrtBigUInt64BE(buf, value, offset, min, max) {
      checkIntBI(value, min, max, buf, offset, 7);
      let lo = Number(value & BigInt(4294967295));
      buf[offset + 7] = lo;
      lo = lo >> 8;
      buf[offset + 6] = lo;
      lo = lo >> 8;
      buf[offset + 5] = lo;
      lo = lo >> 8;
      buf[offset + 4] = lo;
      let hi = Number(value >> BigInt(32) & BigInt(4294967295));
      buf[offset + 3] = hi;
      hi = hi >> 8;
      buf[offset + 2] = hi;
      hi = hi >> 8;
      buf[offset + 1] = hi;
      hi = hi >> 8;
      buf[offset] = hi;
      return offset + 8;
    }
    Buffer3.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE(value, offset = 0) {
      return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
    });
    Buffer3.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE(value, offset = 0) {
      return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
    });
    Buffer3.prototype.writeIntLE = function writeIntLE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        const limit = Math.pow(2, 8 * byteLength2 - 1);
        checkInt(this, value, offset, byteLength2, limit - 1, -limit);
      }
      let i = 0;
      let mul = 1;
      let sub = 0;
      this[offset] = value & 255;
      while (++i < byteLength2 && (mul *= 256)) {
        if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
          sub = 1;
        }
        this[offset + i] = (value / mul >> 0) - sub & 255;
      }
      return offset + byteLength2;
    };
    Buffer3.prototype.writeIntBE = function writeIntBE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        const limit = Math.pow(2, 8 * byteLength2 - 1);
        checkInt(this, value, offset, byteLength2, limit - 1, -limit);
      }
      let i = byteLength2 - 1;
      let mul = 1;
      let sub = 0;
      this[offset + i] = value & 255;
      while (--i >= 0 && (mul *= 256)) {
        if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
          sub = 1;
        }
        this[offset + i] = (value / mul >> 0) - sub & 255;
      }
      return offset + byteLength2;
    };
    Buffer3.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 1, 127, -128);
      if (value < 0) value = 255 + value + 1;
      this[offset] = value & 255;
      return offset + 1;
    };
    Buffer3.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
      return offset + 2;
    };
    Buffer3.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
      this[offset] = value >>> 8;
      this[offset + 1] = value & 255;
      return offset + 2;
    };
    Buffer3.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
      this[offset + 2] = value >>> 16;
      this[offset + 3] = value >>> 24;
      return offset + 4;
    };
    Buffer3.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
      if (value < 0) value = 4294967295 + value + 1;
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 255;
      return offset + 4;
    };
    Buffer3.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE(value, offset = 0) {
      return wrtBigUInt64LE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
    });
    Buffer3.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE(value, offset = 0) {
      return wrtBigUInt64BE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
    });
    function checkIEEE754(buf, value, offset, ext, max, min) {
      if (offset + ext > buf.length) throw new RangeError("Index out of range");
      if (offset < 0) throw new RangeError("Index out of range");
    }
    function writeFloat(buf, value, offset, littleEndian, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 4, 34028234663852886e22, -34028234663852886e22);
      }
      ieee754.write(buf, value, offset, littleEndian, 23, 4);
      return offset + 4;
    }
    Buffer3.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
      return writeFloat(this, value, offset, true, noAssert);
    };
    Buffer3.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
      return writeFloat(this, value, offset, false, noAssert);
    };
    function writeDouble(buf, value, offset, littleEndian, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 8, 17976931348623157e292, -17976931348623157e292);
      }
      ieee754.write(buf, value, offset, littleEndian, 52, 8);
      return offset + 8;
    }
    Buffer3.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
      return writeDouble(this, value, offset, true, noAssert);
    };
    Buffer3.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
      return writeDouble(this, value, offset, false, noAssert);
    };
    Buffer3.prototype.copy = function copy(target, targetStart, start, end) {
      if (!Buffer3.isBuffer(target)) throw new TypeError("argument should be a Buffer");
      if (!start) start = 0;
      if (!end && end !== 0) end = this.length;
      if (targetStart >= target.length) targetStart = target.length;
      if (!targetStart) targetStart = 0;
      if (end > 0 && end < start) end = start;
      if (end === start) return 0;
      if (target.length === 0 || this.length === 0) return 0;
      if (targetStart < 0) {
        throw new RangeError("targetStart out of bounds");
      }
      if (start < 0 || start >= this.length) throw new RangeError("Index out of range");
      if (end < 0) throw new RangeError("sourceEnd out of bounds");
      if (end > this.length) end = this.length;
      if (target.length - targetStart < end - start) {
        end = target.length - targetStart + start;
      }
      const len = end - start;
      if (this === target && typeof Uint8Array.prototype.copyWithin === "function") {
        this.copyWithin(targetStart, start, end);
      } else {
        Uint8Array.prototype.set.call(
          target,
          this.subarray(start, end),
          targetStart
        );
      }
      return len;
    };
    Buffer3.prototype.fill = function fill(val, start, end, encoding) {
      if (typeof val === "string") {
        if (typeof start === "string") {
          encoding = start;
          start = 0;
          end = this.length;
        } else if (typeof end === "string") {
          encoding = end;
          end = this.length;
        }
        if (encoding !== void 0 && typeof encoding !== "string") {
          throw new TypeError("encoding must be a string");
        }
        if (typeof encoding === "string" && !Buffer3.isEncoding(encoding)) {
          throw new TypeError("Unknown encoding: " + encoding);
        }
        if (val.length === 1) {
          const code = val.charCodeAt(0);
          if (encoding === "utf8" && code < 128 || encoding === "latin1") {
            val = code;
          }
        }
      } else if (typeof val === "number") {
        val = val & 255;
      } else if (typeof val === "boolean") {
        val = Number(val);
      }
      if (start < 0 || this.length < start || this.length < end) {
        throw new RangeError("Out of range index");
      }
      if (end <= start) {
        return this;
      }
      start = start >>> 0;
      end = end === void 0 ? this.length : end >>> 0;
      if (!val) val = 0;
      let i;
      if (typeof val === "number") {
        for (i = start; i < end; ++i) {
          this[i] = val;
        }
      } else {
        const bytes = Buffer3.isBuffer(val) ? val : Buffer3.from(val, encoding);
        const len = bytes.length;
        if (len === 0) {
          throw new TypeError('The value "' + val + '" is invalid for argument "value"');
        }
        for (i = 0; i < end - start; ++i) {
          this[i + start] = bytes[i % len];
        }
      }
      return this;
    };
    var errors = {};
    function E(sym, getMessage, Base) {
      errors[sym] = class NodeError extends Base {
        constructor() {
          super();
          Object.defineProperty(this, "message", {
            value: getMessage.apply(this, arguments),
            writable: true,
            configurable: true
          });
          this.name = `${this.name} [${sym}]`;
          this.stack;
          delete this.name;
        }
        get code() {
          return sym;
        }
        set code(value) {
          Object.defineProperty(this, "code", {
            configurable: true,
            enumerable: true,
            value,
            writable: true
          });
        }
        toString() {
          return `${this.name} [${sym}]: ${this.message}`;
        }
      };
    }
    E(
      "ERR_BUFFER_OUT_OF_BOUNDS",
      function(name) {
        if (name) {
          return `${name} is outside of buffer bounds`;
        }
        return "Attempt to access memory outside buffer bounds";
      },
      RangeError
    );
    E(
      "ERR_INVALID_ARG_TYPE",
      function(name, actual) {
        return `The "${name}" argument must be of type number. Received type ${typeof actual}`;
      },
      TypeError
    );
    E(
      "ERR_OUT_OF_RANGE",
      function(str, range, input) {
        let msg = `The value of "${str}" is out of range.`;
        let received = input;
        if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
          received = addNumericalSeparator(String(input));
        } else if (typeof input === "bigint") {
          received = String(input);
          if (input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32))) {
            received = addNumericalSeparator(received);
          }
          received += "n";
        }
        msg += ` It must be ${range}. Received ${received}`;
        return msg;
      },
      RangeError
    );
    function addNumericalSeparator(val) {
      let res = "";
      let i = val.length;
      const start = val[0] === "-" ? 1 : 0;
      for (; i >= start + 4; i -= 3) {
        res = `_${val.slice(i - 3, i)}${res}`;
      }
      return `${val.slice(0, i)}${res}`;
    }
    function checkBounds2(buf, offset, byteLength2) {
      validateNumber(offset, "offset");
      if (buf[offset] === void 0 || buf[offset + byteLength2] === void 0) {
        boundsError(offset, buf.length - (byteLength2 + 1));
      }
    }
    function checkIntBI(value, min, max, buf, offset, byteLength2) {
      if (value > max || value < min) {
        const n = typeof min === "bigint" ? "n" : "";
        let range;
        if (byteLength2 > 3) {
          if (min === 0 || min === BigInt(0)) {
            range = `>= 0${n} and < 2${n} ** ${(byteLength2 + 1) * 8}${n}`;
          } else {
            range = `>= -(2${n} ** ${(byteLength2 + 1) * 8 - 1}${n}) and < 2 ** ${(byteLength2 + 1) * 8 - 1}${n}`;
          }
        } else {
          range = `>= ${min}${n} and <= ${max}${n}`;
        }
        throw new errors.ERR_OUT_OF_RANGE("value", range, value);
      }
      checkBounds2(buf, offset, byteLength2);
    }
    function validateNumber(value, name) {
      if (typeof value !== "number") {
        throw new errors.ERR_INVALID_ARG_TYPE(name, "number", value);
      }
    }
    function boundsError(value, length2, type) {
      if (Math.floor(value) !== value) {
        validateNumber(value, type);
        throw new errors.ERR_OUT_OF_RANGE(type || "offset", "an integer", value);
      }
      if (length2 < 0) {
        throw new errors.ERR_BUFFER_OUT_OF_BOUNDS();
      }
      throw new errors.ERR_OUT_OF_RANGE(
        type || "offset",
        `>= ${type ? 1 : 0} and <= ${length2}`,
        value
      );
    }
    var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
    function base64clean(str) {
      str = str.split("=")[0];
      str = str.trim().replace(INVALID_BASE64_RE, "");
      if (str.length < 2) return "";
      while (str.length % 4 !== 0) {
        str = str + "=";
      }
      return str;
    }
    function utf8ToBytes(string3, units) {
      units = units || Infinity;
      let codePoint;
      const length2 = string3.length;
      let leadSurrogate = null;
      const bytes = [];
      for (let i = 0; i < length2; ++i) {
        codePoint = string3.charCodeAt(i);
        if (codePoint > 55295 && codePoint < 57344) {
          if (!leadSurrogate) {
            if (codePoint > 56319) {
              if ((units -= 3) > -1) bytes.push(239, 191, 189);
              continue;
            } else if (i + 1 === length2) {
              if ((units -= 3) > -1) bytes.push(239, 191, 189);
              continue;
            }
            leadSurrogate = codePoint;
            continue;
          }
          if (codePoint < 56320) {
            if ((units -= 3) > -1) bytes.push(239, 191, 189);
            leadSurrogate = codePoint;
            continue;
          }
          codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
        } else if (leadSurrogate) {
          if ((units -= 3) > -1) bytes.push(239, 191, 189);
        }
        leadSurrogate = null;
        if (codePoint < 128) {
          if ((units -= 1) < 0) break;
          bytes.push(codePoint);
        } else if (codePoint < 2048) {
          if ((units -= 2) < 0) break;
          bytes.push(
            codePoint >> 6 | 192,
            codePoint & 63 | 128
          );
        } else if (codePoint < 65536) {
          if ((units -= 3) < 0) break;
          bytes.push(
            codePoint >> 12 | 224,
            codePoint >> 6 & 63 | 128,
            codePoint & 63 | 128
          );
        } else if (codePoint < 1114112) {
          if ((units -= 4) < 0) break;
          bytes.push(
            codePoint >> 18 | 240,
            codePoint >> 12 & 63 | 128,
            codePoint >> 6 & 63 | 128,
            codePoint & 63 | 128
          );
        } else {
          throw new Error("Invalid code point");
        }
      }
      return bytes;
    }
    function asciiToBytes2(str) {
      const byteArray = [];
      for (let i = 0; i < str.length; ++i) {
        byteArray.push(str.charCodeAt(i) & 255);
      }
      return byteArray;
    }
    function utf16leToBytes(str, units) {
      let c, hi, lo;
      const byteArray = [];
      for (let i = 0; i < str.length; ++i) {
        if ((units -= 2) < 0) break;
        c = str.charCodeAt(i);
        hi = c >> 8;
        lo = c % 256;
        byteArray.push(lo);
        byteArray.push(hi);
      }
      return byteArray;
    }
    function base64ToBytes2(str) {
      return base64.toByteArray(base64clean(str));
    }
    function blitBuffer(src, dst, offset, length2) {
      let i;
      for (i = 0; i < length2; ++i) {
        if (i + offset >= dst.length || i >= src.length) break;
        dst[i + offset] = src[i];
      }
      return i;
    }
    function isInstance(obj, type) {
      return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
    }
    function numberIsNaN(obj) {
      return obj !== obj;
    }
    var hexSliceLookupTable = (function() {
      const alphabet4 = "0123456789abcdef";
      const table = new Array(256);
      for (let i = 0; i < 16; ++i) {
        const i16 = i * 16;
        for (let j = 0; j < 16; ++j) {
          table[i16 + j] = alphabet4[i] + alphabet4[j];
        }
      }
      return table;
    })();
    function defineBigIntMethod(fn) {
      return typeof BigInt === "undefined" ? BufferBigIntNotDefined : fn;
    }
    function BufferBigIntNotDefined() {
      throw new Error("BigInt not supported");
    }
  }
});

// node_modules/jsontokens/lib/base64Url.js
var require_base64Url = __commonJS({
  "node_modules/jsontokens/lib/base64Url.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.decode = exports.encode = exports.unescape = exports.escape = exports.pad = void 0;
    var base64_js_1 = require_base64_js();
    function pad(base64) {
      return `${base64}${"=".repeat(4 - (base64.length % 4 || 4))}`;
    }
    exports.pad = pad;
    function escape(base64) {
      return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    exports.escape = escape;
    function unescape(base64Url) {
      return pad(base64Url).replace(/-/g, "+").replace(/_/g, "/");
    }
    exports.unescape = unescape;
    function encode3(base64) {
      return escape((0, base64_js_1.fromByteArray)(new TextEncoder().encode(base64)));
    }
    exports.encode = encode3;
    function decode(base64Url) {
      return new TextDecoder().decode((0, base64_js_1.toByteArray)(pad(unescape(base64Url))));
    }
    exports.decode = decode;
  }
});

// node_modules/jsontokens/node_modules/@noble/hashes/crypto.js
var require_crypto = __commonJS({
  "node_modules/jsontokens/node_modules/@noble/hashes/crypto.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.crypto = void 0;
    exports.crypto = typeof globalThis === "object" && "crypto" in globalThis ? globalThis.crypto : void 0;
  }
});

// node_modules/jsontokens/node_modules/@noble/hashes/utils.js
var require_utils = __commonJS({
  "node_modules/jsontokens/node_modules/@noble/hashes/utils.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.wrapXOFConstructorWithOpts = exports.wrapConstructorWithOpts = exports.wrapConstructor = exports.Hash = exports.nextTick = exports.swap32IfBE = exports.byteSwapIfBE = exports.swap8IfBE = exports.isLE = void 0;
    exports.isBytes = isBytes8;
    exports.anumber = anumber6;
    exports.abytes = abytes6;
    exports.ahash = ahash2;
    exports.aexists = aexists2;
    exports.aoutput = aoutput2;
    exports.u8 = u8;
    exports.u32 = u32;
    exports.clean = clean2;
    exports.createView = createView3;
    exports.rotr = rotr2;
    exports.rotl = rotl2;
    exports.byteSwap = byteSwap;
    exports.byteSwap32 = byteSwap32;
    exports.bytesToHex = bytesToHex3;
    exports.hexToBytes = hexToBytes3;
    exports.asyncLoop = asyncLoop;
    exports.utf8ToBytes = utf8ToBytes;
    exports.bytesToUtf8 = bytesToUtf8;
    exports.toBytes = toBytes;
    exports.kdfInputToBytes = kdfInputToBytes;
    exports.concatBytes = concatBytes5;
    exports.checkOpts = checkOpts;
    exports.createHasher = createHasher2;
    exports.createOptHasher = createOptHasher;
    exports.createXOFer = createXOFer;
    exports.randomBytes = randomBytes3;
    var crypto_1 = require_crypto();
    function isBytes8(a) {
      return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
    }
    function anumber6(n) {
      if (!Number.isSafeInteger(n) || n < 0)
        throw new Error("positive integer expected, got " + n);
    }
    function abytes6(b, ...lengths) {
      if (!isBytes8(b))
        throw new Error("Uint8Array expected");
      if (lengths.length > 0 && !lengths.includes(b.length))
        throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
    }
    function ahash2(h) {
      if (typeof h !== "function" || typeof h.create !== "function")
        throw new Error("Hash should be wrapped by utils.createHasher");
      anumber6(h.outputLen);
      anumber6(h.blockLen);
    }
    function aexists2(instance, checkFinished = true) {
      if (instance.destroyed)
        throw new Error("Hash instance has been destroyed");
      if (checkFinished && instance.finished)
        throw new Error("Hash#digest() has already been called");
    }
    function aoutput2(out, instance) {
      abytes6(out);
      const min = instance.outputLen;
      if (out.length < min) {
        throw new Error("digestInto() expects output buffer of length at least " + min);
      }
    }
    function u8(arr) {
      return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
    }
    function u32(arr) {
      return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
    }
    function clean2(...arrays) {
      for (let i = 0; i < arrays.length; i++) {
        arrays[i].fill(0);
      }
    }
    function createView3(arr) {
      return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
    }
    function rotr2(word, shift) {
      return word << 32 - shift | word >>> shift;
    }
    function rotl2(word, shift) {
      return word << shift | word >>> 32 - shift >>> 0;
    }
    exports.isLE = (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
    function byteSwap(word) {
      return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
    }
    exports.swap8IfBE = exports.isLE ? (n) => n : (n) => byteSwap(n);
    exports.byteSwapIfBE = exports.swap8IfBE;
    function byteSwap32(arr) {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = byteSwap(arr[i]);
      }
      return arr;
    }
    exports.swap32IfBE = exports.isLE ? (u) => u : byteSwap32;
    var hasHexBuiltin5 = /* @__PURE__ */ (() => (
      // @ts-ignore
      typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
    ))();
    var hexes2 = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
    function bytesToHex3(bytes) {
      abytes6(bytes);
      if (hasHexBuiltin5)
        return bytes.toHex();
      let hex4 = "";
      for (let i = 0; i < bytes.length; i++) {
        hex4 += hexes2[bytes[i]];
      }
      return hex4;
    }
    var asciis2 = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
    function asciiToBase162(ch2) {
      if (ch2 >= asciis2._0 && ch2 <= asciis2._9)
        return ch2 - asciis2._0;
      if (ch2 >= asciis2.A && ch2 <= asciis2.F)
        return ch2 - (asciis2.A - 10);
      if (ch2 >= asciis2.a && ch2 <= asciis2.f)
        return ch2 - (asciis2.a - 10);
      return;
    }
    function hexToBytes3(hex4) {
      if (typeof hex4 !== "string")
        throw new Error("hex string expected, got " + typeof hex4);
      if (hasHexBuiltin5)
        return Uint8Array.fromHex(hex4);
      const hl = hex4.length;
      const al = hl / 2;
      if (hl % 2)
        throw new Error("hex string expected, got unpadded hex of length " + hl);
      const array3 = new Uint8Array(al);
      for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
        const n1 = asciiToBase162(hex4.charCodeAt(hi));
        const n2 = asciiToBase162(hex4.charCodeAt(hi + 1));
        if (n1 === void 0 || n2 === void 0) {
          const char = hex4[hi] + hex4[hi + 1];
          throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
        }
        array3[ai] = n1 * 16 + n2;
      }
      return array3;
    }
    var nextTick = async () => {
    };
    exports.nextTick = nextTick;
    async function asyncLoop(iters, tick, cb) {
      let ts = Date.now();
      for (let i = 0; i < iters; i++) {
        cb(i);
        const diff = Date.now() - ts;
        if (diff >= 0 && diff < tick)
          continue;
        await (0, exports.nextTick)();
        ts += diff;
      }
    }
    function utf8ToBytes(str) {
      if (typeof str !== "string")
        throw new Error("string expected");
      return new Uint8Array(new TextEncoder().encode(str));
    }
    function bytesToUtf8(bytes) {
      return new TextDecoder().decode(bytes);
    }
    function toBytes(data) {
      if (typeof data === "string")
        data = utf8ToBytes(data);
      abytes6(data);
      return data;
    }
    function kdfInputToBytes(data) {
      if (typeof data === "string")
        data = utf8ToBytes(data);
      abytes6(data);
      return data;
    }
    function concatBytes5(...arrays) {
      let sum = 0;
      for (let i = 0; i < arrays.length; i++) {
        const a = arrays[i];
        abytes6(a);
        sum += a.length;
      }
      const res = new Uint8Array(sum);
      for (let i = 0, pad = 0; i < arrays.length; i++) {
        const a = arrays[i];
        res.set(a, pad);
        pad += a.length;
      }
      return res;
    }
    function checkOpts(defaults2, opts) {
      if (opts !== void 0 && {}.toString.call(opts) !== "[object Object]")
        throw new Error("options should be object or undefined");
      const merged = Object.assign(defaults2, opts);
      return merged;
    }
    var Hash2 = class {
    };
    exports.Hash = Hash2;
    function createHasher2(hashCons) {
      const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
      const tmp = hashCons();
      hashC.outputLen = tmp.outputLen;
      hashC.blockLen = tmp.blockLen;
      hashC.create = () => hashCons();
      return hashC;
    }
    function createOptHasher(hashCons) {
      const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
      const tmp = hashCons({});
      hashC.outputLen = tmp.outputLen;
      hashC.blockLen = tmp.blockLen;
      hashC.create = (opts) => hashCons(opts);
      return hashC;
    }
    function createXOFer(hashCons) {
      const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
      const tmp = hashCons({});
      hashC.outputLen = tmp.outputLen;
      hashC.blockLen = tmp.blockLen;
      hashC.create = (opts) => hashCons(opts);
      return hashC;
    }
    exports.wrapConstructor = createHasher2;
    exports.wrapConstructorWithOpts = createOptHasher;
    exports.wrapXOFConstructorWithOpts = createXOFer;
    function randomBytes3(bytesLength = 32) {
      if (crypto_1.crypto && typeof crypto_1.crypto.getRandomValues === "function") {
        return crypto_1.crypto.getRandomValues(new Uint8Array(bytesLength));
      }
      if (crypto_1.crypto && typeof crypto_1.crypto.randomBytes === "function") {
        return Uint8Array.from(crypto_1.crypto.randomBytes(bytesLength));
      }
      throw new Error("crypto.getRandomValues must be defined");
    }
  }
});

// node_modules/jsontokens/node_modules/@noble/hashes/hmac.js
var require_hmac = __commonJS({
  "node_modules/jsontokens/node_modules/@noble/hashes/hmac.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.hmac = exports.HMAC = void 0;
    var utils_ts_1 = require_utils();
    var HMAC = class extends utils_ts_1.Hash {
      constructor(hash, _key) {
        super();
        this.finished = false;
        this.destroyed = false;
        (0, utils_ts_1.ahash)(hash);
        const key = (0, utils_ts_1.toBytes)(_key);
        this.iHash = hash.create();
        if (typeof this.iHash.update !== "function")
          throw new Error("Expected instance of class which extends utils.Hash");
        this.blockLen = this.iHash.blockLen;
        this.outputLen = this.iHash.outputLen;
        const blockLen = this.blockLen;
        const pad = new Uint8Array(blockLen);
        pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);
        for (let i = 0; i < pad.length; i++)
          pad[i] ^= 54;
        this.iHash.update(pad);
        this.oHash = hash.create();
        for (let i = 0; i < pad.length; i++)
          pad[i] ^= 54 ^ 92;
        this.oHash.update(pad);
        (0, utils_ts_1.clean)(pad);
      }
      update(buf) {
        (0, utils_ts_1.aexists)(this);
        this.iHash.update(buf);
        return this;
      }
      digestInto(out) {
        (0, utils_ts_1.aexists)(this);
        (0, utils_ts_1.abytes)(out, this.outputLen);
        this.finished = true;
        this.iHash.digestInto(out);
        this.oHash.update(out);
        this.oHash.digestInto(out);
        this.destroy();
      }
      digest() {
        const out = new Uint8Array(this.oHash.outputLen);
        this.digestInto(out);
        return out;
      }
      _cloneInto(to) {
        to || (to = Object.create(Object.getPrototypeOf(this), {}));
        const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
        to = to;
        to.finished = finished;
        to.destroyed = destroyed;
        to.blockLen = blockLen;
        to.outputLen = outputLen;
        to.oHash = oHash._cloneInto(to.oHash);
        to.iHash = iHash._cloneInto(to.iHash);
        return to;
      }
      clone() {
        return this._cloneInto();
      }
      destroy() {
        this.destroyed = true;
        this.oHash.destroy();
        this.iHash.destroy();
      }
    };
    exports.HMAC = HMAC;
    var hmac2 = (hash, key, message) => new HMAC(hash, key).update(message).digest();
    exports.hmac = hmac2;
    exports.hmac.create = (hash, key) => new HMAC(hash, key);
  }
});

// node_modules/jsontokens/node_modules/@noble/hashes/_md.js
var require_md = __commonJS({
  "node_modules/jsontokens/node_modules/@noble/hashes/_md.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SHA512_IV = exports.SHA384_IV = exports.SHA224_IV = exports.SHA256_IV = exports.HashMD = void 0;
    exports.setBigUint64 = setBigUint64;
    exports.Chi = Chi2;
    exports.Maj = Maj2;
    var utils_ts_1 = require_utils();
    function setBigUint64(view2, byteOffset, value, isLE) {
      if (typeof view2.setBigUint64 === "function")
        return view2.setBigUint64(byteOffset, value, isLE);
      const _32n = BigInt(32);
      const _u32_max = BigInt(4294967295);
      const wh = Number(value >> _32n & _u32_max);
      const wl = Number(value & _u32_max);
      const h = isLE ? 4 : 0;
      const l = isLE ? 0 : 4;
      view2.setUint32(byteOffset + h, wh, isLE);
      view2.setUint32(byteOffset + l, wl, isLE);
    }
    function Chi2(a, b, c) {
      return a & b ^ ~a & c;
    }
    function Maj2(a, b, c) {
      return a & b ^ a & c ^ b & c;
    }
    var HashMD2 = class extends utils_ts_1.Hash {
      constructor(blockLen, outputLen, padOffset, isLE) {
        super();
        this.finished = false;
        this.length = 0;
        this.pos = 0;
        this.destroyed = false;
        this.blockLen = blockLen;
        this.outputLen = outputLen;
        this.padOffset = padOffset;
        this.isLE = isLE;
        this.buffer = new Uint8Array(blockLen);
        this.view = (0, utils_ts_1.createView)(this.buffer);
      }
      update(data) {
        (0, utils_ts_1.aexists)(this);
        data = (0, utils_ts_1.toBytes)(data);
        (0, utils_ts_1.abytes)(data);
        const { view: view2, buffer, blockLen } = this;
        const len = data.length;
        for (let pos = 0; pos < len; ) {
          const take = Math.min(blockLen - this.pos, len - pos);
          if (take === blockLen) {
            const dataView = (0, utils_ts_1.createView)(data);
            for (; blockLen <= len - pos; pos += blockLen)
              this.process(dataView, pos);
            continue;
          }
          buffer.set(data.subarray(pos, pos + take), this.pos);
          this.pos += take;
          pos += take;
          if (this.pos === blockLen) {
            this.process(view2, 0);
            this.pos = 0;
          }
        }
        this.length += data.length;
        this.roundClean();
        return this;
      }
      digestInto(out) {
        (0, utils_ts_1.aexists)(this);
        (0, utils_ts_1.aoutput)(out, this);
        this.finished = true;
        const { buffer, view: view2, blockLen, isLE } = this;
        let { pos } = this;
        buffer[pos++] = 128;
        (0, utils_ts_1.clean)(this.buffer.subarray(pos));
        if (this.padOffset > blockLen - pos) {
          this.process(view2, 0);
          pos = 0;
        }
        for (let i = pos; i < blockLen; i++)
          buffer[i] = 0;
        setBigUint64(view2, blockLen - 8, BigInt(this.length * 8), isLE);
        this.process(view2, 0);
        const oview = (0, utils_ts_1.createView)(out);
        const len = this.outputLen;
        if (len % 4)
          throw new Error("_sha2: outputLen should be aligned to 32bit");
        const outLen = len / 4;
        const state = this.get();
        if (outLen > state.length)
          throw new Error("_sha2: outputLen bigger than state");
        for (let i = 0; i < outLen; i++)
          oview.setUint32(4 * i, state[i], isLE);
      }
      digest() {
        const { buffer, outputLen } = this;
        this.digestInto(buffer);
        const res = buffer.slice(0, outputLen);
        this.destroy();
        return res;
      }
      _cloneInto(to) {
        to || (to = new this.constructor());
        to.set(...this.get());
        const { blockLen, buffer, length: length2, finished, destroyed, pos } = this;
        to.destroyed = destroyed;
        to.finished = finished;
        to.length = length2;
        to.pos = pos;
        if (length2 % blockLen)
          to.buffer.set(buffer);
        return to;
      }
      clone() {
        return this._cloneInto();
      }
    };
    exports.HashMD = HashMD2;
    exports.SHA256_IV = Uint32Array.from([
      1779033703,
      3144134277,
      1013904242,
      2773480762,
      1359893119,
      2600822924,
      528734635,
      1541459225
    ]);
    exports.SHA224_IV = Uint32Array.from([
      3238371032,
      914150663,
      812702999,
      4144912697,
      4290775857,
      1750603025,
      1694076839,
      3204075428
    ]);
    exports.SHA384_IV = Uint32Array.from([
      3418070365,
      3238371032,
      1654270250,
      914150663,
      2438529370,
      812702999,
      355462360,
      4144912697,
      1731405415,
      4290775857,
      2394180231,
      1750603025,
      3675008525,
      1694076839,
      1203062813,
      3204075428
    ]);
    exports.SHA512_IV = Uint32Array.from([
      1779033703,
      4089235720,
      3144134277,
      2227873595,
      1013904242,
      4271175723,
      2773480762,
      1595750129,
      1359893119,
      2917565137,
      2600822924,
      725511199,
      528734635,
      4215389547,
      1541459225,
      327033209
    ]);
  }
});

// node_modules/jsontokens/node_modules/@noble/hashes/_u64.js
var require_u64 = __commonJS({
  "node_modules/jsontokens/node_modules/@noble/hashes/_u64.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toBig = exports.shrSL = exports.shrSH = exports.rotrSL = exports.rotrSH = exports.rotrBL = exports.rotrBH = exports.rotr32L = exports.rotr32H = exports.rotlSL = exports.rotlSH = exports.rotlBL = exports.rotlBH = exports.add5L = exports.add5H = exports.add4L = exports.add4H = exports.add3L = exports.add3H = void 0;
    exports.add = add;
    exports.fromBig = fromBig;
    exports.split = split;
    var U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
    var _32n = /* @__PURE__ */ BigInt(32);
    function fromBig(n, le = false) {
      if (le)
        return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
      return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
    }
    function split(lst, le = false) {
      const len = lst.length;
      let Ah = new Uint32Array(len);
      let Al = new Uint32Array(len);
      for (let i = 0; i < len; i++) {
        const { h, l } = fromBig(lst[i], le);
        [Ah[i], Al[i]] = [h, l];
      }
      return [Ah, Al];
    }
    var toBig = (h, l) => BigInt(h >>> 0) << _32n | BigInt(l >>> 0);
    exports.toBig = toBig;
    var shrSH = (h, _l, s) => h >>> s;
    exports.shrSH = shrSH;
    var shrSL = (h, l, s) => h << 32 - s | l >>> s;
    exports.shrSL = shrSL;
    var rotrSH = (h, l, s) => h >>> s | l << 32 - s;
    exports.rotrSH = rotrSH;
    var rotrSL = (h, l, s) => h << 32 - s | l >>> s;
    exports.rotrSL = rotrSL;
    var rotrBH = (h, l, s) => h << 64 - s | l >>> s - 32;
    exports.rotrBH = rotrBH;
    var rotrBL = (h, l, s) => h >>> s - 32 | l << 64 - s;
    exports.rotrBL = rotrBL;
    var rotr32H = (_h, l) => l;
    exports.rotr32H = rotr32H;
    var rotr32L = (h, _l) => h;
    exports.rotr32L = rotr32L;
    var rotlSH = (h, l, s) => h << s | l >>> 32 - s;
    exports.rotlSH = rotlSH;
    var rotlSL = (h, l, s) => l << s | h >>> 32 - s;
    exports.rotlSL = rotlSL;
    var rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
    exports.rotlBH = rotlBH;
    var rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
    exports.rotlBL = rotlBL;
    function add(Ah, Al, Bh, Bl) {
      const l = (Al >>> 0) + (Bl >>> 0);
      return { h: Ah + Bh + (l / 2 ** 32 | 0) | 0, l: l | 0 };
    }
    var add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
    exports.add3L = add3L;
    var add3H = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
    exports.add3H = add3H;
    var add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
    exports.add4L = add4L;
    var add4H = (low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0;
    exports.add4H = add4H;
    var add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
    exports.add5L = add5L;
    var add5H = (low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0;
    exports.add5H = add5H;
    var u64 = {
      fromBig,
      split,
      toBig,
      shrSH,
      shrSL,
      rotrSH,
      rotrSL,
      rotrBH,
      rotrBL,
      rotr32H,
      rotr32L,
      rotlSH,
      rotlSL,
      rotlBH,
      rotlBL,
      add,
      add3L,
      add3H,
      add4L,
      add4H,
      add5H,
      add5L
    };
    exports.default = u64;
  }
});

// node_modules/jsontokens/node_modules/@noble/hashes/sha2.js
var require_sha2 = __commonJS({
  "node_modules/jsontokens/node_modules/@noble/hashes/sha2.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sha512_224 = exports.sha512_256 = exports.sha384 = exports.sha512 = exports.sha224 = exports.sha256 = exports.SHA512_256 = exports.SHA512_224 = exports.SHA384 = exports.SHA512 = exports.SHA224 = exports.SHA256 = void 0;
    var _md_ts_1 = require_md();
    var u64 = require_u64();
    var utils_ts_1 = require_utils();
    var SHA256_K2 = /* @__PURE__ */ Uint32Array.from([
      1116352408,
      1899447441,
      3049323471,
      3921009573,
      961987163,
      1508970993,
      2453635748,
      2870763221,
      3624381080,
      310598401,
      607225278,
      1426881987,
      1925078388,
      2162078206,
      2614888103,
      3248222580,
      3835390401,
      4022224774,
      264347078,
      604807628,
      770255983,
      1249150122,
      1555081692,
      1996064986,
      2554220882,
      2821834349,
      2952996808,
      3210313671,
      3336571891,
      3584528711,
      113926993,
      338241895,
      666307205,
      773529912,
      1294757372,
      1396182291,
      1695183700,
      1986661051,
      2177026350,
      2456956037,
      2730485921,
      2820302411,
      3259730800,
      3345764771,
      3516065817,
      3600352804,
      4094571909,
      275423344,
      430227734,
      506948616,
      659060556,
      883997877,
      958139571,
      1322822218,
      1537002063,
      1747873779,
      1955562222,
      2024104815,
      2227730452,
      2361852424,
      2428436474,
      2756734187,
      3204031479,
      3329325298
    ]);
    var SHA256_W2 = /* @__PURE__ */ new Uint32Array(64);
    var SHA256 = class extends _md_ts_1.HashMD {
      constructor(outputLen = 32) {
        super(64, outputLen, 8, false);
        this.A = _md_ts_1.SHA256_IV[0] | 0;
        this.B = _md_ts_1.SHA256_IV[1] | 0;
        this.C = _md_ts_1.SHA256_IV[2] | 0;
        this.D = _md_ts_1.SHA256_IV[3] | 0;
        this.E = _md_ts_1.SHA256_IV[4] | 0;
        this.F = _md_ts_1.SHA256_IV[5] | 0;
        this.G = _md_ts_1.SHA256_IV[6] | 0;
        this.H = _md_ts_1.SHA256_IV[7] | 0;
      }
      get() {
        const { A, B, C, D, E, F, G: G2, H } = this;
        return [A, B, C, D, E, F, G2, H];
      }
      // prettier-ignore
      set(A, B, C, D, E, F, G2, H) {
        this.A = A | 0;
        this.B = B | 0;
        this.C = C | 0;
        this.D = D | 0;
        this.E = E | 0;
        this.F = F | 0;
        this.G = G2 | 0;
        this.H = H | 0;
      }
      process(view2, offset) {
        for (let i = 0; i < 16; i++, offset += 4)
          SHA256_W2[i] = view2.getUint32(offset, false);
        for (let i = 16; i < 64; i++) {
          const W15 = SHA256_W2[i - 15];
          const W2 = SHA256_W2[i - 2];
          const s0 = (0, utils_ts_1.rotr)(W15, 7) ^ (0, utils_ts_1.rotr)(W15, 18) ^ W15 >>> 3;
          const s1 = (0, utils_ts_1.rotr)(W2, 17) ^ (0, utils_ts_1.rotr)(W2, 19) ^ W2 >>> 10;
          SHA256_W2[i] = s1 + SHA256_W2[i - 7] + s0 + SHA256_W2[i - 16] | 0;
        }
        let { A, B, C, D, E, F, G: G2, H } = this;
        for (let i = 0; i < 64; i++) {
          const sigma12 = (0, utils_ts_1.rotr)(E, 6) ^ (0, utils_ts_1.rotr)(E, 11) ^ (0, utils_ts_1.rotr)(E, 25);
          const T1 = H + sigma12 + (0, _md_ts_1.Chi)(E, F, G2) + SHA256_K2[i] + SHA256_W2[i] | 0;
          const sigma02 = (0, utils_ts_1.rotr)(A, 2) ^ (0, utils_ts_1.rotr)(A, 13) ^ (0, utils_ts_1.rotr)(A, 22);
          const T2 = sigma02 + (0, _md_ts_1.Maj)(A, B, C) | 0;
          H = G2;
          G2 = F;
          F = E;
          E = D + T1 | 0;
          D = C;
          C = B;
          B = A;
          A = T1 + T2 | 0;
        }
        A = A + this.A | 0;
        B = B + this.B | 0;
        C = C + this.C | 0;
        D = D + this.D | 0;
        E = E + this.E | 0;
        F = F + this.F | 0;
        G2 = G2 + this.G | 0;
        H = H + this.H | 0;
        this.set(A, B, C, D, E, F, G2, H);
      }
      roundClean() {
        (0, utils_ts_1.clean)(SHA256_W2);
      }
      destroy() {
        this.set(0, 0, 0, 0, 0, 0, 0, 0);
        (0, utils_ts_1.clean)(this.buffer);
      }
    };
    exports.SHA256 = SHA256;
    var SHA224 = class extends SHA256 {
      constructor() {
        super(28);
        this.A = _md_ts_1.SHA224_IV[0] | 0;
        this.B = _md_ts_1.SHA224_IV[1] | 0;
        this.C = _md_ts_1.SHA224_IV[2] | 0;
        this.D = _md_ts_1.SHA224_IV[3] | 0;
        this.E = _md_ts_1.SHA224_IV[4] | 0;
        this.F = _md_ts_1.SHA224_IV[5] | 0;
        this.G = _md_ts_1.SHA224_IV[6] | 0;
        this.H = _md_ts_1.SHA224_IV[7] | 0;
      }
    };
    exports.SHA224 = SHA224;
    var K512 = /* @__PURE__ */ (() => u64.split([
      "0x428a2f98d728ae22",
      "0x7137449123ef65cd",
      "0xb5c0fbcfec4d3b2f",
      "0xe9b5dba58189dbbc",
      "0x3956c25bf348b538",
      "0x59f111f1b605d019",
      "0x923f82a4af194f9b",
      "0xab1c5ed5da6d8118",
      "0xd807aa98a3030242",
      "0x12835b0145706fbe",
      "0x243185be4ee4b28c",
      "0x550c7dc3d5ffb4e2",
      "0x72be5d74f27b896f",
      "0x80deb1fe3b1696b1",
      "0x9bdc06a725c71235",
      "0xc19bf174cf692694",
      "0xe49b69c19ef14ad2",
      "0xefbe4786384f25e3",
      "0x0fc19dc68b8cd5b5",
      "0x240ca1cc77ac9c65",
      "0x2de92c6f592b0275",
      "0x4a7484aa6ea6e483",
      "0x5cb0a9dcbd41fbd4",
      "0x76f988da831153b5",
      "0x983e5152ee66dfab",
      "0xa831c66d2db43210",
      "0xb00327c898fb213f",
      "0xbf597fc7beef0ee4",
      "0xc6e00bf33da88fc2",
      "0xd5a79147930aa725",
      "0x06ca6351e003826f",
      "0x142929670a0e6e70",
      "0x27b70a8546d22ffc",
      "0x2e1b21385c26c926",
      "0x4d2c6dfc5ac42aed",
      "0x53380d139d95b3df",
      "0x650a73548baf63de",
      "0x766a0abb3c77b2a8",
      "0x81c2c92e47edaee6",
      "0x92722c851482353b",
      "0xa2bfe8a14cf10364",
      "0xa81a664bbc423001",
      "0xc24b8b70d0f89791",
      "0xc76c51a30654be30",
      "0xd192e819d6ef5218",
      "0xd69906245565a910",
      "0xf40e35855771202a",
      "0x106aa07032bbd1b8",
      "0x19a4c116b8d2d0c8",
      "0x1e376c085141ab53",
      "0x2748774cdf8eeb99",
      "0x34b0bcb5e19b48a8",
      "0x391c0cb3c5c95a63",
      "0x4ed8aa4ae3418acb",
      "0x5b9cca4f7763e373",
      "0x682e6ff3d6b2b8a3",
      "0x748f82ee5defb2fc",
      "0x78a5636f43172f60",
      "0x84c87814a1f0ab72",
      "0x8cc702081a6439ec",
      "0x90befffa23631e28",
      "0xa4506cebde82bde9",
      "0xbef9a3f7b2c67915",
      "0xc67178f2e372532b",
      "0xca273eceea26619c",
      "0xd186b8c721c0c207",
      "0xeada7dd6cde0eb1e",
      "0xf57d4f7fee6ed178",
      "0x06f067aa72176fba",
      "0x0a637dc5a2c898a6",
      "0x113f9804bef90dae",
      "0x1b710b35131c471b",
      "0x28db77f523047d84",
      "0x32caab7b40c72493",
      "0x3c9ebe0a15c9bebc",
      "0x431d67c49c100d4c",
      "0x4cc5d4becb3e42b6",
      "0x597f299cfc657e2a",
      "0x5fcb6fab3ad6faec",
      "0x6c44198c4a475817"
    ].map((n) => BigInt(n))))();
    var SHA512_Kh = /* @__PURE__ */ (() => K512[0])();
    var SHA512_Kl = /* @__PURE__ */ (() => K512[1])();
    var SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
    var SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
    var SHA512 = class extends _md_ts_1.HashMD {
      constructor(outputLen = 64) {
        super(128, outputLen, 16, false);
        this.Ah = _md_ts_1.SHA512_IV[0] | 0;
        this.Al = _md_ts_1.SHA512_IV[1] | 0;
        this.Bh = _md_ts_1.SHA512_IV[2] | 0;
        this.Bl = _md_ts_1.SHA512_IV[3] | 0;
        this.Ch = _md_ts_1.SHA512_IV[4] | 0;
        this.Cl = _md_ts_1.SHA512_IV[5] | 0;
        this.Dh = _md_ts_1.SHA512_IV[6] | 0;
        this.Dl = _md_ts_1.SHA512_IV[7] | 0;
        this.Eh = _md_ts_1.SHA512_IV[8] | 0;
        this.El = _md_ts_1.SHA512_IV[9] | 0;
        this.Fh = _md_ts_1.SHA512_IV[10] | 0;
        this.Fl = _md_ts_1.SHA512_IV[11] | 0;
        this.Gh = _md_ts_1.SHA512_IV[12] | 0;
        this.Gl = _md_ts_1.SHA512_IV[13] | 0;
        this.Hh = _md_ts_1.SHA512_IV[14] | 0;
        this.Hl = _md_ts_1.SHA512_IV[15] | 0;
      }
      // prettier-ignore
      get() {
        const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
        return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
      }
      // prettier-ignore
      set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
        this.Ah = Ah | 0;
        this.Al = Al | 0;
        this.Bh = Bh | 0;
        this.Bl = Bl | 0;
        this.Ch = Ch | 0;
        this.Cl = Cl | 0;
        this.Dh = Dh | 0;
        this.Dl = Dl | 0;
        this.Eh = Eh | 0;
        this.El = El | 0;
        this.Fh = Fh | 0;
        this.Fl = Fl | 0;
        this.Gh = Gh | 0;
        this.Gl = Gl | 0;
        this.Hh = Hh | 0;
        this.Hl = Hl | 0;
      }
      process(view2, offset) {
        for (let i = 0; i < 16; i++, offset += 4) {
          SHA512_W_H[i] = view2.getUint32(offset);
          SHA512_W_L[i] = view2.getUint32(offset += 4);
        }
        for (let i = 16; i < 80; i++) {
          const W15h = SHA512_W_H[i - 15] | 0;
          const W15l = SHA512_W_L[i - 15] | 0;
          const s0h = u64.rotrSH(W15h, W15l, 1) ^ u64.rotrSH(W15h, W15l, 8) ^ u64.shrSH(W15h, W15l, 7);
          const s0l = u64.rotrSL(W15h, W15l, 1) ^ u64.rotrSL(W15h, W15l, 8) ^ u64.shrSL(W15h, W15l, 7);
          const W2h = SHA512_W_H[i - 2] | 0;
          const W2l = SHA512_W_L[i - 2] | 0;
          const s1h = u64.rotrSH(W2h, W2l, 19) ^ u64.rotrBH(W2h, W2l, 61) ^ u64.shrSH(W2h, W2l, 6);
          const s1l = u64.rotrSL(W2h, W2l, 19) ^ u64.rotrBL(W2h, W2l, 61) ^ u64.shrSL(W2h, W2l, 6);
          const SUMl = u64.add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
          const SUMh = u64.add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
          SHA512_W_H[i] = SUMh | 0;
          SHA512_W_L[i] = SUMl | 0;
        }
        let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
        for (let i = 0; i < 80; i++) {
          const sigma1h = u64.rotrSH(Eh, El, 14) ^ u64.rotrSH(Eh, El, 18) ^ u64.rotrBH(Eh, El, 41);
          const sigma1l = u64.rotrSL(Eh, El, 14) ^ u64.rotrSL(Eh, El, 18) ^ u64.rotrBL(Eh, El, 41);
          const CHIh = Eh & Fh ^ ~Eh & Gh;
          const CHIl = El & Fl ^ ~El & Gl;
          const T1ll = u64.add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
          const T1h = u64.add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
          const T1l = T1ll | 0;
          const sigma0h = u64.rotrSH(Ah, Al, 28) ^ u64.rotrBH(Ah, Al, 34) ^ u64.rotrBH(Ah, Al, 39);
          const sigma0l = u64.rotrSL(Ah, Al, 28) ^ u64.rotrBL(Ah, Al, 34) ^ u64.rotrBL(Ah, Al, 39);
          const MAJh = Ah & Bh ^ Ah & Ch ^ Bh & Ch;
          const MAJl = Al & Bl ^ Al & Cl ^ Bl & Cl;
          Hh = Gh | 0;
          Hl = Gl | 0;
          Gh = Fh | 0;
          Gl = Fl | 0;
          Fh = Eh | 0;
          Fl = El | 0;
          ({ h: Eh, l: El } = u64.add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
          Dh = Ch | 0;
          Dl = Cl | 0;
          Ch = Bh | 0;
          Cl = Bl | 0;
          Bh = Ah | 0;
          Bl = Al | 0;
          const All = u64.add3L(T1l, sigma0l, MAJl);
          Ah = u64.add3H(All, T1h, sigma0h, MAJh);
          Al = All | 0;
        }
        ({ h: Ah, l: Al } = u64.add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
        ({ h: Bh, l: Bl } = u64.add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
        ({ h: Ch, l: Cl } = u64.add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
        ({ h: Dh, l: Dl } = u64.add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
        ({ h: Eh, l: El } = u64.add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
        ({ h: Fh, l: Fl } = u64.add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
        ({ h: Gh, l: Gl } = u64.add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
        ({ h: Hh, l: Hl } = u64.add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
        this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
      }
      roundClean() {
        (0, utils_ts_1.clean)(SHA512_W_H, SHA512_W_L);
      }
      destroy() {
        (0, utils_ts_1.clean)(this.buffer);
        this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
      }
    };
    exports.SHA512 = SHA512;
    var SHA384 = class extends SHA512 {
      constructor() {
        super(48);
        this.Ah = _md_ts_1.SHA384_IV[0] | 0;
        this.Al = _md_ts_1.SHA384_IV[1] | 0;
        this.Bh = _md_ts_1.SHA384_IV[2] | 0;
        this.Bl = _md_ts_1.SHA384_IV[3] | 0;
        this.Ch = _md_ts_1.SHA384_IV[4] | 0;
        this.Cl = _md_ts_1.SHA384_IV[5] | 0;
        this.Dh = _md_ts_1.SHA384_IV[6] | 0;
        this.Dl = _md_ts_1.SHA384_IV[7] | 0;
        this.Eh = _md_ts_1.SHA384_IV[8] | 0;
        this.El = _md_ts_1.SHA384_IV[9] | 0;
        this.Fh = _md_ts_1.SHA384_IV[10] | 0;
        this.Fl = _md_ts_1.SHA384_IV[11] | 0;
        this.Gh = _md_ts_1.SHA384_IV[12] | 0;
        this.Gl = _md_ts_1.SHA384_IV[13] | 0;
        this.Hh = _md_ts_1.SHA384_IV[14] | 0;
        this.Hl = _md_ts_1.SHA384_IV[15] | 0;
      }
    };
    exports.SHA384 = SHA384;
    var T224_IV = /* @__PURE__ */ Uint32Array.from([
      2352822216,
      424955298,
      1944164710,
      2312950998,
      502970286,
      855612546,
      1738396948,
      1479516111,
      258812777,
      2077511080,
      2011393907,
      79989058,
      1067287976,
      1780299464,
      286451373,
      2446758561
    ]);
    var T256_IV = /* @__PURE__ */ Uint32Array.from([
      573645204,
      4230739756,
      2673172387,
      3360449730,
      596883563,
      1867755857,
      2520282905,
      1497426621,
      2519219938,
      2827943907,
      3193839141,
      1401305490,
      721525244,
      746961066,
      246885852,
      2177182882
    ]);
    var SHA512_224 = class extends SHA512 {
      constructor() {
        super(28);
        this.Ah = T224_IV[0] | 0;
        this.Al = T224_IV[1] | 0;
        this.Bh = T224_IV[2] | 0;
        this.Bl = T224_IV[3] | 0;
        this.Ch = T224_IV[4] | 0;
        this.Cl = T224_IV[5] | 0;
        this.Dh = T224_IV[6] | 0;
        this.Dl = T224_IV[7] | 0;
        this.Eh = T224_IV[8] | 0;
        this.El = T224_IV[9] | 0;
        this.Fh = T224_IV[10] | 0;
        this.Fl = T224_IV[11] | 0;
        this.Gh = T224_IV[12] | 0;
        this.Gl = T224_IV[13] | 0;
        this.Hh = T224_IV[14] | 0;
        this.Hl = T224_IV[15] | 0;
      }
    };
    exports.SHA512_224 = SHA512_224;
    var SHA512_256 = class extends SHA512 {
      constructor() {
        super(32);
        this.Ah = T256_IV[0] | 0;
        this.Al = T256_IV[1] | 0;
        this.Bh = T256_IV[2] | 0;
        this.Bl = T256_IV[3] | 0;
        this.Ch = T256_IV[4] | 0;
        this.Cl = T256_IV[5] | 0;
        this.Dh = T256_IV[6] | 0;
        this.Dl = T256_IV[7] | 0;
        this.Eh = T256_IV[8] | 0;
        this.El = T256_IV[9] | 0;
        this.Fh = T256_IV[10] | 0;
        this.Fl = T256_IV[11] | 0;
        this.Gh = T256_IV[12] | 0;
        this.Gl = T256_IV[13] | 0;
        this.Hh = T256_IV[14] | 0;
        this.Hl = T256_IV[15] | 0;
      }
    };
    exports.SHA512_256 = SHA512_256;
    exports.sha256 = (0, utils_ts_1.createHasher)(() => new SHA256());
    exports.sha224 = (0, utils_ts_1.createHasher)(() => new SHA224());
    exports.sha512 = (0, utils_ts_1.createHasher)(() => new SHA512());
    exports.sha384 = (0, utils_ts_1.createHasher)(() => new SHA384());
    exports.sha512_256 = (0, utils_ts_1.createHasher)(() => new SHA512_256());
    exports.sha512_224 = (0, utils_ts_1.createHasher)(() => new SHA512_224());
  }
});

// node_modules/jsontokens/node_modules/@noble/hashes/sha256.js
var require_sha256 = __commonJS({
  "node_modules/jsontokens/node_modules/@noble/hashes/sha256.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sha224 = exports.SHA224 = exports.sha256 = exports.SHA256 = void 0;
    var sha2_ts_1 = require_sha2();
    exports.SHA256 = sha2_ts_1.SHA256;
    exports.sha256 = sha2_ts_1.sha256;
    exports.SHA224 = sha2_ts_1.SHA224;
    exports.sha224 = sha2_ts_1.sha224;
  }
});

// (disabled):crypto
var require_crypto2 = __commonJS({
  "(disabled):crypto"() {
  }
});

// node_modules/@noble/secp256k1/lib/index.js
var require_lib = __commonJS({
  "node_modules/@noble/secp256k1/lib/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.utils = exports.schnorr = exports.verify = exports.signSync = exports.sign = exports.getSharedSecret = exports.recoverPublicKey = exports.getPublicKey = exports.hexToBytes = exports.bytesToHex = exports.Signature = exports.Point = exports.CURVE = void 0;
    var nodeCrypto = require_crypto2();
    var _0n8 = BigInt(0);
    var _1n7 = BigInt(1);
    var _2n5 = BigInt(2);
    var _3n3 = BigInt(3);
    var _8n3 = BigInt(8);
    var CURVE = Object.freeze({
      a: _0n8,
      b: BigInt(7),
      P: BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f"),
      n: BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141"),
      h: _1n7,
      Gx: BigInt("55066263022277343669578718895168534326250603453777594175500187360389116729240"),
      Gy: BigInt("32670510020758816978083085130507043184471273380659243275938904335757337482424"),
      beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee")
    });
    exports.CURVE = CURVE;
    var divNearest2 = (a, b) => (a + b / _2n5) / b;
    var endo = {
      beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
      splitScalar(k) {
        const { n } = CURVE;
        const a1 = BigInt("0x3086d221a7d46bcde86c90e49284eb15");
        const b1 = -_1n7 * BigInt("0xe4437ed6010e88286f547fa90abfe4c3");
        const a2 = BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8");
        const b2 = a1;
        const POW_2_128 = BigInt("0x100000000000000000000000000000000");
        const c1 = divNearest2(b2 * k, n);
        const c2 = divNearest2(-b1 * k, n);
        let k1 = mod2(k - c1 * a1 - c2 * a2, n);
        let k2 = mod2(-c1 * b1 - c2 * b2, n);
        const k1neg = k1 > POW_2_128;
        const k2neg = k2 > POW_2_128;
        if (k1neg)
          k1 = n - k1;
        if (k2neg)
          k2 = n - k2;
        if (k1 > POW_2_128 || k2 > POW_2_128) {
          throw new Error("splitScalarEndo: Endomorphism failed, k=" + k);
        }
        return { k1neg, k1, k2neg, k2 };
      }
    };
    var fieldLen = 32;
    var groupLen = 32;
    var hashLen = 32;
    var compressedLen = fieldLen + 1;
    var uncompressedLen = 2 * fieldLen + 1;
    function weierstrass2(x) {
      const { a, b } = CURVE;
      const x2 = mod2(x * x);
      const x3 = mod2(x2 * x);
      return mod2(x3 + a * x + b);
    }
    var USE_ENDOMORPHISM = CURVE.a === _0n8;
    var ShaError = class extends Error {
      constructor(message) {
        super(message);
      }
    };
    function assertJacPoint(other) {
      if (!(other instanceof JacobianPoint))
        throw new TypeError("JacobianPoint expected");
    }
    var JacobianPoint = class _JacobianPoint {
      constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
      }
      static fromAffine(p) {
        if (!(p instanceof Point2)) {
          throw new TypeError("JacobianPoint#fromAffine: expected Point");
        }
        if (p.equals(Point2.ZERO))
          return _JacobianPoint.ZERO;
        return new _JacobianPoint(p.x, p.y, _1n7);
      }
      static toAffineBatch(points) {
        const toInv = invertBatch(points.map((p) => p.z));
        return points.map((p, i) => p.toAffine(toInv[i]));
      }
      static normalizeZ(points) {
        return _JacobianPoint.toAffineBatch(points).map(_JacobianPoint.fromAffine);
      }
      equals(other) {
        assertJacPoint(other);
        const { x: X1, y: Y1, z: Z1 } = this;
        const { x: X2, y: Y2, z: Z2 } = other;
        const Z1Z1 = mod2(Z1 * Z1);
        const Z2Z2 = mod2(Z2 * Z2);
        const U1 = mod2(X1 * Z2Z2);
        const U2 = mod2(X2 * Z1Z1);
        const S1 = mod2(mod2(Y1 * Z2) * Z2Z2);
        const S2 = mod2(mod2(Y2 * Z1) * Z1Z1);
        return U1 === U2 && S1 === S2;
      }
      negate() {
        return new _JacobianPoint(this.x, mod2(-this.y), this.z);
      }
      double() {
        const { x: X1, y: Y1, z: Z1 } = this;
        const A = mod2(X1 * X1);
        const B = mod2(Y1 * Y1);
        const C = mod2(B * B);
        const x1b = X1 + B;
        const D = mod2(_2n5 * (mod2(x1b * x1b) - A - C));
        const E = mod2(_3n3 * A);
        const F = mod2(E * E);
        const X3 = mod2(F - _2n5 * D);
        const Y3 = mod2(E * (D - X3) - _8n3 * C);
        const Z3 = mod2(_2n5 * Y1 * Z1);
        return new _JacobianPoint(X3, Y3, Z3);
      }
      add(other) {
        assertJacPoint(other);
        const { x: X1, y: Y1, z: Z1 } = this;
        const { x: X2, y: Y2, z: Z2 } = other;
        if (X2 === _0n8 || Y2 === _0n8)
          return this;
        if (X1 === _0n8 || Y1 === _0n8)
          return other;
        const Z1Z1 = mod2(Z1 * Z1);
        const Z2Z2 = mod2(Z2 * Z2);
        const U1 = mod2(X1 * Z2Z2);
        const U2 = mod2(X2 * Z1Z1);
        const S1 = mod2(mod2(Y1 * Z2) * Z2Z2);
        const S2 = mod2(mod2(Y2 * Z1) * Z1Z1);
        const H = mod2(U2 - U1);
        const r = mod2(S2 - S1);
        if (H === _0n8) {
          if (r === _0n8) {
            return this.double();
          } else {
            return _JacobianPoint.ZERO;
          }
        }
        const HH = mod2(H * H);
        const HHH = mod2(H * HH);
        const V = mod2(U1 * HH);
        const X3 = mod2(r * r - HHH - _2n5 * V);
        const Y3 = mod2(r * (V - X3) - S1 * HHH);
        const Z3 = mod2(Z1 * Z2 * H);
        return new _JacobianPoint(X3, Y3, Z3);
      }
      subtract(other) {
        return this.add(other.negate());
      }
      multiplyUnsafe(scalar) {
        const P0 = _JacobianPoint.ZERO;
        if (typeof scalar === "bigint" && scalar === _0n8)
          return P0;
        let n = normalizeScalar(scalar);
        if (n === _1n7)
          return this;
        if (!USE_ENDOMORPHISM) {
          let p = P0;
          let d2 = this;
          while (n > _0n8) {
            if (n & _1n7)
              p = p.add(d2);
            d2 = d2.double();
            n >>= _1n7;
          }
          return p;
        }
        let { k1neg, k1, k2neg, k2 } = endo.splitScalar(n);
        let k1p = P0;
        let k2p = P0;
        let d = this;
        while (k1 > _0n8 || k2 > _0n8) {
          if (k1 & _1n7)
            k1p = k1p.add(d);
          if (k2 & _1n7)
            k2p = k2p.add(d);
          d = d.double();
          k1 >>= _1n7;
          k2 >>= _1n7;
        }
        if (k1neg)
          k1p = k1p.negate();
        if (k2neg)
          k2p = k2p.negate();
        k2p = new _JacobianPoint(mod2(k2p.x * endo.beta), k2p.y, k2p.z);
        return k1p.add(k2p);
      }
      precomputeWindow(W2) {
        const windows = USE_ENDOMORPHISM ? 128 / W2 + 1 : 256 / W2 + 1;
        const points = [];
        let p = this;
        let base = p;
        for (let window2 = 0; window2 < windows; window2++) {
          base = p;
          points.push(base);
          for (let i = 1; i < 2 ** (W2 - 1); i++) {
            base = base.add(p);
            points.push(base);
          }
          p = base.double();
        }
        return points;
      }
      wNAF(n, affinePoint) {
        if (!affinePoint && this.equals(_JacobianPoint.BASE))
          affinePoint = Point2.BASE;
        const W2 = affinePoint && affinePoint._WINDOW_SIZE || 1;
        if (256 % W2) {
          throw new Error("Point#wNAF: Invalid precomputation window, must be power of 2");
        }
        let precomputes = affinePoint && pointPrecomputes2.get(affinePoint);
        if (!precomputes) {
          precomputes = this.precomputeWindow(W2);
          if (affinePoint && W2 !== 1) {
            precomputes = _JacobianPoint.normalizeZ(precomputes);
            pointPrecomputes2.set(affinePoint, precomputes);
          }
        }
        let p = _JacobianPoint.ZERO;
        let f = _JacobianPoint.BASE;
        const windows = 1 + (USE_ENDOMORPHISM ? 128 / W2 : 256 / W2);
        const windowSize = 2 ** (W2 - 1);
        const mask = BigInt(2 ** W2 - 1);
        const maxNumber = 2 ** W2;
        const shiftBy = BigInt(W2);
        for (let window2 = 0; window2 < windows; window2++) {
          const offset = window2 * windowSize;
          let wbits = Number(n & mask);
          n >>= shiftBy;
          if (wbits > windowSize) {
            wbits -= maxNumber;
            n += _1n7;
          }
          const offset1 = offset;
          const offset2 = offset + Math.abs(wbits) - 1;
          const cond1 = window2 % 2 !== 0;
          const cond2 = wbits < 0;
          if (wbits === 0) {
            f = f.add(constTimeNegate(cond1, precomputes[offset1]));
          } else {
            p = p.add(constTimeNegate(cond2, precomputes[offset2]));
          }
        }
        return { p, f };
      }
      multiply(scalar, affinePoint) {
        let n = normalizeScalar(scalar);
        let point;
        let fake;
        if (USE_ENDOMORPHISM) {
          const { k1neg, k1, k2neg, k2 } = endo.splitScalar(n);
          let { p: k1p, f: f1p } = this.wNAF(k1, affinePoint);
          let { p: k2p, f: f2p } = this.wNAF(k2, affinePoint);
          k1p = constTimeNegate(k1neg, k1p);
          k2p = constTimeNegate(k2neg, k2p);
          k2p = new _JacobianPoint(mod2(k2p.x * endo.beta), k2p.y, k2p.z);
          point = k1p.add(k2p);
          fake = f1p.add(f2p);
        } else {
          const { p, f } = this.wNAF(n, affinePoint);
          point = p;
          fake = f;
        }
        return _JacobianPoint.normalizeZ([point, fake])[0];
      }
      toAffine(invZ) {
        const { x, y, z } = this;
        const is0 = this.equals(_JacobianPoint.ZERO);
        if (invZ == null)
          invZ = is0 ? _8n3 : invert2(z);
        const iz1 = invZ;
        const iz2 = mod2(iz1 * iz1);
        const iz3 = mod2(iz2 * iz1);
        const ax = mod2(x * iz2);
        const ay = mod2(y * iz3);
        const zz = mod2(z * iz1);
        if (is0)
          return Point2.ZERO;
        if (zz !== _1n7)
          throw new Error("invZ was invalid");
        return new Point2(ax, ay);
      }
    };
    JacobianPoint.BASE = new JacobianPoint(CURVE.Gx, CURVE.Gy, _1n7);
    JacobianPoint.ZERO = new JacobianPoint(_0n8, _1n7, _0n8);
    function constTimeNegate(condition, item) {
      const neg = item.negate();
      return condition ? neg : item;
    }
    var pointPrecomputes2 = /* @__PURE__ */ new WeakMap();
    var Point2 = class _Point {
      constructor(x, y) {
        this.x = x;
        this.y = y;
      }
      _setWindowSize(windowSize) {
        this._WINDOW_SIZE = windowSize;
        pointPrecomputes2.delete(this);
      }
      hasEvenY() {
        return this.y % _2n5 === _0n8;
      }
      static fromCompressedHex(bytes) {
        const isShort = bytes.length === 32;
        const x = bytesToNumber(isShort ? bytes : bytes.subarray(1));
        if (!isValidFieldElement(x))
          throw new Error("Point is not on curve");
        const y2 = weierstrass2(x);
        let y = sqrtMod2(y2);
        const isYOdd = (y & _1n7) === _1n7;
        if (isShort) {
          if (isYOdd)
            y = mod2(-y);
        } else {
          const isFirstByteOdd = (bytes[0] & 1) === 1;
          if (isFirstByteOdd !== isYOdd)
            y = mod2(-y);
        }
        const point = new _Point(x, y);
        point.assertValidity();
        return point;
      }
      static fromUncompressedHex(bytes) {
        const x = bytesToNumber(bytes.subarray(1, fieldLen + 1));
        const y = bytesToNumber(bytes.subarray(fieldLen + 1, fieldLen * 2 + 1));
        const point = new _Point(x, y);
        point.assertValidity();
        return point;
      }
      static fromHex(hex4) {
        const bytes = ensureBytes(hex4);
        const len = bytes.length;
        const header = bytes[0];
        if (len === fieldLen)
          return this.fromCompressedHex(bytes);
        if (len === compressedLen && (header === 2 || header === 3)) {
          return this.fromCompressedHex(bytes);
        }
        if (len === uncompressedLen && header === 4)
          return this.fromUncompressedHex(bytes);
        throw new Error(`Point.fromHex: received invalid point. Expected 32-${compressedLen} compressed bytes or ${uncompressedLen} uncompressed bytes, not ${len}`);
      }
      static fromPrivateKey(privateKey) {
        return _Point.BASE.multiply(normalizePrivateKey(privateKey));
      }
      static fromSignature(msgHash, signature, recovery) {
        const { r, s } = normalizeSignature(signature);
        if (![0, 1, 2, 3].includes(recovery))
          throw new Error("Cannot recover: invalid recovery bit");
        const h = truncateHash(ensureBytes(msgHash));
        const { n } = CURVE;
        const radj = recovery === 2 || recovery === 3 ? r + n : r;
        const rinv = invert2(radj, n);
        const u1 = mod2(-h * rinv, n);
        const u2 = mod2(s * rinv, n);
        const prefix2 = recovery & 1 ? "03" : "02";
        const R = _Point.fromHex(prefix2 + numTo32bStr(radj));
        const Q = _Point.BASE.multiplyAndAddUnsafe(R, u1, u2);
        if (!Q)
          throw new Error("Cannot recover signature: point at infinify");
        Q.assertValidity();
        return Q;
      }
      toRawBytes(isCompressed = false) {
        return hexToBytes3(this.toHex(isCompressed));
      }
      toHex(isCompressed = false) {
        const x = numTo32bStr(this.x);
        if (isCompressed) {
          const prefix2 = this.hasEvenY() ? "02" : "03";
          return `${prefix2}${x}`;
        } else {
          return `04${x}${numTo32bStr(this.y)}`;
        }
      }
      toHexX() {
        return this.toHex(true).slice(2);
      }
      toRawX() {
        return this.toRawBytes(true).slice(1);
      }
      assertValidity() {
        const msg = "Point is not on elliptic curve";
        const { x, y } = this;
        if (!isValidFieldElement(x) || !isValidFieldElement(y))
          throw new Error(msg);
        const left = mod2(y * y);
        const right = weierstrass2(x);
        if (mod2(left - right) !== _0n8)
          throw new Error(msg);
      }
      equals(other) {
        return this.x === other.x && this.y === other.y;
      }
      negate() {
        return new _Point(this.x, mod2(-this.y));
      }
      double() {
        return JacobianPoint.fromAffine(this).double().toAffine();
      }
      add(other) {
        return JacobianPoint.fromAffine(this).add(JacobianPoint.fromAffine(other)).toAffine();
      }
      subtract(other) {
        return this.add(other.negate());
      }
      multiply(scalar) {
        return JacobianPoint.fromAffine(this).multiply(scalar, this).toAffine();
      }
      multiplyAndAddUnsafe(Q, a, b) {
        const P = JacobianPoint.fromAffine(this);
        const aP = a === _0n8 || a === _1n7 || this !== _Point.BASE ? P.multiplyUnsafe(a) : P.multiply(a);
        const bQ = JacobianPoint.fromAffine(Q).multiplyUnsafe(b);
        const sum = aP.add(bQ);
        return sum.equals(JacobianPoint.ZERO) ? void 0 : sum.toAffine();
      }
    };
    exports.Point = Point2;
    Point2.BASE = new Point2(CURVE.Gx, CURVE.Gy);
    Point2.ZERO = new Point2(_0n8, _0n8);
    function sliceDER(s) {
      return Number.parseInt(s[0], 16) >= 8 ? "00" + s : s;
    }
    function parseDERInt(data) {
      if (data.length < 2 || data[0] !== 2) {
        throw new Error(`Invalid signature integer tag: ${bytesToHex3(data)}`);
      }
      const len = data[1];
      const res = data.subarray(2, len + 2);
      if (!len || res.length !== len) {
        throw new Error(`Invalid signature integer: wrong length`);
      }
      if (res[0] === 0 && res[1] <= 127) {
        throw new Error("Invalid signature integer: trailing length");
      }
      return { data: bytesToNumber(res), left: data.subarray(len + 2) };
    }
    function parseDERSignature(data) {
      if (data.length < 2 || data[0] != 48) {
        throw new Error(`Invalid signature tag: ${bytesToHex3(data)}`);
      }
      if (data[1] !== data.length - 2) {
        throw new Error("Invalid signature: incorrect length");
      }
      const { data: r, left: sBytes } = parseDERInt(data.subarray(2));
      const { data: s, left: rBytesLeft } = parseDERInt(sBytes);
      if (rBytesLeft.length) {
        throw new Error(`Invalid signature: left bytes after parsing: ${bytesToHex3(rBytesLeft)}`);
      }
      return { r, s };
    }
    var Signature = class _Signature {
      constructor(r, s) {
        this.r = r;
        this.s = s;
        this.assertValidity();
      }
      static fromCompact(hex4) {
        const arr = isBytes8(hex4);
        const name = "Signature.fromCompact";
        if (typeof hex4 !== "string" && !arr)
          throw new TypeError(`${name}: Expected string or Uint8Array`);
        const str = arr ? bytesToHex3(hex4) : hex4;
        if (str.length !== 128)
          throw new Error(`${name}: Expected 64-byte hex`);
        return new _Signature(hexToNumber2(str.slice(0, 64)), hexToNumber2(str.slice(64, 128)));
      }
      static fromDER(hex4) {
        const arr = isBytes8(hex4);
        if (typeof hex4 !== "string" && !arr)
          throw new TypeError(`Signature.fromDER: Expected string or Uint8Array`);
        const { r, s } = parseDERSignature(arr ? hex4 : hexToBytes3(hex4));
        return new _Signature(r, s);
      }
      static fromHex(hex4) {
        return this.fromDER(hex4);
      }
      assertValidity() {
        const { r, s } = this;
        if (!isWithinCurveOrder(r))
          throw new Error("Invalid Signature: r must be 0 < r < n");
        if (!isWithinCurveOrder(s))
          throw new Error("Invalid Signature: s must be 0 < s < n");
      }
      hasHighS() {
        const HALF = CURVE.n >> _1n7;
        return this.s > HALF;
      }
      normalizeS() {
        return this.hasHighS() ? new _Signature(this.r, mod2(-this.s, CURVE.n)) : this;
      }
      toDERRawBytes() {
        return hexToBytes3(this.toDERHex());
      }
      toDERHex() {
        const sHex = sliceDER(numberToHexUnpadded2(this.s));
        const rHex = sliceDER(numberToHexUnpadded2(this.r));
        const sHexL = sHex.length / 2;
        const rHexL = rHex.length / 2;
        const sLen = numberToHexUnpadded2(sHexL);
        const rLen = numberToHexUnpadded2(rHexL);
        const length2 = numberToHexUnpadded2(rHexL + sHexL + 4);
        return `30${length2}02${rLen}${rHex}02${sLen}${sHex}`;
      }
      toRawBytes() {
        return this.toDERRawBytes();
      }
      toHex() {
        return this.toDERHex();
      }
      toCompactRawBytes() {
        return hexToBytes3(this.toCompactHex());
      }
      toCompactHex() {
        return numTo32bStr(this.r) + numTo32bStr(this.s);
      }
    };
    exports.Signature = Signature;
    function isBytes8(a) {
      return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
    }
    function abytes6(item) {
      if (!isBytes8(item))
        throw new Error("Uint8Array expected");
    }
    function concatBytes5(...arrays) {
      arrays.every(abytes6);
      if (arrays.length === 1)
        return arrays[0];
      const length2 = arrays.reduce((a, arr) => a + arr.length, 0);
      const result = new Uint8Array(length2);
      for (let i = 0, pad = 0; i < arrays.length; i++) {
        const arr = arrays[i];
        result.set(arr, pad);
        pad += arr.length;
      }
      return result;
    }
    var hexes2 = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
    function bytesToHex3(bytes) {
      abytes6(bytes);
      let hex4 = "";
      for (let i = 0; i < bytes.length; i++) {
        hex4 += hexes2[bytes[i]];
      }
      return hex4;
    }
    exports.bytesToHex = bytesToHex3;
    var asciis2 = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
    function asciiToBase162(ch2) {
      if (ch2 >= asciis2._0 && ch2 <= asciis2._9)
        return ch2 - asciis2._0;
      if (ch2 >= asciis2.A && ch2 <= asciis2.F)
        return ch2 - (asciis2.A - 10);
      if (ch2 >= asciis2.a && ch2 <= asciis2.f)
        return ch2 - (asciis2.a - 10);
      return;
    }
    function hexToBytes3(hex4) {
      if (typeof hex4 !== "string")
        throw new Error("hex string expected, got " + typeof hex4);
      const hl = hex4.length;
      const al = hl / 2;
      if (hl % 2)
        throw new Error("hex string expected, got unpadded hex of length " + hl);
      const array3 = new Uint8Array(al);
      for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
        const n1 = asciiToBase162(hex4.charCodeAt(hi));
        const n2 = asciiToBase162(hex4.charCodeAt(hi + 1));
        if (n1 === void 0 || n2 === void 0) {
          const char = hex4[hi] + hex4[hi + 1];
          throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
        }
        array3[ai] = n1 * 16 + n2;
      }
      return array3;
    }
    exports.hexToBytes = hexToBytes3;
    var POW_2_256 = BigInt("0x10000000000000000000000000000000000000000000000000000000000000000");
    function numTo32bStr(num2) {
      if (typeof num2 !== "bigint")
        throw new Error("Expected bigint");
      if (!(_0n8 <= num2 && num2 < POW_2_256))
        throw new Error("Expected number 0 <= n < 2^256");
      return num2.toString(16).padStart(64, "0");
    }
    function numTo32b(num2) {
      const b = hexToBytes3(numTo32bStr(num2));
      if (b.length !== 32)
        throw new Error("Error: expected 32 bytes");
      return b;
    }
    function numberToHexUnpadded2(num2) {
      const hex4 = num2.toString(16);
      return hex4.length & 1 ? `0${hex4}` : hex4;
    }
    function hexToNumber2(hex4) {
      if (typeof hex4 !== "string") {
        throw new TypeError("hexToNumber: expected string, got " + typeof hex4);
      }
      return BigInt(`0x${hex4}`);
    }
    function bytesToNumber(bytes) {
      return hexToNumber2(bytesToHex3(bytes));
    }
    function ensureBytes(hex4) {
      return isBytes8(hex4) ? Uint8Array.from(hex4) : hexToBytes3(hex4);
    }
    function normalizeScalar(num2) {
      if (typeof num2 === "number" && Number.isSafeInteger(num2) && num2 > 0)
        return BigInt(num2);
      if (typeof num2 === "bigint" && isWithinCurveOrder(num2))
        return num2;
      throw new TypeError("Expected valid private scalar: 0 < scalar < curve.n");
    }
    function mod2(a, b = CURVE.P) {
      const result = a % b;
      return result >= _0n8 ? result : b + result;
    }
    function pow22(x, power) {
      const { P } = CURVE;
      let res = x;
      while (power-- > _0n8) {
        res *= res;
        res %= P;
      }
      return res;
    }
    function sqrtMod2(x) {
      const { P } = CURVE;
      const _6n = BigInt(6);
      const _11n = BigInt(11);
      const _22n = BigInt(22);
      const _23n = BigInt(23);
      const _44n = BigInt(44);
      const _88n = BigInt(88);
      const b2 = x * x * x % P;
      const b3 = b2 * b2 * x % P;
      const b6 = pow22(b3, _3n3) * b3 % P;
      const b9 = pow22(b6, _3n3) * b3 % P;
      const b11 = pow22(b9, _2n5) * b2 % P;
      const b22 = pow22(b11, _11n) * b11 % P;
      const b44 = pow22(b22, _22n) * b22 % P;
      const b88 = pow22(b44, _44n) * b44 % P;
      const b176 = pow22(b88, _88n) * b88 % P;
      const b220 = pow22(b176, _44n) * b44 % P;
      const b223 = pow22(b220, _3n3) * b3 % P;
      const t1 = pow22(b223, _23n) * b22 % P;
      const t2 = pow22(t1, _6n) * b2 % P;
      const rt = pow22(t2, _2n5);
      const xc = rt * rt % P;
      if (xc !== x)
        throw new Error("Cannot find square root");
      return rt;
    }
    function invert2(number2, modulo = CURVE.P) {
      if (number2 === _0n8 || modulo <= _0n8) {
        throw new Error(`invert: expected positive integers, got n=${number2} mod=${modulo}`);
      }
      let a = mod2(number2, modulo);
      let b = modulo;
      let x = _0n8, y = _1n7, u = _1n7, v = _0n8;
      while (a !== _0n8) {
        const q = b / a;
        const r = b % a;
        const m = x - u * q;
        const n = y - v * q;
        b = a, a = r, x = u, y = v, u = m, v = n;
      }
      const gcd3 = b;
      if (gcd3 !== _1n7)
        throw new Error("invert: does not exist");
      return mod2(x, modulo);
    }
    function invertBatch(nums, p = CURVE.P) {
      const scratch = new Array(nums.length);
      const lastMultiplied = nums.reduce((acc, num2, i) => {
        if (num2 === _0n8)
          return acc;
        scratch[i] = acc;
        return mod2(acc * num2, p);
      }, _1n7);
      const inverted = invert2(lastMultiplied, p);
      nums.reduceRight((acc, num2, i) => {
        if (num2 === _0n8)
          return acc;
        scratch[i] = mod2(acc * scratch[i], p);
        return mod2(acc * num2, p);
      }, inverted);
      return scratch;
    }
    function bits2int_2(bytes) {
      const delta = bytes.length * 8 - groupLen * 8;
      const num2 = bytesToNumber(bytes);
      return delta > 0 ? num2 >> BigInt(delta) : num2;
    }
    function truncateHash(hash, truncateOnly = false) {
      const h = bits2int_2(hash);
      if (truncateOnly)
        return h;
      const { n } = CURVE;
      return h >= n ? h - n : h;
    }
    var _sha256Sync;
    var _hmacSha256Sync;
    var HmacDrbg = class {
      constructor(hashLen2, qByteLen) {
        this.hashLen = hashLen2;
        this.qByteLen = qByteLen;
        if (typeof hashLen2 !== "number" || hashLen2 < 2)
          throw new Error("hashLen must be a number");
        if (typeof qByteLen !== "number" || qByteLen < 2)
          throw new Error("qByteLen must be a number");
        this.v = new Uint8Array(hashLen2).fill(1);
        this.k = new Uint8Array(hashLen2).fill(0);
        this.counter = 0;
      }
      hmac(...values) {
        return exports.utils.hmacSha256(this.k, ...values);
      }
      hmacSync(...values) {
        return _hmacSha256Sync(this.k, ...values);
      }
      checkSync() {
        if (typeof _hmacSha256Sync !== "function")
          throw new ShaError("hmacSha256Sync needs to be set");
      }
      incr() {
        if (this.counter >= 1e3)
          throw new Error("Tried 1,000 k values for sign(), all were invalid");
        this.counter += 1;
      }
      async reseed(seed = new Uint8Array()) {
        this.k = await this.hmac(this.v, Uint8Array.from([0]), seed);
        this.v = await this.hmac(this.v);
        if (seed.length === 0)
          return;
        this.k = await this.hmac(this.v, Uint8Array.from([1]), seed);
        this.v = await this.hmac(this.v);
      }
      reseedSync(seed = new Uint8Array()) {
        this.checkSync();
        this.k = this.hmacSync(this.v, Uint8Array.from([0]), seed);
        this.v = this.hmacSync(this.v);
        if (seed.length === 0)
          return;
        this.k = this.hmacSync(this.v, Uint8Array.from([1]), seed);
        this.v = this.hmacSync(this.v);
      }
      async generate() {
        this.incr();
        let len = 0;
        const out = [];
        while (len < this.qByteLen) {
          this.v = await this.hmac(this.v);
          const sl = this.v.slice();
          out.push(sl);
          len += this.v.length;
        }
        return concatBytes5(...out);
      }
      generateSync() {
        this.checkSync();
        this.incr();
        let len = 0;
        const out = [];
        while (len < this.qByteLen) {
          this.v = this.hmacSync(this.v);
          const sl = this.v.slice();
          out.push(sl);
          len += this.v.length;
        }
        return concatBytes5(...out);
      }
    };
    function isWithinCurveOrder(num2) {
      return _0n8 < num2 && num2 < CURVE.n;
    }
    function isValidFieldElement(num2) {
      return _0n8 < num2 && num2 < CURVE.P;
    }
    function kmdToSig(kBytes, m, d, lowS = true) {
      const { n } = CURVE;
      const k = truncateHash(kBytes, true);
      if (!isWithinCurveOrder(k))
        return;
      const kinv = invert2(k, n);
      const q = Point2.BASE.multiply(k);
      const r = mod2(q.x, n);
      if (r === _0n8)
        return;
      const s = mod2(kinv * mod2(m + d * r, n), n);
      if (s === _0n8)
        return;
      let sig = new Signature(r, s);
      let recovery = (q.x === sig.r ? 0 : 2) | Number(q.y & _1n7);
      if (lowS && sig.hasHighS()) {
        sig = sig.normalizeS();
        recovery ^= 1;
      }
      return { sig, recovery };
    }
    function normalizePrivateKey(key) {
      let num2;
      if (typeof key === "bigint") {
        num2 = key;
      } else if (typeof key === "number" && Number.isSafeInteger(key) && key > 0) {
        num2 = BigInt(key);
      } else if (typeof key === "string") {
        if (key.length !== 2 * groupLen)
          throw new Error("Expected 32 bytes of private key");
        num2 = hexToNumber2(key);
      } else if (isBytes8(key)) {
        if (key.length !== groupLen)
          throw new Error("Expected 32 bytes of private key");
        num2 = bytesToNumber(key);
      } else {
        throw new TypeError("Expected valid private key");
      }
      if (!isWithinCurveOrder(num2))
        throw new Error("Expected private key: 0 < key < n");
      return num2;
    }
    function normalizePublicKey(publicKey) {
      if (publicKey instanceof Point2) {
        publicKey.assertValidity();
        return publicKey;
      } else {
        return Point2.fromHex(publicKey);
      }
    }
    function normalizeSignature(signature) {
      if (signature instanceof Signature) {
        signature.assertValidity();
        return signature;
      }
      try {
        return Signature.fromDER(signature);
      } catch (error) {
        return Signature.fromCompact(signature);
      }
    }
    function getPublicKey(privateKey, isCompressed = false) {
      return Point2.fromPrivateKey(privateKey).toRawBytes(isCompressed);
    }
    exports.getPublicKey = getPublicKey;
    function recoverPublicKey(msgHash, signature, recovery, isCompressed = false) {
      return Point2.fromSignature(msgHash, signature, recovery).toRawBytes(isCompressed);
    }
    exports.recoverPublicKey = recoverPublicKey;
    function isProbPub(item) {
      const arr = isBytes8(item);
      const str = typeof item === "string";
      const len = (arr || str) && item.length;
      if (arr)
        return len === compressedLen || len === uncompressedLen;
      if (str)
        return len === compressedLen * 2 || len === uncompressedLen * 2;
      if (item instanceof Point2)
        return true;
      return false;
    }
    function getSharedSecret(privateA, publicB, isCompressed = false) {
      if (isProbPub(privateA))
        throw new TypeError("getSharedSecret: first arg must be private key");
      if (!isProbPub(publicB))
        throw new TypeError("getSharedSecret: second arg must be public key");
      const b = normalizePublicKey(publicB);
      b.assertValidity();
      return b.multiply(normalizePrivateKey(privateA)).toRawBytes(isCompressed);
    }
    exports.getSharedSecret = getSharedSecret;
    function bits2int(bytes) {
      const slice = bytes.length > fieldLen ? bytes.slice(0, fieldLen) : bytes;
      return bytesToNumber(slice);
    }
    function bits2octets(bytes) {
      const z1 = bits2int(bytes);
      const z2 = mod2(z1, CURVE.n);
      return int2octets(z2 < _0n8 ? z1 : z2);
    }
    function int2octets(num2) {
      return numTo32b(num2);
    }
    function initSigArgs(msgHash, privateKey, extraEntropy) {
      if (msgHash == null)
        throw new Error(`sign: expected valid message hash, not "${msgHash}"`);
      const h1 = ensureBytes(msgHash);
      const d = normalizePrivateKey(privateKey);
      const seedArgs = [int2octets(d), bits2octets(h1)];
      if (extraEntropy != null) {
        if (extraEntropy === true)
          extraEntropy = exports.utils.randomBytes(fieldLen);
        const e = ensureBytes(extraEntropy);
        if (e.length !== fieldLen)
          throw new Error(`sign: Expected ${fieldLen} bytes of extra data`);
        seedArgs.push(e);
      }
      const seed = concatBytes5(...seedArgs);
      const m = bits2int(h1);
      return { seed, m, d };
    }
    function finalizeSig(recSig, opts) {
      const { sig, recovery } = recSig;
      const { der, recovered } = Object.assign({ canonical: true, der: true }, opts);
      const hashed = der ? sig.toDERRawBytes() : sig.toCompactRawBytes();
      return recovered ? [hashed, recovery] : hashed;
    }
    async function sign(msgHash, privKey, opts = {}) {
      const { seed, m, d } = initSigArgs(msgHash, privKey, opts.extraEntropy);
      const drbg = new HmacDrbg(hashLen, groupLen);
      await drbg.reseed(seed);
      let sig;
      while (!(sig = kmdToSig(await drbg.generate(), m, d, opts.canonical)))
        await drbg.reseed();
      return finalizeSig(sig, opts);
    }
    exports.sign = sign;
    function signSync(msgHash, privKey, opts = {}) {
      const { seed, m, d } = initSigArgs(msgHash, privKey, opts.extraEntropy);
      const drbg = new HmacDrbg(hashLen, groupLen);
      drbg.reseedSync(seed);
      let sig;
      while (!(sig = kmdToSig(drbg.generateSync(), m, d, opts.canonical)))
        drbg.reseedSync();
      return finalizeSig(sig, opts);
    }
    exports.signSync = signSync;
    var vopts = { strict: true };
    function verify(signature, msgHash, publicKey, opts = vopts) {
      let sig;
      try {
        sig = normalizeSignature(signature);
        msgHash = ensureBytes(msgHash);
      } catch (error) {
        return false;
      }
      const { r, s } = sig;
      if (opts.strict && sig.hasHighS())
        return false;
      const h = truncateHash(msgHash);
      let P;
      try {
        P = normalizePublicKey(publicKey);
      } catch (error) {
        return false;
      }
      const { n } = CURVE;
      const sinv = invert2(s, n);
      const u1 = mod2(h * sinv, n);
      const u2 = mod2(r * sinv, n);
      const R = Point2.BASE.multiplyAndAddUnsafe(P, u1, u2);
      if (!R)
        return false;
      const v = mod2(R.x, n);
      return v === r;
    }
    exports.verify = verify;
    function schnorrChallengeFinalize(ch2) {
      return mod2(bytesToNumber(ch2), CURVE.n);
    }
    var SchnorrSignature = class _SchnorrSignature {
      constructor(r, s) {
        this.r = r;
        this.s = s;
        this.assertValidity();
      }
      static fromHex(hex4) {
        const bytes = ensureBytes(hex4);
        if (bytes.length !== 64)
          throw new TypeError(`SchnorrSignature.fromHex: expected 64 bytes, not ${bytes.length}`);
        const r = bytesToNumber(bytes.subarray(0, 32));
        const s = bytesToNumber(bytes.subarray(32, 64));
        return new _SchnorrSignature(r, s);
      }
      assertValidity() {
        const { r, s } = this;
        if (!isValidFieldElement(r) || !isWithinCurveOrder(s))
          throw new Error("Invalid signature");
      }
      toHex() {
        return numTo32bStr(this.r) + numTo32bStr(this.s);
      }
      toRawBytes() {
        return hexToBytes3(this.toHex());
      }
    };
    function schnorrGetPublicKey2(privateKey) {
      return Point2.fromPrivateKey(privateKey).toRawX();
    }
    var InternalSchnorrSignature = class {
      constructor(message, privateKey, auxRand = exports.utils.randomBytes()) {
        if (message == null)
          throw new TypeError(`sign: Expected valid message, not "${message}"`);
        this.m = ensureBytes(message);
        const { x, scalar } = this.getScalar(normalizePrivateKey(privateKey));
        this.px = x;
        this.d = scalar;
        this.rand = ensureBytes(auxRand);
        if (this.rand.length !== 32)
          throw new TypeError("sign: Expected 32 bytes of aux randomness");
      }
      getScalar(priv) {
        const point = Point2.fromPrivateKey(priv);
        const scalar = point.hasEvenY() ? priv : CURVE.n - priv;
        return { point, scalar, x: point.toRawX() };
      }
      initNonce(d, t0h) {
        return numTo32b(d ^ bytesToNumber(t0h));
      }
      finalizeNonce(k0h) {
        const k0 = mod2(bytesToNumber(k0h), CURVE.n);
        if (k0 === _0n8)
          throw new Error("sign: Creation of signature failed. k is zero");
        const { point: R, x: rx, scalar: k } = this.getScalar(k0);
        return { R, rx, k };
      }
      finalizeSig(R, k, e, d) {
        return new SchnorrSignature(R.x, mod2(k + e * d, CURVE.n)).toRawBytes();
      }
      error() {
        throw new Error("sign: Invalid signature produced");
      }
      async calc() {
        const { m, d, px, rand } = this;
        const tag2 = exports.utils.taggedHash;
        const t = this.initNonce(d, await tag2(TAGS.aux, rand));
        const { R, rx, k } = this.finalizeNonce(await tag2(TAGS.nonce, t, px, m));
        const e = schnorrChallengeFinalize(await tag2(TAGS.challenge, rx, px, m));
        const sig = this.finalizeSig(R, k, e, d);
        if (!await schnorrVerify2(sig, m, px))
          this.error();
        return sig;
      }
      calcSync() {
        const { m, d, px, rand } = this;
        const tag2 = exports.utils.taggedHashSync;
        const t = this.initNonce(d, tag2(TAGS.aux, rand));
        const { R, rx, k } = this.finalizeNonce(tag2(TAGS.nonce, t, px, m));
        const e = schnorrChallengeFinalize(tag2(TAGS.challenge, rx, px, m));
        const sig = this.finalizeSig(R, k, e, d);
        if (!schnorrVerifySync(sig, m, px))
          this.error();
        return sig;
      }
    };
    async function schnorrSign2(msg, privKey, auxRand) {
      return new InternalSchnorrSignature(msg, privKey, auxRand).calc();
    }
    function schnorrSignSync(msg, privKey, auxRand) {
      return new InternalSchnorrSignature(msg, privKey, auxRand).calcSync();
    }
    function initSchnorrVerify(signature, message, publicKey) {
      const raw = signature instanceof SchnorrSignature;
      const sig = raw ? signature : SchnorrSignature.fromHex(signature);
      if (raw)
        sig.assertValidity();
      return {
        ...sig,
        m: ensureBytes(message),
        P: normalizePublicKey(publicKey)
      };
    }
    function finalizeSchnorrVerify(r, P, s, e) {
      const R = Point2.BASE.multiplyAndAddUnsafe(P, normalizePrivateKey(s), mod2(-e, CURVE.n));
      if (!R || !R.hasEvenY() || R.x !== r)
        return false;
      return true;
    }
    async function schnorrVerify2(signature, message, publicKey) {
      try {
        const { r, s, m, P } = initSchnorrVerify(signature, message, publicKey);
        const e = schnorrChallengeFinalize(await exports.utils.taggedHash(TAGS.challenge, numTo32b(r), P.toRawX(), m));
        return finalizeSchnorrVerify(r, P, s, e);
      } catch (error) {
        return false;
      }
    }
    function schnorrVerifySync(signature, message, publicKey) {
      try {
        const { r, s, m, P } = initSchnorrVerify(signature, message, publicKey);
        const e = schnorrChallengeFinalize(exports.utils.taggedHashSync(TAGS.challenge, numTo32b(r), P.toRawX(), m));
        return finalizeSchnorrVerify(r, P, s, e);
      } catch (error) {
        if (error instanceof ShaError)
          throw error;
        return false;
      }
    }
    exports.schnorr = {
      Signature: SchnorrSignature,
      getPublicKey: schnorrGetPublicKey2,
      sign: schnorrSign2,
      verify: schnorrVerify2,
      signSync: schnorrSignSync,
      verifySync: schnorrVerifySync
    };
    Point2.BASE._setWindowSize(8);
    var crypto2 = {
      node: nodeCrypto,
      web: typeof self === "object" && "crypto" in self ? self.crypto : void 0
    };
    var TAGS = {
      challenge: "BIP0340/challenge",
      aux: "BIP0340/aux",
      nonce: "BIP0340/nonce"
    };
    var TAGGED_HASH_PREFIXES2 = {};
    exports.utils = {
      bytesToHex: bytesToHex3,
      hexToBytes: hexToBytes3,
      concatBytes: concatBytes5,
      mod: mod2,
      invert: invert2,
      isValidPrivateKey(privateKey) {
        try {
          normalizePrivateKey(privateKey);
          return true;
        } catch (error) {
          return false;
        }
      },
      _bigintTo32Bytes: numTo32b,
      _normalizePrivateKey: normalizePrivateKey,
      hashToPrivateKey: (hash) => {
        hash = ensureBytes(hash);
        const minLen = groupLen + 8;
        if (hash.length < minLen || hash.length > 1024) {
          throw new Error(`Expected valid bytes of private key as per FIPS 186`);
        }
        const num2 = mod2(bytesToNumber(hash), CURVE.n - _1n7) + _1n7;
        return numTo32b(num2);
      },
      randomBytes: (bytesLength = 32) => {
        if (crypto2.web) {
          return crypto2.web.getRandomValues(new Uint8Array(bytesLength));
        } else if (crypto2.node) {
          const { randomBytes: randomBytes3 } = crypto2.node;
          return Uint8Array.from(randomBytes3(bytesLength));
        } else {
          throw new Error("The environment doesn't have randomBytes function");
        }
      },
      randomPrivateKey: () => exports.utils.hashToPrivateKey(exports.utils.randomBytes(groupLen + 8)),
      precompute(windowSize = 8, point = Point2.BASE) {
        const cached = point === Point2.BASE ? point : new Point2(point.x, point.y);
        cached._setWindowSize(windowSize);
        cached.multiply(_3n3);
        return cached;
      },
      sha256: async (...messages) => {
        if (crypto2.web) {
          const buffer = await crypto2.web.subtle.digest("SHA-256", concatBytes5(...messages));
          return new Uint8Array(buffer);
        } else if (crypto2.node) {
          const { createHash: createHash2 } = crypto2.node;
          const hash = createHash2("sha256");
          messages.forEach((m) => hash.update(m));
          return Uint8Array.from(hash.digest());
        } else {
          throw new Error("The environment doesn't have sha256 function");
        }
      },
      hmacSha256: async (key, ...messages) => {
        if (crypto2.web) {
          const ckey = await crypto2.web.subtle.importKey("raw", key, { name: "HMAC", hash: { name: "SHA-256" } }, false, ["sign"]);
          const message = concatBytes5(...messages);
          const buffer = await crypto2.web.subtle.sign("HMAC", ckey, message);
          return new Uint8Array(buffer);
        } else if (crypto2.node) {
          const { createHmac } = crypto2.node;
          const hash = createHmac("sha256", key);
          messages.forEach((m) => hash.update(m));
          return Uint8Array.from(hash.digest());
        } else {
          throw new Error("The environment doesn't have hmac-sha256 function");
        }
      },
      sha256Sync: void 0,
      hmacSha256Sync: void 0,
      taggedHash: async (tag2, ...messages) => {
        let tagP = TAGGED_HASH_PREFIXES2[tag2];
        if (tagP === void 0) {
          const tagH = await exports.utils.sha256(Uint8Array.from(tag2, (c) => c.charCodeAt(0)));
          tagP = concatBytes5(tagH, tagH);
          TAGGED_HASH_PREFIXES2[tag2] = tagP;
        }
        return exports.utils.sha256(tagP, ...messages);
      },
      taggedHashSync: (tag2, ...messages) => {
        if (typeof _sha256Sync !== "function")
          throw new ShaError("sha256Sync is undefined, you need to set it");
        let tagP = TAGGED_HASH_PREFIXES2[tag2];
        if (tagP === void 0) {
          const tagH = _sha256Sync(Uint8Array.from(tag2, (c) => c.charCodeAt(0)));
          tagP = concatBytes5(tagH, tagH);
          TAGGED_HASH_PREFIXES2[tag2] = tagP;
        }
        return _sha256Sync(tagP, ...messages);
      },
      _JacobianPoint: JacobianPoint
    };
    Object.defineProperties(exports.utils, {
      sha256Sync: {
        configurable: false,
        get() {
          return _sha256Sync;
        },
        set(val) {
          if (!_sha256Sync)
            _sha256Sync = val;
        }
      },
      hmacSha256Sync: {
        configurable: false,
        get() {
          return _hmacSha256Sync;
        },
        set(val) {
          if (!_hmacSha256Sync)
            _hmacSha256Sync = val;
        }
      }
    });
  }
});

// node_modules/jsontokens/lib/ecdsaSigFormatter.js
var require_ecdsaSigFormatter = __commonJS({
  "node_modules/jsontokens/lib/ecdsaSigFormatter.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.joseToDer = exports.derToJose = void 0;
    var base64_js_1 = require_base64_js();
    var base64Url_1 = require_base64Url();
    function getParamSize(keySize) {
      return (keySize / 8 | 0) + (keySize % 8 === 0 ? 0 : 1);
    }
    var paramBytesForAlg = {
      ES256: getParamSize(256),
      ES384: getParamSize(384),
      ES512: getParamSize(521)
    };
    function getParamBytesForAlg(alg) {
      const paramBytes = paramBytesForAlg[alg];
      if (paramBytes) {
        return paramBytes;
      }
      throw new Error(`Unknown algorithm "${alg}"`);
    }
    var MAX_OCTET = 128;
    var CLASS_UNIVERSAL = 0;
    var PRIMITIVE_BIT = 32;
    var TAG_SEQ = 16;
    var TAG_INT = 2;
    var ENCODED_TAG_SEQ = TAG_SEQ | PRIMITIVE_BIT | CLASS_UNIVERSAL << 6;
    var ENCODED_TAG_INT = TAG_INT | CLASS_UNIVERSAL << 6;
    function signatureAsBytes(signature) {
      if (signature instanceof Uint8Array) {
        return signature;
      } else if ("string" === typeof signature) {
        return (0, base64_js_1.toByteArray)((0, base64Url_1.pad)(signature));
      }
      throw new TypeError("ECDSA signature must be a Base64 string or a Uint8Array");
    }
    function derToJose(signature, alg) {
      const signatureBytes = signatureAsBytes(signature);
      const paramBytes = getParamBytesForAlg(alg);
      const maxEncodedParamLength = paramBytes + 1;
      const inputLength = signatureBytes.length;
      let offset = 0;
      if (signatureBytes[offset++] !== ENCODED_TAG_SEQ) {
        throw new Error('Could not find expected "seq"');
      }
      let seqLength = signatureBytes[offset++];
      if (seqLength === (MAX_OCTET | 1)) {
        seqLength = signatureBytes[offset++];
      }
      if (inputLength - offset < seqLength) {
        throw new Error(`"seq" specified length of "${seqLength}", only "${inputLength - offset}" remaining`);
      }
      if (signatureBytes[offset++] !== ENCODED_TAG_INT) {
        throw new Error('Could not find expected "int" for "r"');
      }
      const rLength = signatureBytes[offset++];
      if (inputLength - offset - 2 < rLength) {
        throw new Error(`"r" specified length of "${rLength}", only "${inputLength - offset - 2}" available`);
      }
      if (maxEncodedParamLength < rLength) {
        throw new Error(`"r" specified length of "${rLength}", max of "${maxEncodedParamLength}" is acceptable`);
      }
      const rOffset = offset;
      offset += rLength;
      if (signatureBytes[offset++] !== ENCODED_TAG_INT) {
        throw new Error('Could not find expected "int" for "s"');
      }
      const sLength = signatureBytes[offset++];
      if (inputLength - offset !== sLength) {
        throw new Error(`"s" specified length of "${sLength}", expected "${inputLength - offset}"`);
      }
      if (maxEncodedParamLength < sLength) {
        throw new Error(`"s" specified length of "${sLength}", max of "${maxEncodedParamLength}" is acceptable`);
      }
      const sOffset = offset;
      offset += sLength;
      if (offset !== inputLength) {
        throw new Error(`Expected to consume entire array, but "${inputLength - offset}" bytes remain`);
      }
      const rPadding = paramBytes - rLength;
      const sPadding = paramBytes - sLength;
      const dst = new Uint8Array(rPadding + rLength + sPadding + sLength);
      for (offset = 0; offset < rPadding; ++offset) {
        dst[offset] = 0;
      }
      dst.set(signatureBytes.subarray(rOffset + Math.max(-rPadding, 0), rOffset + rLength), offset);
      offset = paramBytes;
      for (const o = offset; offset < o + sPadding; ++offset) {
        dst[offset] = 0;
      }
      dst.set(signatureBytes.subarray(sOffset + Math.max(-sPadding, 0), sOffset + sLength), offset);
      return (0, base64Url_1.escape)((0, base64_js_1.fromByteArray)(dst));
    }
    exports.derToJose = derToJose;
    function countPadding(buf, start, stop) {
      let padding = 0;
      while (start + padding < stop && buf[start + padding] === 0) {
        ++padding;
      }
      const needsSign = buf[start + padding] >= MAX_OCTET;
      if (needsSign) {
        --padding;
      }
      return padding;
    }
    function joseToDer(signature, alg) {
      signature = signatureAsBytes(signature);
      const paramBytes = getParamBytesForAlg(alg);
      const signatureBytes = signature.length;
      if (signatureBytes !== paramBytes * 2) {
        throw new TypeError(`"${alg}" signatures must be "${paramBytes * 2}" bytes, saw "${signatureBytes}"`);
      }
      const rPadding = countPadding(signature, 0, paramBytes);
      const sPadding = countPadding(signature, paramBytes, signature.length);
      const rLength = paramBytes - rPadding;
      const sLength = paramBytes - sPadding;
      const rsBytes = 1 + 1 + rLength + 1 + 1 + sLength;
      const shortLength = rsBytes < MAX_OCTET;
      const dst = new Uint8Array((shortLength ? 2 : 3) + rsBytes);
      let offset = 0;
      dst[offset++] = ENCODED_TAG_SEQ;
      if (shortLength) {
        dst[offset++] = rsBytes;
      } else {
        dst[offset++] = MAX_OCTET | 1;
        dst[offset++] = rsBytes & 255;
      }
      dst[offset++] = ENCODED_TAG_INT;
      dst[offset++] = rLength;
      if (rPadding < 0) {
        dst[offset++] = 0;
        dst.set(signature.subarray(0, paramBytes), offset);
        offset += paramBytes;
      } else {
        dst.set(signature.subarray(rPadding, paramBytes), offset);
        offset += paramBytes - rPadding;
      }
      dst[offset++] = ENCODED_TAG_INT;
      dst[offset++] = sLength;
      if (sPadding < 0) {
        dst[offset++] = 0;
        dst.set(signature.subarray(paramBytes), offset);
      } else {
        dst.set(signature.subarray(paramBytes + sPadding), offset);
      }
      return dst;
    }
    exports.joseToDer = joseToDer;
  }
});

// node_modules/jsontokens/lib/errors.js
var require_errors = __commonJS({
  "node_modules/jsontokens/lib/errors.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InvalidTokenError = exports.MissingParametersError = void 0;
    var MissingParametersError = class extends Error {
      constructor(message) {
        super();
        this.name = "MissingParametersError";
        this.message = message || "";
      }
    };
    exports.MissingParametersError = MissingParametersError;
    var InvalidTokenError = class extends Error {
      constructor(message) {
        super();
        this.name = "InvalidTokenError";
        this.message = message || "";
      }
    };
    exports.InvalidTokenError = InvalidTokenError;
  }
});

// node_modules/jsontokens/lib/cryptoClients/secp256k1.js
var require_secp256k1 = __commonJS({
  "node_modules/jsontokens/lib/cryptoClients/secp256k1.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SECP256K1Client = void 0;
    var hmac_1 = require_hmac();
    var sha256_1 = require_sha256();
    var secp = require_lib();
    var ecdsaSigFormatter_1 = require_ecdsaSigFormatter();
    var errors_1 = require_errors();
    var utils_1 = require_utils();
    secp.utils.hmacSha256Sync = (key, ...msgs) => {
      const h = hmac_1.hmac.create(sha256_1.sha256, key);
      msgs.forEach((msg) => h.update(msg));
      return h.digest();
    };
    var SECP256K1Client = class {
      static derivePublicKey(privateKey, compressed = true) {
        if (privateKey.length === 66) {
          privateKey = privateKey.slice(0, 64);
        }
        if (privateKey.length < 64) {
          privateKey = privateKey.padStart(64, "0");
        }
        return (0, utils_1.bytesToHex)(secp.getPublicKey(privateKey, compressed));
      }
      static signHash(signingInputHash, privateKey, format = "jose") {
        if (!signingInputHash || !privateKey) {
          throw new errors_1.MissingParametersError("a signing input hash and private key are all required");
        }
        const derSignature = secp.signSync(signingInputHash, privateKey.slice(0, 64), {
          der: true,
          canonical: false
        });
        if (format === "der")
          return (0, utils_1.bytesToHex)(derSignature);
        if (format === "jose")
          return (0, ecdsaSigFormatter_1.derToJose)(derSignature, "ES256");
        throw Error("Invalid signature format");
      }
      static loadSignature(joseSignature) {
        return (0, ecdsaSigFormatter_1.joseToDer)(joseSignature, "ES256");
      }
      static verifyHash(signingInputHash, derSignatureBytes, publicKey) {
        if (!signingInputHash || !derSignatureBytes || !publicKey) {
          throw new errors_1.MissingParametersError("a signing input hash, der signature, and public key are all required");
        }
        return secp.verify(derSignatureBytes, signingInputHash, publicKey, { strict: false });
      }
    };
    exports.SECP256K1Client = SECP256K1Client;
    SECP256K1Client.algorithmName = "ES256K";
  }
});

// node_modules/jsontokens/lib/cryptoClients/index.js
var require_cryptoClients = __commonJS({
  "node_modules/jsontokens/lib/cryptoClients/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.cryptoClients = exports.SECP256K1Client = void 0;
    var secp256k1_1 = require_secp256k1();
    Object.defineProperty(exports, "SECP256K1Client", { enumerable: true, get: function() {
      return secp256k1_1.SECP256K1Client;
    } });
    var cryptoClients = {
      ES256K: secp256k1_1.SECP256K1Client
    };
    exports.cryptoClients = cryptoClients;
  }
});

// node_modules/jsontokens/lib/cryptoClients/sha256.js
var require_sha2562 = __commonJS({
  "node_modules/jsontokens/lib/cryptoClients/sha256.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.hashSha256Async = exports.hashSha256 = void 0;
    var sha256_1 = require_sha256();
    function hashSha256(input) {
      return (0, sha256_1.sha256)(input);
    }
    exports.hashSha256 = hashSha256;
    function hashSha256Async(input) {
      return __awaiter(this, void 0, void 0, function* () {
        try {
          const isSubtleCryptoAvailable = typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined";
          if (isSubtleCryptoAvailable) {
            const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
            const hash = yield crypto.subtle.digest("SHA-256", bytes);
            return new Uint8Array(hash);
          } else {
            const nodeCrypto = require_crypto2();
            if (!nodeCrypto.createHash) {
              throw new Error("`crypto` module does not contain `createHash`");
            }
            return Promise.resolve(nodeCrypto.createHash("sha256").update(input).digest());
          }
        } catch (error) {
          console.log(error);
          console.log('Crypto lib not found. Neither the global `crypto.subtle` Web Crypto API, nor the or the Node.js `require("crypto").createHash` module is available. Falling back to JS implementation.');
          return Promise.resolve(hashSha256(input));
        }
      });
    }
    exports.hashSha256Async = hashSha256Async;
  }
});

// node_modules/jsontokens/lib/signer.js
var require_signer = __commonJS({
  "node_modules/jsontokens/lib/signer.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TokenSigner = exports.createUnsecuredToken = void 0;
    var base64url = require_base64Url();
    var cryptoClients_1 = require_cryptoClients();
    var errors_1 = require_errors();
    var sha256_1 = require_sha2562();
    function createSigningInput(payload, header) {
      const tokenParts = [];
      const encodedHeader = base64url.encode(JSON.stringify(header));
      tokenParts.push(encodedHeader);
      const encodedPayload = base64url.encode(JSON.stringify(payload));
      tokenParts.push(encodedPayload);
      const signingInput = tokenParts.join(".");
      return signingInput;
    }
    function createUnsecuredToken2(payload) {
      const header = { typ: "JWT", alg: "none" };
      return createSigningInput(payload, header) + ".";
    }
    exports.createUnsecuredToken = createUnsecuredToken2;
    var TokenSigner = class {
      constructor(signingAlgorithm, rawPrivateKey) {
        if (!(signingAlgorithm && rawPrivateKey)) {
          throw new errors_1.MissingParametersError("a signing algorithm and private key are required");
        }
        if (typeof signingAlgorithm !== "string") {
          throw new Error("signing algorithm parameter must be a string");
        }
        signingAlgorithm = signingAlgorithm.toUpperCase();
        if (!cryptoClients_1.cryptoClients.hasOwnProperty(signingAlgorithm)) {
          throw new Error("invalid signing algorithm");
        }
        this.tokenType = "JWT";
        this.cryptoClient = cryptoClients_1.cryptoClients[signingAlgorithm];
        this.rawPrivateKey = rawPrivateKey;
      }
      header(header = {}) {
        const defaultHeader = { typ: this.tokenType, alg: this.cryptoClient.algorithmName };
        return Object.assign({}, defaultHeader, header);
      }
      sign(payload, expanded = false, customHeader = {}) {
        const header = this.header(customHeader);
        const signingInput = createSigningInput(payload, header);
        const signingInputHash = (0, sha256_1.hashSha256)(signingInput);
        return this.createWithSignedHash(payload, expanded, header, signingInput, signingInputHash);
      }
      signAsync(payload, expanded = false, customHeader = {}) {
        return __awaiter(this, void 0, void 0, function* () {
          const header = this.header(customHeader);
          const signingInput = createSigningInput(payload, header);
          const signingInputHash = yield (0, sha256_1.hashSha256Async)(signingInput);
          return this.createWithSignedHash(payload, expanded, header, signingInput, signingInputHash);
        });
      }
      createWithSignedHash(payload, expanded, header, signingInput, signingInputHash) {
        const signature = this.cryptoClient.signHash(signingInputHash, this.rawPrivateKey);
        if (expanded) {
          const signedToken = {
            header: [base64url.encode(JSON.stringify(header))],
            payload: JSON.stringify(payload),
            signature: [signature]
          };
          return signedToken;
        } else {
          return [signingInput, signature].join(".");
        }
      }
    };
    exports.TokenSigner = TokenSigner;
  }
});

// node_modules/jsontokens/lib/verifier.js
var require_verifier = __commonJS({
  "node_modules/jsontokens/lib/verifier.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TokenVerifier = void 0;
    var base64url = require_base64Url();
    var cryptoClients_1 = require_cryptoClients();
    var errors_1 = require_errors();
    var sha256_1 = require_sha2562();
    var TokenVerifier = class {
      constructor(signingAlgorithm, rawPublicKey) {
        if (!(signingAlgorithm && rawPublicKey)) {
          throw new errors_1.MissingParametersError("a signing algorithm and public key are required");
        }
        if (typeof signingAlgorithm !== "string") {
          throw "signing algorithm parameter must be a string";
        }
        signingAlgorithm = signingAlgorithm.toUpperCase();
        if (!cryptoClients_1.cryptoClients.hasOwnProperty(signingAlgorithm)) {
          throw "invalid signing algorithm";
        }
        this.tokenType = "JWT";
        this.cryptoClient = cryptoClients_1.cryptoClients[signingAlgorithm];
        this.rawPublicKey = rawPublicKey;
      }
      verify(token) {
        if (typeof token === "string") {
          return this.verifyCompact(token, false);
        } else if (typeof token === "object") {
          return this.verifyExpanded(token, false);
        } else {
          return false;
        }
      }
      verifyAsync(token) {
        if (typeof token === "string") {
          return this.verifyCompact(token, true);
        } else if (typeof token === "object") {
          return this.verifyExpanded(token, true);
        } else {
          return Promise.resolve(false);
        }
      }
      verifyCompact(token, async) {
        const tokenParts = token.split(".");
        const signingInput = tokenParts[0] + "." + tokenParts[1];
        const performVerify = (signingInputHash) => {
          const derSignatureBytes = this.cryptoClient.loadSignature(tokenParts[2]);
          return this.cryptoClient.verifyHash(signingInputHash, derSignatureBytes, this.rawPublicKey);
        };
        if (async) {
          return (0, sha256_1.hashSha256Async)(signingInput).then((signingInputHash) => performVerify(signingInputHash));
        } else {
          const signingInputHash = (0, sha256_1.hashSha256)(signingInput);
          return performVerify(signingInputHash);
        }
      }
      verifyExpanded(token, async) {
        const signingInput = [token["header"].join("."), base64url.encode(token["payload"])].join(".");
        let verified = true;
        const performVerify = (signingInputHash) => {
          token["signature"].map((signature) => {
            const derSignatureBytes = this.cryptoClient.loadSignature(signature);
            const signatureVerified = this.cryptoClient.verifyHash(signingInputHash, derSignatureBytes, this.rawPublicKey);
            if (!signatureVerified) {
              verified = false;
            }
          });
          return verified;
        };
        if (async) {
          return (0, sha256_1.hashSha256Async)(signingInput).then((signingInputHash) => performVerify(signingInputHash));
        } else {
          const signingInputHash = (0, sha256_1.hashSha256)(signingInput);
          return performVerify(signingInputHash);
        }
      }
    };
    exports.TokenVerifier = TokenVerifier;
  }
});

// node_modules/jsontokens/lib/decode.js
var require_decode = __commonJS({
  "node_modules/jsontokens/lib/decode.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.decodeToken = void 0;
    var base64url = require_base64Url();
    function decodeToken(token) {
      if (typeof token === "string") {
        const tokenParts = token.split(".");
        const header = JSON.parse(base64url.decode(tokenParts[0]));
        const payload = JSON.parse(base64url.decode(tokenParts[1]));
        const signature = tokenParts[2];
        return {
          header,
          payload,
          signature
        };
      } else if (typeof token === "object") {
        if (typeof token.payload !== "string") {
          throw new Error("Expected token payload to be a base64 or json string");
        }
        let payload = token.payload;
        if (token.payload[0] !== "{") {
          payload = base64url.decode(payload);
        }
        const allHeaders = [];
        token.header.map((headerValue) => {
          const header = JSON.parse(base64url.decode(headerValue));
          allHeaders.push(header);
        });
        return {
          header: allHeaders,
          payload: JSON.parse(payload),
          signature: token.signature
        };
      }
    }
    exports.decodeToken = decodeToken;
  }
});

// node_modules/jsontokens/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/jsontokens/lib/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_signer(), exports);
    __exportStar(require_verifier(), exports);
    __exportStar(require_decode(), exports);
    __exportStar(require_errors(), exports);
    __exportStar(require_cryptoClients(), exports);
  }
});

// node_modules/@scure/base/index.js
var freeze = (fn) => Object.freeze(fn());
function isBytes(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
}
function abytes(b) {
  if (!isBytes(b))
    throw new TypeError("Uint8Array expected");
}
function afn(input) {
  if (typeof input !== "function")
    throw new TypeError("function expected");
  return true;
}
function astr(label, input) {
  if (typeof input !== "string")
    throw new TypeError(`${label}: string expected`);
  return true;
}
function anumber(n, title = "number") {
  if (typeof n !== "number")
    throw new TypeError(`${title}: expected number, got ${typeof n}`);
  if (!Number.isSafeInteger(n))
    throw new RangeError(`${title}: expected safe integer, got ${n}`);
}
function chain(...args) {
  const id = (a) => a;
  const wrap2 = (a, b) => (c) => a(b(c));
  const encode3 = args.map((x) => x.encode).reduceRight(wrap2, id);
  const decode = args.map((x) => x.decode).reduce(wrap2, id);
  return { encode: encode3, decode };
}
function normalize(fn) {
  afn(fn);
  return { encode: (from) => from, decode: (to) => fn(to) };
}
var powers = /* @__PURE__ */ (() => {
  let res = [];
  for (let i = 0; i < 40; i++)
    res.push(2 ** i);
  return res;
})();
var asciiDecoder = /* @__PURE__ */ (() => {
  try {
    const decoder = new TextDecoder();
    return decoder.decode(Uint8Array.of(65, 48, 43, 127)) === "A0+\x7F" ? decoder : void 0;
  } catch (e) {
    return void 0;
  }
})();
var B2S_CHUNK = 8192;
function charcodesToString(codes) {
  const len = codes.length;
  if (asciiDecoder !== void 0 && len >= 12)
    return asciiDecoder.decode(codes);
  if (len <= B2S_CHUNK)
    return String.fromCharCode.apply(null, codes);
  let res = "";
  for (let i = 0; i < len; i += B2S_CHUNK)
    res += String.fromCharCode.apply(null, codes.subarray(i, i + B2S_CHUNK));
  return res;
}
function radix2(bits2) {
  anumber(bits2);
  if (bits2 <= 0 || bits2 > 8)
    throw new RangeError("radix2: bits should be in (0..8]");
  const mask = powers[bits2] - 1;
  return {
    encode: (bytes) => {
      abytes(bytes);
      const len = bytes.length;
      const res = new Uint8Array(Math.ceil(len * 8 / bits2));
      let carry = 0;
      let pos = 0;
      let j = 0;
      for (let i = 0; i < len; ) {
        if (i + 2 < len) {
          carry = carry << 24 | bytes[i] << 16 | bytes[i + 1] << 8 | bytes[i + 2];
          pos += 24;
          i += 3;
        } else {
          carry = (carry << 8 | bytes[i]) & 65535;
          pos += 8;
          i++;
        }
        for (; ; ) {
          pos -= bits2;
          res[j++] = carry >> pos & mask;
          if (pos < bits2)
            break;
        }
      }
      if (pos > 0)
        res[j] = carry << bits2 - pos & mask;
      return res;
    },
    decode: (digits) => {
      const len = digits.length;
      const res = new Uint8Array(Math.floor(len * bits2 / 8));
      let carry = 0;
      let pos = 0;
      let j = 0;
      for (let i = 0; i < len; i++) {
        carry = (carry << bits2 | digits[i]) & 65535;
        pos += bits2;
        for (; pos >= 8; pos -= 8)
          res[j++] = carry >> pos - 8 & 255;
      }
      carry = carry << 8 - pos & 255;
      if (pos >= bits2)
        throw new Error("Excess padding");
      if (carry > 0)
        throw new Error(`Non-zero padding: ${carry}`);
      return res;
    }
  };
}
function alphabet(letters, aliases) {
  const len = letters.length;
  if (len > 128)
    throw new Error("alphabet: max 128 letters");
  const encTable = new Uint8Array(len);
  const decTable = new Int8Array(128).fill(-1);
  for (let i = 0; i < len; i++) {
    const code = letters.charCodeAt(i);
    if (letters.codePointAt(i) !== code || code > 127)
      throw new Error("alphabet: single-char ASCII letters only");
    encTable[i] = code;
    decTable[code] = i;
  }
  if (aliases !== void 0) {
    for (const alias of Object.keys(aliases)) {
      const code = alias.charCodeAt(0);
      const target = decTable[aliases[alias].charCodeAt(0)];
      if (alias.length !== 1 || code > 127 || target === void 0 || target === -1)
        throw new Error(`alphabet: invalid alias ${alias}`);
      decTable[code] = target;
    }
  }
  return {
    encode: (digits) => {
      const codes = new Uint8Array(digits.length);
      for (let i = 0; i < digits.length; i++) {
        const d = digits[i];
        const code = encTable[d];
        if (code === void 0)
          throw new Error(`alphabet.encode: invalid digit ${d}`);
        codes[i] = code;
      }
      return charcodesToString(codes);
    },
    decode: (input) => {
      astr("decode", input);
      const slen = input.length;
      const digits = new Uint8Array(slen);
      for (let i = 0; i < slen; i++) {
        const code = input.charCodeAt(i);
        const digit = code < 128 ? decTable[code] : -1;
        if (digit === -1)
          throw new Error(`Unknown letter "${input[i]}". Allowed: ${letters}`);
        digits[i] = digit;
      }
      return digits;
    }
  };
}
var _isWellFormedShim = (str) => {
  try {
    return encodeURI(str) !== null;
  } catch {
    return false;
  }
};
var _isWellFormed = /* @__PURE__ */ (() => (
  // Pick the native check once so utf8.decode doesn't re-probe String.prototype on every call.
  typeof "".isWellFormed === "function" ? (str) => str.isWellFormed() : _isWellFormedShim
))();
var utf8err = (i) => new TypeError(`invalid utf8 at byte ${i}`);
var utf8Fallback = /* @__PURE__ */ freeze(() => ({
  encode(data) {
    abytes(data);
    let res = "";
    for (let i = 0; i < data.length; ) {
      const a = data[i++];
      if (a < 128) {
        res += String.fromCharCode(a);
        continue;
      }
      if (a < 194 || i >= data.length)
        throw utf8err(i - 1);
      const b = data[i++];
      if ((b & 192) !== 128)
        throw utf8err(i - 1);
      let cp = (a & 31) << 6 | b & 63;
      if (a >= 224) {
        if (i >= data.length)
          throw utf8err(i - 1);
        const c = data[i++];
        if ((c & 192) !== 128 || a === 224 && b < 160 || a === 237 && b >= 160)
          throw utf8err(i - 1);
        cp = (a & 15) << 12 | (b & 63) << 6 | c & 63;
        if (a >= 240) {
          if (i >= data.length)
            throw utf8err(i - 1);
          const d = data[i++];
          if (a > 244 || (d & 192) !== 128 || a === 240 && b < 144 || a === 244 && b >= 144)
            throw utf8err(i - 1);
          cp = (a & 7) << 18 | (b & 63) << 12 | (c & 63) << 6 | d & 63;
        }
      }
      if (cp < 65536)
        res += String.fromCharCode(cp);
      else {
        cp -= 65536;
        res += String.fromCharCode((cp >> 10) + 55296, (cp & 1023) + 56320);
      }
    }
    return res;
  },
  decode(str) {
    astr("utf8", str);
    if (!_isWellFormed(str))
      throw new TypeError("utf8 expected well-formed string");
    const res = new Uint8Array(str.length * 3);
    let pos = 0;
    for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);
      if (c < 128) {
        res[pos++] = c;
        continue;
      }
      if (c >= 55296 && c <= 57343) {
        const d = str.charCodeAt(++i);
        c = 65536 + (c - 55296 << 10) + d - 56320;
      }
      if (c >= 65536) {
        res[pos++] = c >> 18 | 240;
        res[pos++] = c >> 12 & 63 | 128;
      } else if (c >= 2048)
        res[pos++] = c >> 12 | 224;
      else
        res[pos++] = c >> 6 | 192;
      if (c >= 2048)
        res[pos++] = c >> 6 & 63 | 128;
      res[pos++] = c & 63 | 128;
    }
    return res.subarray(0, pos);
  }
}));
var utf8 = /* @__PURE__ */ freeze(() => {
  let _utf8Encoder;
  let _utf8Decoder;
  const utf8Builtin = {
    // ignoreBOM preserves an explicit leading U+FEFF;
    // fatal rejects invalid UTF-8 bytes instead of replacing them.
    encode(data) {
      abytes(data);
      return (_utf8Decoder || (_utf8Decoder = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true }))).decode(data);
    },
    decode(str) {
      astr("utf8", str);
      if (!_isWellFormed(str))
        throw new TypeError("utf8 expected well-formed string");
      return (_utf8Encoder || (_utf8Encoder = new TextEncoder())).encode(str);
    }
  };
  return {
    // Select each direction once at module init, since
    // TextEncoder and TextDecoder can exist independently.
    encode: typeof TextDecoder === "function" ? utf8Builtin.encode : utf8Fallback.encode,
    decode: typeof TextEncoder === "function" ? utf8Builtin.decode : utf8Fallback.decode
  };
});
var hexFallback = /* @__PURE__ */ freeze(() => chain(
  radix2(4),
  // Case-insensitive decode via table aliases instead of a toLowerCase pass.
  alphabet("0123456789abcdef", { A: "a", B: "b", C: "c", D: "d", E: "e", F: "f" }),
  normalize((s) => {
    astr("hex", s);
    if (s.length % 2 !== 0)
      throw new TypeError(`hex.decode: odd-length string (${s.length})`);
    return s;
  })
));
var hasHexBuiltin = /* @__PURE__ */ (() => (
  // Require both directions before enabling the native hex path so encode/decode stay symmetric.
  typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
))();
var hexBuiltin = {
  // Keep local type guards so the native path preserves library-level input errors.
  // Native toHex emits lowercase hex, matching the fallback alphabet and Node's hex strings.
  encode(data) {
    abytes(data);
    return data.toHex();
  },
  // Native fromHex accepts either hex case and rejects odd-length / non-hex syntax.
  decode(s) {
    astr("hex", s);
    return Uint8Array.fromHex(s);
  }
};
var hex = /* @__PURE__ */ freeze(() => hasHexBuiltin ? hexBuiltin : hexFallback);

// node_modules/@noble/hashes/utils.js
function isBytes2(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
}
function anumber2(n, title = "") {
  if (typeof n !== "number") {
    const prefix2 = title && `"${title}" `;
    throw new TypeError(`${prefix2}expected number, got ${typeof n}`);
  }
  if (!Number.isSafeInteger(n) || n < 0) {
    const prefix2 = title && `"${title}" `;
    throw new RangeError(`${prefix2}expected integer >= 0, got ${n}`);
  }
}
function abytes2(value, length2, title = "") {
  const bytes = isBytes2(value);
  const len = value?.length;
  const needsLen = length2 !== void 0;
  if (!bytes || needsLen && len !== length2) {
    const prefix2 = title && `"${title}" `;
    const ofLen = needsLen ? ` of length ${length2}` : "";
    const got = bytes ? `length=${len}` : `type=${typeof value}`;
    const message = prefix2 + "expected Uint8Array" + ofLen + ", got " + got;
    if (!bytes)
      throw new TypeError(message);
    throw new RangeError(message);
  }
  return value;
}
function ahash(h) {
  if (typeof h !== "function" || typeof h.create !== "function")
    throw new TypeError("Hash must wrapped by utils.createHasher");
  anumber2(h.outputLen);
  anumber2(h.blockLen);
  if (h.outputLen < 1)
    throw new Error('"outputLen" must be >= 1');
  if (h.blockLen < 1)
    throw new Error('"blockLen" must be >= 1');
}
function aexists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput(out, instance) {
  abytes2(out, void 0, "digestInto() output");
  const min = instance.outputLen;
  if (out.length < min) {
    throw new RangeError('"digestInto() output" expected to be of length >=' + min);
  }
}
function clean(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function createView(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
function rotr(word, shift) {
  return word << 32 - shift | word >>> shift;
}
function rotl(word, shift) {
  return word << shift | word >>> 32 - shift >>> 0;
}
var hasHexBuiltin2 = /* @__PURE__ */ (() => (
  // @ts-ignore
  typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
))();
var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
function bytesToHex(bytes) {
  abytes2(bytes);
  if (hasHexBuiltin2)
    return bytes.toHex();
  let hex4 = "";
  for (let i = 0; i < bytes.length; i++) {
    hex4 += hexes[bytes[i]];
  }
  return hex4;
}
var asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
function asciiToBase16(ch2) {
  if (ch2 >= asciis._0 && ch2 <= asciis._9)
    return ch2 - asciis._0;
  if (ch2 >= asciis.A && ch2 <= asciis.F)
    return ch2 - (asciis.A - 10);
  if (ch2 >= asciis.a && ch2 <= asciis.f)
    return ch2 - (asciis.a - 10);
  return;
}
function hexToBytes(hex4) {
  if (typeof hex4 !== "string")
    throw new TypeError("hex string expected, got " + typeof hex4);
  if (hasHexBuiltin2) {
    try {
      return Uint8Array.fromHex(hex4);
    } catch (error) {
      if (error instanceof SyntaxError)
        throw new RangeError(error.message);
      throw error;
    }
  }
  const hl = hex4.length;
  const al = hl / 2;
  if (hl % 2)
    throw new RangeError("hex string expected, got unpadded hex of length " + hl);
  const array3 = new Uint8Array(al);
  for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
    const n1 = asciiToBase16(hex4.charCodeAt(hi));
    const n2 = asciiToBase16(hex4.charCodeAt(hi + 1));
    if (n1 === void 0 || n2 === void 0) {
      const char = hex4[hi] + hex4[hi + 1];
      throw new RangeError('hex string expected, got non-hex character "' + char + '" at index ' + hi);
    }
    array3[ai] = n1 * 16 + n2;
  }
  return array3;
}
function concatBytes(...arrays) {
  let sum = 0;
  for (let i = 0; i < arrays.length; i++) {
    const a = arrays[i];
    abytes2(a);
    sum += a.length;
  }
  const res = new Uint8Array(sum);
  for (let i = 0, pad = 0; i < arrays.length; i++) {
    const a = arrays[i];
    res.set(a, pad);
    pad += a.length;
  }
  return res;
}
function createHasher(hashCons, info = {}) {
  const hashC = (msg, opts) => hashCons(opts).update(msg).digest();
  const tmp = hashCons(void 0);
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.canXOF = tmp.canXOF;
  hashC.create = (opts) => hashCons(opts);
  Object.assign(hashC, info);
  return Object.freeze(hashC);
}
function randomBytes(bytesLength = 32) {
  anumber2(bytesLength, "bytesLength");
  const cr = typeof globalThis === "object" ? globalThis.crypto : null;
  if (typeof cr?.getRandomValues !== "function")
    throw new Error("crypto.getRandomValues must be defined");
  if (bytesLength > 65536)
    throw new RangeError(`"bytesLength" expected <= 65536, got ${bytesLength}`);
  return cr.getRandomValues(new Uint8Array(bytesLength));
}
var oidNist = (suffix) => ({
  // Current NIST hashAlgs suffixes used here fit in one DER subidentifier octet.
  // Larger suffix values would need base-128 OID encoding and a different length byte.
  oid: Uint8Array.from([6, 9, 96, 134, 72, 1, 101, 3, 4, 2, suffix])
});

// node_modules/@noble/hashes/_md.js
function Chi(a, b, c) {
  return a & b ^ ~a & c;
}
function Maj(a, b, c) {
  return a & b ^ a & c ^ b & c;
}
var HashMD = class {
  blockLen;
  outputLen;
  canXOF = false;
  padOffset;
  isLE;
  // For partial updates less than block size
  buffer;
  view;
  finished = false;
  length = 0;
  pos = 0;
  destroyed = false;
  constructor(blockLen, outputLen, padOffset, isLE) {
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.padOffset = padOffset;
    this.isLE = isLE;
    this.buffer = new Uint8Array(blockLen);
    this.view = createView(this.buffer);
  }
  update(data) {
    aexists(this);
    abytes2(data);
    const { view: view2, buffer, blockLen } = this;
    const len = data.length;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        const dataView = createView(data);
        for (; blockLen <= len - pos; pos += blockLen)
          this.process(dataView, pos);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(view2, 0);
        this.pos = 0;
      }
    }
    this.length += data.length;
    this.roundClean();
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    this.finished = true;
    const { buffer, view: view2, blockLen, isLE } = this;
    let { pos } = this;
    buffer[pos++] = 128;
    clean(this.buffer.subarray(pos));
    if (this.padOffset > blockLen - pos) {
      this.process(view2, 0);
      pos = 0;
    }
    for (let i = pos; i < blockLen; i++)
      buffer[i] = 0;
    view2.setBigUint64(blockLen - 8, BigInt(this.length * 8), isLE);
    this.process(view2, 0);
    const oview = createView(out);
    const len = this.outputLen;
    if (len % 4)
      throw new Error("_sha2: outputLen must be aligned to 32bit");
    const outLen = len / 4;
    const state = this.get();
    if (outLen > state.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let i = 0; i < outLen; i++)
      oview.setUint32(4 * i, state[i], isLE);
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    to ||= new this.constructor();
    to.set(...this.get());
    const { blockLen, buffer, length: length2, finished, destroyed, pos } = this;
    to.destroyed = destroyed;
    to.finished = finished;
    to.length = length2;
    to.pos = pos;
    if (length2 % blockLen)
      to.buffer.set(buffer);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
};
var SHA256_IV = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]);

// node_modules/@noble/hashes/sha2.js
var SHA256_K = /* @__PURE__ */ Uint32Array.from([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
var SHA2_32B = class extends HashMD {
  constructor(outputLen) {
    super(64, outputLen, 8, false);
  }
  get() {
    const { A, B, C, D, E, F, G: G2, H } = this;
    return [A, B, C, D, E, F, G2, H];
  }
  // prettier-ignore
  set(A, B, C, D, E, F, G2, H) {
    this.A = A | 0;
    this.B = B | 0;
    this.C = C | 0;
    this.D = D | 0;
    this.E = E | 0;
    this.F = F | 0;
    this.G = G2 | 0;
    this.H = H | 0;
  }
  process(view2, offset) {
    for (let i = 0; i < 16; i++, offset += 4)
      SHA256_W[i] = view2.getUint32(offset, false);
    for (let i = 16; i < 64; i++) {
      const W15 = SHA256_W[i - 15];
      const W2 = SHA256_W[i - 2];
      const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
      const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
      SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
    }
    let { A, B, C, D, E, F, G: G2, H } = this;
    for (let i = 0; i < 64; i++) {
      const sigma12 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
      const T1 = H + sigma12 + Chi(E, F, G2) + SHA256_K[i] + SHA256_W[i] | 0;
      const sigma02 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
      const T2 = sigma02 + Maj(A, B, C) | 0;
      H = G2;
      G2 = F;
      F = E;
      E = D + T1 | 0;
      D = C;
      C = B;
      B = A;
      A = T1 + T2 | 0;
    }
    A = A + this.A | 0;
    B = B + this.B | 0;
    C = C + this.C | 0;
    D = D + this.D | 0;
    E = E + this.E | 0;
    F = F + this.F | 0;
    G2 = G2 + this.G | 0;
    H = H + this.H | 0;
    this.set(A, B, C, D, E, F, G2, H);
  }
  roundClean() {
    clean(SHA256_W);
  }
  destroy() {
    this.destroyed = true;
    this.set(0, 0, 0, 0, 0, 0, 0, 0);
    clean(this.buffer);
  }
};
var _SHA256 = class extends SHA2_32B {
  // We cannot use array here since array allows indexing by variable
  // which means optimizer/compiler cannot use registers.
  A = SHA256_IV[0] | 0;
  B = SHA256_IV[1] | 0;
  C = SHA256_IV[2] | 0;
  D = SHA256_IV[3] | 0;
  E = SHA256_IV[4] | 0;
  F = SHA256_IV[5] | 0;
  G = SHA256_IV[6] | 0;
  H = SHA256_IV[7] | 0;
  constructor() {
    super(32);
  }
};
var sha256 = /* @__PURE__ */ createHasher(
  () => new _SHA256(),
  /* @__PURE__ */ oidNist(1)
);

// node_modules/@noble/curves/utils.js
var abytes3 = (value, length2, title) => abytes2(value, length2, title);
var anumber3 = anumber2;
var bytesToHex2 = bytesToHex;
var concatBytes2 = (...arrays) => concatBytes(...arrays);
var hexToBytes2 = (hex4) => hexToBytes(hex4);
var isBytes3 = isBytes2;
var randomBytes2 = (bytesLength) => randomBytes(bytesLength);
var _0n = /* @__PURE__ */ BigInt(0);
var _1n = /* @__PURE__ */ BigInt(1);
function abool(value, title = "") {
  if (typeof value !== "boolean") {
    const prefix2 = title && `"${title}" `;
    throw new TypeError(prefix2 + "expected boolean, got type=" + typeof value);
  }
  return value;
}
function abignumber(n) {
  if (typeof n === "bigint") {
    if (!isPosBig(n))
      throw new RangeError("positive bigint expected, got " + n);
  } else
    anumber3(n);
  return n;
}
function asafenumber(value, title = "") {
  if (typeof value !== "number") {
    const prefix2 = title && `"${title}" `;
    throw new TypeError(prefix2 + "expected number, got type=" + typeof value);
  }
  if (!Number.isSafeInteger(value)) {
    const prefix2 = title && `"${title}" `;
    throw new RangeError(prefix2 + "expected safe integer, got " + value);
  }
}
function numberToHexUnpadded(num2) {
  const hex4 = abignumber(num2).toString(16);
  return hex4.length & 1 ? "0" + hex4 : hex4;
}
function hexToNumber(hex4) {
  if (typeof hex4 !== "string")
    throw new TypeError("hex string expected, got " + typeof hex4);
  return hex4 === "" ? _0n : BigInt("0x" + hex4);
}
function bytesToNumberBE(bytes) {
  return hexToNumber(bytesToHex(bytes));
}
function bytesToNumberLE(bytes) {
  return hexToNumber(bytesToHex(copyBytes(abytes2(bytes)).reverse()));
}
function numberToBytesBE(n, len) {
  anumber2(len);
  if (len === 0)
    throw new RangeError("zero length");
  n = abignumber(n);
  const hex4 = n.toString(16);
  if (hex4.length > len * 2)
    throw new RangeError("number too large");
  return hexToBytes(hex4.padStart(len * 2, "0"));
}
function numberToBytesLE(n, len) {
  return numberToBytesBE(n, len).reverse();
}
function copyBytes(bytes) {
  return Uint8Array.from(abytes3(bytes));
}
function asciiToBytes(ascii) {
  if (typeof ascii !== "string")
    throw new TypeError("ascii string expected, got " + typeof ascii);
  return Uint8Array.from(ascii, (c, i) => {
    const charCode = c.charCodeAt(0);
    if (c.length !== 1 || charCode > 127) {
      throw new RangeError(`string contains non-ASCII character "${ascii[i]}" with code ${charCode} at position ${i}`);
    }
    return charCode;
  });
}
var isPosBig = (n) => typeof n === "bigint" && _0n <= n;
function inRange(n, min, max) {
  return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
}
function aInRange(title, n, min, max) {
  if (!inRange(n, min, max))
    throw new RangeError("expected valid " + title + ": " + min + " <= n < " + max + ", got " + n);
}
function bitLen(n) {
  if (n < _0n)
    throw new Error("expected non-negative bigint, got " + n);
  let len;
  for (len = 0; n > _0n; n >>= _1n, len += 1)
    ;
  return len;
}
var bitMask = (n) => (_1n << BigInt(n)) - _1n;
function createHmacDrbg(hashLen, qByteLen, hmacFn) {
  anumber2(hashLen, "hashLen");
  anumber2(qByteLen, "qByteLen");
  if (typeof hmacFn !== "function")
    throw new TypeError("hmacFn must be a function");
  const u8n = (len) => new Uint8Array(len);
  const NULL2 = Uint8Array.of();
  const byte0 = Uint8Array.of(0);
  const byte1 = Uint8Array.of(1);
  const _maxDrbgIters = 1e3;
  let v = u8n(hashLen);
  let k = u8n(hashLen);
  let i = 0;
  const reset = () => {
    v.fill(1);
    k.fill(0);
    i = 0;
  };
  const h = (...msgs) => hmacFn(k, concatBytes2(v, ...msgs));
  const reseed = (seed = NULL2) => {
    k = h(byte0, seed);
    v = h();
    if (seed.length === 0)
      return;
    k = h(byte1, seed);
    v = h();
  };
  const gen = () => {
    if (i++ >= _maxDrbgIters)
      throw new Error("drbg: tried max amount of iterations");
    let len = 0;
    const out = [];
    while (len < qByteLen) {
      v = h();
      const sl = v.slice();
      out.push(sl);
      len += v.length;
    }
    return concatBytes2(...out);
  };
  const genUntil = (seed, pred) => {
    reset();
    reseed(seed);
    let res = void 0;
    while ((res = pred(gen())) === void 0)
      reseed();
    reset();
    return res;
  };
  return genUntil;
}
function validateObject(object2, fields = {}, optFields = {}) {
  if (Object.prototype.toString.call(object2) !== "[object Object]")
    throw new TypeError("expected valid options object");
  function checkField(fieldName, expectedType, isOpt) {
    if (!isOpt && expectedType !== "function" && !Object.hasOwn(object2, fieldName))
      throw new TypeError(`param "${fieldName}" is invalid: expected own property`);
    const val = object2[fieldName];
    if (isOpt && val === void 0)
      return;
    const current = typeof val;
    if (current !== expectedType || val === null)
      throw new TypeError(`param "${fieldName}" is invalid: expected ${expectedType}, got ${current}`);
  }
  const iter = (f, isOpt) => Object.entries(f).forEach(([k, v]) => checkField(k, v, isOpt));
  iter(fields, false);
  iter(optFields, true);
}

// node_modules/@noble/curves/abstract/modular.js
var _0n2 = /* @__PURE__ */ BigInt(0);
var _1n2 = /* @__PURE__ */ BigInt(1);
var _2n = /* @__PURE__ */ BigInt(2);
var _3n = /* @__PURE__ */ BigInt(3);
var _4n = /* @__PURE__ */ BigInt(4);
var _5n = /* @__PURE__ */ BigInt(5);
var _7n = /* @__PURE__ */ BigInt(7);
var _8n = /* @__PURE__ */ BigInt(8);
var _9n = /* @__PURE__ */ BigInt(9);
var _16n = /* @__PURE__ */ BigInt(16);
function mod(a, b) {
  if (b <= _0n2)
    throw new Error("mod: expected positive modulus, got " + b);
  const result = a % b;
  return result >= _0n2 ? result : b + result;
}
function pow2(x, power, modulo) {
  if (power < _0n2)
    throw new Error("pow2: expected non-negative exponent, got " + power);
  let res = x;
  while (power-- > _0n2) {
    res *= res;
    res %= modulo;
  }
  return res;
}
function invert(number2, modulo) {
  if (number2 === _0n2)
    throw new Error("invert: expected non-zero number");
  if (modulo <= _0n2)
    throw new Error("invert: expected positive modulus, got " + modulo);
  let a = mod(number2, modulo);
  let b = modulo;
  let x = _0n2, y = _1n2, u = _1n2, v = _0n2;
  while (a !== _0n2) {
    const q = b / a;
    const r = b - a * q;
    const m = x - u * q;
    const n = y - v * q;
    b = a, a = r, x = u, y = v, u = m, v = n;
  }
  const gcd3 = b;
  if (gcd3 !== _1n2)
    throw new Error("invert: does not exist");
  return mod(x, modulo);
}
function assertIsSquare(Fp, root, n) {
  const F = Fp;
  if (!F.eql(F.sqr(root), n))
    throw new Error("Cannot find square root");
}
function sqrt3mod4(Fp, n) {
  const F = Fp;
  const p1div4 = (F.ORDER + _1n2) / _4n;
  const root = F.pow(n, p1div4);
  assertIsSquare(F, root, n);
  return root;
}
function sqrt5mod8(Fp, n) {
  const F = Fp;
  const p5div8 = (F.ORDER - _5n) / _8n;
  const n2 = F.mul(n, _2n);
  const v = F.pow(n2, p5div8);
  const nv = F.mul(n, v);
  const i = F.mul(F.mul(nv, _2n), v);
  const root = F.mul(nv, F.sub(i, F.ONE));
  assertIsSquare(F, root, n);
  return root;
}
function sqrt9mod16(P) {
  const Fp_ = Field(P);
  const tn = tonelliShanks(P);
  const c1 = tn(Fp_, Fp_.neg(Fp_.ONE));
  const c2 = tn(Fp_, c1);
  const c3 = tn(Fp_, Fp_.neg(c1));
  const c4 = (P + _7n) / _16n;
  return ((Fp, n) => {
    const F = Fp;
    let tv1 = F.pow(n, c4);
    let tv2 = F.mul(tv1, c1);
    const tv3 = F.mul(tv1, c2);
    const tv4 = F.mul(tv1, c3);
    const e1 = F.eql(F.sqr(tv2), n);
    const e2 = F.eql(F.sqr(tv3), n);
    tv1 = F.cmov(tv1, tv2, e1);
    tv2 = F.cmov(tv4, tv3, e2);
    const e3 = F.eql(F.sqr(tv2), n);
    const root = F.cmov(tv1, tv2, e3);
    assertIsSquare(F, root, n);
    return root;
  });
}
function tonelliShanks(P) {
  if (P < _3n)
    throw new Error("sqrt is not defined for small field");
  let Q = P - _1n2;
  let S = 0;
  while (Q % _2n === _0n2) {
    Q /= _2n;
    S++;
  }
  let Z = _2n;
  const _Fp = Field(P);
  while (FpLegendre(_Fp, Z) === 1) {
    if (Z++ > 1e3)
      throw new Error("Cannot find square root: probably non-prime P");
  }
  if (S === 1)
    return sqrt3mod4;
  let cc = _Fp.pow(Z, Q);
  const Q1div2 = (Q + _1n2) / _2n;
  return function tonelliSlow(Fp, n) {
    const F = Fp;
    if (F.is0(n))
      return n;
    if (FpLegendre(F, n) !== 1)
      throw new Error("Cannot find square root");
    let M = S;
    let c = F.mul(F.ONE, cc);
    let t = F.pow(n, Q);
    let R = F.pow(n, Q1div2);
    while (!F.eql(t, F.ONE)) {
      if (F.is0(t))
        return F.ZERO;
      let i = 1;
      let t_tmp = F.sqr(t);
      while (!F.eql(t_tmp, F.ONE)) {
        i++;
        t_tmp = F.sqr(t_tmp);
        if (i === M)
          throw new Error("Cannot find square root");
      }
      const exponent = _1n2 << BigInt(M - i - 1);
      const b = F.pow(c, exponent);
      M = i;
      c = F.sqr(b);
      t = F.mul(t, c);
      R = F.mul(R, b);
    }
    return R;
  };
}
function FpSqrt(P) {
  if (P % _4n === _3n)
    return sqrt3mod4;
  if (P % _8n === _5n)
    return sqrt5mod8;
  if (P % _16n === _9n)
    return sqrt9mod16(P);
  return tonelliShanks(P);
}
var FIELD_FIELDS = [
  "create",
  "isValid",
  "is0",
  "neg",
  "inv",
  "sqrt",
  "sqr",
  "eql",
  "add",
  "sub",
  "mul",
  "pow",
  "div",
  "addN",
  "subN",
  "mulN",
  "sqrN"
];
function validateField(field) {
  const initial = {
    ORDER: "bigint",
    BYTES: "number",
    BITS: "number"
  };
  const opts = FIELD_FIELDS.reduce((map2, val) => {
    map2[val] = "function";
    return map2;
  }, initial);
  validateObject(field, opts);
  asafenumber(field.BYTES, "BYTES");
  asafenumber(field.BITS, "BITS");
  if (field.BYTES < 1 || field.BITS < 1)
    throw new Error("invalid field: expected BYTES/BITS > 0");
  if (field.ORDER <= _1n2)
    throw new Error("invalid field: expected ORDER > 1, got " + field.ORDER);
  return field;
}
function FpPow(Fp, num2, power) {
  const F = Fp;
  if (power < _0n2)
    throw new Error("invalid exponent, negatives unsupported");
  if (power === _0n2)
    return F.ONE;
  if (power === _1n2)
    return num2;
  let p = F.ONE;
  let d = num2;
  while (power > _0n2) {
    if (power & _1n2)
      p = F.mul(p, d);
    d = F.sqr(d);
    power >>= _1n2;
  }
  return p;
}
function FpInvertBatch(Fp, nums, passZero = false) {
  const F = Fp;
  const inverted = new Array(nums.length).fill(passZero ? F.ZERO : void 0);
  const multipliedAcc = nums.reduce((acc, num2, i) => {
    if (F.is0(num2))
      return acc;
    inverted[i] = acc;
    return F.mul(acc, num2);
  }, F.ONE);
  const invertedAcc = F.inv(multipliedAcc);
  nums.reduceRight((acc, num2, i) => {
    if (F.is0(num2))
      return acc;
    inverted[i] = F.mul(acc, inverted[i]);
    return F.mul(acc, num2);
  }, invertedAcc);
  return inverted;
}
function FpLegendre(Fp, n) {
  const F = Fp;
  const p1mod2 = (F.ORDER - _1n2) / _2n;
  const powered = F.pow(n, p1mod2);
  const yes = F.eql(powered, F.ONE);
  const zero = F.eql(powered, F.ZERO);
  const no = F.eql(powered, F.neg(F.ONE));
  if (!yes && !zero && !no)
    throw new Error("invalid Legendre symbol result");
  return yes ? 1 : zero ? 0 : -1;
}
function nLength(n, nBitLength) {
  if (nBitLength !== void 0)
    anumber3(nBitLength);
  if (n <= _0n2)
    throw new Error("invalid n length: expected positive n, got " + n);
  if (nBitLength !== void 0 && nBitLength < 1)
    throw new Error("invalid n length: expected positive bit length, got " + nBitLength);
  const bits2 = bitLen(n);
  if (nBitLength !== void 0 && nBitLength < bits2)
    throw new Error(`invalid n length: expected bit length (${bits2}) >= n.length (${nBitLength})`);
  const _nBitLength = nBitLength !== void 0 ? nBitLength : bits2;
  const nByteLength = Math.ceil(_nBitLength / 8);
  return { nBitLength: _nBitLength, nByteLength };
}
var FIELD_SQRT = /* @__PURE__ */ new WeakMap();
var _Field = class {
  ORDER;
  BITS;
  BYTES;
  isLE;
  ZERO = _0n2;
  ONE = _1n2;
  _lengths;
  _mod;
  constructor(ORDER, opts = {}) {
    if (ORDER <= _1n2)
      throw new Error("invalid field: expected ORDER > 1, got " + ORDER);
    let _nbitLength = void 0;
    this.isLE = false;
    if (opts != null && typeof opts === "object") {
      if (typeof opts.BITS === "number")
        _nbitLength = opts.BITS;
      if (typeof opts.sqrt === "function")
        Object.defineProperty(this, "sqrt", { value: opts.sqrt, enumerable: true });
      if (typeof opts.isLE === "boolean")
        this.isLE = opts.isLE;
      if (opts.allowedLengths)
        this._lengths = Object.freeze(opts.allowedLengths.slice());
      if (typeof opts.modFromBytes === "boolean")
        this._mod = opts.modFromBytes;
    }
    const { nBitLength, nByteLength } = nLength(ORDER, _nbitLength);
    if (nByteLength > 2048)
      throw new Error("invalid field: expected ORDER of <= 2048 bytes");
    this.ORDER = ORDER;
    this.BITS = nBitLength;
    this.BYTES = nByteLength;
    Object.freeze(this);
  }
  create(num2) {
    return mod(num2, this.ORDER);
  }
  isValid(num2) {
    if (typeof num2 !== "bigint")
      throw new TypeError("invalid field element: expected bigint, got " + typeof num2);
    return _0n2 <= num2 && num2 < this.ORDER;
  }
  is0(num2) {
    return num2 === _0n2;
  }
  // is valid and invertible
  isValidNot0(num2) {
    return !this.is0(num2) && this.isValid(num2);
  }
  isOdd(num2) {
    return (num2 & _1n2) === _1n2;
  }
  neg(num2) {
    return mod(-num2, this.ORDER);
  }
  eql(lhs, rhs) {
    return lhs === rhs;
  }
  sqr(num2) {
    return mod(num2 * num2, this.ORDER);
  }
  add(lhs, rhs) {
    return mod(lhs + rhs, this.ORDER);
  }
  sub(lhs, rhs) {
    return mod(lhs - rhs, this.ORDER);
  }
  mul(lhs, rhs) {
    return mod(lhs * rhs, this.ORDER);
  }
  pow(num2, power) {
    return FpPow(this, num2, power);
  }
  div(lhs, rhs) {
    return mod(lhs * invert(rhs, this.ORDER), this.ORDER);
  }
  // Same as above, but doesn't normalize
  sqrN(num2) {
    return num2 * num2;
  }
  addN(lhs, rhs) {
    return lhs + rhs;
  }
  subN(lhs, rhs) {
    return lhs - rhs;
  }
  mulN(lhs, rhs) {
    return lhs * rhs;
  }
  inv(num2) {
    return invert(num2, this.ORDER);
  }
  sqrt(num2) {
    let sqrt = FIELD_SQRT.get(this);
    if (!sqrt)
      FIELD_SQRT.set(this, sqrt = FpSqrt(this.ORDER));
    return sqrt(this, num2);
  }
  toBytes(num2) {
    return this.isLE ? numberToBytesLE(num2, this.BYTES) : numberToBytesBE(num2, this.BYTES);
  }
  fromBytes(bytes, skipValidation = false) {
    abytes3(bytes);
    const { _lengths: allowedLengths, BYTES, isLE, ORDER, _mod: modFromBytes } = this;
    if (allowedLengths) {
      if (bytes.length < 1 || !allowedLengths.includes(bytes.length) || bytes.length > BYTES) {
        throw new Error("Field.fromBytes: expected " + allowedLengths + " bytes, got " + bytes.length);
      }
      const padded = new Uint8Array(BYTES);
      padded.set(bytes, isLE ? 0 : padded.length - bytes.length);
      bytes = padded;
    }
    if (bytes.length !== BYTES)
      throw new Error("Field.fromBytes: expected " + BYTES + " bytes, got " + bytes.length);
    let scalar = isLE ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
    if (modFromBytes)
      scalar = mod(scalar, ORDER);
    if (!skipValidation) {
      if (!this.isValid(scalar))
        throw new Error("invalid field element: outside of range 0..ORDER");
    }
    return scalar;
  }
  // TODO: we don't need it here, move out to separate fn
  invertBatch(lst) {
    return FpInvertBatch(this, lst);
  }
  // We can't move this out because Fp6, Fp12 implement it
  // and it's unclear what to return in there.
  cmov(a, b, condition) {
    abool(condition, "condition");
    return condition ? b : a;
  }
};
Object.freeze(_Field.prototype);
function Field(ORDER, opts = {}) {
  return new _Field(ORDER, opts);
}
function getFieldBytesLength(fieldOrder) {
  if (typeof fieldOrder !== "bigint")
    throw new Error("field order must be bigint");
  if (fieldOrder <= _1n2)
    throw new Error("field order must be greater than 1");
  const bitLength = bitLen(fieldOrder - _1n2);
  return Math.ceil(bitLength / 8);
}
function getMinHashLength(fieldOrder) {
  const length2 = getFieldBytesLength(fieldOrder);
  return length2 + Math.ceil(length2 / 2);
}
function mapHashToField(key, fieldOrder, isLE = false) {
  abytes3(key);
  const len = key.length;
  const fieldLen = getFieldBytesLength(fieldOrder);
  const minLen = Math.max(getMinHashLength(fieldOrder), 16);
  if (len < minLen || len > 1024)
    throw new Error("expected " + minLen + "-1024 bytes of input, got " + len);
  const num2 = isLE ? bytesToNumberLE(key) : bytesToNumberBE(key);
  const reduced = mod(num2, fieldOrder - _1n2) + _1n2;
  return isLE ? numberToBytesLE(reduced, fieldLen) : numberToBytesBE(reduced, fieldLen);
}

// node_modules/@noble/curves/abstract/curve.js
var _0n3 = /* @__PURE__ */ BigInt(0);
var _1n3 = /* @__PURE__ */ BigInt(1);
function negateCt(condition, item) {
  const neg = item.negate();
  return condition ? neg : item;
}
function normalizeZ(c, points) {
  const invertedZs = FpInvertBatch(c.Fp, points.map((p) => p.Z));
  return points.map((p, i) => c.fromAffine(p.toAffine(invertedZs[i])));
}
function validateW(W2, bits2) {
  if (!Number.isSafeInteger(W2) || W2 <= 0 || W2 > bits2)
    throw new Error("invalid window size, expected [1.." + bits2 + "], got W=" + W2);
}
function calcWOpts(W2, scalarBits) {
  validateW(W2, scalarBits);
  const windows = Math.ceil(scalarBits / W2) + 1;
  const windowSize = 2 ** (W2 - 1);
  const maxNumber = 2 ** W2;
  const mask = bitMask(W2);
  const shiftBy = BigInt(W2);
  return { windows, windowSize, mask, maxNumber, shiftBy };
}
function calcOffsets(n, window2, wOpts) {
  const { windowSize, mask, maxNumber, shiftBy } = wOpts;
  let wbits = Number(n & mask);
  let nextN = n >> shiftBy;
  if (wbits > windowSize) {
    wbits -= maxNumber;
    nextN += _1n3;
  }
  const offsetStart = window2 * windowSize;
  const offset = offsetStart + Math.abs(wbits) - 1;
  const isZero = wbits === 0;
  const isNeg = wbits < 0;
  const isNegF = window2 % 2 !== 0;
  const offsetF = offsetStart;
  return { nextN, offset, isZero, isNeg, isNegF, offsetF };
}
var pointPrecomputes = /* @__PURE__ */ new WeakMap();
var pointWindowSizes = /* @__PURE__ */ new WeakMap();
function getW(P) {
  return pointWindowSizes.get(P) || 1;
}
function assert0(n) {
  if (n !== _0n3)
    throw new Error("invalid wNAF");
}
var wNAF = class {
  BASE;
  ZERO;
  Fn;
  bits;
  // Parametrized with a given Point class (not individual point)
  constructor(Point2, bits2) {
    this.BASE = Point2.BASE;
    this.ZERO = Point2.ZERO;
    this.Fn = Point2.Fn;
    this.bits = bits2;
  }
  // non-const time multiplication ladder
  _unsafeLadder(elm, n, p = this.ZERO) {
    let d = elm;
    while (n > _0n3) {
      if (n & _1n3)
        p = p.add(d);
      d = d.double();
      n >>= _1n3;
    }
    return p;
  }
  /**
   * Creates a wNAF precomputation window. Used for caching.
   * Default window size is set by `utils.precompute()` and is equal to 8.
   * Number of precomputed points depends on the curve size:
   * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
   * - 𝑊 is the window size
   * - 𝑛 is the bitlength of the curve order.
   * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
   * @param point - Point instance
   * @param W - window size
   * @returns precomputed point tables flattened to a single array
   */
  precomputeWindow(point, W2) {
    const { windows, windowSize } = calcWOpts(W2, this.bits);
    const points = [];
    let p = point;
    let base = p;
    for (let window2 = 0; window2 < windows; window2++) {
      base = p;
      points.push(base);
      for (let i = 1; i < windowSize; i++) {
        base = base.add(p);
        points.push(base);
      }
      p = base.double();
    }
    return points;
  }
  /**
   * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
   * More compact implementation:
   * https://github.com/paulmillr/noble-secp256k1/blob/47cb1669b6e506ad66b35fe7d76132ae97465da2/index.ts#L502-L541
   * @returns real and fake (for const-time) points
   */
  wNAF(W2, precomputes, n) {
    if (!this.Fn.isValid(n))
      throw new Error("invalid scalar");
    let p = this.ZERO;
    let f = this.BASE;
    const wo = calcWOpts(W2, this.bits);
    for (let window2 = 0; window2 < wo.windows; window2++) {
      const { nextN, offset, isZero, isNeg, isNegF, offsetF } = calcOffsets(n, window2, wo);
      n = nextN;
      if (isZero) {
        f = f.add(negateCt(isNegF, precomputes[offsetF]));
      } else {
        p = p.add(negateCt(isNeg, precomputes[offset]));
      }
    }
    assert0(n);
    return { p, f };
  }
  /**
   * Implements unsafe EC multiplication using precomputed tables
   * and w-ary non-adjacent form.
   * @param acc - accumulator point to add result of multiplication
   * @returns point
   */
  wNAFUnsafe(W2, precomputes, n, acc = this.ZERO) {
    const wo = calcWOpts(W2, this.bits);
    for (let window2 = 0; window2 < wo.windows; window2++) {
      if (n === _0n3)
        break;
      const { nextN, offset, isZero, isNeg } = calcOffsets(n, window2, wo);
      n = nextN;
      if (isZero) {
        continue;
      } else {
        const item = precomputes[offset];
        acc = acc.add(isNeg ? item.negate() : item);
      }
    }
    assert0(n);
    return acc;
  }
  getPrecomputes(W2, point, transform2) {
    let comp = pointPrecomputes.get(point);
    if (!comp) {
      comp = this.precomputeWindow(point, W2);
      if (W2 !== 1) {
        if (typeof transform2 === "function")
          comp = transform2(comp);
        pointPrecomputes.set(point, comp);
      }
    }
    return comp;
  }
  cached(point, scalar, transform2) {
    const W2 = getW(point);
    return this.wNAF(W2, this.getPrecomputes(W2, point, transform2), scalar);
  }
  unsafe(point, scalar, transform2, prev) {
    const W2 = getW(point);
    if (W2 === 1)
      return this._unsafeLadder(point, scalar, prev);
    return this.wNAFUnsafe(W2, this.getPrecomputes(W2, point, transform2), scalar, prev);
  }
  // We calculate precomputes for elliptic curve point multiplication
  // using windowed method. This specifies window size and
  // stores precomputed values. Usually only base point would be precomputed.
  createCache(P, W2) {
    validateW(W2, this.bits);
    pointWindowSizes.set(P, W2);
    pointPrecomputes.delete(P);
  }
  hasCache(elm) {
    return getW(elm) !== 1;
  }
};
function mulEndoUnsafe(Point2, point, k1, k2) {
  let acc = point;
  let p1 = Point2.ZERO;
  let p2 = Point2.ZERO;
  while (k1 > _0n3 || k2 > _0n3) {
    if (k1 & _1n3)
      p1 = p1.add(acc);
    if (k2 & _1n3)
      p2 = p2.add(acc);
    acc = acc.double();
    k1 >>= _1n3;
    k2 >>= _1n3;
  }
  return { p1, p2 };
}
function createField(order, field, isLE) {
  if (field) {
    if (field.ORDER !== order)
      throw new Error("Field.ORDER must match order: Fp == p, Fn == n");
    validateField(field);
    return field;
  } else {
    return Field(order, { isLE });
  }
}
function createCurveFields(type, CURVE, curveOpts = {}, FpFnLE) {
  if (FpFnLE === void 0)
    FpFnLE = type === "edwards";
  if (!CURVE || typeof CURVE !== "object")
    throw new Error(`expected valid ${type} CURVE object`);
  for (const p of ["p", "n", "h"]) {
    const val = CURVE[p];
    if (!(typeof val === "bigint" && val > _0n3))
      throw new Error(`CURVE.${p} must be positive bigint`);
  }
  const Fp = createField(CURVE.p, curveOpts.Fp, FpFnLE);
  const Fn2 = createField(CURVE.n, curveOpts.Fn, FpFnLE);
  const _b = type === "weierstrass" ? "b" : "d";
  const params = ["Gx", "Gy", "a", _b];
  for (const p of params) {
    if (!Fp.isValid(CURVE[p]))
      throw new Error(`CURVE.${p} must be valid field element of CURVE.Fp`);
  }
  CURVE = Object.freeze(Object.assign({}, CURVE));
  return { CURVE, Fp, Fn: Fn2 };
}
function createKeygen(randomSecretKey, getPublicKey) {
  return function keygen(seed) {
    const secretKey = randomSecretKey(seed);
    return { secretKey, publicKey: getPublicKey(secretKey) };
  };
}

// node_modules/@noble/hashes/hmac.js
var _HMAC = class {
  oHash;
  iHash;
  blockLen;
  outputLen;
  canXOF = false;
  finished = false;
  destroyed = false;
  constructor(hash, key) {
    ahash(hash);
    abytes2(key, void 0, "key");
    this.iHash = hash.create();
    if (typeof this.iHash.update !== "function")
      throw new Error("Expected instance of class which extends utils.Hash");
    this.blockLen = this.iHash.blockLen;
    this.outputLen = this.iHash.outputLen;
    const blockLen = this.blockLen;
    const pad = new Uint8Array(blockLen);
    pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);
    for (let i = 0; i < pad.length; i++)
      pad[i] ^= 54;
    this.iHash.update(pad);
    this.oHash = hash.create();
    for (let i = 0; i < pad.length; i++)
      pad[i] ^= 54 ^ 92;
    this.oHash.update(pad);
    clean(pad);
  }
  update(buf) {
    aexists(this);
    this.iHash.update(buf);
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    this.finished = true;
    const buf = out.subarray(0, this.outputLen);
    this.iHash.digestInto(buf);
    this.oHash.update(buf);
    this.oHash.digestInto(buf);
    this.destroy();
  }
  digest() {
    const out = new Uint8Array(this.oHash.outputLen);
    this.digestInto(out);
    return out;
  }
  _cloneInto(to) {
    to ||= Object.create(Object.getPrototypeOf(this), {});
    const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
    to = to;
    to.finished = finished;
    to.destroyed = destroyed;
    to.blockLen = blockLen;
    to.outputLen = outputLen;
    to.oHash = oHash._cloneInto(to.oHash);
    to.iHash = iHash._cloneInto(to.iHash);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
  destroy() {
    this.destroyed = true;
    this.oHash.destroy();
    this.iHash.destroy();
  }
};
var hmac = /* @__PURE__ */ (() => {
  const hmac_ = ((hash, key, message) => new _HMAC(hash, key).update(message).digest());
  hmac_.create = (hash, key) => new _HMAC(hash, key);
  return hmac_;
})();

// node_modules/@noble/curves/abstract/weierstrass.js
var divNearest = (num2, den) => (num2 + (num2 >= 0 ? den : -den) / _2n2) / den;
function _splitEndoScalar(k, basis, n) {
  aInRange("scalar", k, _0n4, n);
  const [[a1, b1], [a2, b2]] = basis;
  const c1 = divNearest(b2 * k, n);
  const c2 = divNearest(-b1 * k, n);
  let k1 = k - c1 * a1 - c2 * a2;
  let k2 = -c1 * b1 - c2 * b2;
  const k1neg = k1 < _0n4;
  const k2neg = k2 < _0n4;
  if (k1neg)
    k1 = -k1;
  if (k2neg)
    k2 = -k2;
  const MAX_NUM = bitMask(Math.ceil(bitLen(n) / 2)) + _1n4;
  if (k1 < _0n4 || k1 >= MAX_NUM || k2 < _0n4 || k2 >= MAX_NUM) {
    throw new Error("splitScalar (endomorphism): failed for k");
  }
  return { k1neg, k1, k2neg, k2 };
}
function validateSigFormat(format) {
  if (!["compact", "recovered", "der"].includes(format))
    throw new Error('Signature format must be "compact", "recovered", or "der"');
  return format;
}
function validateSigOpts(opts, def2) {
  validateObject(opts);
  const optsn = {};
  for (let optName of Object.keys(def2)) {
    optsn[optName] = opts[optName] === void 0 ? def2[optName] : opts[optName];
  }
  abool(optsn.lowS, "lowS");
  abool(optsn.prehash, "prehash");
  if (optsn.format !== void 0)
    validateSigFormat(optsn.format);
  return optsn;
}
var DERErr = class extends Error {
  constructor(m = "") {
    super(m);
  }
};
var DER = {
  // asn.1 DER encoding utils
  Err: DERErr,
  // Basic building block is TLV (Tag-Length-Value)
  _tlv: {
    encode: (tag2, data) => {
      const { Err: E } = DER;
      asafenumber(tag2, "tag");
      if (tag2 < 0 || tag2 > 255)
        throw new E("tlv.encode: wrong tag");
      if (typeof data !== "string")
        throw new TypeError('"data" expected string, got type=' + typeof data);
      if (data.length & 1)
        throw new E("tlv.encode: unpadded data");
      const dataLen = data.length / 2;
      const len = numberToHexUnpadded(dataLen);
      if (len.length / 2 & 128)
        throw new E("tlv.encode: long form length too big");
      const lenLen = dataLen > 127 ? numberToHexUnpadded(len.length / 2 | 128) : "";
      const t = numberToHexUnpadded(tag2);
      return t + lenLen + len + data;
    },
    // v - value, l - left bytes (unparsed)
    decode(tag2, data) {
      const { Err: E } = DER;
      data = abytes3(data, void 0, "DER data");
      let pos = 0;
      if (tag2 < 0 || tag2 > 255)
        throw new E("tlv.encode: wrong tag");
      if (data.length < 2 || data[pos++] !== tag2)
        throw new E("tlv.decode: wrong tlv");
      const first = data[pos++];
      const isLong = !!(first & 128);
      let length2 = 0;
      if (!isLong)
        length2 = first;
      else {
        const lenLen = first & 127;
        if (!lenLen)
          throw new E("tlv.decode(long): indefinite length not supported");
        if (lenLen > 4)
          throw new E("tlv.decode(long): byte length is too big");
        const lengthBytes = data.subarray(pos, pos + lenLen);
        if (lengthBytes.length !== lenLen)
          throw new E("tlv.decode: length bytes not complete");
        if (lengthBytes[0] === 0)
          throw new E("tlv.decode(long): zero leftmost byte");
        for (const b of lengthBytes)
          length2 = length2 << 8 | b;
        pos += lenLen;
        if (length2 < 128)
          throw new E("tlv.decode(long): not minimal encoding");
      }
      const v = data.subarray(pos, pos + length2);
      if (v.length !== length2)
        throw new E("tlv.decode: wrong value length");
      return { v, l: data.subarray(pos + length2) };
    }
  },
  // https://crypto.stackexchange.com/a/57734 Leftmost bit of first byte is 'negative' flag,
  // since we always use positive integers here. It must always be empty:
  // - add zero byte if exists
  // - if next byte doesn't have a flag, leading zero is not allowed (minimal encoding)
  _int: {
    encode(num2) {
      const { Err: E } = DER;
      abignumber(num2);
      if (num2 < _0n4)
        throw new E("integer: negative integers are not allowed");
      let hex4 = numberToHexUnpadded(num2);
      if (Number.parseInt(hex4[0], 16) & 8)
        hex4 = "00" + hex4;
      if (hex4.length & 1)
        throw new E("unexpected DER parsing assertion: unpadded hex");
      return hex4;
    },
    decode(data) {
      const { Err: E } = DER;
      if (data.length < 1)
        throw new E("invalid signature integer: empty");
      if (data[0] & 128)
        throw new E("invalid signature integer: negative");
      if (data.length > 1 && data[0] === 0 && !(data[1] & 128))
        throw new E("invalid signature integer: unnecessary leading zero");
      return bytesToNumberBE(data);
    }
  },
  toSig(bytes) {
    const { Err: E, _int: int, _tlv: tlv } = DER;
    const data = abytes3(bytes, void 0, "signature");
    const { v: seqBytes, l: seqLeftBytes } = tlv.decode(48, data);
    if (seqLeftBytes.length)
      throw new E("invalid signature: left bytes after parsing");
    const { v: rBytes, l: rLeftBytes } = tlv.decode(2, seqBytes);
    const { v: sBytes, l: sLeftBytes } = tlv.decode(2, rLeftBytes);
    if (sLeftBytes.length)
      throw new E("invalid signature: left bytes after parsing");
    return { r: int.decode(rBytes), s: int.decode(sBytes) };
  },
  hexFromSig(sig) {
    const { _tlv: tlv, _int: int } = DER;
    const rs = tlv.encode(2, int.encode(sig.r));
    const ss = tlv.encode(2, int.encode(sig.s));
    const seq = rs + ss;
    return tlv.encode(48, seq);
  }
};
Object.freeze(DER._tlv);
Object.freeze(DER._int);
Object.freeze(DER);
var _0n4 = /* @__PURE__ */ BigInt(0);
var _1n4 = /* @__PURE__ */ BigInt(1);
var _2n2 = /* @__PURE__ */ BigInt(2);
var _3n2 = /* @__PURE__ */ BigInt(3);
var _4n2 = /* @__PURE__ */ BigInt(4);
function weierstrass(params, extraOpts = {}) {
  const validated = createCurveFields("weierstrass", params, extraOpts);
  const Fp = validated.Fp;
  const Fn2 = validated.Fn;
  let CURVE = validated.CURVE;
  const { h: cofactor, n: CURVE_ORDER2 } = CURVE;
  validateObject(extraOpts, {}, {
    allowInfinityPoint: "boolean",
    clearCofactor: "function",
    isTorsionFree: "function",
    fromBytes: "function",
    toBytes: "function",
    endo: "object"
  });
  const { endo, allowInfinityPoint } = extraOpts;
  if (endo) {
    if (!Fp.is0(CURVE.a) || typeof endo.beta !== "bigint" || !Array.isArray(endo.basises)) {
      throw new Error('invalid endo: expected "beta": bigint and "basises": array');
    }
  }
  const lengths = getWLengths(Fp, Fn2);
  function assertCompressionIsSupported() {
    if (!Fp.isOdd)
      throw new Error("compression is not supported: Field does not have .isOdd()");
  }
  function pointToBytes2(_c, point, isCompressed) {
    if (allowInfinityPoint && point.is0())
      return Uint8Array.of(0);
    const { x, y } = point.toAffine();
    const bx = Fp.toBytes(x);
    abool(isCompressed, "isCompressed");
    if (isCompressed) {
      assertCompressionIsSupported();
      const hasEvenY = !Fp.isOdd(y);
      return concatBytes2(pprefix(hasEvenY), bx);
    } else {
      return concatBytes2(Uint8Array.of(4), bx, Fp.toBytes(y));
    }
  }
  function pointFromBytes(bytes) {
    abytes3(bytes, void 0, "Point");
    const { publicKey: comp, publicKeyUncompressed: uncomp } = lengths;
    const length2 = bytes.length;
    const head = bytes[0];
    const tail = bytes.subarray(1);
    if (allowInfinityPoint && length2 === 1 && head === 0)
      return { x: Fp.ZERO, y: Fp.ZERO };
    if (length2 === comp && (head === 2 || head === 3)) {
      const x = Fp.fromBytes(tail);
      if (!Fp.isValid(x))
        throw new Error("bad point: is not on curve, wrong x");
      const y2 = weierstrassEquation(x);
      let y;
      try {
        y = Fp.sqrt(y2);
      } catch (sqrtError) {
        const err = sqrtError instanceof Error ? ": " + sqrtError.message : "";
        throw new Error("bad point: is not on curve, sqrt error" + err);
      }
      assertCompressionIsSupported();
      const evenY = Fp.isOdd(y);
      const evenH = (head & 1) === 1;
      if (evenH !== evenY)
        y = Fp.neg(y);
      return { x, y };
    } else if (length2 === uncomp && head === 4) {
      const L = Fp.BYTES;
      const x = Fp.fromBytes(tail.subarray(0, L));
      const y = Fp.fromBytes(tail.subarray(L, L * 2));
      if (!isValidXY(x, y))
        throw new Error("bad point: is not on curve");
      return { x, y };
    } else {
      throw new Error(`bad point: got length ${length2}, expected compressed=${comp} or uncompressed=${uncomp}`);
    }
  }
  const encodePoint = extraOpts.toBytes === void 0 ? pointToBytes2 : extraOpts.toBytes;
  const decodePoint = extraOpts.fromBytes === void 0 ? pointFromBytes : extraOpts.fromBytes;
  function weierstrassEquation(x) {
    const x2 = Fp.sqr(x);
    const x3 = Fp.mul(x2, x);
    return Fp.add(Fp.add(x3, Fp.mul(x, CURVE.a)), CURVE.b);
  }
  function isValidXY(x, y) {
    const left = Fp.sqr(y);
    const right = weierstrassEquation(x);
    return Fp.eql(left, right);
  }
  if (!isValidXY(CURVE.Gx, CURVE.Gy))
    throw new Error("bad curve params: generator point");
  const _4a3 = Fp.mul(Fp.pow(CURVE.a, _3n2), _4n2);
  const _27b2 = Fp.mul(Fp.sqr(CURVE.b), BigInt(27));
  if (Fp.is0(Fp.add(_4a3, _27b2)))
    throw new Error("bad curve params: a or b");
  function acoord(title, n, banZero = false) {
    if (!Fp.isValid(n) || banZero && Fp.is0(n))
      throw new Error(`bad point coordinate ${title}`);
    return n;
  }
  function aprjpoint(other) {
    if (!(other instanceof Point2))
      throw new Error("Weierstrass Point expected");
  }
  function splitEndoScalarN(k) {
    if (!endo || !endo.basises)
      throw new Error("no endo");
    return _splitEndoScalar(k, endo.basises, Fn2.ORDER);
  }
  function finishEndo(endoBeta, k1p, k2p, k1neg, k2neg) {
    k2p = new Point2(Fp.mul(k2p.X, endoBeta), k2p.Y, k2p.Z);
    k1p = negateCt(k1neg, k1p);
    k2p = negateCt(k2neg, k2p);
    return k1p.add(k2p);
  }
  class Point2 {
    // base / generator point
    static BASE = new Point2(CURVE.Gx, CURVE.Gy, Fp.ONE);
    // zero / infinity / identity point
    static ZERO = new Point2(Fp.ZERO, Fp.ONE, Fp.ZERO);
    // 0, 1, 0
    // math field
    static Fp = Fp;
    // scalar field
    static Fn = Fn2;
    X;
    Y;
    Z;
    /** Does NOT validate if the point is valid. Use `.assertValidity()`. */
    constructor(X, Y, Z) {
      this.X = acoord("x", X);
      this.Y = acoord("y", Y, true);
      this.Z = acoord("z", Z);
      Object.freeze(this);
    }
    static CURVE() {
      return CURVE;
    }
    /** Does NOT validate if the point is valid. Use `.assertValidity()`. */
    static fromAffine(p) {
      const { x, y } = p || {};
      if (!p || !Fp.isValid(x) || !Fp.isValid(y))
        throw new Error("invalid affine point");
      if (p instanceof Point2)
        throw new Error("projective point not allowed");
      if (Fp.is0(x) && Fp.is0(y))
        return Point2.ZERO;
      return new Point2(x, y, Fp.ONE);
    }
    static fromBytes(bytes) {
      const P = Point2.fromAffine(decodePoint(abytes3(bytes, void 0, "point")));
      P.assertValidity();
      return P;
    }
    static fromHex(hex4) {
      return Point2.fromBytes(hexToBytes2(hex4));
    }
    get x() {
      return this.toAffine().x;
    }
    get y() {
      return this.toAffine().y;
    }
    /**
     *
     * @param windowSize
     * @param isLazy - true will defer table computation until the first multiplication
     * @returns
     */
    precompute(windowSize = 8, isLazy = true) {
      wnaf.createCache(this, windowSize);
      if (!isLazy)
        this.multiply(_3n2);
      return this;
    }
    // TODO: return `this`
    /** A point on curve is valid if it conforms to equation. */
    assertValidity() {
      const p = this;
      if (p.is0()) {
        if (extraOpts.allowInfinityPoint && Fp.is0(p.X) && Fp.eql(p.Y, Fp.ONE) && Fp.is0(p.Z))
          return;
        throw new Error("bad point: ZERO");
      }
      const { x, y } = p.toAffine();
      if (!Fp.isValid(x) || !Fp.isValid(y))
        throw new Error("bad point: x or y not field elements");
      if (!isValidXY(x, y))
        throw new Error("bad point: equation left != right");
      if (!p.isTorsionFree())
        throw new Error("bad point: not in prime-order subgroup");
    }
    hasEvenY() {
      const { y } = this.toAffine();
      if (!Fp.isOdd)
        throw new Error("Field doesn't support isOdd");
      return !Fp.isOdd(y);
    }
    /** Compare one point to another. */
    equals(other) {
      aprjpoint(other);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const { X: X2, Y: Y2, Z: Z2 } = other;
      const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
      const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
      return U1 && U2;
    }
    /** Flips point to one corresponding to (x, -y) in Affine coordinates. */
    negate() {
      return new Point2(this.X, Fp.neg(this.Y), this.Z);
    }
    // Renes-Costello-Batina exception-free doubling formula.
    // There is 30% faster Jacobian formula, but it is not complete.
    // https://eprint.iacr.org/2015/1060, algorithm 3
    // Cost: 8M + 3S + 3*a + 2*b3 + 15add.
    double() {
      const { a, b } = CURVE;
      const b3 = Fp.mul(b, _3n2);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
      let t0 = Fp.mul(X1, X1);
      let t1 = Fp.mul(Y1, Y1);
      let t2 = Fp.mul(Z1, Z1);
      let t3 = Fp.mul(X1, Y1);
      t3 = Fp.add(t3, t3);
      Z3 = Fp.mul(X1, Z1);
      Z3 = Fp.add(Z3, Z3);
      X3 = Fp.mul(a, Z3);
      Y3 = Fp.mul(b3, t2);
      Y3 = Fp.add(X3, Y3);
      X3 = Fp.sub(t1, Y3);
      Y3 = Fp.add(t1, Y3);
      Y3 = Fp.mul(X3, Y3);
      X3 = Fp.mul(t3, X3);
      Z3 = Fp.mul(b3, Z3);
      t2 = Fp.mul(a, t2);
      t3 = Fp.sub(t0, t2);
      t3 = Fp.mul(a, t3);
      t3 = Fp.add(t3, Z3);
      Z3 = Fp.add(t0, t0);
      t0 = Fp.add(Z3, t0);
      t0 = Fp.add(t0, t2);
      t0 = Fp.mul(t0, t3);
      Y3 = Fp.add(Y3, t0);
      t2 = Fp.mul(Y1, Z1);
      t2 = Fp.add(t2, t2);
      t0 = Fp.mul(t2, t3);
      X3 = Fp.sub(X3, t0);
      Z3 = Fp.mul(t2, t1);
      Z3 = Fp.add(Z3, Z3);
      Z3 = Fp.add(Z3, Z3);
      return new Point2(X3, Y3, Z3);
    }
    // Renes-Costello-Batina exception-free addition formula.
    // There is 30% faster Jacobian formula, but it is not complete.
    // https://eprint.iacr.org/2015/1060, algorithm 1
    // Cost: 12M + 0S + 3*a + 3*b3 + 23add.
    add(other) {
      aprjpoint(other);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const { X: X2, Y: Y2, Z: Z2 } = other;
      let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
      const a = CURVE.a;
      const b3 = Fp.mul(CURVE.b, _3n2);
      let t0 = Fp.mul(X1, X2);
      let t1 = Fp.mul(Y1, Y2);
      let t2 = Fp.mul(Z1, Z2);
      let t3 = Fp.add(X1, Y1);
      let t4 = Fp.add(X2, Y2);
      t3 = Fp.mul(t3, t4);
      t4 = Fp.add(t0, t1);
      t3 = Fp.sub(t3, t4);
      t4 = Fp.add(X1, Z1);
      let t5 = Fp.add(X2, Z2);
      t4 = Fp.mul(t4, t5);
      t5 = Fp.add(t0, t2);
      t4 = Fp.sub(t4, t5);
      t5 = Fp.add(Y1, Z1);
      X3 = Fp.add(Y2, Z2);
      t5 = Fp.mul(t5, X3);
      X3 = Fp.add(t1, t2);
      t5 = Fp.sub(t5, X3);
      Z3 = Fp.mul(a, t4);
      X3 = Fp.mul(b3, t2);
      Z3 = Fp.add(X3, Z3);
      X3 = Fp.sub(t1, Z3);
      Z3 = Fp.add(t1, Z3);
      Y3 = Fp.mul(X3, Z3);
      t1 = Fp.add(t0, t0);
      t1 = Fp.add(t1, t0);
      t2 = Fp.mul(a, t2);
      t4 = Fp.mul(b3, t4);
      t1 = Fp.add(t1, t2);
      t2 = Fp.sub(t0, t2);
      t2 = Fp.mul(a, t2);
      t4 = Fp.add(t4, t2);
      t0 = Fp.mul(t1, t4);
      Y3 = Fp.add(Y3, t0);
      t0 = Fp.mul(t5, t4);
      X3 = Fp.mul(t3, X3);
      X3 = Fp.sub(X3, t0);
      t0 = Fp.mul(t3, t1);
      Z3 = Fp.mul(t5, Z3);
      Z3 = Fp.add(Z3, t0);
      return new Point2(X3, Y3, Z3);
    }
    subtract(other) {
      aprjpoint(other);
      return this.add(other.negate());
    }
    is0() {
      return this.equals(Point2.ZERO);
    }
    /**
     * Constant time multiplication.
     * Uses wNAF method. Windowed method may be 10% faster,
     * but takes 2x longer to generate and consumes 2x memory.
     * Uses precomputes when available.
     * Uses endomorphism for Koblitz curves.
     * @param scalar - by which the point would be multiplied
     * @returns New point
     */
    multiply(scalar) {
      const { endo: endo2 } = extraOpts;
      if (!Fn2.isValidNot0(scalar))
        throw new RangeError("invalid scalar: out of range");
      let point, fake;
      const mul = (n) => wnaf.cached(this, n, (p) => normalizeZ(Point2, p));
      if (endo2) {
        const { k1neg, k1, k2neg, k2 } = splitEndoScalarN(scalar);
        const { p: k1p, f: k1f } = mul(k1);
        const { p: k2p, f: k2f } = mul(k2);
        fake = k1f.add(k2f);
        point = finishEndo(endo2.beta, k1p, k2p, k1neg, k2neg);
      } else {
        const { p, f } = mul(scalar);
        point = p;
        fake = f;
      }
      return normalizeZ(Point2, [point, fake])[0];
    }
    /**
     * Non-constant-time multiplication. Uses double-and-add algorithm.
     * It's faster, but should only be used when you don't care about
     * an exposed secret key e.g. sig verification, which works over *public* keys.
     */
    multiplyUnsafe(scalar) {
      const { endo: endo2 } = extraOpts;
      const p = this;
      const sc = scalar;
      if (!Fn2.isValid(sc))
        throw new RangeError("invalid scalar: out of range");
      if (sc === _0n4 || p.is0())
        return Point2.ZERO;
      if (sc === _1n4)
        return p;
      if (wnaf.hasCache(this))
        return this.multiply(sc);
      if (endo2) {
        const { k1neg, k1, k2neg, k2 } = splitEndoScalarN(sc);
        const { p1, p2 } = mulEndoUnsafe(Point2, p, k1, k2);
        return finishEndo(endo2.beta, p1, p2, k1neg, k2neg);
      } else {
        return wnaf.unsafe(p, sc);
      }
    }
    /**
     * Converts Projective point to affine (x, y) coordinates.
     * (X, Y, Z) ∋ (x=X/Z, y=Y/Z).
     * @param invertedZ - Z^-1 (inverted zero) - optional, precomputation is useful for invertBatch
     */
    toAffine(invertedZ) {
      const p = this;
      let iz = invertedZ;
      const { X, Y, Z } = p;
      if (Fp.eql(Z, Fp.ONE))
        return { x: X, y: Y };
      const is0 = p.is0();
      if (iz == null)
        iz = is0 ? Fp.ONE : Fp.inv(Z);
      const x = Fp.mul(X, iz);
      const y = Fp.mul(Y, iz);
      const zz = Fp.mul(Z, iz);
      if (is0)
        return { x: Fp.ZERO, y: Fp.ZERO };
      if (!Fp.eql(zz, Fp.ONE))
        throw new Error("invZ was invalid");
      return { x, y };
    }
    /**
     * Checks whether Point is free of torsion elements (is in prime subgroup).
     * Always torsion-free for cofactor=1 curves.
     */
    isTorsionFree() {
      const { isTorsionFree } = extraOpts;
      if (cofactor === _1n4)
        return true;
      if (isTorsionFree)
        return isTorsionFree(Point2, this);
      return wnaf.unsafe(this, CURVE_ORDER2).is0();
    }
    clearCofactor() {
      const { clearCofactor } = extraOpts;
      if (cofactor === _1n4)
        return this;
      if (clearCofactor)
        return clearCofactor(Point2, this);
      return this.multiplyUnsafe(cofactor);
    }
    isSmallOrder() {
      if (cofactor === _1n4)
        return this.is0();
      return this.clearCofactor().is0();
    }
    toBytes(isCompressed = true) {
      abool(isCompressed, "isCompressed");
      this.assertValidity();
      return encodePoint(Point2, this, isCompressed);
    }
    toHex(isCompressed = true) {
      return bytesToHex2(this.toBytes(isCompressed));
    }
    toString() {
      return `<Point ${this.is0() ? "ZERO" : this.toHex()}>`;
    }
  }
  const bits2 = Fn2.BITS;
  const wnaf = new wNAF(Point2, extraOpts.endo ? Math.ceil(bits2 / 2) : bits2);
  if (bits2 >= 8)
    Point2.BASE.precompute(8);
  Object.freeze(Point2.prototype);
  Object.freeze(Point2);
  return Point2;
}
function pprefix(hasEvenY) {
  return Uint8Array.of(hasEvenY ? 2 : 3);
}
function getWLengths(Fp, Fn2) {
  return {
    secretKey: Fn2.BYTES,
    publicKey: 1 + Fp.BYTES,
    publicKeyUncompressed: 1 + 2 * Fp.BYTES,
    publicKeyHasPrefix: true,
    // Raw compact `(r || s)` signature width; DER and recovered signatures use
    // different lengths outside this helper.
    signature: 2 * Fn2.BYTES
  };
}
function ecdh(Point2, ecdhOpts = {}) {
  const { Fn: Fn2 } = Point2;
  const randomBytes_ = ecdhOpts.randomBytes === void 0 ? randomBytes2 : ecdhOpts.randomBytes;
  const lengths = Object.assign(getWLengths(Point2.Fp, Fn2), {
    seed: Math.max(getMinHashLength(Fn2.ORDER), 16)
  });
  function isValidSecretKey(secretKey) {
    try {
      const num2 = Fn2.fromBytes(secretKey);
      return Fn2.isValidNot0(num2);
    } catch (error) {
      return false;
    }
  }
  function isValidPublicKey(publicKey, isCompressed) {
    const { publicKey: comp, publicKeyUncompressed } = lengths;
    try {
      const l = publicKey.length;
      if (isCompressed === true && l !== comp)
        return false;
      if (isCompressed === false && l !== publicKeyUncompressed)
        return false;
      return !!Point2.fromBytes(publicKey);
    } catch (error) {
      return false;
    }
  }
  function randomSecretKey(seed) {
    seed = seed === void 0 ? randomBytes_(lengths.seed) : seed;
    return mapHashToField(abytes3(seed, lengths.seed, "seed"), Fn2.ORDER);
  }
  function getPublicKey(secretKey, isCompressed = true) {
    return Point2.BASE.multiply(Fn2.fromBytes(secretKey)).toBytes(isCompressed);
  }
  function isProbPub(item) {
    const { secretKey, publicKey, publicKeyUncompressed } = lengths;
    const allowedLengths = Fn2._lengths;
    if (!isBytes3(item))
      return void 0;
    const l = abytes3(item, void 0, "key").length;
    const isPub = l === publicKey || l === publicKeyUncompressed;
    const isSec = l === secretKey || !!allowedLengths?.includes(l);
    if (isPub && isSec)
      return void 0;
    return isPub;
  }
  function getSharedSecret(secretKeyA, publicKeyB, isCompressed = true) {
    if (isProbPub(secretKeyA) === true)
      throw new Error("first arg must be private key");
    if (isProbPub(publicKeyB) === false)
      throw new Error("second arg must be public key");
    const s = Fn2.fromBytes(secretKeyA);
    const b = Point2.fromBytes(publicKeyB);
    return b.multiply(s).toBytes(isCompressed);
  }
  const utils3 = {
    isValidSecretKey,
    isValidPublicKey,
    randomSecretKey
  };
  const keygen = createKeygen(randomSecretKey, getPublicKey);
  Object.freeze(utils3);
  Object.freeze(lengths);
  return Object.freeze({ getPublicKey, getSharedSecret, keygen, Point: Point2, utils: utils3, lengths });
}
function ecdsa(Point2, hash, ecdsaOpts = {}) {
  const hash_ = hash;
  ahash(hash_);
  validateObject(ecdsaOpts, {}, {
    hmac: "function",
    lowS: "boolean",
    randomBytes: "function",
    bits2int: "function",
    bits2int_modN: "function"
  });
  ecdsaOpts = Object.assign({}, ecdsaOpts);
  const randomBytes3 = ecdsaOpts.randomBytes === void 0 ? randomBytes2 : ecdsaOpts.randomBytes;
  const hmac2 = ecdsaOpts.hmac === void 0 ? (key, msg) => hmac(hash_, key, msg) : ecdsaOpts.hmac;
  const { Fp, Fn: Fn2 } = Point2;
  const { ORDER: CURVE_ORDER2, BITS: fnBits } = Fn2;
  const { keygen, getPublicKey, getSharedSecret, utils: utils3, lengths } = ecdh(Point2, ecdsaOpts);
  const defaultSigOpts = {
    prehash: true,
    lowS: typeof ecdsaOpts.lowS === "boolean" ? ecdsaOpts.lowS : true,
    format: "compact",
    extraEntropy: false
  };
  const hasLargeRecoveryLifts = CURVE_ORDER2 * _2n2 + _1n4 < Fp.ORDER;
  function isBiggerThanHalfOrder(number2) {
    const HALF = CURVE_ORDER2 >> _1n4;
    return number2 > HALF;
  }
  function validateRS(title, num2) {
    if (!Fn2.isValidNot0(num2))
      throw new Error(`invalid signature ${title}: out of range 1..Point.Fn.ORDER`);
    return num2;
  }
  function assertRecoverableCurve() {
    if (hasLargeRecoveryLifts)
      throw new Error('"recovered" sig type is not supported for cofactor >2 curves');
  }
  function validateSigLength(bytes, format) {
    validateSigFormat(format);
    const size = lengths.signature;
    const sizer = format === "compact" ? size : format === "recovered" ? size + 1 : void 0;
    return abytes3(bytes, sizer);
  }
  class Signature {
    r;
    s;
    recovery;
    constructor(r, s, recovery) {
      this.r = validateRS("r", r);
      this.s = validateRS("s", s);
      if (recovery != null) {
        assertRecoverableCurve();
        if (![0, 1, 2, 3].includes(recovery))
          throw new Error("invalid recovery id");
        this.recovery = recovery;
      }
      Object.freeze(this);
    }
    static fromBytes(bytes, format = defaultSigOpts.format) {
      validateSigLength(bytes, format);
      let recid;
      if (format === "der") {
        const { r: r2, s: s2 } = DER.toSig(abytes3(bytes));
        return new Signature(r2, s2);
      }
      if (format === "recovered") {
        recid = bytes[0];
        format = "compact";
        bytes = bytes.subarray(1);
      }
      const L = lengths.signature / 2;
      const r = bytes.subarray(0, L);
      const s = bytes.subarray(L, L * 2);
      return new Signature(Fn2.fromBytes(r), Fn2.fromBytes(s), recid);
    }
    static fromHex(hex4, format) {
      return this.fromBytes(hexToBytes2(hex4), format);
    }
    assertRecovery() {
      const { recovery } = this;
      if (recovery == null)
        throw new Error("invalid recovery id: must be present");
      return recovery;
    }
    addRecoveryBit(recovery) {
      return new Signature(this.r, this.s, recovery);
    }
    // Unlike the top-level helper below, this method expects a digest that has
    // already been hashed to the curve's message representative.
    recoverPublicKey(messageHash) {
      const { r, s } = this;
      const recovery = this.assertRecovery();
      const radj = recovery === 2 || recovery === 3 ? r + CURVE_ORDER2 : r;
      if (!Fp.isValid(radj))
        throw new Error("invalid recovery id: sig.r+curve.n != R.x");
      const x = Fp.toBytes(radj);
      const R = Point2.fromBytes(concatBytes2(pprefix((recovery & 1) === 0), x));
      const ir = Fn2.inv(radj);
      const h = bits2int_modN(abytes3(messageHash, void 0, "msgHash"));
      const u1 = Fn2.create(-h * ir);
      const u2 = Fn2.create(s * ir);
      const Q = Point2.BASE.multiplyUnsafe(u1).add(R.multiplyUnsafe(u2));
      if (Q.is0())
        throw new Error("invalid recovery: point at infinify");
      Q.assertValidity();
      return Q;
    }
    // Signatures should be low-s, to prevent malleability.
    hasHighS() {
      return isBiggerThanHalfOrder(this.s);
    }
    toBytes(format = defaultSigOpts.format) {
      validateSigFormat(format);
      if (format === "der")
        return hexToBytes2(DER.hexFromSig(this));
      const { r, s } = this;
      const rb = Fn2.toBytes(r);
      const sb = Fn2.toBytes(s);
      if (format === "recovered") {
        assertRecoverableCurve();
        return concatBytes2(Uint8Array.of(this.assertRecovery()), rb, sb);
      }
      return concatBytes2(rb, sb);
    }
    toHex(format) {
      return bytesToHex2(this.toBytes(format));
    }
  }
  Object.freeze(Signature.prototype);
  Object.freeze(Signature);
  const bits2int = ecdsaOpts.bits2int === void 0 ? function bits2int_def(bytes) {
    if (bytes.length > 8192)
      throw new Error("input is too large");
    const num2 = bytesToNumberBE(bytes);
    const delta = bytes.length * 8 - fnBits;
    return delta > 0 ? num2 >> BigInt(delta) : num2;
  } : ecdsaOpts.bits2int;
  const bits2int_modN = ecdsaOpts.bits2int_modN === void 0 ? function bits2int_modN_def(bytes) {
    return Fn2.create(bits2int(bytes));
  } : ecdsaOpts.bits2int_modN;
  const ORDER_MASK = bitMask(fnBits);
  function int2octets(num2) {
    aInRange("num < 2^" + fnBits, num2, _0n4, ORDER_MASK);
    return Fn2.toBytes(num2);
  }
  function validateMsgAndHash(message, prehash) {
    abytes3(message, void 0, "message");
    return prehash ? abytes3(hash_(message), void 0, "prehashed message") : message;
  }
  function prepSig(message, secretKey, opts) {
    const { lowS, prehash, extraEntropy } = validateSigOpts(opts, defaultSigOpts);
    message = validateMsgAndHash(message, prehash);
    const h1int = bits2int_modN(message);
    const d = Fn2.fromBytes(secretKey);
    if (!Fn2.isValidNot0(d))
      throw new Error("invalid private key");
    const seedArgs = [int2octets(d), int2octets(h1int)];
    if (extraEntropy != null && extraEntropy !== false) {
      const e = extraEntropy === true ? randomBytes3(lengths.secretKey) : extraEntropy;
      seedArgs.push(abytes3(e, void 0, "extraEntropy"));
    }
    const seed = concatBytes2(...seedArgs);
    const m = h1int;
    function k2sig(kBytes) {
      const k = bits2int(kBytes);
      if (!Fn2.isValidNot0(k))
        return;
      const ik = Fn2.inv(k);
      const q = Point2.BASE.multiply(k).toAffine();
      const r = Fn2.create(q.x);
      if (r === _0n4)
        return;
      const s = Fn2.create(ik * Fn2.create(m + r * d));
      if (s === _0n4)
        return;
      let recovery = (q.x === r ? 0 : 2) | Number(q.y & _1n4);
      let normS = s;
      if (lowS && isBiggerThanHalfOrder(s)) {
        normS = Fn2.neg(s);
        recovery ^= 1;
      }
      return new Signature(r, normS, hasLargeRecoveryLifts ? void 0 : recovery);
    }
    return { seed, k2sig };
  }
  function sign(message, secretKey, opts = {}) {
    const { seed, k2sig } = prepSig(message, secretKey, opts);
    const drbg = createHmacDrbg(hash_.outputLen, Fn2.BYTES, hmac2);
    const sig = drbg(seed, k2sig);
    return sig.toBytes(opts.format);
  }
  function verify(signature, message, publicKey, opts = {}) {
    const { lowS, prehash, format } = validateSigOpts(opts, defaultSigOpts);
    publicKey = abytes3(publicKey, void 0, "publicKey");
    message = validateMsgAndHash(message, prehash);
    if (!isBytes3(signature)) {
      const end = signature instanceof Signature ? ", use sig.toBytes()" : "";
      throw new Error("verify expects Uint8Array signature" + end);
    }
    validateSigLength(signature, format);
    try {
      const sig = Signature.fromBytes(signature, format);
      const P = Point2.fromBytes(publicKey);
      if (lowS && sig.hasHighS())
        return false;
      const { r, s } = sig;
      const h = bits2int_modN(message);
      const is2 = Fn2.inv(s);
      const u1 = Fn2.create(h * is2);
      const u2 = Fn2.create(r * is2);
      const R = Point2.BASE.multiplyUnsafe(u1).add(P.multiplyUnsafe(u2));
      if (R.is0())
        return false;
      const v = Fn2.create(R.x);
      return v === r;
    } catch (e) {
      return false;
    }
  }
  function recoverPublicKey(signature, message, opts = {}) {
    const { prehash } = validateSigOpts(opts, defaultSigOpts);
    message = validateMsgAndHash(message, prehash);
    return Signature.fromBytes(signature, "recovered").recoverPublicKey(message).toBytes();
  }
  return Object.freeze({
    keygen,
    getPublicKey,
    getSharedSecret,
    utils: utils3,
    lengths,
    Point: Point2,
    sign,
    verify,
    recoverPublicKey,
    Signature,
    hash: hash_
  });
}

// node_modules/@noble/curves/secp256k1.js
var secp256k1_CURVE = {
  p: BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f"),
  n: BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141"),
  h: BigInt(1),
  a: BigInt(0),
  b: BigInt(7),
  Gx: BigInt("0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"),
  Gy: BigInt("0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8")
};
var secp256k1_ENDO = {
  beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
  basises: [
    [BigInt("0x3086d221a7d46bcde86c90e49284eb15"), -BigInt("0xe4437ed6010e88286f547fa90abfe4c3")],
    [BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8"), BigInt("0x3086d221a7d46bcde86c90e49284eb15")]
  ]
};
var _0n5 = /* @__PURE__ */ BigInt(0);
var _2n3 = /* @__PURE__ */ BigInt(2);
function sqrtMod(y) {
  const P = secp256k1_CURVE.p;
  const _3n3 = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
  const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
  const b2 = y * y * y % P;
  const b3 = b2 * b2 * y % P;
  const b6 = pow2(b3, _3n3, P) * b3 % P;
  const b9 = pow2(b6, _3n3, P) * b3 % P;
  const b11 = pow2(b9, _2n3, P) * b2 % P;
  const b22 = pow2(b11, _11n, P) * b11 % P;
  const b44 = pow2(b22, _22n, P) * b22 % P;
  const b88 = pow2(b44, _44n, P) * b44 % P;
  const b176 = pow2(b88, _88n, P) * b88 % P;
  const b220 = pow2(b176, _44n, P) * b44 % P;
  const b223 = pow2(b220, _3n3, P) * b3 % P;
  const t1 = pow2(b223, _23n, P) * b22 % P;
  const t2 = pow2(t1, _6n, P) * b2 % P;
  const root = pow2(t2, _2n3, P);
  if (!Fpk1.eql(Fpk1.sqr(root), y))
    throw new Error("Cannot find square root");
  return root;
}
var Fpk1 = Field(secp256k1_CURVE.p, { sqrt: sqrtMod });
var Pointk1 = /* @__PURE__ */ weierstrass(secp256k1_CURVE, {
  Fp: Fpk1,
  endo: secp256k1_ENDO
});
var secp256k1 = /* @__PURE__ */ ecdsa(Pointk1, sha256);
var TAGGED_HASH_PREFIXES = {};
function taggedHash(tag2, ...messages) {
  let tagP = TAGGED_HASH_PREFIXES[tag2];
  if (tagP === void 0) {
    const tagH = sha256(asciiToBytes(tag2));
    tagP = concatBytes2(tagH, tagH);
    TAGGED_HASH_PREFIXES[tag2] = tagP;
  }
  return sha256(concatBytes2(tagP, ...messages));
}
var pointToBytes = (point) => point.toBytes(true).slice(1);
var hasEven = (y) => y % _2n3 === _0n5;
function schnorrGetExtPubKey(priv) {
  const { Fn: Fn2, BASE } = Pointk1;
  const d_ = Fn2.fromBytes(priv);
  const p = BASE.multiply(d_);
  const scalar = hasEven(p.y) ? d_ : Fn2.neg(d_);
  return { scalar, bytes: pointToBytes(p) };
}
function lift_x(x) {
  const Fp = Fpk1;
  if (!Fp.isValidNot0(x))
    throw new Error("invalid x: Fail if x \u2265 p");
  const xx = Fp.create(x * x);
  const c = Fp.create(xx * x + BigInt(7));
  let y = Fp.sqrt(c);
  if (!hasEven(y))
    y = Fp.neg(y);
  const p = Pointk1.fromAffine({ x, y });
  p.assertValidity();
  return p;
}
var num = bytesToNumberBE;
function challenge(...args) {
  return Pointk1.Fn.create(num(taggedHash("BIP0340/challenge", ...args)));
}
function schnorrGetPublicKey(secretKey) {
  return schnorrGetExtPubKey(secretKey).bytes;
}
function schnorrSign(message, secretKey, auxRand = randomBytes(32)) {
  const { Fn: Fn2, BASE } = Pointk1;
  const m = abytes3(message, void 0, "message");
  const { bytes: px, scalar: d } = schnorrGetExtPubKey(secretKey);
  const a = abytes3(auxRand, 32, "auxRand");
  const t = Fn2.toBytes(d ^ num(taggedHash("BIP0340/aux", a)));
  const rand = taggedHash("BIP0340/nonce", t, px, m);
  const k_ = Fn2.create(num(rand));
  if (k_ === 0n)
    throw new Error("sign failed: k is zero");
  const p = BASE.multiply(k_);
  const k = hasEven(p.y) ? k_ : Fn2.neg(k_);
  const rx = pointToBytes(p);
  const e = challenge(rx, px, m);
  const sig = new Uint8Array(64);
  sig.set(rx, 0);
  sig.set(Fn2.toBytes(Fn2.create(k + e * d)), 32);
  if (!schnorrVerify(sig, m, px))
    throw new Error("sign: Invalid signature produced");
  return sig;
}
function schnorrVerify(signature, message, publicKey) {
  const { Fp, Fn: Fn2, BASE } = Pointk1;
  const sig = abytes3(signature, 64, "signature");
  const m = abytes3(message, void 0, "message");
  const pub = abytes3(publicKey, 32, "publicKey");
  try {
    const P = lift_x(num(pub));
    const r = num(sig.subarray(0, 32));
    if (!Fp.isValidNot0(r))
      return false;
    const s = num(sig.subarray(32, 64));
    if (!Fn2.isValidNot0(s))
      return false;
    const e = challenge(Fn2.toBytes(r), pointToBytes(P), m);
    const R = BASE.multiplyUnsafe(s).add(P.multiplyUnsafe(Fn2.neg(e)));
    const { x, y } = R.toAffine();
    if (R.is0() || !hasEven(y) || x !== r)
      return false;
    return true;
  } catch (error) {
    return false;
  }
}
var schnorr = /* @__PURE__ */ (() => {
  const size = 32;
  const seedLength = 48;
  const randomSecretKey = (seed) => {
    seed = seed === void 0 ? randomBytes(seedLength) : seed;
    return mapHashToField(seed, secp256k1_CURVE.n);
  };
  return Object.freeze({
    keygen: createKeygen(randomSecretKey, schnorrGetPublicKey),
    getPublicKey: schnorrGetPublicKey,
    sign: schnorrSign,
    verify: schnorrVerify,
    Point: Pointk1,
    utils: Object.freeze({
      randomSecretKey,
      taggedHash,
      lift_x,
      pointToBytes
    }),
    lengths: Object.freeze({
      secretKey: size,
      publicKey: size,
      publicKeyHasPrefix: false,
      signature: size * 2,
      seed: seedLength
    })
  });
})();

// node_modules/@noble/hashes/legacy.js
var Rho160 = /* @__PURE__ */ Uint8Array.from([
  7,
  4,
  13,
  1,
  10,
  6,
  15,
  3,
  12,
  0,
  9,
  5,
  2,
  14,
  11,
  8
]);
var Id160 = /* @__PURE__ */ (() => Uint8Array.from(new Array(16).fill(0).map((_, i) => i)))();
var Pi160 = /* @__PURE__ */ (() => Id160.map((i) => (9 * i + 5) % 16))();
var idxLR = /* @__PURE__ */ (() => {
  const L = [Id160];
  const R = [Pi160];
  const res = [L, R];
  for (let i = 0; i < 4; i++)
    for (let j of res)
      j.push(j[i].map((k) => Rho160[k]));
  return res;
})();
var idxL = /* @__PURE__ */ (() => idxLR[0])();
var idxR = /* @__PURE__ */ (() => idxLR[1])();
var shifts160 = /* @__PURE__ */ [
  [11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8],
  [12, 13, 11, 15, 6, 9, 9, 7, 12, 15, 11, 13, 7, 8, 7, 7],
  [13, 15, 14, 11, 7, 7, 6, 8, 13, 14, 13, 12, 5, 5, 6, 9],
  [14, 11, 12, 14, 8, 6, 5, 5, 15, 12, 15, 14, 9, 9, 8, 6],
  [15, 12, 13, 13, 9, 5, 8, 6, 14, 11, 12, 11, 8, 6, 5, 5]
].map((i) => Uint8Array.from(i));
var shiftsL160 = /* @__PURE__ */ idxL.map((idx, i) => idx.map((j) => shifts160[i][j]));
var shiftsR160 = /* @__PURE__ */ idxR.map((idx, i) => idx.map((j) => shifts160[i][j]));
var Kl160 = /* @__PURE__ */ Uint32Array.from([
  0,
  1518500249,
  1859775393,
  2400959708,
  2840853838
]);
var Kr160 = /* @__PURE__ */ Uint32Array.from([
  1352829926,
  1548603684,
  1836072691,
  2053994217,
  0
]);
function ripemd_f(group, x, y, z) {
  if (group === 0)
    return x ^ y ^ z;
  if (group === 1)
    return x & y | ~x & z;
  if (group === 2)
    return (x | ~y) ^ z;
  if (group === 3)
    return x & z | y & ~z;
  return x ^ (y | ~z);
}
var BUF_160 = /* @__PURE__ */ new Uint32Array(16);
var _RIPEMD160 = class extends HashMD {
  h0 = 1732584193 | 0;
  h1 = 4023233417 | 0;
  h2 = 2562383102 | 0;
  h3 = 271733878 | 0;
  h4 = 3285377520 | 0;
  constructor() {
    super(64, 20, 8, true);
  }
  get() {
    const { h0, h1, h2, h3, h4 } = this;
    return [h0, h1, h2, h3, h4];
  }
  set(h0, h1, h2, h3, h4) {
    this.h0 = h0 | 0;
    this.h1 = h1 | 0;
    this.h2 = h2 | 0;
    this.h3 = h3 | 0;
    this.h4 = h4 | 0;
  }
  process(view2, offset) {
    for (let i = 0; i < 16; i++, offset += 4)
      BUF_160[i] = view2.getUint32(offset, true);
    let al = this.h0 | 0, ar = al, bl = this.h1 | 0, br = bl, cl = this.h2 | 0, cr = cl, dl = this.h3 | 0, dr = dl, el = this.h4 | 0, er = el;
    for (let group = 0; group < 5; group++) {
      const rGroup = 4 - group;
      const hbl = Kl160[group], hbr = Kr160[group];
      const rl = idxL[group], rr = idxR[group];
      const sl = shiftsL160[group], sr = shiftsR160[group];
      for (let i = 0; i < 16; i++) {
        const tl = rotl(al + ripemd_f(group, bl, cl, dl) + BUF_160[rl[i]] + hbl, sl[i]) + el | 0;
        al = el, el = dl, dl = rotl(cl, 10) | 0, cl = bl, bl = tl;
      }
      for (let i = 0; i < 16; i++) {
        const tr = rotl(ar + ripemd_f(rGroup, br, cr, dr) + BUF_160[rr[i]] + hbr, sr[i]) + er | 0;
        ar = er, er = dr, dr = rotl(cr, 10) | 0, cr = br, br = tr;
      }
    }
    this.set(this.h1 + cl + dr | 0, this.h2 + dl + er | 0, this.h3 + el + ar | 0, this.h4 + al + br | 0, this.h0 + bl + cr | 0);
  }
  roundClean() {
    clean(BUF_160);
  }
  destroy() {
    this.destroyed = true;
    clean(this.buffer);
    this.set(0, 0, 0, 0, 0);
  }
};
var ripemd160 = /* @__PURE__ */ createHasher(() => new _RIPEMD160());

// node_modules/micro-packed/node_modules/@scure/base/index.js
function isBytes4(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
}
function abytes4(b) {
  if (!isBytes4(b))
    throw new TypeError("Uint8Array expected");
}
function isArrayOf(isString2, arr) {
  if (!Array.isArray(arr))
    return false;
  if (arr.length === 0)
    return true;
  if (isString2) {
    return arr.every((item) => typeof item === "string");
  } else {
    return arr.every((item) => Number.isSafeInteger(item));
  }
}
function afn2(input) {
  if (typeof input !== "function")
    throw new TypeError("function expected");
  return true;
}
function astr2(label, input) {
  if (typeof input !== "string")
    throw new TypeError(`${label}: string expected`);
  return true;
}
function anumber4(n) {
  if (typeof n !== "number")
    throw new TypeError(`number expected, got ${typeof n}`);
  if (!Number.isSafeInteger(n))
    throw new RangeError(`invalid integer: ${n}`);
}
function aArr(input) {
  if (!Array.isArray(input))
    throw new TypeError("array expected");
}
function astrArr(label, input) {
  if (!isArrayOf(true, input))
    throw new TypeError(`${label}: array of strings expected`);
}
function anumArr(label, input) {
  if (!isArrayOf(false, input))
    throw new TypeError(`${label}: array of numbers expected`);
}
// @__NO_SIDE_EFFECTS__
function chain2(...args) {
  const id = (a) => a;
  const wrap2 = (a, b) => (c) => a(b(c));
  const encode3 = args.map((x) => x.encode).reduceRight(wrap2, id);
  const decode = args.map((x) => x.decode).reduce(wrap2, id);
  return { encode: encode3, decode };
}
// @__NO_SIDE_EFFECTS__
function alphabet2(letters) {
  const lettersA = typeof letters === "string" ? letters.split("") : letters;
  const len = lettersA.length;
  astrArr("alphabet", lettersA);
  const indexes = new Map(lettersA.map((l, i) => [l, i]));
  return {
    encode: (digits) => {
      aArr(digits);
      return digits.map((i) => {
        if (!Number.isSafeInteger(i) || i < 0 || i >= len)
          throw new Error(`alphabet.encode: digit index outside alphabet "${i}". Allowed: ${letters}`);
        return lettersA[i];
      });
    },
    decode: (input) => {
      aArr(input);
      return input.map((letter) => {
        astr2("alphabet.decode", letter);
        const i = indexes.get(letter);
        if (i === void 0)
          throw new Error(`Unknown letter: "${letter}". Allowed: ${letters}`);
        return i;
      });
    }
  };
}
// @__NO_SIDE_EFFECTS__
function join(separator = "") {
  astr2("join", separator);
  return {
    encode: (from) => {
      astrArr("join.decode", from);
      return from.join(separator);
    },
    decode: (to) => {
      astr2("join.decode", to);
      return to.split(separator);
    }
  };
}
// @__NO_SIDE_EFFECTS__
function normalize2(fn) {
  afn2(fn);
  return { encode: (from) => from, decode: (to) => fn(to) };
}
var gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
var radix2carry = /* @__NO_SIDE_EFFECTS__ */ (from, to) => from + (to - gcd(from, to));
var powers2 = /* @__PURE__ */ (() => {
  let res = [];
  for (let i = 0; i < 40; i++)
    res.push(2 ** i);
  return res;
})();
function convertRadix2(data, from, to, padding) {
  aArr(data);
  if (from <= 0 || from > 32)
    throw new RangeError(`convertRadix2: wrong from=${from}`);
  if (to <= 0 || to > 32)
    throw new RangeError(`convertRadix2: wrong to=${to}`);
  if (/* @__PURE__ */ radix2carry(from, to) > 32) {
    throw new Error(`convertRadix2: carry overflow from=${from} to=${to} carryBits=${/* @__PURE__ */ radix2carry(from, to)}`);
  }
  let carry = 0;
  let pos = 0;
  const max = powers2[from];
  const mask = powers2[to] - 1;
  const res = [];
  for (const n of data) {
    anumber4(n);
    if (n >= max)
      throw new Error(`convertRadix2: invalid data word=${n} from=${from}`);
    carry = carry << from | n;
    if (pos + from > 32)
      throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from}`);
    pos += from;
    for (; pos >= to; pos -= to)
      res.push((carry >> pos - to & mask) >>> 0);
    const pow = powers2[pos];
    if (pow === void 0)
      throw new Error("invalid carry");
    carry &= pow - 1;
  }
  carry = carry << to - pos & mask;
  if (!padding && pos >= from)
    throw new Error("Excess padding");
  if (!padding && carry > 0)
    throw new Error(`Non-zero padding: ${carry}`);
  if (padding && pos > 0)
    res.push(carry >>> 0);
  return res;
}
// @__NO_SIDE_EFFECTS__
function radix22(bits2, revPadding = false) {
  anumber4(bits2);
  if (bits2 <= 0 || bits2 > 32)
    throw new RangeError("radix2: bits should be in (0..32]");
  if (/* @__PURE__ */ radix2carry(8, bits2) > 32 || /* @__PURE__ */ radix2carry(bits2, 8) > 32)
    throw new RangeError("radix2: carry overflow");
  return {
    encode: (bytes) => {
      if (!isBytes4(bytes))
        throw new TypeError("radix2.encode input should be Uint8Array");
      return convertRadix2(Array.from(bytes), 8, bits2, !revPadding);
    },
    decode: (digits) => {
      anumArr("radix2.decode", digits);
      return Uint8Array.from(convertRadix2(digits, bits2, 8, revPadding));
    }
  };
}
var _isWellFormedShim2 = (str) => {
  try {
    return encodeURI(str) !== null;
  } catch {
    return false;
  }
};
var _isWellFormed2 = /* @__PURE__ */ (() => (
  // Pick the native check once so utf8.decode doesn't re-probe String.prototype on every call.
  typeof "".isWellFormed === "function" ? (str) => str.isWellFormed() : _isWellFormedShim2
))();
var utf8Fallback2 = /* @__PURE__ */ Object.freeze({
  encode(data) {
    abytes4(data);
    let res = "";
    for (let i = 0; i < data.length; ) {
      const a = data[i++];
      if (a < 128) {
        res += String.fromCharCode(a);
        continue;
      }
      if (a < 194 || i >= data.length)
        throw new TypeError(`invalid utf8 at byte ${i - 1}`);
      const b = data[i++];
      if ((b & 192) !== 128)
        throw new TypeError(`invalid utf8 at byte ${i - 1}`);
      let cp = (a & 31) << 6 | b & 63;
      if (a >= 224) {
        if (i >= data.length)
          throw new TypeError(`invalid utf8 at byte ${i - 1}`);
        const c = data[i++];
        if ((c & 192) !== 128 || a === 224 && b < 160 || a === 237 && b >= 160)
          throw new TypeError(`invalid utf8 at byte ${i - 1}`);
        cp = (a & 15) << 12 | (b & 63) << 6 | c & 63;
        if (a >= 240) {
          if (i >= data.length)
            throw new TypeError(`invalid utf8 at byte ${i - 1}`);
          const d = data[i++];
          if (a > 244 || (d & 192) !== 128 || a === 240 && b < 144 || a === 244 && b >= 144)
            throw new TypeError(`invalid utf8 at byte ${i - 1}`);
          cp = (a & 7) << 18 | (b & 63) << 12 | (c & 63) << 6 | d & 63;
        }
      }
      if (cp < 65536)
        res += String.fromCharCode(cp);
      else {
        cp -= 65536;
        res += String.fromCharCode((cp >> 10) + 55296, (cp & 1023) + 56320);
      }
    }
    return res;
  },
  decode(str) {
    astr2("utf8", str);
    if (!_isWellFormed2(str))
      throw new TypeError("utf8 expected well-formed string");
    const res = new Uint8Array(str.length * 3);
    let pos = 0;
    for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);
      if (c < 128) {
        res[pos++] = c;
        continue;
      }
      if (c >= 55296 && c <= 57343) {
        const d = str.charCodeAt(++i);
        c = 65536 + (c - 55296 << 10) + d - 56320;
      }
      if (c >= 65536) {
        res[pos++] = c >> 18 | 240;
        res[pos++] = c >> 12 & 63 | 128;
      } else if (c >= 2048)
        res[pos++] = c >> 12 | 224;
      else
        res[pos++] = c >> 6 | 192;
      if (c >= 2048)
        res[pos++] = c >> 6 & 63 | 128;
      res[pos++] = c & 63 | 128;
    }
    return res.subarray(0, pos);
  }
});
var utf82 = /* @__PURE__ */ (() => {
  let _utf8Encoder;
  let _utf8Decoder;
  const utf8Builtin = {
    // ignoreBOM preserves an explicit leading U+FEFF;
    // fatal rejects invalid UTF-8 bytes instead of replacing them.
    encode(data) {
      abytes4(data);
      return (_utf8Decoder || (_utf8Decoder = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true }))).decode(data);
    },
    decode(str) {
      astr2("utf8", str);
      if (!_isWellFormed2(str))
        throw new TypeError("utf8 expected well-formed string");
      return (_utf8Encoder || (_utf8Encoder = new TextEncoder())).encode(str);
    }
  };
  return Object.freeze({
    // Select each direction once at module init, since
    // TextEncoder and TextDecoder can exist independently.
    encode: typeof TextDecoder === "function" ? utf8Builtin.encode : utf8Fallback2.encode,
    decode: typeof TextEncoder === "function" ? utf8Builtin.decode : utf8Fallback2.decode
  });
})();
var hasHexBuiltin3 = /* @__PURE__ */ (() => (
  // Require both directions before enabling the native hex path so encode/decode stay symmetric.
  typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
))();
var hexBuiltin2 = {
  // Keep local type guards so the native path preserves library-level input errors.
  // Native toHex emits lowercase hex, matching the fallback alphabet and Node's hex strings.
  encode(data) {
    abytes4(data);
    return data.toHex();
  },
  // Native fromHex accepts either hex case and rejects odd-length / non-hex syntax.
  decode(s) {
    astr2("hex", s);
    return Uint8Array.fromHex(s);
  }
};
var hex2 = /* @__PURE__ */ Object.freeze(hasHexBuiltin3 ? hexBuiltin2 : /* @__PURE__ */ chain2(/* @__PURE__ */ radix22(4), /* @__PURE__ */ alphabet2("0123456789abcdef"), /* @__PURE__ */ join(""), /* @__PURE__ */ normalize2((s) => {
  if (typeof s !== "string" || s.length % 2 !== 0)
    throw new TypeError(`hex.decode: expected string, got ${typeof s} with length ${s.length}`);
  return s.toLowerCase();
})));

// node_modules/micro-packed/index.js
var EMPTY = /* @__PURE__ */ Uint8Array.of();
var NULL = /* @__PURE__ */ Uint8Array.of(0);
var restrictedKeys = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]);
var validateFieldName = (name, label) => {
  if (typeof name !== "string")
    throw new Error(`${label} should be string, got ${typeof name}`);
  if (name.includes(".."))
    throw new TypeError(`${label} ${name} cannot contain path parent ..`);
  if (name.includes("/"))
    throw new TypeError(`${label} ${name} cannot contain path separator /`);
  if (restrictedKeys.has(name))
    throw new Error(`${label} ${name} is reserved`);
};
function equalBytes(a, b) {
  if (a.length !== b.length)
    return false;
  for (let i = 0; i < a.length; i++)
    if (a[i] !== b[i])
      return false;
  return true;
}
function createFindBytes(needle) {
  if (needle.length === 1) {
    const byte = needle[0];
    return (data, pos = 0) => {
      const idx = data.indexOf(byte, pos);
      return idx === -1 ? void 0 : idx;
    };
  }
  const back = new Uint32Array(needle.length);
  for (let i = 1, j = 0; i < needle.length; i++) {
    while (j && needle[i] !== needle[j])
      j = back[j - 1];
    if (needle[i] === needle[j])
      back[i] = ++j;
  }
  return (data, pos = 0) => {
    for (let i = pos, j = 0; i < data.length; i++) {
      while (j && data[i] !== needle[j])
        j = back[j - 1];
      if (data[i] !== needle[j])
        continue;
      if (++j === needle.length)
        return i - needle.length + 1;
    }
    return void 0;
  };
}
var findBytes = (needle, data, pos = 0) => createFindBytes(needle)(data, pos);
function equal(a, b) {
  const aBytes = isBytes5(a);
  const bBytes = isBytes5(b);
  if (aBytes || bBytes)
    return aBytes && bBytes && equalBytes(a, b);
  return a === b;
}
function isBytes5(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
}
function concatBytes3(...arrays) {
  let sum = 0;
  for (let i = 0; i < arrays.length; i++) {
    const a = arrays[i];
    if (!isBytes5(a))
      throw new Error("Uint8Array expected");
    sum += a.length;
  }
  const res = new Uint8Array(sum);
  for (let i = 0, pad = 0; i < arrays.length; i++) {
    const a = arrays[i];
    res.set(a, pad);
    pad += a.length;
  }
  return res;
}
var createView2 = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
var _0n6 = /* @__PURE__ */ BigInt(0);
var _1n5 = /* @__PURE__ */ BigInt(1);
var _2n4 = /* @__PURE__ */ BigInt(2);
var _8n2 = /* @__PURE__ */ BigInt(8);
var _10n = /* @__PURE__ */ BigInt(10);
var _255n = /* @__PURE__ */ BigInt(255);
function isPlainObject(obj) {
  return Object.prototype.toString.call(obj) === "[object Object]";
}
function isNum(num2) {
  return Number.isSafeInteger(num2);
}
var hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
var utils = /* @__PURE__ */ Object.freeze({
  equalBytes,
  isBytes: isBytes5,
  isCoder,
  checkBounds,
  concatBytes: concatBytes3,
  createView: createView2,
  isPlainObject
});
var lengthCoder = (len) => {
  if (len !== null && typeof len !== "string" && !isCoder(len) && !isBytes5(len) && !isNum(len)) {
    throw new TypeError(`lengthCoder: expected null | number | Uint8Array | CoderType, got ${len} (${typeof len})`);
  }
  if (typeof len === "number" && len < 0)
    throw new Error(`lengthCoder: wrong length=${len}`);
  if (isBytes5(len) && !len.length)
    throw new Error("lengthCoder: empty terminator");
  return {
    encodeStream(w, value) {
      if (len === null)
        return;
      if (isCoder(len))
        return len.encodeStream(w, value);
      let byteLen;
      if (typeof len === "number")
        byteLen = len;
      else if (typeof len === "string")
        byteLen = Path.resolve(w.stack, len);
      if (typeof byteLen === "bigint")
        byteLen = Number(byteLen);
      if (byteLen === void 0 || byteLen !== value)
        throw w.err(`Wrong length: ${byteLen} len=${len} exp=${value} (${typeof value})`);
    },
    decodeStream(r) {
      let byteLen;
      if (isCoder(len))
        byteLen = Number(len.decodeStream(r));
      else if (typeof len === "number")
        byteLen = len;
      else if (typeof len === "string")
        byteLen = Path.resolve(r.stack, len);
      if (typeof byteLen === "bigint")
        byteLen = Number(byteLen);
      if (!isNum(byteLen) || byteLen < 0)
        throw r.err(`Wrong length: ${byteLen}`);
      return byteLen;
    }
  };
};
var Bitset = /* @__PURE__ */ Object.freeze({
  BITS: 32,
  FULL_MASK: -1 >>> 0,
  // 1<<32 will overflow
  len: (len) => {
    if (!isNum(len) || len < 0)
      throw new Error(`wrong len=${len}`);
    return Math.ceil(len / 32);
  },
  create: (len) => new Uint32Array(Bitset.len(len)),
  clean: (bs) => bs.fill(0),
  debug: (bs) => Array.from(bs).map((i) => (i >>> 0).toString(2).padStart(32, "0")),
  checkLen: (bs, len) => {
    if (Bitset.len(len) === bs.length)
      return;
    throw new Error(`wrong length=${bs.length}. Expected: ${Bitset.len(len)}`);
  },
  chunkLen: (bsLen, pos, len) => {
    if (!isNum(bsLen) || bsLen < 0)
      throw new Error(`wrong bsLen=${bsLen}`);
    if (!isNum(pos) || pos < 0)
      throw new Error(`wrong pos=${pos}`);
    if (!isNum(len) || len < 0)
      throw new Error(`wrong len=${len}`);
    if (pos > bsLen - len)
      throw new Error(`wrong range=${pos}/${len} of ${bsLen}`);
  },
  set: (bs, chunk, value, allowRewrite = true) => {
    if (!isNum(chunk) || chunk < 0 || chunk >= bs.length)
      return false;
    if (!allowRewrite && (bs[chunk] & value) !== 0)
      return false;
    bs[chunk] |= value;
    return true;
  },
  pos: (pos, i) => ({
    chunk: Math.floor((pos + i) / 32),
    mask: 1 << 32 - (pos + i) % 32 - 1
  }),
  indices: (bs, len, invert2 = false) => {
    Bitset.checkLen(bs, len);
    const { FULL_MASK, BITS } = Bitset;
    const left = BITS - len % BITS;
    const lastMask = left ? FULL_MASK >>> left << left : FULL_MASK;
    const res = [];
    for (let i = 0; i < bs.length; i++) {
      let c = bs[i];
      if (invert2)
        c = ~c;
      if (i === bs.length - 1)
        c &= lastMask;
      if (c === 0)
        continue;
      for (let j = 0; j < BITS; j++) {
        const m = 1 << BITS - j - 1;
        if (c & m)
          res.push(i * BITS + j);
      }
    }
    return res;
  },
  range: (arr) => {
    const res = [];
    let cur;
    for (const i of arr) {
      if (cur === void 0 || i !== cur.pos + cur.length)
        res.push(cur = { pos: i, length: 1 });
      else
        cur.length += 1;
    }
    return res;
  },
  rangeDebug: (bs, len, invert2 = false) => `[${Bitset.range(Bitset.indices(bs, len, invert2)).map((i) => `(${i.pos}/${i.length})`).join(", ")}]`,
  setRange: (bs, bsLen, pos, len, allowRewrite = true) => {
    Bitset.chunkLen(bsLen, pos, len);
    if (len === 0)
      return true;
    const { FULL_MASK, BITS } = Bitset;
    const first = pos % BITS ? Math.floor(pos / BITS) : void 0;
    const lastPos = pos + len;
    const last = lastPos % BITS ? Math.floor(lastPos / BITS) : void 0;
    const canSet = (chunk, value) => chunk >= 0 && chunk < bs.length && (bs[chunk] & value) === 0;
    if (!allowRewrite) {
      if (first !== void 0 && first === last) {
        if (!canSet(first, FULL_MASK >>> BITS - len << BITS - len - pos))
          return false;
      } else {
        if (first !== void 0 && !canSet(first, FULL_MASK >>> pos % BITS))
          return false;
        const start2 = first !== void 0 ? first + 1 : pos / BITS;
        const end2 = last !== void 0 ? last : lastPos / BITS;
        for (let i = start2; i < end2; i++)
          if (!canSet(i, FULL_MASK))
            return false;
        if (last !== void 0 && first !== last) {
          if (!canSet(last, FULL_MASK << BITS - lastPos % BITS))
            return false;
        }
      }
    }
    if (first !== void 0 && first === last)
      return Bitset.set(bs, first, FULL_MASK >>> BITS - len << BITS - len - pos, allowRewrite);
    if (first !== void 0) {
      if (!Bitset.set(bs, first, FULL_MASK >>> pos % BITS, allowRewrite))
        return false;
    }
    const start = first !== void 0 ? first + 1 : pos / BITS;
    const end = last !== void 0 ? last : lastPos / BITS;
    for (let i = start; i < end; i++)
      if (!Bitset.set(bs, i, FULL_MASK, allowRewrite))
        return false;
    if (last !== void 0 && first !== last) {
      if (!Bitset.set(bs, last, FULL_MASK << BITS - lastPos % BITS, allowRewrite))
        return false;
    }
    return true;
  }
});
var Path = /* @__PURE__ */ Object.freeze({
  /**
   * Internal method for handling stack of paths (debug, errors, dynamic fields via path)
   * This callback shape forces stack cleanup by construction:
   * `.pop()` always happens after the wrapped function.
   * Also, this makes impossible:
   * - pushing field when stack is empty
   * - pushing field inside of field (real bug)
   * NOTE: we don't want to do '.pop' on error!
   */
  pushObj: (stack, obj, objFn) => {
    const last = { obj };
    stack.push(last);
    objFn((field, fieldFn) => {
      last.field = field;
      fieldFn();
      last.field = void 0;
    });
    stack.pop();
  },
  path: (stack) => {
    const res = [];
    for (const i of stack)
      if (i.field !== void 0)
        res.push(i.field === "" ? '""' : i.field);
    return res.join("/");
  },
  err: (name, stack, msg) => {
    const text = `${name}(${Path.path(stack)}): ${typeof msg === "string" ? msg : msg.message}`;
    const err = msg instanceof TypeError ? new TypeError(text) : msg instanceof RangeError ? new RangeError(text) : new Error(text);
    if (msg instanceof Error && msg.stack) {
      const from = `${msg.name}: ${msg.message}`;
      const to = `${err.name}: ${err.message}`;
      err.stack = msg.stack.startsWith(from) ? `${to}${msg.stack.slice(from.length)}` : msg.stack;
    }
    return err;
  },
  resolve: (stack, path) => {
    const parts = path.split("/");
    const objPath = stack.map((i2) => i2.obj);
    let i = 0;
    for (; i < parts.length; i++) {
      if (parts[i] === "..")
        objPath.pop();
      else
        break;
    }
    let cur = objPath.pop();
    for (; i < parts.length; i++) {
      if (!cur || cur[parts[i]] === void 0)
        return void 0;
      cur = cur[parts[i]];
    }
    return cur;
  }
});
var _Reader = class __Reader {
  pos = 0;
  data;
  opts;
  stack;
  parent;
  parentOffset;
  bitBuf = 0;
  bitPos = 0;
  bs;
  // bitset
  view;
  constructor(data, opts = {}, stack = [], parent = void 0, parentOffset = 0) {
    this.data = data;
    this.opts = opts;
    this.stack = stack;
    this.parent = parent;
    this.parentOffset = parentOffset;
    this.view = createView2(data);
  }
  /** Internal method for pointers. */
  _enablePointers() {
    if (this.parent)
      return this.parent._enablePointers();
    if (this.bs)
      return;
    this.bs = Bitset.create(this.data.length);
    Bitset.setRange(this.bs, this.data.length, 0, this.pos, this.opts.allowMultipleReads);
  }
  markBytesBS(pos, len) {
    if (this.parent)
      return this.parent.markBytesBS(this.parentOffset + pos, len);
    if (!len)
      return true;
    if (!this.bs)
      return true;
    return Bitset.setRange(this.bs, this.data.length, pos, len, false);
  }
  markBytes(len) {
    const pos = this.pos;
    const res = this.markBytesBS(pos, len);
    if (!this.opts.allowMultipleReads && !res)
      throw this.err(`multiple read pos=${pos} len=${len}`);
    this.pos += len;
    return res;
  }
  pushObj(obj, objFn) {
    return Path.pushObj(this.stack, obj, objFn);
  }
  readView(n, fn) {
    if (!isNum(n) || n < 0)
      throw this.err(`readView: wrong length=${n}`);
    if (this.pos + n > this.data.length)
      throw this.err("readView: Unexpected end of buffer");
    const res = fn(this.view, this.pos);
    this.markBytes(n);
    return res;
  }
  // read bytes by absolute offset
  absBytes(n) {
    if (!isNum(n) || n < 0 || n > this.data.length)
      throw new Error("Unexpected end of buffer");
    return this.data.subarray(n);
  }
  finish() {
    if (this.opts.allowUnreadBytes)
      return;
    if (this.bitPos) {
      throw this.err(`${this.bitPos} bits left after unpack: ${hex2.encode(this.data.subarray(this.pos))}`);
    }
    if (this.bs && !this.parent) {
      const notRead = Bitset.indices(this.bs, this.data.length, true);
      if (notRead.length) {
        const formatted = Bitset.range(notRead).map(({ pos, length: length2 }) => `(${pos}/${length2})[${hex2.encode(this.data.subarray(pos, pos + length2))}]`).join(", ");
        throw this.err(`unread byte ranges: ${formatted} (total=${this.data.length})`);
      } else
        return;
    }
    if (!this.isEnd()) {
      throw this.err(`${this.leftBytes} bytes ${this.bitPos} bits left after unpack: ${hex2.encode(this.data.subarray(this.pos))}`);
    }
  }
  // User methods
  err(msg) {
    return Path.err("Reader", this.stack, msg);
  }
  offsetReader(n) {
    if (!isNum(n) || n < 0 || n > this.data.length)
      throw this.err("offsetReader: Unexpected end of buffer");
    return new __Reader(this.absBytes(n), this.opts, this.stack, this, n);
  }
  bytes(n, peek = false) {
    if (this.bitPos)
      throw this.err("readBytes: bitPos not empty");
    if (!isNum(n) || n < 0)
      throw this.err(`readBytes: wrong length=${n}`);
    if (this.pos + n > this.data.length)
      throw this.err("readBytes: Unexpected end of buffer");
    const slice = this.data.subarray(this.pos, this.pos + n);
    if (!peek)
      this.markBytes(n);
    return slice;
  }
  byte(peek = false) {
    if (this.bitPos)
      throw this.err("readByte: bitPos not empty");
    if (this.pos + 1 > this.data.length)
      throw this.err("readByte: Unexpected end of buffer");
    const data = this.data[this.pos];
    if (!peek)
      this.markBytes(1);
    return data;
  }
  get leftBytes() {
    return this.data.length - this.pos;
  }
  get totalBytes() {
    return this.data.length;
  }
  isEnd() {
    return this.pos >= this.data.length && !this.bitPos;
  }
  progress() {
    return this.pos * 8 - this.bitPos;
  }
  // bits are read in BE mode (left to right): (0b1000_0000).readBits(1) == 1
  bits(bits2) {
    if (!isNum(bits2) || bits2 < 0)
      throw this.err(`BitReader: wrong length=${bits2}`);
    if (bits2 > 32)
      throw this.err("BitReader: cannot read more than 32 bits in single call");
    let out = 0;
    while (bits2) {
      if (!this.bitPos) {
        this.bitBuf = this.byte();
        this.bitPos = 8;
      }
      const take = Math.min(bits2, this.bitPos);
      this.bitPos -= take;
      out = out << take | this.bitBuf >> this.bitPos & 2 ** take - 1;
      this.bitBuf &= 2 ** this.bitPos - 1;
      bits2 -= take;
    }
    return out >>> 0;
  }
  find(needle, pos = this.pos) {
    if (!isBytes5(needle))
      throw this.err(`find: needle is not bytes! ${needle}`);
    if (this.bitPos)
      throw this.err("find: bitPos not empty");
    if (!needle.length)
      throw this.err(`find: needle is empty`);
    if (!isNum(pos) || pos < 0)
      throw this.err(`find: wrong pos=${pos}`);
    return findBytes(needle, this.data, pos);
  }
};
var _Writer = class {
  pos = 0;
  stack;
  // We could have a single buffer here and re-alloc it with
  // x1.5-2 size each time it full, but it will be slower:
  // basic/encode bench: 395ns -> 560ns
  buffers = [];
  cleanBuffers = [];
  ptrs = [];
  bitBuf = 0;
  bitPos = 0;
  viewBuf = new Uint8Array(8);
  view;
  finished = false;
  constructor(stack = []) {
    this.stack = stack;
    this.view = createView2(this.viewBuf);
  }
  pushObj(obj, objFn) {
    return Path.pushObj(this.stack, obj, objFn);
  }
  writeView(len, fn) {
    if (this.finished)
      throw this.err("buffer: finished");
    if (!isNum(len) || len < 0 || len > 8)
      throw new Error(`wrong writeView length=${len}`);
    fn(this.view);
    const buf = this.viewBuf.slice(0, len);
    this.bytes(buf);
    this.cleanBuffers.push(buf);
    this.viewBuf.fill(0);
  }
  // User methods
  err(msg) {
    return Path.err("Writer", this.stack, msg);
  }
  bytes(b) {
    if (this.finished)
      throw this.err("buffer: finished");
    if (this.bitPos)
      throw this.err("writeBytes: ends with non-empty bit buffer");
    this.buffers.push(b);
    this.pos += b.length;
  }
  byte(b) {
    if (this.finished)
      throw this.err("buffer: finished");
    if (this.bitPos)
      throw this.err("writeByte: ends with non-empty bit buffer");
    if (!isNum(b) || b < 0 || b > 255)
      throw this.err(`writeByte: wrong value=${b}`);
    const buf = new Uint8Array([b]);
    this.buffers.push(buf);
    this.cleanBuffers.push(buf);
    this.pos++;
  }
  finish(clean2 = true) {
    if (this.finished)
      throw this.err("buffer: finished");
    if (this.bitPos)
      throw this.err("buffer: ends with non-empty bit buffer");
    const buffers = this.buffers.concat(this.ptrs.map((i) => i.buffer));
    const sum = buffers.map((b) => b.length).reduce((a, b) => a + b, 0);
    const buf = new Uint8Array(sum);
    for (let i = 0, pad = 0; i < buffers.length; i++) {
      const a = buffers[i];
      buf.set(a, pad);
      pad += a.length;
    }
    for (let pos = this.pos, i = 0; i < this.ptrs.length; i++) {
      const ptr = this.ptrs[i];
      buf.set(ptr.ptr.encode(pos), ptr.pos);
      pos += ptr.buffer.length;
    }
    if (clean2) {
      for (const b of this.cleanBuffers)
        b.fill(0);
      this.buffers = [];
      this.cleanBuffers = [];
      for (const p of this.ptrs)
        p.buffer.fill(0);
      this.ptrs = [];
      this.finished = true;
      this.bitBuf = 0;
    }
    return buf;
  }
  bits(value, bits2) {
    if (this.finished)
      throw this.err("buffer: finished");
    if (!isNum(bits2) || bits2 < 0)
      throw this.err(`writeBits: wrong length=${bits2}`);
    if (bits2 > 32)
      throw this.err("writeBits: cannot write more than 32 bits in single call");
    if (!isNum(value) || value < 0)
      throw this.err(`writeBits: wrong value=${value}`);
    if (value >= 2 ** bits2)
      throw this.err(`writeBits: value (${value}) >= 2**bits (${bits2})`);
    while (bits2) {
      const take = Math.min(bits2, 8 - this.bitPos);
      this.bitBuf = this.bitBuf << take | value >> bits2 - take;
      this.bitPos += take;
      bits2 -= take;
      value &= 2 ** bits2 - 1;
      if (this.bitPos === 8) {
        this.bitPos = 0;
        const buf = new Uint8Array([this.bitBuf]);
        this.buffers.push(buf);
        this.cleanBuffers.push(buf);
        this.pos++;
      }
    }
  }
};
var swapEndianness = (b) => Uint8Array.from(b).reverse();
function checkBounds(value, bits2, signed) {
  if (signed) {
    if (bits2 <= _0n6)
      throw new Error(`checkBounds: signed bits must be positive, got ${bits2}`);
    const signBit = _2n4 ** (bits2 - _1n5);
    if (value < -signBit || value >= signBit)
      throw new Error(`value out of signed bounds. Expected ${-signBit} <= ${value} < ${signBit}`);
  } else {
    const max = _2n4 ** bits2;
    if (_0n6 > value || value >= max)
      throw new Error(`value out of unsigned bounds. Expected 0 <= ${value} < ${max}`);
  }
}
function _wrap(inner) {
  const _inner = inner;
  return {
    // NOTE: we cannot export validate here, since it is likely mistake.
    // Raw inner throws propagate unchanged; path-aware errors must use w.err/r.err or validate().
    encodeStream: _inner.encodeStream,
    decodeStream: _inner.decodeStream,
    size: _inner.size,
    encode: (value) => {
      const w = new _Writer();
      _inner.encodeStream(w, value);
      return w.finish();
    },
    decode: (data, opts = {}) => {
      const r = new _Reader(data, opts);
      const res = _inner.decodeStream(r);
      r.finish();
      return res;
    }
  };
}
function validate(inner, fn) {
  if (!isCoder(inner))
    throw new TypeError(`validate: invalid inner value ${inner}`);
  if (typeof fn !== "function")
    throw new TypeError("validate: fn should be function");
  return _wrap({
    size: inner.size,
    encodeStream: (w, value) => {
      let res;
      try {
        res = fn(value);
      } catch (e) {
        throw w.err(e);
      }
      inner.encodeStream(w, res);
    },
    decodeStream: (r) => {
      const res = inner.decodeStream(r);
      try {
        return fn(res);
      } catch (e) {
        throw r.err(e);
      }
    }
  });
}
var wrap = (inner) => {
  const _inner = inner;
  if (!isPlainObject(_inner))
    throw new TypeError(`wrap: invalid inner value ${_inner}`);
  if (typeof _inner.encodeStream !== "function")
    throw new TypeError("wrap: encodeStream should be function");
  if (typeof _inner.decodeStream !== "function")
    throw new TypeError("wrap: decodeStream should be function");
  if (_inner.size !== void 0 && (!isNum(_inner.size) || _inner.size < 0))
    throw new TypeError(`wrap: invalid size ${_inner.size}`);
  if (_inner.validate !== void 0 && typeof _inner.validate !== "function")
    throw new TypeError("wrap: validate should be function");
  const res = _wrap(_inner);
  return _inner.validate !== void 0 ? validate(res, _inner.validate) : res;
};
var isBaseCoder = (elm) => isPlainObject(elm) && typeof elm.decode === "function" && typeof elm.encode === "function";
function isCoder(elm) {
  return isPlainObject(elm) && isBaseCoder(elm) && typeof elm.encodeStream === "function" && typeof elm.decodeStream === "function" && (elm.size === void 0 || isNum(elm.size) && elm.size >= 0);
}
function dict() {
  return {
    encode: (from) => {
      if (!Array.isArray(from))
        throw new Error("array expected");
      const to = {};
      const seen = /* @__PURE__ */ new Set();
      for (const item of from) {
        if (!Array.isArray(item) || item.length !== 2)
          throw new Error(`array of two elements expected`);
        const name = item[0];
        const value = item[1];
        validateFieldName(name, "dict: key");
        if (seen.has(name))
          throw new Error(`key(${name}) appears twice in struct`);
        seen.add(name);
        to[name] = value;
      }
      return to;
    },
    decode: (to) => {
      if (!isPlainObject(to))
        throw new Error(`expected plain object, got ${to}`);
      for (const name in to)
        validateFieldName(name, "dict: key");
      return Object.entries(to);
    }
  };
}
var numberBigint = /* @__PURE__ */ Object.freeze({
  encode: (from) => {
    if (typeof from !== "bigint")
      throw new Error(`expected bigint, got ${typeof from}`);
    if (from > BigInt(Number.MAX_SAFE_INTEGER))
      throw new Error(`element bigger than MAX_SAFE_INTEGER=${from}`);
    if (from < BigInt(Number.MIN_SAFE_INTEGER))
      throw new Error(`element smaller than MIN_SAFE_INTEGER=${from}`);
    return Number(from);
  },
  decode: (to) => {
    if (!isNum(to))
      throw new Error("element is not a safe integer");
    return BigInt(to);
  }
});
function tsEnum(e) {
  if (!isPlainObject(e))
    throw new Error("plain object expected");
  return {
    encode: (from) => {
      if (!isNum(from) || !(from in e))
        throw new Error(`wrong value ${from}`);
      return e[from];
    },
    decode: (to) => {
      if (typeof to !== "string")
        throw new Error(`wrong value ${typeof to}`);
      const value = e[to];
      if (!hasOwn(e, to) || !isNum(value))
        throw new Error(`wrong value ${to}`);
      return value;
    }
  };
}
function decimal(precision, round = false) {
  if (!isNum(precision) || precision < 0)
    throw new Error(`decimal/precision: wrong value ${precision}`);
  if (typeof round !== "boolean")
    throw new Error(`decimal/round: expected boolean, got ${typeof round}`);
  const decimalMask = _10n ** BigInt(precision);
  return {
    encode: (from) => {
      if (typeof from !== "bigint")
        throw new Error(`expected bigint, got ${typeof from}`);
      let s = (from < _0n6 ? -from : from).toString(10);
      let sep = s.length - precision;
      if (sep < 0) {
        s = s.padStart(s.length - sep, "0");
        sep = 0;
      }
      let i = s.length - 1;
      for (; i >= sep && s[i] === "0"; i--)
        ;
      let int = s.slice(0, sep);
      let frac = s.slice(sep, i + 1);
      if (!int)
        int = "0";
      if (from < _0n6)
        int = "-" + int;
      if (!frac)
        return int;
      return `${int}.${frac}`;
    },
    decode: (to) => {
      if (typeof to !== "string")
        throw new Error(`expected string, got ${typeof to}`);
      let neg = false;
      if (to.startsWith("-")) {
        neg = true;
        to = to.slice(1);
      }
      if (!/^(0|[1-9]\d*)(\.\d+)?$/.test(to))
        throw new Error(`wrong string value=${to}`);
      let sep = to.indexOf(".");
      sep = sep === -1 ? to.length : sep;
      const intS = to.slice(0, sep);
      const fracS = to.slice(sep + 1).replace(/0+$/, "");
      const int = BigInt(intS) * decimalMask;
      if (!round && fracS.length > precision) {
        throw new Error(`fractional part cannot be represented with this precision (num=${to}, prec=${precision})`);
      }
      const fracLen = Math.min(fracS.length, precision);
      const frac = BigInt(fracS.slice(0, fracLen)) * _10n ** BigInt(precision - fracLen);
      const value = int + frac;
      if (neg && value === _0n6)
        throw new Error(`negative zero is not allowed`);
      return neg ? -value : value;
    }
  };
}
function match(lst) {
  if (!Array.isArray(lst))
    throw new Error(`expected array, got ${typeof lst}`);
  for (const i of lst)
    if (!isBaseCoder(i))
      throw new Error(`wrong base coder ${i}`);
  return {
    encode: (from) => {
      for (const c of lst) {
        let elm;
        try {
          elm = c.encode(from);
        } catch {
          continue;
        }
        if (elm !== void 0)
          return elm;
      }
      throw new Error(`match/encode: cannot find match in ${from}`);
    },
    decode: (to) => {
      for (const c of lst) {
        let elm;
        try {
          elm = c.decode(to);
        } catch {
          continue;
        }
        if (elm !== void 0)
          return elm;
      }
      throw new Error(`match/decode: cannot find match in ${to}`);
    }
  };
}
var reverse = (coder) => {
  if (!isBaseCoder(coder))
    throw new Error("BaseCoder expected");
  return { encode: (to) => coder.decode(to), decode: (from) => coder.encode(from) };
};
var coders = /* @__PURE__ */ Object.freeze({ dict, numberBigint, tsEnum, decimal, match, reverse });
var bits = (len) => {
  if (!isNum(len) || len < 0 || len > 32)
    throw new Error(`bits: wrong length ${len} (${typeof len})`);
  return wrap({
    encodeStream: (w, value) => w.bits(value, len),
    decodeStream: (r) => r.bits(len),
    validate: (value) => {
      if (!isNum(value))
        throw new Error(`bits: wrong value ${value}`);
      return value;
    }
  });
};
var bigint = (size, le = false, signed = false, sized = true) => {
  if (!isNum(size) || size <= 0)
    throw new Error(`bigint/size: wrong value ${size}`);
  if (typeof le !== "boolean")
    throw new Error(`bigint/le: expected boolean, got ${typeof le}`);
  if (typeof signed !== "boolean")
    throw new Error(`bigint/signed: expected boolean, got ${typeof signed}`);
  if (typeof sized !== "boolean")
    throw new Error(`bigint/sized: expected boolean, got ${typeof sized}`);
  const bLen = BigInt(size);
  const signBit = _2n4 ** (_8n2 * bLen - _1n5);
  return wrap({
    size: sized ? size : void 0,
    encodeStream: (w, value) => {
      const zero = value === _0n6;
      if (signed && value < 0)
        value = value | signBit;
      const b = [];
      for (let i = 0; i < size; i++) {
        b.push(Number(value & _255n));
        value >>= _8n2;
      }
      let res = new Uint8Array(b).reverse();
      if (!sized) {
        let pos = 0;
        if (signed) {
          for (; pos < res.length - 1; pos++) {
            const next = res[pos + 1];
            if (res[pos] === 0 && (next & 128) === 0)
              continue;
            if (res[pos] === 255 && (next & 128) !== 0)
              continue;
            break;
          }
          res = zero ? res.subarray(res.length) : res.subarray(pos);
        } else {
          for (; pos < res.length; pos++)
            if (res[pos] !== 0)
              break;
          res = res.subarray(pos);
        }
      }
      w.bytes(le ? res.reverse() : res);
    },
    decodeStream: (r) => {
      const value = r.bytes(sized ? size : Math.min(size, r.leftBytes));
      const b = le ? value : swapEndianness(value);
      let res = _0n6;
      for (let i = 0; i < b.length; i++)
        res |= BigInt(b[i]) << _8n2 * BigInt(i);
      const sBit = sized || !value.length ? signBit : _2n4 ** (_8n2 * BigInt(value.length) - _1n5);
      if (signed && res & sBit)
        res = (res ^ sBit) - sBit;
      return res;
    },
    validate: (value) => {
      if (typeof value !== "bigint")
        throw new Error(`bigint: invalid value: ${value}`);
      checkBounds(value, _8n2 * bLen, !!signed);
      return value;
    }
  });
};
var U256BE = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ bigint(32, false)
);
var U64LE = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ bigint(8, true)
);
var U64BE = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ bigint(8, false)
);
var I64LE = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ bigint(8, true, true)
);
var view = (len, opts) => wrap({
  size: len,
  encodeStream: (w, value) => w.writeView(len, (view2) => opts.write(view2, value)),
  decodeStream: (r) => r.readView(len, opts.read),
  validate: (value) => {
    if (typeof value !== "number")
      throw new TypeError(`viewCoder: expected number, got ${typeof value}`);
    if (opts.validate)
      opts.validate(value);
    return value;
  }
});
var intView = (len, signed, opts) => {
  const bits2 = len * 8;
  const signBit = 2 ** (bits2 - 1);
  const validateSigned = (value) => {
    if (!isNum(value))
      throw new TypeError(`sintView: value is not safe integer: ${value}`);
    if (value < -signBit || value >= signBit) {
      throw new RangeError(`sintView: value out of bounds. Expected ${-signBit} <= ${value} < ${signBit}`);
    }
  };
  const maxVal = 2 ** bits2;
  const validateUnsigned = (value) => {
    if (!isNum(value))
      throw new TypeError(`uintView: value is not safe integer: ${value}`);
    if (0 > value || value >= maxVal) {
      throw new RangeError(`uintView: value out of bounds. Expected 0 <= ${value} < ${maxVal}`);
    }
  };
  return view(len, {
    write: opts.write,
    read: opts.read,
    validate: signed ? validateSigned : validateUnsigned
  });
};
var U32LE = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ intView(4, false, {
    read: (view2, pos) => view2.getUint32(pos, true),
    write: (view2, value) => view2.setUint32(0, value, true)
  })
);
var U32BE = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ intView(4, false, {
    read: (view2, pos) => view2.getUint32(pos, false),
    write: (view2, value) => view2.setUint32(0, value, false)
  })
);
var I32LE = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ intView(4, true, {
    read: (view2, pos) => view2.getInt32(pos, true),
    write: (view2, value) => view2.setInt32(0, value, true)
  })
);
var U16LE = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ intView(2, false, {
    read: (view2, pos) => view2.getUint16(pos, true),
    write: (view2, value) => view2.setUint16(0, value, true)
  })
);
var U16BE = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ intView(2, false, {
    read: (view2, pos) => view2.getUint16(pos, false),
    write: (view2, value) => view2.setUint16(0, value, false)
  })
);
var U8 = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ intView(1, false, {
    read: (view2, pos) => view2.getUint8(pos),
    write: (view2, value) => view2.setUint8(0, value)
  })
);
var f32 = (le) => view(4, {
  read: (view2, pos) => view2.getFloat32(pos, le),
  write: (view2, value) => view2.setFloat32(0, value, le),
  validate: (value) => {
    if (Math.fround(value) !== value && !Number.isNaN(value))
      throw new Error(`f32: wrong value=${value}`);
  }
});
var f64 = (le) => view(8, {
  read: (view2, pos) => view2.getFloat64(pos, le),
  write: (view2, value) => view2.setFloat64(0, value, le)
});
var F32BE = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ f32(false));
var F64BE = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ f64(false));
var createBytes = (len, le = false) => {
  if (typeof le !== "boolean")
    throw new TypeError(`bytes/le: expected boolean, got ${typeof le}`);
  const _length = lengthCoder(len);
  const _isb = isBytes5(len);
  const terminator = _isb ? Uint8Array.from(len) : void 0;
  const findTerminator = terminator && terminator.length ? createFindBytes(terminator) : void 0;
  return wrap({
    size: typeof len === "number" ? len : void 0,
    encodeStream: (w, value) => {
      if (!_isb)
        _length.encodeStream(w, value.length);
      w.bytes(le ? swapEndianness(value) : value);
      if (terminator)
        w.bytes(terminator);
    },
    decodeStream: (r) => {
      let bytes;
      if (terminator) {
        const tPos = r.find(terminator);
        if (tPos === void 0)
          throw r.err(`bytes: cannot find terminator`);
        bytes = r.bytes(tPos - r.pos);
        r.bytes(terminator.length);
      } else {
        bytes = r.bytes(len === null ? r.leftBytes : _length.decodeStream(r));
      }
      return le ? swapEndianness(bytes) : bytes;
    },
    validate: (value) => {
      if (!isBytes5(value))
        throw new TypeError(`bytes: invalid value ${value}`);
      if (findTerminator) {
        const data = le ? swapEndianness(value) : value;
        if (findTerminator(data) !== void 0)
          throw new Error("bytes: value contains terminator");
      }
      return value;
    }
  });
};
function prefix(len, inner) {
  if (!isCoder(inner))
    throw new Error(`prefix: invalid inner value ${inner}`);
  return apply(createBytes(len), reverse(inner));
}
var string = (len, le = false) => validate(apply(createBytes(len, le), utf82), (value) => {
  if (typeof value !== "string")
    throw new Error(`expected string, got ${typeof value}`);
  return value;
});
function apply(inner, base) {
  if (!isCoder(inner))
    throw new TypeError(`apply: invalid inner value ${inner}`);
  if (!isBaseCoder(base))
    throw new TypeError(`apply: invalid base value ${base}`);
  return wrap({
    size: inner.size,
    encodeStream: (w, value) => {
      let innerValue;
      try {
        innerValue = base.decode(value);
      } catch (e) {
        throw w.err("" + e);
      }
      return inner.encodeStream(w, innerValue);
    },
    decodeStream: (r) => {
      const innerValue = inner.decodeStream(r);
      try {
        return base.encode(innerValue);
      } catch (e) {
        throw r.err("" + e);
      }
    }
  });
}
function lazy(fn) {
  if (typeof fn !== "function")
    throw new TypeError(`lazy: expected function, got ${typeof fn}`);
  return wrap({
    encodeStream: (w, value) => fn().encodeStream(w, value),
    decodeStream: (r) => fn().decodeStream(r)
  });
}
var flag = (flagValue, xor = false) => {
  if (!isBytes5(flagValue))
    throw new TypeError(`flag/flagValue: expected Uint8Array, got ${typeof flagValue}`);
  if (flagValue.length === 0)
    throw new Error("flag/flagValue: empty marker");
  if (typeof xor !== "boolean")
    throw new TypeError(`flag/xor: expected boolean, got ${typeof xor}`);
  return wrap({
    // Marker flags encode one state as empty, so encoded length depends on the boolean value.
    size: void 0,
    encodeStream: (w, value) => {
      if (!!value !== xor)
        w.bytes(flagValue);
    },
    decodeStream: (r) => {
      let hasFlag = r.leftBytes >= flagValue.length;
      if (hasFlag) {
        hasFlag = equalBytes(r.bytes(flagValue.length, true), flagValue);
        if (hasFlag)
          r.bytes(flagValue.length);
      }
      return hasFlag !== xor;
    },
    validate: (value) => {
      if (value !== void 0 && typeof value !== "boolean")
        throw new Error(`flag: expected boolean value or undefined, got ${typeof value}`);
      return value;
    }
  });
};
function flagged(path, inner, def2) {
  if (typeof path !== "string" && !isCoder(path))
    throw new TypeError(`flagged: wrong path=${path}`);
  if (!isCoder(inner))
    throw new TypeError(`flagged: invalid inner value ${inner}`);
  const hasDef = def2 !== void 0;
  return wrap({
    encodeStream: (w, value) => {
      if (typeof path === "string") {
        if (Path.resolve(w.stack, path))
          inner.encodeStream(w, value);
        else if (hasDef)
          inner.encodeStream(w, def2);
      } else {
        const present = value !== void 0;
        path.encodeStream(w, present);
        if (present)
          inner.encodeStream(w, value);
        else if (hasDef)
          inner.encodeStream(w, def2);
      }
    },
    decodeStream: (r) => {
      let hasFlag = false;
      if (typeof path === "string")
        hasFlag = !!Path.resolve(r.stack, path);
      else
        hasFlag = path.decodeStream(r);
      if (hasFlag)
        return inner.decodeStream(r);
      else if (hasDef)
        inner.decodeStream(r);
      return;
    }
  });
}
function magic(inner, constant, check2 = true) {
  if (!isCoder(inner))
    throw new TypeError(`magic: invalid inner value ${inner}`);
  if (typeof check2 !== "boolean")
    throw new TypeError(`magic: expected boolean, got ${typeof check2}`);
  return wrap({
    size: inner.size,
    encodeStream: (w, _value) => inner.encodeStream(w, constant),
    decodeStream: (r) => {
      const value = inner.decodeStream(r);
      const valueObj = value !== null && typeof value === "object" && !isBytes5(value);
      const constantObj = constant !== null && typeof constant === "object" && !isBytes5(constant);
      const canCompare = !valueObj || !constantObj;
      if (check2 && canCompare && !equal(value, constant)) {
        throw r.err(`magic: invalid value: ${value} !== ${constant}`);
      }
      return;
    },
    validate: (value) => {
      if (value !== void 0)
        throw new Error(`magic: wrong value=${typeof value}`);
      return value;
    }
  });
}
function sizeof(fields) {
  let size = 0;
  for (const f of fields) {
    if (f.size === void 0)
      return;
    if (!isNum(f.size))
      throw new Error(`sizeof: wrong element size=${size}`);
    size += f.size;
  }
  return size;
}
function struct(fields) {
  if (!isPlainObject(fields))
    throw new TypeError(`struct: expected plain object, got ${fields}`);
  const coders2 = [];
  for (const name in fields) {
    validateFieldName(name, "struct: field");
    if (!isCoder(fields[name]))
      throw new TypeError(`struct: field ${name} is not CoderType`);
    coders2.push(fields[name]);
  }
  return wrap({
    size: sizeof(coders2),
    encodeStream: (w, value) => {
      w.pushObj(value, (fieldFn) => {
        for (const name in fields)
          fieldFn(name, () => fields[name].encodeStream(w, value[name]));
      });
    },
    decodeStream: (r) => {
      const res = {};
      r.pushObj(res, (fieldFn) => {
        for (const name in fields)
          fieldFn(name, () => res[name] = fields[name].decodeStream(r));
      });
      return res;
    },
    validate: (value) => {
      if (typeof value !== "object" || value === null)
        throw new Error(`struct: invalid value ${value}`);
      return value;
    }
  });
}
function tuple(fields) {
  if (!Array.isArray(fields))
    throw new TypeError(`Packed.Tuple: got ${typeof fields} instead of array`);
  for (let i = 0; i < fields.length; i++) {
    if (!isCoder(fields[i]))
      throw new TypeError(`tuple: field ${i} is not CoderType`);
  }
  return wrap({
    size: sizeof(fields),
    encodeStream: (w, value) => {
      if (!Array.isArray(value))
        throw w.err(`tuple: invalid value ${value}`);
      w.pushObj(value, (fieldFn) => {
        for (let i = 0; i < fields.length; i++)
          fieldFn(`${i}`, () => fields[i].encodeStream(w, value[i]));
      });
    },
    decodeStream: (r) => {
      const res = [];
      r.pushObj(res, (fieldFn) => {
        for (let i = 0; i < fields.length; i++)
          fieldFn(`${i}`, () => res.push(fields[i].decodeStream(r)));
      });
      return res;
    },
    validate: (value) => {
      if (!Array.isArray(value))
        throw new Error(`tuple: invalid value ${value}`);
      if (value.length !== fields.length)
        throw new Error(`tuple: wrong length=${value.length}, expected ${fields.length}`);
      return value;
    }
  });
}
function array(len, inner) {
  if (!isCoder(inner))
    throw new TypeError(`array: invalid inner value ${inner}`);
  const _length = lengthCoder(typeof len === "string" ? `../${len}` : len);
  if (len === null && inner.size === 0)
    throw new Error("array: null length cannot use zero-size inner");
  return wrap({
    // `size: 0` is a valid fixed-size hint and must compose through arrays/tuples/structs.
    size: typeof len === "number" && inner.size !== void 0 ? len * inner.size : void 0,
    encodeStream: (w, value) => {
      const _w = w;
      _w.pushObj(value, (fieldFn) => {
        if (!isBytes5(len))
          _length.encodeStream(w, value.length);
        for (let i = 0; i < value.length; i++) {
          fieldFn(`${i}`, () => {
            const elm = value[i];
            const startPos = w.pos;
            inner.encodeStream(w, elm);
            if (isBytes5(len)) {
              if (len.length > _w.pos - startPos)
                return;
              const data = _w.finish(false).subarray(startPos, _w.pos);
              if (equalBytes(data.subarray(0, len.length), len))
                throw _w.err(`array: inner element encoding same as separator. elm=${elm} data=${data}`);
            }
          });
        }
      });
      if (isBytes5(len))
        w.bytes(len);
    },
    decodeStream: (r) => {
      const res = [];
      const _r = r;
      _r.pushObj(res, (fieldFn) => {
        if (len === null) {
          for (let i = 0; !r.isEnd(); i++) {
            fieldFn(`${i}`, () => {
              const progress = _r.progress();
              res.push(inner.decodeStream(r));
              if (_r.progress() === progress)
                throw r.err("array: inner decoder did not consume input");
            });
            if (inner.size && r.leftBytes < inner.size)
              break;
          }
        } else if (isBytes5(len)) {
          for (let i = 0; ; i++) {
            if (equalBytes(r.bytes(len.length, true), len)) {
              r.bytes(len.length);
              break;
            }
            fieldFn(`${i}`, () => {
              const progress = _r.progress();
              res.push(inner.decodeStream(r));
              if (_r.progress() === progress)
                throw r.err("array: inner decoder did not consume input");
            });
          }
        } else {
          let length2;
          fieldFn("arrayLen", () => length2 = _length.decodeStream(r));
          for (let i = 0; i < length2; i++)
            fieldFn(`${i}`, () => res.push(inner.decodeStream(r)));
        }
      });
      return res;
    },
    validate: (value) => {
      if (!Array.isArray(value))
        throw new Error(`array: invalid value ${value}`);
      return value;
    }
  });
}
function map(inner, variants) {
  if (!isCoder(inner))
    throw new TypeError(`map: invalid inner value ${inner}`);
  if (!isPlainObject(variants))
    throw new TypeError(`map: variants should be plain object`);
  const variantValues = /* @__PURE__ */ new Map();
  const variantNames = /* @__PURE__ */ new Map();
  const primitiveTypes = ["string", "number", "bigint", "boolean", "undefined", "null"];
  for (const k in variants) {
    const value = variants[k];
    if (!primitiveTypes.includes(value === null ? "null" : typeof value))
      throw new TypeError(`map: variant ${k} should be primitive`);
    if (variantNames.has(value))
      throw new Error(`map: duplicate value for ${k} and ${variantNames.get(value)}`);
    variantValues.set(k, value);
    variantNames.set(value, k);
  }
  return wrap({
    size: inner.size,
    encodeStream: (w, value) => {
      if (!variantValues.has(value))
        throw w.err(`Map: unknown variant: ${value}`);
      inner.encodeStream(w, variantValues.get(value));
    },
    decodeStream: (r) => {
      const variant2 = inner.decodeStream(r);
      const name = variantNames.get(variant2);
      if (name === void 0)
        throw r.err(`Enum: unknown value: ${variant2} ${Array.from(variantNames.keys())}`);
      return name;
    },
    validate: (value) => {
      if (typeof value !== "string")
        throw new Error(`map: invalid value ${value}`);
      if (!variantValues.has(value))
        throw new Error(`Map: unknown variant: ${value}`);
      return value;
    }
  });
}
function tag(tag2, variants) {
  if (!isCoder(tag2))
    throw new TypeError(`tag: invalid tag value ${tag2}`);
  if (!isPlainObject(variants))
    throw new TypeError(`tag: variants should be plain object`);
  const variantCoders = /* @__PURE__ */ new Map();
  for (const name in variants) {
    if (!isCoder(variants[name]))
      throw new TypeError(`tag: variant ${name} is not CoderType`);
    variantCoders.set(name, variants[name]);
    const num2 = Number(name);
    if (isNum(num2) && String(num2) === name)
      variantCoders.set(num2, variants[name]);
  }
  let size;
  let dataSize;
  let dynamic = tag2.size === void 0;
  for (const name in variants) {
    const cur = variants[name].size;
    if (cur === void 0 || dataSize !== void 0 && cur !== dataSize)
      dynamic = true;
    dataSize = cur;
  }
  if (!dynamic && dataSize !== void 0)
    size = tag2.size + dataSize;
  return wrap({
    size,
    encodeStream: (w, value) => {
      const { TAG, data } = value;
      const dataType = variantCoders.get(TAG);
      if (!dataType)
        throw w.err(`Tag: invalid tag ${TAG.toString()}`);
      tag2.encodeStream(w, TAG);
      dataType.encodeStream(w, data);
    },
    decodeStream: (r) => {
      const TAG = tag2.decodeStream(r);
      const dataType = variantCoders.get(TAG);
      if (!dataType)
        throw r.err(`Tag: invalid tag ${TAG}`);
      return { TAG, data: dataType.decodeStream(r) };
    },
    validate: (value) => {
      const { TAG } = value;
      const dataType = variantCoders.get(TAG);
      if (!dataType)
        throw new Error(`Tag: invalid tag ${TAG.toString()}`);
      return value;
    }
  });
}
function mappedTag(tagCoder, variants) {
  if (!isCoder(tagCoder))
    throw new TypeError(`mappedTag: invalid tag value ${tagCoder}`);
  if (!isPlainObject(variants))
    throw new TypeError(`mappedTag: variants should be plain object`);
  const mapValue = /* @__PURE__ */ new Map();
  const tagValue = /* @__PURE__ */ new Map();
  for (const key in variants) {
    const v = variants[key];
    mapValue.set(key, v[0]);
    tagValue.set(key, v[1]);
  }
  const mapped = Object.fromEntries(mapValue);
  const tagged = Object.fromEntries(tagValue);
  return tag(map(tagCoder, mapped), tagged);
}

// node_modules/@scure/btc-signer/utils.js
var Point = /* @__PURE__ */ (() => secp256k1.Point)();
var Fn = /* @__PURE__ */ (() => Point.Fn)();
var CURVE_ORDER = /* @__PURE__ */ (() => Point.Fn.ORDER)();
var hasEven2 = (y) => y % 2n === 0n;
var isBytes6 = /* @__PURE__ */ (() => utils.isBytes)();
var concatBytes4 = /* @__PURE__ */ (() => utils.concatBytes)();
var equalBytes2 = /* @__PURE__ */ (() => utils.equalBytes)();
var sha2562 = /* @__PURE__ */ (() => sha256)();
var hash160 = (msg) => ripemd160(sha2562(msg));
var sha256x2 = (...msgs) => sha2562(sha2562(concatBytes4(...msgs)));
var randomPrivateKeyBytes = () => schnorr.utils.randomSecretKey();
var pubSchnorr = (priv) => schnorr.getPublicKey(priv);
var pubECDSA = (privateKey, isCompressed) => secp256k1.getPublicKey(privateKey, isCompressed);
var hasLowR = (sig) => sig.r < CURVE_ORDER / 2n;
function signECDSA(hash, privateKey, lowR = false) {
  abytes3(hash, 32, "hash");
  let sig = secp256k1.Signature.fromBytes(secp256k1.sign(hash, privateKey, { prehash: false }));
  if (lowR && !hasLowR(sig)) {
    const extraEntropy = new Uint8Array(32);
    let counter = 0;
    while (!hasLowR(sig)) {
      extraEntropy.set(U32LE.encode(counter++));
      sig = secp256k1.Signature.fromBytes(secp256k1.sign(hash, privateKey, { prehash: false, extraEntropy }));
      if (counter > 4294967295)
        throw new Error("lowR counter overflow: report the error");
    }
  }
  return sig.toBytes("der");
}
var signSchnorr = (message, secretKey, auxRand) => schnorr.sign(message, secretKey, auxRand);
var tagSchnorr = (tag2, ...messages) => schnorr.utils.taggedHash(tag2, ...messages);
var PubT = /* @__PURE__ */ (() => Object.freeze({
  ecdsa: 0,
  schnorr: 1
}))();
function validatePubkey(pub, type) {
  const len = pub.length;
  if (type === PubT.ecdsa) {
    if (len === 32)
      throw new RangeError("Expected non-Schnorr key");
    Point.fromBytes(pub);
    return pub;
  } else if (type === PubT.schnorr) {
    if (len !== 32)
      throw new RangeError("Expected 32-byte Schnorr key");
    schnorr.utils.lift_x(bytesToNumberBE(pub));
    return pub;
  } else {
    throw new TypeError("Unknown key type");
  }
}
function tapTweak(a, b) {
  const u = schnorr.utils;
  const t = u.taggedHash("TapTweak", a, b);
  const tn = bytesToNumberBE(t);
  if (tn >= CURVE_ORDER)
    throw new Error("tweak higher than curve order");
  return tn;
}
function taprootTweakPrivKey(privKey, merkleRoot = Uint8Array.of()) {
  const u = schnorr.utils;
  abytes3(privKey, 32, "privKey");
  const seckey0 = bytesToNumberBE(privKey);
  const P = Point.BASE.multiply(seckey0);
  const seckey = hasEven2(P.y) ? seckey0 : Fn.neg(seckey0);
  const xP = u.pointToBytes(P);
  const t = tapTweak(xP, merkleRoot);
  return numberToBytesBE(Fn.add(seckey, t), 32);
}
function taprootTweakPubkey(pubKey, h) {
  const u = schnorr.utils;
  abytes3(pubKey, 32, "pubKey");
  const t = tapTweak(pubKey, h);
  const P = u.lift_x(bytesToNumberBE(pubKey));
  const Q = P.add(Point.BASE.multiply(t));
  const parity = hasEven2(Q.y) ? 0 : 1;
  return [u.pointToBytes(Q), parity];
}
var TAPROOT_UNSPENDABLE_KEY = /* @__PURE__ */ (() => sha2562(Point.BASE.toBytes(false)))();
var NETWORK = /* @__PURE__ */ Object.freeze({
  bech32: "bc",
  pubKeyHash: 0,
  scriptHash: 5,
  wif: 128
});
var TEST_NETWORK = /* @__PURE__ */ Object.freeze({
  bech32: "tb",
  pubKeyHash: 111,
  scriptHash: 196,
  wif: 239
});
function compareBytes(a, b) {
  if (!isBytes6(a) || !isBytes6(b))
    throw new TypeError(`cmp: wrong type a=${typeof a} b=${typeof b}`);
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++)
    if (a[i] != b[i])
      return Math.sign(a[i] - b[i]);
  return Math.sign(a.length - b.length);
}
function reverseObject(obj) {
  const res = /* @__PURE__ */ Object.create(null);
  for (const k in obj) {
    if (res[obj[k]] !== void 0)
      throw new Error("duplicate key");
    res[obj[k]] = k;
  }
  return res;
}

// node_modules/@scure/btc-signer/node_modules/@scure/base/index.js
function isBytes7(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
}
function abytes5(b) {
  if (!isBytes7(b))
    throw new TypeError("Uint8Array expected");
}
function isArrayOf2(isString2, arr) {
  if (!Array.isArray(arr))
    return false;
  if (arr.length === 0)
    return true;
  if (isString2) {
    return arr.every((item) => typeof item === "string");
  } else {
    return arr.every((item) => Number.isSafeInteger(item));
  }
}
function afn3(input) {
  if (typeof input !== "function")
    throw new TypeError("function expected");
  return true;
}
function astr3(label, input) {
  if (typeof input !== "string")
    throw new TypeError(`${label}: string expected`);
  return true;
}
function anumber5(n) {
  if (typeof n !== "number")
    throw new TypeError(`number expected, got ${typeof n}`);
  if (!Number.isSafeInteger(n))
    throw new RangeError(`invalid integer: ${n}`);
}
function aArr2(input) {
  if (!Array.isArray(input))
    throw new TypeError("array expected");
}
function astrArr2(label, input) {
  if (!isArrayOf2(true, input))
    throw new TypeError(`${label}: array of strings expected`);
}
function anumArr2(label, input) {
  if (!isArrayOf2(false, input))
    throw new TypeError(`${label}: array of numbers expected`);
}
// @__NO_SIDE_EFFECTS__
function chain3(...args) {
  const id = (a) => a;
  const wrap2 = (a, b) => (c) => a(b(c));
  const encode3 = args.map((x) => x.encode).reduceRight(wrap2, id);
  const decode = args.map((x) => x.decode).reduce(wrap2, id);
  return { encode: encode3, decode };
}
// @__NO_SIDE_EFFECTS__
function alphabet3(letters) {
  const lettersA = typeof letters === "string" ? letters.split("") : letters;
  const len = lettersA.length;
  astrArr2("alphabet", lettersA);
  const indexes = new Map(lettersA.map((l, i) => [l, i]));
  return {
    encode: (digits) => {
      aArr2(digits);
      return digits.map((i) => {
        if (!Number.isSafeInteger(i) || i < 0 || i >= len)
          throw new Error(`alphabet.encode: digit index outside alphabet "${i}". Allowed: ${letters}`);
        return lettersA[i];
      });
    },
    decode: (input) => {
      aArr2(input);
      return input.map((letter) => {
        astr3("alphabet.decode", letter);
        const i = indexes.get(letter);
        if (i === void 0)
          throw new Error(`Unknown letter: "${letter}". Allowed: ${letters}`);
        return i;
      });
    }
  };
}
// @__NO_SIDE_EFFECTS__
function join2(separator = "") {
  astr3("join", separator);
  return {
    encode: (from) => {
      astrArr2("join.decode", from);
      return from.join(separator);
    },
    decode: (to) => {
      astr3("join.decode", to);
      return to.split(separator);
    }
  };
}
// @__NO_SIDE_EFFECTS__
function normalize3(fn) {
  afn3(fn);
  return { encode: (from) => from, decode: (to) => fn(to) };
}
function convertRadix(data, from, to) {
  if (from < 2)
    throw new RangeError(`convertRadix: invalid from=${from}, base cannot be less than 2`);
  if (to < 2)
    throw new RangeError(`convertRadix: invalid to=${to}, base cannot be less than 2`);
  aArr2(data);
  if (!data.length)
    return [];
  let pos = 0;
  const res = [];
  const digits = Array.from(data, (d) => {
    anumber5(d);
    if (d < 0 || d >= from)
      throw new Error(`invalid integer: ${d}`);
    return d;
  });
  const dlen = digits.length;
  while (true) {
    let carry = 0;
    let done = true;
    for (let i = pos; i < dlen; i++) {
      const digit = digits[i];
      const fromCarry = from * carry;
      const digitBase = fromCarry + digit;
      if (!Number.isSafeInteger(digitBase) || fromCarry / from !== carry || digitBase - digit !== fromCarry) {
        throw new Error("convertRadix: carry overflow");
      }
      const div = digitBase / to;
      carry = digitBase % to;
      const rounded = Math.floor(div);
      digits[i] = rounded;
      if (!Number.isSafeInteger(rounded) || rounded * to + carry !== digitBase)
        throw new Error("convertRadix: carry overflow");
      if (!done)
        continue;
      else if (!rounded)
        pos = i;
      else
        done = false;
    }
    res.push(carry);
    if (done)
      break;
  }
  for (let i = 0; i < data.length - 1 && data[i] === 0; i++)
    res.push(0);
  return res.reverse();
}
var gcd2 = (a, b) => b === 0 ? a : gcd2(b, a % b);
var radix2carry2 = /* @__NO_SIDE_EFFECTS__ */ (from, to) => from + (to - gcd2(from, to));
var powers3 = /* @__PURE__ */ (() => {
  let res = [];
  for (let i = 0; i < 40; i++)
    res.push(2 ** i);
  return res;
})();
function convertRadix22(data, from, to, padding) {
  aArr2(data);
  if (from <= 0 || from > 32)
    throw new RangeError(`convertRadix2: wrong from=${from}`);
  if (to <= 0 || to > 32)
    throw new RangeError(`convertRadix2: wrong to=${to}`);
  if (/* @__PURE__ */ radix2carry2(from, to) > 32) {
    throw new Error(`convertRadix2: carry overflow from=${from} to=${to} carryBits=${/* @__PURE__ */ radix2carry2(from, to)}`);
  }
  let carry = 0;
  let pos = 0;
  const max = powers3[from];
  const mask = powers3[to] - 1;
  const res = [];
  for (const n of data) {
    anumber5(n);
    if (n >= max)
      throw new Error(`convertRadix2: invalid data word=${n} from=${from}`);
    carry = carry << from | n;
    if (pos + from > 32)
      throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from}`);
    pos += from;
    for (; pos >= to; pos -= to)
      res.push((carry >> pos - to & mask) >>> 0);
    const pow = powers3[pos];
    if (pow === void 0)
      throw new Error("invalid carry");
    carry &= pow - 1;
  }
  carry = carry << to - pos & mask;
  if (!padding && pos >= from)
    throw new Error("Excess padding");
  if (!padding && carry > 0)
    throw new Error(`Non-zero padding: ${carry}`);
  if (padding && pos > 0)
    res.push(carry >>> 0);
  return res;
}
// @__NO_SIDE_EFFECTS__
function radix(num2) {
  anumber5(num2);
  const _256 = 2 ** 8;
  return {
    encode: (bytes) => {
      if (!isBytes7(bytes))
        throw new TypeError("radix.encode input should be Uint8Array");
      return convertRadix(Array.from(bytes), _256, num2);
    },
    decode: (digits) => {
      anumArr2("radix.decode", digits);
      return Uint8Array.from(convertRadix(digits, num2, _256));
    }
  };
}
// @__NO_SIDE_EFFECTS__
function radix23(bits2, revPadding = false) {
  anumber5(bits2);
  if (bits2 <= 0 || bits2 > 32)
    throw new RangeError("radix2: bits should be in (0..32]");
  if (/* @__PURE__ */ radix2carry2(8, bits2) > 32 || /* @__PURE__ */ radix2carry2(bits2, 8) > 32)
    throw new RangeError("radix2: carry overflow");
  return {
    encode: (bytes) => {
      if (!isBytes7(bytes))
        throw new TypeError("radix2.encode input should be Uint8Array");
      return convertRadix22(Array.from(bytes), 8, bits2, !revPadding);
    },
    decode: (digits) => {
      anumArr2("radix2.decode", digits);
      return Uint8Array.from(convertRadix22(digits, bits2, 8, revPadding));
    }
  };
}
function unsafeWrapper(fn) {
  afn3(fn);
  return function(...args) {
    try {
      return fn.apply(null, args);
    } catch (e) {
    }
  };
}
function checksum(len, fn) {
  anumber5(len);
  if (len <= 0)
    throw new RangeError(`checksum length must be positive: ${len}`);
  afn3(fn);
  const _fn = fn;
  return {
    encode(data) {
      if (!isBytes7(data))
        throw new TypeError("checksum.encode: input should be Uint8Array");
      const sum = _fn(data).slice(0, len);
      const res = new Uint8Array(data.length + len);
      res.set(data);
      res.set(sum, data.length);
      return res;
    },
    decode(data) {
      if (!isBytes7(data))
        throw new TypeError("checksum.decode: input should be Uint8Array");
      const payload = data.slice(0, -len);
      const oldChecksum = data.slice(-len);
      const newChecksum = _fn(payload).slice(0, len);
      for (let i = 0; i < len; i++)
        if (newChecksum[i] !== oldChecksum[i])
          throw new Error("Invalid checksum");
      return payload;
    }
  };
}
var genBase58 = /* @__NO_SIDE_EFFECTS__ */ (abc) => /* @__PURE__ */ chain3(/* @__PURE__ */ radix(58), /* @__PURE__ */ alphabet3(abc), /* @__PURE__ */ join2(""));
var base58 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ genBase58("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"));
var createBase58check = (sha2564) => {
  afn3(sha2564);
  const _sha256 = sha2564;
  return /* @__PURE__ */ chain3(checksum(4, (data) => _sha256(_sha256(data))), base58);
};
var BECH_ALPHABET = /* @__PURE__ */ chain3(/* @__PURE__ */ alphabet3("qpzry9x8gf2tvdw0s3jn54khce6mua7l"), /* @__PURE__ */ join2(""));
var POLYMOD_GENERATORS = [996825010, 642813549, 513874426, 1027748829, 705979059];
function bech32Polymod(pre) {
  const b = pre >> 25;
  let chk = (pre & 33554431) << 5;
  for (let i = 0; i < POLYMOD_GENERATORS.length; i++) {
    if ((b >> i & 1) === 1)
      chk ^= POLYMOD_GENERATORS[i];
  }
  return chk;
}
function bechChecksum(prefix2, words, encodingConst = 1) {
  const len = prefix2.length;
  let chk = 1;
  for (let i = 0; i < len; i++) {
    const c = prefix2.charCodeAt(i);
    if (c < 33 || c > 126)
      throw new Error(`Invalid prefix (${prefix2})`);
    chk = bech32Polymod(chk) ^ c >> 5;
  }
  chk = bech32Polymod(chk);
  for (let i = 0; i < len; i++)
    chk = bech32Polymod(chk) ^ prefix2.charCodeAt(i) & 31;
  for (let v of words)
    chk = bech32Polymod(chk) ^ v;
  for (let i = 0; i < 6; i++)
    chk = bech32Polymod(chk);
  chk ^= encodingConst;
  return BECH_ALPHABET.encode(convertRadix22([chk % powers3[30]], 30, 5, false));
}
// @__NO_SIDE_EFFECTS__
function genBech32(encoding) {
  const ENCODING_CONST = encoding === "bech32" ? 1 : 734539939;
  const _words = /* @__PURE__ */ radix23(5);
  const fromWords = _words.decode;
  const toWords = _words.encode;
  const fromWordsUnsafe = unsafeWrapper(fromWords);
  function encode3(prefix2, words, limit = 90) {
    astr3("bech32.encode prefix", prefix2);
    if (isBytes7(words))
      words = Array.from(words);
    anumArr2("bech32.encode", words);
    const plen = prefix2.length;
    if (plen === 0)
      throw new TypeError(`Invalid prefix length ${plen}`);
    const actualLength = plen + 7 + words.length;
    if (limit !== false && actualLength > limit)
      throw new TypeError(`Length ${actualLength} exceeds limit ${limit}`);
    const lowered = prefix2.toLowerCase();
    const sum = bechChecksum(lowered, words, ENCODING_CONST);
    return `${lowered}1${BECH_ALPHABET.encode(words)}${sum}`;
  }
  function decode(str, limit = 90) {
    astr3("bech32.decode input", str);
    const slen = str.length;
    if (slen < 8 || limit !== false && slen > limit)
      throw new TypeError(`invalid string length: ${slen} (${str}). Expected (8..${limit})`);
    const lowered = str.toLowerCase();
    if (str !== lowered && str !== str.toUpperCase())
      throw new Error(`String must be lowercase or uppercase`);
    const sepIndex = lowered.lastIndexOf("1");
    if (sepIndex === 0 || sepIndex === -1)
      throw new Error(`Letter "1" must be present between prefix and data only`);
    const prefix2 = lowered.slice(0, sepIndex);
    const data = lowered.slice(sepIndex + 1);
    if (data.length < 6)
      throw new Error("Data must be at least 6 characters long");
    const words = BECH_ALPHABET.decode(data).slice(0, -6);
    const sum = bechChecksum(prefix2, words, ENCODING_CONST);
    if (!data.endsWith(sum))
      throw new Error(`Invalid checksum in ${str}: expected "${sum}"`);
    return { prefix: prefix2, words };
  }
  const decodeUnsafe = unsafeWrapper(decode);
  function decodeToBytes(str) {
    const { prefix: prefix2, words } = decode(str, false);
    return {
      prefix: prefix2,
      words,
      bytes: fromWords(words)
    };
  }
  function encodeFromBytes(prefix2, bytes) {
    return encode3(prefix2, toWords(bytes));
  }
  return {
    encode: encode3,
    decode,
    encodeFromBytes,
    decodeToBytes,
    decodeUnsafe,
    fromWords,
    fromWordsUnsafe,
    toWords
  };
}
var bech32 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ genBech32("bech32"));
var bech32m = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ genBech32("bech32m"));
var hasHexBuiltin4 = /* @__PURE__ */ (() => (
  // Require both directions before enabling the native hex path so encode/decode stay symmetric.
  typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
))();
var hexBuiltin3 = {
  // Keep local type guards so the native path preserves library-level input errors.
  // Native toHex emits lowercase hex, matching the fallback alphabet and Node's hex strings.
  encode(data) {
    abytes5(data);
    return data.toHex();
  },
  // Native fromHex accepts either hex case and rejects odd-length / non-hex syntax.
  decode(s) {
    astr3("hex", s);
    return Uint8Array.fromHex(s);
  }
};
var hex3 = /* @__PURE__ */ Object.freeze(hasHexBuiltin4 ? hexBuiltin3 : /* @__PURE__ */ chain3(/* @__PURE__ */ radix23(4), /* @__PURE__ */ alphabet3("0123456789abcdef"), /* @__PURE__ */ join2(""), /* @__PURE__ */ normalize3((s) => {
  if (typeof s !== "string" || s.length % 2 !== 0)
    throw new TypeError(`hex.decode: expected string, got ${typeof s} with length ${s.length}`);
  return s.toLowerCase();
})));

// node_modules/@scure/btc-signer/script.js
var MAX_SCRIPT_BYTE_LENGTH = 520;
var OP = /* @__PURE__ */ Object.freeze({
  OP_0: 0,
  PUSHDATA1: 76,
  PUSHDATA2: 77,
  PUSHDATA4: 78,
  "1NEGATE": 79,
  RESERVED: 80,
  OP_1: 81,
  OP_2: 82,
  OP_3: 83,
  OP_4: 84,
  OP_5: 85,
  OP_6: 86,
  OP_7: 87,
  OP_8: 88,
  OP_9: 89,
  OP_10: 90,
  OP_11: 91,
  OP_12: 92,
  OP_13: 93,
  OP_14: 94,
  OP_15: 95,
  OP_16: 96,
  // Control
  NOP: 97,
  VER: 98,
  IF: 99,
  NOTIF: 100,
  VERIF: 101,
  VERNOTIF: 102,
  ELSE: 103,
  ENDIF: 104,
  VERIFY: 105,
  RETURN: 106,
  // Stack
  TOALTSTACK: 107,
  FROMALTSTACK: 108,
  "2DROP": 109,
  "2DUP": 110,
  "3DUP": 111,
  "2OVER": 112,
  "2ROT": 113,
  "2SWAP": 114,
  IFDUP: 115,
  DEPTH: 116,
  DROP: 117,
  DUP: 118,
  NIP: 119,
  OVER: 120,
  PICK: 121,
  ROLL: 122,
  ROT: 123,
  SWAP: 124,
  TUCK: 125,
  // Splice
  CAT: 126,
  SUBSTR: 127,
  LEFT: 128,
  RIGHT: 129,
  SIZE: 130,
  // Boolean logic
  INVERT: 131,
  AND: 132,
  OR: 133,
  XOR: 134,
  EQUAL: 135,
  EQUALVERIFY: 136,
  RESERVED1: 137,
  RESERVED2: 138,
  // Numbers
  "1ADD": 139,
  "1SUB": 140,
  "2MUL": 141,
  "2DIV": 142,
  NEGATE: 143,
  ABS: 144,
  NOT: 145,
  "0NOTEQUAL": 146,
  ADD: 147,
  SUB: 148,
  MUL: 149,
  DIV: 150,
  MOD: 151,
  LSHIFT: 152,
  RSHIFT: 153,
  BOOLAND: 154,
  BOOLOR: 155,
  NUMEQUAL: 156,
  NUMEQUALVERIFY: 157,
  NUMNOTEQUAL: 158,
  LESSTHAN: 159,
  GREATERTHAN: 160,
  LESSTHANOREQUAL: 161,
  GREATERTHANOREQUAL: 162,
  MIN: 163,
  MAX: 164,
  WITHIN: 165,
  // Crypto
  RIPEMD160: 166,
  SHA1: 167,
  SHA256: 168,
  HASH160: 169,
  HASH256: 170,
  CODESEPARATOR: 171,
  CHECKSIG: 172,
  CHECKSIGVERIFY: 173,
  CHECKMULTISIG: 174,
  CHECKMULTISIGVERIFY: 175,
  // Expansion
  NOP1: 176,
  CHECKLOCKTIMEVERIFY: 177,
  CHECKSEQUENCEVERIFY: 178,
  NOP4: 179,
  NOP5: 180,
  NOP6: 181,
  NOP7: 182,
  NOP8: 183,
  NOP9: 184,
  NOP10: 185,
  // BIP 342
  CHECKSIGADD: 186,
  // Invalid
  INVALID: 255
});
var OPNames = /* @__PURE__ */ (() => Object.freeze(reverseObject(OP)))();
function ScriptNum(bytesLimit = 6, forceMinimal = false) {
  return wrap({
    encodeStream: (w, value) => {
      if (value === 0n)
        return;
      const neg = value < 0;
      const val = BigInt(value);
      const nums = [];
      for (let abs = neg ? -val : val; abs; abs >>= 8n)
        nums.push(Number(abs & 0xffn));
      if (nums[nums.length - 1] >= 128)
        nums.push(neg ? 128 : 0);
      else if (neg)
        nums[nums.length - 1] |= 128;
      w.bytes(new Uint8Array(nums));
    },
    decodeStream: (r) => {
      const len = r.leftBytes;
      if (len > bytesLimit)
        throw new Error(`ScriptNum: number (${len}) bigger than limit=${bytesLimit}`);
      if (len === 0)
        return 0n;
      if (forceMinimal) {
        const data = r.bytes(len, true);
        if ((data[data.length - 1] & 127) === 0) {
          if (len <= 1 || (data[data.length - 2] & 128) === 0)
            throw new Error("Non-minimally encoded ScriptNum");
        }
      }
      let last = 0;
      let res = 0n;
      for (let i = 0; i < len; ++i) {
        last = r.byte();
        res |= BigInt(last) << 8n * BigInt(i);
      }
      if (last >= 128) {
        res &= 2n ** BigInt(len * 8) - 1n >> 1n;
        res = -res;
      }
      return res;
    }
  });
}
function OpToNum(op, bytesLimit = 4, forceMinimal = true) {
  if (typeof op === "number")
    return op;
  if (isBytes6(op)) {
    try {
      const val = ScriptNum(bytesLimit, forceMinimal).decode(op);
      if (val > Number.MAX_SAFE_INTEGER)
        return;
      return Number(val);
    } catch (e) {
      return;
    }
  }
  return;
}
var scriptPushLen = (op, read) => {
  if (!(OP.OP_0 < op && op <= OP.PUSHDATA4))
    return;
  if (op < OP.PUSHDATA1)
    return op;
  if (op === OP.PUSHDATA1)
    return read(1);
  if (op === OP.PUSHDATA2)
    return read(2);
  if (op === OP.PUSHDATA4)
    return read(4);
  throw new Error("Should be not possible");
};
var Script = /* @__PURE__ */ (() => Object.freeze(wrap({
  encodeStream: (w, value) => {
    for (let o of value) {
      if (typeof o === "string") {
        if (OP[o] === void 0)
          throw new Error(`Unknown opcode=${o}`);
        w.byte(OP[o]);
        continue;
      } else if (typeof o === "number") {
        if (o === 0) {
          w.byte(0);
          continue;
        } else if (o === -1) {
          w.byte(OP["1NEGATE"]);
          continue;
        } else if (1 <= o && o <= 16) {
          w.byte(OP.OP_1 - 1 + o);
          continue;
        }
      }
      if (typeof o === "number")
        o = ScriptNum().encode(BigInt(o));
      if (!isBytes6(o))
        throw new Error(`Wrong Script OP=${o} (${typeof o})`);
      const len = o.length;
      if (len < OP.PUSHDATA1)
        w.byte(len);
      else if (len <= 255) {
        w.byte(OP.PUSHDATA1);
        w.byte(len);
      } else if (len <= 65535) {
        w.byte(OP.PUSHDATA2);
        w.bytes(U16LE.encode(len));
      } else {
        w.byte(OP.PUSHDATA4);
        w.bytes(U32LE.encode(len));
      }
      w.bytes(o);
    }
  },
  decodeStream: (r) => {
    const out = [];
    while (!r.isEnd()) {
      const cur = r.byte();
      const len = scriptPushLen(cur, (bytes) => {
        if (bytes === 1)
          return U8.decodeStream(r);
        if (bytes === 2)
          return U16LE.decodeStream(r);
        return U32LE.decodeStream(r);
      });
      if (len !== void 0) {
        out.push(r.bytes(len));
      } else if (cur === 0) {
        out.push(0);
      } else if (OP.OP_1 <= cur && cur <= OP.OP_16) {
        out.push(cur - (OP.OP_1 - 1));
      } else {
        const op = OPNames[cur];
        if (op === void 0)
          throw new Error(`Unknown opcode=${cur.toString(16)}`);
        out.push(op);
      }
    }
    return out;
  }
})))();
var CSLimits = {
  253: [253, 2, 253n, 65535n],
  254: [254, 4, 65536n, 4294967295n],
  255: [255, 8, 4294967296n, 18446744073709551615n]
};
var CompactSize = /* @__PURE__ */ (() => Object.freeze(wrap({
  encodeStream: (w, value) => {
    if (typeof value === "number")
      value = BigInt(value);
    if (0n <= value && value <= 252n)
      return w.byte(Number(value));
    for (const [flag2, bytes, start, stop] of Object.values(CSLimits)) {
      if (start > value || value > stop)
        continue;
      w.byte(flag2);
      for (let i = 0; i < bytes; i++)
        w.byte(Number(value >> 8n * BigInt(i) & 0xffn));
      return;
    }
    throw w.err(`VarInt too big: ${value}`);
  },
  decodeStream: (r) => {
    const b0 = r.byte();
    if (b0 <= 252)
      return BigInt(b0);
    const [_, bytes, start] = CSLimits[b0];
    let num2 = 0n;
    for (let i = 0; i < bytes; i++)
      num2 |= BigInt(r.byte()) << 8n * BigInt(i);
    if (num2 < start)
      throw r.err(`Wrong CompactSize(${8 * bytes})`);
    return num2;
  }
})))();
var CompactSizeLen = /* @__PURE__ */ (() => Object.freeze(apply(CompactSize, coders.numberBigint)))();
var _VarBytes = /* @__PURE__ */ (() => Object.freeze(createBytes(CompactSize)))();
var VarBytes = _VarBytes;
var _RawWitness = /* @__PURE__ */ (() => Object.freeze(array(CompactSizeLen, _VarBytes)))();
var RawWitness = _RawWitness;
var BTCArray = (t) => array(CompactSize, t);
var RawInput = /* @__PURE__ */ (() => Object.freeze(struct({
  txid: createBytes(32, true),
  // hash(prev_tx),
  index: U32LE,
  // output number of previous tx
  finalScriptSig: _VarBytes,
  // btc merges input and output script, executes it. If ok = tx passes
  sequence: U32LE
  // ?
})))();
var RawOutput = /* @__PURE__ */ (() => Object.freeze(struct({ amount: U64LE, script: _VarBytes })))();
var _RawTx = /* @__PURE__ */ (() => struct({
  version: I32LE,
  segwitFlag: flag(new Uint8Array([0, 1])),
  inputs: BTCArray(RawInput),
  outputs: BTCArray(RawOutput),
  // BIP144 does not encode a witness-count field; one RawWitness entry is
  // implied for each txin and follows the same order as inputs.
  witnesses: flagged("segwitFlag", array("inputs/length", _RawWitness)),
  // < 500000000	Block number at which this transaction is unlocked
  // >= 500000000	UNIX timestamp at which this transaction is unlocked
  // Handled as part of PSBTv2
  lockTime: U32LE
}))();
function validateRawTx(tx) {
  if (tx.segwitFlag && tx.witnesses && tx.witnesses.every((w) => !w.length))
    throw new Error("Segwit flag with only empty witness fields");
  return tx;
}
var RawTx = /* @__PURE__ */ (() => Object.freeze(validate(_RawTx, validateRawTx)))();
var RawOldTx = /* @__PURE__ */ (() => Object.freeze(struct({
  version: I32LE,
  inputs: BTCArray(RawInput),
  outputs: BTCArray(RawOutput),
  lockTime: U32LE
})))();

// node_modules/@scure/btc-signer/psbt.js
var PubKeyECDSA = /* @__PURE__ */ (() => validate(createBytes(null), (pub) => validatePubkey(pub, PubT.ecdsa)))();
var PubKeyECDSACompressed = /* @__PURE__ */ (() => validate(createBytes(33), (pub) => validatePubkey(pub, PubT.ecdsa)))();
var PubKeySchnorr = /* @__PURE__ */ (() => validate(createBytes(32), (pub) => validatePubkey(pub, PubT.schnorr)))();
var SignatureSchnorr = /* @__PURE__ */ (() => validate(createBytes(null), (sig) => {
  if (sig.length !== 64 && sig.length !== 65)
    throw new Error("Schnorr signature should be 64 or 65 bytes long");
  return sig;
}))();
var RawWitnessWire = RawWitness;
var BIP32Der = /* @__PURE__ */ (() => struct({
  fingerprint: U32BE,
  path: array(null, U32LE)
}))();
var TaprootBIP32Der = /* @__PURE__ */ (() => struct({
  hashes: array(CompactSizeLen, createBytes(32)),
  der: BIP32Der
}))();
var GlobalXPUB = /* @__PURE__ */ (() => validate(struct({
  version: U32BE,
  depth: U8,
  parentFingerprint: U32BE,
  childNumber: U32BE,
  chainCode: createBytes(32),
  // BIP32 serialization stores the public key as the final 33-byte `ser_P(K)` field and says
  // importing an extended public key must verify that point data corresponds to the curve.
  publicKey: PubKeyECDSACompressed
}), (xpub) => {
  if (xpub.depth === 0 && xpub.parentFingerprint !== 0)
    throw new Error("GlobalXPUB: depth=0 requires parentFingerprint=0");
  if (xpub.depth === 0 && xpub.childNumber !== 0)
    throw new Error("GlobalXPUB: depth=0 requires childNumber=0");
  return xpub;
}))();
var tapScriptSigKey = /* @__PURE__ */ (() => struct({ pubKey: PubKeySchnorr, leafHash: createBytes(32) }))();
var _TaprootControlBlock = /* @__PURE__ */ (() => struct({
  version: U8,
  // With parity :(
  internalKey: createBytes(32),
  merklePath: array(null, createBytes(32))
}))();
var TaprootControlBlock = /* @__PURE__ */ (() => Object.freeze(validate(_TaprootControlBlock, (cb) => {
  if (cb.merklePath.length > 128)
    throw new Error("TaprootControlBlock: merklePath should be of length 0..128 (inclusive)");
  return cb;
})))();
var tapTree = /* @__PURE__ */ (() => validate(array(null, struct({
  depth: U8,
  version: U8,
  script: VarBytes
})), (tree) => {
  if (tree.length < 1)
    throw new Error("tapTree: expected at least one tuple");
  let path = Array(tree[0].depth).fill(0);
  let maxDepth = tree[0].depth;
  for (let i = 1; i < tree.length; i++) {
    const { depth } = tree[i];
    if (depth > maxDepth)
      maxDepth = depth;
    let j = path.length - 1;
    while (j >= 0 && path[j] === 1)
      j--;
    if (j < 0)
      throw new Error("tapTree: tuples must be in DFS order");
    const next = path.slice(0, j);
    next.push(1);
    if (depth < next.length)
      throw new Error("tapTree: tuples must be in DFS order");
    while (next.length < depth)
      next.push(0);
    path = next;
  }
  let leaves = 0n;
  for (let i = 0; i < tree.length; i++)
    leaves += 1n << BigInt(maxDepth - tree[i].depth);
  if (leaves !== 1n << BigInt(maxDepth))
    throw new Error("tapTree: tuples must describe a complete binary tree");
  return tree;
}))();
var BytesInf = /* @__PURE__ */ createBytes(null);
var Bytes20 = /* @__PURE__ */ createBytes(20);
var Bytes32 = /* @__PURE__ */ createBytes(32);
var PSBTInfo = (type, kc, vc, reqInc, allowInc, silentIgnore) => /* @__PURE__ */ Object.freeze([
  type,
  kc && typeof kc === "object" ? Object.freeze(kc) : kc,
  vc && typeof vc === "object" ? Object.freeze(vc) : vc,
  Object.freeze([...reqInc]),
  Object.freeze([...allowInc]),
  silentIgnore
]);
var PSBTGlobal = /* @__PURE__ */ (() => Object.freeze({
  unsignedTx: PSBTInfo(0, false, RawOldTx, [0], [0], false),
  // BIP174 also requires the serialized xpub depth to match the number of path elements in the
  // paired derivation value, so callers still need that cross-field check above this raw table.
  xpub: PSBTInfo(1, GlobalXPUB, BIP32Der, [], [0, 2], false),
  txVersion: PSBTInfo(2, false, U32LE, [2], [2], false),
  fallbackLocktime: PSBTInfo(3, false, U32LE, [], [2], false),
  inputCount: PSBTInfo(4, false, CompactSizeLen, [2], [2], false),
  outputCount: PSBTInfo(5, false, CompactSizeLen, [2], [2], false),
  // TODO: bitfield
  txModifiable: PSBTInfo(6, false, U8, [], [2], false),
  version: PSBTInfo(251, false, U32LE, [], [0, 2], false),
  proprietary: PSBTInfo(252, BytesInf, BytesInf, [], [0, 2], false)
}))();
var PSBTInput = /* @__PURE__ */ (() => Object.freeze({
  nonWitnessUtxo: PSBTInfo(0, false, RawTx, [], [0, 2], false),
  witnessUtxo: PSBTInfo(1, false, RawOutput, [], [0, 2], false),
  partialSig: PSBTInfo(2, PubKeyECDSA, BytesInf, [], [0, 2], false),
  sighashType: PSBTInfo(3, false, U32LE, [], [0, 2], false),
  redeemScript: PSBTInfo(4, false, BytesInf, [], [0, 2], false),
  witnessScript: PSBTInfo(5, false, BytesInf, [], [0, 2], false),
  bip32Derivation: PSBTInfo(6, PubKeyECDSA, BIP32Der, [], [0, 2], false),
  finalScriptSig: PSBTInfo(7, false, BytesInf, [], [0, 2], false),
  finalScriptWitness: PSBTInfo(8, false, RawWitnessWire, [], [0, 2], false),
  porCommitment: PSBTInfo(9, false, BytesInf, [], [0, 2], false),
  ripemd160: PSBTInfo(10, Bytes20, BytesInf, [], [0, 2], false),
  sha256: PSBTInfo(11, Bytes32, BytesInf, [], [0, 2], false),
  hash160: PSBTInfo(12, Bytes20, BytesInf, [], [0, 2], false),
  hash256: PSBTInfo(13, Bytes32, BytesInf, [], [0, 2], false),
  // BIP174/BIP370 serialize PREVIOUS_TXID in standard byte order, while the rest of this repo
  // historically keeps TransactionInput.txid in display-order bytes matching `Transaction.id`.
  // Reverse at this PSBTv2 boundary so internal txid semantics stay aligned with the raw-tx path.
  txid: PSBTInfo(14, false, createBytes(32, true), [2], [2], true),
  index: PSBTInfo(15, false, U32LE, [2], [2], true),
  sequence: PSBTInfo(16, false, U32LE, [], [2], true),
  requiredTimeLocktime: PSBTInfo(17, false, U32LE, [], [2], false),
  requiredHeightLocktime: PSBTInfo(18, false, U32LE, [], [2], false),
  tapKeySig: PSBTInfo(19, false, SignatureSchnorr, [], [0, 2], false),
  tapScriptSig: PSBTInfo(20, tapScriptSigKey, SignatureSchnorr, [], [0, 2], false),
  tapLeafScript: PSBTInfo(21, TaprootControlBlock, BytesInf, [], [0, 2], false),
  // BIP371 key data here is a 32-byte x-only pubkey, so reuse the shared Schnorr pubkey coder
  // instead of accepting arbitrary 32-byte blobs that only fail much later in taproot flows.
  tapBip32Derivation: PSBTInfo(22, PubKeySchnorr, TaprootBIP32Der, [], [0, 2], false),
  tapInternalKey: PSBTInfo(23, false, PubKeySchnorr, [], [0, 2], false),
  tapMerkleRoot: PSBTInfo(24, false, Bytes32, [], [0, 2], false),
  proprietary: PSBTInfo(252, BytesInf, BytesInf, [], [0, 2], false)
}))();
var PSBTInputFinalKeys = /* @__PURE__ */ Object.freeze([
  // PSBTv2 extractors rebuild the final transaction from per-input fields, so
  // finalized inputs still need txid/index (and any non-default sequence)
  // even though BIP174's generic cleanup is stricter.
  "txid",
  "sequence",
  "index",
  "witnessUtxo",
  "nonWitnessUtxo",
  "finalScriptSig",
  "finalScriptWitness",
  "unknown"
]);
var PSBTInputUnsignedKeys = /* @__PURE__ */ Object.freeze([
  // This is the replace/remove allowlist for signed inputs; mergeKeyMap() can still append
  // previously absent metadata or new KV entries for other fields when they don't conflict.
  "partialSig",
  "finalScriptSig",
  "finalScriptWitness",
  "tapKeySig",
  "tapScriptSig"
]);
var PSBTOutput = /* @__PURE__ */ (() => Object.freeze({
  redeemScript: PSBTInfo(0, false, BytesInf, [], [0, 2], false),
  witnessScript: PSBTInfo(1, false, BytesInf, [], [0, 2], false),
  bip32Derivation: PSBTInfo(2, PubKeyECDSA, BIP32Der, [], [0, 2], false),
  // BIP174/BIP370 serialize PSBT_OUT_AMOUNT as a signed int64 on the wire; semantic output
  // validity still rejects negative transaction amounts in `PSBTOutputCoder` below.
  amount: PSBTInfo(3, false, I64LE, [2], [2], true),
  script: PSBTInfo(4, false, BytesInf, [2], [2], true),
  tapInternalKey: PSBTInfo(5, false, PubKeySchnorr, [], [0, 2], false),
  // BIP371 expects a non-empty DFS-ordered list of tapleaf tuples here so wallets can
  // reconstruct the same Taproot tree, not just an arbitrary list of serialized leaves.
  tapTree: PSBTInfo(6, false, tapTree, [], [0, 2], false),
  tapBip32Derivation: PSBTInfo(7, PubKeySchnorr, TaprootBIP32Der, [], [0, 2], false),
  proprietary: PSBTInfo(252, BytesInf, BytesInf, [], [0, 2], false)
}))();
var PSBTOutputUnsignedKeys = /* @__PURE__ */ Object.freeze([]);
var PSBTKeyPair = /* @__PURE__ */ (() => array(NULL, struct({
  //  <key> := <keylen> <keytype> <keydata> WHERE keylen = len(keytype)+len(keydata)
  key: prefix(CompactSizeLen, struct({ type: CompactSizeLen, key: createBytes(null) })),
  //  <value> := <valuelen> <valuedata>
  value: createBytes(CompactSizeLen)
})))();
function PSBTKeyInfo(info) {
  const [type, kc, vc, reqInc, allowInc, silentIgnore] = info;
  return { type, kc, vc, reqInc, allowInc, silentIgnore };
}
var PSBTUnknownKey = /* @__PURE__ */ (() => (
  // Raw unknown/proprietary field key: compact-size keytype plus opaque keydata for pass-through.
  struct({ type: CompactSizeLen, key: createBytes(null) })
))();
function PSBTKeyMap(psbtEnum) {
  const byType = {};
  for (const k in psbtEnum) {
    const [num2, kc, vc] = psbtEnum[k];
    byType[num2] = [k, kc, vc];
  }
  return wrap({
    encodeStream: (w, value) => {
      const _value = value;
      let out = [];
      const seen = {};
      const add = (key, value2) => {
        const _value2 = value2;
        const kStr = hex3.encode(PSBTUnknownKey.encode(key));
        if (seen[kStr])
          throw new Error(`PSBT: duplicate key=${kStr}`);
        seen[kStr] = true;
        out.push({ key, value: _value2 });
      };
      for (const name in psbtEnum) {
        const val = _value[name];
        if (val === void 0)
          continue;
        const [type, kc, vc] = psbtEnum[name];
        if (!kc) {
          add({ type, key: EMPTY }, vc.encode(val));
        } else {
          const kv = val.map(([k, v]) => [
            kc.encode(k),
            vc.encode(v)
          ]);
          kv.sort((a, b) => compareBytes(a[0], b[0]));
          for (const [key, value2] of kv)
            add({ key, type }, value2);
        }
      }
      if (_value.unknown) {
        _value.unknown.sort((a, b) => compareBytes(a[0].key, b[0].key));
        for (const [k, v] of _value.unknown)
          add(k, v);
      }
      PSBTKeyPair.encodeStream(w, out);
    },
    decodeStream: (r) => {
      const raw = PSBTKeyPair.decodeStream(r);
      const out = {};
      const noKey = {};
      const seen = {};
      for (const elm of raw) {
        const kStr = hex3.encode(PSBTUnknownKey.encode(elm.key));
        if (seen[kStr])
          throw new Error(`PSBT: duplicate key=${kStr}`);
        seen[kStr] = true;
        let name = "unknown";
        let key = elm.key.key;
        let value = elm.value;
        if (byType[elm.key.type]) {
          const [_name, kc, vc] = byType[elm.key.type];
          name = _name;
          if (!kc && key.length) {
            throw new Error(`PSBT: Non-empty key for ${name} (key=${hex3.encode(key)} value=${hex3.encode(value)}`);
          }
          key = kc ? kc.decode(key) : void 0;
          value = vc.decode(value);
          if (!kc) {
            if (out[name])
              throw new Error(`PSBT: Same keys: ${name} (key=${key} value=${value})`);
            out[name] = value;
            noKey[name] = true;
            continue;
          }
        } else {
          key = { type: elm.key.type, key: elm.key.key };
        }
        if (noKey[name])
          throw new Error(`PSBT: Key type with empty key and no key=${name} val=${value}`);
        if (!out[name])
          out[name] = [];
        out[name].push([key, value]);
      }
      return out;
    }
  });
}
var PSBTInputCoder = /* @__PURE__ */ (() => Object.freeze(validate(PSBTKeyMap(PSBTInput), (i) => {
  if (i.finalScriptWitness && !i.finalScriptWitness.length)
    throw new Error("validateInput: empty finalScriptWitness");
  if (i.partialSig && !i.partialSig.length)
    throw new Error("Empty partialSig");
  if (i.partialSig)
    for (const [k] of i.partialSig)
      validatePubkey(k, PubT.ecdsa);
  if (i.bip32Derivation)
    for (const [k] of i.bip32Derivation)
      validatePubkey(k, PubT.ecdsa);
  if (i.requiredTimeLocktime !== void 0 && i.requiredTimeLocktime < 5e8)
    throw new Error(`validateInput: wrong timeLocktime=${i.requiredTimeLocktime}`);
  if (i.requiredHeightLocktime !== void 0 && (i.requiredHeightLocktime <= 0 || i.requiredHeightLocktime >= 5e8))
    throw new Error(`validateInput: wrong heighLocktime=${i.requiredHeightLocktime}`);
  if (i.tapLeafScript) {
    for (const [k, v] of i.tapLeafScript) {
      if ((k.version & 254) !== v[v.length - 1])
        throw new Error("validateInput: tapLeafScript version mimatch");
      if (v[v.length - 1] & 1)
        throw new Error("validateInput: tapLeafScript version has parity bit!");
    }
  }
  return i;
})))();
var PSBTOutputCoder = /* @__PURE__ */ (() => Object.freeze(validate(PSBTKeyMap(PSBTOutput), (o) => {
  if (o.amount !== void 0 && o.amount < 0n)
    throw new Error(`validateOutput: wrong amount=${o.amount}`);
  if (o.bip32Derivation)
    for (const [k] of o.bip32Derivation)
      validatePubkey(k, PubT.ecdsa);
  return o;
})))();
var PSBTGlobalCoder = /* @__PURE__ */ (() => validate(PSBTKeyMap(PSBTGlobal), (g) => {
  const version = g.version || 0;
  if (version === 0) {
    if (!g.unsignedTx)
      throw new Error("PSBTv0: missing unsignedTx");
    for (const inp of g.unsignedTx.inputs)
      if (inp.finalScriptSig && inp.finalScriptSig.length)
        throw new Error("PSBTv0: input scriptSig found in unsignedTx");
  }
  for (const [xpub, der] of g.xpub || []) {
    if (xpub.depth !== der.path.length)
      throw new Error(`PSBT_GLOBAL_XPUB: xpub depth=${xpub.depth} must match derivation path length=${der.path.length}`);
  }
  return g;
}))();
var _RawPSBTV0 = /* @__PURE__ */ (() => Object.freeze(struct({
  magic: magic(string(new Uint8Array([255])), "psbt"),
  global: PSBTGlobalCoder,
  // Raw v0 framing follows the unsigned transaction for input-map count; the stricter
  // one-map-per-input/output reconciliation happens in `RawPSBTV0` / `validatePSBT`.
  inputs: array("global/unsignedTx/inputs/length", PSBTInputCoder),
  outputs: array(null, PSBTOutputCoder)
})))();
var _RawPSBTV2 = /* @__PURE__ */ (() => Object.freeze(struct({
  magic: magic(string(new Uint8Array([255])), "psbt"),
  global: PSBTGlobalCoder,
  // Raw v2 framing takes map counts from the global PSBTv2 count fields; deeper version
  // and per-field validation still happens in `RawPSBTV2` / `validatePSBT`.
  inputs: array("global/inputCount", PSBTInputCoder),
  outputs: array("global/outputCount", PSBTOutputCoder)
})))();
function validatePSBTFields(version, info, lst) {
  const _lst = lst;
  for (const k in _lst) {
    if (k === "unknown")
      continue;
    if (!info[k])
      continue;
    const { allowInc } = PSBTKeyInfo(info[k]);
    if (!allowInc.includes(version))
      throw new Error(`PSBTv${version}: field ${k} is not allowed`);
  }
  for (const k in info) {
    const { reqInc } = PSBTKeyInfo(info[k]);
    if (reqInc.includes(version) && _lst[k] === void 0)
      throw new Error(`PSBTv${version}: missing required field ${k}`);
  }
}
function cleanPSBTFields(version, info, lst) {
  const _lst = lst;
  const out = {};
  for (const _k in _lst) {
    const k = _k;
    if (k !== "unknown") {
      if (!info[k])
        continue;
      const { allowInc, silentIgnore } = PSBTKeyInfo(info[k]);
      if (!allowInc.includes(version)) {
        if (silentIgnore)
          continue;
        throw new Error(`Failed to serialize in PSBTv${version}: ${k} but versions allows inclusion=${allowInc}`);
      }
    }
    out[k] = _lst[k];
  }
  return out;
}
function validatePSBT(tx) {
  const version = tx && tx.global && tx.global.version || 0;
  validatePSBTFields(version, PSBTGlobal, tx.global);
  for (const i of tx.inputs)
    validatePSBTFields(version, PSBTInput, i);
  for (const o of tx.outputs)
    validatePSBTFields(version, PSBTOutput, o);
  const inputCount = !version ? tx.global.unsignedTx.inputs.length : tx.global.inputCount;
  if (tx.inputs.length < inputCount)
    throw new Error("Not enough inputs");
  const inputsLeft = tx.inputs.slice(inputCount);
  if (inputsLeft.length > 1 || inputsLeft.length && Object.keys(inputsLeft[0]).length)
    throw new Error(`Unexpected inputs left in tx=${inputsLeft}`);
  const outputCount = !version ? tx.global.unsignedTx.outputs.length : tx.global.outputCount;
  if (tx.outputs.length < outputCount)
    throw new Error("Not outputs inputs");
  const outputsLeft = tx.outputs.slice(outputCount);
  if (outputsLeft.length > 1 || outputsLeft.length && Object.keys(outputsLeft[0]).length)
    throw new Error(`Unexpected outputs left in tx=${outputsLeft}`);
  return tx;
}
function mergeKeyMap(psbtEnum, val, cur, allowedFields, allowUnknown) {
  const _val = val;
  const _cur = cur;
  const _allowedFields = allowedFields;
  const res = { ..._cur, ..._val };
  for (const k in psbtEnum) {
    const key = k;
    const [_, kC, vC] = psbtEnum[key];
    const cannotChange = _allowedFields && !_allowedFields.includes(k);
    if (_val[k] === void 0 && k in _val) {
      if (cannotChange)
        throw new Error(`Cannot remove signed field=${k}`);
      delete res[k];
    } else if (kC) {
      const oldKV = _cur && _cur[k] ? _cur[k] : [];
      let newKV = _val[key];
      if (newKV) {
        if (!Array.isArray(newKV))
          throw new Error(`keyMap(${k}): KV pairs should be [k, v][]`);
        newKV = newKV.map((val2) => {
          if (val2.length !== 2)
            throw new Error(`keyMap(${k}): KV pairs should be [k, v][]`);
          return [
            typeof val2[0] === "string" ? kC.decode(hex3.decode(val2[0])) : val2[0],
            typeof val2[1] === "string" ? vC.decode(hex3.decode(val2[1])) : val2[1]
          ];
        });
        const map2 = {};
        const add = (kStr, k2, v) => {
          if (map2[kStr] === void 0) {
            map2[kStr] = [k2, v];
            return;
          }
          const oldVal = hex3.encode(vC.encode(map2[kStr][1]));
          const newVal = hex3.encode(vC.encode(v));
          if (oldVal !== newVal)
            throw new Error(`keyMap(${key}): same key=${kStr} oldVal=${oldVal} newVal=${newVal}`);
        };
        for (const [k2, v] of oldKV) {
          const kStr = hex3.encode(kC.encode(k2));
          add(kStr, k2, v);
        }
        for (const [k2, v] of newKV) {
          const kStr = hex3.encode(kC.encode(k2));
          if (v === void 0) {
            if (cannotChange)
              throw new Error(`Cannot remove signed field=${key}/${k2}`);
            delete map2[kStr];
          } else
            add(kStr, k2, v);
        }
        res[key] = Object.values(map2);
      }
    } else if (typeof res[k] === "string") {
      res[k] = vC.decode(hex3.decode(res[k]));
    } else if (cannotChange && k in _val && _cur && _cur[k] !== void 0) {
      if (!equalBytes2(vC.encode(_val[k]), vC.encode(_cur[k])))
        throw new Error(`Cannot change signed field=${k}`);
    }
  }
  if (allowUnknown && _val.unknown) {
    const map2 = {};
    for (const [k, v] of _cur?.unknown || [])
      map2[hex3.encode(PSBTUnknownKey.encode(k))] = [k, v];
    for (const [k, v] of _val.unknown) {
      const kStr = hex3.encode(PSBTUnknownKey.encode(k));
      if (map2[kStr] === void 0) {
        map2[kStr] = [k, v];
        continue;
      }
      const oldVal = hex3.encode(BytesInf.encode(map2[kStr][1]));
      const newVal = hex3.encode(BytesInf.encode(v));
      if (oldVal !== newVal)
        throw new Error(`keyMap(unknown): same key=${kStr} oldVal=${oldVal} newVal=${newVal}`);
    }
    res.unknown = Object.values(map2);
  }
  for (const k in res) {
    if (!psbtEnum[k]) {
      if (allowUnknown && k === "unknown")
        continue;
      delete res[k];
    }
  }
  return res;
}
var RawPSBTV0 = /* @__PURE__ */ (() => Object.freeze(validate(_RawPSBTV0, validatePSBT)))();
var RawPSBTV2 = /* @__PURE__ */ (() => Object.freeze(validate(_RawPSBTV2, validatePSBT)))();

// node_modules/@scure/btc-signer/payment.js
var OutP2A = {
  encode(from) {
    if (from.length !== 2 || from[0] !== 1 || !isBytes6(from[1]) || hex3.encode(from[1]) !== "4e73")
      return;
    return { type: "p2a", script: Script.encode(from) };
  },
  decode: (to) => {
    if (to.type !== "p2a")
      return;
    return [1, hex3.decode("4e73")];
  }
};
function isValidPubkey(pub, type) {
  try {
    validatePubkey(pub, type);
    return true;
  } catch (e) {
    return false;
  }
}
var OutPK = {
  encode(from) {
    if (from.length !== 2 || !isBytes6(from[0]) || !isValidPubkey(from[0], PubT.ecdsa) || from[1] !== "CHECKSIG")
      return;
    return { type: "pk", pubkey: from[0] };
  },
  decode: (to) => {
    if (to.type !== "pk")
      return;
    return [to.pubkey, "CHECKSIG"];
  }
};
var OutPKH = {
  encode(from) {
    if (from.length !== 5 || from[0] !== "DUP" || from[1] !== "HASH160" || !isBytes6(from[2]))
      return;
    if (from[3] !== "EQUALVERIFY" || from[4] !== "CHECKSIG")
      return;
    return { type: "pkh", hash: from[2] };
  },
  // OutScript validates `pkh.hash` before this branch emits the canonical
  // `DUP HASH160 <hash> EQUALVERIFY CHECKSIG` script.
  decode: (to) => to.type === "pkh" ? ["DUP", "HASH160", to.hash, "EQUALVERIFY", "CHECKSIG"] : void 0
};
var OutSH = {
  encode(from) {
    if (from.length !== 3 || from[0] !== "HASH160" || !isBytes6(from[1]) || from[2] !== "EQUAL")
      return;
    return { type: "sh", hash: from[1] };
  },
  // OutScript validates `sh.hash` before this branch emits the canonical
  // `HASH160 <hash> EQUAL` script.
  decode: (to) => to.type === "sh" ? ["HASH160", to.hash, "EQUAL"] : void 0
};
var OutWSH = {
  encode(from) {
    if (from.length !== 2 || from[0] !== 0 || !isBytes6(from[1]))
      return;
    if (from[1].length !== 32)
      return;
    return { type: "wsh", hash: from[1] };
  },
  // OutScript validates `wsh.hash` before this branch emits the canonical
  // version-0 32-byte witness program.
  decode: (to) => to.type === "wsh" ? [0, to.hash] : void 0
};
var OutWPKH = {
  encode(from) {
    if (from.length !== 2 || from[0] !== 0 || !isBytes6(from[1]))
      return;
    if (from[1].length !== 20)
      return;
    return { type: "wpkh", hash: from[1] };
  },
  // OutScript validates `wpkh.hash` before this branch emits the canonical
  // version-0 20-byte witness program.
  decode: (to) => to.type === "wpkh" ? [0, to.hash] : void 0
};
var OutMS = {
  encode(from) {
    const last = from.length - 1;
    if (from[last] !== "CHECKMULTISIG")
      return;
    const m = from[0];
    const n = from[last - 1];
    if (typeof m !== "number" || typeof n !== "number")
      return;
    const pubkeys = from.slice(1, -2);
    if (n !== pubkeys.length)
      return;
    for (const pub of pubkeys)
      if (!isBytes6(pub))
        return;
    return { type: "ms", m, pubkeys };
  },
  // checkmultisig(n, ..pubkeys, m)
  decode: (to) => (
    // OutScript validates multisig pubkeys and `0 < m <= n <= 16`.
    // This branch only emits the canonical `m <pubkeys...> n CHECKMULTISIG`
    // script.
    to.type === "ms" ? [to.m, ...to.pubkeys, to.pubkeys.length, "CHECKMULTISIG"] : void 0
  )
};
var OutTR = {
  encode(from) {
    if (from.length !== 2 || from[0] !== 1 || !isBytes6(from[1]) || from[1].length !== 32)
      return;
    return { type: "tr", pubkey: from[1] };
  },
  // OutScript validates `tr.pubkey` before this branch emits the canonical
  // version-1 32-byte witness program.
  decode: (to) => to.type === "tr" ? [1, to.pubkey] : void 0
};
var OutTRNS = {
  encode(from) {
    const last = from.length - 1;
    if (from[last] !== "CHECKSIG")
      return;
    const pubkeys = [];
    for (let i = 0; i < last; i++) {
      const elm = from[i];
      if (i & 1) {
        if (elm !== "CHECKSIGVERIFY" || i === last - 1)
          return;
        continue;
      }
      if (!isBytes6(elm) || !isValidPubkey(elm, PubT.schnorr))
        return;
      pubkeys.push(elm);
    }
    if (!pubkeys.length)
      return;
    return { type: "tr_ns", pubkeys };
  },
  decode: (to) => {
    if (to.type !== "tr_ns")
      return;
    const out = [];
    for (let i = 0; i < to.pubkeys.length - 1; i++)
      out.push(to.pubkeys[i], "CHECKSIGVERIFY");
    out.push(to.pubkeys[to.pubkeys.length - 1], "CHECKSIG");
    return out;
  }
};
var OutTRMS = {
  encode(from) {
    const last = from.length - 1;
    if (from[last] !== "NUMEQUAL" || from[1] !== "CHECKSIG")
      return;
    const pubkeys = [];
    const m = OpToNum(from[last - 1]);
    if (typeof m !== "number")
      return;
    for (let i = 0; i < last - 1; i++) {
      const elm = from[i];
      if (i & 1) {
        if (elm !== (i === 1 ? "CHECKSIG" : "CHECKSIGADD"))
          return;
        continue;
      }
      if (!isBytes6(elm))
        return;
      pubkeys.push(elm);
    }
    return { type: "tr_ms", pubkeys, m };
  },
  decode: (to) => {
    if (to.type !== "tr_ms")
      return;
    const out = [to.pubkeys[0], "CHECKSIG"];
    for (let i = 1; i < to.pubkeys.length; i++)
      out.push(to.pubkeys[i], "CHECKSIGADD");
    out.push(to.m, "NUMEQUAL");
    return out;
  }
};
var OutUnknown = {
  encode(from) {
    return { type: "unknown", script: Script.encode(from) };
  },
  decode: (to) => (
    // This reparses `unknown.script` through the semantic Script codec, so raw
    // bytes must still be syntactically parseable and may canonicalize on re-encode.
    to.type === "unknown" ? Script.decode(to.script) : void 0
  )
};
var OutScripts = /* @__PURE__ */ (() => [
  // Order is semantic: specific structured coders run first and the catch-all
  // unknown fallback must stay last.
  OutP2A,
  OutPK,
  OutPKH,
  OutSH,
  OutWSH,
  OutWPKH,
  OutMS,
  OutTR,
  OutTRNS,
  OutTRMS,
  OutUnknown
])();
var _OutScript = /* @__PURE__ */ (() => apply(Script, coders.match(OutScripts)))();
var OutScript = /* @__PURE__ */ (() => Object.freeze(validate(_OutScript, (i) => {
  if (i.type === "pk" && !isValidPubkey(i.pubkey, PubT.ecdsa))
    throw new Error("OutScript/pk: wrong key");
  if ((i.type === "pkh" || i.type === "sh" || i.type === "wpkh") && (!isBytes6(i.hash) || i.hash.length !== 20))
    throw new Error(`OutScript/${i.type}: wrong hash`);
  if (i.type === "wsh" && (!isBytes6(i.hash) || i.hash.length !== 32))
    throw new Error(`OutScript/wsh: wrong hash`);
  if (i.type === "tr" && (!isBytes6(i.pubkey) || !isValidPubkey(i.pubkey, PubT.schnorr)))
    throw new Error("OutScript/tr: wrong taproot public key");
  if (i.type === "ms" || i.type === "tr_ns" || i.type === "tr_ms") {
    if (!Array.isArray(i.pubkeys))
      throw new Error("OutScript/multisig: wrong pubkeys array");
  }
  if (i.type === "ms") {
    const n = i.pubkeys.length;
    for (const p of i.pubkeys)
      if (!isValidPubkey(p, PubT.ecdsa))
        throw new Error("OutScript/multisig: wrong pubkey");
    anumber2(i.m, "m");
    if (i.m <= 0 || n > 16 || i.m > n)
      throw new Error("OutScript/multisig: invalid params");
  }
  if (i.type === "tr_ns" || i.type === "tr_ms") {
    for (const p of i.pubkeys)
      if (!isValidPubkey(p, PubT.schnorr))
        throw new Error(`OutScript/${i.type}: wrong pubkey`);
  }
  if (i.type === "tr_ms") {
    const n = i.pubkeys.length;
    anumber2(i.m, "m");
    if (i.m <= 0 || n > 999 || i.m > n)
      throw new Error("OutScript/tr_ms: invalid params");
  }
  return i;
})))();
function checkWSH(s, witnessScript) {
  if (!equalBytes2(s.hash, sha2562(witnessScript)))
    throw new Error("checkScript: wsh wrong witnessScript hash");
  const w = OutScript.decode(witnessScript);
  if (w.type === "tr" || w.type === "tr_ns" || w.type === "tr_ms")
    throw new Error(`checkScript: P2${w.type} cannot be wrapped in P2SH`);
  if (w.type === "wpkh" || w.type === "wsh" || w.type === "sh")
    throw new Error(`checkScript: P2${w.type} cannot be wrapped in P2WSH`);
}
function checkScript(script, redeemScript, witnessScript) {
  let hasWsh = false;
  let r = void 0;
  if (script) {
    const s = OutScript.decode(script);
    if (s.type === "tr_ns" || s.type === "tr_ms" || s.type === "ms" || s.type == "pk")
      throw new Error(`checkScript: non-wrapped ${s.type}`);
    if (redeemScript) {
      if (s.type !== "sh")
        throw new Error("checkScript: redeemScript without P2SH");
      if (!equalBytes2(s.hash, hash160(redeemScript)))
        throw new Error("checkScript: sh wrong redeemScript hash");
      r = OutScript.decode(redeemScript);
      if (r?.type === "tr" || r?.type === "tr_ns" || r?.type === "tr_ms")
        throw new Error(`checkScript: P2${r.type} cannot be wrapped in P2SH`);
      if (r?.type === "sh")
        throw new Error("checkScript: P2SH cannot be wrapped in P2SH");
    }
    if (s.type === "wsh") {
      hasWsh = true;
      if (witnessScript)
        checkWSH(s, witnessScript);
    }
  }
  if (redeemScript) {
    if (r === void 0)
      r = OutScript.decode(redeemScript);
    if (r?.type === "wsh") {
      hasWsh = true;
      if (witnessScript)
        checkWSH(r, witnessScript);
    }
  }
  if (witnessScript && !hasWsh)
    throw new Error("checkScript: witnessScript without P2WSH");
}
var p2wpkh = (publicKey, network = NETWORK) => {
  if (!isValidPubkey(publicKey, PubT.ecdsa))
    throw new Error("P2WPKH: invalid publicKey");
  if (publicKey.length === 65)
    throw new Error("P2WPKH: uncompressed public key");
  const hash = hash160(publicKey);
  return {
    type: "wpkh",
    script: OutScript.encode({ type: "wpkh", hash }),
    address: Address(network).encode({ type: "wpkh", hash }),
    hash
  };
};
function checkTaprootScript(script, internalPubKey, allowUnknownOutputs = false, customScripts2) {
  const out = OutScript.decode(script);
  if (out.type === "unknown") {
    if (customScripts2) {
      const cs = apply(Script, coders.match(customScripts2));
      const c = cs.decode(script);
      if (c !== void 0) {
        if (typeof c.type !== "string" || !c.type.startsWith("tr_"))
          throw new Error(`P2TR: invalid custom type=${c.type}`);
        return;
      }
    }
    if (allowUnknownOutputs)
      return;
  }
  if (!["tr_ns", "tr_ms"].includes(out.type))
    throw new Error(`P2TR: invalid leaf script=${out.type}`);
  const outms = out;
  if (!allowUnknownOutputs && outms.pubkeys) {
    for (const p of outms.pubkeys) {
      if (equalBytes2(p, TAPROOT_UNSPENDABLE_KEY))
        throw new Error("Unspendable taproot key in leaf script");
      if (equalBytes2(p, internalPubKey)) {
        throw new Error("Using P2TR with leaf script with same key as internal key is not supported");
      }
    }
  }
}
function taprootListToTree(taprootList) {
  if (!taprootList.length)
    throw new Error("taprootListToTree: empty tree");
  const lst = Array.from(taprootList);
  while (lst.length >= 2) {
    lst.sort((a2, b2) => (b2.weight || 1) - (a2.weight || 1));
    const b = lst.pop();
    const a = lst.pop();
    const weight = (a?.weight || 1) + (b?.weight || 1);
    lst.push({
      weight,
      // Unwrap children array
      // TODO: Very hard to remove any here
      childs: [a?.childs || a, b?.childs || b]
    });
  }
  const last = lst[0];
  return last?.childs || last;
}
function taprootAddPath(tree, path = []) {
  if (!tree)
    throw new Error(`taprootAddPath: empty tree`);
  if (tree.type === "leaf")
    return { ...tree, path };
  if (tree.type !== "branch")
    throw new Error(`taprootAddPath: wrong type=${tree}`);
  return {
    ...tree,
    path,
    // BIP 341 control blocks serialize sibling hashes from leaf to root, so prepend the
    // current sibling before descending into the child subtree.
    left: taprootAddPath(tree.left, [tree.right.hash, ...path]),
    right: taprootAddPath(tree.right, [tree.left.hash, ...path])
  };
}
function taprootWalkTree(tree) {
  if (!tree)
    throw new Error(`taprootAddPath: empty tree`);
  if (tree.type === "leaf")
    return [tree];
  if (tree.type !== "branch")
    throw new Error(`taprootWalkTree: wrong type=${tree}`);
  return [...taprootWalkTree(tree.left), ...taprootWalkTree(tree.right)];
}
function taprootHashTree(tree, internalPubKey, allowUnknownOutputs = false, customScripts2) {
  if (!tree)
    throw new Error("taprootHashTree: empty tree");
  if (Array.isArray(tree) && tree.length === 1)
    tree = tree[0];
  if (!Array.isArray(tree)) {
    const version = tree.leafVersion;
    const { script: leafScript } = tree;
    if (tree.tapLeafScript || tree.tapMerkleRoot && !equalBytes2(tree.tapMerkleRoot, EMPTY))
      throw new Error("P2TR: tapRoot leafScript cannot have tree");
    const script = typeof leafScript === "string" ? hex3.decode(leafScript) : leafScript;
    if (!isBytes6(script))
      throw new Error(`checkScript: wrong script type=${script}`);
    checkTaprootScript(script, internalPubKey, allowUnknownOutputs, customScripts2);
    return {
      type: "leaf",
      version,
      script,
      hash: tapLeafHash(script, tapLeafVersion(version))
    };
  }
  if (tree.length !== 2)
    tree = taprootListToTree(tree);
  if (tree.length !== 2)
    throw new Error("hashTree: non binary tree!");
  const left = taprootHashTree(tree[0], internalPubKey, allowUnknownOutputs, customScripts2);
  const right = taprootHashTree(tree[1], internalPubKey, allowUnknownOutputs, customScripts2);
  let [lH, rH] = [left.hash, right.hash];
  if (compareBytes(rH, lH) === -1)
    [lH, rH] = [rH, lH];
  return {
    type: "branch",
    left,
    right,
    hash: tagSchnorr("TapBranch", lH, rH)
  };
}
var TAP_LEAF_VERSION = 192;
var tapLeafVersion = (version) => {
  if (version === void 0)
    return TAP_LEAF_VERSION;
  anumber2(version, "leafVersion");
  if (version > 254 || version === 80 || !!(version & 1))
    throw new Error(`P2TR: invalid leafVersion=${version}`);
  return version;
};
var tapLeafHash = (script, version = TAP_LEAF_VERSION) => tagSchnorr("TapLeaf", new Uint8Array([tapLeafVersion(version)]), VarBytes.encode(script));
function p2tr(internalPubKey, tree, network = NETWORK, allowUnknownOutputs = false, customScripts2) {
  if (!internalPubKey && !tree)
    throw new Error("p2tr: should have pubKey or scriptTree (or both)");
  const pubKey = typeof internalPubKey === "string" ? hex3.decode(internalPubKey) : internalPubKey || TAPROOT_UNSPENDABLE_KEY;
  if (!isValidPubkey(pubKey, PubT.schnorr))
    throw new Error("p2tr: non-schnorr pubkey");
  if (tree) {
    let hashedTree = taprootAddPath(taprootHashTree(tree, pubKey, allowUnknownOutputs, customScripts2));
    const tapMerkleRoot = hashedTree.hash;
    const [tweakedPubkey, parity] = taprootTweakPubkey(pubKey, tapMerkleRoot);
    const leaves = taprootWalkTree(hashedTree).map((l) => {
      const version = tapLeafVersion(l.version);
      return {
        ...l,
        // Leaf versions are stored as the base even byte; only the control block adds the
        // output-key parity bit required by BIP 341 script-path spending.
        controlBlock: TaprootControlBlock.encode({
          version: version + parity,
          internalKey: pubKey,
          merklePath: l.path
        })
      };
    });
    return {
      type: "tr",
      script: OutScript.encode({ type: "tr", pubkey: tweakedPubkey }),
      address: Address(network).encode({ type: "tr", pubkey: tweakedPubkey }),
      // For tests
      tweakedPubkey,
      // PSBT stuff
      tapInternalKey: pubKey,
      leaves,
      tapLeafScript: leaves.map((l) => [
        TaprootControlBlock.decode(l.controlBlock),
        concatBytes4(l.script, new Uint8Array([tapLeafVersion(l.version)]))
      ]),
      tapMerkleRoot
    };
  } else {
    const tweakedPubkey = taprootTweakPubkey(pubKey, EMPTY)[0];
    return {
      type: "tr",
      script: OutScript.encode({ type: "tr", pubkey: tweakedPubkey }),
      address: Address(network).encode({ type: "tr", pubkey: tweakedPubkey }),
      // For tests
      tweakedPubkey,
      // PSBT stuff
      tapInternalKey: pubKey
    };
  }
}
var base58check = /* @__PURE__ */ createBase58check(sha2562);
function validateWitness(version, data) {
  if (data.length < 2 || data.length > 40)
    throw new Error("Witness: invalid length");
  if (version > 16)
    throw new Error("Witness: invalid version");
  if (version === 0 && !(data.length === 20 || data.length === 32))
    throw new Error("Witness: invalid length for version");
}
function programToWitness(version, data, network = NETWORK) {
  validateWitness(version, data);
  const coder = version === 0 ? bech32 : bech32m;
  return coder.encode(network.bech32, [version].concat(coder.toWords(data)));
}
function formatKey(hashed, prefix2) {
  return base58check.encode(concatBytes4(Uint8Array.from(prefix2), hashed));
}
function WIF(network = NETWORK) {
  return {
    encode(privKey) {
      abytes3(privKey, 32, "privKey");
      const compressed = concatBytes4(privKey, new Uint8Array([1]));
      return formatKey(compressed.subarray(0, 33), [network.wif]);
    },
    decode(wif) {
      let parsed = base58check.decode(wif);
      if (parsed[0] !== network.wif)
        throw new Error("Wrong WIF prefix");
      parsed = parsed.subarray(1);
      if (parsed.length !== 33)
        throw new Error("Wrong WIF length");
      if (parsed[32] !== 1)
        throw new Error("Wrong WIF postfix");
      return parsed.subarray(0, -1);
    }
  };
}
function Address(network = NETWORK) {
  return {
    encode(from) {
      const { type } = from;
      if (type === "wpkh")
        return programToWitness(0, from.hash, network);
      else if (type === "wsh")
        return programToWitness(0, from.hash, network);
      else if (type === "tr")
        return programToWitness(1, from.pubkey, network);
      else if (type === "pkh")
        return formatKey(from.hash, [network.pubKeyHash]);
      else if (type === "sh")
        return formatKey(from.hash, [network.scriptHash]);
      throw new Error(`Unknown address type=${type}`);
    },
    decode(address) {
      if (address.length < 14 || address.length > 74)
        throw new Error("Invalid address length");
      if (network.bech32 && address.toLowerCase().startsWith(`${network.bech32}1`)) {
        let res;
        try {
          res = bech32.decode(address);
          if (res.words[0] !== 0)
            throw new Error(`bech32: wrong version=${res.words[0]}`);
        } catch (_) {
          res = bech32m.decode(address);
          if (res.words[0] === 0)
            throw new Error(`bech32m: wrong version=${res.words[0]}`);
        }
        if (res.prefix !== network.bech32)
          throw new Error(`wrong bech32 prefix=${res.prefix}`);
        const [version, ...program] = res.words;
        const data2 = bech32.fromWords(program);
        validateWitness(version, data2);
        if (version === 0 && data2.length === 32)
          return { type: "wsh", hash: data2 };
        else if (version === 0 && data2.length === 20)
          return { type: "wpkh", hash: data2 };
        else if (version === 1 && data2.length === 32)
          return { type: "tr", pubkey: data2 };
        else
          throw new Error("Unknown witness program");
      }
      const data = base58check.decode(address);
      if (data.length !== 21)
        throw new Error("Invalid base58 address");
      if (data[0] === network.pubKeyHash) {
        return { type: "pkh", hash: data.slice(1) };
      } else if (data[0] === network.scriptHash) {
        return {
          type: "sh",
          hash: data.slice(1)
        };
      }
      throw new Error(`Invalid address prefix=${data[0]}`);
    }
  };
}

// node_modules/@scure/btc-signer/transaction.js
var EMPTY32 = /* @__PURE__ */ new Uint8Array(32);
var EMPTY_OUTPUT = {
  amount: 0xffffffffffffffffn,
  script: EMPTY
};
var toVsize = (weight) => Math.ceil(weight / 4);
var stripCodeSeparator = (script) => {
  let start = 0;
  const out = [];
  for (let i = 0; i < script.length; ) {
    const pos = i;
    const op = script[i++];
    if (op === OP.CODESEPARATOR) {
      if (start < pos)
        out.push(script.subarray(start, pos));
      start = i;
      continue;
    }
    const len = scriptPushLen(op, (bytes) => {
      if (i + bytes > script.length)
        throw new Error("Unexpected end of script");
      let len2 = 0;
      for (let j = 0; j < bytes; j++)
        len2 |= script[i + j] << 8 * j;
      i += bytes;
      return len2;
    });
    if (len === void 0)
      continue;
    i += len;
    if (i > script.length)
      throw new Error("Unexpected end of script");
  }
  if (start === 0)
    return script;
  if (start < script.length)
    out.push(script.subarray(start));
  return out.length ? concatBytes4(...out) : EMPTY;
};
var DEFAULT_VERSION = 2;
var DEFAULT_LOCKTIME = 0;
var DEFAULT_SEQUENCE = 4294967295;
var def = (value, def2) => value === void 0 ? def2 : value;
function cloneDeep(obj) {
  if (Array.isArray(obj))
    return obj.map((i) => cloneDeep(i));
  else if (isBytes6(obj))
    return Uint8Array.from(obj);
  else if (["number", "bigint", "boolean", "string", "undefined"].includes(typeof obj))
    return obj;
  else if (obj === null)
    return obj;
  else if (typeof obj === "object") {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, cloneDeep(v)]));
  }
  throw new Error(`cloneDeep: unknown type=${typeof obj}`);
}
var SignatureHash = /* @__PURE__ */ (() => Object.freeze({
  DEFAULT: 0,
  ALL: 1,
  NONE: 2,
  SINGLE: 3,
  ANYONECANPAY: 128
}))();
var SigHash = /* @__PURE__ */ (() => Object.freeze({
  DEFAULT: SignatureHash.DEFAULT,
  ALL: SignatureHash.ALL,
  NONE: SignatureHash.NONE,
  SINGLE: SignatureHash.SINGLE,
  // BIP341 only permits 0x00, 0x01, 0x02, 0x03, 0x81, 0x82, and 0x83 for taproot, so
  // the mechanical `DEFAULT | ANYONECANPAY` combination (0x80) is invalid and not exported.
  // DEFAULT_ANYONECANPAY: SignatureHash.DEFAULT | SignatureHash.ANYONECANPAY,
  ALL_ANYONECANPAY: SignatureHash.ALL | SignatureHash.ANYONECANPAY,
  NONE_ANYONECANPAY: SignatureHash.NONE | SignatureHash.ANYONECANPAY,
  SINGLE_ANYONECANPAY: SignatureHash.SINGLE | SignatureHash.ANYONECANPAY
}))();
var SigHashNames = /* @__PURE__ */ (() => Object.freeze(reverseObject(SigHash)))();
function getTaprootKeys(privKey, pubKey, internalKey, merkleRoot = EMPTY) {
  if (equalBytes2(internalKey, pubKey)) {
    privKey = taprootTweakPrivKey(privKey, merkleRoot);
    pubKey = pubSchnorr(privKey);
  }
  return { privKey, pubKey };
}
function outputBeforeSign(i) {
  if (i.script === void 0 || i.amount === void 0)
    throw new Error("Transaction/output: script and amount required");
  return { script: i.script, amount: i.amount };
}
function inputBeforeSign(i) {
  if (i.txid === void 0 || i.index === void 0)
    throw new Error("Transaction/input: txid and index required");
  const res = {
    txid: i.txid,
    index: i.index,
    sequence: def(i.sequence, DEFAULT_SEQUENCE),
    finalScriptSig: def(i.finalScriptSig, EMPTY)
  };
  RawInput.encode(res);
  return res;
}
function cleanFinalInput(i) {
  const _i = i;
  for (const _k in _i) {
    const k = _k;
    if (!PSBTInputFinalKeys.includes(k))
      delete _i[k];
  }
}
var TxHashIdx = /* @__PURE__ */ (() => struct({ txid: createBytes(32, true), index: U32LE }))();
function validateSigHash(s) {
  if (typeof s !== "number" || typeof SigHashNames[s] !== "string")
    throw new Error(`Invalid SigHash=${s}`);
  return s;
}
function unpackSighash(hashType) {
  const masked = hashType & 31;
  return {
    isAny: !!(hashType & SignatureHash.ANYONECANPAY),
    isNone: masked === SignatureHash.NONE,
    isSingle: masked === SignatureHash.SINGLE
  };
}
function validateOpts(opts) {
  if (opts !== void 0 && {}.toString.call(opts) !== "[object Object]")
    throw new Error(`Wrong object type for transaction options: ${opts}`);
  const _opts = {
    ...opts,
    // Defaults
    version: def(opts.version, DEFAULT_VERSION),
    lockTime: def(opts.lockTime, 0),
    PSBTVersion: def(opts.PSBTVersion, 0)
  };
  if (typeof _opts.allowUnknowInput !== "undefined")
    _opts.allowUnknownInputs = _opts.allowUnknowInput;
  if (typeof _opts.allowUnknowOutput !== "undefined")
    _opts.allowUnknownOutputs = _opts.allowUnknowOutput;
  if (typeof _opts.lockTime !== "number")
    throw new Error("Transaction lock time should be number");
  U32LE.encode(_opts.lockTime);
  if (_opts.PSBTVersion !== 0 && _opts.PSBTVersion !== 2)
    throw new Error(`Unknown PSBT version ${_opts.PSBTVersion}`);
  for (const k of [
    "allowUnknownVersion",
    "allowUnknownOutputs",
    "allowUnknownInputs",
    "disableScriptCheck",
    "bip174jsCompat",
    "allowLegacyWitnessUtxo",
    "lowR"
  ]) {
    const v = _opts[k];
    if (v === void 0)
      continue;
    if (typeof v !== "boolean")
      throw new Error(`Transation options wrong type: ${k}=${v} (${typeof v})`);
  }
  if (_opts.allowUnknownVersion ? typeof _opts.version === "number" : ![-1, 0, 1, 2, 3].includes(_opts.version))
    throw new Error(`Unknown version: ${_opts.version}`);
  if (_opts.customScripts !== void 0) {
    const cs = _opts.customScripts;
    if (!Array.isArray(cs)) {
      throw new Error(`wrong custom scripts type (expected array): customScripts=${cs} (${typeof cs})`);
    }
    for (const s of cs) {
      if (typeof s.encode !== "function" || typeof s.decode !== "function")
        throw new Error(`wrong script=${s} (${typeof s})`);
      if (s.finalizeTaproot !== void 0 && typeof s.finalizeTaproot !== "function")
        throw new Error(`wrong script=${s} (${typeof s})`);
    }
  }
  return Object.freeze(_opts);
}
function validateInput(i) {
  const _i = i;
  if (_i.nonWitnessUtxo && _i.index !== void 0) {
    const last = _i.nonWitnessUtxo.outputs.length - 1;
    if (_i.index > last)
      throw new Error(`validateInput: index(${_i.index}) not in nonWitnessUtxo`);
    const prevOut = _i.nonWitnessUtxo.outputs[_i.index];
    if (_i.witnessUtxo && (!equalBytes2(_i.witnessUtxo.script, prevOut.script) || _i.witnessUtxo.amount !== prevOut.amount))
      throw new Error("validateInput: witnessUtxo different from nonWitnessUtxo");
    if (_i.txid) {
      const outputs = _i.nonWitnessUtxo.outputs;
      if (outputs.length - 1 < _i.index)
        throw new Error("nonWitnessUtxo: incorect output index");
      const tx = Transaction.fromRaw(RawTx.encode(_i.nonWitnessUtxo), {
        allowUnknownOutputs: true,
        disableScriptCheck: true,
        allowUnknownInputs: true
      });
      const txid = hex3.encode(_i.txid);
      if (tx.id !== txid)
        throw new Error(`nonWitnessUtxo: wrong txid, exp=${txid} got=${tx.id}`);
    }
  }
  return _i;
}
function getPrevOut(input) {
  const _input = input;
  if (_input.nonWitnessUtxo) {
    if (_input.index === void 0)
      throw new Error("Unknown input index");
    if (!Number.isSafeInteger(_input.index) || _input.index < 0 || _input.index >= _input.nonWitnessUtxo.outputs.length)
      throw new Error(`Wrong input index=${_input.index}`);
    return _input.nonWitnessUtxo.outputs[_input.index];
  } else if (_input.witnessUtxo)
    return _input.witnessUtxo;
  else
    throw new Error("Cannot find previous output info");
}
function normalizeInput(i, cur, allowedFields, disableScriptCheck = false, allowUnknown = false) {
  const _i = i;
  const _cur = cur;
  const _allowedFields = allowedFields;
  let { nonWitnessUtxo, txid } = _i;
  if (typeof nonWitnessUtxo === "string")
    nonWitnessUtxo = hex3.decode(nonWitnessUtxo);
  if (isBytes6(nonWitnessUtxo))
    nonWitnessUtxo = RawTx.decode(nonWitnessUtxo);
  if (!("nonWitnessUtxo" in _i) && nonWitnessUtxo === void 0)
    nonWitnessUtxo = _cur?.nonWitnessUtxo;
  if (typeof txid === "string")
    txid = hex3.decode(txid);
  if (txid === void 0)
    txid = _cur?.txid;
  let res = { ..._cur, ..._i, nonWitnessUtxo, txid };
  if (!("nonWitnessUtxo" in _i) && res.nonWitnessUtxo === void 0)
    delete res.nonWitnessUtxo;
  if (res.sequence === void 0)
    res.sequence = DEFAULT_SEQUENCE;
  if (res.tapMerkleRoot === null)
    delete res.tapMerkleRoot;
  res = mergeKeyMap(PSBTInput, res, _cur, _allowedFields, allowUnknown);
  PSBTInputCoder.encode(res);
  let prevOut;
  if (res.nonWitnessUtxo && res.index !== void 0)
    prevOut = res.nonWitnessUtxo.outputs[res.index];
  else if (res.witnessUtxo)
    prevOut = res.witnessUtxo;
  if (prevOut && !disableScriptCheck)
    checkScript(prevOut && prevOut.script, res.redeemScript, res.witnessScript);
  return res;
}
function getInputType(input, allowLegacyWitnessUtxo = false) {
  const _input = input;
  let txType = "legacy";
  let defaultSighash = SignatureHash.ALL;
  const prevOut = getPrevOut(_input);
  const first = OutScript.decode(prevOut.script);
  let type = first.type;
  let cur = first;
  const stack = [first];
  if (first.type === "tr") {
    defaultSighash = SignatureHash.DEFAULT;
    return {
      txType: "taproot",
      type: "tr",
      last: first,
      lastScript: prevOut.script,
      defaultSighash,
      sighash: _input.sighashType || defaultSighash
    };
  } else {
    if (first.type === "wpkh" || first.type === "wsh")
      txType = "segwit";
    if (first.type === "sh") {
      if (!_input.redeemScript)
        throw new Error("inputType: sh without redeemScript");
      let child = OutScript.decode(_input.redeemScript);
      if (child.type === "wpkh" || child.type === "wsh")
        txType = "segwit";
      stack.push(child);
      cur = child;
      type += `-${child.type}`;
    }
    if (cur.type === "wsh") {
      if (!_input.witnessScript)
        throw new Error("inputType: wsh without witnessScript");
      let child = OutScript.decode(_input.witnessScript);
      if (child.type === "wsh")
        txType = "segwit";
      stack.push(child);
      cur = child;
      type += `-${child.type}`;
    }
    const last = stack[stack.length - 1];
    if (last.type === "sh" || last.type === "wsh")
      throw new Error("inputType: sh/wsh cannot be terminal type");
    const lastScript = OutScript.encode(last);
    const res = {
      type,
      txType,
      last,
      lastScript,
      defaultSighash,
      sighash: _input.sighashType || defaultSighash
    };
    if (txType === "legacy" && !allowLegacyWitnessUtxo && !_input.nonWitnessUtxo) {
      throw new Error(`Transaction/sign: legacy input without nonWitnessUtxo, can result in attack that forces paying higher fees. Pass allowLegacyWitnessUtxo=true, if you sure`);
    }
    return res;
  }
}
var Transaction = class _Transaction {
  global = {};
  inputs = [];
  // use getInput()
  outputs = [];
  // use getOutput()
  opts;
  constructor(opts = {}) {
    const _opts = this.opts = validateOpts(opts);
    if (_opts.lockTime !== DEFAULT_LOCKTIME)
      this.global.fallbackLocktime = _opts.lockTime;
    this.global.txVersion = _opts.version;
  }
  // Import
  static fromRaw(raw, opts = {}) {
    const parsed = RawTx.decode(raw);
    const tx = new _Transaction({ ...opts, version: parsed.version, lockTime: parsed.lockTime });
    for (const o of parsed.outputs)
      tx.addOutput(o);
    tx.outputs = parsed.outputs;
    tx.inputs = parsed.inputs;
    if (parsed.witnesses) {
      for (let i = 0; i < parsed.witnesses.length; i++)
        tx.inputs[i].finalScriptWitness = parsed.witnesses[i];
    }
    return tx;
  }
  // PSBT
  static fromPSBT(psbt_, opts = {}) {
    let parsed;
    try {
      parsed = RawPSBTV0.decode(psbt_);
    } catch (e0) {
      try {
        parsed = RawPSBTV2.decode(psbt_);
      } catch (e2) {
        throw e0;
      }
    }
    const PSBTVersion = parsed.global.version || 0;
    if (PSBTVersion !== 0 && PSBTVersion !== 2)
      throw new Error(`Wrong PSBT version=${PSBTVersion}`);
    const unsigned = parsed.global.unsignedTx;
    const version = PSBTVersion === 0 ? unsigned?.version : parsed.global.txVersion;
    const lockTime = PSBTVersion === 0 ? unsigned?.lockTime : parsed.global.fallbackLocktime;
    const tx = new _Transaction({ ...opts, version, lockTime, PSBTVersion });
    const inputCount = PSBTVersion === 0 ? unsigned?.inputs.length : parsed.global.inputCount;
    tx.inputs = parsed.inputs.slice(0, inputCount).map((i, j) => validateInput({
      finalScriptSig: EMPTY,
      ...parsed.global.unsignedTx?.inputs[j],
      ...i
    }));
    const outputCount = PSBTVersion === 0 ? unsigned?.outputs.length : parsed.global.outputCount;
    tx.outputs = parsed.outputs.slice(0, outputCount).map((i, j) => ({
      ...i,
      ...parsed.global.unsignedTx?.outputs[j]
    }));
    tx.global = { ...parsed.global, txVersion: version };
    if (lockTime !== DEFAULT_LOCKTIME)
      tx.global.fallbackLocktime = lockTime;
    return tx;
  }
  // Prefer `global.version` when present so cross-version combiners can serialize at the highest
  // required PSBT version without mutating the frozen transaction options object.
  toPSBT(PSBTVersion = this.global.version || this.opts.PSBTVersion) {
    if (PSBTVersion !== 0 && PSBTVersion !== 2)
      throw new Error(`Wrong PSBT version=${PSBTVersion}`);
    const inputs = this.inputs.map((i) => (
      // For PSBTv0 the prevout txid/index live in global.unsignedTx rather than the input map, so
      // validate the full transaction input before version filtering drops those fields.
      cleanPSBTFields(PSBTVersion, PSBTInput, validateInput(i))
    ));
    for (const inp of inputs) {
      if (inp.partialSig && !inp.partialSig.length)
        delete inp.partialSig;
      if (inp.finalScriptSig && !inp.finalScriptSig.length)
        delete inp.finalScriptSig;
      if (inp.finalScriptWitness && !inp.finalScriptWitness.length)
        delete inp.finalScriptWitness;
    }
    const outputs = this.outputs.map((i) => cleanPSBTFields(PSBTVersion, PSBTOutput, i));
    const global2 = { ...this.global };
    if (PSBTVersion === 0) {
      global2.unsignedTx = RawOldTx.decode(RawOldTx.encode({
        version: this.version,
        lockTime: this.lockTime,
        inputs: this.inputs.map((i) => inputBeforeSign(i)).map((i) => ({
          ...i,
          finalScriptSig: EMPTY
        })),
        outputs: this.outputs.map((o) => outputBeforeSign(o))
      }));
      delete global2.fallbackLocktime;
      delete global2.txVersion;
      delete global2.inputCount;
      delete global2.outputCount;
      delete global2.version;
    } else {
      delete global2.unsignedTx;
      global2.version = PSBTVersion;
      global2.txVersion = this.version;
      global2.inputCount = this.inputs.length;
      global2.outputCount = this.outputs.length;
      if (global2.fallbackLocktime && global2.fallbackLocktime === DEFAULT_LOCKTIME)
        delete global2.fallbackLocktime;
    }
    if (this.opts.bip174jsCompat) {
      if (!inputs.length)
        inputs.push({});
      if (!outputs.length)
        outputs.push({});
    }
    const raw = { global: global2, inputs, outputs };
    return PSBTVersion === 0 ? RawPSBTV0.encode(raw) : RawPSBTV2.encode(raw);
  }
  // BIP370 lockTime (https://github.com/bitcoin/bips/blob/master/bip-0370.mediawiki#determining-lock-time)
  get lockTime() {
    let height = DEFAULT_LOCKTIME;
    let heightCnt = 0;
    let time = DEFAULT_LOCKTIME;
    let timeCnt = 0;
    for (const i of this.inputs) {
      if (i.requiredHeightLocktime) {
        height = Math.max(height, i.requiredHeightLocktime);
        heightCnt++;
      }
      if (i.requiredTimeLocktime) {
        time = Math.max(time, i.requiredTimeLocktime);
        timeCnt++;
      }
    }
    if (heightCnt && heightCnt >= timeCnt)
      return height;
    if (time !== DEFAULT_LOCKTIME)
      return time;
    return this.global.fallbackLocktime || DEFAULT_LOCKTIME;
  }
  get version() {
    if (this.global.txVersion === void 0)
      throw new Error("No global.txVersion");
    return this.global.txVersion;
  }
  inputStatus(idx) {
    this.checkInputIdx(idx);
    const input = this.inputs[idx];
    if (input.finalScriptSig && input.finalScriptSig.length)
      return "finalized";
    if (input.finalScriptWitness && input.finalScriptWitness.length)
      return "finalized";
    if (input.tapKeySig)
      return "signed";
    if (input.tapScriptSig && input.tapScriptSig.length)
      return "signed";
    if (input.partialSig && input.partialSig.length)
      return "signed";
    return "unsigned";
  }
  // Cannot replace unpackSighash, tests rely on very generic implemenetation with signing inputs outside of range
  // We will lose some vectors -> smaller test coverage of preimages (very important!)
  inputSighash(idx) {
    this.checkInputIdx(idx);
    const inputSighash = this.inputs[idx].sighashType;
    const sighash = inputSighash === void 0 ? SignatureHash.DEFAULT : inputSighash;
    const sigOutputs = sighash === SignatureHash.DEFAULT ? SignatureHash.ALL : sighash & 3;
    const sigInputs = sighash & SignatureHash.ANYONECANPAY;
    return { sigInputs, sigOutputs };
  }
  // Very nice for debug purposes, but slow. If there is too much inputs/outputs to add, will be quadratic.
  // Some cache will be nice, but there chance to have bugs with cache invalidation
  signStatus() {
    let addInput = true, addOutput = true;
    let inputs = [], outputs = [];
    for (let idx = 0; idx < this.inputs.length; idx++) {
      const status = this.inputStatus(idx);
      if (status === "unsigned")
        continue;
      const { sigInputs, sigOutputs } = this.inputSighash(idx);
      if (sigInputs === SignatureHash.ANYONECANPAY)
        inputs.push(idx);
      else
        addInput = false;
      if (sigOutputs === SignatureHash.ALL)
        addOutput = false;
      else if (sigOutputs === SignatureHash.SINGLE)
        outputs.push(idx);
      else if (sigOutputs === SignatureHash.NONE) {
      } else
        throw new Error(`Wrong signature hash output type: ${sigOutputs}`);
    }
    return { addInput, addOutput, inputs, outputs };
  }
  get isFinal() {
    for (let idx = 0; idx < this.inputs.length; idx++)
      if (this.inputStatus(idx) !== "finalized")
        return false;
    return true;
  }
  // Info utils
  get hasWitnesses() {
    let out = false;
    for (const i of this.inputs)
      if (i.finalScriptWitness && i.finalScriptWitness.length)
        out = true;
    return out;
  }
  // https://en.bitcoin.it/wiki/Weight_units
  get weight() {
    if (!this.isFinal)
      throw new Error("Transaction is not finalized");
    let out = 32;
    const outputs = this.outputs.map(outputBeforeSign);
    out += 4 * CompactSizeLen.encode(this.outputs.length).length;
    for (const o of outputs)
      out += 32 + 4 * VarBytes.encode(o.script).length;
    if (this.hasWitnesses)
      out += 2;
    out += 4 * CompactSizeLen.encode(this.inputs.length).length;
    for (const i of this.inputs) {
      out += 160 + 4 * VarBytes.encode(i.finalScriptSig || EMPTY).length;
      if (this.hasWitnesses)
        out += RawWitness.encode(i.finalScriptWitness || []).length;
    }
    return out;
  }
  get vsize() {
    return toVsize(this.weight);
  }
  toBytes(withScriptSig = false, withWitness = false) {
    return RawTx.encode({
      version: this.version,
      lockTime: this.lockTime,
      inputs: this.inputs.map(inputBeforeSign).map((i) => ({
        ...i,
        finalScriptSig: withScriptSig && i.finalScriptSig || EMPTY
      })),
      outputs: this.outputs.map(outputBeforeSign),
      witnesses: this.inputs.map((i) => i.finalScriptWitness || []),
      segwitFlag: withWitness && this.hasWitnesses
    });
  }
  get unsignedTx() {
    return this.toBytes(false, false);
  }
  get hex() {
    return hex3.encode(this.toBytes(true, this.hasWitnesses));
  }
  get hash() {
    return hex3.encode(sha256x2(this.toBytes(true)));
  }
  get id() {
    return hex3.encode(sha256x2(this.toBytes(true)).reverse());
  }
  // Input stuff
  checkInputIdx(idx) {
    if (!Number.isSafeInteger(idx) || 0 > idx || idx >= this.inputs.length)
      throw new Error(`Wrong input index=${idx}`);
  }
  getInput(idx) {
    this.checkInputIdx(idx);
    return cloneDeep(this.inputs[idx]);
  }
  get inputsLength() {
    return this.inputs.length;
  }
  // Modification
  addInput(input, _ignoreSignStatus = false) {
    if (!_ignoreSignStatus && !this.signStatus().addInput)
      throw new Error("Tx has signed inputs, cannot add new one");
    this.inputs.push(cloneDeep(normalizeInput(input, void 0, void 0, this.opts.disableScriptCheck)));
    return this.inputs.length - 1;
  }
  updateInput(idx, input, _ignoreSignStatus = false) {
    this.checkInputIdx(idx);
    let allowedFields = void 0;
    if (!_ignoreSignStatus) {
      const status = this.signStatus();
      if (!status.addInput || status.inputs.includes(idx))
        allowedFields = PSBTInputUnsignedKeys;
    }
    this.inputs[idx] = cloneDeep(normalizeInput(input, this.inputs[idx], allowedFields, this.opts.disableScriptCheck, this.opts.allowUnknown));
  }
  // Output stuff
  checkOutputIdx(idx) {
    if (!Number.isSafeInteger(idx) || 0 > idx || idx >= this.outputs.length)
      throw new Error(`Wrong output index=${idx}`);
  }
  getOutput(idx) {
    this.checkOutputIdx(idx);
    return cloneDeep(this.outputs[idx]);
  }
  getOutputAddress(idx, network = NETWORK) {
    const out = this.getOutput(idx);
    if (!out.script)
      return;
    return Address(network).encode(OutScript.decode(out.script));
  }
  get outputsLength() {
    return this.outputs.length;
  }
  normalizeOutput(o, cur, allowedFields) {
    let { amount, script } = o;
    if (amount === void 0)
      amount = cur?.amount;
    if (typeof amount !== "bigint")
      throw new Error(`Wrong amount type, should be of type bigint in sats, but got ${amount} of type ${typeof amount}`);
    if (typeof script === "string")
      script = hex3.decode(script);
    if (script === void 0)
      script = cur?.script;
    let res = { ...cur, ...o, amount, script };
    if (res.amount === void 0)
      delete res.amount;
    res = mergeKeyMap(PSBTOutput, res, cur, allowedFields, this.opts.allowUnknown);
    PSBTOutputCoder.encode(res);
    if (res.script && !this.opts.allowUnknownOutputs && OutScript.decode(res.script).type === "unknown") {
      throw new Error("Transaction/output: unknown output script type, there is a chance that input is unspendable. Pass allowUnknownOutputs=true, if you sure");
    }
    if (!this.opts.disableScriptCheck)
      checkScript(res.script, res.redeemScript, res.witnessScript);
    return res;
  }
  addOutput(o, _ignoreSignStatus = false) {
    if (!_ignoreSignStatus && !this.signStatus().addOutput)
      throw new Error("Tx has signed outputs, cannot add new one");
    this.outputs.push(cloneDeep(this.normalizeOutput(o)));
    return this.outputs.length - 1;
  }
  updateOutput(idx, output, _ignoreSignStatus = false) {
    this.checkOutputIdx(idx);
    let allowedFields = void 0;
    if (!_ignoreSignStatus) {
      const status = this.signStatus();
      if (!status.addOutput || status.outputs.includes(idx))
        allowedFields = PSBTOutputUnsignedKeys;
    }
    this.outputs[idx] = cloneDeep(this.normalizeOutput(output, this.outputs[idx], allowedFields));
  }
  addOutputAddress(address, amount, network = NETWORK) {
    return this.addOutput({
      // Address.decode() only returns recognized descriptors here, but its wrapped output type
      // still carries `undefined` for coder parity, so narrow before feeding OutScript.encode().
      script: OutScript.encode(Address(network).decode(address)),
      amount
    });
  }
  // Utils
  get fee() {
    let res = 0n;
    for (const i of this.inputs) {
      const prevOut = getPrevOut(i);
      if (!prevOut)
        throw new Error("Empty input amount");
      res += prevOut.amount;
    }
    const outputs = this.outputs.map(outputBeforeSign);
    for (const o of outputs)
      res -= o.amount;
    return res;
  }
  // Signing
  // Based on https://github.com/bitcoin/bitcoin/blob/5871b5b5ab57a0caf9b7514eb162c491c83281d5/test/functional/test_framework/script.py#L624
  // There is optimization opportunity to re-use hashes for multiple inputs for witness v0/v1,
  // but we are trying to be less complicated for audit purpose for now.
  preimageLegacy(idx, prevOutScript, hashType) {
    const { isAny, isNone, isSingle } = unpackSighash(hashType);
    if (idx < 0 || !Number.isSafeInteger(idx))
      throw new Error(`Invalid input idx=${idx}`);
    if (isSingle && idx >= this.outputs.length || idx >= this.inputs.length)
      return U256BE.encode(1n);
    prevOutScript = stripCodeSeparator(prevOutScript);
    let inputs = this.inputs.map(inputBeforeSign).map((input, inputIdx) => ({
      ...input,
      finalScriptSig: inputIdx === idx ? prevOutScript : EMPTY
    }));
    if (isAny)
      inputs = [inputs[idx]];
    else if (isNone || isSingle) {
      inputs = inputs.map((input, inputIdx) => ({
        ...input,
        sequence: inputIdx === idx ? input.sequence : 0
      }));
    }
    let outputs = this.outputs.map(outputBeforeSign);
    if (isNone)
      outputs = [];
    else if (isSingle) {
      outputs = outputs.slice(0, idx).fill(EMPTY_OUTPUT).concat([outputs[idx]]);
    }
    const tmpTx = RawTx.encode({
      lockTime: this.lockTime,
      version: this.version,
      segwitFlag: false,
      inputs,
      outputs
    });
    return sha256x2(tmpTx, I32LE.encode(hashType));
  }
  preimageWitnessV0(idx, prevOutScript, hashType, amount) {
    if (idx < 0 || !Number.isSafeInteger(idx) || idx >= this.inputs.length)
      throw new Error(`Invalid input idx=${idx}`);
    const { isAny, isNone, isSingle } = unpackSighash(hashType);
    let inputHash = EMPTY32;
    let sequenceHash = EMPTY32;
    let outputHash = EMPTY32;
    const inputs = this.inputs.map(inputBeforeSign);
    const outputs = this.outputs.map(outputBeforeSign);
    if (!isAny)
      inputHash = sha256x2(...inputs.map(TxHashIdx.encode));
    if (!isAny && !isSingle && !isNone)
      sequenceHash = sha256x2(...inputs.map((i) => U32LE.encode(i.sequence)));
    if (!isSingle && !isNone) {
      outputHash = sha256x2(...outputs.map(RawOutput.encode));
    } else if (isSingle && idx < outputs.length)
      outputHash = sha256x2(RawOutput.encode(outputs[idx]));
    const input = inputs[idx];
    return sha256x2(I32LE.encode(this.version), inputHash, sequenceHash, createBytes(32, true).encode(input.txid), U32LE.encode(input.index), VarBytes.encode(prevOutScript), U64LE.encode(amount), U32LE.encode(input.sequence), outputHash, U32LE.encode(this.lockTime), U32LE.encode(hashType));
  }
  preimageWitnessV1(idx, prevOutScript, hashType, amount, codeSeparator = -1, leafScript, leafVer = 192, annex) {
    if (!Array.isArray(amount) || this.inputs.length !== amount.length)
      throw new Error(`Invalid amounts array=${amount}`);
    if (!Array.isArray(prevOutScript) || this.inputs.length !== prevOutScript.length)
      throw new Error(`Invalid prevOutScript array=${prevOutScript}`);
    if (idx < 0 || !Number.isSafeInteger(idx) || idx >= this.inputs.length)
      throw new Error(`Invalid input idx=${idx}`);
    const out = [
      U8.encode(0),
      U8.encode(hashType),
      // U8 sigHash
      I32LE.encode(this.version),
      U32LE.encode(this.lockTime)
    ];
    const outType = hashType === SignatureHash.DEFAULT ? SignatureHash.ALL : hashType & 3;
    const inType = hashType & SignatureHash.ANYONECANPAY;
    const inputs = this.inputs.map(inputBeforeSign);
    const outputs = this.outputs.map(outputBeforeSign);
    if (inType !== SignatureHash.ANYONECANPAY) {
      out.push(...[
        inputs.map(TxHashIdx.encode),
        amount.map(U64LE.encode),
        prevOutScript.map(VarBytes.encode),
        inputs.map((i) => U32LE.encode(i.sequence))
      ].map((i) => sha2562(concatBytes4(...i))));
    }
    if (outType === SignatureHash.ALL) {
      out.push(sha2562(concatBytes4(...outputs.map(RawOutput.encode))));
    }
    const spendType = (annex ? 1 : 0) | (leafScript ? 2 : 0);
    out.push(new Uint8Array([spendType]));
    if (inType === SignatureHash.ANYONECANPAY) {
      const inp = inputs[idx];
      out.push(TxHashIdx.encode(inp), U64LE.encode(amount[idx]), VarBytes.encode(prevOutScript[idx]), U32LE.encode(inp.sequence));
    } else
      out.push(U32LE.encode(idx));
    if (spendType & 1)
      out.push(sha2562(VarBytes.encode(annex || EMPTY)));
    if (outType === SignatureHash.SINGLE)
      out.push(idx < outputs.length ? sha2562(RawOutput.encode(outputs[idx])) : EMPTY32);
    if (leafScript)
      out.push(tapLeafHash(leafScript, leafVer), U8.encode(0), I32LE.encode(codeSeparator));
    return tagSchnorr("TapSighash", ...out);
  }
  // Signer can be privateKey OR instance of bip32 HD stuff
  signIdx(privateKey, idx, allowedSighash, _auxRand) {
    this.checkInputIdx(idx);
    const input = this.inputs[idx];
    const inputType = getInputType(input, this.opts.allowLegacyWitnessUtxo);
    const canSign = (privateKey2) => {
      if (inputType.txType === "taproot") {
        const pubKey2 = pubSchnorr(privateKey2);
        if (input.tapInternalKey && equalBytes2(pubKey2, input.tapInternalKey))
          return true;
        if (!input.tapLeafScript)
          return false;
        for (const [_, leaf] of input.tapLeafScript) {
          for (const op of Script.decode(leaf.subarray(0, -1))) {
            if (isBytes6(op) && equalBytes2(op, pubKey2))
              return true;
          }
        }
        return false;
      }
      const pubKey = pubECDSA(privateKey2);
      const pubKeyHash = hash160(pubKey);
      for (const op of Script.decode(inputType.lastScript)) {
        if (isBytes6(op) && (equalBytes2(op, pubKey) || equalBytes2(op, pubKeyHash)))
          return true;
      }
      return false;
    };
    if (!isBytes6(privateKey)) {
      const root = privateKey;
      const deriveSigners = (label, rows, pubKey) => {
        if (!rows || !rows.length)
          throw new Error(`${label}: empty`);
        const signers2 = rows.filter((row) => row.fingerprint == root.fingerprint).map((row) => {
          let s = root;
          for (const i of row.path)
            s = s.deriveChild(i);
          if (!equalBytes2(pubKey(s), row.pubKey))
            throw new Error(`${label}: wrong pubKey`);
          if (!s.privateKey)
            throw new Error(`${label}: no privateKey`);
          return s;
        });
        if (!signers2.length)
          throw new Error(`${label}: no items with fingerprint=${root.fingerprint}`);
        return signers2;
      };
      const signers = inputType.txType === "taproot" ? (
        // BIP371 PSBT_IN_TAP_BIP32_DERIVATION stores x-only pubkeys plus `der`, so taproot HD
        // signing must derive against that map instead of legacy bip32Derivation.
        deriveSigners("tapBip32Derivation", input.tapBip32Derivation?.map(([pubKey, { der }]) => ({
          pubKey,
          fingerprint: der.fingerprint,
          path: der.path
        })), (s) => s.publicKey.slice(1))
      ) : deriveSigners("bip32Derivation", input.bip32Derivation?.map(([pubKey, der]) => ({
        pubKey,
        fingerprint: der.fingerprint,
        path: der.path
      })), (s) => s.publicKey);
      let signed = false;
      for (const s of signers) {
        if (!canSign(s.privateKey))
          continue;
        if (this.signIdx(s.privateKey, idx, allowedSighash, _auxRand))
          signed = true;
      }
      if (signed)
        return true;
      if (inputType.txType === "taproot")
        throw new Error("No taproot scripts signed");
      throw new Error(`Input script doesn't have pubKey: ${inputType.lastScript}`);
    }
    if (!allowedSighash)
      allowedSighash = [inputType.defaultSighash];
    else
      allowedSighash.forEach(validateSigHash);
    const sighash = inputType.sighash;
    if (!allowedSighash.includes(sighash)) {
      throw new Error(`Input with not allowed sigHash=${sighash}. Allowed: ${allowedSighash.join(", ")}`);
    }
    const { sigOutputs } = this.inputSighash(idx);
    if (sigOutputs === SignatureHash.SINGLE && idx >= this.outputs.length) {
      throw new Error(`Input with sighash SINGLE, but there is no output with corresponding index=${idx}`);
    }
    const prevOut = getPrevOut(input);
    if (inputType.txType === "taproot") {
      const prevOuts = this.inputs.map(getPrevOut);
      const prevOutScript = prevOuts.map((i) => i.script);
      const amount = prevOuts.map((i) => i.amount);
      let signed = false;
      let schnorrPub = pubSchnorr(privateKey);
      let merkleRoot = input.tapMerkleRoot || EMPTY;
      if (input.tapInternalKey) {
        const { pubKey, privKey } = getTaprootKeys(privateKey, schnorrPub, input.tapInternalKey, merkleRoot);
        const [taprootPubKey, _] = taprootTweakPubkey(input.tapInternalKey, merkleRoot);
        if (equalBytes2(taprootPubKey, pubKey)) {
          const hash = this.preimageWitnessV1(idx, prevOutScript, sighash, amount);
          const sig = concatBytes4(signSchnorr(hash, privKey, _auxRand), sighash !== SignatureHash.DEFAULT ? new Uint8Array([sighash]) : EMPTY);
          this.updateInput(idx, { tapKeySig: sig }, true);
          signed = true;
        }
      }
      if (input.tapLeafScript) {
        input.tapScriptSig = input.tapScriptSig || [];
        for (const [_, _script] of input.tapLeafScript) {
          const script = _script.subarray(0, -1);
          const scriptDecoded = Script.decode(script);
          const ver = _script[_script.length - 1];
          const hash = tapLeafHash(script, ver);
          const pos = scriptDecoded.findIndex((i) => isBytes6(i) && equalBytes2(i, schnorrPub));
          if (pos === -1)
            continue;
          const msg = this.preimageWitnessV1(idx, prevOutScript, sighash, amount, void 0, script, ver);
          const sig = concatBytes4(signSchnorr(msg, privateKey, _auxRand), sighash !== SignatureHash.DEFAULT ? new Uint8Array([sighash]) : EMPTY);
          this.updateInput(idx, { tapScriptSig: [[{ pubKey: schnorrPub, leafHash: hash }, sig]] }, true);
          signed = true;
        }
      }
      if (!signed)
        throw new Error("No taproot scripts signed");
      return true;
    } else {
      const pubKey = pubECDSA(privateKey);
      let hasPubkey = false;
      const pubKeyHash = hash160(pubKey);
      for (const i of Script.decode(inputType.lastScript)) {
        if (isBytes6(i) && (equalBytes2(i, pubKey) || equalBytes2(i, pubKeyHash)))
          hasPubkey = true;
      }
      if (!hasPubkey)
        throw new Error(`Input script doesn't have pubKey: ${inputType.lastScript}`);
      let hash;
      if (inputType.txType === "legacy") {
        hash = this.preimageLegacy(idx, inputType.lastScript, sighash);
      } else if (inputType.txType === "segwit") {
        let script = inputType.lastScript;
        if (inputType.last.type === "wpkh")
          script = OutScript.encode({ type: "pkh", hash: inputType.last.hash });
        hash = this.preimageWitnessV0(idx, script, sighash, prevOut.amount);
      } else
        throw new Error(`Transaction/sign: unknown tx type: ${inputType.txType}`);
      const sig = signECDSA(hash, privateKey, this.opts.lowR);
      this.updateInput(idx, {
        partialSig: [[pubKey, concatBytes4(sig, new Uint8Array([sighash]))]]
      }, true);
    }
    return true;
  }
  // This is bad API. Will work if user creates and signs tx, but if
  // there is some complex workflow with exchanging PSBT and signing them,
  // then it is better to validate which output user signs. How could a better API look like?
  // Example: user adds input, sends to another party, then signs received input (mixer etc),
  // another user can add different input for same key and user will sign it.
  // Even worse: another user can add bip32 derivation, and spend money from different address.
  // Better api: signIdx
  sign(privateKey, allowedSighash, _auxRand) {
    let num2 = 0;
    for (let i = 0; i < this.inputs.length; i++) {
      try {
        if (this.signIdx(privateKey, i, allowedSighash, _auxRand))
          num2++;
      } catch (e) {
      }
    }
    if (!num2)
      throw new Error("No inputs signed");
    return num2;
  }
  finalizeIdx(idx) {
    this.checkInputIdx(idx);
    if (this.fee < 0n)
      throw new Error("Outputs spends more than inputs amount");
    const input = this.inputs[idx];
    const inputType = getInputType(input, this.opts.allowLegacyWitnessUtxo);
    if (inputType.txType === "taproot") {
      if (input.tapKeySig)
        input.finalScriptWitness = [input.tapKeySig];
      else if (input.tapLeafScript && input.tapScriptSig) {
        const leafs = input.tapLeafScript.sort((a, b) => TaprootControlBlock.encode(a[0]).length - TaprootControlBlock.encode(b[0]).length);
        for (const [cb, _script] of leafs) {
          const script = _script.slice(0, -1);
          const ver = _script[_script.length - 1];
          const outScript = OutScript.decode(script);
          const hash = tapLeafHash(script, ver);
          const scriptSig = input.tapScriptSig.filter((i) => equalBytes2(i[0].leafHash, hash));
          let signatures = [];
          if (outScript.type === "tr_ms") {
            const m = outScript.m;
            const pubkeys = outScript.pubkeys;
            let added = 0;
            for (const pub of pubkeys) {
              const sigIdx = scriptSig.findIndex((i) => equalBytes2(i[0].pubKey, pub));
              if (added === m || sigIdx === -1) {
                signatures.push(EMPTY);
                continue;
              }
              signatures.push(scriptSig[sigIdx][1]);
              added++;
            }
            if (added !== m)
              continue;
          } else if (outScript.type === "tr_ns") {
            for (const pub of outScript.pubkeys) {
              const sigIdx = scriptSig.findIndex((i) => equalBytes2(i[0].pubKey, pub));
              if (sigIdx === -1)
                continue;
              signatures.push(scriptSig[sigIdx][1]);
            }
            if (signatures.length !== outScript.pubkeys.length)
              continue;
          } else if (outScript.type === "unknown" && this.opts.allowUnknownInputs) {
            const scriptDecoded = Script.decode(script);
            signatures = scriptSig.map(([{ pubKey }, signature]) => {
              const pos = scriptDecoded.findIndex((i) => isBytes6(i) && equalBytes2(i, pubKey));
              if (pos === -1)
                throw new Error("finalize/taproot: cannot find position of pubkey in script");
              return { signature, pos };
            }).sort((a, b) => a.pos - b.pos).map((i) => i.signature);
            if (!signatures.length)
              continue;
          } else {
            const custom = this.opts.customScripts;
            if (custom) {
              for (const c of custom) {
                if (!c.finalizeTaproot)
                  continue;
                const scriptDecoded = Script.decode(script);
                const csEncoded = c.encode(scriptDecoded);
                if (csEncoded === void 0)
                  continue;
                const finalized = c.finalizeTaproot(script, csEncoded, scriptSig);
                if (!finalized)
                  continue;
                input.finalScriptWitness = finalized.concat(TaprootControlBlock.encode(cb));
                delete input.finalScriptSig;
                cleanFinalInput(input);
                return;
              }
            }
            throw new Error("Finalize: Unknown tapLeafScript");
          }
          input.finalScriptWitness = signatures.reverse().concat([script, TaprootControlBlock.encode(cb)]);
          break;
        }
        if (!input.finalScriptWitness)
          throw new Error("finalize/taproot: empty witness");
      } else
        throw new Error("finalize/taproot: unknown input");
      delete input.finalScriptSig;
      cleanFinalInput(input);
      return;
    }
    if (!input.partialSig || !input.partialSig.length)
      throw new Error("Not enough partial sign");
    let inputScript = EMPTY;
    let witness = [];
    if (inputType.last.type === "ms") {
      const m = inputType.last.m;
      const pubkeys = inputType.last.pubkeys;
      let signatures = [];
      for (const pub of pubkeys) {
        const sign = input.partialSig.find((s) => equalBytes2(pub, s[0]));
        if (!sign)
          continue;
        signatures.push(sign[1]);
      }
      signatures = signatures.slice(0, m);
      if (signatures.length !== m) {
        throw new Error(`Multisig: wrong signatures count, m=${m} n=${pubkeys.length} signatures=${signatures.length}`);
      }
      inputScript = Script.encode([0, ...signatures]);
    } else if (inputType.last.type === "pk") {
      inputScript = Script.encode([input.partialSig[0][1]]);
    } else if (inputType.last.type === "pkh") {
      inputScript = Script.encode([input.partialSig[0][1], input.partialSig[0][0]]);
    } else if (inputType.last.type === "wpkh") {
      inputScript = EMPTY;
      witness = [input.partialSig[0][1], input.partialSig[0][0]];
    } else if (inputType.last.type === "unknown" && !this.opts.allowUnknownInputs)
      throw new Error("Unknown inputs not allowed");
    let finalScriptSig, finalScriptWitness;
    if (inputType.type.includes("wsh-")) {
      if (inputScript.length && inputType.lastScript.length) {
        witness = Script.decode(inputScript).map((i) => {
          if (i === 0)
            return EMPTY;
          if (isBytes6(i))
            return i;
          throw new Error(`Wrong witness op=${i}`);
        });
      }
      witness = witness.concat(inputType.lastScript);
    }
    if (inputType.txType === "segwit")
      finalScriptWitness = witness;
    if (inputType.type.startsWith("sh-wsh-")) {
      finalScriptSig = Script.encode([Script.encode([0, sha2562(inputType.lastScript)])]);
    } else if (inputType.type.startsWith("sh-")) {
      finalScriptSig = Script.encode([...Script.decode(inputScript), inputType.lastScript]);
    } else if (inputType.type.startsWith("wsh-")) {
    } else if (inputType.txType !== "segwit")
      finalScriptSig = inputScript;
    if (!finalScriptSig && !finalScriptWitness)
      throw new Error("Unknown error finalizing input");
    if (finalScriptSig)
      input.finalScriptSig = finalScriptSig;
    if (finalScriptWitness)
      input.finalScriptWitness = finalScriptWitness;
    cleanFinalInput(input);
  }
  finalize() {
    for (let i = 0; i < this.inputs.length; i++)
      this.finalizeIdx(i);
  }
  extract() {
    if (!this.isFinal)
      throw new Error("Transaction has unfinalized inputs");
    if (!this.outputs.length)
      throw new Error("Transaction has no outputs");
    if (this.fee < 0n)
      throw new Error("Outputs spends more than inputs amount");
    return this.toBytes(true, true);
  }
  combine(other) {
    const PSBTVersion = Math.max(this.opts.PSBTVersion || 0, other.opts.PSBTVersion || 0);
    for (const k of ["version", "lockTime"]) {
      if (this.opts[k] !== other.opts[k]) {
        throw new Error(`Transaction/combine: different ${k} this=${this.opts[k]} other=${other.opts[k]}`);
      }
    }
    for (const k of ["inputs", "outputs"]) {
      if (this[k].length !== other[k].length) {
        throw new Error(`Transaction/combine: different ${k} length this=${this[k].length} other=${other[k].length}`);
      }
    }
    if (!equalBytes2(this.unsignedTx, other.unsignedTx))
      throw new Error(`Transaction/combine: different unsigned tx`);
    this.global = mergeKeyMap(PSBTGlobal, this.global, other.global, void 0, this.opts.allowUnknown);
    if (PSBTVersion)
      this.global.version = PSBTVersion;
    for (let i = 0; i < this.inputs.length; i++)
      this.updateInput(i, other.inputs[i], true);
    for (let i = 0; i < this.outputs.length; i++)
      this.updateOutput(i, other.outputs[i], true);
    return this;
  }
  clone() {
    return _Transaction.fromPSBT(this.toPSBT(), this.opts);
  }
};

// node_modules/@scure/btc-signer/index.js
var utils2 = /* @__PURE__ */ (() => Object.freeze({
  isBytes: isBytes6,
  concatBytes: concatBytes4,
  compareBytes,
  pubSchnorr,
  randomPrivateKeyBytes,
  taprootTweakPubkey
}))();

// node_modules/micro-ordinals/cbor.js
var _0n7 = /* @__PURE__ */ BigInt(0);
var _1n6 = /* @__PURE__ */ BigInt(1);
var MAX_U64 = /* @__PURE__ */ BigInt(2) ** /* @__PURE__ */ BigInt(64) - _1n6;
var isNegZero = (x) => x === 0 && 1 / x < 0;
var F16BE = wrap({
  encodeStream(w, value) {
    if (value === Infinity)
      return w.bytes(new Uint8Array([124, 0]));
    if (value === -Infinity)
      return w.bytes(new Uint8Array([252, 0]));
    if (Number.isNaN(value))
      return w.bytes(new Uint8Array([126, 0]));
    if (isNegZero(value))
      return w.bytes(new Uint8Array([128, 0]));
    throw w.err("f16: not implemented");
  },
  decodeStream: (r) => {
    const half = U16BE.decodeStream(r);
    const exp = (half & 31744) >> 10;
    const mant = half & 1023;
    let val;
    if (exp === 0)
      val = 6103515625e-14 * (mant / 1024);
    else if (exp !== 31)
      val = Math.pow(2, exp - 15) * (1 + mant / 1024);
    else
      val = mant ? NaN : Infinity;
    return half & 32768 ? -val : val;
  }
});
var INFO = bits(5);
var U64LEN = apply(U64BE, coders.numberBigint);
var CBOR_LIMITS = {
  24: [2 ** 8 - 1, U8, U8],
  25: [2 ** 16 - 1, U16BE, U16BE],
  26: [2 ** 32 - 1, U32BE, U32BE],
  27: [MAX_U64, U64BE, U64LEN]
};
var cborUint = wrap({
  encodeStream(w, value) {
    if (value < 24)
      return INFO.encodeStream(w, typeof value === "bigint" ? Number(value) : value);
    for (const ai in CBOR_LIMITS) {
      const [limit, intCoder, _] = CBOR_LIMITS[ai];
      if (value > limit)
        continue;
      INFO.encodeStream(w, Number(ai));
      return intCoder.encodeStream(w, value);
    }
    throw w.err(`cbor/uint: wrong value=${value}`);
  },
  decodeStream(r) {
    const ai = INFO.decodeStream(r);
    if (ai < 24)
      return ai;
    const row = CBOR_LIMITS[ai];
    if (!row)
      throw r.err(`cbor/uint wrong additional information=${ai}`);
    const intCoder = row[1];
    return intCoder.decodeStream(r);
  }
});
var cborNegint = wrap({
  encodeStream: (w, v) => cborUint.encodeStream(w, typeof v === "bigint" ? -(v + _1n6) : -(v + 1)),
  decodeStream(r) {
    const v = cborUint.decodeStream(r);
    return typeof v === "bigint" ? -_1n6 - v : -1 - v;
  }
});
var cborArrLength = (inner) => wrap({
  encodeStream(w, value) {
    if (value.length < 24) {
      INFO.encodeStream(w, value.length);
      array(value.length, inner).encodeStream(w, value);
      return;
    }
    for (const ai in CBOR_LIMITS) {
      const [limit, _, lenCoder] = CBOR_LIMITS[ai];
      if (value.length <= limit) {
        INFO.encodeStream(w, Number(ai));
        array(lenCoder, inner).encodeStream(w, value);
        return;
      }
    }
    throw w.err(`cbor/lengthArray: wrong value=${value}`);
  },
  decodeStream(r) {
    const ai = INFO.decodeStream(r);
    if (ai < 24)
      return array(ai, inner).decodeStream(r);
    if (ai === 31)
      return array(new Uint8Array([255]), inner).decodeStream(r);
    const row = CBOR_LIMITS[ai];
    if (!row)
      throw r.err(`cbor/lengthArray wrong length=${ai}`);
    const lenCoder = row[2];
    return array(lenCoder, inner).decodeStream(r);
  }
});
var cborLength = (fn, def2) => wrap({
  encodeStream(w, value) {
    if (Array.isArray(value))
      throw new Error("cbor/length: encoding indefinite-length strings not supported");
    const bytes = fn(null).encode(value);
    if (bytes.length < 24) {
      INFO.encodeStream(w, bytes.length);
      w.bytes(bytes);
      return;
    }
    for (const ai in CBOR_LIMITS) {
      const [limit, _, lenCoder] = CBOR_LIMITS[ai];
      if (bytes.length <= limit) {
        INFO.encodeStream(w, Number(ai));
        lenCoder.encodeStream(w, bytes.length);
        w.bytes(bytes);
        return;
      }
    }
    throw w.err(`cbor/lengthArray: wrong value=${value}`);
  },
  decodeStream(r) {
    const ai = INFO.decodeStream(r);
    if (ai < 24)
      return fn(ai).decodeStream(r);
    if (ai === 31)
      return array(new Uint8Array([255]), def2).decodeStream(r);
    const row = CBOR_LIMITS[ai];
    if (!row)
      throw r.err(`cbor/length wrong length=${ai}`);
    const lenCoder = row[2];
    return fn(lenCoder).decodeStream(r);
  }
});
var cborSimple = wrap({
  encodeStream(w, value) {
    if (value === false)
      return INFO.encodeStream(w, 20);
    if (value === true)
      return INFO.encodeStream(w, 21);
    if (value === null)
      return INFO.encodeStream(w, 22);
    if (value === void 0)
      return INFO.encodeStream(w, 23);
    if (typeof value !== "number")
      throw w.err(`cbor/simple: wrong value type=${typeof value}`);
    if (isNegZero(value) || Number.isNaN(value) || value === Infinity || value === -Infinity) {
      INFO.encodeStream(w, 25);
      return F16BE.encodeStream(w, value);
    }
    if (Math.fround(value) === value) {
      INFO.encodeStream(w, 26);
      return F32BE.encodeStream(w, value);
    }
    INFO.encodeStream(w, 27);
    return F64BE.encodeStream(w, value);
  },
  decodeStream(r) {
    const ai = INFO.decodeStream(r);
    if (ai === 20)
      return false;
    if (ai === 21)
      return true;
    if (ai === 22)
      return null;
    if (ai === 23)
      return void 0;
    if (ai === 25)
      return F16BE.decodeStream(r);
    if (ai === 26)
      return F32BE.decodeStream(r);
    if (ai === 27)
      return F64BE.decodeStream(r);
    throw r.err("cbor/simple: unassigned");
  }
});
var cborValue = mappedTag(bits(3), {
  uint: [0, cborUint],
  // An unsigned integer in the range 0..2^64-1 inclusive.
  negint: [1, cborNegint],
  // A negative integer in the range -2^64..-1 inclusive
  bytes: [2, lazy(() => cborLength(createBytes, cborValue))],
  // A byte string.
  string: [3, lazy(() => cborLength(string, cborValue))],
  // A text string (utf8)
  array: [4, cborArrLength(lazy(() => cborValue))],
  // An array of data items
  map: [5, lazy(() => cborArrLength(tuple([cborValue, cborValue])))],
  // Map pairs.
  tag: [6, tuple([cborUint, lazy(() => cborValue)])],
  // Tagged item.
  simple: [7, cborSimple]
  // Floats, simple values, and the "break" stop code.
});
var CBOR = /* @__PURE__ */ Object.freeze(apply(cborValue, {
  encode(from) {
    let value = from.data;
    if (from.TAG === "bytes") {
      if (utils2.isBytes(value))
        return value;
      const chunks = [];
      if (!Array.isArray(value))
        throw new Error(`CBOR: wrong indefinite-length bytestring=${value}`);
      for (const c of value) {
        if (c.TAG !== "bytes" || !utils2.isBytes(c.data))
          throw new Error(`CBOR: wrong indefinite-length bytestring=${c}`);
        chunks.push(c.data);
      }
      return utils2.concatBytes(...chunks);
    }
    if (from.TAG === "string") {
      if (typeof value === "string")
        return value;
      if (!Array.isArray(value))
        throw new Error(`CBOR: wrong indefinite-length string=${value}`);
      let res = "";
      for (const c of value) {
        if (c.TAG !== "string" || typeof c.data !== "string")
          throw new Error(`CBOR: wrong indefinite-length string=${c}`);
        res += c.data;
      }
      return res;
    }
    if (from.TAG === "array" && Array.isArray(value))
      value = value.map((i) => this.encode(i));
    if (from.TAG === "map" && typeof value === "object" && value !== null) {
      return Object.fromEntries(from.data.map(([k, v]) => [this.encode(k), this.encode(v)]));
    }
    if (from.TAG === "tag")
      throw new Error("not implemented");
    return value;
  },
  decode(data) {
    if (typeof data === "bigint") {
      return data < _0n7 ? { TAG: "negint", data } : { TAG: "uint", data };
    }
    if (typeof data === "string")
      return { TAG: "string", data };
    if (utils2.isBytes(data))
      return { TAG: "bytes", data };
    if (Array.isArray(data))
      return { TAG: "array", data: data.map((i) => this.decode(i)) };
    if (typeof data === "number" && Number.isSafeInteger(data) && !isNegZero(data)) {
      return data < 0 ? { TAG: "negint", data } : { TAG: "uint", data };
    }
    if (typeof data === "boolean" || typeof data === "number" || data === null || data === void 0) {
      return { TAG: "simple", data };
    }
    if (typeof data === "object") {
      return {
        TAG: "map",
        data: Object.entries(data).map((kv) => kv.map((i) => this.decode(i)))
      };
    }
    throw new Error("unknown type");
  }
}));

// node_modules/micro-ordinals/index.js
var PROTOCOL_ID = /* @__PURE__ */ utf8.decode("ord");
function splitChunks(buf) {
  const res = [];
  for (let i = 0; i < buf.length; i += MAX_SCRIPT_BYTE_LENGTH)
    res.push(buf.subarray(i, i + MAX_SCRIPT_BYTE_LENGTH));
  return res;
}
var RawInscriptionId = /* @__PURE__ */ tuple([
  createBytes(32, true),
  apply(bigint(4, true, false, false), coders.numberBigint)
]);
var InscriptionId = /* @__PURE__ */ Object.freeze({
  encode(data) {
    if (typeof data !== "string")
      throw new TypeError(`InscriptionId.encode: expected string, got ${typeof data}`);
    const [txId, index] = data.split("i", 2);
    const parsed = Number(index);
    if (`${parsed}` !== index || !Number.isSafeInteger(parsed) || parsed < 0)
      throw new RangeError(`InscriptionId wrong index: ${index}`);
    return RawInscriptionId.encode([hex.decode(txId), parsed]);
  },
  decode(data) {
    const [txId, index] = RawInscriptionId.decode(data);
    return `${hex.encode(txId)}i${index}`;
  }
});
var TagEnum = {
  // Would be simpler to have body tag here,
  // but body chunks don't have body tag near them
  contentType: 1,
  pointer: 2,
  parent: 3,
  metadata: 5,
  metaprotocol: 7,
  contentEncoding: 9,
  delegate: 11,
  rune: 13,
  note: 15
  // Unrecognized even tag makes inscription unbound
  // unbound: 66,
  // Odd fields are ignored
  // nop: 255,
};
var TagCoderInternal = /* @__PURE__ */ map(U8, TagEnum);
var TagCoders = /* @__PURE__ */ (() => Object.freeze({
  pointer: Object.freeze(bigint(8, true, false, false)),
  // U64
  contentType: Object.freeze(string(null)),
  parent: InscriptionId,
  metadata: CBOR,
  metaprotocol: Object.freeze(string(null)),
  contentEncoding: Object.freeze(string(null)),
  delegate: InscriptionId,
  rune: Object.freeze(bigint(16, true, false, false)),
  // U128
  note: Object.freeze(string(null))
  // unbound: P.bytes(null),
  // nop: P.bytes(null),
}))();
var TagCoder = /* @__PURE__ */ Object.freeze({
  encode(from) {
    const tmp = {};
    const unknown2 = [];
    for (const { tag: tag2, data } of from) {
      try {
        const tagName = TagCoderInternal.decode(tag2);
        if (!tmp[tagName])
          tmp[tagName] = [];
        tmp[tagName].push(data);
      } catch (e) {
        unknown2.push([tag2, data]);
      }
    }
    const res = {};
    if (unknown2.length)
      res.unknown = unknown2;
    for (const field in tmp) {
      if (field === "parent" && tmp[field].length > 1) {
        res[field] = tmp[field].map((i) => TagCoders.parent.decode(i));
        continue;
      }
      res[field] = TagCoders[field].decode(utils2.concatBytes(...tmp[field]));
    }
    return res;
  },
  decode(to) {
    const res = [];
    for (const field in to) {
      if (field === "unknown")
        continue;
      const tagName = TagCoderInternal.encode(field);
      if (field === "parent" && Array.isArray(to.parent)) {
        for (const p of to.parent)
          res.push({ tag: tagName, data: TagCoders.parent.encode(p) });
        continue;
      }
      let bytes = TagCoders[field].encode(to[field]);
      if (field === "pointer" && bytes.length === 0) {
        bytes = Uint8Array.of(0);
      }
      for (const data of splitChunks(bytes))
        res.push({ tag: tagName, data });
    }
    if (to.unknown) {
      if (!Array.isArray(to.unknown))
        throw new TypeError("ordinals/TagCoder: unknown should be array");
      for (const [tag2, data] of to.unknown)
        res.push({ tag: tag2, data });
    }
    return res;
  }
});
var parseEnvelopes = (script, pos = 0) => {
  if (typeof pos !== "number")
    throw new TypeError(`parseInscription: expected pos number, got ${typeof pos}`);
  if (!Number.isSafeInteger(pos) || pos < 0)
    throw new RangeError(`parseInscription: wrong pos=${pos}`);
  const envelopes = [];
  let stutter = false;
  main: for (; pos < script.length; pos++) {
    const instr = script[pos];
    if (instr !== 0)
      continue;
    if (script[pos + 1] !== "IF") {
      if (script[pos + 1] === 0)
        stutter = true;
      continue main;
    }
    if (!utils2.isBytes(script[pos + 2]) || !utils.equalBytes(script[pos + 2], PROTOCOL_ID)) {
      if (script[pos + 2] === 0)
        stutter = true;
      continue main;
    }
    let pushnum = false;
    const payload = [];
    for (let j = pos + 3; j < script.length; j++) {
      const op = script[j];
      if (op === "ENDIF") {
        envelopes.push({ start: pos + 3, end: j, pushnum, payload, stutter });
        pos = j;
        break;
      }
      if (op === "1NEGATE") {
        pushnum = true;
        payload.push(new Uint8Array([129]));
        continue;
      }
      if (typeof op === "number" && 1 <= op && op <= 16) {
        pushnum = true;
        payload.push(new Uint8Array([op]));
        continue;
      }
      if (utils2.isBytes(op) || op === 0) {
        payload.push(op);
        continue;
      }
      stutter = false;
      break;
    }
  }
  return envelopes;
};
function parseInscriptions(script, strict = false) {
  if (strict) {
    validateXOnlyPubkey("parseInscription: strict mode", script[0]);
    if (script[1] !== "CHECKSIG")
      throw new Error("parseInscription: strict mode expected CHECKSIG at script[1]");
  }
  const envelopes = parseEnvelopes(script);
  const inscriptions = [];
  let pos = 5;
  for (const envelope of envelopes) {
    if (strict && (envelope.stutter || envelope.pushnum))
      throw new Error("parseInscription: strict mode cannot encode cursed envelopes");
    if (strict && envelope.start !== pos)
      throw new Error(`parseInscription: strict mode expected envelope at ${pos}, got ${envelope.start}`);
    const { payload } = envelope;
    let i = 0;
    const tags = [];
    for (; i < payload.length && payload[i] !== 0; i += 2) {
      const tag2 = payload[i];
      const data = payload[i + 1];
      if (!utils2.isBytes(tag2))
        throw new Error("parseInscription: non-bytes tag");
      if (!utils2.isBytes(data))
        throw new Error("parseInscription: non-bytes tag data");
      tags.push({ tag: tag2, data });
    }
    while (payload[i] === 0 && i < payload.length)
      i++;
    const chunks = [];
    for (; i < payload.length; i++) {
      if (!utils2.isBytes(payload[i]))
        break;
      chunks.push(payload[i]);
    }
    inscriptions.push({
      tags: TagCoder.encode(tags),
      body: utils2.concatBytes(...chunks),
      cursed: envelope.pushnum || envelope.stutter
    });
    pos = envelope.end + 4;
  }
  if (pos - 3 !== script.length) {
    if (strict)
      throw new Error(`parseInscription: strict mode expected script length ${pos - 3}, got ${script.length}`);
    return;
  }
  return inscriptions;
}
function parseWitness(witness) {
  if (!Array.isArray(witness))
    throw new TypeError(`parseWitness: expected witness array, got ${typeof witness}`);
  if (witness.length !== 3)
    throw new RangeError(`parseWitness: expected 3 witness items, got ${witness.length}`);
  return parseInscriptions(Script.decode(witness[1]));
}
var validateXOnlyPubkey = (name, pubkey) => {
  if (!utils2.isBytes(pubkey))
    throw new TypeError(`${name}: expected pubkey bytes`);
  try {
    validatePubkey(pubkey, PubT.schnorr);
  } catch (e) {
    throw new RangeError(`${name}: expected valid 32-byte x-only pubkey`);
  }
};
var OutOrdinalReveal = /* @__PURE__ */ Object.freeze({
  encode(from) {
    const res = { type: "tr_ord_reveal" };
    try {
      res.inscriptions = parseInscriptions(from, true);
      res.pubkey = from[0];
    } catch (e) {
      return;
    }
    return res;
  },
  decode: (to) => {
    if (to.type !== "tr_ord_reveal")
      return;
    validateXOnlyPubkey("tr_ord_reveal/decode", to.pubkey);
    const out = [to.pubkey, "CHECKSIG"];
    for (const { tags, body } of to.inscriptions) {
      out.push(0, "IF", PROTOCOL_ID);
      const rawTags = TagCoder.decode(tags);
      for (const tag2 of rawTags)
        out.push(tag2.tag, tag2.data);
      out.push(0);
      for (const c of splitChunks(body))
        out.push(c);
      out.push("ENDIF");
    }
    return out;
  },
  finalizeTaproot: (script, parsed, signatures) => {
    if (!Array.isArray(signatures))
      throw new TypeError(`tr_ord_reveal/finalize: expected signatures array, got ${typeof signatures}`);
    if (signatures.length !== 1)
      throw new RangeError(`tr_ord_reveal/finalize: expected 1 signature, got ${signatures.length}`);
    const [{ pubKey }, sig] = signatures[0];
    if (!utils.equalBytes(pubKey, parsed.pubkey))
      return;
    return [sig, script];
  }
});
function p2tr_ord_reveal(pubkey, inscriptions) {
  validateXOnlyPubkey("p2tr_ord_reveal", pubkey);
  return {
    type: "tr",
    script: apply(Script, coders.match([OutOrdinalReveal])).encode({
      type: "tr_ord_reveal",
      pubkey,
      inscriptions
    })
  };
}

// src/inscribe.js
var NETWORK_NAME = "signet";
var NET = TEST_NETWORK;
var SIGNET_API_ORIGIN = "https://mempool.space";
var POSTAGE = 546n;
var MAX_BODY = 390 * 1024;
var MAINNET_ADDR = /^(bc1|[13])/i;
var SIGNET_ADDR = /^(tb1|[mn2])/i;
function assertSignetAddress(address) {
  const addr = String(address || "").trim();
  if (!addr) throw new Error("Enter a signet destination address.");
  if (MAINNET_ADDR.test(addr)) throw new Error("Mainnet address refused. This page is signet only.");
  if (!SIGNET_ADDR.test(addr)) throw new Error("Not a signet address. Use a tb1, m, n, or 2 address.");
  if (addr !== addr.toLowerCase() && addr !== addr.toUpperCase()) {
    throw new Error("Signet address must be all lowercase or all uppercase.");
  }
  Address(NET).decode(addr);
  let mainnetDecoded = false;
  try {
    Address(NETWORK).decode(addr);
    mainnetDecoded = true;
  } catch {
    mainnetDecoded = false;
  }
  if (mainnetDecoded) throw new Error("Mainnet address refused. This page is signet only.");
  return addr.toLowerCase();
}
function assertSignetUrl(url2) {
  const u = new URL(url2);
  if (u.protocol !== "https:") throw new Error("Refused non-HTTPS endpoint.");
  if (u.hostname !== "mempool.space") throw new Error("Refused endpoint. Only mempool.space signet is allowed.");
  if (!u.pathname.startsWith("/signet/")) throw new Error("Refused non-signet endpoint.");
  if (u.pathname.includes("mainnet") || u.pathname === "/api" || u.pathname.startsWith("/api/")) {
    throw new Error("Refused mainnet endpoint.");
  }
  return u.toString();
}
function signetUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return assertSignetUrl(`${SIGNET_API_ORIGIN}${p.startsWith("/signet/") ? p : `/signet${p}`}`);
}
function createKey() {
  const priv = randomPrivateKeyBytes();
  return describeKey(priv);
}
function keyFromHex(keyHex) {
  const priv = hex.decode(String(keyHex || "").trim());
  if (priv.length !== 32) throw new Error("Key must be 32 bytes.");
  return describeKey(priv);
}
function describeKey(priv) {
  const pub = pubECDSA(priv);
  const pay = p2wpkh(pub, NET);
  return {
    priv,
    hex: hex.encode(priv),
    wif: WIF(NET).encode(priv),
    address: pay.address,
    script: pay.script,
    payment: pay
  };
}
var EXT_MIME = {
  txt: "text/plain",
  html: "text/html",
  htm: "text/html",
  css: "text/css",
  js: "text/javascript",
  json: "application/json",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  pdf: "application/pdf",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  mp4: "video/mp4",
  webm: "video/webm"
};
function contentTypeForFile(filename, browserType) {
  const offered = String(browserType || "").trim();
  if (offered) return offered;
  const ext = String(filename || "").split(".").pop().toLowerCase();
  return EXT_MIME[ext] || "application/octet-stream";
}
function assertBody(body) {
  if (!(body instanceof Uint8Array)) throw new Error("Content must be bytes.");
  if (!body.length) throw new Error("Content is empty.");
  if (body.length > MAX_BODY) throw new Error(`Content is ${body.length} bytes. The limit is ${MAX_BODY} bytes.`);
  return body;
}
function assertFeeRate(rate) {
  const n = Number(rate);
  if (!Number.isFinite(n) || n <= 0 || n > 1e3) throw new Error("Fee rate must be between 0 and 1000 sat/vB.");
  return n;
}
function feeFor(vsize, rate) {
  return BigInt(Math.ceil(vsize * rate));
}
function customScripts() {
  return [OutOrdinalReveal];
}
function buildEnvelope({ body, contentType, revealPriv }) {
  assertBody(body);
  const type = String(contentType || "application/octet-stream");
  if (type.length > 128) throw new Error("Content type is too long.");
  const inscription = { tags: { contentType: type }, body };
  const leaf = p2tr_ord_reveal(pubSchnorr(revealPriv), [inscription]);
  const payment = p2tr(void 0, leaf, NET, true, customScripts());
  assertSignetAddress(payment.address);
  return { inscription, leaf, payment, contentType: type };
}
function buildRevealTx({ payment, revealPriv, commitTxid, commitVout, commitValue, dest, postage }) {
  const tx = new Transaction({ customScripts: customScripts() });
  tx.addInput({
    ...payment,
    txid: commitTxid,
    index: commitVout,
    witnessUtxo: { script: payment.script, amount: commitValue }
  });
  tx.addOutputAddress(dest, postage, NET);
  const signed = tx.sign(revealPriv, void 0, new Uint8Array(32));
  if (!signed) throw new Error("Reveal did not sign.");
  tx.finalize();
  return tx;
}
function preparePlan({ body, contentType, revealPriv, dest, feeRate }) {
  const destination = assertSignetAddress(dest);
  const rate = assertFeeRate(feeRate);
  const env = buildEnvelope({ body, contentType, revealPriv });
  const probe = buildRevealTx({
    payment: env.payment,
    revealPriv,
    commitTxid: "00".repeat(32),
    commitVout: 0,
    commitValue: 100000n,
    dest: destination,
    postage: POSTAGE
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
    commitValue
  };
}
function makeCommitTx({ funding: funding2, picked, commitAddress, commitValue, change }) {
  const tx = new Transaction();
  for (const u of picked) {
    tx.addInput({
      txid: u.txid,
      index: u.vout,
      witnessUtxo: { script: funding2.script, amount: BigInt(u.value) }
    });
  }
  tx.addOutputAddress(commitAddress, commitValue, NET);
  if (change >= 546n) tx.addOutputAddress(funding2.address, change, NET);
  const signed = tx.sign(funding2.priv);
  if (!signed) throw new Error("Commit did not sign. The UTXO is not spendable by this signet key.");
  tx.finalize();
  return tx;
}
function buildCommit({ funding: funding2, utxos, plan: plan2 }) {
  assertSignetAddress(plan2.commitAddress);
  const clean2 = (utxos || []).map((u) => ({ txid: String(u.txid), vout: Number(u.vout), value: BigInt(u.value) })).filter((u) => u.txid && Number.isInteger(u.vout) && u.value > 0n).sort((a, b) => a.value > b.value ? -1 : 1);
  if (!clean2.length) throw new Error("No signet UTXOs on the funding address yet.");
  let sum = 0n;
  const picked = [];
  for (const u of clean2) {
    picked.push(u);
    sum += u.value;
    if (sum < plan2.commitValue) continue;
    const bare = makeCommitTx({ funding: funding2, picked, commitAddress: plan2.commitAddress, commitValue: plan2.commitValue, change: 0n });
    const bareFee = feeFor(bare.vsize, plan2.feeRate);
    const bareChange = sum - plan2.commitValue - bareFee;
    if (bareChange < 0n) continue;
    if (bareChange < 546n) {
      return finishCommit(bare, plan2, sum, 0n);
    }
    const withChange = makeCommitTx({
      funding: funding2,
      picked,
      commitAddress: plan2.commitAddress,
      commitValue: plan2.commitValue,
      change: bareChange
    });
    const fee = feeFor(withChange.vsize, plan2.feeRate);
    const change = sum - plan2.commitValue - fee;
    if (change >= 546n) {
      const exact = change === bareChange ? withChange : makeCommitTx({ funding: funding2, picked, commitAddress: plan2.commitAddress, commitValue: plan2.commitValue, change });
      return finishCommit(exact, plan2, sum, change);
    }
    return finishCommit(bare, plan2, sum, 0n);
  }
  throw new Error(`Not enough signet coins. Found ${sum} sats. The commit output needs ${plan2.commitValue} sats plus the commit fee.`);
}
function finishCommit(tx, plan2, inputSum, change) {
  const raw = tx.extract();
  const out = tx.getOutput(0);
  if (out.amount !== plan2.commitValue) throw new Error("Commit output amount mismatch.");
  return {
    tx,
    hex: hex.encode(raw),
    txid: tx.id,
    vbytes: tx.vsize,
    bytes: raw.length,
    fee: inputSum - plan2.commitValue - change,
    change,
    inputSum
  };
}
function buildReveal({ plan: plan2, commitTxid, commitVout = 0, commitValue }) {
  if (commitValue <= plan2.postage) throw new Error("Commit output cannot cover the 546 sat postage.");
  const tx = buildRevealTx({
    payment: plan2.payment,
    revealPriv: plan2.revealPriv,
    commitTxid,
    commitVout,
    commitValue,
    dest: plan2.destination,
    postage: plan2.postage
  });
  const raw = tx.extract();
  const witness = tx.getInput(0).finalScriptWitness;
  const parsed = parseWitness(witness);
  if (!parsed || !parsed.length) throw new Error("Reveal witness has no inscription.");
  return {
    tx,
    hex: hex.encode(raw),
    txid: tx.id,
    vbytes: tx.vsize,
    bytes: raw.length,
    fee: commitValue - plan2.postage,
    witness,
    parsed,
    inscriptionId: `${tx.id}i0`
  };
}
function recoveryFile(plan2, funding2) {
  const file = {
    network: NETWORK_NAME,
    keyWif: WIF(NET).encode(plan2.revealPriv),
    keyHex: hex.encode(plan2.revealPriv),
    revealScript: hex.encode(plan2.revealScript),
    commitAddress: plan2.commitAddress,
    destination: plan2.destination,
    contentType: plan2.contentType,
    bodyHex: hex.encode(plan2.body),
    feeRate: plan2.feeRate,
    postage: Number(plan2.postage),
    commitValue: Number(plan2.commitValue)
  };
  if (funding2?.wif && funding2?.hex) {
    file.fundingKeyWif = funding2.wif;
    file.fundingKeyHex = funding2.hex;
  }
  return file;
}
function planFromRecovery(file) {
  if (!file || file.network !== NETWORK_NAME) throw new Error("Recovery file is not for signet.");
  const reveal = keyFromHex(file.keyHex);
  if (reveal.wif !== file.keyWif) throw new Error("Recovery WIF does not match the hex key.");
  const body = hex.decode(file.bodyHex || "");
  assertBody(body);
  const plan2 = preparePlan({
    body,
    contentType: file.contentType,
    revealPriv: reveal.priv,
    dest: file.destination,
    feeRate: file.feeRate
  });
  if (plan2.commitAddress !== file.commitAddress) throw new Error("Commit address does not match this key and content.");
  if (hex.encode(plan2.revealScript) !== String(file.revealScript || "").toLowerCase()) {
    throw new Error("Reveal script does not match this key and content.");
  }
  return { plan: plan2, reveal };
}
var INPUT_VBYTES = { wpkh: 68, sh: 91, tr: 57.5, pkh: 148, wsh: 100 };
var OUT_VBYTES = { wpkh: 31, sh: 32, tr: 43, pkh: 34, wsh: 43 };
function scriptPubKey(address) {
  const decoded = Address(NET).decode(assertSignetAddress(address));
  return { type: decoded.type, script: OutScript.encode(decoded) };
}
function estimateCommitVbytes(nIn, withChange, type) {
  const outputs = OUT_VBYTES.tr + (withChange ? OUT_VBYTES[type] || 31 : 0);
  return Math.ceil(10.5 + nIn * (INPUT_VBYTES[type] || 68) + outputs);
}
function pubkeyBytes(pubkeyHex2) {
  const s = String(pubkeyHex2 || "").replace(/^0x/, "");
  if (!s || !/^[0-9a-fA-F]+$/.test(s) || s.length % 2) return null;
  return hex.decode(s);
}
function unsignedCommit({ inputs, script, type, pubkey, commitAddress, commitValue, changeAddress, change }) {
  const tx = new Transaction();
  for (const u of inputs) {
    const input = {
      txid: u.txid,
      index: u.vout,
      witnessUtxo: { script, amount: u.value }
    };
    if (type === "tr") {
      if (!pubkey || pubkey.length !== 32) throw new Error("A 32-byte taproot key is required to spend this payment address.");
      input.tapInternalKey = pubkey;
    } else if (type === "sh") {
      if (!pubkey || pubkey.length !== 33) throw new Error("A 33-byte compressed key is required to spend this nested segwit address.");
      input.redeemScript = p2wpkh(pubkey, NET).script;
    }
    tx.addInput(input);
  }
  tx.addOutputAddress(commitAddress, commitValue, NET);
  if (change >= 546n) tx.addOutputAddress(changeAddress, change, NET);
  return tx;
}
function bytesToBase64(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function base64ToBytes(b64) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
function buildCommitPsbt({ paymentAddress, paymentPubkey, utxos, plan: plan2 }) {
  const { script, type } = scriptPubKey(paymentAddress);
  assertSignetAddress(plan2.commitAddress);
  assertSignetAddress(paymentAddress);
  const pubkey = pubkeyBytes(paymentPubkey);
  const clean2 = (utxos || []).map((u) => ({ txid: String(u.txid), vout: Number(u.vout), value: BigInt(u.value) })).filter((u) => u.txid && Number.isInteger(u.vout) && u.value > 0n).sort((a, b) => a.value > b.value ? -1 : 1);
  if (!clean2.length) throw new Error("No signet UTXOs on the payment address yet.");
  const spend = { script, type, pubkey, commitAddress: plan2.commitAddress, commitValue: plan2.commitValue, changeAddress: paymentAddress };
  let sum = 0n;
  const picked = [];
  for (const u of clean2) {
    picked.push(u);
    sum += u.value;
    if (sum < plan2.commitValue) continue;
    const bareV = estimateCommitVbytes(picked.length, false, type);
    const bareFee = feeFor(bareV, plan2.feeRate);
    const bareChange = sum - plan2.commitValue - bareFee;
    if (bareChange < 0n) continue;
    if (bareChange < 546n) {
      const tx2 = unsignedCommit({ ...spend, inputs: picked, change: 0n });
      return psbtResult(tx2, plan2, sum, 0n, bareFee, picked);
    }
    const withV = estimateCommitVbytes(picked.length, true, type);
    const fee = feeFor(withV, plan2.feeRate);
    const change = sum - plan2.commitValue - fee;
    if (change >= 546n) {
      const tx2 = unsignedCommit({ ...spend, inputs: picked, change });
      return psbtResult(tx2, plan2, sum, change, fee, picked);
    }
    const tx = unsignedCommit({ ...spend, inputs: picked, change: 0n });
    return psbtResult(tx, plan2, sum, 0n, bareFee, picked);
  }
  throw new Error(`Not enough signet coins. Found ${sum} sats. The commit output needs ${plan2.commitValue} sats plus the commit fee.`);
}
function psbtResult(tx, plan2, inputSum, change, fee, inputs) {
  const psbt = tx.toPSBT();
  return {
    psbtBase64: bytesToBase64(psbt),
    fee,
    change,
    inputSum,
    inputs,
    commitValue: plan2.commitValue
  };
}
function finalizeCommitPsbt(psbtBase64, plan2) {
  const tx = Transaction.fromPSBT(base64ToBytes(psbtBase64));
  tx.finalize();
  const raw = tx.extract();
  const out = tx.getOutput(0);
  if (out.amount !== plan2.commitValue) throw new Error("Signed commit does not pay the expected amount to the commit address.");
  const script = scriptPubKey(plan2.commitAddress).script;
  if (!sameBytes(out.script, script)) throw new Error("Signed commit does not pay the commit address.");
  const fee = tx.fee;
  if (fee < feeFor(tx.vsize, plan2.feeRate)) {
    throw new Error(`Signed commit fee is ${fee} sats, under ${plan2.feeRate} sat/vB.`);
  }
  return {
    tx,
    hex: hex.encode(raw),
    txid: tx.id,
    vbytes: tx.vsize,
    bytes: raw.length,
    fee,
    change: tx.outputs.length > 1 ? tx.getOutput(1).amount : 0n,
    inputSum: tx.inputs.reduce((s, i) => s + i.witnessUtxo.amount, 0n)
  };
}
function utxoCreatedByInscription(rawTx, vout) {
  try {
    const tx = Transaction.fromRaw(rawTx, { allowUnknownOutputs: true });
    if (Number(vout) !== 0) return false;
    for (let i = 0; i < tx.inputs.length; i++) {
      const witness = tx.getInput(i).finalScriptWitness;
      if (!witness) continue;
      const parsed = parseWitness(witness);
      if (parsed && parsed.length) return true;
    }
  } catch {
    return false;
  }
  return false;
}
function textBody(text) {
  return utf8.decode(String(text ?? ""));
}
function sameBytes(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

// node_modules/valibot/dist/index.mjs
var store$4;
// @__NO_SIDE_EFFECTS__
function getGlobalConfig(config$1) {
  return {
    lang: config$1?.lang ?? store$4?.lang,
    message: config$1?.message,
    abortEarly: config$1?.abortEarly ?? store$4?.abortEarly,
    abortPipeEarly: config$1?.abortPipeEarly ?? store$4?.abortPipeEarly
  };
}
var store$3;
// @__NO_SIDE_EFFECTS__
function getGlobalMessage(lang) {
  return store$3?.get(lang);
}
var store$2;
// @__NO_SIDE_EFFECTS__
function getSchemaMessage(lang) {
  return store$2?.get(lang);
}
var store$1;
// @__NO_SIDE_EFFECTS__
function getSpecificMessage(reference, lang) {
  return store$1?.get(reference)?.get(lang);
}
// @__NO_SIDE_EFFECTS__
function _stringify(input) {
  const type = typeof input;
  if (type === "string") return `"${input}"`;
  if (type === "number" || type === "bigint" || type === "boolean") return `${input}`;
  if (type === "object" || type === "function") return (input && Object.getPrototypeOf(input)?.constructor?.name) ?? "null";
  return type;
}
function _addIssue(context, label, dataset, config$1, other) {
  const input = other && "input" in other ? other.input : dataset.value;
  const expected = other?.expected ?? context.expects ?? null;
  const received = other?.received ?? /* @__PURE__ */ _stringify(input);
  const issue = {
    kind: context.kind,
    type: context.type,
    input,
    expected,
    received,
    message: `Invalid ${label}: ${expected ? `Expected ${expected} but r` : "R"}eceived ${received}`,
    requirement: context.requirement,
    path: other?.path,
    issues: other?.issues,
    lang: config$1.lang,
    abortEarly: config$1.abortEarly,
    abortPipeEarly: config$1.abortPipeEarly
  };
  const isSchema = context.kind === "schema";
  const message$1 = other?.message ?? context.message ?? /* @__PURE__ */ getSpecificMessage(context.reference, issue.lang) ?? (isSchema ? /* @__PURE__ */ getSchemaMessage(issue.lang) : null) ?? config$1.message ?? /* @__PURE__ */ getGlobalMessage(issue.lang);
  if (message$1 !== void 0) issue.message = typeof message$1 === "function" ? message$1(issue) : message$1;
  if (isSchema) dataset.typed = false;
  if (dataset.issues) dataset.issues.push(issue);
  else dataset.issues = [issue];
}
// @__NO_SIDE_EFFECTS__
function _getStandardProps(context) {
  return {
    version: 1,
    vendor: "valibot",
    validate(value$1) {
      return context["~run"]({ value: value$1 }, /* @__PURE__ */ getGlobalConfig());
    }
  };
}
// @__NO_SIDE_EFFECTS__
function _isValidObjectKey(object$1, key) {
  return Object.hasOwn(object$1, key) && key !== "__proto__" && key !== "prototype" && key !== "constructor";
}
// @__NO_SIDE_EFFECTS__
function _joinExpects(values$1, separator) {
  const list = [...new Set(values$1)];
  if (list.length > 1) return `(${list.join(` ${separator} `)})`;
  return list[0] ?? "never";
}
var ISO_DATE_REGEX = /^\d{4}-(?:0[1-9]|1[0-2])-(?:[12]\d|0[1-9]|3[01])$/u;
// @__NO_SIDE_EFFECTS__
function check(requirement, message$1) {
  return {
    kind: "validation",
    type: "check",
    reference: check,
    async: false,
    expects: null,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement(dataset.value)) _addIssue(this, "input", dataset, config$1);
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function integer(message$1) {
  return {
    kind: "validation",
    type: "integer",
    reference: integer,
    async: false,
    expects: null,
    requirement: Number.isInteger,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement(dataset.value)) _addIssue(this, "integer", dataset, config$1);
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function isoDate(message$1) {
  return {
    kind: "validation",
    type: "iso_date",
    reference: isoDate,
    async: false,
    expects: null,
    requirement: ISO_DATE_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "date", dataset, config$1);
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function length(requirement, message$1) {
  return {
    kind: "validation",
    type: "length",
    reference: length,
    async: false,
    expects: `${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && dataset.value.length !== this.requirement) _addIssue(this, "length", dataset, config$1, { received: `${dataset.value.length}` });
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function maxLength(requirement, message$1) {
  return {
    kind: "validation",
    type: "max_length",
    reference: maxLength,
    async: false,
    expects: `<=${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && dataset.value.length > this.requirement) _addIssue(this, "length", dataset, config$1, { received: `${dataset.value.length}` });
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function minLength(requirement, message$1) {
  return {
    kind: "validation",
    type: "min_length",
    reference: minLength,
    async: false,
    expects: `>=${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && dataset.value.length < this.requirement) _addIssue(this, "length", dataset, config$1, { received: `${dataset.value.length}` });
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function minValue(requirement, message$1) {
  return {
    kind: "validation",
    type: "min_value",
    reference: minValue,
    async: false,
    expects: `>=${requirement instanceof Date ? requirement.toJSON() : /* @__PURE__ */ _stringify(requirement)}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !(dataset.value >= this.requirement)) _addIssue(this, "value", dataset, config$1, { received: dataset.value instanceof Date ? dataset.value.toJSON() : /* @__PURE__ */ _stringify(dataset.value) });
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function regex(requirement, message$1) {
  return {
    kind: "validation",
    type: "regex",
    reference: regex,
    async: false,
    expects: `${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "format", dataset, config$1);
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function transform(operation) {
  return {
    kind: "transformation",
    type: "transform",
    reference: transform,
    async: false,
    operation,
    "~run"(dataset) {
      dataset.value = this.operation(dataset.value);
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function url(message$1) {
  return {
    kind: "validation",
    type: "url",
    reference: url,
    async: false,
    expects: null,
    requirement(input) {
      try {
        new URL(input);
        return true;
      } catch {
        return false;
      }
    },
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement(dataset.value)) _addIssue(this, "URL", dataset, config$1);
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function getFallback(schema, dataset, config$1) {
  return typeof schema.fallback === "function" ? schema.fallback(dataset, config$1) : schema.fallback;
}
// @__NO_SIDE_EFFECTS__
function getDefault(schema, dataset, config$1) {
  return typeof schema.default === "function" ? schema.default(dataset, config$1) : schema.default;
}
// @__NO_SIDE_EFFECTS__
function is(schema, input) {
  return !schema["~run"]({ value: input }, { abortEarly: true }).issues;
}
// @__NO_SIDE_EFFECTS__
function array2(item, message$1) {
  return {
    kind: "schema",
    type: "array",
    reference: array2,
    expects: "Array",
    async: false,
    item,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (Array.isArray(input)) {
        dataset.typed = true;
        dataset.value = [];
        for (let key = 0; key < input.length; key++) {
          const value$1 = input[key];
          const itemDataset = this.item["~run"]({ value: value$1 }, config$1);
          if (itemDataset.issues) {
            const pathItem = {
              type: "array",
              origin: "value",
              input,
              key,
              value: value$1
            };
            for (const issue of itemDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = itemDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!itemDataset.typed) dataset.typed = false;
          dataset.value.push(itemDataset.value);
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function boolean(message$1) {
  return {
    kind: "schema",
    type: "boolean",
    reference: boolean,
    expects: "boolean",
    async: false,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (typeof dataset.value === "boolean") dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function enum_(enum__, message$1) {
  const options = [];
  for (const key in enum__) if (`${+key}` !== key || typeof enum__[key] !== "string" || !Object.is(enum__[enum__[key]], +key)) options.push(enum__[key]);
  return {
    kind: "schema",
    type: "enum",
    reference: enum_,
    expects: /* @__PURE__ */ _joinExpects(options.map(_stringify), "|"),
    async: false,
    enum: enum__,
    options,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (this.options.includes(dataset.value)) dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function literal(literal_, message$1) {
  return {
    kind: "schema",
    type: "literal",
    reference: literal,
    expects: /* @__PURE__ */ _stringify(literal_),
    async: false,
    literal: literal_,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (dataset.value === this.literal) dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function looseObject(entries$1, message$1) {
  return {
    kind: "schema",
    type: "loose_object",
    reference: looseObject,
    expects: "Object",
    async: false,
    entries: entries$1,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        for (const key in this.entries) {
          const valueSchema = this.entries[key];
          if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && valueSchema.default !== void 0) {
            const value$1 = key in input ? input[key] : /* @__PURE__ */ getDefault(valueSchema);
            const valueDataset = valueSchema["~run"]({ value: value$1 }, config$1);
            if (valueDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "value",
                input,
                key,
                value: value$1
              };
              for (const issue of valueDataset.issues) {
                if (issue.path) issue.path.unshift(pathItem);
                else issue.path = [pathItem];
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) dataset.issues = valueDataset.issues;
              if (config$1.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!valueDataset.typed) dataset.typed = false;
            dataset.value[key] = valueDataset.value;
          } else if (valueSchema.fallback !== void 0) dataset.value[key] = /* @__PURE__ */ getFallback(valueSchema);
          else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
            _addIssue(this, "key", dataset, config$1, {
              input: void 0,
              expected: `"${key}"`,
              path: [{
                type: "object",
                origin: "key",
                input,
                key,
                value: input[key]
              }]
            });
            if (config$1.abortEarly) break;
          }
        }
        if (!dataset.issues || !config$1.abortEarly) {
          for (const key in input) if (/* @__PURE__ */ _isValidObjectKey(input, key) && !(key in this.entries)) dataset.value[key] = input[key];
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function null_(message$1) {
  return {
    kind: "schema",
    type: "null",
    reference: null_,
    expects: "null",
    async: false,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (dataset.value === null) dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function nullish(wrapped, default_) {
  return {
    kind: "schema",
    type: "nullish",
    reference: nullish,
    expects: `(${wrapped.expects} | null | undefined)`,
    async: false,
    wrapped,
    default: default_,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (dataset.value === null || dataset.value === void 0) {
        if (this.default !== void 0) dataset.value = /* @__PURE__ */ getDefault(this, dataset, config$1);
        if (dataset.value === null || dataset.value === void 0) {
          dataset.typed = true;
          return dataset;
        }
      }
      return this.wrapped["~run"](dataset, config$1);
    }
  };
}
// @__NO_SIDE_EFFECTS__
function number(message$1) {
  return {
    kind: "schema",
    type: "number",
    reference: number,
    expects: "number",
    async: false,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (typeof dataset.value === "number" && !isNaN(dataset.value)) dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function object(entries$1, message$1) {
  return {
    kind: "schema",
    type: "object",
    reference: object,
    expects: "Object",
    async: false,
    entries: entries$1,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        for (const key in this.entries) {
          const valueSchema = this.entries[key];
          if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && valueSchema.default !== void 0) {
            const value$1 = key in input ? input[key] : /* @__PURE__ */ getDefault(valueSchema);
            const valueDataset = valueSchema["~run"]({ value: value$1 }, config$1);
            if (valueDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "value",
                input,
                key,
                value: value$1
              };
              for (const issue of valueDataset.issues) {
                if (issue.path) issue.path.unshift(pathItem);
                else issue.path = [pathItem];
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) dataset.issues = valueDataset.issues;
              if (config$1.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!valueDataset.typed) dataset.typed = false;
            dataset.value[key] = valueDataset.value;
          } else if (valueSchema.fallback !== void 0) dataset.value[key] = /* @__PURE__ */ getFallback(valueSchema);
          else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
            _addIssue(this, "key", dataset, config$1, {
              input: void 0,
              expected: `"${key}"`,
              path: [{
                type: "object",
                origin: "key",
                input,
                key,
                value: input[key]
              }]
            });
            if (config$1.abortEarly) break;
          }
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function optional(wrapped, default_) {
  return {
    kind: "schema",
    type: "optional",
    reference: optional,
    expects: `(${wrapped.expects} | undefined)`,
    async: false,
    wrapped,
    default: default_,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (dataset.value === void 0) {
        if (this.default !== void 0) dataset.value = /* @__PURE__ */ getDefault(this, dataset, config$1);
        if (dataset.value === void 0) {
          dataset.typed = true;
          return dataset;
        }
      }
      return this.wrapped["~run"](dataset, config$1);
    }
  };
}
// @__NO_SIDE_EFFECTS__
function picklist(options, message$1) {
  return {
    kind: "schema",
    type: "picklist",
    reference: picklist,
    expects: /* @__PURE__ */ _joinExpects(options.map(_stringify), "|"),
    async: false,
    options,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (this.options.includes(dataset.value)) dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function record(key, value$1, message$1) {
  return {
    kind: "schema",
    type: "record",
    reference: record,
    expects: "Object",
    async: false,
    key,
    value: value$1,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        for (const entryKey in input) if (/* @__PURE__ */ _isValidObjectKey(input, entryKey)) {
          const entryValue = input[entryKey];
          const keyDataset = this.key["~run"]({ value: entryKey }, config$1);
          if (keyDataset.issues) {
            const pathItem = {
              type: "object",
              origin: "key",
              input,
              key: entryKey,
              value: entryValue
            };
            for (const issue of keyDataset.issues) {
              issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = keyDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          const valueDataset = this.value["~run"]({ value: entryValue }, config$1);
          if (valueDataset.issues) {
            const pathItem = {
              type: "object",
              origin: "value",
              input,
              key: entryKey,
              value: entryValue
            };
            for (const issue of valueDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = valueDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!keyDataset.typed || !valueDataset.typed) dataset.typed = false;
          if (keyDataset.typed) dataset.value[keyDataset.value] = valueDataset.value;
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function strictObject(entries$1, message$1) {
  return {
    kind: "schema",
    type: "strict_object",
    reference: strictObject,
    expects: "Object",
    async: false,
    entries: entries$1,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        for (const key in this.entries) {
          const valueSchema = this.entries[key];
          if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && valueSchema.default !== void 0) {
            const value$1 = key in input ? input[key] : /* @__PURE__ */ getDefault(valueSchema);
            const valueDataset = valueSchema["~run"]({ value: value$1 }, config$1);
            if (valueDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "value",
                input,
                key,
                value: value$1
              };
              for (const issue of valueDataset.issues) {
                if (issue.path) issue.path.unshift(pathItem);
                else issue.path = [pathItem];
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) dataset.issues = valueDataset.issues;
              if (config$1.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!valueDataset.typed) dataset.typed = false;
            dataset.value[key] = valueDataset.value;
          } else if (valueSchema.fallback !== void 0) dataset.value[key] = /* @__PURE__ */ getFallback(valueSchema);
          else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
            _addIssue(this, "key", dataset, config$1, {
              input: void 0,
              expected: `"${key}"`,
              path: [{
                type: "object",
                origin: "key",
                input,
                key,
                value: input[key]
              }]
            });
            if (config$1.abortEarly) break;
          }
        }
        if (!dataset.issues || !config$1.abortEarly) {
          for (const key in input) if (!(key in this.entries)) {
            _addIssue(this, "key", dataset, config$1, {
              input: key,
              expected: "never",
              path: [{
                type: "object",
                origin: "key",
                input,
                key,
                value: input[key]
              }]
            });
            break;
          }
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function string2(message$1) {
  return {
    kind: "schema",
    type: "string",
    reference: string2,
    expects: "string",
    async: false,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (typeof dataset.value === "string") dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function _subIssues(datasets) {
  let issues;
  if (datasets) for (const dataset of datasets) if (issues) issues.push(...dataset.issues);
  else issues = dataset.issues;
  return issues;
}
// @__NO_SIDE_EFFECTS__
function union(options, message$1) {
  return {
    kind: "schema",
    type: "union",
    reference: union,
    expects: /* @__PURE__ */ _joinExpects(options.map((option) => option.expects), "|"),
    async: false,
    options,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      let validDataset;
      let typedDatasets;
      let untypedDatasets;
      for (const schema of this.options) {
        const optionDataset = schema["~run"]({ value: dataset.value }, config$1);
        if (optionDataset.typed) if (optionDataset.issues) if (typedDatasets) typedDatasets.push(optionDataset);
        else typedDatasets = [optionDataset];
        else {
          validDataset = optionDataset;
          break;
        }
        else if (untypedDatasets) untypedDatasets.push(optionDataset);
        else untypedDatasets = [optionDataset];
      }
      if (validDataset) return validDataset;
      if (typedDatasets) {
        if (typedDatasets.length === 1) return typedDatasets[0];
        _addIssue(this, "type", dataset, config$1, { issues: /* @__PURE__ */ _subIssues(typedDatasets) });
        dataset.typed = true;
      } else if (untypedDatasets?.length === 1) return untypedDatasets[0];
      else _addIssue(this, "type", dataset, config$1, { issues: /* @__PURE__ */ _subIssues(untypedDatasets) });
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function unknown() {
  return {
    kind: "schema",
    type: "unknown",
    reference: unknown,
    expects: "unknown",
    async: false,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset) {
      dataset.typed = true;
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function variant(key, options, message$1) {
  return {
    kind: "schema",
    type: "variant",
    reference: variant,
    expects: "Object",
    async: false,
    key,
    options,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        let outputDataset;
        let maxDiscriminatorPriority = 0;
        let invalidDiscriminatorKey = this.key;
        let expectedDiscriminators = [];
        const parseOptions = (variant$1, allKeys) => {
          for (const schema of variant$1.options) {
            if (schema.type === "variant") parseOptions(schema, new Set(allKeys).add(schema.key));
            else {
              let keysAreValid = true;
              let currentPriority = 0;
              for (const currentKey of allKeys) {
                const discriminatorSchema = schema.entries[currentKey];
                if (currentKey in input ? discriminatorSchema["~run"]({
                  typed: false,
                  value: input[currentKey]
                }, { abortEarly: true }).issues : discriminatorSchema.type !== "exact_optional" && discriminatorSchema.type !== "optional" && discriminatorSchema.type !== "nullish") {
                  keysAreValid = false;
                  if (invalidDiscriminatorKey !== currentKey && (maxDiscriminatorPriority < currentPriority || maxDiscriminatorPriority === currentPriority && currentKey in input && !(invalidDiscriminatorKey in input))) {
                    maxDiscriminatorPriority = currentPriority;
                    invalidDiscriminatorKey = currentKey;
                    expectedDiscriminators = [];
                  }
                  if (invalidDiscriminatorKey === currentKey) expectedDiscriminators.push(schema.entries[currentKey].expects);
                  break;
                }
                currentPriority++;
              }
              if (keysAreValid) {
                const optionDataset = schema["~run"]({ value: input }, config$1);
                if (!outputDataset || !outputDataset.typed && optionDataset.typed) outputDataset = optionDataset;
              }
            }
            if (outputDataset && !outputDataset.issues) break;
          }
        };
        parseOptions(this, /* @__PURE__ */ new Set([this.key]));
        if (outputDataset) return outputDataset;
        _addIssue(this, "type", dataset, config$1, {
          input: input[invalidDiscriminatorKey],
          expected: /* @__PURE__ */ _joinExpects(expectedDiscriminators, "|"),
          path: [{
            type: "object",
            origin: "value",
            input,
            key: invalidDiscriminatorKey,
            value: input[invalidDiscriminatorKey]
          }]
        });
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function omit(schema, keys) {
  const entries$1 = { ...schema.entries };
  for (const key of keys) delete entries$1[key];
  return {
    ...schema,
    entries: entries$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    }
  };
}
// @__NO_SIDE_EFFECTS__
function pipe(...pipe$1) {
  return {
    ...pipe$1[0],
    pipe: pipe$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      for (const item of pipe$1) if (item.kind !== "metadata") {
        if (dataset.issues && (item.kind === "schema" || item.kind === "transformation")) {
          dataset.typed = false;
          break;
        }
        if (!dataset.issues || !config$1.abortEarly && !config$1.abortPipeEarly) dataset = item["~run"](dataset, config$1);
      }
      return dataset;
    }
  };
}

// node_modules/axios/lib/helpers/bind.js
function bind(fn, thisArg) {
  return function wrap2() {
    return fn.apply(thisArg, arguments);
  };
}

// node_modules/axios/lib/utils.js
var { toString } = Object.prototype;
var { getPrototypeOf } = Object;
var { iterator, toStringTag } = Symbol;
var hasOwnProperty = (({ hasOwnProperty: hasOwnProperty2 }) => (obj, prop) => hasOwnProperty2.call(obj, prop))(Object.prototype);
var isUnsafeObjectKey = (prop) => typeof prop === "string" && (prop === "__proto__" || prop === "constructor" || prop === "prototype");
var isPrototypeBoundary = (obj, prototype2, source) => obj === Object.prototype || !source && prototype2 === null;
var isSafeAndFullyMutable = (obj) => {
  if (!Object.isExtensible(obj)) {
    return false;
  }
  const props = Object.getOwnPropertyNames(obj);
  if (Object.getOwnPropertySymbols) {
    props.push(...Object.getOwnPropertySymbols(obj));
  }
  return props.every((prop) => {
    if (isUnsafeObjectKey(prop)) {
      return false;
    }
    const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
    return !!descriptor && descriptor.configurable && descriptor.writable === true;
  });
};
var hasOwnInPrototypeChain = (thing, prop) => {
  let obj = thing;
  const seen = [];
  while (obj != null) {
    if (seen.indexOf(obj) !== -1) {
      return false;
    }
    seen.push(obj);
    const prototype2 = getPrototypeOf(obj);
    if (isPrototypeBoundary(obj, prototype2, obj === thing)) {
      return false;
    }
    if (hasOwnProperty(obj, prop)) {
      return true;
    }
    obj = prototype2;
  }
  return false;
};
var getSafeProp = (obj, prop) => obj != null && hasOwnInPrototypeChain(obj, prop) ? obj[prop] : void 0;
var toSafeFlatObject = (thing) => {
  if (thing == null || typeof thing !== "object" && typeof thing !== "function") {
    return thing;
  }
  const sourcePrototype = getPrototypeOf(thing);
  if (sourcePrototype === null && isSafeAndFullyMutable(thing)) {
    return thing;
  }
  const result = /* @__PURE__ */ Object.create(null);
  const merged = /* @__PURE__ */ Object.create(null);
  const seen = [];
  let current = thing;
  while (current != null) {
    if (seen.indexOf(current) !== -1) {
      break;
    }
    seen.push(current);
    const prototype2 = current === thing ? sourcePrototype : getPrototypeOf(current);
    if (isPrototypeBoundary(current, prototype2, current === thing)) {
      break;
    }
    const props = Object.getOwnPropertyNames(current);
    if (Object.getOwnPropertySymbols) {
      props.push(...Object.getOwnPropertySymbols(current));
    }
    for (const prop of props) {
      if (isUnsafeObjectKey(prop)) {
        continue;
      }
      if (!hasOwnProperty(merged, prop)) {
        result[prop] = thing[prop];
        merged[prop] = true;
      }
    }
    current = prototype2;
  }
  return result;
};
var kindOf = /* @__PURE__ */ ((cache2) => (thing) => {
  const str = toString.call(thing);
  return cache2[str] || (cache2[str] = str.slice(8, -1).toLowerCase());
})(/* @__PURE__ */ Object.create(null));
var kindOfTest = (type) => {
  type = type.toLowerCase();
  return (thing) => kindOf(thing) === type;
};
var typeOfTest = (type) => (thing) => typeof thing === type;
var { isArray } = Array;
var isUndefined = typeOfTest("undefined");
function isBuffer(val) {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor) && isFunction(val.constructor.isBuffer) && val.constructor.isBuffer(val);
}
var isArrayBuffer = kindOfTest("ArrayBuffer");
function isArrayBufferView(val) {
  let result;
  if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView) {
    result = ArrayBuffer.isView(val);
  } else {
    result = val && val.buffer && isArrayBuffer(val.buffer);
  }
  return result;
}
var isString = typeOfTest("string");
var isFunction = typeOfTest("function");
var isNumber = typeOfTest("number");
var isObject = (thing) => thing !== null && typeof thing === "object";
var isBoolean = (thing) => thing === true || thing === false;
var isPlainObject2 = (val) => {
  if (!isObject(val)) {
    return false;
  }
  const prototype2 = getPrototypeOf(val);
  return (prototype2 === null || prototype2 === Object.prototype || getPrototypeOf(prototype2) === null) && // Treat safe own/inherited Symbol.toStringTag or Symbol.iterator members as
  // evidence the value is tagged/iterable, while ignoring members reachable
  // only through shared or terminal prototype boundaries.
  !hasOwnInPrototypeChain(val, toStringTag) && !hasOwnInPrototypeChain(val, iterator);
};
var isEmptyObject = (val) => {
  if (!isObject(val) || isBuffer(val)) {
    return false;
  }
  try {
    return Object.keys(val).length === 0 && Object.getPrototypeOf(val) === Object.prototype;
  } catch (e) {
    return false;
  }
};
var isDate = kindOfTest("Date");
var isFile = kindOfTest("File");
var isReactNativeBlob = (value) => {
  return !!(value && typeof value.uri !== "undefined");
};
var isReactNative = (formData) => formData && typeof formData.getParts !== "undefined";
var isBlob = kindOfTest("Blob");
var isFileList = kindOfTest("FileList");
var isSet = kindOfTest("Set");
var isStream = (val) => isObject(val) && isFunction(val.pipe);
function getGlobal() {
  if (typeof globalThis !== "undefined") return globalThis;
  if (typeof self !== "undefined") return self;
  if (typeof window !== "undefined") return window;
  if (typeof globalThis !== "undefined") return globalThis;
  return {};
}
var G = getGlobal();
var FormDataCtor = typeof G.FormData !== "undefined" ? G.FormData : void 0;
var isFormData = (thing) => {
  if (!thing) return false;
  if (FormDataCtor && thing instanceof FormDataCtor) return true;
  const proto = getPrototypeOf(thing);
  if (!proto || proto === Object.prototype) return false;
  if (!isFunction(thing.append)) return false;
  const kind = kindOf(thing);
  return kind === "formdata" || // detect form-data instance
  kind === "object" && isFunction(thing.toString) && thing.toString() === "[object FormData]";
};
var isURLSearchParams = kindOfTest("URLSearchParams");
var [isReadableStream, isRequest, isResponse, isHeaders] = [
  "ReadableStream",
  "Request",
  "Response",
  "Headers"
].map(kindOfTest);
var trim = (str) => {
  return str.trim ? str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
};
function forEach(obj, fn, { allOwnKeys = false } = {}) {
  if (obj === null || typeof obj === "undefined") {
    return;
  }
  let i;
  let l;
  if (typeof obj !== "object") {
    obj = [obj];
  }
  if (isArray(obj)) {
    for (i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    if (isBuffer(obj)) {
      return;
    }
    const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
    const len = keys.length;
    let key;
    for (i = 0; i < len; i++) {
      key = keys[i];
      fn.call(null, obj[key], key, obj);
    }
  }
}
function findKey(obj, key) {
  if (isBuffer(obj)) {
    return null;
  }
  key = key.toLowerCase();
  const keys = Object.keys(obj);
  let i = keys.length;
  let _key;
  while (i-- > 0) {
    _key = keys[i];
    if (key === _key.toLowerCase()) {
      return _key;
    }
  }
  return null;
}
var _global = (() => {
  if (typeof globalThis !== "undefined") return globalThis;
  return typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : globalThis;
})();
var isContextDefined = (context) => !isUndefined(context) && context !== _global;
function merge(...objs) {
  const { caseless, skipUndefined } = isContextDefined(this) && this || {};
  const result = {};
  const assignValue = (val, key) => {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      return;
    }
    const targetKey = caseless && typeof key === "string" && findKey(result, key) || key;
    const existing = hasOwnProperty(result, targetKey) ? result[targetKey] : void 0;
    if (isPlainObject2(existing) && isPlainObject2(val)) {
      result[targetKey] = merge(existing, val);
    } else if (isPlainObject2(val)) {
      result[targetKey] = merge({}, val);
    } else if (isArray(val)) {
      result[targetKey] = val.slice();
    } else if (!skipUndefined || !isUndefined(val)) {
      result[targetKey] = val;
    }
  };
  for (let i = 0, l = objs.length; i < l; i++) {
    const source = objs[i];
    if (!source || isBuffer(source)) {
      continue;
    }
    forEach(source, assignValue);
    if (typeof source !== "object" || isArray(source)) {
      continue;
    }
    const symbols = Object.getOwnPropertySymbols(source);
    for (let j = 0; j < symbols.length; j++) {
      const symbol = symbols[j];
      if (propertyIsEnumerable.call(source, symbol)) {
        assignValue(source[symbol], symbol);
      }
    }
  }
  return result;
}
var extend = (a, b, thisArg, { allOwnKeys } = {}) => {
  forEach(
    b,
    (val, key) => {
      if (thisArg && isFunction(val)) {
        Object.defineProperty(a, key, {
          // Null-proto descriptor so a polluted Object.prototype.get cannot
          // hijack defineProperty's accessor-vs-data resolution.
          __proto__: null,
          value: bind(val, thisArg),
          writable: true,
          enumerable: true,
          configurable: true
        });
      } else {
        Object.defineProperty(a, key, {
          __proto__: null,
          value: val,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
    },
    { allOwnKeys }
  );
  return a;
};
var stripBOM = (content) => {
  if (content.charCodeAt(0) === 65279) {
    content = content.slice(1);
  }
  return content;
};
var inherits = (constructor, superConstructor, props, descriptors) => {
  constructor.prototype = Object.create(superConstructor.prototype, descriptors);
  Object.defineProperty(constructor.prototype, "constructor", {
    __proto__: null,
    value: constructor,
    writable: true,
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(constructor, "super", {
    __proto__: null,
    value: superConstructor.prototype
  });
  props && Object.assign(constructor.prototype, props);
};
var toFlatObject = (sourceObj, destObj, filter2, propFilter) => {
  let props;
  let i;
  let prop;
  const merged = {};
  destObj = destObj || {};
  if (sourceObj == null) return destObj;
  do {
    props = Object.getOwnPropertyNames(sourceObj);
    i = props.length;
    while (i-- > 0) {
      prop = props[i];
      if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
        destObj[prop] = sourceObj[prop];
        merged[prop] = true;
      }
    }
    sourceObj = filter2 !== false && getPrototypeOf(sourceObj);
  } while (sourceObj && (!filter2 || filter2(sourceObj, destObj)) && sourceObj !== Object.prototype);
  return destObj;
};
var endsWith = (str, searchString, position) => {
  str = String(str);
  if (position === void 0 || position > str.length) {
    position = str.length;
  }
  position -= searchString.length;
  const lastIndex = str.indexOf(searchString, position);
  return lastIndex !== -1 && lastIndex === position;
};
var toArray = (thing) => {
  if (!thing) return null;
  if (isArray(thing)) return thing;
  let i = thing.length;
  if (!isNumber(i)) return null;
  const arr = new Array(i);
  while (i-- > 0) {
    arr[i] = thing[i];
  }
  return arr;
};
var isTypedArray = /* @__PURE__ */ ((TypedArray) => {
  return (thing) => {
    return TypedArray && thing instanceof TypedArray;
  };
})(typeof Uint8Array !== "undefined" && getPrototypeOf(Uint8Array));
var forEachEntry = (obj, fn) => {
  const generator = obj && obj[iterator];
  const _iterator = generator.call(obj);
  let result;
  while ((result = _iterator.next()) && !result.done) {
    const pair = result.value;
    fn.call(obj, pair[0], pair[1]);
  }
};
var matchAll = (regExp, str) => {
  let matches;
  const arr = [];
  while ((matches = regExp.exec(str)) !== null) {
    arr.push(matches);
  }
  return arr;
};
var isHTMLForm = kindOfTest("HTMLFormElement");
var toCamelCase = (str) => {
  return str.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g, function replacer(m, p1, p2) {
    return p1.toUpperCase() + p2;
  });
};
var { propertyIsEnumerable } = Object.prototype;
var isRegExp = kindOfTest("RegExp");
var reduceDescriptors = (obj, reducer) => {
  const descriptors = Object.getOwnPropertyDescriptors(obj);
  const reducedDescriptors = {};
  forEach(descriptors, (descriptor, name) => {
    let ret;
    if ((ret = reducer(descriptor, name, obj)) !== false) {
      reducedDescriptors[name] = ret || descriptor;
    }
  });
  Object.defineProperties(obj, reducedDescriptors);
};
var freezeMethods = (obj) => {
  reduceDescriptors(obj, (descriptor, name) => {
    if (isFunction(obj) && ["arguments", "caller", "callee"].includes(name)) {
      return false;
    }
    const value = obj[name];
    if (!isFunction(value)) return;
    descriptor.enumerable = false;
    if ("writable" in descriptor) {
      descriptor.writable = false;
      return;
    }
    if (!descriptor.set) {
      descriptor.set = () => {
        throw Error("Can not rewrite read-only method '" + name + "'");
      };
    }
  });
};
var toObjectSet = (arrayOrString, delimiter) => {
  const obj = {};
  const define = (arr) => {
    arr.forEach((value) => {
      obj[value] = true;
    });
  };
  isArray(arrayOrString) ? define(arrayOrString) : define(String(arrayOrString).split(delimiter));
  return obj;
};
var noop = () => {
};
var toFiniteNumber = (value, defaultValue) => {
  return value != null && Number.isFinite(value = +value) ? value : defaultValue;
};
function isSpecCompliantForm(thing) {
  return !!(thing && isFunction(thing.append) && thing[toStringTag] === "FormData" && thing[iterator]);
}
var toJSONObject = (obj) => {
  const visited = /* @__PURE__ */ new WeakSet();
  const visit = (source) => {
    if (isObject(source)) {
      if (visited.has(source)) {
        return;
      }
      if (isBuffer(source)) {
        return source;
      }
      if (!("toJSON" in source)) {
        visited.add(source);
        let target;
        if (isSet(source)) {
          target = [];
          for (const value of source) {
            const reducedValue = visit(value);
            !isUndefined(reducedValue) && target.push(reducedValue);
          }
        } else {
          target = isArray(source) ? [] : {};
          forEach(source, (value, key) => {
            const reducedValue = visit(value);
            !isUndefined(reducedValue) && (target[key] = reducedValue);
          });
        }
        visited.delete(source);
        return target;
      }
    }
    return source;
  };
  return visit(obj);
};
var isAsyncFn = kindOfTest("AsyncFunction");
var isThenable = (thing) => thing && (isObject(thing) || isFunction(thing)) && isFunction(thing.then) && isFunction(thing.catch);
var _setImmediate = ((setImmediateSupported, postMessageSupported) => {
  if (setImmediateSupported) {
    return setImmediate;
  }
  return postMessageSupported ? ((token, callbacks) => {
    _global.addEventListener(
      "message",
      ({ source, data }) => {
        if (source === _global && data === token) {
          callbacks.length && callbacks.shift()();
        }
      },
      false
    );
    return (cb) => {
      callbacks.push(cb);
      _global.postMessage(token, "*");
    };
  })(`axios@${Math.random()}`, []) : (cb) => setTimeout(cb);
})(typeof setImmediate === "function", isFunction(_global.postMessage));
var asap = typeof queueMicrotask !== "undefined" ? queueMicrotask.bind(_global) : typeof process !== "undefined" && process.nextTick || _setImmediate;
var isIterable = (thing) => thing != null && isFunction(thing[iterator]);
var isSafeIterable = (thing) => thing != null && hasOwnInPrototypeChain(thing, iterator) && isIterable(thing);
var utils_default = {
  isArray,
  isArrayBuffer,
  isBuffer,
  isFormData,
  isArrayBufferView,
  isString,
  isNumber,
  isBoolean,
  isObject,
  isPlainObject: isPlainObject2,
  isEmptyObject,
  isReadableStream,
  isRequest,
  isResponse,
  isHeaders,
  isUndefined,
  isDate,
  isFile,
  isReactNativeBlob,
  isReactNative,
  isBlob,
  isRegExp,
  isFunction,
  isStream,
  isURLSearchParams,
  isTypedArray,
  isFileList,
  forEach,
  merge,
  extend,
  trim,
  stripBOM,
  inherits,
  toFlatObject,
  kindOf,
  kindOfTest,
  endsWith,
  toArray,
  forEachEntry,
  matchAll,
  isHTMLForm,
  hasOwnProperty,
  hasOwnProp: hasOwnProperty,
  // an alias to avoid ESLint no-prototype-builtins detection
  hasOwnInPrototypeChain,
  getSafeProp,
  toSafeFlatObject,
  reduceDescriptors,
  freezeMethods,
  toObjectSet,
  toCamelCase,
  noop,
  toFiniteNumber,
  findKey,
  global: _global,
  isContextDefined,
  isSpecCompliantForm,
  toJSONObject,
  isAsyncFn,
  isThenable,
  setImmediate: _setImmediate,
  asap,
  isIterable,
  isSafeIterable
};

// node_modules/axios/lib/helpers/parseHeaders.js
var ignoreDuplicateOf = utils_default.toObjectSet([
  "age",
  "authorization",
  "content-length",
  "content-type",
  "etag",
  "expires",
  "from",
  "host",
  "if-modified-since",
  "if-unmodified-since",
  "last-modified",
  "location",
  "max-forwards",
  "proxy-authorization",
  "referer",
  "retry-after",
  "user-agent"
]);
var parseHeaders_default = (rawHeaders) => {
  const parsed = {};
  let key;
  let val;
  let i;
  rawHeaders && rawHeaders.split("\n").forEach(function parser(line) {
    i = line.indexOf(":");
    key = line.substring(0, i).trim().toLowerCase();
    val = line.substring(i + 1).trim();
    const hasKey = utils_default.hasOwnProp(parsed, key);
    if (!key || hasKey && utils_default.hasOwnProp(ignoreDuplicateOf, key)) {
      return;
    }
    if (key === "set-cookie") {
      if (hasKey) {
        parsed[key].push(val);
      } else {
        parsed[key] = [val];
      }
    } else {
      parsed[key] = hasKey ? parsed[key] + ", " + val : val;
    }
  });
  return parsed;
};

// node_modules/axios/lib/helpers/sanitizeHeaderValue.js
function trimSPorHTAB(str) {
  let start = 0;
  let end = str.length;
  while (start < end) {
    const code = str.charCodeAt(start);
    if (code !== 9 && code !== 32) {
      break;
    }
    start += 1;
  }
  while (end > start) {
    const code = str.charCodeAt(end - 1);
    if (code !== 9 && code !== 32) {
      break;
    }
    end -= 1;
  }
  return start === 0 && end === str.length ? str : str.slice(start, end);
}
var INVALID_UNICODE_HEADER_VALUE_CHARS = new RegExp("[\\u0000-\\u0008\\u000a-\\u001f\\u007f]+", "g");
var INVALID_BYTE_STRING_HEADER_VALUE_CHARS = new RegExp("[^\\u0009\\u0020-\\u007e\\u0080-\\u00ff]+", "g");
function sanitizeValue(value, invalidChars) {
  if (utils_default.isArray(value)) {
    return value.map((item) => sanitizeValue(item, invalidChars));
  }
  return trimSPorHTAB(String(value).replace(invalidChars, ""));
}
var sanitizeHeaderValue = (value) => sanitizeValue(value, INVALID_UNICODE_HEADER_VALUE_CHARS);
var sanitizeByteStringHeaderValue = (value) => sanitizeValue(value, INVALID_BYTE_STRING_HEADER_VALUE_CHARS);
function toByteStringHeaderObject(headers) {
  const byteStringHeaders = /* @__PURE__ */ Object.create(null);
  utils_default.forEach(headers.toJSON(), (value, header) => {
    byteStringHeaders[header] = sanitizeByteStringHeaderValue(value);
  });
  return byteStringHeaders;
}

// node_modules/axios/lib/core/AxiosHeaders.js
var $internals = /* @__PURE__ */ Symbol("internals");
function normalizeHeader(header) {
  return header && String(header).trim().toLowerCase();
}
function normalizeValue(value) {
  if (value === false || value == null) {
    return value;
  }
  return utils_default.isArray(value) ? value.map(normalizeValue) : sanitizeHeaderValue(String(value));
}
function parseTokens(str) {
  const tokens = /* @__PURE__ */ Object.create(null);
  const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let match2;
  while (match2 = tokensRE.exec(str)) {
    tokens[match2[1]] = match2[2];
  }
  return tokens;
}
var parameterNameRE = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
function trimOWS(value) {
  let start = 0;
  let end = value.length;
  while (start < end) {
    const code = value.charCodeAt(start);
    if (code !== 9 && code !== 32) {
      break;
    }
    start += 1;
  }
  while (end > start) {
    const code = value.charCodeAt(end - 1);
    if (code !== 9 && code !== 32) {
      break;
    }
    end -= 1;
  }
  return start === 0 && end === value.length ? value : value.slice(start, end);
}
function decodeQuotedString(value) {
  const last = value.length - 1;
  if (last < 1 || value.charCodeAt(0) !== 34 || value.charCodeAt(last) !== 34) {
    return value;
  }
  let decoded = "";
  for (let i = 1; i < last; i++) {
    const code = value.charCodeAt(i);
    if (code === 34) {
      return value;
    }
    if (code === 92) {
      i += 1;
      if (i >= last) {
        return value;
      }
    }
    decoded += value[i];
  }
  return decoded;
}
function parseParameters(value) {
  const parameters = /* @__PURE__ */ Object.create(null);
  const str = String(value);
  let start = 0;
  let quoted = false;
  let escaped = false;
  function parseParameter(end) {
    const part = trimOWS(str.slice(start, end));
    const equals = part.indexOf("=");
    if (equals < 1) {
      return;
    }
    const name = trimOWS(part.slice(0, equals));
    if (!parameterNameRE.test(name)) {
      return;
    }
    const normalizedName = name.toLowerCase();
    if (normalizedName === "__proto__" || normalizedName === "constructor" || normalizedName === "prototype") {
      return;
    }
    const parameterValue = trimOWS(part.slice(equals + 1));
    parameters[normalizedName] = decodeQuotedString(parameterValue);
  }
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (quoted) {
      if (escaped) {
        escaped = false;
      } else if (code === 92) {
        escaped = true;
      } else if (code === 34) {
        quoted = false;
      }
    } else if (code === 34) {
      quoted = true;
    } else if (code === 44 || code === 59) {
      parseParameter(i);
      start = i + 1;
    }
  }
  parseParameter(str.length);
  return parameters;
}
var isValidHeaderName = (str) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(str.trim());
function matchHeaderValue(context, value, header, filter2, isHeaderNameFilter) {
  if (utils_default.isFunction(filter2)) {
    return filter2.call(this, value, header);
  }
  if (isHeaderNameFilter) {
    value = header;
  }
  if (!utils_default.isString(value)) return;
  if (utils_default.isString(filter2)) {
    return value.indexOf(filter2) !== -1;
  }
  if (utils_default.isRegExp(filter2)) {
    return filter2.test(value);
  }
}
function formatHeader(header) {
  return header.trim().toLowerCase().replace(/([a-z\d])(\w*)/g, (w, char, str) => {
    return char.toUpperCase() + str;
  });
}
function buildAccessors(obj, header) {
  const accessorName = utils_default.toCamelCase(" " + header);
  ["get", "set", "has"].forEach((methodName) => {
    Object.defineProperty(obj, methodName + accessorName, {
      // Null-proto descriptor so a polluted Object.prototype.get cannot turn
      // this data descriptor into an accessor descriptor on the way in.
      __proto__: null,
      value: function(arg1, arg2, arg3) {
        return this[methodName].call(this, header, arg1, arg2, arg3);
      },
      configurable: true
    });
  });
}
var AxiosHeaders = class {
  constructor(headers) {
    headers && this.set(headers);
  }
  set(header, valueOrRewrite, rewrite) {
    const self2 = this;
    function setHeader(_value, _header, _rewrite) {
      const lHeader = normalizeHeader(_header);
      if (!lHeader) {
        return;
      }
      const key = utils_default.findKey(self2, lHeader);
      if (!key || self2[key] === void 0 || _rewrite === true || _rewrite === void 0 && self2[key] !== false) {
        self2[key || _header] = normalizeValue(_value);
      }
    }
    const setHeaders = (headers, _rewrite) => utils_default.forEach(headers, (_value, _header) => setHeader(_value, _header, _rewrite));
    if (utils_default.isPlainObject(header) || header instanceof this.constructor) {
      setHeaders(header, valueOrRewrite);
    } else if (utils_default.isString(header) && (header = header.trim()) && !isValidHeaderName(header)) {
      setHeaders(parseHeaders_default(header), valueOrRewrite);
    } else if (utils_default.isObject(header) && utils_default.isSafeIterable(header)) {
      let obj = /* @__PURE__ */ Object.create(null), dest, key;
      for (const entry of header) {
        if (!utils_default.isArray(entry)) {
          throw new TypeError("Object iterator must return a key-value pair");
        }
        key = entry[0];
        if (utils_default.hasOwnProp(obj, key)) {
          dest = obj[key];
          obj[key] = utils_default.isArray(dest) ? [...dest, entry[1]] : [dest, entry[1]];
        } else {
          obj[key] = entry[1];
        }
      }
      setHeaders(obj, valueOrRewrite);
    } else {
      header != null && setHeader(valueOrRewrite, header, rewrite);
    }
    return this;
  }
  get(header, parser) {
    header = normalizeHeader(header);
    if (header) {
      const key = utils_default.findKey(this, header);
      if (key) {
        const value = this[key];
        if (!parser) {
          return value;
        }
        if (parser === true) {
          return parseTokens(value);
        }
        if (utils_default.isFunction(parser)) {
          return parser.call(this, value, key);
        }
        if (utils_default.isRegExp(parser)) {
          return parser.exec(value);
        }
        throw new TypeError("parser must be boolean|regexp|function");
      }
    }
  }
  has(header, matcher) {
    header = normalizeHeader(header);
    if (header) {
      const key = utils_default.findKey(this, header);
      return !!(key && this[key] !== void 0 && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
    }
    return false;
  }
  delete(header, matcher) {
    const self2 = this;
    let deleted = false;
    function deleteHeader(_header) {
      _header = normalizeHeader(_header);
      if (_header) {
        const key = utils_default.findKey(self2, _header);
        if (key && (!matcher || matchHeaderValue(self2, self2[key], key, matcher))) {
          delete self2[key];
          deleted = true;
        }
      }
    }
    if (utils_default.isArray(header)) {
      header.forEach(deleteHeader);
    } else {
      deleteHeader(header);
    }
    return deleted;
  }
  clear(matcher) {
    const keys = Object.keys(this);
    let i = keys.length;
    let deleted = false;
    while (i--) {
      const key = keys[i];
      if (!matcher || matchHeaderValue(this, this[key], key, matcher, true)) {
        delete this[key];
        deleted = true;
      }
    }
    return deleted;
  }
  normalize(format) {
    const self2 = this;
    const headers = {};
    utils_default.forEach(this, (value, header) => {
      const key = utils_default.findKey(headers, header);
      if (key) {
        self2[key] = normalizeValue(value);
        delete self2[header];
        return;
      }
      const normalized = format ? formatHeader(header) : String(header).trim();
      if (normalized !== header) {
        delete self2[header];
      }
      self2[normalized] = normalizeValue(value);
      headers[normalized] = true;
    });
    return this;
  }
  concat(...targets) {
    return this.constructor.concat(this, ...targets);
  }
  toJSON(asStrings) {
    const obj = /* @__PURE__ */ Object.create(null);
    utils_default.forEach(this, (value, header) => {
      value != null && value !== false && (obj[header] = asStrings && utils_default.isArray(value) ? value.join(", ") : value);
    });
    return obj;
  }
  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }
  toString() {
    return Object.entries(this.toJSON()).map(([header, value]) => header + ": " + value).join("\n");
  }
  getSetCookie() {
    const value = this.get("set-cookie");
    return utils_default.isArray(value) ? value : value == null || value === false ? [] : [value];
  }
  get [Symbol.toStringTag]() {
    return "AxiosHeaders";
  }
  static from(thing) {
    return thing instanceof this ? thing : new this(thing);
  }
  static parseParameters(value) {
    return parseParameters(value);
  }
  static concat(first, ...targets) {
    const computed = new this(first);
    targets.forEach((target) => computed.set(target));
    return computed;
  }
  static accessor(header) {
    const internals = this[$internals] = this[$internals] = {
      accessors: {}
    };
    const accessors = internals.accessors;
    const prototype2 = this.prototype;
    function defineAccessor(_header) {
      const lHeader = normalizeHeader(_header);
      if (!accessors[lHeader]) {
        buildAccessors(prototype2, _header);
        accessors[lHeader] = true;
      }
    }
    utils_default.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);
    return this;
  }
};
AxiosHeaders.accessor([
  "Content-Type",
  "Content-Length",
  "Accept",
  "Accept-Encoding",
  "User-Agent",
  "Authorization"
]);
utils_default.reduceDescriptors(AxiosHeaders.prototype, ({ value }, key) => {
  let mapped = key[0].toUpperCase() + key.slice(1);
  return {
    get: () => value,
    set(headerValue) {
      this[mapped] = headerValue;
    }
  };
});
utils_default.freezeMethods(AxiosHeaders);
var AxiosHeaders_default = AxiosHeaders;

// node_modules/axios/lib/core/AxiosError.js
var REDACTED = "[REDACTED ****]";
function hasOwnOrPrototypeToJSON(source) {
  if (utils_default.hasOwnProp(source, "toJSON")) {
    return true;
  }
  let prototype2 = Object.getPrototypeOf(source);
  while (prototype2 && prototype2 !== Object.prototype) {
    if (utils_default.hasOwnProp(prototype2, "toJSON")) {
      return true;
    }
    prototype2 = Object.getPrototypeOf(prototype2);
  }
  return false;
}
function redactConfig(config, redactKeys) {
  const lowerKeys = new Set(redactKeys.map((k) => String(k).toLowerCase()));
  const seen = [];
  const visit = (source) => {
    if (source === null || typeof source !== "object") return source;
    if (utils_default.isBuffer(source)) return source;
    if (seen.indexOf(source) !== -1) return void 0;
    if (source instanceof AxiosHeaders_default) {
      source = source.toJSON();
    }
    seen.push(source);
    let result;
    if (utils_default.isArray(source)) {
      result = [];
      source.forEach((v, i) => {
        const reducedValue = visit(v);
        if (!utils_default.isUndefined(reducedValue)) {
          result[i] = reducedValue;
        }
      });
    } else {
      if (!utils_default.isPlainObject(source) && hasOwnOrPrototypeToJSON(source)) {
        seen.pop();
        return source;
      }
      result = /* @__PURE__ */ Object.create(null);
      for (const [key, value] of Object.entries(source)) {
        const reducedValue = lowerKeys.has(key.toLowerCase()) ? REDACTED : visit(value);
        if (!utils_default.isUndefined(reducedValue)) {
          result[key] = reducedValue;
        }
      }
    }
    seen.pop();
    return result;
  };
  return visit(config);
}
function stringifySafely(value) {
  try {
    return String(value);
  } catch (err) {
    return "";
  }
}
function aggregateErrorMessage(error) {
  const message = error.errors.map((entry) => {
    try {
      return entry && entry.message ? stringifySafely(entry.message) : stringifySafely(entry);
    } catch (err) {
      return "";
    }
  }).filter(Boolean).join("; ");
  return message || error.name || "AggregateError";
}
var AxiosError = class _AxiosError extends Error {
  static from(error, code, config, request2, response, customProps) {
    let message = error.message;
    if (!message && utils_default.isArray(error.errors) && error.errors.length) {
      message = aggregateErrorMessage(error);
    }
    const axiosError = new _AxiosError(message, code || error.code, config, request2, response);
    Object.defineProperty(axiosError, "cause", {
      __proto__: null,
      value: error,
      writable: true,
      enumerable: false,
      configurable: true
    });
    axiosError.name = error.name;
    if (error.status != null && axiosError.status == null) {
      axiosError.status = error.status;
    }
    customProps && Object.assign(axiosError, customProps);
    return axiosError;
  }
  /**
   * Create an Error with the specified message, config, error code, request and response.
   *
   * @param {string} message The error message.
   * @param {string} [code] The error code (for example, 'ECONNABORTED').
   * @param {Object} [config] The config.
   * @param {Object} [request] The request.
   * @param {Object} [response] The response.
   *
   * @returns {Error} The created error.
   */
  constructor(message, code, config, request2, response) {
    super(message);
    Object.defineProperty(this, "message", {
      // Null-proto descriptor so a polluted Object.prototype.get cannot turn
      // this data descriptor into an accessor descriptor on the way in.
      __proto__: null,
      value: message,
      enumerable: true,
      writable: true,
      configurable: true
    });
    this.name = "AxiosError";
    this.isAxiosError = true;
    code && (this.code = code);
    config && (this.config = config);
    request2 && (this.request = request2);
    if (response) {
      this.response = response;
      this.status = response.status;
    }
  }
  toJSON() {
    const config = this.config;
    const redactKeys = config && utils_default.hasOwnProp(config, "redact") ? config.redact : void 0;
    const serializedConfig = utils_default.isArray(redactKeys) && redactKeys.length > 0 ? redactConfig(config, redactKeys) : utils_default.toJSONObject(config);
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: serializedConfig,
      code: this.code,
      status: this.status
    };
  }
};
AxiosError.ERR_BAD_OPTION_VALUE = "ERR_BAD_OPTION_VALUE";
AxiosError.ERR_BAD_OPTION = "ERR_BAD_OPTION";
AxiosError.ECONNABORTED = "ECONNABORTED";
AxiosError.ETIMEDOUT = "ETIMEDOUT";
AxiosError.ECONNREFUSED = "ECONNREFUSED";
AxiosError.ERR_NETWORK = "ERR_NETWORK";
AxiosError.ERR_FR_TOO_MANY_REDIRECTS = "ERR_FR_TOO_MANY_REDIRECTS";
AxiosError.ERR_DEPRECATED = "ERR_DEPRECATED";
AxiosError.ERR_BAD_RESPONSE = "ERR_BAD_RESPONSE";
AxiosError.ERR_BAD_REQUEST = "ERR_BAD_REQUEST";
AxiosError.ERR_CANCELED = "ERR_CANCELED";
AxiosError.ERR_NOT_SUPPORT = "ERR_NOT_SUPPORT";
AxiosError.ERR_INVALID_URL = "ERR_INVALID_URL";
AxiosError.ERR_FORM_DATA_DEPTH_EXCEEDED = "ERR_FORM_DATA_DEPTH_EXCEEDED";
var AxiosError_default = AxiosError;

// node_modules/axios/lib/helpers/null.js
var null_default = null;

// node_modules/axios/lib/helpers/toFormData.js
var DEFAULT_FORM_DATA_MAX_DEPTH = 100;
function isVisitable(thing) {
  return utils_default.isPlainObject(thing) || utils_default.isArray(thing);
}
function removeBrackets(key) {
  return utils_default.endsWith(key, "[]") ? key.slice(0, -2) : key;
}
function renderKey(path, key, dots) {
  if (!path) return key;
  return path.concat(key).map(function each(token, i) {
    token = removeBrackets(token);
    return !dots && i ? "[" + token + "]" : token;
  }).join(dots ? "." : "");
}
function isFlatArray(arr) {
  return utils_default.isArray(arr) && !arr.some(isVisitable);
}
var predicates = utils_default.toFlatObject(utils_default, {}, null, function filter(prop) {
  return /^is[A-Z]/.test(prop);
});
function toFormData(obj, formData, options) {
  if (!utils_default.isObject(obj)) {
    throw new TypeError("target must be an object");
  }
  formData = formData || new (null_default || FormData)();
  const option = (name, fallback) => {
    const value = utils_default.getSafeProp(options, name);
    return utils_default.isUndefined(value) ? fallback : value;
  };
  const metaTokens = option("metaTokens", true);
  const visitor = option("visitor") || defaultVisitor;
  const dots = option("dots", false);
  const indexes = option("indexes", false);
  const _Blob = option("Blob") || typeof Blob !== "undefined" && Blob;
  const maxDepth = option("maxDepth", DEFAULT_FORM_DATA_MAX_DEPTH);
  const useBlob = _Blob && utils_default.isSpecCompliantForm(formData);
  const stack = [];
  if (!utils_default.isFunction(visitor)) {
    throw new TypeError("visitor must be a function");
  }
  function convertValue(value) {
    if (value === null) return "";
    if (utils_default.isDate(value)) {
      return value.toISOString();
    }
    if (utils_default.isBoolean(value)) {
      return value.toString();
    }
    if (!useBlob && utils_default.isBlob(value)) {
      throw new AxiosError_default("Blob is not supported. Use a Buffer instead.");
    }
    if (utils_default.isArrayBuffer(value) || utils_default.isTypedArray(value)) {
      if (useBlob && typeof _Blob === "function") {
        return new _Blob([value]);
      }
      if (null_default && null_default.isBufferAvailable()) {
        return null_default.from(value);
      }
      throw new AxiosError_default(
        "Blob is not supported. Use a Buffer instead.",
        AxiosError_default.ERR_NOT_SUPPORT
      );
    }
    return value;
  }
  function throwIfMaxDepthExceeded(depth) {
    if (depth > maxDepth) {
      throw new AxiosError_default(
        "Object is too deeply nested (" + depth + " levels). Max depth: " + maxDepth,
        AxiosError_default.ERR_FORM_DATA_DEPTH_EXCEEDED
      );
    }
  }
  function stringifyWithDepthLimit(value, depth) {
    if (maxDepth === Infinity) {
      return JSON.stringify(value);
    }
    const ancestors = [];
    return JSON.stringify(value, function limitDepth(_key, currentValue) {
      if (!utils_default.isObject(currentValue)) {
        return currentValue;
      }
      while (ancestors.length && ancestors[ancestors.length - 1] !== this) {
        ancestors.pop();
      }
      ancestors.push(currentValue);
      throwIfMaxDepthExceeded(depth + ancestors.length - 1);
      return currentValue;
    });
  }
  function defaultVisitor(value, key, path) {
    let arr = value;
    if (utils_default.isReactNative(formData) && utils_default.isReactNativeBlob(value)) {
      formData.append(renderKey(path, key, dots), convertValue(value));
      return false;
    }
    if (value && !path && typeof value === "object") {
      if (utils_default.endsWith(key, "{}")) {
        key = metaTokens ? key : key.slice(0, -2);
        value = stringifyWithDepthLimit(value, 1);
      } else if (utils_default.isArray(value) && isFlatArray(value) || (utils_default.isFileList(value) || utils_default.endsWith(key, "[]")) && (arr = utils_default.toArray(value))) {
        key = removeBrackets(key);
        arr.forEach(function each(el, index) {
          !(utils_default.isUndefined(el) || el === null) && formData.append(
            // eslint-disable-next-line no-nested-ternary
            indexes === true ? renderKey([key], index, dots) : indexes === null ? key : key + "[]",
            convertValue(el)
          );
        });
        return false;
      }
    }
    if (isVisitable(value)) {
      return true;
    }
    formData.append(renderKey(path, key, dots), convertValue(value));
    return false;
  }
  const exposedHelpers = Object.assign(predicates, {
    defaultVisitor,
    convertValue,
    isVisitable
  });
  function build(value, path, depth = 0) {
    if (utils_default.isUndefined(value)) return;
    throwIfMaxDepthExceeded(depth);
    if (stack.indexOf(value) !== -1) {
      throw new Error("Circular reference detected in " + path.join("."));
    }
    stack.push(value);
    utils_default.forEach(value, function each(el, key) {
      const result = !(utils_default.isUndefined(el) || el === null) && visitor.call(formData, el, utils_default.isString(key) ? key.trim() : key, path, exposedHelpers);
      if (result === true) {
        build(el, path ? path.concat(key) : [key], depth + 1);
      }
    });
    stack.pop();
  }
  if (!utils_default.isObject(obj)) {
    throw new TypeError("data must be an object");
  }
  build(obj);
  return formData;
}
var toFormData_default = toFormData;

// node_modules/axios/lib/helpers/AxiosURLSearchParams.js
function encode(str) {
  const charMap = {
    "!": "%21",
    "'": "%27",
    "(": "%28",
    ")": "%29",
    "~": "%7E",
    "%20": "+"
  };
  return encodeURIComponent(str).replace(/[!'()~]|%20/g, function replacer(match2) {
    return charMap[match2];
  });
}
function AxiosURLSearchParams(params, options) {
  this._pairs = [];
  params && toFormData_default(params, this, options);
}
var prototype = AxiosURLSearchParams.prototype;
prototype.append = function append(name, value) {
  this._pairs.push([name, value]);
};
prototype.toString = function toString2(encoder) {
  const _encode = encoder ? (value) => encoder.call(this, value, encode) : encode;
  return this._pairs.map(function each(pair) {
    return _encode(pair[0]) + "=" + _encode(pair[1]);
  }, "").join("&");
};
var AxiosURLSearchParams_default = AxiosURLSearchParams;

// node_modules/axios/lib/helpers/buildURL.js
function encode2(val) {
  return encodeURIComponent(val).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+");
}
function buildURL(url2, params, options) {
  if (!params) {
    return url2;
  }
  url2 = url2 || "";
  const _options = utils_default.isFunction(options) ? {
    serialize: options
  } : options;
  const _encode = utils_default.getSafeProp(_options, "encode") || encode2;
  const serializeFn = utils_default.getSafeProp(_options, "serialize");
  let serializedParams;
  if (serializeFn) {
    serializedParams = serializeFn(params, _options);
  } else {
    serializedParams = utils_default.isURLSearchParams(params) ? params.toString() : new AxiosURLSearchParams_default(params, _options).toString(_encode);
  }
  if (serializedParams) {
    const hashmarkIndex = url2.indexOf("#");
    if (hashmarkIndex !== -1) {
      url2 = url2.slice(0, hashmarkIndex);
    }
    url2 += (url2.indexOf("?") === -1 ? "?" : "&") + serializedParams;
  }
  return url2;
}

// node_modules/axios/lib/core/InterceptorManager.js
var $internals2 = /* @__PURE__ */ Symbol("internals");
function countHandlers(handlers) {
  return handlers ? handlers.length : 0;
}
function trimHandlers(handlers) {
  if (!handlers) {
    return;
  }
  while (handlers.length && handlers[handlers.length - 1] === null) {
    handlers.pop();
  }
}
function syncHandlerEntries(manager, internals) {
  const handlers = manager.handlers;
  const length2 = countHandlers(handlers);
  if (handlers !== internals.handlersRef) {
    internals.handlersRef = handlers;
    internals.handlerEntries.clear();
  } else if (length2 !== internals.handlersLength) {
    if (!length2) {
      internals.handlerEntries.clear();
    } else {
      internals.handlerEntries.forEach(function removeStaleEntry(entry, id) {
        if (handlers[entry.index] !== entry.handler) {
          internals.handlerEntries.delete(id);
        }
      });
    }
  }
  internals.handlersLength = length2;
}
var InterceptorManager = class {
  constructor() {
    this.handlers = [];
    this[$internals2] = {
      handlersRef: this.handlers,
      handlersLength: this.handlers.length,
      handlerEntries: /* @__PURE__ */ new Map(),
      iterationDepth: 0,
      nextId: 0
    };
  }
  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   * @param {Object} options The options for the interceptor, synchronous and runWhen
   *
   * @return {Number} An ID used to remove interceptor later
   */
  use(fulfilled, rejected, options) {
    const handler = {
      fulfilled,
      rejected,
      synchronous: options ? options.synchronous : false,
      runWhen: options ? options.runWhen : null
    };
    const internals = this[$internals2];
    if (this.handlers == null) {
      this.handlers = [];
    }
    syncHandlerEntries(this, internals);
    const id = internals.nextId++;
    this.handlers.push(handler);
    internals.handlerEntries.set(id, {
      handler,
      index: this.handlers.length - 1
    });
    internals.handlersLength = this.handlers.length;
    return id;
  }
  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   *
   * @returns {void}
   */
  eject(id) {
    const internals = this[$internals2];
    syncHandlerEntries(this, internals);
    const entry = internals.handlerEntries.get(id);
    if (entry) {
      internals.handlerEntries.delete(id);
      if (this.handlers[entry.index] !== entry.handler) {
        return;
      }
      this.handlers[entry.index] = null;
      if (!internals.iterationDepth) {
        trimHandlers(this.handlers);
        internals.handlersLength = this.handlers.length;
      }
    }
  }
  /**
   * Clear all interceptors from the stack
   *
   * @returns {void}
   */
  clear() {
    if (this.handlers) {
      this.handlers = [];
      syncHandlerEntries(this, this[$internals2]);
    }
  }
  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   *
   * @returns {void}
   */
  forEach(fn) {
    const internals = this[$internals2];
    syncHandlerEntries(this, internals);
    internals.iterationDepth++;
    try {
      utils_default.forEach(this.handlers, function forEachHandler(h) {
        if (h !== null) {
          fn(h);
        }
      });
    } finally {
      if (!--internals.iterationDepth) {
        syncHandlerEntries(this, internals);
        trimHandlers(this.handlers);
        internals.handlersLength = countHandlers(this.handlers);
      }
    }
  }
};
var InterceptorManager_default = InterceptorManager;

// node_modules/axios/lib/defaults/transitional.js
var transitional_default = {
  silentJSONParsing: true,
  forcedJSONParsing: true,
  clarifyTimeoutError: false,
  legacyInterceptorReqResOrdering: true,
  advertiseZstdAcceptEncoding: false,
  validateStatusUndefinedResolves: true
};

// node_modules/axios/lib/platform/browser/classes/URLSearchParams.js
var URLSearchParams_default = typeof URLSearchParams !== "undefined" ? URLSearchParams : AxiosURLSearchParams_default;

// node_modules/axios/lib/platform/browser/classes/FormData.js
var FormData_default = typeof FormData !== "undefined" ? FormData : null;

// node_modules/axios/lib/platform/browser/classes/Blob.js
var Blob_default = typeof Blob !== "undefined" ? Blob : null;

// node_modules/axios/lib/platform/browser/index.js
var browser_default = {
  isBrowser: true,
  classes: {
    URLSearchParams: URLSearchParams_default,
    FormData: FormData_default,
    Blob: Blob_default
  },
  protocols: ["http", "https", "file", "blob", "url", "data"]
};

// node_modules/axios/lib/platform/common/utils.js
var utils_exports2 = {};
__export(utils_exports2, {
  hasBrowserEnv: () => hasBrowserEnv,
  hasStandardBrowserEnv: () => hasStandardBrowserEnv,
  hasStandardBrowserWebWorkerEnv: () => hasStandardBrowserWebWorkerEnv,
  navigator: () => _navigator,
  origin: () => origin
});
var hasBrowserEnv = typeof window !== "undefined" && typeof document !== "undefined";
var _navigator = typeof navigator === "object" && navigator || void 0;
var hasStandardBrowserEnv = hasBrowserEnv && (!_navigator || ["ReactNative", "NativeScript", "NS"].indexOf(_navigator.product) < 0);
var hasStandardBrowserWebWorkerEnv = (() => {
  return typeof WorkerGlobalScope !== "undefined" && // eslint-disable-next-line no-undef
  self instanceof WorkerGlobalScope && typeof self.importScripts === "function";
})();
var origin = hasBrowserEnv && window.location.href || "http://localhost";

// node_modules/axios/lib/platform/index.js
var platform_default = {
  ...utils_exports2,
  ...browser_default
};

// node_modules/axios/lib/helpers/toURLEncodedForm.js
function toURLEncodedForm(data, options) {
  return toFormData_default(data, new platform_default.classes.URLSearchParams(), {
    visitor: function(value, key, path, helpers) {
      if (platform_default.isNode && utils_default.isBuffer(value)) {
        this.append(key, value.toString("base64"));
        return false;
      }
      return helpers.defaultVisitor.apply(this, arguments);
    },
    ...options
  });
}

// node_modules/axios/lib/helpers/formDataToJSON.js
var MAX_DEPTH = DEFAULT_FORM_DATA_MAX_DEPTH;
function throwIfDepthExceeded(index) {
  if (index > MAX_DEPTH) {
    throw new AxiosError_default(
      "FormData field is too deeply nested (" + index + " levels). Max depth: " + MAX_DEPTH,
      AxiosError_default.ERR_FORM_DATA_DEPTH_EXCEEDED
    );
  }
}
function parsePropPath(name) {
  const path = [];
  const pattern = /[^.[\]]+|\[([^.[\]]*)]/g;
  let match2;
  while ((match2 = pattern.exec(name)) !== null) {
    throwIfDepthExceeded(path.length);
    path.push(match2[0] === "[]" ? "" : match2[1] || match2[0]);
  }
  return path;
}
function arrayToObject(arr) {
  const obj = {};
  const keys = Object.keys(arr);
  let i;
  const len = keys.length;
  let key;
  for (i = 0; i < len; i++) {
    key = keys[i];
    obj[key] = arr[key];
  }
  return obj;
}
function formDataToJSON(formData) {
  function buildPath(path, value, target, index) {
    throwIfDepthExceeded(index);
    let name = path[index++];
    if (name === "__proto__") return true;
    const isNumericKey = Number.isFinite(+name);
    const isLast = index >= path.length;
    name = !name && utils_default.isArray(target) ? target.length : name;
    if (isLast) {
      if (utils_default.hasOwnProp(target, name)) {
        target[name] = utils_default.isArray(target[name]) ? target[name].concat(value) : [target[name], value];
      } else {
        target[name] = value;
      }
      return !isNumericKey;
    }
    if (!utils_default.hasOwnProp(target, name) || !utils_default.isObject(target[name])) {
      target[name] = [];
    }
    const result = buildPath(path, value, target[name], index);
    if (result && utils_default.isArray(target[name])) {
      target[name] = arrayToObject(target[name]);
    }
    return !isNumericKey;
  }
  if (utils_default.isFormData(formData) && utils_default.isFunction(formData.entries)) {
    const obj = {};
    utils_default.forEachEntry(formData, (name, value) => {
      buildPath(parsePropPath(name), value, obj, 0);
    });
    return obj;
  }
  return null;
}
var formDataToJSON_default = formDataToJSON;

// node_modules/axios/lib/core/methodList.js
var methodList = Object.freeze([
  "get",
  "delete",
  "head",
  "options",
  "post",
  "put",
  "patch",
  "purge",
  "link",
  "unlink",
  "query"
]);
var methodList_default = methodList;

// node_modules/axios/lib/defaults/index.js
var own = (obj, key) => obj != null && utils_default.hasOwnProp(obj, key) ? obj[key] : void 0;
function stringifySafely2(rawValue, parser, encoder) {
  if (utils_default.isString(rawValue)) {
    try {
      (parser || JSON.parse)(rawValue);
      return utils_default.trim(rawValue);
    } catch (e) {
      if (e.name !== "SyntaxError") {
        throw e;
      }
    }
  }
  return (encoder || JSON.stringify)(rawValue);
}
var defaults = {
  transitional: transitional_default,
  adapter: ["xhr", "http", "fetch"],
  transformRequest: [
    function transformRequest(data, headers) {
      const contentType = headers.getContentType() || "";
      const hasJSONContentType = contentType.indexOf("application/json") > -1;
      const isObjectPayload = utils_default.isObject(data);
      if (isObjectPayload && utils_default.isHTMLForm(data)) {
        data = new FormData(data);
      }
      const isFormData2 = utils_default.isFormData(data);
      if (isFormData2) {
        return hasJSONContentType ? JSON.stringify(formDataToJSON_default(data)) : data;
      }
      if (utils_default.isArrayBuffer(data) || utils_default.isBuffer(data) || utils_default.isStream(data) || utils_default.isFile(data) || utils_default.isBlob(data) || utils_default.isReadableStream(data)) {
        return data;
      }
      if (utils_default.isArrayBufferView(data)) {
        return data.buffer;
      }
      if (utils_default.isURLSearchParams(data)) {
        headers.setContentType("application/x-www-form-urlencoded;charset=utf-8", false);
        return data.toString();
      }
      let isFileList2;
      if (isObjectPayload) {
        const formSerializer = own(this, "formSerializer");
        if (contentType.indexOf("application/x-www-form-urlencoded") > -1) {
          return toURLEncodedForm(data, formSerializer).toString();
        }
        if ((isFileList2 = utils_default.isFileList(data)) || contentType.indexOf("multipart/form-data") > -1) {
          const env = own(this, "env");
          const _FormData = env && env.FormData;
          return toFormData_default(
            isFileList2 ? { "files[]": data } : data,
            _FormData && new _FormData(),
            formSerializer
          );
        }
      }
      if (isObjectPayload || hasJSONContentType) {
        headers.setContentType("application/json", false);
        return stringifySafely2(data);
      }
      return data;
    }
  ],
  transformResponse: [
    function transformResponse(data) {
      const transitional2 = own(this, "transitional") || defaults.transitional;
      const forcedJSONParsing = transitional2 && transitional2.forcedJSONParsing;
      const responseType = own(this, "responseType");
      const JSONRequested = responseType === "json";
      if (utils_default.isResponse(data) || utils_default.isReadableStream(data)) {
        return data;
      }
      if (data && utils_default.isString(data) && (forcedJSONParsing && !responseType || JSONRequested)) {
        const silentJSONParsing = transitional2 && transitional2.silentJSONParsing;
        const strictJSONParsing = !silentJSONParsing && JSONRequested;
        try {
          return JSON.parse(data, own(this, "parseReviver"));
        } catch (e) {
          if (strictJSONParsing) {
            if (e.name === "SyntaxError") {
              throw AxiosError_default.from(e, AxiosError_default.ERR_BAD_RESPONSE, this, null, own(this, "response"));
            }
            throw e;
          }
        }
      }
      return data;
    }
  ],
  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  maxContentLength: -1,
  maxBodyLength: -1,
  env: {
    FormData: platform_default.classes.FormData,
    Blob: platform_default.classes.Blob
  },
  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  },
  headers: {
    common: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": void 0
    }
  }
};
utils_default.forEach(methodList_default, (method) => {
  defaults.headers[method] = {};
});
var defaults_default = defaults;

// node_modules/axios/lib/core/transformData.js
function transformData(fns, response) {
  const config = this || defaults_default;
  const context = response || config;
  const headers = AxiosHeaders_default.from(context.headers);
  let data = context.data;
  utils_default.forEach(fns, function transform2(fn) {
    data = fn.call(config, data, headers.normalize(), response ? response.status : void 0);
  });
  headers.normalize();
  return data;
}

// node_modules/axios/lib/cancel/isCancel.js
function isCancel(value) {
  return !!(value && value.__CANCEL__);
}

// node_modules/axios/lib/cancel/CanceledError.js
var CanceledError = class extends AxiosError_default {
  /**
   * A `CanceledError` is an object that is thrown when an operation is canceled.
   *
   * @param {string=} message The message.
   * @param {Object=} config The config.
   * @param {Object=} request The request.
   *
   * @returns {CanceledError} The created error.
   */
  constructor(message, config, request2) {
    super(message == null ? "canceled" : message, AxiosError_default.ERR_CANCELED, config, request2);
    this.name = "CanceledError";
    this.__CANCEL__ = true;
  }
};
var CanceledError_default = CanceledError;

// node_modules/axios/lib/core/settle.js
function settle(resolve, reject, response) {
  const validateStatus2 = response.config.validateStatus;
  if (!response.status || !validateStatus2 || validateStatus2(response.status)) {
    resolve(response);
  } else {
    reject(new AxiosError_default(
      "Request failed with status code " + response.status,
      response.status >= 400 && response.status < 500 ? AxiosError_default.ERR_BAD_REQUEST : AxiosError_default.ERR_BAD_RESPONSE,
      response.config,
      response.request,
      response
    ));
  }
}

// node_modules/axios/lib/helpers/normalizeURLForProtocolCheck.js
var urlParserControlCharacters = /[\t\n\r]/g;
function normalizeURLForProtocolCheck(url2) {
  if (typeof url2 !== "string") {
    return url2;
  }
  let start = 0;
  while (start < url2.length && url2.charCodeAt(start) <= 32) {
    start++;
  }
  return url2.slice(start).replace(urlParserControlCharacters, "");
}

// node_modules/axios/lib/helpers/parseProtocol.js
function parseProtocol(url2) {
  const match2 = /^([-+\w]{1,25}):(?:\/\/)?/.exec(url2);
  return match2 && match2[1] || "";
}

// node_modules/axios/lib/helpers/speedometer.js
function speedometer(samplesCount, min) {
  samplesCount = samplesCount || 10;
  const bytes = new Array(samplesCount);
  const timestamps = new Array(samplesCount);
  let head = 0;
  let tail = 0;
  let firstSampleTS;
  min = min !== void 0 ? min : 1e3;
  return function push(chunkLength) {
    const now = Date.now();
    const startedAt = timestamps[tail];
    if (!firstSampleTS) {
      firstSampleTS = now;
    }
    bytes[head] = chunkLength;
    timestamps[head] = now;
    let i = tail;
    let bytesCount = 0;
    while (i !== head) {
      bytesCount += bytes[i++];
      i = i % samplesCount;
    }
    head = (head + 1) % samplesCount;
    if (head === tail) {
      tail = (tail + 1) % samplesCount;
    }
    if (now - firstSampleTS < min) {
      return;
    }
    const passed = startedAt && now - startedAt;
    return passed ? Math.round(bytesCount * 1e3 / passed) : void 0;
  };
}
var speedometer_default = speedometer;

// node_modules/axios/lib/helpers/throttle.js
function throttle(fn, freq) {
  let timestamp = 0;
  let threshold = 1e3 / freq;
  let lastArgs;
  let timer;
  const invoke = (args, now = Date.now()) => {
    timestamp = now;
    lastArgs = null;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    fn(...args);
  };
  const throttled = (...args) => {
    const now = Date.now();
    const passed = now - timestamp;
    if (passed >= threshold) {
      invoke(args, now);
    } else {
      lastArgs = args;
      if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          invoke(lastArgs);
        }, threshold - passed);
      }
    }
  };
  const flush = () => lastArgs && invoke(lastArgs);
  const flushWith = (...args) => invoke(args);
  return [throttled, flush, flushWith];
}
var throttle_default = throttle;

// node_modules/axios/lib/helpers/progressEventReducer.js
var progressEventReducer = (listener, isDownloadStream, freq = 3) => {
  let bytesNotified = 0;
  const _speedometer = speedometer_default(50, 250);
  return throttle_default((e) => {
    if (!e || !utils_default.isNumber(e.loaded)) {
      return;
    }
    const rawLoaded = e.loaded;
    const total = e.lengthComputable ? e.total : void 0;
    const loaded = Math.max(0, total != null ? Math.min(rawLoaded, total) : rawLoaded);
    const progressBytes = Math.max(0, loaded - bytesNotified);
    const rate = _speedometer(progressBytes);
    bytesNotified = Math.max(bytesNotified, loaded);
    const data = {
      loaded,
      total,
      progress: total ? loaded / total : void 0,
      bytes: progressBytes,
      rate: rate ? rate : void 0,
      estimated: rate && total ? (total - loaded) / rate : void 0,
      event: e,
      lengthComputable: total != null,
      [isDownloadStream ? "download" : "upload"]: true
    };
    listener(data);
  }, freq);
};
var progressEventDecorator = (total, throttled) => {
  const lengthComputable = total != null;
  return [
    (loaded) => throttled[0]({
      lengthComputable,
      total,
      loaded
    }),
    throttled[1]
  ];
};
var asyncDecorator = (fn, scheduler = utils_default.asap) => (...args) => scheduler(() => fn(...args));

// node_modules/axios/lib/helpers/isURLSameOrigin.js
var isURLSameOrigin_default = platform_default.hasStandardBrowserEnv ? /* @__PURE__ */ ((origin2, isMSIE) => (url2) => {
  url2 = new URL(url2, platform_default.origin);
  return origin2.protocol === url2.protocol && origin2.host === url2.host && (isMSIE || origin2.port === url2.port);
})(
  new URL(platform_default.origin),
  platform_default.navigator && /(msie|trident)/i.test(platform_default.navigator.userAgent)
) : () => true;

// node_modules/axios/lib/helpers/cookies.js
var cookies_default = platform_default.hasStandardBrowserEnv ? (
  // Standard browser envs support document.cookie
  {
    write(name, value, expires, path, domain, secure, sameSite) {
      if (typeof document === "undefined") return;
      const cookie = [`${name}=${encodeURIComponent(value)}`];
      if (utils_default.isNumber(expires)) {
        cookie.push(`expires=${new Date(expires).toUTCString()}`);
      }
      if (utils_default.isString(path)) {
        cookie.push(`path=${path}`);
      }
      if (utils_default.isString(domain)) {
        cookie.push(`domain=${domain}`);
      }
      if (secure === true) {
        cookie.push("secure");
      }
      if (utils_default.isString(sameSite)) {
        cookie.push(`SameSite=${sameSite}`);
      }
      document.cookie = cookie.join("; ");
    },
    read(name) {
      if (typeof document === "undefined") return null;
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].replace(/^\s+/, "");
        const eq = cookie.indexOf("=");
        if (eq !== -1 && cookie.slice(0, eq) === name) {
          try {
            return decodeURIComponent(cookie.slice(eq + 1));
          } catch (e) {
            return cookie.slice(eq + 1);
          }
        }
      }
      return null;
    },
    remove(name) {
      this.write(name, "", Date.now() - 864e5, "/");
    }
  }
) : (
  // Non-standard browser env (web workers, react-native) lack needed support.
  {
    write() {
    },
    read() {
      return null;
    },
    remove() {
    }
  }
);

// node_modules/axios/lib/helpers/isAbsoluteURL.js
function isAbsoluteURL(url2) {
  if (typeof url2 !== "string") {
    return false;
  }
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url2);
}

// node_modules/axios/lib/helpers/combineURLs.js
function combineURLs(baseURL, relativeURL) {
  if (!relativeURL) {
    return baseURL;
  }
  let end = baseURL.length;
  while (end > 0 && baseURL.charCodeAt(end - 1) === 47) {
    end--;
  }
  return baseURL.slice(0, end) + "/" + relativeURL.replace(/^\/+/, "");
}

// node_modules/axios/lib/core/buildFullPath.js
var malformedHttpProtocol = /^https?:(?!\/\/)/i;
function redactFragment(fragment) {
  if (!fragment) {
    return fragment;
  }
  return fragment.replace(/(^|&)([^=&]*=)?[^&]+/g, (match2, separator, parameterName = "") => {
    return `${separator}${parameterName}${REDACTED}`;
  });
}
function redactSensitiveURLParts(url2) {
  const redactedURL = url2.replace(/^(https?:\/{0,2})[^/?#]*@/i, `$1${REDACTED}@`);
  const fragmentIndex = redactedURL.indexOf("#");
  const urlWithoutFragment = fragmentIndex === -1 ? redactedURL : redactedURL.slice(0, fragmentIndex);
  const redactedURLWithoutFragment = urlWithoutFragment.replace(
    /([?&][^=&#]*=)[^&#]*/g,
    `$1${REDACTED}`
  );
  if (fragmentIndex === -1) {
    return redactedURLWithoutFragment;
  }
  return `${redactedURLWithoutFragment}#${redactFragment(redactedURL.slice(fragmentIndex + 1))}`;
}
function assertValidHttpProtocolURL(url2, config) {
  if (typeof url2 === "string") {
    const normalizedURL = normalizeURLForProtocolCheck(url2);
    if (malformedHttpProtocol.test(normalizedURL)) {
      throw new AxiosError_default(
        `Invalid URL ${JSON.stringify(redactSensitiveURLParts(normalizedURL))}: missing "//" after protocol`,
        AxiosError_default.ERR_INVALID_URL,
        config
      );
    }
  }
}
function buildFullPath(baseURL, requestedURL, allowAbsoluteUrls, config) {
  assertValidHttpProtocolURL(requestedURL, config);
  let isRelativeUrl = !isAbsoluteURL(requestedURL);
  if (baseURL && (isRelativeUrl || allowAbsoluteUrls === false)) {
    assertValidHttpProtocolURL(baseURL, config);
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
}

// node_modules/axios/lib/core/mergeConfig.js
var headersToObject = (thing) => thing instanceof AxiosHeaders_default ? { ...thing } : thing;
var ownEnumerableKeys = (thing) => {
  if (Object.getOwnPropertySymbols && Object.getOwnPropertyDescriptor) {
    return Object.keys(thing).concat(
      Object.getOwnPropertySymbols(thing).filter(
        (symbol) => Object.getOwnPropertyDescriptor(thing, symbol).enumerable
      )
    );
  }
  return Object.keys(thing);
};
function mergeConfig(config1, config2) {
  config1 = config1 || {};
  config2 = config2 || {};
  const config = /* @__PURE__ */ Object.create(null);
  Object.defineProperty(config, "hasOwnProperty", {
    // Null-proto descriptor so a polluted Object.prototype.get cannot turn
    // this data descriptor into an accessor descriptor on the way in.
    __proto__: null,
    value: Object.prototype.hasOwnProperty,
    enumerable: false,
    writable: true,
    configurable: true
  });
  function getMergedValue(target, source, prop, caseless) {
    if (utils_default.isPlainObject(target) && utils_default.isPlainObject(source)) {
      return utils_default.merge.call({ caseless }, target, source);
    } else if (utils_default.isPlainObject(source)) {
      return utils_default.merge({}, source);
    } else if (utils_default.isArray(source)) {
      return source.slice();
    }
    return source;
  }
  function mergeDeepProperties(a, b, prop, caseless) {
    if (!utils_default.isUndefined(b)) {
      return getMergedValue(a, b, prop, caseless);
    } else if (!utils_default.isUndefined(a)) {
      return getMergedValue(void 0, a, prop, caseless);
    }
  }
  function valueFromConfig2(a, b) {
    if (!utils_default.isUndefined(b)) {
      return getMergedValue(void 0, b);
    }
  }
  function defaultToConfig2(a, b) {
    if (!utils_default.isUndefined(b)) {
      return getMergedValue(void 0, b);
    } else if (!utils_default.isUndefined(a)) {
      return getMergedValue(void 0, a);
    }
  }
  function getMergedTransitionalOption(prop) {
    const transitional2 = utils_default.hasOwnProp(config2, "transitional") ? config2.transitional : void 0;
    if (!utils_default.isUndefined(transitional2)) {
      if (utils_default.isPlainObject(transitional2)) {
        if (utils_default.hasOwnProp(transitional2, prop)) {
          return transitional2[prop];
        }
      } else {
        return void 0;
      }
    }
    const transitional1 = utils_default.hasOwnProp(config1, "transitional") ? config1.transitional : void 0;
    if (utils_default.isPlainObject(transitional1) && utils_default.hasOwnProp(transitional1, prop)) {
      return transitional1[prop];
    }
    return void 0;
  }
  function mergeDirectKeys(a, b, prop) {
    if (utils_default.hasOwnProp(config2, prop)) {
      return getMergedValue(a, b);
    } else if (utils_default.hasOwnProp(config1, prop)) {
      return getMergedValue(void 0, a);
    }
  }
  const mergeMap = {
    url: valueFromConfig2,
    method: valueFromConfig2,
    data: valueFromConfig2,
    baseURL: defaultToConfig2,
    transformRequest: defaultToConfig2,
    transformResponse: defaultToConfig2,
    paramsSerializer: defaultToConfig2,
    timeout: defaultToConfig2,
    timeoutErrorMessage: defaultToConfig2,
    withCredentials: defaultToConfig2,
    withXSRFToken: defaultToConfig2,
    adapter: defaultToConfig2,
    responseType: defaultToConfig2,
    xsrfCookieName: defaultToConfig2,
    xsrfHeaderName: defaultToConfig2,
    onUploadProgress: defaultToConfig2,
    onDownloadProgress: defaultToConfig2,
    decompress: defaultToConfig2,
    maxContentLength: defaultToConfig2,
    maxBodyLength: defaultToConfig2,
    beforeRedirect: defaultToConfig2,
    transport: defaultToConfig2,
    httpAgent: defaultToConfig2,
    httpsAgent: defaultToConfig2,
    cancelToken: defaultToConfig2,
    socketPath: defaultToConfig2,
    allowedSocketPaths: defaultToConfig2,
    responseEncoding: defaultToConfig2,
    validateStatus: mergeDirectKeys,
    headers: (a, b, prop) => mergeDeepProperties(headersToObject(a), headersToObject(b), prop, true)
  };
  utils_default.forEach(ownEnumerableKeys({ ...config1, ...config2 }), function computeConfigValue(prop) {
    if (prop === "__proto__" || prop === "constructor" || prop === "prototype") return;
    const merge2 = utils_default.hasOwnProp(mergeMap, prop) ? mergeMap[prop] : mergeDeepProperties;
    const a = utils_default.hasOwnProp(config1, prop) ? config1[prop] : void 0;
    const b = utils_default.hasOwnProp(config2, prop) ? config2[prop] : void 0;
    const configValue = merge2(a, b, prop);
    utils_default.isUndefined(configValue) && merge2 !== mergeDirectKeys || (config[prop] = configValue);
  });
  if (utils_default.hasOwnProp(config2, "validateStatus") && utils_default.isUndefined(config2.validateStatus) && getMergedTransitionalOption("validateStatusUndefinedResolves") === false) {
    if (utils_default.hasOwnProp(config1, "validateStatus")) {
      config.validateStatus = getMergedValue(void 0, config1.validateStatus);
    } else {
      delete config.validateStatus;
    }
  }
  return config;
}

// node_modules/axios/lib/core/setFormDataHeaders.js
var FORM_DATA_CONTENT_HEADERS = ["content-type", "content-length"];
function setFormDataHeaders(headers, formHeaders, policy) {
  if (policy !== "content-only") {
    headers.set(formHeaders);
    return;
  }
  Object.entries(formHeaders || {}).forEach(([key, val]) => {
    if (FORM_DATA_CONTENT_HEADERS.includes(key.toLowerCase())) {
      headers.set(key, val);
    }
  });
}

// node_modules/axios/lib/helpers/resolveConfig.js
var encodeUTF8 = (str) => encodeURIComponent(str).replace(
  /%([0-9A-F]{2})/gi,
  (_, hex4) => String.fromCharCode(parseInt(hex4, 16))
);
function resolveConfig(config) {
  const newConfig = mergeConfig({}, config);
  const own2 = (key) => utils_default.hasOwnProp(newConfig, key) ? newConfig[key] : void 0;
  const data = own2("data");
  let withXSRFToken = own2("withXSRFToken");
  const xsrfHeaderName = own2("xsrfHeaderName");
  const xsrfCookieName = own2("xsrfCookieName");
  let headers = own2("headers");
  const auth = own2("auth");
  const baseURL = own2("baseURL");
  const allowAbsoluteUrls = own2("allowAbsoluteUrls");
  const url2 = own2("url");
  newConfig.headers = headers = AxiosHeaders_default.from(headers);
  newConfig.url = buildURL(
    buildFullPath(baseURL, url2, allowAbsoluteUrls, newConfig),
    own2("params"),
    own2("paramsSerializer")
  );
  if (auth) {
    const username = utils_default.getSafeProp(auth, "username") || "";
    const password = utils_default.getSafeProp(auth, "password") || "";
    try {
      headers.set(
        "Authorization",
        "Basic " + btoa(username + ":" + (password ? encodeUTF8(password) : ""))
      );
    } catch (e) {
      throw AxiosError_default.from(e, AxiosError_default.ERR_BAD_OPTION_VALUE, config);
    }
  }
  if (utils_default.isFormData(data)) {
    const getHeaders = utils_default.getSafeProp(data, "getHeaders");
    if (platform_default.hasStandardBrowserEnv || platform_default.hasStandardBrowserWebWorkerEnv || utils_default.isReactNative(data)) {
      headers.setContentType(void 0);
    } else if (utils_default.isFunction(getHeaders)) {
      setFormDataHeaders(headers, getHeaders.call(data), own2("formDataHeaderPolicy"));
    }
  }
  if (platform_default.hasStandardBrowserEnv) {
    if (utils_default.isFunction(withXSRFToken)) {
      withXSRFToken = withXSRFToken(newConfig);
    }
    const shouldSendXSRF = withXSRFToken === true || withXSRFToken == null && isURLSameOrigin_default(newConfig.url);
    if (shouldSendXSRF) {
      const xsrfValue = xsrfHeaderName && xsrfCookieName && cookies_default.read(xsrfCookieName);
      if (xsrfValue) {
        headers.set(xsrfHeaderName, xsrfValue);
      }
    }
  }
  return newConfig;
}
var resolveConfig_default = resolveConfig;

// node_modules/axios/lib/adapters/xhr.js
var isXHRAdapterSupported = typeof XMLHttpRequest !== "undefined";
var xhr_default = isXHRAdapterSupported && function(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    const _config = resolveConfig_default(config);
    let requestData = _config.data;
    const requestHeaders = AxiosHeaders_default.from(_config.headers).normalize();
    let { responseType, onUploadProgress, onDownloadProgress } = _config;
    let onCanceled;
    let uploadThrottled, downloadThrottled;
    let flushUpload, flushDownload, flushDownloadWithEvent;
    function done() {
      flushUpload && flushUpload();
      flushDownload && flushDownload();
      _config.cancelToken && _config.cancelToken.unsubscribe(onCanceled);
      _config.signal && _config.signal.removeEventListener("abort", onCanceled);
    }
    let request2 = new XMLHttpRequest();
    request2.open(_config.method.toUpperCase(), _config.url, true);
    request2.timeout = _config.timeout;
    function onloadend(event) {
      if (!request2) {
        return;
      }
      if (request2.status === 0 && (parseProtocol(normalizeURLForProtocolCheck(_config.url)) || parseProtocol(platform_default.origin)) !== "file" && !(request2.responseURL && request2.responseURL.startsWith("file:"))) {
        reject(new AxiosError_default("Request aborted", AxiosError_default.ECONNABORTED, config, request2));
        done();
        request2 = null;
        return;
      }
      try {
        if (event) {
          flushDownloadWithEvent && flushDownloadWithEvent(event);
        } else {
          flushDownload && flushDownload();
        }
      } catch (err) {
        setTimeout(() => {
          throw err;
        });
      }
      if (!request2) {
        return;
      }
      const responseHeaders = AxiosHeaders_default.from(
        "getAllResponseHeaders" in request2 && request2.getAllResponseHeaders()
      );
      const responseData = !responseType || responseType === "text" || responseType === "json" ? request2.responseText : request2.response;
      const response = {
        data: responseData,
        status: request2.status,
        statusText: request2.statusText,
        headers: responseHeaders,
        config,
        request: request2
      };
      settle(
        function _resolve(value) {
          resolve(value);
          done();
        },
        function _reject(err) {
          reject(err);
          done();
        },
        response
      );
      request2 = null;
    }
    if ("onloadend" in request2) {
      request2.onloadend = onloadend;
    } else {
      request2.onreadystatechange = function handleLoad() {
        if (!request2 || request2.readyState !== 4) {
          return;
        }
        if (request2.status === 0 && !(request2.responseURL && request2.responseURL.startsWith("file:"))) {
          return;
        }
        setTimeout(onloadend);
      };
    }
    request2.onabort = function handleAbort() {
      if (!request2) {
        return;
      }
      reject(new AxiosError_default("Request aborted", AxiosError_default.ECONNABORTED, config, request2));
      done();
      request2 = null;
    };
    request2.onerror = function handleError(event) {
      const msg = event && event.message ? event.message : "Network Error";
      const err = new AxiosError_default(msg, AxiosError_default.ERR_NETWORK, config, request2);
      err.event = event || null;
      reject(err);
      done();
      request2 = null;
    };
    request2.ontimeout = function handleTimeout() {
      let timeoutErrorMessage = _config.timeout ? "timeout of " + _config.timeout + "ms exceeded" : "timeout exceeded";
      const transitional2 = _config.transitional || transitional_default;
      if (_config.timeoutErrorMessage) {
        timeoutErrorMessage = _config.timeoutErrorMessage;
      }
      reject(
        new AxiosError_default(
          timeoutErrorMessage,
          transitional2.clarifyTimeoutError ? AxiosError_default.ETIMEDOUT : AxiosError_default.ECONNABORTED,
          config,
          request2
        )
      );
      done();
      request2 = null;
    };
    requestData === void 0 && requestHeaders.setContentType(null);
    if ("setRequestHeader" in request2) {
      utils_default.forEach(toByteStringHeaderObject(requestHeaders), function setRequestHeader(val, key) {
        request2.setRequestHeader(key, val);
      });
    }
    if (!utils_default.isUndefined(_config.withCredentials)) {
      request2.withCredentials = !!_config.withCredentials;
    }
    if (responseType && responseType !== "json") {
      request2.responseType = _config.responseType;
    }
    if (onDownloadProgress) {
      [downloadThrottled, flushDownload, flushDownloadWithEvent] = progressEventReducer(
        onDownloadProgress,
        true
      );
      request2.addEventListener("progress", downloadThrottled);
    }
    if (onUploadProgress && request2.upload) {
      [uploadThrottled, flushUpload] = progressEventReducer(onUploadProgress);
      request2.upload.addEventListener("progress", uploadThrottled);
      request2.upload.addEventListener("loadend", flushUpload);
    }
    if (_config.cancelToken || _config.signal) {
      onCanceled = (cancel) => {
        if (!request2) {
          return;
        }
        reject(!cancel || cancel.type ? new CanceledError_default(null, config, request2) : cancel);
        request2.abort();
        done();
        request2 = null;
      };
      _config.cancelToken && _config.cancelToken.subscribe(onCanceled);
      if (_config.signal) {
        _config.signal.aborted ? onCanceled() : _config.signal.addEventListener("abort", onCanceled);
      }
    }
    const protocol = parseProtocol(_config.url);
    if (protocol && !platform_default.protocols.includes(protocol)) {
      reject(
        new AxiosError_default(
          "Unsupported protocol " + protocol + ":",
          AxiosError_default.ERR_BAD_REQUEST,
          config
        )
      );
      done();
      return;
    }
    request2.send(requestData || null);
  });
};

// node_modules/axios/lib/helpers/composeSignals.js
var composeSignals = (signals, timeout) => {
  signals = signals ? signals.filter(Boolean) : [];
  if (!timeout && !signals.length) {
    return;
  }
  const controller = new AbortController();
  let aborted = false;
  const onabort = function(reason) {
    if (!aborted) {
      aborted = true;
      unsubscribe();
      const err = reason instanceof Error ? reason : this.reason;
      controller.abort(
        err instanceof AxiosError_default ? err : new CanceledError_default(err instanceof Error ? err.message : err)
      );
    }
  };
  let timer = timeout && setTimeout(() => {
    timer = null;
    onabort(new AxiosError_default(`timeout of ${timeout}ms exceeded`, AxiosError_default.ETIMEDOUT));
  }, timeout);
  const unsubscribe = () => {
    if (!signals) {
      return;
    }
    timer && clearTimeout(timer);
    timer = null;
    signals.forEach((signal2) => {
      signal2.unsubscribe ? signal2.unsubscribe(onabort) : signal2.removeEventListener("abort", onabort);
    });
    signals = null;
  };
  signals.forEach((signal2) => {
    if (aborted) {
      return;
    }
    if (signal2.aborted) {
      onabort.call(signal2);
      return;
    }
    signal2.addEventListener("abort", onabort, { once: true });
  });
  const { signal } = controller;
  signal.unsubscribe = () => utils_default.asap(unsubscribe);
  return signal;
};
var composeSignals_default = composeSignals;

// node_modules/axios/lib/helpers/trackStream.js
var streamChunk = function* (chunk, chunkSize) {
  let len = chunk.byteLength;
  if (!chunkSize || len < chunkSize) {
    yield chunk;
    return;
  }
  let pos = 0;
  let end;
  while (pos < len) {
    end = pos + chunkSize;
    yield chunk.slice(pos, end);
    pos = end;
  }
};
var readBytes = async function* (iterable, chunkSize) {
  for await (const chunk of readStream(iterable)) {
    yield* streamChunk(chunk, chunkSize);
  }
};
var readStream = async function* (stream) {
  if (stream[Symbol.asyncIterator]) {
    yield* stream;
    return;
  }
  const reader = stream.getReader();
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      yield value;
    }
  } finally {
    await reader.cancel();
  }
};
var trackStream = (stream, chunkSize, onProgress, onFinish) => {
  const iterator2 = readBytes(stream, chunkSize);
  let bytes = 0;
  let done;
  let _onFinish = (e) => {
    if (!done) {
      done = true;
      onFinish && onFinish(e);
    }
  };
  return new ReadableStream(
    {
      async pull(controller) {
        try {
          const { done: done2, value } = await iterator2.next();
          if (done2) {
            _onFinish();
            controller.close();
            return;
          }
          let len = value.byteLength;
          if (onProgress) {
            let loadedBytes = bytes += len;
            onProgress(loadedBytes);
          }
          controller.enqueue(new Uint8Array(value));
        } catch (err) {
          _onFinish(err);
          throw err;
        }
      },
      cancel(reason) {
        _onFinish(reason);
        return iterator2.return();
      }
    },
    {
      highWaterMark: 2
    }
  );
};

// node_modules/axios/lib/helpers/estimateDataURLDecodedBytes.js
var isHexDigit = (charCode) => charCode >= 48 && charCode <= 57 || charCode >= 65 && charCode <= 70 || charCode >= 97 && charCode <= 102;
var isPercentEncodedByte = (str, i, len) => i + 2 < len && isHexDigit(str.charCodeAt(i + 1)) && isHexDigit(str.charCodeAt(i + 2));
var hexValue = (charCode) => charCode <= 57 ? charCode - 48 : (charCode & 223) - 55;
var isBase64Char = (charCode) => charCode >= 65 && charCode <= 90 || // A-Z
charCode >= 97 && charCode <= 122 || // a-z
charCode >= 48 && charCode <= 57 || // 0-9
charCode === 43 || // +
charCode === 47 || // /
charCode === 45 || // - (base64url)
charCode === 95;
var isBase64Whitespace = (charCode) => charCode === 9 || charCode === 10 || charCode === 12 || charCode === 13 || charCode === 32;
var base64Bytes = (significant) => {
  const groups = Math.floor(significant / 4);
  const remainder = significant % 4;
  return groups * 3 + (remainder === 2 ? 1 : remainder === 3 ? 2 : 0);
};
var estimateBase64BufferAllocation = (body) => {
  const len = body.length;
  let padding = 0;
  if (len > 0 && body.charCodeAt(len - 1) === 61) {
    padding++;
    if (len > 1 && body.charCodeAt(len - 2) === 61) {
      padding++;
    }
  }
  return Math.floor((len - padding) * 3 / 4);
};
var estimatePercentDecodedBase64Bytes = (body) => {
  const len = body.length;
  let significant = 0;
  let padding = 0;
  let invalid = false;
  for (let i = 0; i < len; i++) {
    let code = body.charCodeAt(i);
    if (code === 37 && isPercentEncodedByte(body, i, len)) {
      code = hexValue(body.charCodeAt(i + 1)) * 16 + hexValue(body.charCodeAt(i + 2));
      i += 2;
    }
    if (isBase64Whitespace(code)) {
      continue;
    }
    if (code === 61) {
      padding++;
      continue;
    }
    if (!isBase64Char(code) || padding > 0) {
      invalid = true;
      continue;
    }
    significant++;
  }
  if (invalid || padding > 2 || padding > 0 && (significant + padding) % 4 !== 0 || significant % 4 === 1) {
    return estimateBase64BufferAllocation(body);
  }
  return base64Bytes(significant);
};
var estimateDataURLBytes = (url2, estimateBase64) => {
  if (!url2 || typeof url2 !== "string") return 0;
  if (!url2.startsWith("data:")) return 0;
  const comma = url2.indexOf(",");
  if (comma < 0) return 0;
  const meta = url2.slice(5, comma);
  const body = url2.slice(comma + 1);
  const isBase64 = /;base64/i.test(meta);
  if (isBase64) {
    return estimateBase64(body);
  }
  let bytes = 0;
  for (let i = 0, len = body.length; i < len; i++) {
    const c = body.charCodeAt(i);
    if (c === 37 && isPercentEncodedByte(body, i, len)) {
      bytes += 1;
      i += 2;
    } else if (c < 128) {
      bytes += 1;
    } else if (c < 2048) {
      bytes += 2;
    } else if (c >= 55296 && c <= 56319 && i + 1 < len) {
      const next = body.charCodeAt(i + 1);
      if (next >= 56320 && next <= 57343) {
        bytes += 4;
        i++;
      } else {
        bytes += 3;
      }
    } else {
      bytes += 3;
    }
  }
  return bytes;
};
function estimateDataURLDecodedBytes(url2) {
  const fragmentIndex = typeof url2 === "string" ? url2.indexOf("#") : -1;
  return estimateDataURLBytes(
    fragmentIndex === -1 ? url2 : url2.slice(0, fragmentIndex),
    estimatePercentDecodedBase64Bytes
  );
}

// node_modules/axios/lib/env/data.js
var VERSION = "1.20.0";

// node_modules/axios/lib/adapters/fetch.js
var DEFAULT_CHUNK_SIZE = 64 * 1024;
var DEFAULT_REQUEST_OPTIONS = {
  cache: "default",
  redirect: "follow",
  referrer: "about:client",
  referrerPolicy: "",
  mode: "cors",
  integrity: "",
  keepalive: false,
  priority: "auto",
  window: null
};
var { isFunction: isFunction2 } = utils_default;
var encodeUTF82 = (str) => encodeURIComponent(str).replace(
  /%([0-9A-F]{2})/gi,
  (_, hex4) => String.fromCharCode(parseInt(hex4, 16))
);
var decodeURIComponentSafe = (value) => {
  if (!utils_default.isString(value)) {
    return value;
  }
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
};
var test = (fn, ...args) => {
  try {
    return !!fn(...args);
  } catch (e) {
    return false;
  }
};
var maybeWithAuthCredentials = (url2) => {
  const protocolIndex = url2.indexOf("://");
  let urlToCheck = url2;
  if (protocolIndex !== -1) {
    urlToCheck = urlToCheck.slice(protocolIndex + 3);
  }
  return urlToCheck.includes("@") || urlToCheck.includes(":");
};
var factory = (env) => {
  const globalObject = utils_default.global !== void 0 && utils_default.global !== null ? utils_default.global : globalThis;
  const { ReadableStream: ReadableStream2, TextEncoder: TextEncoder2 } = globalObject;
  env = utils_default.merge.call(
    {
      skipUndefined: true
    },
    {
      Request: globalObject.Request,
      Response: globalObject.Response
    },
    env
  );
  const { fetch: envFetch, Request, Response } = env;
  const isFetchSupported = envFetch ? isFunction2(envFetch) : typeof fetch === "function";
  const isRequestSupported = isFunction2(Request);
  const isResponseSupported = isFunction2(Response);
  if (!isFetchSupported) {
    return false;
  }
  const isReadableStreamSupported = isFetchSupported && isFunction2(ReadableStream2);
  const encodeText = isFetchSupported && (typeof TextEncoder2 === "function" ? /* @__PURE__ */ ((encoder) => (str) => encoder.encode(str))(new TextEncoder2()) : async (str) => new Uint8Array(await new Request(str).arrayBuffer()));
  const supportsRequestStream = isRequestSupported && isReadableStreamSupported && test(() => {
    let duplexAccessed = false;
    const request2 = new Request(platform_default.origin, {
      body: new ReadableStream2(),
      method: "POST",
      get duplex() {
        duplexAccessed = true;
        return "half";
      }
    });
    const hasContentType = request2.headers.has("Content-Type");
    if (request2.body != null) {
      request2.body.cancel();
    }
    return duplexAccessed && !hasContentType;
  });
  const supportsResponseStream = isResponseSupported && isReadableStreamSupported && test(() => utils_default.isReadableStream(new Response("").body));
  const resolvers = {
    stream: supportsResponseStream && ((res) => res.body)
  };
  isFetchSupported && (() => {
    ["text", "arrayBuffer", "blob", "formData", "stream"].forEach((type) => {
      !resolvers[type] && (resolvers[type] = (res, config) => {
        let method = res && res[type];
        if (method) {
          return method.call(res);
        }
        throw new AxiosError_default(
          `Response type '${type}' is not supported`,
          AxiosError_default.ERR_NOT_SUPPORT,
          config
        );
      });
    });
  })();
  const getBodyLength = async (body) => {
    if (body == null) {
      return 0;
    }
    if (utils_default.isBlob(body)) {
      return body.size;
    }
    if (utils_default.isSpecCompliantForm(body)) {
      const _request = new Request(platform_default.origin, {
        method: "POST",
        body
      });
      return (await _request.arrayBuffer()).byteLength;
    }
    if (utils_default.isArrayBufferView(body) || utils_default.isArrayBuffer(body)) {
      return body.byteLength;
    }
    if (utils_default.isURLSearchParams(body)) {
      body = body + "";
    }
    if (utils_default.isString(body)) {
      return (await encodeText(body)).byteLength;
    }
  };
  const resolveBodyLength = async (headers, body) => {
    const length2 = utils_default.toFiniteNumber(headers.getContentLength());
    return length2 == null ? getBodyLength(body) : length2;
  };
  return async (config) => {
    let {
      url: url2,
      method,
      data,
      signal,
      cancelToken,
      timeout,
      onDownloadProgress,
      onUploadProgress,
      responseType,
      headers,
      withCredentials = "same-origin",
      fetchOptions,
      maxContentLength,
      maxBodyLength,
      maxRedirects
    } = resolveConfig_default(config);
    const hasMaxContentLength = utils_default.isNumber(maxContentLength) && maxContentLength > -1;
    const hasMaxBodyLength = utils_default.isNumber(maxBodyLength) && maxBodyLength > -1;
    const own2 = (key) => utils_default.hasOwnProp(config, key) ? config[key] : void 0;
    let _fetch = envFetch || fetch;
    responseType = responseType ? (responseType + "").toLowerCase() : "text";
    let composedSignal = composeSignals_default(
      [signal, cancelToken && cancelToken.toAbortSignal()],
      timeout
    );
    let request2 = null;
    const unsubscribe = composedSignal && composedSignal.unsubscribe && (() => {
      composedSignal.unsubscribe();
    });
    let requestContentLength;
    let pendingBodyError = null;
    const maxBodyLengthError = () => new AxiosError_default(
      "Request body larger than maxBodyLength limit",
      AxiosError_default.ERR_BAD_REQUEST,
      config,
      request2
    );
    try {
      let auth = void 0;
      const configAuth = own2("auth");
      if (configAuth) {
        const username = utils_default.getSafeProp(configAuth, "username") || "";
        const password = utils_default.getSafeProp(configAuth, "password") || "";
        auth = {
          username,
          password
        };
      }
      if (maybeWithAuthCredentials(url2)) {
        const parsedURL = new URL(url2, platform_default.origin);
        if (!auth && (parsedURL.username || parsedURL.password)) {
          const urlUsername = decodeURIComponentSafe(parsedURL.username);
          const urlPassword = decodeURIComponentSafe(parsedURL.password);
          auth = {
            username: urlUsername,
            password: urlPassword
          };
        }
        if (parsedURL.username || parsedURL.password) {
          parsedURL.username = "";
          parsedURL.password = "";
          url2 = parsedURL.href;
        }
      }
      if (auth) {
        headers.delete("authorization");
        headers.set(
          "Authorization",
          "Basic " + btoa(encodeUTF82((auth.username || "") + ":" + (auth.password || "")))
        );
      }
      if (hasMaxContentLength && typeof url2 === "string" && url2.startsWith("data:")) {
        const estimated = estimateDataURLDecodedBytes(url2);
        if (estimated > maxContentLength) {
          throw new AxiosError_default(
            "maxContentLength size of " + maxContentLength + " exceeded",
            AxiosError_default.ERR_BAD_RESPONSE,
            config,
            request2
          );
        }
      }
      if (hasMaxBodyLength && method !== "get" && method !== "head") {
        const outboundLength = await getBodyLength(data);
        if (typeof outboundLength === "number" && isFinite(outboundLength)) {
          requestContentLength = outboundLength;
          if (outboundLength > maxBodyLength) {
            throw maxBodyLengthError();
          }
        }
      }
      const mustEnforceStreamBody = hasMaxBodyLength && (utils_default.isReadableStream(data) || utils_default.isStream(data));
      const trackRequestStream = (stream, onProgress, flush) => trackStream(
        stream,
        DEFAULT_CHUNK_SIZE,
        (loadedBytes) => {
          if (hasMaxBodyLength && loadedBytes > maxBodyLength) {
            throw pendingBodyError = maxBodyLengthError();
          }
          onProgress && onProgress(loadedBytes);
        },
        flush
      );
      if (supportsRequestStream && method !== "get" && method !== "head" && (onUploadProgress || mustEnforceStreamBody)) {
        requestContentLength = requestContentLength == null ? await resolveBodyLength(headers, data) : requestContentLength;
        if (requestContentLength !== 0 || mustEnforceStreamBody) {
          let _request = new Request(url2, {
            method: "POST",
            body: data,
            duplex: "half"
          });
          let contentTypeHeader;
          if (utils_default.isFormData(data) && (contentTypeHeader = _request.headers.get("content-type"))) {
            headers.setContentType(contentTypeHeader);
          }
          if (_request.body) {
            const [onProgress, flush] = onUploadProgress && progressEventDecorator(
              requestContentLength,
              progressEventReducer(asyncDecorator(onUploadProgress))
            ) || [];
            data = trackRequestStream(_request.body, onProgress, flush);
          }
        }
      } else if (mustEnforceStreamBody && !isRequestSupported && isReadableStreamSupported && method !== "get" && method !== "head") {
        data = trackRequestStream(data);
      } else if (mustEnforceStreamBody && isRequestSupported && !supportsRequestStream && method !== "get" && method !== "head") {
        throw new AxiosError_default(
          "Stream request bodies are not supported by the current fetch implementation",
          AxiosError_default.ERR_NOT_SUPPORT,
          config,
          request2
        );
      }
      if (!utils_default.isString(withCredentials)) {
        withCredentials = withCredentials ? "include" : "omit";
      }
      const isCredentialsSupported = isRequestSupported && "credentials" in Request.prototype;
      if (utils_default.isFormData(data)) {
        const contentType = headers.getContentType();
        if (contentType && /^multipart\/form-data/i.test(contentType) && !/boundary=/i.test(contentType)) {
          headers.delete("content-type");
        }
      }
      headers.set("User-Agent", "axios/" + VERSION, false);
      const safeFetchOptions = fetchOptions == null ? fetchOptions : Object.assign(/* @__PURE__ */ Object.create(null), fetchOptions);
      if (safeFetchOptions) {
        delete safeFetchOptions.body;
        delete safeFetchOptions.headers;
        delete safeFetchOptions.method;
        delete safeFetchOptions.signal;
        delete safeFetchOptions.duplex;
        delete safeFetchOptions.credentials;
      }
      const resolvedOptions = Object.assign(/* @__PURE__ */ Object.create(null), safeFetchOptions, {
        signal: composedSignal,
        method: method.toUpperCase(),
        headers: toByteStringHeaderObject(headers.normalize()),
        body: data,
        duplex: "half",
        credentials: isCredentialsSupported ? withCredentials : void 0
      });
      if (isRequestSupported) {
        utils_default.forEach(DEFAULT_REQUEST_OPTIONS, (value, key) => {
          if (resolvedOptions[key] === void 0) {
            resolvedOptions[key] = value;
          }
        });
        if (resolvedOptions.signal === void 0) {
          resolvedOptions.signal = null;
        }
        if (resolvedOptions.body === void 0) {
          resolvedOptions.body = null;
        }
      }
      if (maxRedirects === 0) {
        resolvedOptions.redirect = "manual";
        if (safeFetchOptions) {
          safeFetchOptions.redirect = "manual";
        }
      }
      request2 = isRequestSupported && new Request(url2, resolvedOptions);
      let response = await (isRequestSupported ? _fetch(request2, safeFetchOptions) : _fetch(url2, resolvedOptions));
      const responseHeaders = AxiosHeaders_default.from(response.headers);
      if (hasMaxContentLength) {
        const declaredLength = utils_default.toFiniteNumber(responseHeaders.getContentLength());
        if (declaredLength != null && declaredLength > maxContentLength) {
          throw new AxiosError_default(
            "maxContentLength size of " + maxContentLength + " exceeded",
            AxiosError_default.ERR_BAD_RESPONSE,
            config,
            request2
          );
        }
      }
      const isStreamResponse = supportsResponseStream && (responseType === "stream" || responseType === "response");
      if (supportsResponseStream && response.body && (onDownloadProgress || hasMaxContentLength || isStreamResponse && unsubscribe)) {
        const options = {};
        ["status", "statusText", "headers"].forEach((prop) => {
          options[prop] = response[prop];
        });
        const responseContentLength = utils_default.toFiniteNumber(responseHeaders.getContentLength());
        const [onProgress, flush] = onDownloadProgress && progressEventDecorator(
          responseContentLength,
          progressEventReducer(asyncDecorator(onDownloadProgress), true)
        ) || [];
        let bytesRead = 0;
        const onChunkProgress = (loadedBytes) => {
          if (hasMaxContentLength) {
            bytesRead = loadedBytes;
            if (bytesRead > maxContentLength) {
              throw new AxiosError_default(
                "maxContentLength size of " + maxContentLength + " exceeded",
                AxiosError_default.ERR_BAD_RESPONSE,
                config,
                request2
              );
            }
          }
          onProgress && onProgress(loadedBytes);
        };
        response = new Response(
          trackStream(response.body, DEFAULT_CHUNK_SIZE, onChunkProgress, () => {
            flush && flush();
            unsubscribe && unsubscribe();
          }),
          options
        );
      }
      responseType = responseType || "text";
      let responseData = await resolvers[utils_default.findKey(resolvers, responseType) || "text"](
        response,
        config
      );
      if (hasMaxContentLength && !supportsResponseStream && !isStreamResponse) {
        let materializedSize;
        if (responseData != null) {
          if (typeof responseData.byteLength === "number") {
            materializedSize = responseData.byteLength;
          } else if (typeof responseData.size === "number") {
            materializedSize = responseData.size;
          } else if (typeof responseData === "string") {
            materializedSize = typeof TextEncoder2 === "function" ? new TextEncoder2().encode(responseData).byteLength : responseData.length;
          }
        }
        if (typeof materializedSize === "number" && materializedSize > maxContentLength) {
          throw new AxiosError_default(
            "maxContentLength size of " + maxContentLength + " exceeded",
            AxiosError_default.ERR_BAD_RESPONSE,
            config,
            request2
          );
        }
      }
      !isStreamResponse && unsubscribe && unsubscribe();
      return await new Promise((resolve, reject) => {
        settle(resolve, reject, {
          data: responseData,
          headers: AxiosHeaders_default.from(response.headers),
          status: response.status,
          statusText: response.statusText,
          config,
          request: request2
        });
      });
    } catch (err) {
      unsubscribe && unsubscribe();
      if (composedSignal && composedSignal.aborted && composedSignal.reason instanceof AxiosError_default) {
        const canceledError = composedSignal.reason;
        canceledError.config = config;
        request2 && (canceledError.request = request2);
        if (err !== canceledError) {
          Object.defineProperty(canceledError, "cause", {
            __proto__: null,
            value: err,
            writable: true,
            enumerable: false,
            configurable: true
          });
        }
        throw canceledError;
      }
      if (pendingBodyError) {
        request2 && !pendingBodyError.request && (pendingBodyError.request = request2);
        throw pendingBodyError;
      }
      if (err instanceof AxiosError_default) {
        request2 && !err.request && (err.request = request2);
        throw err;
      }
      if (err && err.name === "TypeError" && /Load failed|fetch/i.test(err.message)) {
        const networkError = new AxiosError_default(
          "Network Error",
          AxiosError_default.ERR_NETWORK,
          config,
          request2,
          err && err.response
        );
        Object.defineProperty(networkError, "cause", {
          __proto__: null,
          value: err.cause || err,
          writable: true,
          enumerable: false,
          configurable: true
        });
        throw networkError;
      }
      throw AxiosError_default.from(err, err && err.code, config, request2, err && err.response);
    }
  };
};
var seedCache = /* @__PURE__ */ new Map();
var getFetch = (config) => {
  let env = config && config.env || {};
  const { fetch: fetch2, Request, Response } = env;
  const seeds = [Request, Response, fetch2];
  let len = seeds.length, i = len, seed, target, map2 = seedCache;
  while (i--) {
    seed = seeds[i];
    target = map2.get(seed);
    target === void 0 && map2.set(seed, target = i ? /* @__PURE__ */ new Map() : factory(env));
    map2 = target;
  }
  return target;
};
var adapter = getFetch();

// node_modules/axios/lib/adapters/adapters.js
var knownAdapters = {
  http: null_default,
  xhr: xhr_default,
  fetch: {
    get: getFetch
  }
};
utils_default.forEach(knownAdapters, (fn, value) => {
  if (fn) {
    try {
      Object.defineProperty(fn, "name", { __proto__: null, value });
    } catch (e) {
    }
    Object.defineProperty(fn, "adapterName", { __proto__: null, value });
  }
});
var renderReason = (reason) => `- ${reason}`;
var isResolvedHandle = (adapter2) => utils_default.isFunction(adapter2) || adapter2 === null || adapter2 === false;
function getAdapter(adapters, config) {
  adapters = utils_default.isArray(adapters) ? adapters : [adapters];
  const { length: length2 } = adapters;
  let nameOrAdapter;
  let adapter2;
  const rejectedReasons = {};
  for (let i = 0; i < length2; i++) {
    nameOrAdapter = adapters[i];
    let id;
    adapter2 = nameOrAdapter;
    if (!isResolvedHandle(nameOrAdapter)) {
      adapter2 = knownAdapters[(id = String(nameOrAdapter)).toLowerCase()];
      if (adapter2 === void 0) {
        throw new AxiosError_default(`Unknown adapter '${id}'`);
      }
    }
    if (adapter2 && (utils_default.isFunction(adapter2) || (adapter2 = adapter2.get(config)))) {
      break;
    }
    rejectedReasons[id || "#" + i] = adapter2;
  }
  if (!adapter2) {
    const reasons = Object.entries(rejectedReasons).map(
      ([id, state]) => `adapter ${id} ` + (state === false ? "is not supported by the environment" : "is not available in the build")
    );
    let s = length2 ? reasons.length > 1 ? "since :\n" + reasons.map(renderReason).join("\n") : " " + renderReason(reasons[0]) : "as no adapter specified";
    throw new AxiosError_default(
      `There is no suitable adapter to dispatch the request ` + s,
      AxiosError_default.ERR_NOT_SUPPORT
    );
  }
  return adapter2;
}
var adapters_default = {
  /**
   * Resolve an adapter from a list of adapter names or functions.
   * @type {Function}
   */
  getAdapter,
  /**
   * Exposes all known adapters
   * @type {Object<string, Function|Object>}
   */
  adapters: knownAdapters
};

// node_modules/axios/lib/core/dispatchRequest.js
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }
  if (config.signal && config.signal.aborted) {
    throw new CanceledError_default(null, config);
  }
}
function dispatchRequest(_config) {
  const config = utils_default.toSafeFlatObject(_config);
  throwIfCancellationRequested(config);
  config.headers = AxiosHeaders_default.from(utils_default.getSafeProp(config, "headers"));
  config.data = transformData.call(config, config.transformRequest);
  if (["post", "put", "patch"].indexOf(config.method) !== -1) {
    config.headers.setContentType("application/x-www-form-urlencoded", false);
  }
  const adapter2 = adapters_default.getAdapter(config.adapter || defaults_default.adapter, config);
  return adapter2(config).then(
    function onAdapterResolution(response) {
      throwIfCancellationRequested(config);
      config.response = response;
      try {
        response.data = transformData.call(config, config.transformResponse, response);
      } finally {
        delete config.response;
      }
      response.headers = AxiosHeaders_default.from(response.headers);
      return response;
    },
    function onAdapterRejection(reason) {
      if (!isCancel(reason)) {
        throwIfCancellationRequested(config);
        if (reason && reason.response) {
          config.response = reason.response;
          try {
            reason.response.data = transformData.call(
              config,
              config.transformResponse,
              reason.response
            );
          } finally {
            delete config.response;
          }
          reason.response.headers = AxiosHeaders_default.from(reason.response.headers);
        }
      }
      return Promise.reject(reason);
    }
  );
}

// node_modules/axios/lib/helpers/validator.js
var validators = {};
["object", "boolean", "number", "function", "string", "symbol"].forEach((type, i) => {
  validators[type] = function validator(thing) {
    return typeof thing === type || "a" + (i < 1 ? "n " : " ") + type;
  };
});
var deprecatedWarnings = {};
validators.transitional = function transitional(validator, version, message) {
  function formatMessage(opt, desc) {
    return "[Axios v" + VERSION + "] Transitional option '" + opt + "'" + desc + (message ? ". " + message : "");
  }
  return (value, opt, opts) => {
    if (validator === false) {
      throw new AxiosError_default(
        formatMessage(opt, " has been removed" + (version ? " in " + version : "")),
        AxiosError_default.ERR_DEPRECATED
      );
    }
    if (version && !deprecatedWarnings[opt]) {
      deprecatedWarnings[opt] = true;
      console.warn(
        formatMessage(
          opt,
          " has been deprecated since v" + version + " and will be removed in the near future"
        )
      );
    }
    return validator ? validator(value, opt, opts) : true;
  };
};
validators.spelling = function spelling(correctSpelling) {
  return (value, opt) => {
    console.warn(`${opt} is likely a misspelling of ${correctSpelling}`);
    return true;
  };
};
function assertOptions(options, schema, allowUnknown) {
  if (typeof options !== "object" || options === null) {
    throw new AxiosError_default("options must be an object", AxiosError_default.ERR_BAD_OPTION_VALUE);
  }
  const keys = Object.keys(options);
  let i = keys.length;
  while (i-- > 0) {
    const opt = keys[i];
    const validator = Object.prototype.hasOwnProperty.call(schema, opt) ? schema[opt] : void 0;
    if (validator) {
      const value = options[opt];
      const result = value === void 0 || validator(value, opt, options);
      if (result !== true) {
        throw new AxiosError_default(
          "option " + opt + " must be " + result,
          AxiosError_default.ERR_BAD_OPTION_VALUE
        );
      }
      continue;
    }
    if (allowUnknown !== true) {
      throw new AxiosError_default("Unknown option " + opt, AxiosError_default.ERR_BAD_OPTION);
    }
  }
}
var validator_default = {
  assertOptions,
  validators
};

// node_modules/axios/lib/core/Axios.js
var validators2 = validator_default.validators;
var Axios = class {
  constructor(instanceConfig) {
    this.defaults = instanceConfig || {};
    this.interceptors = {
      request: new InterceptorManager_default(),
      response: new InterceptorManager_default()
    };
  }
  /**
   * Dispatch a request
   *
   * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
   * @param {?Object} config
   *
   * @returns {Promise} The Promise to be fulfilled
   */
  async request(configOrUrl, config) {
    try {
      return await this._request(configOrUrl, config);
    } catch (err) {
      if (err instanceof Error) {
        try {
          let dummy = {};
          Error.captureStackTrace ? Error.captureStackTrace(dummy) : dummy = new Error();
          const dummyStack = dummy.stack;
          let stack = "";
          if (typeof dummyStack === "string") {
            const firstNewlineIndex = dummyStack.indexOf("\n");
            stack = firstNewlineIndex === -1 ? "" : dummyStack.slice(firstNewlineIndex + 1);
          }
          if (!err.stack) {
            err.stack = stack;
          } else if (stack) {
            const firstNewlineIndex = stack.indexOf("\n");
            const secondNewlineIndex = firstNewlineIndex === -1 ? -1 : stack.indexOf("\n", firstNewlineIndex + 1);
            const stackWithoutTwoTopLines = secondNewlineIndex === -1 ? "" : stack.slice(secondNewlineIndex + 1);
            if (!String(err.stack).endsWith(stackWithoutTwoTopLines)) {
              err.stack += "\n" + stack;
            }
          }
        } catch (e) {
        }
      }
      throw err;
    }
  }
  _request(configOrUrl, config) {
    if (typeof configOrUrl === "string") {
      config = config || {};
      config.url = configOrUrl;
    } else {
      config = configOrUrl || {};
    }
    config = mergeConfig(this.defaults, config);
    const { transitional: transitional2, paramsSerializer, headers } = config;
    if (transitional2 !== void 0) {
      validator_default.assertOptions(
        transitional2,
        {
          silentJSONParsing: validators2.transitional(validators2.boolean),
          forcedJSONParsing: validators2.transitional(validators2.boolean),
          clarifyTimeoutError: validators2.transitional(validators2.boolean),
          legacyInterceptorReqResOrdering: validators2.transitional(validators2.boolean),
          advertiseZstdAcceptEncoding: validators2.transitional(validators2.boolean),
          validateStatusUndefinedResolves: validators2.transitional(validators2.boolean)
        },
        false
      );
    }
    if (paramsSerializer != null) {
      if (utils_default.isFunction(paramsSerializer)) {
        config.paramsSerializer = {
          serialize: paramsSerializer
        };
      } else {
        validator_default.assertOptions(
          paramsSerializer,
          {
            encode: validators2.function,
            serialize: validators2.function
          },
          true
        );
      }
    }
    if (config.allowAbsoluteUrls !== void 0) {
    } else if (this.defaults.allowAbsoluteUrls !== void 0) {
      config.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls;
    } else {
      config.allowAbsoluteUrls = true;
    }
    validator_default.assertOptions(
      config,
      {
        baseUrl: validators2.spelling("baseURL"),
        withXsrfToken: validators2.spelling("withXSRFToken")
      },
      true
    );
    config.method = (utils_default.getSafeProp(config, "method") || utils_default.getSafeProp(this.defaults, "method") || "get").toLowerCase();
    let contextHeaders = headers && utils_default.merge(headers.common, headers[config.method]);
    headers && utils_default.forEach(methodList_default.concat("common"), (method) => {
      delete headers[method];
    });
    config.headers = AxiosHeaders_default.concat(contextHeaders, headers);
    const requestInterceptorChain = [];
    let synchronousRequestInterceptors = true;
    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
      if (typeof interceptor.runWhen === "function" && interceptor.runWhen(config) === false) {
        return;
      }
      synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;
      const transitional3 = config.transitional || transitional_default;
      const legacyInterceptorReqResOrdering = transitional3 && transitional3.legacyInterceptorReqResOrdering;
      if (legacyInterceptorReqResOrdering) {
        requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
      } else {
        requestInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
      }
    });
    const responseInterceptorChain = [];
    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
      responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
    });
    let promise;
    let i = 0;
    let len;
    if (!synchronousRequestInterceptors) {
      const chain4 = [dispatchRequest.bind(this), void 0];
      chain4.unshift(...requestInterceptorChain);
      chain4.push(...responseInterceptorChain);
      len = chain4.length;
      promise = Promise.resolve(config);
      while (i < len) {
        promise = promise.then(chain4[i++], chain4[i++]);
      }
      return promise;
    }
    len = requestInterceptorChain.length;
    let newConfig = config;
    while (i < len) {
      const onFulfilled = requestInterceptorChain[i++];
      const onRejected = requestInterceptorChain[i++];
      try {
        newConfig = onFulfilled ? onFulfilled(newConfig) : newConfig;
      } catch (error) {
        if (!onRejected) {
          promise = Promise.reject(error);
          break;
        }
        try {
          const rejectedResult = onRejected.call(this, error);
          if (utils_default.isThenable(rejectedResult)) {
            promise = Promise.resolve(rejectedResult).then(
              () => dispatchRequest.call(this, newConfig)
            );
          }
        } catch (rejectedError) {
          promise = Promise.reject(rejectedError);
        }
        break;
      }
    }
    if (!promise) {
      try {
        promise = dispatchRequest.call(this, newConfig);
      } catch (error) {
        promise = Promise.reject(error);
      }
    }
    i = 0;
    len = responseInterceptorChain.length;
    while (i < len) {
      promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
    }
    return promise;
  }
  getUri(config) {
    config = mergeConfig(this.defaults, config);
    const fullPath = buildFullPath(config.baseURL, config.url, config.allowAbsoluteUrls, config);
    return buildURL(fullPath, config.params, config.paramsSerializer);
  }
};
utils_default.forEach(["delete", "get", "head", "options"], function forEachMethodNoData(method) {
  Axios.prototype[method] = function(url2, config) {
    return this.request(
      mergeConfig(config || {}, {
        method,
        url: url2,
        data: config && utils_default.hasOwnProp(config, "data") ? config.data : void 0
      })
    );
  };
});
utils_default.forEach(["post", "put", "patch", "query"], function forEachMethodWithData(method) {
  function generateHTTPMethod(isForm) {
    return function httpMethod(url2, data, config) {
      return this.request(
        mergeConfig(config || {}, {
          method,
          headers: isForm ? {
            "Content-Type": "multipart/form-data"
          } : {},
          url: url2,
          data
        })
      );
    };
  }
  Axios.prototype[method] = generateHTTPMethod();
  if (method !== "query") {
    Axios.prototype[method + "Form"] = generateHTTPMethod(true);
  }
});
var Axios_default = Axios;

// node_modules/axios/lib/cancel/CancelToken.js
var CancelToken = class _CancelToken {
  constructor(executor) {
    if (typeof executor !== "function") {
      throw new TypeError("executor must be a function.");
    }
    let resolvePromise;
    this.promise = new Promise(function promiseExecutor(resolve) {
      resolvePromise = resolve;
    });
    const token = this;
    this.promise.then((cancel) => {
      if (!token._listeners) return;
      let i = token._listeners.length;
      while (i-- > 0) {
        token._listeners[i](cancel);
      }
      token._listeners = null;
    });
    this.promise.then = (onfulfilled) => {
      let _resolve;
      const promise = new Promise((resolve) => {
        token.subscribe(resolve);
        _resolve = resolve;
      }).then(onfulfilled);
      promise.cancel = function reject() {
        token.unsubscribe(_resolve);
      };
      return promise;
    };
    executor(function cancel(message, config, request2) {
      if (token.reason) {
        return;
      }
      token.reason = new CanceledError_default(message, config, request2);
      resolvePromise(token.reason);
    });
  }
  /**
   * Throws a `CanceledError` if cancellation has been requested.
   */
  throwIfRequested() {
    if (this.reason) {
      throw this.reason;
    }
  }
  /**
   * Subscribe to the cancel signal
   */
  subscribe(listener) {
    if (this.reason) {
      listener(this.reason);
      return;
    }
    if (this._listeners) {
      this._listeners.push(listener);
    } else {
      this._listeners = [listener];
    }
  }
  /**
   * Unsubscribe from the cancel signal
   */
  unsubscribe(listener) {
    if (!this._listeners) {
      return;
    }
    const index = this._listeners.indexOf(listener);
    if (index !== -1) {
      this._listeners.splice(index, 1);
    }
  }
  toAbortSignal() {
    const controller = new AbortController();
    const abort = (err) => {
      controller.abort(err);
    };
    this.subscribe(abort);
    controller.signal.unsubscribe = () => this.unsubscribe(abort);
    return controller.signal;
  }
  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */
  static source() {
    let cancel;
    const token = new _CancelToken(function executor(c) {
      cancel = c;
    });
    return {
      token,
      cancel
    };
  }
};
var CancelToken_default = CancelToken;

// node_modules/axios/lib/helpers/spread.js
function spread(callback) {
  return function wrap2(arr) {
    return callback.apply(null, arr);
  };
}

// node_modules/axios/lib/helpers/isAxiosError.js
function isAxiosError(payload) {
  return utils_default.isObject(payload) && payload.isAxiosError === true;
}

// node_modules/axios/lib/helpers/HttpStatusCode.js
var HttpStatusCode = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultiStatus: 207,
  AlreadyReported: 208,
  ImUsed: 226,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  UseProxy: 305,
  Unused: 306,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  /**
   * @deprecated Use `ContentTooLarge` instead.
   */
  PayloadTooLarge: 413,
  ContentTooLarge: 413,
  UriTooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  ImATeapot: 418,
  MisdirectedRequest: 421,
  /**
   * @deprecated Use `UnprocessableContent` instead.
   */
  UnprocessableEntity: 422,
  UnprocessableContent: 422,
  Locked: 423,
  FailedDependency: 424,
  TooEarly: 425,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HttpVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  InsufficientStorage: 507,
  LoopDetected: 508,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511,
  WebServerReturnsAnUnknownError: 520,
  WebServerIsDown: 521,
  ConnectionTimedOut: 522,
  OriginIsUnreachable: 523,
  TimeoutOccurred: 524,
  SslHandshakeFailed: 525,
  InvalidSslCertificate: 526
};
Object.entries(HttpStatusCode).forEach(([key, value]) => {
  if (HttpStatusCode[value] === void 0) {
    HttpStatusCode[value] = key;
  }
});
var HttpStatusCode_default = HttpStatusCode;

// node_modules/axios/lib/axios.js
function createInstance(defaultConfig) {
  const context = new Axios_default(defaultConfig);
  const instance = bind(Axios_default.prototype.request, context);
  utils_default.extend(instance, Axios_default.prototype, context, { allOwnKeys: true });
  utils_default.extend(instance, context, null, { allOwnKeys: true });
  instance.create = function create2(instanceConfig) {
    return createInstance(mergeConfig(defaultConfig, instanceConfig));
  };
  return instance;
}
var axios = createInstance(defaults_default);
axios.Axios = Axios_default;
axios.CanceledError = CanceledError_default;
axios.CancelToken = CancelToken_default;
axios.isCancel = isCancel;
axios.VERSION = VERSION;
axios.toFormData = toFormData_default;
axios.AxiosError = AxiosError_default;
axios.Cancel = axios.CanceledError;
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = spread;
axios.isAxiosError = isAxiosError;
axios.mergeConfig = mergeConfig;
axios.AxiosHeaders = AxiosHeaders_default;
axios.formToJSON = (thing) => formDataToJSON_default(utils_default.isHTMLForm(thing) ? new FormData(thing) : thing);
axios.getAdapter = adapters_default.getAdapter;
axios.HttpStatusCode = HttpStatusCode_default;
axios.default = axios;
var axios_default = axios;

// node_modules/axios/index.js
var {
  Axios: Axios2,
  AxiosError: AxiosError2,
  CanceledError: CanceledError2,
  isCancel: isCancel2,
  CancelToken: CancelToken2,
  VERSION: VERSION2,
  all: all2,
  Cancel,
  isAxiosError: isAxiosError2,
  spread: spread2,
  toFormData: toFormData2,
  AxiosHeaders: AxiosHeaders2,
  HttpStatusCode: HttpStatusCode2,
  formToJSON,
  getAdapter: getAdapter2,
  mergeConfig: mergeConfig2,
  create
} = axios_default;

// node_modules/base58-js/base58_chars.js
var base58_chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
var base58_chars_default = base58_chars;

// node_modules/base58-js/base58_to_binary.js
function base58_to_binary(base58String) {
  if (!base58String || typeof base58String !== "string")
    throw new Error(`Expected base58 string but got \u201C${base58String}\u201D`);
  if (base58String.match(/[IOl0]/gmu))
    throw new Error(
      `Invalid base58 character \u201C${base58String.match(/[IOl0]/gmu)}\u201D`
    );
  const lz = base58String.match(/^1+/gmu);
  const psz = lz ? lz[0].length : 0;
  const size = (base58String.length - psz) * (Math.log(58) / Math.log(256)) + 1 >>> 0;
  return new Uint8Array([
    ...new Uint8Array(psz),
    ...base58String.match(/.{1}/gmu).map((i) => base58_chars_default.indexOf(i)).reduce((acc, i) => {
      acc = acc.map((j) => {
        const x = j * 58 + i;
        i = x >> 8;
        return x;
      });
      return acc;
    }, new Uint8Array(size)).reverse().filter(
      /* @__PURE__ */ ((lastValue) => (value) => (
        // @ts-ignore
        lastValue = lastValue || value
      ))(false)
    )
  ]);
}
var base58_to_binary_default = base58_to_binary;

// node_modules/bitcoin-address-validation/dist/index.js
var import_bech32 = __toESM(require_dist(), 1);

// node_modules/sha256-uint8array/dist/sha256-uint8array.mjs
var K = [
  1116352408 | 0,
  1899447441 | 0,
  3049323471 | 0,
  3921009573 | 0,
  961987163 | 0,
  1508970993 | 0,
  2453635748 | 0,
  2870763221 | 0,
  3624381080 | 0,
  310598401 | 0,
  607225278 | 0,
  1426881987 | 0,
  1925078388 | 0,
  2162078206 | 0,
  2614888103 | 0,
  3248222580 | 0,
  3835390401 | 0,
  4022224774 | 0,
  264347078 | 0,
  604807628 | 0,
  770255983 | 0,
  1249150122 | 0,
  1555081692 | 0,
  1996064986 | 0,
  2554220882 | 0,
  2821834349 | 0,
  2952996808 | 0,
  3210313671 | 0,
  3336571891 | 0,
  3584528711 | 0,
  113926993 | 0,
  338241895 | 0,
  666307205 | 0,
  773529912 | 0,
  1294757372 | 0,
  1396182291 | 0,
  1695183700 | 0,
  1986661051 | 0,
  2177026350 | 0,
  2456956037 | 0,
  2730485921 | 0,
  2820302411 | 0,
  3259730800 | 0,
  3345764771 | 0,
  3516065817 | 0,
  3600352804 | 0,
  4094571909 | 0,
  275423344 | 0,
  430227734 | 0,
  506948616 | 0,
  659060556 | 0,
  883997877 | 0,
  958139571 | 0,
  1322822218 | 0,
  1537002063 | 0,
  1747873779 | 0,
  1955562222 | 0,
  2024104815 | 0,
  2227730452 | 0,
  2361852424 | 0,
  2428436474 | 0,
  2756734187 | 0,
  3204031479 | 0,
  3329325298 | 0
];
var algorithms = {
  sha256: 1
};
function createHash(algorithm) {
  if (algorithm && !algorithms[algorithm] && !algorithms[algorithm.toLowerCase()]) {
    throw new Error("Digest method not supported");
  }
  return new Hash();
}
var Hash = class {
  constructor() {
    this.A = 1779033703 | 0;
    this.B = 3144134277 | 0;
    this.C = 1013904242 | 0;
    this.D = 2773480762 | 0;
    this.E = 1359893119 | 0;
    this.F = 2600822924 | 0;
    this.G = 528734635 | 0;
    this.H = 1541459225 | 0;
    this._size = 0;
    this._sp = 0;
    if (!sharedBuffer || sharedOffset >= 8e3) {
      sharedBuffer = new ArrayBuffer(
        8e3
        /* N.allocTotal */
      );
      sharedOffset = 0;
    }
    this._byte = new Uint8Array(
      sharedBuffer,
      sharedOffset,
      80
      /* N.allocBytes */
    );
    this._word = new Int32Array(
      sharedBuffer,
      sharedOffset,
      20
      /* N.allocWords */
    );
    sharedOffset += 80;
  }
  update(data) {
    if ("string" === typeof data) {
      return this._utf8(data);
    }
    if (data == null) {
      throw new TypeError("Invalid type: " + typeof data);
    }
    const byteOffset = data.byteOffset;
    const length2 = data.byteLength;
    let blocks = length2 / 64 | 0;
    let offset = 0;
    if (blocks && !(byteOffset & 3) && !(this._size % 64)) {
      const block = new Int32Array(
        data.buffer,
        byteOffset,
        blocks * 16
        /* N.inputWords */
      );
      while (blocks--) {
        this._int32(block, offset >> 2);
        offset += 64;
      }
      this._size += offset;
    }
    const BYTES_PER_ELEMENT = data.BYTES_PER_ELEMENT;
    if (BYTES_PER_ELEMENT !== 1 && data.buffer) {
      const rest = new Uint8Array(data.buffer, byteOffset + offset, length2 - offset);
      return this._uint8(rest);
    }
    if (offset === length2)
      return this;
    return this._uint8(data, offset);
  }
  _uint8(data, offset) {
    const { _byte, _word } = this;
    const length2 = data.length;
    offset = offset | 0;
    while (offset < length2) {
      const start = this._size % 64;
      let index = start;
      while (offset < length2 && index < 64) {
        _byte[index++] = data[offset++];
      }
      if (index >= 64) {
        this._int32(_word);
      }
      this._size += index - start;
    }
    return this;
  }
  _utf8(text) {
    const { _byte, _word } = this;
    const length2 = text.length;
    let surrogate = this._sp;
    for (let offset = 0; offset < length2; ) {
      const start = this._size % 64;
      let index = start;
      while (offset < length2 && index < 64) {
        let code = text.charCodeAt(offset++) | 0;
        if (code < 128) {
          _byte[index++] = code;
        } else if (code < 2048) {
          _byte[index++] = 192 | code >>> 6;
          _byte[index++] = 128 | code & 63;
        } else if (code < 55296 || code > 57343) {
          _byte[index++] = 224 | code >>> 12;
          _byte[index++] = 128 | code >>> 6 & 63;
          _byte[index++] = 128 | code & 63;
        } else if (surrogate) {
          code = ((surrogate & 1023) << 10) + (code & 1023) + 65536;
          _byte[index++] = 240 | code >>> 18;
          _byte[index++] = 128 | code >>> 12 & 63;
          _byte[index++] = 128 | code >>> 6 & 63;
          _byte[index++] = 128 | code & 63;
          surrogate = 0;
        } else {
          surrogate = code;
        }
      }
      if (index >= 64) {
        this._int32(_word);
        _word[0] = _word[
          16
          /* N.inputWords */
        ];
      }
      this._size += index - start;
    }
    this._sp = surrogate;
    return this;
  }
  _int32(data, offset) {
    let { A, B, C, D, E, F, G: G2, H } = this;
    let i = 0;
    offset = offset | 0;
    while (i < 16) {
      W[i++] = swap32(data[offset++]);
    }
    for (i = 16; i < 64; i++) {
      W[i] = gamma1(W[i - 2]) + W[i - 7] + gamma0(W[i - 15]) + W[i - 16] | 0;
    }
    for (i = 0; i < 64; i++) {
      const T1 = H + sigma1(E) + ch(E, F, G2) + K[i] + W[i] | 0;
      const T2 = sigma0(A) + maj(A, B, C) | 0;
      H = G2;
      G2 = F;
      F = E;
      E = D + T1 | 0;
      D = C;
      C = B;
      B = A;
      A = T1 + T2 | 0;
    }
    this.A = A + this.A | 0;
    this.B = B + this.B | 0;
    this.C = C + this.C | 0;
    this.D = D + this.D | 0;
    this.E = E + this.E | 0;
    this.F = F + this.F | 0;
    this.G = G2 + this.G | 0;
    this.H = H + this.H | 0;
  }
  digest(encoding) {
    const { _byte, _word } = this;
    let i = this._size % 64 | 0;
    _byte[i++] = 128;
    while (i & 3) {
      _byte[i++] = 0;
    }
    i >>= 2;
    if (i > 14) {
      while (i < 16) {
        _word[i++] = 0;
      }
      i = 0;
      this._int32(_word);
    }
    while (i < 16) {
      _word[i++] = 0;
    }
    const bits64 = this._size * 8;
    const low32 = (bits64 & 4294967295) >>> 0;
    const high32 = (bits64 - low32) / 4294967296;
    if (high32)
      _word[
        14
        /* N.highIndex */
      ] = swap32(high32);
    if (low32)
      _word[
        15
        /* N.lowIndex */
      ] = swap32(low32);
    this._int32(_word);
    return encoding === "hex" ? this._hex() : this._bin();
  }
  _hex() {
    const { A, B, C, D, E, F, G: G2, H } = this;
    return hex32(A) + hex32(B) + hex32(C) + hex32(D) + hex32(E) + hex32(F) + hex32(G2) + hex32(H);
  }
  _bin() {
    const { A, B, C, D, E, F, G: G2, H, _byte, _word } = this;
    _word[0] = swap32(A);
    _word[1] = swap32(B);
    _word[2] = swap32(C);
    _word[3] = swap32(D);
    _word[4] = swap32(E);
    _word[5] = swap32(F);
    _word[6] = swap32(G2);
    _word[7] = swap32(H);
    return _byte.slice(0, 32);
  }
};
var W = new Int32Array(
  64
  /* N.workWords */
);
var sharedBuffer;
var sharedOffset = 0;
var hex32 = (num2) => (num2 + 4294967296).toString(16).substr(-8);
var swapLE = ((c) => c << 24 & 4278190080 | c << 8 & 16711680 | c >> 8 & 65280 | c >> 24 & 255);
var swapBE = ((c) => c);
var swap32 = isBE() ? swapBE : swapLE;
var ch = (x, y, z) => z ^ x & (y ^ z);
var maj = (x, y, z) => x & y | z & (x | y);
var sigma0 = (x) => (x >>> 2 | x << 30) ^ (x >>> 13 | x << 19) ^ (x >>> 22 | x << 10);
var sigma1 = (x) => (x >>> 6 | x << 26) ^ (x >>> 11 | x << 21) ^ (x >>> 25 | x << 7);
var gamma0 = (x) => (x >>> 7 | x << 25) ^ (x >>> 18 | x << 14) ^ x >>> 3;
var gamma1 = (x) => (x >>> 17 | x << 15) ^ (x >>> 19 | x << 13) ^ x >>> 10;
function isBE() {
  const buf = new Uint8Array(new Uint16Array([65279]).buffer);
  return buf[0] === 254;
}

// node_modules/bitcoin-address-validation/dist/index.js
var sha2563 = (payload) => createHash().update(payload).digest();
var Network;
(function(Network2) {
  Network2["mainnet"] = "mainnet";
  Network2["testnet"] = "testnet";
  Network2["regtest"] = "regtest";
  Network2["signet"] = "signet";
})(Network || (Network = {}));
var AddressType;
(function(AddressType3) {
  AddressType3["p2pkh"] = "p2pkh";
  AddressType3["p2sh"] = "p2sh";
  AddressType3["p2wpkh"] = "p2wpkh";
  AddressType3["p2wsh"] = "p2wsh";
  AddressType3["p2tr"] = "p2tr";
})(AddressType || (AddressType = {}));
var addressTypes = {
  0: {
    type: AddressType.p2pkh,
    network: Network.mainnet
  },
  111: {
    type: AddressType.p2pkh,
    network: Network.testnet
  },
  5: {
    type: AddressType.p2sh,
    network: Network.mainnet
  },
  196: {
    type: AddressType.p2sh,
    network: Network.testnet
  }
};
function castTestnetTo(fromNetwork, toNetwork) {
  if (!toNetwork) {
    return fromNetwork;
  }
  if (fromNetwork === Network.mainnet) {
    throw new Error("Cannot cast mainnet to non-mainnet");
  }
  return toNetwork;
}
var normalizeAddressInfo = (addressInfo, options) => {
  return {
    ...addressInfo,
    network: castTestnetTo(addressInfo.network, options?.castTestnetTo)
  };
};
var parseBech32 = (address, options) => {
  let decoded;
  try {
    if (address.startsWith("bc1p") || address.startsWith("tb1p") || address.startsWith("bcrt1p")) {
      decoded = import_bech32.bech32m.decode(address);
    } else {
      decoded = import_bech32.bech32.decode(address);
    }
  } catch (error) {
    throw new Error("Invalid address");
  }
  const mapPrefixToNetwork = {
    bc: Network.mainnet,
    tb: Network.testnet,
    bcrt: Network.regtest
  };
  const network = mapPrefixToNetwork[decoded.prefix];
  if (network === void 0) {
    throw new Error("Invalid address");
  }
  const witnessVersion = decoded.words[0];
  if (witnessVersion === void 0 || witnessVersion < 0 || witnessVersion > 16) {
    throw new Error("Invalid address");
  }
  const data = import_bech32.bech32.fromWords(decoded.words.slice(1));
  let type;
  if (data.length === 20) {
    type = AddressType.p2wpkh;
  } else if (witnessVersion === 1) {
    type = AddressType.p2tr;
  } else {
    type = AddressType.p2wsh;
  }
  return normalizeAddressInfo({
    bech32: true,
    network,
    address,
    type
  }, options);
};
var getAddressInfo = (address, options) => {
  let decoded;
  const prefix2 = address.slice(0, 2).toLowerCase();
  if (prefix2 === "bc" || prefix2 === "tb") {
    return parseBech32(address, options);
  }
  try {
    decoded = base58_to_binary_default(address);
  } catch (error) {
    throw new Error("Invalid address");
  }
  const { length: length2 } = decoded;
  if (length2 !== 25) {
    throw new Error("Invalid address");
  }
  const version = decoded[0];
  const checksum2 = decoded.slice(length2 - 4, length2);
  const body = decoded.slice(0, length2 - 4);
  const expectedChecksum = sha2563(sha2563(body)).slice(0, 4);
  if (checksum2.some((value, index) => value !== expectedChecksum[index])) {
    throw new Error("Invalid address");
  }
  const validVersions = Object.keys(addressTypes).map(Number);
  if (version === void 0 || !validVersions.includes(version)) {
    throw new Error("Invalid address");
  }
  const addressType = addressTypes[version];
  if (!addressType) {
    throw new Error("Invalid address");
  }
  return normalizeAddressInfo({
    ...addressType,
    address,
    bech32: false
  }, options);
};

// node_modules/@sats-connect/core/dist/index.mjs
var import_buffer = __toESM(require_buffer(), 1);
var import_jsontokens = __toESM(require_lib2(), 1);
var networkConfigurationChains = {
  bitcoin: "bitcoin",
  spark: "spark",
  stacks: "stacks",
  starknet: "starknet"
};
var networkConfigurationChainSchema = enum_(networkConfigurationChains);
var networkConfigurationSources = {
  builtin: "builtin",
  custom: "custom"
};
var networkConfigurationSourceSchema = enum_(networkConfigurationSources);
var commonNetworkConfigurationSchema = object({
  id: string2(),
  name: string2(),
  mode: picklist([]),
  source: networkConfigurationSourceSchema,
  blockExplorerUrl: optional(union([pipe(literal(""), transform(() => void 0)), pipe(string2(), url())]))
});
var bitcoinChainModeSchema = pipe(string2(), enum_({
  mainnet: "mainnet",
  testnet: "testnet",
  testnet4: "testnet4",
  signet: "signet",
  regtest: "regtest"
}));
var bitcoinNetworkConfigurationSchema = object({
  ...commonNetworkConfigurationSchema.entries,
  chain: literal(networkConfigurationChains.bitcoin),
  mode: bitcoinChainModeSchema,
  xverseApiUrl: pipe(string2(), url()),
  electrsApiUrl: pipe(string2(), url())
});
var sparkChainMode = {
  mainnet: "mainnet",
  regtest: "regtest"
};
var sparkChainModeSchema = pipe(string2(), enum_(sparkChainMode));
var sparkNetworkConfigurationSchema = object({
  ...commonNetworkConfigurationSchema.entries,
  chain: literal(networkConfigurationChains.spark),
  mode: sparkChainModeSchema,
  electrsApiUrl: pipe(string2(), url())
});
var stacksChainMode = {
  mainnet: "mainnet",
  testnet: "testnet",
  devnet: "devnet",
  mocknet: "mocknet"
};
var stacksChainModeSchema = pipe(string2(), enum_(stacksChainMode));
var stacksNetworkConfigurationSchema = object({
  ...commonNetworkConfigurationSchema.entries,
  chain: literal(networkConfigurationChains.stacks),
  mode: stacksChainModeSchema,
  stacksApiUrl: pipe(string2(), url()),
  xverseApiUrl: pipe(string2(), url())
});
var starknetChainMode = {
  mainnet: "mainnet",
  sepolia: "sepolia"
};
var starknetChainModeSchema = pipe(string2(), enum_(starknetChainMode));
var starknetNetworkConfigurationSchema = object({
  ...commonNetworkConfigurationSchema.entries,
  chain: literal(networkConfigurationChains.starknet),
  mode: starknetChainModeSchema,
  rpcApiUrl: pipe(string2(), url()),
  xverseApiUrl: pipe(string2(), url())
});
var networkConfigurationSchema = variant("chain", [
  bitcoinNetworkConfigurationSchema,
  sparkNetworkConfigurationSchema,
  stacksNetworkConfigurationSchema,
  starknetNetworkConfigurationSchema
]);
var omitFields = ["id", "source"];
var bitcoinNetworkConfigurationOptionsSchema = omit(bitcoinNetworkConfigurationSchema, omitFields);
var sparkNetworkConfigurationOptionsSchema = omit(sparkNetworkConfigurationSchema, omitFields);
var stacksNetworkConfigurationOptionsSchema = omit(stacksNetworkConfigurationSchema, omitFields);
var starknetNetworkConfigurationOptionsSchema = omit(starknetNetworkConfigurationSchema, omitFields);
var networkConfigurationOptionsSchema = variant("chain", [
  bitcoinNetworkConfigurationOptionsSchema,
  sparkNetworkConfigurationOptionsSchema,
  stacksNetworkConfigurationOptionsSchema,
  starknetNetworkConfigurationOptionsSchema
]);
var allResolvedNetworksSchema = object({
  active: object({
    bitcoin: bitcoinNetworkConfigurationSchema,
    spark: sparkNetworkConfigurationSchema,
    stacks: stacksNetworkConfigurationSchema,
    starknet: starknetNetworkConfigurationSchema
  }),
  all: array2(networkConfigurationSchema)
});
var walletTypes = [
  "software",
  "ledger",
  "keystone",
  "multisig"
];
var walletTypeSchema = picklist(walletTypes);
var stacksMultisigSchema = object({
  hashMode: literal("P2SHNonSequential"),
  threshold: pipe(number(), integer(), minValue(1)),
  publicKeys: pipe(array2(pipe(string2(), regex(/^0[23][0-9a-f]{64}$/))), minLength(1))
});
var AddressPurpose = /* @__PURE__ */ (function(AddressPurpose$1) {
  AddressPurpose$1["Ordinals"] = "ordinals";
  AddressPurpose$1["Payment"] = "payment";
  AddressPurpose$1["Stacks"] = "stacks";
  AddressPurpose$1["Starknet"] = "starknet";
  AddressPurpose$1["Spark"] = "spark";
  return AddressPurpose$1;
})({});
var AddressType2 = /* @__PURE__ */ (function(AddressType$2) {
  AddressType$2["p2pkh"] = "p2pkh";
  AddressType$2["p2sh"] = "p2sh";
  AddressType$2["p2wpkh"] = "p2wpkh";
  AddressType$2["p2wsh"] = "p2wsh";
  AddressType$2["p2tr"] = "p2tr";
  AddressType$2["stacks"] = "stacks";
  AddressType$2["starknet"] = "starknet";
  AddressType$2["spark"] = "spark";
  return AddressType$2;
})({});
var hexSchema = pipe(string2(), regex(/^(?:[0-9a-f]{2})+$/, "Expected lowercase, even-length hex without a 0x prefix"));
var tapInternalKeySchema = pipe(hexSchema, length(64, "Expected a 32-byte x-only key"));
var controlBlockSchema = pipe(hexSchema, check((controlBlock) => controlBlock.length >= 66 && controlBlock.length <= 8258 && (controlBlock.length - 66) % 64 === 0, "Expected a 33+32n byte BIP341 control block"));
var tapLeafScriptSchema = pipe(object({
  script: hexSchema,
  controlBlock: controlBlockSchema
}), check(({ script, controlBlock }) => Number.parseInt(script.slice(-2), 16) === (Number.parseInt(controlBlock.slice(0, 2), 16) & 254), "Tapleaf version does not match the control block"));
var unlockDefinitionSchema = variant("type", [
  object({ type: literal("p2wpkh") }),
  object({
    type: literal("p2sh-p2wpkh"),
    redeemScript: hexSchema
  }),
  object({
    type: literal("p2tr-key-path"),
    tapInternalKey: tapInternalKeySchema
  }),
  object({
    type: literal("p2wsh"),
    witnessScript: hexSchema
  }),
  object({
    type: literal("p2tr-script-path"),
    tapLeafScript: pipe(array2(tapLeafScriptSchema), minLength(1))
  })
]);
var addressObjectSchema = object({
  address: string2(),
  publicKey: string2(),
  purpose: enum_(AddressPurpose),
  addressType: enum_(AddressType2),
  walletType: walletTypeSchema,
  scriptPubKey: optional(hexSchema),
  unlockDefinition: optional(unlockDefinitionSchema),
  stacksMultisig: optional(stacksMultisigSchema)
});
var addressSchema = pipe(addressObjectSchema, check(({ scriptPubKey: scriptPubKey2, unlockDefinition }) => scriptPubKey2 === void 0 === (unlockDefinition === void 0), "scriptPubKey and unlockDefinition must both be present or both be absent"), check(({ addressType, unlockDefinition }) => {
  if (!unlockDefinition) return true;
  switch (unlockDefinition.type) {
    case "p2wpkh":
      return addressType === AddressType2.p2wpkh;
    case "p2sh-p2wpkh":
      return addressType === AddressType2.p2sh;
    case "p2tr-key-path":
    case "p2tr-script-path":
      return addressType === AddressType2.p2tr;
    case "p2wsh":
      return addressType === AddressType2.p2wsh;
  }
}, "unlockDefinition type does not match addressType"), check(({ purpose, addressType, walletType, stacksMultisig }) => !stacksMultisig || purpose === AddressPurpose.Stacks && addressType === AddressType2.stacks && walletType === "multisig", "stacksMultisig is only valid on multisig Stacks addresses"));
var BitcoinNetworkType = /* @__PURE__ */ (function(BitcoinNetworkType$1) {
  BitcoinNetworkType$1["Mainnet"] = "Mainnet";
  BitcoinNetworkType$1["Testnet"] = "Testnet";
  BitcoinNetworkType$1["Testnet4"] = "Testnet4";
  BitcoinNetworkType$1["Signet"] = "Signet";
  BitcoinNetworkType$1["Regtest"] = "Regtest";
  return BitcoinNetworkType$1;
})({});
var StacksNetworkType = /* @__PURE__ */ (function(StacksNetworkType$1) {
  StacksNetworkType$1["Mainnet"] = "mainnet";
  StacksNetworkType$1["Testnet"] = "testnet";
  return StacksNetworkType$1;
})({});
var StarknetNetworkType = /* @__PURE__ */ (function(StarknetNetworkType$1) {
  StarknetNetworkType$1["Mainnet"] = "mainnet";
  StarknetNetworkType$1["Sepolia"] = "sepolia";
  return StarknetNetworkType$1;
})({});
var SparkNetworkType = /* @__PURE__ */ (function(SparkNetworkType$1) {
  SparkNetworkType$1["Mainnet"] = "mainnet";
  SparkNetworkType$1["Regtest"] = "regtest";
  return SparkNetworkType$1;
})({});
var RpcErrorCode = /* @__PURE__ */ (function(RpcErrorCode$1) {
  RpcErrorCode$1[RpcErrorCode$1["PARSE_ERROR"] = -32700] = "PARSE_ERROR";
  RpcErrorCode$1[RpcErrorCode$1["INVALID_REQUEST"] = -32600] = "INVALID_REQUEST";
  RpcErrorCode$1[RpcErrorCode$1["METHOD_NOT_FOUND"] = -32601] = "METHOD_NOT_FOUND";
  RpcErrorCode$1[RpcErrorCode$1["INVALID_PARAMS"] = -32602] = "INVALID_PARAMS";
  RpcErrorCode$1[RpcErrorCode$1["INTERNAL_ERROR"] = -32603] = "INTERNAL_ERROR";
  RpcErrorCode$1[RpcErrorCode$1["USER_REJECTION"] = -32e3] = "USER_REJECTION";
  RpcErrorCode$1[RpcErrorCode$1["METHOD_NOT_SUPPORTED"] = -32001] = "METHOD_NOT_SUPPORTED";
  RpcErrorCode$1[RpcErrorCode$1["ACCESS_DENIED"] = -32002] = "ACCESS_DENIED";
  return RpcErrorCode$1;
})({});
var accountChangeEventName = "accountChange";
var accountChangeSchema = object({
  type: literal(accountChangeEventName),
  addresses: optional(array2(addressSchema))
});
var networkChangeEventName = "networkChange";
var networkChangeSchema = object({
  type: literal(networkChangeEventName),
  bitcoin: object({ name: enum_(BitcoinNetworkType) }),
  stacks: object({ name: string2() }),
  addresses: optional(array2(addressSchema))
});
var networkChangeV2Schema = object({
  type: literal(networkChangeEventName),
  networks: object({
    bitcoin: bitcoinNetworkConfigurationSchema,
    spark: sparkNetworkConfigurationSchema,
    stacks: stacksNetworkConfigurationSchema,
    starknet: starknetNetworkConfigurationSchema
  }),
  addresses: optional(array2(addressSchema))
});
var disconnectEventName = "disconnect";
var disconnectSchema = object({ type: literal(disconnectEventName) });
var walletEventSchema = variant("type", [
  accountChangeSchema,
  networkChangeSchema,
  disconnectSchema
]);
function getProviderById(providerId) {
  return providerId?.split(".").reduce((acc, part) => acc?.[part], window);
}
var urlNetworkSuffix = {
  [BitcoinNetworkType.Mainnet]: "",
  [BitcoinNetworkType.Testnet]: "-testnet",
  [BitcoinNetworkType.Testnet4]: "-testnet4",
  [BitcoinNetworkType.Signet]: "-signet"
};
var ORDINALS_API_BASE_URL = (network = BitcoinNetworkType.Mainnet) => {
  if (network === BitcoinNetworkType.Regtest) throw new Error(`Ordinals API does not support ${network} network`);
  return `https://ordinals${urlNetworkSuffix[network]}.xverse.app/v1`;
};
var RunesApi = class {
  client;
  constructor(network) {
    this.client = axios_default.create({ baseURL: ORDINALS_API_BASE_URL(network) });
  }
  parseError = (error) => {
    return {
      code: error.response?.status,
      message: JSON.stringify(error.response?.data)
    };
  };
  estimateMintCost = async (mintParams) => {
    try {
      return { data: (await this.client.post("/runes/mint/estimate", { ...mintParams })).data };
    } catch (error) {
      const err = error;
      return { error: this.parseError(err) };
    }
  };
  estimateEtchCost = async (etchParams) => {
    try {
      return { data: (await this.client.post("/runes/etch/estimate", { ...etchParams })).data };
    } catch (error) {
      const err = error;
      return { error: this.parseError(err) };
    }
  };
  createMintOrder = async (mintOrderParams) => {
    try {
      return { data: (await this.client.post("/runes/mint/orders", { ...mintOrderParams })).data };
    } catch (error) {
      const err = error;
      return { error: this.parseError(err) };
    }
  };
  createEtchOrder = async (etchOrderParams) => {
    try {
      return { data: (await this.client.post("/runes/etch/orders", { ...etchOrderParams })).data };
    } catch (error) {
      const err = error;
      return { error: this.parseError(err) };
    }
  };
  executeMint = async (orderId, fundTransactionId) => {
    try {
      return { data: (await this.client.post(`/runes/mint/orders/${orderId}/execute`, { fundTransactionId })).data };
    } catch (error) {
      const err = error;
      return { error: this.parseError(err) };
    }
  };
  executeEtch = async (orderId, fundTransactionId) => {
    try {
      return { data: (await this.client.post(`/runes/etch/orders/${orderId}/execute`, { fundTransactionId })).data };
    } catch (error) {
      const err = error;
      return { error: this.parseError(err) };
    }
  };
  getOrder = async (orderId) => {
    try {
      return { data: (await this.client.get(`/orders/${orderId}`)).data };
    } catch (error) {
      const err = error;
      return { error: this.parseError(err) };
    }
  };
  rbfOrder = async (rbfRequest) => {
    const { orderId, newFeeRate } = rbfRequest;
    try {
      return { data: (await this.client.post(`/orders/${orderId}/rbf-estimate`, { newFeeRate })).data };
    } catch (error) {
      const err = error;
      return { error: this.parseError(err) };
    }
  };
};
var clients = {};
var getRunesApiClient = (network = BitcoinNetworkType.Mainnet) => {
  if (!clients[network]) clients[network] = new RunesApi(network);
  return clients[network];
};
var SatsConnectAdapter = class {
  async mintRunes(params) {
    try {
      const walletInfo = await this.requestInternal("getInfo", null).catch(() => null);
      if (walletInfo && walletInfo.status === "success") {
        if (walletInfo.result.methods?.includes("runes_mint")) {
          const response = await this.requestInternal("runes_mint", params);
          if (response) {
            if (response.status === "success") return response;
            if (response.status === "error" && response.error.code !== RpcErrorCode.METHOD_NOT_FOUND) return response;
          }
        }
      }
      const mintRequest = {
        destinationAddress: params.destinationAddress,
        feeRate: params.feeRate,
        refundAddress: params.refundAddress,
        repeats: params.repeats,
        runeName: params.runeName,
        appServiceFee: params.appServiceFee,
        appServiceFeeAddress: params.appServiceFeeAddress
      };
      const orderResponse = await new RunesApi(params.network).createMintOrder(mintRequest);
      if (!orderResponse.data) return {
        status: "error",
        error: {
          code: orderResponse.error.code === 400 ? RpcErrorCode.INVALID_REQUEST : RpcErrorCode.INTERNAL_ERROR,
          message: orderResponse.error.message
        }
      };
      const paymentResponse = await this.requestInternal("sendTransfer", { recipients: [{
        address: orderResponse.data.fundAddress,
        amount: orderResponse.data.fundAmount
      }] });
      if (paymentResponse.status !== "success") return paymentResponse;
      await new RunesApi(params.network).executeMint(orderResponse.data.orderId, paymentResponse.result.txid);
      return {
        status: "success",
        result: {
          orderId: orderResponse.data.orderId,
          fundTransactionId: paymentResponse.result.txid,
          fundingAddress: orderResponse.data.fundAddress
        }
      };
    } catch (error) {
      return {
        status: "error",
        error: {
          code: RpcErrorCode.INTERNAL_ERROR,
          message: error.message
        }
      };
    }
  }
  async etchRunes(params) {
    const etchRequest = {
      destinationAddress: params.destinationAddress,
      refundAddress: params.refundAddress,
      feeRate: params.feeRate,
      runeName: params.runeName,
      divisibility: params.divisibility,
      symbol: params.symbol,
      premine: params.premine,
      isMintable: params.isMintable,
      terms: params.terms,
      inscriptionDetails: params.inscriptionDetails,
      delegateInscriptionId: params.delegateInscriptionId,
      appServiceFee: params.appServiceFee,
      appServiceFeeAddress: params.appServiceFeeAddress
    };
    try {
      const walletInfo = await this.requestInternal("getInfo", null).catch(() => null);
      if (walletInfo && walletInfo.status === "success") {
        if (walletInfo.result.methods?.includes("runes_etch")) {
          const response = await this.requestInternal("runes_etch", params);
          if (response) {
            if (response.status === "success") return response;
            if (response.status === "error" && response.error.code !== RpcErrorCode.METHOD_NOT_FOUND) return response;
          }
        }
      }
      const orderResponse = await new RunesApi(params.network).createEtchOrder(etchRequest);
      if (!orderResponse.data) return {
        status: "error",
        error: {
          code: orderResponse.error.code === 400 ? RpcErrorCode.INVALID_REQUEST : RpcErrorCode.INTERNAL_ERROR,
          message: orderResponse.error.message
        }
      };
      const paymentResponse = await this.requestInternal("sendTransfer", { recipients: [{
        address: orderResponse.data.fundAddress,
        amount: orderResponse.data.fundAmount
      }] });
      if (paymentResponse.status !== "success") return paymentResponse;
      await new RunesApi(params.network).executeEtch(orderResponse.data.orderId, paymentResponse.result.txid);
      return {
        status: "success",
        result: {
          orderId: orderResponse.data.orderId,
          fundTransactionId: paymentResponse.result.txid,
          fundingAddress: orderResponse.data.fundAddress
        }
      };
    } catch (error) {
      return {
        status: "error",
        error: {
          code: RpcErrorCode.INTERNAL_ERROR,
          message: error.message
        }
      };
    }
  }
  async estimateMint(params) {
    const estimateMintRequest = {
      destinationAddress: params.destinationAddress,
      feeRate: params.feeRate,
      repeats: params.repeats,
      runeName: params.runeName,
      appServiceFee: params.appServiceFee,
      appServiceFeeAddress: params.appServiceFeeAddress
    };
    const response = await getRunesApiClient(params.network).estimateMintCost(estimateMintRequest);
    if (response.data) return {
      status: "success",
      result: response.data
    };
    return {
      status: "error",
      error: {
        code: response.error.code === 400 ? RpcErrorCode.INVALID_REQUEST : RpcErrorCode.INTERNAL_ERROR,
        message: response.error.message
      }
    };
  }
  async estimateEtch(params) {
    const estimateEtchRequest = {
      destinationAddress: params.destinationAddress,
      feeRate: params.feeRate,
      runeName: params.runeName,
      divisibility: params.divisibility,
      symbol: params.symbol,
      premine: params.premine,
      isMintable: params.isMintable,
      terms: params.terms,
      inscriptionDetails: params.inscriptionDetails,
      delegateInscriptionId: params.delegateInscriptionId,
      appServiceFee: params.appServiceFee,
      appServiceFeeAddress: params.appServiceFeeAddress
    };
    const response = await getRunesApiClient(params.network).estimateEtchCost(estimateEtchRequest);
    if (response.data) return {
      status: "success",
      result: response.data
    };
    return {
      status: "error",
      error: {
        code: response.error.code === 400 ? RpcErrorCode.INVALID_REQUEST : RpcErrorCode.INTERNAL_ERROR,
        message: response.error.message
      }
    };
  }
  async getOrder(params) {
    const response = await getRunesApiClient(params.network).getOrder(params.id);
    if (response.data) return {
      status: "success",
      result: response.data
    };
    return {
      status: "error",
      error: {
        code: response.error.code === 400 || response.error.code === 404 ? RpcErrorCode.INVALID_REQUEST : RpcErrorCode.INTERNAL_ERROR,
        message: response.error.message
      }
    };
  }
  async estimateRbfOrder(params) {
    const rbfOrderRequest = {
      newFeeRate: params.newFeeRate,
      orderId: params.orderId
    };
    const response = await getRunesApiClient(params.network).rbfOrder(rbfOrderRequest);
    if (response.data) return {
      status: "success",
      result: {
        fundingAddress: response.data.fundingAddress,
        rbfCost: response.data.rbfCost
      }
    };
    return {
      status: "error",
      error: {
        code: response.error.code === 400 || response.error.code === 404 ? RpcErrorCode.INVALID_REQUEST : RpcErrorCode.INTERNAL_ERROR,
        message: response.error.message
      }
    };
  }
  async rbfOrder(params) {
    try {
      const rbfOrderRequest = {
        newFeeRate: params.newFeeRate,
        orderId: params.orderId
      };
      const orderResponse = await getRunesApiClient(params.network).rbfOrder(rbfOrderRequest);
      if (!orderResponse.data) return {
        status: "error",
        error: {
          code: orderResponse.error.code === 400 || orderResponse.error.code === 404 ? RpcErrorCode.INVALID_REQUEST : RpcErrorCode.INTERNAL_ERROR,
          message: orderResponse.error.message
        }
      };
      const paymentResponse = await this.requestInternal("sendTransfer", { recipients: [{
        address: orderResponse.data.fundingAddress,
        amount: orderResponse.data.rbfCost
      }] });
      if (paymentResponse.status !== "success") return paymentResponse;
      return {
        status: "success",
        result: {
          fundingAddress: orderResponse.data.fundingAddress,
          orderId: rbfOrderRequest.orderId,
          fundRBFTransactionId: paymentResponse.result.txid
        }
      };
    } catch (error) {
      return {
        status: "error",
        error: {
          code: RpcErrorCode.INTERNAL_ERROR,
          message: error.message
        }
      };
    }
  }
  async request(method, params) {
    switch (method) {
      case "runes_mint":
        return this.mintRunes(params);
      case "runes_etch":
        return this.etchRunes(params);
      case "runes_estimateMint":
        return this.estimateMint(params);
      case "runes_estimateEtch":
        return this.estimateEtch(params);
      case "runes_getOrder":
        return this.getOrder(params);
      case "runes_estimateRbfOrder":
        return this.estimateRbfOrder(params);
      case "runes_rbfOrder":
        return this.rbfOrder(params);
      default:
        return this.requestInternal(method, params);
    }
  }
};
var FordefiAdapter = class extends SatsConnectAdapter {
  id = DefaultAdaptersInfo.fordefi.id;
  requestInternal = async (method, params) => {
    const provider = getProviderById(this.id);
    if (!provider) throw new Error("no wallet provider was found");
    if (!method) throw new Error("A wallet method is required");
    return await provider.request(method, params);
  };
  addListener = ({ eventName, cb }) => {
    const provider = getProviderById(this.id);
    if (!provider) throw new Error("no wallet provider was found");
    if (!provider.addListener) {
      console.error(`The wallet provider you are using does not support the addListener method. Please update your wallet provider.`);
      return () => {
      };
    }
    return provider.addListener(eventName, cb);
  };
};
var MessageSigningProtocols = /* @__PURE__ */ (function(MessageSigningProtocols$1) {
  MessageSigningProtocols$1["ECDSA"] = "ECDSA";
  MessageSigningProtocols$1["BIP322"] = "BIP322";
  return MessageSigningProtocols$1;
})({});
var ProviderPlatform = /* @__PURE__ */ (function(ProviderPlatform$1) {
  ProviderPlatform$1["Web"] = "web";
  ProviderPlatform$1["Mobile"] = "mobile";
  return ProviderPlatform$1;
})({});
function convertSignInputsToInputType(signInputs) {
  const result = [];
  if (!signInputs) return result;
  for (const address in signInputs) {
    const indexes = signInputs[address];
    for (const index of indexes) result.push({
      index,
      address
    });
  }
  return result;
}
var UnisatAdapter = class extends SatsConnectAdapter {
  id = DefaultAdaptersInfo.unisat.id;
  async getAccounts(params) {
    const { purposes } = params;
    if (purposes.includes(AddressPurpose.Stacks) || purposes.includes(AddressPurpose.Starknet) || purposes.includes(AddressPurpose.Spark)) throw new Error("Only bitcoin addresses are supported");
    const accounts = await window.unisat.requestAccounts();
    const publicKey = await window.unisat.getPublicKey();
    const address = accounts[0];
    const addressType = getAddressInfo(accounts[0]).type;
    const pk = addressType === AddressType.p2tr ? publicKey.slice(2) : publicKey;
    const paymentAddress = {
      address,
      publicKey: pk,
      addressType,
      purpose: AddressPurpose.Payment,
      walletType: "software"
    };
    const ordinalsAddress = {
      address,
      publicKey: pk,
      addressType,
      purpose: AddressPurpose.Ordinals,
      walletType: "software"
    };
    const response = [];
    if (purposes.includes(AddressPurpose.Payment)) response.push({
      ...paymentAddress,
      walletType: "software"
    });
    if (purposes.includes(AddressPurpose.Ordinals)) response.push({
      ...ordinalsAddress,
      walletType: "software"
    });
    return response;
  }
  async signMessage(params) {
    const { message, address } = params;
    const addressType = getAddressInfo(address).type;
    if ([AddressType.p2wpkh, AddressType.p2tr].includes(addressType)) return {
      address,
      messageHash: "",
      signature: await window.unisat.signMessage(message, "bip322-simple"),
      protocol: MessageSigningProtocols.BIP322
    };
    return {
      address,
      messageHash: "",
      signature: await window.unisat.signMessage(message, "ecdsa"),
      protocol: MessageSigningProtocols.ECDSA
    };
  }
  async sendTransfer(params) {
    const { recipients, broadcast: broadcast2 } = params;
    if (recipients.length > 1) throw new Error("Only one recipient is supported by this wallet provider");
    if (broadcast2 === false) throw new Error("Signing without broadcasting is not supported by this wallet provider");
    return { txid: await window.unisat.sendBitcoin(recipients[0].address, recipients[0].amount) };
  }
  async signPsbt(params) {
    const { psbt, signInputs, broadcast: broadcast2 } = params;
    const psbtHex = import_buffer.Buffer.from(psbt, "base64").toString("hex");
    const signedPsbt = await window.unisat.signPsbt(psbtHex, {
      autoFinalized: broadcast2,
      toSignInputs: convertSignInputsToInputType(signInputs)
    });
    const signedPsbtBase64 = import_buffer.Buffer.from(signedPsbt, "hex").toString("base64");
    let txid;
    if (broadcast2) txid = await window.unisat.pushPsbt(signedPsbt);
    return {
      psbt: signedPsbtBase64,
      txid
    };
  }
  requestInternal = async (method, params) => {
    try {
      switch (method) {
        case "getAccounts":
          return {
            status: "success",
            result: await this.getAccounts(params)
          };
        case "sendTransfer":
          return {
            status: "success",
            result: await this.sendTransfer(params)
          };
        case "signMessage":
          return {
            status: "success",
            result: await this.signMessage(params)
          };
        case "signPsbt":
          return {
            status: "success",
            result: await this.signPsbt(params)
          };
        default: {
          const error = {
            code: RpcErrorCode.METHOD_NOT_SUPPORTED,
            message: "Method not supported by the selected wallet"
          };
          console.error("Error calling the method", error);
          return {
            status: "error",
            error
          };
        }
      }
    } catch (error) {
      console.error("Error calling the method", error);
      return {
        status: "error",
        error: {
          code: error.code === 4001 ? RpcErrorCode.USER_REJECTION : RpcErrorCode.INTERNAL_ERROR,
          message: error.message ? error.message : "Wallet method call error",
          data: error
        }
      };
    }
  };
  addListener = ({ eventName, cb }) => {
    switch (eventName) {
      case "accountChange": {
        const handler = () => {
          cb({ type: "accountChange" });
        };
        window.unisat.on("accountsChanged", handler);
        return () => {
          window.unisat.removeListener("accountsChanged", handler);
        };
      }
      case "networkChange": {
        const handler = () => {
          cb({ type: "networkChange" });
        };
        window.unisat.on("networkChanged", handler);
        return () => {
          window.unisat.removeListener("networkChanged", handler);
        };
      }
      default:
        console.error("Event not supported by the selected wallet");
        return () => {
        };
    }
  };
};
var specIdSchema = union([
  string2(),
  number(),
  null_()
]);
var specRequestSchema = object({
  jsonrpc: literal("2.0"),
  method: string2(),
  params: optional(union([
    array2(unknown()),
    looseObject({}),
    null_()
  ])),
  id: optional(specIdSchema)
});
var specSuccessResponseSchema = object({
  jsonrpc: literal("2.0"),
  result: unknown(),
  id: specIdSchema
});
var warningSchema = variant("code", [object({
  code: literal("DEPRECATION_NOTICE"),
  message: string2(),
  sunsetDate: pipe(string2(), isoDate())
})]);
var specSuccessWithExtensionsResponseSchema = object({
  ...specSuccessResponseSchema.entries,
  extensions: optional(object({ warnings: array2(warningSchema) }))
});
var specErrorObjectSchema = object({
  code: number(),
  message: string2(),
  data: optional(unknown())
});
var specErrorResponseSchema = object({
  jsonrpc: literal("2.0"),
  error: specErrorObjectSchema,
  id: specIdSchema
});
var specResponseSchema = union([specSuccessWithExtensionsResponseSchema, specErrorResponseSchema]);
var sanitizeRequest = (method, params, providerInfo) => {
  try {
    const [major, minor] = providerInfo.version.split(".").map((part) => parseInt(part, 10));
    const platform = providerInfo.platform;
    if (!platform || platform === ProviderPlatform.Web && major <= 1 && minor <= 4 || platform === ProviderPlatform.Mobile && major <= 1 && minor <= 54) {
      const v1Sanitized = sanitizeAddressPurposeRequest(method, params);
      method = v1Sanitized.method;
      params = v1Sanitized.params;
    }
  } catch {
  }
  return {
    method,
    params
  };
};
var sanitizeAddressPurposeRequest = (method, params) => {
  const filterPurposes = (purposes) => purposes?.filter((purpose) => purpose !== AddressPurpose.Spark && purpose !== AddressPurpose.Starknet);
  if (method === "wallet_connect") {
    const typedParams = params;
    if (!typedParams) return {
      method,
      params
    };
    const { addresses, ...rest } = typedParams;
    return {
      method,
      params: {
        ...rest,
        addresses: filterPurposes(addresses)
      }
    };
  }
  if (method === "getAccounts") {
    const { purposes, ...rest } = params;
    return {
      method,
      params: {
        ...rest,
        purposes: filterPurposes(purposes)
      }
    };
  }
  if (method === "getAddresses") {
    const { purposes, ...rest } = params;
    return {
      method,
      params: {
        ...rest,
        purposes: filterPurposes(purposes)
      }
    };
  }
  return {
    method,
    params
  };
};
var bitcoinMethods = {
  getAccounts: "getAccounts",
  getAddresses: "getAddresses",
  bitcoin_getAddressesV2: "bitcoin_getAddressesV2",
  getBalance: "getBalance",
  bitcoin_getBalanceV2: "bitcoin_getBalanceV2",
  getInfo: "getInfo",
  sendTransfer: "sendTransfer",
  bitcoin_sendTransferV2: "bitcoin_sendTransferV2",
  signMessage: "signMessage",
  bitcoin_signMessageV2: "bitcoin_signMessageV2",
  signMultipleMessages: "signMultipleMessages",
  bitcoin_signMultipleMessagesV2: "bitcoin_signMultipleMessagesV2",
  signPsbt: "signPsbt",
  bitcoin_signPsbtV2: "bitcoin_signPsbtV2"
};
var stacksMethods = {
  stx_callContract: "stx_callContract",
  stx_deployContract: "stx_deployContract",
  stx_getAccounts: "stx_getAccounts",
  stx_getAddresses: "stx_getAddresses",
  stx_signMessage: "stx_signMessage",
  stx_signStructuredMessage: "stx_signStructuredMessage",
  stx_signTransaction: "stx_signTransaction",
  stx_signTransactions: "stx_signTransactions",
  stx_transferStx: "stx_transferStx"
};
var sparkMethods = {
  spark_getAddresses: "spark_getAddresses",
  spark_getAddressesV2: "spark_getAddressesV2",
  spark_getBalance: "spark_getBalance",
  spark_transfer: "spark_transfer",
  spark_transferToken: "spark_transferToken",
  spark_signMessage: "spark_signMessage",
  spark_flashnet_getJwt: "spark_flashnet_getJwt",
  spark_flashnet_signIntent: "spark_flashnet_signIntent",
  spark_flashnet_signStructuredMessage: "spark_flashnet_signStructuredMessage",
  spark_flashnet_executeSwap: "spark_flashnet_executeSwap",
  spark_flashnet_executeRouteSwap: "spark_flashnet_executeRouteSwap",
  spark_flashnet_clawbackFunds: "spark_flashnet_clawbackFunds",
  spark_flashnet_getClawbackEligibleTransfers: "spark_flashnet_getClawbackEligibleTransfers"
};
var runesMethods = {
  runes_estimateEtch: "runes_estimateEtch",
  runes_estimateMint: "runes_estimateMint",
  runes_estimateRbfOrder: "runes_estimateRbfOrder",
  runes_etch: "runes_etch",
  runes_getBalance: "runes_getBalance",
  runes_getOrder: "runes_getOrder",
  runes_mint: "runes_mint",
  runes_rbfOrder: "runes_rbfOrder",
  runes_transfer: "runes_transfer"
};
var ordinalsMethods = {
  ord_getInscriptions: "ord_getInscriptions",
  ord_sendInscriptions: "ord_sendInscriptions"
};
var walletMethods = {
  wallet_addNetwork: "wallet_addNetwork",
  wallet_open: "wallet_open",
  wallet_addNetworkV2: "wallet_addNetworkV2",
  wallet_changeNetwork: "wallet_changeNetwork",
  wallet_connect: "wallet_connect",
  wallet_connectV2: "wallet_connectV2",
  wallet_disconnect: "wallet_disconnect",
  wallet_getAccount: "wallet_getAccount",
  wallet_getAccountV2: "wallet_getAccountV2",
  wallet_getCurrentPermissions: "wallet_getCurrentPermissions",
  wallet_getNetwork: "wallet_getNetwork",
  wallet_getNetworks: "wallet_getNetworks",
  wallet_getWalletType: "wallet_getWalletType",
  wallet_openBridge: "wallet_openBridge",
  wallet_openBuy: "wallet_openBuy",
  wallet_openReceive: "wallet_openReceive",
  wallet_renouncePermissions: "wallet_renouncePermissions",
  wallet_requestPermissions: "wallet_requestPermissions",
  wallet_switchNetwork: "wallet_switchNetwork"
};
var methods = {
  ...bitcoinMethods,
  ...stacksMethods,
  ...sparkMethods,
  ...runesMethods,
  ...ordinalsMethods,
  ...walletMethods
};
var rpcIdSchema = string2();
function createRequestSchema({ paramsSchema, method }) {
  return object({
    ...specRequestSchema.entries,
    id: rpcIdSchema,
    method: literal(method),
    params: paramsSchema
  });
}
var bitcoinGetAccountsParamsSchema = object({
  purposes: array2(enum_(AddressPurpose)),
  message: optional(string2())
});
var bitcoinGetAccountsRequestSchema = createRequestSchema({
  paramsSchema: bitcoinGetAccountsParamsSchema,
  method: bitcoinMethods.getAccounts
});
function createSuccessResponseSchema({ method, resultSchema }) {
  return object({
    ...specSuccessWithExtensionsResponseSchema.entries,
    id: rpcIdSchema,
    result: resultSchema,
    "~sats-connect-method": literal(method)
  });
}
var bitcoinGetAccountsResultSchema = array2(addressSchema);
var bitcoinGetAccountsSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: bitcoinGetAccountsResultSchema,
  method: bitcoinMethods.getAccounts
});
var bitcoinGetAddressesParamsSchema = object({
  purposes: array2(enum_(AddressPurpose)),
  message: optional(string2())
});
var bitcoinGetAddressesRequestSchema = createRequestSchema({
  paramsSchema: bitcoinGetAddressesParamsSchema,
  method: bitcoinMethods.getAddresses
});
var getNetworkResultSchema = object({
  bitcoin: object({ name: string2() }),
  stacks: object({ name: string2() }),
  spark: object({ name: string2() })
});
var bitcoinGetAddressesResultSchema = object({
  addresses: array2(addressSchema),
  network: getNetworkResultSchema
});
var bitcoinGetAddressesSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: bitcoinGetAddressesResultSchema,
  method: bitcoinMethods.getAddresses
});
var bitcoinGetAddressesV2ParamsSchema = object({
  purposes: array2(enum_(AddressPurpose)),
  message: optional(string2())
});
var bitcoinGetAddressesV2RequestSchema = createRequestSchema({
  paramsSchema: bitcoinGetAddressesV2ParamsSchema,
  method: bitcoinMethods.bitcoin_getAddressesV2
});
var walletAddNetworkParamsSchema = variant("chain", [
  object({
    chain: literal("bitcoin"),
    type: enum_(BitcoinNetworkType),
    name: string2(),
    rpcUrl: string2(),
    rpcFallbackUrl: optional(string2()),
    indexerUrl: optional(string2()),
    blockExplorerUrl: optional(string2()),
    switch: optional(boolean())
  }),
  object({
    chain: literal("stacks"),
    name: string2(),
    type: enum_(StacksNetworkType),
    rpcUrl: string2(),
    blockExplorerUrl: optional(string2()),
    switch: optional(boolean())
  }),
  object({
    chain: literal("starknet"),
    name: string2(),
    type: enum_(StarknetNetworkType),
    rpcUrl: string2(),
    blockExplorerUrl: optional(string2()),
    switch: optional(boolean())
  })
]);
var walletAddNetworkRequestSchema = createRequestSchema({
  paramsSchema: walletAddNetworkParamsSchema,
  method: walletMethods.wallet_addNetwork
});
var walletAddNetworkResultSchema = object({ id: string2() });
var walletAddNetworkSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: walletAddNetworkResultSchema,
  method: walletMethods.wallet_addNetwork
});
var accountActionsSchema = object({ read: optional(boolean()) });
var walletActionsSchema = object({ readNetwork: optional(boolean()) });
var accountPermissionSchema = object({
  type: literal("account"),
  resourceId: string2(),
  clientId: string2(),
  actions: accountActionsSchema
});
var walletPermissionSchema = object({
  type: literal("wallet"),
  resourceId: string2(),
  clientId: string2(),
  actions: walletActionsSchema
});
var permissionSchema = variant("type", [accountPermissionSchema, walletPermissionSchema]);
var permission = variant("type", [accountPermissionSchema, walletPermissionSchema]);
var permissionRequestParamsSchema = variant("type", [object({ ...omit(accountPermissionSchema, ["clientId"]).entries }), object({ ...omit(walletPermissionSchema, ["clientId"]).entries })]);
var walletAddNetworkV2ParamsSchema = object({
  network: networkConfigurationOptionsSchema,
  switch: optional(boolean(), false)
});
var walletAddNetworkV2RequestSchema = createRequestSchema({
  paramsSchema: walletAddNetworkV2ParamsSchema,
  method: walletMethods.wallet_addNetworkV2
});
var walletAddNetworkV2ResultSchema = networkConfigurationSchema;
var walletAddNetworkV2SuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: walletAddNetworkV2ResultSchema,
  method: walletMethods.wallet_addNetworkV2
});
var walletChangeNetworkParamsSchema = object({ name: enum_(BitcoinNetworkType) });
var walletChangeNetworkRequestSchema = createRequestSchema({
  paramsSchema: walletChangeNetworkParamsSchema,
  method: walletMethods.wallet_changeNetwork
});
var walletChangeNetworkResultSchema = nullish(null_());
var walletChangeNetworkSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: walletChangeNetworkResultSchema,
  method: walletMethods.wallet_changeNetwork
});
var walletConnectParamsSchema = nullish(object({
  permissions: optional(array2(permissionRequestParamsSchema)),
  addresses: optional(array2(enum_(AddressPurpose))),
  message: optional(pipe(string2(), maxLength(80, "The message must not exceed 80 characters."))),
  network: optional(picklist([
    "Mainnet",
    "Testnet",
    "Signet"
  ]))
}));
var walletConnectRequestSchema = createRequestSchema({
  paramsSchema: walletConnectParamsSchema,
  method: walletMethods.wallet_connect
});
var walletGetNetworkParamsSchema = nullish(null_());
var walletGetNetworkRequestSchema = createRequestSchema({
  paramsSchema: walletGetNetworkParamsSchema,
  method: walletMethods.wallet_getNetwork
});
var walletGetNetworkResultSchema = object({
  bitcoin: object({ name: enum_(BitcoinNetworkType) }),
  stacks: object({ name: enum_(StacksNetworkType) }),
  spark: object({ name: enum_(SparkNetworkType) })
});
var walletGetNetworkSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: walletGetNetworkResultSchema,
  method: walletMethods.wallet_getNetwork
});
var walletConnectResultSchema = object({
  id: string2(),
  addresses: array2(addressSchema),
  walletType: walletTypeSchema,
  network: walletGetNetworkResultSchema
});
var walletConnectSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: walletConnectResultSchema,
  method: walletMethods.wallet_connect
});
var walletConnectV2ParamsSchema = nullish(object({
  permissions: permissionRequestParamsSchema,
  addressPurposes: optional(array2(enum_(AddressPurpose))),
  message: optional(pipe(string2(), maxLength(80, "The message must not exceed 80 characters."))),
  networkId: optional(string2())
}));
var walletConnectV2RequestSchema = createRequestSchema({
  paramsSchema: walletConnectV2ParamsSchema,
  method: walletMethods.wallet_connectV2
});
var walletGetNetworksParamsSchema = nullish(null_());
var walletGetNetworksRequestSchema = createRequestSchema({
  paramsSchema: walletGetNetworksParamsSchema,
  method: walletMethods.wallet_getNetworks
});
var walletGetNetworksResultSchema = allResolvedNetworksSchema;
var walletGetNetworksSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: walletGetNetworksResultSchema,
  method: walletMethods.wallet_getNetworks
});
var walletConnectV2ResultSchema = object({
  accountId: string2(),
  addresses: array2(addressSchema),
  walletType: walletTypeSchema,
  networks: walletGetNetworksResultSchema
});
var walletConnectV2SuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: walletConnectV2ResultSchema,
  method: walletMethods.wallet_connectV2
});
var walletDisconnectParamsSchema = nullish(null_());
var walletDisconnectRequestSchema = createRequestSchema({
  paramsSchema: walletDisconnectParamsSchema,
  method: walletMethods.wallet_disconnect
});
var walletDisconnectResultSchema = nullish(null_());
var walletDisconnectSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: walletDisconnectResultSchema,
  method: walletMethods.wallet_disconnect
});
var walletGetAccountParamsSchema = nullish(null_());
var walletGetAccountRequestSchema = createRequestSchema({
  paramsSchema: walletGetAccountParamsSchema,
  method: walletMethods.wallet_getAccount
});
var walletGetAccountResultSchema = object({
  id: string2(),
  addresses: array2(addressSchema),
  walletType: walletTypeSchema,
  network: walletGetNetworkResultSchema
});
var walletGetAccountSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: walletGetAccountResultSchema,
  method: walletMethods.wallet_getAccount
});
var walletGetAccountV2ParamsSchema = nullish(null_());
var walletGetAccountV2RequestSchema = createRequestSchema({
  paramsSchema: walletGetAccountV2ParamsSchema,
  method: walletMethods.wallet_getAccountV2
});
var walletGetAccountV2ResultSchema = object({
  id: string2(),
  addresses: array2(addressSchema),
  walletType: walletTypeSchema,
  networks: walletGetNetworksResultSchema
});
var walletGetAccountV2SuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: walletGetAccountV2ResultSchema,
  method: walletMethods.wallet_getAccountV2
});
var walletGetCurrentPermissionsParamsSchema = nullish(null_());
var walletGetCurrentPermissionsRequestSchema = createRequestSchema({
  paramsSchema: walletGetCurrentPermissionsParamsSchema,
  method: walletMethods.wallet_getCurrentPermissions
});
var walletGetCurrentPermissionsResultSchema = array2(permission);
var walletGetCurrentPermissionsSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: walletGetCurrentPermissionsResultSchema,
  method: walletMethods.wallet_getCurrentPermissions
});
var walletGetWalletTypeParamsSchema = nullish(null_());
var walletGetWalletTypeRequestSchema = createRequestSchema({
  paramsSchema: walletGetWalletTypeParamsSchema,
  method: walletMethods.wallet_getWalletType
});
var walletGetWalletTypeResultSchema = walletTypeSchema;
var walletGetWalletTypeSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: walletGetWalletTypeResultSchema,
  method: walletMethods.wallet_getWalletType
});
var walletOpenParamsSchema = object({ path: optional(string2()) });
var walletOpenRequestSchema = createRequestSchema({
  paramsSchema: walletOpenParamsSchema,
  method: walletMethods.wallet_open
});
var walletOpenResultSchema = nullish(null_());
var walletOpenSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: walletOpenResultSchema,
  method: walletMethods.wallet_open
});
var walletOpenBridgeParamsSchema = object({
  fromAsset: string2(),
  toAsset: string2()
});
var walletOpenBridgeRequestSchema = createRequestSchema({
  paramsSchema: walletOpenBridgeParamsSchema,
  method: walletMethods.wallet_openBridge
});
var walletOpenBridgeResultSchema = nullish(null_());
var walletOpenBridgeSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: walletOpenBridgeResultSchema,
  method: walletMethods.wallet_openBridge
});
var walletOpenBuyParamsSchema = object({ asset: string2() });
var walletOpenBuyRequestSchema = createRequestSchema({
  paramsSchema: walletOpenBuyParamsSchema,
  method: walletMethods.wallet_openBuy
});
var walletOpenBuyResultSchema = nullish(null_());
var walletOpenBuySuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: walletOpenBuyResultSchema,
  method: walletMethods.wallet_openBuy
});
var walletOpenReceiveParamsSchema = object({ address: string2() });
var walletOpenReceiveRequestSchema = createRequestSchema({
  paramsSchema: walletOpenReceiveParamsSchema,
  method: walletMethods.wallet_openReceive
});
var walletOpenReceiveResultSchema = addressSchema;
var walletOpenReceiveSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: walletOpenReceiveResultSchema,
  method: walletMethods.wallet_openReceive
});
var walletRenouncePermissionsParamsSchema = nullish(null_());
var walletRenouncePermissionsRequestSchema = createRequestSchema({
  paramsSchema: walletRenouncePermissionsParamsSchema,
  method: walletMethods.wallet_renouncePermissions
});
var walletRenouncePermissionsResultSchema = nullish(null_());
var walletRenouncePermissionsSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: walletRenouncePermissionsResultSchema,
  method: walletMethods.wallet_renouncePermissions
});
var walletRequestPermissionsParamsSchema = nullish(array2(permissionRequestParamsSchema));
var walletRequestPermissionsRequestSchema = createRequestSchema({
  paramsSchema: walletRequestPermissionsParamsSchema,
  method: walletMethods.wallet_requestPermissions
});
var walletRequestPermissionsResultSchema = literal(true);
var walletRequestPermissionsSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: walletRequestPermissionsResultSchema,
  method: walletMethods.wallet_requestPermissions
});
var walletSwitchNetworkParamsSchema = variant("selector", [object({
  selector: literal("id"),
  id: string2()
})]);
var walletSwitchNetworkRequestSchema = createRequestSchema({
  paramsSchema: walletSwitchNetworkParamsSchema,
  method: walletMethods.wallet_switchNetwork
});
var walletSwitchNetworkResultSchema = nullish(null_());
var walletSwitchNetworkSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: walletSwitchNetworkResultSchema,
  method: walletMethods.wallet_switchNetwork
});
var walletRequestSchema = variant("method", [
  walletAddNetworkRequestSchema,
  walletAddNetworkV2RequestSchema,
  walletChangeNetworkRequestSchema,
  walletConnectRequestSchema,
  walletConnectV2RequestSchema,
  walletDisconnectRequestSchema,
  walletGetAccountRequestSchema,
  walletGetAccountV2RequestSchema,
  walletGetCurrentPermissionsRequestSchema,
  walletGetNetworkRequestSchema,
  walletGetNetworksRequestSchema,
  walletGetWalletTypeRequestSchema,
  walletOpenRequestSchema,
  walletOpenBridgeRequestSchema,
  walletOpenBuyRequestSchema,
  walletOpenReceiveRequestSchema,
  walletRenouncePermissionsRequestSchema,
  walletRequestPermissionsRequestSchema,
  walletSwitchNetworkRequestSchema
]);
var walletSuccessResponseSchema = variant("~sats-connect-method", [
  walletAddNetworkSuccessResponseSchema,
  walletAddNetworkV2SuccessResponseSchema,
  walletChangeNetworkSuccessResponseSchema,
  walletConnectSuccessResponseSchema,
  walletConnectV2SuccessResponseSchema,
  walletDisconnectSuccessResponseSchema,
  walletGetAccountSuccessResponseSchema,
  walletGetAccountV2SuccessResponseSchema,
  walletGetCurrentPermissionsSuccessResponseSchema,
  walletGetNetworksSuccessResponseSchema,
  walletGetNetworkSuccessResponseSchema,
  walletGetWalletTypeSuccessResponseSchema,
  walletOpenSuccessResponseSchema,
  walletOpenBridgeSuccessResponseSchema,
  walletOpenBuySuccessResponseSchema,
  walletOpenReceiveSuccessResponseSchema,
  walletRenouncePermissionsSuccessResponseSchema,
  walletRequestPermissionsSuccessResponseSchema,
  walletSwitchNetworkSuccessResponseSchema
]);
var bitcoinGetAddressesV2ResultSchema = object({
  addresses: array2(addressSchema),
  networks: allResolvedNetworksSchema
});
var bitcoinGetAddressesV2SuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: bitcoinGetAddressesV2ResultSchema,
  method: bitcoinMethods.bitcoin_getAddressesV2
});
var bitcoinGetBalanceParamsSchema = nullish(null_());
var bitcoinGetBalanceRequestSchema = createRequestSchema({
  paramsSchema: bitcoinGetBalanceParamsSchema,
  method: bitcoinMethods.getBalance
});
var balanceResultSchema = object({
  confirmed: string2(),
  unconfirmed: string2(),
  total: string2()
});
var bitcoinGetBalanceResultSchema = balanceResultSchema;
var bitcoinGetBalanceSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: bitcoinGetBalanceResultSchema,
  method: bitcoinMethods.getBalance
});
var bitcoinGetBalanceV2ParamsSchema = nullish(null_());
var bitcoinGetBalanceV2RequestSchema = createRequestSchema({
  paramsSchema: bitcoinGetBalanceV2ParamsSchema,
  method: bitcoinMethods.bitcoin_getBalanceV2
});
var bitcoinGetBalanceV2ResultSchema = balanceResultSchema;
var bitcoinGetBalanceV2SuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: bitcoinGetBalanceV2ResultSchema,
  method: bitcoinMethods.bitcoin_getBalanceV2
});
var bitcoinGetInfoParamsSchema = nullish(null_());
var bitcoinGetInfoRequestSchema = createRequestSchema({
  paramsSchema: bitcoinGetInfoParamsSchema,
  method: bitcoinMethods.getInfo
});
var bitcoinGetInfoResultSchema = object({
  version: string2(),
  platform: optional(enum_(ProviderPlatform)),
  methods: optional(array2(string2())),
  supports: array2(string2())
});
var bitcoinGetInfoSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: bitcoinGetInfoResultSchema,
  method: bitcoinMethods.getInfo
});
var sendTransferParamsSchema = object({
  recipients: array2(object({
    address: string2(),
    amount: number()
  })),
  broadcast: optional(boolean())
});
var sendTransferResultSchema = object({
  txid: string2(),
  transaction: optional(string2())
});
var bitcoinSendTransferParamsSchema = sendTransferParamsSchema;
var bitcoinSendTransferRequestSchema = createRequestSchema({
  paramsSchema: bitcoinSendTransferParamsSchema,
  method: bitcoinMethods.sendTransfer
});
var bitcoinSendTransferResultSchema = sendTransferResultSchema;
var bitcoinSendTransferSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: bitcoinSendTransferResultSchema,
  method: bitcoinMethods.sendTransfer
});
var bitcoinSendTransferV2ParamsSchema = sendTransferParamsSchema;
var bitcoinSendTransferV2RequestSchema = createRequestSchema({
  paramsSchema: bitcoinSendTransferV2ParamsSchema,
  method: bitcoinMethods.bitcoin_sendTransferV2
});
var bitcoinSendTransferV2ResultSchema = sendTransferResultSchema;
var bitcoinSendTransferV2SuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: bitcoinSendTransferV2ResultSchema,
  method: bitcoinMethods.bitcoin_sendTransferV2
});
var signMessageParamsSchema = object({
  address: string2(),
  message: string2(),
  protocol: optional(enum_(MessageSigningProtocols))
});
var signMessageResultSchema = object({
  signature: string2(),
  messageHash: string2(),
  address: string2(),
  protocol: enum_(MessageSigningProtocols)
});
var bitcoinSignMessageParamsSchema = signMessageParamsSchema;
var bitcoinSignMessageRequestSchema = createRequestSchema({
  paramsSchema: bitcoinSignMessageParamsSchema,
  method: bitcoinMethods.signMessage
});
var bitcoinSignMessageResultSchema = signMessageResultSchema;
var bitcoinSignMessageSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: bitcoinSignMessageResultSchema,
  method: bitcoinMethods.signMessage
});
var bitcoinSignMessageV2ParamsSchema = signMessageParamsSchema;
var bitcoinSignMessageV2RequestSchema = createRequestSchema({
  paramsSchema: bitcoinSignMessageV2ParamsSchema,
  method: bitcoinMethods.bitcoin_signMessageV2
});
var bitcoinSignMessageV2ResultSchema = signMessageResultSchema;
var bitcoinSignMessageV2SuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: bitcoinSignMessageV2ResultSchema,
  method: bitcoinMethods.bitcoin_signMessageV2
});
var signMultipleMessagesParamsSchema = array2(signMessageParamsSchema);
var signMultipleMessagesResultSchema = array2(object({
  ...signMessageResultSchema.entries,
  message: string2()
}));
var bitcoinSignMultipleMessagesParamsSchema = signMultipleMessagesParamsSchema;
var bitcoinSignMultipleMessagesRequestSchema = createRequestSchema({
  paramsSchema: bitcoinSignMultipleMessagesParamsSchema,
  method: bitcoinMethods.signMultipleMessages
});
var bitcoinSignMultipleMessagesResultSchema = signMultipleMessagesResultSchema;
var bitcoinSignMultipleMessagesSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: bitcoinSignMultipleMessagesResultSchema,
  method: bitcoinMethods.signMultipleMessages
});
var bitcoinSignMultipleMessagesV2ParamsSchema = signMultipleMessagesParamsSchema;
var bitcoinSignMultipleMessagesV2RequestSchema = createRequestSchema({
  paramsSchema: bitcoinSignMultipleMessagesV2ParamsSchema,
  method: bitcoinMethods.bitcoin_signMultipleMessagesV2
});
var bitcoinSignMultipleMessagesV2ResultSchema = signMultipleMessagesResultSchema;
var bitcoinSignMultipleMessagesV2SuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: bitcoinSignMultipleMessagesV2ResultSchema,
  method: bitcoinMethods.bitcoin_signMultipleMessagesV2
});
var signPsbtParamsSchema = object({
  psbt: string2(),
  signInputs: optional(record(string2(), array2(number()))),
  broadcast: optional(boolean(), false)
});
var signPsbtResultSchema = object({
  psbt: string2(),
  txid: optional(string2())
});
var bitcoinSignPsbtParamsSchema = signPsbtParamsSchema;
var bitcoinSignPsbtRequestSchema = createRequestSchema({
  paramsSchema: bitcoinSignPsbtParamsSchema,
  method: bitcoinMethods.signPsbt
});
var bitcoinSignPsbtResultSchema = signPsbtResultSchema;
var bitcoinSignPsbtSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: bitcoinSignPsbtResultSchema,
  method: bitcoinMethods.signPsbt
});
var bitcoinSignPsbtV2ParamsSchema = signPsbtParamsSchema;
var bitcoinSignPsbtV2RequestSchema = createRequestSchema({
  paramsSchema: bitcoinSignPsbtV2ParamsSchema,
  method: bitcoinMethods.bitcoin_signPsbtV2
});
var bitcoinSignPsbtV2ResultSchema = signPsbtResultSchema;
var bitcoinSignPsbtV2SuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: bitcoinSignPsbtV2ResultSchema,
  method: bitcoinMethods.bitcoin_signPsbtV2
});
var bitcoinRequestSchema = variant("method", [
  bitcoinGetAccountsRequestSchema,
  bitcoinGetAddressesRequestSchema,
  bitcoinGetAddressesV2RequestSchema,
  bitcoinGetBalanceRequestSchema,
  bitcoinGetBalanceV2RequestSchema,
  bitcoinGetInfoRequestSchema,
  bitcoinSendTransferRequestSchema,
  bitcoinSendTransferV2RequestSchema,
  bitcoinSignMessageRequestSchema,
  bitcoinSignMessageV2RequestSchema,
  bitcoinSignMultipleMessagesRequestSchema,
  bitcoinSignMultipleMessagesV2RequestSchema,
  bitcoinSignPsbtRequestSchema,
  bitcoinSignPsbtV2RequestSchema
]);
var bitcoinSuccessResponseSchema = variant("~sats-connect-method", [
  bitcoinGetAccountsSuccessResponseSchema,
  bitcoinGetAddressesSuccessResponseSchema,
  bitcoinGetAddressesV2SuccessResponseSchema,
  bitcoinGetBalanceSuccessResponseSchema,
  bitcoinGetBalanceV2SuccessResponseSchema,
  bitcoinGetInfoSuccessResponseSchema,
  bitcoinSendTransferSuccessResponseSchema,
  bitcoinSendTransferV2SuccessResponseSchema,
  bitcoinSignMessageSuccessResponseSchema,
  bitcoinSignMessageV2SuccessResponseSchema,
  bitcoinSignMultipleMessagesSuccessResponseSchema,
  bitcoinSignMultipleMessagesV2SuccessResponseSchema,
  bitcoinSignPsbtSuccessResponseSchema,
  bitcoinSignPsbtV2SuccessResponseSchema
]);
var ordinalsGetInscriptionsParamsSchema = object({
  offset: number(),
  limit: number()
});
var ordinalsGetInscriptionsRequestSchema = createRequestSchema({
  paramsSchema: ordinalsGetInscriptionsParamsSchema,
  method: ordinalsMethods.ord_getInscriptions
});
var ordinalsGetInscriptionsResultSchema = object({
  total: number(),
  limit: number(),
  offset: number(),
  inscriptions: array2(object({
    inscriptionId: string2(),
    inscriptionNumber: string2(),
    address: string2(),
    collectionName: optional(string2()),
    postage: string2(),
    contentLength: string2(),
    contentType: string2(),
    timestamp: number(),
    offset: number(),
    genesisTransaction: string2(),
    output: string2()
  }))
});
var ordinalsGetInscriptionsSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: ordinalsGetInscriptionsResultSchema,
  method: ordinalsMethods.ord_getInscriptions
});
var ordinalsSendInscriptionsParamsSchema = object({ transfers: array2(object({
  address: string2(),
  inscriptionId: string2()
})) });
var ordinalsSendInscriptionsRequestSchema = createRequestSchema({
  paramsSchema: ordinalsSendInscriptionsParamsSchema,
  method: ordinalsMethods.ord_sendInscriptions
});
var ordinalsSendInscriptionsResultSchema = object({ txid: string2() });
var ordinalsSendInscriptionsSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: ordinalsSendInscriptionsResultSchema,
  method: ordinalsMethods.ord_sendInscriptions
});
var ordinalsRequestSchema = variant("method", [ordinalsGetInscriptionsRequestSchema, ordinalsSendInscriptionsRequestSchema]);
var ordinalsSuccessResponseSchema = variant("~sats-connect-method", [ordinalsGetInscriptionsSuccessResponseSchema, ordinalsSendInscriptionsSuccessResponseSchema]);
var etchTermsSchema$1 = object({
  amount: optional(string2()),
  cap: optional(string2()),
  heightStart: optional(string2()),
  heightEnd: optional(string2()),
  offsetStart: optional(string2()),
  offsetEnd: optional(string2())
});
var inscriptionDetailsSchema$1 = object({
  contentType: string2(),
  contentBase64: string2()
});
var runesEstimateEtchParamsSchema = object({
  runeName: string2(),
  divisibility: optional(number()),
  symbol: optional(string2()),
  premine: optional(string2()),
  isMintable: boolean(),
  terms: optional(etchTermsSchema$1),
  inscriptionDetails: optional(inscriptionDetailsSchema$1),
  delegateInscriptionId: optional(string2()),
  destinationAddress: string2(),
  feeRate: number(),
  appServiceFee: optional(number()),
  appServiceFeeAddress: optional(string2()),
  network: optional(enum_(BitcoinNetworkType))
});
var runesEstimateEtchRequestSchema = createRequestSchema({
  paramsSchema: runesEstimateEtchParamsSchema,
  method: runesMethods.runes_estimateEtch
});
var runesEstimateEtchResultSchema = object({
  totalSize: number(),
  totalCost: number(),
  costBreakdown: object({
    postage: number(),
    networkFee: number(),
    serviceFee: number(),
    appServiceFee: number()
  })
});
var runesEstimateEtchSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: runesEstimateEtchResultSchema,
  method: runesMethods.runes_estimateEtch
});
var runesEstimateMintParamsSchema = object({
  runeName: string2(),
  repeats: number(),
  destinationAddress: string2(),
  feeRate: number(),
  appServiceFee: optional(number()),
  appServiceFeeAddress: optional(string2()),
  network: optional(enum_(BitcoinNetworkType))
});
var runesEstimateMintRequestSchema = createRequestSchema({
  paramsSchema: runesEstimateMintParamsSchema,
  method: runesMethods.runes_estimateMint
});
var runesEstimateMintResultSchema = object({
  totalSize: number(),
  totalCost: number(),
  costBreakdown: object({
    postage: number(),
    networkFee: number(),
    serviceFee: number(),
    appServiceFee: number()
  })
});
var runesEstimateMintSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: runesEstimateMintResultSchema,
  method: runesMethods.runes_estimateMint
});
var runesEstimateRbfOrderParamsSchema = object({
  orderId: string2(),
  newFeeRate: number(),
  network: optional(enum_(BitcoinNetworkType))
});
var runesEstimateRbfOrderRequestSchema = createRequestSchema({
  paramsSchema: runesEstimateRbfOrderParamsSchema,
  method: runesMethods.runes_estimateRbfOrder
});
var runesEstimateRbfOrderResultSchema = object({
  rbfCost: number(),
  fundingAddress: string2()
});
var runesEstimateRbfOrderSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: runesEstimateRbfOrderResultSchema,
  method: runesMethods.runes_estimateRbfOrder
});
var etchTermsSchema = object({
  amount: optional(string2()),
  cap: optional(string2()),
  heightStart: optional(string2()),
  heightEnd: optional(string2()),
  offsetStart: optional(string2()),
  offsetEnd: optional(string2())
});
var inscriptionDetailsSchema = object({
  contentType: string2(),
  contentBase64: string2()
});
var runesEtchParamsSchema = object({
  runeName: string2(),
  divisibility: optional(number()),
  symbol: optional(string2()),
  premine: optional(string2()),
  isMintable: boolean(),
  terms: optional(etchTermsSchema),
  inscriptionDetails: optional(inscriptionDetailsSchema),
  delegateInscriptionId: optional(string2()),
  destinationAddress: string2(),
  refundAddress: string2(),
  feeRate: number(),
  appServiceFee: optional(number()),
  appServiceFeeAddress: optional(string2()),
  network: optional(enum_(BitcoinNetworkType))
});
var runesEtchRequestSchema = createRequestSchema({
  paramsSchema: runesEtchParamsSchema,
  method: runesMethods.runes_etch
});
var runesEtchResultSchema = object({
  orderId: string2(),
  fundTransactionId: string2(),
  fundingAddress: string2()
});
var runesEtchSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: runesEtchResultSchema,
  method: runesMethods.runes_etch
});
var runesGetBalanceParamsSchema = nullish(null_());
var runesGetBalanceRequestSchema = createRequestSchema({
  paramsSchema: runesGetBalanceParamsSchema,
  method: runesMethods.runes_getBalance
});
var runesGetBalanceResultSchema = object({ balances: array2(object({
  runeName: string2(),
  amount: string2(),
  divisibility: number(),
  symbol: string2(),
  inscriptionId: nullish(string2()),
  spendableBalance: string2()
})) });
var runesGetBalanceSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: runesGetBalanceResultSchema,
  method: runesMethods.runes_getBalance
});
var runesGetOrderParamsSchema = object({
  id: string2(),
  network: optional(enum_(BitcoinNetworkType))
});
var runesGetOrderRequestSchema = createRequestSchema({
  paramsSchema: runesGetOrderParamsSchema,
  method: runesMethods.runes_getOrder
});
var runesGetOrderResultSchema = object({
  id: string2(),
  orderType: union([literal("rune_mint"), literal("rune_etch")]),
  state: union([
    literal("new"),
    literal("pending"),
    literal("executing"),
    literal("complete"),
    literal("failed"),
    literal("refunded"),
    literal("stale")
  ]),
  fundingAddress: string2(),
  reason: optional(string2()),
  createdAt: string2()
});
var runesGetOrderSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: runesGetOrderResultSchema,
  method: runesMethods.runes_getOrder
});
var runesMintParamsSchema = object({
  appServiceFee: optional(number()),
  appServiceFeeAddress: optional(string2()),
  destinationAddress: string2(),
  feeRate: number(),
  refundAddress: string2(),
  repeats: number(),
  runeName: string2(),
  network: optional(enum_(BitcoinNetworkType))
});
var runesMintRequestSchema = createRequestSchema({
  paramsSchema: runesMintParamsSchema,
  method: runesMethods.runes_mint
});
var runesMintResultSchema = object({
  orderId: string2(),
  fundTransactionId: string2(),
  fundingAddress: string2()
});
var runesMintSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: runesMintResultSchema,
  method: runesMethods.runes_mint
});
var runesRbfOrderParamsSchema = object({
  orderId: string2(),
  newFeeRate: number(),
  network: optional(enum_(BitcoinNetworkType))
});
var runesRbfOrderRequestSchema = createRequestSchema({
  paramsSchema: runesRbfOrderParamsSchema,
  method: runesMethods.runes_rbfOrder
});
var runesRbfOrderResultSchema = object({
  orderId: string2(),
  fundRBFTransactionId: string2(),
  fundingAddress: string2()
});
var runesRbfOrderSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: runesRbfOrderResultSchema,
  method: runesMethods.runes_rbfOrder
});
var runesTransferParamsSchema = object({
  recipients: array2(object({
    runeName: string2(),
    amount: string2(),
    address: string2()
  })),
  network: optional(enum_(BitcoinNetworkType))
});
var runesTransferRequestSchema = createRequestSchema({
  paramsSchema: runesTransferParamsSchema,
  method: runesMethods.runes_transfer
});
var runesTransferResultSchema = object({ txid: string2() });
var runesTransferSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: runesTransferResultSchema,
  method: runesMethods.runes_transfer
});
var runesRequestSchema = variant("method", [
  runesEstimateEtchRequestSchema,
  runesEstimateMintRequestSchema,
  runesEstimateRbfOrderRequestSchema,
  runesEtchRequestSchema,
  runesGetBalanceRequestSchema,
  runesGetOrderRequestSchema,
  runesMintRequestSchema,
  runesRbfOrderRequestSchema,
  runesTransferRequestSchema
]);
var runesSuccessResponseSchema = variant("~sats-connect-method", [
  runesEstimateEtchSuccessResponseSchema,
  runesEstimateMintSuccessResponseSchema,
  runesEstimateRbfOrderSuccessResponseSchema,
  runesEtchSuccessResponseSchema,
  runesGetBalanceSuccessResponseSchema,
  runesGetOrderSuccessResponseSchema,
  runesMintSuccessResponseSchema,
  runesRbfOrderSuccessResponseSchema,
  runesTransferSuccessResponseSchema
]);
var sparkFlashnetClawbackFundsParamsSchema = object({
  sparkTransferId: string2(),
  lpIdentityPublicKey: string2()
});
var sparkFlashnetClawbackFundsRequestSchema = createRequestSchema({
  paramsSchema: sparkFlashnetClawbackFundsParamsSchema,
  method: sparkMethods.spark_flashnet_clawbackFunds
});
var sparkFlashnetClawbackFundsResultSchema = object({
  requestId: string2(),
  accepted: boolean(),
  internalRequestId: optional(string2()),
  sparkStatusTrackingId: optional(string2()),
  error: optional(string2())
});
var sparkFlashnetClawbackFundsSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: sparkFlashnetClawbackFundsResultSchema,
  method: sparkMethods.spark_flashnet_clawbackFunds
});
var sparkFlashnetExecuteRouteSwapParamsSchema = object({
  hops: array2(object({
    poolId: string2(),
    assetInAddress: string2(),
    assetOutAddress: string2(),
    hopIntegratorFeeRateBps: optional(number())
  })),
  initialAssetAddress: string2(),
  inputAmount: string2(),
  maxRouteSlippageBps: string2(),
  minAmountOut: optional(string2()),
  integratorFeeRateBps: optional(number()),
  integratorPublicKey: optional(string2())
});
var sparkFlashnetExecuteRouteSwapRequestSchema = createRequestSchema({
  paramsSchema: sparkFlashnetExecuteRouteSwapParamsSchema,
  method: sparkMethods.spark_flashnet_executeRouteSwap
});
var sparkFlashnetExecuteRouteSwapResultSchema = object({
  requestId: string2(),
  accepted: boolean(),
  outputAmount: string2(),
  executionPrice: string2(),
  finalOutboundTransferId: string2(),
  error: optional(string2())
});
var sparkFlashnetExecuteRouteSwapSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: sparkFlashnetExecuteRouteSwapResultSchema,
  method: sparkMethods.spark_flashnet_executeRouteSwap
});
var sparkFlashnetExecuteSwapParamsSchema = object({
  poolId: string2(),
  assetInAddress: string2(),
  assetOutAddress: string2(),
  amountIn: string2(),
  maxSlippageBps: number(),
  minAmountOut: optional(string2()),
  integratorFeeRateBps: optional(number()),
  integratorPublicKey: optional(string2())
});
var sparkFlashnetExecuteSwapRequestSchema = createRequestSchema({
  paramsSchema: sparkFlashnetExecuteSwapParamsSchema,
  method: sparkMethods.spark_flashnet_executeSwap
});
var sparkFlashnetExecuteSwapResultSchema = object({
  requestId: string2(),
  accepted: boolean(),
  amountOut: optional(string2()),
  feeAmount: optional(string2()),
  executionPrice: optional(string2()),
  assetOutAddress: optional(string2()),
  assetInAddress: optional(string2()),
  outboundTransferId: optional(string2()),
  error: optional(string2())
});
var sparkFlashnetExecuteSwapSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: sparkFlashnetExecuteSwapResultSchema,
  method: sparkMethods.spark_flashnet_executeSwap
});
var sparkGetClawbackEligibleTransfersParamsSchema = nullish(null_());
var sparkGetClawbackEligibleTransfersRequestSchema = createRequestSchema({
  paramsSchema: sparkGetClawbackEligibleTransfersParamsSchema,
  method: sparkMethods.spark_flashnet_getClawbackEligibleTransfers
});
var sparkGetClawbackEligibleTransfersResultSchema = object({ eligibleTransfers: array2(object({
  txId: string2(),
  createdAt: string2(),
  lpIdentityPublicKey: string2()
})) });
var sparkGetClawbackEligibleTransfersSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: sparkGetClawbackEligibleTransfersResultSchema,
  method: sparkMethods.spark_flashnet_getClawbackEligibleTransfers
});
var sparkFlashnetGetJwtParamsSchema = null_();
var sparkFlashnetGetJwtRequestSchema = createRequestSchema({
  paramsSchema: sparkFlashnetGetJwtParamsSchema,
  method: sparkMethods.spark_flashnet_getJwt
});
var sparkFlashnetGetJwtResultSchema = object({ jwt: string2() });
var sparkFlashnetGetJwtSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: sparkFlashnetGetJwtResultSchema,
  method: sparkMethods.spark_flashnet_getJwt
});
var sparkFlashnetAddLiquidityIntentSchema = object({
  type: literal("addLiquidity"),
  data: object({
    userPublicKey: string2(),
    poolId: string2(),
    assetAAmount: string2(),
    assetBAmount: string2(),
    assetAMinAmountIn: string2(),
    assetBMinAmountIn: string2(),
    assetATransferId: string2(),
    assetBTransferId: string2(),
    nonce: string2()
  })
});
var sparkFlashnetClawbackIntentSchema = object({
  type: literal("clawback"),
  data: object({
    senderPublicKey: string2(),
    sparkTransferId: string2(),
    lpIdentityPublicKey: string2(),
    nonce: string2()
  })
});
var sparkFlashnetConfirmInitialDepositIntentSchema = object({
  type: literal("confirmInitialDeposit"),
  data: object({
    poolId: string2(),
    assetASparkTransferId: string2(),
    poolOwnerPublicKey: string2(),
    nonce: string2()
  })
});
var sparkFlashnetCreateConstantProductPoolIntentSchema = object({
  type: literal("createConstantProductPool"),
  data: object({
    poolOwnerPublicKey: string2(),
    assetAAddress: string2(),
    assetBAddress: string2(),
    lpFeeRateBps: union([number(), string2()]),
    totalHostFeeRateBps: union([number(), string2()]),
    nonce: string2()
  })
});
var sparkFlashnetCreateSingleSidedPoolIntentSchema = object({
  type: literal("createSingleSidedPool"),
  data: object({
    assetAAddress: string2(),
    assetBAddress: string2(),
    assetAInitialReserve: string2(),
    virtualReserveA: union([number(), string2()]),
    virtualReserveB: union([number(), string2()]),
    threshold: union([number(), string2()]),
    lpFeeRateBps: union([number(), string2()]),
    totalHostFeeRateBps: union([number(), string2()]),
    poolOwnerPublicKey: string2(),
    nonce: string2()
  })
});
var sparkFlashnetRemoveLiquidityIntentSchema = object({
  type: literal("removeLiquidity"),
  data: object({
    userPublicKey: string2(),
    poolId: string2(),
    lpTokensToRemove: string2(),
    nonce: string2()
  })
});
var sparkFlashnetRouteSwapIntentSchema = object({
  type: literal("executeRouteSwap"),
  data: object({
    userPublicKey: string2(),
    initialSparkTransferId: string2(),
    hops: array2(object({
      poolId: string2(),
      inputAssetAddress: string2(),
      outputAssetAddress: string2(),
      hopIntegratorFeeRateBps: optional(union([number(), string2()]))
    })),
    inputAmount: string2(),
    maxRouteSlippageBps: union([number(), string2()]),
    minAmountOut: string2(),
    defaultIntegratorFeeRateBps: optional(union([number(), string2()])),
    nonce: string2()
  })
});
var sparkFlashnetSwapIntentSchema = object({
  type: literal("executeSwap"),
  data: object({
    userPublicKey: string2(),
    poolId: string2(),
    transferId: string2(),
    assetInAddress: string2(),
    assetOutAddress: string2(),
    amountIn: string2(),
    maxSlippageBps: union([number(), string2()]),
    minAmountOut: string2(),
    totalIntegratorFeeRateBps: optional(union([number(), string2()])),
    nonce: string2()
  })
});
var sparkFlashnetSignIntentParamsSchema = union([
  sparkFlashnetSwapIntentSchema,
  sparkFlashnetRouteSwapIntentSchema,
  sparkFlashnetAddLiquidityIntentSchema,
  sparkFlashnetClawbackIntentSchema,
  sparkFlashnetConfirmInitialDepositIntentSchema,
  sparkFlashnetCreateConstantProductPoolIntentSchema,
  sparkFlashnetCreateSingleSidedPoolIntentSchema,
  sparkFlashnetRemoveLiquidityIntentSchema
]);
var sparkFlashnetSignIntentRequestSchema = createRequestSchema({
  paramsSchema: sparkFlashnetSignIntentParamsSchema,
  method: sparkMethods.spark_flashnet_signIntent
});
var sparkFlashnetSignIntentResultSchema = object({ signature: string2() });
var sparkFlashnetSignIntentSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: sparkFlashnetSignIntentResultSchema,
  method: sparkMethods.spark_flashnet_signIntent
});
var sparkFlashnetSignStructuredMessageParamsSchema = object({ message: string2() });
var sparkFlashnetSignStructuredMessageRequestSchema = createRequestSchema({
  paramsSchema: sparkFlashnetSignStructuredMessageParamsSchema,
  method: sparkMethods.spark_flashnet_signStructuredMessage
});
var sparkFlashnetSignStructuredMessageResultSchema = object({
  message: string2(),
  signature: string2()
});
var sparkFlashnetSignStructuredMessageSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: sparkFlashnetSignStructuredMessageResultSchema,
  method: sparkMethods.spark_flashnet_signStructuredMessage
});
var sparkGetAddressesParamsSchema = nullish(object({ message: optional(string2()) }));
var sparkGetAddressesRequestSchema = createRequestSchema({
  paramsSchema: sparkGetAddressesParamsSchema,
  method: sparkMethods.spark_getAddresses
});
var sparkGetAddressesResultSchema = object({
  addresses: array2(addressSchema),
  network: walletGetNetworkResultSchema
});
var sparkGetAddressesSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: sparkGetAddressesResultSchema,
  method: sparkMethods.spark_getAddresses
});
var sparkGetAddressesV2ParamsSchema = nullish(object({ message: optional(string2()) }));
var sparkGetAddressesV2RequestSchema = createRequestSchema({
  paramsSchema: sparkGetAddressesV2ParamsSchema,
  method: sparkMethods.spark_getAddressesV2
});
var sparkGetAddressesV2ResultSchema = object({
  addresses: array2(addressSchema),
  network: sparkNetworkConfigurationSchema
});
var sparkGetAddressesV2SuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: sparkGetAddressesV2ResultSchema,
  method: sparkMethods.spark_getAddressesV2
});
var sparkGetBalanceParamsSchema = nullish(null_());
var sparkGetBalanceRequestSchema = createRequestSchema({
  paramsSchema: sparkGetBalanceParamsSchema,
  method: sparkMethods.spark_getBalance
});
var sparkGetBalanceResultSchema = object({
  balance: string2(),
  tokenBalances: array2(object({
    balance: string2(),
    tokenMetadata: object({
      tokenIdentifier: string2(),
      tokenName: string2(),
      tokenTicker: string2(),
      decimals: number(),
      maxSupply: string2()
    })
  }))
});
var sparkGetBalanceSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: sparkGetBalanceResultSchema,
  method: sparkMethods.spark_getBalance
});
var sparkSignMessageParamsSchema = object({ message: string2() });
var sparkSignMessageRequestSchema = createRequestSchema({
  paramsSchema: sparkSignMessageParamsSchema,
  method: sparkMethods.spark_signMessage
});
var sparkSignMessageResultSchema = object({ signature: string2() });
var sparkSignMessageSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: sparkSignMessageResultSchema,
  method: sparkMethods.spark_signMessage
});
var sparkTransferParamsSchema = object({
  amountSats: union([number(), string2()]),
  receiverSparkAddress: string2()
});
var sparkTransferRequestSchema = createRequestSchema({
  paramsSchema: sparkTransferParamsSchema,
  method: sparkMethods.spark_transfer
});
var sparkTransferResultSchema = object({ id: string2() });
var sparkTransferSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: sparkTransferResultSchema,
  method: sparkMethods.spark_transfer
});
var sparkTransferTokenParamsSchema = object({
  tokenAmount: union([number(), string2()]),
  tokenIdentifier: string2(),
  receiverSparkAddress: string2()
});
var sparkTransferTokenRequestSchema = createRequestSchema({
  paramsSchema: sparkTransferTokenParamsSchema,
  method: sparkMethods.spark_transferToken
});
var sparkTransferTokenResultSchema = object({ id: string2() });
var sparkTransferTokenSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: sparkTransferTokenResultSchema,
  method: sparkMethods.spark_transferToken
});
var sparkRequestSchema = variant("method", [
  sparkGetAddressesRequestSchema,
  sparkGetAddressesV2RequestSchema,
  sparkGetBalanceRequestSchema,
  sparkTransferRequestSchema,
  sparkTransferTokenRequestSchema,
  sparkSignMessageRequestSchema,
  sparkFlashnetGetJwtRequestSchema,
  sparkFlashnetSignIntentRequestSchema,
  sparkFlashnetSignStructuredMessageRequestSchema,
  sparkFlashnetExecuteSwapRequestSchema,
  sparkFlashnetExecuteRouteSwapRequestSchema,
  sparkFlashnetClawbackFundsRequestSchema,
  sparkGetClawbackEligibleTransfersRequestSchema
]);
var sparkSuccessResponseSchema = variant("~sats-connect-method", [
  sparkGetAddressesSuccessResponseSchema,
  sparkGetAddressesV2SuccessResponseSchema,
  sparkGetBalanceSuccessResponseSchema,
  sparkTransferSuccessResponseSchema,
  sparkTransferTokenSuccessResponseSchema,
  sparkSignMessageSuccessResponseSchema,
  sparkFlashnetGetJwtSuccessResponseSchema,
  sparkFlashnetSignIntentSuccessResponseSchema,
  sparkFlashnetSignStructuredMessageSuccessResponseSchema,
  sparkFlashnetExecuteSwapSuccessResponseSchema,
  sparkFlashnetExecuteRouteSwapSuccessResponseSchema,
  sparkFlashnetClawbackFundsSuccessResponseSchema,
  sparkGetClawbackEligibleTransfersSuccessResponseSchema
]);
var stacksCallContractParamsSchema = object({
  contract: string2(),
  functionName: string2(),
  arguments: optional(array2(string2())),
  functionArgs: optional(array2(string2())),
  postConditions: optional(array2(string2())),
  postConditionMode: optional(union([literal("allow"), literal("deny")]))
});
var stacksCallContractRequestSchema = createRequestSchema({
  paramsSchema: stacksCallContractParamsSchema,
  method: stacksMethods.stx_callContract
});
var stacksCallContractResultSchema = object({
  txid: string2(),
  transaction: string2()
});
var stacksCallContractSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: stacksCallContractResultSchema,
  method: stacksMethods.stx_callContract
});
var stacksDeployContractParamsSchema = object({
  name: string2(),
  clarityCode: string2(),
  clarityVersion: optional(number()),
  postConditions: optional(array2(string2())),
  postConditionMode: optional(union([literal("allow"), literal("deny")]))
});
var stacksDeployContractRequestSchema = createRequestSchema({
  paramsSchema: stacksDeployContractParamsSchema,
  method: stacksMethods.stx_deployContract
});
var stacksDeployContractResultSchema = object({
  txid: string2(),
  transaction: string2()
});
var stacksDeployContractSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: stacksDeployContractResultSchema,
  method: stacksMethods.stx_deployContract
});
var stacksGetAccountsParamsSchema = nullish(null_());
var stacksGetAccountsRequestSchema = createRequestSchema({
  paramsSchema: stacksGetAccountsParamsSchema,
  method: stacksMethods.stx_getAccounts
});
var stacksLegacyAccountSchema = object({
  address: string2(),
  publicKey: string2(),
  gaiaHubUrl: string2(),
  gaiaAppKey: string2(),
  walletType: optional(picklist([
    "software",
    "ledger",
    "keystone"
  ]))
});
var stacksMultisigAccountSchema = strictObject({
  address: string2(),
  walletType: literal("multisig"),
  multisig: stacksMultisigSchema
});
var stacksAccountSchema = union([stacksLegacyAccountSchema, stacksMultisigAccountSchema]);
var stacksGetAccountsResultSchema = object({
  addresses: array2(stacksAccountSchema),
  network: walletGetNetworkResultSchema
});
var stacksGetAccountsSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: stacksGetAccountsResultSchema,
  method: stacksMethods.stx_getAccounts
});
var stacksGetAddressesParamsSchema = nullish(object({ message: optional(string2()) }));
var stacksGetAddressesRequestSchema = createRequestSchema({
  paramsSchema: stacksGetAddressesParamsSchema,
  method: stacksMethods.stx_getAddresses
});
var stacksGetAddressesResultSchema = object({
  addresses: array2(addressSchema),
  network: walletGetNetworkResultSchema
});
var stacksGetAddressesSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: stacksGetAddressesResultSchema,
  method: stacksMethods.stx_getAddresses
});
var stacksSignMessageParamsSchema = object({ message: string2() });
var stacksSignMessageRequestSchema = createRequestSchema({
  paramsSchema: stacksSignMessageParamsSchema,
  method: stacksMethods.stx_signMessage
});
var stacksSignMessageResultSchema = object({
  signature: string2(),
  publicKey: string2()
});
var stacksSignMessageSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: stacksSignMessageResultSchema,
  method: stacksMethods.stx_signMessage
});
var stacksSignStructuredMessageParamsSchema = object({
  domain: string2(),
  message: string2(),
  publicKey: optional(string2())
});
var stacksSignStructuredMessageRequestSchema = createRequestSchema({
  paramsSchema: stacksSignStructuredMessageParamsSchema,
  method: stacksMethods.stx_signStructuredMessage
});
var stacksSignStructuredMessageResultSchema = object({
  signature: string2(),
  publicKey: string2()
});
var stacksSignStructuredMessageSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: stacksSignStructuredMessageResultSchema,
  method: stacksMethods.stx_signStructuredMessage
});
var stacksSignTransactionParamsSchema = object({
  transaction: string2(),
  pubkey: optional(string2()),
  broadcast: optional(boolean())
});
var stacksSignTransactionRequestSchema = createRequestSchema({
  paramsSchema: stacksSignTransactionParamsSchema,
  method: stacksMethods.stx_signTransaction
});
var stacksSignTransactionResultSchema = object({ transaction: string2() });
var stacksSignTransactionSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: stacksSignTransactionResultSchema,
  method: stacksMethods.stx_signTransaction
});
var stacksSignTransactionsBroadcastErrorDataSchema = object({ transactions: array2(object({
  index: number(),
  transaction: string2(),
  status: picklist([
    "broadcast",
    "failed",
    "not_broadcast"
  ]),
  txid: optional(string2()),
  error: optional(string2())
})) });
var stacksSignTransactionsParamsSchema = object({
  transactions: pipe(array2(pipe(string2(), check(() => {
    return true;
  }, "Invalid hex-encoded Stacks transaction."))), minLength(1)),
  broadcast: optional(boolean(), true)
});
var stacksSignTransactionsRequestSchema = createRequestSchema({
  paramsSchema: stacksSignTransactionsParamsSchema,
  method: stacksMethods.stx_signTransactions
});
var stacksSignTransactionsResultSchema = object({
  transactions: array2(string2()),
  txids: optional(array2(string2()))
});
var stacksSignTransactionsSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: stacksSignTransactionsResultSchema,
  method: stacksMethods.stx_signTransactions
});
var stacksTransferStxParamsSchema = object({
  amount: union([number(), string2()]),
  recipient: string2(),
  memo: optional(string2()),
  version: optional(string2()),
  postConditionMode: optional(number()),
  postConditions: optional(array2(string2())),
  pubkey: optional(string2())
});
var stacksTransferStxRequestSchema = createRequestSchema({
  paramsSchema: stacksTransferStxParamsSchema,
  method: stacksMethods.stx_transferStx
});
var stacksTransferStxResultSchema = object({
  txid: string2(),
  transaction: string2()
});
var stacksTransferStxSuccessResponseSchema = createSuccessResponseSchema({
  resultSchema: stacksTransferStxResultSchema,
  method: stacksMethods.stx_transferStx
});
var stacksRequestSchema = variant("method", [
  stacksCallContractRequestSchema,
  stacksDeployContractRequestSchema,
  stacksGetAccountsRequestSchema,
  stacksGetAddressesRequestSchema,
  stacksSignMessageRequestSchema,
  stacksSignStructuredMessageRequestSchema,
  stacksSignTransactionRequestSchema,
  stacksSignTransactionsRequestSchema,
  stacksTransferStxRequestSchema
]);
var stacksSuccessResponseSchema = variant("~sats-connect-method", [
  stacksCallContractSuccessResponseSchema,
  stacksDeployContractSuccessResponseSchema,
  stacksGetAccountsSuccessResponseSchema,
  stacksGetAddressesSuccessResponseSchema,
  stacksSignMessageSuccessResponseSchema,
  stacksSignStructuredMessageSuccessResponseSchema,
  stacksSignTransactionSuccessResponseSchema,
  stacksSignTransactionsSuccessResponseSchema,
  stacksTransferStxSuccessResponseSchema
]);
var rpcRequestSchema = variant("method", [
  bitcoinRequestSchema,
  stacksRequestSchema,
  sparkRequestSchema,
  runesRequestSchema,
  ordinalsRequestSchema,
  walletRequestSchema
]);
var rpcSuccessResponseSchema = variant("~sats-connect-method", [
  bitcoinSuccessResponseSchema,
  stacksSuccessResponseSchema,
  sparkSuccessResponseSchema,
  runesSuccessResponseSchema,
  ordinalsSuccessResponseSchema,
  walletSuccessResponseSchema
]);
var cache = {};
var requestInternal = async (provider, method, params) => {
  const response = await provider.request(method, params);
  if (is(specErrorResponseSchema, response)) return {
    status: "error",
    error: response.error
  };
  if (is(specSuccessWithExtensionsResponseSchema, response)) return {
    status: "success",
    result: response.result
  };
  return {
    status: "error",
    error: {
      code: RpcErrorCode.INTERNAL_ERROR,
      message: "Received unknown response from provider.",
      data: response
    }
  };
};
var request = async (method, params, providerId) => {
  let provider = window.XverseProviders?.BitcoinProvider || window.BitcoinProvider;
  if (providerId) provider = await getProviderById(providerId);
  if (!provider) throw new Error("no wallet provider was found");
  if (!method) throw new Error("A wallet method is required");
  if (!cache.providerInfo) {
    const infoResult = await requestInternal(provider, "getInfo", null);
    if (infoResult.status === "success") cache.providerInfo = infoResult.result;
  }
  if (cache.providerInfo) {
    if (method === "getInfo") return {
      status: "success",
      result: cache.providerInfo
    };
    const sanitized = sanitizeRequest(method, params, cache.providerInfo);
    if (sanitized.overrideResponse) return sanitized.overrideResponse;
    method = sanitized.method;
    params = sanitized.params;
  }
  return requestInternal(provider, method, params);
};
var addListener = (...rawArgs) => {
  const [listenerInfo, providerId] = (() => {
    if (rawArgs.length === 1) return [rawArgs[0], void 0];
    if (rawArgs.length === 2) if (typeof rawArgs[1] === "function") return [{
      eventName: rawArgs[0],
      cb: rawArgs[1]
    }, void 0];
    else return rawArgs;
    if (rawArgs.length === 3) return [{
      eventName: rawArgs[0],
      cb: rawArgs[1]
    }, rawArgs[2]];
    throw new Error("Unexpected number of arguments. Expecting 2 (or 3 for legacy requests).", { cause: rawArgs });
  })();
  let provider = window.XverseProviders?.BitcoinProvider || window.BitcoinProvider;
  if (providerId) provider = getProviderById(providerId);
  if (!provider) throw new Error("no wallet provider was found");
  if (!provider.addListener) {
    console.error(`The wallet provider you are using does not support the addListener method. Please update your wallet provider.`);
    return () => {
    };
  }
  return provider.addListener(listenerInfo);
};
var XverseAdapter = class extends SatsConnectAdapter {
  id = DefaultAdaptersInfo.xverse.id;
  requestInternal = async (method, params) => {
    return request(method, params, this.id);
  };
  addListener = (listenerInfo) => {
    return addListener(listenerInfo, this.id);
  };
};
var BaseAdapter = class extends SatsConnectAdapter {
  id = "";
  constructor(providerId) {
    super();
    this.id = providerId;
  }
  requestInternal = async (method, params) => {
    return request(method, params, this.id);
  };
  addListener = (..._args) => {
    throw new Error("Method not supported for `BaseAdapter`.");
  };
};
var DefaultAdaptersInfo = {
  fordefi: {
    id: "FordefiProviders.UtxoProvider",
    name: "Fordefi",
    webUrl: "https://www.fordefi.com/",
    chromeWebStoreUrl: "https://chromewebstore.google.com/detail/fordefi/hcmehenccjdmfbojapcbcofkgdpbnlle",
    icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzEzNDk0XzY2MjU0KSI+CjxwYXRoIGQ9Ik0xMC44NzY5IDE1LjYzNzhIMS41VjE4LjM5OUMxLjUgMTkuODAxMyAyLjYzNDQ3IDIwLjkzOCA0LjAzMzkyIDIwLjkzOEg4LjI0OTkyTDEwLjg3NjkgMTUuNjM3OFoiIGZpbGw9IiM3OTk0RkYiLz4KPHBhdGggZD0iTTEuNSA5Ljc3NTUxSDE5LjA1MTZMMTcuMDEzOSAxMy44NzExSDEuNVY5Ljc3NTUxWiIgZmlsbD0iIzQ4NkRGRiIvPgo8cGF0aCBkPSJNNy42NTk5NiAzSDEuNTI0NDFWOC4wMDcwNEgyMi40NjEyVjNIMTYuMzI1NlY2LjczOTQ0SDE1LjA2MDZWM0g4LjkyNTAyVjYuNzM5NDRINy42NTk5NlYzWiIgZmlsbD0iIzVDRDFGQSIvPgo8L2c+CjxkZWZzPgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzEzNDk0XzY2MjU0Ij4KPHJlY3Qgd2lkdGg9IjIxIiBoZWlnaHQ9IjE4IiBmaWxsPSJ3aGl0ZSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMS41IDMpIi8+CjwvY2xpcFBhdGg+CjwvZGVmcz4KPC9zdmc+Cg=="
  },
  xverse: {
    id: "XverseProviders.BitcoinProvider",
    name: "Xverse",
    webUrl: "https://www.xverse.app/",
    googlePlayStoreUrl: "https://play.google.com/store/apps/details?id=com.secretkeylabs.xverse",
    iOSAppStoreUrl: "https://apps.apple.com/app/xverse-bitcoin-web3-wallet/id1552272513",
    chromeWebStoreUrl: "https://chromewebstore.google.com/detail/xverse-wallet/idnnbdplmphpflfnlkomgpfbpcgelopg",
    icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAyIiBoZWlnaHQ9IjEwMiIgdmlld0JveD0iMCAwIDEwMiAxMDIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGlkPSJJY29uX0FydCAoRWRpdCBNZSkiPgo8cmVjdCB3aWR0aD0iMTAyIiBoZWlnaHQ9IjEwMiIgZmlsbD0iIzE4MTgxOCIvPgo8ZyBpZD0iTG9nby9FbWJsZW0iIGNsaXAtcGF0aD0idXJsKCNjbGlwMF8yMF8xMjIzKSI+CjxwYXRoIGlkPSJWZWN0b3IiIGQ9Ik03NC42NTQyIDczLjg4ODNWNjUuMjMxMkM3NC42NTQyIDY0Ljg4OCA3NC41MTc3IDY0LjU2MDYgNzQuMjc0NSA2NC4zMTc0TDM3LjQzOTcgMjcuNDgyNUMzNy4xOTY1IDI3LjIzOTIgMzYuODY5MSAyNy4xMDI4IDM2LjUyNTggMjcuMTAyOEgyNy44NjlDMjcuNDQxNiAyNy4xMDI4IDI3LjA5MzggMjcuNDUwNiAyNy4wOTM4IDI3Ljg3OFYzNS45MjExQzI3LjA5MzggMzYuMjY0NCAyNy4yMzAyIDM2LjU5MTcgMjcuNDczNCAzNi44MzVMNDAuNjk1MiA1MC4wNTY3QzQwLjk5NzUgNTAuMzU5MSA0MC45OTc1IDUwLjg1MDEgNDAuNjk1MiA1MS4xNTI0TDI3LjMyMTEgNjQuNTI2NUMyNy4xNzU2IDY0LjY3MiAyNy4wOTM4IDY0Ljg2OTggMjcuMDkzOCA2NS4wNzQ0VjczLjg4ODNDMjcuMDkzOCA3NC4zMTUzIDI3LjQ0MTYgNzQuNjYzNSAyNy44NjkgNzQuNjYzNUg0Mi4zMzQyQzQyLjc2MTYgNzQuNjYzNSA0My4xMDk0IDc0LjMxNTMgNDMuMTA5NCA3My44ODgzVjY4LjY5NThDNDMuMTA5NCA2OC40OTEyIDQzLjE5MTIgNjguMjkzNSA0My4zMzY4IDY4LjE0NzlMNTAuNTExNCA2MC45NzMzQzUwLjgxMzggNjAuNjcwOSA1MS4zMDQ4IDYwLjY3MDkgNTEuNjA3MiA2MC45NzMzTDY0LjkxOTggNzQuMjg2MUM2NS4xNjMxIDc0LjUyOTMgNjUuNDkwNCA3NC42NjU4IDY1LjgzMzcgNzQuNjY1OEg3My44NzY3Qzc0LjMwNDIgNzQuNjY1OCA3NC42NTE5IDc0LjMxNzYgNzQuNjUxOSA3My44OTA2TDc0LjY1NDIgNzMuODg4M1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGlkPSJWZWN0b3JfMiIgZD0iTTU1LjM1OCAzOC41NjcySDYyLjYwMzFDNjMuMDMyOCAzOC41NjcyIDYzLjM4MjkgMzguOTE3MyA2My4zODI5IDM5LjM0NjlWNDYuNTkyMUM2My4zODI5IDQ3LjI4NzcgNjQuMjI0IDQ3LjYzNTUgNjQuNzE1MSA0Ny4xNDIyTDc0LjY1NDEgMzcuMTg3M0M3NC43OTk0IDM3LjA0MTggNzQuODgxNiAzNi44NDQgNzQuODgxNiAzNi42MzcxVjI3LjkxODlDNzQuODgxNiAyNy40ODkyIDc0LjUzMzQgMjcuMTM5MSA3NC4xMDE3IDI3LjEzOTFMNjUuMjUzOCAyNy4xMjc3QzY1LjA0NyAyNy4xMjc3IDY0Ljg0OTIgMjcuMjA5NiA2NC43MDE0IDI3LjM1NTFMNTQuODA1NiAzNy4yMzVDNTQuMzE0NSAzNy43MjYgNTQuNjYyMyAzOC41NjcyIDU1LjM1NTcgMzguNTY3Mkg1NS4zNThaIiBmaWxsPSIjRUU3QTMwIi8+CjwvZz4KPC9nPgo8ZGVmcz4KPGNsaXBQYXRoIGlkPSJjbGlwMF8yMF8xMjIzIj4KPHJlY3Qgd2lkdGg9IjQ3LjgxMjUiIGhlaWdodD0iNDcuODEyNSIgZmlsbD0id2hpdGUiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDI3LjA5MzggMjcuMDkzOCkiLz4KPC9jbGlwUGF0aD4KPC9kZWZzPgo8L3N2Zz4K"
  },
  unisat: {
    id: "unisat",
    name: "Unisat",
    webUrl: "https://unisat.io/",
    icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDE4MCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxODAiIGhlaWdodD0iMTgwIiBmaWxsPSJibGFjayIvPgo8ZyBjbGlwLXBhdGg9InVybCgjY2xpcDBfMTAwNTBfNDE3MSkiPgo8cGF0aCBkPSJNMTEzLjY2IDI5LjI4OTdMMTQzLjk3IDU5LjMwOTdDMTQ2LjU1IDYxLjg1OTcgMTQ3LjgyIDY0LjQzOTcgMTQ3Ljc4IDY3LjAzOTdDMTQ3Ljc0IDY5LjYzOTcgMTQ2LjYzIDcyLjAwOTcgMTQ0LjQ2IDc0LjE1OTdDMTQyLjE5IDc2LjQwOTcgMTM5Ljc0IDc3LjU0OTcgMTM3LjEyIDc3LjU5OTdDMTM0LjUgNzcuNjM5NyAxMzEuOSA3Ni4zNzk3IDEyOS4zMiA3My44Mjk3TDk4LjMxOTkgNDMuMTI5N0M5NC43OTk5IDM5LjYzOTcgOTEuMzk5OSAzNy4xNjk3IDg4LjEyOTkgMzUuNzE5N0M4NC44NTk5IDM0LjI2OTcgODEuNDE5OSAzNC4wMzk3IDc3LjgxOTkgMzUuMDM5N0M3NC4yMDk5IDM2LjAyOTcgNzAuMzM5OSAzOC41Nzk3IDY2LjE4OTkgNDIuNjc5N0M2MC40Njk5IDQ4LjM0OTcgNTcuNzM5OSA1My42Njk3IDU4LjAxOTkgNTguNjM5N0M1OC4yOTk5IDYzLjYwOTcgNjEuMTM5OSA2OC43Njk3IDY2LjUyOTkgNzQuMDk5N0w5Ny43Nzk5IDEwNS4wNkMxMDAuMzkgMTA3LjY0IDEwMS42NyAxMTAuMjIgMTAxLjYzIDExMi43OEMxMDEuNTkgMTE1LjM1IDEwMC40NyAxMTcuNzIgOTguMjU5OSAxMTkuOTFDOTYuMDU5OSAxMjIuMDkgOTMuNjI5OSAxMjMuMjMgOTAuOTg5OSAxMjMuMzJDODguMzQ5OSAxMjMuNDEgODUuNzE5OSAxMjIuMTYgODMuMTE5OSAxMTkuNThMNTIuODA5OSA4OS41NTk3QzQ3Ljg3OTkgODQuNjc5NyA0NC4zMTk5IDgwLjA1OTcgNDIuMTI5OSA3NS42OTk3QzM5LjkzOTkgNzEuMzM5NyAzOS4xMTk5IDY2LjQwOTcgMzkuNjg5OSA2MC45MDk3QzQwLjE5OTkgNTYuMTk5NyA0MS43MDk5IDUxLjYzOTcgNDQuMjI5OSA0Ny4yMTk3QzQ2LjczOTkgNDIuNzk5NyA1MC4zMzk5IDM4LjI3OTcgNTUuMDA5OSAzMy42NDk3QzYwLjU2OTkgMjguMTM5NyA2NS44Nzk5IDIzLjkxOTcgNzAuOTM5OSAyMC45Nzk3Qzc1Ljk4OTkgMTguMDM5NyA4MC44Nzk5IDE2LjQwOTcgODUuNTk5OSAxNi4wNjk3QzkwLjMyOTkgMTUuNzI5NyA5NC45ODk5IDE2LjY2OTcgOTkuNTk5OSAxOC44ODk3QzEwNC4yMSAyMS4xMDk3IDEwOC44OSAyNC41Njk3IDExMy42NSAyOS4yODk3SDExMy42NloiIGZpbGw9InVybCgjcGFpbnQwX2xpbmVhcl8xMDA1MF80MTcxKSIvPgo8cGF0aCBkPSJNNjYuMTA5OSAxNTAuNDJMMzUuODA5OSAxMjAuNEMzMy4yMjk5IDExNy44NCAzMS45NTk5IDExNS4yNyAzMS45OTk5IDExMi42N0MzMi4wMzk5IDExMC4wNyAzMy4xNDk5IDEwNy43IDM1LjMxOTkgMTA1LjU1QzM3LjU4OTkgMTAzLjMgNDAuMDM5OSAxMDIuMTYgNDIuNjU5OSAxMDIuMTFDNDUuMjc5OSAxMDIuMDcgNDcuODc5OSAxMDMuMzIgNTAuNDU5OSAxMDUuODhMODEuNDQ5OSAxMzYuNThDODQuOTc5OSAxNDAuMDcgODguMzY5OSAxNDIuNTQgOTEuNjM5OSAxNDMuOTlDOTQuOTA5OSAxNDUuNDQgOTguMzQ5OSAxNDUuNjYgMTAxLjk2IDE0NC42N0MxMDUuNTcgMTQzLjY4IDEwOS40NCAxNDEuMTMgMTEzLjU5IDEzNy4wMkMxMTkuMzEgMTMxLjM1IDEyMi4wNCAxMjYuMDMgMTIxLjc2IDEyMS4wNkMxMjEuNDggMTE2LjA5IDExOC42NCAxMTAuOTMgMTEzLjI1IDEwNS41OUw5Ni41OTk5IDg5LjI0MDFDOTMuOTg5OSA4Ni42NjAxIDkyLjcwOTkgODQuMDgwMSA5Mi43NDk5IDgxLjUyMDFDOTIuNzg5OSA3OC45NTAxIDkzLjkwOTkgNzYuNTgwMSA5Ni4xMTk5IDc0LjM5MDFDOTguMzE5OSA3Mi4yMTAxIDEwMC43NSA3MS4wNzAxIDEwMy4zOSA3MC45ODAxQzEwNi4wMyA3MC44OTAxIDEwOC42NiA3Mi4xNDAxIDExMS4yNiA3NC43MjAxTDEyNi45NiA5MC4xMzAxQzEzMS44OSA5NS4wMTAxIDEzNS40NSA5OS42MzAxIDEzNy42NCAxMDMuOTlDMTM5LjgzIDEwOC4zNSAxNDAuNjUgMTEzLjI4IDE0MC4wOCAxMTguNzhDMTM5LjU3IDEyMy40OSAxMzguMDYgMTI4LjA1IDEzNS41NCAxMzIuNDdDMTMzLjAzIDEzNi44OSAxMjkuNDMgMTQxLjQxIDEyNC43NiAxNDYuMDRDMTE5LjIgMTUxLjU1IDExMy44OSAxNTUuNzcgMTA4LjgzIDE1OC43MUMxMDMuNzcgMTYxLjY1IDk4Ljg3OTkgMTYzLjI5IDk0LjE0OTkgMTYzLjYzQzg5LjQxOTkgMTYzLjk3IDg0Ljc1OTkgMTYzLjAzIDgwLjE0OTkgMTYwLjgxQzc1LjUzOTkgMTU4LjU5IDcwLjg1OTkgMTU1LjEzIDY2LjA5OTkgMTUwLjQxTDY2LjEwOTkgMTUwLjQyWiIgZmlsbD0idXJsKCNwYWludDFfbGluZWFyXzEwMDUwXzQxNzEpIi8+CjxwYXRoIGQ9Ik04NS4wMDk5IDcyLjk1OTJDOTEuMTU2OCA3Mi45NTkyIDk2LjEzOTkgNjcuOTc2MSA5Ni4xMzk5IDYxLjgyOTJDOTYuMTM5OSA1NS42ODIzIDkxLjE1NjggNTAuNjk5MiA4NS4wMDk5IDUwLjY5OTJDNzguODYzIDUwLjY5OTIgNzMuODc5OSA1NS42ODIzIDczLjg3OTkgNjEuODI5MkM3My44Nzk5IDY3Ljk3NjEgNzguODYzIDcyLjk1OTIgODUuMDA5OSA3Mi45NTkyWiIgZmlsbD0idXJsKCNwYWludDJfcmFkaWFsXzEwMDUwXzQxNzEpIi8+CjwvZz4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhcl8xMDA1MF80MTcxIiB4MT0iMTM4Ljk4NSIgeTE9IjQ2Ljc3OTUiIHgyPSI0NS4wNTI5IiB5Mj0iODguNTIzMyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjMjAxQzFCIi8+CjxzdG9wIG9mZnNldD0iMC4zNiIgc3RvcC1jb2xvcj0iIzc3MzkwRCIvPgo8c3RvcCBvZmZzZXQ9IjAuNjciIHN0b3AtY29sb3I9IiNFQTgxMDEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjRjRCODUyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQxX2xpbmVhcl8xMDA1MF80MTcxIiB4MT0iNDMuMzgxMiIgeTE9IjEzNC4xNjciIHgyPSIxNTIuMjMxIiB5Mj0iMTAxLjc3MSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjMUYxRDFDIi8+CjxzdG9wIG9mZnNldD0iMC4zNyIgc3RvcC1jb2xvcj0iIzc3MzkwRCIvPgo8c3RvcCBvZmZzZXQ9IjAuNjciIHN0b3AtY29sb3I9IiNFQTgxMDEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjRjRGQjUyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxyYWRpYWxHcmFkaWVudCBpZD0icGFpbnQyX3JhZGlhbF8xMDA1MF80MTcxIiBjeD0iMCIgY3k9IjAiIHI9IjEiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiBncmFkaWVudFRyYW5zZm9ybT0idHJhbnNsYXRlKDg1LjAwOTkgNjEuODM5Mikgc2NhbGUoMTEuMTMpIj4KPHN0b3Agc3RvcC1jb2xvcj0iI0Y0Qjg1MiIvPgo8c3RvcCBvZmZzZXQ9IjAuMzMiIHN0b3AtY29sb3I9IiNFQTgxMDEiLz4KPHN0b3Agb2Zmc2V0PSIwLjY0IiBzdG9wLWNvbG9yPSIjNzczOTBEIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzIxMUMxRCIvPgo8L3JhZGlhbEdyYWRpZW50Pgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzEwMDUwXzQxNzEiPgo8cmVjdCB3aWR0aD0iMTE1Ljc3IiBoZWlnaHQ9IjE0Ny43IiBmaWxsPSJ3aGl0ZSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzIgMTYpIi8+CjwvY2xpcFBhdGg+CjwvZGVmcz4KPC9zdmc+Cg=="
  }
};
var defaultAdapters = {
  [DefaultAdaptersInfo.fordefi.id]: FordefiAdapter,
  [DefaultAdaptersInfo.xverse.id]: XverseAdapter,
  [DefaultAdaptersInfo.unisat.id]: UnisatAdapter
};

// wallet.js
var SIGNET = BitcoinNetworkType.Signet;
var UNISAT_ID = DefaultAdaptersInfo.unisat.id;
var NO_BROADCAST = /signing without broadcasting is not supported/i;
function listWallets(win = globalThis) {
  const defaults2 = Object.values(DefaultAdaptersInfo).map((info) => ({
    id: info.id,
    name: info.name,
    installed: Boolean(providerAt(win, info.id)),
    source: "sats-connect"
  }));
  const known = new Set(defaults2.map((w) => w.id));
  const extra = (win.btc_providers || []).filter((p) => p && p.id && !known.has(p.id)).map((p) => ({
    id: p.id,
    name: p.name || p.id,
    installed: Boolean(providerAt(win, p.id)),
    source: "btc_providers"
  }));
  return [...defaults2, ...extra];
}
function providerAt(win, id) {
  return String(id).split(".").reduce((acc, part) => acc?.[part], win);
}
function adapterFor(id) {
  const Ctor = defaultAdapters[id];
  return Ctor ? new Ctor() : new BaseAdapter(id);
}
function pubkeyHex(address, publicKey) {
  let s = String(publicKey || "").replace(/^0x/, "").toLowerCase();
  if (!/^[0-9a-f]*$/.test(s) || s.length % 2) return "";
  const taproot = String(address || "").toLowerCase().startsWith("tb1p");
  if (taproot && s.length === 66 && (s.startsWith("02") || s.startsWith("03"))) s = s.slice(2);
  return s;
}
function sessionFromAddresses(addresses, network, providerId) {
  const payment = addresses.find((a) => a.purpose === AddressPurpose.Payment || a.purpose === "payment");
  const ordinals = addresses.find((a) => a.purpose === AddressPurpose.Ordinals || a.purpose === "ordinals") || payment;
  if (!payment) throw new Error("The wallet did not share a payment address.");
  if (network && network !== SIGNET && network !== "Signet") {
    throw new Error(`Wallet is on ${network}, not Signet. In the wallet, open the network menu and choose Signet, then connect again.`);
  }
  for (const addr of [payment.address, ordinals.address]) assertSignetAddress(addr);
  return {
    paymentAddress: payment.address,
    paymentPubkey: pubkeyHex(payment.address, payment.publicKey),
    ordinalsAddress: ordinals.address,
    ordinalsPubkey: pubkeyHex(ordinals.address, ordinals.publicKey),
    network: "Signet",
    providerId
  };
}
async function connectUnisat(win) {
  const unisat = win.unisat;
  if (!unisat?.requestAccounts) throw new Error("UniSat is not installed.");
  let chain4;
  try {
    chain4 = await unisat.switchChain("BITCOIN_SIGNET");
  } catch (err) {
    throw new Error(`UniSat did not switch to Bitcoin Signet. Open UniSat and choose Bitcoin Signet, then connect again. ${err.message || ""}`.trim());
  }
  if (chain4?.enum !== "BITCOIN_SIGNET") {
    throw new Error("UniSat is not on Bitcoin Signet. Open UniSat and choose Bitcoin Signet, then connect again.");
  }
  const accounts = await unisat.requestAccounts();
  const publicKey = await unisat.getPublicKey();
  const address = accounts?.[0];
  return sessionFromAddresses([
    { address, publicKey, purpose: "payment" },
    { address, publicKey, purpose: "ordinals" }
  ], "Signet", UNISAT_ID);
}
function base64ToHex(b64) {
  const raw = atob(b64);
  let hex4 = "";
  for (let i = 0; i < raw.length; i++) hex4 += raw.charCodeAt(i).toString(16).padStart(2, "0");
  return hex4;
}
function hexToBase64(hex4) {
  const clean2 = String(hex4).replace(/^0x/, "").trim();
  if (clean2.startsWith("cHNidP")) return clean2;
  let raw = "";
  for (let i = 0; i < clean2.length; i += 2) raw += String.fromCharCode(Number.parseInt(clean2.slice(i, i + 2), 16));
  return btoa(raw);
}
async function signUnisat(win, psbtBase64, inputsToSign) {
  if (!win.unisat?.signPsbt) throw new Error("UniSat is not installed.");
  const signedHex = await win.unisat.signPsbt(base64ToHex(psbtBase64), {
    autoFinalized: false,
    toSignInputs: inputsToSign.map((input) => {
      const row = { index: input.index };
      if (input.address) row.address = input.address;
      if (input.publicKey) row.publicKey = input.publicKey;
      return row;
    })
  });
  return hexToBase64(signedHex);
}
function createWallet(options = {}) {
  const win = options.win || globalThis;
  let adapter2 = null;
  let connected = null;
  return {
    list: () => listWallets(win),
    connected: () => connected,
    async connect(providerId) {
      if (providerId === UNISAT_ID) {
        connected = await connectUnisat(win);
        adapter2 = null;
        return connected;
      }
      adapter2 = options.makeAdapter ? options.makeAdapter(providerId) : adapterFor(providerId);
      const response = await adapter2.request("wallet_connect", {
        addresses: [AddressPurpose.Payment, AddressPurpose.Ordinals],
        network: "Signet",
        message: "INK signet lab"
      });
      if (!response || response.status === "error") {
        throw new Error(response?.error?.message || "Wallet connect failed.");
      }
      const result = response.result;
      const network = result.network?.bitcoin?.name;
      connected = sessionFromAddresses(result.addresses || [], network, providerId);
      return connected;
    },
    async signPsbt(psbtBase64, inputsToSign, { broadcast: broadcast2 = false } = {}) {
      if (broadcast2 !== false) throw new Error("This page never asks a wallet to broadcast.");
      if (!connected) throw new Error("Connect a signet wallet first.");
      if (connected.providerId === UNISAT_ID) return signUnisat(win, psbtBase64, inputsToSign);
      const signInputs = {};
      for (const input of inputsToSign) {
        (signInputs[input.address] ||= []).push(input.index);
      }
      try {
        const response = await adapter2.request("signPsbt", { psbt: psbtBase64, signInputs, broadcast: false });
        if (!response || response.status === "error") {
          const message = response?.error?.message || "Wallet refused to sign.";
          if (NO_BROADCAST.test(message)) return signUnisat(win, psbtBase64, inputsToSign);
          throw new Error(message);
        }
        return response.result.psbt;
      } catch (err) {
        if (NO_BROADCAST.test(err.message || "")) return signUnisat(win, psbtBase64, inputsToSign);
        throw err;
      }
    },
    async disconnect() {
      try {
        await adapter2?.request("wallet_disconnect", null);
      } catch {
      }
      adapter2 = null;
      connected = null;
    }
  };
}

// src/ui.js
var STORE = "ink-signet-funding-v1";
var $ = (s) => document.querySelector(s);
var sats = (n) => `${n.toString()} sats`;
var funding = null;
var plan = null;
var revealKey = null;
var built = null;
var downloaded = false;
var mode = "key";
var destTouched = false;
var wallet = createWallet();
function log(msg) {
  const el = $("#log");
  el.textContent = msg;
  el.hidden = !msg;
}
function setBusy(on) {
  document.body.classList.toggle("busy", on);
}
function loadFunding() {
  const saved = localStorage.getItem(STORE);
  if (saved) {
    try {
      return keyFromHex(saved);
    } catch {
    }
  }
  const key = createKey();
  localStorage.setItem(STORE, key.hex);
  return key;
}
function showFunding() {
  $("#addr").textContent = funding.address;
  $("#dest").value = $("#dest").value || funding.address;
  for (const a of document.querySelectorAll("[data-faucet]")) {
    const url2 = new URL(a.dataset.faucet);
    url2.searchParams.set("address", funding.address);
    a.href = url2.toString();
  }
}
function contentFromForm() {
  const file = $("#file").files && $("#file").files[0];
  if (file) {
    if (file.size > MAX_BODY) throw new Error(`File is ${file.size} bytes. The limit is ${MAX_BODY} bytes.`);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read the file."));
      reader.onload = () => resolve({
        body: new Uint8Array(reader.result),
        contentType: contentTypeForFile(file.name, file.type),
        label: file.name
      });
      reader.readAsArrayBuffer(file);
    });
  }
  const text = $("#text").value;
  if (!text) throw new Error("Choose a file or type some text.");
  return Promise.resolve({ body: textBody(text), contentType: "text/plain;charset=utf-8", label: "typed text" });
}
function downloadJson(name, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
async function fetchFees() {
  const url2 = signetUrl("/signet/api/v1/fees/recommended");
  const res = await fetch(url2);
  if (!res.ok) throw new Error(`Fee API ${res.status}`);
  const data = await res.json();
  const rate = Number(data.halfHourFee || data.fastestFee || data.minimumFee);
  if (!Number.isFinite(rate) || rate <= 0) throw new Error("Fee API returned no rate.");
  $("#fee").value = String(rate);
  $("#feeNote").textContent = `Prefilled from mempool.space signet (half hour ${rate} sat/vB).`;
}
async function onPrepare() {
  setBusy(true);
  log("");
  try {
    if (mode === "wallet" && !wallet.connected()) throw new Error("Connect a signet wallet first.");
    const content = await contentFromForm();
    if (mode === "wallet" && !destTouched) $("#dest").value = wallet.connected().ordinalsAddress;
    const dest = assertSignetAddress($("#dest").value);
    const feeRate = assertFeeRate($("#fee").value);
    revealKey = createKey();
    plan = preparePlan({
      body: content.body,
      contentType: content.contentType,
      revealPriv: revealKey.priv,
      dest,
      feeRate
    });
    downloaded = false;
    built = null;
    $("#commitAddr").textContent = plan.commitAddress;
    $("#need").textContent = `Commit output ${sats(plan.commitValue)} (postage ${sats(plan.postage)} + reveal fee ${sats(plan.revealFee)}). You also need a commit fee, so fund more than that.`;
    $("#prepareBox").hidden = false;
    $("#buildBox").hidden = true;
    $("#broadcastBox").hidden = true;
    $("#buildBtn").disabled = true;
    log(`Envelope ready for ${content.label} (${content.body.length} bytes, ${content.contentType}). Download the recovery file before building the commit.`);
  } catch (err) {
    log(err.message || String(err));
  } finally {
    setBusy(false);
  }
}
function onDownload() {
  if (!plan) return;
  const fundingKey = mode === "wallet" ? void 0 : funding;
  downloadJson(`ink-signet-recovery-${plan.commitAddress.slice(0, 12)}.json`, recoveryFile(plan, fundingKey));
  downloaded = true;
  $("#buildBtn").disabled = false;
  log("Recovery file downloaded. You can build the commit now.");
}
async function dropInscribed(utxos) {
  const kept = [];
  let skipped = 0;
  for (const u of utxos) {
    if (Number(u.vout) !== 0) {
      kept.push(u);
      continue;
    }
    try {
      const res = await fetch(signetUrl(`/signet/api/tx/${u.txid}/hex`));
      if (!res.ok) {
        kept.push(u);
        continue;
      }
      const text = (await res.text()).trim();
      if (!/^[0-9a-fA-F]+$/.test(text) || text.length % 2) {
        kept.push(u);
        continue;
      }
      if (utxoCreatedByInscription(hex.decode(text), 0)) {
        skipped += 1;
        continue;
      }
    } catch {
      kept.push(u);
      continue;
    }
    kept.push(u);
  }
  return { kept, skipped };
}
function showBuilt(commit, reveal, extra) {
  built = { commit, reveal };
  $("#commitHex").value = commit.hex;
  $("#revealHex").value = reveal.hex;
  $("#feeLine").textContent = [
    `Commit ${commit.bytes} bytes, ${commit.vbytes} vB, fee ${sats(commit.fee)}`,
    `Reveal ${reveal.bytes} bytes, ${reveal.vbytes} vB, fee ${sats(reveal.fee)}`,
    `Postage ${sats(plan.postage)} to ${plan.destination}`,
    changeLine(commit.change),
    extra || ""
  ].filter(Boolean).join("\n");
  $("#buildBox").hidden = false;
}
async function onBuildWallet() {
  const session = wallet.connected();
  if (!session) throw new Error("Connect a signet wallet first.");
  assertSignetAddress(session.paymentAddress);
  const res = await fetch(signetUrl(`/signet/api/address/${session.paymentAddress}/utxo`));
  if (!res.ok) throw new Error(`UTXO lookup failed (${res.status}).`);
  const utxos = await res.json();
  const { kept, skipped } = await dropInscribed(utxos);
  const psbt = buildCommitPsbt({
    paymentAddress: session.paymentAddress,
    paymentPubkey: session.paymentPubkey,
    utxos: kept,
    plan
  });
  const inputsToSign = psbt.inputs.map((input, index) => ({
    index,
    address: session.paymentAddress,
    publicKey: session.paymentPubkey
  }));
  log("Waiting for the wallet to sign the commit. It will not broadcast.");
  const signed = await wallet.signPsbt(psbt.psbtBase64, inputsToSign, { broadcast: false });
  const commit = finalizeCommitPsbt(signed, plan);
  const reveal = buildReveal({ plan, commitTxid: commit.txid, commitVout: 0, commitValue: plan.commitValue });
  const skippedNote = skipped ? `Left ${skipped} inscribed output${skipped === 1 ? "" : "s"} unspent.` : "";
  showBuilt(commit, reveal, skippedNote);
  log("Wallet signed the commit. The page signed the reveal. Nothing has been broadcast yet.");
}
async function onBuild() {
  if (!plan || !downloaded) return;
  setBusy(true);
  log("");
  try {
    if (mode === "wallet") {
      await onBuildWallet();
      return;
    }
    const url2 = signetUrl(`/signet/api/address/${funding.address}/utxo`);
    const res = await fetch(url2);
    if (!res.ok) throw new Error(`UTXO lookup failed (${res.status}).`);
    const utxos = await res.json();
    const commit = buildCommit({ funding, utxos, plan });
    const reveal = buildReveal({ plan, commitTxid: commit.txid, commitVout: 0, commitValue: plan.commitValue });
    showBuilt(commit, reveal);
    log("Signed locally. Nothing has been broadcast yet.");
  } catch (err) {
    log(err.message || String(err));
  } finally {
    setBusy(false);
  }
}
function changeLine(change) {
  return change > 0n ? `Change ${sats(change)} back to the address that funded the commit.` : "No change output.";
}
async function broadcast(raw) {
  const res = await fetch(signetUrl("/signet/api/tx"), {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: raw
  });
  const text = (await res.text()).trim();
  if (!res.ok) throw new Error(text || `Broadcast failed (${res.status}).`);
  if (!/^[0-9a-f]{64}$/i.test(text)) throw new Error(text || "Unexpected broadcast response.");
  return text;
}
async function onBroadcast() {
  if (!built) return;
  setBusy(true);
  try {
    const commitId = await broadcast(built.commit.hex);
    log("Commit is in the mempool. Waiting until it is visible, then broadcasting the reveal.");
    await waitSeen(commitId);
    const revealId = await broadcast(built.reveal.hex);
    showResult(commitId, revealId);
    pollBoth(commitId, revealId);
  } catch (err) {
    log(err.message || String(err));
  } finally {
    setBusy(false);
  }
}
function explorer(txid) {
  return `https://mempool.space/signet/tx/${txid}`;
}
function showResult(commitId, revealId) {
  $("#broadcastBox").hidden = false;
  $("#commitLink").href = explorer(commitId);
  $("#commitLink").textContent = commitId;
  $("#revealLink").href = explorer(revealId);
  $("#revealLink").textContent = revealId;
  $("#insc").textContent = `${revealId}i0`;
}
async function waitSeen(txid) {
  for (let i = 0; i < 20; i++) {
    const res = await fetch(signetUrl(`/signet/api/tx/${txid}/status`));
    if (res.ok) return;
    await sleep(2e3);
  }
  throw new Error("Commit was broadcast but mempool.space has not seen it yet. Use Recover stuck reveal after it shows up.");
}
async function pollBoth(commitId, revealId) {
  const status = $("#confirm");
  for (let i = 0; i < 60; i++) {
    const [c, r] = await Promise.all([txStatus(commitId), txStatus(revealId)]);
    status.textContent = `Commit ${c}. Reveal ${r}.`;
    if (c === "confirmed" && r === "confirmed") return;
    await sleep(1e4);
  }
  status.textContent += " Still waiting. Signet blocks can be slow. The explorer links stay valid.";
}
async function txStatus(txid) {
  const res = await fetch(signetUrl(`/signet/api/tx/${txid}/status`));
  if (!res.ok) return "not seen yet";
  const data = await res.json();
  return data.confirmed ? `confirmed in block ${data.block_height}` : "in mempool";
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function onRecover(ev) {
  const file = ev.target.files && ev.target.files[0];
  ev.target.value = "";
  if (!file) return;
  setBusy(true);
  log("");
  try {
    const rec = JSON.parse(await file.text());
    if (rec.network !== NETWORK_NAME) throw new Error("Recovery file is not for signet.");
    const { plan: restored } = planFromRecovery(rec);
    const res = await fetch(signetUrl(`/signet/api/address/${restored.commitAddress}/utxo`));
    if (!res.ok) throw new Error(`Could not load commit UTXOs (${res.status}).`);
    const utxos = await res.json();
    if (!utxos.length) throw new Error("No coins are sitting on the commit address. The commit may not be broadcast yet.");
    const utxo = utxos.find((u) => BigInt(u.value) === BigInt(rec.commitValue)) || utxos[0];
    const reveal = buildReveal({
      plan: restored,
      commitTxid: utxo.txid,
      commitVout: utxo.vout,
      commitValue: BigInt(utxo.value)
    });
    if (reveal.fee <= 0n) throw new Error("Reveal fee is not covered by the commit output.");
    $("#recoverHex").value = reveal.hex;
    $("#recoverMeta").textContent = `Reveal ${reveal.txid}, ${reveal.vbytes} vB, fee ${sats(reveal.fee)}, postage ${sats(reveal.tx.getOutput(0).amount)}.`;
    $("#recoverBox").hidden = false;
    $("#rebroadcast").onclick = async () => {
      setBusy(true);
      try {
        const id = await broadcast(reveal.hex);
        log(`Reveal rebroadcast. ${id}`);
        $("#recoverLink").hidden = false;
        $("#recoverLink").href = explorer(id);
        $("#recoverLink").textContent = id;
        pollBoth(utxo.txid, id);
      } catch (err) {
        log(err.message || String(err));
      } finally {
        setBusy(false);
      }
    };
    log("Reveal rebuilt from the recovery file. Nothing has been broadcast yet.");
  } catch (err) {
    log(err.message || String(err));
  } finally {
    setBusy(false);
  }
}
function resetPlan() {
  plan = null;
  built = null;
  downloaded = false;
  $("#prepareBox").hidden = true;
  $("#buildBox").hidden = true;
  $("#broadcastBox").hidden = true;
  $("#buildBtn").disabled = true;
}
function renderWallets() {
  const list = $("#walletList");
  list.replaceChildren();
  const session = wallet.connected();
  for (const w of wallet.list()) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.wallet = w.name;
    btn.textContent = w.installed ? w.name : `${w.name} (not detected)`;
    btn.disabled = !w.installed;
    btn.setAttribute("aria-pressed", String(Boolean(session && session.providerId === w.id)));
    btn.onclick = () => {
      connectWallet(w.id);
    };
    list.appendChild(btn);
  }
}
function showSession() {
  const session = wallet.connected();
  const status = $("#walletStatus");
  $("#disconnect").hidden = !session;
  if (!session) {
    status.textContent = "No wallet connected. Install Xverse or UniSat, switch it to Signet, then choose it above.";
    return;
  }
  const same = session.paymentAddress === session.ordinalsAddress;
  status.textContent = same ? `Connected on Signet. This wallet uses one address for payment and the inscription: ${session.paymentAddress}` : `Connected on Signet. Payment (funds the commit): ${session.paymentAddress}. Ordinals (receives the inscription): ${session.ordinalsAddress}`;
  if (!destTouched) $("#dest").value = session.ordinalsAddress;
}
async function connectWallet(id) {
  setBusy(true);
  log("");
  try {
    await wallet.connect(id);
    showSession();
    renderWallets();
    resetPlan();
    log("Wallet connected on Signet. The reveal is still signed by a one-time key on this page.");
  } catch (err) {
    showSession();
    log(err.message || String(err));
  } finally {
    setBusy(false);
  }
}
function setMode(next) {
  mode = next;
  $("#keyPanel").hidden = mode !== "key";
  $("#walletPanel").hidden = mode !== "wallet";
  $("#modeKey").setAttribute("aria-pressed", String(mode === "key"));
  $("#modeWallet").setAttribute("aria-pressed", String(mode === "wallet"));
  if (mode === "wallet") {
    renderWallets();
    showSession();
    if (!destTouched && wallet.connected()) $("#dest").value = wallet.connected().ordinalsAddress;
  } else if (!destTouched) {
    $("#dest").value = funding.address;
  }
  resetPlan();
}
$("#modeKey").onclick = () => {
  setMode("key");
};
$("#modeWallet").onclick = () => {
  setMode("wallet");
};
$("#disconnect").onclick = async () => {
  await wallet.disconnect();
  showSession();
  renderWallets();
  if (!destTouched) $("#dest").value = "";
  resetPlan();
  log("Wallet disconnected.");
};
$("#newKey").onclick = () => {
  if (!confirm("Replace the throwaway signet key in this browser? Coins on the old address will not move with it.")) return;
  funding = createKey();
  localStorage.setItem(STORE, funding.hex);
  $("#dest").value = funding.address;
  showFunding();
  resetPlan();
  log("New throwaway signet key. Fund the new address. The old key is no longer stored here.");
};
$("#prepare").onclick = () => {
  onPrepare();
};
$("#download").onclick = () => {
  onDownload();
};
$("#buildBtn").onclick = () => {
  onBuild();
};
$("#broadcast").onclick = () => {
  onBroadcast();
};
$("#recoverFile").addEventListener("change", onRecover);
$("#file").addEventListener("change", resetPlan);
$("#text").addEventListener("input", resetPlan);
$("#dest").addEventListener("input", () => {
  destTouched = true;
});
$("#dest").addEventListener("change", resetPlan);
$("#fee").addEventListener("change", resetPlan);
funding = loadFunding();
showFunding();
renderWallets();
fetchFees().catch((err) => {
  $("#fee").value = "1";
  $("#feeNote").textContent = `Could not read the fee API (${err.message}). Defaulted to 1 sat/vB.`;
});
/*! Bundled license information:

ieee754/index.js:
  (*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> *)

buffer/index.js:
  (*!
   * The buffer module from node.js, for the browser.
   *
   * @author   Feross Aboukhadijeh <https://feross.org>
   * @license  MIT
   *)

@noble/hashes/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/secp256k1/lib/index.js:
  (*! noble-secp256k1 - MIT License (c) 2019 Paul Miller (paulmillr.com) *)

@scure/base/index.js:
@scure/base/index.js:
@scure/base/index.js:
  (*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/curves/utils.js:
@noble/curves/abstract/modular.js:
@noble/curves/abstract/curve.js:
@noble/curves/abstract/weierstrass.js:
@noble/curves/secp256k1.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
*/
