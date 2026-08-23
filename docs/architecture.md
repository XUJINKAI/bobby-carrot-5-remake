# 架构

```text
Original JAR / DAT
        |
        v
    DAT Codec
        |
        v
Semantic LevelData / JSON
        |
        +--------------+
        |              |
        v              v
      Engine <------- Editor
        ^              ^
        |              |
        +------ Web ----+

Semantic tile type -> Art Mapping -> Original Atlas
```

## DAT Codec

原版 DAT 是外部二进制协议，不是项目内部关卡格式。`tools/src/dat-codec.mjs` 与 `tools/src/level-format.mjs` 构成格式边界：读取 DAT 时立刻把原版 terrain/object byte 转成语义类型；导出 DAT 时才重新编码为原版 byte。

`Engine / Editor / Web / generated JSON / Runtime` 不知道原版魔数，也不能依赖 byte range 推导机关规则。

## Engine

`engine/` 是唯一游戏规则实现，负责 World、移动、机关、动态实体、Camera、Renderer、Input 和 Audio 抽象。Editor 不复制任何碰撞或机关逻辑。

Engine 只接收 Semantic `LevelData`。例如地形是 `ground-c / tide-left / speed-switch-raised`，对象是 `carrot / leaf / mower`。尚未逆出具体名称的原版格子也先由 codec 分类成稳定语义 variant，而不是让 byte 泄漏进 Engine。

Renderer 需要原版图集时，通过独立的 semantic → atlas mapping 获取素材位置；DAT code 与 atlas coordinate 是两个不同协议。

## Editor

`editor/` 只负责“Semantic JSON Level 的创建与修改”：Terrain/Object 两层、基础绘制工具、Undo/Redo、Resize、JSON Import/Export 和 URL Share。

点击 **Play** 时：

```text
Editor Draft
    |
    | clone + normalize
    v
Semantic Engine LevelData
    |
    v
Runtime World
```

Stop 后 Runtime World 被丢弃，Editor Draft 原样保留。官方关卡也只以副本进入 Editor。Editor 不读写 raw DAT；如果未来 UI 需要 DAT Import/Export，也必须调用 codec，而不是在 Editor 内复制编码规则。

## Web

`web/` 是产品壳，同时调用 `@bobby/engine` 与 `@bobby/editor`：

- `/play/<official-id>`：官方关卡；
- `/edit/<official-id>`：复制官方关卡后编辑；
- `/play#map=...`：直接游玩分享地图；
- `/edit#map=...`：继续编辑分享地图。

Web 的 Debug 信息同样只显示语义 Terrain/Object/Dynamic 类型，不显示或依赖 DAT byte。

## Assets / Tools

`assets/original/` 保留不可变 JAR；`assets/extracted/`、`assets/generated/` 都是可重建结果。Tools 负责 JAR 提取、DAT codec 和官方 Catalog，不进入浏览器运行时。

## 依赖方向

允许：

```text
original/extracted DAT -> tools DAT codec -> semantic generated LevelData
web -> engine
web -> editor
editor -> engine
engine -> semantic LevelData
renderer/editor -> semantic art mapping -> original atlas
```

禁止：

```text
engine -> DAT byte / raw magic number
engine -> editor/web
editor -> raw DAT/JAR
web -> raw DAT/JAR
editor 自己实现机关/碰撞
Renderer 用 DAT byte 推导 atlas 坐标
```
