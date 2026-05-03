# 视觉资产预生产计划

## 1. 目标

在开发游戏代码前，先使用内置生图引擎创建完整视觉资产包。首版不允许用空白占位图进入开发验收；所有主视觉、升级卡图、单位图、UI 图和画面参考都要提前落盘到项目工作区。

## 2. 输出目录

| 目录 | 用途 |
|---|---|
| `assets/generated/backgrounds/` | 竖屏深空背景、星云层 |
| `assets/generated/planets/` | 星球核心、护盾、受击、濒危状态 |
| `assets/generated/earth-defense/` | 地球派出的小飞机、近地卫星、近轨炮台 |
| `assets/generated/enemies/` | 金橙外星飞行物、陨石、导弹、特殊敌方单位 |
| `assets/generated/weapons/` | Gun/Laser/Beam 及特殊武器主视觉 |
| `assets/generated/upgrades/` | 99+ 升级卡图和图标 |
| `assets/generated/ui/` | Level Up 面板、卡框、指针、按钮、稀有度边框 |
| `assets/generated/vfx-reference/` | 爆炸、火环、护盾、黑洞、光束参考图 |
| `assets/generated/screens/` | 完整画面参考图 |
| `assets/generated/manifest.json` | 资产索引、来源提示词、用途、尺寸和版本 |

## 3. 必须生成的批次

| 批次 | 数量 | 说明 |
|---|---:|---|
| 背景 | 6 | 深空、星云、暗色纵深，竖屏 9:16 |
| 星球 | 8 | 正常、护盾、受击、濒危、强光、夜侧城市光等 |
| 地球防卫单位 | 27 | 小飞机 9、近地卫星 12、地表/近轨武器 6 |
| 敌方单位 | 12 | 金橙外星飞行物、陨石、导弹、强化敌方单位 |
| 武器主视觉 | 18 | Gun/Laser/Beam 及弹道、光束、特殊技能 |
| UI | 20 | 卡框、稀有度边框、Level Up 标题、指针、按钮 |
| 升级卡图 | 99 | 每个基础升级词条至少 1 张 |
| VFX 参考 | 20 | 爆炸、火环、黑洞、护盾、冲击波、能量束 |
| 完整画面参考 | 8 | 开局、首次升级、Gun 1/2/3 级、Laser、Beam、后期弹幕、失败/通关 |

最低总量：218 张或图层资产。若部分 UI 资产做成 sprite sheet，可以减少文件数，但 manifest 中仍需逐项登记。

## 4. 统一提示词原则

所有提示词必须保留以下约束：

- 竖屏地球防御战，高对比科幻风格。
- 中心地球、地球派出小飞机、金橙外星攻击、青蓝地球防卫火力、白金爆炸。
- 禁止生成脱离地球主题的大型外部主飞机、宇宙母舰或玩家外部旗舰。
- 不包含水印、平台标识、真实品牌、人物、无关文字。
- 升级卡图主体居中，边距一致，适合 3 张卡并排展示。
- 单位资产使用可抠图纯色背景或干净透明背景策略。
- 同一批次使用一致镜头角度、光照方向和材质语言。

## 5. 示例提示词模板

### 5.1 升级卡图

```text
Create a high-contrast sci-fi upgrade card illustration for a vertical Earth defense mobile game.
Subject: {upgrade_name}, {upgrade_effect_short_description}.
Style: dark teal and black card mood, cyan rim light, Earth defense technology, small Earth-launched interceptors, near-orbit satellites, golden-orange alien threat contrast, premium game art.
Composition: centered subject, strong silhouette, no text, no logo, no watermark, consistent 3-card selection layout, generous padding.
Output use: upgrade card art, portrait-friendly, crisp at small size.
```

### 5.2 单位资产

```text
Create a sci-fi Earth defense game unit asset on a perfectly flat chroma-key background for background removal.
Subject: {unit_name}, small Earth-launched defense aircraft or near-orbit satellite, silver-gray metal, cyan energy highlights, top-down three-quarter view.
Constraints: no text, no watermark, clean outline, readable at small size, no cast shadow, no background texture.
Do not create a large standalone hero spaceship, mothership, or external main plane.
```

### 5.3 完整画面参考

```text
Create a vertical 9:16 mobile game battle screen reference.
Scene: central Earth-like planet under siege, dense golden-orange alien projectiles forming a circular ring, small defense aircraft emerging from Earth and near orbit firing outward, white-gold explosions on the ring.
Mood: intense, premium sci-fi arcade defense, high contrast, clear center planet, no platform watermark, no extra text.
```

## 6. Manifest 字段

每个资产必须登记：

| 字段 | 说明 |
|---|---|
| `id` | 稳定资产 ID |
| `name` | 中文名称 |
| `type` | background/planet/ship/enemy/weapon/upgrade/ui/vfx/screen |
| `rarity` | none/common/rare/epic/legendary/mythic |
| `upgrade_id` | 如果绑定升级词条，填写 001-099 |
| `file` | 工作区内相对路径 |
| `source_prompt` | 最终生图提示词 |
| `intended_use` | 游戏内用途 |
| `version` | 资产版本 |

## 7. 开发前验收

- `assets/generated/manifest.json` 存在且能被程序读取。
- 99 个升级词条均有关联卡图或图标。
- 8 张完整画面参考图覆盖核心画面状态。
- 所有主视觉资产均保存在工作区内。
- 不存在只引用默认生成目录、临时目录或视频截图的资产。
