# 新增 / 校正机关流程

1. 在 `docs/reference/` 记录原版事实、字节码位置和仍未确认的问题。
2. 先判断事实属于 Tile Definition、Object Layout 还是 World 跨格算法。
3. 在 Engine 唯一实现规则，不在 Web/Editor 复制。
4. 增加最小 Node 回归测试。
5. 在 Editor 建最小测试地图并 Play Test。
6. 如果行为仍有疑问，导出该地图并执行 `npm run original:patch -- --map <json> --target <public-id>`，在原版模拟器跑同一输入。
7. 对比原版与 bc5r，再回到字节码解释差异。
8. `npm run verify` 全量验证后再完成任务。

原版验证不是另一个 Engine Playground：测试地图仍由 Editor authoring，bc5r 侧仍调用正式 Engine；JAR 工具只负责原版格式互操作。
