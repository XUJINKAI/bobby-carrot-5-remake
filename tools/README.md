# Tools CLI

仓库脚本统一从根目录运行。日常入口使用 `npm run <name>`；完整子命令使用
`node tools/cli.mjs <group> [action] [options]`。

## 日常命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 构建所需内容并启动本地开发服务。 |
| `npm run assets` | 从登记的源文件完整重建运行时地图与美术资产。 |
| `npm run build` | 构建正式站点到 `dist/`。 |
| `npm run preview` | 不重新构建，静态预览现有 `dist/`。 |
| `npm run patch -- <options>` | 把语义地图 patch 到普通版 JAR；传入 `--hd` 时改用高清版，输出仅写入 `tmp/`。 |
| `npm test` | 完成内容前处理与增量编译，并自动运行全部非 smoke 测试。 |
| `npm run verify` | 运行测试、production build 和 smoke 在内的完整质量门禁。 |
| `npm run clean` | 清理仓库生成物、全部 package `dist/` 与 TypeScript 构建状态。 |

## Original

| 命令 | 用途 |
| --- | --- |
| `node tools/cli.mjs original extract` | 从只读官方 JAR 提取原始资源到生成目录。 |
| `node tools/cli.mjs original decode` | 将 DAT 解码到 `tmp/assets/bc5/decoded/`。 |
| `node tools/cli.mjs original adapt` | 将 decoded 数据转换为语义地图，并生成 Adventure Catalog。 |
| `node tools/cli.mjs original prepare` | 依次构建 Model、extract、decode 和 adapt。 |
| `node tools/cli.mjs original inspect [--all]` | 将待确认的 atlas/object 类型统计写入 `tmp/unknown-tiles.json`；`--all` 保留全部引用。 |
| `node tools/cli.mjs original patch [--in <dir>] [--out <tmp-dir>] [--hd]` | 构建 Model 后执行原版 JAR patch；默认使用 `original/official/` 普通版，`--hd` 使用 `original/official-hd/` 高清版且输出文件名以 `-hd.jar` 结尾。输入默认是 `custom-maps/original-patch/`，输出默认是 `tmp/original-patch/`，其中 `encoded/` 保存实际送入 DAT encoder 的中间地图。 |
| `node tools/cli.mjs original research [--output <dir>]` | 比较官方发布包内容，默认写入 `tmp/release-research/`。 |

## Schema 与资源

| 命令 | 用途 |
| --- | --- |
| `node tools/cli.mjs schema examples [entity-type]` | 构建 Model，并输出全部或指定 Entity 的 JSON 示例。 |
| `node tools/cli.mjs assets prepare` | 按任务检查输入、依赖与输出清单，只重建失效任务。 |
| `node tools/cli.mjs assets rebuild` | 完整重建生成资源；等价于 `npm run assets`。 |

## 开发、构建与验证

| 命令 | 用途 |
| --- | --- |
| `node tools/cli.mjs dev` | 准备开发资源，启动 Web 与 Editor，并按 Producer 分组监听资产输入。 |
| `node tools/cli.mjs build` | 构建 `dist/`。 |
| `node tools/cli.mjs preview` | 静态预览已有构建。 |
| `node tools/cli.mjs test [分类] [子目录]` | 按 `tests/` 目录过滤并运行非 smoke 测试。 |
| `node tools/cli.mjs verify` | 运行完整门禁。 |
| `node tools/cli.mjs verify browser` | 单独运行浏览器 smoke test。 |
| `node tools/cli.mjs clean` | 清理生成物。 |

阶段产物与任务缓存统一位于 `tmp/assets/`；最终生成目录为 `assets/maps/`、
`assets/adventure/`、`assets/art/hd/` 与 `assets/art/robo2/`。这些内容由对应命令重建，
不手工修改；
`original/official/` 与 `original/official-hd/` 中的原版 JAR 始终只读。

测试实现、辅助代码与夹具统一位于根 `tests/`，目录职责与过滤示例见
[`tests/README.md`](../tests/README.md)。
