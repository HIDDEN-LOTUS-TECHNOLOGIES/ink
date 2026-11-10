// Per-file inscription estimates and batch totals.
// Envelope size and fee math come from the estimate modules.

import { contentFromFile } from '../estimate/content.js';
import { estimateInscription, parsePostage, POSTAGE_DEFAULT, totalCost } from '../estimate/size.js';

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
      accepted.push({ ...measured, filename: content.label });
    } catch (error) {
      rejected.push({
        filename,
        bytes: length,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { accepted, rejected, totals: batchTotals(accepted) };
}

export function batchTotals(rows) {
  const totals = {
    count: rows.length,
    bodyBytes: 0,
    scriptBytes: 0,
    witnessBytes: 0,
    commitVbytes: 0,
    revealVbytes: 0,
    totalVbytes: 0,
    postage: 0,
  };
  for (const row of rows) {
    totals.bodyBytes += row.bodyBytes;
    totals.scriptBytes += row.scriptBytes;
    totals.witnessBytes += row.witnessBytes;
    totals.commitVbytes += row.commitVbytes;
    totals.revealVbytes += row.revealVbytes;
    totals.totalVbytes += row.totalVbytes;
    totals.postage += row.postage;
  }
  return totals;
}

// Sum of per-file totals. Each file uses totalCost, so a fractional sat/vB is
// rounded up on that file's commit and again on its reveal, then the files are added.
export function batchCost(rows, rate) {
  const sum = { commitFee: 0, revealFee: 0, fee: 0, postage: 0, total: 0 };
  for (const row of rows) {
    const cost = totalCost(row, rate);
    sum.commitFee += cost.commitFee;
    sum.revealFee += cost.revealFee;
    sum.fee += cost.fee;
    sum.postage += cost.postage;
    sum.total += cost.total;
  }
  return sum;
}
