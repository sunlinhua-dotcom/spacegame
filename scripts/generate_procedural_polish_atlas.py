from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/generated/polish/raw/gameplay-polish-atlas-4x4.png"
CELL = 256
SCALE = 3
random.seed(42)


def rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    hex_color = hex_color.lstrip("#")
    return (int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16), alpha)


def new_cell() -> Image.Image:
    return Image.new("RGBA", (CELL * SCALE, CELL * SCALE), (0, 0, 0, 255))


def glow_circle(layer: Image.Image, center: tuple[float, float], radius: float, color: str, alpha: int, blur: float) -> None:
    temp = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(temp)
    x, y = center
    d.ellipse((x - radius, y - radius, x + radius, y + radius), fill=rgba(color, alpha))
    temp = temp.filter(ImageFilter.GaussianBlur(blur))
    layer.alpha_composite(temp)


def line_glow(layer: Image.Image, points: list[tuple[float, float]], color: str, width: int, alpha: int, blur: float = 7) -> None:
    temp = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(temp)
    d.line(points, fill=rgba(color, alpha), width=width, joint="curve")
    layer.alpha_composite(temp.filter(ImageFilter.GaussianBlur(blur)))
    d = ImageDraw.Draw(layer)
    d.line(points, fill=rgba(color, 240), width=max(1, width // 3), joint="curve")


def polygon_glow(layer: Image.Image, points: list[tuple[float, float]], color: str, alpha: int, blur: float = 8) -> None:
    temp = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(temp)
    d.polygon(points, fill=rgba(color, alpha))
    layer.alpha_composite(temp.filter(ImageFilter.GaussianBlur(blur)))
    d = ImageDraw.Draw(layer)
    d.polygon(points, outline=rgba(color, 230), fill=rgba(color, 38))


def draw_ring(d: ImageDraw.ImageDraw, cx: int, cy: int, r: int, color: str, width: int = 7, alpha: int = 230) -> None:
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=rgba(color, alpha), width=width)


def add_sparks(layer: Image.Image, cx: int, cy: int, color: str, count: int = 22, inner: int = 38, outer: int = 110) -> None:
    d = ImageDraw.Draw(layer)
    for _ in range(count):
        a = random.random() * math.tau
        r1 = random.randint(inner, outer) * SCALE
        r2 = r1 + random.randint(8, 24) * SCALE
        x1 = cx + math.cos(a) * r1
        y1 = cy + math.sin(a) * r1
        x2 = cx + math.cos(a) * r2
        y2 = cy + math.sin(a) * r2
        d.line((x1, y1, x2, y2), fill=rgba(color, random.randint(120, 230)), width=random.randint(1, 3) * SCALE)


def finish(cell: Image.Image) -> Image.Image:
    return cell.resize((CELL, CELL), Image.Resampling.LANCZOS)


def boss_weakpoint() -> Image.Image:
    c = new_cell(); d = ImageDraw.Draw(c); cx = cy = CELL * SCALE // 2
    glow_circle(c, (cx, cy), 92 * SCALE, "#ff3b1f", 90, 30 * SCALE)
    for r, col in [(78, "#4c1110"), (56, "#ff4c25"), (32, "#ffb24e"), (16, "#fff3a0")]:
        draw_ring(d, cx, cy, r * SCALE, col, 7 * SCALE)
    for i in range(8):
        a = i * math.tau / 8 + 0.18
        p1 = (cx + math.cos(a) * 44 * SCALE, cy + math.sin(a) * 44 * SCALE)
        p2 = (cx + math.cos(a + 0.28) * 82 * SCALE, cy + math.sin(a + 0.28) * 82 * SCALE)
        p3 = (cx + math.cos(a - 0.28) * 82 * SCALE, cy + math.sin(a - 0.28) * 82 * SCALE)
        polygon_glow(c, [p1, p2, p3], "#3e4a58", 185, 3 * SCALE)
    glow_circle(c, (cx, cy), 18 * SCALE, "#fff2a8", 220, 6 * SCALE)
    add_sparks(c, cx, cy, "#ff6b25", 30)
    return finish(c)


def energy_ring(color1: str, color2: str) -> Image.Image:
    c = new_cell(); d = ImageDraw.Draw(c); cx = cy = CELL * SCALE // 2
    glow_circle(c, (cx, cy), 82 * SCALE, color1, 80, 22 * SCALE)
    for i in range(5):
        bbox = (cx - (62 + i * 3) * SCALE, cy - (62 + i * 3) * SCALE, cx + (62 + i * 3) * SCALE, cy + (62 + i * 3) * SCALE)
        d.arc(bbox, start=20 + i * 54, end=250 + i * 35, fill=rgba(color1 if i % 2 else color2, 220), width=(4 + i % 2) * SCALE)
    add_sparks(c, cx, cy, color2, 18, 50, 94)
    return finish(c)


def warning_ring() -> Image.Image:
    c = new_cell(); d = ImageDraw.Draw(c); cx = cy = CELL * SCALE // 2
    glow_circle(c, (cx, cy), 86 * SCALE, "#ff9600", 74, 16 * SCALE)
    draw_ring(d, cx, cy, 72 * SCALE, "#ffb13a", 5 * SCALE)
    draw_ring(d, cx, cy, 56 * SCALE, "#ff5b18", 2 * SCALE, 180)
    for i in range(12):
        a = i * math.tau / 12
        p1 = (cx + math.cos(a) * 79 * SCALE, cy + math.sin(a) * 79 * SCALE)
        p2 = (cx + math.cos(a) * 102 * SCALE, cy + math.sin(a) * 102 * SCALE)
        line_glow(c, [p1, p2], "#ffb13a", 5 * SCALE, 160, 4 * SCALE)
    return finish(c)


def charge_lane() -> Image.Image:
    c = new_cell(); cx = CELL * SCALE // 2
    p = [(cx - 28 * SCALE, 28 * SCALE), (cx + 28 * SCALE, 28 * SCALE), (cx + 75 * SCALE, 224 * SCALE), (cx - 75 * SCALE, 224 * SCALE)]
    polygon_glow(c, p, "#ff2418", 92, 12 * SCALE)
    line_glow(c, [((cx - 10 * SCALE), 22 * SCALE), (cx - 38 * SCALE, 224 * SCALE)], "#ff9d31", 5 * SCALE, 210)
    line_glow(c, [((cx + 10 * SCALE), 22 * SCALE), (cx + 38 * SCALE, 224 * SCALE)], "#ff2418", 5 * SCALE, 210)
    glow_circle(c, (cx, 24 * SCALE), 8 * SCALE, "#fff1a3", 210, 8 * SCALE)
    return finish(c)


def freeze_bomb() -> Image.Image:
    c = new_cell(); d = ImageDraw.Draw(c); cx = cy = CELL * SCALE // 2
    glow_circle(c, (cx, cy), 84 * SCALE, "#6fd9ff", 110, 24 * SCALE)
    d.ellipse((cx - 58 * SCALE, cy - 58 * SCALE, cx + 58 * SCALE, cy + 58 * SCALE), fill=rgba("#83ddff", 54), outline=rgba("#dffaff", 230), width=4 * SCALE)
    for i in range(6):
        a = i * math.tau / 6
        line_glow(c, [(cx, cy), (cx + math.cos(a) * 48 * SCALE, cy + math.sin(a) * 48 * SCALE)], "#e7fbff", 4 * SCALE, 150)
    return finish(c)


def rail_cannon() -> Image.Image:
    c = new_cell(); d = ImageDraw.Draw(c); cx = cy = CELL * SCALE // 2
    glow_circle(c, (cx, cy), 84 * SCALE, "#56e8ff", 70, 18 * SCALE)
    draw_ring(d, cx, cy, 72 * SCALE, "#72828d", 10 * SCALE, 220)
    draw_ring(d, cx, cy, 48 * SCALE, "#8ff5ff", 4 * SCALE, 210)
    d.rounded_rectangle((cx - 18 * SCALE, cy - 80 * SCALE, cx + 18 * SCALE, cy + 58 * SCALE), radius=8 * SCALE, fill=rgba("#b7c8d0", 230), outline=rgba("#54efff", 210), width=3 * SCALE)
    for a in [math.pi / 4, 3 * math.pi / 4, 5 * math.pi / 4, 7 * math.pi / 4]:
        x = cx + math.cos(a) * 74 * SCALE
        y = cy + math.sin(a) * 74 * SCALE
        d.rectangle((x - 18 * SCALE, y - 18 * SCALE, x + 18 * SCALE, y + 18 * SCALE), fill=rgba("#3ebce6", 190), outline=rgba("#d4fbff", 200), width=2 * SCALE)
    return finish(c)


def repair_nanites() -> Image.Image:
    c = new_cell(); d = ImageDraw.Draw(c); cx = cy = CELL * SCALE // 2
    glow_circle(c, (cx, cy), 82 * SCALE, "#1fffb6", 70, 20 * SCALE)
    d.ellipse((cx - 44 * SCALE, cy - 44 * SCALE, cx + 44 * SCALE, cy + 44 * SCALE), fill=rgba("#2c80d0", 190), outline=rgba("#8dffdd", 230), width=4 * SCALE)
    d.arc((cx - 44 * SCALE, cy - 18 * SCALE, cx + 44 * SCALE, cy + 18 * SCALE), 0, 360, fill=rgba("#b8ffd8", 180), width=2 * SCALE)
    d.arc((cx - 22 * SCALE, cy - 44 * SCALE, cx + 22 * SCALE, cy + 44 * SCALE), 0, 360, fill=rgba("#b8ffd8", 160), width=2 * SCALE)
    for i in range(22):
        a = i * math.tau / 22
        x = cx + math.cos(a) * random.randint(55, 88) * SCALE
        y = cy + math.sin(a) * random.randint(55, 88) * SCALE
        d.rounded_rectangle((x - 4 * SCALE, y - 4 * SCALE, x + 4 * SCALE, y + 4 * SCALE), radius=2 * SCALE, fill=rgba("#39ffc4", 210))
    return finish(c)


def shield_dome() -> Image.Image:
    c = new_cell(); d = ImageDraw.Draw(c); cx = CELL * SCALE // 2; cy = 150 * SCALE
    glow_circle(c, (cx, cy), 82 * SCALE, "#66dfff", 78, 22 * SCALE)
    d.arc((cx - 86 * SCALE, cy - 86 * SCALE, cx + 86 * SCALE, cy + 86 * SCALE), 180, 360, fill=rgba("#a6f7ff", 230), width=6 * SCALE)
    d.ellipse((cx - 94 * SCALE, cy - 13 * SCALE, cx + 94 * SCALE, cy + 16 * SCALE), outline=rgba("#45e7ff", 190), width=4 * SCALE)
    for i in range(8):
        x = cx - 62 * SCALE + i * 18 * SCALE
        d.line((x, cy - 74 * SCALE, x + 16 * SCALE, cy - 8 * SCALE), fill=rgba("#d9ffff", 70), width=2 * SCALE)
    return finish(c)


def card_lock() -> Image.Image:
    c = new_cell(); d = ImageDraw.Draw(c); cx = cy = CELL * SCALE // 2
    glow_circle(c, (cx, cy), 82 * SCALE, "#ffb84d", 78, 16 * SCALE)
    d.rounded_rectangle((58 * SCALE, 42 * SCALE, 198 * SCALE, 214 * SCALE), radius=12 * SCALE, fill=rgba("#231606", 210), outline=rgba("#ffc85b", 230), width=5 * SCALE)
    d.rounded_rectangle((94 * SCALE, 112 * SCALE, 162 * SCALE, 164 * SCALE), radius=7 * SCALE, fill=rgba("#ffc34d", 240))
    d.arc((98 * SCALE, 78 * SCALE, 158 * SCALE, 138 * SCALE), 180, 360, fill=rgba("#fff1a3", 230), width=8 * SCALE)
    return finish(c)


def prism() -> Image.Image:
    c = new_cell(); cx = cy = CELL * SCALE // 2
    glow_circle(c, (cx, cy), 92 * SCALE, "#b84dff", 110, 20 * SCALE)
    pts = [(cx, 42 * SCALE), (190 * SCALE, 104 * SCALE), (170 * SCALE, 190 * SCALE), (cx, 226 * SCALE), (86 * SCALE, 190 * SCALE), (66 * SCALE, 104 * SCALE)]
    d = ImageDraw.Draw(c)
    d.polygon(pts, fill=rgba("#6e28aa", 135), outline=rgba("#f0c0ff", 245))
    d.polygon([(cx, 42 * SCALE), (190 * SCALE, 104 * SCALE), (cx, cy)], fill=rgba("#d080ff", 95))
    d.polygon([(cx, cy), (170 * SCALE, 190 * SCALE), (cx, 226 * SCALE)], fill=rgba("#8b38ff", 105))
    d.polygon([(66 * SCALE, 104 * SCALE), (cx, cy), (86 * SCALE, 190 * SCALE)], fill=rgba("#321248", 130))
    for p in pts:
        line_glow(c, [(cx, cy), p], "#ffd97a", 3 * SCALE, 110, 3 * SCALE)
    draw_ring(d, cx, cy, 76 * SCALE, "#9f42ff", 3 * SCALE, 180)
    return finish(c)


def credits() -> Image.Image:
    c = new_cell(); d = ImageDraw.Draw(c); cx = cy = CELL * SCALE // 2
    glow_circle(c, (cx, cy), 88 * SCALE, "#ffbd38", 75, 18 * SCALE)
    for i in range(8):
        a = i * math.tau / 8
        x = cx + math.cos(a) * random.randint(18, 58) * SCALE
        y = cy + math.sin(a) * random.randint(10, 50) * SCALE
        d.rounded_rectangle((x - 26 * SCALE, y - 15 * SCALE, x + 26 * SCALE, y + 15 * SCALE), radius=6 * SCALE, fill=rgba("#6a3b08", 230), outline=rgba("#ffd876", 230), width=3 * SCALE)
        glow_circle(c, (x, y), 10 * SCALE, "#fff1a3", 170, 5 * SCALE)
    return finish(c)


def fleet_beacon() -> Image.Image:
    c = new_cell(); d = ImageDraw.Draw(c); cx = cy = CELL * SCALE // 2
    tri = [(cx, 38 * SCALE), (218 * SCALE, 208 * SCALE), (38 * SCALE, 208 * SCALE)]
    polygon_glow(c, tri, "#45e7ff", 72, 12 * SCALE)
    for off in [-36, 0, 36]:
        ship = [(cx + off * SCALE, 96 * SCALE), (cx + (off - 15) * SCALE, 154 * SCALE), (cx + off * SCALE, 144 * SCALE), (cx + (off + 15) * SCALE, 154 * SCALE)]
        d.polygon(ship, fill=rgba("#d8fbff", 210), outline=rgba("#45e7ff", 240))
    return finish(c)


def asteroid_sigil() -> Image.Image:
    c = energy_ring("#ff8f24", "#ffbd4d"); d = ImageDraw.Draw(c)
    for _ in range(15):
        x = random.randint(28, 228)
        y = random.randint(42, 214)
        r = random.randint(6, 16)
        d.ellipse((x - r, y - r, x + r, y + r), fill=(83, 63, 48, 235), outline=(255, 169, 74, 170), width=2)
    return c


def mothership() -> Image.Image:
    c = new_cell(); d = ImageDraw.Draw(c); cx = cy = CELL * SCALE // 2
    glow_circle(c, (cx, cy), 92 * SCALE, "#a750ff", 105, 22 * SCALE)
    hull = [(cx, 34 * SCALE), (218 * SCALE, 138 * SCALE), (168 * SCALE, 198 * SCALE), (cx, 174 * SCALE), (88 * SCALE, 198 * SCALE), (38 * SCALE, 138 * SCALE)]
    d.polygon(hull, fill=rgba("#5b248f", 190), outline=rgba("#d08cff", 245))
    d.polygon([(cx, 34 * SCALE), (164 * SCALE, 140 * SCALE), (cx, 174 * SCALE), (92 * SCALE, 140 * SCALE)], fill=rgba("#9d4bff", 130), outline=rgba("#f0c8ff", 150))
    d.ellipse((cx - 21 * SCALE, cy - 21 * SCALE, cx + 21 * SCALE, cy + 21 * SCALE), fill=rgba("#e7b9ff", 235), outline=rgba("#ffffff", 190), width=2 * SCALE)
    for x in [76, 108, 148, 180]:
        glow_circle(c, (x * SCALE, 186 * SCALE), 7 * SCALE, "#d45cff", 180, 6 * SCALE)
    draw_ring(d, cx, cy, 78 * SCALE, "#7a24c8", 3 * SCALE, 170)
    return finish(c)


def ion_storm() -> Image.Image:
    c = energy_ring("#45cfff", "#ffffff"); cx = cy = CELL * SCALE // 2
    for i in range(8):
        a = i * math.tau / 8 + 0.2
        pts = []
        for j in range(6):
            r = (18 + j * 17) * SCALE
            pts.append((cx + math.cos(a + j * 0.23) * r, cy + math.sin(a + j * 0.23) * r))
        line_glow(c, pts, "#7beaff", 4 * SCALE, 140, 4 * SCALE)
    return finish(c)


def eclipse() -> Image.Image:
    c = new_cell(); d = ImageDraw.Draw(c); cx = cy = CELL * SCALE // 2
    glow_circle(c, (cx, cy), 98 * SCALE, "#ffc64d", 135, 20 * SCALE)
    d.ellipse((cx - 70 * SCALE, cy - 70 * SCALE, cx + 70 * SCALE, cy + 70 * SCALE), fill=rgba("#020608", 255), outline=rgba("#ffcf63", 240), width=4 * SCALE)
    for i in range(30):
        a = i * math.tau / 30
        p1 = (cx + math.cos(a) * 74 * SCALE, cy + math.sin(a) * 74 * SCALE)
        p2 = (cx + math.cos(a) * random.randint(86, 116) * SCALE, cy + math.sin(a) * random.randint(86, 116) * SCALE)
        d.line((p1, p2), fill=rgba("#ffbf3f", random.randint(70, 160)), width=random.randint(1, 3) * SCALE)
    return finish(c)


DRAWERS = [
    boss_weakpoint,
    lambda: energy_ring("#ff2222", "#ff6c2a"),
    warning_ring,
    charge_lane,
    freeze_bomb,
    rail_cannon,
    repair_nanites,
    shield_dome,
    card_lock,
    prism,
    credits,
    fleet_beacon,
    asteroid_sigil,
    mothership,
    ion_storm,
    eclipse,
]


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    atlas = Image.new("RGBA", (CELL * 4, CELL * 4), (2, 5, 7, 255))
    for index, drawer in enumerate(DRAWERS):
        cell = drawer()
        x = (index % 4) * CELL
        y = (index // 4) * CELL
        atlas.alpha_composite(cell, (x, y))
    d = ImageDraw.Draw(atlas)
    for i in range(5):
        p = i * CELL
        d.line((p, 0, p, CELL * 4), fill=(18, 31, 34, 255), width=2)
        d.line((0, p, CELL * 4, p), fill=(18, 31, 34, 255), width=2)
    atlas.save(OUT)
    print(OUT)


if __name__ == "__main__":
    main()
