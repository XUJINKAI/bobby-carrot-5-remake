# UP9 Original Semantics 覆盖审计

本表审计 `original/reverse-engineering/semantic/` 是否已经承接从 UP9 `a.class` / `EN.dat` 恢复出的原版事实。它不是 BC5R 实现状态，也不要求现代 Engine 采用相同类结构。

标记：

- `✓`：已有独立 semantic 基准或统一 dispatcher 明确覆盖；
- `—`：该维度不适用；
- `△`：主干已恢复，只剩低价值 Presentation / 异常路径或命名边角。

| 机制 | Collision | Midpoint / Leave | Sustained Task | Camera / Input | Presentation | Campaign / Resource | Semantic 基准 | 剩余不确定性 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|---|---|
| Bobby 基础移动 | ✓ | ✓ | ✓ | ✓ | ✓ | — | `PlayerCollisionRules`, `PlayerMovement`, `PlayerMoveLifecycle`, `BobbyAnimationCadence` | 无核心缺口 |
| Speed | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ Help | `SpeedRuntime`, `PlayerMovement`, `BobbyAnimationCadence`, `DialogCatalog` | 无核心缺口 |
| Ice | ✓ | ✓ | ✓ | ✓ | ✓ | — | `IceSliding`, `BobbyAnimationCadence` | 无核心缺口 |
| Snow / Shovel | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ Help | `PlayerCollisionRules`, `ShovelRuntime`, `AmbientParticles`, `DialogCatalog` | 无核心缺口 |
| Mower / Gas / Parking | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ Music/Help | `MowerRuntime`, `PlayerCollisionRules`, `MusicCatalog`, `DialogCatalog` | 无核心缺口 |
| Carousel | ✓ | ✓ | — | — | ✓ | ✓ Help | `CarouselPassage`, `MidpointInteractionDispatcher`, `DialogCatalog` | 无核心缺口 |
| Mirror | ✓ | ✓ | — | — | ✓ | ✓ Help | `MidpointInteractionDispatcher`, `DragonFireball`, `DialogCatalog` | 无核心缺口 |
| Trap | ✓ | ✓ | — | — | ✓ | ✓ Help | `TrapRuntime`, `DeathPipeline`, `DialogCatalog` | 无核心缺口 |
| Color Switch / Block | ✓ | ✓ | — | — | ✓ | ✓ Help | `ColorSwitch`, `PlayerCollisionRules`, `DialogCatalog` | 无核心缺口 |
| Directional Switches | ✓ | ✓ | — | ✓ | ✓ | ✓ Help | `DirectionalSwitches`, `CloudWind`, `CameraFocusInputLock`, `DialogCatalog` | 原版 triggerable raw 已确认；现有 Adapter 的 Pressed/Raised 命名差异已记录 |
| Leaf | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ Help | `LeafWater`, `MovingEntities`, `DialogCatalog` | 无核心缺口 |
| Cloud / Windmill | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ Help | `CloudPassage`, `CloudWind`, `MovingEntities`, `CameraFocusInputLock`, `DialogCatalog` | 无核心缺口 |
| Bean / Beanfield | ✓ | ✓ | ✓ | — | ✓ | ✓ Help | `BeanGrowth`, `MidpointInteractionDispatcher`, `PlayerCollisionRules`, `DialogCatalog` | 无核心缺口 |
| Plank | ✓ | ✓ | ✓ | — | ✓ | ✓ Help | `PlankDecay`, `MidpointInteractionDispatcher`, `DialogCatalog` | 无核心缺口 |
| Dragon / Fireball | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ Help | `DragonAttack`, `DragonFireball`, `CameraFocusInputLock`, `DialogCatalog` | E8/E9 可进入已确认是原版 quirk |
| Ice Block melting | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ Help | `IceMelting`, `DragonFireball` | 无核心缺口 |
| Kite / Whirlwind / Landing | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ Help | `KiteFlight`, `PlayerCollisionRules`, `DialogCatalog` | 原版无地图边缘自动 Landing 已确认 |
| Carrot / Egg / Exit | ✓ | ✓ | — | — | ✓ | ✓ Help | `LevelObjectives`, `MidpointInteractionDispatcher`, `DialogCatalog` | 无核心缺口 |
| Timed Bonus / Lock | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `LockRuntime`, `TimedBonusChallenge`, `DeathPipeline`, `CampaignProgression`, `DialogCatalog`, `SceneCatalog`, `MusicCatalog` | 无核心缺口 |
| Golden Carrot | ✓ | ✓ | — | — | ✓ | ✓ | `GoldenCarrotCampaign`, `DialogCatalog`, `SceneCatalog` | 无核心缺口 |
| Bonus Coin | ✓ | ✓ | — | — | ✓ | ✓ | `BonusCoinPresentation`, `MidpointInteractionDispatcher`, `DialogCatalog` | 无核心缺口 |
| Coin Radar | — | — | ✓ | — | ✓ | ✓ | `CoinRadar`, `ShopUpgrades`, `DialogCatalog` | 无核心缺口 |
| Speed Shoes | — | — | ✓ | — | ✓ | ✓ | `ShopUpgrades`, `BobbyAnimationCadence`, `DialogCatalog` | 无核心缺口 |
| Super Key | ✓ | ✓ | — | — | ✓ | ✓ | `LockRuntime`, `ShopUpgrades`, `DialogCatalog` | 无核心缺口 |
| Beaver Shop / Tickets | — | ✓ | — | — | ✓ | ✓ | `ShopUpgrades`, `CharacterInteractions`, `NightTrain`, `DialogCatalog`, `SceneCatalog` | 无核心缺口 |
| Sound Test / Extra Music | — | — | — | — | ✓ | ✓ | `SoundTest`, `ShopUpgrades`, `MusicCatalog`, `DialogCatalog` | 无核心缺口 |
| Cloud 9 / Magic Code | — | ✓ | ✓ | — | ✓ | ✓ | `CharacterInteractions`, `CampaignRewardScenes`, `DialogCatalog`, `SceneCatalog`, `MusicCatalog` | 无核心缺口 |
| Dream Machine scene/body | ✓ | ✓ | — | — | ✓ | ✓ | `CharacterInteractions`, `RuntimeStateMachine`, `DialogCatalog`, `SceneCatalog` | UP9 Body 直接进入“不支持 level download”提示已确认 |
| Flight reward | — | — | ✓ | — | ✓ | ✓ | `CampaignRewardScenes`, `DialogCatalog`, `SceneCatalog`, `MusicCatalog` | 无核心缺口 |
| Night Train | — | — | ✓ | ✓ | ✓ | ✓ | `NightTrain`, `DialogCatalog`, `SceneCatalog`, `MusicCatalog` | 无核心缺口 |
| Normal level result | — | — | ✓ | — | ✓ | ✓ | `LevelObjectives`, `DialogCatalog`, `MusicCatalog` | 无核心缺口 |
| Death / Bonus timeout | — | — | ✓ | ✓ | ✓ | ✓ | `DeathPipeline`, `TimedBonusChallenge`, `DialogCatalog`, `MusicCatalog` | 无核心缺口 |
| Snow particles | — | — | — | — | ✓ | — | `AmbientParticles` | 无核心缺口 |
| Butterfly | — | — | — | — | ✓ | — | `AmbientParticles` | 无核心缺口 |
| Star shimmer | — | — | — | — | ✓ | — | `StarShimmer` | gameplay 仅更新 3/5 slot；其它 scene 是否复用 5 slot 属低价值边角 |
| Gameplay render order | — | — | — | — | ✓ | — | `GameplayRenderOrder` | 无核心缺口 |
| Level DAT runtime loader | ✓ | — | — | — | — | ✓ provenance | `LevelLoader`, `CampaignProgression`, `SceneCatalog` | 无核心缺口 |
| Top-level runtime states | — | — | ✓ | ✓ | ✓ | ✓ | `RuntimeStateMachine`, `SceneCatalog`, `DialogCatalog`, `MusicCatalog` | 少量纯 UI transition 的名字不影响 gameplay / resource semantics |
| Full EN.dat language resource | — | — | — | — | ✓ | ✓ | `DialogCatalog`, `notes/up09-language-catalog.md` | 123/123 字符串已机械提取；变量索引使用由上下文补充 |
| Full MIDI resource binding | — | — | — | — | ✓ | ✓ | `MusicCatalog`, `notes/up09-music-index.md` | 普通关确认不存在 per-level fixed BGM；由 Ingame Music runtime selection 决定 |

## Mechanic Help 交叉证据

`EN.dat` 的 `a[60]..a[80]` 是原版官方 Help，已经与 bytecode semantic 逐项交叉核对，见：

- `notes/up09-help-mechanic-crosscheck.md`

没有发现 Help 与 UP9 class 核心规则之间的本质冲突。Help 负责玩家层语义，bytecode 补足 exact timing、raw ID、global toggle、midpoint / leave settlement 与异常路径。

## Resource 结论

### 对话

UP9 `EN.dat` 一共 123 条字符串，现已全部机械提取到：

- `notes/up09-language-catalog.md`

`DialogCatalog.java` 把 UI、Help、Shop、Campaign、Bonus、Night Train、Golden Carrot 等事件映射回 string id。

### 音乐

JAR 中 14 个 MIDI 资源及所有直接引用已索引到：

- `notes/up09-music-index.md`
- `semantic/MusicCatalog.java`

最重要的结论：**普通 release 关没有 level -> fixed BGM 映射。** 原版使用持久 `H` Ingame Music selection；`AUTO(H=-1)` 时从已解锁 `ingame0..D[4]` 中随机。Mower、Timed Bonus、shared scene、result、death 等由 runtime mode 覆盖。

## 当前剩余逆向范围

核心地图 gameplay 与 UP9 资源语义已经基本闭环。剩余工作主要是：

1. 清理/校正旧 `docs/system/original/*` 中仍与 bytecode 不一致的早期观察描述（例如 Ice sprite frame、Wind camera 固定“3 秒”等）；
2. 把少量纯 Presentation / UI transition 细节补到 semantic，而不是继续发明新机制；
3. 对现有 `fidelity-discrepancies.md` 做最终汇总，明确后续 Engine PR 应该改什么，但**本逆向 PR 不改产品代码**。

Base / UP01 只保留 `notes/legacy-runtime.md` 的代际摘要；UP02～UP09 已通过 structural fingerprint 证明核心 runtime 同构，semantic 继续以 UP09 为唯一主基准。
