// Shared rarity used by the collection pages and the Metadata Kit.
// Score = sum over trait categories of supply / count(value). Missing is its own value.
// "none" is an ordinary value. Rounded to 4 decimals. Rank 1 is the highest score.
// Ties break toward the lower piece number.

export const TIER_CUT = [
  ['legendary', 0.01, 'Legendary', 'top 1%', '≤1%'],
  ['epic', 0.05, 'Epic', 'top 5%', '≤5%'],
  ['rare', 0.15, 'Rare', 'top 15%', '≤15%'],
  ['uncommon', 0.4, 'Uncommon', 'top 40%', '≤40%'],
  ['common', Infinity, 'Common', 'the rest', ''],
];

export function standardScores(items) {
  if (!items.length || items.some((i) => i.score != null)) return;
  const keys = [];
  const seen = new Set();
  for (const i of items) {
    for (const k of Object.keys(i.t || {})) {
      if (!seen.has(k)) {
        seen.add(k);
        keys.push(k);
      }
    }
  }
  if (!keys.length) return;
  const supply = items.length;
  const counts = keys.map((k) => {
    const c = new Map();
    for (const i of items) {
      const t = i.t || {};
      const v = k in t && t[k] != null ? t[k] : '\0';
      c.set(v, (c.get(v) || 0) + 1);
    }
    return c;
  });
  for (const i of items) {
    const t = i.t || {};
    let s = 0;
    keys.forEach((k, ki) => {
      const v = k in t && t[k] != null ? t[k] : '\0';
      s += supply / counts[ki].get(v);
    });
    i.score = Math.round((s + Number.EPSILON) * 10000) / 10000;
  }
}

export function rankByScore(items) {
  const rankOf = new Map();
  if (items.some((i) => i.score != null)) {
    const scored = items.filter((i) => i.score != null).slice().sort((a, b) => b.score - a.score || a.n - b.n);
    scored.forEach((i, idx) => rankOf.set(i.id, idx + 1));
  } else if (items.some((i) => i.rank != null)) {
    items.forEach((i) => {
      if (i.rank != null) rankOf.set(i.id, i.rank);
    });
  }
  return rankOf;
}

export function tierFor(rank, supply) {
  return TIER_CUT.find((t) => rank / supply <= t[1]);
}

export function tierTip(rank, score, supply) {
  const t = tierFor(rank, supply);
  let tip = `${t[2]} · ${t[3]}`;
  if (score != null) tip += ` · score ${Number(score).toFixed(2)}`;
  return { id: t[0], label: t[2], cut: t[3], mark: t[4], tip };
}

export function tierCounts(ranks, supply) {
  const counts = { legendary: 0, epic: 0, rare: 0, uncommon: 0, common: 0 };
  for (const rank of ranks) counts[tierFor(rank, supply)[0]] += 1;
  return counts;
}
