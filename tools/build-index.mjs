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
// The only published address is the operator's office, mailing box or arrival point, not the rental's door: the card asks the guest to get the address from the owner's website.
const askAddress = (h) => {
  const a = h.address;
  if (!a || !known(a.street)) return false;
  const t = String(a.type || '').toLowerCase();
  return /office|mailing|po box|arrival|marina|homeport|outside|parent company|hotel partner|not (a |each )?rental|tourism-listed operator|^operator contact/.test(t) && !/property|campus/.test(t);
};
for (const h of homes) if (askAddress(h)) h.askAddress = true;
// The card's short description falls back to the full one when there is no card-specific text (map.js
// truncates either to 150 characters client-side); a few records only have the full one, so copy it in
// here rather than shipping the full, untruncated text to every visitor for every home.
for (const h of homes) if (!known(h.cardDescription) && known(h.description)) h.cardDescription = h.description;

const blocks = homes.map((h) => {
  const facts = [
    `ID: ${h.id}`, `Town / area (approximate map location): ${h.place}`, `Tourist destination: ${h.destination || 'Unknown'}`, `Type: ${h.type || 'Unknown'}`,
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
Map pins sit at each home where its address is known; addresses themselves are never shown. Unknown facts are labeled Unknown.
${homes.length} listings. Unit-specific policies, capacities and prices must be checked on the linked website.

${blocks.join('\n')}`;

const pick = (h, keys) => Object.fromEntries(keys.filter((k) => h[k] !== undefined && h[k] !== '').map((k) => [k, h[k]]));
// The site (assets/map.js) only ever reads these fields; everything else here — full description and
// photo-role detail, price, capacity and policy prose, research/audit bookkeeping — stays in data/homes.json
// but is not shipped to every visitor's browser. Checked by grepping assets/map.js for every `h.<field>`
// and dynamic `h[key]` access (factRows' guests/bedrooms/bathrooms/pets/kids) before trimming this list.
const PUBLIC_FIELDS = ['id', 'name', 'url', 'place', 'town', 'state', 'destination', 'type', 'recordType',
  'cardDescription', 'cardPhotos', 'platformLinks', 'guests', 'bedrooms', 'bathrooms', 'kids', 'pets',
  'photo', 'lat', 'lng', 'locationLabel', 'askAddress', 'featured', 'demo'];
const indexed = homes.map((h) => pick(h, PUBLIC_FIELDS));
fs.writeFileSync(path.join(ROOT, 'index.md'), md.replace(/[ \t]+$/gm, ''));
fs.writeFileSync(path.join(ROOT, 'index.json'), JSON.stringify(indexed, null, 1) + '\n');
// One file per tourist destination (data/destinations/<slug>.json): a destination page's own homes only,
// in the same shape as index.json, so a visitor to /cape_cod/ never downloads the whole catalog.
// The slug must match tools/destination-pages.py's slug() exactly, or a destination page points at nothing.
const slug = (name) => name.toLowerCase().replace(/'s\b/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const destDir = path.join(ROOT, 'data/destinations');
fs.rmSync(destDir, { recursive: true, force: true });
fs.mkdirSync(destDir, { recursive: true });
const byDestination = new Map();
for (const h of indexed) {
  if (!h.destination || h.destination === 'Unknown') continue;
  const list = byDestination.get(h.destination) || byDestination.set(h.destination, []).get(h.destination);
  list.push(h);
}
for (const [name, list] of byDestination) fs.writeFileSync(path.join(destDir, `${slug(name)}.json`), JSON.stringify(list, null, 1) + '\n');
// Compatibility adapter for the current app. The canonical database keeps explicit
// Unknown values; this older UI expects absent unknowns and numeric map coordinates.
const street=homes.filter(h=>typeof h.lat==='number' && typeof h.lng==='number').map(h=>{
 const row=pick(h, ['id','name', 'url', 'place', 'destination', 'lat', 'lng', 'photo', 'guests', 'capacityDetails', 'type', 'recordType', 'description', 'rooms', 'bedrooms', 'bathrooms', 'kids', 'pets', 'kidsDetails', 'petsDetails','locationPrecision','locationLabel','featured','demo']);
 for(const [k,v] of Object.entries(row))if(v==='Unknown')delete row[k];
 for(const k of ['kids','pets'])if(row[k]==='Conditional')delete row[k];
 if(!row.photo)row.photo='images/photo-unknown.svg';
 return row;
});
fs.writeFileSync(path.join(ROOT, 'street.json'), JSON.stringify(street, null, 1) + '\n');
console.log(`index: ${homes.length} homes written to index.md, index.json, street.json, and ${byDestination.size} data/destinations/*.json files`);
