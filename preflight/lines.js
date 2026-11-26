// Text of the preflight estimate. No DOM, so the wording can be tested directly.

import { propertiesWeightLine } from '../estimate/size.js';

const COMPRESSION_RULE = 'ord rejects --compress when the raw properties are over 4,000,000 bytes, or when uncompressed divided by compressed, rounded down, is over 30:1 (src/inscriptions/inscription.rs).';

function formatBytes(n) {
  return `${n.toLocaleString('en-US')} bytes`;
}

function variantLine(label, size) {
  if (!size || !size.rawBytes) return `${label}: nothing to encode.`;
  const brotli = size.compressError === 'ratio'
    ? 'brotli estimate over the 30:1 cap'
    : size.compressError === 'over-4mb'
      ? 'over the 4,000,000 byte properties cap'
      : size.compressedBytes == null
        ? 'brotli did not shrink it'
        : `brotli estimate ${formatBytes(size.compressedBytes)}`;
  return `${label}: raw ${formatBytes(size.rawBytes)} (${size.encoding}), ${brotli}.`;
}

function compressionWarning(size) {
  if (size.compressError === 'ratio') return 'Warning: this brotli estimate is over ord\'s 30:1 cap.';
  if (size.compressError === 'over-4mb') return 'Warning: the raw properties are over ord\'s 4,000,000 byte decompressed limit.';
  return '';
}

export function preflightLines(estimate, { dropTitles = false, dropTraits = false } = {}) {
  if (!estimate.ok) return [];
  const ordVersion = estimate.ordVersion;
  const brotli = estimate.brotli;
  const lines = [
    `Estimate against ord ${ordVersion}.`,
    'Estimate only. Nothing is signed, broadcast or submitted.',
    '',
    `${estimate.itemCount} ${estimate.itemCount === 1 ? 'item' : 'items'} encoded. ${estimate.leftOut} left out.`,
    `Selected options: ${dropTitles ? 'titles dropped' : 'titles kept'}, ${dropTraits ? 'traits dropped' : 'traits kept'}.`,
  ];
  if (!estimate.itemCount) {
    lines.push('No valid inscription id to encode.');
    return lines;
  }
  const size = estimate.selected;
  lines.push(`Raw CBOR properties: ${formatBytes(size.rawBytes)} (${size.encoding}).`);
  lines.push(COMPRESSION_RULE);
  const warning = compressionWarning(size);
  if (warning) lines.push(warning);
  if (size.compressError === 'ratio') {
    lines.push(`The cap check uses this estimate, which can run up to ~15% high (about 12% on the OPIUM sample) and is not byte-identical to ord's Rust encoder. The uncompressed size still stands.`);
  } else if (size.compressError === 'over-4mb') {
    lines.push(`ord ${ordVersion} rejects --compress above 4,000,000 bytes.`);
  } else if (size.brotliLimited && size.compressedBytes == null) {
    lines.push(`Brotli estimate: not smaller. This payload is under 64 bytes, and ${brotli.library} ${brotli.version} leaves that on an uncompressed frame. The estimate can run up to ~15% high (about 12% on the OPIUM sample). ord's Rust encoder might still shrink it. Showing the uncompressed size only.`);
  } else if (size.compressedBytes == null) {
    lines.push(`Brotli estimate: not smaller than the raw CBOR, so ord would keep the ${formatBytes(size.rawBytes)} uncompressed properties. Encoder: ${brotli.library} ${brotli.version}, quality ${brotli.quality}, ${brotli.lgwin}-bit window. This estimate can run up to ~15% high (about 12% on the OPIUM sample), so ord's Rust encoder might still shrink it.`);
  } else {
    lines.push(`Brotli estimate: ${formatBytes(size.compressedBytes)}. ${brotli.library} ${brotli.version}, quality ${brotli.quality}, ${brotli.lgwin}-bit window, generic mode.`);
    lines.push(`Conservative estimate. It can run up to ~15% high (about 12% on the OPIUM sample) versus the Rust brotli 9.0.0 encoder ord ${ordVersion} uses (quality 11, lgwin 24, lgblock 24, generic mode, not text). On the 777-item OPIUM sample this encoder read 39,618 bytes against ord's 35,258, and 37,037 against 33,309 with titles dropped.`);
  }
  lines.push(propertiesWeightLine('Raw properties', size.rawBytes));
  if (size.compressedBytes != null) lines.push(propertiesWeightLine('Brotli estimate', size.compressedBytes, { encoding: 'br' }));
  lines.push('Tag 17 is pushed in 520-byte chunks. Each chunk costs a 2-byte tag push and a 3-byte push header when the chunk is 520 bytes. A compressed figure also includes the Tag 19 "br" encoding push. Each weight is a reveal with those properties and no content body.');
  lines.push('Bitcoin Core\'s standardness cap is 400,000 weight units, and ord refuses an oversized reveal unless --no-limit is used. 390,000 weight units should be safe.');
  lines.push(variantLine('Titles dropped', estimate.titlesDropped));
  lines.push(propertiesWeightLine('Titles dropped', estimate.titlesDropped?.rawBytes));
  if (estimate.titlesDropped?.compressedBytes != null) {
    lines.push(propertiesWeightLine('Titles dropped brotli estimate', estimate.titlesDropped.compressedBytes, { encoding: 'br' }));
  }
  lines.push(variantLine('Traits dropped', estimate.traitsDropped));
  lines.push(propertiesWeightLine('Traits dropped', estimate.traitsDropped?.rawBytes));
  if (estimate.traitsDropped?.compressedBytes != null) {
    lines.push(propertiesWeightLine('Traits dropped brotli estimate', estimate.traitsDropped.compressedBytes, { encoding: 'br' }));
  }
  return lines;
}
