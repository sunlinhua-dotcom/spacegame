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
export const STAGE_BALANCE = {
  1:  { enemyHp: 1.00, enemySpeed: 1.00, waveCount: 5,  bossHp: 1.0, miniBoss: false, earthHp: 160 },
  2:  { enemyHp: 1.10, enemySpeed: 1.04, waveCount: 6,  bossHp: 1.2, miniBoss: false, earthHp: 160 },
  3:  { enemyHp: 1.25, enemySpeed: 1.08, waveCount: 7,  bossHp: 1.5, miniBoss: true,  earthHp: 170 },
  4:  { enemyHp: 1.40, enemySpeed: 1.12, waveCount: 8,  bossHp: 1.8, miniBoss: true,  earthHp: 180 },
  5:  { enemyHp: 1.55, enemySpeed: 1.18, waveCount: 9,  bossHp: 2.1, miniBoss: true,  earthHp: 190 },
  6:  { enemyHp: 1.70, enemySpeed: 1.24, waveCount: 10, bossHp: 2.4, miniBoss: true,  earthHp: 200 },
  7:  { enemyHp: 1.85, enemySpeed: 1.30, waveCount: 11, bossHp: 2.7, miniBoss: true,  earthHp: 210 },
  8:  { enemyHp: 2.00, enemySpeed: 1.36, waveCount: 12, bossHp: 3.0, miniBoss: true,  earthHp: 220 },
  9:  { enemyHp: 2.20, enemySpeed: 1.42, waveCount: 14, bossHp: 3.4, miniBoss: true,  earthHp: 230 },
  10: { enemyHp: 2.50, enemySpeed: 1.50, waveCount: 16, bossHp: 4.0, miniBoss: true,  earthHp: 250 },
};

// Rewards scale a bit with difficulty so the player feels progress.
export const STAGE_REWARD = {
  1:  { coins: 25,  upgradeChoices: 3 },
  2:  { coins: 30,  upgradeChoices: 3 },
  3:  { coins: 40,  upgradeChoices: 3 },
  4:  { coins: 55,  upgradeChoices: 3 },
  5:  { coins: 70,  upgradeChoices: 4 },
  6:  { coins: 85,  upgradeChoices: 4 },
  7:  { coins: 100, upgradeChoices: 4 },
  8:  { coins: 130, upgradeChoices: 4 },
  9:  { coins: 160, upgradeChoices: 5 },
  10: { coins: 220, upgradeChoices: 5 },
};

export function getStageBalance(stageLevel) {
  const clamped = Math.max(1, Math.min(10, stageLevel));
  return STAGE_BALANCE[clamped];
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
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { unlockedHeroes: ["lia"], bestStage: 1, totalRuns: 0 };
    const obj = JSON.parse(raw);
    return {
      unlockedHeroes: Array.isArray(obj.unlockedHeroes) ? obj.unlockedHeroes : ["lia"],
      bestStage: typeof obj.bestStage === "number" ? obj.bestStage : 1,
      totalRuns: typeof obj.totalRuns === "number" ? obj.totalRuns : 0,
    };
  } catch (e) {
    return { unlockedHeroes: ["lia"], bestStage: 1, totalRuns: 0 };
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
