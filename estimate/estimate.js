import { contentFromFile, contentFromText, MAX_BODY } from './content.js';
import { loadMarket, RATE_ROWS } from './rates.js';
import { estimateInscription, parseFeeRate, parsePostage, POSTAGE_DEFAULT, satsToUsd, totalCost } from './size.js';

const $ = (s) => document.querySelector(s);

let fileChoice = null;
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

function clearOut() {
  $('#out').replaceChildren();
}

function syncClear() {
  const chosen = $('#file').files && $('#file').files.length;
  $('#clear').disabled = !chosen;
}

function addSection(parent, title) {
  parent.append(h('h2', null, title));
}

function scrollTable(table) {
  const wrap = h('div', { class: 'tablewrap' });
  wrap.append(table);
  return wrap;
}

function factTable(rows) {
  const table = h('table');
  const body = h('tbody');
  for (const [label, value] of rows) {
    const tr = h('tr');
    tr.append(h('td', null, label), h('td', null, value));
    body.append(tr);
  }
  table.append(body);
  return table;
}

function currentContent() {
  if (fileChoice) return fileChoice;
  const text = $('#text').value;
  if (!text) return null;
  return contentFromText(text);
}

function postageValue() {
  return parsePostage($('#postage').value);
}

function customRate() {
  const raw = $('#rate').value.trim();
  if (!raw) return null;
  return parseFeeRate(raw);
}

function costLabel(cost, usd) {
  const sats = `${formatNum(cost.total)} sats`;
  const dollars = satsToUsd(cost.total, usd);
  return dollars == null ? sats : `${sats} (${formatUsd(dollars)})`;
}

function render() {
  const out = $('#out');
  out.replaceChildren();
  let content;
  try {
    content = currentContent();
  } catch (error) {
    setStatus(error.message, true);
    return;
  }
  if (!content) {
    setStatus(marketNote, false);
    return;
  }

  let postage;
  try {
    postage = postageValue();
  } catch (error) {
    setStatus(error.message, true);
    return;
  }

  let custom;
  try {
    custom = customRate();
  } catch (error) {
    setStatus(error.message, true);
    return;
  }

  const measured = estimateInscription({
    body: content.body,
    contentType: content.contentType,
    postage,
  });
  const source = fileChoice ? `Using ${content.label}.` : 'Using typed text.';
  setStatus([source, marketNote].filter(Boolean).join(' '), false);

  addSection(out, 'Size');
  out.append(scrollTable(factTable([
    ['Content type', measured.contentType],
    ['Body', `${formatNum(measured.bodyBytes)} bytes`],
    ['Envelope script', `${formatNum(measured.scriptBytes)} bytes`],
    ['Witness', `${formatNum(measured.witnessBytes)} bytes`],
    ['Commit transaction', `${formatNum(measured.commitVbytes)} vbytes`],
    ['Reveal transaction', `${formatNum(measured.revealVbytes)} vbytes`],
    ['Total', `${formatNum(measured.totalVbytes)} vbytes`],
    ['Postage', `${formatNum(measured.postage)} sats`],
  ])));
  out.append(h('p', null, `Witness discount: the reveal witness is ${formatNum(measured.witnessBytes)} bytes and adds ${formatNum(measured.witnessBytes)} to the weight, not ${formatNum(measured.witnessBytes * 4)}. Weight is ${formatNum(measured.revealBaseWeight)} + ${formatNum(measured.witnessBytes)} = ${formatNum(measured.revealWeight)}. Reveal vbytes = ceil(${formatNum(measured.revealWeight)} / 4) = ${formatNum(measured.revealVbytes)}.`));

  addSection(out, 'Cost');
  const table = h('table');
  const head = h('thead');
  const headRow = h('tr');
  for (const label of ['Rate', 'sat/vB', 'Commit fee', 'Reveal fee', 'Total']) {
    headRow.append(h('th', null, label));
  }
  head.append(headRow);
  const body = h('tbody');
  const rows = [];
  if (market.fees) {
    for (const [key, label] of RATE_ROWS) rows.push([label, market.fees[key]]);
  }
  if (custom != null) rows.push(['Custom', custom]);
  for (const [label, rate] of rows) {
    const cost = totalCost(measured, rate);
    const tr = h('tr');
    tr.append(
      h('td', null, label),
      h('td', null, formatRate(rate)),
      h('td', null, `${formatNum(cost.commitFee)} sats`),
      h('td', null, `${formatNum(cost.revealFee)} sats`),
      h('td', null, costLabel(cost, market.usd)),
    );
    body.append(tr);
  }
  table.append(head, body);
  out.append(scrollTable(table));
  if (!market.fees && custom == null) {
    out.append(h('p', null, 'Recommended rates did not load. Enter a custom sat/vB to see a cost.'));
  }
  out.append(h('p', null, `Total sats = ceil(${formatNum(measured.commitVbytes)} × sat/vB) + ceil(${formatNum(measured.revealVbytes)} × sat/vB) + ${formatNum(measured.postage)} postage.`));
  if (market.usd) {
    out.append(h('p', { class: 'meta' }, `USD uses $${formatNum(market.usd)} per BTC from mempool.space.`));
  }
}

async function onFile() {
  const file = $('#file').files && $('#file').files[0];
  fileChoice = null;
  syncClear();
  if (!file) {
    render();
    return;
  }
  if (file.size > MAX_BODY) {
    clearOut();
    $('#file').value = '';
    syncClear();
    setStatus(`File is ${file.size} bytes. The limit is ${MAX_BODY} bytes.`, true);
    return;
  }
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    fileChoice = contentFromFile({ name: file.name, type: file.type, bytes, size: file.size });
    render();
  } catch (error) {
    fileChoice = null;
    clearOut();
    setStatus(error.message, true);
  }
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

$('#file').addEventListener('change', () => { onFile(); });
$('#clear').addEventListener('click', () => {
  $('#file').value = '';
  fileChoice = null;
  syncClear();
  render();
});
$('#text').addEventListener('input', () => { render(); });
$('#postage').addEventListener('input', () => { render(); });
$('#rate').addEventListener('input', () => { render(); });
$('#postage').value = String(POSTAGE_DEFAULT);
syncClear();
boot();
