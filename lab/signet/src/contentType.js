// Shared with the public /estimate/ page. No network, no keys, no npm imports.
// The reveal limit is weight, not a fixed body size. See estimate/size.js.

const EXT_MIME = {
  txt: 'text/plain',
  html: 'text/html',
  htm: 'text/html',
  css: 'text/css',
  js: 'text/javascript',
  json: 'application/json',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  mp4: 'video/mp4',
  webm: 'video/webm',
};

// Browsers often leave file.type empty. Prefer it when present, else use the extension.
export function contentTypeForFile(filename, browserType) {
  const offered = String(browserType || '').trim();
  if (offered) return offered;
  const ext = String(filename || '').split('.').pop().toLowerCase();
  return EXT_MIME[ext] || 'application/octet-stream';
}

export function assertBody(body) {
  if (!(body instanceof Uint8Array)) throw new Error('Content must be bytes.');
  if (!body.length) throw new Error('Content is empty.');
  return body;
}
