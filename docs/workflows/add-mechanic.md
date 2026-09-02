# 新增 / 校正机关流程

1. 在 `docs/reference/` 记录原版事实、字节码位置和仍未确认的问题。
2. 原版 Java 逻辑默认从 UP9 开始逆向。UP9 属于稳定的 UP2+ 代码家族，适合作为当前通用机关行为的第一参考；如果行为存在疑问、与早期关卡表现冲突，或需要判断某项规则何时引入，再按 UP8 → ... → UP2 → UP1 → Base 向前追查版本谱系。代码与资产谱系依据见 `docs/reference/official-release-provenance.md`。
3. 先判断事实属于 Tile Definition、Object Layout 还是 World 跨格算法。
4. 在 Engine 唯一实现规则，不在 Web/Editor 复制。
5. 增加最小 Node 回归测试。
6. 在 Editor 建最小测试地图并 Play Test。
7. 如果行为仍有疑问，将地图导出为 `custom-maps/original-patch/<public-id>.json`，执行 `node tools/cli.mjs original patch`，在原版模拟器跑同一输入。
8. 对比原版与 Bobby Carrot 5 Remake，再回到字节码解释差异。
9. `npm run verify` 全量验证后再完成任务。

原版验证不是另一个 Engine Playground：测试地图仍由 Editor authoring，Bobby Carrot 5 Remake 侧仍调用正式 Engine；JAR 工具只负责原版格式互操作。
