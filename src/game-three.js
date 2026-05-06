import * as THREE from "three";
import { AudioEngine } from "./audio.js?v=20260504-techrave2";
import { firstChoices, unlockedPool, upgrades } from "./upgrades.js?v=20260503-polish-runtime1";
import { ENEMY_TYPES, planWave, pickMiniBossKind, createEnemyData } from "./enemies.js?v=20260505-photo";
import { HEROES, activeHeroesForStage, getHero, HeroGauges, MASTER_YIN } from "./heroes.js?v=20260505-photo";
import { getStageBalance, loadProgress, saveProgress, unlockHeroForStage } from "./balance.js?v=20260505-photo";
import { PROLOGUE, EPILOGUE, getEvent, HERO_INTROS, YIN_STORY } from "./dialogue.js?v=20260505-photo";

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
  stageThemeIcon: document.getElementById("stageThemeIcon"),
  stageThemeText: document.getElementById("stageThemeText"),
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
  titlePanel: document.getElementById("titlePanel"),
  startBtn: document.getElementById("startBtn"),
  titleProgress: document.getElementById("titleProgress"),
  titleProgressFill: document.getElementById("titleProgressFill"),
  titleProgressLabel: document.getElementById("titleProgressLabel"),
  // Phase-7 additions:
  dialogueBox: document.getElementById("dialogueBox"),
  dialoguePortrait: document.getElementById("dialoguePortraitImg"),
  dialogueSpeaker: document.getElementById("dialogueSpeaker"),
  dialogueText: document.getElementById("dialogueText"),
  // ULT gauges are now integrated into hero-roster SVG rings at bottom
  prologueOverlay: document.getElementById("prologueOverlay"),
  prologueComicImg: document.getElementById("prologueComicImg"),
  ultCinematic: document.getElementById("ultCinematic"),
  ultCinematicPortrait: document.getElementById("ultCinematicPortrait"),
  ultCinematicName: document.getElementById("ultCinematicName"),
  ultCinematicHero: document.getElementById("ultCinematicHero"),
  heroIntro: document.getElementById("heroIntro"),
  heroIntroImg: document.getElementById("heroIntroImg"),
  heroIntroEyebrow: document.getElementById("heroIntroEyebrow"),
  heroIntroName: document.getElementById("heroIntroName"),
  heroIntroCountry: document.getElementById("heroIntroCountry"),
  heroIntroPassive: document.getElementById("heroIntroPassive"),
  heroIntroUlt: document.getElementById("heroIntroUlt"),
  bossReveal: document.getElementById("bossReveal"),
  bossRevealImg: document.getElementById("bossRevealImg"),
  bossRevealName: document.getElementById("bossRevealName"),
  bossRevealAbility: document.getElementById("bossRevealAbility"),
  yinIntro: document.getElementById("yinIntro"),
  yinIntroSpeaker: document.getElementById("yinIntroSpeaker"),
  yinIntroText: document.getElementById("yinIntroText"),
  yinBadge: document.getElementById("yinBadge"),
  miniBossTag: document.getElementById("miniBossTag"),
  miniBossName: document.getElementById("miniBossName"),
  miniBossHpFill: document.getElementById("miniBossHpFill"),
  bossBanner: document.getElementById("bossBanner"),
  bossBannerName: document.getElementById("bossBannerName"),
  bossBannerSub: document.getElementById("bossBannerSub"),
  floaters: document.getElementById("floaters"),
  stageThemeBadge: document.getElementById("stageThemeBadge"),
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

/* ═══════════════════════════════════════════════════════════════
   Number rolling — animate stat changes for tactile feedback
   ═══════════════════════════════════════════════════════════════ */
const _roll = {};
function setRollingNumber(el, key, target, opts = {}) {
  if (!el) return;
  const duration = opts.duration ?? 280;
  const fmt = opts.fmt || ((v) => Math.floor(v).toString());
  const cur = _roll[key];
  if (cur && cur.target === target) return;
  const startVal = cur ? cur.current : Number(el.textContent) || 0;
  const start = performance.now();
  if (cur && cur.raf) cancelAnimationFrame(cur.raf);
  const entry = { target, current: startVal, raf: 0 };
  _roll[key] = entry;
  function tick(now) {
    const k = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - k, 3);
    const value = startVal + (target - startVal) * eased;
    entry.current = value;
    el.textContent = fmt(value);
    if (k < 1) {
      entry.raf = requestAnimationFrame(tick);
    } else {
      el.textContent = fmt(target);
      entry.current = target;
    }
  }
  entry.raf = requestAnimationFrame(tick);
}

/* ═══════════════════════════════════════════════════════════════
   Floaters — drifting `+¥1` / `+5` text from kill positions.
   Recycled DOM nodes via a small pool, removed by animationend.
   ═══════════════════════════════════════════════════════════════ */
const _floaterPool = [];
function spawnFloater(text, sceneX, sceneY, kind = "money") {
  if (!ui.floaters || !ui.stage) return;
  const node = _floaterPool.pop() || document.createElement("div");
  node.className = `floater is-${kind}`;
  node.textContent = text;
  // Convert game-space (720x1280) to stage-relative px
  const stageRect = ui.stage.getBoundingClientRect();
  const sx = (sceneX / W) * stageRect.width;
  const sy = (sceneY / H) * stageRect.height;
  node.style.left = `${sx}px`;
  node.style.top = `${sy}px`;
  node.style.animation = "none";
  ui.floaters.appendChild(node);
  // Restart animation
  // eslint-disable-next-line no-unused-expressions
  node.offsetHeight;
  node.style.animation = "";
  node.addEventListener(
    "animationend",
    () => {
      if (node.parentNode) node.parentNode.removeChild(node);
      if (_floaterPool.length < 32) _floaterPool.push(node);
    },
    { once: true },
  );
}

/* ═══════════════════════════════════════════════════════════════
   Boss intro banner — full-stage drama on stage spawn
   ═══════════════════════════════════════════════════════════════ */
let _bossBannerTimer = null;
function showBossBanner(name, sub) {
  if (!ui.bossBanner) return;
  if (_bossBannerTimer) clearTimeout(_bossBannerTimer);
  if (ui.bossBannerName) ui.bossBannerName.textContent = name;
  if (ui.bossBannerSub) ui.bossBannerSub.textContent = sub || "";
  ui.bossBanner.hidden = false;
  // Force animation restart
  ui.bossBanner.style.animation = "none";
  // eslint-disable-next-line no-unused-expressions
  ui.bossBanner.offsetHeight;
  ui.bossBanner.style.animation = "";
  _bossBannerTimer = setTimeout(() => {
    if (ui.bossBanner) ui.bossBanner.hidden = true;
    _bossBannerTimer = null;
  }, 2400);
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
const ASSET_VERSION = "20260505-photo";
const qaParams = new URLSearchParams(window.location.search);

// ─── Performance tier ─────────────────────────────────────────────────
// Old iPhones (A10/A11 chips, 2-3 GB RAM) hit WebGL memory ceilings and
// fragment-shader limits hard. Detect low-end devices and degrade visuals
// instead of letting the page crash. ?perf=low forces it for testing.
const _ua = navigator.userAgent || "";
const _deviceMemory = navigator.deviceMemory || 4; // missing on Safari → assume mid
const _cores = navigator.hardwareConcurrency || 4;
const _isOldiOS = /iPhone OS (\d+)_/.test(_ua) && parseInt(RegExp.$1, 10) < 16;
// Android: most mid-range devices ship with weaker GPUs (Mali / Adreno 6xx-)
// than Apple's A-series, so default to low-tier on any Android < 13. Modern
// flagships (Android 13+ + 8 GB RAM + 8 cores) get the regular path.
const _androidVer = _ua.match(/Android (\d+)/);
const _isOlderAndroid = _androidVer && parseInt(_androidVer[1], 10) < 13;
const _isAndroid = /Android/.test(_ua);
const PERF_LOW =
  qaParams.get("perf") === "low" ||
  _deviceMemory <= 3 ||
  _cores <= 4 ||
  _isOldiOS ||
  _isOlderAndroid ||
  // Mid-tier Android (≥13 but limited memory/cores) still wants the
  // lighter path — only flagship-class Androids skip it.
  (_isAndroid && (_deviceMemory < 6 || _cores < 8));
const PERF = {
  low: PERF_LOW,
  // DPR cap. 1.0 on low-end halves the pixel count vs DPR=2; even mid-tier
  // benefits from 1.5 vs 2 with no perceptible quality drop on a 6"+ screen.
  dprCap: PERF_LOW ? 1 : 1.5,
  antialias: !PERF_LOW,
  starCounts: PERF_LOW ? [240, 90, 32] : [620, 220, 80],
  nebulaCount: PERF_LOW ? 0 : 7,
  shootingStars: !PERF_LOW,
};
if (PERF_LOW) console.log("[perf] low-power tier active", { _deviceMemory, _cores, _isOldiOS });
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

const polishAssetBase = "assets/generated/polish/final";
const polishTextureFiles = {
  polishBossWeakpointCore: "boss-weakpoint-core",
  polishBossRageAura: "boss-rage-aura",
  polishDangerWarningRing: "danger-warning-ring",
  polishBossChargeLane: "boss-charge-lane",
  polishFreezeBomb: "tactical-freeze-bomb",
  polishRailCannon: "orbital-rail-cannon",
  polishEarthRepairNanites: "earth-repair-nanites",
  polishShieldOvercharge: "shield-overcharge",
  polishShopLockCard: "shop-lock-card",
  polishRarityRerollPrism: "rarity-reroll-prism",
  polishWarFundCache: "war-fund-cache",
  polishHireFleetBeacon: "hire-fleet-beacon",
  polishStageAsteroidBelt: "stage-asteroid-belt",
  polishStageMothershipShadow: "stage-mothership-shadow",
  polishStageIonStorm: "stage-ion-storm",
  polishStageEclipseFinale: "stage-eclipse-finale",
};

const stageThemes = [
  { max: 2, key: "polishStageAsteroidBelt", label: "陨石带" },
  { max: 4, key: "polishStageMothershipShadow", label: "母舰阴影" },
  { max: 7, key: "polishStageIonStorm", label: "电磁风暴" },
  { max: 10, key: "polishStageEclipseFinale", label: "日蚀终局" },
];

const polishIconByUpgradeName = {
  冰蓝减速: "tactical-freeze-bomb",
  轨道冻结: "tactical-freeze-bomb",
  时间减速: "tactical-freeze-bomb",
  轨道裁决: "orbital-rail-cannon",
  地平线炮: "orbital-rail-cannon",
  近轨炮台: "orbital-rail-cannon",
  修复卫星: "earth-repair-nanites",
  应急修复: "earth-repair-nanites",
  轨道维修站: "earth-repair-nanites",
  护盾发生器: "shield-overcharge",
  护盾回流: "shield-overcharge",
  盖亚圣盾: "shield-overcharge",
  极限护盾: "shield-overcharge",
  环形屏障: "shield-overcharge",
  稀有补贴: "rarity-reroll-prism",
  黑市改装: "rarity-reroll-prism",
  低价采购: "rarity-reroll-prism",
  战争债券: "war-fund-cache",
  无限预算: "war-fund-cache",
  黑洞贷款: "war-fund-cache",
  贪婪协议: "war-fund-cache",
  近地机群: "hire-fleet-beacon",
  超量起飞: "hire-fleet-beacon",
  卫星阵列: "hire-fleet-beacon",
};

const polishShowcaseByCategory = {
  经济: "polishWarFundCache",
  防御: "polishShieldOvercharge",
  特殊: "polishFreezeBomb",
  近地卫星: "polishHireFleetBeacon",
  Gun: "polishHireFleetBeacon",
};

/* ═══════════════════════════════════════════════════════════════
   Asset loading — unified progress counter
   ═══════════════════════════════════════════════════════════════ */
// Tracks every texture fetch (via THREE.LoadingManager) plus every audio
// sample (via AudioEngine.onItemQueued/Done callbacks) so the title-screen
// progress bar reflects total bytes-to-go, not just textures. Resolves a
// one-shot promise the 开始游戏 click handler awaits.
// IMPORTANT: declared *before* the audio block so audio.preload()'s
// reportAssetQueued calls don't hit a temporal-dead-zone for these `let`s.
const loadingManager = new THREE.LoadingManager();
let _assetsLoadedCount = 0;
let _assetsTotalCount = 0;
let _assetsResolve = null;
const _allAssetsReady = new Promise((r) => { _assetsResolve = r; });
const _progressListeners = new Set();
function _emitProgress() {
  const total = Math.max(_assetsTotalCount, 1);
  const ratio = Math.min(1, _assetsLoadedCount / total);
  for (const fn of _progressListeners) fn(ratio, _assetsLoadedCount, _assetsTotalCount);
  if (_assetsLoadedCount >= _assetsTotalCount && _assetsTotalCount > 0 && _assetsResolve) {
    const r = _assetsResolve;
    _assetsResolve = null;
    r();
  }
}
function reportAssetLoaded() { _assetsLoadedCount += 1; _emitProgress(); }
function reportAssetQueued() { _assetsTotalCount += 1; _emitProgress(); }
loadingManager.onStart = () => _emitProgress();
loadingManager.onProgress = (_url, loaded, total) => {
  // Texture-side counter: trust LoadingManager's running tally for textures;
  // audio increments via the queued/done callbacks on top.
  _assetsLoadedCount = Math.max(_assetsLoadedCount, loaded);
  _assetsTotalCount = Math.max(_assetsTotalCount, total);
  _emitProgress();
};
loadingManager.onLoad = () => {
  _assetsLoadedCount = Math.max(_assetsLoadedCount, _assetsTotalCount);
  _emitProgress();
};
function onAssetProgress(fn) { _progressListeners.add(fn); }

/* ═══════════════════════════════════════════════════════════════
   Audio — preload samples on import
   ═══════════════════════════════════════════════════════════════ */
const audio = new AudioEngine();
// Plug audio loading into the unified progress counter.
audio.onItemQueued = reportAssetQueued;
audio.onItemDone = reportAssetLoaded;
audio.preload();

/* ═══════════════════════════════════════════════════════════════
   Phase-7 Roguelite — persistent progress + dialogue + ult gauges
   ═══════════════════════════════════════════════════════════════ */
let progress = loadProgress();
let activeHeroes = activeHeroesForStage(1); // recomputed when stage advances
let heroGauges = new HeroGauges(activeHeroes);

// Dialogue queue — plays a list of {speaker, text} lines, auto-advancing on
// duration timer. Tap-to-skip on the box advances immediately.
// `sceneKey` (e.g. "stage-1", "prologue") drives voice file lookup:
//   assets/voice/{sceneKey}/{idx2}-{speaker}.mp3
const _dialogueState = { lines: [], idx: 0, timer: 0, lineDuration: 0, onDone: null, sceneKey: null, eventName: null };
let _voiceAudio = null;

// iOS Safari blocks each `new Audio().play()` after the initial user-gesture
// unless the same Audio instance is reused. So we build ONE Audio element
// the first time we need to speak, then keep swapping its src — that path
// stays unlocked and replays through the whole dialogue.
function stopVoice() {
  if (_voiceAudio) {
    try { _voiceAudio.pause(); _voiceAudio.currentTime = 0; } catch (e) { /* ignore */ }
  }
}

function duckMusic(amount) {
  if (!audio.musicGain || !audio.ctx) return;
  audio.musicGain.gain.cancelScheduledValues(audio.ctx.currentTime);
  audio.musicGain.gain.setTargetAtTime(amount, audio.ctx.currentTime, 0.06);
}

// Hold music silent for the entire prologue / hero-intro / boss-reveal
// span so dialogue lines never compete with the techno track. Per-line
// duck levels are too low — the player still heard music wash over the
// voice after each clip ended. Manual hold + release fixes that.
let _voiceHoldDepth = 0;
function holdMusicForVoice() {
  _voiceHoldDepth += 1;
  duckMusic(0.0);
}
function releaseMusicHold() {
  _voiceHoldDepth = Math.max(0, _voiceHoldDepth - 1);
  if (_voiceHoldDepth === 0) duckMusic(0.62);
}

function playLineVoice(sceneKey, idx, speaker, eventName = null, opts = {}) {
  if (!sceneKey) { stopVoice(); return; }
  const idx2 = String(idx).padStart(2, "0");
  const fname = eventName ? `${eventName}-${idx2}-${speaker}.mp3` : `${idx2}-${speaker}.mp3`;
  const path = `assets/voice/${sceneKey}/${fname}?v=${ASSET_VERSION}`;
  if (!_voiceAudio) {
    _voiceAudio = new Audio();
    _voiceAudio.preload = "auto";
    _voiceAudio.volume = 1.0;
  }
  try { _voiceAudio.pause(); _voiceAudio.currentTime = 0; } catch (e) { /* ignore */ }
  _voiceAudio.onended = null;
  _voiceAudio.onpause = null;
  _voiceAudio.src = path;
  _voiceAudio.playbackRate = opts.rate || 1.0;
  // Duck the music to inaudible while voice plays. 0.06 (≈10× quieter than
  // the 0.62 baseline) is low enough that even iPhone speakers don't bleed
  // music through Lia's voice, but the music never fully fades to keep the
  // session alive (Web Audio context dies if it's silent for too long on
  // some Safari versions).
  duckMusic(0.06);
  const restore = () => { if (_voiceHoldDepth === 0) duckMusic(0.62); };
  _voiceAudio.onended = () => { restore(); if (opts.onEnded) opts.onEnded(); };
  _voiceAudio.onpause = () => { if (_voiceAudio.currentTime >= _voiceAudio.duration - 0.05) restore(); };
  _voiceAudio.play().catch(() => { /* missing file or autoplay blocked — fine */ });
}

function dialogueShowLine(line) {
  if (!ui.dialogueBox) return;
  const speakerHero = HEROES.find((h) => h.id === line.speaker);
  const isYin = line.speaker === MASTER_YIN.id;
  const speakerLabel = speakerHero ? speakerHero.name :
    isYin ? MASTER_YIN.name :
    line.speaker === "boss" ? "BOSS" :
    line.speaker === "narrator" ? "" : line.speaker.toUpperCase();
  // Portrait resolution: hero → cast/{portrait}.png; boss → current
  // bossConfig's frame-00 sprite; narrator → no portrait.
  let portraitSrc = null;
  if (speakerHero) {
    portraitSrc = `assets/cast/${speakerHero.portrait}.png?v=${ASSET_VERSION}`;
  } else if (isYin) {
    portraitSrc = `assets/cast/${MASTER_YIN.portrait}.png?v=${ASSET_VERSION}`;
  } else if (line.speaker === "boss") {
    const bossConfig = getBossConfig(state.stageLevel);
    if (bossConfig) {
      // Boss frame files: boss-{NN}-{slug}-frame-00.png — pull from texture
      // map by guessing the loaded key. game-three loads them as
      // `boss-N-frame-0` style; fallback to the polished card-portrait if
      // the frame texture key isn't found.
      const idx = String(bossConfig.level).padStart(2, "0");
      portraitSrc = `assets/generated/bosses/frames/boss-${idx}-${bossConfig.slug || ""}-frame-00.png?v=${ASSET_VERSION}`;
    }
  }
  if (ui.dialogueSpeaker) ui.dialogueSpeaker.textContent = speakerLabel;
  if (ui.dialogueText) ui.dialogueText.textContent = line.text;
  if (ui.dialoguePortrait) {
    if (portraitSrc) {
      ui.dialoguePortrait.src = portraitSrc;
      ui.dialoguePortrait.style.visibility = "visible";
    } else {
      ui.dialoguePortrait.style.visibility = "hidden";
    }
  }
  ui.dialogueBox.hidden = false;
  // Restart fade-in animation
  ui.dialogueBox.style.animation = "none";
  // eslint-disable-next-line no-unused-expressions
  ui.dialogueBox.offsetHeight;
  ui.dialogueBox.style.animation = "";
  // Voice playback + auto-advance to next line when it finishes. Most players
  // never realized the box was tappable, so the dialogue queue would just
  // stall on screen waiting for a click; auto-advance keeps the script moving.
  // Lock advance to the line we just queued so a voice clip that finished
  // late (after the user already tapped past) doesn't double-advance.
  const queuedIdx = _dialogueState.idx;
  playLineVoice(_dialogueState.sceneKey, _dialogueState.idx, line.speaker, _dialogueState.eventName, {
    onEnded: () => {
      if (_dialogueState.idx === queuedIdx && _dialogueState.lines.length) {
        dialogueAdvance();
      }
    },
  });
}

function dialoguePlay(lines, sceneKey = null, eventName = null, onDone = null) {
  // sceneKey: e.g. "stage-1" or "prologue" (sub-folder under assets/voice/)
  // eventName: e.g. "stage-enter" / "boss-half" (prefix on filename) — null for prologue/epilogue
  if (!lines || !lines.length) { if (onDone) onDone(); return; }
  _dialogueState.lines = lines.slice();
  _dialogueState.idx = 0;
  _dialogueState.timer = 0;
  _dialogueState.onDone = onDone;
  _dialogueState.sceneKey = sceneKey;
  _dialogueState.eventName = eventName;
  _dialogueState.lineDuration = (lines[0].durationMs || 2400) / 1000;
  dialogueShowLine(lines[0]);
}

function dialogueAdvance() {
  _dialogueState.idx += 1;
  if (_dialogueState.idx >= _dialogueState.lines.length) {
    if (ui.dialogueBox) ui.dialogueBox.hidden = true;
    stopVoice();
    if (_dialogueState.onDone) _dialogueState.onDone();
    _dialogueState.lines = [];
    _dialogueState.sceneKey = null;
    return;
  }
  const line = _dialogueState.lines[_dialogueState.idx];
  _dialogueState.timer = 0;
  _dialogueState.lineDuration = (line.durationMs || 2400) / 1000;
  dialogueShowLine(line);
}

function updateDialogue(dt) {
  // During modal panels (level-up / shop / pause / etc.) hide the box.
  // Dialogue resumes when modal closes.
  if (isModalActive() && _dialogueState.lines.length) {
    if (ui.dialogueBox && !ui.dialogueBox.hidden) ui.dialogueBox.hidden = true;
    return;
  }
  if (!_dialogueState.lines.length) return;
  // If we hid it during a modal and now it's re-showing, restore.
  if (ui.dialogueBox && ui.dialogueBox.hidden) {
    dialogueShowLine(_dialogueState.lines[_dialogueState.idx]);
  }
  // Timer-based fallback advance — voice `onEnded` is the primary trigger,
  // but if a clip is missing / blocked / fails to decode we still need to
  // walk through the script. Use a generous duration so the voice usually
  // ends first; the timer only fires when audio truly didn't.
  _dialogueState.timer += dt;
  const timerMax = (_dialogueState.lineDuration || 2.4) + 1.4;
  if (_dialogueState.timer >= timerMax) {
    dialogueAdvance();
  }
}

if (ui.dialogueBox) {
  ui.dialogueBox.addEventListener("pointerdown", () => {
    if (_dialogueState.lines.length) dialogueAdvance();
  });
}

/* ─────────────── Prologue (comic pages) ─────────────── */
const PROLOGUE_PAGES = [
  "assets/story/prologue-1.png",
  "assets/story/prologue-2.png",
];
const _prologueState = { pages: [], idx: 0, onDone: null, done: false };

function showProloguePage(idx) {
  const img = document.getElementById("prologueComicImg");
  if (img) img.src = `${_prologueState.pages[idx]}?v=${ASSET_VERSION}`;
  // Update dots
  const dots = document.getElementById("prologuePageDots");
  if (dots) {
    dots.innerHTML = "";
    for (let i = 0; i < _prologueState.pages.length; i++) {
      const d = document.createElement("span");
      d.className = "prologue-dot" + (i === idx ? " active" : "");
      dots.appendChild(d);
    }
  }
}

function playPrologue(lines, onDone) {
  if (!ui.prologueOverlay || _prologueState.done) {
    if (onDone) onDone();
    return;
  }
  _prologueState.pages = PROLOGUE_PAGES;
  _prologueState.idx = 0;
  _prologueState.onDone = onDone || null;
  ui.prologueOverlay.hidden = false;
  showProloguePage(0);
}

function prologueAdvance() {
  _prologueState.idx += 1;
  if (_prologueState.idx >= _prologueState.pages.length) {
    if (ui.prologueOverlay) ui.prologueOverlay.hidden = true;
    _prologueState.done = true;
    _prologueState.pages = [];
    if (_prologueState.onDone) _prologueState.onDone();
    return;
  }
  showProloguePage(_prologueState.idx);
}

function updatePrologue(dt) {
  // Tap-to-advance only — no auto-timer for comic pages.
}

if (ui.prologueOverlay) {
  ui.prologueOverlay.addEventListener("pointerdown", () => {
    if (_prologueState.pages.length) prologueAdvance();
  });
}

/* ─────────────── Hero introduction cinematic ───────────────
 * Splash screen when a new pilot joins the squad. Plays once per stage
 * transition (Lia at game start, then one new hero per cleared stage).
 * Tap to dismiss → run onDone callback (next stage start). */
const _heroIntroState = { hero: null, onDone: null, phase: "idle" };

// Two-phase hero intro:
//   Phase 1 → fullscreen comic strip (tap to go to phase 2)
//   Phase 2 → hero join card with portrait + name + skills (tap to dismiss)
function playHeroIntro(heroId, onDone = null) {
  const hero = getHero(heroId);
  if (!hero) { if (onDone) onDone(); return; }
  _heroIntroState.hero = hero;
  _heroIntroState.onDone = onDone;
  _heroIntroState.phase = "comic";
  // Phase 1: show fullscreen comic
  const comicOverlay = document.getElementById("heroComic");
  const comicImg = document.getElementById("heroComicImg");
  if (comicOverlay && comicImg) {
    comicImg.src = `assets/cast/${heroId}-comic.png?v=${ASSET_VERSION}`;
    comicOverlay.hidden = false;
  } else {
    // No comic overlay → skip to join card
    showHeroJoinCard();
  }
}

function showHeroJoinCard() {
  const hero = _heroIntroState.hero;
  if (!hero || !ui.heroIntro) { dismissHeroIntro(); return; }
  _heroIntroState.phase = "join";
  // Hide comic overlay
  const comicOverlay = document.getElementById("heroComic");
  if (comicOverlay) comicOverlay.hidden = true;
  // Set up join card
  const r = (hero.color >> 16) & 0xff, g = (hero.color >> 8) & 0xff, b = hero.color & 0xff;
  ui.heroIntro.style.setProperty("--hero-tint", `rgba(${r}, ${g}, ${b}, 0.85)`);
  if (ui.heroIntroImg) {
    ui.heroIntroImg.src = `assets/cast/${hero.actionPortrait || hero.portrait}.png?v=${ASSET_VERSION}`;
  }
  if (ui.heroIntroEyebrow) {
    ui.heroIntroEyebrow.textContent = hero.id === "bright" ? "指挥官出击" : "新队员加入";
  }
  if (ui.heroIntroName) ui.heroIntroName.textContent = hero.name;
  if (ui.heroIntroCountry) ui.heroIntroCountry.textContent = `${hero.country} · ${hero.title}`;
  if (ui.heroIntroPassive) ui.heroIntroPassive.textContent = hero.skillCardName || hero.passive.desc;
  if (ui.heroIntroUlt) ui.heroIntroUlt.textContent = hero.ult.name;
  ui.heroIntro.hidden = false;
  ui.heroIntro.style.animation = "none";
  ui.heroIntro.offsetHeight; // reflow
  ui.heroIntro.style.animation = "";
}

function dismissHeroIntro() {
  const comicOverlay = document.getElementById("heroComic");
  if (comicOverlay) comicOverlay.hidden = true;
  if (ui.heroIntro) ui.heroIntro.hidden = true;
  stopVoice();
  releaseMusicHold();
  const cb = _heroIntroState.onDone;
  _heroIntroState.hero = null;
  _heroIntroState.onDone = null;
  _heroIntroState.phase = "idle";
  if (cb) cb();
}

// Comic overlay tap → advance to join card
const _heroComicEl = document.getElementById("heroComic");
if (_heroComicEl) {
  _heroComicEl.addEventListener("pointerdown", () => {
    if (_heroIntroState.phase === "comic") showHeroJoinCard();
  });
}

if (ui.heroIntro) {
  // Tap on join card → dismiss and proceed
  ui.heroIntro.addEventListener("pointerdown", () => {
    dismissHeroIntro();
  });
}

/* ─────────────── Boss reveal cinematic ───────────────
 * Full-screen warning when a boss spawns. Pauses gameplay, shows the
 * boss frame portrait + name + ability, then dismisses on tap or
 * after a 2.4 s timer so the player isn't trapped reading. */
const _bossRevealState = { onDone: null, autoTimer: null };

function playBossReveal(bossConfig, onDone = null) {
  if (!ui.bossReveal || !bossConfig) { if (onDone) onDone(); return; }
  _bossRevealState.onDone = onDone;
  const idx = String(bossConfig.level).padStart(2, "0");
  const slug = bossConfig.slug || "molten-asteroid";
  if (ui.bossRevealImg) {
    ui.bossRevealImg.src = `assets/generated/bosses/frames/boss-${idx}-${slug}-frame-00.png?v=${ASSET_VERSION}`;
  }
  if (ui.bossRevealName) ui.bossRevealName.textContent = bossConfig.name;
  if (ui.bossRevealAbility) ui.bossRevealAbility.textContent = bossConfig.ability || "";
  ui.bossReveal.hidden = false;
  ui.bossReveal.style.animation = "none";
  // eslint-disable-next-line no-unused-expressions
  ui.bossReveal.offsetHeight;
  ui.bossReveal.style.animation = "";
  // Auto-dismiss after 2.4 s so the player isn't blocked.
  if (_bossRevealState.autoTimer) clearTimeout(_bossRevealState.autoTimer);
  _bossRevealState.autoTimer = setTimeout(dismissBossReveal, 2400);
}

function dismissBossReveal() {
  if (!ui.bossReveal || ui.bossReveal.hidden) return;
  ui.bossReveal.hidden = true;
  if (_bossRevealState.autoTimer) {
    clearTimeout(_bossRevealState.autoTimer);
    _bossRevealState.autoTimer = null;
  }
  const cb = _bossRevealState.onDone;
  _bossRevealState.onDone = null;
  if (cb) cb();
}

if (ui.bossReveal) {
  ui.bossReveal.addEventListener("pointerdown", dismissBossReveal);
}

/* ─────────────── 殷师傅 unlock celebration ───────────────
 * Fired at stage 1 wave 10 the FIRST time. Fullscreen comic splash with
 * 4-line story dialogue (same flow as playHeroIntro). Auto-advances through
 * each line, tap advances to next line or dismisses after the last. */
const _yinIntroState = { autoTimer: null, prevMode: null, lineIdx: 0, lines: YIN_STORY };

function showYinUnlockOverlay() {
  if (!ui.yinIntro) return;
  _yinIntroState.prevMode = state.mode;
  _yinIntroState.lineIdx = 0;
  state.mode = "yinIntro";
  holdMusicForVoice();
  // Set comic image with fallback to action portrait
  const yinImg = document.getElementById("yinIntroImg");
  if (yinImg) {
    yinImg.src = `assets/cast/yin-comic.png?v=${ASSET_VERSION}`;
    yinImg.onerror = () => {
      yinImg.onerror = null;
      yinImg.src = `assets/cast/${MASTER_YIN.actionPortrait || MASTER_YIN.portrait}.png?v=${ASSET_VERSION}`;
    };
  }
  ui.yinIntro.hidden = false;
  ui.yinIntro.style.animation = "none";
  // eslint-disable-next-line no-unused-expressions
  ui.yinIntro.offsetHeight;
  ui.yinIntro.style.animation = "";
  // Show first dialogue line
  showYinIntroLine();
}

function showYinIntroLine() {
  const st = _yinIntroState;
  if (st.lineIdx >= st.lines.length) {
    dismissYinIntro();
    return;
  }
  const line = st.lines[st.lineIdx];
  if (ui.yinIntroSpeaker) ui.yinIntroSpeaker.textContent = line.speaker;
  if (ui.yinIntroText) ui.yinIntroText.textContent = line.text;
  // Auto-advance after duration (or default 3.2s per line)
  if (_yinIntroState.autoTimer) clearTimeout(_yinIntroState.autoTimer);
  _yinIntroState.autoTimer = setTimeout(() => {
    st.lineIdx += 1;
    showYinIntroLine();
  }, line.durationMs || 3200);
}

function advanceYinIntro() {
  if (!ui.yinIntro || ui.yinIntro.hidden) return;
  const st = _yinIntroState;
  if (_yinIntroState.autoTimer) clearTimeout(_yinIntroState.autoTimer);
  st.lineIdx += 1;
  showYinIntroLine();
}

function dismissYinIntro() {
  if (!ui.yinIntro || ui.yinIntro.hidden) return;
  ui.yinIntro.hidden = true;
  if (_yinIntroState.autoTimer) {
    clearTimeout(_yinIntroState.autoTimer);
    _yinIntroState.autoTimer = null;
  }
  releaseMusicHold();
  if (_yinIntroState.prevMode) {
    state.mode = _yinIntroState.prevMode;
    state.last = performance.now();
  }
  _yinIntroState.prevMode = null;
}

if (ui.yinIntro) {
  ui.yinIntro.addEventListener("pointerdown", advanceYinIntro);
}

/* ─────────────── ULT cinematic ───────────────
 * Two layers run together:
 *   1. CSS frame card (portrait + ULT name + signature glow)
 *   2. Three.js scene burst — colored expanding shockwaves at Earth,
 *      explosion bursts at each defender's position, and a screen-wide
 *      particle storm in the hero's signature color. Distinct enough
 *      per-hero via color + shape variation. */
// Fullscreen colored flash plane on the canvas — proves the ULT visually
// dominated the screen. Lives ~1.2s, fades opacity 0 → 0.55 → 0.
function spawnUltScreenFlash(colorHex) {
  const geom = new THREE.PlaneGeometry(W * 1.4, H * 1.4);
  const mat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set(0, 0, 9.8);
  scene.add(mesh);
  const start = state.time;
  const flashEntry = { mesh, mat, start, life: 1.2 };
  _ultFlashes.push(flashEntry);
}

// Updated each frame — fade in then fade out the flash plane(s).
const _ultFlashes = [];
function updateUltFlashes() {
  for (let i = _ultFlashes.length - 1; i >= 0; i--) {
    const f = _ultFlashes[i];
    const t = (state.time - f.start) / f.life;
    if (t >= 1) {
      scene.remove(f.mesh);
      f.mesh.geometry.dispose();
      f.mat.dispose();
      _ultFlashes.splice(i, 1);
      continue;
    }
    // Triangle wave: 0 → 0.55 at t=0.18, → 0 at t=1
    const opacity = t < 0.18 ? (t / 0.18) * 0.55 : (1 - (t - 0.18) / 0.82) * 0.55;
    f.mat.opacity = Math.max(0, opacity);
  }
}

function playUltSceneEffect(hero) {
  const tint = hero.color;
  // Anchor every effect to the actual hero plane that's triggering the ULT.
  // The previous version radiated everything from Earth's center, which felt
  // generic — the player couldn't tell WHICH pilot just fired their ult.
  // Now the shockwaves grow from the plane sprite outward, the beam streaks
  // forward from the nose, and per-enemy explosions chain along the plane's
  // line-of-fire instead of being scattered randomly.
  const heroDef = state.defenders.find((d) => d.kind === "hero" && d.heroId === hero.id);
  const ox = heroDef ? heroDef.x : C.x;
  const oy = heroDef ? heroDef.y : C.y;

  // 1. FULLSCREEN COLOR FLASH — keeps the moment readable through clutter.
  spawnUltScreenFlash(tint);

  // 2. FIVE staggered shockwaves growing FROM the hero plane (not Earth).
  //    Smaller initial size + more growth so it visually launches outward.
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const baseSize = (heroDef?.size || 100) * (1.4 + i * 0.7);
      addPolishEffect("polishDangerWarningRing", ox, oy, baseSize, {
        life: 1.4, grow: 1.6, spin: -1.4, opacity: 0.95, z: 8.6, color: tint,
      });
      addPolishEffect("polishBossRageAura", ox, oy, baseSize * 0.7, {
        life: 1.1, grow: 1.2, spin: 1.6, opacity: 0.85, z: 8.4, color: tint,
      });
    }, i * 160);
  }

  // 3. Forward beam — long streaking energy line in the plane's outward
  //    direction. createEnergyBeam draws a glowing line; we feed it the
  //    radial-outward angle so it streaks away from Earth past the hero.
  if (heroDef) {
    const outwardAngle = Math.atan2(heroDef.y - C.y, heroDef.x - C.x);
    createEnergyBeam(outwardAngle, {
      from: heroDef,
      to: {
        x: heroDef.x + Math.cos(outwardAngle) * 720,
        y: heroDef.y + Math.sin(outwardAngle) * 720,
      },
      life: 0.62,
      color: tint,
      opacity: 0.95,
      wide: true,
    });
  }

  // 4. Particle storm originating AT the hero plane and fanning outward.
  //    50 flashes within an outward cone, fading with distance.
  for (let i = 0; i < 50; i++) {
    setTimeout(() => {
      const fanAngle = Math.atan2(oy - C.y, ox - C.x) + rand(-1.0, 1.0);
      const dist = rand(0, 380);
      const px = ox + Math.cos(fanAngle) * dist;
      const py = oy + Math.sin(fanAngle) * dist;
      spawnInterceptFlash(px, py, 0.7 + Math.random() * 0.7);
    }, i * 22);
  }

  // 5. Companion explosion at every other defender so the squad reads as
  //    "in synch" with the ulting hero — but the BIG burst is at the hero.
  if (state.defenders) {
    for (const def of state.defenders) {
      const isUlting = def === heroDef;
      addExplosion(def.x, def.y, isUlting ? 2.4 : 1.0);
      addPolishEffect("polishBossRageAura", def.x, def.y, def.size * (isUlting ? 3.2 : 1.6), {
        life: 0.8, grow: 0.42, spin: 1.6, opacity: isUlting ? 1.0 : 0.7, z: 4.2, color: tint,
      });
    }
  }

  // 6. Final closing burst — at the hero plane, not Earth, so the energy
  //    visually started AT them and is ending AT them.
  setTimeout(() => {
    addExplosion(ox, oy, 4.6);
    addPolishEffect("polishDangerWarningRing", ox, oy, (heroDef?.size || 100) * 6, {
      life: 1.0, grow: 1.4, spin: -2.4, opacity: 1.0, z: 9.0, color: tint,
    });
    triggerScreenShake(0.95, 22);
  }, 880);

  // Audio + early shake to prime the moment.
  triggerScreenShake(0.7, 16);
  audio.boom();
  setTimeout(() => audio.boom(), 380);
  setTimeout(() => audio.boom(), 880);
}

function playUltCinematic(heroId) {
  const hero = getHero(heroId);
  if (!hero || !ui.ultCinematic) return;
  // 1. Three.js scene burst (radial pulses + per-defender explosion + glitter).
  playUltSceneEffect(hero);
  // Color from hero — fed to CSS via custom property
  const r = (hero.color >> 16) & 0xff;
  const g = (hero.color >> 8) & 0xff;
  const b = hero.color & 0xff;
  const colorRgba = (a) => `rgba(${r}, ${g}, ${b}, ${a})`;
  ui.ultCinematic.style.setProperty("--ult-color", colorRgba(0.92));
  if (ui.ultCinematicPortrait) {
    ui.ultCinematicPortrait.src = `assets/cast/${hero.actionPortrait || hero.portrait}.png?v=${ASSET_VERSION}`;
  }
  if (ui.ultCinematicName) ui.ultCinematicName.textContent = hero.ult.name;
  if (ui.ultCinematicHero) ui.ultCinematicHero.textContent = hero.name;
  ui.ultCinematic.hidden = false;
  // Restart the keyframe animations
  ui.ultCinematic.style.animation = "none";
  // eslint-disable-next-line no-unused-expressions
  ui.ultCinematic.offsetHeight;
  ui.ultCinematic.style.animation = "";
  // Hide after the 1.4s cinematic completes.
  setTimeout(() => { if (ui.ultCinematic) ui.ultCinematic.hidden = true; }, 1400);
}

// Returns true when a fullscreen panel (level-up / shop / pause / game-over /
// victory / title / prologue) is showing — auxiliary HUD widgets should hide
// themselves so they don't compete with the modal for player attention.
function isModalActive() {
  if (state.mode === "title" || state.mode === "prologue" || state.mode === "heroIntro") return true;
  if (state.mode === "bossReveal" || state.mode === "yinIntro") return true;
  if (state.mode === "paused" || state.mode === "levelUp" || state.mode === "shop") return true;
  if (state.mode === "gameOver" || state.mode === "victory") return true;
  return false;
}

// Update ULT ring gauges on the hero roster portraits (bottom bar).
function renderUltGauges() {
  const roster = document.getElementById("heroRoster");
  if (!roster) return;
  const r = 17;
  const circ = 2 * Math.PI * r;
  for (const slot of roster.children) {
    const id = slot.dataset.heroId;
    if (!id) continue;
    const ratio = heroGauges.ratioFor(id);
    const isActive = heroGauges.isUltActive(id);
    const fg = slot.querySelector(".ult-ring-fill");
    if (fg) {
      // clockwise fill: offset goes from circ (empty) to 0 (full)
      fg.setAttribute("stroke-dashoffset", `${circ * (1 - ratio)}`);
      // color changes when ready / active
      if (isActive) {
        fg.setAttribute("stroke", "rgba(199,125,255,0.95)");
      } else if (ratio >= 1) {
        fg.setAttribute("stroke", "rgba(255,209,102,0.95)");
      } else {
        fg.setAttribute("stroke", "rgba(124,232,255,0.9)");
      }
    }
    slot.classList.toggle("is-ready", ratio >= 1 && !isActive);
    slot.classList.toggle("is-active", isActive);
  }
}

const loader = new THREE.TextureLoader(loadingManager);
const scene = new THREE.Scene();
// Z range expanded so SphereGeometry-based earth (radius 64 + atmosphere 78)
// isn't clipped by the near plane. Negative near is valid for orthographic.
const camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, -200, 200);
camera.position.z = 20;

const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: PERF.antialias, powerPreference: PERF.low ? "default" : "high-performance" });
renderer.setSize(W, H, false);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, PERF.dprCap));
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

// 嘲讽 — fly-out sushi sprites. Renders eight food emoji into 128×128
// canvases on startup; each becomes a Three.js texture we can reuse
// freely. Cheap (single draw at load time) and avoids needing actual
// PNG asset generation just for an effect.
const SUSHI_EMOJI = ["🍣", "🍤", "🍙", "🍘", "🍱", "🥢", "🍶", "🍵"];
function makeEmojiTexture(char, size = 128) {
  const cv = document.createElement("canvas");
  cv.width = size; cv.height = size;
  const ctx = cv.getContext("2d");
  ctx.font = `${Math.floor(size * 0.78)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Soft glow under the glyph so it pops on the dark backdrop.
  ctx.shadowColor = "rgba(255, 178, 74, 0.85)";
  ctx.shadowBlur = 18;
  ctx.fillText(char, size / 2, size / 2 + size * 0.05);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}
for (let i = 0; i < SUSHI_EMOJI.length; i++) {
  tex[`sushi-${i}`] = makeEmojiTexture(SUSHI_EMOJI[i]);
}

// Phase-7: hero mecha (top-down) + ULT-active variants + per-hero weapon
// projectiles. Loaded for all 8 even though stage N only uses N — preload
// keeps the unlock animation snappy when a new pilot joins the squad.
for (const h of HEROES) {
  loadTexture(`td-${h.id}`, `assets/cast/td-${h.id}.png`);
  loadTexture(`td-${h.id}-ult`, `assets/cast/td-${h.id}-ult.png`);
  loadTexture(`wp-${h.id}`, `assets/weapons/wp-${h.id}.png`);
  loadTexture(`wp-${h.id}-ult`, `assets/weapons/wp-${h.id}-ult.png`);
}

// Portrait <img> elements used in DialogueBox + ULT cinematic. Use the
// unified asset counter so the title-screen loading bar waits for them
// — fixes "dialogue portraits show black for the first 200 ms" bug.
const portraitPreload = [];
function preloadHtmlImage(src) {
  reportAssetQueued();
  const img = new Image();
  const tick = () => reportAssetLoaded();
  img.onload = tick;
  img.onerror = tick;
  img.src = `${src}?v=${ASSET_VERSION}`;
  portraitPreload.push(img);
}
for (const h of HEROES) {
  preloadHtmlImage(`assets/cast/${h.portrait}.png`);
  // BRIGHT also has an alt cool-side portrait used in some dialogue moments.
  if (h.portraitCool) preloadHtmlImage(`assets/cast/${h.portraitCool}.png`);
  // Action portrait used in the ULT cinematic card.
  if (h.actionPortrait) preloadHtmlImage(`assets/cast/${h.actionPortrait}.png`);
}
for (let i = 0; i < 4; i++) loadTexture(`topdownPlane-${i}`, `${individualAssetBase}/topdown-plane-${i}.png`);
loadTexture("alienSaucer", `${individualAssetBase}/alien-saucer.png`);
loadTexture("alienMeteor", `${individualAssetBase}/alien-meteor.png`);
loadTexture("playerBullet", `${individualAssetBase}/player-bullet.png`);
loadTexture("enemyBolt", `${individualAssetBase}/enemy-bolt.png`);
loadTexture("explosionCore", `${individualAssetBase}/explosion-core.png`);
loadTexture("barrageProjectile", `${individualAssetBase}/barrage-projectile.png`);
loadTexture("starCircle", "assets/textures/star-circle.png");
loadTexture("charPlaneBlue", `${characterAssetBase}/interceptor-blue.png`);
loadTexture("charPlaneGold", `${characterAssetBase}/interceptor-gold.png`);
loadTexture("charPlaneLaser", `${characterAssetBase}/interceptor-laser.png`);
loadTexture("charEnemyMeteor", `${characterAssetBase}/enemy-meteor-crab.png`);
loadTexture("charEnemyBolt", `${characterAssetBase}/enemy-bolt-needle.png`);
loadTexture("charEnemySaucer", `${characterAssetBase}/enemy-saucer-hunter.png`);
for (const [key, file] of Object.entries(polishTextureFiles)) {
  loadTexture(key, `${polishAssetBase}/${file}.png`);
}
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
  health: 120,
  maxHealth: 120,
  shield: 20,
  money: 5,
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
  // Vampire-Survivors-style per-upgrade level tracking. id → currentLevel.
  upgradeLevels: {},
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
  // Default ON. Browsers block actual playback until first user gesture, so
  // the AudioContext is unlocked on the initial pointerdown anywhere on the stage.
  soundOn: true,
  miniBossesDefeated: 0,
  // 殷师傅 ("嘲讽") stage-1 guest. Each run earns him at stage 1 wave 10
  // and loses him when stage 2 begins — never persists across sessions.
  yinActive: false,
  message: "地球防御系统启动中",
};

// First level-up at 14s gives players quick onboarding feedback; subsequent
// triggers space out so the upgrade rhythm slows as the game gets crowded.
const levelTriggers = Array.from({ length: 80 }, (_, i) => 18 + i * 13 + Math.floor(i / 8) * 5);
const wavesPerStage = 20;
const waveDuration = 5.5;
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
const swarmBaseDensity = 40;
const swarmMaxDensity = 180;
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
  // Clamp the query position to grid bounds before computing the cell.
  // gridKey() also clamps when STORING enemies (so an off-screen enemy at
  // x=1120 gets bucketed into the rightmost valid column). Without the
  // matching clamp here, an off-screen bullet at x=1100 computes col=13,
  // looks at c=11..15 (all out of bounds), and finds zero enemies — even
  // though the enemy it's chasing IS bucketed into col=9. Clamping makes
  // the bullet's query land on the same boundary cells as its target.
  const col = Math.max(0, Math.min(gridCols - 1, (x / GRID_CELL) | 0));
  const row = Math.max(0, Math.min(gridRows - 1, (y / GRID_CELL) | 0));
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

function currentStageTheme() {
  return stageThemes.find((theme) => state.stageLevel <= theme.max) || stageThemes[stageThemes.length - 1];
}

function polishAssetUrl(slug) {
  return `${polishAssetBase}/${slug}.png?v=${ASSET_VERSION}`;
}

function polishTextureKeyFromSlug(slug) {
  for (const [key, file] of Object.entries(polishTextureFiles)) {
    if (file === slug) return key;
  }
  return null;
}

function bossWeakpointPosition(boss) {
  const a = boss.bossPhase * 1.72 + boss.wobble;
  const rx = boss.size * 0.24;
  const ry = boss.size * 0.18;
  return {
    x: boss.x + Math.cos(a) * rx,
    y: boss.y + Math.sin(a) * ry,
    angle: a,
  };
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

  // HP bar — small plane above the enemy, hidden until damaged
  const hpBarW = Math.max(size * 0.9, 40);
  const hpBarH = 4;
  const hpBarGeo = new THREE.PlaneGeometry(hpBarW, hpBarH);
  const hpBarMat = new THREE.MeshBasicMaterial({ color: 0x44ff44, transparent: true, opacity: 0, depthTest: false });
  const hpBar = new THREE.Mesh(hpBarGeo, hpBarMat);
  hpBar.position.set(0, size * 0.7 + 8, 0.2);
  // Background bar (dark)
  const hpBgGeo = new THREE.PlaneGeometry(hpBarW, hpBarH);
  const hpBgMat = new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0, depthTest: false });
  const hpBg = new THREE.Mesh(hpBgGeo, hpBgMat);
  hpBg.position.set(0, size * 0.7 + 8, 0.19);
  group.add(hpBg);
  group.add(hpBar);
  visual.hpBar = hpBar;
  visual.hpBg = hpBg;
  visual.hpBarW = hpBarW;

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

  // Gold meteor — the iconic streaker. Make the flame tail dominate so the
  // overall silhouette reads as "gold streak" even when the central bestiary
  // sprite is overridden later by spawnEnemies.
  visual.tail = createSprite(tex.barrageProjectile, size * 0.92, size * 3.4, { additive: true, opacity: 0.95, color: 0xffd166 });
  visual.tail.position.set(0, -size * 1.05, -0.03);
  visual.flare = createSprite(tex.explosionCore, size * 2.1, size * 2.1, { additive: true, opacity: 0.42, color: 0xffb24a });
  visual.core = createSprite(tex.charEnemyMeteor, size * 1.6, size * 1.6, { opacity: 0.98 });
  visual.rim = makeEnergyRing(size * 0.46, size * 0.05, 0xffd066, 0.55);
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
    rageAura: createSprite(tex.polishBossRageAura, config.size * 1.9, config.size * 1.9, { additive: true, opacity: 0 }),
    warningRing: createSprite(tex.polishDangerWarningRing, config.size * 1.34, config.size * 1.34, { additive: true, opacity: 0 }),
    chargeLane: createSprite(tex.polishBossChargeLane, config.size * 0.55, config.size * 2.1, { additive: true, opacity: 0 }),
    ringOuter: makeEnergyRing(config.size * 0.72, config.size * 0.035, color, 0.32),
    ringInner: makeEnergyRing(config.size * 0.48, config.size * 0.025, 0xc8ffff, 0.18),
    core: createSprite(tex[`boss-${config.level}-0`], config.size, config.size, { opacity: 1 }),
    weakpoint: createSprite(tex.polishBossWeakpointCore, config.size * 0.36, config.size * 0.36, { additive: true, opacity: 0.92 }),
  };
  visual.weakpoint.position.set(0, 0, 0.14);
  visual.warningRing.position.set(0, 0, 0.08);
  visual.rageAura.position.set(0, 0, 0.03);
  visual.chargeLane.position.set(0, -config.size * 0.66, -0.02);
  group.add(visual.chargeLane, visual.aura, visual.rageAura, visual.warningRing, visual.ringOuter, visual.ringInner, visual.core, visual.weakpoint);
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
    const danger = 1 - hpRatio;
    const weak = bossWeakpointPosition(enemy);
    visual.weakpoint.position.set(Math.cos(weak.angle) * config.size * 0.24, -Math.sin(weak.angle) * config.size * 0.18, 0.14);
    visual.weakpoint.material.rotation = state.time * 1.6;
    visual.weakpoint.material.opacity = 0.74 + Math.sin(state.time * 5.4 + enemy.wobble) * 0.18;
    const weakSize = config.size * 0.36 * (1 + Math.sin(state.time * 6.8) * 0.08);
    visual.weakpoint.scale.set(weakSize, weakSize, 1);
    const pulse = 1 + Math.sin(state.time * 3.8 + enemy.wobble) * 0.035 + (1 - hpRatio) * 0.035;
    visual.group.scale.set(pulse, pulse, 1);
    visual.group.rotation.z = Math.sin(state.time * 0.72 + enemy.wobble) * 0.04;
    visual.ringOuter.rotation.z += dt * (0.7 + config.level * 0.04);
    visual.ringInner.rotation.z -= dt * (1.1 + config.level * 0.05);
    visual.aura.material.opacity = 0.14 + Math.sin(state.time * 4.6 + enemy.wobble) * 0.045 + (1 - hpRatio) * 0.1;
    visual.rageAura.material.opacity = Math.max(0, danger - 0.38) * 0.95 + (enemy.bossCharging ? 0.2 : 0);
    visual.rageAura.material.rotation -= dt * (0.55 + config.level * 0.03);
    const attackWarn = enemy.attackTimer < 0.75 ? 1 - Math.max(0, enemy.attackTimer / 0.75) : 0;
    visual.warningRing.material.opacity = Math.max(enemy.bossCharging ? 0.5 : 0, attackWarn * 0.74);
    visual.warningRing.material.rotation += dt * (1.9 + attackWarn * 1.2);
    const toEarth = angleTo(enemy, C);
    const laneAlpha = enemy.bossCharging ? 0.56 : attackWarn * 0.34;
    visual.chargeLane.material.opacity = laneAlpha;
    visual.chargeLane.material.rotation = -toEarth + Math.PI / 2;
    visual.chargeLane.scale.set(config.size * (0.42 + attackWarn * 0.12), Math.max(config.size * 1.6, enemy.radius * 0.78), 1);
    visual.chargeLane.position.set(Math.cos(toEarth) * config.size * 0.72, -Math.sin(toEarth) * config.size * 0.72, -0.02);
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

  // Rotate the whole visual group (flame tail, flare, core, rim) to match
  // the enemy's ACTUAL motion direction. e.facing is updated every frame by
  // the bestiary move primitives (sine-weave, spiral, dive, ...); falling
  // back to e.angle covers swarm + early-frame cases. Without this, the
  // flame trail stayed glued to the spawn direction even as the enemy
  // wobbled/spiraled — the visual was lying about where the enemy was
  // headed, making bullets seem to miss it.
  const motionAngle = enemy.facing != null ? enemy.facing : enemy.angle;
  visual.group.rotation.z = -motionAngle + Math.PI / 2;
  if (visual.core?.material) visual.core.material.rotation += enemy.spin * dt * 0.45;
  if (visual.tail?.material) {
    visual.tail.material.opacity = 0.46 + Math.sin(state.time * 11 + enemy.wobble) * 0.16;
    visual.tail.scale.y = 1.0 + Math.sin(state.time * 9.5 + enemy.wobble) * 0.18;
  }
  if (visual.flare?.material) visual.flare.material.opacity = 0.14 + Math.sin(state.time * 8 + enemy.wobble) * 0.08;
  if (visual.rim) visual.rim.rotation.z -= dt * 2.8;

  // ── HP bar update ──
  if (visual.hpBar && !enemy.isSwarm) {
    const ratio = Math.max(0, enemy.hp / enemy.maxHp);
    if (ratio < 1) {
      // Show the bar once damaged
      visual.hpBar.material.opacity = 0.92;
      visual.hpBg.material.opacity = 0.6;
      // Scale X to represent remaining HP
      visual.hpBar.scale.x = ratio;
      // Shift so bar shrinks from right edge
      visual.hpBar.position.x = -visual.hpBarW * (1 - ratio) * 0.5;
      // Color: green → yellow → red
      const r = ratio < 0.5 ? 1 : 1 - (ratio - 0.5) * 2;
      const g = ratio > 0.5 ? 1 : ratio * 2;
      visual.hpBar.material.color.setRGB(r, g, 0);
    } else {
      visual.hpBar.material.opacity = 0;
      visual.hpBg.material.opacity = 0;
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   Star Field & Barrage Layer
   ═══════════════════════════════════════════════════════════════ */
// Multi-layer star field with parallax, HSL color variety (bobbyroe pattern),
// circle.png star texture for crisp round points, twinkle shader on near layer,
// nebula tinting, and occasional shooting stars.
const _twinkleMaterials = [];
const _shootingStars = [];

// Per-vertex random color via HSL — gives the realistic blue/white/yellow/red
// stellar mix instead of uniform monochrome.
function makeStarLayerColored(count, z, size, opacity, twinkle = false, hueRange = [0.55, 0.7]) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = rand(-W / 2 - 60, W / 2 + 60);
    positions[i * 3 + 1] = rand(-H / 2 - 60, H / 2 + 60);
    positions[i * 3 + 2] = z;
    phases[i] = Math.random() * Math.PI * 2;
    sizes[i] = size * (0.6 + Math.random() * 0.8);
    // Star color: most are warm-white, a few are blue/yellow/red
    const hue = rand(hueRange[0], hueRange[1]);
    const sat = 0.05 + Math.random() * 0.5;
    const lit = 0.55 + Math.random() * 0.45;
    const c = new THREE.Color().setHSL(hue, sat, lit);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geom.setAttribute("phase", new THREE.Float32BufferAttribute(phases, 1));
  geom.setAttribute("aSize", new THREE.Float32BufferAttribute(sizes, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMap: { value: tex.starCircle },
      uOpacity: { value: opacity },
      uTwinkle: { value: twinkle ? 1.0 : 0.0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float phase;
      attribute float aSize;
      varying vec3 vColor;
      varying float vBright;
      uniform float uTime;
      uniform float uTwinkle;
      void main() {
        vColor = color;
        float tw = 0.5 + 0.5 * sin(uTime * 2.4 + phase);
        vBright = mix(1.0, 0.35 + 0.75 * tw, uTwinkle);
        float pointSize = aSize * mix(1.0, 1.0 + tw * 0.6, uTwinkle);
        gl_PointSize = pointSize;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vBright;
      void main() {
        vec4 tex = texture2D(uMap, gl_PointCoord);
        gl_FragColor = vec4(vColor, tex.a * uOpacity * vBright);
      }
    `,
    vertexColors: true,
  });
  _twinkleMaterials.push(mat);
  return new THREE.Points(geom, mat);
}

// Shooting stars — periodic streaks across the screen
function spawnShootingStar() {
  const fromTop = Math.random() < 0.6;
  const startX = rand(-W / 2, W / 2);
  const startY = fromTop ? H / 2 + 30 : rand(-H / 2, H / 2);
  const angle = fromTop ? -Math.PI / 2 + rand(-0.5, 0.5) : rand(-Math.PI / 4, Math.PI / 4);
  const speed = rand(420, 720);
  const length = rand(60, 110);
  const sprite = makeSprite(tex.barrageProjectile, 4, length, {
    additive: true,
    opacity: 0.95,
    color: 0xb6f4ff,
  });
  sprite.material.rotation = -angle + Math.PI / 2;
  sprite.position.set(startX, startY, -2);
  _shootingStars.push({
    sprite,
    x: startX,
    y: startY,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: rand(0.7, 1.2),
    max: 1.2,
  });
}

let _shootingTimer = rand(2.5, 5.5);
function updateShootingStars(dt) {
  if (!PERF.shootingStars) return;
  _shootingTimer -= dt;
  if (_shootingTimer <= 0) {
    spawnShootingStar();
    _shootingTimer = rand(3.5, 8);
  }
  for (let i = _shootingStars.length - 1; i >= 0; i--) {
    const s = _shootingStars[i];
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.life -= dt;
    s.sprite.position.x = s.x;
    s.sprite.position.y = s.y;
    s.sprite.material.opacity = Math.max(0, s.life / s.max) * 0.95;
    if (s.life <= 0 || s.x < -W || s.x > W || s.y < -H || s.y > H) {
      disposeObject(s.sprite);
      swapRemove(_shootingStars, i);
    }
  }
}

function createStarField() {
  const group = new THREE.Group();
  const [c1, c2, c3] = PERF.starCounts;
  // Layer 1: deep distant dim — broad blue-white range
  group.add(makeStarLayerColored(c1, -9, 1.4, 0.62, false, [0.55, 0.72]));
  // Layer 2: mid — warmer hue spread
  group.add(makeStarLayerColored(c2, -6, 2.4, 0.78, false, [0.45, 0.78]));
  // Layer 3: near bright twinkle — full color range including occasional reds
  group.add(makeStarLayerColored(c3, -3, 3.6, 0.96, true, [0.0, 0.95]));

  // Nebula clouds — soft additive color blooms for depth (skipped on low-end)
  const nebulaColors = [0x5a78ff, 0x9a5fff, 0xff6aa0, 0x4ad8ff, 0xff8a4a];
  for (let i = 0; i < PERF.nebulaCount; i++) {
    const sprite = createSprite(tex.explosionCore, rand(280, 500), rand(280, 500), {
      additive: true,
      opacity: 0.05 + Math.random() * 0.06,
      color: nebulaColors[i % nebulaColors.length],
    });
    sprite.position.set(rand(-W / 2, W / 2), rand(-H / 2, H / 2), -8);
    sprite.material.rotation = Math.random() * Math.PI * 2;
    group.add(sprite);
  }

  scene.add(group);
  return group;
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

// Procedural Three.js Earth — real SphereGeometry with continents/cloud
// CanvasTexture as basemap (drawn once, reused by GPU), plus an additive
// fresnel atmosphere shell drawn with a simple shader for an authentic edge
// glow. Real Y-axis rotation gives proper 3D depth.
function createProceduralEarthTexture() {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size / 2; // 2:1 aspect = standard equirectangular UV
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  // Saturated ocean gradient — equator brighter, polar darker
  const ocean = ctx.createLinearGradient(0, 0, 0, h);
  ocean.addColorStop(0, "#0a2c5e");
  ocean.addColorStop(0.5, "#1968b8");
  ocean.addColorStop(1, "#082450");
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, w, h);

  // Continent blobs — saturated greens / browns for contrast against ocean
  const continentSeeds = 56;
  const palette = ["#1f6a32", "#2c7836", "#3f8a3c", "#5a8836", "#876d34", "#5a3a20", "#6e4a26"];
  for (let i = 0; i < continentSeeds; i++) {
    const cx = Math.random() * w;
    const cy = h * 0.18 + Math.random() * h * 0.62;
    const rx = 28 + Math.random() * 90;
    const ry = 18 + Math.random() * 60;
    const c = palette[i % palette.length];
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.random() * Math.PI);
    ctx.filter = "blur(2px)";
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    // wrap copies for seamless E/W edge
    if (cx < 100) {
      ctx.beginPath();
      ctx.ellipse(w - cx + (cx - cx), 0, rx, ry, 0, 0, Math.PI * 2);
    }
    ctx.restore();
  }

  // Wrap-edge handling: copy a vertical strip from left to right edge
  const stripW = 80;
  const stripData = ctx.getImageData(0, 0, stripW, h);
  ctx.putImageData(stripData, w - stripW / 2, 0);

  // Sand/desert speckles for warm latitudes
  ctx.filter = "blur(1.4px)";
  ctx.globalAlpha = 0.38;
  for (let i = 0; i < 220; i++) {
    const cx = Math.random() * w;
    const cy = h * 0.25 + Math.random() * h * 0.5;
    const r = 6 + Math.random() * 18;
    ctx.fillStyle = ["#c5a560", "#a8854a", "#9c7a40"][i % 3];
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Polar ice caps — top and bottom strips
  ctx.filter = "blur(6px)";
  const iceTop = ctx.createLinearGradient(0, 0, 0, h * 0.18);
  iceTop.addColorStop(0, "rgba(240, 248, 255, 1)");
  iceTop.addColorStop(1, "rgba(240, 248, 255, 0)");
  ctx.fillStyle = iceTop;
  ctx.fillRect(0, 0, w, h * 0.18);
  const iceBot = ctx.createLinearGradient(0, h * 0.84, 0, h);
  iceBot.addColorStop(0, "rgba(240, 248, 255, 0)");
  iceBot.addColorStop(1, "rgba(240, 248, 255, 1)");
  ctx.fillStyle = iceBot;
  ctx.fillRect(0, h * 0.84, w, h * 0.16);

  ctx.filter = "none";
  return canvas;
}

function createProceduralCloudsTexture() {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size / 2;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  // Transparent base
  ctx.clearRect(0, 0, w, h);

  // Cloud blobs as soft ellipses with strong blur, varying density by latitude
  ctx.filter = "blur(7px)";
  ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
  for (let i = 0; i < 80; i++) {
    const cy = h * 0.12 + Math.random() * h * 0.76;
    const cx = Math.random() * w;
    // tropical band gets more cloud
    const latFactor = Math.abs(cy / h - 0.5);
    if (Math.random() < (latFactor < 0.18 ? 1 : 0.55)) {
      const rx = 30 + Math.random() * 100;
      const ry = 14 + Math.random() * 40;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.filter = "none";
  return canvas;
}

// Pre-load real NASA Blue Marble textures (sourced from bobbyroe/threejs-earth,
// MIT licensed; original NASA Visible Earth data is public domain). These give
// the world-class look — recognizable continents, real city lights, cloud
// shadows — instead of the procedural blob the canvas approach produced.
const earthTextureBase = "assets/textures/earth";
loadTexture("earthDay", `${earthTextureBase}/00_earthmap1k.jpg`);
loadTexture("earthSpec", `${earthTextureBase}/02_earthspec1k.jpg`);
loadTexture("earthLights", `${earthTextureBase}/03_earthlights1k.jpg`);
loadTexture("earthClouds", `${earthTextureBase}/05_earthcloudmaptrans.jpg`);

function createProceduralEarth() {
  const group = new THREE.Group();
  scene.add(group);

  const earthMap = tex.earthDay;
  if (earthMap) {
    earthMap.wrapS = THREE.RepeatWrapping;
    earthMap.colorSpace = THREE.SRGBColorSpace;
    earthMap.anisotropy = 4;
  }
  const earthSpec = tex.earthSpec;
  if (earthSpec) {
    earthSpec.wrapS = THREE.RepeatWrapping;
    earthSpec.colorSpace = THREE.NoColorSpace;
  }
  const earthLights = tex.earthLights;
  if (earthLights) {
    earthLights.wrapS = THREE.RepeatWrapping;
    earthLights.colorSpace = THREE.SRGBColorSpace;
  }
  const cloudMap = tex.earthClouds;
  if (cloudMap) {
    cloudMap.wrapS = THREE.RepeatWrapping;
    cloudMap.colorSpace = THREE.NoColorSpace;
  }

  // Earth surface — Sangil Lee's day/night blend pattern adapted to our
  // pipeline: sample real day texture + city-lights texture, blend by sigmoid
  // of normal·sunDir, add specular ocean highlight via spec mask.
  const earthGeom = new THREE.SphereGeometry(earthRadius, 96, 64);
  const earthMat = new THREE.ShaderMaterial({
    uniforms: {
      uDay: { value: earthMap },
      uNight: { value: earthLights },
      uSpec: { value: earthSpec },
      uSunDir: { value: new THREE.Vector3(0.6, 0.45, 0.7).normalize() },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalLocal;
      void main() {
        vUv = uv;
        vNormalLocal = normalize(normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uDay;
      uniform sampler2D uNight;
      uniform sampler2D uSpec;
      uniform vec3 uSunDir;
      varying vec2 vUv;
      varying vec3 vNormalLocal;
      void main() {
        vec3 day = texture2D(uDay, vUv).rgb;
        vec3 night = texture2D(uNight, vUv).rgb;
        float cosA = dot(vNormalLocal, uSunDir);
        // Sigmoid blend (Sangil Lee technique) — sharp but smooth terminator
        float dayMix = 1.0 / (1.0 + exp(-7.0 * cosA));
        // Night side: city lights pop where the night-lights texture is bright,
        // remainder gets a deep-navy ambient
        vec3 ambient = vec3(0.012, 0.022, 0.045);
        vec3 nightCombined = ambient + night * 1.4;
        vec3 col = mix(nightCombined, day, dayMix);
        // Specular ocean highlight on day side — spec mask is white over water
        float spec = texture2D(uSpec, vUv).r;
        float specPower = pow(max(0.0, cosA), 24.0) * spec * 0.65;
        col += vec3(0.92, 0.96, 1.0) * specPower * dayMix;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const earthSphere = new THREE.Mesh(earthGeom, earthMat);
  group.add(earthSphere);

  // Cloud layer — real cloud transparency texture (white = cloud, black = clear)
  const cloudGeom = new THREE.SphereGeometry(earthRadius * 1.014, 64, 48);
  const cloudMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uMap: { value: cloudMap },
      uSunDir: { value: new THREE.Vector3(0.6, 0.45, 0.7).normalize() },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalLocal;
      void main() {
        vUv = uv;
        vNormalLocal = normalize(normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform vec3 uSunDir;
      varying vec2 vUv;
      varying vec3 vNormalLocal;
      void main() {
        // Cloud transparency map: bright = cloud
        float c = texture2D(uMap, vUv).r;
        // Fade clouds on night side so they don't appear lit when sun is gone
        float cosA = dot(vNormalLocal, uSunDir);
        float dayMix = 1.0 / (1.0 + exp(-7.0 * cosA));
        float litCloud = mix(0.18, 1.0, dayMix); // dim clouds on night side
        gl_FragColor = vec4(vec3(litCloud), c * 0.78 * mix(0.35, 1.0, dayMix));
      }
    `,
  });
  const cloudSphere = new THREE.Mesh(cloudGeom, cloudMat);
  group.add(cloudSphere);

  // Atmosphere — back-side fresnel rim. Tuned for a THIN BLUE highlight rather
  // than a thick white halo. Higher pow concentrates glow at the rim,
  // multiplier kept low so colors stay saturated blue instead of clamping white.
  const atmoGeom = new THREE.SphereGeometry(earthRadius * 1.10, 64, 48);
  const atmoMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      atmOpacity: { value: 0.85 },
      atmPowFactor: { value: 6.0 },
      atmMultiplier: { value: 0.95 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 eyeVector;
      void main() {
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        eyeVector = normalize(mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float atmOpacity;
      uniform float atmPowFactor;
      uniform float atmMultiplier;
      varying vec3 vNormal;
      varying vec3 eyeVector;
      void main() {
        float dotP = dot(vNormal, eyeVector);
        float factor = pow(dotP, atmPowFactor) * atmMultiplier;
        float pulse = 1.0 + sin(uTime * 2.0) * 0.06;
        // Pure cyan-blue palette — no white channel boost. Edges stay blue
        // even at peak intensity instead of clamping to white.
        vec3 atmColor = vec3(0.18, 0.55, 1.0);
        gl_FragColor = vec4(atmColor, atmOpacity) * factor * pulse;
      }
    `,
  });
  const atmosphere = new THREE.Mesh(atmoGeom, atmoMat);
  group.add(atmosphere);

  group.userData = { earthSphere, cloudSphere, atmosphere, atmoMat };
  return group;
}

const earth = createProceduralEarth();
setXY(earth, C.x, C.y, 2);
earth.rotation.x = 0.4;

const shieldOuter = makeCircleLine(earthRadius + 52, 0x45e7ff, 0.22);
const shieldInner = makeCircleLine(earthRadius + 31, 0x8af8ff, 0.62);
shieldOuter.position.set(worldX(C.x), worldY(C.y), 1.5);
shieldInner.position.set(worldX(C.x), worldY(C.y), 1.7);

/* ═══════════════════════════════════════════════════════════════
   Explosion Object Pool — reduces GC pressure
   ═══════════════════════════════════════════════════════════════ */
const explosionPool = [];
const EXPLOSION_POOL_MAX = 60;
const polishEffects = [];

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

function addPolishEffect(key, x, y, size, options = {}) {
  const texture = tex[key];
  if (!texture) return null;
  const width = options.width ?? size;
  const height = options.height ?? size;
  const sprite = makeSprite(texture, width, height, {
    additive: options.additive ?? true,
    opacity: options.opacity ?? 0.9,
    color: options.color ?? 0xffffff,
  });
  const life = options.life ?? 0.85;
  sprite.material.rotation = options.rotation ?? 0;
  setXY(sprite, x, y, options.z ?? 8.2);
  polishEffects.push({
    mesh: sprite,
    life,
    max: life,
    baseWidth: width,
    baseHeight: height,
    grow: options.grow ?? 0.35,
    spin: options.spin ?? 0,
    fadeIn: options.fadeIn ?? 0.08,
  });
  return sprite;
}

function updatePolishEffects(dt) {
  for (let i = polishEffects.length - 1; i >= 0; i--) {
    const effect = polishEffects[i];
    effect.life -= dt;
    const age = 1 - Math.max(0, effect.life / effect.max);
    const fadeIn = Math.min(1, age / effect.fadeIn);
    const fadeOut = Math.max(0, effect.life / effect.max);
    const alpha = Math.min(fadeIn, fadeOut);
    effect.mesh.material.opacity = alpha;
    effect.mesh.material.rotation += effect.spin * dt;
    const scale = 1 + age * effect.grow;
    effect.mesh.scale.set(effect.baseWidth * scale, effect.baseHeight * scale, 1);
    if (effect.life <= 0) {
      disposeObject(effect.mesh);
      swapRemove(polishEffects, i);
    }
  }
}

function showStageThemeBurst(scale = 1) {
  const theme = currentStageTheme();
  addPolishEffect(theme.key, C.x, H * 0.27, 116 * scale, { life: 1.25, grow: 0.28, spin: 0.45, opacity: 0.96, z: 8.5 });
  addPolishEffect("polishDangerWarningRing", C.x, C.y, 210 * scale, { life: 0.82, grow: 0.22, spin: -1.1, opacity: 0.48, z: 2.2 });
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
  for (const item of state.defenders) { disposeObject(item.mesh); disposeObject(item.halo); }
  for (const item of state.beams) { disposeObject(item.line); }
  for (const item of interceptFlashes) { disposeObject(item.mesh); }
  for (const item of polishEffects) { disposeObject(item.mesh); }
  interceptFlashes.length = 0;
  polishEffects.length = 0;
}

// First reset() call (page load) keeps title overlay up; subsequent calls
// (restart from game-over / victory) jump straight back to playing.
let _firstReset = true;
function reset() {
  clearEntities();
  drainExplosionPool();
  drainFlashPool();
  resetHudCache();
  const startMode = _firstReset ? "title" : "playing";
  _firstReset = false;
  Object.assign(state, {
    mode: startMode,
    last: performance.now(),
    time: 0,
    gameTime: 0,
    health: 120,
    maxHealth: 120,
    shield: 20,
    money: 5,
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
    upgradeLevels: {},
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
    // Yin always starts inactive. Earned afresh at stage 1 wave 10, lost
    // at stage 2.
    yinActive: false,
    message: "地球防御系统启动中",
  });
  // Yin's badge is hidden by default — only appears when he's actively
  // helping (during stage 1 from wave 10 onward). Stage 2+ he's gone.
  if (ui.yinBadge) {
    ui.yinBadge.hidden = true;
    ui.yinBadge.classList.remove("is-locked", "is-active");
  }
  clearYinSushi();
  rebuildDefenders();
  hideLevelPanel();
  hideShopPanel();
  hideOverlay(ui.pausePanel);
  hideOverlay(ui.gameOverPanel);
  hideOverlay(ui.victoryPanel);
  if (ui.miniBossTag) ui.miniBossTag.hidden = true;
  if (ui.bossBanner) ui.bossBanner.hidden = true;
  if (_bossBannerTimer) { clearTimeout(_bossBannerTimer); _bossBannerTimer = null; }
  if (ui.floaters) ui.floaters.replaceChildren();
  prefillSwarm();
  showStageThemeBurst(0.9);
  renderHeroRoster();
  updateHud();
}

/* ═══════════════════════════════════════════════════════════════
   HUD Update (with DOM write cache)
   ═══════════════════════════════════════════════════════════════ */
function setSoundButton() {
  const label = state.soundOn ? "🔊 音效" : "🔇 开启";
  if (ui.soundBtn) {
    setHT(ui.soundBtn, "sndLabel", label);
  }
}

function setShopButton() {
  const label = state.mode === "shop" ? "关闭" : "商店";
  if (ui.shopBtn) {
    const labelEl = ui.shopBtn.querySelector(".ctrl-label");
    if (labelEl) setHT(labelEl, "shopLabel", label);
  }
}

function renderHeroRoster() {
  const roster = document.getElementById("heroRoster");
  if (!roster) return;
  roster.replaceChildren();
  for (const hero of activeHeroes) {
    // Wrapper with SVG ring for ULT gauge
    const wrap = document.createElement("div");
    wrap.className = "hero-roster-slot";
    wrap.dataset.heroId = hero.id;
    const img = document.createElement("img");
    img.src = `assets/cast/${hero.portrait}.png?v=${ASSET_VERSION}`;
    img.className = "hero-roster-avatar";
    img.alt = hero.name;
    // SVG ring — clockwise fill from top (stroke-dashoffset animation)
    const sz = 40; // viewBox size
    const r = 17;  // ring radius
    const circ = 2 * Math.PI * r; // circumference
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${sz} ${sz}`);
    svg.setAttribute("class", "ult-ring-svg");
    // Background ring (track)
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    bg.setAttribute("cx", sz / 2); bg.setAttribute("cy", sz / 2);
    bg.setAttribute("r", r); bg.setAttribute("fill", "none");
    bg.setAttribute("stroke", "rgba(124,232,255,0.18)");
    bg.setAttribute("stroke-width", "2.5");
    // Foreground ring (fill)
    const fg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    fg.setAttribute("cx", sz / 2); fg.setAttribute("cy", sz / 2);
    fg.setAttribute("r", r); fg.setAttribute("fill", "none");
    fg.setAttribute("stroke", "rgba(124,232,255,0.9)");
    fg.setAttribute("stroke-width", "2.5");
    fg.setAttribute("stroke-linecap", "round");
    fg.setAttribute("stroke-dasharray", `${circ}`);
    fg.setAttribute("stroke-dashoffset", `${circ}`); // start empty
    fg.setAttribute("class", "ult-ring-fill");
    // Rotate so fill starts from 12-o'clock, clockwise
    fg.setAttribute("transform", `rotate(-90 ${sz / 2} ${sz / 2})`);
    svg.appendChild(bg);
    svg.appendChild(fg);
    wrap.appendChild(img);
    wrap.appendChild(svg);
    roster.appendChild(wrap);
  }
}

function setPauseButton() {
  const label = state.mode === "paused" ? "▶ 继续" : "⏸ 暂停";
  if (ui.pauseBtn) {
    setHT(ui.pauseBtn, "pauseLabel", label);
  }
}

function updateHud() {
  setRollingNumber(ui.health, "health", Math.max(0, Math.round(state.health)));
  setRollingNumber(ui.money, "money", Math.floor(state.money));
  setHT(ui.stageWave, "sw", `${state.stageLevel}-${String(state.waveIndex).padStart(2, "0")}`);
  updateStageThemeHud();
  setRollingNumber(ui.levelCount, "lc", state.levelCount, { duration: 220 });
  if (ui.killCount) setRollingNumber(ui.killCount, "kc", state.kills, { duration: 180 });
  setHT(ui.runState, "rs", state.message);
  setSoundButton();
  setShopButton();
  setRollingNumber(ui.shopMoney, "sm", Math.floor(state.money));
  setHT(ui.shopRefreshBtn, "srf", `刷新 ¥${shopRefreshCost}`);
  const shouldDisable = state.money < shopRefreshCost;
  if (ui.shopRefreshBtn.disabled !== shouldDisable) ui.shopRefreshBtn.disabled = shouldDisable;
  setPauseButton();
  syncOverlays();
  // level-progress + boss-hp panels + mini-boss tag refresh every frame in frame(); skip here.
}

function updateStageThemeHud() {
  if (!ui.stageThemeIcon || !ui.stageThemeText) return;
  const theme = currentStageTheme();
  const src = `${polishAssetBase}/${polishTextureFiles[theme.key]}.png?v=${ASSET_VERSION}`;
  if (ui.stageThemeIcon.getAttribute("src") !== src) ui.stageThemeIcon.setAttribute("src", src);
  setHT(ui.stageThemeText, "stageThemeText", theme.label);
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
  if (state.mode === "title") {
    showOverlay(ui.titlePanel);
  } else {
    hideOverlay(ui.titlePanel);
  }
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
  const screenX = Math.max(60, Math.min(stageRect.width - 60, target.x * sx));
  const screenY = Math.max(20, Math.min(stageRect.height - 96, target.y * sy - target.size * 0.6 * sy - 20));
  tag.style.left = `${screenX}px`;
  tag.style.top = `${screenY}px`;
  const hpPct = Math.max(0, Math.min(1, target.hp / target.maxHp));
  if (ui.miniBossName) setHT(ui.miniBossName, "mbName", palette.label);
  if (ui.miniBossHpFill) setHS(ui.miniBossHpFill, "mbHp", "width", `${Math.round(hpPct * 1000) / 10}%`);
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
  if (ui.levelPanel) ui.levelPanel.dataset.source = state.levelUpSource;
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

// Predicate — has the player picked this upgrade enough times to max it out?
function isUpgradeMaxed(u) {
  if (u.forceUnique && state.selectedIds.has(u.id)) return true;
  const lvl = state.upgradeLevels[u.id] || 0;
  return lvl >= (u.maxLevel || 1);
}

function drawUpgradeOptions(count = 3) {
  const pool = unlockedPool(state.levelCount).filter((u) => !isUpgradeMaxed(u));
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
  const polishIcon = polishIconByUpgradeName[option.name];
  if (polishIcon) return polishAssetUrl(polishIcon);
  const iconName = iconMap[option.category] || "special-icon";
  return `${individualAssetBase}/${iconName}.png?v=${ASSET_VERSION}`;
}

function upgradeVfxSrc(option) {
  const vfxName = upgradeVfxMap[option.category] || "card-reveal";
  return `/assets/generated/upgrades/final/${vfxName}.png?v=${ASSET_VERSION}`;
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
  ui.levelPanel.dataset.source = "";
  ui.levelCards.classList.remove("is-expanded");
  ui.levelCards.replaceChildren();
}

function createUpgradeCard(option, onClick, compact = false) {
  const card = document.createElement("button");
  const affordable = state.money >= option.price;
  card.className = `upgrade-card ${compact ? "shop-card " : ""}${rarityClass[option.rarity] || "is-common"}`;
  if (compact && !affordable) card.classList.add("is-locked");
  card.type = "button";
  card.disabled = !affordable;
  card.style.setProperty("--upgrade-vfx", `url("${upgradeVfxSrc(option)}")`);
  // Level state: how many times the player has already picked this card.
  // Display the next pick as "Lv (currentLvl+1) / maxLevel" so the player
  // sees what they're upgrading TO. If already at max it'd be filtered out.
  const currentLvl = state.upgradeLevels[option.id] || 0;
  const nextLvl = Math.min(option.maxLevel || 1, currentLvl + 1);
  const maxLvl = option.maxLevel || 1;
  // Build pip markup — fills `currentLvl` dots, highlights pip [currentLvl] as
  // "the one you're about to fill", leaves the rest empty.
  const pips = [];
  for (let i = 0; i < maxLvl; i++) {
    let cls = "upgrade-pip";
    if (i < currentLvl) cls += " is-filled";
    else if (i === currentLvl) cls += " is-next";
    pips.push(`<span class="${cls}"></span>`);
  }
  card.innerHTML = `
    <span class="upgrade-name"></span>
    <span class="upgrade-art"><img alt="" /></span>
    <span class="upgrade-category"></span>
    <span class="upgrade-level">Lv ${nextLvl}/${maxLvl}<span class="upgrade-pips">${pips.join("")}</span></span>
    <span class="upgrade-effect"></span>
    <span class="upgrade-price"></span>
    <span class="shop-lock"><img alt="" src="${polishAssetUrl("shop-lock-card")}" /></span>
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
  state.shopOptions = state.shopOptions.filter((u) => !isUpgradeMaxed(u));
  if (state.shopOptions.length < 3) state.shopOptions = drawUpgradeOptions(6);
  state.message = "商店开放：可直接购买升级";
  addPolishEffect("polishShopLockCard", C.x - 88, H * 0.78, 82, { life: 0.55, grow: 0.12, spin: -0.25, opacity: 0.72, z: 8.6 });
  addPolishEffect("polishWarFundCache", C.x + 88, H * 0.78, 96, { life: 0.65, grow: 0.16, spin: 0.35, opacity: 0.86, z: 8.6 });
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
  addPolishEffect("polishRarityRerollPrism", C.x, H * 0.76, 132, { life: 0.78, grow: 0.22, spin: 1.8, opacity: 0.9, z: 8.7 });
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
  state.upgradeLevels[upgrade.id] = (state.upgradeLevels[upgrade.id] || 0) + 1;
  applyUpgrade(upgrade);
  state.levelCount += 1;
  const lvlNow = state.upgradeLevels[upgrade.id];
  state.message = `商店购买：${upgrade.name}  Lv ${lvlNow}/${upgrade.maxLevel}`;
  const key = polishShowcaseByCategory[upgrade.category] || polishShowcaseByCategory[upgrade.name] || "polishRarityRerollPrism";
  addPolishEffect(key, C.x, H * 0.76, 118, { life: 0.72, grow: 0.24, spin: 0.85, opacity: 0.92, z: 8.8 });
  triggerUpgradeShowcase(upgrade);
  // Card stays in pool only if not yet maxed; remove it from current shelf either way
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
  state.upgradeLevels[upgrade.id] = (state.upgradeLevels[upgrade.id] || 0) + 1;
  applyUpgrade(upgrade);
  state.levelCount += 1;
  state.nextLevelIndex += 1;
  state.levelUpSource = "timer";
  state.mode = "playing";
  const lvlNow = state.upgradeLevels[upgrade.id];
  state.message = `已升级：${upgrade.name}  Lv ${lvlNow}/${upgrade.maxLevel}`;
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
    state.health = Math.min(state.maxHealth, state.health + 20);
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
    state.health = Math.min(state.maxHealth, state.health + 30);
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
    state.health = Math.min(state.maxHealth, state.health + 35);
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
  const polishSlug = polishIconByUpgradeName[upgrade.name];
  const polishKey = polishSlug ? polishTextureKeyFromSlug(polishSlug) : polishShowcaseByCategory[upgrade.category];
  if (polishKey) {
    addPolishEffect(polishKey, C.x, C.y - 118, 118, { life: 0.7, grow: 0.22, spin: 0.9, opacity: 0.92, z: 8.5 });
  }
  const fn = upgradeShowcasesByName[upgrade.name];
  if (fn) fn(upgrade);
  else showcaseByCategory(upgrade);
}

/* ═══════════════════════════════════════════════════════════════
   Defenders
   ═══════════════════════════════════════════════════════════════ */
function rebuildDefenders() {
  // Two defender tiers visible together:
  //   Heroes — exactly ONE per active hero (Lia, then Lia+Devi, ...). They
  //            are the cinematic stars: large td-{name} sprite, outer orbit
  //            ring 220-290, ULT-swap to ult sprite while ult is active.
  //   Interceptors — small swarm planes that scale with gunLevel (the
  //                  classic upgrade card driver). 3 per gunLevel, capped
  //                  at 24, inner orbit 148-205, cycle through the legacy
  //                  charPlaneBlue/Gold/Laser sprites for shooting volume.
  const heroes = activeHeroes.length ? activeHeroes : [HEROES[0]];
  const heroTarget = heroes.length;
  const interceptorTarget = Math.min(24, Math.max(0, state.gunLevel * 3));
  const heroSize = Math.min(110, 76 + state.gunLevel * 2.6);
  const interceptorSize = Math.min(72, 46 + state.gunLevel * 1.6);
  const useHalo = state.levelCount >= 5;
  const heroAspect = 414 / 474;

  // Step 1: rebuild HERO defenders (one per hero, in unlock order).
  // Drop any pre-existing hero defenders that no longer match (e.g. roster
  // changed when a stage was cleared).
  const aliveHeroes = state.defenders.filter((d) => d.kind === "hero" && heroes.some((h) => h.id === d.heroId));
  for (const d of state.defenders) {
    if (d.kind === "hero" && !aliveHeroes.includes(d)) {
      disposeObject(d.mesh);
      if (d.halo) disposeObject(d.halo);
    }
  }
  const heroDefs = aliveHeroes;
  for (const hero of heroes) {
    if (heroDefs.some((d) => d.heroId === hero.id)) continue;
    const texKey = `td-${hero.id}`;
    const idx = heroDefs.length;
    const baseSprite = makeSprite(tex[texKey], heroSize * heroAspect, heroSize, { opacity: 0.98 });
    const halo = useHalo ? makeSprite(tex.explosionCore, heroSize * 1.5, heroSize * 1.5, { additive: true, opacity: 0.22, color: hero.color }) : null;
    if (halo) halo.position.z = 3.9;
    heroDefs.push({
      kind: "hero",
      heroId: hero.id,
      heroIdx: idx,
      angle: (Math.PI * 2 * idx) / Math.max(1, heroTarget),
      orbit: rand(228, 282),
      cooldown: rand(0.05, 0.45),
      born: state.gameTime,
      mesh: baseSprite,
      halo,
      size: heroSize,
      texKey,
      ultTexKey: `td-${hero.id}-ult`,
      heroColor: hero.color,
    });
  }

  // Step 2: rebuild INTERCEPTOR defenders (small classic planes).
  const interceptorDefs = state.defenders.filter((d) => d.kind === "interceptor");
  while (interceptorDefs.length < interceptorTarget) {
    const idx = interceptorDefs.length;
    const baseSprite = makeSprite(tex[planeTextureKeys[idx % planeTextureKeys.length]], interceptorSize, interceptorSize, { opacity: 0.95 });
    const halo = useHalo ? makeSprite(tex.explosionCore, interceptorSize * 1.6, interceptorSize * 1.6, { additive: true, opacity: 0.16, color: 0x9bf7ff }) : null;
    if (halo) halo.position.z = 3.9;
    interceptorDefs.push({
      kind: "interceptor",
      angle: (Math.PI * 2 * idx) / Math.max(1, interceptorTarget),
      orbit: rand(150, 196),
      cooldown: rand(0.05, 0.45),
      born: state.gameTime,
      mesh: baseSprite,
      halo,
      size: interceptorSize,
    });
  }
  while (interceptorDefs.length > interceptorTarget) {
    const old = interceptorDefs.pop();
    disposeObject(old.mesh);
    if (old.halo) disposeObject(old.halo);
  }

  // Replace the master list — heroes first, then swarm.
  state.defenders = [...heroDefs, ...interceptorDefs];

  // Per-frame visual sync: hot-swap sprite to ULT-active variant; resize
  // existing meshes if gunLevel changed.
  for (const def of state.defenders) {
    if (def.kind === "hero") {
      if (def.size !== heroSize) {
        def.mesh.scale.set(heroSize * heroAspect, heroSize, 1);
        def.size = heroSize;
      }
      const wantsUlt = heroGauges.isUltActive(def.heroId);
      const wantedKey = wantsUlt ? def.ultTexKey : `td-${def.heroId}`;
      if (def.texKey !== wantedKey) {
        def.mesh.material.map = tex[wantedKey];
        def.mesh.material.needsUpdate = true;
        def.texKey = wantedKey;
      }
    } else if (def.size !== interceptorSize) {
      def.mesh.scale.set(interceptorSize, interceptorSize, 1);
      def.size = interceptorSize;
    }
    if (useHalo && !def.halo) {
      const sz = def.kind === "hero" ? def.size * 1.5 : def.size * 1.6;
      const color = def.kind === "hero" ? def.heroColor : 0x9bf7ff;
      def.halo = makeSprite(tex.explosionCore, sz, sz, { additive: true, opacity: def.kind === "hero" ? 0.22 : 0.16, color });
      def.halo.position.z = 3.9;
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   Enemy Spawning
   ═══════════════════════════════════════════════════════════════ */
function stagePressure() {
  // stage rises linearly — no longer capped at 10 for infinite play
  const stage = Math.max(0, state.stageLevel - 1) / 9; // 1.0 at stage 10, keeps rising
  const wave = Math.max(0, state.waveIndex - 1) / Math.max(1, wavesPerStage - 1);
  return { stage, wave, combined: stage * 0.8 + wave * 0.55 };
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
  state.enemyCarry += state.waveIndex % 5 === 0 ? 3.0 : 1.0;
  // Stage 1, wave 10 → unlock 殷师傅 (Master Yin) as a guest support.
  // First-time only; localStorage persists the flag across sessions.
  if (state.stageLevel === MASTER_YIN.unlock.stage
      && state.waveIndex === MASTER_YIN.unlock.wave
      && !state.yinActive) {
    triggerYinUnlock();
  }
  if (state.waveIndex >= wavesPerStage) {
    state.waveIndex = wavesPerStage;
    spawnBoss();
  } else {
    if (state.waveIndex % 4 === 0) spawnMiniBoss();
    state.message = `第 ${state.stageLevel} 关 / 第 ${state.waveIndex} 波`;
    updateHud();
  }
}

function triggerYinUnlock() {
  state.yinActive = true;
  // showYinUnlockOverlay has its own built-in 4-line story dialogue
  // (YIN_STORY lines auto-advance inside the fullscreen portrait overlay).
  showYinUnlockOverlay();
  if (ui.yinBadge) {
    ui.yinBadge.hidden = false;
    ui.yinBadge.classList.add("is-active");
    ui.yinBadge.classList.remove("is-locked");
  }
  audio.levelUp();
  // 嘲讽 grand-entrance VFX: 36 sushi pieces explode out of Earth in a
  // radial burst, plus an amber shockwave ring + screen shake to mark
  // the moment 殷师傅 enters the field. After this initial blast, the
  // ongoing spawn rate in updateYinTauntVfx (16/s) keeps sushi flying.
  for (let i = 0; i < 36; i++) {
    spawnYinSushiPiece();
  }
  addPolishEffect("polishDangerWarningRing", C.x, C.y, earthRadius * 5, {
    life: 1.4, grow: 1.6, spin: -0.8, opacity: 0.92, z: 8.6, color: 0xffb24a,
  });
  for (let i = 0; i < 12; i++) {
    const a = (Math.PI * 2 * i) / 12;
    spawnInterceptFlash(C.x + Math.cos(a) * (earthRadius + 60), C.y + Math.sin(a) * (earthRadius + 60), 1.1);
  }
  triggerScreenShake(0.4, 8);
}

// 嘲讽 visual: 殷师傅 throws sushi everywhere. While he's active, sushi
// pieces fly out of Earth in random directions, spinning + tumbling +
// fading. Replaces the earlier amber-shockwave aura — the chef vibe is
// the whole point of the gag, and "lots of various sushi" matches the
// brief literally.
const _yinSushi = { spawnTimer: 0, pieces: [] };

function spawnYinSushiPiece() {
  const idx = Math.floor(Math.random() * SUSHI_EMOJI.length);
  const angle = rand(0, Math.PI * 2);
  const speed = rand(140, 280);
  const size = rand(34, 56);
  // Start a touch outside Earth's surface so it visually launches OUT
  // rather than appearing in space.
  const launchR = earthRadius + rand(8, 18);
  const sprite = makeSprite(tex[`sushi-${idx}`], size, size, { opacity: 1.0 });
  const piece = {
    x: C.x + Math.cos(angle) * launchR,
    y: C.y + Math.sin(angle) * launchR,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: rand(1.6, 2.4),
    maxLife: 0,
    spin: rand(-7, 7),
    rotation: rand(0, Math.PI * 2),
    mesh: sprite,
  };
  piece.maxLife = piece.life;
  setXY(sprite, piece.x, piece.y, 5.2);
  sprite.material.rotation = piece.rotation;
  _yinSushi.pieces.push(piece);
}

function clearYinSushi() {
  for (const p of _yinSushi.pieces) disposeObject(p.mesh);
  _yinSushi.pieces.length = 0;
  _yinSushi.spawnTimer = 0;
}

function updateYinTauntVfx(dt) {
  // Even when Yin is inactive we still need to age out any in-flight
  // pieces from the entry burst so they don't freeze on screen.
  for (let i = _yinSushi.pieces.length - 1; i >= 0; i--) {
    const p = _yinSushi.pieces[i];
    p.life -= dt;
    if (p.life <= 0) {
      disposeObject(p.mesh);
      _yinSushi.pieces.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    // Slight drag so the pieces don't ALL exit at the same moment —
    // some hang in the air a beat longer for a snowfall feel.
    p.vx *= 0.992;
    p.vy *= 0.992;
    p.rotation += p.spin * dt;
    setXY(p.mesh, p.x, p.y, 5.2);
    p.mesh.material.rotation = p.rotation;
    // Fade in the last 0.6 s of life.
    const fade = Math.min(1, p.life / 0.6);
    p.mesh.material.opacity = fade;
  }
  if (!state.yinActive || state.mode !== "playing") {
    _yinSushi.spawnTimer = 0;
    return;
  }
  // Spawn rate: ~every 0.12 s, two pieces per tick → ~16 pieces/s flying
  // outward in all directions. Looks like the chef is hurling sushi out
  // the door at the alien horde.
  _yinSushi.spawnTimer -= dt;
  if (_yinSushi.spawnTimer <= 0) {
    _yinSushi.spawnTimer = 0.12;
    spawnYinSushiPiece();
    spawnYinSushiPiece();
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
  const bal = getStageBalance(state.stageLevel);
  const size = 84 + pressure.stage * 14 + state.stageLevel * 3;
  const hp = Math.round((30 + pressure.stage * 20 + state.levelCount * 1.2 + state.stageLevel * 5) * (bal?.enemyHp || 1));
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
  const speed = 50 + rand(-8, 14) + state.stageLevel * 4;
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
    : Math.min(swarmMaxDensity, swarmBaseDensity + (state.stageLevel - 1) * 12 + state.waveIndex * 2);
  // Slower fill so a long pause / heavy AoE doesn't dump 14 enemies in one frame.
  const toSpawn = Math.min(8, Math.max(0, Math.ceil(baseTarget - count)));
  for (let i = 0; i < toSpawn; i++) spawnSwarmEnemy();
  void dt;
}

// Pre-fill the field on game start / restart so the very first frame already
// shows the dense golden ring, instead of the player watching it ramp up.
function prefillSwarm() {
  // 16 prefilled, scattered along the outer 70% of the flight path so the
  // first frame already shows incoming density without crashing into Earth.
  const safeMin = 0;
  const safeMax = swarmEntryRadius - earthRadius - 320;
  for (let i = 0; i < 16; i++) {
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

// Phase-7 (chunk B): map new bestiary kinds → legacy visual archetype.
// The old createEnemyVisual chooses one of three layered Three.js setups
// based on enemy.kind ("meteor"/"bolt"/"saucer"). We keep that fallback for
// shape variety + per-archetype trail color, but override the central sprite
// with the new td-{bestiaryKind}.png so the player sees the full bestiary.
// Lean toward "meteor" archetype on stage-1 fodder so the iconic golden
// flame streak that defined the previous build stays the dominant visual.
// Saucer / bolt are reserved for thematic special types (energy, fast).
const _bestiaryToLegacyKind = {
  "crystal-stalker": "meteor", "magma-worm": "meteor",
  "bio-beetle":      "meteor", "shadow-cone": "bolt",
  "ion-sentinel":    "saucer", "magma-spider": "meteor",
  "void-hunter":     "bolt",   "bio-cloud":   "saucer",
  "storm-wraith":    "bolt",   "gold-carapace": "meteor",
  "mirror-splitter": "meteor", "gravity-pulse": "saucer",
  "hook-reaper":     "meteor", "mega-asteroid": "meteor",
  "shadow-apostle":  "bolt",
};

function spawnEnemies(dt) {
  if (state.waveIndex >= wavesPerStage || state.boss) return;
  const pressure = stagePressure();
  const rate = 2.2 + pressure.stage * 4.0 + pressure.wave * 5.0 + state.levelCount * 0.18;
  state.enemyCarry += rate * dt;
  // Pre-roll the wave plan so we draw the same population the bestiary
  // promises (per-stage bag from STAGE_BAGS). Cache per stage+wave.
  if (!state._wavePlanKey || state._wavePlanKey !== `${state.stageLevel}.${state.waveIndex}`) {
    state._wavePlanKey = `${state.stageLevel}.${state.waveIndex}`;
    state._wavePlan = planWave(state.stageLevel, state.waveIndex, wavesPerStage);
    state._wavePlanIdx = 0;
  }
  while (state.enemyCarry > 1) {
    state.enemyCarry -= 1;
    const baseAngle = rand(-Math.PI, Math.PI);
    const radius = rand(620, 760);
    const pos = pointOnCircle(baseAngle, radius);
    const targetAngle = baseAngle + Math.PI + rand(-0.08, 0.08);
    const bestiaryKind = state._wavePlan.length
      ? state._wavePlan[(state._wavePlanIdx++) % state._wavePlan.length]
      : null;
    const def = bestiaryKind ? ENEMY_TYPES[bestiaryKind] : null;
    const legacyKind = bestiaryKind ? (_bestiaryToLegacyKind[bestiaryKind] || "meteor") : (Math.random() < 0.58 ? "meteor" : Math.random() < 0.55 ? "bolt" : "saucer");
    // Apply per-stage difficulty curve from balance.js so later stages
    // ramp meaningfully — enemyHp×, enemySpeed× scale per STAGE_BALANCE.
    const bal = getStageBalance(state.stageLevel);
    // Restore the punchy original sizes/speeds — the earlier 0.85× and 0.5×
    // multipliers had drained the streaking-meteor energy users remembered.
    const size = (def?.size ?? rand(28, 48)) + pressure.stage * 6;
    const speed = ((def?.speed ?? rand(30, 56)) * 1.0 + pressure.combined * 30 + state.waveIndex * 0.8) * (bal?.enemySpeed || 1);
    const hp = Math.ceil(((def?.hp ?? 1) + Math.floor(pressure.stage * 2.5 + pressure.wave * 1.5)) * (bal?.enemyHp || 1));
    const enemy = createRegularEnemy({
      x: pos.x,
      y: pos.y,
      angle: targetAngle,
      speed,
      hp,
      size,
      kind: legacyKind,
    });
    enemy.bestiaryKind = bestiaryKind;
    enemy.bestiaryMove = def?.move || null;
    enemy.spawnRadius = Math.hypot(enemy.x - C.x, enemy.y - C.y);
    enemy.t = 0;
    // Copy per-type tuning parameters so move functions can read them
    // (wobbleHz, wobbleMag, angVel, radialIn, chargeFor, targetR, etc.)
    if (def) {
      if (def.wobbleHz != null) enemy.wobbleHz = def.wobbleHz;
      if (def.wobbleMag != null) enemy.wobbleMag = def.wobbleMag;
      if (def.angVel != null) enemy.angVel = def.angVel;
      if (def.radialIn != null) enemy.radialIn = def.radialIn;
      if (def.chargeFor != null) enemy.chargeFor = def.chargeFor;
      if (def.targetR != null) enemy.targetR = def.targetR;
    }
    // Override the core sprite with the bestiary's td-{kind} top-down art.
    if (bestiaryKind && enemy.visual?.core && tex[`td-${bestiaryKind}`]) {
      enemy.visual.core.material.map = tex[`td-${bestiaryKind}`];
      enemy.visual.core.material.needsUpdate = true;
    }
  }
}

function spawnBoss() {
  if (state.boss) return;
  const config = getBossConfig(state.stageLevel);
  // Phase-7: cinematic reveal before the boss enters the playfield.
  // Pauses gameplay (state.mode = "bossReveal" → modal-active) so wave
  // spawn + enemy update freeze while the warning plays.
  if (!_bossRevealShownForStage[state.stageLevel]) {
    _bossRevealShownForStage[state.stageLevel] = true;
    state.mode = "bossReveal";
    playBossReveal(config, () => {
      state.last = performance.now();
      state.mode = "playing";
      _spawnBossActual();
    });
    return;
  }
  _spawnBossActual();
}

const _bossRevealShownForStage = {};

// Get boss config for any stage — cycles through the 10 defined bosses
// with progressive scaling for stages beyond 10 (cycle 2+).
function getBossConfig(stageLevel) {
  const idx = ((stageLevel - 1) % bossConfigs.length);
  const cycle = Math.floor((stageLevel - 1) / bossConfigs.length); // 0 for stages 1-10
  const base = bossConfigs[idx];
  if (cycle === 0) return base;
  // Scale for New-Game+ cycles: each cycle adds +80% HP, +20% reward
  const hpScale = 1 + cycle * 0.8;
  const rewardScale = 1 + cycle * 0.2;
  return {
    ...base,
    name: `${base.name}+${cycle}`,
    maxHp: Math.round(base.maxHp * hpScale),
    reward: Math.round(base.reward * rewardScale),
  };
}

function _spawnBossActual() {
  if (state.boss) return;
  const config = getBossConfig(state.stageLevel);
  const bal = getStageBalance(state.stageLevel);
  const bossHpMul = bal?.bossHp || 1;
  const maxHp = Math.round(config.maxHp * (1 + state.levelCount * 0.035) * bossHpMul);
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
  showBossBanner(config.name, config.ability);
  // Phase-7: stage-enter dialogue script (boss arrival + hero quips), with
  // pre-rendered TTS audio under assets/voice/stage-{N}/stage-enter-NN-speaker.mp3
  const enterLines = getEvent(state.stageLevel, "stage-enter");
  if (enterLines.length) dialoguePlay(enterLines, `stage-${state.stageLevel}`, "stage-enter");
  addPolishEffect("polishBossWeakpointCore", boss.x, boss.y, config.size * 0.62, { life: 0.9, grow: 0.25, spin: 1.2, opacity: 0.96, z: 8.4 });
  addPolishEffect("polishDangerWarningRing", boss.x, boss.y, config.size * 1.6, { life: 1.1, grow: 0.18, spin: -1.0, opacity: 0.62, z: 7.8 });
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

/* ═══════════════════════════════════════════════════════════════
   BOSS Ultimates — each Boss has a signature "大招" rendered in its
   own color via Three.js. Triggered when boss HP first crosses 55%
   (one-shot per boss instance) AND replaces normal attack at half-HP
   thresholds for repeated drama.
   ═══════════════════════════════════════════════════════════════ */
const bossUltKinds = {
  "molten-asteroid": "lavaBurst",       // 火山喷发 — 橙红环形岩浆
  "bio-saucer-hive": "swarmHive",       // 召唤虫群 — 12 只小怪同时出击
  "ice-crystal-leviathan": "frostNova", // 冰冻新星 — 多层青色冲击波 + 冰冻 swarm
  "void-mothership": "voidSlice",       // 虚空切片 — 紫色扇形切割
  "gold-artillery-fortress": "goldBarrage", // 重炮齐射 — 8 发金色重炮
  "red-plasma-coil": "plasmaSpiral",    // 等离子螺旋 — 红色螺旋轨迹
  "blue-ion-hive": "ionChain",          // 离子连击 — 6 道蓝色闪电链
  "black-dreadnought": "armorRam",      // 装甲冲撞 — 黑色重力波 + 强震屏
  "white-graviton-ring": "gravityWell", // 引力井 — 白色多层环旋入
  "solar-eclipse-core": "eclipsePulse", // 日蚀脉冲 — 黄色全屏超新星
};

function _ringBurst(cx, cy, count, radius, color, sizeScale = 1) {
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count;
    const px = cx + Math.cos(a) * radius;
    const py = cy + Math.sin(a) * radius;
    spawnInterceptFlash(px, py, sizeScale);
    addExplosion(px, py, sizeScale * 0.55);
  }
  void color; // tint reserved for future per-boss flash colors
}

function _ultBanner(boss, name) {
  showBossBanner(`${boss.bossConfig.name} 大招`, name);
}

const bossUltImpls = {
  lavaBurst(boss) {
    _ultBanner(boss, "火山喷发 · 岩浆环爆");
    triggerScreenShake(0.65, 14);
    audio.boom();
    for (let r = 90; r <= 320; r += 50) {
      setTimeout(() => _ringBurst(boss.x, boss.y, 18, r, 0xff7032, 1.05), (r - 90) * 1.5);
    }
    // damage swarm enemies inside the ring
    setTimeout(() => damageRing(8, 1.2), 320);
    setTimeout(() => audio.beam(), 220);
  },

  swarmHive(boss) {
    _ultBanner(boss, "召唤蜂群 · 12 单位涌出");
    triggerScreenShake(0.4, 8);
    const baseAngle = angleTo(boss, C);
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        const a = baseAngle + (i - 5.5) * 0.18;
        createRegularEnemy({
          x: boss.x + Math.cos(a) * boss.size * 0.45,
          y: boss.y + Math.sin(a) * boss.size * 0.45,
          angle: a,
          speed: 90 + i * 4,
          hp: 3,
          size: 30,
          kind: "saucer",
          reward: 1,
          trailColor: 0x7bff5a,
          trailOpacity: 0.62,
        });
      }, i * 60);
    }
    audio.beam();
  },

  frostNova(boss) {
    _ultBanner(boss, "冰晶新星 · 全场减速");
    triggerScreenShake(0.5, 10);
    audio.beam();
    for (let r = 60; r <= 380; r += 45) {
      setTimeout(() => _ringBurst(boss.x, boss.y, 22, r, 0x8cefff, 0.9), (r - 60) * 1.8);
    }
    // freeze all swarm + slow regular for 2.5s
    for (const e of state.enemies) {
      if (e.isSwarm || e.isMiniBoss === false) e._frozenSpeed = e.speed;
      e.speed = e.speed * 0.25;
    }
    setTimeout(() => {
      for (const e of state.enemies) {
        if (e._frozenSpeed) { e.speed = e._frozenSpeed; e._frozenSpeed = undefined; }
      }
    }, 2500);
  },

  voidSlice(boss) {
    _ultBanner(boss, "虚空切片 · 紫色扇切");
    triggerScreenShake(0.5, 11);
    const cAngle = angleTo(boss, C);
    spawnBeamFan(cAngle, 7, Math.PI * 0.65, { life: 1.2, color: 0xba83ff, opacity: 0.92, wide: true });
    damageInBeam(cAngle, 0.42, 8);
    audio.beam();
    setTimeout(() => audio.boom(), 200);
  },

  goldBarrage(boss) {
    _ultBanner(boss, "重炮齐射 · 8 发黄金弹幕");
    triggerScreenShake(0.55, 12);
    audio.boom();
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const a = -Math.PI / 2 + (i - 3.5) * 0.32;
        createEnergyBeam(a, {
          from: boss,
          to: { x: boss.x + Math.cos(a) * 600, y: boss.y + Math.sin(a) * 600 },
          life: 0.7,
          color: 0xffd260,
          opacity: 0.94,
          wide: true,
        });
        const tx = boss.x + Math.cos(a) * 280;
        const ty = boss.y + Math.sin(a) * 280;
        addExplosion(tx, ty, 1.0);
        spawnInterceptFlash(tx, ty, 1.2);
      }, i * 90);
    }
    setTimeout(() => damageRing(6, 1.3), 400);
  },

  plasmaSpiral(boss) {
    _ultBanner(boss, "等离子螺旋 · 旋转扫荡");
    triggerScreenShake(0.5, 10);
    audio.beam();
    // 24 flashes following a logarithmic spiral outward from boss
    for (let i = 0; i < 24; i++) {
      setTimeout(() => {
        const a = i * 0.42;
        const r = 60 + i * 14;
        const px = boss.x + Math.cos(a) * r;
        const py = boss.y + Math.sin(a) * r;
        spawnInterceptFlash(px, py, 1.1);
        addExplosion(px, py, 0.5);
      }, i * 36);
    }
    setTimeout(() => damageRing(7, 1.2), 600);
  },

  ionChain(boss) {
    _ultBanner(boss, "离子链 · 6 道闪电跳跃");
    triggerScreenShake(0.42, 9);
    audio.laser();
    let prev = boss;
    for (let i = 0; i < 6; i++) {
      const target = nearestEnemy(prev, 600) || C;
      createEnergyBeam(angleTo(prev, target), {
        from: prev,
        to: target,
        life: 0.55,
        color: 0x63dfff,
        opacity: 0.95,
      });
      addExplosion(target.x, target.y, 0.6);
      spawnInterceptFlash(target.x, target.y, 1.0);
      if (target !== C) {
        target.hp -= 6;
        if (target.hp <= 0) {
          const idx = state.enemies.indexOf(target);
          if (idx >= 0) killEnemy(idx);
        }
      }
      prev = target;
    }
  },

  armorRam(boss) {
    _ultBanner(boss, "装甲冲撞 · 重力波");
    triggerScreenShake(0.95, 18);
    audio.boom();
    // Black-tinted shockwaves
    for (let r = 50; r <= 400; r += 35) {
      setTimeout(() => _ringBurst(boss.x, boss.y, 16, r, 0x444a55, 1.1), (r - 50) * 1.2);
    }
    setTimeout(() => damageRing(10, 1.4), 400);
  },

  gravityWell(boss) {
    _ultBanner(boss, "引力井 · 多层环吸");
    triggerScreenShake(0.5, 10);
    audio.beam();
    // Concentric expanding white rings
    for (let layer = 0; layer < 5; layer++) {
      setTimeout(() => {
        spawnBeamFan(0, 28, Math.PI * 2, { life: 1.0, color: 0xf4fbff, opacity: 0.5 });
      }, layer * 200);
    }
    // Pull all swarm toward Earth (boost their speed temporarily)
    for (const e of state.enemies) {
      if (e.isSwarm) e.speed *= 1.6;
    }
  },

  eclipsePulse(boss) {
    _ultBanner(boss, "日蚀核心 · 全屏脉冲");
    triggerScreenShake(1.2, 22);
    audio.boom();
    addExplosion(boss.x, boss.y, 4.5);
    setTimeout(() => audio.boom(), 240);
    // Massive yellow pulse from boss outward
    for (let r = 100; r <= 900; r += 60) {
      setTimeout(() => {
        for (let i = 0; i < 26; i++) {
          const a = (Math.PI * 2 * i) / 26;
          const px = boss.x + Math.cos(a) * r;
          const py = boss.y + Math.sin(a) * r;
          spawnInterceptFlash(px, py, 1.1);
          if (r > 200 && r < 600) addExplosion(px, py, 0.6);
        }
      }, (r - 100) * 0.9);
    }
    setTimeout(() => damageRing(15, 1.6), 600);
  },
};

function fireBossUltimate(boss) {
  if (!boss || !boss.bossConfig) return;
  const slug = boss.bossConfig.slug;
  const kind = bossUltKinds[slug] || "lavaBurst";
  const impl = bossUltImpls[kind];
  if (impl) impl(boss);
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
    if (enemy.hp <= 0) continue; // skip dead/zombie enemies
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
  const bulletSpeed = 620 + state.laserLevel * 18;
  // Lead-aim using the target's REAL velocity from the per-frame
  // position-delta tracked in updateEnemies. Works for any move primitive
  // (sine-weave / spiral / dive / blink) because we read the actual
  // velocity, not a model-derived one. Falls back to facing × speed for
  // brand-new enemies that haven't had a frame yet.
  let tvx = 0, tvy = 0;
  if (target._prevX != null && target._prevDt > 0) {
    tvx = (target.x - target._prevX) / target._prevDt;
    tvy = (target.y - target._prevY) / target._prevDt;
  } else {
    const moveAngle = target.facing != null ? target.facing : (target.angle || 0);
    const moveSpeed = target.speed || 0;
    tvx = Math.cos(moveAngle) * moveSpeed;
    tvy = Math.sin(moveAngle) * moveSpeed;
  }
  const dist = Math.hypot(target.x - from.x, target.y - from.y);
  const tof = Math.min(0.5, dist / bulletSpeed);
  // Bosses + mini-bosses move along scripted patrol patterns where lead
  // aim adds noise; aim straight. Everyone else gets a full velocity lead.
  const useLead = !target.isBoss && !target.isMiniBoss;
  const aimX = useLead ? target.x + tvx * tof : target.x;
  const aimY = useLead ? target.y + tvy * tof : target.y;
  const base = Math.atan2(aimY - from.y, aimX - from.x);
  const shots = 1 + Math.min(2, state.splitShot);
  const widthMul = 1 + (state.bulletDamage - 1) * 0.18 + state.bulletPierce * 0.06;
  const lengthMul = 1 + (state.bulletDamage - 1) * 0.22 + state.laserLevel * 0.04;
  const tint = state.beamLevel > 0 ? 0xc9faff : state.laserLevel > 0 ? 0xe6ffff : 0xb6f5ff;
  const trailColor = state.laserLevel > 0 ? 0xb1f5ff : 0x72f8ff;
  // Spawn bullets at the ship's NOSE, not its center. Ship faces the target
  // (interceptor) or outward from earth (hero), so push the bullet origin
  // ~half the ship's radius along its facing direction. Without this it
  // looks like the rear of the sprite is firing.
  const noseOffset = (from.size || 64) * 0.45;
  const noseDx = Math.cos(base) * noseOffset;
  const noseDy = Math.sin(base) * noseOffset;
  for (let i = 0; i < shots; i++) {
    const offset = shots === 1 ? 0 : (i - (shots - 1) / 2) * (0.08 + spread);
    const bullet = {
      x: from.x + noseDx,
      y: from.y + noseDy,
      vx: Math.cos(base + offset) * bulletSpeed,
      vy: Math.sin(base + offset) * bulletSpeed,
      // Bullet life MUST cover the longest engagement distance. Hero range
      // is 940 px and bulletSpeed is 620 px/s — at the old 1.05 s life,
      // bullets only traveled 651 px and visibly EXPIRED before reaching
      // distant gold-streak swarms. 1.7 s gives 1054 px of travel, enough
      // to cross the full hero firing radius with margin.
      life: 1.7,
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
    // Hero mech can engage targets ~80% further than the small interceptor —
    // makes the bigger ship feel more capable + matches their outer orbit.
    const range = defender.kind === "hero" ? 940 : 520;
    const target = nearestEnemy(_defenderScratch, range);
    const a = target ? Math.atan2(target.y - orbitY, target.x - orbitX) : defender.angle;
    const launch = Math.min(1, (state.gameTime - defender.born) / 0.5);
    const fromX = C.x + cosA * (earthRadius + 20);
    const fromY = C.y + sinA * (earthRadius + 20);
    defender.x = fromX + (orbitX - fromX) * launch;
    defender.y = fromY + (orbitY - fromY) * launch;
    setXY(defender.mesh, defender.x, defender.y, 4);
    // All planes face OUTWARD from Earth (radial: nose pointing away from
    // the planet, tails pointing in). This is the natural defending pose —
    // weapons point at incoming enemies. Critically, this is one direction
    // PER PLANE based on its current orbit position; we don't spin to
    // follow targets (interceptors used to do that and looked frantic),
    // and we don't lock to a single screen-up axis (which the user
    // explicitly rejected as "all the same direction").
    const outwardAngle = Math.atan2(defender.y - C.y, defender.x - C.x);
    defender.mesh.material.rotation = outwardAngle - Math.PI / 2;
    if (defender.halo) {
      setXY(defender.halo, defender.x, defender.y, 3.9);
      defender.halo.material.opacity = 0.16 + Math.sin(state.time * 4 + defender.angle) * 0.06;
    }
    if (defender.cooldown <= 0) {
      shoot(defender, target, 0.03);
      defender.cooldown = Math.max(0.22, 0.68 - state.levelCount * 0.015);
    }
  }
  state.coreTimer -= dt * state.fireRateMul;
  if (state.coreTimer <= 0) {
    shoot(C, nearestEnemy(C, 560), 0.04);
    state.coreTimer = 1.1;
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

function applyHitDamage(enemy, damage, x, y) {
  let finalDamage = damage;
  if (enemy.isBoss) {
    const weak = bossWeakpointPosition(enemy);
    const dx = x - weak.x;
    const dy = y - weak.y;
    const weakRadius = Math.max(22, enemy.size * 0.16);
    if (dx * dx + dy * dy <= weakRadius * weakRadius) {
      finalDamage *= 2.75;
      if (!enemy.lastWeakpointHit || state.time - enemy.lastWeakpointHit > 0.08) {
        enemy.lastWeakpointHit = state.time;
        spawnInterceptFlash(weak.x, weak.y, 0.92);
        addPolishEffect("polishBossWeakpointCore", weak.x, weak.y, enemy.size * 0.32, { life: 0.28, grow: 0.45, spin: 2.2, opacity: 0.96, z: 8.6 });
      }
    }
  }
  enemy.hp -= finalDamage;
  return finalDamage;
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
    // Bullet culling: expand bounds so bullets aren't killed before they
    // can reach distant targets. Enemies spawn out to radius 760 from
    // Earth center; with C.x=360, C.y=614 that means enemies can sit at
    // game-space x = -400..1120 and y = -146..1374. The previous ±80
    // margin around W×H was killing bullets aimed at the outer ring
    // before they could traverse — that's the visible "bullets pass
    // through gold streaks" symptom on stage 1. Use a 600 px margin so
    // every targetable enemy stays within range.
    let remove = b.life <= 0 || b.x < -600 || b.x > W + 600 || b.y < -600 || b.y > H + 600;
    if (!remove) {
      const nearby = queryNearbyEnemies(b.x, b.y);
      for (let k = nearby.length - 1; k >= 0 && !remove; k--) {
        const enemy = nearby[k];
        if (enemy.hp <= 0) continue;
        const dx = b.x - enemy.x;
        const dy = b.y - enemy.y;
        // Hit radii calibrated to the VISIBLE silhouette — the gold flame
        // tail on meteor-archetype is `size × 3.4` long, so a 150-180 px
        // radius wraps the entire visible streak. With curved motion (sine
        // weave + spiral) lead-aim leaves real-world lead errors of up to
        // 150 px, so the hitbox needs to absorb that slip too. Bullets
        // are still faster than enemies (~3×) so even a "miss" by lead
        // math lands somewhere on the long tail.
        let r;
        if (enemy.isSwarm) r = 80;
        else if (enemy.kind === "meteor") r = enemy.size * 2.0 + 40;
        else r = enemy.size * 1.6 + 32;
        if (dx * dx + dy * dy < r * r) {
          applyHitDamage(enemy, b.damage, b.x, b.y);
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
function updateEnemies(realDt) {
  // 殷师傅 (Master Yin) "嘲讽" — once unlocked at stage 1 wave 10, fodder /
  // swarm enemies move at MASTER_YIN.enemySlowFactor (0.78 = 22% slower)
  // for the rest of the run. Bosses + mini-bosses keep full speed so their
  // scripted choreography stays readable.
  const yinSlow = state.yinActive ? MASTER_YIN.enemySlowFactor : 1;
  const slowedDt = realDt * yinSlow;

  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    // Safety net: any zombie enemy (hp<=0 but not yet removed) gets
    // cleaned up here instead of lingering as a targeting blocker.
    if (e.hp <= 0) {
      disposeObject(e.mesh);
      if (e.trail) disposeObject(e.trail);
      swapRemove(state.enemies, i);
      continue;
    }
    // Per-enemy dt: bosses/mini-bosses unaffected, everyone else slowed.
    const dt = (e.isBoss || e.isMiniBoss) ? realDt : slowedDt;

    // Track previous position before motion runs. shoot() uses (x-prevX, y-prevY)
    // to derive the enemy's REAL velocity for lead-aim — much more accurate
    // than trying to reconstruct it from e.facing × e.speed (which assumes
    // straight-line motion and gets wave-2+ spirals/sine-weaves wrong).
    e._prevX = e.x;
    e._prevY = e.y;
    e._prevDt = realDt;

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
      // Phase-7: boss-half dialogue, fires once when HP first crosses 50%.
      if (!e.halfDialogueDone && e.hp / e.maxHp <= 0.5 && state.mode === "playing") {
        e.halfDialogueDone = true;
        const halfLines = getEvent(state.stageLevel, "boss-half");
        if (halfLines.length) dialoguePlay(halfLines, `stage-${state.stageLevel}`, "boss-half");
      }
      // Boss state machine: PATROL (full orbit) ↔ CHARGE (dive at Earth then retreat)
      e.bossChargeTimer = (e.bossChargeTimer ?? 5 + Math.random() * 3) - dt;
      if (e.bossChargeTimer <= 0 && !e.bossCharging) {
        e.bossCharging = true;
        e.bossChargeStart = state.time;
        // Phase-7: boss-ult-charge dialogue (once per stage). Triggered the
        // first time the boss starts a charge, so the player gets the warning
        // exactly when the visual tell appears.
        if (!e.ultChargeDialogueDone && state.mode === "playing") {
          e.ultChargeDialogueDone = true;
          const ultLines = getEvent(state.stageLevel, "boss-ult-charge");
          if (ultLines.length) dialoguePlay(ultLines, `stage-${state.stageLevel}`, "boss-ult-charge");
        }
        addPolishEffect("polishBossChargeLane", (e.x + C.x) * 0.5, (e.y + C.y) * 0.5, 1, {
          width: Math.min(150, e.size * 0.78),
          height: Math.max(230, e.radius * 0.82),
          life: 0.95,
          grow: 0.08,
          spin: 0,
          rotation: -angleTo(e, C) + Math.PI / 2,
          opacity: 0.72,
          z: 7.6,
        });
        addPolishEffect("polishDangerWarningRing", C.x, C.y, earthRadius * 3.6, { life: 0.7, grow: 0.18, spin: -2.1, opacity: 0.58, z: 2.4 });
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
            addPolishEffect("polishBossRageAura", e.x, e.y, e.size * 1.32, { life: 0.56, grow: 0.18, spin: 1.6, opacity: 0.82, z: 8.3 });
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
      // Boss ultimates fire at 70% / 40% / 15% HP thresholds (one-shot per
      // threshold per boss instance). Each boss has a unique impl + color.
      const hpRatio = e.hp / e.maxHp;
      e.bossUltsFired = e.bossUltsFired || 0;
      const thresholds = [0.7, 0.4, 0.15];
      while (e.bossUltsFired < thresholds.length && hpRatio < thresholds[e.bossUltsFired]) {
        fireBossUltimate(e);
        e.bossUltsFired += 1;
        // Slight cooldown so we don't fire 2 ults the same frame
        e.attackTimer = Math.max(e.attackTimer, 1.6);
      }
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
    // Phase-7 (chunk B): if this enemy was tagged with a bestiary kind, use
    // its custom movement function (sine-wave / spiral / orbit / blink / etc).
    // Otherwise fall back to the legacy linear-toward-Earth path.
    if (e.bestiaryMove) {
      // NOTE: do NOT increment e.t here — each move function handles its
      // own timer. Doing it twice made sine-weave/spiral/bezier run at 2×
      // speed, worsening lead-aim predictions for curved paths.
      e.bestiaryMove(e, dt, { cx: C.x, cy: C.y, spawnRadius: e.spawnRadius || 700 });
    } else {
      const heading = e.angle + Math.sin(e.wobble) * 0.035;
      e.x += Math.cos(heading) * e.speed * dt;
      e.y += Math.sin(heading) * e.speed * dt;
    }
    const dxC = e.x - C.x;
    const dyC = e.y - C.y;
    e.radius = Math.sqrt(dxC * dxC + dyC * dyC);
    updateEnemyVisual(e, dt);
    updateLineXY(e.trail, oldX, oldY, e.x, e.y, 2.5);
    e.trail.material.opacity = e.kind === "saucer" ? 0.22 : 0.44;
    if (e.radius < earthRadius + e.size * 0.45) {
      takeHit(5);
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
  // Feed the ULT gauges — tier 0 fodder, 1 mid, 2 elite, 3 mini, 4 boss.
  const tier = enemy.isBoss ? 4 : enemy.isMiniBoss ? 3 : enemy.isSwarm ? 0 : 1;
  heroGauges.onKill(tier);
  const reward = enemy.reward ?? 1;
  const moneyEarned = reward * state.moneyMul;
  state.money += moneyEarned;
  if (enemy.isSwarm) {
    spawnInterceptFlash(enemy.x, enemy.y, 0.55);
    // Throttled floater — every 4th swarm kill spawns a +¥ floater so the screen
    // doesn't get flooded during dense intercepts.
    if ((state.kills & 3) === 0) {
      spawnFloater(`+¥${Math.max(1, Math.round(moneyEarned * 4))}`, enemy.x, enemy.y, "money");
    }
    disposeObject(enemy.mesh);
    swapRemove(state.enemies, index);
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
    spawnFloater(`+¥${Math.round(moneyEarned)}`, enemy.x, enemy.y, "boss");
  } else if (enemy.isBoss) {
    addExplosion(enemy.x, enemy.y, 2.2);
    audio.boom();
    spawnFloater(`+¥${Math.round(moneyEarned)}`, enemy.x, enemy.y, "boss");
  } else {
    addExplosion(enemy.x, enemy.y, state.explosionScale);
    audio.boom();
    if (moneyEarned >= 0.8) {
      spawnFloater(`+¥${Math.max(1, Math.round(moneyEarned))}`, enemy.x, enemy.y, "kill");
    }
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
  // Phase-7: boss-defeat dialogue + persistent unlock.
  const defeatLines = getEvent(state.stageLevel, "boss-defeat");
  if (defeatLines.length) dialoguePlay(defeatLines, `stage-${state.stageLevel}`, "boss-defeat");
  progress = unlockHeroForStage(progress, state.stageLevel);
  saveProgress(progress);
  // Roguelite infinite loop: after stage 10 the boss roster cycles with
  // scaling HP/reward so the game never ends — difficulty keeps rising.
  state.stageLevel += 1;
  state.waveIndex = 1;
  // 殷师傅 leaves at stage 2 — he's a stage-1 guest, not a permanent ally.
  // Hide the badge, drop the slow buff, clear any in-flight sushi.
  if (state.yinActive) {
    state.yinActive = false;
    if (ui.yinBadge) ui.yinBadge.hidden = true;
    clearYinSushi();
  }
  // Refresh active heroes + ult gauges for the new stage.
  const oldHeroIds = activeHeroes.map((h) => h.id);
  activeHeroes = activeHeroesForStage(state.stageLevel);
  heroGauges = new HeroGauges(activeHeroes);
  renderHeroRoster();
  // Find the new hero that joined this stage (if any) — show their
  // introduction cinematic before the upgrade-card panel.
  const newHero = activeHeroes.find((h) => !oldHeroIds.includes(h.id));
  state.message = `第 ${state.stageLevel} 关开始：${getBossConfig(state.stageLevel).name} 正在逼近`;
  showStageThemeBurst(1.05);
  if (newHero) {
    // Pause gameplay, show intro, then open the upgrade-card panel.
    state.mode = "heroIntro";
    playHeroIntro(newHero.id, () => {
      startLevelUp({ source: "boss" });
    });
  } else {
    startLevelUp({ source: "boss" });
  }
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
  updatePolishEffects(dt);
}

function updateScene(t, dt) {
  background.material.opacity = 0.88 + Math.sin(t * 0.16) * 0.03;
  starField.rotation.z = Math.sin(t * 0.05) * 0.012;
  updateBarrageLayer(dt, t);

  // Procedural Three.js earth — surface rotates slowly, clouds 1.6x faster,
  // shade-shell stays fixed (so sun direction is constant in world space)
  const ud = earth.userData;
  if (ud?.atmoMat) ud.atmoMat.uniforms.uTime.value = t;
  if (ud?.earthSphere) ud.earthSphere.rotation.y += dt * 0.06;
  if (ud?.cloudSphere) ud.cloudSphere.rotation.y += dt * 0.095;
  const pulse = 1 + Math.sin(t * 2.4) * 0.012;
  earth.scale.setScalar(pulse);

  // Twinkle stars driven by uniform
  for (let i = 0; i < _twinkleMaterials.length; i++) {
    _twinkleMaterials[i].uniforms.uTime.value = t;
  }
  updateShootingStars(dt);

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
  if (state.mode === "paused" || state.mode === "prologue" || state.mode === "heroIntro" || state.mode === "bossReveal") {
    updateExplosions(dt);
    updatePolishEffects(dt);
    // Hero-intro fallback: if the voice file is missing or autoplay
    // got blocked, the auto-advance via onEnded never fires. Tick a
    // timer so each line still advances after ~3.6 s, keeping the
    // 4-panel story playable without voice.
    if (state.mode === "heroIntro" && _heroIntroState.lines?.length) {
      _heroIntroState.lineTimer += dt;
      if (_heroIntroState.lineTimer > 3.6) {
        _heroIntroState.lineTimer = 0;
        _heroIntroState.lineIdx += 1;
        if (_heroIntroState.lineIdx >= _heroIntroState.lines.length) {
          dismissHeroIntro();
        } else {
          showHeroIntroLine();
        }
      }
    }
  } else {
    update(dt);
  }
  updateScene(state.time, dt);
  updateLevelProgress();
  updateBossHud();
  updateMiniBossTag();
  // Phase-7 hooks
  updatePrologue(dt);
  updateDialogue(dt);
  updateUltFlashes();
  renderUltGauges();
  updateYinTauntVfx(dt);
  // Auto-fire any ULT whose gauge is full + cooldown clear.
  const fired = heroGauges.consumePending(state.time);
  for (const heroId of fired) {
    const hero = getHero(heroId);
    if (!hero) continue;
    heroGauges.beginUlt(heroId, hero.ult.durationSec, state.time);
    audio.boom();
    state.message = `${hero.name} ULT · ${hero.ult.name}`;
    updateHud();
    playUltCinematic(heroId);
    // Bulk damage — clear all currently-onscreen non-boss enemies as
    // the ULT visually slams the field. Boss takes a bigger chunk.
    // IMPORTANT: properly remove killed enemies via killEnemy so they
    // don't stay as "zombies" in state.enemies blocking targeting.
    for (const e of state.enemies) {
      if (e.isBoss) {
        e.hp -= e.maxHp * 0.12;
      } else if (e.isMiniBoss) {
        e.hp -= e.maxHp * 0.6;
      } else {
        e.hp = 0; // mark for removal below
      }
    }
    // Remove dead fodder/mid in reverse order (safe with swapRemove).
    for (let k = state.enemies.length - 1; k >= 0; k--) {
      const e = state.enemies[k];
      if (e.hp <= 0 && !e.isBoss && !e.isMiniBoss) {
        addExplosion(e.x, e.y, 0.36);
        killEnemy(k);
      }
    }
  }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

/* ═══════════════════════════════════════════════════════════════
   Event Listeners
   ═══════════════════════════════════════════════════════════════ */
// Browsers REQUIRE a user gesture before any audio can play.
// Since soundOn defaults to true, we just need to unlock the AudioContext
// on the first interaction anywhere on the stage (canvas OR any HTML overlay).
async function unlockAudioOnce() {
  if (audio.started) return;
  try {
    await audio.start();
    audio.setEnabled(state.soundOn);
    updateHud();
  } catch (err) {
    console.warn("audio unlock failed", err);
  }
}

// Listen on the entire stage element (canvas + HUD + buttons) so any tap
// works as the audio-unlock gesture. `pointerdown` fires before click.
ui.stage?.addEventListener("pointerdown", unlockAudioOnce, { passive: true });
canvas.addEventListener("pointerdown", () => {
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
  // First click on the page is also the gesture that unlocks audio. After that,
  // this button just toggles between "music + sfx on" and "muted".
  if (!audio.started) await audio.start();
  state.soundOn = !state.soundOn;
  audio.setEnabled(state.soundOn);
  updateHud();
});

// Settings menu toggle
const settingsBtn = document.getElementById("settingsBtn");
const settingsMenu = document.getElementById("settingsMenu");
if (settingsBtn && settingsMenu) {
  settingsBtn.addEventListener("click", () => {
    settingsMenu.hidden = !settingsMenu.hidden;
  });
  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!settingsBtn.contains(e.target) && !settingsMenu.contains(e.target)) {
      settingsMenu.hidden = true;
    }
  });
}

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

if (ui.startBtn) {
  ui.startBtn.addEventListener("click", async () => {
    // Hide button, swap in the progress bar.
    ui.startBtn.classList.add("is-loading");
    ui.titleProgress?.classList.add("is-visible");

    // Kick the audio unlock right inside the user gesture (iOS requires this);
    // sample download will tick into the unified progress counter.
    if (!audio.started) {
      audio.start()
        .then(() => {
          audio.setEnabled(state.soundOn);
          // Engage SFX — confirms the button press to the player and gives
          // the title-screen → prologue handoff a punchy beat.
          audio.levelUp();
        })
        .catch((err) => console.warn("audio unlock failed", err));
    } else {
      audio.levelUp();
    }

    // iOS quirk: the HTML <audio> element used for TTS playback is governed
    // by a SEPARATE autoplay policy from Web Audio. Web Audio is unlocked by
    // audio.start() above, but unless this Audio element gets its first
    // .play() call inside the click gesture, every later playLineVoice()
    // (which fires asynchronously after asset loading + prologue overlay)
    // gets blocked. Pre-create + play the shared element on the FIRST
    // prologue clip muted, so it inherits the gesture; subsequent unmuted
    // playLineVoice calls then succeed without an autoplay reject.
    if (!_voiceAudio) {
      _voiceAudio = new Audio();
      _voiceAudio.preload = "auto";
      _voiceAudio.volume = 1.0;
    }
    try {
      _voiceAudio.muted = true;
      _voiceAudio.src = `assets/voice/prologue/00-narrator.mp3?v=${ASSET_VERSION}`;
      const p = _voiceAudio.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          try {
            _voiceAudio.pause();
            _voiceAudio.muted = false;
            _voiceAudio.currentTime = 0;
          } catch (e) { /* ignore */ }
        }).catch(() => {
          // Some iOS versions reject the first .play() but the element is
          // still marked user-activated for subsequent calls. Restore mute
          // so the next playLineVoice doesn't start silent.
          try { _voiceAudio.muted = false; } catch (e) { /* ignore */ }
        });
      } else {
        _voiceAudio.muted = false;
      }
    } catch (e) { /* really old browsers — ignore */ }

    // Wire the bar to the unified asset counter.
    const updateBar = (ratio, loaded, total) => {
      const pct = Math.round(ratio * 100);
      if (ui.titleProgressFill) ui.titleProgressFill.style.width = `${pct}%`;
      if (ui.titleProgressLabel) ui.titleProgressLabel.textContent = `载入 ${pct}%`;
    };
    onAssetProgress(updateBar);
    // Paint current state (loads have been running since page-load).
    updateBar(_assetsLoadedCount / Math.max(_assetsTotalCount, 1), _assetsLoadedCount, _assetsTotalCount);

    // Wait for every queued asset to finish.
    await _allAssetsReady;
    updateBar(1, _assetsTotalCount, _assetsTotalCount);
    // Brief 100% confirmation pause so the bar visibly settles.
    await new Promise((r) => setTimeout(r, 240));

    // Hide the title overlay, then prologue → Lia intro → stage 1. Returning
    // players skip the prologue + hero intro (kept around for the first run
    // for narrative impact, but skipped after that to preserve flow).
    if (ui.titlePanel) ui.titlePanel.hidden = true;
    const startGameplay = () => {
      state.last = performance.now();
      state.mode = "playing";
      state.message = "地球防御系统启动中";
      updateHud();
    };
    // Always play prologue + hero intro on every run. Returning players
    // explicitly asked for the opening narration to stay (the previous
    // skip-on-second-visit short-circuit hid the entire opening from
    // anyone who'd played once). The voice files are tiny mp3s (<40 KB)
    // so re-playing them costs nothing.
    state.mode = "prologue";
    state.message = "PROLOGUE";
    updateHud();
    const firstHero = activeHeroes[0]?.id || "lia";
    playPrologue(PROLOGUE, () => {
      progress.prologueSeen = true;
      saveProgress(progress);
      state.mode = "heroIntro";
      playHeroIntro(firstHero, startGameplay);
    });
  });
}

function applyQaMode() {
  const mode = qaParams.get("qa");
  if (mode !== "boss" && mode !== "shop") return;
  state.stageLevel = Math.max(1, Number(qaParams.get("stage") || state.stageLevel));
  state.levelCount = Math.max(state.levelCount, 8);
  state.money = Math.max(state.money, 120);
  state.gunLevel = Math.max(state.gunLevel, 5);
  rebuildDefenders();
  if (mode === "shop") {
    openShopPanel();
    return;
  }
  state.waveIndex = wavesPerStage;
  state.levelCount = Math.max(state.levelCount, 18);
  state.maxHealth = Math.max(state.maxHealth, 999);
  state.health = state.maxHealth;
  state.shield = Math.max(state.shield, 999);
  spawnBoss();
  updateHud();
}

/* ═══════════════════════════════════════════════════════════════
   Init
   ═══════════════════════════════════════════════════════════════ */
reset();
applyQaMode();
requestAnimationFrame(frame);
