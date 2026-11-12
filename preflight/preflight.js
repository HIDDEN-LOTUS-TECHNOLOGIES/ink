import { csvToItems, parseMetadataCSV } from '../kit/metadataCsv.js';
import { isGammaOnChain, normalizeCollection, toMagicEden } from '../kit/convert.js';
import { estimateGallery, ORD_VERSION, STANDARD_TX_BYTES } from './galleryProperties.js';
import { BROTLI_ESTIMATE } from './brotli.js';

const $ = (sel) => document.querySelector(sel);
let data = null;
let bytes = null;
let generation = 0;

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatBytes(n) {
  return `${n.toLocaleString('en-US')} bytes`;
}

function fits(n) {
  if (n == null) return 'no compressed figure';
  if (n <= STANDARD_TX_BYTES) return `fits in ${formatBytes(STANDARD_TX_BYTES)}`;
  return `over by ${formatBytes(n - STANDARD_TX_BYTES)}`;
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
  const lines = [
    `Estimate against ord ${ORD_VERSION}.`,
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
      lines.push(`Brotli estimate is over ord's 30:1 cap (uncompressed divided by compressed, rounded down). ord ${ORD_VERSION} would reject --compress. The cap check uses this estimate, and ${BROTLI_ESTIMATE.library} ${BROTLI_ESTIMATE.version} is not byte-identical to ord's Rust encoder. The uncompressed size still stands.`);
    } else if (size.compressError === 'over-4mb') {
      lines.push(`The raw properties are over ${MAX_SAFE(4000000)} bytes. ord ${ORD_VERSION} rejects --compress above 4,000,000 bytes.`);
    } else if (size.brotliLimited && size.compressedBytes == null) {
      lines.push(`Brotli estimate: not smaller. This payload is under 64 bytes, and ${BROTLI_ESTIMATE.library} ${BROTLI_ESTIMATE.version} leaves that on an uncompressed frame. ord's Rust encoder might still shrink it. Showing the uncompressed size only.`);
    } else if (size.compressedBytes == null) {
      lines.push(`Brotli estimate: not smaller than the raw CBOR, so ord would keep the ${formatBytes(size.rawBytes)} uncompressed properties. Encoder: ${BROTLI_ESTIMATE.library} ${BROTLI_ESTIMATE.version}, quality ${BROTLI_ESTIMATE.quality}, ${BROTLI_ESTIMATE.lgwin}-bit window. Not byte-identical to ord's Rust encoder.`);
    } else {
      lines.push(`Brotli estimate: ${formatBytes(size.compressedBytes)}. ${BROTLI_ESTIMATE.library} ${BROTLI_ESTIMATE.version}, quality ${BROTLI_ESTIMATE.quality}, ${BROTLI_ESTIMATE.lgwin}-bit window, generic mode. Not byte-identical to the Rust brotli crate ord ${ORD_VERSION} uses.`);
    }
    lines.push(`400 KB standard tx limit used here: ${formatBytes(STANDARD_TX_BYTES)}. Raw ${fits(size.rawBytes)}. ${size.compressedBytes == null ? 'No smaller brotli figure.' : `Brotli estimate ${fits(size.compressedBytes)}.`}`);
    lines.push('These are the Tag 17 bytes only. A reveal transaction also carries an input, an output, and the ord envelope. ord refuses a reveal over Bitcoin Core\'s 400,000 weight-unit standardness cap.');
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

function showEstimate() {
  if (!data) return;
  const token = ++generation;
  $('#out').textContent = 'Estimating…';
  const options = {
    dropTitles: $('#dropTitles').checked,
    dropTraits: $('#dropTraits').checked,
  };
  setTimeout(() => {
    if (token !== generation) return;
    render(estimateGallery(data, options));
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
