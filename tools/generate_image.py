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

    "lia_comic": """A cinematic photorealistic vertical portrait (9:16 aspect)
of LIA, a young Brazilian female mecha pilot, for a sci-fi mobile game
hero introduction screen.

Scene: Lia stands in a dramatic hero pose on a launch platform overlooking
the Rio de Janeiro coast at golden hour. She's wearing a sleek flame-red
and orange sci-fi combat suit with minimal mecha armor plates on shoulders
and forearms. Dark wavy hair in a high ponytail whips in the wind. Her
expression is fierce and determined, one fist clenched, fire-like energy
swirling around her hand.

Behind her: a massive flame-red mecha gunship parked on the launch pad,
engines glowing orange. The sky has dramatic clouds lit by the setting sun,
with faint meteor streaks visible high above.

Photography style: cinematic movie poster composition, dramatic rim lighting
from behind (golden hour backlight), shallow depth of field on the
background mecha, sharp focus on face. Shot from slightly below (heroic
low angle). Color grading: warm orange-teal contrast. Skin texture and
fabric detail photorealistic. Lens flare from the sun behind. 8K quality.

The overall mood is "hero's call to action" — confident, powerful, warm.
NO text, NO UI elements, NO manga-style elements. Photorealistic only.""",

    "devi_comic": """A cinematic photorealistic vertical portrait (9:16 aspect)
of DEVI, a young Indian female mecha pilot, for a sci-fi mobile game
hero introduction screen.

Scene: Devi stands in a mystical hero pose inside a high-tech bio-lab
that blends ancient Ayurvedic aesthetics with futuristic technology.
She's wearing a sleek violet bio-tech combat suit with organic-curve
armor plates etched with herbal patterns on shoulders and forearms.
Deep brown hair in elaborate braids adorned with small violet crystals.
Her expression is serene yet powerful, one hand raised with swirling
violet bio-energy forming a protective shield.

Behind her: towering glass columns filled with glowing violet bioluminescent
liquid, holographic botanical diagrams floating in the air. Through a
massive window, the Mumbai skyline at twilight with violet aurora streaks
in the sky above.

Photography style: cinematic movie poster composition, dramatic rim lighting
from violet bio-glow behind, shallow depth of field on the background lab,
sharp focus on face. Shot from slightly below (heroic low angle). Color
grading: deep violet-teal contrast with warm skin tones. Skin texture and
fabric detail photorealistic. Volumetric violet light rays. 8K quality.

The overall mood is "ancient wisdom meets future tech" — calm, powerful, mystical.
NO text, NO UI elements, NO manga-style elements. Photorealistic only.""",

    "rin_comic": """A cinematic photorealistic vertical portrait (9:16 aspect)
of RIN, a young Korean female mecha sniper pilot, for a sci-fi mobile game
hero introduction screen.

Scene: Rin crouches in a calculated sniper stance on the edge of a futuristic
Seoul rooftop at night. She's wearing a sleek cobalt-blue tactical sniper
suit with slim mecha armor plates, a long-barrel rail gun resting across
her shoulder. White short bob haircut, sharp focused eyes looking through
a holographic targeting monocle. Her expression is ice-cold and precise.

Behind her: the neon-lit Seoul cityscape at night with holographic
advertisements, a massive orbital defense satellite visible in the starry
sky above. Blue energy traces from her rail gun's last shot still lingering
in the air like frozen lightning.

Photography style: cinematic movie poster composition, cold blue-white rim
lighting from the city neon below, shallow depth of field on the cityscape,
razor-sharp focus on face and weapon. Shot from slightly below (heroic low
angle). Color grading: cold cobalt-blue with stark white highlights. Skin
texture and fabric detail photorealistic. Breath visible in cold air. 8K quality.

The overall mood is "silent precision" — cold, calculated, lethal elegance.
NO text, NO UI elements, NO manga-style elements. Photorealistic only.""",

    "yue_comic": """A cinematic photorealistic vertical portrait (9:16 aspect)
of YUE, a young Chinese female mecha pilot, for a sci-fi mobile game
hero introduction screen.

Scene: Yue stands in a flowing martial arts pose in a moonlit Suzhou classical
garden transformed into a futuristic command center. She's wearing a sleek
crimson combat suit with classical crescent-moon ornamental armor plates.
Long jet-black hair flowing in the wind like silk. She holds twin luminous
moon-blades crossed before her, crimson energy pulsing along the edges.
Her expression is calm and watchful, eyes reflecting moonlight.

Behind her: ancient stone bridges and willow trees interwoven with holographic
tactical displays, a massive crescent moon hanging low in the sky casting
silver-crimson light. Cherry petals and energy particles drifting in the air.

Photography style: cinematic movie poster composition, dramatic moonlight rim
from above and behind, shallow depth of field on the garden background, sharp
focus on face and blades. Shot from slightly below (heroic low angle). Color
grading: crimson-silver moonlit contrast with porcelain skin tones. Skin
texture and fabric detail photorealistic. Volumetric moonbeam rays. 8K quality.

The overall mood is "ancient warrior grace" — serene, deadly, ethereal beauty.
NO text, NO UI elements, NO manga-style elements. Photorealistic only.""",

    "ade_comic": """A cinematic photorealistic vertical portrait (9:16 aspect)
of ADE, a young Nigerian female mecha pilot, for a sci-fi mobile game
hero introduction screen.

Scene: Ade stands in a powerful defensive stance on a futuristic Lagos
coastal fortress at sunrise. She's wearing heavy gold-trimmed mecha armor
over a tactical black suit, a massive golden shield raised in her left hand
reflecting incoming energy blasts. Glossy short black hair, fierce determined
expression, muscles taut. Golden energy radiates from her shield like a
solar flare.

Behind her: the futuristic Lagos skyline with towering gold-accented
skyscrapers, traditional Yoruba geometric patterns projected as holograms
on building facades. The sunrise casts everything in dramatic gold and amber
light. Explosions from deflected enemy attacks burst harmlessly against her
shield barrier.

Photography style: cinematic movie poster composition, dramatic golden rim
lighting from the sunrise behind, shallow depth of field on the cityscape,
sharp focus on face and shield. Shot from slightly below (heroic low angle).
Color grading: rich gold-amber warmth with deep shadow contrast. Skin texture
and armor detail photorealistic. Golden particle effects. 8K quality.

The overall mood is "immovable guardian" — powerful, proud, unbreakable.
NO text, NO UI elements, NO manga-style elements. Photorealistic only.""",

    "sakura_comic": """A cinematic photorealistic vertical portrait (9:16 aspect)
of SAKURA, a young Japanese female mecha pilot, for a sci-fi mobile game
hero introduction screen.

Scene: Sakura leaps mid-air in a dynamic action pose above a futuristic Kyoto
streetscape. She's wearing a lightweight sakura-pink scout mecha suit with
sleek aerodynamic armor plates. Twin pink ponytails streaming behind her as
she dual-wields twin needle guns crackling with electric pink energy. Her
expression is joyful yet fierce — a warrior in her element.

Behind her: traditional Kyoto temple rooftops blended with neon-tech
infrastructure, cherry blossom petals frozen mid-fall illuminated by pink
lightning bolts. The night sky above filled with stars and faint pink aurora.
Electric pink energy trails from her guns paint streaks across the scene.

Photography style: cinematic movie poster composition, dramatic pink-white
electric rim lighting, frozen action mid-frame, shallow depth of field on
the Kyoto background, razor-sharp focus on face and weapons. Shot from below
(dynamic low angle). Color grading: electric pink-magenta with cool night
blue contrast. Skin texture and mecha detail photorealistic. Cherry blossom
bokeh particles. 8K quality.

The overall mood is "lightning dancer" — fast, electric, graceful destruction.
NO text, NO UI elements, NO manga-style elements. Photorealistic only.""",

    "aria_comic": """A cinematic photorealistic vertical portrait (9:16 aspect)
of ARIA, a young French female mecha pilot, for a sci-fi mobile game
hero introduction screen.

Scene: Aria stands commanding on the stage of a futuristic Paris Opera house,
conductor-baton weapon raised high as magenta sonic energy spirals around her.
She's wearing an elegant magenta mecha suit with flowing armor plates that
resemble a concert gown's silhouette. Long silver wavy hair billowing
dramatically as sonic shockwaves pulse outward from her baton. Her expression
is passionate and commanding — an artist directing destruction.

Behind her: the grand interior of a sci-fi reimagined Opera Garnier with
holographic musical notation floating in the air, massive stained-glass
windows shattered outward by sonic force. The Parisian night sky visible
through the broken architecture, Eiffel Tower glowing magenta in the distance.

Photography style: cinematic movie poster composition, dramatic magenta-white
rim lighting from the sonic energy, shallow depth of field on the opera
background, sharp focus on face and baton weapon. Shot from slightly below
(dramatic low angle). Color grading: rich magenta-purple with gold theatre
warmth. Skin texture and flowing hair detail photorealistic. Visible sonic
wave distortion in the air. 8K quality.

The overall mood is "destructive symphony" — elegant, commanding, devastating.
NO text, NO UI elements, NO manga-style elements. Photorealistic only.""",

    "bright_comic": """A cinematic photorealistic vertical portrait (9:16 aspect)
of BRIGHT, a male commander in his early 30s, for a sci-fi mobile game
hero introduction screen.

Scene: BRIGHT descends from an orbital space station in his indigo command
mecha, arms spread in a commanding pose. He's wearing a deep indigo tactical
command suit with heavy mecha armor plates, a white-violet energy halo
flooding from his chest core. Dark short hair, chiseled jaw set with
determination, eyes glowing faint indigo. A pure white-indigo solar lance
materializes in his right hand.

Behind him: the interior of a massive orbital defense station with holographic
tactical displays showing Earth below under siege. Through the station's open
launch bay, Earth's curvature is visible with dozens of enemy ships approaching.
Seven colored energy trails (one for each pilot) streak away from the station
toward the battle below.

Photography style: cinematic movie poster composition, dramatic white-indigo
rim lighting from his energy halo, the vacuum of space visible behind, sharp
focus on face and lance weapon. Shot from slightly below (heroic descent angle).
Color grading: deep indigo-violet with stark white energy highlights against
the black of space. Skin texture and armor detail photorealistic. God-rays
from the halo. 8K quality.

The overall mood is "commander's descent" — authoritative, sacrificial, heroic.
NO text, NO UI elements, NO manga-style elements. Photorealistic only.""",

    "yin_comic": """A cinematic photorealistic vertical portrait (9:16 aspect)
of MASTER YIN (殷师傅), a Chinese male sushi chef side-character, for a sci-fi
mobile game hero introduction screen.

Scene: Master Yin stands calmly in the doorway of his futuristic izakaya
restaurant as chaos erupts in the street behind him. He's a chubby friendly
Chinese man in his mid-40s with a short black flat-top military haircut,
wearing a traditional Japanese black sushi-chef sakumue (作務衣) with white
ties at the waist. A small embroidered silver swallow bird patch on his left
chest. He holds a long gleaming sushi knife loosely in his right hand, pointed
down. His left hand is raised palm-up in a calm welcoming gesture.

His expression: warm knowing smile, eyes crinkled with gentle confidence.
Despite alien creatures swarming in the background streets, he radiates
absolute calm — like a man who has seen it all and is merely inviting the
chaos to come closer.

Behind him: a cozy izakaya interior visible through the doorway with warm
orange paper lantern glow, contrasting with the sci-fi street outside where
distant explosions and alien silhouettes rage. The juxtaposition of peaceful
warmth and external chaos.

Photography style: cinematic movie poster composition, warm golden rim
lighting from the izakaya lanterns behind, cool blue from the alien-lit
street. Sharp focus on his calm face. Shot from slightly below. Color grading:
warm amber interior vs cool blue-green exterior. Skin texture and fabric
detail photorealistic. 8K quality.

The overall mood is "eye of the storm" — warm, unshakeable, mysteriously powerful.
NO text, NO UI elements, NO manga-style elements. Photorealistic only.""",

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
