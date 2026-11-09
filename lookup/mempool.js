// Optional mainnet reads. The lookup still renders if mempool.space does not answer.
// Signet fees stay in the signet lab. ordinals.com inscription ids are mainnet.

export const MEMPOOL_ORIGIN = 'https://mempool.space';

function txid(value) {
  const id = String(value || '').trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(id)) throw new Error('That is not a transaction id.');
  return id;
}

function mempoolUrl(path) {
  const url = new URL(path, MEMPOOL_ORIGIN);
  if (url.origin !== MEMPOOL_ORIGIN) throw new Error('Refused non-mempool.space URL.');
  if (url.protocol !== 'https:') throw new Error('Refused non-HTTPS endpoint.');
  if (url.pathname.startsWith('/signet/') || url.pathname.includes('mainnet')) {
    throw new Error('Refused endpoint.');
  }
  return url.toString();
}

export function feesUrl() {
  return mempoolUrl('/api/v1/fees/recommended');
}

export function txUrl(value) {
  return mempoolUrl(`/api/tx/${txid(value)}`);
}

export function explorerTxUrl(value) {
  return mempoolUrl(`/tx/${txid(value)}`);
}

const FEE_KEYS = ['fastestFee', 'halfHourFee', 'hourFee', 'economyFee', 'minimumFee'];

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

export function parseTxSummary(body) {
  if (!body || typeof body !== 'object') return null;
  const id = typeof body.txid === 'string' ? body.txid.toLowerCase() : '';
  if (!/^[a-f0-9]{64}$/.test(id)) return null;
  const fee = typeof body.fee === 'number' && Number.isFinite(body.fee) && body.fee >= 0 ? body.fee : null;
  const weight = typeof body.weight === 'number' && Number.isFinite(body.weight) && body.weight > 0 ? body.weight : null;
  const givenVsize = typeof body.vsize === 'number' && Number.isFinite(body.vsize) && body.vsize > 0 ? body.vsize : null;
  const vsize = givenVsize ?? (weight == null ? null : Math.ceil(weight / 4));
  const status = body.status && typeof body.status === 'object' ? body.status : {};
  const blockHeight = typeof status.block_height === 'number' && Number.isFinite(status.block_height) ? status.block_height : null;
  return {
    txid: id,
    fee,
    vsize,
    feeRate: fee != null && vsize ? fee / vsize : null,
    confirmed: status.confirmed === true,
    blockHeight,
  };
}

async function readQuiet(fetchImpl, url) {
  try {
    const res = await fetchImpl(url);
    if (!res.ok) return null;
    return JSON.parse(await res.text());
  } catch {
    return null;
  }
}

export async function lookupMempool(value, options = {}) {
  const id = txid(value);
  const fetchImpl = options.fetch ?? globalThis.fetch;
  const [feesBody, txBody] = await Promise.all([
    readQuiet(fetchImpl, feesUrl()),
    readQuiet(fetchImpl, txUrl(id)),
  ]);
  return {
    fees: parseRecommendedFees(feesBody),
    tx: parseTxSummary(txBody),
  };
}
