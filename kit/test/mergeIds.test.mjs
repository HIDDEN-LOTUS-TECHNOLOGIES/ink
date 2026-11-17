import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { toIdList, toMagicEden, toUnisatInscriptions, toUnisatMeta } from '../convert.js';
import { itemsToCsv } from '../metadataCsv.js';
import { MetadataValidator } from '../metadataValidator.js';
import {
  INDEX_WARNING,
  INSCRIPTION_ID_RE,
  NUMBER_WARNING,
  ORDER_WARNING,
  formatReport,
  mergeIdsAndTraits,
  parseIdsFile,
} from '../mergeIds.js';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const id = (ch, n = 0) => `${ch.repeat(64)}i${n}`;
const A = id('a');
const B = id('b');
const C = id('c');
const D = id('d', 2);

function merged(idsText, traitsText) {
  const result = mergeIdsAndTraits(idsText, traitsText);
  assert.equal(result.ok, true, result.error);
  return result;
}

test('inscription ids are 64 lowercase hex chars, an i, and a decimal index', () => {
  assert.equal(INSCRIPTION_ID_RE.test(A), true);
  assert.equal(INSCRIPTION_ID_RE.test(id('a', 10)), true);
  assert.equal(INSCRIPTION_ID_RE.test(`${'a'.repeat(63)}i0`), false);
  assert.equal(INSCRIPTION_ID_RE.test(`${'A'.repeat(64)}i0`), false);
  assert.equal(INSCRIPTION_ID_RE.test(`${'a'.repeat(64)}I0`), false);
  assert.equal(INSCRIPTION_ID_RE.test(`${'a'.repeat(64)}i`), false);
  assert.equal(INSCRIPTION_ID_RE.test(`${A} `), false);
});

test('ids file accepts lines, a JSON array of ids, and objects with an id', () => {
  const lines = parseIdsFile(`\uFEFF${A}\r\n\r\n  ${B}  \r\n`);
  assert.deepEqual(lines.ids, [A, B]);
  assert.deepEqual(parseIdsFile(JSON.stringify([A, B])).ids, [A, B]);
  assert.deepEqual(parseIdsFile(JSON.stringify([{ id: A, Hat: 'ignored' }, { inscription_id: B }])).ids, [A, B]);
  assert.equal(parseIdsFile('').ok, false);
  assert.equal(parseIdsFile('[]').error, 'Ids file is empty.');
  assert.equal(parseIdsFile('{').error, 'Ids file is not valid JSON.');
  assert.equal(parseIdsFile('{}').error, 'Ids JSON must be an array of inscription ids or objects with an id.');
});

test('joins a traits CSV on inscription id and keeps ids-file order', () => {
  const result = merged(`${A}\n${B}\n${C}\n`, `id,name,Hat\n${C},Three,brim\n${A},One,cap\n`);
  assert.equal(result.report.mode, 'id');
  assert.equal(result.report.warning, null);
  assert.equal(result.report.matched, 2);
  assert.deepEqual(result.report.idsWithNoTraits, [B]);
  assert.deepEqual(result.items.map((item) => item.id), [A, B, C]);
  assert.equal(result.items[0].name, 'One');
  assert.equal(result.items[0].t.Hat, 'cap');
  assert.equal(result.items[1].name, '2');
  assert.deepEqual(result.items[1].t, {});
  assert.equal(result.items[2].name, 'Three');
  assert.equal(result.items[2].n, 3);
  assert.match(formatReport(result.report), /^Matched: 2\.\nIds with no traits: 1\.\nTraits with no id: 0\.\nDuplicate ids: 0\.\nMalformed inscription ids: 0\.$/);
});

test('a trait id that is not in the ids file is a trait with no id', () => {
  const result = merged(`${A}\n`, `id,name,Hat\n${A},One,cap\n${D},Four,ribbon\n,No id,cap\n`);
  assert.equal(result.report.matched, 1);
  assert.deepEqual(result.report.traitsWithNoId.map((row) => row.reason), ['unmatched', 'missing']);
  assert.equal(result.report.traitsWithNoId[0].id, D);
  assert.equal(result.report.traitsWithNoId[1].id, '');
  assert.deepEqual(result.outputs.inscriptions.map((row) => row.id), [A]);
});

test('duplicate ids are reported once and the first trait row wins', () => {
  const result = merged(`${A}\n${A}\n${B}\n`, `id,Hat\n${A},first\n${A},second\n${B},none\n`);
  assert.equal(result.report.matched, 2);
  assert.deepEqual(result.report.duplicateIds, [
    { id: A, count: 2, source: 'ids' },
    { id: A, count: 2, source: 'traits' },
  ]);
  assert.equal(result.items.length, 2);
  assert.equal(result.items[0].t.Hat, 'first');
  assert.equal(result.outputs.idsTxt, `${A}\n${B}\n`);
  assert.equal(result.validation.stats.duplicateIds, 0);
  assert.match(formatReport(result.report), /Duplicate ids: 2\./);
});

test('malformed inscription ids are reported and left out of the merge', () => {
  const upper = `${'A'.repeat(64)}i0`;
  const short = `${'a'.repeat(63)}i0`;
  const result = merged(`${A}\n${upper}\n${short}\n${B}\n`, `id,Hat\n${A},cap\n${upper},nope\nnot-an-id,nope\n${B},none\n`);
  assert.deepEqual(result.items.map((item) => item.id), [A, B]);
  assert.equal(result.report.matched, 2);
  assert.deepEqual(result.report.malformedIds.map((row) => row.value), [upper, short, upper, 'not-an-id']);
  assert.deepEqual(result.report.malformedIds.map((row) => row.source), ['ids', 'ids', 'traits', 'traits']);
  assert.equal(result.outputs.idsTxt, `${A}\n${B}\n`);
  assert.equal(result.validation.stats.badIds, 0);
  assert.match(formatReport(result.report), /Malformed inscription ids: 4\./);
});

test('a traits file with no ids joins by row order and warns', () => {
  const result = merged(`${A}\n${B}\n${C}`, 'Hat,Background\ncap,"blue, deep"\nnone,red\n');
  assert.equal(result.report.mode, 'order');
  assert.equal(result.report.warning, ORDER_WARNING);
  assert.match(formatReport(result.report), new RegExp(`^Warning: ${escapeRegExp(ORDER_WARNING)}`));
  assert.equal(result.report.matched, 2);
  assert.deepEqual(result.report.idsWithNoTraits, [C]);
  assert.equal(result.items[0].t.Hat, 'cap');
  assert.equal(result.items[0].t.Background, 'blue, deep');
  assert.equal(result.items[0].name, '1');
  assert.deepEqual(result.report.traitsWithNoId, []);
});

test('a bad id line does not consume a trait row when joining by order', () => {
  const result = merged(`${A}\nnot-an-id\n${B}\n`, 'Hat\ncap\nbrim\n');
  assert.equal(result.report.mode, 'order');
  assert.equal(result.items[0].t.Hat, 'cap');
  assert.equal(result.items[1].id, B);
  assert.equal(result.items[1].t.Hat, 'brim');
  assert.equal(result.report.matched, 2);
  assert.deepEqual(result.report.idsWithNoTraits, []);
  assert.equal(result.report.malformedIds.length, 1);
});

test('extra trait rows in order mode are traits with no id', () => {
  const result = merged(`${A}\n`, 'name,Hat\nOne,cap\nTwo,brim\n');
  assert.equal(result.report.matched, 1);
  assert.equal(result.items[0].name, 'One');
  assert.equal(result.report.traitsWithNoId.length, 1);
  assert.equal(result.report.traitsWithNoId[0].name, 'Two');
  assert.equal(result.report.traitsWithNoId[0].reason, 'missing');
});

test('a number column joins by number and a zero index joins from the start', () => {
  const numbered = merged(`${A}\n${B}\n${C}\n`, 'n,name,Hat\n1,One,cap\n1,Again,nope\n3,Three,brim\n4,Four,ribbon\n');
  assert.equal(numbered.report.mode, 'number');
  assert.match(numbered.report.warning, new RegExp(`^${escapeRegExp(NUMBER_WARNING)}`));
  assert.match(numbered.report.warning, /Repeated numbers were kept once: 1\./);
  assert.equal(numbered.report.matched, 2);
  assert.deepEqual(numbered.report.idsWithNoTraits, [B]);
  assert.equal(numbered.items[0].t.Hat, 'cap');
  assert.equal(numbered.items[0].name, 'One');
  assert.equal(numbered.items[2].name, 'Three');
  assert.equal(numbered.report.traitsWithNoId.some((row) => row.name === 'Four'), true);

  const indexed = merged(`${A}\n${B}\n`, 'index,Hat\n0,cap\n1,none\n');
  assert.equal(indexed.report.warning, INDEX_WARNING);
  assert.equal(indexed.items[0].t.Hat, 'cap');
  assert.equal(indexed.items[1].t.Hat, 'none');
  assert.equal(indexed.report.matched, 2);
});

test('JSON trait arrays and id-keyed objects join on inscription id', () => {
  const magicEden = merged(JSON.stringify([B, A]), JSON.stringify([
    { id: A, meta: { name: 'One', attributes: [{ trait_type: 'Count', value: 2 }, { trait_type: 'Cool', value: true }] } },
    { id: B, meta: { name: 'Two', attributes: [{ trait_type: 'Count', value: 1 }] } },
  ]));
  assert.equal(magicEden.report.mode, 'id');
  assert.equal(magicEden.items[0].id, B);
  assert.equal(magicEden.items[0].name, 'Two');
  assert.equal(magicEden.items[1].t.Count, 2);
  assert.equal(magicEden.items[1].t.Cool, true);
  assert.deepEqual(magicEden.outputs.magicEden[1].meta.attributes, [
    { trait_type: 'Count', value: 2 },
    { trait_type: 'Cool', value: true },
  ]);

  const ink = merged(`${A}\n`, JSON.stringify([{ id: A, name: 'Ink', n: 9, score: 1.5, t: { Hat: 'cap' } }]));
  assert.equal(ink.items[0].name, 'Ink');
  assert.equal(ink.items[0].n, 9);
  assert.equal(ink.items[0].score, 1.5);
  assert.equal(ink.items[0].t.Hat, 'cap');
  assert.equal(ink.outputs.magicEden[0].score, undefined);
  assert.equal(ink.outputs.magicEden[0].meta.score, undefined);

  const keyed = merged(`${A}\n${B}\n`, JSON.stringify({
    [B]: { name: 'Bee', Hat: 'none' },
    [A]: { t: { Hat: 'cap' }, name: 'Aye' },
  }));
  assert.equal(keyed.report.mode, 'id');
  assert.equal(keyed.report.warning, null);
  assert.equal(keyed.items[0].name, 'Aye');
  assert.equal(keyed.items[0].t.Hat, 'cap');
  assert.equal(keyed.items[1].name, 'Bee');
  assert.equal(keyed.items[1].t.Hat, 'none');
});

test('a number-keyed traits object joins by number and warns', () => {
  const result = merged(`${A}\n${B}\n`, JSON.stringify({
    2: { name: 'Two', Hat: 'brim' },
    1: { name: 'One', Hat: 'cap' },
  }));
  assert.equal(result.report.warning, NUMBER_WARNING);
  assert.equal(result.items[0].name, 'One');
  assert.equal(result.items[1].name, 'Two');

  const zero = merged(`${A}\n${B}\n`, JSON.stringify({
    0: { Hat: 'cap' },
    1: { Hat: 'none' },
  }));
  assert.equal(zero.report.warning, INDEX_WARNING);
  assert.equal(zero.items[0].t.Hat, 'cap');
  assert.equal(zero.items[1].t.Hat, 'none');
});

test('gamma rows with no ids join by order and keep the meta name', () => {
  const result = merged(`${A}\n${B}\n`, JSON.stringify([
    { file: '1.png', meta: { name: 'One', attributes: [{ trait_type: 'Hat', value: 'cap' }] } },
    { file: '2.png', meta: { attributes: [{ trait_type: 'Hat', value: 'none' }] } },
  ]));
  assert.equal(result.report.warning, ORDER_WARNING);
  assert.equal(result.items[0].name, 'One');
  assert.equal(result.items[0].t.Hat, 'cap');
  assert.equal(result.items[1].name, '2.png');
  assert.equal(result.items[1].t.Hat, 'none');
});

test('thumbnail fields stay on the magic eden meta and off the trait map', () => {
  const csv = [
    'id,name,high_res_img_url,collection_page_img_url,Hat',
    `${A},One,https://cdn.example/hi.png,https://cdn.example/page.png,cap`,
  ].join('\n');
  const result = merged(`${A}\n`, csv);
  assert.equal(result.items[0].t.high_res_img_url, undefined);
  assert.equal(result.items[0].t.collection_page_img_url, undefined);
  assert.equal(result.outputs.magicEden[0].meta.high_res_img_url, 'https://cdn.example/hi.png');
  assert.equal(result.outputs.magicEden[0].meta.collection_page_img_url, 'https://cdn.example/page.png');
  assert.equal(result.outputs.magicEden[0].high_res_img_url, undefined);
  assert.ok(result.validation.warnings.some((row) => row.severity === 'info' && /off-chain image URLs/.test(row.message)));
});

test('outputs reuse the kit converters and a clean merge passes the validator', () => {
  const traits = itemsToCsv([
    { id: A, name: 'One', n: 4, t: { Hat: 'cap' } },
    { id: B, name: 'Two', n: 5, t: { Hat: 'none' } },
  ]);
  const result = merged(`${B}\n${A}\n`, traits);
  assert.deepEqual(result.outputs.magicEden, toMagicEden(result.items));
  assert.deepEqual(result.outputs.inscriptions, toUnisatInscriptions(result.items));
  assert.equal(result.outputs.idsTxt, toIdList(result.items));
  assert.deepEqual(result.outputs.meta, toUnisatMeta());
  assert.deepEqual(result.outputs.meta, {
    name: '',
    slug: '',
    icon: '',
    twitter: '',
    discord: '',
    website: '',
  });
  assert.deepEqual(result.outputs.inscriptions, result.outputs.magicEden);
  assert.equal(result.outputs.idsTxt, `${B}\n${A}\n`);
  assert.equal(result.items[0].n, 5);
  assert.equal(result.items[1].n, 4);
  const again = MetadataValidator.validateComplete(JSON.stringify(result.outputs.magicEden));
  assert.equal(result.validation.valid, true);
  assert.equal(result.validation.valid, again.valid);
  assert.equal(result.validation.summary, again.summary);
  assert.match(result.validation.summary, /All validation checks passed/);
  assert.equal(result.report.idsWithNoTraits.length, 0);
  assert.equal(result.report.matched, 2);
});

test('an ids file with no matching traits still exports those ids', () => {
  const result = merged(`${A}\n${B}\n`, 'Hat\n');
  assert.equal(result.report.warning, ORDER_WARNING);
  assert.equal(result.report.matched, 0);
  assert.deepEqual(result.report.idsWithNoTraits, [A, B]);
  assert.equal(result.outputs.idsTxt, `${A}\n${B}\n`);
  assert.deepEqual(result.outputs.inscriptions.map((row) => row.meta.attributes), [[], []]);
  assert.equal(result.validation.stats.totalItems, 2);
});

test('unreadable files return an error and no outputs', () => {
  const both = mergeIdsAndTraits('', '');
  assert.equal(both.ok, false);
  assert.equal(both.error, 'Ids file is empty. Traits file is empty.');
  assert.equal(both.outputs, null);
  assert.equal(both.validation, null);
  const traits = mergeIdsAndTraits(`${A}\n`, '{');
  assert.equal(traits.ok, false);
  assert.equal(traits.error, 'Traits file is not valid JSON.');
  const shape = mergeIdsAndTraits(`${A}\n`, JSON.stringify(['nope']));
  assert.equal(shape.error, 'Traits JSON array must be objects.');
  const keyed = mergeIdsAndTraits(`${A}\n`, JSON.stringify({ Hat: 'cap' }));
  assert.equal(keyed.error, 'Traits JSON object must be keyed by inscription id or number.');
});

test('merge page is noindex, self-only, and does not fetch or sign', () => {
  const html = read('kit/merge/index.html');
  const script = read('kit/merge/merge.js');
  const logic = read('kit/mergeIds.js');
  const home = read('index.html');
  const missing = read('404.html');
  const kit = read('kit/index.html');
  assert.match(html, /name="robots" content="noindex"/);
  assert.match(html, /content="default-src 'self'; connect-src 'self'; img-src 'self'; style-src 'self'; script-src 'self'; base-uri 'self'; form-action 'self'"/);
  assert.match(html, /class="skip" href="#content"/);
  assert.match(html, /id="content"/);
  assert.match(html, /class="mark" href="\/"/);
  assert.match(html, /<footer class="wrap">/);
  assert.match(html, /ink\.css\?v=polish2/);
  assert.match(html, /class="page-title"/);
  assert.match(html, /Merge IDs \+ traits/);
  assert.match(html, /for="ids-file"/);
  assert.match(html, /for="ids-raw"/);
  assert.match(html, /for="traits-file"/);
  assert.match(html, /for="traits-raw"/);
  assert.match(html, /Nothing is signed or submitted/);
  assert.doesNotMatch(html, /https:\/\/(?!ink\.hiddenlotus\.tech|hiddenlotus\.tech|x\.com|ordinals\.com)/);
  assert.doesNotMatch(html, /\/lab\/signet\//);
  assert.doesNotMatch(html, /unsafe-inline|unsafe-eval/);
  for (const source of [script, logic]) {
    assert.doesNotMatch(source, /fetch\s*\(/);
    assert.doesNotMatch(source, /XMLHttpRequest|WebSocket|sendBeacon/);
    assert.doesNotMatch(source, /https?:\/\//);
  }
  assert.match(script, /mergeIdsAndTraits/);
  assert.match(script, /inscriptions\.json/);
  assert.match(script, /meta\.json/);
  assert.match(kit, /href="\/kit\/merge\/"/);
  assert.match(kit, /Merge IDs \+ traits/);
  assert.doesNotMatch(home, /\/kit\/merge\//);
  assert.doesNotMatch(missing, /\/kit\/merge\//);
  assert.doesNotMatch(home, /\/lab\/signet\//);
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
