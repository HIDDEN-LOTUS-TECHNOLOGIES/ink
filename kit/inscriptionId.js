// ord 0.29.1 src/inscriptions/inscription_id.rs, plus the explorer URI rule
// that the text form is case-insensitive (docs/src/guides/explorer.md).
// Input is lowercased first. The index is a u32 with no leading zeros,
// except the index 0 itself. Display form is lowercase.

export const MAX_INSCRIPTION_INDEX = 0xffffffff;

export function parseCanonicalInscriptionId(value) {
  const text = String(value ?? '').trim().toLowerCase();
  const match = text.match(/^([0-9a-f]{64})i(0|[1-9][0-9]*)$/);
  if (!match) return null;
  if (match[2].length > 10) return null;
  const index = Number(match[2]);
  if (!Number.isSafeInteger(index) || index > MAX_INSCRIPTION_INDEX) return null;
  return { txid: match[1], index, id: `${match[1]}i${index}` };
}

export function isValidInscriptionId(id) {
  return parseCanonicalInscriptionId(id) != null;
}

export function inscriptionIdProblem(value) {
  if (value == null || String(value).trim() === '') return 'no inscription id';
  if (parseCanonicalInscriptionId(value)) return '';
  const text = String(value).trim().toLowerCase();
  if (/^[0-9a-f]{64}i0[0-9]+$/.test(text)) return 'index has a leading zero';
  if (/^[0-9a-f]{64}i[0-9]+$/.test(text)) return 'index does not fit in u32';
  return 'not an inscription id';
}
