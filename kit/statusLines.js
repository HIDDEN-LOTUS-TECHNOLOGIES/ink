// Status text with newlines is one block per line. A plain text node collapses them.

export function statusLines(message) {
  return String(message ?? '').split('\n');
}

export function appendStatus(parent, createElement, message) {
  parent.replaceChildren();
  statusLines(message).forEach((line, index) => {
    if (index) parent.append(createElement('br'));
    parent.append(line);
  });
}
