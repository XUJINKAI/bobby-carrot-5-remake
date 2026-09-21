# Backlog

这里记录已经识别、但尚未实施的项目级工作。详细领域研究、原版事实和设计论证继续保留在对应文档中；完成并验证后的事项应从本文件删除，并进入正式合同、架构或功能文档。

## Architecture

### 激光对象推动时的光束表现同步

激光发生器或激光镜被推动时，World 会在移动完成后的下一次 Behavior tick 重新投影光束，视觉上会短暂保留原光路。

目标：

- 在发生器的整数位置提交后立即同步其派生光束，不等待后续 World tick。
- 保持推动事务、光束碰撞与 Presentation 的因果顺序一致。
- 为推动过程中的光束生命周期增加回归测试，避免出现一帧旧光束或新旧光束同时存在。

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

## Original fidelity

原版复刻相关工作继续使用现有专用状态体系，不在这里重复维护具体条目：

- [差异审阅入口](../original/reverse-engineering/notes/fidelity-discrepancies.md)
- [已确认、等待实现](../original/reverse-engineering/notes/fidelity-approved-backlog.md)
- [仍需确认的问题](../original/reverse-engineering/notes/fidelity-open-questions.md)
- [明确保留的现代设计](decisions/original-fidelity-boundaries.md)
