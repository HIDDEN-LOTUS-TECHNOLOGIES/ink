// Compressed-size estimate for ord gallery properties.
// ord 0.29.1 (tag 0.29.1) compresses with the Rust `brotli` crate 9.0.0 in
// src/inscriptions/inscription.rs, Inscription::compress: quality 11, lgwin 24,
// lgblock 24, mode GENERIC (not text), size_hint = the uncompressed length.
// Properties go through compress_properties, which passes BROTLI_MODE_GENERIC.
// brotli-lib 0.0.7 is an MIT TypeScript port of Google's Brotli encoder.
// Its one-shot quality-11 path uses 16 MiB metablocks, the same block size as
// lgblock 24. The port does not take an lgblock option. It is not byte-identical
// to the Rust crate and runs high: the 777-item OPIUM sample is 39,618 bytes
// here against ord's 35,258, and 37,037 against 33,309 with titles dropped.
// Callers label that as a conservative estimate that can run about 10% high.
// Inputs under 64 bytes take the port's uncompressed-frame path; callers keep
// the raw bytes when the frame is not smaller, which is also what ord does
// when compression does not shrink.

import { brotliEncode, EncoderMode } from './vendor/brotli-lib/encode.js';

export const BROTLI_ESTIMATE = {
  library: 'brotli-lib',
  version: '0.0.7',
  license: 'MIT',
  quality: 11,
  lgwin: 24,
  mode: 'generic',
};

export function estimateBrotliSize(bytes) {
  return brotliEncode(bytes, {
    quality: BROTLI_ESTIMATE.quality,
    lgwin: BROTLI_ESTIMATE.lgwin,
    mode: EncoderMode.GENERIC,
    sizeHint: bytes.length,
  });
}
