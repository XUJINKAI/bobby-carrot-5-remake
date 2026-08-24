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

## 代码与文档质量

1. 仓库维护的源代码必须以便于人类阅读和审查的形式提交，禁止为了缩短文件而把多个声明、语句、分支或回调压缩到同一行；构建产物和第三方代码除外。
2. 单个仓库维护的源代码文件不得超过 1000 行。达到约 800 行时应主动检查职责是否过多，并优先按领域职责拆分，而不是机械切文件。
3. 文档和代码注释统一使用中文。技术标识符、API 名称、文件名、协议字段、原版专有名称保持原始拼写；`README_en.md`、第三方许可证/声明和必要的外部原文引用除外。
4. 注释解释“为什么”、不明显的约束、边界条件、原版行为依据，以及看似可以简化但实际上不能简化的原因；不要机械复述代码。
5. 复杂规则已有 `docs/` 文档时，以文档为单一可信源。代码只引用对应文档并解释实现关系，不复制一份可能发生漂移的规则说明。
6. 不得把新职责默认塞入 `common`、`utils`、`helpers` 等通用模块；能明确归属领域时必须放入所属模块。
7. 可机械验证的质量规则必须进入 `npm run verify`。`AGENTS.md` 负责说明规则，verify 才是强制门禁。
8. 项目在文档与 Web 用户界面中的正式名称统一为 **Bobby Carrot 5 Remake**；不要再使用 `Bobby Carrot 5 Web`、裸 `Bobby Carrot` 等旧产品名。包名、仓库名和 `bc5r` 内部代号不受此规则影响。

## 硬规则

1. `assets/original/official-hd/` 的 10 个原始 JAR 永远只读；验证 JAR 只能生成到 `tmp/` 等生成目录。
2. `assets/extracted/`、`assets/generated/`、`dist/`、`tmp/` 都是生成物，不提交 Git，不手工修。
3. 正式 Campaign 玩家 ID 使用连续章节编号：`1-1 / 1-bonus-1 / ... / 40-10`。`base / up01 ... up09`、DAT 包名和 record slot 只属于 archive provenance；`001...485` 仍只是内部 canonical identity。
4. 原始内容必须区分：40×12=480 个正式 Campaign map，以及 5 个共享 Special Scene；不要把 `00.dat` 的 5 条记录称作 Tutorial。
5. `@bobby/model` 只定义稳定语义身份与纯 `LevelMap`；禁止加入 JAR/DAT byte、发布包、SHA、HTTP、Campaign 或 gameplay 规则。
6. **所有原版 DAT byte ↔ semantic 映射只能位于 `@bobby/dat`。** Engine / Model 不允许维护第二份 DAT table；Editor/Web 只有分享或 Debug provenance 这种明确边界可以调用 `@bobby/dat` API。
7. `engine/` 是唯一地图内游戏规则实现。Web、Adventure 与 Editor 禁止复制碰撞、机关、地图内死亡/胜利条件。
8. Engine 不知道 Adventure。`Game.loadLevel()` 只消费纯语义 `LevelMap`；release、chapter、difficulty、record hash、JAR source、Bonus 60 秒等都不能成为 Engine load options。
9. Engine 对外通过通用 `onWorldEvent()` 报告世界事件，并提供 `killPlayer(reason)` 等通用运行时能力。禁止为 Adventure 增加 `lock-opened`、`bonus-timeout` 等专用 Engine API。
10. Object 交互优先通过通用事件形状表达，例如 `object-interaction { objectType, action, x, y }`。Adventure 可以订阅该流并按 semantic Object ID 解释原版 Campaign 规则。
11. `@bobby/adventure` 只依赖 `@bobby/model`。它负责 1～40 Campaign identity/order、Save、全局经济/永久奖励、Adventure session/runtime rule；禁止知道 Base/UP、DAT bytes、JAR、HTTP、DOM 或 localStorage。
12. 原版 Bonus 60 秒属于 Adventure：Adventure 订阅 Engine 的通用 object interaction，在成功打开 `ObjectId.LOCK` 后开始倒计时；收到 `complete/death` 后结束；超时调用通用 `killPlayer()`。Explore、Editor、Shared Play 不自动计时。
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
23. 每次准备提交或告诉用户“完成”前必须执行 `npm run verify`；失败就继续修。
24. 正式构建只有 `dist/` 一个站点根。禁止 `dist/web`、Engine Playground、逐路由静态 `index.html`、canonical ID 兼容 URL。
25. Web 页面模块通过函数/API 协作；禁止用 MutationObserver 观察 DOM 来猜另一个模块何时渲染完成。

## 依赖方向

```text
@bobby/model <- @bobby/dat
@bobby/model <- engine
@bobby/model <- @bobby/adventure
@bobby/model <- editor <- web
@bobby/dat   <- editor (share/debug boundary)
engine       <- editor <- web
@bobby/adventure <- web
engine generic event port <- @bobby/adventure runtime adapter (structural interface only; no package dependency)
tools        -> @bobby/dat / original JAR / generated Catalog
```

禁止：

```text
engine    -> @bobby/adventure / @bobby/dat / JAR / Catalog / HTTP
adventure -> @bobby/engine / @bobby/dat / JAR / Catalog archive fields / DOM / localStorage
model     -> engine / dat / adventure / web / editor
editor    -> raw DAT literals
web       -> raw DAT literals
mechanics -> DOM
```
