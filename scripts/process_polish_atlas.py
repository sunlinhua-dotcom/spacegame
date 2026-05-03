from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "assets/generated/polish/raw/gameplay-polish-atlas-4x4.png"
FINAL = ROOT / "assets/generated/polish/final"
REVIEW = ROOT / "output/asset-review"

ITEMS = [
    ("boss-weakpoint-core", "Boss 弱点核心", "boss"),
    ("boss-rage-aura", "Boss 狂暴光环", "boss"),
    ("danger-warning-ring", "Boss 预警圈", "telegraph"),
    ("boss-charge-lane", "Boss 冲锋轨道", "telegraph"),
    ("tactical-freeze-bomb", "冻结战术弹", "tactical"),
    ("orbital-rail-cannon", "轨道炮令牌", "tactical"),
    ("earth-repair-nanites", "地球修复纳米云", "tactical"),
    ("shield-overcharge", "护盾超载脉冲", "tactical"),
    ("shop-lock-card", "商店锁卡", "shop"),
    ("rarity-reroll-prism", "稀有度重掷棱晶", "shop"),
    ("war-fund-cache", "战争资金缓存", "shop"),
    ("hire-fleet-beacon", "雇佣舰队信标", "shop"),
    ("stage-asteroid-belt", "陨石带关卡徽记", "stage"),
    ("stage-mothership-shadow", "母舰阴影关卡徽记", "stage"),
    ("stage-ion-storm", "电磁风暴关卡徽记", "stage"),
    ("stage-eclipse-finale", "日蚀终局关卡徽记", "stage"),
]


def dark_to_alpha(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    diff = ImageChops.difference(image.convert("RGB"), Image.new("RGB", image.size, (0, 0, 0))).convert("L")
    alpha = diff.point(lambda value: 0 if value < 18 else min(255, int((value - 10) * 2.45)))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.55))
    image.putalpha(alpha)
    return image


def trim_and_fit(image: Image.Image, size: int = 320, padding: int = 24) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > 16 else 0).getbbox()
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
    REVIEW.mkdir(parents=True, exist_ok=True)

    cell_w = atlas.width // 4
    cell_h = atlas.height // 4
    manifest = {
        "source": str(RAW.relative_to(ROOT)),
        "model": "local-procedural-pillow",
        "base_url": "local",
        "grid": "4x4",
        "items": [],
    }

    tile = 150
    contact = Image.new("RGBA", (tile * 4, tile * 4), (4, 14, 18, 255))

    for index, (slug, name, group) in enumerate(ITEMS):
        col = index % 4
        row = index // 4
        crop = atlas.crop((col * cell_w + 4, row * cell_h + 4, (col + 1) * cell_w - 4, (row + 1) * cell_h - 4))
        image = trim_and_fit(dark_to_alpha(crop))
        output = FINAL / f"{slug}.png"
        image.save(output)

        thumb = image.copy()
        thumb.thumbnail((tile - 14, tile - 14), Image.LANCZOS)
        contact.alpha_composite(thumb, (col * tile + (tile - thumb.width) // 2, row * tile + (tile - thumb.height) // 2))

        manifest["items"].append(
            {
                "id": slug,
                "name": name,
                "group": group,
                "file": str(output.relative_to(ROOT)),
                "cell": {"row": row + 1, "col": col + 1},
            }
        )

    (FINAL / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    contact.save(REVIEW / "gameplay-polish-atlas-contact.png")
    print(f"Wrote {len(ITEMS)} gameplay polish assets")


if __name__ == "__main__":
    main()
