from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "assets/generated/upgrades/raw/upgrade-vfx-atlas-4x2.png"
FINAL = ROOT / "assets/generated/upgrades/final"
REVIEW = ROOT / "output/asset-review"

NAMES = [
    ("card-reveal", "升级卡揭示"),
    ("boss-core", "Boss 核心奖励"),
    ("weapon-overclock", "武器超频"),
    ("rarity-evolution", "稀有度进化"),
    ("economy-spark", "经济资金"),
    ("explosive-flare", "爆炸强化"),
    ("shield-pulse", "护盾强化"),
    ("shop-reroll", "商店刷新"),
]


def dark_to_alpha(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    diff = ImageChops.difference(image.convert("RGB"), Image.new("RGB", image.size, (0, 0, 0))).convert("L")
    alpha = diff.point(lambda value: 0 if value < 18 else min(255, int((value - 8) * 2.2))).filter(ImageFilter.GaussianBlur(0.55))
    image.putalpha(alpha)
    return image


def fit(image: Image.Image, size: int = 256, padding: int = 22) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > 18 else 0).getbbox()
    if bbox:
        image = image.crop(bbox)
    scale = min((size - padding * 2) / max(image.width, 1), (size - padding * 2) / max(image.height, 1))
    resized = image.resize((max(1, int(image.width * scale)), max(1, int(image.height * scale))), Image.LANCZOS)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.alpha_composite(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
    return out


def main() -> None:
    atlas = Image.open(RAW).convert("RGBA")
    FINAL.mkdir(parents=True, exist_ok=True)
    cell_w = atlas.width // 4
    cell_h = atlas.height // 2
    manifest = {"upgradeVfx": []}
    contact = Image.new("RGBA", (8 * 120, 120), (4, 14, 18, 255))
    for index, (slug, label) in enumerate(NAMES):
        col = index % 4
        row = index // 4
        cell = atlas.crop((col * cell_w, row * cell_h, (col + 1) * cell_w, row * cell_h + int(cell_h * 0.68)))
        output = FINAL / f"{slug}.png"
        image = fit(dark_to_alpha(cell))
        image.save(output)
        thumb = image.copy()
        thumb.thumbnail((106, 106), Image.LANCZOS)
        contact.alpha_composite(thumb, (index * 120 + (120 - thumb.width) // 2, (120 - thumb.height) // 2))
        manifest["upgradeVfx"].append({"id": slug, "name": label, "file": str(output.relative_to(ROOT))})
    (FINAL / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    REVIEW.mkdir(parents=True, exist_ok=True)
    contact.save(REVIEW / "upgrade-vfx-contact.png")
    print("Wrote 8 upgrade vfx assets")


if __name__ == "__main__":
    main()
