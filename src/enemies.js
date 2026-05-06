/* ═══════════════════════════════════════════════════════════════
   Enemy catalog + movement patterns + spawn director
   ─────────────────────────────────────────────────────────────────
   15 distinct enemy archetypes. Each declares its sprite path, base
   stats, and a `move(e, dt, ctx)` function that mutates e.x / e.y /
   e.facing. ctx provides earth center + helpers (rand, etc).

   The spawn director (SpawnDirector) picks enemies per stage / wave
   from a weighted bag — the bag changes by stage so early stages
   feature only fodder, later stages mix in mid + elite + mini-boss.
   Wave-by-wave pressure also ramps within each stage.

   game-three.js owns the actual mesh creation and life-cycle; this
   module is pure data + behavior, no Three.js / DOM imports, so it
   can be reasoned about and tested independently.
   ═══════════════════════════════════════════════════════════════ */

const TAU = Math.PI * 2;
const rand = (min, max) => min + Math.random() * (max - min);

/* ─────────────── Movement primitives ─────────────── */

// Approach Earth in a straight line at the enemy's `speed`.
function moveStraight(e, dt, ctx) {
  const dx = ctx.cx - e.x;
  const dy = ctx.cy - e.y;
  const d = Math.hypot(dx, dy) || 1;
  e.x += (dx / d) * e.speed * dt;
  e.y += (dy / d) * e.speed * dt;
  e.facing = Math.atan2(dy, dx);
}

// Sine-wave horizontal across the approach axis, accelerating near Earth.
function moveSineWeave(e, dt, ctx) {
  e.t = (e.t || 0) + dt;
  const dx = ctx.cx - e.x;
  const dy = ctx.cy - e.y;
  const d = Math.hypot(dx, dy) || 1;
  const r = d / e.spawnRadius;
  const accel = 1 + (1 - Math.min(1, r)) * 1.4; // 1× far, ~2.4× near
  const fwdAng = Math.atan2(dy, dx);
  const wobble = Math.sin(e.t * (e.wobbleHz || 4)) * (e.wobbleMag || 80);
  e.x += Math.cos(fwdAng) * e.speed * accel * dt + Math.cos(fwdAng + Math.PI / 2) * wobble * dt;
  e.y += Math.sin(fwdAng) * e.speed * accel * dt + Math.sin(fwdAng + Math.PI / 2) * wobble * dt;
  e.facing = fwdAng;
}

// Slow inward spiral — orbits Earth at decreasing radius.
function moveInwardSpiral(e, dt, ctx) {
  if (e.theta == null) {
    const dx = e.x - ctx.cx, dy = e.y - ctx.cy;
    e.theta = Math.atan2(dy, dx);
    e.r = Math.hypot(dx, dy);
  }
  const angVel = e.angVel || 0.6;
  const radialIn = (e.radialIn != null ? e.radialIn : e.speed * 0.55);
  e.theta += angVel * dt;
  e.r -= radialIn * dt;
  if (e.r < 30) e.r = 30;
  e.x = ctx.cx + Math.cos(e.theta) * e.r;
  e.y = ctx.cy + Math.sin(e.theta) * e.r;
  e.facing = Math.atan2(ctx.cy - e.y, ctx.cx - e.x);
}

// Outward-then-inward spiral (taunting orbit, then dive).
function moveTauntSpiral(e, dt, ctx) {
  if (e.theta == null) {
    const dx = e.x - ctx.cx, dy = e.y - ctx.cy;
    e.theta = Math.atan2(dy, dx);
    e.r = Math.hypot(dx, dy);
    e.phase = 0;
  }
  e.t = (e.t || 0) + dt;
  const phase1Dur = 1.6;
  if (e.t < phase1Dur) {
    e.theta += 0.9 * dt;
    e.r += 35 * dt; // outward
  } else {
    e.theta += 1.2 * dt;
    e.r -= e.speed * 0.9 * dt; // inward attack
  }
  e.x = ctx.cx + Math.cos(e.theta) * e.r;
  e.y = ctx.cy + Math.sin(e.theta) * e.r;
  e.facing = Math.atan2(ctx.cy - e.y, ctx.cx - e.x);
}

// Bezier dive — curve in from edge corner, then straighten toward Earth.
function moveBezierDive(e, dt, ctx) {
  e.t = (e.t || 0) + dt;
  const T = Math.min(1, e.t / 1.4);
  if (e.bzStart == null) {
    e.bzStart = { x: e.x, y: e.y };
    // Mid control point ~70% of the way to the side, perpendicular to approach
    const dx = ctx.cx - e.x, dy = ctx.cy - e.y;
    const px = -dy, py = dx;
    const pn = Math.hypot(px, py) || 1;
    const sign = Math.random() < 0.5 ? 1 : -1;
    e.bzCtrl = {
      x: e.x + dx * 0.5 + (px / pn) * 200 * sign,
      y: e.y + dy * 0.5 + (py / pn) * 200 * sign,
    };
  }
  const px0 = e.bzStart.x, py0 = e.bzStart.y;
  const cx = e.bzCtrl.x, cy = e.bzCtrl.y;
  const fx = ctx.cx, fy = ctx.cy;
  const u = 1 - T;
  const nx = u * u * px0 + 2 * u * T * cx + T * T * fx;
  const ny = u * u * py0 + 2 * u * T * cy + T * T * fy;
  // Tangent for facing
  const tx = 2 * u * (cx - px0) + 2 * T * (fx - cx);
  const ty = 2 * u * (cy - py0) + 2 * T * (fy - cy);
  e.x = nx;
  e.y = ny;
  e.facing = Math.atan2(ty, tx);
  // After T=1, fall back to straight-line so it actually hits.
  if (T >= 1) e.move = moveStraight;
}

// Hover at a fixed orbital radius and slowly drift around — no collision pressure.
function moveOrbitHover(e, dt, ctx) {
  if (e.theta == null) {
    const dx = e.x - ctx.cx, dy = e.y - ctx.cy;
    e.theta = Math.atan2(dy, dx);
    e.r = Math.hypot(dx, dy);
    e.targetR = e.targetR ?? 240;
  }
  e.theta += (e.angVel || 0.4) * dt;
  e.r += (e.targetR - e.r) * 0.6 * dt;
  e.x = ctx.cx + Math.cos(e.theta) * e.r;
  e.y = ctx.cy + Math.sin(e.theta) * e.r;
  e.facing = Math.atan2(ctx.cy - e.y, ctx.cx - e.x);
}

// Boids-style flocking toward Earth — applied to Bio Beetle / Bio Cloud groups.
function moveFlock(e, dt, ctx) {
  const dx = ctx.cx - e.x, dy = ctx.cy - e.y;
  const d = Math.hypot(dx, dy) || 1;
  let ax = (dx / d) * e.speed;
  let ay = (dy / d) * e.speed;
  if (e.flockNeighbors) {
    let cohX = 0, cohY = 0, sepX = 0, sepY = 0, n = 0;
    for (const m of e.flockNeighbors()) {
      if (m === e) continue;
      const ddx = m.x - e.x, ddy = m.y - e.y;
      const dd = Math.hypot(ddx, ddy) || 1;
      cohX += m.x;
      cohY += m.y;
      if (dd < 36) { sepX -= ddx / dd; sepY -= ddy / dd; }
      n++;
    }
    if (n) {
      cohX = cohX / n - e.x;
      cohY = cohY / n - e.y;
      ax += cohX * 0.25 + sepX * 80;
      ay += cohY * 0.25 + sepY * 80;
    }
  }
  const an = Math.hypot(ax, ay) || 1;
  e.x += (ax / an) * e.speed * dt;
  e.y += (ay / an) * e.speed * dt;
  e.facing = Math.atan2(ay, ax);
}

// Blink — sit still then teleport to a new edge, repeat.
function moveBlink(e, dt, ctx) {
  e.t = (e.t || 0) + dt;
  e.blinkCool = (e.blinkCool || 1.6) - dt;
  if (e.blinkCool <= 0) {
    const ang = rand(0, TAU);
    const r = (ctx.spawnRadius || 460) * 0.92;
    e.x = ctx.cx + Math.cos(ang) * r;
    e.y = ctx.cy + Math.sin(ang) * r;
    e.blinkCool = rand(1.4, 2.6);
  }
  // Slow drift toward Earth between blinks.
  const dx = ctx.cx - e.x, dy = ctx.cy - e.y;
  const d = Math.hypot(dx, dy) || 1;
  e.x += (dx / d) * e.speed * 0.4 * dt;
  e.y += (dy / d) * e.speed * 0.4 * dt;
  e.facing = Math.atan2(dy, dx);
}

// Charge then dash — pause while a "tell" warning plays, then accelerate.
function moveChargeDash(e, dt, ctx) {
  e.t = (e.t || 0) + dt;
  const chargeFor = e.chargeFor || 1.4;
  if (e.t < chargeFor) {
    // tiny drift + facing the player
    const dx = ctx.cx - e.x, dy = ctx.cy - e.y;
    e.facing = Math.atan2(dy, dx);
    e.x += (dx / Math.hypot(dx, dy)) * e.speed * 0.1 * dt;
    e.y += (dy / Math.hypot(dx, dy)) * e.speed * 0.1 * dt;
  } else {
    moveStraight(e, dt, { ...ctx });
    // dash speed
    const boost = 2.4;
    e.x += Math.cos(e.facing) * e.speed * boost * dt;
    e.y += Math.sin(e.facing) * e.speed * boost * dt;
  }
}

// Reflect — bounces incoming projectiles. Movement is gentle drift.
function moveReflect(e, dt, ctx) {
  e.t = (e.t || 0) + dt;
  const dx = ctx.cx - e.x, dy = ctx.cy - e.y;
  const d = Math.hypot(dx, dy) || 1;
  const wob = Math.sin(e.t * 1.4) * 0.4;
  e.x += (dx / d) * e.speed * (0.45 + wob * 0.2) * dt;
  e.y += (dy / d) * e.speed * (0.45 + wob * 0.2) * dt;
  e.facing = Math.atan2(dy, dx);
}

// Long horizontal sweep — comes from one side, swings across.
function moveSweep(e, dt, ctx) {
  if (e.sweepDir == null) e.sweepDir = e.x < ctx.cx ? 1 : -1;
  e.t = (e.t || 0) + dt;
  e.x += e.sweepDir * e.speed * dt;
  // Slow drift toward Earth as it sweeps.
  e.y += (ctx.cy - e.y) * 0.18 * dt;
  e.facing = Math.atan2(ctx.cy - e.y, e.sweepDir);
}

// Mirror twins — Shadow Apostle: spawns alongside a sibling, mirrored across center.
function moveMirror(e, dt, ctx) {
  moveStraight(e, dt, ctx);
  if (e.twin && e.twin.hp > 0) {
    // Twin always sits opposite Earth — this gives a "two-front" feel.
    e.twin.x = 2 * ctx.cx - e.x;
    e.twin.y = 2 * ctx.cy - e.y;
    e.twin.facing = e.facing + Math.PI;
  }
}

/* ─────────────── Catalog ─────────────── */

export const ENEMY_TYPES = {
  // ── Fodder (tier 0) ──────────────────────────────────────────────
  "crystal-stalker": {
    sprite: "td-crystal-stalker", spriteUlt: null,
    tier: 0, hp: 5, speed: 240, dmg: 12, score: 1, size: 38,
    move: moveSineWeave, wobbleHz: 6, wobbleMag: 90,
    rim: 0x7fd9ff,
  },
  "magma-worm": {
    sprite: "td-magma-worm", spriteAlt: "td-magma-worm-b",
    tier: 0, hp: 8, speed: 150, dmg: 14, score: 1, size: 44,
    move: moveInwardSpiral, angVel: 0.7, frameMs: 180,
    rim: 0xff7a32,
  },
  "bio-beetle": {
    sprite: "td-bio-beetle", spriteAlt: "td-bio-beetle-b",
    tier: 0, hp: 6, speed: 195, dmg: 10, score: 1, size: 36,
    move: moveFlock, frameMs: 200,
    rim: 0x9eff5e,
  },
  "shadow-cone": {
    sprite: "td-shadow-cone", spriteUlt: null,
    tier: 0, hp: 4, speed: 360, dmg: 16, score: 2, size: 30,
    move: moveStraight,
    rim: 0xb388ff,
  },

  // ── Mid (tier 1) ─────────────────────────────────────────────────
  "ion-sentinel": {
    sprite: "td-ion-sentinel",
    tier: 1, hp: 16, speed: 70, dmg: 0, score: 3, size: 46,
    move: moveOrbitHover, targetR: 280, angVel: 0.5,
    fires: { every: 1.6, kind: "pulse-wave", speed: 280, dmg: 14 },
    rim: 0xffffff,
  },
  "magma-spider": {
    sprite: "td-magma-spider", spriteAlt: "td-magma-spider-b",
    tier: 1, hp: 18, speed: 155, dmg: 20, score: 3, size: 56,
    move: moveTauntSpiral, frameMs: 220,
    rim: 0xff8a3a,
  },
  "void-hunter": {
    sprite: "td-void-hunter",
    tier: 1, hp: 14, speed: 260, dmg: 14, score: 3, size: 42,
    move: moveBezierDive,
    fires: { every: 1.1, kind: "bolt", speed: 360, dmg: 10 },
    rim: 0xff3060,
  },
  "bio-cloud": {
    sprite: "td-bio-cloud",
    tier: 1, hp: 15, speed: 90, dmg: 8, score: 2, size: 64,
    move: moveStraight, leavesPoison: true, poisonRadius: 80, poisonDPS: 4,
    rim: 0x9eff5e,
  },
  "storm-wraith": {
    sprite: "td-storm-wraith", spriteAlt: "td-storm-wraith-b",
    tier: 1, hp: 14, speed: 0, dmg: 25, score: 4, size: 50,
    move: moveBlink, frameMs: 120,
    rim: 0xb388ff,
  },

  // ── Elite (tier 2) ───────────────────────────────────────────────
  "gold-carapace": {
    sprite: "td-gold-carapace",
    tier: 2, hp: 40, speed: 140, dmg: 35, score: 8, size: 76,
    move: moveChargeDash, chargeFor: 1.6, armor: 0.5,
    rim: 0xffd166,
  },
  "mirror-splitter": {
    sprite: "td-mirror-splitter",
    tier: 2, hp: 28, speed: 130, dmg: 18, score: 6, size: 60,
    move: moveStraight, splitsInto: "crystal-stalker", splitsCount: 2,
    rim: 0xffffff,
  },
  "gravity-pulse": {
    sprite: "td-gravity-pulse",
    tier: 2, hp: 32, speed: 100, dmg: 0, score: 7, size: 64,
    move: moveReflect, reflects: true, pullRadius: 140, pullStrength: 60,
    rim: 0xb388ff,
  },

  // ── Mini-boss (tier 3) ───────────────────────────────────────────
  "hook-reaper": {
    sprite: "td-hook-reaper", spriteAlt: "td-hook-reaper-b",
    tier: 3, hp: 75, speed: 100, dmg: 40, score: 14, size: 92,
    move: moveSweep, frameMs: 160,
    rim: 0xc8d8ff,
  },
  "mega-asteroid": {
    sprite: "td-mega-asteroid", spriteAlt: "td-mega-asteroid-b",
    tier: 3, hp: 120, speed: 70, dmg: 60, score: 18, size: 110,
    move: moveStraight, frameMs: 200, armor: 0.4,
    rim: 0xff5f1a,
  },
  "shadow-apostle": {
    sprite: "td-shadow-apostle",
    tier: 3, hp: 68, speed: 125, dmg: 35, score: 16, size: 86,
    move: moveMirror, spawnsTwin: true,
    rim: 0xb388ff,
  },
};

/* ─────────────── Spawn director ──────────────────────────────────
   Per-stage bag determines which enemies appear and at what weight.
   Wave 1 of each stage: only fodder. Mid waves add tier-1. Late waves
   start mixing in elite. Mini-boss appears at the wave-N mid-point.
   Stage 8+ throws everything in the blender.
   ─────────────────────────────────────────────────────────────── */

export const STAGE_BAGS = {
  1: { fodder: ["crystal-stalker", "magma-worm"], mid: [], elite: [] },
  2: { fodder: ["crystal-stalker", "magma-worm", "bio-beetle"], mid: [], elite: [] },
  3: { fodder: ["crystal-stalker", "shadow-cone", "bio-beetle"], mid: ["ion-sentinel", "magma-spider"], elite: [] },
  4: { fodder: ["shadow-cone", "magma-worm", "bio-beetle"], mid: ["ion-sentinel", "void-hunter"], elite: [] },
  5: { fodder: ["crystal-stalker", "shadow-cone", "magma-worm"], mid: ["ion-sentinel", "magma-spider", "bio-cloud"], elite: [] },
  6: { fodder: ["shadow-cone", "bio-beetle"], mid: ["void-hunter", "magma-spider", "storm-wraith"], elite: ["gold-carapace"] },
  7: { fodder: ["crystal-stalker", "bio-beetle"], mid: ["void-hunter", "bio-cloud", "storm-wraith"], elite: ["gold-carapace", "mirror-splitter"] },
  8: { fodder: ["shadow-cone", "magma-worm"], mid: ["ion-sentinel", "magma-spider", "storm-wraith"], elite: ["gold-carapace", "mirror-splitter", "gravity-pulse"] },
  9: { fodder: ["shadow-cone", "crystal-stalker"], mid: ["void-hunter", "storm-wraith", "bio-cloud"], elite: ["mirror-splitter", "gravity-pulse"] },
  10: { fodder: ["shadow-cone", "magma-worm", "crystal-stalker"], mid: ["void-hunter", "magma-spider", "storm-wraith", "bio-cloud"], elite: ["gold-carapace", "mirror-splitter", "gravity-pulse"] },
};

// Mini-boss roster per stage (one is dropped at the mid-wave checkpoint).
export const MINI_BOSSES = {
  3: "mega-asteroid",
  4: "hook-reaper",
  5: "mega-asteroid",
  6: "shadow-apostle",
  7: "hook-reaper",
  8: "shadow-apostle",
  9: "mega-asteroid",
  10: "shadow-apostle",
};

/* ─────────────── Per-stage wave director ─────────────────────────
   Given a stage and wave index, returns the kinds + counts to spawn.
   game-three.js owns the actual mesh creation; this is pure data.
   ─────────────────────────────────────────────────────────────── */

export function planWave(stage, waveIdx, wavesPerStage = 6) {
  const bag = STAGE_BAGS[stage] || STAGE_BAGS[1];
  const ratio = waveIdx / Math.max(1, wavesPerStage);
  const baseCount = Math.round(5 + waveIdx * 1.2 + (stage - 1) * 0.6);
  const out = [];

  // Fodder always — early waves are mostly fodder.
  const fodderCount = Math.round(baseCount * (1 - ratio * 0.4));
  for (let i = 0; i < fodderCount; i++) {
    out.push(bag.fodder[Math.floor(Math.random() * bag.fodder.length)]);
  }

  // Mid: appears from wave 2+
  if (waveIdx >= 2 && bag.mid.length) {
    const midCount = Math.round(baseCount * 0.18 + ratio * 1.6);
    for (let i = 0; i < midCount; i++) {
      out.push(bag.mid[Math.floor(Math.random() * bag.mid.length)]);
    }
  }

  // Elite: appears from wave 3+ on stages that have any
  if (waveIdx >= 3 && bag.elite.length) {
    const eliteCount = Math.max(0, Math.round(ratio * 1.2 - 0.3));
    for (let i = 0; i < eliteCount; i++) {
      out.push(bag.elite[Math.floor(Math.random() * bag.elite.length)]);
    }
  }

  return out;
}

export function pickMiniBossKind(stage) {
  return MINI_BOSSES[stage] || null;
}

/* ─────────────── Enemy factory ───────────────────────────────────
   game-three.js calls this to build a runtime-ready enemy data object
   from a kind id. The caller still owns mesh creation + adding to
   state.enemies — this just hydrates the data layer.
   ─────────────────────────────────────────────────────────────── */

export function createEnemyData(kind, opts = {}) {
  const def = ENEMY_TYPES[kind];
  if (!def) throw new Error(`unknown enemy kind: ${kind}`);
  return {
    kind,
    sprite: def.sprite,
    spriteAlt: def.spriteAlt || null,
    spriteUlt: def.spriteUlt || null,
    hp: def.hp * (opts.hpScale || 1),
    maxHp: def.hp * (opts.hpScale || 1),
    speed: def.speed * (opts.speedScale || 1),
    dmg: def.dmg,
    score: def.score,
    size: def.size,
    tier: def.tier,
    rim: def.rim,
    move: def.move,
    fires: def.fires || null,
    reflects: !!def.reflects,
    armor: def.armor || 0,
    leavesPoison: !!def.leavesPoison,
    poisonRadius: def.poisonRadius || 0,
    poisonDPS: def.poisonDPS || 0,
    splitsInto: def.splitsInto || null,
    splitsCount: def.splitsCount || 0,
    spawnsTwin: !!def.spawnsTwin,
    pullRadius: def.pullRadius || 0,
    pullStrength: def.pullStrength || 0,
    chargeFor: def.chargeFor || 0,
    frameMs: def.frameMs || 0,
    angVel: def.angVel,
    targetR: def.targetR,
    wobbleHz: def.wobbleHz,
    wobbleMag: def.wobbleMag,
    // Runtime
    x: opts.x ?? 0,
    y: opts.y ?? 0,
    spawnRadius: opts.spawnRadius ?? 460,
    facing: 0,
    t: 0,
    theta: null,
    r: null,
    twin: null,
    fireCool: def.fires?.every || 0,
  };
}
