# Backlog

这里记录已经识别、但尚未实施的项目级工作。详细领域研究、原版事实和设计论证继续保留在对应文档中；完成并验证后的事项应从本文件删除，并进入正式合同、架构或功能文档。

## Architecture

### 统一内置地图与运行时资产生成流程

在 Robo 2 功能合并后，以独立 PR 重构 BC5 Original、Robo 2、LOMA 与 Novoban 的资产生成流程。`assets/` 继续作为网站最终运行时资产树，保持现有 `/assets/maps`、`/assets/adventure` 与 `/assets/art` 路径；生成器按各自拥有的输出目录原子发布，不再通过 `custom-maps/` 保存生成地图。

目标目录与依赖边界：

- 在 `tools/assets/` 下按 `bc5 / robo2 / loma / novoban` 组织四个显式 Asset Producer，并由统一 registry、Collection Publisher、缓存与 watcher 编排。
- `tools/assets/collections.json` 统一声明 collection 顺序、展示信息、可见性与 producer；目录型 producer 继续读取 `custom-maps/engine-lab`、`custom-maps/original-patch` 等人工维护地图。
- `custom-maps/` 只保存人工维护的语义地图，不保存 Robo 2 或 Pushbox 生成物。
- 根 `original/` 只保留 `official/`、`official-hd/` 与 `reverse-engineering/` 等来源和研究材料。
- `tools/original/lib/` 提供无 CLI 副作用、路径可注入的 JAR / DAT、Adapter、Catalog、Patch 与研究函数；`tools/original/` 根脚本只负责参数解析、默认路径、日志和错误出口。
- `tools/assets/bc5/` 只依赖 `tools/original/lib/`；`tools/original/lib/` 不依赖 `tools/assets/`。DAT byte 与 atlas 坐标换算仍只位于 `tools/original/dat/`，由 Original library 内部调用。

生成阶段：

- BC5 使用 `tmp/assets/bc5/extracted / decoded / adapted` 保存可审阅、可缓存的三阶段产物，再发布到 `assets/maps/original`、`assets/adventure` 与 `assets/art/hd`。
- Robo 2 使用 `tmp/assets/robo2/extracted / decoded / adapted` 保存对应阶段；decoded 地图保留来源 entry、record SHA、theme 与 tile code，并继续通过 encode round-trip 验证无损，再发布到 `assets/maps/robo2` 与 `assets/art/robo2`。
- LOMA 与 Novoban 从文本源直接转换为统一 `PreparedCollection` 并发布，不人为增加没有格式意义的中间阶段。
- Collection Publisher 统一校验和规范化 `MapDocument`、写入地图与 collection index，并根据有序 manifest 汇总 `assets/maps/index.json`。

缓存与开发流程：

- 每个 Producer 和阶段显式声明输入、依赖与独占输出，缓存按任务保存输入摘要、依赖摘要和输出清单。
- 输入变化只执行受影响阶段及其下游；Adapter 变化不重新解包 JAR，单个 collection 变化不重建其它 collection。
- `npm run dev` 的 Vite watcher 复用同一任务图，合并连续文件事件、串行重建并在成功后刷新页面；失败时保留上一份完整输出。
- `npm run clean` 清理全部 `tmp/assets` 阶段产物、任务缓存和最终生成目录，同时保留官方 JAR、研究材料与 Git 托管的音频、Replay、UI 资源。

迁移验证：

- 为 Original library / CLI 边界、Producer 依赖方向、任务失效传播、原子发布、冷启动和 watcher 增加自动测试，并把可机械检查的导入边界纳入 `npm run verify`。
- 结构迁移阶段比较迁移前后的 MapDocument、collection index、Adventure index 与美术文件 hash，证明目录和流水线重构不改变已发布内容。

### 激光对象推动时的光束表现同步

激光发生器或激光镜被推动时，World 会在移动完成后的下一次 Behavior tick 重新投影光束，视觉上会短暂保留原光路。

目标：

- 在发生器的整数位置提交后立即同步其派生光束，不等待后续 World tick。
- 保持推动事务、光束碰撞与 Presentation 的因果顺序一致。
- 为推动过程中的光束生命周期增加回归测试，避免出现一帧旧光束或新旧光束同时存在。

### Energy 传播规则的 Fact 化

当前 Fireball、Laser 与 Editor 光路投影共用 `EnergyPropagation`，以原版 Fireball 的
`ENERGY_TERRAIN`、对象阻挡和镜面方向规则作为兼容性基线。这套实现已经集中且有回归保护，
在现有机关范围内继续保持当前结构。

仅在出现以下维护或扩展压力时启动 Fact 化：

- 新增更多 Energy 类型，需要重复消费相同的传播许可或阻挡语义；
- 新增地形和动态对象后，`ENERGY_TERRAIN` 与 Entity Definition 容易发生漂移；
- Laser 拓扑缓存持续增加具体 Entity Type，难以由统一语义驱动失效更新。

候选方案：

- 增加 Presence Fact `energy-passable`，表示当前接触平面为 Energy 提供传播许可；
- 增加 Presence Fact `energy-blocking`，表示对象即使位于可传播地形上也会截断 Energy；
- 保持 `contact-cover` 的接触平面语义，使 Snow 遮蔽下层许可、High Grass 自身提供许可、Fence
  继续读取下层地形；
- 镜面方向变换、Fireball 融冰和 Laser 的 Exit / LaserStone / LaserEmitter / LaserBomb 命中效果
  继续由结构化领域规则处理，不压缩成布尔 Fact；
- 迁移前先用当前允许地形、Crumbly Rock、Dragon 各部位、Color Block 状态与两类镜面矩阵建立
  等价性测试，确保 Fact 化只改变规则声明位置，不改变原版行为或现有 Robo 2 解法。

### Game Level lifecycle

统一 `loadLevel()` / `restart()` 的关卡实例生命周期，避免宿主依赖只覆盖部分路径的事件。

当前问题：

- `level-loaded` 只由 `Game.loadLevel()` 触发，`Game.restart()` 不触发。
- Adventure Session effect 当前通过 `level-loaded` 重新投影永久状态；虽然现有 Adventure 重试路径使用 `loadLevel()`，行为可用，但事件语义并不准确。
- `loadLevel()` 与 `restart()` 在 Game 层存在重复的 session / presentation reset 与 finalize 流程。

目标：

- 保留 `level-loaded` 表示新的 LevelMap 已完成加载及相关 presentation 准备。
- 增加一个表示“新的 gameplay level instance 已准备开始”的统一生命周期，例如 `level-started`。
- `loadLevel()` 和 `restart()` 都应在 Game 完成旧输入/effect、Dialog、Presentation 等状态清理后触发该生命周期。
- Adventure Session effect 等“每个新 World 实例都需要重新投影”的宿主状态改为绑定统一生命周期，而不是绑定 `level-loaded`。
- 收敛 `loadLevel()` / `restart()` 在 Game 层重复的 reset / finalize 逻辑。
- 不把宿主生命周期事件下沉到 `GameplaySession.initializeWorld()`；`GameplaySession` 继续只负责纯 gameplay World 初始化。

### Web keyboard routing

统一 Web 的键盘事件所有权和快捷键仲裁。目前全局音乐、Editor、Replay 与 Engine Gameplay 分别直接监听浏览器键盘事件，冲突规则依赖各自实现和页面生命周期。

当前主要入口包括：

- App 全局 `M` 音乐快捷键。
- Editor 的 Tab、Ctrl/Cmd+A/Z/Y/C/X/V、Delete/Backspace、数字键、Q/E 等快捷键。
- Replay Panel 的 Tab 快捷键。
- Engine `InputController` 的 WASD / 方向键、Undo / Redo、Zoom、Debug，以及持续按键和 keyup 状态。
- 另外还有 AudioContext resume、button focus policy 等非快捷键 keyboard observer；这些不需要强行并入快捷键系统。

目标：

- Web 只保留一个统一的 `KeyboardRouter` 负责浏览器 `keydown / keyup / blur` 的语义路由。
- 区分两类输入：
  - 离散 Hotkey：全局命令、页面命令、Overlay 命令。
  - 连续 Gameplay keyboard：需要 keydown / keyup / held state 的 Engine 输入。
- 固定仲裁层级，不使用任意数字 priority，例如：
  1. Overlay / modal
  2. 当前 Page
  3. Global
  4. Gameplay
- 统一 editable target 判断（input / textarea / select / contenteditable）、modifier 和 repeat 规则。
- 对持续按键记录原始 owner，确保 scope 在按键期间变化后，对应 keyup 仍交回原 consumer，避免 stuck key。
- `window.blur` 时统一释放所有物理按键状态。
- Engine 不依赖 Web 实现；为 `InputController` 提供薄的 keyboard input source 端口：
  - Web runtime 使用 `KeyboardRouter` 作为 source。
  - Engine 独立运行时仍可使用默认 browser keyboard source。
- 迁移完成后，Web 页面不再通过直接 `window.addEventListener("keydown", ...)` 实现产品快捷键。

## Testing

### 测试覆盖清单与价值审计

对 `tests/` 中的测试逐项建立清单，并从稳定合同、风险点和用户关键流程审阅覆盖情况。行覆盖率只作为辅助信号，不作为测试取舍的主要依据。

覆盖清单按以下领域组织：

- Model 格式与 parser；
- Original DAT / Adapter；
- Engine subsystem；
- 具体 Entity；
- Adventure / Save；
- Editor；
- Web；
- Build / browser artifact。

清单中的每个现有测试应记录其保护的合同或行为，并标记主要价值类型：

- 核心合同测试；
- 业务行为回归；
- 跨层重复测试；
- 仅锁定实现细节的测试；
- 高耗时或易波动测试；
- 已被更高层测试完整覆盖的测试。

建立“合同或风险点 → 测试场景 → 现有测试或缺口”的映射。应从 `docs/contracts/`、Engine Entity registry、Adventure Save、构建合同和用户关键流程反推必要场景，避免仅根据现有实现或代码行覆盖率判断完整性。

分批处理审计结果：

1. 优先补齐影响稳定合同和关键用户流程的缺口。
2. 再合并或删除经确认重复、低价值的测试。
3. 每次删除测试时，明确记录继续保护对应合同的现有测试或新增测试。
4. Engine、Original、Web / browser 分别形成可独立审查和回滚的提交；改动范围较大或审阅节奏不同时，分别建立 PR。

## Robo 2

### 激光摧毁与爆炸表现

激光炮摧毁和炸弹爆炸当前先按确认过的网格时点提交 gameplay mutation。为两类事件补充独立的 World Event 与瞬态视觉，并在模拟器实测后校准表现时长、爆炸帧和 gameplay mutation 的对应时点。

## Original fidelity

原版复刻相关工作继续使用现有专用状态体系，不在这里重复维护具体条目：

- [差异审阅入口](../original/reverse-engineering/notes/fidelity-discrepancies.md)
- [已确认、等待实现](../original/reverse-engineering/notes/fidelity-approved-backlog.md)
- [仍需确认的问题](../original/reverse-engineering/notes/fidelity-open-questions.md)
- [明确保留的现代设计](decisions/original-fidelity-boundaries.md)
