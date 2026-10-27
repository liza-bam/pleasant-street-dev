"""Check published card material against media, source evidence and saved CSVs."""
import csv
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
read = lambda name: json.loads((ROOT / name).read_text())
homes = read("data/homes.json")
indexed = {h["id"]: h for h in read("index.json")}
platforms = {r["id"]: r for r in read("data/sources/cards/platform-links.json")}
reviews = read("data/sources/cards/website-review.json")
regional_audit = {r["id"]: r for region in ["new-hampshire", "massachusetts", "new-york"] for r in read(f"data/sources/{region}/website-audit.json")}
with (ROOT / "data/sources/cards/cards_inventory.csv").open(encoding="utf-8-sig", newline="") as f:
    rows = list(csv.DictReader(f))
assert len(rows) == len(homes)
export = {r["ID"]: r for r in rows}
assert len(export) == len(homes)
for h in homes:
    identifier = h["id"]
    row = export[identifier]
    assert row["Website URL"] == h["url"]
    assert row["Card description"] == h["cardDescription"]
    assert 0 < len(h["cardDescription"]) <= 150, identifier
    assert h["cardDescriptionSource"].startswith("http"), identifier
    assert row["Directory status"] == h["listingStatus"]
    assert row["Platform link status"] == platforms[identifier]["status"]
    for brand, column in [("airbnb", "Airbnb URLs"), ("vrbo", "Vrbo URLs"), ("booking", "Booking.com URLs")]:
        urls = h["platformLinks"].get(brand, [])
        assert row[column].splitlines() == urls, identifier
        for url in urls:
            assert any(e["url"] == url and e["platform"] == brand and e["sourceUrl"].startswith("http") for e in platforms[identifier]["evidence"]), identifier
    if identifier in indexed:
        files = h["cardPhotos"]
        assert len(files) == len(set(files)) == 3, identifier
        hashes = [hashlib.sha256((ROOT / f).read_bytes()).hexdigest() for f in files]
        assert len(set(hashes)) == 3, f"Identical image files: {identifier}"
        for key in ["cardPhotos", "cardPhotoLabel", "cardDescription", "platformLinks"]:
            assert indexed[identifier].get(key, "") == h[key], (identifier, key)
for p in read("data/sources/cards/photo-sources.json"):
    assert not p["generated"]
    assert p["url"].startswith("http") and p["sourcePage"].startswith("http")
    assert hashlib.sha256((ROOT / p["file"]).read_bytes()).hexdigest() == p["sha256"]
for review in reviews:
    assert review["id"] not in indexed, review["id"]
for name in ["maine/catalog", "vermont/vermont_independent_rental_websites", "vermont/vermont_approved", "vermont/vermont_candidates", "new-hampshire/new_hampshire_independent_rental_websites", "new-hampshire/new_hampshire_approved", "new-hampshire/new_hampshire_candidates", "massachusetts/massachusetts_independent_rental_websites", "massachusetts/massachusetts_approved", "massachusetts/massachusetts_candidates", "new-york/new_york_independent_rental_websites", "new-york/new_york_approved", "new-york/new_york_candidates"]:
    with (ROOT / f"data/sources/{name}.csv").open(encoding="utf-8-sig", newline="") as f:
        regional = list(csv.DictReader(f))
    assert len({r["ID"] for r in regional}) == len(regional)
    for row in regional:
        if row["ID"] in regional_audit and row["ID"] not in export:
            assert row["ID"] not in indexed
            assert row["Evidence status"] == regional_audit[row["ID"]]["evidenceStatus"]
            assert regional_audit[row["ID"]]["reviewed"]
            continue
        if row["ID"] not in platforms:
            assert row["Platform link status"].startswith("Not checked")
            continue
        for column in ["Airbnb URLs", "Vrbo URLs", "Booking.com URLs", "Platform link status", "Directory status"]:
            if row["ID"] in regional_audit and column in ["Airbnb URLs", "Vrbo URLs", "Booking.com URLs"]:
                # The source preserves unverified links too; badges require attributable evidence.
                assert set(export[row["ID"]][column].splitlines()) <= set(row[column].splitlines()), (row["ID"], column)
            else:
                assert row[column] == export[row["ID"]][column], (row["ID"], column)
print(json.dumps({"retainedRecords": len(homes), "activeCards": len(indexed), "threePhotosEach": True, "descriptionsMax150": True, "activeListingsWithBadges": sum(bool(h["platformLinks"]) for h in indexed.values()), "held": len(reviews), "csvLinksMatchEvidence": True}, indent=2))
