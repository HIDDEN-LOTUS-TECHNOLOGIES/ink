// Mount ordinals.com previews a few at a time. Callers decide when a slot is free.
export function createPreviewQueue(cap) {
  if (!Number.isInteger(cap) || cap < 1) throw new TypeError('Preview cap must be a positive integer');
  let active = 0;
  const pending = [];
  const running = new Set();

  function pump() {
    while (active < cap && pending.length) {
      const job = pending.shift();
      if (job.pv && job.pv.isConnected === false) continue;
      active += 1;
      running.add(job);
      job.start(() => {
        if (!running.delete(job)) return;
        active -= 1;
        pump();
      });
    }
  }

  return {
    enqueue(job) {
      if (!job || typeof job.start !== 'function') throw new TypeError('Preview job needs start');
      if (job.pv && (pending.some((item) => item.pv === job.pv) || [...running].some((item) => item.pv === job.pv))) return;
      pending.push(job);
      pump();
    },
    reset() {
      pending.length = 0;
      const jobs = [...running];
      running.clear();
      active = 0;
      for (const job of jobs) job.cancel?.();
    },
    get active() { return active; },
    get pending() { return pending.length; },
  };
}
