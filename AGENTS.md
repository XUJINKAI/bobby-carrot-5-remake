# AGENTS.md

本仓库把 Bobby Carrot 5 重构为现代 Web 游戏，同时保留一条可验证原版逻辑的格式互操作链路。

## 修改前先读
- 产品目标：`docs/design.md`
- 架构边界：`docs/architecture.md`
- Engine API：`docs/contracts/engine-api.md`
- 关卡格式：`docs/contracts/level-format.md`
- Editor：`docs/features/editor.md`
- 原版验证：`docs/workflows/validate-original.md`
- 逆向机关：`docs/workflows/add-mechanic.md`
- 原版事实：`docs/reference/`

## 硬规则
1. `assets/original/official-hd/` 的 10 个原始 JAR 永远只读；验证 JAR 只能生成到 `tmp/` 等生成目录。
2. `assets/extracted/`、`assets/generated/`、`dist/`、`tmp/` 都是生成物，不提交 Git，不手工修。
3. 玩家可见关卡 ID 使用 `base-1-1 / up1-2-7`；`001...485` 只是内部 canonical ID，不作为 URL 或兼容路由。
4. `@bobby/model` 只定义稳定语义身份与纯 `LevelMap`；禁止加入 JAR/DAT byte、发布包、SHA、HTTP 或 gameplay 规则。
5. **所有原版 DAT byte ↔ semantic 映射只能位于 `@bobby/dat`。** Engine / Model 不允许维护第二份 DAT table；Editor/Web 只有分享或 Debug provenance 这种明确边界可以调用 `@bobby/dat` API。
6. `engine/` 是唯一游戏规则实现。Web 与 Editor 禁止复制碰撞、机关、死亡/胜利条件。
7. `Game.loadLevel()` 消费纯语义 `LevelMap`。release、chapter、difficulty、record hash、JAR source 等属于内容档案层，不能成为 Engine 输入要求。
8. Editor 只持久化语义 JSON Draft；Play Test clone/normalize 后把 `LevelMap` 交给 Engine，Runtime 不得反写 Draft。
9. multi-cell Object 持久化只保存 anchor；唯一 Runtime 展开点是 Engine level-load 边界。Editor owner/preview/variant 必须共用 Engine Object Layout。
10. Editor Palette 是否允许某个 Object 出现属于 Engine Definition 的 authoring metadata，不维护 Editor 私有 ID 黑名单。
11. `ts.png` / `ta.png` 坐标属于 semantic atlas mapping，不允许由 DAT byte 推导。
12. 新机关必须有最小回归测试，并能在 Editor 测试地图验证；需要确认原版行为时再用 `npm run original:patch` 打回原版 JAR。
13. 原版验证工具只 patch 目标 DAT level record，尽量保留其它 JAR/DAT 内容；修改后失效的签名文件必须移除，Manifest 保留。
14. 新机制不根据图片猜规则。未确认行为标注推断/未确认。
15. 默认保留原版美术与 MIDI，不擅自替换。
16. 每次准备提交或告诉用户“完成”前必须执行 `npm run verify`；失败就继续修。
17. 正式构建只有 `dist/` 一个站点根。禁止 `dist/web`、Engine Playground、逐路由静态 `index.html`、canonical ID 兼容 URL。
18. Web 页面模块通过函数/API 协作；禁止用 MutationObserver 观察 DOM 来猜另一个模块何时渲染完成。

## 依赖方向
```text
@bobby/model <- @bobby/dat
@bobby/model <- engine
@bobby/model <- editor <- web
@bobby/dat   <- editor (share/debug boundary)
engine       <- editor <- web
tools        -> @bobby/dat / original JAR
```

禁止：
```text
engine -> @bobby/dat / JAR / Catalog / HTTP
model  -> engine / dat / web / editor
editor -> raw DAT literals
web    -> raw DAT literals
mechanics -> DOM
```
