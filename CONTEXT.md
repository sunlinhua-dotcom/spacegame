# 项目上下文

## 项目目标
- 根据视频素材还原一个同款游戏，先产出可审批 PRD，审批后进入开发。

## 当前素材
- `export_1777612708096.MOV`：当前唯一已发现的视频素材。

## 架构与目录
- 当前尚无应用代码。
- PRD 与后续设计文档放入 `docs/` 目录。
- 已创建 PRD：`docs/space-defense-game-prd.md`。
- 已创建资产预生产计划：`docs/asset-preproduction-plan.md`。

## 关键运行命令
- `npm run dev`：在 4647 启动本地预览。
- `npm run check`：检查前端 JS 语法。
- `scripts/generate_musicgen.py`：尝试用本地 MusicGen 生成背景音乐。

## 关键约束
- 对外沟通与应用默认文案使用简体中文。
- 本地 Web 项目端口遵循 46xx 命名空间。
- 任何分析、修改、验证结果需同步记录到 `LOG.md`。

## 当前阶段状态
- 已进入可预览阶段，当前可通过 `http://127.0.0.1:4647/` 预览地球防御战游戏。
- 最新方向以用户纠偏为准：地球防御战，地球派出小飞机拦截外星攻击，禁止偏向外部舰队/主飞机。
- 已移除自动演示模式入口与逻辑；升级选择必须由用户手动点击。
- 已接入逐张单独生成的内置生图素材包：中心地球、地球小飞机、外星飞碟、外星弹体、玩家子弹、敌方能量弹、爆炸和升级类别图标均已独立落盘并清理为透明 PNG。
- 已追加重新生成 4 张俯视角小飞机和 1 张俯视 Gun 小队图标，当前运行时只采用俯视角飞机素材。
- 开局提供 3 架基础近地防卫机，首次 Level Up 后用户选择 `Gun` 会继续扩编。
- 当前主运行入口已切换为 `src/game-three.js`：Three.js 渲染战斗层，HTML/CSS 渲染文字 UI 与 Level Up 卡片。
- 当前关键战斗元素从 `assets/generated/individual/final/` 加载，不再依赖旧大图集裁切。
- 画面已加入接近原视频的金橙色外圈弹幕层，中心地球缩小并上移，强化“中心地球被环形攻击包围”的构图。
- UI 已增加清晰的升级进度条；音频已改为新的 Web Audio 深空氛围和短促战斗音效，不再优先加载旧 wav 背景音乐。
- 旧 `src/game.js` 暂时保留为上一版 Canvas 参考，不再由页面加载。
- 价格 UI 已从美元符号改为人民币符号 `¥`。
- 本项目已同步到桌面 `PROJECT` dashboard，登记端口为 `4647`，不再使用 `4601`。
- 外圈弹幕已从 `PointsMaterial + LineSegments` 改为透明弹体 Sprite，避免方块头和细线残留。
- 敌人已从单张静态贴图漂移改为 Three.js 动态组合体：飞碟使用旋转能量环和核心光效，陨石/能量弹使用脉冲尾焰、光晕和旋转。
- 当前音效不再使用自生成采样作为运行时资源，已接入 Kenney Sci-fi Sounds CC0 音效包。
- 背景音乐已通过本地 `facebook/musicgen-small`/Transformers 环境生成到 `assets/audio/musicgen-earth-defense.wav`，运行时循环播放该 MusicGen 输出。
- 已新增“战术商店”：战斗中可用当前资金直接购买已解锁升级，不需要等待普通 Level Up；购买会立即扣钱、应用升级并触发对应表现，但不推进普通 Level Up 进度。
- 关卡结构已改为 10 关，每关 20 波；第 20 波生成同地球体量接近的大 Boss。Boss 配置、血量、奖励与序列帧资源由 `src/game-three.js` 和 `assets/generated/bosses/manifest.json` 管理。
- 角色资产新增目录：`assets/generated/characters/`。玩家小飞机和小型敌人均已逐张生成、透明化并接入当前 Three.js 运行时。
- 升级特效资产新增目录：`assets/generated/upgrades/`。升级卡背景 VFX 使用 4x2 等分图切割后的透明 PNG，不再把模型生成的文字区域接入游戏。
- 当前升级机制：普通 Level Up 选项会随升级次数从 3 张扩到最多 5 张；Boss 击杀后进入 Boss 核心升级选择，作为后期玩法节奏补强。
- 武器升级音效已切换为 OpenGameArt `Power-Up Sound Effects` CC0 素材的短版 wav，UI 选择/确认音效改用 Kenney `Interface Sounds` CC0 包。
- 地球显示已从静态 Sprite 改成动态 CanvasTexture：生图地球仍作为底图，但云带和大陆高光会在球体内部横向移动，形成自转感。
- 主战画面已按 `export_1777612708096.MOV` 的密度重做：弹幕 380 条、起手 6 架防御机紧贴地球、内圈持续 intercept-flash、相机 screen-shake；构图与视频参考一致。
- 已新增 Mini Boss 系统：每 4 波出一个，复用现有敌人资源放大并染色，三种 kind 各有专属技能、HP、入场震屏与死亡大爆炸。
- 全部 99 张升级卡都接入了 `upgradeShowcasesByName` 字典，每张卡都有专属战场动画/音效/震屏，传奇/神话卡能直接清场或回血；后续如新增升级卡只要在该字典追加 `name → fn` 即可。
- 敌人共 4 层：swarm（金色火焰条，主流密度 130-240，HP 1）/ 小怪（saucer/meteor/bolt 标准尺寸，spawnEnemies 控制）/ Mini Boss（同 sprite 1.7x 放大，每 4 波生成，HP 24-100，三种专属技能）/ Big Boss（boss-1 ~ boss-10，每关末波）。前 3 层都用 `state.enemies` 数组管理，通过 `isSwarm / isMiniBoss / isBoss` 标记走不同分支。
- UI 已全面重做：HUD 拆双卡片（含新增"击杀"统计）、3 个 overlay（Pause/GameOver/Victory）、Mini Boss 屏幕名牌、icon+label 底部按钮、cardReveal 升级卡入场动画、4 档稀有度配色、玻璃质感 backdrop-filter。`index.html` 与 `src/styles.css` 整体重写，`src/game-three.js` 接入新 UI 元素与 syncOverlays。
- 已停止使用用户提供的外部图片 API 配置；玩法增强素材改为本地程序化生成：`scripts/generate_procedural_polish_atlas.py` 生成 4x4 图集，`scripts/process_polish_atlas.py` 切割为 `assets/generated/polish/final/` 下 16 个透明 PNG，并生成 `output/asset-review/gameplay-polish-atlas-contact.png` 供目检。
- 本地程序化玩法增强素材已接入运行时：Boss 弱点核心可见且命中有额外伤害，Boss 狂暴/预警/冲锋轨道有 Sprite 反馈；商店刷新/购买/锁卡有对应素材；HUD 显示关卡主题徽记；部分升级卡直接使用冻结弹、轨道炮、修复云、护盾超载、资金缓存、舰队信标等新图标。
- iPhone 完整适配已落地：100dvh、env(safe-area-inset-*) 三方向、3 档 media query (≤460 / ≤390 / ≤360)、ctrl-btn 52px 触摸目标、@supports (-webkit-touch-callout) iOS 专属调优、touch-action manipulation 防双击缩放。
- 默认开启音效：state.soundOn=true、首次 .stage pointerdown 自动 unlock AudioContext、soundBtn 显示"🔊 音效"。
- 背景音乐已切换为 5 首 OpenGameArt CC0 techno/EDM（Armin 商业版权无法下载，用 CC0 替代）：`assets/audio/cc0-techno/{tech-rave.wav, techno-5.mp3, bright-edm.ogg, melodic-edm.ogg, space-flight.mp3}` + LICENSE.txt；每次开局随机轮播一首。旧 musicgen-earth-defense.wav 文件保留但不再被引用。
- 顶 HUD 已重做为单行 pill 形状的 hud-bar（5 项彩色 icon stats + 关卡主题徽记）+ 4px 进度条 + 单行 ellipsis 状态文字，整体高度从 ~140px 缩到 ~70px。
- 7 项 UI polish 已落地：数字滚动动画（setRollingNumber easeOutCubic）、Mini Boss HP 血条、击杀飘字 +¥N（floaters DOM 池）、Boss 入场全屏 banner（showBossBanner）、商店统一 panel-shell 风格、dev server bind 0.0.0.0（局域网手机可扫）、桌面宽屏 ≥1024 ambient halo。
- Three.js 地球已升级到全球最优解：NASA Blue Marble + Sangil Lee 多 sampler shader（day/night sigmoid 混合 + 海洋 spec 反光 + 城市夜光），云层独立 sphere 用 cloudtrans 作为 alpha + 夜侧暗化，Franky Hung pattern 的薄蓝大气 fresnel shell。贴图来自 `bobbyroe/threejs-earth`（MIT，原始 NASA 公共领域），存于 `assets/textures/earth/`。
- OrthographicCamera near 已从 0.1 改为 -200，让 SphereGeometry 不被前裁剪面 clip。
- 星空已重做：3 层视差（620 远 + 220 中 + 70 近 twinkle ShaderMaterial）+ 7 个 nebula sprites 营造深度。
- 星空已综合 bobbyroe / Three.js Journey / sneha-belkhale 方案重写：3 层视差 + 每星独立 HSL 颜色 + circle.png 圆贴图 + ShaderMaterial twinkle + 7 nebula + 流星系统（每 3.5-8s 一颗划过）。
- 升级卡 leveling 已上线：upgrades.RARITY_MAX_LEVEL（common5/rare4/epic3/legendary2/mythic1）+ forceUnique；state.upgradeLevels 跟踪每卡当前等级；卡面显示 Lv N/M + 黄色 pips（filled/next pulse/empty）；drawUpgradeOptions 过滤 maxed。
- 10 个 BOSS 大招已上线：每个 boss slug 映射到独立 ult kind，使用 boss.color；HP 跌到 70/40/15% 三阈值各放一次（boss.bossUltsFired 计数）；showBossBanner 同时显示"BOSS 大招 · 招式名"。
- 已新增游戏开始界面 titlePanel（首次加载停在 mode="title"，点 "开始游戏" 进入 playing）。包含大渐变标题、tagline、5 行 Bright.Sun credits（创意/美术/技术/音乐/音效）、开始按钮。重启游戏不再回 title 直接进战。
