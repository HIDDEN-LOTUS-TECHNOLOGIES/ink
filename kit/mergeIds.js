// Pair an ids file with a traits file. Nothing here signs or sends a request.
// Ids: one inscription id per line, a JSON array of ids, or a JSON array of {id} objects.
// Traits: a CSV with a header, a JSON array, or an object keyed by inscription id or by number.
// Join by inscription id when any trait row has an id. Otherwise join by number, or by row order.
// An inscription id matches /^[0-9a-f]{64}i[0-9]+$/. Uppercase hex is malformed.

import { toIdList, toMagicEden, toUnisatInscriptions, toUnisatMeta } from './convert.js';
import { MetadataValidator } from './metadataValidator.js';

export const INSCRIPTION_ID_RE = /^[0-9a-f]{64}i[0-9]+$/;
export const ORDER_WARNING = 'Traits file has no inscription ids. Joined by row order: trait row 1 pairs with ids row 1. A malformed or duplicate id keeps that row and leaves its trait unpaired.';
export const NUMBER_WARNING = 'Traits file has no inscription ids. Joined by number: number 1 pairs with ids row 1. A malformed or duplicate id keeps that row and leaves its trait unpaired.';
export const INDEX_WARNING = 'Traits file has no inscription ids. Joined by index: index 0 pairs with ids row 1. A malformed or duplicate id keeps that row and leaves its trait unpaired.';
export const HEADERLESS_WARNING = 'This CSV looks headerless. The first row looks like data and was still read as the header.';
export const NAME_FALLBACK_NOTE = 'Rows with no name use their number as the name.';

const THUMB_KEYS = ['high_res_img_url', 'collection_page_img_url'];
export const ID_COLUMN_NAMES = ['id', 'inscription_id', 'inscription', 'inscription id'];

export function headerKey(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

export function isIdColumnName(value) {
  const key = headerKey(value);
  return ID_COLUMN_NAMES.some((name) => headerKey(name) === key);
}

const RECOGNIZED_COLUMNS = new Set([
  ...ID_COLUMN_NAMES.map((name) => headerKey(name)),
  'name', 'n', 'number', 'index', 'score',
  ...THUMB_KEYS.map((name) => headerKey(name)),
]);
const RESERVED = new Set([
  'id', 'inscription_id', 'inscription', 'inscription id', 'name', 'n', 'number', 'index', 'score',
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

function idField(obj) {
  if (!isPlainObject(obj)) return undefined;
  for (const key of Object.keys(obj)) {
    if (!isIdColumnName(key)) continue;
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
  return { ok: false, error, ids: [], slots: [], malformed: [], duplicates: [] };
}

// Every data row keeps a slot. Malformed and duplicate rows stay in place so a
// later trait row cannot slide onto the wrong id.
function classifyIds(entries) {
  const slots = [];
  const malformed = [];
  const seen = new Map();
  for (const entry of entries) {
    const value = String(entry.value ?? '').trim();
    const index = entry.index;
    if (!INSCRIPTION_ID_RE.test(value)) {
      malformed.push({ value, index, source: 'ids' });
      slots.push({ index, value, id: '', valid: false, duplicate: false });
      continue;
    }
    const count = (seen.get(value) || 0) + 1;
    seen.set(value, count);
    const duplicate = count > 1;
    slots.push({ index, value, id: duplicate ? '' : value, valid: !duplicate, duplicate });
  }
  const ids = slots.filter((slot) => slot.valid).map((slot) => slot.id);
  const duplicates = [];
  for (const [id, count] of seen) {
    if (count > 1) duplicates.push({ id, count, source: 'ids' });
  }
  return { ok: true, error: null, ids, slots, malformed, duplicates };
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
        const id = idField(item);
        return { value: id == null ? '' : String(id), index: index + 1 };
      }
      return { value: item == null ? '' : String(item), index: index + 1 };
    });
    return classifyIds(entries);
  }
  const entries = [];
  let dataRow = 0;
  let sawContent = false;
  for (const line of linesOf(text)) {
    if (!line.trim()) continue;
    const value = line.trim();
    if (!sawContent && isIdsHeaderLine(value)) {
      sawContent = true;
      continue;
    }
    sawContent = true;
    dataRow += 1;
    entries.push({ value, index: dataRow });
  }
  if (!entries.length) return emptyIds('Ids file is empty.');
  return classifyIds(entries);
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

/** RFC 4180 records. Quoted cells may contain commas, quotes, and newlines. */
export function parseCsvRecords(text, delimiter = ',') {
  const src = stripBom(text);
  const records = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < src.length; i += 1) {
    const char = src[i];
    if (inQuotes) {
      if (char === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
          continue;
        }
        inQuotes = false;
        continue;
      }
      if (char === '\r') {
        field += '\n';
        if (src[i + 1] === '\n') i += 1;
        continue;
      }
      field += char;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === delimiter) {
      row.push(field);
      field = '';
      continue;
    }
    if (char === '\n' || char === '\r') {
      if (char === '\r' && src[i + 1] === '\n') i += 1;
      row.push(field);
      records.push(row);
      row = [];
      field = '';
      continue;
    }
    field += char;
  }
  if (field.length || row.length) {
    row.push(field);
    records.push(row);
  }
  return records.filter((record) => record.some((cell) => cell.trim() !== ''));
}

function detectDelimiter(text) {
  const src = stripBom(text);
  let commas = 0;
  let semis = 0;
  let inQuotes = false;
  for (let i = 0; i < src.length; i += 1) {
    const char = src[i];
    if (inQuotes) {
      if (char === '"') {
        if (src[i + 1] === '"') { i += 1; continue; }
        inQuotes = false;
      }
      continue;
    }
    if (char === '"') { inQuotes = true; continue; }
    if (char === '\n' || char === '\r') break;
    if (char === ',') commas += 1;
    else if (char === ';') semis += 1;
  }
  return semis > commas ? ';' : ',';
}

function isIdsHeaderLine(line) {
  const records = parseCsvRecords(`${String(line).trim()}\n`);
  if (records.length !== 1) return false;
  const nonempty = records[0].map((cell) => cell.trim()).filter((cell) => cell !== '');
  return nonempty.length === 1 && isIdColumnName(nonempty[0]);
}

function looksLikeColumnTitle(cell) {
  const raw = String(cell ?? '').trim();
  if (!raw) return false;
  if (RECOGNIZED_COLUMNS.has(headerKey(raw))) return true;
  if (/[A-Z]/.test(raw)) return true;
  if (/[_-]/.test(raw)) return true;
  return false;
}

function firstRowLooksLikeData(cells) {
  const trimmed = cells.map((cell) => cell.trim()).filter((cell) => cell !== '');
  if (!trimmed.length) return false;
  if (trimmed.some((cell) => INSCRIPTION_ID_RE.test(cell))) return true;
  if (trimmed.some((cell) => RECOGNIZED_COLUMNS.has(headerKey(cell)))) return false;
  if (trimmed.some((cell) => /^[0-9]+$/.test(cell))) return true;
  return trimmed.every((cell) => !looksLikeColumnTitle(cell));
}

function parseTraitsCsv(text) {
  const delimiter = detectDelimiter(text);
  const records = parseCsvRecords(text, delimiter);
  if (!records.length) return emptyTraits('Traits file is empty.');
  const header = records[0].map((cell) => cell.trim());
  const data = records.slice(1);
  if (!data.length) return emptyTraits('Traits CSV has a header and no data rows.');
  const cols = header.map((name, i) => ({ name, key: headerKey(name), i }));
  const findCol = (names) => cols.find((col) => names.some((name) => headerKey(name) === col.key));
  const idCol = findCol(ID_COLUMN_NAMES);
  const nameCol = findCol(['name']);
  const nCol = findCol(['n', 'number', 'index']);
  const scoreCol = findCol(['score']);
  const thumbCols = cols.filter((col) => THUMB_KEYS.some((key) => headerKey(key) === col.key));
  const traitCols = cols.filter((col) => col.name && !RECOGNIZED_COLUMNS.has(col.key));
  const rows = [];
  const malformed = [];
  data.forEach((cells, dataIndex) => {
    const index = dataIndex + 1;
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
      const thumbName = THUMB_KEYS.find((key) => headerKey(key) === col.key);
      if (value && thumbName) thumbs[thumbName] = value;
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
  });
  const finished = finishTraits(rows, malformed);
  if (firstRowLooksLikeData(header)) {
    finished.warning = finished.warning ? `${finished.warning} ${HEADERLESS_WARNING}` : HEADERLESS_WARNING;
  }
  return finished;
}

function parseTraitsJson(data) {
  if (Array.isArray(data)) {
    if (data.length === 0) return emptyTraits('Traits file is empty.');
    if (!data.every(isPlainObject)) return emptyTraits('Traits JSON array must be objects.');
    const rows = data.map((obj, index) => {
      const id = idField(obj);
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
    const inner = idField(data[key]);
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

function rowLabel(row) {
  if (row.name && String(row.name).trim()) return String(row.name).trim();
  const values = Object.values(row.traits || {});
  if (values.length) return String(values[0]);
  return '(no name)';
}

function unpairedRow(slot, row) {
  const label = rowLabel(row);
  return {
    idsIndex: slot.index,
    idsValue: slot.value,
    traitIndex: row.index,
    traitName: label,
    message: `ids row ${slot.index} ${slot.value}: trait row ${row.index} ${label} left unpaired`,
  };
}

function join(idsParsed, traitsParsed, options = {}) {
  const includeIdsWithoutTraits = Boolean(options.includeIdsWithoutTraits);
  const items = [];
  const idsWithNoTraits = [];
  const traitsWithNoId = [];
  const unpaired = [];
  const namesFromNumber = [];
  let matched = 0;
  let warning = traitsParsed.warning;
  const slotById = new Map();
  for (const slot of idsParsed.slots) {
    if (slot.valid && !slotById.has(slot.id)) slotById.set(slot.id, slot);
  }

  function emit(slot, row) {
    const n = row.n ?? slot.index;
    if (!(row.name && String(row.name).trim())) namesFromNumber.push(n);
    matched += 1;
    items.push(makeItem({
      id: slot.id,
      n,
      name: row.name,
      traits: row.traits,
      thumbs: row.thumbs,
      score: row.score,
    }));
  }

  function noteMissing(slot) {
    idsWithNoTraits.push(slot.id);
    if (!includeIdsWithoutTraits) return;
    namesFromNumber.push(slot.index);
    items.push(makeItem({ id: slot.id, n: slot.index, name: '', traits: {} }));
  }

  if (traitsParsed.mode === 'id') {
    const firstById = new Map();
    for (const row of traitsParsed.rows) {
      if (!INSCRIPTION_ID_RE.test(row.id) || firstById.has(row.id)) continue;
      firstById.set(row.id, row);
    }
    const used = new Set();
    for (const id of idsParsed.ids) {
      const row = firstById.get(id);
      if (!row) {
        noteMissing(slotById.get(id));
        continue;
      }
      used.add(row);
      emit(slotById.get(id), row);
    }
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
    const seenN = new Map();
    const usedSlots = new Set();
    for (const row of traitsParsed.rows) {
      if (row.n == null) {
        traitsWithNoId.push(traitGap(row, 'missing'));
        continue;
      }
      seenN.set(row.n, (seenN.get(row.n) || 0) + 1);
      if (seenN.get(row.n) > 1) continue;
      const pos = zeroBased ? row.n : row.n - 1;
      const slot = idsParsed.slots[pos];
      if (!slot) {
        traitsWithNoId.push(traitGap(row, 'unmatched'));
        continue;
      }
      usedSlots.add(slot);
      if (!slot.valid) {
        unpaired.push(unpairedRow(slot, row));
        continue;
      }
      emit(slot, row);
    }
    const repeated = [...seenN.entries()].filter(([, count]) => count > 1).map(([n]) => n).sort((a, b) => a - b);
    if (repeated.length) {
      warning = `${warning} Repeated numbers were kept once: ${repeated.join(', ')}.`;
    }
    for (const slot of idsParsed.slots) {
      if (slot.valid && !usedSlots.has(slot)) noteMissing(slot);
    }
  } else {
    idsParsed.slots.forEach((slot, i) => {
      const row = traitsParsed.rows[i];
      if (!row) {
        if (slot.valid) noteMissing(slot);
        return;
      }
      if (!slot.valid) {
        unpaired.push(unpairedRow(slot, row));
        return;
      }
      emit(slot, row);
    });
    for (const row of traitsParsed.rows.slice(idsParsed.slots.length)) {
      traitsWithNoId.push(traitGap(row, 'missing'));
    }
  }

  const report = {
    matched,
    idsWithNoTraits,
    traitsWithNoId,
    unpaired,
    duplicateIds: [...idsParsed.duplicates, ...traitsParsed.duplicates],
    malformedIds: [...idsParsed.malformed, ...traitsParsed.malformed],
    namesFromNumber,
    warning,
    mode: traitsParsed.mode,
    includeIdsWithoutTraits,
  };
  report.needsReview = Boolean(
    report.idsWithNoTraits.length ||
    report.traitsWithNoId.length ||
    report.unpaired.length ||
    report.duplicateIds.length ||
    report.malformedIds.length
  );
  return { items, report };
}

export function collectionOutputs(items) {
  return {
    magicEden: toMagicEden(items),
    inscriptions: toUnisatInscriptions(items),
    idsTxt: toIdList(items),
    meta: toUnisatMeta(),
  };
}

export function unpairedLines(report) {
  return (report.unpaired || []).map((row) => row.message);
}

export function reviewNote(report) {
  const n = report.matched;
  const noun = n === 1 ? 'item' : 'items';
  const extra = report.idsWithNoTraits?.length || 0;
  if (report.includeIdsWithoutTraits && extra) {
    const idNoun = extra === 1 ? 'id' : 'ids';
    return `Downloads include the ${n} paired ${noun} and ${extra} ${idNoun} with no traits. Review the report first.`;
  }
  return `Downloads include only the ${n} paired ${noun}; review the report first.`;
}

export function displaySummary(report, validation) {
  if (!report || !validation) return '';
  const success = String(validation.summary || '').includes('All validation checks passed');
  if (report.needsReview && success) return `Warning: ${reviewNote(report)}`;
  if (report.needsReview) return `${validation.summary}\nWarning: ${reviewNote(report)}`;
  return validation.summary;
}

export function formatReport(report) {
  const lines = [];
  if (report.warning) lines.push(`Warning: ${report.warning}`);
  lines.push(...unpairedLines(report));
  lines.push(`Matched: ${report.matched}.`);
  lines.push(`Ids with no traits: ${report.idsWithNoTraits.length}.`);
  lines.push(`Traits with no id: ${report.traitsWithNoId.length}.`);
  lines.push(`Duplicate ids: ${report.duplicateIds.length}.`);
  lines.push(`Malformed inscription ids: ${report.malformedIds.length}.`);
  if (report.namesFromNumber?.length) lines.push(NAME_FALLBACK_NOTE);
  if (report.needsReview) lines.push(reviewNote(report));
  return lines.join('\n');
}

function failed(error) {
  return { ok: false, error, items: [], report: null, outputs: null, validation: null };
}

export function mergeIdsAndTraits(idsText, traitsText, options = {}) {
  const idsParsed = parseIdsFile(idsText);
  const traitsParsed = parseTraitsFile(traitsText);
  if (!idsParsed.ok || !traitsParsed.ok) {
    const parts = [];
    if (!idsParsed.ok) parts.push(idsParsed.error);
    if (!traitsParsed.ok) parts.push(traitsParsed.error);
    return failed(parts.join(' '));
  }
  const { items, report } = join(idsParsed, traitsParsed, options);
  const outputs = collectionOutputs(items);
  const validation = MetadataValidator.validateComplete(JSON.stringify(outputs.magicEden));
  return { ok: true, error: null, items, report, outputs, validation };
}
