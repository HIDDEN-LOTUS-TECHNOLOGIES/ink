import { rankByScore, standardScores, tierCounts, tierFor } from '../assets/rarity.js';
import { CBORGenerator, estimateAddedVbytes, toHex } from './cbor.js';
import { csvToItems, itemsToCsv, parseMetadataCSV } from './metadataCsv.js';
import { MetadataValidator } from './metadataValidator.js';
import { isInkItem, normalizeCollection, sameItems, toMagicEden } from './convert.js';
import { decodeParentTag3Hex, isValidInscriptionId, parentTag3Hex, parseInscriptionId } from './parentInscription.js';

const $ = (s) => document.querySelector(s);
let items = [];
let rawText = '';
let sortKey = 'rank';
let sortDir = 1;

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function download(name, text, type) {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function setStatus(msg) {
  $('#status').textContent = msg;
}

function rankedRows() {
  const copy = items.map((i) => ({ ...i, t: { ...(i.t || {}) } }));
  standardScores(copy);
  const ranks = rankByScore(copy);
  return copy.map((i) => {
    const rank = ranks.get(i.id);
    const tier = rank == null ? null : tierFor(rank, copy.length);
    return { ...i, rank, tier: tier ? tier[0] : '', tierLabel: tier ? tier[2] : '' };
  });
}

function renderValidation(text, data) {
  const result = MetadataValidator.validateComplete(text);
  const stats = result.stats;
  const lines = [result.summary];
  if (stats) {
    lines.push(`${stats.totalItems} items, ${stats.traitCategories} trait keys, ${stats.missingIds} missing ids, ${stats.duplicateIds} duplicate ids, ${stats.badIds} bad inscription ids.`);
    if (stats.traitKeys.length) lines.push(`Keys: ${stats.traitKeys.join(', ')}`);
  }
  $('#summary').textContent = lines.join('\n');
  const rows = [...result.errors, ...result.warnings].slice(0, 80);
  $('#issues').innerHTML = rows.map((row) => `<li class="${row.severity || 'warn'}">${esc(row.field)}${row.index != null ? ` #${row.index}` : ''}: ${esc(row.message)}</li>`).join('') || '<li>No item issues.</li>';
  if (Array.isArray(data)) renderRarity();
}

function renderRarity() {
  let rows = rankedRows().filter((r) => r.rank != null);
  rows.sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av === bv) return (a.n - b.n) * sortDir;
    return (av > bv ? 1 : -1) * sortDir;
  });
  const counts = tierCounts(rows.map((r) => r.rank), rows.length || 1);
  $('#tiers').innerHTML = Object.entries(counts).map(([name, n]) => `<span class="${name}"><i></i>${esc(name)} ${n}</span>`).join('');
  $('#table').innerHTML = rows.slice(0, 200).map((r) => `<tr data-n="${r.n}"><td>${r.rank}</td><td>${r.score ?? ''}</td><td><span class="chip" data-tier="${esc(r.tier)}">${esc(r.tierLabel)}</span></td><td>${esc(r.n)}</td><td>${esc(r.name)}</td><td>${esc(Object.entries(r.t).map(([k, v]) => `${k}: ${v}`).join(' · '))}</td></tr>`).join('');
  const dist = {};
  for (const row of rows) {
    for (const [k, v] of Object.entries(row.t || {})) {
      dist[k] ??= {};
      dist[k][v] = (dist[k][v] || 0) + 1;
    }
  }
  $('#dist').innerHTML = Object.keys(dist).map((k) => {
    const values = Object.entries(dist[k]).sort((a, b) => a[1] - b[1] || String(a[0]).localeCompare(String(b[0])));
    return `<details><summary>${esc(k)}</summary><ul>${values.slice(0, 12).map(([v, n]) => `<li>${esc(v)} <span>${n}</span></li>`).join('')}</ul></details>`;
  }).join('');
  $('#cborPick').innerHTML = rows.slice(0, 300).map((r) => `<option value="${r.n}">#${r.n} ${esc(r.name)}</option>`).join('');
}

function loadText(text) {
  rawText = text;
  const trimmed = text.trim();
  if (!trimmed) { setStatus('Empty file.'); return; }
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    const data = JSON.parse(trimmed);
    items = normalizeCollection(data);
    renderValidation(trimmed, data);
    setStatus(`Loaded ${items.length} items from JSON.`);
    return;
  }
  const header = trimmed.split(/\r?\n/, 1)[0].toLowerCase();
  if (header.includes('layer_name') && header.includes('trait_name')) {
    const parsed = parseMetadataCSV(trimmed);
    setStatus(parsed.errors.join('\n') || `Layer CSV: ${parsed.totalTraits} traits in ${parsed.layers.length} layers.`);
    $('#summary').textContent = parsed.errors.length ? parsed.errors.join('\n') : `${parsed.layers.length} layers.`;
    $('#issues').innerHTML = '';
    items = [];
    return;
  }
  items = csvToItems(trimmed);
  renderValidation(JSON.stringify(toMagicEden(items)), toMagicEden(items));
  setStatus(`Loaded ${items.length} items from CSV.`);
}

$('#file').addEventListener('change', async (ev) => {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  loadText(await file.text());
});

$('#paste').addEventListener('click', () => {
  try { loadText($('#raw').value); } catch (err) { setStatus(err.message); }
});

$('#opium').addEventListener('click', async () => {
  setStatus('Loading OPIUM…');
  const res = await fetch('/data/opium.json');
  if (!res.ok) { setStatus('Could not load OPIUM.'); return; }
  const text = await res.text();
  $('#raw').value = '';
  loadText(text);
});

$('#toCsv').addEventListener('click', () => {
  if (!items.length) return setStatus('Load a collection first.');
  download('collection.csv', itemsToCsv(items), 'text/csv');
});

$('#toJson').addEventListener('click', () => {
  if (!items.length) return setStatus('Load a collection first.');
  const asInk = items.some(isInkItem) || items.some((i) => i.score != null || i.n != null);
  download('collection.json', JSON.stringify(asInk ? items : toMagicEden(items)), 'application/json');
});

$('#round').addEventListener('click', () => {
  if (!items.length) return setStatus('Load a collection first.');
  const back = csvToItems(itemsToCsv(items));
  const ok = sameItems(items, back);
  $('#roundOut').textContent = ok ? 'JSON → CSV → JSON matched.' : 'Round trip changed an item.';
});

document.querySelectorAll('th[data-k]').forEach((th) => {
  th.addEventListener('click', () => {
    const key = th.dataset.k;
    sortDir = sortKey === key ? -sortDir : 1;
    sortKey = key;
    if (items.length) renderRarity();
  });
});

$('#cborShow').addEventListener('click', () => {
  const n = Number($('#cborPick').value);
  const item = rankedRows().find((r) => r.n === n);
  if (!item) return;
  const gen = new CBORGenerator({ collectionName: item.name.replace(/ #\d+$/, '') || 'Collection' });
  const traits = Object.entries(item.t).map(([trait_type, value]) => ({ trait_type, value: String(value) }));
  const meta = gen.generateMetadata(item.n, traits);
  const bytes = gen.encodeCBOR(meta);
  $('#cborOut').textContent = `${toHex(bytes)}\n${bytes.length} bytes, about ${estimateAddedVbytes(bytes.length)} added vbytes.`;
});

$('#cborAll').addEventListener('click', () => {
  if (!items.length) return;
  const map = {};
  for (const item of rankedRows()) {
    const gen = new CBORGenerator({ collectionName: 'Collection' });
    const traits = Object.entries(item.t || {}).map(([trait_type, value]) => ({ trait_type, value: String(value) }));
    map[item.id || String(item.n)] = toHex(gen.encodeCBOR(gen.generateMetadata(item.n, traits)));
  }
  download('cbor-tag5.json', JSON.stringify(map), 'application/json');
});

$('#parentEncode').addEventListener('click', () => {
  const id = $('#parentId').value.trim();
  if (!isValidInscriptionId(id)) { $('#parentOut').textContent = 'That is not an inscription id.'; return; }
  const parsed = parseInscriptionId(id);
  $('#parentOut').textContent = `${parsed.txid}i${parsed.index}\n${parentTag3Hex(id)}`;
});

$('#parentDecode').addEventListener('click', () => {
  try { $('#parentOut').textContent = decodeParentTag3Hex($('#parentHex').value); }
  catch (err) { $('#parentOut').textContent = err.message; }
});

$('#table').addEventListener('click', (ev) => {
  const tr = ev.target.closest('tr');
  if (!tr) return;
  $('#cborPick').value = tr.dataset.n;
});
