// A region that can scroll must be focusable and named, or axe reports
// scrollable-region-focusable.

export function applyScrollRegion(wrap, label) {
  wrap.setAttribute('tabindex', '0');
  wrap.setAttribute('role', 'region');
  wrap.setAttribute('aria-label', label);
  return wrap;
}
