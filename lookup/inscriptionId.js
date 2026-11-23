// Inscription ids follow kit/inscriptionId.js. This parser stays quiet and also
// accepts an ordinals.com URL, because that is what people paste from the address bar.
// Hex and the "i" separator are case-insensitive. The index still cannot have a leading zero.

import { isValidInscriptionId, parseCanonicalInscriptionId } from '../kit/inscriptionId.js';

export { isValidInscriptionId };

const ID_RE = /([0-9a-fA-F]{64})[iI](0|[1-9][0-9]*)/;

function fromMatch(match) {
  return parseCanonicalInscriptionId(`${match[1]}i${match[2]}`);
}

function fromUrl(text) {
  let url;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (host !== 'ordinals.com' && host !== 'www.ordinals.com') return null;
  const matches = [...url.pathname.matchAll(new RegExp(ID_RE.source, 'g'))];
  if (!matches.length) return null;
  return fromMatch(matches[matches.length - 1]);
}

export function parseInscriptionId(input) {
  let text = String(input ?? '').trim();
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    text = text.slice(1, -1).trim();
  }
  if (!text) return null;
  const direct = parseCanonicalInscriptionId(text);
  if (direct) return direct;
  if (/^ordinals\.com\//i.test(text)) return fromUrl(`https://${text}`);
  return fromUrl(text);
}

