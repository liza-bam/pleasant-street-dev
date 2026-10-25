// THE CHECK: does each home's website still answer? Run: node tools/check.mjs
// A site that fails twice in a row (two checks, a week apart) is marked alive: false and leaves the
// map and the index; it comes back by itself when it answers again. Writes data/homes.json.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const DB = path.join(ROOT, 'data/homes.json');
const homes = JSON.parse(fs.readFileSync(DB, 'utf8'));
const today = new Date().toISOString().slice(0, 10);

async function answers(url) {
  try {
    const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000),
                                 headers: { 'user-agent': 'PleasantStreetDev/1.0 (sandy@lazy.vacations)' } });
    return r.status < 400;
  } catch { return false; }
}

let up = 0, down = 0;
for (const h of homes) {
  const ok = await answers(h.url);
  h.misses = ok ? 0 : (h.misses || 0) + 1;
  h.alive = h.misses < 2;
  h.checked = today;
  if (h.misses === 0) delete h.misses;
  ok ? up++ : down++;
}
fs.writeFileSync(DB, JSON.stringify(homes, null, 1) + '\n');
console.log(`check: ${up} answered, ${down} did not; ${homes.filter((h) => !h.alive).length} off the street`);
