from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter


SRC = Path("assets/generated/bosses/raw/boss-atlas-5x2.png")
OUT = Path("assets/generated/bosses/final")
FRAMES = Path("assets/generated/bosses/frames")
REVIEW = Path("output/asset-review/boss-frame-contact.png")
SIZE = 512

BOSSES = [
    ("熔核陨星", "molten-asteroid", "火山裂隙核心，周期喷发岩浆弹"),
    ("寄生蜂巢", "bio-saucer-hive", "绿色生物机械外壳，召唤修复虫群"),
    ("霜晶利维坦", "ice-crystal-leviathan", "冰晶护甲，释放减速晶刺"),
    ("虚空母舰", "void-mothership", "紫色暗能量舰体，发射扇形切割线"),
    ("黄金炮垒", "gold-artillery-fortress", "重型火炮平台，多炮口轮射"),
    ("赤环蛇影", "red-plasma-coil", "环形等离子生命体，缠绕式攻击"),
    ("离子雷巢", "blue-ion-hive", "蓝色电弧核心，跳跃电击"),
    ("黑骨 dreadnought", "black-dreadnought", "黑色装甲巨舰，冲撞与装甲阶段"),
    ("白环引力机", "white-graviton-ring", "多层引力环，牵引小飞机"),
    ("日蚀核心", "solar-eclipse-core", "最终日蚀体，释放全屏脉冲"),
]


def alpha_clear(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    px = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = px[x, y]
            lum = max(r, g, b)
            if lum < 10:
                px[x, y] = (r, g, b, 0)
            elif lum < 34:
                px[x, y] = (r, g, b, int((lum - 10) / 24 * 185))
            else:
                px[x, y] = (r, g, b, a)
    return rgba


def fit_to_canvas(img: Image.Image, pad: int = 18) -> Image.Image:
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    scale = min((SIZE - pad * 2) / img.width, (SIZE - pad * 2) / img.height)
    new_size = (max(1, int(img.width * scale)), max(1, int(img.height * scale)))
    img = img.resize(new_size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    canvas.alpha_composite(img, ((SIZE - img.width) // 2, (SIZE - img.height) // 2))
    return canvas


def dominant_color(img: Image.Image) -> tuple[int, int, int]:
    thumb = img.resize((1, 1), Image.Resampling.BOX).convert("RGBA")
    r, g, b, _ = thumb.getpixel((0, 0))
    return max(80, r), max(80, g), max(80, b)


def make_frame(base: Image.Image, color: tuple[int, int, int], frame: int) -> Image.Image:
    pulse = [0.94, 1.08, 1.0, 1.14][frame]
    angle = [-0.9, 0.55, 1.05, -0.35][frame]
    scale = [1.0, 1.025, 0.99, 1.018][frame]

    work = ImageEnhance.Brightness(base).enhance(pulse)
    work = ImageEnhance.Contrast(work).enhance(1.06)
    if scale != 1:
        size = int(SIZE * scale)
        resized = work.resize((size, size), Image.Resampling.LANCZOS)
        work = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        work.alpha_composite(resized, ((SIZE - size) // 2, (SIZE - size) // 2))
    work = work.rotate(angle, resample=Image.Resampling.BICUBIC, expand=False)

    alpha = work.getchannel("A")
    glow = Image.new("RGBA", (SIZE, SIZE), (*color, 0))
    glow.putalpha(alpha.filter(ImageFilter.GaussianBlur(12)).point(lambda v: min(150, int(v * (0.34 + frame * 0.05)))))
    halo = Image.new("RGBA", (SIZE, SIZE), (*color, 0))
    halo.putalpha(alpha.filter(ImageFilter.GaussianBlur(28)).point(lambda v: min(85, int(v * (0.18 + frame * 0.03)))))

    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    canvas.alpha_composite(halo)
    canvas.alpha_composite(glow)
    canvas.alpha_composite(work)
    return canvas


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    FRAMES.mkdir(parents=True, exist_ok=True)
    atlas = Image.open(SRC).convert("RGB")
    cell_w = atlas.width // 5
    cell_h = atlas.height // 2
    manifest = []
    review_cells = []

    for idx, (name, slug, ability) in enumerate(BOSSES):
        col = idx % 5
        row = idx // 5
        crop = atlas.crop((col * cell_w, row * cell_h, (col + 1) * cell_w, (row + 1) * cell_h))
        base = fit_to_canvas(alpha_clear(crop))
        color = dominant_color(base)
        base_file = OUT / f"boss-{idx + 1:02d}-{slug}.png"
        base.save(base_file)
        frame_files = []
        for frame in range(4):
            framed = make_frame(base, color, frame)
            frame_file = FRAMES / f"boss-{idx + 1:02d}-{slug}-frame-{frame:02d}.png"
            framed.save(frame_file)
            frame_files.append(str(frame_file))
            review_cells.append(framed.resize((160, 160), Image.Resampling.LANCZOS))
        level = idx + 1
        max_hp = round(320 + level * 180 + level * level * 95)
        manifest.append(
            {
                "id": f"boss-{level:02d}",
                "level": level,
                "name": name,
                "slug": slug,
                "ability": ability,
                "maxHp": max_hp,
                "reward": 20 + level * 8,
                "size": 156 + level * 4,
                "base": str(base_file),
                "frames": frame_files,
            }
        )

    sheet = Image.new("RGBA", (160 * 4, 160 * 10), (0, 0, 0, 255))
    for i, cell in enumerate(review_cells):
        sheet.alpha_composite(cell, ((i % 4) * 160, (i // 4) * 160))
    REVIEW.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(REVIEW)
    (Path("assets/generated/bosses") / "manifest.json").write_text(json.dumps({"bosses": manifest}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(manifest)} bosses")
    print(REVIEW)


if __name__ == "__main__":
    main()
