import { batchCost, planBatch } from './batch.js';
import { loadMarket, RATE_ROWS } from '../estimate/rates.js';
import { MAX_STANDARD_TX_WEIGHT, parseFeeRate, parsePostage, POSTAGE_DEFAULT, SAFE_TX_WEIGHT, satsToUsd } from '../estimate/size.js';

const $ = (s) => document.querySelector(s);

let chosen = [];
let generation = 0;
let market = { fees: null, usd: null };
let marketNote = '';

function h(tag, attrs, text) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  }
  if (text != null) node.textContent = text;
  return node;
}

function setStatus(message, isError) {
  const node = $('#status');
  node.textContent = message;
  node.classList.toggle('error', Boolean(isError));
}

function formatNum(n) {
  return Number.isFinite(n) ? n.toLocaleString('en-US') : '';
}

function formatRate(n) {
  if (!Number.isFinite(n)) return '';
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function formatUsd(n) {
  if (!Number.isFinite(n)) return '';
  const digits = n >= 0.01 ? 2 : 6;
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

function postageValue() {
  return parsePostage($('#postage').value);
}

function customRate() {
  const raw = $('#rate').value.trim();
  if (!raw) return null;
  return parseFeeRate(raw);
}

function rateColumns(fees, custom) {
  const columns = [];
  if (fees) {
    for (const [key, label] of RATE_ROWS) columns.push({ label, rate: fees[key] });
  }
  if (custom != null) columns.push({ label: 'Custom', rate: custom });
  return columns;
}

function syncClear() {
  $('#clear').disabled = !($('#files').files && $('#files').files.length);
}

function renderRejected(rejected) {
  const box = $('#rejected');
  box.replaceChildren();
  if (!rejected.length) return;
  box.append(h('h2', null, 'Rejected'));
  const list = h('ul');
  for (const item of rejected) list.append(h('li', null, `${item.filename}: ${item.message}`));
  box.append(list);
}

function render() {
  const out = $('#out');
  out.replaceChildren();

  if (!chosen.length) {
    $('#rejected').replaceChildren();
    setStatus(marketNote, false);
    return;
  }

  let postage;
  try {
    postage = postageValue();
  } catch (error) {
    $('#rejected').replaceChildren();
    setStatus(error.message, true);
    return;
  }

  let custom;
  try {
    custom = customRate();
  } catch (error) {
    $('#rejected').replaceChildren();
    setStatus(error.message, true);
    return;
  }

  const planned = planBatch(chosen, { postage });
  renderRejected(planned.rejected);

  const estimated = planned.accepted.length;
  const skipped = planned.rejected.length;
  const summary = [];
  if (estimated) summary.push(estimated === 1 ? '1 file estimated.' : `${formatNum(estimated)} files estimated.`);
  if (skipped) summary.push(skipped === 1 ? '1 file rejected.' : `${formatNum(skipped)} files rejected.`);
  if (marketNote) summary.push(marketNote);
  setStatus(summary.join(' '), estimated === 0);

  if (!estimated) return;

  const columns = rateColumns(market.fees, custom);
  const columnCosts = columns.map((column) => batchCost(planned.batches, column.rate));
  const combined = planned.combined;

  out.append(h('h2', null, 'Batch'));
  const table = h('table');
  const head = h('thead');
  const headRow = h('tr');
  for (const label of ['File', 'Content type', 'Body bytes', 'Envelope bytes']) {
    headRow.append(h('th', { scope: 'col' }, label));
  }
  head.append(headRow);

  const body = h('tbody');
  for (const row of planned.accepted) {
    const tr = h('tr');
    tr.append(
      h('td', null, row.filename),
      h('td', null, row.contentType),
      h('td', { class: 'num' }, formatNum(row.bodyBytes)),
      h('td', { class: 'num' }, formatNum(row.envelopeBytes)),
    );
    body.append(tr);
  }
  table.append(head, body);

  const wrap = h('div', { class: 'tablewrap' });
  wrap.append(table);
  out.append(wrap);
  const revealLine = `One commit of ${formatNum(combined.commitVbytes)} vbytes and one reveal of ${formatNum(combined.revealWeight)} weight units (${formatNum(combined.revealVbytes)} vbytes), ${formatNum(combined.count)} postage outputs.`;
  out.append(h('p', null, revealLine));
  if (planned.batches.length > 1) {
    const parts = planned.batches.map((batch, index) => {
      const names = batch.files.map((file) => file.filename).join(', ');
      return `Batch ${index + 1}: ${names}, reveal weight ${formatNum(batch.revealWeight)}.`;
    });
    out.append(h('p', null, `That reveal is over 400,000 weight units. Split it into ${formatNum(planned.batches.length)} batches. ${parts.join(' ')} The cost below is those batches added, one commit and one reveal each.`));
  } else if (combined.weightClass === 'warn') {
    out.append(h('p', null, `Reveal weight is ${formatNum(combined.revealWeight)}. ${formatNum(SAFE_TX_WEIGHT)} weight units should be safe.`));
  }
  out.append(h('p', null, `Batch cost is ceil(commit vbytes × sat/vB) + ceil(reveal vbytes × sat/vB) + postage, summed across the batches above. Postage is ${formatNum(postage)} sats on each output, ${formatNum(planned.totals.postage)} sats in total.`));
  if (columns.length) {
    const bits = columns.map((column, index) => `${column.label} (${formatRate(column.rate)} sat/vB) ${formatNum(columnCosts[index].total)} sats`);
    out.append(h('p', null, bits.join('. ') + '.'));
  }
  if (!columns.length) {
    out.append(h('p', null, 'Recommended rates did not load. Enter a custom sat/vB to see a cost.'));
  }
  if (market.usd != null && columns.length) {
    const parts = columns.map((column, index) => {
      const dollars = satsToUsd(columnCosts[index].total, market.usd);
      return `${column.label} ${formatUsd(dollars)}`;
    });
    out.append(h('p', null, `USD at $${formatNum(market.usd)} per BTC: ${parts.join(', ')}.`));
  }
}

async function onFiles() {
  const gen = ++generation;
  const list = $('#files').files ? [...$('#files').files] : [];
  syncClear();
  if (!list.length) {
    chosen = [];
    render();
    return;
  }
  setStatus('Reading files.', false);
  const next = [];
  for (const file of list) {
    if (gen !== generation) return;
    if (file.size > MAX_STANDARD_TX_WEIGHT) {
      next.push({ name: file.name, type: file.type, size: file.size, bytes: new Uint8Array(0), error: `File is ${file.size} bytes. A reveal carrying that body is over Bitcoin Core's 400,000 weight-unit standardness cap. ord refuses that reveal unless --no-limit is used.` });
      continue;
    }
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (gen !== generation) return;
      next.push({ name: file.name, type: file.type, size: file.size, bytes });
    } catch (error) {
      if (gen !== generation) return;
      next.push({
        name: file.name,
        type: file.type,
        size: file.size,
        bytes: new Uint8Array(0),
        error: error instanceof Error ? error.message : 'Could not read this file.',
      });
    }
  }
  if (gen !== generation) return;
  chosen = next;
  render();
}

function clearFiles() {
  generation += 1;
  $('#files').value = '';
  chosen = [];
  syncClear();
  render();
}

async function boot() {
  render();
  try {
    market = await loadMarket();
  } catch {
    market = { fees: null, usd: null };
  }
  if (!market.fees && market.usd == null) marketNote = 'mempool.space did not answer. A custom sat/vB still works.';
  else if (!market.fees) marketNote = 'Recommended rates did not load. A custom sat/vB still works.';
  else if (market.usd == null) marketNote = 'USD price did not load. Satoshis are still shown.';
  else marketNote = '';
  render();
}

$('#files').addEventListener('change', () => { onFiles(); });
$('#clear').addEventListener('click', clearFiles);
$('#postage').addEventListener('input', () => { render(); });
$('#rate').addEventListener('input', () => { render(); });
$('#postage').value = String(POSTAGE_DEFAULT);
syncClear();
boot();
