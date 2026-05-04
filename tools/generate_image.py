#!/usr/bin/env python3
"""Generate one image via gpt-image-2-all (apiyi proxy) and save it.

Usage:
    python tools/generate_image.py <preset> <out_path>

Presets live in this file as PROMPTS so we can iterate without touching the
calling code. Reads creds from `.env`.
"""

import base64
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

API_KEY = os.environ["APIYI_API_KEY"]
BASE_URL = os.environ["APIYI_BASE_URL"]
MODEL = os.environ["APIYI_IMAGE_MODEL"]


PROMPTS = {
    "hero_cast": """A 1792x1024 character splash sheet for a sci-fi space defense game,
20 panels in a strict 5-column x 4-row grid (each panel exactly 358x256 px,
separated by thin dark gutters). Each panel contains a single subject with
no overlap and a deep navy-to-black backdrop with rim light in the panel's
signature color.

Art style: Korean MMORPG splash art, NIKKE / Lost Ark / Blue Archive aesthetic.
Anime semi-realistic, painterly linework, dramatic studio lighting,
sharp focus on faces. Each character has a unique mecha silhouette
(distinct armor shape, weapon mounts, color rim). All women fully clothed
in tight black tactical leather underlayer with sleek high-tech mecha
armor plates over shoulders, chest, hips, shins. Confident heroic stance,
action-ready. No fan service.

Row 1 (top — 5 panels of BRIGHT, the male commander, 30s, deep indigo
mecha):
  P1 cool side-profile portrait, helmet visor up.
  P2 determined front-facing portrait.
  P3 full-body awakening pose, light energy blooming behind.
  P4 full-body command stance, arms crossed.
  P5 DIGIREPUB studio emblem (geometric badge, no figure).

Row 2 (close-up portraits, head-and-shoulders, helmet retracted, eyes
forward):
  P6 Sakura — Japan, sakura-pink rim, cherry-blossom motifs, twin pink
     ponytails, lightweight mecha.
  P7 Rin — Korea, cobalt blue rim, white short bob, sniper-spec slim mecha.
  P8 Yue — China, crimson rim, long jet-black hair, classical mecha
     with crescent ornaments.
  P9 Aria — France, magenta rim, silver wavy hair, elegant mecha with
     conductor-baton weapon.
  P10 Lia — Brazil, emerald-orange rim, dark wavy high ponytail, fiery
     mecha plates.

Row 3 (more portraits + transition to action):
  P11 Ade — Nigeria, gold rim, glossy black short hair, heavy gold-trim
      mecha.
  P12 Devi — India, violet rim, deep brown hair in elaborate braids,
      regal mecha with herbal-tech etchings.
  P13 Sakura — full-body action pose, lightning crackle.
  P14 Rin — full-body action pose, sniper rifle drawn.
  P15 Yue — full-body action pose, twin moon-blades.

Row 4 (full-body action poses):
  P16 Aria — orchestrating wind blades.
  P17 Lia — fire trail behind, fist forward.
  P18 Ade — golden shield raised.
  P19 Devi — bio-shield hovering before her.
  P20 cheer-protocol coalition emblem (geometric badge with seven
      stylized country marks, no figure).

CRITICAL: keep panels evenly sized in the 5x4 grid. Do NOT merge panels.
Do NOT show text labels in the panels. Each panel is independently
sliceable.""",

    "enemy_sheet_1": """A 1792x1024 enemy bestiary sheet for a sci-fi defense game,
9 panels in a strict 3-column x 3-row grid (each panel exactly
597x341 px, separated by thin dark gutters). Each panel one creature on
pure black backdrop, rim-lit by its signature color.

Art style: detailed sprite art, dynamic action poses, glowing accents,
anime semi-realistic, sharp focus.

Row 1 — small fodder enemies (in motion):
  P1 Crystal Stalker — translucent ice-cyan lattice humanoid, sharp angular
     limbs, blue-white rim.
  P2 Magma Worm — orange-red molten larva worm, glowing core, ember rim.
  P3 Bio Beetle — green-armored beetle with insect mandibles, acid-green rim.

Row 2 — medium tier enemies:
  P4 Shadow Cone — sleek black tetrahedral drone with violet pulse trail,
     violet rim.
  P5 Ion Sentinel — geometric diamond energy form hovering, white rim,
     plasma arcs.
  P6 Magma Spider — multi-legged molten arachnid, lava drips, orange rim.

Row 3 — medium-large enemies:
  P7 Void Hunter — sleek dark stealth drone with curved aero shape, red
     glow vents.
  P8 Bio Cloud — translucent green poisonous cloud with insect silhouettes
     inside, acid-green rim.
  P9 Storm Wraith — purple-electric skeletal wraith, lightning crackling
     around its frame, violet-white rim.

CRITICAL: 3x3 grid. Each panel one creature, no overlap. Pure black
backgrounds. No text labels.""",

    "enemy_sheet_2": """A 1792x1024 elite enemy + mini-boss bestiary sheet for a sci-fi
defense game, 6 panels in a strict 3-column x 2-row grid (each panel
exactly 597x512 px, separated by thin dark gutters). Each panel one
creature on pure black backdrop, rim-lit by its signature color, larger
and more detailed than basic enemies.

Art style: detailed sprite art, menacing action poses, glowing accents,
anime semi-realistic, sharp focus, sense of mass and danger.

Row 1 — elites:
  P1 Gold Carapace — turtle-armored gold mecha with dome shell and
     extending lance, gold-amber rim.
  P2 Mirror Splitter — symmetric crystal entity, mid-fission with two
     halves separating, prismatic rim.
  P3 Gravity Pulse — black singularity orb with gravity lensing distortion
     around it, deep purple rim.

Row 2 — mini-bosses:
  P4 Hook Reaper — silver scythe-hooked beast with elongated curved
     blades, cold steel rim.
  P5 Mega Asteroid — massive flaming asteroid with cratered surface and
     trailing fire, orange-red rim.
  P6 Shadow Apostle — twin half-translucent figures in mirror sync,
     ghostly purple rim.

CRITICAL: 3x2 grid. Each panel one creature, no overlap. Pure black
backgrounds. No text labels.""",
}


def generate(preset: str, out_path: Path) -> None:
    if preset not in PROMPTS:
        raise SystemExit(f"unknown preset: {preset}; available: {list(PROMPTS)}")
    out_path.parent.mkdir(parents=True, exist_ok=True)

    client = OpenAI(api_key=API_KEY, base_url=BASE_URL)
    print(f"[gen] {preset} → {out_path}", flush=True)
    t0 = time.time()

    result = client.images.generate(
        model=MODEL,
        prompt=PROMPTS[preset],
        size="1792x1024",
        n=1,
    )

    item = result.data[0]
    if getattr(item, "b64_json", None):
        png = base64.b64decode(item.b64_json)
    elif getattr(item, "url", None):
        import urllib.request
        with urllib.request.urlopen(item.url) as r:
            png = r.read()
    else:
        raise SystemExit(f"no image payload in response: {item!r}")

    out_path.write_bytes(png)
    dt = time.time() - t0
    print(f"[gen] OK {len(png) // 1024} KB in {dt:.1f}s", flush=True)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__, file=sys.stderr)
        raise SystemExit(2)
    generate(sys.argv[1], Path(sys.argv[2]))
