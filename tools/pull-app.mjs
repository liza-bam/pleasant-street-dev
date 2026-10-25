// THE APP: the walk from lazy.vacations (rentals-marketing), copied here and adapted for a hidden
// dev street on GitHub Pages. Run it after the walk changes there:  node tools/pull-app.mjs [path to rentals-marketing/site]
// It never edits rentals-marketing; it only reads it.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.resolve(process.argv[2] || path.join(ROOT, '..', 'rentals-marketing', 'site'));
const LIVE = 'https://lazy.vacations';
const read = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');
const write = (f, s) => { fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true }); fs.writeFileSync(path.join(ROOT, f), s); };
const copy = (from, to) => { fs.mkdirSync(path.dirname(path.join(ROOT, to)), { recursive: true }); fs.copyFileSync(path.join(SRC, from), path.join(ROOT, to)); };

// The files the walk loads, and where they land here.
const ASSETS = {
  '/header.css': 'assets/header.css', '/offer/faq.css': 'assets/faq.css', '/editor/editor.css': 'assets/editor.css',
  '/pleasant-street/pleasant.css': 'assets/pleasant.css', '/pleasant-street/map/map.css': 'assets/map.css',
  '/pleasant-street/map/map.js': 'assets/map.js', '/water-surface.js': 'assets/water-surface.js',
  '/chat-pulse.js': 'assets/chat-pulse.js', '/lazy-logo.svg': 'assets/lazy-logo.svg',
  '/fonts/noto-serif-latin.woff2': 'assets/fonts/noto-serif-latin.woff2', '/fonts/lobster-latin.woff2': 'assets/fonts/lobster-latin.woff2',
  '/favicon.ico': 'favicon.ico', '/favicon-48.png': 'favicon-48.png', '/apple-touch-icon.png': 'apple-touch-icon.png',
};
for (const [from, to] of Object.entries(ASSETS)) {
  if (to.endsWith('.css')) write(to, read(from).replace(/url\(\/fonts\//g, 'url(fonts/'));
  else copy(from.slice(1), to);
}

let html = read('pleasant-street/map/index.html');
// No analytics, no pixel, no search data: a hidden copy.
html = html.replace(/<!-- Google tag \(gtag\.js\) -->[\s\S]*?<!-- End Meta Pixel Code -->\n/, '');
html = html.replace(/<link rel="alternate"[^>]*>\n/, '').replace(/<link rel="canonical"[^>]*>\n/, '');
html = html.replace(/<meta property="og:[^>]*>\n/g, '').replace(/<meta name="twitter:[^>]*>\n/g, '');
html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n/g, '');
html = html.replace(/<!-- Meta Pixel Code[\s\S]*?<!-- End Meta Pixel Code -->\n/g, '');
html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="robots" content="noindex, nofollow">');
html = html.replace(/<title>[^<]*<\/title>/, '<title>Pleasant Street (dev)</title>');
// Its own files from here; every other link goes to the live site.
for (const [from, to] of Object.entries(ASSETS)) html = html.split(`"${from}"`).join(`"${to}"`);
html = html.replace(/(href|src)="\/(?!\/)([^"]*)"/g, (m, a, p) => `${a}="${LIVE}/${p}"`);
// The map reads this street's live homes (street.json, written by tools/build-index.mjs).
html = html.replace('class="psm-map" id="ps-map"', 'class="psm-map" id="ps-map" data-src="street.json"');
if (!html.includes('data-src="street.json"')) throw new Error('map element not found: the walk changed, update pull-app.mjs');
write('index.html', html);
console.log('pulled the walk from', SRC);
