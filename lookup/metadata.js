// /r/metadata/<id> is a JSON string of hex-encoded CBOR. Traits come from that
// value, not from ordinals.com HTML.

import { decodeCbor } from './cbor.js';

const PRESENTATION = new Set(['name', 'description', 'image', 'animation_url', 'external_url', 'background_color']);

export function decodeMetadataHex(hex) {
  const clean = String(hex ?? '').trim().replace(/^0x/i, '');
  if (!clean) return null;
  if (!/^[0-9a-fA-F]+$/.test(clean) || clean.length % 2) {
    throw new Error('Metadata hex is not even-length hexadecimal.');
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return decodeCbor(bytes);
}

function displayValue(value, depth = 0) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value instanceof Uint8Array) return [...value].map((b) => b.toString(16).padStart(2, '0')).join('');
  if (depth >= 3) return '…';
  if (Array.isArray(value)) return value.map((item) => displayValue(item, depth + 1)).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    return Object.entries(value).map(([key, item]) => `${key}: ${displayValue(item, depth + 1)}`).join(' · ');
  }
  return '';
}

function attributesToTraits(items) {
  const traits = [];
  items.forEach((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item) || item instanceof Uint8Array) {
      traits.push({ trait: String(index), value: displayValue(item) });
      return;
    }
    const name = item.trait_type ?? item.traitType;
    if (name == null || name === '') return;
    traits.push({ trait: String(name), value: displayValue(item.value) });
  });
  return traits;
}

function objectToTraits(obj, skip = new Set()) {
  return Object.entries(obj)
    .filter(([key]) => !skip.has(key))
    .map(([key, value]) => ({ trait: key, value: displayValue(value) }));
}

export function traitsFromValue(value) {
  if (value == null) return { name: '', description: '', traits: [] };
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return { name: '', description: '', traits: [{ trait: 'value', value: displayValue(value) }] };
  }
  if (value instanceof Uint8Array) {
    return { name: '', description: '', traits: [{ trait: 'value', value: displayValue(value) }] };
  }
  if (Array.isArray(value)) return { name: '', description: '', traits: attributesToTraits(value) };
  if (typeof value !== 'object') return { name: '', description: '', traits: [] };

  const name = typeof value.name === 'string' ? value.name : '';
  const description = typeof value.description === 'string' ? value.description : '';
  let traits = [];
  if (Array.isArray(value.attributes)) traits = attributesToTraits(value.attributes);
  else if (value.attributes && typeof value.attributes === 'object' && !(value.attributes instanceof Uint8Array)) {
    traits = objectToTraits(value.attributes);
  } else traits = objectToTraits(value, PRESENTATION);
  return { name, description, traits };
}
