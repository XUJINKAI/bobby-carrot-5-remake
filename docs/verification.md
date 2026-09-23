# Bobby Carrot 5 Remake 验证

完成任何任务前：

```bash
npm run verify
```

它会：

- 执行源码质量与测试目录结构门禁；
- 编译当前 Runtime，在隔离事务中完整执行 Original 解包、DAT 解码、Adapter、Adventure Catalog、自定义 collection 前处理与 Replay 验真；
- 通过 TypeScript project references 增量编译各 Runtime package；
- 由 `tests/run.mjs` 自动发现并分发 Node Test 与 Vitest 测试，验证 semantic schema、DAT round-trip、Original Adapter、Adventure、Engine、Editor、Web 与 Replay；
- 执行 production build，将站点组装到唯一的 `dist/`；
- 运行 build smoke，校验发布文件、DAT-free runtime、生成目录边界以及 `assets/` 与 `dist/assets/` 一致；
- 用 Chrome/Chromium 完成 production 页面与 source browser regression；
- 最后验证 SEO、性能与最终产物合同。

开发过程中的完整逻辑回归使用：

```bash
npm test
```

它运行 `unit`、`module`、`entity` 与 `integration`，不构建 production 站点，也不启动 Chromium。可按目录过滤，例如 `npm test -- module engine`。测试分类与 runner 规则见 [`tests/README.md`](../tests/README.md)。

源码质量门禁也可以单独运行：

```bash
node tools/pipeline/source-quality.mjs
```

`verify` 失败时不能把任务描述为完成。

## 冷启动验证

干净检出在安装依赖后直接执行 `npm run verify`。资产 CLI 入口先编译 Model，再加载依赖其 `dist` 入口的资产模块；CI 与本地共用该顺序。

`tests/integration/assets/asset-bootstrap.test.mjs` 在隔离临时目录中复制 Model 源码及 CLI，建立本地 workspace 链接，并分别验证 `assets prepare` 与 `assets rebuild` 从缺少 Model 编译产物的状态生成语义地图。该测试随 `npm test` 与 `npm run verify` 执行。

`tests/integration/build/dev-cold-start.test.mjs` 另行建立不含任何 workspace `dist`
和生成资产的隔离检出，执行完整 `npm run dev`，确认只 bootstrap Model、生成开发资产并同时提供
Web 首页与 `/edit`。该测试防止 CLI、资产准备和 Vite 启动之间的冷启动编排发生漂移。

修改构建、资产或验证入口时，还应在隔离的干净检出中运行 `npm ci` 和 `npm run verify`，确认完整流水线的结果独立于已有 `dist` 与 `.tsbuildinfo`。
