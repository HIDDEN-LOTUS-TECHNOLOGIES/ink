// Ported from packz-framework src/utils/csv/metadataParser.ts (8e01e71).
// CollectionTrait lived in a React editor type that is not part of this port.
// Collection item CSV (id, name, traits) is the Kit's JSON <-> CSV path.

import { THUMB_KEYS } from './convert.js';

export function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i += 1; }
      else inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else current += char;
  }
  result.push(current.trim());
  return result;
}

function isValidInscriptionId(id) {
  return /^[a-fA-F0-9]{64}i\d+$/.test(id);
}

function detectColumns(headerLine) {
  const parts = parseCSVLine(headerLine.toLowerCase());
  const exact = (names) => parts.findIndex((p) => names.includes(p));
  const layerIndex = exact(['layer_name', 'layer']) !== -1 ? exact(['layer_name', 'layer']) : parts.findIndex((p) => p.includes('layer'));
  const traitIndex = exact(['trait_name', 'trait']) !== -1 ? exact(['trait_name', 'trait']) : parts.findIndex((p) => p.includes('trait'));
  const inscriptionIndex = exact(['inscription_id', 'inscription', 'id']) !== -1 ? exact(['inscription_id', 'inscription', 'id']) : parts.findIndex((p) => p.includes('inscription'));
  const rarityIndex = exact(['rarity', 'weight']) !== -1 ? exact(['rarity', 'weight']) : parts.findIndex((p) => p.includes('rarity') || p.includes('weight'));
  const hasHeader = layerIndex !== -1 || traitIndex !== -1;
  return {
    layerIndex: layerIndex !== -1 ? layerIndex : 0,
    traitIndex: traitIndex !== -1 ? traitIndex : 1,
    inscriptionIndex: inscriptionIndex !== -1 ? inscriptionIndex : 2,
    rarityIndex: rarityIndex !== -1 ? rarityIndex : 3,
    hasHeader,
  };
}

/** Layer/trait CSV used by the packz collection editor. */
export function parseMetadataCSV(csvContent) {
  const lines = String(csvContent || '').split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { rows: [], layers: [], errors: ['CSV file is empty'], totalTraits: 0 };
  const columns = detectColumns(lines[0]);
  const startLine = columns.hasHeader ? 1 : 0;
  const rows = [];
  const errors = [];
  const layerMap = new Map();
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;
    const parts = parseCSVLine(line);
    const layerName = parts[columns.layerIndex]?.trim() || `Layer ${i}`;
    const traitName = parts[columns.traitIndex]?.trim() || `Trait ${i}`;
    const inscriptionId = parts[columns.inscriptionIndex]?.trim() || '';
    const rarityStr = parts[columns.rarityIndex]?.trim() || '10';
    const rarity = Number.parseFloat(rarityStr);
    if (Number.isNaN(rarity) || rarity < 0 || rarity > 100) {
      errors.push(`Line ${i + 1}: Invalid rarity "${rarityStr}" (must be 0-100)`);
      continue;
    }
    if (inscriptionId && !isValidInscriptionId(inscriptionId)) {
      errors.push(`Line ${i + 1}: Invalid inscription ID format "${inscriptionId}"`);
      continue;
    }
    rows.push({ layerName, traitName, inscriptionId: inscriptionId || undefined, rarity });
    const trait = {
      id: `trait-${i}`,
      name: traitName,
      rarity,
      type: inscriptionId ? 'inscription' : 'image',
      inscriptionId: inscriptionId || undefined,
    };
    if (!layerMap.has(layerName)) layerMap.set(layerName, []);
    layerMap.get(layerName).push(trait);
  }
  const layers = [];
  let layerIndex = 0;
  layerMap.forEach((traits, name) => {
    layers.push({ id: `layer-${layerIndex}`, name, order: layerIndex, required: layerIndex > 0, traits });
    layerIndex += 1;
  });
  return { rows, layers, errors, totalTraits: rows.length };
}

export function generateMetadataCSV(layers) {
  const lines = ['layer_name,trait_name,inscription_id,rarity'];
  layers.forEach((layer) => {
    layer.traits.forEach((trait) => {
      lines.push(`${csvCell(layer.name)},${csvCell(trait.name)},${csvCell(trait.inscriptionId || '')},${trait.rarity}`);
    });
  });
  return lines.join('\n');
}

function csvCell(value) {
  const s = String(value ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const RESERVED = new Set(['id', 'name', 'n', 'score', ...THUMB_KEYS]);

/** Collection items to a trait CSV and back. Used for the Kit round trip. */
export function itemsToCsv(items) {
  const keys = [];
  const seen = new Set();
  for (const item of items) {
    for (const k of Object.keys(item.t || {})) {
      if (!seen.has(k)) { seen.add(k); keys.push(k); }
    }
  }
  const thumbKeys = THUMB_KEYS.filter((key) => items.some((item) => item[key] != null && item[key] !== ''));
  const header = ['id', 'name', 'n', 'score', ...thumbKeys, ...keys.filter((key) => !thumbKeys.includes(key))];
  const lines = [header.map(csvCell).join(',')];
  for (const item of items) {
    const row = [item.id || '', item.name || '', item.n ?? '', item.score ?? ''];
    for (const k of thumbKeys) row.push(item[k] ?? '');
    for (const k of keys) {
      if (thumbKeys.includes(k)) continue;
      row.push(item.t && k in item.t ? item.t[k] : '');
    }
    lines.push(row.map(csvCell).join(','));
  }
  return lines.join('\n');
}

export function csvToItems(csv) {
  const lines = String(csv || '').split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const header = parseCSVLine(lines[0]);
  const lower = header.map((h) => h.toLowerCase());
  if (!lower.includes('id')) throw new Error('CSV needs an id column.');
  return lines.slice(1).map((line) => {
    const cells = parseCSVLine(line);
    const rec = {};
    header.forEach((key, i) => { rec[key] = cells[i] ?? ''; });
    const t = {};
    for (const key of header) {
      if (RESERVED.has(key.toLowerCase())) continue;
      if (rec[key] !== '') t[key] = rec[key];
    }
    const item = { id: rec.id || rec.ID || '', name: rec.name || rec.Name || '', t };
    const n = rec.n ?? rec.N;
    if (n !== '' && n != null) item.n = Number(n);
    const score = rec.score ?? rec.Score;
    if (score !== '' && score != null) item.score = Number(score);
    for (const key of THUMB_KEYS) {
      const headerKey = header.find((h) => h.toLowerCase() === key);
      if (headerKey && rec[headerKey] !== '') item[key] = rec[headerKey];
    }
    return item;
  });
}

export function itemsToMagicEden(items) {
  return items.map((item) => {
    const meta = {
      name: item.name,
      attributes: Object.entries(item.t || {}).map(([trait_type, value]) => ({ trait_type, value: String(value) })),
    };
    for (const key of THUMB_KEYS) {
      if (item[key] != null && item[key] !== '') meta[key] = String(item[key]);
    }
    return { id: item.id, meta };
  });
}
