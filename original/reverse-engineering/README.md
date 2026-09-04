# 原版 Runtime 逆向工作区

本目录用于从 `original/official-hd/` 中只读的官方 JAR 建立可审查、可追溯的原版运行逻辑研究基准。

## 目录

- `decompiled/up09/`：CFR 0.152 对稳定代 `up09.jar` 的直接反编译结果。UP02～UP09 的核心 Runtime 已由 structural bytecode fingerprint 确认一致，因此该目录作为 UP02～UP09 的主反编译基准。
- `decompiled/up01/`：UP01 legacy generation 的机械反编译基准，只保留大致代际差异。
- `decompiled/base/`：Base 1.0.3 legacy generation 的机械反编译基准，只保留大致代际差异。
- `bytecode/`：`javap` 字节码基准与关键方法切片；反编译器无法可靠结构化时回退到这里。
- `semantic/`：逐步整理、重命名和拆解后的语义化研究代码。该层必须能够追溯到 `decompiled/` / `bytecode/` 中的原始类、字段和方法。
- `notes/`：逆向索引、命名映射、版本指纹、资源索引、证据和未确认项。

## UP09 主入口

- `COVERAGE.md`：UP09 runtime semantics 最终收口计数、完成定义与非 gameplay 边界。

后续 BC5R fidelity 实现优先从以下文件进入，不需要重新阅读 8500 行混淆源码：

### 机制

- `notes/runtime-entity-matrix.md`：raw terrain/object byte → 原版 runtime 行为总表。
- `notes/up09-help-mechanic-crosscheck.md`：`EN.dat` 官方 Help 与 bytecode 逐机制交叉验证。
- `notes/semantic-coverage.md`：机制 × collision / midpoint / task / camera / presentation / campaign 覆盖审计。
- `semantic/GameplayStepOrder.java`、`RuntimeActionCatalog.java`：每拍子系统顺序、early return、长期动作输入/Camera/并发边界。
- `semantic/PlayerMoveLifecycle.java`：最关键的玩家移动时序；grid 先变、midpoint interaction、visual arrival 收尾。
- `semantic/PlayerCollisionRules.java`：terrain-first / object-override 的统一碰撞模型。
- `semantic/MidpointInteractionDispatcher.java`：原版 `J()` previous-leave + current midpoint interaction 顺序。
- 其它单机制文件：`SpeedRuntime`、`IceSliding`、`MovingEntities`、`LeafWater`、`CloudWind`、`Dragon*`、`MowerRuntime`、`BeanGrowth` 等。

### 音乐

- `semantic/MusicCatalog.java`：完整 soundtrack resolver、scene override、Mower/Bonus 切曲、loop/one-shot 行为。
- `notes/up09-music-index.md`：JAR 中全部 MIDI 与直接源码引用。

关键结论：**普通 release 关没有 per-level fixed BGM 表**。原版使用持久 `H` Ingame Music selection；`AUTO(H=-1)` 时从已解锁 `ingame0..D[4]` 中随机。Mower、Timed Bonus、shared scene、result、death 等由 runtime state 覆盖。

### 文字 / 对话

- `notes/up09-language-catalog.md`：EN.dat 全部 123 条原文与直接使用位置。
- `semantic/DialogCatalog.java`：0..122 的事件语义 ID。
- `notes/up09-text-audit.md`：六个 locale 与 class hardcoded strings 审计。
- `semantic/HardcodedTextCatalog.java`：EN.dat 之外真正由 class 直接显示的文字。

六份原版语言资源 `EN/DE/FR/IT/SP/PG.dat` 已确认完全同构，均为 123 个 ID；semantic 以 EN 名称命名，但可用同 ID 索引其它五种翻译。

### Scene / Campaign

- `semantic/SceneCatalog.java`：archive/record → shared scene / normal level / timed bonus、标题、主对话、音乐。
- `semantic/CampaignProgression.java`：release record progression 与 11/12 Bonus slot。
- `semantic/PersistentSaveFormat.java`：`BC5Data` 单 record 的完整二进制字段顺序、默认值与持久/临时边界。
- `semantic/NightTrain.java`：Dream Machine / Cloud 9 ticket 与 destination。
- `semantic/GoldenCarrotCampaign.java`、`CampaignRewardScenes.java`：Golden Carrot、Magic Code、Flight reward。

特别注意：`bV/bU` 首先是 **DAT archive number / record slot**，不是现代 Campaign chapter ID。UP9 的 `ci={5,6,7,8}` 只是把 archive 1..4 显示为 release 5..8。

### Presentation / Timing

- `semantic/TileAnimationClock.java`：Water / Speed / Tide / Fall / Windmill / Whirlwind / Exit / Bonus Coin 的全局共享 animation phase。
- `semantic/StarShimmer.java`、`SpecialSceneStarfield.java`：gameplay 3-slot 星空闪耀与 Title/Magic Code/Flight 5-slot 滚动星场。
- `semantic/GameplayRenderOrder.java`：原版 gameplay layer 顺序。
- `semantic/BobbyAnimationCadence.java`：Bobby walk / idle / death / transition 节奏。
- `semantic/GameplayHud.java`、`CameraShake.java`、`OverviewMode.java`、`MissingItemHint.java`：HUD、相机与提示行为。

原版 outer loop 约 62ms，但每轮调用两次 runtime advance；一个 gameplay step 稳态约 **31ms / 32Hz**。不要把旧文档中的 16Hz 当成原版 World tick。

### 当前实现差异

- `notes/fidelity-discrepancies.md`：只记录已由 class 与当前仓库交叉确认的差异；本逆向分支不修改 Engine / Adapter。

目前明确包括 Speed 状态机、Ice 生命周期、Tide raw direction、Carousel/Tide Switch 命名，以及原版 gameplay-step 与当前默认 World 16Hz 的时基关系。

## Runtime generation 边界

方法级 structural fingerprint 已确认：UP02～UP09 的主循环、玩家移动、碰撞、midpoint、Cloud/Leaf、Dragon、Ice、Bean 与 Loader 等已追踪核心方法语义结构一致。Base 与 UP01 属于更早 runtime generation，但不是当前主线，见 `notes/legacy-runtime.md`。

## 证据优先级

1. `a.class` 控制流 / `javap` bytecode：精确执行事实；
2. `EN.dat` Help / UI 文本：原版作者面向玩家的语义；
3. 官方地图最小复现与原版运行实测：确认 presentation / 异常边角；
4. 旧观察文档：只作为寻找问题的线索。

## 原则

1. `original/official-hd/` 永远只读。
2. `decompiled/` 只保存机械反编译结果，不手工美化或改名。
3. `semantic/` 才进行语义命名、职责拆分和控制流整理。
4. 每个语义结论记录原始 class / method / field 依据，并区分“已由字节码确认”“由运行实测确认”“推断”。
5. 本目录来自原版第三方程序的逆向研究产物，不属于项目自身 `LICENSE` 的原创授权范围；权利边界见根目录 `THIRD_PARTY_ASSETS.md`。
