#!/usr/bin/env bash
# Regenerates every raster icon from the SVG sources in assets/.
# Requires macOS (sips) and node. Run from the repo root: ./scripts/generate-icons.sh
set -euo pipefail

cd "$(dirname "$0")/.."

SRC_ROUNDED="assets/math-icon.svg"
SRC_SQUARE="assets/math-icon-square.svg"
SRC_MASKABLE="assets/math-icon-maskable.svg"
SRC_OG="assets/og-image.svg"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# render <source.svg> <size> <out.png>
render() {
  sips -s format png "$1" --resampleHeightWidth "$2" "$2" --out "$3" >/dev/null
}

mkdir -p public/icons src/app

# Browser tab + PWA icons (rounded artwork).
render "$SRC_ROUNDED" 16 "$TMP/16.png"
render "$SRC_ROUNDED" 32 "$TMP/32.png"
render "$SRC_ROUNDED" 48 "$TMP/48.png"
render "$SRC_ROUNDED" 192 public/icons/icon-192.png
render "$SRC_ROUNDED" 512 public/icons/icon-512.png

# Android adaptive icons crop to a shape, so use the padded full-bleed artwork.
render "$SRC_MASKABLE" 192 public/icons/icon-maskable-192.png
render "$SRC_MASKABLE" 512 public/icons/icon-maskable-512.png

# iOS home screen applies its own corner mask.
render "$SRC_SQUARE" 180 src/app/apple-icon.png

# Legacy /favicon.ico for clients that ignore <link rel="icon">.
node scripts/build-ico.mjs src/app/favicon.ico "$TMP/16.png" "$TMP/32.png" "$TMP/48.png"

# Social cards (1200x630, rendered at the SVG's intrinsic size).
sips -s format png "$SRC_OG" --out src/app/opengraph-image.png >/dev/null
cp src/app/opengraph-image.png src/app/twitter-image.png

# The modern favicon: vector, no rasterisation needed.
cp "$SRC_ROUNDED" src/app/icon.svg

echo "Icons regenerated."
