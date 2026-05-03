from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
BLACK_DIR = ROOT / "assets/generated/individual/black"
FINAL_DIR = ROOT / "assets/generated/individual/final"
REVIEW_DIR = ROOT / "output/asset-review"

TARGET_SIZES = {
    "earth-core": 768,
    "player-bullet": 256,
    "enemy-bolt": 256,
}


def smoothstep(edge0: float, edge1: float, x: np.ndarray) -> np.ndarray:
    t = np.clip((x - edge0) / (edge1 - edge0), 0, 1)
    return t * t * (3 - 2 * t)


def alpha_from_black(image: Image.Image) -> Image.Image:
    arr = np.asarray(image.convert("RGBA")).astype(np.float32)
    rgb = arr[..., :3] / 255.0
    value = rgb.max(axis=2)
    alpha = smoothstep(0.018, 0.18, value) * 255.0
    arr[..., 3] = np.clip(alpha, 0, 255)
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def alpha_for_earth(image: Image.Image) -> Image.Image:
    arr = np.asarray(image.convert("RGBA")).astype(np.float32)
    rgb = arr[..., :3] / 255.0
    value = rgb.max(axis=2)
    seed = value > 0.08
    ys, xs = np.where(seed)
    if len(xs) == 0:
        return alpha_from_black(image)

    cx = (xs.min() + xs.max()) / 2
    cy = (ys.min() + ys.max()) / 2
    radius = max(xs.max() - xs.min(), ys.max() - ys.min()) / 2
    y_grid, x_grid = np.mgrid[: arr.shape[0], : arr.shape[1]]
    dist = np.sqrt((x_grid - cx) ** 2 + (y_grid - cy) ** 2)
    alpha = (1.0 - smoothstep(radius - 4, radius + 30, dist)) * 255.0
    arr[..., 3] = np.clip(alpha, 0, 255)
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def crop_to_alpha(image: Image.Image) -> Image.Image:
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.where(alpha > 6)
    if len(xs) == 0:
        return image
    pad_x = max(12, int((xs.max() - xs.min()) * 0.08))
    pad_y = max(12, int((ys.max() - ys.min()) * 0.08))
    box = (
        max(0, xs.min() - pad_x),
        max(0, ys.min() - pad_y),
        min(image.width, xs.max() + pad_x),
        min(image.height, ys.max() + pad_y),
    )
    return image.crop(box)


def fit_square(image: Image.Image, name: str) -> Image.Image:
    target = TARGET_SIZES.get(name, 512)
    max_dim = int(target * (0.9 if name == "earth-core" else 0.82))
    scale = min(max_dim / image.width, max_dim / image.height)
    size = (max(1, int(image.width * scale)), max(1, int(image.height * scale)))
    resized = image.resize(size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (target, target), (0, 0, 0, 0))
    canvas.alpha_composite(resized, ((target - size[0]) // 2, (target - size[1]) // 2))
    return canvas


def make_checker(size: tuple[int, int]) -> Image.Image:
    image = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    cell = 18
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            color = (72, 78, 84, 255) if ((x // cell + y // cell) % 2 == 0) else (38, 44, 50, 255)
            draw.rectangle([x, y, x + cell - 1, y + cell - 1], fill=color)
    return image


def make_contact_sheet(paths: list[Path], output: Path) -> None:
    thumbs = []
    for path in paths:
        source = Image.open(path).convert("RGBA")
        source.thumbnail((180, 180))
        tile = Image.new("RGBA", (220, 230), (14, 20, 26, 255))
        tile.alpha_composite(make_checker((180, 180)), (20, 15))
        tile.alpha_composite(source, (20 + (180 - source.width) // 2, 15 + (180 - source.height) // 2))
        draw = ImageDraw.Draw(tile)
        draw.text((12, 202), path.stem, fill=(220, 240, 245, 255))
        thumbs.append(tile)

    cols = 5
    rows = (len(thumbs) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * 220, rows * 230), (6, 10, 14, 255))
    for idx, tile in enumerate(thumbs):
        sheet.alpha_composite(tile, ((idx % cols) * 220, (idx // cols) * 230))
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output)


def main() -> None:
    FINAL_DIR.mkdir(parents=True, exist_ok=True)
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    manifest = []
    generated = []
    for source in sorted(BLACK_DIR.glob("*.png")):
        name = source.stem
        image = Image.open(source).convert("RGBA")
        transparent = alpha_for_earth(image) if name == "earth-core" else alpha_from_black(image)
        final = fit_square(crop_to_alpha(transparent), name)
        target = FINAL_DIR / f"{name}.png"
        final.save(target)
        generated.append(target)
        manifest.append(
            {
                "id": name,
                "file": f"assets/generated/individual/final/{name}.png",
                "source_file": f"assets/generated/individual/black/{name}.png",
                "pipeline": "single-imagegen-asset-black-background-alpha-clean",
            }
        )

    (FINAL_DIR / "manifest.json").write_text(json.dumps({"assets": manifest}, ensure_ascii=False, indent=2) + "\n")
    make_contact_sheet(generated, REVIEW_DIR / "final-individual-assets-contact.png")


if __name__ == "__main__":
    main()
