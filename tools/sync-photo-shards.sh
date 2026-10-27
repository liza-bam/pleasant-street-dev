#!/bin/sh
# Copy new or changed photos from images/ into the shard repos next to this checkout and push them.
# Shards (by ID prefix, longest match first — same map as .github/workflows/pages.yml):
#   MA-10 → 5   MA-11 → 6   MA-1 → 1   MA-6, MA-7 → 2   ME-, MA-0 → 3   everything else → 4
# Stopgap until IMAGE_BASE points the site at the LAZY bucket; then this script is unused.
set -e
HERE=$(cd "$(dirname "$0")/.." && pwd); GH=$(dirname "$HERE")
shard() { case "$1" in MA-10*) echo 5;; MA-11*) echo 6;; MA-1*) echo 1;; MA-6*|MA-7*) echo 2;; ME-*|MA-0*) echo 3;; *) echo 4;; esac; }
for n in 1 2 3 4 5 6; do [ -d "$GH/pleasant-street-images-$n/images" ] || { echo "missing checkout $GH/pleasant-street-images-$n" >&2; exit 1; }; done
cd "$HERE/images"
for f in *; do
  n=$(shard "$f"); dest="$GH/pleasant-street-images-$n/images/$f"
  if [ -d "$f" ]; then rsync -a "$f/" "$dest/"; elif [ ! -f "$dest" ] || ! cmp -s "$f" "$dest"; then cp -p "$f" "$dest"; fi
done
for n in 1 2 3 4 5 6; do
  cd "$GH/pleasant-street-images-$n"; git add -A
  git diff --cached --quiet && { echo "shard $n: nothing new"; continue; }
  git commit -q -m "Photos synced $(date -u +%F)"; git push -q origin main && echo "shard $n: pushed $(git diff --stat HEAD~1 | tail -1)"
done
