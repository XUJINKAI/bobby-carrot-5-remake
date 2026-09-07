# 语义关卡格式

项目运行时地图使用语义身份；原版 DAT byte 只属于格式互操作边界。

规则：

- Engine、Editor、Web、生成地图、玩法测试与 Runtime Debug 使用 canonical
  terrain/object 语义身份。
- 原始 DAT byte 只出现在 DAT codec、逆向参考资料和明确的 codec round-trip
  测试中。
- decoded archive 保留 Terrain 与 Object 两层，二者的标签统一为
  `ts-<row>-<column>:<semantic>`。例如 `ts-4-13:tree` 与
  `ts-16-14:fence`；坐标提供无损身份，语义后缀用于人工审阅。
- 未确认语义分别使用 `unknown-terrain` 与 `unknown-object` 后缀。Adapter 将其
  转换为 `surface-<row>-<column>` 或 `object-<row>-<column>` 临时 Entity。
- Engine 规则不依赖 DAT byte；原版 atlas 坐标只通过 Model 的 semantic visual
  mapping 进入 Engine 与 Editor。

对应关系的职责与修改入口见 [`adapter.md`](../system/adapter.md)。
