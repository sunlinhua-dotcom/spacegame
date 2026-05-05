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

    "hero_ult": """A 1792x1024 top-down sprite sheet of 8 sci-fi mecha pilot ships
in their ULTIMATE-ACTIVATED state, viewed from directly overhead
(orthographic top-down camera). 8 panels in a strict 4-column x 2-row
grid (each panel exactly 448x512 px, separated by thin dark gutters).
Each panel one mech sprite on pure black backdrop.

Same 8 mechs as the prior hero_topdown sheet, but now intensely
glowing in their signature color, weapons fully extended/charged,
energy halo visibly building around the cockpit, additional thrust
nozzles flared, cracks of bright energy bleeding through the armor
plates. Same orientation: nose UP, engine glow DOWN.

Row 1: BRIGHT (white-violet halo flooding from indigo mech),
       Sakura (electric pink corona, twin needle barrels charged),
       Rin (frigid white-blue freeze halo, rail-gun glowing),
       Yue (crimson flame-petal aura, twin moon blades flaring).

Row 2: Aria (magenta sonic ring expanding), Lia (firestorm orange
       plumes shooting from vents), Ade (gold solar flare exploding
       around dome turret), Devi (violet bio-tendrils swirling
       outward).

CRITICAL: top-down only, 4x2 grid, pure black backdrops, each mech
clearly recognizable as the same character from hero_topdown but in
peak ULT activation. No text.""",

    "enemy_alt_frames": """A 1792x1024 sprite sheet of organic enemies in alternate
animation frames for use as a 2-frame loop, viewed top-down. 12 panels
in a strict 4-column x 3-row grid (each panel exactly 448x341 px,
separated by thin dark gutters). Each panel one creature on pure
black backdrop with thin signature-color rim.

Each pair of consecutive panels (P1+P2, P3+P4, ...) shows the SAME
creature in two slightly different animation positions — limbs/wings
shifted, body undulating — so the engine can flip between them at
~6 fps for an organic motion loop.

Row 1 (4 panels = 2 creatures, 2 frames each):
  P1 Magma Worm — frame A, body curled left, segments visible.
  P2 Magma Worm — frame B, body curled right, mirrored undulation.
  P3 Magma Spider — frame A, legs spread wide.
  P4 Magma Spider — frame B, legs slightly retracted, alternate.

Row 2 (4 panels):
  P5 Bio Beetle — frame A, mandibles open, wings tucked.
  P6 Bio Beetle — frame B, mandibles closed, wings half-spread.
  P7 Storm Wraith — frame A, lightning arcs LEFT.
  P8 Storm Wraith — frame B, lightning arcs RIGHT, body shifted.

Row 3 (4 panels):
  P9 Hook Reaper — frame A, scythe hooks raised.
  P10 Hook Reaper — frame B, scythe hooks lowered, ready to strike.
  P11 Mega Asteroid — frame A, lava cracks dim.
  P12 Mega Asteroid — frame B, lava cracks bright + flame plume.

CRITICAL: 4x3 grid, pure black backdrops, top-down view. Each pair of
adjacent panels shows the SAME creature in subtly different poses for
animation. Match the visual style from prior enemy_topdown sheet.""",

    "weapons": """A 1792x1024 sprite sheet of 16 sci-fi weapon projectiles for a
top-down space shooter, viewed from directly overhead. 16 panels in a
strict 4-column x 4-row grid (each panel exactly 448x256 px, separated
by thin dark gutters). Each panel one projectile on pure black
backdrop with thin signature-color rim. Each projectile drawn pointing
UP toward the top of its panel (so the engine can rotate it at runtime).

Row 1 — Sakura, Rin, Yue, Aria primary attacks:
  P1 Sakura — pink electric needle bolt, jagged lightning trail.
  P2 Rin — cyan railgun slug, long spike with frost halo.
  P3 Yue — crimson moon-blade arc projectile.
  P4 Aria — magenta wind-blade boomerang.

Row 2 — Lia, Ade, Devi, BRIGHT primary attacks:
  P5 Lia — orange flame missile with trailing ember tail.
  P6 Ade — gold heavy-shell round with star burst around it.
  P7 Devi — violet bio-toxin orb with green smoke trail.
  P8 BRIGHT — indigo + white twin-beam shaft.

Row 3 — ULT-mode projectiles (4 example heroes, more spectacular):
  P9 Sakura ULT — full-frame pink lightning storm.
  P10 Rin ULT — triple cyan rail-laser column.
  P11 Yue ULT — crescent fan-blade barrage (3 blades nested).
  P12 Aria ULT — magenta sonic shockwave ring.

Row 4 — More ULT projectiles + alt:
  P13 Lia ULT — orange firestorm bomb with shockwave.
  P14 Ade ULT — gold solar flare explosion.
  P15 Devi ULT — violet poison cloud sphere.
  P16 BRIGHT ULT — pure white-indigo solar lance, blinding core.

CRITICAL: top-down view, every projectile points UP, 4x4 even grid,
pure black backdrops. Vivid signature colors, each easily readable
at small sprite size.""",

    "yin_master": """A 1024x1024 character splash for an ORIGINAL side-character
in a sci-fi space defense game. ONE FIGURE ONLY, centered, no panels.

Subject: 殷师傅 (Master Yin), a Chinese sushi chef in his mid-40s,
chubby friendly build, short black flat-top haircut (平头, military cut).
Square kind face, warm smile, small twinkle in the eyes. He stands
calmly in front of the viewer. Confident peaceful presence — NOT a
warrior, but the kind of bystander whose mere presence calms the
chaos around him.

Outfit: traditional Japanese black sushi-chef sakumue (作務衣) —
black short-sleeve cross-front jacket with white cloth ties at the
waist, wide cuffs, short hem. A small embroidered swallow bird patch
(燕 / sparrow / robin-style songbird) sits over his LEFT CHEST,
visible and crisp. Black wide cropped trousers, traditional dark
zōri sandals.

Pose: standing relaxed, both hands free. RIGHT hand holding a long
sushi knife loosely pointed downward (resting, not threatening).
LEFT hand raised palm-up at chest height in a calm welcoming
"please come" gesture — this is his "taunt" stance: he's drawing
attention with steady ease, not aggression.

Background: deep dark navy gradient with soft warm orange paper-
lantern glow behind him (suggests izakaya counter), no specific
furniture, no text. Soft golden rim light from behind.

Style: Korean MMORPG splash art, NIKKE / Lost Ark aesthetic. Anime
semi-realistic, painterly linework, dramatic studio lighting,
sharp focus on face. Match the visual language of the existing
hero_cast sheet but distinct as a character: warm earth tones
(black uniform, amber lantern, soft skin tone) rather than the
mecha pilots' neon palette.

CRITICAL: full body visible head-to-feet, NO weapons aimed at the
viewer, NO mecha armor, NO gun. He is a CHEF, not a pilot.
Pure clean backdrop, no UI elements, no text, no panel borders.""",

    "lia_comic": """A vertical 9:16 four-panel comic strip (4 panels stacked
top to bottom, separated by thin white gutters). Pixar / Disney 3D animation
style — expressive round faces, big emotive eyes, warm cinematic lighting,
soft subsurface skin, rich color palette. Every panel the SAME character:
LIA, a young Brazilian woman, dark wavy hair in a high ponytail, tan skin,
bright amber eyes, athletic build.

Panel 1 (top): Lia at a lively Rio street food cart at sunset, wearing a
red tank top and apron, flipping a skillet with a grin. Copacabana beach
and Sugarloaf Mountain in warm golden light behind her. Speech bubble:
"今天的招牌菜——火焰虾！"

Panel 2: Lia looks up, eyes wide — alien ships descend through the clouds
above Rio, casting green searchlights. Civilians run. Her skillet drops.
Speech bubble: "什么……？！"

Panel 3: Lia in a sleek flame-red and orange mecha suit, fist clenched,
fire energy swirling around her arm. She's inside a launch bay, determined
expression. Speech bubble: "既然你们要来，就别怪我上菜了。"

Panel 4 (bottom): Lia blasting off from the launch pad trailing orange
fire, Rio's coast below, flying toward the alien fleet. Heroic low-angle
shot. Caption box: "Lia · 火焰突击"

Art: Pixar 3D animation, NOT photorealistic, NOT anime. Rounded stylized
proportions. Cinematic lighting per panel. Same character across all four.
No real photograph look. 1024x1792 vertical.""",

    "devi_comic": """A vertical 9:16 four-panel comic strip (4 panels stacked
top to bottom, separated by thin white gutters). Pixar / Disney 3D animation
style — expressive round faces, big emotive eyes, warm cinematic lighting,
soft subsurface skin. Every panel the SAME character: DEVI, a young Indian
woman, deep brown hair in elaborate braids, warm brown skin, gentle violet
eyes, graceful build.

Panel 1 (top): Devi in a sunlit Mumbai herbal shop surrounded by colorful
glass bottles, grinding herbs with a mortar. Marigold garlands hang from
the ceiling. Peaceful smile. Speech bubble: "毒与药，只在一念之间。"

Panel 2: A violet holographic alert appears over her counter — alien bio-
toxins detected. She examines a glowing sample with widened eyes, fascinated
not scared. Speech bubble: "这种毒素结构……我能中和它。"

Panel 3: Devi activating violet bio-mecha armor that grows organically
around her like living vines. Herbal-tech etchings glow along the plates.
She raises one hand forming a swirling violet bio-shield. Speech bubble:
"以毒攻毒，这是老本行了。"

Panel 4 (bottom): Devi on the battlefield, violet bio-shield dome protecting
allies behind her, toxic mist dissolving enemy projectiles. Serene warrior
expression. Caption box: "Devi · 净化之盾"

Art: Pixar 3D animation, NOT photorealistic, NOT anime. Rounded stylized
proportions. Cinematic lighting per panel. Same character across all four.
1024x1792 vertical.""",

    "rin_comic": """A vertical 9:16 four-panel comic strip (4 panels stacked
top to bottom, separated by thin white gutters). Pixar / Disney 3D animation
style — expressive round faces, big emotive eyes, warm cinematic lighting,
soft subsurface skin. Every panel the SAME character: RIN, a young Korean
woman, white short bob haircut, pale skin, sharp cobalt-blue eyes, slim
athletic build.

Panel 1 (top): Rin at an indoor shooting range, eye pressed to a rifle
scope, expression utterly focused. A row of bullseye targets behind her
all hit dead center. Trophy shelf visible. Speech bubble: "三千米外，我也不会失手。"

Panel 2: Rin lowers her rifle, staring at her phone — a holographic alert
shows alien ships entering orbit above Seoul. Neon city lights reflect in
her eyes. Cool, unshaken expression. Speech bubble: "终于来了个值得瞄准的目标。"

Panel 3: Rin in cobalt-blue sniper mecha, crouched on a Seoul rooftop,
extending a long-barrel rail gun. Night city below, breath visible in cold
air. Holographic targeting monocle over one eye glowing blue. Speech bubble:
"一发，一命中。"

Panel 4 (bottom): A thin blue rail-gun beam piercing through three alien
ships in a line. Rin in silhouette against the explosion glow, cool posture.
Caption box: "Rin · 精准狙击"

Art: Pixar 3D animation, NOT photorealistic, NOT anime. Rounded stylized
proportions. Cinematic lighting per panel. Same character across all four.
1024x1792 vertical.""",

    "yue_comic": """A vertical 9:16 four-panel comic strip (4 panels stacked
top to bottom, separated by thin white gutters). Pixar / Disney 3D animation
style — expressive round faces, big emotive eyes, warm cinematic lighting,
soft subsurface skin. Every panel the SAME character: YUE, a young Chinese
woman, long jet-black hair, fair porcelain skin, calm crimson-tinted eyes,
graceful martial-artist build.

Panel 1 (top): Yue practicing elegant sword forms alone in a moonlit Suzhou
garden — stone bridge, willow trees, lotus pond. White training robes flowing.
Crescent moon above. Peaceful focused expression. Speech bubble:
"剑随月走，心随剑静。"

Panel 2: The pond surface ripples — a crimson holographic alert rises from
the water showing alien invasion data. Yue opens her eyes, still calm but
resolute. Willow leaves scatter. Speech bubble: "月有阴晴……今夜，该圆了。"

Panel 3: Yue in crimson mecha with crescent ornaments, twin luminous moon-
blades crossed before her chest. Energy pulses along the blade edges. Garden
behind her now overlaid with holographic tactical data. Speech bubble:
"静观破绽，一击而定。"

Panel 4 (bottom): Yue mid-slash, twin moon-blades arcing in a crescent
pattern, slicing through alien drones. Crimson energy trails paint a
beautiful moon shape. Caption box: "Yue · 月华双刃"

Art: Pixar 3D animation, NOT photorealistic, NOT anime. Rounded stylized
proportions. Cinematic lighting per panel. Same character across all four.
1024x1792 vertical.""",

    "ade_comic": """A vertical 9:16 four-panel comic strip (4 panels stacked
top to bottom, separated by thin white gutters). Pixar / Disney 3D animation
style — expressive round faces, big emotive eyes, warm cinematic lighting,
soft subsurface skin. Every panel the SAME character: ADE, a young Nigerian
woman, glossy short black hair, dark brown skin, warm golden-brown eyes,
strong athletic build.

Panel 1 (top): Ade at a vibrant Lagos outdoor festival, pounding a large
traditional drum with powerful arms, crowd dancing joyfully behind her.
Colorful Ankara fabrics and string lights. Huge grin. Speech bubble:
"鼓声一起，大地都在跳舞！"

Panel 2: The drumbeat sends out a visible golden shockwave — it deflects
an alien energy bolt that was about to hit a child. Ade stands protectively,
eyes fierce. Crowd gasps. Speech bubble: "谁都别想碰我的人。"

Panel 3: Ade in heavy gold-trimmed mecha armor, raising a massive golden
shield. The shield surface glows with Yoruba geometric patterns. Sunrise
light behind her. Determined warrior expression. Speech bubble:
"节拍就是力量，防线由我来守！"

Panel 4 (bottom): Ade leading a charge, golden shield deflecting a barrage
of enemy fire, allies advancing safely behind her shield wall. Golden
energy radiates outward. Caption box: "Ade · 黄金壁垒"

Art: Pixar 3D animation, NOT photorealistic, NOT anime. Rounded stylized
proportions. Cinematic lighting per panel. Same character across all four.
1024x1792 vertical.""",

    "sakura_comic": """A vertical 9:16 four-panel comic strip (4 panels stacked
top to bottom, separated by thin white gutters). Pixar / Disney 3D animation
style — expressive round faces, big emotive eyes, warm cinematic lighting,
soft subsurface skin. Every panel the SAME character: SAKURA, a young Japanese
woman, twin pink ponytails, fair skin, sparkling pink eyes, petite energetic build.

Panel 1 (top): Sakura strolling happily under cherry blossom trees on a
Kyoto canal street, wearing a cute pink hoodie, catching petals in her palm.
Traditional wooden buildings, soft pink light. Cheerful smile. Speech bubble:
"樱花虽柔，落地有声哦～"

Panel 2: A pink lightning bolt strikes a cherry tree beside her — an alien
scout drone crashes nearby. Sakura's eyes go wide, ponytails stand up with
static electricity. Petals scatter. Speech bubble: "哇！好大的虫子！"

Panel 3: Sakura in pink mecha scout suit, dual-wielding twin needle guns,
electric pink corona crackling around her. Dynamic crouching pose, playful
determined grin. Cherry blossoms and lightning merge around her. Speech bubble:
"樱雷起舞！让你们见识见识！"

Panel 4 (bottom): Sakura mid-leap above Kyoto rooftops, both guns blazing
pink energy shots into a swarm of alien drones, cherry blossom petals and
lightning trails swirling. Caption box: "Sakura · 樱雷闪击"

Art: Pixar 3D animation, NOT photorealistic, NOT anime. Rounded stylized
proportions. Cinematic lighting per panel. Same character across all four.
1024x1792 vertical.""",

    "aria_comic": """A vertical 9:16 four-panel comic strip (4 panels stacked
top to bottom, separated by thin white gutters). Pixar / Disney 3D animation
style — expressive round faces, big emotive eyes, warm cinematic lighting,
soft subsurface skin. Every panel the SAME character: ARIA, a young French
woman, long silver wavy hair, fair skin, elegant magenta eyes, graceful build.

Panel 1 (top): Aria on the grand stage of the Paris Opera, conducting an
orchestra in a flowing magenta gown. Velvet curtains, golden chandeliers,
passionate expression with eyes closed. Speech bubble: "音乐，是宇宙的语言。"

Panel 2: The orchestra hall shakes — ceiling cracks, alien tendrils punch
through the roof. Audience flees. Aria stands still, opens her eyes, grips
her conductor's baton tighter. Speech bubble: "这段乐章……该换个调了。"

Panel 3: Aria in elegant magenta mecha, baton transformed into a sonic-blade
weapon. Magenta sonic rings pulse outward from the baton. Silver hair flowing
in the shockwave. Commanding stance. Speech bubble: "听好——这是你们的终曲。"

Panel 4 (bottom): Aria atop the Opera rooftop, massive magenta sonic wave
expanding outward shattering alien ships. Eiffel Tower visible in background.
Dramatic wind-swept pose. Caption box: "Aria · 终章共鸣"

Art: Pixar 3D animation, NOT photorealistic, NOT anime. Rounded stylized
proportions. Cinematic lighting per panel. Same character across all four.
1024x1792 vertical.""",

    "bright_comic": """A vertical 9:16 four-panel comic strip (4 panels stacked
top to bottom, separated by thin white gutters). Pixar / Disney 3D animation
style — expressive round faces, big emotive eyes, warm cinematic lighting,
soft subsurface skin. Every panel the SAME character: BRIGHT, a man in his
early 30s, dark short hair, determined dark eyes, athletic commander build.

Panel 1 (top): BRIGHT at a holographic command desk in an orbital station,
monitoring seven screens showing his pilot team in action. Headset on, deep
indigo lighting. Focused, jaw clenched. Speech bubble:
"她们已经撑到极限了……"

Panel 2: Alarm lights flash red — Lia's mecha goes down on screen. BRIGHT
stands up abruptly, fists on the desk. Earth visible through the station
window, under siege. Speech bubble: "够了。这次我亲自上。"

Panel 3: BRIGHT descending from the station in indigo command mecha, white-
violet energy halo flooding from his chest core. Solar lance materializing
in his right hand. Seven colored energy trails from his team below. Speech
bubble: "BRIGHT，协议总指挥——出击！"

Panel 4 (bottom): BRIGHT at the front of an eight-pilot V-formation,
leading the charge toward a massive alien mothership. All eight mecha
trailing colored energy. Heroic composition. Caption box: "BRIGHT · 协议指挥"

Art: Pixar 3D animation, NOT photorealistic, NOT anime. Rounded stylized
proportions. Cinematic lighting per panel. Same character across all four.
1024x1792 vertical.""",

    "yin_comic": """A vertical 9:16 four-panel comic strip (4 panels stacked
top to bottom, separated by thin white gutters). Pixar / Disney 3D animation
style — expressive round faces, big emotive eyes, warm cinematic lighting,
soft subsurface skin. Every panel the SAME character: MASTER YIN (殷师傅),
a chubby friendly Chinese man in his mid-40s, short black flat-top military
haircut, square kind face, wearing black sushi-chef sakumue (作務衣) with
a small embroidered swallow bird patch on left chest.

Panel 1 (top): Yin behind an izakaya counter, meticulously slicing sashimi
with a long knife, warm orange paper lantern glow, peaceful smile. A row
of delighted customers. Speech bubble: "二十年前在筑地学的刀功，切什么都行。"

Panel 2: The restaurant wall EXPLODES — an alien creature bursts through!
Customers scream and flee. Yin doesn't flinch, still holding his knife,
eyebrow slightly raised. Speech bubble: "哦？加菜了？"

Panel 3: Yin calmly steps toward the alien, knife held in a precise chef's
stance. A golden slow-motion aura radiates from him — everything around him
visibly decelerates. The alien's attack freezes mid-air. Speech bubble:
"来吧，尝尝我的嘲讽料理。全场——减速。"

Panel 4 (bottom): Yin standing unbothered amid a frozen battlefield, aliens
slowed to a crawl around him, while mecha pilots blast past at full speed.
He adjusts his apron. Caption box: "殷师傅 · 嘲讽减速"

Art: Pixar 3D animation, NOT photorealistic, NOT anime. Rounded stylized
proportions. Warm amber lighting. Same character across all four.
1024x1792 vertical.""",

    "yin_sheet": """A 1792x1024 character sheet of 殷师傅 (Master Yin), an
ORIGINAL side-character for a sci-fi space defense game. ONE
character across FOUR panels in a strict 4-column x 1-row grid
(each panel exactly 448x1024 px, separated by thin dark gutters).
SAME PERSON in every panel — must be recognizable as the same
individual across all four.

Subject: Chinese male sushi chef, mid-40s, chubby friendly build,
short black flat-top haircut (平头, military cut). Square kind face,
warm smile. Wearing traditional Japanese black sushi-chef sakumue
(作務衣) — black short-sleeve cross-front jacket with white cloth
ties at the waist, wide cuffs. A small embroidered swallow bird
patch (silver/white songbird) sits over his LEFT CHEST, visible
and crisp in every panel. Black wide cropped trousers, dark
zōri sandals.

Panel 1 (LEFT) — close-up head & shoulders PORTRAIT, 3/4 angle,
warm gentle smile, eyes slightly crinkled, looking off-camera
right. Painterly Korean MMO splash style. Tight crop on the face,
head fills the panel.

Panel 2 — FULL BODY taunt stance, facing the viewer head-on. Right
hand holding a long sushi knife loosely pointed downward (resting,
not threatening). Left hand raised palm-up at chest height in a
calm "please come" gesture. Confident peaceful presence — the
defining hero pose.

Panel 3 — FULL BODY action moment, side-on profile facing right.
Knife held forward in a precise slicing motion, body slightly
crouched, wind catching the loose sleeves of his jacket. Still
calm-faced; this is a chef's controlled action, not anger.

Panel 4 (RIGHT) — CHIBI / SD-style icon shot, the same character
rendered as a small cute mascot. Round body proportions (head ~ 1/2
total height), big friendly eyes, holding the knife playfully.
Suitable for a small HUD badge. Same outfit + bird patch.

Backdrop for ALL four panels: deep dark navy gradient with soft
warm orange paper-lantern glow behind him (suggests izakaya
counter), no specific furniture, no text. Soft golden rim light.
Match the warm earth-tone palette (black uniform, amber lantern,
soft skin tone) — distinct from the neon mecha pilots.

Style: Korean MMORPG splash art, NIKKE / Lost Ark aesthetic. Anime
semi-realistic, painterly linework, dramatic studio lighting,
sharp focus on the face. Same character across all four panels.

CRITICAL: 4-column 1-row grid, panels evenly sized, NO panel
labels, NO text. Each panel is independently sliceable. Do NOT
merge panels. The bird-patch on the chest is consistent across
panels 1-3 (clearly visible). NO mecha armor, NO gun.""",

    "prologue_1": """A vertical 9:16 four-panel comic strip (4 panels stacked
top to bottom, separated by thin white gutters). Pixar / Disney 3D animation
style — expressive characters, big emotive eyes, warm cinematic lighting,
rich colors. NO specific recurring character — this is a world-building page.

Panel 1 (top): A beautiful view of Earth from low orbit — blue oceans,
green continents, white clouds, the sun rising behind the planet. Peaceful,
idyllic. A few small space stations orbit happily. Caption box:
"2089年，地球一切如常。"

Panel 2: Suddenly — a massive dark rift tears open in space above Earth.
Thousands of alien ships pour through, green-glowing insectoid swarm.
Earth's orbital stations flash red alarms. Caption box:
"直到那道裂缝撕开了天空。"

Panel 3: Cities on Earth in chaos — alien creatures descending, people
running, military jets scrambling but overwhelmed. Explosions, searchlights.
A child hugs a teddy bear looking up in fear. Caption box:
"人类的军队……根本不够。"

Panel 4 (bottom): A dark command bunker, a holographic display showing
"应援协议 · CHEER PROTOCOL" in glowing blue letters. A shadowy commander's
hand reaches for the ACTIVATE button. Caption box:
"除非……启动那个计划。"

Art: Pixar 3D animation, cinematic dramatic lighting, emotional storytelling.
NOT photorealistic. 1024x1792 vertical.""",

    "prologue_2": """A vertical 9:16 four-panel comic strip (4 panels stacked
top to bottom, separated by thin white gutters). Pixar / Disney 3D animation
style — expressive characters, big emotive eyes, warm cinematic lighting.

Panel 1 (top): A holographic world map in a command center, seven locations
pulsing with colored dots — Tokyo (pink), Seoul (blue), Suzhou (red),
Paris (magenta), Rio (orange), Lagos (gold), Mumbai (violet). Each dot
connected by lines to a central orbital station. Caption box:
"应援协议：在全球召集七名特殊驾驶员。"

Panel 2: Split-screen showing 4 women receiving holographic recruit messages
in their daily lives — a chef at a food cart, a sniper at a range, a
conductor on stage, a herbalist in a shop. All look surprised then determined.
Caption box: "她们来自不同的国家，不同的人生。"

Panel 3: Seven mecha suits standing in a row inside a launch bay, each
glowing in its pilot's signature color (pink, blue, red, magenta, orange,
gold, violet). Dramatic upward angle, lights powering on one by one.
Caption box: "但她们有一个共同的使命——"

Panel 4 (bottom): All seven pilots walking toward camera in hero formation,
helmets under arms, determined expressions. Earth visible through the
launch bay window behind them, under alien siege. Bold caption:
"守护地球。"

Art: Pixar 3D animation, cinematic dramatic lighting, emotional storytelling.
NOT photorealistic. 1024x1792 vertical.""",
}


# Per-preset image size override. Sheet presets stay at 1792x1024;
# single-character portraits are square 1024x1024.
SIZES = {
    "yin_master": "1024x1024",
    "yin_comic": "1024x1792",
    "lia_comic": "1024x1792",
    "devi_comic": "1024x1792",
    "rin_comic": "1024x1792",
    "yue_comic": "1024x1792",
    "ade_comic": "1024x1792",
    "sakura_comic": "1024x1792",
    "aria_comic": "1024x1792",
    "bright_comic": "1024x1792",
    "prologue_1": "1024x1792",
    "prologue_2": "1024x1792",
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
        size=SIZES.get(preset, "1792x1024"),
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
