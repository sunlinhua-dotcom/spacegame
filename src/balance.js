/* ═══════════════════════════════════════════════════════════════
   Difficulty curve + Boss HP scale + per-stage balance knobs
   ─────────────────────────────────────────────────────────────────
   The retention promise: each stage feels meaningfully harder than
   the last. Player gets +1 hero per stage (parallel firepower up),
   so enemy HP / wave count / boss HP have to outpace that growth or
   the player coasts. Numbers are tuned so:

     • Stage 1 = ~70-90% of an experienced player's max output
       (winnable but tight)
     • Stages 5-7 = the difficulty plateau where ult cards matter
     • Stage 8+ = need to time ults carefully, mistakes punish hard
     • Stage 10 = ~150% of player's max output without optimal play

   The roguelite escape valve: dying restarts at stage 1 BUT all
   heroes you've unlocked stay unlocked, so the next attempt has more
   parallel firepower. Skill + persistent unlocks together.
   ═══════════════════════════════════════════════════════════════ */

// Stage-by-stage difficulty multipliers. Indexes are 1-based (stage 1 → [1]).
// Tuned so stage 1 is already tense, difficulty ramps steadily, and stages
// 11+ continue scaling via the formula in getStageBalance().
export const STAGE_BALANCE = {
  1:  { enemyHp: 1.00, enemySpeed: 1.00, waveCount: 5,  bossHp: 1.0, miniBoss: false, earthHp: 120 },
  2:  { enemyHp: 1.20, enemySpeed: 1.06, waveCount: 6,  bossHp: 1.3, miniBoss: false, earthHp: 130 },
  3:  { enemyHp: 1.45, enemySpeed: 1.12, waveCount: 7,  bossHp: 1.7, miniBoss: true,  earthHp: 140 },
  4:  { enemyHp: 1.75, enemySpeed: 1.18, waveCount: 8,  bossHp: 2.1, miniBoss: true,  earthHp: 150 },
  5:  { enemyHp: 2.10, enemySpeed: 1.25, waveCount: 9,  bossHp: 2.6, miniBoss: true,  earthHp: 160 },
  6:  { enemyHp: 2.50, enemySpeed: 1.32, waveCount: 10, bossHp: 3.2, miniBoss: true,  earthHp: 170 },
  7:  { enemyHp: 3.00, enemySpeed: 1.40, waveCount: 11, bossHp: 3.9, miniBoss: true,  earthHp: 180 },
  8:  { enemyHp: 3.60, enemySpeed: 1.48, waveCount: 12, bossHp: 4.8, miniBoss: true,  earthHp: 190 },
  9:  { enemyHp: 4.30, enemySpeed: 1.56, waveCount: 14, bossHp: 5.8, miniBoss: true,  earthHp: 200 },
  10: { enemyHp: 5.00, enemySpeed: 1.65, waveCount: 16, bossHp: 7.0, miniBoss: true,  earthHp: 220 },
};

// Rewards scale a bit with difficulty so the player feels progress.
export const STAGE_REWARD = {
  1:  { coins: 15,  upgradeChoices: 3 },
  2:  { coins: 20,  upgradeChoices: 3 },
  3:  { coins: 28,  upgradeChoices: 3 },
  4:  { coins: 38,  upgradeChoices: 3 },
  5:  { coins: 50,  upgradeChoices: 3 },
  6:  { coins: 65,  upgradeChoices: 4 },
  7:  { coins: 80,  upgradeChoices: 4 },
  8:  { coins: 100, upgradeChoices: 4 },
  9:  { coins: 125, upgradeChoices: 4 },
  10: { coins: 160, upgradeChoices: 5 },
};

export function getStageBalance(stageLevel) {
  if (stageLevel <= 10) return STAGE_BALANCE[Math.max(1, stageLevel)];
  // Stages 11+: extrapolate from stage 10 with +35% HP and +6% speed per stage
  const extra = stageLevel - 10;
  const s10 = STAGE_BALANCE[10];
  return {
    enemyHp:    +(s10.enemyHp * Math.pow(1.35, extra)).toFixed(2),
    enemySpeed: +(s10.enemySpeed * Math.pow(1.06, extra)).toFixed(2),
    waveCount:  Math.min(20, s10.waveCount + extra),
    bossHp:     +(s10.bossHp * Math.pow(1.40, extra)).toFixed(2),
    miniBoss:   true,
    earthHp:    s10.earthHp + extra * 15,
  };
}

export function getStageReward(stageLevel) {
  const clamped = Math.max(1, Math.min(10, stageLevel));
  return STAGE_REWARD[clamped];
}

/* ─────────────── Run state (persistent + per-run) ─────────────────
   Local persistence: which heroes are unlocked carries across deaths.
   Per-run state: current stage, earth HP, ult charges, etc.
   ─────────────────────────────────────────────────────────────── */

const STORAGE_KEY = "edr-roguelite-v1";

export function loadProgress() {
  // Note: 殷师傅 is intentionally NOT in persistent progress — he must be
  // re-unlocked at stage 10 in each run. The yinUnlocked field is only
  // tracked at the run level (state.yinUnlocked).
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { unlockedHeroes: ["lia"], bestStage: 1, totalRuns: 0, prologueSeen: false, tutorialSeen: false };
    const obj = JSON.parse(raw);
    return {
      unlockedHeroes: Array.isArray(obj.unlockedHeroes) ? obj.unlockedHeroes : ["lia"],
      bestStage: typeof obj.bestStage === "number" ? obj.bestStage : 1,
      totalRuns: typeof obj.totalRuns === "number" ? obj.totalRuns : 0,
      prologueSeen: !!obj.prologueSeen,
      tutorialSeen: !!obj.tutorialSeen,
    };
  } catch (e) {
    return { unlockedHeroes: ["lia"], bestStage: 1, totalRuns: 0, prologueSeen: false, tutorialSeen: false };
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) { /* private mode etc — best-effort */ }
}

export function unlockHeroForStage(progress, stageLevel) {
  // Stage N unlocks the N-th hero (in HEROES order from heroes.js)
  // 1 → lia, 2 → devi, 3 → rin, 4 → yue, 5 → ade, 6 → sakura, 7 → aria, 8 → bright
  const order = ["lia", "devi", "rin", "yue", "ade", "sakura", "aria", "bright"];
  const idx = stageLevel - 1;
  if (idx < 0 || idx >= order.length) return progress;
  const heroId = order[idx];
  if (!progress.unlockedHeroes.includes(heroId)) {
    progress = { ...progress, unlockedHeroes: [...progress.unlockedHeroes, heroId] };
  }
  if (stageLevel > progress.bestStage) {
    progress = { ...progress, bestStage: stageLevel };
  }
  return progress;
}
