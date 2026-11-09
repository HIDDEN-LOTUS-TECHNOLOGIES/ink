// Browser-direct reads of the official ordinals.com recursive endpoints.
// No HTML scraping, no indexer, no API key.

import { parseInscriptionId } from './inscriptionId.js';
import { decodeMetadataHex, traitsFromValue } from './metadata.js';

export const ORDINALS_ORIGIN = 'https://ordinals.com';
export const TEXT_PREVIEW_LIMIT = 65536;
export const HTML_PREVIEW_LIMIT = 2_000_000;

export function pageIndex(value) {
  if (value == null || value === '') return 0;
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isInteger(n) || n < 0 || n > 100000) return 0;
  return n;
}

function canonicalId(id) {
  const parsed = parseInscriptionId(id);
  if (!parsed) throw new Error('That is not an inscription id.');
  return parsed.id;
}

function ordinalsUrl(path) {
  const url = new URL(path, ORDINALS_ORIGIN);
  if (url.origin !== ORDINALS_ORIGIN) throw new Error('Refused non-ordinals.com URL.');
  if (url.protocol !== 'https:') throw new Error('Refused non-HTTPS endpoint.');
  return url.toString();
}

export function inscriptionUrl(id) {
  return ordinalsUrl(`/r/inscription/${canonicalId(id)}`);
}

export function metadataUrl(id) {
  return ordinalsUrl(`/r/metadata/${canonicalId(id)}`);
}

export function contentUrl(id) {
  return ordinalsUrl(`/content/${canonicalId(id)}`);
}

export function childrenUrl(id, page = 0) {
  const canonical = canonicalId(id);
  const n = pageIndex(page);
  return ordinalsUrl(n === 0 ? `/r/children/${canonical}` : `/r/children/${canonical}/${n}`);
}

export function parentsUrl(id, page = 0) {
  const canonical = canonicalId(id);
  const n = pageIndex(page);
  return ordinalsUrl(n === 0 ? `/r/parents/${canonical}` : `/r/parents/${canonical}/${n}`);
}

function finiteOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function delegateId(value) {
  if (typeof value !== 'string' || !value) return '';
  return parseInscriptionId(value)?.id || '';
}

export function parseInscription(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Unexpected inscription record.');
  const parsed = parseInscriptionId(body.id);
  if (!parsed) throw new Error('Inscription record has no id.');
  if (typeof body.number !== 'number' || !Number.isFinite(body.number)) throw new Error('Inscription record has no number.');
  const contentType = body.content_type == null ? '' : body.content_type;
  if (typeof contentType !== 'string') throw new Error('Unexpected content type.');
  const contentLength = body.content_length == null ? null : body.content_length;
  if (contentLength != null && (typeof contentLength !== 'number' || !Number.isFinite(contentLength) || contentLength < 0)) {
    throw new Error('Unexpected content length.');
  }
  return {
    id: parsed.id,
    number: body.number,
    contentType,
    contentLength,
    delegate: delegateId(body.delegate),
    fee: finiteOrNull(body.fee),
    height: finiteOrNull(body.height),
    timestamp: finiteOrNull(body.timestamp),
    address: typeof body.address === 'string' ? body.address : '',
    sat: finiteOrNull(body.sat),
    satpoint: typeof body.satpoint === 'string' ? body.satpoint : '',
    output: typeof body.output === 'string' ? body.output : '',
    value: finiteOrNull(body.value),
    charms: Array.isArray(body.charms) ? body.charms.filter((charm) => typeof charm === 'string') : [],
  };
}

export function parseIdPage(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || !Array.isArray(body.ids)) {
    throw new Error('Unexpected inscription id page.');
  }
  const ids = body.ids.map((id) => {
    const parsed = typeof id === 'string' ? parseInscriptionId(id) : null;
    if (!parsed) throw new Error('Unexpected inscription id in page.');
    return parsed.id;
  });
  const page = Number.isInteger(body.page) ? body.page : Number.isInteger(body.page_index) ? body.page_index : null;
  if (page == null || page < 0) throw new Error('Unexpected inscription id page.');
  if (typeof body.more !== 'boolean') throw new Error('Unexpected inscription id page.');
  return { ids, more: body.more, page };
}

export function previewPlan(record) {
  const url = contentUrl(record.id);
  const contentType = String(record.contentType || '').split(';')[0].trim().toLowerCase();
  const length = record.contentLength;
  if (length === 0) return { kind: 'empty', url, contentType };
  if (contentType.startsWith('image/')) return { kind: 'image', url, contentType };
  if (contentType.startsWith('audio/')) return { kind: 'audio', url, contentType };
  if (contentType.startsWith('video/')) return { kind: 'video', url, contentType };
  if (contentType === 'text/html' || contentType === 'application/xhtml+xml') {
    if (length != null && length > HTML_PREVIEW_LIMIT) return { kind: 'link', url, contentType };
    return { kind: 'html', url, contentType };
  }
  const textual = contentType.startsWith('text/')
    || contentType === 'application/json'
    || contentType.endsWith('+json')
    || contentType === 'application/javascript'
    || contentType === 'text/javascript'
    || contentType === 'application/xml'
    || contentType.endsWith('+xml');
  if (textual && length != null && length <= TEXT_PREVIEW_LIMIT) return { kind: 'text', url, contentType };
  return { kind: 'link', url, contentType };
}

function blankMeta() {
  return { name: '', description: '', traits: [], error: '' };
}

function fail(message, code) {
  const err = new Error(message);
  err.code = code;
  return err;
}

async function readJson(res, label) {
  const text = await res.text();
  if (!res.ok) return { ok: false, status: res.status };
  try {
    return { ok: true, status: res.status, body: JSON.parse(text) };
  } catch {
    throw fail(`ordinals.com did not return ${label} JSON.`, 'bad-json');
  }
}

async function readMetadata(fetchImpl, id) {
  try {
    const res = await fetchImpl(metadataUrl(id));
    if (res.status === 404) return blankMeta();
    const payload = await readJson(res, 'metadata');
    if (!payload.ok) return { ...blankMeta(), error: `ordinals.com returned ${payload.status} for metadata.` };
    const body = payload.body;
    if (body == null || body === '') return blankMeta();
    if (typeof body !== 'string') throw new Error('Metadata response was not a hex string.');
    const value = decodeMetadataHex(body);
    if (value == null) return blankMeta();
    return { ...traitsFromValue(value), error: '' };
  } catch (err) {
    return { ...blankMeta(), error: err.message || 'Metadata could not be decoded.' };
  }
}

async function readIdPage(fetchImpl, url) {
  try {
    const res = await fetchImpl(url);
    const payload = await readJson(res, 'id page');
    if (!payload.ok) return { ids: [], more: false, page: 0, error: `ordinals.com returned ${payload.status}.` };
    return { ...parseIdPage(payload.body), error: '' };
  } catch (err) {
    return { ids: [], more: false, page: 0, error: err.message || 'Could not read the id list.' };
  }
}

export async function lookupInscription(raw, options = {}) {
  const parsed = parseInscriptionId(raw);
  if (!parsed) throw fail('That is not an inscription id.', 'bad-id');
  const fetchImpl = options.fetch ?? globalThis.fetch;
  const childPage = pageIndex(options.childPage ?? 0);
  const parentPage = pageIndex(options.parentPage ?? 0);
  const id = parsed.id;

  const [inscriptionRes, metadata, children, parents] = await Promise.all([
    fetchImpl(inscriptionUrl(id)),
    readMetadata(fetchImpl, id),
    readIdPage(fetchImpl, childrenUrl(id, childPage)),
    readIdPage(fetchImpl, parentsUrl(id, parentPage)),
  ]);

  if (inscriptionRes.status === 404) throw fail('No inscription with that id.', 'not-found');
  const inscriptionPayload = await readJson(inscriptionRes, 'inscription');
  if (!inscriptionPayload.ok) throw fail(`ordinals.com returned ${inscriptionPayload.status} for the inscription.`, 'http');
  const record = parseInscription(inscriptionPayload.body);
  return {
    id: record.id,
    txid: parsed.txid,
    record,
    metadata,
    children,
    parents,
    preview: previewPlan(record),
  };
}
