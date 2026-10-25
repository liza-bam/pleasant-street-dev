// THE INDEX: written from data/homes.json, never edited by hand. Run: node tools/build-index.mjs
//   index.md     what the street assistant (the Elfsight chat) reads: one short block per home
//   index.json   the same homes as data
//   street.json  what the map/list reads, including entries with unknown coordinates
// Explicitly inactive or review-blocked websites are omitted from recommendations.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const homes = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/homes.json'), 'utf8')).filter((h) => h.alive !== false && h.listingStatus !== 'Needs review');
const known = (v) => v != null && v !== '' && v !== 'Unknown';
const yes = (v) => (v === true || /^y/i.test(v || '') ? 'yes' : v === false || /^no\b/i.test(v || '') ? 'no' : v === 'Conditional' ? 'Conditional; check unit policy' : 'Unknown');
const price = (h) => (typeof h.priceFrom === 'number' ? `from ${h.priceFrom} ${known(h.currency) ? h.currency : ''} a night` : known(h.priceDetails) ? h.priceDetails : 'Unknown');

const blocks = homes.map((h) => {
  const facts = [
    `ID: ${h.id}`, `Town / area (approximate map location): ${h.place}`, `Type: ${h.type || 'Unknown'}`,
    `Description: ${h.description || 'Unknown'}`, `Rooms: ${h.rooms ?? 'Unknown'}`, `Bedrooms: ${h.bedrooms ?? 'Unknown'}`, `Bathrooms: ${h.bathrooms ?? 'Unknown'}`,
    `Sleeps: ${known(h.capacityDetails) ? h.capacityDetails : h.guests || 'Unknown'}`,
    `Price: ${price(h)}`, `Children welcome: ${yes(h.kids)}`, `Pets welcome: ${yes(h.pets)}`,
    known(h.kidsDetails) && `Children policy: ${h.kidsDetails}`, known(h.petsDetails) && `Pet policy: ${h.petsDetails}`,
    `Website (book here, directly with the host): ${h.url}`,
  ].filter(Boolean);
  return `## ${h.name}\n\n${facts.map((f) => `- ${f}`).join('\n')}\n`;
});

const md = `# Pleasant Street: homes and their websites

Pleasant Street lists properties and rental operators with their own websites.
Map positions show towns or areas, not exact property locations. Unknown facts are labeled Unknown.
${homes.length} listings. Unit-specific policies, capacities and prices must be checked on the linked website.

${blocks.join('\n')}`;

const pick = (h, keys) => Object.fromEntries(keys.filter((k) => h[k] !== undefined && h[k] !== '').map((k) => [k, h[k]]));
fs.writeFileSync(path.join(ROOT, 'index.md'), md);
fs.writeFileSync(path.join(ROOT, 'index.json'), JSON.stringify(homes.map((h) =>
  pick(h, ['id','name', 'url', 'place', 'town', 'state', 'type', 'recordType', 'description', 'rooms', 'bedrooms', 'bathrooms', 'guests', 'capacityDetails', 'priceFrom', 'priceDetails', 'currency', 'kids', 'pets', 'kidsDetails', 'petsDetails', 'lat', 'lng', 'photo', 'coverPhoto', 'photos', 'logo', 'address','locationPrecision','featured','demo'])), null, 1) + '\n');
// Compatibility adapter for the current app. The canonical database keeps explicit
// Unknown values; this older UI expects absent unknowns and numeric map coordinates.
const street=homes.filter(h=>typeof h.lat==='number' && typeof h.lng==='number').map(h=>{
 const row=pick(h, ['id','name', 'url', 'place', 'lat', 'lng', 'photo', 'guests', 'capacityDetails', 'type', 'recordType', 'description', 'rooms', 'bedrooms', 'bathrooms', 'kids', 'pets', 'kidsDetails', 'petsDetails','locationPrecision','featured','demo']);
 for(const [k,v] of Object.entries(row))if(v==='Unknown')delete row[k];
 for(const k of ['kids','pets'])if(row[k]==='Conditional')delete row[k];
 if(!row.photo)row.photo='images/photo-unknown.svg';
 return row;
});
fs.writeFileSync(path.join(ROOT, 'street.json'), JSON.stringify(street, null, 1) + '\n');
console.log(`index: ${homes.length} homes written to index.md, index.json, street.json`);
