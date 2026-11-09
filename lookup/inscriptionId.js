// Inscription ids are the reveal txid, a literal "i", and the inscription index.
// Same form as kit/parentInscription.js. This parser stays quiet and also accepts
// an ordinals.com URL, because that is what people paste from the address bar.

const ID_RE = /([a-fA-F0-9]{64})i(\d+)/;
const MAX_INDEX = 0xffffffff;

function fromMatch(match) {
  const index = Number(match[2]);
  if (!Number.isSafeInteger(index) || index < 0 || index > MAX_INDEX) return null;
  const txid = match[1].toLowerCase();
  return { txid, index, id: `${txid}i${index}` };
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
  const matches = [...url.pathname.matchAll(new RegExp(ID_RE.source, 'gi'))];
  if (!matches.length) return null;
  return fromMatch(matches[matches.length - 1]);
}

export function parseInscriptionId(input) {
  let text = String(input ?? '').trim();
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    text = text.slice(1, -1).trim();
  }
  if (!text) return null;
  const direct = text.match(new RegExp(`^${ID_RE.source}$`, 'i'));
  if (direct) return fromMatch(direct);
  if (/^ordinals\.com\//i.test(text)) return fromUrl(`https://${text}`);
  return fromUrl(text);
}

export function isValidInscriptionId(input) {
  return parseInscriptionId(input) != null;
}
