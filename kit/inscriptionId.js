// ord 0.29.1 src/inscriptions/inscription_id.rs
// FromStr requires ASCII, 64 hex characters, an 'i' separator, then a u32.
// Display writes the txid in lowercase and the index in decimal with no
// leading zeros, except the index 0 itself. This helper accepts only that
// canonical form. Index 4294967296 does not fit in u32.

export const MAX_INSCRIPTION_INDEX = 0xffffffff;

export function parseCanonicalInscriptionId(value) {
  const text = String(value ?? '');
  const match = text.match(/^([0-9a-f]{64})i(0|[1-9][0-9]*)$/);
  if (!match) return null;
  if (match[2].length > 10) return null;
  const index = Number(match[2]);
  if (!Number.isSafeInteger(index) || index > MAX_INSCRIPTION_INDEX) return null;
  return { txid: match[1], index, id: text };
}

export function isValidInscriptionId(id) {
  return parseCanonicalInscriptionId(id) != null;
}
