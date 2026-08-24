# 验证

完成任何任务前：
```bash
npm run verify
```

它会：
- 用 TypeScript project references 编译 model/dat/engine/editor/web；
- 从 10 个不可变原始 JAR 重建全部资产与 530 source / 485 unique 关卡；
- 验证 semantic schema、public ID、章节、难度、筛选索引；
- 对所有官方关验证 `dynamic_slots` 可从 LevelMap 派生；
- 运行 DAT byte-for-byte record round-trip 测试；
- 运行 Engine/Editor 机关回归测试；
- 生成一个临时 patched original JAR 并做 JAR → DAT → LevelMap round-trip；
- 校验单一 `dist/`、model/dat/engine/editor browser modules 和 import map；
- CI 中用 Chrome/Chromium smoke test 加载 Home、Level Browser、Play、Editor SPA 路由。

`verify` 失败时不能把任务描述为完成。
