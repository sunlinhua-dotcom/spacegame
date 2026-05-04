/* ═══════════════════════════════════════════════════════════════
   Dialogue scripts — prologue + 10 stages + epilogue
   ─────────────────────────────────────────────────────────────────
   Each stage has events keyed by trigger:
     stage-enter      Boss arrival + first response
     wave-1-clear     Quick character flavor line
     boss-half        Mid-fight taunt + reply
     boss-ult-charge  Big-attack warning + brace
     boss-defeat      Boss collapse + closer

   Each line is { speaker, text, voice?, durationMs? }.
     speaker:  hero id (heroes.js HEROES[].id) or "boss" / "narrator"
     voice:    optional path to pre-rendered TTS mp3 (filled in later)
     duration: how long the bubble stays before auto-advance (ms)

   Length target: each line ≤ 18 CN chars so it reads in 2-3s on a
   phone screen and the TTS clip is ≤ 4s. Banter feels punchy.
   ═══════════════════════════════════════════════════════════════ */

export const PROLOGUE = [
  { speaker: "narrator", text: "2126 年。太阳异常爆发。", durationMs: 2400 },
  { speaker: "narrator", text: "近地陨石带失稳, 轨道屏障告警。", durationMs: 2800 },
  { speaker: "narrator", text: "ORBIT-S 系统应急启动。", durationMs: 2600 },
  { speaker: "narrator", text: "DIGIREPUB 应援协议生效 ——", durationMs: 2600 },
  { speaker: "narrator", text: "七国机甲精英降临地球轨道。", durationMs: 2800 },
  { speaker: "bright",   text: "我是 BRIGHT。协议唯一总指挥。", durationMs: 3200 },
  { speaker: "bright",   text: "防线即将开启, 全员就位。", durationMs: 2800 },
];

export const EPILOGUE = [
  { speaker: "narrator", text: "异常平息。太阳回归正常。", durationMs: 3000 },
  { speaker: "narrator", text: "七位精英解除战备, 卸下机甲。", durationMs: 3200 },
  { speaker: "bright",   text: "下次, 当星空再次失序 ——", durationMs: 2800 },
  { speaker: "bright",   text: "应援协议会再次响起。", durationMs: 2800 },
  { speaker: "narrator", text: "·  完  ·", durationMs: 2200 },
  { speaker: "narrator", text: "DIGIREPUB STUDIO · 2026", durationMs: 2400 },
];

/* ─────────────── Per-stage scripts ─────────────────────────── */

export const STAGE_DIALOGUE = {
  // 第 1 关 · 熔岩前哨 · Lia (BR)
  1: {
    bossId: "magma-asteroid-mk1",
    bossName: "熔岩巨陨",
    "stage-enter": [
      { speaker: "boss",   text: "渺小的金属虫子……" },
      { speaker: "boss",   text: "你们也敢挡我?" },
      { speaker: "lia",    text: "BRIGHT 长官, Lia 上线。" },
      { speaker: "lia",    text: "允许我先开第一炮。" },
      { speaker: "bright", text: "批准。核心暴露在赤道带。" },
      { speaker: "bright", text: "别留情。" },
    ],
    "wave-1-clear": [
      { speaker: "lia", text: "桑巴节奏, 跟上!" },
    ],
    "boss-half": [
      { speaker: "boss", text: "够了 —— 让你尝尝真火。" },
      { speaker: "lia",  text: "终于来了, 我等的就是这。" },
    ],
    "boss-ult-charge": [
      { speaker: "boss",   text: "巨陨炎涌 —— 这才是火!" },
      { speaker: "lia",    text: "全员散开! 我顶住。" },
      { speaker: "bright", text: "盾给你 Lia, 撑住!" },
    ],
    "boss-defeat": [
      { speaker: "boss",   text: "……冰冷……虚空……" },
      { speaker: "lia",    text: "第一颗熔岩, 落入轨道。" },
      { speaker: "bright", text: "干得漂亮。下一位待命。" },
    ],
  },

  // 第 2 关 · 生体蜂巢 · Devi (IN) 加入
  2: {
    bossId: "bio-saucer-hive",
    bossName: "生体蜂巢",
    "stage-enter": [
      { speaker: "boss",   text: "我的孩子无穷无尽。" },
      { speaker: "devi",   text: "草药与电流, 都是疗愈。" },
      { speaker: "lia",    text: "Devi 终于来了, 烤虫子!" },
      { speaker: "bright", text: "二人协同, 净化它的孵化场。" },
    ],
    "wave-1-clear": [
      { speaker: "devi", text: "毒云, 散布完成。" },
    ],
    "boss-half": [
      { speaker: "boss", text: "繁衍……再繁衍……" },
      { speaker: "devi", text: "种子还会再生 —— 我不会。" },
    ],
    "boss-ult-charge": [
      { speaker: "boss", text: "活体毒云倾泻!" },
      { speaker: "devi", text: "净化结界, 启动。" },
      { speaker: "lia",  text: "Devi, 我从外圈烧!" },
    ],
    "boss-defeat": [
      { speaker: "boss",   text: "繁衍……继续……" },
      { speaker: "devi",   text: "种子已落地, 它们会再生。" },
      { speaker: "bright", text: "Rin 待命, 准备进场。" },
    ],
  },

  // 第 3 关 · 冰晶利维坦 · Rin (KR) 加入
  3: {
    bossId: "ice-leviathan",
    bossName: "冰晶利维坦",
    "stage-enter": [
      { speaker: "boss",   text: "你的火焰, 在零下没用。" },
      { speaker: "rin",    text: "极地狙击, 一发足矣。" },
      { speaker: "lia",    text: "Rin 来了 —— 终于不孤单。" },
      { speaker: "bright", text: "Rin 主攻, Lia/Devi 牵制小怪。" },
    ],
    "wave-1-clear": [
      { speaker: "rin", text: "瞄准点, 锁定。" },
    ],
    "boss-half": [
      { speaker: "boss", text: "冷……更冷……" },
      { speaker: "rin",  text: "是你太慢, 不是我太冷。" },
    ],
    "boss-ult-charge": [
      { speaker: "boss", text: "极冰穿刺即将启动。" },
      { speaker: "rin",  text: "瞄准核心点 ——" },
      { speaker: "devi", text: "我护着你的射击线!" },
    ],
    "boss-defeat": [
      { speaker: "boss",   text: "……裂……" },
      { speaker: "rin",    text: "冰之静默, 永远停摆。" },
      { speaker: "bright", text: "Yue 准备登场, 中场至此。" },
    ],
  },

  // 第 4 关 · 虚空母舰 · Yue (CN) 加入
  4: {
    bossId: "void-mothership",
    bossName: "虚空母舰",
    "stage-enter": [
      { speaker: "boss",   text: "你听过宇宙的寂静吗?" },
      { speaker: "yue",    text: "月相牵引, 万象归一。" },
      { speaker: "rin",    text: "Yue, 你的影子比我冷。" },
      { speaker: "yue",    text: "影子, 是月光的另一面。" },
      { speaker: "bright", text: "四人合奏开始。" },
    ],
    "wave-1-clear": [
      { speaker: "yue", text: "幻镜, 已铺开。" },
    ],
    "boss-half": [
      { speaker: "boss", text: "回归……黑暗……" },
      { speaker: "yue",  text: "黑暗里, 也有月光。" },
    ],
    "boss-ult-charge": [
      { speaker: "boss", text: "暗物质回收开始 ——" },
      { speaker: "yue",  text: "幻术阵, 启动。" },
      { speaker: "lia",  text: "Yue 我火力顶你!" },
    ],
    "boss-defeat": [
      { speaker: "boss",   text: "回归……黑暗……" },
      { speaker: "yue",    text: "明月当空, 影自归位。" },
      { speaker: "bright", text: "中场回防。Ade 集结。" },
    ],
  },

  // 第 5 关 · 黄金炮台 · Ade (NG) 加入
  5: {
    bossId: "gold-fortress",
    bossName: "黄金炮台",
    "stage-enter": [
      { speaker: "boss",   text: "金属的颂歌即将奏响。" },
      { speaker: "ade",    text: "黄金圣盾, 不可破。" },
      { speaker: "yue",    text: "Ade, 你的甲比我厚。" },
      { speaker: "ade",    text: "厚, 是为了护住你们。" },
      { speaker: "bright", text: "五人战线推进。" },
    ],
    "wave-1-clear": [
      { speaker: "ade", text: "圣盾, 建立。" },
    ],
    "boss-half": [
      { speaker: "boss", text: "金辉万丈 ——" },
      { speaker: "ade",  text: "比你的金子更亮, 是我的盾。" },
    ],
    "boss-ult-charge": [
      { speaker: "boss",   text: "九重炮齐射 ——" },
      { speaker: "ade",    text: "圣盾全开!" },
      { speaker: "rin",    text: "Ade 顶住, 我打它的核心。" },
    ],
    "boss-defeat": [
      { speaker: "boss",   text: "……熔……解……" },
      { speaker: "ade",    text: "黄金的旋律, 由我谱写。" },
      { speaker: "bright", text: "Sakura 进场, 节奏加快。" },
    ],
  },

  // 第 6 关 · 红色等离子 · Sakura (JP) 加入
  6: {
    bossId: "red-plasma-coil",
    bossName: "红色等离子",
    "stage-enter": [
      { speaker: "boss",    text: "电浆将贯穿一切。" },
      { speaker: "sakura",  text: "樱花脉冲, 共鸣同步。" },
      { speaker: "ade",     text: "Sakura 来了, 频率提升。" },
      { speaker: "sakura",  text: "嗯! 用樱花打雷, 最浪漫。" },
      { speaker: "bright",  text: "六人协同, 火力全开。" },
    ],
    "wave-1-clear": [
      { speaker: "sakura", text: "雷链, 三跳收割!" },
    ],
    "boss-half": [
      { speaker: "boss",   text: "电流……贯穿……" },
      { speaker: "sakura", text: "樱花的电流最是温柔。" },
    ],
    "boss-ult-charge": [
      { speaker: "boss",   text: "雷霆万钧!" },
      { speaker: "sakura", text: "脉冲, 全频段释放!" },
      { speaker: "yue",    text: "Sakura, 月相加成给你。" },
    ],
    "boss-defeat": [
      { speaker: "boss",    text: "……花……瓣……" },
      { speaker: "sakura",  text: "樱花飘落, 你也散开了。" },
      { speaker: "bright",  text: "Aria 待命, 风将至。" },
    ],
  },

  // 第 7 关 · 蓝色离子蜂巢 · Aria (FR) 加入(应援团满员)
  7: {
    bossId: "blue-ion-hive",
    bossName: "蓝色离子蜂巢",
    "stage-enter": [
      { speaker: "boss",    text: "风暴, 才是真正的协奏。" },
      { speaker: "aria",    text: "风暴指挥, 四象合奏。" },
      { speaker: "sakura",  text: "Aria, 你的风带电吗?" },
      { speaker: "aria",    text: "带的是节拍, mon ami。" },
      { speaker: "bright",  text: "应援团满员, 七人就位。" },
    ],
    "wave-1-clear": [
      { speaker: "aria", text: "对位反击 —— 完成。" },
    ],
    "boss-half": [
      { speaker: "boss", text: "蜂群之声 ——" },
      { speaker: "aria", text: "你的合奏, 跑调了。" },
    ],
    "boss-ult-charge": [
      { speaker: "boss", text: "天罗音网展开!" },
      { speaker: "aria", text: "对位反击, 矩阵 ——" },
      { speaker: "ade",  text: "Aria 我护你后方!" },
    ],
    "boss-defeat": [
      { speaker: "boss",    text: "……静……默……" },
      { speaker: "aria",    text: "蓝调, 由我收尾。" },
      { speaker: "bright",  text: "下一关, 我亲自上。" },
    ],
  },

  // 第 8 关 · 黑色无畏舰 · BRIGHT 亲自登场
  8: {
    bossId: "black-dreadnought",
    bossName: "黑色无畏舰",
    "stage-enter": [
      { speaker: "boss",    text: "总指挥? 不过是凡人。" },
      { speaker: "bright",  text: "应援协议总司令, 出击。" },
      { speaker: "lia",     text: "BRIGHT 长官, 您终于来了!" },
      { speaker: "bright",  text: "我不是凡人 —— 我是协议。" },
      { speaker: "rin",     text: "全频段火控, 锁定您身后。" },
    ],
    "wave-1-clear": [
      { speaker: "bright", text: "前锋稳住, 火线推进。" },
    ],
    "boss-half": [
      { speaker: "boss",   text: "你不过是七人之首。" },
      { speaker: "bright", text: "我们是八人之心。" },
    ],
    "boss-ult-charge": [
      { speaker: "boss",   text: "无畏者无惧 ——" },
      { speaker: "bright", text: "全频段火力, 倾泻!" },
      { speaker: "yue",    text: "为长官, 月相全开!" },
    ],
    "boss-defeat": [
      { speaker: "boss",    text: "……崩……坏……" },
      { speaker: "bright",  text: "ORBIT-S 失控的部分 —— 已修正。" },
      { speaker: "aria",    text: "原来无畏舰是协议自己……" },
    ],
  },

  // 第 9 关 · 白色重力环 · Aria + Yue 双人合奏
  9: {
    bossId: "white-graviton-ring",
    bossName: "白色重力环",
    "stage-enter": [
      { speaker: "boss",    text: "重力凌驾一切, 包括你。" },
      { speaker: "aria",    text: "风与月, 同步收割。" },
      { speaker: "yue",     text: "凤鸣月落, 二象归一。" },
      { speaker: "bright",  text: "Aria + Yue 双人合奏, 全员掩护。" },
    ],
    "wave-1-clear": [
      { speaker: "aria", text: "凤鸣 ——" },
      { speaker: "yue",  text: "月落 ——" },
    ],
    "boss-half": [
      { speaker: "boss", text: "重力坍缩…一切归零……" },
      { speaker: "yue",  text: "归零之后, 是新月。" },
      { speaker: "aria", text: "新月之后, 是风潮。" },
    ],
    "boss-ult-charge": [
      { speaker: "boss",   text: "重力坍缩, 全场清零!" },
      { speaker: "aria",   text: "凤鸣月落 ——" },
      { speaker: "yue",    text: "二象合一!" },
      { speaker: "bright", text: "全员稳住, 看她俩的。" },
    ],
    "boss-defeat": [
      { speaker: "boss",   text: "……沉……降……" },
      { speaker: "aria",   text: "双人协奏, 万象归一。" },
      { speaker: "yue",    text: "终曲未至, 但日蚀将临。" },
    ],
  },

  // 第 10 关 · 日蚀核心 · BRIGHT 觉醒
  10: {
    bossId: "solar-eclipse-core",
    bossName: "日蚀核心",
    "stage-enter": [
      { speaker: "boss",    text: "我是太阳的影子。" },
      { speaker: "bright",  text: "影子永远输给光。" },
      { speaker: "lia",     text: "长官, 我们都在这。" },
      { speaker: "ade",     text: "圣盾就绪, 等您令。" },
      { speaker: "bright",  text: "BRIGHT, ULTIMATE 解除封印。" },
    ],
    "wave-1-clear": [
      { speaker: "bright", text: "全员极限输出。" },
    ],
    "boss-half": [
      { speaker: "boss",   text: "太阳熄灭, 你也将熄灭。" },
      { speaker: "bright", text: "黎明永远来自一束光。" },
    ],
    "boss-ult-charge": [
      { speaker: "boss",   text: "日蚀降临 ——" },
      { speaker: "bright", text: "全频段觉醒 ——" },
      { speaker: "sakura", text: "长官, 樱花护您!" },
      { speaker: "rin",    text: "极冰开路!" },
    ],
    "boss-defeat": [
      { speaker: "boss",    text: "……终……焉……" },
      { speaker: "bright",  text: "影子永远输给光。" },
      { speaker: "lia",     text: "我们……赢了!" },
      { speaker: "yue",     text: "明月当空, 万物归位。" },
    ],
  },
};

/* ─────────────── API ─────────────────────────────────────────── */

export function getStageScript(stageLevel) {
  return STAGE_DIALOGUE[stageLevel] || null;
}

export function getEvent(stageLevel, trigger) {
  const s = STAGE_DIALOGUE[stageLevel];
  return s ? s[trigger] || [] : [];
}

// Convenience: estimated number of TTS lines for budget planning.
export function totalLineCount() {
  let n = PROLOGUE.length + EPILOGUE.length;
  for (const s of Object.values(STAGE_DIALOGUE)) {
    for (const v of Object.values(s)) {
      if (Array.isArray(v)) n += v.length;
    }
  }
  return n;
}
