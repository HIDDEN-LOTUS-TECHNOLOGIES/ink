// Magic Eden JSON and ink collection JSON share one item shape.
// The attribute walk follows scripts/generate-hlt-traits.cjs.

export function isInkItem(item) {
  return item && item.t && typeof item.t === 'object' && !Array.isArray(item.t);
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
      return out;
    }
    const attrs = item?.meta?.attributes || item?.attributes || [];
    const t = {};
    if (Array.isArray(attrs)) {
      for (const attr of attrs) {
        if (attr && attr.trait_type != null) t[attr.trait_type] = attr.value;
      }
    }
    const name = item?.meta?.name || item?.name || '';
    const parsed = Number.parseInt(name, 10);
    const out = {
      id: item?.id || '',
      name: name == null ? '' : String(name),
      n: item?.n == null ? (Number.isFinite(parsed) ? parsed : index + 1) : Number(item.n),
      t,
    };
    if (item?.score != null && item.score !== '') out.score = Number(item.score);
    return out;
  });
}

export function toMagicEden(items) {
  return items.map((item) => ({
    id: item.id,
    meta: {
      name: item.name,
      attributes: Object.entries(item.t || {}).map(([trait_type, value]) => ({ trait_type, value })),
    },
  }));
}

export function sameItems(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].name !== b[i].name || a[i].n !== b[i].n || a[i].score !== b[i].score) return false;
    const ak = Object.keys(a[i].t || {});
    const bk = Object.keys(b[i].t || {});
    if (ak.length !== bk.length) return false;
    for (const k of ak) if (String(a[i].t[k]) !== String(b[i].t[k])) return false;
  }
  return true;
}
