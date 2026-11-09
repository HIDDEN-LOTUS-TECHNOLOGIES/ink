import assert from 'node:assert/strict';
import test from 'node:test';
import { encodeCbor, toHex } from '../../kit/cbor.js';
import {
  explorerTxUrl,
  feesUrl,
  lookupMempool,
  parseRecommendedFees,
  parseTxSummary,
  txUrl,
} from '../mempool.js';
import {
  childrenUrl,
  contentUrl,
  inscriptionUrl,
  lookupInscription,
  metadataUrl,
  parentsUrl,
  parseIdPage,
  parseInscription,
  previewPlan,
} from '../ordinals.js';

const id = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1fi0';
const txid = id.slice(0, 64);
const child = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1fi1';

function response(text, status = 200) {
  return { status, ok: status >= 200 && status < 300, async text() { return text; } };
}

function jsonResponse(body, status = 200) {
  return response(JSON.stringify(body), status);
}

function textResponse(text, status) {
  return response(text, status);
}

function mockFetch(routes) {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(String(url));
    const hit = routes[String(url)];
    if (!hit) return textResponse('missing', 404);
    return hit;
  };
  return { fetchImpl, calls };
}

function record(extra = {}) {
  return {
    charms: ['cursed'],
    content_type: 'text/plain;charset=utf-8',
    content_length: 12,
    delegate: null,
    fee: 1000,
    height: 800000,
    id,
    number: 42,
    output: `${txid}:0`,
    sat: null,
    satpoint: `${txid}:0:0`,
    timestamp: 1700000000,
    value: 546,
    address: 'bc1qexample',
    ...extra,
  };
}

test('builds only official ordinals.com /r and content urls', () => {
  assert.equal(inscriptionUrl(id.toUpperCase()), `https://ordinals.com/r/inscription/${id}`);
  assert.equal(metadataUrl(id), `https://ordinals.com/r/metadata/${id}`);
  assert.equal(contentUrl(`https://ordinals.com/content/${id}`), `https://ordinals.com/content/${id}`);
  assert.equal(childrenUrl(id, 0), `https://ordinals.com/r/children/${id}`);
  assert.equal(childrenUrl(id, 2), `https://ordinals.com/r/children/${id}/2`);
  assert.equal(parentsUrl(id, 0), `https://ordinals.com/r/parents/${id}`);
  assert.equal(parentsUrl(id, '1'), `https://ordinals.com/r/parents/${id}/1`);
  assert.equal(childrenUrl(id, '1/inscriptions'), `https://ordinals.com/r/children/${id}`);
  assert.throws(() => inscriptionUrl('not-an-id'), /inscription id/);
  assert.throws(() => childrenUrl('../etc'), /inscription id/);
});

test('parses an inscription record and chooses a content preview', () => {
  const parsed = parseInscription(record());
  assert.equal(parsed.number, 42);
  assert.equal(parsed.contentType, 'text/plain;charset=utf-8');
  assert.equal(parsed.contentLength, 12);
  assert.deepEqual(parsed.charms, ['cursed']);
  assert.equal(previewPlan(parsed).kind, 'text');
  assert.equal(previewPlan(parsed).url, `https://ordinals.com/content/${id}`);

  assert.equal(previewPlan(parseInscription(record({ content_type: 'image/png', content_length: 80 }))).kind, 'image');
  assert.equal(previewPlan(parseInscription(record({ content_type: 'image/svg+xml', content_length: 80 }))).kind, 'image');
  assert.equal(previewPlan(parseInscription(record({ content_type: 'text/html', content_length: 80 }))).kind, 'html');
  assert.equal(previewPlan(parseInscription(record({ content_type: 'text/html', content_length: 2_000_001 }))).kind, 'link');
  assert.equal(previewPlan(parseInscription(record({ content_type: 'audio/mpeg', content_length: 80 }))).kind, 'audio');
  assert.equal(previewPlan(parseInscription(record({ content_type: 'model/gltf-binary', content_length: 3726620 }))).kind, 'link');
  assert.equal(previewPlan(parseInscription(record({ content_type: 'text/plain', content_length: null }))).kind, 'link');
  assert.equal(previewPlan(parseInscription(record({ content_length: 0 }))).kind, 'empty');
  assert.equal(parseInscription(record({ number: -13 })).number, -13);
  assert.throws(() => parseInscription(record({ number: '42' })), /number/);
});

test('parses child pages and parent pages', () => {
  assert.deepEqual(parseIdPage({ ids: [child.toUpperCase()], more: true, page: 0 }), {
    ids: [child],
    more: true,
    page: 0,
  });
  assert.deepEqual(parseIdPage({ ids: [], more: false, page_index: 3 }), {
    ids: [],
    more: false,
    page: 3,
  });
  assert.throws(() => parseIdPage({ ids: ['nope'], more: false, page: 0 }), /id/);
  assert.throws(() => parseIdPage(['just', 'ids']), /page/);
});

test('looks up number, traits, and children without calling content or mempool', async () => {
  const hex = toHex(encodeCbor({
    name: 'Puppet',
    attributes: [{ trait_type: 'Hat', value: 'cap' }],
  }));
  const routes = {
    [inscriptionUrl(id)]: jsonResponse(record({ content_type: 'image/png', content_length: 40 })),
    [metadataUrl(id)]: jsonResponse(hex),
    [childrenUrl(id, 2)]: jsonResponse({ ids: [child], more: false, page: 2 }),
    [parentsUrl(id, 1)]: jsonResponse({ ids: [id], more: false, page_index: 1 }),
  };
  const { fetchImpl, calls } = mockFetch(routes);
  const result = await lookupInscription(`  ${id.toUpperCase()}  `, { fetch: fetchImpl, childPage: '2', parentPage: 1 });
  assert.equal(result.record.number, 42);
  assert.equal(result.record.contentType, 'image/png');
  assert.equal(result.metadata.name, 'Puppet');
  assert.deepEqual(result.metadata.traits, [{ trait: 'Hat', value: 'cap' }]);
  assert.deepEqual(result.children.ids, [child]);
  assert.equal(result.children.page, 2);
  assert.deepEqual(result.parents.ids, [id]);
  assert.equal(result.preview.kind, 'image');
  assert.equal(result.txid, txid);
  assert.deepEqual(calls.sort(), Object.keys(routes).sort());
  assert.equal(calls.some((url) => url.includes('/content/') || url.includes('mempool.space')), false);
});

test('treats missing metadata as empty and keeps the record when a side request fails', async () => {
  const routes = {
    [inscriptionUrl(id)]: jsonResponse(record()),
    [metadataUrl(id)]: textResponse('inscription metadata not found', 404),
    [childrenUrl(id)]: jsonResponse({ ids: 'nope' }),
    [parentsUrl(id)]: textResponse('nope', 500),
  };
  const { fetchImpl, calls } = mockFetch(routes);
  const result = await lookupInscription(id, { fetch: fetchImpl });
  assert.equal(result.record.number, 42);
  assert.equal(result.metadata.error, '');
  assert.deepEqual(result.metadata.traits, []);
  assert.match(result.children.error, /id page|Unexpected/);
  assert.match(result.parents.error, /500/);
  assert.equal(calls.includes(contentUrl(id)), false);
});

test('rejects an unknown id and a bad id before using a bad response', async () => {
  const { fetchImpl, calls } = mockFetch({
    [inscriptionUrl(id)]: textResponse('inscription not found', 404),
    [metadataUrl(id)]: textResponse('missing', 404),
    [childrenUrl(id)]: textResponse('missing', 404),
    [parentsUrl(id)]: textResponse('missing', 404),
  });
  await assert.rejects(lookupInscription(id, { fetch: fetchImpl }), /No inscription/);
  await assert.rejects(lookupInscription('nope', { fetch: fetchImpl }), (err) => err.code === 'bad-id');
  assert.equal(calls.includes('nope'), false);
  assert.equal(calls.every((url) => url.startsWith('https://ordinals.com/r/')), true);
});

test('reads mempool fees and a reveal transaction without blocking on failure', async () => {
  assert.equal(feesUrl(), 'https://mempool.space/api/v1/fees/recommended');
  assert.equal(txUrl(txid), `https://mempool.space/api/tx/${txid}`);
  assert.equal(explorerTxUrl(txid.toUpperCase()), `https://mempool.space/tx/${txid}`);
  assert.throws(() => txUrl(`${txid.slice(0, 32)}`), /transaction id/);

  const fees = { fastestFee: 3, halfHourFee: 2, hourFee: 1, economyFee: 1, minimumFee: 1 };
  assert.deepEqual(parseRecommendedFees(fees), fees);
  assert.equal(parseRecommendedFees({ fastestFee: 1 }), null);

  const summary = parseTxSummary({
    txid,
    fee: 322,
    size: 1040,
    weight: 1286,
    status: { confirmed: true, block_height: 767430 },
  });
  assert.equal(summary.vsize, 322);
  assert.equal(summary.feeRate, 1);
  assert.equal(summary.confirmed, true);
  assert.equal(summary.blockHeight, 767430);
  assert.equal(parseTxSummary({ txid, fee: 10, weight: 80, status: { confirmed: false } }).confirmed, false);

  const { fetchImpl, calls } = mockFetch({
    [feesUrl()]: textResponse('down', 502),
    [txUrl(txid)]: jsonResponse({ txid, fee: 322, weight: 1286, status: { confirmed: true, block_height: 767430 } }),
  });
  const quiet = await lookupMempool(txid, { fetch: fetchImpl });
  assert.equal(quiet.fees, null);
  assert.equal(quiet.tx.blockHeight, 767430);
  assert.deepEqual(calls.sort(), [feesUrl(), txUrl(txid)].sort());

  const failed = await lookupMempool(txid, {
    fetch: async () => { throw new Error('offline'); },
  });
  assert.deepEqual(failed, { fees: null, tx: null });
});
