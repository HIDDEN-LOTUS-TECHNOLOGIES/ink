import { NAME_FALLBACK_NOTE, displaySummary, mergeIdsAndTraits, reviewNote, unpairedLines } from '../mergeIds.js';

const $ = (sel) => document.querySelector(sel);
const downloadButtons = ['#toInscriptions', '#toJson', '#toIds', '#toMeta'];
let current = null;

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function download(name, text, type) {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function setDownloads(ready) {
  for (const sel of downloadButtons) $(sel).disabled = !ready;
}

async function textFrom(input, area) {
  const file = input.files && input.files[0];
  if (file) return file.text();
  return area.value;
}

function gapLabel(row) {
  const where = `Row ${row.index}`;
  if (row.reason === 'unmatched' && row.id) return `${where}: ${row.id} is not in the ids file`;
  if (row.id) return `${where}: ${row.id}`;
  if (row.name) return `${where}: ${row.name}`;
  return where;
}

function listBlock(title, rows) {
  if (!rows.length) return '';
  const shown = rows.slice(0, 40);
  const more = rows.length > shown.length ? `<li>And ${rows.length - shown.length} more.</li>` : '';
  return `<p class="meta">${esc(title)}</p><ul>${shown.map((row) => `<li>${esc(row)}</li>`).join('')}${more}</ul>`;
}

function renderValidation(validation, report) {
  const summary = $('#summary');
  if (!validation) {
    summary.textContent = '';
    summary.classList.remove('warn');
    $('#issues').innerHTML = '';
    return;
  }
  const headline = displaySummary(report, validation);
  summary.classList.toggle('warn', Boolean(report?.needsReview));
  const stats = validation.stats;
  const lines = [headline];
  if (stats) {
    lines.push(`${stats.totalItems} items, ${stats.traitCategories} trait keys, ${stats.missingIds} missing ids, ${stats.duplicateIds} duplicate ids, ${stats.badIds} bad inscription ids.`);
  }
  summary.textContent = lines.join('\n');
  const notes = validation.warnings.filter((row) => row.severity === 'info');
  const warns = validation.warnings.filter((row) => row.severity !== 'info');
  const rows = [...notes, ...warns, ...validation.errors].slice(0, 80);
  $('#issues').innerHTML = rows.map((row) => {
    if (row.severity === 'info') return `<li class="info">${esc(row.message)}</li>`;
    const where = row.index != null ? ` #${row.index}` : '';
    return `<li class="${row.severity || 'warn'}">${esc(row.field)}${where}: ${esc(row.message)}</li>`;
  }).join('') || '<li>No item issues.</li>';
}

function render(result) {
  current = result.ok ? result : null;
  setDownloads(Boolean(current && current.items.length));
  if (!result.ok) {
    $('#status').textContent = result.error;
    $('#report').textContent = 'Nothing merged yet.';
    renderValidation(null, null);
    return;
  }
  const report = result.report;
  const counts = [
    `Matched: ${report.matched}.`,
    `Ids with no traits: ${report.idsWithNoTraits.length}.`,
    `Traits with no id: ${report.traitsWithNoId.length}.`,
    `Duplicate ids: ${report.duplicateIds.length}.`,
    `Malformed inscription ids: ${report.malformedIds.length}.`,
  ].join('\n');
  const warnLines = [];
  if (report.warning) warnLines.push(`Warning: ${report.warning}`);
  for (const line of unpairedLines(report)) warnLines.push(line);
  if (report.namesFromNumber.length) warnLines.push(NAME_FALLBACK_NOTE);
  if (report.needsReview) warnLines.push(reviewNote(report));
  const warning = warnLines.length
    ? `<div class="warn">${warnLines.map((line) => `<p>${esc(line)}</p>`).join('')}</div>`
    : '';
  const lists = [
    listBlock('Ids with no traits', report.idsWithNoTraits),
    listBlock('Traits with no id', report.traitsWithNoId.map(gapLabel)),
    listBlock('Duplicate ids', report.duplicateIds.map((row) => `${row.id} (${row.source} file, ${row.count})`)),
    listBlock('Malformed inscription ids', report.malformedIds.map((row) => `${row.source} file, row ${row.index}: ${row.value || '(empty)'}`)),
  ].join('');
  $('#report').innerHTML = `${warning}<p class="counts">${esc(counts)}</p>${lists}`;
  renderValidation(result.validation, report);
  const noun = result.items.length === 1 ? 'item' : 'items';
  $('#status').textContent = `Merged ${result.items.length} paired ${noun}.`;
}

$('#merge').addEventListener('click', async () => {
  $('#status').textContent = 'Merging…';
  try {
    const ids = await textFrom($('#ids-file'), $('#ids-raw'));
    const traits = await textFrom($('#traits-file'), $('#traits-raw'));
    render(mergeIdsAndTraits(ids, traits, {
      includeIdsWithoutTraits: $('#include-empty').checked,
    }));
  } catch (err) {
    current = null;
    setDownloads(false);
    $('#status').textContent = err instanceof Error ? err.message : 'Could not read those files.';
  }
});

$('#toInscriptions').addEventListener('click', () => {
  if (!current?.items.length) return;
  download('inscriptions.json', JSON.stringify(current.outputs.inscriptions), 'application/json');
});

$('#toJson').addEventListener('click', () => {
  if (!current?.items.length) return;
  download('collection.json', JSON.stringify(current.outputs.magicEden), 'application/json');
});

$('#toIds').addEventListener('click', () => {
  if (!current?.outputs.idsTxt) return;
  download('ids.txt', current.outputs.idsTxt, 'text/plain');
});

$('#toMeta').addEventListener('click', () => {
  if (!current) return;
  download('meta.json', `${JSON.stringify(current.outputs.meta, null, 2)}\n`, 'application/json');
});
