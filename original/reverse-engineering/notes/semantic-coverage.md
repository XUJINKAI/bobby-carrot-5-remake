# UP9 Original Semantics 覆盖审计

本表审计 `original/reverse-engineering/semantic/` 是否已经承接从 `a.class` 恢复出的原版事实。它不是 BC5R 实现状态，也不要求现代 Engine 采用相同类结构。

标记：

- `✓`：已有独立 semantic 基准或统一 dispatcher 明确覆盖；
- `—`：该维度不适用；
- `△`：主干已恢复，但仍有原版人类语义或低价值边角待命名。

| 机制 | Collision | Midpoint / Leave | Sustained Task | Camera / Input | Presentation | Campaign | Semantic 基准 | 剩余不确定性 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|---|---|
| Bobby 基础移动 | ✓ | ✓ | ✓ | ✓ | ✓ | — | `PlayerCollisionRules`, `PlayerMovement`, `PlayerMoveLifecycle`, `BobbyAnimationCadence` | 无核心缺口 |
| Speed | ✓ | ✓ | ✓ | ✓ | ✓ | — | `SpeedRuntime`, `PlayerMovement`, `BobbyAnimationCadence` | 无核心缺口 |
| Ice | ✓ | ✓ | ✓ | ✓ | ✓ | — | `IceSliding`, `BobbyAnimationCadence` | 无核心缺口 |
| Snow / Shovel | ✓ | ✓ | ✓ | ✓ | ✓ | — | `PlayerCollisionRules`, `ShovelRuntime`, `AmbientParticles` | 无核心缺口 |
| Mower / Gas / Parking | ✓ | ✓ | ✓ | ✓ | ✓ | — | `MowerRuntime`, `PlayerCollisionRules` | 无核心缺口 |
| Carousel | ✓ | ✓ | — | — | ✓ | — | `CarouselPassage`, `MidpointInteractionDispatcher` | 无核心缺口 |
| Mirror | ✓ | ✓ | — | — | ✓ | — | `MidpointInteractionDispatcher`, `DragonFireball` | 无核心缺口 |
| Trap | ✓ | ✓ | — | — | ✓ | — | `TrapRuntime`, `DeathPipeline` | 无核心缺口 |
| Color Switch / Block | ✓ | ✓ | — | — | ✓ | — | `ColorSwitch`, `PlayerCollisionRules` | 无核心缺口 |
| Directional Switches | ✓ | ✓ | — | ✓ | ✓ | — | `DirectionalSwitches`, `CloudWind`, `CameraFocusInputLock` | Pressed/Raised 人类命名仍有现有项目 fidelity discrepancy，但原版 triggerable raw 已确认 |
| Leaf | ✓ | ✓ | ✓ | ✓ | ✓ | — | `LeafWater`, `MovingEntities` | 无核心缺口 |
| Cloud / Windmill | ✓ | ✓ | ✓ | ✓ | ✓ | — | `CloudPassage`, `CloudWind`, `MovingEntities`, `CameraFocusInputLock` | 无核心缺口 |
| Bean / Beanfield | ✓ | ✓ | ✓ | — | ✓ | — | `BeanGrowth`, `MidpointInteractionDispatcher`, `PlayerCollisionRules` | 无核心缺口 |
| Plank | ✓ | ✓ | ✓ | — | ✓ | — | `PlankDecay`, `MidpointInteractionDispatcher` | 无核心缺口 |
| Dragon / Fireball | ✓ | ✓ | ✓ | ✓ | ✓ | — | `DragonAttack`, `DragonFireball`, `CameraFocusInputLock` | E8/E9 可进入已确认是原版 quirk |
| Ice Block melting | ✓ | ✓ | ✓ | ✓ | ✓ | — | `IceMelting`, `DragonFireball` | 无核心缺口 |
| Kite / Whirlwind / Landing | ✓ | ✓ | ✓ | ✓ | ✓ | — | `KiteFlight`, `PlayerCollisionRules` | 原版无地图边缘自动 Landing 已确认 |
| Carrot / Egg / Exit | ✓ | ✓ | — | — | ✓ | — | `LevelObjectives`, `MidpointInteractionDispatcher` | 无核心缺口 |
| Timed Bonus / Lock | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `LockRuntime`, `TimedBonusChallenge`, `DeathPipeline`, `CampaignProgression` | Campaign mode 人类名称仍待补 |
| Bonus Coin | ✓ | ✓ | — | — | ✓ | ✓ | `BonusCoinPresentation`, `MidpointInteractionDispatcher` | 无核心缺口 |
| Coin Radar | — | — | ✓ | — | ✓ | ✓ | `CoinRadar`, `ShopUpgrades` | 无核心缺口 |
| Speed Shoes | — | — | ✓ | — | ✓ | ✓ | `ShopUpgrades`, `BobbyAnimationCadence` | 无核心缺口 |
| Super Key | ✓ | ✓ | — | — | ✓ | ✓ | `LockRuntime`, `ShopUpgrades` | 无核心缺口 |
| Sound Test | — | — | — | — | ✓ | ✓ | `SoundTest`, `ShopUpgrades` | 无核心缺口 |
| Dream Machine / Cloud 9 Shop unlock | — | — | — | — | △ | △ | `ShopUpgrades` | 只确认 mode-4 条目显示；尚未找到可证明的后续 action/scene jump |
| Sandman / Beaver Body interaction | ✓ | ✓ | — | — | ✓ | △ | `CharacterInteractions`, `CampaignProgression` | `bU` mode 的正式人类名称/文案仍待恢复 |
| Dream Machine Body interaction | ✓ | ✓ | — | — | ✓ | △ | `CharacterInteractions`, `RuntimeStateMachine` | runtime state 16 主干已定位，具体对话/结果仍可继续命名 |
| Dream Code reward | — | — | ✓ | — | ✓ | ✓ | `CampaignRewardScenes` | 无核心缺口 |
| Flight reward | — | — | ✓ | — | ✓ | ✓ | `CampaignRewardScenes` | 无核心缺口 |
| Snow particles | — | — | — | — | ✓ | — | `AmbientParticles` | 无核心缺口 |
| Butterfly | — | — | — | — | ✓ | — | `AmbientParticles` | 无核心缺口 |
| Star shimmer | — | — | — | — | ✓ | — | `StarShimmer` | gameplay 仅更新 3/5 slot；其它 scene 是否复用 5 slot 属低价值边角 |
| Gameplay render order | — | — | — | — | ✓ | — | `GameplayRenderOrder` | 无核心缺口 |
| Level DAT runtime loader | ✓ | — | — | — | — | — | `LevelLoader` | 无核心缺口 |
| Top-level runtime state | — | — | ✓ | ✓ | ✓ | △ | `RuntimeStateMachine` | 多个非 gameplay scene 的人类名称仍可继续恢复 |

## 当前结论

核心地图 gameplay 的逆向已经从“机制发现”进入“语义收尾”阶段。raw terrain/object 的碰撞、移动中点、离开触发、持续任务、Camera/Input 锁和主要 Presentation 均已有 semantic 基准。

当前最高价值缺口集中在 Campaign：

1. 给 `bU=1..12` 恢复正式人类语义；
2. 用最小范围的 `EN.dat` 字符串索引给 Sandman / Beaver / Dream Machine 对话 action 命名；
3. 继续确认 Dream Machine / Cloud 9 的 mode-4 条目究竟是纯展示、状态选择还是还有其它专用输入路径。

在这些 Campaign 名称恢复前，不应为了“表格全绿”给数字 mode 强行起名。
