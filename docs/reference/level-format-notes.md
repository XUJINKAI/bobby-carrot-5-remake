# 关卡格式逆向备注

## DAT 外层 framing

每个 DAT 先包含一条 length-prefixed metadata record。`00.dat` 的 metadata 长度为 0；其他已提供 DAT 通常包含一个前导 byte，随后是六组 Java `DataInputStream.readUTF()` 的标题/描述（DE/EN/FR/IT/SP/PG）。

Metadata 后每关再次独立 length-prefix，因此可以对**原始完整关卡记录**安全做 SHA-256 和精确去重。

## 原版对象 Loader 的展开行为

紧凑对象表并不总是一条记录对应 runtime object grid 的一个格。已确认的特殊情况包括：

- signed `-32/-31/-30/-20`：转入动态实体数组，而不是普通静态 object grid；
- `-41`：同时向右展开 `-40/-39` 两格，形成喷火龙；
- `-38`：下方额外写 `-22`；
- `-37`：下方额外写 `-21`；
- `-25`：下方额外写 `-9`；
- `-8`：增加特殊计数，同时仍保留在对象层。

生成 JSON 故意保存**原始紧凑 source table**。Engine 应在运行时重现这些展开规则，而不是污染档案 JSON。
