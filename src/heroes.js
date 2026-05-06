/* ═══════════════════════════════════════════════════════════════
   Hero roster + ULT gauge + per-stage active set
   ─────────────────────────────────────────────────────────────────
   8 distinct heroes, unlocked one-per-stage. Each has:
     - name, country, color (signature rim)
     - base sprite (td-{name}.webp) + ULT sprite (td-{name}-ult.webp)
     - weapon (wp-{name}.webp) + ult weapon (wp-{name}-ult.webp)
     - passive: passive(state) — auto-applied modifier
     - ultimate: ult(state, ctx) — fires when gauge fills, resets gauge
     - voice description for mimo TTS

   Pure data + behavior. game-three.js owns the orbit visuals + ult
   gauge UI; this module hands it the catalog + the ult triggers.
   ═══════════════════════════════════════════════════════════════ */

const ULT_GAUGE_MAX = 100;

// Score earned per kill type — feeds the gauge.
export const ULT_GAUGE_GAIN = {
  fodder: 2,    // tier 0
  mid: 4,       // tier 1
  elite: 8,     // tier 2
  miniBoss: 18, // tier 3
  boss: 40,
};

/* ─────────────── Hero catalog (in unlock order) ─────────────── */

export const HEROES = [
  {
    id: "lia",
    name: "Lia",
    country: "BR",
    title: "热带烈焰",
    sprite: "td-lia",
    spriteUlt: "td-lia-ult",
    portrait: "lia-portrait",
    actionPortrait: "lia-action",
    weapon: "wp-lia",
    weaponUlt: "wp-lia-ult",
    color: 0xff7a32,
    rimGlow: "rgba(255, 122, 50, 0.85)",
    voiceDesc: "热带活力少女, 中音偏亮, 自信高昂",
    passive: { id: "burning-shot", desc: "弹幕附燃, 持续灼烧 2s", dotDps: 6 },
    ult: {
      id: "magma-tide",
      name: "巨陨炎涌",
      desc: "全屏火焰带 6 秒, 同时点燃所有敌人",
      durationSec: 6,
      effect: "全屏 DOT + 火焰条带视觉",
    },
    skillCardName: "焚尽 · 弹幕附燃",
  },

  {
    id: "devi",
    name: "Devi",
    country: "IN",
    title: "草药神技",
    sprite: "td-devi",
    spriteUlt: "td-devi-ult",
    portrait: "devi-portrait",
    actionPortrait: "devi-action",
    weapon: "wp-devi",
    weaponUlt: "wp-devi-ult",
    color: 0x9b6dff,
    rimGlow: "rgba(155, 109, 255, 0.85)",
    voiceDesc: "温柔治愈型女声, 印度英语口音, 中音偏低, 语速稍慢",
    passive: { id: "toxic-trail", desc: "射弹经过留毒, 4 DPS, 6s", lingerSec: 6, dotDps: 4 },
    ult: {
      id: "verdant-tide",
      name: "绿潮蔓延",
      desc: "所有敌人持续掉血 8 秒",
      durationSec: 8,
      effect: "全场 DOT, 范围结界视觉",
    },
    skillCardName: "净化 · 毒云轨迹",
  },

  {
    id: "rin",
    name: "Rin",
    country: "KR",
    title: "极地狙击",
    sprite: "td-rin",
    spriteUlt: "td-rin-ult",
    portrait: "rin-portrait",
    actionPortrait: "rin-action",
    weapon: "wp-rin",
    weaponUlt: "wp-rin-ult",
    color: 0x7fd9ff,
    rimGlow: "rgba(127, 217, 255, 0.85)",
    voiceDesc: "冷静狙击手, 清亮中音, 韩式简练, 语速精准",
    passive: { id: "frost-bite", desc: "命中减速 30% / 2s", slowFactor: 0.7, slowSec: 2 },
    ult: {
      id: "ice-pierce",
      name: "极冰穿刺",
      desc: "三道激光纵向扫过, 高额穿透伤害",
      durationSec: 3,
      effect: "3 道激光柱穿屏",
    },
    skillCardName: "冷凝 · 冰冻减速",
  },

  {
    id: "yue",
    name: "Yue",
    country: "CN",
    title: "月相幻术",
    sprite: "td-yue",
    spriteUlt: "td-yue-ult",
    portrait: "yue-portrait",
    actionPortrait: "yue-action",
    weapon: "wp-yue",
    weaponUlt: "wp-yue-ult",
    color: 0xff3a4e,
    rimGlow: "rgba(255, 58, 78, 0.85)",
    voiceDesc: "古典禅意女声, 中音, 语调如诗, 偏空灵",
    passive: { id: "moon-phantom", desc: "每 5s 召唤分身一次, 持续 3s", spawnEvery: 5 },
    ult: {
      id: "moon-mirror",
      name: "月相幻镜",
      desc: "复制 3 倍火力 5 秒",
      durationSec: 5,
      effect: "fireRate × 3",
    },
    skillCardName: "月影 · 自动分身",
  },

  {
    id: "ade",
    name: "Ade",
    country: "NG",
    title: "黄金圣盾",
    sprite: "td-ade",
    spriteUlt: "td-ade-ult",
    portrait: "ade-portrait",
    actionPortrait: "ade-action",
    weapon: "wp-ade",
    weaponUlt: "wp-ade-ult",
    color: 0xffd166,
    rimGlow: "rgba(255, 209, 102, 0.9)",
    voiceDesc: "深沉有力的女声, 中低音, 非洲鼓点般的节奏感",
    passive: { id: "gold-aura", desc: "全队减伤 20%", dmgReduction: 0.2 },
    ult: {
      id: "gold-aegis",
      name: "黄金圣铠",
      desc: "全队无敌 4 秒",
      durationSec: 4,
      effect: "全队 invuln 4s",
    },
    skillCardName: "圣盾 · 全队减伤",
  },

  {
    id: "sakura",
    name: "Sakura",
    country: "JP",
    title: "樱花脉冲",
    sprite: "td-sakura",
    spriteUlt: "td-sakura-ult",
    portrait: "sakura-portrait",
    actionPortrait: "sakura-action",
    weapon: "wp-sakura",
    weaponUlt: "wp-sakura-ult",
    color: 0xff7ed5,
    rimGlow: "rgba(255, 126, 213, 0.85)",
    voiceDesc: "甜美少女音, 日式柔气, 带樱花飘落的轻盈感",
    passive: { id: "thunder-chain", desc: "命中连锁 3 跳", chainCount: 3, chainRange: 90 },
    ult: {
      id: "sakura-pulse",
      name: "樱花脉冲",
      desc: "屏幕全频段电击",
      durationSec: 1.6,
      effect: "全屏一次性闪电网",
    },
    skillCardName: "雷链 · 命中连锁",
  },

  {
    id: "aria",
    name: "Aria",
    country: "FR",
    title: "风暴指挥",
    sprite: "td-aria",
    spriteUlt: "td-aria-ult",
    portrait: "aria-portrait",
    actionPortrait: "aria-action",
    weapon: "wp-aria",
    weaponUlt: "wp-aria-ult",
    color: 0xff5fe8,
    rimGlow: "rgba(255, 95, 232, 0.85)",
    voiceDesc: "优雅指挥家女声, 中音, 法式韵律, 如风过琴弦",
    passive: { id: "wind-knock", desc: "命中击退 + 减速短暂", knockback: 60 },
    ult: {
      id: "tempest-net",
      name: "天罗音网",
      desc: "风暴矩阵反射所有弹幕",
      durationSec: 4,
      effect: "全屏弹幕反射",
    },
    skillCardName: "风刃 · 击退",
  },

  {
    id: "bright",
    name: "BRIGHT",
    country: "M",
    title: "总指挥 · 觉醒",
    sprite: "td-bright",
    spriteUlt: "td-bright-ult",
    portrait: "bright-portrait-determined",
    portraitCool: "bright-portrait-cool",
    actionPortrait: "bright-action-command",
    actionAwakening: "bright-action-awakening",
    weapon: "wp-bright",
    weaponUlt: "wp-bright-ult",
    color: 0xc77dff,
    rimGlow: "rgba(199, 125, 255, 0.95)",
    voiceDesc: "沉稳威严的男性指挥官, 中低音, 略带电子通讯滤镜, 30岁左右",
    passive: { id: "command-aura", desc: "全员伤害 +10%", teamDmgMul: 1.1 },
    ult: {
      id: "eclipse-descent",
      name: "日蚀降临",
      desc: "屏幕黑→白爆, 全场清扫",
      durationSec: 2.5,
      effect: "全屏清场 + 大屏闪光",
    },
    skillCardName: "指挥 · 全员加伤",
  },
];

/* ─────────────── Master Yin — guest hero with sushi-rain ULT ─────
   Unlocks at stage 1 wave 10. He doesn't fly a mecha (no top-down
   sprite), but he occupies a portrait slot in the bottom hero roster
   and earns a charge gauge from kills like the other heroes. When the
   player taps his portrait, his ult fires:
     • A radial sushi explosion (大量寿司从地球扔出去)
     • All non-boss enemies slowed for ult.durationSec
   ─────────────────────────────────────────────────────────────── */

export const MASTER_YIN = {
  id: "yin",
  name: "殷师傅",
  fullName: "殷师傅 · 居酒屋客座助阵",
  country: "CN",
  // Multiple angles, same character. Wire each into a different UI surface:
  //   portrait     — close-up head & shoulders, used in dialogue / cards
  //   action       — full-body taunt stance, used in the unlock cinematic
  //   actionAlt    — side-profile slicing motion, reserved for future scenes
  //   chibi        — SD-style icon, used in the HUD badge
  portrait: "yin-portrait",
  actionPortrait: "yin-action",
  actionAlt: "yin-action-alt",
  chibi: "yin-chibi",
  // 0.55 = 45% slow during ult — much stronger than the old passive
  // 22% slow, but only lasts for ult.durationSec instead of forever.
  enemySlowFactor: 0.55,
  skill: {
    name: "嘲讽",
    desc: "击杀蓄力,点击释放大招",
  },
  ult: {
    name: "寿司风暴 · 全场嘲讽",
    durationSec: 8,
    desc: "全场敌人减速 45%,持续 8 秒",
  },
  unlock: {
    // Yin unlocks at stage 10 — late-game guest pilot. He's NOT persistent
    // across runs, so each new run requires the player to push back to
    // stage 10 to unlock him again. The reward is "you got this far —
    // here's a 9th hero for the final stretch".
    stage: 10,
    wave: 1,
    eyebrow: "GUEST PILOT",
    blurb: "居酒屋的殷师傅赶来助阵 —— 击杀蓄力,点击释放寿司风暴!",
  },
};

/* ─────────────── Per-stage active heroes ────────────────────────
   Stage N has heroes [0..N-1]. So stage 1 has 1 hero (Lia), stage 2
   has 2 (Lia + Devi), ... stage 8 has all 8. Stages 9 / 10 still
   show all 8.
   ─────────────────────────────────────────────────────────────── */

export function activeHeroesForStage(stageLevel) {
  const n = Math.min(HEROES.length, Math.max(1, stageLevel));
  return HEROES.slice(0, n);
}

export function getHero(id) {
  return HEROES.find((h) => h.id === id);
}

/* ─────────────── ULT gauge state ────────────────────────────────
   One gauge per active hero. Fills as enemies die (per ULT_GAUGE_GAIN).
   When full, triggers the hero's ult and resets to 0. The actual
   ult VFX/timing live in game-three.js — this module just owns the
   state machine.
   ─────────────────────────────────────────────────────────────── */

export class HeroGauges {
  constructor(activeHeroes) {
    this.gauges = activeHeroes.map((h) => ({
      heroId: h.id,
      value: 0,
      max: ULT_GAUGE_MAX,
      pendingTrigger: false,
      ultActive: false,
      ultEndsAt: 0,
    }));
  }

  // Add a hero mid-run (used when 殷师傅 unlocks at stage 1 wave 10).
  // Idempotent — calling twice for the same hero is a no-op.
  addHero(heroId) {
    if (this.gauges.some((g) => g.heroId === heroId)) return;
    this.gauges.push({
      heroId,
      value: 0,
      max: ULT_GAUGE_MAX,
      pendingTrigger: false,
      ultActive: false,
      ultEndsAt: 0,
    });
  }

  // Distribute a kill across all active heroes so they all charge in parallel.
  // Gauge fills to ready state, but does NOT auto-fire — the player must
  // tap the hero portrait to release the ult (see tryFireUlt below).
  onKill(tier) {
    const tierKey = ["fodder", "mid", "elite", "miniBoss", "boss"][Math.min(tier, 4)];
    const gain = ULT_GAUGE_GAIN[tierKey] || 1;
    const perHero = gain / Math.max(1, this.gauges.length);
    for (const g of this.gauges) {
      if (g.ultActive) continue;
      g.value = Math.min(g.max, g.value + perHero);
    }
  }

  // Manual fire: called when user taps a hero's portrait. Returns the
  // heroId if the ult successfully fired (gauge full, not already active),
  // or null if not ready.
  tryFireUlt(heroId) {
    const g = this.gauges.find((x) => x.heroId === heroId);
    if (!g) return null;
    if (g.ultActive) return null;
    if (g.value < g.max) return null;
    g.pendingTrigger = true;
    return heroId;
  }

  // Called each frame; expires active ults and returns ids whose pending
  // manual trigger should fire this tick.
  consumePending(now) {
    const fired = [];
    for (const g of this.gauges) {
      if (g.ultActive && now >= g.ultEndsAt) {
        g.ultActive = false;
        g.value = 0;
      }
      if (g.pendingTrigger && !g.ultActive) {
        g.pendingTrigger = false;
        fired.push(g.heroId);
      }
    }
    return fired;
  }

  // Has the gauge filled but not yet been fired? Drives the ready glow.
  isReady(heroId) {
    const g = this.gauges.find((x) => x.heroId === heroId);
    return !!(g && !g.ultActive && g.value >= g.max);
  }

  beginUlt(heroId, durationSec, now) {
    const g = this.gauges.find((x) => x.heroId === heroId);
    if (!g) return;
    g.ultActive = true;
    g.ultEndsAt = now + durationSec;
  }

  ratioFor(heroId) {
    const g = this.gauges.find((x) => x.heroId === heroId);
    return g ? g.value / g.max : 0;
  }

  isUltActive(heroId) {
    const g = this.gauges.find((x) => x.heroId === heroId);
    return !!(g && g.ultActive);
  }
}
