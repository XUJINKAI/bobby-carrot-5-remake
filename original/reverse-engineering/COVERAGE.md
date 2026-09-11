# UP09 Reverse Engineering Coverage

本文件是 reverse/original-runtime 的收口清单。这里的“完成”只表示 **UP09 原版事实层**已经有可追溯语义，不表示 BC5R Engine / Adapter 已经实现这些事实。

## 收口结果

| 范围 | 结果 | 证据入口 |
|---|---|---|
| Runtime state | 17/17 顶层 state 已命名并关联 scene / input / music | semantic/RuntimeStateMachine.java |
| Gameplay raw terrain | 0x47..0xC8 所有 runtime 使用区间已分类；全部专门分支已逐项建模 | notes/runtime-entity-matrix.md |
| Gameplay raw object | 0xC9..0xFF 全覆盖，包括 transient E4..E6、E8/E9 与 empty FF | notes/runtime-entity-matrix.md |
| Player pipeline | collision、grid-first move、midpoint、previous-leave、visual arrival、death/restart 已闭环 | PlayerCollisionRules / PlayerMoveLifecycle / MidpointInteractionDispatcher / DeathPipeline |
| Sustained systems | Shovel、Plank、Dragon、Fireball、Ice melt、Bean、Cloud/Leaf、Wind focus 的顺序与并发已闭环 | GameplayStepOrder / RuntimeActionCatalog |
| Campaign / scene | archive/record、普通关、Bonus、Shop、Cloud 9、Dream Machine、Train、Magic Code、Flight reward 已闭环 | SceneCatalog / CampaignProgression / CampaignRewardScenes |
| Shop | D[0..6] 七项含义、价格入口、runtime effect 与 ticket route 已闭环 | ShopUpgrades / NightTrain |
| Language resources | EN/DE/FR/IT/SP/PG 均为 123 个同构 ID；EN 0..122 已全量抽取和命名 | DialogCatalog / notes/up09-language-catalog.md |
| Hardcoded visible text | EN.dat 之外的 cheat、RMS reset、Error、level-pack 等 class literal 已审计 | HardcodedTextCatalog / notes/up09-text-audit.md |
| MIDI | JAR 14/14 MIDI 已索引；resolver、loop/one-shot、scene override 已恢复 | MusicCatalog / notes/up09-music-index.md |
| Sound Test | 10/10 菜单项与播放资源已恢复，含此前遗漏的 LEVEL COMPLETE | SoundTest |
| Save / RMS | BC5Data 单 record 字节顺序、默认值、持久/临时边界已恢复 | PersistentSaveFormat |
| Presentation | layer order、HUD、Bobby、Mower 非均分裁切、tile phases、sparkle、particles、camera/shake、Title/Code/Flight 星场已恢复 | GameplayRenderOrder / GameplayHud / MowerPresentation / TileAnimationClock / SpecialSceneStarfield |

## 音乐与文字的最终答案

普通 release 关没有 level -> fixed BGM 表。它们统一使用持久 Current Music 选择；AUTO 时从已购买的 ingame0..D[4] 中随机。Mower、Timed Bonus、shared scene、结果和死亡由 state 覆盖。完整绑定在 semantic/MusicCatalog.java 与 docs/system/original/audio.md。

可见文字由两部分组成：

1. 六个 locale 的 123-ID 语言资源；
2. a.class 内硬编码的可见 literal。

两部分均已审计。事件 -> string ID 见 DialogCatalog，逐条英文原文与直接使用点见 up09-language-catalog，class literal 见 HardcodedTextCatalog。

## “完成”的判定边界

本轮收口的是 UP09 的可观察 runtime semantics：

- 什么格能走、什么时候触发、上一格何时结算；
- 多拍任务如何推进、哪些系统可并发、什么只锁普通输入；
- Camera、动画、HUD、音乐、对话、结果页和持久化由什么状态驱动；
- release archive 与 shared scene 的 provenance。

以下不是遗留 gameplay 机制，也不能从 JAR 静态控制流中进一步精确推出：

- 具体 J2ME 设备对 VolumeControl.setLevel(125) 的 clamp 行为；
- 设备调度、MIDI 实现与 repaint 带来的 wall-clock 抖动；
- 恶意损坏 DAT / RMS 的厂商 JVM 异常表现；
- Base / UP01 的逐方法考古。它们按项目决策只保留代际摘要，UP02..UP09 稳定代以 UP09 为准。

截至本文件落盘，UP09 核心 gameplay、Campaign、音乐、文字、存档与 gameplay Presentation 没有已知未命名机制。后续工作应转入 fidelity-discrepancies.md 所列的 Engine / Adapter 实现阶段，并继续保持原版事实层与产品模型分离。
