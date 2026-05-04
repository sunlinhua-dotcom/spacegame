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

    "hero_topdown": """A 1792x1024 top-down sprite sheet of 8 sci-fi mecha pilot ships,
viewed from directly overhead (orthographic top-down camera, NOT 3/4
perspective). 8 panels in a strict 4-column x 2-row grid (each panel
exactly 448x512 px, separated by thin dark gutters). Each panel one
mech sprite on pure black backdrop with thin colored rim light.

Each mech is a sleek tactical sci-fi gunship facing UP (nose pointing
toward the top edge of its panel). Engine thrust glow trailing DOWN
toward the bottom edge. Wings spread, weapons mounted on hardpoints.
Cockpit canopy visible as a small bright detail near the nose. Each
mech has a unique silhouette and signature color. Ready to be used as
a sprite that the engine rotates to face any direction.

Art style: clean game-ready sprite, slight cel-shaded shading,
high-contrast color, no perspective distortion, no character figure
visible (mech only). Equal lighting across the panel, no harsh
shadows on the floor.

Row 1 (4 panels):
  P1 BRIGHT-mech — flagship interceptor, indigo + white plates,
     dual cannons, signature halo emblem. Centerpiece.
  P2 Sakura-mech — pink-rimmed lightweight scout, thin profile,
     cherry blossom motif, twin needle barrels.
  P3 Rin-mech — cobalt-blue sniper craft, long-barrel rail gun
     extending forward, slim airframe, cold white rim.
  P4 Yue-mech — crimson classical mech, crescent-moon wing
     ornaments, twin blades alongside the fuselage.

Row 2 (4 panels):
  P5 Aria-mech — magenta elegant interceptor, swept wings,
     conductor-baton energy projector forward.
  P6 Lia-mech — emerald-orange firestorm craft, wide flame-vent
     plates, bulky look, hot orange engine.
  P7 Ade-mech — gold heavy-armor cruiser, dome turret on top,
     deflector plates extended.
  P8 Devi-mech — violet biotech craft, organic-curve wings, faint
     herbal-tech etching pattern on hull.

CRITICAL: every mech faces UP. NO 3/4 perspective. NO pilot figure
visible. 4x2 grid, even cells, pure black backdrops, thin rim light
in each mech's signature color. No text labels.""",

    "enemy_topdown": """A 1792x1024 top-down sprite sheet of 15 sci-fi alien creatures,
viewed from directly overhead (orthographic top-down camera). 15
panels in a strict 5-column x 3-row grid (each panel exactly
358x341 px, separated by thin dark gutters). Each panel one creature
on pure black backdrop with thin colored rim light.

Every creature drawn as if approaching from the top of its panel —
nose / leading edge pointing DOWN (creatures dive toward the bottom
to attack the player's planet). Wings / appendages spread for
recognition. Each silhouette distinct.

Art style: clean game-ready sprite, slight cel-shaded shading,
high-contrast color, no perspective distortion, even lighting,
strong rim accent in signature color. Suitable as a 64-128px
gameplay sprite after downscale.

Row 1 — fodder (5 panels):
  P1 Crystal Stalker — ice-cyan crystalline starfish humanoid from
     above, sharp limbs splayed, blue rim.
  P2 Magma Worm — orange-red molten centipede curling, ember rim.
  P3 Bio Beetle — green-shelled beetle with mandibles forward,
     acid-green rim.
  P4 Shadow Cone — black tetrahedral drone with violet pulse trail
     behind, violet rim.
  P5 Ion Sentinel — diamond-shape energy form with concentric arc
     rings, white rim.

Row 2 — mid (5 panels):
  P6 Magma Spider — multi-legged orange arachnid splayed, lava rim.
  P7 Void Hunter — sleek dark stealth drone, swept wings spread,
     red glow vents on rear, dark rim.
  P8 Bio Cloud — translucent green vapor with insect silhouettes
     inside, acid-green soft glow.
  P9 Storm Wraith — purple skeletal energy spider, lightning arcs
     around it, violet rim.
  P10 Gold Carapace — gold turtle-mech with spike lance forward,
     gold-amber rim.

Row 3 — elite + mini-boss (5 panels):
  P11 Mirror Splitter — twin symmetric crystal lobes, prismatic rim.
  P12 Gravity Pulse — black orb with concentric gravity-warp rings,
     deep purple rim.
  P13 Hook Reaper — silver scythe-hooked monster with curved blades,
     cold steel rim.
  P14 Mega Asteroid — flaming asteroid round shape, lava streaks,
     orange-red rim.
  P15 Shadow Apostle — twin ghostly figures in mirror, ghostly
     violet rim.

CRITICAL: every creature faces DOWN. Top-down view, NOT 3/4. 5x3
grid, even cells, pure black backdrops. No text labels.""",
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
