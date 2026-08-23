# 验证

`npm run verify` 是仓库级质量门槛，当前会验证：

1. 10 个正式高清版本的 DAT 均可完整解码；
2. Base 与 UP9 各自都能得到 53 条 source level；
3. 公共 `00.dat` 教学关可以按原始记录哈希确认重复；
4. 10 个版本共生成 530 条 source record；
5. SHA-256 去重后必须得到 485 个 canonical level；
6. 每个 canonical JSON 的宽高和 terrain 数组一致；
7. Engine 与 Web TypeScript 都可编译；
8. 自动测试全部通过；
9. `dist/web`、`dist/engine-playground` 及运行时美术/catalog 均存在。

任何改动导致这些数量变化，都必须先解释数据来源，而不是直接修改断言。
