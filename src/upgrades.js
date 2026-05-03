const groups = [
  {
    category: "Gun",
    base: [
      ["Gun", 5, "common", "派出 3 架小飞机"],
      ["双联机炮", 7, "common", "小飞机改为双发"],
      ["高速供弹", 9, "common", "小飞机射速提升"],
      ["穿甲弹头", 12, "rare", "子弹可穿透 1 个敌人"],
      ["扇形齐射", 15, "rare", "小飞机获得散射"],
      ["轨道编队", 18, "rare", "防卫机分成内外双环"],
      ["近防炮阵", 22, "epic", "近地敌人触发短距爆发"],
      ["钨芯风暴", 28, "epic", "命中后产生碎片"],
      ["近地机群", 35, "legendary", "防卫机数量显著提升"]
    ]
  },
  {
    category: "Laser",
    base: [
      ["Laser", 8, "common", "解锁地球近轨激光"],
      ["聚焦透镜", 10, "common", "激光伤害提高"],
      ["扫描镜组", 12, "common", "激光缓慢扫射"],
      ["双束激光", 16, "rare", "同时锁定两个方向"],
      ["余辉灼烧", 18, "rare", "路径残留灼烧带"],
      ["折射棱镜", 22, "rare", "激光折射一次"],
      ["极光切割", 26, "epic", "激光扫过扇区"],
      ["白昼光矛", 32, "epic", "首次命中暴击"],
      ["轨道裁决", 40, "legendary", "升级后触发长激光"]
    ]
  },
  {
    category: "Beam",
    base: [
      ["Beam", 10, "common", "解锁宽幅能量束"],
      ["扩束核心", 12, "common", "能量束更宽"],
      ["蓄能线圈", 14, "common", "能量束持续更久"],
      ["扇区净化", 18, "rare", "覆盖扇区扩大"],
      ["脉冲二段", 22, "rare", "结束后追加脉冲"],
      ["冲击波前", 25, "rare", "推开未击毁敌人"],
      ["蓝核裂变", 30, "epic", "击毁敌人引发爆炸"],
      ["两极喷流", 36, "epic", "从地球两侧喷发"],
      ["终末光柱", 45, "legendary", "大扇区清理"]
    ]
  },
  {
    category: "弹道",
    base: [
      ["分裂弹", 8, "common", "命中后分裂"],
      ["追踪弹", 10, "common", "子弹轻微追踪"],
      ["回旋弹", 11, "common", "未命中后回旋"],
      ["冰蓝减速", 14, "rare", "命中降低敌速"],
      ["电弧跳跃", 18, "rare", "命中后跳向邻近目标"],
      ["重力弯曲", 20, "rare", "子弹向密集区弯曲"],
      ["星尘散射", 25, "epic", "额外生成散弹"],
      ["量子回弹", 30, "epic", "外圈反弹一次"],
      ["青焰洪流", 38, "legendary", "所有子弹提速"]
    ]
  },
  {
    category: "防御",
    base: [
      ["护盾发生器", 8, "common", "地球获得护盾"],
      ["装甲地壳", 10, "common", "最大生命提高"],
      ["近地拦截", 12, "common", "近地自动拦截"],
      ["护盾回流", 16, "rare", "击杀恢复护盾"],
      ["环形屏障", 20, "rare", "短暂旋转屏障"],
      ["应急修复", 22, "rare", "低生命回复一次"],
      ["反射护幕", 28, "epic", "破盾释放冲击波"],
      ["月影掩体", 34, "epic", "生成近月吸收点"],
      ["盖亚圣盾", 42, "legendary", "有盾时伤害提升"]
    ]
  },
  {
    category: "爆炸",
    base: [
      ["爆破弹头", 9, "common", "爆炸半径提高"],
      ["连锁火花", 12, "common", "爆炸点燃邻近目标"],
      ["白金闪爆", 14, "common", "爆炸更亮"],
      ["震荡核心", 18, "rare", "爆炸减速周围敌人"],
      ["破片云", 21, "rare", "爆炸后生成破片"],
      ["火环扩散", 24, "rare", "连续击杀形成火环"],
      ["超新星点火", 30, "epic", "定期触发大爆炸"],
      ["聚变余烬", 36, "epic", "爆炸残留灼烧粒子"],
      ["环带湮灭", 46, "legendary", "清除一段外圈"]
    ]
  },
  {
    category: "经济",
    base: [
      ["金属回收", 6, "common", "击杀收益提高"],
      ["战场赏金", 8, "common", "连杀额外金币"],
      ["低价采购", 10, "common", "普通卡降价"],
      ["稀有补贴", 14, "rare", "提高稀有出现率"],
      ["双倍残骸", 18, "rare", "爆炸击杀双倍收益"],
      ["黑市改装", 20, "rare", "刷新并降价"],
      ["投资协议", 24, "epic", "后续收益提高"],
      ["战争债券", 30, "epic", "升级后获得金币"],
      ["无限预算", 42, "legendary", "价格上限降低"]
    ]
  },
  {
    category: "地球",
    base: [
      ["地核脉冲", 8, "common", "地球周期脉冲"],
      ["自转加速", 10, "common", "防卫机巡航加快"],
      ["磁层增强", 13, "common", "靠近敌人减速"],
      ["城市灯火", 16, "rare", "低生命提高射速"],
      ["极光护环", 20, "rare", "护盾恢复造成伤害"],
      ["重力井", 24, "rare", "牵引敌人到火力区"],
      ["月轨牵引", 28, "epic", "改变敌人轨迹"],
      ["地平线炮", 35, "epic", "地球边缘弧形炮"],
      ["世界引擎", 48, "legendary", "核心炮变为旋转光束"]
    ]
  },
  {
    category: "近地卫星",
    base: [
      ["修复卫星", 9, "common", "周期恢复生命"],
      ["回收卫星", 10, "common", "额外金币"],
      ["标记卫星", 12, "common", "敌人承伤提高"],
      ["干扰卫星", 16, "rare", "降低附近敌速"],
      ["近轨炮台", 20, "rare", "额外自动炮台"],
      ["牵引卫星", 24, "rare", "拖动敌人"],
      ["卫星阵列", 30, "epic", "卫星数量翻倍"],
      ["轨道维修站", 36, "epic", "强力低频回复"],
      ["机械防卫环", 50, "legendary", "独立近地防御环"]
    ]
  },
  {
    category: "特殊",
    base: [
      ["时间减速", 15, "rare", "短时全局减速"],
      ["轨道调度", 18, "rare", "移除密集敌群"],
      ["轨道冻结", 22, "rare", "冻结一段外圈"],
      ["引力爆点", 26, "epic", "生成吸引点"],
      ["反物质雷", 32, "epic", "外圈陷阱"],
      ["反导重定向", 35, "epic", "改变敌人方向"],
      ["末日倒计时", 40, "legendary", "延迟大范围清理"],
      ["虚空切片", 46, "legendary", "删除一个扇区"],
      ["时间回卷", 55, "mythic", "死亡时回到 5 秒前"]
    ]
  },
  {
    category: "风险收益",
    base: [
      ["过载射击", 12, "rare", "射速提高但恢复变慢"],
      ["脆弱火力", 14, "rare", "伤害提高但生命降低"],
      ["贪婪协议", 16, "rare", "收益和敌速同时提高"],
      ["不稳定核心", 22, "epic", "周期爆发但受击更痛"],
      ["黑洞贷款", 25, "epic", "先拿钱后涨价"],
      ["极限护盾", 30, "epic", "厚盾破裂后短暂无防御"],
      ["超量起飞", 36, "legendary", "小飞机翻倍但单伤降低"],
      ["星核燃烧", 42, "legendary", "生命流失换强火力"],
      ["孤注一掷", 60, "mythic", "无伤 15 秒后全屏清理"]
    ]
  }
];

// Max levels per rarity — pattern borrowed from Vampire Survivors (weapons
// cap at 8) and Slay the Spire (cards upgrade once). Common upgrades stack
// the most; mythic effects are powerful enough to keep at 1 pick per run.
const RARITY_MAX_LEVEL = {
  common: 5,
  rare: 4,
  epic: 3,
  legendary: 2,
  mythic: 1,
};

export const upgrades = groups.flatMap((group, groupIndex) =>
  group.base.map(([name, price, rarity, effect], index) => ({
    id: String(groupIndex * 9 + index + 1).padStart(3, "0"),
    category: group.category,
    name,
    price,
    rarity,
    effect,
    stage: groupIndex < 3 ? 1 : groupIndex < 6 ? 2 : groupIndex < 9 ? 3 : 4,
    maxLevel: RARITY_MAX_LEVEL[rarity] || 3,
    // Special items that should never repeat regardless of rarity (one-shots
    // like time-rewind, infinite-budget — they're game-changers per pick)
    forceUnique: ["时间回卷", "无限预算", "孤注一掷"].includes(name),
  }))
);

export const firstChoices = upgrades.filter((u) => ["001", "010", "019"].includes(u.id));

export function unlockedPool(levelCount) {
  if (levelCount <= 0) return firstChoices;
  const stage = levelCount < 3 ? 1 : levelCount < 6 ? 2 : levelCount < 10 ? 3 : 4;
  return upgrades.filter((u) => u.stage <= stage);
}
