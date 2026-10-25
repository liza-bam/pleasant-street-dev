// THE INDEX: written from data/homes.json, never edited by hand. Run: node tools/build-index.mjs
//   index.md     what the street assistant (the Elfsight chat) reads: one short block per home
//   index.json   the same homes as data
//   street.json  what the map reads: the live homes that have a place on the map
// Only homes whose website answered at the last check (alive) are written.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const homes = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/homes.json'), 'utf8')).filter((h) => h.alive !== false);
const yes = (v) => (v === true || /^y/i.test(v || '') ? 'yes' : /^n/i.test(v || '') ? 'no' : '');
const price = (h) => (h.priceFrom ? `from ${h.priceFrom} ${h.currency || 'USD'} a night` : '');

const blocks = homes.map((h) => {
  const facts = [
    h.place && `Town: ${h.place}`, h.type && `Type: ${h.type}`, h.guests && `Sleeps: ${h.guests}`,
    price(h) && `Price: ${price(h)}`, yes(h.kids) && `Children welcome: ${yes(h.kids)}`, yes(h.pets) && `Pets welcome: ${yes(h.pets)}`,
    `Website (book here, directly with the host): ${h.url}`,
  ].filter(Boolean);
  return `## ${h.name}\n\n${facts.map((f) => `- ${f}`).join('\n')}\n`;
});

const md = `# Pleasant Street: homes and their websites

Pleasant Street is a map of vacation homes run by independent hosts. Each home has its own website,
and guests book there, directly with the host. Only the town is shown, never a street address.
${homes.length} homes. This file is written automatically from the street's database; it is a preview.

${blocks.join('\n')}`;

const pick = (h, keys) => Object.fromEntries(keys.filter((k) => h[k] !== undefined && h[k] !== '').map((k) => [k, h[k]]));
fs.writeFileSync(path.join(ROOT, 'index.md'), md);
fs.writeFileSync(path.join(ROOT, 'index.json'), JSON.stringify(homes.map((h) =>
  pick(h, ['name', 'url', 'place', 'town', 'state', 'type', 'guests', 'priceFrom', 'currency', 'kids', 'pets', 'lat', 'lng'])), null, 1) + '\n');
fs.writeFileSync(path.join(ROOT, 'street.json'), JSON.stringify(homes.filter((h) => h.lat != null && h.lng != null).map((h) =>
  pick(h, ['name', 'url', 'place', 'lat', 'lng', 'photo'])), null, 1) + '\n');
console.log(`index: ${homes.length} homes written to index.md, index.json, street.json`);
