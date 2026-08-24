# AGENTS.md

本仓库把 Bobby Carrot 5 重构为现代 Web 游戏。它不是 Java ME 模拟器，也不是 320×240 UI 外壳。

## 修改前先读

- 产品目标：`docs/design.md`
- 架构边界：`docs/architecture.md`
- Engine API：`docs/contracts/engine-api.md`
- 关卡格式：`docs/contracts/level-format.md`
- Editor：`docs/features/editor.md`
- 资产管线：`docs/contracts/asset-layout.md`
- 逆向机关流程：`docs/workflows/add-mechanic.md`
- 原版事实：`docs/reference/`

## 硬规则

1. 禁止修改 `assets/original/official-hd/` 中的 10 个原始 JAR。
2. `assets/extracted/`、`assets/generated/`、`dist/` 都是生成物，不提交 Git，不手工修。
3. 玩家可见关卡 ID 使用 `base-1-1 / up1-2-7`；`001...485` 只是内部 canonical ID，不作为 URL 或兼容路由。
4. 游戏规则只属于 `engine/`；`web/` 与 `editor/` 都禁止复制碰撞、机关、死亡/胜利条件。
5. `editor/` 只维护 JSON Level Draft。Play Test 必须 clone/normalize 后调用 `@bobby/engine`，Runtime 不得反写 Draft。
6. Editor Import/Export 只使用语义 JSON，不新增 DAT 编辑逻辑。需要 DAT 导入/导出时只能经过独立 DAT codec；官方关卡必须复制后编辑。
7. `engine/` 不依赖 Web UI、Editor、框架、历史下载包菜单或 Java ME API。
8. 世界逻辑使用格子坐标；48px 等源素材尺寸只属于渲染/已确认的原版像素速度换算。
9. **原版 DAT terrain/object byte（包括 signed byte、hex 魔数、按 byte range 推导规则）只能出现在 DAT codec、codec 测试和逆向参考资料中。** Engine / Editor / Web / 语义 JSON / Runtime 一律使用语义 ID。
10. `ts.png` / `ta.png` 图集位置属于渲染协议，不属于 DAT 协议。Renderer/Editor 必须通过 semantic → atlas mapping 取图。
11. 不根据图片随意发明机关规则。未确认行为必须写成“推断/未确认”。
12. 新机关必须加最小回归测试，并能在 Editor 测试地图中验证。
13. 默认保留原版美术和 MIDI，不擅自 AI 重绘或替换编曲。
14. **每次完成任务、准备提交或告诉用户“已完成”之前，都必须执行 `npm run verify`。** 若 verify 失败，不得把任务描述为完成。
15. GitHub Actions 只负责 `main` 的兜底验证；分支/PR 不依赖 CI 代替本地 verify。
16. 正式构建只有一个站点根目录 `dist/`。禁止重新引入 `dist/web`、Engine Playground、逐路由静态 `index.html` 或 canonical ID 兼容 URL。

## 依赖方向

```text
original DAT -> DAT codec -> semantic LevelData
                         -> generated semantic JSON
web -> engine
web -> editor
editor -> engine
engine -> semantic LevelData
renderer/editor art -> semantic atlas mapping -> original art atlas
tools -> original / extracted assets
```

禁止：

```text
engine -> DAT byte / raw magic number
engine -> web/editor
editor -> raw DAT/JAR
web -> raw DAT/JAR
mechanics -> DOM
```
