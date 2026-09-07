# ts.png 语义目录待决事项

本文集中记录 `model/src/map/entity/ts-visuals.json`、多格 Entity Visual 与
`@bobby/dat` 映射的待确认边界。确认后再按一个完整迁移提交实施。

## 当前职责

`ts-visuals.json` 已覆盖 `ts.png` 的 256 个单格，并承担两类信息：

- `surfaceFamilies`：atlas 单格到持久化 Surface `type + variant` 的映射；
- `visuals`：机关帧或多格 Entity 部件使用的命名单格。

Engine 已把 Beaver、Sandman、Dream Machine 和 Dragon 建模为带 footprint 的单个
Entity。它们的 atlas 单格属于同一 Entity 的部件或状态帧。例如 Beaver 使用
`15-8` 与 `16-8` 两格组成一个纵向 footprint；当前 `visuals.beaver` 与
`visuals.beaver-body` 的平级命名没有表达这层组合关系。

DAT 层目前由两个文件共同表达 decoded identity：

- `tools/original/dat/semantic-ids.mjs` 定义 decoded terrain/object 字符串；
- `tools/original/dat/mapping.mjs` 定义 byte、decoded identity 与 atlas 坐标的对应。

其中 atlas 坐标名称已经从 `ts-visuals.json` 读取，但 byte 表与 decoded identity
仍分别维护。

## A. 多格 Entity 与动画帧的目录结构

### A1：按 Entity 聚合（建议）

在 `ts-visuals.json` 增加 `entityVisuals`，以 canonical Entity type 为根，按
footprint role 和 state frame 组织 atlas 单格：

```json
{
  "entityVisuals": {
    "beaver": {
      "parts": {
        "head": { "cell": "15-8", "label": "海狸上半部" },
        "body": { "cell": "16-8", "label": "海狸下半部" }
      }
    },
    "dragon": {
      "parts": {
        "head": { "cell": "14-8" },
        "body": { "cell": "14-9" },
        "tail": { "cell": "14-10" }
      },
      "states": {
        "attack-1": { "part": "head", "cell": "15-9" },
        "attack-2": { "part": "head", "cell": "15-10" }
      }
    }
  }
}
```

Engine Visual、Editor Preview 与 Original Adapter 都通过 Entity type + role/state
查询同一目录。`visuals` 只保留真正独立、没有 Entity 组合语义的命名单格。

### A2：保留平级 visual ID

继续使用 `beaver`、`beaver-body` 之类平级 ID，并额外维护一个组合表。改动范围较小，
但调用方仍需同时理解 visual ID 与 footprint role 两套身份。

需要确认：选择 `A1` 或 `A2`。若选择 `A1`，Beaver role 使用与 Engine footprint
一致的 `head/body`，还是使用只描述布局的 `top/bottom`？建议使用 `head/body`，避免
Renderer 再维护一层 role 翻译。

## B. variant 对应的地图内语义

### B1：目录保存稳定 Surface 分类（建议）

目录保存不依赖 Engine 实现名的 `surfaceKind`，允许单格覆盖 family 默认值：

```json
{
  "type": "stone-wall",
  "surfaceKind": "growth-obstacle",
  "cells": [
    "1-4",
    { "cell": "10-3", "surfaceKind": "road" },
    { "cell": "10-4", "surfaceKind": "road" }
  ]
}
```

Engine 将 `surfaceKind` 映射为 Runtime Trait，例如 `growth-obstacle` 对应
`bean-growth-space`，`road` 对应 `walkable`。这样目录是 adapter/engine/editor
共同读取的 Surface 分类来源，同时 Trait 名称与执行规则仍由 Engine 持有。

### B2：目录直接保存 Trait

在单格上保存 `traits: ["walkable"]` 等 Runtime 名称。消费链更短，但会让 Model
目录直接依赖 Engine Trait vocabulary。

需要确认：选择 `B1` 或 `B2`。建议选择 `B1`，并在确认原版规则后固定
`surfaceKind` 的有限枚举。

## C. DAT 映射的收敛方式

### C1：`@bobby/dat` 单表描述并派生 API（建议）

在 `@bobby/dat` 内用一张记录表定义 layer、byte 与 decoded identity，正向/反向 Map、
decode/encode API 和供 adapter 使用的常量全部由该表派生。atlas 坐标与视觉命名继续
通过 `@bobby/model` 的 `ts-visuals.json` 查询。

```js
{ layer: "object", byte: 0xe7, decoded: "beaver-base" }
{ layer: "object", byte: 0xf7, decoded: "beaver-body" }
```

此结构让 DAT byte ↔ decoded semantic 只出现一次，也保持 DAT byte 不进入 Model。
`semantic-ids.mjs` 可以在迁移完成后由派生导出替代；`mapping.mjs` 只保留 codec API。

### C2：保留常量表与 byte 表

继续分别维护 decoded 常量与 byte Map，仅由测试检查双向完整性。调用点改动较少，
但新增 identity 时仍需修改两处。

需要确认：选择 `C1` 或 `C2`。建议选择 `C1`；实施时先建立 `@bobby/dat` workspace
边界，再迁移 tools 与原版验证测试。

## 建议回复格式

```text
A1，Beaver role 用 head/body
B1
C1
```
