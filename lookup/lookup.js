import { parseInscriptionId } from './inscriptionId.js';
import { explorerTxUrl, lookupMempool } from './mempool.js';
import { lookupInscription } from './ordinals.js';

const SAMPLE = 'b1ef66c2d1a047cbaa6260b74daac43813924378fe08ef8545da4cb79e8fcf00i0';
const $ = (s) => document.querySelector(s);

let ticket = 0;

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

function formatTime(sec) {
  const date = new Date(sec * 1000);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().replace('.000Z', 'Z');
}

function formatRate(n) {
  if (!Number.isFinite(n)) return '';
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function externalLink(url, label) {
  let parsed;
  try { parsed = new URL(url); } catch { return null; }
  if (parsed.protocol !== 'https:') return null;
  if (parsed.hostname !== 'ordinals.com' && parsed.hostname !== 'mempool.space') return null;
  return h('a', { class: 'btn', href: parsed.toString(), target: '_blank', rel: 'noopener noreferrer' }, label);
}

function lookupHref(id, childPage, parentPage) {
  const params = new URLSearchParams();
  params.set('id', id);
  if (childPage) params.set('page', String(childPage));
  if (parentPage) params.set('parents', String(parentPage));
  return `?${params}`;
}

function pageNote(group, noun) {
  if (group.error) return group.error;
  if (!group.ids.length) return group.page ? `No ${noun} on this page.` : `No ${noun}.`;
  if (group.more) return `Showing ${group.ids.length}. More remain.`;
  if (group.page) return `Showing ${group.ids.length} on this page.`;
  return `Showing ${group.ids.length}.`;
}

function idList(ids) {
  if (!ids.length) return null;
  const list = h('ul', { class: 'idlist' });
  for (const id of ids) {
    const parsed = parseInscriptionId(id);
    if (!parsed) continue;
    const item = h('li');
    item.append(h('a', { href: lookupHref(parsed.id, 0, 0), 'data-lookup': '1' }, parsed.id));
    list.append(item);
  }
  return list.childElementCount ? list : null;
}

function pager(id, childPage, parentPage, group, which) {
  const page = which === 'children' ? childPage : parentPage;
  if (!page && !group.more) return null;
  const row = h('p', { class: 'row' });
  if (page > 0) {
    const prevChild = which === 'children' ? page - 1 : childPage;
    const prevParent = which === 'parents' ? page - 1 : parentPage;
    row.append(h('a', { class: 'btn', href: lookupHref(id, prevChild, prevParent), 'data-lookup': '1' }, 'Previous'));
  }
  if (group.more) {
    const nextChild = which === 'children' ? page + 1 : childPage;
    const nextParent = which === 'parents' ? page + 1 : parentPage;
    row.append(h('a', { class: 'btn', href: lookupHref(id, nextChild, nextParent), 'data-lookup': '1' }, 'Next'));
  }
  return row.childElementCount ? row : null;
}

function factsTable(result) {
  const rec = result.record;
  const rows = [
    ['Number', formatNum(rec.number)],
    ['Content type', rec.contentType || 'unknown'],
    ['Content length', rec.contentLength == null ? 'unknown' : `${formatNum(rec.contentLength)} bytes`],
    ['Id', result.id],
  ];
  if (rec.height != null) rows.push(['Block', formatNum(rec.height)]);
  if (rec.timestamp != null && formatTime(rec.timestamp)) rows.push(['Time', formatTime(rec.timestamp)]);
  if (rec.address) rows.push(['Address', rec.address]);
  if (rec.satpoint) rows.push(['Satpoint', rec.satpoint]);
  if (rec.sat != null) rows.push(['Sat', formatNum(rec.sat)]);
  if (rec.value != null) rows.push(['Output value', `${formatNum(rec.value)} sats`]);
  if (rec.fee != null) rows.push(['Fee', `${formatNum(rec.fee)} sats`]);
  if (rec.charms.length) rows.push(['Charms', rec.charms.join(', ')]);

  const table = h('table');
  const body = h('tbody');
  for (const [label, value] of rows) {
    const tr = h('tr');
    tr.append(h('td', null, label), h('td', null, value));
    body.append(tr);
  }
  if (rec.delegate) {
    const tr = h('tr');
    const td = h('td');
    td.append(h('a', { href: lookupHref(rec.delegate, 0, 0), 'data-lookup': '1' }, rec.delegate));
    tr.append(h('td', null, 'Delegate'), td);
    body.append(tr);
  }
  table.append(body);
  return table;
}

function previewNode(result) {
  const box = h('div', { class: 'preview' });
  const { kind, url } = result.preview;
  if (kind === 'image') box.append(h('img', { src: url, alt: 'Inscription content' }));
  else if (kind === 'audio') box.append(h('audio', { controls: 'controls', src: url }));
  else if (kind === 'video') box.append(h('video', { controls: 'controls', src: url }));
  else if (kind === 'html') {
    box.append(h('iframe', {
      sandbox: 'allow-scripts allow-same-origin',
      title: 'Inscription content',
      src: url,
    }));
  } else if (kind === 'text') box.append(h('pre', { id: 'previewText' }, 'Loading content…'));
  else if (kind === 'empty') box.append(h('p', null, 'No content body.'));
  else box.append(h('p', null, 'This content type is not previewed inline.'));

  const links = h('p', { class: 'row' });
  const content = externalLink(url, 'Open content');
  const inscription = externalLink(`https://ordinals.com/inscription/${result.id}`, 'Open on ordinals.com');
  if (content) links.append(content);
  if (inscription) links.append(inscription);
  box.append(links);
  return box;
}

function traitTable(traits) {
  const table = h('table');
  const head = h('thead');
  const hr = h('tr');
  hr.append(h('th', null, 'Trait'), h('th', null, 'Value'));
  head.append(hr);
  const body = h('tbody');
  for (const trait of traits) {
    const tr = h('tr');
    tr.append(h('td', null, trait.trait), h('td', null, trait.value));
    body.append(tr);
  }
  table.append(head, body);
  return table;
}

function metadataNode(metadata) {
  const nodes = [];
  if (metadata.error) nodes.push(h('p', { class: 'error' }, metadata.error));
  if (metadata.name) nodes.push(h('p', { class: 'name' }, metadata.name));
  if (metadata.description) nodes.push(h('p', null, metadata.description));
  if (metadata.traits.length) nodes.push(traitTable(metadata.traits));
  else if (!metadata.error) nodes.push(h('p', null, metadata.name || metadata.description ? 'No traits.' : 'No metadata.'));
  return nodes;
}

function relationSection(title, noun, group, id, childPage, parentPage, which) {
  return section(
    title,
    h('p', { class: group.error ? 'error' : 'meta' }, pageNote(group, noun)),
    idList(group.ids),
    pager(id, childPage, parentPage, group, which),
  );
}

function section(title, ...nodes) {
  const box = h('section');
  box.append(h('h2', null, title));
  for (const node of nodes) {
    if (!node) continue;
    if (Array.isArray(node)) node.forEach((child) => child && box.append(child));
    else box.append(node);
  }
  return box;
}

function renderChain(txid, extra) {
  const box = $('#chain');
  if (!box) return;
  box.replaceChildren(h('h2', null, 'Mempool'));
  const link = externalLink(explorerTxUrl(txid), 'Reveal transaction on mempool.space');
  if (link) {
    const row = h('p', { class: 'row' });
    row.append(link);
    box.append(row);
  }
  if (!extra) return;
  if (extra.tx) {
    const where = extra.tx.confirmed && extra.tx.blockHeight != null
      ? `Confirmed in block ${formatNum(extra.tx.blockHeight)}`
      : 'In the mempool';
    const rate = extra.tx.feeRate == null ? '' : ` · ${formatRate(extra.tx.feeRate)} sat/vB`;
    box.append(h('p', { class: 'meta' }, `${where}${rate}.`));
  }
  if (extra.fees) {
    const fees = extra.fees;
    box.append(h('p', { class: 'meta' }, `Mainnet fees now: fastest ${fees.fastestFee}, half hour ${fees.halfHourFee}, hour ${fees.hourFee} sat/vB.`));
  }
}

function render(result, childPage, parentPage) {
  const out = $('#out');
  out.replaceChildren(
    section('Inscription', previewNode(result), factsTable(result)),
    section('Metadata', metadataNode(result.metadata)),
    relationSection('Children', 'children', result.children, result.id, childPage, parentPage, 'children'),
    relationSection('Parents', 'parents', result.parents, result.id, childPage, parentPage, 'parents'),
  );
  out.append(h('section', { id: 'chain' }));
  renderChain(result.txid, null);
}

async function fillChain(txid, mine) {
  try {
    const extra = await lookupMempool(txid);
    if (mine !== ticket) return;
    renderChain(txid, extra);
  } catch {
    // The reveal link is already shown. Fees are optional.
  }
}

async function fillText(result, mine) {
  if (result.preview.kind !== 'text') return;
  const pre = $('#previewText');
  if (!pre) return;
  try {
    const res = await fetch(result.preview.url);
    if (!res.ok) throw new Error('content');
    const buf = await res.arrayBuffer();
    if (mine !== ticket) return;
    const cap = 65536;
    const slice = buf.byteLength > cap ? buf.slice(0, cap) : buf;
    const text = new TextDecoder().decode(slice);
    pre.textContent = buf.byteLength > cap ? `${text}\n…` : text;
  } catch {
    if (mine !== ticket) return;
    pre.textContent = 'Content could not be loaded.';
  }
}

function currentPages() {
  const params = new URLSearchParams(location.search);
  return {
    raw: params.get('id'),
    childPage: params.get('page'),
    parentPage: params.get('parents'),
  };
}

async function loadFromQuery() {
  const mine = ++ticket;
  const { raw, childPage, parentPage } = currentPages();
  if (raw == null || raw === '') {
    $('#out').replaceChildren();
    setStatus('', false);
    document.title = 'INK inscription lookup';
    return;
  }
  const parsed = parseInscriptionId(raw);
  $('#inscriptionId').value = parsed ? parsed.id : raw;
  if (!parsed) {
    $('#out').replaceChildren();
    setStatus('That is not an inscription id. Use 64 hex characters, i, and the index.', true);
    document.title = 'INK inscription lookup';
    return;
  }
  setStatus('Looking up…', false);
  $('#go').disabled = true;
  document.body.setAttribute('aria-busy', 'true');
  try {
    const result = await lookupInscription(parsed.id, { childPage, parentPage });
    if (mine !== ticket) return;
    const child = result.children.page || 0;
    const parent = result.parents.page || 0;
    render(result, child, parent);
    setStatus(`Inscription #${formatNum(result.record.number)}`, false);
    document.title = `Inscription #${formatNum(result.record.number)} · INK`;
    fillChain(result.txid, mine);
    fillText(result, mine);
  } catch (err) {
    if (mine !== ticket) return;
    $('#out').replaceChildren();
    setStatus(err instanceof TypeError ? 'Could not reach ordinals.com.' : err.message, true);
    document.title = 'INK inscription lookup';
  } finally {
    if (mine === ticket) {
      $('#go').disabled = false;
      document.body.removeAttribute('aria-busy');
    }
  }
}

function visit(id, childPage, parentPage) {
  const url = new URL(location.href);
  url.search = lookupHref(id, childPage, parentPage);
  if (`${url.pathname}${url.search}` !== `${location.pathname}${location.search}`) history.pushState(null, '', url);
  return loadFromQuery();
}

$('#form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const parsed = parseInscriptionId($('#inscriptionId').value);
  if (!parsed) {
    setStatus('That is not an inscription id. Use 64 hex characters, i, and the index.', true);
    return;
  }
  visit(parsed.id, 0, 0);
});

$('#sample').addEventListener('click', () => {
  $('#inscriptionId').value = SAMPLE;
  visit(SAMPLE, 0, 0);
});

document.addEventListener('click', (ev) => {
  if (ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
  const link = ev.target.closest('a[data-lookup]');
  if (!link) return;
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin || url.pathname !== location.pathname) return;
  ev.preventDefault();
  history.pushState(null, '', `${url.pathname}${url.search}`);
  loadFromQuery();
});

window.addEventListener('popstate', () => { loadFromQuery(); });

loadFromQuery();
