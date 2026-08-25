# 开发与构建

README 只负责项目概览。本地环境、开发、构建和部署相关命令统一维护在本文档。

## 环境

要求 Node.js 20+。

安装依赖：

```bash
npm install
```

## 本地开发

启动完整 Web：

```bash
npm run dev
```

默认地址：`http://localhost:5173`。

单独启动 Editor 开发入口：

```bash
npm run dev:editor
```

默认地址：`http://localhost:5175/edit`。

## Workspace

```text
model      纯 semantic LevelMap / IDs
dat        原版 DAT 互操作
engine     gameplay / runtime
adventure  Campaign / Save / Adventure runtime rule
editor     authoring + share boundary
web        product SPA
tools      assets / catalog / original JAR validation
```

TypeScript 使用 project references。依赖顺序由 `tsc -b` 与 package dependencies 表达，不在 `tsconfig` paths 中指向兄弟包的 `dist` 声明文件。

更完整的模块职责和依赖方向见 [`architecture.md`](architecture.md)。

## 构建

```bash
npm run build
```

正式构建只生成一个发布根：

```text
dist/
```

以下目录均为生成物，不提交 Git：

```text
node_modules/
dist/
model/dist/
dat/dist/
adventure/dist/
engine/dist/
editor/dist/
web/dist-src/
assets/extracted/
assets/generated/
tmp/
```

## 部署

`/explore/*`、`/adventure/*`、`/settings`、`/edit/*` 等均为 SPA 路由。部署服务器应仅对应用路由 fallback 到 `/index.html`；缺失的静态资源必须返回真正的 404，不能被 SPA fallback 吞掉。

## 机关与 Editor 调试

Engine 机关调试统一通过 Editor Play Test。可以打开：

```text
/edit/<collection>/<map-id>
```

也可以 Import `editor/examples/mechanics-smoke.json` 等测试地图。

新增或修改机制的完整流程见 [`workflows/add-mechanic.md`](workflows/add-mechanic.md)。

## 原版差分验证

需要确认 Bobby Carrot 5 原版行为时，可将语义地图 patch 回原版 JAR：

```bash
npm run original:patch -- \
  --map ./test.json \
  --target 40-10
```

工具会根据 Catalog provenance 找到目标关卡所属的原始 JAR、DAT 与 record slot，只替换目标 level record，并在输出后重新读取验证 LevelMap round-trip。

详细流程见 [`workflows/validate-original.md`](workflows/validate-original.md)。

## 完成前验证

```bash
npm run verify
```

完整验证内容见 [`verification.md`](verification.md)。任何任务在 verify 失败时都不能视为完成。
