# Bobby Carrot 5 Remake 验证

完成任何任务前：

```bash
npm run verify
```

它会：

- 先执行源码质量门禁：仓库维护的源代码单文件不得超过 1000 行，800 行起提示职责审查，并检查压缩式代码排版；
- 用 TypeScript project references 编译 model、adventure、engine、editor，并对 web 执行无产物 typecheck；
- 从 10 个不可变原始 JAR 重建全部资产与 530 source / 485 unique DAT map；其中 Campaign 内容为 400 个普通关卡 + 80 个 Bonus 奖励关，另有 5 个共享商店 / Special Scene；
- 验证 semantic schema、public ID、章节星级和 collection metadata；
- 对所有官方 Campaign map 验证 `dynamic_slots` 可从 LevelMap 派生；
- 对全部 530 条官方 source 验证
  `Adapter → Reverse Adapter → Adapter` 后 canonical `LevelMap` 玩法语义一致；
- 运行 DAT byte-for-byte record round-trip 测试；
- 运行 Adventure / Engine / Editor 回归测试，包括类型专属 Entity 字段、多轮 dialogue、Adventure interaction 回调和 map augmentation；
- 递归读取 `assets/replays/` 的全部 JSON，通过 `meta.url` 关联地图，复跑并校验实际终局状态等于 `finalState`；
- 生成临时 patched original JAR，重新读取目标 DAT record 并验证写入结果；
- 校验依赖方向：Model、Adventure、Engine、Editor、Web 不允许依赖
  `tools/original/dat/`，DAT 只属于 tools、官方解码、JAR validation 与测试路径；
- 校验用户地图只保留 JSON 产品路径，不允许旧 DAT-backed URL share 代码回来；
- 校验单一 `dist/`、model/adventure/engine/editor browser modules 和 import map，并明确禁止 `dist/dat`；
- 用 Chrome/Chromium smoke test 加载 Home、Level Browser、Play、Adventure、Editor SPA 路由；本地也可通过 `node tools/cli.mjs verify browser` 单独运行同一检查。

源码质量门禁也可以单独运行：

```bash
node tools/pipeline/source-quality.mjs
```

`verify` 失败时不能把任务描述为完成。

## 冷启动验证

干净检出在安装依赖后直接执行 `npm run verify`。资产 CLI 入口先编译 Model，再加载依赖其 `dist` 入口的资产模块；CI 与本地共用该顺序。

`tools/pipeline/asset-bootstrap.test.mjs` 在隔离临时目录中复制 Model 源码及 CLI，建立本地 workspace 链接，并分别验证 `assets prepare` 与 `assets rebuild` 从缺少 Model 编译产物的状态生成语义地图。该测试随 `npm run verify` 执行。

修改构建、资产或验证入口时，还应在隔离的干净检出中运行 `npm ci` 和 `npm run verify`，确认完整流水线的结果独立于已有 `dist` 与 `.tsbuildinfo`。
