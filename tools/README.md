# Tools CLI

仓库脚本统一从根目录运行。日常入口使用 `npm run <name>`；完整子命令使用
`node tools/cli.mjs <group> [action] [options]`。

## 日常命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 构建所需内容并启动本地开发服务。 |
| `npm run assets` | 从允许提交的源文件重建 `assets/generated/`。 |
| `npm run build` | 构建正式站点到 `dist/`。 |
| `npm run preview` | 不重新构建，静态预览现有 `dist/`。 |
| `npm run patch -- <options>` | 把语义地图 patch 到原版 JAR；输出仅写入 `tmp/`。 |
| `npm test` | 运行 Node 与 Web 测试。 |
| `npm run verify` | 运行提交前的完整质量门禁。 |
| `npm run clean` | 清理仓库定义的生成物。 |

## Original

| 命令 | 用途 |
| --- | --- |
| `node tools/cli.mjs original extract` | 从只读官方 JAR 提取原始资源到生成目录。 |
| `node tools/cli.mjs original decode` | 将 DAT 解码到 `original/decoded/`。 |
| `node tools/cli.mjs original adapt` | 将 decoded 数据转换为语义地图，并生成 Adventure Catalog。 |
| `node tools/cli.mjs original prepare` | 依次构建 Model、extract、decode 和 adapt。 |
| `node tools/cli.mjs original inspect [--all]` | 将待确认的 atlas/object 类型统计写入 `tmp/unknown-tiles.json`；`--all` 保留全部引用。 |
| `node tools/cli.mjs original usage ts-4-13 [--json]` | 反查某个 `ts.png` 单格在哪些原版地图、坐标和语义 Entity 中出现。 |
| `node tools/cli.mjs original usage --temporary [--json]` | 列出所有仍使用临时坐标身份的 Surface，并汇总原版地图引用。 |
| `node tools/cli.mjs original patch [--in <dir>] [--out <tmp-dir>]` | 构建 Model 后执行原版 JAR patch；输入默认是 `custom-maps/original-patch/`，输出默认是 `tmp/original-patch/`。 |
| `node tools/cli.mjs original research [--output <dir>]` | 比较官方发布包内容，默认写入 `tmp/release-research/`。 |

`usage` 接受 `ts-r-c`、`r-c` 或 `r,c`。例如：

```sh
node tools/cli.mjs original usage ts-4-13
node tools/cli.mjs original usage 15,10 --json
```

## Schema 与资源

| 命令 | 用途 |
| --- | --- |
| `node tools/cli.mjs schema examples [entity-type]` | 构建 Model，并输出全部或指定 Entity 的 JSON 示例。 |
| `node tools/cli.mjs assets prepare` | 只补齐缺失的生成资源。 |
| `node tools/cli.mjs assets rebuild` | 完整重建生成资源；等价于 `npm run assets`。 |

## 开发、构建与验证

| 命令 | 用途 |
| --- | --- |
| `node tools/cli.mjs dev [web\|editor] [--no-build]` | 启动 Web 或 Editor 开发模式；`--no-build` 跳过资源准备。 |
| `node tools/cli.mjs build` | 构建 `dist/`。 |
| `node tools/cli.mjs preview` | 静态预览已有构建。 |
| `node tools/cli.mjs test` | 运行测试。 |
| `node tools/cli.mjs verify` | 运行完整门禁。 |
| `node tools/cli.mjs verify browser` | 单独运行浏览器 smoke test。 |
| `node tools/cli.mjs clean` | 清理生成物。 |

生成目录包括 `assets/extracted/`、`assets/generated/`、`original/decoded/`、
`original/adapted/`、`dist/` 与 `tmp/`。这些内容由对应命令重建，不手工修改；
`original/official-hd/` 中的官方 JAR 始终只读。
