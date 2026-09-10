# AGENTS.md

本仓库将 **Bobby Carrot 5 Remake** 实现为现代 Web 游戏，同时保留一条可验证原版逻辑的格式互操作链路。

## 修改前先读

- 产品目标：`docs/design.md`
- 架构边界：`docs/architecture.md`
- Engine API：`docs/contracts/engine-api.md`
- 关卡格式：`docs/contracts/level-format.md`
- Editor：`docs/features/editor.md`
- 原版验证：`docs/workflows/validate-original.md`
- 逆向机关：`docs/workflows/add-mechanic.md`
- 原版事实：`docs/reference/`
- 项目许可证：`LICENSE`
- 第三方资产版权边界：`THIRD_PARTY_ASSETS.md`

## 代码与文档质量

1. 仓库维护的源代码必须以便于人类阅读和审查的形式提交，禁止为了缩短文件而把多个声明、语句、分支或回调压缩到同一行；构建产物和第三方代码除外。
2. 单个仓库维护的源代码文件不得超过 1000 行。达到约 800 行时应主动检查职责是否过多，并优先按领域职责拆分，而不是机械切文件。
3. 文档和代码注释统一使用中文。技术标识符、API 名称、文件名、协议字段、原版专有名称保持原始拼写；`README_en.md`、第三方许可证/声明和必要的外部原文引用除外。
4. 注释解释“为什么”、不明显的约束、边界条件、原版行为依据，以及看似可以简化但实际上不能简化的原因；不要机械复述代码。
5. 复杂规则已有 `docs/` 文档时，以文档为单一可信源。代码只引用对应文档并解释实现关系，不复制一份可能发生漂移的规则说明。
6. 不得把新职责默认塞入 `common`、`utils`、`helpers` 等通用模块；能明确归属领域时必须放入所属模块。
7. 可机械验证的质量规则必须进入 `npm run verify`。`AGENTS.md` 负责说明规则，`npm run verify` 负责完整验证门禁；轻量回归只适用于本文件明确定义的低风险修改。
8. 项目在文档与 Web 用户界面中的正式名称统一为 **Bobby Carrot 5 Remake**；不得使用历史产品名或缩略显示名替代正式名称。包名、仓库名和 `bc5r` 内部代号不受此规则影响。
9. 除非用户、稳定合同、已发布数据或明确迁移要求提出兼容性需求，否则按当前目标直接设计和实现，不主动增加旧字段、旧行为、旧格式或临时方案的兼容层。

## 本地 AI 代码修改流程

1. 开始任务前检查当前分支和工作区状态，并记录当前 `HEAD` commit。开发直接以任务开始时的当前分支和当前工作区为基线；不得主动切换或新建分支、同步其它分支、改写现有提交，或把基线替换为 `main`。
2. 发现 staged、unstaged 或 untracked 修改时，先判断它们是否与当前任务重叠，以及后续编辑、验证或提交是否可能影响这些修改。能够明确隔离的无关修改应原样保留并继续任务；涉及相同文件或职责、可能被命令改写、无法可靠区分归属，或会使验证结果无法判断时，必须停止并询问用户。处于 detached HEAD 或存在未完成的 merge、rebase、cherry-pick 等 Git 操作时也必须停止。不得自行清理、暂存、提交或切换分支来绕过确认，提交时只纳入当前任务的修改。

3. 按职责边界和可回滚的工作阶段组织修改。每完成一个逻辑完整阶段，先运行与该阶段相关的检查，再创建一个内容聚焦的 commit；提交信息应准确描述当前阶段的结果。
4. 阶段 commit 应保持可审查、可回滚，并包含必要的测试、文档和验证规则。构建产物、生成目录和临时文件遵循本文件的生成物规则。
5. 完成修改后按风险选择验证范围，检查工作区状态，并确认最终改动已经提交到当前任务分支：
   - 仅修改文档时，执行 `git diff --check` 和与文档内容直接相关的轻量检查。
   - 简单页面 UI 修改只涉及模板、样式、文案、图标或 Shell 展示配置，且不改变状态管理、路由、输入、数据处理、业务行为、公共合同或构建流程时，执行 `git diff --check` 和直接相关的轻量回归测试。
   - 其它修改必须执行完整的 `npm run verify`。跨模块修改、Engine / Model / Adventure 逻辑、公共合同、数据格式、构建工具和包含多个逻辑阶段的长任务均属于完整验证范围。
   - 同一任务同时包含低风险修改与其它修改时，按完整验证执行；无法确定风险级别时也按完整验证执行。
6. 浏览器回归测试需要启动本机 Chromium，必须直接在沙箱外运行；包含该测试的 `npm run verify` 同样直接在沙箱外运行，避免先在沙箱内失败再重试。
7. 输出 PR message 前，以任务开始时记录的 `HEAD` commit 为比较基线检查：

   ```sh
   git log --oneline <base-commit>..HEAD
   git diff --stat <base-commit>...HEAD
   git diff --check <base-commit>...HEAD
   ```

   PR message 根据当前分支相对任务基线的实际提交和差异生成，至少包含 PR 标题、变更摘要、验证结果和必要的兼容性/迁移说明。完成任务时将该 PR message 一并输出给用户。

## Engine 总原则

**给 Engine 一个纯语义 `LevelMap`（JSON 地图）和少量运行配置，就应当能够独立把这张地图完整地玩起来。**

由此派生：

- 单独加载一张地图时仍应成立的移动、碰撞、机关、地图内计时、死亡/胜利条件与运行状态，属于 Engine。
- Engine 自带 Renderer、Camera、基础 Gameplay HUD 与可复用 `InputController`；调用方通过简单配置决定通用输入能力是否启用。
- `Game` 只接收 `move / setHeldDirection / undo / restart / pan / zoom` 等语义动作，不直接理解键盘键位、PointerEvent、屏幕摇杆 DOM 或具体产品页面。
- `InputController` 是 Engine 提供的通用输入适配器，可以理解键盘/指针等浏览器输入，并把外部屏幕方向控件提供的 `up/down/left/right` 统一转换为 Game 动作；具体摇杆 UI 仍由宿主持有。
- Result、章节跳转、存档、路由、产品导航等“玩完以后怎么办”的流程属于外层产品。
- 判断一条规则属于 Engine 还是 Adventure 时，优先问：**脱离 Campaign 单独玩这张 `LevelMap`，规则是否仍然应该成立？** 是则进入 Engine；只有跨关、章节、经济、永久进度等 Campaign 语义进入 Adventure。

## 避免回显已否决内容

* 用户否决、纠正、放弃的方案，以及 AI 在过程中产生的失败尝试，只作为当前任务的控制信息，不应成为最终结果的一部分。
* 最终产物应像读者从未看过前面的讨论一样独立成立，直接描述“现在是什么、现在怎么工作”，而不是解释“没有采用什么”。
* 避免使用“无 X”“非 X 版”“不再使用 X”“没有采用 X”“相比之前方案”等负向或对比式表达；不要仅通过换同义词继续保留相同的负向语义。
* 区分“项目真实历史”和“当前会话历史”。只有已经存在于代码库、已发布版本或明确基线中的行为，才可以描述为“移除、替换、迁移、改为”；讨论中的草案、临时代码、未提交修改和被否决方案不算项目历史。
* 如果某个方案只在本次讨论中出现过，最终应描述新方案本身。例如优先写“使用 YAML 保存配置”，而不是“移除 SQLite，改用 YAML”。
* 此规则适用于所有最终输出，包括正文、标题、文件名、UI 文案、代码注释、文档、测试名称、Commit Message、PR 描述、Changelog、Release Note 和任务总结。
* 只有当被排除内容本身具有实际信息价值时才应提及，例如真实的 Breaking Change、兼容性变化、迁移要求、安全限制、审计记录，或用户明确要求进行方案比较。
* 最终检查时，确认没有把用户已经否决的内容、AI 的思考过程、失败尝试或临时实现重新包装成产品特性、项目历史或说明文字。

## 许可证与版权边界

1. 项目自身原创的源代码、文档及其他可由相应作者授权的原创材料受根目录 `LICENSE` 约束；分发修改版时必须遵守其中的非商业、源码公开与同许可证延续要求。
2. 原版 Bobby Carrot 的 JAR、美术、音频、音乐、地图、DAT 数据、角色、名称、Logo、商标，以及从这些内容提取、解码、转换或生成的派生资源，不属于本项目 `LICENSE` 的授权范围。
3. 不得在 README、注释、文档、发布说明或 UI 中把第三方资产描述为“由本项目许可证授权”“自由使用”或“项目拥有版权”。第三方内容的权利边界统一以 `THIRD_PARTY_ASSETS.md` 为准。
4. 新增第三方资源、第三方代码或其派生物时，应明确来源和许可证/版权边界；无法确认授权时，不得擅自把它纳入本项目原创许可证范围。

## 硬规则

1. `assets/original/official-hd/` 的 10 个原始 JAR 永远只读；验证 JAR 只能生成到 `tmp/` 等生成目录。
2. `assets/extracted/`、`assets/generated/`、`dist/`、`tmp/` 都是生成物，不提交 Git，不手工修。
3. 正式 Campaign 玩家 ID 使用连续章节编号：`1-1 / 1-bonus-1 / ... / 40-10`。`base / up01 ... up09`、DAT 包名和 record slot 只属于 archive provenance；`001...485` 仍只是内部 canonical identity。
4. 原始 Campaign 内容必须区分：40 章共 400 个普通关卡 + 80 个 Bonus 奖励关；此外还有 5 个共享商店 / Special Scene：Beaver Shop、Cloud 9、Dream Machine、Dreamland Reward、Campaign Intro。技术上可以把前两者统称为 480 个 Campaign map，但面向玩家的文案使用 400 个普通关卡 + 80 个 Bonus 奖励关的产品表述。
5. `@bobby/model` 只定义稳定语义身份与纯 `LevelMap`；`LevelEntity` 的类型专属顶层 primitive 字段由 Model Definition 声明，`LevelMap.rules` 承载地图规则，具体执行逻辑与 runtime state 只位于 Engine；禁止加入 JAR/DAT byte、发布包、SHA、HTTP 或 Campaign 信息。
6. **所有原版 DAT byte ↔ `ts.png` 坐标换算只能位于 `tools/original/dat/`。** 坐标对应的 `type / fields / role / phase` 以 `model/src/map/entity/original-tile-visuals.json` 为唯一来源。Engine / Model 不允许维护第二份 DAT table；Editor/Web 不依赖 Original DAT tooling。
7. `engine/` 是唯一地图内游戏规则实现。Web、Adventure 与 Editor 禁止复制碰撞、机关、地图内计时、地图内死亡/胜利条件。
8. Engine 不知道 Adventure。`Game.loadLevel()` 只消费纯语义 `LevelMap`；release、chapter、difficulty、record hash、JAR source 等产品/来源字段不能成为 Engine load options。地图内机关实例参数通过 Definition 声明的 `LevelEntity` 顶层字段随 `LevelMap` 进入 Engine。
9. Engine 对外通过通用 `onWorldEvent()` 报告世界事件，并提供通用 Game 动作。禁止为 Adventure 增加 `bonus-timeout` 等 Campaign 专用 Engine API。
10. Entity 交互优先通过通用事件形状表达，例如 `object-interaction { objectType, action, x, y }`。地图内后续规则应由 Engine 根据 semantic Entity 与实例字段执行；Adventure 只解释跨关 Campaign 语义。
11. `@bobby/adventure` 只依赖 `@bobby/model`。它负责 1～40 Campaign identity/order、Save、全局经济/永久奖励与 session plan；禁止知道 Base/UP、DAT bytes、JAR、HTTP、DOM 或 localStorage。
12. 原版 Bonus 60 秒以 Lock 的 `deathCountdownSeconds` 字段进入 `LevelMap`：成功打开带该字段的 Lock 后由 Engine 启动倒计时；取得目标金胡萝卜则结束挑战，超时由 Engine 触发地图内死亡。自定义地图与 Editor Play Test 使用同一规则。
13. Adventure Save 是版本化 JSON；持久奖励按稳定 Campaign level ID + Object 类型 + 地图坐标记录，不能修改原始 LevelMap 来表达“已经拿过”。
14. Explore 与 Adventure 是两种不同官方地图体验：Explore 全关开放、可筛选/调试/自由缩放；Adventure 才有线性章内进度、全局存档与受限竖屏视野。
15. Editor 只持久化语义 JSON Draft；Play Test clone/normalize 后把 `LevelMap` 交给 Engine，Runtime 不得反写 Draft。
16. multi-cell Object 持久化只保存 anchor；唯一 Runtime 展开点是 Engine level-load 边界。Editor owner/preview/variant 必须共用 Engine Object Layout。
17. Editor Palette 是否允许某个 Object 出现属于 Engine Definition 的 authoring metadata，不维护 Editor 私有 ID 黑名单。
18. `ts.png` / `ta.png` 坐标属于 semantic atlas mapping，不允许由 DAT byte 推导。
19. 新机关必须有最小回归测试，并能在 Editor 测试地图验证；需要确认原版行为时再用 `npm run original:patch` 打回原版 JAR。
20. 原版验证工具只 patch 目标 DAT level record，尽量保留其它 JAR/DAT 内容；修改后失效的签名文件必须移除，Manifest 保留。
21. 新机制不根据图片猜规则。未确认行为标注推断/未确认。
22. 默认保留原版美术与 MIDI，不擅自替换。
23. 每次准备提交或告诉用户“完成”前，必须按“本地 AI 代码修改流程”第 5 条完成对应级别的验证；验证失败就继续修。
24. 正式构建只有 `dist/` 一个站点根。禁止 `dist/web`、Engine Playground、逐路由静态 `index.html`、canonical ID 兼容 URL。
25. Web 页面模块通过函数/API 协作；禁止用 MutationObserver 观察 DOM 来猜另一个模块何时渲染完成。

## 依赖方向

```text
@bobby/model <- engine
@bobby/model <- @bobby/adventure
@bobby/model <- editor <- web
@bobby/model <- tools
engine       <- editor <- web
@bobby/adventure <- web
Original Adapter/Patch -> tools/original/dat / @bobby/model / original JAR
```

禁止：

```text
engine    -> @bobby/adventure / tools/original/dat / JAR / Catalog / HTTP
adventure -> @bobby/engine / tools/original/dat / JAR / Catalog archive fields / DOM / localStorage
model     -> engine / tools/original/dat / adventure / web / editor
editor    -> tools/original/dat / raw DAT literals
web       -> tools/original/dat / raw DAT literals
mechanics -> DOM
```
