import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('404 uses the site chrome and links home plus the four tools', () => {
  const html = read('404.html');
  assert.match(html, /class="mark" href="\/"/);
  assert.match(html, /alt="INK by HLT"/);
  assert.match(html, /lockup-header\.svg/);
  assert.match(html, /by HLT/);
  assert.match(html, /href="\/lookup\/"/);
  assert.match(html, /href="\/estimate\/"/);
  assert.match(html, /href="\/plan\/"/);
  assert.match(html, /href="\/kit\/"/);
  assert.match(html, /That page is not on INK/);
  assert.doesNotMatch(html, /GitHub Pages|Page not found · GitHub/);
  assert.doesNotMatch(html, /\/lab\/signet\//);
  assert.doesNotMatch(html, /width:\s*600px|width:\s*800px/);
});

test('header and footer padding beat .wrap, and Load more honors hidden', () => {
  const css = read('assets/ink.css');
  assert.match(css, /header\.wrap\{[^}]*padding:1\.25rem 1\.5rem/);
  assert.match(css, /footer\.wrap\{[^}]*margin-top:5rem/);
  assert.match(css, /footer\.wrap\{[^}]*padding:2rem 1\.5rem/);
  assert.match(css, /\.more\[hidden\]\{display:none\}/);
  assert.match(css, /\.page-title,\.hero h1\{[^}]*clamp\(2rem,5vw,3\.5rem\)/);
  assert.match(css, /input::placeholder,textarea::placeholder\{color:#9aa0a6/);
  assert.doesNotMatch(css, /calc\(88vh - 36rem\)/);
});

test('homepage tile copy and shared cache buster', () => {
  const home = read('index.html');
  const collection = read('c.html');
  assert.match(home, /class="page-title"/);
  assert.doesNotMatch(home, /font-size:clamp/);
  assert.match(home, /Look up an inscription by id\. Nothing is written to Bitcoin\./);
  assert.match(home, /Estimate one file or text\. Nothing is signed or broadcast\./);
  assert.match(home, /Estimate a batch of files\. Nothing is signed or broadcast\./);
  assert.match(home, /Check a collection file\. Preview ink rarity in the browser\./);
  assert.match(home, /ink\.css\?v=rebrand-d2-lotus/);
  assert.match(home, /ink\.js\?v=polish1/);
  assert.match(collection, /ink\.css\?v=rebrand-d2-lotus/);
  assert.match(collection, /ink\.js\?v=polish1/);
  assert.doesNotMatch(home + collection, /\/lab\/signet\//);
});

test('tool pages share the header and do not add a signet lab link', () => {
  for (const path of ['lookup/index.html', 'estimate/index.html', 'plan/index.html', 'kit/index.html']) {
    const html = read(path);
    assert.match(html, /class="mark" href="\/"/, path);
    assert.match(html, /<footer class="wrap">/, path);
    assert.match(html, /ink\.css\?v=rebrand-d2-lotus/, path);
    assert.match(html, /class="page-title"/, path);
    assert.doesNotMatch(html, /href="\/lab\/signet\//, path);
    assert.match(html, /Content-Security-Policy/, path);
  }
  assert.match(read('estimate/index.html'), /<details class="formula">/);
  assert.match(read('plan/index.html'), /<details class="formula">/);
  assert.doesNotMatch(read('estimate/index.html'), /<details class="formula"[^>]*\sopen/);
  assert.match(read('estimate/estimate.css'), /#postage,#rate\{max-width:12rem\}/);
  assert.match(read('plan/plan.css'), /#postage,#rate\{max-width:12rem\}/);
  assert.match(read('kit/kit.css'), /#roundOut:empty/);
  assert.match(read('kit/kit.css'), /text-transform:none/);
});
