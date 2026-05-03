import * as THREE from "../node_modules/three/build/three.module.js";
import { AudioEngine } from "./audio.js?v=20260503-ui-pro";
import { firstChoices, unlockedPool, upgrades } from "./upgrades.js?v=20260503-ui-pro";

/* ═══════════════════════════════════════════════════════════════
   UI References
   ═══════════════════════════════════════════════════════════════ */
const canvas = document.getElementById("game");
const ui = {
  health: document.getElementById("health"),
  money: document.getElementById("money"),
  stageWave: document.getElementById("stageWave"),
  levelCount: document.getElementById("levelCount"),
  killCount: document.getElementById("killCount"),
  runState: document.getElementById("runState"),
  restartBtn: document.getElementById("restartBtn"),
  shopBtn: document.getElementById("shopBtn"),
  soundBtn: document.getElementById("soundBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  levelPanel: document.getElementById("levelPanel"),
  levelCards: document.getElementById("levelCards"),
  levelTitleSub: document.getElementById("levelTitleSub"),
  shopPanel: document.getElementById("shopPanel"),
  shopCards: document.getElementById("shopCards"),
  shopMoney: document.getElementById("shopMoney"),
  shopCloseBtn: document.getElementById("shopCloseBtn"),
  shopRefreshBtn: document.getElementById("shopRefreshBtn"),
  bossPanel: document.getElementById("bossPanel"),
  bossName: document.getElementById("bossName"),
  bossHpText: document.getElementById("bossHpText"),
  bossHpFill: document.getElementById("bossHpFill"),
  levelProgressFill: document.getElementById("levelProgressFill"),
  levelProgressText: document.getElementById("levelProgressText"),
  pausePanel: document.getElementById("pausePanel"),
  resumeBtn: document.getElementById("resumeBtn"),
  gameOverPanel: document.getElementById("gameOverPanel"),
  gameOverSub: document.getElementById("gameOverSub"),
  goKills: document.getElementById("goKills"),
  goStage: document.getElementById("goStage"),
  goLevels: document.getElementById("goLevels"),
  goMoney: document.getElementById("goMoney"),
  restartGameOverBtn: document.getElementById("restartGameOverBtn"),
  victoryPanel: document.getElementById("victoryPanel"),
  vKills: document.getElementById("vKills"),
  vLevels: document.getElementById("vLevels"),
  vMoney: document.getElementById("vMoney"),
  restartVictoryBtn: document.getElementById("restartVictoryBtn"),
  miniBossTag: document.getElementById("miniBossTag"),
  stage: document.querySelector(".stage"),
};

/* ═══════════════════════════════════════════════════════════════
   HUD Cache — skip redundant DOM writes
   ═══════════════════════════════════════════════════════════════ */
const _hc = {};
function setHT(el, key, val) {
  if (_hc[key] === val) return;
  _hc[key] = val;
  el.textContent = val;
}
function setHS(el, key, prop, val) {
  const ck = key + prop;
  if (_hc[ck] === val) return;
  _hc[ck] = val;
  el.style[prop] = val;
}
function resetHudCache() {
  for (const k in _hc) delete _hc[k];
}

/* ═══════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════ */
const W = 720;
const H = 1280;
const C = { x: W / 2, y: H * 0.48 };
const earthRadius = 64;
const ASSET_VERSION = "20260503-audio-earth1";
const tex = {};
const iconMap = {
  Gun: "topdown-gun-icon",
  Laser: "laser-icon",
  Beam: "beam-icon",
  弹道: "ballistic-icon",
  防御: "defense-icon",
  爆炸: "explosion-core",
  经济: "economy-icon",
  地球: "earth-icon",
  近地卫星: "satellite-icon",
  特殊: "special-icon",
  风险收益: "risk-icon",
};

const rarityClass = {
  common: "is-common",
  rare: "is-rare",
  epic: "is-epic",
  legendary: "is-legendary",
  mythic: "is-mythic",
};

const upgradeVfxMap = {
  Gun: "weapon-overclock",
  Laser: "card-reveal",
  Beam: "card-reveal",
  弹道: "weapon-overclock",
  防御: "shield-pulse",
  爆炸: "explosive-flare",
  经济: "economy-spark",
  地球: "shield-pulse",
  近地卫星: "card-reveal",
  特殊: "rarity-evolution",
  风险收益: "rarity-evolution",
};

/* ═══════════════════════════════════════════════════════════════
   Audio — preload samples on import
   ═══════════════════════════════════════════════════════════════ */
const audio = new AudioEngine();
audio.preload();

/* ═══════════════════════════════════════════════════════════════
   Three.js Setup
   ═══════════════════════════════════════════════════════════════ */
const loader = new THREE.TextureLoader();
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 0.1, 100);
camera.position.z = 20;

const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true, powerPreference: "high-performance" });
renderer.setSize(W, H, false);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x02070b, 1);

/* ═══════════════════════════════════════════════════════════════
   Textures
   ═══════════════════════════════════════════════════════════════ */
function loadTexture(key, src) {
  const texture = loader.load(`${src}?v=${ASSET_VERSION}`);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  tex[key] = texture;
  return texture;
}

const individualAssetBase = "assets/generated/individual/final";
const bossAssetBase = "assets/generated/bosses/frames";
const characterAssetBase = "assets/generated/characters/final";

const bossConfigs = [
  {
    level: 1,
    name: "熔核陨星",
    slug: "molten-asteroid",
    ability: "火山裂隙核心，周期喷发岩浆弹",
    maxHp: 595,
    reward: 28,
    size: 160,
    color: 0xff8a34,
  },
  {
    level: 2,
    name: "寄生蜂巢",
    slug: "bio-saucer-hive",
    ability: "绿色生物机械外壳，召唤修复虫群",
    maxHp: 1060,
    reward: 36,
    size: 164,
    color: 0x7bff5a,
  },
  {
    level: 3,
    name: "霜晶利维坦",
    slug: "ice-crystal-leviathan",
    ability: "冰晶护甲，释放减速晶刺",
    maxHp: 1715,
    reward: 44,
    size: 168,
    color: 0x8cefff,
  },
  {
    level: 4,
    name: "虚空母舰",
    slug: "void-mothership",
    ability: "紫色暗能量舰体，发射扇形切割线",
    maxHp: 2560,
    reward: 52,
    size: 172,
    color: 0xba83ff,
  },
  {
    level: 5,
    name: "黄金炮垒",
    slug: "gold-artillery-fortress",
    ability: "重型火炮平台，多炮口轮射",
    maxHp: 3595,
    reward: 60,
    size: 176,
    color: 0xffd260,
  },
  {
    level: 6,
    name: "赤环蛇影",
    slug: "red-plasma-coil",
    ability: "环形等离子生命体，缠绕式攻击",
    maxHp: 4820,
    reward: 68,
    size: 180,
    color: 0xff6257,
  },
  {
    level: 7,
    name: "离子雷巢",
    slug: "blue-ion-hive",
    ability: "蓝色电弧核心，跳跃电击",
    maxHp: 6235,
    reward: 76,
    size: 184,
    color: 0x63dfff,
  },
  {
    level: 8,
    name: "黑骨无畏舰",
    slug: "black-dreadnought",
    ability: "黑色装甲巨舰，冲撞与装甲阶段",
    maxHp: 7840,
    reward: 84,
    size: 188,
    color: 0x8d9ab8,
  },
  {
    level: 9,
    name: "白环引力机",
    slug: "white-graviton-ring",
    ability: "多层引力环，牵引小飞机",
    maxHp: 9635,
    reward: 92,
    size: 192,
    color: 0xf4fbff,
  },
  {
    level: 10,
    name: "日蚀核心",
    slug: "solar-eclipse-core",
    ability: "最终日蚀体，释放全屏脉冲",
    maxHp: 11620,
    reward: 100,
    size: 196,
    color: 0xffef80,
  },
];

loadTexture("background", "assets/generated/images/earth-defense-background.png");
loadTexture("earth", `${individualAssetBase}/earth-core.png`);
for (let i = 0; i < 4; i++) loadTexture(`topdownPlane-${i}`, `${individualAssetBase}/topdown-plane-${i}.png`);
loadTexture("alienSaucer", `${individualAssetBase}/alien-saucer.png`);
loadTexture("alienMeteor", `${individualAssetBase}/alien-meteor.png`);
loadTexture("playerBullet", `${individualAssetBase}/player-bullet.png`);
loadTexture("enemyBolt", `${individualAssetBase}/enemy-bolt.png`);
loadTexture("explosionCore", `${individualAssetBase}/explosion-core.png`);
loadTexture("barrageProjectile", `${individualAssetBase}/barrage-projectile.png`);
loadTexture("charPlaneBlue", `${characterAssetBase}/interceptor-blue.png`);
loadTexture("charPlaneGold", `${characterAssetBase}/interceptor-gold.png`);
loadTexture("charPlaneLaser", `${characterAssetBase}/interceptor-laser.png`);
loadTexture("charEnemyMeteor", `${characterAssetBase}/enemy-meteor-crab.png`);
loadTexture("charEnemyBolt", `${characterAssetBase}/enemy-bolt-needle.png`);
loadTexture("charEnemySaucer", `${characterAssetBase}/enemy-saucer-hunter.png`);
for (const boss of bossConfigs) {
  const id = String(boss.level).padStart(2, "0");
  for (let frame = 0; frame < 4; frame++) {
    loadTexture(`boss-${boss.level}-${frame}`, `${bossAssetBase}/boss-${id}-${boss.slug}-frame-${String(frame).padStart(2, "0")}.png`);
  }
}

/* ═══════════════════════════════════════════════════════════════
   Game State
   ═══════════════════════════════════════════════════════════════ */
const state = {
  mode: "playing",
  last: 0,
  time: 0,
  gameTime: 0,
  health: 160,
  maxHealth: 160,
  shield: 30,
  money: 8,
  kills: 0,
  stageLevel: 1,
  waveIndex: 1,
  waveTimer: 0,
  boss: null,
  bossesDefeated: 0,
  levelCount: 0,
  levelUpSource: "timer",
  nextLevelIndex: 0,
  levelOptions: [],
  shopOptions: [],
  selectedIds: new Set(),
  enemies: [],
  bullets: [],
  explosions: [],
  defenders: [],
  beams: [],
  enemyCarry: 0,
  swarmCarry: 0,
  coreTimer: 0,
  fireTimer: 0,
  laserLevel: 0,
  beamLevel: 0,
  gunLevel: 2,
  fireRateMul: 1,
  bulletDamage: 1,
  bulletPierce: 0,
  splitShot: 0,
  explosionScale: 1,
  moneyMul: 1,
  soundOn: false,
  miniBossesDefeated: 0,
  message: "地球防御系统启动中",
};

// First level-up at 14s gives players quick onboarding feedback; subsequent
// triggers space out so the upgrade rhythm slows as the game gets crowded.
const levelTriggers = Array.from({ length: 80 }, (_, i) => 14 + i * 10 + Math.floor(i / 10) * 4);
const wavesPerStage = 20;
const waveDuration = 4.2;
const shopRefreshCost = 3;
// Decorative barrage layer is intentionally disabled; the dense golden-flame
// streaks are now real `isSwarm` enemies the player intercepts. Constants are
// kept so any radius math that referenced them still resolves.
const barrageCount = 0;
const barrageInner = 235;
const barrageOuter = 780;
const barrageItems = [];
const interceptFlashes = [];
const earthVisualSize = earthRadius * 2.45;
const planeTextureKeys = ["charPlaneBlue", "charPlaneGold", "charPlaneLaser"];

const swarmEntryRadius = 760;
// Stage-1 baseline tuned so 6 starter defenders can intercept enough of the
// stream to keep Earth alive while the player ramps up. Density grows with
// stageLevel + waveIndex below.
const swarmBaseDensity = 70;
const swarmMaxDensity = 230;
const swarmTrailColor = 0xffb14a;

/* ═══════════════════════════════════════════════════════════════
   Swap-and-pop — O(1) array removal
   ═══════════════════════════════════════════════════════════════ */
function swapRemove(arr, i) {
  const last = arr.length - 1;
  if (i !== last) arr[i] = arr[last];
  arr.length = last;
}

/* ═══════════════════════════════════════════════════════════════
   Spatial Grid — accelerates bullet→enemy collision
   ═══════════════════════════════════════════════════════════════ */
const GRID_CELL = 80;
const gridCols = Math.ceil(W / GRID_CELL) + 1;
const gridRows = Math.ceil(H / GRID_CELL) + 1;
const grid = new Array(gridCols * gridRows);

function gridKey(x, y) {
  const c = Math.max(0, Math.min(gridCols - 1, (x / GRID_CELL) | 0));
  const r = Math.max(0, Math.min(gridRows - 1, (y / GRID_CELL) | 0));
  return r * gridCols + c;
}

function buildGrid() {
  for (let i = 0; i < grid.length; i++) grid[i] = null;
  for (let i = 0; i < state.enemies.length; i++) {
    const e = state.enemies[i];
    const key = gridKey(e.x, e.y);
    if (!grid[key]) grid[key] = [];
    grid[key].push(e);
  }
}

// Singleton scratch buffers — callers must consume before the next call.
const _nearbyScratch = [];
const _defenderScratch = { x: 0, y: 0 };
function queryNearbyEnemies(x, y) {
  _nearbyScratch.length = 0;
  const col = (x / GRID_CELL) | 0;
  const row = (y / GRID_CELL) | 0;
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const c = col + dc;
      const r = row + dr;
      if (c < 0 || c >= gridCols || r < 0 || r >= gridRows) continue;
      const cell = grid[r * gridCols + c];
      if (cell) {
        for (let k = 0; k < cell.length; k++) _nearbyScratch.push(cell[k]);
      }
    }
  }
  return _nearbyScratch;
}

/* ═══════════════════════════════════════════════════════════════
   Utility Functions
   ═══════════════════════════════════════════════════════════════ */
function worldX(x) {
  return x - W / 2;
}

function worldY(y) {
  return H / 2 - y;
}

function setXY(object, x, y, z = 0) {
  object.position.set(worldX(x), worldY(y), z);
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function angleTo(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

function pointOnCircle(angle, radius, center = C) {
  return { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius };
}

/* ═══════════════════════════════════════════════════════════════
   Three.js Helpers
   ═══════════════════════════════════════════════════════════════ */
function createSprite(texture, w, h, options = {}) {
  const material = new THREE.SpriteMaterial({
    map: texture,
    color: options.color ?? 0xffffff,
    transparent: true,
    opacity: options.opacity ?? 1,
    depthWrite: false,
    depthTest: false,
    blending: options.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(w, h, 1);
  return sprite;
}

function makeSprite(texture, w, h, options = {}) {
  const sprite = createSprite(texture, w, h, options);
  scene.add(sprite);
  return sprite;
}

function disposeObject(object) {
  if (!object) return;
  scene.remove(object);
  object.traverse?.((child) => {
    if (child.geometry) child.geometry.dispose();
    if (Array.isArray(child.material)) {
      child.material.forEach((material) => material.dispose());
    } else if (child.material) {
      child.material.dispose();
    }
  });
  if (!object.traverse) {
    if (object.geometry) object.geometry.dispose();
    if (object.material) object.material.dispose();
  }
}

function makeGlowLine(color, opacity = 0.8) {
  const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
  const line = new THREE.Line(geometry, material);
  scene.add(line);
  return line;
}

function updateLine(line, a, b, z = 0) {
  const positions = line.geometry.attributes.position;
  positions.setXYZ(0, worldX(a.x), worldY(a.y), z);
  positions.setXYZ(1, worldX(b.x), worldY(b.y), z);
  positions.needsUpdate = true;
}

function updateLineXY(line, x1, y1, x2, y2, z = 0) {
  const positions = line.geometry.attributes.position;
  positions.setXYZ(0, worldX(x1), worldY(y1), z);
  positions.setXYZ(1, worldX(x2), worldY(y2), z);
  positions.needsUpdate = true;
}

function createEnergyBeam(angle, options = {}) {
  const beam = {
    life: options.life ?? 0.38,
    max: options.life ?? 0.38,
    line: makeGlowLine(options.color ?? 0xbefcff, options.opacity ?? 0.78),
    angle,
    wide: options.wide ?? false,
    opacity: options.opacity ?? (options.wide ? 0.5 : 0.74),
    from: options.from,
    to: options.to,
  };
  state.beams.push(beam);
  return beam;
}

function spawnBeamFan(centerAngle, count, spread, options = {}) {
  const total = Math.max(1, count);
  for (let i = 0; i < total; i++) {
    const ratio = total === 1 ? 0 : i / (total - 1) - 0.5;
    createEnergyBeam(centerAngle + ratio * spread, options);
  }
}

function makeCircleLineObject(radius, color, opacity) {
  const points = [];
  for (let i = 0; i <= 128; i++) {
    const a = (Math.PI * 2 * i) / 128;
    points.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
  return new THREE.LineLoop(geometry, material);
}

function makeCircleLine(radius, color, opacity) {
  const line = makeCircleLineObject(radius, color, opacity);
  scene.add(line);
  return line;
}

function makeEnergyRing(radius, thickness, color, opacity) {
  const geometry = new THREE.RingGeometry(Math.max(1, radius - thickness), radius + thickness, 96);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });
  return new THREE.Mesh(geometry, material);
}

/* ═══════════════════════════════════════════════════════════════
   Enemy Visual
   ═══════════════════════════════════════════════════════════════ */
function createEnemyVisual(kind, size) {
  const group = new THREE.Group();
  scene.add(group);
  const visual = { group };

  if (kind === "saucer") {
    visual.halo = makeEnergyRing(size * 0.82, size * 0.1, 0x7aff63, 0.22);
    visual.shell = makeEnergyRing(size * 0.56, size * 0.12, 0xffc34d, 0.52);
    visual.inner = makeEnergyRing(size * 0.32, size * 0.08, 0x64fff1, 0.5);
    visual.core = createSprite(tex.charEnemySaucer, size * 1.52, size * 1.52, { opacity: 0.98 });
    visual.glint = createSprite(tex.explosionCore, size * 1.2, size * 1.2, { additive: true, opacity: 0.18, color: 0x7affd4 });
    group.add(visual.halo, visual.shell, visual.inner, visual.glint, visual.core);
    return visual;
  }

  if (kind === "bolt") {
    visual.flare = createSprite(tex.explosionCore, size * 1.35, size * 1.35, { additive: true, opacity: 0.22, color: 0xcaff67 });
    visual.tail = createSprite(tex.barrageProjectile, size * 0.42, size * 2.8, { additive: true, opacity: 0.6, color: 0xe6ff5b });
    visual.tail.position.set(0, -size * 0.92, -0.02);
    visual.core = createSprite(tex.charEnemyBolt, size * 1.55, size * 1.55, { opacity: 0.98, additive: true });
    group.add(visual.tail, visual.flare, visual.core);
    return visual;
  }

  visual.tail = createSprite(tex.barrageProjectile, size * 0.7, size * 2.95, { additive: true, opacity: 0.72, color: 0xffa33d });
  visual.tail.position.set(0, -size * 0.98, -0.03);
  visual.flare = createSprite(tex.explosionCore, size * 1.7, size * 1.7, { additive: true, opacity: 0.25, color: 0xff9d42 });
  visual.core = createSprite(tex.charEnemyMeteor, size * 1.6, size * 1.6, { opacity: 0.98 });
  visual.rim = makeEnergyRing(size * 0.46, size * 0.05, 0xffd06c, 0.34);
  group.add(visual.tail, visual.flare, visual.core, visual.rim);
  return visual;
}

function createBossVisual(config) {
  const group = new THREE.Group();
  scene.add(group);
  const color = config.color;
  const visual = {
    group,
    frame: 0,
    frameTimer: 0,
    aura: createSprite(tex.explosionCore, config.size * 1.72, config.size * 1.72, { additive: true, opacity: 0.2, color }),
    ringOuter: makeEnergyRing(config.size * 0.72, config.size * 0.035, color, 0.32),
    ringInner: makeEnergyRing(config.size * 0.48, config.size * 0.025, 0xc8ffff, 0.18),
    core: createSprite(tex[`boss-${config.level}-0`], config.size, config.size, { opacity: 1 }),
  };
  group.add(visual.aura, visual.ringOuter, visual.ringInner, visual.core);
  return visual;
}

function updateEnemyVisual(enemy, dt) {
  const visual = enemy.visual;
  if (!visual) return;
  setXY(visual.group, enemy.x, enemy.y, 3);

  if (enemy.isMiniBoss) {
    if (!visual.miniBossAura) {
      const palette = miniBossPalette[enemy.miniBossKind] || miniBossPalette.meteor;
      visual.miniBossAura = createSprite(tex.explosionCore, enemy.size * 1.65, enemy.size * 1.65, { additive: true, opacity: 0.32, color: palette.color });
      visual.miniBossAura.position.set(0, 0, -0.04);
      visual.group.add(visual.miniBossAura);
      visual.miniBossRing = makeEnergyRing(enemy.size * 0.66, enemy.size * 0.045, palette.color, 0.65);
      visual.group.add(visual.miniBossRing);
    }
    visual.miniBossRing.rotation.z += dt * 1.6;
    visual.miniBossAura.material.opacity = 0.22 + Math.sin(state.time * 4.2 + enemy.wobble) * 0.1;
    const pulse = 1 + Math.sin(state.time * 5 + enemy.wobble) * 0.04;
    visual.group.scale.set(pulse, pulse, 1);
  }

  if (enemy.isBoss) {
    const config = enemy.bossConfig;
    const frame = Math.floor(state.time * (6.2 + config.level * 0.18)) % 4;
    if (frame !== visual.frame) {
      visual.frame = frame;
      visual.core.material.map = tex[`boss-${config.level}-${frame}`];
      visual.core.material.needsUpdate = true;
    }
    const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);
    const pulse = 1 + Math.sin(state.time * 3.8 + enemy.wobble) * 0.035 + (1 - hpRatio) * 0.035;
    visual.group.scale.set(pulse, pulse, 1);
    visual.group.rotation.z = Math.sin(state.time * 0.72 + enemy.wobble) * 0.04;
    visual.ringOuter.rotation.z += dt * (0.7 + config.level * 0.04);
    visual.ringInner.rotation.z -= dt * (1.1 + config.level * 0.05);
    visual.aura.material.opacity = 0.14 + Math.sin(state.time * 4.6 + enemy.wobble) * 0.045 + (1 - hpRatio) * 0.1;
    visual.core.material.opacity = 0.92 + Math.sin(state.time * 5.2 + enemy.wobble) * 0.06;
    return;
  }

  const pulse = 1 + Math.sin(state.time * 5.8 + enemy.wobble) * 0.055;
  visual.group.scale.set(pulse, pulse, 1);

  if (enemy.kind === "saucer") {
    visual.group.rotation.z += dt * (0.5 + Math.abs(enemy.spin));
    visual.shell.rotation.z -= dt * 2.1;
    visual.inner.rotation.z += dt * 3.2;
    visual.halo.material.opacity = 0.16 + Math.sin(state.time * 7 + enemy.wobble) * 0.055;
    visual.core.material.rotation = Math.sin(state.time * 4 + enemy.wobble) * 0.18;
    visual.core.material.opacity = 0.74 + Math.sin(state.time * 8.5 + enemy.wobble) * 0.12;
    return;
  }

  visual.group.rotation.z = -enemy.angle + Math.PI / 2;
  if (visual.core?.material) visual.core.material.rotation += enemy.spin * dt * 0.45;
  if (visual.tail?.material) {
    visual.tail.material.opacity = 0.46 + Math.sin(state.time * 11 + enemy.wobble) * 0.16;
    visual.tail.scale.y = 1.0 + Math.sin(state.time * 9.5 + enemy.wobble) * 0.18;
  }
  if (visual.flare?.material) visual.flare.material.opacity = 0.14 + Math.sin(state.time * 8 + enemy.wobble) * 0.08;
  if (visual.rim) visual.rim.rotation.z -= dt * 2.8;
}

/* ═══════════════════════════════════════════════════════════════
   Star Field & Barrage Layer
   ═══════════════════════════════════════════════════════════════ */
function createStarField() {
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  for (let i = 0; i < 300; i++) {
    positions.push(rand(-W / 2, W / 2), rand(-H / 2, H / 2), -3);
  }
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xcdefff, size: 1.8, transparent: true, opacity: 0.58, depthWrite: false });
  const points = new THREE.Points(geometry, material);
  scene.add(points);
  return points;
}

function resetBarrageItem(item, index = 0, initial = false) {
  item.angle = ((index / barrageCount) * Math.PI * 2 + rand(-0.014, 0.014)) % (Math.PI * 2);
  item.phase = initial ? rand(0, 1) : 0;
  item.speed = rand(0.058, 0.108);
  item.length = rand(108, 168);
  item.width = rand(13, 20);
  item.lane = rand(-12, 12);
  item.opacity = rand(0.78, 1);
  item.roll = rand(-0.022, 0.022);
}

function createBarrageLayer() {
  for (let i = 0; i < barrageCount; i++) {
    const item = {
      mesh: makeSprite(tex.barrageProjectile, 16, 120, { additive: true, opacity: 0.92 }),
    };
    resetBarrageItem(item, i, true);
    barrageItems.push(item);
  }
}

function updateBarrageLayer(dt, t) {
  const slow = state.mode === "levelUp" ? 0.18 : 1;
  for (let i = 0; i < barrageItems.length; i++) {
    const item = barrageItems[i];
    const prevPhase = item.phase;
    item.phase += item.speed * dt * slow;
    if (item.phase >= 1) {
      // wrap-around: spawn an intercept flash at last visible position to suggest a barrage round
      // hitting the inner edge before resetting
      if (prevPhase < 1 && Math.random() < 0.18) {
        const flashAngle = item.angle;
        const r = barrageInner + 18;
        spawnInterceptFlash(C.x + Math.cos(flashAngle) * r, C.y + Math.sin(flashAngle) * r, 0.6);
      }
      resetBarrageItem(item, i);
    }
    const wave = Math.sin(t * 0.7 + i * 0.37) * item.lane;
    const radius = barrageOuter - item.phase * (barrageOuter - barrageInner);
    const angle = item.angle + wave / 900;
    const head = pointOnCircle(angle, radius);
    const fadeIn = Math.max(0, Math.min(1, (barrageOuter - radius) / 92));
    const fadeOut = Math.max(0, Math.min(1, (radius - barrageInner) / 82));
    const visible = fadeIn * fadeOut;
    const near = 1 - (radius - barrageInner) / (barrageOuter - barrageInner);
    const scale = 0.84 + near * 0.5 + Math.sin(t * 1.4 + i) * 0.03;
    setXY(item.mesh, head.x, head.y, 0.45);
    item.mesh.material.rotation = -(angle + Math.PI) + Math.PI / 2 + item.roll;
    item.mesh.material.opacity = item.opacity * visible * (state.mode === "levelUp" ? 0.95 : 0.92);
    item.mesh.scale.set(item.width * scale, item.length * scale, 1);
  }
}

/* ═══════════════════════════════════════════════════════════════
   Rotating Earth Texture
   ═══════════════════════════════════════════════════════════════ */
const earthTextureCanvas = document.createElement("canvas");
earthTextureCanvas.width = 512;
earthTextureCanvas.height = 512;
const earthTextureCtx = earthTextureCanvas.getContext("2d");
const earthTexture = new THREE.CanvasTexture(earthTextureCanvas);
earthTexture.colorSpace = THREE.SRGBColorSpace;
earthTexture.minFilter = THREE.LinearFilter;
earthTexture.magFilter = THREE.LinearFilter;

function drawEarthOverlayBlob(ctx, x, y, rx, ry, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, Math.sin((x + y) * 0.01) * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRotatingEarthTexture(t = 0) {
  const ctx = earthTextureCtx;
  const size = earthTextureCanvas.width;
  const center = size / 2;
  const radius = size * 0.45;
  ctx.clearRect(0, 0, size, size);

  const ocean = ctx.createRadialGradient(center - 50, center - 58, 20, center, center, radius);
  ocean.addColorStop(0, "#7edaff");
  ocean.addColorStop(0.34, "#1f7fc7");
  ocean.addColorStop(0.72, "#063b83");
  ocean.addColorStop(1, "#011129");

  ctx.save();
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, size, size);

  const source = tex.earth?.image;
  if (source?.width) {
    ctx.globalAlpha = 0.46;
    ctx.drawImage(source, center - radius, center - radius, radius * 2, radius * 2);
  }

  const landShift = (t * 24) % (size + 160);
  const landBands = [
    [55, 170, 60, 38, "#72b765", 0.28],
    [174, 232, 84, 46, "#d2c17a", 0.22],
    [292, 145, 70, 34, "#69a85e", 0.24],
    [390, 282, 90, 42, "#4fa26d", 0.2],
    [490, 210, 62, 36, "#d6b85d", 0.19],
    [610, 336, 82, 32, "#f0e2a2", 0.12],
  ];
  ctx.filter = "blur(1.1px)";
  for (const [baseX, y, rx, ry, color, alpha] of landBands) {
    const x = ((baseX - landShift + size + 160) % (size + 160)) - 80;
    drawEarthOverlayBlob(ctx, x, y, rx, ry, color, alpha);
    drawEarthOverlayBlob(ctx, x + size + 160, y, rx, ry, color, alpha);
  }
  ctx.filter = "none";

  const cloudShift = (t * 46) % (size + 180);
  ctx.strokeStyle = "rgba(236, 252, 255, 0.46)";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 9; i++) {
    const y = 116 + i * 34 + Math.sin(t * 0.7 + i) * 5;
    const x = ((i * 74 - cloudShift + size + 180) % (size + 180)) - 90;
    ctx.globalAlpha = 0.15 + (i % 3) * 0.035;
    ctx.beginPath();
    ctx.ellipse(x, y, 74 + (i % 2) * 24, 10 + (i % 3) * 3, Math.sin(i) * 0.32, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x + size + 180, y, 74 + (i % 2) * 24, 10 + (i % 3) * 3, Math.sin(i) * 0.32, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  const shade = ctx.createLinearGradient(center - radius, center, center + radius, center);
  shade.addColorStop(0, "rgba(0, 5, 18, 0.48)");
  shade.addColorStop(0.35, "rgba(0, 0, 0, 0)");
  shade.addColorStop(0.78, "rgba(255, 255, 255, 0.07)");
  shade.addColorStop(1, "rgba(255, 255, 255, 0.2)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(95, 241, 255, 0.88)";
  ctx.lineWidth = 7;
  ctx.shadowColor = "rgba(60, 238, 255, 0.82)";
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(center, center, radius + 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  earthTexture.needsUpdate = true;
}

// Earth canvas redraw is the heaviest per-frame cost (gradients + blur + shadowBlur + GPU upload).
// Cloud/land shifts are slow enough that 20 FPS is visually indistinguishable from 60.
let _earthLastDraw = -1;
const EARTH_TEXTURE_INTERVAL = 0.05;
function maybeRedrawEarth(t) {
  if (t - _earthLastDraw >= EARTH_TEXTURE_INTERVAL) {
    drawRotatingEarthTexture(t);
    _earthLastDraw = t;
  }
}

/* ═══════════════════════════════════════════════════════════════
   Scene Objects
   ═══════════════════════════════════════════════════════════════ */
const background = makeSprite(tex.background, W, H, { opacity: 0.92 });
background.position.set(0, 0, -5);
const starField = createStarField();
createBarrageLayer();
drawRotatingEarthTexture(0);
const earth = makeSprite(earthTexture, earthVisualSize, earthVisualSize, { opacity: 1 });
setXY(earth, C.x, C.y, 2);

const shieldOuter = makeCircleLine(earthRadius + 52, 0x45e7ff, 0.22);
const shieldInner = makeCircleLine(earthRadius + 31, 0x8af8ff, 0.62);
shieldOuter.position.set(worldX(C.x), worldY(C.y), 1.5);
shieldInner.position.set(worldX(C.x), worldY(C.y), 1.7);

/* ═══════════════════════════════════════════════════════════════
   Explosion Object Pool — reduces GC pressure
   ═══════════════════════════════════════════════════════════════ */
const explosionPool = [];
const EXPLOSION_POOL_MAX = 60;

function drainExplosionPool() {
  while (explosionPool.length) disposeObject(explosionPool.pop());
}

function addExplosion(x, y, scale = 1) {
  let sprite;
  if (explosionPool.length > 0) {
    sprite = explosionPool.pop();
    sprite.visible = true;
  } else {
    sprite = makeSprite(tex.explosionCore, 82, 82, { additive: true, opacity: 0.9 });
  }
  const size = 82 * scale;
  sprite.scale.set(size, size, 1);
  sprite.material.opacity = 0.9;
  setXY(sprite, x, y, 7);
  state.explosions.push({ mesh: sprite, life: 0.42, max: 0.42, scale, baseSize: size });
}

/* ═══════════════════════════════════════════════════════════════
   Screen Shake — camera nudge for impactful events
   ═══════════════════════════════════════════════════════════════ */
const shakeState = { life: 0, max: 0.001, magnitude: 0 };
function triggerScreenShake(duration, magnitude) {
  shakeState.life = Math.max(shakeState.life, duration);
  shakeState.max = Math.max(shakeState.max, duration);
  shakeState.magnitude = Math.max(shakeState.magnitude, magnitude);
}
function applyScreenShake(dt) {
  if (shakeState.life <= 0) {
    if (camera.position.x !== 0 || camera.position.y !== 0) camera.position.set(0, 0, 20);
    return;
  }
  shakeState.life -= dt;
  const k = Math.max(0, shakeState.life / shakeState.max);
  const m = shakeState.magnitude * k;
  camera.position.x = (Math.random() - 0.5) * m;
  camera.position.y = (Math.random() - 0.5) * m;
  if (shakeState.life <= 0) {
    camera.position.set(0, 0, 20);
    shakeState.magnitude = 0;
  }
}

/* ═══════════════════════════════════════════════════════════════
   Intercept Flash — bright white-yellow burst at inner barrage ring
   when player bullets meet incoming projectiles. Mirrors the dense
   ring of explosions visible in the source video.
   ═══════════════════════════════════════════════════════════════ */
const flashPool = [];
const FLASH_POOL_MAX = 80;

function drainFlashPool() {
  while (flashPool.length) disposeObject(flashPool.pop());
}

function spawnInterceptFlash(x, y, scale = 1) {
  let sprite;
  if (flashPool.length > 0) {
    sprite = flashPool.pop();
    sprite.visible = true;
  } else {
    sprite = makeSprite(tex.explosionCore, 60, 60, { additive: true, opacity: 1, color: 0xffe7a5 });
  }
  const base = 60 * scale;
  sprite.scale.set(base, base, 1);
  sprite.material.color.setHex(0xfff0c0);
  sprite.material.opacity = 1;
  setXY(sprite, x, y, 1.2);
  interceptFlashes.push({ mesh: sprite, life: 0.28, max: 0.28, base, twirl: rand(-2.5, 2.5) });
}

function updateInterceptFlashes(dt) {
  for (let i = interceptFlashes.length - 1; i >= 0; i--) {
    const f = interceptFlashes[i];
    f.life -= dt;
    const k = Math.max(0, f.life / f.max);
    f.mesh.material.opacity = k;
    f.mesh.material.rotation += f.twirl * dt;
    const expand = 1 + (1 - k) * 1.4;
    f.mesh.scale.set(f.base * expand, f.base * expand, 1);
    if (f.life <= 0) {
      f.mesh.visible = false;
      if (flashPool.length < FLASH_POOL_MAX) flashPool.push(f.mesh);
      else disposeObject(f.mesh);
      swapRemove(interceptFlashes, i);
    }
  }
}

function updateExplosions(dt) {
  for (let i = state.explosions.length - 1; i >= 0; i--) {
    const e = state.explosions[i];
    e.life -= dt;
    const k = Math.max(0, e.life / e.max);
    e.mesh.material.opacity = Math.min(1, k + 0.15);
    // Life-based scale curve (deterministic, no runaway growth)
    const expand = 1 + (1 - k) * 0.6;
    e.mesh.scale.set(e.baseSize * expand, e.baseSize * expand, 1);
    if (e.life <= 0) {
      e.mesh.visible = false;
      if (explosionPool.length < EXPLOSION_POOL_MAX) {
        explosionPool.push(e.mesh);
      } else {
        disposeObject(e.mesh);
      }
      swapRemove(state.explosions, i);
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   Data-Driven Upgrade Effects (switch-case)
   ═══════════════════════════════════════════════════════════════ */
function applyUpgrade(u) {
  const n = u.name;
  const s = state;
  switch (u.category) {
    case "Gun":
      if (n === "Gun") s.gunLevel += 1;
      if (n === "双联机炮") s.splitShot += 1;
      if (n === "高速供弹") s.fireRateMul *= 1.18;
      if (n === "穿甲弹头") s.bulletPierce += 1;
      if (n === "扇形齐射") s.splitShot += 2;
      if (n === "钨芯风暴") s.explosionScale += 0.25;
      if (n === "近地机群") s.gunLevel += 2;
      rebuildDefenders();
      break;
    case "Laser":
      s.laserLevel += 1;
      break;
    case "Beam":
      s.beamLevel += 1;
      break;
    case "防御":
      s.shield = Math.min(70, s.shield + 18);
      if (n === "装甲地壳") {
        s.maxHealth += 20;
        s.health += 20;
      }
      break;
    case "爆炸":
      s.explosionScale += 0.2;
      break;
    case "经济":
      s.moneyMul += 0.15;
      break;
    case "地球":
      s.fireRateMul *= 1.08;
      break;
    case "近地卫星":
      s.gunLevel += 1;
      break;
    case "风险收益":
      s.fireRateMul *= 1.2;
      if (n === "脆弱火力") s.maxHealth = Math.max(45, s.maxHealth - 15);
      if (n === "超量起飞") s.gunLevel += 2;
      rebuildDefenders();
      break;
  }
}

/* ═══════════════════════════════════════════════════════════════
   Reset & Clear
   ═══════════════════════════════════════════════════════════════ */
function clearEntities() {
  for (const item of state.enemies) { disposeObject(item.mesh); disposeObject(item.trail); }
  for (const item of state.bullets) { disposeObject(item.mesh); disposeObject(item.trail); }
  for (const item of state.explosions) { disposeObject(item.mesh); }
  for (const item of state.defenders) { disposeObject(item.mesh); }
  for (const item of state.beams) { disposeObject(item.line); }
  for (const item of interceptFlashes) { disposeObject(item.mesh); }
  interceptFlashes.length = 0;
}

function reset() {
  clearEntities();
  drainExplosionPool();
  drainFlashPool();
  resetHudCache();
  Object.assign(state, {
    mode: "playing",
    last: performance.now(),
    time: 0,
    gameTime: 0,
    health: 160,
    maxHealth: 160,
    shield: 30,
    money: 8,
    kills: 0,
    stageLevel: 1,
    waveIndex: 1,
    waveTimer: 0,
    boss: null,
    bossesDefeated: 0,
    levelCount: 0,
    nextLevelIndex: 0,
    levelOptions: [],
    shopOptions: [],
    selectedIds: new Set(),
    enemies: [],
    bullets: [],
    explosions: [],
    defenders: [],
    beams: [],
    enemyCarry: 0,
    swarmCarry: 0,
    coreTimer: 0,
    fireTimer: 0,
    laserLevel: 0,
    beamLevel: 0,
    gunLevel: 2,
    fireRateMul: 1,
    bulletDamage: 1,
    bulletPierce: 0,
    splitShot: 0,
    explosionScale: 1,
    moneyMul: 1,
    levelUpSource: "timer",
    miniBossesDefeated: 0,
    message: "地球防御系统启动中",
  });
  rebuildDefenders();
  hideLevelPanel();
  hideShopPanel();
  hideOverlay(ui.pausePanel);
  hideOverlay(ui.gameOverPanel);
  hideOverlay(ui.victoryPanel);
  if (ui.miniBossTag) ui.miniBossTag.hidden = true;
  prefillSwarm();
  updateHud();
}

/* ═══════════════════════════════════════════════════════════════
   HUD Update (with DOM write cache)
   ═══════════════════════════════════════════════════════════════ */
function setSoundButton() {
  const label = state.soundOn ? "音效" : "开启";
  const icon = state.soundOn ? "🔊" : "🔇";
  if (ui.soundBtn) {
    const labelEl = ui.soundBtn.querySelector(".ctrl-label");
    const iconEl = ui.soundBtn.querySelector(".ctrl-icon");
    if (labelEl) setHT(labelEl, "sndLabel", label);
    if (iconEl) setHT(iconEl, "sndIcon", icon);
  }
}

function setShopButton() {
  const label = state.mode === "shop" ? "关闭" : "商店";
  if (ui.shopBtn) {
    const labelEl = ui.shopBtn.querySelector(".ctrl-label");
    if (labelEl) setHT(labelEl, "shopLabel", label);
  }
}

function setPauseButton() {
  const label = state.mode === "paused" ? "继续" : "暂停";
  const icon = state.mode === "paused" ? "▶" : "⏸";
  if (ui.pauseBtn) {
    const labelEl = ui.pauseBtn.querySelector(".ctrl-label");
    const iconEl = ui.pauseBtn.querySelector(".ctrl-icon");
    if (labelEl) setHT(labelEl, "pauseLabel", label);
    if (iconEl) setHT(iconEl, "pauseIcon", icon);
  }
}

function updateHud() {
  setHT(ui.health, "health", Math.max(0, Math.round(state.health)));
  setHT(ui.money, "money", Math.floor(state.money));
  setHT(ui.stageWave, "sw", `${state.stageLevel}-${String(state.waveIndex).padStart(2, "0")}`);
  setHT(ui.levelCount, "lc", state.levelCount);
  if (ui.killCount) setHT(ui.killCount, "kc", state.kills);
  setHT(ui.runState, "rs", state.message);
  setSoundButton();
  setShopButton();
  setHT(ui.shopMoney, "sm", Math.floor(state.money));
  setHT(ui.shopRefreshBtn, "srf", `刷新 ¥${shopRefreshCost}`);
  const shouldDisable = state.money < shopRefreshCost;
  if (ui.shopRefreshBtn.disabled !== shouldDisable) ui.shopRefreshBtn.disabled = shouldDisable;
  setPauseButton();
  syncOverlays();
  // level-progress + boss-hp panels + mini-boss tag refresh every frame in frame(); skip here.
}

function showOverlay(panel) {
  if (!panel) return;
  if (panel.hidden) panel.hidden = false;
}

function hideOverlay(panel) {
  if (!panel) return;
  if (!panel.hidden) panel.hidden = true;
}

function syncOverlays() {
  if (state.mode === "paused") {
    showOverlay(ui.pausePanel);
  } else {
    hideOverlay(ui.pausePanel);
  }
  if (state.mode === "gameOver") {
    if (ui.gameOverSub) setHT(ui.gameOverSub, "goSub", state.message || "地球已沦陷");
    if (ui.goKills) setHT(ui.goKills, "goK", state.kills);
    if (ui.goStage) setHT(ui.goStage, "goS", `${state.stageLevel}-${String(state.waveIndex).padStart(2, "0")}`);
    if (ui.goLevels) setHT(ui.goLevels, "goL", state.levelCount);
    if (ui.goMoney) setHT(ui.goMoney, "goM", Math.floor(state.money));
    showOverlay(ui.gameOverPanel);
  } else {
    hideOverlay(ui.gameOverPanel);
  }
  if (state.mode === "victory") {
    if (ui.vKills) setHT(ui.vKills, "vK", state.kills);
    if (ui.vLevels) setHT(ui.vLevels, "vL", state.levelCount);
    if (ui.vMoney) setHT(ui.vMoney, "vM", Math.floor(state.money));
    showOverlay(ui.victoryPanel);
  } else {
    hideOverlay(ui.victoryPanel);
  }
}

function updateMiniBossTag() {
  const tag = ui.miniBossTag;
  if (!tag || !ui.stage) return;
  // Pick the closest live mini-boss to Earth so the tag tracks the most threatening one.
  let target = null;
  let bestDist = Infinity;
  for (let i = 0; i < state.enemies.length; i++) {
    const e = state.enemies[i];
    if (!e.isMiniBoss || e.hp <= 0) continue;
    if (e.radius < bestDist) {
      bestDist = e.radius;
      target = e;
    }
  }
  if (!target || state.mode !== "playing") {
    if (!tag.hidden) tag.hidden = true;
    return;
  }
  const palette = miniBossPalette[target.miniBossKind] || miniBossPalette.meteor;
  const stageRect = ui.stage.getBoundingClientRect();
  const sx = stageRect.width / W;
  const sy = stageRect.height / H;
  const screenX = target.x * sx;
  const screenY = target.y * sy;
  tag.style.left = `${screenX}px`;
  tag.style.top = `${screenY - target.size * 0.6 * sy}px`;
  const hpPct = Math.max(0, Math.min(1, target.hp / target.maxHp));
  setHT(tag, "mbtag", `${palette.label} · HP ${Math.ceil(hpPct * 100)}%`);
  if (tag.hidden) tag.hidden = false;
}

function updateBossHud() {
  if (!ui.bossPanel || !ui.bossHpFill || !ui.bossName || !ui.bossHpText) return;
  const boss = state.boss;
  if (!boss || boss.hp <= 0) {
    if (!ui.bossPanel.hidden) ui.bossPanel.hidden = true;
    return;
  }
  if (ui.bossPanel.hidden) ui.bossPanel.hidden = false;
  const pct = Math.max(0, Math.min(1, boss.hp / boss.maxHp));
  setHT(ui.bossName, "bn", `${boss.bossConfig.name}  ${boss.bossConfig.ability}`);
  setHT(ui.bossHpText, "bhp", `${Math.ceil(pct * 100)}%`);
  setHS(ui.bossHpFill, "bhf", "width", `${Math.round(pct * 1000) / 10}%`);
}

function updateLevelProgress() {
  if (!ui.levelProgressFill || !ui.levelProgressText) return;
  let width, text;
  if (state.mode === "levelUp") {
    width = "100%";
    text = "选择";
  } else if (state.mode === "victory") {
    width = "100%";
    text = "通关";
  } else if (state.nextLevelIndex >= levelTriggers.length) {
    width = "100%";
    text = "MAX";
  } else {
    const previous = state.nextLevelIndex === 0 ? 0 : levelTriggers[state.nextLevelIndex - 1];
    const next = levelTriggers[state.nextLevelIndex];
    const pct = Math.max(0, Math.min(1, (state.gameTime - previous) / (next - previous)));
    width = `${Math.round(pct * 100)}%`;
    text = state.mode === "shop" ? "商店" : `${Math.round(pct * 100)}%`;
  }
  setHS(ui.levelProgressFill, "lpf", "width", width);
  setHT(ui.levelProgressText, "lpt", text);
}

/* ═══════════════════════════════════════════════════════════════
   Level Up Panel
   ═══════════════════════════════════════════════════════════════ */
function startLevelUp(options = {}) {
  state.mode = "levelUp";
  state.levelUpSource = options.source || "timer";
  hideShopPanel();
  const extraChoices = options.source === "boss" ? 1 : Math.floor(state.levelCount / 12);
  const optionCount = Math.min(5, 3 + extraChoices);
  state.levelOptions = state.levelCount === 0 && options.source !== "boss" ? firstChoices : drawUpgradeOptions(optionCount);
  state.message = options.source === "boss" ? "Boss 核心掉落：选择强化路线" : "Level Up：地球防卫系统升级";
  if (ui.levelTitleSub) {
    setHT(ui.levelTitleSub, "lts", options.source === "boss" ? "Boss 核心掉落 · 选择强化" : "地球防卫系统升级 · 选择一张");
  }
  audio.levelUp();
  renderLevelPanel();
  updateHud();
}

function drawUpgradeOptions(count = 3) {
  const pool = unlockedPool(state.levelCount).filter((u) => u.repeatable || !state.selectedIds.has(u.id));
  const targetCount = Math.min(count, Math.max(1, pool.length));
  const weighted = [];
  const rarityWeight = { common: 9, rare: 6, epic: 3, legendary: 1.5, mythic: 0.6 };
  for (const item of pool) {
    const count = Math.max(1, Math.round(rarityWeight[item.rarity] || 2));
    for (let i = 0; i < count; i++) weighted.push(item);
  }
  const chosen = [];
  const usedCategories = new Set();
  while (chosen.length < targetCount && weighted.length) {
    const item = weighted.splice(Math.floor(Math.random() * weighted.length), 1)[0];
    if (chosen.some((u) => u.id === item.id)) continue;
    if (chosen.length < 2 && usedCategories.has(item.category) && Math.random() < 0.72) continue;
    chosen.push(item);
    usedCategories.add(item.category);
  }
  while (chosen.length < targetCount) {
    const item = pool.find((u) => !chosen.some((existing) => existing.id === u.id)) || pool[Math.floor(Math.random() * pool.length)] || upgrades[0];
    chosen.push(item);
  }
  return chosen;
}

function iconSrc(option) {
  const iconName = iconMap[option.category] || "special-icon";
  return `${individualAssetBase}/${iconName}.png?v=${ASSET_VERSION}`;
}

function upgradeVfxSrc(option) {
  const vfxName = upgradeVfxMap[option.category] || "card-reveal";
  return `assets/generated/upgrades/final/${vfxName}.png?v=${ASSET_VERSION}`;
}

function renderLevelPanel() {
  ui.levelPanel.hidden = false;
  ui.levelCards.classList.toggle("is-expanded", state.levelOptions.length > 3);
  ui.levelCards.replaceChildren();
  for (const [index, option] of state.levelOptions.entries()) {
    ui.levelCards.append(createUpgradeCard(option, () => chooseUpgrade(index)));
  }
}

function hideLevelPanel() {
  ui.levelPanel.hidden = true;
  ui.levelCards.classList.remove("is-expanded");
  ui.levelCards.replaceChildren();
}

function createUpgradeCard(option, onClick, compact = false) {
  const card = document.createElement("button");
  const affordable = state.money >= option.price;
  card.className = `upgrade-card ${compact ? "shop-card " : ""}${rarityClass[option.rarity] || "is-common"}`;
  card.type = "button";
  card.disabled = !affordable;
  card.style.setProperty("--upgrade-vfx", `url("${upgradeVfxSrc(option)}")`);
  card.innerHTML = `
    <span class="upgrade-name"></span>
    <span class="upgrade-art"><img alt="" /></span>
    <span class="upgrade-category"></span>
    <span class="upgrade-effect"></span>
    <span class="upgrade-price"></span>
  `;
  card.querySelector(".upgrade-name").textContent = option.name;
  card.querySelector("img").src = iconSrc(option);
  card.querySelector(".upgrade-category").textContent = option.category;
  card.querySelector(".upgrade-effect").textContent = option.effect;
  card.querySelector(".upgrade-price").textContent = `¥${option.price}`;
  card.addEventListener("click", onClick);
  return card;
}

/* ═══════════════════════════════════════════════════════════════
   Shop Panel
   ═══════════════════════════════════════════════════════════════ */
function openShopPanel() {
  if (state.mode === "levelUp") {
    state.message = "先完成本次 Level Up 选择";
    updateHud();
    return;
  }
  if (state.mode === "gameOver" || state.mode === "paused" || state.mode === "victory") return;
  state.mode = "shop";
  state.shopOptions = state.shopOptions.filter((u) => u.repeatable || !state.selectedIds.has(u.id));
  if (state.shopOptions.length < 3) state.shopOptions = drawUpgradeOptions(6);
  state.message = "商店开放：可直接购买升级";
  renderShopPanel();
  updateHud();
}

function hideShopPanel() {
  ui.shopPanel.hidden = true;
  ui.shopCards.replaceChildren();
}

function closeShopPanel() {
  if (state.mode !== "shop") return;
  state.mode = "playing";
  state.message = "商店关闭，防线继续作战";
  hideShopPanel();
  updateHud();
}

function renderShopPanel() {
  ui.shopPanel.hidden = false;
  ui.shopCards.replaceChildren();
  if (!state.shopOptions.length) state.shopOptions = drawUpgradeOptions(6);
  for (const [index, option] of state.shopOptions.entries()) {
    ui.shopCards.append(createUpgradeCard(option, () => buyShopUpgrade(index), true));
  }
  updateHud();
}

function refreshShop(force = false) {
  if (!force && state.money < shopRefreshCost) {
    state.message = "资金不足，无法刷新商店";
    renderShopPanel();
    return;
  }
  if (!force) state.money = Math.max(0, state.money - shopRefreshCost);
  state.shopOptions = drawUpgradeOptions(6);
  state.message = "商店货架已刷新";
  audio.select();
  renderShopPanel();
}

function buyShopUpgrade(index) {
  const upgrade = state.shopOptions[index];
  if (!upgrade || state.mode !== "shop") return;
  if (state.money < upgrade.price) {
    state.message = "资金不足，无法购买该升级";
    renderShopPanel();
    return;
  }
  state.money = Math.max(0, state.money - upgrade.price);
  state.selectedIds.add(upgrade.id);
  applyUpgrade(upgrade);
  state.levelCount += 1;
  state.message = `商店购买：${upgrade.name}`;
  triggerUpgradeShowcase(upgrade);
  state.shopOptions.splice(index, 1);
  if (state.shopOptions.length < 3) state.shopOptions = drawUpgradeOptions(6);
  renderShopPanel();
}

function chooseUpgrade(index) {
  const upgrade = state.levelOptions[index];
  if (!upgrade || state.mode !== "levelUp") return;
  if (state.money < upgrade.price) {
    state.message = "资金不足，继续拦截敌人";
    updateHud();
    renderLevelPanel();
    return;
  }
  state.money = Math.max(0, state.money - upgrade.price);
  state.selectedIds.add(upgrade.id);
  applyUpgrade(upgrade);
  state.levelCount += 1;
  state.nextLevelIndex += 1;
  state.levelUpSource = "timer";
  state.mode = "playing";
  state.message = `已升级：${upgrade.name}`;
  hideLevelPanel();
  triggerUpgradeShowcase(upgrade);
  updateHud();
}

/* ═══════════════════════════════════════════════════════════════
   Upgrade Showcase — every upgrade gets a dedicated effect.
   Resolved by upgrade name first, then category fallback.
   ═══════════════════════════════════════════════════════════════ */
const categoryAuraColor = {
  Gun: 0x9bf7ff,
  Laser: 0xc4ffff,
  Beam: 0x83f7ff,
  弹道: 0xfff0a8,
  防御: 0x76e8ff,
  爆炸: 0xff8a3a,
  经济: 0xffd86a,
  地球: 0x6affc4,
  近地卫星: 0xb4f0ff,
  特殊: 0xc88fff,
  风险收益: 0xff5f8a,
};

function ringBurst(centerX, centerY, count, radius, scale, color = 0xfff5b8) {
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count;
    const px = centerX + Math.cos(a) * radius;
    const py = centerY + Math.sin(a) * radius;
    addExplosion(px, py, scale);
    spawnInterceptFlash(px, py, scale * 0.9);
  }
  // tint follow-up flashes
  void color;
}

function radialBeams(centerAngle, count, spread, options) {
  spawnBeamFan(centerAngle, count, spread, options);
}

function damageRing(damage, factor = 1) {
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const enemy = state.enemies[i];
    enemy.hp -= damage * (enemy.isBoss || enemy.isMiniBoss ? factor : 1);
    spawnInterceptFlash(enemy.x, enemy.y, 0.7);
    if (enemy.hp <= 0) killEnemy(i);
  }
}

function showcaseAuraPulse(category, intensity = 1) {
  const color = categoryAuraColor[category] || 0xffffff;
  // central pulse
  addExplosion(C.x, C.y, 0.9 + intensity * 0.25);
  // colored ring of intercept flashes around earth
  for (let i = 0; i < 14; i++) {
    const a = (Math.PI * 2 * i) / 14 + Math.random() * 0.08;
    const r = earthRadius + 56 + (i % 2) * 14;
    spawnInterceptFlash(C.x + Math.cos(a) * r, C.y + Math.sin(a) * r, 0.65 + intensity * 0.25);
  }
  // a wide "shockwave" beam fan painted with the category color
  spawnBeamFan(0, 18, Math.PI * 2 * (17 / 18), { life: 0.6, color, opacity: 0.32, wide: true });
}

const upgradeShowcasesByName = {
  // Gun branch
  "Gun": (u) => {
    const launch = Math.min(14, Math.max(8, state.defenders.length));
    for (let i = 0; i < launch; i++) {
      const a = -Math.PI / 2 + (i - (launch - 1) / 2) * 0.16;
      const from = pointOnCircle(a, earthRadius + 26);
      const to = pointOnCircle(a, earthRadius + 220 + (i % 3) * 24);
      createEnergyBeam(a, { from, to, life: 0.95, color: 0x75f8ff, opacity: 0.88 });
      addExplosion(to.x, to.y, 0.46);
    }
    showcaseAuraPulse(u.category);
    audio.upgrade();
  },
  "双联机炮": (u) => {
    for (let i = 0; i < state.defenders.length; i++) {
      const d = state.defenders[i];
      createEnergyBeam(d.angle, { from: d, to: { x: d.x + Math.cos(d.angle) * 80, y: d.y + Math.sin(d.angle) * 80 }, life: 0.42, color: 0xb6f8ff, opacity: 0.84 });
    }
    showcaseAuraPulse(u.category);
    audio.upgrade();
  },
  "高速供弹": (u) => {
    for (let i = 0; i < 22; i++) {
      const a = (Math.PI * 2 * i) / 22;
      const r = earthRadius + 28 + i * 6;
      spawnInterceptFlash(C.x + Math.cos(a) * (earthRadius + 30), C.y + Math.sin(a) * (earthRadius + 30), 0.45);
      void r;
    }
    showcaseAuraPulse(u.category, 0.8);
    audio.upgrade();
  },
  "穿甲弹头": (u) => {
    spawnBeamFan(-Math.PI / 2, 10, 0.95, { life: 0.42, color: 0xfff5b0, opacity: 0.85 });
    damageRing(2, 1.2);
    showcaseAuraPulse(u.category);
    audio.upgrade();
  },
  "扇形齐射": (u) => {
    spawnBeamFan(-Math.PI / 2, 18, Math.PI * 0.85, { life: 0.6, color: 0x9bf8ff, opacity: 0.7 });
    showcaseAuraPulse(u.category);
    audio.upgrade();
  },
  "轨道编队": (u) => {
    for (let i = 0; i < 24; i++) {
      const a = (Math.PI * 2 * i) / 24;
      const r = earthRadius + 40 + (i % 2 === 0 ? 0 : 90);
      spawnInterceptFlash(C.x + Math.cos(a) * r, C.y + Math.sin(a) * r, 0.7);
    }
    showcaseAuraPulse(u.category, 1.1);
    audio.upgrade();
  },
  "近防炮阵": (u) => {
    damageRing(3, 1);
    ringBurst(C.x, C.y, 16, earthRadius + 70, 0.7);
    showcaseAuraPulse(u.category);
    audio.upgrade();
    setTimeout(() => audio.boom(), 100);
  },
  "钨芯风暴": (u) => {
    for (let i = 0; i < 28; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = earthRadius + 80 + Math.random() * 240;
      addExplosion(C.x + Math.cos(a) * r, C.y + Math.sin(a) * r, 0.4 + Math.random() * 0.3);
    }
    damageRing(2.4);
    showcaseAuraPulse(u.category, 1.3);
    audio.upgrade();
    setTimeout(() => audio.boom(), 120);
    triggerScreenShake(0.32, 6);
  },
  "近地机群": (u) => {
    triggerScreenShake(0.5, 9);
    for (let i = 0; i < 24; i++) {
      const a = (Math.PI * 2 * i) / 24;
      const from = pointOnCircle(a, earthRadius + 24);
      const to = pointOnCircle(a, earthRadius + 220);
      createEnergyBeam(a, { from, to, life: 1.1, color: 0x9bffff, opacity: 0.92 });
      addExplosion(to.x, to.y, 0.55);
    }
    addExplosion(C.x, C.y, 1.6);
    damageRing(3, 1.4);
    audio.upgrade();
    setTimeout(() => audio.boom(), 140);
  },

  // Laser branch
  "Laser": (u) => {
    spawnBeamFan(-Math.PI / 2, 5, 0.34, { life: 1.2, color: 0xc9ffff, opacity: 0.95 });
    damageInBeam(-Math.PI / 2, 0.14, 6);
    showcaseAuraPulse(u.category);
    audio.upgrade();
    setTimeout(() => audio.laser(), 140);
  },
  "聚焦透镜": (u) => {
    const target = nearestEnemy(C, 720);
    const angle = target ? angleTo(C, target) : -Math.PI / 2;
    spawnBeamFan(angle, 1, 0, { life: 1.6, color: 0xffffff, opacity: 1 });
    damageInBeam(angle, 0.05, 30);
    showcaseAuraPulse(u.category);
    audio.upgrade();
    setTimeout(() => audio.laser(), 110);
  },
  "扫描镜组": (u) => {
    for (let k = 0; k < 6; k++) {
      setTimeout(() => {
        const a = -Math.PI / 2 + (k - 2.5) * 0.55;
        spawnBeamFan(a, 1, 0, { life: 0.4, color: 0xc9ffff, opacity: 0.85 });
        damageInBeam(a, 0.16, 4);
      }, k * 70);
    }
    showcaseAuraPulse(u.category);
    audio.upgrade();
  },
  "双束激光": (u) => {
    spawnBeamFan(-Math.PI / 2, 1, 0, { life: 1.2, color: 0xc9ffff, opacity: 0.95 });
    spawnBeamFan(Math.PI / 2, 1, 0, { life: 1.2, color: 0xc9ffff, opacity: 0.95 });
    damageInBeam(-Math.PI / 2, 0.08, 8);
    damageInBeam(Math.PI / 2, 0.08, 8);
    showcaseAuraPulse(u.category);
    audio.upgrade();
    setTimeout(() => audio.laser(), 120);
  },
  "余辉灼烧": (u) => {
    spawnBeamFan(-Math.PI / 2, 7, 0.55, { life: 1.6, color: 0xffd88a, opacity: 0.66 });
    damageInBeam(-Math.PI / 2, 0.32, 5);
    showcaseAuraPulse(u.category);
    audio.upgrade();
  },
  "折射棱镜": (u) => {
    spawnBeamFan(-Math.PI / 2, 9, 1.4, { life: 0.92, color: 0xa6ffff, opacity: 0.85 });
    damageRing(3);
    showcaseAuraPulse(u.category);
    audio.upgrade();
  },
  "极光切割": (u) => {
    for (let i = 0; i < 12; i++) {
      setTimeout(() => spawnBeamFan(-Math.PI / 2 + (i - 5.5) * 0.18, 1, 0, { life: 0.4, color: 0x9bffd0, opacity: 0.9 }), i * 50);
    }
    damageRing(2.4);
    showcaseAuraPulse(u.category);
    audio.upgrade();
  },
  "白昼光矛": (u) => {
    addExplosion(C.x, C.y, 1.6);
    spawnBeamFan(-Math.PI / 2, 1, 0, { life: 1.6, color: 0xffffff, opacity: 1 });
    damageRing(8, 1.6);
    triggerScreenShake(0.45, 9);
    showcaseAuraPulse(u.category, 1.4);
    audio.upgrade();
    setTimeout(() => audio.boom(), 120);
  },
  "轨道裁决": (u) => {
    for (let k = 0; k < 8; k++) {
      const a = (Math.PI * 2 * k) / 8;
      spawnBeamFan(a, 1, 0, { life: 1.4, color: 0xc9ffff, opacity: 0.92 });
      damageInBeam(a, 0.06, 9);
    }
    triggerScreenShake(0.5, 10);
    showcaseAuraPulse(u.category, 1.5);
    audio.upgrade();
    setTimeout(() => audio.laser(), 120);
  },

  // Beam branch
  "Beam": (u) => {
    spawnBeamFan(-Math.PI / 2, 11, 0.7, { life: 1.4, color: 0x83f7ff, opacity: 0.66, wide: true });
    damageInBeam(-Math.PI / 2, 0.28, 10);
    showcaseAuraPulse(u.category);
    audio.upgrade();
    setTimeout(() => audio.beam(), 160);
  },
  "扩束核心": (u) => {
    spawnBeamFan(-Math.PI / 2, 17, 1.05, { life: 1.6, color: 0xa1ffff, opacity: 0.6, wide: true });
    damageInBeam(-Math.PI / 2, 0.52, 7);
    showcaseAuraPulse(u.category);
    audio.upgrade();
    setTimeout(() => audio.beam(), 140);
  },
  "蓄能线圈": (u) => {
    spawnBeamFan(-Math.PI / 2, 13, 0.78, { life: 2.4, color: 0x83f7ff, opacity: 0.55, wide: true });
    damageInBeam(-Math.PI / 2, 0.34, 4);
    showcaseAuraPulse(u.category);
    audio.upgrade();
  },
  "扇区净化": (u) => {
    spawnBeamFan(-Math.PI / 2, 21, 1.5, { life: 1.5, color: 0xb6ffff, opacity: 0.62, wide: true });
    damageInBeam(-Math.PI / 2, 0.7, 8);
    showcaseAuraPulse(u.category, 1.2);
    audio.upgrade();
  },
  "脉冲二段": (u) => {
    spawnBeamFan(-Math.PI / 2, 11, 0.7, { life: 1.0, color: 0x83f7ff, opacity: 0.66, wide: true });
    damageInBeam(-Math.PI / 2, 0.3, 6);
    setTimeout(() => {
      spawnBeamFan(-Math.PI / 2, 13, 0.85, { life: 0.8, color: 0xfff5a0, opacity: 0.7, wide: true });
      damageInBeam(-Math.PI / 2, 0.42, 8);
      audio.boom();
    }, 380);
    showcaseAuraPulse(u.category);
    audio.upgrade();
  },
  "冲击波前": (u) => {
    triggerScreenShake(0.4, 8);
    spawnBeamFan(-Math.PI / 2, 17, 1.2, { life: 1.0, color: 0xb6ffff, opacity: 0.8, wide: true });
    damageRing(2);
    showcaseAuraPulse(u.category);
    audio.upgrade();
  },
  "蓝核裂变": (u) => {
    triggerScreenShake(0.42, 9);
    for (let i = 0; i < 14; i++) {
      const a = (Math.PI * 2 * i) / 14;
      addExplosion(C.x + Math.cos(a) * 220, C.y + Math.sin(a) * 220, 0.7);
    }
    damageRing(5, 1.4);
    showcaseAuraPulse(u.category, 1.4);
    audio.upgrade();
    setTimeout(() => audio.boom(), 140);
  },
  "两极喷流": (u) => {
    spawnBeamFan(-Math.PI / 2, 11, 0.6, { life: 1.4, color: 0x83f7ff, opacity: 0.7, wide: true });
    spawnBeamFan(Math.PI / 2, 11, 0.6, { life: 1.4, color: 0x83f7ff, opacity: 0.7, wide: true });
    damageInBeam(-Math.PI / 2, 0.36, 9);
    damageInBeam(Math.PI / 2, 0.36, 9);
    showcaseAuraPulse(u.category, 1.3);
    audio.upgrade();
    setTimeout(() => audio.beam(), 160);
  },
  "终末光柱": (u) => {
    triggerScreenShake(0.65, 13);
    spawnBeamFan(-Math.PI / 2, 25, Math.PI * 0.65, { life: 1.8, color: 0xc4ffff, opacity: 0.78, wide: true });
    damageRing(10, 2);
    showcaseAuraPulse(u.category, 2);
    audio.upgrade();
    setTimeout(() => audio.beam(), 160);
    setTimeout(() => audio.boom(), 240);
  },

  // 弹道 ballistic
  "分裂弹": (u) => {
    spawnBeamFan(-Math.PI / 2, 7, 0.5, { life: 0.5, color: 0xfff0a8, opacity: 0.7 });
    showcaseAuraPulse(u.category);
    audio.upgrade();
  },
  "追踪弹": (u) => {
    for (let i = 0; i < 16; i++) {
      const a = (Math.PI * 2 * i) / 16;
      spawnInterceptFlash(C.x + Math.cos(a) * 150, C.y + Math.sin(a) * 150, 0.55);
    }
    showcaseAuraPulse(u.category);
    audio.upgrade();
  },
  "回旋弹": (u) => {
    for (let r = 60; r <= 240; r += 30) {
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8 + r * 0.005;
        spawnInterceptFlash(C.x + Math.cos(a) * r, C.y + Math.sin(a) * r, 0.4);
      }
    }
    showcaseAuraPulse(u.category);
    audio.upgrade();
  },
  "冰蓝减速": (u) => {
    for (const e of state.enemies) e.speed = Math.max(8, e.speed * 0.55);
    spawnBeamFan(-Math.PI / 2, 22, Math.PI * 2, { life: 0.8, color: 0x9bd6ff, opacity: 0.4, wide: true });
    showcaseAuraPulse(u.category, 1.2);
    audio.upgrade();
  },
  "电弧跳跃": (u) => {
    let prev = C;
    for (let i = 0; i < 6; i++) {
      const target = nearestEnemy(prev, 800);
      if (!target) break;
      createEnergyBeam(angleTo(prev, target), { from: prev, to: target, life: 0.55, color: 0xb6f0ff, opacity: 0.95 });
      addExplosion(target.x, target.y, 0.45);
      target.hp -= 4;
      if (target.hp <= 0) {
        const idx = state.enemies.indexOf(target);
        if (idx >= 0) killEnemy(idx);
      }
      prev = target;
    }
    showcaseAuraPulse(u.category);
    audio.upgrade();
  },
  "重力弯曲": (u) => {
    for (let i = 0; i < 32; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 80 + Math.random() * 220;
      spawnInterceptFlash(C.x + Math.cos(a) * r, C.y + Math.sin(a) * r, 0.5);
    }
    showcaseAuraPulse(u.category);
    audio.upgrade();
  },
  "星尘散射": (u) => {
    for (let i = 0; i < 36; i++) {
      const a = Math.random() * Math.PI * 2;
      addExplosion(C.x + Math.cos(a) * (140 + Math.random() * 200), C.y + Math.sin(a) * (140 + Math.random() * 200), 0.3 + Math.random() * 0.3);
    }
    damageRing(2);
    showcaseAuraPulse(u.category, 1.2);
    audio.upgrade();
  },
  "量子回弹": (u) => {
    spawnBeamFan(-Math.PI / 2, 16, Math.PI * 1.6, { life: 1.0, color: 0xffe6ff, opacity: 0.55 });
    showcaseAuraPulse(u.category, 1.2);
    audio.upgrade();
  },
  "青焰洪流": (u) => {
    triggerScreenShake(0.38, 7);
    for (let k = 0; k < 5; k++) {
      setTimeout(() => spawnBeamFan(-Math.PI / 2, 9, 0.7, { life: 0.5, color: 0x6effd0, opacity: 0.78 }), k * 80);
    }
    damageRing(3.5, 1.3);
    showcaseAuraPulse(u.category, 1.4);
    audio.upgrade();
    setTimeout(() => audio.beam(), 140);
  },

  // 防御 defense
  "护盾发生器": (u) => {
    shieldInner.material.opacity = 0.95;
    showcaseAuraPulse(u.category);
    audio.upgrade();
  },
  "装甲地壳": (u) => {
    triggerScreenShake(0.3, 6);
    addExplosion(C.x, C.y, 1.4);
    showcaseAuraPulse(u.category, 1.2);
    audio.upgrade();
  },
  "近地拦截": (u) => {
    damageRing(2, 0.5);
    for (let i = 0; i < 18; i++) {
      const a = (Math.PI * 2 * i) / 18;
      spawnInterceptFlash(C.x + Math.cos(a) * (earthRadius + 50), C.y + Math.sin(a) * (earthRadius + 50), 0.55);
    }
    showcaseAuraPulse(u.category);
    audio.upgrade();
  },
  "护盾回流": (u) => {
    shieldInner.material.opacity = 0.95;
    showcaseAuraPulse(u.category);
    audio.upgrade();
  },
  "环形屏障": (u) => {
    spawnBeamFan(-Math.PI / 2, 30, Math.PI * 2, { life: 1.6, color: 0x76e8ff, opacity: 0.32 });
    showcaseAuraPulse(u.category, 1.2);
    audio.upgrade();
  },
  "应急修复": (u) => {
    state.health = Math.min(state.maxHealth, state.health + 30);
    showcaseAuraPulse(u.category);
    audio.upgrade();
  },
  "反射护幕": (u) => {
    triggerScreenShake(0.32, 7);
    spawnBeamFan(-Math.PI / 2, 30, Math.PI * 2, { life: 1.0, color: 0xb6f8ff, opacity: 0.55 });
    damageRing(2);
    showcaseAuraPulse(u.category, 1.2);
    audio.upgrade();
  },
  "月影掩体": (u) => {
    addExplosion(C.x, C.y - 220, 1.4);
    addExplosion(C.x, C.y + 220, 1.4);
    showcaseAuraPulse(u.category, 1.1);
    audio.upgrade();
  },
  "盖亚圣盾": (u) => {
    triggerScreenShake(0.45, 9);
    shieldInner.material.opacity = 1;
    spawnBeamFan(-Math.PI / 2, 36, Math.PI * 2, { life: 1.6, color: 0x9bffff, opacity: 0.55 });
    state.health = Math.min(state.maxHealth, state.health + 20);
    showcaseAuraPulse(u.category, 1.5);
    audio.upgrade();
  },

  // 爆炸 explosion
  "爆破弹头": (u) => {
    ringBurst(C.x, C.y, 12, earthRadius + 110, 0.6);
    showcaseAuraPulse(u.category);
    audio.upgrade();
    setTimeout(() => audio.boom(), 100);
  },
  "连锁火花": (u) => {
    for (let r = 100; r <= 320; r += 50) {
      ringBurst(C.x, C.y, 10, r, 0.42);
    }
    showcaseAuraPulse(u.category, 1.2);
    audio.upgrade();
    setTimeout(() => audio.boom(), 120);
  },
  "白金闪爆": (u) => {
    addExplosion(C.x, C.y, 2.0);
    for (let i = 0; i < 24; i++) {
      const a = (Math.PI * 2 * i) / 24;
      spawnInterceptFlash(C.x + Math.cos(a) * (earthRadius + 70), C.y + Math.sin(a) * (earthRadius + 70), 0.85);
    }
    triggerScreenShake(0.3, 7);
    showcaseAuraPulse(u.category, 1.4);
    audio.upgrade();
    setTimeout(() => audio.boom(), 110);
  },
  "震荡核心": (u) => {
    triggerScreenShake(0.5, 10);
    addExplosion(C.x, C.y, 1.8);
    for (const e of state.enemies) e.speed = Math.max(6, e.speed * 0.6);
    showcaseAuraPulse(u.category, 1.4);
    audio.upgrade();
    setTimeout(() => audio.boom(), 130);
  },
  "破片云": (u) => {
    for (let i = 0; i < 36; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 100 + Math.random() * 240;
      addExplosion(C.x + Math.cos(a) * r, C.y + Math.sin(a) * r, 0.34 + Math.random() * 0.3);
    }
    damageRing(3);
    showcaseAuraPulse(u.category, 1.2);
    audio.upgrade();
    setTimeout(() => audio.boom(), 130);
  },
  "火环扩散": (u) => {
    for (let r = 120; r <= 360; r += 40) {
      ringBurst(C.x, C.y, 14, r, 0.42);
    }
    damageRing(2.4);
    showcaseAuraPulse(u.category, 1.4);
    audio.upgrade();
    setTimeout(() => audio.boom(), 130);
  },
  "超新星点火": (u) => {
    triggerScreenShake(0.7, 14);
    addExplosion(C.x, C.y, 3);
    for (let i = 0; i < 28; i++) {
      const a = (Math.PI * 2 * i) / 28;
      addExplosion(C.x + Math.cos(a) * 180, C.y + Math.sin(a) * 180, 0.7);
    }
    damageRing(7, 1.6);
    showcaseAuraPulse(u.category, 1.8);
    audio.upgrade();
    setTimeout(() => audio.boom(), 120);
  },
  "聚变余烬": (u) => {
    for (let k = 0; k < 5; k++) {
      setTimeout(() => {
        for (let i = 0; i < 14; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = 80 + Math.random() * 280;
          addExplosion(C.x + Math.cos(a) * r, C.y + Math.sin(a) * r, 0.3 + Math.random() * 0.25);
        }
      }, k * 220);
    }
    showcaseAuraPulse(u.category, 1.3);
    audio.upgrade();
  },
  "环带湮灭": (u) => {
    triggerScreenShake(0.85, 16);
    for (let i = 0; i < 60; i++) {
      const a = (Math.PI * 2 * i) / 60;
      const r = barrageInner + 20 + Math.random() * 60;
      addExplosion(C.x + Math.cos(a) * r, C.y + Math.sin(a) * r, 1.0);
      spawnInterceptFlash(C.x + Math.cos(a) * r, C.y + Math.sin(a) * r, 1.2);
    }
    damageRing(15, 1.8);
    showcaseAuraPulse(u.category, 2);
    audio.upgrade();
    setTimeout(() => audio.boom(), 140);
  },

  // 经济 economy — coin shower
  "金属回收": (u) => coinShower(u),
  "战场赏金": (u) => coinShower(u),
  "低价采购": (u) => coinShower(u),
  "稀有补贴": (u) => coinShower(u),
  "双倍残骸": (u) => coinShower(u, 2),
  "黑市改装": (u) => coinShower(u),
  "投资协议": (u) => coinShower(u, 1.4),
  "战争债券": (u) => {
    state.money += 18;
    coinShower(u, 2);
  },
  "无限预算": (u) => {
    state.money += 40;
    triggerScreenShake(0.34, 7);
    coinShower(u, 3);
  },

  // 地球 earth
  "地核脉冲": (u) => {
    addExplosion(C.x, C.y, 1.6);
    for (let i = 0; i < 24; i++) {
      const a = (Math.PI * 2 * i) / 24;
      spawnInterceptFlash(C.x + Math.cos(a) * (earthRadius + 50), C.y + Math.sin(a) * (earthRadius + 50), 0.6);
    }
    showcaseAuraPulse(u.category, 1.2);
    audio.upgrade();
  },
  "自转加速": (u) => {
    showcaseAuraPulse(u.category);
    audio.upgrade();
  },
  "磁层增强": (u) => {
    spawnBeamFan(-Math.PI / 2, 24, Math.PI * 2, { life: 1.4, color: 0x6affc4, opacity: 0.36 });
    showcaseAuraPulse(u.category, 1.1);
    audio.upgrade();
  },
  "城市灯火": (u) => {
    showcaseAuraPulse(u.category);
    audio.upgrade();
  },
  "极光护环": (u) => {
    spawnBeamFan(-Math.PI / 2, 32, Math.PI * 2, { life: 1.8, color: 0x9bffd0, opacity: 0.45 });
    showcaseAuraPulse(u.category, 1.2);
    audio.upgrade();
  },
  "重力井": (u) => {
    addExplosion(C.x, C.y, 1.6);
    for (const e of state.enemies) e.speed = Math.max(4, e.speed * 0.5);
    showcaseAuraPulse(u.category, 1.4);
    audio.upgrade();
  },
  "月轨牵引": (u) => {
    spawnBeamFan(-Math.PI / 2, 18, Math.PI * 2, { life: 1.4, color: 0xfffbcc, opacity: 0.48 });
    showcaseAuraPulse(u.category, 1.2);
    audio.upgrade();
  },
  "地平线炮": (u) => {
    triggerScreenShake(0.4, 9);
    for (let k = 0; k < 6; k++) {
      const a = (Math.PI * 2 * k) / 6;
      spawnBeamFan(a, 1, 0, { life: 1.0, color: 0xfff5b8, opacity: 0.92 });
      damageInBeam(a, 0.06, 7);
    }
    showcaseAuraPulse(u.category, 1.4);
    audio.upgrade();
    setTimeout(() => audio.boom(), 140);
  },
  "世界引擎": (u) => {
    triggerScreenShake(0.85, 14);
    for (let k = 0; k < 12; k++) {
      const a = (Math.PI * 2 * k) / 12;
      spawnBeamFan(a, 1, 0, { life: 1.6, color: 0xc9ffff, opacity: 0.95 });
      damageInBeam(a, 0.05, 9);
    }
    showcaseAuraPulse(u.category, 2);
    audio.upgrade();
    setTimeout(() => audio.beam(), 160);
  },

  // 近地卫星 satellite
  "修复卫星": (u) => {
    state.health = Math.min(state.maxHealth, state.health + 20);
    showcaseAuraPulse(u.category);
    audio.upgrade();
  },
  "回收卫星": (u) => coinShower(u),
  "标记卫星": (u) => {
    for (const e of state.enemies) spawnInterceptFlash(e.x, e.y, 0.5);
    showcaseAuraPulse(u.category);
    audio.upgrade();
  },
  "干扰卫星": (u) => {
    for (const e of state.enemies) e.speed = Math.max(6, e.speed * 0.7);
    showcaseAuraPulse(u.category, 1.1);
    audio.upgrade();
  },
  "近轨炮台": (u) => {
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI * 2 * i) / 12;
      const from = pointOnCircle(a, earthRadius + 90);
      const to = pointOnCircle(a, earthRadius + 240);
      createEnergyBeam(a, { from, to, life: 0.7, color: 0xb6f8ff, opacity: 0.85 });
    }
    showcaseAuraPulse(u.category);
    audio.upgrade();
  },
  "牵引卫星": (u) => {
    for (const e of state.enemies) e.speed = Math.max(3, e.speed * 0.45);
    showcaseAuraPulse(u.category, 1.1);
    audio.upgrade();
  },
  "卫星阵列": (u) => {
    for (let i = 0; i < 18; i++) {
      const a = (Math.PI * 2 * i) / 18;
      spawnInterceptFlash(C.x + Math.cos(a) * (earthRadius + 100), C.y + Math.sin(a) * (earthRadius + 100), 0.6);
    }
    showcaseAuraPulse(u.category, 1.2);
    audio.upgrade();
  },
  "轨道维修站": (u) => {
    state.health = Math.min(state.maxHealth, state.health + 50);
    showcaseAuraPulse(u.category, 1.2);
    audio.upgrade();
  },
  "机械防卫环": (u) => {
    triggerScreenShake(0.4, 8);
    for (let i = 0; i < 24; i++) {
      const a = (Math.PI * 2 * i) / 24;
      const from = pointOnCircle(a, earthRadius + 110);
      const to = pointOnCircle(a, earthRadius + 280);
      createEnergyBeam(a, { from, to, life: 1.0, color: 0xc9ffff, opacity: 0.88 });
    }
    showcaseAuraPulse(u.category, 1.5);
    audio.upgrade();
  },

  // 特殊 special
  "时间减速": (u) => {
    for (const e of state.enemies) e.speed = Math.max(2, e.speed * 0.4);
    spawnBeamFan(-Math.PI / 2, 32, Math.PI * 2, { life: 1.4, color: 0xc88fff, opacity: 0.45 });
    showcaseAuraPulse(u.category, 1.4);
    audio.upgrade();
  },
  "轨道调度": (u) => {
    const half = Math.floor(state.enemies.length / 2);
    for (let i = 0; i < half; i++) {
      const e = state.enemies[i];
      addExplosion(e.x, e.y, 0.7);
      spawnInterceptFlash(e.x, e.y, 0.8);
    }
    damageRing(20, 0.2);
    showcaseAuraPulse(u.category, 1.6);
    audio.upgrade();
    setTimeout(() => audio.boom(), 140);
  },
  "轨道冻结": (u) => {
    for (const e of state.enemies) e.speed = 0;
    setTimeout(() => { for (const e of state.enemies) e.speed = Math.max(8, e.speed); }, 1100);
    spawnBeamFan(-Math.PI / 2, 32, Math.PI * 2, { life: 1.6, color: 0x9bd6ff, opacity: 0.55 });
    showcaseAuraPulse(u.category, 1.4);
    audio.upgrade();
  },
  "引力爆点": (u) => {
    addExplosion(C.x, C.y, 2.4);
    triggerScreenShake(0.6, 12);
    damageRing(10, 1.4);
    showcaseAuraPulse(u.category, 1.8);
    audio.upgrade();
    setTimeout(() => audio.boom(), 140);
  },
  "反物质雷": (u) => {
    triggerScreenShake(0.6, 12);
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI * 2 * i) / 10;
      addExplosion(C.x + Math.cos(a) * 320, C.y + Math.sin(a) * 320, 1.0);
    }
    damageRing(8, 1.6);
    showcaseAuraPulse(u.category, 1.7);
    audio.upgrade();
  },
  "反导重定向": (u) => {
    for (const e of state.enemies) {
      e.angle += Math.PI;
      spawnInterceptFlash(e.x, e.y, 0.5);
    }
    showcaseAuraPulse(u.category, 1.3);
    audio.upgrade();
  },
  "末日倒计时": (u) => {
    for (let k = 0; k < 4; k++) {
      setTimeout(() => {
        for (let i = 0; i < 16; i++) {
          const a = (Math.PI * 2 * i) / 16;
          const r = 200 + k * 60;
          addExplosion(C.x + Math.cos(a) * r, C.y + Math.sin(a) * r, 0.6);
        }
        damageRing(2);
      }, k * 240);
    }
    triggerScreenShake(0.8, 14);
    showcaseAuraPulse(u.category, 2);
    audio.upgrade();
  },
  "虚空切片": (u) => {
    triggerScreenShake(0.5, 10);
    for (let k = 0; k < 6; k++) {
      const a = (Math.PI * 2 * k) / 6;
      spawnBeamFan(a, 1, 0, { life: 1.4, color: 0xa672ff, opacity: 0.95 });
      damageInBeam(a, 0.18, 100);
    }
    showcaseAuraPulse(u.category, 2);
    audio.upgrade();
    setTimeout(() => audio.beam(), 140);
  },
  "时间回卷": (u) => {
    state.health = Math.min(state.maxHealth, state.health + 60);
    triggerScreenShake(0.6, 12);
    spawnBeamFan(-Math.PI / 2, 36, Math.PI * 2, { life: 2, color: 0xff7fcf, opacity: 0.55 });
    showcaseAuraPulse(u.category, 2);
    audio.upgrade();
  },

  // 风险收益 risk
  "过载射击": (u) => {
    for (let i = 0; i < 18; i++) {
      const a = (Math.PI * 2 * i) / 18;
      spawnInterceptFlash(C.x + Math.cos(a) * (earthRadius + 60), C.y + Math.sin(a) * (earthRadius + 60), 0.65);
    }
    showcaseAuraPulse(u.category, 1.2);
    audio.upgrade();
  },
  "脆弱火力": (u) => {
    spawnBeamFan(-Math.PI / 2, 14, Math.PI * 0.8, { life: 0.6, color: 0xff5f8a, opacity: 0.7 });
    damageRing(3, 1.4);
    showcaseAuraPulse(u.category, 1.3);
    audio.upgrade();
  },
  "贪婪协议": (u) => {
    coinShower(u, 2);
    for (const e of state.enemies) e.speed = e.speed * 1.3;
  },
  "不稳定核心": (u) => {
    addExplosion(C.x, C.y, 2.4);
    triggerScreenShake(0.5, 10);
    showcaseAuraPulse(u.category, 1.6);
    audio.upgrade();
    setTimeout(() => audio.boom(), 130);
  },
  "黑洞贷款": (u) => {
    state.money += 25;
    coinShower(u, 1.5);
  },
  "极限护盾": (u) => {
    state.shield = 90;
    shieldInner.material.opacity = 1;
    spawnBeamFan(-Math.PI / 2, 36, Math.PI * 2, { life: 1.4, color: 0xffb1ce, opacity: 0.55 });
    showcaseAuraPulse(u.category, 1.4);
    audio.upgrade();
  },
  "超量起飞": (u) => {
    triggerScreenShake(0.45, 9);
    for (let i = 0; i < 18; i++) {
      const a = (Math.PI * 2 * i) / 18;
      const from = pointOnCircle(a, earthRadius + 26);
      const to = pointOnCircle(a, earthRadius + 220);
      createEnergyBeam(a, { from, to, life: 1.0, color: 0xff9ad0, opacity: 0.88 });
    }
    showcaseAuraPulse(u.category, 1.5);
    audio.upgrade();
  },
  "星核燃烧": (u) => {
    addExplosion(C.x, C.y, 2.6);
    triggerScreenShake(0.6, 12);
    showcaseAuraPulse(u.category, 1.8);
    audio.upgrade();
    setTimeout(() => audio.boom(), 130);
  },
  "孤注一掷": (u) => {
    triggerScreenShake(1.0, 18);
    for (let i = 0; i < 80; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 60 + Math.random() * 360;
      addExplosion(C.x + Math.cos(a) * r, C.y + Math.sin(a) * r, 0.5 + Math.random() * 0.5);
    }
    damageRing(40, 3);
    showcaseAuraPulse(u.category, 2.5);
    audio.upgrade();
    setTimeout(() => audio.boom(), 160);
  },
};

// Floating coin sprites for economy upgrades — small upward-drifting pulses
function coinShower(upgrade, multiplier = 1) {
  const total = Math.floor(8 + 6 * multiplier);
  for (let i = 0; i < total; i++) {
    const a = -Math.PI / 2 + (i - total / 2) * 0.18;
    const r = earthRadius + 60 + (i % 3) * 40;
    spawnInterceptFlash(C.x + Math.cos(a) * r, C.y + Math.sin(a) * r, 0.55);
  }
  showcaseAuraPulse(upgrade.category, 1 + multiplier * 0.2);
  audio.upgrade();
}

function showcaseByCategory(upgrade) {
  // Generic per-category fallback if name not registered
  const cat = upgrade.category;
  if (cat === "Gun" || cat === "近地卫星") return upgradeShowcasesByName["Gun"](upgrade);
  if (cat === "Laser") return upgradeShowcasesByName["Laser"](upgrade);
  if (cat === "Beam") return upgradeShowcasesByName["Beam"](upgrade);
  if (cat === "弹道") return upgradeShowcasesByName["分裂弹"](upgrade);
  if (cat === "防御") return upgradeShowcasesByName["护盾发生器"](upgrade);
  if (cat === "爆炸") return upgradeShowcasesByName["爆破弹头"](upgrade);
  if (cat === "经济") return coinShower(upgrade);
  if (cat === "地球") return upgradeShowcasesByName["地核脉冲"](upgrade);
  if (cat === "特殊") return upgradeShowcasesByName["时间减速"](upgrade);
  if (cat === "风险收益") return upgradeShowcasesByName["过载射击"](upgrade);
  showcaseAuraPulse(cat);
  audio.upgrade();
}

function triggerUpgradeShowcase(upgrade) {
  const fn = upgradeShowcasesByName[upgrade.name];
  if (fn) fn(upgrade);
  else showcaseByCategory(upgrade);
}

/* ═══════════════════════════════════════════════════════════════
   Defenders
   ═══════════════════════════════════════════════════════════════ */
function rebuildDefenders() {
  const target = Math.min(24, state.gunLevel * 3);
  // Defender size grows subtly with gunLevel so gunmounts feel beefier each upgrade.
  const size = Math.min(72, 46 + state.gunLevel * 1.6);
  // Ambient halo unlocks once player has 5+ upgrades — visible "buffed" state.
  const useHalo = state.levelCount >= 5;
  while (state.defenders.length < target) {
    const index = state.defenders.length;
    const baseSprite = makeSprite(tex[planeTextureKeys[index % planeTextureKeys.length]], size, size, { opacity: 0.98 });
    let halo = null;
    if (useHalo) {
      halo = makeSprite(tex.explosionCore, size * 1.7, size * 1.7, { additive: true, opacity: 0.18, color: 0x9bf7ff });
      halo.position.z = 3.9;
    }
    state.defenders.push({
      angle: (Math.PI * 2 * index) / Math.max(1, target),
      orbit: rand(148, 224),
      cooldown: rand(0.05, 0.45),
      born: state.gameTime,
      mesh: baseSprite,
      halo,
      size,
    });
  }
  while (state.defenders.length > target) {
    const old = state.defenders.pop();
    disposeObject(old.mesh);
    if (old.halo) disposeObject(old.halo);
  }
  // Existing defenders also resize / regrow halo when gunLevel changes.
  for (const def of state.defenders) {
    if (def.size !== size) {
      def.mesh.scale.set(size, size, 1);
      def.size = size;
    }
    if (useHalo && !def.halo) {
      def.halo = makeSprite(tex.explosionCore, size * 1.7, size * 1.7, { additive: true, opacity: 0.18, color: 0x9bf7ff });
      def.halo.position.z = 3.9;
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   Enemy Spawning
   ═══════════════════════════════════════════════════════════════ */
function stagePressure() {
  const stage = Math.max(0, state.stageLevel - 1) / Math.max(1, bossConfigs.length - 1);
  const wave = Math.max(0, state.waveIndex - 1) / Math.max(1, wavesPerStage - 1);
  return { stage, wave, combined: Math.min(1.35, stage * 0.8 + wave * 0.55) };
}

function createRegularEnemy(options) {
  const dxC = options.x - C.x;
  const dyC = options.y - C.y;
  const enemy = {
    x: options.x,
    y: options.y,
    angle: options.angle,
    radius: Math.sqrt(dxC * dxC + dyC * dyC),
    speed: options.speed,
    hp: options.hp,
    maxHp: options.hp,
    size: options.size,
    kind: options.kind,
    reward: options.reward ?? 1,
    isMiniBoss: options.isMiniBoss ?? false,
    miniBossKind: options.miniBossKind ?? null,
    miniBossTimer: options.miniBossTimer ?? 0,
    wobble: rand(0, Math.PI * 2),
    spin: rand(-1.2, 1.2),
    visual: createEnemyVisual(options.kind, options.size),
    trail: makeGlowLine(options.trailColor ?? 0xffa84a, options.trailOpacity ?? 0.55),
  };
  enemy.mesh = enemy.visual.group;
  state.enemies.push(enemy);
  return enemy;
}

function updateWave(dt) {
  if (state.boss || state.waveIndex >= wavesPerStage) return;
  state.waveTimer += dt;
  if (state.waveTimer < waveDuration) return;
  state.waveTimer = 0;
  state.waveIndex += 1;
  state.enemyCarry += state.waveIndex % 5 === 0 ? 4.2 : 1.3;
  if (state.waveIndex >= wavesPerStage) {
    state.waveIndex = wavesPerStage;
    spawnBoss();
  } else {
    if (state.waveIndex % 4 === 0) spawnMiniBoss();
    state.message = `第 ${state.stageLevel} 关 / 第 ${state.waveIndex} 波`;
    updateHud();
  }
}

const miniBossKinds = ["meteor", "bolt", "saucer"];
const miniBossPalette = {
  meteor: { color: 0xff6a36, label: "熔岩游骑", abilityHint: "周期落弹" },
  bolt: { color: 0xb7ff5a, label: "电浆游侠", abilityHint: "高速突进" },
  saucer: { color: 0x8df5ff, label: "暗能量飞碟", abilityHint: "召唤随从" },
};

function spawnMiniBoss() {
  const pressure = stagePressure();
  const kind = miniBossKinds[Math.floor(Math.random() * miniBossKinds.length)];
  const palette = miniBossPalette[kind];
  triggerScreenShake(0.3, 6);
  const baseAngle = rand(-Math.PI, Math.PI);
  const radius = rand(640, 760);
  const pos = pointOnCircle(baseAngle, radius);
  const targetAngle = baseAngle + Math.PI + rand(-0.04, 0.04);
  const size = 84 + pressure.stage * 18 + state.stageLevel * 4;
  const hp = 24 + Math.round(pressure.stage * 26 + state.levelCount * 1.6 + state.stageLevel * 4);
  const enemy = createRegularEnemy({
    x: pos.x,
    y: pos.y,
    angle: targetAngle,
    speed: rand(20, 36) + pressure.combined * 22,
    hp,
    size,
    kind,
    reward: 9 + state.stageLevel * 2,
    isMiniBoss: true,
    miniBossKind: kind,
    miniBossTimer: 1.8,
    trailColor: palette.color,
    trailOpacity: 0.7,
  });
  state.message = `小 Boss 入场：${palette.label}`;
  audio.levelUp();
  spawnInterceptFlash(enemy.x, enemy.y, 1.6);
  for (let i = 0; i < 4; i++) {
    const a = rand(0, Math.PI * 2);
    spawnInterceptFlash(enemy.x + Math.cos(a) * size * 0.6, enemy.y + Math.sin(a) * size * 0.6, 0.9);
  }
  updateHud();
}

function spawnMiniBossAttack(enemy) {
  const kind = enemy.miniBossKind;
  if (kind === "meteor") {
    // drops 3 fast meteor fragments toward Earth
    const baseAngle = Math.atan2(C.y - enemy.y, C.x - enemy.x);
    for (let i = 0; i < 3; i++) {
      const offset = (i - 1) * 0.16;
      createRegularEnemy({
        x: enemy.x,
        y: enemy.y,
        angle: baseAngle + offset,
        speed: 110 + state.stageLevel * 6,
        hp: 1,
        size: 26,
        kind: "meteor",
        reward: 1,
        trailColor: 0xff8a3a,
      });
    }
    enemy.miniBossTimer = 2.2;
    return;
  }
  if (kind === "bolt") {
    // dash burst — temporarily speed up toward Earth
    enemy.speed = Math.min(enemy.speed + 90, 240);
    enemy.miniBossTimer = 1.4;
    spawnInterceptFlash(enemy.x, enemy.y, 0.8);
    return;
  }
  // saucer summons two fast bolts
  for (let i = 0; i < 2; i++) {
    const a = Math.atan2(C.y - enemy.y, C.x - enemy.x) + (i === 0 ? -0.3 : 0.3);
    createRegularEnemy({
      x: enemy.x,
      y: enemy.y,
      angle: a,
      speed: 92 + state.stageLevel * 5,
      hp: 2,
      size: 28,
      kind: "bolt",
      reward: 1,
      trailColor: 0x9aff8a,
    });
  }
  enemy.miniBossTimer = 2.0;
}

/* ═══════════════════════════════════════════════════════════════
   Swarm — golden flame projectiles. The bulk of the enemy stream.
   These are the visual density seen in the source video; the player
   intercepts them with defender bullets. Lightweight: single sprite,
   no nested visual group, no trail line.
   ═══════════════════════════════════════════════════════════════ */
function spawnSwarmEnemy() {
  const angle = rand(-Math.PI, Math.PI);
  const startX = C.x + Math.cos(angle) * swarmEntryRadius;
  const startY = C.y + Math.sin(angle) * swarmEntryRadius;
  const heading = angle + Math.PI;
  const speed = 42 + rand(-8, 12) + state.stageLevel * 3;
  // Pin shape: chunky head leading, short flame tail. The barrage texture has
  // its bright bulb at one end; flipping with `+ π` makes that bulb LEAD the
  // motion (was trailing before, looking head-tail-reversed).
  const sprite = makeSprite(tex.barrageProjectile, 26, 84, { additive: true, opacity: 0.98 });
  sprite.material.rotation = -heading + Math.PI / 2 + Math.PI;
  state.enemies.push({
    x: startX,
    y: startY,
    angle: heading,
    radius: swarmEntryRadius,
    speed,
    hp: 1,
    maxHp: 1,
    size: 16,
    kind: "swarm",
    reward: 0.5,
    isSwarm: true,
    isMiniBoss: false,
    miniBossKind: null,
    miniBossTimer: 0,
    wobble: 0,
    spin: 0,
    mesh: sprite,
    trail: null,
    visual: null,
  });
}

function updateSwarms(dt) {
  if (state.mode !== "playing") return;
  let count = 0;
  for (let i = 0; i < state.enemies.length; i++) {
    if (state.enemies[i].isSwarm) count++;
  }
  // Stage-1 wave-1: 70 + 0 + 3 = 73   (manageable for 6 starter defenders)
  // Stage-5 wave-10: 70 + 72 + 30 = 172
  // Stage-10 wave-20: 70 + 162 + 60 = 230 (cap)
  const baseTarget = state.boss
    ? Math.min(80, swarmBaseDensity * 0.6)
    : Math.min(swarmMaxDensity, swarmBaseDensity + (state.stageLevel - 1) * 18 + state.waveIndex * 3);
  // Slower fill so a long pause / heavy AoE doesn't dump 14 enemies in one frame.
  const toSpawn = Math.min(8, Math.max(0, Math.ceil(baseTarget - count)));
  for (let i = 0; i < toSpawn; i++) spawnSwarmEnemy();
  void dt;
}

// Pre-fill the field on game start / restart so the very first frame already
// shows the dense golden ring, instead of the player watching it ramp up.
function prefillSwarm() {
  // 28 prefilled, scattered along the outer 70% of the flight path so the
  // first frame already shows incoming density without crashing into Earth.
  const safeMin = 0;
  const safeMax = swarmEntryRadius - earthRadius - 320;
  for (let i = 0; i < 28; i++) {
    spawnSwarmEnemy();
    const e = state.enemies[state.enemies.length - 1];
    const advance = rand(safeMin, Math.max(safeMin + 20, safeMax));
    e.x += Math.cos(e.angle) * advance;
    e.y += Math.sin(e.angle) * advance;
    const dxC = e.x - C.x;
    const dyC = e.y - C.y;
    e.radius = Math.sqrt(dxC * dxC + dyC * dyC);
  }
}

function spawnEnemies(dt) {
  if (state.waveIndex >= wavesPerStage || state.boss) return;
  const pressure = stagePressure();
  const rate = 1.8 + pressure.stage * 4.2 + pressure.wave * 5.4 + state.levelCount * 0.22;
  state.enemyCarry += rate * dt;
  while (state.enemyCarry > 1) {
    state.enemyCarry -= 1;
    const baseAngle = rand(-Math.PI, Math.PI);
    const radius = rand(620, 760);
    const pos = pointOnCircle(baseAngle, radius);
    const targetAngle = baseAngle + Math.PI + rand(-0.08, 0.08);
    const size = rand(28, 48) + pressure.stage * 6;
    const enemyRoll = Math.random();
    const kind = enemyRoll < 0.58 ? "meteor" : enemyRoll < 0.82 ? "bolt" : "saucer";
    createRegularEnemy({
      x: pos.x,
      y: pos.y,
      angle: targetAngle,
      speed: rand(30, 56) + pressure.combined * 34 + state.waveIndex * 0.8,
      hp: 1 + Math.floor(pressure.stage * 3.2 + pressure.wave * 2.2),
      size,
      kind,
    });
  }
}

function spawnBoss() {
  if (state.boss) return;
  const config = bossConfigs[Math.min(state.stageLevel - 1, bossConfigs.length - 1)];
  const maxHp = Math.round(config.maxHp * (1 + state.levelCount * 0.035));
  const pos = pointOnCircle(-Math.PI / 2, 215 + config.level * 3);
  const boss = {
    isBoss: true,
    x: pos.x,
    y: pos.y,
    angle: Math.PI / 2,
    radius: 420,
    speed: 0,
    hp: maxHp,
    maxHp,
    reward: config.reward,
    size: config.size,
    kind: "boss",
    bossConfig: config,
    bossPhase: rand(0, Math.PI * 2),
    attackTimer: Math.max(1.45, 3.7 - config.level * 0.16),
    wobble: rand(0, Math.PI * 2),
    spin: 0,
    visual: createBossVisual(config),
    trail: makeGlowLine(config.color, 0.36),
  };
  boss.mesh = boss.visual.group;
  state.boss = boss;
  state.enemies.push(boss);
  state.message = `第 ${state.stageLevel} 关 Boss：${config.name}`;
  addExplosion(boss.x, boss.y, 1.25);
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8;
    const px = boss.x + Math.cos(a) * boss.size * 0.6;
    const py = boss.y + Math.sin(a) * boss.size * 0.6;
    spawnInterceptFlash(px, py, 1.4);
  }
  triggerScreenShake(0.6, 14);
  audio.levelUp();
  updateHud();
}

function spawnBossAttack(boss) {
  const config = boss.bossConfig;
  const hpRatio = Math.max(0, boss.hp / boss.maxHp);
  const count = Math.min(10, 3 + Math.floor(config.level * 0.55) + Math.floor((1 - hpRatio) * 4));
  const centerAngle = angleTo(boss, C);
  const spread = 0.42 + config.level * 0.018;
  for (let i = 0; i < count; i++) {
    const offset = count === 1 ? 0 : (i - (count - 1) / 2) * (spread / Math.max(1, count - 1));
    const angle = centerAngle + offset + rand(-0.05, 0.05);
    const spawn = {
      x: boss.x + Math.cos(angle) * boss.size * 0.35,
      y: boss.y + Math.sin(angle) * boss.size * 0.35,
    };
    const kindRoll = (i + config.level) % 3;
    const kind = kindRoll === 0 ? "saucer" : kindRoll === 1 ? "meteor" : "bolt";
    createRegularEnemy({
      x: spawn.x,
      y: spawn.y,
      angle,
      speed: rand(42, 68) + config.level * 3.2,
      hp: 2 + Math.floor(config.level * 0.45),
      size: rand(30, 44) + config.level * 0.8,
      kind,
      trailColor: config.color,
      trailOpacity: 0.48,
    });
  }
  createEnergyBeam(centerAngle, {
    from: boss,
    to: { x: boss.x + Math.cos(centerAngle) * 280, y: boss.y + Math.sin(centerAngle) * 280 },
    life: 0.42,
    color: config.color,
    opacity: 0.68,
    wide: true,
  });
  audio.beam();
}

function nearestEnemy(from, maxRadius = Infinity) {
  let best = null;
  let bestSq = maxRadius === Infinity ? Infinity : maxRadius * maxRadius;
  const enemies = state.enemies;
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    const dx = from.x - enemy.x;
    const dy = from.y - enemy.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestSq) {
      best = enemy;
      bestSq = d2;
    }
  }
  return best;
}

/* ═══════════════════════════════════════════════════════════════
   Shooting
   ═══════════════════════════════════════════════════════════════ */
function shoot(from, target, spread = 0) {
  if (!target) return;
  const base = angleTo(from, target);
  const shots = 1 + Math.min(2, state.splitShot);
  // Bullet visual scales with permanent stats so the player SEES upgrades
  // working: bigger sprites, brighter color when laser/beam tech unlocked.
  const widthMul = 1 + (state.bulletDamage - 1) * 0.18 + state.bulletPierce * 0.06;
  const lengthMul = 1 + (state.bulletDamage - 1) * 0.22 + state.laserLevel * 0.04;
  // Tint shifts cyan → white → pale-gold as upgrades stack.
  const tint = state.beamLevel > 0 ? 0xc9faff : state.laserLevel > 0 ? 0xe6ffff : 0xb6f5ff;
  const trailColor = state.laserLevel > 0 ? 0xb1f5ff : 0x72f8ff;
  for (let i = 0; i < shots; i++) {
    const offset = shots === 1 ? 0 : (i - (shots - 1) / 2) * (0.08 + spread);
    const bullet = {
      x: from.x,
      y: from.y,
      vx: Math.cos(base + offset) * (540 + state.laserLevel * 18),
      vy: Math.sin(base + offset) * (540 + state.laserLevel * 18),
      life: 1.05,
      damage: state.bulletDamage,
      pierce: state.bulletPierce,
      mesh: makeSprite(tex.playerBullet, 17 * widthMul, 32 * lengthMul, { additive: true, color: tint, opacity: 0.96 }),
      trail: makeGlowLine(trailColor, 0.62 + state.levelCount * 0.005),
    };
    state.bullets.push(bullet);
  }
  audio.fire();
}

/* ═══════════════════════════════════════════════════════════════
   Combat Update
   ═══════════════════════════════════════════════════════════════ */
function updateCombat(dt) {
  updateWave(dt);
  updateSwarms(dt);
  spawnEnemies(dt);
  const orbitSpeed = 0.54 + state.levelCount * 0.018;
  for (const defender of state.defenders) {
    defender.angle += dt * orbitSpeed * (defender.orbit > 188 ? -1 : 1);
    defender.cooldown -= dt * state.fireRateMul;
    const cosA = Math.cos(defender.angle);
    const sinA = Math.sin(defender.angle);
    const orbitX = C.x + cosA * defender.orbit;
    const orbitY = C.y + sinA * defender.orbit;
    _defenderScratch.x = orbitX;
    _defenderScratch.y = orbitY;
    const target = nearestEnemy(_defenderScratch, 520);
    const a = target ? Math.atan2(target.y - orbitY, target.x - orbitX) : defender.angle;
    const launch = Math.min(1, (state.gameTime - defender.born) / 0.5);
    const fromX = C.x + cosA * (earthRadius + 20);
    const fromY = C.y + sinA * (earthRadius + 20);
    defender.x = fromX + (orbitX - fromX) * launch;
    defender.y = fromY + (orbitY - fromY) * launch;
    setXY(defender.mesh, defender.x, defender.y, 4);
    defender.mesh.material.rotation = -a + Math.PI / 2;
    if (defender.halo) {
      setXY(defender.halo, defender.x, defender.y, 3.9);
      defender.halo.material.opacity = 0.16 + Math.sin(state.time * 4 + defender.angle) * 0.06;
    }
    if (defender.cooldown <= 0) {
      shoot(defender, target, 0.03);
      defender.cooldown = Math.max(0.15, 0.58 - state.levelCount * 0.02);
    }
  }
  state.coreTimer -= dt * state.fireRateMul;
  if (state.coreTimer <= 0) {
    shoot(C, nearestEnemy(C, 560), 0.04);
    state.coreTimer = 0.86;
  }
  updateLaserAndBeam(dt);
  buildGrid();
  updateBullets(dt);
  updateEnemies(dt);
}

function updateLaserAndBeam(dt) {
  state.fireTimer -= dt;
  if (state.laserLevel > 0 && state.fireTimer <= 0) {
    const target = nearestEnemy(C, 720);
    if (target) {
      const beam = createEnergyBeam(angleTo(C, target), {
        life: 0.42 + state.laserLevel * 0.04,
        color: 0xc9faff,
        opacity: 0.86,
      });
      damageInBeam(beam.angle, 0.07 + state.laserLevel * 0.01, 5 + state.laserLevel * 1.4);
      audio.laser();
    }
    // More aggressive scaling: at level 3+, lasers fire roughly every 0.7s.
    state.fireTimer = Math.max(0.55, 2.4 - state.laserLevel * 0.5);
  }
  if (state.beamLevel > 0 && Math.random() < dt * (0.85 + state.beamLevel * 0.14)) {
    const target = nearestEnemy(C, 720);
    if (target) {
      const beam = createEnergyBeam(angleTo(C, target), {
        life: 0.6 + state.beamLevel * 0.04,
        color: 0x9efbff,
        opacity: 0.74,
        wide: true,
      });
      damageInBeam(beam.angle, 0.18 + state.beamLevel * 0.025, 10 + state.beamLevel * 2.4);
      audio.beam();
    }
  }
  for (let i = state.beams.length - 1; i >= 0; i--) {
    const beam = state.beams[i];
    beam.life -= dt;
    const k = Math.max(0, beam.life / beam.max);
    const from = beam.from || C;
    const end = beam.to || { x: C.x + Math.cos(beam.angle) * 760, y: C.y + Math.sin(beam.angle) * 760 };
    updateLine(beam.line, from, end, 5.5);
    beam.line.material.opacity = beam.opacity * k;
    if (beam.life <= 0) {
      disposeObject(beam.line);
      swapRemove(state.beams, i);
    }
  }
}

function damageInBeam(angle, width, damage) {
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const enemy = state.enemies[i];
    const a = angleTo(C, enemy);
    const delta = Math.abs(Math.atan2(Math.sin(a - angle), Math.cos(a - angle)));
    if (delta < width) {
      enemy.hp -= damage;
      if (enemy.hp <= 0) killEnemy(i);
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   Bullet Update (spatial grid + swap-and-pop)
   ═══════════════════════════════════════════════════════════════ */
function updateBullets(dt) {
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i];
    const oldX = b.x;
    const oldY = b.y;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    let remove = b.life <= 0 || b.x < -80 || b.x > W + 80 || b.y < -80 || b.y > H + 80;
    if (!remove) {
      const nearby = queryNearbyEnemies(b.x, b.y);
      for (let k = nearby.length - 1; k >= 0 && !remove; k--) {
        const enemy = nearby[k];
        if (enemy.hp <= 0) continue;
        const dx = b.x - enemy.x;
        const dy = b.y - enemy.y;
        const r = enemy.size * 0.55 + 7;
        if (dx * dx + dy * dy < r * r) {
          enemy.hp -= b.damage;
          addExplosion(b.x, b.y, 0.42);
          spawnInterceptFlash(b.x, b.y, 0.45);
          if (enemy.hp <= 0) {
            const idx = state.enemies.indexOf(enemy);
            if (idx >= 0) killEnemy(idx);
          }
          if (b.pierce > 0) b.pierce -= 1;
          else remove = true;
        }
      }
    }
    setXY(b.mesh, b.x, b.y, 6);
    b.mesh.material.rotation = -Math.atan2(b.vy, b.vx) + Math.PI / 2;
    updateLineXY(b.trail, oldX, oldY, b.x, b.y, 5.8);
    b.trail.material.opacity = Math.max(0, b.life) * 0.55;
    if (remove) {
      disposeObject(b.mesh);
      disposeObject(b.trail);
      swapRemove(state.bullets, i);
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   Enemy Update (swap-and-pop)
   ═══════════════════════════════════════════════════════════════ */
function updateEnemies(dt) {
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];

    if (e.isSwarm) {
      e.x += Math.cos(e.angle) * e.speed * dt;
      e.y += Math.sin(e.angle) * e.speed * dt;
      const dxC = e.x - C.x;
      const dyC = e.y - C.y;
      e.radius = Math.sqrt(dxC * dxC + dyC * dyC);
      setXY(e.mesh, e.x, e.y, 0.5);
      if (e.radius < earthRadius + 14) {
        takeHit(0.4);
        addExplosion(e.x, e.y, 0.36);
        spawnInterceptFlash(e.x, e.y, 0.6);
        disposeObject(e.mesh);
        swapRemove(state.enemies, i);
      }
      continue;
    }

    e.wobble += dt * 2.2;

    if (e.isBoss) {
      e.bossPhase += dt * (0.32 + e.bossConfig.level * 0.012);
      // Boss state machine: PATROL (full orbit) ↔ CHARGE (dive at Earth then retreat)
      e.bossChargeTimer = (e.bossChargeTimer ?? 5 + Math.random() * 3) - dt;
      if (e.bossChargeTimer <= 0 && !e.bossCharging) {
        e.bossCharging = true;
        e.bossChargeStart = state.time;
        triggerScreenShake(0.28, 6);
      }
      // Patrol: travels full circle (no longer pinned to top arc) with a
      // secondary harmonic so the path isn't a perfect ring.
      const baseAngle = e.bossPhase * 0.55 + Math.sin(e.bossPhase * 1.3) * 0.55;
      const baseOrbit = 240 + Math.sin(e.bossPhase * 0.42) * 56 + e.bossConfig.level * 2;
      let targetAngle = baseAngle;
      let orbit = baseOrbit;
      if (e.bossCharging) {
        const chargeAge = state.time - e.bossChargeStart;
        const chargeDuration = 1.4;
        if (chargeAge >= chargeDuration) {
          e.bossCharging = false;
          e.bossChargeTimer = 4.5 + Math.random() * 3.5;
        } else {
          const k = Math.sin((chargeAge / chargeDuration) * Math.PI); // 0→1→0 envelope
          orbit = baseOrbit - k * 130;
          // Mid-charge burst: spawn projectiles + extra screen shake exactly once.
          if (!e.bossChargeBurst && chargeAge >= 0.55) {
            e.bossChargeBurst = true;
            spawnBossAttack(e);
            triggerScreenShake(0.36, 9);
            for (let f = 0; f < 6; f++) {
              const fa = Math.atan2(C.y - e.y, C.x - e.x) + (f - 2.5) * 0.18;
              spawnInterceptFlash(e.x + Math.cos(fa) * e.size * 0.5, e.y + Math.sin(fa) * e.size * 0.5, 0.95);
            }
          }
          if (chargeAge >= chargeDuration - dt) e.bossChargeBurst = false;
        }
      }
      const targetX = C.x + Math.cos(targetAngle) * orbit;
      const targetY = C.y + Math.sin(targetAngle) * orbit;
      const lerp = Math.min(1, dt * (e.bossCharging ? 1.15 : 0.78));
      e.x += (targetX - e.x) * lerp;
      e.y += (targetY - e.y) * lerp;
      const dxC = e.x - C.x;
      const dyC = e.y - C.y;
      e.angle = Math.atan2(C.y - e.y, C.x - e.x);
      e.radius = Math.sqrt(dxC * dxC + dyC * dyC);
      updateEnemyVisual(e, dt);
      const tailX = e.x - Math.cos(e.angle) * e.size * 0.45;
      const tailY = e.y - Math.sin(e.angle) * e.size * 0.45;
      updateLineXY(e.trail, tailX, tailY, e.x, e.y, 2.6);
      e.trail.material.opacity = 0.22 + Math.sin(state.time * 5 + e.wobble) * 0.08 + (e.bossCharging ? 0.2 : 0);
      e.attackTimer -= dt;
      if (e.attackTimer <= 0) {
        spawnBossAttack(e);
        e.attackTimer = Math.max(1.18, 3.5 - e.bossConfig.level * 0.16 - (1 - e.hp / e.maxHp) * 0.8);
      }
      continue;
    }

    if (e.isMiniBoss) {
      e.miniBossTimer -= dt;
      if (e.miniBossTimer <= 0) spawnMiniBossAttack(e);
    }

    const oldX = e.x - Math.cos(e.angle) * 46;
    const oldY = e.y - Math.sin(e.angle) * 46;
    const heading = e.angle + Math.sin(e.wobble) * 0.035;
    e.x += Math.cos(heading) * e.speed * dt;
    e.y += Math.sin(heading) * e.speed * dt;
    const dxC = e.x - C.x;
    const dyC = e.y - C.y;
    e.radius = Math.sqrt(dxC * dxC + dyC * dyC);
    updateEnemyVisual(e, dt);
    updateLineXY(e.trail, oldX, oldY, e.x, e.y, 2.5);
    e.trail.material.opacity = e.kind === "saucer" ? 0.22 : 0.44;
    if (e.radius < earthRadius + e.size * 0.45) {
      takeHit(3.5);
      addExplosion(e.x, e.y, 0.9);
      disposeObject(e.mesh);
      disposeObject(e.trail);
      swapRemove(state.enemies, i);
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   Damage & Kill
   ═══════════════════════════════════════════════════════════════ */
function takeHit(amount) {
  if (state.shield > 0) {
    const used = Math.min(state.shield, amount);
    state.shield -= used;
    amount -= used;
  }
  state.health -= amount;
  audio.hit();
  state.message = "外星攻击命中地球";
  if (state.health <= 0) {
    state.health = 0;
    state.mode = "gameOver";
    state.message = "地球防线失守，点击重开";
  }
  updateHud();
}

function killEnemy(index) {
  const enemy = state.enemies[index];
  state.kills += 1;
  const reward = enemy.reward ?? 1;
  state.money += reward * state.moneyMul;
  if (enemy.isSwarm) {
    // Bullet impact already added the larger explosion + intercept flash;
    // kill confirmation just plays a small puff so dense intercepts stay cheap.
    spawnInterceptFlash(enemy.x, enemy.y, 0.55);
    disposeObject(enemy.mesh);
    swapRemove(state.enemies, index);
    // Coalesce HUD writes — only every 8th swarm kill refreshes money/kills text.
    if ((state.kills & 7) === 0) updateHud();
    return;
  }
  if (enemy.isMiniBoss) {
    state.miniBossesDefeated += 1;
    addExplosion(enemy.x, enemy.y, 1.8);
    for (let i = 0; i < 9; i++) {
      const a = (Math.PI * 2 * i) / 9;
      const px = enemy.x + Math.cos(a) * enemy.size * 0.55;
      const py = enemy.y + Math.sin(a) * enemy.size * 0.55;
      spawnInterceptFlash(px, py, 1.1);
      addExplosion(px, py, 0.6 + (i % 3) * 0.05);
    }
    triggerScreenShake(0.42, 8);
    audio.boom();
    setTimeout(() => audio.upgrade(), 110);
  } else {
    addExplosion(enemy.x, enemy.y, enemy.isBoss ? 2.2 : state.explosionScale);
    audio.boom();
  }
  disposeObject(enemy.mesh);
  disposeObject(enemy.trail);
  swapRemove(state.enemies, index);
  if (enemy.isBoss) completeBoss(enemy);
  updateHud();
}

function completeBoss(enemy) {
  state.boss = null;
  state.bossesDefeated += 1;
  state.enemyCarry = 0;
  state.waveTimer = 0;
  for (let i = 0; i < 7; i++) {
    const angle = (Math.PI * 2 * i) / 7 + state.time * 0.2;
    const pos = pointOnCircle(angle, enemy.size * 0.82, enemy);
    addExplosion(pos.x, pos.y, 0.78 + i * 0.04);
  }
  if (state.stageLevel >= bossConfigs.length) {
    state.mode = "victory";
    state.message = "十关 Boss 已清除，地球防线胜利";
    hideLevelPanel();
    hideShopPanel();
    return;
  }
  state.stageLevel += 1;
  state.waveIndex = 1;
  state.message = `第 ${state.stageLevel} 关开始：${bossConfigs[state.stageLevel - 1].name} 正在逼近`;
  startLevelUp({ source: "boss" });
}

/* ═══════════════════════════════════════════════════════════════
   Scene Animation
   ═══════════════════════════════════════════════════════════════ */
function update(dt) {
  if (state.mode === "playing") {
    state.gameTime += dt;
    updateCombat(dt);
    if (!state.boss && state.nextLevelIndex < levelTriggers.length && state.gameTime >= levelTriggers[state.nextLevelIndex]) {
      startLevelUp();
    }
  }
  updateExplosions(dt);
  updateInterceptFlashes(dt);
}

function updateScene(t, dt) {
  background.material.opacity = 0.88 + Math.sin(t * 0.16) * 0.03;
  starField.rotation.z = Math.sin(t * 0.05) * 0.012;
  updateBarrageLayer(dt, t);
  maybeRedrawEarth(t);
  earth.material.rotation = Math.sin(t * 0.08) * 0.018;
  const pulse = 1 + Math.sin(t * 2.4) * 0.012;
  earth.scale.set(earthVisualSize * pulse, earthVisualSize * pulse, 1);
  shieldInner.rotation.z = t * 0.36;
  shieldOuter.rotation.z = -t * 0.18;
  shieldInner.material.opacity = state.shield > 0 ? 0.44 + Math.sin(t * 3.4) * 0.12 : 0.08;
  shieldOuter.material.opacity = state.shield > 0 ? 0.16 : 0.04;
  applyScreenShake(dt);
}

/* ═══════════════════════════════════════════════════════════════
   Main Loop (pause-aware)
   ═══════════════════════════════════════════════════════════════ */
function frame(now) {
  if (!state.last) state.last = now;
  const dt = Math.min(0.033, (now - state.last) / 1000);
  state.last = now;
  state.time += dt;
  if (state.mode === "paused") {
    updateExplosions(dt);
  } else {
    update(dt);
  }
  updateScene(state.time, dt);
  updateLevelProgress();
  updateBossHud();
  updateMiniBossTag();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

/* ═══════════════════════════════════════════════════════════════
   Event Listeners
   ═══════════════════════════════════════════════════════════════ */
canvas.addEventListener("pointerdown", async () => {
  if (!state.soundOn) {
    await audio.start();
    state.soundOn = true;
    updateHud();
  }
  if (state.mode === "gameOver" || state.mode === "victory") reset();
});

ui.restartBtn.addEventListener("click", () => reset());

if (ui.pauseBtn) {
  ui.pauseBtn.addEventListener("click", () => {
    if (state.mode === "playing") {
      state.mode = "paused";
      state.message = "已暂停";
    } else if (state.mode === "paused") {
      state.mode = "playing";
      state.last = performance.now();
      state.message = "防线继续作战";
    }
    updateHud();
  });
}

ui.shopBtn.addEventListener("click", () => {
  if (state.mode === "paused" || state.mode === "victory") return;
  if (state.mode === "shop") closeShopPanel();
  else openShopPanel();
});
ui.shopCloseBtn.addEventListener("click", () => closeShopPanel());
ui.shopRefreshBtn.addEventListener("click", () => refreshShop());
ui.soundBtn.addEventListener("click", async () => {
  if (!state.soundOn) {
    await audio.start();
    state.soundOn = true;
  } else {
    state.soundOn = !audio.enabled;
    audio.setEnabled(state.soundOn);
  }
  updateHud();
});

if (ui.resumeBtn) {
  ui.resumeBtn.addEventListener("click", () => {
    if (state.mode !== "paused") return;
    state.mode = "playing";
    state.last = performance.now();
    state.message = "防线继续作战";
    updateHud();
  });
}

if (ui.restartGameOverBtn) {
  ui.restartGameOverBtn.addEventListener("click", () => reset());
}

if (ui.restartVictoryBtn) {
  ui.restartVictoryBtn.addEventListener("click", () => reset());
}

/* ═══════════════════════════════════════════════════════════════
   Init
   ═══════════════════════════════════════════════════════════════ */
reset();
requestAnimationFrame(frame);
