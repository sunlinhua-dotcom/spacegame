#!/usr/bin/env python3
"""Replace pure-black backgrounds in cast/enemy sprites with alpha channel.

The gpt-image-1 outputs ship on opaque black; for in-game use we need
transparent backgrounds. This script reads each PNG, computes a per-pixel
alpha based on luminance (very dark → transparent, bright → opaque), with
a smooth ramp at the threshold so glow/halo edges fade naturally.

Usage:
    python tools/bake_transparent.py assets/cast/td-lia.png ...
    python tools/bake_transparent.py --batch assets/cast assets/enemies
"""

import sys
from pathlib import Path
from PIL import Image


# Pixels darker than `lo` become fully transparent. Pixels brighter than
# `hi` stay fully opaque. In between, alpha ramps linearly. Tuned so the
# black-on-image keys cleanly while sprite glow/halo softly feathers.
LO = 26
HI = 64


def luminance(r: int, g: int, b: int) -> float:
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def bake(src: Path) -> bool:
    img = Image.open(src).convert("RGBA")
    w, h = img.size
    pixels = img.load()
    n_changed = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            l = luminance(r, g, b)
            if l <= LO:
                if a:
                    pixels[x, y] = (r, g, b, 0)
                    n_changed += 1
            elif l < HI:
                # Smooth ramp
                ratio = (l - LO) / (HI - LO)
                new_a = int(a * ratio)
                if new_a != a:
                    pixels[x, y] = (r, g, b, new_a)
                    n_changed += 1
    img.save(src, "PNG", optimize=True)
    print(f"  [bake] {src.name}  {n_changed} px alpha-keyed", flush=True)
    return n_changed > 0


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__, file=sys.stderr)
        return 2
    targets = []
    if args[0] == "--batch":
        for d in args[1:]:
            for p in Path(d).rglob("td-*.png"):
                if "_raw" in p.parts: continue
                targets.append(p)
    else:
        targets = [Path(p) for p in args]
    print(f"Baking transparency on {len(targets)} files...")
    for t in targets:
        bake(t)
    print(f"Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
