# Backlog

这里记录已经识别、但尚未实施的项目级工作。详细领域研究、原版事实和设计论证继续保留在对应文档中；完成并验证后的事项应从本文件删除，并进入正式合同、架构或功能文档。

## Architecture

### 激光对象推动时的光束表现同步

激光炮或激光镜被推动时，World 会在移动完成后的下一次 Behavior tick 重新投影光束，视觉上会短暂保留原光路。

目标：

- 在激光炮的整数位置提交后立即同步其派生光束，不等待后续 World tick。
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
- 镜面方向变换、Fireball 融冰和 Laser 的 Exit / LaserStone / LaserCannon / LaserBomb 命中效果
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

### Web Shell 配置与响应式模型收敛

当前 Web Shell 已由页面提交语义化 `ShellConfig`，统一负责 TopBar、BottomBar、响应式折叠、
Overflow 和窄屏 Action 迁移；页面与 App Root 继续解释 action ID。现有边界能够支持当前页面，
后续增加 Shell 状态或更多响应式布局前，按以下阶段收敛配置模型。

第一阶段优先降低配置调用的维护风险：

- 将 `gameShellConfig()`、`configureEditorShell()` 和 `editorShellConfig()` 的多个位置参数改为
  具名状态对象，避免布尔值、可选地图信息和 Replay 状态因参数顺序产生错配。
- 为各页面的 Shell state 建立明确类型；配置生成函数保持纯函数，便于直接测试不同模式和状态。

第二阶段统一 Action 合同：

- 将当前同时存在的 `collapse` 与 `narrow` 收敛到单一响应式配置结构，统一表达窄屏的保留、
  Overflow、隐藏、位置迁移和纯图标呈现。
- 明确互斥组合，例如进入 Overflow 的 Action 不能同时迁移到底栏；使用类型或配置校验阻止
  无效状态。
- 将 `ShellAction` 拆分为 command 与 link 的判别联合，约束 `href`、`external` 和命令派发字段，
  避免可选字段任意组合。

第三阶段收敛状态所有权：

- App Root 根据全局设置和页面配置派生最终 ShellConfig，不直接修改页面提交的 Action 对象；
  `pressed`、动态 icon 与 tip 保持单向数据流。
- 将 gameplay runtime warning 的配置合并从 `shellBridge.ts` 移到 App Root 或专用 Shell composer，
  使 Bridge 只负责安装、保存和派发配置。
- 为 Shell 的 700px、Identity 的 700/900px、Replay 与 Editor 的 620px 建立具名布局层级，记录
  每个断点的产品语义；共享同一层级的组件使用同一来源，保留确有不同职责的断点。

验收要求：

- Home、Explore、Adventure、Import、Editor、Settings 与 Embed 的 TopBar / BottomBar 行为保持一致。
- 宽屏、窄屏、Overflow、Action 迁移及 label 收敛均有模块测试和 Chromium 布局回归。
- 页面配置代码不读取 viewport；响应式呈现继续由 Shell 统一负责。
- Shell renderer 不识别页面、模式、Gameplay、Editor 或具体 action ID。

## Presentation

### Adaptive Camera Framing

目前 Gameplay 的初始 zoom 只按 Adventure / Explore 区分，未考虑地图大小和实际 viewport，
在不同地图、设备和屏幕方向下可能出现不合理的初始构图。

目标：

- 根据实际 viewport 宽高与地图 `width / height` 计算初始 zoom，不按 mobile / desktop 分类。
- 小地图可适当展示更多全貌；大地图展示合理局部，不强制适配整张地图。
- 为地图边缘保留少量 padding，避免内容刚好贴满屏幕。
- Adventure / Explore 继续使用各自的 `minZoom / maxZoom / panBounds` 策略。

允许地图提供 `close / normal / wide` 三档构图偏好，未配置时使用 `normal`。
该字段表达 Camera framing 偏好，不保存具体 zoom；优先放在 `MapDocument`，
保持纯 `LevelMap` 的 gameplay 语义边界。计算时结合 viewport 大小、地图尺寸、构图偏好
以及期望可见的最小/最大行列范围。具体范围和三档倍率留待实现时确定。

第一版只在进入地图时计算初始 zoom。用户手动缩放后不自动覆盖，也不随 resize 或横竖屏
切换持续重算。Camera framing 属于 Presentation 配置。

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

### 地图生命周期音乐

当前 25 张 Robo 2 地图显式使用 `music: "robo2/menu"`，继续复用现有单曲地图音乐合同。
当地图需要分别声明进入、持续背景、获胜与死亡曲目时，再扩展 `LevelMap` 音乐合同和
`LevelMusicController`，使 `begin / end / die` 等一次性曲目由地图语义驱动。扩展时同时处理
Restart、Undo、Replay、音色切换与一次性曲目重放，不根据 collection 身份隐式选曲。

### 激光摧毁与爆炸表现

激光炮摧毁和炸弹爆炸当前先按确认过的网格时点提交 gameplay mutation。为两类事件补充独立的 World Event 与瞬态视觉，并在模拟器实测后校准表现时长、爆炸帧和 gameplay mutation 的对应时点。

## Original fidelity

原版复刻相关工作继续使用现有专用状态体系，不在这里重复维护具体条目：

- [差异审阅入口](../original/reverse-engineering/notes/fidelity-discrepancies.md)
- [已确认、等待实现](../original/reverse-engineering/notes/fidelity-approved-backlog.md)
- [仍需确认的问题](../original/reverse-engineering/notes/fidelity-open-questions.md)
- [明确保留的现代设计](decisions/original-fidelity-boundaries.md)
