import { batchCost, planBatch } from './batch.js';
import { MAX_BODY } from '../estimate/content.js';
import { loadMarket, RATE_ROWS } from '../estimate/rates.js';
import { parseFeeRate, parsePostage, POSTAGE_DEFAULT, satsToUsd, totalCost } from '../estimate/size.js';

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

function fileCountLabel(count) {
  return count === 1 ? '1 file' : `${formatNum(count)} files`;
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
  const columnCosts = columns.map((column) => batchCost(planned.accepted, column.rate));

  out.append(h('h2', null, 'Batch'));
  const table = h('table');
  const head = h('thead');
  const headRow = h('tr');
  const labels = ['File', 'Content type', 'Body bytes', 'Envelope bytes', 'Witness bytes', 'Commit vbytes', 'Reveal vbytes', 'Total vbytes'];
  for (const label of labels) headRow.append(h('th', { scope: 'col' }, label));
  for (const column of columns) {
    headRow.append(h('th', { class: 'num', scope: 'col' }, `${column.label} (${formatRate(column.rate)} sat/vB)`));
  }
  head.append(headRow);

  const body = h('tbody');
  for (const row of planned.accepted) {
    const tr = h('tr');
    tr.append(
      h('td', null, row.filename),
      h('td', null, row.contentType),
      h('td', { class: 'num' }, formatNum(row.bodyBytes)),
      h('td', { class: 'num' }, formatNum(row.scriptBytes)),
      h('td', { class: 'num' }, formatNum(row.witnessBytes)),
      h('td', { class: 'num' }, formatNum(row.commitVbytes)),
      h('td', { class: 'num' }, formatNum(row.revealVbytes)),
      h('td', { class: 'num' }, formatNum(row.totalVbytes)),
    );
    for (const column of columns) {
      tr.append(h('td', { class: 'num' }, `${formatNum(totalCost(row, column.rate).total)} sats`));
    }
    body.append(tr);
  }

  const foot = h('tfoot');
  const totalRow = h('tr');
  totalRow.append(
    h('th', { scope: 'row' }, fileCountLabel(planned.totals.count)),
    h('td', null, '—'),
    h('td', { class: 'num' }, formatNum(planned.totals.bodyBytes)),
    h('td', { class: 'num' }, formatNum(planned.totals.scriptBytes)),
    h('td', { class: 'num' }, formatNum(planned.totals.witnessBytes)),
    h('td', { class: 'num' }, formatNum(planned.totals.commitVbytes)),
    h('td', { class: 'num' }, formatNum(planned.totals.revealVbytes)),
    h('td', { class: 'num' }, formatNum(planned.totals.totalVbytes)),
  );
  for (const cost of columnCosts) {
    totalRow.append(h('td', { class: 'num' }, `${formatNum(cost.total)} sats`));
  }
  foot.append(totalRow);
  table.append(head, body, foot);

  const wrap = h('div', { class: 'tablewrap' });
  wrap.append(table);
  out.append(wrap);
  out.append(h('p', null, `Each file total is ceil(commit vbytes × sat/vB) + ceil(reveal vbytes × sat/vB) + ${formatNum(postage)} postage. The totals row adds those file totals. Postage in the batch is ${formatNum(planned.totals.postage)} sats.`));
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
    if (file.size > MAX_BODY) {
      next.push({ name: file.name, type: file.type, size: file.size });
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
