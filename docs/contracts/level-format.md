# 关卡数据契约

## 两层格式，严格隔离

bc5r 把原版 DAT 当作一种外部二进制协议，而不是项目内部数据模型：

```text
Original DAT bytes
      ↓ decode
DAT codec
      ↓
Semantic LevelData / JSON
      ↓
Engine / Editor / Web
```

反方向导出同理：只有 DAT codec 会把语义 ID 重新编码成原版 byte。

## 原始 DAT 包格式

该格式来自原版字节码，并已用所收集的第五代正式 `.dat` 文件验证：

```text
u16 metadata_record_length  大端
metadata_record[metadata_record_length]

重复直到 EOF：
  u16 level_record_length  大端
  u8  width
  u8  height
  u8  terrain[height][width]
  u8  dynamic_slots
  u16 object_count         大端
  重复 object_count 次：
    i8/u8 object_id
    u8 x
    u8 y
```

这些 byte、signed byte、hex 值只属于 DAT codec 与逆向参考层，不进入 Engine / Editor / Web 数据合同。

## Semantic LevelData

项目内部和生成 JSON 使用 `schemaVersion: 2`：

```json
{
  "schemaVersion": 2,
  "width": 4,
  "height": 2,
  "terrainEncoding": "semantic-row-major",
  "terrain": [
    ["start", "ground-c", "water", "tide-left"],
    ["ground-c", "speed-switch-raised", "speed-left", "exit"]
  ],
  "objects": [
    { "type": "leaf", "x": 2, "y": 0 },
    { "type": "carrot", "x": 1, "y": 1 }
  ]
}
```

规则：

- `terrain[][]` 与 `objects[]` 始终保持两层；
- Terrain/Object 的身份是稳定语义字符串，而不是 DAT code；
- 已确认机关使用明确含义，例如 `speed-switch-raised`、`leaf`；
- 暂未逆出具体含义但必须无损保存的美术格使用稳定语义分类，例如 `walkable-variant-*`；
- JSON 不保存 `signedId`、`hexId`、raw byte；
- 不提供旧 raw-id schema 的兼容读取器。

## DAT codec

`tools/src/dat-codec.mjs` 是原版 tile/object 魔数的唯一映射边界；`tools/src/level-format.mjs` 负责 DAT record 的二进制布局读写并立即调用 codec。

必须满足：

```text
DAT record -> semantic LevelData -> DAT record
```

对于官方关卡，该 round-trip 必须 byte-for-byte 与原 record 一致。

## Art mapping

原版 `ts.png` / `ta.png` 的 atlas 坐标与 DAT 编码是两个不同协议。即使原作中二者曾巧合共享索引，也禁止在现代代码里重新耦合。

Renderer / Editor 使用：

```text
semantic terrain/object -> atlas mapping -> source image cell
```

而不是：

```text
DAT byte -> 位运算 -> atlas cell
```

## Source 与 Canonical Level

每条 source record 仍保存来源版本、DAT 文件名、包内关卡序号、原始 record 长度与 SHA-256，以便验证逆向和去重；这些档案字段不改变语义关卡模型。

`assets/generated/levels/NNN.json` 按完整原始 level record 的内容哈希去重，`sources[]` 保存所有包含同一关卡的历史位置。玩家界面继续使用 `base-1-1`、`up9-4-12` 等公开编号。
