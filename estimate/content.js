// What the signet lab would inscribe. Typed text follows lab/signet/src/ui.js.

import { assertBody, contentTypeForFile, MAX_BODY } from '../lab/signet/src/contentType.js';

export { MAX_BODY, contentTypeForFile };

const textEncoder = new TextEncoder();

export function textBytes(text) {
  return textEncoder.encode(String(text ?? ''));
}

export function contentFromText(text) {
  if (!String(text ?? '')) throw new Error('Choose a file or type some text.');
  const body = assertBody(textBytes(text));
  return { body, contentType: 'text/plain;charset=utf-8', label: 'typed text' };
}

export function contentFromFile({ name, type, bytes, size }) {
  const length = size ?? bytes?.length ?? 0;
  if (length > MAX_BODY) throw new Error(`File is ${length} bytes. The limit is ${MAX_BODY} bytes.`);
  const body = assertBody(bytes);
  return {
    body,
    contentType: contentTypeForFile(name, type),
    label: String(name || 'file'),
  };
}
