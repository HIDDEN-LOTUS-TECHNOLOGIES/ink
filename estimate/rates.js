// Mainnet fee rates and an optional USD price. Both calls are public and unauthenticated.
// The page still estimates from a custom sat/vB if either request fails.

export const MEMPOOL_ORIGIN = 'https://mempool.space';
export const FEES_PATH = '/api/v1/fees/recommended';
export const PRICES_PATH = '/api/v1/prices';

const FEE_KEYS = ['fastestFee', 'halfHourFee', 'hourFee', 'economyFee', 'minimumFee'];

export const RATE_ROWS = [
  ['fastestFee', 'Fastest'],
  ['halfHourFee', 'Half hour'],
  ['hourFee', 'Hour'],
  ['economyFee', 'Economy'],
];

export function mempoolUrl(path) {
  const url = new URL(path, MEMPOOL_ORIGIN);
  if (url.protocol !== 'https:' || url.hostname !== 'mempool.space') throw new Error('Refused endpoint.');
  if (url.pathname !== FEES_PATH && url.pathname !== PRICES_PATH) throw new Error('Refused endpoint.');
  if (url.username || url.password || url.search || url.hash) throw new Error('Refused endpoint.');
  return url.toString();
}

export function feesUrl() {
  return mempoolUrl(FEES_PATH);
}

export function pricesUrl() {
  return mempoolUrl(PRICES_PATH);
}

export function parseRecommendedFees(body) {
  if (!body || typeof body !== 'object') return null;
  const fees = {};
  for (const key of FEE_KEYS) {
    const n = body[key];
    if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return null;
    fees[key] = n;
  }
  return fees;
}

export function parseUsdPrice(body) {
  if (!body || typeof body !== 'object') return null;
  const usd = body.USD;
  if (typeof usd !== 'number' || !Number.isFinite(usd) || usd <= 0) return null;
  return usd;
}

async function readJson(fetchImpl, url) {
  try {
    const res = await fetchImpl(url);
    if (!res || !res.ok) return null;
    return JSON.parse(await res.text());
  } catch {
    return null;
  }
}

export async function loadMarket(fetchImpl = globalThis.fetch) {
  const [feesBody, pricesBody] = await Promise.all([
    readJson(fetchImpl, feesUrl()),
    readJson(fetchImpl, pricesUrl()),
  ]);
  return {
    fees: parseRecommendedFees(feesBody),
    usd: parseUsdPrice(pricesBody),
  };
}
