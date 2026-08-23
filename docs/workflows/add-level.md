# 导入新的关卡包 / JAR

1. 将原始 JAR 放进 `assets/original/`，分配稳定 edition ID；
2. 在资产工具配置中登记该 edition；
3. 执行 `npm run assets:extract`；
4. 执行 `npm run assets:decode`；
5. 执行 `npm run assets:build`；
6. 检查每个 edition 的关卡数量和 metadata；
7. 执行 `npm run verify`；
8. 确认去重依据是完整 level record SHA-256，而不是文件名或 UP 编号。

禁止手工复制 JSON 到 canonical 目录，新内容必须经过 decoder/builder。
