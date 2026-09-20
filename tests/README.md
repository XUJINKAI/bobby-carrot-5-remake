# 测试目录

测试按验证性质组织：

- `unit/`：纯函数、parser、codec 与小型逻辑；
- `module/`：完整 subsystem 或模块级行为；
- `entity/`：具体 Engine Entity 的行为；
- `integration/`：内容前处理、真实资产、跨模块与工具链；
- `smoke/`：production build 与真实浏览器环境；
- `support/`：测试辅助实现，不自动作为测试执行；
- `fixtures/`：测试输入数据。

`npm test` 自动发现并执行全部非 smoke 测试。选择目录时使用位置参数，例如：

```bash
npm test -- unit
npm test -- module engine
npm test -- integration original
```

完整仓库验收使用 `npm run verify`，其中包含内容前处理、`npm test`、production build 与 smoke。

## 执行阶段

`npm test` 按以下顺序运行：

```text
Model bootstrap
→ Original 解包 / DAT 解码 / Adapter / Adventure Catalog
→ 自定义地图与 collection 前处理
→ i18n build 与 Runtime TypeScript project build
→ 自动发现 unit / module / entity / integration
→ tests/unit/web 与 tests/module/web 交给 Vitest
→ 其余测试交给 Node Test
```

`npm run verify` 在源码质量门禁后调用完整 `npm test`，随后执行 production build、build smoke、browser smoke、SEO 与性能检查。`smoke/` 只在这一流程中运行。
