# 架构

```text
                     Web
                   /     \
                  v       v
              Engine    Editor
                  ^       |
                  |_______|
                    Play

原始 JAR -> Tools -> Generated LevelData -> Engine / Web / Editor
```

## Engine

`engine/` 是唯一游戏规则实现，负责 World、移动、机关、动态实体、Camera、Renderer、Input 和 Audio 抽象。Editor 不复制任何碰撞或机关逻辑。

## Editor

`editor/` 只负责“JSON Level 的创建与修改”：Terrain/Object 两层、基础绘制工具、Undo/Redo、Resize、JSON Import/Export 和 URL Share。

点击 **Play** 时：

```text
Editor Draft
    |
    | clone + normalize
    v
Engine LevelData
    |
    v
Runtime World
```

Stop 后 Runtime World 被丢弃，Editor Draft 原样保留。官方关卡也只以副本进入 Editor。

## Web

`web/` 是产品壳，同时调用 `@bobby/engine` 与 `@bobby/editor`：

- `/play/<official-id>`：官方关卡；
- `/edit/<official-id>`：复制官方关卡后编辑；
- `/play#map=...`：直接游玩分享地图；
- `/edit#map=...`：继续编辑分享地图。

## Assets / Tools

`assets/original/` 保留不可变 JAR；`assets/extracted/`、`assets/generated/` 都是可重建结果。Tools 负责 DAT 解码和官方 Catalog，不进入浏览器运行时。

## 依赖方向

允许：

```text
web -> engine
web -> editor
editor -> engine
engine -> generated LevelData
tools -> original/extracted assets
```

禁止：

```text
engine -> editor/web
editor -> raw DAT/JAR
web -> raw DAT/JAR
editor 自己实现机关/碰撞
```
