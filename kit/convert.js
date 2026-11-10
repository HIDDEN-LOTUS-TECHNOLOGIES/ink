// Magic Eden JSON and ink collection JSON share one item shape.
// Gamma on-chain rows are {file, meta} and have no inscription id yet.
// high_res_img_url and collection_page_img_url stay on the item. They are
// off-chain image URLs, not traits.
// The attribute walk follows scripts/generate-hlt-traits.cjs.

import { isValidInscriptionId } from './parentInscription.js';

export const THUMB_KEYS = ['high_res_img_url', 'collection_page_img_url'];

export function isInkItem(item) {
  return item && item.t && typeof item.t === 'object' && !Array.isArray(item.t);
}

export function isGammaOnChainItem(item) {
  return Boolean(
    item &&
    typeof item === 'object' &&
    typeof item.file === 'string' &&
    item.file.trim() !== '' &&
    item.meta &&
    typeof item.meta === 'object' &&
    !Array.isArray(item.meta) &&
    (item.id == null || item.id === '')
  );
}

export function isGammaOnChain(data) {
  return Array.isArray(data) && data.length > 0 && data.every(isGammaOnChainItem);
}

/** Meta wins when both places set a non-empty value. Otherwise the top-level field is kept. */
export function readThumb(item, key) {
  if (!item || typeof item !== 'object') return '';
  const fromMeta = item.meta && typeof item.meta === 'object' && !Array.isArray(item.meta) ? item.meta[key] : undefined;
  const fromTop = item[key];
  const value = fromMeta != null && String(fromMeta).trim() !== '' ? fromMeta : fromTop;
  if (value == null || String(value).trim() === '') return '';
  return String(value);
}

export function hasOffChainImageUrl(item) {
  return THUMB_KEYS.some((key) => readThumb(item, key) !== '');
}

/** Gamma rows are shown by their file name. Other rows use the item name. */
export function itemLabel(item) {
  if (item && (item.id == null || item.id === '') && typeof item.file === 'string' && item.file) return item.file;
  return item?.name == null ? '' : String(item.name);
}

function attachExtras(out, item) {
  for (const key of THUMB_KEYS) {
    const value = readThumb(item, key);
    if (value) out[key] = value;
  }
  if (typeof item?.file === 'string' && item.file && (out.id == null || out.id === '')) out.file = item.file;
  return out;
}

function traitsFromAttributes(attrs) {
  const t = {};
  if (!Array.isArray(attrs)) return t;
  for (const attr of attrs) {
    if (attr && attr.trait_type != null) t[attr.trait_type] = attr.value;
  }
  return t;
}

export function normalizeCollection(data) {
  if (!Array.isArray(data)) throw new Error('Collection file must be a JSON array.');
  return data.map((item, index) => {
    if (isInkItem(item)) {
      const out = {
        id: item.id || '',
        name: item.name == null ? '' : String(item.name),
        n: item.n == null ? index + 1 : Number(item.n),
        t: { ...item.t },
      };
      if (item.score != null && item.score !== '') out.score = Number(item.score);
      return attachExtras(out, item);
    }
    const gamma = isGammaOnChainItem(item);
    const attrs = item?.meta?.attributes || item?.attributes || [];
    const t = traitsFromAttributes(attrs);
    const rawName = item?.meta?.name ?? item?.name ?? '';
    const name = rawName === '' || rawName == null ? (gamma ? String(item.file) : '') : String(rawName);
    const parsed = Number.parseInt(name, 10);
    const out = {
      id: item?.id || '',
      name,
      n: item?.n == null ? (Number.isFinite(parsed) ? parsed : index + 1) : Number(item.n),
      t,
    };
    if (item?.score != null && item.score !== '') out.score = Number(item.score);
    return attachExtras(out, item);
  });
}

export function toMagicEden(items) {
  return items.map((item) => {
    const meta = {
      name: item.name,
      attributes: Object.entries(item.t || {}).map(([trait_type, value]) => ({ trait_type, value })),
    };
    for (const key of THUMB_KEYS) {
      if (item[key] != null && item[key] !== '') meta[key] = item[key];
    }
    return { id: item.id, meta };
  });
}

/** Empty collection stub. The slug has to match the UniSat folder name. */
export function toUnisatMeta() {
  return {
    name: '',
    slug: '',
    icon: '',
    twitter: '',
    discord: '',
    website: '',
  };
}

export function toUnisatInscriptions(items) {
  return toMagicEden(items.filter((item) => isValidInscriptionId(item?.id)));
}

export function toIdList(items) {
  const ids = items.map((item) => item?.id).filter((id) => isValidInscriptionId(id));
  return ids.length ? `${ids.join('\n')}\n` : '';
}

export function sameItems(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].name !== b[i].name || a[i].n !== b[i].n || a[i].score !== b[i].score) return false;
    for (const key of THUMB_KEYS) {
      if ((a[i][key] || '') !== (b[i][key] || '')) return false;
    }
    const ak = Object.keys(a[i].t || {});
    const bk = Object.keys(b[i].t || {});
    if (ak.length !== bk.length) return false;
    for (const k of ak) if (String(a[i].t[k]) !== String(b[i].t[k])) return false;
  }
  return true;
}
