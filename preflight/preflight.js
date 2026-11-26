import { csvToItems, parseMetadataCSV } from '../kit/metadataCsv.js';
import { isGammaOnChain, normalizeCollection, toMagicEden } from '../kit/convert.js';
import { preflightLines } from './lines.js';

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
  const lines = preflightLines(estimate, {
    dropTitles: $('#dropTitles').checked,
    dropTraits: $('#dropTraits').checked,
  });
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
