import assert from 'node:assert/strict';
import test from 'node:test';
import { createPreviewQueue } from '../previewQueue.js';

test('mounts only up to the cap, then continues as slots free', () => {
  const queue = createPreviewQueue(2);
  const started = [];
  for (let i = 0; i < 5; i += 1) {
    queue.enqueue({ start(done) { started.push({ i, done }); } });
  }
  assert.equal(started.length, 2);
  assert.equal(queue.active, 2);
  assert.equal(queue.pending, 3);
  started[0].done();
  assert.equal(started.length, 3);
  assert.equal(queue.active, 2);
  assert.equal(queue.pending, 2);
  started[1].done();
  started[2].done();
  assert.equal(started.length, 5);
  assert.equal(queue.active, 2);
  started[3].done();
  started[4].done();
  assert.equal(queue.active, 0);
  assert.equal(queue.pending, 0);
});

test('a disconnected preview does not take a slot', () => {
  const queue = createPreviewQueue(1);
  let started = 0;
  queue.enqueue({ pv: { isConnected: false }, start() { started += 1; } });
  queue.enqueue({ start(done) { started += 1; done(); } });
  assert.equal(started, 1);
  assert.equal(queue.active, 0);
  assert.equal(queue.pending, 0);
});

test('reset drops the queue and ignores a late completion', () => {
  const queue = createPreviewQueue(1);
  const cancelled = [];
  let late = null;
  let second = 0;
  queue.enqueue({
    start(done) { late = done; },
    cancel() { cancelled.push('first'); },
  });
  queue.enqueue({ start() { second += 1; } });
  assert.equal(queue.pending, 1);
  queue.reset();
  assert.equal(queue.active, 0);
  assert.equal(queue.pending, 0);
  assert.deepEqual(cancelled, ['first']);
  late();
  assert.equal(queue.active, 0);
  assert.equal(second, 0);
});

test('the same element is not mounted twice', () => {
  const queue = createPreviewQueue(2);
  const pv = { isConnected: true };
  let started = 0;
  const job = { pv, start() { started += 1; } };
  queue.enqueue(job);
  queue.enqueue({ pv, start() { started += 1; } });
  assert.equal(started, 1);
  assert.equal(queue.pending, 0);
});

test('refuses a cap below 1', () => {
  assert.throws(() => createPreviewQueue(0), /positive integer/);
});
