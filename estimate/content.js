// What the signet lab would inscribe. Typed text follows lab/signet/src/ui.js.

import { assertBody, contentTypeForFile } from '../lab/signet/src/contentType.js';

export { contentTypeForFile };

const textEncoder = new TextEncoder();

export function textBytes(text) {
  return textEncoder.encode(String(text ?? ''));
}

export function contentFromText(text) {
  if (!String(text ?? '')) throw new Error('Choose a file or type some text.');
  const body = assertBody(textBytes(text));
  return { body, contentType: 'text/plain;charset=utf-8', label: 'typed text' };
}

export function contentFromFile({ name, type, bytes }) {
  const body = assertBody(bytes);
  return {
    body,
    contentType: contentTypeForFile(name, type),
    label: String(name || 'file'),
  };
}
