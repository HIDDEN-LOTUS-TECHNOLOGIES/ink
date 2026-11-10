import assert from 'node:assert/strict';
import test from 'node:test';
import { TIER_CUT, standardScores } from '../../assets/rarity.js';
import { normalizeCollection } from '../convert.js';
import { MetadataValidator } from '../metadataValidator.js';

const id = (ch, n = 0) => `${ch.repeat(64)}i${n}`;

test('rejects non-array data', () => {
  const result = MetadataValidator.validateJSONMetadata({ not: 'array' });
  assert.equal(result.valid, false);
  assert.equal(result.errors[0].field, 'root');
  assert.match(result.errors[0].message, /must be an array/);
});

test('rejects empty arrays', () => {
  const result = MetadataValidator.validateJSONMetadata([]);
  assert.equal(result.valid, false);
  assert.match(result.errors[0].message, /cannot be empty/);
});

test('rejects arrays exceeding max items', () => {
  const largeArray = Array(10001).fill({ id: 'test', name: 'Test' });
  const result = MetadataValidator.validateJSONMetadata(largeArray);
  assert.equal(result.valid, false);
  assert.match(result.errors[0].message, /exceeds maximum size/);
});

test('validates correct metadata structure', () => {
  const result = MetadataValidator.validateJSONMetadata([
    { id: id('a'), name: 'Test Item 1', attributes: [{ trait_type: 'Background', value: 'Blue' }, { trait_type: 'Rarity', value: 'Common' }] },
    { id: id('b', 1), meta: { name: 'Test Item 2', attributes: [{ trait_type: 'Background', value: 'Red' }] } },
  ]);
  assert.equal(result.valid, true);
  assert.equal(result.stats.totalItems, 2);
  assert.equal(result.stats.validItems, 2);
  assert.equal(result.stats.traitCategories, 2);
});

test('detects invalid, missing, and duplicate inscription IDs', () => {
  const bad = MetadataValidator.validateJSONMetadata([{ id: 'invalid-id', name: 'Test' }]);
  assert.equal(bad.valid, false);
  assert.equal(bad.stats.badIds, 1);
  const missing = MetadataValidator.validateJSONMetadata([{ id: id('a') }]);
  assert.equal(missing.valid, false);
  assert.ok(missing.errors.some((e) => e.field === 'name'));
  const dup = MetadataValidator.validateJSONMetadata([
    { id: id('a'), name: 'A' },
    { id: id('a'), name: 'B' },
  ]);
  assert.equal(dup.stats.duplicateIds, 1);
  assert.equal(dup.stats.missingIds, 0);
});

test('validates attribute structure and trait warnings', () => {
  const invalid = MetadataValidator.validateJSONMetadata([{
    id: id('a'),
    name: 'Test',
    attributes: [{ trait_type: 'Valid', value: 'Good' }, { trait_type: '', value: 'Bad' }, { trait_type: 'Missing' }],
  }]);
  assert.equal(invalid.valid, false);
  const none = MetadataValidator.validateJSONMetadata([{ id: id('a'), name: 'Test 1' }, { id: id('b', 1), name: 'Test 2' }]);
  assert.equal(none.valid, true);
  assert.equal(none.warnings[0].field, 'attributes');
  const many = [{ trait_type: 'T', value: 'V' }];
  const attributes = Array.from({ length: 101 }, (_, i) => ({ trait_type: `Trait${i}`, value: 'Value' }));
  const wide = MetadataValidator.validateJSONMetadata([{ id: id('a'), name: 'Test', attributes }]);
  assert.ok(wide.warnings.some((w) => w.field === 'attributes'));
  assert.equal(many.length, 1);
});

test('calculates statistics', () => {
  const result = MetadataValidator.validateJSONMetadata([
    { id: id('a'), name: 'Test 1', attributes: [{ trait_type: 'A', value: '1' }, { trait_type: 'B', value: '2' }] },
    { id: id('b', 1), name: 'Test 2', attributes: [{ trait_type: 'A', value: '3' }] },
  ]);
  assert.equal(result.stats.averageTraitsPerItem, 1.5);
  assert.equal(result.stats.traitKeys.length, 2);
});

test('CBOR metadata checks', () => {
  assert.equal(MetadataValidator.validateCBORMetadata({ name: '', description: 'Test' }).valid, false);
  assert.ok(MetadataValidator.validateCBORMetadata({ name: 'Test', description: '' }).warnings.some((w) => w.field === 'description'));
  assert.equal(MetadataValidator.validateCBORMetadata({ name: 'Test', image: `/content/${id('a')}` }).valid, true);
  assert.equal(MetadataValidator.validateCBORMetadata({ name: 'Test', image: '/content/invalid-id' }).valid, false);
  assert.equal(MetadataValidator.validateCBORMetadata({ name: 'Test', image: 'https://example.com/image.png' }).valid, true);
  assert.equal(MetadataValidator.validateCBORMetadata({ name: 'Test', image: 'not-a-valid-url' }).valid, false);
  assert.equal(MetadataValidator.validateCBORMetadata({ name: 'Test', image: 'data:image/png;base64,aaaa' }).valid, true);
  assert.equal(MetadataValidator.validateCBORMetadata({ name: 'Test', attributes: [{ trait_type: 'Background', value: 'Blue' }, { trait_type: 'Rarity', value: 5 }] }).valid, true);
  assert.equal(MetadataValidator.validateCBORMetadata({ name: 'Test', attributes: [{ trait_type: '', value: 'Bad' }, { trait_type: 'Missing', value: null }] }).valid, false);
});

test('file size default has no hard cap and warns past 400 KB', () => {
  assert.equal(MetadataValidator.validateFileSize(JSON.stringify({ test: 'data' })).valid, true);
  const under = MetadataValidator.validateFileSize(JSON.stringify({ data: 'x'.repeat(85 * 1024) }));
  assert.equal(under.warnings.length, 0);
  const over = MetadataValidator.validateFileSize(JSON.stringify({ data: 'x'.repeat(401 * 1024) }));
  assert.equal(over.valid, true);
  assert.ok(over.warnings.some((w) => w.field === 'fileSize'));
  const capped = MetadataValidator.validateFileSize(JSON.stringify({ data: 'x'.repeat(105 * 1024) }), { maxBytes: 100 * 1024, warnBytes: 1024 * 1024 });
  assert.equal(capped.valid, false);
  assert.ok(capped.errors.some((e) => e.field === 'fileSize'));
});

const OFFCHAIN_IMAGE_NOTE = 'These are off-chain image URLs, not on-chain metadata.';

test('off-chain thumbnail fields add one info note', () => {
  const attrs = [{ trait_type: 'Hat', value: 'cap' }];
  const both = MetadataValidator.validateJSONMetadata([
    { id: id('a'), name: 'One', high_res_img_url: 'https://cdn.example/a.png', collection_page_img_url: 'https://cdn.example/b.png', attributes: attrs },
    { id: id('b', 1), meta: { name: 'Two', high_res_img_url: 'https://cdn.example/c.png', attributes: attrs } },
  ]);
  assert.equal(both.warnings.filter((w) => w.message === OFFCHAIN_IMAGE_NOTE).length, 1);
  assert.equal(both.warnings.length, 1);
  assert.equal(both.warnings[0].severity, 'info');
  assert.match(both.summary, /✅/);
  const blank = MetadataValidator.validateJSONMetadata([
    { id: id('a'), name: 'One', high_res_img_url: '  ', attributes: attrs },
  ]);
  assert.equal(blank.warnings.filter((w) => w.message === OFFCHAIN_IMAGE_NOTE).length, 0);
  const viaPage = MetadataValidator.validateComplete(JSON.stringify([
    { id: id('c'), meta: { name: 'Three', collection_page_img_url: 'https://cdn.example/page.png', attributes: attrs } },
  ]));
  assert.equal(viaPage.warnings.filter((w) => w.message === OFFCHAIN_IMAGE_NOTE).length, 1);
});

test('gamma on-chain rows warn that they have no inscription id yet', () => {
  const data = [
    { file: '1.png', meta: { name: 'One', attributes: [{ trait_type: 'Hat', value: 'cap' }] } },
    { file: '2.png', meta: { name: 'Two', attributes: [{ trait_type: 'Hat', value: 'cap' }] } },
  ];
  const result = MetadataValidator.validateJSONMetadata(data);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.stats.missingIds, 2);
  assert.deepEqual(result.warnings.map((w) => w.message), [
    '2 rows have no inscription id yet. id-based exports are disabled for those rows.',
  ]);
  const namedByFile = MetadataValidator.validateJSONMetadata([
    { file: '1.png', meta: { attributes: [{ trait_type: 'Hat', value: 'cap' }] } },
  ]);
  assert.equal(namedByFile.errors.filter((e) => e.field === 'name' || e.field === 'id').length, 0);
  assert.ok(namedByFile.warnings.some((w) => w.message === '1 row has no inscription id yet. id-based exports are disabled for those rows.'));
  const plain = MetadataValidator.validateJSONMetadata([{ name: 'Missing', attributes: [{ trait_type: 'Hat', value: 'cap' }] }]);
  assert.equal(plain.valid, false);
  assert.ok(plain.errors.some((e) => e.field === 'id' && e.severity === 'critical'));
});

test('trait hygiene warns and does not rewrite values or ink rarity tiers', () => {
  const data = [
    { id: id('a'), name: 'One', attributes: [
      { trait_type: 'Background', value: 'Sun' },
      { trait_type: 'Background', value: 'Moon' },
      { trait_type: 'Hat', value: 'Cap' },
    ] },
    { id: id('b', 1), name: 'Two', attributes: [{ trait_type: 'background', value: 'Night' }] },
  ];
  const before = JSON.stringify(data);
  const result = MetadataValidator.validateJSONMetadata(data);
  assert.equal(JSON.stringify(data), before);
  assert.equal(result.errors.length, 0);
  const messages = result.warnings.map((w) => w.message);
  assert.ok(messages.includes('Trait "Background" is missing on 1 item. Use "None" instead of leaving it out.'));
  assert.ok(messages.includes('Trait "Hat" is missing on 1 item. Use "None" instead of leaving it out.'));
  assert.ok(messages.includes('Trait "background" is missing on 1 item. Use "None" instead of leaving it out.'));
  assert.ok(messages.includes('Trait keys differ only by case: Background and background.'));
  const dup = result.warnings.find((w) => w.message.includes('Duplicate trait_type'));
  assert.equal(dup.index, 0);
  assert.equal(dup.message, 'Duplicate trait_type "Background" on one item.');
  const items = normalizeCollection(JSON.parse(before));
  assert.deepEqual(items[0].t, { Background: 'Moon', Hat: 'Cap' });
  assert.deepEqual(items[1].t, { background: 'Night' });
  const scored = items.map((item) => ({ ...item, t: { ...item.t } }));
  standardScores(scored);
  assert.equal(scored[0].t.Hat, 'Cap');
  assert.equal(scored[1].t.background, 'Night');
  assert.equal(JSON.stringify(scored).includes('"None"'), false);
  assert.deepEqual(TIER_CUT.map((tier) => [tier[0], tier[1], tier[2]]), [
    ['legendary', 0.01, 'Legendary'],
    ['epic', 0.05, 'Epic'],
    ['rare', 0.15, 'Rare'],
    ['uncommon', 0.4, 'Uncommon'],
    ['common', Infinity, 'Common'],
  ]);
  const padded = MetadataValidator.validateJSONMetadata([
    { id: id('a'), name: 'One', attributes: [{ trait_type: 'Hat', value: 'Cap' }, { trait_type: 'Background', value: 'Sun' }] },
    { id: id('b', 1), name: 'Two', attributes: [{ trait_type: 'Hat', value: 'None' }, { trait_type: 'Background', value: 'Moon' }] },
  ]);
  assert.equal(padded.warnings.length, 0);
  assert.equal(normalizeCollection([
    { id: id('b', 1), name: 'Two', attributes: [{ trait_type: 'Hat', value: 'None' }] },
  ])[0].t.Hat, 'None');
  const caseOnly = MetadataValidator.validateJSONMetadata([
    { id: id('a'), name: 'One', attributes: [{ trait_type: 'Hat', value: 'cap' }, { trait_type: 'hat', value: 'helm' }] },
  ]);
  assert.equal(caseOnly.warnings.some((w) => w.message.includes('Duplicate trait_type')), false);
  assert.ok(caseOnly.warnings.some((w) => w.message === 'Trait keys differ only by case: Hat and hat.'));
});

test('validateComplete', () => {
  const ok = MetadataValidator.validateComplete(JSON.stringify([{ id: id('a'), name: 'Test Item', attributes: [{ trait_type: 'Background', value: 'Blue' }] }]));
  assert.equal(ok.valid, true);
  assert.match(ok.summary, /✅/);
  const huge = MetadataValidator.validateComplete(JSON.stringify({ data: 'x'.repeat(105 * 1024) }), { maxBytes: 100 * 1024, warnBytes: 1024 * 1024 });
  assert.equal(huge.valid, false);
  assert.ok(huge.errors.some((e) => e.severity === 'critical'));
  const bad = MetadataValidator.validateComplete('{ invalid json }');
  assert.ok(bad.errors.some((e) => e.field === 'json'));
});
