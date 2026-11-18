import { csvToItems, parseMetadataCSV } from '../kit/metadataCsv.js';
import { isGammaOnChain, normalizeCollection, toMagicEden } from '../kit/convert.js';
import { MAX_STANDARD_TX_WEIGHT, propertiesReveal, SAFE_TX_WEIGHT } from '../estimate/size.js';

const $ = (sel) => document.querySelector(sel);
let data = null;
let bytes = null;
let generation = 0;
let galleryModule = null;
let galleryPromise = null;

// encode.js is about 121 KB. Load it with the estimator, on the first estimate.
function loadGallery() {
  if (!galleryPromise) {
    galleryPromise = import('./galleryProperties.js').then((mod) => {
      galleryModule = mod;
      return mod;
    }).catch((err) => {
      galleryPromise = null;
      throw err;
    });
  }
  return galleryPromise;
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatBytes(n) {
  return `${n.toLocaleString('en-US')} bytes`;
}

function weightLine(label, byteLength) {
  if (byteLength == null) return `${label}: no figure.`;
  const reveal = propertiesReveal(byteLength);
  const mark = reveal.weightClass === 'over'
    ? `over Bitcoin Core's ${MAX_STANDARD_TX_WEIGHT.toLocaleString('en-US')} weight-unit standardness cap`
    : reveal.weightClass === 'warn'
      ? `over the ${SAFE_TX_WEIGHT.toLocaleString('en-US')} weight-unit line that should be safe`
      : `within the ${SAFE_TX_WEIGHT.toLocaleString('en-US')} weight-unit line that should be safe`;
  return `${label}: reveal weight ${reveal.revealWeight.toLocaleString('en-US')} (${reveal.revealVbytes.toLocaleString('en-US')} vbytes), ${mark}.`;
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

function render(estimate) {
  if (!estimate.ok) {
    bytes = null;
    $('#download').disabled = true;
    $('#out').textContent = '';
    $('#status').textContent = estimate.normalizeError || 'That file is not a collection array.';
    $('#issues').innerHTML = '';
    return;
  }
  bytes = estimate.selected.bytes;
  $('#download').disabled = !bytes;
  const ordVersion = estimate.ordVersion;
  const brotli = estimate.brotli;
  const lines = [
    `Estimate against ord ${ordVersion}.`,
    'Estimate only. Nothing is signed, broadcast or submitted.',
    '',
    `${estimate.itemCount} ${estimate.itemCount === 1 ? 'item' : 'items'} encoded. ${estimate.leftOut} left out.`,
    `Selected options: ${$('#dropTitles').checked ? 'titles dropped' : 'titles kept'}, ${$('#dropTraits').checked ? 'traits dropped' : 'traits kept'}.`,
  ];
  if (!estimate.itemCount) {
    lines.push('No valid inscription id to encode.');
  } else {
    const size = estimate.selected;
    lines.push(`Raw CBOR properties: ${formatBytes(size.rawBytes)} (${size.encoding}).`);
    if (size.compressError === 'ratio') {
      lines.push(`Brotli estimate is over ord's 30:1 cap (uncompressed divided by compressed, rounded down). ord ${ordVersion} would reject --compress. The cap check uses this estimate, which can run up to ~15% high (about 12% on the OPIUM sample) and is not byte-identical to ord's Rust encoder. The uncompressed size still stands.`);
    } else if (size.compressError === 'over-4mb') {
      lines.push(`The raw properties are over ${MAX_SAFE(4000000)} bytes. ord ${ordVersion} rejects --compress above 4,000,000 bytes.`);
    } else if (size.brotliLimited && size.compressedBytes == null) {
      lines.push(`Brotli estimate: not smaller. This payload is under 64 bytes, and ${brotli.library} ${brotli.version} leaves that on an uncompressed frame. The estimate can run up to ~15% high (about 12% on the OPIUM sample). ord's Rust encoder might still shrink it. Showing the uncompressed size only.`);
    } else if (size.compressedBytes == null) {
      lines.push(`Brotli estimate: not smaller than the raw CBOR, so ord would keep the ${formatBytes(size.rawBytes)} uncompressed properties. Encoder: ${brotli.library} ${brotli.version}, quality ${brotli.quality}, ${brotli.lgwin}-bit window. This estimate can run up to ~15% high (about 12% on the OPIUM sample), so ord's Rust encoder might still shrink it.`);
    } else {
      lines.push(`Brotli estimate: ${formatBytes(size.compressedBytes)}. ${brotli.library} ${brotli.version}, quality ${brotli.quality}, ${brotli.lgwin}-bit window, generic mode.`);
      lines.push(`Conservative estimate. It can run up to ~15% high (about 12% on the OPIUM sample) versus the Rust brotli 9.0.0 encoder ord ${ordVersion} uses (quality 11, lgwin 24, lgblock 24, generic mode, not text). On the 777-item OPIUM sample this encoder read 39,618 bytes against ord's 35,258, and 37,037 against 33,309 with titles dropped.`);
    }
    lines.push(weightLine('Raw properties', size.rawBytes));
    lines.push('Tag 17 is pushed in 520-byte chunks. Each chunk costs a 2-byte tag push and a 3-byte push header when the chunk is 520 bytes. The weight above is a reveal with those properties and no content body.');
    lines.push('Bitcoin Core\'s standardness cap is 400,000 weight units, and ord refuses an oversized reveal unless --no-limit is used. 390,000 weight units should be safe.');
    lines.push(variantLine('Titles dropped', estimate.titlesDropped));
    lines.push(variantLine('Traits dropped', estimate.traitsDropped));
  }
  $('#out').textContent = lines.join('\n');
  const rows = [];
  for (const row of estimate.idIssues) {
    const where = row.index != null ? ` #${row.index}` : '';
    rows.push(`<li class="${row.severity === 'critical' || row.severity === 'error' ? 'error' : 'warn'}">${esc(row.message)}${esc(where)}</li>`);
  }
  for (const note of estimate.traitNotes) {
    rows.push(`<li class="warn">Trait "${esc(note.name)}" on #${esc(note.n)} is not a bool, integer, null, or text. It was left out of the size.</li>`);
  }
  $('#issues').innerHTML = rows.join('');
}

function MAX_SAFE(n) {
  return n.toLocaleString('en-US');
}

async function showEstimate() {
  if (!data) return;
  const token = ++generation;
  const options = {
    dropTitles: $('#dropTitles').checked,
    dropTraits: $('#dropTraits').checked,
  };
  if (!galleryModule) $('#out').textContent = 'Loading estimator…';
  let gallery;
  try {
    gallery = await loadGallery();
  } catch (err) {
    if (token !== generation) return;
    bytes = null;
    $('#download').disabled = true;
    $('#out').textContent = '';
    $('#status').textContent = err instanceof Error ? err.message : 'Could not load the estimator.';
    return;
  }
  if (token !== generation) return;
  $('#out').textContent = 'Estimating…';
  setTimeout(() => {
    if (token !== generation) return;
    render(gallery.estimateGallery(data, options));
  }, 0);
}

function loadData(next, status) {
  data = next;
  $('#status').textContent = status;
  if (!data) {
    bytes = null;
    $('#download').disabled = true;
    $('#out').textContent = '';
    $('#issues').innerHTML = '';
    return;
  }
  showEstimate();
}

function loadText(text) {
  const trimmed = text.trim();
  if (!trimmed) {
    loadData(null, 'Empty file.');
    return;
  }
  try {
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed);
      if (isGammaOnChain(parsed)) {
        loadData(parsed, `Loaded ${parsed.length} Gamma rows. These rows have no inscription id yet.`);
        return;
      }
      const items = normalizeCollection(parsed);
      loadData(parsed, `Loaded ${items.length} items from JSON.`);
      return;
    }
    const header = trimmed.split(/\r?\n/, 1)[0].toLowerCase();
    if (header.includes('layer_name') && header.includes('trait_name')) {
      const parsed = parseMetadataCSV(trimmed);
      loadData(null, parsed.errors.join(' ') || 'That CSV is a trait layer list, not a collection of inscription ids.');
      return;
    }
    const items = csvToItems(trimmed);
    loadData(toMagicEden(items), `Loaded ${items.length} items from CSV.`);
  } catch (err) {
    loadData(null, err instanceof Error ? err.message : 'Could not read that file.');
  }
}

$('#file').addEventListener('change', async (ev) => {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  loadText(await file.text());
});

$('#paste').addEventListener('click', () => {
  try { loadText($('#raw').value); } catch (err) { loadData(null, err.message); }
});

for (const id of ['dropTitles', 'dropTraits']) {
  $(`#${id}`).addEventListener('change', () => showEstimate());
}

const drop = $('#drop');
drop.addEventListener('dragover', (ev) => { ev.preventDefault(); drop.classList.add('hot'); });
drop.addEventListener('dragleave', () => drop.classList.remove('hot'));
drop.addEventListener('drop', async (ev) => {
  ev.preventDefault();
  drop.classList.remove('hot');
  const file = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
  if (!file) return;
  loadText(await file.text());
});

$('#download').addEventListener('click', () => {
  if (!bytes) return;
  const blob = new Blob([bytes], { type: 'application/cbor' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'properties.cbor';
  a.click();
  URL.revokeObjectURL(a.href);
});
