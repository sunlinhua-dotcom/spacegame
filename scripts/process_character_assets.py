from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "assets/generated/characters/raw"
FINAL = ROOT / "assets/generated/characters/final"
REVIEW = ROOT / "output/asset-review"

ASSETS = [
    ("interceptor-blue", "玩家蓝翼截击机", "player", "interceptor-blue.png"),
    ("interceptor-gold", "玩家重炮截击机", "player", "interceptor-gold.png"),
    ("interceptor-laser", "玩家激光截击机", "player", "interceptor-laser.png"),
    ("enemy-meteor-crab", "熔岩陨石敌人", "enemy", "enemy-meteor-crab.png"),
    ("enemy-bolt-needle", "能量针刺敌人", "enemy", "enemy-bolt-needle.png"),
    ("enemy-saucer-hunter", "飞碟猎手敌人", "enemy", "enemy-saucer-hunter.png"),
]


def dark_to_alpha(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    rgb = image.convert("RGB")
    bg = Image.new("RGB", image.size, (0, 0, 0))
    diff = ImageChops.difference(rgb, bg).convert("L")
    alpha = diff.point(lambda value: 0 if value < 20 else min(255, int((value - 12) * 2.35)))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.65))
    image.putalpha(alpha)
    return image


def trim_and_fit(image: Image.Image, size: int = 512, padding: int = 40) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > 18 else 0).getbbox()
    if bbox:
        image = image.crop(bbox)
    width, height = image.size
    scale = min((size - padding * 2) / max(width, 1), (size - padding * 2) / max(height, 1))
    resized = image.resize((max(1, int(width * scale)), max(1, int(height * scale))), Image.LANCZOS)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.alpha_composite(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
    return out


def make_contact_sheet(paths: list[Path]) -> None:
    tile = 180
    sheet = Image.new("RGBA", (tile * len(paths), tile), (4, 14, 18, 255))
    for index, path in enumerate(paths):
        image = Image.open(path).convert("RGBA")
        image.thumbnail((tile - 20, tile - 20), Image.LANCZOS)
        sheet.alpha_composite(image, (index * tile + (tile - image.width) // 2, (tile - image.height) // 2))
    REVIEW.mkdir(parents=True, exist_ok=True)
    sheet.save(REVIEW / "character-assets-contact.png")


def main() -> None:
    FINAL.mkdir(parents=True, exist_ok=True)
    processed = []
    manifest = {"characters": []}
    for slug, name, kind, filename in ASSETS:
        raw_path = RAW / filename
        if not raw_path.exists():
            raise FileNotFoundError(raw_path)
        output_path = FINAL / f"{slug}.png"
        image = trim_and_fit(dark_to_alpha(Image.open(raw_path)))
        image.save(output_path)
        processed.append(output_path)
        manifest["characters"].append(
            {
                "id": slug,
                "name": name,
                "kind": kind,
                "raw": str(raw_path.relative_to(ROOT)),
                "final": str(output_path.relative_to(ROOT)),
            }
        )
    (FINAL / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    make_contact_sheet(processed)
    print(f"Wrote {len(processed)} character assets")


if __name__ == "__main__":
    main()
