import assert from 'node:assert/strict';
import test from 'node:test';
import { appendStatus, statusLines } from '../statusLines.js';

test('left-out rows are separate lines', () => {
  const message = 'Left out of ids.txt:\n#1 abc: index has a leading zero\n#2 nope: not an inscription id';
  assert.deepEqual(statusLines(message), [
    'Left out of ids.txt:',
    '#1 abc: index has a leading zero',
    '#2 nope: not an inscription id',
  ]);
  const nodes = [];
  const parent = {
    replaceChildren() { nodes.length = 0; },
    append(node) { nodes.push(node); },
  };
  appendStatus(parent, (tag) => ({ tag }), message);
  assert.deepEqual(nodes.map((node) => node.tag || node), [
    'Left out of ids.txt:',
    'br',
    '#1 abc: index has a leading zero',
    'br',
    '#2 nope: not an inscription id',
  ]);
});
