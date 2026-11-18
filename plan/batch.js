// One ord wallet batch is one commit and one reveal.
// ord 0.29.1 src/wallet/batch/plan.rs create_batch_transactions builds a single
// reveal script with Inscription::append_batch_reveal_script, then checks that
// reveal's weight against MAX_STANDARD_TX_WEIGHT unless --no-limit is set.
// separate-outputs (docs/src/guides/batch-inscribing.md) gives each file its own
// postage output. The 400,000 weight-unit cap applies to that whole reveal.

import { contentFromFile } from '../estimate/content.js';
import {
  COMMIT_VBYTES,
  MAX_STANDARD_TX_WEIGHT,
  estimateInscription,
  measureBatch,
  parsePostage,
  POSTAGE_DEFAULT,
  totalCost,
} from '../estimate/size.js';

export function overWeightMessage(detail) {
  return `${detail} That is over Bitcoin Core's 400,000 weight-unit standardness cap. ord refuses that reveal unless --no-limit is used.`;
}

export function planBatch(files, { postage = POSTAGE_DEFAULT } = {}) {
  const postageSats = parsePostage(postage);
  const accepted = [];
  const rejected = [];
  for (const file of files) {
    const filename = String(file?.name || 'file');
    const length = file?.size ?? file?.bytes?.length ?? 0;
    if (file?.error) {
      rejected.push({ filename, bytes: length, message: String(file.error) });
      continue;
    }
    if (length > MAX_STANDARD_TX_WEIGHT) {
      rejected.push({
        filename,
        bytes: length,
        message: overWeightMessage(`File is ${length} bytes.`),
      });
      continue;
    }
    try {
      const content = contentFromFile({
        name: file?.name,
        type: file?.type,
        bytes: file?.bytes,
        size: file?.size,
      });
      const measured = estimateInscription({
        body: content.body,
        contentType: content.contentType,
        postage: postageSats,
      });
      if (measured.weightClass === 'over') {
        rejected.push({
          filename: content.label,
          bytes: measured.bodyBytes,
          message: overWeightMessage(`Reveal weight is ${measured.revealWeight}.`),
        });
        continue;
      }
      accepted.push({ ...measured, filename: content.label });
    } catch (error) {
      rejected.push({
        filename,
        bytes: length,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
  const batches = packReveals(accepted);
  return {
    accepted,
    rejected,
    batches,
    combined: measureBatch(accepted),
    totals: batchTotals(batches),
  };
}

// Greedy pack in file order. A file that fits alone starts a new batch when
// adding it would push the reveal over 400,000 weight units.
export function packReveals(rows) {
  const groups = [];
  let current = [];
  for (const row of rows) {
    if (!current.length) {
      current = [row];
      continue;
    }
    if (measureBatch([...current, row]).weightClass === 'over') {
      groups.push(current);
      current = [row];
    } else {
      current = [...current, row];
    }
  }
  if (current.length) groups.push(current);
  return groups.map((files) => ({ ...measureBatch(files), files }));
}

export function batchTotals(batches) {
  const totals = {
    count: 0,
    bodyBytes: 0,
    scriptBytes: 0,
    witnessBytes: 0,
    commitVbytes: 0,
    revealVbytes: 0,
    revealWeight: 0,
    postage: 0,
    batches: batches.length,
  };
  for (const batch of batches) {
    totals.count += batch.count;
    totals.bodyBytes += batch.bodyBytes;
    totals.scriptBytes += batch.scriptBytes;
    totals.witnessBytes += batch.witnessBytes;
    totals.commitVbytes += batch.commitVbytes;
    totals.revealVbytes += batch.revealVbytes;
    totals.revealWeight += batch.revealWeight;
    totals.postage += batch.postage;
  }
  totals.totalVbytes = totals.commitVbytes + totals.revealVbytes;
  return totals;
}

// One commit fee and one reveal fee per batch, then the batches are added.
export function batchCost(batches, rate) {
  const sum = { commitFee: 0, revealFee: 0, fee: 0, postage: 0, total: 0 };
  for (const batch of batches) {
    const cost = totalCost(batch, rate);
    sum.commitFee += cost.commitFee;
    sum.revealFee += cost.revealFee;
    sum.fee += cost.fee;
    sum.postage += cost.postage;
    sum.total += cost.total;
  }
  return sum;
}

export { COMMIT_VBYTES };
