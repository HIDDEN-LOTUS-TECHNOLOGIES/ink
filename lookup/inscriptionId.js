// Inscription ids follow kit/inscriptionId.js. This parser stays quiet and also
// accepts an ordinals.com URL, because that is what people paste from the address bar.
// Hex and the "i" separator are case-insensitive. A URL id has to be one whole
// path segment: the shared rules reject a leading zero and an index past u32.

import { isValidInscriptionId, parseCanonicalInscriptionId } from '../kit/inscriptionId.js';

export { isValidInscriptionId };

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
  const segments = url.pathname.split('/').filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i--) {
    const parsed = parseCanonicalInscriptionId(segments[i]);
    if (parsed) return parsed;
  }
  return null;
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
