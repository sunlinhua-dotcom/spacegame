#!/usr/bin/env python3
"""Slice a generated sprite sheet into named panels.

Usage:
    python tools/slice_sheet.py <preset> <input_png> <output_dir>

Each preset declares its grid + cell names. Cells are extracted with PIL
crop and saved as individual PNGs.
"""

import sys
from pathlib import Path
from PIL import Image


# Each preset: (grid_cols, grid_rows, list of cell names in row-major order)
SLICES = {
    "hero_cast": (5, 4, [
        # Row 1: BRIGHT (5 cells)
        "bright-portrait-cool",
        "bright-portrait-determined",
        "bright-action-awakening",
        "bright-action-command",
        "emblem-digirepub",
        # Row 2: portraits (5 cells)
        "sakura-portrait",
        "rin-portrait",
        "yue-portrait",
        "aria-portrait",
        "lia-portrait",
        # Row 3: portraits + actions (5 cells)
        "ade-portrait",
        "devi-portrait",
        "sakura-action",
        "rin-action",
        "yue-action",
        # Row 4: actions (5 cells)
        "aria-action",
        "lia-action",
        "ade-action",
        "devi-action",
        "emblem-coalition",
    ]),

    "enemy_sheet_1": (3, 3, [
        "crystal-stalker",
        "magma-worm",
        "bio-beetle",
        "shadow-cone",
        "ion-sentinel",
        "magma-spider",
        "void-hunter",
        "bio-cloud",
        "storm-wraith",
    ]),

    "enemy_sheet_2": (3, 2, [
        "gold-carapace",
        "mirror-splitter",
        "gravity-pulse",
        "hook-reaper",
        "mega-asteroid",
        "shadow-apostle",
    ]),
}


def slice_sheet(preset: str, src: Path, out_dir: Path) -> None:
    if preset not in SLICES:
        raise SystemExit(f"unknown preset: {preset}; available: {list(SLICES)}")
    cols, rows, names = SLICES[preset]
    if len(names) != cols * rows:
        raise SystemExit(f"preset {preset}: {len(names)} names but {cols * rows} cells")

    out_dir.mkdir(parents=True, exist_ok=True)
    img = Image.open(src).convert("RGBA")
    W, H = img.size
    cell_w = W // cols
    cell_h = H // rows

    for idx, name in enumerate(names):
        r, c = divmod(idx, cols)
        x0, y0 = c * cell_w, r * cell_h
        x1, y1 = x0 + cell_w, y0 + cell_h
        cell = img.crop((x0, y0, x1, y1))
        out = out_dir / f"{name}.png"
        cell.save(out, optimize=True)
        print(f"  [slice] {name:30}  {cell.size[0]}x{cell.size[1]}  → {out}", flush=True)
    print(f"[slice] {len(names)} cells written to {out_dir}", flush=True)


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(__doc__, file=sys.stderr)
        raise SystemExit(2)
    slice_sheet(sys.argv[1], Path(sys.argv[2]), Path(sys.argv[3]))
