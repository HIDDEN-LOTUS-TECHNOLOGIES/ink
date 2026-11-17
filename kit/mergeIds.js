// Pair an ids file with a traits file. Nothing here signs or sends a request.
// Ids: one inscription id per line, a JSON array of ids, or a JSON array of {id} objects.
// Traits: a CSV with a header, a JSON array, or an object keyed by inscription id or by number.
// Join by inscription id when any trait row has an id. Otherwise join by number, or by row order.
// An inscription id matches /^[0-9a-f]{64}i[0-9]+$/. Uppercase hex is malformed.

import { toIdList, toMagicEden, toUnisatInscriptions, toUnisatMeta } from './convert.js';
import { parseCSVLine } from './metadataCsv.js';
import { MetadataValidator } from './metadataValidator.js';

export const INSCRIPTION_ID_RE = /^[0-9a-f]{64}i[0-9]+$/;
export const ORDER_WARNING = 'Traits file has no inscription ids. Joined by row order: the first trait row pairs with the first id.';
export const NUMBER_WARNING = 'Traits file has no inscription ids. Joined by number: number 1 pairs with the first id.';
export const INDEX_WARNING = 'Traits file has no inscription ids. Joined by index: index 0 pairs with the first id.';

const THUMB_KEYS = ['high_res_img_url', 'collection_page_img_url'];
const RESERVED = new Set([
  'id', 'inscription_id', 'inscription', 'name', 'n', 'number', 'index', 'score',
  'file', 'meta', 'attributes', 'traits', 't', ...THUMB_KEYS,
]);

function stripBom(text) {
  return String(text ?? '').replace(/^\uFEFF/, '');
}

function linesOf(text) {
  return stripBom(text).split(/\r?\n/);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function ownEntries(obj) {
  const out = [];
  for (const key of Object.keys(obj)) out.push([key, obj[key]]);
  return out;
}

function cleanTraits(map) {
  const t = {};
  if (!isPlainObject(map)) return t;
  for (const [key, value] of ownEntries(map)) {
    if (value == null || value === '') continue;
    if (typeof value === 'object') continue;
    t[key] = value;
  }
  return t;
}

function traitsFromAttributes(attrs) {
  const t = {};
  if (!Array.isArray(attrs)) return t;
  for (const attr of attrs) {
    if (!attr || attr.trait_type == null || String(attr.trait_type).trim() === '') continue;
    if (attr.value == null) continue;
    t[String(attr.trait_type)] = attr.value;
  }
  return t;
}

function field(obj, names) {
  if (!isPlainObject(obj)) return undefined;
  const keys = Object.keys(obj);
  for (const name of names) {
    const key = keys.find((item) => item.toLowerCase() === name);
    if (key == null) continue;
    const value = obj[key];
    if (value == null || value === '') continue;
    return value;
  }
  return undefined;
}

function readNumber(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'boolean') return null;
  const parsed = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
}

function readThumbs(obj) {
  const thumbs = {};
  const meta = isPlainObject(obj.meta) ? obj.meta : null;
  for (const key of THUMB_KEYS) {
    const fromMeta = meta ? field(meta, [key]) : undefined;
    const fromTop = field(obj, [key]);
    const value = fromMeta != null && String(fromMeta).trim() !== '' ? fromMeta : fromTop;
    if (value == null || String(value).trim() === '') continue;
    thumbs[key] = String(value);
  }
  return thumbs;
}

function traitsOf(obj) {
  if (!isPlainObject(obj)) return {};
  if (isPlainObject(obj.t)) return cleanTraits(obj.t);
  const metaAttrs = isPlainObject(obj.meta) ? obj.meta.attributes : undefined;
  if (Array.isArray(metaAttrs) || Array.isArray(obj.attributes)) {
    return traitsFromAttributes(Array.isArray(metaAttrs) ? metaAttrs : obj.attributes);
  }
  if (Array.isArray(obj.traits)) return traitsFromAttributes(obj.traits);
  if (isPlainObject(obj.traits)) return cleanTraits(obj.traits);
  const t = {};
  for (const [key, value] of ownEntries(obj)) {
    if (RESERVED.has(key.toLowerCase())) continue;
    if (value == null || value === '' || typeof value === 'object') continue;
    t[key] = value;
  }
  return t;
}

function nameOf(obj) {
  const metaName = isPlainObject(obj.meta) ? field(obj.meta, ['name']) : undefined;
  const raw = metaName != null ? metaName : field(obj, ['name']);
  if (raw != null && String(raw).trim() !== '') return String(raw).trim();
  const file = field(obj, ['file']);
  if (file == null) return '';
  return String(file).trim();
}

function scoreOf(obj) {
  const raw = field(obj, ['score']);
  if (raw == null || raw === '') return undefined;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

function emptyIds(error) {
  return { ok: false, error, ids: [], malformed: [], duplicates: [] };
}

function classifyIds(entries, source) {
  const ids = [];
  const malformed = [];
  const counts = new Map();
  for (const entry of entries) {
    const value = String(entry.value ?? '').trim();
    if (!INSCRIPTION_ID_RE.test(value)) {
      malformed.push({ value, index: entry.index, source });
      continue;
    }
    counts.set(value, (counts.get(value) || 0) + 1);
    if (counts.get(value) === 1) ids.push(value);
  }
  const duplicates = [];
  for (const [id, count] of counts) {
    if (count > 1) duplicates.push({ id, count, source });
  }
  return { ok: true, error: null, ids, malformed, duplicates };
}

export function parseIdsFile(text) {
  const raw = stripBom(text).trim();
  if (!raw) return emptyIds('Ids file is empty.');
  if (raw.startsWith('[') || raw.startsWith('{')) {
    let data;
    try { data = JSON.parse(raw); }
    catch { return emptyIds('Ids file is not valid JSON.'); }
    if (!Array.isArray(data)) return emptyIds('Ids JSON must be an array of inscription ids or objects with an id.');
    if (data.length === 0) return emptyIds('Ids file is empty.');
    const entries = data.map((item, index) => {
      if (typeof item === 'string') return { value: item, index: index + 1 };
      if (isPlainObject(item)) {
        const id = field(item, ['id', 'inscription_id', 'inscription']);
        return { value: id == null ? '' : String(id), index: index + 1 };
      }
      return { value: item == null ? '' : String(item), index: index + 1 };
    });
    return classifyIds(entries, 'ids');
  }
  const entries = [];
  linesOf(text).forEach((line, index) => {
    if (!line.trim()) return;
    entries.push({ value: line, index: index + 1 });
  });
  if (!entries.length) return emptyIds('Ids file is empty.');
  return classifyIds(entries, 'ids');
}

function rowFromObject(obj, index, idValue, nValue) {
  const id = idValue == null ? '' : String(idValue).trim();
  const n = nValue == null ? readNumber(field(obj, ['n', 'number', 'index'])) : nValue;
  return {
    index,
    id,
    name: nameOf(obj),
    n,
    traits: traitsOf(obj),
    thumbs: readThumbs(obj),
    score: scoreOf(obj),
  };
}

function duplicateTraitIds(rows) {
  const counts = new Map();
  for (const row of rows) {
    if (!INSCRIPTION_ID_RE.test(row.id)) continue;
    counts.set(row.id, (counts.get(row.id) || 0) + 1);
  }
  const duplicates = [];
  for (const [id, count] of counts) {
    if (count > 1) duplicates.push({ id, count, source: 'traits' });
  }
  return duplicates;
}

function finishTraits(rows, malformed) {
  const hasId = rows.some((row) => row.id !== '');
  const numbers = rows.map((row) => row.n).filter((n) => n != null);
  let mode = 'order';
  let warning = ORDER_WARNING;
  if (hasId) {
    mode = 'id';
    warning = null;
  } else if (numbers.length) {
    mode = 'number';
    warning = numbers.some((n) => n === 0) ? INDEX_WARNING : NUMBER_WARNING;
  }
  return {
    ok: true,
    error: null,
    mode,
    warning,
    rows,
    malformed,
    duplicates: duplicateTraitIds(rows),
  };
}

function emptyTraits(error) {
  return { ok: false, error, mode: null, warning: null, rows: [], malformed: [], duplicates: [] };
}

function parseTraitsCsv(text) {
  const physical = [];
  linesOf(text).forEach((line, index) => {
    if (!line.trim()) return;
    physical.push({ line, index: index + 1 });
  });
  if (!physical.length) return emptyTraits('Traits file is empty.');
  const header = parseCSVLine(physical[0].line).map((cell) => cell.trim());
  const cols = header.map((name, i) => ({ name, key: name.toLowerCase(), i }));
  const findCol = (names) => cols.find((col) => names.includes(col.key));
  const idCol = findCol(['id', 'inscription_id', 'inscription']);
  const nameCol = findCol(['name']);
  const nCol = findCol(['n', 'number', 'index']);
  const scoreCol = findCol(['score']);
  const thumbCols = cols.filter((col) => THUMB_KEYS.includes(col.key));
  const reservedKeys = new Set([
    'id', 'inscription_id', 'inscription', 'name', 'n', 'number', 'index', 'score', ...THUMB_KEYS,
  ]);
  const traitCols = cols.filter((col) => col.name && !reservedKeys.has(col.key));
  const rows = [];
  const malformed = [];
  for (const { line, index } of physical.slice(1)) {
    const cells = parseCSVLine(line);
    const id = idCol ? String(cells[idCol.i] ?? '').trim() : '';
    if (id && !INSCRIPTION_ID_RE.test(id)) malformed.push({ value: id, index, source: 'traits' });
    const traits = {};
    for (const col of traitCols) {
      const value = String(cells[col.i] ?? '').trim();
      if (value !== '') traits[col.name] = value;
    }
    const thumbs = {};
    for (const col of thumbCols) {
      const value = String(cells[col.i] ?? '').trim();
      if (value) thumbs[col.key] = value;
    }
    let score;
    if (scoreCol) {
      const raw = String(cells[scoreCol.i] ?? '').trim();
      if (raw !== '' && Number.isFinite(Number(raw))) score = Number(raw);
    }
    rows.push({
      index,
      id,
      name: nameCol ? String(cells[nameCol.i] ?? '').trim() : '',
      n: nCol ? readNumber(cells[nCol.i]) : null,
      traits,
      thumbs,
      score,
    });
  }
  return finishTraits(rows, malformed);
}

function parseTraitsJson(data) {
  if (Array.isArray(data)) {
    if (data.length === 0) return emptyTraits('Traits file is empty.');
    if (!data.every(isPlainObject)) return emptyTraits('Traits JSON array must be objects.');
    const rows = data.map((obj, index) => {
      const id = field(obj, ['id', 'inscription_id', 'inscription']);
      return rowFromObject(obj, index + 1, id == null ? '' : String(id), null);
    });
    const malformed = [];
    for (const row of rows) {
      if (row.id && !INSCRIPTION_ID_RE.test(row.id)) malformed.push({ value: row.id, index: row.index, source: 'traits' });
    }
    return finishTraits(rows, malformed);
  }
  if (!isPlainObject(data)) return emptyTraits('Traits JSON must be an array of objects, or an object keyed by inscription id or number.');
  const keys = Object.keys(data);
  if (!keys.length) return emptyTraits('Traits file is empty.');
  const idKeys = keys.filter((key) => INSCRIPTION_ID_RE.test(key));
  const numKeys = keys.filter((key) => /^[0-9]+$/.test(key));
  const other = keys.filter((key) => !INSCRIPTION_ID_RE.test(key) && !/^[0-9]+$/.test(key));
  if (!idKeys.length && !numKeys.length) {
    return emptyTraits('Traits JSON object must be keyed by inscription id or number.');
  }
  for (const key of keys) {
    if (!isPlainObject(data[key])) return emptyTraits('Traits object values must be objects.');
  }
  const malformed = other.map((key) => ({ value: key, index: keys.indexOf(key) + 1, source: 'traits' }));
  const rows = keys.map((key, index) => {
    const inner = field(data[key], ['id', 'inscription_id', 'inscription']);
    const innerId = inner == null ? '' : String(inner);
    if (INSCRIPTION_ID_RE.test(key)) return rowFromObject(data[key], index + 1, key, null);
    if (/^[0-9]+$/.test(key)) return rowFromObject(data[key], index + 1, innerId, Number(key));
    return rowFromObject(data[key], index + 1, innerId, null);
  });
  for (const row of rows) {
    if (row.id && !INSCRIPTION_ID_RE.test(row.id)) malformed.push({ value: row.id, index: row.index, source: 'traits' });
  }
  return finishTraits(rows, malformed);
}

export function parseTraitsFile(text) {
  const raw = stripBom(text).trim();
  if (!raw) return emptyTraits('Traits file is empty.');
  if (raw.startsWith('[') || raw.startsWith('{')) {
    let data;
    try { data = JSON.parse(raw); }
    catch { return emptyTraits('Traits file is not valid JSON.'); }
    return parseTraitsJson(data);
  }
  return parseTraitsCsv(text);
}

function makeItem({ id, n, name, traits, thumbs, score }) {
  const item = {
    id,
    name: name && String(name).trim() ? String(name).trim() : String(n),
    n,
    t: { ...(traits || {}) },
  };
  if (score != null) item.score = score;
  for (const [key, value] of Object.entries(thumbs || {})) {
    if (value) item[key] = value;
  }
  return item;
}

function traitGap(row, reason) {
  return {
    index: row.index,
    id: INSCRIPTION_ID_RE.test(row.id) ? row.id : '',
    name: row.name || '',
    reason,
  };
}

function join(idsParsed, traitsParsed) {
  const items = [];
  const idsWithNoTraits = [];
  const traitsWithNoId = [];
  let matched = 0;
  let warning = traitsParsed.warning;

  if (traitsParsed.mode === 'id') {
    const firstById = new Map();
    for (const row of traitsParsed.rows) {
      if (!INSCRIPTION_ID_RE.test(row.id) || firstById.has(row.id)) continue;
      firstById.set(row.id, row);
    }
    const used = new Set();
    idsParsed.ids.forEach((id, i) => {
      const row = firstById.get(id);
      if (!row) {
        idsWithNoTraits.push(id);
        items.push(makeItem({ id, n: i + 1, name: '', traits: {} }));
        return;
      }
      used.add(row);
      matched += 1;
      items.push(makeItem({
        id,
        n: row.n ?? i + 1,
        name: row.name,
        traits: row.traits,
        thumbs: row.thumbs,
        score: row.score,
      }));
    });
    for (const row of traitsParsed.rows) {
      if (!row.id) {
        traitsWithNoId.push(traitGap(row, 'missing'));
        continue;
      }
      if (!INSCRIPTION_ID_RE.test(row.id) || used.has(row) || row !== firstById.get(row.id)) continue;
      traitsWithNoId.push(traitGap(row, 'unmatched'));
    }
  } else if (traitsParsed.mode === 'number') {
    const zeroBased = traitsParsed.rows.some((row) => row.n === 0);
    const firstByN = new Map();
    const seenN = new Map();
    for (const row of traitsParsed.rows) {
      if (row.n == null) continue;
      seenN.set(row.n, (seenN.get(row.n) || 0) + 1);
      if (!firstByN.has(row.n)) firstByN.set(row.n, row);
    }
    const repeated = [...seenN.entries()].filter(([, count]) => count > 1).map(([n]) => n).sort((a, b) => a - b);
    if (repeated.length) {
      warning = `${warning} Repeated numbers were kept once: ${repeated.join(', ')}.`;
    }
    const used = new Set();
    idsParsed.ids.forEach((id, i) => {
      const n = zeroBased ? i : i + 1;
      const row = firstByN.get(n);
      if (!row) {
        idsWithNoTraits.push(id);
        items.push(makeItem({ id, n, name: '', traits: {} }));
        return;
      }
      used.add(row);
      matched += 1;
      items.push(makeItem({
        id,
        n: row.n,
        name: row.name,
        traits: row.traits,
        thumbs: row.thumbs,
        score: row.score,
      }));
    });
    for (const row of traitsParsed.rows) {
      if (row.n == null) {
        traitsWithNoId.push(traitGap(row, 'missing'));
        continue;
      }
      if (used.has(row) || row !== firstByN.get(row.n)) continue;
      traitsWithNoId.push(traitGap(row, 'unmatched'));
    }
  } else {
    idsParsed.ids.forEach((id, i) => {
      const row = traitsParsed.rows[i];
      const n = i + 1;
      if (!row) {
        idsWithNoTraits.push(id);
        items.push(makeItem({ id, n, name: '', traits: {} }));
        return;
      }
      matched += 1;
      items.push(makeItem({
        id,
        n: row.n ?? n,
        name: row.name,
        traits: row.traits,
        thumbs: row.thumbs,
        score: row.score,
      }));
    });
    for (const row of traitsParsed.rows.slice(idsParsed.ids.length)) {
      traitsWithNoId.push(traitGap(row, 'missing'));
    }
  }

  return {
    items,
    report: {
      matched,
      idsWithNoTraits,
      traitsWithNoId,
      duplicateIds: [...idsParsed.duplicates, ...traitsParsed.duplicates],
      malformedIds: [...idsParsed.malformed, ...traitsParsed.malformed],
      warning,
      mode: traitsParsed.mode,
    },
  };
}

export function collectionOutputs(items) {
  return {
    magicEden: toMagicEden(items),
    inscriptions: toUnisatInscriptions(items),
    idsTxt: toIdList(items),
    meta: toUnisatMeta(),
  };
}

export function formatReport(report) {
  const lines = [];
  if (report.warning) lines.push(`Warning: ${report.warning}`);
  lines.push(`Matched: ${report.matched}.`);
  lines.push(`Ids with no traits: ${report.idsWithNoTraits.length}.`);
  lines.push(`Traits with no id: ${report.traitsWithNoId.length}.`);
  lines.push(`Duplicate ids: ${report.duplicateIds.length}.`);
  lines.push(`Malformed inscription ids: ${report.malformedIds.length}.`);
  return lines.join('\n');
}

function failed(error) {
  return { ok: false, error, items: [], report: null, outputs: null, validation: null };
}

export function mergeIdsAndTraits(idsText, traitsText) {
  const idsParsed = parseIdsFile(idsText);
  const traitsParsed = parseTraitsFile(traitsText);
  if (!idsParsed.ok || !traitsParsed.ok) {
    const parts = [];
    if (!idsParsed.ok) parts.push(idsParsed.error);
    if (!traitsParsed.ok) parts.push(traitsParsed.error);
    return failed(parts.join(' '));
  }
  const { items, report } = join(idsParsed, traitsParsed);
  const outputs = collectionOutputs(items);
  const validation = MetadataValidator.validateComplete(JSON.stringify(outputs.magicEden));
  return { ok: true, error: null, items, report, outputs, validation };
}
