import assert from 'node:assert/strict';
import test from 'node:test';
import { applyScrollRegion } from '../scrollRegion.js';

test('a scrollable table region is focusable and named', () => {
  const attrs = {};
  const wrap = {
    setAttribute(key, value) { attrs[key] = value; },
  };
  applyScrollRegion(wrap, 'Batch file sizes');
  assert.equal(attrs.tabindex, '0');
  assert.equal(attrs.role, 'region');
  assert.equal(attrs['aria-label'], 'Batch file sizes');
  applyScrollRegion(wrap, 'Inscription size');
  assert.equal(attrs['aria-label'], 'Inscription size');
});
