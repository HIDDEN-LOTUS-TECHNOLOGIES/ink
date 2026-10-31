import assert from 'node:assert/strict';
import test from 'node:test';
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
