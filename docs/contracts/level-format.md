# 关卡数据契约

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

正式第五代 JAR 中的关卡记录都能按上述布局精确消费到声明长度。

Java ME 使用 signed `byte` 保存地图/对象 ID；生成 JSON 为避免信息损失统一保存 `0..255`：

```text
signed = id > 127 ? id - 256 : id
```

## Source Level

每条 source record 保存：

- 来源版本、DAT 文件名、包内关卡序号；
- 原始 record 长度与 SHA-256；
- 宽、高；
- dynamic slot 数；
- terrain 原始 U8 二维数组；
- object 原始列表，同时保留 unsigned、signed、hex 表示。

## Canonical Level

`assets/generated/levels/NNN.json` 按完整 level record 的内容哈希去重。`sources[]` 保存所有包含同一关卡的历史位置。

一旦公开存档格式开始依赖 canonical ID，就不得随意重新编号。
