# Bobby Carrot 5 Remake 验证

完成任何任务前：

```bash
npm run verify
```

它会：

- 先执行源码质量门禁：仓库维护的源代码单文件不得超过 1000 行，800 行起提示职责审查，并检查压缩式代码排版；
- 用 TypeScript project references 编译 model/dat/engine/editor/web；
- 从 10 个不可变原始 JAR 重建全部资产与 530 source / 485 unique DAT map；其中 Campaign 内容为 400 个普通关卡 + 80 个 Bonus 奖励关，另有 5 个共享商店 / Special Scene；
- 验证 semantic schema、public ID、章节、难度、筛选索引；
- 对所有官方 Campaign map 验证 `dynamic_slots` 可从 LevelMap 派生；
- 运行 DAT byte-for-byte record round-trip 测试；
- 运行 Engine/Editor 机关回归测试；
- 生成一个临时 patched original JAR 并做 JAR → DAT → LevelMap round-trip；
- 校验单一 `dist/`、model/dat/engine/editor browser modules 和 import map；
- CI 中用 Chrome/Chromium smoke test 加载 Home、Level Browser、Play、Editor SPA 路由。

源码质量门禁也可以单独运行：

```bash
npm run source:check
```

`verify` 失败时不能把任务描述为完成。
