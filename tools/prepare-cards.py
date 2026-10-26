"""Reapply reviewed card material without replacing imported property facts."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(name):
    return json.loads((ROOT / name).read_text())


def save(name, value):
    (ROOT / name).write_text(json.dumps(value, ensure_ascii=False, indent=1) + "\n")


homes = read("data/homes.json")
descriptions = read("data/sources/cards/descriptions.json")
platforms = {r["id"]: r for r in read("data/sources/cards/platform-links.json")}
photos = read("data/sources/cards/photo-selections.json")
reviews = {r["id"]: r for r in read("data/sources/cards/website-review.json")}
for h in homes:
    identifier = h["id"]
    if identifier in descriptions:
        h["cardDescription"] = descriptions[identifier]["description"]
        source = descriptions[identifier]["sourceUrl"]
        h["cardDescriptionSource"] = source if source.startswith("http") else h["url"]
    if identifier in platforms:
        h["platformLinks"] = platforms[identifier]["platformLinks"]
    if identifier in photos:
        h["cardPhotos"] = photos[identifier]["files"]
        h["cardPhotoLabel"] = photos[identifier].get("label", "")
    if identifier in reviews:
        h["listingStatus"] = "Needs review"
        h["listingReview"] = reviews[identifier]
save("data/homes.json", homes)
# Keep the normalized source's publication status in agreement with the database.
maine = read("data/sources/maine/catalog.json")
for h in maine:
    if h["id"] in reviews:
        h["listingStatus"] = "Needs review"
save("data/sources/maine/catalog.json", maine)
print(f"Applied card metadata to {len(homes)} retained records; {len(reviews)} held for review")
