import { AudioEngine } from "./audio.js";
import { firstChoices, unlockedPool, upgrades } from "./upgrades.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = 720;
const H = 1280;
const C = { x: W / 2, y: H * 0.52 };
const earthRadius = 78;
const audio = new AudioEngine();

const ui = {
  health: document.getElementById("health"),
  money: document.getElementById("money"),
  levelCount: document.getElementById("levelCount"),
  runState: document.getElementById("runState"),
  restartBtn: document.getElementById("restartBtn"),
  soundBtn: document.getElementById("soundBtn")
};

function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

const imageAssets = {
  background: loadImage("assets/generated/images/earth-defense-background.webp"),
  atlas: loadImage("assets/generated/images/earth-defense-atlas-alpha.webp")
};

function assetReady(image) {
  return image && image.complete && image.naturalWidth > 0;
}

function drawSprite(sprite, x, y, w, h, angle = 0, alpha = 1) {
  if (!assetReady(imageAssets.atlas) || !sprite) return false;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha *= alpha;
  ctx.drawImage(imageAssets.atlas, sprite.x, sprite.y, sprite.w, sprite.h, -w / 2, -h / 2, w, h);
  ctx.restore();
  return true;
}

function coverImage(image, x, y, w, h) {
  const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (image.naturalWidth - sw) / 2;
  const sy = (image.naturalHeight - sh) / 2;
  ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
}

const sprites = {
  earth: { x: 34, y: 42, w: 390, h: 390 },
  plane: [
    { x: 468, y: 34, w: 86, h: 118 },
    { x: 584, y: 34, w: 86, h: 118 },
    { x: 700, y: 34, w: 86, h: 118 },
    { x: 816, y: 34, w: 86, h: 118 },
    { x: 924, y: 42, w: 80, h: 112 },
    { x: 486, y: 166, w: 92, h: 112 },
    { x: 604, y: 166, w: 92, h: 112 },
    { x: 722, y: 166, w: 92, h: 112 },
    { x: 842, y: 166, w: 92, h: 112 }
  ],
  satellite: [
    { x: 436, y: 288, w: 144, h: 118 },
    { x: 594, y: 294, w: 130, h: 108 },
    { x: 734, y: 292, w: 120, h: 112 },
    { x: 870, y: 292, w: 120, h: 112 }
  ],
  enemy: [
    { x: 34, y: 430, w: 126, h: 96 },
    { x: 176, y: 432, w: 118, h: 96 },
    { x: 322, y: 430, w: 112, h: 94 },
    { x: 468, y: 430, w: 124, h: 92 },
    { x: 626, y: 434, w: 114, h: 88 },
    { x: 786, y: 430, w: 124, h: 92 },
    { x: 54, y: 558, w: 116, h: 94 },
    { x: 206, y: 552, w: 112, h: 102 },
    { x: 358, y: 552, w: 112, h: 104 },
    { x: 520, y: 552, w: 112, h: 100 },
    { x: 684, y: 552, w: 108, h: 100 },
    { x: 834, y: 552, w: 112, h: 100 }
  ],
  bullet: [
    { x: 160, y: 704, w: 42, h: 74 },
    { x: 238, y: 704, w: 46, h: 84 },
    { x: 318, y: 704, w: 46, h: 84 },
    { x: 626, y: 704, w: 36, h: 86 },
    { x: 762, y: 704, w: 42, h: 92 }
  ],
  explosion: [
    { x: 40, y: 812, w: 110, h: 100 },
    { x: 170, y: 812, w: 110, h: 100 },
    { x: 300, y: 812, w: 110, h: 100 },
    { x: 440, y: 812, w: 110, h: 100 },
    { x: 580, y: 812, w: 110, h: 100 },
    { x: 720, y: 812, w: 110, h: 100 }
  ],
  shield: { x: 42, y: 826, w: 130, h: 128 },
  laser: { x: 570, y: 824, w: 64, h: 132 },
  beam: { x: 720, y: 820, w: 134, h: 138 },
  cardFrame: [
    { x: 36, y: 980, w: 160, h: 214 },
    { x: 222, y: 980, w: 160, h: 214 },
    { x: 408, y: 980, w: 160, h: 214 },
    { x: 626, y: 980, w: 160, h: 214 },
    { x: 812, y: 980, w: 160, h: 214 }
  ],
  iconGrid: { x: 40, y: 1218, w: 80, h: 80, gapX: 104, gapY: 96, cols: 9 }
};

const rarityColor = {
  common: "#8ff7ff",
  rare: "#57c7ff",
  epic: "#d43cff",
  legendary: "#ffca5f",
  mythic: "#f4fbff"
};

const upgradeIconIndexByCategory = {
  Gun: 9,
  Laser: 3,
  Beam: 13,
  弹道: 2,
  防御: 26,
  爆炸: 5,
  经济: 16,
  地球: 24,
  近地卫星: 4,
  特殊: 25,
  风险收益: 7
};

const state = {
  mode: "playing",
  time: 0,
  last: 0,
  gameTime: 0,
  health: 160,
  maxHealth: 160,
  shield: 28,
  money: 8,
  kills: 0,
  levelCount: 0,
  nextLevelIndex: 0,
  levelElapsed: 0,
  levelOptions: [],
  cards: [],
  selectedIds: new Set(),
  enemies: [],
  bullets: [],
  explosions: [],
  beams: [],
  stars: [],
  defenders: [],
  satellites: [],
  enemyCarry: 0,
  fireTimer: 0,
  coreTimer: 0,
  laserLevel: 0,
  beamLevel: 0,
  gunLevel: 1,
  fireRateMul: 1,
  bulletDamage: 1,
  bulletPierce: 0,
  splitShot: 0,
  explosionScale: 1,
  moneyMul: 1,
  soundOn: false,
  message: "地球防御系统启动中"
};

const levelTriggers = [18.5, 29.5, 41.5, 53.5, 65.5, 77.5, 89.5, 101.5, 113.5, 125.5, 137.5];

function initStars() {
  state.stars = Array.from({ length: 260 }, (_, i) => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.4 + 0.2,
    a: Math.random() * 0.7 + 0.15,
    d: Math.random() * 0.8 + 0.2,
    seed: i * 17.17
  }));
}

function reset() {
  Object.assign(state, {
    mode: "playing",
    time: 0,
    last: performance.now(),
    gameTime: 0,
    health: 160,
    maxHealth: 160,
    shield: 28,
    money: 8,
    kills: 0,
    levelCount: 0,
    nextLevelIndex: 0,
    levelElapsed: 0,
    levelOptions: [],
    cards: [],
    selectedIds: new Set(),
    enemies: [],
    bullets: [],
    explosions: [],
    beams: [],
    defenders: [],
    satellites: [],
    enemyCarry: 0,
    fireTimer: 0,
    coreTimer: 0,
    laserLevel: 0,
    beamLevel: 0,
    gunLevel: 1,
    fireRateMul: 1,
    bulletDamage: 1,
    bulletPierce: 0,
    splitShot: 0,
    explosionScale: 1,
    moneyMul: 1,
    message: "地球防御系统启动中"
  });
  initStars();
  rebuildDefenders();
  updateHud();
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

function updateHud() {
  ui.health.textContent = Math.max(0, Math.round(state.health));
  ui.money.textContent = Math.floor(state.money);
  ui.levelCount.textContent = state.levelCount;
  ui.runState.textContent = state.message;
  ui.soundBtn.textContent = state.soundOn ? "音效：开" : "开启音效";
}

function startLevelUp() {
  state.mode = "levelUp";
  state.levelElapsed = 0;
  state.levelOptions = state.levelCount === 0 ? firstChoices : drawUpgradeOptions();
  state.message = "Level Up：地球防卫系统升级";
  audio.levelUp();
  updateHud();
}

function drawUpgradeOptions() {
  const pool = unlockedPool(state.levelCount).filter((u) => u.repeatable || !state.selectedIds.has(u.id));
  const weighted = [];
  const rarityWeight = { common: 9, rare: 6, epic: 3, legendary: 1.5, mythic: 0.6 };
  for (const item of pool) {
    const count = Math.max(1, Math.round(rarityWeight[item.rarity] || 2));
    for (let i = 0; i < count; i++) weighted.push(item);
  }
  const chosen = [];
  const usedCategories = new Set();
  while (chosen.length < 3 && weighted.length) {
    const item = weighted.splice(Math.floor(Math.random() * weighted.length), 1)[0];
    if (chosen.some((u) => u.id === item.id)) continue;
    if (chosen.length < 2 && usedCategories.has(item.category) && Math.random() < 0.75) continue;
    chosen.push(item);
    usedCategories.add(item.category);
  }
  while (chosen.length < 3) chosen.push(pool[Math.floor(Math.random() * pool.length)] || upgrades[0]);
  return chosen;
}

function chooseUpgrade(index) {
  const upgrade = state.levelOptions[index];
  if (!upgrade) return;
  if (state.money < upgrade.price) {
    state.message = "资金不足，继续拦截敌人";
    updateHud();
    return;
  }
  state.money = Math.max(0, state.money - upgrade.price);
  state.selectedIds.add(upgrade.id);
  applyUpgrade(upgrade);
  state.levelCount += 1;
  state.nextLevelIndex += 1;
  state.mode = "playing";
  state.message = `已升级：${upgrade.name}`;
  addBurst(C.x, C.y, 60, "#d43cff", 24);
  audio.select();
  updateHud();
}

function applyUpgrade(u) {
  const n = u.name;
  if (u.category === "Gun") {
    state.gunLevel += n === "Gun" ? 1 : 0;
    if (n === "双联机炮") state.splitShot += 1;
    if (n === "高速供弹") state.fireRateMul *= 1.18;
    if (n === "穿甲弹头") state.bulletPierce += 1;
    if (n === "扇形齐射") state.splitShot += 2;
    if (n === "钨芯风暴") state.explosionScale += 0.25;
    if (n === "近地机群") state.gunLevel += 2;
    rebuildDefenders();
  }
  if (u.category === "Laser") state.laserLevel += 1;
  if (u.category === "Beam") state.beamLevel += 1;
  if (u.category === "防御") {
    state.shield = Math.min(70, state.shield + 18);
    if (n === "装甲地壳") {
      state.maxHealth += 20;
      state.health += 20;
    }
  }
  if (u.category === "爆炸") state.explosionScale += 0.2;
  if (u.category === "经济") state.moneyMul += 0.15;
  if (u.category === "地球") {
    state.fireRateMul *= 1.08;
    if (n === "地核脉冲") pulseEarth();
  }
  if (u.category === "近地卫星") addSatellite();
  if (u.category === "特殊") specialClear(u);
  if (u.category === "风险收益") {
    state.fireRateMul *= 1.2;
    if (n === "脆弱火力") state.maxHealth = Math.max(45, state.maxHealth - 15);
    if (n === "超量起飞") state.gunLevel += 2;
    rebuildDefenders();
  }
}

function rebuildDefenders() {
  const target = Math.min(24, state.gunLevel * 3);
  while (state.defenders.length < target) {
    state.defenders.push({
      angle: (Math.PI * 2 * state.defenders.length) / Math.max(1, target),
      orbit: rand(150, 215),
      cooldown: rand(0.05, 0.45),
      born: state.gameTime
    });
  }
  state.defenders.length = target;
}

function addSatellite() {
  state.satellites.push({
    angle: rand(0, Math.PI * 2),
    orbit: rand(235, 270),
    cooldown: rand(0.2, 0.8)
  });
}

function specialClear(upgrade) {
  const removeCount = upgrade.rarity === "legendary" ? 36 : upgrade.rarity === "epic" ? 24 : 14;
  state.enemies.sort((a, b) => a.radius - b.radius);
  const removed = state.enemies.splice(0, removeCount);
  for (const enemy of removed) addExplosion(enemy.x, enemy.y, 1.2);
  state.money += removed.length * state.moneyMul;
}

function pulseEarth() {
  state.beams.push({ type: "pulse", x: C.x, y: C.y, radius: earthRadius, life: 0.55, max: 0.55 });
}

function spawnEnemies(dt) {
  const pressure = Math.min(1, state.gameTime / 70);
  const rate = 2.2 + pressure * 9 + state.levelCount * 0.45;
  state.enemyCarry += rate * dt;
  while (state.enemyCarry > 1) {
    state.enemyCarry -= 1;
    const baseAngle = rand(-Math.PI, Math.PI);
    const radius = rand(620, 760);
    const pos = pointOnCircle(baseAngle, radius);
    const targetAngle = baseAngle + Math.PI + rand(-0.08, 0.08);
    const speed = rand(30, 56) + pressure * 32;
    state.enemies.push({
      x: pos.x,
      y: pos.y,
      angle: targetAngle,
      radius,
      speed,
      hp: 1 + Math.floor(pressure * 2),
      size: rand(8, 14),
      sprite: Math.floor(rand(0, sprites.enemy.length)),
      spin: rand(-1, 1),
      wobble: rand(0, Math.PI * 2)
    });
  }
}

function nearestEnemy(from, maxRadius = Infinity) {
  let best = null;
  let bestDistance = maxRadius;
  for (const enemy of state.enemies) {
    const d = dist(from, enemy);
    if (d < bestDistance) {
      best = enemy;
      bestDistance = d;
    }
  }
  return best;
}

function shoot(from, target, spread = 0) {
  if (!target) return;
  const base = angleTo(from, target);
  const shots = 1 + Math.min(2, state.splitShot);
  for (let i = 0; i < shots; i++) {
    const offset = shots === 1 ? 0 : (i - (shots - 1) / 2) * (0.08 + spread);
    state.bullets.push({
      x: from.x,
      y: from.y,
      vx: Math.cos(base + offset) * 520,
      vy: Math.sin(base + offset) * 520,
      life: 1.15,
      damage: state.bulletDamage,
      pierce: state.bulletPierce,
      hue: rand(178, 195)
    });
  }
  audio.fire();
}

function updateCombat(dt) {
  spawnEnemies(dt);
  const orbitSpeed = 0.62 + state.levelCount * 0.02;
  for (const defender of state.defenders) {
    defender.angle += dt * orbitSpeed * (defender.orbit > 185 ? -1 : 1);
    defender.cooldown -= dt * state.fireRateMul;
    const pos = pointOnCircle(defender.angle, defender.orbit);
    if (defender.cooldown <= 0) {
      shoot(pos, nearestEnemy(pos, 520), 0.03);
      defender.cooldown = Math.max(0.16, 0.58 - state.levelCount * 0.02);
    }
  }
  for (const sat of state.satellites) {
    sat.angle -= dt * 0.38;
    sat.cooldown -= dt;
    const pos = pointOnCircle(sat.angle, sat.orbit);
    if (sat.cooldown <= 0) {
      shoot(pos, nearestEnemy(pos, 600), 0);
      sat.cooldown = 0.9;
    }
  }
  state.coreTimer -= dt * state.fireRateMul;
  if (state.coreTimer <= 0) {
    shoot(C, nearestEnemy(C, 560), 0.04);
    shoot({ x: C.x + 12, y: C.y }, nearestEnemy(C, 560), 0.04);
    state.coreTimer = 0.82;
  }
  updateLaserAndBeam(dt);
  updateBullets(dt);
  updateEnemies(dt);
}

function updateLaserAndBeam(dt) {
  if (state.laserLevel > 0) {
    state.fireTimer -= dt;
    if (state.fireTimer <= 0) {
      const target = nearestEnemy(C, 680);
      if (target) {
        const a = angleTo(C, target);
        state.beams.push({ type: "laser", angle: a, life: 0.36 + state.laserLevel * 0.04, max: 0.36 + state.laserLevel * 0.04 });
        damageInBeam(a, 0.045 + state.laserLevel * 0.008, 3 + state.laserLevel);
      }
      state.fireTimer = Math.max(1.2, 3.1 - state.laserLevel * 0.32);
    }
  }
  if (state.beamLevel > 0 && Math.floor(state.gameTime * 10) % Math.max(22, 48 - state.beamLevel * 5) === 0) {
    const target = nearestEnemy(C, 680);
    if (target && Math.random() < 0.08) {
      const a = angleTo(C, target);
      state.beams.push({ type: "beam", angle: a, life: 0.55, max: 0.55 });
      damageInBeam(a, 0.16 + state.beamLevel * 0.025, 8 + state.beamLevel * 2);
    }
  }
  for (let i = state.beams.length - 1; i >= 0; i--) {
    state.beams[i].life -= dt;
    if (state.beams[i].life <= 0) state.beams.splice(i, 1);
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

function updateBullets(dt) {
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    let remove = b.life <= 0 || b.x < -80 || b.x > W + 80 || b.y < -80 || b.y > H + 80;
    for (let j = state.enemies.length - 1; j >= 0 && !remove; j--) {
      const enemy = state.enemies[j];
      if (Math.hypot(b.x - enemy.x, b.y - enemy.y) < enemy.size + 6) {
        enemy.hp -= b.damage;
        addSpark(b.x, b.y);
        if (enemy.hp <= 0) killEnemy(j);
        if (b.pierce > 0) b.pierce -= 1;
        else remove = true;
      }
    }
    if (remove) state.bullets.splice(i, 1);
  }
}

function updateEnemies(dt) {
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    e.wobble += dt * 2.2;
    e.x += Math.cos(e.angle + Math.sin(e.wobble) * 0.035) * e.speed * dt;
    e.y += Math.sin(e.angle + Math.sin(e.wobble) * 0.035) * e.speed * dt;
    e.radius = Math.hypot(e.x - C.x, e.y - C.y);
    if (e.radius < earthRadius + e.size * 0.7) {
      state.enemies.splice(i, 1);
      takeHit(3.5);
      addExplosion(e.x, e.y, 0.9);
    }
  }
}

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
  state.enemies.splice(index, 1);
  state.kills += 1;
  state.money += 1 * state.moneyMul;
  addExplosion(enemy.x, enemy.y, state.explosionScale);
  audio.boom();
  updateHud();
}

function addExplosion(x, y, scale = 1) {
  state.explosions.push({ type: "boom", x, y, life: 0.42, max: 0.42, scale });
}

function addSpark(x, y) {
  state.explosions.push({ type: "spark", x, y, life: 0.16, max: 0.16, scale: 0.45 });
}

function addBurst(x, y, radius, color, count) {
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count;
    state.explosions.push({
      type: "burst",
      x: x + Math.cos(a) * radius * 0.2,
      y: y + Math.sin(a) * radius * 0.2,
      vx: Math.cos(a) * rand(90, 210),
      vy: Math.sin(a) * rand(90, 210),
      color,
      life: rand(0.35, 0.62),
      max: 0.62,
      scale: rand(0.5, 1.1)
    });
  }
}

function updateExplosions(dt) {
  for (let i = state.explosions.length - 1; i >= 0; i--) {
    const e = state.explosions[i];
    e.life -= dt;
    if (e.vx) {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.vx *= 0.98;
      e.vy *= 0.98;
    }
    if (e.life <= 0) state.explosions.splice(i, 1);
  }
}

function update(dt) {
  if (state.mode === "playing") {
    state.gameTime += dt;
    updateCombat(dt);
    if (state.nextLevelIndex < levelTriggers.length && state.gameTime >= levelTriggers[state.nextLevelIndex]) {
      startLevelUp();
    }
  } else if (state.mode === "levelUp") {
    state.levelElapsed += dt;
  }
  updateExplosions(dt);
}

function drawBackground(t) {
  if (assetReady(imageAssets.background)) {
    coverImage(imageAssets.background, 0, 0, W, H);
    ctx.fillStyle = "rgba(0, 5, 10, 0.18)";
    ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createRadialGradient(C.x, C.y, 80, C.x, C.y, 720);
    g.addColorStop(0, "#061720");
    g.addColorStop(0.38, "#020a10");
    g.addColorStop(1, "#010306");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.save();
  ctx.globalAlpha = 0.13;
  const neb = ctx.createLinearGradient(40, 240, 680, 980);
  neb.addColorStop(0, "rgba(90, 126, 142, 0)");
  neb.addColorStop(0.5, "rgba(118, 156, 174, 0.45)");
  neb.addColorStop(1, "rgba(90, 126, 142, 0)");
  ctx.fillStyle = neb;
  ctx.translate(Math.sin(t * 0.05) * 16, Math.cos(t * 0.04) * 10);
  ctx.rotate(-0.28);
  ctx.fillRect(-150, H * 0.45, W + 300, 120);
  ctx.restore();
  for (const s of state.stars) {
    const twinkle = 0.5 + Math.sin(t * s.d + s.seed) * 0.35;
    ctx.fillStyle = `rgba(210,245,255,${s.a * twinkle})`;
    ctx.beginPath();
    ctx.arc(s.x, (s.y + t * s.d * 8) % H, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEnemyRing() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const e of state.enemies) {
    const tail = 34 + e.size * 1.7;
    const back = { x: e.x - Math.cos(e.angle) * tail, y: e.y - Math.sin(e.angle) * tail };
    const grd = ctx.createLinearGradient(back.x, back.y, e.x, e.y);
    grd.addColorStop(0, "rgba(255, 76, 30, 0)");
    grd.addColorStop(0.45, "rgba(255, 125, 40, 0.35)");
    grd.addColorStop(1, "rgba(255, 238, 178, 0.95)");
    ctx.strokeStyle = grd;
    ctx.lineWidth = e.size * 0.78;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(back.x, back.y);
    ctx.lineTo(e.x, e.y);
    ctx.stroke();
    const sprite = sprites.enemy[e.sprite % sprites.enemy.length];
    if (!drawSprite(sprite, e.x, e.y, e.size * 4.2, e.size * 3.3, e.angle + Math.PI / 2)) {
      ctx.fillStyle = "#fff2bf";
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(20, 10, 6, 0.72)";
      ctx.beginPath();
      ctx.arc(e.x - Math.cos(e.angle) * e.size * 0.1, e.y - Math.sin(e.angle) * e.size * 0.1, e.size * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawEarth(t) {
  ctx.save();
  const pulse = state.shield > 0 ? 1 + Math.sin(t * 4) * 0.03 : 1;
  ctx.translate(C.x, C.y);
  ctx.scale(pulse, pulse);
  if (assetReady(imageAssets.atlas)) {
    ctx.save();
    ctx.shadowColor = "rgba(95,245,255,0.75)";
    ctx.shadowBlur = 26;
    ctx.drawImage(
      imageAssets.atlas,
      sprites.earth.x,
      sprites.earth.y,
      sprites.earth.w,
      sprites.earth.h,
      -earthRadius * 1.36,
      -earthRadius * 1.36,
      earthRadius * 2.72,
      earthRadius * 2.72
    );
    ctx.restore();
    if (state.shield > 0) {
      drawShieldField(t, earthRadius + 20);
    }
    ctx.restore();
    return;
  }
  const shadow = ctx.createRadialGradient(-25, -28, 8, 0, 0, earthRadius * 1.08);
  shadow.addColorStop(0, "#a7efff");
  shadow.addColorStop(0.25, "#277fc2");
  shadow.addColorStop(0.55, "#143a62");
  shadow.addColorStop(0.82, "#071629");
  shadow.addColorStop(1, "#01050a");
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.arc(0, 0, earthRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.clip();
  ctx.rotate(t * 0.08);
  drawLand(-25, -14, 64, 34, "#2f8c5a");
  drawLand(28, 24, 54, 30, "#6da555");
  drawLand(-42, 38, 36, 22, "#b8894d");
  drawLand(16, -36, 44, 21, "#e7d7a0");
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 34; i++) {
    ctx.fillStyle = "#ffd77a";
    ctx.fillRect(rand(-60, 32), rand(15, 60), rand(1, 3), rand(1, 3));
  }
  ctx.restore();
  ctx.save();
  ctx.translate(C.x, C.y);
  const rim = ctx.createRadialGradient(0, 0, earthRadius * 0.6, 0, 0, earthRadius * 1.55);
  rim.addColorStop(0, "rgba(0,0,0,0)");
  rim.addColorStop(0.65, "rgba(0,0,0,0)");
  rim.addColorStop(1, "rgba(98, 229, 255, 0.32)");
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.arc(0, 0, earthRadius * 1.55, 0, Math.PI * 2);
  ctx.fill();
  if (state.shield > 0) {
    ctx.strokeStyle = "rgba(112,247,255,0.65)";
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 12]);
    ctx.rotate(t * 0.6);
    ctx.beginPath();
    ctx.arc(0, 0, earthRadius + 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawShieldField(t, radius) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.rotate(t * 0.34);
  for (let i = 0; i < 2; i++) {
    ctx.strokeStyle = i === 0 ? "rgba(112,247,255,0.62)" : "rgba(255,255,255,0.24)";
    ctx.lineWidth = i === 0 ? 3.5 : 1.2;
    ctx.setLineDash(i === 0 ? [14, 10] : [4, 13]);
    ctx.beginPath();
    ctx.arc(0, 0, radius + i * 12, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  const glow = ctx.createRadialGradient(0, 0, radius * 0.6, 0, 0, radius * 1.55);
  glow.addColorStop(0, "rgba(0,0,0,0)");
  glow.addColorStop(0.68, "rgba(0,0,0,0)");
  glow.addColorStop(1, "rgba(82, 235, 255, 0.20)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLand(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, w / 2, h / 2, rand(-0.4, 0.4), 0, Math.PI * 2);
  ctx.fill();
}

function drawDefenders(t) {
  for (const sat of state.satellites) {
    const p = pointOnCircle(sat.angle, sat.orbit);
    const sprite = sprites.satellite[Math.floor(Math.abs(sat.angle * 10)) % sprites.satellite.length];
    if (!drawSprite(sprite, p.x, p.y, 42, 34, sat.angle + Math.PI / 2)) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(sat.angle + Math.PI / 2);
      ctx.strokeStyle = "rgba(112,247,255,0.45)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-9, -5, 18, 10);
      ctx.fillStyle = "#bdefff";
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    }
  }
  for (const d of state.defenders) {
    const p = pointOnCircle(d.angle, d.orbit);
    const target = nearestEnemy(p, 520);
    const a = target ? angleTo(p, target) : d.angle;
    const launch = Math.min(1, (state.gameTime - d.born) / 0.55);
    const fromEarth = pointOnCircle(d.angle, earthRadius + 18);
    const x = fromEarth.x + (p.x - fromEarth.x) * launch;
    const y = fromEarth.y + (p.y - fromEarth.y) * launch;
    drawTinyPlane(x, y, a, t);
  }
}

function drawTinyPlane(x, y, angle, t) {
  const variant = Math.abs(Math.floor((x + y + t * 7) % sprites.plane.length));
  if (drawSprite(sprites.plane[variant], x, y, 34, 44, angle + Math.PI / 2)) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(67, 244, 255, 0.55)";
    ctx.beginPath();
    ctx.ellipse(x - Math.cos(angle) * 18, y - Math.sin(angle) * 18, 12, 3.2, angle, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "#e9f7ff";
  ctx.strokeStyle = "#6ff7ff";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-9, -8);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-9, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(67, 244, 255, 0.8)";
  ctx.beginPath();
  ctx.ellipse(-10, 0, 7 + Math.sin(t * 12) * 2, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBullets() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const b of state.bullets) {
    const a = Math.atan2(b.vy, b.vx);
    const backX = b.x - Math.cos(a) * 24;
    const backY = b.y - Math.sin(a) * 24;
    const grd = ctx.createLinearGradient(backX, backY, b.x, b.y);
    grd.addColorStop(0, "rgba(40,240,255,0)");
    grd.addColorStop(1, "rgba(130,255,255,0.98)");
    ctx.strokeStyle = grd;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(backX, backY);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    const sprite = sprites.bullet[Math.floor(Math.abs(b.hue)) % sprites.bullet.length];
    drawSprite(sprite, b.x, b.y, 12, 24, a + Math.PI / 2, 0.9);
  }
  ctx.restore();
}

function drawBeams() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const beam of state.beams) {
    const k = Math.max(0, beam.life / beam.max);
    if (beam.type === "pulse") {
      ctx.strokeStyle = `rgba(112,247,255,${k * 0.8})`;
      ctx.lineWidth = 6 * k;
      ctx.beginPath();
      ctx.arc(C.x, C.y, beam.radius + (1 - k) * 260, 0, Math.PI * 2);
      ctx.stroke();
      continue;
    }
    const width = beam.type === "beam" ? 38 : 10;
    const len = 760;
    const x2 = C.x + Math.cos(beam.angle) * len;
    const y2 = C.y + Math.sin(beam.angle) * len;
    ctx.strokeStyle = beam.type === "beam" ? `rgba(150,245,255,${0.62 * k})` : `rgba(210,255,255,${0.86 * k})`;
    ctx.lineWidth = width * k;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(C.x, C.y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${0.9 * k})`;
    ctx.lineWidth = Math.max(2, width * 0.18 * k);
    ctx.beginPath();
    ctx.moveTo(C.x, C.y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawExplosions() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < state.explosions.length; i++) {
    const e = state.explosions[i];
    const k = Math.max(0, e.life / e.max);
    const inv = 1 - k;
    const r = (e.type === "spark" ? 18 : 36) * e.scale * (0.35 + inv);
    const sprite = sprites.explosion[i % sprites.explosion.length];
    drawSprite(sprite, e.x, e.y, r * 2.15, r * 2.0, 0, Math.min(1, k + 0.25));
    const color = e.color || "#ffefb5";
    const grd = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
    grd.addColorStop(0, `rgba(255,255,255,${0.95 * k})`);
    grd.addColorStop(0.35, color.replace(")", `,${0.7 * k})`).replace("rgb", "rgba"));
    grd.addColorStop(1, "rgba(255,100,20,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawLevelUp(t) {
  if (state.mode !== "levelUp") return;
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
  ctx.fillRect(0, 0, W, H);
  const intro = Math.min(1, state.levelElapsed / 0.35);
  ctx.globalAlpha = intro;
  drawTitlePlaque(142, 282, 436, 82, "Level Up");
  const cardW = 196;
  const cardH = 382;
  const gap = 22;
  const startX = (W - cardW * 3 - gap * 2) / 2;
  const y = 404;
  state.cards = [];
  for (let i = 0; i < 3; i++) {
    const x = startX + i * (cardW + gap);
    const option = state.levelOptions[i];
    state.cards.push({ x, y, w: cardW, h: cardH });
    drawUpgradeCard(option, x, y, cardW, cardH, i, t);
  }
  ctx.restore();
}

function drawTitlePlaque(x, y, w, h, text) {
  ctx.save();
  ctx.shadowColor = "#6ff7ff";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "rgba(2, 20, 25, 0.92)";
  ctx.strokeStyle = "#8dfcff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 40, y);
  ctx.lineTo(x + w - 40, y);
  ctx.lineTo(x + w, y + h / 2);
  ctx.lineTo(x + w - 40, y + h);
  ctx.lineTo(x + 40, y + h);
  ctx.lineTo(x, y + h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ecfbff";
  ctx.font = "700 46px Avenir Next Condensed, DIN Condensed, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + w / 2, y + h / 2 + 3);
  ctx.restore();
}

function drawUpgradeCard(option, x, y, w, h, index, t) {
  const color = rarityColor[option.rarity] || "#8ff7ff";
  const affordable = state.money >= option.price;
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = option.rarity === "mythic" ? 24 : 12;
  ctx.fillStyle = affordable ? "rgba(4, 20, 26, 0.94)" : "rgba(25, 31, 34, 0.9)";
  roundedRect(x, y, w, h, 16);
  ctx.fill();

  const frameIndex = option.rarity === "rare" ? 1 : option.rarity === "epic" ? 2 : option.rarity === "legendary" ? 3 : option.rarity === "mythic" ? 4 : 0;
  const beforeAlpha = ctx.globalAlpha;
  ctx.globalAlpha *= affordable ? 0.74 : 0.42;
  if (!drawSprite(sprites.cardFrame[frameIndex], x + w / 2, y + h / 2, w + 14, h + 18, 0, affordable ? 1 : 0.52)) {
    ctx.strokeStyle = color;
    ctx.lineWidth = option.rarity === "common" ? 2 : 4;
    roundedRect(x, y, w, h, 14);
    ctx.stroke();
  }
  ctx.globalAlpha = beforeAlpha;

  ctx.fillStyle = "rgba(0, 0, 0, 0.36)";
  roundedRect(x + 20, y + 78, w - 40, 126, 12);
  ctx.fill();
  ctx.strokeStyle = "rgba(143, 247, 255, 0.18)";
  ctx.lineWidth = 1;
  roundedRect(x + 20, y + 78, w - 40, 126, 12);
  ctx.stroke();

  drawUpgradeIcon(option, x + w / 2, y + 142, 52, t);
  ctx.fillStyle = "#ecfbff";
  ctx.font = "800 22px Avenir Next Condensed, DIN Condensed, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  fitText(option.name, x + w / 2, y + 44, w - 42, 22, 15);

  ctx.fillStyle = color;
  ctx.font = "800 17px Avenir Next Condensed, DIN Condensed, sans-serif";
  ctx.fillText(option.category, x + w / 2, y + 230);

  ctx.fillStyle = "rgba(7, 17, 22, 0.68)";
  roundedRect(x + 18, y + 250, w - 36, 68, 10);
  ctx.fill();
  ctx.fillStyle = "rgba(221,247,255,0.86)";
  ctx.font = "600 16px Avenir Next Condensed, DIN Condensed, sans-serif";
  wrapText(option.effect, x + 24, y + 274, w - 48, 20, 2);

  ctx.fillStyle = affordable ? "rgba(3, 20, 25, 0.86)" : "rgba(10, 14, 16, 0.78)";
  roundedRect(x + 36, y + h - 76, w - 72, 48, 10);
  ctx.fill();
  ctx.strokeStyle = affordable ? "rgba(143, 247, 255, 0.22)" : "rgba(180, 190, 190, 0.14)";
  roundedRect(x + 36, y + h - 76, w - 72, 48, 10);
  ctx.stroke();
  ctx.fillStyle = affordable ? "rgba(210,246,255,0.94)" : "rgba(180,190,190,0.48)";
  ctx.font = "800 44px Avenir Next Condensed, DIN Condensed, sans-serif";
  ctx.fillText(`¥${option.price}`, x + w / 2, y + h - 51);
  ctx.restore();
}

function drawUpgradeIcon(option, x, y, r, t) {
  const numericId = Math.max(0, Number(option.id || 1) - 1);
  const iconIndex = upgradeIconIndexByCategory[option.category] ?? numericId % 27;
  const col = iconIndex % sprites.iconGrid.cols;
  const row = Math.floor(iconIndex / sprites.iconGrid.cols) % 3;
  const icon = {
    x: sprites.iconGrid.x + col * sprites.iconGrid.gapX,
    y: sprites.iconGrid.y + row * sprites.iconGrid.gapY,
    w: sprites.iconGrid.w,
    h: sprites.iconGrid.h
  };
  if (drawSprite(icon, x, y, r * 1.55, r * 1.55, 0, 1)) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalCompositeOperation = "lighter";
  const color = rarityColor[option.rarity] || "#8ff7ff";
  ctx.strokeStyle = color;
  ctx.fillStyle = "rgba(111,247,255,0.22)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  if (option.category === "Gun") {
    for (let i = 0; i < 3; i++) drawTinyPlane(Math.cos(t + i * 2.09) * 36, Math.sin(t + i * 2.09) * 36, t + i * 2.09, t);
  } else if (option.category === "Laser") {
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(-48, 32);
    ctx.lineTo(50, -34);
    ctx.stroke();
  } else if (option.category === "Beam") {
    ctx.fillStyle = "rgba(112,247,255,0.55)";
    ctx.beginPath();
    ctx.moveTo(-14, 42);
    ctx.lineTo(54, -40);
    ctx.lineTo(24, 54);
    ctx.closePath();
    ctx.fill();
  } else if (option.category === "防御") {
    ctx.beginPath();
    ctx.arc(0, 0, 42, 0, Math.PI * 2);
    ctx.stroke();
  } else if (option.category === "地球") {
    ctx.fillStyle = "#2d8ed0";
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5dae63";
    ctx.fillRect(-16, -10, 28, 16);
    ctx.fillRect(8, 12, 24, 14);
  } else if (option.category === "近地卫星") {
    ctx.strokeRect(-38, -12, 76, 24);
    ctx.fillRect(-9, -9, 18, 18);
  } else if (option.category === "经济") {
    ctx.font = "800 58px Avenir Next Condensed, DIN Condensed, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffca5f";
    ctx.fillText("$", 0, 4);
  } else {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8 + t;
      const rr = i % 2 ? 22 : 48;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function fitText(text, x, y, maxWidth, startSize, minSize) {
  let size = startSize;
  do {
    ctx.font = `800 ${size}px Avenir Next Condensed, DIN Condensed, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth || size <= minSize) break;
    size -= 1;
  } while (size >= minSize);
  ctx.fillText(text, x, y);
}

function wrapText(text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const chars = [...text];
  let line = "";
  let lineNo = 0;
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x + maxWidth / 2, y + lineNo * lineHeight);
      line = ch;
      lineNo += 1;
      if (lineNo >= maxLines) break;
    } else {
      line = test;
    }
  }
  if (line && lineNo < maxLines) ctx.fillText(line, x + maxWidth / 2, y + lineNo * lineHeight);
}

function drawGameOver() {
  if (state.mode !== "gameOver") return;
  ctx.fillStyle = "rgba(0,0,0,0.58)";
  ctx.fillRect(0, 0, W, H);
  drawTitlePlaque(100, 520, 520, 96, "防线失守");
  ctx.fillStyle = "#ecfbff";
  ctx.textAlign = "center";
  ctx.font = "600 26px Avenir Next Condensed, DIN Condensed, sans-serif";
  ctx.fillText("点击重开，重新派出地球防卫机", W / 2, 660);
}

function render(t) {
  drawBackground(t);
  drawEnemyRing();
  drawBeams();
  drawEarth(t);
  drawDefenders(t);
  drawBullets();
  drawExplosions();
  drawLevelUp(t);
  drawGameOver();
}

function frame(now) {
  if (!state.last) state.last = now;
  const dt = Math.min(0.033, (now - state.last) / 1000);
  state.last = now;
  state.time += dt;
  update(dt);
  render(state.time);
  requestAnimationFrame(frame);
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * W;
  const y = ((event.clientY - rect.top) / rect.height) * H;
  return { x, y };
}

canvas.addEventListener("pointerdown", async (event) => {
  if (!state.soundOn) {
    await audio.start();
    state.soundOn = true;
    updateHud();
  }
  const p = canvasPoint(event);
  if (state.mode === "levelUp") {
    const index = state.cards.findIndex((card) => p.x >= card.x && p.x <= card.x + card.w && p.y >= card.y && p.y <= card.y + card.h);
    if (index >= 0) chooseUpgrade(index);
  } else if (state.mode === "gameOver") {
    reset();
  }
});

ui.restartBtn.addEventListener("click", () => reset());
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

reset();
requestAnimationFrame(frame);
